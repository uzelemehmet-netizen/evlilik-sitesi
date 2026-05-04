function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function toNumOrNull(v, { min, max } = {}) {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  if (typeof min === 'number' && n < min) return null;
  if (typeof max === 'number' && n > max) return null;
  return n;
}

function asBool(v) {
  return v === true;
}

function normalizeMaritalStatus(raw) {
  const value = safeStr(raw).toLowerCase();
  if (!value) return '';
  if (value === 'single' || value === 'widowed' || value === 'divorced' || value === 'other' || value === 'doesnt_matter') {
    return value;
  }
  return '';
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
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 18 && age <= 99 ? age : null;
}

function getAgeFromAppOrUser(app, userDoc) {
  const directAge = toNumOrNull(app?.age, { min: 18, max: 99 });
  if (directAge !== null) return directAge;

  const appDetails = app?.details && typeof app.details === 'object' ? app.details : {};
  const userDetails = userDoc?.details && typeof userDoc.details === 'object' ? userDoc.details : {};

  const nestedAge =
    toNumOrNull(appDetails?.age, { min: 18, max: 99 }) ??
    toNumOrNull(userDetails?.age, { min: 18, max: 99 }) ??
    toNumOrNull(userDoc?.age, { min: 18, max: 99 });
  if (nestedAge !== null) return nestedAge;

  const birthYear =
    appDetails?.birthYear ??
    app?.birthYear ??
    userDetails?.birthYear ??
    userDoc?.birthYear;
  const byYear = ageFromBirthYearMaybe(birthYear);
  if (byYear !== null) return byYear;

  return (
    ageFromDateMaybe(appDetails?.birthDateMs ?? app?.birthDateMs ?? userDetails?.birthDateMs ?? userDoc?.birthDateMs) ??
    ageFromDateMaybe(appDetails?.birthDate ?? app?.birthDate ?? userDetails?.birthDate ?? userDoc?.birthDate) ??
    ageFromDateMaybe(appDetails?.dob ?? app?.dob ?? userDetails?.dob ?? userDoc?.dob)
  );
}

function getPhotoCountFromAppOrUser(app, userDoc) {
  const sources = [app?.photoUrls, userDoc?.publicProfile?.photoUrls, userDoc?.photoUrls];
  for (const source of sources) {
    if (Array.isArray(source)) {
      const count = source.map((item) => safeStr(item)).filter(Boolean).length;
      if (count > 0) return count;
    }
  }

  if (safeStr(app?.photoUrl) || safeStr(userDoc?.publicProfile?.photoUrl) || safeStr(userDoc?.photoUrl)) return 1;
  return 0;
}

function isIdentityVerifiedUserDoc(userDoc) {
  if (userDoc?.identityVerified === true) return true;
  const status = safeStr(userDoc?.identityVerification?.status).toLowerCase();
  return status === 'approved' || status === 'verified';
}

function getMaritalStatusFromAppOrUser(app, userDoc) {
  return normalizeMaritalStatus(
    app?.details?.maritalStatus ||
      app?.maritalStatus ||
      userDoc?.details?.maritalStatus ||
      userDoc?.maritalStatus ||
      userDoc?.application?.details?.maritalStatus
  );
}

function normalizeInteractionFilter(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const ageMin = toNumOrNull(source?.ageMin, { min: 18, max: 99 });
  const ageMax = toNumOrNull(source?.ageMax, { min: 18, max: 99 });
  const normalizedStatuses = Array.isArray(source?.allowedMaritalStatuses)
    ? Array.from(new Set(source.allowedMaritalStatuses.map((item) => normalizeMaritalStatus(item)).filter(Boolean)))
    : [];

  const filter = {
    requireVerified: asBool(source?.requireVerified),
    requirePhoto: asBool(source?.requirePhoto),
    ageMin,
    ageMax,
    allowedMaritalStatuses: normalizedStatuses,
  };

  if (filter.ageMin !== null && filter.ageMax !== null && filter.ageMax < filter.ageMin) {
    filter.ageMax = filter.ageMin;
  }

  return filter;
}

function getInteractionFilterFromUserDoc(userDoc) {
  return normalizeInteractionFilter(userDoc?.interactionFilter);
}

function isInteractionFilterActive(filter) {
  const current = normalizeInteractionFilter(filter);
  return !!(
    current.requireVerified ||
    current.requirePhoto ||
    current.ageMin !== null ||
    current.ageMax !== null ||
    current.allowedMaritalStatuses.length > 0
  );
}

function ensureRequesterAllowedByTargetInteractionFilter({ targetUserDoc, requesterUserDoc, requesterApp }) {
  const filter = getInteractionFilterFromUserDoc(targetUserDoc);
  if (!isInteractionFilterActive(filter)) return { ok: true, filter };

  if (filter.requireVerified && !isIdentityVerifiedUserDoc(requesterUserDoc)) {
    return { ok: false, reason: 'interaction_filter_verified_required', filter };
  }

  if (filter.requirePhoto && getPhotoCountFromAppOrUser(requesterApp, requesterUserDoc) <= 0) {
    return { ok: false, reason: 'interaction_filter_photo_required', filter };
  }

  if (filter.ageMin !== null || filter.ageMax !== null) {
    const requesterAge = getAgeFromAppOrUser(requesterApp, requesterUserDoc);
    if (requesterAge === null) return { ok: false, reason: 'interaction_filter_age_required', filter };
    if ((filter.ageMin !== null && requesterAge < filter.ageMin) || (filter.ageMax !== null && requesterAge > filter.ageMax)) {
      return { ok: false, reason: 'interaction_filter_age_blocked', filter };
    }
  }

  if (filter.allowedMaritalStatuses.length) {
    const maritalStatus = getMaritalStatusFromAppOrUser(requesterApp, requesterUserDoc);
    if (!maritalStatus || !filter.allowedMaritalStatuses.includes(maritalStatus)) {
      return { ok: false, reason: 'interaction_filter_marital_status_blocked', filter };
    }
  }

  return { ok: true, filter };
}

export {
  ensureRequesterAllowedByTargetInteractionFilter,
  getInteractionFilterFromUserDoc,
  isInteractionFilterActive,
  normalizeInteractionFilter,
};