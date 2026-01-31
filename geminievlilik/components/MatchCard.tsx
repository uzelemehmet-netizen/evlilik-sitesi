
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface MatchCardProps {
  profile: UserProfile;
  currentUser: UserProfile;
  mode: 'POOL' | 'MATCH_LIST';
  onAction: () => void;
  score?: number;
}

const MatchCard: React.FC<MatchCardProps> = ({ profile, currentUser, mode, onAction, score }) => {
  const [liked, setLiked] = useState(false);
  const shouldBlur = profile.photoPrivacy === 'PRIVATE' && mode === 'POOL';

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Bu adayı listenizden kaldırmak istediğinize emin misiniz?")) {
      onAction();
    }
  };

  const handleStartActive = () => {
    if (window.confirm(`Aktif eşleşme başladığında ${profile.username} ile birbirinizi net göreceksiniz. Onaylıyor musunuz?`)) {
      localStorage.setItem('active_match_id', profile.uid);
      localStorage.setItem('active_match_started_at', Date.now().toString());
      window.location.reload();
    }
  };

  return (
    <div className="glass rounded-[48px] overflow-hidden premium-card border border-white flex flex-col h-full bg-white transition-all hover:shadow-2xl active:scale-[0.98] group relative">
      <div className="relative h-80 overflow-hidden">
        <div className="photo-protection-layer" onContextMenu={e => e.preventDefault()}></div>
        <img src={profile.photos[0]} className={`w-full h-full object-cover transition-all duration-1000 select-none pointer-events-none ${shouldBlur ? 'blur-[50px] scale-125' : 'group-hover:scale-110'}`} alt="Candidate" />
        
        {score && !shouldBlur && (
          <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl z-40 border border-rose-100">
             <span className="text-[11px] font-black text-rose-600 uppercase">%{score} Uyum</span>
          </div>
        )}

        {shouldBlur && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-40 text-white p-8 text-center bg-black/10">
             <div className="w-16 h-16 bg-white/20 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center mb-5 border border-white/30 floating-label"><i className="fa-solid fa-user-secret text-2xl"></i></div>
             <p className="text-[9px] font-medium opacity-80 leading-relaxed px-4">Fotoğraf sadece karşılıklı ilgi onaylandığında netleşir.</p>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
        <div className="absolute bottom-6 left-8 text-white z-40">
           <h3 className="text-2xl font-black tracking-tight">@{profile.username}, {profile.age}</h3>
           <p className="text-[10px] font-bold uppercase text-white/70">{profile.occupation}</p>
        </div>
      </div>

      <div className="p-8 pt-6 space-y-6 flex-grow relative">
        <div className="flex flex-wrap gap-2">
          <span className="text-[9px] font-black px-3 py-1.5 bg-rose-50 text-rose-500 rounded-xl uppercase">{profile.country}</span>
        </div>

        {mode === 'POOL' ? (
          <div className="grid grid-cols-[1fr_2.5fr] gap-4">
             <button onClick={handleRemove} className="h-16 bg-gray-50 text-gray-400 rounded-[2rem] flex items-center justify-center hover:bg-gray-100 border border-gray-100"><i className="fa-solid fa-xmark text-xl"></i></button>
             <button onClick={handleLike} className={`h-16 flex items-center justify-center gap-3 organic-btn font-black text-xs uppercase tracking-widest shadow-xl transition-all ${liked ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-white text-rose-500 border-2 border-rose-100'}`}>
                <i className={`fa-solid ${liked ? 'fa-heart' : 'fa-heart-circle-plus'} text-lg`}></i>
                {liked ? 'Beğenildi' : 'İlgi Göster'}
             </button>
          </div>
        ) : (
          <button onClick={handleStartActive} className="w-full h-16 gradient-bg text-white organic-btn font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200">Aktif Görüşmeyi Başlat</button>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
