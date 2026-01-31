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
  // Model choice: fast + cheap. Change via env if needed.
  const model = safeStr(process.env.GEMINI_TRANSLATE_MODEL) || 'gemini-1.5-flash';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt =
    `You are a translation engine.\n` +
    `Translate the text into ${targetLabel(lang)}.\n` +
    `Rules: return ONLY the translation, no quotes, no explanations, keep emojis, keep punctuation.\n` +
    `Text: ${safeText}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 256 },
    }),
  });

  if (!resp.ok) {
    const err = new Error('translate_failed');
    err.statusCode = resp.status >= 400 && resp.status < 600 ? 502 : 500;
    throw err;
  }

  const json = await resp.json();
  const out =
    json?.candidates?.[0]?.content?.parts?.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('') || '';

  const s = safeStr(out);
  if (!s) {
    const err = new Error('translate_failed');
    err.statusCode = 502;
    throw err;
  }

  return s;
}
