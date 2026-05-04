function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function asObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function toIntInRange(value, { min = -Infinity, max = Infinity } = {}) {
  const raw = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(raw)) return null;
  const normalized = Math.trunc(raw);
  if (normalized < min || normalized > max) return null;
  return normalized;
}

function normalizeGender(value) {
  const normalized = safeStr(value).toLowerCase();
  if (normalized === 'male' || normalized === 'm' || normalized === 'man' || normalized === 'erkek') return 'male';
  if (normalized === 'female' || normalized === 'f' || normalized === 'woman' || normalized === 'kadin' || normalized === 'kadın') return 'female';
  return '';
}

function normalizeBool(value) {
  if (value === true) return true;
  const normalized = safeStr(value).toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'evet';
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    const normalized = safeStr(value);
    if (normalized) return normalized;
  }
  return '';
}

function normalizeKeyList(value) {
  const list = Array.isArray(value) ? value : [];
  const out = [];
  for (const raw of list) {
    const key = safeStr(raw);
    if (!key || out.includes(key)) continue;
    out.push(key);
  }
  return out;
}

function countPhotos(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()).length : 0;
}

function buildActivationProfile(app, userDoc, finalPhotoUrls = null) {
  const appData = asObj(app);
  const appDetails = asObj(appData?.details);
  const userData = asObj(userDoc);
  const userApplication = asObj(userData?.application);
  const userApplicationDetails = asObj(userApplication?.details);
  const publicProfile = asObj(userData?.publicProfile);
  const publicProfileDetails = asObj(publicProfile?.details);
  const userDetails = asObj(userData?.details);

  const details = {
    ...publicProfileDetails,
    ...userApplicationDetails,
    ...userDetails,
    ...appDetails,
  };

  const finalPhotoCount = Array.isArray(finalPhotoUrls)
    ? countPhotos(finalPhotoUrls)
    : [appData?.photoUrls, userApplication?.photoUrls, publicProfile?.photoUrls, userData?.photoUrls]
        .map((value) => countPhotos(value))
        .reduce((best, value) => Math.max(best, value), 0);

  return {
    username: pickFirstNonEmpty(appData?.username, userApplication?.username, publicProfile?.username, userData?.username),
    fullName: pickFirstNonEmpty(appData?.fullName, userApplication?.fullName, publicProfile?.fullName, userData?.fullName, userData?.displayName),
    age: toIntInRange(appData?.age ?? userApplication?.age ?? publicProfile?.age ?? userData?.age ?? details?.age, { min: 18, max: 99 }),
    city: pickFirstNonEmpty(appData?.city, userApplication?.city, publicProfile?.city, userData?.city, details?.city),
    nationality: pickFirstNonEmpty(
      appData?.nationality,
      userApplication?.nationality,
      publicProfile?.nationality,
      userData?.nationality,
      appData?.country,
      userApplication?.country,
      publicProfile?.country,
      userData?.country,
      details?.nationality,
      details?.country
    ),
    gender:
      normalizeGender(appData?.gender) ||
      normalizeGender(userApplication?.gender) ||
      normalizeGender(publicProfile?.gender) ||
      normalizeGender(userData?.gender) ||
      normalizeGender(details?.gender),
    whatsapp: pickFirstNonEmpty(
      appData?.whatsapp,
      userApplication?.whatsapp,
      publicProfile?.whatsapp,
      userData?.whatsapp,
      details?.whatsapp,
      appData?.phone,
      userApplication?.phone,
      userData?.phone
    ),
    occupation: pickFirstNonEmpty(details?.occupation, details?.occupationTr, appData?.occupation, userApplication?.occupation, publicProfile?.occupation, userData?.occupation),
    maritalStatus: pickFirstNonEmpty(details?.maritalStatus, appData?.maritalStatus, userApplication?.maritalStatus, publicProfile?.maritalStatus, userData?.maritalStatus),
    hasChildren: pickFirstNonEmpty(details?.hasChildren, appData?.hasChildren, userApplication?.hasChildren, userData?.hasChildren).toLowerCase(),
    childrenCount: toIntInRange(
      details?.childrenCount ?? appData?.childrenCount ?? userApplication?.childrenCount ?? userData?.childrenCount,
      { min: 0, max: 20 }
    ),
    childrenLivingSituation: pickFirstNonEmpty(
      details?.childrenLivingSituation,
      appData?.childrenLivingSituation,
      userApplication?.childrenLivingSituation,
      userData?.childrenLivingSituation
    ),
    consent18Plus: normalizeBool(appData?.consent18Plus) || normalizeBool(userApplication?.consent18Plus) || normalizeBool(userData?.consent18Plus),
    consentPrivacy: normalizeBool(appData?.consentPrivacy) || normalizeBool(userApplication?.consentPrivacy) || normalizeBool(userData?.consentPrivacy),
    consentTerms: normalizeBool(appData?.consentTerms) || normalizeBool(userApplication?.consentTerms) || normalizeBool(userData?.consentTerms),
    finalPhotoCount,
    missingDraftKeys: normalizeKeyList(appData?.draftProgress?.missingRequiredKeys),
  };
}

export function shouldPromoteStubApplication(app, userDoc, finalPhotoUrls = null) {
  const source = safeStr(app?.source).toLowerCase();
  const isStub = source === 'auto_stub' || app?.details?.autoBootstrap === true;
  if (!isStub) return false;

  const profile = buildActivationProfile(app, userDoc, finalPhotoUrls);
  if (profile.finalPhotoCount < 1) return false;
  if (profile.missingDraftKeys.length > 0 && profile.missingDraftKeys.some((key) => key !== 'photo')) return false;

  const hasBaseFields =
    !!profile.username &&
    !!profile.fullName &&
    profile.age !== null &&
    !!profile.city &&
    !!profile.nationality &&
    !!profile.gender &&
    !!profile.whatsapp &&
    !!profile.occupation &&
    !!profile.maritalStatus &&
    profile.consent18Plus &&
    profile.consentPrivacy &&
    profile.consentTerms;
  if (!hasBaseFields) return false;

  const normalizedMaritalStatus = safeStr(profile.maritalStatus).toLowerCase();
  const requiresChildrenInfo = normalizedMaritalStatus === 'widowed' || normalizedMaritalStatus === 'divorced';
  if (!requiresChildrenInfo) return true;
  if (!profile.hasChildren) return false;
  if (profile.hasChildren !== 'yes') return true;
  return profile.childrenCount !== null && !!profile.childrenLivingSituation;
}

export async function normalizeCompletedStubApplication({ db, FieldValue, uid, applicationId, app, userDoc, finalPhotoUrls = null }) {
  if (!db || !FieldValue || !uid || !applicationId || !app || !userDoc) {
    return { ok: false, normalized: false, reason: 'bad_input' };
  }

  if (!shouldPromoteStubApplication(app, userDoc, finalPhotoUrls)) {
    return { ok: true, normalized: false, reason: 'not_completed' };
  }

  const nowMs = Date.now();
  const appRef = db.collection('matchmakingApplications').doc(applicationId);
  const userRef = db.collection('matchmakingUsers').doc(uid);

  await Promise.all([
    appRef.set(
      {
        source: 'apply_submit',
        draftProgress: FieldValue.delete(),
        draftUpdatedAt: FieldValue.delete(),
        draftUpdatedAtMs: FieldValue.delete(),
        'details.autoBootstrap': FieldValue.delete(),
        'details.draftInProgress': FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
      },
      { merge: true }
    ),
    userRef.set(
      {
        applicationId,
        hasSubmittedProfile: true,
        applicationState: 'real',
        'application.source': 'apply_submit',
        'application.details.autoBootstrap': FieldValue.delete(),
        'application.details.draftInProgress': FieldValue.delete(),
        'publicProfile.details.autoBootstrap': FieldValue.delete(),
        'publicProfile.details.draftInProgress': FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    ),
  ]);

  return { ok: true, normalized: true, applicationId };
}