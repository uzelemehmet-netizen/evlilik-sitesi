import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  getAuth,
  initializeAuth,
  inMemoryPersistence,
} from 'firebase/auth';
import { getFirestore } from '@firebase/firestore';
import { getStorage } from 'firebase/storage';

import { firebaseConfig } from './firebasePublicConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional: Firebase App Check (reCAPTCHA v3)
// Enable by providing VITE_FIREBASE_APPCHECK_SITE_KEY in your env.
try {
  const siteKey = import.meta?.env?.VITE_FIREBASE_APPCHECK_SITE_KEY;
  if (typeof window !== 'undefined' && siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
} catch (e) {
  // ignore
}

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
export const db = getFirestore(app);

// Initialize Cloud Storage
export const storage = getStorage(app);

export default app;
