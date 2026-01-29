import { normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import matchmakingRun from './matchmaking-run.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);

    const secret = String(process.env.MATCHMAKING_CRON_SECRET || '').trim();
    if (!secret) {
      const err = new Error('cron_secret_not_configured');
      err.statusCode = 503;
      throw err;
    }

    // Cron endpoint güvenliğini (shared secret) admin adına sağlayıp aynı handler’ı çalıştır.
    // Not: Bu endpoint sadece adminlere açık olduğu için prod’da da güvenlidir.
    req.headers = { ...(req.headers || {}), 'x-cron-secret': secret, 'x-admin-trigger': '1' };

    // Opsiyonel parametreler: admin body’sinden cron endpoint query’sine aktar.
    // (matchmaking-run GET/POST farkını düşürmek için query’ye yazıyoruz.)
    const body = normalizeBody(req);
    const q = req.query && typeof req.query === 'object' ? req.query : {};
    const patch = {};
    if (typeof body?.threshold === 'number') patch.threshold = String(body.threshold);
    if (typeof body?.limitApps === 'number') patch.limitApps = String(body.limitApps);
    if (typeof body?.dryRun === 'boolean') patch.dryRun = body.dryRun ? '1' : '0';
    req.query = { ...q, ...patch };

    await matchmakingRun(req, res);
  } catch (e) {
    if (!res.headersSent) {
      res.statusCode = e?.statusCode || 500;
      res.setHeader('content-type', 'application/json');
    }
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
