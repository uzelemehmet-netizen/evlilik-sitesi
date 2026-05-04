import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow, ensureProfileCompleteOrThrow, normalizeGender, resolveLookingForGender } from './_matchmakingEligibility.js';
import { ensureRequesterAllowedByTargetInteractionFilter } from './_matchmakingInteractionFilter.js';
import { sendPushToUid } from './_push.js';
import { fetchMatchmakingApplicationsByUid } from './_matchmakingApplications.js';
import { isEitherUserBlocked } from './_matchmakingBlocks.js';

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

function isIdentityVerifiedUserDoc(userDoc) {
  if (userDoc?.identityVerified === true) return true;
  const st = String(userDoc?.identityVerification?.status || '').toLowerCase().trim();
  return st === 'verified' || st === 'approved';
}

function isMembershipActiveUserDoc(userDoc) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > Date.now();
}

function buildLegacyMatchProfile(app, userDoc) {
  const details = app?.details || {};
  const about = safeStr(app?.about);
  const aboutTr = safeStr(app?.aboutTr);
  const aboutId = safeStr(app?.aboutId);
  const expectations = safeStr(app?.expectations);
  const expectationsTr = safeStr(app?.expectationsTr);
  const expectationsId = safeStr(app?.expectationsId);
  const clip = (s, maxLen) => {
    const v = safeStr(s);
    if (!v) return '';
    return v.length > maxLen ? v.slice(0, maxLen) : v;
  };

  return {
    identityVerified: !!(userDoc && isIdentityVerifiedUserDoc(userDoc)),
    membershipActive: !!(userDoc && isMembershipActiveUserDoc(userDoc)),
    membershipPlan: safeStr(userDoc?.membership?.plan || userDoc?.membershipPlan),
    proMember: !!(userDoc && isMembershipActiveUserDoc(userDoc) && String(userDoc?.membership?.plan || userDoc?.membershipPlan || '') === 'pro'),
    userCode: safeStr(userDoc?.userCode) || safeStr(userDoc?.publicProfile?.userCode),
    userCodeNo:
      typeof userDoc?.userCodeNo === 'number' && Number.isFinite(userDoc.userCodeNo)
        ? userDoc.userCodeNo
        : (typeof userDoc?.publicProfile?.userCodeNo === 'number' && Number.isFinite(userDoc.publicProfile.userCodeNo)
            ? userDoc.publicProfile.userCodeNo
            : null),
    profileNo: asNum(app?.profileNo),
    profileCode: safeStr(app?.profileCode) || (typeof app?.profileNo === 'number' ? `MK-${app.profileNo}` : ''),
    username: safeStr(app?.username),
    age: typeof app?.age === 'number' ? app.age : Number.isFinite(Number(app?.age)) ? Number(app.age) : null,
    gender: safeStr(app?.gender),
    city: safeStr(app?.city),
    country: safeStr(app?.country),
    photoUrls: Array.isArray(app?.photoUrls) ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [],
    about: clip(about, 360),
    aboutTr: clip(aboutTr, 360),
    aboutId: clip(aboutId, 360),
    expectations: clip(expectations, 360),
    expectationsTr: clip(expectationsTr, 360),
    expectationsId: clip(expectationsId, 360),
    details: {
      maritalStatus: safeStr(details?.maritalStatus),
      occupation: safeStr(details?.occupation),
      hasChildren: safeStr(details?.hasChildren),
      childrenCount: asNum(details?.childrenCount),
      childrenLivingSituation: safeStr(details?.childrenLivingSituation),
    },
  };
}

function ageRangeFromApp(app, { ageOverride = null } = {}) {
  const age = typeof ageOverride === 'number' && Number.isFinite(ageOverride) ? ageOverride : getAge(app);
  const partner = asObj(app?.partnerPreferences);

  const sanitizePref = (n) => (n !== null && n >= 18 && n <= 99 ? n : null);
  const min = sanitizePref(asNum(partner?.ageMin));
  const max = sanitizePref(asNum(partner?.ageMax));
  if (min !== null || max !== null) {
    const a = age ?? 30;
    const outMin = min !== null ? min : Math.max(18, a - 5);
    const outMax = max !== null ? max : Math.min(99, a + 5);
    const finalMin = Math.max(18, Math.min(99, outMin));
    let finalMax = Math.max(18, Math.min(99, outMax));
    if (finalMax < finalMin) finalMax = finalMin;
    return { min: finalMin, max: finalMax };
  }

  const olderRaw = asNum(partner?.ageMaxOlderYears);
  const youngerRaw = asNum(partner?.ageMaxYoungerYears);
  const older = olderRaw !== null && olderRaw >= 0 && olderRaw <= 99 ? olderRaw : null;
  const younger = youngerRaw !== null && youngerRaw >= 0 && youngerRaw <= 99 ? youngerRaw : null;
  if (age !== null && (older !== null || younger !== null)) {
    const outMin = age - (younger ?? 0);
    const outMax = age + (older ?? 0);
    const finalMin = Math.max(18, Math.min(99, outMin));
    let finalMax = Math.max(18, Math.min(99, outMax));
    if (finalMax < finalMin) finalMax = finalMin;
    return { min: finalMin, max: finalMax };
  }

  const a = age ?? 30;
  const finalMin = Math.max(18, Math.min(99, a - 5));
  let finalMax = Math.max(18, Math.min(99, a + 5));
  if (finalMax < finalMin) finalMax = finalMin;
  return { min: finalMin, max: finalMax };
}

function myPoolRuleOk({ requesterApp, targetApp }) {
  const requesterGender = normalizeGender(requesterApp?.gender);
  const requesterLookingFor = resolveLookingForGender(requesterApp?.gender, requesterApp?.lookingForGender);
  const targetGender = normalizeGender(targetApp?.gender);

  const requesterWants =
    requesterLookingFor ||
    (requesterGender === 'male' ? 'female' : requesterGender === 'female' ? 'male' : '');

  if (requesterWants && targetGender && targetGender !== requesterWants) return { ok: false, reason: 'gender_mismatch' };
  if (requesterGender && targetGender && requesterGender === targetGender) return { ok: false, reason: 'gender_mismatch' };

  return { ok: true };
}

function buildFromProfile(app) {
  const myPhotoUrls = Array.isArray(app?.photoUrls)
    ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 3)
    : [];

  return {
    username: safeStr(app?.username),
    age: getAge(app),
    gender: safeStr(app?.gender),
    city: safeStr(app?.city),
    maritalStatus: safeStr(app?.maritalStatus),
    education: safeStr(app?.education),
    occupation: safeStr(app?.occupation),
    hasChildren: typeof app?.hasChildren === 'boolean' ? app.hasChildren : null,
    wantChildren: typeof app?.wantChildren === 'boolean' ? app.wantChildren : null,
    about: safeStr(app?.about),
    aboutTr: safeStr(app?.aboutTr),
    aboutId: safeStr(app?.aboutId),
    expectations: safeStr(app?.expectations),
    expectationsTr: safeStr(app?.expectationsTr),
    expectationsId: safeStr(app?.expectationsId),
    photoUrl: safeStr(myPhotoUrls[0] || ''),
    photoUrls: myPhotoUrls,
  };
}

function buildTargetProfile(app) {
  const photoUrls = Array.isArray(app?.photoUrls)
    ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 4)
    : [];

  return {
    username: safeStr(app?.username),
    age: getAge(app),
    gender: safeStr(app?.gender),
    profileTextLang: safeStr(app?.profileTextLang) || safeStr(app?.details?.profileTextLang),
    city: safeStr(app?.city),
    country: safeStr(app?.country),
    maritalStatus: safeStr(app?.maritalStatus),
    education: safeStr(app?.education),
    occupation: safeStr(app?.occupation),
    hasChildren: typeof app?.hasChildren === 'boolean' ? app.hasChildren : null,
    wantChildren: typeof app?.wantChildren === 'boolean' ? app.wantChildren : null,
    about: safeStr(app?.about),
    aboutTr: safeStr(app?.aboutTr),
    aboutId: safeStr(app?.aboutId),
    expectations: safeStr(app?.expectations),
    expectationsTr: safeStr(app?.expectationsTr),
    expectationsId: safeStr(app?.expectationsId),
    photoUrl: safeStr(photoUrls[0] || ''),
    photoUrls,
    details: {
      maritalStatus: safeStr(app?.details?.maritalStatus || app?.maritalStatus),
      occupation: safeStr(app?.details?.occupation || app?.occupation),
      hasChildren: app?.details?.hasChildren ?? app?.hasChildren ?? null,
      childrenCount: asNum(app?.details?.childrenCount),
      childrenLivingSituation: safeStr(app?.details?.childrenLivingSituation),
    },
  };
}

function buildFallbackAppFromUserDoc({ uid, userDoc }) {
  const u = userDoc && typeof userDoc === 'object' ? userDoc : {};
  const app = asObj(u?.application);
  const pp = asObj(u?.publicProfile);
  const details = asObj(u?.details);

  const about =
    safeStr(details?.about) ||
    safeStr(details?.aboutTr) ||
    safeStr(details?.aboutId) ||
    safeStr(pp?.about) ||
    safeStr(pp?.aboutTr) ||
    safeStr(pp?.aboutId) ||
    safeStr(app?.about) ||
    safeStr(app?.aboutTr) ||
    safeStr(app?.aboutId);

  const photoUrls = Array.isArray(app?.photoUrls)
    ? app.photoUrls
    : Array.isArray(pp?.photoUrls)
      ? pp.photoUrls
      : Array.isArray(u?.photoUrls)
        ? u.photoUrls
        : [];

  return {
    id: '',
    userId: safeStr(uid),
    source: 'user_doc_fallback',
    username: safeStr(app?.username) || safeStr(pp?.username) || safeStr(u?.username),
    gender: safeStr(app?.gender) || safeStr(pp?.gender) || safeStr(u?.gender),
    lookingForGender: safeStr(app?.lookingForGender) || safeStr(pp?.lookingForGender) || safeStr(u?.lookingForGender),
    city: safeStr(app?.city) || safeStr(pp?.city) || safeStr(u?.city),
    country: safeStr(app?.country) || safeStr(pp?.country) || safeStr(u?.country),
    age: asNum(app?.age) ?? asNum(pp?.age) ?? asNum(u?.age),
    details,
    profileTextLang: safeStr(details?.profileTextLang) || safeStr(pp?.profileTextLang) || safeStr(app?.profileTextLang),
    photoUrls: Array.isArray(photoUrls) ? photoUrls.filter((x) => typeof x === 'string' && x.trim()) : [],
    about: safeStr(details?.about) || safeStr(pp?.about) || safeStr(app?.about),
    aboutTr: safeStr(details?.aboutTr) || safeStr(pp?.aboutTr) || safeStr(app?.aboutTr),
    aboutId: safeStr(details?.aboutId) || safeStr(pp?.aboutId) || safeStr(app?.aboutId),
    expectations: safeStr(details?.expectations) || safeStr(pp?.expectations) || safeStr(app?.expectations),
    expectationsTr: safeStr(details?.expectationsTr) || safeStr(pp?.expectationsTr) || safeStr(app?.expectationsTr),
    expectationsId: safeStr(details?.expectationsId) || safeStr(pp?.expectationsId) || safeStr(app?.expectationsId),
    maritalStatus: safeStr(details?.maritalStatus),
    occupation: safeStr(details?.occupation),
    education: safeStr(details?.education),
    hasChildren: details?.hasChildren,
    wantChildren: details?.wantChildren,
    __aboutOk: !!about,
  };
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

    const body = normalizeBody(req);
    const targetUid = safeStr(body?.targetUid);

    if (!uid || !targetUid || uid === targetUid) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    const [myApps, targetApps, meUserSnap, targetUserSnap] = await Promise.all([
      fetchMatchmakingApplicationsByUid(db, uid, { limit: 10 }),
      fetchMatchmakingApplicationsByUid(db, targetUid, { limit: 10 }),
      db.collection('matchmakingUsers').doc(uid).get(),
      db.collection('matchmakingUsers').doc(targetUid).get(),
    ]);

    let myApp = pickBestNonStubApplication(myApps);
    const targetApp = pickBestNonStubApplication(targetApps);

    const meUser = meUserSnap.exists ? (meUserSnap.data() || {}) : {};
    const targetUser = targetUserSnap.exists ? (targetUserSnap.data() || {}) : {};
    if (isEitherUserBlocked({ aUserDoc: meUser, aUid: uid, bUserDoc: targetUser, bUid: targetUid })) {
      res.statusCode = 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'blocked_user_pair' }));
      return;
    }
    if (!myApp) {
      const fb = buildFallbackAppFromUserDoc({ uid, userDoc: meUser });
      if (fb && fb.__aboutOk) myApp = fb;
    }

    if (!myApp || !targetApp) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
      return;
    }

    // Etkileşim kuralı: ön eşleşme isteği bir aksiyon sayılır.
    try {
      await ensureProfileCompleteOrThrow(db, uid);
      ensureEligibleOrThrow(meUser, '');
    } catch (e2) {
      res.statusCode = e2?.statusCode || 402;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: String(e2?.message || 'membership_required') }));
      return;
    }

    const rule = myPoolRuleOk({ requesterApp: myApp, targetApp });
    if (!rule.ok) {
      // Ürün kararı (2026-02): yaş aralığı kuralı yok. Sadece temel uyuşmazlıklarda (örn. cinsiyet) engelle.
      res.statusCode = 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: rule.reason }));
      return;
    }

    const interactionGate = ensureRequesterAllowedByTargetInteractionFilter({
      targetUserDoc: targetUser,
      requesterUserDoc: meUser,
      requesterApp: myApp,
    });
    if (!interactionGate.ok) {
      res.statusCode = interactionGate.reason === 'interaction_filter_age_required' ? 400 : 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: interactionGate.reason }));
      return;
    }

    const nowMs = Date.now();
    const requestId = `${uid}__${targetUid}`;
    const userIdsSorted = [uid, targetUid].slice().sort();
    const aUserId = userIdsSorted[0];
    const bUserId = userIdsSorted[1];
    const requesterSide = uid === aUserId ? 'a' : 'b';
    const targetSide = requesterSide === 'a' ? 'b' : 'a';
    const legacyMatchId = `${aUserId}__${bUserId}`;
    const aApp = safeStr(myApp?.userId) === aUserId ? myApp : targetApp;
    const bApp = safeStr(myApp?.userId) === bUserId ? myApp : targetApp;
    const aUserDoc = aUserId === uid ? meUser : targetUser;
    const bUserDoc = bUserId === uid ? meUser : targetUser;

    let shouldNotify = false;

    const inboxRef = db.collection('matchmakingUsers').doc(targetUid).collection('inboxPreMatchRequests').doc(requestId);
    const outboxRef = db.collection('matchmakingUsers').doc(uid).collection('outboxPreMatchRequests').doc(requestId);
    const legacyMatchRef = db.collection('matchmakingMatches').doc(legacyMatchId);

    const payload = {
      type: 'people_list',
      status: 'pending',
      fromUid: uid,
      toUid: targetUid,
      matchId: legacyMatchId,
      fromProfile: buildFromProfile(myApp),
      targetProfile: buildTargetProfile(targetApp),
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: nowMs,
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMs: nowMs,
    };

    await db.runTransaction(async (tx) => {
      const [existingOut, existingMatchSnap] = await Promise.all([tx.get(outboxRef), tx.get(legacyMatchRef)]);
      const existingMatch = existingMatchSnap.exists ? (existingMatchSnap.data() || {}) : {};
      const existingMatchStatus = safeStr(existingMatch?.status);

      const ensureLegacyMirrorMatch = () => {
        if (existingMatchStatus === 'mutual_interest' || existingMatchStatus === 'mutual_accepted' || existingMatchStatus === 'contact_unlocked') {
          return;
        }

        const existingDecisions = existingMatch?.decisions && typeof existingMatch.decisions === 'object' ? existingMatch.decisions : {};
        const nextDecisions = {
          a: safeStr(existingDecisions?.a) || null,
          b: safeStr(existingDecisions?.b) || null,
        };
        nextDecisions[requesterSide] = 'accept';
        if (existingMatchStatus === 'cancelled') nextDecisions[targetSide] = null;

        const legacyDoc = {
          userIds: userIdsSorted,
          aUserId,
          bUserId,
          aApplicationId: safeStr(aApp?.id),
          bApplicationId: safeStr(bApp?.id),
          scoreAtoB: null,
          scoreBtoA: null,
          score: null,
          matchTier: 'pre_match',
          createdBy: 'pre_match_request',
          status: 'proposed',
          decisions: nextDecisions,
          profiles: {
            a: buildLegacyMatchProfile(aApp, aUserDoc),
            b: buildLegacyMatchProfile(bApp, bUserDoc),
          },
          createdAt: existingMatchSnap.exists ? existingMatch?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
          createdAtMs: existingMatchSnap.exists ? (typeof existingMatch?.createdAtMs === 'number' ? existingMatch.createdAtMs : nowMs) : nowMs,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
        };

        if (existingMatchStatus === 'cancelled') {
          legacyDoc.cancelledAt = FieldValue.delete();
          legacyDoc.cancelledAtMs = FieldValue.delete();
          legacyDoc.cancelledByUserId = FieldValue.delete();
          legacyDoc.cancelledReason = FieldValue.delete();
        }

        tx.set(legacyMatchRef, legacyDoc, { merge: true });
      };

      if (existingOut.exists) {
        const cur = existingOut.data() || {};
        const st = safeStr(cur?.status);
        if (st === 'approved') {
          ensureLegacyMirrorMatch();
          return;
        }
        if (st === 'rejected') {
          // Reddedildiyse yeni istek atmaya izin veriyoruz (status'u pending'e çeker).
          shouldNotify = true;
          tx.set(inboxRef, payload, { merge: true });
          tx.set(outboxRef, payload, { merge: true });
          ensureLegacyMirrorMatch();
          return;
        }
        // pending => sadece updatedAt tazele (yeniden bildirim atmayalım)
        tx.set(inboxRef, payload, { merge: true });
        tx.set(outboxRef, payload, { merge: true });
        ensureLegacyMirrorMatch();
        return;
      }

      shouldNotify = true;
      tx.set(inboxRef, payload, { merge: false });
      tx.set(outboxRef, payload, { merge: false });
      ensureLegacyMirrorMatch();
    });

    // Push to recipient (best-effort).
    if (shouldNotify) {
      const fromName = safeStr(myApp?.username) || 'Bir kullanici';
      try {
        await sendPushToUid({
          uid: targetUid,
          title: 'Kisilerime eklendin',
          body: `${fromName} seni kisilerine ekledi.`,
          url: '/profilim',
          type: 'people_list_added',
          data: {
            fromUid: uid,
          },
        });
      } catch {
        // ignore
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status: 'pending', type: 'people_list' }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
