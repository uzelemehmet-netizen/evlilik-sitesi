import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function MatchmakingMembership() {
  const { t } = useTranslation();

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
            <p className="text-sm font-semibold text-white">{t('matchmakingMembership.freeNowTitle')}</p>
            <p className="mt-2 text-sm text-white/75 whitespace-pre-line">{t('matchmakingMembership.freeNowBody')}</p>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link
              to="/profilim"
              className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-white/90 text-sm font-semibold hover:bg-white/[0.12] transition"
            >
              {t('matchmakingMembership.backToPanel')}
            </Link>
          </div>

          <p className="mt-5 text-xs text-white/55">{t('matchmakingMembership.freeNowFootnote')}</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
