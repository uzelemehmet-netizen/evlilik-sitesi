import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';

let cachedProjectId = '';

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
      // Eğer inline JSON bozuksa, yine de dosya yoluna fallback etmeye çalış.
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
      const err = new Error(
        'firebase_admin_not_configured_set_FIREBASE_SERVICE_ACCOUNT_JSON_or_FIREBASE_SERVICE_ACCOUNT_JSON_FILE'
      );
      err.statusCode = 503;
      throw err;
    }

    cachedProjectId = String(serviceAccount?.project_id || '').trim();

    initializeApp({ credential: cert(serviceAccount) });
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
    FieldValue,
    projectId: cachedProjectId,
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
  const headers = req?.headers || {};

  // Primary: shared secret via header (local scripts / GitHub Actions gibi ortamlarda).
  const gotHeader = String(headers?.['x-cron-secret'] || headers?.['X-Cron-Secret'] || '').trim();
  if (secret && gotHeader && gotHeader === secret) return true;

  // Fallback: secret via query (?cronSecret=...). Bazı scheduler'lar header gönderemeyebilir.
  // Not: Query string log'lara düşebileceği için mümkünse header tercih edin.
  const qs = req?.query && typeof req.query === 'object' ? req.query : {};
  const gotQuery = String(qs?.cronSecret || qs?.cron_secret || '').trim();
  if (secret && gotQuery && gotQuery === secret) return true;

  // Optional: Vercel Cron Jobs otomatik header ekler. Güvenlik için explicit opt-in env ister.
  const allowVercelCron = String(process.env.MATCHMAKING_ALLOW_VERCEL_CRON || '').toLowerCase().trim();
  const vercelCronHeader = String(headers?.['x-vercel-cron'] || headers?.['X-Vercel-Cron'] || '').trim();
  if ((allowVercelCron === '1' || allowVercelCron === 'true' || allowVercelCron === 'yes') && vercelCronHeader) {
    return true;
  }

  const err = new Error(
    vercelCronHeader
      ? 'forbidden_vercel_cron_not_allowed_set_MATCHMAKING_ALLOW_VERCEL_CRON'
      : 'forbidden'
  );
  err.statusCode = 403;
  throw err;
}

export { normalizeBody };
