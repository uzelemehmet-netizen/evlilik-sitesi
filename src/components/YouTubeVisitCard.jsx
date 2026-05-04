import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Youtube } from 'lucide-react';
import { trackClick } from '../utils/clickTracker';

export default function YouTubeVisitCard({ className = '', compact = false, tone = 'light' }) {
  const { t } = useTranslation();
  const location = useLocation();

  const isDark = tone === 'dark';
  const rootClassName = [
    compact
      ? 'rounded-[22px] border p-4 shadow-[0_14px_34px_rgba(15,23,42,0.10)]'
      : 'rounded-[26px] border p-5 shadow-[0_18px_42px_rgba(15,23,42,0.10)]',
    isDark
      ? 'border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))] text-white backdrop-blur-sm'
      : 'border-red-100 bg-[linear-gradient(135deg,rgba(254,242,242,0.98),rgba(255,255,255,0.96))] text-slate-900',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const eyebrowClassName = isDark
    ? 'border border-white/10 bg-white/10 text-white/70'
    : 'border border-red-200 bg-white text-red-700';

  const titleClassName = isDark ? 'text-white' : 'text-slate-900';
  const bodyClassName = isDark ? 'text-white/72' : 'text-slate-600';
  const buttonClassName = isDark
    ? 'border border-red-300/35 bg-red-500/85 text-white hover:bg-red-500'
    : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100';

  return (
    <div className={rootClassName}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 max-w-2xl">
          <div className={["inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", eyebrowClassName].join(' ')}>
            <Youtube className="h-3.5 w-3.5" />
            {t('youtubeVisitCard.eyebrow')}
          </div>
          <div className={[compact ? 'mt-3 text-base' : 'mt-3 text-lg', 'font-semibold', titleClassName].join(' ')}>
            {t('youtubeVisitCard.title')}
          </div>
          <p className={[compact ? 'mt-2 text-sm' : 'mt-2 text-sm md:text-base', 'leading-relaxed', bodyClassName].join(' ')}>
            {t('youtubeVisitCard.body')}
          </p>
        </div>

        <Link
          to="/youtube"
          className={["inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition", buttonClassName].join(' ')}
          onClick={() => {
            void trackClick('youtube_page_redirect:visit_card', {
              page: String(location?.pathname || '/') || '/',
              trace: true,
            });
          }}
        >
          {t('youtubeVisitCard.cta')}
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}