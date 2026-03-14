import crypto from 'node:crypto';
import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { sendPushToUid } from './_push.js';

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

  const nowMs = Date.now();
  let shouldSendWelcome = false;

  await db.runTransaction(async (tx) => {
    const [userSnap, tokenSnap] = await Promise.all([tx.get(userRef), tx.get(tokenRef)]);
    const user = userSnap.exists ? userSnap.data() || {} : {};

    const prevWelcome = user?.push && typeof user.push === 'object' ? user.push.welcomeSentAtMs : 0;
    const welcomeAlreadySent = typeof prevWelcome === 'number' && Number.isFinite(prevWelcome) && prevWelcome > 0;

    const isNewToken = !tokenSnap.exists;
    if (!welcomeAlreadySent && isNewToken) shouldSendWelcome = true;

    tx.set(
      userRef,
      {
        push: {
          enabled: true,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
          ...(shouldSendWelcome
            ? {
                welcomeSentAt: FieldValue.serverTimestamp(),
                welcomeSentAtMs: nowMs,
              }
            : {}),
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
      },
      { merge: true }
    );

    tx.set(
      tokenRef,
      {
        token,
        userAgent: ua,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
        ...(isNewToken
          ? {
              createdAt: FieldValue.serverTimestamp(),
              createdAtMs: nowMs,
            }
          : {}),
      },
      { merge: true }
    );
  });

  if (shouldSendWelcome) {
    await sendPushToUid({
      uid,
      title: 'Bildirimler aktif',
      body: 'Yeni mesaj ve istekleri bildirim olarak göndereceğiz.',
      url: '/app/matches',
      type: 'push_enabled',
      data: { source: 'push-token-upsert' },
    }).catch(() => null);
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, welcomeSent: shouldSendWelcome }));
}
