function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeLang(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'tr' || s === 'id' || s === 'en') return s;
  return '';
}

function isConfigured() {
  const provider = safeStr(process.env.TRANSLATE_PROVIDER || '').toLowerCase();
  if (provider === 'deepl') return !!safeStr(process.env.DEEPL_API_KEY);
  if (provider === 'libretranslate') return !!safeStr(process.env.LIBRETRANSLATE_URL);
  if (provider === 'google') return !!safeStr(process.env.GOOGLE_TRANSLATE_API_KEY);
  return false;
}

function deeplTargetLang(lang) {
  if (lang === 'tr') return 'TR';
  if (lang === 'id') return 'ID';
  if (lang === 'en') return 'EN';
  return '';
}

async function translateWithDeepL(text, targetLang) {
  const key = safeStr(process.env.DEEPL_API_KEY);
  if (!key) {
    const err = new Error('translate_not_configured');
    err.statusCode = 501;
    throw err;
  }

  const url = safeStr(process.env.DEEPL_API_URL) || 'https://api-free.deepl.com/v2/translate';
  const target = deeplTargetLang(targetLang);
  if (!target) {
    const err = new Error('bad_request');
    err.statusCode = 400;
    throw err;
  }

  const body = new URLSearchParams();
  body.set('text', text);
  body.set('target_lang', target);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `DeepL-Auth-Key ${key}`,
    },
    body,
  });

  if (!resp.ok) {
    const err = new Error('translate_failed');
    err.statusCode = 502;
    throw err;
  }

  const json = await resp.json();
  const out = json?.translations?.[0]?.text;
  const s = safeStr(out);
  if (!s) {
    const err = new Error('translate_failed');
    err.statusCode = 502;
    throw err;
  }
  return s;
}

async function translateWithLibreTranslate(text, targetLang) {
  const url = safeStr(process.env.LIBRETRANSLATE_URL);
  if (!url) {
    const err = new Error('translate_not_configured');
    err.statusCode = 501;
    throw err;
  }

  const apiKey = safeStr(process.env.LIBRETRANSLATE_API_KEY);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      q: text,
      source: 'auto',
      target: targetLang,
      format: 'text',
    }),
  });

  if (!resp.ok) {
    const err = new Error('translate_failed');
    err.statusCode = 502;
    throw err;
  }

  const json = await resp.json();
  const out = json?.translatedText;
  const s = safeStr(out);
  if (!s) {
    const err = new Error('translate_failed');
    err.statusCode = 502;
    throw err;
  }
  return s;
}

function decodeHtmlEntities(s) {
  // Google Translate v2 bazen HTML entity döndürebiliyor.
  return String(s || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

async function translateWithGoogle(text, targetLang) {
  const apiKey = safeStr(process.env.GOOGLE_TRANSLATE_API_KEY);
  if (!apiKey) {
    const err = new Error('translate_not_configured');
    err.statusCode = 501;
    throw err;
  }

  // Google Cloud Translation API v2 (API key ile en kolay entegrasyon)
  // Doküman: https://cloud.google.com/translate/docs/reference/rest/v2/translate
  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      q: text,
      target: targetLang,
      format: 'text',
    }),
  });

  if (!resp.ok) {
    const err = new Error('translate_failed');
    err.statusCode = 502;
    throw err;
  }

  const json = await resp.json();
  const out = json?.data?.translations?.[0]?.translatedText;
  const s = safeStr(decodeHtmlEntities(out));
  if (!s) {
    const err = new Error('translate_failed');
    err.statusCode = 502;
    throw err;
  }
  return s;
}

export function normalizeChatLang(v) {
  return normalizeLang(v);
}

export function isTranslateConfigured() {
  return isConfigured();
}

export async function translateText({ text, targetLang }) {
  const t = safeStr(text);
  if (!t) {
    const err = new Error('bad_request');
    err.statusCode = 400;
    throw err;
  }

  const lang = normalizeLang(targetLang);
  if (!lang) {
    const err = new Error('bad_request');
    err.statusCode = 400;
    throw err;
  }

  const provider = safeStr(process.env.TRANSLATE_PROVIDER || '').toLowerCase();
  if (provider === 'deepl') return translateWithDeepL(t, lang);
  if (provider === 'libretranslate') return translateWithLibreTranslate(t, lang);
  if (provider === 'google') return translateWithGoogle(t, lang);

  const err = new Error('translate_not_configured');
  err.statusCode = 501;
  throw err;
}
