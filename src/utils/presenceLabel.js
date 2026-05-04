function normalizeLocale(locale) {
  return String(locale || '').trim().toLowerCase().split(/[-_]/)[0] || 'tr';
}

function formatTrLabel(diffMs) {
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs <= 2 * minuteMs) return 'Az once aktifti';
  if (diffMs <= 5 * minuteMs) return 'Simdi aktif';

  const minutes = Math.max(1, Math.round(diffMs / minuteMs));
  if (minutes < 60) return `${minutes} dk once aktifti`;

  const hours = Math.max(1, Math.round(diffMs / hourMs));
  if (hours < 24) return `${hours} saat once aktifti`;

  const days = Math.max(1, Math.round(diffMs / dayMs));
  if (days === 1) return 'Dun aktifti';
  return `${days} gun once aktifti`;
}

function formatEnLabel(diffMs) {
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs <= 2 * minuteMs) return 'Active just now';
  if (diffMs <= 5 * minuteMs) return 'Active now';

  const minutes = Math.max(1, Math.round(diffMs / minuteMs));
  if (minutes < 60) return `Active ${minutes} min ago`;

  const hours = Math.max(1, Math.round(diffMs / hourMs));
  if (hours < 24) return `Active ${hours} hr ago`;

  const days = Math.max(1, Math.round(diffMs / dayMs));
  if (days === 1) return 'Active yesterday';
  return `Active ${days} days ago`;
}

export function getPresenceMeta(lastSeenAtMs, locale = 'tr') {
  void lastSeenAtMs;
  void locale;
  return { label: '', isOnline: false };
}