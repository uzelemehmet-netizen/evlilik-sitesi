import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow, normalizeGender } from './_matchmakingEligibility.js';

function asNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

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

function lastSeenMsFromUserDoc(userDoc) {
  const ms = typeof userDoc?.lastSeenAtMs === 'number' && Number.isFinite(userDoc.lastSeenAtMs) ? userDoc.lastSeenAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(userDoc?.lastSeenAt);
  return ts > 0 ? ts : 0;
}

function appCreatedAtMs(app) {
  const ms = typeof app?.createdAtMs === 'number' && Number.isFinite(app.createdAtMs) ? app.createdAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(app?.createdAt);
  return ts > 0 ? ts : 0;
}

function countryCodeFromFreeText(country) {
  const s = safeStr(country).toLowerCase();
  if (!s) return '';
  if (s.includes('tür') || s.includes('turk') || s.includes('tr')) return 'tr';
  if (s.includes('indo') || s.includes('endonez')) return 'id';
  return 'other';
}

function setHas(list, v) {
  return Array.isArray(list) && v ? list.includes(v) : false;
}

function computeFitScore(seeker, candidate) {
  const seekerAge = asNum(seeker?.age);
  const candAge = asNum(candidate?.age);

  const p = seeker?.partnerPreferences || {};
  const seekerDetails = seeker?.details || {};
  const candDetails = candidate?.details || {};

  const weights = {
    age: 18,
    height: 10,
    maritalStatus: 8,
    religion: 8,
    livingCountry: 10,
    communicationLanguage: 10,
    translationApp: 4,
    smoking: 6,
    alcohol: 6,
    children: 8,
    education: 6,
    occupation: 4,
    familyValues: 6,
  };

  let total = 0;
  let earned = 0;

  // Yaş
  if (seekerAge !== null && candAge !== null && (asNum(p?.ageMin) !== null || asNum(p?.ageMax) !== null)) {
    const min = asNum(p?.ageMin);
    const max = asNum(p?.ageMax);
    total += weights.age;
    const ok = (min === null || candAge >= min) && (max === null || candAge <= max);
    if (ok) earned += weights.age;
  } else if (seekerAge !== null && candAge !== null && (asNum(p?.ageMaxOlderYears) !== null || asNum(p?.ageMaxYoungerYears) !== null)) {
    const older = asNum(p?.ageMaxOlderYears) ?? 0;
    const younger = asNum(p?.ageMaxYoungerYears) ?? 0;
    total += weights.age;
    const ok = candAge >= Math.max(18, seekerAge - younger) && candAge <= Math.min(99, seekerAge + older);
    if (ok) earned += weights.age;
  }

  // Boy
  const candHeight = asNum(candDetails?.heightCm);
  const minH = asNum(p?.heightMinCm);
  const maxH = asNum(p?.heightMaxCm);
  if (candHeight !== null && (minH !== null || maxH !== null)) {
    total += weights.height;
    const ok = (minH === null || candHeight >= minH) && (maxH === null || candHeight <= maxH);
    if (ok) earned += weights.height;
  }

  // Medeni hal
  if (safeStr(p?.maritalStatus)) {
    total += weights.maritalStatus;
    const ok = safeStr(p.maritalStatus) === safeStr(candDetails?.maritalStatus);
    if (ok) earned += weights.maritalStatus;
  }

  // Din
  if (safeStr(p?.religion)) {
    total += weights.religion;
    const ok = safeStr(p.religion) === safeStr(candDetails?.religion);
    if (ok) earned += weights.religion;
  }

  // Yaşadığı ülke
  if (safeStr(p?.livingCountry) && safeStr(p.livingCountry) !== 'doesnt_matter') {
    total += weights.livingCountry;
    const candC = countryCodeFromFreeText(candidate?.country);
    const ok = safeStr(p.livingCountry) === candC;
    if (ok) earned += weights.livingCountry;
  }

  // İletişim dili
  if (safeStr(p?.communicationLanguage) && safeStr(p.communicationLanguage) !== 'doesnt_matter') {
    total += weights.communicationLanguage;
    const candLang = candDetails?.languages || {};
    const native = safeStr(candLang?.native?.code || candDetails?.communicationLanguage);
    const foreignCodes = Array.isArray(candLang?.foreign?.codes) ? candLang.foreign.codes : [];
    const knows = (code) => code && (native === code || setHas(foreignCodes, code));

    const pref = safeStr(p.communicationLanguage);
    const ok = knows(pref);
    if (ok) {
      earned += weights.communicationLanguage;
    } else {
      const canTranslate = !!candDetails?.canCommunicateWithTranslationApp;
      if (canTranslate && pref !== 'other') {
        earned += Math.round(weights.communicationLanguage * 0.5);
      }
    }
  }

  // Çeviri uygulaması şartı
  if (typeof p?.canCommunicateWithTranslationApp === 'boolean') {
    total += weights.translationApp;
    const candCan = !!candDetails?.canCommunicateWithTranslationApp;
    const ok = p.canCommunicateWithTranslationApp ? candCan : true;
    if (ok) earned += weights.translationApp;
  }

  // Sigara
  if (safeStr(p?.smokingPreference)) {
    total += weights.smoking;
    const ok = safeStr(p.smokingPreference) === safeStr(candDetails?.smoking);
    if (ok) earned += weights.smoking;
  }

  // Alkol
  if (safeStr(p?.alcoholPreference)) {
    total += weights.alcohol;
    const ok = safeStr(p.alcoholPreference) === safeStr(candDetails?.alcohol);
    if (ok) earned += weights.alcohol;
  }

  // Çocuk
  const prefChildren = safeStr(p?.childrenPreference);
  if (prefChildren && prefChildren !== 'doesnt_matter') {
    total += weights.children;
    const has = safeStr(candDetails?.hasChildren);
    const ok =
      (prefChildren === 'want_children' && has === 'yes') ||
      (prefChildren === 'no_children' && has === 'no');
    if (ok) earned += weights.children;
  }

  // Eğitim
  const prefEdu = safeStr(p?.educationPreference);
  if (prefEdu && prefEdu !== 'doesnt_matter') {
    total += weights.education;
    const ok = prefEdu === safeStr(candDetails?.education);
    if (ok) earned += weights.education;
  }

  // Meslek
  const prefOcc = safeStr(p?.occupationPreference);
  if (prefOcc && prefOcc !== 'doesnt_matter') {
    total += weights.occupation;
    const ok = prefOcc === safeStr(candDetails?.occupation);
    if (ok) earned += weights.occupation;
  }

  // Aile değerleri
  const prefFam = safeStr(p?.familyValuesPreference);
  if (prefFam && prefFam !== 'doesnt_matter') {
    total += weights.familyValues;
    const ok = prefFam === safeStr(seekerDetails?.religiousValues || '') || prefFam === safeStr(candDetails?.religiousValues || '');
    if (ok) earned += weights.familyValues;
  }

  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((earned / total) * 100)));
}

function isMembershipActiveUserDoc(userDoc, now = Date.now()) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > now;
}

function buildPublicProfile(app, userStatus) {
  const details = app?.details || {};
  return {
    identityVerified: !!userStatus?.identityVerified,
    proMember: !!userStatus?.membershipActive && String(userStatus?.membershipPlan || '') === 'pro',
    membershipActive: !!userStatus?.membershipActive,
    membershipPlan: safeStr(userStatus?.membershipPlan),
    profileNo: asNum(app?.profileNo),
    profileCode: safeStr(app?.profileCode),
    username: safeStr(app?.username),
    age: asNum(app?.age),
    city: safeStr(app?.city),
    country: safeStr(app?.country),
    photoUrls: Array.isArray(app?.photoUrls) ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [],
    details: {
      maritalStatus: safeStr(details?.maritalStatus),
    },
  };
}

function nowMs() {
  return Date.now();
}

function dayKeyUtc(ts) {
  try {
    return new Date(typeof ts === 'number' ? ts : Date.now()).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function getMembershipPlan(userDoc) {
  const m = userDoc?.membership || null;
  const raw = typeof m?.plan === 'string' ? m.plan : '';
  return String(raw || '').toLowerCase().trim();
}

function isMembershipActive(userDoc, now = Date.now()) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > now;
}

function dailyNewMatchLimitForUser(userDoc) {
  // Yeni net kural: paket bağımsız günlük 3.
  return 3;
}

function matchCancelledAtMs(match) {
  const ms = typeof match?.cancelledAtMs === 'number' && Number.isFinite(match.cancelledAtMs) ? match.cancelledAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(match?.cancelledAt);
  return ts > 0 ? ts : 0;
}

function hasEverActiveMatch(match) {
  const ms =
    (typeof match?.everMutualAcceptedAtMs === 'number' && Number.isFinite(match.everMutualAcceptedAtMs) ? match.everMutualAcceptedAtMs : 0) ||
    (typeof match?.chatEnabledAtMs === 'number' && Number.isFinite(match.chatEnabledAtMs) ? match.chatEnabledAtMs : 0) ||
    (typeof match?.mutualAcceptedAtMs === 'number' && Number.isFinite(match.mutualAcceptedAtMs) ? match.mutualAcceptedAtMs : 0) ||
    tsToMs(match?.chatEnabledAt) ||
    tsToMs(match?.mutualAcceptedAt) ||
    0;
  return ms > 0;
}

function canRematchMatchDoc(match, nowMs) {
  if (!match) return false;
  if (hasEverActiveMatch(match)) return false;

  const status = safeStr(match?.status);
  if (status !== 'cancelled') return false;

  const reason = safeStr(match?.cancelledReason);
  if (reason !== 'rejected' && reason !== 'rejected_all') return false;

  const rejectionCount = typeof match?.rejectionCount === 'number' && Number.isFinite(match.rejectionCount) ? match.rejectionCount : 0;
  if (rejectionCount >= 2) return false;

  const cancelledAtMs = matchCancelledAtMs(match);
  const REMATCH_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
  if (!cancelledAtMs) return false;
  if (nowMs - cancelledAtMs < REMATCH_COOLDOWN_MS) return false;

  return true;
}

async function resolveGenderFromAnyApplication(db, uid) {
  try {
    const snap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(1).get();
    const doc = snap?.docs?.[0];
    if (!doc) return '';
    const data = doc.data() || {};
    return typeof data?.gender === 'string' ? data.gender.trim() : '';
  } catch {
    return '';
  }
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
    const action = safeStr(body?.action) || 'request_new';
    const slotMatchId = safeStr(body?.matchId);

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingUsers').doc(uid);

    // Transaction içinde query yapmamak için gender fallback’ını burada çöz.
    const genderFallback = normalizeGender(await resolveGenderFromAnyApplication(db, uid));

    const ts = nowMs();
    const today = dayKeyUtc(ts);

    let result = { remaining: 0, limit: 0, dayKey: today, count: 0 };

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? (snap.data() || {}) : {};

      const cooldownUntilMs = asNum(data?.newMatchCooldownUntilMs) || 0;
      const inCooldown = cooldownUntilMs > ts;
      if (action === 'request_new' && inCooldown) {
        const err = new Error('cooldown_active');
        err.statusCode = 429;
        err.details = { cooldownUntilMs };
        throw err;
      }

      // Eligibility: özellikle kadın kullanıcılar için (paid OR (verified + freeActive)).
      const g = normalizeGender(data?.gender) || genderFallback;
      ensureEligibleOrThrow(data, g);

      const limit = dailyNewMatchLimitForUser(data);

      const totalPrev = typeof data?.newMatchRequestTotalCount === 'number' ? data.newMatchRequestTotalCount : 0;

      const q = data?.newMatchRequestQuota || {};
      const qDayKey = typeof q?.dayKey === 'string' ? q.dayKey : '';
      const qCount = typeof q?.count === 'number' ? q.count : 0;

      const count = qDayKey === today ? qCount : 0;

      const replacementCredits = typeof data?.newMatchReplacementCredits === 'number' ? data.newMatchReplacementCredits : 0;
      const useReplacementCredit = action === 'request_new' && count >= limit && replacementCredits > 0;

      if (count >= limit && !useReplacementCredit) {
        const err = new Error('quota_exhausted');
        err.statusCode = 429;
        throw err;
      }

      // Slot boşaltma: günlük 1 kez (toplam 3 hak içinden).
      const freeSlotQ = data?.freeSlotQuota || {};
      const freeSlotDayKey = typeof freeSlotQ?.dayKey === 'string' ? freeSlotQ.dayKey : '';
      const freeSlotCountPrev = typeof freeSlotQ?.count === 'number' ? freeSlotQ.count : 0;
      const freeSlotCount = freeSlotDayKey === today ? freeSlotCountPrev : 0;
      const freeSlotLimit = 1;

      if (action === 'free_slot') {
        if (!slotMatchId) {
          const err = new Error('bad_request');
          err.statusCode = 400;
          throw err;
        }

        if (freeSlotCount >= freeSlotLimit) {
          const err = new Error('free_slot_quota_exhausted');
          err.statusCode = 429;
          throw err;
        }

        // Match dokümanını da aynı transaction içinde iptal et.
        const matchRef = db.collection('matchmakingMatches').doc(slotMatchId);
        const matchSnap = await tx.get(matchRef);
        if (!matchSnap.exists) {
          const err = new Error('not_found');
          err.statusCode = 404;
          throw err;
        }

        const match = matchSnap.data() || {};
        const status = safeStr(match?.status);
        const userIds = Array.isArray(match?.userIds) ? match.userIds.map(String).filter(Boolean) : [];
        if (userIds.length !== 2 || !userIds.includes(uid)) {
          const err = new Error('forbidden');
          err.statusCode = 403;
          throw err;
        }
        if (status !== 'proposed') {
          const err = new Error('not_available');
          err.statusCode = 400;
          throw err;
        }

        const otherUid = userIds.find((x) => x && x !== uid) || '';
        const otherRef = otherUid ? db.collection('matchmakingUsers').doc(otherUid) : null;
        const otherSnap = otherRef ? await tx.get(otherRef) : null;
        const other = otherSnap?.exists ? (otherSnap.data() || {}) : {};

        const clearChoice = (userDoc) => {
          const choice = userDoc?.matchmakingChoice || null;
          const active = !!choice?.active;
          const matchId = safeStr(choice?.matchId);
          return active && matchId === slotMatchId;
        };

        const mePatch = {};
        if (clearChoice(data)) mePatch.matchmakingChoice = { active: false, matchId: '' };

        const otherPatch = {};
        if (otherRef && clearChoice(other)) otherPatch.matchmakingChoice = { active: false, matchId: '' };

        const nextCount = count + 1;
        const COOLDOWN_MS = 1 * 60 * 60 * 1000;
        const slotThreshold = 70;
        result = {
          remaining: Math.max(0, limit - nextCount),
          limit,
          dayKey: today,
          count: nextCount,
          freeSlotRemaining: 0,
          action: 'free_slot',
          creditGranted: 1,
          cooldownUntilMs: ts + COOLDOWN_MS,
          newUserSlotActive: true,
          newUserSlotThreshold: slotThreshold,
        };

        tx.set(
          matchRef,
          {
            status: 'cancelled',
            cancelledAt: FieldValue.serverTimestamp(),
            cancelledAtMs: ts,
            cancelledByUserId: uid,
            cancelledReason: 'slot_freed',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        tx.set(
          ref,
          {
            ...mePatch,
            requestedNewMatchAt: FieldValue.serverTimestamp(),
            requestedNewMatchAtMs: ts,
            newMatchRequestTotalCount: totalPrev + 1,
            newMatchReplacementCredits: FieldValue.increment(1),
            newMatchCooldownUntilMs: ts + COOLDOWN_MS,
            lastMatchRemovalAtMs: ts,
            lastMatchRemovalReason: 'slot_freed',
            newUserSlot: {
              active: true,
              sinceMs: ts,
              threshold: slotThreshold,
              updatedAt: FieldValue.serverTimestamp(),
            },
            newMatchRequestQuota: {
              dayKey: today,
              count: nextCount,
              limit,
              updatedAt: FieldValue.serverTimestamp(),
            },
            freeSlotQuota: {
              dayKey: today,
              count: freeSlotCount + 1,
              limit: freeSlotLimit,
              updatedAt: FieldValue.serverTimestamp(),
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        if (otherRef && Object.keys(otherPatch).length) {
          tx.set(otherRef, { ...otherPatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        return;
      }

      if (useReplacementCredit) {
        // Kotayı artırmadan (1e1) kredi tüket.
        result = {
          remaining: Math.max(0, limit - count),
          limit,
          dayKey: today,
          count,
          freeSlotRemaining: Math.max(0, freeSlotLimit - freeSlotCount),
          action: 'request_new',
        };

        tx.set(
          ref,
          {
            requestedNewMatchAt: FieldValue.serverTimestamp(),
            requestedNewMatchAtMs: ts,
            newMatchRequestTotalCount: totalPrev + 1,
            newMatchReplacementCredits: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return;
      }

      const nextCount = count + 1;
      result = {
        remaining: Math.max(0, limit - nextCount),
        limit,
        dayKey: today,
        count: nextCount,
        freeSlotRemaining: Math.max(0, freeSlotLimit - freeSlotCount),
        action: 'request_new',
      };

      tx.set(
        ref,
        {
          requestedNewMatchAt: FieldValue.serverTimestamp(),
          requestedNewMatchAtMs: ts,
          newMatchRequestTotalCount: totalPrev + 1,
          newMatchRequestQuota: {
            dayKey: today,
            count: nextCount,
            limit,
            updatedAt: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    // Not: Daha önce bu endpoint yalnızca "istek" kaydı tutuyordu.
    // Cron/job kurulumu yoksa kullanıcılar hiç eşleşme göremiyor.
    // Bu yüzden burada, requester için anlık eşleşme üretip matchmakingMatches koleksiyonuna yazıyoruz.
    let created = 0;
    try {
      if (action !== 'request_new') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true, ...result, created }));
        return;
      }

      const now = Date.now();
      const PROPOSED_TTL_MS = 48 * 60 * 60 * 1000;
      const INACTIVE_TTL_MS = 24 * 60 * 60 * 1000;
      const inactiveCutoffMs = now - INACTIVE_TTL_MS;

      // Kullanıcının başvurusunu al.
      const seekerSnap = await db
        .collection('matchmakingApplications')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      const seekerDoc = seekerSnap?.docs?.[0];
      const seeker = seekerDoc ? { id: seekerDoc.id, ...(seekerDoc.data() || {}) } : null;

      if (seeker && seeker?.userId && seeker?.gender && seeker?.lookingForGender) {
        const userSnap = await db.collection('matchmakingUsers').doc(uid).get();
        const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};

        const newUserSlot = userDoc?.newUserSlot || null;
        const newUserSlotActive = !!newUserSlot?.active;
        const newUserSlotSinceMs = asNum(newUserSlot?.sinceMs) || 0;

        const membershipActive = isMembershipActiveUserDoc(userDoc, now);
        const plan = membershipActive ? String(userDoc?.membership?.plan || '').toLowerCase().trim() : '';
        const requesterIdentityVerified =
          !!userDoc?.identityVerified ||
          ['verified', 'approved'].includes(String(userDoc?.identityVerification?.status || '').toLowerCase().trim());

        // Bu endpoint bir "yenileme" aksiyonu: her çağrıda en fazla 1 yeni eşleşme üret.
        const maxMatches = 1;

        // Mevcut eşleşmeler (bu kullanıcı için) - tekrar üretmeyi engelle.
        const existingSnap = await db
          .collection('matchmakingMatches')
          .where('userIds', 'array-contains', uid)
          .limit(5000)
          .get();
        const existingOtherIds = new Set();
        existingSnap.docs.forEach((d) => {
          const m = d.data() || {};
          const ids = Array.isArray(m.userIds) ? m.userIds.map(String).filter(Boolean) : [];
          if (ids.length === 2) {
            const other = ids[0] === uid ? ids[1] : ids[0];
            if (!other) return;

            // Re-match politikası: sadece "rejected" iptallerini ve cooldown sonrası, max 2 kez.
            const allowRematch = canRematchMatchDoc(m, now);
            if (!allowRematch) existingOtherIds.add(other);
          }
        });

        // Aday havuzu: son N başvuru.
        const appsSnap = await db
          .collection('matchmakingApplications')
          .orderBy('createdAt', 'desc')
          .limit(600)
          .get();
        const apps = appsSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() || {}) }))
          .filter((a) => a?.userId && a?.gender && a?.lookingForGender);

        // Aday userId listesi (erkek/kadın havuzuna göre).
        const wantGender = safeStr(seeker.lookingForGender);
        const wantNat = safeStr(seeker.lookingForNationality);
        const poolRaw = apps.filter((a) => {
          if (!a?.userId || a.userId === uid) return false;
          if (existingOtherIds.has(String(a.userId))) return false;
          if (safeStr(a.gender) !== wantGender) return false;

          // Yeni kullanıcı slotu açıksa: slot açıldıktan sonra gelen yeni kayıtları normal havuzdan çıkar.
          // (Yeni kayıtlar sadece slot dolumu için kullanılacak.)
          if (newUserSlotActive && newUserSlotSinceMs > 0) {
            const createdMs = appCreatedAtMs(a);
            if (createdMs > 0 && createdMs > newUserSlotSinceMs) return false;
          }

          // Karşı tarafın da seeker ile uyumu
          if (safeStr(a.lookingForGender) && safeStr(a.lookingForGender) !== safeStr(seeker.gender)) return false;
          if (safeStr(a.lookingForNationality) && safeStr(a.lookingForNationality) !== safeStr(seeker.nationality)) return false;

          if (wantNat && wantNat !== 'other') {
            return safeStr(a.nationality) === wantNat;
          }
          return true;
        });

        const uniqueUserIds = Array.from(new Set(poolRaw.map((a) => String(a.userId)).filter(Boolean)));
        const chunks = [];
        for (let i = 0; i < uniqueUserIds.length; i += 10) chunks.push(uniqueUserIds.slice(i, i + 10));

        const userStatusById = new Map();
        for (const chunk of chunks) {
          const snap = await db.collection('matchmakingUsers').where('__name__', 'in', chunk).get();
          snap.docs.forEach((d) => {
            const data = d.data() || {};
            userStatusById.set(d.id, {
              blocked: !!data.blocked,
              lockActive: !!data?.matchmakingLock?.active,
              lastSeenAtMs: lastSeenMsFromUserDoc(data),
              identityVerified: !!data?.identityVerified || ['verified', 'approved'].includes(String(data?.identityVerification?.status || '').toLowerCase().trim()),
              membershipActive: isMembershipActiveUserDoc(data, now),
              membershipPlan: typeof data?.membership?.plan === 'string' ? String(data.membership.plan).toLowerCase().trim() : '',
            });
          });
        }

        const pool = poolRaw.filter((cand) => {
          const st = userStatusById.get(String(cand.userId)) || { blocked: false, lockActive: false };
          if (st.blocked || st.lockActive) return false;

          const seen = typeof st?.lastSeenAtMs === 'number' ? st.lastSeenAtMs : 0;
          const createdMs = appCreatedAtMs(cand);
          const inactive = seen > 0 ? seen <= inactiveCutoffMs : createdMs > 0 && createdMs <= inactiveCutoffMs;
          if (inactive) return false;

          return true;
        });

        const scored = pool.map((cand) => {
          const scoreA = computeFitScore(seeker, cand);
          const scoreB = computeFitScore(cand, seeker);
          const score = Math.round((scoreA + scoreB) / 2);
          return { cand, score, scoreA, scoreB };
        });

        const threshold = 70;
        const eligible = scored.filter((x) => x.score >= threshold && x.scoreA >= threshold && x.scoreB >= threshold);
        const picked = eligible.length ? eligible : scored;
        picked.sort((x, y) => y.score - x.score);

        const top = picked.slice(0, maxMatches);
        for (const row of top) {
          const otherUid = String(row.cand.userId);
          if (!otherUid) continue;
          if (existingOtherIds.has(otherUid)) continue;

          const userIdsSorted = [uid, otherUid].sort();
          const matchId = `${userIdsSorted[0]}__${userIdsSorted[1]}`;
          const ref = db.collection('matchmakingMatches').doc(matchId);
          const existing = await ref.get();
          if (existing.exists) {
            const ex = existing.data() || {};
            if (!canRematchMatchDoc(ex, now)) {
              existingOtherIds.add(otherUid);
              continue;
            }
          }

          const base = {
            userIds: userIdsSorted,
            aUserId: uid,
            bUserId: otherUid,
            aApplicationId: seeker.id,
            bApplicationId: row.cand.id,
            scoreAtoB: row.scoreA,
            scoreBtoA: row.scoreB,
            score: row.score,
            status: 'proposed',
            decisions: { a: null, b: null },
            profiles: {
              a: buildPublicProfile(seeker, {
                identityVerified: requesterIdentityVerified,
                membershipActive,
                membershipPlan: plan,
              }),
              b: buildPublicProfile(row.cand, userStatusById.get(otherUid) || null),
            },
            createdAt: FieldValue.serverTimestamp(),
            createdAtMs: now,
            firstCreatedAtMs: now,
            reproposedAt: FieldValue.serverTimestamp(),
            reproposedAtMs: now,
            proposedExpiresAtMs: now + PROPOSED_TTL_MS,
            updatedAt: FieldValue.serverTimestamp(),
          };

          if (existing.exists) {
            const ex = existing.data() || {};
            const first = typeof ex?.firstCreatedAtMs === 'number' && Number.isFinite(ex.firstCreatedAtMs)
              ? ex.firstCreatedAtMs
              : (typeof ex?.createdAtMs === 'number' && Number.isFinite(ex.createdAtMs) ? ex.createdAtMs : now);

            await ref.set(
              {
                ...base,
                firstCreatedAtMs: first || now,
                rematchCount: FieldValue.increment(1),
                cancelledAt: FieldValue.delete(),
                cancelledAtMs: FieldValue.delete(),
                cancelledByUserId: FieldValue.delete(),
                cancelledReason: FieldValue.delete(),
                interactionMode: FieldValue.delete(),
                interactionChosenAt: FieldValue.delete(),
                chatEnabledAt: FieldValue.delete(),
                chatEnabledAtMs: FieldValue.delete(),
                mutualAcceptedAt: FieldValue.delete(),
                mutualAcceptedAtMs: FieldValue.delete(),
                confirmations: FieldValue.delete(),
                confirmedAt: FieldValue.delete(),
                confirmedAtMs: FieldValue.delete(),
              },
              { merge: true }
            );
          } else {
            await ref.set(base);
          }

          created += 1;
          existingOtherIds.add(otherUid);
        }
      }
    } catch {
      // Match üretimi başarısız olsa bile quota güncellemesi geçerli; kullanıcı tekrar deneyebilir.
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, ...result, created }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    const cooldownUntilMs = typeof e?.details?.cooldownUntilMs === 'number' ? e.details.cooldownUntilMs : (typeof e?.cooldownUntilMs === 'number' ? e.cooldownUntilMs : 0);
    res.end(
      JSON.stringify({
        ok: false,
        error: String(e?.message || 'server_error'),
        ...(cooldownUntilMs > 0 ? { cooldownUntilMs } : {}),
      })
    );
  }
}
