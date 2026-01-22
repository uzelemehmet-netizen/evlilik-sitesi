import crypto from 'crypto';
import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function makeReferenceCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function isLikelyCloudinaryUrl(url) {
  const s = safeStr(url);
  if (!s) return false;
  if (!/^https:\/\//i.test(s)) return false;
  // Basit güvenlik filtresi: sadece Cloudinary URL'lerini kabul et.
  // (Bu, ileride farklı storage'a geçilirse genişletilebilir.)
  return /(^|\.)cloudinary\.com\//i.test(s);
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
    const idFrontUrl = safeStr(body?.idFrontUrl);
    const idBackUrl = safeStr(body?.idBackUrl);
    const selfieUrl = safeStr(body?.selfieUrl);

    if (!isLikelyCloudinaryUrl(idFrontUrl) || !isLikelyCloudinaryUrl(idBackUrl) || !isLikelyCloudinaryUrl(selfieUrl)) {
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
      if (alreadyVerified) {
        return;
      }

      const existingRef = safeStr(data?.identityVerification?.referenceCode);
      referenceCode = existingRef || makeReferenceCode();

      const now = FieldValue.serverTimestamp();

      tx.set(
        userRef,
        {
          identityVerified: false,
          identityVerification: {
            status: 'pending',
            method: 'manual',
            referenceCode,
            requestedAt: data?.identityVerification?.requestedAt || now,
            submittedAt: now,
            updatedAt: now,
            files: {
              idFrontUrl,
              idBackUrl,
              selfieUrl,
            },
          },
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
    res.end(JSON.stringify({ ok: true, status: 'pending', method: 'manual', referenceCode: referenceCode || null }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
