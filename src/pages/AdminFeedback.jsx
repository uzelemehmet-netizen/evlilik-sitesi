import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { authFetch } from '../utils/authFetch';

function normalizeViewMode(value) {
  if (value === 'reviews') return 'reviews';
  if (value === 'photo_upload_failures') return 'photo_upload_failures';
  return 'alerts';
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function fmtTs(v) {
  try {
    if (!v) return '';
    if (typeof v === 'number') return new Date(v).toLocaleString();
    if (typeof v?.toMillis === 'function') return new Date(v.toMillis()).toLocaleString();
    if (typeof v?.seconds === 'number') return new Date(v.seconds * 1000).toLocaleString();
  } catch {
    // ignore
  }
  return '';
}

function safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function safeObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

function formatBytes(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '';
  if (num >= 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  if (num >= 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${Math.trunc(num)} B`;
}

const STATUS_OPTIONS = ['new', 'in_progress', 'done', 'rejected'];

function reviewOf(item) {
  return item && typeof item.review === 'object' && item.review ? item.review : {};
}

function reviewDisplayName(review) {
  return safeStr(review?.reviewerDisplayName) || safeStr(review?.reviewerName) || 'Anonim';
}

function isReviewItem(item) {
  return safeStr(item?.kind).toLowerCase() === 'review';
}

function hasReviewComment(item) {
  return safeStr(item?.message).length > 0;
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({ length: 5 }, (_, idx) => (idx < safeRating ? '★' : '☆')).join('');
}

function reviewSourceLabel(value) {
  const key = safeStr(value).toLowerCase();
  if (key.includes('pool_banner')) return 'Es Adayi sayfasi';
  if (key.includes('profile_button')) return 'Degerlendir butonu';
  if (key.includes('auto_prompt')) return 'Tutorial / otomatik';
  if (key.includes('manual_open')) return 'Degerlendir butonu';
  return key || '-';
}

function statusLabel(value) {
  const key = safeStr(value);
  const labels = {
    new: 'Yeni',
    in_progress: 'İşlemde',
    done: 'Tamamlandı',
    rejected: 'Reddedildi',
  };
  return labels[key] || key || '-';
}

function kindLabel(value) {
  const key = safeStr(value);
  const labels = {
    bug: 'Hata',
    suggestion: 'Öneri',
    complaint: 'Şikayet',
    other: 'Diğer',
    review: 'Yorum',
    photo_upload_failure: 'Patlayan foto upload',
  };
  return labels[key] || key || 'Diğer';
}

function isPhotoUploadFailureItem(item) {
  return safeStr(item?.kind).toLowerCase() === 'photo_upload_failure';
}

function photoUploadContextOf(item) {
  return safeObj(item?.context);
}

function photoUploadAttemptsSummary(item) {
  const attempts = safeArr(photoUploadContextOf(item)?.attempts);
  if (!attempts.length) return '';
  return attempts
    .map((attempt) => {
      const stage = safeStr(attempt?.stage) || 'unknown';
      const status = safeStr(attempt?.status) || 'unknown';
      const code = safeStr(attempt?.code);
      return code ? `${stage}:${status} (${code})` : `${stage}:${status}`;
    })
    .join(' | ');
}

function pickFirstNonEmpty(...values) {
  for (const value of values) {
    const normalized = safeStr(value);
    if (normalized) return normalized;
  }
  return '';
}

function buildUserModalFallback(item) {
  const entry = safeObj(item);
  if (!entry) return null;

  const contact = pickFirstNonEmpty(entry?.contact, entry?.context?.contact);
  return {
    fullName: null,
    userCode: null,
    age: null,
    gender: null,
    whatsapp: contact || null,
    applicationId: null,
    details: contact ? { whatsapp: contact } : null,
  };
}

function pickUserContact(user, application, fallbackItem = null) {
  return pickFirstNonEmpty(
    application?.whatsapp,
    application?.phone,
    user?.whatsapp,
    user?.phone,
    user?.application?.whatsapp,
    user?.details?.whatsapp,
    user?.details?.phone,
    fallbackItem?.contact,
    fallbackItem?.context?.contact
  );
}

function labelGender(value) {
  const key = safeStr(value).toLowerCase();
  if (key === 'male') return 'Erkek';
  if (key === 'female') return 'Kadın';
  return safeStr(value) || '-';
}

function labelApplicationState(value) {
  const key = safeStr(value).toLowerCase();
  const labels = {
    real: 'Gerçek başvuru',
    partial: 'Kısmi başvuru',
    stub: 'Stub',
    cache: 'Cache',
    stub_cache: 'Stub cache',
    profile: 'Sadece profil cache',
    none: 'Yok',
  };
  return labels[key] || safeStr(value) || '-';
}

function submitActionLabel(status) {
  const key = safeStr(status).toLowerCase();
  if (key === 'already_submitted') return 'Kullanıcı zaten submit durumundaydı; profil cache senkronize edildi.';
  if (key === 'normalized') return 'Stub başvuru gerçek başvuruya çevrildi.';
  return 'Kullanıcı admin manuel onayı ile submit edildi.';
}

export default function AdminFeedback({ defaultViewMode = 'alerts' }) {
  const allowAlertsView = defaultViewMode !== 'reviews';
  const [viewMode, setViewMode] = useState(() => normalizeViewMode(defaultViewMode));
  const [filters, setFilters] = useState({ kind: '', status: 'new', q: '' });
  const [todayOnly, setTodayOnly] = useState(false);
  const [state, setState] = useState({ loading: true, error: '', items: [], reviewStats: null });
  const [updatingId, setUpdatingId] = useState('');
  const [noteDraftById, setNoteDraftById] = useState({});
  const [replyDraftById, setReplyDraftById] = useState({});
  const [translateStateById, setTranslateStateById] = useState({});
  const [userActionState, setUserActionState] = useState({ uid: '', loading: false, error: '', msg: '' });
  const [userModal, setUserModal] = useState({
    open: false,
    uid: '',
    loading: false,
    error: '',
    user: null,
    application: null,
    applicationState: '',
    fallbackItem: null,
    submitLoading: false,
    submitError: '',
    submitMsg: '',
  });
  const reviewsOnlyView = !allowAlertsView;
  const reviewsTab = viewMode === 'reviews';
  const photoFailuresTab = viewMode === 'photo_upload_failures';

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      kind: viewMode === 'reviews' ? 'review' : viewMode === 'photo_upload_failures' ? 'photo_upload_failure' : '',
      status: viewMode === 'reviews' ? '' : 'new',
    }));
  }, [viewMode]);

  const queryPayload = useMemo(
    () => ({
      kind: safeStr(viewMode === 'reviews' ? 'review' : viewMode === 'photo_upload_failures' ? 'photo_upload_failure' : filters.kind),
      status: safeStr(filters.status),
      q: safeStr(filters.q),
      includeLowSignal: viewMode === 'reviews' || viewMode === 'photo_upload_failures',
      ...(todayOnly
        ? (() => {
          try {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            return { sinceMs: d.getTime() };
          } catch {
            return {};
          }
        })()
        : {}),
      limit: 80,
    }),
    [filters.kind, filters.q, filters.status, todayOnly, viewMode]
  );

  const load = async () => {
    setState((p) => ({ ...p, loading: true, error: '' }));
    try {
      const data = await authFetch('/api/admin-feedback-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(queryPayload),
      });
      const items = Array.isArray(data?.items) ? data.items : [];
      const nextReplyDraftById = {};
      for (const item of items) {
        const id = safeStr(item?.id);
        const review = reviewOf(item);
        if (!id) continue;
        nextReplyDraftById[id] = safeStr(review?.adminReply);
      }
      setReplyDraftById(nextReplyDraftById);
      setState({ loading: false, error: '', items, reviewStats: data?.reviewStats || null });
    } catch (e) {
      setState({ loading: false, error: String(e?.message || 'veriler_yuklenemedi'), items: [], reviewStats: null });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPayload.kind, queryPayload.status, queryPayload.sinceMs]);

  const updateFeedback = async (id, patch, options = {}) => {
    setUpdatingId(id);
    try {
      const note = options.includeNote ? safeStr(noteDraftById?.[id]) : '';
      await authFetch('/api/admin-feedback-update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, ...patch, ...(note ? { note } : {}) }),
      });
      if (options.includeNote) {
        setNoteDraftById((p) => ({ ...p, [id]: '' }));
      }
      await load();
    } catch (e) {
      alert(String(e?.message || 'guncelleme_basarisiz'));
    } finally {
      setUpdatingId('');
    }
  };

  const updateStatus = async (id, status) => updateFeedback(id, { status }, { includeNote: true });

  const saveAdminReply = async (id) => {
    await updateFeedback(id, { adminReply: safeStr(replyDraftById?.[id]) });
  };

  const translateReview = async (id, text) => {
    const sourceText = safeStr(text);
    if (!id || !sourceText) return;
    setTranslateStateById((prev) => ({
      ...prev,
      [id]: { loading: true, error: '', text: safeStr(prev?.[id]?.text) },
    }));
    try {
      const data = await authFetch('/api/admin-translate-text', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: `review:${id}`, targetLang: 'tr', text: sourceText }),
      });
      setTranslateStateById((prev) => ({
        ...prev,
        [id]: { loading: false, error: '', text: safeStr(data?.text) },
      }));
    } catch (e) {
      setTranslateStateById((prev) => ({
        ...prev,
        [id]: { loading: false, error: String(e?.message || 'translate_failed'), text: safeStr(prev?.[id]?.text) },
      }));
    }
  };

  const openUserModal = async (uid, fallbackItem = null) => {
    const targetUid = safeStr(uid);
    if (!targetUid) return;

    const fallbackUser = buildUserModalFallback(fallbackItem);
    setUserModal({
      open: true,
      uid: targetUid,
      loading: true,
      error: '',
      user: fallbackUser,
      application: null,
      applicationState: '',
      fallbackItem,
      submitLoading: false,
      submitError: '',
      submitMsg: '',
    });

    try {
      const data = await authFetch('/api/admin-user-application-get', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid: targetUid }),
      });

      setUserModal((prev) => ({
        ...prev,
        open: true,
        uid: targetUid,
        loading: false,
        error: '',
        user: data?.user || fallbackUser,
        application: data?.application || null,
        applicationState: safeStr(data?.applicationState),
        fallbackItem,
      }));
    } catch (e) {
      setUserModal((prev) => ({
        ...prev,
        open: true,
        uid: targetUid,
        loading: false,
        error: String(e?.message || 'kullanici_bilgileri_yuklenemedi'),
        user: fallbackUser,
        application: null,
        applicationState: '',
        fallbackItem,
      }));
    }
  };

  const closeUserModal = () => {
    setUserModal({
      open: false,
      uid: '',
      loading: false,
      error: '',
      user: null,
      application: null,
      applicationState: '',
      fallbackItem: null,
      submitLoading: false,
      submitError: '',
      submitMsg: '',
    });
  };

  const submitUserApplication = async (uid, fallbackItem = null, { fromModal = false } = {}) => {
    const targetUid = safeStr(uid);
    if (!targetUid) return;

    if (fromModal) {
      setUserModal((prev) => ({ ...prev, submitLoading: true, submitError: '', submitMsg: '' }));
    } else {
      setUserActionState({ uid: targetUid, loading: true, error: '', msg: '' });
    }

    try {
      const data = await authFetch('/api/admin-user-action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid: targetUid, action: 'submitApplication' }),
      });
      const msg = submitActionLabel(data?.status);

      await load();
      if (fromModal) {
        setUserModal((prev) => ({ ...prev, submitLoading: false, submitError: '', submitMsg: msg }));
        await openUserModal(targetUid, fallbackItem || userModal.fallbackItem);
        setUserModal((prev) => ({ ...prev, submitMsg: msg }));
      } else {
        setUserActionState({ uid: targetUid, loading: false, error: '', msg });
      }
    } catch (e) {
      const errorText = String(e?.message || 'basvuru_submit_edilemedi');
      if (fromModal) {
        setUserModal((prev) => ({ ...prev, submitLoading: false, submitError: errorText, submitMsg: '' }));
      } else {
        setUserActionState({ uid: targetUid, loading: false, error: errorText, msg: '' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Admin paneli
            </Link>
            <div>
              <h1 className="text-xl font-bold">{reviewsOnlyView ? 'Kullanici degerlendirmeleri' : photoFailuresTab ? 'Patlayan foto upload kayitlari' : 'Geri bildirim ve yorum moderasyonu'}</h1>
              <p className="text-xs text-slate-500">
                {viewMode === 'reviews'
                  ? 'Yildiz puani, yorum, ortalama puan ve kayit ekraninda gosterim iznini burada yonetebilirsin.'
                  : photoFailuresTab
                    ? 'Ortak uploader son denemede de basarisiz olursa kayit burada birikir. Kaynak, sayfa ve deneme adimlarini gorebilirsin.'
                  : 'Düşük sinyal tarayıcı gürültüleri varsayılan olarak gizlenir.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Yenile
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {allowAlertsView ? (
            <button
              type="button"
              onClick={() => setViewMode('alerts')}
              className={
                'rounded-full px-4 py-2 text-sm font-semibold transition ' +
                (viewMode === 'alerts' ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100')
              }
            >
              Risk bildirimleri
            </button>
          ) : null}
          {allowAlertsView ? (
            <button
              type="button"
              onClick={() => setViewMode('reviews')}
              className={
                'rounded-full px-4 py-2 text-sm font-semibold transition ' +
                (viewMode === 'reviews' ? 'bg-emerald-700 text-white' : 'border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50')
              }
            >
              Public yorumlar
            </button>
          ) : null}
          {allowAlertsView ? (
            <button
              type="button"
              onClick={() => setViewMode('photo_upload_failures')}
              className={
                'rounded-full px-4 py-2 text-sm font-semibold transition ' +
                (photoFailuresTab ? 'bg-rose-700 text-white' : 'border border-rose-200 bg-white text-rose-800 hover:bg-rose-50')
              }
            >
              Patlayan foto upload
            </button>
          ) : null}
        </div>

        {reviewsTab && state.reviewStats ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Toplam prompt yaniti</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{state.reviewStats.totalResponses}</div>
              <div className="mt-1 text-sm text-slate-500">Review prompttan gelen tum yanitlar</div>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-violet-800">Ortak ortalama</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">
                {state.reviewStats.ratedCount > 0 ? state.reviewStats.averageRating.toFixed(2) : '-'}
              </div>
              <div className="mt-1 text-sm text-violet-800">
                {state.reviewStats.ratedCount > 0
                  ? `${renderStars(Math.round(state.reviewStats.averageRating || 0))} · ${state.reviewStats.ratedCount} puanli review`
                  : 'Henuz puanli review yok'}
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">Yorumlu review</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{state.reviewStats.commentedCount}</div>
              <div className="mt-1 text-sm text-amber-800">Yildiz + yazi ile gonderilen review</div>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Sadece yildiz</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{state.reviewStats.starOnlyCount}</div>
              <div className="mt-1 text-sm text-sky-700">Yorum yazmadan gonderilen review</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Yayinda olan yorum</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{state.reviewStats.publicCount}</div>
              <div className="mt-1 text-sm text-emerald-700">Kayit ekraninda gorunen yorumlar</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gec diyen kullanici</div>
              <div className="mt-2 text-3xl font-bold text-slate-950">{state.reviewStats.skippedCount}</div>
              <div className="mt-1 text-sm text-slate-500">Yorumu gondermeden promptu gecenler</div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {!reviewsOnlyView && !photoFailuresTab ? (
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700">Kategori</span>
            <select
              value={filters.kind}
              onChange={(e) => setFilters((p) => ({ ...p, kind: e.target.value }))}
              disabled={!allowAlertsView || reviewsTab}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">(hepsi)</option>
              <option value="bug">Hata</option>
              <option value="suggestion">Öneri</option>
              <option value="complaint">Şikayet</option>
              <option value="other">Diğer</option>
              <option value="review">Yorum</option>
            </select>
          </label>
          ) : null}

          {!reviewsOnlyView ? (
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700">Durum</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">(hepsi)</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                      {statusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          ) : null}

          {!reviewsOnlyView ? (
          <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
            <input type="checkbox" checked={todayOnly} onChange={(e) => setTodayOnly(e.target.checked)} />
            Bugün
          </label>
          ) : null}

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700">{reviewsOnlyView ? 'Ara (yorum / email / kaynak)' : photoFailuresTab ? 'Ara (id / user / email / kaynak / sayfa)' : 'Ara (id/matchId/user)'}</span>
            <input
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder={reviewsOnlyView ? 'orn: yorum, email, tutorial, buton' : photoFailuresTab ? 'örn: matchmaking_apply, /studio, email, quick_profile' : 'örn: matchId, userId, email'}
            />
            <button
              type="button"
              onClick={load}
              className="mt-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ara
            </button>
          </label>
        </div>

        {state.error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {state.error}
          </div>
        ) : null}

        <div className="mt-4">
          {state.loading ? (
            <div className="text-sm text-slate-600">Yükleniyor…</div>
          ) : state.items.length === 0 ? (
            <div className="text-sm text-slate-600">Kayıt yok.</div>
          ) : (
            <div className="space-y-3">
              {state.items.map((x) => {
                const createdAt = fmtTs(x?.createdAt) || fmtTs(x?.createdAtMs);
                const updatedAt = fmtTs(x?.updatedAt) || fmtTs(x?.updatedAtMs);
                const attachments = Array.isArray(x?.attachments) ? x.attachments : [];
                const review = reviewOf(x);
                const isReview = isReviewItem(x);
                const isPhotoFailure = isPhotoUploadFailureItem(x);
                const isSkippedReview = !!review?.skipped;
                const isStarOnlyReview = isReview && !isSkippedReview && !hasReviewComment(x);
                const photoContext = photoUploadContextOf(x);
                const photoAttemptsSummary = photoUploadAttemptsSummary(x);
                const translateState = translateStateById?.[x.id] || { loading: false, error: '', text: '' };
                const allowTranslation = isReview && !isSkippedReview;
                const canManageUser = !!safeStr(x?.userId);
                const userActionActive = userActionState.uid === safeStr(x?.userId);

                return (
                  <div key={x.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {isSkippedReview ? 'Degerlendirme gecildi' : `${kindLabel(x?.kind)} • ${statusLabel(x?.status)}`}
                        </div>
                        {isReview ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            {!isSkippedReview ? <span className="font-semibold text-amber-600">{renderStars(review?.rating)}</span> : null}
                            <span>{reviewDisplayName(review)}</span>
                            {safeStr(review?.reviewerUserCode) ? <span>• {safeStr(review?.reviewerUserCode)}</span> : null}
                            {safeStr(review?.reviewerCity) ? <span>• {safeStr(review?.reviewerCity)}</span> : null}
                            <span>• {reviewSourceLabel(review?.openSource || review?.source)}</span>
                            {!isSkippedReview ? (
                              <span className={'rounded-full px-2 py-0.5 font-semibold ' + (isStarOnlyReview ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700')}>
                                {isStarOnlyReview ? 'Sadece yildiz' : 'Yorumlu review'}
                              </span>
                            ) : null}
                            {!isSkippedReview && review?.publicVisible ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">Yayında</span>
                            ) : !isSkippedReview ? (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">Gizli</span>
                            ) : <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">Gecildi</span>}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold">Gönderim:</span> {createdAt || '-'}
                        {updatedAt && updatedAt !== createdAt ? (
                          <span className="ml-2">
                            <span className="font-semibold">Güncelleme:</span> {updatedAt}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-600">
                      <div>Kimlik: {x.id}</div>
                      {x?.matchId ? <div>matchId: {x.matchId}</div> : null}
                      {x?.step ? <div>Adım: {x.step}</div> : null}
                      {x?.userEmail ? <div>Kullanıcı: {x.userEmail}</div> : x?.userId ? <div>Kullanıcı kimliği: {x.userId}</div> : null}
                      {isReview && safeStr(review?.reviewerUserCode) ? <div>Kullanıcı kodu: {safeStr(review?.reviewerUserCode)}</div> : null}
                      {safeStr(x?.contact) || safeStr(x?.context?.contact) ? (
                        <div>İletişim: {safeStr(x?.contact) || safeStr(x?.context?.contact)}</div>
                      ) : null}
                      {isReview ? <div>Kaynak: {reviewSourceLabel(review?.openSource || review?.source)}</div> : null}
                      {isPhotoFailure ? <div>Upload kaynağı: {safeStr(x?.source) || safeStr(photoContext?.uploadSource) || '-'}</div> : null}
                      {isPhotoFailure && safeStr(x?.pagePath) ? <div>Sayfa: {safeStr(x?.pagePath)}</div> : null}
                      {isPhotoFailure && safeStr(photoContext?.folder) ? <div>Klasör: {safeStr(photoContext?.folder)}</div> : null}
                      {isPhotoFailure && safeStr(photoContext?.fileName) ? <div>Dosya: {safeStr(photoContext?.fileName)}</div> : null}
                      {isPhotoFailure && formatBytes(photoContext?.fileSize) ? <div>Boyut: {formatBytes(photoContext?.fileSize)}</div> : null}
                      {isPhotoFailure && safeStr(photoContext?.contentType) ? <div>İçerik tipi: {safeStr(photoContext?.contentType)}</div> : null}
                      {isPhotoFailure && photoAttemptsSummary ? <div>Denemeler: {photoAttemptsSummary}</div> : null}
                    </div>

                    {!isSkippedReview ? (
                      <div className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                        {safeStr(x?.message) || (isPhotoFailure ? 'Uploader son denemede de basarisiz oldu.' : 'Yorum yok. Kullanici yalnizca yildiz puani gondermis.')}
                      </div>
                    ) : null}

                    {allowTranslation ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => translateReview(x.id, x?.message)}
                          disabled={isStarOnlyReview || translateState.loading || updatingId === x.id}
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          {translateState.loading ? 'Cevriliyor…' : 'Cevir'}
                        </button>
                      </div>
                    ) : null}

                    {allowTranslation && translateState.error ? (
                      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                        Ceviri hatasi: {translateState.error}
                      </div>
                    ) : null}

                    {allowTranslation && translateState.text ? (
                      <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-slate-800">
                        <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Ceviri</div>
                        <div className="mt-1 whitespace-pre-wrap">{translateState.text}</div>
                      </div>
                    ) : null}

                    {canManageUser ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openUserModal(x.userId, x)}
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Kullanıcı bilgileri
                        </button>
                        <button
                          type="button"
                          onClick={() => submitUserApplication(x.userId, x)}
                          disabled={userActionActive && userActionState.loading}
                          className="rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                        >
                          {userActionActive && userActionState.loading ? 'Submit ediliyor…' : 'Kullanıcıyı submit et'}
                        </button>
                      </div>
                    ) : null}

                    {userActionActive && userActionState.error ? (
                      <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                        {userActionState.error}
                      </div>
                    ) : null}

                    {userActionActive && userActionState.msg ? (
                      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                        {userActionState.msg}
                      </div>
                    ) : null}

                    {isReview ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!isSkippedReview ? (
                          review?.publicVisible ? (
                            <button
                              type="button"
                              onClick={() => updateFeedback(x.id, { publicVisible: false })}
                              disabled={updatingId === x.id}
                              className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                            >
                              Yayindan kaldir
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateFeedback(x.id, { publicVisible: true })}
                              disabled={updatingId === x.id}
                              className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              Yayinla
                            </button>
                          )
                        ) : null}
                      </div>
                    ) : null}

                    {attachments.length ? (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                        {attachments.map((a, idx) => (
                          <a key={idx} href={a?.secureUrl} target="_blank" rel="noreferrer" className="block">
                            <img
                              src={a?.secureUrl}
                              alt={a?.originalFilename || 'ek'}
                              className="h-28 w-full rounded-lg object-cover border border-slate-200"
                              loading="lazy"
                              decoding="async"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    {reviewsOnlyView && isReview && !isSkippedReview ? (
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <label>
                          <div className="text-xs font-semibold text-slate-700">Yayinlamadan once admin yaniti / notu</div>
                          <textarea
                            value={safeStr(replyDraftById?.[x.id])}
                            onChange={(e) => setReplyDraftById((p) => ({ ...p, [x.id]: e.target.value }))}
                            rows={3}
                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                            placeholder="Bu yorum icin kisa bir not veya cevap yaz..."
                          />
                        </label>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => saveAdminReply(x.id)}
                            disabled={updatingId === x.id}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                          >
                            Yaniti kaydet
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {reviewsOnlyView && isReview && !isSkippedReview && safeStr(review?.adminReply) ? (
                      <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-slate-800">
                        <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">Admin yaniti / notu</div>
                        <div className="mt-1 whitespace-pre-wrap">{safeStr(review?.adminReply)}</div>
                      </div>
                    ) : null}

                    {!reviewsOnlyView ? (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <label className="md:col-span-2">
                          <div className="text-xs font-semibold text-slate-700">Admin notu (opsiyonel)</div>
                          <input
                            value={safeStr(noteDraftById?.[x.id])}
                            onChange={(e) => setNoteDraftById((p) => ({ ...p, [x.id]: e.target.value }))}
                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                            placeholder="Kısa not..."
                          />
                        </label>

                        <label>
                          <div className="text-xs font-semibold text-slate-700">Durum güncelle</div>
                          <select
                            value={safeStr(x?.status) || 'new'}
                            onChange={(e) => updateStatus(x.id, e.target.value)}
                            disabled={updatingId === x.id}
                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-60"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {statusLabel(s)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {userModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-slate-900">Kullanıcı bilgileri</div>
                <div className="text-xs text-slate-500">UID: {userModal.uid || '-'}</div>
              </div>
              <button
                type="button"
                onClick={closeUserModal}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kapat
              </button>
            </div>

            {userModal.loading ? <div className="mt-4 text-sm text-slate-600">Yükleniyor…</div> : null}
            {userModal.error ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {userModal.error}
              </div>
            ) : null}

            {!userModal.loading ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Temel bilgiler</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-800">
                    <div><span className="text-slate-500">Ad Soyad:</span> {safeStr(userModal.user?.fullName) || '-'}</div>
                    <div><span className="text-slate-500">Kullanıcı kodu:</span> {safeStr(userModal.user?.userCode) || '-'}</div>
                    <div><span className="text-slate-500">Yaş:</span> {Number.isFinite(Number(userModal.user?.age)) ? String(Math.trunc(Number(userModal.user?.age))) : '-'}</div>
                    <div><span className="text-slate-500">Cinsiyet:</span> {labelGender(userModal.user?.gender)}</div>
                    <div><span className="text-slate-500">Email:</span> {safeStr(userModal.fallbackItem?.userEmail) || '-'}</div>
                    <div><span className="text-slate-500">İletişim numarası:</span> <span className="font-mono break-all">{pickUserContact(userModal.user, userModal.application, userModal.fallbackItem) || '-'}</span></div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Başvuru durumu</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-800">
                    <div><span className="text-slate-500">Application state:</span> {labelApplicationState(userModal.applicationState)}</div>
                    <div><span className="text-slate-500">Application ID:</span> {safeStr(userModal.application?.id || userModal.user?.applicationId) || '-'}</div>
                    <div><span className="text-slate-500">Kaynak:</span> {safeStr(userModal.application?.source) || '-'}</div>
                    <div><span className="text-slate-500">Durum:</span> {safeStr(userModal.application?.status) || '-'}</div>
                    <div><span className="text-slate-500">Şehir:</span> {pickFirstNonEmpty(userModal.application?.city, userModal.user?.city) || '-'}</div>
                    <div><span className="text-slate-500">Ülke:</span> {pickFirstNonEmpty(userModal.application?.country, userModal.application?.nationality, userModal.user?.nationality) || '-'}</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openUserModal(userModal.uid, userModal.fallbackItem)}
                disabled={userModal.loading}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Yenile
              </button>
              <button
                type="button"
                onClick={() => submitUserApplication(userModal.uid, userModal.fallbackItem, { fromModal: true })}
                disabled={userModal.submitLoading || !userModal.uid}
                className="rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                {userModal.submitLoading ? 'Submit ediliyor…' : 'Kullanıcıyı submit et'}
              </button>
            </div>

            {userModal.submitError ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {userModal.submitError}
              </div>
            ) : null}

            {userModal.submitMsg ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                {userModal.submitMsg}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
