import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { buildPhotoUrlsSignature, normalizePhotoUrls, safeStr } from '../src/utils/photoModerationState.js';

function asBool(value, fallback = true) {
  if (value === undefined) return fallback;
  return !!value;
}

function pickCurrentPhotoUrls(app, userDoc) {
  return normalizePhotoUrls(
    app?.photoUrls || userDoc?.application?.photoUrls || userDoc?.publicProfile?.photoUrls || userDoc?.photoUrls,
    5,
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const admin = await requireAdmin(req);
    const body = normalizeBody(req);
    const required = asBool(body?.required, true);
    const requestedApplicationId = safeStr(body?.applicationId);
    const requestedUserId = safeStr(body?.userId);

    const { db, FieldValue } = getAdmin();

    let applicationId = requestedApplicationId;
    let userId = requestedUserId;
    let app = null;

    if (applicationId) {
      const appSnap = await db.collection('matchmakingApplications').doc(applicationId).get();
      if (!appSnap.exists) {
        res.statusCode = 404;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
        return;
      }
      app = appSnap.data() || {};
      if (!userId) userId = safeStr(app?.userId);
    }

    if (!userId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const userSnap = await db.collection('matchmakingUsers').doc(userId).get();
    const userDoc = userSnap.exists ? userSnap.data() || {} : {};

    if (!applicationId) applicationId = safeStr(userDoc?.applicationId);
    if (applicationId && !app) {
      const appSnap = await db.collection('matchmakingApplications').doc(applicationId).get();
      app = appSnap.exists ? (appSnap.data() || {}) : null;
    }

    const nowMs = Date.now();
    const currentPhotoUrls = pickCurrentPhotoUrls(app, userDoc);
    const restriction = {
      status: 'requires_reupload',
      reason: 'self_identifying_photo_required',
      messageCode: 'photo_review_required',
      requestedAt: FieldValue.serverTimestamp(),
      requestedAtMs: nowMs,
      requestedBy: admin.uid,
      reviewedPhotoUrls: currentPhotoUrls,
      reviewedPhotoSignature: buildPhotoUrlsSignature(currentPhotoUrls),
    };

    const batch = db.batch();
    const userRef = db.collection('matchmakingUsers').doc(userId);
    const appRef = applicationId ? db.collection('matchmakingApplications').doc(applicationId) : null;

    if (required) {
      batch.set(
        userRef,
        {
          photoModeration: restriction,
          'application.photoModeration': restriction,
          'publicProfile.photoModeration': restriction,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
        },
        { merge: true },
      );

      if (appRef) {
        batch.set(
          appRef,
          {
            photoModeration: restriction,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: nowMs,
          },
          { merge: true },
        );
      }
    } else {
      batch.set(
        userRef,
        {
          photoModeration: FieldValue.delete(),
          'application.photoModeration': FieldValue.delete(),
          'publicProfile.photoModeration': FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
        },
        { merge: true },
      );

      if (appRef) {
        batch.set(
          appRef,
          {
            photoModeration: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: nowMs,
          },
          { merge: true },
        );
      }
    }

    await batch.commit();

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, required, userId, applicationId: applicationId || null }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}