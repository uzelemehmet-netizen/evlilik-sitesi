import process from 'node:process';

// Reuse the same admin initialization logic used by API routes
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function toInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function fmtTs(v) {
  try {
    if (!v) return '';
    if (typeof v?.toMillis === 'function') return new Date(v.toMillis()).toISOString();
    if (typeof v === 'number') return new Date(v).toISOString();
  } catch {
    // ignore
  }
  return '';
}

function truncate(s, n) {
  const t = safeStr(s);
  if (!t) return '';
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function parseArgs(argv) {
  const out = {
    limit: 20,
    status: '',
    kind: '',
    q: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--limit') out.limit = Math.min(200, Math.max(1, toInt(argv[i + 1], out.limit)));
    if (a === '--status') out.status = safeStr(argv[i + 1] || '');
    if (a === '--kind') out.kind = safeStr(argv[i + 1] || '');
    if (a === '--q') out.q = safeStr(argv[i + 1] || '');
  }
  return out;
}

function matchesQ(doc, qLower) {
  if (!qLower) return true;
  const hay = `${safeStr(doc?.id)} ${safeStr(doc?.matchId)} ${safeStr(doc?.userId)} ${safeStr(doc?.userEmail)} ${safeStr(doc?.step)} ${safeStr(doc?.text)} ${safeStr(doc?.message)}`.toLowerCase();
  return hay.includes(qLower);
}

const args = parseArgs(process.argv.slice(2));
const { db, projectId } = getAdmin();

// Fetch a recent window and filter in memory (avoids composite index requirements).
const baseLimit = Math.min(500, Math.max(50, args.limit * 10));
const snap = await db.collection('matchmakingFeedback').orderBy('createdAt', 'desc').limit(baseLimit).get();
const rowsRaw = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

const statusLower = safeStr(args.status).toLowerCase();
const kindLower = safeStr(args.kind).toLowerCase();
const qLower = safeStr(args.q).toLowerCase();

const rows = rowsRaw
  .filter((r) => {
    if (kindLower && safeStr(r?.kind).toLowerCase() !== kindLower) return false;
    if (statusLower && safeStr(r?.status).toLowerCase() !== statusLower) return false;
    if (!matchesQ(r, qLower)) return false;
    return true;
  })
  .slice(0, args.limit);

// eslint-disable-next-line no-console
console.log(JSON.stringify({ ok: true, projectId, fetched: rowsRaw.length, shown: rows.length }, null, 2));

for (const r of rows) {
  // eslint-disable-next-line no-console
  console.log(
    [
      `- id=${safeStr(r.id)}`,
      `kind=${safeStr(r.kind)}`,
      `status=${safeStr(r.status)}`,
      `step=${safeStr(r.step)}`,
      `createdAt=${fmtTs(r.createdAt) || '-'}`,
      `pagePath=${safeStr(r.pagePath) || '-'}`,
      `userId=${safeStr(r.userId) || '-'}`,
      `userEmail=${safeStr(r.userEmail) || '-'}`,
      `text=${truncate(r.text || r.message || '', 140)}`,
    ].join(' | ')
  );
}
