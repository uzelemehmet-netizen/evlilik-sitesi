const LS_PREFIX = 'uniqah:hint';

function safeUid(userOrUid) {
  const uid = typeof userOrUid === 'string' ? userOrUid : String(userOrUid?.uid || '');
  const t = String(uid || '').trim();
  return t || '';
}

function storageKey(uid, hintId) {
  return `${LS_PREFIX}:${hintId}:${uid}`;
}

export function isOneTimeHintShown(userOrUid, hintId) {
  const uid = safeUid(userOrUid);
  const id = String(hintId || '').trim();
  if (!uid || !id) return true;
  try {
    return window.localStorage.getItem(storageKey(uid, id)) === '1';
  } catch {
    return true;
  }
}

export function markOneTimeHintShown(userOrUid, hintId) {
  const uid = safeUid(userOrUid);
  const id = String(hintId || '').trim();
  if (!uid || !id) return;
  try {
    window.localStorage.setItem(storageKey(uid, id), '1');
  } catch {
    // ignore
  }
}
