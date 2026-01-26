import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const body = normalizeBody(req);
    const matchId = safeStr(body?.matchId);

    if (!matchId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const matchRef = db.collection('matchmakingMatches').doc(matchId);

    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'not_found' }));
      return;
    }

    const match = matchSnap.data() || {};
    const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
    if (userIds.length !== 2 || !userIds.includes(uid)) {
      res.statusCode = 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'forbidden' }));
      return;
    }

    // En fazla 200 mesajı serbest bırak (ekran açılışında yeterli).
    const q = matchRef
      .collection('messages')
      .where('delivery.state', '==', 'held')
      .where('delivery.heldForUid', '==', uid)
      .limit(200);

    const snap = await q.get();
    const docs = snap.docs || [];

    if (!docs.length) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, released: 0 }));
      return;
    }

    const now = Date.now();
    const batch = db.batch();
    for (const d of docs) {
      batch.set(
        d.ref,
        {
          delivery: {
            state: 'delivered',
            deliveredAt: FieldValue.serverTimestamp(),
            deliveredAtMs: now,
            releasedByUid: uid,
          },
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: now,
        },
        { merge: true }
      );
    }

    await batch.commit();

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, released: docs.length }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
