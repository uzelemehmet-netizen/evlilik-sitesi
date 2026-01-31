import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider';
import { db } from '../../config/firebase';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import StudioMatchCard from '../../components/studio/StudioMatchCard';
import StudioInboxModal from '../../components/studio/StudioInboxModal';
import { authFetch } from '../../utils/authFetch';
import { translateStudioApiError } from '../../utils/studioErrorI18n';
import { useMatchmakingResetAtMs } from '../../utils/matchmakingReset';

export default function StudioMatches() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const mmReset = useMatchmakingResetAtMs();
  const resetAtMs = typeof mmReset?.resetAtMs === 'number' && Number.isFinite(mmReset.resetAtMs) ? mmReset.resetAtMs : 0;

  const targetLang = useMemo(() => {
    const raw = String(i18n?.language || 'tr');
    const base = raw.split('-')[0];
    return base || 'tr';
  }, [i18n?.language]);

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [inboxLikes, setInboxLikes] = useState([]);
  const [inboxAction, setInboxAction] = useState({ loadingId: '', error: '' });

  const [inboxAccess, setInboxAccess] = useState([]); // pre-match requests
  const [inboxProfileAccess, setInboxProfileAccess] = useState([]); // profile access requests
  const [accessAction, setAccessAction] = useState({ loadingId: '', error: '' });

  const [inboxMessages, setInboxMessages] = useState([]);

  const [inboxModal, setInboxModal] = useState({ open: false, mode: 'requests' });

  const [inboxLoad, setInboxLoad] = useState({ loading: false, error: '', lastSource: '' });
  const clientProjectId = useMemo(() => {
    try {
      return db?.app?.options?.projectId || '';
    } catch {
      return '';
    }
  }, []);

  const [shortModal, setShortModal] = useState({ open: false, matchId: '', displayName: '' });
  const [shortText, setShortText] = useState('');
  const [shortState, setShortState] = useState({ loading: false, error: '' });
  const [shortMatch, setShortMatch] = useState(null);
  const [shortMessages, setShortMessages] = useState([]);
  const [shortLoading, setShortLoading] = useState(false);
  const shortScrollRef = useRef(null);
  const [translateState, setTranslateState] = useState({ loadingId: '', error: '' });

  const [myLock, setMyLock] = useState({ active: false, matchId: '' });
  const [myMembership, setMyMembership] = useState({ active: false });
  const [paywallNotice, setPaywallNotice] = useState('');

  const asMs = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v && typeof v.toMillis === 'function') return v.toMillis();
    if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
    return 0;
  };

  const filterInboxLikes = (raw, uid, cutoffMs) => {
    const me = String(uid || '').trim();
    const list = Array.isArray(raw) ? raw : [];
    return list
      .filter((x) => {
        if (!x || typeof x !== 'object') return false;
        const createdAtMs = typeof x?.createdAtMs === 'number' && Number.isFinite(x.createdAtMs) ? x.createdAtMs : 0;
        if (cutoffMs > 0 && createdAtMs > 0 && createdAtMs < cutoffMs) return false;
        if (String(x?.type || '').trim() && String(x?.type || '').trim() !== 'like') return false;
        if (String(x?.status || '').trim() !== 'pending') return false;
        const fromUid = String(x?.fromUid || '').trim();
        const toUid = String(x?.toUid || '').trim();
        if (me && fromUid && fromUid === me) return false;
        if (me && toUid && toUid !== me) return false;
        const mid = String(x?.matchId || x?.id || '').trim();
        return !!mid;
      })
      .slice(0, 50);
  };

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

  const buildMatchesQuery = ({ uid, preferUpdatedAt }) => {
    const base = [collection(db, 'matchmakingMatches'), where('userIds', 'array-contains', uid)];
    if (preferUpdatedAt) {
      return query(...base, orderBy('updatedAt', 'desc'), limit(25));
    }
    return query(...base, orderBy('createdAt', 'desc'), limit(25));
  };

  // Gelen beğeniler (inbox)
  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid) {
      setInboxLikes([]);
      return;
    }

    const qInbox = query(
      collection(db, 'matchmakingUsers', uid, 'inboxLikes'),
      orderBy('createdAtMs', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(
      qInbox,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        // Sadece bekleyen + bana gelen beğeniler görünmeli; aksi halde kart "takılı" kalıyor.
        setInboxLikes(filterInboxLikes(items, uid, resetAtMs));
        setInboxLoad((s) => (s.lastSource === 'api' ? s : { ...s, error: '', lastSource: 'firestore' }));
      },
      (e) => {
        setInboxLikes([]);
        const code = String(e?.code || '').trim();
        const msg = String(e?.message || '').trim();
        const hint =
          code === 'permission-denied'
            ? `Firestore okuma izni yok (permission-denied). Firebase projesi: ${clientProjectId || '?'} (Sunucudan yenile deneyin)`
            : `Firestore beğeni inbox dinlemesi hata verdi: ${code || msg || 'unknown_error'} (Sunucudan yenile deneyin)`;
        setInboxLoad((s) => ({ ...s, error: hint, lastSource: s.lastSource || 'firestore' }));
        refreshInboxViaApi();
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [resetAtMs, user?.uid]);

  // Gelen ön eşleşme istekleri
  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid) {
      setInboxAccess([]);
      return;
    }

    const qInbox = query(
      collection(db, 'matchmakingUsers', uid, 'inboxPreMatchRequests'),
      orderBy('createdAtMs', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      qInbox,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxAccess(items);
        setInboxLoad((s) => (s.lastSource === 'api' ? s : { ...s, error: '', lastSource: 'firestore' }));
      },
      (e) => {
        setInboxAccess([]);
        const code = String(e?.code || '').trim();
        const msg = String(e?.message || '').trim();
        const hint =
          code === 'permission-denied'
            ? `Firestore okuma izni yok (permission-denied). Firebase projesi: ${clientProjectId || '?'} (Sunucudan yenile deneyin)`
            : `Firestore istek inbox dinlemesi hata verdi: ${code || msg || 'unknown_error'} (Sunucudan yenile deneyin)`;
        setInboxLoad((s) => ({ ...s, error: hint, lastSource: s.lastSource || 'firestore' }));
        refreshInboxViaApi();
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

  // Gelen profil erişim istekleri
  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid) {
      setInboxProfileAccess([]);
      return;
    }

    const qInbox = query(
      collection(db, 'matchmakingUsers', uid, 'inboxAccessRequests'),
      orderBy('createdAtMs', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      qInbox,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxProfileAccess(items);
        setInboxLoad((s) => (s.lastSource === 'api' ? s : { ...s, error: '', lastSource: 'firestore' }));
      },
      (e) => {
        setInboxProfileAccess([]);
        const code = String(e?.code || '').trim();
        const msg = String(e?.message || '').trim();
        const hint =
          code === 'permission-denied'
            ? `Firestore okuma izni yok (permission-denied). Firebase projesi: ${clientProjectId || '?'} (Sunucudan yenile deneyin)`
            : `Firestore profil izin inbox dinlemesi hata verdi: ${code || msg || 'unknown_error'} (Sunucudan yenile deneyin)`;
        setInboxLoad((s) => ({ ...s, error: hint, lastSource: s.lastSource || 'firestore' }));
        refreshInboxViaApi();
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

  // Gelen direkt mesajlar (inbox)
  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid) {
      setInboxMessages([]);
      return;
    }

    const qInbox = query(
      collection(db, 'matchmakingUsers', uid, 'inboxMessages'),
      orderBy('createdAtMs', 'desc'),
      limit(40)
    );

    const unsub = onSnapshot(
      qInbox,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxMessages(items);
        setInboxLoad((s) => (s.lastSource === 'api' ? s : { ...s, error: '', lastSource: 'firestore' }));
      },
      (e) => {
        setInboxMessages([]);
        const code = String(e?.code || '').trim();
        const msg = String(e?.message || '').trim();
        const hint =
          code === 'permission-denied'
            ? `Firestore okuma izni yok (permission-denied). Firebase projesi: ${clientProjectId || '?'} (Sunucudan yenile deneyin)`
            : `Firestore mesaj inbox dinlemesi hata verdi: ${code || msg || 'unknown_error'} (Sunucudan yenile deneyin)`;
        setInboxLoad((s) => ({ ...s, error: hint, lastSource: s.lastSource || 'firestore' }));
        refreshInboxViaApi();
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

  const respondInboxLike = async ({ matchId, decision }) => {
    const uid = String(user?.uid || '').trim();
    const mid = String(matchId || '').trim();
    const d = String(decision || '').trim();
    if (!uid || !mid || (d !== 'accept' && d !== 'reject')) return;
    if (inboxAction.loadingId) return;

    setInboxAction({ loadingId: mid, error: '' });
    try {
      await authFetch('/api/matchmaking-decision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid, decision: d }),
      });
      setInboxAction({ loadingId: '', error: '' });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setInboxAction({ loadingId: '', error: translateStudioApiError(t, msg) || msg || 'action_failed' });
    }
  };

  const respondAccessRequest = async ({ fromUid, decision, type }) => {
    const uid = String(user?.uid || '').trim();
    const from = String(fromUid || '').trim();
    const d = String(decision || '').trim();
    if (!uid || !from || (d !== 'approve' && d !== 'reject')) return;
    if (accessAction.loadingId) return;

    const reqType = String(type || '').trim();
    const endpoint = reqType === 'profile_access' ? '/api/matchmaking-profile-access-respond' : '/api/matchmaking-pre-match-respond';
    const loadingKey = `${reqType || 'pre_match'}:${from}`;

    setAccessAction({ loadingId: loadingKey, error: '' });
    try {
      await authFetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fromUid: from, decision: d }),
      });
      setAccessAction({ loadingId: '', error: '' });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setAccessAction({ loadingId: '', error: translateStudioApiError(t, msg) || msg || 'action_failed' });
    }
  };

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
      String(shortOther?.username || '').trim() ||
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

    let unsub = null;
    let didFallback = false;

    const startListen = ({ preferUpdatedAt }) => {
      const q = buildMatchesQuery({ uid, preferUpdatedAt });
      unsub = onSnapshot(
        q,
        (snap) => {
          const items = [];
          snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
          setMatches(items);
          setLoading(false);
        },
        (e) => {
          // Eğer updatedAt index'i yoksa (failed-precondition) createdAt ile tekrar dene.
          const code = String(e?.code || '').trim();
          if (!didFallback && preferUpdatedAt && code === 'failed-precondition') {
            didFallback = true;
            try {
              unsub?.();
            } catch {
              // noop
            }
            startListen({ preferUpdatedAt: false });
            return;
          }

          console.error('StudioMatches load failed', e);
          setError(String(e?.message || '').trim() || code || 'unknown');
          setMatches([]);
          setLoading(false);
        }
      );
    };

    startListen({ preferUpdatedAt: true });

    return () => {
      try {
        unsub?.();
      } catch {
        // noop
      }
    };
  }, [user?.uid]);

  const visibleMatches = useMemo(() => {
    const list = Array.isArray(matches) ? matches : [];
    return list
      .filter((m) => {
        const st = String(m?.status || '').trim();
        return st !== 'cancelled';
      })
      .filter((m) => {
        if (!resetAtMs) return true;
        const created =
          (typeof m?.createdAtMs === 'number' && Number.isFinite(m.createdAtMs) ? m.createdAtMs : 0) ||
          asMs(m?.createdAt) ||
          0;
        // Soft reset: reset öncesi match'leri yok say.
        if (created > 0 && created < resetAtMs) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        const aMs =
          (typeof a?.updatedAtMs === 'number' && Number.isFinite(a.updatedAtMs) ? a.updatedAtMs : 0) ||
          asMs(a?.updatedAt) ||
          (typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0) ||
          asMs(a?.createdAt) ||
          0;
        const bMs =
          (typeof b?.updatedAtMs === 'number' && Number.isFinite(b.updatedAtMs) ? b.updatedAtMs : 0) ||
          asMs(b?.updatedAt) ||
          (typeof b?.createdAtMs === 'number' && Number.isFinite(b.createdAtMs) ? b.createdAtMs : 0) ||
          asMs(b?.createdAt) ||
          0;
        if (bMs !== aMs) return bMs - aMs;
        return String(a?.id || '').localeCompare(String(b?.id || ''));
      });
  }, [matches, resetAtMs]);

  const visibleMatchIdSet = useMemo(() => {
    const set = new Set();
    (Array.isArray(visibleMatches) ? visibleMatches : []).forEach((m) => {
      const id = String(m?.id || '').trim();
      if (id) set.add(id);
    });
    return set;
  }, [visibleMatches]);

  const inboxLikesBanner = useMemo(() => {
    const list = Array.isArray(inboxLikes) ? inboxLikes : [];
    // Match listesinde zaten görünen like'lar için üst banner göstermeyelim.
    return list.filter((it) => {
      const mid = String(it?.matchId || it?.id || '').trim();
      if (!mid) return false;
      return !visibleMatchIdSet.has(mid);
    });
  }, [inboxLikes, visibleMatchIdSet]);

  const pendingAccessRequests = useMemo(() => {
    const list1 = Array.isArray(inboxAccess) ? inboxAccess : [];
    const list2 = Array.isArray(inboxProfileAccess) ? inboxProfileAccess : [];
    const merged = [...list1, ...list2];
    return merged.filter((x) => {
      if (String(x?.status || '').trim() !== 'pending') return false;
      const createdAtMs = typeof x?.createdAtMs === 'number' && Number.isFinite(x.createdAtMs) ? x.createdAtMs : 0;
      if (resetAtMs > 0 && createdAtMs > 0 && createdAtMs < resetAtMs) return false;
      // Ürün kuralı: Aktif eşleşmesi olan kullanıcı, ön eşleşme isteklerini görmesin.
      // Lock kalkınca (iptal vb.) tekrar görünür.
      const type = String(x?.type || '').trim();
      if (myLock?.active && type === 'pre_match') return false;
      return true;
    });
  }, [inboxAccess, inboxProfileAccess, myLock?.active, resetAtMs]);

  const unreadMessageCount = useMemo(() => {
    const list = Array.isArray(inboxMessages) ? inboxMessages : [];
    return list.filter((x) => {
      const msg = String(x?.text || '').trim();
      if (!msg) return false;
      const readMs = typeof x?.readAtMs === 'number' && Number.isFinite(x.readAtMs) ? x.readAtMs : 0;
      return readMs <= 0;
    }).length;
  }, [inboxMessages]);

  const markInboxMessageRead = async ({ requestId, fromUid }) => {
    // accessRequests mesajı (opsiyonel)
    if (requestId || fromUid) {
      try {
        await authFetch('/api/matchmaking-inbox-mark-read', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ requestId, fromUid }),
        });
      } catch {
        // best-effort
      }
      return;
    }
  };

  const markDirectMessageRead = async ({ messageId }) => {
    const id = String(messageId || '').trim();
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

  const refreshInboxViaApi = async () => {
    const uid = String(user?.uid || '').trim();
    if (!uid || inboxLoad.loading) return;
    setInboxLoad({ loading: true, error: '', lastSource: inboxLoad.lastSource || '' });
    try {
      const data = await authFetch('/api/matchmaking-inbox-summary', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ limit: 60 }),
      });
      setInboxLikes(filterInboxLikes(Array.isArray(data?.inboxLikes) ? data.inboxLikes : [], uid, resetAtMs));
      setInboxAccess(Array.isArray(data?.inboxPreMatchRequests) ? data.inboxPreMatchRequests : []);
      setInboxProfileAccess(Array.isArray(data?.inboxAccessRequests) ? data.inboxAccessRequests : []);
      setInboxMessages(Array.isArray(data?.inboxMessages) ? data.inboxMessages : []);
      setInboxLoad({ loading: false, error: '', lastSource: 'api' });
    } catch (e) {
      const msg = String(e?.message || '').trim() || 'inbox_refresh_failed';
      setInboxLoad({ loading: false, error: translateStudioApiError(t, msg) || msg, lastSource: 'api' });
    }
  };

  const requirePaid = () => {
    setPaywallNotice(t('studio.paywall.upgradeToInteract'));
    try {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // noop
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

    // Ücretsiz kullanıcılar kısa mesaj gönderemez.
    if (!myMembership?.active) {
      requirePaid();
      setShortState({ loading: false, error: t('studio.paywall.upgradeToReply') });
      return;
    }

    if (shortState.loading) return;
    if (shortLimitInfo.remaining <= 0) {
      setShortState({ loading: false, error: t('studio.errors.shortLimit') });
      return;
    }

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
      if (msg === 'short_message_limit' || msg === 'short_message_daily_limit' || msg === 'chat_limit_reached') {
        setShortState({ loading: false, error: t('studio.errors.shortLimit') });
      } else {
        setShortState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'send_failed' });
      }
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
      setTranslateState({ loadingId: '', error: translateStudioApiError(t, msg) || msg || 'translate_failed' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {inboxLoad.error ? (
          <div className="mb-6 mx-auto max-w-5xl rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Inbox senkron problemi</p>
              <button
                type="button"
                onClick={refreshInboxViaApi}
                disabled={inboxLoad.loading}
                className="inline-flex items-center justify-center rounded-md bg-rose-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-800 disabled:opacity-60"
              >
                {inboxLoad.loading ? 'Yenileniyor…' : 'Sunucudan yenile'}
              </button>
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap">{inboxLoad.error}</p>
            <p className="mt-2 text-xs text-rose-700">
              Not: Bu buton, Firestore dinlemesi bozulsa bile server (Admin SDK) üzerinden aynı veriyi getirir.
            </p>
          </div>
        ) : null}

        {pendingAccessRequests.length ? (
          <div className="mb-6 mx-auto max-w-5xl rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-950 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {t('studio.accessInbox.title', { count: pendingAccessRequests.length })}
              </p>
              {accessAction.error ? <p className="text-sm text-rose-700">{accessAction.error}</p> : null}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingAccessRequests.map((it) => {
                const p = it?.fromProfile && typeof it.fromProfile === 'object' ? it.fromProfile : null;
                const name = String(p?.username || '').trim() || t('studio.common.profile');
                const age = typeof p?.age === 'number' ? String(p.age) : '';
                const photo = String(p?.photoUrl || '').trim();
                const fromUid = String(it?.fromUid || '').trim();
                const type = String(it?.type || '').trim();
                const isPreMatch = type === 'pre_match';
                const acting = !!accessAction.loadingId && accessAction.loadingId === `${type || 'pre_match'}:${fromUid}`;
                const subtitle = isPreMatch ? 'Ön eşleşme isteği' : t('studio.accessInbox.requested');

                return (
                  <div key={it.id} className="rounded-lg border border-indigo-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      {photo ? (
                        <img src={photo} alt={name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{name}{age ? `, ${age}` : ''}</p>
                        <p className="text-xs text-slate-600">{subtitle}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={acting || !fromUid}
                        onClick={() => respondAccessRequest({ fromUid, decision: 'approve', type })}
                        className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {acting ? t('studio.common.processing') : isPreMatch ? 'Onayla' : t('studio.accessInbox.approve')}
                      </button>

                      <button
                        type="button"
                        disabled={acting || !fromUid}
                        onClick={() => respondAccessRequest({ fromUid, decision: 'reject', type })}
                        className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 shadow-sm transition hover:bg-rose-100 disabled:opacity-60"
                      >
                        {t('studio.accessInbox.reject')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {inboxLikesBanner.length ? (
          <div className="mb-6 mx-auto max-w-5xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {t('studio.inbox.likesTitle', { count: inboxLikesBanner.length })}
              </p>
              {inboxAction.error ? (
                <p className="text-sm text-rose-700">{inboxAction.error}</p>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {inboxLikesBanner.map((it) => {
                const p = it?.fromProfile && typeof it.fromProfile === 'object' ? it.fromProfile : null;
                const name = String(p?.username || '').trim() || t('studio.common.match');
                const age = typeof p?.age === 'number' ? String(p.age) : '';
                const photo = Array.isArray(p?.photoUrls) && p.photoUrls.length ? String(p.photoUrls[0] || '').trim() : '';
                const mid = String(it?.matchId || it?.id || '').trim();
                const acting = inboxAction.loadingId && inboxAction.loadingId === mid;

                return (
                  <div key={it.id} className="rounded-lg border border-amber-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      {photo ? (
                        <img src={photo} alt={name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{name}{age ? `, ${age}` : ''}</p>
                        <p className="text-xs text-slate-600">{t('studio.inbox.likeReceived')}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {mid ? (
                        <Link
                          to={`/app/match/${mid}`}
                          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                        >
                          {t('studio.inbox.viewProfile')}
                        </Link>
                      ) : null}

                      <button
                        type="button"
                        disabled={acting || !mid}
                        onClick={() => respondInboxLike({ matchId: mid, decision: 'accept' })}
                        className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {acting ? t('studio.common.processing') : t('studio.inbox.accept')}
                      </button>

                      <button
                        type="button"
                        disabled={acting || !mid}
                        onClick={() => respondInboxLike({ matchId: mid, decision: 'reject' })}
                        className="inline-flex items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 shadow-sm transition hover:bg-rose-100 disabled:opacity-60"
                      >
                        {t('studio.inbox.reject')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-700">{t('studio.matches.title')}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {visibleMatches.length
                ? t('studio.matches.showingCount', { count: visibleMatches.length })
                : t('studio.matches.emptyHint')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setInboxModal({ open: true, mode: 'requests' })}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              İstekler
              {pendingAccessRequests.length ? (
                <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                  {pendingAccessRequests.length}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setInboxModal({ open: true, mode: 'messages' })}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              Mesajlar
              {unreadMessageCount ? (
                <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                  {unreadMessageCount}
                </span>
              ) : null}
            </button>

            <Link
              to="/profilim"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              {t('studio.matches.backToProfile')}
            </Link>
            <Link
              to="/app/pool"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              {t('studio.pool.title')}
            </Link>
          </div>
        </div>

        <StudioInboxModal
          open={!!inboxModal?.open}
          onClose={() => setInboxModal({ open: false, mode: 'requests' })}
          title={inboxModal?.mode === 'messages' ? 'Mesajlar' : 'İstekler'}
          items={
            inboxModal?.mode === 'messages'
              ? inboxMessages
              : [...(Array.isArray(inboxAccess) ? inboxAccess : []), ...(Array.isArray(inboxProfileAccess) ? inboxProfileAccess : [])].filter(
                  (x) => !(myLock?.active && String(x?.type || '').trim() === 'pre_match')
                )
          }
          mode={inboxModal?.mode}
          onMarkRead={inboxModal?.mode === 'messages' ? markDirectMessageRead : markInboxMessageRead}
          onApprove={inboxModal?.mode === 'messages' ? null : ({ fromUid, type }) => respondAccessRequest({ fromUid, decision: 'approve', type })}
          onReject={inboxModal?.mode === 'messages' ? null : ({ fromUid, type }) => respondAccessRequest({ fromUid, decision: 'reject', type })}
          loadingId={accessAction.loadingId}
          error={accessAction.error}
        />

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
              <Link
                to="/app/pool"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                {t('studio.pool.title')}
              </Link>
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
                canSeeFullProfiles={myMembership.active}
                canInteract={myMembership.active}
                onRequirePaid={requirePaid}
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
