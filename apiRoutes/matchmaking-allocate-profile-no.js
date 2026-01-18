import { getAdmin, requireIdToken } from './_firebaseAdmin.js';

function isNonAnonymous(decoded) {
  const provider = decoded?.firebase?.sign_in_provider;
  return provider && provider !== 'anonymous';
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
    if (!isNonAnonymous(decoded)) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'anonymous_not_allowed' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('counters').doc('matchmakingProfileNo');

    const allocated = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const cur = snap.exists ? (snap.data() || {}) : {};
      const next = typeof cur.next === 'number' && Number.isFinite(cur.next) ? cur.next : 10000;
      const value = next;
      tx.set(
        ref,
        {
          next: value + 1,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: decoded.uid,
        },
        { merge: true }
      );
      return value;
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, profileNo: allocated }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
