import { getAdmin, requireIdToken } from './_firebaseAdmin.js';

function isReferralEnabled() {
  const raw = String(process.env.MATCHMAKING_REFERRAL_ENABLED || '').toLowerCase().trim();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'GET, POST');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    if (!isReferralEnabled()) {
      const err = new Error('referral_disabled');
      err.statusCode = 410;
      throw err;
    }

    const decoded = await requireIdToken(req);
    const uid = safeStr(decoded?.uid);

    const { db } = getAdmin();
    const snap = await db.collection('matchmakingUsers').doc(uid).get();
    const user = snap.exists ? snap.data() || {} : {};

    const code = safeStr(user?.userCode);
    if (!code) {
      const err = new Error('user_code_missing');
      err.statusCode = 409;
      throw err;
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, code }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
