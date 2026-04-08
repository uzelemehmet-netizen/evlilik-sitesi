import { Heart, MessageCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function clipText(raw, maxLen) {
  const s = safeStr(raw);
  if (!s) return '';
  return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
}

function genderLabel(t, raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  if (s === 'female' || s === 'f' || s === 'kadin' || s === 'kadın') return t('matchmakingPage.form.options.gender.female');
  if (s === 'male' || s === 'm' || s === 'erkek') return t('matchmakingPage.form.options.gender.male');
  return '';
}

function maritalStatusLabel(t, raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  const map = {
    single: 'matchmakingPage.form.options.maritalStatus.single',
    widowed: 'matchmakingPage.form.options.maritalStatus.widowed',
    divorced: 'matchmakingPage.form.options.maritalStatus.divorced',
    other: 'matchmakingPage.form.options.maritalStatus.other',
    doesnt_matter: 'matchmakingPage.form.options.maritalStatus.doesnt_matter',
  };
  const key = map[s] || '';
  return key ? t(key) : raw;
}

export default function StudioPersonCard({
  person,
  onLike,
  onMessage,
  onInspect,
  actionLoadingUid = '',
  actionKind = '',
}) {
  const { t } = useTranslation();

  const targetUid = safeStr(person?.toUid || person?.targetUid || person?.uid);
  const profile = person?.targetProfile && typeof person.targetProfile === 'object' ? person.targetProfile : {};
  const name = safeStr(profile?.username) || t('studio.common.profile');
  const age = typeof profile?.age === 'number' ? `, ${profile.age}` : '';
  const photoUrl = safeStr(profile?.photoUrl || (Array.isArray(profile?.photoUrls) ? profile.photoUrls[0] : ''));
  const city = safeStr(profile?.city);
  const gender = genderLabel(t, profile?.gender);
  const marital = maritalStatusLabel(t, profile?.details?.maritalStatus || profile?.maritalStatus);
  const occupation = safeStr(profile?.details?.occupation || profile?.occupation);
  const about = clipText(profile?.about, 150);
  const expectations = clipText(profile?.expectations, 150);
  const isBusy = actionLoadingUid && actionLoadingUid === targetUid;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
            <User className="h-10 w-10" />
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
            {t('studio.matches.people.savedLabel')}
          </span>
        </div>
      </div>

      <div className="p-4 text-slate-900">
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-semibold text-slate-900">{name}{age}</p>
        </div>

        <div className="mt-2 space-y-1 text-sm text-slate-600">
          {gender ? <p>{gender}</p> : null}
          {marital ? <p>{marital}</p> : null}
          {city ? <p>{city}</p> : null}
          {occupation ? <p>{occupation}</p> : null}
        </div>

        {about || expectations ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {about ? <p><span className="font-semibold">{t('studio.myInfo.fields.about')}:</span> {about}</p> : null}
            {expectations ? <p><span className="font-semibold">{t('studio.myInfo.fields.expectations')}:</span> {expectations}</p> : null}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            disabled={!!isBusy}
            onClick={() => onLike?.(person)}
            className="app-btn app-btn-primary w-full disabled:opacity-60"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Heart className="h-4 w-4" />
              <span>{isBusy && actionKind === 'like' ? t('studio.common.processing') : t('studio.match.actions.like')}</span>
            </span>
          </button>

          <button
            type="button"
            disabled={!!isBusy}
            onClick={() => onMessage?.(person)}
            className="app-btn app-btn-soft w-full disabled:opacity-60"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>{t('studio.match.actions.message')}</span>
            </span>
          </button>

          <button
            type="button"
            disabled={!!isBusy}
            onClick={() => onInspect?.(person)}
            data-testid={targetUid ? `person-inspect-${targetUid}` : 'person-inspect'}
            className="app-btn app-btn-outline w-full disabled:opacity-60"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              <span>{isBusy && actionKind === 'profile' ? t('studio.common.processing') : t('studio.matches.people.inspect')}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}