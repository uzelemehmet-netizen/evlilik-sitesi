import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { buildBlockedUsersPatch } from './_matchmakingBlocks.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function clearUserLockIfMatch(userDoc, matchId) {
  const lock = userDoc?.matchmakingLock && typeof userDoc.matchmakingLock === 'object' ? userDoc.matchmakingLock : null;
  const choice = userDoc?.matchmakingChoice && typeof userDoc.matchmakingChoice === 'object' ? userDoc.matchmakingChoice : null;

  const patch = {};
  if (safeStr(lock?.matchId) === matchId) patch.matchmakingLock = { active: false, matchId: '', matchCode: '' };
  if (safeStr(choice?.matchId) === matchId) patch.matchmakingChoice = { active: false, matchId: '', matchCode: '' };
  return patch;
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
    const uid = safeStr(decoded?.uid);
    const body = normalizeBody(req);

    const targetUid = safeStr(body?.targetUid);
    const reason = safeStr(body?.reason).slice(0, 500);
    const requestedMatchId = safeStr(body?.matchId);

    if (!uid || !targetUid || uid === targetUid) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const nowMs = Date.now();
    const matchId = requestedMatchId || [uid, targetUid].sort().join('__');

    const meRef = db.collection('matchmakingUsers').doc(uid);
    const targetRef = db.collection('matchmakingUsers').doc(targetUid);
    const matchRef = db.collection('matchmakingMatches').doc(matchId);

    const [meSnap, targetSnap, matchSnap] = await Promise.all([meRef.get(), targetRef.get(), matchRef.get()]);
    const me = meSnap.exists ? (meSnap.data() || {}) : {};
    const target = targetSnap.exists ? (targetSnap.data() || {}) : {};
    const match = matchSnap.exists ? (matchSnap.data() || {}) : null;

    await db.runTransaction(async (tx) => {
      const latestMeSnap = await tx.get(meRef);
      const latestMe = latestMeSnap.exists ? (latestMeSnap.data() || {}) : {};
      const patch = buildBlockedUsersPatch({ userDoc: latestMe, targetUid, matchId, reason, blockedAtMs: nowMs });

      tx.set(
        meRef,
        {
          ...patch,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    const batch = db.batch();

    if (match) {
      batch.set(
        matchRef,
        {
          status: 'cancelled',
          cancelledAt: FieldValue.serverTimestamp(),
          cancelledAtMs: nowMs,
          cancelledByUserId: uid,
          cancelledReason: 'blocked_user',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const meLockPatch = clearUserLockIfMatch(me, matchId);
    if (Object.keys(meLockPatch).length) {
      batch.set(meRef, { ...meLockPatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }

    const targetLockPatch = clearUserLockIfMatch(target, matchId);
    if (Object.keys(targetLockPatch).length) {
      batch.set(targetRef, { ...targetLockPatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }

    const directRefs = [
      db.collection('matchmakingUsers').doc(uid).collection('outboxPreMatchRequests').doc(`${uid}__${targetUid}`),
      db.collection('matchmakingUsers').doc(targetUid).collection('inboxPreMatchRequests').doc(`${uid}__${targetUid}`),
      db.collection('matchmakingUsers').doc(targetUid).collection('outboxPreMatchRequests').doc(`${targetUid}__${uid}`),
      db.collection('matchmakingUsers').doc(uid).collection('inboxPreMatchRequests').doc(`${targetUid}__${uid}`),
      db.collection('matchmakingUsers').doc(uid).collection('outboxAccessRequests').doc(`${uid}__${targetUid}`),
      db.collection('matchmakingUsers').doc(targetUid).collection('inboxAccessRequests').doc(`${uid}__${targetUid}`),
      db.collection('matchmakingUsers').doc(targetUid).collection('outboxAccessRequests').doc(`${targetUid}__${uid}`),
      db.collection('matchmakingUsers').doc(uid).collection('inboxAccessRequests').doc(`${targetUid}__${uid}`),
      db.collection('matchmakingUsers').doc(uid).collection('profileAccessGranted').doc(targetUid),
      db.collection('matchmakingUsers').doc(targetUid).collection('profileAccessGranted').doc(uid),
      db.collection('matchmakingUsers').doc(uid).collection('inboxLikes').doc(matchId),
      db.collection('matchmakingUsers').doc(targetUid).collection('inboxLikes').doc(matchId),
    ];

    directRefs.forEach((ref) => batch.delete(ref));
    await batch.commit();

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, blocked: true, targetUid, matchId }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}