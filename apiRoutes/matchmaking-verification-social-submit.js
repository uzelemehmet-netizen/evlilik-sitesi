import crypto from 'crypto';
import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function makeReferenceCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function normalizePlatform(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'instagram' || s === 'ig') return 'instagram';
  if (s === 'tiktok' || s === 'tt') return 'tiktok';
  if (s === 'youtube' || s === 'yt') return 'youtube';
  if (s === 'facebook' || s === 'fb') return 'facebook';
  return '';
}

function normalizeUsername(v) {
  const s = safeStr(v);
  if (!s) return '';

  // allow common username chars; keep original if it passes basic sanity
  const compact = s.replace(/^@+/, '').trim();
  if (!compact) return '';

  if (compact.length < 2 || compact.length > 64) return '';
  // avoid obvious URL / whitespace
  if (/\s/.test(compact)) return '';
  if (/^https?:\/\//i.test(compact)) return '';

  return compact;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const body = normalizeBody(req);
    const platform = normalizePlatform(body?.platform);
    const username = normalizeUsername(body?.username);

    if (!platform || !username) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const userRef = db.collection('matchmakingUsers').doc(uid);

    let referenceCode = '';
    let alreadyVerified = false;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const data = snap.exists ? (snap.data() || {}) : {};

      alreadyVerified =
        data?.identityVerified === true ||
        ['verified', 'approved'].includes(String(data?.identityVerification?.status || '').toLowerCase().trim());
      if (alreadyVerified) return;

      const existingRef = safeStr(data?.identityVerification?.referenceCode);
      referenceCode = existingRef || makeReferenceCode();

      const now = FieldValue.serverTimestamp();

      tx.set(
        userRef,
        {
          identityVerified: false,
          'identityVerification.status': 'pending',
          'identityVerification.method': 'social',
          'identityVerification.referenceCode': referenceCode,
          'identityVerification.social': {
            platform,
            username,
          },
          // clean up any previous manual upload remnants
          'identityVerification.files': FieldValue.delete(),
          'identityVerification.idType': FieldValue.delete(),
          'identityVerification.provider': FieldValue.delete(),
          'identityVerification.sessionId': FieldValue.delete(),
          'identityVerification.webhookAt': FieldValue.delete(),
          'identityVerification.submittedAt': now,
          'identityVerification.updatedAt': now,
          'identityVerification.requestedAt': data?.identityVerification?.requestedAt || now,
          updatedAt: now,
        },
        { merge: true }
      );
    });

    if (alreadyVerified) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, status: 'verified' }));
      return;
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        status: 'pending',
        method: 'social',
        referenceCode: referenceCode || null,
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
