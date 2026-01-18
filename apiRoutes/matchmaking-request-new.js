import { getAdmin, requireIdToken } from './_firebaseAdmin.js';
import { ensureEligibleOrThrow, normalizeGender } from './_matchmakingEligibility.js';

function nowMs() {
  return Date.now();
}

function dayKeyUtc(ts) {
  try {
    return new Date(typeof ts === 'number' ? ts : Date.now()).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

async function resolveGenderFromAnyApplication(db, uid) {
  try {
    const snap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(1).get();
    const doc = snap?.docs?.[0];
    if (!doc) return '';
    const data = doc.data() || {};
    return typeof data?.gender === 'string' ? data.gender.trim() : '';
  } catch {
    return '';
  }
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

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingUsers').doc(uid);

    // Transaction içinde query yapmamak için gender fallback’ını burada çöz.
    const genderFallback = normalizeGender(await resolveGenderFromAnyApplication(db, uid));

    const ts = nowMs();
    const limit = 3;
    const today = dayKeyUtc(ts);

    let result = { remaining: limit, limit, dayKey: today, count: 0 };

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? (snap.data() || {}) : {};

      // Eligibility: özellikle kadın kullanıcılar için (paid OR (verified + freeActive)).
      const g = normalizeGender(data?.gender) || genderFallback;
      ensureEligibleOrThrow(data, g);

      const totalPrev = typeof data?.newMatchRequestTotalCount === 'number' ? data.newMatchRequestTotalCount : 0;

      const q = data?.newMatchRequestQuota || {};
      const qDayKey = typeof q?.dayKey === 'string' ? q.dayKey : '';
      const qCount = typeof q?.count === 'number' ? q.count : 0;

      const count = qDayKey === today ? qCount : 0;
      if (count >= limit) {
        const err = new Error('quota_exhausted');
        err.statusCode = 429;
        throw err;
      }

      const nextCount = count + 1;
      result = {
        remaining: Math.max(0, limit - nextCount),
        limit,
        dayKey: today,
        count: nextCount,
      };

      tx.set(
        ref,
        {
          requestedNewMatchAt: FieldValue.serverTimestamp(),
          requestedNewMatchAtMs: ts,
          newMatchRequestTotalCount: totalPrev + 1,
          newMatchRequestQuota: {
            dayKey: today,
            count: nextCount,
            limit,
            updatedAt: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, ...result }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
