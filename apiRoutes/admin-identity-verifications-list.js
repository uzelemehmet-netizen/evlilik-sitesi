import { getAdmin, requireAdmin } from './_firebaseAdmin.js';
import { clamp, loadLatestApplicationsByUserIds, normalizeDoc, safeInt, tsToMs } from './_adminUi.js';

export default async function adminIdentityVerificationsList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);
    const limit = clamp(safeInt(req?.body?.limit, 100), 1, 300);
    const { db } = getAdmin();

    const snap = await db.collection('matchmakingUsers').where('identityVerification.status', '==', 'pending').limit(limit).get();
    const items = snap.docs
      .map((doc) => normalizeDoc(doc.id, doc.data() || {}))
      .sort((a, b) => (tsToMs(b?.updatedAt) || tsToMs(b?.identityVerification?.requestedAt)) - (tsToMs(a?.updatedAt) || tsToMs(a?.identityVerification?.requestedAt)));

    const appByUserId = await loadLatestApplicationsByUserIds(db, items.map((item) => item.id));

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, items, appByUserId }));
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}