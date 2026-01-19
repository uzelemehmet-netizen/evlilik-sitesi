// İptal davranışı (iletişim sonrası): son iptal timestamp'lerini tutup 48 saat penceresinde say.
// Amaç: 2. adımı tamamlayıp (contact_unlocked) iptal edenleri işaretlemek + kullanıcı panelinde uyarı göstermek.

function asFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function clampInt(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function buildCancelBehaviourPatch(userDoc, newEventsMs, nowMs, FieldValue, opts = {}) {
  const windowMs = asFiniteNumber(opts.windowMs) ?? 48 * 3600000;
  const keepMs = asFiniteNumber(opts.keepMs) ?? 14 * 86400000;
  const threshold = clampInt(opts.threshold ?? 3, 1, 20);
  const maxEvents = clampInt(opts.maxEvents ?? 50, 10, 200);

  const safeNow = asFiniteNumber(nowMs) ?? Date.now();

  const prev = userDoc?.contactCancelBehaviour || null;
  const prevEvents = Array.isArray(prev?.recentContactCancelMs) ? prev.recentContactCancelMs : [];

  const cutoffKeep = safeNow - keepMs;
  const filteredPrev = prevEvents
    .map(asFiniteNumber)
    .filter((x) => x !== null)
    .filter((ms) => ms >= cutoffKeep && ms <= safeNow + 60000);

  const incoming = Array.isArray(newEventsMs) ? newEventsMs : [];
  const filteredIncoming = incoming
    .map(asFiniteNumber)
    .filter((x) => x !== null)
    .filter((ms) => ms >= cutoffKeep && ms <= safeNow + 60000);

  const merged = filteredPrev.concat(filteredIncoming);
  merged.sort((a, b) => a - b);

  const limited = merged.length > maxEvents ? merged.slice(-maxEvents) : merged;

  const cutoffWindow = safeNow - windowMs;
  const count2d = limited.filter((ms) => ms >= cutoffWindow).length;

  const patch = {
    contactCancelBehaviour: {
      recentContactCancelMs: limited,
      lastContactCancelAtMs: safeNow,
      lastWindowMs: windowMs,
      countInLastWindowAtUpdate: count2d,
      updatedAtMs: safeNow,
    },
  };

  // "İşaretleme" admin tarafı için kalıcı bir flag olsun (auto-clear etme).
  const alreadyFlagged = !!userDoc?.riskFlags?.frequentCanceller;
  if (count2d >= threshold && !alreadyFlagged) {
    patch['riskFlags.frequentCanceller'] = true;
    patch['riskFlags.frequentCancellerAt'] = FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : null;
    patch['riskFlags.frequentCancellerReason'] = `>=${threshold} contact cancellations in 48h`;
  }

  return { patch, countInWindow: count2d };
}
