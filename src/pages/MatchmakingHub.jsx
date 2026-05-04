import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import YouTubeVisitCard from '../components/YouTubeVisitCard';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import FoundersShowcase from '../components/FoundersShowcase';
import { staticAssetUrl } from '../utils/staticAssetUrl';
import { tiktokTrack } from '../utils/tiktokPixel';
import { trackClick } from '../utils/clickTracker';
import { getSupportCountrySync } from '../utils/supportLine';
import { APP_INSTALL_PATH } from '../utils/appInstallLink';

const INSTAGRAM_PROFILE_URL = 'https://instagram.com/endonezyakasifi';

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

function getBaseLang(raw) {
  const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'in') return 'id';
  if (base === 'tr' || base === 'en' || base === 'id') return base;
  return 'tr';
}

function getMatchmakingTrustUi(lang) {
  const copy = {
    tr: {
      heroPanelEyebrow: 'Uyelik odasi',
      heroPanelTitle: 'Herkese acik bir vitrin degil, kontrollu bir eslestirme odasi',
      heroPanelBody: 'Fotograflar, detaylar ve iletisim ayni anda ortaya cikmaz. Sistem once uygunlugu, sonra guveni ve sonra temasi acar.',
      instagramEyebrow: 'Instagram',
      instagramTitle: 'Guncel paylasimlarimiz icin Instagram hesabimizi takip edin',
      instagramBody: 'Gundelik paylasimlar, hikayeler ve Endonezya hayatiyla ilgili kisa icerikler icin Instagram hesabimiza da goz atabilirsiniz.',
      instagramCta: "Instagram'da Ac",
      heroPanelStats: ['Kapali profil akisi', '48 saat + karsilikli onay', 'Insan destekli geri donus'],
      quickFacts: [
        {
          title: 'Simdilik tamamen ucretsiz',
          body: 'Kayit, panel ve aktif eslesme akisi su an tamamen ucretsizdir; once sistemi gorur, size uygunsa devam edersiniz.',
        },
        {
          title: 'Karsilikli begeniyle aktif eslesme',
          body: 'Iki taraf birbirini begendiginde aktif eslesme adimina gecilir ve surec daha ciddi, daha kontrollu ilerler.',
        },
        {
          title: 'Ceviri destekli sohbet avantaji',
          body: 'Aktif eslesme devam ederken taraflar ozel pencerede ceviri destegiyle kendi dilinde sinirsiz konusabilir.',
        },
      ],
      stepsTitle: 'Kayittan sonra ne olur?',
      steps: [
        {
          title: '1. Kayit ve form',
          body: '1-3 dakikada hesabinizi acar, eslestirme formunu tamamlarsiniz.',
        },
        {
          title: '2. Uygunluk kontrolu',
          body: 'Temel bilgileriniz kontrol edilir; eksik veya uyumsuz bir nokta varsa acikca bildirilir.',
        },
        {
          title: '3. Panel akisiniz acilir',
          body: 'Uygun kullanicilar panelde kontrollu aday, eslesme ve mesaj akisini gorur.',
        },
        {
          title: '4. Iletisim kilitli baslar',
          body: 'Iletisim hemen acilmaz; once aktif eslesme adimi, sonra ceviri destekli ozel sohbet ve surec sonunda 48 saat + karsilikli onay gerekir.',
        },
      ],
      ctaNote: 'Simdilik tamamen ucretsiz • Karsilikli begeni aktif eslesme adimini baslatir • Aktif eslesmede ceviri destekli sinirsiz sohbet',
      whatsappLabel: 'WhatsApptan sistem size uygun mu sorun',
      whatsappMessage:
        'Merhaba, kayit olmadan once Uniqah eslestirme sisteminin benim durumuma uygun olup olmadigini ogrenmek istiyorum.',
    },
    en: {
      heroPanelEyebrow: 'Member room',
      heroPanelTitle: 'Not a public showcase, but a controlled matchmaking room',
      heroPanelBody: 'Photos, details and contact are not exposed at once. The system first checks fit, then trust, then opens contact.',
      instagramEyebrow: 'Instagram',
      instagramTitle: 'Follow our Instagram for more current updates',
      instagramBody: 'You can also check our Instagram for daily updates, stories, and short posts about life in Indonesia.',
      instagramCta: 'Open Instagram',
      heroPanelStats: ['Closed-profile flow', '48h + mutual approval', 'Human-reviewed feedback'],
      quickFacts: [
        {
          title: 'Completely free for now',
          body: 'Registration, the panel, and the active-match flow are fully free right now, so users can see the system first and continue only if it fits.',
        },
        {
          title: 'Mutual like leads into active match',
          body: 'When both sides like each other, the process moves into the active-match step and becomes more focused and serious.',
        },
        {
          title: 'Translation-supported private chat',
          body: 'While the active match continues, both sides can keep talking in a private window with translation support and unlimited messaging.',
        },
      ],
      stepsTitle: 'What happens after you sign up?',
      steps: [
        {
          title: '1. Account and form',
          body: 'You open your account and complete the matchmaking form in about 1-3 minutes.',
        },
        {
          title: '2. Fit review',
          body: 'Your core information is reviewed; if something is missing or not aligned, it is stated clearly.',
        },
        {
          title: '3. Panel flow opens',
          body: 'Eligible users see a controlled candidate, match and chat flow in the panel.',
        },
        {
          title: '4. Contact starts locked',
          body: 'Contact does not open immediately; first comes the active-match step, then private chat with translation support, then 48 hours and mutual approval.',
        },
      ],
      ctaNote: 'Completely free for now • Mutual likes lead into active match • Translation-supported unlimited private chat while active',
      whatsappLabel: 'Ask on WhatsApp if this system fits you',
      whatsappMessage: 'Hello, before I register I want to know whether the Uniqah matchmaking system fits my situation.',
    },
    id: {
      heroPanelEyebrow: 'Ruang anggota',
      heroPanelTitle: 'Bukan etalase publik, tetapi ruang matchmaking yang terkontrol',
      heroPanelBody: 'Foto, detail, dan kontak tidak dibuka sekaligus. Sistem memeriksa kecocokan dulu, lalu kepercayaan, lalu kontak.',
      instagramEyebrow: 'Instagram',
      instagramTitle: 'Ikuti Instagram kami untuk update terbaru',
      instagramBody: 'Anda juga bisa melihat Instagram kami untuk update harian, story, dan konten singkat tentang kehidupan di Indonesia.',
      instagramCta: 'Buka Instagram',
      heroPanelStats: ['Alur profil tertutup', '48 jam + persetujuan dua pihak', 'Umpan balik dengan dukungan manusia'],
      quickFacts: [
        {
          title: 'Saat ini sepenuhnya gratis',
          body: 'Pendaftaran, panel, dan alur pencocokan aktif saat ini gratis sepenuhnya; Anda bisa melihat sistemnya dulu lalu lanjut jika cocok.',
        },
        {
          title: 'Suka timbal balik menuju pencocokan aktif',
          body: 'Saat kedua pihak saling menyukai, proses masuk ke tahap pencocokan aktif dan berjalan lebih fokus serta serius.',
        },
        {
          title: 'Chat privat dengan dukungan terjemahan',
          body: 'Selama pencocokan aktif berlangsung, kedua pihak dapat berbicara di jendela privat dengan dukungan terjemahan dan pesan tanpa batas.',
        },
      ],
      stepsTitle: 'Apa yang terjadi setelah daftar?',
      steps: [
        {
          title: '1. Akun dan formulir',
          body: 'Anda membuka akun dan menyelesaikan formulir matchmaking dalam sekitar 1-3 menit.',
        },
        {
          title: '2. Tinjauan kecocokan',
          body: 'Informasi dasar Anda ditinjau; jika ada yang kurang atau tidak cocok, kami sampaikan dengan jelas.',
        },
        {
          title: '3. Alur panel terbuka',
          body: 'Pengguna yang sesuai akan melihat alur kandidat, match, dan chat yang terkontrol di panel.',
        },
        {
          title: '4. Kontak tetap terkunci dulu',
          body: 'Kontak tidak langsung dibuka; pertama ada tahap pencocokan aktif, lalu chat privat dengan dukungan terjemahan, kemudian 48 jam dan persetujuan dua pihak.',
        },
      ],
      ctaNote: 'Saat ini sepenuhnya gratis • Suka timbal balik menuju pencocokan aktif • Chat privat tanpa batas dengan dukungan terjemahan',
      whatsappLabel: 'Tanya via WhatsApp apakah sistem ini cocok untuk Anda',
      whatsappMessage: 'Halo, sebelum mendaftar saya ingin tahu apakah sistem matchmaking Uniqah cocok untuk situasi saya.',
    },
  };

  return copy[lang] || copy.tr;
}

function getMatchmakingAppCtaUi(lang) {
  const copy = {
    tr: {
      installLabel: 'Uygulamayi Indir',
      openLabel: 'Uygulamayi Ac',
    },
    en: {
      installLabel: 'Install the App',
      openLabel: 'Open the App',
    },
    id: {
      installLabel: 'Pasang Aplikasi',
      openLabel: 'Buka Aplikasi',
    },
  };

  return copy[lang] || copy.tr;
}

function MatchmakingAppSvgButton({ kind, label }) {
  const isInstall = kind === 'install';
  const fontSize = label === 'Install the App' ? 27 : 30;

  return (
    <svg viewBox="0 0 560 130" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full drop-shadow-[0_18px_12px_rgba(0,0,0,0.30)]">
      <style>{`
        .cta-btn { cursor: pointer; transition: all .25s ease; transform-origin: center; }
        .cta-btn:hover { transform: translateY(-3px) scale(1.02); filter: brightness(1.05); }
      `}</style>

      <defs>
        <linearGradient id={isInstall ? 'gradMatchmakingInstall' : 'gradMatchmakingOpen'} x1="0%" y1="0%" x2="100%" y2="100%">
          {isInstall ? (
            <>
              <stop offset="0%" stopColor="#ff5f6d" />
              <stop offset="100%" stopColor="#ff2e63" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#4facfe" />
              <stop offset="100%" stopColor="#3f5efb" />
            </>
          )}
        </linearGradient>
      </defs>

      <g className="cta-btn">
        <rect x="5" y="5" rx="65" width="550" height="120" fill={isInstall ? 'url(#gradMatchmakingInstall)' : 'url(#gradMatchmakingOpen)'} />
        <rect
          x="15"
          y="15"
          rx="55"
          width="530"
          height="100"
          fill={isInstall ? '#f7edf1' : '#edf3ff'}
          opacity="0.98"
          stroke={isInstall ? '#f3c1cf' : '#bfd0ff'}
          strokeWidth="2"
        />

        <g transform="translate(45,35)">
          <rect width="60" height="60" rx="18" fill={isInstall ? '#ff2e63' : '#3f5efb'} />
          {isInstall ? (
            <path
              d="M30 18 L30 42 M22 34 L30 42 L38 34"
              stroke="#ffffff"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M20 30 L40 30 M32 22 L40 30 L32 38"
              stroke="#ffffff"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>

        <text x="320" y="72" fontSize={fontSize} fontFamily="Arial" fill={isInstall ? '#ff2e63' : '#3f5efb'} textAnchor="middle" fontWeight="bold">
          {label}
        </text>
      </g>
    </svg>
  );
}

export default function MatchmakingHub() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const BRAND_LOGO_SRC = staticAssetUrl('/brand-logo.webp');
  const langBase = getBaseLang(i18n?.language);
  const trustUi = getMatchmakingTrustUi(langBase);
  const appCtaUi = getMatchmakingAppCtaUi(langBase);

  const trafficCountryHint = (() => {
    try {
      const c = String(getSupportCountrySync({ lang: '' }) || '').toUpperCase();
      if (c === 'ID' || c === 'TR') return c;
      const tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
      if (tz.includes('jakarta') || tz.includes('makassar') || tz.includes('jayapura')) return 'ID';
      if (tz.includes('istanbul')) return 'TR';
      const nav = String(navigator?.language || '').toLowerCase();
      if (nav.startsWith('id') || nav.startsWith('in')) return 'ID';
      if (nav.startsWith('tr')) return 'TR';
      const lang = String(i18n?.language || '').toLowerCase();
      if (lang.startsWith('id') || lang.startsWith('in')) return 'ID';
      if (lang.startsWith('tr')) return 'TR';
      return '';
    } catch {
      return '';
    }
  })();

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
        const q1 = query(collection(db, 'matchmakingApplications'), where('userId', '==', user.uid), limit(1));
        const q2 = query(collection(db, 'matchmakingApplications'), where('uid', '==', user.uid), limit(1));
        const q3 = query(collection(db, 'matchmakingApplications'), where('userUid', '==', user.uid), limit(1));
        const [s1, s2, s3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);
        const any = !(s1?.empty ?? true) || !(s2?.empty ?? true) || !(s3?.empty ?? true);
        if (cancelled) return;
        setHasApplication(!!any);
      } catch {
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
          <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(236,253,245,0.90))] shadow-[0_30px_100px_rgba(15,23,42,0.10)] ring-1 ring-white/60">
            <div aria-hidden="true" className="absolute inset-0">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.20),rgba(16,185,129,0)_60%)] blur-2xl" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.14),rgba(245,158,11,0)_60%)] blur-2xl" />
            </div>

            <div className="relative p-6 md:p-10">
              <div className="flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-emerald-100 text-[11px] font-semibold tracking-[0.18em] uppercase text-emerald-950 shadow-[0_10px_30px_rgba(16,185,129,0.08)]">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>{t('navigation.matchmaking')}</span>
                    <span className="text-emerald-900/40">•</span>
                    <span className="text-emerald-900/70">{t('matchmakingHub.badge')}</span>
                  </div>

                  <h1 className="mt-4 text-3xl md:text-[2.7rem] font-semibold leading-tight text-slate-950">
                    {t('matchmakingHub.title')}
                  </h1>

                  <p className="mt-4 max-w-2xl text-slate-600 leading-relaxed">
                    {t('matchmakingHub.description')}
                  </p>

                  <FoundersShowcase compact className="mt-6" />

                  <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-[0_12px_30px_rgba(148,163,184,0.12)]">
                    {trustUi.ctaNote}
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    {!user && (
                      <Link
                        to={APP_INSTALL_PATH}
                        onClick={() => {
                          try {
                            void trackClick('cta_matchmaking_hub_install_app');
                          } catch {
                            // ignore
                          }
                        }}
                        className="block w-full sm:max-w-[320px]"
                      >
                        <MatchmakingAppSvgButton kind="install" label={appCtaUi.installLabel} />
                      </Link>
                    )}

                    {!user && canShowApply && (
                      <Link
                        to="/login"
                        state={{
                          from: '/login',
                          fromState: {
                            matchmakingNext: '/login',
                          },
                        }}
                        onClick={() => {
                          preloadLoginChunk();
                          try {
                            void trackClick('cta_matchmaking_hub_open_app');
                          } catch {
                            // ignore
                          }
                          tiktokTrack('SignupRedirect', {
                            source: 'matchmaking_hub_open_app',
                            to: '/login',
                          });
                        }}
                        onMouseEnter={preloadLoginChunk}
                        onTouchStart={preloadLoginChunk}
                        className="block w-full sm:max-w-[320px]"
                      >
                        <MatchmakingAppSvgButton kind="open" label={appCtaUi.openLabel} />
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

                  </div>

                  <div className="mt-3">
                    <Link
                      to="/aracilik"
                      className="group w-full inline-flex items-center justify-between gap-3 rounded-[22px] border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.96))] px-4 py-3 text-slate-900 shadow-[0_12px_35px_rgba(16,185,129,0.10)] hover:bg-emerald-100 transition"
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

                  <YouTubeVisitCard className="mt-5" compact />

                  <div className="mt-4 rounded-[22px] border border-fuchsia-100 bg-[linear-gradient(135deg,rgba(253,242,248,0.98),rgba(255,255,255,0.96))] p-4 text-slate-900 shadow-[0_14px_34px_rgba(15,23,42,0.10)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
                          {trustUi.instagramEyebrow}
                        </div>
                        <div className="mt-3 text-base font-semibold text-slate-900">
                          {trustUi.instagramTitle}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          {trustUi.instagramBody}
                        </p>
                      </div>

                      <a
                        href={INSTAGRAM_PROFILE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          try {
                            void trackClick('cta_matchmaking_hub_instagram');
                          } catch {
                            // ignore
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-2.5 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-100"
                      >
                        {trustUi.instagramCta}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center lg:items-end gap-5">
                  <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.90))] p-5 text-white shadow-[0_26px_90px_rgba(15,23,42,0.22)]">
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

                    <div className="mt-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{trustUi.heroPanelEyebrow}</div>
                    <div className="mt-3 text-lg font-semibold text-white">{trustUi.heroPanelTitle}</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-300">{trustUi.heroPanelBody}</div>
                    <div className="mt-4 space-y-2">
                      {trustUi.heroPanelStats.map((stat) => (
                        <div key={stat} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90">
                          {stat}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                        <div className="text-base font-semibold text-emerald-200">{t('matchmakingHub.miniCard.stats.privateTitle')}</div>
                        <div className="mt-1 text-[11px] text-slate-400">{t('matchmakingHub.miniCard.stats.privateSubtitle')}</div>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                        <div className="text-base font-semibold text-emerald-200">{t('matchmakingHub.miniCard.stats.fairTitle')}</div>
                        <div className="mt-1 text-[11px] text-slate-400">{t('matchmakingHub.miniCard.stats.fairSubtitle')}</div>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                        <div className="text-base font-semibold text-emerald-200">{t('matchmakingHub.miniCard.stats.safeTitle')}</div>
                        <div className="mt-1 text-[11px] text-slate-400">{t('matchmakingHub.miniCard.stats.safeSubtitle')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
