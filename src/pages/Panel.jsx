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
import { isCloudinaryUnsignedUploadEnabled, uploadImageToCloudinaryAuto } from '../utils/cloudinaryUpload';

export default function Panel() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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

  const [chatByMatchId, setChatByMatchId] = useState({});
  const [chatSendByMatchId, setChatSendByMatchId] = useState({});
  const [chatTextByMatchId, setChatTextByMatchId] = useState({});
  const [chatDecisionByMatchId, setChatDecisionByMatchId] = useState({});
  const [chatNotifyMsgByMatchId, setChatNotifyMsgByMatchId] = useState({});

  const lastChatSeenMessageIdByMatchIdRef = useRef({});

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

  const [receiptUpload, setReceiptUpload] = useState({ loading: false, error: '' });

  const showMatchmakingIntro = !!location?.state?.showMatchmakingIntro;
  const matchmakingNext = typeof location?.state?.matchmakingNext === 'string' && location.state.matchmakingNext
    ? location.state.matchmakingNext
    : '/wedding/apply';

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

  const canTakeActions = useMemo(() => {
    if (myGender === 'male') return myMembership.active;
    if (myGender === 'female') return myMembership.active || (myIdentityVerified && myFreeActive.eligible);
    return myMembership.active;
  }, [myGender, myIdentityVerified, myMembership.active, myFreeActive.eligible]);

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

    const q = query(
      collection(db, 'matchmakingMatches'),
      where('userIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setMatchmakingMatches(items);
        setMatchmakingMatchesLoading(false);
      },
      (err) => {
        console.error('Eşleşmeler yüklenemedi:', err);
        setMatchmakingMatchesLoading(false);
      }
    );

    return unsub;
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
    return { active, matchId };
  }, [matchmakingUser]);

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
    // Kullanıcı panelinde iptal olmuş/geçmiş eşleşmeleri göstermiyoruz.
    return [];
  }, [matchmakingMatches]);

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

    // Sadece panelde gösterilen ve interactionMode=chat olan eşleşme için chat mesajlarını dinle.
    const mutual = Array.isArray(activeMatches)
      ? activeMatches.find((m) => m?.status === 'mutual_accepted' && m?.interactionMode === 'chat' && m?.id)
      : null;
    if (!mutual?.id) return;

    const q = query(
      collection(db, 'matchmakingMatches', mutual.id, 'messages'),
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
        const hasSeenKey = Object.prototype.hasOwnProperty.call(seenMap, mutual.id);
        const last = items.length > 0 ? items[items.length - 1] : null;

        if (!hasSeenKey) {
          lastChatSeenMessageIdByMatchIdRef.current = { ...seenMap, [mutual.id]: last?.id || '' };
        } else if (last?.id && seenMap[mutual.id] !== last.id) {
          lastChatSeenMessageIdByMatchIdRef.current = { ...seenMap, [mutual.id]: last.id };

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
                tag: `match-chat-${mutual.id}`,
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

        setChatByMatchId((prev) => ({ ...prev, [mutual.id]: { loading: false, error: '', items } }));
      },
      (err) => {
        console.error('Chat yüklenemedi:', err);
        setChatByMatchId((prev) => ({ ...prev, [mutual.id]: { loading: false, error: 'chat_load_failed', items: [] } }));
      }
    );

    // init loading state
    setChatByMatchId((prev) => ({ ...prev, [mutual.id]: { loading: true, error: '', items: prev?.[mutual.id]?.items || [] } }));

    return unsub;
  }, [activeMatches, user?.uid]);

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
      const enabled = isCloudinaryUnsignedUploadEnabled();
      if (!enabled) {
        throw new Error(t('matchmakingPanel.receipt.errors.cloudinaryMissing'));
      }

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

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "matchmakingApplications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
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

  const openWhatsApp = (text) => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/40">
      <Navigation />

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('matchmakingPanel.title')}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('matchmakingPanel.subtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              {t('matchmakingPanel.actions.logout')}
            </button>
          </div>

          {location?.state?.from === "matchmakingApply" ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <p className="text-sm font-semibold">{t('matchmakingPanel.afterSubmit.title')}</p>
              <p className="text-sm text-emerald-900/90 mt-1">
                {t('matchmakingPanel.afterSubmit.body')}
              </p>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 p-4">
            <div className="flex items-center gap-4">
              {(() => {
                const photo =
                  (user?.photoURL && String(user.photoURL)) ||
                  (Array.isArray(matchmaking?.photoUrls) && matchmaking.photoUrls[0]) ||
                  '';
                const title =
                  matchmaking?.username ||
                  matchmaking?.fullName ||
                  user?.displayName ||
                  (user?.email ? String(user.email).split('@')[0] : t('matchmakingPanel.account.title'));
                const profileNo = matchmaking?.profileCode || (typeof matchmaking?.profileNo === 'number' ? matchmaking.profileNo : '');
                return (
                  <>
                    <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                      {photo ? (
                        <img src={photo} alt="Profil" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-slate-100" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold text-slate-900 truncate">{title}</div>
                        {profileNo ? (
                          <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {t('matchmakingPanel.application.profileNo')}: {profileNo}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-slate-600 truncate">
                        {user?.email ? user.email : '-'}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{t('matchmakingPanel.account.title')}</p>
            <p className="text-sm text-slate-700 mt-1">
              {t('matchmakingPanel.account.emailLabel')}: <span className="font-semibold">{user?.email || "-"}</span>
            </p>
            {user?.displayName ? (
              <p className="text-sm text-slate-700">
                {t('matchmakingPanel.account.nameLabel')}: <span className="font-semibold">{user.displayName}</span>
              </p>
            ) : null}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">{t('matchmakingPanel.application.title')}</p>
            {matchmakingLoading ? (
              <p className="text-sm text-slate-600 mt-1">{t('common.loading')}</p>
            ) : !matchmaking ? (
              <p className="text-sm text-slate-600 mt-1">
                {t('matchmakingPanel.application.empty')}{" "}
                <Link to={matchmakingNext} className="text-sky-700 font-semibold hover:underline">{t('matchmakingPanel.application.goToForm')}</Link>
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{matchmaking.fullName || t('matchmakingPanel.application.fallbackName')}</p>
                        {matchmaking?.username ? (
                          <p className="text-xs text-slate-600 mt-1">
                            {t('matchmakingPanel.application.username')}: <span className="font-semibold">{matchmaking.username}</span>
                          </p>
                        ) : null}
                        {matchmaking.profileCode || typeof matchmaking.profileNo === 'number' ? (
                          <p className="text-xs text-slate-600 mt-1">
                            {t('matchmakingPanel.application.profileNo')}: <span className="font-semibold">{matchmaking.profileCode || matchmaking.profileNo}</span>
                          </p>
                        ) : null}
                        <p className="text-xs text-slate-600 mt-1">
                          {t('matchmakingPanel.application.applicationId')}: <span className="font-semibold">{matchmaking.id}</span>
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-600">{t('matchmakingPanel.common.status')}</p>
                        <p className="text-sm font-semibold text-slate-900">{matchmaking.status || "-"}</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <p><span className="font-semibold">{t('matchmakingPanel.common.age')}:</span> {typeof matchmaking.age === "number" ? matchmaking.age : "-"}</p>
                      <p><span className="font-semibold">{t('matchmakingPanel.common.whatsapp')}:</span> {matchmaking.whatsapp || "-"}</p>
                      <p><span className="font-semibold">{t('matchmakingPanel.common.email')}:</span> {matchmaking.email || "-"}</p>
                      <p><span className="font-semibold">{t('matchmakingPanel.common.instagram')}:</span> {matchmaking.instagram || "-"}</p>
                      <p className="sm:col-span-2"><span className="font-semibold">{t('matchmakingPanel.common.cityCountry')}:</span> {matchmaking.city ? `${matchmaking.city}${matchmaking.country ? ` / ${matchmaking.country}` : ""}` : (matchmaking.country || "-")}</p>
                    </div>

                    {Array.isArray(matchmaking.photoUrls) && matchmaking.photoUrls.length > 0 ? (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {matchmaking.photoUrls.filter(Boolean).slice(0, 3).map((u) => (
                          <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={u} alt="Foto" className="w-full h-32 object-cover rounded-xl border border-slate-200" loading="lazy" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.update.title')}</p>
                    <p className="text-sm text-slate-700 mt-1">{t('matchmakingPanel.update.body')}</p>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = t('matchmakingPanel.update.whatsappMessage', { applicationId: matchmaking.id });
                        openWhatsApp(msg);
                      }}
                      className="mt-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                      disabled={!whatsappNumber}
                    >
                      {t('matchmakingPanel.actions.whatsapp')}
                    </button>
                  </div>

                  <div className="rounded-xl bg-white border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.membership.title')}</p>
                    <p className="text-sm text-slate-700 mt-1">{membershipStatusText}</p>

                    {(myGender === 'male' || myGender === 'female') ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-semibold text-amber-900">{t('matchmakingPanel.membershipNotice.title')}</p>
                        <p className="mt-1 text-xs text-slate-700">
                          {t(
                            myGender === 'female'
                              ? 'matchmakingPanel.membershipNotice.female.lead'
                              : 'matchmakingPanel.membershipNotice.male.lead'
                          )}
                        </p>

                        {(() => {
                          const pts = t(
                            myGender === 'female'
                              ? 'matchmakingPanel.membershipNotice.female.points'
                              : 'matchmakingPanel.membershipNotice.male.points',
                            { returnObjects: true }
                          );
                          return Array.isArray(pts) && pts.length ? (
                            <div className="mt-2 space-y-1">
                              {pts.map((x, idx) => (
                                <div key={idx} className="flex gap-2 items-start">
                                  <span className="mt-0.5 text-amber-900">•</span>
                                  <span className="text-xs text-slate-700">{x}</span>
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ) : null}

                    {myGender === 'female' && !myMembership.active && myIdentityVerified ? (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.membership.freeActiveTermsTitle')}</p>
                        <p className="mt-1 text-xs text-slate-700">{t('matchmakingPanel.membership.freeActiveTermsBody')}</p>

                        {!myFreeActive.eligible && !myFreeActive.blocked ? (
                          <div className="mt-3">
                            <button
                              type="button"
                              disabled={freeActiveApplyAction.loading}
                              onClick={applyFreeActiveMembership}
                              className="px-4 py-2 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60"
                            >
                              {freeActiveApplyAction.loading
                                ? t('matchmakingPanel.membership.freeActiveApplying')
                                : t('matchmakingPanel.membership.freeActiveApply')}
                            </button>

                            {freeActiveApplyAction.error ? (
                              <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-xs">
                                {freeActiveApplyAction.error}
                              </div>
                            ) : null}

                            {freeActiveApplyAction.success ? (
                              <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-900 text-xs">
                                {freeActiveApplyAction.success}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 rounded-xl bg-white border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.verification.title')}</p>

                    {myIdentityVerified ? (
                      <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                        {t('matchmakingPanel.verification.verifiedBadge')}
                      </div>
                    ) : (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                        <p className="font-semibold">{t('matchmakingPanel.verification.unverifiedTitle')}</p>
                        <p className="mt-1">{verificationUnverifiedBody}</p>
                      </div>
                    )}

                    {!myIdentityVerified ? (
                      <div className="mt-3 flex flex-col gap-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            disabled={verificationAction.loading}
                            onClick={() => startVerification('whatsapp')}
                            className="px-4 py-2 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60"
                          >
                            {verificationAction.loading ? t('matchmakingPanel.actions.sending') : t('matchmakingPanel.verification.actions.startWhatsapp')}
                          </button>
                          {kycEnabled ? (
                            <button
                              type="button"
                              disabled={verificationAction.loading}
                              onClick={() => startVerification('kyc')}
                              className="px-4 py-2 rounded-full border border-slate-300 text-slate-900 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
                            >
                              {t('matchmakingPanel.verification.actions.startKyc')}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={verificationAction.loading}
                            onClick={() => startVerification('manual')}
                            className="px-4 py-2 rounded-full border border-slate-300 text-slate-900 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
                          >
                            {t('matchmakingPanel.verification.actions.startManual')}
                          </button>
                        </div>

                        {verificationAction.error ? (
                          <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-xs">
                            {verificationAction.error}
                          </div>
                        ) : null}

                        {(() => {
                          const r = verificationAction.result;
                          if (!r?.referenceCode && !r?.whatsappUrl) return null;

                          return (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-800 text-xs">
                              {r?.referenceCode ? (
                                <p>
                                  {t('matchmakingPanel.verification.referenceCode')}: <span className="font-semibold">{r.referenceCode}</span>
                                </p>
                              ) : null}
                              {r?.whatsappUrl ? (
                                <a
                                  href={r.whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 inline-block text-xs font-semibold text-sky-700 hover:underline"
                                >
                                  {t('matchmakingPanel.verification.actions.openWhatsapp')}
                                </a>
                              ) : null}
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.dashboard.title')}</p>
                    <p className="mt-1 text-xs text-slate-600">{t('matchmakingPanel.dashboard.subtitle')}</p>

                    <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3" open>
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900">{t('matchmakingPanel.intro.title')}</summary>
                      <div className="mt-2 text-sm text-slate-700">{t('matchmakingPanel.intro.body')}</div>
                      <ol className="mt-3 list-decimal pl-5 space-y-2 text-sm text-slate-800">
                        {introPoints.map((x, idx) => (
                          <li key={idx}>{x}</li>
                        ))}
                      </ol>
                    </details>

                    <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900">{t('matchmakingPanel.rules.title')}</summary>
                      <div className="mt-2 text-sm text-slate-600">{t('matchmakingPanel.rules.lead')}</div>
                      <div className="mt-3 space-y-4 text-sm text-slate-800">
                        <div className="rounded-xl bg-white border border-slate-200 p-3">
                          <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.rules.promise.title')}</p>
                          <ul className="mt-2 list-disc pl-5 space-y-2">
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.promise.p1Title')}:</span> {t('matchmakingPanel.rules.promise.p1Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.promise.p2Title')}:</span> {t('matchmakingPanel.rules.promise.p2Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.promise.p3Title')}:</span> {t('matchmakingPanel.rules.promise.p3Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.promise.p4Title')}:</span> {t('matchmakingPanel.rules.promise.p4Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.promise.p5Title')}:</span> {t('matchmakingPanel.rules.promise.p5Body')}</li>
                          </ul>
                        </div>

                        <div className="rounded-xl bg-white border border-slate-200 p-3">
                          <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.rules.zeroTolerance.title')}</p>
                          <ul className="mt-2 list-disc pl-5 space-y-2">
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r1Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r1Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r2Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r2Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r3Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r3Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r4Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r4Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r5Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r5Body')}</li>
                            <li><span className="font-semibold">{t('matchmakingPanel.rules.zeroTolerance.r6Title')}:</span> {t('matchmakingPanel.rules.zeroTolerance.r6Body')}</li>
                          </ul>
                        </div>

                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-950">
                          <p className="text-xs font-semibold">{t('matchmakingPanel.rules.enforcement.title')}</p>
                          <ul className="mt-2 list-disc pl-5 space-y-2 text-sm">
                            <li>{t('matchmakingPanel.rules.enforcement.e1a')} <span className="font-semibold">{t('matchmakingPanel.rules.enforcement.e1b')}</span> {t('matchmakingPanel.rules.enforcement.e1c')}</li>
                            <li>{t('matchmakingPanel.rules.enforcement.e2a')} <span className="font-semibold">{t('matchmakingPanel.rules.enforcement.e2b')}</span>.</li>
                            <li>{t('matchmakingPanel.rules.enforcement.e3a')} <span className="font-semibold">{t('matchmakingPanel.rules.enforcement.e3b')}</span>.</li>
                            <li>{t('matchmakingPanel.rules.enforcement.e4a')} <span className="font-semibold">{t('matchmakingPanel.rules.enforcement.e4b')}</span>.</li>
                          </ul>
                        </div>

                        <div className="rounded-xl bg-white border border-slate-200 p-3">
                          <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.rules.complaint.title')}</p>
                          <p className="mt-2 text-sm text-slate-700">{t('matchmakingPanel.rules.complaint.body')}</p>
                          {complaintLeadExtra ? (
                            <p className="mt-2 text-sm text-slate-700">{complaintLeadExtra}</p>
                          ) : null}
                        </div>
                      </div>
                    </details>

                    <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-900">{t('matchmakingPanel.dashboard.faq.title')}</summary>
                      <div className="mt-3 space-y-3">
                        {dashboardFaqItems.map((it, idx) => (
                          <div key={idx} className="rounded-xl bg-white border border-slate-200 p-3">
                            <div className="text-xs font-semibold text-slate-900">{it?.q || ''}</div>
                            <div className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{it?.a || ''}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>

                <div className="lg:col-span-7 lg:col-start-6 rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24 self-start">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t('matchmakingPanel.matches.title')}</p>
                      <p className="text-xs text-slate-600 mt-1">{t('matchmakingPanel.matches.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!matchmakingMatchesLoading && !lockInfo.active && proposedMatchesCount > 0 ? (
                        <button
                          type="button"
                          onClick={rejectAllMatches}
                          disabled={rejectAllAction.loading}
                          className="px-3 py-2 rounded-full border border-rose-300 text-rose-900 text-xs font-semibold hover:bg-rose-50 disabled:opacity-60"
                        >
                          {rejectAllAction.loading ? t('matchmakingPanel.actions.sending') : t('matchmakingPanel.actions.rejectAll')}
                        </button>
                      ) : null}
                      {matchmakingMatchesLoading ? (
                        <span className="text-xs text-slate-500">{t('common.loading')}</span>
                      ) : null}
                    </div>
                  </div>

                  {!matchmakingUserLoading && lockInfo.active ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm">
                      <p className="font-semibold">{t('matchmakingPanel.lock.title')}</p>
                      <p className="mt-1">{t('matchmakingPanel.lock.body')}</p>
                      {lockInfo.matchId ? (
                        <p className="mt-1 text-xs text-amber-900/90">{t('matchmakingPanel.lock.matchId')}: <span className="font-semibold">{lockInfo.matchId}</span></p>
                      ) : null}
                    </div>
                  ) : null}

                  {matchmakingAction.error ? (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">
                      {matchmakingAction.error}
                    </div>
                  ) : null}

                  {!canSeeFullProfiles ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 text-sm">
                      <p className="font-semibold">
                        {myGender === 'female' ? t('matchmakingPanel.membershipOrVerificationGate.title') : t('matchmakingPanel.membershipGate.title')}
                      </p>
                      <p className="mt-1 text-slate-700">
                        {myGender === 'female' ? t('matchmakingPanel.membershipOrVerificationGate.body') : t('matchmakingPanel.membershipGate.body')}
                      </p>

                      {requestNewAction.error ? (
                        <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-xs">
                          {requestNewAction.error}
                        </div>
                      ) : null}
                      {requestNewAction.success ? (
                        <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-900 text-xs">
                          {requestNewAction.success}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {rejectAllAction.error ? (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">
                      {rejectAllAction.error}
                    </div>
                  ) : null}

                  {rejectAllAction.success ? (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-950 text-sm">
                      {rejectAllAction.success}
                    </div>
                  ) : null}

                  {!matchmakingMatchesLoading && activeMatches.length === 0 ? (
                    <p className="text-sm text-slate-600 mt-3">{t('matchmakingPanel.matches.empty')}</p>
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

                        const displayName = other?.username || other?.fullName || t('matchmakingPanel.matches.candidate.fallbackName');
                        const maritalCode = other?.details?.maritalStatus || '';
                        const maritalLabel = maritalCode ? (t(`matchmakingPage.form.options.maritalStatus.${maritalCode}`) || maritalCode) : '-';

                        const showHeart = otherDecision === 'accept' && myDecision !== 'accept';

                        return (
                          <div key={m.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {displayName}{typeof other.age === 'number' ? ` (${other.age})` : ''}
                                  {other?.identityVerified ? (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                      {t('matchmakingPanel.matches.candidate.verifiedBadge')}
                                    </span>
                                  ) : null}
                                  {other?.proMember ? (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
                                      {t('matchmakingPanel.matches.candidate.proBadge')}
                                    </span>
                                  ) : null}
                                </p>
                                {other.profileCode || typeof other.profileNo === 'number' ? (
                                  <p className="text-xs text-slate-600 mt-1">
                                    {t('matchmakingPanel.matches.candidate.matchedProfile')}: <span className="font-semibold">{other.profileCode || other.profileNo}</span>
                                  </p>
                                ) : null}
                                {canSeeFullProfiles ? (
                                  <p className="text-xs text-slate-600 mt-1">
                                    {t('matchmakingPanel.matches.candidate.score')}: <span className="font-semibold">{typeof m.score === 'number' ? `%${m.score}` : '-'}</span>
                                    {showHeart ? <span className="ml-2 text-rose-700 font-semibold">{t('matchmakingPanel.matches.candidate.likeBadge')}</span> : null}
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-600 mt-1">
                                    {t('matchmakingPanel.matches.candidate.maritalStatus')}: <span className="font-semibold">{maritalLabel}</span>
                                  </p>
                                )}
                                <p className="text-xs text-slate-600">
                                  {other.city ? `${other.city}${other.country ? ` / ${other.country}` : ''}` : (other.country || '-')}
                                </p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-xs text-slate-600">{t('matchmakingPanel.common.status')}</p>
                                <p className="text-sm font-semibold text-slate-900">{m.status || '-'}</p>
                              </div>
                            </div>

                            {Array.isArray(other.photoUrls) && other.photoUrls.length > 0 ? (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {other.photoUrls.filter(Boolean).slice(0, canSeeFullProfiles ? 3 : 1).map((u) => (
                                  <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="block">
                                    <img
                                      src={u}
                                      alt={t('matchmakingPanel.matches.candidate.photoAlt')}
                                      className="w-full h-40 object-cover rounded-xl border border-slate-200"
                                      loading="lazy"
                                    />
                                  </a>
                                ))}
                              </div>
                            ) : null}

                            {m.status === 'proposed' && canSeeFullProfiles ? (
                              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.matches.candidate.detailsTitle')}</p>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-800">
                                  <div>
                                    <p className="text-xs text-slate-600">{t('matchmakingPanel.matches.candidate.aboutLabel')}</p>
                                    <p className="whitespace-pre-wrap">
                                      {candidateDetailsLoadingByMatchId?.[m.id] ? t('common.loading') : (other.about || '-')}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-600">{t('matchmakingPanel.matches.candidate.expectationsLabel')}</p>
                                    <p className="whitespace-pre-wrap">
                                      {candidateDetailsLoadingByMatchId?.[m.id] ? t('common.loading') : (other.expectations || '-')}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-600">{t('matchmakingPanel.matches.candidate.heightLabel')}</p>
                                    <p className="font-semibold">{typeof other?.details?.heightCm === 'number' ? `${other.details.heightCm} cm` : '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-600">{t('matchmakingPanel.matches.candidate.educationLabel')}</p>
                                    <p className="font-semibold">{other?.details?.education || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-600">{t('matchmakingPanel.matches.candidate.occupationLabel')}</p>
                                    <p className="font-semibold">{other?.details?.occupation || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-600">{t('matchmakingPanel.matches.candidate.religionLabel')}</p>
                                    <p className="font-semibold">{other?.details?.religion || '-'}</p>
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {m.status === 'mutual_accepted' ? (
                              <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sky-950 text-sm">
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
                                      <p className="mt-1 text-sky-950/90">{t('matchmakingPanel.matches.interaction.lead')}</p>

                                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                        <button
                                          type="button"
                                          disabled={loading || blocked}
                                          onClick={() => chooseInteraction(m.id, 'chat')}
                                          className={
                                            'px-4 py-2 rounded-full text-sm font-semibold border ' +
                                            (myChoice === 'chat'
                                              ? 'bg-sky-700 text-white border-sky-700'
                                              : 'bg-white text-sky-900 border-sky-200 hover:bg-sky-100')
                                          }
                                        >
                                          {t('matchmakingPanel.matches.interaction.chat')}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={loading || blocked}
                                          onClick={() => chooseInteraction(m.id, 'contact')}
                                          className={
                                            'px-4 py-2 rounded-full text-sm font-semibold border ' +
                                            (myChoice === 'contact'
                                              ? 'bg-emerald-700 text-white border-emerald-700'
                                              : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100')
                                          }
                                        >
                                          {t('matchmakingPanel.matches.interaction.contact')}
                                        </button>
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
                                        <div className="mt-2 text-xs text-slate-700">
                                          {t('matchmakingPanel.matches.interaction.yourChoice', { choice: myChoice === 'chat' ? t('matchmakingPanel.matches.interaction.chatShort') : t('matchmakingPanel.matches.interaction.contactShort') })}
                                        </div>
                                      ) : (
                                        <div className="mt-2 text-xs text-slate-700">{t('matchmakingPanel.matches.interaction.choosePrompt')}</div>
                                      )}

                                      {otherChoice === 'chat' && myChoice === 'contact' ? (
                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                                          {t('matchmakingPanel.matches.interaction.otherPrefersChat', { name: otherName })}
                                        </div>
                                      ) : null}

                                      {otherChoice === 'contact' && myChoice === 'chat' ? (
                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                                          {t('matchmakingPanel.matches.interaction.otherPrefersContact', { name: otherName })}
                                        </div>
                                      ) : null}

                                      {mode === 'chat' ? (
                                        <div className="mt-3 rounded-xl border border-sky-200 bg-white p-3">
                                          <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.matches.chat.rulesTitle')}</p>
                                          <p className="mt-1 text-xs text-slate-700">{t('matchmakingPanel.matches.chat.rulesBody')}</p>

                                  {canBrowserNotify ? (
                                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                                      {Notification.permission === 'granted' ? (
                                        <div className="text-xs text-emerald-700 font-semibold">
                                          {t('matchmakingPanel.matches.chat.notificationsEnabled')}
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => requestChatNotifications(m.id)}
                                          className="px-3 py-2 rounded-full bg-white border border-sky-200 text-sky-900 text-xs font-semibold hover:bg-sky-100"
                                        >
                                          {t('matchmakingPanel.matches.chat.enableNotifications')}
                                        </button>
                                      )}

                                      {chatNotifyMsgByMatchId?.[m.id] ? (
                                        <div className="text-xs text-slate-700">{chatNotifyMsgByMatchId[m.id]}</div>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  {chatByMatchId?.[m.id]?.loading ? (
                                    <div className="mt-2 text-xs text-slate-600">{t('common.loading')}</div>
                                  ) : null}

                                  <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                                    {(chatByMatchId?.[m.id]?.items || []).length === 0 ? (
                                      <div className="text-xs text-slate-600">{t('matchmakingPanel.matches.chat.empty')}</div>
                                    ) : (
                                      <div className="space-y-2">
                                        {(chatByMatchId?.[m.id]?.items || []).map((msg) => {
                                          const mine = msg?.userId === user?.uid;
                                          return (
                                            <div key={msg.id} className={mine ? 'text-right' : 'text-left'}>
                                              <div className={mine ? 'inline-block bg-sky-600 text-white px-3 py-2 rounded-2xl text-sm max-w-[85%]' : 'inline-block bg-white border border-slate-200 text-slate-900 px-3 py-2 rounded-2xl text-sm max-w-[85%]'}>
                                                {msg?.text || ''}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {chatSendByMatchId?.[m.id]?.error ? (
                                    <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-xs">
                                      {(() => {
                                        const code = String(chatSendByMatchId[m.id].error || '').trim();
                                        if (code === 'filtered') return t('matchmakingPanel.matches.chat.errors.filtered');
                                        if (code === 'rate_limited') return t('matchmakingPanel.matches.chat.errors.rateLimited');
                                        if (code === 'chat_not_enabled') return t('matchmakingPanel.matches.chat.errors.notEnabled');
                                        if (code === 'membership_required') return t('matchmakingPanel.errors.membershipRequired');
                                        if (code === 'free_active_membership_required') return t('matchmakingPanel.errors.freeActiveMembershipRequired');
                                        if (code === 'free_active_membership_blocked') return t('matchmakingPanel.errors.freeActiveMembershipBlocked');
                                        if (code === 'membership_or_verification_required') return t('matchmakingPanel.errors.membershipOrVerificationRequired');
                                        return t('matchmakingPanel.matches.chat.errors.sendFailed');
                                      })()}
                                    </div>
                                  ) : null}

                                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                                    <input
                                      value={chatTextByMatchId?.[m.id] || ''}
                                      onChange={(e) => setChatTextByMatchId((p) => ({ ...p, [m.id]: e.target.value }))}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                      placeholder={t('matchmakingPanel.matches.chat.placeholder')}
                                      maxLength={600}
                                      disabled={!canTakeActions}
                                    />
                                    <button
                                      type="button"
                                      disabled={!!chatSendByMatchId?.[m.id]?.loading || !canTakeActions}
                                      onClick={() => sendChatMessage(m.id)}
                                      className="px-4 py-2 rounded-full bg-sky-700 text-white text-sm font-semibold hover:bg-sky-800 disabled:opacity-60"
                                    >
                                      {chatSendByMatchId?.[m.id]?.loading ? t('matchmakingPanel.actions.sending') : t('matchmakingPanel.matches.chat.send')}
                                    </button>
                                  </div>

                                  {!canTakeActions ? (
                                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                                      {myGender === 'female'
                                        ? t('matchmakingPanel.errors.membershipOrVerificationRequired')
                                        : t('matchmakingPanel.errors.membershipRequired')}
                                    </div>
                                  ) : null}
                                        </div>
                                      ) : null}

                                      {mode === 'contact' ? (
                                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-950 text-xs">
                                          {t('matchmakingPanel.matches.interaction.contactUnlocked')}
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
                                      <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-xs">
                                        {t('matchmakingPanel.matches.paymentStatus.rejected')}
                                      </div>
                                    );
                                  }

                                  if (p.status === 'approved') {
                                    return (
                                      <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-900 text-xs">
                                        {t('matchmakingPanel.matches.paymentStatus.approved')}
                                      </div>
                                    );
                                  }

                                  return null;
                                })()}

                                {contactAction.error && contactAction.matchId === m.id ? (
                                  <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-xs">
                                    {contactAction.error}
                                  </div>
                                ) : null}

                                {contactByMatchId?.[m.id] ? (
                                  <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3">
                                    <p className="text-xs font-semibold text-emerald-900">{t('matchmakingPanel.matches.contact.title')}</p>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-800">
                                      <div>
                                        <p className="text-xs text-slate-600">{t('matchmakingPanel.common.whatsapp')}</p>
                                        <p className="font-semibold">
                                          {contactByMatchId[m.id]?.whatsapp || '-'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-slate-600">{t('matchmakingPanel.common.email')}</p>
                                        <p className="font-semibold">{contactByMatchId[m.id]?.email || '-'}</p>
                                      </div>
                                      <div className="sm:col-span-2">
                                        <p className="text-xs text-slate-600">{t('matchmakingPanel.common.instagram')}</p>
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
                                      <div className="rounded-xl border border-emerald-200 bg-white p-3">
                                        <p className="text-xs font-semibold text-emerald-900">{t('matchmakingPanel.matches.contactUnlock.membershipActiveTitle')}</p>
                                        <p className="text-sm text-slate-700 mt-1">
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
                                      <div className="rounded-xl border border-emerald-200 bg-white p-3">
                                        <p className="text-xs font-semibold text-emerald-900">
                                          {myGender === 'female'
                                            ? t('matchmakingPanel.membershipOrVerificationGate.title')
                                            : t('matchmakingPanel.matches.payment.membershipRequiredTitle')}
                                        </p>
                                        <p className="text-sm text-slate-700 mt-1">
                                          {myGender === 'female'
                                            ? t('matchmakingPanel.membershipOrVerificationGate.body')
                                            : t('matchmakingPanel.matches.payment.membershipRequiredBody')}
                                        </p>

                                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                                          {myGender === 'female'
                                            ? t('matchmakingPanel.errors.membershipOrVerificationRequired')
                                            : t('matchmakingPanel.errors.membershipRequired')}
                                        </div>

                                        {!matchmakingPaymentsLoading && latestPaymentByMatchId?.[m.id]?.status === 'pending' ? (
                                          <p className="mt-2 text-xs text-amber-700 font-semibold">
                                            {t('matchmakingPanel.matches.payment.pendingNotice')}
                                          </p>
                                        ) : null}

                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.matches.payment.trTitle')}</p>
                                            <p className="text-sm text-slate-700 mt-1">{t('matchmakingPanel.matches.payment.amount')}: <span className="font-semibold">{prices.TRY} TL</span></p>
                                            {import.meta?.env?.VITE_MATCHMAKING_TR_ACCOUNT_NAME || import.meta?.env?.VITE_MATCHMAKING_TR_IBAN ? (
                                              <div className="mt-2 text-xs text-slate-700">
                                                {import.meta?.env?.VITE_MATCHMAKING_TR_ACCOUNT_NAME ? (
                                                  <p>{t('matchmakingPanel.matches.payment.recipient')}: <span className="font-semibold">{import.meta.env.VITE_MATCHMAKING_TR_ACCOUNT_NAME}</span></p>
                                                ) : null}
                                                {import.meta?.env?.VITE_MATCHMAKING_TR_IBAN ? (
                                                  <p>{t('matchmakingPanel.matches.payment.iban')}: <span className="font-semibold">{import.meta.env.VITE_MATCHMAKING_TR_IBAN}</span></p>
                                                ) : null}
                                              </div>
                                            ) : (
                                              <p className="mt-2 text-xs text-slate-600">{t('matchmakingPanel.matches.payment.detailsSoon')}</p>
                                            )}
                                          </div>

                                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.matches.payment.idTitle')}</p>
                                            <p className="text-sm text-slate-700 mt-1">{t('matchmakingPanel.matches.payment.amount')}: <span className="font-semibold">{prices.IDR} IDR</span></p>
                                            {import.meta?.env?.VITE_MATCHMAKING_ID_QRIS_URL ? (
                                              <a
                                                href={import.meta.env.VITE_MATCHMAKING_ID_QRIS_URL}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-2 inline-block text-xs font-semibold text-sky-700 hover:underline"
                                              >
                                                {t('matchmakingPanel.matches.payment.payWithQris')}
                                              </a>
                                            ) : null}
                                            {import.meta?.env?.VITE_MATCHMAKING_ID_BANK_DETAILS ? (
                                              <p className="mt-2 text-xs text-slate-700 whitespace-pre-wrap">{import.meta.env.VITE_MATCHMAKING_ID_BANK_DETAILS}</p>
                                            ) : null}
                                          </div>
                                        </div>

                                        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                                          <p className="text-xs font-semibold text-slate-900">{t('matchmakingPanel.matches.payment.reportTitle')}</p>
                                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <label className="text-xs text-slate-700">
                                              {t('matchmakingPanel.matches.payment.currency')}
                                              <select
                                                value={paymentForm.currency}
                                                onChange={(e) => setPaymentForm((p) => ({ ...p, currency: e.target.value }))}
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                              >
                                                <option value="TRY">{t('matchmakingPanel.matches.payment.currencyTRY')}</option>
                                                <option value="IDR">{t('matchmakingPanel.matches.payment.currencyIDR')}</option>
                                              </select>
                                            </label>
                                            <label className="text-xs text-slate-700">
                                              {t('matchmakingPanel.matches.payment.method')}
                                              <select
                                                value={paymentForm.method}
                                                onChange={(e) => setPaymentForm((p) => ({ ...p, method: e.target.value }))}
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                              >
                                                <option value="eft_fast">{t('matchmakingPanel.matches.payment.methodEftFast')}</option>
                                                <option value="swift_wise">{t('matchmakingPanel.matches.payment.methodSwiftWise')}</option>
                                                <option value="qris">{t('matchmakingPanel.matches.payment.methodQris')}</option>
                                                <option value="other">{t('matchmakingPanel.matches.payment.methodOther')}</option>
                                              </select>
                                            </label>
                                            <label className="text-xs text-slate-700 sm:col-span-2">
                                              {t('matchmakingPanel.matches.payment.reference')}
                                              <input
                                                value={paymentForm.reference}
                                                onChange={(e) => setPaymentForm((p) => ({ ...p, reference: e.target.value }))}
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                placeholder={t('matchmakingPanel.matches.payment.referencePlaceholder')}
                                              />
                                            </label>
                                            <label className="text-xs text-slate-700 sm:col-span-2">
                                              {t('matchmakingPanel.matches.payment.note')}
                                              <textarea
                                                value={paymentForm.note}
                                                onChange={(e) => setPaymentForm((p) => ({ ...p, note: e.target.value }))}
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                rows={2}
                                                placeholder={t('matchmakingPanel.matches.payment.notePlaceholder')}
                                              />
                                            </label>

                                            <label className="text-xs text-slate-700 sm:col-span-2">
                                              {t('matchmakingPanel.matches.payment.receipt')}
                                              <div className="mt-1 flex flex-col sm:flex-row gap-2">
                                                <input
                                                  type="file"
                                                  accept="image/*"
                                                  onChange={(e) => {
                                                    const f = e?.target?.files?.[0];
                                                    if (f) uploadReceipt(f);
                                                  }}
                                                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                  disabled={receiptUpload.loading}
                                                />
                                                <button
                                                  type="button"
                                                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50"
                                                  onClick={() => setPaymentForm((p) => ({ ...p, receiptUrl: '' }))}
                                                  disabled={receiptUpload.loading || !paymentForm.receiptUrl}
                                                >
                                                  {t('matchmakingPanel.actions.remove')}
                                                </button>
                                              </div>
                                              <p className="mt-1 text-[11px] text-slate-500">
                                                {t('matchmakingPanel.matches.payment.receiptHelp')}
                                              </p>
                                            </label>

                                            <label className="text-xs text-slate-700 sm:col-span-2">
                                              {t('matchmakingPanel.matches.payment.receiptLink')}
                                              <input
                                                value={paymentForm.receiptUrl}
                                                onChange={(e) => setPaymentForm((p) => ({ ...p, receiptUrl: e.target.value }))}
                                                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                                placeholder="https://..."
                                              />
                                              {paymentForm.receiptUrl ? (
                                                <a
                                                  href={paymentForm.receiptUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="mt-1 inline-block text-xs font-semibold text-sky-700 hover:underline"
                                                >
                                                  {t('matchmakingPanel.matches.payment.viewReceipt')}
                                                </a>
                                              ) : null}
                                            </label>
                                          </div>

                                          {receiptUpload.error ? (
                                            <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-xs">
                                              {receiptUpload.error}
                                            </div>
                                          ) : null}
                                          {receiptUpload.loading ? (
                                            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700 text-xs">
                                              {t('matchmakingPanel.matches.payment.uploadingReceipt')}
                                            </div>
                                          ) : null}

                                          {paymentAction.error && paymentAction.matchId === m.id ? (
                                            <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-xs">
                                              {paymentAction.error}
                                            </div>
                                          ) : null}
                                          {paymentAction.success && paymentAction.matchId === m.id ? (
                                            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-900 text-xs">
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
                                            const msg = t('matchmakingPanel.matches.payment.supportWhatsappMessage', { matchId: m.id });
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
                              canSeeFullProfiles ? (
                                <div className="mt-3 flex flex-col sm:flex-row gap-2">
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
                              ) : (
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
                                    className="px-4 py-2 rounded-full border border-slate-300 text-slate-900 text-sm font-semibold hover:bg-white disabled:opacity-60"
                                  >
                                    {requestNewAction.loading
                                      ? t('matchmakingPanel.actions.requestingNew')
                                      : t('matchmakingPanel.actions.requestNewWithRemaining', { remaining: newMatchQuotaInfo.remaining, limit: newMatchQuotaInfo.limit })}
                                  </button>

                                  <div className="text-xs text-slate-600">
                                    {t('matchmakingPanel.actions.requestNewQuotaHint', { remaining: newMatchQuotaInfo.remaining, limit: newMatchQuotaInfo.limit })}
                                  </div>
                                </div>
                              )
                            ) : null}

                            {m.status === 'cancelled' && String(m?.cancelledReason || '') === 'rejected' && String(m?.cancelledByUserId || '') !== String(user?.uid || '') ? (
                              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950 text-sm">
                                <p className="font-semibold">{t('matchmakingPanel.matches.rejectedByOther.title')}</p>
                                <p className="mt-1 text-amber-950/90">{t('matchmakingPanel.matches.rejectedByOther.body')}</p>
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
                                    className="px-4 py-2 rounded-full border border-amber-300 text-amber-950 text-sm font-semibold hover:bg-white disabled:opacity-60"
                                  >
                                    {requestNewAction.loading
                                      ? t('matchmakingPanel.actions.requestingNew')
                                      : t('matchmakingPanel.actions.requestNewWithRemaining', { remaining: newMatchQuotaInfo.remaining, limit: newMatchQuotaInfo.limit })}
                                  </button>
                                </div>
                              </div>
                            ) : null}

                            {myDecision === 'accept' && m.status === 'proposed' ? (
                              <p className="mt-2 text-xs text-slate-600">{t('matchmakingPanel.matches.waitingOther')}</p>
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
