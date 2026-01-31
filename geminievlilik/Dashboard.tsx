
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, MembershipTier, VerificationStatus } from './types';
// Fixed import path to point to components directory
import MatchCard from './components/MatchCard';

interface DashboardProps {
  user: UserProfile;
}

// Fix: added missing 'username' and 'photoPrivacy' properties to satisfy UserProfile interface.
const MOCK_PROFILES: UserProfile[] = [
  {
    uid: 'p1', username: 'IndahAyu', name: 'Nurul Huda', age: 26, gender: 'FEMALE', targetGender: 'MALE', 
    minTargetAge: 25, maxTargetAge: 35, country: 'Indonesia', city: 'Jakarta',
    nationality: 'Endonezya', incomeLevel: 'Orta',
    maritalStatus: 'Bekar', intent: 'Ciddi Evlilik', bio: 'Geleneksel bir aile yapım var.',
    photos: ['https://picsum.photos/400/500?random=11'], isVerified: true,
    photoPrivacy: 'PUBLIC',
    verificationStatus: VerificationStatus.VERIFIED, membershipTier: MembershipTier.FREE,
    lastSeen: Date.now(), isOnline: true, education: 'Lisans', occupation: 'Hemşire',
    smoker: false, wantKids: 'Evet', religiousLevel: 'Orta', likedBy: [], likes: [],
    confirmedMatches: [], profileAccessGranted: [], dislikedUsers: [], dailyMessageCount: 0, profileUpdatedCount: 1,
    hasChildren: false, childrenStatus: 'Çocuğum yok', relocationStatus: 'Evet', languages: 'Indonesian, English',
    willUseTranslation: true, partnerCanUseTranslation: true, phoneNumber: '+628123456789'
  },
  {
    uid: 'p2', username: 'SitiBandung', name: 'Siti Aminah', age: 24, gender: 'FEMALE', targetGender: 'MALE', 
    minTargetAge: 24, maxTargetAge: 30, country: 'Indonesia', city: 'Bandung',
    nationality: 'Endonezya', incomeLevel: 'İyi',
    maritalStatus: 'Bekar', intent: 'Evlilik Yolunda', bio: 'Öğretmenim, ciddi bir aday arıyorum.',
    photos: ['https://picsum.photos/400/500?random=22'], isVerified: false,
    photoPrivacy: 'PUBLIC',
    verificationStatus: VerificationStatus.NONE, membershipTier: MembershipTier.FREE,
    lastSeen: Date.now() - 500000, isOnline: false, education: 'Yüksek Lisans', occupation: 'Öğretmen',
    smoker: false, wantKids: 'Evet', religiousLevel: 'Dindar', likedBy: [], likes: [],
    confirmedMatches: [], profileAccessGranted: [], dislikedUsers: [], dailyMessageCount: 0, profileUpdatedCount: 1,
    hasChildren: false, childrenStatus: 'Çocuğum yok', relocationStatus: 'Belki', languages: 'Indonesian',
    willUseTranslation: true, partnerCanUseTranslation: true, phoneNumber: '+628987654321'
  }
];

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [view, setView] = useState<'POOL' | 'MATCHES'>('POOL');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [scanning, setScanning] = useState(true);
  const [activeMatch, setActiveMatch] = useState<string | null>(localStorage.getItem('active_match_id'));
  const navigate = useNavigate();

  const runDiscovery = useCallback(() => {
    setScanning(true);
    setTimeout(() => {
      // Filtreleme: Yaş, Cinsiyet ve Karşılıklı Yaş Aralığı Uyumu
      const filtered = MOCK_PROFILES.filter(p => {
        const genderMatch = p.gender === user.targetGender && user.gender === p.targetGender;
        // Fix: Corrected age filtering logic to check mutual age range preferences
        const ageMatch = p.age >= user.minTargetAge && p.age <= user.maxTargetAge &&
                         user.age >= p.minTargetAge && user.age <= p.maxTargetAge;
        return genderMatch && ageMatch && !user.confirmedMatches.includes(p.uid);
      });
      setProfiles(filtered);
      setScanning(false);
    }, 1000);
  }, [user]);

  useEffect(() => {
    if (!activeMatch) runDiscovery();
  }, [activeMatch, view, runDiscovery]);

  if (activeMatch) {
    const match = MOCK_PROFILES.find(p => p.uid === activeMatch) || MOCK_PROFILES[0];
    return (
      <div className="max-w-4xl mx-auto py-20 px-4">
        <div className="glass rounded-[50px] p-12 text-center premium-shadow border border-white space-y-8 animate-in zoom-in">
           <div className="flex justify-center -space-x-6 items-center">
              <img src={user.photos[0]} className="w-32 h-32 rounded-full border-4 border-white shadow-xl z-10 object-cover" />
              <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center text-white text-2xl z-20 border-4 border-white shadow-lg animate-pulse">
                 <i className="fa-solid fa-heart"></i>
              </div>
              <img src={match.photos[0]} className="w-32 h-32 rounded-full border-4 border-white shadow-xl z-10 object-cover" />
           </div>
           <h2 className="text-3xl font-black">Aktif Eşleşme Devam Ediyor</h2>
           <p className="text-gray-500 max-w-md mx-auto">
             Ciddiyet gereği şu an sadece <b>{match.name}</b> ile görüşebilirsiniz. Diğer adaylar size şu an kapalıdır.
           </p>
           <button onClick={() => navigate(`/chat/${activeMatch}`)} className="px-12 py-5 gradient-bg text-white font-black rounded-3xl shadow-xl hover:scale-105 transition-all">Sohbete Devam Et</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="flex p-1.5 bg-gray-100 rounded-[2rem] shadow-inner">
          <button 
            onClick={() => setView('POOL')}
            className={`px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${view === 'POOL' ? 'bg-white text-rose-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Aday Havuzu
          </button>
          <button 
            onClick={() => setView('MATCHES')}
            className={`px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${view === 'MATCHES' ? 'bg-white text-rose-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Eşleşmelerim ({user.confirmedMatches.length})
          </button>
        </div>

        {/* PWA Kaydetme Vurgusu */}
        <button className="flex items-center gap-3 px-6 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 font-bold text-xs animate-bounce">
          <i className="fa-solid fa-mobile-screen-button"></i>
          Bildirim Almak İçin Uygulamayı Ana Ekrana Ekle
        </button>
      </div>

      {scanning ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
           <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-rose-500 font-black text-xs uppercase tracking-widest">Kriterlerinize Uygun Adaylar Taranıyor...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {view === 'POOL' ? (
            profiles.length > 0 ? (
              profiles.map((p, idx) => (
                <React.Fragment key={p.uid}>
                  <MatchCard profile={p} currentUser={user} mode="POOL" onAction={() => runDiscovery()} />
                  {/* Her 3 kartta bir Rehberlik Reklamı */}
                  {(idx + 1) % 2 === 0 && (
                    <div className="md:col-span-1 glass rounded-[40px] p-8 border-2 border-dashed border-rose-200 flex flex-col items-center text-center justify-center bg-rose-50/30">
                       <i className="fa-solid fa-hands-holding-child text-4xl text-rose-400 mb-4"></i>
                       <h4 className="font-black text-rose-700 mb-2 uppercase text-xs tracking-widest">Profesyonel Destek</h4>
                       <p className="text-gray-600 text-xs mb-6 leading-relaxed">Evlilik yolunda kültürler arası çatışmaları nasıl yönetirsiniz? Uzman rehberlik hizmetimizden faydalanın.</p>
                       <button className="px-6 py-3 bg-white text-rose-500 font-black rounded-xl border border-rose-200 text-[10px] hover:bg-rose-50 transition-all shadow-sm">DETAYLI BİLGİ AL</button>
                    </div>
                  )}
                </React.Fragment>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-400 font-bold">Şu an KRİTERLERİNİZE UYGUN yeni aday bulunmuyor.</p>
              </div>
            )
          ) : (
            user.confirmedMatches.length > 0 ? (
              user.confirmedMatches.map(mid => {
                const p = MOCK_PROFILES.find(x => x.uid === mid);
                return p ? <MatchCard key={mid} profile={p} currentUser={user} mode="MATCH_LIST" onAction={() => runDiscovery()} /> : null;
              })
            ) : (
              <div className="col-span-full text-center py-20">
                <p className="text-gray-400 font-bold">Henüz onaylanmış bir eşleşmeniz yok.</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
