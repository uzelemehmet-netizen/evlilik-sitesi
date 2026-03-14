import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setTutorialActive } from '../../utils/tutorialState.js';

const LS_SEEN_PREFIX = 'uniqah:tour:publicSeen';

function seenKey(tourId) {
  const id = String(tourId || '').trim();
  return `${LS_SEEN_PREFIX}:${id}`;
}

function isTourSeen(tourId) {
  const key = seenKey(tourId);
  if (!key) return true;
  try {
    if (typeof window === 'undefined') return true;
    if (window.localStorage.getItem(key) === '1') return true;
  } catch {
    // ignore
  }
  try {
    if (typeof window === 'undefined') return true;
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return true;
  }
}

function markTourSeen(tourId) {
  const key = seenKey(tourId);
  if (!key) return;
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, '1');
  } catch {
    // ignore
  }
  try {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(key, '1');
  } catch {
    // ignore
  }
}

function trOr(t, key, fallback) {
  try {
    const v = t(key);
    if (!v || v === key) return fallback;
    return v;
  } catch {
    return fallback;
  }
}

function scopeFromPath(pathname) {
  const p = String(pathname || '');
  if (p === '/') return 'home';
  if (p.startsWith('/wedding') || p.startsWith('/evlilik')) return 'wedding';
  return '';
}

function OverlayCard({ step, stepIndex, totalSteps, labels, onSkip, onNext }) {
  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div className="absolute left-3 right-3 top-24 max-w-2xl mx-auto">
        <div className="relative pointer-events-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base sm:text-lg font-bold text-slate-900">{step?.title || ''}</p>
              {step?.body ? <p className="mt-2 text-base text-slate-800 leading-relaxed">{step.body}</p> : null}
              <p className="mt-3 text-xs text-slate-500">
                {stepIndex + 1}/{totalSteps}
              </p>
            </div>

            <button
              type="button"
              onClick={onSkip}
              className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              {labels.skip}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button type="button" onClick={onNext} className="app-btn app-btn-primary">
              {stepIndex + 1 === totalSteps ? labels.done : labels.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicOneTimeTour() {
  const { t } = useTranslation();
  const location = useLocation();

  const labels = useMemo(() => {
    return {
      skip: trOr(t, 'tour.common.skip', 'Geç'),
      next: trOr(t, 'tour.common.next', 'Devam'),
      done: trOr(t, 'tour.common.done', 'Bitti'),
    };
  }, [t]);

  const pathname = String(location?.pathname || '');
  const scope = scopeFromPath(pathname);

  const tours = useMemo(() => {
    // IMPORTANT: Order is intentional (step1 = payment/trust, step2 = guidance process)
    const step1 = {
      title: t('tour.publicGuidance.step1.title'),
      body: t('tour.publicGuidance.step1.body'),
    };

    const step2 = {
      title: t('tour.publicGuidance.step2.title'),
      body: t('tour.publicGuidance.step2.body'),
    };

    return [
      {
        id: 'public-guidance-home',
        match: (p) => p === '/',
        steps: [step1, step2],
      },
      {
        id: 'public-guidance-wedding',
        match: (p) => p.startsWith('/wedding') || p.startsWith('/evlilik'),
        steps: [step1, step2],
      },
    ];
  }, [t]);

  const [active, setActive] = useState(null); // { tourId, stepIndex }
  const prevScopeRef = useRef('');

  useEffect(() => {
    setTutorialActive(!!active?.tourId);
    return () => setTutorialActive(false);
  }, [active?.tourId]);

  const activeTour = useMemo(() => {
    if (!active?.tourId) return null;
    return tours.find((x) => x.id === active.tourId) || null;
  }, [active?.tourId, tours]);

  const step = useMemo(() => {
    if (!activeTour) return null;
    const idx = typeof active?.stepIndex === 'number' ? active.stepIndex : 0;
    return activeTour.steps?.[idx] || null;
  }, [active?.stepIndex, activeTour]);

  useEffect(() => {
    const prevScope = prevScopeRef.current;
    if (scope === prevScope) return;

    prevScopeRef.current = scope;

    if (scope === 'home') {
      const id = 'public-guidance-home';
      if (isTourSeen(id)) {
        setActive(null);
        return;
      }
      // "Sadece bir defa" davranışı: tur açıldığı anda seen işaretle.
      // Böylece kullanıcı sayfayı yenilese/kapatsa bile tekrar açılmaz.
      markTourSeen(id);
      setActive({ tourId: id, stepIndex: 0 });
      return;
    }

    if (scope === 'wedding') {
      const id = 'public-guidance-wedding';
      if (isTourSeen(id)) {
        setActive(null);
        return;
      }
      markTourSeen(id);
      setActive({ tourId: id, stepIndex: 0 });
      return;
    }

    // Not a supported public scope.
    setActive(null);
  }, [scope]);

  if (!activeTour || !step) return null;

  const totalSteps = Array.isArray(activeTour.steps) ? activeTour.steps.length : 1;
  const stepIndex = typeof active?.stepIndex === 'number' ? active.stepIndex : 0;

  const onSkip = () => {
    try {
      if (activeTour?.id) markTourSeen(activeTour.id);
    } catch {
      // ignore
    }
    setActive(null);
  };

  const onNext = () => {
    if (stepIndex + 1 >= totalSteps) {
      try {
        if (activeTour?.id) markTourSeen(activeTour.id);
      } catch {
        // ignore
      }
      setActive(null);
      return;
    }
    setActive((s) => ({ ...s, stepIndex: stepIndex + 1 }));
  };

  return (
    <OverlayCard
      step={step}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      labels={labels}
      onSkip={onSkip}
      onNext={onNext}
    />
  );
}
