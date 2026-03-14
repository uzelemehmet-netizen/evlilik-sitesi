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

export async function trackClick(eventKey, { page, trace } = {}) {
  try {
    if (typeof window === 'undefined') return { ok: false, skipped: true };
    const ek = safeStr(eventKey).toLowerCase();
    if (!ek) return { ok: false, skipped: true };

    const isTrace = trace === true;

    const nowMs = Date.now();
    const dayKey = dayKeyTR(nowMs);

    // Client-side dedupe (best-effort). Server also dedupes.
    // For trace mode: DO NOT dedupe; we want full click streams.
    if (!isTrace) {
      const { key: storageKey, map } = readDedupeMap(dayKey);
      if (map && map[ek]) return { ok: true, counted: false, deduped: true };
      if (map) map[ek] = 1;
      writeDedupeMap(storageKey, map);
    }

    const anonId = getAnonBrowserId();

    // Diagnostics (privacy-safe): helps detect VPN/relay/proxy country mismatches.
    let lang = '';
    let tz = '';
    let tzOffsetMin = null;
    try {
      lang = safeStr(window.navigator?.language).slice(0, 20);
    } catch {
      lang = '';
    }
    try {
      tz = safeStr(Intl.DateTimeFormat().resolvedOptions().timeZone).slice(0, 60);
    } catch {
      tz = '';
    }
    try {
      const n = new Date().getTimezoneOffset();
      tzOffsetMin = Number.isFinite(n) ? Math.trunc(n) : null;
    } catch {
      tzOffsetMin = null;
    }
    const payload = {
      eventKey: ek,
      anonId,
      page: safeStr(page) || safeStr(window.location?.pathname) || '/',
      trace: trace === true,
      ...(lang ? { lang } : {}),
      ...(tz ? { tz } : {}),
      ...(typeof tzOffsetMin === 'number' ? { tzOffsetMin } : {}),
    };

    // Some privacy tools/adblockers block paths containing "track".
    // Prefer a neutral alias endpoint, and fall back to the legacy route.
    const endpoints = ['/api/public-signal', '/api/public-track-click'];

    // Best-effort: sendBeacon is usually more reliable on mobile/unload.
    try {
      const beacon = window.navigator?.sendBeacon;
      if (typeof beacon === 'function') {
        const json = JSON.stringify(payload);
        for (const url of endpoints) {
          try {
            const blob = new Blob([json], { type: 'application/json' });
            const ok = beacon.call(window.navigator, url, blob);
            if (ok) return { ok: true, counted: null, via: 'beacon' };
          } catch {
            // try next endpoint
          }
        }
      }
    } catch {
      // ignore
    }

    let last = null;
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });

        const data = await res.json().catch(() => null);
        if (data) return data;
        if (res.ok) return { ok: true };
        last = { ok: false };
      } catch {
        last = { ok: false };
      }
    }

    return last || { ok: false };
  } catch {
    return { ok: false };
  }
}
