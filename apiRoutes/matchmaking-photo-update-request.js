import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function scoreApplication(a) {
  let s = 0;
  const source = safeStr(a?.source).toLowerCase();
  if (source && source !== 'auto_stub') s += 100;
  if (safeStr(a?.username)) s += 20;
  if (typeof a?.profileNo === 'number' && Number.isFinite(a.profileNo)) s += 10;
  if (Array.isArray(a?.photoUrls) && a.photoUrls.length) s += 5;
  const ms =
    (typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0) ||
    (typeof a?.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0);
  if (ms > 0) s += Math.min(3, Math.floor(ms / 1e12));
  return s;
}

function pickBestApplication(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;
  let best = list[0];
  let bestScore = scoreApplication(best);
  for (let i = 1; i < list.length; i += 1) {
    const cand = list[i];
    const candScore = scoreApplication(cand);
    if (candScore > bestScore) {
      best = cand;
      bestScore = candScore;
    }
  }
  return best;
}

function normalizePhotoSlots(v) {
  const raw = Array.isArray(v) ? v : [];
  return raw
    .slice(0, 5)
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .map((s) => (s ? s : ''));
}

function countNonEmpty(arr) {
  const list = Array.isArray(arr) ? arr : [];
  let n = 0;
  for (const v of list) {
    if (typeof v === 'string' && v.trim()) n++;
  }
  return n;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const body = normalizeBody(req);
    const requestedApplicationId = safeStr(body?.applicationId);
    const photoUrlsBySlot = normalizePhotoSlots(body?.photoUrls);
    const providedCount = countNonEmpty(photoUrlsBySlot);

    if (providedCount < 1 || providedCount > 5) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    let appRef = null;
    if (requestedApplicationId) {
      appRef = db.collection('matchmakingApplications').doc(requestedApplicationId);
    } else {
      // NOTE: Historically this endpoint used limit(1) which can pick the wrong doc
      // when multiple applications exist. We pick the best candidate (similar to Panel).
      const appsSnap = await db
        .collection('matchmakingApplications')
        .where('userId', '==', uid)
        .limit(20)
        .get();

      const items = (appsSnap.docs || []).map((d) => ({ id: d.id, ...(d.data() || {}) }));
      const best = pickBestApplication(items);
      const bestId = safeStr(best?.id);
      if (!bestId) {
        res.statusCode = 404;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
        return;
      }
      appRef = db.collection('matchmakingApplications').doc(bestId);
    }

    let applicationId = '';
    const userRef = db.collection('matchmakingUsers').doc(uid);

    await db.runTransaction(async (tx) => {
      const appSnap = await tx.get(appRef);
      if (!appSnap.exists) {
        const err = new Error('application_not_found');
        err.statusCode = 404;
        throw err;
      }

      const app = appSnap.data() || {};
      if (safeStr(app?.userId) !== safeStr(uid)) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }
      applicationId = appRef.id;
      const now = FieldValue.serverTimestamp();

      const finalUrls = photoUrlsBySlot.filter(Boolean).slice(0, 5);

      tx.set(
        appRef,
        {
          photoUrls: finalUrls,
          photoUpdate: FieldValue.delete(),
          updatedAt: now,
        },
        { merge: true }
      );

      tx.set(
        userRef,
        {
          photoUrls: finalUrls,
          application: {
            photoUrls: finalUrls,
          },
          publicProfile: {
            photoUrls: finalUrls,
          },
          updatedAt: now,
        },
        { merge: true }
      );
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, applicationId }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
