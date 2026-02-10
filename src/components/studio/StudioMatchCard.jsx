import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, ShieldCheck, Sparkles, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '../../utils/authFetch';
import { translateStudioApiError } from '../../utils/studioErrorI18n';
import ImageLightbox from '../ImageLightbox';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function genderLabel(t, raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  if (s === 'female' || s === 'f' || s === 'kadin' || s === 'kadın') return t('matchmakingPage.form.options.gender.female');
  if (s === 'male' || s === 'm' || s === 'erkek') return t('matchmakingPage.form.options.gender.male');
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

function formatPresenceLabel(t, lastSeenAtMs) {
  const ms = typeof lastSeenAtMs === 'number' && Number.isFinite(lastSeenAtMs) ? lastSeenAtMs : 0;
  if (!ms) return '';

  const nowMs = Date.now();
  const diffMs = Math.max(0, nowMs - ms);
  const onlineWindowMs = 5 * 60 * 1000;

  if (diffMs <= onlineWindowMs) return t('studio.presence.online');

  const minutes = Math.round(diffMs / (60 * 1000));
  if (minutes < 60) return t('studio.presence.lastSeenMinutes', { count: minutes });

  const hours = Math.round(diffMs / (60 * 60 * 1000));
  if (hours < 24) return t('studio.presence.lastSeenHours', { count: hours });

  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return t('studio.presence.lastSeenDays', { count: days });
}

export default function StudioMatchCard({
  match,
  currentUid,
  onOpenShort,
  activeLockMatchId,
  canSeeFullProfiles = true,
  profileComplete = true,
  membershipActive = true,
  onRequireProfile,
  onRequirePaid,
  presenceByUid,
  interactionsDisabled = false,
  onInteractDisabled,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [likeState, setLikeState] = useState({ loading: false, error: '' });
  const [activeStartState, setActiveStartState] = useState({ loading: false, error: '', notice: '' });
  const [photoAccessState, setPhotoAccessState] = useState({ loading: false, error: '' });
  const [photoRequestState, setPhotoRequestState] = useState({ loading: false, error: '', status: '' });
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [expectExpanded, setExpectExpanded] = useState(false);

  const blockInteraction = () => {
    try {
      if (typeof onInteractDisabled === 'function') onInteractDisabled();
    } catch {
      // noop
    }
  };

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

  const otherLastSeenAtMs = useMemo(() => {
    const otherUid = safeStr(match?.aUserId) === safeStr(currentUid) ? safeStr(match?.bUserId) : safeStr(match?.aUserId);
    const fromMap =
      presenceByUid && typeof presenceByUid === 'object' && otherUid && typeof presenceByUid?.[otherUid] === 'number'
        ? presenceByUid[otherUid]
        : 0;

    const fromSnap = typeof other?.lastSeenAtMs === 'number' && Number.isFinite(other.lastSeenAtMs) ? other.lastSeenAtMs : 0;
    return fromMap || fromSnap || 0;
  }, [currentUid, match?.aUserId, match?.bUserId, other?.lastSeenAtMs, presenceByUid]);

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
  const otherUserCode = safeStr(other?.userCode) || safeStr(other?.publicProfile?.userCode);
  const ageText = typeof other?.age === 'number' ? String(other.age) : '';
  const genderText = genderLabel(t, other?.gender);
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

  const aboutFull = safeStr(other?.about || other?.details?.about || other?.bio || other?.details?.bio);
  const expectationsFull = safeStr(other?.expectations || other?.details?.expectations);
  const aboutCollapsed = clipText(aboutFull, 180);
  const expectationsCollapsed = clipText(expectationsFull, 180);
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

  const otherUid = useMemo(() => {
    const aId = safeStr(match?.aUserId);
    const bId = safeStr(match?.bUserId);
    if (!currentUid) return '';
    if (aId && aId === currentUid) return bId;
    if (bId && bId === currentUid) return aId;
    return '';
  }, [currentUid, match]);

  const photoBlurByUid = useMemo(() => {
    return match?.photoBlurByUid && typeof match.photoBlurByUid === 'object' ? match.photoBlurByUid : {};
  }, [match]);

  const photoAccess = useMemo(() => {
    return match?.photoAccess && typeof match.photoAccess === 'object' ? match.photoAccess : {};
  }, [match]);

  const myPhotosBlurred = !!(currentUid && photoBlurByUid?.[String(currentUid).trim()]);
  const otherPhotosBlurred = !!(otherUid && photoBlurByUid?.[otherUid]);

  const myToOtherAllowed = useMemo(() => {
    if (!mySide || !otherUid) return false;
    // aToB: A'nın fotoğrafları B'ye açık mı?
    if (mySide === 'a') return !!photoAccess?.aToB;
    return !!photoAccess?.bToA;
  }, [mySide, otherUid, photoAccess]);

  const otherToMeAllowed = useMemo(() => {
    if (!mySide || !otherUid) return false;
    // otherSide === 'a' ise A'nın fotoğrafları B'ye açık mı? (ben B'yim)
    // otherSide === 'b' ise B'nin fotoğrafları A'ya açık mı? (ben A'yım)
    if (mySide === 'a') return !!photoAccess?.bToA;
    return !!photoAccess?.aToB;
  }, [mySide, otherUid, photoAccess]);

  // Karşılıklılık: Kendi fotoğraflarını blurlayıp bu kişiden gizliyorsan, sen de onun fotoğraflarını göremezsin.
  const canSeeOtherPhotos = (!otherPhotosBlurred || otherToMeAllowed) && (!myPhotosBlurred || myToOtherAllowed);

  const requestOtherPhotoAccess = async () => {
    if (interactionsDisabled) {
      blockInteraction();
      return;
    }
    if (!match?.id || !currentUid || !otherUid) return;
    if (photoRequestState.loading) return;

    if (!profileComplete) {
      const msg = t('studio.profileGate.body');
      setPhotoRequestState({ loading: false, error: msg, status: '' });
      if (typeof onRequireProfile === 'function') onRequireProfile();
      return;
    }

    if (!membershipActive) {
      const msg = t('studio.paywall.upgradeToInteract');
      setPhotoRequestState({ loading: false, error: msg, status: '' });
      if (typeof onRequirePaid === 'function') onRequirePaid();
      return;
    }

    setPhotoRequestState({ loading: true, error: '', status: '' });
    try {
      const data = await authFetch('/api/matchmaking-photo-access-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: match.id }),
      });
      const status = safeStr(data?.status) || 'pending';
      setPhotoRequestState({ loading: false, error: '', status });
    } catch (e) {
      const msg = safeStr(e?.message);
      setPhotoRequestState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'request_failed', status: '' });
    }
  };

  const setMyPhotoAccessForThisMatch = async (next) => {
    if (interactionsDisabled) {
      blockInteraction();
      return;
    }
    if (!match?.id || !currentUid) return;
    if (!myPhotosBlurred) return;
    if (photoAccessState.loading) return;

    setPhotoAccessState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-photo-access-set', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, allow: !!next }),
      });
      setPhotoAccessState({ loading: false, error: '' });
    } catch (e) {
      const msg = safeStr(e?.message);
      setPhotoAccessState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'photo_access_failed' });
    }
  };

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

  const isActiveMatchForMe = useMemo(() => {
    const lockId = safeStr(activeLockMatchId);
    const id = safeStr(match?.id);
    return !!lockId && !!id && lockId === id;
  }, [activeLockMatchId, match?.id]);

  const longChatAllowedHere = useMemo(() => {
    if (!isActiveMatchForMe) return false;
    return status === 'mutual_accepted' || status === 'contact_unlocked';
  }, [isActiveMatchForMe, status]);

  const activeChatNoticeKey = useMemo(() => {
    const id = safeStr(match?.id);
    const uid = safeStr(currentUid);
    if (!id || !uid) return '';
    return `studio_active_chat_notice_seen:${uid}:${id}`;
  }, [currentUid, match?.id]);

  const [activeChatNoticeSeen, setActiveChatNoticeSeen] = useState(true);
  useEffect(() => {
    if (!activeChatNoticeKey) {
      setActiveChatNoticeSeen(true);
      return;
    }
    try {
      setActiveChatNoticeSeen(window.localStorage.getItem(activeChatNoticeKey) === '1');
    } catch {
      setActiveChatNoticeSeen(true);
    }
  }, [activeChatNoticeKey]);

  const lockedByActiveMatch = !!activeLockMatchId && safeStr(activeLockMatchId) !== safeStr(match?.id);

  const startActive = async () => {
    if (interactionsDisabled) {
      blockInteraction();
      return;
    }
    if (!match?.id || !currentUid) return;
    if (lockedByActiveMatch) {
      setActiveStartState({ loading: false, error: t('studio.errors.activeLocked'), notice: '' });
      return;
    }
    if (!profileComplete) {
      setActiveStartState({ loading: false, error: t('studio.profileGate.body'), notice: '' });
      if (typeof onRequireProfile === 'function') onRequireProfile();
      return;
    }
    if (!membershipActive) {
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
    if (interactionsDisabled) {
      blockInteraction();
      return;
    }
    if (!match?.id || !currentUid) return;
    if (lockedByActiveMatch) {
      setLikeState({ loading: false, error: t('studio.errors.activeLocked') });
      return;
    }
    if (!profileComplete) {
      setLikeState({ loading: false, error: t('studio.profileGate.body') });
      if (typeof onRequireProfile === 'function') onRequireProfile();
      return;
    }
    if (!membershipActive) {
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
    if (interactionsDisabled) {
      blockInteraction();
      return;
    }
    if (!match?.id || !currentUid) return;
    if (lockedByActiveMatch) {
      setLikeState({ loading: false, error: t('studio.errors.activeLocked') });
      return;
    }
    if (!profileComplete) {
      setLikeState({ loading: false, error: t('studio.profileGate.body') });
      if (typeof onRequireProfile === 'function') onRequireProfile();
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
    if (interactionsDisabled) {
      blockInteraction();
      return;
    }
    if (typeof onOpenShort !== 'function') return;
    if (lockedByActiveMatch) return;
    onOpenShort({ matchId: match?.id, displayName });
  };

  const openMessage = () => {
    if (interactionsDisabled) {
      blockInteraction();
      return;
    }
    if (lockedByActiveMatch) return;
    if (!match?.id) return;

    if (longChatAllowedHere) {
      try {
        if (activeChatNoticeKey) window.localStorage.setItem(activeChatNoticeKey, '1');
      } catch {
        // noop
      }
      setActiveChatNoticeSeen(true);
      navigate(`/app/chat/${match.id}`);
      return;
    }

    openShort();
  };

  const openProfileDetails = () => {
    if (!match?.id) return;
    if (lockedByActiveMatch) return;
    navigate(`/app/match/${match.id}`, { state: { openProfile: true, profileTab: 'details' } });
  };

  const canOpenLightbox = !!photoUrl && canSeeOtherPhotos;

  const photoBlockedByReciprocity = !!myPhotosBlurred && !myToOtherAllowed;
  const photoBlockedByOtherPrivacy = !!otherPhotosBlurred && !otherToMeAllowed;
  const incomingLikeNeedsDecision = !!isIncomingLike && !isLiked;

  return (
    <>
    <div className="relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className={lockedByActiveMatch ? 'pointer-events-none blur-[1px] opacity-70' : ''}>
        <div className="relative">
          <div
            className={`pointer-events-none absolute left-3 top-3 rounded-full border px-2 py-1 text-xs font-semibold ${statusMeta.cls}`}
          >
            {statusMeta.label}
          </div>

          {isIncomingLike ? (
            <div className="pointer-events-none absolute right-3 top-3">
              <span
                className="relative inline-flex items-center justify-center rounded-full bg-rose-600 px-2 py-1 text-[11px] font-extrabold text-white ring-2 ring-white shadow-sm"
                title={t('studio.match.banners.incomingLikeNote')}
              >
                <Heart className="mr-1 h-4 w-4 fill-white" />
                1
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
                {t('studio.matchProfile.activeStart.waiting')}
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
          <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
            {photoUrl ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!canOpenLightbox) return;
                  setLightbox({
                    open: true,
                    images: photos,
                    index: Math.min(photoIndex, Math.max(photos.length - 1, 0)),
                  });
                }}
                disabled={!canOpenLightbox}
                className={
                  'block h-full w-full ' +
                  (canOpenLightbox ? 'cursor-zoom-in' : 'cursor-not-allowed')
                }
                aria-label={t('studio.match.avatarAlt', { name: displayName })}
                title={canOpenLightbox ? t('studio.common.zoom') : ''}
              >
                <img
                  src={photoUrl}
                  alt={t('studio.match.avatarAlt', { name: displayName })}
                  className={
                    'h-full w-full object-cover ' +
                    (!canSeeOtherPhotos ? 'blur-[24px] saturate-[0.75] contrast-[0.95]' : '')
                  }
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ) : (
              <div className="h-full w-full bg-slate-100" />
            )}

            {status === 'mutual_interest' && mutualLiked ? (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-center">
                <button
                  type="button"
                  data-tutorial-id="match-start-active"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startActive();
                  }}
                  disabled={activeStartState.loading || lockedByActiveMatch}
                  className="pointer-events-auto app-btn app-btn-primary w-full disabled:opacity-60"
                  title={t('studio.matchProfile.activeStart.start')}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {activeStartState.loading
                    ? t('studio.matchProfile.activeStart.starting')
                    : iStartedActive
                      ? t('studio.matchProfile.activeStart.waiting')
                      : t('studio.matchProfile.activeStart.start')}
                </button>
              </div>
            ) : null}
          </div>

          {!canSeeOtherPhotos ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold text-white">
                {photoBlockedByReciprocity ? t('studio.match.photos.reciprocityBlocked') : t('studio.matchProfile.photos.onlyAllowed')}
              </div>
            </div>
          ) : null}

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
                aria-label={t('studio.matchProfile.prevPhoto')}
                title={t('studio.matchProfile.prevPhoto')}
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
                aria-label={t('studio.matchProfile.nextPhoto')}
                title={t('studio.matchProfile.nextPhoto')}
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

          {otherUserCode ? (
            <div className="mt-1">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-900 border border-indigo-200">
                {t('studio.profile.userCode.label')}: {otherUserCode}
              </span>
            </div>
          ) : null}

          {otherLastSeenAtMs ? (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <span
                className={
                  'inline-block h-2 w-2 rounded-full ' +
                  (formatPresenceLabel(t, otherLastSeenAtMs) === t('studio.presence.online')
                    ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
                    : 'bg-slate-300')
                }
                aria-hidden="true"
              />
              <span>{formatPresenceLabel(t, otherLastSeenAtMs)}</span>
            </div>
          ) : null}

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

          {aboutFull || expectationsFull ? (
            <div className="mt-3 space-y-2">
              {aboutFull ? (
                <div className="text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">{t('studio.myInfo.fields.about')}:</span> {aboutExpanded ? aboutFull : aboutCollapsed}
                  </p>
                  {aboutFull.length > aboutCollapsed.length ? (
                    <button
                      type="button"
                      onClick={() => setAboutExpanded((v) => !v)}
                      className="mt-1 text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      {aboutExpanded ? t('studio.common.readLess') : t('studio.common.readMore')}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {expectationsFull ? (
                <div className="text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">{t('studio.myInfo.fields.expectations')}:</span>{' '}
                    {expectExpanded ? expectationsFull : expectationsCollapsed}
                  </p>
                  {expectationsFull.length > expectationsCollapsed.length ? (
                    <button
                      type="button"
                      onClick={() => setExpectExpanded((v) => !v)}
                      className="mt-1 text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      {expectExpanded ? t('studio.common.readLess') : t('studio.common.readMore')}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="p-4 pt-0 flex flex-col gap-2">
          {isIncomingLike ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-xs font-semibold text-rose-800">
              {t('studio.match.banners.incomingLikeNote')}
            </div>
          ) : null}

          {photoBlockedByOtherPrivacy && !photoBlockedByReciprocity ? (
            <button
              type="button"
              onClick={requestOtherPhotoAccess}
              disabled={photoRequestState.loading || photoRequestState.status === 'pending' || photoRequestState.status === 'approved' || lockedByActiveMatch}
              className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {photoRequestState.loading
                ? t('studio.common.processing')
                : photoRequestState.status === 'pending'
                  ? t('studio.match.photoAccess.actions.requested')
                  : photoRequestState.status === 'granted' || photoRequestState.status === 'approved'
                    ? t('studio.match.photoAccess.actions.granted')
                    : t('studio.match.photoAccess.request')}
            </button>
          ) : null}

          {photoBlockedByReciprocity ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-900">
              {t('studio.match.photos.reciprocityHint')}
            </div>
          ) : null}

          {photoRequestState.error ? <div className="text-sm text-rose-700">{photoRequestState.error}</div> : null}

          {myPhotosBlurred ? (
            <button
              type="button"
              onClick={() => {
                const next = !myToOtherAllowed;
                if (!next) {
                  const ok = window.confirm(t('studio.match.photos.reciprocityConfirm'));
                  if (!ok) return;
                }
                setMyPhotoAccessForThisMatch(next);
              }}
              disabled={photoAccessState.loading || lockedByActiveMatch}
              className={
                'app-btn w-full disabled:opacity-60 ' +
                (myToOtherAllowed ? 'app-btn-soft' : 'app-btn-primary')
              }
            >
              {photoAccessState.loading
                ? t('studio.common.processing')
                : myToOtherAllowed
                  ? t('studio.match.photos.hideMine')
                  : t('studio.match.photos.showMine')}
            </button>
          ) : null}

          {photoAccessState.error ? <div className="text-sm text-rose-700">{photoAccessState.error}</div> : null}

          <div className="space-y-2">
            {incomingLikeNeedsDecision ? (
              <>
                <button
                  type="button"
                  data-tutorial-id="match-like"
                  onClick={like}
                  disabled={likeState.loading || lockedByActiveMatch}
                  className="app-btn app-btn-primary w-full disabled:opacity-60"
                >
                  <span className="relative mr-2 inline-flex">
                    <Heart className={'h-5 w-5 ' + (isLiked ? 'fill-white' : isIncomingLike ? 'text-rose-600 fill-rose-600' : '')} />
                    {isIncomingLike && !isLiked ? (
                      <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
                        1
                      </span>
                    ) : null}
                  </span>
                  {likeState.loading
                    ? t('studio.common.processing')
                    : isLiked
                      ? t('studio.match.actions.unlike')
                      : t('studio.match.actions.like')}
                </button>

                <button
                  type="button"
                  onClick={reject}
                  disabled={likeState.loading || lockedByActiveMatch}
                  className="app-btn app-btn-danger w-full disabled:opacity-60"
                  title={t('studio.inbox.reject')}
                >
                  {t('studio.inbox.reject')}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={openProfileDetails}
                    disabled={lockedByActiveMatch}
                    className="app-btn w-full disabled:opacity-60"
                    title={t('studio.match.actions.profileDetails')}
                  >
                    <User className="mr-2 h-5 w-5" />
                    {t('studio.match.actions.profileDetails')}
                  </button>

                  <button
                    type="button"
                    data-tutorial-id="match-open-message"
                    onClick={openMessage}
                    disabled={lockedByActiveMatch}
                    className="app-btn app-btn-soft relative w-full disabled:opacity-60"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    {longChatAllowedHere ? t('studio.match.actions.messageLong') : t('studio.match.actions.message')}
                    {unreadCount > 0 ? (
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-300 ring-2 ring-emerald-600" />
                    ) : null}
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  data-tutorial-id="match-open-message"
                  onClick={openMessage}
                  disabled={lockedByActiveMatch}
                  className="app-btn app-btn-primary relative w-full disabled:opacity-60"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  {longChatAllowedHere ? t('studio.match.actions.messageLong') : t('studio.match.actions.message')}
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-300 ring-2 ring-emerald-600" />
                  ) : null}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-tutorial-id="match-like"
                    onClick={like}
                    disabled={likeState.loading || lockedByActiveMatch}
                    className={'app-btn w-full disabled:opacity-60 ' + (isLiked ? 'app-btn-primary' : 'app-btn')}
                  >
                    <span className="relative mr-2 inline-flex">
                      <Heart className={'h-5 w-5 ' + (isLiked ? 'fill-white' : isIncomingLike ? 'text-rose-600 fill-rose-600' : '')} />
                      {isIncomingLike && !isLiked ? (
                        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
                          1
                        </span>
                      ) : null}
                    </span>
                    {likeState.loading
                      ? t('studio.common.processing')
                      : isLiked
                        ? t('studio.match.actions.unlike')
                        : t('studio.match.actions.like')}
                  </button>

                  <button
                    type="button"
                    onClick={openProfileDetails}
                    disabled={lockedByActiveMatch}
                    className="app-btn w-full disabled:opacity-60"
                    title={t('studio.match.actions.profileDetails')}
                  >
                    <User className="mr-2 h-5 w-5" />
                    {t('studio.match.actions.profileDetails')}
                  </button>
                </div>
              </>
            )}
          </div>

          {longChatAllowedHere && !activeChatNoticeSeen ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs font-semibold text-emerald-900">
              {t('studio.match.banners.activeChatStarted')}
            </div>
          ) : null}
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

    {lightbox.open ? (
      <ImageLightbox
        images={lightbox.images}
        currentIndex={lightbox.index}
        onClose={() => setLightbox({ open: false, images: [], index: 0 })}
      />
    ) : null}
    </>
  );
}
