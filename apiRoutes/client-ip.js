export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const h = (req && req.headers) || {};

  const forwardedFor = req.headers['x-forwarded-for'] || '';
  const ipFromForwarded = String(forwardedFor || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)[0];

  const ip =
    ipFromForwarded ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '';

  // Country/region hints (no external geo lookup):
  // - Vercel: x-vercel-ip-country (+ region/city)
  // - Cloudflare: cf-ipcountry
  const acceptLanguage = h['accept-language'] ? String(h['accept-language']).slice(0, 240) : null;

  const vercelCountry = h['x-vercel-ip-country'] ? String(h['x-vercel-ip-country']).slice(0, 8) : null;
  const vercelRegion = h['x-vercel-ip-country-region'] ? String(h['x-vercel-ip-country-region']).slice(0, 80) : null;
  const vercelCity = h['x-vercel-ip-city'] ? String(h['x-vercel-ip-city']).slice(0, 80) : null;

  const cfCountry = h['cf-ipcountry'] ? String(h['cf-ipcountry']).slice(0, 8) : null;
  const country = vercelCountry || cfCountry || null;

  const region = vercelRegion || null;
  const city = vercelCity || null;

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      ip: ip ? String(ip) : null,
      forwardedFor: forwardedFor ? String(forwardedFor) : null,
      userAgent: h['user-agent'] ? String(h['user-agent']) : null,
      acceptLanguage,
      country,
      region,
      city,
    })
  );
}
