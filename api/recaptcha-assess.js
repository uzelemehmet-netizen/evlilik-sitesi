function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

function sendJson(res, status, obj) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj, null, 2));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const apiKey = process.env.RECAPTCHA_ENTERPRISE_API_KEY;
  const projectId = process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID;
  const siteKey = process.env.RECAPTCHA_ENTERPRISE_SITE_KEY;
  const minScore = Number(process.env.RECAPTCHA_ENTERPRISE_MIN_SCORE || '0.5');

  if (!apiKey || !projectId || !siteKey) {
    return sendJson(res, 500, {
      ok: false,
      error: 'Missing server configuration',
      missing: {
        RECAPTCHA_ENTERPRISE_API_KEY: !apiKey,
        RECAPTCHA_ENTERPRISE_PROJECT_ID: !projectId,
        RECAPTCHA_ENTERPRISE_SITE_KEY: !siteKey,
      },
    });
  }

  const rawBody = typeof req.body === 'string' ? req.body : null;
  const body = req.body && typeof req.body === 'object' ? req.body : safeJsonParse(rawBody || '') || {};

  const token = String(body?.token || body?.event?.token || '').trim();
  const expectedAction = String(body?.expectedAction || body?.event?.expectedAction || '').trim();

  if (!token) return sendJson(res, 400, { ok: false, error: 'Missing token' });
  if (!expectedAction) return sendJson(res, 400, { ok: false, error: 'Missing expectedAction' });

  const userAgent = req.headers['user-agent'] || '';
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '';

  const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/assessments?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    event: {
      token,
      expectedAction,
      siteKey,
      userAgent,
      userIpAddress: ip,
    },
  };

  let resp;
  let data;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    data = await resp.json();
  } catch (e) {
    return sendJson(res, 502, { ok: false, error: 'Failed to call reCAPTCHA API' });
  }

  if (!resp.ok) {
    return sendJson(res, 502, {
      ok: false,
      error: 'reCAPTCHA API error',
      status: resp.status,
      details: data,
    });
  }

  const valid = !!data?.tokenProperties?.valid;
  const action = String(data?.tokenProperties?.action || '');
  const score = Number(data?.riskAnalysis?.score ?? -1);
  const reasons = Array.isArray(data?.riskAnalysis?.reasons) ? data.riskAnalysis.reasons : [];

  const allowed = valid && action === expectedAction && Number.isFinite(score) && score >= minScore;

  return sendJson(res, 200, {
    ok: true,
    allowed,
    minScore,
    valid,
    expectedAction,
    action,
    score,
    reasons,
    assessmentName: data?.name || null,
  });
}
