import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function toLowerSafe(v) {
  const s = safeStr(v);
  if (!s) return '';
  try {
    return s.toLowerCase();
  } catch {
    return String(s).toLowerCase();
  }
}

function toLowerTrSafe(v) {
  const s = safeStr(v);
  if (!s) return '';
  try {
    return s.toLocaleLowerCase('tr-TR');
  } catch {
    return toLowerSafe(s);
  }
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
    const confirmText = safeStr(body?.confirmText);
    const confirmFinal = body?.confirmFinal === true;

    // API seviyesinde ekstra koruma: yanlışlıkla çağrıları ve basit otomasyonları azaltır.
    // TR/EN/ID dillerinde UI onay cümleleri desteklenir.
    const allowed = new Set(['hesabımı sil', 'hesabimi sil', 'delete my account', 'hapus akun saya']);
    const norm = toLowerSafe(confirmText);
    const normTr = toLowerTrSafe(confirmText);
    if (!allowed.has(norm) && !allowed.has(normTr)) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'confirm_text_required' }));
      return;
    }

    if (!confirmFinal) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'confirm_final_required' }));
      return;
    }

    const { auth, db, FieldValue } = getAdmin();

    // 1) Kullanıcıya ait verileri temizle (best-effort)
    const now = FieldValue.serverTimestamp();

    // Primary docs
    const userRef = db.collection('matchmakingUsers').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};

    // Related collections
    const appsQ = db.collection('matchmakingApplications').where('userId', '==', uid).limit(25);
    const paymentsQ = db.collection('matchmakingPayments').where('userId', '==', uid).limit(50);
    const reservationsQ = db.collection('reservations').where('userId', '==', uid).limit(50);

    // Matches: diğer kullanıcıyı etkilememek için silmek yerine "deleted" olarak işaretle.
    // Bu sayede diğer taraf kartta "deleted" durumunu görür ve yeni eşleşme talep edebilir.
    const matchesQ = db.collection('matchmakingMatches').where('userIds', 'array-contains', uid).limit(50);

    const [appsSnap, paymentsSnap, reservationsSnap, matchesSnap] = await Promise.all([
      appsQ.get(),
      paymentsQ.get(),
      reservationsQ.get(),
      matchesQ.get(),
    ]);

    const batch = db.batch();

    appsSnap.forEach((d) => batch.delete(d.ref));
    paymentsSnap.forEach((d) => batch.delete(d.ref));
    reservationsSnap.forEach((d) => batch.delete(d.ref));

    matchesSnap.forEach((d) => {
      batch.set(
        d.ref,
        {
          status: 'deleted_user',
          deletedUserIds: {
            [uid]: now,
          },
          updatedAt: now,
        },
        { merge: true }
      );
    });

    // Kullanıcı dokümanını silmeden önce, hassas alanları boşaltıp "deleted" izini bırak.
    // (Bazı yerlerde doc yokluğu edge-case oluşturmasın diye önce sanitize.)
    batch.set(
      userRef,
      {
        deletedAt: now,
        identityVerification: FieldValue.delete(),
        membership: FieldValue.delete(),
        photoUrls: [],
        username: '',
        fullName: '',
        email: '',
        whatsapp: '',
        phone: '',
        instagram: '',
        about: '',
        expectations: '',
        details: FieldValue.delete(),
        updatedAt: now,
      },
      { merge: true }
    );

    await batch.commit();

    // 2) Auth hesabını sil
    try {
      await auth.deleteUser(uid);
    } catch (e) {
      // Eğer user auth tarafında zaten silinmişse, yine de ok sayabiliriz.
      const code = String(e?.code || '');
      if (!code.includes('auth/user-not-found')) throw e;
    }

    // 3) Son olarak matchmakingUsers doc'unu tamamen silmeyi dene.
    // (Sanitize + delete yaklaşımı ile veri minimizasyonu sağlarız.)
    try {
      await userRef.delete();
    } catch {
      // ignore
    }

    try {
      await db.collection('accountDeletionLogs').add({
        uid,
        email: safeStr(userData?.email) || safeStr(decoded?.email),
        fullName: safeStr(userData?.fullName),
        username: safeStr(userData?.username),
        whatsapp: safeStr(userData?.whatsapp),
        source: 'self_service',
        deletedAt: now,
      });
    } catch {
      // Log kaydı başarısız olsa da hesap silme işlemini geri alma.
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
