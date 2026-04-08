import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Share2, Users } from 'lucide-react';

export default function StudioInviteFriendsCard({ to = '', onClick = null, compact = false, className = '' }) {
  const { t } = useTranslation();

  const rootClassName = [
    compact
      ? 'rounded-[22px] border border-indigo-200 bg-[linear-gradient(135deg,rgba(238,242,255,0.98),rgba(255,255,255,0.96))] p-4 shadow-[0_14px_34px_rgba(99,102,241,0.12)]'
      : 'rounded-[24px] border border-indigo-200 bg-[linear-gradient(135deg,rgba(238,242,255,0.98),rgba(255,255,255,0.96))] p-5 shadow-[0_16px_40px_rgba(99,102,241,0.12)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const actionClassName = 'app-btn app-btn-primary w-full md:w-auto whitespace-nowrap';
  const ActionTag = to ? Link : 'button';
  const actionProps = to
    ? { to }
    : {
        type: 'button',
        onClick,
      };

  return (
    <div className={rootClassName}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700 shadow-sm">
            <Users className="h-3.5 w-3.5" />
            {t('studio.referral.spotlightEyebrow')}
          </div>
          <p className="mt-3 text-base font-semibold text-slate-900">{t('studio.referral.title')}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{t('studio.referral.spotlightBody')}</p>
        </div>

        <ActionTag {...actionProps} className={actionClassName}>
          {t('studio.referral.spotlightCta')}
          <Share2 className="h-4 w-4" />
        </ActionTag>
      </div>
    </div>
  );
}