import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, MessageCircle, ShieldCheck, UserCheck, Sparkles, Lock, Crown, ArrowRight, LogIn } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { useAuth } from '../auth/AuthProvider';
import GeminiFAQ from '../components/gemini/GeminiFAQ';
import { staticAssetUrl } from '../utils/staticAssetUrl';
import { tiktokTrack } from '../utils/tiktokPixel';
import { trackClick } from '../utils/clickTracker';
import { getSupportCountrySync } from '../utils/supportLine';

let firestoreApiPromise = null;
async function loadFirestoreApi() {
  if (!firestoreApiPromise) {
    firestoreApiPromise = Promise.all([
      import('../config/firebaseDb'),
      import('firebase/firestore'),
    ]).then(([dbMod, fs]) => {
      const db = dbMod?.db || dbMod?.default;
      return { db, ...fs };
    });
  }
  return firestoreApiPromise;
}

function preloadLoginChunk() {
  try {
    // Same folder: src/pages/Login.jsx
    void import('./Login');
  } catch {
    // ignore
  }
}

const FALLBACK_THUMB_DATA_URL =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <rect width="1280" height="720" fill="#000"/>
      <g opacity="0.92">
        <circle cx="640" cy="360" r="84" fill="#fff" opacity="0.18"/>
        <path d="M 615 318 L 615 402 L 695 360 Z" fill="#fff"/>
      </g>
      <text x="50%" y="92%" text-anchor="middle" fill="#fff" font-size="28" font-family="Arial, sans-serif" opacity="0.9">Önizleme yüklenemedi</text>
    </svg>`
  );

export default function MatchmakingHub() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const BRAND_LOGO_SRC = staticAssetUrl('/brand-logo.webp');

  const isIdTraffic = (() => {
    try {
      const c = String(getSupportCountrySync({ lang: '' }) || '').toUpperCase();
      if (c === 'ID') return true;
      const tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
      if (tz.includes('jakarta') || tz.includes('makassar') || tz.includes('jayapura')) return true;
      const nav = String(navigator?.language || '').toLowerCase();
      if (nav.startsWith('id') || nav.startsWith('in')) return true;
      const lang = String(i18n?.language || '').toLowerCase();
      return lang.startsWith('id') || lang.startsWith('in');
    } catch {
      return false;
    }
  })();

  const applyTo = isIdTraffic ? '/login?mode=signup' : '/login?mode=signup&auto=google';

  const youtubeVideos = [
    // YouTube video önizlemeleri (thumbnail + tıklayınca lazy iframe)
    'https://youtu.be/Kgfd9KrKRdc?si=EGRqcQVqGMnZPvpp',
    'https://youtu.be/emeOAdBT8TU?si=vvvVQWRrS7vMGB0w',
    'https://youtu.be/OgIGPCsiEu4?si=MerWKK5Fo2U_JNM3',
  ];

  const parseYouTubeId = (url) => {
    try {
      const raw = String(url || '').trim();
      if (!raw) return '';

      // Accept youtu.be/<id>
      if (raw.includes('youtu.be/')) {
        const u = new URL(raw);
        const id = String(u.pathname || '').replace(/^\//, '').split('/')[0] || '';
        return id.slice(0, 32);
      }

      // Accept youtube.com/watch?v=<id> and embed variants
      const u = new URL(raw);
      const host = String(u.hostname || '').toLowerCase();
      if (host.includes('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return String(v).slice(0, 32);

        const path = String(u.pathname || '');
        const m = path.match(/\/(embed|shorts)\/([^/?#]+)/i);
        if (m && m[2]) return String(m[2]).slice(0, 32);
      }

      return '';
    } catch {
      return '';
    }
  };

  const [activeVideoIndex, setActiveVideoIndex] = useState(null);

  const renderVideoCard = (videoUrl, idx) => {
    const videoId = parseYouTubeId(videoUrl);
    const isActive = activeVideoIndex === idx;
    const thumb = videoId ? staticAssetUrl(`/youtube-thumbs/${videoId}.jpg`) : '';
    const embed = videoId
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
      : '';

    const handleThumbError = (e) => {
      try {
        const img = e?.currentTarget;
        if (!img || !videoId) return;

        const step = Number(img?.dataset?.fallbackStep || '0');
        if (step === 0) {
          img.dataset.fallbackStep = '1';
          img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          return;
        }
        if (step === 1) {
          img.dataset.fallbackStep = '2';
          img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
          return;
        }
        if (step === 2) {
          img.dataset.fallbackStep = '3';
          img.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
          return;
        }

        // Final fallback: inline placeholder (covers adblock / network blocks)
        img.dataset.fallbackStep = '4';
        img.onerror = null;
        img.src = FALLBACK_THUMB_DATA_URL;
      } catch {
        // ignore
      }
    };

    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
        <div className="relative w-full pt-[56.25%]">
          {isActive && embed ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={embed}
              title={`YouTube video ${idx + 1}`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              onClick={() => setActiveVideoIndex(idx)}
              className="absolute inset-0 w-full h-full text-left"
              aria-label="Videoyu oynat"
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={handleThumbError}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                  Video önizlemesi
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full bg-white/95 border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-900 shadow-sm">
                Oynat
              </div>
            </button>
          )}
        </div>
      </div>
    );
  };

  const [checkingApplication, setCheckingApplication] = useState(false);
  const [hasApplication, setHasApplication] = useState(false);

  const [joinToastVisible, setJoinToastVisible] = useState(false);
  const joinToastTimerRef = useRef(null);
  const lastJoinCreatedAtMsRef = useRef(0);
  const joinListenerInitializedRef = useRef(false);

  useEffect(() => {
    if (!user?.uid) {
      setHasApplication(false);
      return;
    }

    let cancelled = false;
    setCheckingApplication(true);

    (async () => {
      try {
        const { db, collection, getDocs, limit, query, where } = await loadFirestoreApi();
        const q = query(collection(db, 'matchmakingApplications'), where('userId', '==', user.uid), limit(1));
        const snap = await getDocs(q);
        if (cancelled) return;
        setHasApplication(!snap.empty);
      } catch (e) {
        if (!cancelled) setHasApplication(false);
      } finally {
        if (!cancelled) setCheckingApplication(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    let cancelled = false;
    let unsub = null;

    const start = async () => {
      try {
        const { db, collection, limit, onSnapshot, orderBy, query, where } = await loadFirestoreApi();
        if (cancelled) return;

        const cutoffMs = Date.now() - 24 * 60 * 60 * 1000;
        const colRef = collection(db, 'publicJoinEvents');
        const q = query(colRef, where('createdAtMs', '>=', cutoffMs), orderBy('createdAtMs', 'desc'), limit(1));

        unsub = onSnapshot(
          q,
          (snap) => {
            if (cancelled) return;
            const d0 = snap.docs?.[0];
            const data = d0?.data?.() || {};
            const createdAtMs = data?.createdAtMs;
            if (typeof createdAtMs !== 'number' || !Number.isFinite(createdAtMs)) return;

            if (!joinListenerInitializedRef.current) {
              joinListenerInitializedRef.current = true;
              lastJoinCreatedAtMsRef.current = createdAtMs;
              return;
            }

            if (createdAtMs <= lastJoinCreatedAtMsRef.current) return;
            lastJoinCreatedAtMsRef.current = createdAtMs;

            setJoinToastVisible(true);
            if (joinToastTimerRef.current) {
              clearTimeout(joinToastTimerRef.current);
            }
            joinToastTimerRef.current = setTimeout(() => {
              setJoinToastVisible(false);
              joinToastTimerRef.current = null;
            }, 2000);
          },
          () => {
            // ignore realtime errors on public feed
          }
        );
      } catch {
        // ignore
      }
    };

    // Public join feed is non-critical; load after first paint.
    let token = null;
    let usedIdle = false;
    try {
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        usedIdle = true;
        token = window.requestIdleCallback(start, { timeout: 2500 });
      } else {
        token = window.setTimeout(start, 1200);
      }
    } catch {
      token = window.setTimeout(start, 1200);
    }

    return () => {
      cancelled = true;
      try {
        if (usedIdle && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(token);
        } else {
          window.clearTimeout(token);
        }
      } catch {
        // ignore
      }
      try {
        if (typeof unsub === 'function') unsub();
      } catch {
        // ignore
      }
      if (joinToastTimerRef.current) {
        clearTimeout(joinToastTimerRef.current);
        joinToastTimerRef.current = null;
      }
    };
  }, []);

  const howSteps = t('matchmakingHub.how.steps', { returnObjects: true });
  const matchingPoints = t('matchmakingHub.matching.points', { returnObjects: true });
  const safetyPoints = t('matchmakingHub.safety.points', { returnObjects: true });
  const faqItems = t('matchmakingHub.faq.items', { returnObjects: true });

  const canShowApply = !user || (!checkingApplication && !hasApplication);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      {joinToastVisible ? (
        <div className="fixed top-3 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2">
          <div
            className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur"
            role="status"
            aria-live="polite"
          >
            {t('matchmakingHub.liveJoinToast')}
          </div>
        </div>
      ) : null}

      <main className="relative">
        {/* Background */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14),rgba(16,185,129,0)_60%)]" />
          <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.10),rgba(245,158,11,0)_60%)]" />
          <div className="absolute bottom-0 -right-24 w-[620px] h-[620px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.10),rgba(59,130,246,0)_60%)]" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>

        {/* Hero */}
        <section className="relative max-w-7xl mx-auto px-4 pt-12 md:pt-16 pb-10 md:pb-12">
          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-emerald-50/40 ring-1 ring-emerald-100/50">
            <div aria-hidden="true" className="absolute inset-0">
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.16),rgba(16,185,129,0)_60%)] blur-2xl" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.10),rgba(245,158,11,0)_60%)] blur-2xl" />
            </div>

            <div className="relative p-6 md:p-10">
              <div className="flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-semibold tracking-wide text-emerald-950">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>{t('navigation.matchmaking')}</span>
                    <span className="text-emerald-900/40">•</span>
                    <span className="text-emerald-900/70">{t('matchmakingHub.badge')}</span>
                  </div>

                  <h1 className="mt-4 text-3xl md:text-4xl font-semibold leading-tight">
                    {t('matchmakingHub.title')}
                  </h1>

                  <p className="mt-4 text-slate-600 leading-relaxed">
                    {t('matchmakingHub.description')}
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {!user && (
                      <Link
                        to="/login?mode=login"
                        state={{
                          from: '/profilim',
                          fromState: {
                            matchmakingNext: '/profilim',
                          },
                        }}
                        className="app-btn app-btn-primary-light h-10 px-5"
                      >
                        <LogIn size={18} />
                        {t('matchmakingHub.actions.loginExisting')}
                        <ArrowRight size={18} />
                      </Link>
                    )}

                    {!user && canShowApply && (
                      <Link
                        to={applyTo}
                        state={{
                          from: '/evlilik/eslestirme-basvuru?w=1',
                          fromState: {
                            showMatchmakingIntro: true,
                            matchmakingNext: '/evlilik/eslestirme-basvuru?w=1',
                          },
                        }}
                        onClick={() => {
                          preloadLoginChunk();
                          try {
                            void trackClick('cta_matchmaking_hub_apply');
                          } catch {
                            // ignore
                          }
                          tiktokTrack('SignupRedirect', {
                            source: 'matchmaking_hub_apply',
                            to: applyTo,
                          });
                        }}
                        onMouseEnter={preloadLoginChunk}
                        onTouchStart={preloadLoginChunk}
                        className="app-btn app-btn-primary-light h-10 px-5"
                      >
                        <Crown size={18} />
                        {t('matchmakingHub.actions.apply')}
                        <ArrowRight size={18} />
                      </Link>
                    )}

                    {user && (
                      <Link
                        to="/profilim"
                        className="app-btn app-btn-primary-light h-10 px-5"
                      >
                        <UserCheck size={18} />
                        {t('matchmakingHub.actions.goPanel')}
                      </Link>
                    )}

                    <a
                      href={buildWhatsAppUrl(t('matchmakingHub.whatsappSupportMessage'), { lang: String(i18n?.language || 'tr') })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="app-btn app-btn-primary h-10 px-5"
                    >
                      <MessageCircle size={18} />
                      {t('matchmakingHub.actions.supportWhatsApp')}
                    </a>
                  </div>

                  <div className="mt-3">
                    <Link
                      to="/aracilik"
                      className="group w-full inline-flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-slate-900 hover:bg-emerald-100 transition"
                      onClick={() => {
                        try {
                          void trackClick('cta_lead_apply_matchmaking_hub');
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wide text-emerald-900/70">{t('navigation.matchmaking')}</div>
                        <div className="mt-0.5 text-sm md:text-base font-semibold truncate">{t('navigation.leadApply')}</div>
                      </div>
                      <div className="shrink-0 text-emerald-900/70 group-hover:text-emerald-900 transition">→</div>
                    </Link>
                  </div>

                  {youtubeVideos?.[0] ? (
                    <div className="mt-5 lg:hidden">
                      {renderVideoCard(youtubeVideos[0], 0)}
                    </div>
                  ) : null}

                  {youtubeVideos?.[1] ? (
                    <div className="mt-4 lg:hidden">
                      {renderVideoCard(youtubeVideos[1], 1)}
                    </div>
                  ) : null}

                  <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Lock size={16} className="text-emerald-700" />
                        {t('matchmakingHub.cards.private.title')}
                      </div>
                      <div className="mt-2 text-xs text-slate-600 leading-relaxed">{t('matchmakingHub.cards.private.desc')}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <ShieldCheck size={16} className="text-emerald-700" />
                        {t('matchmakingHub.cards.review.title')}
                      </div>
                      <div className="mt-2 text-xs text-slate-600 leading-relaxed">{t('matchmakingHub.cards.review.desc')}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle size={16} className="text-emerald-700" />
                        {t('matchmakingHub.cards.panel.title')}
                      </div>
                      <div className="mt-2 text-xs text-slate-600 leading-relaxed">{t('matchmakingHub.cards.panel.desc')}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center lg:items-end gap-5">
                  <div className="w-full max-w-sm rounded-[22px] border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-center">
                      <img
                        src={BRAND_LOGO_SRC}
                        alt={t('matchmakingHub.brandAlt')}
                        className="h-12 md:h-14 w-auto max-w-[220px] md:max-w-[260px] object-contain"
                        loading="eager"
                        decoding="async"
                      />
                    </div>

                    <div className="mt-4 space-y-3 hidden lg:block">
                      {youtubeVideos.slice(0, 3).map((videoUrl, idx) => (
                        <div key={`${parseYouTubeId(videoUrl) || 'video'}_${idx}`}>{renderVideoCard(videoUrl, idx)}</div>
                      ))}
                    </div>

                    <div className="text-xs font-semibold text-slate-700 tracking-wide">{t('matchmakingHub.miniCard.title')}</div>
                    <div className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {t('matchmakingHub.miniCard.desc')}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                        <div className="text-base font-semibold text-emerald-800">{t('matchmakingHub.miniCard.stats.privateTitle')}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{t('matchmakingHub.miniCard.stats.privateSubtitle')}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                        <div className="text-base font-semibold text-emerald-800">{t('matchmakingHub.miniCard.stats.fairTitle')}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{t('matchmakingHub.miniCard.stats.fairSubtitle')}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                        <div className="text-base font-semibold text-emerald-800">{t('matchmakingHub.miniCard.stats.safeTitle')}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{t('matchmakingHub.miniCard.stats.safeSubtitle')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Panel preview (guest tutorial) */}
        {!user ? (
          <section className="relative max-w-7xl mx-auto px-4 pb-10 md:pb-12">
            <div className="rounded-[26px] border border-slate-200 bg-white p-6 md:p-7">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0">
                  {youtubeVideos?.[2] ? (
                    <div className="mb-4 lg:hidden">
                      {renderVideoCard(youtubeVideos[2], 2)}
                    </div>
                  ) : null}

                  <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.preview.title')}</h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.preview.subtitle')}</p>
                </div>
                {!user ? (
                  <div className="shrink-0">
                    <Link
                      to={applyTo}
                      state={{
                        from: '/evlilik/eslestirme-basvuru?w=1',
                        fromState: {
                          showMatchmakingIntro: true,
                          matchmakingNext: '/evlilik/eslestirme-basvuru?w=1',
                        },
                      }}
                      onClick={() => {
                        try {
                          void trackClick('cta_matchmaking_home_hero');
                        } catch {
                          // ignore
                        }
                      }}
                      className="app-btn app-btn-primary-light h-10 px-5"
                    >
                      <Crown size={18} />
                      {t('matchmakingHub.preview.cta')}
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <UserCheck size={18} className="text-emerald-700" />
                    {t('matchmakingHub.preview.cards.matches.title')}
                  </div>
                  <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.preview.cards.matches.body')}</div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-700">{t('matchmakingHub.preview.cards.matches.mockTitle')}</div>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{t('matchmakingHub.preview.cards.matches.mockItem1')}</div>
                          <div className="text-[11px] text-slate-500 truncate">{t('matchmakingHub.preview.cards.matches.mockItem1Sub')}</div>
                        </div>
                        <div className="shrink-0 text-[11px] font-semibold text-emerald-800">{t('matchmakingHub.preview.cards.matches.mockTag1')}</div>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{t('matchmakingHub.preview.cards.matches.mockItem2')}</div>
                          <div className="text-[11px] text-slate-500 truncate">{t('matchmakingHub.preview.cards.matches.mockItem2Sub')}</div>
                        </div>
                        <div className="shrink-0 text-[11px] font-semibold text-slate-700">{t('matchmakingHub.preview.cards.matches.mockTag2')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Sparkles size={18} className="text-emerald-700" />
                    {t('matchmakingHub.preview.cards.pool.title')}
                  </div>
                  <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.preview.cards.pool.body')}</div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-700">{t('matchmakingHub.preview.cards.pool.mockTitle')}</div>
                    <div className="mt-2 space-y-2">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="text-sm font-semibold text-slate-900">{t('matchmakingHub.preview.cards.pool.mockItem1')}</div>
                        <div className="mt-1 text-[11px] text-slate-500">{t('matchmakingHub.preview.cards.pool.mockItem1Sub')}</div>
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-900">
                          <CheckCircle size={14} className="text-emerald-700" />
                          {t('matchmakingHub.preview.cards.pool.mockCta')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <MessageCircle size={18} className="text-emerald-700" />
                    {t('matchmakingHub.preview.cards.chat.title')}
                  </div>
                  <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.preview.cards.chat.body')}</div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-700">{t('matchmakingHub.preview.cards.chat.mockTitle')}</div>
                    <div className="mt-2 space-y-2">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="text-[11px] text-slate-500">{t('matchmakingHub.preview.cards.chat.mockSystem')}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{t('matchmakingHub.preview.cards.chat.mockMsg1')}</div>
                        <div className="mt-1 text-sm text-slate-700">{t('matchmakingHub.preview.cards.chat.mockMsg2')}</div>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                        {t('matchmakingHub.preview.cards.chat.mockHint')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* How it works */}
        <section className="relative max-w-7xl mx-auto px-4 pb-12 md:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <div className="rounded-[26px] border border-slate-200 bg-white p-6 md:p-7">
                <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.how.title')}</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.how.subtitle')}</p>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 to-transparent p-4">
                    <div className="text-xs font-semibold text-emerald-900">{t('matchmakingHub.benefits.b1Title')}</div>
                    <div className="mt-1 text-sm text-slate-700">{t('matchmakingHub.benefits.b1Body')}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 to-transparent p-4">
                    <div className="text-xs font-semibold text-emerald-900">{t('matchmakingHub.benefits.b2Title')}</div>
                    <div className="mt-1 text-sm text-slate-700">{t('matchmakingHub.benefits.b2Body')}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 to-transparent p-4">
                    <div className="text-xs font-semibold text-emerald-900">{t('matchmakingHub.benefits.b3Title')}</div>
                    <div className="mt-1 text-sm text-slate-700">{t('matchmakingHub.benefits.b3Body')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-[26px] border border-slate-200 bg-white p-6 md:p-7">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base md:text-lg font-semibold">{t('matchmakingHub.flow.title')}</h3>
                  <div className="text-xs text-slate-500">{t('matchmakingHub.flow.badge')}</div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(howSteps) &&
                    howSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="group rounded-[22px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-900 flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{step.title}</div>
                            <div className="mt-1 text-sm text-slate-600 leading-relaxed">{step.desc}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How we match */}
        <section className="relative max-w-7xl mx-auto px-4 pb-14 md:pb-16">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.matching.title')}</h2>
                <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">{t('matchmakingHub.matching.subtitle')}</p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                <Lock size={16} className="text-emerald-700" />
                {t('matchmakingHub.matching.badge')}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              {Array.isArray(matchingPoints) &&
                matchingPoints.map((p, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex gap-2 items-start">
                      <CheckCircle size={18} className="mt-0.5 text-emerald-700" />
                      <span className="text-sm text-slate-700 leading-relaxed">{p}</span>
                    </div>
                  </div>
                ))}
            </div>

            <p className="mt-6 text-xs text-slate-500 leading-relaxed">{t('matchmakingHub.matching.note')}</p>
          </div>
        </section>

        {/* Safety */}
        <section className="relative max-w-7xl mx-auto px-4 pb-14 md:pb-16">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.safety.title')}</h2>
                <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">{t('matchmakingHub.safety.subtitle')}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-emerald-700" />
                {t('matchmakingHub.safety.tagline')}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.isArray(safetyPoints) &&
                safetyPoints.map((p, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex gap-2 items-start">
                      <span className="mt-0.5 text-emerald-700">•</span>
                      <span className="text-sm text-slate-700 leading-relaxed">{p}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-xs text-slate-500 max-w-3xl">{t('matchmakingPage.privacyNote')}</p>
              <Link
                to="/evlilik"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                {t('matchmakingHub.actions.backWedding')}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <GeminiFAQ
          title={t('matchmakingHub.faq.title')}
          subtitle={t('matchmakingHub.faq.subtitle')}
          sideNote={t('matchmakingHub.faq.sideNote')}
          items={faqItems}
          variant="light"
        />

        {/* Trust + CTA */}
        <section className="relative max-w-7xl mx-auto px-4 pb-16">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">{t('matchmakingHub.trust.title')}</h2>
                <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">{t('matchmakingHub.trust.subtitle')}</p>
              </div>
              <div className="text-xs text-slate-500">{t('matchmakingHub.trust.badge')}</div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Lock size={16} className="text-emerald-700" />
                  {t('matchmakingHub.trust.cards.privacy.title')}
                </div>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.trust.cards.privacy.desc')}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  {t('matchmakingHub.trust.cards.review.title')}
                </div>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.trust.cards.review.desc')}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MessageCircle size={16} className="text-emerald-700" />
                  {t('matchmakingHub.trust.cards.support.title')}
                </div>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed">{t('matchmakingHub.trust.cards.support.desc')}</div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">{t('matchmakingHub.cta.title')}</div>
                <div className="mt-1 text-sm text-slate-600">{t('matchmakingHub.cta.subtitle')}</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {canShowApply && (
                  <>
                    <Link
                      to={applyTo}
                      state={{
                        from: '/evlilik/eslestirme-basvuru?w=1',
                        fromState: {
                          showMatchmakingIntro: true,
                          matchmakingNext: '/evlilik/eslestirme-basvuru?w=1',
                        },
                      }}
                      onClick={() => {
                        try {
                          void trackClick('cta_matchmaking_home_hero');
                        } catch {
                          // ignore
                        }
                      }}
                      className="app-btn app-btn-primary-light h-10 px-5"
                    >
                      <Crown size={18} />
                      {t('matchmakingHub.actions.apply')}
                      <ArrowRight size={18} />
                    </Link>
                  </>
                )}

                {user && (
                  <Link
                    to="/profilim"
                    className="app-btn app-btn-primary-light h-10 px-5"
                  >
                    <UserCheck size={18} />
                    {t('matchmakingHub.actions.goPanel')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
