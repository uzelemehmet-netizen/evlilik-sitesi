import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { emitMemberFeedEvent } from './_memberFeed.js';
import { ensureUserCodeAssigned } from './_matchmakingUserCode.js';
import { normalizeGender, resolveLookingForGender } from './_matchmakingEligibility.js';
import { buildBilingualProfileText, detectForbiddenContactPII, normalizeProfileLang } from './_matchmakingProfileText.js';

const MAX_TEXT_LEN = 1800;
function safeStr(value, maxLen) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function normalizeUsernameLower(value) {
  return safeStr(value, 80).toLowerCase();
}

function toNumOrNull(value, { min = -Infinity, max = Infinity } = {}) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

function toStringArray(value, { maxItems = 20, maxLen = 40 } = {}) {
  const arr = Array.isArray(value) ? value : [];
  const out = [];
  for (const v of arr) {
    const s = String(v ?? '').trim();
    if (!s) continue;
    if (s.length > maxLen) continue;
    out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

function includesStr(arr, v) {
  return Array.isArray(arr) && arr.includes(v);
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

function pickBestApplicationDoc(docs) {
  const list = Array.isArray(docs) ? docs : [];
  if (!list.length) return null;

  const scored = list
    .map((d) => {
      const cur = d?.data && typeof d.data === 'function' ? (d.data() || {}) : {};
      const source = String(cur?.source || '').trim().toLowerCase();
      const isStub = source === 'auto_stub';
      const ms =
        (typeof cur?.createdAtMs === 'number' && Number.isFinite(cur.createdAtMs) ? cur.createdAtMs : 0) ||
        tsToMs(cur?.createdAt);
      // Prefer non-stub and newer.
      const score = (isStub ? 0 : 1000) + (ms > 0 ? ms : 0);
      return { d, cur, isStub, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored.find((x) => !x.isStub) || scored[0] || null;
  return best ? best.d : null;
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const decoded = await requireIdToken(req);
  const uid = String(decoded?.uid || '');
  if (!uid) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
    return;
  }

  const { db, FieldValue } = getAdmin();

  const body = normalizeBody(req);
  const payload = body?.payload && typeof body.payload === 'object' ? body.payload : {};

  const details = payload?.details && typeof payload.details === 'object' ? payload.details : {};
  const detailsLanguages = details?.languages && typeof details.languages === 'object' ? details.languages : {};
  const detailsNative = detailsLanguages?.native && typeof detailsLanguages.native === 'object' ? detailsLanguages.native : {};
  const detailsForeign = detailsLanguages?.foreign && typeof detailsLanguages.foreign === 'object' ? detailsLanguages.foreign : {};

  const partner =
    payload?.partnerPreferences && typeof payload.partnerPreferences === 'object'
      ? payload.partnerPreferences
      : {};

  const partnerCommunicationMethods = toStringArray(partner?.communicationMethods, { maxItems: 5, maxLen: 40 });

  const photoUrls = Array.isArray(payload?.photoUrls) ? payload.photoUrls : null;

  const nextUsername = safeStr(payload?.username, 60);
  const nextUsernameLower = normalizeUsernameLower(payload?.username || payload?.usernameLower);

  // Whitelist: kullanıcı sadece bu alanları bir defa güncelleyebilir.
  const updates = {
    ...(nextUsernameLower
      ? {
          username: nextUsername,
          usernameLower: nextUsernameLower,
        }
      : {}),
    fullName: safeStr(payload?.fullName, 120),
    age: toNumOrNull(payload?.age, { min: 18, max: 99 }),
    city: safeStr(payload?.city, 80),
    country: safeStr(payload?.country, 80),
    whatsapp: safeStr(payload?.whatsapp, 60),
    instagram: safeStr(payload?.instagram, 80),
    nationality: safeStr(payload?.nationality, 30),
    gender: normalizeGender(payload?.gender),
    lookingForNationality: safeStr(payload?.lookingForNationality, 30),
    lookingForGender: '',
    about: safeStr(payload?.about, MAX_TEXT_LEN),
    expectations: safeStr(payload?.expectations, MAX_TEXT_LEN),
    details: {
      heightCm: toNumOrNull(details?.heightCm, { min: 120, max: 230 }),
      weightKg: toNumOrNull(details?.weightKg, { min: 35, max: 250 }),
      occupation: safeStr(details?.occupation, 80),
      education: safeStr(details?.education, 80),
      educationDepartment: safeStr(details?.educationDepartment, 120),
      maritalStatus: safeStr(details?.maritalStatus, 40),
      hasChildren: safeStr(details?.hasChildren, 20),
      childrenCount: toNumOrNull(details?.childrenCount, { min: 0, max: 20 }),
      incomeLevel: safeStr(details?.incomeLevel, 40),
      religion: safeStr(details?.religion, 60),
      religiousValues: safeStr(details?.religiousValues, 1200),
      familyApprovalStatus: safeStr(details?.familyApprovalStatus, 40),
      marriageTimeline: safeStr(details?.marriageTimeline, 40),
      relocationWillingness: safeStr(details?.relocationWillingness, 40),
      preferredLivingCountry: safeStr(details?.preferredLivingCountry, 60),
      languages: {
        native: {
          code: safeStr(detailsNative?.code, 40),
          other: safeStr(detailsNative?.other, 60),
        },
        foreign: {
          codes: toStringArray(detailsForeign?.codes, { maxItems: 10, maxLen: 40 }),
          other: safeStr(detailsForeign?.other, 60),
        },
      },
      communicationLanguage: safeStr(details?.communicationLanguage, 40),
      communicationLanguageOther: safeStr(details?.communicationLanguageOther, 80),
      communicationMethod: safeStr(details?.communicationMethod, 40),
      canCommunicateWithTranslationApp: !!details?.canCommunicateWithTranslationApp,
      smoking: safeStr(details?.smoking, 40),
      alcohol: safeStr(details?.alcohol, 40),
    },
    partnerPreferences: {
      heightMinCm: toNumOrNull(partner?.heightMinCm, { min: 120, max: 230 }),
      heightMaxCm: toNumOrNull(partner?.heightMaxCm, { min: 120, max: 230 }),
      ageMaxOlderYears: toNumOrNull(partner?.ageMaxOlderYears, { min: 0, max: 30 }),
      ageMaxYoungerYears: toNumOrNull(partner?.ageMaxYoungerYears, { min: 0, max: 30 }),
      ageMin: toNumOrNull(partner?.ageMin, { min: 18, max: 99 }),
      ageMax: toNumOrNull(partner?.ageMax, { min: 18, max: 99 }),
      maritalStatus: safeStr(partner?.maritalStatus, 40),
      religion: safeStr(partner?.religion, 60),
      communicationMethods: partnerCommunicationMethods,
      communicationLanguage: safeStr(partner?.communicationLanguage, 40),
      communicationLanguageOther: safeStr(partner?.communicationLanguageOther, 80),
      canCommunicateWithTranslationApp: includesStr(partnerCommunicationMethods, 'translation_app')
        ? true
        : !!partner?.canCommunicateWithTranslationApp,
      translationAppPreference: includesStr(partnerCommunicationMethods, 'translation_app')
        ? 'yes'
        : safeStr(partner?.translationAppPreference, 20),
      livingCountry: safeStr(partner?.livingCountry, 60),
      smokingPreference: safeStr(partner?.smokingPreference, 40),
      alcoholPreference: safeStr(partner?.alcoholPreference, 40),
      childrenPreference: safeStr(partner?.childrenPreference, 40),
      educationPreference: safeStr(partner?.educationPreference, 40),
      occupationPreference: safeStr(partner?.occupationPreference, 40),
      familyValuesPreference: safeStr(partner?.familyValuesPreference, 40),
    },
  };

  updates.lookingForGender = resolveLookingForGender(updates.gender, payload?.lookingForGender);

  if (photoUrls) {
    updates.photoUrls = toStringArray(photoUrls, { maxItems: 6, maxLen: 400 });
  }

  // En az bir alan değişsin (tamamen boş gönderme).
  const hasAny = Object.values(updates).some((v) => {
    if (typeof v === 'string') return !!v.trim();
    if (typeof v === 'number') return Number.isFinite(v);
    if (v && typeof v === 'object') return true;
    return false;
  });
  if (!hasAny) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'empty_update' }));
    return;
  }

  if (safeStr(payload?.username, 80) || safeStr(payload?.usernameLower, 80)) {
    if (!nextUsernameLower) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }
  }

  // Kullanıcının başvurusunu bul.
  const snap = await db
    .collection('matchmakingApplications')
    .where('userId', '==', uid)
    .limit(10)
    .get();

  if (snap.empty) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
    return;
  }

  const bestDoc = pickBestApplicationDoc(snap.docs);
  if (!bestDoc) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
    return;
  }

  const docRef = bestDoc.ref;

  const cur = bestDoc.data() || {};
  const curId = safeStr(bestDoc.id, 160);
  const curUsernameLower = normalizeUsernameLower(cur?.usernameLower || cur?.username);
  const curAbout = safeStr(cur?.about, MAX_TEXT_LEN);
  const curExpectations = safeStr(cur?.expectations, MAX_TEXT_LEN);

  const aboutChanged = safeStr(updates?.about, MAX_TEXT_LEN) !== curAbout;
  const expectationsChanged = safeStr(updates?.expectations, MAX_TEXT_LEN) !== curExpectations;

  // About/Expectations can be edited (edit-once mode still limits overall usage via userEditOnceUsedAt).

  // If texts are currently empty and user is trying to set them now, enforce rules + translation.
  // Not all text fields are required: user may fill only one of them.
  const writingAboutNow = !curAbout && !!updates?.about;
  const writingExpectationsNow = !curExpectations && !!updates?.expectations;
  const writingAnyTextNow = writingAboutNow || writingExpectationsNow;
  if (writingAnyTextNow) {
    for (const [field, value] of [
      ...(writingAboutNow ? [['about', updates.about]] : []),
      ...(writingExpectationsNow ? [['expectations', updates.expectations]] : []),
    ]) {
      const pii = detectForbiddenContactPII(value);
      if (pii.hasForbidden) {
        res.statusCode = 422;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'profile_text_pii_blocked', field, reasons: pii.reasons }));
        return;
      }
    }

    const sourceLang = normalizeProfileLang(payload?.lang) || 'tr';
    const [aboutBi, expBi] = await Promise.all([
      writingAboutNow ? buildBilingualProfileText(updates.about, sourceLang, { fallbackSourceLang: 'tr' }) : Promise.resolve(null),
      writingExpectationsNow ? buildBilingualProfileText(updates.expectations, sourceLang, { fallbackSourceLang: 'tr' }) : Promise.resolve(null),
    ]);

    updates.profileTextLang = sourceLang;
    updates.profileTextTranslatedAtMs = Date.now();

    if (aboutBi) {
      updates.aboutTr = aboutBi.tr;
      updates.aboutId = aboutBi.id;
    }
    if (expBi) {
      updates.expectationsTr = expBi.tr;
      updates.expectationsId = expBi.id;
    }

    updates.profileTextTranslate = {
      ...(updates.profileTextTranslate && typeof updates.profileTextTranslate === 'object' ? updates.profileTextTranslate : {}),
      ...(aboutBi
        ? {
            about: {
              sourceLang: aboutBi.sourceLang,
              targetLang: aboutBi.targetLang,
              translated: aboutBi.translated,
              skipped: aboutBi.skipped,
              truncated: aboutBi.truncated,
              translateConfigured: aboutBi.translateConfigured,
            },
          }
        : {}),
      ...(expBi
        ? {
            expectations: {
              sourceLang: expBi.sourceLang,
              targetLang: expBi.targetLang,
              translated: expBi.translated,
              skipped: expBi.skipped,
              truncated: expBi.truncated,
              translateConfigured: expBi.translateConfigured,
            },
          }
        : {}),
    };

    // Also persist translations in matchmakingUsers cache.
    const detailsPatch = {
      ...(writingAboutNow
        ? {
            about: updates.about,
            bio: updates.about,
            ...(aboutBi ? { aboutTr: aboutBi.tr, aboutId: aboutBi.id } : {}),
          }
        : {}),
      ...(writingExpectationsNow
        ? {
            expectations: updates.expectations,
            ...(expBi ? { expectationsTr: expBi.tr, expectationsId: expBi.id } : {}),
          }
        : {}),
    };

    const publicPatch = {
      ...(writingAboutNow ? { about: updates.about, ...(aboutBi ? { aboutTr: aboutBi.tr, aboutId: aboutBi.id } : {}) } : {}),
      ...(writingExpectationsNow
        ? { expectations: updates.expectations, ...(expBi ? { expectationsTr: expBi.tr, expectationsId: expBi.id } : {}) }
        : {}),
    };

    await db.collection('matchmakingUsers').doc(uid).set(
      {
        ...(Object.keys(detailsPatch).length ? { details: detailsPatch } : {}),
        ...(Object.keys(publicPatch).length ? { publicProfile: publicPatch } : {}),
        profileTextLang: sourceLang,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Username uniqueness: in this system, new applications use docId=usernameLower.
  // If user changes usernameLower in editOnce mode, migrate the document to keep docId-based uniqueness.
  let finalApplicationId = curId;
  const wantsUsernameChange = !!updates?.usernameLower && updates.usernameLower !== curUsernameLower;
  const wantsDocIdChange = wantsUsernameChange && updates.usernameLower !== curId;

  if (wantsDocIdChange) {
    const desiredId = String(updates.usernameLower);

    // Best-effort global uniqueness check (covers legacy docs not using usernameLower as docId).
    const takenQuery = await db.collection('matchmakingApplications').where('usernameLower', '==', desiredId).limit(2).get();
    const takenByOtherDoc = takenQuery.docs.some((d) => String(d.id || '') !== curId);
    if (takenByOtherDoc) {
      res.statusCode = 409;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'username_taken' }));
      return;
    }

    const desiredRef = db.collection('matchmakingApplications').doc(desiredId);
    try {
      await db.runTransaction(async (tx) => {
        // Ensure target doesn't exist.
        const targetSnap = await tx.get(desiredRef);
        if (targetSnap.exists) {
          const err = new Error('username_taken');
          err.statusCode = 409;
          throw err;
        }

        // Create new doc with merged data, then delete old.
        tx.create(desiredRef, {
          ...(cur && typeof cur === 'object' ? cur : {}),
          ...updates,
          migratedFrom: curId,
          migratedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        tx.delete(docRef);
      });

      finalApplicationId = desiredId;
    } catch (e) {
      const msg = String(e?.message || '').trim();
      if (msg === 'username_taken' || e?.statusCode === 409) {
        res.statusCode = 409;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'username_taken' }));
        return;
      }
      throw e;
    }
  } else {
    await docRef.update({
      ...updates,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // Keep matchmakingUsers cache in sync for UI/admin screens.
  try {
    const patchCore = {
      ...(typeof updates?.age === 'number' && Number.isFinite(updates.age) ? { age: updates.age } : {}),
      ...(safeStr(updates?.city, 80) ? { city: safeStr(updates.city, 80) } : {}),
      ...(safeStr(updates?.country, 80) ? { country: safeStr(updates.country, 80) } : {}),
      ...(safeStr(updates?.nationality, 40) ? { nationality: safeStr(updates.nationality, 40) } : {}),
      ...(safeStr(updates?.gender, 30) ? { gender: safeStr(updates.gender, 30) } : {}),
      ...(safeStr(updates?.lookingForNationality, 40) ? { lookingForNationality: safeStr(updates.lookingForNationality, 40) } : {}),
      ...(safeStr(updates?.lookingForGender, 30) ? { lookingForGender: safeStr(updates.lookingForGender, 30) } : {}),
    };

    const appPatch = {
      ...(patchCore.age !== undefined ? { age: patchCore.age } : {}),
      ...(patchCore.city ? { city: patchCore.city } : {}),
      ...(patchCore.country ? { country: patchCore.country } : {}),
      ...(patchCore.nationality ? { nationality: patchCore.nationality } : {}),
      ...(patchCore.gender ? { gender: patchCore.gender } : {}),
      ...(patchCore.lookingForNationality ? { lookingForNationality: patchCore.lookingForNationality } : {}),
      ...(patchCore.lookingForGender ? { lookingForGender: patchCore.lookingForGender } : {}),
      ...(updates?.details && typeof updates.details === 'object' ? { details: updates.details } : {}),
      ...(updates?.partnerPreferences && typeof updates.partnerPreferences === 'object' ? { partnerPreferences: updates.partnerPreferences } : {}),
    };

    const userPatch = {
      ...(updates?.usernameLower ? { username: safeStr(updates.username, 60), usernameLower: safeStr(updates.usernameLower, 80) } : {}),
      ...(updates?.fullName ? { fullName: safeStr(updates.fullName, 120) } : {}),
      ...patchCore,
      ...(finalApplicationId ? { applicationId: finalApplicationId } : {}),
      ...(Object.keys(appPatch).length ? { application: appPatch } : {}),
      publicProfile: {
        ...(updates?.usernameLower ? { username: safeStr(updates.username, 60), usernameLower: safeStr(updates.usernameLower, 80) } : {}),
        ...(updates?.fullName ? { fullName: safeStr(updates.fullName, 120) } : {}),
        ...patchCore,
      },
      details: {
        ...(updates?.fullName ? { fullName: safeStr(updates.fullName, 120) } : {}),
      },
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('matchmakingUsers').doc(uid).set(userPatch, { merge: true });

    const ensuredCode = await ensureUserCodeAssigned({ db, FieldValue, uid, gender: patchCore.gender, nowMs: Date.now() });
    const ensuredUserCode = safeStr(ensuredCode?.userCode, 40);
    if (ensuredUserCode && finalApplicationId) {
      await db.collection('matchmakingApplications').doc(finalApplicationId).set(
        {
          userCode: ensuredUserCode,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
  } catch {
    // best-effort
  }

  // Realtime member feed: kullanıcı profil metinlerini ilk kez yazdıysa "profilini tamamladı" event'i.
  // Best-effort; hata olursa akışı bozmayalım.
  if (writingTextsNow) {
    try {
      const userSnap = await db.collection('matchmakingUsers').doc(uid).get();
      const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};
      const userCode = safeStr(userDoc?.userCode, 40) || safeStr(userDoc?.publicProfile?.userCode, 40);
      await emitMemberFeedEvent({
        db,
        FieldValue,
        uid,
        kind: 'profile_completed',
        username: safeStr(cur?.username, 40),
        userCode,
        profileIncomplete: false,
      });
    } catch {
      // best-effort
    }
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, applicationId: finalApplicationId }));
}
