import { getAdmin, normalizeBody } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeEventKey(raw) {
  // IMPORTANT:
  // - Event keys are stored as map keys under clickStats.events.{eventKey}.
  // - Firestore rejects certain characters in field names/paths and can throw during merges.
  // - Firebase Auth error codes often contain '/', e.g. 'auth/popup-blocked'.
  // To avoid silent loss of the most important diagnostics, sanitize aggressively.
  const s0 = safeStr(raw).toLowerCase();
  if (!s0) return '';

  const s = s0
    .replace(/[^a-z0-9:_-]+/g, '_') // includes '/', '.', spaces, etc.
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!s) return '';
  if (s.length > 120) return s.slice(0, 120);
  return s;
}

function normalizeAnonId(raw) {
  const s = safeStr(raw);
  if (!s) return '';
  if (s.length > 120) return '';
  if (!/^[a-zA-Z0-9_-]+$/.test(s)) return '';
  return s;
}

function normalizeBool(v) {
  if (v === true) return true;
  if (v === false) return false;
  const s = safeStr(v).toLowerCase();
  if (s === '1' || s === 'true' || s === 'yes') return true;
  if (s === '0' || s === 'false' || s === 'no') return false;
  return false;
}

function normalizeCountryCode(raw) {
  const s = safeStr(raw).toUpperCase();
  if (!s) return 'UN';
  if (s === 'XX' || s === 'ZZ') return 'UN';
  // Some upstream systems incorrectly use 'TL' for Turkey; normalize it.
  if (s === 'TL') return 'TR';
  if (!/^[A-Z]{2}$/.test(s)) return 'UN';
  return s;
}

function normalizeLang(raw) {
  const s = safeStr(raw);
  if (!s) return '';
  if (s.length > 20) return '';
  // Examples: tr-TR, en-US
  if (!/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})?$/.test(s)) return '';
  return s;
}

function normalizeTimezone(raw) {
  const s = safeStr(raw);
  if (!s) return '';
  if (s.length > 60) return '';
  // Examples: Europe/Istanbul, Asia/Jakarta
  if (!/^[A-Za-z0-9_+\-/]+$/.test(s)) return '';
  return s;
}

function normalizeTzOffsetMin(raw) {
  const n = typeof raw === 'number' ? raw : Number(String(raw ?? '').trim());
  if (!Number.isFinite(n)) return null;
  const v = Math.trunc(n);
  // JS getTimezoneOffset range is typically [-840, 840]
  if (v < -900 || v > 900) return null;
  return v;
}

function normalizeUaHint(raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  if (s.length > 40) return '';
  if (!/^[a-z0-9:_-]+$/.test(s)) return '';
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
    const trace = normalizeBool(body?.trace);

    const lang = normalizeLang(body?.lang);
    const tz = normalizeTimezone(body?.tz);
    const tzOffsetMin = normalizeTzOffsetMin(body?.tzOffsetMin);
    const uaHint = normalizeUaHint(body?.uaHint);

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

    // Non-deduped click traces (optional). Keep retention short.
    const retentionDaysTrace = 7;
    const expiresAtTrace = new Date(nowMs + retentionDaysTrace * 24 * 60 * 60 * 1000);
    const traceRef = trace ? db.collection('clickTrace').doc() : null;

    let counted = false;

    await db.runTransaction(async (tx) => {
      if (traceRef) {
        tx.set(traceRef, {
          dayKey,
          eventKey,
          anonId,
          page,
          country,
          ...(lang ? { lang } : {}),
          ...(tz ? { tz } : {}),
          ...(uaHint ? { uaHint } : {}),
          ...(typeof tzOffsetMin === 'number' ? { tzOffsetMin } : {}),
          createdAt: FieldValue.serverTimestamp(),
          createdAtMs: nowMs,
          expiresAt: expiresAtTrace,
        });
      }

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
        ...(lang ? { lang } : {}),
        ...(tz ? { tz } : {}),
        ...(uaHint ? { uaHint } : {}),
        ...(typeof tzOffsetMin === 'number' ? { tzOffsetMin } : {}),
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

    // Non-critical analytics endpoint: never break page lifecycle with 5xx.
    // Keep 4xx for explicit client misuse; fail-open for anything else.
    if (code >= 500) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.setHeader('cache-control', 'no-store');
      res.end(
        JSON.stringify({
          ok: false,
          error: code === 503 && msg.includes('firebase_admin_not_configured') ? 'tracking_disabled' : 'tracking_failed',
        })
      );
      return;
    }

    res.statusCode = code;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ ok: false, error: msg }));
  }
}
