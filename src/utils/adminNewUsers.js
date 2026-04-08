function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function asObj(value) {
  return value && typeof value === 'object' ? value : null;
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    const s = safeStr(value);
    if (s) return s;
  }
  return '';
}

function pickFirstAge(...values) {
  for (const value of values) {
    const age = parseAge(value);
    if (age !== null) return age;
  }
  return null;
}

function parseAge(value) {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 18 || i > 99) return null;
  return i;
}

function normalizeGender(value) {
  const s = safeStr(value).toLowerCase();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function getAnyAbout(app) {
  const item = app && typeof app === 'object' ? app : null;
  if (!item) return '';

  const legacyBio = safeStr(item?.bio);
  if (legacyBio) return legacyBio;

  const direct = safeStr(item?.about) || safeStr(item?.aboutTr) || safeStr(item?.aboutId);
  if (direct) return direct;

  const details = item?.details && typeof item.details === 'object' ? item.details : null;
  const detailsAbout =
    safeStr(details?.about) ||
    safeStr(details?.bio) ||
    safeStr(details?.aboutTr) ||
    safeStr(details?.aboutId) ||
    safeStr(details?.bioTr) ||
    safeStr(details?.bioId);
  if (detailsAbout) return detailsAbout;

  const publicProfile = item?.publicProfile && typeof item.publicProfile === 'object' ? item.publicProfile : null;
  return (
    safeStr(publicProfile?.about) ||
    safeStr(publicProfile?.bio) ||
    safeStr(publicProfile?.aboutTr) ||
    safeStr(publicProfile?.aboutId) ||
    safeStr(publicProfile?.bioTr) ||
    safeStr(publicProfile?.bioId)
  );
}

function hasAnyPhotoRefs(item) {
  const source = asObj(item);
  if (!source) return false;

  const photoUrls = Array.isArray(source?.photoUrls) ? source.photoUrls : [];
  if (photoUrls.some((value) => safeStr(value))) return true;

  const photoPaths = Array.isArray(source?.photoPaths) ? source.photoPaths : [];
  if (photoPaths.some((value) => safeStr(value))) return true;

  return !!safeStr(source?.photoPath);
}

function buildUserProfileCache(userDoc) {
  const source = asObj(userDoc);
  if (!source) return null;

  const publicProfile = asObj(source?.publicProfile);
  const application = asObj(source?.application);
  const details = {
    ...((publicProfile?.details && typeof publicProfile.details === 'object' ? publicProfile.details : {}) || {}),
    ...((application?.details && typeof application.details === 'object' ? application.details : {}) || {}),
    ...((source?.details && typeof source.details === 'object' ? source.details : {}) || {}),
  };

  return {
    ...publicProfile,
    ...application,
    ...source,
    details,
    uid: pickFirstNonEmpty(source?.uid, source?.userId, application?.userId, publicProfile?.userId),
    username: pickFirstNonEmpty(source?.username, application?.username, publicProfile?.username),
    fullName: pickFirstNonEmpty(source?.fullName, application?.fullName, publicProfile?.fullName, source?.name, application?.name, publicProfile?.name),
    displayName: pickFirstNonEmpty(source?.displayName, application?.displayName, publicProfile?.displayName),
    authEmail: pickFirstNonEmpty(source?.authEmail, application?.authEmail, publicProfile?.authEmail),
    email: pickFirstNonEmpty(source?.email, application?.email, publicProfile?.email),
    userCode: pickFirstNonEmpty(source?.userCode, application?.userCode, publicProfile?.userCode),
    age: pickFirstAge(source?.age, application?.age, publicProfile?.age, details?.age),
    gender: normalizeGender(source?.gender) || normalizeGender(application?.gender) || normalizeGender(publicProfile?.gender) || normalizeGender(details?.gender),
    city: pickFirstNonEmpty(source?.city, application?.city, publicProfile?.city, details?.city, source?.sehir, application?.sehir, publicProfile?.sehir),
    country: pickFirstNonEmpty(source?.country, application?.country, publicProfile?.country, details?.country),
    nationality: pickFirstNonEmpty(source?.nationality, application?.nationality, publicProfile?.nationality, details?.nationality),
    whatsapp: pickFirstNonEmpty(source?.whatsapp, application?.whatsapp, publicProfile?.whatsapp, details?.whatsapp, source?.phone, application?.phone, publicProfile?.phone, details?.phone),
    lookingForGender:
      normalizeGender(source?.lookingForGender) ||
      normalizeGender(application?.lookingForGender) ||
      normalizeGender(publicProfile?.lookingForGender) ||
      normalizeGender(details?.lookingForGender),
    photoUrls: Array.isArray(source?.photoUrls)
      ? source.photoUrls
      : Array.isArray(application?.photoUrls)
        ? application.photoUrls
        : Array.isArray(publicProfile?.photoUrls)
          ? publicProfile.photoUrls
          : [],
    photoPaths: Array.isArray(source?.photoPaths)
      ? source.photoPaths
      : Array.isArray(application?.photoPaths)
        ? application.photoPaths
        : Array.isArray(publicProfile?.photoPaths)
          ? publicProfile.photoPaths
          : [],
    photoPath: pickFirstNonEmpty(source?.photoPath, application?.photoPath, publicProfile?.photoPath, details?.photoPath),
  };
}

function resolveAdminNewUserUid(app, userDoc = null) {
  const userProfile = buildUserProfileCache(userDoc);
  return pickFirstNonEmpty(app?.userId, app?.uid, app?.userUid, app?.ownerUid, userProfile?.uid);
}

function resolveAdminNewUserGender(app, userDoc = null) {
  const userProfile = buildUserProfileCache(userDoc);
  return (
    normalizeGender(app?.gender) ||
    normalizeGender(app?.details?.gender) ||
    normalizeGender(userProfile?.gender) ||
    normalizeGender(userProfile?.details?.gender)
  );
}

function hasExtendedProfileSignals(source) {
  const item = asObj(source);
  if (!item) return false;

  const details = asObj(item?.details) || {};
  let score = 0;

  if (getAnyAbout(item)) score += 1;
  if (pickFirstNonEmpty(item?.expectations, item?.expectationsTr, item?.expectationsId, details?.expectations, details?.expectationsTr, details?.expectationsId)) score += 1;
  if (pickFirstNonEmpty(item?.whatsapp, details?.whatsapp, item?.phone, details?.phone)) score += 1;
  if (pickFirstNonEmpty(item?.city, details?.city, item?.country, details?.country, item?.nationality, details?.nationality)) score += 1;
  if (normalizeGender(item?.lookingForGender || details?.lookingForGender)) score += 1;
  if (pickFirstNonEmpty(item?.occupation, details?.occupation, item?.job, details?.job, item?.instagram, details?.instagram)) score += 1;
  if (hasAnyPhotoRefs(item) || hasAnyPhotoRefs(details)) score += 1;

  return score >= 2;
}

function pickAccountDisplayName(app, userDoc) {
  const userProfile = buildUserProfileCache(userDoc);
  return safeStr(app?.displayName) || safeStr(userProfile?.displayName) || safeStr(userDoc?.displayName) || safeStr(userDoc?.publicProfile?.displayName) || '';
}

function pickAccountEmail(app, userDoc) {
  const userProfile = buildUserProfileCache(userDoc);
  return safeStr(app?.authEmail) || safeStr(app?.email) || safeStr(userProfile?.authEmail) || safeStr(userProfile?.email) || safeStr(userDoc?.authEmail) || safeStr(userDoc?.email) || '';
}

function hasKnownAccountIdentity(app, userDoc) {
  const userProfile = buildUserProfileCache(userDoc);
  return !!(
    safeStr(app?.username) ||
    safeStr(app?.fullName) ||
    safeStr(userProfile?.username) ||
    safeStr(userProfile?.fullName) ||
    safeStr(userDoc?.username) ||
    safeStr(userDoc?.fullName) ||
    safeStr(userDoc?.publicProfile?.fullName) ||
    pickAccountDisplayName(app, userDoc) ||
    pickAccountEmail(app, userDoc)
  );
}

function isStubApplication(app) {
  const source = safeStr(app?.source).toLowerCase();
  return source === 'auto_stub' || app?.details?.autoBootstrap === true;
}

function isCompletedApplication(app, userDoc = null) {
  const userProfile = buildUserProfileCache(userDoc);
  const sources = [app, userProfile].filter((item) => item && typeof item === 'object');

  for (const item of sources) {
    const details = asObj(item?.details) || {};
    const about = getAnyAbout(item);
    const expectations =
      safeStr(item?.expectations) ||
      safeStr(item?.expectationsTr) ||
      safeStr(item?.expectationsId) ||
      safeStr(details?.expectations) ||
      safeStr(details?.expectationsTr) ||
      safeStr(details?.expectationsId);
    const wroteOnceMs =
      typeof item?.profileTextWriteOnceUsedAtMs === 'number' && Number.isFinite(item.profileTextWriteOnceUsedAtMs)
        ? item.profileTextWriteOnceUsedAtMs
        : 0;
    const hasEditOnce = !!item?.userEditOnceUsedAt || wroteOnceMs > 0;

    if (hasEditOnce) return true;
    if (!!about && !!expectations) return true;
    if (hasCoreSignupProfile(item, userDoc) && hasExtendedProfileSignals(item)) return true;
  }

  return false;
}

function hasCoreSignupProfile(app, userDoc) {
  const userProfile = buildUserProfileCache(userDoc);
  const age =
    parseAge(app?.age) ??
    parseAge(app?.details?.age) ??
    parseAge(userProfile?.age) ??
    parseAge(userProfile?.details?.age) ??
    parseAge(userDoc?.age) ??
    parseAge(userDoc?.publicProfile?.age) ??
    parseAge(userDoc?.application?.age);

  const gender =
    normalizeGender(app?.gender) ||
    normalizeGender(app?.details?.gender) ||
    normalizeGender(userProfile?.gender) ||
    normalizeGender(userProfile?.details?.gender) ||
    normalizeGender(userDoc?.gender) ||
    normalizeGender(userDoc?.publicProfile?.gender) ||
    normalizeGender(userDoc?.application?.gender);

  return age !== null && !!gender;
}

function getAdminNewUserKind(app, userDoc) {
  if (!app || typeof app !== 'object') return 'unknown';
  const source = safeStr(app?.source).toLowerCase();
  if (!isStubApplication(app)) return 'filled';
  if (source === 'apply_submit' && isCompletedApplication(app, userDoc)) return 'filled';
  if (hasCoreSignupProfile(app, userDoc)) return 'partial';
  if (!hasKnownAccountIdentity(app, userDoc)) return 'unknown';
  return 'stub';
}

function isUnknownUserWithAccount(app, userDoc) {
  return getAdminNewUserKind(app, userDoc) === 'unknown';
}

function getCreatedAtMs(app) {
  if (typeof app?.createdAtMs === 'number' && Number.isFinite(app.createdAtMs)) return app.createdAtMs;
  const ts = app?.createdAt;
  if (ts && typeof ts.toMillis === 'function') {
    try {
      return ts.toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof ts?.seconds === 'number' && Number.isFinite(ts.seconds)) return ts.seconds * 1000;
  return 0;
}

function getRepresentativeScore(app, userDoc) {
  let score = 0;
  const kind = getAdminNewUserKind(app, userDoc);
  if (kind === 'filled') score += 1_000_000;
  else if (kind === 'partial') score += 700_000;
  else if (kind === 'stub') score += 300_000;
  else score += 100_000;
  if (hasKnownAccountIdentity(app, userDoc)) score += 100_000;
  if (typeof app?.age === 'number' && Number.isFinite(app.age)) score += 10_000;
  if (safeStr(app?.gender)) score += 5_000;
  if (safeStr(app?.userCode) || safeStr(userDoc?.userCode) || safeStr(userDoc?.publicProfile?.userCode)) score += 1_000;
  return score + Math.min(getCreatedAtMs(app), 999_999_999);
}

function isSyntheticTestUser(app, userDoc) {
  const emails = [pickAccountEmail(app, userDoc), safeStr(app?.authEmail), safeStr(app?.email)]
    .map((value) => value.toLowerCase())
    .filter(Boolean);

  if (emails.some((value) => value.endsWith('@example.test'))) return true;
  if (emails.some((value) => value.includes('mobile.signup.'))) return true;

  const labels = [
    safeStr(app?.username),
    safeStr(app?.fullName),
    safeStr(userDoc?.username),
    safeStr(userDoc?.fullName),
    pickAccountDisplayName(app, userDoc),
  ]
    .map((value) => value.toLowerCase())
    .filter(Boolean);

  return labels.some((value) => value.includes('mobile.signup.'));
}

function pickBetterApplication(current, candidate, currentUserDoc, candidateUserDoc) {
  if (!current) return candidate;

  const currentScore = getRepresentativeScore(current, currentUserDoc);
  const candidateScore = getRepresentativeScore(candidate, candidateUserDoc);
  if (candidateScore !== currentScore) return candidateScore > currentScore ? candidate : current;

  return getCreatedAtMs(candidate) > getCreatedAtMs(current) ? candidate : current;
}

function dedupeAdminNewUsers(items, userInfoByUid = {}) {
  const byKey = new Map();
  const list = Array.isArray(items) ? items : [];

  for (const item of list) {
    const uid = resolveAdminNewUserUid(item);
    const key = uid || `doc:${safeStr(item?.id)}`;
    const userDoc = uid ? userInfoByUid[uid] ?? null : null;

    if (isSyntheticTestUser(item, userDoc)) continue;

    const current = byKey.get(key);
    const currentUserDoc = current && uid ? userInfoByUid[uid] ?? null : null;
    byKey.set(key, pickBetterApplication(current, item, currentUserDoc, userDoc));
  }

  return Array.from(byKey.values()).sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
}

export {
  dedupeAdminNewUsers,
  getAnyAbout,
  getCreatedAtMs,
  hasKnownAccountIdentity,
  isCompletedApplication,
  getAdminNewUserKind,
  hasCoreSignupProfile,
  isStubApplication,
  isSyntheticTestUser,
  isUnknownUserWithAccount,
  pickAccountDisplayName,
  pickAccountEmail,
  resolveAdminNewUserGender,
  resolveAdminNewUserUid,
  safeStr,
};