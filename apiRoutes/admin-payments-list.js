import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { maskEmail } from './_pii.js';

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

function pickPayment(docId, data) {
  const d = data || {};
  const createdAtMs = tsToMs(d.createdAt) || tsToMs(d.updatedAt) || 0;
  const updatedAtMs = tsToMs(d.updatedAt) || 0;

  return {
    id: String(docId || ''),
    userId: safeStr(d.userId) || null,
    userEmail: safeStr(d.userEmail) ? maskEmail(d.userEmail) : null,
    status: safeStr(d.status) || null,
    tier: safeStr(d.tier) || null,
    amount: typeof d.amount === 'number' && Number.isFinite(d.amount) ? d.amount : null,
    currency: safeStr(d.currency) || null,
    provider: safeStr(d.provider) || null,
    createdAtMs: createdAtMs || null,
    updatedAtMs: updatedAtMs || null,
    decidedBy: safeStr(d.decidedBy) || null,
    decidedAtMs: tsToMs(d.decidedAt) || null,
  };
}

export default async function adminPaymentsList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  await requireAdmin(req);
  const body = normalizeBody(req);

  const status = safeStr(body?.status).toLowerCase(); // optional
  const qText = safeStr(body?.q).toLowerCase(); // optional
  const limit = Math.min(300, Math.max(1, safeInt(body?.limit, 100)));

  const { db } = getAdmin();

  // Index istememek için: önce createdAt ile son N kaydı al, filtreyi JS'te uygula.
  const snap = await db.collection('matchmakingPayments').orderBy('createdAt', 'desc').limit(limit).get();

  const raw = snap.docs.map((d) => pickPayment(d.id, d.data()));

  const items = raw.filter((x) => {
    if (status && safeStr(x?.status).toLowerCase() !== status) return false;
    if (!qText) return true;

    const hay = `${safeStr(x?.id)} ${safeStr(x?.userId)} ${safeStr(x?.userEmail)} ${safeStr(x?.provider)} ${safeStr(x?.tier)}`.toLowerCase();
    return hay.includes(qText);
  });

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, items }));
}
