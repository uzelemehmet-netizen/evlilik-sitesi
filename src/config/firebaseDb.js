import { getFirestore, initializeFirestore } from 'firebase/firestore';

import app from './firebaseApp';

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
  } catch {
    // HMR / yeniden import durumunda aynı app için firestore zaten init edilmiş olabilir.
    return getFirestore(app);
  }
})();

export default db;
