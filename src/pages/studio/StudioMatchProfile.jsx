import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Lock, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import EmojiPicker from '../../components/EmojiPicker';
import { useAuth } from '../../auth/AuthProvider';
import { db } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';
import { translateStudioApiError } from '../../utils/studioErrorI18n';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNumber(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function joinList(v) {
  if (!Array.isArray(v)) return '';
  return v.map((x) => String(x || '').trim()).filter(Boolean).join(', ');
}

function normalizeEnumValue(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  // snake_case -> camelCase (business_owner -> businessOwner)
  return s.replace(/_([a-z])/g, (_, c) => String(c).toUpperCase());
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

function InfoRow({ label, value }) {
  const v = value === null || value === undefined ? '' : String(value).trim();
  if (!v) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap break-words">{v}</p>
    </div>
  );
}

function fmtRemainingMs(ms, t) {
  const x = Math.max(0, ms);
  const totalMin = Math.ceil(x / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return t('studio.matchProfile.time.minutes', { minutes: m });
  if (m <= 0) return t('studio.matchProfile.time.hours', { hours: h });
  return t('studio.matchProfile.time.hm', { hours: h, minutes: m });
}

const ACTIVE_CANCEL_COOLDOWN_MS = 2 * 60 * 60 * 1000;

function friendlyErrorMessage(raw, t) {
  const s = safeStr(raw);
  if (!s) return '';
  return translateStudioApiError(t, s);
}

export default function StudioMatchProfile() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const uid = safeStr(user?.uid);
  const mid = safeStr(matchId);

  const targetLang = useMemo(() => {
    const raw = String(i18n?.language || 'tr');
    const base = raw.split('-')[0];
    return base || 'tr';
  }, [i18n?.language]);

  const [match, setMatch] = useState(null);
  const [matchLoading, setMatchLoading] = useState(true);
  const [myLock, setMyLock] = useState({ active: false, matchId: '' });

  const [myMembership, setMyMembership] = useState({ active: false });

  const [paywallNotice, setPaywallNotice] = useState('');

  const asMs = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v && typeof v.toMillis === 'function') return v.toMillis();
    if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
    return 0;
  };

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const [sendText, setSendText] = useState('');
  const [sendState, setSendState] = useState({ loading: false, error: '' });

  const [shortModalOpen, setShortModalOpen] = useState(false);
  const [shortText, setShortText] = useState('');
  const [shortState, setShortState] = useState({ loading: false, error: '' });

  const [activeStartState, setActiveStartState] = useState({ loading: false, error: '' });
  const [activeStartNotice, setActiveStartNotice] = useState('');
  const [translateState, setTranslateState] = useState({ loadingId: '', error: '' });

  const [profileOpen, setProfileOpen] = useState(false);
  const [profilePhotoIndex, setProfilePhotoIndex] = useState(0);
  const [profileReloadKey, setProfileReloadKey] = useState(0);

  const [fullProfile, setFullProfile] = useState(null);
  const [fullProfileState, setFullProfileState] = useState({ loading: false, error: '' });

  const [profileAccessReq, setProfileAccessReq] = useState({ loading: false, error: '', status: '' });

  const scrollRef = useRef(null);
  const shortScrollRef = useRef(null);
  const profileRef = useRef(null);
  const chatSectionRef = useRef(null);
  const sendInputRef = useRef(null);
  const shortTextareaRef = useRef(null);

  useEffect(() => {
    if (!mid) return;

    setMatchLoading(true);
    const ref = doc(db, 'matchmakingMatches', mid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setMatch(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setMatchLoading(false);
      },
      () => {
        setMatch(null);
        setMatchLoading(false);
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [mid]);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'matchmakingUsers', uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.exists() ? snap.data() || {} : {};
        const lock = d?.matchmakingLock && typeof d.matchmakingLock === 'object' ? d.matchmakingLock : null;
        const active = !!lock?.active;
        const matchId2 = typeof lock?.matchId === 'string' ? safeStr(lock.matchId) : '';
        setMyLock({ active, matchId: matchId2 });

        const membershipObj = d?.membership && typeof d.membership === 'object' ? d.membership : null;
        const membershipValidUntilMs = asMs(membershipObj?.validUntilMs);
        const now = Date.now();
        const membershipActive =
          (membershipValidUntilMs > 0 && membershipValidUntilMs > now) ||
          (!!membershipObj?.active && (!membershipValidUntilMs || membershipValidUntilMs > now));
        setMyMembership({ active: membershipActive });
      },
      () => {
        setMyLock({ active: false, matchId: '' });
        setMyMembership({ active: false });
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [uid]);

  useEffect(() => {
    if (!mid) return;

    setMessagesLoading(true);
    const q = query(collection(db, 'matchmakingMatches', mid, 'messages'), orderBy('createdAt', 'asc'), limit(120));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setMessages(items);
        setMessagesLoading(false);
      },
      () => {
        setMessages([]);
        setMessagesLoading(false);
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [mid]);

  useEffect(() => {
    try {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch {
      // noop
    }
  }, [messages.length]);

  useEffect(() => {
    if (!shortModalOpen) return;
    try {
      const el = shortScrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch {
      // noop
    }
  }, [shortModalOpen, messages.length]);

  const matchStatus = safeStr(match?.status);

  const isParticipant = useMemo(() => {
    if (!uid || !match) return false;
    const aId = safeStr(match?.aUserId);
    const bId = safeStr(match?.bUserId);
    if (aId && aId === uid) return true;
    if (bId && bId === uid) return true;
    const ids = Array.isArray(match?.userIds) ? match.userIds.map((x) => safeStr(x)).filter(Boolean) : [];
    return ids.includes(uid);
  }, [match, uid]);

  const mySide = useMemo(() => {
    if (!uid || !match) return '';
    const aId = safeStr(match?.aUserId);
    const bId = safeStr(match?.bUserId);
    if (aId && aId === uid) return 'a';
    if (bId && bId === uid) return 'b';
    return '';
  }, [match, uid]);

  const other = useMemo(() => {
    if (!match || !mySide) return null;
    const otherSide = mySide === 'a' ? 'b' : 'a';
    const p = match?.profiles?.[otherSide] && typeof match.profiles[otherSide] === 'object' ? match.profiles[otherSide] : {};
    return p;
  }, [match, mySide]);

  const otherUid = useMemo(() => {
    if (!match || !mySide) return '';
    const otherSide = mySide === 'a' ? 'b' : 'a';
    const aId = safeStr(match?.aUserId);
    const bId = safeStr(match?.bUserId);
    return otherSide === 'a' ? aId : bId;
  }, [match, mySide]);

  // Match dokümanındaki `profiles` alanı intentionally minimal (server-side). Tam profil için endpoint.
  const otherMerged = useMemo(() => {
    const base = other && typeof other === 'object' ? other : {};
    const full = fullProfile && typeof fullProfile === 'object' ? fullProfile : null;
    if (!full) return base;
    const baseDetails = base?.details && typeof base.details === 'object' ? base.details : {};
    const fullDetails = full?.details && typeof full.details === 'object' ? full.details : {};
    return { ...base, ...full, details: { ...baseDetails, ...fullDetails } };
  }, [fullProfile, other]);

  const otherName = safeStr(otherMerged?.username) || t('studio.common.profile');
  const otherAge = asNumber(otherMerged?.age);
  const otherCity = safeStr(otherMerged?.city);
  const otherCountry = safeStr(otherMerged?.country);
  const otherPhoto = Array.isArray(otherMerged?.photoUrls) && otherMerged.photoUrls.length ? safeStr(otherMerged.photoUrls[0]) : '';
  const otherVerified = !!otherMerged?.identityVerified;

  const otherOccupation = safeStr(otherMerged?.details?.occupation || otherMerged?.occupation);
  const otherHasChildrenRaw = safeStr(otherMerged?.details?.hasChildren);
  const otherChildrenCount = typeof otherMerged?.details?.childrenCount === 'number' ? otherMerged.details.childrenCount : null;
  const otherChildrenLiving = safeStr(otherMerged?.details?.childrenLivingSituation);
  const otherAbout = safeStr(otherMerged?.about || otherMerged?.bio || otherMerged?.details?.about || otherMerged?.details?.bio);
  const otherExpectations = safeStr(otherMerged?.expectations || otherMerged?.details?.expectations);

  const otherPhotos = useMemo(() => {
    const list = Array.isArray(otherMerged?.photoUrls) ? otherMerged.photoUrls : [];
    return list.map((x) => safeStr(x)).filter(Boolean).slice(0, 3);
  }, [otherMerged]);

  useEffect(() => {
    setProfilePhotoIndex(0);
  }, [mid]);

  const unreadCount = useMemo(() => {
    if (!match || !uid) return 0;
    const m = match?.chatUnreadByUid && typeof match.chatUnreadByUid === 'object' ? match.chatUnreadByUid : {};
    const n = typeof m?.[uid] === 'number' ? m[uid] : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [match, uid]);

  const isActiveMatchForMe = !!myLock?.active && !!myLock?.matchId && myLock.matchId === mid;
  const lockedByOtherActiveMatch = !!myLock?.active && !!myLock?.matchId && myLock.matchId !== mid;
  const longChatAllowed = isParticipant && isActiveMatchForMe && (matchStatus === 'mutual_accepted' || matchStatus === 'contact_unlocked');

  useEffect(() => {
    if (!longChatAllowed) return;
    setActiveStartNotice('');
    setTimeout(() => {
      try {
        chatSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      } catch {
        // noop
      }
      try {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      } catch {
        // noop
      }
      try {
        sendInputRef.current?.focus?.();
      } catch {
        // noop
      }
    }, 0);
  }, [longChatAllowed]);

  // Not: Match snapshot minimal; tam profil erişimini server endpoint belirler.
  const canSeeFullProfiles = !!fullProfile;
  const canInteract = isParticipant;

  const tOption = (group, rawValue) => {
    const value = normalizeEnumValue(rawValue);
    if (!value) return '';
    const key = `matchmakingPage.form.options.${group}.${value}`;
    const label = t(key);
    return label && label !== key ? label : String(rawValue || '');
  };

  const tYesNoCommon = (rawValue) => {
    const s = String(rawValue || '').trim().toLowerCase();
    if (s === 'yes' || s === 'true' || s === '1') return t('matchmakingPage.form.options.common.yes');
    if (s === 'no' || s === 'false' || s === '0') return t('matchmakingPage.form.options.common.no');
    if (s === 'unsure') return t('matchmakingPage.form.options.common.unsure');
    return rawValue === true
      ? t('matchmakingPage.form.options.common.yes')
      : rawValue === false
        ? t('matchmakingPage.form.options.common.no')
        : String(rawValue || '');
  };

  const genderLabel = useMemo(() => tOption('gender', otherMerged?.gender), [otherMerged?.gender, t]);
  const nationalityLabel = useMemo(() => tOption('nationality', otherMerged?.nationality), [otherMerged?.nationality, t]);
  const educationLabel = useMemo(
    () => tOption('education', otherMerged?.details?.education || otherMerged?.education),
    [otherMerged?.details?.education, otherMerged?.education, t]
  );
  const occupationLabel = useMemo(
    () => tOption('occupation', otherMerged?.details?.occupation || otherMerged?.occupation),
    [otherMerged?.details?.occupation, otherMerged?.occupation, t]
  );
  const religionLabel = useMemo(
    () => tOption('religion', otherMerged?.details?.religion || otherMerged?.religion),
    [otherMerged?.details?.religion, otherMerged?.religion, t]
  );
  const incomeLabel = useMemo(() => tOption('income', otherMerged?.details?.incomeLevel), [otherMerged?.details?.incomeLevel, t]);
  const timelineLabel = useMemo(
    () => tOption('timeline', otherMerged?.details?.marriageTimeline),
    [otherMerged?.details?.marriageTimeline, t]
  );
  const familyApprovalLabel = useMemo(
    () => tOption('familyApproval', otherMerged?.details?.familyApprovalStatus),
    [otherMerged?.details?.familyApprovalStatus, t]
  );
  const preferredLivingCountryLabel = useMemo(
    () => tOption('livingCountry', otherMerged?.details?.preferredLivingCountry),
    [otherMerged?.details?.preferredLivingCountry, t]
  );
  const commLanguageLabel = useMemo(
    () => tOption('commLanguage', otherMerged?.details?.communicationLanguage),
    [otherMerged?.details?.communicationLanguage, t]
  );
  const hasChildrenLabel = useMemo(
    () => tYesNoCommon(otherMerged?.details?.hasChildren),
    [otherMerged?.details?.hasChildren, t]
  );
  const childrenLivingSituationLabel = useMemo(
    () => tOption('childrenLivingSituation', otherMerged?.details?.childrenLivingSituation),
    [otherMerged?.details?.childrenLivingSituation, t]
  );
  const smokingLabel = useMemo(() => tYesNoCommon(otherMerged?.details?.smoking), [otherMerged?.details?.smoking, t]);
  const alcoholLabel = useMemo(() => tYesNoCommon(otherMerged?.details?.alcohol), [otherMerged?.details?.alcohol, t]);
  const relocationLabel = useMemo(
    () => tYesNoCommon(otherMerged?.details?.relocationWillingness) || safeStr(otherMerged?.details?.relocationWillingness),
    [otherMerged?.details?.relocationWillingness, t]
  );

  const nativeLanguageLabel = useMemo(() => {
    const languages = otherMerged?.details?.languages && typeof otherMerged.details.languages === 'object' ? otherMerged.details.languages : {};
    const native = languages?.native && typeof languages.native === 'object' ? languages.native : {};
    const code = safeStr(native?.code || otherMerged?.details?.nativeLanguage);
    const otherText = safeStr(native?.other || otherMerged?.details?.nativeLanguageOther);
    if (!code) return '';
    if (code === 'other') return otherText;
    return tOption('commLanguage', code) || code;
  }, [otherMerged, t]);

  const foreignLanguagesLabel = useMemo(() => {
    const languages = otherMerged?.details?.languages && typeof otherMerged.details.languages === 'object' ? otherMerged.details.languages : {};
    const native = languages?.native && typeof languages.native === 'object' ? languages.native : {};
    const foreign = languages?.foreign && typeof languages.foreign === 'object' ? languages.foreign : {};
    const nativeCode = safeStr(native?.code);
    const foreignOther = safeStr(foreign?.other || otherMerged?.details?.foreignLanguageOther);
    const codes = Array.isArray(foreign?.codes)
      ? foreign.codes.map((x) => safeStr(x)).filter(Boolean)
      : Array.isArray(otherMerged?.details?.foreignLanguages)
        ? otherMerged.details.foreignLanguages.map((x) => safeStr(x)).filter(Boolean)
        : [];
    const labels = codes
      .filter((c) => c && c !== nativeCode)
      .map((c) => (c === 'other' ? foreignOther : tOption('commLanguage', c) || c))
      .filter(Boolean);
    return labels.length ? labels.join(', ') : '';
  }, [otherMerged, t]);

  const requirePaid = () => {
    setPaywallNotice(t('studio.paywall.upgradeToInteract'));
  };

  const visibleOtherPhotos = useMemo(() => {
    const list = Array.isArray(otherPhotos) ? otherPhotos : [];
    return list.slice(0, canSeeFullProfiles ? 3 : 1);
  }, [canSeeFullProfiles, otherPhotos]);

  const maritalRaw = safeStr(otherMerged?.details?.maritalStatus || otherMerged?.maritalStatus);
  const maritalKey = maritalStatusToKey(maritalRaw);
  const maritalLabel = maritalKey ? t(maritalKey) : maritalRaw;
  const isSingleMarital = maritalRaw === 'single';

  useEffect(() => {
    if (!profileOpen) return;
    if (!uid || !mid) return;

    let alive = true;
    setFullProfileState({ loading: true, error: '' });

    (async () => {
      try {
        const data = await authFetch('/api/matchmaking-profile', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ matchId: mid }),
        });

        if (!alive) return;
        const p = data && typeof data === 'object' ? data.profile : null;
        if (!p || typeof p !== 'object') {
          setFullProfile(null);
          setFullProfileState({ loading: false, error: 'profile_missing' });
          return;
        }
        setFullProfile(p);
        setFullProfileState({ loading: false, error: '' });
      } catch (e) {
        if (!alive) return;
        const msg = safeStr(e?.message) || 'membership_required';
        setFullProfile(null);
        setFullProfileState({ loading: false, error: msg });

        // no_access: paywall değil; CTA ile izin isteme akışı.
        if (msg !== 'no_access') {
          const friendly = friendlyErrorMessage(msg, t);
          if (friendly) setPaywallNotice(friendly);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [mid, profileOpen, profileReloadKey, t, uid]);

  const requestProfileAccess = async () => {
    if (!uid || !otherUid) return;
    if (profileAccessReq.loading) return;
    setProfileAccessReq({ loading: true, error: '', status: '' });
    try {
      const data = await authFetch('/api/matchmaking-profile-access-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetUid: otherUid }),
      });
      const status = safeStr(data?.status) || 'pending';
      setProfileAccessReq({ loading: false, error: '', status });
      if (status === 'granted' || status === 'approved') {
        setProfileReloadKey((k) => k + 1);
      }
    } catch (e) {
      const msg = safeStr(e?.message) || 'request_failed';
      setProfileAccessReq({ loading: false, error: translateStudioApiError(t, msg) || msg, status: '' });
    }
  };

  const shortLimitInfo = useMemo(() => {
    const limit = 5;
    if (!uid || !match) return { used: 0, remaining: limit, limit };

    if (matchStatus === 'proposed') {
      const counts = match?.proposedChatCountByUid && typeof match.proposedChatCountByUid === 'object' ? match.proposedChatCountByUid : {};
      const used = typeof counts?.[uid] === 'number' ? counts[uid] : 0;
      const u = Number.isFinite(used) && used > 0 ? used : 0;
      return { used: u, remaining: Math.max(0, limit - u), limit };
    }

    const counts = match?.limitedChatCountByUid && typeof match.limitedChatCountByUid === 'object' ? match.limitedChatCountByUid : {};
    const used = typeof counts?.[uid] === 'number' ? counts[uid] : 0;
    const u = Number.isFinite(used) && used > 0 ? used : 0;
    return { used: u, remaining: Math.max(0, limit - u), limit };
  }, [match, matchStatus, uid]);

  const activeSinceMs = useMemo(() => {
    const v1 = typeof match?.chatEnabledAtMs === 'number' ? match.chatEnabledAtMs : 0;
    const v2 = typeof match?.mutualAcceptedAtMs === 'number' ? match.mutualAcceptedAtMs : 0;
    return (Number.isFinite(v1) && v1 > 0 ? v1 : 0) || (Number.isFinite(v2) && v2 > 0 ? v2 : 0) || 0;
  }, [match]);

  const cancelCooldownRemainingMs = useMemo(() => {
    if (!activeSinceMs) return 0;
    const elapsed = Date.now() - activeSinceMs;
    return elapsed < ACTIVE_CANCEL_COOLDOWN_MS ? ACTIVE_CANCEL_COOLDOWN_MS - elapsed : 0;
  }, [activeSinceMs]);

  const decisions = match?.decisions && typeof match.decisions === 'object' ? match.decisions : {};
  const myDecision = mySide ? safeStr(decisions?.[mySide]) : '';
  const otherDecision = mySide ? safeStr(decisions?.[mySide === 'a' ? 'b' : 'a']) : '';
  const mutualLiked = myDecision === 'accept' && otherDecision === 'accept';

  const activeStartByUid = match?.activeStartByUid && typeof match.activeStartByUid === 'object' ? match.activeStartByUid : {};
  const iStarted = !!(uid && activeStartByUid?.[uid]);

  const openShortModal = async () => {
    if (!uid || !mid) return;
    if (lockedByOtherActiveMatch) {
      setShortState({ loading: false, error: t('studio.errors.activeLocked') });
      return;
    }
    setShortModalOpen(true);
    setShortText('');
    setShortState({ loading: false, error: '' });
    try {
      await authFetch('/api/matchmaking-chat-mark-read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid }),
      });
    } catch {
      // noop
    }
  };

  const sendShort = async (e) => {
    e?.preventDefault?.();
    const text = safeStr(shortText);
    if (!uid || !mid || !text) return;

    if (!canInteract) return;
    if (shortState.loading) return;

    setShortState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-chat-send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid, text }),
      });
      setShortText('');
      setShortState({ loading: false, error: '' });
    } catch (err) {
      const msg = safeStr(err?.message);
      if (msg === 'short_message_limit' || msg === 'chat_limit_reached') {
        setShortState({ loading: false, error: t('studio.errors.shortLimit') });
      } else {
        setShortState({ loading: false, error: friendlyErrorMessage(msg, t) || 'send_failed' });
      }
    }
  };

  const sendLong = async (e) => {
    e?.preventDefault?.();
    const text = safeStr(sendText);
    if (!uid || !mid || !text) return;
    if (!longChatAllowed || sendState.loading) return;

    if (!canInteract) return;

    setSendState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-chat-send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid, text }),
      });
      setSendText('');
      setSendState({ loading: false, error: '' });
      try {
        await authFetch('/api/matchmaking-chat-mark-read', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ matchId: mid }),
        });
      } catch {
        // noop
      }
    } catch (err) {
      setSendState({ loading: false, error: safeStr(err?.message) || 'send_failed' });
    }
  };

  const translateMessage = async ({ messageId }) => {
    const msgId = safeStr(messageId);
    if (!uid || !mid || !msgId) return;
    if (translateState.loadingId) return;

    setTranslateState({ loadingId: msgId, error: '' });
    try {
      await authFetch('/api/matchmaking-chat-translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid, messageId: msgId, targetLang }),
      });
      setTranslateState({ loadingId: '', error: '' });
    } catch (e) {
      setTranslateState({ loadingId: '', error: safeStr(e?.message) || 'translate_failed' });
    }
  };

  const startActive = async () => {
    if (!uid || !mid) return;
    if (lockedByOtherActiveMatch) {
      setActiveStartState({ loading: false, error: t('studio.matchProfile.errors.activeStartLocked') });
      return;
    }

    if (!canInteract) return;
    if (activeStartState.loading) return;

    const ok = typeof window !== 'undefined' ? window.confirm(t('studio.matchProfile.activeStart.confirmPrompt')) : true;
    if (!ok) return;

    setActiveStartState({ loading: true, error: '' });
    setActiveStartNotice('');
    try {
      const data = await authFetch('/api/matchmaking-active-start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid }),
      });

      const activated = !!data?.activated;

      // activated=true => backend match status + lock set etti. UI’da anında uzun sohbet alanını aç.
      if (activated) {
        const ts = Date.now();
        setMyLock({ active: true, matchId: mid });
        setMatch((m) => {
          if (!m || typeof m !== 'object') return m;
          return {
            ...m,
            status: 'mutual_accepted',
            chatEnabledAtMs: typeof m?.chatEnabledAtMs === 'number' ? m.chatEnabledAtMs : ts,
          };
        });
        setActiveStartNotice(t('studio.matchProfile.activeStart.activatedNotice'));
      } else {
        setActiveStartNotice(t('studio.matchProfile.activeStart.waitingNotice'));
      }

      setActiveStartState({ loading: false, error: '' });
    } catch (e) {
      setActiveStartState({ loading: false, error: friendlyErrorMessage(e?.message, t) || 'active_start_failed' });
    }
  };

  useEffect(() => {
    if (!mid || !uid) return;
    // Profile sayfası açılınca unread söndür.
    authFetch('/api/matchmaking-chat-mark-read', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ matchId: mid }),
    }).catch(() => undefined);
  }, [mid, uid]);

  const [cancelState, setCancelState] = useState({ loading: false, error: '' });
  const activeCancelByUid = match?.activeCancelByUid && typeof match.activeCancelByUid === 'object' ? match.activeCancelByUid : {};
  const iCancelled = !!(uid && activeCancelByUid?.[uid]);

  const cancelActiveMutual = async () => {
    if (!uid || !mid) return;
    if (!isActiveMatchForMe) return;
    if (cancelCooldownRemainingMs > 0) return;
    if (cancelState.loading) return;

    const ok = typeof window !== 'undefined' ? window.confirm(t('studio.matchProfile.cancel.confirmPrompt')) : true;
    if (!ok) return;

    setCancelState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-active-cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid }),
      });
      setCancelState({ loading: false, error: '' });
    } catch (e) {
      setCancelState({ loading: false, error: friendlyErrorMessage(e?.message, t) || 'cancel_failed' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-6">
        {paywallNotice ? (
          <div className="mb-4 mx-auto max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{t('studio.paywall.upgradeTitle')}</p>
              <button
                type="button"
                onClick={() => setPaywallNotice('')}
                className="rounded-md px-2 py-1 text-sm font-semibold text-amber-900/70 hover:bg-amber-100"
              >
                {t('studio.common.close')}
              </button>
            </div>
            <p className="mt-1 text-sm text-amber-900/80">{paywallNotice}</p>
            <div className="mt-3">
              <Link to="/profilim" className="text-sm font-semibold underline">
                {t('studio.paywall.upgradeCta')}
              </Link>
            </div>
          </div>
        ) : null}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link to="/app/matches" className="text-sm font-semibold text-emerald-700 hover:underline">
            {t('studio.chat.backToMatches')}
          </Link>
          <Link to="/profilim" className="text-sm font-semibold text-slate-700 hover:underline">
            {t('studio.common.profile')}
          </Link>
        </div>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-start gap-4">
              {visibleOtherPhotos.length ? (
                <img
                  src={visibleOtherPhotos[Math.min(profilePhotoIndex, visibleOtherPhotos.length - 1)]}
                  alt={t('studio.match.avatarAlt', { name: otherName })}
                  className="h-16 w-16 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : otherPhoto ? (
                <img
                  src={otherPhoto}
                  alt={t('studio.match.avatarAlt', { name: otherName })}
                  className="h-16 w-16 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-slate-200" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xl font-semibold">{otherName}{otherAge ? `, ${otherAge}` : ''}</p>
                  {otherVerified ? <ShieldCheck className="h-5 w-5 text-emerald-600" title={t('studio.common.verified')} /> : null}
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  {(() => {
                    if (!otherCity && !otherCountry) return ' ';
                    if (!canSeeFullProfiles) return maritalLabel || ' ';
                    return [otherCity, otherCountry].filter(Boolean).join(' • ') || ' ';
                  })()}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openShortModal}
                    disabled={lockedByOtherActiveMatch}
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t('studio.matchProfile.askShort')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen((p) => {
                        const next = !p;
                        if (next) {
                          setTimeout(() => {
                            try {
                              profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } catch {
                              // noop
                            }
                          }, 0);
                        }
                        return next;
                      });
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    {profileOpen ? t('studio.matchProfile.hideProfile') : t('studio.matchProfile.viewProfile')}
                  </button>

                  {matchStatus === 'mutual_interest' && mutualLiked ? (
                    <button
                      type="button"
                      onClick={startActive}
                      disabled={activeStartState.loading}
                      className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      {activeStartState.loading
                        ? t('studio.matchProfile.activeStart.starting')
                        : iStarted
                          ? t('studio.matchProfile.activeStart.waiting')
                          : t('studio.matchProfile.activeStart.start')}
                    </button>
                  ) : null}

                  {activeStartState.error ? <div className="text-sm text-rose-700">{activeStartState.error}</div> : null}
                  {activeStartNotice ? <div className="text-sm text-emerald-700">{activeStartNotice}</div> : null}
                </div>

                {matchLoading ? <p className="mt-2 text-sm text-slate-500">{t('studio.chat.matchLoading')}</p> : null}
                {!matchLoading && !match ? <p className="mt-2 text-sm text-rose-600">{t('studio.chat.matchNotFound')}</p> : null}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold">{t('studio.matchProfile.rulesTitle')}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>{t('studio.matchProfile.rules.likeFirst')}</li>
                <li>{t('studio.matchProfile.rules.startActive')}</li>
                <li>{t('studio.matchProfile.rules.onlyOneActive')}</li>
                <li>{t('studio.matchProfile.rules.unlockAfterCancel')}</li>
              </ul>
            </div>

            {profileOpen ? (
              <div ref={profileRef} className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{t('studio.matchProfile.profileTitle')}</p>
                  <p className="text-xs text-slate-600">{t('studio.matchProfile.contactHidden')}</p>
                </div>

                {!canSeeFullProfiles ? (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    {fullProfileState.loading ? (
                      <p className="text-sm text-slate-600">{t('studio.common.loading')}</p>
                    ) : fullProfileState.error === 'no_access' ? (
                      <>
                        <p className="text-sm text-slate-700">
                          Detay profili görmek için karşı taraftan izin almalısın.
                        </p>

                        {profileAccessReq.error ? <p className="mt-2 text-sm text-rose-700">{profileAccessReq.error}</p> : null}
                        {profileAccessReq.status ? (
                          <p className="mt-2 text-xs text-slate-600">Durum: {profileAccessReq.status}</p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={requestProfileAccess}
                            disabled={profileAccessReq.loading || !otherUid}
                            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {profileAccessReq.loading ? t('studio.common.processing') : 'İzin iste'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setProfileReloadKey((k) => k + 1)}
                            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                          >
                            Tekrar dene
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-slate-600">
                          Detaylar için karşı tarafın onayı gerekebilir.
                        </p>
                        <button
                          type="button"
                          onClick={() => setProfileReloadKey((k) => k + 1)}
                          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                        >
                          Yenile
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                {visibleOtherPhotos.length ? (
                  <div className="relative mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <img
                      src={visibleOtherPhotos[Math.min(profilePhotoIndex, visibleOtherPhotos.length - 1)]}
                      alt={t('studio.match.avatarAlt', { name: otherName })}
                      className="h-64 w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />

                    {visibleOtherPhotos.length > 1 ? (
                      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-1">
                        {visibleOtherPhotos.map((_, idx) => (
                          <span
                            key={idx}
                            className={
                              'h-1.5 w-1.5 rounded-full transition ' +
                              (idx === profilePhotoIndex ? 'bg-white shadow' : 'bg-white/60')
                            }
                          />
                        ))}
                      </div>
                    ) : null}

                    {visibleOtherPhotos.length > 1 ? (
                      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
                        <button
                          type="button"
                          onClick={() => setProfilePhotoIndex((p) => (p - 1 + visibleOtherPhotos.length) % visibleOtherPhotos.length)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white shadow-sm transition hover:bg-black/55"
                          aria-label={t('studio.matchProfile.prevPhoto')}
                          title={t('studio.matchProfile.prevPhoto')}
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfilePhotoIndex((p) => (p + 1) % visibleOtherPhotos.length)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white shadow-sm transition hover:bg-black/55"
                          aria-label={t('studio.matchProfile.nextPhoto')}
                          title={t('studio.matchProfile.nextPhoto')}
                        >
                          ›
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow label={t('studio.myInfo.fields.username')} value={safeStr(otherMerged?.username)} />
                  <InfoRow label={t('studio.myInfo.fields.age')} value={otherAge === null ? '' : String(otherAge)} />
                  <InfoRow label={t('studio.myInfo.fields.maritalStatus')} value={maritalLabel} />

                  {/* Önizleme alanları (full profile gerekmez) */}
                  <InfoRow label={t('studio.myInfo.fields.city')} value={otherCity} />
                  {otherOccupation ? <InfoRow label={t('studio.myInfo.fields.occupation')} value={otherOccupation} /> : null}
                  {!isSingleMarital && otherHasChildrenRaw === 'yes' ? (
                    <InfoRow
                      label={t('studio.myInfo.fields.hasChildren')}
                      value={`${tYesNoCommon(otherHasChildrenRaw)}${otherChildrenCount !== null ? ` (${otherChildrenCount})` : ''}${(() => {
                        const living = safeStr(childrenLivingSituationLabel) || otherChildrenLiving;
                        if (living) return ` • ${living}`;
                        return otherHasChildrenRaw === 'yes' ? ` • ${t('studio.common.unknown')}` : '';
                      })()}`}
                    />
                  ) : null}

                  {otherAbout ? <InfoRow label={t('studio.myInfo.fields.about')} value={otherAbout} /> : null}
                  {otherExpectations ? <InfoRow label={t('studio.myInfo.fields.expectations')} value={otherExpectations} /> : null}

                  {canSeeFullProfiles ? (
                    <>
                      <InfoRow label={t('studio.myInfo.fields.gender')} value={safeStr(genderLabel) || safeStr(otherMerged?.gender)} />
                      <InfoRow label={t('studio.myInfo.fields.nationality')} value={safeStr(nationalityLabel) || safeStr(otherMerged?.nationality)} />
                      <InfoRow label={t('studio.myInfo.fields.country')} value={safeStr(otherMerged?.country)} />
                      <InfoRow label={t('studio.myInfo.fields.heightCm')} value={safeStr(otherMerged?.details?.heightCm)} />
                      <InfoRow label={t('studio.myInfo.fields.weightKg')} value={safeStr(otherMerged?.details?.weightKg)} />
                      <InfoRow label={t('studio.myInfo.fields.education')} value={safeStr(educationLabel) || safeStr(otherMerged?.details?.education)} />
                      <InfoRow label={t('studio.myInfo.fields.educationDepartment')} value={safeStr(otherMerged?.details?.educationDepartment)} />
                      {/* occupation artık önizleme alanında gösteriliyor; burada tekrar etmiyoruz */}
                      <InfoRow label={t('studio.myInfo.fields.religion')} value={safeStr(religionLabel) || safeStr(otherMerged?.details?.religion)} />
                      <InfoRow label={t('studio.myInfo.fields.religiousValues')} value={safeStr(otherMerged?.details?.religiousValues)} />
                      {/* hasChildren artık önizleme alanında gösteriliyor; burada tekrar etmiyoruz */}
                      {String(otherMerged?.details?.hasChildren || '').trim() === 'yes' ? (
                        <>
                          <InfoRow label={t('studio.myInfo.fields.childrenCount')} value={safeStr(otherMerged?.details?.childrenCount)} />
                          {(() => {
                            const v = safeStr(childrenLivingSituationLabel) || safeStr(otherMerged?.details?.childrenLivingSituation);
                            return v ? <InfoRow label={t('studio.myInfo.fields.childrenLivingSituation')} value={v} /> : null;
                          })()}
                        </>
                      ) : null}
                      <InfoRow label={t('studio.myInfo.fields.familyApprovalStatus')} value={safeStr(familyApprovalLabel) || safeStr(otherMerged?.details?.familyApprovalStatus)} />
                      <InfoRow label={t('studio.myInfo.fields.incomeLevel')} value={safeStr(incomeLabel) || safeStr(otherMerged?.details?.incomeLevel)} />
                      <InfoRow label={t('studio.myInfo.fields.marriageTimeline')} value={safeStr(timelineLabel) || safeStr(otherMerged?.details?.marriageTimeline)} />
                      <InfoRow label={t('studio.myInfo.fields.relocationWillingness')} value={safeStr(relocationLabel) || safeStr(otherMerged?.details?.relocationWillingness)} />
                      <InfoRow label={t('studio.myInfo.fields.preferredLivingCountry')} value={safeStr(preferredLivingCountryLabel) || safeStr(otherMerged?.details?.preferredLivingCountry)} />
                      <InfoRow label={t('studio.myInfo.fields.communicationLanguage')} value={safeStr(commLanguageLabel) || safeStr(otherMerged?.details?.communicationLanguage)} />
                      <InfoRow label={t('studio.myInfo.fields.communicationLanguageOther')} value={safeStr(otherMerged?.details?.communicationLanguageOther)} />
                      <InfoRow label={t('studio.myInfo.fields.smoking')} value={safeStr(smokingLabel) || safeStr(otherMerged?.details?.smoking)} />
                      <InfoRow label={t('studio.myInfo.fields.alcohol')} value={safeStr(alcoholLabel) || safeStr(otherMerged?.details?.alcohol)} />
                      <InfoRow
                        label={t('studio.myInfo.fields.nativeLanguage')}
                        value={safeStr(nativeLanguageLabel) || safeStr(otherMerged?.details?.languages?.native?.code || otherMerged?.details?.nativeLanguage)}
                      />
                      <InfoRow
                        label={t('studio.myInfo.fields.foreignLanguages')}
                        value={safeStr(foreignLanguagesLabel) || joinList(otherMerged?.details?.languages?.foreign?.codes || otherMerged?.details?.foreignLanguages)}
                      />
                      <InfoRow
                        label={t('studio.myInfo.fields.foreignLanguageOther')}
                        value={safeStr(otherMerged?.details?.languages?.foreign?.other || otherMerged?.details?.foreignLanguageOther)}
                      />
                      {/* about/expectations artık önizleme alanında gösteriliyor; burada tekrar etmiyoruz */}
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}

            {isActiveMatchForMe && (matchStatus === 'mutual_accepted' || matchStatus === 'contact_unlocked') ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="font-semibold text-rose-900">{t('studio.matchProfile.cancel.title')}</p>
                <p className="mt-1 text-sm text-rose-900/80">{t('studio.matchProfile.cancel.desc')}</p>
                {cancelCooldownRemainingMs > 0 ? (
                  <p className="mt-2 text-sm text-rose-900/80">
                    {t('studio.matchProfile.cancel.cooldown', { time: fmtRemainingMs(cancelCooldownRemainingMs, t) })}
                  </p>
                ) : null}
                {cancelState.error ? <div className="mt-2 text-sm text-rose-700">{cancelState.error}</div> : null}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelActiveMutual}
                    disabled={cancelState.loading || cancelCooldownRemainingMs > 0}
                    className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
                  >
                    {cancelState.loading
                      ? t('studio.common.processing')
                      : iCancelled
                        ? t('studio.matchProfile.cancel.requestSent')
                        : t('studio.matchProfile.cancel.request')}
                  </button>
                  {iCancelled ? <span className="text-sm text-rose-700">{t('studio.matchProfile.cancel.waitingOther')}</span> : null}
                </div>
              </div>
            ) : null}

            {matchStatus === 'mutual_interest' && mutualLiked ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <p className="font-semibold">{t('studio.matchProfile.mutualLike.title')}</p>
                <p className="mt-1 text-emerald-900/80">{t('studio.matchProfile.mutualLike.body')}</p>
              </div>
            ) : null}

            {!longChatAllowed ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-semibold">{t('studio.matchProfile.longChatClosedTitle')}</p>
                    <p className="mt-1 text-slate-600">{t('studio.matchProfile.longChatClosedBody')}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      {t('studio.matches.shortModal.remaining', { remaining: shortLimitInfo.remaining, limit: shortLimitInfo.limit })}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Long chat area (only active match) */}
          {longChatAllowed ? (
            <div ref={chatSectionRef} className="p-4">
              <div ref={scrollRef} className="h-[52vh] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                {messagesLoading ? <p className="text-sm text-slate-500">{t('studio.chat.messagesLoading')}</p> : null}
                {!messagesLoading && Array.isArray(messages) && messages.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('studio.chat.noMessages')}</p>
                ) : null}

                {translateState.error ? (
                  <p className="mt-2 text-sm text-rose-700">{t('studio.matches.shortModal.translateError', { error: translateState.error })}</p>
                ) : null}

                <div className="space-y-3">
                  {(Array.isArray(messages) ? messages : []).map((m) => {
                    const fromMe = !!uid && safeStr(m?.userId) === uid;
                    const text = safeStr(m?.text);
                    if (!text) return null;

                    // Long chat alanında short mesajları göstermeyelim.
                    const isShort = safeStr(m?.chatMode) === 'short';
                    if (isShort) return null;

                    const translated =
                      m?.translations && typeof m.translations === 'object'
                        ? safeStr(m.translations?.[targetLang])
                        : '';

                    return (
                      <div key={m.id} className={`flex items-end gap-2 ${fromMe ? 'justify-end' : 'justify-start'}`}>
                        {!fromMe ? (
                          otherPhoto ? (
                            <img src={otherPhoto} alt={otherName} className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-slate-200" />
                          )
                        ) : null}

                        <div
                          className={
                            'max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm ' +
                            (fromMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-slate-900 rounded-bl-none')
                          }
                        >
                          {text}
                          {!fromMe ? (
                            <div className="mt-2 flex items-center justify-between gap-2">
                              {translated ? <div className="text-xs text-slate-600">{targetLang.toUpperCase()}: {translated}</div> : <span />}
                              <button
                                type="button"
                                onClick={() => translateMessage({ messageId: m.id })}
                                disabled={translateState.loadingId === m.id}
                                className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-60"
                              >
                                {translateState.loadingId === m.id
                                  ? t('studio.matches.shortModal.translating')
                                  : t('studio.matches.shortModal.translate')}
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {fromMe ? <div className="h-7 w-7 rounded-full bg-emerald-100" title={t('studio.chat.you')} /> : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {sendState.error ? (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {t('studio.chat.sendFailed', { error: sendState.error })}
                </div>
              ) : null}

              <form onSubmit={sendLong} className="mt-3 flex items-center gap-2">
                <EmojiPicker
                  disabled={sendState.loading}
                  ariaLabel={t('studio.chat.emoji')}
                  onSelect={(emoji) => {
                    setSendText((p) => `${String(p || '')}${emoji}`);
                    setTimeout(() => {
                      try {
                        sendInputRef.current?.focus?.();
                      } catch {
                        // noop
                      }
                    }, 0);
                  }}
                />
                <input
                  ref={sendInputRef}
                  value={sendText}
                  onChange={(e) => setSendText(e.target.value)}
                  placeholder={t('studio.chat.inputPlaceholderLong')}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  autoComplete="off"
                  maxLength={600}
                />
                <button
                  type="submit"
                  disabled={!safeStr(sendText) || sendState.loading}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {sendState.loading ? t('studio.common.processing') : t('studio.common.send')}
                </button>
              </form>
            </div>
          ) : null}
        </div>

        {/* Short message modal */}
        {shortModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t('studio.matchProfile.shortModal.title')}</p>
                  <p className="text-xs text-slate-500">{t('studio.matches.shortModal.subtitle')}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {t('studio.matches.shortModal.remaining', { remaining: shortLimitInfo.remaining, limit: shortLimitInfo.limit })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShortModalOpen(false)}
                  className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t('studio.common.close')}
                </button>
              </div>

              <div className="p-4 pt-3">
                <div ref={shortScrollRef} className="h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="space-y-2">
                    {(Array.isArray(messages) ? messages : [])
                      .filter((m) => String(m?.text || '').trim())
                      .filter((m) => String(m?.chatMode || '') === 'short')
                      .slice(-40)
                      .map((m) => {
                        const fromMe = !!uid && safeStr(m?.userId) === uid;
                        const translated =
                          m?.translations && typeof m.translations === 'object'
                            ? safeStr(m.translations?.[targetLang])
                            : '';
                        return (
                          <div key={m.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={
                                'max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ' +
                                (fromMe ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900')
                              }
                            >
                              {safeStr(m?.text)}
                              {!fromMe ? (
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  {translated ? <div className="text-xs text-slate-600">{targetLang.toUpperCase()}: {translated}</div> : <span />}
                                  <button
                                    type="button"
                                    onClick={() => translateMessage({ messageId: m.id })}
                                    disabled={translateState.loadingId === m.id}
                                    className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-60"
                                  >
                                    {translateState.loadingId === m.id
                                      ? t('studio.matches.shortModal.translating')
                                      : t('studio.matches.shortModal.translate')}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {messagesLoading ? <p className="mt-2 text-sm text-slate-500">{t('studio.common.loading')}</p> : null}
                  {!messagesLoading && (!Array.isArray(messages) || messages.length === 0) ? (
                    <p className="text-sm text-slate-500">{t('studio.matches.shortModal.noMessages')}</p>
                  ) : null}

                  {translateState.error ? (
                    <p className="mt-2 text-sm text-rose-700">{t('studio.matches.shortModal.translateError', { error: translateState.error })}</p>
                  ) : null}
                </div>
              </div>

              <form onSubmit={sendShort} className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-600">{t('studio.chat.emojiHint')}</p>
                  <EmojiPicker
                    disabled={shortState.loading || shortLimitInfo.remaining <= 0}
                    ariaLabel={t('studio.chat.emoji')}
                    onSelect={(emoji) => {
                      setShortText((p) => `${String(p || '')}${emoji}`);
                      setTimeout(() => {
                        try {
                          shortTextareaRef.current?.focus?.();
                        } catch {
                          // noop
                        }
                      }, 0);
                    }}
                  />
                </div>
                <textarea
                  ref={shortTextareaRef}
                  value={shortText}
                  onChange={(e) => setShortText(e.target.value)}
                  rows={4}
                  maxLength={240}
                  placeholder={t('studio.matches.shortModal.placeholder')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />

                {shortState.error ? <div className="mt-2 text-sm text-rose-700">{shortState.error}</div> : null}

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShortModalOpen(false)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                  >
                    {t('studio.common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={shortState.loading || !safeStr(shortText) || shortLimitInfo.remaining <= 0}
                    className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {shortState.loading ? t('studio.common.processing') : t('studio.common.send')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
