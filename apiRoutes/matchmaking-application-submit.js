import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { detectPII } from './_pii.js';
import { isTranslateConfigured, translateTextProfile } from './_translate.js';

const MAX_TEXT_LEN = 1800;
const TRANSLATE_CHARS = 400;
const MIN_TRANSLATE_CHARS = 30;

function safeStr(value, maxLen) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return typeof maxLen === 'number' && maxLen > 0 && s.length > maxLen ? s.slice(0, maxLen) : s;
}

function normalizeProfileLang(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'tr' || s === 'id') return s;
  return '';
}

function oppositeLang(lang) {
  return lang === 'tr' ? 'id' : 'tr';
}

function detectForbiddenContactPII(text) {
  const pii = detectPII(text);
  const reasons = Array.isArray(pii?.reasons) ? pii.reasons : [];
  const forbidden = reasons.filter((r) => r && r !== 'name');
  return {
    hasForbidden: forbidden.length > 0,
    reasons: forbidden,
  };
}

async function buildBilingualText(text, sourceLang) {
  const original = safeStr(text, MAX_TEXT_LEN);
  const src = normalizeProfileLang(sourceLang) || 'tr';
  const target = oppositeLang(src);

  const out = {
    sourceLang: src,
    targetLang: target,
    original,
    tr: src === 'tr' ? original : '',
    id: src === 'id' ? original : '',
    translated: false,
    skipped: false,
    truncated: false,
    translateConfigured: isTranslateConfigured(),
  };

  if (!original) {
    out.skipped = true;
    return out;
  }

  if (original.length < MIN_TRANSLATE_CHARS) {
    out.skipped = true;
    return out;
  }

  if (!out.translateConfigured) {
    out.skipped = true;
    return out;
  }

  const chunk = original.slice(0, TRANSLATE_CHARS);
  out.truncated = original.length > TRANSLATE_CHARS;

  const translated = await translateTextProfile({ text: chunk, targetLang: target });
  const finalText = out.truncated && translated ? `${translated}…` : translated;

  if (target === 'tr') out.tr = finalText;
  if (target === 'id') out.id = finalText;
  out.translated = !!safeStr(finalText);

  return out;
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const decoded = await requireIdToken(req);
  const uid = safeStr(decoded?.uid);
  if (!uid) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
    return;
  }

  const body = normalizeBody(req);
  const docId = safeStr(body?.docId, 120);
  const payload = body?.payload && typeof body.payload === 'object' ? body.payload : {};

  if (!docId) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
    return;
  }

  const sourceLang = normalizeProfileLang(payload?.lang) || 'tr';

  const about = safeStr(payload?.about, MAX_TEXT_LEN);
  const expectations = safeStr(payload?.expectations, MAX_TEXT_LEN);

  if (!about || !expectations) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
    return;
  }

  // PII: contact/banking/identity info completely forbidden.
  for (const [field, value] of [
    ['about', about],
    ['expectations', expectations],
  ]) {
    const pii = detectForbiddenContactPII(value);
    if (pii.hasForbidden) {
      res.statusCode = 422;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'profile_text_pii_blocked', field, reasons: pii.reasons }));
      return;
    }
  }

  const { db, FieldValue } = getAdmin();
  const nowMs = Date.now();

  const [meSnap, existingAppIdSnap, anyAppSnap] = await Promise.all([
    db.collection('matchmakingUsers').doc(uid).get(),
    db.collection('matchmakingApplications').doc(docId).get(),
    db.collection('matchmakingApplications').where('userId', '==', uid).limit(1).get(),
  ]);

  const me = meSnap.exists ? meSnap.data() || {} : {};

  if (me?.blocked) {
    res.statusCode = 403;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'blocked' }));
    return;
  }

  const usedMs = typeof me?.profileTextWriteOnceUsedAtMs === 'number' && Number.isFinite(me.profileTextWriteOnceUsedAtMs)
    ? me.profileTextWriteOnceUsedAtMs
    : 0;
  if (usedMs > 0) {
    res.statusCode = 409;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'profile_text_write_once_used' }));
    return;
  }

  // If user already has ANY application, treat profile texts as already written.
  if (!anyAppSnap.empty) {
    await db.collection('matchmakingUsers').doc(uid).set(
      {
        profileTextWriteOnceUsedAt: FieldValue.serverTimestamp(),
        profileTextWriteOnceUsedAtMs: nowMs,
      },
      { merge: true }
    );

    res.statusCode = 409;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'already_submitted' }));
    return;
  }

  if (existingAppIdSnap.exists) {
    const cur = existingAppIdSnap.data() || {};
    const owner = safeStr(cur?.userId);
    res.statusCode = 409;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: owner && owner !== uid ? 'username_taken' : 'already_submitted' }));
    return;
  }

  const [aboutBi, expBi] = await Promise.all([
    buildBilingualText(about, sourceLang),
    buildBilingualText(expectations, sourceLang),
  ]);

  const appRef = db.collection('matchmakingApplications').doc(docId);
  const userRef = db.collection('matchmakingUsers').doc(uid);

  const appData = {
    ...(payload && typeof payload === 'object' ? payload : {}),

    // Server-authoritative fields
    userId: uid,
    createdAt: FieldValue.serverTimestamp(),
    createdAtMs: nowMs,
    status: 'new',

    // Original texts
    about,
    expectations,
    profileTextLang: sourceLang,

    // Bilingual stored texts
    aboutTr: aboutBi.tr,
    aboutId: aboutBi.id,
    expectationsTr: expBi.tr,
    expectationsId: expBi.id,

    // Meta
    profileTextWriteOnceUsedAtMs: nowMs,
    profileTextTranslatedAtMs: nowMs,
    profileTextTranslate: {
      about: {
        sourceLang: aboutBi.sourceLang,
        targetLang: aboutBi.targetLang,
        translated: aboutBi.translated,
        skipped: aboutBi.skipped,
        truncated: aboutBi.truncated,
        translateConfigured: aboutBi.translateConfigured,
      },
      expectations: {
        sourceLang: expBi.sourceLang,
        targetLang: expBi.targetLang,
        translated: expBi.translated,
        skipped: expBi.skipped,
        truncated: expBi.truncated,
        translateConfigured: expBi.translateConfigured,
      },
    },
  };

  // Ensure client cannot backdate pool timestamps / override consent flags etc.
  // Keep existing payload fields but set a few critical ones on server.
  appData.pool = {
    ...(payload?.pool && typeof payload.pool === 'object' ? payload.pool : {}),
    active: true,
    addedAt: FieldValue.serverTimestamp(),
    addedAtMs: nowMs,
    reason: 'apply_submit',
  };

  const batch = db.batch();
  batch.create(appRef, appData);
  batch.set(
    userRef,
    {
      details: {
        about,
        bio: about,
        expectations,
        aboutTr: aboutBi.tr,
        aboutId: aboutBi.id,
        expectationsTr: expBi.tr,
        expectationsId: expBi.id,
      },
      publicProfile: {
        about,
        expectations,
        aboutTr: aboutBi.tr,
        aboutId: aboutBi.id,
        expectationsTr: expBi.tr,
        expectationsId: expBi.id,
      },
      profileTextLang: sourceLang,
      profileTextWriteOnceUsedAt: FieldValue.serverTimestamp(),
      profileTextWriteOnceUsedAtMs: nowMs,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      applicationId: docId,
      translated: {
        about: aboutBi.translated,
        expectations: expBi.translated,
      },
    })
  );
}
