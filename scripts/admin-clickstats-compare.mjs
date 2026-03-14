import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function num(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
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

function diffSnapshot(prev, cur) {
  const prevSummary = Array.isArray(prev?.summary) ? prev.summary : [];
  const curSummary = Array.isArray(cur?.summary) ? cur.summary : [];

  const prevByDay = new Map(prevSummary.map((x) => [safeStr(x?.dayKey), x]));
  const curByDay = new Map(curSummary.map((x) => [safeStr(x?.dayKey), x]));
  const days = Array.from(curByDay.keys())
    .filter(Boolean)
    .sort()
    .reverse();

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
    .slice(0, 30);

  return { daysDelta: out, latestDayKey: latest, topEventsDelta };
}

function parseArgs(argv) {
  const out = { a: '', b: '', latest2: false };
  for (let i = 0; i < argv.length; i += 1) {
    const x = argv[i];
    if (x === '--a') out.a = safeStr(argv[i + 1] || '');
    if (x === '--b') out.b = safeStr(argv[i + 1] || '');
    if (x === '--latest2') out.latest2 = true;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const projectRoot = process.cwd();
const snapshotsDir = path.join(projectRoot, 'internal', 'clickstats-snapshots');

let aPath = args.a;
let bPath = args.b;

if (args.latest2) {
  const files = fs.existsSync(snapshotsDir)
    ? fs
        .readdirSync(snapshotsDir)
        .filter((n) => n.endsWith('.json'))
        .map((n) => path.join(snapshotsDir, n))
        .sort()
    : [];

  if (files.length < 2) {
    process.stderr.write(
      JSON.stringify(
        {
          ok: false,
          error: 'not_enough_snapshots',
          message:
            'Son iki snapshot ile kıyas için en az 2 dosya gerekli. Önce tekrar snapshot alın (örn. 10-30 dk sonra) ve ardından compare çalıştırın.',
          snapshotsDir,
          found: files.length,
          files,
          hint: 'npm run admin:clickstats:snapshot',
        },
        null,
        2
      )
    );
    process.stderr.write('\n');
    process.exit(2);
  }

  aPath = files.length >= 2 ? files[files.length - 2] : '';
  bPath = files.length >= 1 ? files[files.length - 1] : '';
}

if (!aPath || !bPath) {
  process.stderr.write('usage: node scripts/admin-clickstats-compare.mjs --latest2 OR --a <file> --b <file>\n');
  process.exit(2);
}

const prev = JSON.parse(fs.readFileSync(aPath, 'utf8'));
const cur = JSON.parse(fs.readFileSync(bPath, 'utf8'));
const diff = diffSnapshot(prev, cur);

process.stdout.write(
  JSON.stringify(
    {
      ok: true,
      a: aPath,
      b: bPath,
      projectIdA: safeStr(prev?.projectId) || null,
      projectIdB: safeStr(cur?.projectId) || null,
      diff,
    },
    null,
    2
  )
);
process.stdout.write('\n');
