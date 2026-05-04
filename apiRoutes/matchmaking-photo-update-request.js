import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureUserCodeAssigned } from './_matchmakingUserCode.js';
import { normalizeCompletedStubApplication } from './_matchmakingApplicationActivation.js';
import { havePhotoUrlsChanged, isPhotoModerationRestricted, normalizePhotoUrls } from '../src/utils/photoModerationState.js';

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
    const authEmail = safeStr(decoded?.email).toLowerCase();
    const displayName = safeStr(decoded?.name);
    const authProvider = safeStr(decoded?.firebase?.sign_in_provider).toLowerCase();

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
    let finalUrlsForNormalization = [];
    const userRef = db.collection('matchmakingUsers').doc(uid);

    await db.runTransaction(async (tx) => {
      const appSnap = await tx.get(appRef);
      if (!appSnap.exists) {
        const err = new Error('application_not_found');
        err.statusCode = 404;
        throw err;
      }

      const app = appSnap.data() || {};
      const userSnap = await tx.get(userRef);
      const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};
      if (safeStr(app?.userId) !== safeStr(uid)) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }
      applicationId = appRef.id;
      const now = FieldValue.serverTimestamp();

      const finalUrls = photoUrlsBySlot.filter(Boolean).slice(0, 5);
      const primaryPhotoUrl = safeStr(finalUrls[0]);
      finalUrlsForNormalization = finalUrls;
      const previousUrls = normalizePhotoUrls(
        app?.photoUrls || userDoc?.application?.photoUrls || userDoc?.publicProfile?.photoUrls || userDoc?.photoUrls,
        5,
      );
      const clearPhotoRestriction = isPhotoModerationRestricted(userDoc, app) && havePhotoUrlsChanged(previousUrls, finalUrls);

      tx.set(
        appRef,
        {
          photoUrls: finalUrls,
          ...(primaryPhotoUrl
            ? {
                photoUrl: primaryPhotoUrl,
                primaryPhotoUrl,
                profilePhotoUrl: primaryPhotoUrl,
              }
            : {}),
          deferredPhotoRequiredForInteraction: false,
          ...(authEmail ? { authEmail, authEmailLower: authEmail } : {}),
          ...(displayName ? { displayName } : {}),
          ...(authProvider ? { authProvider } : {}),
          photoUpdate: FieldValue.delete(),
          ...(clearPhotoRestriction ? { photoModeration: FieldValue.delete() } : {}),
          updatedAt: now,
        },
        { merge: true }
      );

      tx.set(
        userRef,
        {
          photoUrls: finalUrls,
          ...(primaryPhotoUrl
            ? {
                photoUrl: primaryPhotoUrl,
                primaryPhotoUrl,
                profilePhotoUrl: primaryPhotoUrl,
              }
            : {}),
          deferredPhotoRequiredForInteraction: false,
          ...(authEmail ? { authEmail, authEmailLower: authEmail } : {}),
          ...(displayName ? { displayName } : {}),
          ...(authProvider ? { authProvider } : {}),
          application: {
            photoUrls: finalUrls,
            ...(primaryPhotoUrl
              ? {
                  photoUrl: primaryPhotoUrl,
                  primaryPhotoUrl,
                  profilePhotoUrl: primaryPhotoUrl,
                }
              : {}),
            deferredPhotoRequiredForInteraction: false,
          },
          publicProfile: {
            photoUrls: finalUrls,
            ...(primaryPhotoUrl
              ? {
                  photoUrl: primaryPhotoUrl,
                  primaryPhotoUrl,
                  profilePhotoUrl: primaryPhotoUrl,
                }
              : {}),
            deferredPhotoRequiredForInteraction: false,
          },
          ...(clearPhotoRestriction
            ? {
                photoModeration: FieldValue.delete(),
                'application.photoModeration': FieldValue.delete(),
                'publicProfile.photoModeration': FieldValue.delete(),
              }
            : {}),
          updatedAt: now,
        },
        { merge: true }
      );
    });

    try {
      const [appSnap, userSnap] = await Promise.all([appRef.get(), userRef.get()]);
      if (appSnap.exists && userSnap.exists) {
        await normalizeCompletedStubApplication({
          db,
          FieldValue,
          uid,
          applicationId,
          app: appSnap.data() || {},
          userDoc: userSnap.data() || {},
          finalPhotoUrls: finalUrlsForNormalization,
        });
      }
    } catch {
      // best-effort: photo update should still succeed if normalization cannot run
    }

    try {
      const userSnap = await userRef.get();
      const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};
      const ensuredCode = await ensureUserCodeAssigned({
        db,
        FieldValue,
        uid,
        gender: safeStr(userDoc?.gender || userDoc?.publicProfile?.gender || userDoc?.application?.gender),
        nowMs: Date.now(),
      });
      const userCode = safeStr(ensuredCode?.userCode);
      if (userCode) {
        await appRef.set(
          {
            userCode,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: Date.now(),
          },
          { merge: true }
        );
      }
    } catch {
      // best-effort: photo update should not fail if UC assignment cannot be completed
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, applicationId }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
