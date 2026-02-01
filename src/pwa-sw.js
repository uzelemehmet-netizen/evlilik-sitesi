/* eslint-disable no-restricted-globals */

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import { firebaseConfig } from './config/firebasePublicConfig';

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

    self.registration.showNotification(title, options);
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event?.notification?.data?.url || '/profilim';

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
