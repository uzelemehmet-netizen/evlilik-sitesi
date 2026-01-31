import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asObj(v) {
  return v && typeof v === 'object' ? v : {};
}

function tsToMs(v) {
  if (!v) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v?.toMillis === 'function') {
    try {
      return v.toMillis();
    } catch {
      return 0;
    }
  }
  const seconds = typeof v?.seconds === 'number' ? v.seconds : null;
  const nanoseconds = typeof v?.nanoseconds === 'number' ? v.nanoseconds : 0;
  if (seconds !== null) return Math.floor(seconds * 1000 + nanoseconds / 1e6);
  return 0;
}

const MIN_AGE = 18;

function toNumOrNull(v, { min, max } = {}) {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  if (typeof min === 'number' && n < min) return null;
  if (typeof max === 'number' && n > max) return null;
  return n;
}

function ageFromBirthYearMaybe(v) {
  const year = toNumOrNull(v, { min: 1900, max: 2100 });
  if (year === null) return null;
  const now = new Date();
  const age = now.getFullYear() - year;
  return age >= MIN_AGE && age <= 99 ? age : null;
}

function ageFromDateMaybe(v) {
  let d = null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    d = new Date(v);
  } else if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return null;
    const parsed = Date.parse(s);
    if (Number.isFinite(parsed)) d = new Date(parsed);
  } else if (typeof v?.toDate === 'function') {
    try {
      d = v.toDate();
    } catch {
      d = null;
    }
  }

  if (!d || Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= MIN_AGE && age <= 99 ? age : null;
}

function getAge(app) {
  const direct = toNumOrNull(app?.age, { min: MIN_AGE, max: 99 });
  if (direct !== null) return direct;

  const details = app?.details || {};
  const nested = toNumOrNull(details?.age, { min: MIN_AGE, max: 99 });
  if (nested !== null) return nested;

  const byYear = ageFromBirthYearMaybe(details?.birthYear ?? app?.birthYear);
  if (byYear !== null) return byYear;

  const byDate =
    ageFromDateMaybe(details?.birthDateMs ?? app?.birthDateMs) ??
    ageFromDateMaybe(details?.birthDate ?? app?.birthDate) ??
    ageFromDateMaybe(details?.dob ?? app?.dob);
  if (byDate !== null) return byDate;

  return null;
}

function pickBestNonStubApplication(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;

  const scored = list
    .map((a) => {
      const source = safeStr(a?.source).toLowerCase();
      const isStub = source === 'auto_stub';
      const hasAge = getAge(a) !== null;
      const hasEditOnce = !!a?.userEditOnceUsedAt;
      const ms =
        (typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0) ||
        tsToMs(a?.createdAt);
      // Yaş alanı bazı eski doc'larda eksik olabiliyor. Yaş yoksa yanlış "age mismatch" üretebiliyor.
      // Bu yüzden "hasAge" çok daha güçlü bir sinyal: gerekirse stub doc olsa bile yaşlı olanı seç.
      const score =
        (hasAge ? 1_000_000_000 : 0) +
        (isStub ? 0 : 1_000_000) +
        (hasEditOnce ? 10_000 : 0) +
        (ms > 0 ? ms : 0);
      return { a, isStub, score };
    })
    .sort((x, y) => y.score - x.score);

  const bestNonStub = scored.find((x) => !x.isStub) || null;
  return (bestNonStub || scored[0] || null) ? (bestNonStub ? bestNonStub.a : scored[0].a) : null;
}

function ageRangeFromApp(app, { ageOverride = null } = {}) {
  const age = typeof ageOverride === 'number' && Number.isFinite(ageOverride) ? ageOverride : getAge(app);
  const partner = asObj(app?.partnerPreferences);

  const sanitizePref = (n) => (n !== null && n >= 18 && n <= 99 ? n : null);
  const min = sanitizePref(asNum(partner?.ageMin));
  const max = sanitizePref(asNum(partner?.ageMax));
  if (min !== null || max !== null) {
    const a = age ?? 30;
    const outMin = min !== null ? min : Math.max(18, a - 5);
    const outMax = max !== null ? max : Math.min(99, a + 5);
    const finalMin = Math.max(18, Math.min(99, outMin));
    let finalMax = Math.max(18, Math.min(99, outMax));
    if (finalMax < finalMin) finalMax = finalMin;
    return { min: finalMin, max: finalMax };
  }

  const olderRaw = asNum(partner?.ageMaxOlderYears);
  const youngerRaw = asNum(partner?.ageMaxYoungerYears);
  const older = olderRaw !== null && olderRaw >= 0 && olderRaw <= 99 ? olderRaw : null;
  const younger = youngerRaw !== null && youngerRaw >= 0 && youngerRaw <= 99 ? youngerRaw : null;
  if (age !== null && (older !== null || younger !== null)) {
    // Asimetrik kural: kullanıcı sadece +older veya sadece -younger tanımladıysa
    // diğer taraf varsayılan olarak 0 kabul edilir (5'e tamamlanmaz).
    const outMin = age - (younger ?? 0);
    const outMax = age + (older ?? 0);
    const finalMin = Math.max(18, Math.min(99, outMin));
    let finalMax = Math.max(18, Math.min(99, outMax));
    if (finalMax < finalMin) finalMax = finalMin;
    return { min: finalMin, max: finalMax };
  }

  const a = age ?? 30;
  const finalMin = Math.max(18, Math.min(99, a - 5));
  let finalMax = Math.max(18, Math.min(99, a + 5));
  if (finalMax < finalMin) finalMax = finalMin;
  return { min: finalMin, max: finalMax };
}

function canInteractByAge({ requesterApp, targetApp }) {
  const requesterAge = getAge(requesterApp);
  if (requesterAge === null) return { ok: false, reason: 'age_required' };

  const { min, max } = ageRangeFromApp(targetApp, { ageOverride: getAge(targetApp) });
  if (requesterAge < min || requesterAge > max) return { ok: false, reason: 'not_in_their_age_range' };
  return { ok: true };
}

function buildAccessRequestPayload({ FieldValue, fromUid, toUid, fromProfile, nowMs }) {
  const p = fromProfile && typeof fromProfile === 'object' ? fromProfile : null;
  return {
    type: 'profile_access',
    status: 'pending',
    fromUid: String(fromUid || ''),
    toUid: String(toUid || ''),
    fromProfile: p || null,
    createdAt: FieldValue.serverTimestamp(),
    createdAtMs: typeof nowMs === 'number' && Number.isFinite(nowMs) ? nowMs : Date.now(),
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtMs: typeof nowMs === 'number' && Number.isFinite(nowMs) ? nowMs : Date.now(),
  };
}

function containsContactLikeText(text) {
  const s = String(text || '').toLowerCase();

  if (/https?:\/\//i.test(s) || /www\./i.test(s) || /\b[a-z0-9-]+\.(com|net|org|id|tr|me)\b/i.test(s)) return true;
  if (/(instagram|insta|\big\b|facebook|\bfb\b|telegram|\bt\.me\b|whatsapp|\bwa\.me\b|line\b|tiktok|discord)/i.test(s)) return true;
  if (/@[a-z0-9_\.]{2,}/i.test(s)) return true;

  const digitsOnly = s.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 8) {
    if (/\+\s*\d{8,}/.test(s)) return true;
    if (digitsOnly.length >= 10) return true;
    if (/(\d[\s\-\.\(\)]*){8,}/.test(s)) return true;
  }

  return false;
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = safeStr(decoded?.uid);

    const body = normalizeBody(req);
    const targetUid = safeStr(body?.targetUid);
    const messageTextRaw = safeStr(body?.messageText);
    const messageText = messageTextRaw ? messageTextRaw.slice(0, 260) : '';

    if (!uid || !targetUid || uid === targetUid) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    if (messageText && messageText.length > 240) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'short_message_too_long' }));
      return;
    }

    if (messageText && containsContactLikeText(messageText)) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'filtered' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    const [myAppsSnap, targetAppsSnap] = await Promise.all([
      db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get(),
      db.collection('matchmakingApplications').where('userId', '==', targetUid).limit(10).get(),
    ]);

    const myApps = myAppsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const targetApps = targetAppsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

    const myApp = pickBestNonStubApplication(myApps);
    const targetApp = pickBestNonStubApplication(targetApps);

    if (!myApp || !targetApp) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'application_not_found' }));
      return;
    }

    // Etkileşim kuralı: profil detay izni istemek bir aksiyon sayılır.
    // Alıcı için eligibility zorlamıyoruz; sadece göndereni kontrol ediyoruz.
    try {
      const meUserSnap = await db.collection('matchmakingUsers').doc(uid).get();
      const meUser = meUserSnap.exists ? (meUserSnap.data() || {}) : {};
      ensureEligibleOrThrow(meUser, safeStr(myApp?.gender));
    } catch (e2) {
      res.statusCode = e2?.statusCode || 402;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: String(e2?.message || 'membership_required') }));
      return;
    }

    const interact = canInteractByAge({ requesterApp: myApp, targetApp });
    if (!interact.ok) {
      res.statusCode = interact.reason === 'age_required' ? 400 : 403;
      res.setHeader('content-type', 'application/json');
      const debugEnabled = String(process.env.NODE_ENV || '').toLowerCase() !== 'production';
      if (debugEnabled) {
        const requesterAge = getAge(myApp);
        const targetAge = getAge(targetApp);
        const range = ageRangeFromApp(targetApp, { ageOverride: targetAge });
        res.end(
          JSON.stringify({
            ok: false,
            error: interact.reason,
            debug: {
              requesterAge,
              targetAge,
              targetRange: range,
              targetPartnerPreferences: {
                ageMin: asNum(asObj(targetApp?.partnerPreferences)?.ageMin),
                ageMax: asNum(asObj(targetApp?.partnerPreferences)?.ageMax),
                ageMaxOlderYears: asNum(asObj(targetApp?.partnerPreferences)?.ageMaxOlderYears),
                ageMaxYoungerYears: asNum(asObj(targetApp?.partnerPreferences)?.ageMaxYoungerYears),
              },
            },
          })
        );
      } else {
        res.end(JSON.stringify({ ok: false, error: interact.reason }));
      }
      return;
    }

    const now = Date.now();
    const requestId = `${uid}__${targetUid}`;

    const inboxRef = db.collection('matchmakingUsers').doc(targetUid).collection('inboxAccessRequests').doc(requestId);
    const outboxRef = db.collection('matchmakingUsers').doc(uid).collection('outboxAccessRequests').doc(requestId);
    const grantedToTargetRef = db.collection('matchmakingUsers').doc(targetUid).collection('profileAccessGranted').doc(uid);

    const myPhotoUrls = Array.isArray(myApp?.photoUrls)
      ? myApp.photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 3)
      : [];

    const fromProfile = {
      username: safeStr(myApp?.username),
      age: getAge(myApp),
      city: safeStr(myApp?.city),
      photoUrl: safeStr(myPhotoUrls[0] || ''),
    };

    let status = 'pending';

    await db.runTransaction(async (tx) => {
      const grantedSnap = await tx.get(grantedToTargetRef);
      if (grantedSnap.exists) {
        status = 'granted';
        return;
      }

      const inboxSnap = await tx.get(inboxRef);
      if (inboxSnap.exists) {
        const cur = inboxSnap.data() || {};
        const curStatus = safeStr(cur?.status);
        const curMsg = safeStr(cur?.messageText);

        // Idempotent: mevcut durum zaten uygunsa tekrar yazma.
        if (curStatus === 'approved') {
          status = 'approved';
          return;
        }

        if (curStatus === 'pending') {
          status = 'pending';

          // pending iken best-effort güncelle (profil snapshot + updatedAt)
          const patch = {
            fromProfile,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: now,
          };

          // Eğer bu istek daha önce mesajsızsa ve şimdi mesaj geldiyse ekle.
          // Mesaj varsa overwrite etmeyelim (spam riskini azaltmak için).
          if (messageText && !curMsg) {
            patch.messageText = messageText;
            patch.messageCreatedAt = FieldValue.serverTimestamp();
            patch.messageCreatedAtMs = now;
            patch.messageReadAtMs = 0;
          }

          tx.set(inboxRef, patch, { merge: true });
          tx.set(outboxRef, patch, { merge: true });
          return;
        }
        // rejected veya bilinmeyen => yeniden pending'e düşür (yeni istek)
      }

      const payload = {
        ...buildAccessRequestPayload({ FieldValue, fromUid: uid, toUid: targetUid, fromProfile, nowMs: now }),
        requestId,
        ...(messageText
          ? {
              messageText,
              messageCreatedAt: FieldValue.serverTimestamp(),
              messageCreatedAtMs: now,
              messageReadAtMs: 0,
            }
          : {}),
      };

      tx.set(inboxRef, payload, { merge: true });
      tx.set(outboxRef, payload, { merge: true });
      status = 'pending';
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status, requestId }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
