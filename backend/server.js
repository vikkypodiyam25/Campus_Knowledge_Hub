require('./config/env')();

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { serveProductionFrontend } = require('./utils/frontendAssets');
const { connectDb, closeDb, mongoose } = require('./config/db');
const { send, fail } = require('./utils/http');
const apiRoutes = require('./routes');
const { ensureDevelopmentAdmins } = require('./services/appService');

const projectRoot = path.resolve(__dirname, '..');
const frontendRoot = path.join(projectRoot, 'frontend');
const frontendDist = path.join(frontendRoot, 'dist');
const isProduction = process.env.NODE_ENV === 'production';
let port = Number(process.env.PORT || 5001);
let viteServer = null;
let stopping = false;

async function startFrontendMiddleware() {
  if (isProduction) return;
  const viteEntry = path.join(frontendRoot, 'node_modules', 'vite', 'dist', 'node', 'index.js');
  if (!fs.existsSync(viteEntry)) throw new Error('Frontend dependencies are missing. Run npm install in the frontend folder.');
  const { createServer } = await import(pathToFileURL(viteEntry).href);
  const reactPluginEntry = path.join(frontendRoot, 'node_modules', '@vitejs', 'plugin-react', 'dist', 'index.js');
  const { default: react } = await import(pathToFileURL(reactPluginEntry).href);
  viteServer = await createServer({
    // Avoid Vite's config bundling subprocess; the same project config is created
    // directly here so the dev server can start in restricted Windows environments.
    configFile: false,
    plugins: [react()],
    root: frontendRoot,
    server: { middlewareMode: true, ws: { server } },
    appType: 'spa',
  });
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && (origin === process.env.FRONTEND_URL || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  }
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  try {
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return await apiRoutes.handleApi(req, res, url);
    if (req.method === 'GET' || req.method === 'HEAD') {
      if (viteServer) return viteServer.middlewares(req, res, () => fail(res, 404, 'Not found.'));
      if (serveProductionFrontend(req, res, url.pathname, frontendDist)) return;
    }
    return fail(res, 404, 'Not found.');
  } catch (error) {
    console.error(error);
    if (!res.headersSent) fail(res, error.status || 500, error.status ? error.message : 'Server error.');
    else res.destroy();
  }
});

function startServer(initialPort) {
  return new Promise((resolve, reject) => {
    function tryPort(candidate) {
      if (candidate >= initialPort + 50) {
        return reject(new Error(`No free port found between ${initialPort} and ${initialPort + 49}.`));
      }

      function onError(err) {
        if (err.code === 'EADDRINUSE') {
          cleanup();
          return tryPort(candidate + 1);
        }
        cleanup();
        reject(err);
      }

      function onListening() {
        cleanup();
        port = candidate;
        resolve(candidate);
      }

      function cleanup() {
        server.removeListener('error', onError);
        server.removeListener('listening', onListening);
      }

      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(candidate, '0.0.0.0');
    }

    tryPort(initialPort);
  });
}

function verifyProductionFrontend() {
  if (isProduction && !fs.existsSync(path.join(frontendDist, 'index.html'))) {
    throw new Error('Production frontend build is missing. In Render, set Root Directory to the repository root (blank), Build Command to "npm run build", and Start Command to "npm start".');
  }
}

Promise.resolve().then(verifyProductionFrontend).then(() => connectDb()).then(() => ensureDevelopmentAdmins()).then(async () => {
  await startFrontendMiddleware();
  port = await startServer(port);
  console.log(`LearnConnect app and API listening at http://localhost:${port}`);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}).catch(error => {
  console.error(`Backend startup failed: ${error.message}`);
  process.exitCode = 1;
});

function stop() {
  if (stopping) return;
  stopping = true;
  server.close(async () => {
    if (viteServer) await viteServer.close();
    await closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
