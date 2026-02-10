import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(value, maxLen) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return typeof maxLen === 'number' && maxLen > 0 && s.length > maxLen ? s.slice(0, maxLen) : s;
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
      return { d, isStub, score };
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
  const uid = String(decoded?.uid || '').trim();
  if (!uid) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
    return;
  }

  const body = normalizeBody(req);
  const rawPayload = body?.payload && typeof body.payload === 'object' ? body.payload : body;
  const payload = rawPayload && typeof rawPayload === 'object' ? rawPayload : {};

  const hasAnyKey =
    Object.prototype.hasOwnProperty.call(payload, 'lookingForNationality') ||
    Object.prototype.hasOwnProperty.call(payload, 'lookingForGender') ||
    Object.prototype.hasOwnProperty.call(payload, 'partnerPreferences');

  if (!hasAnyKey) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
    return;
  }

  const wantsPartnerPrefs = Object.prototype.hasOwnProperty.call(payload, 'partnerPreferences');
  const partnerRaw = wantsPartnerPrefs && payload?.partnerPreferences && typeof payload.partnerPreferences === 'object' ? payload.partnerPreferences : {};

  const { db, FieldValue } = getAdmin();

  // Kullanıcının başvurusunu bul.
  const snap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get();
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

  const cur = bestDoc.data && typeof bestDoc.data === 'function' ? (bestDoc.data() || {}) : {};
  const curPartner = cur?.partnerPreferences && typeof cur.partnerPreferences === 'object' ? cur.partnerPreferences : {};

  const partnerCommunicationMethods = (() => {
    if (!wantsPartnerPrefs) return null;
    const has = Object.prototype.hasOwnProperty.call(partnerRaw, 'communicationMethods');
    if (has) return toStringArray(partnerRaw?.communicationMethods, { maxItems: 5, maxLen: 40 });
    return toStringArray(curPartner?.communicationMethods, { maxItems: 5, maxLen: 40 });
  })();

  const nextPartner = wantsPartnerPrefs
    ? {
        heightMinCm: Object.prototype.hasOwnProperty.call(partnerRaw, 'heightMinCm')
          ? toNumOrNull(partnerRaw?.heightMinCm, { min: 120, max: 230 })
          : toNumOrNull(curPartner?.heightMinCm, { min: 120, max: 230 }),
        heightMaxCm: Object.prototype.hasOwnProperty.call(partnerRaw, 'heightMaxCm')
          ? toNumOrNull(partnerRaw?.heightMaxCm, { min: 120, max: 230 })
          : toNumOrNull(curPartner?.heightMaxCm, { min: 120, max: 230 }),
        ageMaxOlderYears: Object.prototype.hasOwnProperty.call(partnerRaw, 'ageMaxOlderYears')
          ? toNumOrNull(partnerRaw?.ageMaxOlderYears, { min: 0, max: 30 })
          : toNumOrNull(curPartner?.ageMaxOlderYears, { min: 0, max: 30 }),
        ageMaxYoungerYears: Object.prototype.hasOwnProperty.call(partnerRaw, 'ageMaxYoungerYears')
          ? toNumOrNull(partnerRaw?.ageMaxYoungerYears, { min: 0, max: 30 })
          : toNumOrNull(curPartner?.ageMaxYoungerYears, { min: 0, max: 30 }),
        ageMin: Object.prototype.hasOwnProperty.call(partnerRaw, 'ageMin')
          ? toNumOrNull(partnerRaw?.ageMin, { min: 18, max: 99 })
          : toNumOrNull(curPartner?.ageMin, { min: 18, max: 99 }),
        ageMax: Object.prototype.hasOwnProperty.call(partnerRaw, 'ageMax')
          ? toNumOrNull(partnerRaw?.ageMax, { min: 18, max: 99 })
          : toNumOrNull(curPartner?.ageMax, { min: 18, max: 99 }),
        maritalStatus: Object.prototype.hasOwnProperty.call(partnerRaw, 'maritalStatus')
          ? safeStr(partnerRaw?.maritalStatus, 40)
          : safeStr(curPartner?.maritalStatus, 40),
        religion: Object.prototype.hasOwnProperty.call(partnerRaw, 'religion')
          ? safeStr(partnerRaw?.religion, 60)
          : safeStr(curPartner?.religion, 60),
        communicationMethods: partnerCommunicationMethods,
        communicationLanguage: Object.prototype.hasOwnProperty.call(partnerRaw, 'communicationLanguage')
          ? safeStr(partnerRaw?.communicationLanguage, 40)
          : safeStr(curPartner?.communicationLanguage, 40),
        communicationLanguageOther: Object.prototype.hasOwnProperty.call(partnerRaw, 'communicationLanguageOther')
          ? safeStr(partnerRaw?.communicationLanguageOther, 80)
          : safeStr(curPartner?.communicationLanguageOther, 80),
        canCommunicateWithTranslationApp: includesStr(partnerCommunicationMethods, 'translation_app')
          ? true
          : Object.prototype.hasOwnProperty.call(partnerRaw, 'canCommunicateWithTranslationApp')
            ? !!partnerRaw?.canCommunicateWithTranslationApp
            : !!curPartner?.canCommunicateWithTranslationApp,
        translationAppPreference: includesStr(partnerCommunicationMethods, 'translation_app')
          ? 'yes'
          : Object.prototype.hasOwnProperty.call(partnerRaw, 'translationAppPreference')
            ? safeStr(partnerRaw?.translationAppPreference, 20)
            : safeStr(curPartner?.translationAppPreference, 20),
        livingCountry: Object.prototype.hasOwnProperty.call(partnerRaw, 'livingCountry')
          ? safeStr(partnerRaw?.livingCountry, 60)
          : safeStr(curPartner?.livingCountry, 60),
        smokingPreference: Object.prototype.hasOwnProperty.call(partnerRaw, 'smokingPreference')
          ? safeStr(partnerRaw?.smokingPreference, 40)
          : safeStr(curPartner?.smokingPreference, 40),
        alcoholPreference: Object.prototype.hasOwnProperty.call(partnerRaw, 'alcoholPreference')
          ? safeStr(partnerRaw?.alcoholPreference, 40)
          : safeStr(curPartner?.alcoholPreference, 40),
        childrenPreference: Object.prototype.hasOwnProperty.call(partnerRaw, 'childrenPreference')
          ? safeStr(partnerRaw?.childrenPreference, 40)
          : safeStr(curPartner?.childrenPreference, 40),
        educationPreference: Object.prototype.hasOwnProperty.call(partnerRaw, 'educationPreference')
          ? safeStr(partnerRaw?.educationPreference, 40)
          : safeStr(curPartner?.educationPreference, 40),
        occupationPreference: Object.prototype.hasOwnProperty.call(partnerRaw, 'occupationPreference')
          ? safeStr(partnerRaw?.occupationPreference, 40)
          : safeStr(curPartner?.occupationPreference, 40),
        familyValuesPreference: Object.prototype.hasOwnProperty.call(partnerRaw, 'familyValuesPreference')
          ? safeStr(partnerRaw?.familyValuesPreference, 40)
          : safeStr(curPartner?.familyValuesPreference, 40),
      }
    : null;

  const updates = {
    ...(Object.prototype.hasOwnProperty.call(payload, 'lookingForNationality')
      ? { lookingForNationality: safeStr(payload?.lookingForNationality, 30) }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, 'lookingForGender') ? { lookingForGender: safeStr(payload?.lookingForGender, 30) } : {}),
    ...(nextPartner ? { partnerPreferences: nextPartner } : {}),
  };

  await docRef.set(
    {
      ...updates,
      userPartnerPreferencesUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // matchmakingUsers cache (best-effort)
  try {
    await db
      .collection('matchmakingUsers')
      .doc(uid)
      .set(
        {
          application: {
            ...(updates?.lookingForNationality !== undefined ? { lookingForNationality: updates.lookingForNationality } : {}),
            ...(updates?.lookingForGender !== undefined ? { lookingForGender: updates.lookingForGender } : {}),
            ...(updates?.partnerPreferences && typeof updates.partnerPreferences === 'object'
              ? { partnerPreferences: updates.partnerPreferences }
              : {}),
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  } catch {
    // noop
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}
