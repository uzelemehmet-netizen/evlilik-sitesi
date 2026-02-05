function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function dayKeyTR(nowMs) {
  // Keep client-side day boundary consistent with server (UTC+3)
  const offsetMs = 180 * 60 * 1000;
  const d = new Date(nowMs + offsetMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function randomId() {
  try {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    return Array.from(buf)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return String(Math.random()).slice(2) + String(Date.now());
  }
}

export function getAnonBrowserId() {
  if (typeof window === 'undefined') return 'server';
  try {
    const key = 'uniqah_anon_id_v1';
    const existing = safeStr(localStorage.getItem(key));
    if (existing) return existing;
    const id = randomId();
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `mem_${randomId()}`;
  }
}

function readDedupeMap(dayKey) {
  try {
    const key = `uniqah_click_dedupe_${dayKey}`;
    const raw = localStorage.getItem(key);
    if (!raw) return { key, map: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { key, map: {} };
    return { key, map: parsed };
  } catch {
    return { key: '', map: {} };
  }
}

function writeDedupeMap(storageKey, map) {
  try {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export async function trackClick(eventKey, { page } = {}) {
  try {
    if (typeof window === 'undefined') return { ok: false, skipped: true };
    const ek = safeStr(eventKey).toLowerCase();
    if (!ek) return { ok: false, skipped: true };

    const nowMs = Date.now();
    const dayKey = dayKeyTR(nowMs);

    // Client-side dedupe (best-effort). Server also dedupes.
    const { key: storageKey, map } = readDedupeMap(dayKey);
    if (map && map[ek]) return { ok: true, counted: false, deduped: true };
    if (map) map[ek] = 1;
    writeDedupeMap(storageKey, map);

    const anonId = getAnonBrowserId();
    const payload = {
      eventKey: ek,
      anonId,
      page: safeStr(page) || safeStr(window.location?.pathname) || '/',
    };

    const res = await fetch('/api/public-track-click', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    const data = await res.json().catch(() => null);
    return data || { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
