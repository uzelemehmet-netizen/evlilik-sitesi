import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import HeroSocialButtons from '../components/HeroSocialButtons';
import { MapPin, FileText, BadgeCheck, Heart, Video, IceCream, MessageCircle, Sparkles, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isFeatureEnabled } from '../config/siteVariant';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { trackClick } from '../utils/clickTracker';
import { APP_INSTALL_PATH, getAppInstallLinkUi } from '../utils/appInstallLink';

function getBaseLang(raw) {
  const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'in') return 'id';
  if (base === 'tr' || base === 'en' || base === 'id') return base;
  return 'tr';
}

function getHomeSupportUi(lang) {
  const copy = {
    tr: {
      heroPanelEyebrow: 'Ilk temas',
      heroPanelTitle: 'Burada baskili bir akis yok',
      heroPanelBody: 'Once durumunuzu, uygunlugu ve en dogru yolu netlestiriyoruz. Sonraki adimlar kontrollu ilerler.',
      heroPanelPoints: ['Kisa on degerlendirme', 'Net geri donus', 'WhatsApp ile insan destegi'],
      quickFacts: [
        {
          title: 'Ucretsiz ilk adim',
          body: 'Baslangic ucretsizdir. Once durumunuzu netlestirir, sonra size en dogru yolu soyleriz.',
        },
        {
          title: 'Profil herkese acik degil',
          body: 'Bilgileriniz rastgele dolasima acilmaz; surec kontrollu ve saygili sekilde ilerler.',
        },
        {
          title: 'WhatsApptan gercek destek',
          body: 'Takildiginiz anda bize yazabilir, surec ve uygunluk hakkinda net cevap alabilirsiniz.',
        },
      ],
      nextStepsEyebrow: 'Ilk adimda ne olur?',
      nextStepsTitle: 'Basladiktan sonra sizi belirsizlikte birakmiyoruz',
      nextSteps: [
        {
          title: '1. Kisa basvuru',
          body: '1-3 dakikada temel durumunuzu anlatirsiniz.',
        },
        {
          title: '2. En dogru yol netlesir',
          body: 'Size uygun akisin eslestirme mi rehberlik mi oldugunu acikca soyleriz.',
        },
        {
          title: '3. Kontrollu ilerleme',
          body: 'Uygun akista form, panel ve WhatsApp destegiyle devam edersiniz.',
        },
      ],
      ctaNote: 'Ucretsiz ilk adim • Profil herkese acik degil • Uygun degilse acikca soyleriz',
      whatsappLabel: 'WhatsApptan durumunuza uygun mu sorun',
      whatsappMessage: 'Merhaba, baslamadan once Uniqahin benim durumuma uygun olup olmadigini ogrenmek istiyorum.',
    },
    en: {
      heroPanelEyebrow: 'First contact',
      heroPanelTitle: 'There is no pressure-led flow here',
      heroPanelBody: 'We first clarify your situation, fit and the right path. Only then do the next steps move forward in a controlled way.',
      heroPanelPoints: ['Short pre-check', 'Clear outcome', 'Human support on WhatsApp'],
      quickFacts: [
        {
          title: 'Free first step',
          body: 'Getting started is free. We first clarify your situation, then tell you the most suitable path.',
        },
        {
          title: 'Your profile is not public',
          body: 'Your details are not exposed for random browsing; the process stays controlled and respectful.',
        },
        {
          title: 'Real WhatsApp support',
          body: 'If you get stuck, you can message us and get a direct answer about fit and process.',
        },
      ],
      nextStepsEyebrow: 'What happens first?',
      nextStepsTitle: 'We do not leave you in uncertainty after you start',
      nextSteps: [
        {
          title: '1. Short application',
          body: 'You explain your basic situation in about 1-3 minutes.',
        },
        {
          title: '2. Best path becomes clear',
          body: 'We tell you clearly whether matchmaking or guidance fits your case better.',
        },
        {
          title: '3. Controlled progress',
          body: 'If suitable, you continue with forms, panel flow and WhatsApp support.',
        },
      ],
      ctaNote: 'Free first step • No public profile • We tell you clearly if the path is not a fit',
      whatsappLabel: 'Ask on WhatsApp if it fits your situation',
      whatsappMessage: 'Hello, before I start I want to understand whether Uniqah is suitable for my situation.',
    },
    id: {
      heroPanelEyebrow: 'Kontak awal',
      heroPanelTitle: 'Tidak ada alur yang menekan Anda di sini',
      heroPanelBody: 'Kami pahami dulu situasi, kecocokan, dan jalur yang paling tepat. Setelah itu proses berjalan terkontrol.',
      heroPanelPoints: ['Pemeriksaan awal singkat', 'Hasil yang jelas', 'Dukungan manusia lewat WhatsApp'],
      quickFacts: [
        {
          title: 'Langkah awal gratis',
          body: 'Memulai gratis. Kami pahami dulu situasi Anda, lalu jelaskan jalur yang paling cocok.',
        },
        {
          title: 'Profil tidak dipublikasikan',
          body: 'Data Anda tidak dibuka untuk dilihat sembarang orang; prosesnya tetap terkontrol dan sopan.',
        },
        {
          title: 'Dukungan WhatsApp nyata',
          body: 'Jika Anda ragu, Anda bisa langsung bertanya dan mendapat jawaban jelas tentang kecocokan proses.',
        },
      ],
      nextStepsEyebrow: 'Apa yang terjadi di awal?',
      nextStepsTitle: 'Setelah mulai, kami tidak membiarkan Anda bingung',
      nextSteps: [
        {
          title: '1. Pengajuan singkat',
          body: 'Anda menjelaskan situasi dasar Anda dalam sekitar 1-3 menit.',
        },
        {
          title: '2. Jalur paling cocok jadi jelas',
          body: 'Kami jelaskan dengan jujur apakah yang cocok untuk Anda adalah matchmaking atau pendampingan.',
        },
        {
          title: '3. Lanjut dengan terkontrol',
          body: 'Jika cocok, Anda melanjutkan dengan form, panel, dan dukungan WhatsApp.',
        },
      ],
      ctaNote: 'Langkah awal gratis • Profil tidak publik • Jika tidak cocok, kami sampaikan dengan jelas',
      whatsappLabel: 'Tanya via WhatsApp apakah ini cocok untuk Anda',
      whatsappMessage: 'Halo, sebelum mulai saya ingin tahu apakah Uniqah cocok untuk situasi saya.',
    },
  };

  return copy[lang] || copy.tr;
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const trustItems = t('home.trust.items', { returnObjects: true });
  const howSteps = t('home.howItWorks.steps', { returnObjects: true });
  const featureItems = t('home.features.items', { returnObjects: true });
  const faqItems = t('home.faq.items', { returnObjects: true });
  const langBase = getBaseLang(i18n?.language);
  const homeSupportUi = getHomeSupportUi(langBase);
  const installLinkUi = getAppInstallLinkUi(i18n?.language);
  const homeWhatsappHref = buildWhatsAppUrl(homeSupportUi.whatsappMessage, { lang: String(i18n?.language || 'tr') });

  const showWedding = isFeatureEnabled('wedding');

  const primaryCtaHref = showWedding ? '/evlilik' : '/contact';
  const primaryCtaLabel = showWedding ? t('home.cta.ctaWeddingGuidance') : t('home.cta.ctaContact');

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
      <section className="home-hero-bg pt-24 pb-16 px-4 relative overflow-hidden min-h-96">
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10),rgba(255,255,255,0)_36%)]" />
          <div className="absolute -right-24 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.22),rgba(251,191,36,0)_62%)] blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.26),rgba(16,185,129,0)_64%)] blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] gap-8 lg:gap-10 items-start text-center lg:text-left">
            <div className="max-w-4xl mx-auto lg:mx-0">
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4">
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
              <div className="mb-7 inline-flex max-w-full items-center justify-center lg:justify-start gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] md:text-xs font-semibold uppercase tracking-[0.18em] text-white/90 shadow-[0_14px_40px_rgba(15,23,42,0.22)] backdrop-blur-sm">
                <span>{homeSupportUi.ctaNote}</span>
              </div>

              <p
	                className="text-base md:text-lg text-white mb-7 max-w-4xl mx-auto lg:mx-0"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
              >
	                {t('home.hero.description')}
              </p>
          <p
            className="text-[11px] md:text-xs text-white/85 max-w-4xl mx-auto lg:mx-0"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          >
            {t('home.hero.note')}
          </p>

          <p
            className="mt-2 text-[11px] md:text-xs text-white/85 max-w-4xl mx-auto lg:mx-0"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          >
            {t('home.hero.freeNote')}
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-5xl mx-auto lg:mx-0 text-left">
            {homeSupportUi.quickFacts.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08))] p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">{item.title}</div>
                <div className="mt-2 text-sm text-white/90">{item.body}</div>
              </div>
            ))}
          </div>

          {showWedding ? (
            <>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-6xl mx-auto">
                <a
                  href={APP_INSTALL_PATH}
                  className="group sm:col-span-2 lg:col-span-3 rounded-[28px] border border-emerald-200/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.28),rgba(15,23,42,0.34))] p-5 text-left text-white shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur-md transition hover:brightness-105"
                  onClick={() => trackClick('cta_app_install_home_hero', { page: '/' })}
                  aria-label={installLinkUi.title}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/12">
                      <Download size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-[0.22em] text-emerald-100/90">{installLinkUi.eyebrow}</div>
                      <div className="mt-2 text-lg font-semibold md:text-2xl">{installLinkUi.title}</div>
                      <div className="mt-2 max-w-3xl text-sm text-white/88 md:text-base">{installLinkUi.homeBody}</div>
                      <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_34px_rgba(255,255,255,0.18)]">
                        <Download size={18} />
                        {installLinkUi.cta}
                      </div>
                    </div>
                  </div>
                </a>

                <a
                  href={primaryCtaHref}
                  className="group rounded-2xl bg-white/10 text-white border border-white/20 p-4 md:p-5 hover:bg-white/15 transition text-left"
                  onClick={() => trackClick('cta_wedding_guidance_home_hero', { page: '/' })}
                  aria-label={primaryCtaLabel}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-200/20">
                      <Heart size={18} className="text-emerald-100" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wide text-white/80">{t('home.services.cards.wedding.title')}</div>
                      <div className="mt-1 text-base md:text-lg font-semibold">{primaryCtaLabel}</div>
                      <div className="mt-1 text-sm text-white/85">{t('home.services.cards.wedding.description')}</div>
                      <div className="mt-4 inline-flex items-center gap-2 app-btn app-btn-primary h-11 px-5">
                        <Heart size={18} />
                        {primaryCtaLabel}
                      </div>
                    </div>
                  </div>
                </a>

                <a
                  href="/eslestirme"
                  className="group rounded-2xl bg-white/10 text-white border border-white/20 p-4 md:p-5 hover:bg-white/15 transition text-left"
                  onClick={() => trackClick('cta_matchmaking_home_hero', { page: '/' })}
                  aria-label={t('home.cta.ctaMatchmaking')}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 border border-white/15">
                      <Sparkles size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wide text-white/80">{t('home.services.cards.matchmaking.title')}</div>
                      <div className="mt-1 text-base md:text-lg font-semibold">{t('home.cta.ctaMatchmaking')}</div>
                      <div className="mt-1 text-sm text-white/85">{t('home.cta.matchmakingHint')}</div>
                      <div className="mt-4 inline-flex items-center gap-2 app-btn app-btn-primary-light h-11 px-5">
                        <Sparkles size={18} />
                        {t('home.cta.ctaMatchmaking')}
                      </div>
                    </div>
                  </div>
                </a>

                <a
                  href="/aracilik"
                  className="group rounded-2xl bg-white/10 text-white border border-white/20 p-4 md:p-5 hover:bg-white/15 transition text-left"
                  onClick={() => trackClick('cta_lead_apply_home_hero', { page: '/' })}
                  aria-label={t('navigation.leadApply')}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 border border-white/15">
                      <MessageCircle size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wide text-white/80">{t('leadNoAuth.info.title')}</div>
                      <div className="mt-1 text-base md:text-lg font-semibold">{t('navigation.leadApply')}</div>
                      <div className="mt-1 text-sm text-white/85">{t('leadNoAuth.subtitle')}</div>
                      <div className="mt-4 inline-flex items-center gap-2 app-btn app-btn-primary-light h-11 px-5">
                        <MessageCircle size={18} />
                        {t('navigation.leadApply')}
                      </div>
                    </div>
                  </div>
                </a>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-white/10 text-white font-semibold text-sm border border-white/25 hover:bg-white/15 transition"
                >
                  <FileText size={18} />
                  {t('home.hero.ctaHow')}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2">
              <a
                href={primaryCtaHref}
                className="w-full sm:w-auto app-btn app-btn-primary h-12 px-6"
                onClick={() => trackClick('cta_primary_home_hero', { page: '/' })}
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
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm">
            <a
              href="/kurumsal"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition"
              onClick={() => trackClick('cta_trust_home_hero', { page: '/' })}
            >
              <BadgeCheck size={16} /> {t('home.hero.ctaTrust')}
            </a>
            <a
              href={homeWhatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition"
              onClick={() => trackClick('cta_whatsapp_home_hero', { page: '/' })}
            >
              <MessageCircle size={16} /> {homeSupportUi.whatsappLabel}
            </a>
          </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative overflow-hidden rounded-[30px] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] p-6 text-left shadow-[0_30px_90px_rgba(2,6,23,0.26)] backdrop-blur-xl">
                <div aria-hidden="true" className="absolute inset-0">
                  <div className="absolute -top-16 right-0 h-44 w-44 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.30),rgba(251,191,36,0)_62%)] blur-2xl" />
                  <div className="absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),rgba(16,185,129,0)_60%)] blur-2xl" />
                </div>
                <div className="relative">
                  <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    {homeSupportUi.heroPanelEyebrow}
                  </div>
                  <h2 className="mt-4 text-[1.45rem] font-semibold leading-tight text-white">
                    {homeSupportUi.heroPanelTitle}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">
                    {homeSupportUi.heroPanelBody}
                  </p>

                  <div className="mt-5 space-y-3">
                    {homeSupportUi.heroPanelPoints.map((point, index) => (
                      <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/12 bg-black/10 px-4 py-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold text-white">
                          {index + 1}
                        </div>
                        <div className="text-sm text-white/90">{point}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-[24px] border border-emerald-200/20 bg-emerald-500/10 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">{homeSupportUi.nextStepsEyebrow}</div>
                    <div className="mt-2 text-sm text-white">{homeSupportUi.nextSteps[0]?.title}</div>
                    <div className="mt-1 text-xs leading-relaxed text-white/75">{homeSupportUi.nextSteps[0]?.body}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <HeroSocialButtons align="right" />
      </section>

      {/* Trust strip */}
      <section className="px-4 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.isArray(trustItems) &&
              trustItems.map((item, idx) => (
                <div key={idx} className="relative overflow-hidden rounded-[26px] border border-white bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                  <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-amber-300 to-slate-200" />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-800 mb-2">{item.title}</p>
                  <p className="text-sm leading-relaxed text-slate-700">{item.description}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-6 md:p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] gap-6 items-start">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">{homeSupportUi.nextStepsEyebrow}</div>
                <h2 className="mt-2 text-xl md:text-2xl font-semibold text-slate-900">{homeSupportUi.nextStepsTitle}</h2>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">{homeSupportUi.ctaNote}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {homeSupportUi.nextSteps.map((step, idx) => (
                <div key={step.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(148,163,184,0.10)]">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-900">
                    {idx + 1}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-slate-900">{step.title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-slate-600">{step.body}</div>
                </div>
              ))}
              </div>
            </div>
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
                onClick={() => trackClick('cta_wedding_guidance_home_howitworks', { page: '/' })}
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
      <section className="cv-auto py-18 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-lg md:text-xl font-normal text-center mb-6 text-gray-900">
            {t('home.services.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showWedding && (
              <a
                href="/evlilik"
                className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
                aria-label={primaryCtaLabel}
                onClick={() => trackClick('cta_wedding_guidance_home_services_card', { page: '/' })}
              >
                <div
                  className="home-services-bg-beach absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
                <div className="relative z-10 p-6 flex flex-col h-full">
                  <Heart className="text-emerald-200 mb-2" size={30} />
                  <h3 className="text-base md:text-lg font-medium mb-1 text-white">{t('home.services.cards.wedding.title')}</h3>
                  <p className="text-sm text-emerald-50/95 flex-1">
                    {t('home.services.cards.wedding.description')}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-emerald-500/90 text-white px-4 py-2 text-sm font-semibold shadow-sm">
                    <Heart size={16} /> {primaryCtaLabel}
                  </div>
                </div>
              </a>
            )}

            {showWedding && (
              <a
                href="/eslestirme"
                className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col"
                onClick={() => trackClick('cta_matchmaking_home_services_card', { page: '/' })}
              >
                <div
                  className="home-services-bg-matchmaking absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/25" />
                <div className="relative z-10 p-6 flex flex-col h-full">
                  <Sparkles className="text-emerald-200 mb-2" size={30} />
                  <h3 className="text-base md:text-lg font-medium mb-1 text-white">{t('home.services.cards.matchmaking.title')}</h3>
                  <p className="text-sm text-emerald-50/95 flex-1">
                    {t('home.services.cards.matchmaking.description')}
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
                className="home-services-bg-rice absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
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
                className="home-services-bg-dameturk absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
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
      <section className="cv-auto py-16 px-4">
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
      <section className="cv-auto py-12 px-4 bg-slate-50">
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
      <section className="cv-auto py-16 px-4 bg-slate-50">
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
                href={homeWhatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="app-btn app-btn-soft"
                onClick={() => trackClick('cta_whatsapp_home_bottom', { page: '/' })}
              >
                <MessageCircle size={18} />
                {homeSupportUi.whatsappLabel}
              </a>
            </div>

            <div className="mt-4 text-xs text-emerald-100/90">{homeSupportUi.ctaNote}</div>
          </div>
        </div>
      </section>

      {/* Mobil sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3">
        <div className="max-w-7xl mx-auto rounded-2xl bg-slate-950/92 backdrop-blur border border-white/10 shadow-lg p-3 flex items-center gap-3">
          {showWedding ? (
            <>
              <a
                href={primaryCtaHref}
                className="flex-1 app-btn app-btn-primary h-12"
                onClick={() => trackClick('cta_wedding_guidance_home_sticky', { page: '/' })}
              >
                <Heart size={18} /> {primaryCtaLabel}
              </a>
              <a
                href="/eslestirme"
                className="flex-1 app-btn app-btn-primary-light h-12"
                onClick={() => trackClick('cta_matchmaking_home_sticky', { page: '/' })}
              >
                <Sparkles size={18} /> {t('home.cta.ctaMatchmaking')}
              </a>
            </>
          ) : (
            <a
              href={primaryCtaHref}
              className="flex-1 app-btn app-btn-primary h-12"
              onClick={() => trackClick('cta_signup_home_sticky', { page: '/' })}
            >
              <Heart size={18} /> {primaryCtaLabel}
            </a>
          )}
          <a
            href={homeWhatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition"
            aria-label={homeSupportUi.whatsappLabel}
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



