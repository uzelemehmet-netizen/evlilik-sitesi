import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resources } from "./i18nResources";

const SUPPORTED_LANGS = ["tr", "en", "id"];

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
    return null;
  }
}

function detectFromStorageSource() {
  try {
    return String(localStorage.getItem('preferred_lang_source') || '').trim();
  } catch {
    return '';
  }
}

function detectFromNavigator() {
  try {
    const langs = Array.isArray(navigator.languages) ? navigator.languages : [];
    for (const l of langs) {
      const normalized = normalizeLang(l);
      if (normalized) return normalized;
    }
    return normalizeLang(navigator.language);
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

const languageDetector = {
  type: "languageDetector",
  async: false,
  init: () => {},
  detect: () => {
    const stored = detectFromStorage();
    const source = detectFromStorageSource();
    const auto = detectFromTimeZone() || detectFromNavigator();
    if (source === 'selector' || source === 'signup') {
      return stored || auto || 'tr';
    }
    if (auto === 'id') return 'id';
    return (
      stored ||
      detectFromQuerystring() ||
      auto ||
      "tr"
    );
  },
  cacheUserLanguage: (lng) => {
    try {
      localStorage.setItem('preferred_lang', normalizeLang(lng) || 'tr');
    } catch {
      // ignore
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGS,
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    fallbackLng: {
      id: ["id"],
      default: ["tr"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  try {
    document.documentElement.lang = normalizeLang(lng) || "tr";
    localStorage.setItem('preferred_lang', normalizeLang(lng) || 'tr');
  } catch {
    // ignore
  }
});

export default i18n;
