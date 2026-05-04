import { auth } from '../config/firebaseAuth';
import { getValidAdminStepUpToken, notifyAdminStepUpRequired } from './adminStepUp.js';
import { buildSupportReport, storeSupportReport } from './supportReport.js';

function isAdminApiUrl(url) {
  return String(url || '').includes('/api/admin');
}

function isAdminStepUpControlUrl(url) {
  const s = String(url || '');
  return s.includes('/api/admin-step-up-status') || s.includes('/api/admin-step-up-verify');
}

function isDebugApiEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    try {
      if (
        window.localStorage &&
        (window.localStorage.getItem('debugApi') === '1' || window.localStorage.getItem('debugApi') === 'true')
      ) {
        return true;
      }
    } catch {
      // ignore
    }
    const sp = new URLSearchParams(window.location.search);
    return sp.get('debugApi') === '1' || sp.get('debugPush') === '1';
  } catch {
    return false;
  }
}

function waitForAuthUser(timeoutMs = 4000) {
  return new Promise((resolve) => {
    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      try {
        unsubscribe();
      } catch {
        // ignore
      }
      resolve(null);
    }, timeoutMs);

    const unsubscribe = auth.onAuthStateChanged((nextUser) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(nextUser || null);
    });
  });
}

export async function authFetch(url, { headers = {}, ...options } = {}) {
  let user = auth.currentUser;
  if (!user) {
    user = await waitForAuthUser();
  }

  if (!user || user.isAnonymous) throw new Error('not_authenticated');

  const token = await user.getIdToken();

  let res;
  try {
    const nextHeaders = {
      ...headers,
      authorization: `Bearer ${token}`,
    };

    if (isAdminApiUrl(url)) {
      const stepUpToken = getValidAdminStepUpToken();
      if (stepUpToken) nextHeaders['x-admin-step-up'] = stepUpToken;
    }

    res = await fetch(url, {
      ...options,
      headers: nextHeaders,
    });
  } catch (e) {
    // Best-effort: prepare a report for support (no auto-redirect here).
    storeSupportReport(
      buildSupportReport({
        kind: 'api_unreachable',
        flow: 'authFetch',
        message: 'fetch_failed',
        extra: { url: String(url || ''), cause: String(e?.message || e || '') },
      })
    );
    const err = new Error('api_unreachable');
    err.cause = e;
    throw err;
  }

  let data = null;
  let rawText = '';
  const contentType = String(res.headers.get('content-type') || '').toLowerCase();
  try {
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      rawText = await res.text();
      // Best-effort: some APIs may return JSON without proper content-type
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }
    }
  } catch {
    try {
      rawText = await res.text();
    } catch {
      rawText = '';
    }
    data = null;
  }

  if (!res.ok || (data && data.ok === false)) {
    const err = new Error(data?.error || `request_failed_${res.status}`);
    err.details = data;
    err.status = res.status;
    err.url = url;
    if (!data && rawText) err.responseText = rawText.slice(0, 2000);

    if (!isAdminStepUpControlUrl(url) && (err.message === 'admin_step_up_required' || err.message === 'admin_step_up_invalid')) {
      notifyAdminStepUpRequired();
    }

    // Prepare a report for support to be shared via Contact.
    try {
      storeSupportReport(
        buildSupportReport({
          kind: 'api_error',
          flow: 'authFetch',
          code: String(data?.error || res.status || ''),
          message: String(data?.error || `http_${res.status}`),
          extra: {
            url: String(url || ''),
            status: res.status,
          },
        })
      );
    } catch {
      // ignore
    }

    if (isDebugApiEnabled()) {
      const dataString = data ? JSON.stringify(data).slice(0, 1200) : '';
      const responseText = rawText ? rawText.slice(0, 400) : '';

      // Bazı console'lar object'i "Object" diye gösteriyor; string log her zaman kopyalanabilir.
      console.warn(
        `[authFetch] request_failed url=${url} status=${res.status} error=${String(data?.error || '')} contentType=${contentType} data=${dataString} responseText=${responseText}`
      );
    }
    throw err;
  }

  return data;
}
