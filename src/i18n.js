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
    return (
      detectFromQuerystring() ||
      detectFromTimeZone() ||
      detectFromNavigator() ||
      "tr"
    );
  },
  cacheUserLanguage: (lng) => {
    // Kullanıcının seçimini kalıcılaştırmıyoruz.
    // Her yeni açılışta dil, tarayıcı ayarına (veya ?lang parametresine) göre yeniden tespit edilir.
    void lng;
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
    fallbackLng: "tr",
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  try {
    document.documentElement.lang = normalizeLang(lng) || "tr";
  } catch {
    // ignore
  }
});

export default i18n;
