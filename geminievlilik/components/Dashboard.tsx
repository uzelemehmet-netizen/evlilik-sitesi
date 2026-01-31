
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, MembershipTier, VerificationStatus } from '../types';
import MatchCard from './MatchCard';
import { calculateMatchScore } from '../matchEngine';

interface DashboardProps {
  user: UserProfile;
}

const MOCK_PROFILES: UserProfile[] = [
  {
    uid: 'p1', username: 'IndahAyu', name: 'Nurul Huda', age: 26, gender: 'FEMALE', targetGender: 'MALE', 
    minTargetAge: 25, maxTargetAge: 35, country: 'Indonesia', city: 'Jakarta',
    nationality: 'Endonezya', incomeLevel: 'Orta',
    maritalStatus: 'Bekar', intent: 'Ciddi Evlilik', bio: 'Geleneksel bir aile yapım var.',
    photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop'], isVerified: true,
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
    photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'], isVerified: false,
    photoPrivacy: 'PRIVATE',
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
  const [profiles, setProfiles] = useState<{ profile: UserProfile, score: number }[]>([]);
  const [scanning, setScanning] = useState(true);
  const activeMatch = localStorage.getItem('active_match_id');
  const navigate = useNavigate();

  const runDiscovery = useCallback(() => {
    setScanning(true);
    setTimeout(() => {
      const filtered = MOCK_PROFILES.filter(p => {
        const genderMatch = p.gender === user.targetGender && user.gender === p.targetGender;
        const ageMatch = (p.age >= user.minTargetAge && p.age <= user.maxTargetAge);
        return genderMatch && ageMatch && !user.confirmedMatches.includes(p.uid);
      });

      const scoredAndSorted = filtered
        .map(p => ({ profile: p, score: calculateMatchScore(user, p) }))
        .sort((a, b) => b.score - a.score);

      setProfiles(scoredAndSorted);
      setScanning(false);
    }, 1500);
  }, [user]);

  useEffect(() => {
    if (!activeMatch) runDiscovery();
  }, [activeMatch, view, runDiscovery]);

  if (activeMatch) {
    const match = MOCK_PROFILES.find(p => p.uid === activeMatch) || MOCK_PROFILES[0];
    return (
      <div className="max-w-4xl mx-auto py-20 px-6">
        <div className="glass rounded-[4rem] p-12 text-center premium-card border border-white space-y-10 animate-in zoom-in bg-white/95">
           <div className="flex justify-center -space-x-8 items-center">
              <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden z-10">
                 <img src={user.photos[0]} className="w-full h-full object-cover" />
              </div>
              <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center text-white text-3xl z-20 border-4 border-white shadow-2xl floating-label">
                 <i className="fa-solid fa-heart"></i>
              </div>
              <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden z-10">
                 <img src={match.photos[0]} className="w-full h-full object-cover" />
              </div>
           </div>
           <div className="space-y-4">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">Eşleşme Kilitlendi</h2>
              <p className="text-gray-500 max-w-sm mx-auto font-medium leading-relaxed">
                Şu an sadece <b>@{match.username}</b> ile iletişimdesiniz. Ciddiyet kuralı gereği diğer adaylar geçici olarak kapalıdır.
              </p>
           </div>
           <button onClick={() => navigate(`/chat/${activeMatch}`)} className="h-16 px-12 gradient-bg text-white organic-btn font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-200">Mesajlara Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
        <div className="flex p-2 bg-gray-50 rounded-[2.5rem] shadow-inner border border-gray-100">
          <button 
            onClick={() => setView('POOL')}
            className={`px-8 py-3.5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${view === 'POOL' ? 'bg-white text-rose-600 shadow-md' : 'text-gray-400'}`}
          >
            Aday Havuzu
          </button>
          <button 
            onClick={() => setView('MATCHES')}
            className={`px-8 py-3.5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${view === 'MATCHES' ? 'bg-white text-rose-600 shadow-md' : 'text-gray-400'}`}
          >
            Konuşmalarım ({user.confirmedMatches.length})
          </button>
        </div>
      </div>

      {scanning ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-8">
           <div className="relative">
              <div className="w-24 h-24 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <i className="fa-solid fa-magnifying-glass text-rose-500 animate-pulse"></i>
              </div>
           </div>
           <h4 className="text-xl font-black text-gray-900 text-center">Adaylar Analiz Ediliyor</h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {view === 'POOL' ? (
            profiles.length > 0 ? (
              profiles.map((item) => (
                <MatchCard key={item.profile.uid} profile={item.profile} currentUser={user} mode="POOL" onAction={() => runDiscovery()} score={item.score} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Şu an kriterlerinize uygun yeni aday bulunmuyor.</p>
              </div>
            )
          ) : (
            user.confirmedMatches.length > 0 ? (
              user.confirmedMatches.map(mid => {
                const p = MOCK_PROFILES.find(x => x.uid === mid);
                return p ? <MatchCard key={mid} profile={p} currentUser={user} mode="MATCH_LIST" onAction={() => runDiscovery()} /> : null;
              })
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Henüz onaylanmış bir eşleşmeniz yok.</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
