import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, MessageCircle, ShieldCheck, UserCheck, Sparkles, Lock, Crown, ArrowRight, LogIn } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { useAuth } from '../auth/AuthProvider';
import { collection, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import GeminiFAQ from '../components/gemini/GeminiFAQ';
import PwaInstallCard from '../components/PwaInstallCard.jsx';
import { staticAssetUrl } from '../utils/staticAssetUrl';

export default function MatchmakingHub() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const BRAND_LOGO_SRC = staticAssetUrl('/brand-horizontal-source.jpg');

  const [checkingApplication, setCheckingApplication] = useState(false);
  const [hasApplication, setHasApplication] = useState(false);

  const [joinToastVisible, setJoinToastVisible] = useState(false);
  const joinToastTimerRef = useRef(null);
  const lastJoinCreatedAtMsRef = useRef(0);
  const joinListenerInitializedRef = useRef(false);

  useEffect(() => {
    if (!user?.uid) {
      setHasApplication(false);
      return;
    }

    let cancelled = false;
    setCheckingApplication(true);

    (async () => {
      try {
        const q = query(collection(db, 'matchmakingApplications'), where('userId', '==', user.uid), limit(1));
        const snap = await getDocs(q);
        if (cancelled) return;
        setHasApplication(!snap.empty);
      } catch (e) {
        if (!cancelled) setHasApplication(false);
      } finally {
        if (!cancelled) setCheckingApplication(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;
    const colRef = collection(db, 'publicJoinEvents');
    const q = query(colRef, where('createdAtMs', '>=', cutoffMs), orderBy('createdAtMs', 'desc'), limit(1));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const doc = snap.docs?.[0];
        const data = doc?.data?.() || {};
        const createdAtMs = data?.createdAtMs;
        if (typeof createdAtMs !== 'number' || !Number.isFinite(createdAtMs)) return;

        if (!joinListenerInitializedRef.current) {
          joinListenerInitializedRef.current = true;
          lastJoinCreatedAtMsRef.current = createdAtMs;
          return;
        }

        if (createdAtMs <= lastJoinCreatedAtMsRef.current) return;
        lastJoinCreatedAtMsRef.current = createdAtMs;

        setJoinToastVisible(true);
        if (joinToastTimerRef.current) {
          clearTimeout(joinToastTimerRef.current);
        }
        joinToastTimerRef.current = setTimeout(() => {
          setJoinToastVisible(false);
          joinToastTimerRef.current = null;
        }, 2000);
      },
      () => {
        // ignore realtime errors on public feed
      }
    );

    return () => {
      unsub();
      if (joinToastTimerRef.current) {
        clearTimeout(joinToastTimerRef.current);
        joinToastTimerRef.current = null;
      }
    };
  }, []);

  const howSteps = t('matchmakingHub.how.steps', { returnObjects: true });
  const matchingPoints = t('matchmakingHub.matching.points', { returnObjects: true });
  const safetyPoints = t('matchmakingHub.safety.points', { returnObjects: true });
  const faqItems = t('matchmakingHub.faq.items', { returnObjects: true });

  const canShowApply = !user || (!checkingApplication && !hasApplication);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      {joinToastVisible ? (
        <div className="fixed top-3 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
          <div
            className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur"
            role="status"
            aria-live="polite"
          >
            {t('matchmakingHub.liveJoinToast')}
          </div>
        </div>
      ) : null}

      <main className="relative">
        {/* Background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14),rgba(16,185,129,0)_60%)]" />
          <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.10),rgba(245,158,11,0)_60%)]" />
          <div className="absolute bottom-0 -right-24 w-[620px] h-[620px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.10),rgba(59,130,246,0)_60%)]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>

        {/* Hero */}
        <section className="relative max-w-7xl mx-auto px-4 pt-12 md:pt-16 pb-10 md:pb-12">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 ring-1 ring-emerald-100/50">
            <div aria-hidden="true" className="absolute inset-0">
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.16),rgba(16,185,129,0)_60%)] blur-2xl" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.10),rgba(245,158,11,0)_60%)] blur-2xl" />
            </div>

            <div className="relative p-6 md:p-10">
              <div className="flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-semibold tracking-wide text-emerald-950">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>{t('navigation.matchmaking')}</span>
                    <span className="text-emerald-900/40">•</span>
                    <span className="text-emerald-900/70">{t('matchmakingHub.badge')}</span>
                  </div>

                  <h1 className="mt-4 text-3xl md:text-4xl font-semibold leading-tight">
                    {t('matchmakingHub.title')}
                  </h1>

                  <p className="mt-4 text-slate-600 leading-relaxed">
                    {t('matchmakingHub.description')}
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {!user && (
                      <Link
                        to="/login?mode=login"
                        state={{
                          from: '/profilim',
                          fromState: {
                            matchmakingNext: '/profilim',
                          },
                        }}
                        className="app-btn app-btn-primary-light h-10 px-5"
                      >
                        <LogIn size={18} />
                        {t('matchmakingHub.actions.loginExisting')}
                        <ArrowRight size={18} />
                      </Link>
                    )}

                    {canShowApply && (
                      <Link
                        to="/login?mode=signup"
                        state={{
                          from: '/evlilik/eslestirme-basvuru?w=1',
                          fromState: {
                            showMatchmakingIntro: true,
                            matchmakingNext: '/evlilik/eslestirme-basvuru?w=1',
                          },
                        }}
                        className="app-btn app-btn-primary-light h-10 px-5"
                      >
                        <Crown size={18} />
                        {t('matchmakingHub.actions.apply')}
                        <ArrowRight size={18} />
                      </Link>
                    )}

                    {user && (
                      <Link
                        to="/profilim"
                        className="app-btn app-btn-primary-light h-10 px-5"
                      >
                        <UserCheck size={18} />
                        {t('matchmakingHub.actions.goPanel')}
                      </Link>
                    )}

                    <a
                      href={buildWhatsAppUrl(t('matchmakingHub.whatsappSupportMessage'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="app-btn app-btn-primary h-10 px-5"
                    >
                      <MessageCircle size={18} />
                      {t('matchmakingHub.actions.supportWhatsApp')}
                    </a>
                  </div>

                  <div className="mt-5">
                    <PwaInstallCard variant="light" flat />
                  </div>

                  <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Lock size={16} className="text-emerald-700" />
                        {t('matchmakingHub.cards.private.title')}
                      </div>
                      <div className="mt-2 text-xs text-slate-600 leading-relaxed">{t('matchmakingHub.cards.private.desc')}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <ShieldCheck size={16} className="text-emerald-700" />
                        {t('matchmakingHub.cards.review.title')}
                      </div>
                      <div className="mt-2 text-xs text-slate-600 leading-relaxed">{t('matchmakingHub.cards.review.desc')}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle size={16} className="text-emerald-700" />
                        {t('matchmakingHub.cards.panel.title')}
                      </div>
                      <div className="mt-2 text-xs text-slate-600 leading-relaxed">{t('matchmakingHub.cards.panel.desc')}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center lg:items-end gap-5">
                  <div className="w-full max-w-sm rounded-[22px] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-center">
                      <img
                        src={BRAND_LOGO_SRC}
                        alt={t('matchmakingHub.brandAlt')}
                        className="h-12 md:h-14 w-auto max-w-[220px] md:max-w-[260px] object-contain"
                        loading="eager"
                        decoding="async"
                      />
                    </div>

                    <div className="text-xs font-semibold text-slate-700 tracking-wide">{t('matchmakingHub.miniCard.title')}</div>
                    <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {t('matchmakingHub.miniCard.desc')}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                        <div className="text-base font-semibold text-emerald-800">{t('matchmakingHub.miniCard.stats.privateTitle')}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{t('matchmakingHub.miniCard.stats.privateSubtitle')}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                        <div className="text-base font-semibold text-emerald-800">{t('matchmakingHub.miniCard.stats.fairTitle')}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{t('matchmakingHub.miniCard.stats.fairSubtitle')}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                        <div className="text-base font-semibold text-emerald-800">{t('matchmakingHub.miniCard.stats.safeTitle')}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{t('matchmakingHub.miniCard.stats.safeSubtitle')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel preview (guest tutorial) */}
        {!user ? (
          <section className="relative max-w-7xl mx-auto px-4 pb-10 md:pb-12">
            <div className="rounded-[26px] border border-slate-200 bg-white p-6 md:p-7">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.preview.title')}</h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.preview.subtitle')}</p>
                </div>
                <div className="shrink-0">
                  <Link
                    to="/login?mode=signup"
                    state={{
                      from: '/evlilik/eslestirme-basvuru?w=1',
                      fromState: {
                        showMatchmakingIntro: true,
                        matchmakingNext: '/evlilik/eslestirme-basvuru?w=1',
                      },
                    }}
                    className="app-btn app-btn-primary-light h-10 px-5"
                  >
                    <Crown size={18} />
                    {t('matchmakingHub.preview.cta')}
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <UserCheck size={18} className="text-emerald-700" />
                    {t('matchmakingHub.preview.cards.matches.title')}
                  </div>
                  <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.preview.cards.matches.body')}</div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-700">{t('matchmakingHub.preview.cards.matches.mockTitle')}</div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{t('matchmakingHub.preview.cards.matches.mockItem1')}</div>
                          <div className="text-[11px] text-slate-500 truncate">{t('matchmakingHub.preview.cards.matches.mockItem1Sub')}</div>
                        </div>
                        <div className="shrink-0 text-[11px] font-semibold text-emerald-800">{t('matchmakingHub.preview.cards.matches.mockTag1')}</div>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{t('matchmakingHub.preview.cards.matches.mockItem2')}</div>
                          <div className="text-[11px] text-slate-500 truncate">{t('matchmakingHub.preview.cards.matches.mockItem2Sub')}</div>
                        </div>
                        <div className="shrink-0 text-[11px] font-semibold text-slate-700">{t('matchmakingHub.preview.cards.matches.mockTag2')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Sparkles size={18} className="text-emerald-700" />
                    {t('matchmakingHub.preview.cards.pool.title')}
                  </div>
                  <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.preview.cards.pool.body')}</div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-700">{t('matchmakingHub.preview.cards.pool.mockTitle')}</div>
                    <div className="mt-2 space-y-2">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="text-sm font-semibold text-slate-900">{t('matchmakingHub.preview.cards.pool.mockItem1')}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{t('matchmakingHub.preview.cards.pool.mockItem1Sub')}</div>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-900">
                          <CheckCircle size={14} className="text-emerald-700" />
                          {t('matchmakingHub.preview.cards.pool.mockCta')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <MessageCircle size={18} className="text-emerald-700" />
                    {t('matchmakingHub.preview.cards.chat.title')}
                  </div>
                  <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.preview.cards.chat.body')}</div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-700">{t('matchmakingHub.preview.cards.chat.mockTitle')}</div>
                    <div className="mt-2 space-y-2">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="text-[11px] text-slate-500">{t('matchmakingHub.preview.cards.chat.mockSystem')}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{t('matchmakingHub.preview.cards.chat.mockMsg1')}</div>
                        <div className="mt-1 text-sm text-slate-700">{t('matchmakingHub.preview.cards.chat.mockMsg2')}</div>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                        {t('matchmakingHub.preview.cards.chat.mockHint')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* How it works */}
        <section className="relative max-w-7xl mx-auto px-4 pb-12 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <div className="rounded-[26px] border border-slate-200 bg-white p-6 md:p-7">
                <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.how.title')}</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.how.subtitle')}</p>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 to-transparent p-4">
                    <div className="text-xs font-semibold text-emerald-900">{t('matchmakingHub.benefits.b1Title')}</div>
                    <div className="mt-1 text-sm text-slate-700">{t('matchmakingHub.benefits.b1Body')}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 to-transparent p-4">
                    <div className="text-xs font-semibold text-emerald-900">{t('matchmakingHub.benefits.b2Title')}</div>
                    <div className="mt-1 text-sm text-slate-700">{t('matchmakingHub.benefits.b2Body')}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 to-transparent p-4">
                    <div className="text-xs font-semibold text-emerald-900">{t('matchmakingHub.benefits.b3Title')}</div>
                    <div className="mt-1 text-sm text-slate-700">{t('matchmakingHub.benefits.b3Body')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[26px] border border-slate-200 bg-white p-6 md:p-7">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base md:text-lg font-semibold">{t('matchmakingHub.flow.title')}</h3>
                  <div className="text-xs text-slate-500">{t('matchmakingHub.flow.badge')}</div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(howSteps) &&
                    howSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="group rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-900 flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{step.title}</div>
                            <div className="mt-1 text-sm text-slate-600 leading-relaxed">{step.desc}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How we match */}
        <section className="relative max-w-7xl mx-auto px-4 pb-14 md:pb-16">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.matching.title')}</h2>
                <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">{t('matchmakingHub.matching.subtitle')}</p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                <Lock size={16} className="text-emerald-700" />
                {t('matchmakingHub.matching.badge')}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              {Array.isArray(matchingPoints) &&
                matchingPoints.map((p, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex gap-2 items-start">
                      <CheckCircle size={18} className="mt-0.5 text-emerald-700" />
                      <span className="text-sm text-slate-700 leading-relaxed">{p}</span>
                    </div>
                  </div>
                ))}
            </div>

            <p className="mt-6 text-xs text-slate-500 leading-relaxed">{t('matchmakingHub.matching.note')}</p>
          </div>
        </section>

        {/* Safety */}
        <section className="relative max-w-7xl mx-auto px-4 pb-14 md:pb-16">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.safety.title')}</h2>
                <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">{t('matchmakingHub.safety.subtitle')}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-emerald-700" />
                {t('matchmakingHub.safety.tagline')}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.isArray(safetyPoints) &&
                safetyPoints.map((p, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex gap-2 items-start">
                      <span className="mt-0.5 text-emerald-700">•</span>
                      <span className="text-sm text-slate-700 leading-relaxed">{p}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-xs text-slate-500 max-w-3xl">{t('matchmakingPage.privacyNote')}</p>
              <Link
                to="/evlilik"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                {t('matchmakingHub.actions.backWedding')}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <GeminiFAQ
          title={t('matchmakingHub.faq.title')}
          subtitle={t('matchmakingHub.faq.subtitle')}
          sideNote={t('matchmakingHub.faq.sideNote')}
          items={faqItems}
          variant="light"
        />

        {/* Trust + CTA */}
        <section className="relative max-w-7xl mx-auto px-4 pb-16">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.trust.title')}</h2>
                <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">{t('matchmakingHub.trust.subtitle')}</p>
              </div>
              <div className="text-xs text-slate-500">{t('matchmakingHub.trust.badge')}</div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Lock size={16} className="text-emerald-700" />
                  {t('matchmakingHub.trust.cards.privacy.title')}
                </div>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.trust.cards.privacy.desc')}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  {t('matchmakingHub.trust.cards.review.title')}
                </div>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.trust.cards.review.desc')}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MessageCircle size={16} className="text-emerald-700" />
                  {t('matchmakingHub.trust.cards.support.title')}
                </div>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.trust.cards.support.desc')}</div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">{t('matchmakingHub.cta.title')}</div>
                <div className="mt-1 text-sm text-slate-600">{t('matchmakingHub.cta.subtitle')}</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {canShowApply && (
                  <Link
                    to="/login?mode=signup"
                    state={{
                      from: '/evlilik/eslestirme-basvuru?w=1',
                      fromState: {
                        showMatchmakingIntro: true,
                        matchmakingNext: '/evlilik/eslestirme-basvuru?w=1',
                      },
                    }}
                    className="app-btn app-btn-primary-light h-10 px-5"
                  >
                    <Crown size={18} />
                    {t('matchmakingHub.actions.apply')}
                    <ArrowRight size={18} />
                  </Link>
                )}

                {user && (
                  <Link
                    to="/profilim"
                    className="app-btn app-btn-primary-light h-10 px-5"
                  >
                    <UserCheck size={18} />
                    {t('matchmakingHub.actions.goPanel')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
