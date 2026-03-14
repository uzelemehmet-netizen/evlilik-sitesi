import crypto from 'node:crypto';
import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { redactPII } from './_pii.js';

const MAX_MESSAGE_LEN = 2400;
const MIN_MESSAGE_LEN = 10;

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeAnyStr(v) {
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'boolean') return v ? '1' : '0';
  try {
    if (v == null) return '';
    return String(v).trim();
  } catch {
    return '';
  }
}

function safeObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

function safeInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function truncate(s, maxLen) {
  const t = safeAnyStr(s);
  if (!t) return '';
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}

function pickContextExtra(contextRaw) {
  const ctx = safeObj(contextRaw) || {};
  const out = {};
  const add = (key, value, maxLen) => {
    const v = truncate(redactPII(safeAnyStr(value)), maxLen);
    if (v) out[key] = v;
  };

  // URL / route
  add('host', ctx.host, 120);
  add('path', ctx.path, 180);
  add('search', ctx.search, 480);
  add('hash', ctx.hash, 240);

  // Auth UI state
  add('mode', ctx.mode, 24);
  add('forceLogin', ctx.forceLogin, 12);
  add('redirectCheckDone', ctx.redirectCheckDone, 12);

  // Visible error details (best-effort)
  add('uiError', ctx.uiError, 600);
  add('debugAuthCode', ctx.debugAuthCode, 120);
  add('debugAuthMessage', ctx.debugAuthMessage, 600);
  add('authErrorCode', ctx.authErrorCode, 120);
  add('authErrorMessage', ctx.authErrorMessage, 600);

  return Object.keys(out).length ? out : null;
}

function dayKeyTRFromMs(ms) {
  const offsetMs = 180 * 60 * 1000;
  const d = new Date(ms + offsetMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sha256Short(input) {
  try {
    const h = crypto.createHash('sha256').update(String(input || ''), 'utf8').digest('hex');
    return h.slice(0, 16);
  } catch {
    return '';
  }
}

function pickServerMeta(req) {
  try {
    const h = (req && req.headers) || {};
    const acceptLanguage = truncate(safeStr(h['accept-language'] || h['Accept-Language'] || ''), 240) || null;

    const vercelCountry = truncate(safeStr(h['x-vercel-ip-country'] || ''), 8) || null;
    const vercelRegion = truncate(safeStr(h['x-vercel-ip-country-region'] || ''), 80) || null;
    const vercelCity = truncate(safeStr(h['x-vercel-ip-city'] || ''), 80) || null;

    const cfCountry = truncate(safeStr(h['cf-ipcountry'] || ''), 8) || null;
    const country = vercelCountry || cfCountry || null;

    const out = {
      acceptLanguage,
      country,
      region: vercelRegion,
      city: vercelCity,
    };

    for (const k of Object.keys(out)) {
      if (!out[k]) delete out[k];
    }

    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

export default async function publicFeedbackSubmit(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const body = normalizeBody(req);

  // Optional auth: if bearer token exists and is valid, attach uid/email.
  let token = null;
  try {
    token = await requireIdToken(req);
  } catch {
    token = null;
  }

  const messageRaw = safeStr(body?.message || body?.text || '');
  const message = truncate(redactPII(messageRaw), MAX_MESSAGE_LEN);
  if (!message || message.length < MIN_MESSAGE_LEN) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'message_too_short', minLen: MIN_MESSAGE_LEN }));
    return;
  }

  const kind = 'complaint';
  const step = truncate(safeStr(body?.step || ''), 120) || 'public_feedback';

  // Optional contact field: user may want to be reached back.
  // NOTE: We intentionally do NOT run redactPII on this field; it is stored as provided.
  // Keep it short and simple to reduce accidental sensitive leakage.
  const contact = truncate(safeStr(body?.contact || ''), 140) || null;

  const page = truncate(safeStr(body?.page || ''), 900);
  const pagePath = truncate(safeStr(body?.pagePath || ''), 180) || (() => {
    try {
      if (!page) return '';
      const u = new URL(page);
      return u.pathname || '';
    } catch {
      return '';
    }
  })();

  const contextRaw = safeObj(body?.context) || {};
  const lang = truncate(safeStr(body?.lang || contextRaw?.lang || ''), 32);
  const ua = truncate(safeStr(body?.ua || contextRaw?.ua || ''), 320);
  const tz = truncate(safeStr(body?.tz || contextRaw?.tz || ''), 64);
  const ref = truncate(safeStr(body?.ref || contextRaw?.ref || ''), 900);
  const build = truncate(safeStr(body?.build || contextRaw?.build || ''), 80);
  const anonId = truncate(safeStr(body?.anonId || ''), 120);
  const contextExtra = pickContextExtra(contextRaw);
  const serverMeta = pickServerMeta(req);

  const uid = safeStr(token?.uid);
  const email = safeStr(token?.email);

  const fingerprint = sha256Short(`${kind}|${step}|${message}|${pagePath}`);
  const dayKey = dayKeyTRFromMs(Date.now());
  const actorKey = uid || anonId || 'unknown';
  const dedupeId = `${dayKey}__${actorKey}__${fingerprint || 'nofp'}`;

  const { db, FieldValue } = getAdmin();
  const now = FieldValue.serverTimestamp();

  const dedupeRef = db.collection('clientFeedbackDedupe').doc(dedupeId);
  const feedbackRef = db.collection('matchmakingFeedback').doc();

  const doc = {
    kind,
    status: 'new',

    step,

    // Moderation UI currently checks it.text; keep it populated.
    text: message,
    message,

    contact,

    userId: uid || null,
    userEmail: email || null,

    matchId: null,
    aboutUserId: null,
    pagePath: pagePath || null,

    context: {
      lang,
      ua,
      tz,
      ref,
      build,
      anonId: anonId || null,
      contact,
      server: serverMeta,
    },

    data: {
      message,
      fingerprint: fingerprint || null,
      actor: {
        uid: uid || null,
        email: email || null,
        anonId: anonId || null,
      },
      page,
      ref,
      server: serverMeta,
      client: contextExtra,
      ts: safeInt(body?.ts, Date.now()) || Date.now(),
    },

    createdAt: now,
    updatedAt: now,
  };

  let result = { ok: true, id: feedbackRef.id, deduped: false };

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(dedupeRef);
    if (snap.exists) {
      result = { ok: true, id: null, deduped: true };
      tx.set(
        dedupeRef,
        {
          hits: FieldValue.increment(1),
          lastAtMs: Date.now(),
          updatedAt: now,
        },
        { merge: true }
      );
      return;
    }

    tx.set(dedupeRef, {
      dayKey,
      actorKey,
      fingerprint: fingerprint || null,
      hits: 1,
      firstAtMs: Date.now(),
      lastAtMs: Date.now(),
      createdAt: now,
      updatedAt: now,
    });

    tx.set(feedbackRef, doc);
  });

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(result));
}
