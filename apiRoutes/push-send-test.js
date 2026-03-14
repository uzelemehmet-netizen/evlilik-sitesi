import { getMessaging } from 'firebase-admin/messaging';
import { getAdmin, normalizeBody, requireAdmin, requireIdToken } from './_firebaseAdmin.js';

export default async function pushSendTest(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const body = normalizeBody(req);

  // Default: user can only send to self.
  let decoded = null;
  let targetUid = '';

  // If uid provided, require admin.
  const uidArg = String(body?.uid || '').trim();
  if (uidArg) {
    decoded = await requireAdmin(req);
    targetUid = uidArg;
  } else {
    decoded = await requireIdToken(req);
    targetUid = String(decoded?.uid || '').trim();
  }

  if (!targetUid) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'missing_uid' }));
    return;
  }

  const title = String(body?.title || 'Uniqah').trim() || 'Uniqah';
  const msgBody = String(body?.body || 'Test bildirimi').trim() || 'Test bildirimi';
  const url = String(body?.url || '/profilim').trim() || '/profilim';

  const { db } = getAdmin();

  const tokensSnap = await db
    .collection('matchmakingUsers')
    .doc(targetUid)
    .collection('pushTokens')
    .limit(20)
    .get();

  const tokens = tokensSnap.docs
    .map((d) => String(d.data()?.token || '').trim())
    .filter(Boolean);

  if (!tokens.length) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'no_tokens' }));
    return;
  }

  const messaging = getMessaging();

  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body: msgBody,
    },
    data: {
      url,
      type: 'test',
    },
    webpush: {
      fcmOptions: {
        link: url,
      },
      notification: {
        icon: '/pwa-192x192.png?v=20260224-1',
        badge: '/pwa-64x64.png?v=20260224-1',
      },
    },
  });

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      successCount: result.successCount,
      failureCount: result.failureCount,
    })
  );
}
