import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Copy, Download, Home, Info, Smartphone } from 'lucide-react';
import { detectInstalledRelatedAppsAndMark, isPwaInstalled, isRunningAsPwa, markPwaInstalled } from '../utils/pwaInstalled.js';
import { getClientCountry, getSupportCountrySync } from '../utils/supportLine.js';

function normalizePageLang(raw) {
  const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'in') return 'id';
  if (base === 'tr' || base === 'en' || base === 'id') return base;
  return 'tr';
}

function hasExplicitQueryLanguage() {
  if (typeof window === 'undefined') return false;

  try {
    const url = new URL(window.location.href);
    const qsLang = String(url.searchParams.get('lang') || '').trim().toLowerCase();
    if (qsLang) return true;
  } catch {
    // ignore
  }

  return false;
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

function persistInstallRouteLanguage(lang) {
  const normalized = normalizePageLang(lang);

  try {
    localStorage.setItem('preferred_lang', normalized);
    localStorage.setItem('preferred_lang_source', 'country');
  } catch {
    // ignore
  }

  try {
    sessionStorage.setItem('preferred_lang', normalized);
    sessionStorage.setItem('preferred_lang_source', 'country');
  } catch {
    // ignore
  }
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
  const iosHelpRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isPwaInstalled());
  const [installStatus, setInstallStatus] = useState('');
  const [continueOnWeb, setContinueOnWeb] = useState(false);

  const isIosDevice = useMemo(() => isIos(), []);
  const isAndroidDevice = useMemo(() => isAndroid(), []);
  const inAppBrowserHint = useMemo(() => getInAppBrowserHint(), []);
  const isInAppBrowser = !!inAppBrowserHint;
  const isStandalone = useMemo(() => isRunningAsPwa(), []);
  const isLocalDevMode = import.meta.env.DEV;
  const currentLang = useMemo(() => normalizePageLang(i18n?.language), [i18n?.language]);

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
    continueOnWeb: tx('pwa.tutorial.continueOnWeb', 'Web sayfasından devam et'),
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

  useEffect(() => {
    if (hasExplicitQueryLanguage()) return undefined;
    if (hasManualLanguageSelection()) return undefined;

    const currentBaseLang = normalizePageLang(i18n?.language);
    if (currentBaseLang === 'id') return undefined;

    const syncCountry = String(getSupportCountrySync({ lang: '' }) || '').trim().toUpperCase();
    if (syncCountry === 'ID') {
      persistInstallRouteLanguage('id');
      void i18n.changeLanguage('id');
      return undefined;
    }

    let cancelled = false;

    Promise.resolve(getClientCountry())
      .then((country) => {
        if (cancelled) return;
        if (hasManualLanguageSelection()) return;
        if (String(country || '').trim().toUpperCase() !== 'ID') return;
        persistInstallRouteLanguage('id');
        void i18n.changeLanguage('id');
      })
      .catch(() => {
        // ignore
      });

    return () => {
      cancelled = true;
    };
  }, [i18n]);

  const onLanguageChange = (event) => {
    const nextLang = normalizePageLang(event?.target?.value);
    persistManualLanguageChoice(nextLang);
    void i18n.changeLanguage(nextLang);
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

  const installSatisfied = installed || continueOnWeb;
  const installAvailable = !installSatisfied && !!deferredPrompt;
  const canOpenApp = installSatisfied;

  const openApp = () => {
    try {
      window.location.assign('/app/welcome');
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

  const onContinueOnWeb = () => {
    setContinueOnWeb(true);
    setInstallStatus('');
  };

  const onInstall = async () => {
    if (installSatisfied) return;

    if (isLocalDevMode) {
      setInstallStatus(t('pwa.install.actions.localDevNotInstallable'));
      return;
    }

    setInstallStatus('');

    let promptEvent = deferredPrompt || readDeferredInstallPrompt();

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

  const steps = [
    {
      icon: Download,
      title: tutorialUi.steps.install.title,
      body: tutorialUi.steps.install.body,
      complete: installSatisfied,
      active: !installSatisfied,
    },
    {
      icon: Smartphone,
      title: tutorialUi.steps.open.title,
      body: tutorialUi.steps.open.body,
      complete: canOpenApp,
      active: installSatisfied,
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e5f7f0_0%,#f8fbfb_32%,#eef3ff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700/80">{tutorialUi.eyebrow}</div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">{tutorialUi.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">{tutorialUi.body}</p>
          </div>
          <div className="hidden md:flex md:flex-col md:items-end md:gap-3">
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              <span>{t('navigation.language')}</span>
              <select
                value={currentLang}
                onChange={onLanguageChange}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 outline-none"
                aria-label={t('navigation.language')}
              >
                <option value="tr">Turkce</option>
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
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
              <option value="tr">Turkce</option>
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </label>
        </div>

        <div className="mt-8 grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
          <div className="rounded-[30px] border border-white/70 bg-[linear-gradient(145deg,#072c33_0%,#0d3e4f_48%,#0f172a_100%)] p-6 text-white shadow-[0_38px_100px_rgba(15,23,42,0.24)] md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
              <Info size={14} />
              <span>{tutorialUi.badge}</span>
            </div>

            <div className="mt-6 space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const stateClass = step.complete
                  ? 'border-emerald-300/25 bg-emerald-300/12'
                  : step.active
                    ? 'border-white/20 bg-white/12'
                    : 'border-white/10 bg-slate-950/18';

                return (
                  <div key={step.title} className={`rounded-[24px] border p-4 shadow-[0_18px_40px_rgba(2,6,23,0.16)] ${stateClass}`}>
                    <div className="flex items-start gap-4">
                      <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${step.complete ? 'bg-emerald-300/20 text-emerald-100' : 'bg-white/12 text-white'}`}>
                        {step.complete ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">{tutorialUi.stepLabel(index + 1)}</div>
                        <div className="mt-1 text-lg font-semibold text-white">{step.title}</div>
                        <div className="mt-2 text-sm leading-relaxed text-white/74">{step.body}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-white/12 bg-white/8 p-4 text-sm leading-relaxed text-white/72">
              {tutorialUi.note}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white/90 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-6">
            {!installSatisfied ? (
              <>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">{tutorialUi.installEyebrow}</div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">{t('pwa.install.title')}</div>
                <div className="mt-3 text-sm leading-relaxed text-slate-600">{t('pwa.install.lead')}</div>

                <button
                  type="button"
                  onClick={onInstall}
                  className="mt-6 flex w-full items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-left text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition hover:bg-slate-900"
                >
                  <span>
                    {installed
                      ? t('pwa.install.installed')
                      : !installAvailable && isLocalDevMode
                        ? t('pwa.install.actions.localDevButton')
                      : !installAvailable && isInAppBrowser
                        ? t('pwa.install.actions.openInBrowser')
                        : t('pwa.install.installButton')}
                  </span>
                  <ArrowRight size={18} />
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
                ) : isIosDevice ? (
                  <div ref={iosHelpRef} className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                    <div className="font-semibold text-slate-900">{t('pwa.install.ios.title')}</div>
                    <ol className="mt-2 list-decimal space-y-1 pl-5">
                      <li>{t('pwa.install.ios.step1')}</li>
                      <li>{t('pwa.install.ios.step2')}</li>
                      <li>{t('pwa.install.ios.step3')}</li>
                    </ol>

                    <button
                      type="button"
                      onClick={onContinueOnWeb}
                      className="mt-4 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                      <span>{tutorialUi.continueOnWeb}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ) : null}

                {!installed ? (
                  <button
                    type="button"
                    onClick={onContinueOnWeb}
                    className="mt-4 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    <span>{tutorialUi.continueOnWeb}</span>
                    <ArrowRight size={16} />
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">{tutorialUi.readyEyebrow}</div>
                <div className="mt-3 text-2xl font-semibold text-slate-950">{tutorialUi.readyTitle}</div>
                <div className="mt-3 text-sm leading-relaxed text-slate-600">{continueOnWeb ? tutorialUi.readyBodyWeb : tutorialUi.readyBody}</div>

                <button
                  type="button"
                  onClick={openApp}
                  className="mt-6 flex w-full items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-left text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition hover:bg-slate-900"
                >
                  <span>{tutorialUi.openApp}</span>
                  <ArrowRight size={18} />
                </button>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                  {isStandalone ? tutorialUi.standaloneHint : tutorialUi.browserHint}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}