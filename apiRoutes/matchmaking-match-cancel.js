import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function nowMs() {
  return Date.now();
}

function clearUserLockIfMatch(userDoc, matchId) {
  const lock = userDoc?.matchmakingLock || null;
  const choice = userDoc?.matchmakingChoice || null;

  const lockMatchId = safeStr(lock?.matchId);
  const choiceMatchId = safeStr(choice?.matchId);

  const patch = {};
  if (lockMatchId === matchId) patch.matchmakingLock = { active: false, matchId: '', matchCode: '' };
  if (choiceMatchId === matchId) patch.matchmakingChoice = { active: false, matchId: '', matchCode: '' };
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

    const ts = nowMs();

    await db.runTransaction(async (tx) => {
      const matchSnap = await tx.get(matchRef);
      if (!matchSnap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const match = matchSnap.data() || {};
      const status = safeStr(match?.status);

      const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
      if (userIds.length !== 2 || !userIds.includes(uid)) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }

      if (status === 'cancelled') return;

      // Sadece aktif süreçlerde iptale izin ver.
      if (status !== 'mutual_accepted' && status !== 'proposed') {
        const err = new Error('not_available');
        err.statusCode = 400;
        throw err;
      }

      const otherUid = userIds.find((x) => x && x !== uid) || '';

      tx.set(
        matchRef,
        {
          status: 'cancelled',
          cancelledAt: FieldValue.serverTimestamp(),
          cancelledAtMs: ts,
          cancelledByUserId: uid,
          cancelledReason: 'user_cancelled',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // İki kullanıcıdan da bu match'e bağlı lock/choice alanlarını temizle.
      const meRef = db.collection('matchmakingUsers').doc(uid);
      const otherRef = otherUid ? db.collection('matchmakingUsers').doc(otherUid) : null;

      const [meSnap, otherSnap] = await Promise.all([tx.get(meRef), otherRef ? tx.get(otherRef) : Promise.resolve(null)]);
      const me = meSnap.exists ? (meSnap.data() || {}) : {};
      const other = otherSnap?.exists ? (otherSnap.data() || {}) : {};

      const mePatch = clearUserLockIfMatch(me, matchId);
      const otherPatch = otherRef ? clearUserLockIfMatch(other, matchId) : {};

      if (Object.keys(mePatch).length) tx.set(meRef, { ...mePatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      if (otherRef && Object.keys(otherPatch).length) tx.set(otherRef, { ...otherPatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
