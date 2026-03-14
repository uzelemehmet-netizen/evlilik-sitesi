export function tiktokPage() {
  try {
    const ttq = window?.ttq;
    if (ttq && typeof ttq.page === 'function') ttq.page();
  } catch {
    // ignore
  }
}

export function tiktokTrack(eventName, params) {
  try {
    const ttq = window?.ttq;
    if (ttq && typeof ttq.track === 'function') ttq.track(eventName, params || {});
  } catch {
    // ignore
  }
}
