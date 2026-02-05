/* eslint-disable no-restricted-globals */

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import { firebaseConfig } from './config/firebasePublicConfig';

const BADGE_DB = 'uniqah_pwa';
const BADGE_STORE = 'kv';
const BADGE_KEY = 'badgeCount';

function openBadgeDb() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(BADGE_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(BADGE_STORE)) {
          db.createObjectStore(BADGE_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('idb_open_failed'));
    } catch (e) {
      reject(e);
    }
  });
}

async function badgeGetCount() {
  try {
    const db = await openBadgeDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(BADGE_STORE, 'readonly');
      const store = tx.objectStore(BADGE_STORE);
      const req = store.get(BADGE_KEY);
      req.onsuccess = () => {
        const v = req.result;
        const n = typeof v === 'number' ? v : Number(v);
        resolve(Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0);
      };
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}

async function badgeSetCount(count) {
  try {
    const db = await openBadgeDb();
    await new Promise((resolve) => {
      const tx = db.transaction(BADGE_STORE, 'readwrite');
      const store = tx.objectStore(BADGE_STORE);
      store.put(Math.max(0, Math.floor(count || 0)), BADGE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    });
  } catch {
    // ignore
  }
}

async function applyAppBadge(count) {
  try {
    // Badging API (Chrome/Edge). Not available on all OS/browsers.
    if (!self?.navigator || typeof self.navigator.setAppBadge !== 'function') return;
    const n = typeof count === 'number' && Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    if (n <= 0) {
      if (typeof self.navigator.clearAppBadge === 'function') {
        await self.navigator.clearAppBadge();
      }
      return;
    }
    await self.navigator.setAppBadge(n);
  } catch {
    // ignore
  }
}

async function incrementAppBadge() {
  const cur = await badgeGetCount();
  const next = cur + 1;
  await badgeSetCount(next);
  await applyAppBadge(next);
  return next;
}

async function resetAppBadge() {
  await badgeSetCount(0);
  await applyAppBadge(0);
}

cleanupOutdatedCaches();

// Yeni build gelince SW hemen aktifleşsin (PWA icon/title cache sorunlarını azaltır).
try {
  self.skipWaiting();
} catch {
  // ignore
}
try {
  clientsClaim();
} catch {
  // ignore
}

precacheAndRoute(self.__WB_MANIFEST);

// API çağrıları her zaman network'ten gelsin.
registerRoute(({ url }) => url.pathname.startsWith('/api/'), new NetworkOnly());

// Branding görselleri (logo vb.) deploy sonrası uzun süre eski kalmasın.
// Not: Genel image CacheFirst kuralı 7 gün cache tutuyor; /brand* için network öncelikli davranıyoruz.
registerRoute(
  ({ url, request }) => request.destination === 'image' && url.pathname.startsWith('/brand'),
  new NetworkFirst({
    cacheName: 'brand-images',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 24 * 60 * 60,
      }),
    ],
  })
);

// Büyük görselleri precache'e sokmuyoruz; runtime cache ile hızlandırıyoruz.
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

// Firebase Messaging (background push)
let messaging = null;
try {
  const fbApp = initializeApp(firebaseConfig);
  messaging = getMessaging(fbApp);
} catch {
  messaging = null;
}

if (messaging) {
  onBackgroundMessage(messaging, (payload) => {
    const title = String(payload?.notification?.title || payload?.data?.title || 'Bildirim');
    const body = String(payload?.notification?.body || payload?.data?.body || '');

    const clickUrl = String(payload?.fcmOptions?.link || payload?.data?.url || '/profilim');

    const options = {
      body,
      icon: '/pwa-192x192.png?v=20260201-2',
      badge: '/pwa-64x64.png?v=20260201-2',
      data: { url: clickUrl },
    };

    // Best-effort: increment persistent app badge so the user can notice missed toasts.
    try {
      incrementAppBadge();
    } catch {
      // ignore
    }

    self.registration.showNotification(title, options);
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event?.notification?.data?.url || '/profilim';

  // User interacted with a notification -> clear badge.
  try {
    event.waitUntil(resetAppBadge());
  } catch {
    // ignore
  }

  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        try {
          if ('focus' in client) {
            await client.focus();
            if ('navigate' in client) await client.navigate(url);
            return;
          }
        } catch {
          // ignore
        }
      }
      try {
        await clients.openWindow(url);
      } catch {
        // ignore
      }
    })()
  );
});

// Allow the app UI to reset the badge (e.g. when user opens the app).
self.addEventListener('message', (event) => {
  const data = event?.data || {};
  if (!data || typeof data !== 'object') return;
  if (data.type === 'badge_reset') {
    try {
      event.waitUntil(resetAppBadge());
    } catch {
      // ignore
    }
  }
});
