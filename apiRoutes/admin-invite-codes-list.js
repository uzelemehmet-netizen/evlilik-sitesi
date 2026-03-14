import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function parseIntSafe(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v || '').trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    await requireAdmin(req);
    const body = normalizeBody(req);

    const pageSize = Math.max(1, Math.min(500, parseIntSafe(body?.pageSize, 200)));

    const { db } = getAdmin();

    const snap = await db.collection('matchmakingInviteCodes').orderBy('createdAtMs', 'desc').limit(pageSize).get();

    const items = (snap?.docs || []).map((d) => {
      const x = d.data() || {};
      return {
        id: d.id,
        code: safeStr(x?.code) || d.id,
        status: safeStr(x?.status) || '',
        inviterUid: safeStr(x?.inviterUid) || '',
        inviterEmail: safeStr(x?.inviterEmail) || '',
        inviterUserCode: safeStr(x?.inviterUserCode) || '',
        inviterName: safeStr(x?.inviterName) || '',
        createdAtMs: typeof x?.createdAtMs === 'number' ? x.createdAtMs : 0,
        redeemedByUid: safeStr(x?.redeemedByUid) || '',
        redeemedAtMs: typeof x?.redeemedAtMs === 'number' ? x.redeemedAtMs : 0,
        rewardDays: typeof x?.rewardDays === 'number' ? x.rewardDays : 0,
      };
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, items }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
