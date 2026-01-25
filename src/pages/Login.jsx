import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
  getRedirectResult,
  sendPasswordResetEmail,
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

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const hasNavigatedRef = useRef(false);
  const authFlowBusyRef = useRef(false);
  const signupSectionRef = useRef(null);
  const signupGenderFirstRef = useRef(null);

  const redirectTarget = useMemo(() => {
    const state = location.state || {};
    return {
      from: state.from || "/profilim",
      fromState: state.fromState || null,
    };
  }, [location.state]);

  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupGender, setSignupGender] = useState(""); // male | female
  const [signupNationality, setSignupNationality] = useState(""); // tr | id | other
  const [signupNationalityOther, setSignupNationalityOther] = useState("");
  const [signupAgeConfirmed, setSignupAgeConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [forceLogin, setForceLogin] = useState(false);
  const [signupNudge, setSignupNudge] = useState(0);
  const [signupHighlight, setSignupHighlight] = useState(false);

  const requiredSignupAge = useMemo(() => {
    if (signupNationality === 'id') return 21;
    // TR ve diğer ülkeler için varsayılan 18+
    return 18;
  }, [signupNationality]);

  const isSignupReady = useMemo(() => {
    if (mode !== 'signup') return true;
    if (signupGender !== 'male' && signupGender !== 'female') return false;
    if (!signupNationality) return false;
    if (signupNationality === 'other' && !signupNationalityOther.trim()) return false;
    if (!signupAgeConfirmed) return false;
    return true;
  }, [mode, signupGender, signupNationality, signupNationalityOther, signupAgeConfirmed]);

  const nudgeSignupUI = () => {
    setSignupNudge((n) => n + 1);
  };

  const isMatchmakingApplyPath = (p) => {
    const path = String(p || '').trim();
    return (
      path === '/wedding/apply' ||
      path === '/evlilik/eslestirme-basvuru' ||
      path === '/evlilik/eslestirme-basvurusu'
    );
  };

  const hasExistingApplication = async (uid) => {
    if (!uid) return false;
    try {
      const q = query(collection(db, 'matchmakingApplications'), where('userId', '==', uid), limit(1));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (e) {
      // Hata olursa kullanıcıyı bloklamayalım; varsayılan akış devam etsin.
      return false;
    }
  };


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
  const SIGNUP_PROFILE_KEY = 'auth_signup_profile';

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

  const showNoAccountFoundMessage = () => {
    setInfo('');
    setError('Kaydınız bulunamadı. Kayıt olmanız gerekiyor. Kayıt adımına yönlendirildiniz; lütfen cinsiyet/ülke seçip yaş onayını işaretleyin ve tekrar deneyin.');
    nudgeSignupUI();
  };

  useEffect(() => {
    if (mode !== 'signup') return;
    if (!signupNudge) return;

    setSignupHighlight(true);
    const timer = setTimeout(() => setSignupHighlight(false), 3500);

    const run = () => {
      try {
        signupSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // İlk alana odaklan
        setTimeout(() => {
          try {
            signupGenderFirstRef.current?.focus?.();
          } catch {
            // ignore
          }
        }, 200);
      } catch {
        // ignore
      }
    };

    // Render sonrası
    setTimeout(run, 0);
    return () => clearTimeout(timer);
  }, [mode, signupNudge]);

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

  const resolvePostAuthTarget = (isNewUser) => {
    const forced = readForcedTarget();
    if (forced) return forced;
    const stored = readStoredRedirect();
    const candidate = stored?.from || redirectTarget.from || '';

    // Ödeme / rezervasyon gibi akışlarda, kullanıcının kaldığı yerden devam etmesi daha doğru.
    if (candidate === '/payment' || candidate.startsWith('/payment/')) return candidate;
    if (candidate === '/rezervasyonlar' || candidate.startsWith('/rezervasyonlar/')) return candidate;

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

  const SIGNUP_FORM_TARGET = '/evlilik/eslestirme-basvuru';

  const navigateNext = (target, state) => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    const finalTarget = target || redirectTarget.from || '/profilim';
    const finalState = typeof state === 'undefined' ? redirectTarget.fromState : state;
    navigate(finalTarget, { replace: true, state: finalState });
  };

  const navigateNextWithApplyGuard = async (uid, target, state) => {
    let next = target;
    if (isMatchmakingApplyPath(next)) {
      const exists = await hasExistingApplication(uid);
      if (exists) {
        next = '/profilim';
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

  const ensureProfileSaved = async (uid, gender, nationality, nationalityOther) => {
    if (!uid) return;
    if (gender !== "male" && gender !== "female") return;

    const ref = doc(db, "matchmakingUsers", uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() || {} : {};
    const existingGender = String(data?.gender || "").toLowerCase().trim();
    const existingNationality = String(data?.nationality || "").toLowerCase().trim();
    const existingNationalityOther = String(data?.nationalityOther || "").trim();
    if (existingGender && existingNationality) return;

    const payload = {
      gender: existingGender || gender,
      nationality: existingNationality || String(nationality || '').trim(),
      nationalityOther: existingNationalityOther || String(nationalityOther || '').trim(),
      updatedAt: serverTimestamp(),
    };

    // createdAt sadece ilk oluşturma anında set edilsin (rules tarafını ve audit'i sadeleştirir).
    if (!snap.exists()) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(ref, payload, { merge: true });
  };

  const contextMessage = useMemo(() => {
    const from = redirectTarget.from || "/profilim";

    if (from === "/payment") {
      return t("authPage.context.payment");
    }

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
    }

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
    let isActive = true;

    const finalizeRedirect = async () => {
      authFlowBusyRef.current = true;
      try {
        const result = await getRedirectResult(auth);
        if (result?.user && isActive) {
          const info2 = getAdditionalUserInfo(result);
          const isNewUser = !!info2?.isNewUser;

          // Redirect akışında sayfa yenilendiği için mode kaybolabilir.
          // Bu yüzden intent'i (login/signup) sessionStorage üzerinden okuyoruz.
          const intent = readAuthIntent() || 'login';
          clearAuthIntent();

          if (isNewUser && intent !== 'signup') {
            // Login intent'iyle gelen yeni kullanıcıyı engelle: kayıt akışına yönlendir.
            try {
              // Firebase Auth, Google ile ilk kez girişte user oluşturur.
              // Login modunda bunu istemiyoruz; kayıt adımında (cinsiyet/ülke/yaş) zorunlu alanlar var.
              // Bu yüzden user'ı silip logout ediyoruz.
              // deleteUser import etmeden, auth state'i temizleyip kullanıcıyı signup'a yönlendiriyoruz.
              await signOut(auth);
            } catch {
              // ignore
            }
            clearStoredRedirect();
            writeForcedTarget('');
            clearSignupProfile();
            setMode('signup');
            showNoAccountFoundMessage();
            return;
          }

          if (isNewUser && intent === 'signup') {
            const p = readSignupProfile() || {};
            clearSignupProfile();
            await ensureProfileSaved(result?.user?.uid, p?.gender, p?.nationality, p?.nationalityOther);
          }

          const target = resolvePostAuthTarget(isNewUser);
          const state = isNewUser ? null : resolvePostAuthState();
          clearStoredRedirect();
          writeForcedTarget('');
          await navigateNextWithApplyGuard(result?.user?.uid, target, state);
        }
      } catch (e) {
        // ignore redirect result errors
      } finally {
        authFlowBusyRef.current = false;
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
    if (authFlowBusyRef.current) return;
    if (user) {
      (async () => {
        const target = resolvePostAuthTarget(false);
        const state = resolvePostAuthState();
        clearStoredRedirect();
        writeForcedTarget('');
        await navigateNextWithApplyGuard(user?.uid, target, state);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (hasNavigatedRef.current) return;
    if (authFlowBusyRef.current) return;
    const current = auth?.currentUser || null;
    if (!current) return;
    // Eğer daha önce signup akışında hedef zorlandıysa (auth_force_target),
    // burada tek sefer kullanıp hemen temizlemeliyiz; aksi halde kullanıcı
    // sonraki girişlerde de sürekli forma itilir.
    (async () => {
      const forced = readForcedTarget();
      const target = forced || resolvePostAuthTarget(false);
      const state = resolvePostAuthState();
      clearStoredRedirect();
      writeForcedTarget('');
      await navigateNextWithApplyGuard(current?.uid, target, state);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectTarget.from, redirectTarget.fromState]);

  if (user) return null;

  const resolveLanguageFromNationality = (value) => {
    if (value === 'tr') return 'tr';
    if (value === 'id') return 'id';
    return 'en';
  };

  const handleNationalityChange = (value) => {
    setSignupNationality(value);
    setSignupAgeConfirmed(false);
    if (value !== 'other') {
      setSignupNationalityOther('');
    }
    const nextLang = resolveLanguageFromNationality(value);
    try {
      localStorage.setItem('preferred_lang_source', 'signup');
    } catch {
      // ignore
    }
    i18n.changeLanguage(nextLang);
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      // Login modunda Google ile "ilk kez" giriş, Firebase Auth tarafında kullanıcı yaratır.
      // Bizde kayıt adımında (cinsiyet/ülke/yaş) zorunlu olduğu için önce signup'a yönlendir.
      if (mode !== 'signup') {
        setMode('signup');
        showNoAccountFoundMessage();
        return;
      }

      if (mode === "signup" && signupGender !== "male" && signupGender !== "female") {
        setError(t("authPage.errors.genderRequired"));
        return;
      }
      if (mode === "signup" && !signupNationality) {
        setError(t("authPage.errors.nationalityRequired"));
        return;
      }
      if (mode === "signup" && signupNationality === 'other' && !signupNationalityOther.trim()) {
        setError(t("authPage.errors.nationalityOtherRequired"));
        return;
      }
      if (mode === 'signup' && !signupAgeConfirmed) {
        setError(t('authPage.errors.ageConfirmRequired', { minAge: requiredSignupAge }));
        return;
      }

      if (mode === 'signup') {
        writeSignupProfile({
          gender: signupGender,
          nationality: signupNationality,
          nationalityOther: signupNationalityOther,
        });
      } else {
        clearSignupProfile();
      }

      writeAuthIntent(mode);

      // Yeni kullanıcı signup akışında form sayfasını zorla; normal login'de mevcut hedefi bozma.
      writeForcedTarget(mode === 'signup' ? SIGNUP_FORM_TARGET : '');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const info2 = getAdditionalUserInfo(result);

      if (mode === "signup" && info2?.isNewUser) {
        await ensureProfileSaved(result?.user?.uid, signupGender, signupNationality, signupNationalityOther);
      }
      const target = resolvePostAuthTarget(!!info2?.isNewUser);
      const state = info2?.isNewUser ? null : resolvePostAuthState();
      clearStoredRedirect();
      writeForcedTarget('');
      clearAuthIntent();
      clearSignupProfile();
      await navigateNextWithApplyGuard(result?.user?.uid, target, state);
    } catch (e) {
      const code = String(e?.code || "").trim();

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError(t('authPage.errors.invalidCredential'));
        return;
      }

      // Popup engellenirse veya argument-error olursa redirect ile devam et.
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/argument-error') {
        try {
          const provider = new GoogleAuthProvider();
          setInfo(t('authPage.redirecting') || 'Yönlendiriliyor…');
          // Popup fallback: sadece signup akışında form hedefini zorla.
          writeForcedTarget(mode === 'signup' ? SIGNUP_FORM_TARGET : '');
          writeAuthIntent(mode);
          if (mode === 'signup') {
            writeSignupProfile({
              gender: signupGender,
              nationality: signupNationality,
              nationalityOther: signupNationalityOther,
            });
          } else {
            clearSignupProfile();
          }
          await signInWithRedirect(auth, provider);
          return;
        } catch (e2) {
          const host = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
          setError(
            e2?.message ||
              `Google ile giriş başarısız (${code}).\n\nFirebase Console → Authentication → Settings → Authorized domains kısmına bu domain'i ekleyin: ${host || '(domain bulunamadı)'}\nAyrıca .env ve Vercel env'de VITE_FIREBASE_AUTH_DOMAIN değerini kontrol edin.`
          );
          return;
        }
      }

      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? String(window.location.hostname || '') : '';
        setError(
          `Google ile giriş başarısız (unauthorized-domain).\n\nFirebase Console → Authentication → Settings → Authorized domains kısmına bu domain'i ekleyin: ${host || '(domain bulunamadı)'}`
        );
        return;
      }

      if (code === 'auth/operation-not-allowed') {
        setError('Google ile giriş kapalı. Firebase Console → Authentication → Sign-in method → Google sağlayıcısını etkinleştirin.');
        return;
      }

      if (code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found') {
        setError('Firebase Auth yapılandırması geçersiz. `.env.local` içindeki `VITE_FIREBASE_*` değerlerini kontrol edin.');
        return;
      }

      setError(e?.message || t("authPage.errors.googleFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");

    try {
      if (!email || !password) {
        setError(t("authPage.errors.emailPasswordRequired"));
        return;
      }

      if (mode === "signup" && signupGender !== "male" && signupGender !== "female") {
        setError(t("authPage.errors.genderRequired"));
        return;
      }
      if (mode === "signup" && !signupNationality) {
        setError(t("authPage.errors.nationalityRequired"));
        return;
      }
      if (mode === "signup" && signupNationality === 'other' && !signupNationalityOther.trim()) {
        setError(t("authPage.errors.nationalityOtherRequired"));
        return;
      }

      if (mode === 'signup' && !signupAgeConfirmed) {
        setError(t('authPage.errors.ageConfirmRequired', { minAge: requiredSignupAge }));
        return;
      }

      if (mode === "signup") {
        // Signup'ta zaten kayıtlı email ise kullanıcıyı uyar.
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (Array.isArray(methods) && methods.length > 0) {
          setError(t('authPage.errors.emailAlreadyInUse'));
          return;
        }
        // Yeni kullanıcı kaydı sonrası her zaman form sayfasına yönlendir.
        // (Kullanıcı login'e hangi sayfadan gelmiş olursa olsun.)
        writeForcedTarget(SIGNUP_FORM_TARGET);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await ensureProfileSaved(cred?.user?.uid, signupGender, signupNationality, signupNationalityOther);
        clearAuthIntent();
        clearSignupProfile();
      } else {
        // Login'de email hiç kayıtlı değilse "kaydınız bulunamadı" uyar.
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (!Array.isArray(methods) || methods.length === 0) {
          setMode('signup');
          showNoAccountFoundMessage();
          return;
        }
        await signInWithEmailAndPassword(auth, email, password);
        clearAuthIntent();
        clearSignupProfile();
      }
      // Navigasyonu burada yapmıyoruz; auth state değişince üstteki effect tek sefer yönlendirecek.
      return;
    } catch (e2) {
      const code = String(e2?.code || '').trim();

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError(t('authPage.errors.invalidCredential'));
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

      if (code === 'auth/invalid-email') {
        setError(t('authPage.errors.invalidEmail'));
        return;
      }

      setError(e2?.message || t('authPage.errors.loginFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (!email) {
        setError(t("authPage.errors.resetEmailRequired"));
        return;
      }
      auth.languageCode = resolveAuthLanguage(i18n?.language);
      await sendPasswordResetEmail(auth, email);
      setInfo(t("authPage.resetSent"));
    } catch (e) {
      setError(e?.message || t("authPage.errors.resetFailed"));
    } finally {
      setBusy(false);
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
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>
          )}
          {info && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{info}</div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy || (mode === 'signup' && !isSignupReady)}
              className="w-full px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {mode === 'signup' ? t('authPage.googleSignupCta') : t("authPage.googleCta")}
            </button>

            {mode === 'signup' && (
              <div className="text-xs text-slate-600">
                {t('authPage.signupGuide')}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-500">{t("authPage.or")}</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleEmailAuth} className="mt-6 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">{t("authPage.labels.email")}</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder={t("authPage.placeholders.email")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">{t("authPage.labels.password")}</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder={t("authPage.placeholders.password")}
              />
            </div>

            {/* Signup alanları için anchor */}
            <div ref={signupSectionRef} />

            {mode === "signup" && (
              <div
                className={[
                  'rounded-2xl p-3 -mx-1',
                  signupHighlight ? 'bg-amber-50 ring-2 ring-amber-300 ring-offset-2 ring-offset-white transition' : '',
                ].join(' ')}
              >
                <label className="block text-xs font-semibold text-slate-700">{t("authPage.labels.gender")}</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${
                      signupGender === "male" ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-white"
                    }`}
                  >
                    <input
                      ref={signupGenderFirstRef}
                      type="radio"
                      name="signupGender"
                      value="male"
                      checked={signupGender === "male"}
                      onChange={() => setSignupGender("male")}
                    />
                    <span>{t("authPage.signup.genderMale")}</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${
                      signupGender === "female" ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="signupGender"
                      value="female"
                      checked={signupGender === "female"}
                      onChange={() => setSignupGender("female")}
                    />
                    <span>{t("authPage.signup.genderFemale")}</span>
                  </label>
                </div>
              </div>
            )}

            {mode === "signup" && (
              <div
                className={[
                  'rounded-2xl p-3 -mx-1',
                  signupHighlight ? 'bg-amber-50 ring-2 ring-amber-300 ring-offset-2 ring-offset-white transition' : '',
                ].join(' ')}
              >
                <label className="block text-xs font-semibold text-slate-700">{t("authPage.labels.nationality")}</label>
                <select
                  value={signupNationality}
                  onChange={(e) => handleNationalityChange(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('authPage.placeholders.nationality')}</option>
                  <option value="tr">{t('authPage.signup.nationalityTr')}</option>
                  <option value="id">{t('authPage.signup.nationalityId')}</option>
                  <option value="other">{t('authPage.signup.nationalityOther')}</option>
                </select>
              </div>
            )}

            {mode === "signup" && signupNationality === 'other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t("authPage.labels.nationalityOther")}</label>
                <input
                  value={signupNationalityOther}
                  onChange={(e) => setSignupNationalityOther(e.target.value)}
                  type="text"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder={t('authPage.placeholders.nationalityOther')}
                />
              </div>
            )}

            {mode === 'signup' && !!signupNationality && (
              <label
                className={[
                  'flex items-start gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer',
                  signupAgeConfirmed ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 bg-white',
                  signupHighlight ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-white transition' : '',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={signupAgeConfirmed}
                  onChange={(e) => setSignupAgeConfirmed(!!e.target.checked)}
                />
                <span>
                  {t('authPage.signup.ageConfirm', { minAge: requiredSignupAge })}{' '}
                  <a
                    href="/docs/matchmaking-kullanim-sozlesmesi.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-700 hover:underline"
                  >
                    {t('authPage.signup.ageConfirmLink')}
                  </a>
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full px-5 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
            >
              {mode === "signup" ? t("authPage.actions.signup") : t("authPage.actions.login")}
            </button>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                {mode === "login" ? t("authPage.actions.switchToSignup") : t("authPage.actions.switchToLogin")}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={busy}
                className="text-xs font-semibold text-slate-600 hover:underline disabled:opacity-60"
              >
                {t("authPage.actions.forgot")}
              </button>
            </div>
          </form>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs text-slate-700">
              {t("authPage.forgotHint.prefix")}{" "}
              <span className="font-semibold">{t("authPage.actions.forgot")}</span>{" "}
              {t("authPage.forgotHint.suffix")}
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            {t("authPage.legal.prefix")}
            <span className="ml-1">
              {isFeatureEnabled('travel') ? (
                <>
                  <a href="/docs/paket-tur-sozlesmesi.html" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
                    {t("authPage.legal.contract")}
                  </a>
                  <span className="mx-1">·</span>
                  <a href="/docs/iptal-iade-politikasi.html" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
                    {t("authPage.legal.cancelRefund")}
                  </a>
                </>
              ) : (
                <>
                  <a href="/docs/matchmaking-kullanim-sozlesmesi.html" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
                    {t("authPage.legal.contract")}
                  </a>
                  <span className="mx-1">·</span>
                  <a href="/docs/iptal-iade-politikasi.html" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
                    {t("authPage.legal.cancelRefund")}
                  </a>
                </>
              )}
              <span className="mx-1">·</span>
              <Link to="/privacy" className="text-sky-700 hover:underline">
                {t("authPage.legal.privacy")}
              </Link>
            </span>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
