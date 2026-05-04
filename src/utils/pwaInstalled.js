import { authFetch } from './authFetch.js';

const LS_KEY = 'uniqah_pwa_installed_v1';
const LS_PWA_SERVER_MARKED_PREFIX = 'uniqah:pwa:serverMarked:v1:';
const LS_PWA_SERVER_WANTED = 'uniqah:pwa:serverWanted:v1';

function safeSetStorageItem(key, value) {
  const storage = safeGetStorage();
  if (!storage) return false;
  try {
    storage.setItem(String(key), String(value));
    return true;
  } catch {
    return false;
  }
}

function safeGetStorageItem(key) {
  const storage = safeGetStorage();
  if (!storage) return '';
  try {
    return String(storage.getItem(String(key)) || '');
  } catch {
    return '';
  }
}

function safeRemoveStorageItem(key) {
  const storage = safeGetStorage();
  if (!storage) return false;
  try {
    storage.removeItem(String(key));
    return true;
  } catch {
    return false;
  }
}

function serverMarkedKey(uid) {
  const u = String(uid || '').trim();
  return `${LS_PWA_SERVER_MARKED_PREFIX}${u || 'unknown'}`;
}

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

export function hasReportedPwaInstalledToServer(uid) {
  const u = String(uid || '').trim();
  if (!u) return false;
  return safeGetStorageItem(serverMarkedKey(u)) === '1';
}

export async function reportPwaInstalledToServerBestEffort({ source = 'unknown', uid } = {}) {
  const normalizedSource = String(source || 'unknown').trim() || 'unknown';
  const runningAsPwa = isRunningAsPwa();
  const pendingInstallSignal = wantsReportPwaInstalledToServer();
  const explicitInstallSignal = normalizedSource === 'appinstalled';

  // Only report to the server when we have a live standalone session or a pending real install signal.
  if (!runningAsPwa && !pendingInstallSignal && !explicitInstallSignal) return false;

  const u = String(uid || '').trim();
  if (u && hasReportedPwaInstalledToServer(u) && !runningAsPwa) return true;

  try {
    await authFetch('/api/pwa-installed-upsert', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: normalizedSource.slice(0, 80),
        runningAsPwa,
        installSignal: runningAsPwa || pendingInstallSignal || explicitInstallSignal,
      }),
    });

    if (u) safeSetStorageItem(serverMarkedKey(u), '1');
    safeRemoveStorageItem(LS_PWA_SERVER_WANTED);
    return true;
  } catch {
    // If user is not authenticated yet, we'll retry on next login.
    safeSetStorageItem(LS_PWA_SERVER_WANTED, '1');
    return false;
  }
}

export function wantsReportPwaInstalledToServer() {
  return safeGetStorageItem(LS_PWA_SERVER_WANTED) === '1';
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
