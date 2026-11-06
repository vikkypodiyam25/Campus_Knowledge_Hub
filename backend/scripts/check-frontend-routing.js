const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { serveProductionFrontend } = require('../utils/frontendAssets');
const apiRoutes = require('../routes');

const frontendDist = path.resolve(__dirname, '../../frontend/dist');

function requestStatic(method, pathname) {
  const response = {
    status: 0,
    headers: {},
    body: undefined,
    writeHead(status, headers) { this.status = status; this.headers = headers; },
    end(body) { this.body = body; },
  };
  response.matched = serveProductionFrontend({ method }, response, pathname, frontendDist);
  return response;
}

async function main() {
  const indexPath = path.join(frontendDist, 'index.html');
  assert.ok(fs.existsSync(indexPath), 'Production frontend index.html must exist.');
  const index = fs.readFileSync(indexPath, 'utf8');

  const root = requestStatic('GET', '/');
  assert.equal(root.matched, true);
  assert.equal(root.status, 200);
  assert.match(root.headers['Content-Type'], /text\/html/);
  assert.equal(root.body.toString(), index);

  const nestedRoute = requestStatic('GET', '/dashboard');
  assert.equal(nestedRoute.matched, true);
  assert.equal(nestedRoute.body.toString(), index, 'SPA route refreshes should return index.html.');

  const assets = [...index.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(match => match[1]);
  assert.ok(assets.length >= 2, 'Built HTML should reference JavaScript and CSS assets.');
  for (const asset of assets) {
    const response = requestStatic('GET', asset);
    assert.equal(response.matched, true, `${asset} should be served.`);
    assert.equal(response.status, 200);
    assert.ok(response.body.length > 0);
  }
  assert.equal(requestStatic('GET', '/missing.js').matched, false, 'Missing assets must not receive index.html.');
  assert.equal(requestStatic('GET', '/%2e%2e/package.json').matched, false, 'Path traversal must be rejected.');
  assert.equal(requestStatic('HEAD', '/').body, undefined, 'HEAD requests must not include a response body.');

  const api404 = {
    status: 0,
    headers: {},
    body: '',
    writeHead(status, headers) { this.status = status; this.headers = headers; },
    end(body) { this.body = body || ''; },
  };
  await apiRoutes.handleApi({ method: 'GET', headers: {} }, api404, new URL('http://localhost/api/no-such-endpoint'));
  assert.equal(api404.status, 404);
  assert.match(api404.headers['Content-Type'], /application\/json/);
  assert.equal(JSON.parse(api404.body).success, false);

  console.log('Frontend routing checks passed: root UI, nested SPA refresh, JS/CSS assets, missing asset, traversal guard, HEAD, and unknown API JSON 404.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
