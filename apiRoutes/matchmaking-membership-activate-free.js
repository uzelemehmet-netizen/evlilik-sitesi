import { getAdmin, requireIdToken } from './_firebaseAdmin.js';
import { activateFreeMembershipForUid, isFreeMembershipDisabledByEnv } from './_membershipFree.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    if (isFreeMembershipDisabledByEnv()) {
      const err = new Error('free_membership_disabled');
      err.statusCode = 410;
      throw err;
    }

    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const { db, FieldValue } = getAdmin();
    const now = Date.now();
    const { status, validUntilMs } = await activateFreeMembershipForUid({ db, FieldValue }, uid, now);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status, validUntilMs }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
