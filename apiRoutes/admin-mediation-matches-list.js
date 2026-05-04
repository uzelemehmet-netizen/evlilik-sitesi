import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { mapMediationMatchRecord } from './_adminMediation.js';

export default async function adminMediationMatchesList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);
    const body = normalizeBody(req);
    const limit = typeof body?.limit === 'number' && Number.isFinite(body.limit)
      ? Math.max(1, Math.min(200, Math.floor(body.limit)))
      : 100;
    const { db } = getAdmin();
    const snap = await db.collection('matchmakingMediationMatches').orderBy('updatedAtMs', 'desc').limit(limit).get();
    const items = snap.docs.map((doc) => mapMediationMatchRecord(doc.id, doc.data() || {}));

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, items }));
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}