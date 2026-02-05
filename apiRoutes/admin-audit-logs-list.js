import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function tsToMs(v) {
  try {
    if (!v) return 0;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v instanceof Date) return v.getTime();
    if (typeof v?.toMillis === 'function') return v.toMillis();
    const seconds = typeof v?.seconds === 'number' ? v.seconds : null;
    const nanos = typeof v?.nanoseconds === 'number' ? v.nanoseconds : 0;
    if (seconds !== null) return Math.floor(seconds * 1000 + nanos / 1e6);
    return 0;
  } catch {
    return 0;
  }
}

export default async function adminAuditLogsList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  await requireAdmin(req);
  const body = normalizeBody(req);

  const qText = safeStr(body?.q).toLowerCase();
  const limit = Math.min(300, Math.max(1, safeInt(body?.limit, 100)));

  const { db } = getAdmin();

  const snap = await db.collection('adminAuditLogs').orderBy('createdAt', 'desc').limit(limit).get();
  const raw = snap.docs.map((d) => {
    const x = d.data() || {};
    return {
      id: d.id,
      createdAtMs: tsToMs(x.createdAt) || null,
      adminUid: safeStr(x.adminUid) || null,
      adminEmail: safeStr(x.adminEmail) || null,
      action: safeStr(x.action) || null,
      targetUid: safeStr(x.targetUid) || null,
      ok: x.ok === true,
      error: safeStr(x.error) || null,
      meta: x.meta && typeof x.meta === 'object' ? x.meta : null,
    };
  });

  const items = qText
    ? raw.filter((x) => {
        const hay = `${safeStr(x?.id)} ${safeStr(x?.adminEmail)} ${safeStr(x?.action)} ${safeStr(x?.targetUid)} ${safeStr(x?.error)} ${JSON.stringify(x?.meta || {})}`.toLowerCase();
        return hay.includes(qText);
      })
    : raw;

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, items }));
}
