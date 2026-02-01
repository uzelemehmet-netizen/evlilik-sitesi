import app from '../config/firebase';
import { authFetch } from './authFetch';
import { firebaseWebPushVapidKey } from '../config/firebasePublicConfig';

function canUseNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
  ]);
}

export async function enablePushForCurrentUser() {
  if (!canUseNotifications()) {
    return { ok: false, code: 'not_supported' };
  }

  if (!firebaseWebPushVapidKey) {
    return { ok: false, code: 'missing_vapid_key' };
  }

  let permission = 'default';
  try {
    permission = await Notification.requestPermission();
  } catch {
    permission = 'denied';
  }

  if (permission !== 'granted') {
    return { ok: false, code: 'permission_denied' };
  }

  const { isSupported, getMessaging, getToken } = await import('firebase/messaging');

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return { ok: false, code: 'messaging_not_supported' };
  }

  let registration;
  try {
    registration = await withTimeout(navigator.serviceWorker.ready, 8000);
  } catch {
    return { ok: false, code: 'service_worker_not_ready' };
  }

  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: firebaseWebPushVapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    return { ok: false, code: 'no_token' };
  }

  await authFetch('/api/push-token-upsert', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  return { ok: true, code: 'enabled', token };
}

export async function sendTestPushToMe({ title, body, url } = {}) {
  return await authFetch('/api/push-send-test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title, body, url }),
  });
}
