import { getAdmin, requireIdToken } from './_firebaseAdmin.js';
import { ensureUserCodeAssigned } from './_matchmakingUserCode.js';
import { normalizeCompletedStubApplication } from './_matchmakingApplicationActivation.js';
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

    const userSnap = await db.collection('matchmakingUsers').doc(uid).get();
    const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};
    const normalized = await normalizeCompletedStubApplication({
      db,
      FieldValue,
      uid,
      applicationId: best.id,
      app: best,
      userDoc,
    });

    if (!normalized?.normalized) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, normalized: false, reason: normalized?.reason || 'not_completed', applicationId: best.id }));
      return;
    }

    try {
      const ensuredCode = await ensureUserCodeAssigned({ db, FieldValue, uid, gender: safeStr(best?.gender), nowMs: Date.now() });
      const userCode = safeStr(ensuredCode?.userCode);
      if (userCode) {
        await db.collection('matchmakingApplications').doc(best.id).set(
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
