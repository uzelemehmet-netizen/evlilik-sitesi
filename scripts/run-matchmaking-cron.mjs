import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
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
      if (current === undefined || String(current).trim() === '') {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore
  }
}

function readDevApiPortFromFile() {
  try {
    const portFile = path.join(process.cwd(), '.tmp-dev-api-port');
    const raw = fs.readFileSync(portFile, 'utf8');
    const port = Number(String(raw || '').trim());
    return Number.isFinite(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
}

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

function asNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function usageAndExit() {
  console.log('Usage:');
  console.log('  node scripts/run-matchmaking-cron.mjs');
  console.log('  node scripts/run-matchmaking-cron.mjs --url http://127.0.0.1:5173');
  console.log('  node scripts/run-matchmaking-cron.mjs --threshold 70 --limitApps 400');
  console.log('');
  console.log('Notes:');
  console.log('  - Requires MATCHMAKING_CRON_SECRET in environment (.env.local)');
  console.log('  - Calls POST /api/matchmaking-run with header x-cron-secret');
  process.exit(1);
}

const threshold = asNum(argValue('--threshold'), 70);
const limitApps = asNum(argValue('--limitApps'), 400);
const urlArg = argValue('--url');

loadEnvLocal();

const secret = process.env.MATCHMAKING_CRON_SECRET || '';
if (!secret) {
  console.error('[cron-run] missing env: MATCHMAKING_CRON_SECRET');
  usageAndExit();
}

const devApiPort = readDevApiPortFromFile();
const defaultUrl = devApiPort ? `http://127.0.0.1:${devApiPort}` : 'http://127.0.0.1:3000';
const baseUrl = String(urlArg || defaultUrl).replace(/\/$/, '');

const endpoint = `${baseUrl}/api/matchmaking-run`;

const res = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-cron-secret': secret,
  },
  body: JSON.stringify({ threshold, limitApps }),
});

const text = await res.text();
let json = null;
try {
  json = JSON.parse(text);
} catch {
  json = null;
}

if (!res.ok) {
  console.error('[cron-run] failed:', res.status, res.statusText);
  if (json) console.error(JSON.stringify(json, null, 2));
  else console.error(text);
  process.exit(2);
}

console.log('[cron-run] ok:', endpoint);
if (json) console.log(JSON.stringify(json, null, 2));
else console.log(text);
