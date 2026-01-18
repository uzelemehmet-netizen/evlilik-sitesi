import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCGaMZx6AdSaQuK4hmP8WdyzzHjbZVBf2Q",
  authDomain: "web-sitem-new-firebase.firebaseapp.com",
  projectId: "web-sitem-new-firebase",
  storageBucket: "web-sitem-new-firebase.appspot.com",
  messagingSenderId: "734745221788",
  appId: "1:734745221788:web:6a2dfcdd9ec923c4f6ab59",
  measurementId: "G-65D0SLE678"
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
