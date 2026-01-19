import { auth } from '../config/firebase';

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

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      authorization: `Bearer ${token}`,
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok || (data && data.ok === false)) {
    const err = new Error(data?.error || `request_failed_${res.status}`);
    err.details = data;
    throw err;
  }

  return data;
}
