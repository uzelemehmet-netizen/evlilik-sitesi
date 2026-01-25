import { getAdmin, requireIdToken } from './_firebaseAdmin.js';
import { computeFreeActiveMembershipState, isFreeActiveEnabled } from './_matchmakingEligibility.js';

function promoCutoffMsTR() {
  return new Date('2026-02-10T23:59:59.999+03:00').getTime();
}

function nextInactiveCount(prev) {
  const n = typeof prev === 'number' ? prev : Number(prev);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }

  try {
    const freeActiveEnabled = isFreeActiveEnabled();

    const decoded = await requireIdToken(req);
    const uid = decoded.uid;

    const { db, FieldValue } = getAdmin();
    const ref = db.collection('matchmakingUsers').doc(uid);

    const now = Date.now();

    let result = { status: 'noop', blocked: false, windowHours: 0 };

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const user = snap.exists ? (snap.data() || {}) : {};

      // Promo ücretsiz üyelik süresi normalize:
      // Daha önce 30 gün olarak yazılmış olanları da cutoff'a sabitle.
      const promoType = 'free_activation_until_2026_02_10';
      const expectedCutoffMs = promoCutoffMsTR();
      const membership = user?.membership || null;
      const translationPack = user?.translationPack || null;

      const membershipPromo = membership?.lastPromo || null;
      const translationPromo = translationPack?.lastPromo || null;

      const isPromoMarker = (p) => {
        if (!p || typeof p !== 'object') return false;
        const type = typeof p.type === 'string' ? p.type.trim() : '';
        const cutoff = typeof p.cutoffMs === 'number' ? p.cutoffMs : 0;
        // Tip birebir eşleşebileceği gibi, bazı eski kayıtlar sadece cutoffMs taşıyabilir.
        return type === promoType || (Number.isFinite(cutoff) && cutoff > 0 && cutoff === expectedCutoffMs);
      };

      const promoRelevant = isPromoMarker(membershipPromo) || isPromoMarker(translationPromo);

      const inferredCutoffMs =
        (typeof membershipPromo?.cutoffMs === 'number' && Number.isFinite(membershipPromo.cutoffMs) && membershipPromo.cutoffMs === expectedCutoffMs
          ? membershipPromo.cutoffMs
          : (typeof translationPromo?.cutoffMs === 'number' && Number.isFinite(translationPromo.cutoffMs) && translationPromo.cutoffMs === expectedCutoffMs
              ? translationPromo.cutoffMs
              : 0)) || 0;

      const cutoffMs = inferredCutoffMs || expectedCutoffMs;

      const needsMembershipFix =
        !!membership?.active &&
        promoRelevant &&
        typeof cutoffMs === 'number' &&
        Number.isFinite(cutoffMs) &&
        cutoffMs > 0 &&
        membership?.validUntilMs !== cutoffMs;

      const needsTranslationFix =
        !!translationPack?.active &&
        promoRelevant &&
        typeof cutoffMs === 'number' &&
        Number.isFinite(cutoffMs) &&
        cutoffMs > 0 &&
        translationPack?.validUntilMs !== cutoffMs;

      const basePatch = {};
      if (needsMembershipFix) {
        basePatch.membership = {
          ...(typeof membership === 'object' && membership ? membership : {}),
          validUntilMs: cutoffMs,
        };
      }
      if (needsTranslationFix) {
        basePatch.translationPack = {
          ...(typeof translationPack === 'object' && translationPack ? translationPack : {}),
          validUntilMs: cutoffMs,
        };
      }

      if (!freeActiveEnabled) {
        if (Object.keys(basePatch).length) {
          tx.set(
            ref,
            {
              ...basePatch,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          result = { status: 'promo_normalized', blocked: false, windowHours: 0 };
        } else {
          result = { status: 'disabled', blocked: false, windowHours: 0 };
        }
        return;
      }

      const fam = user?.freeActiveMembership || null;
      const state = computeFreeActiveMembershipState(user, now);

      if (!state.active) {
        if (Object.keys(basePatch).length) {
          tx.set(
            ref,
            {
              ...basePatch,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          result = { status: 'promo_normalized', blocked: !!state.blocked, windowHours: state.windowHours || 0 };
        } else {
          result = { status: 'noop', blocked: !!state.blocked, windowHours: state.windowHours || 0 };
        }
        return;
      }

      // Aktif ama süre dolmuşsa: üyeliği iptal et.
      if (!state.eligible) {
        const prevInactive = nextInactiveCount(fam?.inactiveCount);
        const inactiveCount = prevInactive + 1;
        const blocked = inactiveCount >= 2;

        tx.set(
          ref,
          {
            ...basePatch,
            freeActiveMembership: {
              ...(typeof fam === 'object' && fam ? fam : {}),
              active: false,
              inactiveCount,
              blocked,
              blockedReason: blocked ? 'inactive_twice' : '',
              cancelledAt: FieldValue.serverTimestamp(),
              cancelledAtMs: now,
            },
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        result = { status: blocked ? 'blocked' : 'expired', blocked, windowHours: state.windowHours || 0 };
        return;
      }

      // Aktif ve geçerliyse: lastActive'i güncelle.
      tx.set(
        ref,
        {
          ...basePatch,
          freeActiveMembership: {
            ...(typeof fam === 'object' && fam ? fam : {}),
            active: true,
            blocked: false,
            lastActiveAt: FieldValue.serverTimestamp(),
            lastActiveAtMs: now,
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      result = { status: 'refreshed', blocked: false, windowHours: state.windowHours || 0 };
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
