import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
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
    const requestId = safeStr(body?.requestId);
    const approve = body?.approve === undefined ? true : !!body.approve;

    if (!requestId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const reqRef = db.collection('matchmakingPhotoUpdateRequests').doc(requestId);

    let applicationId = '';
    let userId = '';

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(reqRef);
      if (!snap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const data = snap.data() || {};
      const status = safeStr(data.status);
      if (status !== 'pending') {
        const err = new Error('already_decided');
        err.statusCode = 409;
        throw err;
      }

      userId = safeStr(data.userId);
      applicationId = safeStr(data.applicationId);

      if (!applicationId || !userId) {
        const err = new Error('bad_request');
        err.statusCode = 400;
        throw err;
      }

      const appRef = db.collection('matchmakingApplications').doc(applicationId);
      const appSnap = await tx.get(appRef);
      if (!appSnap.exists) {
        const err = new Error('application_not_found');
        err.statusCode = 404;
        throw err;
      }

      const now = FieldValue.serverTimestamp();

      tx.set(
        reqRef,
        {
          status: approve ? 'approved' : 'rejected',
          decidedBy: admin.uid,
          decidedAt: now,
          updatedAt: now,
        },
        { merge: true }
      );

      if (approve) {
        const photoUrls = Array.isArray(data.photoUrls) ? data.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [];
        if (photoUrls.length !== 3) {
          const err = new Error('bad_request');
          err.statusCode = 400;
          throw err;
        }

        tx.set(
          appRef,
          {
            photoUrls,
            photoUpdate: {
              status: 'approved',
              requestId,
              requestedAt: data?.createdAt || null,
              decidedBy: admin.uid,
              decidedAt: now,
            },
            updatedAt: now,
          },
          { merge: true }
        );
      } else {
        tx.set(
          appRef,
          {
            photoUpdate: {
              status: 'rejected',
              requestId,
              requestedAt: data?.createdAt || null,
              decidedBy: admin.uid,
              decidedAt: now,
            },
            updatedAt: now,
          },
          { merge: true }
        );
      }
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, requestId, applicationId, userId }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
