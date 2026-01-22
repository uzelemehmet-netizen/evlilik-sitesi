import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { authFetch } from '../utils/authFetch';

function promoCutoffMsTR() {
  return new Date('2026-02-10T23:59:59.999+03:00').getTime();
}

export default function MatchmakingMembership() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [action, setAction] = useState({ loading: false, error: '', success: '' });

  const cutoffMs = useMemo(() => promoCutoffMsTR(), []);
  const now = Date.now();
  const promoActive = now <= cutoffMs;

  const goToPaidFlow = () => {
    navigate('/profilim', { state: { openMembershipActivation: true } });
  };

  const cutoffText = useMemo(() => {
    const locale = i18n?.language === 'id' ? 'id-ID' : i18n?.language === 'en' ? 'en-US' : 'tr-TR';
    try {
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(cutoffMs));
    } catch {
      return '';
    }
  }, [cutoffMs, i18n?.language]);

  const activateFree = async () => {
    setAction({ loading: true, error: '', success: '' });
    try {
      const data = await authFetch('/api/matchmaking-membership-activate-free', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      const untilMs = typeof data?.validUntilMs === 'number' ? data.validUntilMs : 0;
      const locale = i18n?.language === 'id' ? 'id-ID' : i18n?.language === 'en' ? 'en-US' : 'tr-TR';
      const untilText = untilMs
        ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(untilMs))
        : '';

      setAction({
        loading: false,
        error: '',
        success: untilText ? t('matchmakingMembership.activatedUntil', { date: untilText }) : t('matchmakingMembership.activated'),
      });

      // Panel üyelik durumunu tekrar okuyabilsin diye kullanıcıyı panele döndür.
      setTimeout(() => navigate('/profilim', { replace: true }), 800);
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const isLocalhost =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      const mapped =
        msg === 'promo_expired'
          ? t('matchmakingMembership.promoExpired', { date: cutoffText })
          : msg === 'missing_auth' || msg === 'invalid_auth' || msg === 'not_authenticated'
            ? t('matchmakingMembership.errors.notAuthenticated')
            : msg === 'firebase_admin_not_configured'
              ? t('matchmakingMembership.errors.serverNotConfigured')
              : msg === 'request_failed_404' || msg === 'request_failed_405'
                ? (isLocalhost
                    ? t('matchmakingMembership.errors.apiUnavailableDev')
                    : t('matchmakingMembership.activateFailed'))
                : t('matchmakingMembership.activateFailed');
      setAction({ loading: false, error: mapped, success: '' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] text-white relative">
      <Navigation />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(255,215,128,0.18),rgba(255,215,128,0)_60%)]" />
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),rgba(99,102,241,0)_60%)]" />
        <div className="absolute bottom-0 -right-24 w-[620px] h-[620px] bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.14),rgba(20,184,166,0)_60%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <section className="relative max-w-3xl mx-auto px-4 py-16">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/10 via-white/[0.06] to-transparent shadow-[0_30px_90px_rgba(0,0,0,0.45)] p-5 md:p-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">{t('matchmakingMembership.title')}</h1>
          <p className="text-sm text-white/70 mt-1">{t('matchmakingMembership.lead')}</p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">{t('matchmakingMembership.planTitle')}</p>
            <p className="mt-2 text-sm text-white/75">
              {t('matchmakingMembership.monthlyPrice', { amount: 20 })}
            </p>

            {promoActive ? (
              <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3">
                <p className="text-xs font-semibold text-emerald-100">{t('matchmakingMembership.promoTitle')}</p>
                <p className="mt-1 text-sm text-white/75">{t('matchmakingMembership.promoBody', { date: cutoffText })}</p>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-500/10 p-3">
                <p className="text-xs font-semibold text-amber-100">{t('matchmakingMembership.promoEndedTitle')}</p>
                <p className="mt-1 text-sm text-white/75">{t('matchmakingMembership.promoEndedBody', { date: cutoffText })}</p>
              </div>
            )}
          </div>

          {action.error ? (
            <div className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/10 p-3 text-rose-100 text-sm">
              {action.error}
            </div>
          ) : null}
          {action.success ? (
            <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-emerald-100 text-sm">
              {action.success}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center">
            {promoActive ? (
              <button
                type="button"
                onClick={activateFree}
                disabled={action.loading}
                className="px-5 py-2.5 rounded-full bg-emerald-400 text-slate-950 text-sm font-semibold hover:bg-emerald-300 disabled:opacity-60"
              >
                {action.loading ? t('matchmakingMembership.activating') : t('matchmakingMembership.freeActivateCta')}
              </button>
            ) : (
              <button
                type="button"
                onClick={goToPaidFlow}
                className="px-5 py-2.5 rounded-full bg-amber-300 text-slate-950 text-sm font-semibold hover:bg-amber-200"
              >
                {t('matchmakingMembership.paidActivationCta')}
              </button>
            )}

            <Link
              to="/profilim"
              className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-white/90 text-sm font-semibold hover:bg-white/[0.12] transition"
            >
              {t('matchmakingMembership.backToPanel')}
            </Link>
          </div>

          <p className="mt-5 text-xs text-white/55">
            {promoActive
              ? t('matchmakingMembership.paymentMethodsSoon', { date: cutoffText })
              : t('matchmakingMembership.paidAdminApprovalNote', { date: cutoffText })}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
