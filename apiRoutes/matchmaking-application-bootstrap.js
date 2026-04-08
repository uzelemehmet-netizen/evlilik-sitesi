import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { emitMemberFeedEvent } from './_memberFeed.js';
import { getMinAgeFromEnv } from './_matchmakingAgePolicy.js';
import { ensureUserCodeAssigned } from './_matchmakingUserCode.js';

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
  if (/^[a-z]{2}$/.test(s)) return s;
  return '';
}

function normalizeAge(v) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  if (!Number.isFinite(n)) return null;
  if (!Number.isInteger(n)) return null;
  if (n < 18 || n > 99) return null;
  return n;
}

function minAgeForNat() {
  return getMinAgeFromEnv();
}

function oppositeGender(g) {
  if (g === 'male') return 'female';
  if (g === 'female') return 'male';
  return '';
}

function defaultLookingForNationality(nat) {
  return 'other';
}

function hasCoreSignupProfile(age, gender) {
  return typeof age === 'number' && Number.isFinite(age) && age >= 18 && age <= 99 && !!gender;
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
    const authEmail = safeStr(decoded?.email).toLowerCase();
    const displayName = safeStr(decoded?.name);
    const authProvider = safeStr(decoded?.firebase?.sign_in_provider).toLowerCase();
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
    const bodyAge = normalizeAge(body?.age);
    const legacyAgeConfirmed = body?.ageConfirmed === true;

    const { db, FieldValue } = getAdmin();

    // Fallback: matchmakingUsers içinden çek.
    // Not: Yeni signup'ta bazı alanlar henüz yok olabilir. Bu durumda da auto_stub dokümanı üretmek istiyoruz
    // (admin "Yeni Kullanıcılar" raporları boş kalmasın).
    let gender = bodyGender;
    let nationality = bodyNat;
    let nationalityOther = bodyNatOther;
    let age = bodyAge;
    let userCode = '';
    try {
      const userSnap = await db.collection('matchmakingUsers').doc(uid).get();
      const userDoc = userSnap.exists ? userSnap.data() || {} : {};
      if (!gender) gender = normalizeGender(userDoc?.gender);
      if (!nationality) nationality = normalizeNat(userDoc?.nationality);
      if (!nationalityOther) nationalityOther = safeStr(userDoc?.nationalityOther);
      if (age === null) age = normalizeAge(userDoc?.age);
      userCode = safeStr(userDoc?.userCode) || safeStr(userDoc?.publicProfile?.userCode);
    } catch {
      // ignore
    }

    // Eğer kullanıcıda zaten bir başvuru varsa tekrar yaratma.
    const existingSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(1).get();
    if (!existingSnap.empty) {
      let ensuredUserCode = '';
      try {
        const ensured = await ensureUserCodeAssigned({ db, FieldValue, uid, gender, nowMs: Date.now() });
        ensuredUserCode = safeStr(ensured?.userCode);
      } catch {
        // ignore
      }

      const signupCoreComplete = hasCoreSignupProfile(age, gender);
      const lookingForGender = gender ? oppositeGender(gender) : '';
      const lookingForNationality = nationality ? defaultLookingForNationality(nationality) : '';

      try {
        const firstDoc = existingSnap.docs?.[0];
        if (firstDoc?.ref) {
          await firstDoc.ref.set(
            {
              ...(ensuredUserCode ? { userCode: ensuredUserCode } : {}),
              ...(authEmail ? { authEmail, email: authEmail } : {}),
              ...(displayName ? { displayName } : {}),
              ...(authProvider ? { authProvider } : {}),
              ...(typeof age === 'number' ? { age } : {}),
              ...(gender ? { gender, lookingForGender } : {}),
              ...(nationality
                ? {
                    nationality,
                    nationalityOther: nationality === 'other' ? nationalityOther : '',
                    lookingForNationality,
                    lookingForNationalityOther: '',
                  }
                : {}),
              details: {
                ...(firstDoc.data()?.details && typeof firstDoc.data().details === 'object' ? firstDoc.data().details : {}),
                autoBootstrap: true,
                signupAge: typeof age === 'number' ? age : null,
                signupAgeConfirmed: typeof age === 'number',
                signupCoreComplete,
                missingProfile: !signupCoreComplete,
              },
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch {
        // ignore
      }

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, ensured: true, created: false, reason: 'already_exists' }));
      return;
    }

    const nowMs = Date.now();
    const ensuredCode = await ensureUserCodeAssigned({ db, FieldValue, uid, gender, nowMs });
    if (!userCode) userCode = safeStr(ensuredCode?.userCode);

    const hasGender = !!gender;
    const hasNationality = !!nationality;
    const signupCoreComplete = hasCoreSignupProfile(age, gender);

    const minAge = hasNationality ? minAgeForNat(nationality) : getMinAgeFromEnv();
    const ageConfirmed = (typeof age === 'number' && age >= minAge) || legacyAgeConfirmed === true;

    const lookingForGender = hasGender ? oppositeGender(gender) : '';
    const lookingForNationality = hasNationality ? defaultLookingForNationality(nationality) : '';

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
      ...(authEmail ? { authEmail, email: authEmail } : {}),
      ...(displayName ? { displayName } : {}),
      ...(authProvider ? { authProvider } : {}),

      // Kullanıcı kayıt olurken zaten verilen UC-... kodunu başvuruya da kopyala.
      // Böylece admin ekranı `matchmakingUsers` dokümanını okuyamasa bile UC kodunu gösterebilir.
      userCode: userCode || '',

      ...(hasGender ? { gender, lookingForGender } : {}),

      ...(hasNationality
        ? {
            nationality,
            nationalityOther: nationality === 'other' ? nationalityOther : '',
            lookingForNationality,
            lookingForNationalityOther: '',
          }
        : {}),

      ...(typeof age === 'number' ? { age } : {}),

      // Not: Gerçek başvuru formu kadar detay yok. Kullanıcı isterse sonradan yeni bir başvuru oluşturabilir.
      details: {
        autoBootstrap: true,
        signupAge: typeof age === 'number' ? age : null,
        signupAgeConfirmed: ageConfirmed,
        signupCoreComplete,
        missingProfile: !signupCoreComplete,
      },

      // Firestore rules create'da bu alanlar zorunlu; admin yazdığı için rules bypass.
      // Burada yanlış beyan etmeyelim: sadece 18+ onayını signup akışındaki checkbox'a bağlı tutuyoruz.
      consent18Plus: ageConfirmed,
      consentPrivacy: false,
      consentTerms: false,
      consentPhotoShare: false,
    };

    await appRef.set(payload, { merge: false });

    // Realtime member feed: "Yeni biri katıldı" (anonim) event'i.
    // Not: Bu koleksiyon public değildir (rules: authenticated read).
    try {
      await emitMemberFeedEvent({
        db,
        FieldValue,
        uid,
        kind: 'signup',
        username: '',
        userCode,
        profileIncomplete: true,
      });
    } catch {
      // best-effort
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, ensured: true, created: true, applicationId }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
