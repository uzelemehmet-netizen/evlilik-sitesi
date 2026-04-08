import { getAdmin, getAdminEmails, isAdminEmail, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { hasSubmittedMatchmakingProfileInUserDoc, normalizeGender, resolveLookingForGender } from './_matchmakingEligibility.js';
import { hasAnyMatchmakingProfileInUserDoc, hasMinimumMatchmakingProfileInApplicationDoc, isStubMatchmakingApplication } from '../src/utils/matchmakingProfileCompletion.js';
import { getBlockedUserIds, hasBlockedUser } from './_matchmakingBlocks.js';

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

function lastSeenMsFromUserDoc(userDoc) {
  const ms = typeof userDoc?.lastSeenAtMs === 'number' && Number.isFinite(userDoc.lastSeenAtMs) ? userDoc.lastSeenAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(userDoc?.lastSeenAt);
  return ts > 0 ? ts : 0;
}

function isIdentityVerifiedUserDoc(userDoc) {
  if (userDoc?.identityVerified === true) return true;
  const st = String(userDoc?.identityVerification?.status || '').toLowerCase().trim();
  return st === 'verified' || st === 'approved';
}

const MIN_AGE = 18;

function toNumOrNull(v, { min, max } = {}) {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  if (typeof min === 'number' && n < min) return null;
  if (typeof max === 'number' && n > max) return null;
  return n;
}

function ageFromBirthYearMaybe(v) {
  const year = toNumOrNull(v, { min: 1900, max: 2100 });
  if (year === null) return null;
  const now = new Date();
  const age = now.getFullYear() - year;
  return age >= MIN_AGE && age <= 99 ? age : null;
}

function ageFromDateMaybe(v) {
  let d = null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    d = new Date(v);
  } else if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    const parsed = Date.parse(s);
    if (Number.isFinite(parsed)) d = new Date(parsed);
  } else if (typeof v?.toDate === 'function') {
    try {
      d = v.toDate();
    } catch {
      d = null;
    }
  }

  if (!d || Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= MIN_AGE && age <= 99 ? age : null;
}

function getAge(app) {
  const direct = toNumOrNull(app?.age, { min: MIN_AGE, max: 99 });
  if (direct !== null) return direct;

  const details = app?.details || {};
  const nested = toNumOrNull(details?.age, { min: MIN_AGE, max: 99 });
  if (nested !== null) return nested;

  const byYear = ageFromBirthYearMaybe(details?.birthYear ?? app?.birthYear);
  if (byYear !== null) return byYear;

  const byDate =
    ageFromDateMaybe(details?.birthDateMs ?? app?.birthDateMs) ??
    ageFromDateMaybe(details?.birthDate ?? app?.birthDate) ??
    ageFromDateMaybe(details?.dob ?? app?.dob);
  if (byDate !== null) return byDate;

  return null;
}

function pickBestNonStubApplication(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;

  const scored = list
    .map((a) => {
      const source = safeStr(a?.source).toLowerCase();
      const isStub = source === 'auto_stub';
      const hasAge = getAge(a) !== null;
      const hasEditOnce = !!a?.userEditOnceUsedAt;
      const ms =
        (typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0) ||
        tsToMs(a?.createdAt);
      const score =
        (isStub ? 0 : 1000) +
        (hasEditOnce ? 100 : 0) +
        (hasAge ? 50 : 0) +
        (ms > 0 ? ms : 0);
      return { a, isStub, score };
    })
    .sort((x, y) => y.score - x.score);

  const bestNonStub = scored.find((x) => !x.isStub) || null;
  return bestNonStub ? bestNonStub.a : null;
}

function ageRangeFromApp(app, { ageOverride = null } = {}) {
  const age = typeof ageOverride === 'number' && Number.isFinite(ageOverride) ? ageOverride : getAge(app);
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

function poolGenderOk(viewerApp, candApp) {
  const viewerGender = normalizeGender(viewerApp?.gender);
  const viewerLookingFor = resolveLookingForGender(viewerApp?.gender, viewerApp?.lookingForGender);
  const candGender = normalizeGender(candApp?.gender);

  const viewerWants = viewerLookingFor || (viewerGender === 'male' ? 'female' : viewerGender === 'female' ? 'male' : '');

  if (viewerWants && candGender && candGender !== viewerWants) return false;
  if (viewerGender && candGender && candGender === viewerGender) return false;

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
      if (n === null) return 120;
      return Math.max(10, Math.min(1200, Math.floor(n)));
    })();

    const { db } = getAdmin();

    // Viewer application: sadece gerçek/form-submit edilmiş profil keşfeti kullanabilsin.
    const myAppsSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get();
    const myApps = myAppsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const myApp = pickBestNonStubApplication(myApps);
    let needsApplication = false;
    let viewerUserDoc = null;
    let viewerApp = myApp && hasMinimumMatchmakingProfileInApplicationDoc(myApp) ? myApp : null;

    if (!viewerApp) {
      // Bazı kullanıcıların (özellikle eski akışlarda) matchmakingApplications dokümanı olmayabilir.
      // Bu durumda "profil formu yok" varsayımı yapmak yanlış olur; matchmakingUsers dokümanından
      // "profil tamam mı" kararını minimum alan setinden çıkar.
      try {
        const snap = await db.collection('matchmakingUsers').doc(uid).get();
        const d = snap && snap.exists ? (snap.data() || {}) : {};
        viewerUserDoc = d;

        if (!hasSubmittedMatchmakingProfileInUserDoc(d)) {
          needsApplication = true;
          viewerApp = null;
        } else {
          const appFromUser = d?.application && typeof d.application === 'object' ? d.application : null;
          const publicProfile = d?.publicProfile && typeof d.publicProfile === 'object' ? d.publicProfile : null;
          const merged = {
            ...(publicProfile || {}),
            ...(appFromUser || {}),
            ...(d || {}),
            details: {
              ...((publicProfile && typeof publicProfile.details === 'object' ? publicProfile.details : {}) || {}),
              ...((appFromUser && typeof appFromUser.details === 'object' ? appFromUser.details : {}) || {}),
              ...((d?.details && typeof d.details === 'object' ? d.details : {}) || {}),
            },
          };
          void merged;

          viewerApp = {
            gender: safeStr(d?.gender || d?.publicProfile?.gender || d?.application?.gender),
            lookingForGender: safeStr(d?.lookingForGender || d?.publicProfile?.lookingForGender || d?.application?.lookingForGender),
          };
        }
      } catch {
        needsApplication = true;
        viewerApp = null;
      }
    }

    if (!viewerUserDoc) {
      try {
        const viewerSnap = await db.collection('matchmakingUsers').doc(uid).get();
        viewerUserDoc = viewerSnap.exists ? (viewerSnap.data() || {}) : {};
      } catch {
        viewerUserDoc = {};
      }
    }

    if (needsApplication || !viewerApp) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(
        JSON.stringify({
          ok: true,
          meta: {
            viewerAge: null,
            needsApplication: true,
            total: 0,
            returned: 0,
          },
          items: [],
        })
      );
      return;
    }

    const viewerAge = myApp ? getAge(myApp) : null;
    // Ürün kararı (2026-02): Keşfet'te yaş filtresi yok.
    // Minimum yaş onayı/signup tarafında kalır; keşfet/browse tarafında yaş uyumu uygulanmaz.
    const excludeUids = new Set();
    const adminExcludedUids = new Set();

    for (const adminEmail of getAdminEmails()) {
      try {
        const snap = await db.collection('matchmakingUsers').where('authEmailLower', '==', adminEmail).limit(10).get();
        snap.docs.forEach((doc) => {
          const adminUid = safeStr(doc.id);
          if (!adminUid) return;
          adminExcludedUids.add(adminUid);
          excludeUids.add(adminUid);
        });
      } catch {
        // best-effort
      }
    }

  // NOTE: Eski kayıtların bir kısmında age alanı kökte değil (details.age / birthYear / birthDate vs).
  // Bu yüzden sadece age index'ine bağlı kalırsak havuz "boş" görünebiliyor.
  // Bu endpoint düşük hacimli studio ekranı için tasarlandı: son N başvuruyu alıp yaş filtresini bellek içinde uygula.
  // Some legacy/buggy application docs may be missing createdAt. Those are excluded from
  // orderBy('createdAt') queries. Fetch from both createdAt + createdAtMs and merge.
  const candDocs = [];
  const seenDocIds = new Set();

  try {
    const snapByCreatedAt = await db
      .collection('matchmakingApplications')
      .orderBy('createdAt', 'desc')
      .limit(1200)
      .get();
    for (const d of snapByCreatedAt.docs) {
      if (seenDocIds.has(d.id)) continue;
      seenDocIds.add(d.id);
      candDocs.push(d);
    }
  } catch {
    // best-effort
  }

  try {
    const snapByCreatedAtMs = await db
      .collection('matchmakingApplications')
      .orderBy('createdAtMs', 'desc')
      .limit(1200)
      .get();
    for (const d of snapByCreatedAtMs.docs) {
      if (seenDocIds.has(d.id)) continue;
      seenDocIds.add(d.id);
      candDocs.push(d);
    }
  } catch {
    // best-effort
  }

  const bestByUid = new Map();

  const scoreApp = (a) => {
    const source = safeStr(a?.source).toLowerCase();
    const isStub = source === 'auto_stub';
    const ms =
      (typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0) || tsToMs(a?.createdAt);
    return (isStub ? 0 : 1000) + (ms > 0 ? ms : 0);
  };

  for (const d of candDocs) {
    const cand = d.data() || {};
    const candUid = safeStr(cand?.userId);
    if (!candUid || candUid === uid) continue;
    if (excludeUids.has(candUid)) continue;

    const prev = bestByUid.get(candUid);
    if (!prev) {
      bestByUid.set(candUid, { id: d.id, data: cand, score: scoreApp(cand) });
      continue;
    }

    const s = scoreApp(cand);
    if (s > prev.score) bestByUid.set(candUid, { id: d.id, data: cand, score: s });
  }

  const viewerBlockedSet = new Set(getBlockedUserIds(viewerUserDoc));
  const items = [];

  for (const [candUid, entry] of bestByUid.entries()) {
    const cand = entry?.data || {};
    const applicationId = safeStr(entry?.id);

    const source = safeStr(cand?.source).toLowerCase();
    const isStub = isStubMatchmakingApplication(cand);
    if (isStub) continue;

    const age = getAge(cand);
    const details = asObj(cand?.details);

    const dist =
      viewerAge === null || typeof age !== 'number' || !Number.isFinite(age)
        ? 999
        : Math.abs(age - viewerAge);
    const candRange = ageRangeFromApp(cand, { ageOverride: age });

    // Emniyet kemeri: gender yoksa havuza sokma.
    // Aksi halde normalizeGender('') -> '' olduğu için filtreler çalışmayıp
    // "herkes herkesi görüyor" etkisi oluşabiliyor.
    if (!normalizeGender(cand?.gender)) continue;

    const genderOk = poolGenderOk(viewerApp, cand);
    if (!genderOk) continue;

    items.push({
      uid: candUid,
      applicationId,
      dist,
      canInteract: true,
      candidateAgeMin: candRange.min,
      candidateAgeMax: candRange.max,
      createdAtMs:
        (typeof cand?.createdAtMs === 'number' && Number.isFinite(cand.createdAtMs) ? cand.createdAtMs : 0) || tsToMs(cand?.createdAt),
      profile: {
        username: safeStr(cand?.username),
        profileIncomplete: isStub,
        userCode: '',
        lastSeenAtMs: 0,
        identityVerified: false,
        age: typeof age === 'number' && Number.isFinite(age) ? age : null,
        city: safeStr(cand?.city),
        country: safeStr(cand?.country),
        gender: safeStr(cand?.gender),
        lookingForGender: safeStr(cand?.lookingForGender),
        photoUrls: Array.isArray(cand?.photoUrls) ? cand.photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 3) : [],
        about: clipText(cand?.about, 360),
        aboutTr: clipText(cand?.aboutTr, 360),
        aboutId: clipText(cand?.aboutId, 360),
        expectations: clipText(cand?.expectations, 360),
        expectationsTr: clipText(cand?.expectationsTr, 360),
        expectationsId: clipText(cand?.expectationsId, 360),
        details: {
          maritalStatus: safeStr(details?.maritalStatus),
          occupation: safeStr(details?.occupation),
          occupationTr: safeStr(details?.occupationTr),
          occupationId: safeStr(details?.occupationId),
          hasChildren: safeStr(details?.hasChildren),
          childrenCount: asNum(details?.childrenCount),
          childrenLivingSituation: safeStr(details?.childrenLivingSituation),
          heightCm: asNum(details?.heightCm),
        },
      },
    });
  }

  // UC kodlarını ekle (pool'da herkes görebilsin). Best-effort.
  try {
    const uids = items.map((x) => String(x?.uid || '')).filter(Boolean);
    const codeByUid = new Map();
    const lastSeenByUid = new Map();
    const verifiedByUid = new Map();
    const hiddenUidSet = new Set(adminExcludedUids);

    // Not: '__name__ in' sorgusu 10 UID ile sınırlı ve bazı ortamlarda
    // sorun çıkarabiliyor. Keşfet sıralamasının "her zaman" doğrulanmışları
    // üste alabilmesi için docRef üzerinden batch read yapıyoruz.
    const chunks = [];
    for (let i = 0; i < uids.length; i += 200) chunks.push(uids.slice(i, i + 200));
    for (const chunkUids of chunks) {
      const refs = chunkUids.map((id) => db.collection('matchmakingUsers').doc(id));
      let snaps = [];
      try {
        snaps = await db.getAll(...refs);
      } catch {
        snaps = await Promise.all(refs.map((r) => r.get()));
      }

      snaps.forEach((snap) => {
        if (!snap || !snap.exists) return;
        const u = snap.data() || {};
        if (isAdminEmail(u?.authEmailLower || u?.authEmail)) {
          hiddenUidSet.add(snap.id);
          return;
        }
        if (viewerBlockedSet.has(snap.id) || hasBlockedUser(u, uid)) {
          hiddenUidSet.add(snap.id);
          return;
        }
        const code = safeStr(u?.userCode) || safeStr(u?.publicProfile?.userCode);
        if (code) codeByUid.set(snap.id, code);

        verifiedByUid.set(snap.id, isIdentityVerifiedUserDoc(u));

        const lastSeenAtMs = lastSeenMsFromUserDoc(u);
        if (lastSeenAtMs > 0) lastSeenByUid.set(snap.id, lastSeenAtMs);
      });
    }

    items.forEach((it) => {
      const code = codeByUid.get(String(it?.uid || '')) || '';
      if (code && it?.profile && typeof it.profile === 'object') it.profile.userCode = code;

      const lastSeenAtMs = lastSeenByUid.get(String(it?.uid || '')) || 0;
      if (lastSeenAtMs && it?.profile && typeof it.profile === 'object') it.profile.lastSeenAtMs = lastSeenAtMs;

      const verified = verifiedByUid.get(String(it?.uid || ''));
      if (typeof verified === 'boolean' && it?.profile && typeof it.profile === 'object') it.profile.identityVerified = verified;
    });

    for (let i = items.length - 1; i >= 0; i -= 1) {
      const candUid = String(items[i]?.uid || '');
      if (candUid && hiddenUidSet.has(candUid)) items.splice(i, 1);
    }
  } catch {
    // ignore
  }

  // Sırala: doğrulanmış -> daha yeni -> uid (deterministik)
  items.sort((a, b) => {
    const av = a?.profile?.identityVerified === true ? 1 : 0;
    const bv = b?.profile?.identityVerified === true ? 1 : 0;
    return (bv - av) || (b.createdAtMs - a.createdAtMs) || a.uid.localeCompare(b.uid);
  });

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      meta: {
        viewerAge,
        needsApplication,
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

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        degraded: true,
        error,
        message: msg || 'server_error',
        meta: {
          viewerAge: null,
          needsApplication: true,
          total: 0,
          returned: 0,
        },
        items: [],
      })
    );
  }
}
