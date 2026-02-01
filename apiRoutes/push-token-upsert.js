import crypto from 'node:crypto';
import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export default async function pushTokenUpsert(req, res) {
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
  const token = String(body?.token || '').trim();
  if (!token) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'missing_token' }));
    return;
  }

  const { db, FieldValue } = getAdmin();

  const tokenId = hashToken(token);
  const userRef = db.collection('matchmakingUsers').doc(uid);
  const tokenRef = userRef.collection('pushTokens').doc(tokenId);

  const ua = String(req?.headers?.['user-agent'] || req?.headers?.['User-Agent'] || '').slice(0, 400);

  // matchmakingUsers dokümanı yoksa da merge ile yarat.
  await userRef.set(
    {
      push: {
        enabled: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await tokenRef.set(
    {
      token,
      userAgent: ua,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}
