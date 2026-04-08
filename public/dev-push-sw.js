async function broadcastPushDebugNotification({ title, body, url }) {
  try {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      try {
        client.postMessage({
          type: 'push-debug-notification',
          title: String(title || ''),
          body: String(body || ''),
          url: String(url || ''),
        });
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

self.addEventListener('install', (event) => {
  try {
    self.skipWaiting();
  } catch {
    // ignore
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
      } catch {
        // ignore
      }
    })()
  );
});

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let payload = {};
      try {
        payload = event?.data?.json?.() || {};
      } catch {
        try {
          payload = { data: { body: String(event?.data?.text?.() || '') } };
        } catch {
          payload = {};
        }
      }

      const title = String(payload?.notification?.title || payload?.data?.title || 'Bildirim');
      const body = String(payload?.notification?.body || payload?.data?.body || '');
      const url = String(payload?.fcmOptions?.link || payload?.data?.url || '/profilim');

      await broadcastPushDebugNotification({ title, body, url });

      try {
        await self.registration.showNotification(title, {
          body,
          icon: '/pwa-192x192.png?v=20260224-1',
          badge: '/pwa-64x64.png?v=20260224-1',
          data: { url },
        });
      } catch {
        // ignore
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event?.notification?.data?.url || '/profilim';

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
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
        await self.clients.openWindow(url);
      } catch {
        // ignore
      }
    })()
  );
});