import { useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isFeatureEnabled } from '../config/siteVariant';
import { buildWhatsAppUrl } from '../utils/whatsapp';

function normalizeLangBase(lang) {
  const raw = String(lang || '').trim().toLowerCase();
  if (!raw) return '';
  const base = raw.split('-')[0];
  return base === 'in' ? 'id' : base;
}

export default function StickyWhatsApp({ positionClassName } = {}) {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const isHidden = useMemo(() => {
    const path = location.pathname || '/';
    return path.startsWith('/admin');
  }, [location.pathname]);

  const whatsappLink = useMemo(() => {
    const path = location.pathname || '/';
    const lang = String(i18n?.language || 'tr');
    const langBase = normalizeLangBase(lang);

    let message = t('floatingWhatsapp.messages.default');

    if ((path.startsWith('/wedding') || path.startsWith('/evlilik')) && isFeatureEnabled('wedding')) {
      message = t('floatingWhatsapp.messages.wedding');
    } else if (path.startsWith('/youtube')) {
      message = t('floatingWhatsapp.messages.youtube');
    } else if (path.startsWith('/contact')) {
      message = t('floatingWhatsapp.messages.contact');
    } else if (path === '/') {
      message = t('floatingWhatsapp.messages.home');
    }

    return buildWhatsAppUrl(message, {
      lang,
      prefer: langBase === 'id' ? 'id' : 'tr',
    });
  }, [i18n?.language, location.pathname, t]);

  if (isHidden) return null;

  const pos = String(positionClassName || 'bottom-4 right-4 sm:bottom-6 sm:right-6');

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed ${pos} z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3.5 sm:p-4 rounded-full shadow-lg ring-1 ring-white/20 hover:shadow-xl transition flex items-center gap-2 group touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200`}
      title={t('floatingWhatsapp.ariaLabel')}
      style={{ minWidth: '56px', minHeight: '56px' }}
    >
      <MessageCircle size={24} />
      <span className="inline-block font-semibold text-sm pr-2">{t('floatingWhatsapp.label')}</span>
    </a>
  );
}

