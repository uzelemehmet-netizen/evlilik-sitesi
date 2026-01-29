import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import handler from '../apiRoutes/matchmaking-run.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvLocal() {
  try {
    const envPath = path.join(projectRoot, '.env.local');
    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      const current = process.env[key];
      const shouldOverride = key.startsWith('FIREBASE_SERVICE_ACCOUNT');
      if (shouldOverride || current === undefined || String(current).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

class FakeRes {
  statusCode = 200;
  headers = {};
  body = '';

  setHeader(name, value) {
    this.headers[String(name).toLowerCase()] = value;
  }

  end(chunk = '') {
    this.body += String(chunk);
  }
}

async function main() {
  loadEnvLocal();

  const secret = process.env.MATCHMAKING_CRON_SECRET;
  if (!secret) {
    console.error(JSON.stringify({ ok: false, error: 'missing_MATCHMAKING_CRON_SECRET_in_env' }, null, 2));
    process.exitCode = 1;
    return;
  }

  const req = {
    method: 'POST',
    headers: {
      'x-cron-secret': secret,
      'user-agent': 'local-run-once-script',
    },
    query: {
      dryRun: '0',
      limitApps: '400',
      threshold: '70',
      includeSeeds: '0',
    },
    body: { dryRun: false },
  };

  const res = new FakeRes();
  await handler(req, res);

  let parsed = null;
  try {
    parsed = JSON.parse(res.body);
  } catch {
    parsed = { raw: res.body };
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        httpStatus: res.statusCode,
        response: parsed,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error('matchmaking-run-local-once failed:', e?.message || e);
  process.exitCode = 1;
});
