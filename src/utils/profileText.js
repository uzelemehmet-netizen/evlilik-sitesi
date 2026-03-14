function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeUiLang(lang) {
  const s = safeStr(lang).toLowerCase();
  const base = s.split('-')[0] || '';
  return base;
}

export function getLocalizedProfileText(obj, field, uiLang) {
  const o = obj && typeof obj === 'object' ? obj : {};
  const lang = normalizeUiLang(uiLang);

  const byLang =
    lang === 'tr'
      ? safeStr(o[`${field}Tr`])
      : lang === 'id'
        ? safeStr(o[`${field}Id`])
        : '';

  if (byLang) return byLang;

  const base = safeStr(o[field]);
  if (base) return base;

  // Legacy fallbacks some payloads used
  if (field === 'about') {
    const bio = safeStr(o.bio) || safeStr(o?.details?.about) || safeStr(o?.details?.bio);
    if (bio) return bio;
  }
  if (field === 'expectations') {
    const ex = safeStr(o?.details?.expectations);
    if (ex) return ex;
  }

  return '';
}
