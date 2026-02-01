export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCGaMZx6AdSaQuK4hmP8WdyzzHjbZVBf2Q',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'web-sitem-new-firebase.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'web-sitem-new-firebase',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'web-sitem-new-firebase.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '734745221788',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:734745221788:web:6a2dfcdd9ec923c4f6ab59',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-65D0SLE678',
};

export const firebaseWebPushVapidKey =
  import.meta.env.VITE_FIREBASE_VAPID_KEY || import.meta.env.VITE_FIREBASE_MESSAGING_VAPID_KEY || '';
