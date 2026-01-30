import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { normalizeGender } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asObj(v) {
  return v && typeof v === 'object' ? v : {};
}

function clipText(raw, maxLen) {
  const s = safeStr(raw);
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen) : s;
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

function pickBestNonStubApplication(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;

  const scored = list
    .map((a) => {
      const source = safeStr(a?.source).toLowerCase();
      const isStub = source === 'auto_stub';
      const ms =
        (typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0) ||
        tsToMs(a?.createdAt);
      const score = (isStub ? 0 : 1000) + (ms > 0 ? ms : 0);
      return { a, isStub, score };
    })
    .sort((x, y) => y.score - x.score);

  const best = scored.find((x) => !x.isStub) || null;
  return best ? best.a : null;
}

function ageRangeFromApp(app) {
  const age = asNum(app?.age);
  const partner = asObj(app?.partnerPreferences);

  const sanitizePref = (n) => (n !== null && n >= 18 && n <= 99 ? n : null);
  const sanitizeDelta = (n) => (n !== null && n >= 0 && n <= 99 ? n : null);
  const clampRange = (rawMin, rawMax) => {
    const finalMin = Math.max(18, Math.min(99, rawMin));
    let finalMax = Math.max(18, Math.min(99, rawMax));
    if (finalMax < finalMin) finalMax = finalMin;
    return { min: finalMin, max: finalMax };
  };

  const prefMin = sanitizePref(asNum(partner?.ageMin));
  const prefMax = sanitizePref(asNum(partner?.ageMax));

  // Net min/max varsa onu baz al. Eksik taraf varsa relative'den tamamla.
  if (prefMin !== null || prefMax !== null) {
    const older = sanitizeDelta(asNum(partner?.ageMaxOlderYears));
    const younger = sanitizeDelta(asNum(partner?.ageMaxYoungerYears));
    const hasRelative = age !== null && (older !== null || younger !== null);

    const a = age ?? 30;

    const outMin =
      prefMin !== null
        ? prefMin
        : hasRelative
          ? age - (younger ?? 0)
          : Math.max(18, a - 5);

    const outMax =
      prefMax !== null
        ? prefMax
        : hasRelative
          ? age + (older ?? 0)
          : Math.min(99, a + 5);

    return clampRange(outMin, outMax);
  }

  // Asimetrik relative tercih: sadece older verildiyse min=age; sadece younger verildiyse max=age
  const older = sanitizeDelta(asNum(partner?.ageMaxOlderYears));
  const younger = sanitizeDelta(asNum(partner?.ageMaxYoungerYears));
  if (age !== null && (older !== null || younger !== null)) {
    const outMin = age - (younger ?? 0);
    const outMax = age + (older ?? 0);
    return clampRange(outMin, outMax);
  }

  // Fallback
  const a = age ?? 30;
  return clampRange(a - 5, a + 5);
}

function candidateAllowsViewer(viewerApp, candApp) {
  const viewerAge = asNum(viewerApp?.age);
  if (viewerAge === null) return true; // age unknown, don't block

  const { min, max } = ageRangeFromApp(candApp);
  return viewerAge >= min && viewerAge <= max;
}

function mutualGenderOk(viewerApp, candApp) {
  const viewerGender = normalizeGender(viewerApp?.gender);
  const viewerLookingFor = normalizeGender(viewerApp?.lookingForGender);
  const candGender = normalizeGender(candApp?.gender);
  const candLookingFor = normalizeGender(candApp?.lookingForGender);

  // If we know viewerLookingFor, enforce it.
  // Otherwise, if viewer gender is known, default to opposite.
  const viewerWants =
    viewerLookingFor ||
    (viewerGender === 'male' ? 'female' : viewerGender === 'female' ? 'male' : '');

  if (viewerWants && candGender && candGender !== viewerWants) return false;
  if (viewerGender && candGender && candGender === viewerGender) return false;

  // Candidate must also want viewer gender when specified.
  if (candLookingFor && viewerGender && candLookingFor !== viewerGender) return false;

  return true;
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
    const uid = safeStr(decoded?.uid);
    if (!uid) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
      return;
    }

    const body = normalizeBody(req);
    const limitOut = (() => {
      const n = asNum(body?.limit);
      if (n === null) return 30;
      return Math.max(10, Math.min(60, Math.floor(n)));
    })();

    const { db } = getAdmin();

    // Viewer application (en iyi)
    const myAppsSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get();
    const myApps = myAppsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const myApp = pickBestNonStubApplication(myApps);

    if (!myApp) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
      return;
    }

    const viewerAge = asNum(myApp?.age);
    const { min, max } = ageRangeFromApp(myApp);

  // Firestore tarafında sadece yaş aralığı ile pre-filter (index gereksinimini düşük tutmak için)
  const candSnap = await db
    .collection('matchmakingApplications')
    .where('age', '>=', min)
    .where('age', '<=', max)
    .orderBy('age', 'asc')
    .limit(400)
    .get();

  const bestByUid = new Map();

  const scoreApp = (a) => {
    const source = safeStr(a?.source).toLowerCase();
    const isStub = source === 'auto_stub';
    const ms =
      (typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0) || tsToMs(a?.createdAt);
    return (isStub ? 0 : 1000) + (ms > 0 ? ms : 0);
  };

  for (const d of candSnap.docs) {
    const cand = d.data() || {};
    const candUid = safeStr(cand?.userId);
    if (!candUid || candUid === uid) continue;

    const prev = bestByUid.get(candUid);
    if (!prev) {
      bestByUid.set(candUid, { id: d.id, data: cand, score: scoreApp(cand) });
      continue;
    }

    const s = scoreApp(cand);
    if (s > prev.score) bestByUid.set(candUid, { id: d.id, data: cand, score: s });
  }

  const items = [];

  for (const [candUid, entry] of bestByUid.entries()) {
    const cand = entry?.data || {};
    const applicationId = safeStr(entry?.id);

    const age = asNum(cand?.age);
    const details = asObj(cand?.details);

    const dist = viewerAge === null || age === null ? 999 : Math.abs(age - viewerAge);
    const candRange = ageRangeFromApp(cand);
    const genderOk = mutualGenderOk(myApp, cand);
    const canInteract = genderOk && candidateAllowsViewer(myApp, cand);

    // Havuz: varsayılan olarak karşılıklı cinsiyet uyumu olmayanları listeleme.
    if (!genderOk) continue;

    items.push({
      uid: candUid,
      applicationId,
      dist,
      canInteract,
      candidateAgeMin: candRange.min,
      candidateAgeMax: candRange.max,
      createdAtMs:
        (typeof cand?.createdAtMs === 'number' && Number.isFinite(cand.createdAtMs) ? cand.createdAtMs : 0) || tsToMs(cand?.createdAt),
      profile: {
        username: safeStr(cand?.username),
        age,
        city: safeStr(cand?.city),
        country: safeStr(cand?.country),
        gender: safeStr(cand?.gender),
        lookingForGender: safeStr(cand?.lookingForGender),
        photoUrls: Array.isArray(cand?.photoUrls) ? cand.photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 3) : [],
        about: clipText(cand?.about, 360),
        expectations: clipText(cand?.expectations, 360),
        details: {
          maritalStatus: safeStr(details?.maritalStatus),
          occupation: safeStr(details?.occupation),
          hasChildren: safeStr(details?.hasChildren),
          childrenCount: asNum(details?.childrenCount),
          childrenLivingSituation: safeStr(details?.childrenLivingSituation),
          heightCm: asNum(details?.heightCm),
        },
      },
    });
  }

  // Sırala: yaş yakınlığı -> daha yeni
  // Not: Dist (viewer yaşına yakınlık) farklı kullanıcılar için farklı sıralama üretir.
  // Aynı yaş aralığında daha deterministik bir liste için aday yaşı -> daha yeni -> uid sıralaması.
  items.sort((a, b) => {
    const aa = typeof a?.profile?.age === 'number' ? a.profile.age : 999;
    const ab = typeof b?.profile?.age === 'number' ? b.profile.age : 999;
    return (aa - ab) || (b.createdAtMs - a.createdAtMs) || a.uid.localeCompare(b.uid);
  });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        meta: {
          viewerAge,
          ageMin: min,
          ageMax: max,
          total: items.length,
          returned: Math.min(limitOut, items.length),
        },
        items: items.slice(0, limitOut),
      })
    );
  } catch (e) {
    const msg = safeStr(e?.message);
    const code = safeStr(e?.code);

    let error = 'server_error';
    if (code === 'permission-denied') error = 'firestore_permission_denied';
    if (code === 'failed-precondition' || msg.toLowerCase().includes('failed_precondition')) error = 'firestore_failed_precondition';
    if (code === 'invalid-argument') error = 'firestore_invalid_argument';

    // eslint-disable-next-line no-console
    console.error('[matchmaking-browse] error:', e);

    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error, message: msg || 'server_error' }));
  }
}
