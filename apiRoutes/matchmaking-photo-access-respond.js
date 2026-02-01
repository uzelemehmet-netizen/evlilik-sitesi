import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

const DECISIONS = new Set(['approve', 'reject']);

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = safeStr(decoded?.uid);

    const body = normalizeBody(req);
    const fromUid = safeStr(body?.fromUid);
    const decision = safeStr(body?.decision);

    if (!uid || !fromUid || uid === fromUid || !DECISIONS.has(decision)) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    // Etkileşim kuralı: cevap vermek de aksiyon sayılır.
    const meUserSnap = await db.collection('matchmakingUsers').doc(uid).get();
    const meUser = meUserSnap.exists ? meUserSnap.data() || {} : {};
    ensureEligibleOrThrow(meUser, '');

    const requestId = `${fromUid}__${uid}`;
    const inboxRef = db.collection('matchmakingUsers').doc(uid).collection('inboxAccessRequests').doc(requestId);
    const outboxRef = db.collection('matchmakingUsers').doc(fromUid).collection('outboxAccessRequests').doc(requestId);

    const now = Date.now();

    let status = decision === 'approve' ? 'approved' : 'rejected';
    let matchId = '';
    let shouldNotifyReject = false;

    await db.runTransaction(async (tx) => {
      const inboxSnap = await tx.get(inboxRef);
      if (!inboxSnap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const cur = inboxSnap.data() || {};
      const curType = safeStr(cur?.type);
      const curStatus = safeStr(cur?.status);

      if (curType && curType !== 'photo_access') {
        const err = new Error('wrong_type');
        err.statusCode = 400;
        throw err;
      }

      // Idempotent
      if (decision === 'approve' && curStatus === 'approved') {
        status = 'approved';
        matchId = safeStr(cur?.matchId);
        return;
      }
      if (decision === 'reject' && curStatus === 'rejected') {
        status = 'rejected';
        return;
      }

      if (decision === 'reject' && curStatus !== 'rejected') {
        shouldNotifyReject = true;
      }

      matchId = safeStr(cur?.matchId);
      if (!matchId) {
        const ids = [uid, fromUid].slice().sort();
        matchId = `${ids[0]}__${ids[1]}`;
      }

      const patch = {
        type: 'photo_access',
        status,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: now,
        decidedAt: FieldValue.serverTimestamp(),
        decidedAtMs: now,
        decidedByUid: uid,
      };

      tx.set(inboxRef, patch, { merge: true });
      tx.set(outboxRef, patch, { merge: true });

      const allow = decision === 'approve';

      // Match üzerinde fotoğraf iznini aç/kapat.
      const matchRef = db.collection('matchmakingMatches').doc(matchId);
      const matchSnap = await tx.get(matchRef);
      if (!matchSnap.exists) {
        // Match silinmiş olabilir; yine de inbox/outbox status güncellemesi kalsın.
        return;
      }

      const match = matchSnap.data() || {};
      const aUserId = safeStr(match?.aUserId);
      const bUserId = safeStr(match?.bUserId);

      const mySide = uid && aUserId === uid ? 'a' : uid && bUserId === uid ? 'b' : '';
      if (!mySide) return;

      // Kural: bu onay, benim fotoğraflarımın karşı tarafa açılmasıdır.
      const existing = match?.photoAccess && typeof match.photoAccess === 'object' ? match.photoAccess : {};
      const nextAccess = { ...existing };
      if (mySide === 'a') nextAccess.aToB = allow;
      else nextAccess.bToA = allow;

      tx.set(
        matchRef,
        {
          photoAccess: nextAccess,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    if (decision === 'reject' && shouldNotifyReject) {
      const systemProfile = { username: 'Sistem', age: null, city: '', photoUrl: '' };
      const messageId = `notice_rejected__photo_access__${requestId}`;
      const msgRef = db.collection('matchmakingUsers').doc(fromUid).collection('inboxMessages').doc(messageId);
      const msg = {
        type: 'system_notice',
        status: 'delivered',
        fromUid: 'system',
        toUid: fromUid,
        fromProfile: systemProfile,
        text: 'Fotoğraf görme isteğiniz reddedildi.',
        relatedRequestId: requestId,
        relatedType: 'photo_access',
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: now,
        readAtMs: 0,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: now,
      };
      await msgRef.set(msg, { merge: true });
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status, matchId }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
