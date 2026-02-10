import { getAdmin, normalizeBody } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeEventKey(raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  if (s.length > 120) return '';
  // allow: a-z 0-9 : _ - / .
  if (!/^[a-z0-9:_\-/\.]+$/.test(s)) return '';
  return s;
}

function normalizeAnonId(raw) {
  const s = safeStr(raw);
  if (!s) return '';
  if (s.length > 120) return '';
  if (!/^[a-zA-Z0-9_-]+$/.test(s)) return '';
  return s;
}

function normalizeCountryCode(raw) {
  const s = safeStr(raw).toUpperCase();
  if (!s) return 'UN';
  if (s === 'XX' || s === 'ZZ') return 'UN';
  if (!/^[A-Z]{2}$/.test(s)) return 'UN';
  return s;
}

function detectCountryFromHeaders(headers) {
  const h = headers || {};

  // Common proxies
  const vercel = h['x-vercel-ip-country'] || h['X-Vercel-Ip-Country'] || '';
  const cf = h['cf-ipcountry'] || h['CF-IPCountry'] || '';
  const fastly = h['x-country-code'] || h['X-Country-Code'] || '';

  return normalizeCountryCode(vercel || cf || fastly);
}

function dayKeyTR(nowMs) {
  // Business wants TR day boundary. Use fixed UTC+3.
  const offsetMs = 180 * 60 * 1000;
  const d = new Date(nowMs + offsetMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const body = normalizeBody(req);

    const eventKey = normalizeEventKey(body?.eventKey);
    const anonId = normalizeAnonId(body?.anonId);
    const page = safeStr(body?.page).slice(0, 200) || null;

    if (!eventKey || !anonId) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const nowMs = Date.now();
    const dayKey = dayKeyTR(nowMs);
    const country = detectCountryFromHeaders(req?.headers);

    const { db, FieldValue } = getAdmin();

    // Retention policy:
    // - clickEvents: dedupe için gerekli; büyümeyi sınırlamak için TTL ile otomatik silinebilir.
    // - clickStats: günlük aggregate; daha uzun süre saklanabilir.
    // Not: Firestore TTL'nin çalışması için Firebase Console'da ilgili field'ı (expiresAt)
    // TTL policy olarak tanımlamak gerekir.
    const retentionDaysEvents = 35;
    const retentionDaysStats = 35;
    const expiresAtEvents = new Date(nowMs + retentionDaysEvents * 24 * 60 * 60 * 1000);
    const expiresAtStats = new Date(nowMs + retentionDaysStats * 24 * 60 * 60 * 1000);

    // Unique per browser (anonId) per day per eventKey.
    const eventId = `${dayKey}__${eventKey}__${anonId}`;
    const eventRef = db.collection('clickEvents').doc(eventId);
    const statsRef = db.collection('clickStats').doc(dayKey);

    let counted = false;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(eventRef);
      if (snap.exists) {
        counted = false;
        return;
      }

      counted = true;
      tx.set(eventRef, {
        dayKey,
        eventKey,
        anonId,
        page,
        country,
        createdAt: FieldValue.serverTimestamp(),
        createdAtMs: nowMs,
        expiresAt: expiresAtEvents,
      });

      tx.set(
        statsRef,
        {
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: nowMs,
          expiresAt: expiresAtStats,
          totalUnique: FieldValue.increment(1),
          events: {
            [eventKey]: {
              total: FieldValue.increment(1),
              countries: {
                [country]: FieldValue.increment(1),
              },
            },
          },
        },
        { merge: true }
      );
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ ok: true, counted, dayKey, eventKey, country }));
  } catch (e) {
    const msg = String(e?.message || 'server_error');
    const code = e?.statusCode || 500;

    // Non-critical analytics endpoint: if Firebase Admin isn't configured (common in local/dev),
    // don't spam the console with 5xx and don't block the page lifecycle/keepalive calls.
    if (code === 503 && msg.includes('firebase_admin_not_configured')) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.setHeader('cache-control', 'no-store');
      res.end(JSON.stringify({ ok: false, error: 'tracking_disabled' }));
      return;
    }

    res.statusCode = code;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: msg }));
  }
}
