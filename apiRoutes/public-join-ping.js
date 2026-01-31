import { getAdmin, requireIdToken } from './_firebaseAdmin.js';

function nowMs() {
  return Date.now();
}

function dayKeyUTC(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
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
    const uid = safeStr(decoded?.uid);
    if (!uid) {
      res.statusCode = 401;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'invalid_auth' }));
      return;
    }

    const { db, FieldValue } = getAdmin();
    const ts = nowMs();
    const dKey = dayKeyUTC(ts);

    // Dedup: at most 1 public join event per user per UTC day.
    const userRef = db.collection('publicJoinUsers').doc(uid);
    const eventRef = db.collection('publicJoinEvents').doc();

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const cur = snap.exists ? (snap.data() || {}) : {};
      const lastDayKey = safeStr(cur?.lastDayKey);

      if (lastDayKey === dKey) {
        // already recorded today
        tx.set(
          userRef,
          {
            lastSeenAtMs: ts,
            lastSeenAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return;
      }

      tx.set(
        userRef,
        {
          lastDayKey: dKey,
          lastSeenAtMs: ts,
          lastSeenAt: FieldValue.serverTimestamp(),
          updatedAtMs: ts,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Public event contains NO uid and no PII.
      tx.set(
        eventRef,
        {
          createdAtMs: ts,
          createdAt: FieldValue.serverTimestamp(),
          kind: 'join',
          // Optional coarse fields (safe):
          locale: safeStr(decoded?.firebase?.sign_in_provider) ? 'auth' : '',
        },
        { merge: true }
      );
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
