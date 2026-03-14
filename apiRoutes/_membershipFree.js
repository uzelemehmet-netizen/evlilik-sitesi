function freeMembershipValidUntilMs(nowMs) {
  // Ürün kararı: Şimdilik üyelik ücretsiz. Geriye dönük olarak "aktif üyelik" kontrolü
  // validUntilMs > now mantığını kullandığı için uzun bir süre tanımlıyoruz.
  const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;
  return nowMs + TEN_YEARS_MS;
}

function isFreeMembershipDisabledByEnv() {
  // Varsayılan: Ücretsiz üyelik aktivasyonu AÇIK.
  // Sadece açıkça kapatmak için env'i 0/false/no/off/disabled yapın.
  const flag = String(process.env.MATCHMAKING_FREE_MEMBERSHIP_ENABLED || process.env.MATCHMAKING_FREE_PROMO_ENABLED || '')
    .toLowerCase()
    .trim();
  return ['0', 'false', 'no', 'off', 'disabled'].includes(flag);
}

async function activateFreeMembershipForUid({ db, FieldValue }, uid, now = Date.now()) {
  const validUntilMsTarget = freeMembershipValidUntilMs(now);
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

  return { status, validUntilMs };
}

export { isFreeMembershipDisabledByEnv, activateFreeMembershipForUid };
