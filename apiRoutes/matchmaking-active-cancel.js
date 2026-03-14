import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function nowMs() {
  return Date.now();
}

const ACTIVE_CANCEL_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 saat

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
    let cancelled = false;

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

      if (status === 'cancelled') {
        cancelled = true;
        return;
      }

      // Sadece aktif eşleşme iptalinde mutual onay şart.
      if (status !== 'mutual_accepted' && status !== 'contact_unlocked') {
        const err = new Error('not_available');
        err.statusCode = 400;
        throw err;
      }

      // Suistimal önleme: aktif eşleşme başladıktan sonra 2 saat iptal edilemesin.
      const baseMs =
        (typeof match?.chatEnabledAtMs === 'number' && Number.isFinite(match.chatEnabledAtMs) ? match.chatEnabledAtMs : 0) ||
        (typeof match?.mutualAcceptedAtMs === 'number' && Number.isFinite(match.mutualAcceptedAtMs) ? match.mutualAcceptedAtMs : 0) ||
        0;
      if (baseMs > 0 && ts - baseMs < ACTIVE_CANCEL_COOLDOWN_MS) {
        const remainingMs = ACTIVE_CANCEL_COOLDOWN_MS - (ts - baseMs);
        const remainingMin = Math.max(1, Math.ceil(remainingMs / 60000));
        const err = new Error(`cancel_cooldown_${remainingMin}m`);
        err.statusCode = 409;
        throw err;
      }

      const otherUid = userIds.find((x) => x && x !== uid) || '';
      if (!otherUid) {
        const err = new Error('server_error');
        err.statusCode = 500;
        throw err;
      }

      const meRef = db.collection('matchmakingUsers').doc(uid);
      const otherRef = db.collection('matchmakingUsers').doc(otherUid);

      const [meSnap, otherSnap] = await Promise.all([tx.get(meRef), tx.get(otherRef)]);
      const me = meSnap.exists ? (meSnap.data() || {}) : {};
      const other = otherSnap.exists ? (otherSnap.data() || {}) : {};

      const cancelByUid = match?.activeCancelByUid && typeof match.activeCancelByUid === 'object' ? { ...match.activeCancelByUid } : {};
      cancelByUid[uid] = true;

      const patch = {
        activeCancelByUid: cancelByUid,
        updatedAt: FieldValue.serverTimestamp(),
      };

      const both = !!cancelByUid[uid] && !!cancelByUid[otherUid];
      if (both) {
        cancelled = true;

        patch.status = 'cancelled';
        patch.cancelledAt = FieldValue.serverTimestamp();
        patch.cancelledAtMs = ts;
        patch.cancelledReason = 'active_mutual_cancelled';
        patch.cancelledByUserId = 'mutual';

        const mePatch = clearUserLockIfMatch(me, matchId);
        const otherPatch = clearUserLockIfMatch(other, matchId);

        if (Object.keys(mePatch).length) tx.set(meRef, { ...mePatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        if (Object.keys(otherPatch).length) tx.set(otherRef, { ...otherPatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }

      tx.set(matchRef, patch, { merge: true });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, cancelled }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
