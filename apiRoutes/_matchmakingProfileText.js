import { detectPII } from './_pii.js';
import { isTranslateConfigured, translateTextProfile } from './_translate.js';

export const MAX_PROFILE_TEXT_LEN = 1800;
export const DEFAULT_PROFILE_TRANSLATE_CHARS = 400;
export const DEFAULT_PROFILE_MIN_TRANSLATE_CHARS = 1;

const TURKISH_CHAR_RE = /[çğıöşüÇĞİÖŞÜ]/;
const TURKISH_WORD_RE = /\b(ve|ile|icin|için|ama|fakat|olarak|evlilik|hayat|namaz|dürüst|guvenilir|güvenilir|ariyorum|arıyorum|istiyorum|kendimi)\b/gi;
const INDONESIAN_WORD_RE = /\b(yang|dan|dengan|untuk|tidak|ingin|mencari|seorang|saya|kami|sholat|salat|jujur|menikah|kehidupan|wanita|keluarga|suami|bertanggung|jawab|pekerja|rumah|sendiri|luar|negeri|negri)\b/gi;

function safeStr(value, maxLen) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return typeof maxLen === 'number' && maxLen > 0 && s.length > maxLen ? s.slice(0, maxLen) : s;
}

function countRegexMatches(text, regex) {
  const source = safeStr(text);
  if (!source) return 0;
  const re = new RegExp(regex.source, regex.flags);
  let count = 0;
  while (re.exec(source)) count += 1;
  return count;
}

export function normalizeProfileLang(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'tr' || s === 'id') return s;
  return '';
}

export function oppositeProfileLang(lang) {
  return lang === 'tr' ? 'id' : 'tr';
}

export function detectForbiddenContactPII(text) {
  const pii = detectPII(text);
  const reasons = Array.isArray(pii?.reasons) ? pii.reasons : [];
  const forbidden = reasons.filter((r) => r && r !== 'name');
  return {
    hasForbidden: forbidden.length > 0,
    reasons: forbidden,
  };
}

export function isProfileTextTranslationConfigured() {
  return isTranslateConfigured();
}

export function inferProfileTextLang({ sourceLang, original, trValue, idValue } = {}) {
  const direct = normalizeProfileLang(sourceLang);
  if (direct) return direct;

  const text = safeStr(original, MAX_PROFILE_TEXT_LEN);
  const tr = safeStr(trValue, MAX_PROFILE_TEXT_LEN);
  const id = safeStr(idValue, MAX_PROFILE_TEXT_LEN);

  if (!text) return '';
  if (tr && text === tr && text !== id) return 'tr';
  if (id && text === id && text !== tr) return 'id';
  if (tr && !id && text === tr) return 'tr';
  if (id && !tr && text === id) return 'id';

  const turkishScore = (TURKISH_CHAR_RE.test(text) ? 3 : 0) + countRegexMatches(text, TURKISH_WORD_RE);
  const indonesianScore = countRegexMatches(text, INDONESIAN_WORD_RE);

  if (turkishScore <= 0 && indonesianScore <= 0) return '';
  if (Math.abs(turkishScore - indonesianScore) < 2) return '';
  return turkishScore > indonesianScore ? 'tr' : 'id';
}

export async function buildBilingualProfileText(text, sourceLang, opts = {}) {
  const maxLen = typeof opts?.maxLen === 'number' && Number.isFinite(opts.maxLen) ? opts.maxLen : MAX_PROFILE_TEXT_LEN;
  const translateChars =
    typeof opts?.translateChars === 'number' && Number.isFinite(opts.translateChars)
      ? opts.translateChars
      : DEFAULT_PROFILE_TRANSLATE_CHARS;
  const minChars =
    typeof opts?.minChars === 'number' && Number.isFinite(opts.minChars)
      ? opts.minChars
      : DEFAULT_PROFILE_MIN_TRANSLATE_CHARS;

  const original = safeStr(text, maxLen);
  const inferredSource = inferProfileTextLang({
    sourceLang,
    original,
    trValue: opts?.trValue,
    idValue: opts?.idValue,
  });
  const fallbackSource = normalizeProfileLang(opts?.fallbackSourceLang);
  const src = inferredSource || fallbackSource;
  const target = src ? oppositeProfileLang(src) : '';

  const out = {
    sourceLang: src,
    targetLang: target,
    original,
    tr: src === 'tr' ? original : '',
    id: src === 'id' ? original : '',
    translated: false,
    skipped: false,
    truncated: false,
    translateConfigured: isTranslateConfigured(),
    skipReason: '',
  };

  if (!original) {
    out.skipped = true;
    out.skipReason = 'empty';
    return out;
  }

  if (!src || !target) {
    out.skipped = true;
    out.skipReason = 'source_lang_unknown';
    return out;
  }

  if (original.length < minChars) {
    out.skipped = true;
    out.skipReason = 'below_min_chars';
    return out;
  }

  if (!out.translateConfigured) {
    out.skipped = true;
    out.skipReason = 'translate_not_configured';
    return out;
  }

  const chunk = original.slice(0, translateChars);
  out.truncated = original.length > translateChars;
  const translated = await translateTextProfile({ text: chunk, targetLang: target });
  const finalText = out.truncated && translated ? `${translated}…` : translated;

  if (target === 'tr') out.tr = finalText;
  if (target === 'id') out.id = finalText;
  out.translated = !!safeStr(finalText);
  return out;
}