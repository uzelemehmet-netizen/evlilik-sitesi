import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow, ensureProfileCompleteOrThrow } from './_matchmakingEligibility.js';
import { getContactShareActivityStatus } from './_matchmakingContactActivity.js';

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

const CONTACT_LOCK_MS = 48 * 60 * 60 * 1000;

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

    await ensureProfileCompleteOrThrow(db, uid);
    const matchRef = db.collection('matchmakingMatches').doc(matchId);

    const now = Date.now();
    let status = 'shared';

    await db.runTransaction(async (tx) => {
      const matchSnap = await tx.get(matchRef);
      if (!matchSnap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const match = matchSnap.data() || {};
      const st = String(match.status || '');
      if (st !== 'mutual_accepted' && st !== 'contact_unlocked') {
        const err = new Error('not_available');
        err.statusCode = 400;
        throw err;
      }

      const confirmedAtMs =
        (typeof match?.confirmedAtMs === 'number' ? match.confirmedAtMs : 0) ||
        tsToMs(match?.confirmedAt) ||
        0;
      if (!confirmedAtMs) {
        const err = new Error('confirm_required');
        err.statusCode = 403;
        throw err;
      }

      const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
      if (userIds.length !== 2 || !userIds.includes(uid)) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }

      const otherUid = userIds.find((x) => x !== uid) || '';
      if (!otherUid) {
        const err = new Error('server_error');
        err.statusCode = 500;
        throw err;
      }

      const currentMode = typeof match?.interactionMode === 'string' ? match.interactionMode : '';
      if (currentMode !== 'chat') {
        // Backward-compat: eski match'lerde interactionMode boş kalmış olabilir.
        if (!currentMode) {
          tx.set(
            matchRef,
            {
              interactionMode: 'chat',
              interactionChosenAt: FieldValue.serverTimestamp(),
              chatEnabledAt: FieldValue.serverTimestamp(),
              chatEnabledAtMs: now,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          const err = new Error('chat_not_enabled');
          err.statusCode = 400;
          throw err;
        }
      }

      const [meSnap, otherSnap] = await Promise.all([
        tx.get(db.collection('matchmakingUsers').doc(uid)),
        tx.get(db.collection('matchmakingUsers').doc(otherUid)),
      ]);
      const me = meSnap.exists ? (meSnap.data() || {}) : {};
      const other = otherSnap.exists ? (otherSnap.data() || {}) : {};

      // Cinsiyet bazlı eligibility (match application doc'larından okunur)
      const aUid = safeStr(match?.aUserId);
      const bUid = safeStr(match?.bUserId);
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

      const baseMs =
        (typeof match?.chatEnabledAtMs === 'number' ? match.chatEnabledAtMs : 0) ||
        tsToMs(match?.chatEnabledAt) ||
        tsToMs(match?.interactionChosenAt) ||
        (typeof match?.mutualAcceptedAtMs === 'number' ? match.mutualAcceptedAtMs : 0) ||
        tsToMs(match?.mutualAcceptedAt) ||
        0;

      if (baseMs) {
        const unlockAtMs = baseMs + CONTACT_LOCK_MS;
        if (now < unlockAtMs) {
          const err = new Error('contact_locked');
          err.statusCode = 403;
          throw err;
        }
      }

      const activity = await getContactShareActivityStatus({ tx, matchRef, userIds });
      if (!activity.eligible) {
        const err = new Error('contact_activity_required');
        err.statusCode = 403;
        throw err;
      }

      const cur = match?.contactShare && typeof match.contactShare === 'object' ? match.contactShare : null;
      const sharedByUid = cur?.sharedByUid && typeof cur.sharedByUid === 'object' ? { ...cur.sharedByUid } : {};
      const existingMine = sharedByUid?.[uid] && typeof sharedByUid[uid] === 'object' ? sharedByUid[uid] : null;
      if (safeStr(existingMine?.whatsapp)) {
        status = 'shared';
        return;
      }

      const aApp = aAppSnap && aAppSnap.exists ? (aAppSnap.data() || {}) : {};
      const bApp = bAppSnap && bAppSnap.exists ? (bAppSnap.data() || {}) : {};
      const myWhatsapp = safeStr(uid === aUid ? aApp?.whatsapp : bApp?.whatsapp);
      if (!myWhatsapp) {
        const err = new Error('contact_share_missing_number');
        err.statusCode = 400;
        throw err;
      }

      const msgRef = matchRef.collection('messages').doc();
      tx.set(msgRef, {
        matchId,
        userId: uid,
        type: 'system',
        systemType: 'contact_shared',
        contact: {
          sharedByUid: uid,
          sharedWhatsapp: myWhatsapp,
          aUserId: aUid,
          bUserId: bUid,
        },
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: now,
      });

      sharedByUid[uid] = {
        whatsapp: myWhatsapp,
        sharedAtMs: now,
        messageId: msgRef.id,
      };

      tx.set(
        matchRef,
        {
          status: 'contact_unlocked',
          contactUnlockedAt: FieldValue.serverTimestamp(),
          contactUnlockedAtMs: now,
          contactShare: {
            ...(cur || {}),
            status: 'shared',
            sharedByUid,
            lastSharedByUid: uid,
            lastSharedAtMs: now,
            lastSharedMessageId: msgRef.id,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      status = 'shared';
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
