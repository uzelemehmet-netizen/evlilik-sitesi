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

function pickBestNonStubApplication(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;

  const scored = list
    .map((a) => {
      const source = safeStr(a?.source).toLowerCase();
      const isStub = source === 'auto_stub';
      const ms =
        (typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0) ||
        tsToMs(a?.createdAt);
      const score = (isStub ? 0 : 1000) + (ms > 0 ? ms : 0);
      return { a, isStub, score };
    })
    .sort((x, y) => y.score - x.score);

  const best = scored.find((x) => !x.isStub) || null;
  return best ? best.a : null;
}

function ageRangeFromApp(app) {
  const age = asNum(app?.age);
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
  const requesterAge = asNum(requesterApp?.age);
  if (requesterAge === null) return { ok: false, reason: 'age_required' };

  const { min, max } = ageRangeFromApp(targetApp);
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
      res.end(JSON.stringify({ ok: false, error: interact.reason }));
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
      age: asNum(myApp?.age),
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
