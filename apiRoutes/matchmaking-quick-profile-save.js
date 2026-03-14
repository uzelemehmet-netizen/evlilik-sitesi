import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { normalizeGender } from './_matchmakingEligibility.js';

function safeStr(v, maxLen = 200) {
  const s = typeof v === 'string' ? v.trim() : String(v ?? '').trim();
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function asInt(v) {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  return Number.isFinite(i) ? i : null;
}

function normalizeAge(v) {
  const i = asInt(v);
  if (i === null) return null;
  if (i < 18 || i > 99) return null;
  return i;
}

function normalizeCountryCode(v) {
  const s = safeStr(v, 20).toLowerCase();
  if (s === 'tr' || s === 'turkey' || s === 'türkiye') return 'tr';
  if (s === 'id' || s === 'indonesia' || s === 'endonezya') return 'id';
  if (s === 'other') return 'other';
  return '';
}

function countryLabel(code, fallback) {
  if (code === 'tr') return 'Türkiye';
  if (code === 'id') return 'Endonezya';
  if (code === 'other') return safeStr(fallback, 80) || 'Diğer';
  return safeStr(fallback, 80);
}

function normalizeHasChildren(v) {
  const s = safeStr(v, 20).toLowerCase();
  if (s === 'yes' || s === 'evet' || s === 'var') return 'yes';
  if (s === 'no' || s === 'hayir' || s === 'hayır' || s === 'yok') return 'no';
  return '';
}

function normalizeMaritalStatus(v) {
  const s = safeStr(v, 40).toLowerCase();
  // Keep it flexible but non-empty.
  return s;
}

function shouldSetIfEmpty(existing, next) {
  if (next === null || next === undefined) return false;
  if (typeof next === 'string') {
    const n = next.trim();
    if (!n) return false;
    return !safeStr(existing, 500);
  }
  if (typeof next === 'number') {
    if (!Number.isFinite(next)) return false;
    return !(typeof existing === 'number' && Number.isFinite(existing));
  }
  if (next && typeof next === 'object') {
    return !(existing && typeof existing === 'object');
  }
  return false;
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = safeStr(decoded?.uid, 200);
    if (!uid) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
      return;
    }

    const body = normalizeBody(req);
    const profile = body?.profile && typeof body.profile === 'object' ? body.profile : {};

    const fullName = safeStr(profile?.fullName, 120);
    const age = normalizeAge(profile?.age);
    const gender = normalizeGender(profile?.gender);

    const city = safeStr(profile?.city, 80);
    const countryCode = normalizeCountryCode(profile?.countryCode || profile?.nationality);
    const countryFreeText = safeStr(profile?.country, 80);
    const country = countryLabel(countryCode, countryFreeText);

    const occupation = safeStr(profile?.occupation, 80);
    const maritalStatus = normalizeMaritalStatus(profile?.maritalStatus);

    const hasChildren = normalizeHasChildren(profile?.hasChildren);
    const childrenCountRaw = asInt(profile?.childrenCount);
    const childrenCount = childrenCountRaw === null ? null : Math.max(0, Math.min(20, childrenCountRaw));

    const photoUrl = safeStr(profile?.photoUrl, 600);

    // Minimal validation: match the "minimum profile" gate expectations.
    if (!fullName || age === null || !gender || !city || !country || !countryCode || !occupation || !maritalStatus) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    if (hasChildren === 'yes' && !(typeof childrenCount === 'number' && Number.isFinite(childrenCount) && childrenCount >= 1)) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingUsers').doc(uid);

    let updated = false;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const cur = snap.exists ? snap.data() || {} : {};

      const curDetails = cur?.details && typeof cur.details === 'object' ? cur.details : {};
      const curPublic = cur?.publicProfile && typeof cur.publicProfile === 'object' ? cur.publicProfile : {};

      const patch = { updatedAt: FieldValue.serverTimestamp() };
      if (!snap.exists) patch.createdAt = FieldValue.serverTimestamp();

      if (shouldSetIfEmpty(cur?.fullName, fullName)) patch.fullName = fullName;
      if (shouldSetIfEmpty(cur?.age, age)) patch.age = age;
      if (shouldSetIfEmpty(cur?.gender, gender)) patch.gender = gender;
      if (shouldSetIfEmpty(cur?.city, city)) patch.city = city;
      if (shouldSetIfEmpty(cur?.country, country)) patch.country = country;
      if (shouldSetIfEmpty(cur?.nationality, countryCode)) patch.nationality = countryCode;

      const detailsPatch = {
        ...(shouldSetIfEmpty(curDetails?.occupation, occupation) ? { occupation } : {}),
        ...(shouldSetIfEmpty(curDetails?.maritalStatus, maritalStatus) ? { maritalStatus } : {}),
        ...(shouldSetIfEmpty(curDetails?.hasChildren, hasChildren) ? (hasChildren ? { hasChildren } : {}) : {}),
        ...(hasChildren === 'yes' && shouldSetIfEmpty(curDetails?.childrenCount, childrenCount)
          ? { childrenCount }
          : {}),
      };

      const publicPatch = {
        ...(shouldSetIfEmpty(curPublic?.fullName, fullName) ? { fullName } : {}),
        ...(shouldSetIfEmpty(curPublic?.age, age) ? { age } : {}),
        ...(shouldSetIfEmpty(curPublic?.gender, gender) ? { gender } : {}),
        ...(shouldSetIfEmpty(curPublic?.city, city) ? { city } : {}),
        ...(shouldSetIfEmpty(curPublic?.country, country) ? { country } : {}),
        ...(shouldSetIfEmpty(curPublic?.nationality, countryCode) ? { nationality: countryCode } : {}),
        ...(photoUrl && (!Array.isArray(curPublic?.photoUrls) || curPublic.photoUrls.length === 0) ? { photoUrls: [photoUrl] } : {}),
      };

      const hasDetails = Object.keys(detailsPatch).length > 0;
      const hasPublic = Object.keys(publicPatch).length > 0;

      if (hasDetails) patch.details = { ...curDetails, ...detailsPatch };
      if (hasPublic) patch.publicProfile = { ...curPublic, ...publicPatch };

      // Also mirror occupation/marital info at root level for older readers (best-effort).
      if (shouldSetIfEmpty(cur?.occupation, occupation)) patch.occupation = occupation;
      if (shouldSetIfEmpty(cur?.maritalStatus, maritalStatus)) patch.maritalStatus = maritalStatus;
      if (hasChildren && shouldSetIfEmpty(cur?.hasChildren, hasChildren)) patch.hasChildren = hasChildren;
      if (hasChildren === 'yes' && shouldSetIfEmpty(cur?.childrenCount, childrenCount)) patch.childrenCount = childrenCount;

      const meaningfulKeys = Object.keys(patch).filter((k) => k !== 'updatedAt');
      if (!meaningfulKeys.length) {
        updated = false;
        return;
      }

      tx.set(ref, patch, { merge: true });
      updated = true;
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ ok: true, updated }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
