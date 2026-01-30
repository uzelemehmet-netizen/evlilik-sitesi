import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

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

    if (!uid || !targetUid || uid === targetUid) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db } = getAdmin();

    const grantSnap = await db
      .collection('matchmakingUsers')
      .doc(targetUid)
      .collection('profileAccessGranted')
      .doc(uid)
      .get();

    if (!grantSnap.exists) {
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

    const details = asObj(app?.details);

    const profile = {
      uid: targetUid,
      applicationId: safeStr(app?.id),
      username: safeStr(app?.username),
      age: asNum(app?.age),
      city: safeStr(app?.city),
      country: safeStr(app?.country),
      gender: safeStr(app?.gender),
      lookingForGender: safeStr(app?.lookingForGender),
      photoUrls: Array.isArray(app?.photoUrls) ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 8) : [],
      about: safeStr(app?.about),
      expectations: safeStr(app?.expectations),
      details: {
        maritalStatus: safeStr(details?.maritalStatus),
        occupation: safeStr(details?.occupation),
        hasChildren: safeStr(details?.hasChildren),
        childrenCount: asNum(details?.childrenCount),
        childrenLivingSituation: safeStr(details?.childrenLivingSituation),
        heightCm: asNum(details?.heightCm),
      },
    };

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, profile }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
