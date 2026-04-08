import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow, ensureProfileCompleteOrThrow } from './_matchmakingEligibility.js';
import { sendPushToUid } from './_push.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function asMs(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v && typeof v.toMillis === 'function') return v.toMillis();
  if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
  return 0;
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

function buildFallbackAppFromUserDoc({ uid, userDoc }) {
  const u = userDoc && typeof userDoc === 'object' ? userDoc : {};
  const app = u?.application && typeof u.application === 'object' ? u.application : {};
  const pp = u?.publicProfile && typeof u.publicProfile === 'object' ? u.publicProfile : {};
  const details = u?.details && typeof u.details === 'object' ? u.details : {};

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
    age: u?.age,
    details,
    photoUrls: Array.isArray(photoUrls) ? photoUrls.filter((x) => typeof x === 'string' && x.trim()) : [],
    about: safeStr(details?.about) || safeStr(pp?.about) || safeStr(app?.about),
    aboutTr: safeStr(details?.aboutTr) || safeStr(pp?.aboutTr) || safeStr(app?.aboutTr),
    aboutId: safeStr(details?.aboutId) || safeStr(pp?.aboutId) || safeStr(app?.aboutId),
    expectations: safeStr(details?.expectations) || safeStr(pp?.expectations) || safeStr(app?.expectations),
    expectationsTr: safeStr(details?.expectationsTr) || safeStr(pp?.expectationsTr) || safeStr(app?.expectationsTr),
    expectationsId: safeStr(details?.expectationsId) || safeStr(pp?.expectationsId) || safeStr(app?.expectationsId),
    __aboutOk: !!about,
  };
}

function isTwoStepActiveStartEnabled() {
  const mode = safeStr(process.env.MATCHMAKING_ACTIVE_START_MODE || '').toLowerCase();
  if (!mode) return true;
  return mode !== 'legacy';
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
  const about = typeof app?.about === 'string' ? app.about.trim() : '';
  const aboutTr = typeof app?.aboutTr === 'string' ? app.aboutTr.trim() : '';
  const aboutId = typeof app?.aboutId === 'string' ? app.aboutId.trim() : '';
  const expectations = typeof app?.expectations === 'string' ? app.expectations.trim() : '';
  const expectationsTr = typeof app?.expectationsTr === 'string' ? app.expectationsTr.trim() : '';
  const expectationsId = typeof app?.expectationsId === 'string' ? app.expectationsId.trim() : '';
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

const DECISIONS = new Set(['approve', 'reject']);

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
    const fromUid = safeStr(body?.fromUid);
    const decision = safeStr(body?.decision);

    if (!uid || !fromUid || uid === fromUid || !DECISIONS.has(decision)) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    // Etkileşim kuralı: cevap vermek de aksiyon sayılır.
    const meUserSnap = await db.collection('matchmakingUsers').doc(uid).get();
    const meUser = meUserSnap.exists ? (meUserSnap.data() || {}) : {};
    try {
      await ensureProfileCompleteOrThrow(db, uid);
      ensureEligibleOrThrow(meUser, '');
    } catch (e2) {
      res.statusCode = e2?.statusCode || 402;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: String(e2?.message || 'membership_required') }));
      return;
    }

    const requestId = `${fromUid}__${uid}`;
    const inboxRef = db.collection('matchmakingUsers').doc(uid).collection('inboxPreMatchRequests').doc(requestId);
    const outboxRef = db.collection('matchmakingUsers').doc(fromUid).collection('outboxPreMatchRequests').doc(requestId);

    // Match doc için gerekli minimal snapshot verilerini transaction öncesinde hazırla.
    let myApp = null;
    let otherApp = null;

    if (decision === 'approve') {
      const [myAppsSnap, otherAppsSnap] = await Promise.all([
        db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get(),
        db.collection('matchmakingApplications').where('userId', '==', fromUid).limit(10).get(),
      ]);

      const myApps = myAppsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
      const otherApps = otherAppsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

      myApp = pickBestNonStubApplication(myApps);
      otherApp = pickBestNonStubApplication(otherApps);

      if (!myApp || !otherApp) {
        const [myUserSnap, otherUserSnap] = await Promise.all([
          db.collection('matchmakingUsers').doc(uid).get(),
          db.collection('matchmakingUsers').doc(fromUid).get(),
        ]);
        const myUser = myUserSnap.exists ? (myUserSnap.data() || {}) : {};
        const otherUser = otherUserSnap.exists ? (otherUserSnap.data() || {}) : {};

        if (!myApp) {
          const fb = buildFallbackAppFromUserDoc({ uid, userDoc: myUser });
          if (fb && fb.__aboutOk) myApp = fb;
        }
        if (!otherApp) {
          const fb = buildFallbackAppFromUserDoc({ uid: fromUid, userDoc: otherUser });
          if (fb && fb.__aboutOk) otherApp = fb;
        }
      }

      if (!myApp || !otherApp) {
        res.statusCode = 404;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
        return;
      }
    }

    const nowMs = Date.now();
    let status = decision === 'approve' ? 'approved' : 'rejected';
    let matchId = '';
    let shouldNotifyReject = false;
    let shouldNotify = false;

    await db.runTransaction(async (tx) => {
      const inboxSnap = await tx.get(inboxRef);
      if (!inboxSnap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const cur = inboxSnap.data() || {};
      const curStatus = safeStr(cur?.status);

      // Idempotent
      if (decision === 'approve' && curStatus === 'approved') {
        status = 'approved';
        matchId = safeStr(cur?.matchId);
        return;
      }
      if (decision === 'reject' && curStatus === 'rejected') {
        status = 'rejected';
        return;
      }

      if (decision === 'reject' && curStatus !== 'rejected') {
        shouldNotifyReject = true;
      }

      // Non-idempotent update -> notify requester.
      shouldNotify = true;

      const patch = {
        type: 'pre_match',
        status,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
        decidedAt: FieldValue.serverTimestamp(),
        decidedAtMs: nowMs,
        decidedByUid: uid,
      };

      const userIdsSorted = [uid, fromUid].slice().sort();
      const aUserId = userIdsSorted[0];
      const bUserId = userIdsSorted[1];
      matchId = `${aUserId}__${bUserId}`;
      const legacyMatchRef = db.collection('matchmakingMatches').doc(matchId);
      const existingLegacySnap = await tx.get(legacyMatchRef);
      const existingLegacy = existingLegacySnap.exists ? (existingLegacySnap.data() || {}) : {};
      const existingLegacyStatus = safeStr(existingLegacy?.status);

      // Match oluşturma (approve)
      if (decision === 'approve' && myApp && otherApp) {
        const matchRef = legacyMatchRef;

        const [aUserSnap, bUserSnap] = await Promise.all([
          tx.get(db.collection('matchmakingUsers').doc(aUserId)),
          tx.get(db.collection('matchmakingUsers').doc(bUserId)),
        ]);
        const aUserDoc = aUserSnap.exists ? (aUserSnap.data() || {}) : null;
        const bUserDoc = bUserSnap.exists ? (bUserSnap.data() || {}) : null;

        const existing = await tx.get(matchRef);
        const existingData = existing.exists ? (existing.data() || {}) : {};
        const existingStatus = safeStr(existingData?.status);

        if (existingStatus === 'mutual_interest' || existingStatus === 'mutual_accepted' || existingStatus === 'contact_unlocked') {
          patch.matchId = matchId;
        } else {
          const approverSide = uid === aUserId ? 'a' : 'b';
          const requesterSide = fromUid === aUserId ? 'a' : 'b';
          const nextDecisions = {
            a: safeStr(existingData?.decisions?.a) || null,
            b: safeStr(existingData?.decisions?.b) || null,
          };
          nextDecisions[requesterSide] = 'accept';
          nextDecisions[approverSide] = 'accept';

          const nextMatchStatus = isTwoStepActiveStartEnabled() ? 'mutual_interest' : 'mutual_accepted';

          // App taraflarını a/b userId’ye hizala.
          const aApp = safeStr(myApp?.userId) === aUserId ? myApp : otherApp;
          const bApp = safeStr(myApp?.userId) === bUserId ? myApp : otherApp;

          const baseDoc = {
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
            status: nextMatchStatus,
            decisions: nextDecisions,
            profiles: {
              a: buildMatchProfile(aApp, aUserDoc),
              b: buildMatchProfile(bApp, bUserDoc),
            },
            createdAt: existing.exists ? existingData?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
            createdAtMs: existing.exists ? (typeof existingData?.createdAtMs === 'number' ? existingData.createdAtMs : nowMs) : nowMs,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: nowMs,
          };

          if (nextMatchStatus === 'mutual_interest') {
            baseDoc.mutualInterestAtMs = nowMs;
            baseDoc.mutualInterestAt = FieldValue.serverTimestamp();
          } else {
            baseDoc.mutualAcceptedAtMs = nowMs;
            if (!existingData?.everMutualAcceptedAtMs) {
              baseDoc.everMutualAcceptedAtMs = nowMs;
              baseDoc.everMutualAcceptedAt = FieldValue.serverTimestamp();
            }
            baseDoc.interactionMode = existingData?.interactionMode || 'chat';
            baseDoc.interactionChosenAt = existingData?.interactionChosenAt || FieldValue.serverTimestamp();
            baseDoc.chatEnabledAt = existingData?.chatEnabledAt || FieldValue.serverTimestamp();
            baseDoc.chatEnabledAtMs = typeof existingData?.chatEnabledAtMs === 'number' ? existingData.chatEnabledAtMs : nowMs;
          }

          // Eğer match daha önce cancelled ise tekrar aç.
          if (safeStr(existingData?.status) === 'cancelled') {
            baseDoc.cancelledAt = FieldValue.delete();
            baseDoc.cancelledAtMs = FieldValue.delete();
            baseDoc.cancelledByUserId = FieldValue.delete();
            baseDoc.cancelledReason = FieldValue.delete();
          }

          tx.set(matchRef, baseDoc, { merge: true });

          patch.matchId = matchId;
        }
      }

      if (decision === 'reject' && existingLegacySnap.exists && existingLegacyStatus === 'proposed') {
        tx.set(
          legacyMatchRef,
          {
            status: 'cancelled',
            cancelledAt: FieldValue.serverTimestamp(),
            cancelledAtMs: nowMs,
            cancelledByUserId: uid,
            cancelledReason: 'pre_match_rejected',
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: nowMs,
          },
          { merge: true }
        );
      }

      tx.set(inboxRef, patch, { merge: true });
      tx.set(outboxRef, patch, { merge: true });
    });

    // Push to requester (best-effort).
    if (shouldNotify) {
      try {
        await sendPushToUid({
          uid: fromUid,
          title: status === 'approved' ? 'Ön eşleşme onayı' : 'Ön eşleşme yanıtı',
          body: status === 'approved' ? 'Ön eşleşme isteğiniz kabul edildi.' : 'Ön eşleşme isteğiniz reddedildi.',
          url: '/profilim',
          type: status === 'approved' ? 'pre_match_approved' : 'pre_match_rejected',
          data: {
            byUid: uid,
            ...(matchId ? { matchId } : {}),
          },
        });
      } catch {
        // ignore
      }
    }

    if (decision === 'reject' && shouldNotifyReject) {
      const systemProfile = { username: 'Sistem', age: null, city: '', photoUrl: '' };
      const messageId = `notice_rejected__pre_match__${requestId}`;
      const msgRef = db.collection('matchmakingUsers').doc(fromUid).collection('inboxMessages').doc(messageId);
      const msg = {
        type: 'system_notice',
        status: 'delivered',
        fromUid: 'system',
        toUid: fromUid,
        fromProfile: systemProfile,
        text: 'Ön eşleşme isteğiniz reddedildi.',
        relatedRequestId: requestId,
        relatedType: 'pre_match',
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: nowMs,
        readAtMs: 0,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
      };
      await msgRef.set(msg, { merge: true });
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status, matchId: matchId || null }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
