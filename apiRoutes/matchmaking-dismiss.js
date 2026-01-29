import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function nowMs() {
  return Date.now();
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
    const ref = db.collection('matchmakingMatches').doc(matchId);

    let creditGranted = 0;
    let cooldownUntilMs = 0;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const data = snap.data() || {};
      const userIds = Array.isArray(data.userIds) ? data.userIds.map(String).filter(Boolean) : [];
      if (userIds.length !== 2 || !userIds.includes(uid)) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }

      // Sadece teklif aşamasında tek taraflı gizleme/dismiss.
      const status = String(data.status || '');
      const cancelledReason = String(data?.cancelledReason || '');
      const cancelledByUserId = safeStr(data?.cancelledByUserId);

      const dismissableProposed = status === 'proposed';
      const dismissableRejectedByOther =
        status === 'cancelled' && cancelledReason === 'rejected' && !!cancelledByUserId && cancelledByUserId !== uid;

      if (!dismissableProposed && !dismissableRejectedByOther) {
        const err = new Error('not_dismissable');
        err.statusCode = 400;
        throw err;
      }

      const existingDismissal = data?.dismissals?.[uid] || null;
      if (existingDismissal) {
        // idempotent: tekrar kredi verme.
        return;
      }

      const now = nowMs();
      creditGranted = 0;
      cooldownUntilMs = 0;

      const meRef = db.collection('matchmakingUsers').doc(uid);
      await tx.get(meRef);

      tx.set(
        ref,
        {
          dismissals: {
            [uid]: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        meRef,
        {
          lastMatchRemovalAtMs: now,
          lastMatchRemovalReason: 'dismissed',
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, creditGranted, cooldownUntilMs }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
