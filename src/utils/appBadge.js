function canUseBadging() {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.setAppBadge === 'function';
  } catch {
    return false;
  }
}

export async function clearAppBadge() {
  try {
    if (!canUseBadging()) return;
    await navigator.clearAppBadge();
  } catch {
    // ignore
  }
}

export async function setAppBadge(count = 1) {
  try {
    if (!canUseBadging()) return;
    const n = typeof count === 'number' && Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 1;
    if (n <= 0) {
      await navigator.clearAppBadge();
      return;
    }
    await navigator.setAppBadge(n);
  } catch {
    // ignore
  }
}

export async function resetServiceWorkerBadge() {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const msg = { type: 'badge_reset', count: 0 };
    const controller = navigator.serviceWorker.controller;
    if (controller) {
      controller.postMessage(msg);
      return;
    }

    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (reg?.active) {
      reg.active.postMessage(msg);
    }
  } catch {
    // ignore
  }
}
