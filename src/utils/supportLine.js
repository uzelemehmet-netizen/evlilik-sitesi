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

function parseCountryFromAcceptLanguage(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (!value) return '';

  const parts = value
    .split(',')
    .map((entry) => entry.split(';')[0].trim())
    .filter(Boolean);

  for (const part of parts) {
    const base = normalizeLangBase(part);
    if (base === 'id') return 'ID';
    if (base === 'tr') return 'TR';
  }

  return '';
}

function parseCountryHintFromApiPayload(payload) {
  const directCountry = safeUpperCountry(payload?.country);
  if (directCountry) return directCountry;

  const acceptLanguageCountry = parseCountryFromAcceptLanguage(payload?.acceptLanguage || payload?.accept_language);
  if (acceptLanguageCountry) return acceptLanguageCountry;

  const region = String(payload?.region || '').trim().toLowerCase();
  const city = String(payload?.city || '').trim().toLowerCase();
  const placeHint = `${region} ${city}`;

  if (/(jakarta|makassar|jayapura|surabaya|bandung|medan|bali|yogyakarta)/i.test(placeHint)) return 'ID';
  if (/(istanbul|ankara|izmir|bursa)/i.test(placeHint)) return 'TR';

  return '';
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

function readCachedCountryFrom(storageLike) {
  try {
    const raw = storageLike?.getItem?.(CACHE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    const ts = typeof parsed?.ts === 'number' ? parsed.ts : 0;
    const country = safeUpperCountry(parsed?.country);
    if (!country || !ts) return '';
    if (Date.now() - ts >= CACHE_TTL_MS) return '';
    return country;
  } catch {
    return '';
  }
}

function writeCachedCountry(country) {
  const normalized = safeUpperCountry(country);
  const payload = JSON.stringify({ country: normalized || '', ts: Date.now() });

  try {
    sessionStorage.setItem(CACHE_KEY, payload);
  } catch {
    // ignore
  }

  try {
    localStorage.setItem(CACHE_KEY, payload);
  } catch {
    // ignore
  }
}

export async function getClientCountry() {
  if (typeof window === 'undefined') return '';

  const cachedSession = readCachedCountryFrom(typeof sessionStorage !== 'undefined' ? sessionStorage : null);
  if (cachedSession) return cachedSession;

  const cachedLocal = readCachedCountryFrom(typeof localStorage !== 'undefined' ? localStorage : null);
  if (cachedLocal) {
    writeCachedCountry(cachedLocal);
    return cachedLocal;
  }

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutMs = 2500;
    const timeoutId = controller
      ? window.setTimeout(() => {
          try {
            controller.abort();
          } catch {
            // ignore
          }
        }, timeoutMs)
      : null;

    const res = await fetch('/api/client-ip', {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: controller ? controller.signal : undefined,
    });

    if (timeoutId) {
      try {
        window.clearTimeout(timeoutId);
      } catch {
        // ignore
      }
    }

    if (!res || !res.ok) throw new Error('client_ip_bad_status');

    const json = await res.json().catch(() => null);
    const country = parseCountryHintFromApiPayload(json);

    writeCachedCountry(country);

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

  const cachedSession = readCachedCountryFrom(typeof sessionStorage !== 'undefined' ? sessionStorage : null);
  if (cachedSession) return cachedSession;

  const cachedLocal = readCachedCountryFrom(typeof localStorage !== 'undefined' ? localStorage : null);
  if (cachedLocal) return cachedLocal;

  const navGuess = pickCountryFromNavigatorLanguage();
  if (navGuess) return navGuess;

  const fb = getSupportLineFallback(opts);
  return safeUpperCountry(fb?.country);
}
