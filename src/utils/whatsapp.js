import { COMPANY } from "../config/company";
import { normalizePhoneForWhatsApp } from "./phone";
import { getSupportCountrySync } from './supportLine';

function normalizeLangBase(lang) {
  const raw = String(lang || "").trim().toLowerCase();
  if (!raw) return "";
  const base = raw.split("-")[0];
  // Some browsers report Indonesian as "in".
  return base === "in" ? "id" : base;
}

function guessLangBase() {
  if (typeof window === "undefined") return "";
  try {
    const stored =
      window.localStorage?.getItem("i18nextLng") ||
      window.localStorage?.getItem("lang") ||
      "";
    const base = normalizeLangBase(stored);
    if (base) return base;
  } catch {
    // ignore
  }

  try {
    return normalizeLangBase(window.navigator?.language || "");
  } catch {
    return "";
  }
}

function guessTimeZone() {
  try {
    return String(Intl.DateTimeFormat().resolvedOptions().timeZone || "").toLowerCase();
  } catch {
    return "";
  }
}

function shouldUseIndonesiaLine(langBase) {
  if (langBase === "id") return true;
  if (langBase === "tr") return false;

  const tz = guessTimeZone();
  if (tz.includes("jakarta") || tz.includes("makassar") || tz.includes("jayapura")) return true;
  if (tz.includes("istanbul")) return false;

  return false;
}

function normalizeCountry2(raw) {
  const s = String(raw || '').trim().toUpperCase();
  return s && /^[A-Z]{2}$/.test(s) ? s : '';
}

function decideUseIndonesiaLine(opts = {}) {
  try {
    const context = String(opts?.context || '').trim().toLowerCase();

    if (opts?.prefer === 'id') return true;
    if (opts?.prefer === 'tr') return false;

    // Footer intentionally stays simple: do NOT use cached/explicit country.
    if (context === 'footer') {
      const base = normalizeLangBase(opts?.lang) || guessLangBase();
      return shouldUseIndonesiaLine(base);
    }

    const countryFromOpts = normalizeCountry2(opts?.country);
    if (countryFromOpts === 'ID') return true;
    if (countryFromOpts) return false;

    // Best-effort cached country (populated by /api/client-ip).
    const cachedCountry = normalizeCountry2(getSupportCountrySync({ lang: opts?.lang }));
    if (cachedCountry === 'ID') return true;
    if (cachedCountry) return false;

    const base = normalizeLangBase(opts?.lang) || guessLangBase();
    return shouldUseIndonesiaLine(base);
  } catch {
    const base = normalizeLangBase(opts?.lang) || guessLangBase();
    return shouldUseIndonesiaLine(base);
  }
}

export function getWhatsAppNumber(opts = {}) {
  const useId = decideUseIndonesiaLine(opts);

  const fromEnvTr = import.meta.env.VITE_WHATSAPP_NUMBER_TR;
  const fromEnvId = import.meta.env.VITE_WHATSAPP_NUMBER_ID;

  // Prefer language/region-specific lines when available.
  // If VITE_WHATSAPP_NUMBER is configured (generic), it should act as a fallback
  // and must NOT override the explicit TR/ID lines.
  if (useId && fromEnvId) return normalizePhoneForWhatsApp(fromEnvId);
  if (!useId && fromEnvTr) return normalizePhoneForWhatsApp(fromEnvTr);

  const fromEnv = import.meta.env.VITE_WHATSAPP_NUMBER;
  if (fromEnv) return normalizePhoneForWhatsApp(fromEnv);

  const fallback = useId ? (fromEnvId || COMPANY.phoneIdTel) : (fromEnvTr || COMPANY.phoneTr);
  return normalizePhoneForWhatsApp(fallback);
}

function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(String(navigator.userAgent || ""));
}

export function buildWhatsAppUrl(text, opts = {}) {
  const number = getWhatsAppNumber(opts);
  if (!number) return "";

  const msg = encodeURIComponent(String(text || ""));

  // Android cihazlarda bazı durumlarda wa.me linki uygulama seçicisi / Business uyarıları çıkarabiliyor.
  // api.whatsapp.com/send genelde daha stabil açılıyor.
  const forceApi = !!opts?.forceApi;
  const useApi = forceApi || isAndroidDevice();

  if (useApi) {
    return `https://api.whatsapp.com/send?phone=${number}&text=${msg}`;
  }

  return `https://wa.me/${number}?text=${msg}`;
}

export function buildWhatsAppShareUrl(text, opts = {}) {
  const msg = encodeURIComponent(String(text || ''));
  const forceApi = !!opts?.forceApi;
  const useApi = forceApi || isAndroidDevice();

  // phone parametresi olmadan genel paylaşım.
  // api.whatsapp.com/send genelde daha stabil açılıyor.
  if (useApi) {
    return `https://api.whatsapp.com/send?text=${msg}`;
  }

  return `https://wa.me/?text=${msg}`;
}

export function openWhatsApp(url) {
  if (typeof window === "undefined") return;

  try {
    const newWindow = window.open(url, "_blank");

    // Eğer popup engellenirse veya yeni pencere açılamazsa, aynı sekmede yönlendir
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
      window.location.href = url;
    }
  } catch (error) {
    // Her ihtimale karşı fallback
    window.location.href = url;
  }
}

export function openWhatsAppToText(text) {
  const url = buildWhatsAppUrl(text);
  if (!url) {
    console.warn("WhatsApp numarası bulunamadı. (VITE_WHATSAPP_NUMBER / COMPANY)");
    return false;
  }
  openWhatsApp(url);
  return true;
}
