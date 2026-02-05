import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function dayKeyTRFromMs(ms) {
  const offsetMs = 180 * 60 * 1000;
  const d = new Date(ms + offsetMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayKeysLastNDays(n, nowMs) {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const ms = nowMs - i * 24 * 60 * 60 * 1000;
    out.push(dayKeyTRFromMs(ms));
  }
  return out;
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
    const daysRaw = safeInt(body?.days, 7);
    const days = Math.min(Math.max(daysRaw || 7, 1), 31);

    const { db } = getAdmin();

    const nowMs = Date.now();
    const keys = dayKeysLastNDays(days, nowMs);

    const refs = keys.map((k) => db.collection('clickStats').doc(k));
    let snaps = [];
    try {
      snaps = refs.length ? await db.getAll(...refs) : [];
    } catch {
      snaps = await Promise.all(refs.map((r) => r.get()));
    }

    const byDay = {};
    for (let i = 0; i < keys.length; i += 1) {
      const k = keys[i];
      const snap = snaps[i];
      byDay[k] = snap && snap.exists ? (snap.data() || {}) : null;
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ ok: true, days, dayKeys: keys, byDay }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
