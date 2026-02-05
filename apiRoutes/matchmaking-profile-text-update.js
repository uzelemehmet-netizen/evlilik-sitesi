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

function asMs(v) {
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
      const source = String(a?.source || '').trim().toLowerCase();
      const isStub = source === 'auto_stub';
      const ms =
        (typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0) ||
        asMs(a?.createdAt);
      const score = (isStub ? 0 : 1000) + (ms > 0 ? ms : 0);
      return { a, isStub, score };
    })
    .sort((x, y) => y.score - x.score);

  const best = scored.find((x) => !x.isStub) || null;
  return best ? best.a : null;
}

export default async function handler(req, res) {
  if (String(req?.method || '').toUpperCase() !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const decoded = await requireIdToken(req);
  const uid = String(decoded?.uid || '').trim();
  if (!uid) {
    res.statusCode = 401;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'unauthenticated' }));
    return;
  }

  const body = normalizeBody(req);
  const about = safeStr(body?.about, MAX_TEXT_LEN);
  const expectations = safeStr(body?.expectations, MAX_TEXT_LEN);
  const sourceLang = normalizeProfileLang(body?.lang) || 'tr';

  if (!about || !expectations) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
    return;
  }

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

  // Basit cooldown (spam önlemek için)
  const meSnap = await db.collection('matchmakingUsers').doc(uid).get();
  const me = meSnap.exists ? (meSnap.data() || {}) : {};

  const usedMs = typeof me?.profileTextWriteOnceUsedAtMs === 'number' && Number.isFinite(me.profileTextWriteOnceUsedAtMs)
    ? me.profileTextWriteOnceUsedAtMs
    : 0;
  if (usedMs > 0) {
    res.statusCode = 409;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'profile_text_write_once_used' }));
    return;
  }

  const lastMs = typeof me?.profileTextsUpdatedAtMs === 'number' && Number.isFinite(me.profileTextsUpdatedAtMs) ? me.profileTextsUpdatedAtMs : 0;
  if (lastMs > 0 && nowMs - lastMs < 10_000) {
    res.statusCode = 429;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'too_many_requests' }));
    return;
  }

  // Kullanıcının en iyi application dokümanını bul (formdan gelen kaynak)
  const appSnap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(10).get();
  const apps = appSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
  const best = pickBestNonStubApplication(apps);

  // Migration safety: existing users already have texts => lock them.
  const alreadyHasTexts = !!safeStr(best?.about, 1) || !!safeStr(best?.expectations, 1);
  if (alreadyHasTexts) {
    await db.collection('matchmakingUsers').doc(uid).set(
      {
        profileTextWriteOnceUsedAt: FieldValue.serverTimestamp(),
        profileTextWriteOnceUsedAtMs: nowMs,
      },
      { merge: true }
    );

    res.statusCode = 409;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'profile_text_write_once_used' }));
    return;
  }

  const [aboutBi, expBi] = await Promise.all([
    buildBilingualText(about, sourceLang),
    buildBilingualText(expectations, sourceLang),
  ]);

  const batch = db.batch();

  // Application varsa onu güncelle (profil endpoint'i buradan okuyor)
  if (best?.id) {
    const appRef = db.collection('matchmakingApplications').doc(best.id);
    batch.set(
      appRef,
      {
        about,
        expectations,
        profileTextLang: sourceLang,
        aboutTr: aboutBi.tr,
        aboutId: aboutBi.id,
        expectationsTr: expBi.tr,
        expectationsId: expBi.id,
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
        userTextsUpdatedAt: FieldValue.serverTimestamp(),
        userTextsUpdatedAtMs: nowMs,
      },
      { merge: true }
    );
  }

  // matchmakingUsers içinde de cache/tanıtım amaçlı tut
  const userRef = db.collection('matchmakingUsers').doc(uid);
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
      profileTextsUpdatedAt: FieldValue.serverTimestamp(),
      profileTextsUpdatedAtMs: nowMs,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}
