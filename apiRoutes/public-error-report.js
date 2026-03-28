import crypto from 'node:crypto';
import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { redactPII } from './_pii.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function safeObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function truncate(s, maxLen) {
  const t = safeStr(s);
  if (!t) return '';
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}

function urlHostHint(raw) {
  const s = safeStr(raw);
  if (!s) return '';

  // Browser CSP blockedURI may be: "inline", "eval", "data", "blob" etc.
  if (s === 'inline' || s === 'eval' || s === 'self') return s;
  if (s.startsWith('data:')) return 'data:';
  if (s.startsWith('blob:')) return 'blob:';
  if (s.startsWith('about:')) return 'about:';

  try {
    return new URL(s).host || '';
  } catch {
    // Some inputs might be schemeless (rare). Try a best-effort parse.
    try {
      return new URL(`https://${s}`).host || '';
    } catch {
      return '';
    }
  }
}

function urlHostPathHintNoScheme(raw) {
  const s = safeStr(raw);
  if (!s) return '';

  // Browser CSP blockedURI may be: "inline", "eval", "data", "blob" etc.
  if (s === 'inline' || s === 'eval' || s === 'self') return s;
  if (s.startsWith('data:')) return 'data:';
  if (s.startsWith('blob:')) return 'blob:';
  if (s.startsWith('about:')) return 'about:';

  try {
    const u = new URL(s);
    const host = u.host || '';
    const path = u.pathname || '';
    return host ? `${host}${path}` : '';
  } catch {
    // Schemeless best-effort: strip query/hash.
    const noFrag = s.split('#')[0] || '';
    const noQuery = noFrag.split('?')[0] || '';
    return noQuery;
  }
}

function sanitizeHostHint(raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  // Keep only host-like tokens (no slashes/query/fragments/userinfo)
  if (/[\s\/\?#@]/.test(s)) return '';
  if (s.length > 180) return '';
  // Very permissive: letters, digits, dot, dash, colon (port)
  if (!/^[a-z0-9.:-]+$/.test(s)) return '';
  return s;
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

function isLikelyCrawlerUA(uaRaw) {
  try {
    const ua = safeStr(uaRaw);
    if (!ua) return false;
    // Keep conservative: only match well-known crawlers/bots.
    return /\b(adsbot-google|googlebot|bingbot|duckduckbot|yandex(bot|images)|baiduspider|facebookexternalhit|twitterbot|slackbot|linkedinbot|applebot|petalbot|semrushbot|ahrefs(bot)?|mj12bot|dotbot|vercel-screenshot)\b/i.test(
      ua
    );
  } catch {
    return false;
  }
}

function pickConsole(items, maxItems = 40) {
  const out = [];
  for (const it of safeArr(items)) {
    const o = safeObj(it);
    if (!o) continue;
    const level = safeStr(o?.level).toLowerCase() || 'log';
    const at = safeInt(o?.at, 0) || 0;
    const text = truncate(redactPII(safeStr(o?.text)), 900);
    if (!text) continue;
    out.push({ level, at, text });
    if (out.length >= maxItems) break;
  }
  return out;
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

function pickExtraForStorage(extraRaw) {
  const extra = safeObj(extraRaw) || {};

  const pickStr = (key, maxLen) => {
    const v = truncate(redactPII(safeStr(extra?.[key])), maxLen);
    return v || null;
  };

  const pickNum = (key) => {
    const n = safeInt(extra?.[key], null);
    return typeof n === 'number' ? n : null;
  };

  const pickHost = (key) => {
    const v = sanitizeHostHint(extra?.[key]);
    return v ? truncate(v, 160) : null;
  };

  const out = {
    filename: pickStr('filename', 700),
    filenameHint: (() => {
      try {
        const fromClient = safeStr(extra?.filenameHint);
        const v = fromClient || urlHostPathHintNoScheme(extra?.filename);
        const s = safeStr(v);
        if (!s) return null;
        // Must be scheme-less and query/hash free.
        if (s.includes('://')) return null;
        if (/[\s\?#@]/.test(s)) return null;
        if (s.length > 420) return truncate(s, 420);
        return s;
      } catch {
        return null;
      }
    })(),
    lineno: pickNum('lineno'),
    colno: pickNum('colno'),
    stackUrlHints: (() => {
      try {
        const raw = extra?.stackUrlHints;
        if (!Array.isArray(raw)) return null;
        const outArr = [];
        for (const it of raw) {
          if (outArr.length >= 6) break;
          const s = safeStr(it);
          if (!s) continue;
          if (s.includes('://')) continue;
          if (/[\s\?#@]/.test(s)) continue;
          outArr.push(truncate(s, 420));
        }
        return outArr.length ? outArr : null;
      } catch {
        return null;
      }
    })(),
    eventType: pickStr('eventType', 80),
    eventIsTrusted: (() => {
      try {
        const v = extra?.eventIsTrusted;
        return typeof v === 'boolean' ? v : null;
      } catch {
        return null;
      }
    })(),
    eventTimeStamp: pickNum('eventTimeStamp'),
    targetType: pickStr('targetType', 100),
    tagName: pickStr('tagName', 40),
    rel: pickStr('rel', 80),
    as: pickStr('as', 40),
    resourceUrl: pickStr('resourceUrl', 900),
    resourceUrlHint: (() => {
      try {
        const fromClient = safeStr(extra?.resourceUrlHint);
        const v = fromClient || urlHostPathHintNoScheme(extra?.resourceUrl);
        const s = safeStr(v);
        if (!s) return null;
        // Must be scheme-less and query/hash free.
        if (s.includes('://')) return null;
        if (/[^\S\r\n]/.test(s)) {
          // any whitespace
          return null;
        }
        if (/[\?#@]/.test(s)) return null;
        if (s.length > 420) return truncate(s, 420);
        return s;
      } catch {
        return null;
      }
    })(),
    resourceHost: (() => {
      try {
        const fromClient = pickHost('resourceHost');
        if (fromClient) return fromClient;

        const v = safeStr(extra?.resourceUrl);
        const host = urlHostHint(v);
        return host ? truncate(host, 160) : null;
      } catch {
        return null;
      }
    })(),

    // CSP violation extras (if coming from client)
    directive: pickStr('directive', 140),
    blockedURI: pickStr('blockedURI', 900),
    blockedUrlHint: (() => {
      try {
        const fromClient = safeStr(extra?.blockedUrlHint);
        const v = fromClient || urlHostPathHintNoScheme(extra?.blockedURI);
        const s = safeStr(v);
        if (!s) return null;
        // Must be scheme-less and query/hash free.
        if (s.includes('://')) return null;
        if (/[\s\?#@]/.test(s)) return null;
        if (s.length > 420) return truncate(s, 420);
        return s;
      } catch {
        return null;
      }
    })(),
    blockedHost: (() => {
      try {
        const fromClient = pickHost('blockedHost');
        if (fromClient) return fromClient;

        const v = safeStr(extra?.blockedURI);
        const host = urlHostHint(v);
        return host ? truncate(host, 160) : null;
      } catch {
        return null;
      }
    })(),
    sourceFile: pickStr('sourceFile', 700),
    sourceFileHost: (() => {
      try {
        const fromClient = pickHost('sourceFileHost');
        if (fromClient) return fromClient;

        const v = safeStr(extra?.sourceFile);
        const host = urlHostHint(v);
        return host ? truncate(host, 160) : null;
      } catch {
        return null;
      }
    })(),
    lineNumber: pickNum('lineNumber'),
    columnNumber: pickNum('columnNumber'),

    // Basic client state
    visibility: pickStr('visibility', 20),
    readyState: pickStr('readyState', 30),
    effectiveType: pickStr('effectiveType', 20),
    downlink: pickStr('downlink', 20),
    rtt: pickStr('rtt', 20),

    // Opaque (cross-origin) script error diagnostics
    errorName: pickStr('errorName', 140),
    errorMessage: pickStr('errorMessage', 900),
    hasErrorObject: (() => {
      try {
        const v = extra?.hasErrorObject;
        return typeof v === 'boolean' ? v : null;
      } catch {
        return null;
      }
    })(),
    isOpaqueScriptError: (() => {
      try {
        const v = extra?.isOpaqueScriptError;
        return typeof v === 'boolean' ? v : null;
      } catch {
        return null;
      }
    })(),
    scriptInventory: (() => {
      try {
        const inv = safeObj(extra?.scriptInventory);
        if (!inv) return null;

        const scriptSrcHints = (() => {
          try {
            const raw = inv?.scriptSrcHints;
            if (!Array.isArray(raw)) return null;
            const outArr = [];
            for (const it of raw) {
              if (outArr.length >= 12) break;
              const s = safeStr(it);
              if (!s) continue;
              // Must be scheme-less and query/hash free.
              if (s.includes('://')) continue;
              if (/[^\S\r\n]/.test(s)) return null;
              if (/[\?#@]/.test(s)) continue;
              if (s.length > 420) outArr.push(truncate(s, 420));
              else outArr.push(s);
            }
            return outArr.length ? outArr : null;
          } catch {
            return null;
          }
        })();

        const scriptHosts = (() => {
          try {
            const raw = inv?.scriptHosts;
            if (!Array.isArray(raw)) return null;
            const outArr = [];
            const seen = new Set();
            for (const it of raw) {
              if (outArr.length >= 8) break;
              const h = sanitizeHostHint(it);
              if (!h) continue;
              const k = h.toLowerCase();
              if (seen.has(k)) continue;
              seen.add(k);
              outArr.push(truncate(h, 160));
            }
            return outArr.length ? outArr : null;
          } catch {
            return null;
          }
        })();

        const hasGtag = (() => {
          try {
            return typeof inv?.hasGtag === 'boolean' ? inv.hasGtag : null;
          } catch {
            return null;
          }
        })();

        const hasTikTok = (() => {
          try {
            return typeof inv?.hasTikTok === 'boolean' ? inv.hasTikTok : null;
          } catch {
            return null;
          }
        })();

        const hasGapi = (() => {
          try {
            return typeof inv?.hasGapi === 'boolean' ? inv.hasGapi : null;
          } catch {
            return null;
          }
        })();

        const o = {
          scriptSrcHints,
          scriptHosts,
          hasGtag,
          hasTikTok,
          hasGapi,
        };

        for (const k of Object.keys(o)) {
          if (o[k] === null) delete o[k];
        }

        return Object.keys(o).length ? o : null;
      } catch {
        return null;
      }
    })(),

    // Auth classification (Login)
    authClass: pickStr('authClass', 60),
    authProvider: pickStr('authProvider', 30),
    authTransport: pickStr('authTransport', 30),
    intent: pickStr('intent', 30),
    mode: pickStr('mode', 30),
    host: pickStr('host', 120),
    origin: pickStr('origin', 180),
  };

  for (const k of Object.keys(out)) {
    if (out[k] === null) delete out[k];
  }

  return Object.keys(out).length ? out : null;
}

export default async function publicErrorReport(req, res) {
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

  const reportRaw = safeObj(body?.report) || null;
  const kind = truncate(safeStr(reportRaw?.kind || body?.kind || 'error_report'), 80) || 'error_report';
  const kindLower = safeStr(kind).toLowerCase();
  const flow = truncate(safeStr(reportRaw?.flow || body?.flow || ''), 80);
  const codeRaw = truncate(safeStr(reportRaw?.code || body?.code || ''), 120);
  let code = codeRaw;
  const messageRedacted = truncate(redactPII(safeStr(reportRaw?.message || body?.message || '')), 1200);

  const page = truncate(safeStr(reportRaw?.page || body?.page || ''), 900);
  const pagePath = truncate(safeStr(body?.pagePath || ''), 180) || (() => {
    try {
      if (!page) return '';
      const u = new URL(page);
      return u.pathname || '';
    } catch {
      return '';
    }
  })();

  const ref = truncate(safeStr(reportRaw?.ref || body?.ref || ''), 900);
  const lang = truncate(safeStr(reportRaw?.lang || body?.lang || ''), 32);
  const ua = truncate(safeStr(reportRaw?.ua || body?.ua || ''), 320);
  const tz = truncate(safeStr(body?.tz || ''), 64);
  const build = truncate(safeStr(body?.build || ''), 80);
  const anonId = truncate(safeStr(body?.anonId || ''), 120);

  const extra = safeObj(reportRaw?.extra) || safeObj(body?.extra) || {};
  const stack = truncate(redactPII(safeStr(extra?.stack || body?.stack || '')), 6000);
  const componentStack = truncate(redactPII(safeStr(extra?.componentStack || body?.componentStack || '')), 6000);
  const extraStored = pickExtraForStorage(extra);

  const resourceTag = safeStr(extraStored?.tagName || extra?.tagName).toLowerCase();
  const resourceHint = (
    safeStr(extraStored?.resourceUrlHint) ||
    safeStr(extraStored?.resourceHost) ||
    urlHostPathHintNoScheme(safeStr(extra?.resourceUrl)) ||
    urlHostHint(safeStr(extra?.resourceUrl))
  ).toLowerCase();

  const isKnownAnalytics3pScript =
    resourceTag === 'script' &&
    (resourceHint.includes('googletagmanager.com/gtag/js') ||
      resourceHint.includes('analytics.tiktok.com/i18n/pixel/events.js'));

  // Reduce noise: crawlers often trigger <link> resource load errors (favicon/fonts/css)
  // that do not reflect real-user issues. Ignore only those.
  if (safeStr(codeRaw) === 'resource_load_error' && isLikelyCrawlerUA(ua)) {
    if (resourceTag === 'link' || resourceTag === 'img' || isKnownAnalytics3pScript) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.setHeader('cache-control', 'no-store');
      res.end(JSON.stringify({ ok: true, id: null, deduped: true, ignored: true }));
      return;
    }
  }

  // Reduce noise: crawlers may request Apple AASA endpoints and, if they ever receive
  // an HTML fallback (or cached HTML), will trigger font-related CSP violations.
  // Keep real-user CSP issues visible by only ignoring conservative bot UAs.
  if (kindLower === 'csp_violation' && isLikelyCrawlerUA(ua)) {
    const isAASAPath =
      pagePath === '/apple-app-site-association' ||
      pagePath === '/.well-known/apple-app-site-association';

    if (isAASAPath) {
      const directive = safeStr(extraStored?.directive || extra?.directive).toLowerCase();
      const blocked = safeStr(extraStored?.blockedHost || extraStored?.blockedURI || extra?.blockedURI).toLowerCase();
      const isFontSrcData = directive === 'font-src' && (blocked === 'data' || blocked === 'data:' || blocked.startsWith('data:'));

      if (isFontSrcData) {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.setHeader('cache-control', 'no-store');
        res.end(JSON.stringify({ ok: true, id: null, deduped: true, ignored: true }));
        return;
      }
    }
  }

  // Reduce noise: browser auto-translate / embedded browsers may attempt to call
  // Google Translate telemetry endpoints that are not required for the app.
  if (kindLower === 'csp_violation') {
    try {
      const directive = safeStr(extraStored?.directive || extra?.directive).toLowerCase();
      const blockedHint = (
        safeStr(extraStored?.blockedUrlHint) ||
        safeStr(extraStored?.blockedHost) ||
        urlHostPathHintNoScheme(safeStr(extraStored?.blockedURI || extra?.blockedURI)) ||
        urlHostHint(safeStr(extraStored?.blockedURI || extra?.blockedURI))
      ).toLowerCase();

      if (directive === 'connect-src' && blockedHint.includes('translate.googleapis.com/element/log')) {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.setHeader('cache-control', 'no-store');
        res.end(JSON.stringify({ ok: true, id: null, deduped: true, ignored: true }));
        return;
      }
    } catch {
      // ignore
    }
  }

  // Reduce noise: in real user traffic, these scripts are commonly blocked by adblockers
  // and do not necessarily indicate a site defect.
  if (safeStr(codeRaw) === 'resource_load_error' && isKnownAnalytics3pScript) {
    code = '3p_resource_load_error_analytics';
  }

  // Keep CSP violations actionable even when URLs are redacted.
  // Prefer the scheme-less host+path hint from client/server parsing.
  const message = (() => {
    try {
      // For resource loading errors, avoid losing the actionable part when URLs are redacted.
      if (safeStr(codeRaw) === 'resource_load_error') {
        const hint =
          safeStr(extraStored?.resourceUrlHint) ||
          safeStr(extraStored?.resourceHost) ||
          urlHostPathHintNoScheme(safeStr(extra?.resourceUrl)) ||
          urlHostHint(safeStr(extra?.resourceUrl));

        const hintSafe = safeStr(hint);
        if (hintSafe && safeStr(messageRedacted).startsWith('resource_error:')) {
          return truncate(`${messageRedacted}:${hintSafe}`, 520);
        }
      }

      if (kindLower === 'csp_violation') {
        const hint =
          safeStr(extraStored?.blockedUrlHint) ||
          safeStr(extraStored?.blockedHost) ||
          // Last-resort: derive from raw extra even if client didn't send hints.
          urlHostPathHintNoScheme(safeStr(extra?.blockedURI)) ||
          urlHostHint(safeStr(extra?.blockedURI));

        const hintSafe = safeStr(hint);
        if (hintSafe) return truncate(hintSafe, 420);

        // Never store a pure redaction token as CSP message.
        if (messageRedacted === '[URL]') return 'csp_blocked';
      }
    } catch {
      // ignore
    }
    return messageRedacted;
  })();

  const consoleItems = pickConsole(body?.console || body?.consoleItems || [], 40);
  const serverMeta = pickServerMeta(req);

  // Basic minimum: message or stack should exist.
  if (!message && !stack && !componentStack) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'missing_error_details' }));
    return;
  }

  const uid = safeStr(token?.uid);
  const email = safeStr(token?.email);

  const fingerprint = sha256Short(`${kind}|${code}|${message}|${stack}|${componentStack}|${pagePath}`);
  const dayKey = dayKeyTRFromMs(Date.now());
  const actorKey = uid || anonId || 'unknown';
  const dedupeId = `${dayKey}__${actorKey}__${fingerprint || 'nofp'}`;

  const { db, FieldValue } = getAdmin();

  // Best-effort dedupe to reduce spam: one report per (day, actor, fingerprint)
  const dedupeRef = db.collection('clientErrorReportDedupe').doc(dedupeId);
  const feedbackRef = db.collection('matchmakingFeedback').doc();

  const now = FieldValue.serverTimestamp();

  const textLines = [
    `kind: ${kind}`,
    flow ? `flow: ${flow}` : null,
    code ? `code: ${code}` : null,
    pagePath ? `page: ${pagePath}` : null,
    extraStored?.isOpaqueScriptError ? 'opaqueScriptError: true' : null,
    extraStored?.errorName ? `errorName: ${extraStored.errorName}` : null,
    extraStored?.authClass ? `authClass: ${extraStored.authClass}` : null,
    extraStored?.authProvider ? `authProvider: ${extraStored.authProvider}` : null,
    extraStored?.authTransport ? `authTransport: ${extraStored.authTransport}` : null,
    // CSP/resource troubleshooting: keep a safe host hint even if full URL is redacted.
    extraStored?.directive ? `directive: ${extraStored.directive}` : null,
    extraStored?.blockedHost ? `blockedHost: ${extraStored.blockedHost}` : null,
    extraStored?.blockedUrlHint ? `blockedUrlHint: ${extraStored.blockedUrlHint}` : null,
    extraStored?.sourceFileHost ? `sourceFileHost: ${extraStored.sourceFileHost}` : null,
    extraStored?.resourceHost ? `resourceHost: ${extraStored.resourceHost}` : null,
    extraStored?.resourceUrlHint ? `resourceUrlHint: ${extraStored.resourceUrlHint}` : null,
    extraStored?.rel ? `rel: ${extraStored.rel}` : null,
    extraStored?.as ? `as: ${extraStored.as}` : null,
    extraStored?.resourceUrl ? `resource: ${extraStored.resourceUrl}` : null,
    extraStored?.filename ? `file: ${extraStored.filename}` : null,
    extraStored?.filenameHint ? `fileHint: ${extraStored.filenameHint}` : null,
    Array.isArray(extraStored?.stackUrlHints) && extraStored.stackUrlHints.length
      ? `stackUrlHints: ${extraStored.stackUrlHints.join(' | ')}`
      : null,
    Array.isArray(extraStored?.scriptInventory?.scriptHosts) && extraStored.scriptInventory.scriptHosts.length
      ? `scriptHosts: ${extraStored.scriptInventory.scriptHosts.join(' | ')}`
      : null,
    Array.isArray(extraStored?.scriptInventory?.scriptSrcHints) && extraStored.scriptInventory.scriptSrcHints.length
      ? `scriptSrcHints: ${extraStored.scriptInventory.scriptSrcHints.join(' | ')}`
      : null,
    message ? `message: ${message}` : null,
    fingerprint ? `fp: ${fingerprint}` : null,
  ].filter(Boolean);

  const doc = {
    kind: 'bug',
    status: 'new',

    // Moderation UI displays step/kind on top.
    step: `auto_error:${kind}`,

    // Moderation UI currently checks it.text; keep it populated.
    text: truncate(textLines.join('\n'), 2400),
    message: truncate(message || kind, 2400),

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
      clientProjectId: truncate(safeStr(reportRaw?.projectId || ''), 80) || null,
      clientAuthDomain: truncate(safeStr(reportRaw?.authDomain || ''), 120) || null,
      server: serverMeta,
    },

    data: {
      report: {
        v: reportRaw?.v || 1,
        kind,
        flow,
        code,
        message,
        ts: safeInt(reportRaw?.ts, Date.now()) || Date.now(),
        page,
        ref,
        lang,
        ua,
        uid: truncate(safeStr(reportRaw?.uid || ''), 128),
        projectId: truncate(safeStr(reportRaw?.projectId || ''), 80),
        authDomain: truncate(safeStr(reportRaw?.authDomain || ''), 120),
      },
      server: serverMeta,
      extra: extraStored,
      error: {
        stack,
        componentStack,
      },
      console: consoleItems,
      fingerprint: fingerprint || null,
      actor: {
        uid: uid || null,
        email: email || null,
        anonId: anonId || null,
      },
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
