import fs from 'node:fs';
import path from 'node:path';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
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
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return '';
  return String(next).trim();
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
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

function buildActivationProfile(app, userDoc) {
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
  const finalPhotoCount = [userData?.photoUrls, userApplication?.photoUrls, publicProfile?.photoUrls, appData?.photoUrls]
    .map((value) => countPhotos(value))
    .reduce((best, value) => Math.max(best, value), 0);

  return {
    username: pickFirstNonEmpty(appData?.username, userApplication?.username, publicProfile?.username, userData?.username),
    fullName: pickFirstNonEmpty(appData?.fullName, userApplication?.fullName, publicProfile?.fullName, userData?.fullName, userData?.displayName),
    age: toIntInRange(appData?.age ?? userApplication?.age ?? publicProfile?.age ?? userData?.age ?? details?.age, { min: 18, max: 99 }),
    city: pickFirstNonEmpty(appData?.city, userApplication?.city, publicProfile?.city, userData?.city, details?.city),
    nationality: pickFirstNonEmpty(appData?.nationality, userApplication?.nationality, publicProfile?.nationality, userData?.nationality, appData?.country, userApplication?.country, publicProfile?.country, userData?.country, details?.nationality, details?.country),
    gender:
      normalizeGender(appData?.gender) ||
      normalizeGender(userApplication?.gender) ||
      normalizeGender(publicProfile?.gender) ||
      normalizeGender(userData?.gender) ||
      normalizeGender(details?.gender),
    whatsapp: pickFirstNonEmpty(appData?.whatsapp, userApplication?.whatsapp, publicProfile?.whatsapp, userData?.whatsapp, details?.whatsapp, appData?.phone, userApplication?.phone, userData?.phone),
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

function shouldNormalizeStub(app, userDoc) {
  const source = safeStr(app?.source).toLowerCase();
  const isStub = source === 'auto_stub' || app?.details?.autoBootstrap === true;
  if (!isStub) return false;

  const profile = buildActivationProfile(app, userDoc);
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

function countPhotos(v) {
  return Array.isArray(v) ? v.filter((item) => typeof item === 'string' && item.trim()).length : 0;
}

function toMs(tsLike) {
  try {
    if (!tsLike) return 0;
    if (typeof tsLike?.toMillis === 'function') return tsLike.toMillis() || 0;
    const seconds = tsLike?._seconds ?? tsLike?.seconds;
    const nanoseconds = tsLike?._nanoseconds ?? tsLike?.nanoseconds;
    if (typeof seconds === 'number' && Number.isFinite(seconds)) {
      const n = typeof nanoseconds === 'number' && Number.isFinite(nanoseconds) ? nanoseconds : 0;
      return Math.floor(seconds * 1000 + n / 1e6);
    }
    return 0;
  } catch {
    return 0;
  }
}

loadEnvLocal();

const userCode = safeStr(argValue('--userCode'));
const applyFix = hasFlag('--applyFix');
if (!userCode) {
  console.log('Kullanim: node scripts/admin-usercode-lookup.mjs --userCode UC-1119 [--applyFix]');
  process.exit(1);
}

const { db, FieldValue } = getAdmin();

const userSnap = await db.collection('matchmakingUsers').where('userCode', '==', userCode).limit(5).get();
const users = userSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));

const results = [];
for (const user of users) {
  const uid = safeStr(user?.id);
  const appsSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(20).get();
  const apps = appsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() || {}),
    updatedAtMsResolved:
      (typeof doc.data()?.updatedAtMs === 'number' && Number.isFinite(doc.data().updatedAtMs) ? doc.data().updatedAtMs : 0) ||
      (typeof doc.data()?.createdAtMs === 'number' && Number.isFinite(doc.data().createdAtMs) ? doc.data().createdAtMs : 0) ||
      toMs(doc.data()?.updatedAt) ||
      toMs(doc.data()?.createdAt),
  }));
  apps.sort((a, b) => b.updatedAtMsResolved - a.updatedAtMsResolved);

  const normalizedAppIds = [];
  if (applyFix) {
    for (const app of apps) {
      if (!shouldNormalizeStub(app, user)) continue;
      const appRef = db.collection('matchmakingApplications').doc(app.id);
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
            updatedAtMs: Date.now(),
          },
          { merge: true }
        ),
        userRef.set(
          {
            applicationId: app.id,
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
      normalizedAppIds.push(app.id);
    }
  }

  const refreshedUserSnap = applyFix ? await db.collection('matchmakingUsers').doc(uid).get() : null;
  const effectiveUser = refreshedUserSnap?.exists ? (refreshedUserSnap.data() || {}) : user;
  const refreshedAppsSnap = applyFix ? await db.collection('matchmakingApplications').where('userId', '==', uid).limit(20).get() : null;
  const effectiveApps = refreshedAppsSnap
    ? refreshedAppsSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() || {}),
        updatedAtMsResolved:
          (typeof doc.data()?.updatedAtMs === 'number' && Number.isFinite(doc.data().updatedAtMs) ? doc.data().updatedAtMs : 0) ||
          (typeof doc.data()?.createdAtMs === 'number' && Number.isFinite(doc.data().createdAtMs) ? doc.data().createdAtMs : 0) ||
          toMs(doc.data()?.updatedAt) ||
          toMs(doc.data()?.createdAt),
      }))
    : apps;
  effectiveApps.sort((a, b) => b.updatedAtMsResolved - a.updatedAtMsResolved);

  results.push({
    uid,
    userCode: safeStr(effectiveUser?.userCode),
    applicationId: safeStr(effectiveUser?.applicationId),
    fullName: safeStr(effectiveUser?.fullName) || safeStr(effectiveUser?.publicProfile?.fullName),
    photoUrlsCount: countPhotos(effectiveUser?.photoUrls),
    applicationCachePhotoUrlsCount: countPhotos(effectiveUser?.application?.photoUrls),
    publicProfilePhotoUrlsCount: countPhotos(effectiveUser?.publicProfile?.photoUrls),
    deferredPhotoRequiredForInteraction: effectiveUser?.deferredPhotoRequiredForInteraction ?? null,
    photoModeration: effectiveUser?.photoModeration || null,
    normalizedAppIds,
    apps: effectiveApps.map((app) => ({
      id: app.id,
      source: safeStr(app?.source),
      status: safeStr(app?.status),
      userCode: safeStr(app?.userCode),
      profileCode: safeStr(app?.profileCode),
      photoUrlsCount: countPhotos(app?.photoUrls),
      deferredPhotoRequiredForInteraction: app?.deferredPhotoRequiredForInteraction ?? null,
      photoModeration: app?.photoModeration || null,
      draftProgress: app?.draftProgress || null,
      updatedAtMsResolved: app.updatedAtMsResolved,
    })),
  });
}

console.log(JSON.stringify({ ok: true, userCode, count: results.length, results }, null, 2));