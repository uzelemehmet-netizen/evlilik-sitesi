import {
  getMinimumMatchmakingProfileMissingFromApp,
  hasAnyMatchmakingProfileInUserDoc,
  hasMinimumMatchmakingProfileInApplicationDoc,
  hasMinimumMatchmakingProfileInUserDoc,
  isStubMatchmakingApplication,
} from '../src/utils/matchmakingProfileCompletion.js';
import { fetchMatchmakingApplicationsByUid } from './_matchmakingApplications.js';

function normalizeGender(v) {
  const s = String(v || '').toLowerCase().trim();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function oppositeGender(v) {
  const gender = normalizeGender(v);
  if (gender === 'male') return 'female';
  if (gender === 'female') return 'male';
  return '';
}

function resolveLookingForGender(gender, lookingForGender) {
  const normalizedGender = normalizeGender(gender);
  if (normalizedGender) return oppositeGender(normalizedGender);
  return normalizeGender(lookingForGender);
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function pickFirstNonEmptyStr(...vals) {
  for (const v of vals) {
    const s = safeStr(v);
    if (s) return s;
  }
  return '';
}

function toNumOrNull(v, { min = -Infinity, max = Infinity } = {}) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

function ageFromBirthYearMaybe(v) {
  const year = toNumOrNull(v, { min: 1900, max: 2100 });
  if (year === null) return null;
  const now = new Date();
  const age = now.getFullYear() - year;
  return age >= 18 && age <= 99 ? age : null;
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
  return age >= 18 && age <= 99 ? age : null;
}

function getAge(app) {
  const a = app && typeof app === 'object' ? app : {};
  const details = a?.details && typeof a.details === 'object' ? a.details : {};

  const direct = toNumOrNull(a?.age, { min: 18, max: 99 });
  if (direct !== null) return direct;

  const nested = toNumOrNull(details?.age, { min: 18, max: 99 });
  if (nested !== null) return nested;

  const byYear = ageFromBirthYearMaybe(details?.birthYear ?? a?.birthYear);
  if (byYear !== null) return byYear;

  const byDate =
    ageFromDateMaybe(details?.birthDateMs ?? a?.birthDateMs) ??
    ageFromDateMaybe(details?.birthDate ?? a?.birthDate) ??
    ageFromDateMaybe(details?.dob ?? a?.dob);
  if (byDate !== null) return byDate;

  return null;
}

function normalizeMaritalStatus(v) {
  return safeStr(v).toLowerCase();
}

function pickFullName(app, details) {
  const a = app && typeof app === 'object' ? app : {};
  const d = details && typeof details === 'object' ? details : {};
  return pickFirstNonEmptyStr(
    a?.fullName,
    d?.fullName,
    // Backward/alternate keys
    a?.adSoyad,
    d?.adSoyad,
    a?.ad_soyad,
    d?.ad_soyad,
    a?.isimSoyisim,
    d?.isimSoyisim,
    a?.nameSurname,
    d?.nameSurname,
    a?.full_name,
    d?.full_name,
    a?.name
  );
}

function pickCity(app, details) {
  const a = app && typeof app === 'object' ? app : {};
  const d = details && typeof details === 'object' ? details : {};
  return pickFirstNonEmptyStr(
    a?.city,
    d?.city,
    // Backward/alternate keys
    a?.sehir,
    d?.sehir,
    a?.şehir,
    d?.şehir,
    a?.il,
    d?.il,
    a?.cityName,
    d?.cityName
  );
}

function pickCountry(app, details) {
  const a = app && typeof app === 'object' ? app : {};
  const d = details && typeof details === 'object' ? details : {};
  return pickFirstNonEmptyStr(
    a?.country,
    d?.country,
    // Backward/alternate keys
    a?.ulke,
    d?.ulke,
    a?.ülke,
    d?.ülke,
    a?.countryName,
    d?.countryName,
    a?.yasadigiUlke,
    d?.yasadigiUlke
  );
}

function pickNationality(app, details) {
  const a = app && typeof app === 'object' ? app : {};
  const d = details && typeof details === 'object' ? details : {};
  return pickFirstNonEmptyStr(
    a?.nationality,
    d?.nationality,
    // Backward/alternate keys
    a?.uyruk,
    d?.uyruk,
    a?.milliyet,
    d?.milliyet,
    a?.vatandaslik,
    d?.vatandaslik,
    a?.vatandaşlık,
    d?.vatandaşlık
  );
}

function pickOccupation(details, app) {
  const d = details && typeof details === 'object' ? details : {};
  const a = app && typeof app === 'object' ? app : {};
  return (
    safeStr(d?.occupationTr) ||
    safeStr(d?.occupation) ||
    safeStr(d?.occupationId) ||
    safeStr(a?.occupation) ||
    // Backward/alternate keys
    safeStr(d?.job) ||
    safeStr(d?.jobTitle) ||
    safeStr(d?.profession) ||
    safeStr(a?.job) ||
    safeStr(a?.jobTitle) ||
    safeStr(a?.profession) ||
    ''
  );
}

function pickMaritalStatus(details, app) {
  const d = details && typeof details === 'object' ? details : {};
  const a = app && typeof app === 'object' ? app : {};
  return (
    safeStr(d?.maritalStatus) ||
    safeStr(a?.maritalStatus) ||
    // Backward/alternate keys
    safeStr(d?.marital) ||
    safeStr(a?.marital) ||
    safeStr(d?.medeniDurum) ||
    safeStr(a?.medeniDurum) ||
    safeStr(d?.marital_status) ||
    safeStr(a?.marital_status) ||
    ''
  );
}

function pickHasChildren(details, app) {
  const d = details && typeof details === 'object' ? details : {};
  const a = app && typeof app === 'object' ? app : {};

  const raw =
    safeStr(d?.hasChildren) ||
    safeStr(a?.hasChildren) ||
    // Backward/alternate keys
    safeStr(d?.children) ||
    safeStr(a?.children) ||
    safeStr(d?.childStatus) ||
    safeStr(a?.childStatus) ||
    safeStr(d?.has_children) ||
    safeStr(a?.has_children);
  if (raw) return raw;

  if (typeof d?.hasChildren === 'boolean') return d.hasChildren ? 'yes' : 'no';
  if (typeof a?.hasChildren === 'boolean') return a.hasChildren ? 'yes' : 'no';

  return '';
}

function pickChildrenCount(details, app) {
  const d = details && typeof details === 'object' ? details : {};
  const a = app && typeof app === 'object' ? app : {};
  const raw = d?.childrenCount ?? d?.childCount ?? d?.children_count ?? d?.child_count ?? a?.childrenCount ?? a?.childCount;
  const n = typeof raw === 'number' ? raw : Number(String(raw ?? '').trim());
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 0 || i > 20) return null;
  return i;
}

function isMinimumMatchmakingProfileCompleteFromApp(app) {
  return hasMinimumMatchmakingProfileInApplicationDoc(app);
}

function explainMinimumMatchmakingProfileMissing(app) {
  return getMinimumMatchmakingProfileMissingFromApp(app);
}

function isStubApplication(a) {
  return isStubMatchmakingApplication(a);
}

function pickBestSubmittedApplication(apps) {
  const list = Array.isArray(apps) ? apps : [];
  let best = null;
  let bestScore = -Infinity;

  for (const app of list) {
    if (!app || typeof app !== 'object' || isStubApplication(app)) continue;
    const ms =
      (typeof app?.updatedAtMs === 'number' && Number.isFinite(app.updatedAtMs) ? app.updatedAtMs : 0) ||
      (typeof app?.createdAtMs === 'number' && Number.isFinite(app.createdAtMs) ? app.createdAtMs : 0) ||
      0;
    const score = ms > 0 ? ms : 1;
    if (score > bestScore) {
      best = app;
      bestScore = score;
    }
  }

  return best;
}

function hasSubmittedMatchmakingProfileInUserDoc(userDoc) {
  const source = userDoc && typeof userDoc === 'object' ? userDoc : {};
  if (!hasAnyMatchmakingProfileInUserDoc(source)) return false;
  return hasMinimumMatchmakingProfileInUserDoc(source);
}

function isMembershipActive(userDoc, now = Date.now()) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > now;
}

function isIdentityVerified(userDoc) {
  if (userDoc?.identityVerified === true) return true;
  const st = String(userDoc?.identityVerification?.status || '').toLowerCase().trim();
  return st === 'verified' || st === 'approved';
}

function computeFreeActiveMembershipState(userDoc, now = Date.now()) {
  const fam = userDoc?.freeActiveMembership || null;
  const active = !!fam?.active;
  const blocked = !!fam?.blocked;
  const windowHours = typeof fam?.windowHours === 'number' ? fam.windowHours : 0;
  const lastActiveAtMs = typeof fam?.lastActiveAtMs === 'number' ? fam.lastActiveAtMs : 0;
  const expiresAtMs = active && windowHours > 0 && lastActiveAtMs > 0 ? lastActiveAtMs + windowHours * 3600000 : 0;
  const eligible = active && !blocked && expiresAtMs > now;
  return { active, blocked, windowHours, lastActiveAtMs, expiresAtMs, eligible };
}

function isDevBypassEnabled() {
  const raw = String(process.env.MATCHMAKING_DEV_BYPASS || '').toLowerCase().trim();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

function isInteractionMembershipOnlyEnabled() {
  // Varsayılan (ürün kararı): etkileşim başlatmak için aktif üyelik gerekir.
  // Geri almak için env'i açıkça 0/false/no yapın.
  const raw = String(process.env.MATCHMAKING_INTERACTION_REQUIRES_MEMBERSHIP || '').toLowerCase().trim();
  // 2026-01: Ürün akışı (havuz + bildirim) için etkileşimler varsayılan olarak serbest.
  // Üyelik zorunluluğu isteniyorsa bu env açıkça set edilmelidir.
  if (!raw) return false;
  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') return false;
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function isFreeActiveEnabled() {
  // Varsayılan: AÇIK (ürün kararı: kadınlarda ücretsiz aktif üyelik).
  // Sadece açıkça kapatmak için env'i 0/false/no/off/disabled yapın.
  const raw = String(process.env.MATCHMAKING_FREE_ACTIVE_ENABLED || '').toLowerCase().trim();
  const disabled = ['0', 'false', 'no', 'off', 'disabled'].includes(raw);
  return !disabled;
}

function ensureEligibleOrThrow(userDoc, gender) {
  // Local dev akışında üyelik kontrolünü bypass edebilmek için.
  // Prod’da kapalıdır; sadece dev-api script’i bu env’i set eder.
  if (isDevBypassEnabled()) return;

  // Opsiyonel ürün kuralı: etkileşim başlatmak için aktif üyelik zorunlu.
  // Varsayılan: kapalı (serbest). Açmak için MATCHMAKING_INTERACTION_REQUIRES_MEMBERSHIP=true.
  if (!isInteractionMembershipOnlyEnabled()) return;

  const member = isMembershipActive(userDoc);
  if (!member) {
    const err = new Error('membership_required');
    err.statusCode = 402;
    throw err;
  }
}

function ensureMembershipActiveOrThrow(userDoc) {
  if (isDevBypassEnabled()) return;

  const member = isMembershipActive(userDoc);
  if (!member) {
    const err = new Error('membership_required');
    err.statusCode = 402;
    throw err;
  }
}

async function ensureProfileCompleteOrThrow(db, uid) {
  const userId = safeStr(uid);
  if (!db || !userId) {
    const err = new Error('application_required');
    err.statusCode = 403;
    throw err;
  }

  const [apps, userSnap] = await Promise.all([
    fetchMatchmakingApplicationsByUid(db, userId, { limit: 10 }),
    db.collection('matchmakingUsers').doc(userId).get().catch(() => null),
  ]);

  const userDoc = userSnap?.exists ? (userSnap.data() || {}) : {};
  const submittedApp = pickBestSubmittedApplication(apps);
  if ((submittedApp && isMinimumMatchmakingProfileCompleteFromApp(submittedApp)) || hasSubmittedMatchmakingProfileInUserDoc(userDoc)) return;

  const err = new Error('application_required');
  err.statusCode = 403;
  throw err;
}

export {
  normalizeGender,
  oppositeGender,
  resolveLookingForGender,
  isMembershipActive,
  isIdentityVerified,
  computeFreeActiveMembershipState,
  ensureEligibleOrThrow,
  ensureMembershipActiveOrThrow,
  ensureProfileCompleteOrThrow,
  hasSubmittedMatchmakingProfileInUserDoc,
  isFreeActiveEnabled,
  isInteractionMembershipOnlyEnabled,
  pickBestSubmittedApplication,
};
