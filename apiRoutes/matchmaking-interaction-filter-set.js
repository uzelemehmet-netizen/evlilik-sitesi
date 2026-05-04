import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { normalizeInteractionFilter } from './_matchmakingInteractionFilter.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = safeStr(decoded?.uid);
    if (!uid) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'not_authenticated' }));
      return;
    }

    const body = normalizeBody(req);
    const filter = normalizeInteractionFilter(body);

    const { db, FieldValue } = getAdmin();
    const nowMs = Date.now();

    await db.collection('matchmakingUsers').doc(uid).set(
      {
        interactionFilter: {
          ...filter,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
        },
      },
      { merge: true }
    );

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, filter }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: safeStr(e?.message) || 'server_error' }));
  }
}