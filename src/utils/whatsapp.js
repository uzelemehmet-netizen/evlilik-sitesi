import { COMPANY } from "../config/company";
import { normalizePhoneForWhatsApp } from "./phone";

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

export function getWhatsAppNumber(opts = {}) {
  const fromEnv = import.meta.env.VITE_WHATSAPP_NUMBER;
  if (fromEnv) return normalizePhoneForWhatsApp(fromEnv);

  const base = normalizeLangBase(opts?.lang) || guessLangBase();
  const useId = opts?.prefer === "id" ? true : opts?.prefer === "tr" ? false : shouldUseIndonesiaLine(base);

  const fromEnvTr = import.meta.env.VITE_WHATSAPP_NUMBER_TR;
  const fromEnvId = import.meta.env.VITE_WHATSAPP_NUMBER_ID;

  const fallback = useId ? (fromEnvId || COMPANY.phoneIdTel) : (fromEnvTr || COMPANY.phoneTr);
  return normalizePhoneForWhatsApp(fallback);
}

export function buildWhatsAppUrl(text) {
  const number = getWhatsAppNumber();
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(String(text || ""))}`;
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
