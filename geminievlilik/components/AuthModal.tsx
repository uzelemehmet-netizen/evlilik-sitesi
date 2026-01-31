
import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isNewUser: boolean, email?: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('REGISTER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [agreements, setAgreements] = useState({
    age: false,
    kvkk: false,
    tos: false,
    ai: false
  });

  if (!isOpen) return null;

  const handleAuth = async (type: 'google' | 'email') => {
    // Kayıt modunda anlaşmaların kontrolü
    if (mode === 'REGISTER' && !Object.values(agreements).every(v => v)) {
      alert("Lütfen devam etmek için tüm yasal onayları (21+ yaş, KVKK, Kullanım Şartları ve AI izni) işaretleyiniz.");
      return;
    }

    // E-posta modunda boş alan kontrolü
    if (type === 'email' && (!email || !password)) {
      alert("Lütfen e-posta ve şifre alanlarını doldurunuz.");
      return;
    }

    setLoading(true);

    // Gerçek bir API çağrısını simüle edelim (1.5 saniye)
    // Gerçek Firebase bağlandığında burada auth.signInWithPopup veya createUserWithEmailAndPassword çalışacak.
    setTimeout(() => {
      setLoading(false);
      const finalEmail = type === 'google' ? 'google_user@gmail.com' : email;
      onSuccess(mode === 'REGISTER', finalEmail);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass w-full max-w-md p-10 rounded-[3rem] premium-shadow border border-white relative overflow-hidden bg-white/95">
        
        {loading && (
          <div className="absolute inset-0 z-[110] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
             <div className="w-14 h-14 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4 shadow-lg shadow-rose-100"></div>
             <p className="text-rose-600 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Bağlanılıyor...</p>
          </div>
        )}

        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-rose-500 transition-colors z-10">
          <i className="fa-solid fa-xmark text-2xl"></i>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg shadow-rose-200">
            <i className={`fa-solid ${mode === 'REGISTER' ? 'fa-user-plus' : 'fa-right-to-bracket'}`}></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">
            {mode === 'REGISTER' ? 'Aramıza Katıl' : 'Tekrar Hoş Geldin'}
          </h2>
          <p className="text-gray-500 text-sm font-medium mt-2">Ciddi ve güvenli evlilik yolculuğu.</p>
        </div>

        <div className="space-y-4 mb-8">
          <button 
            disabled={loading}
            onClick={() => handleAuth('google')}
            className="group w-full py-4 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-4 font-black text-gray-700 hover:bg-gray-50 hover:border-rose-100 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" alt="Google" />
            <span className="text-sm">Google ile {mode === 'REGISTER' ? 'Kaydol' : 'Giriş Yap'}</span>
          </button>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400 font-black tracking-widest">Veya</span></div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
              <input 
                type="email" 
                placeholder="E-posta Adresiniz" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-rose-200 rounded-2xl outline-none transition-all font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium" 
              />
            </div>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-gray-300"></i>
              <input 
                type="password" 
                placeholder="Şifreniz" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-rose-200 rounded-2xl outline-none transition-all font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-medium" 
              />
            </div>
          </div>
          
          <button 
            disabled={loading}
            onClick={() => handleAuth('email')}
            className="w-full py-5 gradient-bg text-white font-black rounded-2xl shadow-xl shadow-rose-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest text-sm"
          >
            {mode === 'REGISTER' ? 'HESAP OLUŞTUR' : 'GİRİŞ YAP'}
          </button>
        </div>

        {mode === 'REGISTER' && (
          <div className="space-y-3 bg-rose-50/50 p-6 rounded-3xl border border-rose-100 mb-6 max-h-48 overflow-y-auto custom-scrollbar">
            <CheckItem label="21 yaşından büyüğüm." checked={agreements.age} onChange={v => setAgreements({...agreements, age: v})} />
            <CheckItem label="KVKK aydınlatma metnini okudum." checked={agreements.kvkk} onChange={v => setAgreements({...agreements, kvkk: v})} />
            <CheckItem label="Kullanım şartlarını kabul ediyorum." checked={agreements.tos} onChange={v => setAgreements({...agreements, tos: v})} />
            <CheckItem label="Mesajlarımın AI ile işlenmesini anladım." checked={agreements.ai} onChange={v => setAgreements({...agreements, ai: v})} />
          </div>
        )}

        <div className="text-center">
          <button 
            onClick={() => setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER')}
            className="text-[11px] font-black text-rose-500 hover:text-rose-600 hover:underline uppercase tracking-[0.15em] transition-colors"
          >
            {mode === 'REGISTER' ? 'Zaten hesabım var? Giriş Yap' : 'Hesabın yok mu? Kayıt Ol'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CheckItem = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-start gap-3 cursor-pointer group mb-1" onClick={() => onChange(!checked)}>
    <div className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center border-2 shrink-0 transition-all duration-300 ${checked ? 'gradient-bg border-transparent text-white scale-110 shadow-sm' : 'border-rose-200 text-transparent'}`}>
      <i className="fa-solid fa-check text-[10px]"></i>
    </div>
    <span className="text-[10px] leading-tight font-bold text-gray-600 select-none group-hover:text-rose-500 transition-colors">{label}</span>
  </div>
);

export default AuthModal;
