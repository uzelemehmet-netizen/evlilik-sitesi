import process from 'node:process';

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

function tsToMs(v) {
  try {
    if (!v) return null;
    if (typeof v?.toMillis === 'function') return v.toMillis();
    if (typeof v === 'number') return v;
  } catch {
    // ignore
  }
  return null;
}

function parseArgs(argv) {
  const out = {
    limit: 50,
    baseLimit: 600,
    sinceHours: 48,
    kind: '',
    country: '',
    flow: '',
    q: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--limit') out.limit = Math.min(300, Math.max(1, toInt(argv[i + 1], out.limit)));
    if (a === '--baseLimit') out.baseLimit = Math.min(2500, Math.max(50, toInt(argv[i + 1], out.baseLimit)));
    if (a === '--sinceHours') out.sinceHours = Math.min(24 * 30, Math.max(1, toInt(argv[i + 1], out.sinceHours)));
    if (a === '--kind') out.kind = safeStr(argv[i + 1] || '');
    if (a === '--country') out.country = safeStr(argv[i + 1] || '');
    if (a === '--flow') out.flow = safeStr(argv[i + 1] || '');
    if (a === '--q') out.q = safeStr(argv[i + 1] || '');
  }

  return out;
}

function pickCountry(row) {
  const a = safeStr(row?.data?.server?.country);
  const b = safeStr(row?.context?.server?.country);
  return a || b || 'UN';
}

function pickReport(row) {
  return row?.data?.report || {};
}

function pickExtra(row) {
  return row?.data?.extra || {};
}

function matchesQ(row, qLower) {
  if (!qLower) return true;
  const report = pickReport(row);
  const extra = pickExtra(row);

  const hay = [
    safeStr(row?.id),
    safeStr(row?.step),
    safeStr(row?.pagePath),
    safeStr(report?.kind),
    safeStr(report?.flow),
    safeStr(report?.code),
    safeStr(report?.message),
    safeStr(extra?.directive),
    safeStr(extra?.blockedHost),
    safeStr(extra?.blockedUrlHint),
    safeStr(extra?.authClass),
    safeStr(extra?.authProvider),
    safeStr(extra?.authTransport),
  ]
    .join(' ')
    .toLowerCase();

  return hay.includes(qLower);
}

function inc(map, key) {
  const k = safeStr(key) || 'unknown';
  map.set(k, (map.get(k) || 0) + 1);
}

const args = parseArgs(process.argv.slice(2));
const { db, projectId } = getAdmin();

const now = Date.now();
const sinceMs = now - args.sinceHours * 60 * 60 * 1000;

// Fetch recent window and filter in memory (avoids composite index requirements).
const snap = await db.collection('matchmakingFeedback').orderBy('createdAt', 'desc').limit(args.baseLimit).get();
const rowsRaw = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

const kindLower = safeStr(args.kind).toLowerCase();
const countryUpper = safeStr(args.country).toUpperCase();
const flowLower = safeStr(args.flow).toLowerCase();
const qLower = safeStr(args.q).toLowerCase();

const rowsFiltered = rowsRaw
  .filter((r) => safeStr(r?.step).startsWith('auto_error:'))
  .filter((r) => {
    const createdAtMs = tsToMs(r?.createdAt) || 0;
    if (createdAtMs && createdAtMs < sinceMs) return false;

    const report = pickReport(r);
    const k = safeStr(report?.kind).toLowerCase();
    const f = safeStr(report?.flow).toLowerCase();

    if (kindLower && k !== kindLower) return false;
    if (flowLower && f !== flowLower) return false;

    const c = pickCountry(r).toUpperCase();
    if (countryUpper && c !== countryUpper) return false;

    if (!matchesQ(r, qLower)) return false;

    return true;
  })
  .slice(0, args.limit);

const byCountry = new Map();
const byKind = new Map();
const byAuthClass = new Map();
const byDirective = new Map();
const byCode = new Map();

for (const r of rowsFiltered) {
  const report = pickReport(r);
  const extra = pickExtra(r);

  inc(byCountry, pickCountry(r));
  inc(byKind, report?.kind);
  inc(byAuthClass, extra?.authClass);
  inc(byDirective, extra?.directive);
  inc(byCode, report?.code);
}

function topN(map, n = 12) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => ({ key: k, count: v }));
}

// eslint-disable-next-line no-console
console.log(
  JSON.stringify(
    {
      ok: true,
      projectId,
      fetched: rowsRaw.length,
      shown: rowsFiltered.length,
      sinceHours: args.sinceHours,
      top: {
        country: topN(byCountry, 12),
        kind: topN(byKind, 12),
        authClass: topN(byAuthClass, 12),
        directive: topN(byDirective, 12),
        code: topN(byCode, 12),
      },
    },
    null,
    2
  )
);

for (const r of rowsFiltered) {
  const report = pickReport(r);
  const extra = pickExtra(r);

  const createdAt = fmtTs(r?.createdAt) || '-';
  const country = pickCountry(r);
  const kind = safeStr(report?.kind) || '-';
  const flow = safeStr(report?.flow) || '-';
  const code = safeStr(report?.code) || '-';
  const pagePath = safeStr(r?.pagePath) || '-';

  const directive = safeStr(extra?.directive) || '-';
  const blocked = safeStr(extra?.blockedUrlHint) || safeStr(extra?.blockedHost) || '-';
  const authClass = safeStr(extra?.authClass) || '-';
  const authTransport = safeStr(extra?.authTransport) || '-';

  // eslint-disable-next-line no-console
  console.log(
    [
      `- id=${safeStr(r.id)}`,
      `createdAt=${createdAt}`,
      `country=${country}`,
      `pagePath=${pagePath}`,
      `kind=${kind}`,
      `flow=${flow}`,
      `code=${code}`,
      `authClass=${authClass}`,
      `authTransport=${authTransport}`,
      `directive=${directive}`,
      `blocked=${blocked}`,
    ].join(' | ')
  );
}

if (!rowsFiltered.length) {
  // eslint-disable-next-line no-console
  console.log(
    '\nNot: Kayıt yoksa şunları deneyin:\n' +
      '- --sinceHours 168 (7 gün)\n' +
      '- --baseLimit 2000\n' +
      '- --country ID\n' +
      '- --q auth veya --q csp\n'
  );
}
