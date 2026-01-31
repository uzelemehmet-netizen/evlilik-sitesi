import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { normalizeGender } from './_matchmakingEligibility.js';
import { getMatchmakingResetAtMs } from './_matchmakingReset.js';
import {
  decideAgeGroupExpandCount,
  getAgeGroupMaxExpandFromEnv,
  getMinAgeFromEnv,
  getStrictGroupMinCandidatesFromEnv,
  ageGroupDistanceByAges,
} from './_matchmakingAgePolicy.js';

const MIN_AGE = getMinAgeFromEnv();

function asNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function toNumOrNull(v, { min = -Infinity, max = Infinity } = {}) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v < min || v > max) return null;
    return v;
  }
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

function clampInt(v, { min = -Infinity, max = Infinity } = {}) {
  const n = typeof v === 'number' ? v : Number(String(v || '').trim());
  if (!Number.isFinite(n)) return null;
  const x = Math.round(n);
  if (x < min || x > max) return null;
  return x;
}

function ageFromBirthYearMaybe(v) {
  const year = toNumOrNull(v, { min: 1900, max: 2100 });
  if (year === null) return null;
  const nowYear = new Date().getFullYear();
  const age = nowYear - year;
  return age >= MIN_AGE && age <= 99 ? age : null;
}

function ageFromDateMaybe(v) {
  if (!v) return null;
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

function ageGroupDistance(aAge, bAge) {
  return ageGroupDistanceByAges(aAge, bAge);
}

function isSeedApplication(app) {
  const userId = safeStr(app?.userId);
  if (!userId) return false;
  if (userId === 'test1' || userId === 'test2') return true;
  if (userId.startsWith('seed_')) return true;

  const source = safeStr(app?.source).toLowerCase();
  if (source === 'seed') return true;

  const seedTag = safeStr(app?.seedTag).toLowerCase();
  if (seedTag === 'mk_seed') return true;

  const seedBatchId = safeStr(app?.seedBatchId);
  if (seedBatchId) return true;

  return false;
}

function dedupeAppsByUserIdKeepFirst(apps) {
  const list = Array.isArray(apps) ? apps : [];
  const seen = new Set();
  const out = [];
  for (const a of list) {
    const uid = safeStr(a?.userId);
    if (!uid) continue;
    if (seen.has(uid)) continue;
    seen.add(uid);
    out.push(a);
  }
  return out;
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function readBoolEnv(name, fallback = false) {
  const raw = String(process.env[name] || '').toLowerCase().trim();
  if (!raw) return fallback;
  if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on') return true;
  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') return false;
  return fallback;
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

function matchCreatedAtMs(match) {
  const ms = typeof match?.createdAtMs === 'number' && Number.isFinite(match.createdAtMs) ? match.createdAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(match?.createdAt);
  return ts > 0 ? ts : 0;
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

function normalizeNatCode(v) {
  const raw = safeStr(v);
  if (!raw) return '';
  const low = raw.toLowerCase();
  if (low === 'tr' || low === 'id' || low === 'other') return low;
  return countryCodeFromFreeText(raw);
}

function setHas(list, v) {
  return Array.isArray(list) && v ? list.includes(v) : false;
}

function ageCompatibleOneWay(seeker, candidate) {
  const seekerAge = getAge(seeker);
  const candAge = getAge(candidate);
  if (seekerAge === null || candAge === null) return false;

  const p = seeker?.partnerPreferences || {};

  const min = toNumOrNull(p?.ageMin, { min: MIN_AGE, max: 99 });
  const max = toNumOrNull(p?.ageMax, { min: MIN_AGE, max: 99 });
  if (min !== null || max !== null) {
    return (min === null || candAge >= min) && (max === null || candAge <= max);
  }

  const older = toNumOrNull(p?.ageMaxOlderYears, { min: 0, max: 99 });
  const younger = toNumOrNull(p?.ageMaxYoungerYears, { min: 0, max: 99 });
  if (older !== null || younger !== null) {
    const o = older ?? 0;
    const y = younger ?? 0;
    return candAge >= Math.max(MIN_AGE, seekerAge - y) && candAge <= Math.min(99, seekerAge + o);
  }

  // Tercih yoksa: yaş aralığı kuralı kısıt üretmesin.
  return true;
}

function ageCompatibleBoth(a, b) {
  return ageCompatibleOneWay(a, b) && ageCompatibleOneWay(b, a);
}

function relaxedAgeWindowYears() {
  const n = Number(process.env.MATCHMAKING_RELAXED_AGE_WINDOW_YEARS || 7);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 7;
}

function ageCompatibleBothRelaxed(a, b, windowYears) {
  const aa = getAge(a);
  const ab = getAge(b);
  if (aa === null || ab === null) return true;
  const w = Number.isFinite(windowYears) && windowYears > 0 ? windowYears : 7;
  return Math.abs(aa - ab) <= w;
}

function ageCompatibleBothWithMode(a, b, { relaxAge } = {}) {
  if (relaxAge) return ageCompatibleBothRelaxed(a, b, relaxedAgeWindowYears());
  return ageCompatibleBoth(a, b);
}

function minPoolForStrictFilters() {
  const n = Number(process.env.MATCHMAKING_MIN_POOL_FOR_STRICT_FILTERS || 50);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 50;
}

function maritalCompatibleOneWay(seeker, candidate) {
  const p = seeker?.partnerPreferences || {};
  const pref = safeStr(p?.maritalStatus);
  if (!pref || pref === 'doesnt_matter') return true;

  const candDetails = candidate?.details || {};
  const candMarital = safeStr(candDetails?.maritalStatus);
  if (!candMarital) return false;
  return pref === candMarital;
}

function maritalCompatibleBoth(a, b) {
  return maritalCompatibleOneWay(a, b) && maritalCompatibleOneWay(b, a);
}

function maritalPrimaryBoth(a, b) {
  return maritalCompatibleBoth(a, b);
}

function incomeRank(level) {
  const s = safeStr(level).toLowerCase();
  if (!s || s === 'prefer_not_to_say') return null;
  if (s === 'low') return 1;
  if (s === 'medium') return 2;
  if (s === 'good') return 3;
  if (s === 'very_good') return 4;
  return null;
}

function incomeSimilarityScore(a, b) {
  const ra = incomeRank(a);
  const rb = incomeRank(b);
  if (ra === null || rb === null) return null;
  const d = Math.abs(ra - rb);
  if (d === 0) return 100;
  if (d === 1) return 70;
  if (d === 2) return 40;
  return 10;
}

function heightClosenessOneWay(seeker, candidate) {
  const p = seeker?.partnerPreferences || {};
  const candDetails = candidate?.details || {};
  const candHeight = asNum(candDetails?.heightCm);
  if (candHeight === null) return null;

  const minH = asNum(p?.heightMinCm);
  const maxH = asNum(p?.heightMaxCm);
  if (minH === null && maxH === null) return null;

  const center = minH !== null && maxH !== null ? (minH + maxH) / 2 : (minH ?? maxH);
  const dist = Math.abs(candHeight - center);
  return Math.max(0, Math.min(100, Math.round(100 - dist * 5)));
}

function ageGapScore(a, b) {
  const aa = getAge(a);
  const ab = getAge(b);
  if (aa === null || ab === null) return null;
  const d = Math.abs(aa - ab);
  return Math.max(0, Math.min(100, Math.round(100 - d * 10)));
}

function computeTieBreakOneWay(seeker, candidate) {
  // Ürün kararı: puanlama yok; sıralama için tie-break de yok.
  return 0;
}

function weightedScore(parts) {
  let wSum = 0;
  let vSum = 0;
  for (const p of Array.isArray(parts) ? parts : []) {
    const v = typeof p?.value === 'number' ? p.value : null;
    const w = typeof p?.weight === 'number' ? p.weight : 0;
    if (v === null || !Number.isFinite(v)) continue;
    if (!Number.isFinite(w) || w <= 0) continue;
    const vv = Math.max(0, Math.min(100, v));
    wSum += w;
    vSum += vv * w;
  }
  if (wSum <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round(vSum / wSum)));
}

function computeFitScore(seeker, candidate) {
  // Basit ama gerçek bir skor: kullanıcıya "rasgele" hissini azaltır.
  // Not: Eksik alanlarda (null) ağırlığı otomatik düşürür.
  const age = ageGapScore(seeker, candidate);
  const heightA = heightClosenessOneWay(seeker, candidate);
  const heightB = heightClosenessOneWay(candidate, seeker);
  const height = heightA === null && heightB === null ? null : Math.round(((heightA ?? 50) + (heightB ?? 50)) / 2);

  const aIncome = safeStr(seeker?.details?.incomeLevel);
  const bIncome = safeStr(candidate?.details?.incomeLevel);
  const income = incomeSimilarityScore(aIncome, bIncome);

  // Marital uyumsuzluk en sert sinyal: compatible değilse düşür.
  const maritalOk = maritalCompatibleBoth(seeker, candidate);
  const marital = maritalOk ? 100 : 0;

  return weightedScore([
    { value: age, weight: 0.45 },
    { value: height, weight: 0.20 },
    { value: income, weight: 0.10 },
    { value: marital, weight: 0.25 },
  ]);
}

function isMembershipActiveUserDoc(userDoc, now = Date.now()) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > now;
}

function membershipMaxMatchesFromUserDoc(userDoc, now = Date.now()) {
  // Geçici ürün kararı (fiyatlandırma öncesi): herkes için 5 aktif eşleşmeye kadar izin ver.
  // Not: Bu limit UI'daki "aktif eşleşme" algısıyla aynı olmalı.
  const active = isMembershipActiveUserDoc(userDoc, now);
  if (!active) return 5;
  const plan = String(userDoc?.membership?.plan || '').toLowerCase().trim();
  if (plan === 'eco') return 5;
  if (plan === 'standard') return 5;
  if (plan === 'pro') return 10;
  return 5;
}

function countsAsActiveSlotForUser(match, uid) {
  if (!match || !uid) return false;
  const userIds = Array.isArray(match?.userIds) ? match.userIds.map(String).filter(Boolean) : [];
  if (!userIds.includes(uid)) return false;

  const status = safeStr(match?.status);
  // "dismissed" ve "cancelled" gibi durumlar slot saymaz.
  // proposed/mutual_accepted/contact_unlocked akışları slot sayar.
  // Not: UI active listesinde mutual_interest de aktif kabul ediliyor.
  return status === 'proposed' || status === 'mutual_interest' || status === 'mutual_accepted' || status === 'contact_unlocked';
}

function incrementMap(map, key, delta) {
  if (!map || !key) return;
  const prev = typeof map.get(key) === 'number' ? map.get(key) : 0;
  map.set(key, prev + (typeof delta === 'number' ? delta : 0));
}

function buildPublicProfile(app, userStatus) {
  const details = app?.details || {};
  const about = typeof app?.about === 'string' ? app.about.trim() : '';
  const expectations = typeof app?.expectations === 'string' ? app.expectations.trim() : '';
  const clip = (s, maxLen) => {
    const v = typeof s === 'string' ? s.trim() : '';
    if (!v) return '';
    return v.length > maxLen ? v.slice(0, maxLen) : v;
  };
  return {
    identityVerified: !!userStatus?.identityVerified,
    proMember: !!userStatus?.membershipActive && String(userStatus?.membershipPlan || '') === 'pro',
    membershipActive: !!userStatus?.membershipActive,
    membershipPlan: safeStr(userStatus?.membershipPlan),
    profileNo: asNum(app?.profileNo),
    profileCode: safeStr(app?.profileCode),
    username: safeStr(app?.username),
    age: getAge(app),
    gender: safeStr(app?.gender),
    lookingForGender: safeStr(app?.lookingForGender),
    city: safeStr(app?.city),
    country: safeStr(app?.country),
    photoUrls: Array.isArray(app?.photoUrls) ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [],
    // Kart önizlemesi için kısa metinler (doküman şişmesini önlemek için clip).
    about: clip(about, 360),
    expectations: clip(expectations, 360),
    details: {
      maritalStatus: safeStr(details?.maritalStatus),
      occupation: safeStr(details?.occupation),
      hasChildren: safeStr(details?.hasChildren),
      childrenCount: asNum(details?.childrenCount),
      childrenLivingSituation: safeStr(details?.childrenLivingSituation),
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
  // Deprecated: kota kaldırıldı. Geriye dönük response uyumu için tutuluyor.
  return 0;
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
  // Ürün kuralı (basit): reject edilen eşleşmeler bir daha üretilmez.
  // Admin rollback gibi sistem iptallerinde yeniden üretime izin verilebilir.
  if (!match) return false;
  if (hasEverActiveMatch(match)) return false;

  const status = safeStr(match?.status);
  if (status !== 'cancelled') return false;

  const reason = safeStr(match?.cancelledReason);
  if (reason === 'admin_rollback') return true;
  if (reason === 'rejected' || reason === 'rejected_all') return false;
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
    const requestedMaxMatches = clampInt(body?.maxMatches, { min: 1, max: 5 });

    const { db, FieldValue } = getAdmin();

    // Global kill-switch: disable automatic match creation.
    // Manual pool (pre-match requests) should still work.
    try {
      const settingsSnap = await db.collection('siteSettings').doc('matchmaking').get();
      const settings = settingsSnap.exists ? (settingsSnap.data() || {}) : {};
      if (settings?.matchmakingAutoMatchEnabled === false) {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true, created: 0, noMatchReason: 'auto_match_disabled' }));
        return;
      }
    } catch {
      // best-effort
    }
    const ref = db.collection('matchmakingUsers').doc(uid);

    // Preflight: Kullanıcı havuzda değilse hak tüketmeyelim.
    // (Bu endpoint hak harcıyor; başvuru yoksa "yenile" boşa gidiyor.)
    // Not: where(userId==) + orderBy(createdAt) composite index isteyebilir.
    // Local/prod'da 500'lere yol açmamak için index gerektirmeyen şekilde çekip
    // en yeni kaydı JS tarafında seçiyoruz.
    const seekerSnapPre = await db
      .collection('matchmakingApplications')
      .where('userId', '==', uid)
      .limit(10)
      .get();
    const seekerDocsPre = Array.isArray(seekerSnapPre?.docs) ? seekerSnapPre.docs : [];
    const seekerPre = seekerDocsPre
      .map((d) => ({ id: d.id, ...(d.data() || {}) }))
      .sort((a, b) => appCreatedAtMs(b) - appCreatedAtMs(a))[0] || null;
    // Minimal model: sadece cinsiyet + yaş aralığı uyumu.
    // lookingForGender zorunlu değil (eski başvurularla uyum için).
    if (!seekerPre || !seekerPre?.userId || !seekerPre?.gender) {
      const err = new Error('application_required');
      err.statusCode = 400;
      throw err;
    }

    // Transaction içinde query yapmamak için gender fallback’ını burada çöz.
    // Preflight ile seeker gender zaten var; yine de ekstra güvenlik için fallback bırakıyoruz.
    const genderFallback = normalizeGender(seekerPre?.gender) || normalizeGender(await resolveGenderFromAnyApplication(db, uid));

    const ts = nowMs();
    const today = dayKeyUtc(ts);

    // Kota kaldırıldı: response uyumu için alanları sıfır döndürüyoruz.
    let result = { remaining: 0, limit: 0, dayKey: today, count: 0, charged: false, chargeMode: 'none', action };

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? (snap.data() || {}) : {};

      const totalPrev = typeof data?.newMatchRequestTotalCount === 'number' ? data.newMatchRequestTotalCount : 0;

      if (action === 'free_slot') {
        if (!slotMatchId) {
          const err = new Error('bad_request');
          err.statusCode = 400;
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

        result = {
          remaining: 0,
          limit: 0,
          dayKey: today,
          count: 0,
          freeSlotRemaining: 0,
          action: 'free_slot',
          creditGranted: 0,
          cooldownUntilMs: 0,
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
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        if (otherRef && Object.keys(otherPatch).length) {
          tx.set(otherRef, { ...otherPatch, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        return;
      }

      tx.set(
        ref,
        {
          requestedNewMatchAt: FieldValue.serverTimestamp(),
          requestedNewMatchAtMs: ts,
          newMatchRequestTotalCount: totalPrev + 1,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    // Not: Daha önce bu endpoint yalnızca "istek" kaydı tutuyordu.
    // Cron/job kurulumu yoksa kullanıcılar hiç eşleşme göremiyor.
    // Bu yüzden burada, requester için anlık eşleşme üretip matchmakingMatches koleksiyonuna yazıyoruz.
    let created = 0;
    let matchTierOut = '';
    let debugOut = null;
    let noMatchReason = '';
    try {
      if (action !== 'request_new') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true, ...result, created }));
        return;
      }

      const now = Date.now();
      const PROPOSED_TTL_MS = 48 * 60 * 60 * 1000;
      // Küçük havuzlarda 24 saat çok agresif ve adayları sıfırlayabiliyor.
      // Varsayılanı 7 gün yaptık; istenirse env ile düşürülebilir.
      const ttlHours = Number(process.env.MATCHMAKING_INACTIVE_TTL_HOURS || 24 * 7);
      const INACTIVE_TTL_MS = (Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours : 24 * 7) * 60 * 60 * 1000;
      const inactiveCutoffMs = now - INACTIVE_TTL_MS;

      const seeker = seekerPre;
      // lookingForGender eski başvurularda boş olabiliyor; zorunlu olmamalı.
      if (seeker && seeker?.userId && seeker?.gender) {
        const userSnap = await db.collection('matchmakingUsers').doc(uid).get();
        const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};

        const resetAtMs = await getMatchmakingResetAtMs(db);

        // newUserSlot / slot limiti kaldırıldı.

        const membershipActive = isMembershipActiveUserDoc(userDoc, now);
        const plan = membershipActive ? String(userDoc?.membership?.plan || '').toLowerCase().trim() : '';
        const requesterIdentityVerified =
          !!userDoc?.identityVerified ||
          ['verified', 'approved'].includes(String(userDoc?.identityVerification?.status || '').toLowerCase().trim());

        // Bu endpoint bir "yenileme" aksiyonu: her çağrıda sınırlı sayıda yeni eşleşme üret.
        // UI varsayılanı 1; debug/test için body.maxMatches ile artırılabilir (cap'li).
        const maxMatches = requestedMaxMatches ?? 1;

        // Slot limiti: UI ile uyumlu şekilde max aktif match sayısını uygula.
        const myMaxActiveMatches = membershipMaxMatchesFromUserDoc(userDoc, now);

        // Mevcut eşleşmeler (bu kullanıcı için) - tekrar üretmeyi engelle.
        const existingSnap = await db
          .collection('matchmakingMatches')
          .where('userIds', 'array-contains', uid)
          .limit(5000)
          .get();
        const existingOtherIds = new Set();
        let myActiveCount = 0;
        const myActiveProposed = [];
        const expiredProposed = [];

        existingSnap.docs.forEach((d) => {
          const m = d.data() || {};

          // Soft reset: reset öncesi match'leri yok say.
          const createdMs = matchCreatedAtMs(m);
          if (resetAtMs > 0 && createdMs > 0 && createdMs < resetAtMs) return;

          const ids = Array.isArray(m.userIds) ? m.userIds.map(String).filter(Boolean) : [];
          if (ids.length === 2) {
            const other = ids[0] === uid ? ids[1] : ids[0];
            if (!other) return;

            // Aktif match varsa tekrar üretmeyelim.
            const st = safeStr(m?.status);
            const reason = safeStr(m?.cancelledReason);
            const active = st === 'proposed' || st === 'mutual_interest' || st === 'mutual_accepted' || st === 'contact_unlocked';
            if (active) {
              existingOtherIds.add(other);
              myActiveCount += 1;

              // proposed ise, refresh sırasında gerekirse slot açmak için aday listesine al.
              if (st === 'proposed') {
                const createdAtMs = typeof m?.createdAtMs === 'number' && Number.isFinite(m.createdAtMs) ? m.createdAtMs : 0;
                myActiveProposed.push({ id: d.id, createdAtMs });

                const exp = typeof m?.proposedExpiresAtMs === 'number' && Number.isFinite(m.proposedExpiresAtMs) ? m.proposedExpiresAtMs : 0;
                if (exp > 0 && exp <= now) {
                  expiredProposed.push({ id: d.id, createdAtMs, proposedExpiresAtMs: exp });
                }
              }
              return;
            }

            // Reject: tekrar gösterme.
            const rejected = st === 'cancelled' && (reason === 'rejected' || reason === 'rejected_all');
            if (rejected) existingOtherIds.add(other);
          }
        });

        // 1) Expired proposed temizliği: cron yoksa birikme yapıyor.
        //    (UI cancelled'ı gizlediği için kullanıcı tarafında liste düzelir.)
        if (expiredProposed.length) {
          const batch = db.batch();
          const cap = 250;
          let n = 0;
          for (const item of expiredProposed.sort((a, b) => (a.proposedExpiresAtMs || 0) - (b.proposedExpiresAtMs || 0))) {
            if (n >= cap) break;
            const matchRef = db.collection('matchmakingMatches').doc(String(item.id));
            batch.set(
              matchRef,
              {
                status: 'cancelled',
                cancelledAt: FieldValue.serverTimestamp(),
                cancelledAtMs: now,
                cancelledReason: 'proposed_expired',
                cancelledByUserId: uid,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
            n += 1;
          }
          if (n > 0) {
            try {
              await batch.commit();
              myActiveCount = Math.max(0, myActiveCount - Math.min(n, expiredProposed.length));
            } catch {
              // best-effort
            }
          }
        }

        // 2) Slot doluysa, refresh sırasında en eski proposed'ları iptal ederek yer aç.
        //    mutual_interest/mutual_accepted gibi ilerlemiş durumları otomatik iptal etmiyoruz.
        const wantCreateMax = maxMatches;
        const slotsNeeded = Math.max(0, (myActiveCount + wantCreateMax) - myMaxActiveMatches);
        if (slotsNeeded > 0 && myActiveProposed.length) {
          const toCancel = myActiveProposed
            .filter((x) => !expiredProposed.some((e) => e.id === x.id))
            .sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0))
            .slice(0, slotsNeeded);

          if (toCancel.length) {
            const batch = db.batch();
            let n = 0;
            for (const item of toCancel) {
              const matchRef = db.collection('matchmakingMatches').doc(String(item.id));
              batch.set(
                matchRef,
                {
                  status: 'cancelled',
                  cancelledAt: FieldValue.serverTimestamp(),
                  cancelledAtMs: now,
                  cancelledReason: 'refresh_replaced',
                  cancelledByUserId: uid,
                  updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
              );
              n += 1;
            }
            try {
              await batch.commit();
              myActiveCount = Math.max(0, myActiveCount - n);
            } catch {
              // best-effort
            }
          }
        }

        const mySlotsAvailable = Math.max(0, myMaxActiveMatches - myActiveCount);
        const maxMatchesEffective = Math.min(maxMatches, mySlotsAvailable);
        if (maxMatchesEffective <= 0) {
          noMatchReason = noMatchReason || 'slot_full';
          // Debug alanlarını yine döndürmek için akışa devam etmiyoruz.
          matchTierOut = 'slot_full';
          debugOut = { slot: { myActiveCount, myMaxActiveMatches } };
          created = 0;
          // response aşağıda.
        }

        // Aday havuzu: son N başvuru.
        const appsSnap = await db
          .collection('matchmakingApplications')
          .orderBy('createdAt', 'desc')
          .limit(600)
          .get();
        const apps = appsSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() || {}) }))
          .filter(
            (a) =>
              a?.userId &&
              (a?.gender === 'male' || a?.gender === 'female') &&
              !isSeedApplication(a)
          );

        // appsSnap createdAt desc geliyor; aynı userId için ilk kayıt en yenidir.
        const appsUnique = dedupeAppsByUserIdKeepFirst(apps);

        const minPool = minPoolForStrictFilters();
        const relaxFilters = false;
        const disableInactiveEnv = String(process.env.MATCHMAKING_DISABLE_INACTIVE_RULES || '').trim() === '1';
        const applyInactivityRules = false;

        // Aday userId listesi (erkek/kadın havuzuna göre).
        const seekerGender = safeStr(seeker.gender);
        const wantGender = seekerGender === 'male' ? 'female' : seekerGender === 'female' ? 'male' : '';
        // Ürün kararı: milliyet/ülke filtresi yok.
        const seekerNatCode = '';
        const wantNat = '';
        const wantNatCode = '';

        // Sistemsel hata dahil: aynı cinsiyet eşleşmesi üretme.
        if (wantGender !== 'male' && wantGender !== 'female') {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: true, ...result, created: 0 }));
          return;
        }
        if (seekerGender && seekerGender === safeStr(wantGender)) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: true, ...result, created: 0 }));
          return;
        }

        const poolStrictBase = appsUnique.filter((a) => {
          if (!a?.userId || a.userId === uid) return false;
          if (existingOtherIds.has(String(a.userId))) return false;
          if (safeStr(a.gender) !== wantGender) return false;
          if (safeStr(a.gender) === safeStr(seeker.gender)) return false;
          // Milliyet/ülke filtresi yok.
          return true;
        });

        // Yaş filtresi: havuz boş kalırsa otomatik gevşet.
        const seekerAge = getAge(seeker);
        if (seekerAge === null) {
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: true, ...result, created: 0, noMatchReason: 'no_age' }));
          return;
        }

        const poolStrictRaw = poolStrictBase.filter((a) => {
          const ca = getAge(a);
          if (ca === null) return false;
          return ageCompatibleBothWithMode(seeker, a, { relaxAge: relaxFilters });
        });

        // Fallback tier'lar: yalnızca milliyet kontrollerini gevşet.
        const poolRelaxBase = appsUnique.filter((a) => {
          if (!a?.userId || a.userId === uid) return false;
          if (existingOtherIds.has(String(a.userId))) return false;
          if (safeStr(a.gender) !== wantGender) return false;
          if (safeStr(a.gender) === safeStr(seeker.gender)) return false;
          // nationality filters relaxed
          return true;
        });

        const poolRelaxRaw = poolRelaxBase.filter((a) => {
          const ca = getAge(a);
          if (ca === null) return false;
          return ageCompatibleBothWithMode(seeker, a, { relaxAge: relaxFilters });
        });

        const strictSameGroupCandidateCount = poolStrictRaw.filter((cand) => {
          const ca = getAge(cand);
          if (ca === null) return false;
          return ageGroupDistance(seekerAge, ca) === 0;
        }).length;

        const strictMinCandidates = getStrictGroupMinCandidatesFromEnv();
        const maxExpand = getAgeGroupMaxExpandFromEnv();
        const expandGroups = decideAgeGroupExpandCount({
          strictSameGroupCandidateCount,
          strictMinCandidates,
          maxExpand,
        });

        const withinAgeGroupPolicy = (cand) => {
          const ca = getAge(cand);
          if (ca === null) return false;
          const dist = ageGroupDistance(seekerAge, ca);
          if (!Number.isFinite(dist)) return false;
          return expandGroups > 0 ? dist <= expandGroups : dist === 0;
        };

        const poolStrictScoped = poolStrictRaw.filter(withinAgeGroupPolicy);
        const poolRelaxScoped = poolRelaxRaw.filter(withinAgeGroupPolicy);

        // Slot doluluğu: kullanıcı bazında aktif match sayısı (UI ile uyumlu).
        const activeMatchCountByUserId = new Map();
        try {
          const recentMatchesSnap = await db.collection('matchmakingMatches').orderBy('createdAt', 'desc').limit(5000).get();
          recentMatchesSnap.docs.forEach((d) => {
            const m = d.data() || {};
            const ids = Array.isArray(m.userIds) ? m.userIds.map(String).filter(Boolean) : [];
            if (ids.length !== 2) return;
            for (const x of ids) {
              if (countsAsActiveSlotForUser(m, x)) incrementMap(activeMatchCountByUserId, x, 1);
            }
          });
        } catch {
          // best-effort
        }

        const uniqueUserIds = Array.from(new Set([...poolStrictRaw, ...poolRelaxRaw].map((a) => String(a.userId)).filter(Boolean)));
        const chunks = [];
        for (let i = 0; i < uniqueUserIds.length; i += 10) chunks.push(uniqueUserIds.slice(i, i + 10));

        const userStatusById = new Map();
        for (const chunk of chunks) {
          const snap = await db.collection('matchmakingUsers').where('__name__', 'in', chunk).get();
          snap.docs.forEach((d) => {
            const data = d.data() || {};
            const activeCount = typeof activeMatchCountByUserId.get(d.id) === 'number' ? activeMatchCountByUserId.get(d.id) : 0;
            const maxActiveMatches = membershipMaxMatchesFromUserDoc(data, now);

            const requestedAtMs =
              (typeof data?.requestedNewMatchAtMs === 'number' && Number.isFinite(data.requestedNewMatchAtMs) ? data.requestedNewMatchAtMs : 0) ||
              tsToMs(data?.requestedNewMatchAt);

            const lock = data?.matchmakingLock && typeof data.matchmakingLock === 'object' ? data.matchmakingLock : null;
            const lockActive = !!lock?.active;

            userStatusById.set(d.id, {
              blocked: !!data.blocked,
              lastSeenAtMs: lastSeenMsFromUserDoc(data),
              identityVerified: !!data?.identityVerified || ['verified', 'approved'].includes(String(data?.identityVerification?.status || '').toLowerCase().trim()),
              membershipActive: isMembershipActiveUserDoc(data, now),
              membershipPlan: typeof data?.membership?.plan === 'string' ? String(data.membership.plan).toLowerCase().trim() : '',
              activeMatchCount: activeCount,
              maxActiveMatches,
              hasFreeSlot: activeCount < maxActiveMatches,
              requestedNewMatchAtMs: requestedAtMs,
              lockActive,
            });
          });
        }

        // Opt-in penceresi: ancak yakın zamanda "eşleşme bul" diyen kullanıcılar aday olsun.
        // Böylece karşılıklı olmadan "rastgele" eşleşme düşmesi engellenir.
        const optInHours = Number(process.env.MATCHMAKING_OPTIN_TTL_HOURS || 24 * 7);
        const OPTIN_TTL_MS = (Number.isFinite(optInHours) && optInHours > 0 ? optInHours : 24 * 7) * 60 * 60 * 1000;
        const optInCutoffMs = now - OPTIN_TTL_MS;

        const poolStrict = poolStrictScoped.filter((cand) => {
          const st = userStatusById.get(String(cand.userId)) || { blocked: false };
          if (st.blocked) return false;

          // Karşı taraf opt-in değilse eşleşme üretme.
          const reqMs = typeof st?.requestedNewMatchAtMs === 'number' ? st.requestedNewMatchAtMs : 0;
          if (!(reqMs > 0 && reqMs >= optInCutoffMs)) return false;

          // Karşı tarafın slotu doluysa, daha fazla proposed üretme.
          if (st.hasFreeSlot === false) return false;

          // Aktif lock'u olan kullanıcıya yeni match düşürme (1 aktif eşleşme kuralı ile uyumlu).
          if (st.lockActive) return false;

          const seen = typeof st?.lastSeenAtMs === 'number' ? st.lastSeenAtMs : 0;
          const createdMs = appCreatedAtMs(cand);
          const inactive = seen > 0 ? seen <= inactiveCutoffMs : createdMs > 0 && createdMs <= inactiveCutoffMs;
          if (applyInactivityRules && inactive) return false;

          return true;
        });

        const poolRelax = poolRelaxScoped.filter((cand) => {
          const st = userStatusById.get(String(cand.userId)) || { blocked: false };
          if (st.blocked) return false;

          const reqMs = typeof st?.requestedNewMatchAtMs === 'number' ? st.requestedNewMatchAtMs : 0;
          if (!(reqMs > 0 && reqMs >= optInCutoffMs)) return false;
          if (st.hasFreeSlot === false) return false;
          if (st.lockActive) return false;

          const seen = typeof st?.lastSeenAtMs === 'number' ? st.lastSeenAtMs : 0;
          const createdMs = appCreatedAtMs(cand);
          const inactive = seen > 0 ? seen <= inactiveCutoffMs : createdMs > 0 && createdMs <= inactiveCutoffMs;
          if (applyInactivityRules && inactive) return false;

          return true;
        });

        const allowInactiveFallback = poolStrict.length === 0 && poolRelax.length === 0;

        // Son çare: pasiflik filtresi yüzünden hiçbir aday kalmıyorsa,
        // kullanıcı "en yakın" adayı hiç göremiyor. Bu durumda pasiflik filtresini kaldır.
        const poolStrictEff = allowInactiveFallback
          ? poolStrictRaw.filter((cand) => {
              const st = userStatusById.get(String(cand.userId)) || { blocked: false };
              if (st.blocked) return false;
              return true;
            })
          : poolStrict;

        const poolRelaxEff = allowInactiveFallback
          ? poolRelaxRaw.filter((cand) => {
              const st = userStatusById.get(String(cand.userId)) || { blocked: false };
              if (st.blocked) return false;
              return true;
            })
          : poolRelax;

        // 70+ tier strict (milliyet dahil) havuzundan gelsin.
        const scoredStrict = poolStrictEff.map((cand) => {
          const scoreA = computeFitScore(seeker, cand);
          const scoreB = computeFitScore(cand, seeker);
          const score = Math.round((scoreA + scoreB) / 2);
          const tieA = computeTieBreakOneWay(seeker, cand);
          const tieB = computeTieBreakOneWay(cand, seeker);
          const tie = Math.round((tieA + tieB) / 2);
          return { cand, score, scoreA, scoreB, tie };
        });

        // Fallback tier'lar: milliyet gevşek havuzdan gelsin.
        const scored = poolRelaxEff.map((cand) => {
          const scoreA = computeFitScore(seeker, cand);
          const scoreB = computeFitScore(cand, seeker);
          const score = Math.round((scoreA + scoreB) / 2);
          const tieA = computeTieBreakOneWay(seeker, cand);
          const tieB = computeTieBreakOneWay(cand, seeker);
          const tie = Math.round((tieA + tieB) / 2);
          return { cand, score, scoreA, scoreB, tie };
        });

        const threshold = 0;
        // Eşik: iki tarafın tek tek değil, ortalama skoruna göre.
        const eligible = scoredStrict.filter((x) => x.score >= threshold);

        let picked = [];
        let matchTier = 'age_gender_pool';
        if (eligible.length) {
          picked = eligible;
          matchTier = 'score_threshold';
        } else {
          // Yaş+cinsiyet havuzu zaten uygulanmış durumda; burada sadece puana göre seç.
          picked = scored.length ? scored : scoredStrict;
        }

        if (picked.length === 0) {
          noMatchReason = 'no_candidates';
        }

        // Puan yok: en yeni başvurular önce gelsin.
        picked.sort((x, y) => appCreatedAtMs(y.cand) - appCreatedAtMs(x.cand));

        matchTierOut = matchTier;
        const poolUsed = eligible.length ? 'strict' : 'relax';
        const topPreview = picked.length ? picked[0] : null;
        debugOut = {
          agePolicy: {
            minAge: MIN_AGE,
            seekerAge,
            strictSameGroupCandidateCount,
            strictMinCandidates,
            maxExpand,
            expandGroups,
          },
          matchTier,
          threshold,
          poolUsed,
          allowInactiveFallback,
          relaxFilters,
          applyInactivityRules,
          minPoolForStrictFilters: minPool,
          pools: {
            strictRawCount: poolStrictRaw.length,
            relaxRawCount: poolRelaxRaw.length,
            strictCount: poolStrict.length,
            relaxCount: poolRelax.length,
            strictEffectiveCount: poolStrictEff.length,
            relaxEffectiveCount: poolRelaxEff.length,
          },
          scored: {
            strictCount: scoredStrict.length,
            relaxCount: scored.length,
            eligibleCount: eligible.length,
            pickedCount: picked.length,
          },
          top: topPreview
            ? {
                score: typeof topPreview.score === 'number' ? topPreview.score : null,
                scoreA: typeof topPreview.scoreA === 'number' ? topPreview.scoreA : null,
                scoreB: typeof topPreview.scoreB === 'number' ? topPreview.scoreB : null,
                tie: typeof topPreview.tie === 'number' ? topPreview.tie : null,
              }
            : null,
        };

        if (maxMatchesEffective <= 0) {
          // slot_full ise match üretme.
          picked = [];
        }

        const top = picked.slice(0, maxMatchesEffective);
        for (const row of top) {
          const otherUid = String(row.cand.userId);
          if (!otherUid) continue;
          if (existingOtherIds.has(otherUid)) continue;

          // Son savunma: status map yoksa bile slot/opt-in kontrolü yap.
          const otherSt = userStatusById.get(otherUid) || null;
          if (otherSt) {
            // Ürün kararı: tek taraflı tarama ile de eşleşme üretilebilsin.
            // İstenirse env ile eski "iki taraf da opt-in" kuralına dönülebilir.
            const requireOtherOptIn = readBoolEnv('MATCHMAKING_REQUIRE_OTHER_OPTIN', false);
            if (requireOtherOptIn) {
              const reqMs = typeof otherSt?.requestedNewMatchAtMs === 'number' ? otherSt.requestedNewMatchAtMs : 0;
              if (!(reqMs > 0 && reqMs >= optInCutoffMs)) continue;
            }
            if (otherSt.hasFreeSlot === false) continue;
            if (otherSt.lockActive) continue;
          }

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
            tie: typeof row.tie === 'number' ? row.tie : null,
            matchTier,
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

        if (created === 0 && !noMatchReason) noMatchReason = 'no_match_created';
      }
    } catch {
      // Match üretimi başarısız olsa bile quota güncellemesi geçerli; kullanıcı tekrar deneyebilir.
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        ...result,
        created,
        ...(noMatchReason ? { noMatchReason } : {}),
        ...(matchTierOut ? { matchTier: matchTierOut } : {}),
        ...(debugOut ? { debug: debugOut } : {}),
      })
    );
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
