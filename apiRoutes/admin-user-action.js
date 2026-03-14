import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function toLowerSafe(v) {
  const s = safeStr(v);
  if (!s) return '';
  try {
    return s.toLowerCase();
  } catch {
    return String(s).toLowerCase();
  }
}

function parseIntSafe(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v || '').trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function safeTier(v) {
  const t = safeStr(v).toLowerCase();
  const allowed = new Set(['eco', 'standard', 'pro']);
  return allowed.has(t) ? t : '';
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

function tsToMs(v) {
  try {
    if (!v) return 0;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v instanceof Date) {
      const n = v.getTime();
      return Number.isFinite(n) ? n : 0;
    }
    if (typeof v?.toMillis === 'function') return v.toMillis();
    const seconds = typeof v?.seconds === 'number' ? v.seconds : null;
    const nanoseconds = typeof v?.nanoseconds === 'number' ? v.nanoseconds : 0;
    if (seconds !== null) return Math.floor(seconds * 1000 + nanoseconds / 1e6);
    return 0;
  } catch {
    return 0;
  }
}

function isUserNotFound(err) {
  const code = String(err?.code || '');
  return code.includes('auth/user-not-found');
}

async function approvePaymentDoc({ db, FieldValue, admin, uid, paymentRef, overrideTier }) {
  let validUntilMs = 0;
  let appliedTier = '';
  let paymentId = '';

  await db.runTransaction(async (tx) => {
    // Firestore transaction rule: all reads must happen before any writes.
    const [snap, userSnap] = await Promise.all([
      tx.get(paymentRef),
      tx.get(db.collection('matchmakingUsers').doc(uid)),
    ]);
    if (!snap.exists) {
      const err = new Error('not_found');
      err.statusCode = 404;
      throw err;
    }

    const payment = snap.data() || {};
    paymentId = String(snap.id || '');

    const paymentUid = safeStr(payment?.userId);
    if (!paymentUid || paymentUid !== uid) {
      const err = new Error('payment_user_mismatch');
      err.statusCode = 400;
      throw err;
    }

    if (String(payment?.status || '') !== 'pending') {
      const err = new Error('payment_not_pending');
      err.statusCode = 409;
      throw err;
    }

    const paymentTier = safeTier(payment?.tier);
    appliedTier = overrideTier || paymentTier || 'pro';

    const userRef = db.collection('matchmakingUsers').doc(uid);
    const user = userSnap.exists ? (userSnap.data() || {}) : {};
    const existingUntil = typeof user?.membership?.validUntilMs === 'number' ? user.membership.validUntilMs : 0;
    validUntilMs = computeNextValidUntilMs(existingUntil);

    tx.set(
      paymentRef,
      {
        status: 'approved',
        decidedBy: safeStr(admin?.uid),
        decidedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      userRef,
      {
        membership: {
          active: true,
          validUntilMs,
          plan: appliedTier,
          lastApprovedPaymentId: paymentId,
        },
        translationPack: {
          active: true,
          plan: appliedTier,
          validUntilMs,
          lastApprovedPaymentId: paymentId,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      paymentRef,
      {
        appliedTier,
        appliedValidUntilMs: validUntilMs,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  return { paymentId, appliedTier, validUntilMs };
}

function parseAdminEmails() {
  // Mirror _firebaseAdmin.js
  return ['uzelemehmet@gmail.com'];
}

async function protectAdminTarget(auth, uid) {
  try {
    const rec = await auth.getUser(uid);
    const email = String(rec?.email || '').toLowerCase().trim();
    if (email && parseAdminEmails().includes(email)) {
      const err = new Error('cannot_modify_admin_user');
      err.statusCode = 400;
      throw err;
    }
  } catch (e) {
    if (isUserNotFound(e)) return;
    throw e;
  }
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
    const uid = safeStr(body?.uid);
    const action = safeStr(body?.action);

    if (!uid || !action) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { auth, db, FieldValue } = getAdmin();

    if (['block', 'unblock', 'delete', 'approveIdentity', 'approveLatestPayment'].includes(action)) {
      await protectAdminTarget(auth, uid);
    }

    const ref = db.collection('matchmakingUsers').doc(uid);
    const nowMs = Date.now();

    const auditBase = {
      adminUid: safeStr(admin?.uid),
      adminEmail: safeStr(admin?.email),
      action,
      targetUid: uid,
      createdAt: FieldValue.serverTimestamp(),
    };

    async function writeAudit(ok, extra = {}) {
      try {
        await db.collection('adminAuditLogs').add({ ...auditBase, ok: !!ok, ...extra });
      } catch {
        // ignore
      }
    }

    if (action === 'activateMembership') {
      const daysRaw = parseIntSafe(body?.membershipDays, 30);
      const days = clamp(daysRaw || 30, 1, 3650);
      const planRaw = safeStr(body?.plan) || 'eco';
      const plan = ['eco', 'standard', 'pro'].includes(planRaw.toLowerCase()) ? planRaw.toLowerCase() : 'eco';
      const validUntilMs = nowMs + days * 86400000;

      await ref.set(
        {
          membership: {
            active: true,
            plan,
            validUntilMs,
            adminActivatedAtMs: nowMs,
          },
          translationPack: {
            active: true,
            plan,
            validUntilMs,
            adminActivatedAtMs: nowMs,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, status: 'activated', validUntilMs }));
      await writeAudit(true, { meta: { plan, days, validUntilMs } });
      return;
    }

    if (action === 'cancelMembership') {
      let status = 'cancelled';

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const user = snap.exists ? (snap.data() || {}) : {};

        const until = typeof user?.membership?.validUntilMs === 'number' ? user.membership.validUntilMs : 0;
        const wasActive = !!user?.membership?.active && until > nowMs;
        status = wasActive ? 'cancelled' : 'already_inactive';

        tx.set(
          ref,
          {
            membership: {
              active: false,
              validUntilMs: Math.min(until || 0, nowMs),
              cancelledAtMs: nowMs,
            },
            translationPack: {
              active: false,
              validUntilMs: Math.min(
                typeof user?.translationPack?.validUntilMs === 'number' ? user.translationPack.validUntilMs : 0,
                nowMs
              ),
              cancelledAtMs: nowMs,
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, status }));
      await writeAudit(true, { meta: { status } });
      return;
    }

    if (action === 'block' || action === 'unblock') {
      const nextBlocked = action === 'block';
      const reason = nextBlocked ? safeStr(body?.reason) : '';

      try {
        await auth.updateUser(uid, { disabled: !!nextBlocked });
      } catch (e) {
        if (!isUserNotFound(e)) throw e;
      }

      await ref.set(
        {
          blocked: !!nextBlocked,
          blockedAt: nextBlocked ? FieldValue.serverTimestamp() : null,
          blockedReason: nextBlocked ? reason || null : null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, status: nextBlocked ? 'blocked' : 'unblocked' }));
      await writeAudit(true, { meta: { status: nextBlocked ? 'blocked' : 'unblocked', reason: reason || null } });
      return;
    }

    if (action === 'delete') {
      const confirmText = safeStr(body?.confirmText);
      const confirmFinal = body?.confirmFinal === true;

      // Admin-silme için UID bazlı phrase: delete:<uid>
      const norm = toLowerSafe(confirmText);
      const allowed = new Set([
        `delete:${String(uid).toLowerCase()}`,
        `sil:${String(uid).toLowerCase()}`,
      ]);

      if (!allowed.has(norm)) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'confirm_text_required' }));
        return;
      }

      if (!confirmFinal) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'confirm_final_required' }));
        return;
      }

      // 1) Related docs cleanup (best-effort)
      const now = FieldValue.serverTimestamp();

      const userRef = db.collection('matchmakingUsers').doc(uid);

      const appsQ = db.collection('matchmakingApplications').where('userId', '==', uid).limit(25);
      const paymentsQ = db.collection('matchmakingPayments').where('userId', '==', uid).limit(50);
      const reservationsQ = db.collection('reservations').where('userId', '==', uid).limit(50);
      const matchesQ = db.collection('matchmakingMatches').where('userIds', 'array-contains', uid).limit(50);

      const [appsSnap, paymentsSnap, reservationsSnap, matchesSnap] = await Promise.all([
        appsQ.get(),
        paymentsQ.get(),
        reservationsQ.get(),
        matchesQ.get(),
      ]);

      const batch = db.batch();
      appsSnap.forEach((d) => batch.delete(d.ref));
      paymentsSnap.forEach((d) => batch.delete(d.ref));
      reservationsSnap.forEach((d) => batch.delete(d.ref));

      matchesSnap.forEach((d) => {
        batch.set(
          d.ref,
          {
            status: 'deleted_user',
            deletedUserIds: {
              [uid]: now,
            },
            updatedAt: now,
          },
          { merge: true }
        );
      });

      batch.set(
        userRef,
        {
          deletedAt: now,
          identityVerification: FieldValue.delete(),
          membership: FieldValue.delete(),
          translationPack: FieldValue.delete(),
          freeActiveMembership: FieldValue.delete(),
          photoUrls: [],
          username: '',
          fullName: '',
          email: '',
          whatsapp: '',
          phone: '',
          instagram: '',
          about: '',
          expectations: '',
          details: FieldValue.delete(),
          updatedAt: now,
        },
        { merge: true }
      );

      await batch.commit();

      // 2) Delete Auth user
      try {
        await auth.deleteUser(uid);
      } catch (e) {
        if (!isUserNotFound(e)) throw e;
      }

      // 3) Try to delete user doc
      try {
        await userRef.delete();
      } catch {
        // ignore
      }

      // 4) Mark system flag doc too (optional cleanup)
      try {
        await db.collection('adminUserFlags').doc(uid).delete();
      } catch {
        // ignore
      }

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
      await writeAudit(true, { meta: { deleted: true } });
      return;
    }

    if (action === 'approveIdentity') {
      const note = safeStr(body?.note);

      await ref.set(
        {
          identityVerified: true,
          'identityVerification.status': 'verified',
          'identityVerification.decidedAt': FieldValue.serverTimestamp(),
          'identityVerification.decidedBy': {
            uid: safeStr(admin?.uid),
            email: safeStr(admin?.email),
          },
          'identityVerification.note': note || null,
          'identityVerification.method': 'manual',
          'identityVerification.verifiedAt': FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, status: 'verified' }));
      await writeAudit(true, { meta: { status: 'verified', note: note || null } });
      return;
    }

    if (action === 'approveLatestPayment') {
      const overrideTier = safeTier(body?.tier);

      // Index gerektirmemek için: sadece userId ile çek, pending olanlar içinden en yenisini seç.
      // (Tek bir kullanıcı için ödeme sayısı genelde düşük; bu endpoint admin-only.)
      const paySnap = await db.collection('matchmakingPayments').where('userId', '==', uid).get();

      const pendingDocs = paySnap.docs
        .map((d) => {
          const data = d.data() || {};
          const status = String(data?.status || '');
          const createdMs = tsToMs(data?.createdAt) || tsToMs(data?.updatedAt) || 0;
          return { d, status, createdMs };
        })
        .filter((x) => x.status === 'pending');

      pendingDocs.sort((a, b) => (b.createdMs || 0) - (a.createdMs || 0));
      const pendingDoc = pendingDocs[0]?.d || null;

      if (!pendingDoc) {
        const err = new Error('no_pending_payment');
        err.statusCode = 404;
        throw err;
      }

      const paymentId = pendingDoc.id;
      const paymentRef = pendingDoc.ref;
      const r = await approvePaymentDoc({ db, FieldValue, admin, uid, paymentRef, overrideTier });

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, paymentId, appliedTier: r.appliedTier || null, validUntilMs: r.validUntilMs || null }));
      await writeAudit(true, { meta: { paymentId, appliedTier: r.appliedTier || null, validUntilMs: r.validUntilMs || null } });
      return;
    }

    if (action === 'approvePayment') {
      const overrideTier = safeTier(body?.tier);
      const paymentId = safeStr(body?.paymentId);

      if (!paymentId) {
        res.statusCode = 400;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'payment_id_required' }));
        return;
      }

      const paymentRef = db.collection('matchmakingPayments').doc(paymentId);
      const r = await approvePaymentDoc({ db, FieldValue, admin, uid, paymentRef, overrideTier });

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, paymentId: r.paymentId, appliedTier: r.appliedTier || null, validUntilMs: r.validUntilMs || null }));
      await writeAudit(true, { meta: { paymentId: r.paymentId, appliedTier: r.appliedTier || null, validUntilMs: r.validUntilMs || null } });
      return;
    }

    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'unknown_action' }));
  } catch (e) {
    try {
      const { db, FieldValue } = getAdmin();
      await db.collection('adminAuditLogs').add({
        action: safeStr(normalizeBody(req)?.action),
        targetUid: safeStr(normalizeBody(req)?.uid),
        ok: false,
        error: String(e?.message || 'server_error'),
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch {
      // ignore
    }
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
