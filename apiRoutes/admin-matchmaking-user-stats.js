import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function toMs(ts) {
  try {
    if (!ts) return 0;
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (typeof ts.seconds === 'number') return ts.seconds * 1000;
    if (typeof ts === 'number') return ts;
    return 0;
  } catch {
    return 0;
  }
}

function isMembershipActive(userDoc) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > Date.now();
}

function isIdentityVerified(userDoc) {
  if (userDoc?.identityVerified === true) return true;
  const st = String(userDoc?.identityVerification?.status || '').toLowerCase().trim();
  return st === 'verified' || st === 'approved';
}

async function countOf(query) {
  try {
    if (query && typeof query.count === 'function') {
      const snap = await query.count().get();
      const n = snap?.data()?.count;
      return typeof n === 'number' ? n : 0;
    }
  } catch {
    // fall through
  }

  const snap = await query.get();
  return typeof snap?.size === 'number' ? snap.size : 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);

    const body = normalizeBody(req);
    const userId = safeStr(body?.userId);

    if (!userId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db } = getAdmin();

    const userRef = db.collection('matchmakingUsers').doc(userId);
    const userSnap = await userRef.get();
    const user = userSnap.exists ? (userSnap.data() || {}) : {};

    const membership = user?.membership || null;
    const membershipActive = isMembershipActive(user);
    const identityVerified = isIdentityVerified(user);

    const updatedAtMs = toMs(user?.updatedAt);
    const requestedNewMatchAtMs = typeof user?.requestedNewMatchAtMs === 'number' ? user.requestedNewMatchAtMs : 0;
    const lastPaymentSubmittedAtMs = typeof user?.lastPaymentSubmittedAtMs === 'number' ? user.lastPaymentSubmittedAtMs : 0;
    const lastActivityAtMs = Math.max(updatedAtMs, requestedNewMatchAtMs, lastPaymentSubmittedAtMs);

    const matchesRef = db.collection('matchmakingMatches');
    const baseQ = matchesRef.where('userIds', 'array-contains', userId);

    const totalMatches = await countOf(baseQ);
    const proposedCount = await countOf(baseQ.where('status', '==', 'proposed'));
    const mutualAcceptedCount = await countOf(baseQ.where('status', '==', 'mutual_accepted'));
    const contactUnlockedCount = await countOf(baseQ.where('status', '==', 'contact_unlocked'));
    const cancelledCount = await countOf(baseQ.where('status', '==', 'cancelled'));

    // "2. onay" = iki taraf aynı seçeneği seçmiş => interactionMode set.
    // Firestore'da field-is-not-null sorgusu olmadığı için, sınırlı şekilde iki mod üzerinden say.
    const secondStepChatCount = await countOf(baseQ.where('interactionMode', '==', 'chat'));
    const secondStepContactCount = await countOf(baseQ.where('interactionMode', '==', 'contact'));
    const secondStepCount = secondStepChatCount + secondStepContactCount;

    const cancelledRejectedCount = await countOf(baseQ.where('cancelledReason', '==', 'rejected'));

    const recentMatchesSnap = await baseQ.orderBy('createdAt', 'desc').limit(30).get();
    const recentMatches = (recentMatchesSnap.docs || []).map((d) => {
      const m = d.data() || {};
      return {
        id: d.id,
        status: String(m?.status || ''),
        createdAtMs: toMs(m?.createdAt),
        decisions: m?.decisions || {},
        interactionMode: typeof m?.interactionMode === 'string' ? m.interactionMode : null,
        cancelledReason: typeof m?.cancelledReason === 'string' ? m.cancelledReason : null,
        cancelledByUserId: typeof m?.cancelledByUserId === 'string' ? m.cancelledByUserId : null,
      };
    });

    const paymentsRef = db.collection('matchmakingPayments');
    const paymentsQ = paymentsRef.where('userId', '==', userId);
    const paymentsTotal = await countOf(paymentsQ);
    const paymentsPending = await countOf(paymentsQ.where('status', '==', 'pending'));
    const paymentsApproved = await countOf(paymentsQ.where('status', '==', 'approved'));
    const paymentsRejected = await countOf(paymentsQ.where('status', '==', 'rejected'));

    let recentPayments = [];
    try {
      const pSnap = await paymentsQ.orderBy('createdAt', 'desc').limit(20).get();
      recentPayments = (pSnap.docs || []).map((d) => {
        const p = d.data() || {};
        return {
          id: d.id,
          matchId: safeStr(p?.matchId) || null,
          status: safeStr(p?.status) || null,
          currency: safeStr(p?.currency) || null,
          amount: typeof p?.amount === 'number' ? p.amount : null,
          createdAtMs: toMs(p?.createdAt),
        };
      });
    } catch {
      recentPayments = [];
    }

    const quota = user?.newMatchRequestQuota || null;
    const totalRefreshCount = typeof user?.newMatchRequestTotalCount === 'number' ? user.newMatchRequestTotalCount : 0;

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        user: {
          userId,
          blocked: !!user?.blocked,
          membership: membership || null,
          membershipActive,
          identityVerified,
          identityStatus: safeStr(user?.identityVerification?.status) || null,
          newMatchRequestQuota: quota || null,
          newMatchRequestTotalCount: totalRefreshCount,
          lastActivityAtMs: lastActivityAtMs || null,
        },
        counts: {
          matchesTotal: totalMatches,
          proposedCount,
          mutualAcceptedCount,
          contactUnlockedCount,
          cancelledCount,
          cancelledRejectedCount,
          secondStepCount,
          secondStepChatCount,
          secondStepContactCount,
        },
        recentMatches,
        payments: {
          total: paymentsTotal,
          pending: paymentsPending,
          approved: paymentsApproved,
          rejected: paymentsRejected,
          recent: recentPayments,
        },
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
