import { getAdmin, normalizeBody, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

const QUESTION_KEYS = ['q1', 'q2', 'q3'];

const ALLOWED = {
  q1: new Set(['slow', 'normal', 'fast']),
  q2: new Set(['family', 'balanced', 'independent']),
  q3: new Set(['local', 'open', 'flexible']),
};

function normalizeAnswer(questionKey, value) {
  const q = safeStr(questionKey).toLowerCase();
  const v = safeStr(value).toLowerCase();
  if (!q || !v) return { q: '', v: '' };
  if (!Object.prototype.hasOwnProperty.call(ALLOWED, q)) return { q: '', v: '' };
  if (!ALLOWED[q].has(v)) return { q: '', v: '' };
  return { q, v };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const body = normalizeBody(req);
    const matchId = safeStr(body?.matchId);
    const { q, v } = normalizeAnswer(body?.question, body?.answer);

    if (!matchId || !q || !v) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'bad_request' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const matchRef = db.collection('matchmakingMatches').doc(matchId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(matchRef);
      if (!snap.exists) {
        const err = new Error('not_found');
        err.statusCode = 404;
        throw err;
      }

      const data = snap.data() || {};
      const aUserId = safeStr(data?.aUserId);
      const bUserId = safeStr(data?.bUserId);

      if (uid !== aUserId && uid !== bUserId) {
        const err = new Error('forbidden');
        err.statusCode = 403;
        throw err;
      }

      const status = safeStr(data?.status);
      if (status === 'cancelled') {
        const err = new Error('closed');
        err.statusCode = 410;
        throw err;
      }

      const side = uid === aUserId ? 'a' : 'b';
      const nowMs = Date.now();

      const existing = data?.quickQuestions && typeof data.quickQuestions === 'object' ? data.quickQuestions : {};
      const mine = existing?.[side] && typeof existing[side] === 'object' ? { ...existing[side] } : {};
      const answers = mine?.answers && typeof mine.answers === 'object' ? { ...mine.answers } : {};

      // Only allow known keys
      if (!QUESTION_KEYS.includes(q)) {
        const err = new Error('bad_request');
        err.statusCode = 400;
        throw err;
      }

      answers[q] = v;

      const patch = {
        quickQuestions: {
          ...existing,
          [side]: {
            answers,
            updatedAt: FieldValue.serverTimestamp(),
            updatedAtMs: nowMs,
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      };

      tx.set(matchRef, patch, { merge: true });
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
