
import React from 'react';

interface Stage {
  id: number;
  label: string;
  icon: string;
  desc: string;
}

const STAGES: Stage[] = [
  { id: 1, label: 'Tanışma', icon: 'fa-comments', desc: 'İlk sohbet ve buzları eritme' },
  { id: 2, label: 'Görüntülü', icon: 'fa-video', desc: 'Güven için ilk canlı görüşme' },
  { id: 3, label: 'Aileler', icon: 'fa-users-line', desc: 'Dijital ortamda aile tanışması' },
  { id: 4, label: 'Lojistik', icon: 'fa-passport', desc: 'Vize ve uçuş planlaması' },
  { id: 5, label: 'Buluşma', icon: 'fa-plane-arrival', desc: 'İlk yüz yüze görüşme' }
];

interface RelationshipRoadmapProps {
  currentHours: number;
}

const RelationshipRoadmap: React.FC<RelationshipRoadmapProps> = ({ currentHours }) => {
  // Basit bir mantık: Her 24 saatte bir aşama (gerçekte manuel onay olmalı)
  const currentStage = Math.min(Math.floor(currentHours / 24) + 1, 5);

  return (
    <div className="glass rounded-[2.5rem] p-6 border border-white bg-white/60 shadow-inner">
      <div className="flex items-center gap-2 mb-6">
        <i className="fa-solid fa-map-location-dot text-rose-500"></i>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-800">Evlilik Yol Haritası</h4>
      </div>

      <div className="relative flex justify-between">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -z-10">
          <div 
            className="h-full gradient-bg transition-all duration-1000" 
            style={{ width: `${((currentStage - 1) / (STAGES.length - 1)) * 100}%` }}
          ></div>
        </div>

        {STAGES.map((stage) => {
          const isActive = stage.id <= currentStage;
          const isCurrent = stage.id === currentStage;

          return (
            <div key={stage.id} className="flex flex-col items-center group relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shadow-sm ${
                isActive ? 'gradient-bg text-white scale-110' : 'bg-white text-gray-300'
              } ${isCurrent ? 'ring-4 ring-rose-100' : ''}`}>
                <i className={`fa-solid ${stage.icon} text-xs`}></i>
              </div>
              <span className={`text-[8px] font-black uppercase mt-3 tracking-tighter ${isActive ? 'text-rose-600' : 'text-gray-400'}`}>
                {stage.label}
              </span>

              {/* Tooltip */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 p-2 bg-gray-900 text-white rounded-lg text-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                {stage.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RelationshipRoadmap;
