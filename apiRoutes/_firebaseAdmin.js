import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || '';
  const envList = String(raw)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const ruleAdmins = ['uzelemehmet@gmail.com', 'articelikkapi@gmail.com'];
  const ruleAdminSet = new Set(ruleAdmins);

  // Firestore rules ile birebir uyum: sadece kural listesi geçerli olsun.
  // Env listesi varsa, sadece kural listesiyle kesişenleri al.
  if (envList.length) {
    const filtered = envList.filter((email) => ruleAdminSet.has(email));
    return filtered.length ? filtered : ruleAdmins;
  }

  return ruleAdmins;
}

function normalizeBody(req) {
  const b = req?.body;
  if (!b) return {};
  if (typeof b === 'object') return b;
  try {
    return JSON.parse(b);
  } catch {
    return {};
  }
}

function getBearerToken(req) {
  const header = req?.headers?.authorization || req?.headers?.Authorization;
  if (!header) return '';
  const value = String(header);
  const m = value.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : '';
}

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      const json = JSON.parse(raw);
      if (json?.private_key && typeof json.private_key === 'string') {
        json.private_key = json.private_key.replace(/\\n/g, '\n');
      }
      return json;
    } catch {
      return null;
    }
  }

  // Daha güvenli opsiyon: JSON'u env'e yapıştırmak yerine dosya yolunu verin.
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE ||
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE ||
    '';
  if (!filePath) return null;

  try {
    const text = fs.readFileSync(String(filePath), 'utf8');
    const json = JSON.parse(text);
    if (json?.private_key && typeof json.private_key === 'string') {
      json.private_key = json.private_key.replace(/\\n/g, '\n');
    }
    return json;
  } catch {
    return null;
  }
}

export function getAdmin() {
  if (!getApps().length) {
    const serviceAccount = getServiceAccount();
    if (!serviceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env missing');
    }

    initializeApp({ credential: cert(serviceAccount) });
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
    FieldValue,
  };
}

export async function requireIdToken(req) {
  const { auth } = getAdmin();
  const token = getBearerToken(req);
  if (!token) {
    const err = new Error('missing_auth');
    err.statusCode = 401;
    throw err;
  }

  try {
    return await auth.verifyIdToken(token);
  } catch {
    const err = new Error('invalid_auth');
    err.statusCode = 401;
    throw err;
  }
}

export async function requireAdmin(req) {
  const decoded = await requireIdToken(req);
  const email = String(decoded?.email || '').toLowerCase();
  const allowed = parseAdminEmails();

  if (!email || !allowed.includes(email)) {
    const err = new Error('forbidden');
    err.statusCode = 403;
    throw err;
  }

  return decoded;
}

export function requireCronSecret(req) {
  const secret = process.env.MATCHMAKING_CRON_SECRET || '';
  const got = String(req?.headers?.['x-cron-secret'] || req?.headers?.['X-Cron-Secret'] || '');

  if (!secret || got !== secret) {
    const err = new Error('forbidden');
    err.statusCode = 403;
    throw err;
  }

  return true;
}

export { normalizeBody };
