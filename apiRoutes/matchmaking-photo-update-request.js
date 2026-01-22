import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asStringArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
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
    const photoUrls = asStringArray(body?.photoUrls);

    if (photoUrls.length !== 3) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    const appsSnap = await db
      .collection('matchmakingApplications')
      .where('userId', '==', uid)
      .limit(1)
      .get();

    const appDoc = appsSnap.docs?.[0] || null;
    if (!appDoc) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
      return;
    }

    const appRef = db.collection('matchmakingApplications').doc(appDoc.id);
    const reqRef = db.collection('matchmakingPhotoUpdateRequests').doc();

    let requestId = '';
    let applicationId = '';

    await db.runTransaction(async (tx) => {
      const appSnap = await tx.get(appRef);
      if (!appSnap.exists) {
        const err = new Error('application_not_found');
        err.statusCode = 404;
        throw err;
      }

      const app = appSnap.data() || {};
      const existing = app?.photoUpdate || null;
      const status = safeStr(existing?.status);
      if (status === 'pending') {
        const err = new Error('pending_exists');
        err.statusCode = 409;
        throw err;
      }

      applicationId = appRef.id;
      requestId = reqRef.id;

      const now = FieldValue.serverTimestamp();
      const previousPhotoUrls = Array.isArray(app?.photoUrls) ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [];

      tx.set(
        reqRef,
        {
          userId: uid,
          applicationId,
          status: 'pending',
          photoUrls,
          previousPhotoUrls,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      tx.set(
        appRef,
        {
          photoUpdate: {
            status: 'pending',
            requestId,
            requestedAt: now,
          },
          updatedAt: now,
        },
        { merge: true }
      );
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, requestId, applicationId }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
