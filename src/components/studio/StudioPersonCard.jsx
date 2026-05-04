import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, MessageCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider';
import { authFetch } from '../../utils/authFetch';
import { getPresenceMeta } from '../../utils/presenceLabel';
import { getLocalizedProfileText } from '../../utils/profileText';
import { useAutoLocalizedProfileText } from '../../hooks/useAutoLocalizedProfileText';

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

function getTargetVariant(profile, field, uiLang) {
  const lang = safeStr(uiLang).toLowerCase().split('-')[0] || '';
  const suffix = lang === 'tr' ? 'Tr' : lang === 'id' ? 'Id' : '';
  if (!suffix) return '';
  return safeStr(profile?.[`${field}${suffix}`]) || safeStr(profile?.details?.[`${field}${suffix}`]);
}

const personProfileCache = new Map();
const personProfileInflight = new Map();

export default function StudioPersonCard({
  person,
  onLike,
  onMessage,
  onInspect,
  onOpenPhotos,
  actionLoadingUid = '',
  actionKind = '',
  presenceByUid,
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const touchStartRef = useRef({ x: 0, y: 0 });

  const targetUid = safeStr(person?.toUid || person?.targetUid || person?.uid);
  const profile = person?.targetProfile && typeof person.targetProfile === 'object' ? person.targetProfile : {};
  const [refreshedProfile, setRefreshedProfile] = useState(() => {
    const cached = targetUid ? personProfileCache.get(targetUid) : null;
    return cached && typeof cached === 'object' ? cached : null;
  });
  const [profileUnavailable, setProfileUnavailable] = useState(false);
  const effectiveProfile = refreshedProfile && typeof refreshedProfile === 'object'
    ? { ...profile, ...refreshedProfile, details: { ...(profile?.details || {}), ...(refreshedProfile?.details || {}) } }
    : profile;
  const name = safeStr(profile?.username) || t('studio.common.profile');
  const age = typeof effectiveProfile?.age === 'number' ? ` • ${effectiveProfile.age} ${t('studio.common.ageSuffix')}` : '';
  const photos = useMemo(() => {
    const list = Array.isArray(effectiveProfile?.photoUrls) ? effectiveProfile.photoUrls : [];
    const cleaned = list.map((item) => safeStr(item)).filter(Boolean);
    if (cleaned.length) return cleaned;
    const legacy = safeStr(effectiveProfile?.photoUrl);
    return legacy ? [legacy] : [];
  }, [effectiveProfile?.photoUrl, effectiveProfile?.photoUrls]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photoUrl = photos.length ? photos[Math.min(photoIndex, photos.length - 1)] : '';
  const city = safeStr(effectiveProfile?.city);
  const gender = genderLabel(t, effectiveProfile?.gender);
  const marital = maritalStatusLabel(t, effectiveProfile?.details?.maritalStatus || effectiveProfile?.maritalStatus);
  const occupation = safeStr(getLocalizedProfileText(effectiveProfile?.details, 'occupation', i18n.language)) || safeStr(effectiveProfile?.details?.occupation || effectiveProfile?.occupation);
  const about = clipText(useAutoLocalizedProfileText(effectiveProfile, 'about', i18n.language), 150);
  const expectations = clipText(useAutoLocalizedProfileText(effectiveProfile, 'expectations', i18n.language), 150);
  const isBusy = actionLoadingUid && actionLoadingUid === targetUid;
  const isPreview = !user || user.isAnonymous;
  const needsAboutRefresh = !getTargetVariant(effectiveProfile, 'about', i18n.language);
  const needsExpectationsRefresh = !getTargetVariant(effectiveProfile, 'expectations', i18n.language);
  const shouldRefreshProfile = !!targetUid && !isPreview && (needsAboutRefresh || needsExpectationsRefresh || photos.length <= 1);
  const otherLastSeenAtMs = useMemo(() => {
    const fromMap =
      presenceByUid && typeof presenceByUid === 'object' && targetUid && typeof presenceByUid?.[targetUid] === 'number'
        ? presenceByUid[targetUid]
        : 0;
    const fromProfile = typeof effectiveProfile?.lastSeenAtMs === 'number' && Number.isFinite(effectiveProfile.lastSeenAtMs) ? effectiveProfile.lastSeenAtMs : 0;
    return fromMap || fromProfile || 0;
  }, [effectiveProfile?.lastSeenAtMs, presenceByUid, targetUid]);
  const presenceMeta = useMemo(() => getPresenceMeta(otherLastSeenAtMs, i18n?.language || 'tr'), [i18n?.language, otherLastSeenAtMs]);

  useEffect(() => {
    const cached = targetUid ? personProfileCache.get(targetUid) : null;
    setRefreshedProfile(cached && typeof cached === 'object' ? cached : null);
    setProfileUnavailable(false);
  }, [targetUid]);

  useEffect(() => {
    if (!shouldRefreshProfile) return;
    if (personProfileCache.has(targetUid)) {
      setRefreshedProfile(personProfileCache.get(targetUid) || null);
      return;
    }

    let cancelled = false;
    const pending = personProfileInflight.get(targetUid)
      || (async () => {
        try {
          const data = await authFetch('/api/matchmaking-profile-view', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ targetUid, silent: true }),
          });
          return data?.profile && typeof data.profile === 'object' ? data.profile : null;
        } catch {
          return null;
        } finally {
          personProfileInflight.delete(targetUid);
        }
      })();

    personProfileInflight.set(targetUid, pending);

    pending.then((nextProfile) => {
      if (cancelled) return;
      if (!nextProfile) {
        return;
      }
      personProfileCache.set(targetUid, nextProfile);
      setProfileUnavailable(false);
      setRefreshedProfile(nextProfile);
    });

    return () => {
      cancelled = true;
    };
  }, [shouldRefreshProfile, targetUid]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [targetUid, photos.length]);

  const hasMultiplePhotos = photos.length > 1;

  const showPrevPhoto = () => {
    if (!hasMultiplePhotos) return;
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const showNextPhoto = () => {
    if (!hasMultiplePhotos) return;
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const showRemovedNotice = profileUnavailable || safeStr(person?.status) === 'deleted_user';
  const canInspect = !showRemovedNotice && typeof onInspect === 'function';
  const canOpenPhotos = !showRemovedNotice && photos.length > 0 && typeof onOpenPhotos === 'function';

  const handleInspect = () => {
    if (!canInspect || isBusy) return;
    onInspect(person);
  };

  const handleOpenPhotos = () => {
    if (!canOpenPhotos) return;
    onOpenPhotos({ person, images: photos, index: Math.min(photoIndex, Math.max(photos.length - 1, 0)), title: name });
  };

  const stopCardActionPropagation = (event) => {
    event.stopPropagation();
  };

  const handleTouchStart = (event) => {
    if (!hasMultiplePhotos) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    if (!hasMultiplePhotos) return;
    const touch = event.changedTouches?.[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) < 36 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (deltaX < 0) {
      showNextPhoto();
      return;
    }
    showPrevPhoto();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div
        data-testid={targetUid ? `person-card-photo-${targetUid}` : 'person-card-photo'}
        className={
          'relative aspect-square w-full overflow-hidden bg-slate-100 ' +
          (canOpenPhotos ? 'cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2' : '')
        }
        onClick={handleOpenPhotos}
        onKeyDown={(event) => {
          if (!canOpenPhotos) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleOpenPhotos();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role={canOpenPhotos ? 'button' : undefined}
        tabIndex={canOpenPhotos ? 0 : undefined}
        style={{ touchAction: 'pan-y' }}
      >
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

        {hasMultiplePhotos ? (
          <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">
            {photoIndex + 1}/{photos.length}
          </div>
        ) : null}

        {hasMultiplePhotos ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
            <button
              type="button"
              onClick={(event) => {
                stopCardActionPropagation(event);
                showPrevPhoto();
              }}
              onMouseDown={stopCardActionPropagation}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white shadow-sm transition hover:bg-black/55"
              aria-label={t('studio.matchProfile.prevPhoto')}
              title={t('studio.matchProfile.prevPhoto')}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={(event) => {
                stopCardActionPropagation(event);
                showNextPhoto();
              }}
              onMouseDown={stopCardActionPropagation}
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white shadow-sm transition hover:bg-black/55"
              aria-label={t('studio.matchProfile.nextPhoto')}
              title={t('studio.matchProfile.nextPhoto')}
            >
              ›
            </button>
          </div>
        ) : null}

        {hasMultiplePhotos ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-1">
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={
                  'h-1.5 w-1.5 rounded-full transition ' +
                  (idx === photoIndex ? 'bg-white shadow' : 'bg-white/60')
                }
              />
            ))}
          </div>
        ) : null}
      </div>

      <div
        data-testid={targetUid ? `person-card-info-${targetUid}` : 'person-card-info'}
        className={
          'p-4 text-slate-900 ' +
          (canInspect ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset' : '')
        }
        onClick={handleInspect}
        onKeyDown={(event) => {
          if (!canInspect || isBusy) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleInspect();
          }
        }}
        role={canInspect ? 'button' : undefined}
        tabIndex={canInspect ? 0 : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-semibold text-slate-900">{name}{age}</p>
        </div>

        {presenceMeta.label ? (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span
              className={
                'inline-block h-2 w-2 rounded-full ' +
                (presenceMeta.isOnline
                  ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
                  : 'bg-slate-300')
              }
              aria-hidden="true"
            />
            <span>{presenceMeta.label}</span>
          </div>
        ) : null}

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

        {showRemovedNotice ? (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
            {t('studio.match.banners.removedForRulesViolation')}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              disabled={!!isBusy}
              onClick={(event) => {
                stopCardActionPropagation(event);
                onLike?.(person);
              }}
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
              onClick={(event) => {
                stopCardActionPropagation(event);
                onMessage?.(person);
              }}
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
              onClick={(event) => {
                stopCardActionPropagation(event);
                handleInspect();
              }}
              data-testid={targetUid ? `person-inspect-${targetUid}` : 'person-inspect'}
              className="app-btn app-btn-outline w-full disabled:opacity-60"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <User className="h-4 w-4" />
                <span>{isBusy && actionKind === 'profile' ? t('studio.common.processing') : t('studio.matches.people.inspect')}</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}