
import React, { useState } from 'react';
import { UserProfile, MembershipTier, VerificationStatus } from '../types';

interface ProfilePageProps {
  user: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'subscription' | 'security' | 'kyc'>('info');
  const [kycLoading, setKycLoading] = useState(false);

  const handleKycSubmit = () => {
    setKycLoading(true);
    setTimeout(() => {
      setKycLoading(false);
      onUpdate({ ...user, verificationStatus: VerificationStatus.PENDING });
      alert("Belgeleriniz alındı! Admin ekibimiz en kısa sürede inceleyecektir.");
    }, 2000);
  };

  const simulateAdminApproval = () => {
    onUpdate({ ...user, verificationStatus: VerificationStatus.VERIFIED, isVerified: true });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
        <div className="relative">
          <img src={user.photos[0]} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl" />
          {user.isVerified && (
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <i className="fa-solid fa-check-double text-xs"></i>
            </div>
          )}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{user.name}</h1>
          <div className="flex gap-3 mt-4 justify-center md:justify-start">
             <span className="px-4 py-1.5 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black uppercase border border-rose-100">Ücretsiz</span>
             {user.isVerified ? (
               <span className="px-4 py-1.5 bg-blue-50 text-blue-500 rounded-xl text-[10px] font-black uppercase border border-blue-100">Doğrulanmış</span>
             ) : (
               <button onClick={() => setActiveTab('kyc')} className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase border border-amber-100 animate-pulse">Onayla Bekliyor</button>
             )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
        <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')} label="Profilim" />
        <TabButton active={activeTab === 'kyc'} onClick={() => setActiveTab('kyc')} label="Kimlik Doğrula" />
        <TabButton active={activeTab === 'subscription'} onClick={() => setActiveTab('subscription')} label="Üyelik" />
        <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} label="Güvenlik" />
      </div>

      <div className="glass rounded-[40px] p-10 border border-white bg-white/80 shadow-2xl">
        {activeTab === 'info' && (
          <div className="space-y-8">
            <h3 className="text-2xl font-black">Genel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <InfoField label="Ad Soyad" value={user.name} />
               <InfoField label="Meslek" value={user.occupation} />
               <InfoField label="Konum" value={`${user.city}, ${user.country}`} />
               <InfoField label="Niyet" value={user.intent} />
            </div>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="space-y-10 text-center py-6">
             {user.isVerified ? (
               <div className="space-y-6">
                  <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center text-4xl mx-auto shadow-inner border border-blue-100">
                     <i className="fa-solid fa-shield-check"></i>
                  </div>
                  <h3 className="text-2xl font-black text-blue-900">Hesabınız Doğrulandı!</h3>
                  <p className="text-gray-500 max-w-sm mx-auto font-medium">Kimliğiniz onaylandı. Artık adaylar arasında %80 daha fazla dikkat çekeceksiniz.</p>
               </div>
             ) : (
               <div className="space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black tracking-tight">Güven Odaklı Evlilik</h3>
                    <p className="text-gray-400 text-sm font-medium">Kimliğinizi doğrulayarak ciddiyetinizi tüm adaylara kanıtlayın.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <KycUpload icon="fa-id-card" label="Kimlik / Pasaport" desc="Ön yüzü net görünmeli" />
                     <KycUpload icon="fa-camera-rotate" label="Selfie" desc="Yüzünüz aydınlık olmalı" />
                  </div>

                  <button 
                    onClick={handleKycSubmit}
                    disabled={kycLoading}
                    className="w-full py-6 gradient-bg text-white font-black rounded-3xl shadow-xl shadow-rose-100 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                  >
                    {kycLoading ? 'YÜKLENİYOR...' : 'DOĞRULAMA İSTEĞİ GÖNDER'}
                  </button>
                  
                  {user.verificationStatus === VerificationStatus.PENDING && (
                    <button onClick={simulateAdminApproval} className="text-[10px] text-gray-300 font-black uppercase hover:text-rose-400 transition-colors">
                      [DEMO: Onayı Simüle Et]
                    </button>
                  )}
               </div>
             )}
          </div>
        )}

        {activeTab === 'subscription' && <div className="text-center py-20 font-black text-gray-300 uppercase tracking-widest">Çok Yakında</div>}
        {activeTab === 'security' && (
           <div className="space-y-4">
              <button onClick={onLogout} className="w-full py-5 gradient-bg text-white font-black rounded-2xl shadow-lg">GÜVENLİ ÇIKIŞ</button>
           </div>
        )}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, label }: any) => (
  <button onClick={onClick} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${active ? 'gradient-bg text-white shadow-xl scale-105' : 'bg-white text-gray-400 border border-gray-50'}`}>
    {label}
  </button>
);

const InfoField = ({ label, value }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4">{label}</label>
    <div className="px-8 py-5 bg-gray-50 rounded-[2rem] font-bold text-gray-800 shadow-inner">{value}</div>
  </div>
);

const KycUpload = ({ icon, label, desc }: any) => (
  <div className="p-8 border-2 border-dashed border-rose-100 rounded-[2.5rem] bg-rose-50/20 hover:bg-rose-50 transition-all cursor-pointer group">
     <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-rose-500 text-2xl mb-4 mx-auto shadow-sm group-hover:scale-110 transition-transform">
        <i className={`fa-solid ${icon}`}></i>
     </div>
     <h4 className="font-black text-gray-800 uppercase text-[10px] tracking-widest">{label}</h4>
     <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{desc}</p>
  </div>
);

export default ProfilePage;
