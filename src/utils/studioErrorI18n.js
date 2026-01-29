function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function formatMinutesAsText(t, minutes) {
  const m = Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes)) : 0;
  const hours = Math.floor(m / 60);
  const mins = m % 60;

  if (hours <= 0) return t('studio.matchProfile.time.minutes', { minutes: mins || 1 });
  if (mins <= 0) return t('studio.matchProfile.time.hours', { hours });
  return t('studio.matchProfile.time.hm', { hours, minutes: mins });
}

/**
 * Translate known Studio/matchmaking API error codes into localized messages.
 * Falls back to the raw string when unknown.
 */
export function translateStudioApiError(t, raw) {
  const s = safeStr(raw);
  if (!s) return '';

  if (s === 'active_match_locked' || s === 'active_match_exists') return t('studio.errors.activeLocked');
  if (s === 'other_user_active_match_exists') return t('studio.matchProfile.errors.otherUserActiveMatch');
  if (s === 'short_message_limit' || s === 'chat_limit_reached') return t('studio.errors.shortLimit');

  if (s === 'not_available') return t('studio.errors.notAvailable');
  if (s === 'forbidden') return t('studio.errors.forbidden');

  const cooldown = /^cancel_cooldown_(\d+)m$/.exec(s);
  if (cooldown) {
    const minutes = Math.max(1, Number(cooldown[1] || 0));
    const time = formatMinutesAsText(t, minutes);
    return t('studio.errors.cancelCooldown', { time });
  }

  return s;
}
