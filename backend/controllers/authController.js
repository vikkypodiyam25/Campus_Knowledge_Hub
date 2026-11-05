const crypto = require('node:crypto');
const { OAuth2Client } = require('google-auth-library');
const { db, withTransaction } = require('../config/db');
const { send, fail, readBody } = require('../utils/http');
const service = require('../services/appService');
const googleClient = new OAuth2Client();

function isUniqueConstraint(error) {
  return error?.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint failed/i.test(error?.message || '');
}

const isProduction = process.env.NODE_ENV === 'production';
const authPaths = new Set([
  '/api/auth/config',
  '/api/auth/register', '/api/auth/login', '/api/auth/google', '/api/auth/me', '/api/auth/logout',
  '/api/auth/forgot-password', '/api/auth/reset-password',
  '/api/admin/auth/login', '/api/admin/auth/google', '/api/admin/auth/me', '/api/admin/auth/logout',
]);

async function googleLogin(req, res, requiredRole = 'student') {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) return fail(res, 503, 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID to backend/.env.');

  const { credential } = await readBody(req);
  const idToken = String(credential || '').trim();
  if (!idToken || idToken.length > 12000) return fail(res, 400, 'Google ID token is missing or invalid.');

  let googleUser;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: clientId });
    googleUser = ticket.getPayload();
  } catch {
    return fail(res, 401, 'Google could not verify this sign-in. Please try again.');
  }
  if (!googleUser?.sub || !googleUser.email || googleUser.email_verified !== true) {
    return fail(res, 401, 'A verified Google email is required to sign in.');
  }

  const email = service.normalizeEmail(googleUser.email);
  const googleId = String(googleUser.sub);
  const picture = String(googleUser.picture || '').slice(0, 1000);

  const adminByGoogleId = db.prepare('SELECT * FROM admins WHERE google_id=?').get(googleId);
  const adminByEmail = db.prepare('SELECT * FROM admins WHERE email=?').get(email);
  if (adminByGoogleId && adminByEmail && adminByGoogleId.email !== adminByEmail.email) return fail(res, 409, 'This Google account and email are linked to different administrator accounts.');
  const admin = adminByGoogleId || adminByEmail;
  if (admin) {
    if (requiredRole === 'student' && admin.email !== email && admin.google_id !== googleId) return fail(res, 403, 'This Google account is not linked to an administrator.');
    if (admin.google_id && admin.google_id !== googleId) return fail(res, 409, 'This administrator email is linked to a different Google account.');
    try { db.prepare("UPDATE admins SET google_id=?,profile_picture=CASE WHEN ?='' THEN profile_picture ELSE ? END WHERE email=?").run(googleId, picture, picture, admin.email); }
    catch { return fail(res, 409, 'This Google account is already linked to another account.'); }
    const linkedAdmin = db.prepare('SELECT * FROM admins WHERE email=?').get(admin.email);
    const session = service.makeSession({ adminEmail: admin.email, role: admin.role });
    return send(res, 200, { success: true, message: 'Google administrator sign-in successful.', data: { admin: service.publicAdmin(linkedAdmin), role: 'admin', ...session } });
  }
  if (requiredRole === 'admin') return fail(res, 403, 'This Google account does not have an administrator account.');

  const userByGoogleId = db.prepare('SELECT * FROM users WHERE google_id=?').get(googleId);
  const userByEmail = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (userByGoogleId && userByEmail && userByGoogleId.id !== userByEmail.id) return fail(res, 409, 'This Google account and email are linked to different user accounts.');
  let user = userByGoogleId || userByEmail;
  if (user?.google_id && user.google_id !== googleId) return fail(res, 409, 'This email is linked to a different Google account.');

  if (!user) {
    const baseUsername = String(email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 30) || 'learner';
    let username = baseUsername;
    for (let suffix = 2; db.prepare('SELECT 1 FROM users WHERE username=?').get(username); suffix += 1) username = `${baseUsername.slice(0, 25)}${suffix}`;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const name = String(googleUser.name || email.split('@')[0]).trim().slice(0, 80) || 'Learner';
    const profile = { name, username: `@${username}`, role: 'Student', avatar: picture, bio: '', skills: [], interests: [] };
    try {
      withTransaction(() => {
        db.prepare('INSERT INTO users(id,name,username,email,password_hash,password_salt,role,status,google_id,profile,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
          .run(id, name, username, email, '', '', 'student', 'active', googleId, JSON.stringify(profile), now);
        db.prepare('INSERT INTO user_states(user_id,data,updated_at) VALUES(?,?,?)')
          .run(id, JSON.stringify({ profile, questions: [], discussions: [], sessions: [], notifications: [], preferences: {} }), now);
      });
      user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    } catch (error) {
      if (isUniqueConstraint(error)) return fail(res, 409, 'This Google account is already linked to another account.');
      throw error;
    }
  } else {
    let profile = {};
    try { profile = JSON.parse(user.profile || '{}'); } catch { /* Replace malformed profile with safe Google details. */ }
    profile = { ...profile, name: user.name || googleUser.name || 'Learner', avatar: picture || profile.avatar || '' };
    try {
      db.prepare('UPDATE users SET google_id=?,profile=? WHERE id=?').run(googleId, JSON.stringify(profile), user.id);
      user = db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
    } catch (error) {
      if (isUniqueConstraint(error)) return fail(res, 409, 'This Google account is already linked to another account.');
      throw error;
    }
  }

  if (user.status !== 'active') return fail(res, 403, 'Your account is not active.');
  const session = service.makeSession({ userId: user.id, role: user.role || 'student' });
  return send(res, 200, { success: true, message: 'Google sign-in successful.', data: { user: service.publicUser(user), role: 'student', ...session } });
}

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
    return googleLogin(req, res, 'student');
  }

  if (method === 'POST' && pathname === '/api/admin/auth/google') {
    return googleLogin(req, res, 'admin');
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
