import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { db } from '../../config/firebaseDb';
import { authFetch } from '../../utils/authFetch';
import { isDeferredPhotoInteractionRequiredFromUserDoc } from '../../utils/matchmakingProfileCompletion';

const LS_PREFIX = 'uniqah:app-review-prompt';
const OPEN_EVENT = 'uniqah:open-app-review-prompt';
const STATUS_EVENT = 'uniqah:app-review-prompt:status';
const OPEN_SOURCE_KEY = 'uniqah:app-review-prompt:source';
const AUTO_PROMPT_DELAY_MS = 2 * 24 * 60 * 60 * 1000;

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function storageKey(uid) {
  return `${LS_PREFIX}:${safeStr(uid)}`;
}

function hasSeen(uid) {
  try {
    return window.localStorage.getItem(storageKey(uid)) === '1';
  } catch {
    return false;
  }
}

function markSeen(uid) {
  try {
    window.localStorage.setItem(storageKey(uid), '1');
  } catch {
    // ignore
  }
}

function parseTimeMs(value) {
  if (!value) return 0;
  const ms = Date.parse(String(value));
  return Number.isFinite(ms) ? ms : 0;
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({ length: 5 }, (_, idx) => (idx < safeRating ? '★' : '☆'));
}

function consumeManualOpenSource() {
  try {
    const raw = window.sessionStorage.getItem(OPEN_SOURCE_KEY);
    window.sessionStorage.removeItem(OPEN_SOURCE_KEY);
    return safeStr(raw);
  } catch {
    return '';
  }
}

function dispatchPromptStatus(status) {
  try {
    window.dispatchEvent(new CustomEvent(STATUS_EVENT, { detail: { status: safeStr(status) } }));
  } catch {
    // ignore
  }
}

export default function AppReviewPrompt() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, loading } = useAuth();

  const [open, setOpen] = useState(false);
  const [openSource, setOpenSource] = useState('auto_prompt');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitState, setSubmitState] = useState({ loading: false, error: '', ok: false });
  const [promptState, setPromptState] = useState({ loading: true, state: 'none' });
  const [photoGateActive, setPhotoGateActive] = useState(false);

  const pathname = String(location?.pathname || '');
  const uid = safeStr(user?.uid);

  useEffect(() => {
    if (!uid || user?.isAnonymous) {
      setPhotoGateActive(false);
      return undefined;
    }

    const ref = doc(db, 'matchmakingUsers', uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const docData = snap.exists() ? (snap.data() || {}) : {};
        setPhotoGateActive(isDeferredPhotoInteractionRequiredFromUserDoc(docData));
      },
      () => {
        setPhotoGateActive(false);
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // ignore
      }
    };
  }, [uid, user?.isAnonymous]);

  const openPrompt = useCallback((source = 'auto_prompt') => {
    setOpenSource(safeStr(source) || 'auto_prompt');
    setRating(0);
    setMessage('');
    setSubmitState({ loading: false, error: '', ok: false });
    setOpen(true);
  }, []);

  const accountCreatedAtMs = useMemo(() => parseTimeMs(user?.metadata?.creationTime), [user?.metadata?.creationTime]);
  const eligiblePath = useMemo(() => {
    if (!pathname) return false;
    if (pathname === '/profilim') return true;
    if (pathname.startsWith('/profilim/')) return pathname !== '/profilim/destek';
    if (!pathname.startsWith('/app/')) return false;
    return pathname !== '/app/welcome' && pathname !== '/app/install';
  }, [pathname]);

  const markPromptShown = useCallback(
    async (source = 'auto_prompt') => {
      if (!uid || user?.isAnonymous) return false;
      try {
        const data = await authFetch('/api/matchmaking-feedback-status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            action: 'mark_shown',
            source: safeStr(source) || 'auto_prompt',
            pagePath: pathname || '/profilim',
          }),
        });

        if (!data?.ok) return false;
        const nextState = safeStr(data?.state);
        setPromptState({
          loading: false,
          state: nextState === 'submitted' || nextState === 'skipped' || nextState === 'shown' ? nextState : 'shown',
        });
        return true;
      } catch {
        return false;
      }
    },
    [pathname, uid, user?.isAnonymous]
  );

  const openOnce = useCallback(
    async (source = 'auto_prompt') => {
      if (!uid || user?.isAnonymous) return;
      if (photoGateActive) return;
      if (promptState.loading) return;
      if (safeStr(promptState.state) !== 'none') return;

      const normalizedSource = safeStr(source) || 'auto_prompt';
      markSeen(uid);
      await markPromptShown(normalizedSource);
      setPromptState((prev) => (prev.state === 'none' ? { loading: false, state: 'shown' } : prev));
      dispatchPromptStatus('shown');
      openPrompt(normalizedSource);
    },
    [markPromptShown, openPrompt, photoGateActive, promptState.loading, promptState.state, uid, user?.isAnonymous]
  );

  useEffect(() => {
    let active = true;

    if (loading) return undefined;
    if (!uid || user?.isAnonymous) {
      setPromptState({ loading: false, state: 'none' });
      return undefined;
    }

    setPromptState((prev) => ({ ...prev, loading: true }));

    (async () => {
      try {
        const data = await authFetch('/api/matchmaking-feedback-status', { method: 'GET' });
        if (!active) return;
        const nextState = safeStr(data?.state);
        setPromptState({
          loading: false,
          state: nextState === 'submitted' || nextState === 'skipped' || nextState === 'shown' ? nextState : 'none',
        });
      } catch {
        if (!active) return;
        setPromptState({ loading: false, state: hasSeen(uid) ? 'shown' : 'none' });
      }
    })();

    return () => {
      active = false;
    };
  }, [loading, uid, user?.isAnonymous]);

  useEffect(() => {
    if (loading) return undefined;
    if (!uid || user?.isAnonymous) return undefined;
    if (!eligiblePath) return undefined;
    if (photoGateActive) return undefined;
    if (promptState.loading) return undefined;
    if (safeStr(promptState.state) !== 'none') return undefined;
    if (hasSeen(uid)) {
      setPromptState((prev) => (prev.state === 'none' ? { loading: false, state: 'shown' } : prev));
      return undefined;
    }

    const nowMs = Date.now();
    const autoPromptAtMs = accountCreatedAtMs > 0 ? accountCreatedAtMs + AUTO_PROMPT_DELAY_MS : 0;
    const waitMs = autoPromptAtMs > 0 ? Math.max(0, autoPromptAtMs - nowMs) : AUTO_PROMPT_DELAY_MS;

    const timer = window.setTimeout(() => {
      void openOnce('auto_prompt');
    }, waitMs + 1400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [accountCreatedAtMs, eligiblePath, loading, openOnce, photoGateActive, promptState.loading, promptState.state, uid, user?.isAnonymous]);

  useEffect(() => {
    const handleOpen = () => {
      if (!uid || user?.isAnonymous) return;
      if (photoGateActive) return;
      if (promptState.loading) return;
      if (safeStr(promptState.state) !== 'none') return;
      const eventSource = consumeManualOpenSource() || 'manual_open';
      void openOnce(eventSource);
    };

    try {
      window.addEventListener(OPEN_EVENT, handleOpen);
    } catch {
      return undefined;
    }

    return () => {
      try {
        window.removeEventListener(OPEN_EVENT, handleOpen);
      } catch {
        // ignore
      }
    };
  }, [openOnce, photoGateActive, promptState.loading, promptState.state, uid, user?.isAnonymous]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const canSubmit = rating >= 1 && !submitState.loading;

  const close = () => setOpen(false);

  const submitSkip = async () => {
    if (submitState.loading) return;
    setSubmitState({ loading: true, error: '', ok: false });
    try {
      const data = await authFetch('/api/matchmaking-feedback-submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'review',
          skipped: true,
          source: 'app_review_prompt_v1',
          reviewOpenSource: safeStr(openSource) || 'auto_prompt',
          step: 'app_review_prompt',
          pagePath: pathname || '/profilim',
          context: {
            lang: String(i18n?.language || 'tr'),
            ua: navigator?.userAgent || '',
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
            ref: document?.referrer || '',
            build: String(import.meta?.env?.VITE_GIT_SHA || ''),
          },
        }),
      });

      if (!data?.ok) {
        throw new Error(String(data?.error || 'submit_failed'));
      }

      setPromptState({ loading: false, state: 'skipped' });
      dispatchPromptStatus('skipped');
      close();
    } catch (e) {
      setSubmitState({ loading: false, error: String(e?.message || 'submit_failed'), ok: false });
    }
  };

  const submit = async () => {
    if (!canSubmit) return;

    setSubmitState({ loading: true, error: '', ok: false });
    try {
      const data = await authFetch('/api/matchmaking-feedback-submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'review',
          rating,
          message: safeStr(message),
          source: 'app_review_prompt_v1',
          reviewOpenSource: safeStr(openSource) || 'auto_prompt',
          step: 'app_review_prompt',
          pagePath: pathname || '/profilim',
          context: {
            lang: String(i18n?.language || 'tr'),
            ua: navigator?.userAgent || '',
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
            ref: document?.referrer || '',
            build: String(import.meta?.env?.VITE_GIT_SHA || ''),
          },
        }),
      });

      if (!data?.ok) {
        throw new Error(String(data?.error || 'submit_failed'));
      }

      setPromptState({ loading: false, state: 'submitted' });
      dispatchPromptStatus('submitted');
      setSubmitState({ loading: false, error: '', ok: true });
      window.setTimeout(() => {
        setOpen(false);
      }, 1200);
    } catch (e) {
      setSubmitState({ loading: false, error: String(e?.message || 'submit_failed'), ok: false });
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div className="w-full max-w-xl rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,#ffffff,#f8fbfd)] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.28)] md:p-7">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">{t('studio.feedback.reviewPrompt.eyebrow')}</div>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">{t('studio.feedback.reviewPrompt.title')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{t('studio.feedback.reviewPrompt.body')}</p>

        <div className="mt-6">
          <div className="text-sm font-semibold text-slate-900">{t('studio.feedback.reviewPrompt.ratingLabel')}</div>
          <div className="mt-3 flex gap-2">
            {renderStars(rating).map((star, idx) => {
              const starValue = idx + 1;
              const active = starValue <= rating;
              return (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => setRating(starValue)}
                  className={
                    'h-12 w-12 rounded-2xl border text-2xl transition ' +
                    (active
                      ? 'border-amber-300 bg-amber-50 text-amber-500'
                      : 'border-slate-200 bg-white text-slate-300 hover:border-slate-300 hover:text-amber-400')
                  }
                >
                  {star}
                </button>
              );
            })}
          </div>
        </div>

        <label className="mt-6 block">
          <div className="text-sm font-semibold text-slate-900">{t('studio.feedback.reviewPrompt.messageLabel')}</div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder={t('studio.feedback.reviewPrompt.placeholder')}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        {submitState.error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {t('studio.feedback.reviewPrompt.error')}: {submitState.error}
          </div>
        ) : null}

        {submitState.ok ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {t('studio.feedback.reviewPrompt.success')}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={submitSkip}
            disabled={submitState.loading}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t('studio.feedback.reviewPrompt.dismiss')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitState.loading ? t('studio.feedback.reviewPrompt.submitting') : t('studio.feedback.reviewPrompt.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}