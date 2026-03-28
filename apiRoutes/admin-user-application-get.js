import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function toMs(ts) {
  try {
    if (!ts) return 0;
    if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
    if (ts instanceof Date) {
      const n = ts.getTime();
      return Number.isFinite(n) ? n : 0;
    }
    if (typeof ts?.toMillis === 'function') return ts.toMillis();
    if (typeof ts?.seconds === 'number') return ts.seconds * 1000;
    return 0;
  } catch {
    return 0;
  }
}

function pickUserForAdminModal(userDoc) {
  const u = userDoc && typeof userDoc === 'object' ? userDoc : null;
  if (!u) return null;

  const asObj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
  const pickDetails = (details) => {
    const d = asObj(details);
    if (!d) return null;
    const out = {
      occupation: safeStr(d?.occupation) || null,
      occupationTr: safeStr(d?.occupationTr) || null,
      job: safeStr(d?.job) || null,
      profession: safeStr(d?.profession) || null,
      maritalStatus: safeStr(d?.maritalStatus) || null,
      education: safeStr(d?.education) || null,
      religion: safeStr(d?.religion) || null,
      about: safeStr(d?.about) || null,
      expectations: safeStr(d?.expectations) || null,
      childrenLivingSituation: safeStr(d?.childrenLivingSituation) || null,
      hasChildren: d?.hasChildren ?? null,
      childrenCount:
        typeof d?.childrenCount === 'number' && Number.isFinite(d.childrenCount)
          ? d.childrenCount
          : d?.childrenCount ?? null,
    };

    const any = Object.values(out).some((v) => v !== null && v !== '');
    return any ? out : null;
  };

  const out = {
    userCode: safeStr(u?.userCode) || null,
    fullName: safeStr(u?.fullName) || null,
    age: typeof u?.age === 'number' && Number.isFinite(u.age) ? u.age : null,
    gender: safeStr(u?.gender) || null,
    applicationId: safeStr(u?.applicationId) || null,
    photoUrls: Array.isArray(u?.photoUrls) ? u.photoUrls.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 12) : [],
    photoPaths: Array.isArray(u?.photoPaths) ? u.photoPaths.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 24) : [],
    photoPath: safeStr(u?.photoPath) || null,
  };

  // Bazı eski/alternatif şemalarda publicProfile altında gelebilir.
  const pp = u?.publicProfile && typeof u.publicProfile === 'object' ? u.publicProfile : null;
  if (pp) {
    const ppUrls = Array.isArray(pp?.photoUrls) ? pp.photoUrls.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 12) : [];
    const ppPaths = Array.isArray(pp?.photoPaths) ? pp.photoPaths.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 24) : [];
    const ppDetails = pickDetails(pp);
    if (ppUrls.length || ppPaths.length || ppDetails) {
      out.publicProfile = {
        ...(ppUrls.length ? { photoUrls: ppUrls } : {}),
        ...(ppPaths.length ? { photoPaths: ppPaths } : {}),
        ...(ppDetails ? { details: ppDetails } : {}),
      };
    }
  }

  const details = pickDetails(u?.details);
  if (details) out.details = details;

  const appCache = asObj(u?.application);
  if (appCache) {
    const cache = {
      lookingForNationality: safeStr(appCache?.lookingForNationality) || null,
      lookingForGender: safeStr(appCache?.lookingForGender) || null,
      partnerPreferences: asObj(appCache?.partnerPreferences) || null,
    };
    const any = Object.values(cache).some((v) => v !== null);
    if (any) out.application = cache;
  }

  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);

    const body = normalizeBody(req);
    const uid = safeStr(body?.uid || body?.userId);
    if (!uid) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db } = getAdmin();

    let pickedUser = null;
    let cachedApplication = null;
    let cachedApplicationId = '';

    // Öncelik: matchmakingUsers.applicationId varsa direkt doc getir (en güvenilir yol).
    try {
      const userSnap = await db.collection('matchmakingUsers').doc(uid).get();
      const userDoc = userSnap.exists ? (userSnap.data() || {}) : null;
      pickedUser = pickUserForAdminModal(userDoc);

      // Bazı akışlarda (özellikle profil ekranı / cache) başvuru verisi matchmakingUsers.application altında tutulur.
      // Uygulama dokümanı bulunamazsa admin modalında yine de detayları gösterebilmek için saklayalım.
      cachedApplication = userDoc?.application && typeof userDoc.application === 'object' ? (userDoc.application || null) : null;
      cachedApplicationId = safeStr(userDoc?.applicationId);

      const applicationId = safeStr(userDoc?.applicationId);
      if (applicationId) {
        const appSnap = await db.collection('matchmakingApplications').doc(applicationId).get();
        if (appSnap.exists) {
          const data = appSnap.data() || {};
          res.statusCode = 200;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ ok: true, application: { id: appSnap.id, ...data }, count: 1, user: pickedUser }));
          return;
        }
      }
    } catch {
      // ignore, fallback to queries
    }

    // Fallback: eşitlik filtresiyle farklı field'larda ara, en yeniyi JS'te seç.
    const queries = [
      db.collection('matchmakingApplications').where('userId', '==', uid).limit(50).get(),
      db.collection('matchmakingApplications').where('uid', '==', uid).limit(50).get(),
      db.collection('matchmakingApplications').where('userUid', '==', uid).limit(50).get(),
      db.collection('matchmakingApplications').where('ownerUid', '==', uid).limit(50).get(),
    ];

    const snaps = await Promise.allSettled(queries);
    const docs = [];
    for (const s of snaps) {
      if (s.status === 'fulfilled' && s.value && !s.value.empty) {
        for (const d of s.value.docs) docs.push(d);
      }
    }

    if (!docs.length) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      if (cachedApplication) {
        const id = cachedApplicationId || 'cached';
        res.end(JSON.stringify({ ok: true, application: { id, ...cachedApplication }, count: 0, user: pickedUser, fromCache: true }));
        return;
      }
      res.end(JSON.stringify({ ok: true, application: null, count: 0, user: pickedUser }));
      return;
    }

    const uniq = new Map();
    for (const d of docs) {
      if (!uniq.has(d.id)) uniq.set(d.id, d);
    }

    let best = null;
    let bestMs = -1;
    for (const d of uniq.values()) {
      const data = d.data() || {};
      const ms = Math.max(toMs(data?.updatedAt), toMs(data?.createdAt), toMs(data?.updatedAtMs), toMs(data?.createdAtMs));
      if (!best || ms >= bestMs) {
        best = { id: d.id, ...data };
        bestMs = ms;
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, application: best, count: uniq.size, user: pickedUser }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
