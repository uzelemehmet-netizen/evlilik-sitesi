import { normalizeBody } from './_firebaseAdmin.js';
import { translateText } from './_translate.js';
import { checkAndRecordGeminiTranslateRpm } from './_geminiTranslateRpm.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeLang(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'tr' || s === 'en' || s === 'id') return s;
  return '';
}

const MAX_TEXT_LEN = 1800;
const TRANSLATE_CHARS = 800;
const MIN_TRANSLATE_CHARS = 3;

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const body = normalizeBody(req);
    const rawText = safeStr(body?.text);
    const targetLang = normalizeLang(body?.targetLang) || 'tr';
    const key = safeStr(body?.key);

    if (!rawText) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const original = rawText.length > MAX_TEXT_LEN ? rawText.slice(0, MAX_TEXT_LEN) : rawText;
    if (original.length < MIN_TRANSLATE_CHARS) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, targetLang, text: original, skipped: true }));
      return;
    }

    const chunk = original.slice(0, TRANSLATE_CHARS);
    const truncated = original.length > TRANSLATE_CHARS;

    const rpmLimitRaw = String(process.env.GEMINI_TRANSLATE_RPM_LIMIT || '').trim();
    const rpmLimitParsed = rpmLimitRaw ? Number.parseInt(rpmLimitRaw, 10) : NaN;
    const rpmLimit = Number.isFinite(rpmLimitParsed) ? rpmLimitParsed : 15;

    if (rpmLimit > 0) {
      await checkAndRecordGeminiTranslateRpm({
        limitPerMinute: rpmLimit,
        context: {
          route: 'public-review-translate',
          key,
          targetLang,
          textLen: chunk.length,
        },
      });
    }

    const translated = await translateText({ text: chunk, targetLang, provider: 'gemini' });
    const finalText = truncated && translated ? `${translated}…` : translated;

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, targetLang, text: finalText, truncated }));
  } catch (e) {
    const status = typeof e?.statusCode === 'number' ? e.statusCode : 500;
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: false,
        error: safeStr(e?.message) || 'translate_failed',
        details: e?.details && typeof e.details === 'object' ? e.details : null,
      })
    );
  }
}