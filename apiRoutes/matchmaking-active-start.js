import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { assertNotResetIgnoredMatch, getMatchmakingResetAtMs } from './_matchmakingReset.js';

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

      // Yeni kural: sadece 1 aktif eşleşme.
      // İki tarafın da başka bir aktif lock'u olmamalı.
      const meRef = db.collection('matchmakingUsers').doc(uid);
      const otherRef = db.collection('matchmakingUsers').doc(otherUid);
      const [meSnap, otherSnap] = await Promise.all([tx.get(meRef), tx.get(otherRef)]);
      const me = meSnap.exists ? (meSnap.data() || {}) : {};
      const other = otherSnap.exists ? (otherSnap.data() || {}) : {};

      const myLock = me?.matchmakingLock && typeof me.matchmakingLock === 'object' ? me.matchmakingLock : null;
      const otherLock = other?.matchmakingLock && typeof other.matchmakingLock === 'object' ? other.matchmakingLock : null;

      const myLockActive = !!myLock?.active;
      const otherLockActive = !!otherLock?.active;
      const myLockMatchId = safeStr(myLock?.matchId);
      const otherLockMatchId = safeStr(otherLock?.matchId);

      if (myLockActive && myLockMatchId && myLockMatchId !== matchId) {
        const err = new Error('active_match_exists');
        err.statusCode = 409;
        throw err;
      }
      if (otherLockActive && otherLockMatchId && otherLockMatchId !== matchId) {
        const err = new Error('other_user_active_match_exists');
        err.statusCode = 409;
        throw err;
      }

      const startedByUid = match?.activeStartByUid && typeof match.activeStartByUid === 'object' ? { ...match.activeStartByUid } : {};
      startedByUid[uid] = true;

      const patch = {
        activeStartByUid: startedByUid,
        updatedAt: FieldValue.serverTimestamp(),
      };

      const bothStarted = !!startedByUid[uid] && !!startedByUid[otherUid];
      if (bothStarted) {
        activated = true;

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

        const lockPatch = {
          matchmakingLock: { active: true, matchId, matchCode: matchCode || '' },
          matchmakingChoice: { active: true, matchId, matchCode: matchCode || '' },
          updatedAt: FieldValue.serverTimestamp(),
        };

        tx.set(meRef, lockPatch, { merge: true });
        tx.set(otherRef, lockPatch, { merge: true });
      }

      tx.set(matchRef, patch, { merge: true });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, activated }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
