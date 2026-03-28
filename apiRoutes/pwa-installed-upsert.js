import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

export default async function pwaInstalledUpsert(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const decoded = await requireIdToken(req);
  const uid = String(decoded?.uid || '').trim();
  if (!uid) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'invalid_auth' }));
    return;
  }

  const body = normalizeBody(req);
  const sourceRaw = typeof body?.source === 'string' ? body.source.trim() : '';
  const source = sourceRaw ? sourceRaw.slice(0, 80) : 'unknown';

  const { db, FieldValue } = getAdmin();

  const nowMs = Date.now();
  const userRef = db.collection('matchmakingUsers').doc(uid);

  // Best-effort: record PWA installation signal for admin segmentation.
  await userRef.set(
    {
      pwa: {
        installed: true,
        installedAt: FieldValue.serverTimestamp(),
        installedAtMs: nowMs,
        source,
      },
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMs: nowMs,
    },
    { merge: true }
  );

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}
