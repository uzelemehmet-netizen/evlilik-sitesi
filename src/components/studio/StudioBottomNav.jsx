import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, HelpCircle, MessageCircle, User, Users } from 'lucide-react';
import { collection, doc, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider';
import { db } from '../../config/firebase';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export default function StudioBottomNav({ className = '' } = {}) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const uid = safeStr(user?.uid);
  const isAuthed = !!uid && !user?.isAnonymous;

  const [myLock, setMyLock] = useState({ active: false, matchId: '' });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadInboxMessagesCount, setUnreadInboxMessagesCount] = useState(0);
  const [activeChatUnreadCount, setActiveChatUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthed) {
      setMyLock({ active: false, matchId: '' });
      return;
    }

    const ref = doc(db, 'matchmakingUsers', uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.exists() ? snap.data() || {} : {};
        const lock = d?.matchmakingLock && typeof d.matchmakingLock === 'object' ? d.matchmakingLock : null;
        const active = !!lock?.active;
        const matchId = safeStr(lock?.matchId);
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
  }, [isAuthed, uid]);

  useEffect(() => {
    if (!isAuthed) {
      setPendingRequestsCount(0);
      return;
    }

    const ref1 = query(collection(db, 'matchmakingUsers', uid, 'inboxPreMatchRequests'), orderBy('createdAtMs', 'desc'), limit(40));
    const ref2 = query(collection(db, 'matchmakingUsers', uid, 'inboxAccessRequests'), orderBy('createdAtMs', 'desc'), limit(40));

    const computePending = (arr1, arr2) => {
      const merged = [...(Array.isArray(arr1) ? arr1 : []), ...(Array.isArray(arr2) ? arr2 : [])];
      return merged.filter((x) => String(x?.status || '').trim() === 'pending').length;
    };

    let a = [];
    let b = [];

    const unsub1 = onSnapshot(
      ref1,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        a = items;
        setPendingRequestsCount(computePending(a, b));
      },
      () => {
        a = [];
        setPendingRequestsCount(computePending(a, b));
      }
    );

    const unsub2 = onSnapshot(
      ref2,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        b = items;
        setPendingRequestsCount(computePending(a, b));
      },
      () => {
        b = [];
        setPendingRequestsCount(computePending(a, b));
      }
    );

    return () => {
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
    };
  }, [isAuthed, uid]);

  useEffect(() => {
    if (!isAuthed) {
      setUnreadInboxMessagesCount(0);
      return;
    }

    const qInbox = query(collection(db, 'matchmakingUsers', uid, 'inboxMessages'), orderBy('createdAtMs', 'desc'), limit(60));
    const unsub = onSnapshot(
      qInbox,
      (snap) => {
        let count = 0;
        snap.forEach((d) => {
          const x = d.data() || {};
          const msg = String(x?.text || '').trim();
          if (!msg) return;
          const readMs = typeof x?.readAtMs === 'number' && Number.isFinite(x.readAtMs) ? x.readAtMs : 0;
          if (readMs <= 0) count += 1;
        });
        setUnreadInboxMessagesCount(count);
      },
      () => setUnreadInboxMessagesCount(0)
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [isAuthed, uid]);

  useEffect(() => {
    const mid = myLock?.active ? safeStr(myLock.matchId) : '';
    if (!isAuthed || !mid) {
      setActiveChatUnreadCount(0);
      return;
    }

    const ref = doc(db, 'matchmakingMatches', mid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.exists() ? snap.data() || {} : {};
        const m = d?.chatUnreadByUid && typeof d.chatUnreadByUid === 'object' ? d.chatUnreadByUid : {};
        const n = typeof m?.[uid] === 'number' && Number.isFinite(m[uid]) ? m[uid] : 0;
        setActiveChatUnreadCount(Math.max(0, n));
      },
      () => setActiveChatUnreadCount(0)
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [isAuthed, myLock?.active, myLock?.matchId, uid]);

  const pathname = String(location.pathname || '');
  const isActive = (prefix) => (prefix ? pathname.startsWith(prefix) : false);

  const activeMatchId = myLock?.active ? safeStr(myLock.matchId) : '';
  const activeChatTo = activeMatchId ? `/app/chat/${activeMatchId}` : '/app/matches';

  const notificationBadge = pendingRequestsCount + unreadInboxMessagesCount;

  const items = useMemo(
    () => [
      {
        key: 'discover',
        to: '/app/pool',
        label: t('studio.pool.title'),
        icon: Compass,
        active: isActive('/app/pool'),
        badge: 0,
      },
      {
        key: 'matches',
        to: '/app/matches',
        label: t('studio.matches.title'),
        icon: Users,
        active: isActive('/app/matches') || isActive('/app/match'),
        badge: 0,
      },
      {
        key: 'active',
        to: activeChatTo,
        label: t('studio.chat.chatTitle'),
        icon: MessageCircle,
        active: isActive('/app/chat'),
        badge: activeChatUnreadCount,
      },
      {
        key: 'inbox',
        to: '/app/matches',
        label: t('studio.inbox.titleShort') || t('studio.inbox.modalTitleRequests'),
        icon: HelpCircle,
        active: false,
        badge: notificationBadge,
        onClick: (e) => {
          e.preventDefault();
          const next = unreadInboxMessagesCount > 0 ? 'messages' : 'requests';
          navigate('/app/matches', { state: { openInbox: next } });
        },
      },
      {
        key: 'profile',
        to: '/profilim',
        label: t('studio.common.profile'),
        icon: User,
        active: isActive('/profilim'),
        badge: 0,
      },
    ],
    [
      activeChatTo,
      activeChatUnreadCount,
      navigate,
      notificationBadge,
      pathname,
      t,
      unreadInboxMessagesCount,
    ]
  );

  return (
    <div
      className={
        'fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden ' +
        (className ? className : '')
      }
      role="navigation"
      aria-label={t('studio.common.navigation') || 'Studio navigation'}
    >
      <div className="mx-auto max-w-4xl px-2 py-2">
        <div className="grid grid-cols-5 gap-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = !!it.active;
            const isDiscover = it.key === 'discover';
            const badge = typeof it.badge === 'number' && Number.isFinite(it.badge) ? it.badge : 0;
            return (
              <Link
                key={it.key}
                to={it.to}
                onClick={it.onClick}
                className={
                  'relative flex flex-col items-center justify-center rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ' +
                  (active
                    ? isDiscover
                      ? 'bg-orange-50 text-orange-800'
                      : 'bg-emerald-50 text-emerald-800'
                    : isDiscover
                      ? 'text-slate-700 hover:bg-orange-50/60'
                      : 'text-slate-700 hover:bg-slate-50')
                }
              >
                <span className="relative">
                  <Icon
                    className={
                      'h-5 w-5 ' +
                      (active
                        ? isDiscover
                          ? 'text-orange-700'
                          : 'text-emerald-700'
                        : isDiscover
                          ? 'text-orange-700/80'
                          : 'text-slate-600')
                    }
                  />
                  {badge > 0 ? (
                    <span className="absolute -right-2 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white ring-2 ring-white">
                      {badge > 99 ? '99+' : String(badge)}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 line-clamp-1">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
