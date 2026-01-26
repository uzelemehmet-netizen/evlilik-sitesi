import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

function stringifyError(err) {
  try {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.stack || err.message || String(err);
    if (typeof err?.message === 'string') return err.message;
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export default function DevOverlay() {
  const location = useLocation();
  const { user, loading } = useAuth();

  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const onError = (event) => {
      const msg = stringifyError(event?.error || event?.message || event);
      setErrors((prev) => [{ type: 'error', at: Date.now(), message: msg }, ...prev].slice(0, 5));
    };

    const onUnhandledRejection = (event) => {
      const msg = stringifyError(event?.reason || event);
      setErrors((prev) => [{ type: 'unhandledrejection', at: Date.now(), message: msg }, ...prev].slice(0, 5));
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  const top = errors[0];

  const authText = useMemo(() => {
    if (loading) return 'auth: loading';
    if (!user) return 'auth: none';
    return `auth: ${user.uid}${user.email ? ` (${user.email})` : ''}`;
  }, [loading, user]);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-3 right-3 z-[99999] w-[min(520px,calc(100vw-24px))]">
      <div className="rounded-xl border border-black/10 bg-white/95 shadow-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-black/10 flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-900">DEV Diagnostics</div>
          <button
            type="button"
            className="text-[11px] text-gray-600 hover:text-gray-900"
            onClick={() => setErrors([])}
          >
            clear
          </button>
        </div>

        <div className="px-3 py-2 text-[11px] text-gray-700 space-y-1">
          <div>
            <span className="font-semibold">path:</span> {location.pathname}
          </div>
          <div>
            <span className="font-semibold">{authText}</span>
          </div>
          {top ? (
            <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2">
              <div className="text-[11px] font-semibold text-rose-900">{top.type}</div>
              <pre className="mt-1 whitespace-pre-wrap break-words text-[10px] leading-snug text-rose-900 max-h-40 overflow-auto">
                {top.message}
              </pre>
            </div>
          ) : (
            <div className="text-[11px] text-gray-500">no runtime errors captured</div>
          )}
        </div>
      </div>
    </div>
  );
}
