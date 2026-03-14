import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);

    const body = normalizeBody(req);
    const daysRaw = safeInt(body?.days, 2);
    const limitRaw = safeInt(body?.limit, 400);

    const days = Math.min(Math.max(daysRaw || 2, 1), 14);
    const limit = Math.min(Math.max(limitRaw || 400, 50), 1000);

    const nowMs = Date.now();
    const minMs = nowMs - days * 24 * 60 * 60 * 1000;

    const { db } = getAdmin();

    // Note: Query relies on the single-field index on createdAtMs.
    const snap = await db
      .collection('clickTrace')
      .where('createdAtMs', '>=', minMs)
      .orderBy('createdAtMs', 'desc')
      .limit(limit)
      .get();

    const events = [];
    for (const doc of snap.docs) {
      const d = doc.data() || {};
      events.push({
        id: doc.id,
        createdAtMs: typeof d.createdAtMs === 'number' ? d.createdAtMs : null,
        dayKey: typeof d.dayKey === 'string' ? d.dayKey : '',
        eventKey: typeof d.eventKey === 'string' ? d.eventKey : '',
        anonId: typeof d.anonId === 'string' ? d.anonId : '',
        page: typeof d.page === 'string' ? d.page : null,
        country: typeof d.country === 'string' ? d.country : 'UN',
        lang: typeof d.lang === 'string' ? d.lang : null,
        tz: typeof d.tz === 'string' ? d.tz : null,
        tzOffsetMin: typeof d.tzOffsetMin === 'number' ? d.tzOffsetMin : null,
      });
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ ok: true, days, limit, minMs, count: events.length, events }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
