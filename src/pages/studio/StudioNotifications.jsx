import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellRing, Heart } from 'lucide-react';
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

export default function StudioNotifications() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const uid = safeStr(user?.uid);

  const { inboxLikes, pendingRequests, pendingLikesCount, pendingRequestsCount } = useStudioInboxHub(uid);

  const [likeAction, setLikeAction] = useState({ loadingId: '', error: '' });
  const [requestAction, setRequestAction] = useState({ loadingId: '', error: '', notice: '' });

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
        key: 'likes',
        icon: Heart,
        label: t('studio.notificationsHub.summaryLikes'),
        value: pendingLikesCount,
        tone: 'amber',
      },
      {
        key: 'requests',
        icon: BellRing,
        label: t('studio.notificationsHub.summaryRequests'),
        value: pendingRequestsCount,
        tone: 'sky',
      },
    ],
    [pendingLikesCount, pendingRequestsCount, t]
  );

  const respondInboxLike = useCallback(
    async ({ matchId, decision }) => {
      const mid = safeStr(matchId);
      const nextDecision = safeStr(decision);
      if (!mid || !nextDecision || likeAction.loadingId) return;

      setLikeAction({ loadingId: mid, error: '' });
      try {
        await authFetch('/api/matchmaking-decision', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ matchId: mid, decision: nextDecision }),
        });

        setLikeAction({ loadingId: '', error: '' });
        if (nextDecision === 'accept') navigate(`/app/match/${mid}`);
      } catch (error) {
        const msg = safeStr(error?.message) || 'action_failed';
        setLikeAction({ loadingId: '', error: translateStudioApiError(t, msg) || msg });
      }
    },
    [likeAction.loadingId, navigate, t]
  );

  const respondAccessRequest = useCallback(
    async ({ fromUid, decision, type }) => {
      const from = safeStr(fromUid);
      const nextDecision = safeStr(decision);
      const reqType = safeStr(type);
      if (!from || !nextDecision || requestAction.loadingId) return;

      const endpoint =
        reqType === 'profile_access'
          ? '/api/matchmaking-profile-access-respond'
          : reqType === 'photo_access'
            ? '/api/matchmaking-photo-access-respond'
            : '/api/matchmaking-pre-match-respond';
      const loadingId = `${reqType || 'request'}:${from}`;

      setRequestAction({ loadingId, error: '', notice: '' });
      try {
        await authFetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ fromUid: from, decision: nextDecision }),
        });

        setRequestAction({
          loadingId: '',
          error: '',
          notice: nextDecision === 'approve' ? t('studio.notificationsHub.requestApproved') : t('studio.notificationsHub.requestRejected'),
        });
      } catch (error) {
        const msg = safeStr(error?.message) || 'action_failed';
        setRequestAction({ loadingId: '', error: translateStudioApiError(t, msg) || msg, notice: '' });
      }
    },
    [requestAction.loadingId, t]
  );

  const hasAnyActivity = inboxLikes.length || pendingRequests.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-0">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <section className="overflow-hidden rounded-[28px] border border-sky-200 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(224,242,254,0.98)_46%,_rgba(248,250,252,0.98)_100%)] p-5 shadow-[0_20px_60px_rgba(14,165,233,0.08)] md:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-700/75">{t('studio.inbox.titleShort', { defaultValue: '' }) || t('studio.inbox.modalTitleRequests')}</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">{t('studio.notificationsHub.title')}</h1>
                <p className="mt-2 text-sm text-slate-700 md:text-base">{t('studio.notificationsHub.subtitle')}</p>
              </div>

              <div className="inline-flex items-center rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm">
                <BellRing className="mr-2 h-4 w-4" />
                {t('studio.notificationsHub.totalActivity', { count: pendingLikesCount + pendingRequestsCount })}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                const toneClass =
                  card.tone === 'amber'
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-sky-200 bg-sky-50 text-sky-900';

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

          {likeAction.error ? <p className="mt-4 text-sm font-semibold text-rose-700">{likeAction.error}</p> : null}
          {requestAction.error ? <p className="mt-2 text-sm font-semibold text-rose-700">{requestAction.error}</p> : null}
          {requestAction.notice ? <p className="mt-2 text-sm font-semibold text-emerald-700">{requestAction.notice}</p> : null}

          {!hasAnyActivity ? (
            <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">{t('studio.notificationsHub.emptyTitle')}</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">{t('studio.notificationsHub.emptyBody')}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/app/messages" className="app-btn app-btn-primary">
                  {t('studio.inbox.modalTitleMessages')}
                </Link>
                <Link to="/app/pool" className="app-btn app-btn-orange">
                  {t('studio.pool.title')}
                </Link>
              </div>
            </section>
          ) : null}

          {inboxLikes.length ? (
            <section className="mt-6 rounded-[28px] border border-amber-200 bg-white p-4 shadow-sm md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{t('studio.notificationsHub.sectionLikes')}</h2>
                  <p className="mt-1 text-sm text-slate-600">{t('studio.notificationsHub.sectionLikesHint')}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
                  {formatCount(inboxLikes.length)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {inboxLikes.slice(0, 8).map((item) => {
                  const profile = item?.fromProfile && typeof item.fromProfile === 'object' ? item.fromProfile : {};
                  const matchId = safeStr(item?.matchId || item?.id);
                  const photoUrl = safeStr(Array.isArray(profile?.photoUrls) ? profile.photoUrls[0] : '');
                  const name = safeStr(profile?.username) || t('studio.common.match');
                  const createdAtLabel = formatWhen(item?.createdAtMs);
                  const isLoading = likeAction.loadingId === matchId;

                  return (
                    <div key={safeStr(item?.id) || matchId} className="rounded-[24px] border border-amber-200 bg-amber-50/55 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-base font-bold text-amber-700">
                          {photoUrl ? <img src={photoUrl} alt={name} className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-slate-900">{name}</p>
                          <p className="text-sm text-slate-600">{t('studio.inbox.likeReceived')}</p>
                          {createdAtLabel ? <p className="text-xs text-slate-500">{createdAtLabel}</p> : null}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {matchId ? (
                          <Link to={`/app/match/${matchId}`} className="app-btn app-btn-outline">
                            {t('studio.inbox.viewProfile')}
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          disabled={isLoading || !matchId}
                          onClick={() => respondInboxLike({ matchId, decision: 'accept' })}
                          className="app-btn app-btn-primary disabled:opacity-60"
                        >
                          {isLoading ? t('studio.common.processing') : t('studio.inbox.accept')}
                        </button>
                        <button
                          type="button"
                          disabled={isLoading || !matchId}
                          onClick={() => respondInboxLike({ matchId, decision: 'reject' })}
                          className="app-btn app-btn-danger disabled:opacity-60"
                        >
                          {t('studio.inbox.reject')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {pendingRequests.length ? (
            <section className="mt-6 rounded-[28px] border border-sky-200 bg-white p-4 shadow-sm md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{t('studio.notificationsHub.sectionRequests')}</h2>
                  <p className="mt-1 text-sm text-slate-600">{t('studio.notificationsHub.sectionRequestsHint')}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-extrabold text-sky-800">
                  {formatCount(pendingRequests.length)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pendingRequests.map((item) => {
                  const profile = item?.fromProfile && typeof item.fromProfile === 'object' ? item.fromProfile : {};
                  const fromUid = safeStr(item?.fromUid);
                  const requestId = safeStr(item?.requestId) || safeStr(item?.id) || `${safeStr(item?.type)}:${fromUid}`;
                  const name = safeStr(profile?.username) || t('studio.common.profile');
                  const photoUrl = safeStr(profile?.photoUrl || (Array.isArray(profile?.photoUrls) ? profile.photoUrls[0] : ''));
                  const createdAtLabel = formatWhen(item?.createdAtMs);
                  const type = safeStr(item?.type);
                  const note = safeStr(item?.messageText);
                  const loadingId = `${type || 'request'}:${fromUid}`;
                  const isLoading = requestAction.loadingId === loadingId;
                  const requestText =
                    type === 'pre_match'
                      ? t('studio.inboxModal.requestText.preMatch')
                      : type === 'photo_access'
                        ? t('studio.inboxModal.requestText.photoAccess')
                        : t('studio.inboxModal.requestText.profileAccess');

                  return (
                    <div key={requestId} className="rounded-[24px] border border-sky-200 bg-sky-50/60 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-base font-bold text-sky-700">
                          {photoUrl ? <img src={photoUrl} alt={name} className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-slate-900">{name}</p>
                          <p className="text-sm text-slate-600">{requestText}</p>
                          {createdAtLabel ? <p className="text-xs text-slate-500">{createdAtLabel}</p> : null}
                        </div>
                      </div>

                      {note ? (
                        <div className="mt-3 rounded-2xl border border-sky-100 bg-white/80 p-3 text-sm text-slate-700">
                          {note}
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isLoading || !fromUid}
                          onClick={() => respondAccessRequest({ fromUid, decision: 'approve', type })}
                          className="app-btn app-btn-primary disabled:opacity-60"
                        >
                          {isLoading ? t('studio.common.processing') : type === 'pre_match' ? t('studio.inboxModal.approve') : t('studio.inboxModal.allow')}
                        </button>
                        <button
                          type="button"
                          disabled={isLoading || !fromUid}
                          onClick={() => respondAccessRequest({ fromUid, decision: 'reject', type })}
                          className="app-btn app-btn-danger disabled:opacity-60"
                        >
                          {t('studio.inbox.reject')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <Footer />
      <StudioBottomNav />
    </div>
  );
}