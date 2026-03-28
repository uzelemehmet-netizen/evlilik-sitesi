import crypto from 'crypto';

function parseCloudinaryUrl(raw) {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return null;

  // Expected format:
  //   cloudinary://<api_key>:<api_secret>@<cloud_name>
  // Cloudinary also allows optional query params; we ignore them.
  try {
    const u = new URL(s);
    if (u.protocol !== 'cloudinary:') return null;
    const cloudName = u.hostname ? decodeURIComponent(u.hostname) : '';
    const apiKey = u.username ? decodeURIComponent(u.username) : '';
    const apiSecret = u.password ? decodeURIComponent(u.password) : '';
    if (!cloudName || !apiKey || !apiSecret) return null;
    return { cloudName, apiKey, apiSecret };
  } catch {
    return null;
  }
}

function normalizeBody(req) {
  const b = req?.body;
  if (!b) return {};
  if (typeof b === 'object') return b;
  try {
    return JSON.parse(b);
  } catch {
    return {};
  }
}

function buildSignature(params, apiSecret) {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && String(v) !== '')
    .sort(([a], [b]) => a.localeCompare(b));

  const toSign = filtered.map(([k, v]) => `${k}=${v}`).join('&');
  return crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  let cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Support standard Cloudinary env (server-side) as a single var.
  // This is common in deploy providers and avoids key sprawl.
  if (!cloudName || !apiKey || !apiSecret) {
    const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
    if (parsed) {
      if (!cloudName) cloudName = parsed.cloudName;
      if (!apiKey) apiKey = parsed.apiKey;
      if (!apiSecret) apiSecret = parsed.apiSecret;
    }
  }

  if (!cloudName || !apiKey || !apiSecret) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: false,
        error: 'cloudinary_env_missing',
        missing: {
          CLOUDINARY_CLOUD_NAME: !cloudName,
          CLOUDINARY_API_KEY: !apiKey,
          CLOUDINARY_API_SECRET: !apiSecret,
        },
      })
    );
    return;
  }

  const body = normalizeBody(req);
  const folder = typeof body.folder === 'string' ? body.folder : '';
  const tags = Array.isArray(body.tags) ? body.tags.filter(Boolean).map(String) : [];
  const tagsStr = tags.length ? tags.join(',') : '';

  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    folder,
    tags: tagsStr,
    timestamp,
  };

  const signature = buildSignature(paramsToSign, apiSecret);

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      tags: tagsStr,
    })
  );
}
