function normalizeGender(v) {
  const s = String(v || '').toLowerCase().trim();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function isMembershipActive(userDoc, now = Date.now()) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > now;
}

function isIdentityVerified(userDoc) {
  if (userDoc?.identityVerified === true) return true;
  const st = String(userDoc?.identityVerification?.status || '').toLowerCase().trim();
  return st === 'verified' || st === 'approved';
}

function computeFreeActiveMembershipState(userDoc, now = Date.now()) {
  const fam = userDoc?.freeActiveMembership || null;
  const active = !!fam?.active;
  const blocked = !!fam?.blocked;
  const windowHours = typeof fam?.windowHours === 'number' ? fam.windowHours : 0;
  const lastActiveAtMs = typeof fam?.lastActiveAtMs === 'number' ? fam.lastActiveAtMs : 0;
  const expiresAtMs = active && windowHours > 0 && lastActiveAtMs > 0 ? lastActiveAtMs + windowHours * 3600000 : 0;
  const eligible = active && !blocked && expiresAtMs > now;
  return { active, blocked, windowHours, lastActiveAtMs, expiresAtMs, eligible };
}

function isDevBypassEnabled() {
  const raw = String(process.env.MATCHMAKING_DEV_BYPASS || '').toLowerCase().trim();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

function ensureEligibleOrThrow(userDoc, gender) {
  // Local dev akışında üyelik kontrolünü bypass edebilmek için.
  // Prod’da kapalıdır; sadece dev-api script’i bu env’i set eder.
  if (isDevBypassEnabled()) return;

  const g = normalizeGender(gender);
  const member = isMembershipActive(userDoc);

  // Erkek kullanıcılar: aksiyonlar için ücretli üyelik şart.
  if (g === 'male') {
    if (!member) {
      const err = new Error('membership_required');
      err.statusCode = 402;
      throw err;
    }
    return;
  }

  // Kadın kullanıcılar: ücretli üyelik veya (kimlik doğrulama + ücretsiz aktif üyelik) ile aksiyon açılır.
  if (g === 'female') {
    if (member) return;

    if (!isIdentityVerified(userDoc)) {
      const err = new Error('membership_or_verification_required');
      err.statusCode = 402;
      throw err;
    }

    const fam = computeFreeActiveMembershipState(userDoc);
    if (fam.blocked) {
      const err = new Error('free_active_membership_blocked');
      err.statusCode = 402;
      throw err;
    }

    if (!fam.eligible) {
      const err = new Error('free_active_membership_required');
      err.statusCode = 402;
      throw err;
    }

    return;
  }

  // Bilinmeyen cinsiyet: güvenli tarafta kal.
  if (!member) {
    const err = new Error('membership_required');
    err.statusCode = 402;
    throw err;
  }
}

export {
  normalizeGender,
  isMembershipActive,
  isIdentityVerified,
  computeFreeActiveMembershipState,
  ensureEligibleOrThrow,
};
