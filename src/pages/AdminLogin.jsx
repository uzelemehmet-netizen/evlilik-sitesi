import { useEffect, useRef, useState } from 'react';
import {
  fetchSignInMethodsForEmail,
  getMultiFactorResolver,
  onIdTokenChanged,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebaseAuth';
import { clearAdminStepUpToken } from '../utils/adminStepUp.js';
import { ADMIN_EMAIL, getAdminAccessState, hasAllowedAdminEmail, normalizeAdminEmail } from '../utils/adminAccess';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const DEFAULT_ADMIN_EMAIL = ADMIN_EMAIL;

  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaResolver, setMfaResolver] = useState(null);
  const [mfaVerificationId, setMfaVerificationId] = useState('');
  const [mfaHint, setMfaHint] = useState('');
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  // Güvenlik: Admin panel TEK kullanıcı ile çalışır.
  // Başka email'lerle (custom claim olsa bile) girişe izin vermeyin.

  const showDebug = (() => {
    if (import.meta.env.DEV) return true;
    try {
      return new URLSearchParams(window.location.search).has('debug');
    } catch {
      return false;
    }
  })();

  const getActiveFirebaseInfo = () => {
    try {
      const projectId = String(auth?.app?.options?.projectId || '').trim();
      const authDomain = String(auth?.app?.options?.authDomain || '').trim();
      const apiKey = String(auth?.app?.options?.apiKey || '').trim();
      return { projectId, authDomain, apiKey };
    } catch {
      return { projectId: '', authDomain: '', apiKey: '' };
    }
  };

  const validateFirebaseProject = () => {
    const { projectId, authDomain, apiKey } = getActiveFirebaseInfo();

    // Eğer Vercel/CI ortamında VITE_FIREBASE_* eksik/yanlışsa, admin login doğru çalışmaz.
    // Bu repo artık sessiz fallback kullanmıyor; yine de burada kullanıcıya net yönlendirme verelim.
    if (!projectId || !authDomain || !apiKey) {
      const msg =
        'Firebase proje ayarları eksik/yanlış görünüyor. Bu yüzden doğru email/şifre ile bile giriş başarısız olur.\n\n' +
        'Çözüm: Firebase Console → Project settings → (Web app) SDK config değerlerini alıp .env.local / Vercel env içine yazın:\n' +
        '- VITE_FIREBASE_API_KEY\n- VITE_FIREBASE_AUTH_DOMAIN\n- VITE_FIREBASE_PROJECT_ID\n- VITE_FIREBASE_APP_ID\n(+ diğerleri)';
      return { ok: false, msg, info: { projectId, authDomain } };
    }

    return { ok: true, msg: '', info: { projectId, authDomain } };
  };

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      try {
        const access = await getAdminAccessState(user);
        if (access.isAdmin) {
          navigate('/admin/dashboard', { replace: true });
        }
      } catch {
        // ignore
      }
    });

    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    return () => {
      try {
        recaptchaRef.current?.clear?.();
      } catch {
        // ignore
      }
      recaptchaRef.current = null;
    };
  }, []);

  const ensureRecaptchaVerifier = () => {
    if (recaptchaRef.current) return recaptchaRef.current;
    recaptchaRef.current = new RecaptchaVerifier(auth, 'admin-login-mfa-recaptcha', {
      size: 'invisible',
    });
    return recaptchaRef.current;
  };

  const getIsAdminStrict = async (user, { forceRefresh = false } = {}) => {
    if (!user) {
      return {
        isAdmin: false,
        allowedEmail: false,
        hasAdminClaim: false,
        requiresMfa: false,
        hasSecondFactor: false,
      };
    }

    try {
      return await getAdminAccessState(user, { forceRefresh });
    } catch {
      return {
        isAdmin: false,
        allowedEmail: false,
        hasAdminClaim: false,
        requiresMfa: false,
        hasSecondFactor: false,
      };
    }
  };

  const resetMfaState = () => {
    setMfaCode('');
    setMfaResolver(null);
    setMfaVerificationId('');
    setMfaHint('');
  };

  const maskPhoneDisplay = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return 'kayıtlı cihaz';
    if (raw.length <= 4) return raw;
    return `${raw.slice(0, 3)}***${raw.slice(-2)}`;
  };

  const completeAdminLogin = async (userCredential) => {
    const access = await getIsAdminStrict(userCredential?.user, { forceRefresh: true });

    if (!access.allowedEmail) {
      try {
        clearAdminStepUpToken();
        await signOut(auth);
      } catch {
        // ignore
      }
      throw new Error('not_allowed_admin_email');
    }

    if (!access.hasAdminClaim) {
      try {
        clearAdminStepUpToken();
        await signOut(auth);
      } catch {
        // ignore
      }
      throw new Error('missing_admin_claim');
    }

    if (access.requiresMfa && !access.hasSecondFactor) {
      try {
        clearAdminStepUpToken();
        await signOut(auth);
      } catch {
        // ignore
      }
      throw new Error('missing_admin_mfa');
    }

    resetMfaState();
    navigate('/admin/dashboard');
  };

  const startMfaChallenge = async (err) => {
    const resolver = getMultiFactorResolver(auth, err);
    const hint = Array.isArray(resolver?.hints) && resolver.hints.length ? resolver.hints[0] : null;
    if (!hint) {
      throw new Error('missing_mfa_hint');
    }

    const verifier = ensureRecaptchaVerifier();
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      {
        multiFactorHint: hint,
        session: resolver.session,
      },
      verifier
    );

    setMfaResolver(resolver);
    setMfaVerificationId(verificationId);
    setMfaHint(maskPhoneDisplay(hint?.phoneNumber || hint?.displayName || ''));
    setMfaCode('');
    setError('Doğrulama kodu gönderildi. Gelen SMS kodunu girin.');
  };

  const verifySecondFactor = async () => {
    if (!mfaResolver || !mfaVerificationId) {
      setError('İkinci doğrulama oturumu bulunamadı. Tekrar giriş yapın.');
      resetMfaState();
      return;
    }

    const code = String(mfaCode || '').trim();
    if (!code) {
      setError('SMS doğrulama kodu gerekli.');
      return;
    }

    const credential = PhoneAuthProvider.credential(mfaVerificationId, code);
    const assertion = PhoneMultiFactorGenerator.assertion(credential);
    const resolved = await mfaResolver.resolveSignIn(assertion);
    await completeAdminLogin(resolved);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setDebug('');
    setLoading(true);

    try {
      if (mfaResolver) {
        await verifySecondFactor();
        return;
      }

      const normalized = normalizeAdminEmail(email);
      if (!normalized || !password) {
        setError('Email ve şifre gerekli.');
        return;
      }

      if (!hasAllowedAdminEmail(normalized)) {
        setError('Bu email admin allowlist içinde değil.');
        return;
      }

      // En sık sebep: Frontend yanlış Firebase projesine bağlı.
      const fbCheck = validateFirebaseProject();
      if (!fbCheck.ok) {
        setError(fbCheck.msg);
        if (showDebug) {
          setDebug((p) =>
            (p ? `${p}\n` : '') + `firebaseProjectId=${fbCheck.info.projectId || '-'}; authDomain=${fbCheck.info.authDomain || '-'}`
          );
        }
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, normalized, password);
      await completeAdminLogin(cred);
    } catch (err) {
      const code = String(err?.code || '').trim();
      const msg = String(err?.message || '').trim();

      if (showDebug) {
        setDebug(`firebaseAuthCode=${code || '-'}; message=${msg || '-'}`);
      }

      if (code === 'auth/invalid-email') {
        setError('Email formatı geçersiz.');
        return;
      }

      if (code === 'auth/multi-factor-auth-required') {
        try {
          await startMfaChallenge(err);
        } catch (mfaErr) {
          const mfaMsg = String(mfaErr?.message || '').trim();
          setError(mfaMsg || 'İkinci doğrulama başlatılamadı. Firebase MFA yapılandırmasını kontrol edin.');
        }
        return;
      }

      if (code === 'auth/too-many-requests') {
        setError('Çok fazla deneme yapıldı. Birkaç dakika bekleyip tekrar deneyin.');
        return;
      }

      if (code === 'auth/user-disabled') {
        setError('Bu kullanıcı devre dışı bırakılmış.');
        return;
      }

      if (code === 'auth/operation-not-allowed') {
        setError('Email/şifre ile giriş bu Firebase projesinde kapalı (Authentication → Sign-in method).');
        return;
      }

      if (msg === 'missing_admin_claim') {
        setError('Bu hesapta admin claim yok. Önce Firebase custom claim admin=true tanımlayın.');
        return;
      }

      if (msg === 'missing_admin_mfa') {
        setError('Bu admin hesabı için MFA zorunlu ama oturum ikinci faktör taşımıyor. Firebase MFA ile giriş tamamlanmalı.');
        return;
      }

      if (msg === 'not_allowed_admin_email') {
        setError('Bu hesap admin allowlist içinde değil.');
        return;
      }

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        // Tanılama (DEV): Bu email bu Firebase projesinde hangi yöntemlerle var?
        // Not: Email Enumeration Protection açıksa methods boş dönebilir.
        const normalized = normalizeAdminEmail(email);
        if (showDebug && normalized) {
          try {
            const methods = await fetchSignInMethodsForEmail(auth, normalized);
            const list = Array.isArray(methods) ? methods.filter(Boolean).join(', ') : '';
            if (!methods || methods.length === 0) {
              setDebug((p) => (p ? `${p}\nmethods=none (E.E.P. açık olabilir)` : 'methods=none (E.E.P. açık olabilir)'));
            } else {
              setDebug((p) => (p ? `${p}\nmethods=${list || '-'}` : `methods=${list || '-'}`));
            }
          } catch {
            // ignore
          }
        }

        setError('Email veya şifre hatalı. (Not: Yanlış Firebase projesine bağlanıyorsanız da bu hata görülebilir.)');
        return;
      }

      setError(msg || 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setDebug('');

    const normalized = normalizeAdminEmail(email);
    if (!normalized) {
      setError('Email gerekli.');
      return;
    }

    // Şifre reseti kötüye kullanılmasın diye sadece allowlist'e izin veriyoruz.
    if (!hasAllowedAdminEmail(normalized)) {
      setError('Bu email admin allowlist içinde değil.');
      return;
    }

    const fbCheck = validateFirebaseProject();
    if (!fbCheck.ok) {
      setError(fbCheck.msg);
      if (showDebug) {
        setDebug((p) =>
          (p ? `${p}\n` : '') + `firebaseProjectId=${fbCheck.info.projectId || '-'}; authDomain=${fbCheck.info.authDomain || '-'}`
        );
      }
      return;
    }

    try {
      await sendPasswordResetEmail(auth, normalized);
      setError('Şifre sıfırlama maili gönderildi (spam klasörünü de kontrol edin).');
    } catch (e) {
      const code = String(e?.code || '').trim();
      const msg = String(e?.message || '').trim();

      if (showDebug) {
        setDebug((p) => (p ? `${p}\n` : '') + `resetCode=${code || '-'}; resetMsg=${msg || '-'}`);
      }

      // Enumeration protection veya user-not-found gibi durumlarda da kullanıcıya
      // aynı mesajı vermek daha güvenli; admin tarafı olduğu için biraz daha netleştiriyoruz.
      setError('Şifre sıfırlama maili gönderilemedi. Email doğru mu ve bu projede Email/Password kullanıcı olarak var mı kontrol edin.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-indigo-100 p-3 rounded-full">
            <Lock className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Admin Paneli
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Resim yönetimi için giriş yapın
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showDebug && debug ? (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700 whitespace-pre-wrap">
            {debug}
          </div>
        ) : null}

        {showDebug ? (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
            Firebase proje: <span className="font-mono">{String(import.meta.env.VITE_FIREBASE_PROJECT_ID || '') || '-'}</span>
            {' • '}
            Auth domain: <span className="font-mono">{String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '') || '-'}</span>
          </div>
        ) : null}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="uzelemehmet@gmail.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                required={!mfaResolver}
                disabled={!!mfaResolver}
              />
            </div>
          </div>

          {mfaResolver ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMS Doğrulama Kodu
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                required
              />
              <p className="mt-2 text-xs text-slate-500">
                Kod gönderilen kayıt: {mfaHint || 'telefon numarası gizli'}
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200 mt-6"
          >
            {loading ? 'İşleniyor...' : mfaResolver ? 'Kodu Doğrula' : 'Giriş Yap'}
          </button>

          {mfaResolver ? (
            <button
              type="button"
              onClick={resetMfaState}
              disabled={loading}
              className="w-full border border-slate-200 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-50 transition duration-200"
            >
              Tekrar Başla
            </button>
          ) : null}
        </form>

        <div id="admin-login-mfa-recaptcha" className="hidden" />

        <button
          type="button"
          onClick={handlePasswordReset}
          disabled={loading}
          className="mt-3 w-full border border-slate-200 text-slate-700 font-semibold py-2 rounded-lg hover:bg-slate-50 transition duration-200"
        >
          Şifremi Unuttum / Sıfırla
        </button>

        <p className="text-center text-gray-600 text-sm mt-6">
          © web-sitem.com Admin Paneli
        </p>
      </div>
    </div>
  );
}
