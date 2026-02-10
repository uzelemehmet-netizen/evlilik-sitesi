import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle, Heart, Lock, MessageCircle, Sparkles, UserCheck } from 'lucide-react';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useAuth } from '../../auth/AuthProvider';

function buildSignupState() {
  return {
    from: '/evlilik/eslestirme-basvuru?w=1',
    fromState: {
      showMatchmakingIntro: true,
      matchmakingNext: '/evlilik/eslestirme-basvuru?w=1',
    },
  };
}

export default function StudioProfilePreview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gateMsg, setGateMsg] = useState('');

  const isLoggedIn = !!user && !user.isAnonymous;

  const cta = useMemo(() => {
    if (isLoggedIn) {
      return {
        label: t('matchmakingPreview.actions.goProfile'),
        onClick: () => navigate('/profilim'),
      };
    }

    return {
      label: t('matchmakingPreview.actions.signup'),
      onClick: () => navigate('/login?mode=signup', { state: buildSignupState() }),
    };
  }, [isLoggedIn, navigate, t]);

  const gatedAction = (actionKey) => () => {
    if (isLoggedIn) {
      // Logged-in users can proceed to real screens.
      if (actionKey === 'matches') return navigate('/app/matches');
      if (actionKey === 'pool') return navigate('/app/pool');
      if (actionKey === 'chat') return navigate('/app/matches');
      return;
    }

    setGateMsg(t('matchmakingPreview.gate.body'));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      <main className="relative max-w-6xl mx-auto px-4 pt-10 md:pt-14 pb-12">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-semibold tracking-wide text-emerald-950">
                <Sparkles size={14} className="text-amber-600" />
                <span>{t('navigation.matchmaking')}</span>
                <span className="text-emerald-900/40">•</span>
                <span className="text-emerald-900/70">{t('matchmakingPreview.badge')}</span>
              </div>

              <h1 className="mt-4 text-2xl md:text-3xl font-semibold leading-tight">{t('matchmakingPreview.title')}</h1>
              <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed">{t('matchmakingPreview.subtitle')}</p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={cta.onClick} className="app-btn app-btn-primary-light h-10 px-5">
                {isLoggedIn ? <UserCheck size={18} /> : <Lock size={18} />}
                {cta.label}
                <ArrowRight size={18} />
              </button>
              <Link to="/evlilik/eslestirme-basvuru?w=1" className="app-btn app-btn-primary-light h-10 px-5">
                <CheckCircle size={18} />
                {t('matchmakingPreview.actions.goApply')}
              </Link>
            </div>
          </div>

          {gateMsg ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <p className="text-sm font-semibold">{t('matchmakingPreview.gate.title')}</p>
              <p className="mt-1 text-sm text-amber-900/90">{gateMsg}</p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/login?mode=signup', { state: buildSignupState() })}
                  className="app-btn app-btn-primary h-10 px-5"
                >
                  {t('matchmakingPreview.gate.ctaSignup')}
                  <ArrowRight size={18} />
                </button>
                <Link
                  to="/evlilik/eslestirme-basvuru?w=1"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  {t('matchmakingPreview.gate.ctaApply')}
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900" data-tutorial-id="profile-my-matches">
                <UserCheck size={18} className="text-emerald-700" />
                {t('matchmakingPreview.cards.matches.title')}
              </div>
              <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingPreview.cards.matches.body')}</div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={gatedAction('matches')}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {t('matchmakingPreview.cards.matches.cta')}
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900" data-tutorial-id="matches-go-pool">
                <Sparkles size={18} className="text-emerald-700" />
                {t('matchmakingPreview.cards.pool.title')}
              </div>
              <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingPreview.cards.pool.body')}</div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={gatedAction('pool')}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {t('matchmakingPreview.cards.pool.cta')}
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={gatedAction('pool')}
                  data-tutorial-id="pool-pre-match-request"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
                >
                  {t('matchmakingPreview.cards.pool.request')}
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={gatedAction('pool')}
                  data-tutorial-id="match-like"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-900 hover:bg-rose-100"
                >
                  <Heart size={18} />
                  {t('matchmakingPreview.cards.pool.like')}
                </button>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <MessageCircle size={18} className="text-emerald-700" />
                {t('matchmakingPreview.cards.chat.title')}
              </div>
              <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingPreview.cards.chat.body')}</div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold text-slate-700">{t('matchmakingPreview.cards.chat.mockTitle')}</div>
                <div className="mt-2 space-y-2">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                    <div className="text-[11px] text-slate-500">{t('matchmakingPreview.cards.chat.mockSystem')}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{t('matchmakingPreview.cards.chat.mockMsg1')}</div>
                    <div className="mt-1 text-sm text-slate-700">{t('matchmakingPreview.cards.chat.mockMsg2')}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      data-tutorial-id="chat-input"
                      className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      placeholder={t('matchmakingPreview.cards.chat.inputPlaceholder')}
                      disabled={!isLoggedIn}
                      onFocus={!isLoggedIn ? gatedAction('chat') : undefined}
                    />
                    <button
                      type="button"
                      data-tutorial-id="chat-send"
                      onClick={gatedAction('chat')}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      {t('matchmakingPreview.cards.chat.send')}
                    </button>
                  </div>

                  {!isLoggedIn ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                      {t('matchmakingPreview.cards.chat.gateHint')}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500">{t('matchmakingPreview.note')}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
