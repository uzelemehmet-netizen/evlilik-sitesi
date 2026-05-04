import { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../utils/authFetch.js';
import {
  ADMIN_STEP_UP_REQUIRED_EVENT,
  clearAdminStepUpToken,
  getValidAdminStepUpToken,
  setAdminStepUpToken,
} from '../../utils/adminStepUp.js';

function formatMinutes(ttlMs) {
  const minutes = Math.max(1, Math.round((Number(ttlMs) || 0) / 60000));
  return minutes;
}

export default function AdminStepUpGate({ children }) {
  const [statusLoading, setStatusLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [ttlMs, setTtlMs] = useState(0);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      setStatusLoading(true);
      setError('');
      try {
        const data = await authFetch(`/api/admin-step-up-status?ts=${Date.now()}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (cancelled) return;

        const nextEnabled = data?.enabled === true;
        setEnabled(nextEnabled);
        setTtlMs(typeof data?.ttlMs === 'number' && Number.isFinite(data.ttlMs) ? data.ttlMs : 0);
        setUnlocked(!nextEnabled || !!getValidAdminStepUpToken());
      } catch (e) {
        if (cancelled) return;
        setEnabled(false);
        setUnlocked(false);
        setError(String(e?.message || 'admin_step_up_status_failed'));
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const relock = () => {
      setUnlocked(false);
      setPassword('');
      setError('Ek admin doğrulaması süresi doldu. Devam etmek için parolayı tekrar girin.');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(ADMIN_STEP_UP_REQUIRED_EVENT, relock);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(ADMIN_STEP_UP_REQUIRED_EVENT, relock);
      }
    };
  }, []);

  const ttlMinutes = useMemo(() => formatMinutes(ttlMs), [ttlMs]);

  const verifyPassword = async (e) => {
    e?.preventDefault?.();
    if (!enabled || unlocked || submitting) return;

    const nextPassword = String(password || '').trim();
    if (!nextPassword) {
      setError('Ek admin parolasını girin.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const data = await authFetch(`/api/admin-step-up-verify?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: nextPassword }),
      });

      const token = String(data?.token || '').trim();
      if (!token) throw new Error('admin_step_up_token_missing');

      setAdminStepUpToken(token);
      setUnlocked(true);
      setPassword('');
    } catch (err) {
      clearAdminStepUpToken();
      const message = String(err?.message || '').trim();
      setError(message === 'invalid_step_up_password' ? 'Parola hatalı.' : (message || 'admin_step_up_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (statusLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">Admin güvenliği yükleniyor...</div>;
  }

  if (!enabled || unlocked) return children;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
        <div className="mb-5">
          <h1 className="text-xl font-bold">Ek Admin Parolası</h1>
          <p className="mt-2 text-sm text-slate-300">
            Hassas admin sekmeleri ikinci bir parola katmanıyla korunuyor. Doğrulama başarılı olursa bu oturum yaklaşık {ttlMinutes} dakika açık kalır.
          </p>
        </div>

        <form onSubmit={verifyPassword} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Ek parola</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-500"
              placeholder="Parolayı girin"
            />
          </label>

          {error ? <div className="rounded-2xl border border-rose-700 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Doğrulanıyor...' : 'Admin panelini aç'}
          </button>
        </form>
      </div>
    </div>
  );
}