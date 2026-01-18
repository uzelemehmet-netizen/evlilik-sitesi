import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeChoice(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'chat' || s === 'in_app' || s === 'site' || s === 'site_chat') return 'chat';
  if (s === 'contact' || s === 'share' || s === 'share_contact') return 'contact';
  return '';
}

// Eligibility kontrolü artık ortak helper üzerinden.

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
    const choice = normalizeChoice(body?.choice);

    if (!matchId || !choice) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    const matchRef = db.collection('matchmakingMatches').doc(matchId);

    let resolvedMode = '';
    let otherChoice = '';

    await db.runTransaction(async (tx) => {
      const matchSnap = await tx.get(matchRef);
      if (!matchSnap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const match = matchSnap.data() || {};
      const status = String(match.status || '');
      if (status !== 'mutual_accepted') {
        const err = new Error('not_available');
        err.statusCode = 400;
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

      const [meSnap, otherSnap] = await Promise.all([
        tx.get(db.collection('matchmakingUsers').doc(uid)),
        tx.get(db.collection('matchmakingUsers').doc(otherUid)),
      ]);

      const me = meSnap.exists ? (meSnap.data() || {}) : {};
      const other = otherSnap.exists ? (otherSnap.data() || {}) : {};

      const aUid = safeStr(match?.aUserId);
      const bUid = safeStr(match?.bUserId);

      // Cinsiyet bazlı eligibility (match application doc'larından okunur)
      const aAppId = String(match?.aApplicationId || '');
      const bAppId = String(match?.bApplicationId || '');
      const [aAppSnap, bAppSnap] = await Promise.all([
        aAppId ? tx.get(db.collection('matchmakingApplications').doc(aAppId)) : Promise.resolve(null),
        bAppId ? tx.get(db.collection('matchmakingApplications').doc(bAppId)) : Promise.resolve(null),
      ]);
      const aGender = aAppSnap && aAppSnap.exists ? String((aAppSnap.data() || {})?.gender || '') : '';
      const bGender = bAppSnap && bAppSnap.exists ? String((bAppSnap.data() || {})?.gender || '') : '';
      const myGender = uid === aUid ? aGender : bGender;
      const otherGender = uid === aUid ? bGender : aGender;

      ensureEligibleOrThrow(me, myGender);
      ensureEligibleOrThrow(other, otherGender);

      const choices = match.interactionChoices && typeof match.interactionChoices === 'object' ? { ...match.interactionChoices } : {};
      choices[uid] = choice;

      otherChoice = safeStr(choices[otherUid]);

      const patch = {
        interactionChoices: choices,
        updatedAt: FieldValue.serverTimestamp(),
      };

      const bothChosen = safeStr(choices[uid]) && safeStr(choices[otherUid]);
      if (bothChosen) {
        const a = safeStr(choices[uid]);
        const b = safeStr(choices[otherUid]);

        // Sadece iki taraf aynı seçeneği seçince ilerle: chat+chat veya contact+contact
        if (a === b) {
          resolvedMode = a;
          patch.interactionMode = resolvedMode;
          patch.interactionChosenAt = FieldValue.serverTimestamp();

          if (resolvedMode === 'contact') {
            patch.status = 'contact_unlocked';
            patch.contactUnlockedAt = FieldValue.serverTimestamp();
          }

          // Lock sadece uzlaşı olduğunda açılır
          for (const lockUid of userIds) {
            tx.set(
              db.collection('matchmakingUsers').doc(lockUid),
              {
                matchmakingLock: { active: true, matchId },
                matchmakingChoice: { active: true, matchId },
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
        } else {
          // Farklı seçim: mod/lock açma.
          patch.interactionMode = null;
          patch.interactionChosenAt = null;
        }
      }

      tx.set(matchRef, patch, { merge: true });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, resolvedMode: resolvedMode || null, otherChoice: otherChoice || null }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
