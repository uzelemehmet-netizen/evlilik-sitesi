import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { isFeatureEnabled } from '../config/siteVariant';
import { buildWhatsAppUrl } from '../utils/whatsapp';

export default function StickyWhatsApp() {
  const location = useLocation();

  const getWhatsappLink = () => {
    let message = "Merhaba, web sitenizden yazıyorum. Genel bilgi almak istiyorum.";

    if (location.pathname.startsWith("/wedding") && isFeatureEnabled('wedding')) {
      message = "Endonezya'da evlilik hakkında bilgi almak istiyorum";
    } else if (location.pathname.startsWith("/youtube")) {
      message = "Merhaba, YouTube sayfanızı ziyaret ettim ve size bir şey sormak istiyorum";
    } else if (location.pathname.startsWith("/contact")) {
      message = "Merhaba, bir konu hakkında bilgi almak istiyorum";
    } else if (location.pathname === "/") {
      message = "Merhaba, size genel anlamda bir şey sormak istiyorum";
    }

    return buildWhatsAppUrl(message);
  };

  const whatsappLink = getWhatsappLink();

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3.5 sm:p-4 rounded-full shadow-2xl hover:shadow-emerald-500/50 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-2 group touch-manipulation"
      title="WhatsApp ile iletişime geçin"
      style={{ minWidth: '56px', minHeight: '56px' }}
    >
      <MessageCircle size={24} className="group-hover:rotate-12 transition-transform" />
      <span className="hidden sm:inline-block font-semibold text-sm pr-2">WhatsApp</span>
    </a>
  );
}

