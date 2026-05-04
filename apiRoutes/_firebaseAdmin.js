import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import crypto from 'node:crypto';
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

function getServiceAccountFromFields() {
  const projectId = String(process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '').trim();
  const clientEmail = String(process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '').trim();
  const privateKeyRaw = String(process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').trim();
  const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, '\n') : '';

  if (!projectId || !clientEmail || !privateKey) return null;

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
}

export function getAdminEmails() {
  return [...parseAdminEmails()];
}

export function isAdminEmail(email) {
  const normalized = String(email || '').toLowerCase().trim();
  if (!normalized) return false;
  return parseAdminEmails().includes(normalized);
}

function hasAdminClaim(decoded) {
  return decoded?.admin === true;
}

function requiresAdminSecondFactor(decoded) {
  return decoded?.admin_mfa_required === true;
}

function hasAdminSecondFactor(decoded) {
  return !requiresAdminSecondFactor(decoded) || !!String(decoded?.firebase?.sign_in_second_factor || '').trim();
}

function safeTimingEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

function getAdminStepUpPasswordRaw() {
  return String(process.env.ADMIN_PANEL_STEPUP_PASSWORD || '').trim();
}

function getAdminStepUpPasswordHash() {
  return String(process.env.ADMIN_PANEL_STEPUP_PASSWORD_HASH || '').trim().toLowerCase();
}

function getAdminStepUpSigningSecret() {
  return String(
    process.env.ADMIN_PANEL_STEPUP_SIGNING_SECRET ||
      process.env.ADMIN_PANEL_STEPUP_PASSWORD_HASH ||
      process.env.ADMIN_PANEL_STEPUP_PASSWORD ||
      ''
  ).trim();
}

function base64UrlEncode(value) {
  return Buffer.from(String(value || ''), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  if (!normalized) return '';
  const padLen = normalized.length % 4;
  const padded = normalized + (padLen ? '='.repeat(4 - padLen) : '');
  try {
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

function getRequestPath(req) {
  const raw = String(req?.url || '').trim();
  if (!raw) return '';
  try {
    return new URL(raw, 'http://localhost').pathname || '';
  } catch {
    return raw.split('?')[0] || '';
  }
}

export function isAdminStepUpEnabled() {
  return !!(getAdminStepUpPasswordRaw() || getAdminStepUpPasswordHash());
}

export function getAdminStepUpTtlMs() {
  const raw = Number(String(process.env.ADMIN_PANEL_STEPUP_TTL_MINUTES || '20').trim());
  const minutes = Number.isFinite(raw) ? Math.max(2, Math.min(240, Math.floor(raw))) : 20;
  return minutes * 60 * 1000;
}

export function verifyAdminStepUpPassword(password) {
  const input = String(password || '');
  if (!input) return false;

  const raw = getAdminStepUpPasswordRaw();
  if (raw) return safeTimingEqual(input, raw);

  const hash = getAdminStepUpPasswordHash();
  if (!hash) return false;
  return safeTimingEqual(sha256Hex(input), hash);
}

export function issueAdminStepUpToken(decoded) {
  const signingSecret = getAdminStepUpSigningSecret();
  if (!signingSecret) return '';

  const payload = {
    uid: String(decoded?.uid || '').trim(),
    email: String(decoded?.email || '').toLowerCase().trim(),
    exp: Date.now() + getAdminStepUpTtlMs(),
  };
  const payloadRaw = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(payloadRaw);
  const sig = crypto.createHmac('sha256', signingSecret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifyAdminStepUpToken(req, decoded) {
  const signingSecret = getAdminStepUpSigningSecret();
  if (!signingSecret) return false;

  const headers = req?.headers || {};
  const raw = String(headers['x-admin-step-up'] || headers['X-Admin-Step-Up'] || '').trim();
  if (!raw) return false;

  const dot = raw.indexOf('.');
  if (dot <= 0) return false;

  const payloadB64 = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!payloadB64 || !sig) return false;

  const expectedSig = crypto.createHmac('sha256', signingSecret).update(payloadB64).digest('base64url');
  if (!safeTimingEqual(sig, expectedSig)) return false;

  const payloadRaw = base64UrlDecode(payloadB64);
  if (!payloadRaw) return false;

  try {
    const payload = JSON.parse(payloadRaw);
    const exp = typeof payload?.exp === 'number' && Number.isFinite(payload.exp) ? payload.exp : 0;
    const email = String(payload?.email || '').toLowerCase().trim();
    const uid = String(payload?.uid || '').trim();
    if (!exp || exp <= Date.now()) return false;
    if (uid !== String(decoded?.uid || '').trim()) return false;
    if (email !== String(decoded?.email || '').toLowerCase().trim()) return false;
    return true;
  } catch {
    return false;
  }
}

function shouldRequireAdminStepUp(req) {
  if (!isAdminStepUpEnabled()) return false;
  const pathName = getRequestPath(req);
  if (!pathName.startsWith('/api/admin')) return false;
  if (pathName === '/api/admin-step-up-status' || pathName === '/api/admin-step-up-verify') return false;
  return true;
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
  const fromFields = getServiceAccountFromFields();
  if (fromFields) return fromFields;

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

export async function requireAdmin(req, { requireStepUp } = {}) {
  const decoded = await requireIdToken(req);
  const email = String(decoded?.email || '').toLowerCase();
  const allowed = parseAdminEmails();

  if (!email || !allowed.includes(email) || !hasAdminClaim(decoded) || !hasAdminSecondFactor(decoded)) {
    const err = new Error('forbidden');
    err.statusCode = 403;
    throw err;
  }

  const mustStepUp = requireStepUp === true || (requireStepUp !== false && shouldRequireAdminStepUp(req));
  if (mustStepUp && !verifyAdminStepUpToken(req, decoded)) {
    const err = new Error('admin_step_up_required');
    err.statusCode = 403;
    throw err;
  }

  return decoded;
}

export function requireCronSecret(req) {
  const secret = process.env.MATCHMAKING_CRON_SECRET || process.env.CRON_SECRET || '';
  const headers = req?.headers || {};

  // Vercel Cron Jobs, CRON_SECRET varsa Authorization: Bearer <secret> gönderir.
  const authHeader = String(headers?.authorization || headers?.Authorization || '').trim();
  const authMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const gotBearer = authMatch ? String(authMatch[1] || '').trim() : '';
  if (secret && gotBearer && gotBearer === secret) return true;

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
