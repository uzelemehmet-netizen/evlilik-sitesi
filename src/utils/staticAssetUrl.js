function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function getDefaultVersion() {
  // Fallback: manuel cache busting için tarih.
  return '2026-02-05';
}

export function staticAssetUrl(assetPath) {
  const p = safeStr(assetPath);
  if (!p) return '';

  const base = p.startsWith('/') ? p : `/${p}`;

  let version = '';
  try {
    version = safeStr(import.meta?.env?.VITE_STATIC_ASSET_VERSION);
  } catch {
    version = '';
  }

  const v = version || getDefaultVersion();
  const join = base.includes('?') ? '&' : '?';
  return `${base}${join}v=${encodeURIComponent(v)}`;
}
