import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalize4Digit(v) {
  const s = safeStr(v).replace(/\s+/g, '');
  return s;
}

function extendUntilMs(existingUntilMs, nowMs, extraDays) {
  const cur = typeof existingUntilMs === 'number' && Number.isFinite(existingUntilMs) ? existingUntilMs : 0;
  const base = Math.max(cur, nowMs);
  return base + extraDays * 24 * 60 * 60 * 1000;
}

function buildMembershipPatch(prev, nowMs, newUntilMs) {
  const m = prev && typeof prev === 'object' ? prev : {};
  const plan = safeStr(m.plan) || 'eco';
  return { ...m, active: true, plan, validUntilMs: newUntilMs, updatedAtMs: nowMs };
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
    const decoded = await requireIdToken(req);
    const inviteeUid = safeStr(decoded?.uid);
    if (!inviteeUid) {
      const err = new Error('missing_auth');
      err.statusCode = 401;
      throw err;
    }

    const body = normalizeBody(req);
    const code = normalize4Digit(body?.code);

    if (!code || !/^\d{4}$/.test(code)) {
      const err = new Error('invalid_invite_code');
      err.statusCode = 400;
      throw err;
    }

    const { db, FieldValue } = getAdmin();

    const now = Date.now();
    const rewardDays = 30;

    const inviteRef = db.collection('matchmakingInviteCodes').doc(code);

    let status = 'redeemed';
    let inviterUid = '';
    let inviterNewUntilMs = 0;
    let inviteeNewUntilMs = 0;

    await db.runTransaction(async (tx) => {
      const inviteSnap = await tx.get(inviteRef);
      if (!inviteSnap.exists) {
        // Optional field: if code is not found, treat as no-op.
        status = 'code_not_found';
        return;
      }

      const invite = inviteSnap.data() || {};
      const curStatus = safeStr(invite?.status);
      inviterUid = safeStr(invite?.inviterUid);

      if (!inviterUid) {
        status = 'code_not_found';
        return;
      }

      if (inviterUid === inviteeUid) {
        const err = new Error('self_referral_not_allowed');
        err.statusCode = 400;
        throw err;
      }

      if (curStatus === 'redeemed') {
        status = 'already_redeemed';
        return;
      }

      if (curStatus && curStatus !== 'created') {
        status = 'not_redeemable';
        return;
      }

      const inviterRef = db.collection('matchmakingUsers').doc(inviterUid);
      const inviteeRef = db.collection('matchmakingUsers').doc(inviteeUid);

      const [inviterSnap, inviteeSnap] = await Promise.all([tx.get(inviterRef), tx.get(inviteeRef)]);
      const inviterUser = inviterSnap.exists ? inviterSnap.data() || {} : {};
      const inviteeUser = inviteeSnap.exists ? inviteeSnap.data() || {} : {};

      inviterNewUntilMs = extendUntilMs(inviterUser?.membership?.validUntilMs, now, rewardDays);
      inviteeNewUntilMs = extendUntilMs(inviteeUser?.membership?.validUntilMs, now, rewardDays);

      tx.set(
        inviterRef,
        {
          membership: buildMembershipPatch(inviterUser?.membership, now, inviterNewUntilMs),
          inviteRewards: {
            ...(inviterUser?.inviteRewards && typeof inviterUser.inviteRewards === 'object' ? inviterUser.inviteRewards : {}),
            redeemedCount: FieldValue.increment(1),
            lastRedeemedAtMs: now,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        inviteeRef,
        {
          membership: buildMembershipPatch(inviteeUser?.membership, now, inviteeNewUntilMs),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        inviteRef,
        {
          status: 'redeemed',
          redeemedByUid: inviteeUid,
          redeemedAt: FieldValue.serverTimestamp(),
          redeemedAtMs: now,
          rewardDays,
          inviterNewUntilMs,
          inviteeNewUntilMs,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: now,
        },
        { merge: true }
      );

      status = 'redeemed';
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status, rewardDays: 30, inviterUid: inviterUid || null, inviterNewUntilMs, inviteeNewUntilMs }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
