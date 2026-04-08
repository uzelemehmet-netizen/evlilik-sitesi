import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BellRing, CheckCircle2, Smartphone } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { sanitizePostAuthTarget } from '../utils/postAuthRedirect.js';

const DEFAULT_TARGET = '/app/matches';

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

  const nextTarget = useMemo(() => {
    const candidate = typeof location.state?.from === 'string' ? location.state.from : DEFAULT_TARGET;
    return sanitizePostAuthTarget(candidate, DEFAULT_TARGET);
  }, [location.state]);

  const authState = useMemo(() => buildAuthState(location.state, nextTarget), [location.state, nextTarget]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.isAnonymous) return;
    navigate(nextTarget, { replace: true, state: authState.fromState || null });
  }, [authState.fromState, loading, navigate, nextTarget, user]);

  useEffect(() => {
    preloadLoginChunk();
  }, []);

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
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700/80">
              {t('authPage.appEntry.eyebrow')}
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-950">Uniqah</div>
          </div>
          <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
            PWA
          </div>
        </div>

        <div className="relative mt-8 grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center">
          <div className="relative overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(145deg,#062c30_0%,#0b3a49_48%,#0f172a_100%)] p-6 text-white shadow-[0_40px_100px_rgba(15,23,42,0.24)] md:p-8">
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

          <div className="relative rounded-[30px] border border-slate-200 bg-white/88 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-6">
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
                onClick={() => openLogin({ mode: 'signup', auto: 'google' })}
                onMouseEnter={preloadLoginChunk}
                onTouchStart={preloadLoginChunk}
                className="flex w-full items-center justify-between rounded-2xl bg-slate-950 px-5 py-4 text-left text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition hover:bg-slate-900"
              >
                <span>{t('authPage.googleSignupCta')}</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={() => openLogin({ mode: 'signup', method: 'email' })}
                onMouseEnter={preloadLoginChunk}
                onTouchStart={preloadLoginChunk}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <span>{t('authPage.emailSignupCta')}</span>
                <ArrowRight size={18} />
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
      </div>
    </div>
  );
}