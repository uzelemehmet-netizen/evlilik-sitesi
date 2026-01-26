import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { isMembershipActive } from './_matchmakingEligibility.js';
import { getMembershipPlan } from './_translationPolicy.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function nowMs() {
  return Date.now();
}

// Bu endpoint: bir match için sponsorlu çeviriyi (karşı tarafın kotasından düşen) aç/kapatır.
// Not: Çeviri tamamen kapanmaz; kullanıcı kendi self kotası ile devam edebilir.

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
    const targetUserId = safeStr(body?.targetUserId);
    // enabled=true => karşı taraf için çeviri tekrar aç (revoked=false)
    // enabled=false/undefined => karşı taraf için çeviri kapat (revoked=true) (geri uyumlu)
    const enabled = body?.enabled === undefined ? false : !!body.enabled;

    if (!matchId || !targetUserId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    const matchRef = db.collection('matchmakingMatches').doc(matchId);
    const meRef = db.collection('matchmakingUsers').doc(uid);
    const targetRef = db.collection('matchmakingUsers').doc(targetUserId);

    const ts = nowMs();

    await db.runTransaction(async (tx) => {
      const [matchSnap, meSnap, targetSnap] = await Promise.all([tx.get(matchRef), tx.get(meRef), tx.get(targetRef)]);

      if (!matchSnap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const match = matchSnap.data() || {};
      const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
      if (userIds.length !== 2 || !userIds.includes(uid)) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }

      if (!userIds.includes(targetUserId) || targetUserId === uid) {
        const err = new Error('bad_request');
        err.statusCode = 400;
        throw err;
      }

      const me = meSnap.exists ? (meSnap.data() || {}) : {};

      // Sadece Pro üyeler sponsorlu çeviriyi match bazında aç/kapatabilsin.
      if (!isMembershipActive(me, ts)) {
        const err = new Error('membership_required');
        err.statusCode = 402;
        throw err;
      }

      const plan = getMembershipPlan(me);
      if (plan !== 'pro') {
        const err = new Error('pro_required');
        err.statusCode = 403;
        throw err;
      }

      const current = match?.translationAccess && typeof match.translationAccess === 'object' ? match.translationAccess : {};
      const next = {
        ...(current || {}),
        [targetUserId]: {
          ...(current?.[targetUserId] && typeof current[targetUserId] === 'object' ? current[targetUserId] : {}),
          granted: enabled,
          grantedAtMs: enabled ? ts : 0,
          grantedByUid: enabled ? uid : '',
          revoked: !enabled,
          revokedAtMs: enabled ? 0 : ts,
          revokedByUid: enabled ? '' : uid,
          unrevokedAtMs: enabled ? ts : 0,
          unrevokedByUid: enabled ? uid : '',
        },
      };

      tx.set(
        matchRef,
        {
          translationAccess: next,
          translationAccessUpdatedAtMs: ts,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, enabled }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
