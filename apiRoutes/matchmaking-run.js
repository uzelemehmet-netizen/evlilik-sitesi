import { getAdmin, normalizeBody, requireCronSecret } from './_firebaseAdmin.js';

function asNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
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

    const existingPairKeys = new Set();
    existingMatchesSnap.docs.forEach((d) => {
      const m = d.data() || {};
      const userIds = Array.isArray(m.userIds) ? m.userIds.map(String).filter(Boolean) : [];
      if (userIds.length === 2) {
        const key = userIds.slice().sort().join('__');
        existingPairKeys.add(key);
      }
    });

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
        userStatusById.set(d.id, {
          blocked: !!data.blocked,
          lockActive: !!data?.matchmakingLock?.active,
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

      const wantGender = seeker.lookingForGender;
      const wantNat = seeker.lookingForNationality;

      const pool = (byGender[wantGender] || []).filter((cand) => {
        if (!cand?.userId || cand.userId === seekerUserId) return false;

        const candStatus = userStatusById.get(String(cand.userId)) || { blocked: false, lockActive: false };
        if (candStatus.blocked || candStatus.lockActive) return false;

        // Daha önce bu iki kullanıcı eşleştirildiyse (karşılıklı onay alınamamış olsa da), tekrar eşleştirme.
        const pairKey = [String(seekerUserId), String(cand.userId)].sort().join('__');
        if (existingPairKeys.has(pairKey)) return false;

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
          skippedExisting += 1;
          continue;
        }

        await ref.set({
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
          updatedAt: FieldValue.serverTimestamp(),
        });

        created += 1;

        // Aynı çalıştırma içinde tekrar üretimi engelle.
        existingPairKeys.add(matchId);
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, created, skippedExisting, apps: apps.length }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
