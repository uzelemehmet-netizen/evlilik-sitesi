import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { clamp, normalizeDoc, safeInt, tsToMs } from './_adminUi.js';

export default async function adminMatchmakingMatchesList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);
    const body = normalizeBody(req);
    const limit = clamp(safeInt(body?.limit, 50), 1, 300);
    const { db } = getAdmin();

    const snap = await db
      .collection('matchmakingMatches')
      .where('status', 'in', ['mutual_accepted', 'contact_unlocked'])
      .limit(limit)
      .get();

    const items = snap.docs
      .map((doc) => normalizeDoc(doc.id, doc.data() || {}))
      .sort((a, b) => tsToMs(b?.updatedAt) - tsToMs(a?.updatedAt));

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, items }));
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}