function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
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

function parseAge(v) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 18 || i > 99) return null;
  return i;
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'female' || s === 'male') return s;
  return null;
}

function getAnyAboutFromUserDoc(userDoc) {
  const it = asObj(userDoc);
  if (!it) return '';
  const d = asObj(it?.details);
  const pp = asObj(it?.publicProfile);
  const app = asObj(it?.application);
  return (
    safeStr(it?.bio) ||
    safeStr(d?.about) ||
    safeStr(d?.bio) ||
    safeStr(d?.aboutTr) ||
    safeStr(d?.aboutId) ||
    safeStr(d?.bioTr) ||
    safeStr(d?.bioId) ||
    safeStr(pp?.about) ||
    safeStr(pp?.bio) ||
    safeStr(pp?.aboutTr) ||
    safeStr(pp?.aboutId) ||
    safeStr(pp?.bioTr) ||
    safeStr(pp?.bioId) ||
    safeStr(app?.about) ||
    safeStr(app?.bio) ||
    safeStr(app?.aboutTr) ||
    safeStr(app?.aboutId) ||
    safeStr(app?.bioTr) ||
    safeStr(app?.bioId)
  );
}

function isStubApplication(app) {
  const source = safeStr(app?.source).toLowerCase();
  return source === 'auto_stub' || app?.details?.autoBootstrap === true;
}

function appScoreForAdmin(app) {
  const ms =
    (typeof app?.updatedAtMs === 'number' && Number.isFinite(app.updatedAtMs) ? app.updatedAtMs : 0) ||
    (typeof app?.createdAtMs === 'number' && Number.isFinite(app.createdAtMs) ? app.createdAtMs : 0) ||
    toMs(app?.updatedAt) ||
    toMs(app?.createdAt);
  let score = 0;
  if (!isStubApplication(app)) score += 1000;
  if (typeof app?.age === 'number' && Number.isFinite(app.age)) score += 10;
  if (normalizeGender(app?.gender)) score += 10;
  if (safeStr(app?.country)) score += 3;
  if (safeStr(app?.city)) score += 2;
  if (ms > 0) score += Math.min(100, Math.floor(ms / 1e11));
  return score;
}

function pickBestApp(apps) {
  const list = Array.isArray(apps) ? apps : [];
  if (!list.length) return null;
  let best = list[0];
  let bestScore = appScoreForAdmin(best);
  for (let i = 1; i < list.length; i += 1) {
    const cand = list[i];
    const s = appScoreForAdmin(cand);
    if (s > bestScore) {
      best = cand;
      bestScore = s;
    }
  }
  return best || null;
}

function hasAnyScalar(values) {
  return values.some((value) => {
    if (typeof value === 'string') return !!value.trim();
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'boolean') return true;
    return false;
  });
}

function hasNonEmptyArray(value) {
  return Array.isArray(value) && value.some((item) => safeStr(item));
}

function hasNonEmptyObject(value) {
  const obj = asObj(value);
  if (!obj) return false;
  return Object.values(obj).some((item) => {
    if (typeof item === 'string') return !!item.trim();
    if (typeof item === 'number') return Number.isFinite(item);
    if (typeof item === 'boolean') return true;
    if (Array.isArray(item)) return item.some((entry) => safeStr(entry));
    if (item && typeof item === 'object') return hasNonEmptyObject(item);
    return false;
  });
}

function hasMeaningfulApplicationCache(userDoc) {
  const app = asObj(userDoc?.application);
  if (!app) return false;
  return (
    hasAnyScalar([
      app?.username,
      app?.fullName,
      app?.age,
      app?.gender,
      app?.city,
      app?.country,
      app?.nationality,
      app?.lookingForGender,
      app?.lookingForNationality,
      app?.whatsapp,
      app?.instagram,
      app?.about,
      app?.bio,
    ]) ||
    hasNonEmptyArray(app?.photoUrls) ||
    hasNonEmptyArray(app?.photoPaths) ||
    hasNonEmptyObject(app?.details) ||
    hasNonEmptyObject(app?.partnerPreferences)
  );
}

function hasMeaningfulProfileCache(userDoc) {
  const u = asObj(userDoc);
  if (!u) return false;
  const pp = asObj(u?.publicProfile);
  return (
    hasAnyScalar([
      u?.userCode,
      u?.username,
      u?.fullName,
      u?.age,
      u?.gender,
      u?.city,
      u?.country,
      u?.nationality,
      pp?.username,
      pp?.fullName,
      pp?.age,
      pp?.gender,
      pp?.city,
      pp?.country,
      pp?.nationality,
      getAnyAboutFromUserDoc(u),
    ]) ||
    hasNonEmptyArray(u?.photoUrls) ||
    hasNonEmptyArray(u?.photoPaths) ||
    !!safeStr(u?.photoPath) ||
    hasNonEmptyArray(pp?.photoUrls) ||
    hasNonEmptyArray(pp?.photoPaths) ||
    !!safeStr(pp?.photoPath) ||
    hasNonEmptyObject(u?.details) ||
    hasNonEmptyObject(pp?.details)
  );
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    const s = safeStr(value);
    if (s) return s;
  }
  return '';
}

function pickFirstAge(...values) {
  for (const value of values) {
    const age = parseAge(value);
    if (age !== null) return age;
  }
  return null;
}

function mergeUniqueStrings(...lists) {
  const out = [];
  for (const list of lists) {
    const arr = Array.isArray(list) ? list : [];
    for (const item of arr) {
      const s = safeStr(item);
      if (!s || out.includes(s)) continue;
      out.push(s);
    }
  }
  return out;
}

function buildProfileCacheApplication(userDoc, uid = '') {
  const u = asObj(userDoc);
  if (!u || !hasMeaningfulProfileCache(u)) return null;

  const pp = asObj(u?.publicProfile);
  const app = asObj(u?.application);
  const userDetails = asObj(u?.details);
  const ppDetails = asObj(pp?.details);
  const appDetails = asObj(app?.details);
  const details = {
    ...(ppDetails || {}),
    ...(userDetails || {}),
    ...(appDetails || {}),
  };

  return {
    id: safeStr(u?.applicationId) || 'user_profile_cache',
    userId: safeStr(uid) || null,
    source: 'user_profile_cache',
    username: pickFirstNonEmpty(u?.username, pp?.username, app?.username),
    fullName: pickFirstNonEmpty(u?.fullName, pp?.fullName, app?.fullName),
    age: pickFirstAge(u?.age, pp?.age, app?.age),
    gender: pickFirstNonEmpty(u?.gender, pp?.gender, app?.gender),
    city: pickFirstNonEmpty(u?.city, pp?.city, app?.city),
    country: pickFirstNonEmpty(u?.country, pp?.country, app?.country),
    nationality: pickFirstNonEmpty(u?.nationality, pp?.nationality, app?.nationality),
    lookingForGender: pickFirstNonEmpty(u?.lookingForGender, pp?.lookingForGender, app?.lookingForGender),
    lookingForNationality: pickFirstNonEmpty(u?.lookingForNationality, pp?.lookingForNationality, app?.lookingForNationality),
    whatsapp: pickFirstNonEmpty(u?.whatsapp, app?.whatsapp, userDetails?.whatsapp, appDetails?.whatsapp),
    instagram: pickFirstNonEmpty(app?.instagram, userDetails?.instagram, appDetails?.instagram),
    about: getAnyAboutFromUserDoc(u),
    photoUrls: mergeUniqueStrings(u?.photoUrls, pp?.photoUrls, app?.photoUrls, userDetails?.photoUrls, appDetails?.photoUrls),
    photoPaths: mergeUniqueStrings(u?.photoPaths, pp?.photoPaths, app?.photoPaths, userDetails?.photoPaths, appDetails?.photoPaths),
    photoPath: pickFirstNonEmpty(u?.photoPath, pp?.photoPath, app?.photoPath, userDetails?.photoPath, appDetails?.photoPath),
    partnerPreferences: asObj(app?.partnerPreferences) || null,
    details: hasNonEmptyObject(details) ? details : null,
  };
}

async function loadApplicationsForUid(db, uid, { applicationId = '', limitPerField = 25 } = {}) {
  const resolvedUid = safeStr(uid);
  if (!resolvedUid) return [];

  const uniq = new Map();
  const pushSnap = (snap) => {
    if (!snap?.exists) return;
    if (!uniq.has(snap.id)) uniq.set(snap.id, { id: snap.id, ...(snap.data() || {}) });
  };
  const pushDocs = (snap) => {
    if (!snap || snap.empty) return;
    for (const doc of snap.docs) {
      if (!uniq.has(doc.id)) uniq.set(doc.id, { id: doc.id, ...(doc.data() || {}) });
    }
  };

  const directApplicationId = safeStr(applicationId);
  if (directApplicationId) {
    try {
      const snap = await db.collection('matchmakingApplications').doc(directApplicationId).get();
      pushSnap(snap);
    } catch {
      // ignore
    }
  }

  const fields = ['userId', 'uid', 'userUid', 'ownerUid'];
  const queries = fields.map((field) => db.collection('matchmakingApplications').where(field, '==', resolvedUid).limit(limitPerField).get());
  const snaps = await Promise.allSettled(queries);
  for (const result of snaps) {
    if (result.status === 'fulfilled') pushDocs(result.value);
  }

  return Array.from(uniq.values());
}

async function loadBestAppsByUidBatch(db, uids, { limitPerField = 25 } = {}) {
  const resolvedUids = Array.from(new Set((Array.isArray(uids) ? uids : []).map((uid) => safeStr(uid)).filter(Boolean)));
  const result = new Map();
  if (!resolvedUids.length) return result;

  const fields = ['userId', 'uid', 'userUid', 'ownerUid'];
  const docsByUid = new Map();
  const chunks = [];
  for (let i = 0; i < resolvedUids.length; i += 10) chunks.push(resolvedUids.slice(i, i + 10));

  for (const chunk of chunks) {
    const queries = fields.map((field) => db.collection('matchmakingApplications').where(field, 'in', chunk).limit(Math.max(chunk.length * limitPerField, 25)).get());
    const settled = await Promise.allSettled(queries);

    for (const queryResult of settled) {
      if (queryResult.status !== 'fulfilled' || !queryResult.value || queryResult.value.empty) continue;
      for (const doc of queryResult.value.docs) {
        const data = doc.data() || {};
        const candidates = Array.from(
          new Set(
            fields
              .map((field) => safeStr(data?.[field]))
              .filter((candidateUid) => candidateUid && chunk.includes(candidateUid))
          )
        );
        for (const candidateUid of candidates) {
          const mapForUid = docsByUid.get(candidateUid) || new Map();
          if (!mapForUid.has(doc.id)) mapForUid.set(doc.id, { id: doc.id, ...data });
          docsByUid.set(candidateUid, mapForUid);
        }
      }
    }
  }

  for (const uid of resolvedUids) {
    const docs = docsByUid.get(uid);
    if (!docs || !docs.size) continue;
    const best = pickBestApp(Array.from(docs.values()));
    if (best) result.set(uid, best);
  }

  return result;
}

function resolveAdminApplicationState(userDoc, bestApp) {
  if (bestApp) return isStubApplication(bestApp) ? 'stub' : 'real';
  if (hasMeaningfulApplicationCache(userDoc)) {
    return isStubApplication(userDoc?.application) ? 'stub_cache' : 'cache';
  }
  if (hasMeaningfulProfileCache(userDoc)) return 'profile';
  return 'none';
}

export {
  safeStr,
  asObj,
  toMs,
  parseAge,
  normalizeGender,
  getAnyAboutFromUserDoc,
  isStubApplication,
  pickBestApp,
  hasMeaningfulApplicationCache,
  hasMeaningfulProfileCache,
  buildProfileCacheApplication,
  loadApplicationsForUid,
  loadBestAppsByUidBatch,
  resolveAdminApplicationState,
};