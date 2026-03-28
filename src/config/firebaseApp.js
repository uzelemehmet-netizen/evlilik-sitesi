import { initializeApp } from 'firebase/app';

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

assertFirebaseConfig(firebaseConfig);

const app = initializeApp(firebaseConfig);

export default app;
