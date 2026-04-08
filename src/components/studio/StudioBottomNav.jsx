import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BellRing, BookOpen, Compass, Edit, Images, LogOut, Menu, MessageCircle, Share2, ShieldCheck, Star, Users, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider';
import { auth } from '../../config/firebaseAuth';
import useStudioInboxHub from '../../hooks/useStudioInboxHub';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export default function StudioBottomNav({ className = '' } = {}) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsWrapRef = useRef(null);

  const uid = safeStr(user?.uid);
  const isAuthed = !!uid && !user?.isAnonymous;

  const { pendingLikesCount, pendingRequestsCount, unreadInboxMessagesCount, unreadMatchMessagesCount } = useStudioInboxHub(isAuthed ? uid : '');
  const unreadMessagesCount = unreadInboxMessagesCount + unreadMatchMessagesCount;
  const unreadNotificationsCount = pendingLikesCount + pendingRequestsCount;
  const navDiscoverLabel = (() => {
    const base = String(i18n?.language || 'tr').trim().toLowerCase();
    if (base.startsWith('tr')) return 'Eş adayı';
    if (base.startsWith('id') || base.startsWith('in')) return 'Jelajah';
    return 'Explore';
  })();
  const navActionsLabel = (() => {
    const base = String(i18n?.language || 'tr').trim().toLowerCase();
    if (base.startsWith('tr')) return 'İşlemler';
    if (base.startsWith('id') || base.startsWith('in')) return 'Menu';
    return 'Actions';
  })();
  const navLabelStyle = useMemo(() => ({ fontFamily: 'Orbitron, sans-serif' }), []);

  const pathname = String(location.pathname || '');
  const isActive = useCallback((prefix) => (prefix ? pathname.startsWith(prefix) : false), [pathname]);

  useEffect(() => {
    setActionsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!actionsOpen) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setActionsOpen(false);
    };

    const onPointerDown = (event) => {
      const wrap = actionsWrapRef.current;
      if (!wrap) return;
      if (wrap.contains(event.target)) return;
      setActionsOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [actionsOpen]);

  const logoutNow = useCallback(async () => {
    setActionsOpen(false);
    if (!isAuthed) {
      navigate('/login');
      return;
    }
    try {
      await signOut(auth);
    } catch {
      // best-effort
    }
    navigate('/login');
  }, [isAuthed, navigate]);

  const openProfilePanel = useCallback(
    (panel) => {
      const key = safeStr(panel);
      setActionsOpen(false);
      if (!key) return;
      navigate(`/profilim?panel=${encodeURIComponent(key)}`);
    },
    [navigate]
  );

  const openEditProfile = useCallback(() => {
    setActionsOpen(false);
    navigate('/evlilik/eslestirme-basvuru?w=1&full=1', { state: { returnTo: '/profilim', profileMode: 'full' } });
  }, [navigate]);

  const goTo = useCallback(
    (target) => {
      setActionsOpen(false);
      navigate(target);
    },
    [navigate]
  );

  const actionItems = useMemo(
    () => [
      { key: 'discover', label: navDiscoverLabel, icon: Compass, onClick: () => goTo('/app/pool') },
      { key: 'editProfile', label: t('studio.profile.editProfile'), icon: Edit, onClick: openEditProfile },
      { key: 'matches', label: t('studio.profile.myMatches'), icon: Users, onClick: () => goTo('/app/matches') },
      { key: 'partnerPrefs', label: t('studio.profile.partnerPrefsTitle'), icon: Edit, onClick: () => openProfilePanel('partnerPrefs') },
      { key: 'membership', label: t('studio.profile.subscriptionTitle'), icon: Star, onClick: () => openProfilePanel('membership') },
      { key: 'photoPrivacy', label: t('studio.profile.photoPrivacy.title'), icon: Images, onClick: () => openProfilePanel('photoPrivacy') },
      { key: 'guidance', label: t('studio.profile.guidance.button'), icon: BookOpen, onClick: () => openProfilePanel('guidance') },
      { key: 'feedback', label: t('studio.feedback.nav'), icon: MessageCircle, onClick: () => goTo('/profilim/destek') },
      { key: 'identity', label: t('studio.profile.identityTitle'), icon: ShieldCheck, onClick: () => openProfilePanel('identity') },
      { key: 'referral', label: t('studio.referral.title'), icon: Share2, onClick: () => openProfilePanel('referral') },
      { key: 'logout', label: t('studio.profile.logout') || 'Çıkış', icon: LogOut, onClick: logoutNow },
    ],
    [goTo, logoutNow, navDiscoverLabel, openEditProfile, openProfilePanel, t]
  );

  const items = [
    {
      key: 'discover',
      to: '/app/pool',
      label: navDiscoverLabel,
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
      key: 'chat',
      to: '/app/messages',
      label: t('studio.inbox.modalTitleMessages'),
      icon: MessageCircle,
      active: isActive('/app/messages') || isActive('/app/chat'),
      badge: unreadMessagesCount,
    },
    {
      key: 'inbox',
      to: '/app/notifications',
      label: t('studio.inbox.titleShort', { defaultValue: '' }) || t('studio.inbox.modalTitleRequests'),
      icon: BellRing,
      active: isActive('/app/notifications'),
      badge: unreadNotificationsCount,
    },
    {
      key: 'actions',
      to: '#actions',
      label: navActionsLabel,
      icon: Menu,
      active: isActive('/profilim') || actionsOpen,
      badge: 0,
      onClick: (e) => {
        e.preventDefault();
        setActionsOpen((prev) => !prev);
      },
    },
  ];

  return (
    <div ref={actionsWrapRef} className="sm:hidden">
      {actionsOpen ? <button type="button" aria-label={t('studio.common.close')} className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px]" onClick={() => setActionsOpen(false)} /> : null}

      {actionsOpen ? (
        <div className="fixed inset-x-3 bottom-[84px] z-50 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,15,30,0.98),rgba(18,26,48,0.98))] p-4 shadow-[0_28px_90px_rgba(2,6,23,0.56)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">{t('studio.common.actionMenu')}</div>
              <div className="text-lg text-white" style={navLabelStyle}>{t('studio.common.actionMenu')}</div>
            </div>
            <button
              type="button"
              onClick={() => setActionsOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 grid max-h-[58vh] grid-cols-2 gap-2 overflow-y-auto pr-1">
            {actionItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  className="flex min-h-[72px] flex-col items-start justify-center rounded-[22px] border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-white transition hover:border-amber-300/50 hover:bg-amber-300/12"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-2 text-sm leading-4 text-white" style={navLabelStyle}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div
        className={
          'fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98))] backdrop-blur-xl ' +
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
              const isChat = it.key === 'chat';
              const badge = typeof it.badge === 'number' && Number.isFinite(it.badge) ? it.badge : 0;
              const hasAlert = isChat && badge > 0;
              return (
                <Link
                  key={it.key}
                  to={it.to}
                  onClick={it.onClick}
                  className={
                    'relative flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold transition ' +
                    (active
                      ? 'bg-rose-700 text-white shadow-[0_10px_26px_rgba(190,24,93,0.34)]'
                      : hasAlert
                        ? 'bg-rose-600 text-white shadow-[0_8px_18px_rgba(190,24,93,0.18)] hover:bg-rose-500'
                        : 'bg-rose-800/90 text-white hover:bg-rose-700 hover:text-white')
                  }
                >
                  <span className="relative">
                    <Icon
                      className={
                        'h-5 w-5 ' +
                        (active ? 'text-white' : hasAlert ? 'text-white' : 'text-white')
                      }
                    />
                    {badge > 0 ? (
                      <span className={hasAlert ? 'absolute -right-2 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-900 ring-2 ring-rose-900/70' : 'absolute -right-2 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-rose-900 ring-2 ring-rose-900/70'}>
                        {badge > 99 ? '99+' : String(badge)}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 line-clamp-2 min-h-[24px] text-center text-[12px] leading-3 text-inherit" style={navLabelStyle}>{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
