function normalizePathOnly(path) {
  const raw = String(path || '').trim();
  if (!raw) return '/';
  const pathOnly = raw.split(/[?#]/)[0] || '/';
  return pathOnly.replace(/\/+$/, '') || '/';
}

function isLeadApplyPath(path) {
  const normalized = normalizePathOnly(path);
  return normalized === '/aracilik' || normalized === '/evlilik/aracilik-basvurusu';
}

function sanitizePostAuthTarget(path, fallback = '/profilim') {
  const candidate = String(path || '').trim();
  if (!candidate) return String(fallback || '/profilim');
  return isLeadApplyPath(candidate) ? String(fallback || '/profilim') : candidate;
}

function shouldIgnorePostAuthState(path) {
  return isLeadApplyPath(path);
}

export {
  isLeadApplyPath,
  normalizePathOnly,
  sanitizePostAuthTarget,
  shouldIgnorePostAuthState,
};