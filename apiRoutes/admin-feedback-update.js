import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeBool(v) {
  if (v === true || v === false) return v;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  }
  return null;
}

function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
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
  const publicVisible = hasOwn(body, 'publicVisible') ? safeBool(body?.publicVisible) : null;
  const featured = hasOwn(body, 'featured') ? safeBool(body?.featured) : null;
  const adminReply = hasOwn(body, 'adminReply') ? safeStr(body?.adminReply) : null;

  const { db, FieldValue } = getAdmin();

  const ref = db.collection('matchmakingFeedback').doc(id);
  const currentSnap = await ref.get();
  const current = currentSnap.exists ? (currentSnap.data() || {}) : {};
  const currentReview = current?.review && typeof current.review === 'object' && !Array.isArray(current.review) ? current.review : {};
  const patch = {
    updatedAt: FieldValue.serverTimestamp(),
    ...(status ? { status } : {}),
    ...((publicVisible === null && featured === null)
      ? {}
      : {
          review: {
            ...currentReview,
            ...(publicVisible === null ? {} : { publicVisible }),
            ...(featured === null ? {} : { featured }),
            ...(adminReply === null ? {} : { adminReply }),
          },
        }),
  };

  if (note) {
    patch.adminNotes = FieldValue.arrayUnion({
      at: Date.now(),
      by: safeStr(adminToken?.email),
      note,
    });
  }

  await ref.set(patch, { merge: true });

  try {
    await db.collection('adminAuditLogs').add({
      adminEmail: safeStr(adminToken?.email),
      adminUid: safeStr(adminToken?.uid),
      action: 'feedback_update',
      targetUid: safeStr(body?.userId) || null,
      ok: true,
      meta: {
        id,
        ...(status ? { status } : {}),
        ...(publicVisible === null ? {} : { publicVisible }),
        ...(featured === null ? {} : { featured }),
        ...(adminReply === null ? {} : { hasAdminReply: adminReply.length > 0 }),
        hasNote: !!note,
      },
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch {
    // ignore
  }

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}
