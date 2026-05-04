import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

function safeBool(v) {
  if (v === true || v === false) return v;
  if (typeof v === 'string') {
    const normalized = v.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
  }
  return false;
}

export default async function handler(req, res) {
  const method = String(req?.method || '').toUpperCase();
  if (method !== 'GET' && method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = safeStr(decoded?.uid);
    if (!uid) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'invalid_auth' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const body = method === 'POST' ? normalizeBody(req) : null;
    const action = safeStr(body?.action).toLowerCase();
    const userRef = db.collection('matchmakingUsers').doc(uid);

    if (method === 'POST' && action === 'mark_shown') {
      const userSnap = await userRef.get();
      const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};
      const existingPrompt = safeObj(userDoc?.feedback)?.appReviewPrompt;
      const hasShown = !!existingPrompt?.shownAt || safeBool(existingPrompt?.shown);

      if (!hasShown) {
        await userRef.set(
          {
            feedback: {
              appReviewPrompt: {
                shown: true,
                shownAt: FieldValue.serverTimestamp(),
                source: safeStr(body?.source) || 'auto_prompt',
                pagePath: safeStr(body?.pagePath) || null,
              },
            },
          },
          { merge: true }
        );
      }

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.setHeader('cache-control', 'private, max-age=0, no-store');
      res.end(JSON.stringify({ ok: true, state: 'shown', hasShown: true }));
      return;
    }

    const snap = await db.collection('matchmakingFeedback').where('userId', '==', uid).limit(25).get();
    const userSnap = await userRef.get();
    const userDoc = userSnap.exists ? (userSnap.data() || {}) : {};
    const promptMeta = safeObj(userDoc?.feedback)?.appReviewPrompt;

    let hasSubmitted = false;
    let hasSkipped = false;
    const hasShown = !!promptMeta?.shownAt || safeBool(promptMeta?.shown);

    for (const doc of snap.docs) {
      const data = doc.data() || {};
      if (safeStr(data?.kind).toLowerCase() !== 'review') continue;
      const review = safeObj(data?.review) || {};
      if (review?.skipped === true) {
        hasSkipped = true;
        continue;
      }
      hasSubmitted = true;
      break;
    }

    const state = hasSubmitted ? 'submitted' : hasSkipped ? 'skipped' : hasShown ? 'shown' : 'none';

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'private, max-age=0, no-store');
    res.end(JSON.stringify({ ok: true, state, hasSubmitted, hasSkipped, hasShown }));
  } catch (e) {
    res.statusCode = typeof e?.statusCode === 'number' ? e.statusCode : 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: safeStr(e?.message) || 'status_failed' }));
  }
}