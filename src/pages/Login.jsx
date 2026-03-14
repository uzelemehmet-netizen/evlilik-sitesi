import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { auth, db } from "../config/firebase";
import { useAuth } from "../auth/AuthProvider";
import { isFeatureEnabled } from "../config/siteVariant";
import { authFetch } from "../utils/authFetch";
import { trackClick } from "../utils/clickTracker";
import { getAnonBrowserId } from "../utils/clickTracker";
import { tiktokPage, tiktokTrack } from "../utils/tiktokPixel";
import { buildSupportReport, openSupportReport, storeSupportReport } from "../utils/supportReport";
import { uploadImageToCloudinaryAuto } from '../utils/cloudinaryUpload';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { useSupportLine } from '../hooks/useSupportLine';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const supportLine = useSupportLine(String(i18n?.language || 'tr'));

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
  const [signupGender, setSignupGender] = useState('');

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
    // Signup ekranında email/password adımı varsayılan kapalı.
    setEmailFallbackVisible(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [mode]);

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

  const [quickProfileStage, setQuickProfileStage] = useState('form'); // form | tutorial
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
      const lines = [
        'Kayıt sorunu (Endonezya) - kısa bilgi',
        `İsim: ${pick(idSignupHelp.name) || '-'}`,
        `Yaş: ${pick(idSignupHelp.age) || '-'}`,
        `Medeni durum: ${pick(idSignupHelp.maritalStatus) || '-'}`,
        `Çocuk: ${pick(idSignupHelp.hasChildren) || '-'}`,
        `Kaç çocuk: ${pick(idSignupHelp.childrenCount) || '-'}`,
        `Meslek: ${pick(idSignupHelp.job) || '-'}`,
        `Kriter notu: ${pick(idSignupHelp.criteriaNote) || '-'}`,
      ];
      return lines.join('\n');
    } catch {
      return '';
    }
  }, [idSignupHelp]);

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

    const g = safeStr(d.gender);
    if (g) setSignupGender(g);
    if (d.completed) setQuickProfileStage('tutorial');
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
    setSignupGender(draft.gender);
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
        setQuickProfileStage('form');
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
    const draft = readQuickProfileDraft();
    if (!draft || !draft.completed) return { applied: false };

    const currentUid = safeStr(user?.uid || auth?.currentUser?.uid);
    const ownerUid = safeStr(draft?.ownerUid);
    if (!currentUid) return { applied: false };
    if (!ownerUid || ownerUid !== currentUid) return { applied: false };

    try {
      const profile = {
        fullName: safeStr(draft.fullName),
        age: draft.age,
        gender: safeStr(draft.gender),
        city: safeStr(draft.city),
        countryCode: safeStr(draft.countryCode),
        maritalStatus: safeStr(draft.maritalStatus),
        hasChildren: safeStr(draft.hasChildren),
        childrenCount: draft.childrenCount,
        occupation: safeStr(draft.occupation),
        photoUrl: safeStr(draft.photoUrl),
      };

      const data = await authFetch('/api/matchmaking-quick-profile-save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      if (data && data.ok) {
        clearQuickProfileDraft();
        return { applied: true };
      }
      return { applied: false };
    } catch (e) {
      const msg = String(e?.message || 'quick_profile_save_failed');
      storeSupportReport(
        buildSupportReport({
          kind: 'quick_profile_save_failed',
          flow,
          message: msg,
          extra: { mode, hasDraft: true },
        })
      );
      return { applied: false, error: msg };
    }
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
      const age = asNum(merged?.age);
      const gender = normalizeGender(merged?.gender);
      const city = safeStr(merged?.city);
      const country = safeStr(merged?.country);
      const nationality = safeStr(merged?.nationality);
      const occupation = safeStr(details?.occupation) || safeStr(merged?.occupation);
      const maritalStatus = normalizeMaritalStatus(details?.maritalStatus || merged?.maritalStatus);

      if (!fullName) return false;
      if (!(typeof age === 'number' && Number.isFinite(age) && age >= 18 && age <= 99)) return false;
      if (!gender) return false;
      if (!city) return false;
      if (!country) return false;
      if (!nationality) return false;
      if (!occupation) return false;
      if (!maritalStatus) return false;

      if (maritalStatus === 'widowed' || maritalStatus === 'divorced') {
        const hasChildren = safeStr(details?.hasChildren || merged?.hasChildren).toLowerCase();
        if (!hasChildren) return false;
        if (hasChildren === 'yes') {
          const cnt = asNum(details?.childrenCount);
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
      const age = asNum(app?.age);
      const gender = normalizeGender(app?.gender);
      const city = safeStr(app?.city);
      const country = safeStr(app?.country);
      const nationality = safeStr(app?.nationality);
      const occupation = safeStr(details?.occupation) || safeStr(app?.occupation);
      const maritalStatus = normalizeMaritalStatus(details?.maritalStatus || app?.maritalStatus);

      if (!fullName) return false;
      if (!(typeof age === 'number' && Number.isFinite(age) && age >= 18 && age <= 99)) return false;
      if (!gender) return false;
      if (!city) return false;
      if (!country) return false;
      if (!nationality) return false;
      if (!occupation) return false;
      if (!maritalStatus) return false;

      if (maritalStatus === 'widowed' || maritalStatus === 'divorced') {
        const hasChildren = safeStr(details?.hasChildren || app?.hasChildren).toLowerCase();
        if (!hasChildren) return false;
        if (hasChildren === 'yes') {
          const cnt = asNum(details?.childrenCount);
          if (!(typeof cnt === 'number' && Number.isFinite(cnt) && cnt >= 1 && cnt <= 20)) return false;
        }
      }

      return true;
    };

    try {
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
      const q = query(collection(db, 'matchmakingApplications'), where('userId', '==', userId), limit(10));
      const snap = await getDocs(q);
      if (snap.empty) return false;

      for (const d of snap.docs) {
        const a = d.data() || {};
        if (hasMinimumProfileInApplicationDoc(a)) return true;
      }
      return false;
    } catch (e) {
      // Hata olursa kullanıcıyı bloklamayalım; varsayılan akış devam etsin.
      return true;
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

    let cancelled = false;
    setQuickProfileCheckDone(false);

    (async () => {
      try {
        const completed = await Promise.race([
          Promise.resolve(hasCompletedApplication(uid)),
          new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
        if (cancelled) return;
        // completed: true/false; null => timeout/unknown (bloklama)
        if (completed === true) setNeedsQuickProfile(false);
        else if (completed === false) setNeedsQuickProfile(true);
        else setNeedsQuickProfile(false);
      } catch {
        if (cancelled) return;
        setNeedsQuickProfile(false);
      } finally {
        if (cancelled) return;
        setQuickProfileCheckDone(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, redirectCheckDone]);


  const readStoredRedirect = () => {
    try {
      const raw = sessionStorage.getItem('auth_redirect_target');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
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
    } catch (e) {
      // ignore
    }
  };

  const readForcedTarget = () => {
    try {
      return sessionStorage.getItem('auth_force_target') || '';
    } catch (e) {
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
    } catch (e) {
      // ignore
    }
  };

  const clearStoredRedirect = () => {
    try {
      sessionStorage.removeItem('auth_redirect_target');
    } catch (e) {
      // ignore
    }
  };

  const resolvePostAuthTarget = (isNewUser, intent) => {
    const quickCompleted = (() => {
      try {
        const d = readQuickProfileDraft();
        return !!d?.completed;
      } catch {
        return false;
      }
    })();

    // Ürün kararı (2026-02-23): Başvuru formu kayıt sonrası zorunlu.
    // Signup niyeti veya yeni kullanıcı ise, ilk adım form olsun.
    if (isFeatureEnabled('wedding') && intent === 'signup' && !quickCompleted) return '/evlilik/eslestirme-basvuru?w=1';

    const forced = readForcedTarget();
    if (forced) return forced;
    const stored = readStoredRedirect();
    const candidate = stored?.from || redirectTarget.from || '';

    // Yeni kayıt: ilk adım başvuru formu.
    if (isFeatureEnabled('wedding') && isNewUser && !quickCompleted) return '/evlilik/eslestirme-basvuru?w=1';

    // Kullanıcı "başvuru" sayfasına gitmek istediyse onu koru.
    if (isMatchmakingApplyPath(candidate)) return candidate;

    // Mevcut kullanıcıyı (ve yeni kullanıcıyı) her zaman profil sayfasına götür.
    // Böylece Google login sonrası anasayfaya dönüp "form yükleniyor" gibi geçişler yaşanmaz.
    return '/profilim';
  };

  const resolvePostAuthState = () => {
    const stored = readStoredRedirect();
    return stored?.fromState || redirectTarget.fromState || null;
  };

  // Not: 2026-02 ürün kararındaki "signup sonrası forma zorlamama" akışı geri alındı.

  const navigateNext = (target, state) => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    const finalTarget = target || redirectTarget.from || '/profilim';
    const finalState = typeof state === 'undefined' ? redirectTarget.fromState : state;
    navigate(finalTarget, { replace: true, state: finalState });
  };

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

      // Başka bir yere gidiyor ama profili eksikse formu zorunlu aç.
      if (completed === false && !isMatchmakingApplyPath(next)) {
        next = '/evlilik/eslestirme-basvuru?w=1';
        state = null;
      }
    }

    navigateNext(next, state);
  };
  const resolveAuthLanguage = (lang) => {
    const key = String(lang || '').toLowerCase();
    if (key.startsWith('tr')) return 'tr';
    if (key.startsWith('id')) return 'id';
    return 'en';
  };

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

    const nextLookingForRaw = String(profile?.lookingForGender || '').trim().toLowerCase();
    const nextLookingFor = nextLookingForRaw === 'male' || nextLookingForRaw === 'female' ? nextLookingForRaw : null;

    const payload = {
      ...(typeof existingAge === 'number' ? {} : nextAge !== null ? { age: nextAge } : {}),
      ...(hasGender ? {} : nextGender ? { gender: nextGender } : {}),
      ...(String(data?.lookingForGender || '').trim() ? {} : nextLookingFor ? { lookingForGender: nextLookingFor } : {}),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [forceLogin, user]);

  useEffect(() => {
    if (redirectFinalizeOnceRef.current) return;
    redirectFinalizeOnceRef.current = true;

    let isActive = true;

    const finalizeRedirect = async () => {
      authFlowBusyRef.current = true;
      const provider = readAuthProvider() || 'google';
      const providerLabel = provider === 'google' ? 'google' : 'google';
      try {
        const r = await Promise.race([
          Promise.resolve(getRedirectResult(auth)).then((result) => ({ timeout: false, result })),
          new Promise((resolve) => setTimeout(() => resolve({ timeout: true, result: null }), 8000)),
        ]);

        // Bazı in-app tarayıcılarda getRedirectResult hiç resolve olmayabiliyor.
        // Timeout durumunda sessizce devam edip diğer effect'lerin yönlendirmesine izin veriyoruz.
        if (r?.timeout) return;

        const result = r?.result;
        if (result?.user && isActive) {
          clearAuthProvider();

          const info2 = getAdditionalUserInfo(result);
          const isNewUser = !!info2?.isNewUser;

          // Redirect akışında sayfa yenilendiği için mode kaybolabilir.
          // Bu yüzden intent'i (login/signup) sessionStorage üzerinden okuyoruz.
          const intent = readAuthIntent() || 'login';
          clearAuthIntent();

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
            await trackClick(`signup_success:${providerLabel}_redirect`);
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
              void trackClick(`signup_error:google_redirect:${code || 'profile_save_failed'}`);

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

          const target = resolvePostAuthTarget(isNewUser, isNewUser ? 'signup' : intent);
          const state = isNewUser ? null : resolvePostAuthState();
          clearStoredRedirect();
          writeForcedTarget('');
          // Navigasyonu burada yapmıyoruz; hızlı profil kontrolü (needsQuickProfile)
          // tamamlanınca üstteki effect tek sefer yönlendirecek.
        }
      } catch (e) {
        const code = String(e?.code || '').trim();
        const msg = String(e?.message || '').trim();

        // Redirect flow'da hata olursa eskiden tamamen yutuluyordu.
        // Bu da “kayıt olmuyorlar ama sebep göremiyoruz” sorununa yol açıyor.
        const intent = readAuthIntent() || 'login';

        if (intent === 'signup') {
          void trackClick(`signup_error:${providerLabel}_redirect:${code || 'unknown'}`);
        } else {
          void trackClick(`login_error:${providerLabel}_redirect:${code || 'unknown'}`);
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

        if (intent === 'signup') {
          setError(t('authPage.errors.googleFailed'));
          setEmailFallbackVisible(true);
        }
      } finally {
        authFlowBusyRef.current = false;
        if (isActive) setRedirectCheckDone(true);
      }
    };

    finalizeRedirect();
    return () => {
      isActive = false;
    };
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
          const target = resolvePostAuthTarget(false, mode);
          const state = resolvePostAuthState();
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

  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (authFlowBusyRef.current) return;
    const current = auth?.currentUser || null;
    if (!current) return;
    if (!quickProfileCheckDone) return;
    if (needsQuickProfile) return;
    // Eğer daha önce signup akışında hedef zorlandıysa (auth_force_target),
    // burada tek sefer kullanıp hemen temizlemeliyiz; aksi halde kullanıcı
    // sonraki girişlerde de sürekli forma itilir.
    (async () => {
      try {
        const forced = readForcedTarget();
        const target = forced || resolvePostAuthTarget(false, mode);
        const state = resolvePostAuthState();
        clearStoredRedirect();
        writeForcedTarget('');
        await navigateNextWithApplyGuard(current?.uid, target, state);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectTarget.from, redirectTarget.fromState, mode, needsQuickProfile, quickProfileCheckDone]);

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

    try {
      clearSignupProfile();

      if (mode === 'signup') {
        tiktokTrack('SignupStart', { method: 'google', source: 'login' });
        void trackClick('signup_start:google');
      } else {
        void trackClick('login_start:google');
      }

      writeAuthIntent(mode);
      writeForcedTarget('');

      const provider = new GoogleAuthProvider();

      const isTikTokInApp = (() => {
        try {
          const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
          return /trill[_\s/\-]?|tiktok/i.test(ua);
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

      if (isTikTokInApp || isIOS) {
        try {
          setInfo(t('authPage.infos.inAppBrowserGoogleRedirect'));
        } catch {
          setInfo(t('authPage.redirecting'));
        }
        writeAuthProvider('google');
        await signInWithRedirect(auth, provider);
        return;
      }

      const result = await signInWithPopup(auth, provider);
      const info2 = getAdditionalUserInfo(result);
      const isNewUser = !!info2?.isNewUser;

      if (isNewUser && mode !== 'signup') {
        try {
          void trackClick('signup_auto:google_popup_from_login_intent');
        } catch {
          // ignore
        }
      }

      if (isNewUser) {
        markHasSignedUpBefore();
        await trackClick('signup_success:google');
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
          void trackClick(`signup_error:google_popup:${code || 'profile_save_failed'}`);

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
      }
    } catch (e) {
      const code = String(e?.code || '').trim();
      const msg = String(e?.message || '').trim();

      if (mode === 'signup') {
        void trackClick(`signup_error:google_popup:${code || 'unknown'}`);
      } else {
        void trackClick(`login_error:google_popup:${code || 'unknown'}`);
      }

      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/argument-error'
      ) {
        try {
          const provider2 = new GoogleAuthProvider();
          setInfo(t('authPage.redirecting'));
          writeForcedTarget('');
          writeAuthIntent(mode);
          writeAuthProvider('google');
          await signInWithRedirect(auth, provider2);
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
          if (mode === 'signup') setEmailFallbackVisible(true);
          return;
        }
      }

      if (code === 'auth/unauthorized-domain') {
        void reportAuthIssue({ kind: 'auth_google_unauthorized_domain', flow: 'google_popup', code, message: msg, intent: mode });
        const host = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
        setError(
          t('authPage.errors.googleUnauthorizedDomain', {
            host: host || t('authPage.errors.domainNotFound'),
          })
        );
        if (mode === 'signup') setEmailFallbackVisible(true);
        return;
      }

      if (code === 'auth/operation-not-allowed') {
        void reportAuthIssue({ kind: 'auth_google_operation_not_allowed', flow: 'google_popup', code, message: msg, intent: mode });
        setError(t('authPage.errors.googleOperationNotAllowed'));
        if (mode === 'signup') setEmailFallbackVisible(true);
        return;
      }

      if (code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found') {
        void reportAuthIssue({ kind: 'auth_invalid_firebase_config', flow: 'google_popup', code, message: msg, intent: mode });
        setError(t('authPage.errors.firebaseAuthInvalidConfig'));
        if (mode === 'signup') setEmailFallbackVisible(true);
        return;
      }

      if (code === 'auth/too-many-requests') {
        setError(t('authPage.errors.rateLimited'));
        if (mode === 'signup') setEmailFallbackVisible(true);
        return;
      }

      if (code === 'auth/network-request-failed') {
        setError(t('authPage.errors.networkFailed'));
        if (mode === 'signup') setEmailFallbackVisible(true);
        return;
      }

      setError(msg || t('authPage.errors.googleFailed'));
      if (mode === 'signup') setEmailFallbackVisible(true);
    } finally {
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

      if (mode === 'signup') {
        if (pass !== pass2) {
          setError(t('authPage.errors.passwordsDoNotMatch'));
          return;
        }

        void trackClick('signup_start:email_password');
        const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
        markHasSignedUpBefore();

        try {
          await trackClick('signup_success:email_password');
        } catch {
          // ignore
        }
        tiktokTrack('CompleteRegistration');
        forceTour('onboarding-main');
        markJustSignedUp();

        void bootstrapMatchmakingApplication(cred?.user, readSignupProfile() || {});
        clearSignupProfile();
      } else {
        void trackClick('login_start:email_password');
        await signInWithEmailAndPassword(auth, normalizedEmail, pass);
        void trackClick('login_success:email_password');
      }
    } catch (e2) {
      const code = String(e2?.code || '').trim();
      const msg = String(e2?.message || '').trim();

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

      setError(msg || t('authPage.errors.loginFailed'));
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
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/40">
      <Navigation />

      <section className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t("authPage.title")}</h1>
          <p className="text-sm text-gray-600 mt-2">
            {contextMessage}
          </p>


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
                      setQuickProfileStage('form');
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
                      setQuickProfileStage('form');
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
                      setQuickProfileStage('form');
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
                      setQuickProfileStage('form');
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
                      setQuickProfileStage('form');
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
                      setQuickProfileStage('form');
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
                      setQuickProfileStage('form');
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
                        setQuickProfileStage('form');
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
                      setQuickProfileStage('form');
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
            <div className="mt-5 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="w-full px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
              >
                {mode === 'signup' ? t('authPage.googleSignupCta') : t('authPage.googleCta')}
              </button>

              {mode === 'signup' ? (
                <div className="text-xs text-slate-600">{t('authPage.signupExistingAccountHint')}</div>
              ) : null}

              {mode === 'signup' && !emailFallbackVisible ? (
                <button
                  type="button"
                  onClick={() => {
                    setEmailFallbackVisible(true);
                    try {
                      void trackClick('signup_show_email_fallback');
                    } catch {
                      // ignore
                    }
                  }}
                  disabled={busy}
                  className="text-left text-xs font-semibold text-sky-700 hover:underline disabled:opacity-60"
                >
                  {t('authPage.actions.showEmailFallback')}
                </button>
              ) : null}

              {mode === 'login' || emailFallbackVisible ? (
                <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
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
            </div>
          ) : null}



          {showIdSignupHelp ? (
              <details className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <summary className="cursor-pointer select-none text-xs font-semibold text-emerald-900">
                  Kayıt sırasında sorun mu yaşıyorsun? (Endonezya) WhatsApp’tan kısa form gönder
                </summary>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">İsim</label>
                    <input
                      value={idSignupHelp.name}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, name: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Adınız"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Yaş</label>
                    <input
                      value={idSignupHelp.age}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, age: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Örn: 28"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Medeni durum</label>
                    <input
                      value={idSignupHelp.maritalStatus}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, maritalStatus: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Bekar / Boşanmış / Dul"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Çocuk var mı?</label>
                    <select
                      value={idSignupHelp.hasChildren}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, hasChildren: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">Seçiniz</option>
                      <option value="yok">Yok</option>
                      <option value="var">Var</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Kaç çocuk?</label>
                    <input
                      value={idSignupHelp.childrenCount}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, childrenCount: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Örn: 1"
                      inputMode="numeric"
                      autoComplete="off"
                      disabled={String(idSignupHelp.hasChildren || '') !== 'var'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Meslek</label>
                    <input
                      value={idSignupHelp.job}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, job: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Örn: öğretmen"
                      autoComplete="off"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">Aradığı kişide kriterler (kısa not)</label>
                    <textarea
                      value={idSignupHelp.criteriaNote}
                      onChange={(e) => setIdSignupHelp((p) => ({ ...p, criteriaNote: e.target.value }))}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Kısa not..."
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-600">
                      Bu form mesajı Endonezya WhatsApp hattına gönderir.
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
                      WhatsApp’tan gönder
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
            {t("authPage.legal.prefix")}
            <span className="ml-1">
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
