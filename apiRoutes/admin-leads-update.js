import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeBool(v) {
  return v === true || v === 1 || v === '1' || v === 'true' || v === 'yes';
}

export default async function adminLeadsUpdate(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);
    const body = normalizeBody(req);

    const id = safeStr(body?.id);
    if (!id) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'missing_id' }));
      return;
    }

    const patch = body?.patch && typeof body.patch === 'object' ? body.patch : {};

    const nextStatus = safeStr(patch?.status);
    const notes = typeof patch?.notes === 'string' ? patch.notes.slice(0, 4000) : null;
    const contacted = patch?.contacted !== undefined ? safeBool(patch.contacted) : null;

    const { db, FieldValue } = getAdmin();

    const ref = db.collection('matchmakingLeads').doc(id);
    const nowMs = Date.now();

    const update = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMs: nowMs,
    };

    if (nextStatus) update.status = nextStatus;

    if (notes !== null) {
      update.admin = {
        notes,
      };
    }

    if (contacted !== null) {
      update.admin = {
        ...(update.admin || {}),
        contacted,
        ...(contacted
          ? {
              contactedAt: FieldValue.serverTimestamp(),
              contactedAtMs: nowMs,
            }
          : {
              contactedAt: null,
              contactedAtMs: 0,
            }),
      };
    }

    await ref.set(update, { merge: true });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
