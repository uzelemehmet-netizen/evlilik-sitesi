import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { normalizeDoc, normalizeFirestoreValue, safeStr } from './_adminUi.js';

export default async function adminMatchmakingApplicationDetail(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);
    const body = normalizeBody(req);
    const applicationId = safeStr(body?.applicationId || body?.id);
    if (!applicationId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'missing_application_id' }));
      return;
    }

    const { db } = getAdmin();
    const appSnap = await db.collection('matchmakingApplications').doc(applicationId).get();
    if (!appSnap.exists) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'not_found' }));
      return;
    }

    const item = normalizeDoc(appSnap.id, appSnap.data() || {});
    const userId = safeStr(item?.userId);

    let userRecord = null;
    let userBlocked = false;
    let userMembership = null;

    if (userId) {
      const userSnap = await db.collection('matchmakingUsers').doc(userId).get();
      if (userSnap.exists) {
        userRecord = normalizeFirestoreValue(userSnap.data() || {});
        userBlocked = !!userRecord?.blocked;
        userMembership = userRecord?.membership || null;
      }
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, item, userRecord, userBlocked, userMembership }));
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}