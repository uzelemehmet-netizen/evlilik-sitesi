import { formatProfileCode } from '../utils/profileCode';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { signOut } from "firebase/auth";
import { collection, doc, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { auth, db } from "../config/firebase";
import { useAuth } from "../auth/AuthProvider";
import { getWhatsAppNumber } from "../utils/whatsapp";
import { normalizePhoneForWhatsApp } from "../utils/reservationStatus";
import { authFetch } from "../utils/authFetch";
import { uploadImageToCloudinaryAuto } from '../utils/cloudinaryUpload';

export default function Panel() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [dashboardTab, setDashboardTab] = useState('matches'); // profile | matches

  const [matchmaking, setMatchmaking] = useState(null);
  const [matchmakingLoading, setMatchmakingLoading] = useState(true);

  const [matchmakingUser, setMatchmakingUser] = useState(null);
  const [matchmakingUserLoading, setMatchmakingUserLoading] = useState(true);

  const [matchmakingMatches, setMatchmakingMatches] = useState([]);
  const [matchmakingMatchesLoading, setMatchmakingMatchesLoading] = useState(true);
  const [matchmakingAction, setMatchmakingAction] = useState({ loading: false, error: '' });

  const [dismissAction, setDismissAction] = useState({ loading: false, error: '', matchId: '' });

  const [candidateDetailsByMatchId, setCandidateDetailsByMatchId] = useState({});
  const [candidateDetailsLoadingByMatchId, setCandidateDetailsLoadingByMatchId] = useState({});

  const [profileInfoOpenByMatchId, setProfileInfoOpenByMatchId] = useState({});
  const [profileInfoShowEmptyByMatchId, setProfileInfoShowEmptyByMatchId] = useState({});

  const [chatByMatchId, setChatByMatchId] = useState({});
  const [chatSendByMatchId, setChatSendByMatchId] = useState({});
  const [chatTextByMatchId, setChatTextByMatchId] = useState({});
  const [chatDecisionByMatchId, setChatDecisionByMatchId] = useState({});
  const [chatNotifyMsgByMatchId, setChatNotifyMsgByMatchId] = useState({});
  const [chatFocusMatchId, setChatFocusMatchId] = useState('');
  const [chatEmojiOpenByMatchId, setChatEmojiOpenByMatchId] = useState({});

  const lastChatSeenMessageIdByMatchIdRef = useRef({});
  const chatScrollElByMatchIdRef = useRef({});
  const lastChatLenByMatchIdRef = useRef({});
  const chatMarkReadLastAtByMatchIdRef = useRef({});

  const [rejectAllAction, setRejectAllAction] = useState({ loading: false, error: '', success: '' });

  const [requestNewAction, setRequestNewAction] = useState({ loading: false, error: '', success: '' });

  const [matchmakingPayments, setMatchmakingPayments] = useState([]);
  const [matchmakingPaymentsLoading, setMatchmakingPaymentsLoading] = useState(true);

  const [contactByMatchId, setContactByMatchId] = useState({});
  const [contactAction, setContactAction] = useState({ loading: false, error: '', matchId: '' });

  const [paymentForm, setPaymentForm] = useState({
    currency: 'TRY',
    method: 'eft_fast',
    reference: '',
    note: '',
    receiptUrl: '',
  });
  const [paymentAction, setPaymentAction] = useState({ loading: false, error: '', success: '', matchId: '' });

  const [paymentMatchId, setPaymentMatchId] = useState('');

  const [receiptUpload, setReceiptUpload] = useState({ loading: false, error: '' });

  const [photoUpdateFiles, setPhotoUpdateFiles] = useState({ photo1: null, photo2: null, photo3: null });
  const [photoUpdateAction, setPhotoUpdateAction] = useState({ loading: false, error: '', success: '' });

  const [editOnceForm, setEditOnceForm] = useState(null);
  const [editOnceAction, setEditOnceAction] = useState({ loading: false, error: '', success: '' });

  const showMatchmakingIntro = !!location?.state?.showMatchmakingIntro;
  const matchmakingNext = '/evlilik/eslestirme-basvuru';

  const [onboardingAccepted, setOnboardingAccepted] = useState(() => {
    try {
      return localStorage.getItem('mk_onboarding_accepted') === '1';
    } catch (e) {
      return false;
    }
  });
  const [onboardingChecked, setOnboardingChecked] = useState(onboardingAccepted);

  const introPoints = useMemo(() => {
    const g = String(matchmaking?.gender || matchmakingUser?.gender || '').toLowerCase().trim();
    const eligibilityPoint =
      g === 'female'
        ? t('matchmakingPanel.intro.eligibilityPointFemale')
        : t('matchmakingPanel.intro.eligibilityPointMale');

    const v = t('matchmakingPanel.intro.points', { returnObjects: true, eligibilityPoint });
    return Array.isArray(v) ? v : [];
  }, [t, i18n.language, matchmaking?.gender, matchmakingUser?.gender]);

  const dashboardFaqItems = useMemo(() => {
    const v = t('matchmakingPanel.dashboard.faq.items', { returnObjects: true });
    return Array.isArray(v) ? v : [];
  }, [t, i18n.language]);

  const trustRules = useMemo(() => {
    const v = t('matchmakingPanel.trust.rules', { returnObjects: true });
    return Array.isArray(v) ? v : [];
  }, [t, i18n.language]);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'matchmakingPayments'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setMatchmakingPayments(items);
        setMatchmakingPaymentsLoading(false);
      },
      (err) => {
        console.error('Ödeme bildirimleri yüklenemedi:', err);
        setMatchmakingPaymentsLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  const latestPaymentByMatchId = useMemo(() => {
    const rows = Array.isArray(matchmakingPayments) ? matchmakingPayments : [];

    const toMs = (v) => {
      if (!v) return 0;
      if (typeof v === 'number') return v;
      if (typeof v?.toMillis === 'function') return v.toMillis();
      return 0;
    };

    const best = {};
    for (const p of rows) {
      const matchId = typeof p?.matchId === 'string' ? p.matchId : '';
      if (!matchId) continue;

      const cur = best[matchId];
      const curMs = toMs(cur?.createdAt);
      const nextMs = toMs(p?.createdAt);

      if (!cur || nextMs >= curMs) {
        best[matchId] = p;
      }
    }
    return best;
  }, [matchmakingPayments]);

  const prices = useMemo(() => {
    const tryPrice = Number(import.meta?.env?.VITE_MATCHMAKING_PRICE_TRY);
    const idrPrice = Number(import.meta?.env?.VITE_MATCHMAKING_PRICE_IDR);

    return {
      TRY: Number.isFinite(tryPrice) && tryPrice > 0 ? tryPrice : 750,
      IDR: Number.isFinite(idrPrice) && idrPrice > 0 ? idrPrice : 250000,
    };
  }, []);

  const myMembership = useMemo(() => {
    const m = matchmakingUser?.membership || null;
    const validUntilMs = typeof m?.validUntilMs === 'number' ? m.validUntilMs : 0;
    const active = !!m?.active && validUntilMs > Date.now();
    const msLeft = validUntilMs - Date.now();
    const daysLeft = msLeft > 0 ? Math.ceil(msLeft / 86400000) : 0;
    const locale = i18n?.language === 'id' ? 'id-ID' : i18n?.language === 'en' ? 'en-US' : 'tr-TR';
    const untilText = validUntilMs
      ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
          new Date(validUntilMs)
        )
      : '';
    return { active, validUntilMs, daysLeft, untilText };
  }, [i18n?.language, matchmakingUser]);

  const myIdentityVerified = useMemo(() => {
    if (matchmakingUser?.identityVerified === true) return true;
    const st = String(matchmakingUser?.identityVerification?.status || '').toLowerCase().trim();
    return st === 'verified' || st === 'approved';
  }, [matchmakingUser]);

  const myGender = useMemo(() => {
    // Önce application doc, yoksa signup'ta tutulan cinsiyet.
    return String(matchmaking?.gender || matchmakingUser?.gender || '').toLowerCase().trim();
  }, [matchmaking?.gender, matchmakingUser?.gender]);

  const myFreeActive = useMemo(() => {
    const fam = matchmakingUser?.freeActiveMembership || null;
    const active = !!fam?.active;
    const blocked = !!fam?.blocked;
    const windowHours = typeof fam?.windowHours === 'number' ? fam.windowHours : 0;
    const lastActiveAtMs = typeof fam?.lastActiveAtMs === 'number' ? fam.lastActiveAtMs : 0;
    const expiresAtMs = active && windowHours > 0 && lastActiveAtMs > 0 ? lastActiveAtMs + windowHours * 3600000 : 0;
    const expired = active && expiresAtMs > 0 ? Date.now() > expiresAtMs : active;
    const eligible = active && !expired;
    const hoursLeft = eligible && expiresAtMs > 0 ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 3600000)) : 0;
    return { active, eligible, blocked, windowHours, lastActiveAtMs, expiresAtMs, expired, hoursLeft };
  }, [matchmakingUser]);

  const frequentCancelInfo = useMemo(() => {
    const cb = matchmakingUser?.contactCancelBehaviour || null;
    const events = Array.isArray(cb?.recentContactCancelMs) ? cb.recentContactCancelMs : [];

    const now = Date.now();
    const windowMs = 48 * 3600000;
    const cutoff = now - windowMs;

    const recent = events
      .filter((ms) => typeof ms === 'number' && Number.isFinite(ms))
      .filter((ms) => ms >= cutoff && ms <= now + 60000);

    const count = recent.length;
    const lastMs = recent.length ? Math.max(...recent) : 0;
    const show = count >= 3 && lastMs > 0;
    return { show, count, lastMs };
  }, [matchmakingUser]);

  const devBypassMembership = useMemo(() => {
    if (!!import.meta?.env?.DEV) return true;
    try {
      const host = typeof window !== 'undefined' ? String(window.location?.hostname || '').toLowerCase() : '';
      return host === 'localhost' || host === '127.0.0.1';
    } catch (e) {
      return false;
    }
  }, []);

  const canTakeActions = useMemo(() => {
    // Dev sunucuda (Vite dev) üyelik kapısını açık say: geliştirme/test akışını hızlandırır.
    if (devBypassMembership) return true;
    if (myGender === 'male') return myMembership.active;
    if (myGender === 'female') return myMembership.active || (myIdentityVerified && myFreeActive.eligible);
    return myMembership.active;
  }, [devBypassMembership, myGender, myIdentityVerified, myMembership.active, myFreeActive.eligible]);

  const canSeeFullProfiles = canTakeActions;

  const membershipStatusText = useMemo(() => {
    if (myMembership.active) {
      let s = t('matchmakingPanel.membership.active');
      if (typeof myMembership.daysLeft === 'number' && myMembership.daysLeft > 0) {
        s += ` ${t('matchmakingPanel.membership.daysLeft', { count: myMembership.daysLeft })}`;
      }
      if (myMembership.untilText) {
        s += ` ${t('matchmakingPanel.membership.until', { date: myMembership.untilText })}`;
      }
      return s;
    }

    if (myGender === 'female') {
      if (myFreeActive.eligible) return t('matchmakingPanel.membership.freeActiveActive');
      if (myIdentityVerified) {
        if (myFreeActive.blocked) return t('matchmakingPanel.errors.freeActiveMembershipBlocked');
        return t('matchmakingPanel.membership.activeViaVerification');
      }
      return t('matchmakingPanel.membership.inactiveFemale');
    }

    return t('matchmakingPanel.membership.inactiveMale');
  }, [myGender, myIdentityVerified, myMembership.active, myMembership.daysLeft, myMembership.untilText, myFreeActive.blocked, myFreeActive.eligible, t]);

  const verificationUnverifiedBody = useMemo(() => {
    if (myGender === 'female') return t('matchmakingPanel.verification.unverifiedBodyFemale');
    return t('matchmakingPanel.verification.unverifiedBodyMale');
  }, [myGender, t]);

  const complaintLeadExtra = useMemo(() => {
    if (myGender === 'female') return t('matchmakingPanel.rules.complaint.extraFemale');
    if (myGender === 'male') return t('matchmakingPanel.rules.complaint.extraMale');
    return '';
  }, [myGender, t]);

  const [freeActiveApplyAction, setFreeActiveApplyAction] = useState({ loading: false, error: '', success: '' });

  const applyFreeActiveMembership = async () => {
    if (freeActiveApplyAction.loading) return;
    setFreeActiveApplyAction({ loading: true, error: '', success: '' });

    try {
      const data = await authFetch('/api/matchmaking-free-membership-apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      const hours = typeof data?.windowHours === 'number' ? data.windowHours : null;
      setFreeActiveApplyAction({
        loading: false,
        error: '',
        success: hours ? t('matchmakingPanel.membership.freeActiveApplied', { hours }) : t('matchmakingPanel.actions.sending'),
      });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const mapped =
        msg === 'free_active_membership_required'
          ? t('matchmakingPanel.errors.freeActiveMembershipRequired')
          : msg === 'free_active_membership_blocked'
            ? t('matchmakingPanel.errors.freeActiveMembershipBlocked')
            : msg === 'membership_or_verification_required'
              ? t('matchmakingPanel.errors.membershipOrVerificationRequired')
            : msg === 'membership_required'
              ? t('matchmakingPanel.errors.membershipRequired')
              : (msg || t('matchmakingPanel.errors.actionFailed'));
      setFreeActiveApplyAction({ loading: false, error: mapped, success: '' });
    }
  };

  const canBrowserNotify = useMemo(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  }, []);

  const requestChatNotifications = async (matchId) => {
    if (!matchId) return;
    if (!canBrowserNotify) {
      setChatNotifyMsgByMatchId((p) => ({ ...p, [matchId]: t('matchmakingPanel.matches.chat.notificationsNotSupported') }));
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setChatNotifyMsgByMatchId((p) => ({ ...p, [matchId]: t('matchmakingPanel.matches.chat.notificationsEnabled') }));
      } else {
        setChatNotifyMsgByMatchId((p) => ({ ...p, [matchId]: t('matchmakingPanel.matches.chat.notificationsDenied') }));
      }
    } catch (e) {
      setChatNotifyMsgByMatchId((p) => ({ ...p, [matchId]: t('matchmakingPanel.matches.chat.notificationsDenied') }));
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    const ref = doc(db, 'matchmakingUsers', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setMatchmakingUser(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setMatchmakingUserLoading(false);
      },
      (err) => {
        console.error('matchmakingUsers yüklenemedi:', err);
        setMatchmakingUser(null);
        setMatchmakingUserLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const isIndexError = (err) => {
      const code = typeof err?.code === 'string' ? err.code : '';
      const message = typeof err?.message === 'string' ? err.message : '';
      return code === 'failed-precondition' && /requires an index/i.test(message);
    };

    const sortAndSet = (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

      const toMs = (ts) => {
        if (!ts) return 0;
        if (typeof ts?.toMillis === 'function') return ts.toMillis();
        if (typeof ts?.seconds === 'number') return ts.seconds * 1000;
        if (typeof ts === 'number') return ts;
        return 0;
      };

      items.sort((a, b) => toMs(b?.createdAt) - toMs(a?.createdAt));
      setMatchmakingMatches(items.slice(0, 25));
      setMatchmakingMatchesLoading(false);
    };

    const qPrimary = query(
      collection(db, 'matchmakingMatches'),
      where('userIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const qFallback = query(
      collection(db, 'matchmakingMatches'),
      where('userIds', 'array-contains', user.uid)
    );

    let usingFallback = false;
    let unsub = () => {};

    const subscribe = (q) => {
      unsub = onSnapshot(
        q,
        (snap) => {
          if (usingFallback) {
            sortAndSet(snap);
            return;
          }

          const items = [];
          snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
          setMatchmakingMatches(items);
          setMatchmakingMatchesLoading(false);
        },
        (err) => {
          if (!usingFallback && isIndexError(err)) {
            console.warn('Eşleşmeler index gerektiriyor; fallback sorguya geçiliyor.', err);
            usingFallback = true;
            try {
              unsub();
            } catch {
              // noop
            }
            subscribe(qFallback);
            return;
          }

          console.error('Eşleşmeler yüklenemedi:', err);
          setMatchmakingMatchesLoading(false);
        }
      );
    };

    subscribe(qPrimary);
    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const ping = async () => {
      try {
        await authFetch('/api/matchmaking-heartbeat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        });
      } catch {
        // noop
      }
    };

    ping();
    const id = window.setInterval(ping, 60000);
    return () => window.clearInterval(id);
  }, [user?.uid]);

  const lockInfo = useMemo(() => {
    const lock = matchmakingUser?.matchmakingLock || null;
    const active = !!lock?.active;
    const matchId = typeof lock?.matchId === 'string' ? lock.matchId : '';
    const matchCode = typeof lock?.matchCode === 'string' ? lock.matchCode : '';
    return { active, matchId, matchCode };
  }, [matchmakingUser]);

  const shortInternalId = (id) => {
    const s = String(id || '');
    if (!s) return '';
    if (s.length <= 14) return s;
    return `${s.slice(0, 6)}…${s.slice(-4)}`;
  };

  const normalizeEnumValue = (v) => {
    const s = String(v || '').trim();
    if (!s) return '';
    // snake_case -> camelCase (business_owner -> businessOwner)
    return s.replace(/_([a-z])/g, (_, c) => String(c).toUpperCase());
  };

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
    return rawValue === true ? t('matchmakingPage.form.options.common.yes') : rawValue === false ? t('matchmakingPage.form.options.common.no') : String(rawValue || '');
  };

  const formatMaybeValue = (v, unit = '') => {
    if (v === null || v === undefined) return '-';
    if (typeof v === 'number' && Number.isFinite(v)) return unit ? `${v}${unit}` : String(v);
    const s = String(v).trim();
    if (!s) return '-';
    return unit ? `${s}${unit}` : s;
  };

  const isEmptyUiValue = (v) => {
    const s = String(v ?? '').trim();
    return !s || s === '-' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined';
  };

  const filterEmptyRows = (rows, showEmpty) => {
    const list = Array.isArray(rows) ? rows : [];
    if (showEmpty) return list;
    return list.filter((r) => r && !isEmptyUiValue(r.value));
  };

  const formatLanguagesSummary = (langs) => {
    const l = langs && typeof langs === 'object' ? langs : {};
    const native = l?.native && typeof l.native === 'object' ? l.native : {};
    const foreign = l?.foreign && typeof l.foreign === 'object' ? l.foreign : {};

    const nativeCode = String(native?.code || '').trim();
    const nativeOther = String(native?.other || '').trim();
    const nativeLabel = nativeCode === 'other' ? nativeOther : (nativeCode ? tOption('commLanguage', nativeCode) : '');

    const foreignCodes = Array.isArray(foreign?.codes) ? foreign.codes.map((x) => String(x || '').trim()).filter(Boolean) : [];
    const foreignOther = String(foreign?.other || '').trim();
    const foreignLabels = foreignCodes
      .filter((c) => c !== nativeCode)
      .map((c) => (c === 'other' ? foreignOther : tOption('commLanguage', c)))
      .filter(Boolean);

    const out = [];
    if (nativeLabel) out.push(`${t('matchmakingPage.form.labels.nativeLanguage')}: ${nativeLabel}`);
    if (foreignLabels.length) out.push(`${t('matchmakingPage.form.labels.foreignLanguages')}: ${foreignLabels.join(', ')}`);
    return out.join(' • ');
  };

  const matchCodeById = useMemo(() => {
    const list = Array.isArray(matchmakingMatches) ? matchmakingMatches : [];
    const map = {};
    for (const m of list) {
      const id = String(m?.id || '');
      if (!id) continue;
      const code = typeof m?.matchCode === 'string' ? m.matchCode.trim() : '';
      if (code) map[id] = code;
    }
    return map;
  }, [matchmakingMatches]);

  const proposedMatchesCount = useMemo(() => {
    const all = Array.isArray(matchmakingMatches) ? matchmakingMatches : [];
    return all.filter((m) => m?.status === 'proposed').length;
  }, [matchmakingMatches]);

  const activeMatches = useMemo(() => {
    const all = Array.isArray(matchmakingMatches) ? matchmakingMatches : [];

    const toMs = (ts) => {
      if (!ts) return 0;
      if (typeof ts?.toMillis === 'function') return ts.toMillis();
      if (typeof ts?.seconds === 'number') return ts.seconds * 1000;
      if (typeof ts === 'number') return ts;
      return 0;
    };

    const isDismissedByMe = (m) => {
      const d = m?.dismissals || null;
      if (!d || !user?.uid) return false;
      return !!d?.[user.uid];
    };

    const isRejectedByOther = (m) => {
      if (!user?.uid) return false;
      if (String(m?.status || '') !== 'cancelled') return false;
      if (String(m?.cancelledReason || '') !== 'rejected') return false;
      const by = String(m?.cancelledByUserId || '');
      return !!by && by !== user.uid;
    };

    // Not: mutual_accepted artık otomatik kilit değil. Kilit sadece karşılıklı "iletişim paylaş" veya "site içi konuş" seçilince açılır.

    // Kilit aktifse ve matchId belliyse sadece o eşleşmeyi göster.
    if (lockInfo.active && lockInfo.matchId) {
      const only = all.find((m) => m?.id === lockInfo.matchId);
      return only ? [only] : [];
    }

    const items = all.filter((m) => {
      if (!m || !m?.id) return false;
      if (isDismissedByMe(m)) return false;
      const st = String(m?.status || '');
      if (st === 'proposed' || st === 'mutual_accepted' || st === 'contact_unlocked') return true;
      if (isRejectedByOther(m)) return true;
      return false;
    });

    const priority = (m) => {
      const st = String(m?.status || '');
      if (isRejectedByOther(m)) return 0;
      if (st === 'contact_unlocked') return 1;
      if (st === 'mutual_accepted') return 2;
      if (st === 'proposed') return 3;
      return 9;
    };

    items.sort((a, b) => {
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;
      return toMs(b?.createdAt) - toMs(a?.createdAt);
    });

    return items.slice(0, 3);
  }, [matchmakingMatches, lockInfo.active, lockInfo.matchId, user?.uid]);

  const focusedChatMatchId = useMemo(() => {
    const list = Array.isArray(activeMatches) ? activeMatches : [];
    const isChat = (m) => m?.status === 'mutual_accepted' && m?.interactionMode === 'chat' && m?.id;
    const focused = chatFocusMatchId
      ? list.find((m) => String(m?.id || '') === String(chatFocusMatchId) && isChat(m))
      : null;
    if (focused?.id) return focused.id;
    const first = list.find(isChat);
    return first?.id || '';
  }, [activeMatches, chatFocusMatchId]);

  useEffect(() => {
    if (!chatFocusMatchId && focusedChatMatchId) setChatFocusMatchId(focusedChatMatchId);
  }, [chatFocusMatchId, focusedChatMatchId]);

  useEffect(() => {
    // Yeni mesaj geldikçe chat kutusunu en alta kaydır.
    // Kullanıcı deneyimi: her zaman en güncel mesaj görünür kalsın.
    const list = Array.isArray(activeMatches) ? activeMatches : [];
    for (const m of list) {
      const matchId = String(m?.id || '');
      if (!matchId) continue;
      if (String(m?.interactionMode || '') !== 'chat') continue;

      const items = chatByMatchId?.[matchId]?.items || [];
      const len = Array.isArray(items) ? items.length : 0;
      const prevLen = typeof lastChatLenByMatchIdRef.current[matchId] === 'number' ? lastChatLenByMatchIdRef.current[matchId] : -1;

      if (len === prevLen) continue;

      lastChatLenByMatchIdRef.current[matchId] = len;
      const el = chatScrollElByMatchIdRef.current[matchId];
      if (!el) continue;

      try {
        el.scrollTop = el.scrollHeight;
      } catch {
        // noop
      }
    }
  }, [activeMatches, chatByMatchId]);

  const newMatchQuotaInfo = useMemo(() => {
    const limit = 3;
    const q = matchmakingUser?.newMatchRequestQuota || null;
    const qDayKey = typeof q?.dayKey === 'string' ? q.dayKey : '';
    const qCount = typeof q?.count === 'number' ? q.count : 0;
    const today = new Date().toISOString().slice(0, 10);
    const count = qDayKey === today ? qCount : 0;
    const remaining = Math.max(0, limit - count);
    return { limit, remaining, dayKey: today, count };
  }, [matchmakingUser]);

  const [interactionChoiceByMatchId, setInteractionChoiceByMatchId] = useState({});

  const [verificationAction, setVerificationAction] = useState({ loading: false, error: '', result: null });

  const kycEnabled = useMemo(() => {
    const raw = String(import.meta.env.VITE_KYC_ENABLED || '').trim().toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'yes';
  }, []);

  const startVerification = async (method) => {
    if (!method) return;
    if (verificationAction.loading) return;

    if (method === 'kyc' && !kycEnabled) {
      setVerificationAction({ loading: false, error: t('matchmakingPanel.verification.errors.kycNotConfigured'), result: null });
      return;
    }

    setVerificationAction({ loading: true, error: '', result: null });
    try {
      const data = await authFetch('/api/matchmaking-verification-select', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method }),
      });

      setVerificationAction({ loading: false, error: '', result: data || null });
    } catch (e) {
      const code = String(e?.message || '').trim();
      const mapped =
        code === 'kyc_not_configured'
          ? t('matchmakingPanel.verification.errors.kycNotConfigured')
          : code === 'whatsapp_not_configured'
            ? t('matchmakingPanel.verification.errors.whatsappNotConfigured')
            : (code || t('matchmakingPanel.errors.actionFailed'));
      setVerificationAction({ loading: false, error: mapped, result: null });
    }
  };

  const chooseInteraction = async (matchId, choice) => {
    if (!matchId || !choice) return;
    const cur = interactionChoiceByMatchId?.[matchId] || null;
    if (cur?.loading) return;

    setInteractionChoiceByMatchId((p) => ({ ...p, [matchId]: { loading: true, error: '' } }));
    try {
      await authFetch('/api/matchmaking-interaction-choice', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId, choice }),
      });
      setInteractionChoiceByMatchId((p) => ({ ...p, [matchId]: { loading: false, error: '' } }));
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const mapped =
        msg === 'membership_required'
          ? t('matchmakingPanel.errors.membershipRequired')
          : msg === 'free_active_membership_required'
            ? t('matchmakingPanel.errors.freeActiveMembershipRequired')
            : msg === 'free_active_membership_blocked'
              ? t('matchmakingPanel.errors.freeActiveMembershipBlocked')
          : msg === 'membership_or_verification_required'
            ? t('matchmakingPanel.errors.membershipOrVerificationRequired')
            : (msg || t('matchmakingPanel.errors.actionFailed'));
      setInteractionChoiceByMatchId((p) => ({ ...p, [matchId]: { loading: false, error: mapped } }));
    }
  };

  const matchHistory = useMemo(() => {
    const all = Array.isArray(matchmakingMatches) ? matchmakingMatches : [];

    const toMs = (ts) => {
      if (!ts) return 0;
      if (typeof ts?.toMillis === 'function') return ts.toMillis();
      if (typeof ts?.seconds === 'number') return ts.seconds * 1000;
      if (typeof ts === 'number') return ts;
      return 0;
    };

    const isDismissedByMe = (m) => {
      const d = m?.dismissals || null;
      if (!d || !user?.uid) return false;
      return !!d?.[user.uid];
    };

    const activeIds = new Set((Array.isArray(activeMatches) ? activeMatches : []).map((m) => String(m?.id || '')).filter(Boolean));

    const items = all
      .filter((m) => m && m?.id)
      .filter((m) => !activeIds.has(String(m.id)))
      .filter((m) => {
        if (isDismissedByMe(m)) return true;
        const st = String(m?.status || '').trim();
        // "proposed/mutual_accepted/contact_unlocked" zaten activeMatches'te.
        if (!st) return false;
        return st !== 'proposed' && st !== 'mutual_accepted' && st !== 'contact_unlocked';
      });

    items.sort((a, b) => toMs(b?.createdAt) - toMs(a?.createdAt));
    return items.slice(0, 20);
  }, [activeMatches, matchmakingMatches, user?.uid]);

  const loadCandidateDetails = async (matchId) => {
    if (!matchId) return;
    if (!canSeeFullProfiles) return;
    if (candidateDetailsByMatchId?.[matchId]) return;
    if (candidateDetailsLoadingByMatchId?.[matchId]) return;

    setCandidateDetailsLoadingByMatchId((p) => ({ ...p, [matchId]: true }));
    try {
      const data = await authFetch('/api/matchmaking-profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });

      const profile = data?.profile || null;
      if (profile) {
        setCandidateDetailsByMatchId((p) => ({ ...p, [matchId]: profile }));
      }
    } catch {
      // noop
    } finally {
      setCandidateDetailsLoadingByMatchId((p) => ({ ...p, [matchId]: false }));
    }
  };

  useEffect(() => {
    if (!canSeeFullProfiles) return;
    if (!Array.isArray(activeMatches) || activeMatches.length === 0) return;

    for (const m of activeMatches) {
      if (m?.status === 'proposed' && m?.id) {
        loadCandidateDetails(m.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeFullProfiles, activeMatches]);

  const decideMatch = async (matchId, decision) => {
    setMatchmakingAction({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-decision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId, decision }),
      });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const mapped =
        msg === 'other_user_matched'
          ? t('matchmakingPanel.errors.otherUserMatched')
          : msg === 'membership_required'
            ? t('matchmakingPanel.errors.membershipRequired')
            : msg === 'free_active_membership_required'
              ? t('matchmakingPanel.errors.freeActiveMembershipRequired')
              : msg === 'free_active_membership_blocked'
                ? t('matchmakingPanel.errors.freeActiveMembershipBlocked')
            : msg === 'membership_or_verification_required'
              ? t('matchmakingPanel.errors.membershipOrVerificationRequired')
          : msg === 'user_locked'
            ? t('matchmakingPanel.errors.userLocked')
            : msg === 'already_matched'
              ? t('matchmakingPanel.errors.alreadyMatched')
            : msg || t('matchmakingPanel.errors.actionFailed');

      setMatchmakingAction({ loading: false, error: mapped });
      return;
    }
    setMatchmakingAction({ loading: false, error: '' });
  };

  const dismissMatch = async (matchId) => {
    if (!matchId) return;
    if (dismissAction.loading) return;

    setDismissAction({ loading: true, error: '', matchId });
    try {
      await authFetch('/api/matchmaking-dismiss', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setDismissAction({ loading: false, error: msg || t('matchmakingPanel.errors.actionFailed'), matchId });
      return;
    }
    setDismissAction({ loading: false, error: '', matchId: '' });
  };

  const rejectAllMatches = async () => {
    if (rejectAllAction.loading) return;
    if (!window.confirm(t('matchmakingPanel.actions.rejectAllConfirm'))) return;

    setRejectAllAction({ loading: true, error: '', success: '' });
    try {
      const data = await authFetch('/api/matchmaking-reject-all', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      const count = typeof data?.cancelledCount === 'number' ? data.cancelledCount : 0;
      setRejectAllAction({ loading: false, error: '', success: t('matchmakingPanel.actions.rejectAllSuccess', { count }) });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const mapped =
        msg === 'user_locked'
          ? t('matchmakingPanel.errors.userLocked')
          : msg === 'already_matched'
            ? t('matchmakingPanel.errors.alreadyMatched')
            : msg || t('matchmakingPanel.errors.rejectAllFailed');

      setRejectAllAction({ loading: false, error: mapped, success: '' });
    }
  };

  const requestNewMatch = async () => {
    if (requestNewAction.loading) return;
    setRequestNewAction({ loading: true, error: '', success: '' });
    try {
      const data = await authFetch('/api/matchmaking-request-new', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      const remaining = typeof data?.remaining === 'number' ? data.remaining : null;
      setRequestNewAction({ loading: false, error: '', success: t('matchmakingPanel.actions.requestNewSuccess', { remaining }) });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const mapped =
        msg === 'quota_exhausted'
          ? t('matchmakingPanel.errors.requestNewQuotaExhausted')
          : msg === 'rate_limited'
            ? t('matchmakingPanel.errors.requestNewRateLimited')
            : msg === 'free_active_membership_blocked'
              ? t('matchmakingPanel.errors.requestNewFreeActiveBlocked')
            : (msg || t('matchmakingPanel.errors.requestNewFailed'));
      setRequestNewAction({ loading: false, error: mapped, success: '' });
    }
  };

  const openContact = async (matchId) => {
    setContactAction({ loading: true, error: '', matchId });
    try {
      const data = await authFetch('/api/matchmaking-contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });

      setContactByMatchId((prev) => ({ ...prev, [matchId]: data?.contact || null }));
      setContactAction({ loading: false, error: '', matchId });
    } catch (e) {
      const msg = String(e?.message || t('matchmakingPanel.contact.errors.fetchFailed'));
      const mapped =
        msg === 'not_confirmed'
            ? t('matchmakingPanel.contact.errors.notConfirmed')
            : msg === 'membership_required'
              ? t('matchmakingPanel.errors.membershipRequired')
              : msg === 'free_active_membership_required'
                ? t('matchmakingPanel.errors.freeActiveMembershipRequired')
                : msg === 'free_active_membership_blocked'
                  ? t('matchmakingPanel.errors.freeActiveMembershipBlocked')
              : msg === 'membership_or_verification_required'
                ? t('matchmakingPanel.errors.membershipOrVerificationRequired')
            : msg;

      setContactAction({ loading: false, error: mapped, matchId });
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    // Sadece seçili (veya fallback) chat eşleşmesi için mesajları dinle.
    const matchId = String(focusedChatMatchId || '');
    if (!matchId) return;

    const q = query(
      collection(db, 'matchmakingMatches', matchId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(80)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

        // İlk yüklemede bildirim spam'ini engelle.
        const seenMap = lastChatSeenMessageIdByMatchIdRef.current || {};
        const hasSeenKey = Object.prototype.hasOwnProperty.call(seenMap, matchId);
        const last = items.length > 0 ? items[items.length - 1] : null;

        if (!hasSeenKey) {
          lastChatSeenMessageIdByMatchIdRef.current = { ...seenMap, [matchId]: last?.id || '' };
        } else if (last?.id && seenMap[matchId] !== last.id) {
          lastChatSeenMessageIdByMatchIdRef.current = { ...seenMap, [matchId]: last.id };

          const fromOther = !!last?.userId && last.userId !== user.uid;
          const canNotifyNow =
            fromOther &&
            canBrowserNotify &&
            typeof document !== 'undefined' &&
            !!document.hidden &&
            Notification.permission === 'granted';

          if (canNotifyNow) {
            try {
              const n = new Notification(t('matchmakingPanel.matches.chat.notificationTitle'), {
                body: t('matchmakingPanel.matches.chat.notificationBody'),
                tag: `match-chat-${matchId}`,
              });
              n.onclick = () => {
                try {
                  window.focus();
                } catch (e) {
                  // ignore
                }
                try {
                  n.close();
                } catch (e) {
                  // ignore
                }
              };
            } catch (e) {
              // ignore
            }
          }
        }

        setChatByMatchId((prev) => ({ ...prev, [matchId]: { loading: false, error: '', items } }));
      },
      (err) => {
        console.error('Chat yüklenemedi:', err);
        setChatByMatchId((prev) => ({ ...prev, [matchId]: { loading: false, error: 'chat_load_failed', items: [] } }));
      }
    );

    // init loading state
    setChatByMatchId((prev) => ({ ...prev, [matchId]: { loading: true, error: '', items: prev?.[matchId]?.items || [] } }));

    return unsub;
  }, [focusedChatMatchId, user?.uid]);

  const renderFocusedChat = (matchId) => {
    if (!matchId) return null;
    const loading = !!chatByMatchId?.[matchId]?.loading;
    const items = chatByMatchId?.[matchId]?.items || [];
    const sendLoading = !!chatSendByMatchId?.[matchId]?.loading;
    const sendError = chatSendByMatchId?.[matchId]?.error || '';
    const blocked = !canTakeActions;
    const emojiOpen = !!chatEmojiOpenByMatchId?.[matchId];

    const emojiList = ['😀', '😊', '😂', '😍', '🥰', '😘', '👍', '🙏', '🤝', '💐', '✨', '❤️', '🎉', '🤔', '😢', '😡'];

    const appendEmoji = (emoji) => {
      if (blocked) return;
      const cur = String(chatTextByMatchId?.[matchId] || '');
      const next = cur ? `${cur}${emoji}` : emoji;
      setChatTextByMatchId((p) => ({ ...p, [matchId]: next }));
    };

    return (
      <div className="mt-3 flex flex-col min-h-0 flex-1">
        {loading ? <div className="text-xs text-white/60">{t('common.loading')}</div> : null}

        {canBrowserNotify ? (
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
            {Notification.permission === 'granted' ? (
              <div className="text-xs text-emerald-200 font-semibold">
                {t('matchmakingPanel.matches.chat.notificationsEnabled')}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => requestChatNotifications(matchId)}
                className="px-3 py-2 rounded-full bg-sky-500/10 border border-sky-300/30 text-sky-100 text-xs font-semibold hover:bg-sky-500/15"
              >
                {t('matchmakingPanel.matches.chat.enableNotifications')}
              </button>
            )}

            {chatNotifyMsgByMatchId?.[matchId] ? (
              <div className="text-xs text-white/60">{chatNotifyMsgByMatchId[matchId]}</div>
            ) : null}
          </div>
        ) : null}

        <div
          ref={(el) => {
            if (el) chatScrollElByMatchIdRef.current[matchId] = el;
          }}
          className="mt-3 flex-1 min-h-0 overflow-auto p-2"
        >
          {Array.isArray(items) && items.length ? (
            <div className="min-h-full flex flex-col justify-end">
              <div className="space-y-2">
                {items.map((msg) => {
                  const mine = msg?.userId === user?.uid;
                  return (
                    <div key={msg.id} className={mine ? 'text-right' : 'text-left'}>
                      <div
                        className={
                          mine
                            ? 'inline-block bg-sky-600 text-white px-3 py-2 rounded-2xl text-sm max-w-[85%]'
                            : 'inline-block bg-white/10 border border-white/10 text-white px-3 py-2 rounded-2xl text-sm max-w-[85%]'
                        }
                      >
                        {msg?.text || ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-xs text-white/60">{t('matchmakingPanel.matches.chat.empty')}</div>
          )}
        </div>

        {sendError ? (
          <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-xs">
            {(() => {
              const code = String(sendError || '').trim();
              if (code === 'filtered') return t('matchmakingPanel.matches.chat.errors.filtered');
              if (code === 'rate_limited') return t('matchmakingPanel.matches.chat.errors.rateLimited');
              if (code === 'chat_not_enabled') return t('matchmakingPanel.matches.chat.errors.notEnabled');
              if (code === 'firebase_admin_not_configured') return t('matchmakingPanel.matches.chat.errors.serverNotConfigured');
              if (code === 'not_authenticated' || code === 'missing_auth' || code === 'invalid_auth') return t('matchmakingPanel.matches.chat.errors.authRequired');
              if (code === 'membership_required') return t('matchmakingPanel.errors.membershipRequired');
              if (code === 'free_active_membership_required') return t('matchmakingPanel.errors.freeActiveMembershipRequired');
              if (code === 'free_active_membership_blocked') return t('matchmakingPanel.errors.freeActiveMembershipBlocked');
              if (code === 'membership_or_verification_required') return t('matchmakingPanel.errors.membershipOrVerificationRequired');
              return t('matchmakingPanel.matches.chat.errors.sendFailed');
            })()}
          </div>
        ) : null}

        {blocked ? (
          <div className="mt-2 text-xs text-amber-100/90">
            {myGender === 'female'
              ? t('matchmakingPanel.errors.membershipOrVerificationRequired')
              : t('matchmakingPanel.errors.membershipRequired')}
          </div>
        ) : null}

        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={chatTextByMatchId?.[matchId] || ''}
              onChange={(e) => setChatTextByMatchId((p) => ({ ...p, [matchId]: e.target.value }))}
              onKeyDown={(e) => {
                if (blocked) return;
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage(matchId);
                }
              }}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder={
                blocked
                  ? (myGender === 'female'
                      ? t('matchmakingPanel.errors.membershipOrVerificationRequired')
                      : t('matchmakingPanel.errors.membershipRequired'))
                  : t('matchmakingPanel.matches.chat.placeholder')
              }
              maxLength={600}
              disabled={blocked}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChatEmojiOpenByMatchId((p) => ({ ...p, [matchId]: !p?.[matchId] }))}
                disabled={blocked}
                className="px-3 py-2 rounded-full border border-white/15 bg-white/[0.04] text-white/85 text-sm font-semibold hover:bg-white/[0.08] disabled:opacity-60"
                aria-label="Emoji"
                title="Emoji"
              >
                😊
              </button>
              <button
                type="button"
                disabled={sendLoading || blocked}
                onClick={() => sendChatMessage(matchId)}
                className="px-4 py-2 rounded-full bg-sky-700 text-white text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
              >
                {sendLoading ? t('matchmakingPanel.actions.sending') : t('matchmakingPanel.matches.chat.send')}
              </button>
            </div>
          </div>

          {emojiOpen ? (
            <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] p-2">
              <div className="flex flex-wrap gap-2">
                {emojiList.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => appendEmoji(e)}
                    className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.08] text-lg"
                    disabled={blocked}
                    aria-label={`Emoji ${e}`}
                    title={e}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const sendChatMessage = async (matchId) => {
    const text = String(chatTextByMatchId?.[matchId] || '').trim();
    if (!matchId || !text) return;
    if (chatSendByMatchId?.[matchId]?.loading) return;

    setChatSendByMatchId((p) => ({ ...p, [matchId]: { loading: true, error: '' } }));
    try {
      await authFetch('/api/matchmaking-chat-send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId, text }),
      });
      setChatTextByMatchId((p) => ({ ...p, [matchId]: '' }));
      setChatSendByMatchId((p) => ({ ...p, [matchId]: { loading: false, error: '' } }));
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setChatSendByMatchId((p) => ({ ...p, [matchId]: { loading: false, error: msg || 'chat_send_failed' } }));
    }
  };

  const markChatRead = async (matchId) => {
    if (!user?.uid) return;
    const id = String(matchId || '').trim();
    if (!id) return;

    const now = Date.now();
    const lastAt = typeof chatMarkReadLastAtByMatchIdRef.current?.[id] === 'number' ? chatMarkReadLastAtByMatchIdRef.current[id] : 0;
    if (lastAt && now - lastAt < 2000) return;
    chatMarkReadLastAtByMatchIdRef.current = { ...(chatMarkReadLastAtByMatchIdRef.current || {}), [id]: now };

    try {
      await authFetch('/api/matchmaking-chat-mark-read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: id }),
      });
    } catch {
      // noop
    }
  };

  useEffect(() => {
    if (!focusedChatMatchId) return;
    markChatRead(focusedChatMatchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedChatMatchId, user?.uid]);

  useEffect(() => {
    const matchId = String(focusedChatMatchId || '').trim();
    if (!matchId) return;
    const items = chatByMatchId?.[matchId]?.items || [];
    if (!Array.isArray(items) || items.length === 0) return;

    const last = items[items.length - 1] || null;
    const fromOther = !!last?.userId && last.userId !== user?.uid;
    const isVisible = typeof document !== 'undefined' ? !document.hidden : true;

    if (fromOther && isVisible) {
      markChatRead(matchId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedChatMatchId, chatByMatchId, user?.uid]);

  const decideChat = async (matchId, decision) => {
    if (!matchId || !decision) return;
    if (chatDecisionByMatchId?.[matchId]?.loading) return;

    setChatDecisionByMatchId((p) => ({ ...p, [matchId]: { loading: true, error: '' } }));
    try {
      await authFetch('/api/matchmaking-chat-decision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId, decision }),
      });
      setChatDecisionByMatchId((p) => ({ ...p, [matchId]: { loading: false, error: '' } }));
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setChatDecisionByMatchId((p) => ({ ...p, [matchId]: { loading: false, error: msg || 'chat_decision_failed' } }));
    }
  };

  const submitPayment = async (matchId) => {
    setPaymentAction({ loading: true, error: '', success: '', matchId });
    try {
      const currency = paymentForm.currency === 'IDR' ? 'IDR' : 'TRY';
      const amount = currency === 'IDR' ? prices.IDR : prices.TRY;
      const method = String(paymentForm.method || '').trim();

      await authFetch('/api/matchmaking-submit-payment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          matchId,
          method,
          amount,
          currency,
          reference: String(paymentForm.reference || '').trim(),
          note: String(paymentForm.note || '').trim(),
          receiptUrl: String(paymentForm.receiptUrl || '').trim(),
        }),
      });

      setPaymentForm((p) => ({ ...p, reference: '', note: '' }));

      setPaymentAction({
        loading: false,
        error: '',
        success: t('matchmakingPanel.payment.success'),
        matchId,
      });
    } catch (e) {
      const msg = String(e?.message || t('matchmakingPanel.payment.errors.sendFailed'));
      const mapped =
        msg === 'rate_limited'
          ? t('matchmakingPanel.payment.errors.rateLimited')
          : msg === 'not_ready_for_payment'
            ? t('matchmakingPanel.payment.errors.notReady')
            : msg;

      setPaymentAction({ loading: false, error: mapped, success: '', matchId });
    }
  };

  const uploadReceipt = async (file) => {
    if (!file) return;

    setReceiptUpload({ loading: true, error: '' });
    try {
      const up = await uploadImageToCloudinaryAuto(file, {
        folder: 'matchmaking/receipts',
        tags: ['matchmaking', 'receipt'],
      });

      setPaymentForm((p) => ({ ...p, receiptUrl: up.secureUrl }));
      setReceiptUpload({ loading: false, error: '' });
    } catch (e) {
      setReceiptUpload({ loading: false, error: String(e?.message || t('matchmakingPanel.receipt.errors.uploadFailed')) });
    }
  };

  const isImageFile = (file) => {
    if (!file) return false;
    const t = String(file?.type || '').toLowerCase();
    return t.startsWith('image/');
  };

  const requestPhotoUpdate = async () => {
    if (photoUpdateAction.loading) return;

    const status = String(matchmaking?.photoUpdate?.status || '').trim();
    if (status === 'pending') {
      setPhotoUpdateAction({ loading: false, error: t('matchmakingPanel.photos.updateRequest.pending'), success: '' });
      return;
    }

    const f1 = photoUpdateFiles.photo1;
    const f2 = photoUpdateFiles.photo2;
    const f3 = photoUpdateFiles.photo3;

    if (!f1 || !f2 || !f3) {
      setPhotoUpdateAction({ loading: false, error: t('matchmakingPanel.photos.updateRequest.errors.photosRequired'), success: '' });
      return;
    }
    if (!isImageFile(f1) || !isImageFile(f2) || !isImageFile(f3)) {
      setPhotoUpdateAction({ loading: false, error: t('matchmakingPanel.photos.updateRequest.errors.photoType'), success: '' });
      return;
    }

    setPhotoUpdateAction({ loading: true, error: '', success: '' });
    try {
      const up1 = await uploadImageToCloudinaryAuto(f1, {
        folder: `matchmaking/photo-update-requests/${user?.uid || 'unknown'}`,
        tags: ['matchmaking', 'photo-update', 'photo1'],
      });
      const up2 = await uploadImageToCloudinaryAuto(f2, {
        folder: `matchmaking/photo-update-requests/${user?.uid || 'unknown'}`,
        tags: ['matchmaking', 'photo-update', 'photo2'],
      });
      const up3 = await uploadImageToCloudinaryAuto(f3, {
        folder: `matchmaking/photo-update-requests/${user?.uid || 'unknown'}`,
        tags: ['matchmaking', 'photo-update', 'photo3'],
      });

      await authFetch('/api/matchmaking-photo-update-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ photoUrls: [up1.secureUrl, up2.secureUrl, up3.secureUrl] }),
      });

      setPhotoUpdateFiles({ photo1: null, photo2: null, photo3: null });
      setPhotoUpdateAction({ loading: false, error: '', success: t('matchmakingPanel.photos.updateRequest.success') });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const mapped =
        msg === 'pending_exists'
          ? t('matchmakingPanel.photos.updateRequest.pending')
          : msg === 'application_not_found'
            ? t('matchmakingPanel.photos.updateRequest.errors.applicationNotFound')
            : msg || t('matchmakingPanel.photos.updateRequest.errors.failed');
      setPhotoUpdateAction({ loading: false, error: mapped, success: '' });
    }
  };

  useEffect(() => {
    if (paymentMatchId) return;
    const list = Array.isArray(activeMatches) ? activeMatches : [];
    const first = list.find((m) => m?.id)?.id || '';
    if (first) setPaymentMatchId(first);
  }, [activeMatches, paymentMatchId]);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "matchmakingApplications"),
      where("userId", "==", user.uid),
      limit(1)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const first = snap.docs?.[0];
        setMatchmaking(first ? { id: first.id, ...first.data() } : null);
        setMatchmakingLoading(false);
      },
      (err) => {
        console.error("Evlilik başvurusu yüklenemedi:", err);
        setMatchmakingLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  const whatsappNumber = useMemo(() => {
    return getWhatsAppNumber();
  }, []);

  const nationalityOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'tr', label: t('matchmakingPage.form.options.nationality.tr') },
      { id: 'id', label: t('matchmakingPage.form.options.nationality.id') },
      { id: 'other', label: t('matchmakingPage.form.options.nationality.other') },
    ],
    [t, i18n.language]
  );

  const genderOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'male', label: t('matchmakingPage.form.options.gender.male') },
      { id: 'female', label: t('matchmakingPage.form.options.gender.female') },
    ],
    [t, i18n.language]
  );

  useEffect(() => {
    if (!matchmaking?.id) return;
    // İlk render'da, mevcut başvurudan edit formunu prefill et.
    setEditOnceForm((cur) => {
      if (cur && typeof cur === 'object') return cur;

      const app = matchmaking || {};
      const details = app?.details && typeof app.details === 'object' ? app.details : {};
      const partner = app?.partnerPreferences && typeof app.partnerPreferences === 'object' ? app.partnerPreferences : {};
      const languages = details?.languages && typeof details.languages === 'object' ? details.languages : {};
      const nativeLang = languages?.native && typeof languages.native === 'object' ? languages.native : {};
      const foreignLang = languages?.foreign && typeof languages.foreign === 'object' ? languages.foreign : {};

      return {
        fullName: app?.fullName || user?.displayName || '',
        age: typeof app?.age === 'number' ? app.age : (app?.age || ''),
        city: app?.city || '',
        country: app?.country || '',
        whatsapp: app?.whatsapp || app?.phone || '',
        email: app?.email || user?.email || '',
        instagram: app?.instagram || '',
        nationality: app?.nationality || '',
        gender: app?.gender || '',
        lookingForNationality: app?.lookingForNationality || '',
        lookingForGender: app?.lookingForGender || '',
        about: app?.about || '',
        expectations: app?.expectations || '',
        details: {
          heightCm: details?.heightCm ?? details?.heightCm === 0 ? details.heightCm : '',
          weightKg: details?.weightKg ?? details?.weightKg === 0 ? details.weightKg : '',
          occupation: details?.occupation || '',
          education: details?.education || '',
          maritalStatus: details?.maritalStatus || '',
          hasChildren: details?.hasChildren || '',
          childrenCount: details?.childrenCount ?? details?.childrenCount === 0 ? details.childrenCount : '',
          incomeLevel: details?.incomeLevel || '',
          religion: details?.religion || '',
          religiousValues: details?.religiousValues || '',
          familyApprovalStatus: details?.familyApprovalStatus || '',
          marriageTimeline: details?.marriageTimeline || '',
          relocationWillingness: details?.relocationWillingness || '',
          preferredLivingCountry: details?.preferredLivingCountry || '',
          languages: {
            native: { code: nativeLang?.code || '', other: nativeLang?.other || '' },
            foreign: {
              codes: Array.isArray(foreignLang?.codes) ? foreignLang.codes : [],
              other: foreignLang?.other || '',
            },
          },
          communicationLanguage: details?.communicationLanguage || '',
          communicationLanguageOther: details?.communicationLanguageOther || '',
          communicationMethod: details?.communicationMethod || '',
          canCommunicateWithTranslationApp: !!details?.canCommunicateWithTranslationApp,
          smoking: details?.smoking || '',
          alcohol: details?.alcohol || '',
        },
        partnerPreferences: {
          heightMinCm: partner?.heightMinCm ?? partner?.heightMinCm === 0 ? partner.heightMinCm : '',
          heightMaxCm: partner?.heightMaxCm ?? partner?.heightMaxCm === 0 ? partner.heightMaxCm : '',
          ageMin: partner?.ageMin ?? partner?.ageMin === 0 ? partner.ageMin : '',
          ageMax: partner?.ageMax ?? partner?.ageMax === 0 ? partner.ageMax : '',
          maritalStatus: partner?.maritalStatus || '',
          religion: partner?.religion || '',
          communicationLanguage: partner?.communicationLanguage || '',
          communicationLanguageOther: partner?.communicationLanguageOther || '',
          canCommunicateWithTranslationApp: !!partner?.canCommunicateWithTranslationApp,
          translationAppPreference: partner?.translationAppPreference || '',
          livingCountry: partner?.livingCountry || '',
          smokingPreference: partner?.smokingPreference || '',
          alcoholPreference: partner?.alcoholPreference || '',
          childrenPreference: partner?.childrenPreference || '',
          educationPreference: partner?.educationPreference || '',
          occupationPreference: partner?.occupationPreference || '',
          familyValuesPreference: partner?.familyValuesPreference || '',
        },
      };
    });
  }, [matchmaking?.id, user?.displayName, user?.email]);

  const openWhatsApp = (text) => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/", { replace: true });
  };

  const submitEditOnce = async () => {
    if (!matchmaking?.id) return;
    if (matchmaking?.userEditOnceUsedAt) {
      setEditOnceAction({ loading: false, error: t('matchmakingPanel.profileForm.editOnceUsed'), success: '' });
      return;
    }
    if (!editOnceForm || typeof editOnceForm !== 'object') return;

    setEditOnceAction({ loading: true, error: '', success: '' });
    try {
      await authFetch('/api/matchmaking-application-edit-once', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ payload: editOnceForm }),
      });

      setEditOnceAction({ loading: false, error: '', success: t('matchmakingPanel.profileForm.editOnceSuccess') });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const mapped =
        msg === 'edit_once_used'
          ? t('matchmakingPanel.profileForm.editOnceUsed')
          : msg === 'application_not_found'
            ? t('matchmakingPanel.profileForm.editOnceErrors.notFound')
            : msg === 'empty_update'
              ? t('matchmakingPanel.profileForm.editOnceErrors.empty')
              : t('matchmakingPanel.profileForm.editOnceErrors.failed');

      setEditOnceAction({ loading: false, error: mapped, success: '' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] text-white relative">
      <Navigation />

      {/* Background (Uniqah theme) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(255,215,128,0.18),rgba(255,215,128,0)_60%)]" />
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),rgba(99,102,241,0)_60%)]" />
        <div className="absolute bottom-0 -right-24 w-[620px] h-[620px] bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.14),rgba(20,184,166,0)_60%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <section className="relative max-w-6xl mx-auto px-4 py-16">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/10 via-white/[0.06] to-transparent shadow-[0_30px_90px_rgba(0,0,0,0.45)] p-5 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-semibold text-white">{t('matchmakingPanel.title')}</h1>
              <p className="text-sm text-white/70 mt-1">{t('matchmakingPanel.subtitle')}</p>

              <div className="mt-4">
                <p className="text-sm font-semibold text-white">{t('matchmakingPanel.account.title')}</p>
                <p className="text-sm text-white/75 mt-1">
                  {t('matchmakingPanel.account.usernameLabel')}: <span className="font-semibold">{matchmaking?.username || '-'}</span>
                </p>
                {user?.displayName ? (
                  <p className="text-sm text-white/75">
                    {t('matchmakingPanel.account.nameLabel')}: <span className="font-semibold">{user.displayName}</span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/90 text-sm font-semibold hover:bg-white/[0.12] transition"
              >
                {t('matchmakingPanel.actions.logout')}
              </button>

              {!matchmakingLoading ? (
                matchmaking ? (
                  matchmaking?.userEditOnceUsedAt ? null : (
                    <Link
                      to="/evlilik/eslestirme-basvuru?editOnce=1"
                      className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-white/85 text-sm font-semibold hover:bg-white/[0.08] transition"
                    >
                      {t('matchmakingPanel.actions.profileForm')}
                    </Link>
                  )
                ) : (
                  <Link
                    to="/evlilik/eslestirme-basvuru"
                    className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] text-white/85 text-sm font-semibold hover:bg-white/[0.08] transition"
                  >
                    {t('matchmakingPanel.actions.profileForm')}
                  </Link>
                )
              ) : null}

              <details className="w-full max-w-[24rem]">
                <summary className="list-none [&::-webkit-details-marker]:hidden">
                  <div className="w-full flex justify-end">
                    <span className="inline-flex items-center justify-center w-fit px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-white/75 text-xs font-semibold hover:bg-white/[0.08] transition cursor-pointer select-none">
                      {t('matchmakingPanel.profileForm.detailsToggle')}
                    </span>
                  </div>
                </summary>

                <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/80">
                  {matchmakingLoading ? (
                    <p className="text-xs text-white/60">{t('matchmakingPanel.profileForm.loading')}</p>
                  ) : !matchmaking ? (
                    <p className="text-xs text-white/60">{t('matchmakingPanel.profileForm.empty')}</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-white/60">{t('matchmakingPanel.profileForm.applicationId')}</p>
                        <p className="font-semibold break-all">{matchmaking?.id || '-'}</p>
                      </div>

                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <dt className="text-xs text-white/60">{t('matchmakingPage.form.labels.username')}</dt>
                          <dd className="font-semibold break-words">{matchmaking?.username || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-white/60">{t('matchmakingPage.form.labels.fullName')}</dt>
                          <dd className="font-semibold break-words">{matchmaking?.fullName || user?.displayName || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-white/60">{t('matchmakingPage.form.labels.age')}</dt>
                          <dd className="font-semibold">{typeof matchmaking?.age === 'number' ? matchmaking.age : (matchmaking?.age || '-')}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-white/60">{t('matchmakingPage.form.labels.gender')}</dt>
                          <dd className="font-semibold">
                            {(() => {
                              const g = String(matchmaking?.gender || '').toLowerCase().trim();
                              return g ? (t(`matchmakingPage.form.options.gender.${g}`) || g) : '-';
                            })()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-white/60">{t('matchmakingPage.form.labels.city')}</dt>
                          <dd className="font-semibold break-words">{matchmaking?.city || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-white/60">{t('matchmakingPage.form.labels.country')}</dt>
                          <dd className="font-semibold break-words">{matchmaking?.country || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-white/60">{t('matchmakingPage.form.labels.whatsapp')}</dt>
                          <dd className="font-semibold break-words">{matchmaking?.whatsapp || matchmaking?.phone || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-white/60">{t('matchmakingPage.form.labels.maritalStatus')}</dt>
                          <dd className="font-semibold">
                            {(() => {
                              const v = String(matchmaking?.details?.maritalStatus || '').trim();
                              return v ? (t(`matchmakingPage.form.options.maritalStatus.${v}`) || v) : '-';
                            })()}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-white/60">{t('matchmakingPage.form.labels.education')}</dt>
                          <dd className="font-semibold break-words">{matchmaking?.details?.education || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-white/60">{t('matchmakingPage.form.labels.occupation')}</dt>
                          <dd className="font-semibold break-words">{matchmaking?.details?.occupation || '-'}</dd>
                        </div>
                      </dl>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <p className="text-xs text-white/60">{t('matchmakingPage.form.labels.about')}</p>
                          <p className="text-sm text-white/80 whitespace-pre-wrap">{matchmaking?.about || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60">{t('matchmakingPage.form.labels.expectations')}</p>
                          <p className="text-sm text-white/80 whitespace-pre-wrap">{matchmaking?.expectations || '-'}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10">
                        <p className="text-xs font-semibold text-white">{t('matchmakingPanel.profileForm.editOnceTitle')}</p>
                        <p className="mt-1 text-xs text-white/60">{t('matchmakingPanel.profileForm.editOnceLead')}</p>

                        {matchmaking?.userEditOnceUsedAt ? (
                          <div className="mt-2 rounded-lg border border-amber-300/30 bg-amber-500/10 p-2 text-amber-100 text-xs">
                            {t('matchmakingPanel.profileForm.editOnceUsed')}
                          </div>
                        ) : null}

                        {editOnceAction.error ? (
                          <div className="mt-2 rounded-lg border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100 text-xs">
                            {editOnceAction.error}
                          </div>
                        ) : null}
                        {editOnceAction.success ? (
                          <div className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-2 text-emerald-100 text-xs">
                            {editOnceAction.success}
                          </div>
                        ) : null}

                        {editOnceForm && !matchmaking?.userEditOnceUsedAt ? (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.fullName')}
                              <input
                                value={editOnceForm?.fullName || ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), fullName: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                              />
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.age')}
                              <input
                                inputMode="numeric"
                                value={editOnceForm?.age ?? ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), age: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                              />
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.city')}
                              <input
                                value={editOnceForm?.city || ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), city: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                              />
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.country')}
                              <input
                                value={editOnceForm?.country || ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), country: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                              />
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.whatsapp')}
                              <input
                                value={editOnceForm?.whatsapp || ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), whatsapp: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                              />
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.email')}
                              <input
                                value={editOnceForm?.email || ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), email: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                              />
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.nationality')}
                              <select
                                value={editOnceForm?.nationality || ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), nationality: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                              >
                                {nationalityOptions.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.gender')}
                              <select
                                value={editOnceForm?.gender || ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), gender: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                              >
                                {genderOptions.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.lookingForNationality')}
                              <select
                                value={editOnceForm?.lookingForNationality || ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), lookingForNationality: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                              >
                                {nationalityOptions.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.lookingForGender')}
                              <select
                                value={editOnceForm?.lookingForGender || ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), lookingForGender: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                              >
                                {genderOptions.map((o) => (
                                  <option key={o.id} value={o.id}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.height')}
                              <input
                                inputMode="numeric"
                                value={editOnceForm?.details?.heightCm ?? ''}
                                onChange={(e) =>
                                  setEditOnceForm((p) => ({
                                    ...(p || {}),
                                    details: { ...((p || {})?.details || {}), heightCm: e.target.value },
                                  }))
                                }
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                placeholder="175"
                              />
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.weight')}
                              <input
                                inputMode="numeric"
                                value={editOnceForm?.details?.weightKg ?? ''}
                                onChange={(e) =>
                                  setEditOnceForm((p) => ({
                                    ...(p || {}),
                                    details: { ...((p || {})?.details || {}), weightKg: e.target.value },
                                  }))
                                }
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                placeholder="72"
                              />
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.education')}
                              <input
                                value={editOnceForm?.details?.education || ''}
                                onChange={(e) =>
                                  setEditOnceForm((p) => ({
                                    ...(p || {}),
                                    details: { ...((p || {})?.details || {}), education: e.target.value },
                                  }))
                                }
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                              />
                            </label>

                            <label className="text-xs text-white/70">
                              {t('matchmakingPage.form.labels.occupation')}
                              <input
                                value={editOnceForm?.details?.occupation || ''}
                                onChange={(e) =>
                                  setEditOnceForm((p) => ({
                                    ...(p || {}),
                                    details: { ...((p || {})?.details || {}), occupation: e.target.value },
                                  }))
                                }
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                              />
                            </label>

                            <label className="text-xs text-white/70 sm:col-span-2">
                              {t('matchmakingPage.form.labels.about')}
                              <textarea
                                value={editOnceForm?.about || ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), about: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                rows={3}
                              />
                            </label>

                            <label className="text-xs text-white/70 sm:col-span-2">
                              {t('matchmakingPage.form.labels.expectations')}
                              <textarea
                                value={editOnceForm?.expectations || ''}
                                onChange={(e) => setEditOnceForm((p) => ({ ...(p || {}), expectations: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                rows={3}
                              />
                            </label>
                          </div>
                        ) : null}

                        <button
                          type="button"
                          onClick={submitEditOnce}
                          disabled={
                            !editOnceForm ||
                            !matchmaking ||
                            matchmakingLoading ||
                            editOnceAction.loading ||
                            !!matchmaking?.userEditOnceUsedAt
                          }
                          className="mt-3 px-4 py-2 rounded-full bg-amber-300 text-slate-950 text-sm font-semibold hover:bg-amber-200 disabled:opacity-60"
                        >
                          {editOnceAction.loading
                            ? t('matchmakingPanel.profileForm.editOnceSaving')
                            : t('matchmakingPanel.profileForm.editOnceCta')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </details>

              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => setDashboardTab('profile')}
                  className={`w-fit px-4 py-2 rounded-full border text-sm font-semibold transition ${
                    dashboardTab === 'profile'
                      ? 'border-amber-300/30 bg-amber-500/10 text-amber-100'
                      : 'border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.08]'
                  }`}
                >
                  {t('matchmakingPanel.tabs.info')}
                </button>

                <button
                  type="button"
                  onClick={() => setDashboardTab('matches')}
                  disabled={!matchmakingLoading && !matchmaking}
                  className={`w-fit px-4 py-2 rounded-full border text-sm font-semibold transition disabled:opacity-50 ${
                    dashboardTab === 'matches'
                      ? 'border-sky-300/30 bg-sky-500/10 text-sky-100'
                      : 'border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.08]'
                  }`}
                >
                  {t('matchmakingPanel.tabs.matches')}
                  {!matchmakingMatchesLoading && Array.isArray(activeMatches) && activeMatches.length ? (
                    <span className="ml-2 inline-flex items-center rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
                      {activeMatches.length}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </div>

          {location?.state?.from === "matchmakingApply" ? (
            <div className="mt-5 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-emerald-100">
              <p className="text-sm font-semibold">{t('matchmakingPanel.afterSubmit.title')}</p>
              <p className="text-sm text-emerald-100/90 mt-1">
                {t('matchmakingPanel.afterSubmit.body')}
              </p>
            </div>
          ) : null}

          {/* Not: Trust/açıklama metinleri profile tabındaki inline <details> bölümüne taşındı. */}

          <div className="mt-6 p-4">
            <div className="flex items-center gap-4">
              {(() => {
                const photo =
                  (user?.photoURL && String(user.photoURL)) ||
                  (Array.isArray(matchmaking?.photoUrls) && matchmaking.photoUrls[0]) ||
                  '';
                const title =
                  user?.displayName ||
                  (user?.email ? String(user.email).split('@')[0] : t('matchmakingPanel.account.title'));
                const profileCode = formatProfileCode(matchmaking);
                return (
                  <>
                    <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center">
                      {photo ? (
                        <img src={photo} alt={t('matchmakingPanel.application.photoAlt')} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-white/10" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold text-white truncate">{title}</div>
                        {profileCode ? (
                          <span className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
                            {t('matchmakingPanel.application.profileNo')}: {profileCode}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-white/60 truncate">
                        {user?.email ? user.email : '-'}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {!matchmakingLoading && !matchmaking ? (
            <p className="mt-6 text-xs text-white/60">
              Eşleşme profilini oluşturmadın. Önce formu doldurup profilini oluştur.
            </p>
          ) : null}

          <div className="mt-6">
            <p className="text-sm font-semibold text-white">{t('matchmakingPanel.application.title')}</p>
            {matchmakingLoading ? (
              <p className="text-sm text-white/60 mt-1">{t('common.loading')}</p>
            ) : !matchmaking ? (
              <div className="mt-3">
                <p className="text-sm font-semibold text-white">{t('matchmakingPanel.onboarding.title')}</p>
                <p className="text-sm text-white/75 mt-1">
                  {t('matchmakingPanel.onboarding.intro')}
                </p>

                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="text-xs font-semibold text-white">{t('matchmakingPanel.onboarding.rulesTitle')}</p>
                  <ul className="mt-2 space-y-1 text-sm text-white/75 list-disc pl-5">
                    <li>{t('matchmakingPanel.onboarding.rules.r1')}</li>
                    <li>{t('matchmakingPanel.onboarding.rules.r2')}</li>
                    <li>{t('matchmakingPanel.onboarding.rules.r3')}</li>
                    <li>{t('matchmakingPanel.onboarding.rules.r4')}</li>
                  </ul>
                </div>

                <label className="mt-3 inline-flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    className="accent-amber-400"
                    checked={onboardingChecked}
                    onChange={(e) => setOnboardingChecked(e.target.checked)}
                  />
                  {t('matchmakingPanel.onboarding.confirm')}
                </label>

                <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <button
                    type="button"
                    disabled={!onboardingChecked}
                    onClick={() => {
                      try {
                        localStorage.setItem('mk_onboarding_accepted', onboardingChecked ? '1' : '0');
                      } catch (e) {
                        // ignore
                      }
                      setOnboardingAccepted(true);
                      navigate(matchmakingNext, { replace: true, state: { from: 'panelOnboarding' } });
                    }}
                    className="px-4 py-2 rounded-full bg-amber-300 text-slate-950 text-sm font-semibold hover:bg-amber-200 disabled:opacity-60"
                  >
                    {t('matchmakingPanel.onboarding.startForm')}
                  </button>

                  <Link to="/uniqah" className="text-sm font-semibold text-sky-200 hover:underline">
                    {t('matchmakingPanel.onboarding.howWorks')}
                  </Link>
                </div>

                <p className="mt-3 text-xs text-white/60">
                  {t('matchmakingPanel.onboarding.note')}
                </p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 space-y-3">
                  {dashboardTab === 'matches' ? (
                    <div className="rounded-2xl border border-amber-300/20 bg-white/[0.06] p-4 lg:sticky lg:top-24 self-start shadow-[0_25px_80px_rgba(245,158,11,0.10)] flex flex-col h-[calc(100vh-9rem)] min-h-[28rem]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Sohbet</p>
                        </div>
                      </div>

                      <div className="flex-1 min-h-0">
                        {focusedChatMatchId ? (
                          renderFocusedChat(focusedChatMatchId)
                        ) : (
                          <p className="mt-3 text-sm text-white/60">Şu an sohbet aktif değil.</p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {dashboardTab === 'matches' ? null : (
                    <>
                  <div className="pb-3 border-b border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{matchmaking?.username || user?.displayName || t('matchmakingPanel.application.fallbackName')}</p>
                        {formatProfileCode(matchmaking) ? (
                          <p className="text-xs text-white/60 mt-1">
                            {t('matchmakingPanel.application.profileNo')}: <span className="font-semibold">{formatProfileCode(matchmaking)}</span>
                          </p>
                        ) : null}
                        <p className="text-xs text-white/60 mt-1">
                          {t('matchmakingPanel.application.applicationId')}: <span className="font-semibold">{shortInternalId(matchmaking.id)}</span>
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-end gap-4">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-white/60">{t('matchmakingPanel.common.status')}</p>
                          <p className="text-sm font-semibold text-white">{matchmaking.status || "-"}</p>
                        </div>

                        {/* Fotoğraflarım: kullanıcı adı satırıyla aynı hizada, en sağda */}
                        {dashboardTab === 'profile' ? (
                          <div className="text-left sm:text-right">
                            <div className="flex items-center justify-start sm:justify-end gap-2">
                              <p className="text-xs text-white/60">{t('matchmakingPanel.photos.title')}</p>
                              {Array.isArray(matchmaking.photoUrls) && matchmaking.photoUrls.filter(Boolean).length ? (
                                <span className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
                                  {matchmaking.photoUrls.filter(Boolean).length}
                                </span>
                              ) : null}
                            </div>

                            {Array.isArray(matchmaking.photoUrls) && matchmaking.photoUrls.filter(Boolean).length ? (
                              <div className="mt-2 flex justify-start sm:justify-end">
                                <a
                                  href={matchmaking.photoUrls.filter(Boolean)[0]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2"
                                  title={t('matchmakingPanel.photos.title')}
                                >
                                  <img
                                    src={matchmaking.photoUrls.filter(Boolean)[0]}
                                    alt={t('matchmakingPanel.photos.title')}
                                    className="h-12 w-12 rounded-xl object-cover border border-white/10"
                                    loading="lazy"
                                  />
                                </a>
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-white/60">{t('matchmakingPanel.photos.empty')}</p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {Array.isArray(matchmaking.photoUrls) && matchmaking.photoUrls.length > 0 ? (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {matchmaking.photoUrls.filter(Boolean).slice(0, 3).map((u) => (
                          <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={u} alt="Foto" className="w-full h-32 object-cover rounded-xl border border-white/10" loading="lazy" />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    {dashboardTab === 'profile' ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{t('matchmakingPanel.photos.updateRequest.title')}</p>
                            <p className="mt-1 text-xs text-white/60">{t('matchmakingPanel.photos.updateRequest.lead')}</p>
                          </div>
                          {String(matchmaking?.photoUpdate?.status || '') === 'pending' ? (
                            <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-300/20 px-3 py-1 text-xs font-semibold text-amber-100">
                              {t('matchmakingPanel.photos.updateRequest.pending')}
                            </span>
                          ) : null}
                        </div>

                        {photoUpdateAction.error ? (
                          <div className="mt-3 rounded-lg border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100 text-xs">
                            {photoUpdateAction.error}
                          </div>
                        ) : null}
                        {photoUpdateAction.success ? (
                          <div className="mt-3 rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-2 text-emerald-100 text-xs">
                            {photoUpdateAction.success}
                          </div>
                        ) : null}

                        {String(matchmaking?.photoUpdate?.status || '') === 'pending' ? null : (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[1, 2, 3].map((idx) => {
                              const key = `photo${idx}`;
                              const file = photoUpdateFiles?.[key] || null;
                              return (
                                <div key={key} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                  <p className="text-xs font-semibold text-white/80">{t(`matchmakingPage.form.labels.${key}`)}</p>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="mt-2 block w-full text-xs text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white/90 hover:file:bg-white/15"
                                    onChange={(e) =>
                                      setPhotoUpdateFiles((p) => ({
                                        ...p,
                                        [key]: e.target.files?.[0] || null,
                                      }))
                                    }
                                  />
                                  <p className="mt-2 text-[11px] text-white/60 break-words">{file?.name || t('matchmakingPage.form.photo.noFileChosen')}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {String(matchmaking?.photoUpdate?.status || '') === 'pending' ? null : (
                          <button
                            type="button"
                            onClick={requestPhotoUpdate}
                            disabled={photoUpdateAction.loading}
                            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/90 text-sm font-semibold hover:bg-white/[0.16] disabled:opacity-60"
                          >
                            {photoUpdateAction.loading ? t('matchmakingPanel.photos.updateRequest.uploading') : t('matchmakingPanel.photos.updateRequest.cta')}
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Not: Fotoğraflarım bölümü üst satırın sağına taşındı. */}

                  {dashboardTab === 'profile' ? (
                  <div className="pt-3">
                    <p className="text-xs font-semibold text-white">{t('matchmakingPanel.dashboard.title')}</p>
                    <p className="mt-1 text-xs text-white/60">{t('matchmakingPanel.dashboard.subtitle')}</p>

                    <details className="mt-3 border-t border-white/10 pt-3" open>
                      <summary className="cursor-pointer text-sm font-semibold text-white">{t('matchmakingPanel.intro.title')}</summary>
                      <div className="mt-2 text-sm text-white/75">{t('matchmakingPanel.intro.body')}</div>
                      <ol className="mt-3 list-decimal pl-5 space-y-2 text-sm text-white/80">
                        {introPoints.map((x, idx) => (
                          <li key={idx}>{x}</li>
                        ))}
                      </ol>
                    </details>

                    <details className="mt-3 border-t border-white/10 pt-3" open={!canTakeActions}>
                      <summary className="cursor-pointer text-sm font-semibold text-white">{t('matchmakingPanel.activation.title')}</summary>

                      <div className="mt-2 text-sm text-white/75">{t('matchmakingPanel.activation.lead')}</div>
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-xs font-semibold text-white">{t('matchmakingPanel.membership.title')}</p>
                        <p className="mt-1 text-sm text-white/75">{membershipStatusText}</p>
                      </div>

                      {myGender === 'female' && !canTakeActions ? (
                        <div className="mt-3 rounded-xl border border-sky-300/30 bg-sky-500/10 p-3">
                          <p className="text-xs font-semibold text-sky-100">{t('matchmakingPanel.activation.freeActiveTitle')}</p>
                          <p className="mt-1 text-sm text-white/75">{t('matchmakingPanel.activation.freeActiveBody')}</p>

                          {freeActiveApplyAction.error ? (
                            <div className="mt-2 rounded-lg border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100 text-xs">
                              {freeActiveApplyAction.error}
                            </div>
                          ) : null}
                          {freeActiveApplyAction.success ? (
                            <div className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-2 text-emerald-100 text-xs">
                              {freeActiveApplyAction.success}
                            </div>
                          ) : null}

                          <button
                            type="button"
                            onClick={applyFreeActiveMembership}
                            disabled={freeActiveApplyAction.loading || myMembership.active || myFreeActive.eligible || myFreeActive.blocked || !myIdentityVerified}
                            className="mt-3 px-4 py-2 rounded-full bg-sky-700 text-white text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                          >
                            {freeActiveApplyAction.loading ? t('matchmakingPanel.membership.freeActiveApplying') : t('matchmakingPanel.membership.freeActiveApply')}
                          </button>

                          {!myIdentityVerified ? (
                            <p className="mt-2 text-xs text-white/60">{t('matchmakingPanel.activation.freeActiveNeedsVerification')}</p>
                          ) : null}
                        </div>
                      ) : null}

                      {!canTakeActions ? (
                        <div className="mt-3 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-3">
                          <p className="text-xs font-semibold text-emerald-100">{t('matchmakingPanel.activation.paymentTitle')}</p>
                          <p className="text-sm text-white/75 mt-1">{t('matchmakingPanel.activation.paymentBody')}</p>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                              <p className="text-xs font-semibold text-white">{t('matchmakingPanel.matches.payment.trTitle')}</p>
                              <p className="text-sm text-white/75 mt-1">{t('matchmakingPanel.matches.payment.amount')}: <span className="font-semibold">{prices.TRY} TL</span></p>
                              {import.meta?.env?.VITE_MATCHMAKING_TR_ACCOUNT_NAME || import.meta?.env?.VITE_MATCHMAKING_TR_IBAN ? (
                                <div className="mt-2 text-xs text-white/75">
                                  {import.meta?.env?.VITE_MATCHMAKING_TR_ACCOUNT_NAME ? (
                                    <p>{t('matchmakingPanel.matches.payment.recipient')}: <span className="font-semibold">{import.meta.env.VITE_MATCHMAKING_TR_ACCOUNT_NAME}</span></p>
                                  ) : null}
                                  {import.meta?.env?.VITE_MATCHMAKING_TR_IBAN ? (
                                    <p>{t('matchmakingPanel.matches.payment.iban')}: <span className="font-semibold">{import.meta.env.VITE_MATCHMAKING_TR_IBAN}</span></p>
                                  ) : null}
                                </div>
                              ) : (
                                <p className="mt-2 text-xs text-white/60">{t('matchmakingPanel.matches.payment.detailsSoon')}</p>
                              )}
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                              <p className="text-xs font-semibold text-white">{t('matchmakingPanel.matches.payment.idTitle')}</p>
                              <p className="text-sm text-white/75 mt-1">{t('matchmakingPanel.matches.payment.amount')}: <span className="font-semibold">{prices.IDR} IDR</span></p>
                              {import.meta?.env?.VITE_MATCHMAKING_ID_QRIS_URL ? (
                                <a
                                  href={import.meta.env.VITE_MATCHMAKING_ID_QRIS_URL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-block text-xs font-semibold text-sky-200 hover:underline"
                                >
                                  {t('matchmakingPanel.matches.payment.payWithQris')}
                                </a>
                              ) : null}
                              {import.meta?.env?.VITE_MATCHMAKING_ID_BANK_DETAILS ? (
                                <p className="mt-2 text-xs text-white/75 whitespace-pre-wrap">{import.meta.env.VITE_MATCHMAKING_ID_BANK_DETAILS}</p>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-xs font-semibold text-white">{t('matchmakingPanel.activation.selectMatchTitle')}</p>
                            <p className="mt-1 text-[11px] text-white/55">{t('matchmakingPanel.activation.selectMatchHelp')}</p>
                            <select
                              value={paymentMatchId}
                              onChange={(e) => setPaymentMatchId(e.target.value)}
                              className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                              disabled={!Array.isArray(activeMatches) || activeMatches.length === 0}
                            >
                              <option value="">{t('matchmakingPanel.activation.selectMatchPlaceholder')}</option>
                              {(Array.isArray(activeMatches) ? activeMatches : []).map((m) => (
                                <option key={m.id} value={m.id}>
                                  {(() => {
                                    const matchId = String(m?.id || '');
                                    const matchCode = typeof m?.matchCode === 'string' && m.matchCode.trim()
                                      ? m.matchCode.trim()
                                      : (matchCodeById?.[matchId] || shortInternalId(matchId) || matchId);
                                    return t('matchmakingPanel.activation.matchOption', {
                                      status: String(m?.status || ''),
                                      matchId: matchCode,
                                      matchCode,
                                    });
                                  })()}
                                </option>
                              ))}
                            </select>

                            {!matchmakingPaymentsLoading && paymentMatchId && latestPaymentByMatchId?.[paymentMatchId]?.status === 'pending' ? (
                              <p className="mt-2 text-xs text-amber-200 font-semibold">
                                {t('matchmakingPanel.matches.payment.pendingNotice')}
                              </p>
                            ) : null}
                          </div>

                          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                            <p className="text-xs font-semibold text-white">{t('matchmakingPanel.matches.payment.reportTitle')}</p>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <label className="text-xs text-white/70">
                                {t('matchmakingPanel.matches.payment.currency')}
                                <select
                                  value={paymentForm.currency}
                                  onChange={(e) => setPaymentForm((p) => ({ ...p, currency: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                                >
                                  <option value="TRY">{t('matchmakingPanel.matches.payment.currencyTRY')}</option>
                                  <option value="IDR">{t('matchmakingPanel.matches.payment.currencyIDR')}</option>
                                </select>
                              </label>
                              <label className="text-xs text-white/70">
                                {t('matchmakingPanel.matches.payment.method')}
                                <select
                                  value={paymentForm.method}
                                  onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                                >
                                  <option value="eft_fast">{t('matchmakingPanel.matches.payment.methodEftFast')}</option>
                                  <option value="swift_wise">{t('matchmakingPanel.matches.payment.methodSwiftWise')}</option>
                                  <option value="qris">{t('matchmakingPanel.matches.payment.methodQris')}</option>
                                  <option value="other">{t('matchmakingPanel.matches.payment.methodOther')}</option>
                                </select>
                              </label>

                              <label className="text-xs text-white/70 sm:col-span-2">
                                {t('matchmakingPanel.matches.payment.reference')}
                                <input
                                  value={paymentForm.reference}
                                  onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                  placeholder={t('matchmakingPanel.matches.payment.referencePlaceholder')}
                                />
                              </label>

                              <label className="text-xs text-white/70 sm:col-span-2">
                                {t('matchmakingPanel.matches.payment.note')}
                                <textarea
                                  value={paymentForm.note}
                                  onChange={(e) => setPaymentForm((p) => ({ ...p, note: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                  rows={2}
                                  placeholder={t('matchmakingPanel.matches.payment.notePlaceholder')}
                                />
                              </label>

                              <label className="text-xs text-white/70 sm:col-span-2">
                                {t('matchmakingPanel.matches.payment.receipt')}
                                <div className="mt-1 flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const f = e?.target?.files?.[0];
                                      if (f) uploadReceipt(f);
                                    }}
                                    className="block w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/15"
                                    disabled={receiptUpload.loading}
                                  />
                                  <button
                                    type="button"
                                    className="px-4 py-2 rounded-full border border-white/15 text-white/85 text-sm font-semibold hover:bg-white/[0.08]"
                                    onClick={() => setPaymentForm((p) => ({ ...p, receiptUrl: '' }))}
                                    disabled={receiptUpload.loading || !paymentForm.receiptUrl}
                                  >
                                    {t('matchmakingPanel.actions.remove')}
                                  </button>
                                </div>
                                <p className="mt-1 text-[11px] text-white/50">
                                  {t('matchmakingPanel.matches.payment.receiptHelp')}
                                </p>
                              </label>

                              <label className="text-xs text-white/70 sm:col-span-2">
                                {t('matchmakingPanel.matches.payment.receiptLink')}
                                <input
                                  value={paymentForm.receiptUrl}
                                  onChange={(e) => setPaymentForm((p) => ({ ...p, receiptUrl: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                  placeholder="https://..."
                                />
                                {paymentForm.receiptUrl ? (
                                  <a
                                    href={paymentForm.receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 inline-block text-xs font-semibold text-sky-200 hover:underline"
                                  >
                                    {t('matchmakingPanel.matches.payment.viewReceipt')}
                                  </a>
                                ) : null}
                              </label>
                            </div>

                            {receiptUpload.error ? (
                              <div className="mt-2 rounded-lg border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100 text-xs">
                                {receiptUpload.error}
                              </div>
                            ) : null}
                            {receiptUpload.loading ? (
                              <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/60 text-xs">
                                {t('matchmakingPanel.matches.payment.uploadingReceipt')}
                              </div>
                            ) : null}

                            {paymentAction.error && paymentAction.matchId === paymentMatchId ? (
                              <div className="mt-2 rounded-lg border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100 text-xs">
                                {paymentAction.error}
                              </div>
                            ) : null}
                            {paymentAction.success && paymentAction.matchId === paymentMatchId ? (
                              <div className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-2 text-emerald-100 text-xs">
                                {paymentAction.success}
                              </div>
                            ) : null}

                            <button
                              type="button"
                              disabled={
                                !paymentMatchId ||
                                receiptUpload.loading ||
                                (paymentAction.loading && paymentAction.matchId === paymentMatchId) ||
                                (!matchmakingPaymentsLoading && latestPaymentByMatchId?.[paymentMatchId]?.status === 'pending')
                              }
                              onClick={() => submitPayment(paymentMatchId)}
                              className="mt-3 px-4 py-2 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60"
                            >
                              {paymentAction.loading && paymentAction.matchId === paymentMatchId
                                ? t('matchmakingPanel.actions.sending')
                                : (!matchmakingPaymentsLoading && latestPaymentByMatchId?.[paymentMatchId]?.status === 'pending')
                                  ? t('matchmakingPanel.actions.pending')
                                  : t('matchmakingPanel.matches.payment.sendPayment', { amount: (paymentForm.currency === 'IDR' ? prices.IDR : prices.TRY), currency: paymentForm.currency })}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const matchId = paymentMatchId || '';
                                const matchCode = matchCodeById?.[matchId] || shortInternalId(matchId) || '-';
                                const msg = t('matchmakingPanel.matches.payment.supportWhatsappMessage', { matchId: matchId || '-', matchCode });
                                openWhatsApp(msg);
                              }}
                              className="mt-3 px-4 py-2 rounded-full border border-emerald-300 text-emerald-900 text-sm font-semibold hover:bg-emerald-50"
                              disabled={!whatsappNumber}
                            >
                              {t('matchmakingPanel.matches.payment.supportWhatsapp')}
                            </button>

                            {!paymentMatchId ? (
                              <p className="mt-2 text-xs text-white/60">{t('matchmakingPanel.activation.selectMatchRequired')}</p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </details>

                    <details className="mt-3 border-t border-white/10 pt-3">
                      <summary className="cursor-pointer text-sm font-semibold text-white">{t('matchmakingPanel.rules.title')}</summary>
                      <div className="mt-2 text-sm text-white/60">{t('matchmakingPanel.rules.lead')}</div>
                      <div className="mt-3 space-y-4 text-sm text-white/80">
                        <div>
                          <p className="text-xs font-semibold text-white">{t('matchmakingPanel.rules.promise.title')}</p>
                          <ul className="mt-2 list-disc pl-5 space-y-2">
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.promise.p1Title')}:</span> {t('matchmakingPanel.rules.promise.p1Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.promise.p2Title')}:</span> {t('matchmakingPanel.rules.promise.p2Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.promise.p3Title')}:</span> {t('matchmakingPanel.rules.promise.p3Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.promise.p4Title')}:</span> {t('matchmakingPanel.rules.promise.p4Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.promise.p5Title')}:</span> {t('matchmakingPanel.rules.promise.p5Body')}</li>
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-white">{t('matchmakingPanel.rules.zeroTolerance.title')}</p>
                          <ul className="mt-2 list-disc pl-5 space-y-2">
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r1Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r1Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r2Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r2Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r3Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r3Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r4Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r4Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r5Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r5Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r6Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r6Body')}</li>
                          </ul>
                        </div>

                        <div className="border-l-2 border-rose-300/30 pl-3 text-rose-100">
                          <p className="text-xs font-semibold">{t('matchmakingPanel.rules.enforcement.title')}</p>
                          <ul className="mt-2 list-disc pl-5 space-y-2 text-sm">
                            <li>{t('matchmakingPanel.rules.enforcement.e1a')} <span className="font-semibold">{t('matchmakingPanel.rules.enforcement.e1b')}</span> {t('matchmakingPanel.rules.enforcement.e1c')}</li>
                            <li>{t('matchmakingPanel.rules.enforcement.e2a')} <span className="font-semibold">{t('matchmakingPanel.rules.enforcement.e2b')}</span>.</li>
                            <li>{t('matchmakingPanel.rules.enforcement.e3a')} <span className="font-semibold">{t('matchmakingPanel.rules.enforcement.e3b')}</span>.</li>
                            <li>{t('matchmakingPanel.rules.enforcement.e4a')} <span className="font-semibold">{t('matchmakingPanel.rules.enforcement.e4b')}</span>.</li>
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-white">{t('matchmakingPanel.rules.complaint.title')}</p>
                          <p className="mt-2 text-sm text-white/75">{t('matchmakingPanel.rules.complaint.body')}</p>
                          {complaintLeadExtra ? (
                            <p className="mt-2 text-sm text-white/75">{complaintLeadExtra}</p>
                          ) : null}
                        </div>
                      </div>
                    </details>

                    <details className="mt-3 border-t border-white/10 pt-3">
                      <summary className="cursor-pointer text-sm font-semibold text-white">{t('matchmakingPanel.dashboard.faq.title')}</summary>
                      <div className="mt-3 space-y-3">
                        {dashboardFaqItems.map((it, idx) => (
                          <div key={idx} className="py-2 border-b border-white/10 last:border-b-0">
                            <div className="text-xs font-semibold text-white">{it?.q || ''}</div>
                            <div className="mt-1 text-sm text-white/75 whitespace-pre-wrap">{it?.a || ''}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                  ) : null}

                    </>
                  )}
                </div>

                {/* Profilim/Açıklamalar: sağ sütun boşluğunu trust bloğu ile doldur */}
                <div className={`${dashboardTab === 'profile' ? '' : 'hidden'} lg:col-span-7 lg:col-start-6 p-4 lg:sticky lg:top-24 self-start`}>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm font-semibold text-white">{t('matchmakingPanel.trust.title')}</p>
                    <p className="mt-2 text-sm text-white/75 leading-relaxed">{t('matchmakingPanel.trust.lead')}</p>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 border-l-2 border-white/10">
                        <p className="text-xs font-semibold text-amber-200">{t('matchmakingPanel.trust.cards.quality.title')}</p>
                        <p className="mt-1 text-xs text-white/70 leading-relaxed">{t('matchmakingPanel.trust.cards.quality.body')}</p>
                      </div>
                      <div className="p-3 border-l-2 border-white/10">
                        <p className="text-xs font-semibold text-sky-200">{t('matchmakingPanel.trust.cards.privacy.title')}</p>
                        <p className="mt-1 text-xs text-white/70 leading-relaxed">{t('matchmakingPanel.trust.cards.privacy.body')}</p>
                      </div>
                      <div className="p-3 border-l-2 border-white/10">
                        <p className="text-xs font-semibold text-emerald-200">{t('matchmakingPanel.trust.cards.control.title')}</p>
                        <p className="mt-1 text-xs text-white/70 leading-relaxed">{t('matchmakingPanel.trust.cards.control.body')}</p>
                      </div>
                    </div>

                    {trustRules.length ? (
                      <div className="mt-4 p-3 border-l-2 border-white/10">
                        <p className="text-xs font-semibold text-white">{t('matchmakingPanel.trust.rulesTitle')}</p>
                        <ul className="mt-2 space-y-1 text-sm text-white/75 list-disc pl-5">
                          {trustRules.map((x, idx) => (
                            <li key={idx}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className={`${dashboardTab === 'matches' ? '' : 'hidden'} lg:col-span-7 lg:col-start-6 p-4 lg:sticky lg:top-24 self-start`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {!(!matchmakingUserLoading && lockInfo.active && lockInfo.matchId && activeMatches.some((m) => m?.id === lockInfo.matchId)) ? (
                        <>
                          <p className="text-sm font-semibold text-white">{t('matchmakingPanel.matches.title')}</p>
                          <p className="text-xs text-white/60 mt-1">{t('matchmakingPanel.matches.subtitle')}</p>
                        </>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {!matchmakingMatchesLoading && !lockInfo.active && proposedMatchesCount > 0 ? (
                        <button
                          type="button"
                          onClick={rejectAllMatches}
                          disabled={rejectAllAction.loading}
                          className="px-3 py-2 rounded-full border border-rose-300/30 text-rose-100 text-xs font-semibold hover:bg-rose-500/10 disabled:opacity-60"
                        >
                          {rejectAllAction.loading ? t('matchmakingPanel.actions.sending') : t('matchmakingPanel.actions.rejectAll')}
                        </button>
                      ) : null}
                      {matchmakingMatchesLoading ? (
                        <span className="text-xs text-white/50">{t('common.loading')}</span>
                      ) : null}
                    </div>
                  </div>

                  {!matchmakingUserLoading && lockInfo.active ? (
                    lockInfo.matchId && activeMatches.some((m) => m?.id === lockInfo.matchId) ? null : (
                      <>
                        <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-amber-100 text-sm">
                          <p className="font-semibold">{t('matchmakingPanel.lock.title')}</p>
                          <p className="mt-1">{t('matchmakingPanel.lock.body')}</p>
                        </div>

                        {lockInfo.matchId ? (
                          <p className="mt-2 text-xs text-amber-100/90">
                            {t('matchmakingPanel.lock.matchId')}:{' '}
                            <span className="font-semibold">{lockInfo.matchCode || matchCodeById?.[lockInfo.matchId] || shortInternalId(lockInfo.matchId)}</span>
                          </p>
                        ) : null}
                      </>
                    )
                  ) : null}

                  {matchmakingAction.error ? (
                    <div className="mt-3 rounded-xl border border-rose-300/30 bg-rose-500/10 p-3 text-rose-100 text-sm">
                      {matchmakingAction.error}
                    </div>
                  ) : null}

                  {!canSeeFullProfiles ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-white/80 text-sm">
                      <p className="font-semibold">
                        {myGender === 'female' ? t('matchmakingPanel.membershipOrVerificationGate.title') : t('matchmakingPanel.membershipGate.title')}
                      </p>
                      <p className="mt-1 text-white/70">
                        {myGender === 'female' ? t('matchmakingPanel.membershipOrVerificationGate.body') : t('matchmakingPanel.membershipGate.body')}
                      </p>

                      {requestNewAction.error ? (
                        <div className="mt-2 rounded-lg border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100 text-xs">
                          {requestNewAction.error}
                        </div>
                      ) : null}
                      {requestNewAction.success ? (
                        <div className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-2 text-emerald-100 text-xs">
                          {requestNewAction.success}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {rejectAllAction.error ? (
                    <div className="mt-3 rounded-xl border border-rose-300/30 bg-rose-500/10 p-3 text-rose-100 text-sm">
                      {rejectAllAction.error}
                    </div>
                  ) : null}

                  {rejectAllAction.success ? (
                    <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-emerald-100 text-sm">
                      {rejectAllAction.success}
                    </div>
                  ) : null}

                  {!matchmakingMatchesLoading && activeMatches.length === 0 ? (
                    <p className="text-sm text-white/60 mt-3">{t('matchmakingPanel.matches.empty')}</p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {activeMatches.map((m) => {
                        const isA = m?.aUserId === user?.uid;
                        const mySide = isA ? 'a' : 'b';
                        const otherSide = isA ? 'b' : 'a';
                        const otherFromSnap = m?.profiles?.[otherSide] || {};
                        const details = canSeeFullProfiles ? (candidateDetailsByMatchId?.[m.id] || null) : null;
                        const other = details ? { ...otherFromSnap, ...details } : otherFromSnap;
                        const myDecision = m?.decisions?.[mySide] || null;
                        const otherDecision = m?.decisions?.[otherSide] || null;

                        const profileInfoOpen = !!profileInfoOpenByMatchId?.[m.id];
                        const showEmptyProfileFields = !!profileInfoShowEmptyByMatchId?.[m.id];

                        const displayName = other?.username || other?.fullName || t('matchmakingPanel.matches.candidate.fallbackName');
                        const maritalCode = other?.details?.maritalStatus || '';
                        const maritalLabel = maritalCode ? (t(`matchmakingPage.form.options.maritalStatus.${maritalCode}`) || maritalCode) : '-';

                        const showHeart = otherDecision === 'accept' && myDecision !== 'accept';
                        const unreadCount =
                          user?.uid && typeof m?.chatUnreadByUid?.[user.uid] === 'number' ? m.chatUnreadByUid[user.uid] : 0;

                        const showInlineLockNotice = !matchmakingUserLoading && lockInfo.active && !!lockInfo.matchId && lockInfo.matchId === m.id;

                        return (
                          <div key={m.id}>
                          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {displayName}{typeof other.age === 'number' ? ` (${other.age})` : ''}

                                  {canSeeFullProfiles ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProfileInfoOpenByMatchId((p) => ({ ...p, [m.id]: !p?.[m.id] }));
                                        if (!profileInfoOpen) loadCandidateDetails(m.id);
                                      }}
                                      className="ml-2 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/80 hover:bg-white/10"
                                    >
                                      {profileInfoOpen
                                        ? t('matchmakingPanel.matches.candidate.hideProfileInfo')
                                        : t('matchmakingPanel.matches.candidate.profileInfo')}
                                    </button>
                                  ) : null}

                                  {unreadCount > 0 ? (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-rose-500/10 border border-rose-300/30 px-2 py-0.5 text-[11px] font-semibold text-rose-100">
                                      {unreadCount}
                                    </span>
                                  ) : null}
                                  {other?.identityVerified ? (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-300/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                                      {t('matchmakingPanel.matches.candidate.verifiedBadge')}
                                    </span>
                                  ) : null}
                                  {other?.proMember ? (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-violet-500/10 border border-violet-300/30 px-2 py-0.5 text-[11px] font-semibold text-violet-100">
                                      {t('matchmakingPanel.matches.candidate.proBadge')}
                                    </span>
                                  ) : null}
                                </p>
                                {formatProfileCode(other) ? (
                                  <p className="text-xs text-white/60 mt-1">
                                    {t('matchmakingPanel.matches.candidate.matchedProfile')}: <span className="font-semibold">{formatProfileCode(other)}</span>
                                  </p>
                                ) : null}
                                {canSeeFullProfiles ? (
                                  <p className="text-xs text-white/60 mt-1">
                                    {t('matchmakingPanel.matches.candidate.score')}: <span className="font-semibold">{typeof m.score === 'number' ? `%${m.score}` : '-'}</span>
                                    {showHeart ? <span className="ml-2 text-rose-200 font-semibold">{t('matchmakingPanel.matches.candidate.likeBadge')}</span> : null}
                                  </p>
                                ) : (
                                  <p className="text-xs text-white/60 mt-1">
                                    {t('matchmakingPanel.matches.candidate.maritalStatus')}: <span className="font-semibold">{maritalLabel}</span>
                                  </p>
                                )}
                                <p className="text-xs text-white/60">
                                  {other.city ? `${other.city}${other.country ? ` / ${other.country}` : ''}` : (other.country || '-')}
                                </p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-xs text-white/60">{t('matchmakingPanel.common.status')}</p>
                                <p className="text-sm font-semibold text-white">{m.status || '-'}</p>
                              </div>
                            </div>

                            {Array.isArray(other.photoUrls) && other.photoUrls.length > 0 ? (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {other.photoUrls.filter(Boolean).slice(0, canSeeFullProfiles ? 3 : 1).map((u) => (
                                  <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="block">
                                    <img
                                      src={u}
                                      alt={t('matchmakingPanel.matches.candidate.photoAlt')}
                                      className="w-full h-40 object-cover rounded-xl border border-white/10"
                                      loading="lazy"
                                    />
                                  </a>
                                ))}
                              </div>
                            ) : null}

                            {profileInfoOpen && canSeeFullProfiles ? (
                              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-xs font-semibold text-white">{t('matchmakingPanel.matches.candidate.profileInfoTitle')}</p>
                                  <button
                                    type="button"
                                    onClick={() => setProfileInfoShowEmptyByMatchId((p) => ({ ...p, [m.id]: !p?.[m.id] }))}
                                    className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/80 hover:bg-white/10"
                                  >
                                    {showEmptyProfileFields
                                      ? t('matchmakingPanel.matches.candidate.hideEmptyFields')
                                      : t('matchmakingPanel.matches.candidate.showEmptyFields')}
                                  </button>
                                </div>

                                {candidateDetailsLoadingByMatchId?.[m.id] ? (
                                  <p className="mt-2 text-xs text-white/60">{t('common.loading')}</p>
                                ) : null}

                                {(() => {
                                  const d = other?.details && typeof other.details === 'object' ? other.details : {};

                                  const meRows = filterEmptyRows(
                                    [
                                      { label: t('matchmakingPage.form.labels.username'), value: formatMaybeValue(other?.username) },
                                      { label: t('matchmakingPage.form.labels.fullName'), value: formatMaybeValue(other?.fullName) },
                                      { label: t('matchmakingPage.form.labels.age'), value: typeof other?.age === 'number' ? String(other.age) : '-' },
                                      { label: t('matchmakingPage.form.labels.city'), value: formatMaybeValue(other?.city) },
                                      { label: t('matchmakingPage.form.labels.country'), value: formatMaybeValue(other?.country) },
                                      {
                                        label: t('matchmakingPage.form.labels.nationality'),
                                        value: formatMaybeValue(tOption('nationality', other?.nationality) || other?.nationality),
                                      },
                                      {
                                        label: t('matchmakingPage.form.labels.gender'),
                                        value: formatMaybeValue(tOption('gender', other?.gender) || other?.gender),
                                      },
                                    ],
                                    showEmptyProfileFields
                                  );

                                  const personalRows = filterEmptyRows(
                                    [
                                      { label: t('matchmakingPage.form.labels.height'), value: formatMaybeValue(d?.heightCm, ' cm') },
                                      { label: t('matchmakingPage.form.labels.weight'), value: formatMaybeValue(d?.weightKg, ' kg') },
                                      { label: t('matchmakingPage.form.labels.education'), value: formatMaybeValue(tOption('education', d?.education) || d?.education) },
                                      { label: t('matchmakingPage.form.labels.educationDepartment'), value: formatMaybeValue(d?.educationDepartment) },
                                      { label: t('matchmakingPage.form.labels.occupation'), value: formatMaybeValue(tOption('occupation', d?.occupation) || d?.occupation) },
                                      { label: t('matchmakingPage.form.labels.maritalStatus'), value: formatMaybeValue(tOption('maritalStatus', d?.maritalStatus) || d?.maritalStatus) },
                                      { label: t('matchmakingPage.form.labels.hasChildren'), value: formatMaybeValue(tYesNoCommon(d?.hasChildren) || d?.hasChildren) },
                                      { label: t('matchmakingPage.form.labels.childrenCount'), value: formatMaybeValue(d?.childrenCount) },
                                      { label: t('matchmakingPage.form.labels.incomeLevel'), value: formatMaybeValue(tOption('income', d?.incomeLevel) || d?.incomeLevel) },
                                      { label: t('matchmakingPage.form.labels.religion'), value: formatMaybeValue(tOption('religion', d?.religion) || d?.religion) },
                                      { label: t('matchmakingPage.form.labels.religiousValues'), value: formatMaybeValue(d?.religiousValues) },
                                      { label: t('matchmakingPage.form.labels.familyApprovalStatus'), value: formatMaybeValue(tOption('familyApproval', d?.familyApprovalStatus) || d?.familyApprovalStatus) },
                                      { label: t('matchmakingPage.form.labels.marriageTimeline'), value: formatMaybeValue(tOption('timeline', d?.marriageTimeline) || d?.marriageTimeline) },
                                      { label: t('matchmakingPage.form.labels.relocationWillingness'), value: formatMaybeValue(tYesNoCommon(d?.relocationWillingness) || d?.relocationWillingness) },
                                      { label: t('matchmakingPage.form.labels.preferredLivingCountry'), value: formatMaybeValue(tOption('livingCountry', d?.preferredLivingCountry) || d?.preferredLivingCountry) },
                                      { label: t('matchmakingPage.form.labels.communicationLanguages'), value: formatMaybeValue(tOption('commLanguage', d?.communicationLanguage) || d?.communicationLanguage) },
                                      { label: t('matchmakingPage.form.labels.smoking'), value: formatMaybeValue(tYesNoCommon(d?.smoking) || d?.smoking) },
                                      { label: t('matchmakingPage.form.labels.alcohol'), value: formatMaybeValue(tYesNoCommon(d?.alcohol) || d?.alcohol) },
                                      { label: t('matchmakingPage.form.labels.foreignLanguages'), value: formatMaybeValue(formatLanguagesSummary(d?.languages)) },
                                      {
                                        label: t('matchmakingPage.form.options.commLanguage.translationApp'),
                                        value: formatMaybeValue(
                                          d?.canCommunicateWithTranslationApp
                                            ? t('matchmakingPage.form.options.common.yes')
                                            : t('matchmakingPage.form.options.common.no')
                                        ),
                                      },
                                    ],
                                    showEmptyProfileFields
                                  );

                                  if (!meRows.length && !personalRows.length) return null;

                                  return (
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {meRows.length ? (
                                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                          <p className="text-xs font-semibold text-white">{t('matchmakingPage.form.sections.me')}</p>
                                          <div className="mt-2 grid grid-cols-1 gap-2">
                                            {meRows.map((r) => (
                                              <div key={r.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                                                <p className="text-[11px] text-white/60">{r.label}</p>
                                                <p className="font-semibold break-words text-sm text-white/85">{r.value}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : null}

                                      {personalRows.length ? (
                                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                          <p className="text-xs font-semibold text-white">{t('matchmakingPanel.matches.candidate.detailsTitle')}</p>
                                          <div className="mt-2 grid grid-cols-1 gap-2">
                                            {personalRows.map((r) => (
                                              <div key={r.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                                                <p className="text-[11px] text-white/60">{r.label}</p>
                                                <p className="font-semibold break-words text-sm text-white/85">{r.value}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })()}

                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-white/80">
                                  <div>
                                    <p className="text-xs text-white/60">{t('matchmakingPanel.matches.candidate.aboutLabel')}</p>
                                    <p className="whitespace-pre-wrap">{other.about || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-white/60">{t('matchmakingPanel.matches.candidate.expectationsLabel')}</p>
                                    <p className="whitespace-pre-wrap">{other.expectations || '-'}</p>
                                  </div>
                                </div>

                                {(() => {
                                  const p = other?.partnerPreferences && typeof other.partnerPreferences === 'object' ? other.partnerPreferences : {};

                                  const formatPref = (raw) => {
                                    const s = String(raw || '').trim().toLowerCase();
                                    if (!s) return '-';
                                    if (s === 'doesnt_matter' || s === 'doesntmatter') return t('matchmakingPage.form.options.common.doesntMatter');
                                    if (s === 'yes' || s === 'no' || s === 'true' || s === 'false' || s === '1' || s === '0') return tYesNoCommon(s);
                                    return String(raw || '').trim() || '-';
                                  };

                                  const lookingForRows = filterEmptyRows(
                                    [
                                      {
                                        label: t('matchmakingPage.form.labels.lookingForNationality'),
                                        value: formatMaybeValue(tOption('nationality', other?.lookingForNationality) || other?.lookingForNationality),
                                      },
                                      {
                                        label: t('matchmakingPage.form.labels.lookingForGender'),
                                        value: formatMaybeValue(tOption('gender', other?.lookingForGender) || other?.lookingForGender),
                                      },
                                    ],
                                    showEmptyProfileFields
                                  );

                                  return (
                                    <>
                                      {lookingForRows.length ? (
                                        <div className="mt-4 pt-3 border-t border-white/10">
                                          <p className="text-xs font-semibold text-white">{t('matchmakingPage.form.sections.lookingFor')}</p>
                                          <div className="mt-2 grid grid-cols-1 gap-2">
                                            {lookingForRows.map((r) => (
                                              <div key={r.label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                                                <p className="text-[11px] text-white/60">{r.label}</p>
                                                <p className="font-semibold break-words text-sm text-white/85">{r.value}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : null}

                                      {p && Object.keys(p).length ? (
                                        <div className="mt-4 pt-3 border-t border-white/10">
                                          <p className="text-xs font-semibold text-white">{t('matchmakingPage.form.sections.partnerPreferences')}</p>

                                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                            <div>
                                              <p className="text-xs text-white/60">{t('matchmakingPage.form.labels.partnerHeightMin')}</p>
                                              <p className="font-semibold break-words text-sm text-white/80">{formatMaybeValue(p?.heightMinCm, ' cm')}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-white/60">{t('matchmakingPage.form.labels.partnerHeightMax')}</p>
                                              <p className="font-semibold break-words text-sm text-white/80">{formatMaybeValue(p?.heightMaxCm, ' cm')}</p>
                                            </div>
                                            {filterEmptyRows(
                                              [
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerHeightMin'),
                                                  value: formatMaybeValue(p?.heightMinCm, ' cm'),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerHeightMax'),
                                                  value: formatMaybeValue(p?.heightMaxCm, ' cm'),
                                                },
                                                {
                                                  label: t('matchmakingPanel.matches.candidate.partnerAgeMin'),
                                                  value: formatMaybeValue(p?.ageMin),
                                                },
                                                {
                                                  label: t('matchmakingPanel.matches.candidate.partnerAgeMax'),
                                                  value: formatMaybeValue(p?.ageMax),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerAgeMaxOlderYears'),
                                                  value: formatMaybeValue(p?.ageMaxOlderYears),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerAgeMaxYoungerYears'),
                                                  value: formatMaybeValue(p?.ageMaxYoungerYears),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerMaritalStatus'),
                                                  value: formatMaybeValue(tOption('maritalStatus', p?.maritalStatus) || p?.maritalStatus),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerReligion'),
                                                  value: formatMaybeValue(tOption('religion', p?.religion) || p?.religion),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerCommunicationLanguages'),
                                                  value: formatMaybeValue(tOption('commLanguage', p?.communicationLanguage) || p?.communicationLanguage),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerCommunicationLanguageOther'),
                                                  value: formatMaybeValue(p?.communicationLanguageOther),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerTranslationApp'),
                                                  value: formatMaybeValue(
                                                    p?.canCommunicateWithTranslationApp
                                                      ? t('matchmakingPage.form.options.common.yes')
                                                      : t('matchmakingPage.form.options.common.no')
                                                  ),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerLivingCountry'),
                                                  value: formatMaybeValue(tOption('livingCountry', p?.livingCountry) || p?.livingCountry),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerSmokingPreference'),
                                                  value: formatPref(p?.smokingPreference),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerAlcoholPreference'),
                                                  value: formatPref(p?.alcoholPreference),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerChildrenPreference'),
                                                  value: formatPref(p?.childrenPreference),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerEducationPreference'),
                                                  value: formatPref(p?.educationPreference),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerOccupationPreference'),
                                                  value: formatPref(p?.occupationPreference),
                                                },
                                                {
                                                  label: t('matchmakingPage.form.labels.partnerFamilyValuesPreference'),
                                                  value: formatPref(p?.familyValuesPreference),
                                                },
                                              ],
                                              showEmptyProfileFields
                                            ).map((it) => (
                                              <div key={it.label}>
                                                <p className="text-xs text-white/60">{it.label}</p>
                                                <p className="font-semibold break-words text-sm text-white/80">{it.value}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : null}
                                    </>
                                  );
                                })()}
                              </div>
                            ) : null}

                            {m.status === 'mutual_accepted' ? (
                              <div className="mt-3 rounded-xl border border-sky-300/30 bg-sky-500/10 p-3 text-sky-100 text-sm">
                                {(() => {
                                  const myChoice = user?.uid ? (m?.interactionChoices?.[user.uid] || '') : '';
                                  const otherUserId = Array.isArray(m?.userIds) && user?.uid ? (m.userIds || []).find((x) => x !== user.uid) : '';
                                  const otherChoice = otherUserId ? (m?.interactionChoices?.[otherUserId] || '') : '';
                                  const mode = typeof m?.interactionMode === 'string' ? m.interactionMode : '';

                                  const loading = !!interactionChoiceByMatchId?.[m.id]?.loading;
                                  const blocked = !canTakeActions;

                                  const otherName = other?.username || other?.name || t('matchmakingPanel.matches.candidate.fallbackName');

                                  return (
                                    <div>
                                      <p className="font-semibold">{t('matchmakingPanel.matches.interaction.title')}</p>
                                      <p className="mt-1 text-white/75">{t('matchmakingPanel.matches.interaction.lead')}</p>

                                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                        <button
                                          type="button"
                                          disabled={loading || blocked}
                                          onClick={() => chooseInteraction(m.id, 'offsite')}
                                          className={
                                            'px-4 py-2 rounded-full text-sm font-semibold border ' +
                                            (myChoice === 'offsite'
                                              ? 'bg-emerald-700 text-white border-emerald-700'
                                              : 'bg-white/5 text-emerald-100 border-emerald-300/30 hover:bg-emerald-500/10')
                                          }
                                        >
                                          {t('matchmakingPanel.matches.interaction.offsite')}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={loading || blocked}
                                          onClick={() => chooseInteraction(m.id, 'cancel')}
                                          className={
                                            'px-4 py-2 rounded-full text-sm font-semibold border ' +
                                            (myChoice === 'cancel'
                                              ? 'bg-rose-700 text-white border-rose-700'
                                              : 'bg-white/5 text-rose-100 border-rose-300/30 hover:bg-rose-500/10')
                                          }
                                        >
                                          {t('matchmakingPanel.matches.interaction.cancel')}
                                        </button>
                                      </div>

                                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3">
                                          <p className="text-xs font-semibold text-emerald-100">{t('matchmakingPanel.matches.interaction.offsiteInfoTitle')}</p>
                                          <p className="mt-1 text-xs text-white/75">{t('matchmakingPanel.matches.interaction.offsiteInfoBody')}</p>
                                        </div>
                                        <div className="rounded-xl border border-rose-300/20 bg-rose-500/10 p-3">
                                          <p className="text-xs font-semibold text-rose-100">{t('matchmakingPanel.matches.interaction.cancelInfoTitle')}</p>
                                          <p className="mt-1 text-xs text-white/75">{t('matchmakingPanel.matches.interaction.cancelInfoBody')}</p>
                                        </div>
                                      </div>

                                      {interactionChoiceByMatchId?.[m.id]?.error ? (
                                        <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-xs">
                                          {interactionChoiceByMatchId[m.id].error}
                                        </div>
                                      ) : null}

                                      {blocked ? (
                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                                          {myGender === 'female'
                                            ? t('matchmakingPanel.errors.membershipOrVerificationRequired')
                                            : t('matchmakingPanel.errors.membershipRequired')}
                                        </div>
                                      ) : null}

                                      {myChoice ? (
                                        <div className="mt-2 text-xs text-white/60">
                                          {t('matchmakingPanel.matches.interaction.yourChoice', {
                                            choice:
                                              myChoice === 'offsite'
                                                ? t('matchmakingPanel.matches.interaction.offsiteShort')
                                                : myChoice === 'cancel'
                                                  ? t('matchmakingPanel.matches.interaction.cancelShort')
                                                  : myChoice,
                                          })}
                                        </div>
                                      ) : (
                                        <div className="mt-2 text-xs text-white/60">{t('matchmakingPanel.matches.interaction.choosePrompt')}</div>
                                      )}

                                      {otherChoice === 'offsite' && myChoice === 'cancel' ? (
                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                                          {t('matchmakingPanel.matches.interaction.otherPrefersOffsite', { name: otherName })}
                                        </div>
                                      ) : null}

                                      {otherChoice === 'cancel' && myChoice === 'offsite' ? (
                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                                          {t('matchmakingPanel.matches.interaction.otherPrefersCancel', { name: otherName })}
                                        </div>
                                      ) : null}

                                      {mode === 'offsite' || mode === 'contact' ? (
                                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-950 text-xs">
                                          {t('matchmakingPanel.matches.interaction.offsiteWaiting')}
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : null}

                            {m.status === 'contact_unlocked' ? (
                              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-950 text-sm">
                                <p className="font-semibold">{t('matchmakingPanel.matches.contactUnlocked.title')}</p>
                                <p className="mt-1 text-emerald-950/90">{t('matchmakingPanel.matches.contactUnlocked.body')}</p>

                                {(() => {
                                  const p = latestPaymentByMatchId?.[m.id] || null;
                                  if (!p) return null;

                                  if (p.status === 'pending') {
                                    return (
                                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                                        {t('matchmakingPanel.matches.paymentStatus.pending')}
                                      </div>
                                    );
                                  }

                                  if (p.status === 'rejected') {
                                    return (
                                      <div className="mt-2 rounded-lg border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100 text-xs">
                                        {t('matchmakingPanel.matches.paymentStatus.rejected')}
                                      </div>
                                    );
                                  }

                                  if (p.status === 'approved') {
                                    return (
                                      <div className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-2 text-emerald-100 text-xs">
                                        {t('matchmakingPanel.matches.paymentStatus.approved')}
                                      </div>
                                    );
                                  }

                                  return null;
                                })()}

                                {contactAction.error && contactAction.matchId === m.id ? (
                                  <div className="mt-2 rounded-lg border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100 text-xs">
                                    {contactAction.error}
                                  </div>
                                ) : null}

                                {contactByMatchId?.[m.id] ? (
                                  <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3">
                                    <p className="text-xs font-semibold text-emerald-100">{t('matchmakingPanel.matches.contact.title')}</p>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-white/80">
                                      <div>
                                        <p className="text-xs text-white/60">{t('matchmakingPanel.common.whatsapp')}</p>
                                        <p className="font-semibold">
                                          {contactByMatchId[m.id]?.whatsapp || '-'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-white/60">{t('matchmakingPanel.common.email')}</p>
                                        <p className="font-semibold">{contactByMatchId[m.id]?.email || '-'}</p>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <p className="text-xs text-white/60">{t('matchmakingPanel.common.instagram')}</p>
                                        <p className="font-semibold">{contactByMatchId[m.id]?.instagram || '-'}</p>
                                      </div>
                                    </div>

                                    {contactByMatchId[m.id]?.whatsapp ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const num = normalizePhoneForWhatsApp(contactByMatchId[m.id]?.whatsapp);
                                          if (!num) return;
                                          window.open(`https://wa.me/${num}`, '_blank', 'noopener,noreferrer');
                                        }}
                                        className="mt-3 px-4 py-2 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
                                      >
                                        {t('matchmakingPanel.actions.whatsapp')}
                                      </button>
                                    ) : null}
                                  </div>
                                ) : (
                                  <div className="mt-3">
                                    {canTakeActions ? (
                                      <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3">
                                        <p className="text-xs font-semibold text-emerald-100">{t('matchmakingPanel.matches.contactUnlock.membershipActiveTitle')}</p>
                                        <p className="text-sm text-white/75 mt-1">
                                          {t('matchmakingPanel.matches.contactUnlock.membershipActiveBody')}
                                        </p>
                                        <button
                                          type="button"
                                          disabled={(contactAction.loading && contactAction.matchId === m.id) || !canTakeActions}
                                          onClick={() => openContact(m.id)}
                                          className="mt-3 px-4 py-2 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60"
                                        >
                                          {contactAction.loading && contactAction.matchId === m.id ? t('matchmakingPanel.matches.contactUnlock.opening') : t('matchmakingPanel.matches.contactUnlock.open')}
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3">
                                        <p className="text-xs font-semibold text-emerald-100">
                                          {myGender === 'female'
                                            ? t('matchmakingPanel.membershipOrVerificationGate.title')
                                            : t('matchmakingPanel.matches.payment.membershipRequiredTitle')}
                                        </p>
                                        <p className="text-sm text-white/75 mt-1">
                                          {myGender === 'female'
                                            ? t('matchmakingPanel.membershipOrVerificationGate.body')
                                            : t('matchmakingPanel.matches.payment.membershipRequiredBody')}
                                        </p>

                                        <div className="mt-2 rounded-lg border border-amber-300/30 bg-amber-500/10 p-2 text-amber-100 text-xs">
                                          {myGender === 'female'
                                            ? t('matchmakingPanel.errors.membershipOrVerificationRequired')
                                            : t('matchmakingPanel.errors.membershipRequired')}
                                        </div>

                                        {!matchmakingPaymentsLoading && latestPaymentByMatchId?.[m.id]?.status === 'pending' ? (
                                          <p className="mt-2 text-xs text-amber-200 font-semibold">
                                            {t('matchmakingPanel.matches.payment.pendingNotice')}
                                          </p>
                                        ) : null}

                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                            <p className="text-xs font-semibold text-white">{t('matchmakingPanel.matches.payment.trTitle')}</p>
                                            <p className="text-sm text-white/75 mt-1">{t('matchmakingPanel.matches.payment.amount')}: <span className="font-semibold">{prices.TRY} TL</span></p>
                                            {import.meta?.env?.VITE_MATCHMAKING_TR_ACCOUNT_NAME || import.meta?.env?.VITE_MATCHMAKING_TR_IBAN ? (
                                              <div className="mt-2 text-xs text-white/75">
                                                {import.meta?.env?.VITE_MATCHMAKING_TR_ACCOUNT_NAME ? (
                                                  <p>{t('matchmakingPanel.matches.payment.recipient')}: <span className="font-semibold">{import.meta.env.VITE_MATCHMAKING_TR_ACCOUNT_NAME}</span></p>
                                                ) : null}
                                                {import.meta?.env?.VITE_MATCHMAKING_TR_IBAN ? (
                                                  <p>{t('matchmakingPanel.matches.payment.iban')}: <span className="font-semibold">{import.meta.env.VITE_MATCHMAKING_TR_IBAN}</span></p>
                                                ) : null}
                                              </div>
                                            ) : (
                                              <p className="mt-2 text-xs text-white/60">{t('matchmakingPanel.matches.payment.detailsSoon')}</p>
                                            )}
                                          </div>

                                          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                            <p className="text-xs font-semibold text-white">{t('matchmakingPanel.matches.payment.idTitle')}</p>
                                            <p className="text-sm text-white/75 mt-1">{t('matchmakingPanel.matches.payment.amount')}: <span className="font-semibold">{prices.IDR} IDR</span></p>
                                            {import.meta?.env?.VITE_MATCHMAKING_ID_QRIS_URL ? (
                                              <a
                                                href={import.meta.env.VITE_MATCHMAKING_ID_QRIS_URL}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-block text-xs font-semibold text-sky-200 hover:underline"
                                              >
                                                {t('matchmakingPanel.matches.payment.payWithQris')}
                                              </a>
                                            ) : null}
                                            {import.meta?.env?.VITE_MATCHMAKING_ID_BANK_DETAILS ? (
                                              <p className="mt-2 text-xs text-white/75 whitespace-pre-wrap">{import.meta.env.VITE_MATCHMAKING_ID_BANK_DETAILS}</p>
                                            ) : null}
                                          </div>
                                        </div>

                                        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                                          <p className="text-xs font-semibold text-white">{t('matchmakingPanel.matches.payment.reportTitle')}</p>
                                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <label className="text-xs text-white/70">
                                              {t('matchmakingPanel.matches.payment.currency')}
                                              <select
                                                value={paymentForm.currency}
                                                onChange={(e) => setPaymentForm((p) => ({ ...p, currency: e.target.value }))}
                                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                                              >
                                                <option value="TRY">{t('matchmakingPanel.matches.payment.currencyTRY')}</option>
                                                <option value="IDR">{t('matchmakingPanel.matches.payment.currencyIDR')}</option>
                                              </select>
                                            </label>
                                            <label className="text-xs text-white/70">
                                              {t('matchmakingPanel.matches.payment.method')}
                                              <select
                                                value={paymentForm.method}
                                                onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
                                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                                              >
                                                <option value="eft_fast">{t('matchmakingPanel.matches.payment.methodEftFast')}</option>
                                                <option value="swift_wise">{t('matchmakingPanel.matches.payment.methodSwiftWise')}</option>
                                                <option value="qris">{t('matchmakingPanel.matches.payment.methodQris')}</option>
                                                <option value="other">{t('matchmakingPanel.matches.payment.methodOther')}</option>
                                              </select>
                                            </label>
                                            <label className="text-xs text-white/70 sm:col-span-2">
                                              {t('matchmakingPanel.matches.payment.reference')}
                                              <input
                                                value={paymentForm.reference}
                                                onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))}
                                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                                placeholder={t('matchmakingPanel.matches.payment.referencePlaceholder')}
                                              />
                                            </label>
                                            <label className="text-xs text-white/70 sm:col-span-2">
                                              {t('matchmakingPanel.matches.payment.note')}
                                              <textarea
                                                value={paymentForm.note}
                                                onChange={(e) => setPaymentForm((p) => ({ ...p, note: e.target.value }))}
                                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                                rows={2}
                                                placeholder={t('matchmakingPanel.matches.payment.notePlaceholder')}
                                              />
                                            </label>

                                            <label className="text-xs text-white/70 sm:col-span-2">
                                              {t('matchmakingPanel.matches.payment.receipt')}
                                              <div className="mt-1 flex flex-col sm:flex-row gap-2">
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => {
                                                    const f = e?.target?.files?.[0];
                                                    if (f) uploadReceipt(f);
                                                  }}
                                                  className="block w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/15"
                                                  disabled={receiptUpload.loading}
                                                />
                                                <button
                                                  type="button"
                                                  className="px-4 py-2 rounded-full border border-white/15 text-white/85 text-sm font-semibold hover:bg-white/[0.08]"
                                                  onClick={() => setPaymentForm((p) => ({ ...p, receiptUrl: '' }))}
                                                  disabled={receiptUpload.loading || !paymentForm.receiptUrl}
                                                >
                                                  {t('matchmakingPanel.actions.remove')}
                                                </button>
                                              </div>
                                              <p className="mt-1 text-[11px] text-white/50">
                                                {t('matchmakingPanel.matches.payment.receiptHelp')}
                                              </p>
                                            </label>

                                            <label className="text-xs text-white/70 sm:col-span-2">
                                              {t('matchmakingPanel.matches.payment.receiptLink')}
                                              <input
                                                value={paymentForm.receiptUrl}
                                                onChange={(e) => setPaymentForm((p) => ({ ...p, receiptUrl: e.target.value }))}
                                                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                                placeholder="https://..."
                                              />
                                              {paymentForm.receiptUrl ? (
                                                <a
                                                  href={paymentForm.receiptUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="mt-1 inline-block text-xs font-semibold text-sky-200 hover:underline"
                                                >
                                                  {t('matchmakingPanel.matches.payment.viewReceipt')}
                                                </a>
                                              ) : null}
                                            </label>
                                          </div>

                                          {receiptUpload.error ? (
                                            <div className="mt-2 rounded-lg border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100 text-xs">
                                              {receiptUpload.error}
                                            </div>
                                          ) : null}
                                          {receiptUpload.loading ? (
                                            <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/60 text-xs">
                                              {t('matchmakingPanel.matches.payment.uploadingReceipt')}
                                            </div>
                                          ) : null}

                                          {paymentAction.error && paymentAction.matchId === m.id ? (
                                            <div className="mt-2 rounded-lg border border-rose-300/30 bg-rose-500/10 p-2 text-rose-100 text-xs">
                                              {paymentAction.error}
                                            </div>
                                          ) : null}
                                          {paymentAction.success && paymentAction.matchId === m.id ? (
                                            <div className="mt-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-2 text-emerald-100 text-xs">
                                              {paymentAction.success}
                                            </div>
                                          ) : null}

                                          <button
                                            type="button"
                                            disabled={
                                              (paymentAction.loading && paymentAction.matchId === m.id) ||
                                              (!matchmakingPaymentsLoading && latestPaymentByMatchId?.[m.id]?.status === 'pending')
                                            }
                                            onClick={() => submitPayment(m.id)}
                                            className="mt-3 px-4 py-2 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60"
                                          >
                                            {paymentAction.loading && paymentAction.matchId === m.id
                                              ? t('matchmakingPanel.actions.sending')
                                              : (!matchmakingPaymentsLoading && latestPaymentByMatchId?.[m.id]?.status === 'pending')
                                                ? t('matchmakingPanel.actions.pending')
                                                : t('matchmakingPanel.matches.payment.sendPayment', { amount: (paymentForm.currency === 'IDR' ? prices.IDR : prices.TRY), currency: paymentForm.currency })}
                                          </button>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => {
                                                const matchId = String(m?.id || '');
                                                const matchCode = matchCodeById?.[matchId] || (typeof m?.matchCode === 'string' ? m.matchCode : '') || shortInternalId(matchId) || '-';
                                                const msg = t('matchmakingPanel.matches.payment.supportWhatsappMessage', { matchId: matchId || '-', matchCode });
                                            openWhatsApp(msg);
                                          }}
                                          className="mt-3 px-4 py-2 rounded-full border border-emerald-300 text-emerald-900 text-sm font-semibold hover:bg-emerald-50"
                                          disabled={!whatsappNumber}
                                        >
                                          {t('matchmakingPanel.matches.payment.supportWhatsapp')}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {m.status === 'proposed' ? (
                              <div className="mt-3">
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button
                                    type="button"
                                    disabled={matchmakingAction.loading || myDecision === 'accept' || !canTakeActions}
                                    onClick={() => decideMatch(m.id, 'accept')}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                      myDecision === 'accept'
                                        ? 'bg-emerald-200 text-emerald-900'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                                  >
                                    {myDecision === 'accept' ? t('matchmakingPanel.actions.accepted') : t('matchmakingPanel.actions.accept')}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={matchmakingAction.loading || myDecision === 'reject' || !canTakeActions}
                                    onClick={() => decideMatch(m.id, 'reject')}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                      myDecision === 'reject'
                                        ? 'bg-rose-200 text-rose-900'
                                        : 'bg-rose-600 text-white hover:bg-rose-700'
                                    }`}
                                  >
                                    {myDecision === 'reject' ? t('matchmakingPanel.actions.rejected') : t('matchmakingPanel.actions.reject')}
                                  </button>

                                  {!canTakeActions ? (
                                    <div className="mt-2 sm:mt-0 sm:ml-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                                      {myGender === 'female'
                                        ? t('matchmakingPanel.errors.membershipOrVerificationRequired')
                                        : t('matchmakingPanel.errors.membershipRequired')}
                                    </div>
                                  ) : null}
                                </div>

                                {!canSeeFullProfiles ? (
                                  <div className="mt-3">
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <button
                                        type="button"
                                        disabled={dismissAction.loading && dismissAction.matchId === m.id}
                                        onClick={() => dismissMatch(m.id)}
                                        className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
                                      >
                                        {t('matchmakingPanel.actions.dismissMatch')}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={requestNewAction.loading}
                                        onClick={requestNewMatch}
                                        className="px-4 py-2 rounded-full border border-white/15 text-white/90 text-sm font-semibold hover:bg-white/[0.08] disabled:opacity-60"
                                      >
                                        {requestNewAction.loading
                                          ? t('matchmakingPanel.actions.requestingNew')
                                          : t('matchmakingPanel.actions.requestNewWithRemaining', { remaining: newMatchQuotaInfo.remaining, limit: newMatchQuotaInfo.limit })}
                                      </button>
                                    </div>
                                    <div className="mt-2 text-xs text-white/60">
                                      {t('matchmakingPanel.actions.requestNewQuotaHint', { remaining: newMatchQuotaInfo.remaining, limit: newMatchQuotaInfo.limit })}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            {m.status === 'cancelled' && String(m?.cancelledReason || '') === 'rejected' && String(m?.cancelledByUserId || '') !== String(user?.uid || '') ? (
                              <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-amber-100 text-sm">
                                <p className="font-semibold">{t('matchmakingPanel.matches.rejectedByOther.title')}</p>
                                <p className="mt-1 text-amber-100/90">{t('matchmakingPanel.matches.rejectedByOther.body')}</p>
                                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                  <button
                                    type="button"
                                    disabled={dismissAction.loading && dismissAction.matchId === m.id}
                                    onClick={() => dismissMatch(m.id)}
                                    className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
                                  >
                                    {t('matchmakingPanel.actions.dismissMatch')}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={requestNewAction.loading}
                                    onClick={requestNewMatch}
                                    className="px-4 py-2 rounded-full border border-amber-300/30 text-amber-100 text-sm font-semibold hover:bg-amber-500/10 disabled:opacity-60"
                                  >
                                    {requestNewAction.loading
                                      ? t('matchmakingPanel.actions.requestingNew')
                                      : t('matchmakingPanel.actions.requestNewWithRemaining', { remaining: newMatchQuotaInfo.remaining, limit: newMatchQuotaInfo.limit })}
                                  </button>
                                </div>
                              </div>
                            ) : null}

                            {myDecision === 'accept' && m.status === 'proposed' ? (
                              <p className="mt-2 text-xs text-white/60">{t('matchmakingPanel.matches.waitingOther')}</p>
                            ) : null}
                          </div>

                          {showInlineLockNotice ? (
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-white">{t('matchmakingPanel.matches.title')}</p>
                              <p className="text-xs text-white/60 mt-1">{t('matchmakingPanel.matches.subtitle')}</p>

                              <div className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-amber-100 text-sm">
                                <p className="font-semibold">{t('matchmakingPanel.lock.title')}</p>
                                <p className="mt-1">{t('matchmakingPanel.lock.body')}</p>
                              </div>

                              <p className="mt-2 text-xs text-amber-100/90">
                                {t('matchmakingPanel.lock.matchId')}:{' '}
                                <span className="font-semibold">{lockInfo.matchCode || matchCodeById?.[lockInfo.matchId] || shortInternalId(lockInfo.matchId)}</span>
                              </p>
                            </div>
                          ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
