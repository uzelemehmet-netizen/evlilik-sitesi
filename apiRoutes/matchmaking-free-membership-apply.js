import { getAdmin, requireIdToken } from './_firebaseAdmin.js';
import { computeFreeActiveMembershipState, isIdentityVerified, isMembershipActive, normalizeGender } from './_matchmakingEligibility.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

async function resolveGenderFromAnyApplication(db, uid) {
  try {
    const snap = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(1).get();
    const doc = snap?.docs?.[0];
    if (!doc) return '';
    return safeStr((doc.data() || {})?.gender);
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

    const now = Date.now();

    const snap = await ref.get();
    const user = snap.exists ? (snap.data() || {}) : {};

    // Üyeliği aktif olanlar zaten aksiyon alabilir; apply'ı idempotent yap.
    if (isMembershipActive(user, now)) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, windowHours: null, status: 'paid_member' }));
      return;
    }

    const userGender = normalizeGender(user?.gender);
    const appGender = normalizeGender(await resolveGenderFromAnyApplication(db, uid));
    const gender = userGender || appGender;

    // Erkek kullanıcılar için ücretsiz aktif üyelik yok.
    if (gender === 'male') {
      const err = new Error('membership_required');
      err.statusCode = 402;
      throw err;
    }

    if (!isIdentityVerified(user)) {
      const err = new Error('membership_or_verification_required');
      err.statusCode = 402;
      throw err;
    }

    const fam = user?.freeActiveMembership || null;
    const state = computeFreeActiveMembershipState(user, now);

    if (state.blocked) {
      const err = new Error('free_active_membership_blocked');
      err.statusCode = 402;
      throw err;
    }

    // Zaten aktifse ve geçerliyse: dokunma.
    if (state.eligible) {
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: true, windowHours: state.windowHours || null, status: 'already_active' }));
      return;
    }

    const prevInactiveCount = typeof fam?.inactiveCount === 'number' ? fam.inactiveCount : 0;
    const prevReapplyCount = typeof fam?.reapplyCount === 'number' ? fam.reapplyCount : 0;

    // İlk kez: 48 saat. İlk inaktivite sonrası yeniden başvuru: 24 saat.
    const windowHours = prevInactiveCount >= 1 ? 24 : 48;
    const nextReapplyCount = prevInactiveCount >= 1 ? prevReapplyCount + 1 : prevReapplyCount;

    await ref.set(
      {
        freeActiveMembership: {
          ...(typeof fam === 'object' && fam ? fam : {}),
          active: true,
          blocked: false,
          blockedReason: '',
          windowHours,
          lastActiveAt: FieldValue.serverTimestamp(),
          lastActiveAtMs: now,
          activatedAt: FieldValue.serverTimestamp(),
          activatedAtMs: now,
          inactiveCount: prevInactiveCount,
          reapplyCount: nextReapplyCount,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, windowHours }));
  } catch (e) {
    res.statusCode = e?.statusCode || 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
}
