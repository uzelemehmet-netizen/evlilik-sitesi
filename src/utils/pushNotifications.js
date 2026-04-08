import app from '../config/firebaseApp';
import { authFetch } from './authFetch';
import { firebaseWebPushVapidKey } from '../config/firebasePublicConfig';

const DEFAULT_PUSH_ICON = '/pwa-192x192.png?v=20260224-1';
const DEFAULT_PUSH_BADGE = '/pwa-64x64.png?v=20260224-1';
const PUSH_SERVICE_WORKER_URL = import.meta.env.DEV ? '/dev-push-sw.js' : '/pwa-sw.js';

function canUseNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
  ]);
}

const PUSH_TOKEN_STORAGE_KEY = 'pushToken';

function persistPushToken(token) {
  try {
    if (!token) return;
    localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, String(token));
  } catch {
    // ignore
  }
}

function readPersistedPushToken() {
  try {
    const t = String(localStorage.getItem(PUSH_TOKEN_STORAGE_KEY) || '').trim();
    return t || '';
  } catch {
    return '';
  }
}

export function hasSavedPushToken() {
  return !!readPersistedPushToken();
}

export async function enablePushForCurrentUser() {
  if (!canUseNotifications()) {
    return { ok: false, code: 'not_supported' };
  }

  // Push + service worker çoğu tarayıcıda güvenli context (HTTPS/localhost) ister.
  try {
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      return { ok: false, code: 'not_secure_context' };
    }
  } catch {
    // ignore
  }

  if (!firebaseWebPushVapidKey) {
    return { ok: false, code: 'missing_vapid_key' };
  }

  let permission = 'default';
  try {
    permission = await withTimeout(Notification.requestPermission(), 15000);
  } catch {
    return { ok: false, code: 'permission_timeout' };
  }

  if (permission !== 'granted') {
    return { ok: false, code: 'permission_denied' };
  }

  let isSupported;
  let getMessaging;
  let getToken;
  try {
    ({ isSupported, getMessaging, getToken } = await withTimeout(import('firebase/messaging'), 15000));
  } catch {
    return { ok: false, code: 'messaging_load_timeout' };
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return { ok: false, code: 'messaging_not_supported' };
  }

  let registration;
  try {
    // Eğer SW henüz register edilmediyse (özellikle ilk yükleme / yavaş ağ), hazır olmayı beklemek boşa gidebilir.
    registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      try {
        registration = await navigator.serviceWorker.register(
          PUSH_SERVICE_WORKER_URL,
          import.meta.env.DEV ? undefined : { type: 'module' }
        );
      } catch {
        // ignore; aşağıda ready beklerken tekrar deneyeceğiz.
      }
    }

    // `ready` bazen ilk kurulumda (cache/workbox) daha uzun sürebilir.
    registration = await withTimeout(navigator.serviceWorker.ready, 20000);
  } catch {
    return { ok: false, code: 'service_worker_not_ready' };
  }

  const messaging = getMessaging(app);
  let token = '';
  try {
    token = await withTimeout(
      getToken(messaging, {
        vapidKey: firebaseWebPushVapidKey,
        serviceWorkerRegistration: registration,
      }),
      20000
    );
  } catch (e) {
    if (String(e?.message || '').trim() === 'timeout') return { ok: false, code: 'token_timeout' };

    const code = String(e?.code || '').trim();
    const message = String(e?.message || '').trim();

    if (code === 'messaging/unsupported-browser') return { ok: false, code: 'messaging_not_supported' };
    if (code === 'messaging/permission-blocked') return { ok: false, code: 'permission_denied' };
    if (code === 'messaging/invalid-vapid-key') return { ok: false, code: 'invalid_vapid_key' };
    if (code === 'messaging/failed-service-worker-registration') return { ok: false, code: 'service_worker_not_ready' };
    if (/vapid/i.test(message) && /invalid|missing/i.test(message)) return { ok: false, code: 'missing_vapid_key' };

    return { ok: false, code: 'token_failed' };
  }

  if (!token) {
    return { ok: false, code: 'no_token' };
  }

  persistPushToken(token);

  // If permission is granted during an active session, start foreground handling immediately.
  await startForegroundPushListener().catch(() => null);

  try {
    await withTimeout(
      authFetch('/api/push-token-upsert', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      }),
      12000
    );
    return { ok: true, code: 'enabled', token, serverSync: true };
  } catch (e) {
    const msg = String(e?.message || '').trim();
    // Token is created and permission is granted, but server sync failed.
    // Keep UX stable (do not mark as disabled) and let the UI show a clearer message.
    return { ok: true, code: 'enabled', token, serverSync: false, serverError: msg || 'server_sync_failed' };
  }
}

export async function sendTestPushToMe({ title, body, url } = {}) {
  try {
    return await authFetch('/api/push-send-test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, body, url }),
    });
  } catch (e) {
    const msg = String(e?.message || '').trim();

    // Edge-case: permission granted but server has no token recorded (cache/first-run/old SW).
    // If we have a persisted token, re-upsert and retry once.
    if (msg === 'no_tokens') {
      const token = readPersistedPushToken();
      if (token) {
        await authFetch('/api/push-token-upsert', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        return await authFetch('/api/push-send-test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title, body, url }),
        });
      }

      // If we don't have a persisted token (e.g. storage cleared), try to re-enable push.
      const enabled = await enablePushForCurrentUser().catch(() => null);
      if (enabled?.ok) {
        return await authFetch('/api/push-send-test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ title, body, url }),
        });
      }
    }

    throw e;
  }
}

let foregroundUnsubscribe = null;

export async function startForegroundPushListener() {
  if (foregroundUnsubscribe) return { ok: true, already: true };

  if (typeof window === 'undefined') return { ok: false, code: 'not_browser' };
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return { ok: false, code: 'not_supported' };

  let permission = 'default';
  try {
    permission = String(Notification.permission || 'default');
  } catch {
    permission = 'default';
  }
  if (permission !== 'granted') return { ok: false, code: 'permission_not_granted' };

  const { isSupported, getMessaging, onMessage } = await import('firebase/messaging');
  const supported = await isSupported().catch(() => false);
  if (!supported) return { ok: false, code: 'messaging_not_supported' };

  const messaging = getMessaging(app);

  const show = async ({ title, body, url } = {}) => {
    const cleanTitle = String(title || 'Bildirim').trim() || 'Bildirim';
    const cleanBody = String(body || '').trim();
    const clickUrl = String(url || '/profilim').trim() || '/profilim';

    const options = {
      body: cleanBody,
      icon: DEFAULT_PUSH_ICON,
      badge: DEFAULT_PUSH_BADGE,
      data: { url: clickUrl },
    };

    // Prefer SW notifications so click behavior is consistent.
    try {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      if (reg?.showNotification) {
        await reg.showNotification(cleanTitle, options);
        return;
      }
    } catch {
      // fallback below
    }

    try {
      const n = new Notification(cleanTitle, options);
      n.onclick = () => {
        try {
          window.focus();
        } catch {
          // ignore
        }
        try {
          window.location.assign(clickUrl);
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
  };

  foregroundUnsubscribe = onMessage(messaging, (payload) => {
    try {
      const title = String(payload?.notification?.title || payload?.data?.title || 'Bildirim');
      const body = String(payload?.notification?.body || payload?.data?.body || '');
      const url = String(payload?.fcmOptions?.link || payload?.data?.url || '/profilim');
      show({ title, body, url });
    } catch {
      // ignore
    }
  });

  return { ok: true };
}

export function stopForegroundPushListener() {
  try {
    if (typeof foregroundUnsubscribe === 'function') foregroundUnsubscribe();
  } catch {
    // ignore
  } finally {
    foregroundUnsubscribe = null;
  }
}
