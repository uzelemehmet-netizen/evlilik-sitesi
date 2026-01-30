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

function buildFromProfile(app) {
  const myPhotoUrls = Array.isArray(app?.photoUrls)
    ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 3)
    : [];

  return {
    username: safeStr(app?.username),
    age: asNum(app?.age),
    gender: safeStr(app?.gender),
    city: safeStr(app?.city),
    photoUrl: safeStr(myPhotoUrls[0] || ''),
  };
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

    if (!uid || !targetUid || uid === targetUid) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
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

    // Etkileşim kuralı: ön eşleşme isteği bir aksiyon sayılır.
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

    const nowMs = Date.now();
    const requestId = `${uid}__${targetUid}`;

    const inboxRef = db.collection('matchmakingUsers').doc(targetUid).collection('inboxPreMatchRequests').doc(requestId);
    const outboxRef = db.collection('matchmakingUsers').doc(uid).collection('outboxPreMatchRequests').doc(requestId);

    const payload = {
      type: 'pre_match',
      status: 'pending',
      fromUid: uid,
      toUid: targetUid,
      fromProfile: buildFromProfile(myApp),
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: nowMs,
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMs: nowMs,
    };

    await db.runTransaction(async (tx) => {
      const existingOut = await tx.get(outboxRef);
      if (existingOut.exists) {
        const cur = existingOut.data() || {};
        const st = safeStr(cur?.status);
        if (st === 'approved') return;
        if (st === 'rejected') {
          // Reddedildiyse yeni istek atmaya izin veriyoruz (status'u pending'e çeker).
          tx.set(inboxRef, payload, { merge: true });
          tx.set(outboxRef, payload, { merge: true });
          return;
        }
        // pending => sadece updatedAt tazele
        tx.set(inboxRef, payload, { merge: true });
        tx.set(outboxRef, payload, { merge: true });
        return;
      }

      tx.set(inboxRef, payload, { merge: false });
      tx.set(outboxRef, payload, { merge: false });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status: 'pending' }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
