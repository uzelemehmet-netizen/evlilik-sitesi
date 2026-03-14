import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function parseIntSafe(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v || '').trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);

    const body = normalizeBody(req);
    const mode = safeStr(body?.mode) || 'allExisting';
    const confirmText = safeStr(body?.confirmText);
    const dryRun = body?.dryRun === true;

    // Safety: explicit phrase required
    if (confirmText !== 'MARK_ALL_SYSTEM_USERS') {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'confirm_text_required' }));
      return;
    }

    const { auth, db, FieldValue } = getAdmin();

    if (mode !== 'allExisting') {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_mode' }));
      return;
    }

    const limitRaw = parseIntSafe(body?.limit, 500);
    const hardLimit = Math.min(Math.max(limitRaw || 500, 1), 5000);

    let pageToken = undefined;
    let marked = 0;
    let scanned = 0;

    while (marked < hardLimit) {
      const pageSize = Math.min(200, hardLimit - marked);
      const result = await auth.listUsers(pageSize, pageToken);
      const users = Array.isArray(result?.users) ? result.users : [];
      pageToken = result?.pageToken || undefined;

      if (!users.length) break;

      scanned += users.length;

      if (!dryRun) {
        const batch = db.batch();
        for (const u of users) {
          const uid = String(u.uid);
          const ref = db.collection('adminUserFlags').doc(uid);
          batch.set(
            ref,
            {
              systemUser: true,
              markedAt: FieldValue.serverTimestamp(),
              markedBy: 'bulk_admin_mark_all_existing',
            },
            { merge: true }
          );
        }
        await batch.commit();
      }

      marked += users.length;
      if (!pageToken) break;
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, mode, dryRun, scanned, marked }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
