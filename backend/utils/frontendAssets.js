const fs = require('node:fs');
const path = require('node:path');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

function serveProductionFrontend(req, res, pathname, frontendDist) {
  const indexFile = path.join(frontendDist, 'index.html');
  if (!fs.existsSync(indexFile)) return false;
  let decodedPath;
  try { decodedPath = decodeURIComponent(pathname); }
  catch { return false; }
  const requested = decodedPath === '/' ? indexFile : path.resolve(frontendDist, `.${decodedPath}`);
  const relativePath = path.relative(frontendDist, requested);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) return false;
  const fileExists = fs.existsSync(requested) && fs.statSync(requested).isFile();
  // Missing files with an extension are asset requests, not SPA navigations.
  if (!fileExists && path.extname(decodedPath)) return false;
  const file = fileExists ? requested : indexFile;
  const content = fs.readFileSync(file);
  res.writeHead(200, {
    'Content-Type': mimeTypes[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': content.length,
  });
  res.end(req.method === 'HEAD' ? undefined : content);
  return true;
}

module.exports = { serveProductionFrontend };
