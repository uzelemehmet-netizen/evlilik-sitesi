import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

let cachedProjectId = '';

let envLocalLoaded = false;

function loadEnvLocalOnce() {
  if (envLocalLoaded) return;
  envLocalLoaded = true;

  // Best-effort: local scripts/dev may rely on .env.local.
  // In Vercel/production builds this file won't exist; ignore safely.
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Do NOT override real env; only fill missing.
      if (process.env[key] === undefined || String(process.env[key] || '').trim() === '') {
        if (key.toUpperCase().includes('PRIVATE_KEY')) {
          process.env[key] = value.replace(/\\n/g, '\n');
        } else {
          process.env[key] = value;
        }
      }
    }
  } catch {
    // ignore
  }
}

function parseAdminEmails() {
  // Güvenlik: Admin endpoint'leri TEK kullanıcı ile sınırlı.
  // Env ile genişletmeyin; yanlışlıkla başka hesaplar admin olmasın.
  return ['uzelemehmet@gmail.com'];
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
  loadEnvLocalOnce();
  if (!getApps().length) {
    const serviceAccount = getServiceAccount();
    if (!serviceAccount) {
      const err = new Error(
        'firebase_admin_not_configured_set_FIREBASE_SERVICE_ACCOUNT_JSON_or_FIREBASE_SERVICE_ACCOUNT_JSON_FILE'
      );
      err.statusCode = 503;
      throw err;
    }

    const projectId = String(serviceAccount?.project_id || '').trim();
    const clientEmail = String(serviceAccount?.client_email || '').trim();
    const privateKey = String(serviceAccount?.private_key || '').trim();
    if (!projectId || !clientEmail || !privateKey) {
      const err = new Error('firebase_admin_invalid_service_account_missing_project_id_client_email_or_private_key');
      err.statusCode = 503;
      throw err;
    }

    cachedProjectId = projectId;

    try {
      initializeApp({ credential: cert(serviceAccount) });
    } catch (e) {
      const err = new Error('firebase_admin_init_failed');
      err.statusCode = 503;
      err.cause = e;
      throw err;
    }
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
