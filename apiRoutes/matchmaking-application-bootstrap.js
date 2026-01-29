import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function normalizeNat(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'tr' || s === 'turkey' || s === 'türkiye') return 'tr';
  if (s === 'id' || s === 'indonesia' || s === 'endonezya') return 'id';
  if (s === 'other') return 'other';
  return '';
}

function oppositeGender(g) {
  if (g === 'male') return 'female';
  if (g === 'female') return 'male';
  return '';
}

function defaultLookingForNationality(nat) {
  if (nat === 'tr') return 'id';
  if (nat === 'id') return 'tr';
  return 'other';
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
    const uid = safeStr(decoded?.uid);
    if (!uid) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'invalid_auth' }));
      return;
    }

    const body = normalizeBody(req);
    const bodyGender = normalizeGender(body?.gender);
    const bodyNat = normalizeNat(body?.nationality);
    const bodyNatOther = safeStr(body?.nationalityOther);
    const ageConfirmed = body?.ageConfirmed === true;

    const { db, FieldValue } = getAdmin();

    // Eğer kullanıcıda zaten bir başvuru varsa tekrar yaratma.
    const existingSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(1).get();
    if (!existingSnap.empty) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, ensured: true, created: false, reason: 'already_exists' }));
      return;
    }

    // Fallback: matchmakingUsers içinden çek.
    let gender = bodyGender;
    let nationality = bodyNat;
    let nationalityOther = bodyNatOther;
    try {
      const userSnap = await db.collection('matchmakingUsers').doc(uid).get();
      const userDoc = userSnap.exists ? userSnap.data() || {} : {};
      if (!gender) gender = normalizeGender(userDoc?.gender);
      if (!nationality) nationality = normalizeNat(userDoc?.nationality);
      if (!nationalityOther) nationalityOther = safeStr(userDoc?.nationalityOther);
    } catch {
      // ignore
    }

    if (!gender || !nationality) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'missing_profile' }));
      return;
    }

    const lookingForGender = oppositeGender(gender);
    if (!lookingForGender) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_gender' }));
      return;
    }

    const lookingForNationality = defaultLookingForNationality(nationality);

    const nowMs = Date.now();
    const applicationId = `auto_${uid}`;
    const appRef = db.collection('matchmakingApplications').doc(applicationId);

    const appSnap = await appRef.get();
    if (appSnap.exists) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, ensured: true, created: false, reason: 'auto_doc_exists', applicationId }));
      return;
    }

    const payload = {
      userId: uid,
      source: 'auto_stub',
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: nowMs,
      updatedAt: FieldValue.serverTimestamp(),

      gender,
      lookingForGender,

      nationality,
      nationalityOther: nationality === 'other' ? nationalityOther : '',
      lookingForNationality,
      lookingForNationalityOther: '',

      // Not: Gerçek başvuru formu kadar detay yok. Kullanıcı isterse sonradan yeni bir başvuru oluşturabilir.
      details: {
        autoBootstrap: true,
        signupAgeConfirmed: ageConfirmed,
      },

      // Firestore rules create'da bu alanlar zorunlu; admin yazdığı için rules bypass.
      // Burada yanlış beyan etmeyelim: sadece 18+ onayını signup akışındaki checkbox'a bağlı tutuyoruz.
      consent18Plus: ageConfirmed,
      consentPrivacy: false,
      consentTerms: false,
      consentPhotoShare: false,
    };

    await appRef.set(payload, { merge: false });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, ensured: true, created: true, applicationId }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
