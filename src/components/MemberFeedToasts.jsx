import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider.jsx';
import { db } from '../config/firebaseDb';
import { isTutorialActive } from '../utils/tutorialState.js';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asMs(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v && typeof v.toMillis === 'function') {
    try {
      return v.toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

function buildLabel({ username, userCode }) {
  const u = safeStr(username);
  const c = safeStr(userCode);
  if (u && c) return `@${u} • ${c}`;
  if (u) return `@${u}`;
  if (c) return c;
  return '';
}

function messageForEvent(t, evt) {
  const kind = safeStr(evt?.kind);
  const label = buildLabel({ username: evt?.username, userCode: evt?.userCode });

  if (kind === 'signup') {
    return label ? t('memberFeed.toast.signupKnown', { label }) : t('memberFeed.toast.signupAnonymous');
  }
  if (kind === 'profile_completed') {
    return label ? t('memberFeed.toast.profileCompletedKnown', { label }) : t('memberFeed.toast.profileCompletedAnonymous');
  }
  return t('memberFeed.toast.generic');
}

export default function MemberFeedToasts() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();

  const enabledOnPath = useMemo(() => {
    const p = String(location?.pathname || '');
    // Only in authenticated app areas (avoid public landing pages and admin).
    if (p.startsWith('/admin')) return false;
    return p.startsWith('/app') || p === '/profilim' || p.startsWith('/profilim/');
  }, [location?.pathname]);

  const [toasts, setToasts] = useState([]);

  const startedAtMsRef = useRef(0);
  const initialSnapRef = useRef(true);
  const seenIdsRef = useRef(new Set());

  useEffect(() => {
    if (!enabledOnPath) return;
    if (loading) return;
    if (!user?.uid) return;
    if (user?.isAnonymous) return;

    startedAtMsRef.current = Date.now();
    initialSnapRef.current = true;
    seenIdsRef.current = new Set();

    const q = query(collection(db, 'memberFeedEvents'), orderBy('createdAtMs', 'desc'), limit(20));

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (initialSnapRef.current) {
          snap.docs.forEach((d) => seenIdsRef.current.add(d.id));
          initialSnapRef.current = false;
          return;
        }

        const nowMs = Date.now();
        const maxAgeMs = 2 * 60 * 1000;

        const added = snap
          .docChanges()
          .filter((c) => c.type === 'added')
          .map((c) => ({ id: c.doc.id, ...(c.doc.data() || {}) }))
          .filter((evt) => {
            if (!evt?.id) return false;
            if (seenIdsRef.current.has(evt.id)) return false;
            const createdAtMs = asMs(evt?.createdAtMs) || asMs(evt?.createdAt) || 0;
            if (!createdAtMs) return false;
            if (createdAtMs < startedAtMsRef.current) return false;
            if (nowMs - createdAtMs > maxAgeMs) return false;
            return true;
          });

        if (!added.length) return;

        added.forEach((evt) => seenIdsRef.current.add(evt.id));

        setToasts((prev) => {
          const cur = Array.isArray(prev) ? prev : [];
          const next = [...added.map((evt) => ({
            id: evt.id,
            text: messageForEvent(t, evt),
            createdAtMs: Date.now(),
          })), ...cur];
          return next.slice(0, 3);
        });
      },
      () => {
        // If rules block or network fails, just stay silent.
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [enabledOnPath, loading, t, user?.isAnonymous, user?.uid]);

  useEffect(() => {
    if (!toasts.length) return;
    const dismissMs = isTutorialActive() ? 3000 : 5500;
    const timers = toasts.map((toast) => {
      const id = toast?.id;
      if (!id) return null;
      return setTimeout(() => {
        setToasts((prev) => (Array.isArray(prev) ? prev.filter((x) => x?.id !== id) : []));
      }, dismissMs);
    });

    return () => {
      timers.forEach((tm) => {
        if (!tm) return;
        try {
          clearTimeout(tm);
        } catch {
          // noop
        }
      });
    };
  }, [toasts]);

  if (!enabledOnPath) return null;
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur px-4 py-3 text-slate-900"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-slate-500">{t('memberFeed.toast.title')}</div>
              <div className="mt-0.5 text-sm font-semibold leading-snug break-words">{toast.text}</div>
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => (Array.isArray(prev) ? prev.filter((x) => x?.id !== toast.id) : []))}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              aria-label={t('memberFeed.toast.closeAria')}
              title={t('memberFeed.toast.closeAria')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
