import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizePhotoSlots(v) {
  const raw = Array.isArray(v) ? v : [];
  const out = raw
    .slice(0, 3)
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .map((s) => (s ? s : ''));
  while (out.length < 3) out.push('');
  return out;
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
      const userRef = db.collection('matchmakingUsers').doc(userId);
      const appSnap = await tx.get(appRef);
      if (!appSnap.exists) {
        const err = new Error('application_not_found');
        err.statusCode = 404;
        throw err;
      }

      const userSnap = await tx.get(userRef);
      const userDoc = userSnap.exists ? userSnap.data() || {} : {};
      const existingUserApplicationId = safeStr(userDoc?.applicationId);

      const app = appSnap.data() || {};

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
        // New model: allow 1-3 updated photos, while keeping existing photos.
        // Preferred format is a 3-slot array where empty slots mean "keep existing".
        const requestedBySlot = normalizePhotoSlots(data?.photoUrls);
        const requestedCount = countNonEmpty(requestedBySlot);

        // Backward-compat: if request stored as 1-2 urls without slots, treat as replacing from the start.
        let requestedSlots = requestedBySlot;
        if (requestedCount === 0) {
          const legacy = Array.isArray(data?.photoUrls) ? data.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [];
          if (legacy.length > 0 && legacy.length <= 3) {
            requestedSlots = normalizePhotoSlots(legacy);
          }
        }

        const finalRequestedCount = countNonEmpty(requestedSlots);
        if (finalRequestedCount < 1 || finalRequestedCount > 3) {
          const err = new Error('bad_request');
          err.statusCode = 400;
          throw err;
        }

        const appSlotsRaw = Array.isArray(app?.photoUrls) ? app.photoUrls : null;
        const prevSlotsRaw = Array.isArray(data?.previousPhotoUrlsBySlot)
          ? data.previousPhotoUrlsBySlot
          : Array.isArray(data?.previousPhotoUrls)
            ? data.previousPhotoUrls
            : null;

        const baseSlots =
          appSlotsRaw && appSlotsRaw.some((u) => typeof u === 'string' && u.trim())
            ? normalizePhotoSlots(appSlotsRaw)
            : normalizePhotoSlots(prevSlotsRaw);

        const merged = [...baseSlots];
        for (let i = 0; i < 3; i++) {
          if (requestedSlots[i]) merged[i] = requestedSlots[i];
        }

        const photoUrls = merged.filter(Boolean);
        if (photoUrls.length < 1) {
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

        // Keep user doc in sync (UI often prefers matchmakingUsers.application/publicProfile).
        const userUpdate = {
          photoUrls,
          publicProfile: {
            photoUrls,
          },
          application: {
            photoUrls,
            photoUpdate: {
              status: 'approved',
              requestId,
              requestedAt: data?.createdAt || null,
              decidedBy: admin.uid,
              decidedAt: now,
            },
          },
          updatedAt: now,
        };

        // Avoid overwriting an existing applicationId (multiple-application edge case).
        if (!existingUserApplicationId) userUpdate.applicationId = applicationId;

        tx.set(
          userRef,
          userUpdate,
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

        // Also sync rejection status to user doc to unblock the UI.
        const userUpdate = {
          application: {
            photoUpdate: {
              status: 'rejected',
              requestId,
              requestedAt: data?.createdAt || null,
              decidedBy: admin.uid,
              decidedAt: now,
            },
          },
          updatedAt: now,
        };

        if (!existingUserApplicationId) userUpdate.applicationId = applicationId;

        tx.set(
          userRef,
          userUpdate,
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
