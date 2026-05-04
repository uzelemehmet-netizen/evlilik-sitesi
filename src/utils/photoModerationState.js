function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function asObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function normalizePhotoUrls(value, maxItems = 5) {
  const list = Array.isArray(value) ? value : [];
  return list
    .slice(0, maxItems)
    .map((item) => safeStr(item))
    .filter(Boolean);
}

function buildPhotoUrlsSignature(urls) {
  return normalizePhotoUrls(urls).join('\n');
}

function havePhotoUrlsChanged(previousUrls, nextUrls) {
  return buildPhotoUrlsSignature(previousUrls) !== buildPhotoUrlsSignature(nextUrls);
}

function collectPhotoModerationCandidates(source) {
  const root = asObj(source);
  if (!root) return [];

  const out = [];
  const topLevel = asObj(root?.photoModeration);
  if (topLevel) out.push(topLevel);

  const application = asObj(root?.application);
  const applicationModeration = asObj(application?.photoModeration);
  if (applicationModeration) out.push(applicationModeration);

  const publicProfile = asObj(root?.publicProfile);
  const publicProfileModeration = asObj(publicProfile?.photoModeration);
  if (publicProfileModeration) out.push(publicProfileModeration);

  return out;
}

function normalizePhotoModeration(record) {
  const source = asObj(record) || {};
  const status = safeStr(source?.status).toLowerCase();
  const active = status === 'requires_reupload';
  const reviewedPhotoUrls = normalizePhotoUrls(
    source?.reviewedPhotoUrls || source?.photoUrls || source?.currentPhotoUrls || source?.previousPhotoUrls,
  );

  return {
    active,
    status,
    reason: safeStr(source?.reason) || '',
    messageCode: safeStr(source?.messageCode) || (active ? 'photo_review_required' : ''),
    reviewedPhotoUrls,
    reviewedPhotoSignature: safeStr(source?.reviewedPhotoSignature) || buildPhotoUrlsSignature(reviewedPhotoUrls),
    requestedBy: safeStr(source?.requestedBy) || '',
    requestedAtMs:
      typeof source?.requestedAtMs === 'number' && Number.isFinite(source.requestedAtMs) ? source.requestedAtMs : 0,
  };
}

function getPhotoModerationRestriction(...sources) {
  for (const source of sources) {
    const candidates = collectPhotoModerationCandidates(source);
    for (const candidate of candidates) {
      const normalized = normalizePhotoModeration(candidate);
      if (normalized.active) return normalized;
    }
  }

  return normalizePhotoModeration(null);
}

function isPhotoModerationRestricted(...sources) {
  return getPhotoModerationRestriction(...sources).active;
}

export {
  buildPhotoUrlsSignature,
  getPhotoModerationRestriction,
  havePhotoUrlsChanged,
  isPhotoModerationRestricted,
  normalizePhotoUrls,
  safeStr,
};