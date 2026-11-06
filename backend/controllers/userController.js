const { send, fail, readBody } = require('../utils/http');
const { StudentProgress, AssignmentSubmission, User } = require('../config/db');
const service = require('../services/appService');
const SCHOOL_IDS = { SOP: 'programming', SOB: 'business', SOF: 'finance' };
let curriculumPromise;
function loadCurricula() {
  if (!curriculumPromise) {
    const { pathToFileURL } = require('node:url');
    const path = require('node:path');
    curriculumPromise = import(pathToFileURL(path.resolve(__dirname, '../../frontend/src/data/curricula.js')).href);
  }
  return curriculumPromise;
}

function matches(pathname) {
  return pathname === '/api/state' || pathname === '/api/state/actions'
    || pathname === '/api/schools' || pathname === '/api/schools/select'
    || /^\/api\/schools\/[A-Z]+$/.test(pathname) || /^\/api\/curriculum\/[A-Z]+$/.test(pathname)
    || pathname === '/api/progress' || pathname === '/api/assignments/submissions';
}

async function handle(req, res, url) {
  const auth = await service.requireSession(req, 'user');
  if (!auth) return fail(res, 401, 'Please sign in to continue.');

  if (req.method === 'GET' && url.pathname === '/api/schools') {
    const { CURRICULA } = await loadCurricula();
    return send(res, 200, { success: true, data: Object.values(CURRICULA).filter(item => item.code).map(({ code, id, name, shortName, description, accent }) => ({ code, id, name, shortName, description, accent })) });
  }
  const schoolMatch = url.pathname.match(/^\/api\/schools\/([A-Z]+)$/);
  if (req.method === 'GET' && schoolMatch) {
    const id = SCHOOL_IDS[schoolMatch[1]];
    if (!id) return fail(res, 404, 'School not found.');
    const { CURRICULA } = await loadCurricula();
    const { curriculum, ...school } = CURRICULA[id];
    return send(res, 200, { success: true, data: school });
  }
  if (req.method === 'POST' && url.pathname === '/api/schools/select') {
    const body = await readBody(req);
    const code = String(body.schoolCode || '').toUpperCase();
    const schoolId = SCHOOL_IDS[code];
    if (!schoolId) return fail(res, 400, 'Choose SOP, SOB or SOF.');
    const state = await service.readUserState(auth.session.user_id);
    const selectedAt = new Date().toISOString();
    await service.persistUserState(auth.session.user_id, { ...state, profile: { ...(state.profile || {}), subject: schoolId, selectedSchool: code, selectedSchoolId: schoolId, schoolSelectedAt: selectedAt } });
    return send(res, 200, { success: true, message: 'School selection saved.', data: { schoolCode: code, schoolId, selectedAt } });
  }
  const curriculumMatch = url.pathname.match(/^\/api\/curriculum\/([A-Z]+)$/);
  if (req.method === 'GET' && curriculumMatch) {
    const code = curriculumMatch[1];
    const schoolId = SCHOOL_IDS[code];
    if (!schoolId) return fail(res, 404, 'School curriculum not found.');
    const state = await service.readUserState(auth.session.user_id);
    if (state.profile?.selectedSchool !== code && state.profile?.subject !== schoolId) return fail(res, 403, 'Select this school before viewing its curriculum.');
    const { CURRICULA } = await loadCurricula();
    return send(res, 200, { success: true, data: CURRICULA[schoolId] });
  }
  if (url.pathname === '/api/progress') {
    if (req.method === 'GET') {
      const rows = (await StudentProgress.find({ user_id: auth.session.user_id }).sort({ completed_at: -1 }).lean()).map(({ school_code: schoolCode, module_id: moduleId, topic_id: topicId, status, completed_at: completedAt }) => ({ schoolCode, moduleId, topicId, status, completedAt }));
      return send(res, 200, { success: true, data: rows });
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const code = String(body.schoolCode || '').toUpperCase();
      if (!SCHOOL_IDS[code] || !body.moduleId || !body.topicId) return fail(res, 400, 'A valid school, module and topic are required.');
      const profile = (await service.readUserState(auth.session.user_id)).profile || {};
      if (profile.selectedSchool !== code && profile.subject !== SCHOOL_IDS[code]) return fail(res, 403, 'You can update progress only for your selected school.');
      const completedAt = new Date().toISOString();
      const status = body.status === 'not_started' ? 'not_started' : 'completed';
      await StudentProgress.findOneAndUpdate({ user_id: auth.session.user_id, school_code: code, module_id: String(body.moduleId), topic_id: String(body.topicId) }, { $set: { status, completed_at: completedAt } }, { upsert: true });
      return send(res, 200, { success: true, message: 'Progress saved.', data: { schoolCode: code, moduleId: String(body.moduleId), topicId: String(body.topicId), status, completedAt } });
    }
  }

  if (url.pathname === '/api/assignments/submissions') {
    if (req.method === 'GET') {
      const rows = (await AssignmentSubmission.find({ user_id: auth.session.user_id }).sort({ submitted_at: -1 }).lean()).map(toSubmission);
      return send(res, 200, { success: true, data: rows });
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const code = String(body.schoolCode || '').toUpperCase();
      const schoolId = SCHOOL_IDS[code];
      const moduleId = String(body.moduleId || '').trim();
      const submissionText = String(body.submissionText || '').trim();
      const submissionUrl = String(body.submissionUrl || '').trim();
      if (!schoolId || !moduleId || !submissionText || submissionText.length > 10000) return fail(res, 400, 'Write your assignment response (1–10,000 characters).');
      const profile = (await service.readUserState(auth.session.user_id)).profile || {};
      if (profile.subject !== schoolId && profile.selectedSchool !== code) return fail(res, 403, 'Submit assignments only for your selected school.');
      if (submissionUrl) {
        try { if (!['http:', 'https:'].includes(new URL(submissionUrl).protocol)) throw new Error(); }
        catch { return fail(res, 400, 'Submission link must be a valid http or https URL.'); }
      }
      const { CURRICULA } = await loadCurricula();
      const curriculum = CURRICULA[schoolId];
      const modules = [...(curriculum.modules || []), ...(curriculum.subjects || []).flatMap(subject => (subject.modules || []).map(module => ({ ...module, subjectName: subject.name })))];
      const module = modules.find(item => item.id === moduleId);
      if (!module?.assignment) return fail(res, 404, 'Assignment not found for this school.');
      const submittedAt = new Date().toISOString();
      const id = `${auth.session.user_id}:${moduleId}`;
      await AssignmentSubmission.findOneAndUpdate({ user_id: auth.session.user_id, assignment_id: moduleId }, { $set: { id, school_code: code, assignment_title: module.assignment.title, module_name: module.name, submission_text: submissionText, submission_url: submissionUrl, status: 'Submitted', admin_feedback: '', score: null, submitted_at: submittedAt } }, { upsert: true });
      const saved = toSubmission(await AssignmentSubmission.findOne({ user_id: auth.session.user_id, assignment_id: moduleId }).lean());
      return send(res, 201, { success: true, message: 'Assignment submitted.', data: saved });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/state') {
    return send(res, 200, { success: true, data: await service.getUserDashboardState(auth.session.user_id) });
  }

  if (req.method === 'POST' && url.pathname === '/api/state/actions') {
    const body = await readBody(req);
    const state = await service.getUserDashboardState(auth.session.user_id);
    const user = await User.findOne({ id: auth.session.user_id }).lean();
    const result = service.applyUserAction({ ...auth.session, user_name: user.name, user_email: user.email, id: user.id }, state, body);
    delete state.categories;
    await service.persistUserState(auth.session.user_id, state);
    const replyNotification = result?.reply ? await service.addReplyNotification({ ownerId: result.ownerId, ownerEmail: result.ownerEmail, author: user.name, title: result.title, collection: result.collection, linkId: { itemId: body.id, actorId: user.id } }) : null;
    return send(res, 200, { success: true, message: 'Action saved.', data: await service.getUserDashboardState(auth.session.user_id), result: result?.item || result, notification: replyNotification });
  }

  if (req.method === 'PUT' && url.pathname === '/api/state') {
    const body = await readBody(req);
    try { await service.persistUserState(auth.session.user_id, body.data); }
    catch (error) { return fail(res, error.status || 400, error.message); }
    return send(res, 200, { success: true, message: 'Data saved.' });
  }

  return fail(res, 404, 'User route not found.');
}

function toSubmission(row) {
  if (!row) return null;
  return { id: row.id, schoolCode: row.school_code, assignmentId: row.assignment_id, assignmentTitle: row.assignment_title, moduleName: row.module_name, submissionText: row.submission_text, submissionUrl: row.submission_url, status: row.status, adminFeedback: row.admin_feedback, score: row.score, submittedAt: row.submitted_at };
}

module.exports = { matches, handle };
