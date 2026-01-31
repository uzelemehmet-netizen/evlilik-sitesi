
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileFormProps {
  user: UserProfile;
  onComplete: (profile: UserProfile) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserProfile>({ 
    ...user,
    photoPrivacy: 'PUBLIC' 
  });

  const steps = [
    { title: "Kimlik Bilgileri", desc: "Gizlilik Esastır" },
    { title: "Konum & Yaşam", desc: "Lojistik Plan" },
    { title: "Beklentiler", desc: "Karakter Uyumu" },
    { title: "Fotoğraflar", desc: "Şeffaflık Modu" }
  ];

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else {
      if (!formData.username || !formData.name || !formData.phoneNumber) {
        alert("Lütfen sistem güvenliği için zorunlu alanları (Kullanıcı Adı, Gerçek Ad, Telefon) doldurun.");
        return;
      }
      if (formData.photos.length === 0) {
        alert("Ciddi bir tanışma için en az bir adet net fotoğraf yüklemeniz gerekmektedir.");
        return;
      }
      onComplete(formData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Eş Adayınızı Bulmaya Az Kaldı</h1>
        <p className="text-slate-500 font-semibold max-w-lg mx-auto leading-relaxed">
          "Doğru eşleşme, dürüstlükle başlar. Bilgileriniz sadece sizin izin verdiğiniz kişilerle paylaşılır."
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_2.8fr] gap-12 items-start">
        <div className="hidden md:block space-y-4">
          {steps.map((s, idx) => (
            <div key={idx} className={`p-6 rounded-[2rem] transition-all border ${step === idx + 1 ? 'bg-white border-rose-200 shadow-xl shadow-rose-50 scale-105' : 'bg-transparent border-transparent opacity-40'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${step === idx + 1 ? 'gradient-bg text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {idx + 1}
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{s.title}</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass rounded-[3.5rem] p-10 md:p-14 premium-shadow border border-white bg-white/90">
          <div className="w-full h-1.5 bg-slate-50 rounded-full mb-12 overflow-hidden">
             <div className="h-full gradient-bg transition-all duration-700" style={{ width: `${(step / 4) * 100}%` }}></div>
          </div>

          <div className="mb-8 p-6 bg-amber-50 rounded-3xl border border-amber-100">
             <p className="text-[11px] font-black text-amber-700 uppercase leading-relaxed tracking-wider text-center">
               <i className="fa-solid fa-shield-check mr-2"></i>
               Gerçek Ad Soyad ve Telefon numaranız sadece sistem doğrulaması içindir. Diğer kullanıcılar sadece belirlediğiniz <b>Kullanıcı Adınızı</b> görecektir.
             </p>
          </div>

          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
               <FormField 
                  label="Benzersiz Kullanıcı Adı" 
                  value={formData.username} 
                  onChange={v => updateField('username', v)} 
                  placeholder="Örn: MaviLale" 
                  info="Profilinizde bu isim görünecektir."
               />
               <FormField 
                  label="Gerçek Ad Soyad" 
                  value={formData.name} 
                  onChange={v => updateField('name', v)} 
                  placeholder="Örn: Ayşe Yılmaz" 
                  info="Sadece sistem ve doğrulama için kullanılır."
               />
               <FormField 
                  label="Telefon Numarası" 
                  value={formData.phoneNumber} 
                  onChange={v => updateField('phoneNumber', v)} 
                  placeholder="+90 5xx xxx xx xx" 
                  info="Giriş ve güvenlik için gereklidir."
               />
               <div className="grid grid-cols-2 gap-6">
                 <FormField label="Yaş" type="number" value={formData.age.toString()} onChange={v => updateField('age', Number(v))} />
                 <SelectField label="Medeni Durum" value={formData.maritalStatus} options={[{v:'Bekar', l:'Bekar'}, {v:'Boşandı', l:'Boşandı'}]} onChange={v => updateField('maritalStatus', v)} />
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
               <SelectField label="Bulunduğunuz Ülke" value={formData.country} options={[{v:'Turkey', l:'Türkiye'}, {v:'Indonesia', l:'Endonezya'}]} onChange={v => updateField('country', v)} />
               <FormField label="Şehir" value={formData.city} onChange={v => updateField('city', v)} placeholder="Örn: İstanbul" />
               <FormField label="Mesleğiniz" value={formData.occupation} onChange={v => updateField('occupation', v)} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
               <textarea 
                  className="w-full p-8 bg-slate-50 rounded-[2.5rem] border-2 border-transparent focus:border-rose-100 outline-none h-40 font-bold text-slate-900 shadow-inner"
                  placeholder="Evlilikten beklentileriniz nelerdir? Kendinizi kısaca tanıtın..."
                  value={formData.bio}
                  onChange={e => updateField('bio', e.target.value)}
               />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 text-center">
               <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 mb-6 text-left">
                  <h5 className="text-xs font-black text-rose-900 uppercase tracking-widest mb-2">Görsel Şeffaflık</h5>
                  <p className="text-[11px] text-rose-700/80 font-medium leading-relaxed">
                    Ciddi bir evlilik platformunda adayların birbirini tanıması haktır. Fotoğrafsız profiller eşleşme alamaz.
                  </p>
               </div>
               
               <button onClick={() => updateField('photos', [`https://picsum.photos/400/500?random=${Date.now()}`])} className="w-full py-10 border-2 border-dashed border-rose-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-rose-500 hover:bg-rose-50 transition-all">
                  <i className="fa-solid fa-camera text-4xl"></i>
                  <span className="text-[10px] font-black uppercase">Fotoğraf Yükle</span>
               </button>

               {formData.photos.length > 0 && (
                 <div className="mt-4 flex justify-center">
                    <img src={formData.photos[0]} className="w-24 h-32 object-cover rounded-2xl border-4 border-white shadow-lg" />
                 </div>
               )}
            </div>
          )}

          <div className="flex gap-4 mt-12 pt-8 border-t border-slate-50">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="w-16 h-16 flex items-center justify-center bg-slate-50 text-slate-400 rounded-3xl border border-slate-100">
                <i className="fa-solid fa-arrow-left"></i>
              </button>
            )}
            <button 
              onClick={handleNext} 
              className="flex-grow h-16 gradient-bg text-white font-black rounded-3xl shadow-xl shadow-rose-100 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-xs"
            >
              {step === 4 ? 'KAYIT TAMAMLA' : 'DEVAM ET'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormField = ({ label, value, onChange, type = 'text', placeholder = '', info = '' }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full px-8 py-5 bg-slate-50 rounded-[2.5rem] border-2 border-transparent focus:border-rose-100 outline-none font-bold text-slate-900 shadow-inner"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
    {info ? <p className="text-[10px] text-slate-400 font-semibold ml-4">{info}</p> : null}
  </div>
);

const SelectField = ({ label, value, options = [], onChange, info = '' }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
    <select
      className="w-full px-8 py-5 bg-slate-50 rounded-[2.5rem] border-2 border-transparent focus:border-rose-100 outline-none font-bold text-slate-900 shadow-inner"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      {Array.isArray(options) &&
        options.map((o: any) => (
          <option key={String(o?.v)} value={o?.v}>
            {o?.l}
          </option>
        ))}
    </select>
    {info ? <p className="text-[10px] text-slate-400 font-semibold ml-4">{info}</p> : null}
  </div>
);

export default ProfileForm;