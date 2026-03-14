import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function isReferralEnabled() {
  const raw = String(process.env.MATCHMAKING_REFERRAL_ENABLED || '').toLowerCase().trim();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeInviteCode(v) {
  const s = safeStr(v).toUpperCase().replace(/\s+/g, '');
  return s;
}

function ensureUcCodeOrThrow(code) {
  const m = /^UC-(\d{3,})$/.exec(code);
  if (!m) {
    const err = new Error('invalid_invite_code');
    err.statusCode = 400;
    throw err;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    if (!isReferralEnabled()) {
      const err = new Error('referral_disabled');
      err.statusCode = 410;
      throw err;
    }

    const decoded = await requireIdToken(req);
    const inviteeUid = safeStr(decoded?.uid);

    const body = normalizeBody(req);
    const code = normalizeInviteCode(body?.code);
    ensureUcCodeOrThrow(code);

    const { db, FieldValue } = getAdmin();

    // Lookup inviter by UC code.
    const inviterSnap = await db.collection('matchmakingUsers').where('userCode', '==', code).limit(1).get();
    const inviterDoc = inviterSnap?.docs?.[0] || null;
    if (!inviterDoc) {
      const err = new Error('invite_code_not_found');
      err.statusCode = 404;
      throw err;
    }

    const inviterUid = safeStr(inviterDoc.id);
    if (!inviterUid) {
      const err = new Error('invite_code_not_found');
      err.statusCode = 404;
      throw err;
    }

    if (inviterUid === inviteeUid) {
      const err = new Error('self_referral_not_allowed');
      err.statusCode = 400;
      throw err;
    }

    const now = Date.now();

    const inviteeRef = db.collection('matchmakingUsers').doc(inviteeUid);
    const inviterRef = db.collection('matchmakingUsers').doc(inviterUid);
    const referralId = `${inviterUid}__${inviteeUid}`;
    const referralRef = db.collection('matchmakingReferrals').doc(referralId);

    let status = 'accepted';

    await db.runTransaction(async (tx) => {
      const [inviteeUserSnap, inviterUserSnap, referralSnap] = await Promise.all([
        tx.get(inviteeRef),
        tx.get(inviterRef),
        tx.get(referralRef),
      ]);

      if (!inviterUserSnap.exists) {
        const err = new Error('invite_code_not_found');
        err.statusCode = 404;
        throw err;
      }

      const inviteeUser = inviteeUserSnap.exists ? inviteeUserSnap.data() || {} : {};
      const existingInvitedBy = safeStr(inviteeUser?.referral?.invitedByUid);

      if (existingInvitedBy && existingInvitedBy !== inviterUid) {
        const err = new Error('already_referred');
        err.statusCode = 409;
        throw err;
      }

      if (referralSnap.exists) {
        const cur = referralSnap.data() || {};
        const curStatus = safeStr(cur?.status) || 'accepted';
        status = curStatus === 'accepted' ? 'already_accepted' : curStatus;

        // Ensure invitee doc has the pointer.
        if (!existingInvitedBy) {
          tx.set(
            inviteeRef,
            {
              referral: {
                invitedByUid: inviterUid,
                invitedByCode: code,
                acceptedAt: FieldValue.serverTimestamp(),
                acceptedAtMs: now,
              },
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
        return;
      }

      tx.set(
        referralRef,
        {
          inviterUid,
          inviteeUid,
          inviterCode: code,
          status: 'accepted',
          acceptedAt: FieldValue.serverTimestamp(),
          acceptedAtMs: now,
          createdAt: FieldValue.serverTimestamp(),
          createdAtMs: now,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: now,
        },
        { merge: false }
      );

      tx.set(
        inviteeRef,
        {
          referral: {
            invitedByUid: inviterUid,
            invitedByCode: code,
            acceptedAt: FieldValue.serverTimestamp(),
            acceptedAtMs: now,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        inviterRef,
        {
          referralStats: {
            acceptedCount: FieldValue.increment(1),
            lastAcceptedAtMs: now,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      status = 'accepted';
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status, inviterUid }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
