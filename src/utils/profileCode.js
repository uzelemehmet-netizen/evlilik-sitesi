export function formatProfileCode(input) {
  if (!input) return '';

  const fromUsername = (v) => {
    const s = typeof v?.username === 'string' ? v.username.trim() : '';
    return s;
  };

  const fromString = (v) => {
    const s = typeof v === 'string' ? v.trim() : '';
    if (!s) return '';

    // Normalize common variants:
    // - "mk-123" -> "MK-123"
    // - "123" -> "MK-123" (some older UI paths might have shown just the number)
    const mk = s.match(/^mk\s*-\s*(\d+)$/i);
    if (mk) return `MK-${Number(mk[1])}`;

    const numeric = s.match(/^(\d+)$/);
    if (numeric) return `MK-${Number(numeric[1])}`;

    return s;
  };

  const username = fromUsername(input);
  if (username) return username;

  const code = fromString(input.profileCode);
  if (code) return code;

  const profileNo = typeof input.profileNo === 'number' && Number.isFinite(input.profileNo) ? input.profileNo : null;
  if (profileNo !== null) return `MK-${profileNo}`;

  // Support callers that pass raw values instead of objects
  const raw = fromString(input);
  return raw;
}
