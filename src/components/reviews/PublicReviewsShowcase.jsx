import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeLang(v) {
  const lang = safeStr(v).toLowerCase().split('-')[0];
  if (lang === 'tr' || lang === 'en' || lang === 'id') return lang;
  return 'tr';
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({ length: 5 }, (_, idx) => (idx < safeRating ? '★' : '☆')).join('');
}

function getReviewerInitial(item) {
  return (safeStr(item?.reviewerName).charAt(0) || safeStr(item?.reviewerUserCode).charAt(0) || 'U').toUpperCase();
}

function ReviewCard({ item, t, onTranslate, translateState }) {
  const location = safeStr(item.reviewerCity) || safeStr(item.reviewerCountry) || t('publicReviews.locationFallback');
  const hasMessage = !!safeStr(item.message);
  const displayMessage = translateState?.showTranslated && safeStr(translateState?.text)
    ? safeStr(translateState.text)
    : safeStr(item.message);
  const displayReply = translateState?.showTranslated && safeStr(translateState?.adminReply)
    ? safeStr(translateState.adminReply)
    : safeStr(item.adminReply);

  return (
    <article className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbfd)] p-5 shadow-[0_18px_44px_rgba(15,23,42,0.07)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-slate-200 text-sm font-bold text-slate-600">
            {safeStr(item.reviewerPhotoUrl) ? (
              <img
                src={item.reviewerPhotoUrl}
                alt={t('publicReviews.profilePhotoAlt', { name: safeStr(item.reviewerName) || t('publicReviews.nameFallback') })}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              getReviewerInitial(item)
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {safeStr(item.reviewerUserCode) ? (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
                  {item.reviewerUserCode}
                </span>
              ) : null}
              <div className="truncate text-base font-semibold text-slate-900">
                {safeStr(item.reviewerName) || t('publicReviews.nameFallback')}
              </div>
              {item.featured ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                  {t('publicReviews.featured')}
                </span>
              ) : null}
            </div>

            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{location}</div>
          </div>
        </div>

        <div className="text-lg tracking-[0.18em] text-amber-500">{renderStars(item.rating)}</div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-700">{displayMessage || t('publicReviews.starOnlyFallback')}</p>

      {hasMessage ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onTranslate(item)}
            disabled={!!translateState?.loading}
            className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {translateState?.loading
              ? t('publicReviews.translating')
              : translateState?.showTranslated
                ? t('publicReviews.showOriginal')
                : t('publicReviews.translate')}
          </button>
          {safeStr(translateState?.error) ? (
            <span className="text-xs font-medium text-rose-600">{t('publicReviews.translationError')}</span>
          ) : null}
        </div>
      ) : null}

      {displayReply ? (
        <div className="mt-4 rounded-[20px] border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
            {t('publicReviews.adminReplyLabel')}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{displayReply}</p>
        </div>
      ) : null}
    </article>
  );
}

export default function PublicReviewsShowcase() {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState({
    loading: true,
    items: [],
    stats: { ratedCount: 0, averageRating: 0, commentedCount: 0, starOnlyCount: 0 },
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [translateStateById, setTranslateStateById] = useState({});

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch('/api/public-reviews-list?limit=200', { method: 'GET' });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        setState({
          loading: false,
          items: Array.isArray(data?.items) ? data.items : [],
          stats: {
            ratedCount: Number(data?.stats?.ratedCount) || 0,
            averageRating: Number(data?.stats?.averageRating) || 0,
            commentedCount: Number(data?.stats?.commentedCount) || 0,
            starOnlyCount: Number(data?.stats?.starOnlyCount) || 0,
          },
        });
      } catch {
        if (!active) return;
        setState({
          loading: false,
          items: [],
          stats: { ratedCount: 0, averageRating: 0, commentedCount: 0, starOnlyCount: 0 },
        });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const translateReview = async (item) => {
    const itemId = safeStr(item?.id);
    const sourceText = safeStr(item?.message);
    if (!itemId || !sourceText) return;

    const currentState = translateStateById?.[itemId];
    if (currentState?.text) {
      setTranslateStateById((prev) => ({
        ...prev,
        [itemId]: {
          ...prev?.[itemId],
          loading: false,
          error: '',
          showTranslated: !prev?.[itemId]?.showTranslated,
        },
      }));
      return;
    }

    const targetLang = safeLang(i18n.resolvedLanguage || i18n.language);

    setTranslateStateById((prev) => ({
      ...prev,
      [itemId]: {
        loading: true,
        error: '',
        text: '',
        adminReply: '',
        showTranslated: false,
      },
    }));

    try {
      const translateOne = async (key, text) => {
        const res = await fetch('/api/public-review-translate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ key, text, targetLang }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) {
          throw new Error(safeStr(data?.error) || 'translate_failed');
        }
        return safeStr(data?.text);
      };

      const [translatedMessage, translatedReply] = await Promise.all([
        translateOne(`review:${itemId}:message`, sourceText),
        safeStr(item?.adminReply)
          ? translateOne(`review:${itemId}:reply`, safeStr(item.adminReply))
          : Promise.resolve(''),
      ]);

      setTranslateStateById((prev) => ({
        ...prev,
        [itemId]: {
          loading: false,
          error: '',
          text: translatedMessage,
          adminReply: translatedReply,
          showTranslated: true,
        },
      }));
    } catch (error) {
      setTranslateStateById((prev) => ({
        ...prev,
        [itemId]: {
          loading: false,
          error: safeStr(error?.message) || 'translate_failed',
          text: '',
          adminReply: '',
          showTranslated: false,
        },
      }));
    }
  };

  if (!state.loading && state.items.length === 0) {
    return null;
  }

  const visibleItems = state.loading
    ? Array.from({ length: 3 })
    : state.items.slice(0, 3);

  const canExpand = !state.loading && state.items.length > 3;

  return (
    <section className="mt-8 rounded-[30px] border border-white/70 bg-white/78 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur md:p-6">
      <div className="max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">{t('publicReviews.eyebrow')}</div>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950 md:text-3xl">{t('publicReviews.title')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{t('publicReviews.body')}</p>
        {!state.loading && state.stats.ratedCount > 0 ? (
          <div className="mt-4 inline-flex flex-wrap items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
            <span>{renderStars(Math.round(state.stats.averageRating || 0))}</span>
            <span>{t('publicReviews.averageSummary', { average: state.stats.averageRating.toFixed(2), count: state.stats.ratedCount })}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {visibleItems.map((item, idx) => {
          if (!item) {
            return <div key={`placeholder-${idx}`} className="h-40 animate-pulse rounded-[24px] bg-slate-100" />;
          }

          return (
            <ReviewCard
              key={item.id}
              item={item}
              t={t}
              onTranslate={translateReview}
              translateState={translateStateById?.[item.id]}
            />
          );
        })}
      </div>

      {canExpand ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t('publicReviews.showMore')}
          </button>
        </div>
      ) : null}

      {drawerOpen ? (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/45"
          role="dialog"
          aria-modal="true"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-6xl rounded-t-[28px] border border-white/60 bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">{t('publicReviews.eyebrow')}</div>
                <div className="mt-1 text-lg font-semibold text-slate-950">{t('publicReviews.title')}</div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {t('publicReviews.showLess')}
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto px-5 py-5" onClick={(e) => e.stopPropagation()}>
              <div className="grid gap-4 lg:grid-cols-2">
                {state.items.map((item) => (
                  <ReviewCard
                    key={`drawer-${item.id}`}
                    item={item}
                    t={t}
                    onTranslate={translateReview}
                    translateState={translateStateById?.[item.id]}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}