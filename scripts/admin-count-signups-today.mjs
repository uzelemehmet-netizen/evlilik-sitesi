import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Reuse the same admin initialization logic used by API routes
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function toInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function parseArgs(argv) {
  const out = { tzOffsetMin: 180, date: null, limitPages: 500 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--tzOffsetMin') out.tzOffsetMin = toInt(argv[i + 1], out.tzOffsetMin);
    if (a === '--date') out.date = String(argv[i + 1] || '').trim() || null; // YYYY-MM-DD in TR day
    if (a === '--limitPages') out.limitPages = Math.max(1, toInt(argv[i + 1], out.limitPages));
  }
  return out;
}

function computeDayRangeUtcMs({ tzOffsetMin, date }) {
  const offsetMs = tzOffsetMin * 60 * 1000;

  // If date is provided, interpret it as a date in the target timezone (midnight at that tz).
  // We'll compute the corresponding UTC range.
  if (date) {
    const m = String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) throw new Error('bad_date_expected_YYYY-MM-DD');
    const y = Number(m[1]);
    const mon = Number(m[2]) - 1;
    const d = Number(m[3]);
    const startUtcMs = Date.UTC(y, mon, d, 0, 0, 0) - offsetMs;
    const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;
    return { startUtcMs, endUtcMs };
  }

  const now = Date.now();
  const tzNow = new Date(now + offsetMs);
  const y = tzNow.getUTCFullYear();
  const mon = tzNow.getUTCMonth();
  const d = tzNow.getUTCDate();
  const startUtcMs = Date.UTC(y, mon, d, 0, 0, 0) - offsetMs;
  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;
  return { startUtcMs, endUtcMs };
}

function safeMsFromAuthCreationTime(creationTime) {
  const s = typeof creationTime === 'string' ? creationTime.trim() : '';
  if (!s) return 0;
  const ms = new Date(s).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

async function main() {
  // Default to local repo secret file if env isn't set.
  // This keeps the command ergonomic for local usage.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE && !process.env.FIREBASE_SERVICE_ACCOUNT_FILE) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const defaultPath = path.resolve(__dirname, '../secrets/firebase-service-account.json');
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE = defaultPath;
  }

  const args = parseArgs(process.argv.slice(2));
  const { startUtcMs, endUtcMs } = computeDayRangeUtcMs({ tzOffsetMin: args.tzOffsetMin, date: args.date });

  const { auth, projectId } = getAdmin();

  let pageToken = undefined;
  let totalSeen = 0;
  let totalMatched = 0;
  let pages = 0;

  while (pages < args.limitPages) {
    pages += 1;
    const result = await auth.listUsers(1000, pageToken);
    const users = Array.isArray(result?.users) ? result.users : [];

    for (const u of users) {
      totalSeen += 1;
      const createdAtMs = safeMsFromAuthCreationTime(u?.metadata?.creationTime);
      if (createdAtMs >= startUtcMs && createdAtMs < endUtcMs) totalMatched += 1;
    }

    pageToken = result?.pageToken || null;
    if (!pageToken) break;
  }

  const payload = {
    ok: true,
    projectId: projectId || null,
    tzOffsetMin: args.tzOffsetMin,
    dayStartUtc: new Date(startUtcMs).toISOString(),
    dayEndUtc: new Date(endUtcMs).toISOString(),
    scannedUsers: totalSeen,
    signupsInDay: totalMatched,
    partial: !!pageToken,
    pagesScanned: pages,
  };

  process.stdout.write(JSON.stringify(payload, null, 2));
  process.stdout.write('\n');
}

main().catch((e) => {
  process.stderr.write(String(e?.stack || e?.message || e));
  process.stderr.write('\n');
  process.exitCode = 1;
});
