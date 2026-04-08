function errorMessageOf(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error?.message === 'string') return error.message;
  try {
    return String(error);
  } catch {
    return '';
  }
}

export function isLikelyChunkLoadError(error) {
  const s = errorMessageOf(error).toLowerCase();
  if (!s) return false;
  return (
    s.includes('loading chunk') ||
    s.includes('chunkloaderror') ||
    s.includes('failed to fetch dynamically imported module') ||
    s.includes('importing a module script failed') ||
    s.includes('dynamically imported module') ||
    s.includes('cannot find module') ||
    s.includes('unexpected token <')
  );
}

export function isRecoverableModulePreloadError({ code, tagName, linkRel, linkAs, resourceUrlHint } = {}) {
  if (String(code || '') !== 'resource_load_error') return false;
  if (String(tagName || '').toLowerCase() !== 'link') return false;
  if (String(linkRel || '').toLowerCase() !== 'modulepreload') return false;
  if (String(linkAs || '').toLowerCase() !== 'script') return false;

  const hint = String(resourceUrlHint || '').trim().toLowerCase();
  if (!hint) return false;

  const currentHost = (() => {
    try {
      return String(window.location?.host || '').trim().toLowerCase();
    } catch {
      return '';
    }
  })();

  if (!currentHost) return false;
  if (!hint.startsWith(`${currentHost}/assets/`) || !hint.endsWith('.js')) return false;
  return /\/assets\/[a-z0-9_-]+-[a-z0-9_-]+\.js$/i.test(hint);
}

export async function recoverFromChunkLoadError({
  reason = 'chunk_load_error',
  storageKey = 'uniqah:chunk_recover_v2',
  throttleMs = 10 * 60 * 1000,
} = {}) {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  const last = (() => {
    try {
      return Number(sessionStorage.getItem(storageKey) || '0');
    } catch {
      return 0;
    }
  })();

  if (Number.isFinite(last) && last > 0 && now - last <= throttleMs) {
    return false;
  }

  try {
    sessionStorage.setItem(storageKey, String(now));
  } catch {
    // ignore
  }

  try {
    if ('serviceWorker' in navigator && typeof navigator.serviceWorker?.getRegistrations === 'function') {
      const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
      await Promise.allSettled((regs || []).map((reg) => reg.unregister().catch(() => false)));
    }
  } catch {
    // ignore
  }

  try {
    if (typeof caches !== 'undefined' && caches && typeof caches.keys === 'function') {
      const keys = await caches.keys().catch(() => []);
      await Promise.allSettled((keys || []).map((key) => caches.delete(key).catch(() => false)));
    }
  } catch {
    // ignore
  }

  try {
    const url = new URL(String(window.location?.href || 'https://uniqah.com/'));
    url.searchParams.set('__reload', String(now));
    url.searchParams.set('__reason', String(reason));
    window.location.replace(url.toString());
    return true;
  } catch {
    // ignore
  }

  try {
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}