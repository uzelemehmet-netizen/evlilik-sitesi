import { getAdmin, requireIdToken } from './_firebaseAdmin.js';

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
    // Varsayılan: promo AÇIK.
    // Sadece açıkça "false" benzeri değerler verilirse kapat.
    // Örn: 0 / false / no / off / disabled
    const promoFlag = String(process.env.MATCHMAKING_FREE_PROMO_ENABLED || '').toLowerCase().trim();
    const promoDisabled = ['0', 'false', 'no', 'off', 'disabled'].includes(promoFlag);
    if (promoDisabled) {
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

      const promoType = 'free_activation_until_2026_02_10';
      const membershipPromo = user?.membership?.lastPromo || null;
      const translationPromo = user?.translationPack?.lastPromo || null;
      const promoRelevant =
        (membershipPromo && typeof membershipPromo === 'object' && String(membershipPromo.type || '').trim() === promoType) ||
        (translationPromo && typeof translationPromo === 'object' && String(translationPromo.type || '').trim() === promoType);

      if (alreadyActive) {
        // Eski sürümde (30 gün) yazılmış promo üyelikleri de burada normalize edelim.
        if (promoRelevant && existingUntil !== cutoffMs) {
          validUntilMs = cutoffMs;
          status = 'normalized';

          tx.set(
            ref,
            {
              membership: {
                ...(typeof user?.membership === 'object' && user.membership ? user.membership : {}),
                active: true,
                plan: 'eco',
                validUntilMs,
                lastPromo: {
                  ...(typeof membershipPromo === 'object' && membershipPromo ? membershipPromo : {}),
                  type: promoType,
                  activatedAtMs: typeof membershipPromo?.activatedAtMs === 'number' ? membershipPromo.activatedAtMs : now,
                  cutoffMs,
                },
              },
              translationPack: {
                ...(typeof user?.translationPack === 'object' && user.translationPack ? user.translationPack : {}),
                active: true,
                plan: 'eco',
                validUntilMs,
                lastPromo: {
                  ...(typeof translationPromo === 'object' && translationPromo ? translationPromo : {}),
                  type: promoType,
                  activatedAtMs: typeof translationPromo?.activatedAtMs === 'number' ? translationPromo.activatedAtMs : now,
                  cutoffMs,
                },
              },
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          return;
        }

        validUntilMs = existingUntil;
        status = 'already_active';
        return;
      }

      // Promo boyunca ücretsiz üyelik: bitiş her zaman cutoff.
      // (Daha önce 30 gün + now şeklinde hesaplanmış kayıtlar heartbeat ile normalize edilecek.)
      validUntilMs = cutoffMs;

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
