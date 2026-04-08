import { getAdmin, requireIdToken } from './_firebaseAdmin.js';
import { ensureUserCodeAssigned } from './_matchmakingUserCode.js';
import { isStubMatchmakingApplication } from '../src/utils/matchmakingProfileCompletion.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
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

function appCreatedAtMs(app) {
  const ms = typeof app?.createdAtMs === 'number' && Number.isFinite(app.createdAtMs) ? app.createdAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(app?.createdAt);
  return ts > 0 ? ts : 0;
}

function isStub(app) {
  return isStubMatchmakingApplication(app);
}

function getAnyAbout(app) {
  const it = app && typeof app === 'object' ? app : null;
  if (!it) return '';

  const direct = safeStr(it?.about) || safeStr(it?.aboutTr) || safeStr(it?.aboutId);
  if (direct) return direct;

  const details = it?.details && typeof it.details === 'object' ? it.details : null;
  const detailsAbout = safeStr(details?.about) || safeStr(details?.aboutTr) || safeStr(details?.aboutId);
  if (detailsAbout) return detailsAbout;

  const pp = it?.publicProfile && typeof it.publicProfile === 'object' ? it.publicProfile : null;
  const ppAbout = safeStr(pp?.about) || safeStr(pp?.aboutTr) || safeStr(pp?.aboutId);
  return ppAbout;
}

function pickBestApp(apps) {
  const list = Array.isArray(apps) ? apps : [];
  if (!list.length) return null;

  let best = null;
  let bestScore = -Infinity;
  for (const a of list) {
    if (!a || typeof a !== 'object') continue;
    const ms = appCreatedAtMs(a);
    const score = (isStub(a) ? 0 : 1000) + (ms > 0 ? ms : 0);
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'female' || s === 'male') return s;
  return '';
}

function asNum(v) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const decoded = await requireIdToken(req);
  const uid = safeStr(decoded?.uid);
  if (!uid) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
    return;
  }

  const { db, FieldValue } = getAdmin();

  try {
    const appsSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(25).get();
    const apps = Array.isArray(appsSnap?.docs) ? appsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) })) : [];

    const best = pickBestApp(apps);
    if (!best?.id) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, normalized: false, reason: 'no_application' }));
      return;
    }

    const about = getAnyAbout(best);
    if (!about) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, normalized: false, reason: 'no_about' }));
      return;
    }

    const nowMs = Date.now();

    if (!isStub(best)) {
      await db.collection('matchmakingUsers').doc(uid).set(
        {
          applicationId: best.id,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, normalized: false, reason: 'already_normal', applicationId: best.id }));
      return;
    }

    const appRef = db.collection('matchmakingApplications').doc(best.id);
    const userRef = db.collection('matchmakingUsers').doc(uid);

    const username = safeStr(best?.username);
    const usernameLower = safeStr(best?.usernameLower) || (username ? username.toLowerCase() : '');
    const fullName = safeStr(best?.fullName);
    const age = asNum(best?.age);
    const gender = normalizeGender(best?.gender);
    const city = safeStr(best?.city);
    const country = safeStr(best?.country);
    const nationality = safeStr(best?.nationality);

    const photoUrls = Array.isArray(best?.photoUrls) ? best.photoUrls.map(String).map((s) => s.trim()).filter(Boolean) : [];
    const photoPaths = Array.isArray(best?.photoPaths) ? best.photoPaths.map(String).map((s) => s.trim()).filter(Boolean) : [];

    const aboutTr = safeStr(best?.aboutTr) || safeStr(best?.details?.aboutTr) || safeStr(best?.publicProfile?.aboutTr);
    const aboutId = safeStr(best?.aboutId) || safeStr(best?.details?.aboutId) || safeStr(best?.publicProfile?.aboutId);

    const batch = db.batch();
    batch.set(
      appRef,
      {
        source: 'apply_submit',
        details: {
          ...(best?.details && typeof best.details === 'object' ? best.details : {}),
          autoBootstrap: false,
        },
        normalizedAt: FieldValue.serverTimestamp(),
        normalizedAtMs: nowMs,
      },
      { merge: true }
    );

    batch.set(
      userRef,
      {
        applicationId: best.id,
        ...(username ? { username } : {}),
        ...(usernameLower ? { usernameLower } : {}),
        ...(fullName ? { fullName } : {}),
        ...(typeof age === 'number' ? { age } : {}),
        ...(gender ? { gender } : {}),
        ...(city ? { city } : {}),
        ...(country ? { country } : {}),
        ...(nationality ? { nationality } : {}),
        application: {
          ...(username ? { username } : {}),
          ...(usernameLower ? { usernameLower } : {}),
          ...(fullName ? { fullName } : {}),
          ...(typeof age === 'number' ? { age } : {}),
          ...(gender ? { gender } : {}),
          ...(city ? { city } : {}),
          ...(country ? { country } : {}),
          ...(nationality ? { nationality } : {}),
          ...(photoUrls.length ? { photoUrls } : {}),
          ...(photoPaths.length ? { photoPaths } : {}),
          ...(best?.details && typeof best.details === 'object' ? { details: best.details } : {}),
          ...(best?.partnerPreferences && typeof best.partnerPreferences === 'object' ? { partnerPreferences: best.partnerPreferences } : {}),
          ...(best?.profileNo !== undefined ? { profileNo: best.profileNo } : {}),
          ...(best?.profileCode ? { profileCode: safeStr(best.profileCode) } : {}),
        },
        details: {
          about,
          bio: about,
          ...(aboutTr ? { aboutTr } : {}),
          ...(aboutId ? { aboutId } : {}),
        },
        publicProfile: {
          ...(username ? { username } : {}),
          ...(usernameLower ? { usernameLower } : {}),
          ...(fullName ? { fullName } : {}),
          ...(typeof age === 'number' ? { age } : {}),
          ...(gender ? { gender } : {}),
          ...(city ? { city } : {}),
          ...(country ? { country } : {}),
          ...(nationality ? { nationality } : {}),
          ...(photoUrls.length ? { photoUrls } : {}),
          ...(photoPaths.length ? { photoPaths } : {}),
          about,
          ...(aboutTr ? { aboutTr } : {}),
          ...(aboutId ? { aboutId } : {}),
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();

    try {
      const ensuredCode = await ensureUserCodeAssigned({ db, FieldValue, uid, gender, nowMs: Date.now() });
      const userCode = safeStr(ensuredCode?.userCode);
      if (userCode) {
        await appRef.set(
          {
            userCode,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: Date.now(),
          },
          { merge: true },
        );
      }
    } catch {
      // best-effort
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, normalized: true, applicationId: best.id }));
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
