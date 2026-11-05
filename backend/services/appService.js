const crypto = require('node:crypto');
const { promisify } = require('node:util');
const { db, withTransaction } = require('../config/db');

const scrypt = promisify(crypto.scrypt);


function normalizeEmail(email) { return String(email || '').trim().toLowerCase(); }
function digest(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

async function makePassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return { salt, hash: Buffer.from(hash).toString('hex') };
}

async function matchesPassword(password, salt, expectedHash) {
  const actual = Buffer.from(await scrypt(password, salt, 64)).toString('hex');
  const actualBytes = Buffer.from(actual, 'hex');
  const expectedBytes = Buffer.from(expectedHash, 'hex');
  return actualBytes.length === expectedBytes.length && crypto.timingSafeEqual(actualBytes, expectedBytes);
}

function publicUser(user) {
  return { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, status: user.status, profile: JSON.parse(user.profile || '{}'), createdAt: user.created_at };
}

function publicAdmin(admin) {
  return { id: admin.email, name: admin.name, email: admin.email, role: admin.role, title: `${admin.role} Â· LearnConnect`, platform: 'LearnConnect' };
}

function makeSession({ userId = null, adminEmail = null, role }) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  db.prepare('INSERT INTO sessions(token_hash,user_id,admin_email,role,expires_at) VALUES(?,?,?,?,?)')
    .run(digest(token), userId, adminEmail, role, expiresAt);
  return { token, expiresAt: new Date(expiresAt).toISOString() };
}

function requireSession(req, expectedRole) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;
  const session = db.prepare(`SELECT s.*, u.name AS user_name, u.username AS user_username, u.email AS user_email, u.status AS user_status, u.profile AS user_profile, u.created_at AS user_created_at, a.name AS admin_name FROM sessions s LEFT JOIN users u ON u.id=s.user_id LEFT JOIN admins a ON a.email=s.admin_email WHERE s.token_hash=?`).get(digest(token));
  if (!session || session.expires_at < Date.now()) {
    if (session) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);
    return null;
  }
  if (expectedRole === 'user' && (!session.user_id || session.user_status !== 'active')) return null;
  if (expectedRole === 'admin' && (!session.admin_email || !session.admin_name)) return null;
  return { token, session };
}

function ensureDevelopmentAdmins() {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) throw new Error('Set ADMIN_PASSWORD in backend/.env before starting the server.');
  if (configuredPassword.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
  const admins = [{ email: normalizeEmail(process.env.ADMIN_EMAIL), name: process.env.ADMIN_NAME || 'LearnConnect Admin', role: 'Super Admin' }];
  if (!admins[0].email) throw new Error('Set ADMIN_EMAIL in backend/.env before starting the server.');
  const insert = db.prepare('INSERT INTO admins(email,name,role,password_hash,password_salt) VALUES(?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name, role=excluded.role, password_hash=excluded.password_hash, password_salt=excluded.password_salt');
  return Promise.all(admins.map(async admin => {
    const { salt, hash } = await makePassword(configuredPassword);
    insert.run(normalizeEmail(admin.email), admin.name, admin.role, hash, salt);
  }));
}

function adminStorageObject() {
  const result = {};
  for (const row of db.prepare('SELECT key,value FROM admin_storage').all()) {
    try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = null; }
  }
  return result;
}

function storeAdminItem(key, value) {
  db.prepare('INSERT INTO admin_storage(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at')
    .run(key, JSON.stringify(value), new Date().toISOString());
}

const adminKeys = new Set(['learnconnect_categories_data']);

function syncUserContentToAdminStorage(userId, data) {
  const user = db.prepare('SELECT id,name,email,profile FROM users WHERE id=?').get(userId);
  if (!user || !data) return;
  let profile = {};
  try { profile = JSON.parse(user.profile || '{}'); } catch { /* Use safe defaults. */ }
  const author = { id: user.id, name: user.name, email: user.email, avatar: profile.avatar || '' };
  const now = new Date().toISOString();
  const maps = [
    ['questions', 'learnconnect_questions_data', row => ({
      id: `u_${userId}_q_${row.id}`, title: row.title, category: row.category || 'General', author,
      status: row.answers?.length ? 'Answered' : 'Unanswered', upvotes: Number(row.votes || 0), views: 0,
      answersCount: row.answers?.length || 0, createdAt: row.createdAt || now, content: row.description || '', tags: row.tags || [],
      answers: (row.answers || []).map((answer, index) => ({ id: `a_${row.id}_${index}`, author: { name: answer.author || 'Student' }, content: answer.text || answer.content || '', upvotes: 0, createdAt: now, isAccepted: false })),
    })],
    ['discussions', 'learnconnect_discussions_data', row => ({
      id: `u_${userId}_disc_${row.id}`, title: row.title, category: row.category || 'Community', author,
      likes: Number(row.likes || 0), commentsCount: row.comments?.length || 0, isPinned: false, isHidden: false,
      createdAt: row.createdAt || now, content: row.description || '', tags: row.tags || [],
      comments: (row.comments || []).map((comment, index) => ({ id: `c_${row.id}_${index}`, author: { name: comment.author || 'Student' }, content: comment.text || comment.content || '', createdAt: now })),
    })],
    ['sessions', 'learnconnect_sessions_data', row => ({
      id: `u_${userId}_sess_${row.id}`, title: row.title, host: { name: row.host || user.name, role: 'Student', avatar: profile.avatar || '', email: user.email },
      category: row.category || 'General', status: String(row.status || 'Upcoming').toUpperCase(), scheduledDate: row.scheduledDate || row.date || now,
      duration: `${row.duration || 60} mins`, participantsCount: row.participants || 1, maxCapacity: 100, meetingLink: row.link || '',
      description: row.description || '', participants: [],
    })],
  ];
  for (const [stateKey, storageKey, convert] of maps) {
    const values = Array.isArray(data[stateKey]) ? data[stateKey] : [];
    const existing = adminStorageObject()[storageKey];
    const rows = Array.isArray(existing) ? existing : [];
    const knownIds = new Set(rows.map(row => String(row.id)));
    let changed = false;
    for (const row of values) {
      if (!row?.id || !row.title || row.source === 'admin') continue;
      const adminRow = convert(row);
      const existingIndex = rows.findIndex(item => String(item.id) === String(adminRow.id));
      if (existingIndex < 0) {
        rows.unshift(adminRow);
        knownIds.add(String(adminRow.id));
        changed = true;
      } else if (JSON.stringify(rows[existingIndex]) !== JSON.stringify(adminRow)) {
        rows[existingIndex] = adminRow;
        changed = true;
      }
    }
    if (changed || !Array.isArray(existing)) storeAdminItem(storageKey, rows);
  }
}

const userStateKeys = new Set(['profile', 'questions', 'discussions', 'sessions', 'notifications', 'preferences']);

function readUserState(userId) {
  const row = db.prepare('SELECT data FROM user_states WHERE user_id=?').get(userId);
  return row ? JSON.parse(row.data) : { profile: {}, questions: [], discussions: [], sessions: [], notifications: [], preferences: {} };
}

function getUserDashboardState(userId) {
  const state = readUserState(userId);
  const admin = adminStorageObject();
  const categories = (Array.isArray(admin.learnconnect_categories_data) ? admin.learnconnect_categories_data : [])
    .filter(category => category && category.active !== false && category.name)
    .map(category => category.name);
  const merge = (key, rows, visible, convert) => {
    const previous = new Map((state[key] || []).filter(item => item?.source === 'admin').map(item => [String(item.adminItemId), item]));
    const adminRows = (Array.isArray(rows) ? rows : []).filter(visible).map(row => {
      const old = previous.get(String(row.id)) || {};
      const current = convert(row);
      const merged = {
        ...current,
        id: `admin_${key}_${row.id}`,
        adminItemId: String(row.id),
        source: 'admin',
        saved: Boolean(old.saved),
        userVotes: Number(old.userVotes || 0),
        userLikes: Number(old.userLikes || 0),
      };
      if (key === 'questions') {
        merged.votes = current.votes + merged.userVotes;
        const ids = new Set(current.answers.map(answer => String(answer.id)));
        merged.answers = [...current.answers, ...(old.answers || []).filter(answer => !ids.has(String(answer.id)))];
      }
      if (key === 'discussions') {
        merged.likes = current.likes + merged.userLikes;
        const ids = new Set(current.comments.map(comment => String(comment.id)));
        merged.comments = [...current.comments, ...(old.comments || []).filter(comment => !ids.has(String(comment.id)))];
      }
      if (key === 'sessions') merged.registered = Boolean(old.registered);
      return merged;
    });
    const ids = new Set(adminRows.map(item => String(item.adminItemId)));
    state[key] = [...adminRows, ...(state[key] || []).filter(item => item?.source !== 'admin' && !ids.has(String(item.id)))];
  };
  const person = author => {
    const name = typeof author === 'string' ? author : author?.name || 'LearnConnect Admin';
    return { name, initials: name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'LC' };
  };
  merge('questions', admin.learnconnect_questions_data,
    row => String(row.status || '').toLowerCase() !== 'removed',
    row => {
      const user = person(row.author);
      return { title: row.title || 'Untitled question', description: row.content || row.description || '', category: row.category || 'General', author: user.name, initials: user.initials, time: 'From admin', votes: Number(row.upvotes || row.votes || 0), answers: (row.answers || []).map(answer => ({ id: answer.id, author: typeof answer.author === 'string' ? answer.author : answer.author?.name || 'Community', text: answer.content || answer.text || '' })), tags: Array.isArray(row.tags) ? row.tags : [], saved: false };
    });
  merge('discussions', admin.learnconnect_discussions_data,
    row => row.isHidden !== true && String(row.status || '').toLowerCase() !== 'hidden',
    row => {
      const user = person(row.author);
      return { title: row.title || 'Untitled discussion', description: row.content || row.description || '', category: row.category || 'Community', author: user.name, initials: user.initials, time: 'From admin', likes: Number(row.likes || 0), comments: (row.comments || []).map(comment => ({ id: comment.id, author: typeof comment.author === 'string' ? comment.author : comment.author?.name || 'Community', text: comment.content || comment.text || '' })), tags: Array.isArray(row.tags) ? row.tags : [], saved: false };
    });
  merge('sessions', admin.learnconnect_sessions_data,
    row => !['cancelled', 'canceled', 'removed'].includes(String(row.status || '').toLowerCase()),
    row => {
      const host = person(row.host);
      const start = new Date(row.scheduledDate || row.date || Date.now());
      const validDate = !Number.isNaN(start.getTime());
      return { title: row.title || 'Untitled session', description: row.description || '', category: row.category || 'General', host: host.name, initials: host.initials, date: validDate ? start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : String(row.scheduledDate || 'Upcoming'), time: validDate ? start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '', duration: Number.parseInt(row.duration, 10) || 60, participants: Number(row.participantsCount || 0), status: row.status || 'Upcoming', link: row.meetingLink || row.link || '', registered: false };
    });
  return { ...state, categories };
}

function persistUserState(userId, state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw Object.assign(new Error('State data must be an object.'), { status: 400 });
  for (const key of Object.keys(state)) if (!userStateKeys.has(key)) throw Object.assign(new Error(`Unknown user state field: ${key}`), { status: 400 });
  for (const key of ['questions', 'discussions', 'sessions', 'notifications']) {
    if (state[key] !== undefined && !Array.isArray(state[key])) throw Object.assign(new Error(`${key} must be an array.`), { status: 400 });
  }
  if (state.profile !== undefined && (!state.profile || typeof state.profile !== 'object' || Array.isArray(state.profile))) throw Object.assign(new Error('Profile must be an object.'), { status: 400 });
  if (state.preferences !== undefined && (!state.preferences || typeof state.preferences !== 'object' || Array.isArray(state.preferences))) throw Object.assign(new Error('Preferences must be an object.'), { status: 400 });
  const serialized = JSON.stringify(state);
  if (Buffer.byteLength(serialized) > 1_500_000) throw Object.assign(new Error('User data is too large.'), { status: 413 });
  const now = new Date().toISOString();
  withTransaction(() => {
    db.prepare('INSERT INTO user_states(user_id,data,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at')
      .run(userId, serialized, now);
    if (state.profile) {
      const current = db.prepare('SELECT name,profile FROM users WHERE id=?').get(userId);
      if (current) {
        const profile = { ...JSON.parse(current.profile || '{}'), ...state.profile };
        const name = String(profile.name || current.name).trim().slice(0, 80) || current.name;
        profile.name = name;
        db.prepare('UPDATE users SET name=?,profile=? WHERE id=?').run(name, JSON.stringify(profile), userId);
      }
    }
  });
  syncUserContentToAdminStorage(userId, state);
}

function applyUserAction(user, state, body) {
  const { collection, action, id, payload = {} } = body;
  const userName = user.user_name;
  const initials = userName.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const now = new Date().toISOString();
  const list = ['questions', 'discussions', 'sessions', 'notifications'].includes(collection) ? state[collection] : null;
  if (collection !== 'profile' && collection !== 'preferences' && !list) throw Object.assign(new Error('Unknown data collection.'), { status: 400 });

  if (action === 'create' && ['questions', 'discussions', 'sessions'].includes(collection)) {
    const title = String(payload.title || '').trim();
    const description = String(payload.description || '').trim();
    if (!title || title.length > 120 || !description || description.length > 5000) throw Object.assign(new Error('Enter a title (up to 120 characters) and a description (up to 5000 characters).'), { status: 400 });
    const common = { id: Date.now(), title, description, category: String(payload.category || 'General').slice(0, 60), time: 'Just now', saved: false };
    let item;
    if (collection === 'questions') item = { ...common, author: userName, initials, votes: 0, answers: [], tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 20).map(tag => String(tag).slice(0, 40)) : [] };
    if (collection === 'discussions') item = { ...common, author: userName, initials, likes: 0, comments: [], tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 20).map(tag => String(tag).slice(0, 40)) : [] };
    if (collection === 'sessions') {
      const duration = Math.max(15, Math.min(240, Number(payload.duration) || 60));
      if (!payload.date || !payload.time) throw Object.assign(new Error('Choose a date and time for the session.'), { status: 400 });
      item = { ...common, host: userName, initials, date: String(payload.date), time: String(payload.time), duration, participants: 1, status: 'Upcoming', registered: true, link: String(payload.link || '').slice(0, 500) };
    }
    list.unshift(item);
    return item;
  }

  if (action === 'updateProfile' && collection === 'profile') {
    const allowed = ['name', 'username', 'bio', 'skills', 'interests', 'github', 'linkedin'];
    for (const key of allowed) if (payload[key] !== undefined) state.profile[key] = payload[key];
    state.profile.role = 'Student';
    return state.profile;
  }
  if (action === 'updatePreferences' && collection === 'preferences') {
    for (const key of ['email', 'answers', 'sessions', 'dark']) if (payload[key] !== undefined) state.preferences[key] = Boolean(payload[key]);
    return state.preferences;
  }
  if (action === 'markAllRead' && collection === 'notifications') {
    state.notifications = state.notifications.map(item => ({ ...item, read: true }));
    return state.notifications;
  }
  if (action === 'delete' && collection === 'notifications') {
    state.notifications = state.notifications.filter(item => String(item.id) !== String(id));
    return state.notifications;
  }
  const item = list?.find(row => String(row.id) === String(id));
  if (!item) throw Object.assign(new Error('The requested item was not found.'), { status: 404 });
  if (action === 'upvote' && collection === 'questions') {
    item.votes = Number(item.votes || 0) + 1;
    if (item.source === 'admin') item.userVotes = Number(item.userVotes || 0) + 1;
  }
  else if (action === 'like' && collection === 'discussions') {
    item.likes = Number(item.likes || 0) + 1;
    if (item.source === 'admin') item.userLikes = Number(item.userLikes || 0) + 1;
  }
  else if (action === 'toggleBookmark' && ['questions', 'discussions'].includes(collection)) item.saved = !item.saved;
  else if (action === 'reply' && ['questions', 'discussions'].includes(collection)) {
    const text = String(payload.text || '').trim();
    if (!text || text.length > 3000) throw Object.assign(new Error('Reply must contain 1 to 3000 characters.'), { status: 400 });
    const reply = { id: Date.now(), author: userName, text, createdAt: now };
    if (collection === 'questions') item.answers = [...(item.answers || []), reply];
    else item.comments = [...(item.comments || []), reply];
  } else if (action === 'register' && collection === 'sessions') {
    if (!item.registered) { item.registered = true; item.participants = Number(item.participants || 0) + 1; }
  } else if (action === 'markRead' && collection === 'notifications') item.read = true;
  else throw Object.assign(new Error('This action is not supported for that collection.'), { status: 400 });
  return item;
}

module.exports = { normalizeEmail, digest, makePassword, matchesPassword, publicUser, publicAdmin, makeSession, requireSession, ensureDevelopmentAdmins, adminStorageObject, storeAdminItem, syncUserContentToAdminStorage, adminKeys, readUserState, getUserDashboardState, persistUserState, applyUserAction };
