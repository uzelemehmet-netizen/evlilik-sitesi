import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

const MAX_MESSAGE_LEN = 2400;
const MIN_DEFAULT_MESSAGE_LEN = 10;

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function safeBool(v) {
  if (v === true || v === false) return v;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  }
  return false;
}

function safeInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const next = safeStr(value);
    if (next) return next;
  }
  return '';
}

function pickPrimaryPhotoUrl(...sources) {
  for (const source of sources) {
    const list = safeArr(source)
      .map((item) => safeStr(item))
      .filter(Boolean);
    if (list.length > 0) return list[0];
  }
  return '';
}

function buildReviewerDisplayName(rawName, rawUsername, rawEmail) {
  const fullName = safeStr(rawName);
  if (fullName) {
    const firstName = safeStr(fullName.split(/\s+/)[0]);
    if (firstName) return firstName;
  }

  const username = safeStr(rawUsername).replace(/^@+/, '');
  if (username) return username;

  const email = safeStr(rawEmail);
  const emailLocal = email.includes('@') ? safeStr(email.split('@')[0]) : '';
  return emailLocal || 'Anonim';
}

function maskReviewerName(rawName, rawUsername, rawEmail) {
  const username = safeStr(rawUsername).replace(/^@+/, '');
  if (username) {
    return username.length <= 2 ? `${username[0] || 'U'}*` : `${username.slice(0, 3)}***`;
  }

  const email = safeStr(rawEmail);
  const emailLocal = email.includes('@') ? safeStr(email.split('@')[0]) : '';
  const source = firstNonEmpty(rawName, emailLocal);
  if (!source) return 'Anonim';

  const parts = source
    .split(/\s+/)
    .map((part) => safeStr(part))
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
  }

  const single = parts[0] || source;
  if (single.length <= 2) return `${single.charAt(0).toUpperCase()}*`;
  if (single.length <= 4) return `${single.slice(0, 2)}*`;
  return `${single.slice(0, 3)}***`;
}

function hasPhotoInteractionGate(userDoc, applicationDoc) {
  void userDoc;
  void applicationDoc;
  return false;
}

async function resolveReviewerProfile(db, uid, token) {
  const userSnap = await db.collection('matchmakingUsers').doc(uid).get();
  const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};
  const publicProfile = safeObj(userDoc?.publicProfile) || {};
  const applicationCache = safeObj(userDoc?.application) || {};
  const details = safeObj(userDoc?.details) || {};

  const applicationId = firstNonEmpty(userDoc?.applicationId, applicationCache?.applicationId, applicationCache?.id);
  let applicationDoc = {};
  if (applicationId) {
    const appSnap = await db.collection('matchmakingApplications').doc(applicationId).get();
    applicationDoc = appSnap.exists ? (appSnap.data() || {}) : {};
  }

  if (hasPhotoInteractionGate(userDoc, applicationDoc)) {
    const err = new Error('deferred_photo_required');
    err.statusCode = 403;
    throw err;
  }

  const fullName = firstNonEmpty(
    userDoc?.fullName,
    publicProfile?.fullName,
    applicationCache?.fullName,
    applicationDoc?.fullName,
    token?.name
  );
  const username = firstNonEmpty(
    userDoc?.username,
    publicProfile?.username,
    applicationCache?.username,
    applicationDoc?.username
  );
  const city = firstNonEmpty(
    userDoc?.city,
    publicProfile?.city,
    applicationCache?.city,
    details?.city,
    applicationDoc?.city
  );
  const country = firstNonEmpty(
    userDoc?.country,
    publicProfile?.country,
    applicationCache?.country,
    details?.country,
    applicationDoc?.country
  );
  const userCode = firstNonEmpty(userDoc?.userCode, publicProfile?.userCode, applicationCache?.userCode, applicationDoc?.userCode);
  const photoUrl = pickPrimaryPhotoUrl(
    applicationCache?.photoUrls,
    publicProfile?.photoUrls,
    userDoc?.photoUrls,
    applicationDoc?.photoUrls
  );

  return {
    fullName,
    username,
    city,
    country,
    userCode,
    photoUrl,
    displayName: buildReviewerDisplayName(fullName, username, token?.email),
    maskedName: maskReviewerName(fullName, username, token?.email),
  };
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
  const allowedKinds = new Set(['complaint', 'suggestion', 'bug', 'other', 'review']);
  if (!allowedKinds.has(kind)) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'invalid_kind' }));
    return;
  }

  const isReview = kind === 'review';
  const skipped = isReview && body?.skipped === true;

  const message = safeStr(body?.message);
  if (!skipped && !isReview && (!message || message.length < MIN_DEFAULT_MESSAGE_LEN)) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'message_too_short' }));
    return;
  }
  if (!skipped && message.length > MAX_MESSAGE_LEN) {
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

  const { db, FieldValue } = getAdmin();
  const rating = Math.max(0, Math.min(5, safeInt(body?.rating, 0)));
  if (isReview && !skipped && (rating < 1 || rating > 5)) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'invalid_rating' }));
    return;
  }

  const reviewerProfile = isReview ? await resolveReviewerProfile(db, uid, token) : null;

  const ref = db.collection('matchmakingFeedback').doc();

  const now = FieldValue.serverTimestamp();

  const doc = {
    kind,
    message: skipped ? '' : message,
    // Admin Moderation UI currently renders `text`; keep it populated.
    text: skipped ? '' : message,
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

    ...(isReview
      ? {
        review: {
          rating: skipped ? 0 : rating,
          publicConsent: true,
          publicVisible: false,
          featured: false,
          skipped,
          source: firstNonEmpty(body?.source, 'app_review_prompt'),
          openSource: firstNonEmpty(body?.reviewOpenSource, 'auto_prompt'),
          reviewerName: reviewerProfile?.maskedName || 'Anonim',
          reviewerDisplayName: reviewerProfile?.displayName || reviewerProfile?.maskedName || 'Anonim',
          reviewerCity: reviewerProfile?.city || '',
          reviewerCountry: reviewerProfile?.country || '',
          reviewerUserCode: reviewerProfile?.userCode || '',
          reviewerPhotoUrl: reviewerProfile?.photoUrl || '',
        },
      }
      : {}),

    createdAt: now,
    updatedAt: now,
  };

  await ref.set(doc);

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, id: ref.id }));
}
