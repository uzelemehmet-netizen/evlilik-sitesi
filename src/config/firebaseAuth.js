import {
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  getAuth,
  initializeAuth,
  inMemoryPersistence,
} from 'firebase/auth';

import app from './firebaseApp';

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
  } catch {
    // HMR / yeniden import durumunda aynı app için auth zaten init edilmiş olabilir.
    return getAuth(app);
  }
})();

export default auth;
