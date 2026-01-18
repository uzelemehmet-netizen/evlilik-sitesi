import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, MessageCircle, ShieldCheck, UserCheck } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/whatsapp';

export default function MatchmakingHub() {
  const { t } = useTranslation();

  const howSteps = t('matchmakingHub.how.steps', { returnObjects: true });
  const safetyPoints = t('matchmakingHub.safety.points', { returnObjects: true });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/40">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-14 md:py-16 relative">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-200/50 blur-3xl rounded-full" />
          <div className="absolute top-10 -right-24 w-96 h-96 bg-rose-200/40 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-sky-200/30 blur-3xl rounded-full" />
        </div>

        <div className="relative rounded-3xl border border-slate-200 bg-white/70 backdrop-blur p-6 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold">
                <ShieldCheck size={16} />
                {t('matchmakingHub.badge')}
              </div>

              <h1 className="mt-4 text-2xl md:text-3xl font-semibold text-slate-900">
                {t('matchmakingHub.title')}
              </h1>

              <div className="mt-4 max-w-3xl rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-rose-50/70 p-5">
                <p className="text-slate-700 leading-relaxed text-base">
                  {t('matchmakingHub.description')}
                </p>
              </div>
            </div>

            <div className="w-full md:w-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-3">
                <Link
                  to="/login?force=1"
                  state={{
                    from: '/panel',
                    fromState: {
                      showMatchmakingIntro: true,
                      matchmakingNext: '/evlilik/eslestirme-basvuru',
                    },
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-white px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-emerald-700 transition"
                >
                  <MessageCircle size={18} />
                  {t('matchmakingHub.actions.apply')}
                </Link>

                <Link
                  to="/panel"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 text-white px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-black transition"
                >
                  {t('matchmakingHub.actions.goPanel')}
                </Link>

                <a
                  href={buildWhatsAppUrl(t('matchmakingHub.whatsappSupportMessage'))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-slate-900 px-6 py-2.5 font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition"
                >
                  {t('matchmakingHub.actions.supportWhatsApp')}
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/80 backdrop-blur border border-emerald-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle size={18} />
                {t('matchmakingHub.cards.private.title')}
              </div>
              <p className="mt-2 text-sm text-slate-700">{t('matchmakingHub.cards.private.desc')}</p>
            </div>
            <div className="rounded-2xl bg-white/80 backdrop-blur border border-emerald-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <UserCheck size={18} />
                {t('matchmakingHub.cards.review.title')}
              </div>
              <p className="mt-2 text-sm text-slate-700">{t('matchmakingHub.cards.review.desc')}</p>
            </div>
            <div className="rounded-2xl bg-white/80 backdrop-blur border border-emerald-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <MessageCircle size={18} />
                {t('matchmakingHub.cards.panel.title')}
              </div>
              <p className="mt-2 text-sm text-slate-700">{t('matchmakingHub.cards.panel.desc')}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-white/80 backdrop-blur border border-emerald-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{t('matchmakingHub.how.title')}</h2>
            <p className="mt-2 text-sm text-slate-700 max-w-3xl">{t('matchmakingHub.how.subtitle')}</p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(howSteps) &&
                howSteps.map((step, idx) => (
                  <div key={idx} className="rounded-2xl bg-emerald-50/60 border border-emerald-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </div>
                      <div className="font-semibold text-slate-900">{step.title}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">{step.desc}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white/80 backdrop-blur border border-rose-100 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{t('matchmakingHub.safety.title')}</h2>
            <p className="mt-2 text-sm text-slate-700 max-w-3xl">{t('matchmakingHub.safety.subtitle')}</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.isArray(safetyPoints) &&
                safetyPoints.map((p, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <span className="mt-0.5 text-rose-600">•</span>
                    <span className="text-sm text-slate-700">{p}</span>
                  </div>
                ))}
            </div>
          </div>

          <p className="mt-5 text-xs text-slate-600 max-w-3xl">{t('matchmakingPage.privacyNote')}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
