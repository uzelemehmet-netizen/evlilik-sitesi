import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCGaMZx6AdSaQuK4hmP8WdyzzHjbZVBf2Q',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'web-sitem-new-firebase.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'web-sitem-new-firebase',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'web-sitem-new-firebase.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '734745221788',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:734745221788:web:6a2dfcdd9ec923c4f6ab59',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-65D0SLE678',
};

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
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Cloud Storage
export const storage = getStorage(app);

export default app;
