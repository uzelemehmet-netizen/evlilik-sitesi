import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { assertNotResetIgnoredMatch, getMatchmakingResetAtMs } from './_matchmakingReset.js';
import { ensureEligibleOrThrow } from './_matchmakingEligibility.js';

function normalizeDecision(v) {
  const s = String(v || '').toLowerCase().trim();
  if (s === 'accept' || s === 'approved') return 'accept';
  if (s === 'reject' || s === 'decline') return 'reject';
  if (s === 'revoke' || s === 'undo' || s === 'unlike' || s === 'clear') return 'revoke';
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

function getActiveLockMatchId(userDoc) {
  const lock = userDoc?.matchmakingLock || null;
  const active = !!lock?.active;
  const matchId = typeof lock?.matchId === 'string' ? lock.matchId : '';
  const s = safeStr(matchId);
  return active && s ? s : '';
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

function asNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asObj(v) {
  return v && typeof v === 'object' ? v : {};
}

const MIN_AGE = 18;

function toNumOrNull(v, { min, max } = {}) {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  if (typeof min === 'number' && n < min) return null;
  if (typeof max === 'number' && n > max) return null;
  return n;
}

function ageFromBirthYearMaybe(v) {
  const year = toNumOrNull(v, { min: 1900, max: 2100 });
  if (year === null) return null;
  const now = new Date();
  const age = now.getFullYear() - year;
  return age >= MIN_AGE && age <= 99 ? age : null;
}

function ageFromDateMaybe(v) {
  let d = null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    d = new Date(v);
  } else if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    const parsed = Date.parse(s);
    if (Number.isFinite(parsed)) d = new Date(parsed);
  } else if (typeof v?.toDate === 'function') {
    try {
      d = v.toDate();
    } catch {
      d = null;
    }
  }
  if (!d || Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= MIN_AGE && age <= 99 ? age : null;
}

function getAge(app) {
  const direct = toNumOrNull(app?.age, { min: MIN_AGE, max: 99 });
  if (direct !== null) return direct;

  const details = app?.details || {};
  const nested = toNumOrNull(details?.age, { min: MIN_AGE, max: 99 });
  if (nested !== null) return nested;

  const byYear = ageFromBirthYearMaybe(details?.birthYear ?? app?.birthYear);
  if (byYear !== null) return byYear;

  const byDate =
    ageFromDateMaybe(details?.birthDateMs ?? app?.birthDateMs) ??
    ageFromDateMaybe(details?.birthDate ?? app?.birthDate) ??
    ageFromDateMaybe(details?.dob ?? app?.dob);
  if (byDate !== null) return byDate;

  return null;
}

function ageRangeFromApp(app, { ageOverride = null } = {}) {
  const age = typeof ageOverride === 'number' && Number.isFinite(ageOverride) ? ageOverride : getAge(app);
  const partner = asObj(app?.partnerPreferences);

  const sanitizePref = (n) => (n !== null && n >= 18 && n <= 99 ? n : null);
  const sanitizeDelta = (n) => (n !== null && n >= 0 && n <= 99 ? n : null);
  const clampRange = (rawMin, rawMax) => {
    const finalMin = Math.max(18, Math.min(99, rawMin));
    let finalMax = Math.max(18, Math.min(99, rawMax));
    if (finalMax < finalMin) finalMax = finalMin;
    return { min: finalMin, max: finalMax };
  };

  const prefMin = sanitizePref(asNum(partner?.ageMin));
  const prefMax = sanitizePref(asNum(partner?.ageMax));

  if (prefMin !== null || prefMax !== null) {
    const older = sanitizeDelta(asNum(partner?.ageMaxOlderYears));
    const younger = sanitizeDelta(asNum(partner?.ageMaxYoungerYears));
    const hasRelative = age !== null && (older !== null || younger !== null);
    const a = age ?? 30;

    const outMin =
      prefMin !== null
        ? prefMin
        : hasRelative
          ? age - (younger ?? 0)
          : Math.max(18, a - 5);

    const outMax =
      prefMax !== null
        ? prefMax
        : hasRelative
          ? age + (older ?? 0)
          : Math.min(99, a + 5);

    return clampRange(outMin, outMax);
  }

  const older = sanitizeDelta(asNum(partner?.ageMaxOlderYears));
  const younger = sanitizeDelta(asNum(partner?.ageMaxYoungerYears));
  if (age !== null && (older !== null || younger !== null)) {
    const outMin = age - (younger ?? 0);
    const outMax = age + (older ?? 0);
    return clampRange(outMin, outMax);
  }

  const a = age ?? 30;
  return clampRange(a - 5, a + 5);
}

function canInteractByAge({ requesterApp, targetApp }) {
  const requesterAge = getAge(requesterApp);
  if (requesterAge === null) return { ok: false, reason: 'age_required' };

  const { min, max } = ageRangeFromApp(targetApp, { ageOverride: getAge(targetApp) });
  if (requesterAge < min || requesterAge > max) return { ok: false, reason: 'not_in_their_age_range' };
  return { ok: true };
}

function isTwoStepActiveStartEnabled() {
  const mode = safeStr(process.env.MATCHMAKING_ACTIVE_START_MODE || '').toLowerCase();
  if (!mode) return true; // default: two-step
  return mode !== 'legacy';
}

function getPendingContinueMatchId(userDoc) {
  const p = userDoc?.matchmakingPendingContinue || null;
  const active = !!p?.active;
  const matchId = safeStr(p?.matchId);
  return active && matchId ? matchId : '';
}

const REJECT_REASON_CODES = new Set([
  'not_feeling',
  'values',
  'distance',
  'communication',
  'not_ready',
  'other',
]);

function normalizeRejectReasonCode(v) {
  const s = safeStr(v).toLowerCase();
  if (!s) return '';
  return REJECT_REASON_CODES.has(s) ? s : '';
}

function uniqNonEmptyStrings(arr) {
  const seen = new Set();
  const out = [];
  for (const v of Array.isArray(arr) ? arr : []) {
    const s = safeStr(v);
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function deriveCanonicalUserIds({ matchId, aUserId, bUserId, existingUserIds }) {
  const fromAB = uniqNonEmptyStrings([aUserId, bUserId]);
  if (fromAB.length === 2) return fromAB.slice().sort();

  const fromExisting = uniqNonEmptyStrings(existingUserIds);
  if (fromExisting.length === 2) return fromExisting.slice().sort();

  const parts = String(matchId || '').split('__').map(safeStr).filter(Boolean);
  const fromId = uniqNonEmptyStrings(parts);
  if (fromId.length === 2) return fromId.slice().sort();

  return fromAB.slice().sort();
}

function sameTwoIds(a, b) {
  const aa = Array.isArray(a) ? a.map(safeStr).filter(Boolean).slice().sort() : [];
  const bb = Array.isArray(b) ? b.map(safeStr).filter(Boolean).slice().sort() : [];
  if (aa.length !== 2 || bb.length !== 2) return false;
  return aa[0] === bb[0] && aa[1] === bb[1];
}

function buildInboxLikePayload({ FieldValue, matchId, fromUid, toUid, fromProfile, nowMs }) {
  const p = fromProfile && typeof fromProfile === 'object' ? fromProfile : null;
  return {
    type: 'like',
    status: 'pending',
    matchId: String(matchId || ''),
    fromUid: String(fromUid || ''),
    toUid: String(toUid || ''),
    fromProfile: p || null,
    createdAt: FieldValue.serverTimestamp(),
    createdAtMs: typeof nowMs === 'number' && Number.isFinite(nowMs) ? nowMs : Date.now(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtMs: typeof nowMs === 'number' && Number.isFinite(nowMs) ? nowMs : Date.now(),
  };
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
    const rejectReasonCode = normalizeRejectReasonCode(body?.reason);

    if (!matchId || !decision) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    if (decision === 'reject' && safeStr(body?.reason) && !rejectReasonCode) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_reason' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingMatches').doc(matchId);
    const matchNoCounterRef = db.collection('counters').doc('matchmakingMatchNo');

    let status = 'proposed';
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

      // Soft reset: reset öncesi match'ler yok sayılır.
      const resetAtMs = await getMatchmakingResetAtMs(db);
      assertNotResetIgnoredMatch({ match: data, resetAtMs });
      const aUserId = safeStr(data?.aUserId);
      const bUserId = safeStr(data?.bUserId);
      const canonicalUserIdsSorted = deriveCanonicalUserIds({
        matchId,
        aUserId,
        bUserId,
        existingUserIds: Array.isArray(data?.userIds) ? data.userIds : [],
      });

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
      const myPending = getPendingContinueMatchId(meUser);

      // Yeni ürün kuralı: Aktif eşleşme varken diğer profillerle etkileşim yok.
      const myActiveLockMatchId = getActiveLockMatchId(meUser);
      if (myActiveLockMatchId && myActiveLockMatchId !== matchId) {
        const err = new Error('active_match_locked');
        err.statusCode = 409;
        throw err;
      }

      // Cinsiyet (policy için): application doc'tan oku.
      const myAppId = String(side === 'a' ? (data?.aApplicationId || '') : (data?.bApplicationId || ''));
      const otherAppId = String(side === 'a' ? (data?.bApplicationId || '') : (data?.aApplicationId || ''));

      const [myAppSnap, otherAppSnap] = await Promise.all([
        myAppId ? tx.get(db.collection('matchmakingApplications').doc(myAppId)) : Promise.resolve(null),
        otherAppId ? tx.get(db.collection('matchmakingApplications').doc(otherAppId)) : Promise.resolve(null),
      ]);
      const myApp = myAppSnap && myAppSnap.exists ? (myAppSnap.data() || {}) : null;
      const otherApp = otherAppSnap && otherAppSnap.exists ? (otherAppSnap.data() || {}) : null;
      if (!myApp || !otherApp) {
        const err = new Error('application_not_found');
        err.statusCode = 404;
        throw err;
      }

      // Age gating: accept (beğeni) gönderiyorsan, karşı tarafın yaş aralığına uyman gerekir.
      if (decision === 'accept') {
        const interact = canInteractByAge({ requesterApp: myApp, targetApp: otherApp });
        if (!interact.ok) {
          const err = new Error(interact.reason);
          err.statusCode = interact.reason === 'age_required' ? 400 : 403;
          throw err;
        }
      }

      const myGender = safeStr(myApp?.gender);

      // Üyelik/eligibility: beğeni/reddetme aksiyonları için zorunlu.
      // revoke (geri alma) ise, kullanıcı kilitlenmesin diye serbest bırakıyoruz.
      if (decision !== 'revoke') {
        ensureEligibleOrThrow(meUser, myGender);
      }

      const decisions = {
        a: data?.decisions?.a ?? null,
        b: data?.decisions?.b ?? null,
      };

      const myProfileSnap = data?.profiles?.[side] && typeof data.profiles[side] === 'object' ? data.profiles[side] : null;

      // Inbox ref'leri (gelen beğeni bildirimi)
      const otherInboxRef = db.collection('matchmakingUsers').doc(otherUserId).collection('inboxLikes').doc(matchId);
      const myInboxRef = db.collection('matchmakingUsers').doc(uid).collection('inboxLikes').doc(matchId);

      // revoke (unlike/undo)
      if (decision === 'revoke') {
        // Sadece proposed / mutual_interest aşamasında geri alma serbest.
        const curStatus = String(data?.status || 'proposed');
        if (curStatus !== 'proposed' && curStatus !== 'mutual_interest') {
          const err = new Error('not_available');
          err.statusCode = 409;
          throw err;
        }

        const already = decisions[side];
        if (already === null || already === undefined || String(already || '').trim() === '') {
          status = curStatus;

          // Bazı legacy match'lerde userIds bozuk olabiliyor; idempotent çağrıda da normalize edelim.
          if (!sameTwoIds(data?.userIds, canonicalUserIdsSorted)) {
            tx.set(
              ref,
              {
                userIds: canonicalUserIdsSorted,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
          return;
        }

        // Eğer bu revoke, karşı tarafa daha önce inbox beğenisi yazdıysa temizle.
        // (Sadece best-effort; match status'u ne olursa olsun inbox'u kaldırmak güvenli.)
        try {
          tx.delete(otherInboxRef);
        } catch {
          // noop
        }

        decisions[side] = null;

        const patch = {
          decisions,
          userIds: canonicalUserIdsSorted,
          updatedAt: FieldValue.serverTimestamp(),
        };

        // Eğer karşılıklı beğeniden geri dönülüyorsa status'u proposed'a indir ve ilgili işaretleri temizle.
        if (curStatus === 'mutual_interest') {
          patch.status = 'proposed';
          patch.mutualInterestAt = FieldValue.delete();
          patch.mutualInterestAtMs = FieldValue.delete();
          patch.activeStartByUid = FieldValue.delete();
          status = 'proposed';
        } else {
          status = 'proposed';
        }

        // Kullanıcının pendingContinue işaretini temizle (bu match'e bağlıysa)
        if (myPending === matchId) {
          tx.set(meRef, { matchmakingPendingContinue: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }

        tx.set(ref, patch, { merge: true });
        return;
      }

      // idempotent
      if (decisions[side] === decision) {
        status = String(data?.status || 'proposed');

        // Inbox beğeni bildirimi varsa temizle (idempotent çağrılarda da).
        // Bu sayede UI'da "beğeni kartı" takılı kalmaz.
        if (decision === 'accept' || decision === 'reject') {
          try {
            tx.delete(myInboxRef);
          } catch {
            // noop
          }
        }

        // Bazı legacy match'lerde userIds bozuk olabiliyor; idempotent çağrıda da normalize edelim.
        if (!sameTwoIds(data?.userIds, canonicalUserIdsSorted)) {
          tx.set(
            ref,
            {
              userIds: canonicalUserIdsSorted,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
        return;
      }

      decisions[side] = decision;

      const patch = {
        decisions,
        userIds: canonicalUserIdsSorted,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (decision === 'reject') {
        const nowMs = Date.now();

        if (rejectReasonCode) {
          patch.rejectionFeedback = {
            code: rejectReasonCode,
            byUserId: uid,
            atMs: nowMs,
          };
          patch.rejectionFeedbackAt = FieldValue.serverTimestamp();
        }

        patch.status = 'cancelled';
        patch.cancelledAt = FieldValue.serverTimestamp();
        patch.cancelledAtMs = nowMs;
        patch.cancelledByUserId = uid;
        patch.cancelledReason = 'rejected';
        // Kalıcı DM engeli: reject alan taraf, reject edene mesaj atamasın.
        patch.rejectBlockByUid = uid;
        patch.rejectBlockAtMs = nowMs;
        patch.rejectionCount = FieldValue.increment(1);
        patch.lastRejectedAtMs = nowMs;
        status = 'cancelled';

        // Bu kullanıcıya gelmiş beğeni varsa, reddedince inbox'tan kaldır.
        // (Eğer inbox yoksa tx.delete no-op değildir ama try/catch ile yutuyoruz.)
        try {
          tx.delete(myInboxRef);
        } catch {
          // noop
        }

        creditGranted = 0;
        cooldownUntilMs = 0;

        // Kullanıcıların seçim/lock alanlarını temizle (bu eşleşmeye bağlıysa)
        const meChoice = getChoiceMatchId(meUser);
        const otherChoice = getChoiceMatchId(otherUser);

        const otherPending = getPendingContinueMatchId(otherUser);

        if (meChoice === matchId) {
          tx.set(meRef, { matchmakingChoice: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        if (otherChoice === matchId) {
          tx.set(otherUserRef, { matchmakingChoice: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }

        if (myPending === matchId) {
          tx.set(meRef, { matchmakingPendingContinue: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        if (otherPending === matchId) {
          tx.set(otherUserRef, { matchmakingPendingContinue: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }

        // Eğer bu match karşılıklı onay sonrası kilitlenmişse kilidi kaldır
        tx.set(
          meRef,
          {
            matchmakingLock: { active: false, matchId: '' },
            lastMatchRemovalAtMs: nowMs,
            lastMatchRemovalReason: 'rejected',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        tx.set(
          otherUserRef,
          { matchmakingLock: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
      } else {
        // accept
        // pending/lock kısıtları kaldırıldı.

        const other = decisions[otherSide];
        if (other === 'accept') {
          const acceptedAtMs = Date.now();

          if (isTwoStepActiveStartEnabled()) {
            // Yeni kural: karşılıklı beğeni sadece "mutual_interest" yaratır.
            // Aktif eşleşme (kilit + uzun sohbet) ayrıca karşılıklı onayla başlatılır.
            patch.status = 'mutual_interest';
            patch.mutualInterestAtMs = acceptedAtMs;
            patch.mutualInterestAt = FieldValue.serverTimestamp();
            status = 'mutual_interest';
          } else {
            // Legacy: karşılıklı accept anında aktif eşleşme başlat.
            patch.status = 'mutual_accepted';
            patch.mutualAcceptedAtMs = acceptedAtMs;

            if (!data?.everMutualAcceptedAtMs) {
              patch.everMutualAcceptedAtMs = Date.now();
              patch.everMutualAcceptedAt = FieldValue.serverTimestamp();
            }

            // Chat otomatik aktif: 48 saat kilidi bu başlangıçtan hesaplanır.
            patch.interactionMode = 'chat';
            patch.interactionChosenAt = FieldValue.serverTimestamp();
            patch.chatEnabledAt = FieldValue.serverTimestamp();
            patch.chatEnabledAtMs = acceptedAtMs;
            patch.interactionChoices = {};
          }

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

          // Bu kullanıcıya gelmiş beğeni varsa, kabul edince de inbox'tan kaldır.
          // Firestore transaction kuralı: okumalardan (tx.get) sonra yaz.
          try {
            tx.delete(myInboxRef);
          } catch {
            // noop
          }

          if (!isTwoStepActiveStartEnabled()) {
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
          }

          // Pending temizliği (mutual_accepted artık aktif kilit ile yönetilir)
          if (myPending === matchId) {
            tx.set(meRef, { matchmakingPendingContinue: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
          }
          const otherPending = getPendingContinueMatchId(otherUser);
          if (otherPending === matchId) {
            tx.set(otherUserRef, { matchmakingPendingContinue: { active: false, matchId: '' }, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
          }

        } else {
          status = String(data?.status || 'proposed');

          // Karşı taraf henüz beğenmediyse: ona inbox beğeni bildirimi yaz.
          // Not: Böylece karşı tarafın listesinde olmasa bile "X sana beğeni gönderdi" görebilir.
          const nowLikeMs = Date.now();
          tx.set(
            otherInboxRef,
            buildInboxLikePayload({
              FieldValue,
              matchId,
              fromUid: uid,
              toUid: otherUserId,
              fromProfile: myProfileSnap,
              nowMs: nowLikeMs,
            }),
            { merge: true }
          );

          // Karşı taraf henüz onaylamadı: pending işaretle (tek kişiyle devam).
          if (!myPending) {
            tx.set(
              meRef,
              {
                matchmakingPendingContinue: { active: true, matchId, startedAtMs: Date.now() },
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          }
        }
      }

      tx.set(ref, patch, { merge: true });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status, creditGranted, cooldownUntilMs }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
