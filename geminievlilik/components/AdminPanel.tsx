
import React, { useState } from 'react';
import { UserProfile, VerificationStatus } from '../types';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'verifications' | 'reports'>('verifications');

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center text-white text-xl">
           <i className="fa-solid fa-gauge-high"></i>
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Kontrol Merkezi</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sistem Güvenlik ve Yönetimi</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon="fa-users" label="Kullanıcılar" />
        <TabBtn active={activeTab === 'verifications'} onClick={() => setActiveTab('verifications')} icon="fa-id-card" label="Doğrulamalar" badge="3" />
        <TabBtn active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon="fa-flag" label="Raporlar" badge="1" />
      </div>

      <div className="glass rounded-[3rem] p-10 border border-white premium-shadow bg-white/60 min-h-[500px]">
        {activeTab === 'verifications' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-black">Bekleyen Kimlik Doğrulamaları</h3>
               <span className="px-4 py-1.5 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest">3 İstek</span>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden"><img src={`https://picsum.photos/100/100?random=${i}`} /></div>
                       <div>
                         <p className="font-black text-gray-800">Mustafa A. <span className="text-[10px] text-gray-400 ml-2">#ID-4829</span></p>
                         <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Türkiye • 32 Yaş</p>
                       </div>
                    </div>
                    <div className="flex gap-3">
                       <button className="px-6 py-2 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all">Reddet</button>
                       <button className="px-6 py-2 gradient-bg text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Evrakları Gör & Onayla</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'reports' && (
           <div className="flex flex-col items-center justify-center py-20 text-center">
              <i className="fa-solid fa-shield-check text-5xl text-gray-200 mb-4"></i>
              <p className="text-gray-400 font-bold">Tüm raporlar incelendi. Sistem temiz.</p>
           </div>
        )}
      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label, badge }: any) => (
  <button onClick={onClick} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all relative ${active ? 'gradient-bg text-white shadow-lg' : 'bg-white text-gray-400 hover:text-gray-600'}`}>
     <i className={`fa-solid ${icon}`}></i>
     {label}
     {badge && <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] border-2 border-white shadow-sm">{badge}</span>}
  </button>
);

export default AdminPanel;
