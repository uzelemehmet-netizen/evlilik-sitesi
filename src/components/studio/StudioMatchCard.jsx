import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '../../utils/authFetch';
import { translateStudioApiError } from '../../utils/studioErrorI18n';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function genderLabelTR(raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  if (s === 'female' || s === 'f' || s === 'kadin' || s === 'kadın') return 'Kadın';
  if (s === 'male' || s === 'm' || s === 'erkek') return 'Erkek';
  return '';
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

function yesNoLabel(t, rawValue) {
  const s = safeStr(rawValue).toLowerCase();
  if (s === 'yes' || s === 'true' || s === '1') return t('matchmakingPage.form.options.common.yes');
  if (s === 'no' || s === 'false' || s === '0') return t('matchmakingPage.form.options.common.no');
  if (s === 'unsure') return t('matchmakingPage.form.options.common.unsure');
  return safeStr(rawValue);
}

function clipText(raw, maxLen) {
  const s = safeStr(raw);
  if (!s) return '';
  return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
}

function normalizeEnumValue(raw) {
  const s = safeStr(raw);
  if (!s) return '';
  const parts = s.split(/[_\s-]+/).filter(Boolean);
  if (!parts.length) return '';
  return parts.map((p, i) => (i === 0 ? p : p.slice(0, 1).toUpperCase() + p.slice(1))).join('');
}

function childrenLivingSituationLabel(t, rawValue) {
  const v = safeStr(rawValue);
  if (!v) return '';
  const key = normalizeEnumValue(v);
  const fullKey = `matchmakingPage.form.options.childrenLivingSituation.${key}`;
  const label = t(fullKey);
  return label && label !== fullKey ? label : v;
}

export default function StudioMatchCard({
  match,
  currentUid,
  onOpenShort,
  activeLockMatchId,
  canSeeFullProfiles = true,
  canInteract = true,
  onRequirePaid,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [likeState, setLikeState] = useState({ loading: false, error: '' });
  const [activeStartState, setActiveStartState] = useState({ loading: false, error: '', notice: '' });
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
  const tier = safeStr(match?.matchTier || match?.debug?.matchTier);
  const statusMeta = useMemo(() => {
    if (status === 'proposed') return { label: t('studio.match.status.proposed'), cls: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (status === 'mutual_interest') return { label: t('studio.match.status.mutual_interest'), cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (status === 'mutual_accepted') return { label: t('studio.match.status.mutual_accepted'), cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (status === 'contact_unlocked') return { label: t('studio.match.status.contact_unlocked'), cls: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
    if (status === 'cancelled') return { label: t('studio.match.status.cancelled'), cls: 'bg-rose-50 text-rose-800 border-rose-200' };
    return { label: status || t('studio.match.status.proposed'), cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  }, [status, t]);

  const tierMeta = useMemo(() => {
    if (tier === 'pre_match') return { label: t('studio.match.tier.pre_match'), cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    return null;
  }, [t, tier]);

  const displayName = safeStr(other?.username) || t('studio.common.match');
  const ageText = typeof other?.age === 'number' ? String(other.age) : '';
  const genderText = genderLabelTR(other?.gender);
  const isVerified = !!other?.identityVerified;
  const rawMarital = safeStr(other?.details?.maritalStatus || other?.maritalStatus);
  const maritalKey = maritalStatusToKey(rawMarital);
  const maritalLabel = maritalKey ? t(maritalKey) : rawMarital;
  const isSingleMarital = rawMarital === 'single';
  const city = safeStr(other?.city || other?.details?.city);

  const occupationRaw = safeStr(other?.details?.occupation || other?.occupation);
  const hasChildrenRaw = safeStr(other?.details?.hasChildren);
  const hasChildrenLabel = hasChildrenRaw ? yesNoLabel(t, hasChildrenRaw) : '';
  const childrenCount = typeof other?.details?.childrenCount === 'number' ? other.details.childrenCount : null;
  const childrenLivingRaw = safeStr(other?.details?.childrenLivingSituation);
  const childrenLivingLabelText = childrenLivingRaw
    ? childrenLivingSituationLabel(t, childrenLivingRaw)
    : hasChildrenRaw === 'yes'
      ? t('studio.common.unknown')
      : '';

  const about = clipText(other?.about || other?.details?.about || other?.bio || other?.details?.bio, 220);
  const expectations = clipText(other?.expectations || other?.details?.expectations, 220);
  const photos = useMemo(() => {
    const list = Array.isArray(other?.photoUrls) ? other.photoUrls : [];
    return list
      .map((x) => safeStr(x))
      .filter(Boolean)
      .slice(0, canSeeFullProfiles ? 3 : 1);
  }, [canSeeFullProfiles, other]);

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

  const otherDecision = useMemo(() => {
    if (!mySide) return '';
    const otherSide = mySide === 'a' ? 'b' : 'a';
    return safeStr(decisions?.[otherSide]);
  }, [decisions, mySide]);

  const isIncomingLike = otherDecision === 'accept' && myDecision !== 'accept';
  const isLikeSent = myDecision === 'accept' && otherDecision !== 'accept';
  const mutualLiked = myDecision === 'accept' && otherDecision === 'accept';

  const activeStartByUid = match?.activeStartByUid && typeof match.activeStartByUid === 'object' ? match.activeStartByUid : {};
  const iStartedActive = !!(currentUid && activeStartByUid?.[String(currentUid).trim()]);
  const otherStartedActive = useMemo(() => {
    const ids = Array.isArray(match?.userIds) ? match.userIds.map(safeStr).filter(Boolean) : [];
    const me = safeStr(currentUid);
    const otherUid = ids.find((x) => x && x !== me) || '';
    return !!(otherUid && activeStartByUid?.[otherUid]);
  }, [activeStartByUid, currentUid, match?.userIds]);

  const unreadCount = useMemo(() => {
    const m = match?.chatUnreadByUid && typeof match.chatUnreadByUid === 'object' ? match.chatUnreadByUid : {};
    const n = currentUid && typeof m?.[currentUid] === 'number' ? m[currentUid] : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [currentUid, match]);

  const unreadBadgeText = useMemo(() => {
    if (!unreadCount) return '';
    return unreadCount > 99 ? '99+' : String(unreadCount);
  }, [unreadCount]);

  const lockedByActiveMatch = !!activeLockMatchId && safeStr(activeLockMatchId) !== safeStr(match?.id);

  const startActive = async () => {
    if (!match?.id || !currentUid) return;
    if (lockedByActiveMatch) {
      setActiveStartState({ loading: false, error: t('studio.errors.activeLocked'), notice: '' });
      return;
    }
    if (!canInteract) {
      setActiveStartState({ loading: false, error: t('studio.paywall.upgradeToInteract'), notice: '' });
      if (typeof onRequirePaid === 'function') onRequirePaid();
      return;
    }
    if (activeStartState.loading) return;

    const ok = typeof window !== 'undefined' ? window.confirm(t('studio.matchProfile.activeStart.confirmPrompt')) : true;
    if (!ok) return;

    setActiveStartState({ loading: true, error: '', notice: '' });
    try {
      const data = await authFetch('/api/matchmaking-active-start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: match.id }),
      });

      const activated = !!data?.activated;
      if (activated) {
        setActiveStartState({ loading: false, error: '', notice: t('studio.matchProfile.activeStart.activatedNotice') });
        navigate(`/app/chat/${match.id}`);
      } else {
        setActiveStartState({ loading: false, error: '', notice: t('studio.matchProfile.activeStart.waitingNotice') });
      }
    } catch (e) {
      const msg = safeStr(e?.message);
      setActiveStartState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'active_start_failed', notice: '' });
    }
  };

  const like = async () => {
    if (!match?.id || !currentUid) return;
    if (lockedByActiveMatch) {
      setLikeState({ loading: false, error: t('studio.errors.activeLocked') });
      return;
    }
    if (!canInteract) {
      setLikeState({ loading: false, error: t('studio.paywall.upgradeToInteract') });
      if (typeof onRequirePaid === 'function') onRequirePaid();
      return;
    }
    if (likeState.loading) return;
    setLikeState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-decision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, decision: isLiked ? 'revoke' : 'accept' }),
      });
      setLikeState({ loading: false, error: '' });
    } catch (e) {
      const msg = safeStr(e?.message);
      setLikeState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'like_failed' });
    }
  };

  const reject = async () => {
    if (!match?.id || !currentUid) return;
    if (lockedByActiveMatch) {
      setLikeState({ loading: false, error: t('studio.errors.activeLocked') });
      return;
    }
    if (!canInteract) {
      setLikeState({ loading: false, error: t('studio.paywall.upgradeToInteract') });
      if (typeof onRequirePaid === 'function') onRequirePaid();
      return;
    }
    if (likeState.loading) return;
    setLikeState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-decision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, decision: 'reject' }),
      });
      setLikeState({ loading: false, error: '' });
    } catch (e) {
      const msg = safeStr(e?.message);
      setLikeState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'reject_failed' });
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
          <div
            className={`pointer-events-none absolute left-3 top-3 rounded-full border px-2 py-1 text-xs font-semibold ${statusMeta.cls}`}
          >
            {statusMeta.label}
          </div>

          {isIncomingLike ? (
            <div className="pointer-events-none absolute left-3 top-12">
              <span
                className="inline-flex items-center rounded-full bg-emerald-950/80 px-2 py-1 text-[11px] font-semibold text-emerald-50 ring-2 ring-emerald-400/70 shadow-[0_0_18px_rgba(52,211,153,0.55)]"
                title={t('matchmakingPanel.matches.candidate.likeBadge')}
              >
                {t('matchmakingPanel.matches.candidate.likeBadge')}
              </span>
            </div>
          ) : null}

          {isLikeSent ? (
            <div className="pointer-events-none absolute left-3 top-12">
              <span
                className="inline-flex items-center rounded-full bg-sky-950/75 px-2 py-1 text-[11px] font-semibold text-sky-50 ring-2 ring-sky-300/60 shadow-[0_0_18px_rgba(56,189,248,0.45)]"
                title={t('matchmakingPanel.matches.candidate.likeSentBadge')}
              >
                {t('matchmakingPanel.matches.candidate.likeSentBadge')}
              </span>
            </div>
          ) : null}

          {status === 'mutual_interest' && mutualLiked && otherStartedActive && !iStartedActive ? (
            <div className="pointer-events-none absolute left-3 top-[4.25rem]">
              <span
                className="inline-flex items-center rounded-full bg-amber-950/70 px-2 py-1 text-[11px] font-semibold text-amber-50 ring-2 ring-amber-300/70 shadow-[0_0_18px_rgba(251,191,36,0.45)]"
                title={t('studio.matchProfile.activeStart.waiting')}
              >
                Aktif eşleşme isteği
              </span>
            </div>
          ) : null}

          {tierMeta ? (
            <div
              className={`pointer-events-none absolute right-3 top-3 rounded-full border px-2 py-1 text-xs font-semibold ${tierMeta.cls}`}
            >
              {tierMeta.label}
            </div>
          ) : null}
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

            {genderText ? (
              <div className="pointer-events-none absolute left-3 bottom-3">
                <span className="inline-flex items-center rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">
                  {genderText}
                </span>
              </div>
            ) : null}

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
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
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
            <div className="pointer-events-none absolute right-3 top-3">
              <span
                className="inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm ring-2 ring-white"
                title={t('studio.match.banners.newMessage')}
              >
                {unreadBadgeText}
              </span>
            </div>
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
            {occupationRaw ? <p className="text-sm text-slate-600">{occupationRaw}</p> : null}
            {!isSingleMarital && hasChildrenRaw === 'yes' && hasChildrenLabel ? (
              <p className="text-sm text-slate-600">
                {t('studio.myInfo.fields.hasChildren')}: {hasChildrenLabel}
                {childrenCount !== null ? ` (${childrenCount})` : ''}
                {childrenLivingLabelText ? ` • ${childrenLivingLabelText}` : ''}
              </p>
            ) : null}
          </div>

          {about || expectations ? (
            <div className="mt-3 space-y-2">
              {about ? (
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">{t('studio.myInfo.fields.about')}:</span> {about}
                </p>
              ) : null}
              {expectations ? (
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">{t('studio.myInfo.fields.expectations')}:</span> {expectations}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="p-4 pt-0 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={like}
            disabled={likeState.loading || lockedByActiveMatch}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60"
          >
            <Heart className={`mr-2 h-5 w-5 ${isLiked ? 'text-rose-600 fill-rose-600' : 'text-slate-500'}`} />
            {likeState.loading
              ? t('studio.common.processing')
              : isLiked
                ? t('studio.match.actions.unlike')
                : t('studio.match.actions.like')}
          </button>

          {isIncomingLike ? (
            <button
              type="button"
              onClick={reject}
              disabled={likeState.loading || lockedByActiveMatch}
              className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 shadow-sm transition hover:bg-rose-100 active:scale-[0.99] disabled:opacity-60"
              title={t('studio.inbox.reject')}
            >
              {t('studio.inbox.reject')}
            </button>
          ) : null}

          {status === 'mutual_interest' && mutualLiked ? (
            <button
              type="button"
              onClick={startActive}
              disabled={activeStartState.loading || lockedByActiveMatch}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
              title={t('studio.matchProfile.activeStart.start')}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {activeStartState.loading
                ? t('studio.matchProfile.activeStart.starting')
                : iStartedActive
                  ? t('studio.matchProfile.activeStart.waiting')
                  : t('studio.matchProfile.activeStart.start')}
            </button>
          ) : null}

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
      {activeStartState.error ? <div className="px-4 pb-4 text-sm text-rose-700">{activeStartState.error}</div> : null}
      {activeStartState.notice ? <div className="px-4 pb-4 text-sm text-emerald-700">{activeStartState.notice}</div> : null}
    </div>
  );
}
