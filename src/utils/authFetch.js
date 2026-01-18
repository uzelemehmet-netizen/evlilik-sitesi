import { auth } from '../config/firebase';

export async function authFetch(url, { headers = {}, ...options } = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('not_authenticated');

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
