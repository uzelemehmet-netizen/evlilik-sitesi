import { issueAdminStepUpToken, getAdminStepUpTtlMs, isAdminStepUpEnabled, normalizeBody, requireAdmin, verifyAdminStepUpPassword } from './_firebaseAdmin.js';

function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireAdmin(req, { requireStepUp: false });
    if (!isAdminStepUpEnabled()) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, enabled: false, ttlMs: 0, token: '' }));
      return;
    }

    const body = normalizeBody(req);
    const password = safeStr(body?.password);
    if (!password) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'missing_step_up_password' }));
      return;
    }

    if (!verifyAdminStepUpPassword(password)) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'invalid_step_up_password' }));
      return;
    }

    const token = issueAdminStepUpToken(decoded);
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        enabled: true,
        token,
        ttlMs: getAdminStepUpTtlMs(),
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}