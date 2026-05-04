import { normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { buildBilingualProfileText, inferProfileTextLang, normalizeProfileLang } from './_matchmakingProfileText.js';
import { checkAndRecordGeminiTranslateRpm } from './_geminiTranslateRpm.js';
import { translateTextProfile } from './_translate.js';

function safeStr(value, maxLen) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return typeof maxLen === 'number' && maxLen > 0 && s.length > maxLen ? s.slice(0, maxLen) : s;
}

const MAX_TEXT_LEN = 1800;

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const body = normalizeBody(req);

    const text = safeStr(body?.text, MAX_TEXT_LEN);
    const targetLang = normalizeProfileLang(body?.targetLang);
    const sourceLang = normalizeProfileLang(body?.sourceLang);
    const trValue = safeStr(body?.trValue, MAX_TEXT_LEN);
    const idValue = safeStr(body?.idValue, MAX_TEXT_LEN);
    const key = safeStr(body?.key, 200);

    if (!text || !targetLang) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const existing = targetLang === 'tr' ? trValue : idValue;
    if (existing) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, text: existing, targetLang, cached: true }));
      return;
    }

    const inferred = inferProfileTextLang({
      sourceLang,
      original: text,
      trValue,
      idValue,
    });

    if (inferred && inferred === targetLang) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, text, targetLang, skipped: true, reason: 'already_target_lang' }));
      return;
    }

    const rpmLimitRaw = String(process.env.GEMINI_TRANSLATE_RPM_LIMIT || '').trim();
    const rpmLimitParsed = rpmLimitRaw ? Number.parseInt(rpmLimitRaw, 10) : NaN;
    const rpmLimit = Number.isFinite(rpmLimitParsed) ? rpmLimitParsed : 15;

    if (rpmLimit > 0) {
      await checkAndRecordGeminiTranslateRpm({
        limitPerMinute: rpmLimit,
        context: {
          route: 'matchmaking-profile-text-translate',
          uid: safeStr(decoded?.uid),
          email: safeStr(decoded?.email),
          key,
          targetLang,
          textLen: text.length,
        },
      });
    }

    const result = await buildBilingualProfileText(text, sourceLang, {
      trValue,
      idValue,
      maxLen: MAX_TEXT_LEN,
      translateChars: MAX_TEXT_LEN,
      minChars: 1,
    });

    let translated = safeStr(targetLang === 'tr' ? result?.tr : result?.id, MAX_TEXT_LEN);

    // Old records can carry stale/missing sourceLang, especially for English text.
    // In that case, fall back to direct translation for the current UI target.
    if (!translated) {
      translated = safeStr(
        await translateTextProfile({
          text,
          targetLang,
          provider: 'gemini',
        }),
        MAX_TEXT_LEN
      );
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        text: translated,
        targetLang,
        translated: !!translated,
        skipped: !!result?.skipped,
        reason: safeStr(result?.skipReason, 120),
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: false,
        error: String(e?.message || 'translate_failed'),
      })
    );
  }
}