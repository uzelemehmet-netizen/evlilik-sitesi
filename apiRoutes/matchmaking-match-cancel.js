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
      // IMPORTANT: Firestore transactions require all reads before all writes.
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

      // Yeni ürün kuralı:
      // - Aktif eşleşme (mutual_accepted/contact_unlocked) iptali karşılıklı olmalı.
      // - proposed / mutual_interest aşamasında tek taraflı iptal serbest.
      if (status === 'mutual_accepted' || status === 'contact_unlocked') {
        const err = new Error('use_active_cancel');
        err.statusCode = 409;
        throw err;
      }

      if (status !== 'proposed' && status !== 'mutual_interest') {
        const err = new Error('not_available');
        err.statusCode = 400;
        throw err;
      }

      const otherUid = userIds.find((x) => x && x !== uid) || '';

      // Read user docs BEFORE any writes.
      const meRef = db.collection('matchmakingUsers').doc(uid);
      const otherRef = otherUid ? db.collection('matchmakingUsers').doc(otherUid) : null;

      // NOTE: Keep reads strictly sequential to avoid any SDK edge-cases
      // around read/write ordering inside a transaction.
      const meSnap = await tx.get(meRef);
      const otherSnap = otherRef ? await tx.get(otherRef) : null;
      const me = meSnap.exists ? (meSnap.data() || {}) : {};
      const other = otherSnap?.exists ? (otherSnap.data() || {}) : {};

      const mePatch = clearUserLockIfMatch(me, matchId);
      const otherPatch = otherRef ? clearUserLockIfMatch(other, matchId) : {};

      // İptal edilen eşleşmenin yerine 1 adet yeni eşleşme isteme hakkı.
      // Kredi sadece iptali başlatan kullanıcıya yazılır.
      mePatch.newMatchReplacementCredits = FieldValue.increment(1);

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
      if (Object.keys(mePatch).length) tx.set(meRef, { ...mePatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      if (otherRef && Object.keys(otherPatch).length) tx.set(otherRef, { ...otherPatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[matchmaking-match-cancel] error:', e);
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
