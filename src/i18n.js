import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const RESOURCE_LOADERS = {
  tr: () => import('./i18nResources/tr.js'),
  en: () => import('./i18nResources/en.js'),
  id: () => import('./i18nResources/id.js'),
};
import { getSupportCountrySync } from './utils/supportLine';
import { getClientCountry } from './utils/supportLine';

const SUPPORTED_LANGS = ["tr", "en", "id"];

const _loadedLangs = new Set();

async function _loadTranslationBundle(lng) {
  const normalized = normalizeLang(lng);
  if (!normalized) return null;
  const loader = RESOURCE_LOADERS[normalized];
  if (!loader) return null;
  const mod = await loader();
  return mod?.default || null;
}

async function ensureI18nLanguageLoaded(lng) {
  const normalized = normalizeLang(lng) || 'tr';
  if (_loadedLangs.has(normalized)) return;

  const bundle = await _loadTranslationBundle(normalized);
  if (!bundle) return;

  try {
    i18n.addResourceBundle(normalized, 'translation', bundle, true, true);
    _loadedLangs.add(normalized);
  } catch {
    // ignore
  }
}

export { ensureI18nLanguageLoaded, normalizeLang };

function normalizeLang(raw) {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  if (!v) return null;
  const base = v.split(/[-_]/)[0];
  if (base === "in") return "id"; // eski ISO kodu
  if (SUPPORTED_LANGS.includes(base)) return base;
  return null;
}

function detectFromQuerystring() {
  try {
    const url = new URL(window.location.href);
    return normalizeLang(url.searchParams.get("lang"));
  } catch {
    return null;
  }
}

function detectFromStorage() {
  try {
    return normalizeLang(localStorage.getItem('preferred_lang'));
  } catch {
    // ignore
  }

  try {
    return normalizeLang(sessionStorage.getItem('preferred_lang'));
  } catch {
    return null;
  }
}

function detectFromStorageSource() {
  try {
    return String(localStorage.getItem('preferred_lang_source') || '').trim();
  } catch {
    // ignore
  }

  try {
    return String(sessionStorage.getItem('preferred_lang_source') || '').trim();
  } catch {
    return '';
  }
}

function detectFromNavigator() {
  try {
    const langs = Array.isArray(navigator.languages) ? navigator.languages : [];
    const normalized = [];

    for (const l of langs) {
      const n = normalizeLang(l);
      if (n) normalized.push(n);
    }

    const one = normalizeLang(navigator.language);
    if (one) normalized.push(one);

    // Prefer id/tr over en when multiple are present.
    if (normalized.includes('id')) return 'id';
    if (normalized.includes('tr')) return 'tr';
    if (normalized.includes('en')) return 'en';
    return null;
  } catch {
    return null;
  }
}

function detectFromTimeZone() {
  // Ülke tespiti statik SPA'da kesin değildir; timeZone bir "en iyi tahmin".
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (/^asia\/(jakarta|makassar|jayapura)$/i.test(tz)) return "id";
    if (/^europe\/istanbul$/i.test(tz)) return "tr";
    return null;
  } catch {
    return null;
  }
}

function detectFromCachedCountry() {
  // Uses the /api/client-ip cached value when available; falls back to quick heuristics.
  try {
    const c = String(getSupportCountrySync({ lang: '' }) || '').trim().toUpperCase();
    if (c === 'ID') return 'id';
    if (c === 'TR') return 'tr';
    return null;
  } catch {
    return null;
  }
}

const languageDetector = {
  type: "languageDetector",
  async: false,
  init: () => {},
  detect: () => {
    const query = detectFromQuerystring();
    if (query) return query;

    const stored = detectFromStorage();
    const source = detectFromStorageSource();
    const countryHint = detectFromCachedCountry();
    const auto = detectFromTimeZone() || detectFromNavigator();

    // If user explicitly chose a language (or a signup flow set it), respect it.
    // This must override any geo/heuristic forcing.
    if (source === 'selector' || source === 'signup') {
      return stored || countryHint || auto || 'tr';
    }

    // If we already know the user is in Indonesia, default to Indonesian.
    // (But do not override an explicit user choice; handled above.)
    if (countryHint === 'id') return 'id';

    // Otherwise use stored/navigator/timezone, then default.
    return stored || countryHint || auto || 'tr';
  },
  cacheUserLanguage: (lng) => {
    const normalized = normalizeLang(lng) || 'tr';
    try {
      localStorage.setItem('preferred_lang', normalized);
    } catch {
      // ignore
    }

    // Fallback for environments where localStorage is unreliable (some in-app browsers / private modes)
    try {
      sessionStorage.setItem('preferred_lang', normalized);
    } catch {
      // ignore
    }
  },
};

function detectInitialLanguage() {
  try {
    // Mirror the detector logic so we can preload only the required bundle(s).
    const query = detectFromQuerystring();
    if (query) return query;

    const stored = detectFromStorage();
    const source = detectFromStorageSource();
    const countryHint = detectFromCachedCountry();
    const auto = detectFromTimeZone() || detectFromNavigator();

    if (source === 'selector' || source === 'signup') {
      return stored || countryHint || auto || 'tr';
    }

    if (countryHint === 'id') return 'id';
    return stored || countryHint || auto || 'tr';
  } catch {
    return 'tr';
  }
}

// Patch changeLanguage to lazy-load bundles when needed.
try {
  const _origChangeLanguage = i18n.changeLanguage.bind(i18n);
  i18n.changeLanguage = async (lng, ...rest) => {
    const normalized = normalizeLang(lng) || 'tr';
    try {
      await ensureI18nLanguageLoaded(normalized);
    } catch {
      // ignore
    }
    return _origChangeLanguage(normalized, ...rest);
  };
} catch {
  // ignore
}

// Preload only detected language (+ TR fallback) to keep the initial JS payload small.
const __initialLang = detectInitialLanguage();
const __initialResourceLangs = Array.from(new Set([__initialLang, 'tr'])).filter(Boolean);
const __initialResources = {};

let __resolveI18nReady = null;
export const i18nReady = new Promise((resolve) => {
  __resolveI18nReady = resolve;
});

function resolveI18nReadyBestEffort() {
  try {
    if (typeof __resolveI18nReady !== 'function') return;
    // Only resolve when i18next is actually initialized.
    if (i18n?.isInitialized) {
      __resolveI18nReady(true);
      __resolveI18nReady = null;
      return;
    }
  } catch {
    // ignore
  }
}

async function bootI18n() {
  for (const lng of __initialResourceLangs) {
    try {
      const bundle = await _loadTranslationBundle(lng);
      if (bundle) {
        __initialResources[lng] = { translation: bundle };
        _loadedLangs.add(normalizeLang(lng) || 'tr');
      }
    } catch {
      // ignore
    }
  }

  try {
    await i18n
      .use(languageDetector)
      .use(initReactI18next)
      .init({
        resources: __initialResources,
        supportedLngs: SUPPORTED_LANGS,
        nonExplicitSupportedLngs: true,
        load: 'languageOnly',
        lng: __initialLang,
        fallbackLng: {
          id: ['id', 'tr'],
          en: ['en', 'tr'],
          tr: ['tr'],
          default: ['tr'],
        },
        interpolation: {
          escapeValue: false,
        },
      });
    resolveI18nReadyBestEffort();
  } catch (e) {
    // i18n init should not block the app boot.
    try {
      // eslint-disable-next-line no-console
      console.error('i18n_init_failed', e);
    } catch {
      // ignore
    }

    try {
      // Minimal fallback to keep UI usable.
      await i18n
        .use(languageDetector)
        .use(initReactI18next)
        .init({
          resources: __initialResources,
          lng: 'tr',
          fallbackLng: 'tr',
          interpolation: { escapeValue: false },
        });
      resolveI18nReadyBestEffort();
    } catch {
      // ignore
    }
  }

  // After boot, resolve client country from /api/client-ip (best-effort) and
  // ensure Indonesian users don't get stuck in English due to early detection.
  // Do NOT override explicit querystring `lang`.
  try {
    const qsLang = detectFromQuerystring();
    if (!qsLang) {
      Promise.resolve(getClientCountry())
        .then((country) => {
          const source = detectFromStorageSource();
          if (source === 'selector' || source === 'signup') return;

          const c = String(country || '').trim().toUpperCase();
          if (c !== 'ID') return;

          const current = normalizeLang(i18n?.language) || 'tr';
          if (current === 'id') return;

          // Persist by triggering languageChanged handler (stores preferred_lang).
          void i18n.changeLanguage('id');
        })
        .catch(() => {
          // ignore
        });
    }
  } catch {
    // ignore
  }

  // In case init resolved but isInitialized lagged for any reason, re-check shortly.
  try {
    setTimeout(resolveI18nReadyBestEffort, 0);
    setTimeout(resolveI18nReadyBestEffort, 50);
  } catch {
    // ignore
  }
}

// Start boot (non-blocking). Rendering is wrapped with Suspense at the root.
try {
  void bootI18n();
} catch {
  // ignore
}

i18n.on("languageChanged", (lng) => {
  try {
    document.documentElement.lang = normalizeLang(lng) || "tr";
    const normalized = normalizeLang(lng) || 'tr';
    try {
      localStorage.setItem('preferred_lang', normalized);
    } catch {
      // ignore
    }
    try {
      sessionStorage.setItem('preferred_lang', normalized);
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
});

// Dev-only debugging helpers (safe to remove any time).
// Allows verifying language detection live from the console.
try {
  const isDev = (() => {
    try {
      // Vite sets import.meta.env.DEV in dev, but some environments may not expose it reliably.
      return Boolean(import.meta?.env?.DEV);
    } catch {
      return false;
    }
  })();

  const isLocalhost = (() => {
    try {
      if (typeof window === 'undefined') return false;
      const h = String(window.location?.hostname || '').toLowerCase();
      return h === 'localhost' || h === '127.0.0.1';
    } catch {
      return false;
    }
  })();

  if ((isDev || isLocalhost) && typeof globalThis !== 'undefined') {
    const g = globalThis;
    g.__i18n = i18n;
    g.__i18nDebug = () => {
      const snapshot = {
        i18nLanguage: normalizeLang(i18n?.language) || null,
        qsLang: detectFromQuerystring(),
        storedLang: detectFromStorage(),
        storedSource: detectFromStorageSource() || null,
        cachedCountryHint: detectFromCachedCountry(),
        tzHint: detectFromTimeZone(),
        navHint: detectFromNavigator(),
        documentLang: typeof document !== 'undefined' ? document.documentElement?.lang : null,
      };
      // eslint-disable-next-line no-console
      console.log('[i18n debug]', snapshot);
      return snapshot;
    };

    // Convenience: ensure it's also on window when available.
    try {
      if (typeof window !== 'undefined') {
        window.__i18n = g.__i18n;
        window.__i18nDebug = g.__i18nDebug;
      }
    } catch {
      // ignore
    }

    // eslint-disable-next-line no-console
    console.log('[i18n debug] helpers installed', {
      isDev,
      isLocalhost,
      href: typeof window !== 'undefined' ? window.location?.href : null,
    });
  }
} catch {
  // ignore
}

export default i18n;
