import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { isFeatureEnabled } from "../config/siteVariant";
import { buildWhatsAppUrl } from "../utils/whatsapp";
import { useTranslation } from "react-i18next";

function buildWhatsappLink(pathname, t, lang) {
  let message = t("floatingWhatsapp.messages.default");

  const path = pathname || "/";

  if (path.startsWith("/wedding") && isFeatureEnabled('wedding')) {
    message = t("floatingWhatsapp.messages.wedding");
  } else if (path.startsWith("/youtube")) {
    message = t("floatingWhatsapp.messages.youtube");
  } else if (path.startsWith("/contact")) {
    message = t("floatingWhatsapp.messages.contact");
  } else if (path === "/") {
    message = t("floatingWhatsapp.messages.home");
  }

  return buildWhatsAppUrl(message, { lang });
}

export default function FloatingWhatsApp() {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const isHidden = useMemo(() => {
    const path = location.pathname || "/";
    if (path.startsWith("/admin")) return true;

    // Bu sayfalarda sayfaya-özel Sticky WhatsApp kullanıyoruz.
    if (path === "/about") return true;
    if (path.startsWith("/wedding") || path.startsWith("/evlilik")) return true;

    return false;
  }, [location.pathname]);

  const whatsappLink = useMemo(
    () => buildWhatsappLink(location.pathname, t, String(i18n?.language || 'tr')),
    [i18n?.language, location.pathname, t]
  );

  if (isHidden) return null;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="hidden sm:inline-flex fixed bottom-4 right-4 z-[80] items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 font-semibold shadow-lg hover:shadow-xl transition-shadow"
      aria-label={t("floatingWhatsapp.ariaLabel")}
    >
      <MessageCircle size={18} />
      <span className="text-sm">{t("floatingWhatsapp.label")}</span>
    </a>
  );
}
