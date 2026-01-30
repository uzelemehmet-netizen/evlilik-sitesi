import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Lock, Send, ShieldCheck, Share2, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import EmojiPicker from '../../components/EmojiPicker';
import { useAuth } from '../../auth/AuthProvider';
import { db } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';
import { normalizePhoneForWhatsApp } from '../../utils/phone';
import { translateStudioApiError } from '../../utils/studioErrorI18n';

export default function StudioChat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [match, setMatch] = useState(null);
  const [matchLoading, setMatchLoading] = useState(true);
  const [myLock, setMyLock] = useState({ active: false, matchId: '' });
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [sendText, setSendText] = useState('');
  const [sendState, setSendState] = useState({ loading: false, error: '' });

  const [confirmState, setConfirmState] = useState({ loading: false, error: '' });
  const [contactRequestState, setContactRequestState] = useState({ loading: false, error: '' });
  const [contactApproveState, setContactApproveState] = useState({ loading: false, error: '' });

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const uid = String(user?.uid || '').trim();
  const mid = String(matchId || '').trim();

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'matchmakingUsers', uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.exists() ? snap.data() || {} : {};
        const lock = d?.matchmakingLock && typeof d.matchmakingLock === 'object' ? d.matchmakingLock : null;
        const active = !!lock?.active;
        const matchId = typeof lock?.matchId === 'string' ? String(lock.matchId).trim() : '';
        setMyLock({ active, matchId });
      },
      () => {
        setMyLock({ active: false, matchId: '' });
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
    };
  }, [match, uid]);

  const contactInfo = useMemo(() => {
    const list = Array.isArray(messages) ? messages : [];
    const shared = list
      .filter((m) => m?.type === 'system' && String(m?.systemType || '') === 'contact_shared')
      .slice(-1)[0];

    const c = shared?.contact && typeof shared.contact === 'object' ? shared.contact : null;
    if (!c) return null;

    const aUserId = String(c?.aUserId || '').trim();
    const bUserId = String(c?.bUserId || '').trim();
    const aWhatsapp = String(c?.aWhatsapp || '').trim();
    const bWhatsapp = String(c?.bWhatsapp || '').trim();

    const otherUid = Array.isArray(match?.userIds) ? match.userIds.map(String).find((x) => x && x !== uid) : '';

    let otherWhatsapp = '';
    if (otherUid) {
      if (otherUid === aUserId) otherWhatsapp = aWhatsapp;
      if (otherUid === bUserId) otherWhatsapp = bWhatsapp;
    }

    const otherDigits = normalizePhoneForWhatsApp(otherWhatsapp);
    return {
      otherUid,
      otherWhatsapp,
      otherDigits,
      otherWaUrl: otherDigits ? `https://wa.me/${otherDigits}` : '',
    };
  }, [match?.userIds, messages, uid]);

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

  const chatStatusAllowed = matchStatus === 'proposed' || matchStatus === 'mutual_accepted' || matchStatus === 'contact_unlocked';
  const lockedToOtherMatch = !!myLock?.active && !!myLock?.matchId && myLock.matchId !== mid;
  const isActiveMatchForMe = !!myLock?.active && !!myLock?.matchId && myLock.matchId === mid;

  // Kural: sadece aktif eşleşmesi bu match olan kişiler uzun sohbet yapabilir.
  const longChatAllowed = isParticipant && isActiveMatchForMe && (matchStatus === 'mutual_accepted' || matchStatus === 'contact_unlocked');
  const shortChatAllowed = isParticipant && chatStatusAllowed && !longChatAllowed;

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
  const canSend = (longChatAllowed || shortChatAllowed) && !sendState.loading && !!String(sendText || '').trim() && (longChatAllowed || shortRemaining > 0);

  const canConfirm = !!uid && !!mid && !confirmState.loading && !!match && String(match?.status || '').trim() === 'mutual_accepted' && lockInfo.unlocked && !lockInfo.myConfirmed;
  const canRequestContact =
    !!uid &&
    !!mid &&
    !contactRequestState.loading &&
    !!match &&
    String(match?.status || '').trim() === 'mutual_accepted' &&
    lockInfo.unlocked &&
    lockInfo.isConfirmed &&
    (lockInfo.contactStatus === '' || lockInfo.contactStatus === 'none');
  const canApproveContact =
    !!uid &&
    !!mid &&
    !contactApproveState.loading &&
    !!match &&
    String(match?.status || '').trim() === 'mutual_accepted' &&
    lockInfo.unlocked &&
    lockInfo.isConfirmed &&
    lockInfo.contactStatus === 'pending' &&
    !!lockInfo.requestedByUid &&
    lockInfo.requestedByUid !== uid;

  const sendMessage = async (e) => {
    e?.preventDefault?.();
    const text = String(sendText || '').trim();
    if (!uid || !mid || !text) return;
    if (sendState.loading) return;

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link to="/app/matches" className="text-sm font-semibold text-emerald-700 hover:underline">
            {t('studio.chat.backToMatches')}
          </Link>
          <Link to="/profilim" className="text-sm font-semibold text-slate-700 hover:underline">
            {t('studio.common.profile')}
          </Link>
        </div>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                {otherVerified ? <ShieldCheck className="h-5 w-5 text-emerald-600" title={t('studio.common.verified')} /> : null}
                {otherGenderText ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {otherGenderText}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-slate-500">{t('studio.chat.chatTitle')}</p>
            </div>
          </div>

          {/* Kısa mesaj modu bilgilendirme */}
          {shortChatAllowed ? (
            <div className="m-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-900">
              <p className="font-semibold">{t('studio.chat.shortAreaTitle')}</p>
              <p className="mt-1 text-sm text-slate-700">{t('studio.chat.shortAreaDesc')}</p>
              <p className="mt-1 text-sm text-slate-700">
                {t('studio.chat.shortAreaLimit', { limit: shortLimitPerUid, remaining: shortRemaining })}
              </p>
              {lockedToOtherMatch ? (
                <p className="mt-2 text-sm text-slate-600">
                  {t('studio.chat.otherActiveLock')}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Studio tarzı 48h / confirm / contact (sadece aktif eşleşmede anlamlı) */}
          {longChatAllowed ? (
            <div className="m-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <div className="flex items-start gap-2">
              <Lock className="mt-0.5 h-4 w-4" />
              <div className="flex-1">
                <p className="font-semibold">{t('studio.chat.lock48h.title')}</p>
                <p className="mt-1 text-sm text-emerald-900/80">{t('studio.chat.lock48h.subtitle')}</p>

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

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={confirm48h}
                    disabled={!canConfirm}
                    className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-100 disabled:opacity-60"
                  >
                    <Unlock className="mr-2 h-4 w-4" />
                    {confirmState.loading
                      ? t('studio.chat.lock48h.confirming')
                      : lockInfo.myConfirmed
                        ? t('studio.chat.lock48h.confirmed')
                        : t('studio.chat.lock48h.confirm')}
                  </button>

                  <button
                    type="button"
                    onClick={requestContact}
                    disabled={!canRequestContact}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    {contactRequestState.loading ? t('studio.chat.lock48h.requesting') : t('studio.chat.lock48h.requestContact')}
                  </button>

                  <button
                    type="button"
                    onClick={approveContact}
                    disabled={!canApproveContact}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    {contactApproveState.loading ? t('studio.chat.lock48h.approving') : t('studio.chat.lock48h.approveContact')}
                  </button>
                </div>

                {/* Status lines */}
                <div className="mt-3 text-sm text-emerald-900/80 space-y-1">
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
                      {lockInfo.contactStatus === 'approved'
                        ? t('studio.chat.lock48h.contactStatus.approved')
                        : lockInfo.contactStatus === 'pending'
                          ? lockInfo.requestedByUid === uid
                            ? t('studio.chat.lock48h.contactStatus.pendingMine')
                            : t('studio.chat.lock48h.contactStatus.pendingOther')
                          : t('studio.chat.lock48h.contactStatus.closed')}
                    </span>
                  </div>
                </div>

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
                {contactApproveState.error ? (
                  <div className="mt-3 rounded-md border border-rose-200 bg-white p-2 text-sm text-rose-700">
                    {t('studio.chat.lock48h.contactApproveError', { error: contactApproveState.error })}
                  </div>
                ) : null}

                {lockInfo.contactStatus === 'approved' && contactInfo?.otherDigits ? (
                  <div className="mt-3 rounded-md border border-emerald-200 bg-white p-3 text-sm">
                    <p className="font-semibold text-emerald-800">{t('studio.chat.lock48h.whatsappTitle')}</p>
                    <p className="mt-1 text-slate-700">{contactInfo.otherWhatsapp || contactInfo.otherDigits}</p>
                    <a
                      href={contactInfo.otherWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      {t('studio.chat.lock48h.openInWhatsApp')}
                    </a>
                  </div>
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

              <div className="space-y-3">
                {(Array.isArray(messages) ? messages : []).map((m) => {
                  const fromMe = !!uid && String(m?.userId || '') === uid;
                  const text = String(m?.text || '').trim();
                  if (!text) return null;

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
                      </div>

                      {fromMe ? (
                        <div className="h-7 w-7 rounded-full bg-emerald-100" title={t('studio.chat.you')} />
                      ) : null}
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
                {lockedToOtherMatch ? (
                  <div className="flex items-start gap-2">
                    <Lock className="mt-0.5 h-4 w-4" />
                    <div>
                      <p className="font-semibold">{t('studio.chat.lockedTitle')}</p>
                      <p className="mt-1 text-slate-600">{t('studio.chat.lockedBody')}</p>
                    </div>
                  </div>
                ) : !isParticipant ? (
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
                disabled={!canSend}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                aria-label={t('studio.common.send')}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
