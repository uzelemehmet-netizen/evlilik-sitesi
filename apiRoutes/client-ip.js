export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

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

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      ip: ip ? String(ip) : null,
      forwardedFor: forwardedFor ? String(forwardedFor) : null,
      userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']) : null,
    })
  );
}
