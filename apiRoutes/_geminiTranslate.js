import { detectPII, redactPII } from './_pii.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeLang(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'tr' || s === 'id' || s === 'en') return s;
  return '';
}

function targetLabel(lang) {
  if (lang === 'tr') return 'Turkish';
  if (lang === 'id') return 'Indonesian';
  if (lang === 'en') return 'English';
  return '';
}

function safeJsonParse(text) {
  try {
    return JSON.parse(String(text || ''));
  } catch {
    return null;
  }
}

function truncate(s, n = 240) {
  const t = String(s || '').trim();
  if (!t) return '';
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function uniq(list) {
  const out = [];
  const seen = new Set();
  for (const x of Array.isArray(list) ? list : []) {
    const s = safeStr(x);
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

let MODEL_CACHE = { atMs: 0, models: [] };

async function listGeminiModels(apiKey) {
  const now = Date.now();
  // Cache for 15 minutes to avoid extra API calls.
  if (MODEL_CACHE.atMs && now - MODEL_CACHE.atMs < 15 * 60 * 1000 && Array.isArray(MODEL_CACHE.models) && MODEL_CACHE.models.length) {
    return MODEL_CACHE.models;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeoutMs = Number.parseInt(String(process.env.GEMINI_HTTP_TIMEOUT_MS || ''), 10);
  const effectiveTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 12000;
  const timer = setTimeout(() => controller.abort(), effectiveTimeoutMs);

  try {
    const resp = await fetch(url, { method: 'GET', signal: controller.signal });
    if (!resp.ok) return [];
    const json = await resp.json();
    const models = Array.isArray(json?.models) ? json.models : [];
    const out = models
      .map((m) => {
        const name = safeStr(m?.name).replace(/^models\//, '');
        const methods = Array.isArray(m?.supportedGenerationMethods) ? m.supportedGenerationMethods.map((x) => safeStr(x)) : [];
        return { name, methods };
      })
      .filter((m) => m.name);

    MODEL_CACHE = { atMs: now, models: out };
    return out;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function pickPreferredModelFromList(models) {
  // Prefer fast/cheap models first.
  const preferred = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
  ];

  const hasGenerateContent = (m) => (Array.isArray(m?.methods) ? m.methods : []).includes('generateContent');
  const supported = (Array.isArray(models) ? models : []).filter((m) => m?.name && hasGenerateContent(m));
  if (!supported.length) return '';

  for (const p of preferred) {
    const hit = supported.find((m) => m.name === p);
    if (hit) return hit.name;
  }

  // Fallback: any generateContent-capable model.
  return supported[0].name;
}

export async function translateWithGemini({ text, targetLang }) {
  const apiKey = safeStr(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY);
  if (!apiKey) {
    const err = new Error('translate_not_configured');
    err.statusCode = 501;
    throw err;
  }

  const t = safeStr(text);
  const lang = normalizeLang(targetLang);
  if (!t || !lang) {
    const err = new Error('bad_request');
    err.statusCode = 400;
    throw err;
  }

  const pii = detectPII(t);
  if (pii.hasPII) {
    const err = new Error('pii_blocked');
    err.statusCode = 422;
    err.details = { reasons: pii.reasons };
    throw err;
  }

  // Extra safety: even if heuristics miss something, still redact patterns.
  const safeText = redactPII(t);

  // AI Studio / Gemini API (best-effort). Using REST to avoid client-side key exposure.
  // Model choice: try env override; otherwise try a small fallback list for compatibility.
  const modelFromEnv = safeStr(process.env.GEMINI_TRANSLATE_MODEL);
  const strictModel = ['1', 'true', 'yes', 'on'].includes(safeStr(process.env.GEMINI_STRICT_MODEL).toLowerCase());
  const enableModelDiscovery = ['1', 'true', 'yes', 'on'].includes(
    safeStr(process.env.GEMINI_ENABLE_MODEL_DISCOVERY).toLowerCase()
  );

  let discoveredPreferred = '';
  if (!strictModel && enableModelDiscovery) {
    try {
      const list = await listGeminiModels(apiKey);
      discoveredPreferred = pickPreferredModelFromList(list);
    } catch {
      discoveredPreferred = '';
    }
  }

  // Keep a minimal static fallback list (avoid "-latest" which can be unsupported).
  const fallbackModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  const modelsToTry = uniq(
    strictModel && modelFromEnv
      ? [modelFromEnv]
      : [modelFromEnv, discoveredPreferred, ...fallbackModels]
  );

  const prompt =
    `You are a professional translation engine.\n` +
    `Task: translate the user's message into ${targetLabel(lang)}.\n` +
    `Before translating, silently fix obvious spelling/typo/word-choice mistakes in the SOURCE text (do not mention corrections).\n` +
    `Disambiguate using common conversational context and choose the most likely intended meaning.\n` +
    `Output rules: return ONLY the final translation text (no quotes, no labels, no explanations).\n` +
    `Preserve emojis and punctuation style; keep proper names as-is unless a clear standard transliteration exists.\n` +
    `Text: ${safeText}`;

  let lastStatus = 0;
  let lastProviderDetails = null;
  let lastProviderErrorStatus = '';
  const tried = [];
  for (const model of modelsToTry) {
    tried.push(model);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timeoutMs = Number.parseInt(String(process.env.GEMINI_HTTP_TIMEOUT_MS || ''), 10);
    const effectiveTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 12000;
    const timer = setTimeout(() => controller.abort(), effectiveTimeoutMs);

    let resp;
    try {
      resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 256 },
      }),
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      const err = new Error('translate_failed');
      err.statusCode = 502;
      err.details = {
        provider: 'gemini',
        reason: String(e?.name || '') === 'AbortError' ? 'timeout' : 'network_error',
        model,
      };
      throw err;
    } finally {
      clearTimeout(timer);
    }

    if (!resp.ok) {
      lastStatus = resp.status || 0;
      let bodyText = '';
      let bodyJson = null;
      try {
        bodyText = await resp.text();
        bodyJson = safeJsonParse(bodyText);
      } catch {
        bodyText = '';
        bodyJson = null;
      }

      lastProviderDetails = {
        provider: 'gemini',
        providerStatus: lastStatus,
        model,
        providerErrorStatus: safeStr(bodyJson?.error?.status) || '',
        providerErrorMessage: truncate(bodyJson?.error?.message || bodyText || ''),
        triedModels: tried.slice(-8),
      };

      lastProviderErrorStatus = safeStr(bodyJson?.error?.status) || '';

      // Transient errors (rate limit / server error): don't waste retries on model names.
      if (resp.status === 429 || resp.status >= 500) break;
      // Otherwise, try the next model (useful for "model not found" / permission issues).
      continue;
    }

    const json = await resp.json();
    const out =
      json?.candidates?.[0]?.content?.parts?.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('') || '';

    const s = safeStr(out);
    if (s) return s;
  }

  const err = new Error('translate_failed');
  if (lastStatus === 429 && lastProviderErrorStatus === 'RESOURCE_EXHAUSTED') {
    err.message = 'translate_quota_exhausted';
    err.statusCode = 429;
  } else if (lastStatus === 429) {
    err.message = 'translate_rate_limited';
    err.statusCode = 429;
  } else {
    err.statusCode = lastStatus ? 502 : 500;
  }
  if (lastProviderDetails) err.details = lastProviderDetails;
  throw err;
}
