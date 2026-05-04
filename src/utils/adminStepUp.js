const STORAGE_KEY = 'admin_step_up_token_v1';
export const ADMIN_STEP_UP_REQUIRED_EVENT = 'admin-step-up-required';
export const ADMIN_STEP_UP_CHANGED_EVENT = 'admin-step-up-changed';

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function decodeBase64Url(segment) {
  const normalized = String(segment || '').replace(/-/g, '+').replace(/_/g, '/');
  if (!normalized) return '';

  const padLen = normalized.length % 4;
  const padded = normalized + (padLen ? '='.repeat(4 - padLen) : '');
  try {
    return atob(padded);
  } catch {
    return '';
  }
}

export function parseAdminStepUpToken(token) {
  const raw = String(token || '').trim();
  if (!raw) return null;
  const dot = raw.indexOf('.');
  if (dot <= 0) return null;

  const payloadRaw = decodeBase64Url(raw.slice(0, dot));
  if (!payloadRaw) return null;

  try {
    const payload = JSON.parse(payloadRaw);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

export function getAdminStepUpToken() {
  if (!canUseSessionStorage()) return '';
  try {
    return String(window.sessionStorage.getItem(STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function clearAdminStepUpToken() {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(ADMIN_STEP_UP_CHANGED_EVENT, { detail: { active: false } }));
  } catch {
    // ignore
  }
}

export function setAdminStepUpToken(token) {
  const raw = String(token || '').trim();
  if (!raw) {
    clearAdminStepUpToken();
    return;
  }
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, raw);
    window.dispatchEvent(new CustomEvent(ADMIN_STEP_UP_CHANGED_EVENT, { detail: { active: true } }));
  } catch {
    // ignore
  }
}

export function getValidAdminStepUpToken() {
  const token = getAdminStepUpToken();
  if (!token) return '';

  const payload = parseAdminStepUpToken(token);
  const exp = typeof payload?.exp === 'number' && Number.isFinite(payload.exp) ? payload.exp : 0;
  if (!exp || exp <= Date.now()) {
    clearAdminStepUpToken();
    return '';
  }

  return token;
}

export function notifyAdminStepUpRequired() {
  clearAdminStepUpToken();
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(ADMIN_STEP_UP_REQUIRED_EVENT));
  } catch {
    // ignore
  }
}