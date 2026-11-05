const { send, fail } = require('../utils/http');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminroutes');

const routeGroups = [authRoutes, userRoutes, adminRoutes];

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, { success: true, message: 'LearnConnect API is running', database: 'SQLite' });
  }
  const route = routeGroups.find(group => group.matches(url.pathname));
  if (!route) return fail(res, 404, 'API route not found.');
  return route.handle(req, res, url);
}

module.exports = { handleApi, send };
