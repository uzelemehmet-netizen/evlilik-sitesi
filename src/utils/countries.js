import { ISO_COUNTRY_CODES } from '../data/isoCountryCodes';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export function isTwoLetterCode(v) {
  const s = safeStr(v).toLowerCase();
  return /^[a-z]{2}$/.test(s);
}

export function getRegionLabel(code, locale) {
  const s = safeStr(code).toLowerCase();
  if (!s) return '';
  if (!isTwoLetterCode(s)) return String(code ?? '').trim();

  const region = s.toUpperCase();
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      const dn = new Intl.DisplayNames([locale, 'en'], { type: 'region' });
      return dn.of(region) || region;
    }
  } catch {
    // ignore
  }

  return region;
}

export function buildCountryDatalistOptions(locale) {
  const options = (ISO_COUNTRY_CODES || []).map((code) => {
    const v = String(code || '').toLowerCase();
    return { value: v, label: getRegionLabel(v, locale) };
  });

  options.sort((a, b) => {
    const al = String(a?.label || '');
    const bl = String(b?.label || '');
    return al.localeCompare(bl, locale || undefined, { sensitivity: 'base' });
  });

  return options;
}
