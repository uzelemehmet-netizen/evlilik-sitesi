import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export default async function adminFeedbackUpdate(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const adminToken = await requireAdmin(req);
  const body = normalizeBody(req);

  const id = safeStr(body?.id);
  if (!id) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'missing_id' }));
    return;
  }

  const status = safeStr(body?.status).toLowerCase();
  const allowed = new Set(['new', 'in_progress', 'done', 'rejected']);
  if (status && !allowed.has(status)) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'invalid_status' }));
    return;
  }

  const note = safeStr(body?.note);

  const { db, FieldValue } = getAdmin();

  const ref = db.collection('matchmakingFeedback').doc(id);
  const patch = {
    updatedAt: FieldValue.serverTimestamp(),
    ...(status ? { status } : {}),
  };

  if (note) {
    patch.adminNotes = FieldValue.arrayUnion({
      at: Date.now(),
      by: safeStr(adminToken?.email),
      note,
    });
  }

  await ref.set(patch, { merge: true });

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}
