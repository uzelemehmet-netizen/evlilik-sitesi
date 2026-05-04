import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { sendPushToUid } from './_push.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asObj(v) {
  return v && typeof v === 'object' ? v : {};
}

function mergeProfileSources({ userDoc, applicationDoc }) {
  const user = asObj(userDoc);
  const publicProfile = asObj(user?.publicProfile);
  const appFromUser = asObj(user?.application);
  const app = asObj(applicationDoc);

  const merged = {
    ...publicProfile,
    ...appFromUser,
    ...app,
    ...user,
    details: {
      ...asObj(publicProfile?.details),
      ...asObj(appFromUser?.details),
      ...asObj(app?.details),
      ...asObj(user?.details),
    },
    partnerPreferences: {
      ...asObj(publicProfile?.partnerPreferences),
      ...asObj(appFromUser?.partnerPreferences),
      ...asObj(app?.partnerPreferences),
      ...asObj(user?.partnerPreferences),
    },
  };

  return merged;
}

function hasDirectPeopleListAccess(item) {
  const data = item && typeof item === 'object' ? item : {};
  const type = safeStr(data?.type);
  const status = safeStr(data?.status);
  if (type !== 'people_list') return false;
  if (!status) return true;
  return status !== 'rejected' && status !== 'cancelled';
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
    const silent = body?.silent === true || String(body?.silent || '').trim().toLowerCase() === 'true' || String(body?.silent || '').trim() === '1';

    if (!uid || !targetUid || uid === targetUid) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    const requestId = `${uid}__${targetUid}`;
    const [grantSnap, peopleListSnap, directInboxSnap, directOutboxSnap] = await Promise.all([
      db.collection('matchmakingUsers').doc(targetUid).collection('profileAccessGranted').doc(uid).get(),
      db.collection('matchmakingUsers').doc(uid).collection('outboxPreMatchRequests').doc(requestId).get(),
      db.collection('matchmakingUsers').doc(uid).collection('inboxMessages').where('fromUid', '==', targetUid).limit(1).get(),
      db.collection('matchmakingUsers').doc(uid).collection('outboxMessages').where('toUid', '==', targetUid).limit(1).get(),
    ]);

    const hasDirectMessageAccess = !directInboxSnap.empty || !directOutboxSnap.empty;
    const hasAccess = grantSnap.exists || (peopleListSnap.exists && hasDirectPeopleListAccess(peopleListSnap.data() || {})) || hasDirectMessageAccess;

    if (!hasAccess) {
      res.statusCode = 403;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'no_access' }));
      return;
    }

    const appsSnap = await db.collection('matchmakingApplications').where('userId', '==', targetUid).limit(10).get();
    const apps = appsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const app = pickBestNonStubApplication(apps);
    if (!app) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
      return;
    }

    let userCode = '';
    let userCodeNo = null;
    let userDoc = {};
    try {
      const userSnap = await db.collection('matchmakingUsers').doc(targetUid).get();
      userDoc = userSnap.exists ? userSnap.data() || {} : {};
      userCode = safeStr(userDoc?.userCode) || safeStr(userDoc?.publicProfile?.userCode);
      const n = typeof userDoc?.userCodeNo === 'number' && Number.isFinite(userDoc.userCodeNo)
        ? userDoc.userCodeNo
        : (typeof userDoc?.publicProfile?.userCodeNo === 'number' && Number.isFinite(userDoc.publicProfile.userCodeNo)
            ? userDoc.publicProfile.userCodeNo
            : null);
      userCodeNo = n;
    } catch {
      userDoc = {};
    }

    const merged = mergeProfileSources({ userDoc, applicationDoc: app });
    const details = asObj(merged?.details);
    const partnerPreferences = asObj(merged?.partnerPreferences);
    const photoUrls = Array.isArray(merged?.photoUrls)
      ? merged.photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 8)
      : [];

    const profile = {
      uid: targetUid,
      applicationId: safeStr(app?.id),
      userCode,
      userCodeNo,
      username: safeStr(merged?.username),
      fullName: safeStr(merged?.fullName),
      age: asNum(merged?.age),
      city: safeStr(merged?.city),
      country: safeStr(merged?.country),
      nationality: safeStr(merged?.nationality),
      gender: safeStr(merged?.gender),
      lookingForNationality: safeStr(merged?.lookingForNationality),
      lookingForGender: safeStr(merged?.lookingForGender),
      photoUrls,
      about: safeStr(merged?.about),
      aboutTr: safeStr(merged?.aboutTr),
      aboutId: safeStr(merged?.aboutId),
      expectations: safeStr(merged?.expectations),
      expectationsTr: safeStr(merged?.expectationsTr),
      expectationsId: safeStr(merged?.expectationsId),
      details,
      partnerPreferences,
    };

    if (!silent) {
      // Profile view notify (best-effort, throttled per viewer->target).
      let shouldNotify = false;
      try {
        const viewRef = db.collection('matchmakingUsers').doc(targetUid).collection('profileViews').doc(uid);
        const nowMs = Date.now();
        const minGapMs = 6 * 60 * 60 * 1000; // 6h
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(viewRef);
          const cur = snap.exists ? snap.data() || {} : {};
          const lastNotifiedAtMs = typeof cur.lastNotifiedAtMs === 'number' && Number.isFinite(cur.lastNotifiedAtMs) ? cur.lastNotifiedAtMs : 0;
          const allow = !lastNotifiedAtMs || nowMs - lastNotifiedAtMs >= minGapMs;
          shouldNotify = allow;
          tx.set(
            viewRef,
            {
              viewerUid: uid,
              targetUid,
              lastViewedAt: FieldValue.serverTimestamp(),
              lastViewedAtMs: nowMs,
              ...(allow ? { lastNotifiedAt: FieldValue.serverTimestamp(), lastNotifiedAtMs: nowMs } : {}),
            },
            { merge: true }
          );
        });
      } catch {
        // ignore
      }

      if (shouldNotify) {
        try {
          await sendPushToUid({
            uid: targetUid,
            title: 'Profil görüntülendi',
            body: 'Profilinizi görüntüleyen biri var.',
            url: '/profilim',
            type: 'profile_view',
            data: {
              fromUid: uid,
            },
          });
        } catch {
          // ignore
        }
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, profile }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
