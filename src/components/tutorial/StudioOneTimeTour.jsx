import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { setTutorialActive } from '../../utils/tutorialState.js';
import { enablePushForCurrentUser, hasSavedPushToken } from '../../utils/pushNotifications.js';
import { isPwaInstalled } from '../../utils/pwaInstalled.js';

const LS_PREFIX = 'uniqah:tour';
const SS_FORCE_KEY = 'uniqah:tour:force';

function safeUid(user) {
  const uid = String(user?.uid || '').trim();
  return uid || '';
}

function storageKey(uid, tourId) {
  return `${LS_PREFIX}:${tourId}:${uid}`;
}

function storageKeyCount(uid, tourId) {
  return `${LS_PREFIX}:${tourId}:${uid}:shownCount`;
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

function getShownCount(uid, tourId) {
  if (!uid || !tourId) return 0;
  try {
    const raw = window.localStorage.getItem(storageKeyCount(uid, tourId));
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function incrementShownCount(uid, tourId) {
  if (!uid || !tourId) return 0;
  try {
    const next = getShownCount(uid, tourId) + 1;
    window.localStorage.setItem(storageKeyCount(uid, tourId), String(next));
    return next;
  } catch {
    return getShownCount(uid, tourId);
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

function TourOverlay({ uid, tourId, step, stepIndex, totalSteps, labels, onSkip, onNext, onPrimaryAction, primaryBusy }) {
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
            {typeof onPrimaryAction === 'function' ? (
              <button type="button" onClick={onPrimaryAction} className="app-btn app-btn-primary" disabled={!!primaryBusy}>
                {primaryBusy ? labels?.processing || '' : step?.primaryLabel || ''}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onNext}
              className={typeof onPrimaryAction === 'function' ? 'app-btn app-btn-outline' : 'app-btn app-btn-primary'}
            >
              {step?.nextLabel || (stepIndex + 1 === totalSteps ? labels?.done : labels?.next) || ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function isPushEnabledInBrowser() {
  if (typeof window === 'undefined') return false;
  try {
    if (!('Notification' in window)) return false;
    if (String(Notification.permission || '') !== 'granted') return false;
  } catch {
    return false;
  }

  try {
    return hasSavedPushToken();
  } catch {
    return false;
  }
}

export default function StudioOneTimeTour() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const pwaNudgeDismissedRef = useRef(false);
  const forcedTourJustStartedRef = useRef(false);
  const pwaNudgeWentOfflineRef = useRef(false);
  const [pwaNudgeOnlineSeq, setPwaNudgeOnlineSeq] = useState(0);

  const pathname = String(location?.pathname || '');

  const uid = safeUid(user);

  const labels = useMemo(() => {
    return {
      skip: t('tour.common.skip'),
      next: t('tour.common.next'),
      done: t('tour.common.done'),
      missingHint: t('tour.common.missingHint'),
      processing: t('studio.common.processing'),
    };
  }, [t]);

  const tours = useMemo(() => {
    return [
      {
        id: 'pwa-install-nudge',
        startOnPath: '/profilim',
        steps: [
          {
            path: '/profilim',
            selector: '[data-tutorial-id="pwa-install-card"]',
            title: t('tour.pwaNudge.title'),
            body: t('tour.pwaNudge.body'),
            primaryLabel: t('tour.pwaNudge.primary'),
            nextLabel: t('tour.pwaNudge.later'),
            skipLabel: t('tour.common.skip'),
            missingHint: t('tour.common.missingHint'),
            actionKey: 'install_and_notify',
          },
        ],
      },
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

  // Track offline→online transitions so PWA nudge can be shown once when coming back online.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      pwaNudgeWentOfflineRef.current = !window.navigator?.onLine;
    } catch {
      pwaNudgeWentOfflineRef.current = false;
    }

    const onOffline = () => {
      pwaNudgeWentOfflineRef.current = true;
      // Allow showing again after a new offline→online cycle.
      pwaNudgeDismissedRef.current = false;
    };

    const onOnline = () => {
      setPwaNudgeOnlineSeq((n) => n + 1);
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      try {
        window.removeEventListener('offline', onOffline);
        window.removeEventListener('online', onOnline);
      } catch {
        // noop
      }
    };
  }, []);

  const [active, setActive] = useState(null); // { tourId, stepIndex }
  const [primaryBusy, setPrimaryBusy] = useState(false);

  useEffect(() => {
    setTutorialActive(!!active?.tourId);
    return () => {
      setTutorialActive(false);
    };
  }, [active?.tourId]);

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

    forcedTourJustStartedRef.current = true;
    setActive({ tourId: tour.id, stepIndex: 0 });
    if (tour.startOnPath && pathname !== tour.startOnPath) {
      navigate(tour.startOnPath);
    }
  }, [active, loading, navigate, pathname, tours, uid]);

  // Auto nudge: show once after offline→online (non-mandatory).
  useEffect(() => {
    if (loading) return;
    if (!uid) return;
    if (active) return;

    // Only react to an online event (avoid showing on normal navigation).
    if (!pwaNudgeOnlineSeq) return;

    // Only show if we previously went offline.
    if (!pwaNudgeWentOfflineRef.current) return;

    // If we're still offline, do nothing (wait for real online).
    try {
      if (typeof window !== 'undefined' && window.navigator?.onLine === false) return;
    } catch {
      // ignore
    }

    // Disarm immediately so this online event triggers at most once.
    pwaNudgeWentOfflineRef.current = false;

    // If a forced tour was started in this cycle, don't override it.
    if (forcedTourJustStartedRef.current) {
      forcedTourJustStartedRef.current = false;
      return;
    }

    if (pwaNudgeDismissedRef.current) return;

    // Do not run tours on non-app routes.
    if (pathname.startsWith('/admin') || pathname === '/login' || pathname === '/documents' || pathname === '/privacy') return;

    // If the user already installed the app, don't show the "install" tutorial again.
    // Notifications can still be enabled from the UI without this tour.
    const installed = isPwaInstalled();
    if (installed) return;

    // Show at most 2 times per user (persistent).
    const maxAutoShows = 2;
    if (getShownCount(uid, 'pwa-install-nudge') >= maxAutoShows) return;

    const needsInstall = !installed;
    const needsPush = !isPushEnabledInBrowser();
    if (!needsInstall && !needsPush) return;

    const tour = tours.find((x) => x.id === 'pwa-install-nudge') || null;
    if (!tour || !Array.isArray(tour.steps) || tour.steps.length === 0) return;

    // Count immediately to avoid re-showing on every Profile visit.
    incrementShownCount(uid, 'pwa-install-nudge');
    setActive({ tourId: tour.id, stepIndex: 0 });
    if (tour.startOnPath && pathname !== tour.startOnPath) {
      navigate(tour.startOnPath);
    }
  }, [active, loading, navigate, pathname, pwaNudgeOnlineSeq, tours, uid]);

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
    // This tour should re-appear every entry until completed.
    if (activeTour.id !== 'pwa-install-nudge') markShown(uid, activeTour.id);
    else pwaNudgeDismissedRef.current = true;
    setActive(null);
  };

  const onNext = () => {
    if (stepIndex + 1 >= totalSteps) {
      if (activeTour.id !== 'pwa-install-nudge') markShown(uid, activeTour.id);
      else pwaNudgeDismissedRef.current = true;
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

  const onPrimaryAction = async () => {
    if (!step?.actionKey) return;
    if (primaryBusy) return;
    if (step.actionKey !== 'install_and_notify') return;

    setPrimaryBusy(true);
    try {
      // 1) Trigger PWA install prompt synchronously (gesture-sensitive; best-effort)
      let installChoicePromise = null;
      try {
        const dp = typeof window !== 'undefined' ? window.__uniqahDeferredPrompt : null;
        if (dp && typeof dp.prompt === 'function') {
          dp.prompt();
          installChoicePromise = dp.userChoice?.catch?.(() => null) || null;
        }
      } catch {
        installChoicePromise = null;
      }

      // 2) Enable notifications (permission + token upsert)
      await enablePushForCurrentUser().catch(() => null);

      // Wait install choice if we started it (best-effort)
      if (installChoicePromise) {
        await installChoicePromise;
      }
    } finally {
      setPrimaryBusy(false);
      onNext();
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
      onPrimaryAction={step?.actionKey ? onPrimaryAction : null}
      primaryBusy={primaryBusy}
    />
  );
}
