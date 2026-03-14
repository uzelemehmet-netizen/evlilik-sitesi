import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function toMillis(tsLike) {
  try {
    if (!tsLike) return 0;
    if (typeof tsLike?.toMillis === 'function') return tsLike.toMillis() || 0;
    const s = tsLike?._seconds ?? tsLike?.seconds;
    const ns = tsLike?._nanoseconds ?? tsLike?.nanoseconds;
    if (typeof s === 'number' && Number.isFinite(s)) {
      const n = typeof ns === 'number' && Number.isFinite(ns) ? ns : 0;
      return Math.floor(s * 1000 + n / 1e6);
    }
    if (typeof tsLike === 'number' && Number.isFinite(tsLike)) return Math.floor(tsLike);
    return 0;
  } catch {
    return 0;
  }
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

  // IMPORTANT: Firestore requires composite indexes for queries like
  //   where('status','==',...) + orderBy('createdAt','desc')
  // To keep admin panel working without manual index setup, we fetch a recent window
  // ordered by createdAt and apply filters in memory.
  const baseLimit = Math.min(500, Math.max(50, limit * 5));
  const ref = db.collection('matchmakingFeedback');

  const snap = await ref.orderBy('createdAt', 'desc').limit(baseLimit).get();
  const itemsRaw = snap.docs.map((d) => {
    const data = d.data() || {};
    return {
      id: d.id,
      ...data,
      // JSON ile gelirken Timestamp metodları kayboluyor; ms olarak gönder.
      createdAt: toMillis(data?.createdAt),
      updatedAt: toMillis(data?.updatedAt),
    };
  });

  const qLower = qText ? qText.toLowerCase() : '';
  const itemsFiltered = itemsRaw.filter((x) => {
    if (kind && safeStr(x?.kind).toLowerCase() !== kind) return false;
    if (status && safeStr(x?.status).toLowerCase() !== status) return false;
    if (qLower) {
      const hay = `${safeStr(x?.id)} ${safeStr(x?.matchId)} ${safeStr(x?.userId)} ${safeStr(x?.userEmail)} ${safeStr(x?.step)}`.toLowerCase();
      if (!hay.includes(qLower)) return false;
    }
    return true;
  });

  const items = itemsFiltered.slice(0, limit);

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, items }));
}
