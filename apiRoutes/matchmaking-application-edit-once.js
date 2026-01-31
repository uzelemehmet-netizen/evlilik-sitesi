import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(value, maxLen) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen) : s;
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

  // Whitelist: kullanıcı sadece bu alanları bir defa güncelleyebilir.
  const updates = {
    fullName: safeStr(payload?.fullName, 120),
    age: toNumOrNull(payload?.age, { min: 18, max: 99 }),
    city: safeStr(payload?.city, 80),
    country: safeStr(payload?.country, 80),
    whatsapp: safeStr(payload?.whatsapp, 60),
    email: safeStr(payload?.email, 120),
    instagram: safeStr(payload?.instagram, 80),
    nationality: safeStr(payload?.nationality, 30),
    gender: safeStr(payload?.gender, 30),
    lookingForNationality: safeStr(payload?.lookingForNationality, 30),
    lookingForGender: safeStr(payload?.lookingForGender, 30),
    about: safeStr(payload?.about, 1800),
    expectations: safeStr(payload?.expectations, 1800),
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

  const anyUsed = snap.docs.some((d) => {
    const cur = d.data() || {};
    return !!cur?.userEditOnceUsedAt;
  });
  if (anyUsed) {
    res.statusCode = 409;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'edit_once_used' }));
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

  await docRef.update({
    ...updates,
    userEditOnceUsedAt: FieldValue.serverTimestamp(),
    userEditOnceUsedBy: uid,
    userEditOnceUpdatedAt: FieldValue.serverTimestamp(),
  });

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}
