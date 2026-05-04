import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Copy, Home, Info } from 'lucide-react';
import appI18n from '../i18n';
import { detectInstalledRelatedAppsAndMark, isPwaInstalled, isRunningAsPwa, markPwaInstalled } from '../utils/pwaInstalled.js';
import { staticAssetUrl } from '../utils/staticAssetUrl';

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@endonezyakasifi';
const INSTAGRAM_PROFILE_URL = 'https://instagram.com/endonezyakasifi';

function normalizePageLang(raw) {
  const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'in') return 'id';
  if (base === 'tr' || base === 'en' || base === 'id') return base;
  return 'tr';
}

function readPreferredLanguageSource() {
  if (typeof window === 'undefined') return '';

  try {
    const localSource = String(localStorage.getItem('preferred_lang_source') || '').trim();
    if (localSource) return localSource;
  } catch {
    // ignore
  }

  try {
    return String(sessionStorage.getItem('preferred_lang_source') || '').trim();
  } catch {
    return '';
  }
}

function hasManualLanguageSelection() {
  return readPreferredLanguageSource() === 'selector';
}

function persistManualLanguageChoice(lang) {
  const normalized = normalizePageLang(lang);

  try {
    localStorage.setItem('preferred_lang', normalized);
    localStorage.setItem('preferred_lang_source', 'selector');
  } catch {
    // ignore
  }

  try {
    sessionStorage.setItem('preferred_lang', normalized);
    sessionStorage.setItem('preferred_lang_source', 'selector');
  } catch {
    // ignore
  }
}

function isIos() {
  if (typeof navigator === 'undefined') return false;
  const ua = String(navigator.userAgent || '').toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(String(navigator.userAgent || ''));
}

function getInAppBrowserHint() {
  try {
    const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
    if (!ua) return '';
    if (/trill[_\s/-]?|tiktok/i.test(ua)) return 'tiktok';
    if (/fbav|fban/i.test(ua)) return 'facebook';
    if (/instagram/i.test(ua)) return 'instagram';
    if (/line\//i.test(ua)) return 'line';
    if (/micromessenger|wechat/i.test(ua)) return 'wechat';
    return '';
  } catch {
    return '';
  }
}

function readDeferredInstallPrompt() {
  try {
    return typeof window !== 'undefined' ? window.__uniqahDeferredPrompt || null : null;
  } catch {
    return null;
  }
}

function waitForDeferredInstallPrompt(timeoutMs = 1800) {
  if (typeof window === 'undefined') return Promise.resolve(null);

  const existing = readDeferredInstallPrompt();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    let pollTimer = 0;
    let done = false;

    const finish = (value) => {
      if (done) return;
      done = true;
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      if (pollTimer) window.clearTimeout(pollTimer);
      resolve(value || null);
    };

    const handlePrompt = (event) => {
      try {
        event.preventDefault();
      } catch {
        // ignore
      }

      try {
        window.__uniqahDeferredPrompt = event;
      } catch {
        // ignore
      }

      finish(event);
    };

    const poll = () => {
      const current = readDeferredInstallPrompt();
      if (current) {
        finish(current);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        finish(null);
        return;
      }

      pollTimer = window.setTimeout(poll, 150);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    poll();
  });
}

export default function AppInstallTutorial() {
  const { t, i18n } = useTranslation();
  const effectiveI18n = i18n && typeof i18n.changeLanguage === 'function' ? i18n : appI18n;
  const iosHelpRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isPwaInstalled());
  const [installStatus, setInstallStatus] = useState('');

  const isIosDevice = useMemo(() => isIos(), []);
  const isAndroidDevice = useMemo(() => isAndroid(), []);
  const inAppBrowserHint = useMemo(() => getInAppBrowserHint(), []);
  const isInAppBrowser = !!inAppBrowserHint;
  const isStandalone = useMemo(() => isRunningAsPwa(), []);
  const isLocalDevMode = import.meta.env.DEV;
  const currentLang = useMemo(() => normalizePageLang(effectiveI18n?.language), [effectiveI18n?.language]);
  const languageOptionLabels = useMemo(
    () => ({
      tr: t('navigation.languageOptions.tr', 'Turkce'),
      en: t('navigation.languageOptions.en', 'English'),
      id: t('navigation.languageOptions.id', 'Bahasa Indonesia'),
    }),
    [t]
  );
  const uniqahLogoSrc = useMemo(() => staticAssetUrl('/brand-logo.webp'), []);
  const moonstarLogoSrc = useMemo(() => staticAssetUrl('/ChatGPT Image Jan 14, 2026, 01_53_44 PM.png'), []);
  const youtubeBannerSrc = useMemo(() => staticAssetUrl('/youtube-channel-banner.png'), []);

  const tx = (key, fallback, options = undefined) => {
    const value = t(key, { defaultValue: fallback, ...(options || {}) });
    return typeof value === 'string' && value === key ? fallback : value;
  };

  const tutorialUi = {
    eyebrow: tx('pwa.tutorial.eyebrow', 'Uygulama kurulumu'),
    title: tx('pwa.tutorial.title', 'Uygulamayı yükleyin, sonra kayıt olup içeriyi görün'),
    body: tx(
      'pwa.tutorial.body',
      'Bu sayfa uygulamayı ana ekrana ekleyip hızlıca başlamak için hazırlandı. Uygulamaya geçip hesabınızı oluşturun, kısa başvuru formunu tamamlayın ve önce içeriyi görün. Bildirimleri ise diğer kullanıcıları gördükten sonra uygulama içinden açmanızı öneririz.'
    ),
    backHome: tx('pwa.tutorial.backHome', 'Ana sayfa'),
    badge: tx('pwa.tutorial.badge', 'Linkten açılan tutorial akışı'),
    stepLabel: (step) => tx('pwa.tutorial.stepLabel', `Adım ${step}`, { step }),
    note: tx(
      'pwa.tutorial.note',
      'Kurulumdan sonra uygulama ana ekranda görünür. Şimdi kayıt olup içeriyi görebilirsiniz; bildirim önerisini daha sonra uygulama içinden, uygun anda göstereceğiz.'
    ),
    installEyebrow: tx('pwa.tutorial.installEyebrow', '1. adım'),
    readyEyebrow: tx('pwa.tutorial.readyEyebrow', '2. adım'),
    readyTitle: tx('pwa.tutorial.readyTitle', 'Kurulum tamam, şimdi uygulamaya geçin'),
    readyBody: tx(
      'pwa.tutorial.readyBody',
      'Şimdi uygulamaya geçip kayıt olabilirsiniz. Yeni kullanıcıysanız uygulama açılışından sonra başvuru formuna yönlendirilirsiniz. Diğer kullanıcıları gördükten sonra bildirimleri uygulama içinden açmanız önerilir.'
    ),
    readyBodyWeb: tx(
      'pwa.tutorial.readyBodyWeb',
      'Bu cihazda uygulama kurulamasa bile web sayfasından devam edebilirsiniz. Kayıt olup başvurunuzu tamamlayın; daha sonra uygun bir anda uygulamayı kurup bildirimleri uygulama içinden açabilirsiniz.'
    ),
    openApp: tx('pwa.tutorial.openApp', 'Uygulamaya git'),
    standaloneHint: tx(
      'pwa.tutorial.standaloneHint',
      'Uygulama zaten kurulu modda açılmış görünüyor. Devam ederek doğrudan uygulama giriş akışına geçebilirsiniz.'
    ),
    browserHint: tx(
      'pwa.tutorial.browserHint',
      'Bazı cihazlarda buton tarayıcı sekmesini açabilir. Böyle olursa ana ekrandaki Uniqah ikonuna dokunup aynı akıştan devam edin.'
    ),
    steps: {
      install: {
        title: tx('pwa.tutorial.steps.install.title', 'Uygulamayı yükle'),
        body: tx('pwa.tutorial.steps.install.body', 'Uygulamayı önce telefona ekleyin ki sonraki adımlar daha doğal bir uygulama akışıyla ilerlesin.'),
      },
      open: {
        title: tx('pwa.tutorial.steps.open.title', 'Uygulamaya geç'),
        body: tx('pwa.tutorial.steps.open.body', 'Uygulamaya geçip Google veya e-posta ile kayıt olun. Bildirim önerisini içeride, doğru anda göreceksiniz.'),
      },
    },
  };

  const trustUi = useMemo(() => {
    const copy = {
      tr: {
        badge: 'Sirket ve guven',
        companyBody: 'uniqah.com web sitesi resmi olarak PT MoonStar Global Indonesia sirketi adina faaliyet gosteren bir web sitesidir.',
        otherActivitiesTitle: 'PT MoonStar Global Indonesia diger faaliyet alanlarimiz',
        travelTitle: 'endonezyakasifi.com',
        travelBody: 'Endonezya seyahat rehberligi',
        iceCreamTitle: 'dameturk.com',
        iceCreamBody: 'Endonezya’da orijinal Turk dondurmasi uretimi',
        youtubeEyebrow: 'YouTube',
        youtubeTitle: 'YouTube kanalimizda seyahat ve nikah videolarimizi izleyin',
        youtubeBody: 'Uniqah, Endonezya hayati ve nikah sureclerine dair videolari YouTube sayfamizdan acabilirsiniz.',
        youtubeCta: 'Sitedeki YouTube sayfasini ac',
        youtubeSearchHint: 'Dilerseniz YouTube arama kismina @endonezyakasifi yazarak ya da Videolarimizi Izle butonuna tiklayarak videolarimizi izleyebilirsiniz.',
        youtubeButtonLabel: 'Videolarimizi Izle',
        instagramButtonLabel: "Bizi Instagram'da Takip Et",
      },
      en: {
        badge: 'Company and trust',
        companyBody: 'The uniqah.com website operates under PT MoonStar Global Indonesia.',
        otherActivitiesTitle: 'Other business lines of PT MoonStar Global Indonesia',
        travelTitle: 'endonezyakasifi.com',
        travelBody: 'Indonesia travel guidance',
        iceCreamTitle: 'dameturk.com',
        iceCreamBody: 'Authentic Turkish ice cream production in Indonesia',
        youtubeEyebrow: 'YouTube',
        youtubeTitle: 'Watch our travel and wedding videos on our YouTube channel',
        youtubeBody: 'You can open our YouTube page for videos about Uniqah, life in Indonesia and marriage-related journeys.',
        youtubeCta: 'Open the YouTube page on our site',
        youtubeSearchHint: 'If you want, you can type @endonezyakasifi into YouTube search or click the Watch Our Videos button to watch our videos.',
        youtubeButtonLabel: 'Watch Our Videos',
        instagramButtonLabel: 'Follow Us on Instagram',
      },
      id: {
        badge: 'Perusahaan dan kepercayaan',
        companyBody: 'Situs uniqah.com beroperasi di bawah PT MoonStar Global Indonesia.',
        otherActivitiesTitle: 'Bidang usaha lain PT MoonStar Global Indonesia',
        travelTitle: 'endonezyakasifi.com',
        travelBody: 'Panduan perjalanan Indonesia',
        iceCreamTitle: 'dameturk.com',
        iceCreamBody: 'Produksi es krim Turki asli di Indonesia',
        youtubeEyebrow: 'YouTube',
        youtubeTitle: 'Tonton video perjalanan dan pernikahan kami di kanal YouTube',
        youtubeBody: 'Anda bisa membuka halaman YouTube kami untuk video tentang Uniqah, kehidupan di Indonesia, dan proses pernikahan.',
        youtubeCta: 'Buka halaman YouTube di situs kami',
        youtubeSearchHint: 'Jika mau, Anda bisa mengetik @endonezyakasifi di pencarian YouTube atau mengetuk tombol Tonton Video Kami untuk menonton video kami.',
        youtubeButtonLabel: 'Tonton Video Kami',
        instagramButtonLabel: 'Ikuti Kami di Instagram',
      },
    };

    return copy[currentLang] || copy.tr;
  }, [currentLang]);

  const installSvgLabel = useMemo(() => {
    if (currentLang === 'en') return 'Install the App';
    if (currentLang === 'id') return 'Pasang Aplikasi';
    return 'Uygulamayi Indir';
  }, [currentLang]);

  const openSvgLabel = useMemo(() => {
    if (currentLang === 'en') return 'Open the App';
    if (currentLang === 'id') return 'Buka Aplikasi';
    return 'Uygulamayi Ac';
  }, [currentLang]);

  const installSvgFontSize = currentLang === 'en' ? 27 : 30;
  const openSvgFontSize = currentLang === 'en' ? 27 : 30;
  const youtubeSvgFontSize = currentLang === 'en' ? 34 : 40;
  const instagramSvgFontSize = currentLang === 'en' ? 34 : 40;

  const onLanguageChange = (event) => {
    const nextLang = normalizePageLang(event?.target?.value);
    persistManualLanguageChoice(nextLang);
    if (effectiveI18n && typeof effectiveI18n.changeLanguage === 'function') {
      void effectiveI18n.changeLanguage(nextLang);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    detectInstalledRelatedAppsAndMark()
      .then((marked) => {
        if (marked) setInstalled(true);
      })
      .catch(() => null);

    try {
      setDeferredPrompt((current) => current || window.__uniqahDeferredPrompt || current);
    } catch {
      // ignore
    }

    const onBeforeInstallPrompt = (event) => {
      try {
        event.preventDefault();
      } catch {
        // ignore
      }

      try {
        window.__uniqahDeferredPrompt = event;
      } catch {
        // ignore
      }

      setDeferredPrompt(event);
      setInstallStatus('');
    };

    const onAppInstalled = () => {
      markPwaInstalled();
      setInstalled(true);
      setDeferredPrompt(null);
      setInstallStatus('');

      try {
        window.__uniqahDeferredPrompt = null;
      } catch {
        // ignore
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (deferredPrompt || installed) return undefined;

    const syncPrompt = () => {
      const existing = readDeferredInstallPrompt();
      if (existing) {
        setDeferredPrompt((current) => current || existing);
      }
    };

    syncPrompt();

    const intervalId = window.setInterval(syncPrompt, 1200);
    window.addEventListener('focus', syncPrompt);
    window.addEventListener('pageshow', syncPrompt);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncPrompt);
      window.removeEventListener('pageshow', syncPrompt);
    };
  }, [deferredPrompt, installed]);

  const installSatisfied = installed;
  const installAvailable = !installSatisfied && !!deferredPrompt;
  const primaryActionIsOpenApp = !installSatisfied && !installAvailable && !isIosDevice && !isInAppBrowser && !isLocalDevMode;
  const primaryActionLabel = primaryActionIsOpenApp ? openSvgLabel : installSvgLabel;
  const primaryActionAriaLabel = primaryActionIsOpenApp ? tutorialUi.openApp : t('pwa.install.installButton');
  const primaryActionGradientId = primaryActionIsOpenApp ? 'gradPrimaryOpenApp' : 'gradDownloadInstall';
  const primaryActionGradientStart = primaryActionIsOpenApp ? '#4facfe' : '#ff5f6d';
  const primaryActionGradientEnd = primaryActionIsOpenApp ? '#3f5efb' : '#ff2e63';
  const primaryActionInnerFill = primaryActionIsOpenApp ? '#edf3ff' : '#f7edf1';
  const primaryActionInnerStroke = primaryActionIsOpenApp ? '#bfd0ff' : '#f3c1cf';
  const primaryActionAccent = primaryActionIsOpenApp ? '#3f5efb' : '#ff2e63';

  const openApp = () => {
    try {
      window.location.assign('/login');
    } catch {
      // ignore
    }
  };

  const openCurrentPageInExternalBrowser = () => {
    if (typeof window === 'undefined') return false;

    const targetUrl = String(window.location.href || '').trim();
    if (!targetUrl) return false;

    let attempted = false;

    if (isAndroidDevice) {
      try {
        const u = new URL(targetUrl);
        const fallbackUrl = encodeURIComponent(targetUrl);
        const path = `${u.pathname}${u.search}${u.hash}`;
        const intentUrl = `intent://${u.host}${path}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`;
        window.location.assign(intentUrl);
        attempted = true;
      } catch {
        // ignore
      }
    }

    if (!attempted) {
      try {
        const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer');
        if (popup) {
          popup.opener = null;
          attempted = true;
        }
      } catch {
        // ignore
      }
    }

    return attempted;
  };

  const copyInstallLink = async () => {
    const href = typeof window !== 'undefined' ? String(window.location.href || '').trim() : '';
    if (!href || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setInstallStatus(t('pwa.install.actions.copyFailed'));
      return false;
    }

    try {
      await navigator.clipboard.writeText(href);
      const hintKey = isIosDevice
        ? 'pwa.install.actions.copiedIos'
        : isAndroidDevice
          ? 'pwa.install.actions.copiedAndroid'
          : 'pwa.install.actions.copiedDesktop';
      setInstallStatus(t(hintKey));
      return true;
    } catch {
      setInstallStatus(t('pwa.install.actions.copyFailed'));
      return false;
    }
  };

  const openInstallInBrowser = async () => {
    setInstallStatus(t('authPage.infos.openingExternalBrowser'));
    const opened = openCurrentPageInExternalBrowser();
    if (!opened) {
      await copyInstallLink();
    }
  };

  const onInstall = async () => {
    if (installSatisfied) return;

    const availablePrompt = deferredPrompt || readDeferredInstallPrompt();

    if (isLocalDevMode && !availablePrompt) {
      setInstallStatus(t('pwa.install.actions.localDevNotInstallable'));
      return;
    }

    setInstallStatus('');

    let promptEvent = availablePrompt;

    if (!promptEvent) {
      setInstallStatus(t('pwa.install.actions.waitingForPrompt'));
      promptEvent = await waitForDeferredInstallPrompt(isInAppBrowser ? 600 : 1800);
      if (promptEvent) {
        setDeferredPrompt(promptEvent);
      }
    }

    if (!promptEvent || typeof promptEvent.prompt !== 'function') {
      if (isInAppBrowser) {
        await openInstallInBrowser();
        return;
      }

      if (isIosDevice) {
        setInstallStatus(
          `${t('pwa.install.ios.title')}\n1) ${t('pwa.install.ios.step1')}\n2) ${t('pwa.install.ios.step2')}\n3) ${t('pwa.install.ios.step3')}`
        );

        setTimeout(() => {
          try {
            iosHelpRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
          } catch {
            // ignore
          }
        }, 0);
      } else {
        setInstallStatus(t('pwa.install.installNotAvailableHint'));
      }
      return;
    }

    try {
      setInstallStatus('');
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === 'accepted') {
        markPwaInstalled();
        setInstalled(true);
      }
    } catch {
      // ignore
    } finally {
      setDeferredPrompt(null);
      try {
        if (typeof window !== 'undefined') window.__uniqahDeferredPrompt = null;
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e5f7f0_0%,#f8fbfb_32%,#eef3ff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end gap-4">
          <div className="hidden md:flex md:flex-col md:items-end md:gap-3">
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              <span>{t('navigation.language')}</span>
              <select
                value={currentLang}
                onChange={onLanguageChange}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none"
                aria-label={t('navigation.language')}
              >
                <option value="tr">{languageOptionLabels.tr}</option>
                <option value="en">{languageOptionLabels.en}</option>
                <option value="id">{languageOptionLabels.id}</option>
              </select>
            </label>

            <a href="/" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 md:inline-flex md:items-center md:gap-2">
              <Home size={16} />
              {tutorialUi.backHome}
            </a>
          </div>
        </div>

        <div className="mt-4 md:hidden">
          <label className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            <span>{t('navigation.language')}</span>
            <select
              value={currentLang}
              onChange={onLanguageChange}
              className="min-w-[170px] rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none"
              aria-label={t('navigation.language')}
            >
              <option value="tr">{languageOptionLabels.tr}</option>
              <option value="en">{languageOptionLabels.en}</option>
              <option value="id">{languageOptionLabels.id}</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-1 justify-center md:mt-6">
          <div className="w-full max-w-xl rounded-[30px] border border-slate-200 bg-white/90 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-6">
            {!installSatisfied ? (
              <>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">{tutorialUi.installEyebrow}</div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">{t('pwa.install.title')}</div>
                <div className="mt-3 text-sm leading-relaxed text-slate-600">{primaryActionIsOpenApp ? tutorialUi.readyBodyWeb : t('pwa.install.lead')}</div>

                <button
                  type="button"
                  onClick={primaryActionIsOpenApp ? openApp : onInstall}
                  className="mt-6 mx-auto block w-full max-w-[380px] rounded-[32px] bg-transparent text-left"
                  aria-label={primaryActionAriaLabel}
                >
                  <svg viewBox="0 0 560 130" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full drop-shadow-[0_18px_12px_rgba(0,0,0,0.30)]">
                    <style>{`
                      .download-btn { cursor: pointer; transition: all .25s ease; transform-origin: center; }
                      .download-btn:hover { transform: translateY(-3px) scale(1.02); filter: brightness(1.05); }
                    `}</style>

                    <defs>
                      <linearGradient id={primaryActionGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={primaryActionGradientStart} />
                        <stop offset="100%" stopColor={primaryActionGradientEnd} />
                      </linearGradient>
                    </defs>

                    <g className="download-btn">
                      <rect x="5" y="5" rx="65" width="550" height="120" fill={`url(#${primaryActionGradientId})`} />
                      <rect x="15" y="15" rx="55" width="530" height="100" fill={primaryActionInnerFill} opacity="0.98" stroke={primaryActionInnerStroke} strokeWidth="2" />

                      <g transform="translate(45,35)">
                        <rect width="60" height="60" rx="18" fill={primaryActionAccent} />
                        {primaryActionIsOpenApp ? (
                          <path
                            d="M20 30 L40 30 M32 22 L40 30 L32 38"
                            stroke="#ffffff"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        ) : (
                          <path
                            d="M30 18 L30 42 M22 34 L30 42 L38 34"
                            stroke="#ffffff"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </g>

                      <text x="320" y="72" fontSize={primaryActionIsOpenApp ? openSvgFontSize : installSvgFontSize} fontFamily="Arial" fill={primaryActionAccent} textAnchor="middle" fontWeight="bold">
                        {primaryActionLabel}
                      </text>
                    </g>
                  </svg>
                </button>

                {!installAvailable && isLocalDevMode ? (
                  <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-relaxed text-sky-900">
                    <div className="font-semibold text-sky-950">{t('pwa.install.actions.localDevTitle')}</div>
                    <div className="mt-1">{t('pwa.install.actions.localDevBody')}</div>
                  </div>
                ) : null}

                {!installAvailable && isInAppBrowser ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                    <div className="font-semibold text-amber-950">{t('pwa.install.actions.inAppBrowserTitle')}</div>
                    <div className="mt-1">{t('pwa.install.actions.inAppBrowserBody')}</div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={openInstallInBrowser}
                        className="flex flex-1 items-center justify-between rounded-2xl bg-amber-900 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-amber-950"
                      >
                        <span>{t('pwa.install.actions.openInBrowser')}</span>
                        <ArrowRight size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={copyInstallLink}
                        className="flex flex-1 items-center justify-between rounded-2xl border border-amber-300 bg-white px-4 py-3 text-left text-sm font-semibold text-amber-950 transition hover:bg-amber-100"
                      >
                        <span>{t('pwa.install.actions.copyLink')}</span>
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                ) : null}

                {installStatus ? (
                  <div className="mt-4 whitespace-pre-line rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">{installStatus}</div>
                ) : installAvailable ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">{t('pwa.install.installAvailableHint')}</div>
                ) : primaryActionIsOpenApp ? (
                  <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-relaxed text-sky-900">{tutorialUi.readyBodyWeb}</div>
                ) : isIosDevice ? (
                  <div ref={iosHelpRef} className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                    <div className="font-semibold text-slate-900">{t('pwa.install.ios.title')}</div>
                    <ol className="mt-2 list-decimal space-y-1 pl-5">
                      <li>{t('pwa.install.ios.step1')}</li>
                      <li>{t('pwa.install.ios.step2')}</li>
                      <li>{t('pwa.install.ios.step3')}</li>
                    </ol>

                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">{tutorialUi.readyEyebrow}</div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">{tutorialUi.readyTitle}</div>
                <div className="mt-3 text-sm leading-relaxed text-slate-600">{tutorialUi.readyBody}</div>

                <button
                  type="button"
                  onClick={openApp}
                  className="mt-6 mx-auto block w-full max-w-[380px] rounded-[32px] bg-transparent text-left"
                  aria-label={tutorialUi.openApp}
                >
                  <svg viewBox="0 0 560 130" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full drop-shadow-[0_18px_12px_rgba(0,0,0,0.30)]">
                    <style>{`
                      .open-btn { cursor: pointer; transition: all .25s ease; transform-origin: center; }
                      .open-btn:hover { transform: translateY(-3px) scale(1.02); filter: brightness(1.05); }
                    `}</style>

                    <defs>
                      <linearGradient id="gradOpenApp" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4facfe" />
                        <stop offset="100%" stopColor="#3f5efb" />
                      </linearGradient>
                    </defs>

                    <g className="open-btn">
                      <rect x="5" y="5" rx="65" width="550" height="120" fill="url(#gradOpenApp)" />
                      <rect x="15" y="15" rx="55" width="530" height="100" fill="#edf3ff" opacity="0.98" stroke="#bfd0ff" strokeWidth="2" />

                      <g transform="translate(45,35)">
                        <rect width="60" height="60" rx="18" fill="#3f5efb" />
                        <path
                          d="M20 30 L40 30 M32 22 L40 30 L32 38"
                          stroke="#ffffff"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>

                      <text x="320" y="72" fontSize={openSvgFontSize} fontFamily="Arial" fill="#3f5efb" textAnchor="middle" fontWeight="bold">
                        {openSvgLabel}
                      </text>
                    </g>
                  </svg>
                </button>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                  {isStandalone ? tutorialUi.standaloneHint : tutorialUi.browserHint}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-rose-200 bg-[linear-gradient(145deg,#fff7ed_0%,#fff1f2_100%)] shadow-sm md:p-0 lg:mt-8">
          <div className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-[#0f1720] p-2 md:h-52 md:p-3">
            <img
              src={youtubeBannerSrc}
              alt="Endonezya Kasifi YouTube channel banner"
              className="h-full w-full object-contain"
              loading="eager"
              decoding="async"
            />
          </div>

          <div className="p-4 md:p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">{trustUi.youtubeEyebrow}</div>
            <div className="mt-2 text-lg font-semibold leading-tight text-slate-950 md:text-xl">{trustUi.youtubeTitle}</div>
            <div className="mt-2 text-sm leading-relaxed text-slate-600">{trustUi.youtubeBody}</div>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white/90 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">YouTube</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{trustUi.youtubeSearchHint}</p>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <a
                href={YOUTUBE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Endonezya Kasifi YouTube channel"
                className="block w-full max-w-[340px]"
              >
                <svg viewBox="0 0 720 170" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full drop-shadow-[0_18px_12px_rgba(0,0,0,0.30)]">
                  <style>{`
                    .yt-btn { transition: all 0.25s ease; cursor: pointer; transform-origin: center; }
                    .yt-btn:hover { transform: translateY(-4px) scale(1.02); filter: brightness(1.08); }
                    .bell { transform-origin: 30px 40px; transition: transform 0.2s ease; }
                    .yt-btn:hover .bell { transform: rotate(-12deg); }
                    .ring { opacity: 0; transition: opacity 0.2s ease; }
                    .yt-btn:hover .ring { opacity: 1; }
                  `}</style>

                  <defs>
                    <linearGradient id="youtube-handle-button-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff4d4d" />
                      <stop offset="100%" stopColor="#cc0000" />
                    </linearGradient>
                  </defs>

                  <g className="yt-btn">
                    <rect x="5" y="5" rx="85" ry="85" width="710" height="160" fill="url(#youtube-handle-button-grad)" />
                    <rect x="15" y="15" rx="75" ry="75" width="690" height="140" fill="#ffffff" opacity="0.98" stroke="#efc0c0" strokeWidth="2" />

                    <g transform="translate(55,50)">
                      <rect width="110" height="70" rx="18" fill="#FF0000" />
                      <polygon points="42,18 42,52 75,35" fill="#ffffff" />
                    </g>

                    <text x="390" y="80" fontSize={youtubeSvgFontSize} fontFamily="Arial, sans-serif" fill="#cc0000" textAnchor="middle" fontWeight="bold">
                      {trustUi.youtubeButtonLabel}
                    </text>

                    <text x="390" y="120" fontSize="24" fontFamily="Arial, sans-serif" fill="#333" textAnchor="middle">
                      @endonezyakasifi
                    </text>

                    <g transform="translate(600,45)">
                      <path className="ring" d="M5 30 Q0 40 5 50" stroke="#cc0000" strokeWidth="3" fill="none" strokeLinecap="round" />
                      <path className="ring" d="M55 30 Q60 40 55 50" stroke="#cc0000" strokeWidth="3" fill="none" strokeLinecap="round" />

                      <g className="bell">
                        <circle cx="30" cy="10" r="6" fill="#cc0000" />
                        <path
                          d="M30 18 C18 18, 10 28, 10 42 L10 55 L50 55 L50 42 C50 28, 42 18, 30 18 Z"
                          fill="#cc0000"
                        />
                        <ellipse cx="30" cy="55" rx="22" ry="6" fill="#b80000" />
                        <circle cx="30" cy="62" r="5" fill="#cc0000" />
                      </g>
                    </g>
                  </g>
                </svg>
              </a>

              <a
                href={INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Endonezya Kasifi Instagram profile"
                className="block w-full max-w-[340px]"
              >
                <svg viewBox="0 0 720 170" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full drop-shadow-[0_18px_12px_rgba(0,0,0,0.30)]">
                  <style>{`
                    .ig-btn { transition: all 0.25s ease; cursor: pointer; transform-origin: center; }
                    .ig-btn:hover { transform: translateY(-4px) scale(1.02); filter: brightness(1.1); }
                    .ig-icon { transition: transform 0.3s ease; transform-origin: center; }
                    .ig-btn:hover .ig-icon { transform: scale(1.1) rotate(5deg); }
                  `}</style>

                  <defs>
                    <linearGradient id="instagram-button-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f58529" />
                      <stop offset="25%" stopColor="#dd2a7b" />
                      <stop offset="50%" stopColor="#8134af" />
                      <stop offset="75%" stopColor="#515bd4" />
                      <stop offset="100%" stopColor="#feda77" />
                    </linearGradient>
                  </defs>

                  <g className="ig-btn">
                    <rect x="5" y="5" rx="85" ry="85" width="710" height="160" fill="url(#instagram-button-grad)" />
                    <rect x="15" y="15" rx="75" ry="75" width="690" height="140" fill="#f7f1fb" opacity="0.97" stroke="#dac4f1" strokeWidth="2" />

                    <g className="ig-icon" transform="translate(55,45)">
                      <rect x="0" y="0" width="90" height="90" rx="25" fill="url(#instagram-button-grad)" />
                      <circle cx="45" cy="45" r="22" fill="none" stroke="#fff" strokeWidth="6" />
                      <circle cx="65" cy="25" r="6" fill="#fff" />
                    </g>

                    <text x="400" y="80" fontSize={instagramSvgFontSize} fontFamily="Arial, sans-serif" fill="#8134af" textAnchor="middle" fontWeight="bold">
                      {trustUi.instagramButtonLabel}
                    </text>

                    <text x="400" y="120" fontSize="24" fontFamily="Arial, sans-serif" fill="#333" textAnchor="middle">
                      @endonezyakasifi
                    </text>
                  </g>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[26px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur md:p-5">
          <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(145deg,#f8fafc_0%,#eff6ff_100%)] p-4 md:p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                <Info size={14} />
                <span>{trustUi.badge}</span>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700">{trustUi.companyBody}</p>

              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-start">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[18px] border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="flex h-[84px] items-center justify-center rounded-[16px] border border-slate-100 bg-slate-50 px-2 py-1 md:h-[92px]">
                      <img src={uniqahLogoSrc} alt="Uniqah" className="h-[58px] w-full max-w-full object-contain md:h-[66px]" loading="eager" decoding="async" />
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="flex h-[96px] items-center justify-center rounded-[16px] border border-slate-100 bg-slate-50 px-1 py-1 md:h-[108px]">
                      <img src={moonstarLogoSrc} alt="PT MoonStar Global Indonesia" className="h-[76px] w-full max-w-full object-contain md:h-[88px]" loading="eager" decoding="async" />
                    </div>
                  </div>
                </div>

                <div className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{trustUi.otherActivitiesTitle}</div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <a
                      href="https://endonezyakasifi.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-slate-900">{trustUi.travelTitle}</div>
                      <div className="mt-1 text-xs leading-relaxed text-slate-600">{trustUi.travelBody}</div>
                    </a>

                    <a
                      href="https://dameturk.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-slate-300 hover:bg-white"
                    >
                      <div className="text-sm font-semibold text-slate-900">{trustUi.iceCreamTitle}</div>
                      <div className="mt-1 text-xs leading-relaxed text-slate-600">{trustUi.iceCreamBody}</div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}