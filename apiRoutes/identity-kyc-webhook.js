import { getAdmin, normalizeBody } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeStatus(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'verified' || s === 'approved' || s === 'success') return 'verified';
  if (s === 'rejected' || s === 'declined' || s === 'failed') return 'rejected';
  if (s === 'pending') return 'pending';
  return '';
}

function requireWebhookSecret(req) {
  const secret = safeStr(process.env.KYC_WEBHOOK_SECRET);
  const got = safeStr(req?.headers?.['x-kyc-webhook-secret'] || req?.headers?.['X-Kyc-Webhook-Secret']);
  if (!secret || got !== secret) {
    const err = new Error('forbidden');
    err.statusCode = 403;
    throw err;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    requireWebhookSecret(req);

    const body = normalizeBody(req);
    const userId = safeStr(body?.userId);
    const status = normalizeStatus(body?.status);
    const provider = safeStr(body?.provider);
    const sessionId = safeStr(body?.sessionId);

    if (!userId || !status) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingUsers').doc(userId);

    const patch = {
      identityVerified: status === 'verified',
      'identityVerification.status': status,
      'identityVerification.method': 'kyc',
      'identityVerification.provider': provider || null,
      'identityVerification.sessionId': sessionId || null,
      'identityVerification.webhookAt': FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await ref.set(patch, { merge: true });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
