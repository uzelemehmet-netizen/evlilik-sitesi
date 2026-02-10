import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider.jsx';

const LS_PREFIX = 'uniqah:tour';
const SS_FORCE_KEY = 'uniqah:tour:force';

function safeUid(user) {
  const uid = String(user?.uid || '').trim();
  return uid || '';
}

function storageKey(uid, tourId) {
  return `${LS_PREFIX}:${tourId}:${uid}`;
}

function isShown(uid, tourId) {
  if (!uid || !tourId) return true;
  try {
    return window.localStorage.getItem(storageKey(uid, tourId)) === '1';
  } catch {
    return true;
  }
}

function markShown(uid, tourId) {
  if (!uid || !tourId) return;
  try {
    window.localStorage.setItem(storageKey(uid, tourId), '1');
  } catch {
    // ignore
  }
}

function consumeForcedTourId() {
  try {
    const raw = window.sessionStorage.getItem(SS_FORCE_KEY);
    if (!raw) return '';
    window.sessionStorage.removeItem(SS_FORCE_KEY);
    return String(raw || '').trim();
  } catch {
    return '';
  }
}

function matchesPath(step, pathname) {
  const p = String(pathname || '');
  if (step?.path && p === step.path) return true;
  if (step?.pathPrefix && p.startsWith(step.pathPrefix)) return true;
  return false;
}

function getTargetEl(selector) {
  if (!selector) return null;
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function computeTooltipPosition(rect, tooltipW = 340, tooltipH = 160) {
  const margin = 12;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

  let left = rect.left;
  left = clamp(left, margin, Math.max(margin, vw - tooltipW - margin));

  const preferBottom = rect.bottom + margin + tooltipH <= vh;
  const top = preferBottom ? rect.bottom + margin : Math.max(margin, rect.top - margin - tooltipH);

  const arrow = preferBottom ? 'top' : 'bottom';
  return { top, left, arrow };
}

function TourOverlay({ uid, tourId, step, stepIndex, totalSteps, labels, onSkip, onNext }) {
  const selector = step?.selector || '';
  const [rect, setRect] = useState(null);
  const missingSinceRef = useRef(0);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    let raf = 0;
    let alive = true;

    const update = () => {
      if (!alive) return;
      const el = getTargetEl(selector);
      const r = el?.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (r && Number.isFinite(r.left) && Number.isFinite(r.top)) {
        missingSinceRef.current = 0;
        setRect(r);
      } else {
        if (!missingSinceRef.current) missingSinceRef.current = Date.now();
        setRect(null);
      }
    };

    update();

    const onAny = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    window.addEventListener('resize', onAny);
    window.addEventListener('scroll', onAny, true);

    const interval = window.setInterval(update, 500);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      try {
        window.removeEventListener('resize', onAny);
        window.removeEventListener('scroll', onAny, true);
      } catch {
        // noop
      }
      try {
        window.clearInterval(interval);
      } catch {
        // noop
      }
    };
  }, [selector, stepIndex, uid, tourId]);

  const tooltip = useMemo(() => {
    if (!rect) return null;
    return computeTooltipPosition(rect);
  }, [rect]);

  const missingTooLong = useMemo(() => {
    const since = missingSinceRef.current;
    if (!since) return false;
    return Date.now() - since > 1200;
  }, [rect, stepIndex]);

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      {rect ? (
        <div
          className="absolute rounded-lg ring-4 ring-emerald-300/80"
          style={{
            left: Math.max(0, rect.left - 6),
            top: Math.max(0, rect.top - 6),
            width: Math.max(0, rect.width + 12),
            height: Math.max(0, rect.height + 12),
          }}
          aria-hidden="true"
        />
      ) : null}

      <div
        className="absolute"
        style={
          tooltip
            ? { left: tooltip.left, top: tooltip.top, width: 340 }
            : { left: 12, right: 12, bottom: 12, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }
        }
      >
        <div className="relative pointer-events-auto rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          {tooltip?.arrow ? (
            <div
              className={
                'absolute left-6 h-3 w-3 rotate-45 border border-slate-200 bg-white ' +
                (tooltip.arrow === 'top' ? '-top-1.5 border-b-0 border-r-0' : '-bottom-1.5 border-t-0 border-l-0')
              }
              aria-hidden="true"
            />
          ) : null}

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{step?.title || ''}</p>
              {step?.body ? <p className="mt-1 text-sm text-slate-700">{step.body}</p> : null}
              <p className="mt-2 text-xs text-slate-500">
                {stepIndex + 1}/{totalSteps}
              </p>
            </div>

            <button type="button" onClick={onSkip} className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              {step?.skipLabel || labels?.skip || ''}
            </button>
          </div>

          {missingTooLong && !rect ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-900">
              {step?.missingHint || labels?.missingHint || ''}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button type="button" onClick={onNext} className="app-btn app-btn-primary">
              {step?.nextLabel || (stepIndex + 1 === totalSteps ? labels?.done : labels?.next) || ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudioOneTimeTour() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = String(location?.pathname || '');

  const uid = safeUid(user);

  const labels = useMemo(() => {
    return {
      skip: t('tour.common.skip'),
      next: t('tour.common.next'),
      done: t('tour.common.done'),
      missingHint: t('tour.common.missingHint'),
    };
  }, [t]);

  const tours = useMemo(() => {
    return [
      {
        id: 'onboarding-preview',
        startOnPath: '/profilim',
        steps: [
          {
            path: '/profilim',
            selector: '[data-tutorial-id="profile-my-matches"]',
            title: t('tour.preview.matches.title'),
            body: t('tour.preview.matches.body'),
            nextLabel: t('tour.common.next'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
          },
          {
            path: '/app/matches',
            selector: '[data-tutorial-id="matches-go-pool"]',
            title: t('tour.preview.pool.title'),
            body: t('tour.preview.pool.body'),
            nextLabel: t('tour.common.next'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
          },
          {
            path: '/app/pool',
            selector: '[data-tutorial-id="pool-pre-match-request"]',
            title: t('tour.preview.request.title'),
            body: t('tour.preview.request.body'),
            nextLabel: t('tour.common.done'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
          },
        ],
      },
      {
        id: 'onboarding-main',
        startOnPath: '/profilim',
        steps: [
          {
            path: '/profilim',
            selector: '[data-tutorial-id="profile-my-matches"]',
            title: t('tour.onboarding.matches.title'),
            body: t('tour.onboarding.matches.body'),
            nextLabel: t('tour.common.next'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
          },
          {
            path: '/app/matches',
            selector: '[data-tutorial-id="matches-go-pool"]',
            title: t('tour.onboarding.pool.title'),
            body: t('tour.onboarding.pool.body'),
            nextLabel: t('tour.common.next'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
          },
          {
            path: '/app/pool',
            selector: '[data-tutorial-id="pool-pre-match-request"]',
            title: t('tour.onboarding.request.title'),
            body: t('tour.onboarding.request.body'),
            nextLabel: t('tour.common.done'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
          },
        ],
      },
      {
        id: 'feature-like',
        steps: [
          {
            path: '/app/matches',
            selector: '[data-tutorial-id="match-like"]',
            title: t('tour.like.title'),
            body: t('tour.like.body'),
            nextLabel: t('tour.common.done'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
          },
        ],
      },
      {
        id: 'feature-active-start',
        steps: [
          {
            path: '/app/matches',
            selector: '[data-tutorial-id="match-start-active"]',
            title: t('tour.activeStart.title'),
            body: t('tour.activeStart.body'),
            nextLabel: t('tour.common.done'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
          },
        ],
      },
      {
        id: 'feature-chat-basics',
        steps: [
          {
            pathPrefix: '/app/chat/',
            selector: '[data-tutorial-id="chat-input"]',
            title: t('tour.chat.input.title'),
            body: t('tour.chat.input.body'),
            nextLabel: t('tour.common.next'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
          },
          {
            pathPrefix: '/app/chat/',
            selector: '[data-tutorial-id="chat-send"]',
            title: t('tour.chat.send.title'),
            body: t('tour.chat.send.body'),
            nextLabel: t('tour.common.done'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
          },
        ],
      },
      {
        id: 'feature-profile-details-request',
        steps: [
          {
            pathPrefix: '/app/match/',
            selector: '[data-tutorial-id="match-profile-request-details"]',
            title: t('tour.profileDetails.title'),
            body: t('tour.profileDetails.body'),
            nextLabel: t('tour.common.done'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
          },
        ],
      },
    ];
  }, [t]);

  const [active, setActive] = useState(null); // { tourId, stepIndex }

  // Manual-start only: tour is shown only when explicitly requested.
  useEffect(() => {
    if (loading) return;
    if (!uid) {
      setActive(null);
      return;
    }
    if (active) return;

    // Do not run tours on non-app routes.
    if (pathname.startsWith('/admin') || pathname === '/login' || pathname === '/documents' || pathname === '/privacy') return;

    const forcedId = consumeForcedTourId();
    if (!forcedId) return;

    const tour = tours.find((x) => x.id === forcedId) || null;
    if (!tour || !Array.isArray(tour.steps) || tour.steps.length === 0) return;

    setActive({ tourId: tour.id, stepIndex: 0 });
    if (tour.startOnPath && pathname !== tour.startOnPath) {
      navigate(tour.startOnPath);
    }
  }, [active, loading, navigate, pathname, tours, uid]);

  const activeTour = useMemo(() => {
    if (!active?.tourId) return null;
    return tours.find((x) => x.id === active.tourId) || null;
  }, [active?.tourId, tours]);

  const step = useMemo(() => {
    if (!activeTour) return null;
    const idx = typeof active?.stepIndex === 'number' ? active.stepIndex : 0;
    return activeTour.steps?.[idx] || null;
  }, [activeTour, active?.stepIndex]);

  if (!uid || loading) return null;
  if (!activeTour || !step) return null;

  const totalSteps = Array.isArray(activeTour.steps) ? activeTour.steps.length : 1;
  const stepIndex = typeof active?.stepIndex === 'number' ? active.stepIndex : 0;

  const onSkip = () => {
    markShown(uid, activeTour.id);
    setActive(null);
  };

  const onNext = () => {
    if (stepIndex + 1 >= totalSteps) {
      markShown(uid, activeTour.id);
      setActive(null);
      return;
    }

    const nextStep = activeTour.steps[stepIndex + 1];
    setActive((s) => ({ ...s, stepIndex: stepIndex + 1 }));

    // If the next step is on a different route, navigate.
    if (nextStep?.path && pathname !== nextStep.path) {
      navigate(nextStep.path);
    }
  };

  // Only show overlay when we're on the expected route for current step.
  if (!matchesPath(step, pathname)) return null;

  return (
    <TourOverlay
      uid={uid}
      tourId={activeTour.id}
      step={step}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      labels={labels}
      onSkip={onSkip}
      onNext={onNext}
    />
  );
}
