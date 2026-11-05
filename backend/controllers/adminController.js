const { db } = require('../config/db');
const { send, fail, readBody } = require('../utils/http');
const service = require('../services/appService');

function matches(pathname) { return pathname.startsWith('/api/admin/'); }

async function handle(req, res, url) {
  const auth = service.requireSession(req, 'admin');
  if (!auth) return fail(res, 401, 'Admin sign-in required.');
  const role = auth.session.role;
  const allowedRoles = {
    '/api/admin/dashboard': ['Super Admin', 'Admin', 'Moderator'],
    '/api/admin/users': ['Super Admin', 'Admin'],
    '/api/admin/questions': ['Super Admin', 'Admin', 'Moderator'],
    '/api/admin/discussions': ['Super Admin', 'Admin', 'Moderator'],
    '/api/admin/sessions': ['Super Admin', 'Admin'],
    '/api/admin/assignment-submissions': ['Super Admin', 'Admin', 'Moderator'],
    '/api/admin/storage': ['Super Admin', 'Admin'],
  };
  let required = allowedRoles[url.pathname];
  if (!required && url.pathname.startsWith('/api/admin/questions/')) required = allowedRoles['/api/admin/questions'];
  if (!required && url.pathname.startsWith('/api/admin/discussions/')) required = allowedRoles['/api/admin/discussions'];
  if (!required && url.pathname.startsWith('/api/admin/sessions/')) required = allowedRoles['/api/admin/sessions'];
  if (!required && url.pathname.startsWith('/api/admin/users/')) required = allowedRoles['/api/admin/users'];
  if (!required && url.pathname.startsWith('/api/admin/assignment-submissions/')) required = allowedRoles['/api/admin/assignment-submissions'];
  if (required && !required.includes(role)) return fail(res, 403, 'Your administrator role cannot perform this action.');

  if (url.pathname.startsWith('/api/admin/storage') && !['Super Admin', 'Admin'].includes(role)) return fail(res, 403, 'Your administrator role cannot access platform storage.');
  if (req.method === 'GET' && url.pathname === '/api/admin/assignment-submissions') {
    const rows = db.prepare(`SELECT s.id, s.user_id AS userId, u.name AS studentName, u.email AS studentEmail,
      s.school_code AS schoolCode, s.assignment_id AS assignmentId, s.assignment_title AS assignmentTitle,
      s.module_name AS moduleName, s.submission_text AS submissionText, s.submission_url AS submissionUrl,
      s.status, s.admin_feedback AS adminFeedback, s.score, s.submitted_at AS submittedAt
      FROM assignment_submissions s JOIN users u ON u.id=s.user_id ORDER BY s.submitted_at DESC`).all();
    return send(res, 200, { success: true, data: rows });
  }
  const assignmentSubmissionMatch = url.pathname.match(/^\/api\/admin\/assignment-submissions\/([^/]+)$/);
  if (req.method === 'PUT' && assignmentSubmissionMatch) {
    const id = decodeURIComponent(assignmentSubmissionMatch[1]);
    const body = await readBody(req);
    const current = db.prepare('SELECT id FROM assignment_submissions WHERE id=?').get(id);
    if (!current) return fail(res, 404, 'Assignment submission not found.');
    const statuses = ['Submitted', 'In Review', 'Needs Revision', 'Graded'];
    const status = statuses.includes(body.status) ? body.status : null;
    const feedback = String(body.adminFeedback ?? '').trim();
    const score = body.score === '' || body.score === null || body.score === undefined ? null : Number(body.score);
    if (!status) return fail(res, 400, 'Choose a valid submission status.');
    if (feedback.length > 3000) return fail(res, 400, 'Feedback must be 3,000 characters or fewer.');
    if (score !== null && (!Number.isInteger(score) || score < 0 || score > 100)) return fail(res, 400, 'Score must be a whole number from 0 to 100.');
    db.prepare('UPDATE assignment_submissions SET status=?,admin_feedback=?,score=? WHERE id=?').run(status, feedback, score, id);
    const updated = db.prepare(`SELECT s.id,s.user_id AS userId,u.name AS studentName,u.email AS studentEmail,s.school_code AS schoolCode,s.assignment_id AS assignmentId,s.assignment_title AS assignmentTitle,s.module_name AS moduleName,s.submission_text AS submissionText,s.submission_url AS submissionUrl,s.status,s.admin_feedback AS adminFeedback,s.score,s.submitted_at AS submittedAt FROM assignment_submissions s JOIN users u ON u.id=s.user_id WHERE s.id=?`).get(id);
    const studentState = service.readUserState(updated.userId);
    if (studentState.preferences?.assignmentUpdates !== false) {
      studentState.notifications = [{ id: `assignment_${Date.now()}`, title: `Assignment ${status.toLowerCase()}`, detail: `${updated.assignmentTitle}${score === null ? '' : ` · Score ${score}/100`}${feedback ? ` · ${feedback}` : ''}`, time: 'Just now', read: false, icon: 'assignment' }, ...(studentState.notifications || [])].slice(0, 100);
      service.persistUserState(updated.userId, studentState);
    }
    return send(res, 200, { success: true, message: 'Submission review saved.', data: updated });
  }
  if (req.method === 'GET' && url.pathname === '/api/admin/dashboard') {
      const users = db.prepare("SELECT id,name,username,email,role,status,profile,created_at FROM users ORDER BY created_at DESC").all().map(user => {
      let profile = {}; try { profile = JSON.parse(user.profile || '{}'); } catch {}
      return { id: user.id, name: user.name, username: user.username, email: user.email, role: 'Student', status: user.status === 'active' ? 'Active' : 'Suspended', avatar: profile.avatar || '', batch: 'New learner', joinedDate: user.created_at, bio: profile.bio || '', skills: profile.skills || [], stats: { questions: 0, answers: 0, discussions: 0, sessionsJoined: 0 } };
    });
    const storage = service.adminStorageObject();
    const questions = Array.isArray(storage.learnconnect_questions_data) ? storage.learnconnect_questions_data.filter(item => item?.author?.email || item?.author?.id) : [];
    const discussions = Array.isArray(storage.learnconnect_discussions_data) ? storage.learnconnect_discussions_data.filter(item => item?.author?.email || item?.author?.id) : [];
    const sessions = Array.isArray(storage.learnconnect_sessions_data) ? storage.learnconnect_sessions_data.filter(item => item?.host?.email || item?.host?.role === 'Student') : [];
    const reports = [];
    const now = Date.now();
    const growth = Array.from({ length: 7 }, (_, index) => { const date = new Date(now - (6 - index) * 86400000); const name = date.toLocaleDateString('en', { weekday: 'short' }); const end = new Date(date); end.setDate(end.getDate() + 1); return { name, students: users.filter(user => new Date(user.joinedDate) < end).length }; });
    const weeklyActivity = Array.from({ length: 7 }, (_, index) => { const date = new Date(now - (6 - index) * 86400000); const day = date.toLocaleDateString('en', { weekday: 'short' }); const start = new Date(date); start.setHours(0,0,0,0); const end = new Date(start.getTime() + 86400000); return { day, questions: questions.filter(item => new Date(item.createdAt) >= start && new Date(item.createdAt) < end).length, answers: questions.reduce((total, item) => total + (item.answers || []).filter(answer => new Date(answer.createdAt) >= start && new Date(answer.createdAt) < end).length, 0), sessions: sessions.filter(item => new Date(item.scheduledDate) >= start && new Date(item.scheduledDate) < end).length }; });
    const categoryBreakdown = [...new Set([...questions, ...discussions].map(item => item.category).filter(Boolean))].map(name => ({ name, questions: questions.filter(item => item.category === name).length, discussions: discussions.filter(item => item.category === name).length }));
    return send(res, 200, { success: true, data: { users, questions, discussions, sessions, reports, activities: [], categories: storage.learnconnect_categories_data || [], analytics: { growth, weeklyActivity, categoryBreakdown, distribution: [{ name: 'Active students', value: users.filter(user => user.status === 'Active').length, color: '#10b981' }, { name: 'Suspended students', value: users.filter(user => user.status !== 'Active').length, color: '#f59e0b' }] }, stats: { totalStudents: users.length, activeStudents: users.filter(user => user.status === 'Active').length, totalQuestions: questions.length, totalDiscussions: discussions.length, totalSessions: sessions.length, pendingReports: 0, upcomingSessions: sessions.filter(session => ['Upcoming', 'Ongoing'].includes(session.status)).length } } });
  }

  const collectionMatch = url.pathname.match(/^\/api\/admin\/(questions|discussions|sessions)(?:\/([^/]+))?$/);
  if (collectionMatch) {
    const [, kind, rawId] = collectionMatch;
    const storageKey = `learnconnect_${kind}_data`;
    const storedCollection = service.adminStorageObject()[storageKey];
    const collection = Array.isArray(storedCollection) ? storedCollection.filter(item => kind === 'sessions' ? item?.host?.email || item?.host?.role === 'Student' : item?.author?.email || item?.author?.id) : [];
    const id = rawId ? decodeURIComponent(rawId) : null;
    if (req.method === 'GET' && !id) return send(res, 200, { success: true, data: collection });
    if (req.method === 'PUT' && id) {
      const body = await readBody(req);
      const allowed = kind === 'questions' ? ['title', 'content', 'category', 'status', 'moderationReason'] : kind === 'discussions' ? ['title', 'content', 'category', 'isPinned', 'isHidden'] : ['title', 'description', 'category', 'status', 'scheduledDate', 'duration', 'maxCapacity', 'meetingLink'];
      const updated = collection.map(item => String(item.id) === id ? { ...item, ...Object.fromEntries(allowed.filter(key => body[key] !== undefined).map(key => [key, body[key]])) } : item);
      if (!updated.some(item => String(item.id) === id)) return fail(res, 404, 'Content record not found.');
      service.storeAdminItem(storageKey, updated);
      return send(res, 200, { success: true, message: 'Content updated.', data: updated.find(item => String(item.id) === id) });
    }
    if (req.method === 'DELETE' && id) {
      const updated = collection.filter(item => String(item.id) !== id);
      if (updated.length === collection.length) return fail(res, 404, 'Content record not found.');
      service.storeAdminItem(storageKey, updated);
      return send(res, 200, { success: true, message: 'Content deleted.' });
    }
    if (req.method === 'POST' && !id && ['questions', 'discussions'].includes(kind)) {
      const body = await readBody(req);
      const title = String(body.title || '').trim();
      const content = String(body.content || '').trim();
      if (!title || title.length > 120 || !content || content.length > 5000) return fail(res, 400, 'Enter a title (up to 120 characters) and content (up to 5000 characters).');
      const common = { id: `admin_${kind === 'questions' ? 'q' : 'discussion'}_${Date.now()}`, title, content, category: String(body.category || (kind === 'questions' ? 'General' : 'Learning')).slice(0, 60), author: { name: auth.session.admin_name || 'LearnConnect Admin', email: auth.session.admin_email, role }, createdAt: new Date().toISOString(), tags: Array.isArray(body.tags) ? body.tags.slice(0, 20).map(tag => String(tag).slice(0, 40)) : [] };
      const item = kind === 'questions' ? { ...common, status: 'Unanswered', upvotes: 0, views: 0, answersCount: 0, answers: [] } : { ...common, likes: 0, commentsCount: 0, isPinned: false, isHidden: false, comments: [] };
      service.storeAdminItem(storageKey, [item, ...collection]);
      return send(res, 201, { success: true, message: 'Community post created.', data: item });
    }
    if (req.method === 'POST' && kind === 'sessions' && !id) {
      const body = await readBody(req);
      const title = String(body.title || '').trim();
      const description = String(body.description || '').trim();
      const scheduledDate = new Date(body.scheduledDate);
      if (!title || title.length > 120 || !description || description.length > 5000 || Number.isNaN(scheduledDate.getTime())) return fail(res, 400, 'Enter a valid title, description, and session date.');
      const session = { id: `admin_${Date.now()}`, title, host: { name: auth.session.admin_name, role: auth.session.role, email: auth.session.admin_email }, category: String(body.category || 'General').slice(0, 60), status: 'Upcoming', scheduledDate: scheduledDate.toISOString(), duration: String(body.duration || '60 mins'), participantsCount: 0, maxCapacity: Math.max(1, Math.min(1000, Number(body.maxCapacity) || 100)), meetingLink: String(body.meetingLink || '').slice(0, 500), description, participants: [] };
      service.storeAdminItem(storageKey, [session, ...collection]);
      return send(res, 201, { success: true, message: 'Session created.', data: session });
    }
  }

  const userMatch = url.pathname.match(/^\/api\/admin\/users(?:\/([^/]+))?(?:\/(status))?$/);
  if (userMatch) {
    const id = decodeURIComponent(userMatch[1] || '');
    if (req.method === 'GET' && !id) return send(res, 200, { success: true, data: db.prepare("SELECT id,name,username,email,role,status,profile,created_at FROM users ORDER BY created_at DESC").all().map(user => { let profile = {}; try { profile = JSON.parse(user.profile || '{}'); } catch {} return { id: user.id, name: user.name, username: user.username, email: user.email, role: 'Student', status: user.status === 'active' ? 'Active' : 'Suspended', avatar: profile.avatar || '', batch: 'New learner', joinedDate: user.created_at, bio: profile.bio || '', skills: profile.skills || [], stats: { questions: 0, answers: 0, discussions: 0, sessionsJoined: 0 } }; }) });
    if (req.method === 'PUT' && id && userMatch[2] === 'status') { const body = await readBody(req); if (!['Active', 'Suspended'].includes(body.status)) return fail(res, 400, 'Status must be Active or Suspended.'); const status = body.status === 'Active' ? 'active' : 'suspended'; const result = db.prepare('UPDATE users SET status=? WHERE id=?').run(status, id); if (!result.changes) return fail(res, 404, 'User not found.'); return send(res, 200, { success: true, message: 'User status updated.' }); }
    if (req.method === 'DELETE' && id) { const result = db.prepare('DELETE FROM users WHERE id=?').run(id); if (!result.changes) return fail(res, 404, 'User not found.'); return send(res, 200, { success: true, message: 'User deleted.' }); }
    if (req.method === 'PUT' && id) { const body = await readBody(req); const user = db.prepare('SELECT * FROM users WHERE id=?').get(id); if (!user) return fail(res, 404, 'User not found.'); let currentProfile = {}; try { currentProfile = JSON.parse(user.profile || '{}'); } catch {} const incoming = body.profile && typeof body.profile === 'object' && !Array.isArray(body.profile) ? body.profile : {}; const profile = { ...currentProfile, bio: String(incoming.bio ?? currentProfile.bio ?? '').slice(0, 2000), skills: Array.isArray(incoming.skills) ? incoming.skills.slice(0, 30).map(value => String(value).slice(0, 80)) : currentProfile.skills || [] }; const name = String(body.name || user.name).trim().slice(0, 80); if (!name) return fail(res, 400, 'Name cannot be empty.'); db.prepare('UPDATE users SET name=?, profile=? WHERE id=?').run(name, JSON.stringify(profile), id); return send(res, 200, { success: true, message: 'User updated.' }); }
  }

  if (req.method === 'GET' && url.pathname === '/api/admin/storage') return send(res, 200, { success: true, data: Object.fromEntries(Object.entries(service.adminStorageObject()).filter(([key]) => service.adminKeys.has(key))) });
  const storageMatch = url.pathname.match(/^\/api\/admin\/storage\/([^/]+)$/);
  if (req.method === 'PUT' && storageMatch) {
    const key = decodeURIComponent(storageMatch[1]);
    if (!service.adminKeys.has(key)) return fail(res, 403, 'This admin data collection is read-only or unsupported.');
    const body = await readBody(req);
    if (key === 'learnconnect_categories_data' && (!Array.isArray(body.value) || body.value.some(item => !item?.name || typeof item.name !== 'string'))) return fail(res, 400, 'Categories must be an array of named categories.');
    service.storeAdminItem(key, body.value);
    return send(res, 200, { success: true, message: 'Admin data saved.', data: service.adminStorageObject() });
  }

  return fail(res, 404, 'Admin route not found.');
}

module.exports = { matches, handle };
