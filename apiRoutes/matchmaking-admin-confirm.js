import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);

    // WhatsApp teyidi/confirmation akışı artık kullanılmıyor.
    // 2. onay süreci panelde kullanıcıların seçimleriyle ilerliyor.
    res.statusCode = 410;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'deprecated' }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
