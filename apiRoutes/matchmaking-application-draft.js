import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { normalizeGender, resolveLookingForGender } from './_matchmakingEligibility.js';
import { isStubMatchmakingApplication } from '../src/utils/matchmakingProfileCompletion.js';

function safeStr(value, maxLen = 0) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return maxLen > 0 && s.length > maxLen ? s.slice(0, maxLen) : s;
}

function asObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function toNumOrNull(value, { min = -Infinity, max = Infinity } = {}) {
  const raw = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(raw)) return null;
  const num = Math.trunc(raw);
  if (num < min || num > max) return null;
  return num;
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

function isAutoStubApplication(app) {
  return isStubMatchmakingApplication(app);
}

function pickBestStubApplication(items) {
  const list = Array.isArray(items) ? items : [];
  let best = null;
  let bestScore = -Infinity;

  for (const item of list) {
    if (!isAutoStubApplication(item)) continue;
    const createdAtMs =
      (typeof item?.updatedAtMs === 'number' && Number.isFinite(item.updatedAtMs) ? item.updatedAtMs : 0) ||
      (typeof item?.createdAtMs === 'number' && Number.isFinite(item.createdAtMs) ? item.createdAtMs : 0) ||
      tsToMs(item?.updatedAt) ||
      tsToMs(item?.createdAt);
    if (createdAtMs > bestScore) {
      bestScore = createdAtMs;
      best = item;
    }
  }

  return best;
}

const ALLOWED_PROGRESS_KEYS = new Set([
  'photo',
  'username',
  'fullName',
  'age',
  'city',
  'nationality',
  'gender',
  'whatsapp',
  'occupation',
  'maritalStatus',
  'hasChildren',
  'childrenCount',
  'childrenLivingSituation',
  'consent18Plus',
  'consentPrivacy',
  'consentTerms',
]);

function sanitizeProgressKeys(value) {
  const arr = Array.isArray(value) ? value : [];
  const out = [];
  for (const raw of arr) {
    const key = safeStr(raw, 40);
    if (!key || !ALLOWED_PROGRESS_KEYS.has(key) || out.includes(key)) continue;
    out.push(key);
  }
  return out;
}

function sanitizeProgress(progress) {
  const completedRequiredKeys = sanitizeProgressKeys(progress?.completedRequiredKeys);
  const missingRequiredKeys = sanitizeProgressKeys(progress?.missingRequiredKeys);
  const lastInputKey = safeStr(progress?.lastInputKey, 40);
  const firstMissingRequiredKey = safeStr(progress?.firstMissingRequiredKey, 40);
  const wizardStepRaw = Number(progress?.wizardStep);
  const wizardStep = Number.isInteger(wizardStepRaw) && wizardStepRaw >= 0 ? wizardStepRaw : 0;
  const totalRequiredCountRaw = Number(progress?.totalRequiredCount);
  const totalRequiredCount = Number.isInteger(totalRequiredCountRaw) && totalRequiredCountRaw >= 0 ? totalRequiredCountRaw : 0;
  const completedRequiredCountRaw = Number(progress?.completedRequiredCount);
  const completedRequiredCount =
    Number.isInteger(completedRequiredCountRaw) && completedRequiredCountRaw >= 0
      ? completedRequiredCountRaw
      : completedRequiredKeys.length;

  return {
    lastInputKey: ALLOWED_PROGRESS_KEYS.has(lastInputKey) ? lastInputKey : '',
    firstMissingRequiredKey: ALLOWED_PROGRESS_KEYS.has(firstMissingRequiredKey) ? firstMissingRequiredKey : '',
    completedRequiredKeys,
    missingRequiredKeys,
    completedRequiredCount,
    totalRequiredCount,
    photoComplete: progress?.photoComplete === true,
    wizardStep,
  };
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const decoded = await requireIdToken(req);
  const uid = safeStr(decoded?.uid, 128);
  if (!uid) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
    return;
  }

  const body = normalizeBody(req);
  const payload = asObj(body?.payload);
  const progress = sanitizeProgress(asObj(body?.progress));
  const details = {
    occupation: safeStr(payload?.occupation, 80),
    maritalStatus: safeStr(payload?.maritalStatus, 40),
    hasChildren: safeStr(payload?.hasChildren, 20),
    childrenCount: toNumOrNull(payload?.childrenCount, { min: 0, max: 20 }),
    childrenLivingSituation: safeStr(payload?.childrenLivingSituation, 40),
  };

  const topLevelUpdates = {
    username: safeStr(payload?.username, 60),
    usernameLower: safeStr(payload?.usernameLower, 80),
    fullName: safeStr(payload?.fullName, 120),
    age: toNumOrNull(payload?.age, { min: 18, max: 99 }),
    city: safeStr(payload?.city, 80),
    nationality: safeStr(payload?.nationality, 40),
    gender: normalizeGender(payload?.gender),
    whatsapp: safeStr(payload?.whatsapp, 60),
    consent18Plus: payload?.consent18Plus === true,
    consentPrivacy: payload?.consentPrivacy === true,
    consentTerms: payload?.consentTerms === true,
  };

  const hasAnyPayload = Object.values(topLevelUpdates).some((value) => {
    if (typeof value === 'string') return !!value;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'boolean') return value === true;
    return false;
  }) || Object.values(details).some((value) => {
    if (typeof value === 'string') return !!value;
    if (typeof value === 'number') return Number.isFinite(value);
    return false;
  });

  if (!hasAnyPayload && !progress.lastInputKey && !progress.firstMissingRequiredKey) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'empty_draft' }));
    return;
  }

  const { db, FieldValue } = getAdmin();
  const nowMs = Date.now();
  const userRef = db.collection('matchmakingUsers').doc(uid);

  const [userSnap, appsSnap] = await Promise.all([
    userRef.get(),
    db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get(),
  ]);

  const userDoc = userSnap.exists ? userSnap.data() || {} : {};
  const apps = Array.isArray(appsSnap?.docs) ? appsSnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) })) : [];
  const bestStub = pickBestStubApplication(apps);
  const applicationId = safeStr(bestStub?.id, 160) || `auto_${uid}`;
  const appRef = db.collection('matchmakingApplications').doc(applicationId);

  const existingSnap = await appRef.get();
  if (existingSnap.exists) {
    const ownerUid = safeStr(existingSnap.data()?.userId, 128);
    if (ownerUid && ownerUid !== uid) {
      res.statusCode = 409;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'username_taken' }));
      return;
    }
  }

  const gender = topLevelUpdates.gender;
  const mergePayload = {
    userId: uid,
    source: 'auto_stub',
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtMs: nowMs,
    draftUpdatedAt: FieldValue.serverTimestamp(),
    draftUpdatedAtMs: nowMs,
    draftProgress: progress,
    ...(topLevelUpdates.username ? { username: topLevelUpdates.username } : {}),
    ...(topLevelUpdates.usernameLower ? { usernameLower: topLevelUpdates.usernameLower } : {}),
    ...(topLevelUpdates.fullName ? { fullName: topLevelUpdates.fullName } : {}),
    ...(topLevelUpdates.age !== null ? { age: topLevelUpdates.age } : {}),
    ...(topLevelUpdates.city ? { city: topLevelUpdates.city } : {}),
    ...(topLevelUpdates.nationality ? { nationality: topLevelUpdates.nationality, country: topLevelUpdates.nationality } : {}),
    ...(gender ? { gender, lookingForGender: resolveLookingForGender(gender, '') } : {}),
    ...(topLevelUpdates.whatsapp ? { whatsapp: topLevelUpdates.whatsapp } : {}),
    ...(topLevelUpdates.consent18Plus ? { consent18Plus: true } : {}),
    ...(topLevelUpdates.consentPrivacy ? { consentPrivacy: true } : {}),
    ...(topLevelUpdates.consentTerms ? { consentTerms: true } : {}),
    details: {
      autoBootstrap: true,
      draftInProgress: true,
      ...(details.occupation ? { occupation: details.occupation } : {}),
      ...(details.maritalStatus ? { maritalStatus: details.maritalStatus } : {}),
      ...(details.hasChildren ? { hasChildren: details.hasChildren } : {}),
      ...(details.childrenCount !== null ? { childrenCount: details.childrenCount } : {}),
      ...(details.childrenLivingSituation ? { childrenLivingSituation: details.childrenLivingSituation } : {}),
    },
  };

  if (!existingSnap.exists) {
    mergePayload.createdAt = FieldValue.serverTimestamp();
    mergePayload.createdAtMs = nowMs;
    if (safeStr(userDoc?.authEmail, 160)) {
      mergePayload.authEmail = safeStr(userDoc.authEmail, 160);
      mergePayload.email = safeStr(userDoc.authEmail, 160);
    } else if (safeStr(userDoc?.email, 160)) {
      mergePayload.authEmail = safeStr(userDoc.email, 160);
      mergePayload.email = safeStr(userDoc.email, 160);
    }
    if (safeStr(userDoc?.displayName, 160)) mergePayload.displayName = safeStr(userDoc.displayName, 160);
  }

  await appRef.set(mergePayload, { merge: true });

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, applicationId, updatedAtMs: nowMs }));
}