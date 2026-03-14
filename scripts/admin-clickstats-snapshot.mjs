import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function isoStampCompact(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const hh = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function listSnapshotFiles(dir) {
  try {
    const names = fs.readdirSync(dir);
    return names
      .filter((n) => n.endsWith('.json'))
      .map((n) => path.join(dir, n))
      .sort();
  } catch {
    return [];
  }
}

function toMapTopEvents(arr) {
  const map = new Map();
  const list = Array.isArray(arr) ? arr : [];
  for (const it of list) {
    const k = safeStr(it?.eventKey);
    const v = typeof it?.total === 'number' && Number.isFinite(it.total) ? it.total : 0;
    if (!k) continue;
    map.set(k, v);
  }
  return map;
}

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function diffSnapshot(prev, cur) {
  const prevSummary = Array.isArray(prev?.summary) ? prev.summary : [];
  const curSummary = Array.isArray(cur?.summary) ? cur.summary : [];

  const prevByDay = new Map(prevSummary.map((x) => [safeStr(x?.dayKey), x]));
  const curByDay = new Map(curSummary.map((x) => [safeStr(x?.dayKey), x]));
  const days = Array.from(curByDay.keys()).filter(Boolean);

  const out = [];
  for (const dayKey of days) {
    const a = prevByDay.get(dayKey) || null;
    const b = curByDay.get(dayKey) || null;
    if (!b) continue;

    const af = a?.funnel || {};
    const bf = b?.funnel || {};

    out.push({
      dayKey,
      totalUnique: num(b?.totalUnique) - num(a?.totalUnique),
      session_start: num(bf?.session_start) - num(af?.session_start),
      landing_clickid: num(bf?.landing_clickid) - num(af?.landing_clickid),
      landing_ref: num(bf?.landing_ref) - num(af?.landing_ref),
      landing_login_signup: num(bf?.landing_login_signup) - num(af?.landing_login_signup),
      landing_login_login: num(bf?.landing_login_login) - num(af?.landing_login_login),
      signup_start_google: num(bf?.signup_start_google) - num(af?.signup_start_google),
      signup_start_email: num(bf?.signup_start_email) - num(af?.signup_start_email),
      signup_success: num(bf?.signup_success) - num(af?.signup_success),
      signup_error: num(bf?.signup_error) - num(af?.signup_error),
    });
  }

  // Latest day topEvents delta (helps spot ad click changes like landing_clickid:*).
  const latest = days[0] || '';
  const prevDay = latest ? prevByDay.get(latest) : null;
  const curDay = latest ? curByDay.get(latest) : null;
  const prevEvents = toMapTopEvents(prevDay?.topEvents);
  const curEvents = toMapTopEvents(curDay?.topEvents);
  const keys = new Set([...prevEvents.keys(), ...curEvents.keys()]);
  const topEventsDelta = Array.from(keys)
    .map((k) => ({
      eventKey: k,
      delta: num(curEvents.get(k)) - num(prevEvents.get(k)),
      cur: num(curEvents.get(k)),
      prev: num(prevEvents.get(k)),
    }))
    .filter((x) => x.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 20);

  return { daysDelta: out, latestDayKey: latest, topEventsDelta };
}

const projectRoot = process.cwd();
const snapshotsDir = path.join(projectRoot, 'internal', 'clickstats-snapshots');
fs.mkdirSync(snapshotsDir, { recursive: true });

// Forward args to the dump script (e.g. --days 7 ...)
const forwardArgs = process.argv.slice(2);
const dumpScript = path.join(projectRoot, 'scripts', 'admin-click-stats-dump.mjs');

const r = spawnSync('node', [dumpScript, ...forwardArgs], {
  encoding: 'utf8',
  cwd: projectRoot,
  env: { ...process.env },
});

if (r.status !== 0) {
  process.stderr.write(String(r.stderr || r.stdout || 'clickstats_dump_failed'));
  process.stderr.write('\n');
  process.exitCode = typeof r.status === 'number' ? r.status : 1;
  process.exit(process.exitCode);
}

let json = null;
try {
  json = JSON.parse(String(r.stdout || '').trim());
} catch {
  process.stderr.write('clickstats_dump_output_not_json\n');
  process.stderr.write(String(r.stdout || '').slice(0, 1200));
  process.stderr.write('\n');
  process.exitCode = 1;
  process.exit(1);
}

const stamp = isoStampCompact(new Date());
const filePath = path.join(snapshotsDir, `clickstats-${stamp}.json`);
fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');

const files = listSnapshotFiles(snapshotsDir);
const prevPath = files.length >= 2 ? files[files.length - 2] : '';

const out = { ok: true, saved: filePath, projectId: safeStr(json?.projectId) || null };

if (prevPath) {
  try {
    const prev = JSON.parse(fs.readFileSync(prevPath, 'utf8'));
    const diff = diffSnapshot(prev, json);
    out.prev = prevPath;
    out.diff = diff;
  } catch {
    // ignore diff errors
  }
}

process.stdout.write(JSON.stringify(out, null, 2));
process.stdout.write('\n');
