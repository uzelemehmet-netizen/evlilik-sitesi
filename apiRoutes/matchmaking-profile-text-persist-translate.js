import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';
import { inferProfileTextLang, normalizeProfileLang } from './_matchmakingProfileText.js';
import { translateTextProfile } from './_translate.js';

function safeStr(value, maxLen) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return typeof maxLen === 'number' && maxLen > 0 && s.length > maxLen ? s.slice(0, maxLen) : s;
}

function safeObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeRequestedTargetLang(value) {
  const base = safeStr(value).toLowerCase().split(/[-_]/)[0] || '';
  return base === 'tr' || base === 'id' ? base : '';
}

const MAX_TEXT_LEN = 1800;

function fieldKeys(field) {
  if (field !== 'about' && field !== 'expectations') return null;
  return {
    field,
    trKey: `${field}Tr`,
    idKey: `${field}Id`,
  };
}

async function resolveTranslations({ text, sourceLang, targetLang, trValue, idValue }) {
  const detectedFromText = inferProfileTextLang({ sourceLang: '', original: text, trValue: '', idValue: '' });
  const requestedTargetLang = normalizeRequestedTargetLang(targetLang);

  let nextTr = safeStr(trValue, MAX_TEXT_LEN);
  let nextId = safeStr(idValue, MAX_TEXT_LEN);

  if (!nextTr) {
    nextTr = detectedFromText === 'tr'
      ? text
      : safeStr(await translateTextProfile({ text, targetLang: 'tr', provider: 'gemini' }), MAX_TEXT_LEN);
  }

  if (!nextId) {
    nextId = detectedFromText === 'id'
      ? text
      : safeStr(await translateTextProfile({ text, targetLang: 'id', provider: 'gemini' }), MAX_TEXT_LEN);
  }

  if (requestedTargetLang === 'tr' && nextTr === text && detectedFromText !== 'tr') {
    nextTr = safeStr(await translateTextProfile({ text, targetLang: 'tr', provider: 'gemini' }), MAX_TEXT_LEN);
  }

  if (requestedTargetLang === 'id' && nextId === text && detectedFromText !== 'id') {
    nextId = safeStr(await translateTextProfile({ text, targetLang: 'id', provider: 'gemini' }), MAX_TEXT_LEN);
  }

  return {
    sourceLang: detectedFromText,
    trValue: nextTr,
    idValue: nextId,
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
    const body = normalizeBody(req);
    const uid = safeStr(body?.uid);
    const applicationId = safeStr(body?.applicationId);
    const text = safeStr(body?.text, MAX_TEXT_LEN);
    const sourceLang = normalizeProfileLang(body?.sourceLang);
    const targetLang = normalizeRequestedTargetLang(body?.targetLang);
    const keys = fieldKeys(safeStr(body?.field));

    if (!safeStr(decoded?.uid) || !uid || !applicationId || !text || !keys) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const trValue = safeStr(body?.trValue, MAX_TEXT_LEN);
    const idValue = safeStr(body?.idValue, MAX_TEXT_LEN);
    const { db, FieldValue } = getAdmin();
    const nowMs = Date.now();

    const translated = await resolveTranslations({ text, sourceLang, targetLang, trValue, idValue });
    if (!translated.trValue || !translated.idValue) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'translate_failed' }));
      return;
    }

    const appRef = db.collection('matchmakingApplications').doc(applicationId);
    const userRef = db.collection('matchmakingUsers').doc(uid);
    const userSnap = await userRef.get();
    const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};
    const currentApplication = safeObj(userDoc?.application);
    const currentPublicProfile = safeObj(userDoc?.publicProfile);
    const currentDetails = safeObj(userDoc?.details);

    const patch = {
      [keys.field]: text,
      [keys.trKey]: translated.trValue,
      [keys.idKey]: translated.idValue,
      profileTextTranslatedAtMs: nowMs,
      profileTextBackfilledAtMs: nowMs,
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMs: nowMs,
      ...(translated.sourceLang ? { profileTextLang: translated.sourceLang } : {}),
    };

    await appRef.set(patch, { merge: true });
    await userRef.set(
      {
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: nowMs,
        ...(translated.sourceLang ? { profileTextLang: translated.sourceLang } : {}),
        application: {
          ...currentApplication,
          [keys.field]: text,
          [keys.trKey]: translated.trValue,
          [keys.idKey]: translated.idValue,
          ...(translated.sourceLang ? { profileTextLang: translated.sourceLang } : {}),
        },
        publicProfile: {
          ...currentPublicProfile,
          [keys.field]: text,
          [keys.trKey]: translated.trValue,
          [keys.idKey]: translated.idValue,
          ...(translated.sourceLang ? { profileTextLang: translated.sourceLang } : {}),
        },
        details: {
          ...currentDetails,
          [keys.trKey]: translated.trValue,
          [keys.idKey]: translated.idValue,
        },
      },
      { merge: true }
    );

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        ok: true,
        field: keys.field,
        trValue: translated.trValue,
        idValue: translated.idValue,
        sourceLang: translated.sourceLang || '',
      })
    );
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'translate_failed') }));
  }
}