
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ProfileForm from './components/ProfileForm';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import ChatRoom from './components/ChatRoom';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import LiveActivityToast from './components/LiveActivityToast';
import { UserProfile, MembershipTier, VerificationStatus } from './types';

const INITIAL_MOCK_USER: UserProfile = {
  uid: '',
  username: '',
  name: '',
  age: 0,
  gender: 'MALE',
  targetGender: 'FEMALE',
  minTargetAge: 21,
  maxTargetAge: 45,
  country: 'Turkey',
  city: '',
  nationality: 'Türkiye',
  incomeLevel: 'Orta',
  maritalStatus: 'Bekar',
  hasChildren: false,
  numberOfChildren: 0,
  childrenStatus: 'Çocuğum yok',
  relocationStatus: 'Belki',
  languages: '',
  willUseTranslation: true,
  partnerCanUseTranslation: true,
  intent: 'Ciddi Evlilik',
  bio: '',
  photos: [],
  photoPrivacy: 'PUBLIC',
  isVerified: false,
  verificationStatus: VerificationStatus.NONE,
  membershipTier: MembershipTier.FREE,
  isAdmin: false,
  lastSeen: Date.now(),
  isOnline: true,
  education: '',
  occupation: '',
  smoker: false,
  wantKids: 'Evet',
  religiousLevel: 'Orta',
  likedBy: [],
  likes: [],
  confirmedMatches: [],
  profileAccessGranted: [],
  dislikedUsers: [],
  dailyMessageCount: 0,
  profileUpdatedCount: 0,
  phoneNumber: ''
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('nikahtan_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch (e) {
        console.error("User data error", e);
      }
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (isNewUser: boolean, email?: string) => {
    setIsAuthModalOpen(false);
    if (isNewUser) {
      const newUser = { ...INITIAL_MOCK_USER, uid: 'user_' + Date.now() };
      setUser(newUser);
      localStorage.setItem('nikahtan_user', JSON.stringify(newUser));
    } else {
      const savedUser = localStorage.getItem('nikahtan_user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nikahtan_user');
    localStorage.removeItem('active_match_id');
  };

  if (loading) return null;

  const isProfileComplete = user && user.username !== '' && user.photos && user.photos.length > 0 && user.phoneNumber !== '';
  const isAuthButNotComplete = user && !isProfileComplete;

  return (
    <Router>
      <div className="min-h-screen bg-[#fffafa] flex flex-col">
        <Navbar user={isProfileComplete ? user : null} onLogout={handleLogout} onLoginClick={() => setIsAuthModalOpen(true)} />
        <LiveActivityToast />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={handleAuthSuccess} />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={isProfileComplete ? <Navigate to="/dashboard" /> : isAuthButNotComplete ? <Navigate to="/setup" /> : <LandingPage onLogin={() => setIsAuthModalOpen(true)} hasSavedAccount={!!localStorage.getItem('nikahtan_user')} />} />
            <Route path="/setup" element={isAuthButNotComplete ? <ProfileForm user={user!} onComplete={(p) => { setUser(p); localStorage.setItem('nikahtan_user', JSON.stringify(p)); }} /> : <Navigate to="/" />} />
            <Route path="/dashboard" element={isProfileComplete ? <Dashboard user={user!} /> : <Navigate to="/" />} />
            <Route path="/profile" element={isProfileComplete ? <ProfilePage user={user!} onUpdate={(p) => { setUser(p); localStorage.setItem('nikahtan_user', JSON.stringify(p)); }} onLogout={handleLogout} /> : <Navigate to="/" />} />
            <Route path="/chat/:matchId" element={isProfileComplete ? <ChatRoom user={user!} /> : <Navigate to="/" />} />
            <Route path="/admin" element={user?.isAdmin ? <AdminPanel /> : <Navigate to="/" />} />
          </Routes>
        </main>
        
        <footer className="py-12 text-center border-t border-pink-50 bg-white/50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">© 2024 Nikahtan. Türkiye & Endonezya Ciddi Evlilik Platformu.</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
