import { getAdmin } from './_firebaseAdmin.js';

function nowMinuteKey(ts = Date.now()) {
  // UTC minute bucket
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}${m}${day}_${hh}${mm}`;
}

export async function checkAndRecordGeminiTranslateRpm({ limitPerMinute = 15, context = {} } = {}) {
  const key = nowMinuteKey();
  const { db, FieldValue } = getAdmin();

  const ref = db.collection('serviceRateLimits').doc(`gemini_translate_${key}`);

  let nextCount = 0;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? (snap.data() || {}) : {};
    const count = typeof cur.count === 'number' && Number.isFinite(cur.count) ? cur.count : 0;
    nextCount = count + 1;

    tx.set(
      ref,
      {
        key,
        count: FieldValue.increment(1),
        updatedAtMs: Date.now(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    if (nextCount === limitPerMinute + 1) {
      const alertRef = db.collection('matchmakingSystemAlerts').doc(`gemini_translate_rpm_${key}`);
      tx.set(
        alertRef,
        {
          type: 'gemini_translate_rpm_exceeded',
          key,
          limitPerMinute,
          count: nextCount,
          createdAtMs: Date.now(),
          createdAt: FieldValue.serverTimestamp(),
          context: context && typeof context === 'object' ? context : {},
          status: 'new',
        },
        { merge: true }
      );
    }
  });

  if (nextCount > limitPerMinute) {
    const err = new Error('translate_rate_limited');
    err.statusCode = 429;
    err.details = { rpmLimit: limitPerMinute, minuteKey: key, count: nextCount };
    throw err;
  }

  return { ok: true, minuteKey: key, count: nextCount, rpmLimit: limitPerMinute };
}
