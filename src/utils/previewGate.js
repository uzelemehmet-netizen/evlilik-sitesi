const EVENT_NAME = 'mm_preview_gate';

export function openPreviewGate(payload = {}) {
  try {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload || {} }));
  } catch {
    // noop
  }
}

export function onPreviewGate(handler) {
  if (typeof window === 'undefined') return () => {};
  const fn = (e) => {
    try {
      handler?.(e?.detail || {});
    } catch {
      // noop
    }
  };
  window.addEventListener(EVENT_NAME, fn);
  return () => {
    try {
      window.removeEventListener(EVENT_NAME, fn);
    } catch {
      // noop
    }
  };
}
