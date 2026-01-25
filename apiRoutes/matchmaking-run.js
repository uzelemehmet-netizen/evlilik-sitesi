import { getAdmin, normalizeBody, requireCronSecret } from './_firebaseAdmin.js';

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

function safeStr2(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function clearUserLockIfMatch(userDoc, matchId) {
  const lock = userDoc?.matchmakingLock || null;
  const choice = userDoc?.matchmakingChoice || null;

  const lockMatchId = safeStr2(lock?.matchId);
  const choiceMatchId = safeStr2(choice?.matchId);

  const patch = {};
  if (lockMatchId === matchId) patch.matchmakingLock = { active: false, matchId: '', matchCode: '' };
  if (choiceMatchId === matchId) patch.matchmakingChoice = { active: false, matchId: '', matchCode: '' };
  return patch;
}

function lastSeenMsFromUserDoc(userDoc) {
  const ms = typeof userDoc?.lastSeenAtMs === 'number' && Number.isFinite(userDoc.lastSeenAtMs) ? userDoc.lastSeenAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(userDoc?.lastSeenAt);
  return ts > 0 ? ts : 0;
}

function baseMsFromMatch(match) {
  const base =
    (typeof match?.chatEnabledAtMs === 'number' ? match.chatEnabledAtMs : 0) ||
    (typeof match?.mutualAcceptedAtMs === 'number' ? match.mutualAcceptedAtMs : 0) ||
    (typeof match?.createdAtMs === 'number' ? match.createdAtMs : 0) ||
    tsToMs(match?.chatEnabledAt) ||
    tsToMs(match?.mutualAcceptedAt) ||
    tsToMs(match?.createdAt) ||
    0;
  return typeof base === 'number' && Number.isFinite(base) ? base : 0;
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
      // Çeviri uygulaması ile idare edebilir mi? (yarım puan)
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

function buildPublicProfile(app, userStatus) {
  const details = app?.details || {};

  // Snapshot'larda yalnızca herkese açık minimal alanlar kalsın.
  // Üyelik aktif kullanıcılar detayları server-side endpoint'ten çeker.
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

function isMembershipActiveUserDoc(userDoc) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > Date.now();
}

function isIdentityVerifiedUserDoc(data) {
  if (data?.identityVerified === true) return true;
  const st = String(data?.identityVerification?.status || '').toLowerCase().trim();
  return st === 'verified' || st === 'approved';
}

async function expireOldProposedMatches({ db, FieldValue, nowMs, ttlMs, maxToProcess = 400 }) {
  const cutoffMs = nowMs - ttlMs;
  let processed = 0;

  // Yeni dokümanlar: proposedExpiresAtMs ile.
  try {
    const snap = await db
      .collection('matchmakingMatches')
      .where('status', '==', 'proposed')
      .where('proposedExpiresAtMs', '<=', nowMs)
      .orderBy('proposedExpiresAtMs', 'asc')
      .limit(maxToProcess)
      .get();

    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((d) => {
        batch.set(
          d.ref,
          {
            status: 'cancelled',
            cancelledAt: FieldValue.serverTimestamp(),
            cancelledAtMs: nowMs,
            cancelledByUserId: 'system',
            cancelledReason: 'ttl_expired',
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        processed += 1;
      });
      await batch.commit();
    }
  } catch {
    // index yoksa / alan yoksa sessiz geç
  }

  // Eski dokümanlar (backward compat): createdAt timestamp ile.
  if (processed < maxToProcess) {
    try {
      const snap2 = await db
        .collection('matchmakingMatches')
        .where('status', '==', 'proposed')
        .where('createdAt', '<=', new Date(cutoffMs))
        .orderBy('createdAt', 'asc')
        .limit(maxToProcess - processed)
        .get();

      if (!snap2.empty) {
        const batch2 = db.batch();
        snap2.docs.forEach((d) => {
          const data = d.data() || {};
          const createdAtMs = typeof data.createdAtMs === 'number' ? data.createdAtMs : tsToMs(data.createdAt);
          if (createdAtMs && createdAtMs > cutoffMs) return;
          batch2.set(
            d.ref,
            {
              status: 'cancelled',
              cancelledAt: FieldValue.serverTimestamp(),
              cancelledAtMs: nowMs,
              cancelledByUserId: 'system',
              cancelledReason: 'ttl_expired',
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          processed += 1;
        });
        await batch2.commit();
      }
    } catch {
      // ignore
    }
  }

  return processed;
}

async function cleanupInactiveMatches({ db, FieldValue, nowMs, ttlMs, maxToProcess = 250 }) {
  const cutoffMs = nowMs - ttlMs;
  let cancelledProposed = 0;
  let cancelledMutualAccepted = 0;
  let freedLocks = 0;
  let creditsGranted = 0;

  const collectByStatus = async (status) => {
    try {
      const snap = await db.collection('matchmakingMatches').where('status', '==', status).limit(maxToProcess).get();
      return snap.docs;
    } catch {
      return [];
    }
  };

  const work = [...(await collectByStatus('mutual_accepted')), ...(await collectByStatus('proposed'))];

  for (const d of work) {
    const matchId = d.id;
    await db.runTransaction(async (tx) => {
      const matchRef = db.collection('matchmakingMatches').doc(matchId);

      // IMPORTANT: Firestore transactions require all reads before all writes.
      const matchSnap = await tx.get(matchRef);
      if (!matchSnap.exists) return;
      const match = matchSnap.data() || {};
      const status = safeStr(match?.status);
      if (status !== 'mutual_accepted' && status !== 'proposed') return;

      // Zaten kesinleşmiş match'leri pasiflik kuralıyla bozmayalım.
      if (typeof match?.confirmedAtMs === 'number' && match.confirmedAtMs > 0) return;

      const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
      if (userIds.length !== 2) return;
      const [u1, u2] = userIds;

      const u1Ref = db.collection('matchmakingUsers').doc(u1);
      const u2Ref = db.collection('matchmakingUsers').doc(u2);

      const u1Snap = await tx.get(u1Ref);
      const u2Snap = await tx.get(u2Ref);
      const u1Doc = u1Snap.exists ? (u1Snap.data() || {}) : {};
      const u2Doc = u2Snap.exists ? (u2Snap.data() || {}) : {};

      const u1Seen = lastSeenMsFromUserDoc(u1Doc);
      const u2Seen = lastSeenMsFromUserDoc(u2Doc);
      const baseMs = baseMsFromMatch(match);

      // lastSeen yoksa: sadece match'in kendisi 24 saatten eskiyse pasif say.
      const u1Inactive = u1Seen > 0 ? u1Seen <= cutoffMs : baseMs > 0 && baseMs <= cutoffMs;
      const u2Inactive = u2Seen > 0 ? u2Seen <= cutoffMs : baseMs > 0 && baseMs <= cutoffMs;
      if (!u1Inactive && !u2Inactive) return;

      // İptal patch
      tx.set(
        matchRef,
        {
          status: 'cancelled',
          cancelledAt: FieldValue.serverTimestamp(),
          cancelledAtMs: nowMs,
          cancelledByUserId: 'system',
          cancelledReason: 'inactive_24h',
          inactiveCutoffMs: cutoffMs,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      if (status === 'mutual_accepted') cancelledMutualAccepted += 1;
      if (status === 'proposed') cancelledProposed += 1;

      const u1Patch = clearUserLockIfMatch(u1Doc, matchId);
      const u2Patch = clearUserLockIfMatch(u2Doc, matchId);

      // Pasif olan taraf yüzünden iptal oluyorsa, aktif tarafa 1 adet telafi kredisi ver.
      if (u1Inactive !== u2Inactive) {
        if (!u1Inactive) {
          u1Patch.newMatchReplacementCredits = FieldValue.increment(1);
          creditsGranted += 1;
        }
        if (!u2Inactive) {
          u2Patch.newMatchReplacementCredits = FieldValue.increment(1);
          creditsGranted += 1;
        }
      }

      if (Object.keys(u1Patch).length) {
        if (u1Patch.matchmakingLock || u1Patch.matchmakingChoice) freedLocks += 1;
        tx.set(u1Ref, { ...u1Patch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
      if (Object.keys(u2Patch).length) {
        if (u2Patch.matchmakingLock || u2Patch.matchmakingChoice) freedLocks += 1;
        tx.set(u2Ref, { ...u2Patch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
    });
  }

  return { cancelledProposed, cancelledMutualAccepted, freedLocks, creditsGranted };
}

async function autoConfirmOldMutualAccepted({ db, FieldValue, nowMs, ttlMs, maxToProcess = 120 }) {
  const cutoffMs = nowMs - ttlMs;
  let confirmed = 0;
  let slotsCleared = 0;

  // Önce mutualAcceptedAtMs olanları topla.
  let candidates = [];
  try {
    const snap = await db
      .collection('matchmakingMatches')
      .where('status', '==', 'mutual_accepted')
      .where('mutualAcceptedAtMs', '<=', cutoffMs)
      .orderBy('mutualAcceptedAtMs', 'asc')
      .limit(maxToProcess)
      .get();
    candidates = snap.docs;
  } catch {
    candidates = [];
  }

  // Backward compat: mutualAcceptedAt timestamp.
  if (candidates.length === 0) {
    try {
      const snap2 = await db
        .collection('matchmakingMatches')
        .where('status', '==', 'mutual_accepted')
        .where('mutualAcceptedAt', '<=', new Date(cutoffMs))
        .orderBy('mutualAcceptedAt', 'asc')
        .limit(maxToProcess)
        .get();
      candidates = snap2.docs;
    } catch {
      candidates = [];
    }
  }

  for (const doc of candidates) {
    const matchId = doc.id;
    const match = doc.data() || {};

    // Zaten kesinleştiyse idempotent.
    if (typeof match.confirmedAtMs === 'number' && match.confirmedAtMs > 0) continue;

    const baseMs =
      (typeof match.chatEnabledAtMs === 'number' ? match.chatEnabledAtMs : 0) ||
      (typeof match.mutualAcceptedAtMs === 'number' ? match.mutualAcceptedAtMs : 0) ||
      tsToMs(match.chatEnabledAt) ||
      tsToMs(match.mutualAcceptedAt);

    if (!baseMs || baseMs > cutoffMs) continue;

    const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
    if (userIds.length !== 2) continue;
    const [u1, u2] = userIds;

    // 1) Match'i kesinleşmiş olarak işaretle (status değiştirmiyoruz; contact/chat akışları kırılmasın)
    await db.collection('matchmakingMatches').doc(matchId).set(
      {
        confirmedAt: FieldValue.serverTimestamp(),
        confirmedAtMs: nowMs,
        confirmedReason: 'auto_48h',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    confirmed += 1;

    // 2) İki kullanıcı için diğer proposed slotlarını iptal et.
    for (const uid of [u1, u2]) {
      try {
        const snap = await db
          .collection('matchmakingMatches')
          .where('status', '==', 'proposed')
          .where('userIds', 'array-contains', uid)
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
              cancelledAtMs: nowMs,
              cancelledByUserId: 'system',
              cancelledReason: 'confirmed_elsewhere',
              confirmedMatchId: matchId,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          slotsCleared += 1;
        });
        await batch.commit();
      } catch {
        // ignore
      }
    }
  }

  return { confirmed, slotsCleared };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    // Bu endpoint cron/job için tasarlandı.
    requireCronSecret(req);

    const body = normalizeBody(req);
    const threshold = typeof body.threshold === 'number' ? body.threshold : 70;
    const limitApps = typeof body.limitApps === 'number' ? body.limitApps : 400;

    const { db, FieldValue } = getAdmin();

    const nowMs = Date.now();
    const PROPOSED_TTL_MS = 48 * 60 * 60 * 1000;
    const INACTIVE_TTL_MS = 24 * 60 * 60 * 1000;
    const inactiveCutoffMs = nowMs - INACTIVE_TTL_MS;

    // 48 saat kuralı:
    // - proposed: 48 saat sonunda expire
    // - mutual_accepted: 48 saat sonunda "kesinleşmiş" kabul edilir ve diğer proposed slotları boşaltılır
    const expiredProposed = await expireOldProposedMatches({ db, FieldValue, nowMs, ttlMs: PROPOSED_TTL_MS });

    // 24 saat pasif kullanıcılar: eşleşmeleri iptal et ve kilitleri aç.
    const inactiveCleanup = await cleanupInactiveMatches({ db, FieldValue, nowMs, ttlMs: INACTIVE_TTL_MS });

    const appsSnap = await db
      .collection('matchmakingApplications')
      .orderBy('createdAt', 'desc')
      .limit(Math.max(50, Math.min(2000, limitApps)))
      .get();

    const apps = appsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() || {}) }))
      .filter((a) => a?.userId && a?.gender && a?.lookingForGender);

    // Daha önce oluşturulmuş eşleşmeler: aynı iki kullanıcıyı tekrar eşleştirmemek için.
    // Not: Basit MVP; çok büyürse burada daha hedefli query gerekir.
    const existingMatchesSnap = await db
      .collection('matchmakingMatches')
      .orderBy('createdAt', 'desc')
      .limit(5000)
      .get();

    // key: "uidA__uidB" -> match summary
    const existingByPairKey = new Map();
    existingMatchesSnap.docs.forEach((d) => {
      const m = d.data() || {};
      const userIds = Array.isArray(m.userIds) ? m.userIds.map(String).filter(Boolean) : [];
      if (userIds.length === 2) {
        const key = userIds.slice().sort().join('__');
        existingByPairKey.set(key, {
          status: safeStr(m?.status),
          cancelledReason: safeStr(m?.cancelledReason),
          cancelledAtMs: typeof m?.cancelledAtMs === 'number' ? m.cancelledAtMs : tsToMs(m?.cancelledAt),
          rejectionCount: typeof m?.rejectionCount === 'number' ? m.rejectionCount : 0,
          everMutualAcceptedAtMs: typeof m?.everMutualAcceptedAtMs === 'number' ? m.everMutualAcceptedAtMs : 0,
          mutualAcceptedAtMs: typeof m?.mutualAcceptedAtMs === 'number' ? m.mutualAcceptedAtMs : tsToMs(m?.mutualAcceptedAt),
          chatEnabledAtMs: typeof m?.chatEnabledAtMs === 'number' ? m.chatEnabledAtMs : tsToMs(m?.chatEnabledAt),
          firstCreatedAtMs: typeof m?.firstCreatedAtMs === 'number' ? m.firstCreatedAtMs : (typeof m?.createdAtMs === 'number' ? m.createdAtMs : 0),
        });
      }
    });

    // Aynı çalıştırma içinde tekrar üretimi engelle.
    const producedPairKeys = new Set();

    // Kullanıcı kilidi/engeli: eşleşme üretimini durdurmak için.
    const userStatusById = new Map();
    const uniqueUserIds = Array.from(new Set(apps.map((a) => String(a.userId)).filter(Boolean)));
    const chunks = [];
    for (let i = 0; i < uniqueUserIds.length; i += 10) chunks.push(uniqueUserIds.slice(i, i + 10));
    for (const chunk of chunks) {
      const snap = await db
        .collection('matchmakingUsers')
        .where('__name__', 'in', chunk)
        .get();
      snap.docs.forEach((d) => {
        const data = d.data() || {};
        const newUserSlot = data?.newUserSlot || null;
        const newUserSlotActive = !!newUserSlot?.active;
        const newUserSlotSinceMs = typeof newUserSlot?.sinceMs === 'number' && Number.isFinite(newUserSlot.sinceMs) ? newUserSlot.sinceMs : 0;
        const newUserSlotThreshold = typeof newUserSlot?.threshold === 'number' && Number.isFinite(newUserSlot.threshold) ? newUserSlot.threshold : 70;
        userStatusById.set(d.id, {
          blocked: !!data.blocked,
          lockActive: !!data?.matchmakingLock?.active,
          lastSeenAtMs: lastSeenMsFromUserDoc(data),
          cooldownUntilMs: typeof data?.newMatchCooldownUntilMs === 'number' && Number.isFinite(data.newMatchCooldownUntilMs) ? data.newMatchCooldownUntilMs : 0,
          newUserSlotActive,
          newUserSlotSinceMs,
          newUserSlotThreshold,
          identityVerified: isIdentityVerifiedUserDoc(data),
          membershipActive: isMembershipActiveUserDoc(data),
          membershipPlan: typeof data?.membership?.plan === 'string' ? String(data.membership.plan).toLowerCase().trim() : '',
        });
      });
    }

    // Basit filtre: sadece karşılıklı beklenti uyumu olanları ele al.
    const byGender = {
      male: apps.filter((a) => a.gender === 'male'),
      female: apps.filter((a) => a.gender === 'female'),
    };

    let created = 0;
    let skippedExisting = 0;

    // Kaba bir yaklaşım: her başvuru için aday üret.
    // Not: Pro aktif üyeler için top-3 kısıtını kaldırıyoruz.
    for (const seeker of apps) {
      const seekerUserId = seeker.userId;

      const seekerStatus = userStatusById.get(String(seekerUserId)) || { blocked: false, lockActive: false };
      // Engelli veya kilitliyse: yeni eşleşme üretme.
      if (seekerStatus.blocked || seekerStatus.lockActive) {
        continue;
      }

      // Birini listesinden çıkaran kullanıcı 6 saat beklesin (cooldown).
      const cooldownUntilMs = typeof seekerStatus?.cooldownUntilMs === 'number' ? seekerStatus.cooldownUntilMs : 0;
      if (cooldownUntilMs > nowMs) {
        continue;
      }

      // 24 saatten uzun pasif kullanıcı için yeni eşleşme üretme.
      const seekerSeen = typeof seekerStatus?.lastSeenAtMs === 'number' ? seekerStatus.lastSeenAtMs : 0;
      const seekerCreatedAtMs = typeof seeker?.createdAtMs === 'number' ? seeker.createdAtMs : tsToMs(seeker?.createdAt);
      const seekerInactive = seekerSeen > 0 ? seekerSeen <= inactiveCutoffMs : seekerCreatedAtMs > 0 && seekerCreatedAtMs <= inactiveCutoffMs;
      if (seekerInactive) continue;

      const wantGender = seeker.lookingForGender;
      const wantNat = seeker.lookingForNationality;

      // New-user slot aktifse: sadece slot açıldıktan sonra gelen yeni kayıtlardan (>=threshold) 1 eşleşme üret.
      if (seekerStatus?.newUserSlotActive && seekerStatus?.newUserSlotSinceMs > 0) {
        const sinceMs = seekerStatus.newUserSlotSinceMs;
        const slotThreshold = typeof seekerStatus?.newUserSlotThreshold === 'number' ? seekerStatus.newUserSlotThreshold : 70;

        const poolNew = (byGender[wantGender] || []).filter((cand) => {
          if (!cand?.userId || cand.userId === seekerUserId) return false;

          const candStatus = userStatusById.get(String(cand.userId)) || { blocked: false, lockActive: false };
          if (candStatus.blocked || candStatus.lockActive) return false;

          const candSeen = typeof candStatus?.lastSeenAtMs === 'number' ? candStatus.lastSeenAtMs : 0;
          const candCreatedAtMs = typeof cand?.createdAtMs === 'number' ? cand.createdAtMs : tsToMs(cand?.createdAt);
          const candInactive = candSeen > 0 ? candSeen <= inactiveCutoffMs : candCreatedAtMs > 0 && candCreatedAtMs <= inactiveCutoffMs;
          if (candInactive) return false;

          // Yalnızca slot açıldıktan sonra kaydolanlar.
          const createdMs = candCreatedAtMs;
          if (!(createdMs > sinceMs)) return false;

          // Re-match politikası: reddedilen çiftleri cooldown sonrası tekrar önerebiliriz.
          const pairKey = [String(seekerUserId), String(cand.userId)].sort().join('__');
          if (producedPairKeys.has(pairKey)) return false;
          const existing = existingByPairKey.get(pairKey) || null;
          if (existing && !canRematchMatchDoc(existing, nowMs)) return false;

          // Karşı tarafın da seeker ile uyumu
          if (safeStr(cand.lookingForGender) && safeStr(cand.lookingForGender) !== safeStr(seeker.gender)) return false;
          if (safeStr(cand.lookingForNationality) && safeStr(cand.lookingForNationality) !== safeStr(seeker.nationality)) return false;

          if (wantNat && wantNat !== 'other') {
            return safeStr(cand.nationality) === safeStr(wantNat);
          }
          return true;
        });

        const scoredNew = [];
        for (const cand of poolNew) {
          const scoreA = computeFitScore(seeker, cand);
          const scoreB = computeFitScore(cand, seeker);
          const score = Math.round((scoreA + scoreB) / 2);
          if (score >= slotThreshold && scoreA >= slotThreshold && scoreB >= slotThreshold) {
            scoredNew.push({ cand, score, scoreA, scoreB });
          }
        }

        scoredNew.sort((x, y) => y.score - x.score);
        const pickedNew = scoredNew.slice(0, 1);

        if (pickedNew.length) {
          const row = pickedNew[0];
          const aUserId = seekerUserId;
          const bUserId = row.cand.userId;
          const userIdsSorted = [aUserId, bUserId].sort();
          const matchId = `${userIdsSorted[0]}__${userIdsSorted[1]}`;

          const ref = db.collection('matchmakingMatches').doc(matchId);
          const existing = await ref.get();
          if (existing.exists) {
            const ex = existing.data() || {};
            if (canRematchMatchDoc(ex, nowMs)) {
              const first = typeof ex?.firstCreatedAtMs === 'number' && Number.isFinite(ex.firstCreatedAtMs)
                ? ex.firstCreatedAtMs
                : (typeof ex?.createdAtMs === 'number' && Number.isFinite(ex.createdAtMs) ? ex.createdAtMs : nowMs);

              await ref.set(
                {
                  userIds: userIdsSorted,
                  aUserId,
                  bUserId,
                  aApplicationId: seeker.id,
                  bApplicationId: row.cand.id,
                  scoreAtoB: row.scoreA,
                  scoreBtoA: row.scoreB,
                  score: row.score,
                  status: 'proposed',
                  decisions: { a: null, b: null },
                  profiles: {
                    a: buildPublicProfile(seeker, userStatusById.get(String(aUserId)) || null),
                    b: buildPublicProfile(row.cand, userStatusById.get(String(bUserId)) || null),
                  },
                  createdAt: FieldValue.serverTimestamp(),
                  createdAtMs: nowMs,
                  firstCreatedAtMs: first || nowMs,
                  reproposedAt: FieldValue.serverTimestamp(),
                  reproposedAtMs: nowMs,
                  proposedExpiresAtMs: nowMs + PROPOSED_TTL_MS,
                  updatedAt: FieldValue.serverTimestamp(),
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
              created += 1;
              producedPairKeys.add(matchId);
            } else {
              skippedExisting += 1;
            }
          } else {
            await ref.set({
              userIds: userIdsSorted,
              aUserId,
              bUserId,
              aApplicationId: seeker.id,
              bApplicationId: row.cand.id,
              scoreAtoB: row.scoreA,
              scoreBtoA: row.scoreB,
              score: row.score,
              status: 'proposed',
              decisions: { a: null, b: null },
              profiles: {
                a: buildPublicProfile(seeker, userStatusById.get(String(aUserId)) || null),
                b: buildPublicProfile(row.cand, userStatusById.get(String(bUserId)) || null),
              },
              createdAt: FieldValue.serverTimestamp(),
              createdAtMs: nowMs,
              firstCreatedAtMs: nowMs,
              reproposedAt: FieldValue.serverTimestamp(),
              reproposedAtMs: nowMs,
              proposedExpiresAtMs: nowMs + PROPOSED_TTL_MS,
              updatedAt: FieldValue.serverTimestamp(),
            });
            created += 1;
            producedPairKeys.add(matchId);
          }

          // Slot doldu: kapat.
          await db.collection('matchmakingUsers').doc(String(seekerUserId)).set(
            {
              newUserSlot: {
                active: false,
                sinceMs,
                threshold: slotThreshold,
                filledAtMs: nowMs,
                filledMatchId: matchId,
                updatedAt: FieldValue.serverTimestamp(),
              },
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }

        // Slot açıkken otomatik normal havuzdan üretim yapma.
        continue;
      }

      const pool = (byGender[wantGender] || []).filter((cand) => {
        if (!cand?.userId || cand.userId === seekerUserId) return false;

        const candStatus = userStatusById.get(String(cand.userId)) || { blocked: false, lockActive: false };
        if (candStatus.blocked || candStatus.lockActive) return false;

        const candSeen = typeof candStatus?.lastSeenAtMs === 'number' ? candStatus.lastSeenAtMs : 0;
        const candCreatedAtMs = typeof cand?.createdAtMs === 'number' ? cand.createdAtMs : tsToMs(cand?.createdAt);
        const candInactive = candSeen > 0 ? candSeen <= inactiveCutoffMs : candCreatedAtMs > 0 && candCreatedAtMs <= inactiveCutoffMs;
        if (candInactive) return false;

        // Re-match politikası: reddedilen çiftleri cooldown sonrası (2 kez sınırıyla) tekrar önerebiliriz.
        const pairKey = [String(seekerUserId), String(cand.userId)].sort().join('__');
        if (producedPairKeys.has(pairKey)) return false;
        const existing = existingByPairKey.get(pairKey) || null;
        if (existing && !canRematchMatchDoc(existing, nowMs)) return false;

        // Karşı tarafın da "ben kimi arıyorum" kısmı seeker ile uyumlu mu?
        if (safeStr(cand.lookingForGender) && safeStr(cand.lookingForGender) !== safeStr(seeker.gender)) return false;
        if (safeStr(cand.lookingForNationality) && safeStr(cand.lookingForNationality) !== safeStr(seeker.nationality)) return false;

        if (wantNat && wantNat !== 'other') {
          return safeStr(cand.nationality) === safeStr(wantNat);
        }
        return true;
      });

      const scored = [];
      for (const cand of pool) {
        const scoreA = computeFitScore(seeker, cand);
        const scoreB = computeFitScore(cand, seeker);
        const score = Math.round((scoreA + scoreB) / 2);
        scored.push({ cand, score, scoreA, scoreB });
      }

      // Eğer threshold'u geçen yoksa (özellikle yeni kullanıcılar için) en yüksek puanlıları göster.
      const eligible = scored.filter((x) => x.score >= threshold && x.scoreA >= threshold && x.scoreB >= threshold);
      const picked = eligible.length ? eligible : scored;
      picked.sort((x, y) => y.score - x.score);
      const plan = seekerStatus.membershipActive ? String(seekerStatus.membershipPlan || '') : '';
      const maxMatches = plan === 'pro' ? 10 : plan === 'standard' ? 5 : 3;
      const top = picked.slice(0, maxMatches);

      for (const row of top) {
        const aUserId = seekerUserId;
        const bUserId = row.cand.userId;
        const userIdsSorted = [aUserId, bUserId].sort();
        const matchId = `${userIdsSorted[0]}__${userIdsSorted[1]}`;

        const ref = db.collection('matchmakingMatches').doc(matchId);
        const existing = await ref.get();
        if (existing.exists) {
          const ex = existing.data() || {};
          if (!canRematchMatchDoc(ex, nowMs)) {
            skippedExisting += 1;
            continue;
          }
        }

        const base = {
          userIds: userIdsSorted,
          aUserId,
          bUserId,
          aApplicationId: seeker.id,
          bApplicationId: row.cand.id,
          // Skorlar: A'nın tercihine göre B ve B'nin tercihine göre A
          scoreAtoB: row.scoreA,
          scoreBtoA: row.scoreB,
          score: row.score,
          status: 'proposed',
          decisions: { a: null, b: null },
          profiles: {
            a: buildPublicProfile(seeker, userStatusById.get(String(aUserId)) || null),
            b: buildPublicProfile(row.cand, userStatusById.get(String(bUserId)) || null),
          },
          createdAt: FieldValue.serverTimestamp(),
          createdAtMs: nowMs,
          firstCreatedAtMs: nowMs,
          reproposedAt: FieldValue.serverTimestamp(),
          reproposedAtMs: nowMs,
          proposedExpiresAtMs: nowMs + PROPOSED_TTL_MS,
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (existing.exists) {
          const ex = existing.data() || {};
          const first = typeof ex?.firstCreatedAtMs === 'number' && Number.isFinite(ex.firstCreatedAtMs)
            ? ex.firstCreatedAtMs
            : (typeof ex?.createdAtMs === 'number' && Number.isFinite(ex.createdAtMs) ? ex.createdAtMs : nowMs);

          await ref.set(
            {
              ...base,
              firstCreatedAtMs: first || nowMs,
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

        // Aynı çalıştırma içinde tekrar üretimi engelle.
        producedPairKeys.add(matchId);
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        created,
        skippedExisting,
        apps: apps.length,
        expiredProposed,
        inactiveCleanup,
        autoConfirmed: 0,
        clearedSlots: 0,
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
