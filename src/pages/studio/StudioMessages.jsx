import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import StudioBottomNav from '../../components/studio/StudioBottomNav';
import useStudioInboxHub from '../../hooks/useStudioInboxHub';
import { authFetch } from '../../utils/authFetch';
import { translateStudioApiError } from '../../utils/studioErrorI18n';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function formatCount(n) {
  if (!(typeof n === 'number' && Number.isFinite(n) && n > 0)) return '0';
  return n > 99 ? '99+' : String(n);
}

export default function StudioMessages() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const uid = safeStr(user?.uid);

  const {
    messageThreads,
    unreadInboxMessagesCount,
    unreadMatchMessagesCount,
  } = useStudioInboxHub(uid);

  const [threadAction, setThreadAction] = useState({ loadingKey: '', error: '' });

  const formatWhen = useCallback(
    (ms) => {
      if (!(typeof ms === 'number' && Number.isFinite(ms) && ms > 0)) return '';
      try {
        return new Intl.DateTimeFormat(i18n?.language || 'tr', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }).format(ms);
      } catch {
        return '';
      }
    },
    [i18n?.language]
  );

  const summaryCards = useMemo(
    () => [
      {
        key: 'messages',
        icon: MessageCircle,
        label: t('studio.messagesHub.summaryMessages'),
        value: unreadInboxMessagesCount + unreadMatchMessagesCount,
        tone: 'rose',
      },
    ],
    [t, unreadInboxMessagesCount, unreadMatchMessagesCount]
  );

  const markDirectMessagesRead = useCallback(async (ids) => {
    const messageIds = Array.isArray(ids) ? ids.map((id) => safeStr(id)).filter(Boolean) : [];
    if (!messageIds.length) return;
    await Promise.all(
      messageIds.map(async (messageId) => {
        try {
          await authFetch('/api/matchmaking-inbox-message-mark-read', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ messageId }),
          });
        } catch {
          // best-effort
        }
      })
    );
  }, []);

  const openThread = useCallback(
    async (thread) => {
      const key = safeStr(thread?.key);
      if (!key || threadAction.loadingKey) return;

      setThreadAction({ loadingKey: key, error: '' });
      try {
        await markDirectMessagesRead(thread?.unreadMessageIds);

        const matchId = safeStr(thread?.matchId);
        if (matchId) {
          try {
            await authFetch('/api/matchmaking-chat-mark-read', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ matchId }),
            });
          } catch {
            // best-effort
          }
          setThreadAction({ loadingKey: '', error: '' });
          navigate(`/app/chat/${matchId}`);
          return;
        }

        const targetUid = safeStr(thread?.targetUid);
        if (!targetUid) throw new Error('bad_request');

        const ensured = await authFetch('/api/matchmaking-people-match-ensure', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ targetUid }),
        });

        const ensuredMatchId = safeStr(ensured?.matchId);
        if (!ensuredMatchId) throw new Error('match_ensure_failed');

        setThreadAction({ loadingKey: '', error: '' });
        navigate(`/app/chat/${ensuredMatchId}`);
      } catch (error) {
        const msg = safeStr(error?.message) || 'action_failed';
        setThreadAction({ loadingKey: '', error: translateStudioApiError(t, msg) || msg });
      }
    },
    [markDirectMessagesRead, navigate, t, threadAction.loadingKey]
  );

  const totalUnreadMessages = unreadInboxMessagesCount + unreadMatchMessagesCount;
  const hasAnyActivity = messageThreads.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-0">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <section className="overflow-hidden rounded-[28px] border border-rose-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(255,228,230,0.98)_46%,_rgba(254,242,242,0.98)_100%)] p-5 shadow-[0_20px_60px_rgba(244,63,94,0.08)] md:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-rose-700/75">{t('studio.inbox.modalTitleMessages')}</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">{t('studio.messagesHub.title')}</h1>
                <p className="mt-2 text-sm text-slate-700 md:text-base">{t('studio.messagesHub.subtitle')}</p>
              </div>

              <div className="inline-flex items-center rounded-full border border-rose-200 bg-white/85 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm">
                <MessageCircle className="mr-2 h-4 w-4" />
                {t('studio.messagesHub.totalActivity', { count: totalUnreadMessages })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-1">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                const toneClass =
                  'border-rose-200 bg-white text-rose-900';

                return (
                  <div key={card.key} className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{card.label}</p>
                        <p className="mt-2 text-3xl font-bold">{formatCount(card.value)}</p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {threadAction.error ? <p className="mt-4 text-sm font-semibold text-rose-700">{threadAction.error}</p> : null}

          {!hasAnyActivity ? (
            <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">{t('studio.messagesHub.emptyTitle')}</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{t('studio.messagesHub.emptyBody')}</p>
              <div className="mt-4">
                <Link to="/app/pool" className="app-btn app-btn-orange">
                  {t('studio.pool.title')}
                </Link>
              </div>
            </section>
          ) : null}

          <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{t('studio.messagesHub.sectionMessages')}</h2>
                <p className="mt-1 text-sm text-slate-600">{t('studio.messagesHub.sectionMessagesHint')}</p>
              </div>
              {messageThreads.length ? (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-extrabold text-rose-700">
                  {formatCount(messageThreads.length)}
                </span>
              ) : null}
            </div>

            {messageThreads.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {t('studio.inboxModal.emptyMessages')}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3">
                {messageThreads.map((thread) => {
                  const name = safeStr(thread?.displayName) || t('studio.common.profile');
                  const photoUrl = safeStr(thread?.photoUrl);
                  const unreadCount = typeof thread?.unreadCount === 'number' && Number.isFinite(thread.unreadCount) ? thread.unreadCount : 0;
                  const updatedAtLabel = formatWhen(thread?.updatedAtMs);
                  const isLoading = threadAction.loadingKey === thread.key;
                  const threadTestId = safeStr(thread?.matchId || thread?.targetUid || thread?.key);

                  return (
                    <button
                      key={thread.key}
                      type="button"
                      data-testid={threadTestId ? `messages-thread-${threadTestId}` : undefined}
                      onClick={() => openThread(thread)}
                      disabled={isLoading}
                      className="group flex w-full items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] disabled:opacity-60"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100 via-white to-amber-100 text-lg font-bold text-rose-700">
                        {photoUrl ? <img src={photoUrl} alt={name} className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-slate-900">{name}</p>
                            {updatedAtLabel ? <p className="mt-0.5 text-xs font-medium text-slate-500">{updatedAtLabel}</p> : null}
                          </div>

                          {unreadCount > 0 ? (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm">
                              {t('studio.messagesHub.unread', { count: formatCount(unreadCount) })}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex items-center gap-3">
                          <p data-testid={threadTestId ? `messages-thread-preview-${threadTestId}` : undefined} className="line-clamp-2 flex-1 text-sm text-slate-600">
                            {safeStr(thread?.preview) || t('studio.messagesHub.noPreview')}
                          </p>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition group-hover:bg-rose-100 group-hover:text-rose-700">
                            {isLoading ? t('studio.common.processing') : t('studio.messagesHub.openChat')}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
      <StudioBottomNav />
    </div>
  );
}