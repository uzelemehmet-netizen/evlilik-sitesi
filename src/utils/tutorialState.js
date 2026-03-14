const TOUR_ACTIVE_KEY = 'uniqah:tour:active';

export function setTutorialActive(active) {
  try {
    if (typeof window === 'undefined') return;
    if (active) window.sessionStorage.setItem(TOUR_ACTIVE_KEY, '1');
    else window.sessionStorage.removeItem(TOUR_ACTIVE_KEY);
  } catch {
    // ignore
  }
}

export function isTutorialActive() {
  try {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(TOUR_ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
}
