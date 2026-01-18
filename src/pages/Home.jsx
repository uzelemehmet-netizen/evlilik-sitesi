import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import HeroSocialButtons from '../components/HeroSocialButtons';
import { Plane, MapPin, Users, FileText, BadgeCheck, Heart, Video, IceCream, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isFeatureEnabled } from '../config/siteVariant';
import { buildWhatsAppUrl } from '../utils/whatsapp';

export default function Home() {
  const { t } = useTranslation();
  const trustItems = t('home.trust.items', { returnObjects: true });
  const howSteps = t('home.howItWorks.steps', { returnObjects: true });
  const featureItems = t('home.features.items', { returnObjects: true });

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden min-h-96" style={{
        backgroundImage: 'linear-gradient(135deg, rgba(15,23,42,0.75) 0%, rgba(30,64,175,0.65) 40%, rgba(16,185,129,0.55) 100%), url(https://24me1z7hg7.ucarecd.net/a3677a3d-16f3-4f04-9006-13bea58da607/vecteezy_thebeautifulriceterracesinbaliindonesia_69917255.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 75%',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
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

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <a
              href="/tours"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-emerald-500 text-white font-semibold text-sm shadow-md hover:bg-emerald-600 transition"
            >
              <Plane size={18} />
              {t('home.hero.ctaTours')}
            </a>
            <a
              href="/docs/tur-brosurleri.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white/10 text-white font-semibold text-sm border border-white/25 hover:bg-white/15 transition"
            >
              <FileText size={18} />
              {t('home.hero.ctaBrochures')}
            </a>
            <a
              href="/kurumsal"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-white/10 text-white font-semibold text-sm border border-white/25 hover:bg-white/15 transition"
            >
              <BadgeCheck size={18} />
              {t('home.hero.ctaTrust')}
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
                <div key={idx} className="rounded-2xl bg-white border border-emerald-100 shadow-sm p-4">
                  <p className="text-xs uppercase tracking-wide text-emerald-700 mb-1">{item.title}</p>
                  <p className="text-sm text-gray-700">{item.description}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-18 px-4 bg-emerald-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg md:text-xl font-normal text-center mb-6 text-gray-900">
            {t('home.services.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Kart: Toplu turlara katılım */}
            <a
              href="/tours"
              className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: "url('/bali-island-tropical-beach-temple.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
              <div className="relative z-10 p-6 flex flex-col h-full">
                <Plane className="text-emerald-200 mb-2" size={30} />
                <h3 className="text-base md:text-lg font-medium mb-1 text-white">{t('home.services.cards.joinTours.title')}</h3>
                <p className="text-sm text-emerald-50/95 flex-1">
                  {t('home.services.cards.joinTours.description')}
                </p>
              </div>
            </a>

            {/* 2. Kart: Kurumsal tur organizasyonu */}
            <a
              href="/tours/groups"
              className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: "url('/tanah-lot-temple-sunset-ocean.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
              <div className="relative z-10 p-6 flex flex-col h-full">
                <Users className="text-emerald-200 mb-2" size={30} />
                <h3 className="text-base md:text-lg font-medium mb-1 text-white">{t('home.services.cards.groupTours.title')}</h3>
                <p className="text-sm text-emerald-50/95 flex-1">
                  {t('home.services.cards.groupTours.description')}
                </p>
              </div>
            </a>

            {/* 3. Kart: Bireysel / aile seyahati */}
            <a
              href="/travel"
              className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: "url('/bali-luxury-pool-villa.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
              <div className="relative z-10 p-6 flex flex-col h-full">
                <MapPin className="text-emerald-200 mb-2" size={30} />
                <h3 className="text-base md:text-lg font-medium mb-1 text-white">{t('home.services.cards.privateTravel.title')}</h3>
                <p className="text-sm text-emerald-50/95 flex-1">
                  {t('home.services.cards.privateTravel.description')}
                </p>
              </div>
            </a>

            {isFeatureEnabled('wedding') && (
              <a
                href="/wedding"
                className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: "url('/bali-traditional-dance-kecak.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
                <div className="relative z-10 p-6 flex flex-col h-full">
                  <Heart className="text-emerald-200 mb-2" size={30} />
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

          {/* How it works */}
          <div className="mt-10 p-6 rounded-2xl bg-white border border-emerald-100 shadow-sm">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">{t('home.howItWorks.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.isArray(howSteps) &&
                howSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={
                      idx === 0
                        ? 'p-4 rounded-2xl bg-emerald-50 border border-emerald-100'
                        : idx === 1
                        ? 'p-4 rounded-2xl bg-sky-50 border border-sky-100'
                        : 'p-4 rounded-2xl bg-amber-50 border border-amber-100'
                    }
                  >
                    <p
                      className={
                        idx === 0
                          ? 'text-xs uppercase tracking-wide text-emerald-700 mb-1'
                          : idx === 1
                          ? 'text-xs uppercase tracking-wide text-sky-700 mb-1'
                          : 'text-xs uppercase tracking-wide text-amber-800 mb-1'
                      }
                    >
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-700">{step.description}</p>
                  </div>
                ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a href="/tours" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition">
                <Plane size={18} /> {t('home.howItWorks.ctaTours')}
              </a>
              <a href="/dokumanlar" className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold hover:shadow-sm transition">
                <BadgeCheck size={18} className="text-emerald-700" /> {t('home.howItWorks.ctaDocuments')}
              </a>
            </div>
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
                  <div key={idx} className="p-6 border rounded-2xl hover:shadow-md transition bg-white">
                    <Icon className="text-emerald-600 mb-2" size={26} />
                    <h3 className="text-base md:text-lg font-medium mb-1 text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-700">{item.description}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs md:text-sm text-emerald-100 tracking-wide mb-2 uppercase">
            {t('home.cta.eyebrow')}
          </p>
          <h2 className="text-xl md:text-2xl font-medium text-white mb-3">
            {t('home.cta.title')}
          </h2>
          <p className="text-sm md:text-base text-emerald-50/95 mb-7 max-w-2xl mx-auto">
	            {t('home.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-white text-emerald-700 px-6 py-2.5 rounded-full font-medium hover:bg-emerald-50 transition text-center shadow-md hover:shadow-lg text-sm md:text-base"
            >
              {t('home.cta.ctaContact')}
            </a>
            <a
              href={buildWhatsAppUrl("Merhaba, Endonezya'da seyahat ve tur planlarımla ilgili bir sorum olacaktı.")}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-6 py-2.5 rounded-full font-medium hover:bg-green-600 transition text-center inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg text-sm md:text-base"
            >
              <MessageCircle size={20} />
              {t('home.cta.ctaWhatsapp')}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}



