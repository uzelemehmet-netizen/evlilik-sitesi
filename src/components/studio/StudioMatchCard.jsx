import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '../../utils/authFetch';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function maritalStatusToKey(v) {
  const s = safeStr(v);
  if (!s) return '';
  const map = {
    single: 'matchmakingPage.form.options.maritalStatus.single',
    widowed: 'matchmakingPage.form.options.maritalStatus.widowed',
    divorced: 'matchmakingPage.form.options.maritalStatus.divorced',
    other: 'matchmakingPage.form.options.maritalStatus.other',
    doesnt_matter: 'matchmakingPage.form.options.maritalStatus.doesnt_matter',
  };
  return map[s] || '';
}

export default function StudioMatchCard({ match, currentUid, onOpenShort, activeLockMatchId }) {
  const { t } = useTranslation();
  const [likeState, setLikeState] = useState({ loading: false, error: '' });
  const [photoIndex, setPhotoIndex] = useState(0);

  const other = useMemo(() => {
    if (!match) return null;
    const aId = safeStr(match?.aUserId);
    const bId = safeStr(match?.bUserId);

    const mySide = currentUid && aId === currentUid ? 'a' : currentUid && bId === currentUid ? 'b' : '';
    if (!mySide) return null;
    const otherSide = mySide === 'a' ? 'b' : 'a';

    const fromSnap = match?.profiles?.[otherSide] && typeof match.profiles[otherSide] === 'object' ? match.profiles[otherSide] : {};
    return fromSnap;
  }, [currentUid, match]);

  const status = safeStr(match?.status);
  const statusMeta = useMemo(() => {
    if (status === 'proposed') return { label: t('studio.match.status.proposed'), cls: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (status === 'mutual_interest') return { label: t('studio.match.status.mutual_interest'), cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (status === 'mutual_accepted') return { label: t('studio.match.status.mutual_accepted'), cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (status === 'contact_unlocked') return { label: t('studio.match.status.contact_unlocked'), cls: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
    if (status === 'cancelled') return { label: t('studio.match.status.cancelled'), cls: 'bg-rose-50 text-rose-800 border-rose-200' };
    return { label: status || t('studio.match.status.proposed'), cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  }, [status, t]);

  const displayName = safeStr(other?.username || other?.fullName || other?.name) || t('studio.common.match');
  const ageText = typeof other?.age === 'number' ? String(other.age) : '';
  const isVerified = !!other?.identityVerified;
  const rawMarital = safeStr(other?.details?.maritalStatus || other?.maritalStatus);
  const maritalKey = maritalStatusToKey(rawMarital);
  const maritalLabel = maritalKey ? t(maritalKey) : rawMarital;
  const city = safeStr(other?.city || other?.details?.city);
  const photos = useMemo(() => {
    const list = Array.isArray(other?.photoUrls) ? other.photoUrls : [];
    return list.map((x) => safeStr(x)).filter(Boolean).slice(0, 3);
  }, [other]);

  const photoUrl = photos.length ? photos[Math.min(photoIndex, photos.length - 1)] : '';

  useEffect(() => {
    setPhotoIndex(0);
  }, [match?.id]);

  const mySide = useMemo(() => {
    const aId = safeStr(match?.aUserId);
    const bId = safeStr(match?.bUserId);
    if (currentUid && aId === currentUid) return 'a';
    if (currentUid && bId === currentUid) return 'b';
    return '';
  }, [currentUid, match]);

  const decisions = match?.decisions && typeof match.decisions === 'object' ? match.decisions : {};
  const myDecision = mySide ? safeStr(decisions?.[mySide]) : '';
  const isLiked = myDecision === 'accept';

  const unreadCount = useMemo(() => {
    const m = match?.chatUnreadByUid && typeof match.chatUnreadByUid === 'object' ? match.chatUnreadByUid : {};
    const n = currentUid && typeof m?.[currentUid] === 'number' ? m[currentUid] : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [currentUid, match]);

  const lockedByActiveMatch = !!activeLockMatchId && safeStr(activeLockMatchId) !== safeStr(match?.id);

  const like = async () => {
    if (!match?.id || !currentUid) return;
    if (lockedByActiveMatch) return;
    if (isLiked || likeState.loading) return;
    setLikeState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-decision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, decision: 'accept' }),
      });
      setLikeState({ loading: false, error: '' });
    } catch (e) {
      setLikeState({ loading: false, error: safeStr(e?.message) || 'like_failed' });
    }
  };

  const openShort = () => {
    if (typeof onOpenShort !== 'function') return;
    if (lockedByActiveMatch) return;
    onOpenShort({ matchId: match?.id, displayName });
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className={lockedByActiveMatch ? 'pointer-events-none blur-[1px] opacity-70' : ''}>
        <div className="relative">
          <div className={`absolute left-3 top-3 rounded-full border px-2 py-1 text-xs font-semibold ${statusMeta.cls}`}>{statusMeta.label}</div>
          <Link to={`/app/match/${match?.id}`} className="block">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={t('studio.match.avatarAlt', { name: displayName })}
                className="h-48 w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="h-48 w-full bg-slate-100" />
            )}
          </Link>

          {photos.length > 1 ? (
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

          {photos.length > 1 ? (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPhotoIndex((p) => (p - 1 + photos.length) % photos.length);
                }}
                className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white shadow-sm transition hover:bg-black/55"
                aria-label="Prev photo"
                title="Prev"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPhotoIndex((p) => (p + 1) % photos.length);
                }}
                className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white shadow-sm transition hover:bg-black/55"
                aria-label="Next photo"
                title="Next"
              >
                ›
              </button>
            </div>
          ) : null}

          {unreadCount > 0 ? (
            <div className="absolute right-3 top-3 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" title={t('studio.match.banners.newMessage')} />
          ) : null}
        </div>

        <div className="p-4 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900 leading-tight">
              <Link to={`/app/match/${match?.id}`} className="hover:underline">
                {displayName}{ageText ? `, ${ageText}` : ''}
              </Link>
            </h3>
            {isVerified ? <ShieldCheck className="h-5 w-5 text-emerald-600" title={t('studio.common.verified')} /> : null}
          </div>

          <div className="mt-2 space-y-1">
            {maritalLabel ? <p className="text-sm text-slate-600">{maritalLabel}</p> : null}
            {city ? <p className="text-sm text-slate-600">{city}</p> : null}
          </div>
        </div>

        <div className="p-4 pt-0 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={like}
            disabled={likeState.loading || isLiked || lockedByActiveMatch}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60"
          >
            <Heart className={`mr-2 h-5 w-5 ${isLiked ? 'text-rose-600 fill-rose-600' : 'text-slate-500'}`} />
            {likeState.loading ? t('studio.common.processing') : isLiked ? t('studio.match.actions.liked') : t('studio.match.actions.like')}
          </button>

          <button
            type="button"
            onClick={openShort}
            disabled={lockedByActiveMatch}
            className="relative inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            {t('studio.match.actions.message')}
            {unreadCount > 0 ? <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-300 ring-2 ring-emerald-600" /> : null}
          </button>
        </div>
      </div>

      {lockedByActiveMatch ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 p-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-900 shadow-sm">
            {t('studio.match.banners.locked')}
          </div>
        </div>
      ) : null}

      {likeState.error ? <div className="px-4 pb-4 text-sm text-rose-700">{likeState.error}</div> : null}
    </div>
  );
}
