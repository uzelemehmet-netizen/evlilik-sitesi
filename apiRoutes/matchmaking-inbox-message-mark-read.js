import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function nowMs() {
  return Date.now();
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

    const body = normalizeBody(req);
    const messageId = safeStr(body?.messageId);

    if (!uid || !messageId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    const inboxRef = db.collection('matchmakingUsers').doc(uid).collection('inboxMessages').doc(messageId);
    const ts = nowMs();

    let didUpdate = false;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(inboxRef);
      if (!snap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const cur = snap.data() || {};
      const toUid = safeStr(cur?.toUid);
      if (toUid && toUid !== uid) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }

      const readMs = typeof cur?.readAtMs === 'number' && Number.isFinite(cur.readAtMs) ? cur.readAtMs : 0;
      if (readMs > 0) return;

      tx.set(
        inboxRef,
        {
          readAt: FieldValue.serverTimestamp(),
          readAtMs: ts,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: ts,
        },
        { merge: true }
      );

      didUpdate = true;
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, updated: didUpdate }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
