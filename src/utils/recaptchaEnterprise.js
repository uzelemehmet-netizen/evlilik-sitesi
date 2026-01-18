let loadPromise = null;

function ensureScriptLoaded(siteKey) {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!siteKey) return Promise.resolve();

  // Already loaded?
  if (window.grecaptcha?.enterprise) return Promise.resolve();

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-recaptcha-enterprise="1"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('reCAPTCHA script load failed')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-recaptcha-enterprise', '1');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('reCAPTCHA script load failed'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function isRecaptchaEnterpriseEnabled() {
  const key = import.meta?.env?.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
  return !!key;
}

export async function getRecaptchaEnterpriseToken(action) {
  const siteKey = import.meta?.env?.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (!siteKey) return '';

  await ensureScriptLoaded(siteKey);

  const grecaptcha = window.grecaptcha?.enterprise;
  if (!grecaptcha?.ready || !grecaptcha?.execute) {
    throw new Error('reCAPTCHA enterprise not available');
  }

  return await new Promise((resolve, reject) => {
    grecaptcha.ready(async () => {
      try {
        const token = await grecaptcha.execute(siteKey, { action: String(action || 'submit') });
        resolve(String(token || ''));
      } catch (err) {
        reject(err);
      }
    });
  });
}

export async function verifyRecaptchaEnterpriseToken({ token, expectedAction }) {
  const res = await fetch('/api/recaptcha-assess', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, expectedAction }),
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // ignore
  }

  if (!res.ok || !data?.ok) {
    const err = new Error('reCAPTCHA verification failed');
    err.details = data;
    throw err;
  }

  return data;
}
