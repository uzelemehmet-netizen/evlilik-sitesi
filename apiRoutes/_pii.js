function safeStr(v) {
  return typeof v === 'string' ? v : '';
}

function collapseSpaces(s) {
  return String(s).replace(/\s+/g, ' ').trim();
}

// Best-effort PII detection/redaction.
// Goal: Prevent sensitive content from being sent to 3rd-party translation providers.
export function detectPII(text) {
  const t = safeStr(text);
  const reasons = [];

  // Email
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(t)) reasons.push('email');

  // URLs / social
  if (/(https?:\/\/|www\.)\S+/i.test(t)) reasons.push('url');
  if (/(?:^|\s)@[a-z0-9_\.]{2,}(?:\s|$)/i.test(t)) reasons.push('handle');

  // Phone numbers (very permissive)
  // Matches things like +90 5xx..., 08xx..., 62..., (xxx) xxx-xxxx, etc.
  if (/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}(?!\d)/.test(t)) reasons.push('phone');

  // IBAN (generic) + TR IBAN
  if (/\bTR\d{2}[\s]?[0-9A-Z]{4}[\s]?[0-9A-Z]{4}[\s]?[0-9A-Z]{4}[\s]?[0-9A-Z]{4}[\s]?[0-9A-Z]{0,8}\b/i.test(t)) {
    reasons.push('iban');
  }
  if (/\b[A-Z]{2}\d{2}[\s]?[0-9A-Z]{11,30}\b/i.test(t)) reasons.push('iban_like');

  // Turkish ID (TCKN) heuristics
  if (/\b\d{11}\b/.test(t) && /(tc\s*kimlik|t\.?c\.?\s*no|kimlik\s*no)/i.test(t)) reasons.push('national_id');

  // Passport / identity keywords
  if (/(passport|pasaport|kimlik|n\.?i\.?k|ktp|no\.?\s*ktp)/i.test(t) && /\b[0-9A-Z]{6,}\b/i.test(t)) reasons.push('identity_doc');

  // Bank account keywords + long digit sequences
  if (/(hesap\s*no|iban|banka|rekening|no\.?\s*rekening|akun\s*bank)/i.test(t) && /\b\d[\d\s-]{8,}\b/.test(t)) {
    reasons.push('bank_account');
  }

  // Name disclosure patterns (heuristic)
  // We avoid blocking common sentences; only trigger on explicit self-identification phrases.
  if (/(benim\s+ad(ı|im)\s*[:：]?|ad(ı|im)\s*[:：]?|ismim\s*[:：]?|nama\s+saya\s*[:：]?|saya\s+bernama\s*[:：]?)/i.test(t)) {
    reasons.push('name');
  }

  return {
    hasPII: reasons.length > 0,
    reasons: Array.from(new Set(reasons)),
  };
}

export function redactPII(text) {
  let s = safeStr(text);

  // Email
  s = s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]');

  // URLs
  s = s.replace(/(https?:\/\/|www\.)\S+/gi, '[URL]');

  // Handles
  s = s.replace(/(^|\s)@[a-z0-9_\.]{2,}(?=\s|$)/gi, '$1[HANDLE]');

  // TR IBAN + generic IBAN
  s = s.replace(/\bTR\d{2}(?:\s?[0-9A-Z]{4}){4,7}\b/gi, '[IBAN]');
  s = s.replace(/\b[A-Z]{2}\d{2}[\s]?[0-9A-Z]{11,30}\b/g, '[IBAN]');

  // Long-ish number sequences that look like account/phone
  s = s.replace(/\b\+?\d[\d\s().-]{8,}\b/g, '[NUMBER]');

  // Explicit name patterns: keep prefix, redact the rest of the line (best-effort)
  s = s.replace(
    /(benim\s+ad(ı|im)\s*[:：]?|ad(ı|im)\s*[:：]?|ismim\s*[:：]?|nama\s+saya\s*[:：]?|saya\s+bernama\s*[:：]?)([^\n]{0,60})/gi,
    (m, p1) => `${collapseSpaces(p1)} [NAME]`
  );

  return s;
}
