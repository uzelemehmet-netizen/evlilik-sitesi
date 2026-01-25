import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function tsToMs(v) {
  if (!v) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v?.toMillis === 'function') {
    try {
      return v.toMillis();
    } catch {
      return 0;
    }
  }
  const seconds = typeof v?.seconds === 'number' ? v.seconds : null;
  const nanoseconds = typeof v?.nanoseconds === 'number' ? v.nanoseconds : 0;
  if (seconds !== null) return Math.floor(seconds * 1000 + nanoseconds / 1e6);
  return 0;
}

const LOCK_MS = 48 * 60 * 60 * 1000;

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
    const matchRef = db.collection('matchmakingMatches').doc(matchId);

    const nowMs = Date.now();
    let result = { confirmed: false, confirmations: { a: false, b: false } };
    let userIds = [];

    await db.runTransaction(async (tx) => {
      const matchSnap = await tx.get(matchRef);
      if (!matchSnap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const match = matchSnap.data() || {};
      const status = safeStr(match.status);
      if (status !== 'mutual_accepted') {
        const err = new Error('not_available');
        err.statusCode = 400;
        throw err;
      }

      userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
      if (userIds.length !== 2 || !userIds.includes(uid)) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }

      const aUid = safeStr(match?.aUserId);
      const bUid = safeStr(match?.bUserId);
      const side = uid === aUid ? 'a' : uid === bUid ? 'b' : '';
      if (!side) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }

      const baseMs =
        (typeof match?.chatEnabledAtMs === 'number' ? match.chatEnabledAtMs : 0) ||
        (typeof match?.mutualAcceptedAtMs === 'number' ? match.mutualAcceptedAtMs : 0) ||
        tsToMs(match?.chatEnabledAt) ||
        tsToMs(match?.interactionChosenAt) ||
        tsToMs(match?.mutualAcceptedAt) ||
        0;

      if (!baseMs || nowMs < baseMs + LOCK_MS) {
        const err = new Error('confirm_locked');
        err.statusCode = 403;
        throw err;
      }

      const meRef = db.collection('matchmakingUsers').doc(uid);
      const otherUid = userIds.find((x) => x !== uid) || '';
      const otherRef = db.collection('matchmakingUsers').doc(otherUid);

      const [meSnap, otherSnap] = await Promise.all([tx.get(meRef), tx.get(otherRef)]);
      const me = meSnap.exists ? (meSnap.data() || {}) : {};
      const other = otherSnap.exists ? (otherSnap.data() || {}) : {};

      // Cinsiyet bazlı eligibility (application doc'larından)
      const aAppId = safeStr(match?.aApplicationId);
      const bAppId = safeStr(match?.bApplicationId);
      const [aAppSnap, bAppSnap] = await Promise.all([
        aAppId ? tx.get(db.collection('matchmakingApplications').doc(aAppId)) : Promise.resolve(null),
        bAppId ? tx.get(db.collection('matchmakingApplications').doc(bAppId)) : Promise.resolve(null),
      ]);
      const aGender = aAppSnap && aAppSnap.exists ? safeStr((aAppSnap.data() || {})?.gender) : '';
      const bGender = bAppSnap && bAppSnap.exists ? safeStr((bAppSnap.data() || {})?.gender) : '';

      const myGender = uid === aUid ? aGender : bGender;
      const otherGender = uid === aUid ? bGender : aGender;

      ensureEligibleOrThrow(me, myGender);
      ensureEligibleOrThrow(other, otherGender);

      const confirmations = match?.confirmations && typeof match.confirmations === 'object' ? { ...match.confirmations } : {};
      if (typeof confirmations.a !== 'boolean') confirmations.a = false;
      if (typeof confirmations.b !== 'boolean') confirmations.b = false;

      confirmations[side] = true;

      const patch = {
        confirmations,
        updatedAt: FieldValue.serverTimestamp(),
      };

      const alreadyConfirmed = typeof match.confirmedAtMs === 'number' && match.confirmedAtMs > 0;
      const both = confirmations.a === true && confirmations.b === true;

      if (!alreadyConfirmed && both) {
        patch.confirmedAt = FieldValue.serverTimestamp();
        patch.confirmedAtMs = nowMs;
        patch.confirmedReason = 'user_confirmed';
      }

      tx.set(matchRef, patch, { merge: true });

      result = { confirmed: !alreadyConfirmed && both, confirmations: { a: confirmations.a, b: confirmations.b } };
    });

    // İki taraf da onayladıysa: her iki kullanıcı için diğer proposed match'leri iptal et.
    if (result.confirmed && userIds.length === 2) {
      for (const uid2 of userIds) {
        try {
          const snap = await db
            .collection('matchmakingMatches')
            .where('status', '==', 'proposed')
            .where('userIds', 'array-contains', uid2)
            .limit(60)
            .get();

          if (snap.empty) continue;

          const batch = db.batch();
          snap.docs.forEach((d) => {
            if (d.id === matchId) return;
            batch.set(
              d.ref,
              {
                status: 'cancelled',
                cancelledAt: FieldValue.serverTimestamp(),
                cancelledAtMs: Date.now(),
                cancelledByUserId: 'system',
                cancelledReason: 'confirmed_elsewhere',
                confirmedMatchId: matchId,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          });
          await batch.commit();
        } catch {
          // best-effort
        }
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, ...result }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
