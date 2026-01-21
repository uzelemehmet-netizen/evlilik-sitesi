import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, MessageCircle, ShieldCheck, UserCheck, Sparkles, Lock, Crown, ArrowRight } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { useAuth } from '../auth/AuthProvider';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function MatchmakingHub() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const BRAND_LOGO_SRC = "/brand.png";

  const [checkingApplication, setCheckingApplication] = useState(false);
  const [hasApplication, setHasApplication] = useState(false);

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

  const howSteps = t('matchmakingHub.how.steps', { returnObjects: true });
  const safetyPoints = t('matchmakingHub.safety.points', { returnObjects: true });

  return (
    <div className="min-h-screen bg-[#050814] text-white">
      <Navigation />

      <main className="relative">
        {/* Background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(255,215,128,0.18),rgba(255,215,128,0)_60%)]" />
          <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),rgba(99,102,241,0)_60%)]" />
          <div className="absolute bottom-0 -right-24 w-[620px] h-[620px] bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.14),rgba(20,184,166,0)_60%)]" />
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>

        {/* Hero */}
        <section className="relative max-w-7xl mx-auto px-4 pt-12 md:pt-16 pb-10 md:pb-12">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/10 via-white/[0.06] to-transparent shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <div aria-hidden="true" className="absolute inset-0">
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.35),rgba(245,158,11,0)_60%)] blur-2xl" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.34),rgba(99,102,241,0)_60%)] blur-2xl" />
            </div>

            <div className="relative p-6 md:p-10">
              <div className="flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-semibold tracking-wide">
                    <Sparkles size={14} className="text-amber-300" />
                    <span className="text-white/90">Uniqah</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/80">{t('matchmakingHub.badge')}</span>
                  </div>

                  <h1 className="mt-4 text-3xl md:text-4xl font-semibold leading-tight">
                    {t('matchmakingHub.title')}
                  </h1>

                  <p className="mt-4 text-white/75 leading-relaxed">
                    {t('matchmakingHub.description')}
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {(!user || (!checkingApplication && !hasApplication)) && (
                      <Link
                        to="/login"
                        state={{
                          from: '/profilim',
                          fromState: {
                            showMatchmakingIntro: true,
                            matchmakingNext: '/evlilik/eslestirme-basvuru',
                          },
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 px-6 py-3 font-semibold text-sm shadow-[0_16px_40px_rgba(245,158,11,0.35)] hover:brightness-110 transition"
                      >
                        <Crown size={18} />
                        {t('matchmakingHub.actions.apply')}
                        <ArrowRight size={18} />
                      </Link>
                    )}

                    {user && (
                      <Link
                        to="/profilim"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/10 text-white px-6 py-3 font-semibold text-sm hover:bg-white/[0.14] transition"
                      >
                        <UserCheck size={18} />
                        {t('matchmakingHub.actions.goPanel')}
                      </Link>
                    )}

                    <a
                      href={buildWhatsAppUrl(t('matchmakingHub.whatsappSupportMessage'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-transparent border border-white/15 text-white/90 px-6 py-3 font-semibold text-sm hover:bg-white/[0.08] transition"
                    >
                      <MessageCircle size={18} />
                      {t('matchmakingHub.actions.supportWhatsApp')}
                    </a>
                  </div>

                  <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Lock size={16} className="text-amber-300" />
                        {t('matchmakingHub.cards.private.title')}
                      </div>
                      <div className="mt-2 text-xs text-white/70 leading-relaxed">{t('matchmakingHub.cards.private.desc')}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <ShieldCheck size={16} className="text-amber-300" />
                        {t('matchmakingHub.cards.review.title')}
                      </div>
                      <div className="mt-2 text-xs text-white/70 leading-relaxed">{t('matchmakingHub.cards.review.desc')}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle size={16} className="text-amber-300" />
                        {t('matchmakingHub.cards.panel.title')}
                      </div>
                      <div className="mt-2 text-xs text-white/70 leading-relaxed">{t('matchmakingHub.cards.panel.desc')}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center lg:items-end gap-5">
                  <img
                    src={BRAND_LOGO_SRC}
                    alt={t('matchmakingHub.brandAlt')}
                    className="h-14 md:h-16 w-auto drop-shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
                    loading="eager"
                    decoding="async"
                  />

                  <div className="w-full max-w-sm rounded-[22px] border border-white/10 bg-white/5 p-5">
                    <div className="text-xs font-semibold text-white/80 tracking-wide">{t('matchmakingHub.miniCard.title')}</div>
                    <div className="mt-2 text-sm text-white/70 leading-relaxed">
                      {t('matchmakingHub.miniCard.desc')}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                        <div className="text-base font-semibold text-amber-200">{t('matchmakingHub.miniCard.stats.privateTitle')}</div>
                        <div className="mt-1 text-[11px] text-white/60">{t('matchmakingHub.miniCard.stats.privateSubtitle')}</div>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                        <div className="text-base font-semibold text-amber-200">{t('matchmakingHub.miniCard.stats.fairTitle')}</div>
                        <div className="mt-1 text-[11px] text-white/60">{t('matchmakingHub.miniCard.stats.fairSubtitle')}</div>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                        <div className="text-base font-semibold text-amber-200">{t('matchmakingHub.miniCard.stats.safeTitle')}</div>
                        <div className="mt-1 text-[11px] text-white/60">{t('matchmakingHub.miniCard.stats.safeSubtitle')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="relative max-w-7xl mx-auto px-4 pb-12 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 md:p-7">
                <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.how.title')}</h2>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">{t('matchmakingHub.how.subtitle')}</p>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.08] to-transparent p-4">
                    <div className="text-xs font-semibold text-amber-200">{t('matchmakingHub.benefits.b1Title')}</div>
                    <div className="mt-1 text-sm text-white/80">{t('matchmakingHub.benefits.b1Body')}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.08] to-transparent p-4">
                    <div className="text-xs font-semibold text-amber-200">{t('matchmakingHub.benefits.b2Title')}</div>
                    <div className="mt-1 text-sm text-white/80">{t('matchmakingHub.benefits.b2Body')}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.08] to-transparent p-4">
                    <div className="text-xs font-semibold text-amber-200">{t('matchmakingHub.benefits.b3Title')}</div>
                    <div className="mt-1 text-sm text-white/80">{t('matchmakingHub.benefits.b3Body')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[26px] border border-white/10 bg-white/5 p-6 md:p-7">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base md:text-lg font-semibold">{t('matchmakingHub.flow.title')}</h3>
                  <div className="text-xs text-white/60">{t('matchmakingHub.flow.badge')}</div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(howSteps) &&
                    howSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="group rounded-[22px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5 hover:from-white/[0.10] transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-400/15 border border-amber-300/20 text-amber-200 flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{step.title}</div>
                            <div className="mt-1 text-sm text-white/70 leading-relaxed">{step.desc}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="relative max-w-7xl mx-auto px-4 pb-14 md:pb-16">
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.safety.title')}</h2>
                <p className="mt-2 text-sm text-white/70 max-w-3xl leading-relaxed">{t('matchmakingHub.safety.subtitle')}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <ShieldCheck size={16} className="text-amber-300" />
                {t('matchmakingHub.safety.tagline')}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.isArray(safetyPoints) &&
                safetyPoints.map((p, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex gap-2 items-start">
                      <span className="mt-0.5 text-amber-300">•</span>
                      <span className="text-sm text-white/75 leading-relaxed">{p}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-xs text-white/55 max-w-3xl">{t('matchmakingPage.privacyNote')}</p>
              <Link
                to="/evlilik"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.14] transition"
              >
                {t('matchmakingHub.actions.backWedding')}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
