import { getAdmin, normalizeBody } from './_firebaseAdmin.js';

function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeInt(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : fallback;
}

function safeArr(value) {
  return Array.isArray(value) ? value : [];
}

function truncate(value, maxLen = 500) {
  const text = safeStr(value);
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

function getBearerToken(req) {
  const header = req?.headers?.authorization || req?.headers?.Authorization;
  const raw = safeStr(header);
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match ? safeStr(match[1]) : '';
}

async function decodeOptionalUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const { auth } = getAdmin();
    return await auth.verifyIdToken(token);
  } catch {
    return null;
  }
}

function buildAttempts(rawAttempts) {
  return safeArr(rawAttempts)
    .map((attempt) => ({
      stage: truncate(attempt?.stage, 80),
      status: truncate(attempt?.status, 40),
      message: truncate(attempt?.message, 320),
      code: truncate(attempt?.code, 220),
    }))
    .filter((attempt) => attempt.stage || attempt.status || attempt.message || attempt.code)
    .slice(0, 12);
}

export default async function photoUploadFailureReport(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  const body = normalizeBody(req);
  const decoded = await decodeOptionalUser(req);

  const source = truncate(body?.source, 120) || 'unknown';
  const pagePath = truncate(body?.pagePath, 220);
  const folder = truncate(body?.folder, 220);
  const fileName = truncate(body?.fileName, 220);
  const contentType = truncate(body?.contentType, 120);
  const lastError = truncate(body?.lastError, 500) || 'photo_upload_failed';
  const tags = safeArr(body?.tags).map((tag) => truncate(tag, 60)).filter(Boolean).slice(0, 12);
  const attempts = buildAttempts(body?.attempts);
  const language = truncate(body?.language, 40);
  const userAgent = truncate(body?.userAgent, 500);
  const fileSize = Math.max(0, safeInt(body?.fileSize, 0));

  const { db, FieldValue } = getAdmin();

  const doc = {
    kind: 'photo_upload_failure',
    status: 'new',
    step: 'photo_upload',
    source,
    pagePath,
    message: lastError,
    text: [
      `Kaynak: ${source}`,
      pagePath ? `Sayfa: ${pagePath}` : '',
      fileName ? `Dosya: ${fileName}` : '',
      attempts.length ? `Denemeler: ${attempts.map((attempt) => `${attempt.stage}:${attempt.status}`).join(' | ')}` : '',
      `Hata: ${lastError}`,
    ]
      .filter(Boolean)
      .join('\n'),
    userId: safeStr(decoded?.uid),
    userEmail: safeStr(decoded?.email).toLowerCase(),
    context: {
      uploadSource: source,
      folder,
      tags,
      fileName,
      contentType,
      fileSize,
      attempts,
      language,
      userAgent,
    },
    data: {
      report: {
        kind: 'photo_upload_failure',
        code: 'photo_upload_failed',
        message: lastError,
      },
      extra: {
        path: pagePath,
        folder,
        tags,
        filenameHint: fileName,
        contentType,
        fileSize,
        source,
      },
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection('matchmakingFeedback').add(doc);

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
}