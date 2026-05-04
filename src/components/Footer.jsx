import { Youtube, Mail, Phone, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { COMPANY } from "../config/company";
import { isFeatureEnabled } from "../config/siteVariant";
import { buildWhatsAppUrl } from "../utils/whatsapp";
import { useTranslation } from 'react-i18next';
import { staticAssetUrl } from '../utils/staticAssetUrl';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const FOOTER_IMAGE_SRC = staticAssetUrl('/ChatGPT%20Image%2017%20%C5%9Eub%202026%2014_33_00.png');
  const getWhatsappLink = () => {
    let message = t('footer.whatsappMessages.general');

    const path = String(location.pathname || '');
    const isWeddingPath =
      path.startsWith('/wedding') ||
      path.startsWith('/evlilik') ||
      path.startsWith('/uniqah') ||
      path.startsWith('/eslestirme') ||
      path.startsWith('/profilim');

    if (isWeddingPath && isFeatureEnabled('wedding')) {
      message = t('footer.whatsappMessages.wedding');
    } else if (path.startsWith("/youtube")) {
      message = t('footer.whatsappMessages.youtube');
    } else if (path.startsWith("/contact")) {
      message = t('footer.whatsappMessages.contact');
    } else if (path === "/") {
      message = t('footer.whatsappMessages.home');
    }

    return buildWhatsAppUrl(message, { lang: String(i18n?.language || 'tr'), context: 'footer' });
  };

  const whatsappLink = getWhatsappLink();
  const email = COMPANY.email;
  const phone = COMPANY.phoneTr;
  const indonesiaPhoneTel = COMPANY.phoneIdTel;
  const indonesiaPhoneDisplay = COMPANY.phoneIdDisplay;

  const showWedding = isFeatureEnabled('wedding');
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          <div>
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={FOOTER_IMAGE_SRC}
                  alt="Uniqah"
                  className="h-12 w-auto"
                  loading="lazy"
                  decoding="async"
                />
                    {showWedding && (
                      <li>
                        <Link to="/evlilik" className="hover:text-white transition">
                          {t('navigation.wedding')}
                        </Link>
                      </li>
                    )}
                    {showWedding && (
                      <li>
                        <Link to="/eslestirme" className="hover:text-white transition">
                          {t('navigation.matchmaking')}
                        </Link>
                      </li>
                    )}
                    {showWedding && (
                      <li>
                        <Link to="/profilim" className="hover:text-white transition">
                          {t('navigation.panel')}
                        </Link>
                      </li>
                    )}
              </div>
            </div>
            <p className="text-gray-400" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('footer.brandBlurb', { company: 'PT MoonStar Global Indonesia' })}
            </p>
            <div className="mt-4 text-gray-400 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{t('footer.brandsTitle')}</p>
              <p>Uniqah</p>
              <p>
                <a
                  href="https://www.dameturk.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  DaMeTurk
                </a>{' '}
                <span className="text-gray-500">{t('footer.brandNoteDameturk')}</span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('footer.sections.quickLinks')}
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition">
                  {t('navigation.home')}
                </Link>
              </li>
              {showWedding && (
                <li>
                  <Link to="/evlilik" className="hover:text-white transition">
                    {t('navigation.wedding')}
                  </Link>
                </li>
              )}
              {showWedding && (
                <li>
                  <Link to="/eslestirme" className="hover:text-white transition">
                    {t('navigation.matchmaking')}
                  </Link>
                </li>
              )}
              {showWedding && (
                <li>
                  <Link to="/profilim" className="hover:text-white transition">
                    {t('navigation.panel')}
                  </Link>
                </li>
              )}
              {showWedding && (
                <li>
                  <Link to="/evlilik/uyelik" className="hover:text-white transition">
                    {t('footer.links.membership')}
                  </Link>
                </li>
              )}
              {showWedding && (
                <li>
                  <Link to="/aracilik" className="hover:text-white transition">
                    {t('navigation.leadApply')}
                  </Link>
                </li>
              )}
              <li>
                <Link to="/youtube" className="hover:text-white transition">
                  {t('navigation.youtube')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">
                  {t('navigation.about')}
                </Link>
              </li>
              {showWedding && (
                <li>
                  <Link to="/kurumsal" className="hover:text-white transition">
                    {t('navigation.corporate')}
                  </Link>
                </li>
              )}
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  {t('navigation.contact')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition">
                  {t('footer.legal.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('footer.sections.legal')}
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/documents" className="hover:text-white transition">
                  {t('footer.legal.documents')}
                </Link>
              </li>
              <li>
                <a
                  href="/docs/matchmaking-kullanim-sozlesmesi.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  {t('footer.legal.userAgreement')}
                </a>
              </li>
              <li>
                <a
                  href="/docs/kvkk-aydinlatma-metni.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  {t('footer.legal.kvkkNotice')}
                </a>
              </li>
              <li>
                <a
                  href="/docs/site-kurallari.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  {t('footer.legal.siteRules')}
                </a>
              </li>
              <li>
                <a
                  href="/docs/iptal-iade-politikasi.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition"
                >
                  {t('footer.legal.refundPolicy')}
                </a>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition">
                  {t('footer.legal.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('footer.sections.contact')}
            </h4>
            <div className="space-y-3 text-gray-400">
              <div className="text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{t('footer.companyInfo.title')}</p>
                <p><span className="text-gray-300">{t('footer.companyInfo.labels.legalName')}:</span> {COMPANY.legalName}</p>
                <p><span className="text-gray-300">{t('footer.companyInfo.labels.address')}:</span> {COMPANY.address}</p>
                <p><span className="text-gray-300">{t('footer.companyInfo.labels.nib')}:</span> {COMPANY.nib}</p>
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
                    {t('footer.phoneNotes.trLine')}
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
                    {t('footer.phoneNotes.idLine')}
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
                  {t('footer.links.whatsapp')}
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('footer.sections.social')}
            </h4>
            <div className="flex gap-4 items-center">
              <Link
                to="/youtube"
                className="text-white hover:opacity-90 transition bg-red-600 p-2 rounded-full flex items-center justify-center"
                title={t('footer.social.youtube')}
              >
                <Youtube size={18} />
              </Link>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-50 hover:opacity-90 transition bg-emerald-500 p-2 rounded-full flex items-center justify-center"
                title={t('footer.social.whatsapp')}
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('footer.copyright', { year: currentYear, company: 'PT MoonStar Global Indonesia' })}
          </p>
        </div>
      </div>
    </footer>
  );
}
