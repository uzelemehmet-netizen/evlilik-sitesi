import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  getAuth,
  initializeAuth,
  inMemoryPersistence,
} from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { firebaseConfig } from './firebasePublicConfig';

function assertFirebaseConfig(cfg) {
  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = required.filter((k) => !String(cfg?.[k] || '').trim());
  if (missing.length) {
    const err = new Error(`firebase_public_config_missing:${missing.join(',')}`);
    err.code = 'firebase_public_config_missing';
    throw err;
  }
}

// Initialize Firebase
assertFirebaseConfig(firebaseConfig);
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
// Auth persistence
// İstek: lokal geliştirmede her sayfa yenilemede tekrar giriş istenebilsin.
// Not: Google signInWithRedirect akışı, sayfa yenilendiği için memory persistence ile kırılabilir.
// Varsayılan: DEV -> session (redirect uyumlu), PROD -> local (kalıcı).
const authPersistenceMode = String(
  import.meta?.env?.VITE_AUTH_PERSISTENCE || (import.meta.env.DEV ? 'session' : 'local')
)
  .trim()
  .toLowerCase();

const authPersistence =
  authPersistenceMode === 'memory'
    ? inMemoryPersistence
    : authPersistenceMode === 'session'
      ? browserSessionPersistence
      : browserLocalPersistence;

export const auth = (() => {
  try {
    // initializeAuth, persistence'i en baştan bağladığı için,
    // "önce restore edip sonra setPersistence" yarışını engeller.
    return initializeAuth(app, { persistence: authPersistence, popupRedirectResolver: browserPopupRedirectResolver });
  } catch (e) {
    // HMR / yeniden import durumunda aynı app için auth zaten init edilmiş olabilir.
    return getAuth(app);
  }
})();

// Initialize Cloud Firestore
const firestoreForceLongPoll = String(import.meta?.env?.VITE_FIRESTORE_FORCE_LONGPOLL || '').trim() === '1';

export const db = (() => {
  try {
    // Bazı ağlarda (VPN/kurumsal proxy/antivirüs) Firestore listen kanalı sık kopabilir.
    // Long-polling seçenekleri bunu ciddi ölçüde azaltır.
    return initializeFirestore(app, {
      experimentalForceLongPolling: firestoreForceLongPoll,
      experimentalAutoDetectLongPolling: !firestoreForceLongPoll,
      // Fetch streams bazı ortamlarda sorun çıkarabiliyor; XHR daha uyumlu.
      useFetchStreams: false,
    });
  } catch (e) {
    // HMR / yeniden import durumunda aynı app için firestore zaten init edilmiş olabilir.
    return getFirestore(app);
  }
})();

// Initialize Cloud Storage
export const storage = getStorage(app);

export default app;
