import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined || String(process.env[key]).trim() === '') {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore
  }
}

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

loadEnvLocal();

const email = String(argValue('--email') || '').trim().toLowerCase();
const password = String(argValue('--password') || '');

if (!email || !password) {
  console.log('Usage: node scripts/firebase-client-login-test.mjs --email <email> --password <password>');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
};

console.log('[client-login-test] firebaseConfig:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
});

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error('[client-login-test] Missing VITE_FIREBASE_* envs in .env.local');
  process.exit(2);
}

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  console.log('[client-login-test] ok:', { uid: cred.user.uid, email: cred.user.email });
  process.exit(0);
} catch (e) {
  console.error('[client-login-test] failed:', {
    code: e?.code || null,
    message: e?.message || null,
  });
  process.exit(3);
}
