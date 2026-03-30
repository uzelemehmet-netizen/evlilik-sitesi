function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function pickFirstNonEmptyStr(...values) {
  for (const value of values) {
    const normalized = safeStr(value);
    if (normalized) return normalized;
  }
  return '';
}

function toNumOrNull(value, { min = -Infinity, max = Infinity } = {}) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

function ageFromBirthYearMaybe(value) {
  const year = toNumOrNull(value, { min: 1900, max: 2100 });
  if (year === null) return null;
  const now = new Date();
  const age = now.getFullYear() - Math.trunc(year);
  return age >= 18 && age <= 99 ? age : null;
}

function ageFromDateMaybe(value) {
  let date = null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    date = new Date(value);
  } else if (typeof value === 'string') {
    const raw = value.trim();
    if (!raw) return null;
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) date = new Date(parsed);
  } else if (typeof value?.toDate === 'function') {
    try {
      date = value.toDate();
    } catch {
      date = null;
    }
  }

  if (!date || Number.isNaN(date.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) age -= 1;
  return age >= 18 && age <= 99 ? age : null;
}

function getAge(profile) {
  const source = profile && typeof profile === 'object' ? profile : {};
  const details = source?.details && typeof source.details === 'object' ? source.details : {};

  const direct = toNumOrNull(source?.age, { min: 18, max: 99 });
  if (direct !== null) return direct;

  const nested = toNumOrNull(details?.age, { min: 18, max: 99 });
  if (nested !== null) return nested;

  const fromYear = ageFromBirthYearMaybe(details?.birthYear ?? source?.birthYear);
  if (fromYear !== null) return fromYear;

  return (
    ageFromDateMaybe(details?.birthDateMs ?? source?.birthDateMs) ??
    ageFromDateMaybe(details?.birthDate ?? source?.birthDate) ??
    ageFromDateMaybe(details?.dob ?? source?.dob)
  );
}

function normalizeGender(value) {
  const normalized = safeStr(value).toLowerCase();
  if (normalized === 'male' || normalized === 'm' || normalized === 'man' || normalized === 'erkek') return 'male';
  if (normalized === 'female' || normalized === 'f' || normalized === 'woman' || normalized === 'kadin' || normalized === 'kadın') {
    return 'female';
  }
  return '';
}

function normalizeMaritalStatus(value) {
  return safeStr(value).toLowerCase();
}

function normalizeHasChildren(value) {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  const normalized = safeStr(value).toLowerCase();
  if (normalized === 'yes' || normalized === 'evet' || normalized === 'var') return 'yes';
  if (normalized === 'no' || normalized === 'hayir' || normalized === 'hayır' || normalized === 'yok') return 'no';
  return '';
}

function pickUsername(profile, details) {
  const source = profile && typeof profile === 'object' ? profile : {};
  const nested = details && typeof details === 'object' ? details : {};
  return pickFirstNonEmptyStr(
    source?.username,
    nested?.username,
    source?.usernameLower,
    nested?.usernameLower,
    source?.userName,
    nested?.userName,
    source?.nickname,
    nested?.nickname
  );
}

function pickFullName(profile, details) {
  const source = profile && typeof profile === 'object' ? profile : {};
  const nested = details && typeof details === 'object' ? details : {};
  return pickFirstNonEmptyStr(
    source?.fullName,
    nested?.fullName,
    source?.adSoyad,
    nested?.adSoyad,
    source?.ad_soyad,
    nested?.ad_soyad,
    source?.isimSoyisim,
    nested?.isimSoyisim,
    source?.nameSurname,
    nested?.nameSurname,
    source?.full_name,
    nested?.full_name,
    source?.name,
    nested?.name
  );
}

function pickCity(profile, details) {
  const source = profile && typeof profile === 'object' ? profile : {};
  const nested = details && typeof details === 'object' ? details : {};
  return pickFirstNonEmptyStr(
    source?.city,
    nested?.city,
    source?.sehir,
    nested?.sehir,
    source?.şehir,
    nested?.şehir,
    source?.il,
    nested?.il,
    source?.cityName,
    nested?.cityName
  );
}

function pickWhatsapp(profile, details) {
  const source = profile && typeof profile === 'object' ? profile : {};
  const nested = details && typeof details === 'object' ? details : {};
  return pickFirstNonEmptyStr(
    source?.whatsapp,
    nested?.whatsapp,
    source?.whatsappNumber,
    nested?.whatsappNumber,
    source?.phone,
    nested?.phone,
    source?.phoneNumber,
    nested?.phoneNumber,
    source?.mobile,
    nested?.mobile,
    source?.gsm,
    nested?.gsm,
    source?.telephone,
    nested?.telephone,
    source?.contactPhone,
    nested?.contactPhone
  );
}

function pickOccupation(details, profile) {
  const nested = details && typeof details === 'object' ? details : {};
  const source = profile && typeof profile === 'object' ? profile : {};
  return (
    safeStr(nested?.occupationTr) ||
    safeStr(nested?.occupation) ||
    safeStr(nested?.occupationId) ||
    safeStr(source?.occupation) ||
    safeStr(nested?.job) ||
    safeStr(nested?.jobTitle) ||
    safeStr(nested?.profession) ||
    safeStr(source?.job) ||
    safeStr(source?.jobTitle) ||
    safeStr(source?.profession) ||
    ''
  );
}

function pickMaritalStatus(details, profile) {
  const nested = details && typeof details === 'object' ? details : {};
  const source = profile && typeof profile === 'object' ? profile : {};
  return (
    safeStr(nested?.maritalStatus) ||
    safeStr(source?.maritalStatus) ||
    safeStr(nested?.marital) ||
    safeStr(source?.marital) ||
    safeStr(nested?.medeniDurum) ||
    safeStr(source?.medeniDurum) ||
    safeStr(nested?.marital_status) ||
    safeStr(source?.marital_status) ||
    ''
  );
}

function pickHasChildren(details, profile) {
  const nested = details && typeof details === 'object' ? details : {};
  const source = profile && typeof profile === 'object' ? profile : {};

  const candidates = [
    nested?.hasChildren,
    source?.hasChildren,
    nested?.children,
    source?.children,
    nested?.childStatus,
    source?.childStatus,
    nested?.has_children,
    source?.has_children,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeHasChildren(candidate);
    if (normalized) return normalized;
  }

  return '';
}

function pickChildrenCount(details, profile) {
  const nested = details && typeof details === 'object' ? details : {};
  const source = profile && typeof profile === 'object' ? profile : {};
  const raw =
    nested?.childrenCount ??
    nested?.childCount ??
    nested?.children_count ??
    nested?.child_count ??
    source?.childrenCount ??
    source?.childCount;

  const parsed = toNumOrNull(raw, { min: 0, max: 20 });
  return parsed === null ? null : Math.trunc(parsed);
}

function pickChildrenLivingSituation(details, profile) {
  const nested = details && typeof details === 'object' ? details : {};
  const source = profile && typeof profile === 'object' ? profile : {};
  return pickFirstNonEmptyStr(
    nested?.childrenLivingSituation,
    source?.childrenLivingSituation,
    nested?.childLivingSituation,
    source?.childLivingSituation,
    nested?.children_living_situation,
    source?.children_living_situation,
    nested?.childrenCustody,
    source?.childrenCustody
  );
}

function pushUniqueStrings(out, seen, value) {
  const normalized = safeStr(value);
  if (!normalized || seen.has(normalized)) return;
  seen.add(normalized);
  out.push(normalized);
}

function pickMatchmakingPhotoRefs(...sources) {
  const out = [];
  const seen = new Set();

  for (const source of sources) {
    if (!source) continue;

    if (Array.isArray(source)) {
      for (const value of source) pushUniqueStrings(out, seen, value);
      continue;
    }

    if (typeof source !== 'object') {
      pushUniqueStrings(out, seen, source);
      continue;
    }

    for (const key of ['photoUrls', 'photoPaths']) {
      if (Array.isArray(source?.[key])) {
        for (const value of source[key]) pushUniqueStrings(out, seen, value);
      }
    }

    for (const key of ['photoUrl', 'photoPath', 'profilePhotoUrl', 'avatarUrl']) {
      pushUniqueStrings(out, seen, source?.[key]);
    }
  }

  return out;
}

function isStubMatchmakingApplication(application) {
  const source = safeStr(application?.source).toLowerCase();
  if (source === 'auto_stub') return true;
  if (application?.details?.autoBootstrap === true) return true;
  return false;
}

function buildMergedUserProfile(userDoc) {
  const source = userDoc && typeof userDoc === 'object' ? userDoc : {};
  const application = source?.application && typeof source.application === 'object' ? source.application : {};
  const publicProfile = source?.publicProfile && typeof source.publicProfile === 'object' ? source.publicProfile : {};

  const details = {
    ...((publicProfile?.details && typeof publicProfile.details === 'object' ? publicProfile.details : {}) || {}),
    ...((application?.details && typeof application.details === 'object' ? application.details : {}) || {}),
    ...((source?.details && typeof source.details === 'object' ? source.details : {}) || {}),
  };

  const merged = {
    ...publicProfile,
    ...application,
    ...source,
    details,
  };

  merged.username = pickFirstNonEmptyStr(
    source?.username,
    application?.username,
    publicProfile?.username,
    source?.usernameLower,
    application?.usernameLower,
    publicProfile?.usernameLower
  );
  merged.fullName = pickFirstNonEmptyStr(source?.fullName, application?.fullName, publicProfile?.fullName, source?.name, application?.name, publicProfile?.name);
  merged.city = pickFirstNonEmptyStr(source?.city, application?.city, publicProfile?.city, source?.sehir, application?.sehir, publicProfile?.sehir);
  merged.whatsapp = pickFirstNonEmptyStr(
    source?.whatsapp,
    application?.whatsapp,
    publicProfile?.whatsapp,
    source?.phone,
    application?.phone,
    publicProfile?.phone
  );
  merged.photoUrls = pickMatchmakingPhotoRefs(source, application, publicProfile, details);

  return merged;
}

function getMinimumMatchmakingProfileMissingFromApp(application) {
  const source = application && typeof application === 'object' ? application : {};
  const details = source?.details && typeof source.details === 'object' ? source.details : {};
  const missing = [];

  if (!pickUsername(source, details)) missing.push('username');
  if (!pickFullName(source, details)) missing.push('fullName');
  if (getAge(source) === null) missing.push('age');
  if (!pickWhatsapp(source, details)) missing.push('whatsapp');
  if (!pickCity(source, details)) missing.push('city');
  if (!pickOccupation(details, source)) missing.push('occupation');

  const maritalStatus = normalizeMaritalStatus(pickMaritalStatus(details, source));
  if (!maritalStatus) missing.push('maritalStatus');

  const requiresChildrenInfo = maritalStatus === 'widowed' || maritalStatus === 'divorced';
  if (requiresChildrenInfo) {
    const hasChildren = pickHasChildren(details, source);
    if (!hasChildren) missing.push('hasChildren');

    if (hasChildren === 'yes') {
      const childrenCount = pickChildrenCount(details, source);
      if (childrenCount === null || childrenCount < 1 || childrenCount > 20) missing.push('childrenCount');
      if (!pickChildrenLivingSituation(details, source)) missing.push('childrenLivingSituation');
    }
  }

  if (!pickMatchmakingPhotoRefs(source, details).length) missing.push('photo');

  return missing;
}

function getMinimumMatchmakingProfileMissingFromUserDoc(userDoc) {
  return getMinimumMatchmakingProfileMissingFromApp(buildMergedUserProfile(userDoc));
}

function buildMatchmakingProfileGateState({ hasApplication, missing }) {
  const uniqueMissing = Array.from(new Set((Array.isArray(missing) ? missing : []).map((item) => safeStr(item)).filter(Boolean)));
  const photoMissing = uniqueMissing.includes('photo');
  const nonPhotoMissing = uniqueMissing.filter((item) => item !== 'photo');
  const isComplete = !!hasApplication && uniqueMissing.length === 0;

  let reason = 'profile_incomplete';
  if (isComplete) reason = 'complete';
  else if (!hasApplication) reason = 'application_required';
  else if (photoMissing && nonPhotoMissing.length === 0) reason = 'photo_required';

  return {
    hasApplication: !!hasApplication,
    isComplete,
    reason,
    missing: uniqueMissing,
    photoMissing,
    nonPhotoMissing,
    onlyPhotoMissing: !!hasApplication && photoMissing && nonPhotoMissing.length === 0,
  };
}

function getMatchmakingProfileGateStateFromApp(application) {
  if (!application || typeof application !== 'object' || isStubMatchmakingApplication(application)) {
    return buildMatchmakingProfileGateState({ hasApplication: false, missing: ['application'] });
  }

  return buildMatchmakingProfileGateState({
    hasApplication: true,
    missing: getMinimumMatchmakingProfileMissingFromApp(application),
  });
}

function hasMinimumMatchmakingProfileInApplicationDoc(application) {
  if (isStubMatchmakingApplication(application)) return false;
  return getMinimumMatchmakingProfileMissingFromApp(application).length === 0;
}

function hasMinimumMatchmakingProfileInUserDoc(userDoc) {
  return getMinimumMatchmakingProfileMissingFromUserDoc(userDoc).length === 0;
}

export {
  buildMatchmakingProfileGateState,
  getAge,
  getMatchmakingProfileGateStateFromApp,
  getMinimumMatchmakingProfileMissingFromApp,
  getMinimumMatchmakingProfileMissingFromUserDoc,
  hasMinimumMatchmakingProfileInApplicationDoc,
  hasMinimumMatchmakingProfileInUserDoc,
  isStubMatchmakingApplication,
  normalizeGender,
  normalizeHasChildren,
  normalizeMaritalStatus,
  pickMatchmakingPhotoRefs,
  safeStr,
  toNumOrNull,
};