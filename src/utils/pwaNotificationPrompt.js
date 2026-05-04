const LS_PWA_NOTIFICATION_PROMPT_SUPPRESSED_PREFIX = 'uniqah:pwa-notification-prompt:suppressed';

function normalizePromptScope(uid) {
  const value = String(uid || '').trim();
  return value || 'browser';
}

export function getPwaNotificationPromptSuppressedKey(uid = '') {
  return `${LS_PWA_NOTIFICATION_PROMPT_SUPPRESSED_PREFIX}:${normalizePromptScope(uid)}`;
}

export function isPwaNotificationPromptSuppressed(uid = '') {
  try {
    return window.localStorage.getItem(getPwaNotificationPromptSuppressedKey(uid)) === '1';
  } catch {
    return false;
  }
}

export function markPwaNotificationPromptSuppressed(uid = '') {
  try {
    window.localStorage.setItem(getPwaNotificationPromptSuppressedKey(uid), '1');
    return true;
  } catch {
    return false;
  }
}