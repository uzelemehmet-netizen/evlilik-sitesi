import { COMPANY } from '../config/company';

function normalizeLangBase(lang) {
  const raw = String(lang || '').trim().toLowerCase();
  if (!raw) return '';
  const base = raw.split('-')[0];
  // Some browsers report Indonesian as "in".
  return base === 'in' ? 'id' : base;
}

function guessTimeZone() {
  try {
    return String(Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
  } catch {
    return '';
  }
}

function safeUpperCountry(raw) {
  const s = String(raw || '').trim().toUpperCase();
  return s && /^[A-Z]{2}$/.test(s) ? s : '';
}

function pickCountryFromNavigatorLanguage() {
  try {
    const lang = normalizeLangBase(typeof navigator !== 'undefined' ? navigator.language : '');
    if (lang === 'id') return 'ID';
    if (lang === 'tr') return 'TR';
    return '';
  } catch {
    return '';
  }
}

export function getSupportLineFromCountry(countryRaw) {
  const country = safeUpperCountry(countryRaw);
  const isId = country === 'ID';

  if (isId) {
    return {
      country: 'ID',
      prefer: 'id',
      phoneTel: COMPANY.phoneIdTel,
      phoneDisplay: COMPANY.phoneIdDisplay || COMPANY.phoneIdTel,
    };
  }

  // Default: TR line for non-ID countries.
  return {
    country: country || 'TR',
    prefer: 'tr',
    phoneTel: COMPANY.phoneTr,
    phoneDisplay: '+90 555 034 3852',
  };
}

export function getSupportLineFallback(opts = {}) {
  const langBase = normalizeLangBase(opts?.lang);

  if (langBase === 'id') return getSupportLineFromCountry('ID');
  if (langBase === 'tr') return getSupportLineFromCountry('TR');

  const tz = guessTimeZone();
  if (tz.includes('jakarta') || tz.includes('makassar') || tz.includes('jayapura')) return getSupportLineFromCountry('ID');
  if (tz.includes('istanbul')) return getSupportLineFromCountry('TR');

  // Conservative default: TR.
  return getSupportLineFromCountry('TR');
}

const CACHE_KEY = 'uniqah:client_country_v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export async function getClientCountry() {
  if (typeof window === 'undefined') return '';

  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const ts = typeof parsed?.ts === 'number' ? parsed.ts : 0;
      const country = safeUpperCountry(parsed?.country);
      if (country && ts && Date.now() - ts < CACHE_TTL_MS) return country;
    }
  } catch {
    // ignore
  }

  try {
    const res = await fetch('/api/client-ip', { method: 'GET', headers: { accept: 'application/json' } });
    const json = await res.json().catch(() => null);
    const country = safeUpperCountry(json?.country);

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ country: country || '', ts: Date.now() }));
    } catch {
      // ignore
    }

    return country;
  } catch {
    return '';
  }
}

export async function resolveSupportLine(opts = {}) {
  const country = await getClientCountry();
  if (country) return getSupportLineFromCountry(country);

  // If edge headers are not available (local dev, some hosts), fallback.
  return getSupportLineFallback(opts);
}

export function getSupportCountrySync(opts = {}) {
  // Best-effort: prefer cached country if present, else quick heuristics.
  if (typeof window === 'undefined') return '';

  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const country = safeUpperCountry(parsed?.country);
      if (country) return country;
    }
  } catch {
    // ignore
  }

  const navGuess = pickCountryFromNavigatorLanguage();
  if (navGuess) return navGuess;

  const fb = getSupportLineFallback(opts);
  return safeUpperCountry(fb?.country);
}
