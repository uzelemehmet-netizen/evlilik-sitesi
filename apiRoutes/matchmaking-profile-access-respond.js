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
    const meUser = meUserSnap.exists ? (meUserSnap.data() || {}) : {};
    ensureEligibleOrThrow(meUser, '');

    const requestId = `${fromUid}__${uid}`;
    const inboxRef = db.collection('matchmakingUsers').doc(uid).collection('inboxAccessRequests').doc(requestId);
    const outboxRef = db.collection('matchmakingUsers').doc(fromUid).collection('outboxAccessRequests').doc(requestId);

    const grantedToMeRef = db.collection('matchmakingUsers').doc(uid).collection('profileAccessGranted').doc(fromUid);
    const grantedToRequesterRef = db.collection('matchmakingUsers').doc(fromUid).collection('profileAccessGranted').doc(uid);

    const now = Date.now();

    let status = decision === 'approve' ? 'approved' : 'rejected';

    await db.runTransaction(async (tx) => {
      const inboxSnap = await tx.get(inboxRef);
      if (!inboxSnap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const cur = inboxSnap.data() || {};
      const curStatus = safeStr(cur?.status);

      // Idempotent
      if (decision === 'approve' && curStatus === 'approved') {
        status = 'approved';
        return;
      }
      if (decision === 'reject' && curStatus === 'rejected') {
        status = 'rejected';
        return;
      }

      const patch = {
        status,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: now,
        decidedAt: FieldValue.serverTimestamp(),
        decidedAtMs: now,
        decidedByUid: uid,
      };

      tx.set(inboxRef, patch, { merge: true });
      tx.set(outboxRef, patch, { merge: true });

      if (decision === 'approve') {
        tx.set(
          grantedToMeRef,
          {
            status: 'granted',
            otherUid: fromUid,
            grantedAt: FieldValue.serverTimestamp(),
            grantedAtMs: now,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: now,
            requestId,
          },
          { merge: true }
        );
        tx.set(
          grantedToRequesterRef,
          {
            status: 'granted',
            otherUid: uid,
            grantedAt: FieldValue.serverTimestamp(),
            grantedAtMs: now,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: now,
            requestId,
          },
          { merge: true }
        );
      } else {
        // reject => revoke (best-effort)
        tx.delete(grantedToMeRef);
        tx.delete(grantedToRequesterRef);
      }
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
