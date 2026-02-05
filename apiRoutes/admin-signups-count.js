import { getAdmin, normalizeBody, requireAdmin } from './_firebaseAdmin.js';

function safeInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return fallback;
  return Math.trunc(n);
}

function parseDateYYYYMMDD(v) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return s;
}

function dayStartEndUtcMsTR(dayKey) {
  // TR day boundary UTC+3.
  const offsetMs = 180 * 60 * 1000;
  const [y, m, d] = dayKey.split('-').map((x) => Number(x));
  const startUtcMs = Date.UTC(y, m - 1, d, 0, 0, 0) - offsetMs;
  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;
  return { startUtcMs, endUtcMs };
}

function dayKeyTRFromMs(ms) {
  const offsetMs = 180 * 60 * 1000;
  const d = new Date(ms + offsetMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function msFromCreationTime(creationTime) {
  const s = typeof creationTime === 'string' ? creationTime.trim() : '';
  if (!s) return 0;
  const ms = new Date(s).getTime();
  return Number.isFinite(ms) ? ms : 0;
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
    const daysRaw = safeInt(body?.days, 1);
    const days = Math.min(Math.max(daysRaw || 1, 1), 31);
    const dayKey = parseDateYYYYMMDD(body?.dayKey) || dayKeyTRFromMs(Date.now());

    const { auth, projectId } = getAdmin();

    const countsByDay = {};
    const scannedByDay = {};

    // We'll scan Auth users once and bucket into days we care about.
    // Works well for small/medium user counts; avoids 31x scans.
    const wantedKeys = [];
    for (let i = 0; i < days; i += 1) {
      const ms = Date.now() - i * 24 * 60 * 60 * 1000;
      wantedKeys.push(dayKeyTRFromMs(ms));
    }

    for (const k of wantedKeys) {
      countsByDay[k] = 0;
      scannedByDay[k] = 0;
    }

    const ranges = {};
    for (const k of wantedKeys) ranges[k] = dayStartEndUtcMsTR(k);

    let pageToken = undefined;
    let scannedTotal = 0;
    let pages = 0;

    for (let page = 0; page < 200; page += 1) {
      pages += 1;
      const result = await auth.listUsers(1000, pageToken);
      const users = Array.isArray(result?.users) ? result.users : [];

      for (const u of users) {
        scannedTotal += 1;
        const createdAtMs = msFromCreationTime(u?.metadata?.creationTime);
        if (!createdAtMs) continue;

        for (const k of wantedKeys) {
          const r = ranges[k];
          if (createdAtMs >= r.startUtcMs && createdAtMs < r.endUtcMs) {
            countsByDay[k] += 1;
          }
        }
      }

      pageToken = result?.pageToken || null;
      if (!pageToken) break;
    }

    // scannedByDay is informational; total scan size is same
    for (const k of wantedKeys) scannedByDay[k] = scannedTotal;

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(
      JSON.stringify({
        ok: true,
        projectId: projectId || null,
        days,
        dayKeys: wantedKeys,
        countsByDay,
        scannedUsers: scannedTotal,
        pagesScanned: pages,
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
