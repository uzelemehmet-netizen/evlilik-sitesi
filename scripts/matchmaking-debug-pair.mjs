import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvLocal() {
  try {
    const envPath = path.join(projectRoot, '.env.local');
    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      const current = process.env[key];
      if (current === undefined || String(current).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return '';
  const v = process.argv[idx + 1];
  if (!v || v.startsWith('--')) return '';
  return String(v).trim();
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
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

  // Age
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

  // Height
  const candHeight = asNum(candDetails?.heightCm);
  const minH = asNum(p?.heightMinCm);
  const maxH = asNum(p?.heightMaxCm);
  if (candHeight !== null && (minH !== null || maxH !== null)) {
    total += weights.height;
    const ok = (minH === null || candHeight >= minH) && (maxH === null || candHeight <= maxH);
    if (ok) earned += weights.height;
  }

  // Marital status
  if (safeStr(p?.maritalStatus)) {
    total += weights.maritalStatus;
    const ok = safeStr(p.maritalStatus) === safeStr(candDetails?.maritalStatus);
    if (ok) earned += weights.maritalStatus;
  }

  // Religion
  if (safeStr(p?.religion)) {
    total += weights.religion;
    const ok = safeStr(p.religion) === safeStr(candDetails?.religion);
    if (ok) earned += weights.religion;
  }

  // Living country
  if (safeStr(p?.livingCountry) && safeStr(p.livingCountry) !== 'doesnt_matter') {
    total += weights.livingCountry;
    const candC = countryCodeFromFreeText(candidate?.country);
    const ok = safeStr(p.livingCountry) === candC;
    if (ok) earned += weights.livingCountry;
  }

  // Communication language
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

  // Translation app requirement
  if (typeof p?.canCommunicateWithTranslationApp === 'boolean') {
    total += weights.translationApp;
    const candCan = !!candDetails?.canCommunicateWithTranslationApp;
    const ok = p.canCommunicateWithTranslationApp ? candCan : true;
    if (ok) earned += weights.translationApp;
  }

  // Smoking
  if (safeStr(p?.smokingPreference)) {
    total += weights.smoking;
    const ok = safeStr(p.smokingPreference) === safeStr(candDetails?.smoking);
    if (ok) earned += weights.smoking;
  }

  // Alcohol
  if (safeStr(p?.alcoholPreference)) {
    total += weights.alcohol;
    const ok = safeStr(p.alcoholPreference) === safeStr(candDetails?.alcohol);
    if (ok) earned += weights.alcohol;
  }

  // Children
  const prefChildren = safeStr(p?.childrenPreference);
  if (prefChildren && prefChildren !== 'doesnt_matter') {
    total += weights.children;
    const has = safeStr(candDetails?.hasChildren);
    const ok =
      (prefChildren === 'want_children' && has === 'yes') ||
      (prefChildren === 'no_children' && has === 'no');
    if (ok) earned += weights.children;
  }

  // Education
  const prefEdu = safeStr(p?.educationPreference);
  if (prefEdu && prefEdu !== 'doesnt_matter') {
    total += weights.education;
    const ok = prefEdu === safeStr(candDetails?.education);
    if (ok) earned += weights.education;
  }

  // Occupation
  const prefOcc = safeStr(p?.occupationPreference);
  if (prefOcc && prefOcc !== 'doesnt_matter') {
    total += weights.occupation;
    const ok = prefOcc === safeStr(candDetails?.occupation);
    if (ok) earned += weights.occupation;
  }

  // Family values
  const prefFam = safeStr(p?.familyValuesPreference);
  if (prefFam && prefFam !== 'doesnt_matter') {
    total += weights.familyValues;
    const ok = prefFam === safeStr(seekerDetails?.religiousValues || '') || prefFam === safeStr(candDetails?.religiousValues || '');
    if (ok) earned += weights.familyValues;
  }

  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((earned / total) * 100)));
}

function summarizeUserDoc(uid, userDoc, appDoc) {
  const now = Date.now();
  const INACTIVE_TTL_MS = 24 * 60 * 60 * 1000;
  const inactiveCutoffMs = now - INACTIVE_TTL_MS;

  const blocked = !!userDoc?.blocked;
  const lockActive = !!userDoc?.matchmakingLock?.active;
  const cooldownUntilMs = typeof userDoc?.newMatchCooldownUntilMs === 'number' && Number.isFinite(userDoc.newMatchCooldownUntilMs)
    ? userDoc.newMatchCooldownUntilMs
    : 0;

  const lastSeenAtMs = lastSeenMsFromUserDoc(userDoc);
  const createdAtMs = typeof appDoc?.createdAtMs === 'number' ? appDoc.createdAtMs : tsToMs(appDoc?.createdAt);
  const inactive = lastSeenAtMs > 0 ? lastSeenAtMs <= inactiveCutoffMs : createdAtMs > 0 && createdAtMs <= inactiveCutoffMs;

  return {
    uid,
    blocked,
    lockActive,
    cooldownActive: cooldownUntilMs > now,
    cooldownUntilMs,
    lastSeenAtMs,
    appCreatedAtMs: createdAtMs,
    inactive,
    gender: safeStr(appDoc?.gender),
    lookingForGender: safeStr(appDoc?.lookingForGender),
    nationality: safeStr(appDoc?.nationality),
    lookingForNationality: safeStr(appDoc?.lookingForNationality),
  };
}

function checkDirectional(seeker, cand, { existingMatch, threshold = 70 } = {}) {
  const reasons = [];

  if (!seeker?.uid || !cand?.uid) reasons.push('missing_uid');

  if (seeker.blocked) reasons.push('seeker_blocked');
  if (seeker.lockActive) reasons.push('seeker_locked');
  if (seeker.cooldownActive) reasons.push('seeker_cooldown');
  if (seeker.inactive) reasons.push('seeker_inactive_24h');

  if (cand.blocked) reasons.push('candidate_blocked');
  if (cand.lockActive) reasons.push('candidate_locked');
  if (cand.inactive) reasons.push('candidate_inactive_24h');

  // Required fields
  if (!seeker.gender || !seeker.lookingForGender) reasons.push('seeker_missing_gender_fields');
  if (!cand.gender || !cand.lookingForGender) reasons.push('candidate_missing_gender_fields');

  // Gender match
  if (seeker.lookingForGender && cand.gender && seeker.lookingForGender !== cand.gender) {
    reasons.push('gender_mismatch');
  }

  // Mutual expectation
  if (cand.lookingForGender && seeker.gender && cand.lookingForGender !== seeker.gender) {
    reasons.push('candidate_lookingForGender_mismatch');
  }

  // Nationality mutual
  if (cand.lookingForNationality && seeker.nationality && cand.lookingForNationality !== seeker.nationality) {
    reasons.push('candidate_lookingForNationality_mismatch');
  }

  // Seeker nationality preference
  if (seeker.lookingForNationality && seeker.lookingForNationality !== 'other') {
    if (!cand.nationality || cand.nationality !== seeker.lookingForNationality) {
      reasons.push('seeker_lookingForNationality_mismatch');
    }
  }

  // Existing match policy
  if (existingMatch) {
    const now = Date.now();
    const canRematch = canRematchMatchDoc(existingMatch, now);
    if (!canRematch) reasons.push('existing_match_blocks_rematch');
  }

  const scoreA = computeFitScore(seeker.app, cand.app);
  const scoreB = computeFitScore(cand.app, seeker.app);
  const score = Math.round((scoreA + scoreB) / 2);

  if (score < threshold || scoreA < threshold || scoreB < threshold) {
    reasons.push('below_threshold');
  }

  return {
    ok: reasons.length === 0,
    reasons,
    scoreAtoB: scoreA,
    scoreBtoA: scoreB,
    score,
  };
}

function printObj(title, obj) {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(obj, null, 2));
}

async function getLatestApplicationByUid(db, uid) {
  // where(userId==..) + orderBy(createdAt) bazı projelerde composite index isteyebiliyor.
  // Debug script'in her yerde çalışabilmesi için orderBy kullanmadan birkaç kayıt çekip
  // client-side en yenisini seçiyoruz.
  const snap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(25).get();
  if (snap.empty) return null;

  const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
  docs.sort((a, b) => {
    const am = typeof a?.createdAtMs === 'number' ? a.createdAtMs : tsToMs(a?.createdAt);
    const bm = typeof b?.createdAtMs === 'number' ? b.createdAtMs : tsToMs(b?.createdAt);
    return bm - am;
  });
  return docs[0] || null;
}

async function main() {
  const emailA = argValue('--a') || argValue('--emailA') || argValue('--email') || '';
  const emailB = argValue('--b') || argValue('--emailB') || '';
  if (!emailA || !emailB) {
    console.error('Usage: node scripts/matchmaking-debug-pair.mjs --a <emailA> --b <emailB>');
    process.exit(2);
  }

  loadEnvLocal();

  const { auth, db } = getAdmin();

  const userA = await auth.getUserByEmail(emailA);
  const userB = await auth.getUserByEmail(emailB);

  const uidA = userA.uid;
  const uidB = userB.uid;

  const [userDocASnap, userDocBSnap] = await Promise.all([
    db.collection('matchmakingUsers').doc(uidA).get(),
    db.collection('matchmakingUsers').doc(uidB).get(),
  ]);

  const userDocA = userDocASnap.exists ? (userDocASnap.data() || {}) : {};
  const userDocB = userDocBSnap.exists ? (userDocBSnap.data() || {}) : {};

  const [appA, appB] = await Promise.all([
    getLatestApplicationByUid(db, uidA),
    getLatestApplicationByUid(db, uidB),
  ]);

  const pairKey = [uidA, uidB].sort();
  const matchId = `${pairKey[0]}__${pairKey[1]}`;
  const matchSnap = await db.collection('matchmakingMatches').doc(matchId).get();
  const existingMatch = matchSnap.exists ? (matchSnap.data() || {}) : null;

  const summaryA = summarizeUserDoc(uidA, userDocA, appA || {});
  const summaryB = summarizeUserDoc(uidB, userDocB, appB || {});

  const seekerA = { ...summaryA, app: appA || {} };
  const seekerB = { ...summaryB, app: appB || {} };

  printObj('Users', {
    a: { email: emailA, uid: uidA },
    b: { email: emailB, uid: uidB },
    matchId,
    existingMatch: existingMatch
      ? {
          status: safeStr(existingMatch?.status),
          cancelledReason: safeStr(existingMatch?.cancelledReason),
          rejectionCount: typeof existingMatch?.rejectionCount === 'number' ? existingMatch.rejectionCount : 0,
          everMutualAcceptedAtMs: typeof existingMatch?.everMutualAcceptedAtMs === 'number' ? existingMatch.everMutualAcceptedAtMs : 0,
          mutualAcceptedAtMs: typeof existingMatch?.mutualAcceptedAtMs === 'number' ? existingMatch.mutualAcceptedAtMs : tsToMs(existingMatch?.mutualAcceptedAt),
          chatEnabledAtMs: typeof existingMatch?.chatEnabledAtMs === 'number' ? existingMatch.chatEnabledAtMs : tsToMs(existingMatch?.chatEnabledAt),
          createdAtMs: typeof existingMatch?.createdAtMs === 'number' ? existingMatch.createdAtMs : tsToMs(existingMatch?.createdAt),
          baseMs: baseMsFromMatch(existingMatch),
        }
      : null,
  });

  printObj('A summary', summaryA);
  printObj('B summary', summaryB);

  // If application missing, we cannot evaluate further.
  if (!appA || !appB) {
    console.log('\nOne or both users are missing matchmakingApplications documents.');
    console.log('This is the most common reason for an empty match list.');
    process.exit(0);
  }

  const threshold = 70;
  const aToB = checkDirectional(seekerA, seekerB, { existingMatch, threshold });
  const bToA = checkDirectional(seekerB, seekerA, { existingMatch, threshold });

  printObj('A -> B evaluation', aToB);
  printObj('B -> A evaluation', bToA);

  if (aToB.ok && bToA.ok) {
    console.log('\nRESULT: This pair SHOULD be eligible for a proposed match (given cron runs).');
    console.log('If there is no match doc, most likely cron was not running/triggered in production.');
  } else {
    console.log('\nRESULT: This pair is BLOCKED by one or more rules listed above.');
  }

  // Show quick hint about the most common pitfall.
  if (safeStr(appA?.gender) && safeStr(appB?.gender) && safeStr(appA?.lookingForGender) && safeStr(appB?.lookingForGender)) {
    const pitfall = safeStr(appA.lookingForGender) === safeStr(appA.gender) || safeStr(appB.lookingForGender) === safeStr(appB.gender);
    if (pitfall) {
      console.log('\nNOTE: At least one user has lookingForGender equal to their own gender; this prevents matching.');
    }
  }
}

main().catch((e) => {
  console.error('[debug-pair] failed:', String(e?.message || e));
  process.exit(1);
});
