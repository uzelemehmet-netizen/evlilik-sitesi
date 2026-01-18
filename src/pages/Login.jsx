import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { auth, db } from "../config/firebase";
import { useAuth } from "../auth/AuthProvider";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const redirectTarget = useMemo(() => {
    const state = location.state || {};
    return {
      from: state.from || "/panel",
      fromState: state.fromState || null,
    };
  }, [location.state]);

  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupGender, setSignupGender] = useState(""); // male | female
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [forceLogin, setForceLogin] = useState(false);

  const ensureGenderSaved = async (uid, gender) => {
    if (!uid) return;
    if (gender !== "male" && gender !== "female") return;

    const ref = doc(db, "matchmakingUsers", uid);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? String((snap.data() || {})?.gender || "").toLowerCase().trim() : "";
    if (existing) return;

    await setDoc(
      ref,
      {
        gender,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const contextMessage = useMemo(() => {
    const from = redirectTarget.from || "/panel";

    if (from === "/payment") {
      return t("authPage.context.payment");
    }

    if (from === "/panel") {
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
    if (!forceLogin) return;

    // Kullanıcı daha önce giriş yapmış olsa bile, bu ekrandan "yeni giriş" istendi.
    setInfo(t("authPage.forceInfo"));

    // Login'e gelmeden hemen önce signOut tamamlanmamış olabilir; burada garanti altına al.
    signOut(auth).catch(() => {
      // ignore
    });
  }, [forceLogin]);

  const goNext = () => {
    navigate(redirectTarget.from, { replace: true, state: redirectTarget.fromState });
  };

  useEffect(() => {
    if (user && !forceLogin) {
      // Zaten giriş yaptıysa direkt hedefe gönder.
      goNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, forceLogin]);

  if (user && !forceLogin) return null;

  const handleGoogle = async () => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signup" && signupGender !== "male" && signupGender !== "female") {
        setError(t("authPage.errors.genderRequired"));
        return;
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const info2 = getAdditionalUserInfo(result);
      if (mode === "signup" && info2?.isNewUser) {
        await ensureGenderSaved(result?.user?.uid, signupGender);
      }
      goNext();
    } catch (e) {
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

      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await ensureGenderSaved(cred?.user?.uid, signupGender);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      goNext();
    } catch (e2) {
      setError(e2?.message || t("authPage.errors.loginFailed"));
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
              disabled={busy}
              className="w-full px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {t("authPage.googleCta")}
            </button>
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

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t("authPage.labels.gender")}</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${
                      signupGender === "male" ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-white"
                    }`}
                  >
                    <input
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
              <a href="/docs/paket-tur-sozlesmesi.html" target="_blank" rel="noopener noreferrer" className="text-sky-700 hover:underline">
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
            </span>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
