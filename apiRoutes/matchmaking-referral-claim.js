import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { isIdentityVerified } from './_matchmakingEligibility.js';

function isReferralEnabled() {
  const raw = String(process.env.MATCHMAKING_REFERRAL_ENABLED || '').toLowerCase().trim();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function parseRewardDays() {
  const raw = String(process.env.MATCHMAKING_REFERRAL_REWARD_DAYS || '').trim();
  const n = raw ? Number(raw) : 7;
  if (!Number.isFinite(n)) return 7;
  const clamped = Math.max(1, Math.min(90, Math.floor(n)));
  return clamped;
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
    if (!isReferralEnabled()) {
      const err = new Error('referral_disabled');
      err.statusCode = 410;
      throw err;
    }

    const decoded = await requireIdToken(req);
    const callerUid = safeStr(decoded?.uid);
    const body = normalizeBody(req);

    const { db, FieldValue } = getAdmin();

    // Identify pair: either caller is invitee (preferred), or caller is inviter and provides inviteeUid.
    const callerSnap = await db.collection('matchmakingUsers').doc(callerUid).get();
    const callerUser = callerSnap.exists ? callerSnap.data() || {} : {};

    const invitedByUid = safeStr(callerUser?.referral?.invitedByUid);

    let inviterUid = '';
    let inviteeUid = '';

    if (invitedByUid) {
      inviterUid = invitedByUid;
      inviteeUid = callerUid;
    } else {
      inviterUid = callerUid;
      inviteeUid = safeStr(body?.inviteeUid);
    }

    if (!inviterUid || !inviteeUid) {
      const err = new Error('missing_referral_pair');
      err.statusCode = 400;
      throw err;
    }

    if (inviterUid === inviteeUid) {
      const err = new Error('self_referral_not_allowed');
      err.statusCode = 400;
      throw err;
    }

    const referralId = `${inviterUid}__${inviteeUid}`;

    const inviterRef = db.collection('matchmakingUsers').doc(inviterUid);
    const inviteeRef = db.collection('matchmakingUsers').doc(inviteeUid);
    const referralRef = db.collection('matchmakingReferrals').doc(referralId);

    const now = Date.now();
    const rewardDays = parseRewardDays();
    const rewardType = 'referral_identity_verified_v1';

    let status = 'claimed';
    let inviterNewUntilMs = 0;
    let inviteeNewUntilMs = 0;

    await db.runTransaction(async (tx) => {
      const [inviterSnap, inviteeSnap, referralSnap] = await Promise.all([
        tx.get(inviterRef),
        tx.get(inviteeRef),
        tx.get(referralRef),
      ]);

      if (!referralSnap.exists) {
        const err = new Error('referral_not_found');
        err.statusCode = 404;
        throw err;
      }

      const referral = referralSnap.data() || {};
      const curStatus = safeStr(referral?.status);
      const refInviterUid = safeStr(referral?.inviterUid);
      const refInviteeUid = safeStr(referral?.inviteeUid);

      if (refInviterUid !== inviterUid || refInviteeUid !== inviteeUid || curStatus !== 'accepted') {
        const err = new Error('referral_not_accepted');
        err.statusCode = 409;
        throw err;
      }

      const reward = referral?.reward && typeof referral.reward === 'object' ? referral.reward : null;
      if (reward && typeof reward.appliedAtMs === 'number' && reward.appliedAtMs > 0) {
        status = 'already_claimed';
        inviterNewUntilMs = typeof reward?.inviterNewUntilMs === 'number' ? reward.inviterNewUntilMs : 0;
        inviteeNewUntilMs = typeof reward?.inviteeNewUntilMs === 'number' ? reward.inviteeNewUntilMs : 0;
        return;
      }

      const inviterUser = inviterSnap.exists ? inviterSnap.data() || {} : {};
      const inviteeUser = inviteeSnap.exists ? inviteeSnap.data() || {} : {};

      const inviteeInvitedByUid = safeStr(inviteeUser?.referral?.invitedByUid);
      if (inviteeInvitedByUid !== inviterUid) {
        const err = new Error('referral_mismatch');
        err.statusCode = 409;
        throw err;
      }

      if (!isIdentityVerified(inviterUser) || !isIdentityVerified(inviteeUser)) {
        const err = new Error('verification_required');
        err.statusCode = 402;
        throw err;
      }

      inviterNewUntilMs = extendUntilMs(inviterUser?.membership?.validUntilMs, now, rewardDays);
      inviteeNewUntilMs = extendUntilMs(inviteeUser?.membership?.validUntilMs, now, rewardDays);

      const inviterTranslationUntilMs = extendUntilMs(inviterUser?.translationPack?.validUntilMs, now, rewardDays);
      const inviteeTranslationUntilMs = extendUntilMs(inviteeUser?.translationPack?.validUntilMs, now, rewardDays);

      tx.set(
        inviterRef,
        {
          membership: buildMembershipPatch(inviterUser?.membership, now, inviterNewUntilMs),
          translationPack: buildMembershipPatch(inviterUser?.translationPack, now, inviterTranslationUntilMs),
          referralStats: {
            ...(inviterUser?.referralStats && typeof inviterUser.referralStats === 'object' ? inviterUser.referralStats : {}),
            rewardCount: FieldValue.increment(1),
            lastRewardAtMs: now,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        inviteeRef,
        {
          membership: buildMembershipPatch(inviteeUser?.membership, now, inviteeNewUntilMs),
          translationPack: buildMembershipPatch(inviteeUser?.translationPack, now, inviteeTranslationUntilMs),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        referralRef,
        {
          reward: {
            type: rewardType,
            days: rewardDays,
            appliedAt: FieldValue.serverTimestamp(),
            appliedAtMs: now,
            appliedByUid: callerUid,
            inviterNewUntilMs,
            inviteeNewUntilMs,
          },
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: now,
        },
        { merge: true }
      );

      status = 'claimed';
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status, rewardDays, inviterNewUntilMs, inviteeNewUntilMs }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
