import { Instagram, Youtube, Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { COMPANY } from "../config/company";
import { isFeatureEnabled } from "../config/siteVariant";
import { buildWhatsAppUrl } from "../utils/whatsapp";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  const getWhatsappLink = () => {
    let message = "Merhaba, web sitenizden yazıyorum. Genel bilgi almak istiyorum.";

    if (location.pathname.startsWith("/wedding") && isFeatureEnabled('wedding')) {
      message = "Endonezya'da evlilik hakkında bilgi almak istiyorum";
    } else if (location.pathname.startsWith("/travel")) {
      message = "Endonezya seyahati hakkında bilgi almak istiyorum";
    } else if (location.pathname.startsWith("/kesfet")) {
      message = "Endonezya'nın tatil destinasyonları hakkında bilgi almak istiyorum";
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
  const instagramLink = "https://www.instagram.com/endonezyakasifi";
  const youtubeLink = "https://www.youtube.com/@endonezyakasifi";
  const email = COMPANY.email;
  const phone = COMPANY.phoneTr;
  const indonesiaPhoneTel = COMPANY.phoneIdTel;
  const indonesiaPhoneDisplay = COMPANY.phoneIdDisplay;

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <img
                src="/logos/moonstar-mark-light.png"
                alt="MoonStar Global Indonesia"
                className="h-12 w-auto"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="text-gray-400" style={{ fontFamily: '"Poppins", sans-serif' }}>
              Endonezya Kaşifi, Endonezya’da kayıtlı <span className="font-semibold">PT MoonStar Global Indonesia</span> şirketinin markasıdır.
            </p>
            <div className="mt-4 text-gray-400 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Markalar</p>
              <p>Endonezya Kaşifi</p>
              <p>
                <a
                  href="https://www.dameturk.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  DaMeTurk
                </a>{' '}
                <span className="text-gray-500">(alt marka • dameturk.com)</span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              Hızlı Linkler
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link to="/kurumsal" className="hover:text-white transition">
                  Kurumsal
                </Link>
              </li>
              <li>
                <Link to="/kesfet" className="hover:text-white transition">
                  Keşfet
                </Link>
              </li>
              <li>
                <Link to="/travel" className="hover:text-white transition">
                  Seyahat
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  İletişim
                </Link>
              </li>
              <li>
                <Link to="/youtube" className="hover:text-white transition">
                  YouTube
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              Yasal
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li className="text-xs uppercase tracking-wide text-gray-500" style={{ fontFamily: '"Poppins", sans-serif' }}>
                Doküman Merkezi
              </li>
              <li>
                <Link to="/dokumanlar" className="hover:text-white transition">
                  Dokümanlar (TR)
                </Link>
              </li>
              <li>
                <Link to="/dokumanlar?lang=en" className="hover:text-white transition">
                  Documents (EN)
                </Link>
              </li>
              <li className="pt-2 text-xs uppercase tracking-wide text-gray-500" style={{ fontFamily: '"Poppins", sans-serif' }}>
                TR
              </li>
              <li>
                <Link to="/dokumanlar?doc=paket-tur-sozlesmesi" className="hover:text-white transition">
                  Paket Tur Sözleşmesi (TR)
                </Link>
              </li>
              <li>
                <Link to="/dokumanlar?doc=mesafeli-satis-sozlesmesi" className="hover:text-white transition">
                  Mesafeli Satış Sözleşmesi (TR)
                </Link>
              </li>
              <li>
                <Link to="/dokumanlar?doc=on-bilgilendirme-formu" className="hover:text-white transition">
                  Ön Bilgilendirme Formu (TR)
                </Link>
              </li>
              <li>
                <Link to="/dokumanlar?doc=iptal-iade-politikasi" className="hover:text-white transition">
                  İptal / İade Politikası (TR)
                </Link>
              </li>
              <li>
                <Link to="/dokumanlar?doc=kvkk-aydinlatma-metni" className="hover:text-white transition">
                  KVKK Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link to="/dokumanlar?doc=odeme-yontemleri" className="hover:text-white transition">
                  Ödeme Yöntemleri
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition">
                  Gizlilik Politikası
                </Link>
              </li>
              <li className="pt-2 text-xs text-gray-500" style={{ fontFamily: '"Poppins", sans-serif' }}>
                English
              </li>
              <li>
                <a href="/docs/package-tour-agreement-en.html" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  Package Tour Agreement (EN)
                </a>
              </li>
              <li>
                <a href="/docs/distance-sales-agreement-en.html" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  Distance Sales Agreement (EN)
                </a>
              </li>
              <li>
                <a href="/docs/pre-information-form-en.html" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  Pre-Information Form (EN)
                </a>
              </li>
              <li>
                <a href="/docs/kvkk-information-notice-en.html" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
                  KVKK Information Notice (EN)
                </a>
              </li>
              <li>
                <a
                  href="/docs/cancellation-refund-policy-en.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  Cancellation & Refund Policy (EN)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              İletişim
            </h4>
            <div className="space-y-3 text-gray-400">
              <div className="text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Firma Bilgileri</p>
                <p><span className="text-gray-300">Ünvan:</span> {COMPANY.legalName}</p>
                <p><span className="text-gray-300">Adres:</span> {COMPANY.address}</p>
                <p><span className="text-gray-300">Vergi:</span> {COMPANY.tax}</p>
                <p><span className="text-gray-300">NIB:</span> {COMPANY.nib}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <a
                  href={`mailto:${email}`}
                  className="hover:text-white transition"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  {email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <div className="flex flex-col">
                  <a
                    href={`tel:${phone}`}
                    className="hover:text-white transition"
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  >
                    {phone}
                  </a>
                  <span className="text-xs text-gray-500" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    Türkiye hattı (WhatsApp destekli)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <div className="flex flex-col">
                  <a
                    href={`tel:${indonesiaPhoneTel}`}
                    className="hover:text-white transition"
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  >
                    {indonesiaPhoneDisplay}
                  </a>
                  <span className="text-xs text-gray-500" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    Endonezya hattı
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle size={16} />
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              Sosyal Ağlar
            </h4>
            <div className="flex gap-4 items-center">
              <a
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:opacity-90 transition bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-2 rounded-full flex items-center justify-center"
                title="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href={youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:opacity-90 transition bg-red-600 p-2 rounded-full flex items-center justify-center"
                title="YouTube"
              >
                <Youtube size={18} />
              </a>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-50 hover:opacity-90 transition bg-emerald-500 p-2 rounded-full flex items-center justify-center"
                title="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p style={{ fontFamily: '"Poppins", sans-serif' }}>
            &copy; {currentYear} Endonezya Kaşifi — PT MoonStar Global Indonesia. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
