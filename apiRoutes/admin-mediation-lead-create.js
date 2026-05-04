import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';
import { createManualMediationLead, safeStr } from './_adminMediation.js';

export default async function adminMediationLeadCreate(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireAdmin(req);
    const body = normalizeBody(req);
    const fullName = safeStr(body?.fullName);
    const whatsapp = safeStr(body?.whatsapp);
    const gender = safeStr(body?.gender);
    if (!fullName) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'full_name_required' }));
      return;
    }
    if (!gender) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'gender_required' }));
      return;
    }
    if (!whatsapp) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'whatsapp_required' }));
      return;
    }

    const { db } = getAdmin();
    const snapshot = await createManualMediationLead(db, body, decoded?.email || '');

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, item: snapshot }));
  } catch (error) {
    res.statusCode = error?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(error?.message || 'server_error') }));
  }
}