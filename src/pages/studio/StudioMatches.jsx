import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider';
import { db } from '../../config/firebase';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import StudioMatchCard from '../../components/studio/StudioMatchCard';
import { authFetch } from '../../utils/authFetch';
import { translateStudioApiError } from '../../utils/studioErrorI18n';

export default function StudioMatches() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const targetLang = useMemo(() => {
    const raw = String(i18n?.language || 'tr');
    const base = raw.split('-')[0];
    return base || 'tr';
  }, [i18n?.language]);

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestNewState, setRequestNewState] = useState({ loading: false, error: '', ok: false });

  const [shortModal, setShortModal] = useState({ open: false, matchId: '', displayName: '' });
  const [shortText, setShortText] = useState('');
  const [shortState, setShortState] = useState({ loading: false, error: '' });
  const [shortMatch, setShortMatch] = useState(null);
  const [shortMessages, setShortMessages] = useState([]);
  const [shortLoading, setShortLoading] = useState(false);
  const shortScrollRef = useRef(null);
  const [translateState, setTranslateState] = useState({ loadingId: '', error: '' });

  const [myLock, setMyLock] = useState({ active: false, matchId: '' });

  useEffect(() => {
    const uid = String(user?.uid || '').trim();
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
      () => setMyLock({ active: false, matchId: '' })
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    const mid = String(shortModal?.matchId || '').trim();
    if (!uid || !shortModal?.open || !mid) {
      setShortMatch(null);
      setShortMessages([]);
      setShortLoading(false);
      return;
    }

    setShortLoading(true);

    const matchRef = doc(db, 'matchmakingMatches', mid);
    const unsubMatch = onSnapshot(
      matchRef,
      (snap) => {
        setShortMatch(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      },
      () => setShortMatch(null)
    );

    const q = query(collection(db, 'matchmakingMatches', mid, 'messages'), orderBy('createdAt', 'asc'), limit(60));
    const unsubMsgs = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setShortMessages(items);
        setShortLoading(false);
      },
      () => {
        setShortMessages([]);
        setShortLoading(false);
      }
    );

    return () => {
      try {
        unsubMatch();
      } catch {
        // noop
      }
      try {
        unsubMsgs();
      } catch {
        // noop
      }
    };
  }, [shortModal?.matchId, shortModal?.open, user?.uid]);

  useEffect(() => {
    if (!shortModal?.open) return;
    try {
      const el = shortScrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch {
      // noop
    }
  }, [shortModal?.open, shortMessages.length]);

  const shortLimitInfo = useMemo(() => {
    const uid = String(user?.uid || '').trim();
    const m = shortMatch && typeof shortMatch === 'object' ? shortMatch : null;
    const status = String(m?.status || '').trim();
    const limit = 5;

    if (!uid || !m) return { used: 0, remaining: limit, limit };

    if (status === 'proposed') {
      const counts = m?.proposedChatCountByUid && typeof m.proposedChatCountByUid === 'object' ? m.proposedChatCountByUid : {};
      const used = typeof counts?.[uid] === 'number' ? counts[uid] : 0;
      const u = Number.isFinite(used) && used > 0 ? used : 0;
      return { used: u, remaining: Math.max(0, limit - u), limit };
    }

    const counts = m?.limitedChatCountByUid && typeof m.limitedChatCountByUid === 'object' ? m.limitedChatCountByUid : {};
    const used = typeof counts?.[uid] === 'number' ? counts[uid] : 0;
    const u = Number.isFinite(used) && used > 0 ? used : 0;
    return { used: u, remaining: Math.max(0, limit - u), limit };
  }, [shortMatch, user?.uid]);

  const shortOther = useMemo(() => {
    const uid = String(user?.uid || '').trim();
    const m = shortMatch && typeof shortMatch === 'object' ? shortMatch : null;
    if (!uid || !m) return null;

    const aId = typeof m?.aUserId === 'string' ? m.aUserId.trim() : '';
    const bId = typeof m?.bUserId === 'string' ? m.bUserId.trim() : '';
    const mySide = uid && aId === uid ? 'a' : uid && bId === uid ? 'b' : '';
    if (!mySide) return null;
    const otherSide = mySide === 'a' ? 'b' : 'a';

    const p = m?.profiles?.[otherSide] && typeof m.profiles[otherSide] === 'object' ? m.profiles[otherSide] : null;
    return p;
  }, [shortMatch, user?.uid]);

  const shortOtherName = useMemo(() => {
    const n =
      String(shortOther?.username || shortOther?.fullName || shortOther?.name || '').trim() ||
      String(shortModal?.displayName || '').trim();
    return n || t('studio.common.match');
  }, [shortModal?.displayName, shortOther, t]);

  const shortOtherPhoto = useMemo(() => {
    const urls = Array.isArray(shortOther?.photoUrls) ? shortOther.photoUrls : [];
    const first = urls.length ? String(urls[0] || '').trim() : '';
    return first;
  }, [shortOther]);

  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid) return;

    setLoading(true);
    setError('');

    const q = query(
      collection(db, 'matchmakingMatches'),
      where('userIds', 'array-contains', uid),
      orderBy('createdAt', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setMatches(items);
        setLoading(false);
      },
      (e) => {
        console.error('StudioMatches load failed', e);
        setError(String(e?.message || '').trim() || 'unknown');
        setMatches([]);
        setLoading(false);
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [user?.uid]);

  const visibleMatches = useMemo(() => {
    const list = Array.isArray(matches) ? matches : [];
    return list.filter((m) => {
      const st = String(m?.status || '').trim();
      return st !== 'cancelled';
    });
  }, [matches]);

  const requestNewMatch = async () => {
    if (!user?.uid || requestNewState.loading) return;
    setRequestNewState({ loading: true, error: '', ok: false });
    try {
      await authFetch('/api/matchmaking-request-new', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ maxMatches: 3 }),
      });
      setRequestNewState({ loading: false, error: '', ok: true });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setRequestNewState({ loading: false, error: msg || 'request_new_failed', ok: false });
    }
  };

  const openShort = async ({ matchId, displayName }) => {
    const uid = String(user?.uid || '').trim();
    const mid = String(matchId || '').trim();
    if (!uid || !mid) return;

    // Aktif eşleşme varken diğer profillerle etkileşim yok.
    if (myLock?.active && myLock?.matchId && myLock.matchId !== mid) {
      setShortState({ loading: false, error: t('studio.errors.activeLocked') });
      return;
    }

    setShortModal({ open: true, matchId: mid, displayName: String(displayName || '').trim() });
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

    const uid = String(user?.uid || '').trim();
    const mid = String(shortModal?.matchId || '').trim();
    const text = String(shortText || '').trim();
    if (!uid || !mid || !text) return;
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
      const msg = String(err?.message || '').trim();
      const translated = translateStudioApiError(t, msg);
      setShortState({ loading: false, error: translated || msg || 'send_failed' });
    }
  };

  const translateMessage = async ({ matchId, messageId }) => {
    const uid = String(user?.uid || '').trim();
    const mid = String(matchId || '').trim();
    const msgId = String(messageId || '').trim();
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
      const msg = String(e?.message || '').trim();
      setTranslateState({ loadingId: '', error: msg || 'translate_failed' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-700">{t('studio.matches.title')}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {visibleMatches.length
                ? t('studio.matches.showingCount', { count: visibleMatches.length })
                : t('studio.matches.emptyHint')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/profilim"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              {t('studio.matches.backToProfile')}
            </Link>
            <button
              type="button"
              onClick={requestNewMatch}
              disabled={requestNewState.loading || !user?.uid}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {requestNewState.loading ? t('studio.matches.finding') : t('studio.matches.findNew')}
            </button>
          </div>
        </div>

        <div className="mb-4 mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <p className="font-semibold text-slate-900">{t('studio.matches.howTitle')}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{t('studio.matches.howItems.likeFirst')}</li>
            <li>{t('studio.matches.howItems.startActive')}</li>
            <li>{t('studio.matches.howItems.onlyOneActive')}</li>
            <li>{t('studio.matches.howItems.lockUntilCancel')}</li>
          </ul>
        </div>

        {myLock?.active && myLock?.matchId ? (
          <div className="mb-4 mx-auto max-w-4xl rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <p className="font-semibold">{t('studio.matches.activeLockTitle')}</p>
            <p className="mt-1 text-sm text-emerald-900/80">
              <Trans
                i18nKey="studio.matches.activeLockBody"
                components={{
                  link: <Link to={`/app/match/${myLock.matchId}`} className="font-semibold underline" />,
                }}
              />
            </p>
          </div>
        ) : null}

        {requestNewState.error ? (
          <div className="mb-4 mx-auto max-w-2xl rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
            {t('studio.matches.requestFailed', { error: requestNewState.error })}
          </div>
        ) : requestNewState.ok ? (
          <div className="mb-4 mx-auto max-w-2xl rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            {t('studio.matches.requestOk')}
          </div>
        ) : null}

        {loading ? (
          <p className="text-center text-slate-600">{t('studio.matches.loading')}</p>
        ) : error ? (
          <div className="mx-auto max-w-xl rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
            {t('studio.matches.loadFailed', { error })}
          </div>
        ) : visibleMatches.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-slate-800 font-semibold">{t('studio.matches.noneTitle')}</p>
            <p className="mt-2 text-sm text-slate-600">
              {t('studio.matches.noneBody')}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={requestNewMatch}
                disabled={requestNewState.loading || !user?.uid}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {requestNewState.loading ? t('studio.matches.finding') : t('studio.matches.findNew')}
              </button>
              <Link
                to="/profilim"
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                {t('studio.matches.backToProfile')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleMatches.map((m) => (
              <StudioMatchCard
                key={m.id}
                match={m}
                currentUid={String(user?.uid || '')}
                onOpenShort={openShort}
                activeLockMatchId={myLock?.active ? myLock?.matchId : ''}
              />
            ))}
          </div>
        )}

        {shortModal.open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <div className="min-w-0 flex items-center gap-3">
                  {shortOtherPhoto ? (
                    <img src={shortOtherPhoto} alt={shortOtherName} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-100" />
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-semibold">{shortOtherName}</p>
                    <p className="text-xs text-slate-500">{t('studio.matches.shortModal.subtitle')}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {t('studio.matches.shortModal.remaining', {
                        remaining: shortLimitInfo.remaining,
                        limit: shortLimitInfo.limit,
                      })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShortModal({ open: false, matchId: '', displayName: '' })}
                  className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  {t('studio.common.close')}
                </button>
              </div>

              <div className="p-4 pt-3">
                <div ref={shortScrollRef} className="h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {shortLoading ? <p className="text-sm text-slate-500">{t('studio.common.loading')}</p> : null}
                  {!shortLoading && (!Array.isArray(shortMessages) || shortMessages.length === 0) ? (
                    <p className="text-sm text-slate-500">{t('studio.matches.shortModal.noMessages')}</p>
                  ) : null}

                  {translateState.error ? (
                    <p className="mt-2 text-sm text-rose-700">
                      {t('studio.matches.shortModal.translateError', { error: translateState.error })}
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    {(Array.isArray(shortMessages) ? shortMessages : [])
                      .filter((m) => String(m?.text || '').trim())
                      .filter((m) => String(m?.chatMode || '') === 'short')
                      .slice(-40)
                      .map((m) => {
                        const fromMe = String(m?.userId || '').trim() === String(user?.uid || '').trim();
                        const translated =
                          m?.translations && typeof m.translations === 'object'
                            ? String(m.translations?.[targetLang] || '').trim()
                            : '';
                        return (
                          <div key={m.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={
                              'max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ' +
                              (fromMe ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900')
                            }>
                              {String(m.text || '').trim()}
                              {!fromMe ? (
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  {translated ? <div className="text-xs text-slate-600">{targetLang.toUpperCase()}: {translated}</div> : <span />}
                                  <button
                                    type="button"
                                    onClick={() => translateMessage({ matchId: shortModal.matchId, messageId: m.id })}
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
                </div>
              </div>

              <form onSubmit={sendShort} className="p-4 pt-0">
                <textarea
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
                    onClick={() => setShortModal({ open: false, matchId: '', displayName: '' })}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                  >
                    {t('studio.common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={shortState.loading || !String(shortText || '').trim() || shortLimitInfo.remaining <= 0}
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
