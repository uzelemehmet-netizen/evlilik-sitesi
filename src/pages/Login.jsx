import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  signInWithCustomToken,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import FoundersShowcase from '../components/FoundersShowcase';
import { auth } from "../config/firebaseAuth";
import { useAuth } from "../auth/AuthProvider";
import { isFeatureEnabled } from "../config/siteVariant";
import { authFetch } from "../utils/authFetch";
import { trackClick } from "../utils/clickTracker";
import { getAnonBrowserId } from "../utils/clickTracker";
import { markFunnelSignupCompleted } from "../utils/funnelTracker";
import { tiktokPage, tiktokTrack } from "../utils/tiktokPixel";
import { buildSupportReport, storeSupportReport } from "../utils/supportReport";
import { uploadImageToCloudinaryAuto } from '../utils/cloudinaryUpload';
import { Download, Mail } from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { useSupportLine } from '../hooks/useSupportLine';
import { APP_INSTALL_PATH, getAppInstallLinkUi } from '../utils/appInstallLink';
import { getClientCountry, getSupportCountrySync } from '../utils/supportLine';
import { normalizePathOnly, sanitizePostAuthTarget, shouldIgnorePostAuthState } from '../utils/postAuthRedirect';
import { staticAssetUrl } from '../utils/staticAssetUrl';

const AUTH_SHORT_VIDEOS = [
  {
    url: 'https://youtu.be/emeOAdBT8TU',
    videoId: 'emeOAdBT8TU',
    title: 'salih turkce & tini sitiani nikah',
  },
  {
    url: 'https://youtu.be/OgIGPCsiEu4',
    videoId: 'OgIGPCsiEu4',
    title: 'salih turkce & tini sitiani 2',
  },
  {
    url: 'https://youtu.be/Kgfd9KrKRdc',
    videoId: 'Kgfd9KrKRdc',
    title: 'salih turkce roportaj',
  },
];

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@endonezyakasifi';
const INSTAGRAM_PROFILE_URL = 'https://instagram.com/endonezyakasifi';

function resolveAuthLanguage(lang) {
  const key = String(lang || '').toLowerCase();
  if (key.startsWith('tr')) return 'tr';
  if (key.startsWith('id')) return 'id';
  return 'en';
}

function getAuthSupportUi(lang) {
  const copy = {
    tr: {
      decisionSummaryLabel: 'Hizli karar ozeti',
      quickFacts: [
        {
          title: 'Simdilik tamamen ucretsiz',
          body: 'Kayit, panel ve aktif eslesme akisi su an tamamen ucretsizdir; once sistemi gorur, size uygunsa devam edersiniz.',
        },
        {
          title: 'Karsilikli begeniyle aktif eslesme',
          body: 'Karsilikli begeni oldugunda aktif eslesme adimina gecersiniz; boylece surec daha net ve ciddi ilerler.',
        },
        {
          title: 'Ceviri destekli ozel sohbet',
          body: 'Iki taraf aktif eslesmeyi baslattiginda, aktif eslesme devam ettigi surece ozel pencerede ceviri destegiyle sinirsiz konusabilirsiniz.',
        },
      ],
      stepsTitle: 'Kayittan hemen sonra ne olur?',
      steps: [
        {
          title: 'Hesabiniz acilir',
          body: 'Google veya e-posta ile hesabiniz olusturulur ya da mevcut hesabiniza girersiniz.',
        },
        {
          title: 'Basvuru akisina gecersiniz',
          body: 'Yeni kullaniciysaniz sistem sizi dogru form ve panel akisina yonlendirir; karsilikli begeni sonrasi aktif eslesme adimina gecilir.',
        },
        {
          title: 'Kontrollu surec baslar',
          body: 'Profil herkese acik olmaz; aktif eslesme devam ettigi surece taraflar ceviri destekli ozel pencerede sinirsiz konusabilir.',
        },
      ],
      ctaNote: 'Simdilik tamamen ucretsiz • Karsilikli begeni aktif eslesme adimini baslatir • Aktif eslesmede ceviri destekli sinirsiz sohbet',
      whatsappLabel: 'Once WhatsApptan size uygun mu sorun',
      whatsappMessage: 'Merhaba, kayit olmadan once sistemin benim durumuma uygun olup olmadigini ogrenmek istiyorum.',
    },
    en: {
      decisionSummaryLabel: 'Quick decision summary',
      quickFacts: [
        {
          title: 'Completely free for now',
          body: 'Registration, the panel, and the active-match flow are fully free right now, so you can see the system first and continue only if it fits you.',
        },
        {
          title: 'Mutual like leads into active match',
          body: 'When the like becomes mutual, you move into the active-match step so the process stays clearer and more serious.',
        },
        {
          title: 'Private chat with translation support',
          body: 'Once both sides start the active match, they can keep talking in a private window with translation support and unlimited messaging while that active match continues.',
        },
      ],
      stepsTitle: 'What happens right after sign-up?',
      steps: [
        {
          title: 'Your account opens',
          body: 'You create an account with Google/email or sign in to your existing account.',
        },
        {
          title: 'You move into the application flow',
          body: 'If you are new, the system routes you into the right form and panel flow, and mutual likes move you toward the active-match step.',
        },
        {
          title: 'A controlled process begins',
          body: 'Your profile is not public; while an active match continues, both sides can talk in a private chat with translation support and unlimited messaging.',
        },
      ],
      ctaNote: 'Completely free for now • Mutual likes lead into active match • Translation-supported unlimited private chat while active',
      whatsappLabel: 'Ask on WhatsApp if it fits you first',
      whatsappMessage: 'Hello, before signing up I want to know whether this system fits my situation.',
    },
    id: {
      decisionSummaryLabel: 'Ringkasan keputusan cepat',
      quickFacts: [
        {
          title: 'Saat ini sepenuhnya gratis',
          body: 'Pendaftaran, panel, dan alur pencocokan aktif saat ini gratis sepenuhnya; Anda bisa melihat sistemnya dulu lalu lanjut hanya jika cocok.',
        },
        {
          title: 'Suka timbal balik menuju pencocokan aktif',
          body: 'Saat like menjadi timbal balik, Anda masuk ke tahap pencocokan aktif agar proses berjalan lebih jelas dan serius.',
        },
        {
          title: 'Chat privat dengan dukungan terjemahan',
          body: 'Setelah kedua pihak memulai pencocokan aktif, mereka bisa berbicara di jendela privat dengan dukungan terjemahan dan pesan tanpa batas selama pencocokan aktif berlangsung.',
        },
      ],
      stepsTitle: 'Apa yang terjadi tepat setelah daftar?',
      steps: [
        {
          title: 'Akun Anda terbuka',
          body: 'Anda membuat akun dengan Google/email atau masuk ke akun yang sudah ada.',
        },
        {
          title: 'Masuk ke alur pengajuan',
          body: 'Jika Anda pengguna baru, sistem mengarahkan Anda ke form dan panel yang sesuai; suka timbal balik membawa Anda ke tahap pencocokan aktif.',
        },
        {
          title: 'Proses terkontrol dimulai',
          body: 'Profil Anda tidak publik; selama pencocokan aktif berlangsung, kedua pihak bisa berbicara di chat privat dengan dukungan terjemahan dan pesan tanpa batas.',
        },
      ],
      ctaNote: 'Saat ini sepenuhnya gratis • Suka timbal balik membawa ke pencocokan aktif • Chat privat tanpa batas dengan dukungan terjemahan',
      whatsappLabel: 'Tanya dulu via WhatsApp apakah ini cocok untuk Anda',
      whatsappMessage: 'Halo, sebelum mendaftar saya ingin tahu apakah sistem ini cocok untuk situasi saya.',
    },
  };

  return copy[lang] || copy.tr;
}

function getAuthVideoUi(lang) {
  const copy = {
    tr: {
      eyebrow: 'Kisa videolar',
      title: 'Kayit oncesi uc kisa videoyu izleyin',
      body: 'Kayit mantigini hizlica gormek icin videolari alt alta acabilirsiniz.',
      cta: 'Videoyu ac',
      channelCta: 'Daha fazlasi icin YouTube kanalini ziyaret et',
    },
    en: {
      eyebrow: 'Short videos',
      title: 'Watch these three short videos before signing up',
      body: 'Open any of them to get a quick feel for the flow before registration.',
      cta: 'Open video',
      channelCta: 'Visit the YouTube channel for more',
    },
    id: {
      eyebrow: 'Video singkat',
      title: 'Tonton tiga video singkat ini sebelum mendaftar',
      body: 'Buka videonya satu per satu untuk melihat alurnya dengan cepat sebelum registrasi.',
      cta: 'Buka video',
      channelCta: 'Kunjungi kanal YouTube untuk lebih banyak video',
    },
  };

  return copy[lang] || copy.tr;
}

function getAuthSocialUi(lang) {
  const copy = {
    tr: {
      youtubeEyebrow: 'YouTube',
      youtubeTitle: 'YouTube kanalimizda seyahat ve nikah videolarimizi izleyin',
      youtubeBody: 'Uniqah, Endonezya hayati ve nikah sureclerine dair videolari YouTube kanalimizdan acabilirsiniz.',
      youtubeSearchHint: 'Dilerseniz YouTube arama kismina @endonezyakasifi yazarak ya da Videolarimizi Izle butonuna tiklayarak videolarimizi izleyebilirsiniz.',
      youtubeButtonLabel: 'Videolarimizi Izle',
      instagramButtonLabel: "Bizi Instagram'da Takip Et",
    },
    en: {
      youtubeEyebrow: 'YouTube',
      youtubeTitle: 'Watch our travel and wedding videos on our YouTube channel',
      youtubeBody: 'You can open our YouTube channel for videos about Uniqah, life in Indonesia, and marriage-related journeys.',
      youtubeSearchHint: 'If you want, you can type @endonezyakasifi into YouTube search or click the Watch Our Videos button to watch our videos.',
      youtubeButtonLabel: 'Watch Our Videos',
      instagramButtonLabel: 'Follow Us on Instagram',
    },
    id: {
      youtubeEyebrow: 'YouTube',
      youtubeTitle: 'Tonton video perjalanan dan pernikahan kami di kanal YouTube',
      youtubeBody: 'Anda bisa membuka kanal YouTube kami untuk video tentang Uniqah, kehidupan di Indonesia, dan proses pernikahan.',
      youtubeSearchHint: 'Jika mau, Anda bisa mengetik @endonezyakasifi di pencarian YouTube atau mengetuk tombol Tonton Video Kami untuk menonton video kami.',
      youtubeButtonLabel: 'Tonton Video Kami',
      instagramButtonLabel: 'Ikuti Kami di Instagram',
    },
  };

  return copy[lang] || copy.tr;
}

function AuthSocialLinks({ lang, idSuffix, className = '' }) {
  const socialUi = getAuthSocialUi(resolveAuthLanguage(lang));
  const youtubeBannerSrc = staticAssetUrl('/youtube-channel-banner.png');
  const youtubeSvgFontSize = resolveAuthLanguage(lang) === 'en' ? 34 : 40;
  const instagramSvgFontSize = resolveAuthLanguage(lang) === 'en' ? 34 : 40;
  const youtubeGradId = `youtube-handle-button-grad-${idSuffix}`;
  const instagramGradId = `instagram-button-grad-${idSuffix}`;

  return (
    <div className={[
      'mt-4 overflow-hidden rounded-[22px] border border-rose-200 bg-[linear-gradient(145deg,#fff7ed_0%,#fff1f2_100%)] shadow-sm',
      className,
    ].join(' ').trim()}>
      <div className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-[#0f1720] p-2 md:h-52 md:p-3">
        <img
          src={youtubeBannerSrc}
          alt="Endonezya Kasifi YouTube channel banner"
          className="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="p-4 md:p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">{socialUi.youtubeEyebrow}</div>
        <div className="mt-2 text-lg font-semibold leading-tight text-slate-950 md:text-xl">{socialUi.youtubeTitle}</div>
        <div className="mt-2 text-sm leading-relaxed text-slate-600">{socialUi.youtubeBody}</div>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white/90 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">YouTube</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{socialUi.youtubeSearchHint}</p>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Endonezya Kasifi YouTube channel"
            className="block w-full max-w-[340px]"
          >
            <svg viewBox="0 0 720 170" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full drop-shadow-[0_18px_12px_rgba(0,0,0,0.30)]">
              <style>{`
                .yt-btn { transition: all 0.25s ease; cursor: pointer; transform-origin: center; }
                .yt-btn:hover { transform: translateY(-4px) scale(1.02); filter: brightness(1.08); }
                .bell { transform-origin: 30px 40px; transition: transform 0.2s ease; }
                .yt-btn:hover .bell { transform: rotate(-12deg); }
                .ring { opacity: 0; transition: opacity 0.2s ease; }
                .yt-btn:hover .ring { opacity: 1; }
              `}</style>

              <defs>
                <linearGradient id={youtubeGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff4d4d" />
                  <stop offset="100%" stopColor="#cc0000" />
                </linearGradient>
              </defs>

              <g className="yt-btn">
                <rect x="5" y="5" rx="85" ry="85" width="710" height="160" fill={`url(#${youtubeGradId})`} />
                <rect x="15" y="15" rx="75" ry="75" width="690" height="140" fill="#ffffff" opacity="0.98" stroke="#efc0c0" strokeWidth="2" />

                <g transform="translate(55,50)">
                  <rect width="110" height="70" rx="18" fill="#FF0000" />
                  <polygon points="42,18 42,52 75,35" fill="#ffffff" />
                </g>

                <text x="390" y="80" fontSize={youtubeSvgFontSize} fontFamily="Arial, sans-serif" fill="#cc0000" textAnchor="middle" fontWeight="bold">
                  {socialUi.youtubeButtonLabel}
                </text>

                <text x="390" y="120" fontSize="24" fontFamily="Arial, sans-serif" fill="#333" textAnchor="middle">
                  @endonezyakasifi
                </text>

                <g transform="translate(600,45)">
                  <path className="ring" d="M5 30 Q0 40 5 50" stroke="#cc0000" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path className="ring" d="M55 30 Q60 40 55 50" stroke="#cc0000" strokeWidth="3" fill="none" strokeLinecap="round" />

                  <g className="bell">
                    <circle cx="30" cy="10" r="6" fill="#cc0000" />
                    <path
                      d="M30 18 C18 18, 10 28, 10 42 L10 55 L50 55 L50 42 C50 28, 42 18, 30 18 Z"
                      fill="#cc0000"
                    />
                    <ellipse cx="30" cy="55" rx="22" ry="6" fill="#b80000" />
                    <circle cx="30" cy="62" r="5" fill="#cc0000" />
                  </g>
                </g>
              </g>
            </svg>
          </a>

          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Endonezya Kasifi Instagram profile"
            className="block w-full max-w-[340px]"
          >
            <svg viewBox="0 0 720 170" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full drop-shadow-[0_18px_12px_rgba(0,0,0,0.30)]">
              <style>{`
                .ig-btn { transition: all 0.25s ease; cursor: pointer; transform-origin: center; }
                .ig-btn:hover { transform: translateY(-4px) scale(1.02); filter: brightness(1.1); }
                .ig-icon { transition: transform 0.3s ease; transform-origin: center; }
                .ig-btn:hover .ig-icon { transform: scale(1.1) rotate(5deg); }
              `}</style>

              <defs>
                <linearGradient id={instagramGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f58529" />
                  <stop offset="25%" stopColor="#dd2a7b" />
                  <stop offset="50%" stopColor="#8134af" />
                  <stop offset="75%" stopColor="#515bd4" />
                  <stop offset="100%" stopColor="#feda77" />
                </linearGradient>
              </defs>

              <g className="ig-btn">
                <rect x="5" y="5" rx="85" ry="85" width="710" height="160" fill={`url(#${instagramGradId})`} />
                <rect x="15" y="15" rx="75" ry="75" width="690" height="140" fill="#f7f1fb" opacity="0.97" stroke="#dac4f1" strokeWidth="2" />

                <g className="ig-icon" transform="translate(55,45)">
                  <rect x="0" y="0" width="90" height="90" rx="25" fill={`url(#${instagramGradId})`} />
                  <circle cx="45" cy="45" r="22" fill="none" stroke="#fff" strokeWidth="6" />
                  <circle cx="65" cy="25" r="6" fill="#fff" />
                </g>

                <text x="400" y="80" fontSize={instagramSvgFontSize} fontFamily="Arial, sans-serif" fill="#8134af" textAnchor="middle" fontWeight="bold">
                  {socialUi.instagramButtonLabel}
                </text>

                <text x="400" y="120" fontSize="24" fontFamily="Arial, sans-serif" fill="#333" textAnchor="middle">
                  @endonezyakasifi
                </text>
              </g>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const googleLogoSrc = useMemo(() => staticAssetUrl('/google-logo.png'), []);
  const supportLine = useSupportLine(String(i18n?.language || 'tr'));
  const authSupportUi = getAuthSupportUi(resolveAuthLanguage(i18n?.language));
  const authVideoUi = getAuthVideoUi(resolveAuthLanguage(i18n?.language));
  const installLinkUi = useMemo(() => getAppInstallLinkUi(i18n?.language), [i18n?.language]);
  const authSupportWhatsappHref = buildWhatsAppUrl(authSupportUi.whatsappMessage, {
    lang: String(i18n?.language || 'tr'),
    prefer: String(supportLine?.prefer || '').trim() || undefined,
    context: 'auth_trust_help',
  });
  
  const directEmailAuthRequested = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const method = String(params.get('method') || '').toLowerCase();
      return method === 'email';
    } catch {
      return false;
    }
  }, [location.search]);

  const trafficCountryHint = useMemo(() => {
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
  }, [i18n?.language]);

  const isLikelyIdTraffic = trafficCountryHint === 'ID';
  const isTrOrIdTraffic = trafficCountryHint === 'TR' || trafficCountryHint === 'ID';

  useEffect(() => {
    // If the user is likely in Indonesia, ensure UI language is Indonesian.
    // Do not override explicit querystring lang.
    try {
      const params = new URLSearchParams(location.search || '');
      const explicit = String(params.get('lang') || '').trim();
      if (explicit) return;

      // If user explicitly chose a language (selector/signup), never override it.
      const source = (() => {
        try {
          return String(localStorage.getItem('preferred_lang_source') || '').trim();
        } catch {
          // ignore
        }
        try {
          return String(sessionStorage.getItem('preferred_lang_source') || '').trim();
        } catch {
          return '';
        }
      })();
      if (source === 'selector' || source === 'signup') return;

      const current = String(i18n?.language || '').toLowerCase();
      if (current.startsWith('id') || current.startsWith('in')) return;

      // First try cached/heuristic signal.
      if (isLikelyIdTraffic) {
        void i18n.changeLanguage('id');
        return;
      }

      // Then do a best-effort country fetch (/api/client-ip) to make it deterministic.
      Promise.resolve(getClientCountry())
        .then((country) => {
          const sourceNow = (() => {
            try {
              return String(localStorage.getItem('preferred_lang_source') || '').trim();
            } catch {
              // ignore
            }
            try {
              return String(sessionStorage.getItem('preferred_lang_source') || '').trim();
            } catch {
              return '';
            }
          })();
          if (sourceNow === 'selector' || sourceNow === 'signup') return;

          const c = String(country || '').trim().toUpperCase();
          if (c !== 'ID') return;
          const cur2 = String(i18n?.language || '').toLowerCase();
          if (cur2.startsWith('id') || cur2.startsWith('in')) return;
          void i18n.changeLanguage('id');
        })
        .catch(() => {
          // ignore
        });
    } catch {
      // ignore
    }
  }, [i18n, isLikelyIdTraffic, location.search]);

  const normalizeBaseLang = (raw) => {
    const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0];
    if (base === 'in') return 'id';
    if (base === 'tr' || base === 'en' || base === 'id') return base;
    return 'tr';
  };

  const authUiLang = useMemo(() => normalizeBaseLang(i18n?.language), [i18n?.language]);

  useEffect(() => {
    // Firebase Auth e-posta şablonları / hata metinleri için dil.
    try {
      auth.languageCode = authUiLang;
    } catch {
      // ignore
    }
  }, [authUiLang]);

  const configureGoogleProviderLocale = (provider) => {
    try {
      // Google OAuth UI dilini zorla (özellikle popup/redirect sayfaları).
      provider.setCustomParameters({ hl: authUiLang });
    } catch {
      // ignore
    }
  };

  const startGoogleRedirect = (provider, { flow = 'google_redirect_start' } = {}) => {
    try {
      setInfo(t('authPage.redirecting'));
    } catch {
      // ignore
    }

    writeAuthProvider('google');
    writeRedirectStartMarker({ provider: 'google', intent: mode });

    try {
      if (mode === 'signup') {
        void trackClick('signup_redirect_start:google');
      } else {
        void trackClick('login_redirect_start:google');
      }
    } catch {
      // ignore
    }

    // Do not await: preserve user-gesture context.
    void signInWithRedirect(auth, provider).catch((e) => {
      try {
        const code = String(e?.code || '').trim();
        const msg = String(e?.message || '').trim();
        setEmailFallbackVisible(true);

        try {
          if (mode === 'signup') {
            void trackClick(`signup_error:google_redirect_start:${code || 'unknown'}`, { trace: true });
          } else {
            void trackClick(`login_error:google_redirect_start:${code || 'unknown'}`, { trace: true });
          }
        } catch {
          // ignore
        }

        void reportAuthIssue({
          kind: 'auth_redirect_start_failed',
          flow,
          code: code || 'unknown',
          message: msg,
          intent: mode,
        });
      } catch {
        // ignore
      }

      // Surface to UI (avoid silent failures that look like "button does nothing").
      try {
        const code = String(e?.code || '').trim();
        if (code === 'auth/unauthorized-domain') {
          const host = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
          setError(
            t('authPage.errors.googleUnauthorizedDomain', {
              host: host || t('authPage.errors.domainNotFound'),
            })
          );
        } else if (code === 'auth/account-exists-with-different-credential') {
          setError(t('authPage.errors.accountExistsWithDifferentCredential'));
        } else if (code === 'auth/operation-not-allowed') {
          setError(t('authPage.errors.googleOperationNotAllowed'));
        } else if (code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found') {
          setError(t('authPage.errors.firebaseAuthInvalidConfig'));
        } else if (code === 'auth/network-request-failed') {
          setError(t('authPage.errors.networkFailed'));
        } else {
          setError(String(e?.message || '').trim() || t('authPage.errors.googleFailed'));
        }
      } catch {
        // ignore
      }

      authFlowBusyRef.current = false;
      setBusy(false);
    });
  };

  const safeStr = (v) => (typeof v === 'string' ? v.trim() : '');

  const classifyAuthError = (codeRaw, messageRaw) => {
    const code = String(codeRaw || '').trim();
    const msg = String(messageRaw || '').trim().toLowerCase();

    if (code === 'auth/unauthorized-domain') return 'unauthorized_domain';
    if (code === 'auth/popup-blocked') return 'popup_blocked';
    if (code === 'auth/popup-closed-by-user') return 'popup_closed';
    if (code === 'auth/cancelled-popup-request') return 'popup_cancelled';
    if (code === 'auth/user-cancelled') return 'user_cancelled';
    if (code === 'auth/account-exists-with-different-credential') return 'account_exists_different_credential';
    if (code === 'auth/invalid-credential') return 'invalid_credential';
    if (code === 'auth/wrong-password') return 'wrong_password';
    if (code === 'auth/user-not-found') return 'user_not_found';
    if (code === 'auth/invalid-email') return 'invalid_email';
    if (code === 'auth/email-already-in-use') return 'email_already_in_use';
    if (code === 'auth/weak-password') return 'weak_password';
    if (code === 'auth/operation-not-allowed') return 'operation_not_allowed';
    if (code === 'auth/invalid-api-key') return 'invalid_api_key';
    if (code === 'auth/configuration-not-found') return 'configuration_not_found';
    if (code === 'auth/network-request-failed') return 'network_request_failed';
    if (code === 'auth/too-many-requests') return 'too_many_requests';

    if (/network|failed to fetch|fetch failed|load failed|timeout/.test(msg)) return 'network_or_timeout';
    if (/blocked|csp|content security policy/.test(msg)) return 'csp_blocked';
    return 'unknown';
  };

  const inferAuthTransport = (flow) => {
    const f = String(flow || '').trim().toLowerCase();
    if (f.includes('google_redirect') || f.includes('redirect')) return 'redirect';
    if (f.includes('google_popup') || f.includes('popup')) return 'popup';
    if (f.includes('email')) return 'email_password';
    return '';
  };

  const inferAuthProvider = (flow) => {
    const f = String(flow || '').trim().toLowerCase();
    if (f.includes('google')) return 'google';
    if (f.includes('email')) return 'email';
    return '';
  };

  const reportAuthIssue = async ({ kind, flow, code, message, intent } = {}) => {
    try {
      const cleanCode = String(code || '').trim();
      const cleanMsg = String(message || '').trim();
      const authClass = classifyAuthError(cleanCode, cleanMsg);
      const transport = inferAuthTransport(flow);
      const provider = inferAuthProvider(flow);

      const report = buildSupportReport({
        kind: kind || 'auth_issue',
        flow: flow || 'auth',
        code: cleanCode || undefined,
        message: cleanMsg ? cleanMsg.slice(0, 800) : '',
        extra: {
          authClass,
          authTransport: transport || undefined,
          authProvider: provider || undefined,
          intent: String(intent || '').trim(),
          mode: String(mode || '').trim(),
          anonId: (() => {
            try {
              return getAnonBrowserId();
            } catch {
              return '';
            }
          })(),
          path: (() => {
            try {
              return String(window.location?.pathname || '');
            } catch {
              return '';
            }
          })(),
          host: (() => {
            try {
              return String(window.location?.hostname || '');
            } catch {
              return '';
            }
          })(),
          origin: (() => {
            try {
              return String(window.location?.origin || '');
            } catch {
              return '';
            }
          })(),
          ua: (() => {
            try {
              return String(navigator.userAgent || '').slice(0, 220);
            } catch {
              return '';
            }
          })(),
        },
      });

      storeSupportReport(report);
      try {
        setDebugAuth({ kind: report.kind, flow: report.flow, code: cleanCode, message: cleanMsg, authClass });
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  };

  const hasNavigatedRef = useRef(false);
  const authFlowBusyRef = useRef(false);
  const redirectFinalizeOnceRef = useRef(false);
  const applyGuardReportOnceRef = useRef(false);
  const feedbackSectionRef = useRef(null);

  const redirectTarget = useMemo(() => {
    const state = location.state || {};
    const from = sanitizePostAuthTarget(state.from || '/profilim', '/profilim');
    return {
      from,
      fromState: shouldIgnorePostAuthState(state.from) ? null : state.fromState || null,
    };
  }, [location.state]);

  useEffect(() => {
    tiktokPage();
  }, []);

  const [mode, setMode] = useState("login"); // login | signup
  const [authTour, setAuthTour] = useState({ open: false, step: 0 });

  const HAS_SIGNED_UP_KEY = 'mk_has_signed_up_v1';
  const readHasSignedUpBefore = () => {
    try {
      return localStorage.getItem(HAS_SIGNED_UP_KEY) === '1';
    } catch {
      return false;
    }
  };
  const markHasSignedUpBefore = () => {
    try {
      localStorage.setItem(HAS_SIGNED_UP_KEY, '1');
    } catch {
      // ignore
    }
  };

  const [emailFallbackVisible, setEmailFallbackVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const mobileAuthCtaRef = useRef(null);
  const desktopAuthCtaRef = useRef(null);
  const landingPrimaryActionTakenRef = useRef(false);
  const landingDropoffSentRef = useRef(false);
  const landingCtaImpressionSentRef = useRef(false);

  const isSignupLanding = useMemo(() => location.pathname === '/login' && mode === 'signup', [location.pathname, mode]);

  const trackLandingPrimaryCtaImpression = useCallback(() => {
    if (!isSignupLanding || user) return false;
    if (landingCtaImpressionSentRef.current) return false;
    landingCtaImpressionSentRef.current = true;
    try {
      void trackClick('landing_primary_cta_impression');
    } catch {
      // ignore
    }
    return true;
  }, [isSignupLanding, user]);

  const isLandingCtaVisible = useCallback((node) => {
    if (!node || typeof window === 'undefined' || typeof node.getBoundingClientRect !== 'function') return false;

    const rect = node.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return false;

    const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 0;
    if (!viewportWidth || !viewportHeight) return false;

    const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    if (!visibleWidth || !visibleHeight) return false;

    const visibleArea = visibleWidth * visibleHeight;
    const totalArea = Math.max(1, rect.width * rect.height);
    return visibleArea / totalArea >= 0.12;
  }, []);

  const markLandingPrimaryAction = useCallback(() => {
    landingPrimaryActionTakenRef.current = true;
  }, []);

  const getGoogleInAppBrowserHint = () => {
    try {
      const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
      if (!ua) return '';
      if (/trill[_\s/-]?|tiktok/i.test(ua)) return 'tiktok';
      if (/fbav|fban/i.test(ua)) return 'facebook';
      if (/instagram/i.test(ua)) return 'instagram';
      if (/line\//i.test(ua)) return 'line';
      if (/micromessenger|wechat/i.test(ua)) return 'wechat';
      return '';
    } catch {
      return '';
    }
  };

  const googleInAppBrowserHint = getGoogleInAppBrowserHint();
  const isGoogleInAppBrowser = !!googleInAppBrowserHint;

  const handleLandingWhatsAppClick = useCallback(() => {
    markLandingPrimaryAction();
    try {
      void trackClick('landing_whatsapp_prequalify_click');
    } catch {
      // ignore
    }
  }, [markLandingPrimaryAction]);

  const handleEmailMethodClick = useCallback(() => {
    trackLandingPrimaryCtaImpression();
    markLandingPrimaryAction();
    setEmailFallbackVisible(true);
    try {
      void trackClick(mode === 'signup' ? 'signup_click_email_password' : 'login_click_email_password');
    } catch {
      // ignore
    }
  }, [markLandingPrimaryAction, mode, trackLandingPrimaryCtaImpression]);

  const handleOpenInBrowserClick = useCallback(() => {
    trackLandingPrimaryCtaImpression();
    markLandingPrimaryAction();
    setEmailFallbackVisible(true);
    openAuthInExternalBrowser();
  }, [markLandingPrimaryAction, trackLandingPrimaryCtaImpression]);

  useEffect(() => {
    // Signup modunda email/password seçeneğini üstte hazır tut.
    // Google hata verdiğinde kullanıcı ikinci yöntemi aramak zorunda kalmasın.
    setEmailFallbackVisible(mode === 'signup' || isGoogleInAppBrowser);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [isGoogleInAppBrowser, mode]);
  
  useEffect(() => {
    if (!directEmailAuthRequested) return;
    if (!emailFallbackVisible) return;
    if (typeof document === 'undefined') return;

    const focusVisibleEmailInput = () => {
      const inputs = Array.from(document.querySelectorAll('input[type="email"]'));
      const target = inputs.find((input) => {
        if (!input || input.disabled) return false;
        const style = window.getComputedStyle(input);
        return style.display !== 'none' && style.visibility !== 'hidden' && input.offsetParent !== null;
      });

      if (!target) return;
      target.focus();
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };

    const timeoutId = window.setTimeout(focusVisibleEmailInput, 0);
    return () => window.clearTimeout(timeoutId);
  }, [directEmailAuthRequested, emailFallbackVisible]);

  useEffect(() => {
    landingPrimaryActionTakenRef.current = false;
    landingDropoffSentRef.current = false;
    landingCtaImpressionSentRef.current = false;
  }, [location.pathname, location.search, mode]);

  useEffect(() => {
    if (!isSignupLanding || user) return undefined;
    if (typeof window === 'undefined') return undefined;

    const nodes = [mobileAuthCtaRef.current, desktopAuthCtaRef.current].filter(Boolean);
    if (!nodes.length) return undefined;

    const markIfVisible = () => {
      if (landingCtaImpressionSentRef.current) return;
      if (nodes.some((node) => isLandingCtaVisible(node))) {
        trackLandingPrimaryCtaImpression();
      }
    };

    markIfVisible();

    const rafId = typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(markIfVisible) : 0;
    const timeoutId = window.setTimeout(markIfVisible, 1200);

    if (typeof IntersectionObserver === 'undefined') {
      const handleViewportChange = () => {
        markIfVisible();
      };

      window.addEventListener('scroll', handleViewportChange, { passive: true });
      window.addEventListener('resize', handleViewportChange);

      return () => {
        if (rafId) window.cancelAnimationFrame(rafId);
        window.clearTimeout(timeoutId);
        window.removeEventListener('scroll', handleViewportChange);
        window.removeEventListener('resize', handleViewportChange);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (landingCtaImpressionSentRef.current) return;
        const visible = entries.some(
          (entry) => (entry.isIntersecting && entry.intersectionRatio >= 0.15) || isLandingCtaVisible(entry.target)
        );
        if (!visible) return;
        trackLandingPrimaryCtaImpression();
        observer.disconnect();
      },
      { threshold: [0, 0.15, 0.35] }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [isLandingCtaVisible, isSignupLanding, trackLandingPrimaryCtaImpression, user]);

  useEffect(() => {
    if (!isSignupLanding || user) return undefined;

    const reportDropoff = () => {
      if (landingDropoffSentRef.current) return;
      if (landingPrimaryActionTakenRef.current) return;
      landingDropoffSentRef.current = true;
      try {
        void trackClick('landing_dropoff_before_primary_action', { page: '/login' });
      } catch {
        // ignore
      }
    };

    window.addEventListener('pagehide', reportDropoff);
    return () => window.removeEventListener('pagehide', reportDropoff);
  }, [isSignupLanding, user]);

  // Post-auth navigation: redirect/popup akışlarında hedef sayfa bilgisi
  // URL state kaybolabildiği için sessionStorage'da saklanır.
  const POST_AUTH_NAV_KEY = 'auth_post_auth_nav_v1';
  const writePendingPostAuthNav = (target, state) => {
    try {
      const t = String(target || '').trim();
      if (!t) return;
      sessionStorage.setItem(
        POST_AUTH_NAV_KEY,
        JSON.stringify({ target: t, state: typeof state === 'undefined' ? null : state, atMs: Date.now() })
      );
    } catch {
      // ignore
    }
  };
  const readPendingPostAuthNav = () => {
    try {
      const raw = sessionStorage.getItem(POST_AUTH_NAV_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      const ageMs = Date.now() - Number(parsed.atMs || 0);
      // Eski kalmış hedefler yönlendirme loop'u yaratmasın.
      if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 10 * 60 * 1000) return null;
      return parsed;
    } catch {
      return null;
    }
  };
  const clearPendingPostAuthNav = () => {
    try {
      sessionStorage.removeItem(POST_AUTH_NAV_KEY);
    } catch {
      // ignore
    }
  };

  // Redirect debug marker: helps diagnose cases where Google chooser completes but
  // Firebase cannot finalize the redirect (getRedirectResult returns null).
  const REDIRECT_START_KEY = 'auth_redirect_start_v1';
  const writeRedirectStartMarker = ({ provider, intent } = {}) => {
    try {
      const host = (() => {
        try {
          return String(window.location?.hostname || '');
        } catch {
          return '';
        }
      })();
      const path = (() => {
        try {
          return String(window.location?.pathname || '');
        } catch {
          return '';
        }
      })();
      const search = (() => {
        try {
          return String(window.location?.search || '');
        } catch {
          return '';
        }
      })();

      sessionStorage.setItem(
        REDIRECT_START_KEY,
        JSON.stringify({
          atMs: Date.now(),
          provider: String(provider || '').trim(),
          intent: String(intent || '').trim(),
          host,
          path,
          search,
        })
      );
    } catch {
      // ignore
    }
  };
  const readRedirectStartMarker = () => {
    try {
      const raw = sessionStorage.getItem(REDIRECT_START_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      const ageMs = Date.now() - Number(parsed.atMs || 0);
      if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 10 * 60 * 1000) return null;
      return parsed;
    } catch {
      return null;
    }
  };
  const clearRedirectStartMarker = () => {
    try {
      sessionStorage.removeItem(REDIRECT_START_KEY);
    } catch {
      // ignore
    }
  };

  // DEV-only: capture Google auth transport decision (popup vs redirect) to diagnose local issues.
  const GOOGLE_DECISION_KEY = 'auth_google_decision_v1';
  const writeGoogleDecisionDebug = (payload) => {
    try {
      if (!import.meta.env.DEV) return;
      sessionStorage.setItem(
        GOOGLE_DECISION_KEY,
        JSON.stringify({ atMs: Date.now(), ...(payload && typeof payload === 'object' ? payload : {}) })
      );
    } catch {
      // ignore
    }
  };

  const QUICK_PROFILE_DRAFT_KEY = 'mk_quick_profile_draft_v1';
  const readQuickProfileDraft = () => {
    try {
      const raw = localStorage.getItem(QUICK_PROFILE_DRAFT_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      return d && typeof d === 'object' ? d : null;
    } catch {
      return null;
    }
  };
  const writeQuickProfileDraft = (draft) => {
    try {
      localStorage.setItem(QUICK_PROFILE_DRAFT_KEY, JSON.stringify(draft || {}));
    } catch {
      // ignore
    }
  };
  const clearQuickProfileDraft = () => {
    try {
      localStorage.removeItem(QUICK_PROFILE_DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  const [quickProfile, setQuickProfile] = useState({
    fullName: '',
    age: '',
    gender: '',
    city: '',
    countryCode: 'tr',
    maritalStatus: '',
    hasChildren: '',
    childrenCount: '',
    childrenLivingSituation: '',
    occupation: '',
    photoUrl: '',
  });
  const [quickPhotoState, setQuickPhotoState] = useState({ loading: false, error: '' });
  const quickHydratedRef = useRef('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [debugAuth, setDebugAuth] = useState(null);
  const [redirectCheckDone, setRedirectCheckDone] = useState(false);
  const [needsQuickProfile, setNeedsQuickProfile] = useState(false);
  const [quickProfileCheckDone, setQuickProfileCheckDone] = useState(false);
  const [forceLogin, setForceLogin] = useState(false);

  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackErr, setFeedbackErr] = useState('');

  const [idSignupHelp, setIdSignupHelp] = useState({
    name: '',
    age: '',
    maritalStatus: '',
    hasChildren: '',
    childrenCount: '',
    childrenLivingSituation: '',
    job: '',
    criteriaNote: '',
  });

  const showIdSignupHelp = useMemo(() => {
    if (mode !== 'signup') return false;
    const lang = String(i18n?.language || '').toLowerCase();
    if (lang.startsWith('id')) return true;
    return String(supportLine?.prefer || '') === 'id';
  }, [mode, i18n?.language, supportLine?.prefer]);

  const idSignupHelpText = useMemo(() => {
    try {
      const pick = (v) => String(v || '').trim();

      const hasChildrenLabel = (() => {
        const v = pick(idSignupHelp.hasChildren);
        if (v === 'yes') return t('authPage.idSignupHelp.options.hasChildrenYes');
        if (v === 'no') return t('authPage.idSignupHelp.options.hasChildrenNo');
        return '-';
      })();

      const childrenLivingSituationLabel = (() => {
        const v = pick(idSignupHelp.childrenLivingSituation);
        if (v === 'with_children') return t('matchmakingPage.form.options.childrenLivingSituation.withChildren');
        if (v === 'separate') return t('matchmakingPage.form.options.childrenLivingSituation.separate');
        return '-';
      })();

      const lines = [
        t('authPage.idSignupHelp.messageTitle'),
        `${t('authPage.idSignupHelp.messageFields.name')}: ${pick(idSignupHelp.name) || '-'}`,
        `${t('authPage.idSignupHelp.messageFields.age')}: ${pick(idSignupHelp.age) || '-'}`,
        `${t('authPage.idSignupHelp.messageFields.maritalStatus')}: ${pick(idSignupHelp.maritalStatus) || '-'}`,
        `${t('authPage.idSignupHelp.messageFields.hasChildren')}: ${hasChildrenLabel}`,
        `${t('authPage.idSignupHelp.messageFields.childrenCount')}: ${pick(idSignupHelp.childrenCount) || '-'}`,
        `${t('matchmakingPage.form.labels.childrenLivingSituation')}: ${childrenLivingSituationLabel}`,
        `${t('authPage.idSignupHelp.messageFields.job')}: ${pick(idSignupHelp.job) || '-'}`,
        `${t('authPage.idSignupHelp.messageFields.criteriaNote')}: ${pick(idSignupHelp.criteriaNote) || '-'}`,
      ];
      return lines.join('\n');
    } catch {
      return '';
    }
  }, [idSignupHelp, t]);

  const idSignupHelpCanSend = useMemo(() => {
    if (!showIdSignupHelp) return false;
    const name = String(idSignupHelp?.name || '').trim();
    const age = String(idSignupHelp?.age || '').trim();
    return !!name && !!age;
  }, [showIdSignupHelp, idSignupHelp?.name, idSignupHelp?.age]);

  const idSignupHelpHref = useMemo(() => {
    if (!idSignupHelpCanSend) return '#';
    return buildWhatsAppUrl(idSignupHelpText, { lang: i18n?.language, prefer: 'id', context: 'auth_id_signup_help' });
  }, [idSignupHelpCanSend, idSignupHelpText, i18n?.language]);

  const showGoogleInAppFallback = () => {
    setEmailFallbackVisible(true);
    setError('');
    setInfo(t('authPage.infos.googleInAppHelp'));
  };

  const getExternalBrowserAuthUrl = () => {
    try {
      if (typeof window === 'undefined') return '';
      const url = new URL(window.location.href);
      url.searchParams.set('mode', mode === 'login' ? 'login' : 'signup');
      url.searchParams.delete('auto');
      url.searchParams.delete('transport');
      return url.toString();
    } catch {
      return '';
    }
  };

  const openAuthInExternalBrowser = () => {
    const targetUrl = getExternalBrowserAuthUrl();
    if (!targetUrl || typeof window === 'undefined') return false;

    try {
      void trackClick('auth_open_external_browser', { trace: true });
    } catch {
      // ignore
    }

    try {
      setInfo(t('authPage.infos.openingExternalBrowser'));
    } catch {
      // ignore
    }

    let attempted = false;
    const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '').toLowerCase() : '';

    if (/android/i.test(ua)) {
      try {
        const u = new URL(targetUrl);
        const fallbackUrl = encodeURIComponent(targetUrl);
        const path = `${u.pathname}${u.search}${u.hash}`;
        const intentUrl = `intent://${u.host}${path}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;S.browser_fallback_url=${fallbackUrl};end`;
        window.location.assign(intentUrl);
        attempted = true;
      } catch {
        // ignore
      }
    }

    if (!attempted) {
      try {
        const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer');
        if (popup) {
          popup.opener = null;
          attempted = true;
        }
      } catch {
        // ignore
      }
    }

    return attempted;
  };

  const genderOptions = useMemo(
    () => [
      { id: '', label: t('authPage.quickProfile.errors.genderRequired').replace(/\.$/, '') },
      { id: 'male', label: t('authPage.signup.genderMale') },
      { id: 'female', label: t('authPage.signup.genderFemale') },
    ],
    [t]
  );

  useEffect(() => {
    if (!needsQuickProfile) return;
    const uid = safeStr(user?.uid || auth?.currentUser?.uid);
    if (!uid) return;

    const d = readQuickProfileDraft();
    if (!d) return;
    const owner = safeStr(d.ownerUid);
    if (owner && owner !== uid) return;

    const signature = `${uid}:${String(d.savedAtMs || '')}:${String(d.completed ? '1' : '0')}`;
    if (quickHydratedRef.current === signature) return;
    quickHydratedRef.current = signature;

    setQuickProfile((p) => ({
      ...p,
      fullName: safeStr(d.fullName),
      age: String(d.age ?? ''),
      gender: safeStr(d.gender),
      city: safeStr(d.city),
      countryCode: safeStr(d.countryCode) || 'tr',
      maritalStatus: safeStr(d.maritalStatus),
      hasChildren: safeStr(d.hasChildren),
      childrenCount: String(d.childrenCount ?? ''),
      childrenLivingSituation: safeStr(d.childrenLivingSituation),
      occupation: safeStr(d.occupation),
      photoUrl: safeStr(d.photoUrl),
    }));

  }, [needsQuickProfile, user?.uid]);

  const validateQuickProfile = (p) => {
    const fullName = safeStr(p?.fullName);
    const city = safeStr(p?.city);
    const occupation = safeStr(p?.occupation);
    const gender = safeStr(p?.gender);
    const maritalStatus = safeStr(p?.maritalStatus);
    const countryCode = safeStr(p?.countryCode);
    const photoUrl = safeStr(p?.photoUrl);

    const ageNum = Number(String(p?.age ?? '').trim());
    const ageOk = Number.isFinite(ageNum) && Number.isInteger(ageNum) && ageNum >= 18 && ageNum <= 99;

    if (!fullName) return t('authPage.quickProfile.errors.nameRequired');
    if (!ageOk) return t('authPage.quickProfile.errors.ageInvalid');
    if (!gender) return t('authPage.quickProfile.errors.genderRequired');
    if (!city) return t('authPage.quickProfile.errors.cityRequired');
    if (!countryCode) return t('authPage.quickProfile.errors.countryRequired');
    if (!maritalStatus) return t('authPage.quickProfile.errors.maritalRequired');
    if (!occupation) return t('authPage.quickProfile.errors.occupationRequired');

    const hasChildren = safeStr(p?.hasChildren);
    if (!hasChildren) return t('authPage.quickProfile.errors.hasChildrenRequired');
    if (hasChildren === 'yes') {
      const c = Number(String(p?.childrenCount ?? '').trim());
      const ok = Number.isFinite(c) && Number.isInteger(c) && c >= 1 && c <= 20;
      if (!ok) return t('authPage.quickProfile.errors.childrenCountRequired');
      if (!safeStr(p?.childrenLivingSituation)) return t('matchmakingPage.form.errors.childrenLivingSituation');
    }

    if (!photoUrl) return t('authPage.quickProfile.errors.photoRequired');
    return '';
  };

  const persistQuickDraft = (next, { completed = false } = {}) => {
    const ageNum = Number(String(next?.age ?? '').trim());
    const age = Number.isFinite(ageNum) && Number.isInteger(ageNum) ? ageNum : null;
    const draft = {
      ownerUid: safeStr(user?.uid || auth?.currentUser?.uid),
      fullName: safeStr(next?.fullName),
      age,
      gender: safeStr(next?.gender),
      city: safeStr(next?.city),
      countryCode: safeStr(next?.countryCode) || 'tr',
      maritalStatus: safeStr(next?.maritalStatus),
      hasChildren: safeStr(next?.hasChildren),
      childrenCount: Number(String(next?.childrenCount ?? '').trim()) || 0,
      childrenLivingSituation: safeStr(next?.childrenLivingSituation),
      occupation: safeStr(next?.occupation),
      photoUrl: safeStr(next?.photoUrl),
      completed: !!completed,
      savedAtMs: Date.now(),
    };

    writeQuickProfileDraft(draft);
    // Redirect fallback için de sakla.
    try {
      writeSignupProfile({ gender: draft.gender, age: draft.age, nationality: draft.countryCode });
    } catch {
      // ignore
    }
  };

  const handleQuickPhotoSelect = async (file) => {
    if (!file) return;
    const type = String(file?.type || '').toLowerCase();
    if (!type.startsWith('image/')) {
      setQuickPhotoState({ loading: false, error: t('authPage.quickProfile.errors.photoNotImage') });
      return;
    }

    setQuickPhotoState({ loading: true, error: '' });
    try {
      const folder = 'matchmaking/photos/quick-profile';
      const up = await uploadImageToCloudinaryAuto(file, { folder, tags: ['quick_profile'] });
      const url = safeStr(up?.secureUrl);
      if (!url) throw new Error('photo_upload_failed');

      setQuickProfile((p) => {
        const next = { ...p, photoUrl: url };
        persistQuickDraft(next, { completed: false });
        return next;
      });
      setQuickPhotoState({ loading: false, error: '' });
    } catch (e) {
      const raw = String(e?.message || '').trim();
      const msg = raw === 'photo_upload_failed' ? '' : raw;
      setQuickPhotoState({
        loading: false,
        error: msg || t('authPage.quickProfile.errors.photoUploadFailed'),
      });
    }
  };

  const handleQuickProfileSubmit = async () => {
    const err = validateQuickProfile(quickProfile);
    if (err) {
      setError(err);
      return;
    }

    persistQuickDraft(quickProfile, { completed: true });

    setBusy(true);
    setError('');
    setInfo('');

    try {
      const res = await applyQuickProfileAfterAuthIfAny('post_auth_form');
      if (res?.applied) {
        setNeedsQuickProfile(false);
        navigate('/profilim', { replace: true });
        return;
      }
      setError(t('authPage.quickProfile.errors.saveFailed'));
    } catch (e) {
      setError(String(e?.message || '').trim() || t('authPage.quickProfile.errors.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const applyQuickProfileAfterAuthIfAny = async (flow) => {
    try {
      clearQuickProfileDraft();
    } catch {
      // ignore
    }

    return { applied: false, retired: true, flow };
  };

  const isMatchmakingApplyPath = (p) => {
    const path = normalizePathOnly(p);
    return path === '/wedding/apply' || path === '/evlilik/eslestirme-basvuru' || path === '/evlilik/eslestirme-basvurusu';
  };

  const hasCompletedApplication = async (uid) => {
    const userId = String(uid || '').trim();
    if (!userId) return false;
    try {
      const data = await authFetch('/api/matchmaking-profile-completion-state', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid: userId }),
      });
      if (data?.ok === true) return data?.completed === true;
      return null;
    } catch {
      // Hata olursa kullanıcıyı bloklamayalım; guard hedefi zorla değiştirmesin.
      return null;
    }
  };

  useEffect(() => {
    if (!redirectCheckDone) {
      setNeedsQuickProfile(false);
      setQuickProfileCheckDone(false);
      return;
    }

    const uid = String(user?.uid || '').trim();
    if (!uid) {
      setNeedsQuickProfile(false);
      setQuickProfileCheckDone(true);
      return;
    }

    if (!isFeatureEnabled('wedding')) {
      setNeedsQuickProfile(false);
      setQuickProfileCheckDone(true);
      return;
    }

    // Ürün kararı: hızlı profil akışı kaldırıldı, tüm kullanıcılar tek birleşik başvuru formuna gider.
    setNeedsQuickProfile(false);
    setQuickProfileCheckDone(true);
  }, [user?.uid, redirectCheckDone]);


  const readStoredRedirect = () => {
    try {
      const raw = sessionStorage.getItem('auth_redirect_target');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        from: sanitizePostAuthTarget(parsed?.from || '/profilim', '/profilim'),
        fromState: shouldIgnorePostAuthState(parsed?.from) ? null : parsed?.fromState || null,
      };
    } catch {
      return null;
    }
  };

  const AUTH_INTENT_KEY = 'auth_intent';
  const AUTH_PROVIDER_KEY = 'auth_provider';
  const SIGNUP_PROFILE_KEY = 'auth_signup_profile';
  const JUST_SIGNED_UP_KEY = 'auth_just_signed_up';
  const REFERRAL_CODE_KEY = 'auth_referral_code';
  const TOUR_FORCE_KEY = 'uniqah:tour:force';

  const forceTour = (tourId) => {
    const id = String(tourId || '').trim();
    if (!id) return;
    try {
      if (typeof window === 'undefined') return;
      window.sessionStorage.setItem(TOUR_FORCE_KEY, id);
    } catch {
      // ignore
    }
  };

  const clearForcedTour = () => {
    try {
      if (typeof window === 'undefined') return;
      window.sessionStorage.removeItem(TOUR_FORCE_KEY);
    } catch {
      // ignore
    }
  };

  const queueOnboardingTourForTarget = (target) => {
    if (isMatchmakingApplyPath(target)) {
      clearForcedTour();
      return;
    }
    forceTour('onboarding-main');
  };

  const writeReferralCode = (value) => {
    try {
      const v = String(value || '').trim();
      if (v) sessionStorage.setItem(REFERRAL_CODE_KEY, v);
      else sessionStorage.removeItem(REFERRAL_CODE_KEY);
    } catch {
      // ignore
    }
  };

  const readReferralCode = () => {
    try {
      return String(sessionStorage.getItem(REFERRAL_CODE_KEY) || '').trim();
    } catch {
      return '';
    }
  };

  const clearReferralCode = () => writeReferralCode('');

  const isReferralEnabled = () => {
    const raw = String(import.meta?.env?.VITE_MATCHMAKING_REFERRAL_ENABLED || '').toLowerCase().trim();
    return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
  };

  const acceptReferralIfAny = async () => {
    const code = readReferralCode();
    if (!code) return;
    if (!isReferralEnabled()) return;

    try {
      const res = await authFetch('/api/matchmaking-referral-accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const status = String(res?.status || '').trim();
      if (status === 'accepted' || status === 'already_accepted') {
        clearReferralCode();
      }
    } catch (e) {
      const msg = String(e?.message || '').trim();
      if (
        msg === 'invalid_invite_code' ||
        msg === 'invite_code_not_found' ||
        msg === 'self_referral_not_allowed' ||
        msg === 'already_referred' ||
        msg === 'referral_disabled'
      ) {
        clearReferralCode();
      }
    }
  };

  const writeAuthIntent = (value) => {
    try {
      if (value) sessionStorage.setItem(AUTH_INTENT_KEY, String(value));
      else sessionStorage.removeItem(AUTH_INTENT_KEY);
    } catch {
      // ignore
    }
  };

  const readAuthIntent = () => {
    try {
      return String(sessionStorage.getItem(AUTH_INTENT_KEY) || '').trim();
    } catch {
      return '';
    }
  };

  const clearAuthIntent = () => writeAuthIntent('');

  const writeAuthProvider = (value) => {
    try {
      if (value) sessionStorage.setItem(AUTH_PROVIDER_KEY, String(value));
      else sessionStorage.removeItem(AUTH_PROVIDER_KEY);
    } catch {
      // ignore
    }
  };

  const readAuthProvider = () => {
    try {
      return String(sessionStorage.getItem(AUTH_PROVIDER_KEY) || '').trim();
    } catch {
      return '';
    }
  };

  const clearAuthProvider = () => writeAuthProvider('');

  const markJustSignedUp = () => {
    try {
      sessionStorage.setItem(JUST_SIGNED_UP_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const hasRecentJustSignedUp = () => {
    try {
      const raw = String(sessionStorage.getItem(JUST_SIGNED_UP_KEY) || '').trim();
      const atMs = Number(raw);
      if (!(Number.isFinite(atMs) && atMs > 0)) return false;
      const ageMs = Date.now() - atMs;
      return ageMs >= 0 && ageMs <= 15 * 60 * 1000;
    } catch {
      return false;
    }
  };

  const writeSignupProfile = (payload) => {
    try {
      if (!payload) {
        sessionStorage.removeItem(SIGNUP_PROFILE_KEY);
        return;
      }
      sessionStorage.setItem(SIGNUP_PROFILE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  };

  const readSignupProfile = () => {
    try {
      const raw = sessionStorage.getItem(SIGNUP_PROFILE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const clearSignupProfile = () => {
    try {
      sessionStorage.removeItem(SIGNUP_PROFILE_KEY);
    } catch {
      // ignore
    }
  };

  const writeStoredRedirect = () => {
    try {
      sessionStorage.setItem(
        'auth_redirect_target',
        JSON.stringify({
          from: sanitizePostAuthTarget(redirectTarget.from, '/profilim'),
          fromState: shouldIgnorePostAuthState(redirectTarget.from) ? null : redirectTarget.fromState || null,
        })
      );
    } catch {
      // ignore
    }
  };

  const readForcedTarget = () => {
    try {
      return sessionStorage.getItem('auth_force_target') || '';
    } catch {
      return '';
    }
  };

  const writeForcedTarget = (value) => {
    try {
      if (value) {
        sessionStorage.setItem('auth_force_target', value);
      } else {
        sessionStorage.removeItem('auth_force_target');
      }
    } catch {
      // ignore
    }
  };

  const clearStoredRedirect = () => {
    try {
      sessionStorage.removeItem('auth_redirect_target');
    } catch {
      // ignore
    }
  };

  const AUTO_GOOGLE_KEY = 'uniqah:auto_google_v1';

  const writeAutoGoogleFlag = (value) => {
    try {
      if (value) sessionStorage.setItem(AUTO_GOOGLE_KEY, '1');
      else sessionStorage.removeItem(AUTO_GOOGLE_KEY);
    } catch {
      // ignore
    }
  };

  const readAutoGoogleFlag = () => {
    try {
      return sessionStorage.getItem(AUTO_GOOGLE_KEY) === '1';
    } catch {
      return false;
    }
  };

  const clearAutoGoogleFlag = () => writeAutoGoogleFlag(false);

  const DEFAULT_EXISTING_USER_POST_AUTH_TARGET = '/profilim';

  const parseAuthMetadataTimeMs = (value) => {
    try {
      const ms = Date.parse(String(value || ''));
      return Number.isFinite(ms) ? ms : null;
    } catch {
      return null;
    }
  };

  const isLikelyFreshAuthCreation = (firebaseUser) => {
    try {
      const createdAtMs = parseAuthMetadataTimeMs(firebaseUser?.metadata?.creationTime);
      if (createdAtMs === null) return false;
      const ageMs = Date.now() - createdAtMs;
      return Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= 10 * 60 * 1000;
    } catch {
      return false;
    }
  };

  const shouldTreatAuthenticatedUserAsFreshSignup = (firebaseUser) => {
    if (!firebaseUser?.uid) return false;
    if (hasRecentJustSignedUp()) return true;

    const marker = readRedirectStartMarker();
    if (!marker) return false;

    return isLikelyFreshAuthCreation(firebaseUser);
  };

  const consumeAutoGoogleQueryParam = () => {
    try {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      if (String(url.searchParams.get('auto') || '').trim().toLowerCase() !== 'google') return;
      url.searchParams.delete('auto');
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, '', next);
    } catch {
      // ignore
    }
  };

  const resolvePostAuthTarget = (isNewUser, intent) => {
    const forced = readForcedTarget();
    if (forced) return forced;

    // Signup niyetiyle gelen kullanıcıları her durumda başvuru formuna al.
    // Böylece metadata/new-user tespiti şaşsa bile profil yerine zorunlu başvuru açılır.
    if (isFeatureEnabled('wedding') && (isNewUser || intent === 'signup')) return '/evlilik/eslestirme-basvuru?w=1';

    // Mevcut kullanıcılar login sonrası her zaman Profilim'e gider.
    return DEFAULT_EXISTING_USER_POST_AUTH_TARGET;
  };

  const resolvePostAuthState = () => {
    const stored = readStoredRedirect();
    return stored?.fromState || redirectTarget.fromState || null;
  };

  const resolveAuthenticatedUserExit = () => {
    const pending = readPendingPostAuthNav();
    const pendingTarget = String(pending?.target || '').trim();
    if (pendingTarget) {
      return {
        target: pendingTarget,
        state: pending?.state,
        usedPending: true,
      };
    }

    const freshSignup = shouldTreatAuthenticatedUserAsFreshSignup(user);
    const fallbackIntent = resolveRedirectAuthIntent(mode || 'login');
    return {
      target: resolvePostAuthTarget(freshSignup, freshSignup ? 'signup' : fallbackIntent),
      state: freshSignup ? null : resolvePostAuthState(),
      usedPending: false,
    };
  };

  // Not: 2026-02 ürün kararındaki "signup sonrası forma zorlamama" akışı geri alındı.

  const navigateNext = useCallback((target, state) => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    const finalTarget = sanitizePostAuthTarget(
      target || redirectTarget.from || DEFAULT_EXISTING_USER_POST_AUTH_TARGET,
      DEFAULT_EXISTING_USER_POST_AUTH_TARGET,
    );
    const finalState = typeof state === 'undefined' ? redirectTarget.fromState : state;
    navigate(finalTarget, { replace: true, state: finalState });
  }, [navigate, redirectTarget.from, redirectTarget.fromState]);

  const withTimeout = (promise, timeoutMs) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
  };

  const waitForRecentAuthUser = useCallback((timeoutMs = 4500) => {
    return new Promise((resolve) => {
      const existing = auth?.currentUser;
      if (existing?.uid) {
        resolve(existing);
        return;
      }

      let settled = false;
      let unsubscribe = () => {};
      const finish = (nextUser) => {
        if (settled) return;
        settled = true;
        try {
          unsubscribe();
        } catch {
          // ignore
        }
        resolve(nextUser?.uid ? nextUser : null);
      };

      const timerId = window.setTimeout(() => finish(auth?.currentUser || null), timeoutMs);
      unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        if (!nextUser?.uid) return;
        window.clearTimeout(timerId);
        finish(nextUser);
      }, () => {
        window.clearTimeout(timerId);
        finish(auth?.currentUser || null);
      });
    });
  }, []);

  const navigateNextWithApplyGuard = async (uid, target, state) => {
    let next = target;

    const weddingEnabled = isFeatureEnabled('wedding');
    if (weddingEnabled) {
      let completed = null;
      try {
        completed = await withTimeout(Promise.resolve(hasCompletedApplication(uid)), 8000);
      } catch (e) {
        completed = null;

        // Eğer bu kontrol ağ/Firestore sorunları nedeniyle patlarsa login akışını bloklamayalım.
        // Best-effort: support raporu (tek sefer) + guard'ı pas geç.
        if (!applyGuardReportOnceRef.current) {
          applyGuardReportOnceRef.current = true;
          const code = String(e?.code || '').trim();
          const message = String(e?.message || '').trim();
          try {
            storeSupportReport(
              buildSupportReport({
                kind: 'auth_apply_guard_failed',
                flow: 'post_auth',
                code: code || 'apply_guard_failed',
                message: message || 'apply_guard_failed',
                extra: {
                  uid: safeStr(uid),
                  target: safeStr(target),
                  timeout: message === 'timeout' ? '1' : '0',
                },
              })
            );
          } catch {
            // ignore
          }

          void reportAuthIssue({
            kind: 'auth_apply_guard_failed',
            flow: 'post_auth',
            code: code || (message === 'timeout' ? 'timeout' : 'unknown'),
            message,
            intent: mode,
          });
        }
      }

      // Başvuru sayfasına gitmek istiyor ama zaten tamamladıysa varsayılan hedefe al.
      if (completed === true && isMatchmakingApplyPath(next)) {
        next = DEFAULT_EXISTING_USER_POST_AUTH_TARGET;
        state = null;
      }

      // Profili eksikse çoğu yerde formu zorunlu aç,
      // ama Keşfet (pool) gibi "göster, etkileşimi kilitle" sayfalarına izin ver.
      if (completed === false && !isMatchmakingApplyPath(next)) {
        const pathOnly = normalizePathOnly(next);
        const allowIncomplete =
          pathOnly === '/app/pool' ||
          pathOnly === '/app/matches' ||
          pathOnly === '/profilim' ||
          pathOnly === '/eslestirme';
        if (!allowIncomplete) {
          next = '/evlilik/eslestirme-basvuru?w=1';
          state = null;
        }
      }
    }

    navigateNext(next, state);
  };

  const navigateWhenAuthReady = useCallback(async (expectedUid, target, state, { timeoutMs = 1800 } = {}) => {
    const readyUser = await waitForRecentAuthUser(timeoutMs);
    const readyUid = String(readyUser?.uid || auth?.currentUser?.uid || '').trim();
    const wantedUid = String(expectedUid || '').trim();

    if (!readyUid) return false;
    if (wantedUid && readyUid !== wantedUid) return false;

    await navigateNextWithApplyGuard(readyUid, target, state);
    clearPendingPostAuthNav();
    return true;
  }, [navigateNextWithApplyGuard, waitForRecentAuthUser]);

  const salvageRecentRedirectUser = useCallback(async ({ intent = 'login' } = {}) => {
    const recentUser = await waitForRecentAuthUser();
    if (!recentUser?.uid) return false;

    if (intent === 'signup') {
      try {
        await ensureProfileSaved(recentUser.uid, {});
      } catch {
        // ignore
      }
      try {
        await bootstrapMatchmakingApplication(recentUser, {});
      } catch {
        // ignore
      }
    }

    const target = resolvePostAuthTarget(false, intent);
    const state = intent === 'signup' ? null : resolvePostAuthState();
    writePendingPostAuthNav(target, state);
    clearStoredRedirect();
    writeForcedTarget('');
    await navigateNextWithApplyGuard(recentUser.uid, target, state);
    clearPendingPostAuthNav();
    return true;
  }, [navigateNextWithApplyGuard, waitForRecentAuthUser]);

  // Redirect/popup sonrası hedefe kesin yönlendirme.
  // Kritik: RequireAuth bounce'larını engellemek için AuthProvider loading=false + user geldiğinde çalıştır.
  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (authLoading) return;
    if (!user || user.isAnonymous) return;
    if (authFlowBusyRef.current) return;

    const pending = readPendingPostAuthNav();
    const pendingTarget = String(pending?.target || '').trim();
    if (!pendingTarget) return;

    (async () => {
      try {
        clearPendingPostAuthNav();
        // auth_intent artık yönlendirme için gerekmiyor; bayat kalıp loop yapmasın.
        try {
          clearAuthIntent();
        } catch {
          // ignore
        }
        await navigateNextWithApplyGuard(user?.uid, pendingTarget, pending?.state);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.uid]);
  const ensureProfileSaved = async (uid, profileOrAge) => {
    if (!uid) return { ok: false, skipped: true, reason: 'missing_uid' };

    const profile =
      typeof profileOrAge === 'number'
        ? { age: profileOrAge }
        : profileOrAge && typeof profileOrAge === 'object'
          ? profileOrAge
          : {};

    try {
      const data = await authFetch('/api/matchmaking-user-ensure', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          age: profile?.age,
          gender: profile?.gender,
          lookingForGender: profile?.lookingForGender,
        }),
      });
      if (data && data.ok) {
        return {
          ok: true,
          ensured: data.ensured !== false,
          created: data.created === true,
          via: 'server',
        };
      }
      return { ok: false, skipped: false, reason: 'server_error' };
    } catch (e) {
      return {
        ok: false,
        skipped: false,
        reason: String(e?.message || 'request_failed').trim() || 'request_failed',
      };
    }
  };

  const bootstrapMatchmakingApplication = async (userOrUid, profile) => {
    try {
      const uid = typeof userOrUid === 'string' ? userOrUid : String(userOrUid?.uid || '').trim();
      if (!uid) return { ok: false, skipped: true, reason: 'missing_uid' };

      // Token: mümkünse ilgili user objesinden; yoksa auth.currentUser'dan.
      const token =
        (typeof userOrUid?.getIdToken === 'function' ? await userOrUid.getIdToken() : '') ||
        (typeof auth?.currentUser?.getIdToken === 'function' ? await auth.currentUser.getIdToken() : '');
      if (!token) return { ok: false, skipped: true, reason: 'missing_token' };

      const res = await fetch('/api/matchmaking-application-bootstrap', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gender: profile?.gender,
          nationality: profile?.nationality,
          nationalityOther: profile?.nationalityOther,
          age: profile?.age,
          ageConfirmed: profile?.ageConfirmed === true,
        }),
        keepalive: true,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        return {
          ok: true,
          ensured: data.ensured !== false,
          created: data.created === true,
          reason: String(data?.reason || '').trim(),
          via: 'server',
        };
      }

      return {
        ok: false,
        skipped: false,
        reason: String(data?.error || '').trim() || `http_${res.status}`,
      };
    } catch (e) {
      return {
        ok: false,
        skipped: false,
        reason: String(e?.code || e?.message || 'request_failed').trim() || 'request_failed',
      };
    }
  };

  const traceSignupProvisioningEvent = (eventKey) => {
    const key = String(eventKey || '').trim();
    if (!key) return;
    try {
      void trackClick(key, { trace: true });
    } catch {
      // ignore
    }
  };

  const reportSignupProvisioningProfileError = (flowKey, errorLike, uid) => {
    const code = String(errorLike?.code || errorLike?.reason || '').trim() || 'profile_save_failed';

    traceSignupProvisioningEvent(`signup_error:${flowKey}:${code}`);

    storeSupportReport(
      buildSupportReport({
        kind: 'signup_profile_save_failed',
        flow: flowKey,
        code,
        message: String(errorLike?.message || errorLike?.error || '').trim(),
        extra: { uid: safeStr(uid) },
      })
    );
  };

  const finalizeSignupProvisioning = async ({ flowKey, userRef, profile } = {}) => {
    const flow = String(flowKey || '').trim();
    const uid = typeof userRef === 'string' ? userRef : String(userRef?.uid || '').trim();
    const nextProfile = profile && typeof profile === 'object' ? profile : {};

    let profileResult = { ok: false, skipped: true, reason: 'not_started' };
    try {
      profileResult = await ensureProfileSaved(uid, nextProfile);
      if (profileResult?.ok) {
        traceSignupProvisioningEvent(`signup_profile_ready:${flow}`);
        if (profileResult?.created) {
          traceSignupProvisioningEvent(`signup_profile_created:${flow}`);
        }
      }
    } catch (eProfile) {
      reportSignupProvisioningProfileError(flow, eProfile, uid);
    }

    try {
      await acceptReferralIfAny();
    } catch {
      // ignore
    }

    try {
      await applyQuickProfileAfterAuthIfAny(flow);
    } catch {
      // ignore
    }

    const bootstrapResult = await bootstrapMatchmakingApplication(userRef, nextProfile);
    if (bootstrapResult?.ok) {
      traceSignupProvisioningEvent(`signup_apply_bootstrap_ready:${flow}`);
      if (bootstrapResult?.created) {
        traceSignupProvisioningEvent(`signup_apply_bootstrap_created:${flow}`);
      }
    } else if (!bootstrapResult?.skipped) {
      traceSignupProvisioningEvent(`signup_apply_bootstrap_failed:${flow}`);
    }

    return { profileResult, bootstrapResult };
  };

  const syncedAuthIdentityUidRef = useRef('');
  useEffect(() => {
    if (authLoading) return;
    if (!redirectCheckDone) return;
    if (!user || user.isAnonymous || !user?.uid) return;
    if (syncedAuthIdentityUidRef.current === user.uid) return;

    syncedAuthIdentityUidRef.current = user.uid;
    void (async () => {
      try {
        await ensureProfileSaved(user.uid, {});
      } catch {
        // ignore
      }

      try {
        await bootstrapMatchmakingApplication(user, {});
      } catch {
        // ignore
      }
    })();
  }, [authLoading, redirectCheckDone, user?.uid, user?.isAnonymous]);

  const contextMessage = useMemo(() => {
    const from = redirectTarget.from || "/profilim";

    if (from === "/profilim") {
      return t("authPage.context.panel");
    }

    return t("authPage.context.generic");
  }, [redirectTarget.from, t]);

  const authTourSteps = useMemo(() => {
    const raw = t('authPage.tour.steps', { returnObjects: true });
    return Array.isArray(raw) ? raw : [];
  }, [t, i18n?.language]);

  const authTourCurrent = authTourSteps?.[authTour.step] || null;

  const openAuthTour = useCallback(() => {
    markLandingPrimaryAction();
    try {
      void trackClick('landing_tour_open');
    } catch {
      // ignore
    }
    setAuthTour({ open: true, step: 0 });
  }, [markLandingPrimaryAction]);

  const closeAuthTour = useCallback(() => {
    setAuthTour((current) => ({ ...current, open: false }));
  }, []);

  const goAuthTourStep = useCallback((delta) => {
    setAuthTour((current) => {
      const maxIndex = Math.max(0, authTourSteps.length - 1);
      const nextStep = Math.max(0, Math.min(maxIndex, current.step + delta));
      return { open: true, step: nextStep };
    });
  }, [authTourSteps.length]);

  const switchAuthMode = useCallback((nextMode) => {
    if (nextMode !== 'login' && nextMode !== 'signup') return;
    if (nextMode === mode) return;

    if (nextMode === 'signup') {
      tiktokTrack('SignupIntent', { source: 'login_switch' });
      void trackClick('auth_switch_to_signup');
    } else {
      void trackClick('auth_switch_to_login');
    }

    setMode(nextMode);
  }, [mode]);

  const jumpFromTourToAuth = useCallback((nextMode) => {
    closeAuthTour();
    switchAuthMode(nextMode);
  }, [closeAuthTour, switchAuthMode]);

  const lookupSignInMethodsForEmail = useCallback(async (rawEmail) => {
    const normalized = String(rawEmail || '').trim().toLowerCase();
    if (!normalized) return [];
    try {
      const methods = await fetchSignInMethodsForEmail(auth, normalized);
      return Array.isArray(methods) ? methods.filter(Boolean) : [];
    } catch {
      return [];
    }
  }, []);

  const signUpWithEmailOnServer = useCallback(async ({ email: rawEmail, password: rawPassword, profile }) => {
    const normalizedEmail = String(rawEmail || '').trim().toLowerCase();
    const password = typeof rawPassword === 'string' ? rawPassword : String(rawPassword ?? '');
    const displayName = String(
      profile?.displayName || profile?.fullName || profile?.firstName || profile?.name || ''
    ).trim();

    let response;
    try {
      response = await fetch('/api/public-email-signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          ...(displayName ? { displayName } : {}),
        }),
      });
    } catch {
      const err = new Error('auth/network-request-failed');
      err.code = 'auth/network-request-failed';
      throw err;
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || !data?.ok || !data?.customToken) {
      const apiError = String(data?.error || `request_failed_${response.status || 0}`);
      const errorCode = (() => {
        if (apiError === 'invalid_email') return 'auth/invalid-email';
        if (apiError === 'email_already_in_use') return 'auth/email-already-in-use';
        if (apiError === 'weak_password') return 'auth/weak-password';
        if (apiError === 'rate_limited') return 'auth/too-many-requests';
        if (apiError === 'signup_unavailable') return 'auth/internal-error';
        return 'auth/internal-error';
      })();

      const err = new Error(apiError);
      err.code = errorCode;
      err.details = data;
      throw err;
    }

    return signInWithCustomToken(auth, data.customToken);
  }, []);

  const signInWithEmailOnServer = useCallback(async ({ email: rawEmail, password: rawPassword }) => {
    const normalizedEmail = String(rawEmail || '').trim().toLowerCase();
    const password = typeof rawPassword === 'string' ? rawPassword : String(rawPassword ?? '');

    let response;
    try {
      response = await fetch('/api/public-email-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });
    } catch {
      const err = new Error('auth/network-request-failed');
      err.code = 'auth/network-request-failed';
      throw err;
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || !data?.ok || !data?.customToken) {
      const apiError = String(data?.error || `request_failed_${response.status || 0}`);
      const errorCode = (() => {
        if (apiError === 'invalid_credentials') return 'auth/invalid-credential';
        if (apiError === 'rate_limited') return 'auth/too-many-requests';
        if (apiError === 'user_disabled') return 'auth/user-disabled';
        if (apiError === 'login_unavailable') return 'auth/internal-error';
        return 'auth/internal-error';
      })();

      const err = new Error(apiError);
      err.code = errorCode;
      err.details = data;
      throw err;
    }

    return signInWithCustomToken(auth, data.customToken);
  }, []);

  const routeExistingAccountToLogin = useCallback(async (rawEmail) => {
    const normalized = String(rawEmail || '').trim().toLowerCase();
    if (normalized) setEmail(normalized);
    setPassword('');
    setConfirmPassword('');
    setEmailFallbackVisible(true);

    const methods = await lookupSignInMethodsForEmail(normalized);
    const hasGoogle = methods.includes('google.com');
    const hasPassword = methods.includes('password');

    switchAuthMode('login');
    setError('');
    setInfo(hasGoogle && !hasPassword ? t('authPage.infos.existingAccountUseGoogle') : t('authPage.infos.existingAccountSwitchedToLogin'));

    return methods;
  }, [lookupSignInMethodsForEmail, switchAuthMode, t]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const m = params.get("mode");
    if (m === "signup" || m === "login") {
      setMode(m);
    } else {
      const hasSignedUpBefore = readHasSignedUpBefore();
      if (hasSignedUpBefore) {
        setMode('login');
      } else {
      // Reklam tıklamasıyla gelen kullanıcılar çoğunlukla yeni olur.
      // Varsayılan "login" modunda Google ile giriş denediklerinde yeni kullanıcı akışı
      // (intent!=signup) daha fazla sürtünme yaratabiliyor. Bu yüzden ad-param gelirse
      // signup'ı varsayılan yap.
      const hasAdClickId =
        !!params.get('gclid') ||
        !!params.get('wbraid') ||
        !!params.get('gbraid') ||
        !!params.get('ttclid') ||
        !!params.get('fbclid') ||
        !!params.get('msclkid');
      if (hasAdClickId) {
        setMode('signup');
        try {
          void trackClick('landing_login_auto_signup');
        } catch {
          // ignore
        }
      } else {
        // İlk ziyaretçilerde (ve lokal işaret yoksa) signup'ı varsayılan yap.
        setMode('signup');
      }
      }
    }

    const ref = String(params.get('ref') || '').trim();
    if (ref) writeReferralCode(ref);

    const force = params.get("force");
    setForceLogin(force === "1");
  }, [location.search]);

  useEffect(() => {
    writeStoredRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectTarget.from, redirectTarget.fromState]);

  useEffect(() => {
    if (!forceLogin) return;
    if (user) return;

    // Kullanıcı daha önce giriş yapmış olsa bile, bu ekrandan "yeni giriş" istendi.
    setInfo(t("authPage.forceInfo"));

    // Login'e gelmeden hemen önce signOut tamamlanmamış olabilir; burada garanti altına al.
    signOut(auth).catch(() => {
      // ignore
    });
  }, [forceLogin, t, user]);

  const autoGoogleSignupRequested = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const rawMode = String(params.get('mode') || mode || '').toLowerCase();
      const auto = String(params.get('auto') || '').toLowerCase();
      return rawMode === 'signup' && auto === 'google';
    } catch {
      return false;
    }
  }, [location.search, mode]);

  const resolveRedirectAuthIntent = useCallback((fallback = 'login') => {
    const stored = readAuthIntent();
    if (stored === 'signup' || stored === 'login') return stored;

    try {
      const params = new URLSearchParams(location.search || '');
      const rawMode = String(params.get('mode') || mode || '').trim().toLowerCase();
      const auto = String(params.get('auto') || '').trim().toLowerCase();
      if (rawMode === 'signup') return 'signup';
      if (rawMode === 'login') return 'login';
      if (auto === 'google' || autoGoogleSignupRequested) return 'signup';
    } catch {
      // ignore
    }

    return fallback;
  }, [autoGoogleSignupRequested, location.search, mode]);

  useEffect(() => {
    if (redirectFinalizeOnceRef.current) return;
    redirectFinalizeOnceRef.current = true;

    let salvageStarted = false;
    let salvageCancelled = false;

    const parseTimeMs = (s) => {
      try {
        const ms = Date.parse(String(s || ''));
        return Number.isFinite(ms) ? ms : null;
      } catch {
        return null;
      }
    };

    const isLikelyNewUserByMetadata = (firebaseUser) => {
      try {
        const created = parseTimeMs(firebaseUser?.metadata?.creationTime);
        if (created === null) return false;
        const ageMs = Date.now() - created;
        return Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= 10 * 60 * 1000;
      } catch {
        return false;
      }
    };

    const tryGetRedirectResultWithTimeout = async (timeoutMs) => {
      const r = await Promise.race([
        Promise.resolve(getRedirectResult(auth)).then((result) => ({ timeout: false, result })),
        new Promise((resolve) => setTimeout(() => resolve({ timeout: true, result: null }), timeoutMs)),
      ]);
      return r;
    };

    const salvageRedirectAfterTimeout = async ({ providerLabel, initialIntent } = {}) => {
      if (salvageStarted) return;
      salvageStarted = true;

      // If the redirect result is just slow (not hung), retry a few times.
      const delays = import.meta.env.DEV ? [400, 900, 1400] : [700, 1500, 3000, 5500];

      for (const d of delays) {
        if (salvageCancelled) return;
        await new Promise((r) => setTimeout(r, d));
        if (salvageCancelled) return;

        try {
          const rr = await tryGetRedirectResultWithTimeout(import.meta.env.DEV ? 900 : 2500);
          if (rr?.timeout) continue;
          const result = rr?.result;
          if (result?.user) {
            // Let the main finalize logic handle it on the next tick by reloading state.
            // But since we are already inside the same effect, we can do a minimal finalize here.
            try {
              const info2 = getAdditionalUserInfo(result);
              const isNewUser = !!info2?.isNewUser;

              clearAutoGoogleFlag();
              clearAuthProvider();
              clearRedirectStartMarker();

              const intent = readAuthIntent() || initialIntent || 'login';
              clearAuthIntent();

              if (isNewUser) {
                markHasSignedUpBefore();
                const p = readSignupProfile() || {};
                clearSignupProfile();
                await trackClick(`signup_success:${providerLabel}_redirect`, { trace: true });
                markFunnelSignupCompleted(`${providerLabel}_redirect`);
                tiktokTrack('CompleteRegistration');
                queueOnboardingTourForTarget(resolvePostAuthTarget(true, 'signup'));
                await finalizeSignupProvisioning({
                  flowKey: `${providerLabel}_redirect`,
                  userRef: result?.user,
                  profile: p,
                });
                markJustSignedUp();
              } else {
                clearSignupProfile();
                try {
                  void trackClick(`signin_success:${providerLabel}_redirect`);
                } catch {
                  // ignore
                }
              }

              const target = resolvePostAuthTarget(isNewUser, isNewUser ? 'signup' : intent);
              const state = isNewUser ? null : resolvePostAuthState();
              writePendingPostAuthNav(target, state);
              clearStoredRedirect();
              writeForcedTarget('');
              try {
                await navigateWhenAuthReady(result?.user?.uid, target, state, { timeoutMs: 2200 });
              } catch {
                // ignore
              }
            } catch {
              // If this fails, fall back to auth.currentUser salvage below.
            }
            return;
          }
        } catch {
          // ignore and keep retrying
        }
      }

      // Hard salvage: getRedirectResult appears hung. If Firebase Auth state is already set,
      // complete the flow based on currentUser + a conservative new-user heuristic.
      try {
        const u = auth?.currentUser;
        if (!u || !u.uid) return;

        const marker = readRedirectStartMarker();
        const intent = readAuthIntent() || initialIntent || marker?.intent || 'login';

        const isNewUser = intent === 'signup' ? true : isLikelyNewUserByMetadata(u);

        clearAutoGoogleFlag();
        clearAuthProvider();
        clearRedirectStartMarker();
        clearAuthIntent();

        if (isNewUser) {
          markHasSignedUpBefore();
          const p = readSignupProfile() || {};
          clearSignupProfile();
          await trackClick(`signup_success:${providerLabel}_redirect`, { trace: true });
          markFunnelSignupCompleted(`${providerLabel}_redirect`);
          tiktokTrack('CompleteRegistration');
          queueOnboardingTourForTarget(resolvePostAuthTarget(true, 'signup'));
          await finalizeSignupProvisioning({
            flowKey: `${providerLabel}_redirect`,
            userRef: u,
            profile: p,
          });
          markJustSignedUp();
        } else {
          clearSignupProfile();
          try {
            void trackClick(`signin_success:${providerLabel}_redirect`);
          } catch {
            // ignore
          }
        }

        const target = resolvePostAuthTarget(isNewUser, isNewUser ? 'signup' : intent);
        const state = isNewUser ? null : resolvePostAuthState();
        writePendingPostAuthNav(target, state);
        clearStoredRedirect();
        writeForcedTarget('');
        try {
          await navigateWhenAuthReady(u?.uid, target, state, { timeoutMs: 2200 });
        } catch {
          // ignore
        }

        try {
          void trackClick(`auth_redirect_salvaged:${providerLabel}`, { trace: true });
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
    };

    let isActive = true;

    const finalizeRedirect = async () => {
      authFlowBusyRef.current = true;
      const provider = readAuthProvider() || 'google';
      const providerLabel = provider === 'google' ? 'google' : 'google';
      try {
        const shouldSkipInitialRedirectProbe =
          autoGoogleSignupRequested &&
          !readRedirectStartMarker() &&
          !readAuthProvider() &&
          !auth?.currentUser?.uid;

        if (shouldSkipInitialRedirectProbe) {
          return;
        }

        const r = await tryGetRedirectResultWithTimeout(import.meta.env.DEV ? 1500 : 8000);

        // Bazı in-app tarayıcılarda getRedirectResult hiç resolve olmayabiliyor.
        // Timeout durumunda sessizce devam edip diğer effect'lerin yönlendirmesine izin veriyoruz.
        if (r?.timeout) {
          const intent = resolveRedirectAuthIntent('login');
          try {
            void trackClick(`${intent}_redirect_result_timeout:${providerLabel}`, { trace: true });
          } catch {
            // ignore
          }
          clearAutoGoogleFlag();
          try {
            const quickUser = await waitForRecentAuthUser(import.meta.env.DEV ? 400 : 1400);
            if (quickUser?.uid) {
              const salvaged = await salvageRecentRedirectUser({ intent });
              if (salvaged) return;
            }
          } catch {
            // ignore
          }
          // IMPORTANT: In some environments, redirect actually succeeds but getRedirectResult hangs.
          // If we don't salvage, we lose signups and skip onboarding/bootstrap.
          void salvageRedirectAfterTimeout({ providerLabel, initialIntent: intent });
          return;
        }

        const result = r?.result;
        if (result?.user && isActive) {
          clearAutoGoogleFlag();
          clearAuthProvider();
          clearRedirectStartMarker();

          const info2 = getAdditionalUserInfo(result);
          const isNewUser = !!info2?.isNewUser;

          // CTA-driven auto signup (/login?mode=signup&auto=google): after redirect,
          // mevcut kullanıcıları da tutarlı biçimde Profilim'e indir.
          try {
            const params = new URLSearchParams(location.search || '');
            const isAutoGoogle = String(params.get('auto') || '').toLowerCase() === 'google' || readAutoGoogleFlag();
            if (isAutoGoogle) {
              sessionStorage.setItem('uniqah:last_auth_new_user_v1', isNewUser ? '1' : '0');
              if (!isNewUser) {
                // Force post-auth target for existing users.
                writeForcedTarget(DEFAULT_EXISTING_USER_POST_AUTH_TARGET);
              }
            }
          } catch {
            // ignore
          }

          // Redirect akışında sayfa yenilendiği için mode kaybolabilir.
          // Bu yüzden intent'i (login/signup) sessionStorage üzerinden okuyoruz.
          const intent = resolveRedirectAuthIntent('login');
          clearAuthIntent();

          if (!isNewUser) {
            try {
              void trackClick(`signin_success:${providerLabel}_redirect`);
            } catch {
              // ignore
            }
          }

          // Dönüşüm hedefi: Google ile ilk girişte (yeni kullanıcı) login/signup niyetinden bağımsız
          // akışı bloklama; kullanıcıyı profil ekranına alıp formu orada tamamlat.
          if (isNewUser && intent !== 'signup') {
            try {
              void trackClick(`signup_auto:${providerLabel}_redirect_from_login_intent`);
            } catch {
              // ignore
            }
          }

          if (isNewUser) {
            markHasSignedUpBefore();
            const p = readSignupProfile() || {};
            clearSignupProfile();

            // Account created: count this as signup success even if profile save fails.
            await trackClick(`signup_success:${providerLabel}_redirect`, { trace: true });
            markFunnelSignupCompleted(`${providerLabel}_redirect`);
            try {
              if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
                window.gtag('event', 'sign_up', { method: `${providerLabel}_redirect` });
              }
            } catch {
              // ignore
            }
            tiktokTrack('CompleteRegistration');

            // Kayıt sonrası onboarding turunu tetikle (formu zorunlu açma).
            queueOnboardingTourForTarget(resolvePostAuthTarget(true, 'signup'));

            await finalizeSignupProvisioning({
              flowKey: `${providerLabel}_redirect`,
              userRef: result?.user,
              profile: p,
            });

            // Redirect sonrası varsayılan app hedefine geldikten sonra formu otomatik açma.
            markJustSignedUp();
          } else {
            clearSignupProfile();
          }

          // Redirect dönüşünde hedefi sakla: effect'ler kesin yönlendirsin.
          const target = resolvePostAuthTarget(isNewUser, isNewUser ? 'signup' : intent);
          const state = isNewUser ? null : resolvePostAuthState();
          writePendingPostAuthNav(target, state);
          clearStoredRedirect();
          writeForcedTarget('');
          // Kritik: Redirect sonucu geldiğinde elimizde user varken hemen yönlendir.
          // Bu, AuthProvider timing kaynaklı login'e geri düşme sorunlarını engeller.
          try {
            await navigateWhenAuthReady(result?.user?.uid, target, state, { timeoutMs: 2200 });
          } catch {
            // Best-effort; fallback effect pending target'ı kullanır.
          }
        } else if (isActive) {
          // If we know a redirect was started recently but we got no result, surface a useful error
          // and store a support report for diagnosis (host mismatch, storage restrictions, etc.).
          const marker = readRedirectStartMarker();
          if (marker) {
            const intent = resolveRedirectAuthIntent('login');
            try {
              const salvaged = await salvageRecentRedirectUser({ intent });
              if (salvaged) {
                clearAutoGoogleFlag();
                clearAuthProvider();
                clearRedirectStartMarker();
                clearAuthIntent();
                return;
              }
            } catch {
              // fall through to visible error path
            }

            clearAutoGoogleFlag();
            clearRedirectStartMarker();

            try {
              void trackClick(`auth_redirect_no_result:${providerLabel}`, { trace: true });
            } catch {
              // ignore
            }

            try {
              const hostNow = (() => {
                try {
                  return String(window.location?.hostname || '');
                } catch {
                  return '';
                }
              })();

              storeSupportReport(
                buildSupportReport({
                  kind: 'auth_redirect_no_result',
                  flow: `${providerLabel}_redirect`,
                  code: 'redirect_result_null',
                  message: 'getRedirectResult returned null after redirect start',
                  extra: {
                    marker,
                    hostNow,
                    pathNow: (() => {
                      try {
                        return String(window.location?.pathname || '');
                      } catch {
                        return '';
                      }
                    })(),
                    searchNow: (() => {
                      try {
                        return String(window.location?.search || '');
                      } catch {
                        return '';
                      }
                    })(),
                    currentUserUid: safeStr(auth?.currentUser?.uid),
                  },
                })
              );
            } catch {
              // ignore
            }

            try {
              setEmailFallbackVisible(true);
              setError(t('authPage.errors.googleRedirectNoResult'));
            } catch {
              // ignore
            }
          }
        }
      } catch (e) {
        const code = String(e?.code || '').trim();
        const msg = String(e?.message || '').trim();
        clearAutoGoogleFlag();
        setEmailFallbackVisible(true);

        // Redirect flow'da hata olursa eskiden tamamen yutuluyordu.
        // Bu da “kayıt olmuyorlar ama sebep göremiyoruz” sorununa yol açıyor.
        const intent = resolveRedirectAuthIntent('login');

        if (intent === 'signup') {
          void trackClick(`signup_error:${providerLabel}_redirect:${code || 'unknown'}`, { trace: true });
        } else {
          void trackClick(`login_error:${providerLabel}_redirect:${code || 'unknown'}`, { trace: true });
        }

        void reportAuthIssue({
          kind: 'auth_redirect_result_failed',
          flow: `${providerLabel}_redirect`,
          code: code || 'unknown',
          message: msg,
          intent,
        });

        if (code === 'auth/unauthorized-domain') {
          const host = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
          setError(
            t('authPage.errors.googleUnauthorizedDomain', {
              host: host || t('authPage.errors.domainNotFound'),
            })
          );
          return;
        }

        if (code === 'auth/account-exists-with-different-credential') {
          await routeExistingAccountToLogin(String(err?.customData?.email || email || '').trim().toLowerCase());
          setError(t('authPage.errors.accountExistsWithDifferentCredential'));
          return;
        }

        if (code === 'auth/operation-not-allowed') {
          setError(t('authPage.errors.googleOperationNotAllowed'));
          return;
        }

        if (code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found') {
          setError(t('authPage.errors.firebaseAuthInvalidConfig'));
          return;
        }

        if (code === 'auth/network-request-failed') {
          setError(t('authPage.errors.networkFailed'));
          return;
        }

        if (code === 'auth/internal-error') {
          const isInAppBrowser = !!getGoogleInAppBrowserHint();

          // Firebase Auth sometimes loads https://apis.google.com/js/api.js during Google sign-in.
          // In some in-app browsers this can fail in opaque ways; fail open with email fallback.
          if (providerLabel === 'google' && isInAppBrowser) {
            showGoogleInAppFallback();
            return;
          }
        }

        if (intent === 'signup') {
          setError(t('authPage.errors.googleFailed'));
        }
      } finally {
        authFlowBusyRef.current = false;
        if (isActive) setRedirectCheckDone(true);
      }
    };

    finalizeRedirect();
    return () => {
      isActive = false;
      salvageCancelled = true;
    };
  // Redirect finalizer is intentionally one-shot; ref guards keep it idempotent while
  // allowing the latest closures during the first mount after the redirect round-trip.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigateNext, autoGoogleSignupRequested, navigateWhenAuthReady, resolveRedirectAuthIntent, salvageRecentRedirectUser, waitForRecentAuthUser]);

  useEffect(() => {
    auth.languageCode = resolveAuthLanguage(i18n?.language);
  }, [i18n?.language]);

  useEffect(() => {
    if (hasNavigatedRef.current) return;
    // Redirect sonucu kontrolü bitmeden (getRedirectResult) email login akışı da bekleyebiliyordu.
    // Bu kontrol bittiğinde tekrar çalışıp kesin yönlendirelim.
    if (!redirectCheckDone) return;
    if (!quickProfileCheckDone) return;
    if (needsQuickProfile) return;
    if (user) {
      (async () => {
        try {
          // Kullanıcı zaten login olmuşsa (mevcut session), URL'deki `mode=signup`
          // onu "yeni kullanıcı" gibi değerlendirmemeli. Aksi halde CTA'lar kullanıcıyı
          // signup ekranını göstermeden direkt başvuru formuna itebiliyor.
          const pending = readPendingPostAuthNav();
          const freshSignup = shouldTreatAuthenticatedUserAsFreshSignup(user);
          const fallbackIntent = resolveRedirectAuthIntent(mode || 'login');
          const target = String(pending?.target || '').trim() || resolvePostAuthTarget(freshSignup, freshSignup ? 'signup' : fallbackIntent);
          const state = pending ? pending.state : freshSignup ? null : resolvePostAuthState();
          clearPendingPostAuthNav();
          clearStoredRedirect();
          writeForcedTarget('');
          await navigateNextWithApplyGuard(user?.uid, target, state);
        } catch {
          // navigateNextWithApplyGuard zaten kendi içinde best-effort; burada sadece sessiz kal.
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, redirectCheckDone, mode, needsQuickProfile, quickProfileCheckDone, resolveRedirectAuthIntent]);

  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (authLoading) return;
    if (!user || user.isAnonymous) return;
    if (authFlowBusyRef.current) return;
    if (needsQuickProfile) return;
    if (location.pathname !== '/login') return;

    const delayMs = redirectCheckDone && quickProfileCheckDone ? 1200 : 2500;
    const timeoutId = window.setTimeout(() => {
      if (hasNavigatedRef.current) return;

      const exit = resolveAuthenticatedUserExit();
      const target = String(exit?.target || '').trim();
      if (!target) return;

      (async () => {
        try {
          await navigateNextWithApplyGuard(user?.uid, target, exit?.state);
          if (exit?.usedPending) clearPendingPostAuthNav();
        } catch {
          try {
            window.location.replace(target);
          } catch {
            // ignore
          }
        }
      })();
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.uid, user?.isAnonymous, needsQuickProfile, location.pathname, redirectCheckDone, quickProfileCheckDone, mode]);

  // CTA-driven signup: /login?mode=signup&auto=google
  // Auto-start Google auth once, after redirect-result check is done.
  // NOTE: Must stay above any early-return branches to keep hook order stable.
  const autoGoogleOnceRef = useRef(false);

  useEffect(() => {
    try {
      if (autoGoogleOnceRef.current) return;
      if (!redirectCheckDone) return;
      if (authFlowBusyRef.current) return;
      if (busy) return;
      if (user) return;
      if (!autoGoogleSignupRequested) return;

      const isInAppBrowser = !!getGoogleInAppBrowserHint();

      // Safety: do NOT auto-trigger Google auth inside in-app browsers.
      // Keep the user on the page so they can pick email fallback or open in a real browser.
      if (isInAppBrowser) {
        autoGoogleOnceRef.current = true;
        setEmailFallbackVisible(true);
        setInfo(t('authPage.infos.googleInAppHelp'));
        consumeAutoGoogleQueryParam();
        try {
          void trackClick('signup_auto_skipped:inapp');
        } catch {
          // ignore
        }
        return;
      }

      autoGoogleOnceRef.current = true;
      consumeAutoGoogleQueryParam();
      // Best-effort: start Google flow immediately.
      void handleGoogle();
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectCheckDone, user, busy, isTrOrIdTraffic, autoGoogleSignupRequested]);

  if (autoGoogleSignupRequested && !redirectCheckDone && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/40">
        <Navigation />
        <section className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('authPage.googleSignupCta')}</h1>
            <p className="text-sm text-gray-600 mt-2">{t('authPage.redirecting')}</p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (user && !needsQuickProfile) {
    // Kullanıcı login olduysa bu sayfada form göstermeyelim.
    // Önceden `return null` yapıyordu; yönlendirme async gecikince beyaz ekran oluşuyordu.
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/40">
        <Navigation />
        <section className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('authPage.redirectScreen.title')}</h1>
            <p className="text-sm text-gray-600 mt-2">
              {t('authPage.redirectScreen.body')}
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const exit = resolveAuthenticatedUserExit();
                  const target = String(exit?.target || '').trim() || DEFAULT_EXISTING_USER_POST_AUTH_TARGET;
                  navigate(target, { replace: true, state: exit?.state ?? null });
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600"
              >
                {t('authPage.redirectScreen.goProfile')}
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    window.location.reload();
                  } catch {
                    // ignore
                  }
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50"
              >
                {t('authPage.redirectScreen.refresh')}
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const finalizeGoogleAuthSuccess = async ({ result, flowKey = 'google', intent = mode } = {}) => {
    const authResult = result && typeof result === 'object' ? result : null;
    const userRef = authResult?.user;
    if (!userRef?.uid) throw new Error('google_auth_missing_user');

    const info2 = getAdditionalUserInfo(authResult);
    const isNewUser = !!info2?.isNewUser;

    clearAutoGoogleFlag();
    clearAuthProvider();
    clearRedirectStartMarker();
    clearAuthIntent();

    if (isNewUser) {
      markHasSignedUpBefore();
      const p = readSignupProfile() || {};
      clearSignupProfile();

      await trackClick('signup_success:google', { trace: true });
      if (flowKey !== 'google') {
        try {
          await trackClick(`signup_success:${flowKey}`, { trace: true });
        } catch {
          // ignore
        }
      }

      markFunnelSignupCompleted(flowKey);
      try {
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', 'sign_up', { method: flowKey });
        }
      } catch {
        // ignore
      }
      tiktokTrack('CompleteRegistration');
      queueOnboardingTourForTarget(resolvePostAuthTarget(true, 'signup'));

      await finalizeSignupProvisioning({
        flowKey,
        userRef,
        profile: p,
      });

      markJustSignedUp();
    } else {
      clearSignupProfile();
      try {
        void trackClick('signin_success:google');
        if (flowKey !== 'google') {
          void trackClick(`signin_success:${flowKey}`);
        }
      } catch {
        // ignore
      }
    }

    const target = resolvePostAuthTarget(isNewUser, isNewUser ? 'signup' : intent);
    const state = isNewUser ? null : resolvePostAuthState();

    writePendingPostAuthNav(target, state);
    clearStoredRedirect();
    writeForcedTarget('');

    try {
      await navigateWhenAuthReady(userRef?.uid, target, state, { timeoutMs: 1800 });
    } catch {
      // Best-effort; generic auth effect can still consume pending target.
    }

    return { isNewUser, target };
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError('');
    setInfo('');
    authFlowBusyRef.current = true;
    trackLandingPrimaryCtaImpression();
    markLandingPrimaryAction();
    let redirectStarted = false;

    // UI signal: confirm the click handler executed.
    try {
      setInfo(t('authPage.infos.startingGoogle') || t('authPage.redirecting'));
    } catch {
      // ignore
    }

    const LAST_AUTH_NEW_USER_KEY = 'uniqah:last_auth_new_user_v1';

    const isAutoGoogle = (() => {
      try {
        const params = new URLSearchParams(location.search || '');
        return String(params.get('auto') || '').toLowerCase() === 'google' || readAutoGoogleFlag();
      } catch {
        return readAutoGoogleFlag();
      }
    })();

    try {
      clearSignupProfile();

      const provider = new GoogleAuthProvider();
      configureGoogleProviderLocale(provider);

      const inAppBrowserHint = getGoogleInAppBrowserHint();
      const isTikTokInApp = inAppBrowserHint === 'tiktok';
      const isOtherInApp = !!inAppBrowserHint && !isTikTokInApp;

      const isMiuiOrLite = (() => {
        try {
          const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
          return /miuibrowser|lite\s*browser/i.test(ua);
        } catch {
          return false;
        }
      })();

      const isIOS = (() => {
        try {
          const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
          return /iphone|ipad|ipod/i.test(ua);
        } catch {
          return false;
        }
      })();

      const isAndroid = (() => {
        try {
          const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
          return /android/i.test(ua);
        } catch {
          return false;
        }
      })();

      const isInAppBrowser = isTikTokInApp || isOtherInApp;

      writeGoogleDecisionDebug({
        intent: String(mode || ''),
        isAutoGoogle: isAutoGoogle ? '1' : '0',
        forcedTransport: 'redirect_only',
        isTikTokInApp: isTikTokInApp ? '1' : '0',
        isOtherInApp: isOtherInApp ? '1' : '0',
        isMiuiOrLite: isMiuiOrLite ? '1' : '0',
        isIOS: isIOS ? '1' : '0',
        isAndroid: isAndroid ? '1' : '0',
        trafficCountryHint: trafficCountryHint || '',
        willRedirect: '1',
        ua: (() => {
          try {
            return String(navigator.userAgent || '').slice(0, 220);
          } catch {
            return '';
          }
        })(),
      });

      if (isInAppBrowser) {
        try {
          void trackClick(mode === 'signup' ? 'signup_blocked:google_inapp' : 'login_blocked:google_inapp');
        } catch {
          // ignore
        }
        openAuthInExternalBrowser();
        showGoogleInAppFallback();
        return;
      }

      if (isAutoGoogle) {
        writeAutoGoogleFlag(true);
        try {
          void trackClick('signup_auto_trigger:google');
        } catch {
          // ignore
        }
      }

      if (!isAutoGoogle && !isInAppBrowser) {
        try {
          if (mode === 'signup') {
            void trackClick('signup_popup_start:google');
          } else {
            void trackClick('login_popup_start:google');
          }
        } catch {
          // ignore
        }

        try {
          const popupResult = await signInWithPopup(auth, provider);
          await finalizeGoogleAuthSuccess({
            result: popupResult,
            flowKey: 'google_popup',
            intent: mode,
          });
          return;
        } catch (popupError) {
          const popupCode = String(popupError?.code || '').trim();
          const popupMessage = String(popupError?.message || '').trim();
          setEmailFallbackVisible(true);

          if (
            popupCode === 'auth/popup-blocked' ||
            popupCode === 'auth/cancelled-popup-request' ||
            popupCode === 'auth/operation-not-supported-in-this-environment' ||
            popupCode === 'auth/web-storage-unsupported'
          ) {
            try {
              void trackClick(
                mode === 'signup' ? 'signup_popup_fallback_to_redirect:google' : 'login_popup_fallback_to_redirect:google',
                { trace: true }
              );
            } catch {
              // ignore
            }

            writeAuthIntent(mode);
            writeForcedTarget('');
            redirectStarted = true;
            startGoogleRedirect(provider, { flow: 'google_popup_fallback_redirect_start' });
            return;
          }

          if (popupCode === 'auth/popup-closed-by-user' || popupCode === 'auth/user-cancelled') {
            setError(t('authPage.errors.googlePopupClosed'));
            return;
          }

          if (popupCode === 'auth/account-exists-with-different-credential') {
            await routeExistingAccountToLogin(String(popupError?.customData?.email || email || '').trim().toLowerCase());
            setError(t('authPage.errors.accountExistsWithDifferentCredential'));
            return;
          }

          if (popupCode === 'auth/unauthorized-domain') {
            const host = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
            setError(
              t('authPage.errors.googleUnauthorizedDomain', {
                host: host || t('authPage.errors.domainNotFound'),
              })
            );
            return;
          }

          if (popupCode === 'auth/operation-not-allowed') {
            setError(t('authPage.errors.googleOperationNotAllowed'));
            return;
          }

          if (popupCode === 'auth/invalid-api-key' || popupCode === 'auth/configuration-not-found') {
            setError(t('authPage.errors.firebaseAuthInvalidConfig'));
            return;
          }

          if (popupCode === 'auth/network-request-failed') {
            setError(t('authPage.errors.networkFailed'));
            return;
          }

          void reportAuthIssue({
            kind: 'auth_google_popup_failed',
            flow: 'google_popup',
            code: popupCode || 'unknown',
            message: popupMessage,
            intent: mode,
          });

          setError(popupMessage || t('authPage.errors.googleFailed'));
          return;
        }
      }

      // Önemli: Popup/redirect tarayıcı tarafından "user gesture" ister.
      // Bu yüzden signIn çağrısından ÖNCE await etmiyoruz.
      if (mode === 'signup') {
        tiktokTrack('SignupStart', { method: 'google', source: 'login' });
        try {
          void trackClick('signup_start:google');
        } catch {
          // ignore
        }
      } else {
        try {
          void trackClick('signin_start:google');
        } catch {
          // ignore
        }
      }

      writeAuthIntent(mode);
      writeForcedTarget('');
      try {
        setInfo(t('authPage.redirecting'));
      } catch {
        // ignore
      }
      redirectStarted = true;
      startGoogleRedirect(provider, { flow: isAutoGoogle ? 'google_auto_redirect_start' : 'google_redirect_start' });
      return;
    } catch (e) {
      const code = String(e?.code || '').trim();
      const msg = String(e?.message || '').trim();
      setEmailFallbackVisible(true);

      writeGoogleDecisionDebug({
        lastErrorCode: code || 'unknown',
        lastErrorMessage: msg ? msg.slice(0, 220) : '',
      });

      if (mode === 'signup') {
        void trackClick(`signup_error:google_redirect_prep:${code || 'unknown'}`, { trace: true });
      } else {
        void trackClick(`login_error:google_redirect_prep:${code || 'unknown'}`, { trace: true });
      }

      if (
        code === 'auth/operation-not-supported-in-this-environment' ||
        code === 'auth/web-storage-unsupported'
      ) {
        try {
          const provider2 = new GoogleAuthProvider();
          configureGoogleProviderLocale(provider2);
          writeForcedTarget('');
          writeAuthIntent(mode);
          try {
            if (mode === 'signup') {
              void trackClick('signup_redirect_retry:google', { trace: true });
            } else {
              void trackClick('login_redirect_retry:google', { trace: true });
            }
          } catch {
            // ignore
          }
          redirectStarted = true;
          startGoogleRedirect(provider2, { flow: 'google_environment_redirect_start' });
          return;
        } catch (e2) {
          const host = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
          setError(
            e2?.message ||
              t('authPage.errors.googleFailedDev', {
                code: code || 'unknown',
                host: host || t('authPage.errors.domainNotFound'),
              })
          );
          return;
        }
      }

      if (code === 'auth/argument-error') {
        setError(t('authPage.errors.googleFailed'));
        return;
      }

      if (code === 'auth/account-exists-with-different-credential') {
        await routeExistingAccountToLogin(String(e?.customData?.email || email || '').trim().toLowerCase());
        setError(t('authPage.errors.accountExistsWithDifferentCredential'));
        return;
      }

      if (code === 'auth/unauthorized-domain') {
        void reportAuthIssue({ kind: 'auth_google_unauthorized_domain', flow: 'google_redirect_prep', code, message: msg, intent: mode });
        const host = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
        setError(
          t('authPage.errors.googleUnauthorizedDomain', {
            host: host || t('authPage.errors.domainNotFound'),
          })
        );
        return;
      }

      if (code === 'auth/operation-not-allowed') {
        void reportAuthIssue({ kind: 'auth_google_operation_not_allowed', flow: 'google_redirect_prep', code, message: msg, intent: mode });
        setError(t('authPage.errors.googleOperationNotAllowed'));
        return;
      }

      if (code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found') {
        void reportAuthIssue({ kind: 'auth_invalid_firebase_config', flow: 'google_redirect_prep', code, message: msg, intent: mode });
        setError(t('authPage.errors.firebaseAuthInvalidConfig'));
        return;
      }

      if (code === 'auth/too-many-requests') {
        setError(t('authPage.errors.rateLimited'));
        return;
      }

      if (code === 'auth/internal-error') {
        const isInAppBrowser = !!getGoogleInAppBrowserHint();

        if (isInAppBrowser) {
          showGoogleInAppFallback();
          return;
        }
      }

      if (code === 'auth/network-request-failed') {
        setError(t('authPage.errors.networkFailed'));
        return;
      }

      setError(msg || t('authPage.errors.googleFailed'));
    } finally {
      if (!redirectStarted) clearAutoGoogleFlag();
      authFlowBusyRef.current = false;
      setBusy(false);
    }
  };

  const handleEmailPassword = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    authFlowBusyRef.current = true;
    markLandingPrimaryAction();

    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const pass = String(password || '');
      const pass2 = String(confirmPassword || '');

      if (!normalizedEmail || !pass) {
        setError(t('authPage.errors.emailPasswordRequired'));
        return;
      }

      writeAuthIntent(mode);
      writeForcedTarget('');

      const isSignupMode = mode === 'signup';
      const optimisticTarget = resolvePostAuthTarget(isSignupMode, isSignupMode ? 'signup' : 'login');
      const optimisticState = isSignupMode ? null : resolvePostAuthState();

      // Email/password auth updates Firebase user state immediately. Persist the intended
      // post-auth target before the auth call so the generic authenticated-user effect
      // cannot race and send fresh signups to Profilim.
      writePendingPostAuthNav(optimisticTarget, optimisticState);

      if (mode === 'signup') {
        if (pass !== pass2) {
          clearPendingPostAuthNav();
          setError(t('authPage.errors.passwordsDoNotMatch'));
          return;
        }

        void trackClick('signup_start:email');
        const signupProfile = readSignupProfile() || {};
        const cred = await signUpWithEmailOnServer({
          email: normalizedEmail,
          password: pass,
          profile: signupProfile,
        });
        markHasSignedUpBefore();
        clearSignupProfile();

        try {
          await trackClick('signup_success:email', { trace: true });
          markFunnelSignupCompleted('email');
        } catch {
          // ignore
        }
        tiktokTrack('CompleteRegistration');
        queueOnboardingTourForTarget(resolvePostAuthTarget(true, 'signup'));
        await finalizeSignupProvisioning({
          flowKey: 'email',
          userRef: cred?.user,
          profile: signupProfile,
        });
        markJustSignedUp();

        // E-posta ile kayıt sonrası yeni kullanıcıyı başvuru formuna gönder.
        try {
          const target = optimisticTarget;
          const state = optimisticState;
          clearStoredRedirect();
          try {
            await navigateNextWithApplyGuard(cred?.user?.uid, target, state);
            clearPendingPostAuthNav();
          } catch {
            // ignore
          }
        } catch {
          // ignore
        }
      } else {
        void trackClick('signin_start:email');
        await signInWithEmailOnServer({ email: normalizedEmail, password: pass });

        try {
          void trackClick('signin_success:email', { trace: true });
        } catch {
          // ignore
        }

        // E-posta ile giriş sonrası mevcut kullanıcıyı varsayılan app hedefine yönlendir.
        try {
          const target = optimisticTarget;
          const state = optimisticState;
          clearStoredRedirect();
          try {
            await navigateNextWithApplyGuard(auth?.currentUser?.uid, target, state);
            clearPendingPostAuthNav();
          } catch {
            // ignore
          }
        } catch {
          // ignore
        }
      }
    } catch (e2) {
      const code = String(e2?.code || '').trim();
      const msg = String(e2?.message || '').trim();

      clearPendingPostAuthNav();

      if (code === 'auth/invalid-email') {
        setError(t('authPage.errors.invalidEmail'));
        return;
      }

      if (code === 'auth/email-already-in-use') {
        await routeExistingAccountToLogin(String(email || '').trim().toLowerCase());
        return;
      }

      if (code === 'auth/weak-password') {
        setError(t('authPage.errors.weakPassword'));
        return;
      }

      if (code === 'auth/too-many-requests') {
        setError(t('authPage.errors.rateLimited'));
        return;
      }

      if (code === 'auth/network-request-failed') {
        setError(t('authPage.errors.networkFailed'));
        return;
      }

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        const methods = await lookupSignInMethodsForEmail(String(email || '').trim().toLowerCase());
        const hasGoogle = methods.includes('google.com');
        const hasPassword = methods.includes('password');

        if (hasGoogle && !hasPassword) {
          switchAuthMode('login');
          setEmailFallbackVisible(true);
          setPassword('');
          setConfirmPassword('');
          setError('');
          setInfo(t('authPage.infos.existingAccountUseGoogle'));
          return;
        }

        if (mode === 'signup' && hasPassword) {
          await routeExistingAccountToLogin(String(email || '').trim().toLowerCase());
          return;
        }

        setError(t('authPage.errors.invalidCredential'));
        return;
      }

      void reportAuthIssue({
        kind: mode === 'signup' ? 'auth_email_signup_failed' : 'auth_email_login_failed',
        flow: mode === 'signup' ? 'email_signup' : 'email_login',
        code,
        message: msg,
        intent: mode,
      });

      setError(t('authPage.errors.loginFailed'));
    } finally {
      authFlowBusyRef.current = false;
      setBusy(false);
    }
  };

  const renderEmailPasswordForm = ({ variant = 'light' } = {}) => {
    const isDark = variant === 'dark';
    const cardClass = isDark
      ? 'rounded-[24px] border border-white/12 bg-white/8 p-4 shadow-[0_12px_30px_rgba(2,6,23,0.18)]'
      : 'rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4 shadow-[0_12px_30px_rgba(148,163,184,0.08)]';
    const labelClass = isDark ? 'block text-xs font-semibold text-white/82' : 'block text-xs font-semibold text-slate-700';
    const inputClass = isDark
      ? 'mt-1 w-full rounded-2xl border border-white/14 bg-slate-950/28 px-4 py-3 text-sm text-white shadow-sm placeholder:text-white/40'
      : 'mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm';
    const separatorClass = isDark ? 'text-xs text-white/55' : 'text-xs text-slate-500';

    return (
      <div className={cardClass}>
        <div className={separatorClass}>{t('authPage.or')}</div>

        <form noValidate onSubmit={handleEmailPassword} className="mt-3 grid grid-cols-1 gap-3">
          <div>
            <label className={labelClass}>{t('authPage.labels.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder={t('authPage.placeholders.email')}
              autoComplete="email"
              disabled={busy}
            />
          </div>

          <div>
            <label className={labelClass}>{t('authPage.labels.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder={t('authPage.placeholders.password')}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              disabled={busy}
            />
          </div>

          {mode === 'signup' ? (
            <div>
              <label className={labelClass}>{t('authPage.labels.confirmPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder={t('authPage.placeholders.confirmPassword')}
                autoComplete="new-password"
                disabled={busy}
              />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl bg-[linear-gradient(135deg,#ef4444,#f97316)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(249,115,22,0.18)] transition hover:brightness-105 disabled:opacity-60"
          >
            {mode === 'signup' ? t('authPage.actions.signup') : t('authPage.actions.login')}
          </button>
        </form>
      </div>
    );
  };

  const submitPublicFeedback = async () => {
    const msg = String(feedbackText || '').trim();
    const contact = String(feedbackContact || '').trim();
    setFeedbackErr('');
    setFeedbackMsg('');

    const minLen = 10;
    if (!msg || msg.length < minLen) {
      setFeedbackErr(t('authPage.feedback.tooShort', { min: minLen }));
      return;
    }

    setFeedbackBusy(true);
    try {
      const anonId = getAnonBrowserId();

      const page = (() => {
        try {
          return String(window.location?.href || '');
        } catch {
          return '';
        }
      })();
      const host = (() => {
        try {
          return String(window.location?.hostname || '');
        } catch {
          return '';
        }
      })();
      const pagePath = (() => {
        try {
          return String(window.location?.pathname || '');
        } catch {
          return '';
        }
      })();
      const search = (() => {
        try {
          return String(window.location?.search || '');
        } catch {
          return '';
        }
      })();
      const hash = (() => {
        try {
          return String(window.location?.hash || '');
        } catch {
          return '';
        }
      })();
      const ua = (() => {
        try {
          return String(navigator.userAgent || '');
        } catch {
          return '';
        }
      })();
      const lang = (() => {
        try {
          return String(i18n?.language || navigator.language || '');
        } catch {
          return '';
        }
      })();
      const ref = (() => {
        try {
          return String(document.referrer || '');
        } catch {
          return '';
        }
      })();
      const tz = (() => {
        try {
          return String(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
        } catch {
          return '';
        }
      })();

      const context = {
        lang,
        ua,
        tz,
        ref,
        anonId,
        hash,
        mode: String(mode || '').trim(),
        forceLogin: forceLogin ? '1' : '0',
        redirectCheckDone: redirectCheckDone ? '1' : '0',
        uiError: String(error || '').trim(),
        debugAuthCode: String(debugAuth?.code || '').trim(),
        debugAuthMessage: String(debugAuth?.message || '').trim(),
      };

      const res = await fetch('/api/public-feedback-submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contact,
          message: msg,
          step: 'auth_page',
          page,
          pagePath,
          anonId,
          ua,
          lang,
          ref,
          tz,
          context,
        }),
      });

      // Best-effort: aynı mesajı teknik rapor olarak da gönder.
      // Böylece “site açılmıyor / login olmuyor” şikayetlerinde cihaz+URL bilgisiyle teşhis kolaylaşır.
      try {
        const report = buildSupportReport({
          kind: 'public_feedback',
          flow: 'auth_page',
          code: 'user_message',
          message: msg.slice(0, 800),
          extra: {
            anonId,
            pagePath,
            lang,
            tz,
            host,
            search,
            hash,
            mode: String(mode || '').trim(),
            forceLogin: forceLogin ? '1' : '0',
            redirectCheckDone: redirectCheckDone ? '1' : '0',
            uiError: String(error || '').trim(),
            debugAuthCode: String(debugAuth?.code || '').trim(),
            debugAuthMessage: String(debugAuth?.message || '').trim(),
          },
        });
        await fetch('/api/public-error-report', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ report, anonId, pagePath, tz }),
          keepalive: true,
        }).catch(() => null);
      } catch {
        // ignore
      }

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const errCode = String(data?.error || '').trim();
        if (errCode === 'message_too_short') {
          setFeedbackErr(t('authPage.feedback.tooShort', { min: Number(data?.minLen || minLen) || minLen }));
        } else {
          setFeedbackErr(t('authPage.feedback.failed'));
        }
        return;
      }

      setFeedbackText('');
      setFeedbackContact('');
      setFeedbackMsg(t('authPage.feedback.sent'));
    } catch {
      setFeedbackErr(t('authPage.feedback.failed'));
    } finally {
      setFeedbackBusy(false);
    }
  };

  const prefillFeedbackFromError = () => {
    try {
      const errText = String(error || '').trim();
      const code = String(debugAuth?.code || '').trim();
      const dbgMsg = String(debugAuth?.message || '').trim();

      const lines = [
        t('authPage.feedback.prefillHeader'),
        '',
        t('authPage.feedback.prefillProblem'),
        '',
        errText ? `${t('authPage.feedback.prefillUiError')}: ${errText}` : '',
        code ? `${t('authPage.feedback.prefillDebugCode')}: ${code}` : '',
        dbgMsg ? `${t('authPage.feedback.prefillDebugMessage')}: ${dbgMsg}` : '',
      ].filter((x) => typeof x === 'string');

      const next = lines.join('\n').trim();
      if (next) setFeedbackText(next);
    } catch {
      // ignore
    }

    try {
      feedbackSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbfa_0%,#ffffff_32%,#eef7f4_100%)]">
      <Navigation />

      <section className="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-80px] top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.16),rgba(244,114,182,0)_68%)] blur-3xl" />
          <div className="absolute right-[-40px] top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.16),rgba(56,189,248,0)_70%)] blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.14),rgba(251,191,36,0)_68%)] blur-3xl" />
        </div>

        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-start">
          <div className="overflow-hidden rounded-[34px] border border-white/20 bg-[linear-gradient(145deg,#0f172a_0%,#102337_38%,#15404c_100%)] p-6 text-white shadow-[0_34px_110px_rgba(15,23,42,0.26)] md:p-8">
            <div aria-hidden="true" className="absolute inset-0 opacity-60" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">
                <span>{t('navigation.matchmaking')}</span>
                <span className="text-white/35">•</span>
                <span>{mode === 'signup' ? t('authPage.actions.signup') : t('authPage.actions.login')}</span>
              </div>

              <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-white lg:hidden">
                {t("authPage.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72 lg:hidden">
                {contextMessage}
              </p>

              {!user ? (
                <div ref={mobileAuthCtaRef} className="mt-5 space-y-3 rounded-[28px] border border-white/10 bg-slate-950/28 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.20)] backdrop-blur-sm lg:hidden">
                  <div className="inline-flex rounded-2xl border border-white/10 bg-white/8 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <button
                      type="button"
                      onClick={() => switchAuthMode('signup')}
                      className={[
                        'rounded-[14px] px-4 py-2 text-xs font-semibold transition',
                        mode === 'signup'
                          ? 'bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                          : 'text-white/65 hover:text-white',
                      ].join(' ')}
                    >
                      {t('authPage.actions.signup')}
                    </button>
                    <button
                      type="button"
                      onClick={() => switchAuthMode('login')}
                      className={[
                        'rounded-[14px] px-4 py-2 text-xs font-semibold transition',
                        mode === 'login'
                          ? 'bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                          : 'text-white/65 hover:text-white',
                      ].join(' ')}
                    >
                      {t('authPage.actions.login')}
                    </button>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                      {mode === 'signup' ? t('authPage.actions.signup') : t('authPage.actions.login')}
                    </div>
                    <div className="mt-2 text-xl font-semibold text-white">
                      {mode === 'signup' ? t('authPage.googleSignupCta') : t('authPage.googleCta')}
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-50">
                      <div>{error}</div>
                      <button
                        type="button"
                        onClick={prefillFeedbackFromError}
                        className="mt-2 text-xs font-semibold text-amber-100 hover:underline"
                      >
                        {t('authPage.feedback.reportCta')}
                      </button>
                    </div>
                  ) : null}

                  {info ? (
                    <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-sm text-emerald-50">{info}</div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={busy}
                    className="relative w-full rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(255,255,255,0.16)] transition hover:bg-white/92 disabled:opacity-60"
                  >
                    <span className="absolute left-5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-300 shadow-[0_4px_10px_rgba(15,23,42,0.10)]">
                      <img src={googleLogoSrc} alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
                    </span>
                    <span className="block w-full text-center">{mode === 'signup' ? t('authPage.googleSignupCta') : t('authPage.googleCta')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleEmailMethodClick}
                    disabled={busy}
                    className="relative w-full rounded-2xl border border-white/15 bg-white/8 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(2,6,23,0.16)] transition hover:bg-white/12 disabled:opacity-60"
                  >
                    <span className="absolute left-5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/12 text-white shadow-[0_4px_10px_rgba(2,6,23,0.12)]">
                      <Mail size={16} />
                    </span>
                    <span className="block w-full text-center">{mode === 'signup' ? t('authPage.emailSignupCta') : t('authPage.emailLoginCta')}</span>
                  </button>

                  <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-xs leading-relaxed text-white/72">
                    {mode === 'signup' ? t('authPage.signupExistingAccountHint') : t('authPage.trustNote.title')}
                  </div>

                  {emailFallbackVisible ? renderEmailPasswordForm({ variant: 'dark' }) : null}

                  {isGoogleInAppBrowser ? (
                    <button
                      type="button"
                      onClick={handleOpenInBrowserClick}
                      disabled={busy}
                      className="w-full rounded-2xl border border-amber-200/40 bg-amber-200/12 px-5 py-3 text-sm font-semibold text-amber-50 shadow-[0_12px_32px_rgba(2,6,23,0.16)] transition hover:bg-amber-200/18 disabled:opacity-60"
                    >
                      {t('authPage.actions.openInBrowser')}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <h1 className="mt-5 hidden max-w-2xl text-3xl font-semibold leading-tight text-white lg:block md:text-5xl">
                {t("authPage.title")}
              </h1>
              <p className="mt-4 hidden max-w-2xl text-sm leading-relaxed text-white/72 lg:block md:text-base">
                {contextMessage}
              </p>

              <div className="mt-6 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))] p-5 shadow-[0_20px_60px_rgba(2,6,23,0.24)] backdrop-blur-sm md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">{authVideoUi.eyebrow}</div>
                    <div className="mt-3 text-2xl font-semibold leading-tight text-white md:text-3xl">{authVideoUi.title}</div>
                    <div className="mt-3 text-sm leading-relaxed text-white/72 md:text-base">{authVideoUi.body}</div>
                  </div>
                  <a
                    href={YOUTUBE_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-red-300/35 bg-red-500/85 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_14px_34px_rgba(239,68,68,0.24)] transition hover:bg-red-500"
                  >
                    {authVideoUi.channelCta}
                  </a>
                </div>

                <div className="mt-5 space-y-3">
                  {AUTH_SHORT_VIDEOS.map((video) => (
                    <div
                      key={video.videoId}
                      className="flex flex-col gap-3 rounded-[24px] border border-white/10 bg-white/8 p-3 transition hover:bg-white/12 md:flex-row md:items-center"
                    >
                      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-slate-950/40 md:w-[320px] md:min-w-[320px]">
                        <div className="aspect-video w-full">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?rel=0&modestbranding=1`}
                            title={video.title}
                            className="h-full w-full"
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-snug text-white md:text-base">{video.title}</div>
                        <a
                          href={YOUTUBE_CHANNEL_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/72 transition hover:bg-white/16"
                        >
                          {authVideoUi.channelCta}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {!user ? (
                  <div className="mt-5 space-y-3 lg:hidden">
                    <Link
                      to={APP_INSTALL_PATH}
                      onClick={() => trackClick('auth_install_cta_mobile')}
                      className="flex items-start gap-3 rounded-[24px] border border-emerald-300/30 bg-emerald-300/12 p-4 text-left text-white shadow-[0_16px_36px_rgba(2,6,23,0.18)] transition hover:bg-emerald-300/18"
                    >
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-[0_12px_28px_rgba(255,255,255,0.16)]">
                        <Download size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/90">{installLinkUi.eyebrow}</div>
                        <div className="mt-1 text-sm font-semibold text-white">{installLinkUi.title}</div>
                        <div className="mt-1 text-xs leading-relaxed text-white/72">{installLinkUi.loginBody}</div>
                      </div>
                    </Link>

                    <AuthSocialLinks lang={i18n?.language} idSuffix="auth-mobile" />
                  </div>
                ) : null}
              </div>

              <FoundersShowcase compact className="mt-6" />
            </div>
          </div>

          <div className="hidden space-y-4 lg:sticky lg:top-24 lg:block">
            <div className="overflow-hidden rounded-[34px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl md:p-6">
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100/90 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <button
                  type="button"
                  onClick={() => switchAuthMode('signup')}
                  className={[
                    'rounded-[14px] px-4 py-2 text-xs font-semibold transition',
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.10)]'
                      : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  {t('authPage.actions.signup')}
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMode('login')}
                  className={[
                    'rounded-[14px] px-4 py-2 text-xs font-semibold transition',
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.10)]'
                      : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  {t('authPage.actions.login')}
                </button>
              </div>

              <div className="mt-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {mode === 'signup' ? t('authPage.actions.signup') : t('authPage.actions.login')}
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">
                  {mode === 'signup' ? t('authPage.googleSignupCta') : t('authPage.googleCta')}
                </div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600">
                  {mode === 'signup' ? t('authPage.signupGuide') : t('authPage.trustNote.title')}
                </div>
              </div>

              <Link
                to={APP_INSTALL_PATH}
                onClick={() => trackClick('auth_install_cta_desktop')}
                className="mt-4 flex items-start gap-4 rounded-[24px] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5,#f0fdf4)] p-4 text-left shadow-[0_16px_36px_rgba(16,185,129,0.10)] transition hover:brightness-105"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-[0_14px_30px_rgba(5,150,105,0.20)]">
                  <Download size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">{installLinkUi.eyebrow}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">{installLinkUi.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-slate-600">{installLinkUi.loginBody}</div>
                </div>
              </Link>

              {error ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <div>{error}</div>
                  <button
                    type="button"
                    onClick={prefillFeedbackFromError}
                    className="mt-2 text-xs font-semibold text-sky-700 hover:underline"
                  >
                    {t('authPage.feedback.reportCta')}
                  </button>
                </div>
              ) : null}
              {info ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{info}</div>
              ) : null}

              {import.meta.env.DEV && debugAuth ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-800">DEV: Firebase Auth debug</div>
                  <div className="mt-1 text-[11px] text-slate-700"><span className="font-semibold">code:</span> {debugAuth.code || '-'}</div>
                  <div className="text-[11px] text-slate-700"><span className="font-semibold">message:</span> {debugAuth.message || '-'}</div>
                  {debugAuth.email ? <div className="text-[11px] text-slate-700"><span className="font-semibold">email:</span> {debugAuth.email}</div> : null}
                </div>
              ) : null}

              {!user ? (
                <div ref={desktopAuthCtaRef} className="mt-5 space-y-3 rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_40px_rgba(148,163,184,0.10)]">
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={busy}
                    className="relative w-full rounded-2xl bg-[linear-gradient(135deg,#0f172a,#1e293b)] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.20)] transition hover:brightness-105 disabled:opacity-60"
                  >
                    <span className="absolute left-5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white ring-1 ring-white/60 shadow-[0_6px_14px_rgba(255,255,255,0.18)]">
                      <img src={googleLogoSrc} alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
                    </span>
                    <span className="block w-full text-center">{mode === 'signup' ? t('authPage.googleSignupCta') : t('authPage.googleCta')}</span>
                  </button>

                  {isGoogleInAppBrowser ? (
                    <button
                      type="button"
                      onClick={handleOpenInBrowserClick}
                      disabled={busy}
                      className="w-full rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900 shadow-[0_12px_32px_rgba(245,158,11,0.12)] transition hover:bg-amber-100 disabled:opacity-60"
                    >
                      {t('authPage.actions.openInBrowser')}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleEmailMethodClick}
                    disabled={busy}
                    className="relative w-full rounded-2xl border border-slate-300 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-5 py-4 text-sm font-semibold text-slate-900 shadow-[0_12px_32px_rgba(148,163,184,0.10)] transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <span className="absolute left-5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-700 shadow-[0_4px_10px_rgba(148,163,184,0.14)]">
                      <Mail size={16} />
                    </span>
                    <span className="block w-full text-center">{mode === 'signup' ? t('authPage.emailSignupCta') : t('authPage.emailLoginCta')}</span>
                  </button>

                  {mode === 'signup' ? (
                    <a
                      href={authSupportWhatsappHref}
                      onClick={handleLandingWhatsAppClick}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
                    >
                      {authSupportUi.whatsappLabel}
                    </a>
                  ) : null}

                  {mode === 'signup' ? (
                    <div className="rounded-2xl border border-amber-100 bg-[linear-gradient(135deg,#fff8e7,#fffdf7)] px-4 py-3 text-xs leading-relaxed text-slate-600 shadow-[0_10px_24px_rgba(251,191,36,0.08)]">
                      {t('authPage.signupExistingAccountHint')}
                    </div>
                  ) : null}

                  {emailFallbackVisible ? (
                    renderEmailPasswordForm()
                  ) : null}

                  <AuthSocialLinks lang={i18n?.language} idSuffix="auth-desktop" />

                  <div className="text-[11px] leading-relaxed text-slate-500">{authSupportUi.ctaNote}</div>
                </div>
              ) : null}
            </div>

            {needsQuickProfile ? (
              <div className="rounded-[30px] border border-slate-200 bg-white/92 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl">
              <div className="text-sm font-semibold text-slate-900">{t('authPage.quickProfile.title')}</div>
              <div className="mt-1 text-xs text-slate-600">
                {t('authPage.quickProfile.lead')}
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">{t('authPage.quickProfile.labels.fullName')}</label>
                  <input
                    value={quickProfile.fullName}
                    onChange={(e) => {
                      const next = { ...quickProfile, fullName: e.target.value };
                      setQuickProfile(next);
                      persistQuickDraft(next, { completed: false });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('authPage.quickProfile.placeholders.fullName')}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">{t('authPage.quickProfile.labels.age')}</label>
                  <input
                    value={quickProfile.age}
                    onChange={(e) => {
                      const next = { ...quickProfile, age: e.target.value };
                      setQuickProfile(next);
                      persistQuickDraft(next, { completed: false });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('authPage.quickProfile.placeholders.age')}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">{t('authPage.quickProfile.labels.gender')}</label>
                  <select
                    value={quickProfile.gender}
                    onChange={(e) => {
                      const next = { ...quickProfile, gender: String(e.target.value || '').trim() };
                      setQuickProfile(next);
                      persistQuickDraft(next, { completed: false });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    {genderOptions.map((opt) => (
                      <option key={opt.id || 'blank'} value={opt.id} disabled={!opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">{t('authPage.quickProfile.labels.city')}</label>
                  <input
                    value={quickProfile.city}
                    onChange={(e) => {
                      const next = { ...quickProfile, city: e.target.value };
                      setQuickProfile(next);
                      persistQuickDraft(next, { completed: false });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('authPage.quickProfile.placeholders.city')}
                    autoComplete="address-level2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">{t('authPage.quickProfile.labels.country')}</label>
                  <select
                    value={quickProfile.countryCode}
                    onChange={(e) => {
                      const next = { ...quickProfile, countryCode: String(e.target.value || '').trim() || 'tr' };
                      setQuickProfile(next);
                      persistQuickDraft(next, { completed: false });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="tr">{t('authPage.quickProfile.options.countryTr')}</option>
                    <option value="id">{t('authPage.quickProfile.options.countryId')}</option>
                    <option value="other">{t('authPage.quickProfile.options.countryOther')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">{t('authPage.quickProfile.labels.maritalStatus')}</label>
                  <select
                    value={quickProfile.maritalStatus}
                    onChange={(e) => {
                      const next = { ...quickProfile, maritalStatus: String(e.target.value || '').trim() };
                      setQuickProfile(next);
                      persistQuickDraft(next, { completed: false });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">{t('authPage.quickProfile.options.select')}</option>
                    <option value="single">{t('authPage.quickProfile.options.maritalSingle')}</option>
                    <option value="married">{t('authPage.quickProfile.options.maritalMarried')}</option>
                    <option value="divorced">{t('authPage.quickProfile.options.maritalDivorced')}</option>
                    <option value="widowed">{t('authPage.quickProfile.options.maritalWidowed')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">{t('authPage.quickProfile.labels.hasChildren')}</label>
                  <select
                    value={quickProfile.hasChildren}
                    onChange={(e) => {
                      const v = String(e.target.value || '').trim();
                      const next = {
                        ...quickProfile,
                        hasChildren: v,
                        childrenCount: v === 'yes' ? quickProfile.childrenCount : '',
                        childrenLivingSituation: v === 'yes' ? quickProfile.childrenLivingSituation : '',
                      };
                      setQuickProfile(next);
                      persistQuickDraft(next, { completed: false });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">{t('authPage.quickProfile.options.select')}</option>
                    <option value="no">{t('authPage.quickProfile.options.hasChildrenNo')}</option>
                    <option value="yes">{t('authPage.quickProfile.options.hasChildrenYes')}</option>
                  </select>
                </div>

                {quickProfile.hasChildren === 'yes' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">{t('authPage.quickProfile.labels.childrenCount')}</label>
                    <input
                      value={quickProfile.childrenCount}
                      onChange={(e) => {
                        const next = { ...quickProfile, childrenCount: e.target.value };
                        setQuickProfile(next);
                        persistQuickDraft(next, { completed: false });
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder={t('authPage.quickProfile.placeholders.childrenCount')}
                      inputMode="numeric"
                      autoComplete="off"
                    />
                  </div>
                ) : null}

                {quickProfile.hasChildren === 'yes' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">{t('matchmakingPage.form.labels.childrenLivingSituation')}</label>
                    <select
                      value={quickProfile.childrenLivingSituation}
                      onChange={(e) => {
                        const next = { ...quickProfile, childrenLivingSituation: e.target.value };
                        setQuickProfile(next);
                        persistQuickDraft(next, { completed: false });
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">{t('authPage.quickProfile.options.select')}</option>
                      <option value="with_children">{t('matchmakingPage.form.options.childrenLivingSituation.withChildren')}</option>
                      <option value="separate">{t('matchmakingPage.form.options.childrenLivingSituation.separate')}</option>
                    </select>
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-semibold text-slate-700">{t('authPage.quickProfile.labels.occupation')}</label>
                  <input
                    value={quickProfile.occupation}
                    onChange={(e) => {
                      const next = { ...quickProfile, occupation: e.target.value };
                      setQuickProfile(next);
                      persistQuickDraft(next, { completed: false });
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('authPage.quickProfile.placeholders.occupation')}
                    autoComplete="organization-title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">{t('authPage.quickProfile.labels.photo')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                      if (f) void handleQuickPhotoSelect(f);
                    }}
                    className="mt-1 block w-full text-sm"
                  />

                  {quickPhotoState.loading ? (
                    <div className="mt-2 text-xs text-slate-600">{t('authPage.quickProfile.statuses.photoUploading')}</div>
                  ) : null}
                  {!quickPhotoState.loading && quickPhotoState.error ? (
                    <div className="mt-2 text-xs text-amber-700">{quickPhotoState.error}</div>
                  ) : null}
                  {!quickPhotoState.loading && quickProfile.photoUrl ? (
                    <div className="mt-2 text-xs text-emerald-700">{t('authPage.quickProfile.statuses.photoUploaded')}</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickProfileSubmit}
                  disabled={busy || quickPhotoState.loading}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60"
                >
                  {t('authPage.quickProfile.actions.createProfile')}
                </button>
              </div>
            </div>
            ) : null}



            {showIdSignupHelp ? (
              <details className="rounded-[28px] border border-emerald-200 bg-emerald-50/70 p-4 shadow-[0_16px_40px_rgba(16,185,129,0.08)]">
                <summary className="cursor-pointer select-none text-xs font-semibold text-emerald-900">
                  {t('authPage.idSignupHelp.summary')}
                </summary>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">{t('authPage.idSignupHelp.labels.name')}</label>
                    <input
                      value={idSignupHelp.name}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, name: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder={t('authPage.idSignupHelp.placeholders.name')}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">{t('authPage.idSignupHelp.labels.age')}</label>
                    <input
                      value={idSignupHelp.age}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, age: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder={t('authPage.idSignupHelp.placeholders.age')}
                      inputMode="numeric"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">{t('authPage.idSignupHelp.labels.maritalStatus')}</label>
                    <input
                      value={idSignupHelp.maritalStatus}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, maritalStatus: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder={t('authPage.idSignupHelp.placeholders.maritalStatus')}
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">{t('authPage.idSignupHelp.labels.hasChildren')}</label>
                    <select
                      value={idSignupHelp.hasChildren}
                      onChange={(e) => {
                        const value = String(e.target.value || '').trim();
                        setIdSignupHelp((p) => ({
                          ...p,
                          hasChildren: value,
                          childrenCount: value === 'yes' ? p.childrenCount : '',
                          childrenLivingSituation: value === 'yes' ? p.childrenLivingSituation : '',
                        }));
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">{t('authPage.idSignupHelp.options.select')}</option>
                      <option value="no">{t('authPage.idSignupHelp.options.hasChildrenNo')}</option>
                      <option value="yes">{t('authPage.idSignupHelp.options.hasChildrenYes')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">{t('authPage.idSignupHelp.labels.childrenCount')}</label>
                    <input
                      value={idSignupHelp.childrenCount}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, childrenCount: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder={t('authPage.idSignupHelp.placeholders.childrenCount')}
                      inputMode="numeric"
                      autoComplete="off"
                      disabled={String(idSignupHelp.hasChildren || '') !== 'yes'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">{t('matchmakingPage.form.labels.childrenLivingSituation')}</label>
                    <select
                      value={idSignupHelp.childrenLivingSituation}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, childrenLivingSituation: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      disabled={String(idSignupHelp.hasChildren || '') !== 'yes'}
                    >
                      <option value="">{t('authPage.idSignupHelp.options.select')}</option>
                      <option value="with_children">{t('matchmakingPage.form.options.childrenLivingSituation.withChildren')}</option>
                      <option value="separate">{t('matchmakingPage.form.options.childrenLivingSituation.separate')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">{t('authPage.idSignupHelp.labels.job')}</label>
                    <input
                      value={idSignupHelp.job}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, job: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder={t('authPage.idSignupHelp.placeholders.job')}
                      autoComplete="off"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">{t('authPage.idSignupHelp.labels.criteriaNote')}</label>
                    <textarea
                      value={idSignupHelp.criteriaNote}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, criteriaNote: e.target.value }))}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder={t('authPage.idSignupHelp.placeholders.criteriaNote')}
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-600">
                      {t('authPage.idSignupHelp.note')}
                    </div>
                    <a
                      href={idSignupHelpHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled={!idSignupHelpCanSend ? 'true' : 'false'}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                        idSignupHelpCanSend ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-slate-200 text-slate-500 pointer-events-none'
                      }`}
                    >
                      {t('authPage.idSignupHelp.sendWhatsApp')}
                    </a>
                  </div>
                </div>
              </details>
            ) : null}

            <div className="rounded-[28px] border border-slate-200 bg-white/88 p-4 shadow-[0_16px_44px_rgba(148,163,184,0.10)]">
              <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => switchAuthMode(mode === 'login' ? 'signup' : 'login')}
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                {mode === "login" ? t("authPage.actions.switchToSignup") : t("authPage.actions.switchToLogin")}
              </button>
            </div>
            </div>
          </div>
        </div>

        <div ref={feedbackSectionRef} className="relative mt-6 overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-5 shadow-[0_26px_80px_rgba(15,23,42,0.10)] md:p-6">
            <div className="text-sm font-semibold text-slate-900">{t('authPage.feedback.title')}</div>
            <div className="mt-1 text-xs text-slate-600">{t('authPage.feedback.lead')}</div>
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700">{t('authPage.feedback.contactLabel')}</label>
              <input
                value={feedbackContact}
                onChange={(e) => setFeedbackContact(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('authPage.feedback.contactPlaceholder')}
                disabled={feedbackBusy}
                autoComplete="tel email"
              />

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('authPage.feedback.placeholder')}
                disabled={feedbackBusy}
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-500">{t('authPage.feedback.note')}</div>
                <button
                  type="button"
                  onClick={submitPublicFeedback}
                  disabled={feedbackBusy}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                >
                  {feedbackBusy ? t('authPage.feedback.sending') : t('authPage.feedback.send')}
                </button>
              </div>
              {feedbackErr ? (
                <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">{feedbackErr}</div>
              ) : null}
              {feedbackMsg ? (
                <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">{feedbackMsg}</div>
              ) : null}
            </div>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-slate-500">
            {t("authPage.legal.prefix")}{' '}
            <span>
              <a href="/docs/matchmaking-kullanim-sozlesmesi.html" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
                {t("authPage.legal.contract")}
              </a>
              <span className="mx-1">·</span>
              <a href="/docs/iptal-iade-politikasi.html" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
                {t("authPage.legal.cancelRefund")}
              </a>
              <span className="mx-1">·</span>
              <Link to="/privacy" className="text-sky-700 hover:underline">
                {t("authPage.legal.privacy")}
              </Link>
              <span className="mx-1">·</span>
              <Link to="/documents" className="text-sky-700 hover:underline">
                {t('footer.legal.documents')}
              </Link>
              <span className="mx-1">·</span>
              <a href="/docs/kvkk-aydinlatma-metni.html" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
                {t('footer.legal.kvkkNotice')}
              </a>
              <span className="mx-1">·</span>
              <a href="/docs/site-kurallari.html" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
                {t('footer.legal.siteRules')}
              </a>
            </span>
          </p>

          {authTour.open && authTourCurrent ? (
            <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 pt-6 backdrop-blur-sm md:items-center md:pt-4">
              <button
                type="button"
                onClick={closeAuthTour}
                className="absolute inset-0"
                aria-label={t('authPage.tour.close')}
              />

              <div className="relative my-auto w-full max-w-4xl overflow-y-auto rounded-[34px] border border-white/20 bg-[linear-gradient(145deg,#0f172a_0%,#102337_38%,#15404c_100%)] p-5 text-white shadow-[0_34px_110px_rgba(15,23,42,0.38)] max-h-[calc(100dvh-2rem)] md:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/88">
                      <span>{t('authPage.tour.eyebrow')}</span>
                      <span className="text-white/35">•</span>
                      <span>{t('authPage.tour.progress', { current: authTour.step + 1, total: authTourSteps.length })}</span>
                    </div>
                    <div className="mt-4 text-2xl font-semibold leading-tight text-white md:text-3xl">{authTourCurrent.title}</div>
                    <div className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">{authTourCurrent.body}</div>
                  </div>

                  <button
                    type="button"
                    onClick={closeAuthTour}
                    className="hidden items-center justify-center rounded-2xl border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold text-white/88 transition hover:bg-white/14 md:inline-flex"
                  >
                    {t('authPage.tour.close')}
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[minmax(220px,0.78fr)_minmax(0,1.22fr)]">
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/28 p-4 shadow-[0_18px_40px_rgba(2,6,23,0.20)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">{t('authPage.tour.flowTitle')}</div>
                    <div className="mt-3 grid gap-2.5">
                      {authTourSteps.map((step, index) => {
                        const isCurrent = index === authTour.step;
                        const isPassed = index < authTour.step;
                        return (
                          <div
                            key={step?.title || index}
                            className={
                              'rounded-2xl border px-4 py-3 transition ' +
                              (isCurrent
                                ? 'border-amber-300/50 bg-amber-300/16 shadow-[0_14px_34px_rgba(251,146,60,0.16)]'
                                : isPassed
                                  ? 'border-emerald-300/35 bg-emerald-300/10'
                                  : 'border-white/10 bg-white/5')
                            }
                          >
                            <div className="flex items-center gap-3">
                              <div className={
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                                (isCurrent
                                  ? 'bg-[linear-gradient(135deg,#fb7185,#fb923c)] text-slate-950'
                                  : isPassed
                                    ? 'bg-emerald-300 text-slate-950'
                                    : 'bg-white/10 text-white/70')
                              }>
                                {index + 1}
                              </div>
                              <div className="min-w-0 text-sm font-semibold text-white/90">{step?.title || ''}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] p-5 shadow-[0_22px_60px_rgba(2,6,23,0.24)] backdrop-blur-sm">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">{authTourCurrent.eyebrow || t('authPage.tour.cardEyebrow')}</div>
                    <div className="mt-4 grid gap-3">
                      {(Array.isArray(authTourCurrent.points) ? authTourCurrent.points : []).map((point, index) => (
                        <div key={`${authTour.step}-${index}`} className="rounded-[22px] border border-white/10 bg-slate-950/30 p-4 shadow-[0_14px_32px_rgba(2,6,23,0.18)]">
                          <div className="text-sm leading-relaxed text-white/80">{point}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-[24px] border border-white/10 bg-white/7 p-4 text-sm leading-relaxed text-white/70">
                      {t('authPage.tour.exitHint')}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goAuthTourStep(-1)}
                      disabled={authTour.step <= 0}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold text-white/88 transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t('authPage.tour.back')}
                    </button>
                    <button
                      type="button"
                      onClick={closeAuthTour}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold text-white/88 transition hover:bg-white/14"
                    >
                      {t('authPage.tour.close')}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={() => jumpFromTourToAuth('login')}
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold text-white/88 transition hover:bg-white/14"
                    >
                      {t('authPage.tour.loginNow')}
                    </button>
                    <button
                      type="button"
                      onClick={() => jumpFromTourToAuth('signup')}
                      className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_14px_34px_rgba(255,255,255,0.14)] transition hover:bg-white/90"
                    >
                      {t('authPage.tour.signupNow')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (authTour.step >= authTourSteps.length - 1) {
                          jumpFromTourToAuth('signup');
                          return;
                        }
                        goAuthTourStep(1);
                      }}
                      className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#fb7185,#fb923c)] px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_14px_34px_rgba(251,146,60,0.24)] transition hover:brightness-105"
                    >
                      {authTour.step >= authTourSteps.length - 1 ? t('authPage.tour.finish') : t('authPage.tour.next')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
      </section>

      <Footer />
    </div>
  );
}
