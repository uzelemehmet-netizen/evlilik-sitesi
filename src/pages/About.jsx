import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import HeroSocialButtons from '../components/HeroSocialButtons';
import StickyWhatsApp from '../components/StickyWhatsApp';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { isFeatureEnabled } from '../config/siteVariant';

export default function About() {
  const { t } = useTranslation();
  const whyUsItems = t('about.whyUs.items', { returnObjects: true });
  const showWedding = isFeatureEnabled('wedding');

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section with Background Image */}
      <section className="pt-20 pb-12 px-4 relative overflow-hidden min-h-80" style={{
        backgroundImage:
          'linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 64, 175, 0.65) 40%, rgba(16, 185, 129, 0.55) 100%), url(https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 80%',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}>
        <div className="absolute inset-0"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center flex flex-col justify-center items-center min-h-80">
          <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6" style={{ fontFamily: '"Poppins", sans-serif', textShadow: '0 4px 12px rgba(0,0,0,0.7)' }}>
            {t('about.hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-white" style={{ fontFamily: '"Poppins", sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            {t('about.hero.subtitle')}
          </p>
        </div>
        <HeroSocialButtons />
      </section>

      {/* Content Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 p-6 rounded-2xl border border-emerald-100 bg-emerald-50/60">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('about.brand.title')}
            </h2>
            <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('about.brand.p1')}
            </p>
            <p className="text-sm text-gray-700 mt-3" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('about.brand.p2')}
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {showWedding && (
                <Link to="/wedding" className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition block">
                  <p className="text-xs uppercase tracking-wide text-emerald-700 mb-1" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    {t('about.brand.cards.weddingTitle')}
                  </p>
                  <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    {t('about.brand.cards.weddingDesc')}
                  </p>
                </Link>
              )}
              <Link
                to={showWedding ? '/evlilik' : '/contact'}
                className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm hover:shadow-md transition block"
              >
                <p className="text-xs uppercase tracking-wide text-emerald-700 mb-1" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('about.brand.cards.dameturkTitle')}
                </p>
                <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('about.brand.cards.dameturkDesc')}
                </p>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('about.brand.socialNote')}
            </p>
          </div>

          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-10 text-center" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('about.philosophy.title')}
          </h2>

          <div className="space-y-6 text-base md:text-lg text-gray-700 leading-relaxed" style={{ fontFamily: '"Poppins", sans-serif' }}>
            <p className="text-sm text-gray-700">
              {t('about.philosophy.intro')}
            </p>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">{t('about.philosophy.sections.direct.title')}</h3>
              <p className="text-sm text-gray-700">{t('about.philosophy.sections.direct.p1')}</p>
              <p className="text-sm text-gray-700">{t('about.philosophy.sections.direct.p2')}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">{t('about.philosophy.sections.planning.title')}</h3>
              <p className="text-sm text-gray-700">{t('about.philosophy.sections.planning.p1')}</p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {t('about.philosophy.sections.planning.bullets', { returnObjects: true }).map((li, idx) => (
                  <li key={idx}>{li}</li>
                ))}
              </ul>
              <p className="text-sm text-gray-700">{t('about.philosophy.sections.planning.p2')}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">{t('about.philosophy.sections.transparency.title')}</h3>
              <p className="text-sm text-gray-700">{t('about.philosophy.sections.transparency.p1')}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">{t('about.philosophy.sections.comfort.title')}</h3>
              <p className="text-sm text-gray-700">{t('about.philosophy.sections.comfort.p1')}</p>
              <p className="text-sm text-gray-700">{t('about.philosophy.sections.comfort.p2')}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">{t('about.philosophy.sections.guidance.title')}</h3>
              <p className="text-sm text-gray-700">{t('about.philosophy.sections.guidance.p1')}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">{t('about.philosophy.sections.wedding.title')}</h3>
              <p className="text-sm text-gray-700">{t('about.philosophy.sections.wedding.p1')}</p>
              <p className="text-sm text-gray-700">{t('about.philosophy.sections.wedding.p2')}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">{t('about.philosophy.sections.expectation.title')}</h3>
              <p className="text-sm text-gray-700">{t('about.philosophy.sections.expectation.p1')}</p>
            </div>

            <p className="text-sm text-gray-700">
              <Trans
                i18nKey="about.philosophy.outro"
                components={[
                  <span key="0" />,
                  <span key="1" className="text-emerald-700 font-semibold" />,
                  <span key="2" />,
                  <span key="3" className="text-emerald-700 font-semibold" />,
                  <span key="4" />,
                  <span key="5" className="text-emerald-700 font-semibold" />,
                ]}
              />
            </p>
          </div>

          {/* Hizmet Kapsamı - Kısa Liste */}
          <div className="mt-12">
            <h3
              className="text-xl md:text-2xl font-semibold text-gray-900 mb-4"
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              {t('about.support.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 shadow-sm">
                <h4
                  className="text-base font-semibold text-gray-900 mb-1"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  {t('about.support.items.joinScheduled.title')}
                </h4>
                <p className="text-sm text-gray-700">
                  {t('about.support.items.joinScheduled.description')}
                </p>
              </div>
              {/* 2. Kart: Çeviri ve iletişim desteği */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm">
                <h4
                  className="text-base font-semibold text-gray-900 mb-1"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  {t('about.support.items.translation.title')}
                </h4>
                <p className="text-sm text-gray-700">
                  {t('about.support.items.translation.description')}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm">
                <h4
                  className="text-base font-semibold text-gray-900 mb-1"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  {t('about.support.items.privatePlan.title')}
                </h4>
                <p className="text-sm text-gray-700">
                  {t('about.support.items.privatePlan.description')}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm">
                <h4
                  className="text-base font-semibold text-gray-900 mb-1"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  {t('about.support.items.privateGroups.title')}
                </h4>
                <p className="text-sm text-gray-700">
                  {t('about.support.items.privateGroups.description')}
                </p>
              </div>
              {/* 5. Kart: Konaklama ve ulaşım planlama */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm">
                <h4
                  className="text-base font-semibold text-gray-900 mb-1"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  {t('about.support.items.logistics.title')}
                </h4>
                <p className="text-sm text-gray-700">
                  {t('about.support.items.logistics.description')}
                </p>
              </div>

              {/* 6. Kart: Endonezya’da evlilik sürecine rehberlik */}
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 shadow-sm">
                <h4
                  className="text-base font-semibold text-gray-900 mb-1"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  {t('about.support.items.wedding.title')}
                </h4>
                <p className="text-sm text-gray-700">
                  {t('about.support.items.wedding.description')}
                </p>
              </div>
            </div>
          </div>


          {/* YouTube'dan Öne Çıkan Videolar */}
          <div className="mt-12">
            <h3
              className="text-xl md:text-2xl font-semibold text-gray-900 mb-4"
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              {t('about.youtubeHighlights.title')}
            </h3>
            <p
              className="text-sm text-gray-700 mb-6 max-w-2xl"
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              {t('about.youtubeHighlights.description')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://www.youtube.com/watch?v=VZiBxoD3zLA"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 transition"
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  <img
                    src="https://img.youtube.com/vi/VZiBxoD3zLA/mqdefault.jpg"
                    alt={t('about.youtubeHighlights.v1ThumbAlt')}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p
                    className="text-sm font-medium text-gray-900 group-hover:text-red-600 line-clamp-2"
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  >
                    {t('about.youtubeHighlights.v1Title')}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{t('about.youtubeHighlights.v1Desc')}</p>
                </div>
              </a>

              <a
                href="https://www.youtube.com/watch?v=5ICrq1qT6Gc"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 transition"
              >
                <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  <img
                    src="https://img.youtube.com/vi/5ICrq1qT6Gc/mqdefault.jpg"
                    alt={t('about.youtubeHighlights.v2ThumbAlt')}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p
                    className="text-sm font-medium text-gray-900 group-hover:text-red-600 line-clamp-2"
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  >
                    {t('about.youtubeHighlights.v2Title')}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{t('about.youtubeHighlights.v2Desc')}</p>
                </div>
              </a>
            </div>
          </div>

          <div className="mt-16 pt-16 border-t border-gray-200">
            <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('about.whyUs.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.isArray(whyUsItems) &&
                whyUsItems.map((item, idx) => (
                  <div key={idx} className="text-center">
                    <div
                      className={
                        'text-base md:text-lg font-semibold mb-2 ' +
                        (idx === 0 ? 'text-blue-600' : idx === 1 ? 'text-green-600' : 'text-pink-600')
                      }
                      style={{ fontFamily: '"Poppins", sans-serif' }}
                    >
                      {item.title}
                    </div>
                    <p className="text-gray-600 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
                      {item.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>

        </div>
      </section>

      <StickyWhatsApp />
      <Footer />
    </div>
  );
}
