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
    const textRaw = safeStr(body?.text);
    const text = textRaw ? textRaw.slice(0, 260) : '';

    if (!uid || !targetUid || uid === targetUid || !text) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    if (text.length > 240) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'short_message_too_long' }));
      return;
    }

    if (containsContactLikeText(text)) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'filtered' }));
      return;
    }

    const { db, FieldValue } = getAdmin();

    // Sender eligibility (üyelik vb). Alıcıyı zorlamıyoruz.
    const meUserSnap = await db.collection('matchmakingUsers').doc(uid).get();
    const meUser = meUserSnap.exists ? (meUserSnap.data() || {}) : {};

    const myAppsSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get();
    const myApps = myAppsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const myApp = pickBestNonStubApplication(myApps);

    ensureEligibleOrThrow(meUser, safeStr(myApp?.gender));

    const now = Date.now();

    const myPhotoUrls = Array.isArray(myApp?.photoUrls)
      ? myApp.photoUrls.filter((u) => typeof u === 'string' && u.trim()).slice(0, 3)
      : [];

    const fromProfile = {
      username: safeStr(myApp?.username),
      age: asNum(myApp?.age),
      city: safeStr(myApp?.city),
      photoUrl: safeStr(myPhotoUrls[0] || ''),
    };

    const inboxRef = db.collection('matchmakingUsers').doc(targetUid).collection('inboxMessages').doc();
    const outboxRef = db.collection('matchmakingUsers').doc(uid).collection('outboxMessages').doc(inboxRef.id);

    const payload = {
      type: 'direct_message',
      status: 'delivered',
      fromUid: uid,
      toUid: targetUid,
      fromProfile,
      text,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: now,
      readAtMs: 0,
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMs: now,
    };

    await db.runTransaction(async (tx) => {
      tx.set(inboxRef, payload, { merge: true });
      tx.set(outboxRef, payload, { merge: true });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, messageId: inboxRef.id }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
