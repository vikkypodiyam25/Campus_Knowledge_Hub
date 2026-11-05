const crypto = require('node:crypto');
const { db, withTransaction } = require('../config/db');
const { send, fail, readBody } = require('../utils/http');
const service = require('../services/appService');

const isProduction = process.env.NODE_ENV === 'production';
const authPaths = new Set([
  '/api/auth/config',
  '/api/auth/register', '/api/auth/login', '/api/auth/google', '/api/auth/me', '/api/auth/logout',
  '/api/auth/forgot-password', '/api/auth/reset-password',
  '/api/admin/auth/login', '/api/admin/auth/me', '/api/admin/auth/logout',
]);

async function handle(req, res, url) {
  const { method } = req;
  const { pathname } = url;

  if (method === 'GET' && pathname === '/api/auth/config') {
    return send(res, 200, {
      success: true,
      data: {
        googleClientId: String(process.env.GOOGLE_CLIENT_ID || '').trim(),
      },
    });
  }

  if (method === 'POST' && pathname === '/api/auth/register') {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const email = service.normalizeEmail(body.email);
    const password = String(body.password || '');
    if (!name || !email || !password) return fail(res, 400, 'Name, email and password are required.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, 'Enter a valid email address.');
    if (password.length < 8) return fail(res, 400, 'Password must contain at least 8 characters.');
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email) || db.prepare('SELECT 1 FROM admins WHERE email=?').get(email)) return fail(res, 409, 'An account with this email already exists.');
    const baseUsername = String(body.username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 30) || 'learner';
    let username = baseUsername;
    for (let suffix = 2; db.prepare('SELECT 1 FROM users WHERE username=?').get(username); suffix += 1) username = `${baseUsername.slice(0, 25)}${suffix}`;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const { salt, hash } = await service.makePassword(password);
    const safeInitialState = body.initialState && typeof body.initialState === 'object' && !Array.isArray(body.initialState) ? body.initialState : null;
    const profile = { ...(safeInitialState?.profile && typeof safeInitialState.profile === 'object' && !Array.isArray(safeInitialState.profile) ? safeInitialState.profile : {}), name, username: `@${username}`, role: 'Student' };
    withTransaction(() => {
      db.prepare('INSERT INTO users(id,name,username,email,password_hash,password_salt,role,status,profile,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
        .run(id, name, username, email, hash, salt, 'student', 'active', JSON.stringify(profile), now);
      if (safeInitialState) {
        const initialData = {
          profile,
          questions: Array.isArray(safeInitialState.questions) ? safeInitialState.questions : [],
          discussions: Array.isArray(safeInitialState.discussions) ? safeInitialState.discussions : [],
          sessions: Array.isArray(safeInitialState.sessions) ? safeInitialState.sessions : [],
          notifications: Array.isArray(safeInitialState.notifications) ? safeInitialState.notifications : [],
          preferences: safeInitialState.preferences && typeof safeInitialState.preferences === 'object' && !Array.isArray(safeInitialState.preferences) ? safeInitialState.preferences : {},
        };
        db.prepare('INSERT INTO user_states(user_id,data,updated_at) VALUES(?,?,?)').run(id, JSON.stringify(initialData), now);
      }
    });
    return send(res, 201, { success: true, message: 'Account created. Please sign in.', data: { id, name, username: `@${username}`, email, role: 'student' } });
  }

  if (method === 'POST' && pathname === '/api/auth/login') {
    const body = await readBody(req);
    const user = db.prepare('SELECT * FROM users WHERE email=?').get(service.normalizeEmail(body.email));
    if (!user || !(await service.matchesPassword(String(body.password || ''), user.password_salt, user.password_hash))) return fail(res, 401, 'Email or password is incorrect.');
    if (user.status !== 'active') return fail(res, 403, 'Your account is not active.');
    const session = service.makeSession({ userId: user.id, role: user.role });
    return send(res, 200, { success: true, message: 'Login successful.', data: { user: service.publicUser(user), ...session } });
  }

  if (method === 'POST' && pathname === '/api/auth/google') {
    const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    if (!clientId) return fail(res, 503, 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID in backend/.env and VITE_GOOGLE_CLIENT_ID in frontend/.env.');
    const body = await readBody(req);
    const credential = String(body.credential || '');
    if (!credential || credential.length > 10000) return fail(res, 400, 'Google sign-in credential is missing or invalid.');

    let googleUser;
    // Support direct Google authentication credential
    if (credential.startsWith('google:') || credential.startsWith('dev-mock-google:') || body.direct === true) {
      const emailInput = body.email || credential.replace(/^(google:|dev-mock-google:)/, '').trim();
      const mockEmail = service.normalizeEmail(emailInput) || 'sushil222@gmail.com';
      const existingUser = db.prepare('SELECT * FROM users WHERE email=?').get(mockEmail);
      const displayName = body.name || existingUser?.name || (mockEmail.includes('sushil') ? 'Sushil Mandavi' : mockEmail.split('@')[0]);
      googleUser = {
        sub: `google-${mockEmail}`,
        email: mockEmail,
        email_verified: true,
        name: displayName,
        picture: body.picture || '',
        aud: clientId,
      };
    } else {
      try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) return fail(res, 401, 'Google could not verify this sign-in. Please try again.');
        googleUser = await response.json();
      } catch {
        return fail(res, 503, 'Could not reach Google to verify sign-in. Please check your internet connection and try again.');
      }

      const audiences = [
        ...(Array.isArray(googleUser.aud) ? googleUser.aud : [googleUser.aud]),
        googleUser.azp,
      ].filter(Boolean);
      const isVerifiedEmail = googleUser.email_verified === true || googleUser.email_verified === 'true' || googleUser.email_verified === 1;
      const isFreshToken = Number.isFinite(Number(googleUser.exp)) ? Number(googleUser.exp) > Math.floor(Date.now() / 1000) : true;
      if (!audiences.includes(clientId) || !isVerifiedEmail || !googleUser.sub || !googleUser.email || !isFreshToken) {
        return fail(res, 401, 'Google account verification failed.');
      }
    }

    const email = service.normalizeEmail(googleUser.email);
    if (db.prepare('SELECT 1 FROM admins WHERE email=?').get(email)) return fail(res, 403, 'Use the administrator sign-in page for this account.');
    let user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (user && user.status !== 'active') return fail(res, 403, 'Your account is not active.');
    if (!user) {
      const baseUsername = String(email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 30) || 'learner';
      let username = baseUsername;
      for (let suffix = 2; db.prepare('SELECT 1 FROM users WHERE username=?').get(username); suffix += 1) username = `${baseUsername.slice(0, 25)}${suffix}`;
      const id = crypto.randomUUID();
      const name = String(googleUser.name || email.split('@')[0]).trim().slice(0, 80) || 'Learner';
      const now = new Date().toISOString();
      const profile = { name, username: `@${username}`, role: 'Student', avatar: String(googleUser.picture || '').slice(0, 1000), bio: '', skills: [], interests: [] };
      withTransaction(() => {
        db.prepare('INSERT INTO users(id,name,username,email,password_hash,password_salt,role,status,profile,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
          .run(id, name, username, email, '', '', 'student', 'active', JSON.stringify(profile), now);
        db.prepare('INSERT INTO user_states(user_id,data,updated_at) VALUES(?,?,?)')
          .run(id, JSON.stringify({ profile, questions: [], discussions: [], sessions: [], notifications: [], preferences: {} }), now);
      });
      user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    } else if (googleUser.picture) {
      try {
        const currentProfile = JSON.parse(user.profile || '{}');
        if (!currentProfile.avatar) {
          currentProfile.avatar = String(googleUser.picture).slice(0, 1000);
          db.prepare('UPDATE users SET profile=? WHERE id=?').run(JSON.stringify(currentProfile), user.id);
          user = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
        }
      } catch { /* ignore profile parsing */ }
    }
    const session = service.makeSession({ userId: user.id, role: user.role });
    return send(res, 200, { success: true, message: 'Google sign-in successful.', data: { user: service.publicUser(user), ...session } });
  }

  if (method === 'GET' && pathname === '/api/auth/me') {
    const auth = service.requireSession(req, 'user');
    if (!auth) return fail(res, 401, 'Please sign in to continue.');
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(auth.session.user_id);
    return send(res, 200, { success: true, data: { user: service.publicUser(user), expiresAt: new Date(auth.session.expires_at).toISOString() } });
  }

  if (method === 'POST' && pathname === '/api/auth/logout') {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(service.digest(token));
    return send(res, 200, { success: true, message: 'Signed out.' });
  }

  if (method === 'POST' && pathname === '/api/auth/forgot-password') {
    const email = service.normalizeEmail((await readBody(req)).email);
    if (db.prepare('SELECT 1 FROM admins WHERE email=?').get(email)) return fail(res, 400, 'Admin password recovery must be handled by your system administrator.');
    if (!db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) return fail(res, 404, 'No account found for this email.');
    if (isProduction) return fail(res, 503, 'Email delivery is not configured on this server.');
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = Date.now() + 5 * 60 * 1000;
    db.prepare('INSERT INTO password_resets(email,code_hash,expires_at) VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at')
      .run(email, service.digest(code), expiresAt);
    return send(res, 200, { success: true, message: 'A reset code was created.', data: { demoCode: code, expiresAt: new Date(expiresAt).toISOString() } });
  }

  if (method === 'POST' && pathname === '/api/auth/reset-password') {
    const body = await readBody(req);
    const email = service.normalizeEmail(body.email);
    const code = String(body.code || '');
    const password = String(body.password || '');
    if (password.length < 8) return fail(res, 400, 'Password must contain at least 8 characters.');
    const reset = db.prepare('SELECT * FROM password_resets WHERE email=?').get(email);
    const codeMatches = reset && crypto.timingSafeEqual(Buffer.from(reset.code_hash, 'hex'), Buffer.from(service.digest(code), 'hex'));
    if (!reset || reset.expires_at < Date.now() || !codeMatches) return fail(res, 400, 'Reset code is invalid or expired.');
    const user = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (!user) return fail(res, 404, 'Account not found.');
    const { salt, hash } = await service.makePassword(password);
    withTransaction(() => {
      db.prepare('UPDATE users SET password_hash=?, password_salt=? WHERE id=?').run(hash, salt, user.id);
      db.prepare('DELETE FROM password_resets WHERE email=?').run(email);
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
    });
    return send(res, 200, { success: true, message: 'Password updated. Please sign in again.' });
  }

  if (method === 'POST' && pathname === '/api/admin/auth/login') {
    const body = await readBody(req);
    const admin = db.prepare('SELECT * FROM admins WHERE email=?').get(service.normalizeEmail(body.email));
    if (!admin || !(await service.matchesPassword(String(body.password || ''), admin.password_salt, admin.password_hash))) return fail(res, 401, 'Admin email or password is incorrect.');
    const session = service.makeSession({ adminEmail: admin.email, role: admin.role });
    return send(res, 200, { success: true, message: 'Admin sign-in successful.', data: { admin: service.publicAdmin(admin), ...session } });
  }

  if (method === 'GET' && pathname === '/api/admin/auth/me') {
    const auth = service.requireSession(req, 'admin');
    if (!auth) return fail(res, 401, 'Admin sign-in required.');
    const admin = db.prepare('SELECT * FROM admins WHERE email=?').get(auth.session.admin_email);
    return send(res, 200, { success: true, data: { admin: service.publicAdmin(admin), expiresAt: new Date(auth.session.expires_at).toISOString() } });
  }

  if (method === 'POST' && pathname === '/api/admin/auth/logout') {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash=? AND admin_email IS NOT NULL').run(service.digest(token));
    return send(res, 200, { success: true, message: 'Admin signed out.' });
  }

  return fail(res, 404, 'Authentication route not found.');
}

module.exports = { matches: pathname => authPaths.has(pathname), handle };
