import { COMPANY } from "../config/company";
import { isGlobalVariant } from "../config/siteVariant";
import { normalizePhoneForWhatsApp } from "./reservationStatus";

export function getWhatsAppNumber() {
  const fromEnv = import.meta.env.VITE_WHATSAPP_NUMBER;
  if (fromEnv) return normalizePhoneForWhatsApp(fromEnv);

  const fallback = isGlobalVariant ? COMPANY.phoneIdTel : COMPANY.phoneTr;
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
