import crypto from 'node:crypto';
import { getAdmin, normalizeBody } from './_firebaseAdmin.js';

const EMAIL_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_LIMIT_MAX = 3;
const IP_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const IP_LIMIT_MAX = 12;

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
  if (password.length < 6 || password.length > 128) return '';
  return password;
}

function normalizeDisplayName(value) {
  const name = safeStr(value);
  if (!name) return '';
  return name.slice(0, 80);
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

async function consumeRateLimit(tx, ref, nowMs, { windowMs, maxAttempts, meta }) {
  const snap = await tx.get(ref);
  const data = snap.exists ? snap.data() || {} : {};
  const windowStartedAtMs = typeof data?.windowStartedAtMs === 'number' ? data.windowStartedAtMs : nowMs;
  const count = typeof data?.count === 'number' ? data.count : 0;
  const sameWindow = nowMs - windowStartedAtMs < windowMs;
  const nextCount = sameWindow ? count + 1 : 1;

  if (sameWindow && count >= maxAttempts) {
    const err = new Error('rate_limited');
    err.statusCode = 429;
    throw err;
  }

  tx.set(
    ref,
    {
      scope: meta?.scope || '',
      keyHash: meta?.keyHash || '',
      updatedAtMs: nowMs,
      windowStartedAtMs: sameWindow ? windowStartedAtMs : nowMs,
      count: nextCount,
      ...(meta?.emailHash ? { emailHash: meta.emailHash } : {}),
      ...(meta?.ipHash ? { ipHash: meta.ipHash } : {}),
    },
    { merge: true }
  );
}

function mapSignupError(error) {
  const code = String(error?.code || error?.message || '').trim();
  if (code === 'rate_limited') return { statusCode: 429, error: 'rate_limited' };
  if (code === 'auth/email-already-exists') return { statusCode: 409, error: 'email_already_in_use' };
  if (code === 'auth/invalid-email') return { statusCode: 400, error: 'invalid_email' };
  if (code === 'auth/invalid-password' || code === 'auth/password-does-not-meet-requirements') {
    return { statusCode: 400, error: 'weak_password' };
  }
  if (code === 'firebase_admin_not_configured_set_FIREBASE_SERVICE_ACCOUNT_JSON_or_FIREBASE_SERVICE_ACCOUNT_JSON_FILE') {
    return { statusCode: 503, error: 'signup_unavailable' };
  }
  return { statusCode: error?.statusCode || 500, error: 'signup_failed' };
}

export default async function publicEmailSignup(req, res) {
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
    const displayName = normalizeDisplayName(body?.displayName || body?.profile?.displayName || body?.profile?.fullName || body?.profile?.firstName);

    if (!email) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'invalid_email' }));
      return;
    }

    if (!password) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'weak_password' }));
      return;
    }

    const { auth, db } = getAdmin();
    const nowMs = Date.now();
    const emailHash = sha256Short(`email:${email}`);
    const ip = getClientIp(req);
    const ipHash = sha256Short(`ip:${ip}`);

    await db.runTransaction(async (tx) => {
      if (emailHash) {
        const emailRef = db.collection('publicAuthRateLimits').doc(`signup_email_${emailHash}`);
        await consumeRateLimit(tx, emailRef, nowMs, {
          windowMs: EMAIL_LIMIT_WINDOW_MS,
          maxAttempts: EMAIL_LIMIT_MAX,
          meta: { scope: 'signup_email', keyHash: emailHash, emailHash, ipHash },
        });
      }

      if (ipHash) {
        const ipRef = db.collection('publicAuthRateLimits').doc(`signup_ip_${ipHash}`);
        await consumeRateLimit(tx, ipRef, nowMs, {
          windowMs: IP_LIMIT_WINDOW_MS,
          maxAttempts: IP_LIMIT_MAX,
          meta: { scope: 'signup_ip', keyHash: ipHash, emailHash, ipHash },
        });
      }
    });

    const userRecord = await auth.createUser({
      email,
      password,
      ...(displayName ? { displayName } : {}),
    });

    const customToken = await auth.createCustomToken(userRecord.uid);

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        uid: userRecord.uid,
        customToken,
      })
    );
  } catch (error) {
    const mapped = mapSignupError(error);
    res.statusCode = mapped.statusCode;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: mapped.error }));
  }
}