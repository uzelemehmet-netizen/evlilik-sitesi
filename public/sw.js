/* Minimal service worker for PWA installability (no caching).
   Avoid aggressive control changes (skipWaiting/clients.claim) to prevent rare refresh loops. */

self.addEventListener('install', () => {
  // No-op
});

self.addEventListener('activate', () => {
  // No-op
});
