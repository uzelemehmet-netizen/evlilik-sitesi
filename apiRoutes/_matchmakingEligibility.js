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

function isInteractionMembershipOnlyEnabled() {
  // Varsayılan (ürün kararı): etkileşim başlatmak için aktif üyelik gerekir.
  // Geri almak için env'i açıkça 0/false/no yapın.
  const raw = String(process.env.MATCHMAKING_INTERACTION_REQUIRES_MEMBERSHIP || '').toLowerCase().trim();
  // 2026-01: Ürün akışı (havuz + bildirim) için etkileşimler varsayılan olarak serbest.
  // Üyelik zorunluluğu isteniyorsa bu env açıkça set edilmelidir.
  if (!raw) return false;
  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'off') return false;
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function isFreeActiveEnabled() {
  const raw = String(process.env.MATCHMAKING_FREE_ACTIVE_ENABLED || '').toLowerCase().trim();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

function ensureEligibleOrThrow(userDoc, gender) {
  // Local dev akışında üyelik kontrolünü bypass edebilmek için.
  // Prod’da kapalıdır; sadece dev-api script’i bu env’i set eder.
  if (isDevBypassEnabled()) return;

  // Opsiyonel ürün kuralı: etkileşim başlatmak için aktif üyelik zorunlu.
  // Varsayılan: kapalı (serbest). Açmak için MATCHMAKING_INTERACTION_REQUIRES_MEMBERSHIP=true.
  if (!isInteractionMembershipOnlyEnabled()) return;

  const member = isMembershipActive(userDoc);
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
  isFreeActiveEnabled,
  isInteractionMembershipOnlyEnabled,
};
