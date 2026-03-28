import { trackClick } from './clickTracker';

const KEY_NEEDS_APPLY = 'uniqah_funnel_needs_apply_v1';
const KEY_SIGNUP_AT_MS = 'uniqah_funnel_signup_at_ms_v1';
const KEY_DROPOFF_SENT = 'uniqah_funnel_dropoff_sent_v1';

function safeMethod(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return 'unknown';
  return s.replace(/[^a-z0-9:_-]+/g, '').slice(0, 40) || 'unknown';
}

export function markFunnelSignupCompleted(method) {
  try {
    sessionStorage.setItem(KEY_NEEDS_APPLY, '1');
    sessionStorage.setItem(KEY_SIGNUP_AT_MS, String(Date.now()));
    sessionStorage.removeItem(KEY_DROPOFF_SENT);
  } catch {
    // ignore
  }

  try {
    void trackClick(`funnel_signup_completed:${safeMethod(method)}`);
  } catch {
    // ignore
  }
}

export function markFunnelApplyCompleted() {
  try {
    sessionStorage.removeItem(KEY_NEEDS_APPLY);
    sessionStorage.removeItem(KEY_SIGNUP_AT_MS);
    sessionStorage.removeItem(KEY_DROPOFF_SENT);
  } catch {
    // ignore
  }

  try {
    void trackClick('funnel_apply_completed');
  } catch {
    // ignore
  }
}

export function hasPendingApplyAfterSignup() {
  try {
    return String(sessionStorage.getItem(KEY_NEEDS_APPLY) || '') === '1';
  } catch {
    return false;
  }
}

export function maybeReportDropoffAfterSignupBeforeApply({ page } = {}) {
  try {
    if (!hasPendingApplyAfterSignup()) return false;

    const sent = String(sessionStorage.getItem(KEY_DROPOFF_SENT) || '') === '1';
    if (sent) return false;

    const signupAt = Number(sessionStorage.getItem(KEY_SIGNUP_AT_MS) || '0');
    // Avoid noise: ignore ultra-fast exits immediately after signup.
    if (signupAt && Date.now() - signupAt < 8000) return false;

    sessionStorage.setItem(KEY_DROPOFF_SENT, '1');

    void trackClick('funnel_dropoff_after_signup_before_apply', {
      page: String(page || '').trim() || undefined,
      // Dropoff is an unload-ish signal; avoid client-side dedupe.
      trace: true,
    });

    return true;
  } catch {
    return false;
  }
}
