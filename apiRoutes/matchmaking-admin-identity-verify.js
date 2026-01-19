import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeMethod(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'whatsapp' || s === 'wa') return 'whatsapp';
  if (s === 'kyc' || s === 'auto' || s === 'automatic') return 'kyc';
  if (s === 'manual' || s === 'admin') return 'manual';
  return '';
}

function normalizeStatus(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'verified' || s === 'approve' || s === 'approved') return 'verified';
  if (s === 'rejected' || s === 'reject' || s === 'declined') return 'rejected';
  return '';
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

    const userId = safeStr(body?.userId);
    const status = normalizeStatus(body?.status);
    const note = safeStr(body?.note);
    const method = normalizeMethod(body?.method);

    if (!userId || !status) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingUsers').doc(userId);

    // Not: Dot-notation kullanıyoruz ki identityVerification altındaki mevcut
    // alanlar (method/referenceCode/requestedAt vb.) yanlışlıkla silinmesin.
    const patch = {
      identityVerified: status === 'verified',
      'identityVerification.status': status,
      'identityVerification.decidedAt': FieldValue.serverTimestamp(),
      'identityVerification.decidedBy': {
        uid: safeStr(admin?.uid),
        email: safeStr(admin?.email),
      },
      'identityVerification.note': note || null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (method) {
      patch['identityVerification.method'] = method;
    }
    if (status === 'verified') {
      patch['identityVerification.verifiedAt'] = FieldValue.serverTimestamp();
    }
    if (status === 'rejected') {
      patch['identityVerification.rejectedAt'] = FieldValue.serverTimestamp();
    }

    await ref.set(patch, { merge: true });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, userId, status }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
