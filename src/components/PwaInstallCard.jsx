import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Download, Info } from 'lucide-react';
import { enablePushForCurrentUser, hasSavedPushToken, sendTestPushToMe } from '../utils/pushNotifications';
import { firebaseWebPushVapidKey } from '../config/firebasePublicConfig';

function isIos() {
  if (typeof navigator === 'undefined') return false;
  const ua = String(navigator.userAgent || '').toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

function isInstalled() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  } catch {
    // ignore
  }
  try {
    // iOS Safari
    if (typeof navigator !== 'undefined' && navigator.standalone) return true;
  } catch {
    // ignore
  }
  return false;
}

export default function PwaInstallCard({ variant = 'light', flat = false }) {
  const { t } = useTranslation();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isInstalled());
  const [notifyStatus, setNotifyStatus] = useState('');
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
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

    const onBeforeInstallPrompt = (e) => {
      try {
        e.preventDefault();
      } catch {
        // ignore
      }
      setDeferredPrompt(e);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
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

  const primaryBtnClass = isDark
    ? 'inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 px-4 py-2 text-sm font-semibold hover:brightness-110 transition disabled:opacity-60'
    : 'inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-60';

  const secondaryBtnClass = isDark
    ? 'inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 text-white/90 px-4 py-2 text-sm font-semibold hover:bg-white/[0.10] transition disabled:opacity-60'
    : 'inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-60';

  const installAvailable = !installed && !!deferredPrompt;

  const onInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      // accepted/dismissed
      if (choice && choice.outcome === 'accepted') {
        setInstalled(true);
      }
    } catch {
      // noop
    } finally {
      setDeferredPrompt(null);
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

  const onSendTestNotification = async () => {
    if (testBusy) return;
    setTestBusy(true);
    setNotifyStatus('');
    try {
      await sendTestPushToMe({
        title: t('pwa.install.notifications.testTitle'),
        body: t('pwa.install.notifications.testBody'),
        url: '/profilim',
      });
      setNotifyStatus(t('pwa.install.notifications.testSent'));
    } catch (e) {
      const msg = String(e?.message || '').trim();
      if (msg === 'not_authenticated') {
        setNotifyStatus(t('pwa.install.notifications.notLoggedIn'));
      } else if (msg === 'no_tokens') {
        setNotifyStatus(t('pwa.install.notifications.testNoTokens'));
      } else if (msg.startsWith('firebase_admin_') || msg === 'firebase_admin_init_failed') {
        setNotifyStatus(t('pwa.install.notifications.missingSetup'));
      } else {
        const base = t('pwa.install.notifications.testFailed');
        setNotifyStatus(debugPush && msg ? `${base} (error=${msg})` : base);
      }
    } finally {
      setTestBusy(false);
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
    <section className={cardClass}>
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
          disabled={!installAvailable}
          className={primaryBtnClass}
          title={installAvailable ? '' : t('pwa.install.installNotAvailableHint')}
        >
          <Download size={18} />
          {installed ? t('pwa.install.installed') : t('pwa.install.installButton')}
        </button>

        <button type="button" onClick={onEnableNotifications} className={secondaryBtnClass} disabled={notifyBusy}>
          <Bell size={18} />
          {notifyBusy ? t('studio.common.processing') : t('pwa.install.notifications.button')}
        </button>

        <button
          type="button"
          onClick={onSendTestNotification}
          className={secondaryBtnClass}
          disabled={testBusy || (!pushEnabled && notificationPermission !== 'granted')}
          title={pushEnabled || notificationPermission === 'granted' ? '' : t('pwa.install.notifications.testHint')}
        >
          <Bell size={18} />
          {testBusy ? t('studio.common.processing') : t('pwa.install.notifications.testButton')}
        </button>
      </div>

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
        <div className={`mt-3 text-xs ${subtleClass}`}>
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
