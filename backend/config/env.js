const fs = require('node:fs');
const path = require('node:path');

function loadEnv() {
  const envCandidates = [
    path.resolve(__dirname, '..', '.env'),
  ];

  for (const envFile of envCandidates) {
    if (!fs.existsSync(envFile)) continue;

    for (const line of fs.readFileSync(envFile, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      const value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        process.env[match[1]] = value.slice(1, -1);
      } else {
        process.env[match[1]] = value.replace(/\s+#.*$/, '').trim();
      }
    }
  }
}

module.exports = loadEnv;
