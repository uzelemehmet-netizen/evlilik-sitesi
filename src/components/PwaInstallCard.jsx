import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Download, Info } from 'lucide-react';
import { enablePushForCurrentUser, hasSavedPushToken } from '../utils/pushNotifications';
import { firebaseWebPushVapidKey } from '../config/firebasePublicConfig';
import { detectInstalledRelatedAppsAndMark, isPwaInstalled, markPwaInstalled } from '../utils/pwaInstalled';

function isIos() {
  if (typeof navigator === 'undefined') return false;
  const ua = String(navigator.userAgent || '').toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export default function PwaInstallCard({ variant = 'light', flat = false }) {
  const { t } = useTranslation();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isPwaInstalled());
  const [installStatus, setInstallStatus] = useState('');
  const iosHelpRef = useRef(null);
  const [notifyStatus, setNotifyStatus] = useState('');
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const canBrowserNotify = useMemo(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  }, []);

  const notificationPermission = useMemo(() => {
    if (!canBrowserNotify) return 'unsupported';
    try {
      return String(Notification.permission || 'default');
    } catch {
      return 'default';
    }
  }, [canBrowserNotify]);

  const debugPush = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      return new URLSearchParams(window.location.search).get('debugPush') === '1';
    } catch {
      return false;
    }
  }, []);

  const vapidKeyLen = useMemo(() => {
    return typeof firebaseWebPushVapidKey === 'string' ? firebaseWebPushVapidKey.trim().length : 0;
  }, []);

  const isIosDevice = useMemo(() => isIos(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Best-effort: if the browser can tell us an app is installed, persist it.
    // (Helps avoid re-showing install nudges when user later opens in the browser.)
    detectInstalledRelatedAppsAndMark()
      .then((marked) => {
        if (marked) setInstalled(true);
      })
      .catch(() => null);

    // Eğer prompt başka bir sayfada yakalandıysa (örn. /panel), burada tekrar kullan.
    try {
      if (!deferredPrompt && window.__uniqahDeferredPrompt) {
        setDeferredPrompt(window.__uniqahDeferredPrompt);
      }
    } catch {
      // ignore
    }

    const onBeforeInstallPrompt = (e) => {
      try {
        e.preventDefault();
      } catch {
        // ignore
      }

      // Expose for tutorial CTA (best-effort)
      try {
        window.__uniqahDeferredPrompt = e;
      } catch {
        // ignore
      }
      setDeferredPrompt(e);
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

  const isDark = variant === 'dark';

  const cardClass = isDark
    ? 'rounded-2xl border border-white/10 bg-white/5 p-5'
    : flat
      ? 'rounded-xl border border-slate-200 bg-white p-5'
      : 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm';

  const titleClass = isDark ? 'text-white' : 'text-slate-900';
  const textClass = isDark ? 'text-white/70' : 'text-slate-600';
  const subtleClass = isDark ? 'text-white/60' : 'text-slate-500';

  const darkRingOffset = isDark ? 'ring-offset-slate-950' : '';
  const installBtnClass = `app-btn app-btn-primary w-full sm:w-auto ${darkRingOffset}`.trim();
  const enableNotifyBtnClass = `app-btn app-btn-primary w-full sm:w-auto ${darkRingOffset}`.trim();

  const installAvailable = !installed && !!deferredPrompt;

  const onInstall = async () => {
    if (installed) return;

    const dp = deferredPrompt;
    if (!dp || typeof dp.prompt !== 'function') {
      if (isIosDevice) {
        setInstallStatus(
          `${t('pwa.install.ios.title')}\n1) ${t('pwa.install.ios.step1')}\n2) ${t('pwa.install.ios.step2')}\n3) ${t('pwa.install.ios.step3')}`
        );

        // iOS talimatları zaten kartta görünüyor; butona basınca otomatik olarak oraya kaydır.
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
      await dp.prompt();
      const choice = await dp.userChoice;
      // accepted/dismissed
      if (choice && choice.outcome === 'accepted') {
        markPwaInstalled();
        setInstalled(true);
      }
    } catch {
      // noop
    } finally {
      setDeferredPrompt(null);
      try {
        if (typeof window !== 'undefined') window.__uniqahDeferredPrompt = null;
      } catch {
        // ignore
      }
    }
  };

  const onEnableNotifications = async () => {
    if (notifyBusy) return;
    setNotifyBusy(true);
    setNotifyStatus('');

    try {
      // If the user already granted permission and we still have a token, don't re-run the
      // full enable flow (it can fail due to network/CSP and cause confusing UX).
      try {
        if (Notification?.permission === 'granted' && hasSavedPushToken()) {
          setPushEnabled(true);
          setNotifyStatus(t('pwa.install.notifications.alreadyEnabled'));
          return;
        }
      } catch {
        // ignore
      }

      const result = await enablePushForCurrentUser();
      if (result?.ok) {
        setPushEnabled(true);
        if (result?.serverSync === false) {
          setNotifyStatus(t('pwa.install.notifications.enabledButNotSaved'));
        } else {
          setNotifyStatus(t('pwa.install.notifications.enabled'));
        }
        return;
      }

      setPushEnabled(false);
      switch (result?.code) {
        case 'not_supported':
        case 'messaging_not_supported':
          setNotifyStatus(t('pwa.install.notifications.notSupported'));
          break;
        case 'not_secure_context':
          setNotifyStatus(t('pwa.install.notifications.notSecureContext'));
          break;
        case 'service_worker_not_ready':
          setNotifyStatus(t('pwa.install.notifications.serviceWorkerNotReady'));
          break;
        case 'missing_vapid_key':
          setNotifyStatus(t('pwa.install.notifications.missingSetup'));
          break;
        case 'invalid_vapid_key':
          setNotifyStatus(t('pwa.install.notifications.invalidVapidKey'));
          break;
        case 'permission_denied':
          setNotifyStatus(t('pwa.install.notifications.denied'));
          break;
        case 'token_failed':
          setNotifyStatus(t('pwa.install.notifications.error'));
          break;
        default:
          setNotifyStatus(t('pwa.install.notifications.error'));
          break;
      }
    } catch (e) {
      // If permission is granted, keep UX consistent even if something failed.
      const msg = String(e?.message || '').trim();
      let permission = 'default';
      try {
        permission = Notification?.permission || 'default';
      } catch {
        // ignore
      }
      if (permission === 'granted') {
        setPushEnabled(true);
        setNotifyStatus(t('pwa.install.notifications.enabledButNotSaved'));
      } else {
        setPushEnabled(false);
        if (msg === 'not_authenticated') {
          setNotifyStatus(t('pwa.install.notifications.notLoggedIn'));
        } else {
          setNotifyStatus(t('pwa.install.notifications.error'));
        }
      }
    } finally {
      setNotifyBusy(false);
    }
  };

  // If the user already granted permission and we have a saved token, mark as enabled for UX.
  useEffect(() => {
    if (notificationPermission !== 'granted') return;
    try {
      if (hasSavedPushToken()) setPushEnabled(true);
    } catch {
      // ignore
    }
  }, [notificationPermission]);

  return (
    <section className={cardClass} data-tutorial-id="pwa-install-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className={`text-base font-semibold ${titleClass}`}>{t('pwa.install.title')}</h2>
          <p className={`mt-1 text-sm leading-relaxed ${textClass}`}>{t('pwa.install.lead')}</p>
        </div>
        <div className={subtleClass}>
          <Info className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onInstall}
          disabled={installed}
          className={installBtnClass}
          title={installAvailable ? '' : t('pwa.install.installNotAvailableHint')}
        >
          <Download size={18} />
          {installed ? t('pwa.install.installed') : t('pwa.install.installButton')}
        </button>

        <button type="button" onClick={onEnableNotifications} className={enableNotifyBtnClass} disabled={notifyBusy}>
          <Bell size={18} />
          {notifyBusy ? t('studio.common.processing') : t('pwa.install.notifications.button')}
        </button>
      </div>

      {installStatus ? (
        <p className={`mt-3 text-xs whitespace-pre-line ${subtleClass}`}>{installStatus}</p>
      ) : null}

      {notifyStatus ? (
        <p className={`mt-3 text-xs ${subtleClass}`}>{notifyStatus}</p>
      ) : notificationPermission === 'granted' ? (
        <p className={`mt-3 text-xs ${subtleClass}`}>{t('pwa.install.notifications.alreadyEnabled')}</p>
      ) : null}

      {debugPush ? (
        <p className={`mt-2 text-[11px] ${subtleClass}`}>
          debugPush=1 • secureContext={String(typeof window !== 'undefined' && window.isSecureContext)} • vapidKeyLen={vapidKeyLen}
        </p>
      ) : null}

      {installed ? (
        <p className={`mt-3 text-xs ${subtleClass}`}>{t('pwa.install.installedHint')}</p>
      ) : installAvailable ? (
        <p className={`mt-3 text-xs ${subtleClass}`}>{t('pwa.install.installAvailableHint')}</p>
      ) : isIosDevice ? (
        <div ref={iosHelpRef} className={`mt-3 text-xs ${subtleClass}`}>
          <p className="font-semibold">{t('pwa.install.ios.title')}</p>
          <ol className="mt-1 list-decimal pl-5 space-y-1">
            <li>{t('pwa.install.ios.step1')}</li>
            <li>{t('pwa.install.ios.step2')}</li>
            <li>{t('pwa.install.ios.step3')}</li>
          </ol>
        </div>
      ) : (
        <p className={`mt-3 text-xs ${subtleClass}`}>{t('pwa.install.installNotAvailableHint')}</p>
      )}

      <div className={`mt-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200 bg-slate-50'} p-4`}>
        <p className={`text-xs font-semibold ${titleClass}`}>{t('pwa.install.notifications.title')}</p>
        <p className={`mt-1 text-xs ${textClass}`}>{t('pwa.install.notifications.lead')}</p>
        <ul className={`mt-2 list-disc pl-5 space-y-1 text-xs ${textClass}`}>
          <li>{t('pwa.install.notifications.items.newMessage')}</li>
          <li>{t('pwa.install.notifications.items.newLike')}</li>
          <li>{t('pwa.install.notifications.items.profileAccess')}</li>
          <li>{t('pwa.install.notifications.items.shortMessage')}</li>
          <li>{t('pwa.install.notifications.items.activeMatch')}</li>
          <li>{t('pwa.install.notifications.items.poolCandidates')}</li>
        </ul>
        <p className={`mt-2 text-[11px] ${subtleClass}`}>{t('pwa.install.notifications.note')}</p>
      </div>
    </section>
  );
}
