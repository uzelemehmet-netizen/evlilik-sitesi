import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeChoice(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'chat' || s === 'in_app' || s === 'site' || s === 'site_chat') return 'chat';
  if (s === 'contact' || s === 'share' || s === 'share_contact') return 'contact';
  if (s === 'offsite' || s === 'outside' || s === 'external' || s === 'site_disinda' || s === 'site_disi' || s === 'site-disi') return 'offsite';
  if (s === 'cancel' || s === 'cancel_match' || s === 'match_cancel' || s === 'iptal' || s === 'eslesme_iptal' || s === 'eşleşme_iptal') return 'cancel';
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
    const matchNoCounterRef = db.collection('counters').doc('matchmakingMatchNo');

    let resolvedMode = '';
    let otherChoice = '';
    const tsMs = Date.now();

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

      // Kısa eşleşme kodu (ES-<no>) - eski eşleşmelerde eksik olabilir; burada lazy üret.
      const existingMatchCode = safeStr(match?.matchCode);
      let matchNo = typeof match?.matchNo === 'number' && Number.isFinite(match.matchNo) ? match.matchNo : null;
      let matchCode = existingMatchCode;

      if (!matchCode) {
        if (matchNo === null) {
          const cSnap = await tx.get(matchNoCounterRef);
          const cur = cSnap.exists ? (cSnap.data() || {}) : {};
          const next = typeof cur.next === 'number' && Number.isFinite(cur.next) ? cur.next : 10000;
          matchNo = next;
          tx.set(
            matchNoCounterRef,
            {
              next: matchNo + 1,
              updatedAt: FieldValue.serverTimestamp(),
              updatedBy: uid,
            },
            { merge: true }
          );
          patch.matchNo = matchNo;
        }
        matchCode = matchNo !== null ? `ES-${matchNo}` : '';
        if (matchCode) patch.matchCode = matchCode;
      }

      const bothChosen = safeStr(choices[uid]) && safeStr(choices[otherUid]);
      if (bothChosen) {
        const a = safeStr(choices[uid]);
        const b = safeStr(choices[otherUid]);

        // Sadece iki taraf aynı seçeneği seçince ilerle: chat+chat veya contact+contact
        if (a === b) {
          resolvedMode = a;
          patch.interactionMode = resolvedMode;
          patch.interactionChosenAt = FieldValue.serverTimestamp();

          if (resolvedMode === 'chat') {
            patch.chatEnabledAt = FieldValue.serverTimestamp();
            patch.chatEnabledAtMs = tsMs;
          }

          if (resolvedMode === 'contact' || resolvedMode === 'offsite') {
            patch.status = 'contact_unlocked';
            patch.contactUnlockedAt = FieldValue.serverTimestamp();
            patch.contactUnlockedAtMs = tsMs;
          }

          if (resolvedMode === 'cancel') {
            patch.status = 'cancelled';
            patch.cancelledReason = 'mutual_cancel';
            patch.cancelledByUserId = null;
            patch.cancelledAt = FieldValue.serverTimestamp();

            // İptalde kilit/choice kaldır: kullanıcılar diğer eşleşmeleri görebilsin.
            for (const lockUid of userIds) {
              const lockRef = db.collection('matchmakingUsers').doc(lockUid);
              const lockSnap = await tx.get(lockRef);
              const u = lockSnap.exists ? (lockSnap.data() || {}) : {};

              const curLockMatchId = safeStr(u?.matchmakingLock?.matchId);
              const curChoiceMatchId = safeStr(u?.matchmakingChoice?.matchId);

              const userPatch = { updatedAt: FieldValue.serverTimestamp() };
              if (curLockMatchId === matchId) userPatch.matchmakingLock = { active: false, matchId: '', matchCode: '' };
              if (curChoiceMatchId === matchId) userPatch.matchmakingChoice = { active: false, matchId: '', matchCode: '' };

              tx.set(lockRef, userPatch, { merge: true });
            }
          }

          // Lock sadece uzlaşı olduğunda açılır (iptal hariç).
          if (resolvedMode !== 'cancel') {
            for (const lockUid of userIds) {
              tx.set(
                db.collection('matchmakingUsers').doc(lockUid),
                {
                  matchmakingLock: { active: true, matchId, matchCode },
                  matchmakingChoice: { active: true, matchId, matchCode },
                  updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
              );
            }
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
