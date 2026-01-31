import { getAdmin, normalizeBody, requireCronSecret } from './_firebaseAdmin.js';
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

function normalizeTextKey(v) {
  if (v === null || v === undefined) return '';
  return String(v)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i');
}

function normalizeGender(v) {
  const s = normalizeTextKey(v);
  if (!s) return '';

  if (s === 'male' || s === 'm' || s === 'man' || s === 'men' || s === 'erkek' || s === 'bay' || s === 'adam') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'women' || s === 'kadin' || s === 'bayan' || s === 'kiz') return 'female';
  return '';
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

function membershipMaxMatchesFromUserDoc(userDoc, nowMs) {
  const m = userDoc?.membership || null;
  const plan = typeof m?.plan === 'string' ? String(m.plan).toLowerCase().trim() : '';
  const validUntilMs = typeof m?.validUntilMs === 'number' && Number.isFinite(m.validUntilMs) ? m.validUntilMs : 0;
  const active = !!m?.active && validUntilMs > nowMs;
  // Geçici ürün kararı (fiyatlandırma öncesi): herkes için 5 aktif eşleşmeye kadar izin ver.
  if (!active) return 5;
  if (plan === 'pro') return 10;
  if (plan === 'standard') return 5;
  return 5;
}

function countsAsActiveSlotForUser(match, uid) {
  const st = safeStr(match?.status);
  if (st !== 'proposed' && st !== 'mutual_accepted' && st !== 'contact_unlocked') return false;

  // Kullanıcı dismiss ettiyse UI'da slotu boş görür; backend'de de slotu boş sayalım.
  const d = match?.dismissals && typeof match.dismissals === 'object' ? match.dismissals : null;
  if (d && uid && d[uid]) return false;

  return true;
}

function incrementMap(map, key, inc = 1) {
  if (!key) return;
  const prev = map.get(key) || 0;
  map.set(key, prev + inc);
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
  // Yeni ürün kuralı:
  // - Reject edilen eşleşmeler bir daha asla üretilmez.
  // - Reject dışındaki cancel durumlarında (örn. admin_rollback) yeniden üretime izin verilebilir.
  if (!match) return false;
  if (hasEverActiveMatch(match)) return false;

  const status = safeStr(match?.status);
  if (status !== 'cancelled') return false;

  const reason = safeStr(match?.cancelledReason);
  if (reason === 'rejected' || reason === 'rejected_all') return false;
  return true;
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

function relaxedAgeWindowYears() {
  const n = Number(process.env.MATCHMAKING_RELAXED_AGE_WINDOW_YEARS || 7);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 7;
}

function ageCompatibleBoth(a, b) {
  return ageCompatibleOneWay(a, b) && ageCompatibleOneWay(b, a);
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

function buildPoolBreakdown({
  seeker,
  seekerUserId,
  seekerGender,
  wantGender,
  candidates,
  userStatusById,
  producedPairKeys,
  existingByPairKey,
  nowMs,
  inactiveCutoffMs,
  applyInactivityRules,
  relaxFilters,
  seekerAge,
  expandGroups,
}) {
  const out = {
    total: Array.isArray(candidates) ? candidates.length : 0,
    rejected: {
      self_or_missing_id: 0,
      same_gender: 0,
      cand_age_missing: 0,
      blocked: 0,
      inactive: 0,
      duplicate_pair_in_run: 0,
      existing_no_rematch: 0,
      lookingForGender_mismatch: 0,
      age_pref_incompatible: 0,
      age_group_policy: 0,
    },
    passed: 0,
    meta: {
      seekerAge: seekerAge ?? null,
      wantGender,
      expandGroups,
    },
  };

  const list = Array.isArray(candidates) ? candidates : [];
  for (const cand of list) {
    const candUserId = cand?.userId ? String(cand.userId) : '';
    if (!candUserId || candUserId === String(seekerUserId)) {
      out.rejected.self_or_missing_id += 1;
      continue;
    }

    const candGender = cand.genderNorm || normalizeGender(cand.gender);
    if (candGender && candGender === seekerGender) {
      out.rejected.same_gender += 1;
      continue;
    }

    const candAge = getAge(cand);
    if (candAge === null) {
      out.rejected.cand_age_missing += 1;
      continue;
    }

    const candStatus = userStatusById.get(String(candUserId)) || { blocked: false };
    if (candStatus.blocked) {
      out.rejected.blocked += 1;
      continue;
    }

    const candSeen = typeof candStatus?.lastSeenAtMs === 'number' ? candStatus.lastSeenAtMs : 0;
    const candCreatedAtMs = typeof cand?.createdAtMs === 'number' ? cand.createdAtMs : tsToMs(cand?.createdAt);
    const candInactive = candSeen > 0 ? candSeen <= inactiveCutoffMs : candCreatedAtMs > 0 && candCreatedAtMs <= inactiveCutoffMs;
    if (applyInactivityRules && candInactive) {
      out.rejected.inactive += 1;
      continue;
    }

    const pairKey = [String(seekerUserId), String(candUserId)].sort().join('__');
    if (producedPairKeys.has(pairKey)) {
      out.rejected.duplicate_pair_in_run += 1;
      continue;
    }
    const existing = existingByPairKey.get(pairKey) || null;
    if (existing && !canRematchMatchDoc(existing, nowMs)) {
      out.rejected.existing_no_rematch += 1;
      continue;
    }

    const candWant = cand.lookingForGenderNorm || normalizeGender(cand.lookingForGender);
    if (candWant && candWant !== seekerGender) {
      out.rejected.lookingForGender_mismatch += 1;
      continue;
    }

    if (!ageCompatibleBothWithMode(seeker, cand, { relaxAge: relaxFilters })) {
      out.rejected.age_pref_incompatible += 1;
      continue;
    }

    if (typeof seekerAge === 'number' && Number.isFinite(seekerAge)) {
      const dist = ageGroupDistance(seekerAge, candAge);
      const ok = expandGroups > 0 ? dist <= expandGroups : dist === 0;
      if (!ok) {
        out.rejected.age_group_policy += 1;
        continue;
      }
    }

    out.passed += 1;
  }

  return out;
}

function minPoolForStrictFilters() {
  const n = Number(process.env.MATCHMAKING_MIN_POOL_FOR_STRICT_FILTERS || 50);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 50;
}

function maritalCompatibleOneWay(seeker, candidate) {
  // Ürün kararı: ilk aşamada puanlama yok.
  // Eşleşme kriteri sadece yaş + cinsiyet + yaş aralığı uyumu.
  // Bu yüzden tüm adayları eşit skorla değerlendiriyoruz.
  return 50;
  const ra = incomeRank(a);
  const rb = incomeRank(b);
  if (ra === null || rb === null) return null;
  const d = Math.abs(ra - rb);
  if (d === 0) return 100;
  if (d === 1) return 70;
  if (d === 2) return 40;
  return 10;
}

function incomeRank(raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s || s === 'prefer_not_to_say') return null;
  if (s === 'low') return 1;
  if (s === 'medium') return 2;
  if (s === 'good') return 3;
  if (s === 'very_good') return 4;
  return null;
}

function incomeSimilarityScore(aIncome, bIncome) {
  const ra = incomeRank(aIncome);
  const rb = incomeRank(bIncome);
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
  // 0cm => 100, 10cm => 50, 20cm => 0
  return Math.max(0, Math.min(100, Math.round(100 - dist * 5)));
}

function ageGapScore(a, b) {
  const aa = getAge(a);
  const ab = getAge(b);
  if (aa === null || ab === null) return null;
  const d = Math.abs(aa - ab);
  // 0 => 100, 5 => 50, 10 => 0
  return Math.max(0, Math.min(100, Math.round(100 - d * 10)));
}

function computeTieBreakOneWay(seeker, candidate) {
  const seekerDetails = seeker?.details || {};
  const candDetails = candidate?.details || {};

  const weights = {
    income: 60,
    heightClose: 25,
    ageGap: 15,
  };

  let total = 0;
  let earned = 0;

  const incomeScore = incomeSimilarityScore(seekerDetails?.incomeLevel, candDetails?.incomeLevel);
  if (incomeScore !== null) {
    total += weights.income;
    earned += Math.round((incomeScore / 100) * weights.income);
  }

  const heightScore = heightClosenessOneWay(seeker, candidate);
  if (heightScore !== null) {
    total += weights.heightClose;
    earned += Math.round((heightScore / 100) * weights.heightClose);
  }

  const gapScore = ageGapScore(seeker, candidate);
  if (gapScore !== null) {
    total += weights.ageGap;
    earned += Math.round((gapScore / 100) * weights.ageGap);
  }

  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((earned / total) * 100)));
}

function computeFitScore(seeker, candidate) {
  // Yeni yaklaşım: eşleşmenin temelini yaş+cinsiyet oluşturur.
  // Buradaki skor, sadece “ilk bakışta” kriterlerden (medeni durum/çocuk/boy) gelir.
  const p = seeker?.partnerPreferences || {};
  const candDetails = candidate?.details || {};

  const weights = {
    maritalStatus: 40,
    children: 35,
    height: 25,
  };

  let total = 0;
  let earned = 0;
  let bonus = 0;

  // Medeni hal
  const prefMarital = safeStr(p?.maritalStatus);
  if (prefMarital) {
    total += weights.maritalStatus;
    if (prefMarital === 'doesnt_matter') {
      earned += weights.maritalStatus;
      bonus += 2;
    } else {
      const candMarital = safeStr(candDetails?.maritalStatus);
      if (candMarital && candMarital === prefMarital) earned += weights.maritalStatus;
    }
  }

  // Çocuk
  const prefChildren = safeStr(p?.childrenPreference);
  if (prefChildren) {
    total += weights.children;
    if (prefChildren === 'doesnt_matter') {
      earned += weights.children;
    } else {
      const has = safeStr(candDetails?.hasChildren);
      const ok = (prefChildren === 'want_children' && has === 'yes') || (prefChildren === 'no_children' && has === 'no');
      if (ok) earned += weights.children;
    }
  }

  // Boy
  const candHeight = asNum(candDetails?.heightCm);
  const minH = asNum(p?.heightMinCm);
  const maxH = asNum(p?.heightMaxCm);
  if (minH !== null || maxH !== null) {
    total += weights.height;
    if (candHeight !== null) {
      const ok = (minH === null || candHeight >= minH) && (maxH === null || candHeight <= maxH);
      if (ok) earned += weights.height;
    }
  }

  // Hiç kriter yoksa: nötr skor.
  if (!total) return 50;
  const base = Math.round((earned / total) * 100);
  return Math.max(0, Math.min(100, base + bonus));
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
    age: getAge(app),
    city: safeStr(app?.city),
    country: safeStr(app?.country),
    photoUrls: Array.isArray(app?.photoUrls) ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [],
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
        .limit(Math.max(1, maxToProcess - processed))
        .get();

      if (!snap2.empty) {
        const batch2 = db.batch();
        snap2.docs.forEach((d) => {
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
  }

  return { confirmed, slotsCleared };
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  let db = null;
  let FieldValue = null;
  let firebaseProjectId = '';
  const startedAtMs = Date.now();
  try {
    // Bu endpoint cron/job için tasarlandı.
    requireCronSecret(req);

    const body = normalizeBody(req);
    const qs = req?.query && typeof req.query === 'object' ? req.query : {};
    const thresholdRaw = req.method === 'GET' ? qs?.threshold : body.threshold;
    const limitAppsRaw = req.method === 'GET' ? qs?.limitApps : body.limitApps;
    const includeSeedsRaw = req.method === 'GET' ? qs?.includeSeeds : body.includeSeeds;
    const dryRunRaw = req.method === 'GET' ? qs?.dryRun : body.dryRun;

    const thresholdNum = typeof thresholdRaw === 'number' ? thresholdRaw : Number(thresholdRaw);
    const limitAppsNum = typeof limitAppsRaw === 'number' ? limitAppsRaw : Number(limitAppsRaw);
    // İlk aşama: skor eşiği yok.
    const threshold = 0;
    const limitApps = Number.isFinite(limitAppsNum) ? limitAppsNum : 400;

    const parseBoolish = (value) => {
      if (value === true || value === false) return value;
      if (value === null || typeof value === 'undefined') return undefined;
      const s = String(value).toLowerCase().trim();
      if (!s) return undefined;
      if (['1', 'true', 'yes', 'y', 'on'].includes(s)) return true;
      if (['0', 'false', 'no', 'n', 'off'].includes(s)) return false;
      return undefined;
    };

    const includeSeeds =
      String(process.env.MATCHMAKING_INCLUDE_SEEDS || '').trim() === '1' ||
      ['1', 'true', 'yes', 'y'].includes(String(includeSeedsRaw || '').toLowerCase().trim());

    const dryRunFromReq = parseBoolish(dryRunRaw);
    const dryRunFromEnv = String(process.env.MATCHMAKING_DRY_RUN || '').trim() === '1';
    const dryRun = typeof dryRunFromReq === 'boolean' ? dryRunFromReq : dryRunFromEnv;
    const dryRunSource = typeof dryRunFromReq === 'boolean' ? 'request' : dryRunFromEnv ? 'env' : 'default';

    ({ db, FieldValue, projectId: firebaseProjectId } = getAdmin());

    // Auto-match generation gate:
    // - default is DISABLED (manual pool + request/approve flow)
    // - enable explicitly via siteSettings/matchmaking.matchmakingAutoMatchEnabled=true
    // - can be overridden by env MATCHMAKING_AUTO_MATCH_ENABLED
    let autoMatchEnabled = false;
    let autoMatchEnabledSource = 'default_disabled';
    try {
      const settingsSnap = await db.collection('siteSettings').doc('matchmaking').get();
      const settings = settingsSnap.exists ? (settingsSnap.data() || {}) : {};
      if (typeof settings?.matchmakingAutoMatchEnabled === 'boolean') {
        autoMatchEnabled = settings.matchmakingAutoMatchEnabled;
        autoMatchEnabledSource = 'siteSettings';
      }
    } catch {
      // If settings read fails, stay on default_disabled (safer than auto-enabling).
    }

    const autoMatchEnabledFromEnv = parseBoolish(process.env.MATCHMAKING_AUTO_MATCH_ENABLED);
    if (typeof autoMatchEnabledFromEnv === 'boolean') {
      autoMatchEnabled = autoMatchEnabledFromEnv;
      autoMatchEnabledSource = 'env';
    }

    const headers = req?.headers || {};
    const runMeta = {
      startedAtMs,
      startedAt: FieldValue.serverTimestamp(),
      // Kaynak ipucu (cron mu manuel mi?)
      triggeredBy: String(headers?.['x-vercel-cron'] || headers?.['X-Vercel-Cron'] ? 'vercel_cron' : 'secret'),
      vercelId: String(headers?.['x-vercel-id'] || headers?.['X-Vercel-Id'] || ''),
      userAgent: String(headers?.['user-agent'] || headers?.['User-Agent'] || ''),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Best-effort: start log
    try {
      await db.collection('matchmakingRuns').doc('last').set(runMeta, { merge: true });
    } catch {
      // ignore
    }

    const nowMs = Date.now();
    const proposedTtlHoursRaw = Number(process.env.MATCHMAKING_PROPOSED_TTL_HOURS || 48);
    const proposedTtlHours = Number.isFinite(proposedTtlHoursRaw) && proposedTtlHoursRaw > 0 ? proposedTtlHoursRaw : 48;
    const PROPOSED_TTL_MS = Math.round(proposedTtlHours * 60 * 60 * 1000);
    // Küçük havuzlarda 24 saat çok agresif ve havuzu sıfırlayabiliyor.
    // Varsayılanı 7 gün yaptık; istenirse env ile düşürülebilir.
    const ttlHours = Number(process.env.MATCHMAKING_INACTIVE_TTL_HOURS || 24 * 7);
    const INACTIVE_TTL_MS = (Number.isFinite(ttlHours) && ttlHours > 0 ? ttlHours : 24 * 7) * 60 * 60 * 1000;
    const inactiveCutoffMs = nowMs - INACTIVE_TTL_MS;

    // 48 saat kuralı:
    // - proposed: 48 saat sonunda expire
    // - mutual_accepted: 48 saat sonunda "kesinleşmiş" kabul edilir ve diğer proposed slotları boşaltılır
    const expiredProposed = dryRun ? 0 : await expireOldProposedMatches({ db, FieldValue, nowMs, ttlMs: PROPOSED_TTL_MS });

    // 48 saat dolmuş mutual_accepted match'leri kesinleşmiş say (auto-confirm) ve diğer proposed slotlarını boşalt.
    // Not: cleanupInactiveMatches'ten önce çağırıyoruz ki confirmed match'ler pasiflik kuralıyla iptal edilmesin.
    const autoConfirmed = dryRun ? { confirmed: 0, slotsCleared: 0 } : await autoConfirmOldMutualAccepted({ db, FieldValue, nowMs, ttlMs: PROPOSED_TTL_MS });

    // If auto-match generation is disabled, still do maintenance (expire/auto-confirm) but do not create new matches.
    if (!autoMatchEnabled) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          ok: true,
          disabled: true,
          reason: 'matchmaking_auto_match_disabled',
          autoMatchEnabled: false,
          autoMatchEnabledSource,
          created: 0,
          updated: 0,
          expiredProposed,
          autoConfirmed,
        })
      );
      return;
    }

    const appsSnap = await db
      .collection('matchmakingApplications')
      .orderBy('createdAt', 'desc')
      .limit(Math.max(50, Math.min(2000, limitApps)))
      .get();

    const rawApps = appsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const seedTagged = rawApps.filter((a) => isSeedApplication(a)).length;
    // appsSnap createdAt desc geliyor; aynı userId için ilk kayıt en yenidir.
    const rawAppsUnique = dedupeAppsByUserIdKeepFirst(rawApps);
    const apps = rawAppsUnique
      .map((a) => ({
        ...a,
        genderNorm: normalizeGender(a?.gender),
        lookingForGenderNorm: normalizeGender(a?.lookingForGender),
      }))
      .filter((a) => a?.userId && (a.genderNorm === 'male' || a.genderNorm === 'female'))
      .filter((a) => (includeSeeds ? true : !isSeedApplication(a)));

    const minPool = minPoolForStrictFilters();
    // Yaş tercihlerini gevşetme yok.
    const relaxFilters = false;
    // Ürün kararı: pasiflik/online filtresi yok.
    // Kullanıcılar kaç gündür pasif olduğuna bakılmaksızın eşleştirmeye dahil edilir.
    // (İstenirse ileride env ile tekrar açılabilir.)
    const applyInactivityRules = false;

    // Pasif kullanıcılar: küçük havuzda devre dışı bırak (aksi halde havuz sıfırlanabiliyor).
    const inactiveCleanup =
      !applyInactivityRules || dryRun
        ? { cancelledProposed: 0, cancelledMutualAccepted: 0, freedLocks: 0, creditsGranted: 0 }
        : await cleanupInactiveMatches({ db, FieldValue, nowMs, ttlMs: INACTIVE_TTL_MS });

    // Daha önce oluşturulmuş eşleşmeler: aynı iki kullanıcıyı tekrar eşleştirmemek için.
    // Not: Basit MVP; çok büyürse burada daha hedefli query gerekir.
    const existingMatchesSnap = await db
      .collection('matchmakingMatches')
      .orderBy('createdAt', 'desc')
      .limit(5000)
      .get();

    // Slot doluluğu: kullanıcı bazında aktif match sayısı.
    // Not: Bu sayım lockActive'den bağımsızdır; UI'daki "boş slot" algısıyla uyumlu olmalıdır.
    const activeMatchCountByUserId = new Map();

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

        for (const uid of userIds) {
          if (countsAsActiveSlotForUser(m, uid)) incrementMap(activeMatchCountByUserId, uid, 1);
        }
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

        const maxMatches = null;
        const activeMatchCount = activeMatchCountByUserId.get(d.id) || 0;
        const hasFreeSlot = true;

        userStatusById.set(d.id, {
          blocked: !!data.blocked,
          lockActive: !!data?.matchmakingLock?.active,
          lastSeenAtMs: lastSeenMsFromUserDoc(data),
          cooldownUntilMs: 0,
          newUserSlotActive,
          newUserSlotSinceMs,
          newUserSlotThreshold,
          identityVerified: isIdentityVerifiedUserDoc(data),
          membershipActive: isMembershipActiveUserDoc(data),
          membershipPlan: typeof data?.membership?.plan === 'string' ? String(data.membership.plan).toLowerCase().trim() : '',
          maxMatches,
          activeMatchCount,
          hasFreeSlot,
        });
      });
    }

    // Basit filtre: sadece karşılıklı beklenti uyumu olanları ele al.
    const byGender = {
      male: apps.filter((a) => a.genderNorm === 'male'),
      female: apps.filter((a) => a.genderNorm === 'female'),
    };

    let created = 0;
    let skippedExisting = 0;

    const debug = {
      runtime: {
        firebaseProjectId: firebaseProjectId || null,
        envFlags: {
          hasMatchmakingDryRun: typeof process.env.MATCHMAKING_DRY_RUN !== 'undefined',
          matchmakingDryRunIs1: String(process.env.MATCHMAKING_DRY_RUN || '').trim() === '1',
          hasMatchmakingCronSecret: !!String(process.env.MATCHMAKING_CRON_SECRET || '').trim(),
          hasFirebaseServiceAccountInline: !!String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT || '').trim(),
          hasFirebaseServiceAccountFile: !!String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE || process.env.FIREBASE_SERVICE_ACCOUNT_FILE || '').trim(),
        },
      },
      params: {
        threshold,
        limitApps,
        includeSeeds,
        dryRun,
        dryRunSource,
        relaxFilters,
        applyInactivityRules,
        minPoolForStrictFilters: minPool,
        proposedTtlHours,
        agePolicy: {
          minAge: MIN_AGE,
          strictGroupMinCandidates: getStrictGroupMinCandidatesFromEnv(),
          maxGroupExpand: getAgeGroupMaxExpandFromEnv(),
        },
        inactiveTtlHours: Number.isFinite(ttlHours) ? ttlHours : null,
        inactiveCutoffMs,
        nowMs,
      },
      apps: {
        fetched: rawApps.length,
        seedTagged,
        usable: apps.length,
      },
      seekers: {
        total: 0,
        processed: 0,
        skipped: {
          blocked_or_locked: 0,
          cooldown: 0,
          inactive: 0,
          invalid_want_gender: 0,
          same_gender_guard: 0,
          no_pool_candidates: 0,
        },
        fallbacks: {
          allowInactiveSlotCandidates: 0,
          allowInactiveCandidates: 0,
        },
        agePolicy: {
          expandGroups: { '0': 0, '1': 0, '2': 0 },
          expandGroupsOther: 0,
        },
        withCandidates: 0,
      },
      matches: {
        writeAttempts: 0,
        written: 0,
        skippedExisting: 0,
      },
      samples: [],
      poolBreakdowns: [],
    };

    // Kaba bir yaklaşım: her başvuru için aday üret.
    // Not: Pro aktif üyeler için top-3 kısıtını kaldırıyoruz.
    for (const seeker of apps) {
      debug.seekers.total += 1;
      const seekerUserId = seeker.userId;

      const seekerStatus = userStatusById.get(String(seekerUserId)) || { blocked: false };
      // Engelli kullanıcılar: yeni eşleşme üretme.
      if (seekerStatus.blocked) {
        debug.seekers.skipped.blocked_or_locked += 1;
        continue;
      }

      // 24 saatten uzun pasif kullanıcı için yeni eşleşme üretme.
      const seekerSeen = typeof seekerStatus?.lastSeenAtMs === 'number' ? seekerStatus.lastSeenAtMs : 0;
      const seekerCreatedAtMs = typeof seeker?.createdAtMs === 'number' ? seeker.createdAtMs : tsToMs(seeker?.createdAt);
      const seekerInactive = seekerSeen > 0 ? seekerSeen <= inactiveCutoffMs : seekerCreatedAtMs > 0 && seekerCreatedAtMs <= inactiveCutoffMs;
      if (applyInactivityRules && seekerInactive) {
        debug.seekers.skipped.inactive += 1;
        continue;
      }

      const seekerGender = seeker.genderNorm || normalizeGender(seeker.gender);
      const wantGender = seekerGender === 'male' ? 'female' : seekerGender === 'female' ? 'male' : '';
      // Ürün kararı: milliyet/ülke filtresi yok.
      const seekerNatCode = '';
      const wantNat = '';
      const wantNatCode = '';

      // Sistemsel hata dahil: aynı cinsiyet eşleşmesi üretme.
      if (wantGender !== 'male' && wantGender !== 'female') {
        debug.seekers.skipped.invalid_want_gender += 1;
        continue;
      }
      if (seekerGender && seekerGender === safeStr(wantGender)) {
        debug.seekers.skipped.same_gender_guard += 1;
        continue;
      }

      debug.seekers.processed += 1;

      // New-user slot aktifse: sadece slot açıldıktan sonra gelen yeni kayıtlardan (>=threshold) 1 eşleşme üret.
      if (seekerStatus?.newUserSlotActive && seekerStatus?.newUserSlotSinceMs > 0) {
        const seekerAge = getAge(seeker);
        if (seekerAge === null) {
          debug.seekers.skipped.no_pool_candidates += 1;
          continue;
        }

        const sinceMs = seekerStatus.newUserSlotSinceMs;
        const slotThreshold = typeof seekerStatus?.newUserSlotThreshold === 'number' ? seekerStatus.newUserSlotThreshold : 70;

        let allowInactiveSlotCandidates = false;

        let poolNewStrict = (byGender[wantGender] || []).filter((cand) => {
          if (!cand?.userId || cand.userId === seekerUserId) return false;
          if ((cand.genderNorm || normalizeGender(cand.gender)) === seekerGender) return false;

          const candStatus = userStatusById.get(String(cand.userId)) || { blocked: false };
          if (candStatus.blocked) return false;

          const candSeen = typeof candStatus?.lastSeenAtMs === 'number' ? candStatus.lastSeenAtMs : 0;
          const candCreatedAtMs = typeof cand?.createdAtMs === 'number' ? cand.createdAtMs : tsToMs(cand?.createdAt);
          const candInactive = candSeen > 0 ? candSeen <= inactiveCutoffMs : candCreatedAtMs > 0 && candCreatedAtMs <= inactiveCutoffMs;
          if (applyInactivityRules && candInactive && !allowInactiveSlotCandidates) return false;

          // Yalnızca slot açıldıktan sonra kaydolanlar.
          const createdMs = candCreatedAtMs;
          if (createdMs > 0 && !(createdMs > sinceMs)) return false;

          // Re-match politikası: reddedilen çiftleri cooldown sonrası tekrar önerebiliriz.
          const pairKey = [String(seekerUserId), String(cand.userId)].sort().join('__');
          if (producedPairKeys.has(pairKey)) return false;
          const existing = existingByPairKey.get(pairKey) || null;
          if (existing && !canRematchMatchDoc(existing, nowMs)) return false;

          // Karşı tarafın da seeker ile uyumu
          const candWant = cand.lookingForGenderNorm || normalizeGender(cand.lookingForGender);
          if (candWant && candWant !== seekerGender) return false;
          // Milliyet/ülke filtresi yok.

          // Yaş+cinsiyet “yarı eşleşme” havuzu (iki yönlü)
          if (!ageCompatibleBothWithMode(seeker, cand, { relaxAge: relaxFilters })) return false;

          return true;
        });

        // Fallback tier'larda yalnızca milliyet kontrollerini gevşet.
        let poolNewRelax = (byGender[wantGender] || []).filter((cand) => {
          if (!cand?.userId || cand.userId === seekerUserId) return false;
          if ((cand.genderNorm || normalizeGender(cand.gender)) === seekerGender) return false;

          const candStatus = userStatusById.get(String(cand.userId)) || { blocked: false };
          if (candStatus.blocked) return false;

          const candSeen = typeof candStatus?.lastSeenAtMs === 'number' ? candStatus.lastSeenAtMs : 0;
          const candCreatedAtMs = typeof cand?.createdAtMs === 'number' ? cand.createdAtMs : tsToMs(cand?.createdAt);
          const candInactive = candSeen > 0 ? candSeen <= inactiveCutoffMs : candCreatedAtMs > 0 && candCreatedAtMs <= inactiveCutoffMs;
          if (applyInactivityRules && candInactive && !allowInactiveSlotCandidates) return false;

          const createdMs = candCreatedAtMs;
          if (createdMs > 0 && !(createdMs > sinceMs)) return false;

          const pairKey = [String(seekerUserId), String(cand.userId)].sort().join('__');
          if (producedPairKeys.has(pairKey)) return false;
          const existing = existingByPairKey.get(pairKey) || null;
          if (existing && !canRematchMatchDoc(existing, nowMs)) return false;

          const candWant = cand.lookingForGenderNorm || normalizeGender(cand.lookingForGender);
          if (candWant && candWant !== seekerGender) return false;
          if (!ageCompatibleBothWithMode(seeker, cand, { relaxAge: relaxFilters })) return false;
          // nationality filters relaxed
          return true;
        });

        // New-user slot için de aynı yaş grubu politikası.
        {
          const strictSameGroupCandidateCount = poolNewStrict.filter((cand) => {
            const ca = getAge(cand);
            if (ca === null) return false;
            return ageGroupDistance(seekerAge, ca) === 0;
          }).length;

          const localExpandGroups = decideAgeGroupExpandCount({
            strictSameGroupCandidateCount,
            strictMinCandidates: getStrictGroupMinCandidatesFromEnv(),
            maxExpand: getAgeGroupMaxExpandFromEnv(),
          });

          const withinGroupPolicy = (cand) => {
            const ca = getAge(cand);
            if (ca === null) return false;
            const dist = ageGroupDistance(seekerAge, ca);
            if (!Number.isFinite(dist)) return false;
            return localExpandGroups > 0 ? dist <= localExpandGroups : dist === 0;
          };

          poolNewStrict = poolNewStrict.filter(withinGroupPolicy);
          poolNewRelax = poolNewRelax.filter(withinGroupPolicy);
        }

        // Slot havuzu sadece "pasiflik" filtresi yüzünden boş kalıyorsa, son çare pasifleri de dahil et.
        if (poolNewStrict.length === 0 && poolNewRelax.length === 0) {
          allowInactiveSlotCandidates = true;
          poolNewStrict = (byGender[wantGender] || []).filter((cand) => {
            if (!cand?.userId || cand.userId === seekerUserId) return false;
            if ((cand.genderNorm || normalizeGender(cand.gender)) === seekerGender) return false;

            const candStatus = userStatusById.get(String(cand.userId)) || { blocked: false };
            if (candStatus.blocked) return false;

            const candSeen = typeof candStatus?.lastSeenAtMs === 'number' ? candStatus.lastSeenAtMs : 0;
            const candCreatedAtMs = typeof cand?.createdAtMs === 'number' ? cand.createdAtMs : tsToMs(cand?.createdAt);
            const candInactive = candSeen > 0 ? candSeen <= inactiveCutoffMs : candCreatedAtMs > 0 && candCreatedAtMs <= inactiveCutoffMs;
            if (applyInactivityRules && candInactive && !allowInactiveSlotCandidates) return false;

            const createdMs = candCreatedAtMs;
            if (createdMs > 0 && !(createdMs > sinceMs)) return false;

            const pairKey = [String(seekerUserId), String(cand.userId)].sort().join('__');
            if (producedPairKeys.has(pairKey)) return false;
            const existing = existingByPairKey.get(pairKey) || null;
            if (existing && !canRematchMatchDoc(existing, nowMs)) return false;

            const candWant = cand.lookingForGenderNorm || normalizeGender(cand.lookingForGender);
            if (candWant && candWant !== seekerGender) return false;
            // Milliyet/ülke filtresi yok.

            if (!ageCompatibleBothWithMode(seeker, cand, { relaxAge: relaxFilters })) return false;

            return true;
          });

          poolNewRelax = (byGender[wantGender] || []).filter((cand) => {
            if (!cand?.userId || cand.userId === seekerUserId) return false;
            if ((cand.genderNorm || normalizeGender(cand.gender)) === seekerGender) return false;

            const candStatus = userStatusById.get(String(cand.userId)) || { blocked: false };
            if (candStatus.blocked) return false;

            const candSeen = typeof candStatus?.lastSeenAtMs === 'number' ? candStatus.lastSeenAtMs : 0;
            const candCreatedAtMs = typeof cand?.createdAtMs === 'number' ? cand.createdAtMs : tsToMs(cand?.createdAt);
            const candInactive = candSeen > 0 ? candSeen <= inactiveCutoffMs : candCreatedAtMs > 0 && candCreatedAtMs <= inactiveCutoffMs;
            if (applyInactivityRules && candInactive && !allowInactiveSlotCandidates) return false;

            const createdMs = candCreatedAtMs;
            if (createdMs > 0 && !(createdMs > sinceMs)) return false;

            const pairKey = [String(seekerUserId), String(cand.userId)].sort().join('__');
            if (producedPairKeys.has(pairKey)) return false;
            const existing = existingByPairKey.get(pairKey) || null;
            if (existing && !canRematchMatchDoc(existing, nowMs)) return false;

            const candWant = cand.lookingForGenderNorm || normalizeGender(cand.lookingForGender);
            if (candWant && candWant !== seekerGender) return false;
            if (!ageCompatibleBothWithMode(seeker, cand, { relaxAge: relaxFilters })) return false;
            return true;
          });

          if (poolNewStrict.length > 0 || poolNewRelax.length > 0) {
            debug.seekers.fallbacks.allowInactiveSlotCandidates += 1;
          }
        }

        const scoredNewStrict = [];
        for (const cand of poolNewStrict) {
          const scoreA = computeFitScore(seeker, cand);
          const scoreB = computeFitScore(cand, seeker);
          const score = Math.round((scoreA + scoreB) / 2);
          const tieA = computeTieBreakOneWay(seeker, cand);
          const tieB = computeTieBreakOneWay(cand, seeker);
          const tie = Math.round((tieA + tieB) / 2);
          scoredNewStrict.push({ cand, score, scoreA, scoreB, tie });
        }

        // Eşik: iki tarafın tek tek değil, ortalama skoruna göre.
        const eligibleNew = scoredNewStrict.filter((x) => x.score >= slotThreshold);

        let pickedNew = [];
        let matchTier = 'age_gender_pool';
        if (eligibleNew.length) {
          eligibleNew.sort((x, y) => y.score - x.score);
          pickedNew = eligibleNew.slice(0, 1);
          matchTier = 'score_threshold';
        } else {
          const scoredNewRelax = [];
          for (const cand of poolNewRelax) {
            const scoreA = computeFitScore(seeker, cand);
            const scoreB = computeFitScore(cand, seeker);
            const score = Math.round((scoreA + scoreB) / 2);
            const tieA = computeTieBreakOneWay(seeker, cand);
            const tieB = computeTieBreakOneWay(cand, seeker);
            const tie = Math.round((tieA + tieB) / 2);
            scoredNewRelax.push({ cand, score, scoreA, scoreB, tie });
          }

          const combined = [...scoredNewStrict, ...scoredNewRelax];
          combined.sort((x, y) => {
            if (y.score !== x.score) return y.score - x.score;
            const tx = typeof x.tie === 'number' ? x.tie : 0;
            const ty = typeof y.tie === 'number' ? y.tie : 0;
            if (ty !== tx) return ty - tx;
            return 0;
          });
          pickedNew = combined.slice(0, 1);
        }

        let filledSlot = false;
        if (pickedNew.length) {
          const row = pickedNew[0];
          const aUserId = seekerUserId;
          const bUserId = row.cand.userId;
          const userIdsSorted = [aUserId, bUserId].sort();
          const matchId = `${userIdsSorted[0]}__${userIdsSorted[1]}`;
          const pairKey = matchId;

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
                  matchTier,
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
              producedPairKeys.add(pairKey);
              filledSlot = true;
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
              matchTier,
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
            producedPairKeys.add(pairKey);
            filledSlot = true;
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

        // Slot dolmadıysa normal havuza da düş: aksi halde kullanıcı "boş slot" görüp hiç match alamayabiliyor.
        if (filledSlot) continue;
      }

      const seekerAge = getAge(seeker);
      if (seekerAge === null) {
        debug.seekers.skipped.no_pool_candidates += 1;
        continue;
      }

      let expandGroups = 0;

      let poolStrict = (byGender[wantGender] || []).filter((cand) => {
        if (!cand?.userId || cand.userId === seekerUserId) return false;
        if ((cand.genderNorm || normalizeGender(cand.gender)) === seekerGender) return false;

        const candAge = getAge(cand);
        if (candAge === null) return false;

        const candStatus = userStatusById.get(String(cand.userId)) || { blocked: false };
        if (candStatus.blocked) return false;

        const candSeen = typeof candStatus?.lastSeenAtMs === 'number' ? candStatus.lastSeenAtMs : 0;
        const candCreatedAtMs = typeof cand?.createdAtMs === 'number' ? cand.createdAtMs : tsToMs(cand?.createdAt);
        const candInactive = candSeen > 0 ? candSeen <= inactiveCutoffMs : candCreatedAtMs > 0 && candCreatedAtMs <= inactiveCutoffMs;
        if (applyInactivityRules && candInactive) return false;

        // Re-match politikası: reddedilen çiftleri cooldown sonrası (2 kez sınırıyla) tekrar önerebiliriz.
        const pairKey = [String(seekerUserId), String(cand.userId)].sort().join('__');
        if (producedPairKeys.has(pairKey)) return false;
        const existing = existingByPairKey.get(pairKey) || null;
        if (existing && !canRematchMatchDoc(existing, nowMs)) return false;

        // Karşı tarafın da "ben kimi arıyorum" kısmı seeker ile uyumlu mu?
        const candWant = cand.lookingForGenderNorm || normalizeGender(cand.lookingForGender);
        if (candWant && candWant !== seekerGender) return false;
        // Milliyet/ülke filtresi yok.

        if (!ageCompatibleBothWithMode(seeker, cand, { relaxAge: relaxFilters })) return false;

        return true;
      });

      let allowInactiveCandidates = false;

      let poolRelax = (byGender[wantGender] || []).filter((cand) => {
        if (!cand?.userId || cand.userId === seekerUserId) return false;
        if ((cand.genderNorm || normalizeGender(cand.gender)) === seekerGender) return false;

        const candAge = getAge(cand);
        if (candAge === null) return false;

        const candStatus = userStatusById.get(String(cand.userId)) || { blocked: false };
        if (candStatus.blocked) return false;

        const candSeen = typeof candStatus?.lastSeenAtMs === 'number' ? candStatus.lastSeenAtMs : 0;
        const candCreatedAtMs = typeof cand?.createdAtMs === 'number' ? cand.createdAtMs : tsToMs(cand?.createdAt);
        const candInactive = candSeen > 0 ? candSeen <= inactiveCutoffMs : candCreatedAtMs > 0 && candCreatedAtMs <= inactiveCutoffMs;
        if (applyInactivityRules && candInactive && !allowInactiveCandidates) return false;

        const pairKey = [String(seekerUserId), String(cand.userId)].sort().join('__');
        if (producedPairKeys.has(pairKey)) return false;
        const existing = existingByPairKey.get(pairKey) || null;
        if (existing && !canRematchMatchDoc(existing, nowMs)) return false;

        const candWant = cand.lookingForGenderNorm || normalizeGender(cand.lookingForGender);
        if (candWant && candWant !== seekerGender) return false;
        if (!ageCompatibleBothWithMode(seeker, cand, { relaxAge: relaxFilters })) return false;
        // nationality filters relaxed
        return true;
      });

      // Yaş grubu kuralı: varsayılan sadece aynı 5'li grup.
      // Eğer (karşılıklı yaş aralığına rağmen) aynı grupta yeterli aday yoksa, ±2 yaş grubuna kadar esnet.
      {
        const poolStrictBeforeAgeGroupPolicy = poolStrict.length;
        const poolRelaxBeforeAgeGroupPolicy = poolRelax.length;

        const strictSameGroupCandidateCount = poolStrict.filter((cand) => {
          const ca = getAge(cand);
          if (ca === null) return false;
          return ageGroupDistance(seekerAge, ca) === 0;
        }).length;

        expandGroups = decideAgeGroupExpandCount({
          strictSameGroupCandidateCount,
          strictMinCandidates: getStrictGroupMinCandidatesFromEnv(),
          maxExpand: getAgeGroupMaxExpandFromEnv(),
        });

        const withinGroupPolicy = (cand) => {
          const ca = getAge(cand);
          if (ca === null) return false;
          const dist = ageGroupDistance(seekerAge, ca);
          if (!Number.isFinite(dist)) return false;
          return expandGroups > 0 ? dist <= expandGroups : dist === 0;
        };

        poolStrict = poolStrict.filter(withinGroupPolicy);
        poolRelax = poolRelax.filter(withinGroupPolicy);

        // İlk birkaç örnek için (havuz boşsa) nedenini hızlıca açıklayalım.
        if (debug.poolBreakdowns.length < 3 && poolStrict.length === 0 && poolRelax.length === 0) {
          const candidates = byGender[wantGender] || [];
          const breakdown = buildPoolBreakdown({
            seeker,
            seekerUserId,
            seekerGender,
            wantGender,
            candidates,
            userStatusById,
            producedPairKeys,
            existingByPairKey,
            nowMs,
            inactiveCutoffMs,
            applyInactivityRules,
            relaxFilters,
            seekerAge,
            expandGroups,
          });

          // Debug'a tek seferlik ek meta bilgisi olarak yaz.
          debug.poolBreakdowns.push({
            seekerUserId: String(seekerUserId),
            seekerAge,
            wantGender,
            poolStrict: poolStrict.length,
            poolRelax: poolRelax.length,
            poolStrictBeforeAgeGroupPolicy,
            poolRelaxBeforeAgeGroupPolicy,
            tier: 'age_gender_pool',
            poolBreakdown: breakdown,
            top: null,
          });
        }
      }

      // Havuz sadece "pasiflik" filtresi yüzünden boşsa, son çare pasifleri dahil et.
      if (poolStrict.length === 0 && poolRelax.length === 0) {
        allowInactiveCandidates = true;
        poolRelax = (byGender[wantGender] || []).filter((cand) => {
          if (!cand?.userId || cand.userId === seekerUserId) return false;
          if ((cand.genderNorm || normalizeGender(cand.gender)) === seekerGender) return false;

          const candStatus = userStatusById.get(String(cand.userId)) || { blocked: false };
          if (candStatus.blocked) return false;

          const candSeen = typeof candStatus?.lastSeenAtMs === 'number' ? candStatus.lastSeenAtMs : 0;
          const candCreatedAtMs = typeof cand?.createdAtMs === 'number' ? cand.createdAtMs : tsToMs(cand?.createdAt);
          const candInactive = candSeen > 0 ? candSeen <= inactiveCutoffMs : candCreatedAtMs > 0 && candCreatedAtMs <= inactiveCutoffMs;
          if (applyInactivityRules && candInactive && !allowInactiveCandidates) return false;

          const pairKey = [String(seekerUserId), String(cand.userId)].sort().join('__');
          if (producedPairKeys.has(pairKey)) return false;
          const existing = existingByPairKey.get(pairKey) || null;
          if (existing && !canRematchMatchDoc(existing, nowMs)) return false;

          const candWant = cand.lookingForGenderNorm || normalizeGender(cand.lookingForGender);
          if (candWant && candWant !== seekerGender) return false;
          if (!ageCompatibleBothWithMode(seeker, cand, { relaxAge: relaxFilters })) return false;
          return true;
        });

        if (poolRelax.length > 0) {
          debug.seekers.fallbacks.allowInactiveCandidates += 1;
        }
      }

      // Pasiflik fallback'i sonrası tekrar uygula (age policy delinmesin).
      if (poolRelax.length > 0) {
        const withinGroupPolicy2 = (cand) => {
          const ca = getAge(cand);
          if (ca === null) return false;
          const dist = ageGroupDistance(seekerAge, ca);
          if (!Number.isFinite(dist)) return false;
          return expandGroups > 0 ? dist <= expandGroups : dist === 0;
        };
        poolRelax = poolRelax.filter(withinGroupPolicy2);
      }

      // expandGroups dağılımını debug'a yaz.
      {
        const k = String(expandGroups);
        if (Object.prototype.hasOwnProperty.call(debug.seekers.agePolicy.expandGroups, k)) {
          debug.seekers.agePolicy.expandGroups[k] += 1;
        } else {
          debug.seekers.agePolicy.expandGroupsOther += 1;
        }
      }

      if (poolStrict.length === 0 && poolRelax.length === 0) {
        debug.seekers.skipped.no_pool_candidates += 1;
      } else {
        debug.seekers.withCandidates += 1;
      }

      // 70+ tier strict (milliyet dahil) havuzundan gelsin.
      const scoredStrict = [];
      for (const cand of poolStrict) {
        const scoreA = computeFitScore(seeker, cand);
        const scoreB = computeFitScore(cand, seeker);
        const score = Math.round((scoreA + scoreB) / 2);
        const tieA = computeTieBreakOneWay(seeker, cand);
        const tieB = computeTieBreakOneWay(cand, seeker);
        const tie = Math.round((tieA + tieB) / 2);
        scoredStrict.push({ cand, score, scoreA, scoreB, tie });
      }

      // Eşik: iki tarafın tek tek değil, ortalama skoruna göre.
      const eligible = scoredStrict.filter((x) => x.score >= threshold);

      // Fallback tier'lar: milliyet gevşek havuzdan gelsin.
      const scored = [];
      for (const cand of poolRelax) {
        const scoreA = computeFitScore(seeker, cand);
        const scoreB = computeFitScore(cand, seeker);
        const score = Math.round((scoreA + scoreB) / 2);
        const tieA = computeTieBreakOneWay(seeker, cand);
        const tieB = computeTieBreakOneWay(cand, seeker);
        const tie = Math.round((tieA + tieB) / 2);
        scored.push({ cand, score, scoreA, scoreB, tie });
      }

      let picked = [];
      let matchTier = 'age_gender_pool';
      if (eligible.length) {
        picked = eligible;
        matchTier = 'score_threshold';
      } else {
        // Yaş+cinsiyet havuzu zaten uygulanmış durumda; burada sadece puana göre seç.
        picked = scored.length ? scored : scoredStrict;
      }

      const plan = seekerStatus.membershipActive ? String(seekerStatus.membershipPlan || '') : '';
      const maxMatches = plan === 'pro' ? 10 : plan === 'standard' ? 5 : 3;

      // Eğer kullanıcı limiti > mevcut aday sayısı ise, yaş aralığı karşılıklı uyumunda çok dar kalmış olabilir.
      // Bu durumda son çare: aynı yaş grubundaki (örn 5'lik dilimler) adayları da ekle.
      if (picked.length < maxMatches) {
        const seekerAge = getAge(seeker);
        const seenIds = new Set(picked.map((x) => String(x?.cand?.userId || '')).filter(Boolean));
        const extra = [];

        if (seekerAge !== null) {
          for (const cand of byGender[wantGender] || []) {
            if (!cand?.userId || cand.userId === seekerUserId) continue;
            if (seenIds.has(String(cand.userId))) continue;
            if ((cand.genderNorm || normalizeGender(cand.gender)) === seekerGender) continue;

            const candStatus = userStatusById.get(String(cand.userId)) || { blocked: false };
            if (candStatus.blocked) continue;

            const candSeen = typeof candStatus?.lastSeenAtMs === 'number' ? candStatus.lastSeenAtMs : 0;
            const candCreatedAtMs = typeof cand?.createdAtMs === 'number' ? cand.createdAtMs : tsToMs(cand?.createdAt);
            const candInactive = candSeen > 0 ? candSeen <= inactiveCutoffMs : candCreatedAtMs > 0 && candCreatedAtMs <= inactiveCutoffMs;
            if (applyInactivityRules && candInactive) continue;

            const pairKey = [String(seekerUserId), String(cand.userId)].sort().join('__');
            if (producedPairKeys.has(pairKey)) continue;
            const existing = existingByPairKey.get(pairKey) || null;
            if (existing && !canRematchMatchDoc(existing, nowMs)) continue;

            const candWant = cand.lookingForGenderNorm || normalizeGender(cand.lookingForGender);
            if (candWant && candWant !== seekerGender) continue;

            const candAge = getAge(cand);
            if (candAge === null) continue;
            // Bu fallback bloğu artık yaş grubu kuralını DELMEZ; sadece mevcut politika kapsamındaki adayları ekler.
            const dist = ageGroupDistance(seekerAge, candAge);
            if (!(expandGroups > 0 ? dist <= expandGroups : dist === 0)) continue;

            const scoreA = computeFitScore(seeker, cand);
            const scoreB = computeFitScore(cand, seeker);
            const score = Math.round((scoreA + scoreB) / 2);
            const tieA = computeTieBreakOneWay(seeker, cand);
            const tieB = computeTieBreakOneWay(cand, seeker);
            const tie = Math.round((tieA + tieB) / 2);
            extra.push({ cand, score, scoreA, scoreB, tie, matchTier: 'age_group_pool' });
            seenIds.add(String(cand.userId));
          }
        }

        if (extra.length) {
          picked = picked.concat(extra);
        }
      }

      picked.sort((x, y) => {
        if (y.score !== x.score) return y.score - x.score;
        const tx = typeof x.tie === 'number' ? x.tie : 0;
        const ty = typeof y.tie === 'number' ? y.tie : 0;
        if (ty !== tx) return ty - tx;
        return 0;
      });
      const top = picked.slice(0, maxMatches);

      if (debug.samples.length < 12) {
        const topOne = top[0] || null;
        debug.samples.push({
          seekerUserId: String(seekerUserId),
          seekerAge: getAge(seeker),
          wantGender,
          poolStrict: poolStrict.length,
          poolRelax: poolRelax.length,
          tier: matchTier,
          top: topOne
            ? {
                candUserId: String(topOne.cand?.userId || ''),
                candAge: getAge(topOne.cand),
                score: topOne.score,
                scoreA: topOne.scoreA,
                scoreB: topOne.scoreB,
                tie: typeof topOne.tie === 'number' ? topOne.tie : null,
              }
            : null,
        });
      }

      for (const row of top) {
        debug.matches.writeAttempts += 1;
        const aUserId = seekerUserId;
        const bUserId = row.cand.userId;
        const userIdsSorted = [aUserId, bUserId].sort();
        const matchId = `${userIdsSorted[0]}__${userIdsSorted[1]}`;
        const pairKey = matchId;

        const ref = db.collection('matchmakingMatches').doc(matchId);
        const existing = await ref.get();
        if (existing.exists) {
          const ex = existing.data() || {};
          if (!canRematchMatchDoc(ex, nowMs)) {
            skippedExisting += 1;
            debug.matches.skippedExisting += 1;
            continue;
          }
        }

        if (dryRun) {
          created += 1;
          debug.matches.written += 1;
          producedPairKeys.add(pairKey);
          continue;
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
          tie: typeof row.tie === 'number' ? row.tie : null,
          matchTier: safeStr(row?.matchTier) || matchTier,
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
        debug.matches.written += 1;

        // Aynı çalıştırma içinde tekrar üretimi engelle.
        producedPairKeys.add(pairKey);
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');

    // Best-effort: success log
    try {
      await db.collection('matchmakingRuns').doc('last').set(
        {
          ok: true,
          error: '',
          finishedAtMs: Date.now(),
          finishedAt: FieldValue.serverTimestamp(),
          summary: {
            created,
            skippedExisting,
            apps: apps.length,
            expiredProposed,
            inactiveCleanup,
            autoConfirmed: autoConfirmed?.confirmed || 0,
            clearedSlots: autoConfirmed?.slotsCleared || 0,
            debug,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // ignore
    }

    res.end(
      JSON.stringify({
        ok: true,
        created,
        skippedExisting,
        apps: apps.length,
        expiredProposed,
        inactiveCleanup,
        autoConfirmed: autoConfirmed?.confirmed || 0,
        clearedSlots: autoConfirmed?.slotsCleared || 0,
        debug,
      })
    );
  } catch (e) {
    // Best-effort: failure log
    try {
      if (db && FieldValue) {
        await db.collection('matchmakingRuns').doc('last').set(
          {
            ok: false,
            error: String(e?.message || 'server_error'),
            finishedAtMs: Date.now(),
            finishedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch {
      // ignore
    }

    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
