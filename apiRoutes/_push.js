import crypto from 'node:crypto';
import { getMessaging } from 'firebase-admin/messaging';
import { getAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function isInvalidTokenError(err) {
  const code = safeStr(err?.code);
  const msg = safeStr(err?.message);

  // firebase-admin error codes vary by version; keep broad matching.
  if (code.includes('registration-token-not-registered')) return true;
  if (code.includes('invalid-registration-token')) return true;
  if (code.includes('invalid-argument')) return true;
  if (/not registered/i.test(msg)) return true;
  if (/invalid registration token/i.test(msg)) return true;
  return false;
}

export async function sendPushToUid({
  uid,
  title,
  body,
  url,
  type,
  icon = '/pwa-192x192.png?v=20260224-1',
  badge = '/pwa-64x64.png?v=20260224-1',
  data = {},
} = {}) {
  const targetUid = safeStr(uid);
  if (!targetUid) return { ok: false, error: 'missing_uid' };

  const cleanTitle = safeStr(title) || 'Uniqah';
  const cleanBody = safeStr(body);
  const clickUrl = safeStr(url) || '/profilim';
  const cleanType = safeStr(type) || 'event';

  const { db } = getAdmin();

  const tokensSnap = await db
    .collection('matchmakingUsers')
    .doc(targetUid)
    .collection('pushTokens')
    .limit(30)
    .get();

  const tokenItems = tokensSnap.docs
    .map((d) => ({ id: d.id, token: safeStr(d.data()?.token) }))
    .filter((x) => x.token);

  if (!tokenItems.length) return { ok: false, error: 'no_tokens' };

  const tokens = tokenItems.map((x) => x.token);

  const messaging = getMessaging();

  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: cleanTitle,
      body: cleanBody,
    },
    data: {
      url: clickUrl,
      type: cleanType,
      ...Object.fromEntries(
        Object.entries(data || {}).map(([k, v]) => [String(k), safeStr(v) || String(v ?? '')])
      ),
    },
    webpush: {
      fcmOptions: {
        link: clickUrl,
      },
      notification: {
        icon,
        badge,
        data: { url: clickUrl },
      },
    },
  });

  // Best-effort cleanup: drop invalid tokens so future sends succeed.
  try {
    const toDelete = [];
    for (let i = 0; i < (result.responses || []).length; i++) {
      const r = result.responses[i];
      if (r?.success) continue;
      if (!isInvalidTokenError(r?.error)) continue;

      const token = tokens[i];
      const tokenId = hashToken(token);
      toDelete.push(tokenId);
    }

    if (toDelete.length) {
      const batch = db.batch();
      const userRef = db.collection('matchmakingUsers').doc(targetUid);
      for (const tokenId of toDelete.slice(0, 20)) {
        batch.delete(userRef.collection('pushTokens').doc(tokenId));
      }
      await batch.commit().catch(() => null);
    }
  } catch {
    // ignore
  }

  return {
    ok: true,
    successCount: result.successCount || 0,
    failureCount: result.failureCount || 0,
  };
}
