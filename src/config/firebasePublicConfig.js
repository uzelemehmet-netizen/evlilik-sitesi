export const firebaseConfig = {
  // IMPORTANT: Do not silently fall back to a different Firebase project.
  // If these are missing in Vercel env, we prefer to fail fast (ErrorBoundary will surface it)
  // rather than creating users in the wrong project.
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

export const firebaseWebPushVapidKey =
  import.meta.env.VITE_FIREBASE_VAPID_KEY || import.meta.env.VITE_FIREBASE_MESSAGING_VAPID_KEY || '';
