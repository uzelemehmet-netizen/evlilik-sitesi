export function normalizePhoneForWhatsApp(input) {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  // Kullanıcı genelde +90..., +62... yazıyor. wa.me için sadece rakam gerekir.
  return digits;
}
