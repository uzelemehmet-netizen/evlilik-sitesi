import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export default async function adminFeedbackList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  await requireAdmin(req);
  const body = normalizeBody(req);

  const kind = safeStr(body?.kind).toLowerCase();
  const status = safeStr(body?.status).toLowerCase();
  const qText = safeStr(body?.q);
  const limit = Math.min(200, Math.max(1, safeInt(body?.limit, 50)));

  const { db } = getAdmin();

  let ref = db.collection('matchmakingFeedback');

  if (kind) ref = ref.where('kind', '==', kind);
  if (status) ref = ref.where('status', '==', status);

  // Basit arama: q varsa, matchId veya userId eşleşirse filtrele (client-side).
  // Firestore contains sorgusu yok; minimal tutuyoruz.

  const snap = await ref.orderBy('createdAt', 'desc').limit(limit).get();
  const itemsRaw = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

  const items = qText
    ? itemsRaw.filter((x) => {
        const hay = `${safeStr(x?.id)} ${safeStr(x?.matchId)} ${safeStr(x?.userId)} ${safeStr(x?.userEmail)} ${safeStr(x?.step)}`.toLowerCase();
        return hay.includes(qText.toLowerCase());
      })
    : itemsRaw;

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, items }));
}
