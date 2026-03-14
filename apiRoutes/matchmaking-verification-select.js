import crypto from 'crypto';
import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeMethod(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'whatsapp' || s === 'wa') return 'whatsapp';
  if (s === 'kyc' || s === 'auto' || s === 'automatic') return 'kyc';
  if (s === 'manual' || s === 'admin') return 'manual';
  return '';
}

function normalizeLangBase(lang) {
  const raw = safeStr(lang).toLowerCase();
  if (!raw) return '';
  const base = raw.split('-')[0];
  return base === 'in' ? 'id' : base;
}

function getWhatsappNumber(opts = {}) {
  const base = normalizeLangBase(opts?.lang);
  const useId = base === 'id';

  const rawTr = process.env.WHATSAPP_NUMBER_TR || process.env.VITE_WHATSAPP_NUMBER_TR || '';
  const rawId = process.env.WHATSAPP_NUMBER_ID || process.env.VITE_WHATSAPP_NUMBER_ID || '';

  if (useId && rawId) return safeStr(rawId).replace(/[^0-9]/g, '');
  if (!useId && rawTr) return safeStr(rawTr).replace(/[^0-9]/g, '');

  const raw = process.env.WHATSAPP_NUMBER || process.env.VITE_WHATSAPP_NUMBER || '';
  return safeStr(raw).replace(/[^0-9]/g, '');
}

function makeReferenceCode() {
  // 8 haneli, kolay okunur (hex)
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function pickFullNameFromUserDoc(data) {
  const direct = safeStr(data?.fullName);
  if (direct) return direct;
  const pub = safeStr(data?.publicProfile?.fullName);
  if (pub) return pub;
  const det = safeStr(data?.details?.fullName);
  if (det) return det;
  const name = safeStr(data?.details?.name);
  const surname = safeStr(data?.details?.surname);
  const joined = [name, surname].filter(Boolean).join(' ').trim();
  return joined || '';
}

function pickUserCodeFromUserDoc(data) {
  return safeStr(data?.userCode) || safeStr(data?.profileCode) || '';
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
    const method = normalizeMethod(body?.method);
    const lang = safeStr(body?.lang);

    if (!method) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const userRef = db.collection('matchmakingUsers').doc(uid);

    let referenceCode = '';
    let whatsappUrl = '';
    let whatsappMessage = '';

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const data = snap.exists ? (snap.data() || {}) : {};

      const alreadyVerified = data?.identityVerified === true || ['verified', 'approved'].includes(String(data?.identityVerification?.status || '').toLowerCase().trim());
      if (alreadyVerified) {
        return;
      }

      referenceCode = makeReferenceCode();

      const patch = {
        identityVerified: false,
        identityVerification: {
          status: 'pending',
          method,
          referenceCode,
          requestedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        // Eğer daha önce manuel upload ile dosya gönderildiyse, yöntemi seçince bunları temizleyelim.
        'identityVerification.files': FieldValue.delete(),
        'identityVerification.idType': FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!snap.exists) {
        tx.set(userRef, patch, { merge: true });
      } else {
        tx.set(userRef, patch, { merge: true });
      }

      if (method === 'whatsapp') {
        const wa = getWhatsappNumber({ lang });
        const fullName = pickFullNameFromUserDoc(data);
        const userCode = pickUserCodeFromUserDoc(data);
        const lines = [
          'Merhaba, selfie video ile doğrulama yapmak istiyorum.',
          'Bu sohbete 5 saniyelik video selfie göndereceğim.',
          `Referans: ${referenceCode}`,
          fullName ? `Ad Soyad: ${fullName}` : '',
          userCode ? `Kullanıcı kodu: ${userCode}` : '',
          'Teşekkürler.',
        ].filter(Boolean);
        whatsappMessage = lines.join('\n');
        // WhatsApp numarası server env'de yoksa url üretmeyiz; client kendi fallback numarasıyla mesajı açabilir.
        whatsappUrl = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(whatsappMessage)}` : '';
      }

      if (method === 'manual') {
        // Manuel onay: kullanıcıdan admin ile iletişime geçmesini isteriz.
        const wa = getWhatsappNumber({ lang });
        whatsappMessage = `Manuel kimlik doğrulama talebi: ${referenceCode} (uid: ${uid})`;
        whatsappUrl = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(whatsappMessage)}` : '';
      }

      if (method === 'kyc') {
        const provider = safeStr(process.env.KYC_PROVIDER);
        if (!provider) {
          const err = new Error('kyc_not_configured');
          err.statusCode = 501;
          throw err;
        }

        // Provider entegrasyonu bu repo'da iskelet olarak düşünülmeli.
        // KYC session oluşturma / yönlendirme URL'si üretme adımı provider'a göre eklenebilir.
        tx.set(
          userRef,
          {
            identityVerification: {
              provider,
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        method,
        status: 'pending',
        referenceCode: referenceCode || null,
        whatsappUrl: whatsappUrl || null,
        whatsappMessage: whatsappMessage || null,
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
