import crypto from 'crypto';

function parseCloudinaryUrl(raw) {
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return null;

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

function resolveCloudinaryEnv() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
    if (parsed) {
      if (!cloudName) cloudName = parsed.cloudName;
      if (!apiKey) apiKey = parsed.apiKey;
      if (!apiSecret) apiSecret = parsed.apiSecret;
    }
  }

  return { cloudName, apiKey, apiSecret };
}

function safeBase64DataUrl(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw.startsWith('data:')) return '';
  const comma = raw.indexOf(',');
  if (comma < 0) return '';
  const meta = raw.slice(0, comma).toLowerCase();
  if (!meta.includes(';base64')) return '';
  return raw;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const { cloudName, apiKey, apiSecret } = resolveCloudinaryEnv();
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
  const dataUrl = safeBase64DataUrl(body?.dataUrl);
  const folder = typeof body?.folder === 'string' ? body.folder.trim() : '';
  const tags = Array.isArray(body?.tags) ? body.tags.map((item) => String(item || '').trim()).filter(Boolean) : [];

  if (!dataUrl) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
    return;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const tagsStr = tags.join(',');
    const signature = buildSignature({ folder, tags: tagsStr, timestamp }, apiSecret);
    const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;

    const formData = new FormData();
    formData.append('file', dataUrl);
    formData.append('api_key', String(apiKey));
    formData.append('timestamp', String(timestamp));
    formData.append('signature', String(signature));
    if (folder) formData.append('folder', folder);
    if (tagsStr) formData.append('tags', tagsStr);

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    let data = null;
    try {
      data = await uploadRes.json();
    } catch {
      // ignore
    }

    if (!uploadRes.ok) {
      res.statusCode = uploadRes.status || 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'cloudinary_upload_failed', details: data || null }));
      return;
    }

    const secureUrl = data?.secure_url || data?.url;
    if (!secureUrl) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'cloudinary_response_invalid', details: data || null }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        secureUrl,
        publicId: data?.public_id || '',
        bytes: data?.bytes || null,
        width: data?.width || null,
        height: data?.height || null,
        format: data?.format || '',
        originalFilename: data?.original_filename || '',
      })
    );
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}