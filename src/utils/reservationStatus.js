export const RESERVATION_STATUS = {
  PENDING_DEPOSIT: "PENDING_DEPOSIT",
  DEPOSIT_PAID: "DEPOSIT_PAID",
  OFFER_READY: "OFFER_READY",
  BALANCE_PAYMENT_OPEN: "BALANCE_PAYMENT_OPEN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export function getReservationStatusLabel(status) {
  switch (status) {
    case RESERVATION_STATUS.PENDING_DEPOSIT:
      return "Kapora bekleniyor";
    case RESERVATION_STATUS.DEPOSIT_PAID:
      return "Kapora alındı";
    case RESERVATION_STATUS.OFFER_READY:
      return "Teklif hazır";
    case RESERVATION_STATUS.BALANCE_PAYMENT_OPEN:
      return "Kalan ödeme açıldı";
    case RESERVATION_STATUS.COMPLETED:
      return "Tamamlandı";
    case RESERVATION_STATUS.CANCELLED:
      return "İptal";
    default:
      return "Bilinmiyor";
  }
}

export function normalizePhoneForWhatsApp(input) {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  // Kullanıcı genelde +90..., +62... yazıyor. wa.me için sadece rakam gerekir.
  return digits;
}
