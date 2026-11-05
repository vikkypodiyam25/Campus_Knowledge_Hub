const fs = require('node:fs');
const path = require('node:path');

function loadEnv() {
  const envCandidates = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '.env.example'),
  ];

  for (const envFile of envCandidates) {
    if (!fs.existsSync(envFile)) continue;

    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

module.exports = loadEnv;
