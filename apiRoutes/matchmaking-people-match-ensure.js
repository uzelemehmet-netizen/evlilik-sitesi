import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureProfileCompleteOrThrow, hasSubmittedMatchmakingProfileInUserDoc, normalizeGender, resolveLookingForGender } from './_matchmakingEligibility.js';
import { fetchMatchmakingApplicationsByUid } from './_matchmakingApplications.js';
import { isEitherUserBlocked } from './_matchmakingBlocks.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
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
      return { a, score: (isStub ? 0 : 1000) + ms };
    })
    .sort((x, y) => y.score - x.score);

  const bestNonStub = scored.find((x) => x.score >= 1000) || null;
  return bestNonStub ? bestNonStub.a : null;
}

function buildFallbackAppFromUserDoc({ uid, userDoc }) {
  const u = userDoc && typeof userDoc === 'object' ? userDoc : {};
  const app = u?.application && typeof u.application === 'object' ? u.application : {};
  const pp = u?.publicProfile && typeof u.publicProfile === 'object' ? u.publicProfile : {};
  const details = u?.details && typeof u.details === 'object' ? u.details : {};

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
    age: u?.age,
    details,
    photoUrls: Array.isArray(photoUrls) ? photoUrls.filter((x) => typeof x === 'string' && x.trim()) : [],
    about: safeStr(details?.about) || safeStr(pp?.about) || safeStr(app?.about),
    aboutTr: safeStr(details?.aboutTr) || safeStr(pp?.aboutTr) || safeStr(app?.aboutTr),
    aboutId: safeStr(details?.aboutId) || safeStr(pp?.aboutId) || safeStr(app?.aboutId),
    expectations: safeStr(details?.expectations) || safeStr(pp?.expectations) || safeStr(app?.expectations),
    expectationsTr: safeStr(details?.expectationsTr) || safeStr(pp?.expectationsTr) || safeStr(app?.expectationsTr),
    expectationsId: safeStr(details?.expectationsId) || safeStr(pp?.expectationsId) || safeStr(app?.expectationsId),
  };
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

function buildMatchProfile(app, userDoc) {
  const details = app?.details || {};
  const clip = (s, maxLen) => {
    const v = typeof s === 'string' ? s.trim() : '';
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
    about: clip(app?.about, 360),
    aboutTr: clip(app?.aboutTr, 360),
    aboutId: clip(app?.aboutId, 360),
    expectations: clip(app?.expectations, 360),
    expectationsTr: clip(app?.expectationsTr, 360),
    expectationsId: clip(app?.expectationsId, 360),
    details: {
      maritalStatus: safeStr(details?.maritalStatus),
      occupation: safeStr(details?.occupation),
      hasChildren: safeStr(details?.hasChildren),
      childrenCount: asNum(details?.childrenCount),
      childrenLivingSituation: safeStr(details?.childrenLivingSituation),
    },
  };
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
    await ensureProfileCompleteOrThrow(db, uid);

    const [myApps, targetApps, myUserSnap, targetUserSnap] = await Promise.all([
      fetchMatchmakingApplicationsByUid(db, uid, { limit: 10 }),
      fetchMatchmakingApplicationsByUid(db, targetUid, { limit: 10 }),
      db.collection('matchmakingUsers').doc(uid).get(),
      db.collection('matchmakingUsers').doc(targetUid).get(),
    ]);

    let myApp = pickBestNonStubApplication(myApps);
    let targetApp = pickBestNonStubApplication(targetApps);

    const myUser = myUserSnap.exists ? (myUserSnap.data() || {}) : {};
    const targetUser = targetUserSnap.exists ? (targetUserSnap.data() || {}) : {};

    if (isEitherUserBlocked({ aUserDoc: myUser, aUid: uid, bUserDoc: targetUser, bUid: targetUid })) {
      res.statusCode = 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'blocked_user_pair' }));
      return;
    }

    if (!myApp && hasSubmittedMatchmakingProfileInUserDoc(myUser)) myApp = buildFallbackAppFromUserDoc({ uid, userDoc: myUser });
    if (!targetApp && hasSubmittedMatchmakingProfileInUserDoc(targetUser)) targetApp = buildFallbackAppFromUserDoc({ uid: targetUid, userDoc: targetUser });

    if (!myApp || !targetApp) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
      return;
    }

    const rule = myPoolRuleOk({ requesterApp: myApp, targetApp });
    if (!rule.ok) {
      res.statusCode = 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: rule.reason }));
      return;
    }

    const userIdsSorted = [uid, targetUid].slice().sort();
    const aUserId = userIdsSorted[0];
    const bUserId = userIdsSorted[1];
    const matchId = `${aUserId}__${bUserId}`;
    const matchRef = db.collection('matchmakingMatches').doc(matchId);
    const nowMs = Date.now();

    await db.runTransaction(async (tx) => {
      const existing = await tx.get(matchRef);
      if (existing.exists) return;

      const aApp = safeStr(myApp?.userId) === aUserId ? myApp : targetApp;
      const bApp = safeStr(myApp?.userId) === bUserId ? myApp : targetApp;
      const aUserDoc = aUserId === uid ? myUser : targetUser;
      const bUserDoc = bUserId === targetUid ? targetUser : myUser;

      tx.set(matchRef, {
        userIds: userIdsSorted,
        aUserId,
        bUserId,
        aApplicationId: safeStr(aApp?.id),
        bApplicationId: safeStr(bApp?.id),
        scoreAtoB: null,
        scoreBtoA: null,
        score: null,
        matchTier: 'pre_match',
        createdBy: 'people_list_like',
        status: 'proposed',
        decisions: { a: null, b: null },
        profiles: {
          a: buildMatchProfile(aApp, aUserDoc),
          b: buildMatchProfile(bApp, bUserDoc),
        },
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: nowMs,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
      });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, matchId }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}