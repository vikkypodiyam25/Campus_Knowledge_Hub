const crypto = require('node:crypto');
const { OAuth2Client } = require('google-auth-library');
const { User, Admin, Session, UserState, PasswordReset } = require('../config/db');
const { send, fail, readBody } = require('../utils/http');
const service = require('../services/appService');
const googleClient = new OAuth2Client();

function isUniqueConstraint(error) {
  return error?.code === 11000 || error?.code === 'SQLITE_CONSTRAINT_UNIQUE' || /UNIQUE constraint failed/i.test(error?.message || '');
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

  const adminByGoogleId = await Admin.findOne({ google_id: googleId }).lean();
  const adminByEmail = await Admin.findOne({ email }).lean();
  if (adminByGoogleId && adminByEmail && adminByGoogleId.email !== adminByEmail.email) return fail(res, 409, 'This Google account and email are linked to different administrator accounts.');
  const admin = adminByGoogleId || adminByEmail;
  if (admin) {
    if (requiredRole === 'student' && admin.email !== email && admin.google_id !== googleId) return fail(res, 403, 'This Google account is not linked to an administrator.');
    if (admin.google_id && admin.google_id !== googleId) return fail(res, 409, 'This administrator email is linked to a different Google account.');
    try { await Admin.updateOne({ email: admin.email }, { $set: { google_id: googleId, ...(picture ? { profile_picture: picture } : {}) } }); }
    catch { return fail(res, 409, 'This Google account is already linked to another account.'); }
    const linkedAdmin = await Admin.findOne({ email: admin.email }).lean();
    const session = await service.makeSession({ adminEmail: admin.email, role: admin.role });
    return send(res, 200, { success: true, message: 'Google administrator sign-in successful.', data: { admin: service.publicAdmin(linkedAdmin), role: 'admin', ...session } });
  }
  if (requiredRole === 'admin') return fail(res, 403, 'This Google account does not have an administrator account.');

  const userByGoogleId = await User.findOne({ google_id: googleId }).lean();
  const userByEmail = await User.findOne({ email }).lean();
  if (userByGoogleId && userByEmail && userByGoogleId.id !== userByEmail.id) return fail(res, 409, 'This Google account and email are linked to different user accounts.');
  let user = userByGoogleId || userByEmail;
  if (user?.google_id && user.google_id !== googleId) return fail(res, 409, 'This email is linked to a different Google account.');

  if (!user) {
    const baseUsername = String(email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 30) || 'learner';
    let username = baseUsername;
    for (let suffix = 2; await User.exists({ username }); suffix += 1) username = `${baseUsername.slice(0, 25)}${suffix}`;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const name = String(googleUser.name || email.split('@')[0]).trim().slice(0, 80) || 'Learner';
    const profile = { name, username: `@${username}`, role: 'Student', avatar: picture, bio: '', skills: [], interests: [] };
    try {
      user = await User.create({ id, name, username, email, password_hash: '', password_salt: '', role: 'student', status: 'active', google_id: googleId, profile, created_at: now });
      await UserState.create({ user_id: id, data: { profile, questions: [], discussions: [], sessions: [], notifications: [], preferences: {} }, updated_at: now });
      user = user.toObject();
    } catch (error) {
      if (isUniqueConstraint(error)) return fail(res, 409, 'This Google account is already linked to another account.');
      throw error;
    }
  } else {
    let profile = user.profile || {};
    profile = { ...profile, name: user.name || googleUser.name || 'Learner', avatar: picture || profile.avatar || '' };
    try {
      await User.updateOne({ id: user.id }, { $set: { google_id: googleId, profile } });
      user = await User.findOne({ id: user.id }).lean();
    } catch (error) {
      if (isUniqueConstraint(error)) return fail(res, 409, 'This Google account is already linked to another account.');
      throw error;
    }
  }

  if (user.status !== 'active') return fail(res, 403, 'Your account is not active.');
  const session = await service.makeSession({ userId: user.id, role: user.role || 'student' });
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
    if (await User.exists({ email }) || await Admin.exists({ email })) return fail(res, 409, 'An account with this email already exists.');
    const baseUsername = String(body.username || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 30) || 'learner';
    let username = baseUsername;
    for (let suffix = 2; await User.exists({ username }); suffix += 1) username = `${baseUsername.slice(0, 25)}${suffix}`;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const { salt, hash } = await service.makePassword(password);
    const safeInitialState = body.initialState && typeof body.initialState === 'object' && !Array.isArray(body.initialState) ? body.initialState : null;
    const profile = { ...(safeInitialState?.profile && typeof safeInitialState.profile === 'object' && !Array.isArray(safeInitialState.profile) ? safeInitialState.profile : {}), name, username: `@${username}`, role: 'Student' };
    try {
      await User.create({ id, name, username, email, password_hash: hash, password_salt: salt, role: 'student', status: 'active', profile, created_at: now });
      if (safeInitialState) {
        const initialData = {
          profile,
          questions: Array.isArray(safeInitialState.questions) ? safeInitialState.questions : [],
          discussions: Array.isArray(safeInitialState.discussions) ? safeInitialState.discussions : [],
          sessions: Array.isArray(safeInitialState.sessions) ? safeInitialState.sessions : [],
          notifications: Array.isArray(safeInitialState.notifications) ? safeInitialState.notifications : [],
          preferences: safeInitialState.preferences && typeof safeInitialState.preferences === 'object' && !Array.isArray(safeInitialState.preferences) ? safeInitialState.preferences : {},
        };
        await UserState.create({ user_id: id, data: initialData, updated_at: now });
      }
    } catch (error) { if (isUniqueConstraint(error)) return fail(res, 409, 'An account with this email or username already exists.'); throw error; }
    return send(res, 201, { success: true, message: 'Account created. Please sign in.', data: { id, name, username: `@${username}`, email, role: 'student' } });
  }

  if (method === 'POST' && pathname === '/api/auth/login') {
    const body = await readBody(req);
    const user = await User.findOne({ email: service.normalizeEmail(body.email) }).lean();
    if (!user || !(await service.matchesPassword(String(body.password || ''), user.password_salt, user.password_hash))) return fail(res, 401, 'Email or password is incorrect.');
    if (user.status !== 'active') return fail(res, 403, 'Your account is not active.');
    const session = await service.makeSession({ userId: user.id, role: user.role });
    return send(res, 200, { success: true, message: 'Login successful.', data: { user: service.publicUser(user), ...session } });
  }

  if (method === 'POST' && pathname === '/api/auth/google') {
    return googleLogin(req, res, 'student');
  }

  if (method === 'POST' && pathname === '/api/admin/auth/google') {
    return googleLogin(req, res, 'admin');
  }

  if (method === 'GET' && pathname === '/api/auth/me') {
    const auth = await service.requireSession(req, 'user');
    if (!auth) return fail(res, 401, 'Please sign in to continue.');
    const user = await User.findOne({ id: auth.session.user_id }).lean();
    return send(res, 200, { success: true, data: { user: service.publicUser(user), expiresAt: new Date(auth.session.expires_at).toISOString() } });
  }

  if (method === 'POST' && pathname === '/api/auth/logout') {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (token) await Session.deleteOne({ token_hash: service.digest(token) });
    return send(res, 200, { success: true, message: 'Signed out.' });
  }

  if (method === 'POST' && pathname === '/api/auth/forgot-password') {
    const email = service.normalizeEmail((await readBody(req)).email);
    if (await Admin.exists({ email })) return fail(res, 400, 'Admin password recovery must be handled by your system administrator.');
    if (!await User.exists({ email })) return fail(res, 404, 'No account found for this email.');
    if (isProduction) return fail(res, 503, 'Email delivery is not configured on this server.');
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = Date.now() + 5 * 60 * 1000;
    await PasswordReset.findOneAndUpdate({ email }, { $set: { code_hash: service.digest(code), expires_at: expiresAt } }, { upsert: true });
    return send(res, 200, { success: true, message: 'A reset code was created.', data: { demoCode: code, expiresAt: new Date(expiresAt).toISOString() } });
  }

  if (method === 'POST' && pathname === '/api/auth/reset-password') {
    const body = await readBody(req);
    const email = service.normalizeEmail(body.email);
    const code = String(body.code || '');
    const password = String(body.password || '');
    if (password.length < 8) return fail(res, 400, 'Password must contain at least 8 characters.');
    const reset = await PasswordReset.findOne({ email }).lean();
    const codeMatches = reset && crypto.timingSafeEqual(Buffer.from(reset.code_hash, 'hex'), Buffer.from(service.digest(code), 'hex'));
    if (!reset || reset.expires_at < Date.now() || !codeMatches) return fail(res, 400, 'Reset code is invalid or expired.');
    const user = await User.findOne({ email }).select({ id: 1 }).lean();
    if (!user) return fail(res, 404, 'Account not found.');
    const { salt, hash } = await service.makePassword(password);
    await Promise.all([User.updateOne({ id: user.id }, { $set: { password_hash: hash, password_salt: salt } }), PasswordReset.deleteOne({ email }), Session.deleteMany({ user_id: user.id })]);
    return send(res, 200, { success: true, message: 'Password updated. Please sign in again.' });
  }

  if (method === 'POST' && pathname === '/api/admin/auth/login') {
    const body = await readBody(req);
    const admin = await Admin.findOne({ email: service.normalizeEmail(body.email) }).lean();
    if (!admin || !(await service.matchesPassword(String(body.password || ''), admin.password_salt, admin.password_hash))) return fail(res, 401, 'Admin email or password is incorrect.');
    const session = await service.makeSession({ adminEmail: admin.email, role: admin.role });
    return send(res, 200, { success: true, message: 'Admin sign-in successful.', data: { admin: service.publicAdmin(admin), ...session } });
  }

  if (method === 'GET' && pathname === '/api/admin/auth/me') {
    const auth = await service.requireSession(req, 'admin');
    if (!auth) return fail(res, 401, 'Admin sign-in required.');
    const admin = await Admin.findOne({ email: auth.session.admin_email }).lean();
    return send(res, 200, { success: true, data: { admin: service.publicAdmin(admin), expiresAt: new Date(auth.session.expires_at).toISOString() } });
  }

  if (method === 'POST' && pathname === '/api/admin/auth/logout') {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/, '');
    if (token) await Session.deleteOne({ token_hash: service.digest(token), admin_email: { $ne: null } });
    return send(res, 200, { success: true, message: 'Admin signed out.' });
  }

  return fail(res, 404, 'Authentication route not found.');
}

module.exports = { matches: pathname => authPaths.has(pathname), handle };
