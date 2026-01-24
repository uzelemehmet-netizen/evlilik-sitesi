import { getAdmin, requireIdToken } from './_firebaseAdmin.js';

function addDays(date, days) {
  const ms = date.getTime() + days * 24 * 60 * 60 * 1000;
  return new Date(ms);
}

function computeNextValidUntilMs(existingValidUntilMs) {
  const now = Date.now();
  const base = typeof existingValidUntilMs === 'number' && existingValidUntilMs > now ? existingValidUntilMs : now;
  const validUntil = addDays(new Date(base), 30);
  return validUntil.getTime();
}

function promoCutoffMsTR() {
  // "10-Şubat-2026 yılına kadar" ifadesini TR saat dilimi (UTC+03) son gün sonu olarak yorumluyoruz.
  return new Date('2026-02-10T23:59:59.999+03:00').getTime();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const promoEnabledRaw = String(process.env.MATCHMAKING_FREE_PROMO_ENABLED || '').toLowerCase().trim();
    const promoEnabled = promoEnabledRaw === '1' || promoEnabledRaw === 'true' || promoEnabledRaw === 'yes';
    if (!promoEnabled) {
      const err = new Error('promo_disabled');
      err.statusCode = 410;
      throw err;
    }

    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const now = Date.now();
    const cutoffMs = promoCutoffMsTR();

    if (now > cutoffMs) {
      const err = new Error('promo_expired');
      err.statusCode = 402;
      throw err;
    }

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingUsers').doc(uid);

    let validUntilMs = 0;
    let status = 'activated';

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const user = snap.exists ? (snap.data() || {}) : {};

      const existingUntil = typeof user?.membership?.validUntilMs === 'number' ? user.membership.validUntilMs : 0;
      const alreadyActive = !!user?.membership?.active && existingUntil > now;

      if (alreadyActive) {
        validUntilMs = existingUntil;
        status = 'already_active';
        return;
      }

      validUntilMs = computeNextValidUntilMs(existingUntil);

      tx.set(
        ref,
        {
          membership: {
            active: true,
            validUntilMs,
            plan: 'eco',
            lastPromo: {
              type: 'free_activation_until_2026_02_10',
              priceUsd: 20,
              activatedAtMs: now,
              cutoffMs,
            },
          },
          translationPack: {
            active: true,
            plan: 'eco',
            validUntilMs,
            lastPromo: {
              type: 'free_activation_until_2026_02_10',
              priceUsd: 20,
              activatedAtMs: now,
              cutoffMs,
            },
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status, validUntilMs, cutoffMs }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
