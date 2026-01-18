export function deepMerge(base, override) {
  if (override === undefined) return base;
  if (base === null || base === undefined) return override;

  // Allow overrides to fully replace an object subtree (useful when base object
  // keys are user-visible labels, e.g. food category titles).
  if (
    override &&
    typeof override === 'object' &&
    !Array.isArray(override) &&
    override.__replace
  ) {
    const { __replace, ...rest } = override;
    return rest;
  }

  if (Array.isArray(base) || Array.isArray(override)) {
    return override;
  }

  if (typeof base !== 'object' || typeof override !== 'object') {
    return override;
  }

  const result = { ...base };
  for (const key of Object.keys(override)) {
    result[key] = deepMerge(base[key], override[key]);
  }
  return result;
}
