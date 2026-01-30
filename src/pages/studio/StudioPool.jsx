import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../auth/AuthProvider';
import { db } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';
import { translateStudioApiError } from '../../utils/studioErrorI18n';
import StudioInboxModal from '../../components/studio/StudioInboxModal';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function clip(s, maxLen) {
  const v = safeStr(s);
  if (!v) return '';
  return v.length > maxLen ? `${v.slice(0, maxLen)}…` : v;
}

function genderLabelTR(raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  if (s === 'female' || s === 'f' || s === 'kadin' || s === 'kadın') return 'Kadın';
  if (s === 'male' || s === 'm' || s === 'erkek') return 'Erkek';
  return '';
}

export default function StudioPool() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [state, setState] = useState({ loading: true, error: '' });
  const [meta, setMeta] = useState(null);
  const [items, setItems] = useState([]);
  const [lastUpdatedMs, setLastUpdatedMs] = useState(0);

  const [outboxMap, setOutboxMap] = useState({});
  const [grantedMap, setGrantedMap] = useState({});
  const [requestingUid, setRequestingUid] = useState('');

  const [inboxAccess, setInboxAccess] = useState([]);
  const [accessAction, setAccessAction] = useState({ loadingId: '', error: '' });

  const [inboxMessages, setInboxMessages] = useState([]);

  const [inboxModal, setInboxModal] = useState({ open: false, mode: 'requests' });

  const [composeModal, setComposeModal] = useState({ open: false, targetUid: '', name: '' });
  const [composeText, setComposeText] = useState('');
  const [composeState, setComposeState] = useState({ loading: false, error: '' });

  const [myLock, setMyLock] = useState({ active: false, matchId: '' });
  const [myMembership, setMyMembership] = useState({ active: false });
  const [paywallNotice, setPaywallNotice] = useState('');

  const [profileModal, setProfileModal] = useState({ open: false, loading: false, error: '', profile: null });

  const cancelledRef = useRef(false);

  const load = useCallback(
    async ({ silent } = { silent: false }) => {
      if (!silent) setState({ loading: true, error: '' });
      try {
        const data = await authFetch('/api/matchmaking-browse', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ limit: 30 }),
        });

        if (cancelledRef.current) return;
        setMeta(data?.meta || null);
        setItems(Array.isArray(data?.items) ? data.items : []);
        setLastUpdatedMs(Date.now());
        setState({ loading: false, error: '' });
      } catch (e) {
        if (cancelledRef.current) return;
        const msg = safeStr(e?.message) || 'load_failed';
        setItems([]);
        setMeta(null);
        setState({ loading: false, error: translateStudioApiError(t, msg) || msg });
      }
    },
    [t]
  );

  // Outbox (benim gönderdiğim ön eşleşme istekleri)
  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid) {
      setOutboxMap({});
      return;
    }

    const q = query(
      collection(db, 'matchmakingUsers', uid, 'outboxPreMatchRequests'),
      orderBy('updatedAtMs', 'desc'),
      limit(200)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const m = {};
        snap.forEach((d) => {
          const data = d.data() || {};
          const rawToUid = safeStr(data?.toUid) || safeStr(data?.targetUid);
          const docId = safeStr(d.id);

          // Bazı eski dokümanlarda toUid alanı eksik olabilir.
          // Fallback: docId'den (uid__otherUid) hedefi türet.
          let derivedToUid = '';
          const parts = docId.split('__').map(safeStr).filter(Boolean);
          if (parts.length === 2) {
            derivedToUid = parts[0] === uid ? parts[1] : parts[1] === uid ? parts[0] : parts[1];
          } else {
            derivedToUid = docId;
          }

          const toUid = rawToUid || derivedToUid;
          if (!toUid) return;
          m[toUid] = { id: docId, ...data, ...(rawToUid ? {} : { toUid }) };
        });
        setOutboxMap(m);
      },
      () => setOutboxMap({})
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [user?.uid]);

  // Gelen ön eşleşme istekleri (inbox)
  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid) {
      setInboxAccess([]);
      return;
    }

    const q = query(
      collection(db, 'matchmakingUsers', uid, 'inboxPreMatchRequests'),
      orderBy('createdAtMs', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxAccess(items);
      },
      () => setInboxAccess([])
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [user?.uid]);

  // Gelen direkt mesajlar (inbox)
  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid) {
      setInboxMessages([]);
      return;
    }

    const q = query(
      collection(db, 'matchmakingUsers', uid, 'inboxMessages'),
      orderBy('createdAtMs', 'desc'),
      limit(40)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxMessages(items);
      },
      () => setInboxMessages([])
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [user?.uid]);

  // Üyelik durumu (paywall için)
  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid) {
      setMyLock({ active: false, matchId: '' });
      setMyMembership({ active: false });
      return;
    }

    const asMs = (v) => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (v && typeof v.toMillis === 'function') return v.toMillis();
      if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
      return 0;
    };

    const ref = doc(db, 'matchmakingUsers', uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.exists() ? snap.data() || {} : {};

        const lock = d?.matchmakingLock && typeof d.matchmakingLock === 'object' ? d.matchmakingLock : null;
        const active = !!lock?.active;
        const matchId = typeof lock?.matchId === 'string' ? String(lock.matchId).trim() : '';
        setMyLock({ active, matchId });

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
  }, [user?.uid]);

  const requirePaid = () => {
    setPaywallNotice(t('studio.paywall.upgradeToInteract'));
    try {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // noop
    }
  };

  const respondAccessRequest = async ({ fromUid, decision }) => {
    const uid = String(user?.uid || '').trim();
    const from = safeStr(fromUid);
    const d = safeStr(decision);
    if (!uid || !from || (d !== 'approve' && d !== 'reject')) return;
    if (accessAction.loadingId) return;

    setAccessAction({ loadingId: from, error: '' });
    try {
      await authFetch('/api/matchmaking-pre-match-respond', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fromUid: from, decision: d }),
      });
      setAccessAction({ loadingId: '', error: '' });
    } catch (e) {
      const msg = safeStr(e?.message) || 'action_failed';
      setAccessAction({ loadingId: '', error: translateStudioApiError(t, msg) || msg });
    }
  };

  // Granted (bana verilmiş profil izinleri)
  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid) {
      setGrantedMap({});
      return;
    }

    const q = query(collection(db, 'matchmakingUsers', uid, 'profileAccessGranted'), orderBy('grantedAtMs', 'desc'), limit(300));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const m = {};
        snap.forEach((d) => {
          const other = String(d.id || '').trim();
          if (!other) return;
          m[other] = true;
        });
        setGrantedMap(m);
      },
      () => setGrantedMap({})
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
    cancelledRef.current = false;
    load({ silent: false });

    const id = setInterval(() => {
      load({ silent: true });
    }, 20000);

    return () => {
      cancelledRef.current = true;
      try {
        clearInterval(id);
      } catch {
        // noop
      }
    };
  }, [load]);

  const headerHint = useMemo(() => {
    if (!meta) return '';
    const min = typeof meta?.ageMin === 'number' ? meta.ageMin : null;
    const max = typeof meta?.ageMax === 'number' ? meta.ageMax : null;
    if (min === null || max === null) return '';
    return t('studio.pool.filtersHint', { min, max });
  }, [meta, t]);

  const requestAccess = async ({ targetUid } = {}) => {
    const uid = String(user?.uid || '').trim();
    const toUid = safeStr(targetUid);
    if (!uid || !toUid || requestingUid) return;

    setRequestingUid(toUid);
    try {
      await authFetch('/api/matchmaking-pre-match-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetUid: toUid }),
      });

      // Snapshot gecikse bile UI'da "İstek gönderildi" durumunu koru.
      setOutboxMap((prev) => {
        const cur = prev && typeof prev === 'object' ? prev : {};
        const existing = cur?.[toUid] && typeof cur[toUid] === 'object' ? cur[toUid] : null;
        const st = safeStr(existing?.status);
        if (st === 'pending' || st === 'approved') return cur;
        const nowMs = Date.now();
        return {
          ...cur,
          [toUid]: {
            ...(existing || {}),
            id: safeStr(existing?.id) || `${uid}__${toUid}`,
            type: 'pre_match',
            status: 'pending',
            fromUid: uid,
            toUid,
            createdAtMs: typeof existing?.createdAtMs === 'number' ? existing.createdAtMs : nowMs,
            updatedAtMs: nowMs,
          },
        };
      });

      setRequestingUid('');
    } catch (e) {
      const msg = safeStr(e?.message) || 'request_failed';
      setRequestingUid('');
      setState((s) => ({ ...s, error: translateStudioApiError(t, msg) || msg }));
    }
  };

  const openCompose = ({ targetUid, name }) => {
    const toUid = safeStr(targetUid);
    if (!toUid) return;

    setComposeText('');
    setComposeState({ loading: false, error: '' });
    setComposeModal({ open: true, targetUid: toUid, name: safeStr(name) || t('studio.common.profile') });
  };

  const sendCompose = async () => {
    const toUid = safeStr(composeModal?.targetUid);
    const text = safeStr(composeText);
    if (!toUid || !text || composeState.loading) return;

    setComposeState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-inbox-message-send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetUid: toUid, text }),
      });
      setComposeState({ loading: false, error: '' });
      setComposeModal({ open: false, targetUid: '', name: '' });
      setComposeText('');
    } catch (e) {
      const msg = safeStr(e?.message) || 'send_failed';
      setComposeState({ loading: false, error: translateStudioApiError(t, msg) || msg });
    }
  };

  const unreadMessageCount = useMemo(() => {
    const list = Array.isArray(inboxMessages) ? inboxMessages : [];
    return list.filter((x) => {
      const msg = safeStr(x?.text);
      if (!msg) return false;
      const readMs = typeof x?.readAtMs === 'number' && Number.isFinite(x.readAtMs) ? x.readAtMs : 0;
      return readMs <= 0;
    }).length;
  }, [inboxMessages]);

  const pendingAccessCount = useMemo(() => {
    const list = Array.isArray(inboxAccess) ? inboxAccess : [];
    if (myLock?.active) return 0;
    return list.filter((x) => safeStr(x?.status) === 'pending').length;
  }, [inboxAccess, myLock?.active]);

  const markInboxMessageRead = async ({ requestId, fromUid }) => {
    try {
      await authFetch('/api/matchmaking-inbox-mark-read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId, fromUid }),
      });
    } catch {
      // best-effort
    }
  };

  const markDirectMessageRead = async ({ messageId }) => {
    const id = safeStr(messageId);
    if (!id) return;
    try {
      await authFetch('/api/matchmaking-inbox-message-mark-read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messageId: id }),
      });
    } catch {
      // best-effort
    }
  };

  const openProfile = async ({ targetUid }) => {
    const uid = String(user?.uid || '').trim();
    const toUid = safeStr(targetUid);
    if (!uid || !toUid) return;

    setProfileModal({ open: true, loading: true, error: '', profile: null });
    try {
      const data = await authFetch('/api/matchmaking-profile-view', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetUid: toUid }),
      });
      setProfileModal({ open: true, loading: false, error: '', profile: data?.profile || null });
    } catch (e) {
      const msg = safeStr(e?.message) || 'load_failed';
      setProfileModal({ open: true, loading: false, error: translateStudioApiError(t, msg) || msg, profile: null });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">{t('studio.pool.title')}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setInboxModal({ open: true, mode: 'requests' })}
                className="relative inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                İstekler
                {pendingAccessCount > 0 ? (
                  <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                    {pendingAccessCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setInboxModal({ open: true, mode: 'messages' })}
                className="relative inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Mesajlar
                {unreadMessageCount > 0 ? (
                  <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                    {unreadMessageCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => load({ silent: false })}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                {t('studio.pool.refresh')}
              </button>
              <Link
                to="/app/matches"
                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                {t('studio.pool.backToMatches')}
              </Link>
            </div>
          </div>

          {headerHint ? <p className="mt-2 text-sm text-slate-600">{headerHint}</p> : null}
          {lastUpdatedMs ? (
            <p className="mt-1 text-xs text-slate-500">{t('studio.pool.lastUpdated')}</p>
          ) : null}
          {meta && typeof meta?.total === 'number' ? (
            <p className="mt-1 text-xs text-slate-500">{t('studio.pool.countHint', { total: meta.total, shown: items.length })}</p>
          ) : null}

          {paywallNotice ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
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

          {state.loading ? <p className="mt-6 text-slate-600">{t('studio.common.loading')}</p> : null}
          {state.error ? <p className="mt-6 text-rose-700">{state.error}</p> : null}

          {!state.loading && !state.error && items.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
              {t('studio.pool.empty')}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => {
              const p = it?.profile && typeof it.profile === 'object' ? it.profile : {};
              const canInteractByAge = !!it?.canInteract;
              const canInteract = canInteractByAge;
              const targetUid = safeStr(it?.uid);
              const out = targetUid ? outboxMap?.[targetUid] : null;
              const pending = safeStr(out?.status) === 'pending';
              const approved = safeStr(out?.status) === 'approved';
              const approvedMatchId = safeStr(out?.matchId);
              const name = safeStr(p?.username) || t('studio.common.profile');
              const age = typeof p?.age === 'number' ? `, ${p.age}` : '';
              const city = safeStr(p?.city);
              const marital = safeStr(p?.details?.maritalStatus);
              const occupation = safeStr(p?.details?.occupation);
              const genderText = genderLabelTR(p?.gender);
              const about = clip(p?.about, 180);
              const exp = clip(p?.expectations, 180);
              const photo = Array.isArray(p?.photoUrls) && p.photoUrls.length ? safeStr(p.photoUrls[0]) : '';

              return (
                <div key={safeStr(it?.uid) || safeStr(it?.applicationId)} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  {photo ? <img src={photo} alt={name} className="h-44 w-full object-cover" loading="lazy" decoding="async" /> : <div className="h-44 w-full bg-slate-100" />}

                  <div className="p-4">
                    <p className="text-lg font-semibold">{name}{age}</p>
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      {genderText ? <p>{genderText}</p> : null}
                      {marital ? <p>{marital}</p> : null}
                      {city ? <p>{city}</p> : null}
                      {occupation ? <p>{occupation}</p> : null}
                    </div>

                    {about || exp ? (
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        {about ? <p><span className="font-semibold">{t('studio.myInfo.fields.about')}:</span> {about}</p> : null}
                        {exp ? <p><span className="font-semibold">{t('studio.myInfo.fields.expectations')}:</span> {exp}</p> : null}
                      </div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-1 gap-2">
                      {approved && approvedMatchId ? (
                        <Link
                          to={`/app/match/${approvedMatchId}`}
                          className="inline-flex flex-1 items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          Eşleşme kartına git
                        </Link>
                      ) : pending ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex flex-1 items-center justify-center rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
                        >
                          {t('studio.pool.requestSent')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!canInteractByAge || requestingUid === targetUid}
                          onClick={() => {
                            requestAccess({ targetUid });
                          }}
                          className={
                            canInteract
                              ? 'inline-flex flex-1 items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60'
                              : 'inline-flex flex-1 items-center justify-center rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-600'
                          }
                          title={
                            canInteractByAge ? '' : t('studio.pool.notInTheirRange')
                          }
                        >
                          {canInteract
                            ? requestingUid === targetUid
                              ? t('studio.pool.requesting')
                              : t('studio.pool.requestProfileNow')
                            : t('studio.pool.notInTheirRangeShort')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <StudioInboxModal
            open={!!inboxModal?.open}
            onClose={() => setInboxModal({ open: false, mode: 'requests' })}
            title={inboxModal?.mode === 'messages' ? 'Mesajlar' : 'İstekler'}
            items={inboxModal?.mode === 'messages' ? inboxMessages : myLock?.active ? [] : inboxAccess}
            mode={inboxModal?.mode}
            onMarkRead={inboxModal?.mode === 'messages' ? markDirectMessageRead : markInboxMessageRead}
            onApprove={inboxModal?.mode === 'messages' ? null : ({ fromUid }) => respondAccessRequest({ fromUid, decision: 'approve' })}
            onReject={inboxModal?.mode === 'messages' ? null : ({ fromUid }) => respondAccessRequest({ fromUid, decision: 'reject' })}
            loadingId={accessAction.loadingId}
            error={accessAction.error}
          />

          {composeModal.open ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <p className="font-semibold">{composeModal?.name || 'Mesaj'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setComposeModal({ open: false, targetUid: '', name: '' });
                      setComposeText('');
                      setComposeState({ loading: false, error: '' });
                    }}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    {t('studio.common.close')}
                  </button>
                </div>

                <div className="p-4">
                  <p className="text-sm text-slate-600">Kısa bir mesaj yaz (telefon / link / sosyal medya paylaşma).</p>

                  <textarea
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    rows={4}
                    maxLength={240}
                    className="mt-3 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-400"
                    placeholder="Merhaba, nasılsın?"
                  />

                  {composeState.error ? <p className="mt-2 text-sm text-rose-700">{composeState.error}</p> : null}

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setComposeModal({ open: false, targetUid: '', name: '' });
                        setComposeText('');
                        setComposeState({ loading: false, error: '' });
                      }}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      {t('studio.common.cancel')}
                    </button>

                    <button
                      type="button"
                      disabled={!safeStr(composeText) || composeState.loading}
                      onClick={sendCompose}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {composeState.loading ? t('studio.common.processing') : t('studio.common.send')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {profileModal.open ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <p className="font-semibold">{t('studio.pool.profileModalTitle')}</p>
                  <button
                    type="button"
                    onClick={() => setProfileModal({ open: false, loading: false, error: '', profile: null })}
                    className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    {t('studio.common.close')}
                  </button>
                </div>

                <div className="max-h-[75vh] overflow-auto p-4">
                  {profileModal.loading ? <p className="text-slate-600">{t('studio.common.loading')}</p> : null}
                  {profileModal.error ? <p className="text-rose-700">{profileModal.error}</p> : null}

                  {!profileModal.loading && !profileModal.error && profileModal.profile ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xl font-bold">
                          {safeStr(profileModal.profile?.username) || t('studio.common.profile')}
                          {typeof profileModal.profile?.age === 'number' ? `, ${profileModal.profile.age}` : ''}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {safeStr(profileModal.profile?.city)}{safeStr(profileModal.profile?.country) ? `, ${safeStr(profileModal.profile.country)}` : ''}
                        </p>
                      </div>

                      {Array.isArray(profileModal.profile?.photoUrls) && profileModal.profile.photoUrls.length ? (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {profileModal.profile.photoUrls.slice(0, 6).map((u) => (
                            <img key={u} src={u} alt="" className="h-40 w-full rounded-md object-cover" loading="lazy" decoding="async" />
                          ))}
                        </div>
                      ) : null}

                      {safeStr(profileModal.profile?.about) ? (
                        <div>
                          <p className="font-semibold">{t('studio.myInfo.fields.about')}</p>
                          <p className="mt-1 whitespace-pre-wrap text-slate-800">{profileModal.profile.about}</p>
                        </div>
                      ) : null}

                      {safeStr(profileModal.profile?.expectations) ? (
                        <div>
                          <p className="font-semibold">{t('studio.myInfo.fields.expectations')}</p>
                          <p className="mt-1 whitespace-pre-wrap text-slate-800">{profileModal.profile.expectations}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
