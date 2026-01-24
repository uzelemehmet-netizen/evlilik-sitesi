import { getAdmin, requireIdToken } from './_firebaseAdmin.js';
import { computeFreeActiveMembershipState, isFreeActiveEnabled } from './_matchmakingEligibility.js';

function nextInactiveCount(prev) {
  const n = typeof prev === 'number' ? prev : Number(prev);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    if (!isFreeActiveEnabled()) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, status: 'disabled', blocked: false, windowHours: 0 }));
      return;
    }

    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingUsers').doc(uid);

    const now = Date.now();

    let result = { status: 'noop', blocked: false, windowHours: 0 };

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const user = snap.exists ? (snap.data() || {}) : {};

      const fam = user?.freeActiveMembership || null;
      const state = computeFreeActiveMembershipState(user, now);

      if (!state.active) {
        result = { status: 'noop', blocked: !!state.blocked, windowHours: state.windowHours || 0 };
        return;
      }

      // Aktif ama süre dolmuşsa: üyeliği iptal et.
      if (!state.eligible) {
        const prevInactive = nextInactiveCount(fam?.inactiveCount);
        const inactiveCount = prevInactive + 1;
        const blocked = inactiveCount >= 2;

        tx.set(
          ref,
          {
            freeActiveMembership: {
              ...(typeof fam === 'object' && fam ? fam : {}),
              active: false,
              inactiveCount,
              blocked,
              blockedReason: blocked ? 'inactive_twice' : '',
              cancelledAt: FieldValue.serverTimestamp(),
              cancelledAtMs: now,
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        result = { status: blocked ? 'blocked' : 'expired', blocked, windowHours: state.windowHours || 0 };
        return;
      }

      // Aktif ve geçerliyse: lastActive'i güncelle.
      tx.set(
        ref,
        {
          freeActiveMembership: {
            ...(typeof fam === 'object' && fam ? fam : {}),
            active: true,
            blocked: false,
            lastActiveAt: FieldValue.serverTimestamp(),
            lastActiveAtMs: now,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      result = { status: 'refreshed', blocked: false, windowHours: state.windowHours || 0 };
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, ...result }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
