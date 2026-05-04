function normalizeLocale(locale) {
  const raw = typeof locale === 'string' ? locale.trim() : '';
  if (!raw) return 'tr';
  return raw;
}

export function timestampToMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  if (value && typeof value.seconds === 'number' && Number.isFinite(value.seconds)) return value.seconds * 1000;
  if (value && typeof value._seconds === 'number' && Number.isFinite(value._seconds)) {
    const nanos = typeof value._nanoseconds === 'number' && Number.isFinite(value._nanoseconds) ? value._nanoseconds : 0;
    return value._seconds * 1000 + Math.floor(nanos / 1000000);
  }
  return 0;
}

export function formatRelativeTimeFromMs(value, { nowMs = Date.now(), locale = 'tr' } = {}) {
  const ts = timestampToMs(value);
  if (!(ts > 0)) return '';

  const diffMs = ts - nowMs;
  const absMs = Math.abs(diffMs);
  const lang = normalizeLocale(locale).toLowerCase();

  if (absMs < 60000) return lang.startsWith('tr') ? 'az once' : 'just now';

  const units = [
    { unit: 'day', ms: 24 * 60 * 60 * 1000 },
    { unit: 'hour', ms: 60 * 60 * 1000 },
    { unit: 'minute', ms: 60 * 1000 },
  ];

  const selected = units.find((item) => absMs >= item.ms) || units[units.length - 1];
  const valueForUnit = Math.round(diffMs / selected.ms);

  try {
    return new Intl.RelativeTimeFormat(normalizeLocale(locale), { numeric: 'auto' }).format(valueForUnit, selected.unit);
  } catch {
    const absValue = Math.abs(valueForUnit);
    if (selected.unit === 'day') return lang.startsWith('tr') ? `${absValue} gun once` : `${absValue} days ago`;
    if (selected.unit === 'hour') return lang.startsWith('tr') ? `${absValue} saat once` : `${absValue} hours ago`;
    return lang.startsWith('tr') ? `${absValue} dk once` : `${absValue} min ago`;
  }
}

export function formatDateTimeFromMs(value, { locale = 'tr' } = {}) {
  const ts = timestampToMs(value);
  if (!(ts > 0)) return '';
  try {
    return new Intl.DateTimeFormat(normalizeLocale(locale), {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(ts);
  } catch {
    return '';
  }
}