import crypto from 'node:crypto';
import { getAdmin, normalizeBody } from './_firebaseAdmin.js';

const EMAIL_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_LIMIT_MAX = 8;
const IP_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const IP_LIMIT_MAX = 30;

function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value) {
  const email = safeStr(value).toLowerCase();
  if (!email || email.length > 320) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  return email;
}

function normalizePassword(value) {
  const password = typeof value === 'string' ? value : String(value ?? '');
  if (!password) return '';
  if (password.length > 128) return '';
  return password;
}

function sha256Short(value) {
  try {
    return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex').slice(0, 24);
  } catch {
    return '';
  }
}

function getClientIp(req) {
  const headers = req?.headers || {};
  const forwardedFor = safeStr(headers['x-forwarded-for'] || headers['X-Forwarded-For'] || '');
  if (forwardedFor) {
    const first = forwardedFor.split(',').map((part) => safeStr(part)).find(Boolean);
    if (first) return first.slice(0, 120);
  }

  return safeStr(
    headers['x-real-ip'] ||
      headers['X-Real-Ip'] ||
      headers['x-vercel-forwarded-for'] ||
      headers['X-Vercel-Forwarded-For'] ||
      ''
  ).slice(0, 120);
}

function buildRateLimitWrite(snap, nowMs, { windowMs, maxAttempts, meta }) {
  const data = snap?.exists ? snap.data() || {} : {};
  const windowStartedAtMs = typeof data?.windowStartedAtMs === 'number' ? data.windowStartedAtMs : nowMs;
  const count = typeof data?.count === 'number' ? data.count : 0;
  const sameWindow = nowMs - windowStartedAtMs < windowMs;
  const nextCount = sameWindow ? count + 1 : 1;

  if (sameWindow && count >= maxAttempts) {
    const err = new Error('rate_limited');
    err.statusCode = 429;
    throw err;
  }

  return {
    scope: meta?.scope || '',
    keyHash: meta?.keyHash || '',
    updatedAtMs: nowMs,
    windowStartedAtMs: sameWindow ? windowStartedAtMs : nowMs,
    count: nextCount,
    ...(meta?.emailHash ? { emailHash: meta.emailHash } : {}),
    ...(meta?.ipHash ? { ipHash: meta.ipHash } : {}),
  };
}

function getApiKey() {
  return safeStr(process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY);
}

async function signInWithPasswordViaIdentityToolkit({ email, password, apiKey }) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage = safeStr(data?.error?.message || data?.error || '');
    const err = new Error(errorMessage || `identity_toolkit_${response.status}`);
    err.statusCode = response.status;
    throw err;
  }

  return data || {};
}

function mapLoginError(error) {
  const code = String(error?.code || error?.message || '').trim();
  if (code === 'rate_limited') return { statusCode: 429, error: 'rate_limited' };
  if (
    code === 'INVALID_LOGIN_CREDENTIALS' ||
    code === 'INVALID_PASSWORD' ||
    code === 'EMAIL_NOT_FOUND' ||
    code === 'INVALID_EMAIL'
  ) {
    return { statusCode: 401, error: 'invalid_credentials' };
  }
  if (code === 'USER_DISABLED') return { statusCode: 403, error: 'user_disabled' };
  if (code === 'TOO_MANY_ATTEMPTS_TRY_LATER' || code === 'TOO_MANY_ATTEMPTS_TRY_LATER : TOO_MANY_ATTEMPTS_TRY_LATER') {
    return { statusCode: 429, error: 'rate_limited' };
  }
  if (code === 'firebase_admin_not_configured_set_FIREBASE_SERVICE_ACCOUNT_JSON_or_FIREBASE_SERVICE_ACCOUNT_JSON_FILE') {
    return { statusCode: 503, error: 'login_unavailable' };
  }
  return { statusCode: error?.statusCode || 500, error: 'login_failed' };
}

export default async function publicEmailLogin(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const body = normalizeBody(req);
    const email = normalizeEmail(body?.email);
    const password = normalizePassword(body?.password);

    if (!email || !password) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'invalid_credentials' }));
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      res.statusCode = 503;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'login_unavailable' }));
      return;
    }

    const { auth, db } = getAdmin();
    const nowMs = Date.now();
    const emailHash = sha256Short(`email:${email}`);
    const ipHash = sha256Short(`ip:${getClientIp(req)}`);

    await db.runTransaction(async (tx) => {
      const refs = [];
      if (emailHash) {
        refs.push({
          ref: db.collection('publicAuthRateLimits').doc(`login_email_${emailHash}`),
          config: {
            windowMs: EMAIL_LIMIT_WINDOW_MS,
            maxAttempts: EMAIL_LIMIT_MAX,
            meta: { scope: 'login_email', keyHash: emailHash, emailHash, ipHash },
          },
        });
      }
      if (ipHash) {
        refs.push({
          ref: db.collection('publicAuthRateLimits').doc(`login_ip_${ipHash}`),
          config: {
            windowMs: IP_LIMIT_WINDOW_MS,
            maxAttempts: IP_LIMIT_MAX,
            meta: { scope: 'login_ip', keyHash: ipHash, emailHash, ipHash },
          },
        });
      }

      const snaps = await Promise.all(refs.map((entry) => tx.get(entry.ref)));
      refs.forEach((entry, index) => {
        const nextData = buildRateLimitWrite(snaps[index], nowMs, entry.config);
        tx.set(entry.ref, nextData, { merge: true });
      });
    });

    const signInData = await signInWithPasswordViaIdentityToolkit({ email, password, apiKey });
    const idToken = safeStr(signInData?.idToken);
    const localId = safeStr(signInData?.localId);
    if (!idToken || !localId) {
      const err = new Error('INVALID_LOGIN_CREDENTIALS');
      err.statusCode = 401;
      throw err;
    }

    const decoded = await auth.verifyIdToken(idToken);
    const uid = safeStr(decoded?.uid || localId);
    if (!uid) {
      const err = new Error('INVALID_LOGIN_CREDENTIALS');
      err.statusCode = 401;
      throw err;
    }

    const customToken = await auth.createCustomToken(uid);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, uid, customToken }));
  } catch (error) {
    const mapped = mapLoginError(error);
    res.statusCode = mapped.statusCode;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: mapped.error }));
  }
}