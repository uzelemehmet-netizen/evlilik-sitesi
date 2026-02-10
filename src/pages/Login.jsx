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
import { authFetch } from "../utils/authFetch";

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const hasNavigatedRef = useRef(false);
  const authFlowBusyRef = useRef(false);
  const signupSectionRef = useRef(null);
  const signupAgeFirstRef = useRef(null);

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupAge, setSignupAge] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [debugAuth, setDebugAuth] = useState(null);
  const [redirectCheckDone, setRedirectCheckDone] = useState(false);
  const [forceLogin, setForceLogin] = useState(false);
  const [signupNudge, setSignupNudge] = useState(0);
  const [signupHighlight, setSignupHighlight] = useState(false);

  const requiredSignupAge = 18;

  const isSignupReady = useMemo(() => {
    if (mode !== 'signup') return true;
    const n = Number(String(signupAge || '').trim());
    if (!Number.isFinite(n)) return false;
    if (!Number.isInteger(n)) return false;
    if (n < requiredSignupAge) return false;
    if (n > 99) return false;
    return true;
  }, [mode, signupAge]);

  const nudgeSignupUI = () => {
    setSignupNudge((n) => n + 1);
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
    if (!uid) return false;
    try {
      const q = query(collection(db, 'matchmakingApplications'), where('userId', '==', uid), limit(10));
      const snap = await getDocs(q);
      if (snap.empty) return false;

      // "auto_stub" / autoBootstrap başvurular gerçek profil sayılmaz.
      for (const d of snap.docs) {
        const a = d.data() || {};
        const source = String(a?.source || '').trim().toLowerCase();
        const isStub = source === 'auto_stub' || a?.details?.autoBootstrap === true;
        if (!isStub) return true;
      }
      return false;
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
  const REFERRAL_CODE_KEY = 'auth_referral_code';

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
    setError(t('authPage.errors.noAccountFoundSignupRequired'));
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
            signupAgeFirstRef.current?.focus?.();
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

    // Yeni kayıt: kayıt sonrası ilk adım profil formu.
    if (isNewUser) return '/evlilik/eslestirme-basvuru?w=1';

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

  const navigateNextWithApplyGuard = async (uid, target, state) => {
    let next = target;
    if (isMatchmakingApplyPath(next)) {
      const exists = await hasCompletedApplication(uid);
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

  const ensureProfileSaved = async (uid, age) => {
    if (!uid) return;

    const ref = doc(db, "matchmakingUsers", uid);
    const snap = await getDoc(ref);
    const data = snap.exists() ? snap.data() || {} : {};
    const existingAge = typeof data?.age === 'number' ? data.age : null;
    if (typeof existingAge === 'number') return;

    const parsedAge = Number(String(age ?? '').trim());
    const nextAge = Number.isFinite(parsedAge) && Number.isInteger(parsedAge) ? parsedAge : null;

    const payload = {
      ...(typeof existingAge === 'number' ? {} : nextAge !== null ? { age: nextAge } : {}),
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
            await ensureProfileSaved(result?.user?.uid, p?.age);
            await acceptReferralIfAny();
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
    if (user) {
      (async () => {
        const treatAsNew = mode === 'signup';
        const target = resolvePostAuthTarget(treatAsNew);
        const state = resolvePostAuthState();
        clearStoredRedirect();
        writeForcedTarget('');
        await navigateNextWithApplyGuard(user?.uid, target, state);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, redirectCheckDone, mode]);

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
      const treatAsNew = mode === 'signup';
      const target = forced || resolvePostAuthTarget(treatAsNew);
      const state = resolvePostAuthState();
      clearStoredRedirect();
      writeForcedTarget('');
      await navigateNextWithApplyGuard(current?.uid, target, state);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectTarget.from, redirectTarget.fromState, mode]);

  if (user) {
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
    setError("");
    setInfo("");
    try {
      // Popup akışını redirect akışıyla tutarlı tut:
      // - Login intent'i ile gelen yeni kullanıcıyı signup'a yönlendir (bizde signup zorunlu alanlar var).
      // - Mevcut kullanıcıysa (isNewUser=false) login modunda Google ile girişe izin ver.
      const intent = mode;
      if (mode === 'signup') {
        const n = Number(String(signupAge || '').trim());
        if (!Number.isFinite(n) || !Number.isInteger(n) || n > 99) {
          setError(t('authPage.errors.ageRequired'));
          return;
        }
        if (n < requiredSignupAge) {
          setError(t('authPage.errors.ageMin', { minAge: requiredSignupAge }));
          return;
        }
      }

      if (mode === 'signup') {
        writeSignupProfile({
          age: Number(String(signupAge || '').trim()),
        });
      } else {
        clearSignupProfile();
      }

      writeAuthIntent(mode);

      // Signup akışı: kayıt sonrası ilk adım başvuru formu.
      writeForcedTarget(mode === 'signup' ? '/evlilik/eslestirme-basvuru?w=1' : '');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const info2 = getAdditionalUserInfo(result);

      const isNewUser = !!info2?.isNewUser;

      if (isNewUser && intent !== 'signup') {
        // Login niyetiyle Google'a gitti ama bu kullanıcı bizde yeni (ilk kez) görünüyor.
        // Kullanıcıyı (auth state'i) temizleyip signup'a yönlendiriyoruz.
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
        clearStoredRedirect();
        writeForcedTarget('');
        clearAuthIntent();
        clearSignupProfile();
        setMode('signup');
        showNoAccountFoundMessage();
        return;
      }

      if (mode === "signup" && isNewUser) {
        await ensureProfileSaved(result?.user?.uid, signupAge);
        await acceptReferralIfAny();
      }
      const target = resolvePostAuthTarget(isNewUser);
      const state = isNewUser ? null : resolvePostAuthState();
      clearStoredRedirect();
      writeForcedTarget('');
      clearAuthIntent();
      clearSignupProfile();
      await navigateNextWithApplyGuard(result?.user?.uid, target, state);
    } catch (e) {
      const code = String(e?.code || "").trim();

      // Kullanıcının email/password hesabı varsa, Google ile direkt giriş denemesinde bu hata gelebilir.
      if (code === 'auth/account-exists-with-different-credential') {
        setError(t('authPage.errors.accountExistsWithDifferentCredential'));
        return;
      }

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError(t('authPage.errors.invalidCredential'));
        return;
      }

      // Popup engellenirse veya argument-error olursa redirect ile devam et.
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' || code === 'auth/argument-error') {
        try {
          const provider = new GoogleAuthProvider();
          setInfo(t('authPage.redirecting'));
          // Popup fallback
          writeForcedTarget(mode === 'signup' ? '/evlilik/eslestirme-basvuru?w=1' : '');
          writeAuthIntent(mode);
          if (mode === 'signup') {
            writeSignupProfile({
              age: Number(String(signupAge || '').trim()),
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
              t('authPage.errors.googleFailedDev', {
                code: code || 'unknown',
                host: host || t('authPage.errors.domainNotFound'),
              })
          );
          return;
        }
      }

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
    setDebugAuth(null);

    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();

      // Copy/paste sırasında şifrenin başına/sonuna boşluk gelmesi çok yaygın.
      const rawPassword = String(password || '');
      const passwordToUse = rawPassword.trim();
      const rawConfirmPassword = String(confirmPassword || '');
      const confirmPasswordToUse = rawConfirmPassword.trim();

      if (!normalizedEmail || !passwordToUse) {
        setError(t("authPage.errors.emailPasswordRequired"));
        return;
      }

      if (mode === 'signup' && passwordToUse !== confirmPasswordToUse) {
        setError(t('authPage.errors.passwordsDoNotMatch'));
        return;
      }

      if (mode === 'signup') {
        const n = Number(String(signupAge || '').trim());
        if (!Number.isFinite(n) || !Number.isInteger(n) || n > 99) {
          setError(t('authPage.errors.ageRequired'));
          return;
        }
        if (n < requiredSignupAge) {
          setError(t('authPage.errors.ageMin', { minAge: requiredSignupAge }));
          return;
        }
      }

      if (mode === "signup") {
        // Signup'ta zaten kayıtlı email ise kullanıcıyı uyar.
        const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
        if (Array.isArray(methods) && methods.length > 0) {
          setError(t('authPage.errors.emailAlreadyInUse'));
          return;
        }
        // Signup sonrası ilk adım: başvuru formu.
        // Önemli: createUserWithEmailAndPassword ile auth state hızlıca değişebilir.
        // Redirect effect'i tetiklenmeden önce hedefi zorlayalım.
        writeForcedTarget('/evlilik/eslestirme-basvuru?w=1');
        const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, passwordToUse);
        await ensureProfileSaved(cred?.user?.uid, signupAge);
        await acceptReferralIfAny();
        clearAuthIntent();
        clearSignupProfile();

        // Mobilde bazı tarayıcılarda sessionStorage hedefi okunamayabiliyor.
        // Signup sonrası kesin olarak başvuru sayfasına git.
        try {
          clearStoredRedirect();
          writeForcedTarget('');
        } catch {
          // ignore
        }
        hasNavigatedRef.current = true;
        navigate('/evlilik/eslestirme-basvuru?w=1', { replace: true });
        return;
      } else {
        // Login: bazı Firebase konfiglerinde fetchSignInMethodsForEmail boş dönebilir.
        // Yanlış "kayıt bulunamadı" göstermemek için direkt signIn dene.
        await signInWithEmailAndPassword(auth, normalizedEmail, passwordToUse);
        clearAuthIntent();
        clearSignupProfile();
      }
      // Navigasyonu burada yapmıyoruz; auth state değişince üstteki effect tek sefer yönlendirecek.
      return;
    } catch (e2) {
      const code = String(e2?.code || '').trim();

      if (import.meta.env.DEV) {
        setDebugAuth({
          code,
          message: String(e2?.message || ''),
          name: String(e2?.name || ''),
          email: String(e2?.customData?.email || ''),
        });
        // eslint-disable-next-line no-console
        console.error('[auth] email/password failed', e2);
      }

      if (code === 'auth/user-not-found') {
        setMode('signup');
        showNoAccountFoundMessage();
        return;
      }

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
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
                data-testid="login-email"
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
                data-testid="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder={t("authPage.placeholders.password")}
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t('authPage.labels.confirmPassword')}</label>
                <input
                  data-testid="signup-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder={t('authPage.placeholders.confirmPassword')}
                />
              </div>
            )}

            {/* Signup alanları için anchor */}
            <div ref={signupSectionRef} />

            {mode === 'signup' && (
              <div
                className={[
                  'rounded-2xl p-3 -mx-1',
                  signupHighlight ? 'bg-amber-50 ring-2 ring-amber-300 ring-offset-2 ring-offset-white transition' : '',
                ].join(' ')}
              >
                <label className="block text-xs font-semibold text-slate-700">{t('authPage.labels.age')}</label>
                <input
                  ref={signupAgeFirstRef}
                  value={signupAge}
                  onChange={(e) => {
                    const raw = String(e.target.value || '');
                    // Sadece sayısal girişe izin ver (boş bırakılabilir)
                    if (raw === '' || /^\d{0,2}$/.test(raw)) setSignupAge(raw);
                  }}
                  inputMode="numeric"
                  type="text"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder={t('authPage.placeholders.age')}
                />
                <p className="mt-1 text-xs text-slate-500">{t('authPage.signup.ageHint', { minAge: requiredSignupAge })}</p>
              </div>
            )}

            <button
              data-testid="login-submit"
              type="submit"
              disabled={busy}
              className="w-full px-5 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60"
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
