import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { assertNotResetIgnoredMatch, getMatchmakingResetAtMs } from './_matchmakingReset.js';
import { sendPushToUid } from './_push.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function nowMs() {
  return Date.now();
}

function isTwoStepEnabled() {
  const mode = safeStr(process.env.MATCHMAKING_ACTIVE_START_MODE || '').toLowerCase();
  if (!mode) return true; // default: two-step
  return mode !== 'legacy';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    if (!isTwoStepEnabled()) {
      res.statusCode = 410;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'not_enabled' }));
      return;
    }

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
    const matchNoCounterRef = db.collection('counters').doc('matchmakingMatchNo');

    const ts = nowMs();
    let activated = false;
    let otherUidForPush = '';
    let newStartByMe = false;
    let activatedByThisCall = false;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(matchRef);
      if (!snap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const match = snap.data() || {};

      // Soft reset: reset öncesi match'ler yok sayılır.
      const resetAtMs = await getMatchmakingResetAtMs(db);
      assertNotResetIgnoredMatch({ match, resetAtMs });
      const status = safeStr(match?.status);

      // Only mutual interest matches can be activated.
      if (status !== 'mutual_interest') {
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

      otherUidForPush = otherUid;

      const startedByUid = match?.activeStartByUid && typeof match.activeStartByUid === 'object' ? { ...match.activeStartByUid } : {};

      const prevMe = !!startedByUid[uid];
      const prevOther = !!startedByUid[otherUid];
      newStartByMe = !prevMe;

      startedByUid[uid] = true;

      const patch = {
        activeStartByUid: startedByUid,
        updatedAt: FieldValue.serverTimestamp(),
      };

      const bothStarted = !!startedByUid[uid] && !!startedByUid[otherUid];
      if (bothStarted) {
        activated = true;
        activatedByThisCall = newStartByMe; // second starter activates

        patch.status = 'mutual_accepted';
        patch.mutualAcceptedAtMs = ts;
        if (!match?.everMutualAcceptedAtMs) {
          patch.everMutualAcceptedAtMs = ts;
          patch.everMutualAcceptedAt = FieldValue.serverTimestamp();
        }

        patch.interactionMode = 'chat';
        patch.interactionChosenAt = FieldValue.serverTimestamp();
        patch.chatEnabledAt = FieldValue.serverTimestamp();
        patch.chatEnabledAtMs = ts;

        // Match code lazy creation (similar to decision flow)
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

      }

      tx.set(matchRef, patch, { merge: true });
    });

    // Push notifications (best-effort).
    try {
      if (activated && activatedByThisCall) {
        // Activated now -> notify both.
        await sendPushToUid({
          uid,
          title: 'Eşleşme aktif',
          body: 'Eşleşmeniz aktifleşti. Sohbet başlayabilir.',
          url: '/profilim',
          type: 'active_match_activated',
          data: { matchId },
        });
        if (otherUidForPush) {
          await sendPushToUid({
            uid: otherUidForPush,
            title: 'Eşleşme aktif',
            body: 'Eşleşmeniz aktifleşti. Sohbet başlayabilir.',
            url: '/profilim',
            type: 'active_match_activated',
            data: { matchId },
          });
        }
      } else if (!activated && newStartByMe && otherUidForPush) {
        // Start request -> notify other.
        await sendPushToUid({
          uid: otherUidForPush,
          title: 'Aktif eşleşme isteği',
          body: 'Karşı taraf eşleşmeyi aktive etmek istiyor.',
          url: '/profilim',
          type: 'active_match_request',
          data: { matchId, fromUid: uid },
        });
      }
    } catch {
      // ignore
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, activated }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
