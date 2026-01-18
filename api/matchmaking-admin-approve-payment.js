import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function addDays(date, days) {
  const ms = date.getTime() + days * 24 * 60 * 60 * 1000;
  return new Date(ms);
}

function computeNextValidUntilMs(existingValidUntilMs) {
  const now = Date.now();
  const base = typeof existingValidUntilMs === 'number' && existingValidUntilMs > now ? existingValidUntilMs : now;
  const validUntil = addDays(new Date(base), 30);
  return validUntil.getTime();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const admin = await requireAdmin(req);

    const body = normalizeBody(req);
    const paymentId = safeStr(body?.paymentId);
    const approve = body?.approve === undefined ? true : !!body.approve;

    if (!paymentId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingPayments').doc(paymentId);

    let userId = '';
    let validUntilMs = 0;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const data = snap.data() || {};
      userId = String(data.userId || '');
      if (!userId) {
        const err = new Error('bad_payment');
        err.statusCode = 400;
        throw err;
      }

      const patch = {
        status: approve ? 'approved' : 'rejected',
        decidedBy: admin.uid,
        decidedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      tx.set(ref, patch, { merge: true });

      if (approve) {
        const userRef = db.collection('matchmakingUsers').doc(userId);
        const userSnap = await tx.get(userRef);
        const user = userSnap.exists ? (userSnap.data() || {}) : {};
        const existingUntil = typeof user?.membership?.validUntilMs === 'number' ? user.membership.validUntilMs : 0;

        validUntilMs = computeNextValidUntilMs(existingUntil);

        tx.set(
          userRef,
          {
            membership: {
              active: true,
              validUntilMs,
              plan: 'monthly',
              lastApprovedPaymentId: paymentId,
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(
          ref,
          {
            appliedValidUntilMs: validUntilMs,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, userId, validUntilMs }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
