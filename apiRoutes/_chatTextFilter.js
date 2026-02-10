function safeStr(v) {
  return typeof v === 'string' ? v : '';
}

function normalize(text) {
  return safeStr(text).toLowerCase();
}

function looksLikeContact(text) {
  const s = normalize(text);

  // Email
  if (/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(s)) return true;

  // Links / domains
  if (/https?:\/\//i.test(s) || /www\./i.test(s) || /\b[a-z0-9-]+\.(com|net|org|id|tr|me)\b/i.test(s)) return true;

  // Social keywords
  if (/(instagram|insta|\big\b|facebook|\bfb\b|telegram|\bt\.me\b|whatsapp|\bwa\.me\b|line\b|tiktok|discord)/i.test(s)) return true;

  // Handle-like
  if (/@[a-z0-9_\.]{2,}/i.test(s)) return true;

  // Phone-like: long digit sequences (avoid false positives like 170 cm)
  const digitsOnly = s.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 8) {
    // require either +, or multiple separators, or very long number
    if (/\+\s*\d{8,}/.test(s)) return true;
    if (digitsOnly.length >= 10) return true;
    if (/(\d[\s\-\.\(\)]*){8,}/.test(s)) return true;
  }

  return false;
}

function looksLikeSexualContent(text) {
  const s = normalize(text);

  // Keep this intentionally conservative to reduce false positives.
  // We only match common explicit keywords across EN/TR/ID.
  if (/\b(porn|porno|xxx|nude|nudity|naked|onlyfans)\b/i.test(s)) return true;

  // "sex" / "seks" / "cinsel" (TR) / "telanjang" (ID)
  if (/\b(sex|seks|cinsel|erotik|telanjang)\b/i.test(s)) return true;

  return false;
}

export function detectForbiddenChatText(text) {
  const reasons = [];

  if (looksLikeContact(text)) reasons.push('contact');
  if (looksLikeSexualContent(text)) reasons.push('sexual');

  return {
    forbidden: reasons.length > 0,
    reasons: Array.from(new Set(reasons)),
  };
}
