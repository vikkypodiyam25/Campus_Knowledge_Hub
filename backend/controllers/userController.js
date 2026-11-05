const { send, fail, readBody } = require('../utils/http');
const service = require('../services/appService');

function matches(pathname) {
  return pathname === '/api/state' || pathname === '/api/state/actions';
}

async function handle(req, res, url) {
  const auth = service.requireSession(req, 'user');
  if (!auth) return fail(res, 401, 'Please sign in to continue.');

  if (req.method === 'GET' && url.pathname === '/api/state') {
    return send(res, 200, { success: true, data: service.getUserDashboardState(auth.session.user_id) });
  }

  if (req.method === 'POST' && url.pathname === '/api/state/actions') {
    const body = await readBody(req);
    const state = service.getUserDashboardState(auth.session.user_id);
    const result = service.applyUserAction(auth.session, state, body);
    delete state.categories;
    service.persistUserState(auth.session.user_id, state);
    return send(res, 200, { success: true, message: 'Action saved.', data: service.getUserDashboardState(auth.session.user_id), result });
  }

  if (req.method === 'PUT' && url.pathname === '/api/state') {
    const body = await readBody(req);
    try { service.persistUserState(auth.session.user_id, body.data); }
    catch (error) { return fail(res, error.status || 400, error.message); }
    return send(res, 200, { success: true, message: 'Data saved.' });
  }

  return fail(res, 404, 'User route not found.');
}

module.exports = { matches, handle };
