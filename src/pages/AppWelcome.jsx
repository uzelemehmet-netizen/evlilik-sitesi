import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { ArrowRight, BellRing, CheckCircle2, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { auth } from '../config/firebaseAuth.js';
import EntryLanguageSelect from '../components/EntryLanguageSelect.jsx';
import PublicReviewsShowcase from '../components/reviews/PublicReviewsShowcase.jsx';
import { sanitizePostAuthTarget } from '../utils/postAuthRedirect.js';
import { staticAssetUrl } from '../utils/staticAssetUrl.js';

const DEFAULT_TARGET = '/app/matches';
const SIGNUP_TARGET = '/evlilik/eslestirme-basvuru?w=1';
const APP_WELCOME_GOOGLE_SIGNUP_KEY = 'app_welcome_google_signup_v1';
const POST_AUTH_NAV_KEY = 'auth_post_auth_nav_v1';
const AUTH_INTENT_KEY = 'auth_intent';
const AUTH_PROVIDER_KEY = 'auth_provider';
const JUST_SIGNED_UP_KEY = 'auth_just_signed_up';

function preloadLoginChunk() {
  try {
    void import('./Login');
  } catch {
    // ignore
  }
}

function buildAuthState(locationState, target) {
  if (!locationState || typeof locationState !== 'object') {
    return { from: target, fromState: null };
  }
  return {
    from: target,
    fromState: locationState.fromState || null,
  };
}

export default function AppWelcome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const googleLogoSrc = useMemo(() => staticAssetUrl('/google-logo.png'), []);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const readGoogleSignupMarker = useCallback(() => {
    try {
      return sessionStorage.getItem(APP_WELCOME_GOOGLE_SIGNUP_KEY) === '1';
    } catch {
      return false;
    }
  }, []);

  const writeGoogleSignupMarker = useCallback((value) => {
    try {
      if (value) sessionStorage.setItem(APP_WELCOME_GOOGLE_SIGNUP_KEY, '1');
      else sessionStorage.removeItem(APP_WELCOME_GOOGLE_SIGNUP_KEY);
    } catch {
      // ignore
    }
  }, []);

  const writePendingPostAuthNav = useCallback((target, state = null) => {
    try {
      const nextTarget = String(target || '').trim();
      if (!nextTarget) return;
      sessionStorage.setItem(
        POST_AUTH_NAV_KEY,
        JSON.stringify({ target: nextTarget, state: state ?? null, atMs: Date.now() })
      );
    } catch {
      // ignore
    }
  }, []);

  const writeSignupIntentMarkers = useCallback(() => {
    try {
      sessionStorage.setItem(AUTH_INTENT_KEY, 'signup');
      sessionStorage.setItem(AUTH_PROVIDER_KEY, 'google');
      sessionStorage.setItem(JUST_SIGNED_UP_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }, []);

  const waitForAuthUser = useCallback((expectedUid = '', timeoutMs = 4500) => {
    return new Promise((resolve) => {
      const wantedUid = String(expectedUid || '').trim();
      const existing = auth?.currentUser;
      if (existing?.uid && (!wantedUid || existing.uid === wantedUid)) {
        resolve(existing);
        return;
      }

      let settled = false;
      let unsubscribe = () => {};

      const finish = (nextUser) => {
        if (settled) return;
        settled = true;
        try {
          unsubscribe();
        } catch {
          // ignore
        }
        if (!nextUser?.uid) {
          resolve(null);
          return;
        }
        if (wantedUid && nextUser.uid !== wantedUid) {
          resolve(null);
          return;
        }
        resolve(nextUser);
      };

      const timerId = window.setTimeout(() => finish(auth?.currentUser || null), timeoutMs);
      unsubscribe = onAuthStateChanged(
        auth,
        (nextUser) => {
          if (!nextUser?.uid) return;
          window.clearTimeout(timerId);
          finish(nextUser);
        },
        () => {
          window.clearTimeout(timerId);
          finish(auth?.currentUser || null);
        }
      );
    });
  }, []);

  const ensureSignupScaffold = useCallback(async (userRef) => {
    const uid = String(userRef?.uid || '').trim();
    if (!uid || typeof userRef?.getIdToken !== 'function') return;

    const token = await userRef.getIdToken().catch(() => '');
    if (!token) return;

    const headers = {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    };

    await Promise.allSettled([
      fetch('/api/matchmaking-user-ensure', {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      }),
      fetch('/api/matchmaking-application-bootstrap', {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
        keepalive: true,
      }),
    ]);
  }, []);

  const navigateToSignupTarget = useCallback(async (expectedUid = '') => {
    writePendingPostAuthNav(SIGNUP_TARGET, null);
    const readyUser = await waitForAuthUser(expectedUid, 2400);
    if (!readyUser?.uid) return false;

    try {
      if (typeof window !== 'undefined' && window.location?.pathname === '/app/welcome') {
        window.location.assign(SIGNUP_TARGET);
        return true;
      }
    } catch {
      // ignore
    }

    navigate(SIGNUP_TARGET, { replace: true, state: null });
    return true;
  }, [navigate, waitForAuthUser, writePendingPostAuthNav]);

  const finalizeDirectGoogleSignup = useCallback(async (authResult = null) => {
    const userRef = authResult?.user || auth?.currentUser || null;
    if (!userRef?.uid) return false;

    writeSignupIntentMarkers();
    await ensureSignupScaffold(userRef);
    const navigated = await navigateToSignupTarget(userRef.uid);
    if (navigated) {
      writeGoogleSignupMarker(false);
      setGoogleBusy(false);
      setGoogleError('');
      return true;
    }

    return false;
  }, [ensureSignupScaffold, navigateToSignupTarget, writeGoogleSignupMarker, writeSignupIntentMarkers]);

  const nextTarget = useMemo(() => {
    const candidate = typeof location.state?.from === 'string' ? location.state.from : DEFAULT_TARGET;
    return sanitizePostAuthTarget(candidate, DEFAULT_TARGET);
  }, [location.state]);

  const authState = useMemo(() => buildAuthState(location.state, nextTarget), [location.state, nextTarget]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.isAnonymous) return;
    if (readGoogleSignupMarker()) return;
    navigate(nextTarget, { replace: true, state: authState.fromState || null });
  }, [authState.fromState, loading, navigate, nextTarget, readGoogleSignupMarker, user]);

  useEffect(() => {
    let active = true;
    if (!readGoogleSignupMarker()) return undefined;

    setGoogleBusy(true);

    (async () => {
      try {
        const result = await getRedirectResult(auth).catch(() => null);
        if (!active) return;

        if (result?.user) {
          const handled = await finalizeDirectGoogleSignup(result);
          if (handled || !active) return;
        }

        const restoredUser = await waitForAuthUser('', 5200);
        if (!active) return;

        if (restoredUser?.uid) {
          const handled = await finalizeDirectGoogleSignup({ user: restoredUser });
          if (handled || !active) return;
        }

        setGoogleBusy(false);
        setGoogleError(t('authPage.errors.googleRedirectNoResult'));
      } catch {
        if (!active) return;
        setGoogleBusy(false);
        setGoogleError(t('authPage.errors.googleFailed'));
      }
    })();

    return () => {
      active = false;
    };
  }, [finalizeDirectGoogleSignup, readGoogleSignupMarker, t, waitForAuthUser]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.isAnonymous) return;
    if (!readGoogleSignupMarker()) return;

    let active = true;
    setGoogleBusy(true);

    (async () => {
      const handled = await finalizeDirectGoogleSignup({ user });
      if (!active) return;
      if (!handled) {
        setGoogleBusy(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [finalizeDirectGoogleSignup, loading, readGoogleSignupMarker, user]);

  useEffect(() => {
    preloadLoginChunk();
  }, []);

  const startGoogleSignup = useCallback(async () => {
    setGoogleBusy(true);
    setGoogleError('');
    writeGoogleSignupMarker(true);
    writeSignupIntentMarkers();
    writePendingPostAuthNav(SIGNUP_TARGET, null);

    try {
      const provider = new GoogleAuthProvider();
      const lang = String(t('navigation.languageCode', { defaultValue: 'tr' }) || 'tr').trim().toLowerCase();
      try {
        provider.setCustomParameters({ hl: lang.startsWith('id') ? 'id' : lang.startsWith('en') ? 'en' : 'tr' });
      } catch {
        // ignore
      }

      try {
        const popupResult = await signInWithPopup(auth, provider);
        const handled = await finalizeDirectGoogleSignup(popupResult);
        if (!handled) {
          setGoogleBusy(false);
        }
        return;
      } catch (popupError) {
        const code = String(popupError?.code || '').trim();
        const canFallbackToRedirect =
          code === 'auth/popup-blocked' ||
          code === 'auth/cancelled-popup-request' ||
          code === 'auth/operation-not-supported-in-this-environment' ||
          code === 'auth/web-storage-unsupported';

        if (!canFallbackToRedirect) {
          throw popupError;
        }
      }

      await signInWithRedirect(auth, provider);
    } catch (error) {
      writeGoogleSignupMarker(false);
      setGoogleBusy(false);

      const code = String(error?.code || '').trim();
      if (code === 'auth/popup-closed-by-user' || code === 'auth/user-cancelled') {
        setGoogleError(t('authPage.errors.googlePopupClosed'));
        return;
      }

      if (code === 'auth/network-request-failed') {
        setGoogleError(t('authPage.errors.networkFailed'));
        return;
      }

      setGoogleError(String(error?.message || '').trim() || t('authPage.errors.googleFailed'));
    }
  }, [finalizeDirectGoogleSignup, t, writeGoogleSignupMarker, writePendingPostAuthNav, writeSignupIntentMarkers]);

  const openLogin = async ({ mode, auto, method } = {}) => {
    const params = new URLSearchParams();
    params.set('mode', mode || 'login');
    if (auto) params.set('auto', auto);
    if (method) params.set('method', method);

    try {
      await import('./Login');
    } catch {
      // ignore
    }

    navigate(`/login?${params.toString()}`, { state: authState });
  };

  const steps = [
    {
      icon: Smartphone,
      title: t('authPage.appEntry.steps.account.title'),
      body: t('authPage.appEntry.steps.account.body'),
    },
    {
      icon: CheckCircle2,
      title: t('authPage.appEntry.steps.form.title'),
      body: t('authPage.appEntry.steps.form.body'),
    },
    {
      icon: BellRing,
      title: t('authPage.appEntry.steps.notify.title'),
      body: t('authPage.appEntry.steps.notify.body'),
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#d9f5ef_0%,#f6fbfa_34%,#eef4ff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700/80">
              {t('authPage.appEntry.eyebrow')}
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-950">Uniqah</div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <EntryLanguageSelect />
            <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
              PWA
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid flex-1 gap-6 lg:mt-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center">
          <div className="order-2 relative overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(145deg,#062c30_0%,#0b3a49_48%,#0f172a_100%)] p-6 text-white shadow-[0_40px_100px_rgba(15,23,42,0.24)] md:p-8 lg:order-1">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),rgba(255,255,255,0)_42%)]" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                <span>{t('authPage.appEntry.badge')}</span>
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
                {t('authPage.appEntry.title')}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/74 md:text-base">
                {t('authPage.appEntry.subtitle')}
              </p>

              <div className="mt-6 rounded-[28px] border border-white/12 bg-white/8 p-4 backdrop-blur-sm md:p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  {t('authPage.appEntry.stepsTitle')}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.title} className="rounded-2xl border border-white/10 bg-slate-950/22 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.16)]">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-white">
                          <Icon size={18} />
                        </div>
                        <div className="mt-4 text-base font-semibold text-white">{step.title}</div>
                        <div className="mt-2 text-sm leading-relaxed text-white/70">{step.body}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 rounded-[26px] border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-relaxed text-emerald-50/92 md:max-w-2xl">
                <div className="font-semibold">{t('authPage.trustNote.title')}</div>
                <div className="mt-2 text-emerald-50/85">{t('authPage.signupGuide')}</div>
              </div>
            </div>
          </div>

          <div className="order-1 relative rounded-[30px] border border-slate-200 bg-white/88 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-6 lg:order-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
              {t('authPage.appEntry.ctaEyebrow')}
            </div>
            <div className="mt-3 text-2xl font-semibold leading-tight text-slate-950">
              {t('authPage.appEntry.ctaTitle')}
            </div>
            <div className="mt-3 text-sm leading-relaxed text-slate-600">
              {t('authPage.appEntry.ctaBody')}
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={startGoogleSignup}
                onMouseEnter={preloadLoginChunk}
                onTouchStart={preloadLoginChunk}
                disabled={googleBusy}
                className="relative w-full rounded-2xl bg-slate-950 px-5 py-4 text-left text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition hover:bg-slate-900"
              >
                <span className="absolute left-5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white ring-1 ring-white/60 shadow-[0_6px_14px_rgba(255,255,255,0.18)]">
                  <img src={googleLogoSrc} alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
                </span>
                <span className="block w-full px-10 text-center">
                  {googleBusy ? t('authPage.redirecting') : t('authPage.googleSignupCta')}
                </span>
                <ArrowRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2" />
              </button>

              {googleError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-900">
                  {googleError}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => openLogin({ mode: 'signup', method: 'email' })}
                onMouseEnter={preloadLoginChunk}
                onTouchStart={preloadLoginChunk}
                className="relative w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <span className="absolute left-5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-[0_4px_10px_rgba(148,163,184,0.14)]">
                  <Mail size={16} />
                </span>
                <span className="block w-full px-10 text-center">
                  {t('authPage.emailSignupCta')}
                </span>
                <ArrowRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2" />
              </button>

              <button
                type="button"
                onClick={() => openLogin({ mode: 'login' })}
                onMouseEnter={preloadLoginChunk}
                onTouchStart={preloadLoginChunk}
                className="flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-left text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
              >
                <span>{t('authPage.actions.login')}</span>
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600">
              {t('authPage.appEntry.footerNote')}
            </div>
          </div>
        </div>

        <PublicReviewsShowcase />
      </div>
    </div>
  );
}