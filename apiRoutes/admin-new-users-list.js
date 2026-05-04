import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { clamp, loadUserDocsMap, normalizeDoc, safeInt, safeStr, tsToMs } from './_adminUi.js';

function resolveSinceMs(body) {
  const explicit = safeInt(body?.sinceMs, 0);
  if (explicit > 0) return explicit;

  const mode = safeStr(body?.window).toLowerCase();
  if (mode === 'today') {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }

  const hours = clamp(safeInt(body?.hours, 48), 1, 24 * 14);
  return Date.now() - hours * 60 * 60 * 1000;
}

function getApplicationCreatedAtMs(item) {
  return safeInt(item?.createdAtMs, 0) || tsToMs(item?.createdAt) || tsToMs(item?.updatedAt);
}

export default async function adminNewUsersList(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);
    const body = normalizeBody(req);
    const sinceMs = resolveSinceMs(body);
    const limit = clamp(safeInt(body?.limit, 500), 1, 800);
    const scanLimit = clamp(Math.max(limit * 3, 600), limit, 2000);

    const { db } = getAdmin();
    const snap = await db.collection('matchmakingApplications').orderBy('createdAtMs', 'desc').limit(scanLimit).get();

    const items = snap.docs
      .map((doc) => normalizeDoc(doc.id, doc.data() || {}))
      .filter((item) => getApplicationCreatedAtMs(item) >= sinceMs)
      .sort((a, b) => getApplicationCreatedAtMs(b) - getApplicationCreatedAtMs(a))
      .slice(0, limit);

    const userIds = items.map((item) => safeStr(item?.userId || item?.uid || item?.userUid || item?.ownerUid)).filter(Boolean);
    const userInfoByUid = await loadUserDocsMap(db, userIds);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, items, userInfoByUid, sinceMs, nowMs: Date.now() }));
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}