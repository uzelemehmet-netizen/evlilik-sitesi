import { getAdmin, requireIdToken } from './_firebaseAdmin.js';

function freeMembershipValidUntilMs(nowMs) {
  // Ürün kararı: Şimdilik üyelik ücretsiz. Geriye dönük olarak "aktif üyelik" kontrolü
  // validUntilMs > now mantığını kullandığı için uzun bir süre tanımlıyoruz.
  const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;
  return nowMs + TEN_YEARS_MS;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    // Varsayılan: Ücretsiz üyelik aktivasyonu AÇIK.
    // Sadece açıkça kapatmak için env'i 0/false/no/off/disabled yapın.
    const flag = String(process.env.MATCHMAKING_FREE_MEMBERSHIP_ENABLED || process.env.MATCHMAKING_FREE_PROMO_ENABLED || '').toLowerCase().trim();
    const disabled = ['0', 'false', 'no', 'off', 'disabled'].includes(flag);
    if (disabled) {
      const err = new Error('free_membership_disabled');
      err.statusCode = 410;
      throw err;
    }

    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const now = Date.now();
    const validUntilMsTarget = freeMembershipValidUntilMs(now);

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingUsers').doc(uid);

    let validUntilMs = 0;
    let status = 'activated';

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const user = snap.exists ? (snap.data() || {}) : {};

      const existingUntil = typeof user?.membership?.validUntilMs === 'number' ? user.membership.validUntilMs : 0;
      const alreadyActive = !!user?.membership?.active && existingUntil > now;

      const promoType = 'free_membership';
      const membershipPromo = user?.membership?.lastPromo || null;
      const translationPromo = user?.translationPack?.lastPromo || null;
      const promoRelevant =
        (membershipPromo && typeof membershipPromo === 'object' && String(membershipPromo.type || '').trim() === promoType) ||
        (translationPromo && typeof translationPromo === 'object' && String(translationPromo.type || '').trim() === promoType);

      if (alreadyActive) {
        // Ücretsiz üyelikte süre hedefini normalize edelim.
        if (promoRelevant && existingUntil !== validUntilMsTarget) {
          validUntilMs = validUntilMsTarget;
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
                  priceUsd: 0,
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
                  priceUsd: 0,
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

      // Şimdilik ücretsiz üyelik: uzun süreli geçerlilik.
      validUntilMs = validUntilMsTarget;

      tx.set(
        ref,
        {
          membership: {
            active: true,
            validUntilMs,
            plan: 'eco',
            lastPromo: {
              type: 'free_membership',
              priceUsd: 0,
              activatedAtMs: now,
            },
          },
          translationPack: {
            active: true,
            plan: 'eco',
            validUntilMs,
            lastPromo: {
              type: 'free_membership',
              priceUsd: 0,
              activatedAtMs: now,
            },
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status, validUntilMs }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
