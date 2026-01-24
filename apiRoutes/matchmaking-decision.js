import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow } from './_matchmakingEligibility.js';

function normalizeDecision(v) {
  const s = String(v || '').toLowerCase().trim();
  if (s === 'accept' || s === 'approved') return 'accept';
  if (s === 'reject' || s === 'decline') return 'reject';
  return '';
}

function hasActiveLock(userDoc, exceptMatchId) {
  const lock = userDoc?.matchmakingLock || null;
  const active = !!lock?.active;
  const matchId = typeof lock?.matchId === 'string' ? lock.matchId : '';
  if (!active) return false;
  if (!matchId) return true;
  return matchId !== String(exceptMatchId || '');
}

function getChoiceMatchId(userDoc) {
  const choice = userDoc?.matchmakingChoice || null;
  const active = !!choice?.active;
  const matchId = typeof choice?.matchId === 'string' ? choice.matchId : '';
  return active && matchId ? matchId : '';
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

// Eligibility kontrolü artık ortak helper üzerinden.

// Yeni kural: Mutual accept anında chat otomatik aktif olur.

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
    const matchId = String(body?.matchId || '').trim();
    const decision = normalizeDecision(body?.decision);

    if (!matchId || !decision) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingMatches').doc(matchId);
    const matchNoCounterRef = db.collection('counters').doc('matchmakingMatchNo');

    let status = 'proposed';

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const data = snap.data() || {};
      const aUserId = String(data?.aUserId || '');
      const bUserId = String(data?.bUserId || '');

      if (uid !== aUserId && uid !== bUserId) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }

      const side = uid === aUserId ? 'a' : 'b';
      const otherSide = side === 'a' ? 'b' : 'a';
      const otherUserId = side === 'a' ? bUserId : aUserId;

      const meRef = db.collection('matchmakingUsers').doc(uid);
      const otherUserRef = db.collection('matchmakingUsers').doc(otherUserId);

      const [meSnap, otherUserSnap] = await Promise.all([tx.get(meRef), tx.get(otherUserRef)]);
      const meUser = meSnap.exists ? (meSnap.data() || {}) : {};
      const otherUser = otherUserSnap.exists ? (otherUserSnap.data() || {}) : {};

      // İkinci adım kilidi aktifse (başka bir match'e kilitliyse) diğer profillerde kabul/ret kapalı.
      if (hasActiveLock(meUser, matchId)) {
        const err = new Error('user_locked');
        err.statusCode = 409;
        throw err;
      }

      // Cinsiyet (policy için): application doc'tan oku.
      const myAppId = String(side === 'a' ? (data?.aApplicationId || '') : (data?.bApplicationId || ''));
      let myGender = '';
      if (myAppId) {
        const appSnap = await tx.get(db.collection('matchmakingApplications').doc(myAppId));
        myGender = appSnap.exists ? String((appSnap.data() || {})?.gender || '') : '';
      }

      const decisions = {
        a: data?.decisions?.a ?? null,
        b: data?.decisions?.b ?? null,
      };

      // idempotent
      if (decisions[side] === decision) {
        status = String(data?.status || 'proposed');
        return;
      }

      decisions[side] = decision;

      const patch = {
        decisions,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (decision === 'reject') {
        ensureEligibleOrThrow(meUser, myGender);

        patch.status = 'cancelled';
        patch.cancelledAt = FieldValue.serverTimestamp();
        patch.cancelledByUserId = uid;
        patch.cancelledReason = 'rejected';
        status = 'cancelled';

        // Kullanıcıların seçim/lock alanlarını temizle (bu eşleşmeye bağlıysa)
        const meChoice = getChoiceMatchId(meUser);
        const otherChoice = getChoiceMatchId(otherUser);

        if (meChoice === matchId) {
          tx.set(meRef, { matchmakingChoice: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        if (otherChoice === matchId) {
          tx.set(otherUserRef, { matchmakingChoice: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }

        // Eğer bu match karşılıklı onay sonrası kilitlenmişse kilidi kaldır
        tx.set(
          meRef,
          { matchmakingLock: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
        tx.set(
          otherUserRef,
          { matchmakingLock: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
      } else {
        // accept
        ensureEligibleOrThrow(meUser, myGender);

        // Karşı taraf başka biriyle karşılıklı eşleşmiş/kilitli ise beğeni gönderme
        if (hasActiveLock(otherUser, matchId)) {
          const err = new Error('other_user_matched');
          err.statusCode = 409;
          throw err;
        }

        const other = decisions[otherSide];
        if (other === 'accept') {
          patch.status = 'mutual_accepted';
          patch.mutualAcceptedAt = FieldValue.serverTimestamp();
          patch.mutualAcceptedAtMs = Date.now();

          // Chat otomatik aktif: 48 saat kilidi bu başlangıçtan hesaplanır.
          patch.interactionMode = 'chat';
          patch.interactionChosenAt = FieldValue.serverTimestamp();
          patch.chatEnabledAt = FieldValue.serverTimestamp();
          patch.chatEnabledAtMs = Date.now();
          patch.interactionChoices = {};

          // Kısa eşleşme kodu (ES-<no>) - eksik olabilir; burada lazy üret.
          const existingMatchCode = safeStr(data?.matchCode);
          let matchNo = typeof data?.matchNo === 'number' && Number.isFinite(data.matchNo) ? data.matchNo : null;
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

          // İki kullanıcıyı bu match'e kilitle (yeni eşleşme akışını kontrol etmek için)
          // Not: iptal/reject akışları zaten lock temizliyor.
          const lockPatch = {
            matchmakingLock: { active: true, matchId, matchCode: matchCode || '' },
            matchmakingChoice: { active: true, matchId, matchCode: matchCode || '' },
            updatedAt: FieldValue.serverTimestamp(),
          };
          tx.set(meRef, lockPatch, { merge: true });
          tx.set(otherUserRef, lockPatch, { merge: true });

          status = 'mutual_accepted';

        } else {
          status = String(data?.status || 'proposed');
        }
      }

      tx.set(ref, patch, { merge: true });
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
