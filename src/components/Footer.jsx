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

    const path = String(location.pathname || '');
    const isWeddingPath =
      path.startsWith('/wedding') ||
      path.startsWith('/evlilik') ||
      path.startsWith('/uniqah') ||
      path.startsWith('/eslestirme') ||
      path.startsWith('/profilim');

    if (isWeddingPath && isFeatureEnabled('wedding')) {
      message = "Endonezya'da evlilik hakkında bilgi almak istiyorum";
    } else if (path.startsWith("/youtube")) {
      message = "Merhaba, YouTube sayfanızı ziyaret ettim ve size bir şey sormak istiyorum";
    } else if (path.startsWith("/contact")) {
      message = "Merhaba, bir konu hakkında bilgi almak istiyorum";
    } else if (path === "/") {
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

  const showWedding = isFeatureEnabled('wedding');
  const isWeddingOnly = showWedding;

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
              {showWedding && (
                <li>
                  <Link to="/evlilik" className="hover:text-white transition">
                    Evlilik
                  </Link>
                </li>
              )}
              {showWedding && (
                <li>
                  <Link to="/evlilik/uniqah" className="hover:text-white transition">
                    Uniqah
                  </Link>
                </li>
              )}
              {showWedding && (
                <li>
                  <Link to="/profilim" className="hover:text-white transition">
                    Profilim
                  </Link>
                </li>
              )}
              {showWedding && (
                <li>
                  <Link to="/evlilik/uyelik" className="hover:text-white transition">
                    Üyelik
                  </Link>
                </li>
              )}
              <li>
                <Link to="/about" className="hover:text-white transition">
                  Hakkımızda
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
              <li>
                <Link to="/gallery" className="hover:text-white transition">
                  Galeri
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition">
                  Gizlilik
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              Yasal
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a
                  href="/docs/matchmaking-kullanim-sozlesmesi.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  Kullanıcı / Üyelik Sözleşmesi
                </a>
              </li>
              <li>
                <a
                  href="/docs/site-kurallari.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  Site Kuralları
                </a>
              </li>
              <li>
                <a
                  href="/docs/iptal-iade-politikasi.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  İptal / İade Politikası
                </a>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition">
                  Gizlilik Politikası
                </Link>
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
