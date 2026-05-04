import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocFromServer, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Lock, Send, ShieldCheck, Share2, Unlock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import EmojiPicker from '../../components/EmojiPicker';
import { useAuth } from '../../auth/AuthProvider';
import { db } from '../../config/firebaseDb';
import { authFetch } from '../../utils/authFetch';
import { normalizePhoneForWhatsApp } from '../../utils/phone';
import { translateStudioApiError } from '../../utils/studioErrorI18n';
import StudioBottomNav from '../../components/studio/StudioBottomNav';
import { isTutorialActive } from '../../utils/tutorialState.js';
import { formatDateTimeFromMs, formatRelativeTimeFromMs, timestampToMs } from '../../utils/relativeTime';
import {
  hasAnyMatchmakingPhotoInApplicationDoc,
  hasAnyStoredMatchmakingPhotoInApplicationDoc,
  hasAnyMatchmakingPhotoInUserDoc,
  hasAnyMatchmakingProfileInApplicationDoc,
  hasAnyMatchmakingProfileInUserDoc,
  hasMinimumMatchmakingProfileInUserDoc,
  isDeferredPhotoInteractionRequiredFromUserDoc,
  isDeferredWhatsappInteractionRequiredFromUserDoc,
} from '../../utils/matchmakingProfileCompletion';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

function extractSharedContactsFromMessage(message) {
  const contact = safeObj(message?.contact);
  const createdAtMs = typeof message?.createdAtMs === 'number' && Number.isFinite(message.createdAtMs) ? message.createdAtMs : 0;
  const items = [];

  const sharedByUid = safeStr(contact?.sharedByUid);
  const sharedWhatsapp = safeStr(contact?.sharedWhatsapp);
  if (sharedByUid && sharedWhatsapp) {
    items.push({ userId: sharedByUid, whatsapp: sharedWhatsapp, createdAtMs, messageId: safeStr(message?.id) });
    return items;
  }

  const aUserId = safeStr(contact?.aUserId);
  const aWhatsapp = safeStr(contact?.aWhatsapp);
  const bUserId = safeStr(contact?.bUserId);
  const bWhatsapp = safeStr(contact?.bWhatsapp);

  if (aUserId && aWhatsapp) items.push({ userId: aUserId, whatsapp: aWhatsapp, createdAtMs, messageId: safeStr(message?.id) });
  if (bUserId && bWhatsapp) items.push({ userId: bUserId, whatsapp: bWhatsapp, createdAtMs, messageId: safeStr(message?.id) });
  return items;
}

function messageDayKeyUtc(ms) {
  if (!ms || !Number.isFinite(ms)) return '';
  try {
    return new Date(ms).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function getContactShareActivityStats(messages, userIds) {
  const participants = Array.isArray(userIds) ? userIds.map((x) => safeStr(x)).filter(Boolean).slice(0, 2) : [];
  const perUserMessageCount = Object.fromEntries(participants.map((id) => [id, 0]));
  const perDayByUid = {};

  (Array.isArray(messages) ? messages : []).forEach((message) => {
    if (safeStr(message?.type) === 'system') return;
    const senderUid = safeStr(message?.userId);
    if (!participants.includes(senderUid)) return;
    const text = safeStr(message?.text);
    if (!text) return;
    const createdAtMs = typeof message?.createdAtMs === 'number' && Number.isFinite(message.createdAtMs) ? message.createdAtMs : 0;
    if (!createdAtMs) return;

    perUserMessageCount[senderUid] = (typeof perUserMessageCount[senderUid] === 'number' ? perUserMessageCount[senderUid] : 0) + 1;

    const dayKey = messageDayKeyUtc(createdAtMs);
    if (!dayKey) return;
    if (!perDayByUid[dayKey]) {
      perDayByUid[dayKey] = Object.fromEntries(participants.map((id) => [id, 0]));
    }
    perDayByUid[dayKey][senderUid] += 1;
  });

  const participantDayCount = Object.values(perDayByUid).filter((dayCounts) => participants.every((id) => (dayCounts?.[id] || 0) > 0)).length;
  const minMessagesPerUser = 5;
  const minParticipantDays = 2;
  const eligible =
    participants.length === 2 &&
    participantDayCount >= minParticipantDays &&
    participants.every((id) => (perUserMessageCount?.[id] || 0) >= minMessagesPerUser);

  return {
    eligible,
    participantDayCount,
    minParticipantDays,
    minMessagesPerUser,
    perUserMessageCount,
  };
}

const OPEN_CHAT_MODEL = true;

function isMinimumProfileCompleteFromUserDoc(d) {
  return hasMinimumMatchmakingProfileInUserDoc(d);
}

function isDebugApiEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    try {
      if (window.localStorage && (window.localStorage.getItem('debugApi') === '1' || window.localStorage.getItem('debugApi') === 'true')) {
        return true;
      }
    } catch {
      // ignore
    }
    const sp = new URLSearchParams(window.location.search);
    return sp.get('debugApi') === '1' || sp.get('debugPush') === '1';
  } catch {
    return false;
  }
}

export default function StudioChat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [matchLoading, setMatchLoading] = useState(true);
  const [myProfileComplete, setMyProfileComplete] = useState(true);
  const [myMembership, setMyMembership] = useState({ active: false });
  const [myHasAnyPhoto, setMyHasAnyPhoto] = useState(null);
  const [myHasAnyApplication, setMyHasAnyApplication] = useState(null);
  const [myHasAnyPhotoFromUserDoc, setMyHasAnyPhotoFromUserDoc] = useState(null);
  const [myHasAnyApplicationFromUserDoc, setMyHasAnyApplicationFromUserDoc] = useState(null);
  const [deferredPhotoGateActive, setDeferredPhotoGateActive] = useState(false);
  const [deferredWhatsappGateActive, setDeferredWhatsappGateActive] = useState(false);
  const [paywallNotice, setPaywallNotice] = useState('');
  const [profileGateNotice, setProfileGateNotice] = useState('');
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [sendText, setSendText] = useState('');
  const [sendState, setSendState] = useState({ loading: false, error: '' });

  const [myCommLanguage, setMyCommLanguage] = useState('');

  const [translateState, setTranslateState] = useState({ loadingId: '', error: '' });

  const [confirmState, setConfirmState] = useState({ loading: false, error: '' });
  const [contactRequestState, setContactRequestState] = useState({ loading: false, error: '' });
  const [contactApproveState, setContactApproveState] = useState({ loading: false, error: '' });
  const [contactContinueState, setContactContinueState] = useState({ loading: false, error: '' });
  const [blockState, setBlockState] = useState({ loading: false, error: '' });
  const [cancelState, setCancelState] = useState({ loading: false, error: '' });

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const [nowTickMs, setNowTickMs] = useState(() => Date.now());

  const [lockPanelExpanded, setLockPanelExpanded] = useState(false);

  const activateMembershipRef = useRef(false);
  const paywallAutoActivateRef = useRef(false);

  const uid = String(user?.uid || '').trim();
  const mid = String(matchId || '').trim();

  const uiLang = useMemo(() => {
    const raw = String(i18n?.language || 'tr');
    const base = raw.split('-')[0];
    return base || 'tr';
  }, [i18n?.language]);

  const translateTargetStorageKey = useMemo(() => {
    if (!uid || !mid) return '';
    return `studio_chat_translate_target:${uid}:${mid}`;
  }, [mid, uid]);

  const normalizeTranslateTarget = (raw) => {
    const s = String(raw || '').trim().toLowerCase();
    if (s === 'tr' || s === 'id' || s === 'en') return s;
    return '';
  };

  const [translateTargetLang, setTranslateTargetLang] = useState('');
  useEffect(() => {
    // Default: my communication language; allow override via localStorage
    const fallback = normalizeTranslateTarget(myCommLanguage) || normalizeTranslateTarget(uiLang) || 'tr';
    if (!translateTargetStorageKey) {
      setTranslateTargetLang(fallback);
      return;
    }
    try {
      const saved = normalizeTranslateTarget(window.localStorage.getItem(translateTargetStorageKey));
      setTranslateTargetLang(saved || fallback);
    } catch {
      setTranslateTargetLang(fallback);
    }
  }, [myCommLanguage, translateTargetStorageKey, uiLang]);

  const effectiveTargetLang = normalizeTranslateTarget(translateTargetLang) || normalizeTranslateTarget(uiLang) || 'tr';

  const asMs = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v && typeof v.toMillis === 'function') return v.toMillis();
    if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
    return 0;
  };

  const requirePaid = () => {
    setPaywallNotice(t('studio.paywall.upgradeToInteract'));
    try {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // noop
    }
  };

  const effectiveHasAnyApplication = useMemo(() => {
    if (myHasAnyApplication === true || myHasAnyApplicationFromUserDoc === true) return true;
    if (myHasAnyApplication === false && myHasAnyApplicationFromUserDoc === false) return false;
    return myHasAnyApplication ?? myHasAnyApplicationFromUserDoc;
  }, [myHasAnyApplication, myHasAnyApplicationFromUserDoc]);

  const effectiveHasAnyPhoto = useMemo(() => {
    if (myHasAnyPhoto === true || myHasAnyPhotoFromUserDoc === true) return true;
    if (myHasAnyPhoto === false && myHasAnyPhotoFromUserDoc === false) return false;
    return myHasAnyPhoto ?? myHasAnyPhotoFromUserDoc;
  }, [myHasAnyPhoto, myHasAnyPhotoFromUserDoc]);

  const profileGateMode = useMemo(() => {
    if (deferredPhotoGateActive) return 'deferred_photo';
    if (deferredWhatsappGateActive) return 'deferred_whatsapp';
    if (effectiveHasAnyApplication === false) return 'application';
    return '';
  }, [deferredPhotoGateActive, deferredWhatsappGateActive, effectiveHasAnyApplication]);

  const profileGateCta = useMemo(() => {
    if (profileGateMode === 'deferred_photo') return t('studio.profileGate.photoCta');
    if (profileGateMode === 'deferred_whatsapp') return t('studio.profileGate.deferredWhatsappPrimaryCta');
    return t('studio.profileGate.cta');
  }, [profileGateMode, t]);

  const goToProfileCompletionTarget = () => {
    if (profileGateMode === 'deferred_photo') {
      try {
        navigate('/profilim', { replace: false, state: { openPhotoManager: true, profileGate: 'deferred_photo_required' } });
      } catch {
        // noop
      }
      return;
    }

    if (profileGateMode === 'deferred_whatsapp') {
      try {
        navigate('/profilim', { replace: false, state: { profileGate: 'deferred_whatsapp_required' } });
      } catch {
        // noop
      }
      return;
    }

    try {
      navigate('/evlilik/eslestirme-basvuru?w=1', {
        replace: false,
        state: { returnTo: `/app/chat/${String(matchId || '').trim()}` },
      });
    } catch {
      // noop
    }
  };

  useEffect(() => {
    if (!isTutorialActive()) return;
    if (!profileGateNotice) return;
    const id = setTimeout(() => setProfileGateNotice(''), 3000);
    return () => {
      try {
        clearTimeout(id);
      } catch {
        // noop
      }
    };
  }, [profileGateNotice]);

  const deferredPhotoRedirectRef = useRef(false);
  useEffect(() => {
    if (!deferredPhotoGateActive) {
      deferredPhotoRedirectRef.current = false;
      return;
    }
    if (deferredPhotoRedirectRef.current) return;
    deferredPhotoRedirectRef.current = true;
    setProfileGateNotice(t('studio.profileGate.deferredPhotoBody'));
    goToProfileCompletionTarget();
  }, [deferredPhotoGateActive, t]);

  const deferredWhatsappRedirectRef = useRef(false);
  useEffect(() => {
    if (!deferredWhatsappGateActive) {
      deferredWhatsappRedirectRef.current = false;
      return;
    }
    if (deferredWhatsappRedirectRef.current) return;
    deferredWhatsappRedirectRef.current = true;
    setProfileGateNotice(t('studio.profileGate.deferredWhatsappBody'));
    goToProfileCompletionTarget();
  }, [deferredWhatsappGateActive, t]);

  const activateFreeMembershipNow = useCallback(async () => {
    if (!uid) return;
    if (activateMembershipRef.current) return;
    activateMembershipRef.current = true;

    try {
      await authFetch('/api/matchmaking-membership-activate-free', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      setMyMembership({ active: true });
      setPaywallNotice('');
    } catch (e) {
      const msg = String(e?.message || '').trim() || 'membership_activate_failed';
      setPaywallNotice(translateStudioApiError(t, msg) || msg);
    } finally {
      activateMembershipRef.current = false;
    }
  }, [t, uid]);

  useEffect(() => {
    if (!paywallNotice) {
      paywallAutoActivateRef.current = false;
      return;
    }
    if (paywallAutoActivateRef.current) return;
    paywallAutoActivateRef.current = true;
    void activateFreeMembershipNow();
  }, [activateFreeMembershipNow, paywallNotice]);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'matchmakingUsers', uid);

    let cancelled = false;
    (async () => {
      try {
        let snap;
        try {
          snap = await getDocFromServer(ref);
        } catch {
          snap = await getDoc(ref);
        }
        if (cancelled) return;
        const d = snap?.exists?.() ? snap.data() || {} : {};

        const membershipObj = d?.membership && typeof d.membership === 'object' ? d.membership : null;
        const membershipValidUntilMs = asMs(membershipObj?.validUntilMs);
        const now = Date.now();
        const membershipActive =
          (membershipValidUntilMs > 0 && membershipValidUntilMs > now) ||
          (!!membershipObj?.active && (!membershipValidUntilMs || membershipValidUntilMs > now));
        setMyMembership({ active: membershipActive });

        setMyProfileComplete(isMinimumProfileCompleteFromUserDoc(d));
        setMyHasAnyApplicationFromUserDoc(hasAnyMatchmakingProfileInUserDoc(d));
        setMyHasAnyPhotoFromUserDoc(hasAnyMatchmakingPhotoInUserDoc(d));
        setDeferredPhotoGateActive(isDeferredPhotoInteractionRequiredFromUserDoc(d));

        setMyCommLanguage(String(d?.details?.communicationLanguage || '').trim());
      } catch {
        // best-effort
      }
    })();

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.exists() ? snap.data() || {} : {};
        const membershipObj = d?.membership && typeof d.membership === 'object' ? d.membership : null;
        const membershipValidUntilMs = asMs(membershipObj?.validUntilMs);
        const now = Date.now();
        const membershipActive =
          (membershipValidUntilMs > 0 && membershipValidUntilMs > now) ||
          (!!membershipObj?.active && (!membershipValidUntilMs || membershipValidUntilMs > now));
        setMyMembership({ active: membershipActive });

        setMyProfileComplete(isMinimumProfileCompleteFromUserDoc(d));
        setMyHasAnyApplicationFromUserDoc(hasAnyMatchmakingProfileInUserDoc(d));
        setMyHasAnyPhotoFromUserDoc(hasAnyMatchmakingPhotoInUserDoc(d));
        setDeferredPhotoGateActive(isDeferredPhotoInteractionRequiredFromUserDoc(d));
        setDeferredWhatsappGateActive(isDeferredWhatsappInteractionRequiredFromUserDoc(d));

        setMyCommLanguage(String(d?.details?.communicationLanguage || '').trim());
      },
      () => {
        setMyProfileComplete(true);
        setMyMembership({ active: false });
        setMyHasAnyPhoto(null);
        setMyHasAnyApplication(null);
        setMyHasAnyPhotoFromUserDoc(null);
        setMyHasAnyApplicationFromUserDoc(null);
        setDeferredPhotoGateActive(false);
        setDeferredWhatsappGateActive(false);
        setMyCommLanguage('');
      }
    );

    return () => {
      cancelled = true;
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setMyHasAnyPhoto(null);
      setMyHasAnyApplication(null);
      setMyHasAnyPhotoFromUserDoc(null);
      setMyHasAnyApplicationFromUserDoc(null);
      return;
    }

    const parseAppsSnap = (snap) => {
      try {
        const ids = [];
        let hasPhoto = false;
        snap.forEach((d) => {
          const data = typeof d?.data === 'function' ? d.data() || {} : d?.data || {};
          if (hasAnyMatchmakingProfileInApplicationDoc(data)) {
            const id = safeStr(d?.id);
            if (id) ids.push(id);
          }
          if (hasAnyStoredMatchmakingPhotoInApplicationDoc(data)) hasPhoto = true;
        });
        return { ids, hasPhoto };
      } catch {
        return null;
      }
    };

    const mergeAndSet = (parts) => {
      const list = Array.isArray(parts) ? parts : [];
      const idSet = new Set();
      let hasPhoto = false;
      for (const part of list) {
        const ids = Array.isArray(part?.ids) ? part.ids : [];
        for (const id of ids) idSet.add(String(id));
        if (part?.hasPhoto) hasPhoto = true;
      }
      setMyHasAnyApplication(idSet.size > 0);
      setMyHasAnyPhoto(!!hasPhoto);
    };

    const qAppsUserId = query(collection(db, 'matchmakingApplications'), where('userId', '==', uid), limit(10));
    const qAppsUid = query(collection(db, 'matchmakingApplications'), where('uid', '==', uid), limit(10));
    const qAppsUserUid = query(collection(db, 'matchmakingApplications'), where('userUid', '==', uid), limit(10));

    let cancelled = false;
    (async () => {
      try {
        const [s1, s2, s3] = await Promise.all([getDocs(qAppsUserId), getDocs(qAppsUid), getDocs(qAppsUserUid)]);
        if (cancelled) return;
        mergeAndSet([parseAppsSnap(s1), parseAppsSnap(s2), parseAppsSnap(s3)].filter(Boolean));
      } catch {
        // ignore
      }
    })();

    const live = { userId: null, uid: null, userUid: null };
    const applyLive = () => mergeAndSet([live.userId, live.uid, live.userUid].filter(Boolean));

    const unsub1 = onSnapshot(
      qAppsUserId,
      (snap) => {
        live.userId = parseAppsSnap(snap);
        applyLive();
      },
      () => {
        live.userId = null;
        applyLive();
      }
    );

    const unsub2 = onSnapshot(
      qAppsUid,
      (snap) => {
        live.uid = parseAppsSnap(snap);
        applyLive();
      },
      () => {
        live.uid = null;
        applyLive();
      }
    );

    const unsub3 = onSnapshot(
      qAppsUserUid,
      (snap) => {
        live.userUid = parseAppsSnap(snap);
        applyLive();
      },
      () => {
        live.userUid = null;
        applyLive();
      }
    );

    return () => {
      cancelled = true;
      try {
        unsub1();
      } catch {
        // noop
      }
      try {
        unsub2();
      } catch {
        // noop
      }
      try {
        unsub3();
      } catch {
        // noop
      }
    };
  }, [uid]);

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
      (e) => {
        console.error('match load failed', e);
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
      (e) => {
        console.error('messages load failed', e);
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
    // Yeni mesaj geldikçe en alta kaydır.
    try {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch {
      // noop
    }
  }, [messages.length]);

  const other = useMemo(() => {
    if (!match || !uid) return null;

    const aId = String(match?.aUserId || '').trim();
    const bId = String(match?.bUserId || '').trim();
    const mySide = aId === uid ? 'a' : bId === uid ? 'b' : '';
    if (!mySide) return null;
    const otherSide = mySide === 'a' ? 'b' : 'a';
    const p = match?.profiles?.[otherSide] && typeof match.profiles[otherSide] === 'object' ? match.profiles[otherSide] : {};
    return p;
  }, [match, uid]);


  const otherName = String(other?.username || t('studio.common.match')).trim();
  const otherPhoto = Array.isArray(other?.photoUrls) && other.photoUrls.length ? String(other.photoUrls[0] || '').trim() : '';
  const otherVerified = !!other?.identityVerified;
  const otherGenderText = useMemo(() => {
    const s = String(other?.gender || '').trim().toLowerCase();
    if (!s) return '';
    if (s === 'female' || s === 'f' || s === 'kadin' || s === 'kadın') return 'Kadın';
    if (s === 'male' || s === 'm' || s === 'erkek') return 'Erkek';
    return '';
  }, [other?.gender]);

  const toMs = (v) => {
    if (!v) return 0;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v?.toMillis === 'function') return v.toMillis();
    if (typeof v?.seconds === 'number') return v.seconds * 1000;
    return 0;
  };

  const lockInfo = useMemo(() => {
    const nowMs = Date.now();

    const baseMs =
      (typeof match?.chatEnabledAtMs === 'number' ? match.chatEnabledAtMs : 0) ||
      (typeof match?.mutualAcceptedAtMs === 'number' ? match.mutualAcceptedAtMs : 0) ||
      toMs(match?.chatEnabledAt) ||
      toMs(match?.interactionChosenAt) ||
      toMs(match?.mutualAcceptedAt) ||
      0;

    const lockMs = 48 * 60 * 60 * 1000;
    const unlockAtMs = baseMs ? baseMs + lockMs : 0;
    const remainingMs = unlockAtMs ? Math.max(0, unlockAtMs - nowMs) : 0;
    const unlocked = unlockAtMs ? remainingMs === 0 : false;

    const confirmedAtMs =
      (typeof match?.confirmedAtMs === 'number' ? match.confirmedAtMs : 0) ||
      toMs(match?.confirmedAt) ||
      0;

    const confirmations = match?.confirmations && typeof match.confirmations === 'object' ? match.confirmations : {};
    const aUid = String(match?.aUserId || '').trim();
    const bUid = String(match?.bUserId || '').trim();
    const side = uid && aUid === uid ? 'a' : uid && bUid === uid ? 'b' : '';
    const myConfirmed = side ? !!confirmations?.[side] : false;
    const otherConfirmed = side ? !!confirmations?.[side === 'a' ? 'b' : 'a'] : false;
    const bothConfirmed = myConfirmed && otherConfirmed;

    const contactShare = match?.contactShare && typeof match.contactShare === 'object' ? match.contactShare : null;
    const contactStatus = contactShare ? String(contactShare?.status || '').trim() : '';
    const requestedByUid = contactShare ? String(contactShare?.requestedByUid || '').trim() : '';
    const userIds = Array.isArray(match?.userIds) ? match.userIds.map(String).filter(Boolean) : [];
    const otherUid = userIds.find((x) => x && x !== uid) || '';
    const sharedByUid = safeObj(contactShare?.sharedByUid);
    const continueChatByUid = safeObj(contactShare?.continueChatByUid);
    const legacyApproved = contactStatus === 'approved';
    const myShared = legacyApproved || !!safeStr(sharedByUid?.[uid]?.whatsapp);
    const otherShared = legacyApproved || !!safeStr(sharedByUid?.[otherUid]?.whatsapp);
    const myContinue = !!continueChatByUid?.[uid];
    const otherContinue = !!continueChatByUid?.[otherUid];

    const h = Math.floor(remainingMs / 3600000);
    const m = Math.floor((remainingMs % 3600000) / 60000);

    return {
      baseMs,
      unlockAtMs,
      remainingMs,
      remainingHours: h,
      remainingMinutes: m,
      unlocked,
      confirmedAtMs,
      myConfirmed,
      otherConfirmed,
      bothConfirmed,
      isConfirmed: confirmedAtMs > 0,
      contactStatus,
      requestedByUid,
      otherUid,
      myShared,
      otherShared,
      myContinue,
      otherContinue,
    };
  }, [match, uid]);

  const contactInfo = useMemo(() => {
    const byUid = {};
    const setEntry = (userId, whatsapp, createdAtMs = 0, source = '') => {
      const cleanUid = safeStr(userId);
      const cleanWhatsapp = safeStr(whatsapp);
      if (!cleanUid || !cleanWhatsapp) return;
      const ts = typeof createdAtMs === 'number' && Number.isFinite(createdAtMs) ? createdAtMs : 0;
      const prev = byUid?.[cleanUid];
      if (prev && (prev.createdAtMs || 0) > ts) return;
      const digits = normalizePhoneForWhatsApp(cleanWhatsapp);
      byUid[cleanUid] = {
        userId: cleanUid,
        whatsapp: cleanWhatsapp,
        digits,
        waUrl: digits ? `https://wa.me/${digits}` : '',
        createdAtMs: ts,
        source,
      };
    };

    (Array.isArray(messages) ? messages : [])
      .filter((m) => m?.type === 'system' && safeStr(m?.systemType) === 'contact_shared')
      .forEach((m) => {
        extractSharedContactsFromMessage(m).forEach((entry) => {
          setEntry(entry.userId, entry.whatsapp, entry.createdAtMs, 'message');
        });
      });

    const sharedByUid = safeObj(match?.contactShare?.sharedByUid);
    Object.entries(sharedByUid).forEach(([userId, rawEntry]) => {
      const entry = safeObj(rawEntry);
      setEntry(userId, entry?.whatsapp, entry?.sharedAtMs, 'match');
    });

    const userIds = Array.isArray(match?.userIds) ? match.userIds.map(String).filter(Boolean) : [];
    const otherUid = userIds.find((x) => x && x !== uid) || '';

    return {
      byUid,
      otherUid,
      myEntry: uid ? byUid?.[uid] || null : null,
      otherEntry: otherUid ? byUid?.[otherUid] || null : null,
    };
  }, [match?.contactShare, match?.userIds, messages, uid]);

  const contactActivity = useMemo(
    () => getContactShareActivityStats(messages, Array.isArray(match?.userIds) ? match.userIds : []),
    [match?.userIds, messages]
  );

  const actionOtherUid = contactInfo?.otherUid || lockInfo.otherUid || '';

  const complaintHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set('kind', 'complaint');
    if (mid) params.set('matchId', mid);
    params.set('step', 'contact_share');
    if (actionOtherUid) params.set('aboutUserId', actionOtherUid);
    return `/profilim/destek?${params.toString()}`;
  }, [actionOtherUid, mid]);

  const matchStatus = String(match?.status || '').trim();
  const isParticipant = useMemo(() => {
    if (!uid || !match) return false;
    const aId = String(match?.aUserId || '').trim();
    const bId = String(match?.bUserId || '').trim();
    if (aId && aId === uid) return true;
    if (bId && bId === uid) return true;
    const arr = Array.isArray(match?.userIds) ? match.userIds.map((x) => String(x || '').trim()).filter(Boolean) : [];
    return arr.includes(uid);
  }, [match, uid]);

  const chatStatusAllowed =
    matchStatus === 'proposed' ||
    matchStatus === 'mutual_interest' ||
    matchStatus === 'mutual_accepted' ||
    matchStatus === 'contact_unlocked';
  const isActiveMatchForMe = isParticipant && (matchStatus === 'mutual_accepted' || matchStatus === 'contact_unlocked');

  const longChatAllowed = OPEN_CHAT_MODEL
    ? isParticipant && chatStatusAllowed
    : isActiveMatchForMe;
  const shortChatAllowed = OPEN_CHAT_MODEL ? false : isParticipant && chatStatusAllowed && !longChatAllowed;

  const shortLimitPerUid = useMemo(() => {
    if (!match) return 5;
    if (matchStatus === 'proposed') {
      const n = typeof match?.proposedChatLimitPerUid === 'number' ? match.proposedChatLimitPerUid : 5;
      return Number.isFinite(n) && n > 0 ? n : 5;
    }
    const n = typeof match?.limitedChatLimitPerUid === 'number' ? match.limitedChatLimitPerUid : 5;
    return Number.isFinite(n) && n > 0 ? n : 5;
  }, [match, matchStatus]);

  const shortUsedByMe = useMemo(() => {
    if (!match || !uid) return 0;
    if (matchStatus === 'proposed') {
      const m = match?.proposedChatCountByUid && typeof match.proposedChatCountByUid === 'object' ? match.proposedChatCountByUid : {};
      const n = typeof m?.[uid] === 'number' ? m[uid] : 0;
      return Number.isFinite(n) && n >= 0 ? n : 0;
    }
    const m = match?.limitedChatCountByUid && typeof match.limitedChatCountByUid === 'object' ? match.limitedChatCountByUid : {};
    const n = typeof m?.[uid] === 'number' ? m[uid] : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [match, matchStatus, uid]);

  const shortRemaining = Math.max(0, shortLimitPerUid - shortUsedByMe);
  const canSend =
    (longChatAllowed || shortChatAllowed) &&
    !sendState.loading &&
    !!String(sendText || '').trim() &&
    (OPEN_CHAT_MODEL || longChatAllowed || shortRemaining > 0);

  const canConfirm =
    !!uid && !!mid && !confirmState.loading && !!match && (String(match?.status || '').trim() === 'mutual_accepted' || String(match?.status || '').trim() === 'contact_unlocked') && lockInfo.unlocked && !lockInfo.myConfirmed;
  const canShareMyContact =
    !!uid &&
    !!mid &&
    !contactRequestState.loading &&
    !!match &&
    (String(match?.status || '').trim() === 'mutual_accepted' || String(match?.status || '').trim() === 'contact_unlocked') &&
    lockInfo.unlocked &&
    lockInfo.isConfirmed &&
    contactActivity.eligible &&
    !lockInfo.myShared;
  const canKeepChatOnsite =
    !!uid &&
    !!mid &&
    !contactContinueState.loading &&
    !!match &&
    (String(match?.status || '').trim() === 'mutual_accepted' || String(match?.status || '').trim() === 'contact_unlocked') &&
    lockInfo.unlocked &&
    lockInfo.isConfirmed &&
    !lockInfo.myContinue;

  const activeCancelByUid = match?.activeCancelByUid && typeof match.activeCancelByUid === 'object' ? match.activeCancelByUid : {};
  const iCancelled = !!(uid && activeCancelByUid?.[uid]);

  const cancelCooldownRemainingMs = useMemo(() => {
    if (!match) return 0;
    const baseMs =
      (typeof match?.chatEnabledAtMs === 'number' && Number.isFinite(match.chatEnabledAtMs) ? match.chatEnabledAtMs : 0) ||
      (typeof match?.mutualAcceptedAtMs === 'number' && Number.isFinite(match.mutualAcceptedAtMs) ? match.mutualAcceptedAtMs : 0) ||
      0;
    if (!baseMs) return 0;
    const cooldownMs = 2 * 60 * 60 * 1000;
    const untilMs = baseMs + cooldownMs;
    return Math.max(0, untilMs - nowTickMs);
  }, [match, nowTickMs]);

  const cancelCooldownText = useMemo(() => {
    const remainingMin = Math.max(0, Math.ceil((cancelCooldownRemainingMs || 0) / 60000));
    const hours = Math.floor(remainingMin / 60);
    const minutes = remainingMin % 60;
    if (hours <= 0) return t('studio.matchProfile.time.minutes', { minutes: minutes || 1 });
    if (minutes <= 0) return t('studio.matchProfile.time.hours', { hours });
    return t('studio.matchProfile.time.hm', { hours, minutes });
  }, [cancelCooldownRemainingMs, t]);

  useEffect(() => {
    const hasMessages = Array.isArray(messages) && messages.length > 0;
    if (!hasMessages && (!longChatAllowed || cancelCooldownRemainingMs <= 0)) return;
    const timer = setInterval(() => setNowTickMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [cancelCooldownRemainingMs, longChatAllowed, messages]);

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
      const code = String(e?.message || '').trim();
      const friendly = translateStudioApiError(t, code) || code || 'cancel_failed';
      setCancelState({ loading: false, error: friendly });
    }
  };

  const autoTranslateInFlightRef = useRef(false);
  const autoTranslateAttemptedRef = useRef(new Set());

  const translateMessage = async ({ messageId }) => {
    const msgId = String(messageId || '').trim();
    if (!uid || !mid || !msgId) return;
    if (translateState.loadingId) return;

    setTranslateState({ loadingId: msgId, error: '' });
    try {
      await authFetch('/api/matchmaking-chat-translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid, messageId: msgId, targetLang: effectiveTargetLang }),
      });
      setTranslateState({ loadingId: '', error: '' });
    } catch (e) {
      const code = String(e?.message || '').trim();
      const friendly = translateStudioApiError(t, code) || code || 'translate_failed';

      if (isDebugApiEnabled()) {
        const d = e?.details;
        const apiDetails = d?.details && typeof d.details === 'object' ? d.details : null;
        const provider = String(apiDetails?.provider || apiDetails?.providerUsed || '').trim();
        const providerStatus = String(apiDetails?.providerStatus || apiDetails?.providerErrorStatus || '').trim();
        const providerMsg = String(apiDetails?.providerErrorMessage || '').trim();
        const extra = [
          provider ? `provider=${provider}` : '',
          providerStatus ? `status=${providerStatus}` : '',
          providerMsg ? `msg=${providerMsg}` : '',
        ].filter(Boolean).join(' ');

        setTranslateState({ loadingId: '', error: extra ? `${friendly} (${extra})` : friendly });
      } else {
        setTranslateState({ loadingId: '', error: friendly });
      }
    }
  };

  const autoTranslateMessage = useCallback(async ({ messageId }) => {
    const msgId = String(messageId || '').trim();
    if (!uid || !mid || !msgId) return;
    try {
      await authFetch('/api/matchmaking-chat-translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid, messageId: msgId, targetLang: effectiveTargetLang }),
      });
    } catch {
      // silent
    }
  }, [effectiveTargetLang, mid, uid]);

  useEffect(() => {
    if (!uid || !mid) return;
    if (!effectiveTargetLang) return;
    if (messagesLoading) return;
    if (!Array.isArray(messages) || messages.length === 0) return;
    if (autoTranslateInFlightRef.current) return;

    const candidateIds = [];
    for (let i = messages.length - 1; i >= 0 && candidateIds.length < 3; i -= 1) {
      const m = messages[i];
      const msgId = String(m?.id || '').trim();
      if (!msgId) continue;

      const senderUid = String(m?.userId || '').trim();
      if (!senderUid || senderUid === uid) continue; // only incoming

      const text = String(m?.text || '').trim();
      if (!text) continue;

      const existing = m?.translations && typeof m.translations === 'object' ? String(m.translations?.[effectiveTargetLang] || '').trim() : '';
      if (existing) continue;

      const attemptedKey = `${effectiveTargetLang}:${msgId}`;
      if (autoTranslateAttemptedRef.current.has(attemptedKey)) continue;

      candidateIds.push(msgId);
    }

    if (!candidateIds.length) return;

    const timer = setTimeout(() => {
      (async () => {
        if (autoTranslateInFlightRef.current) return;
        autoTranslateInFlightRef.current = true;
        try {
          for (const msgId of candidateIds) {
            const attemptedKey = `${effectiveTargetLang}:${msgId}`;
            autoTranslateAttemptedRef.current.add(attemptedKey);
            // keep set bounded (best-effort)
            if (autoTranslateAttemptedRef.current.size > 800) {
              autoTranslateAttemptedRef.current = new Set(Array.from(autoTranslateAttemptedRef.current).slice(-500));
            }
            await autoTranslateMessage({ messageId: msgId });
          }
        } finally {
          autoTranslateInFlightRef.current = false;
        }
      })();
    }, 350);

    return () => clearTimeout(timer);
  }, [autoTranslateMessage, effectiveTargetLang, messages, messagesLoading, mid, uid]);

  const sendMessage = async (e) => {
    e?.preventDefault?.();
    const text = String(sendText || '').trim();
    if (!uid || !mid || !text) return;
    if (sendState.loading) return;

    // Profile completeness is enforced server-side; client-side cache can be stale.

    // Üyelik aktif değilken kısa mesaj gönderemez (okuma serbest).
    if (shortChatAllowed && !myMembership?.active) {
      requirePaid();
      setSendState({ loading: false, error: t('studio.paywall.upgradeToReply') });
      return;
    }

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
      const msg = String(err?.message || '').trim();
      setSendState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'chat_send_failed' });
    }
  };

  const chatReadMarkedRef = useRef('');
  useEffect(() => {
    const matchId = String(mid || '').trim();
    const currentUid = String(uid || '').trim();
    if (!matchId || !currentUid) return;

    const key = `${currentUid}:${matchId}`;
    if (chatReadMarkedRef.current === key) return;
    chatReadMarkedRef.current = key;

    void (async () => {
      try {
        await authFetch('/api/matchmaking-chat-release-held', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ matchId }),
        });
      } catch {
        // noop
      }

      try {
        await authFetch('/api/matchmaking-chat-mark-read', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ matchId }),
        });
      } catch (error) {
        const msg = String(error?.message || '').trim();
        if (msg === 'deferred_photo_required') {
          setProfileGateNotice(t('studio.profileGate.deferredPhotoBody'));
          goToProfileCompletionTarget();
        } else if (msg === 'deferred_whatsapp_required') {
          setProfileGateNotice(t('studio.profileGate.deferredWhatsappBody'));
          goToProfileCompletionTarget();
        }
      }
    })();
  }, [goToProfileCompletionTarget, mid, t, uid]);

  const confirm48h = async () => {
    if (!uid || !mid) return;
    if (confirmState.loading) return;

    setConfirmState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid }),
      });
      setConfirmState({ loading: false, error: '' });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setConfirmState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'confirm_failed' });
    }
  };

  const requestContact = async () => {
    if (!uid || !mid) return;
    if (contactRequestState.loading) return;

    setContactRequestState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-contact-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid }),
      });
      setContactRequestState({ loading: false, error: '' });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setContactRequestState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'contact_request_failed' });
    }
  };

  const keepChatOnsite = async () => {
    if (!uid || !mid) return;
    if (contactContinueState.loading) return;

    setContactContinueState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-contact-keep-chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid }),
      });
      setContactContinueState({ loading: false, error: '' });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setContactContinueState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'contact_keep_chat_failed' });
    }
  };

  const blockUser = async () => {
    if (!uid || !mid || !actionOtherUid) return;
    if (blockState.loading) return;

    const ok = typeof window !== 'undefined' ? window.confirm(t('studio.chat.lock48h.blockConfirm')) : true;
    if (!ok) return;

    setBlockState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-block-user', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          targetUid: actionOtherUid,
          matchId: mid,
          reason: 'chat_block',
        }),
      });
      setBlockState({ loading: false, error: '' });
      navigate('/app/messages', { replace: true });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setBlockState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'block_user_failed' });
    }
  };

  const approveContact = async () => {
    if (!uid || !mid) return;
    if (contactApproveState.loading) return;

    setContactApproveState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-contact-approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid }),
      });
      setContactApproveState({ loading: false, error: '' });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setContactApproveState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'contact_approve_failed' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-0">
      <Navigation />

      <main className="container mx-auto px-4 py-6">
        {paywallNotice ? (
          <div className="mb-4 mx-auto max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{t('studio.paywall.upgradeTitle')}</p>
              <button
                type="button"
                onClick={() => setPaywallNotice('')}
                className="app-btn app-btn-ghost h-8 px-2 text-xs text-amber-900/80 hover:bg-amber-100"
              >
                <X className="h-4 w-4" />
                {t('studio.common.close')}
              </button>
            </div>
            <p className="mt-1 text-sm text-amber-900/80">{paywallNotice}</p>
          </div>
        ) : null}

        {profileGateNotice ? (
          <div className="mb-4 mx-auto max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{t('studio.profileGate.title')}</p>
              <button
                type="button"
                onClick={() => setProfileGateNotice('')}
                className="app-btn app-btn-ghost h-8 px-2 text-xs text-amber-900/80 hover:bg-amber-100"
              >
                <X className="h-4 w-4" />
                {t('studio.common.close')}
              </button>
            </div>
            <p className="mt-1 text-sm text-amber-900/80">{profileGateNotice}</p>
            <div className="mt-3">
              <button
                type="button"
                onClick={goToProfileCompletionTarget}
                className="app-btn app-btn-primary h-10 px-4"
              >
                <Unlock className="h-4 w-4" />
                {profileGateCta}
              </button>
            </div>
          </div>
        ) : null}
        <div className="sm:hidden sticky top-0 z-20 -mx-4 mb-3 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur">
          <div className="flex items-center gap-2">
            <Link to="/app/matches" className="app-btn app-btn-outline flex-1 justify-center">
              {t('studio.chat.backToMatches')}
            </Link>
            <Link to="/profilim" className="app-btn app-btn-danger flex-1 justify-center">
              {t('studio.matches.backToProfile')}
            </Link>
          </div>
        </div>

        <div className="mb-4 hidden items-center justify-between gap-3 sm:flex">
          <Link to="/app/matches" className="text-sm font-semibold text-emerald-700 hover:underline">
            {t('studio.chat.backToMatches')}
          </Link>
          <Link to="/profilim" className="text-sm font-semibold text-slate-700 hover:underline">
            {t('studio.common.profile')}
          </Link>
        </div>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 p-4">
            {otherPhoto ? (
              <img src={otherPhoto} alt={otherName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-100" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-semibold">{otherName}</p>
                {otherVerified ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    title={t('studio.common.verified')}
                  >
                    <ShieldCheck className="h-[30px] w-[30px] text-emerald-600" aria-hidden="true" />
                    <span className="whitespace-nowrap">{t('studio.common.verified')}</span>
                  </span>
                ) : null}
                {otherGenderText ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {otherGenderText}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm text-slate-500">{t('studio.chat.chatTitle')}</p>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">{t('studio.chat.translateTargetLabel')}</span>
                  <select
                    value={effectiveTargetLang}
                    onChange={(e) => {
                      const next = normalizeTranslateTarget(e.target.value) || 'tr';
                      setTranslateTargetLang(next);
                      try {
                        if (translateTargetStorageKey) window.localStorage.setItem(translateTargetStorageKey, next);
                      } catch {
                        // noop
                      }
                    }}
                    className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 shadow-sm"
                    aria-label={t('studio.chat.translateTargetLabel')}
                  >
                    <option value="tr">{t('matchmakingPage.form.options.commLanguage.tr')}</option>
                    <option value="id">{t('matchmakingPage.form.options.commLanguage.id')}</option>
                    <option value="en">{t('matchmakingPage.form.options.commLanguage.en')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Kısa mesaj modu bilgilendirme */}
          {!OPEN_CHAT_MODEL && shortChatAllowed ? (
            <div className="m-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-900">
              <p className="font-semibold">{t('studio.chat.shortAreaTitle')}</p>
              <p className="mt-1 text-sm text-slate-700">{t('studio.chat.shortAreaDesc')}</p>
              <p className="mt-1 text-sm text-slate-700">
                {t('studio.chat.shortAreaLimit', { limit: shortLimitPerUid, remaining: shortRemaining })}
              </p>
            </div>
          ) : null}

          {/* Studio tarzı 48h / confirm / contact (sadece aktif eşleşmede anlamlı) */}
          {isActiveMatchForMe && longChatAllowed ? (
            <div className="m-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{t('studio.chat.lock48h.title')}</p>
                      <p className="mt-0.5 text-sm text-emerald-900/80">{t('studio.chat.lock48h.subtitle')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLockPanelExpanded((v) => !v)}
                      className="app-btn app-btn-outline h-8 px-2 text-xs shrink-0"
                    >
                      {lockPanelExpanded ? t('studio.common.readLess') : t('studio.common.readMore')}
                    </button>
                  </div>

                  {!lockInfo.unlocked && lockInfo.unlockAtMs ? (
                    <p className="mt-2 text-sm text-emerald-900/80">
                      {t('studio.chat.lock48h.lockedRemaining', {
                        time: t('studio.chat.remainingTime', {
                          hours: lockInfo.remainingHours,
                          minutes: lockInfo.remainingMinutes,
                        }),
                      })}
                    </p>
                  ) : null}

                  {lockInfo.unlocked && lockInfo.isConfirmed && !lockInfo.myShared && !contactInfo?.otherEntry && !contactActivity.eligible ? (
                    <div className="mt-3 rounded-md border border-amber-200 bg-white p-3 text-sm text-amber-900">
                      <p className="font-semibold">{t('studio.chat.lock48h.activityRuleTitle')}</p>
                      <p className="mt-1 text-amber-900/80">
                        {t('studio.chat.lock48h.activityRuleBody', {
                          days: contactActivity.participantDayCount,
                          minDays: contactActivity.minParticipantDays,
                          yourCount: contactActivity.perUserMessageCount?.[uid] || 0,
                          otherCount: contactActivity.perUserMessageCount?.[lockInfo.otherUid] || 0,
                          minMessages: contactActivity.minMessagesPerUser,
                        })}
                      </p>
                    </div>
                  ) : null}

                  {/* Compact status */}
                  <div className="mt-2 text-sm text-emerald-900/80 space-y-1">
                    <div>
                      {t('studio.chat.lock48h.confirmStatusLabel')}{' '}
                      <span className="font-semibold">
                        {lockInfo.isConfirmed
                          ? t('studio.chat.lock48h.confirmStatus.both')
                          : lockInfo.myConfirmed
                            ? t('studio.chat.lock48h.confirmStatus.you')
                            : lockInfo.otherConfirmed
                              ? t('studio.chat.lock48h.confirmStatus.other')
                              : t('studio.chat.lock48h.confirmStatus.none')}
                      </span>
                    </div>
                    <div>
                      {t('studio.chat.lock48h.contactStatusLabel')}{' '}
                      <span className="font-semibold">
                        {lockInfo.myShared && lockInfo.otherShared
                          ? t('studio.chat.lock48h.contactStatus.bothShared')
                          : lockInfo.myShared
                            ? t('studio.chat.lock48h.contactStatus.mineShared')
                            : contactInfo?.otherEntry
                              ? t('studio.chat.lock48h.contactStatus.otherShared')
                              : lockInfo.myContinue
                                ? t('studio.chat.lock48h.contactStatus.continueChat')
                                : lockInfo.contactStatus === 'approved'
                                  ? t('studio.chat.lock48h.contactStatus.approved')
                          : lockInfo.contactStatus === 'pending'
                            ? lockInfo.requestedByUid === uid
                              ? t('studio.chat.lock48h.contactStatus.pendingMine')
                              : t('studio.chat.lock48h.contactStatus.pendingOther')
                            : t('studio.chat.lock48h.contactStatus.closed')}
                      </span>
                    </div>
                  </div>

                  {/* Primary action always visible */}
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    {contactInfo?.otherEntry?.waUrl ? (
                      <a
                        href={contactInfo.otherEntry.waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="app-btn app-btn-primary"
                      >
                        <Share2 className="h-4 w-4" />
                        {t('studio.chat.lock48h.openInWhatsApp')}
                      </a>
                    ) : null}

                    {canShareMyContact ? (
                      <button
                        type="button"
                        onClick={requestContact}
                        disabled={!canShareMyContact}
                        className="app-btn app-btn-primary-light disabled:opacity-60"
                      >
                        <Share2 className="h-4 w-4" />
                        {contactRequestState.loading ? t('studio.chat.lock48h.requesting') : t('studio.chat.lock48h.requestContact')}
                      </button>
                    ) : null}

                    {canKeepChatOnsite ? (
                      <button
                        type="button"
                        onClick={keepChatOnsite}
                        disabled={!canKeepChatOnsite}
                        className="app-btn app-btn-outline disabled:opacity-60"
                      >
                        <Lock className="h-4 w-4" />
                        {contactContinueState.loading ? t('studio.chat.lock48h.keepChatSaving') : t('studio.chat.lock48h.keepChat')}
                      </button>
                    ) : null}

                    {!contactInfo?.otherEntry?.waUrl && !canShareMyContact && !canKeepChatOnsite && canConfirm ? (
                      <button
                        type="button"
                        onClick={confirm48h}
                        disabled={!canConfirm}
                        className="app-btn app-btn-outline disabled:opacity-60"
                      >
                        <Unlock className="h-4 w-4" />
                        {confirmState.loading
                          ? t('studio.chat.lock48h.confirming')
                          : lockInfo.myConfirmed
                            ? t('studio.chat.lock48h.confirmed')
                            : t('studio.chat.lock48h.confirm')}
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <Link to={complaintHref} className="app-btn app-btn-outline">
                      {t('studio.chat.lock48h.reportCta')}
                    </Link>
                    {actionOtherUid ? (
                      <button
                        type="button"
                        onClick={blockUser}
                        disabled={blockState.loading}
                        className="app-btn app-btn-danger disabled:opacity-60"
                      >
                        <X className="h-4 w-4" />
                        {blockState.loading ? t('studio.chat.lock48h.blocking') : t('studio.chat.lock48h.blockCta')}
                      </button>
                    ) : null}
                  </div>

                  {/* Details */}
                  {lockPanelExpanded ? (
                    <>
                      {confirmState.error ? (
                        <div className="mt-3 rounded-md border border-rose-200 bg-white p-2 text-sm text-rose-700">
                          {t('studio.chat.lock48h.confirmError', { error: confirmState.error })}
                        </div>
                      ) : null}
                      {contactRequestState.error ? (
                        <div className="mt-3 rounded-md border border-rose-200 bg-white p-2 text-sm text-rose-700">
                          {t('studio.chat.lock48h.contactRequestError', { error: contactRequestState.error })}
                        </div>
                      ) : null}
                      {contactContinueState.error ? (
                        <div className="mt-3 rounded-md border border-rose-200 bg-white p-2 text-sm text-rose-700">
                          {t('studio.chat.lock48h.keepChatError', { error: contactContinueState.error })}
                        </div>
                      ) : null}
                      {contactApproveState.error ? (
                        <div className="mt-3 rounded-md border border-rose-200 bg-white p-2 text-sm text-rose-700">
                          {t('studio.chat.lock48h.contactApproveError', { error: contactApproveState.error })}
                        </div>
                      ) : null}
                      {blockState.error ? (
                        <div className="mt-3 rounded-md border border-rose-200 bg-white p-2 text-sm text-rose-700">
                          {t('studio.chat.lock48h.blockError', { error: blockState.error })}
                        </div>
                      ) : null}

                      {lockInfo.myShared ? (
                        <div className="mt-3 rounded-md border border-emerald-200 bg-white p-3 text-sm text-emerald-900">
                          {t('studio.chat.lock48h.sharedMineHint')}
                        </div>
                      ) : null}

                      {lockInfo.myContinue ? (
                        <div className="mt-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          {t('studio.chat.lock48h.keepChatHint')}
                        </div>
                      ) : null}

                      {contactInfo?.otherEntry?.digits ? (
                        <div className="mt-3 rounded-md border border-emerald-200 bg-white p-3 text-sm">
                          <p className="font-semibold text-emerald-800">{t('studio.chat.lock48h.whatsappTitle')}</p>
                          <p className="mt-1 text-slate-700">{contactInfo.otherEntry.whatsapp || contactInfo.otherEntry.digits}</p>
                          <p className="mt-2 text-slate-600">{t('studio.chat.lock48h.otherSharedHint')}</p>
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <a
                              href={contactInfo.otherEntry.waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="app-btn app-btn-primary"
                            >
                              <Share2 className="h-4 w-4" />
                              {t('studio.chat.lock48h.openInWhatsApp')}
                            </a>
                            <Link to={complaintHref} className="app-btn app-btn-outline">
                              {t('studio.chat.lock48h.reportCta')}
                            </Link>
                            {actionOtherUid ? (
                              <button
                                type="button"
                                onClick={blockUser}
                                disabled={blockState.loading}
                                className="app-btn app-btn-danger disabled:opacity-60"
                              >
                                <X className="h-4 w-4" />
                                {blockState.loading ? t('studio.chat.lock48h.blocking') : t('studio.chat.lock48h.blockCta')}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {/* Aktif eşleşmeyi bitir (karşılıklı) */}
                      <div className="mt-4 rounded-md border border-emerald-200 bg-white p-3 text-sm">
                        <p className="font-semibold text-emerald-900">{t('studio.matchProfile.cancel.title')}</p>
                        <p className="mt-1 text-emerald-900/80">{t('studio.matchProfile.cancel.desc')}</p>

                        {cancelCooldownRemainingMs > 0 ? (
                          <p className="mt-2 text-emerald-900/80">
                            {t('studio.matchProfile.cancel.cooldown', { time: cancelCooldownText })}
                          </p>
                        ) : iCancelled ? (
                          <p className="mt-2 text-emerald-900/80">{t('studio.matchProfile.cancel.waitingOther')}</p>
                        ) : null}

                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={cancelActiveMutual}
                            disabled={cancelState.loading || cancelCooldownRemainingMs > 0 || iCancelled}
                            className="app-btn app-btn-danger w-full disabled:opacity-60"
                          >
                            {cancelState.loading
                              ? t('studio.matchProfile.cancel.requestSent')
                              : iCancelled
                                ? t('studio.matchProfile.cancel.requestSent')
                                : t('studio.matchProfile.cancel.request')}
                          </button>
                        </div>

                        {cancelState.error ? (
                          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700">
                            {cancelState.error}
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* Messages */}
          <div className="px-4 pb-4">
            <div
              ref={scrollRef}
              className="h-[52vh] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              {matchLoading ? <p className="text-sm text-slate-500">{t('studio.chat.matchLoading')}</p> : null}
              {!matchLoading && !match ? <p className="text-sm text-rose-600">{t('studio.chat.matchNotFound')}</p> : null}

              {messagesLoading ? <p className="text-sm text-slate-500">{t('studio.chat.messagesLoading')}</p> : null}

              {!messagesLoading && Array.isArray(messages) && messages.length === 0 ? (
                <p className="text-sm text-slate-500">{t('studio.chat.noMessages')}</p>
              ) : null}

              {translateState.error ? (
                <p className="mt-2 text-sm text-rose-700">{t('studio.matches.shortModal.translateError', { error: translateState.error })}</p>
              ) : null}

              {contactInfo?.otherEntry?.waUrl ? (
                <div className="sticky top-0 z-10 mb-3 rounded-xl border border-emerald-200 bg-white/95 p-3 shadow-sm backdrop-blur">
                  <p className="text-sm font-semibold text-emerald-900">
                    {t('studio.chat.system.contactSharedOtherTitle', { name: otherName })}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {t('studio.chat.system.contactSharedOtherBody', { name: otherName })}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{contactInfo.otherEntry.whatsapp}</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <a
                      href={contactInfo.otherEntry.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="app-btn app-btn-primary"
                    >
                      <Share2 className="h-4 w-4" />
                      {t('studio.chat.lock48h.openInWhatsApp')}
                    </a>
                    <Link to={complaintHref} className="app-btn app-btn-outline">
                      {t('studio.chat.lock48h.reportCta')}
                    </Link>
                    {actionOtherUid ? (
                      <button
                        type="button"
                        onClick={blockUser}
                        disabled={blockState.loading}
                        className="app-btn app-btn-danger disabled:opacity-60"
                      >
                        <X className="h-4 w-4" />
                        {blockState.loading ? t('studio.chat.lock48h.blocking') : t('studio.chat.lock48h.blockCta')}
                      </button>
                    ) : null}
                  </div>
                  {blockState.error ? <p className="mt-2 text-sm text-rose-700">{t('studio.chat.lock48h.blockError', { error: blockState.error })}</p> : null}
                </div>
              ) : null}

              <div className="space-y-3">
                {(Array.isArray(messages) ? messages : []).map((m) => {
                  const isSystem = safeStr(m?.type) === 'system';
                  const systemType = safeStr(m?.systemType);
                  const fromMe = !!uid && String(m?.userId || '') === uid;
                  const text = String(m?.text || '').trim();
                  const sentAtMs = timestampToMs(m?.createdAtMs) || timestampToMs(m?.createdAt);
                  const sentAtLabel = formatRelativeTimeFromMs(sentAtMs, { nowMs: nowTickMs, locale: i18n?.language || 'tr' });
                  const sentAtTitle = formatDateTimeFromMs(sentAtMs, { locale: i18n?.language || 'tr' });

                  if (isSystem && systemType === 'contact_shared') {
                    const systemEntries = extractSharedContactsFromMessage(m);
                    const sharedEntry = systemEntries.find((entry) => safeStr(entry?.userId) === safeStr(m?.userId)) || systemEntries[0] || null;
                    if (!sharedEntry) return null;
                    const isMineShared = safeStr(sharedEntry.userId) === uid;
                    const digits = normalizePhoneForWhatsApp(sharedEntry.whatsapp);
                    const waUrl = digits ? `https://wa.me/${digits}` : '';

                    return (
                      <div key={m.id} className="flex justify-center">
                        <div className="max-w-[88%] rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 shadow-sm">
                          <p className="font-semibold">
                            {isMineShared
                              ? t('studio.chat.system.contactSharedMineTitle')
                              : t('studio.chat.system.contactSharedOtherTitle', { name: otherName })}
                          </p>
                          <p className="mt-1 text-emerald-900/80">
                            {isMineShared
                              ? t('studio.chat.system.contactSharedMineBody')
                              : t('studio.chat.system.contactSharedOtherBody', { name: otherName })}
                          </p>
                          {sentAtLabel ? <p className="mt-2 text-[11px] text-emerald-900/70" title={sentAtTitle}>{sentAtLabel}</p> : null}
                          {!isMineShared && sharedEntry.whatsapp ? (
                            <>
                              <p className="mt-2 font-semibold text-slate-900">{sharedEntry.whatsapp}</p>
                              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                {waUrl ? (
                                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="app-btn app-btn-primary">
                                    <Share2 className="h-4 w-4" />
                                    {t('studio.chat.lock48h.openInWhatsApp')}
                                  </a>
                                ) : null}
                                <Link to={complaintHref} className="app-btn app-btn-outline">
                                  {t('studio.chat.lock48h.reportCta')}
                                </Link>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    );
                  }

                  if (!text) return null;

                  const translated =
                    m?.translations && typeof m.translations === 'object'
                      ? String(m.translations?.[effectiveTargetLang] || '').trim()
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

                        {sentAtLabel ? (
                          <div
                            className={
                              'mt-2 text-[11px] ' +
                              (fromMe ? 'text-emerald-100/90 text-right' : 'text-slate-500')
                            }
                            title={sentAtTitle}
                          >
                            {sentAtLabel}
                          </div>
                        ) : null}

                        {!fromMe ? (
                          <div className="mt-2 flex items-center justify-between gap-2">
                            {translated ? (
                              <div className="text-xs text-slate-600">{effectiveTargetLang.toUpperCase()}: {translated}</div>
                            ) : (
                              <span />
                            )}
                            <button
                              type="button"
                              onClick={() => translateMessage({ messageId: m.id })}
                              disabled={translateState.loadingId === m.id}
                              className="app-btn app-btn-purple h-8 px-2 text-xs disabled:opacity-60"
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
            {/* Input */}
            {!(longChatAllowed || shortChatAllowed) ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {!isParticipant ? (
                  <p>{t('studio.chat.notAllowed')}</p>
                ) : !chatStatusAllowed ? (
                  <div className="flex items-start gap-2">
                    <Lock className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="font-semibold">{t('studio.chat.notOpenTitle')}</p>
                      <p className="mt-1 text-slate-600">{t('studio.chat.notOpenBody')}</p>
                    </div>
                  </div>
                ) : (
                  <p>{t('studio.chat.notAvailable')}</p>
                )}
              </div>
            ) : null}

            <form onSubmit={sendMessage} className="mt-3 flex items-center gap-2">
              <EmojiPicker
                disabled={!(longChatAllowed || shortChatAllowed) || (shortChatAllowed && shortRemaining <= 0)}
                ariaLabel={t('studio.chat.emoji')}
                onSelect={(emoji) => {
                  setSendText((p) => `${String(p || '')}${emoji}`);
                  setTimeout(() => {
                    try {
                      inputRef.current?.focus?.();
                    } catch {
                      // noop
                    }
                  }, 0);
                }}
              />
              <input
                ref={inputRef}
                data-tutorial-id="chat-input"
                value={sendText}
                onChange={(e) => setSendText(e.target.value)}
                placeholder={
                  longChatAllowed
                    ? t('studio.chat.inputPlaceholderLong')
                    : shortChatAllowed
                      ? t('studio.chat.inputPlaceholderShort')
                      : t('studio.chat.inputPlaceholderLong')
                }
                disabled={!(longChatAllowed || shortChatAllowed) || (shortChatAllowed && shortRemaining <= 0)}
                maxLength={longChatAllowed ? 600 : 240}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100"
                autoComplete="off"
              />
              <button
                type="submit"
                data-tutorial-id="chat-send"
                disabled={!canSend}
                className="app-btn app-btn-primary h-10 w-10 px-0 disabled:opacity-60"
                aria-label={t('studio.common.send')}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <StudioBottomNav />
      <Footer />
    </div>
  );
}
