import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import HeroSocialButtons from '../components/HeroSocialButtons';
import { Heart, CheckCircle, AlertCircle, Phone, MessageCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const DEFAULT_MEDIA = Object.freeze({
  heroBackgroundUrl:
    'https://res.cloudinary.com/dj1xg1c56/image/upload/v1767352126/ChatGPT_Image_16_Ara_2025_20_55_54_cncrpw.png',
  introImage1Url: 'https://cvcou9szpd.ucarecd.net/84807d3a-fc15-4eb8-ab91-df06aafd02b9/-/preview/562x1000/',
  introImage2Url: 'https://cvcou9szpd.ucarecd.net/b85878d8-0625-4881-9e5b-b36981b06970/20250917_155623.jpg',
});

export default function Wedding() {
	const { t, i18n } = useTranslation();
  const BRAND_LOGO_SRC = "/brand.png";
  const tArray = (key) => {
    const value = t(key, { returnObjects: true });
    return Array.isArray(value) ? value : [];
  };

  const [media, setMedia] = useState(DEFAULT_MEDIA);

  const [formData, setFormData] = useState({
    from_name: '',
    phone: '',
    city: '',
    age: '',
    services: [],
    wedding_date: '',
    privacy_consent: false,
  });
  const [activeTab, setActiveTab] = useState('plan');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const faqItems = useMemo(() => {
    const items = t('weddingPage.faq.items', { returnObjects: true });
    return Array.isArray(items) ? items : [];
  }, [t, i18n.language]);

  const faqSchema = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };
  }, [faqItems]);

  useEffect(() => {
    emailjs.init({
      publicKey: 'RD9IcpOFrg9qQ4QdV',
      blockHeadless: false,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMedia() {
      try {
        const snap = await getDoc(doc(db, 'weddingContent', 'media'));
        const data = snap.exists() ? snap.data() || {} : {};
        if (cancelled) return;
        setMedia({
          heroBackgroundUrl: String(data.heroBackgroundUrl || DEFAULT_MEDIA.heroBackgroundUrl),
          introImage1Url: String(data.introImage1Url || DEFAULT_MEDIA.introImage1Url),
          introImage2Url: String(data.introImage2Url || DEFAULT_MEDIA.introImage2Url),
        });
      } catch (err) {
        // Public sayfa: rules izin vermezse yine de sayfa çalışsın.
        console.warn('Wedding media load failed (fallback to defaults):', err);
      }
    }

    loadMedia();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [faqSchema]);

  const serviceOptionIds = useMemo(
    () => [
      'consulting',
      'paperworkTracking',
      'familyCommunication',
      'transport',
      'interpretation',
      'ongoingGuidance',
      'accommodation',
      'honeymoon',
    ],
    [],
  );

  const serviceOptions = useMemo(() => {
    return serviceOptionIds.map((id) => ({
      id,
      label: t(`weddingPage.plan.form.services.options.${id}`),
    }));
  }, [serviceOptionIds, t, i18n.language]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleServiceChange = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.privacy_consent) {
      setError(t('weddingPage.plan.form.errors.privacyConsent'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await emailjs.send('service_j96qdb7', 'template_rsmu1gk', {
        from_name: formData.from_name,
        phone: formData.phone,
        city: formData.city,
        age: formData.age,
        services: formData.services
          .map((id) => t(`weddingPage.plan.form.services.options.${id}`))
          .join(', '),
        wedding_date: formData.wedding_date,
        to_email: 'articelikkapi@gmail.com',
      });

      if (response.status === 200) {
        if (window.gtag) {
          window.gtag('event', 'conversion', {
            send_to: 'AW-17732388792/X1NRCLaZ4sQbELiPu4dC',
            value: 1.0,
            currency: 'TRY',
            transaction_id: response.status,
          });
        }
        setSuccess(true);
        setFormData({
          from_name: '',
          phone: '',
          city: '',
          age: '',
          services: [],
          wedding_date: '',
          privacy_consent: false,
        });
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      setError(t('weddingPage.plan.form.errors.sendFailed'));
      console.error('EmailJS Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section */}
      <section
        className="pt-20 pb-12 px-4 relative overflow-hidden min-h-80"
        style={{
		  backgroundImage: `url(${media.heroBackgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center justify-center text-center min-h-80">
          <img
            src={BRAND_LOGO_SRC}
            alt="Turk&Indo"
            className="h-16 md:h-20 w-auto mb-4 drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
            loading="eager"
            decoding="async"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/80 shadow-md mb-3">
            <Heart size={18} className="text-white" />
            <span
              className="text-[10px] md:text-[11px] font-medium uppercase tracking-wide text-white drop-shadow-md"
            >
				  {t('weddingPage.hero.badge')}
            </span>
          </div>

          <h1
            className="text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-3 drop-shadow-[0_6px_20px_rgba(0,0,0,0.65)]"
          >
            {t('weddingPage.hero.title')}
          </h1>

          <p
            className="text-xs md:text-sm text-white/95 max-w-2xl mb-5 md:mb-6 leading-relaxed drop-shadow-[0_4px_14px_rgba(0,0,0,0.7)]"
          >
            {t('weddingPage.hero.description')}
          </p>
        </div>

        {/* Hero alt buton grubu */}
        <div className="absolute inset-x-0 bottom-5 md:bottom-7 z-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('wedding-form');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600/95 text-white px-5 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-xs md:text-sm shadow-md hover:bg-rose-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <Heart size={18} className="text-white" />
              {t('weddingPage.hero.actions.openForm')}
            </button>

            <Link
              to="/uniqah"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900/95 text-white px-5 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-xs md:text-sm shadow-md hover:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <MessageCircle size={18} className="text-white" />
              {t('weddingPage.hero.actions.matchmakingHub')}
            </Link>

            <a
              href={buildWhatsAppUrl(t('weddingPage.whatsapp.quickChatMessage'))}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/95 text-rose-700 px-5 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-xs md:text-sm shadow-md hover:bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <Phone size={18} className="text-rose-500" />
              {t('weddingPage.hero.actions.quickChat')}
            </a>
          </div>
        </div>

        <HeroSocialButtons />
      </section>

      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* İçerik Bölümü */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch mb-16">
          {/* Sol Taraf - Yazılar */}
          <div className="space-y-8 order-2 lg:order-1 flex flex-col justify-center">
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-8 rounded-xl shadow-lg border border-rose-100">
                <h3 className="text-3xl font-bold text-rose-600 mb-6" style={{ fontFamily: '"Poppins", sans-serif' }}>{t('weddingPage.intro.servicesTitle')}</h3>

                {/* Hizmet Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8" style={{ fontFamily: '"Poppins", sans-serif' }}>
				  {tArray('weddingPage.intro.cards').map((card, idx) => (
                    <div key={idx} className="bg-white/80 rounded-lg p-4 shadow-sm border border-rose-100">
                      <h4 className="font-semibold text-rose-600 mb-2 text-sm">{card.title}</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {(card.items || []).map((item, itemIdx) => (
                          <li key={itemIdx}>✓ {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

              {/* Alt Açıklama / Dipnot */}
              <div className="mt-4 pt-6 border-t border-rose-200">
                <h4 className="text-xl font-bold text-rose-600 mb-3" style={{ fontFamily: '"Poppins", sans-serif' }}>{t('weddingPage.intro.flexibleTitle')}</h4>
                <p className="text-gray-700 leading-relaxed text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('weddingPage.intro.flexibleP1')}
                </p>
                <p className="text-gray-700 leading-relaxed mt-3 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('weddingPage.intro.flexibleP2')}
                </p>

                <p className="text-xs font-light text-gray-600 mt-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('weddingPage.intro.flexibleNote')}
                </p>
              </div>
            </div>

            {/* 3 Adımda Süreç */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
			  {tArray('weddingPage.steps').map((step, idx) => (
                <div key={idx} className="flex flex-col items-start bg-white border border-rose-100 rounded-xl p-4 shadow-sm">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 text-rose-600 mb-3">
                    <span className="font-semibold text-sm">{idx + 1}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-600" style={{ fontFamily: '"Poppins", sans-serif' }}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ Taraf - Görseller */}
          <div className="order-1 lg:order-2 flex items-start justify-center">
            <div className="w-full max-w-md mx-auto space-y-6">
              <div className="relative rounded-3xl overflow-hidden shadow-xl h-64 md:h-72 lg:h-72">
                <img
				  src={media.introImage1Url}
                  alt={t('weddingPage.images.prepAlt')}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative rounded-3xl overflow-hidden shadow-xl">
                <img
				  src={media.introImage2Url}
                  alt={t('weddingPage.images.ceremonyAlt')}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-12 bg-gray-50 p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex gap-4 flex-col sm:flex-row">
            <button
              onClick={() => setActiveTab('plan')}
              className={
                activeTab === 'plan'
                  ? 'px-6 py-3 font-semibold rounded-lg transition-all duration-200 flex-1 bg-white text-rose-600 shadow-lg border border-rose-200'
                  : 'px-6 py-3 font-semibold rounded-lg transition-all duration-200 flex-1 bg-rose-600 text-white hover:bg-rose-700'
              }
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              {t('weddingPage.tabs.plan')}
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={
                activeTab === 'documents'
                  ? 'px-6 py-3 font-semibold rounded-lg transition-all duration-200 flex-1 bg-white text-rose-600 shadow-lg border border-rose-200'
                  : 'px-6 py-3 font-semibold rounded-lg transition-all duration-200 flex-1 bg-rose-600 text-white hover:bg-rose-700'
              }
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              {t('weddingPage.tabs.documents')}
            </button>
          </div>
        </div>
        {/* Tab Content */}
        {activeTab === 'plan' && (
          <div id="wedding-form" className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.title')}
          </h2>
          <p className="text-gray-600 text-center mb-8 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.subtitle')}
          </p>

          {success && (
            <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="text-rose-600 flex-shrink-0" size={24} />
              <div>
                <p className="font-semibold text-rose-800" style={{ fontFamily: '"Poppins", sans-serif' }}>{t('weddingPage.plan.successTitle')}</p>
                <p className="text-sm text-rose-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('weddingPage.plan.successText')}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              <p className="text-red-800" style={{ fontFamily: '"Poppins", sans-serif' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Adım 1: Temel Bilgiler */}
            <div className="border border-gray-100 rounded-xl p-6 bg-gray-50/60">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>{t('weddingPage.plan.form.sections.basicInfo.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    {t('weddingPage.plan.form.sections.basicInfo.labels.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="from_name"
                    value={formData.from_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                    placeholder={t('weddingPage.plan.form.sections.basicInfo.placeholders.name')}
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    {t('weddingPage.plan.form.sections.basicInfo.labels.phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                    placeholder={t('weddingPage.plan.form.sections.basicInfo.placeholders.phone')}
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    {t('weddingPage.plan.form.sections.basicInfo.labels.city')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                    placeholder={t('weddingPage.plan.form.sections.basicInfo.placeholders.city')}
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    {t('weddingPage.plan.form.sections.basicInfo.labels.age')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    min="18"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                    placeholder={t('weddingPage.plan.form.sections.basicInfo.placeholders.age')}
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  />
                </div>
              </div>
            </div>

            {/* Adım 2: İhtiyaç Duyduğunuz Hizmetler */}
            <div className="border border-gray-100 rounded-xl p-6 bg-gray-50/60">
              <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>{t('weddingPage.plan.form.services.title')}</h3>
              <p className="text-xs text-gray-600 mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('weddingPage.plan.form.services.hint')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceOptions.map((service) => (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() => handleServiceChange(service.id)}
                    className={
                      `flex items-center justify-between w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-150 ` +
                      (formData.services.includes(service.id)
                        ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-rose-300 hover:bg-rose-50/60')
                    }
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  >
                    <span>{service.label}</span>
                    {formData.services.includes(service.id) && (
                      <CheckCircle size={16} className="text-rose-500 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Adım 3: Tarih ve Onay */}
            <div className="border border-gray-100 rounded-xl p-6 bg-gray-50/60 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('weddingPage.plan.form.schedule.weddingDateLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="wedding_date"
                  value={formData.wedding_date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                />
              </div>

              <div className="flex items-start p-4 bg-white rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="privacy_consent"
                  name="privacy_consent"
                  checked={formData.privacy_consent}
                  onChange={handleChange}
                  required
                  className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded mt-1"
                />
                <label htmlFor="privacy_consent" className="ml-3 text-gray-700 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  <span className="font-semibold">
                    <Trans
                      i18nKey="weddingPage.plan.form.schedule.privacyConsent"
                      components={{
                        privacyLink: (
                          <a
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-600 hover:underline"
                          />
                        ),
                      }}
                    />
                  </span>
                  <p className="text-xs text-gray-600 mt-1">{t('weddingPage.plan.form.schedule.privacyNote')}</p>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 text-white py-3.5 rounded-xl font-semibold hover:bg-rose-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: '"Poppins", sans-serif' }}
              >
                {loading ? t('weddingPage.plan.form.actions.submitting') : t('weddingPage.plan.form.actions.submit')}
              </button>
              <p className="text-xs text-gray-500 text-center" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('weddingPage.plan.form.note')}
              </p>
            </div>
          </form>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.documents.title')}
          </h2>
          <p className="text-gray-600 text-center mb-8 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.documents.subtitle')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {/* Yabancı Eş Kartı */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-full flex flex-col">
              <h3 className="text-xl font-bold text-rose-600 mb-3">{t('weddingPage.documents.foreignSpouse.title')}</h3>
              <p className="text-gray-600 text-sm mb-3">{t('weddingPage.documents.foreignSpouse.intro')}</p>
              <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
				{tArray('weddingPage.documents.foreignSpouse.items').map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Endonezyalı Eş Kartı */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-full flex flex-col">
              <h3 className="text-xl font-bold text-rose-600 mb-3">{t('weddingPage.documents.indonesianSpouse.title')}</h3>
              <p className="text-gray-600 text-sm mb-3">{t('weddingPage.documents.indonesianSpouse.intro')}</p>
              <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
				{tArray('weddingPage.documents.indonesianSpouse.items').map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ek Belgeler & Bilgilendirme */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-rose-600 mb-3">{t('weddingPage.documents.extras.title')}</h3>
              <p className="text-gray-600 text-sm mb-3">{t('weddingPage.documents.extras.intro')}</p>
              <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
				{tArray('weddingPage.documents.extras.items').map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
              <h3 className="text-lg font-bold text-blue-700 mb-3">{t('weddingPage.documents.importantNotes.title')}</h3>
              <ul className="space-y-2 text-sm text-blue-900 list-disc list-inside">
				{tArray('weddingPage.documents.importantNotes.items').map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm">
              <h3 className="text-lg font-bold text-yellow-800 mb-3">{t('weddingPage.documents.personalDifferences.title')}</h3>
              <p className="text-sm text-yellow-900 mb-2">{t('weddingPage.documents.personalDifferences.p1')}</p>
              <p className="text-sm text-yellow-900">{t('weddingPage.documents.personalDifferences.p2')}</p>
            </div>
          </div>

          {/* Sık Sorulan Sorular (Kısa) */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('weddingPage.documents.faqTitle')}</h3>
            <div className="space-y-3 text-sm text-gray-700">
              {faqItems.map((item, idx) => (
                <div key={idx}>
                  <p className="font-semibold">{item.q}</p>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp CTA */}
          <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-6 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
            <div>
              <h3 className="text-lg font-bold mb-1">{t('weddingPage.documents.whatsappCta.title')}</h3>
              <p className="text-sm opacity-90">
                {t('weddingPage.documents.whatsappCta.description')}
              </p>
            </div>
            <a
              href={buildWhatsAppUrl(t('weddingPage.documents.whatsappCta.message'))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-rose-600 px-6 py-3 rounded-xl font-bold hover:bg-rose-50 transition shadow-md"
            >
              <MessageCircle size={20} />
              {t('weddingPage.documents.whatsappCta.action')}
            </a>
          </div>
        </div>
        )}
      </div>

      {/* CTA Bölümü - Formun Altında */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-8 md:p-12 rounded-3xl text-center text-white mx-4 md:mx-0 mb-8">
        <h3 className="text-xl md:text-2xl font-medium mb-3">{t('weddingPage.bottomCta.title')}</h3>
        <p className="text-sm md:text-base mb-6 md:mb-8 opacity-90">
          {t('weddingPage.bottomCta.description')}
        </p>
        <a
          href={buildWhatsAppUrl(t('weddingPage.bottomCta.message'))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-white text-rose-600 px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-medium hover:bg-rose-50 transition shadow-lg text-sm md:text-base"
        >
          <MessageCircle size={20} />
          {t('weddingPage.bottomCta.action')}
        </a>
        <p className="text-xs md:text-sm mt-4 opacity-90">
          {t('weddingPage.bottomCta.note')}
        </p>
      </div>

      <Footer />
    </div>
  );
}

