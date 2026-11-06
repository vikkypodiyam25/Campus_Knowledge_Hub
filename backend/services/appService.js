const crypto = require('node:crypto');
const { promisify } = require('node:util');
const { User, Admin, Session, UserState, AdminStorage } = require('../config/db');
const jwt = require('jsonwebtoken');

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
  return { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, status: user.status, profile: user.profile || {}, createdAt: user.created_at };
}

function publicAdmin(admin) {
  return { id: admin.email, name: admin.name, email: admin.email, role: admin.role, avatar: admin.profile_picture || '', title: `${admin.role} Â· LearnConnect`, platform: 'LearnConnect' };
}

async function makeSession({ userId = null, adminEmail = null, role }) {
  const secret = String(process.env.JWT_SECRET || '');
  if (secret.length < 32) throw Object.assign(new Error('Set a random JWT_SECRET of at least 32 characters in backend/.env.'), { status: 500 });
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const token = jwt.sign({ sub: userId || adminEmail, userId, adminEmail, role }, secret, {
    expiresIn: '7d', issuer: 'campus-knowledge-hub', audience: 'campus-knowledge-hub-api',
  });
  await Session.create({ token_hash: digest(token), user_id: userId, admin_email: adminEmail, role, expires_at: expiresAt });
  return { token, expiresAt: new Date(expiresAt).toISOString() };
}

async function requireSession(req, expectedRole) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;
  const session = await Session.findOne({ token_hash: digest(token) }).lean();
  if (!session || session.expires_at < Date.now()) {
    if (session) await Session.deleteOne({ token_hash: session.token_hash });
    return null;
  }
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'campus-knowledge-hub', audience: 'campus-knowledge-hub-api' });
    if (claims.role !== session.role || claims.userId !== (session.user_id || null) || claims.adminEmail !== (session.admin_email || null)) return null;
  } catch {
    if (token.split('.').length === 3) return null;
  }
  const user = session.user_id ? await User.findOne({ id: session.user_id }).lean() : null;
  const admin = session.admin_email ? await Admin.findOne({ email: session.admin_email }).lean() : null;
  if (expectedRole === 'user' && (!user || user.status !== 'active')) return null;
  if (expectedRole === 'admin' && !admin) return null;
  return { token, session: { ...session, user_name: user?.name, user_username: user?.username, user_email: user?.email, user_status: user?.status, user_profile: user?.profile, user_created_at: user?.created_at, admin_name: admin?.name } };
}

async function ensureDevelopmentAdmins() {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword) throw new Error('Set ADMIN_PASSWORD in backend/.env before starting the server.');
  if (configuredPassword.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
  const admins = [{ email: normalizeEmail(process.env.ADMIN_EMAIL), name: process.env.ADMIN_NAME || 'LearnConnect Admin', role: 'Super Admin' }];
  if (!admins[0].email) throw new Error('Set ADMIN_EMAIL in backend/.env before starting the server.');
  return Promise.all(admins.map(async admin => {
    const { salt, hash } = await makePassword(configuredPassword);
    await Admin.findOneAndUpdate({ email: normalizeEmail(admin.email) }, { $set: { name: admin.name, role: admin.role, password_hash: hash, password_salt: salt }, $setOnInsert: { email: normalizeEmail(admin.email) } }, { upsert: true, returnDocument: 'after' });
  }));
}

async function adminStorageObject() {
  const result = {};
  for (const row of await AdminStorage.find({}).lean()) result[row.key] = row.value;
  return result;
}

async function storeAdminItem(key, value) {
  await AdminStorage.findOneAndUpdate({ key }, { $set: { value, updated_at: new Date().toISOString() } }, { upsert: true });
}

const adminKeys = new Set(['learnconnect_categories_data']);

async function syncUserContentToAdminStorage(userId, data) {
  const user = await User.findOne({ id: userId }).lean();
  if (!user || !data) return;
  let profile = {};
  profile = user.profile || {};
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
    const existing = (await adminStorageObject())[storageKey];
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
    if (changed || !Array.isArray(existing)) await storeAdminItem(storageKey, rows);
  }
}

const userStateKeys = new Set(['profile', 'questions', 'discussions', 'sessions', 'notifications', 'preferences']);

async function readUserState(userId) {
  const row = await UserState.findOne({ user_id: userId }).lean();
  return row ? row.data : { profile: {}, questions: [], discussions: [], sessions: [], notifications: [], preferences: {} };
}

async function getUserDashboardState(userId) {
  const state = await readUserState(userId);
  const admin = await adminStorageObject();
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

async function persistUserState(userId, state) {
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
  await UserState.findOneAndUpdate({ user_id: userId }, { $set: { data: state, updated_at: now } }, { upsert: true });
  if (state.profile) {
    const current = await User.findOne({ id: userId }).lean();
    if (current) {
      const profile = { ...(current.profile || {}), ...state.profile };
      const name = String(profile.name || current.name).trim().slice(0, 80) || current.name;
      profile.name = name;
      await User.updateOne({ id: userId }, { $set: { name, profile } });
    }
  }
  await syncUserContentToAdminStorage(userId, state);
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
    const owner = { id: user.id, email: user.user_email };
    if (collection === 'questions') item = { ...common, author: userName, authorId: owner.id, authorEmail: owner.email, initials, votes: 0, answers: [], tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 20).map(tag => String(tag).slice(0, 40)) : [] };
    if (collection === 'discussions') item = { ...common, author: userName, authorId: owner.id, authorEmail: owner.email, initials, likes: 0, comments: [], tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 20).map(tag => String(tag).slice(0, 40)) : [] };
    if (collection === 'sessions') {
      const duration = Math.max(15, Math.min(240, Number(payload.duration) || 60));
      if (!payload.date || !payload.time) throw Object.assign(new Error('Choose a date and time for the session.'), { status: 400 });
      item = { ...common, host: userName, initials, date: String(payload.date), time: String(payload.time), duration, participants: 1, status: 'Upcoming', registered: true, link: String(payload.link || '').slice(0, 500) };
    }
    list.unshift(item);
    return item;
  }

  if (action === 'updateProfile' && collection === 'profile') {
    const allowed = ['name', 'username', 'bio', 'skills', 'interests', 'github', 'linkedin', 'subject'];
    if (payload.subject !== undefined && !['programming', 'school', 'business', 'finance'].includes(payload.subject)) throw Object.assign(new Error('Choose a valid learning school.'), { status: 400 });
    for (const key of allowed) if (payload[key] !== undefined) state.profile[key] = payload[key];
    state.profile.role = 'Student';
    return state.profile;
  }
  if (action === 'updatePreferences' && collection === 'preferences') {
    for (const key of ['email', 'answers', 'sessions', 'assignmentUpdates', 'studyReminders', 'dark', 'reducedMotion']) if (payload[key] !== undefined) state.preferences[key] = Boolean(payload[key]);
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
    return { item, reply, ownerId: item.authorId || item.ownerId || item.userId || (String(item.id).startsWith('u_') ? String(item.id).split('_')[1] : null), ownerEmail: item.authorEmail || item.ownerEmail || item.author?.email || null, title: item.title, collection };
  } else if (action === 'register' && collection === 'sessions') {
    if (!item.registered) { item.registered = true; item.participants = Number(item.participants || 0) + 1; }
  } else if (action === 'markRead' && collection === 'notifications') item.read = true;
  else throw Object.assign(new Error('This action is not supported for that collection.'), { status: 400 });
  return item;
}

async function addReplyNotification({ ownerId, ownerEmail, author, title, collection, linkId }) {
  const owner = ownerId ? await User.findOne({ id: ownerId }).lean() : ownerEmail ? await User.findOne({ email: normalizeEmail(ownerEmail) }).lean() : null;
  if (!owner || owner.id === linkId?.actorId) return null;
  const state = await readUserState(owner.id);
  const isQuestion = collection === 'questions';
  const notification = {
    id: `reply_${crypto.randomUUID()}`,
    title: isQuestion ? `${author} answered your doubt` : `${author} commented on your discussion`,
    detail: title || (isQuestion ? 'Someone answered your question.' : 'Someone commented on your discussion.'),
    time: 'Just now', read: false, icon: 'message',
    link: isQuestion ? `/questions/${linkId?.itemId}` : `/discussions/${linkId?.itemId}`,
  };
  state.notifications = [notification, ...(state.notifications || [])].slice(0, 100);
  delete state.categories;
  await persistUserState(owner.id, state);
  return notification;
}

module.exports = { normalizeEmail, digest, makePassword, matchesPassword, publicUser, publicAdmin, makeSession, requireSession, ensureDevelopmentAdmins, adminStorageObject, storeAdminItem, syncUserContentToAdminStorage, adminKeys, readUserState, getUserDashboardState, persistUserState, applyUserAction, addReplyNotification };
