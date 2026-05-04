import { getIdTokenResult } from 'firebase/auth';

export const ADMIN_EMAIL = 'uzelemehmet@gmail.com';

export function normalizeAdminEmail(value) {
  try {
    return String(value || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

export function hasAllowedAdminEmail(email) {
  const normalized = normalizeAdminEmail(email);
  return !!normalized && normalized === ADMIN_EMAIL;
}

function getFirebaseClaims(claims) {
  return claims && typeof claims === 'object' && claims.firebase && typeof claims.firebase === 'object'
    ? claims.firebase
    : {};
}

export async function getAdminAccessState(user, { forceRefresh = false } = {}) {
  if (!user) {
    return {
      allowedEmail: false,
      hasAdminClaim: false,
      requiresMfa: false,
      hasSecondFactor: false,
      secondFactorType: '',
      isAdmin: false,
    };
  }

  const tokenResult = await getIdTokenResult(user, forceRefresh);
  const claims = tokenResult?.claims && typeof tokenResult.claims === 'object' ? tokenResult.claims : {};
  const firebaseClaims = getFirebaseClaims(claims);
  const secondFactorType = typeof firebaseClaims.sign_in_second_factor === 'string' ? firebaseClaims.sign_in_second_factor : '';
  const allowedEmail = hasAllowedAdminEmail(user.email);
  const hasAdminClaim = claims.admin === true;
  const requiresMfa = claims.admin_mfa_required === true;
  const hasSecondFactor = !!secondFactorType;

  return {
    allowedEmail,
    hasAdminClaim,
    requiresMfa,
    hasSecondFactor,
    secondFactorType,
    isAdmin: allowedEmail && hasAdminClaim && (!requiresMfa || hasSecondFactor),
  };
}