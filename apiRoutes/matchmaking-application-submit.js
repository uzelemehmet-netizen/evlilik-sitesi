import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { detectPII } from './_pii.js';
import { isTranslateConfigured, translateTextProfile } from './_translate.js';
import { activateFreeMembershipForUid, isFreeMembershipDisabledByEnv } from './_membershipFree.js';

const MAX_TEXT_LEN = 1800;
const TRANSLATE_CHARS = 400;
const MIN_TRANSLATE_CHARS = 30;

function toNumOrNull(value, { min, max } = {}) {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (typeof min === 'number' && Number.isFinite(min) && i < min) return null;
  if (typeof max === 'number' && Number.isFinite(max) && i > max) return null;
  return i;
}

function asObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function safeStr(value, maxLen) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return typeof maxLen === 'number' && maxLen > 0 && s.length > maxLen ? s.slice(0, maxLen) : s;
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
  const source = safeStr(app?.source).toLowerCase();
  if (source === 'auto_stub') return true;
  if (app?.details?.autoBootstrap === true) return true;
  return false;
}

function appCreatedAtMs(app) {
  const ms = typeof app?.createdAtMs === 'number' && Number.isFinite(app.createdAtMs) ? app.createdAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(app?.createdAt);
  return ts > 0 ? ts : 0;
}

function pickBestNonStubApplication(apps) {
  const list = Array.isArray(apps) ? apps : [];
  let best = null;
  let bestScore = -Infinity;
  for (const a of list) {
    if (!a || typeof a !== 'object') continue;
    const created = appCreatedAtMs(a);
    const isStub = isAutoStubApplication(a);
    const score = (isStub ? 0 : 1000) + (created > 0 ? created : 0);
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

function normalizeProfileLang(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'tr' || s === 'id') return s;
  return '';
}

function oppositeLang(lang) {
  return lang === 'tr' ? 'id' : 'tr';
}

function detectForbiddenContactPII(text) {
  const pii = detectPII(text);
  const reasons = Array.isArray(pii?.reasons) ? pii.reasons : [];
  const forbidden = reasons.filter((r) => r && r !== 'name');
  return {
    hasForbidden: forbidden.length > 0,
    reasons: forbidden,
  };
}

async function buildBilingualText(text, sourceLang, opts = {}) {
  const maxLen = typeof opts?.maxLen === 'number' && Number.isFinite(opts.maxLen) ? opts.maxLen : MAX_TEXT_LEN;
  const translateChars =
    typeof opts?.translateChars === 'number' && Number.isFinite(opts.translateChars) ? opts.translateChars : TRANSLATE_CHARS;
  const minChars = typeof opts?.minChars === 'number' && Number.isFinite(opts.minChars) ? opts.minChars : MIN_TRANSLATE_CHARS;

  const original = safeStr(text, maxLen);
  const src = normalizeProfileLang(sourceLang) || 'tr';
  const target = oppositeLang(src);

  const out = {
    sourceLang: src,
    targetLang: target,
    original,
    tr: src === 'tr' ? original : '',
    id: src === 'id' ? original : '',
    translated: false,
    skipped: false,
    truncated: false,
    translateConfigured: isTranslateConfigured(),
  };

  if (!original) {
    out.skipped = true;
    return out;
  }

  if (original.length < minChars) {
    out.skipped = true;
    return out;
  }

  if (!out.translateConfigured) {
    out.skipped = true;
    return out;
  }

  const chunk = original.slice(0, translateChars);
  out.truncated = original.length > translateChars;

  const translated = await translateTextProfile({ text: chunk, targetLang: target });
  const finalText = out.truncated && translated ? `${translated}…` : translated;

  if (target === 'tr') out.tr = finalText;
  if (target === 'id') out.id = finalText;
  out.translated = !!safeStr(finalText);

  return out;
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const decoded = await requireIdToken(req);
  const uid = safeStr(decoded?.uid);
  if (!uid) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
    return;
  }

  const body = normalizeBody(req);
  const docId = safeStr(body?.docId, 120);
  const payload = body?.payload && typeof body.payload === 'object' ? body.payload : {};

  if (!docId) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
    return;
  }

  const sourceLang = normalizeProfileLang(payload?.lang) || 'tr';

  const about = safeStr(payload?.about, MAX_TEXT_LEN);
  const expectations = safeStr(payload?.expectations, MAX_TEXT_LEN);

  // PII: contact/banking/identity info completely forbidden.
  for (const [field, value] of [
    ['about', about],
    ['expectations', expectations],
  ]) {
    if (!value) continue;
    const pii = detectForbiddenContactPII(value);
    if (pii.hasForbidden) {
      res.statusCode = 422;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'profile_text_pii_blocked', field, reasons: pii.reasons }));
      return;
    }
  }

  const { db, FieldValue } = getAdmin();
  const nowMs = Date.now();

  const [meSnap, existingAppIdSnap, myAppsSnap] = await Promise.all([
    db.collection('matchmakingUsers').doc(uid).get(),
    db.collection('matchmakingApplications').doc(docId).get(),
    db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get(),
  ]);

  const me = meSnap.exists ? meSnap.data() || {} : {};

  if (me?.blocked) {
    res.statusCode = 403;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'blocked' }));
    return;
  }

  const myApps = Array.isArray(myAppsSnap?.docs) ? myAppsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) })) : [];
  const bestMyApp = pickBestNonStubApplication(myApps);

  let targetAppId = docId;
  let isUpdate = false;

  // If we update an existing application that was created by an older flow,
  // it may be missing createdAt/createdAtMs. Those docs become invisible in
  // queries that orderBy('createdAt'). We'll repair on update (best-effort).
  let existingTargetApp = null;

  if (existingAppIdSnap.exists) {
    const cur = existingAppIdSnap.data() || {};
    existingTargetApp = cur;
    const owner = safeStr(cur?.userId);
    if (owner && owner !== uid) {
      res.statusCode = 409;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'username_taken' }));
      return;
    }

    // Same docId exists and belongs to this user => update.
    targetAppId = docId;
    isUpdate = true;
  } else if (bestMyApp && safeStr(bestMyApp?.id)) {
    // User already has an application => update the best existing one.
    targetAppId = safeStr(bestMyApp.id);
    isUpdate = true;
    existingTargetApp = bestMyApp;
  }

  const existingCreatedAtMs = existingTargetApp ? appCreatedAtMs(existingTargetApp) : 0;
  const existingHasCreatedAt = !!(existingTargetApp && (existingTargetApp?.createdAt || existingTargetApp?.createdAtMs));
  const needsCreatedAtRepair = isUpdate && !existingHasCreatedAt;

  const detailsRaw = asObj(payload?.details);
  const detailsOccupation = safeStr(detailsRaw?.occupation, 160);
  const detailsEducationDepartment = safeStr(detailsRaw?.educationDepartment, 160);
  const detailsReligiousValues = safeStr(detailsRaw?.religiousValues, 300);
  const detailsCommunicationLanguageOther = safeStr(detailsRaw?.communicationLanguageOther, 120);
  const detailsNativeOther = safeStr(detailsRaw?.languages?.native?.other, 120);
  const detailsForeignOther = safeStr(detailsRaw?.languages?.foreign?.other, 120);

  const [aboutBi, expBi, occBi, eduDeptBi, relValBi, commOtherBi, nativeOtherBi, foreignOtherBi] = await Promise.all([
    buildBilingualText(about, sourceLang),
    buildBilingualText(expectations, sourceLang),
    buildBilingualText(detailsOccupation, sourceLang, { maxLen: 160, translateChars: 160, minChars: 1 }),
    buildBilingualText(detailsEducationDepartment, sourceLang, { maxLen: 160, translateChars: 160, minChars: 1 }),
    buildBilingualText(detailsReligiousValues, sourceLang, { maxLen: 300, translateChars: 240, minChars: 1 }),
    buildBilingualText(detailsCommunicationLanguageOther, sourceLang, { maxLen: 120, translateChars: 120, minChars: 1 }),
    buildBilingualText(detailsNativeOther, sourceLang, { maxLen: 120, translateChars: 120, minChars: 1 }),
    buildBilingualText(detailsForeignOther, sourceLang, { maxLen: 120, translateChars: 120, minChars: 1 }),
  ]);

  const detailsWithTranslations = {
    ...detailsRaw,
    // If this application originated as auto-stub, explicitly clear the stub marker on submit.
    autoBootstrap: false,
    ...(detailsOccupation
      ? {
          occupationTr: occBi.tr,
          occupationId: occBi.id,
        }
      : {}),
    ...(detailsEducationDepartment
      ? {
          educationDepartmentTr: eduDeptBi.tr,
          educationDepartmentId: eduDeptBi.id,
        }
      : {}),
    ...(detailsReligiousValues
      ? {
          religiousValuesTr: relValBi.tr,
          religiousValuesId: relValBi.id,
        }
      : {}),
    ...(detailsCommunicationLanguageOther
      ? {
          communicationLanguageOtherTr: commOtherBi.tr,
          communicationLanguageOtherId: commOtherBi.id,
        }
      : {}),
    ...(detailsNativeOther
      ? {
          nativeLanguageOtherTr: nativeOtherBi.tr,
          nativeLanguageOtherId: nativeOtherBi.id,
        }
      : {}),
    ...(detailsForeignOther
      ? {
          foreignLanguageOtherTr: foreignOtherBi.tr,
          foreignLanguageOtherId: foreignOtherBi.id,
        }
      : {}),
    profileDetailsTranslatedAtMs: nowMs,
  };

  const appRef = db.collection('matchmakingApplications').doc(targetAppId);
  const userRef = db.collection('matchmakingUsers').doc(uid);

  const coreUsername = safeStr(payload?.username, 60);
  const coreUsernameLower = safeStr(payload?.usernameLower, 80) || safeStr(docId, 120);
  const coreFullName = safeStr(payload?.fullName, 120);
  const coreAge = toNumOrNull(payload?.age, { min: 18, max: 99 });
  const coreCity = safeStr(payload?.city, 80);
  const coreCountry = safeStr(payload?.country, 80);
  const coreNationality = safeStr(payload?.nationality, 40);
  const coreGender = safeStr(payload?.gender, 30);
  const coreLookingForNationality = safeStr(payload?.lookingForNationality, 40);
  const coreLookingForGender = safeStr(payload?.lookingForGender, 30);
  const coreDetails = detailsWithTranslations;
  const corePartnerPreferences = asObj(payload?.partnerPreferences);
  const corePhotoUrls = Array.isArray(payload?.photoUrls)
    ? payload.photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 5)
    : [];
  const corePhotoPaths = Array.isArray(payload?.photoPaths)
    ? payload.photoPaths.filter((p) => typeof p === 'string' && p.trim()).slice(0, 5)
    : [];

  const appData = {
    ...(payload && typeof payload === 'object' ? payload : {}),

    // Server-authoritative: a real user submit should never stay as an auto-stub.
    source: 'apply_submit',

    // Ensure translated detail fields are stored server-side.
    details: coreDetails,

    // Server-authoritative fields
    userId: uid,
    ...(!isUpdate
      ? {
          createdAt: FieldValue.serverTimestamp(),
          createdAtMs: nowMs,
          status: 'new',
        }
      : needsCreatedAtRepair
        ? {
            createdAt: FieldValue.serverTimestamp(),
            createdAtMs: existingCreatedAtMs > 0 ? existingCreatedAtMs : nowMs,
          }
        : {}),
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtMs: nowMs,

    // Original texts
    about,
    expectations,
    profileTextLang: sourceLang,

    // Bilingual stored texts
    aboutTr: aboutBi.tr,
    aboutId: aboutBi.id,
    expectationsTr: expBi.tr,
    expectationsId: expBi.id,

    // Meta
    profileTextTranslatedAtMs: nowMs,
    profileTextTranslate: {
      about: {
        sourceLang: aboutBi.sourceLang,
        targetLang: aboutBi.targetLang,
        translated: aboutBi.translated,
        skipped: aboutBi.skipped,
        truncated: aboutBi.truncated,
        translateConfigured: aboutBi.translateConfigured,
      },
      expectations: {
        sourceLang: expBi.sourceLang,
        targetLang: expBi.targetLang,
        translated: expBi.translated,
        skipped: expBi.skipped,
        truncated: expBi.truncated,
        translateConfigured: expBi.translateConfigured,
      },
    },
  };

  // Ensure client cannot backdate pool timestamps / override consent flags etc.
  // Keep existing payload fields but set a few critical ones on server.
  appData.pool = {
    ...(payload?.pool && typeof payload.pool === 'object' ? payload.pool : {}),
    active: true,
    ...(isUpdate
      ? {}
      : {
          addedAt: FieldValue.serverTimestamp(),
          addedAtMs: nowMs,
        }),
    reason: 'apply_submit',
  };

  const batch = db.batch();
  if (isUpdate) {
    batch.set(appRef, appData, { merge: true });
  } else {
    batch.create(appRef, appData);
  }
  batch.set(
    userRef,
    {
      // Core fields for UI/admin screens (many places prefer matchmakingUsers cache).
      applicationId: targetAppId,
      ...(coreUsername ? { username: coreUsername } : {}),
      ...(coreUsernameLower ? { usernameLower: coreUsernameLower } : {}),
      ...(coreFullName ? { fullName: coreFullName } : {}),
      ...(typeof coreAge === 'number' ? { age: coreAge } : {}),
      ...(coreCity ? { city: coreCity } : {}),
      ...(coreCountry ? { country: coreCountry } : {}),
      ...(coreNationality ? { nationality: coreNationality } : {}),
      ...(coreGender ? { gender: coreGender } : {}),
      ...(coreLookingForNationality ? { lookingForNationality: coreLookingForNationality } : {}),
      ...(coreLookingForGender ? { lookingForGender: coreLookingForGender } : {}),

      // Cache application snapshot to avoid "unknown" when application fetch isn't available.
      application: {
        ...(coreUsername ? { username: coreUsername } : {}),
        ...(coreUsernameLower ? { usernameLower: coreUsernameLower } : {}),
        ...(coreFullName ? { fullName: coreFullName } : {}),
        ...(typeof coreAge === 'number' ? { age: coreAge } : {}),
        ...(coreCity ? { city: coreCity } : {}),
        ...(coreCountry ? { country: coreCountry } : {}),
        ...(coreNationality ? { nationality: coreNationality } : {}),
        ...(coreGender ? { gender: coreGender } : {}),
        ...(coreLookingForNationality ? { lookingForNationality: coreLookingForNationality } : {}),
        ...(coreLookingForGender ? { lookingForGender: coreLookingForGender } : {}),
        ...(corePhotoUrls.length ? { photoUrls: corePhotoUrls } : {}),
        ...(corePhotoPaths.length ? { photoPaths: corePhotoPaths } : {}),
        ...(Object.keys(coreDetails).length ? { details: coreDetails } : {}),
        ...(Object.keys(corePartnerPreferences).length ? { partnerPreferences: corePartnerPreferences } : {}),
        ...(payload?.profileNo !== undefined ? { profileNo: payload.profileNo } : {}),
        ...(payload?.profileCode ? { profileCode: safeStr(payload.profileCode, 80) } : {}),
      },

      details: {
        about,
        bio: about,
        expectations,
        aboutTr: aboutBi.tr,
        aboutId: aboutBi.id,
        expectationsTr: expBi.tr,
        expectationsId: expBi.id,
      },
      publicProfile: {
        ...(coreUsername ? { username: coreUsername } : {}),
        ...(coreUsernameLower ? { usernameLower: coreUsernameLower } : {}),
        ...(coreFullName ? { fullName: coreFullName } : {}),
        ...(typeof coreAge === 'number' ? { age: coreAge } : {}),
        ...(coreCity ? { city: coreCity } : {}),
        ...(coreCountry ? { country: coreCountry } : {}),
        ...(coreNationality ? { nationality: coreNationality } : {}),
        ...(coreGender ? { gender: coreGender } : {}),
        ...(coreLookingForNationality ? { lookingForNationality: coreLookingForNationality } : {}),
        ...(coreLookingForGender ? { lookingForGender: coreLookingForGender } : {}),
        ...(corePhotoUrls.length ? { photoUrls: corePhotoUrls } : {}),
        ...(corePhotoPaths.length ? { photoPaths: corePhotoPaths } : {}),
        about,
        expectations,
        aboutTr: aboutBi.tr,
        aboutId: aboutBi.id,
        expectationsTr: expBi.tr,
        expectationsId: expBi.id,
      },
      profileTextLang: sourceLang,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  // Yeni ürün kararı: Başvuru gönderilince üyelik otomatik aktif olsun.
  // Best-effort: başvuru zaten yazıldı; üyelik aktivasyonu başarısız olursa submit'i bozmayız.
  let membershipAutoActivated = false;
  let membershipStatus = null;
  let membershipValidUntilMs = null;
  try {
    if (!isFreeMembershipDisabledByEnv()) {
      const result = await activateFreeMembershipForUid({ db, FieldValue }, uid, Date.now());
      membershipAutoActivated = true;
      membershipStatus = result.status;
      membershipValidUntilMs = result.validUntilMs;
    }
  } catch {
    membershipAutoActivated = false;
    membershipStatus = 'error';
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      applicationId: targetAppId,
      updatedExisting: isUpdate,
      membershipAutoActivated,
      membershipStatus,
      membershipValidUntilMs,
      translated: {
        about: aboutBi.translated,
        expectations: expBi.translated,
      },
    })
  );
}
