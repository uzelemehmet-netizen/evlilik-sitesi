import React, { useState } from 'react';
import { fetchSignInMethodsForEmail, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const DEFAULT_ADMIN_EMAIL = 'uzelemehmet@gmail.com';

  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ruleAdmins = ["uzelemehmet@gmail.com", "articelikkapi@gmail.com"];
  const ruleAdminSet = new Set(ruleAdmins);

  const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  const effectiveAdmins = envAdmins.length > 0 ? envAdmins.filter((x) => ruleAdminSet.has(x)) : ruleAdmins;

  const normalizeEmail = (v) => {
    try {
      return String(v || '').trim().toLowerCase();
    } catch {
      return '';
    }
  };

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

    // Bu repoda firebase.js içinde fallback bir demo proje var.
    // VITE_FIREBASE_* env'leri eksikse, uygulama yanlış projeye bağlanıp admin login'i her zaman başarısız olur.
    const looksLikeFallback = projectId === 'web-sitem-new-firebase' || authDomain === 'web-sitem-new-firebase.firebaseapp.com';

    if (!projectId || !authDomain || !apiKey || looksLikeFallback) {
      const msg =
        'Firebase proje ayarları eksik/yanlış görünüyor. Bu yüzden doğru email/şifre ile bile giriş başarısız olur.\n\n' +
        'Çözüm: Firebase Console → Project settings → (Web app) SDK config değerlerini alıp .env.local / Vercel env içine yazın:\n' +
        '- VITE_FIREBASE_API_KEY\n- VITE_FIREBASE_AUTH_DOMAIN\n- VITE_FIREBASE_PROJECT_ID\n- VITE_FIREBASE_APP_ID\n(+ diğerleri)';
      return { ok: false, msg, info: { projectId, authDomain } };
    }

    return { ok: true, msg: '', info: { projectId, authDomain } };
  };

  const isAdminEmail = (v) => {
    const e = normalizeEmail(v);
    return !!e && effectiveAdmins.includes(e);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setDebug('');
    setLoading(true);

    try {
      const normalized = normalizeEmail(email);
      if (!normalized || !password) {
        setError('Email ve şifre gerekli.');
        return;
      }

      if (!isAdminEmail(normalized)) {
        setError('Bu email admin allowlist içinde değil. Doğru admin email ile giriş yapın.');
        return;
      }

      // En sık sebep: Frontend yanlış Firebase projesine bağlı.
      const fbCheck = validateFirebaseProject();
      if (!fbCheck.ok) {
        setError(fbCheck.msg);
        if (import.meta.env.DEV) {
          setDebug((p) =>
            (p ? `${p}\n` : '') + `firebaseProjectId=${fbCheck.info.projectId || '-'}; authDomain=${fbCheck.info.authDomain || '-'}`
          );
        }
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, normalized, password);

      // Login başarılı olsa bile admin yetkisi yoksa kullanıcı hemen /admin'e düşer.
      // Bu, kullanıcı tarafında "yanlış şifre" gibi algılanabiliyor. Netleştirelim.
      const signedEmail = cred?.user?.email || normalized;
      if (!isAdminEmail(signedEmail)) {
        try {
          await signOut(auth);
        } catch {
          // ignore
        }
        setError('Bu hesap admin yetkili değil. Doğru admin email ile giriş yapın.');
        return;
      }

      navigate('/admin/dashboard');
    } catch (err) {
      const code = String(err?.code || '').trim();
      const msg = String(err?.message || '').trim();

      if (import.meta.env.DEV) {
        setDebug(`firebaseAuthCode=${code || '-'}; message=${msg || '-'}`);
      }

      if (code === 'auth/invalid-email') {
        setError('Email formatı geçersiz.');
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

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        // Tanılama (DEV): Bu email bu Firebase projesinde hangi yöntemlerle var?
        // Not: Email Enumeration Protection açıksa methods boş dönebilir.
        const normalized = normalizeEmail(email);
        if (import.meta.env.DEV && normalized) {
          try {
            const methods = await fetchSignInMethodsForEmail(auth, normalized);
            const list = Array.isArray(methods) ? methods.filter(Boolean).join(', ') : '';
            if (!methods || methods.length === 0) {
              setDebug((p) => (p ? `${p}\nmethods=none (E.E.P. açık olabilir)` : 'methods=none (E.E.P. açık olabilir)'));
            } else {
              setDebug((p) => (p ? `${p}\nmethods=${list || '-'}` : `methods=${list || '-'}`));
            }
          } catch (e2) {
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

    const normalized = normalizeEmail(email);
    if (!normalized) {
      setError('Email gerekli.');
      return;
    }

    if (!isAdminEmail(normalized)) {
      setError('Bu email admin allowlist içinde değil.');
      return;
    }

    const fbCheck = validateFirebaseProject();
    if (!fbCheck.ok) {
      setError(fbCheck.msg);
      if (import.meta.env.DEV) {
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

      if (import.meta.env.DEV) {
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

        {import.meta.env.DEV && debug ? (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700 whitespace-pre-wrap">
            {debug}
          </div>
        ) : null}

        {import.meta.env.DEV ? (
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
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200 mt-6"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

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
