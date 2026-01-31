import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

const MAX_MESSAGE_LEN = 2400;

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function pickAttachment(a) {
  const o = safeObj(a);
  if (!o) return null;
  const secureUrl = safeStr(o?.secureUrl);
  if (!secureUrl) return null;
  return {
    secureUrl,
    publicId: safeStr(o?.publicId),
    bytes: typeof o?.bytes === 'number' && Number.isFinite(o.bytes) ? o.bytes : null,
    width: typeof o?.width === 'number' && Number.isFinite(o.width) ? o.width : null,
    height: typeof o?.height === 'number' && Number.isFinite(o.height) ? o.height : null,
    format: safeStr(o?.format),
    originalFilename: safeStr(o?.originalFilename),
  };
}

export default async function matchmakingFeedbackSubmit(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const { uid, token } = await requireIdToken(req);
  const body = normalizeBody(req);

  const kind = safeStr(body?.kind).toLowerCase();
  const allowedKinds = new Set(['complaint', 'suggestion', 'bug', 'other']);
  if (!allowedKinds.has(kind)) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'invalid_kind' }));
    return;
  }

  const message = safeStr(body?.message);
  if (!message || message.length < 10) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'message_too_short' }));
    return;
  }
  if (message.length > MAX_MESSAGE_LEN) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'message_too_long' }));
    return;
  }

  const matchId = safeStr(body?.matchId);
  const step = safeStr(body?.step);
  const pagePath = safeStr(body?.pagePath);

  const aboutUserId = safeStr(body?.aboutUserId);
  const contextRaw = safeObj(body?.context) || {};

  const attachments = safeArr(body?.attachments)
    .map(pickAttachment)
    .filter(Boolean)
    .slice(0, 3);

  const admin = getAdmin();
  const db = admin.firestore();

  const ref = db.collection('matchmakingFeedback').doc();

  const now = admin.firestore.FieldValue.serverTimestamp();

  const doc = {
    kind,
    message,
    status: 'new',
    userId: uid,
    userEmail: safeStr(token?.email),

    matchId: matchId || null,
    aboutUserId: aboutUserId || null,
    step: step || null,
    pagePath: pagePath || null,

    context: {
      lang: safeStr(contextRaw?.lang),
      ua: safeStr(contextRaw?.ua),
      tz: safeStr(contextRaw?.tz),
      ref: safeStr(contextRaw?.ref),
      build: safeStr(contextRaw?.build),
    },

    attachments,

    createdAt: now,
    updatedAt: now,
  };

  await ref.set(doc);

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, id: ref.id }));
}
