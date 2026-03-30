import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  getRedirectResult,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
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
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { useSupportLine } from '../hooks/useSupportLine';
import { getClientCountry, getSupportCountrySync } from '../utils/supportLine';

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

function resolveAuthLanguage(lang) {
  const key = String(lang || '').toLowerCase();
  if (key.startsWith('tr')) return 'tr';
  if (key.startsWith('id')) return 'id';
  return 'en';
}

function getAuthSupportUi(lang) {
  const copy = {
    tr: {
      quickFacts: [
        {
          title: '1-3 dk ilk kayit',
          body: 'Kayit ve ilk yonlendirme kisa surer; sistem sizi dogru akisa alir.',
        },
        {
          title: 'Profiliniz herkese acik degil',
          body: 'Bilgileriniz rastgele listelenmez; surec panel uzerinden kontrollu ilerler.',
        },
        {
          title: 'Takilirsaniz destek var',
          body: 'Giris veya kayit sirasinda sorun yasarsaniz WhatsApp hattindan yardim alabilirsiniz.',
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
          body: 'Yeni kullaniciysaniz sistem sizi dogru form ve panel akisina yonlendirir.',
        },
        {
          title: 'Kontrollu surec baslar',
          body: 'Profil herkese acik olmaz; eslesme ve iletisim adimlari kontrollu ilerler.',
        },
      ],
      ctaNote: 'Ucretsiz kayit • Profil herkese acik degil • Takilirsaniz WhatsApptan yazabilirsiniz',
      whatsappLabel: 'WhatsApptan once size uygun mu sorun',
      whatsappMessage: 'Merhaba, kayit olmadan once sistemin benim durumuma uygun olup olmadigini ogrenmek istiyorum.',
    },
    en: {
      quickFacts: [
        {
          title: '1-3 minute first sign-up',
          body: 'Registration and the first redirect are short; the system takes you into the correct flow.',
        },
        {
          title: 'Your profile is not public',
          body: 'Your details are not randomly listed; the process moves in a controlled way through the panel.',
        },
        {
          title: 'Help is available if you get stuck',
          body: 'If you face a sign-in or sign-up issue, you can ask for help through WhatsApp.',
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
          body: 'If you are new, the system routes you into the right form and panel flow.',
        },
        {
          title: 'A controlled process begins',
          body: 'Your profile is not public; matching and contact steps stay controlled.',
        },
      ],
      ctaNote: 'Free sign-up • No public profile • If you get stuck, you can message us on WhatsApp',
      whatsappLabel: 'Ask on WhatsApp if it fits you first',
      whatsappMessage: 'Hello, before signing up I want to know whether this system fits my situation.',
    },
    id: {
      quickFacts: [
        {
          title: 'Pendaftaran awal 1-3 menit',
          body: 'Registrasi dan pengalihan awal singkat; sistem membawa Anda ke alur yang tepat.',
        },
        {
          title: 'Profil Anda tidak publik',
          body: 'Data Anda tidak ditampilkan sembarangan; proses berjalan terkontrol melalui panel.',
        },
        {
          title: 'Ada bantuan jika Anda terhambat',
          body: 'Jika ada masalah saat masuk atau daftar, Anda bisa minta bantuan lewat WhatsApp.',
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
          body: 'Jika Anda pengguna baru, sistem mengarahkan Anda ke form dan panel yang sesuai.',
        },
        {
          title: 'Proses terkontrol dimulai',
          body: 'Profil Anda tidak publik; langkah match dan kontak berjalan terkontrol.',
        },
      ],
      ctaNote: 'Daftar gratis • Profil tidak publik • Jika ada kendala, Anda bisa menulis lewat WhatsApp',
      whatsappLabel: 'Tanya dulu via WhatsApp apakah ini cocok untuk Anda',
      whatsappMessage: 'Halo, sebelum mendaftar saya ingin tahu apakah sistem ini cocok untuk situasi saya.',
    },
  };

  return copy[lang] || copy.tr;
}

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const supportLine = useSupportLine(String(i18n?.language || 'tr'));
  const authSupportUi = getAuthSupportUi(resolveAuthLanguage(i18n?.language));
  const authSupportWhatsappHref = buildWhatsAppUrl(authSupportUi.whatsappMessage, {
    lang: String(i18n?.language || 'tr'),
    prefer: String(supportLine?.prefer || '').trim() || undefined,
    context: 'auth_trust_help',
  });

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
    return {
      from: state.from || "/profilim",
      fromState: state.fromState || null,
    };
  }, [location.state]);

  useEffect(() => {
    tiktokPage();
  }, []);

  const [mode, setMode] = useState("login"); // login | signup

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

  useEffect(() => {
    // Email/password adımı varsayılan kapalı (kullanıcı butonla açar).
    setEmailFallbackVisible(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [mode]);

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

      const lines = [
        t('authPage.idSignupHelp.messageTitle'),
        `${t('authPage.idSignupHelp.messageFields.name')}: ${pick(idSignupHelp.name) || '-'}`,
        `${t('authPage.idSignupHelp.messageFields.age')}: ${pick(idSignupHelp.age) || '-'}`,
        `${t('authPage.idSignupHelp.messageFields.maritalStatus')}: ${pick(idSignupHelp.maritalStatus) || '-'}`,
        `${t('authPage.idSignupHelp.messageFields.hasChildren')}: ${hasChildrenLabel}`,
        `${t('authPage.idSignupHelp.messageFields.childrenCount')}: ${pick(idSignupHelp.childrenCount) || '-'}`,
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

  const normalizePathOnly = (p) => {
    const raw = String(p || '').trim();
    // Query/hash gibi eklentileri yok say (örn: /evlilik/eslestirme-basvuru?w=1)
    return raw.split(/[?#]/)[0];
  };

  const isMatchmakingApplyPath = (p) => {
    const path = normalizePathOnly(p);
    return path === '/wedding/apply' || path === '/evlilik/eslestirme-basvuru' || path === '/evlilik/eslestirme-basvurusu';
  };

  const hasCompletedApplication = async (uid) => {
    const userId = String(uid || '').trim();
    if (!userId) return false;

    const safeStr = (v) => (typeof v === 'string' ? v.trim() : '');

    const asNum = (v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'string') {
        const t = v.trim();
        if (!t) return null;
        const n = Number(t);
        return Number.isFinite(n) ? n : null;
      }
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const normalizeGender = (v) => {
      const s = safeStr(v).toLowerCase();
      if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
      if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
      return '';
    };

    const normalizeMaritalStatus = (v) => safeStr(v).toLowerCase();

    const ageFromBirthYearMaybe = (v) => {
      const year = asNum(v);
      if (!(typeof year === 'number' && Number.isFinite(year) && year >= 1900 && year <= 2100)) return null;
      const now = new Date();
      const age = now.getFullYear() - Math.trunc(year);
      return age >= 18 && age <= 99 ? age : null;
    };

    const ageFromDateMaybe = (v) => {
      let d = null;

      if (typeof v === 'number' && Number.isFinite(v)) {
        d = new Date(v);
      } else if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return null;
        const parsed = Date.parse(s);
        if (Number.isFinite(parsed)) d = new Date(parsed);
      } else if (typeof v?.toDate === 'function') {
        try {
          d = v.toDate();
        } catch {
          d = null;
        }
      }

      if (!d || Number.isNaN(d.getTime())) return null;
      const now = new Date();
      let age = now.getFullYear() - d.getFullYear();
      const m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
      return age >= 18 && age <= 99 ? age : null;
    };

    const getAge = (obj) => {
      const it = obj && typeof obj === 'object' ? obj : {};
      const details = it?.details && typeof it.details === 'object' ? it.details : {};

      const direct = asNum(it?.age);
      if (typeof direct === 'number' && Number.isFinite(direct) && direct >= 18 && direct <= 99) return direct;

      const nested = asNum(details?.age);
      if (typeof nested === 'number' && Number.isFinite(nested) && nested >= 18 && nested <= 99) return nested;

      const byYear = ageFromBirthYearMaybe(details?.birthYear ?? it?.birthYear);
      if (byYear !== null) return byYear;

      const byDate =
        ageFromDateMaybe(details?.birthDateMs ?? it?.birthDateMs) ??
        ageFromDateMaybe(details?.birthDate ?? it?.birthDate) ??
        ageFromDateMaybe(details?.dob ?? it?.dob);
      if (byDate !== null) return byDate;

      return null;
    };

    const pickOccupation = (details, obj) => {
      const d = details && typeof details === 'object' ? details : {};
      const a = obj && typeof obj === 'object' ? obj : {};
      return (
        safeStr(d?.occupationTr) ||
        safeStr(d?.occupation) ||
        safeStr(d?.occupationId) ||
        safeStr(a?.occupation) ||
        safeStr(d?.job) ||
        safeStr(d?.jobTitle) ||
        safeStr(d?.profession) ||
        safeStr(a?.job) ||
        safeStr(a?.jobTitle) ||
        safeStr(a?.profession) ||
        ''
      );
    };

    const pickMaritalStatus = (details, obj) => {
      const d = details && typeof details === 'object' ? details : {};
      const a = obj && typeof obj === 'object' ? obj : {};
      return (
        safeStr(d?.maritalStatus) ||
        safeStr(a?.maritalStatus) ||
        safeStr(d?.marital) ||
        safeStr(a?.marital) ||
        safeStr(d?.medeniDurum) ||
        safeStr(a?.medeniDurum) ||
        safeStr(d?.marital_status) ||
        safeStr(a?.marital_status) ||
        ''
      );
    };

    const pickHasChildren = (details, obj) => {
      const d = details && typeof details === 'object' ? details : {};
      const a = obj && typeof obj === 'object' ? obj : {};

      const raw =
        safeStr(d?.hasChildren) ||
        safeStr(a?.hasChildren) ||
        safeStr(d?.children) ||
        safeStr(a?.children) ||
        safeStr(d?.childStatus) ||
        safeStr(a?.childStatus) ||
        safeStr(d?.has_children) ||
        safeStr(a?.has_children);
      if (raw) return raw;

      if (typeof d?.hasChildren === 'boolean') return d.hasChildren ? 'yes' : 'no';
      if (typeof a?.hasChildren === 'boolean') return a.hasChildren ? 'yes' : 'no';

      return '';
    };

    const pickChildrenCount = (details, obj) => {
      const d = details && typeof details === 'object' ? details : {};
      const a = obj && typeof obj === 'object' ? obj : {};
      const raw = d?.childrenCount ?? d?.childCount ?? d?.children_count ?? d?.child_count ?? a?.childrenCount ?? a?.childCount;
      const n = asNum(raw);
      if (!(typeof n === 'number' && Number.isFinite(n))) return null;
      const i = Math.trunc(n);
      if (i < 0 || i > 20) return null;
      return i;
    };

    const isStubApplication = (a) => {
      const source = safeStr(a?.source).toLowerCase();
      if (source === 'auto_stub') return true;
      if (a?.details?.autoBootstrap === true) return true;
      return false;
    };

    const hasMinimumProfileInUserDoc = (d) => {
      const userDoc = d && typeof d === 'object' ? d : {};
      const appFromUser = userDoc?.application && typeof userDoc.application === 'object' ? userDoc.application : null;
      const publicProfile =
        userDoc?.publicProfile && typeof userDoc.publicProfile === 'object' ? userDoc.publicProfile : null;
      const merged = {
        ...(publicProfile || {}),
        ...(appFromUser || {}),
        ...(userDoc || {}),
        details: {
          ...((publicProfile && typeof publicProfile.details === 'object' ? publicProfile.details : {}) || {}),
          ...((appFromUser && typeof appFromUser.details === 'object' ? appFromUser.details : {}) || {}),
          ...((userDoc?.details && typeof userDoc.details === 'object' ? userDoc.details : {}) || {}),
        },
      };

      const details = merged?.details && typeof merged.details === 'object' ? merged.details : {};

      const fullName = safeStr(merged?.fullName);
      const age = getAge(merged);
      const gender = normalizeGender(merged?.gender);
      const city = safeStr(merged?.city);
      const country = safeStr(merged?.country);
      const nationality = safeStr(merged?.nationality);
      const occupation = pickOccupation(details, merged);
      const maritalStatus = normalizeMaritalStatus(pickMaritalStatus(details, merged));

      if (!fullName) return false;
      if (!(typeof age === 'number' && Number.isFinite(age) && age >= 18 && age <= 99)) return false;
      if (!gender) return false;
      if (!city) return false;
      if (!country) return false;
      if (!nationality) return false;
      if (!occupation) return false;
      if (!maritalStatus) return false;

      if (maritalStatus === 'widowed' || maritalStatus === 'divorced') {
        const hasChildren = safeStr(pickHasChildren(details, merged)).toLowerCase();
        if (!hasChildren) return false;
        if (hasChildren === 'yes') {
          const cnt = pickChildrenCount(details, merged);
          if (!(typeof cnt === 'number' && Number.isFinite(cnt) && cnt >= 1 && cnt <= 20)) return false;
        }
      }

      return true;
    };

    const hasMinimumProfileInApplicationDoc = (a) => {
      const app = a && typeof a === 'object' ? a : {};
      if (isStubApplication(app)) return false;
      const details = app?.details && typeof app.details === 'object' ? app.details : {};

      const fullName = safeStr(app?.fullName);
      const age = getAge(app);
      const gender = normalizeGender(app?.gender);
      const city = safeStr(app?.city);
      const country = safeStr(app?.country);
      const nationality = safeStr(app?.nationality);
      const occupation = pickOccupation(details, app);
      const maritalStatus = normalizeMaritalStatus(pickMaritalStatus(details, app));

      if (!fullName) return false;
      if (!(typeof age === 'number' && Number.isFinite(age) && age >= 18 && age <= 99)) return false;
      if (!gender) return false;
      if (!city) return false;
      if (!country) return false;
      if (!nationality) return false;
      if (!occupation) return false;
      if (!maritalStatus) return false;

      if (maritalStatus === 'widowed' || maritalStatus === 'divorced') {
        const hasChildren = safeStr(pickHasChildren(details, app)).toLowerCase();
        if (!hasChildren) return false;
        if (hasChildren === 'yes') {
          const cnt = pickChildrenCount(details, app);
          if (!(typeof cnt === 'number' && Number.isFinite(cnt) && cnt >= 1 && cnt <= 20)) return false;
        }
      }

      return true;
    };

    try {
      const { db, collection, doc, getDoc, getDocs, limit, query, where } = await loadFirestoreApi();

      // Fast path: matchmakingUsers doc'unda minimum alanlar.
      try {
        const uRef = doc(db, 'matchmakingUsers', userId);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          const d = uSnap.data() || {};
          if (hasMinimumProfileInUserDoc(d)) return true;
        }
      } catch {
        // ignore and fall back
      }

      // Fallback: matchmakingApplications, non-stub ve minimum alanlar dolu.
      const q1 = query(collection(db, 'matchmakingApplications'), where('userId', '==', userId), limit(10));
      const q2 = query(collection(db, 'matchmakingApplications'), where('uid', '==', userId), limit(10));
      const q3 = query(collection(db, 'matchmakingApplications'), where('userUid', '==', userId), limit(10));

      const [s1, s2, s3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);
      const docs = [...(s1?.docs || []), ...(s2?.docs || []), ...(s3?.docs || [])];
      if (!docs.length) return false;

      const seen = new Set();
      for (const d of docs) {
        const id = safeStr(d?.id);
        if (id && seen.has(id)) continue;
        if (id) seen.add(id);
        const a = d.data() || {};
        if (hasMinimumProfileInApplicationDoc(a)) return true;
      }
      return false;
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
      return JSON.parse(raw);
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
      sessionStorage.setItem('auth_redirect_target', JSON.stringify(redirectTarget));
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
    const stored = readStoredRedirect();
    const candidate = stored?.from || redirectTarget.from || '';

    // Yeni kayıt olan kullanıcıları başvuru wizard'ına al.
    // Mevcut kullanıcı signup ekranına yanlışlıkla düşmüş olsa bile yeniden forma zorlama; Profilim'e yönlendir.
    if (isFeatureEnabled('wedding') && isNewUser) return '/evlilik/eslestirme-basvuru?w=1';

    // Mevcut kullanıcı "başvuru" sayfasına gitmek istediyse onu koru.
    if (isMatchmakingApplyPath(candidate)) return candidate;

    // Mevcut kullanıcıyı her zaman Profilim'e götür.
    return '/profilim';
  };

  const resolvePostAuthState = () => {
    const stored = readStoredRedirect();
    return stored?.fromState || redirectTarget.fromState || null;
  };

  // Not: 2026-02 ürün kararındaki "signup sonrası forma zorlamama" akışı geri alındı.

  const navigateNext = useCallback((target, state) => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    const finalTarget = target || redirectTarget.from || '/profilim';
    const finalState = typeof state === 'undefined' ? redirectTarget.fromState : state;
    navigate(finalTarget, { replace: true, state: finalState });
  }, [navigate, redirectTarget.from, redirectTarget.fromState]);

  const withTimeout = (promise, timeoutMs) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
  };

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

      // Başvuru sayfasına gitmek istiyor ama zaten tamamladıysa profilime al.
      if (completed === true && isMatchmakingApplyPath(next)) {
        next = '/profilim';
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
    if (!uid) return;

    const profile =
      typeof profileOrAge === 'number'
        ? { age: profileOrAge }
        : profileOrAge && typeof profileOrAge === 'object'
          ? profileOrAge
          : {};

    // Prefer server-side ensure to avoid client-side Firestore rules/config issues.
    try {
      const token = typeof auth?.currentUser?.getIdToken === 'function' ? await auth.currentUser.getIdToken() : '';
      if (token) {
        const res = await fetch('/api/matchmaking-user-ensure', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            age: profile?.age,
            gender: profile?.gender,
            lookingForGender: profile?.lookingForGender,
          }),
        });
        const data = await res.json().catch(() => null);
        if (data && data.ok) return;
      }
    } catch {
      // Fall back to client Firestore.
    }

    const { db, doc, getDoc, serverTimestamp, setDoc } = await loadFirestoreApi();

    const ref = doc(db, "matchmakingUsers", uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() || {} : {};
    const existingAge = typeof data?.age === 'number' ? data.age : null;

    const existingGender = String(data?.gender || '').trim().toLowerCase();
    const hasGender = existingGender === 'male' || existingGender === 'female';

    if (typeof existingAge === 'number' && hasGender) return;

    const parsedAge = Number(String(profile?.age ?? '').trim());
    const nextAge = Number.isFinite(parsedAge) && Number.isInteger(parsedAge) ? parsedAge : null;

    const nextGenderRaw = String(profile?.gender || '').trim().toLowerCase();
    const nextGender = nextGenderRaw === 'male' || nextGenderRaw === 'female' ? nextGenderRaw : null;

    // IMPORTANT (firestore.rules): Client-side writes to matchmakingUsers are intentionally restricted
    // to a small whitelist. Do NOT attempt to write extra fields here (e.g. lookingForGender),
    // otherwise a permission-denied can break onboarding flows.

    const payload = {
      ...(typeof existingAge === 'number' ? {} : nextAge !== null ? { age: nextAge } : {}),
      ...(hasGender ? {} : nextGender ? { gender: nextGender } : {}),
      updatedAt: serverTimestamp(),
    };

    // createdAt sadece ilk oluşturma anında set edilsin (rules tarafını ve audit'i sadeleştirir).
    if (!snap.exists()) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(ref, payload, { merge: true });
  };

  const bootstrapMatchmakingApplication = async (userOrUid, profile) => {
    try {
      const uid = typeof userOrUid === 'string' ? userOrUid : String(userOrUid?.uid || '').trim();
      if (!uid) return;

      // Token: mümkünse ilgili user objesinden; yoksa auth.currentUser'dan.
      const token =
        (typeof userOrUid?.getIdToken === 'function' ? await userOrUid.getIdToken() : '') ||
        (typeof auth?.currentUser?.getIdToken === 'function' ? await auth.currentUser.getIdToken() : '');
      if (!token) return;

      await fetch('/api/matchmaking-application-bootstrap', {
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
    } catch {
      // best-effort
    }
  };

  const syncedAuthIdentityUidRef = useRef('');
  useEffect(() => {
    if (authLoading) return;
    if (!redirectCheckDone) return;
    if (!user || user.isAnonymous || !user?.uid) return;
    if (syncedAuthIdentityUidRef.current === user.uid) return;

    syncedAuthIdentityUidRef.current = user.uid;
    void ensureProfileSaved(user.uid, {});
  }, [authLoading, redirectCheckDone, user?.uid, user?.isAnonymous]);

  const contextMessage = useMemo(() => {
    const from = redirectTarget.from || "/profilim";

    if (from === "/profilim") {
      return t("authPage.context.panel");
    }

    return t("authPage.context.generic");
  }, [redirectTarget.from, t]);

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
                forceTour('onboarding-main');
                try {
                  await ensureProfileSaved(result?.user?.uid, p);
                  await acceptReferralIfAny();
                } catch {
                  // best-effort
                }
                try {
                  await applyQuickProfileAfterAuthIfAny(`${providerLabel}_redirect`);
                } catch {
                  // ignore
                }
                try {
                  await bootstrapMatchmakingApplication(result?.user, p);
                } catch {
                  // ignore
                }
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
                await navigateNextWithApplyGuard(result?.user?.uid, target, state);
                clearPendingPostAuthNav();
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
          forceTour('onboarding-main');
          try {
            await ensureProfileSaved(u?.uid, p);
            await acceptReferralIfAny();
          } catch {
            // ignore
          }
          try {
            await applyQuickProfileAfterAuthIfAny(`${providerLabel}_redirect`);
          } catch {
            // ignore
          }
          try {
            await bootstrapMatchmakingApplication(u, p);
          } catch {
            // ignore
          }
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
          await navigateNextWithApplyGuard(u?.uid, target, state);
          clearPendingPostAuthNav();
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
        const r = await tryGetRedirectResultWithTimeout(import.meta.env.DEV ? 1500 : 8000);

        // Bazı in-app tarayıcılarda getRedirectResult hiç resolve olmayabiliyor.
        // Timeout durumunda sessizce devam edip diğer effect'lerin yönlendirmesine izin veriyoruz.
        if (r?.timeout) {
          try {
            const intent = readAuthIntent() || 'login';
            void trackClick(`${intent}_redirect_result_timeout:${providerLabel}`, { trace: true });
          } catch {
            // ignore
          }
          clearAutoGoogleFlag();
          // IMPORTANT: In some environments, redirect actually succeeds but getRedirectResult hangs.
          // If we don't salvage, we lose signups and skip onboarding/bootstrap.
          void salvageRedirectAfterTimeout({ providerLabel, initialIntent: readAuthIntent() || 'login' });
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
          // keep whether user is new so we can route existing users to /profilim.
          try {
            const params = new URLSearchParams(location.search || '');
            const isAutoGoogle = String(params.get('auto') || '').toLowerCase() === 'google' || readAutoGoogleFlag();
            if (isAutoGoogle) {
              sessionStorage.setItem('uniqah:last_auth_new_user_v1', isNewUser ? '1' : '0');
              if (!isNewUser) {
                // Force post-auth target for existing users.
                writeForcedTarget('/profilim');
              }
            }
          } catch {
            // ignore
          }

          // Redirect akışında sayfa yenilendiği için mode kaybolabilir.
          // Bu yüzden intent'i (login/signup) sessionStorage üzerinden okuyoruz.
          const intent = readAuthIntent() || 'login';
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
            forceTour('onboarding-main');

            try {
              await ensureProfileSaved(result?.user?.uid, p);
              await acceptReferralIfAny();
            } catch (eProfile) {
              // Best-effort: profil kaydı başarısız olsa bile kullanıcıyı kilitleme.
              const code = String(eProfile?.code || '').trim();
              void trackClick(`signup_error:google_redirect:${code || 'profile_save_failed'}`, { trace: true });

              storeSupportReport(
                buildSupportReport({
                  kind: 'signup_profile_save_failed',
                  flow: `${providerLabel}_redirect`,
                  code: code || 'profile_save_failed',
                  message: String(eProfile?.message || ''),
                  extra: { uid: safeStr(result?.user?.uid) },
                })
              );
            }

            // Hızlı profil alanlarını server-side kaydet (Firestore client rules kısıtlı).
            await applyQuickProfileAfterAuthIfAny(`${providerLabel}_redirect`);

            // Admin "Yeni Kullanıcılar" tab'ı `matchmakingApplications` okuyor.
            // Yeni kayıt olur olmaz auto_stub başvuru dokümanı oluştur (profil eksik olsa bile).
            await bootstrapMatchmakingApplication(result?.user, p);

            // Redirect sonrası /profilim'e geldikten sonra formu otomatik açma.
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
            await navigateNextWithApplyGuard(result?.user?.uid, target, state);
            clearPendingPostAuthNav();
          } catch {
            // Best-effort; fallback effect pending target'ı kullanır.
          }
        } else if (isActive) {
          // If we know a redirect was started recently but we got no result, surface a useful error
          // and store a support report for diagnosis (host mismatch, storage restrictions, etc.).
          const marker = readRedirectStartMarker();
          if (marker) {
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

        // Redirect flow'da hata olursa eskiden tamamen yutuluyordu.
        // Bu da “kayıt olmuyorlar ama sebep göremiyoruz” sorununa yol açıyor.
        const intent = readAuthIntent() || 'login';

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
          const isInAppBrowser = (() => {
            try {
              const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
              return /fbav|fban|instagram|line\//i.test(ua) || /micromessenger|wechat/i.test(ua) || /tiktok|trill/i.test(ua);
            } catch {
              return false;
            }
          })();

          // Firebase Auth sometimes loads https://apis.google.com/js/api.js during Google sign-in.
          // In some in-app browsers this can fail in opaque ways; fail open with email fallback.
          if (providerLabel === 'google' && isInAppBrowser) {
            setError(t('authPage.errors.googleInAppBlocked'));
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
  }, [navigateNext]);

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
          const target = String(pending?.target || '').trim() || resolvePostAuthTarget(false, mode);
          const state = pending ? pending.state : resolvePostAuthState();
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
  }, [user, redirectCheckDone, mode, needsQuickProfile, quickProfileCheckDone]);

  // CTA-driven signup: /login?mode=signup&auto=google
  // Auto-start Google auth once, after redirect-result check is done.
  // NOTE: Must stay above any early-return branches to keep hook order stable.
  const autoGoogleOnceRef = useRef(false);
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const rawMode = String(params.get('mode') || mode || '').toLowerCase();
      const auto = String(params.get('auto') || '').toLowerCase();
      if (rawMode !== 'signup') return;
      if (auto !== 'google') return;
      if (!isTrOrIdTraffic) return;

      clearAutoGoogleFlag();
      consumeAutoGoogleQueryParam();
    } catch {
      // ignore
    }
  }, [location.search, mode, isTrOrIdTraffic]);

  useEffect(() => {
    try {
      if (autoGoogleOnceRef.current) return;
      if (!redirectCheckDone) return;
      if (authFlowBusyRef.current) return;
      if (busy) return;
      if (user) return;
      if (mode !== 'signup') return;

      const params = new URLSearchParams(location.search || '');
      const auto = String(params.get('auto') || '').toLowerCase();
      if (auto !== 'google') return;

      if (isTrOrIdTraffic) {
        autoGoogleOnceRef.current = true;
        consumeAutoGoogleQueryParam();
        return;
      }

      const isInAppBrowser = (() => {
        try {
          const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
          // Facebook/Instagram/Line/WeChat/etc in-app browsers often break OAuth flows.
          return /fbav|fban|instagram|line\//i.test(ua) || /micromessenger|wechat/i.test(ua);
        } catch {
          return false;
        }
      })();

      // Safety: do NOT auto-trigger Google auth inside in-app browsers.
      // Keep the user on the page so they can pick email fallback or open in a real browser.
      if (isInAppBrowser) {
        autoGoogleOnceRef.current = true;
        try {
          void trackClick('signup_auto_skipped:inapp');
        } catch {
          // ignore
        }
        return;
      }

      autoGoogleOnceRef.current = true;
      // Best-effort: start Google flow immediately.
      void handleGoogle();
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, redirectCheckDone, mode, user, busy, isTrOrIdTraffic]);

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
                onClick={() => navigate('/profilim', { replace: true })}
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

  const handleGoogle = async () => {
    setBusy(true);
    setError('');
    setInfo('');
    authFlowBusyRef.current = true;
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

    const forcedTransport = (() => {
      try {
        const params = new URLSearchParams(location.search || '');
        const v = String(params.get('transport') || '').trim().toLowerCase();
        if (v === 'popup' || v === 'redirect') return v;
        return '';
      } catch {
        return '';
      }
    })();


    try {
      clearSignupProfile();

      const provider = new GoogleAuthProvider();
      configureGoogleProviderLocale(provider);

      const isTikTokInApp = (() => {
        try {
          const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
          return /trill[_\s/-]?|tiktok/i.test(ua);
        } catch {
          return false;
        }
      })();

      const isOtherInApp = (() => {
        try {
          const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
          // Facebook/Instagram/Line/WeChat/etc in-app browsers often block popups.
          return /fbav|fban|instagram|line\//i.test(ua) || /micromessenger|wechat/i.test(ua);
        } catch {
          return false;
        }
      })();

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

      // Prefer popup on almost all real browsers, including iOS Safari.
      // Redirect round-trips are the main source of "Google'a gidip geri attı" complaints.
      // Keep redirect only for explicit auto-google flows or known problematic browsers.
      const preferPopup = !isAutoGoogle && !isMiuiOrLite;
      let willRedirect = isMiuiOrLite || isAutoGoogle;
      if (preferPopup) willRedirect = false;

      // Debug override: allow forcing the transport via query param.
      // Example: /login?mode=signup&transport=popup
      if (forcedTransport === 'popup') willRedirect = false;
      if (forcedTransport === 'redirect') willRedirect = true;

      writeGoogleDecisionDebug({
        intent: String(mode || ''),
        isAutoGoogle: isAutoGoogle ? '1' : '0',
        forcedTransport: forcedTransport || '',
        isTikTokInApp: isTikTokInApp ? '1' : '0',
        isOtherInApp: isOtherInApp ? '1' : '0',
        isMiuiOrLite: isMiuiOrLite ? '1' : '0',
        isIOS: isIOS ? '1' : '0',
        isAndroid: isAndroid ? '1' : '0',
        trafficCountryHint: trafficCountryHint || '',
        willRedirect: willRedirect ? '1' : '0',
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
        setEmailFallbackVisible(true);
        setError(t('authPage.errors.googleInAppBlocked'));
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

      // Stable browsers use popup here to avoid redirect round-trip failures.
      if (willRedirect) {
        try {
          setInfo(t('authPage.infos.inAppBrowserGoogleRedirect'));
        } catch {
          // ignore
        }
        redirectStarted = true;
        startGoogleRedirect(provider, { flow: 'google_redirect_start' });
        return;
      }

      // Popup: call immediately (no awaits before this).
      const result = await signInWithPopup(auth, provider);
      const info2 = getAdditionalUserInfo(result);
      const isNewUser = !!info2?.isNewUser;

      if (isAutoGoogle) {
        try {
          sessionStorage.setItem(LAST_AUTH_NEW_USER_KEY, isNewUser ? '1' : '0');
        } catch {
          // ignore
        }
        // If user is NOT new, CTA should land on profile instead of forcing the apply form.
        if (!isNewUser) {
          try {
            writeForcedTarget('/profilim');
          } catch {
            // ignore
          }
        }
      }

      if (isNewUser && mode !== 'signup') {
        try {
          void trackClick('signup_auto:google_popup_from_login_intent');
        } catch {
          // ignore
        }
      }

      if (isNewUser) {
        markHasSignedUpBefore();
        await trackClick('signup_success:google', { trace: true });
        markFunnelSignupCompleted('google_popup');
        try {
          if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
            window.gtag('event', 'sign_up', { method: 'google' });
          }
        } catch {
          // ignore
        }
        tiktokTrack('CompleteRegistration');
        forceTour('onboarding-main');

        const p = readSignupProfile() || {};
        clearSignupProfile();

        try {
          await ensureProfileSaved(result?.user?.uid, p);
          await acceptReferralIfAny();
        } catch (eProfile) {
          const code = String(eProfile?.code || '').trim();
          void trackClick(`signup_error:google_popup:${code || 'profile_save_failed'}`, { trace: true });

          storeSupportReport(
            buildSupportReport({
              kind: 'signup_profile_save_failed',
              flow: 'google_popup',
              code: code || 'profile_save_failed',
              message: String(eProfile?.message || ''),
              extra: { uid: safeStr(result?.user?.uid) },
            })
          );
        }

        void applyQuickProfileAfterAuthIfAny('google_popup');
        void bootstrapMatchmakingApplication(result?.user, p);
        markJustSignedUp();
      } else {
        clearSignupProfile();
        try {
          void trackClick('signin_success:google');
        } catch {
          // ignore
        }
      }

      // Popup akışında da post-auth hedefi sakla (özellikle yeni kullanıcı mode=login'den gelirse).
      try {
        const intent = mode;
        const target = resolvePostAuthTarget(isNewUser, isNewUser ? 'signup' : intent);
        const state = isNewUser ? null : resolvePostAuthState();
        writePendingPostAuthNav(target, state);

        // Popup sonucu geldi: elimizde user varken hemen yönlendir.
        try {
          await navigateNextWithApplyGuard(result?.user?.uid, target, state);
          clearPendingPostAuthNav();
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }

      clearAutoGoogleFlag();
    } catch (e) {
      const code = String(e?.code || '').trim();
      const msg = String(e?.message || '').trim();

      writeGoogleDecisionDebug({
        lastErrorCode: code || 'unknown',
        lastErrorMessage: msg ? msg.slice(0, 220) : '',
      });

      if (mode === 'signup') {
        void trackClick(`signup_error:google_popup:${code || 'unknown'}`, { trace: true });
      } else {
        void trackClick(`login_error:google_popup:${code || 'unknown'}`, { trace: true });
      }

      if (code === 'auth/popup-blocked') {
        try {
          if (mode === 'signup') {
            void trackClick('signup_popup_blocked:google', { trace: true });
          } else {
            void trackClick('login_popup_blocked:google', { trace: true });
          }
        } catch {
          // ignore
        }
        setEmailFallbackVisible(true);
        setError(t('authPage.errors.googlePopupBlocked'));
        return;
      }

      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/user-cancelled'
      ) {
        try {
          if (mode === 'signup') {
            void trackClick('signup_popup_closed:google', { trace: true });
          } else {
            void trackClick('login_popup_closed:google', { trace: true });
          }
        } catch {
          // ignore
        }
        setError(t('authPage.errors.googlePopupClosed'));
        return;
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
              void trackClick('signup_popup_fallback_to_redirect:google', { trace: true });
            } else {
              void trackClick('login_popup_fallback_to_redirect:google', { trace: true });
            }
          } catch {
            // ignore
          }
          redirectStarted = true;
          startGoogleRedirect(provider2, { flow: 'google_popup_fallback_redirect_start' });
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

      if (code === 'auth/unauthorized-domain') {
        void reportAuthIssue({ kind: 'auth_google_unauthorized_domain', flow: 'google_popup', code, message: msg, intent: mode });
        const host = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
        setError(
          t('authPage.errors.googleUnauthorizedDomain', {
            host: host || t('authPage.errors.domainNotFound'),
          })
        );
        return;
      }

      if (code === 'auth/operation-not-allowed') {
        void reportAuthIssue({ kind: 'auth_google_operation_not_allowed', flow: 'google_popup', code, message: msg, intent: mode });
        setError(t('authPage.errors.googleOperationNotAllowed'));
        return;
      }

      if (code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found') {
        void reportAuthIssue({ kind: 'auth_invalid_firebase_config', flow: 'google_popup', code, message: msg, intent: mode });
        setError(t('authPage.errors.firebaseAuthInvalidConfig'));
        return;
      }

      if (code === 'auth/too-many-requests') {
        setError(t('authPage.errors.rateLimited'));
        return;
      }

      if (code === 'auth/internal-error') {
        const isInAppBrowser = (() => {
          try {
            const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
            return /fbav|fban|instagram|line\//i.test(ua) || /micromessenger|wechat/i.test(ua) || /tiktok|trill/i.test(ua);
          } catch {
            return false;
          }
        })();

        if (isInAppBrowser) {
          setError(t('authPage.errors.googleInAppBlocked'));
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
        const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
        markHasSignedUpBefore();

        try {
          await trackClick('signup_success:email', { trace: true });
          markFunnelSignupCompleted('email');
        } catch {
          // ignore
        }
        tiktokTrack('CompleteRegistration');
        forceTour('onboarding-main');
        markJustSignedUp();

        void bootstrapMatchmakingApplication(cred?.user, readSignupProfile() || {});
        clearSignupProfile();

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
        await signInWithEmailAndPassword(auth, normalizedEmail, pass);

        try {
          void trackClick('signin_success:email', { trace: true });
        } catch {
          // ignore
        }

        // E-posta ile giriş sonrası mevcut kullanıcıyı Profilim'e yönlendir.
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
        setError(t('authPage.errors.emailAlreadyInUse'));
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
        host,
        path: pagePath,
        search,
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

      <section className="relative max-w-4xl mx-auto px-4 py-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-8 h-52 w-52 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.14),rgba(16,185,129,0)_62%)] blur-3xl" />
          <div className="absolute right-0 top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.16),rgba(251,191,36,0)_62%)] blur-3xl" />
        </div>
        <div className="relative overflow-hidden rounded-[30px] border border-white bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5 shadow-[0_28px_90px_rgba(15,23,42,0.10)] md:p-7">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("authPage.title")}</h1>
          <p className="text-sm text-gray-600 mt-2">
            {contextMessage}
          </p>

          <div className="mt-5 rounded-[24px] border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(255,255,255,0.96))] p-4 shadow-[0_16px_40px_rgba(16,185,129,0.08)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950">{t('authPage.trustNote.title')}</div>
            <div className="mt-2 text-sm text-emerald-950/80 leading-relaxed">{t('authPage.trustNote.body')}</div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {authSupportUi.quickFacts.map((item) => (
              <div key={item.title} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(148,163,184,0.08)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-900">{item.title}</div>
                <div className="mt-2 text-xs text-slate-600 leading-relaxed">{item.body}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4 shadow-[0_14px_38px_rgba(148,163,184,0.10)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">{authSupportUi.stepsTitle}</div>
            <div className="mt-3 space-y-2">
              {authSupportUi.steps.map((step, idx) => (
                <div key={step.title} className="flex items-start gap-3 rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
                  <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-900">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{step.title}</div>
                    <div className="mt-1 text-xs text-slate-600 leading-relaxed">{step.body}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[11px] text-slate-500">{authSupportUi.ctaNote}</div>
              <a
                href={authSupportWhatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
              >
                {authSupportUi.whatsappLabel}
              </a>
            </div>
          </div>


          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <div>{error}</div>
              <button
                type="button"
                onClick={prefillFeedbackFromError}
                className="mt-2 text-xs font-semibold text-sky-700 hover:underline"
              >
                {t('authPage.feedback.reportCta')}
              </button>
            </div>
          )}
          {info && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{info}</div>
          )}

          {import.meta.env.DEV && debugAuth ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-semibold text-slate-800">DEV: Firebase Auth debug</div>
              <div className="mt-1 text-[11px] text-slate-700">
                <span className="font-semibold">code:</span> {debugAuth.code || '-'}
              </div>
              <div className="text-[11px] text-slate-700">
                <span className="font-semibold">message:</span> {debugAuth.message || '-'}
              </div>
              {debugAuth.email ? (
                <div className="text-[11px] text-slate-700">
                  <span className="font-semibold">email:</span> {debugAuth.email}
                </div>
              ) : null}
            </div>
          ) : null}


          {needsQuickProfile ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                      const next = { ...quickProfile, hasChildren: v, childrenCount: v === 'yes' ? quickProfile.childrenCount : '' };
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

          {!user ? (
            <div className="mt-6 grid grid-cols-1 gap-3 rounded-[24px] border border-slate-200 bg-white/88 p-4 shadow-[0_16px_40px_rgba(148,163,184,0.10)]">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="w-full px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold shadow-[0_18px_40px_rgba(15,23,42,0.18)] hover:bg-slate-800 disabled:opacity-60"
              >
                {mode === 'signup' ? t('authPage.googleSignupCta') : t('authPage.googleCta')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmailFallbackVisible(true);
                  try {
                    void trackClick(mode === 'signup' ? 'signup_click_email_password' : 'login_click_email_password');
                  } catch {
                    // ignore
                  }
                }}
                disabled={busy}
                className="w-full px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold shadow-[0_10px_28px_rgba(148,163,184,0.08)] hover:bg-slate-50 disabled:opacity-60"
              >
                {mode === 'signup' ? t('authPage.emailSignupCta') : t('authPage.emailLoginCta')}
              </button>

              {mode === 'signup' ? (
                <div className="text-xs text-slate-600">{t('authPage.signupExistingAccountHint')}</div>
              ) : null}

              {emailFallbackVisible ? (
                <div className="mt-2 rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4 shadow-[0_12px_30px_rgba(148,163,184,0.08)]">
                  <div className="text-xs text-slate-500">{t('authPage.or')}</div>

                  <form onSubmit={handleEmailPassword} className="mt-3 grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">{t('authPage.labels.email')}</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        placeholder={t('authPage.placeholders.email')}
                        autoComplete="email"
                        disabled={busy}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700">{t('authPage.labels.password')}</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        placeholder={t('authPage.placeholders.password')}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        disabled={busy}
                      />
                    </div>

                    {mode === 'signup' ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700">{t('authPage.labels.confirmPassword')}</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          placeholder={t('authPage.placeholders.confirmPassword')}
                          autoComplete="new-password"
                          disabled={busy}
                        />
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
                    >
                      {mode === 'signup' ? t('authPage.actions.signup') : t('authPage.actions.login')}
                    </button>
                  </form>
                </div>
              ) : null}

              {mode === 'signup' ? (
                <div className="text-xs text-slate-600">{t('authPage.signupGuide')}</div>
              ) : null}

              <div className="text-[11px] text-slate-500">{authSupportUi.ctaNote}</div>
            </div>
          ) : null}



          {showIdSignupHelp ? (
              <details className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
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
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, hasChildren: e.target.value }))}
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

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode((m) => {
                    const next = m === 'login' ? 'signup' : 'login';
                    if (next === 'signup') {
                      tiktokTrack('SignupIntent', { source: 'login_switch' });
                      void trackClick('auth_switch_to_signup');
                    } else {
                      void trackClick('auth_switch_to_login');
                    }
                    return next;
                  });
                }}
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                {mode === "login" ? t("authPage.actions.switchToSignup") : t("authPage.actions.switchToLogin")}
              </button>
            </div>

          <div ref={feedbackSectionRef} className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
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

          <p className="mt-6 text-xs text-slate-500">
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
        </div>
      </section>

      <Footer />
    </div>
  );
}
