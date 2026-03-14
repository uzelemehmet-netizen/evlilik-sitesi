const LS_KEY = 'uniqah_pwa_installed_v1';

function safeGetStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function hasEverInstalledPwa() {
  const storage = safeGetStorage();
  if (!storage) return false;
  try {
    return String(storage.getItem(LS_KEY) || '') === '1';
  } catch {
    return false;
  }
}

export function markPwaInstalled() {
  const storage = safeGetStorage();
  if (!storage) return false;
  try {
    storage.setItem(LS_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

export function isRunningAsPwa() {
  if (typeof window === 'undefined') return false;

  try {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  } catch {
    // ignore
  }

  try {
    // iOS Safari "Add to Home Screen"
    if (typeof navigator !== 'undefined' && navigator.standalone) return true;
  } catch {
    // ignore
  }

  return false;
}

export function isPwaInstalled() {
  // "Installed" for UX purposes: either currently running as PWA, or we previously detected an install.
  const running = isRunningAsPwa();
  if (running) {
    // Persist so we don't re-show install nudges in browser later.
    markPwaInstalled();
    return true;
  }
  return hasEverInstalledPwa();
}

export async function detectInstalledRelatedAppsAndMark() {
  // Chromium-only; best-effort. If it reports an installed related app, mark installed.
  if (typeof navigator === 'undefined') return false;

  try {
    const fn = navigator.getInstalledRelatedApps;
    if (typeof fn !== 'function') return false;
    const apps = await fn.call(navigator);
    if (Array.isArray(apps) && apps.length > 0) {
      markPwaInstalled();
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}
