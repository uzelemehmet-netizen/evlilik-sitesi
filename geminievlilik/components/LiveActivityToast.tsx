
import React, { useEffect, useState } from 'react';

interface Activity {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  city: string;
  country: string;
  timestamp: number;
}

const LiveActivityToast: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const names = {
      MALE: ['Emre', 'Can', 'Burak', 'Arif', 'Budi', 'Aditya', 'Reza'],
      FEMALE: ['Selin', 'Derya', 'Ayu', 'Indah', 'Putri', 'Zeynep', 'Merve']
    };
    const cities = {
      Turkey: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'],
      Indonesia: ['Jakarta', 'Bandung', 'Surabaya', 'Bali']
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.75) {
        const gender = Math.random() > 0.5 ? 'MALE' : 'FEMALE';
        const country = Math.random() > 0.5 ? 'Turkey' : 'Indonesia';
        const name = names[gender][Math.floor(Math.random() * names[gender].length)];
        const city = cities[country][Math.floor(Math.random() * cities[country].length)];
        
        const newActivity: Activity = {
          id: Date.now().toString(),
          name,
          gender,
          city,
          country,
          timestamp: Date.now()
        };

        setActivities(prev => [...prev, newActivity]);
        setTimeout(() => {
          setActivities(prev => prev.filter(a => a.id !== newActivity.id));
        }, 6000);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-24 right-6 z-[200] flex flex-col gap-4 pointer-events-none">
      {activities.map(activity => (
        <div 
          key={activity.id}
          className={`pointer-events-auto flex items-center gap-4 p-5 rounded-[2.5rem] border shadow-2xl animate-in slide-in-from-right-10 duration-500 bg-white/95 backdrop-blur-xl ${
            activity.gender === 'FEMALE' ? 'border-rose-100' : 'border-blue-100'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
            activity.gender === 'FEMALE' ? 'gradient-bg' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}>
            <i className={`fa-solid ${activity.gender === 'FEMALE' ? 'fa-venus' : 'fa-mars'} text-xl`}></i>
          </div>
          
          <div className="pr-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yeni Üye</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <h4 className="text-sm font-black text-slate-900">
              {activity.name} • {activity.city}, {activity.country === 'Turkey' ? 'TR' : 'ID'}
            </h4>
            <p className="text-[10px] font-bold text-slate-500 italic mt-0.5">
              Ciddi bir yuva kurmak için aramıza katıldı.
            </p>
          </div>

          <button 
            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors"
            onClick={(e) => {
              const target = e.currentTarget.parentElement;
              if (target) target.style.display = 'none';
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

export default LiveActivityToast;
