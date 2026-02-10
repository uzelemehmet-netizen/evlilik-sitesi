import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import HeroSocialButtons from '../components/HeroSocialButtons';
import { MapPin, FileText, BadgeCheck, Heart, Video, IceCream, MessageCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isFeatureEnabled } from '../config/siteVariant';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { trackClick } from '../utils/clickTracker';

export default function Home() {
  const { t } = useTranslation();
  const trustItems = t('home.trust.items', { returnObjects: true });
  const howSteps = t('home.howItWorks.steps', { returnObjects: true });
  const featureItems = t('home.features.items', { returnObjects: true });
  const faqItems = t('home.faq.items', { returnObjects: true });

  const showWedding = isFeatureEnabled('wedding');

  const primaryCtaHref = showWedding ? '/login?mode=signup' : '/contact';
  const primaryCtaLabel = showWedding ? t('home.cta.ctaTryFree') : t('home.cta.ctaContact');

  const scrollToSection = (id) => {
    try {
      const el = document.getElementById(id);
      if (!el) return;
      const offset = 88;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-0">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden min-h-96" style={{
        backgroundImage: "linear-gradient(135deg, rgba(2,6,23,0.78) 0%, rgba(15,23,42,0.70) 45%, rgba(16,185,129,0.48) 100%), url('/pexels-fotobi-12900522.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center 75%',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll'
      }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-10 items-center text-center">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-white/10 text-white px-3 py-1 text-xs font-semibold border border-white/20" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                  {t('home.hero.badgeCompany')}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-50 px-3 py-1 text-xs font-semibold border border-emerald-200/30" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                  {t('home.hero.badgeSocial')}
                </span>
              </div>
              <h1
	                className="text-3xl md:text-4xl font-medium text-white mb-4"
                style={{ textShadow: '0 4px 12px rgba(0,0,0,0.7)' }}
              >
	              {t('home.hero.title')}
              </h1>
              <p
                className="text-xs md:text-sm text-emerald-100 mb-3 tracking-wide uppercase"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
              >
                {t('home.hero.subtitle')}
              </p>
              <p
	                className="text-base md:text-lg text-white mb-7 max-w-4xl mx-auto"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
              >
	                {t('home.hero.description')}
              </p>
          <p
            className="text-[11px] md:text-xs text-white/85 max-w-4xl mx-auto"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          >
            {t('home.hero.note')}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
            <a
              href={primaryCtaHref}
              className="w-full sm:w-auto app-btn app-btn-primary h-12 px-6"
              onClick={() => trackClick('cta_signup_home_hero', { page: '/' })}
            >
              <Heart size={18} />
              {primaryCtaLabel}
            </a>

            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-white/10 text-white font-semibold text-sm border border-white/25 hover:bg-white/15 transition"
            >
              <FileText size={18} />
              {t('home.hero.ctaHow')}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
            <a
              href="/kurumsal"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition"
              onClick={() => trackClick('cta_trust_home_hero', { page: '/' })}
            >
              <BadgeCheck size={16} /> {t('home.hero.ctaTrust')}
            </a>
            <a
              href={buildWhatsAppUrl(t('floatingWhatsapp.messages.home'))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition"
              onClick={() => trackClick('cta_whatsapp_home_hero', { page: '/' })}
            >
              <MessageCircle size={16} /> {t('home.cta.ctaWhatsapp')}
            </a>
          </div>
            </div>
          </div>
        </div>
        <HeroSocialButtons align="right" />
      </section>

      {/* Trust strip */}
      <section className="px-4 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Array.isArray(trustItems) &&
              trustItems.map((item, idx) => (
                <div key={idx} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
                  <p className="text-xs uppercase tracking-wide text-emerald-800 mb-1">{item.title}</p>
                  <p className="text-sm text-slate-700">{item.description}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* How it works (hero altı, tek akış) */}
      <section id="how-it-works" className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-lg md:text-xl font-normal text-center mb-6 text-gray-900">
              {t('home.howItWorks.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.isArray(howSteps) &&
                howSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={
                      idx === 0
                        ? 'p-4 rounded-2xl bg-emerald-50 border border-emerald-100'
                        : idx === 1
                        ? 'p-4 rounded-2xl bg-indigo-50 border border-indigo-100'
                        : 'p-4 rounded-2xl bg-slate-50 border border-slate-200'
                    }
                  >
                    <p
                      className={
                        idx === 0
                          ? 'text-xs uppercase tracking-wide text-emerald-800 mb-1'
                          : idx === 1
                          ? 'text-xs uppercase tracking-wide text-indigo-800 mb-1'
                          : 'text-xs uppercase tracking-wide text-slate-700 mb-1'
                      }
                    >
                      {step.title}
                    </p>
                    <p className="text-sm text-slate-700">{step.description}</p>
                  </div>
                ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={primaryCtaHref}
                className="app-btn app-btn-primary"
                onClick={() => trackClick('cta_signup_home_howitworks', { page: '/' })}
              >
                <Heart size={18} /> {primaryCtaLabel}
              </a>
              <a
                href="/docs/site-kurallari.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-semibold hover:shadow-sm transition"
                onClick={() => trackClick('cta_documents_home_howitworks', { page: '/' })}
              >
                <BadgeCheck size={18} className="text-emerald-700" /> {t('home.howItWorks.ctaDocuments')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-18 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg md:text-xl font-normal text-center mb-6 text-gray-900">
            {t('home.services.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showWedding && (
              <a
                href={primaryCtaHref}
                className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
                aria-label={primaryCtaLabel}
                onClick={() => trackClick('cta_signup_home_services_card', { page: '/' })}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: "url('/bali-beach-seminyak-palm-trees.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
                <div className="relative z-10 p-6 flex flex-col h-full">
                  <Heart className="text-emerald-200 mb-2" size={30} />
                  <h3 className="text-base md:text-lg font-medium mb-1 text-white">{t('home.services.cards.matchmaking.title')}</h3>
                  <p className="text-sm text-emerald-50/95 flex-1">
                    {t('home.services.cards.matchmaking.description')}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-emerald-500/90 text-white px-4 py-2 text-sm font-semibold shadow-sm">
                    <Heart size={16} /> {primaryCtaLabel}
                  </div>
                </div>
              </a>
            )}

            {showWedding && (
              <a
                href="/evlilik"
                className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
                onClick={() => trackClick('cta_documents_home_services_card', { page: '/' })}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1600&q=80')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
                <div className="relative z-10 p-6 flex flex-col h-full">
                  <Sparkles className="text-emerald-200 mb-2" size={30} />
                  <h3 className="text-base md:text-lg font-medium mb-1 text-white">{t('home.services.cards.wedding.title')}</h3>
                  <p className="text-sm text-emerald-50/95 flex-1">
                    {t('home.services.cards.wedding.description')}
                  </p>
                </div>
              </a>
            )}

            {/* 5. Kart: YouTube videoları */}
            <a
              href="/youtube"
              className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: "url('/bali-rice-terraces-green.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
              <div className="relative z-10 p-6 flex flex-col h-full">
                <Video className="text-emerald-200 mb-2" size={30} />
                <h3 className="text-base md:text-lg font-medium mb-1 text-white">{t('home.services.cards.youtube.title')}</h3>
                <p className="text-sm text-emerald-50/95 flex-1">
                  {t('home.services.cards.youtube.description')}
                </p>
              </div>
            </a>

            {/* 6. Kart: DaMeTurk (ayrı web sitesi) */}
            <a
              href="https://www.dameturk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
              aria-label={t('home.services.cards.dameturk.aria')}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=1600&q=80')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
              <div className="relative z-10 p-6 flex flex-col h-full">
                <IceCream className="text-emerald-200 mb-2" size={30} />
                <h3 className="text-base md:text-lg font-medium mb-1 text-white">{t('home.services.cards.dameturk.title')}</h3>
                <p className="text-sm text-emerald-50/95 flex-1">
                  {t('home.services.cards.dameturk.description')}
                </p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg md:text-xl font-normal text-center mb-6 text-gray-900">
            {t('home.features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.isArray(featureItems) &&
              featureItems.map((item, idx) => {
                const Icon = idx === 0 ? FileText : idx === 1 ? Heart : MapPin;
                return (
                  <div key={idx} className="p-6 border border-slate-200 rounded-2xl hover:shadow-md transition bg-white">
                    <Icon className="text-emerald-600 mb-2" size={26} />
                    <h3 className="text-base md:text-lg font-medium mb-1 text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-700">{item.description}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Mini FAQ */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg md:text-xl font-normal text-center mb-6 text-gray-900">
            {t('home.faq.title')}
          </h2>

          <div className="space-y-3">
            {Array.isArray(faqItems) &&
              faqItems.map((item, idx) => (
                <details key={idx} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <summary className="cursor-pointer list-none font-semibold text-slate-900 flex items-center justify-between gap-3">
                    <span className="text-sm md:text-base">{item.q}</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-700">{item.a}</p>
                </details>
              ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-800 to-emerald-950 p-8 text-center text-white shadow-sm">
            <p className="text-xs md:text-sm text-emerald-100 tracking-wide mb-2 uppercase">{t('home.cta.eyebrow')}</p>
            <h2 className="text-xl md:text-2xl font-medium text-white mb-3">{t('home.cta.title')}</h2>
            <p className="text-sm md:text-base text-emerald-50/95 mb-7 max-w-2xl mx-auto">{t('home.cta.description')}</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/contact" className="app-btn bg-white text-slate-950 ring-white/20 hover:from-white hover:to-white">
                {t('home.cta.ctaContact')}
              </a>
              <a
                href={buildWhatsAppUrl(t('floatingWhatsapp.messages.home'))}
                target="_blank"
                rel="noopener noreferrer"
                className="app-btn app-btn-soft"
                onClick={() => trackClick('cta_whatsapp_home_bottom', { page: '/' })}
              >
                <MessageCircle size={18} />
                {t('home.cta.ctaWhatsapp')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mobil sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3">
        <div className="max-w-7xl mx-auto rounded-2xl bg-slate-950/92 backdrop-blur border border-white/10 shadow-lg p-3 flex items-center gap-3">
          <a
            href={primaryCtaHref}
            className="flex-1 app-btn app-btn-primary h-12"
            onClick={() => trackClick('cta_signup_home_sticky', { page: '/' })}
          >
            <Heart size={18} /> {primaryCtaLabel}
          </a>
          <a
            href={buildWhatsAppUrl(t('floatingWhatsapp.messages.home'))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition"
            aria-label={t('home.cta.ctaWhatsapp')}
            onClick={() => trackClick('cta_whatsapp_home_sticky', { page: '/' })}
          >
            <MessageCircle size={18} />
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}



