import { getAdmin, requireIdToken } from './_firebaseAdmin.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function pickInviterName(userDoc) {
  const u = userDoc && typeof userDoc === 'object' ? userDoc : {};
  const app = u.application && typeof u.application === 'object' ? u.application : null;
  const pp = u.publicProfile && typeof u.publicProfile === 'object' ? u.publicProfile : null;
  const details = u.details && typeof u.details === 'object' ? u.details : null;

  return (
    safeStr(u.fullName) ||
    safeStr(app?.fullName) ||
    safeStr(pp?.displayName) ||
    safeStr(pp?.name) ||
    safeStr(details?.fullName) ||
    safeStr(u.username) ||
    safeStr(app?.username) ||
    ''
  );
}

function random4DigitCode() {
  // 0000 dahil (basit). İsterseniz 1000-9999'e daraltabiliriz.
  const n = Math.floor(Math.random() * 10000);
  return String(n).padStart(4, '0');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('allow', 'POST');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const decoded = await requireIdToken(req);
    const inviterUid = safeStr(decoded?.uid);
    const inviterEmail = safeStr(decoded?.email);

    if (!inviterUid) {
      const err = new Error('missing_auth');
      err.statusCode = 401;
      throw err;
    }

    const { db, FieldValue } = getAdmin();

    const inviterSnap = await db.collection('matchmakingUsers').doc(inviterUid).get();
    const inviterUser = inviterSnap.exists ? inviterSnap.data() || {} : {};

    const inviterUserCode = safeStr(inviterUser?.userCode);
    const inviterName = pickInviterName(inviterUser);

    const now = Date.now();

    let code = '';
    let attempts = 0;

    while (!code && attempts < 15) {
      attempts += 1;
      const cand = random4DigitCode();
      const ref = db.collection('matchmakingInviteCodes').doc(cand);

      try {
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          if (snap.exists) {
            // collision
            return;
          }

          tx.set(
            ref,
            {
              code: cand,
              status: 'created',
              inviterUid,
              inviterEmail: inviterEmail || null,
              inviterUserCode: inviterUserCode || null,
              inviterName: inviterName || null,
              createdAt: FieldValue.serverTimestamp(),
              createdAtMs: now,
              updatedAt: FieldValue.serverTimestamp(),
              updatedAtMs: now,
            },
            { merge: false }
          );

          code = cand;
        });
      } catch (e) {
        // transaction failed; retry
      }
    }

    if (!code) {
      const err = new Error('invite_code_generation_failed');
      err.statusCode = 503;
      throw err;
    }

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, code }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
