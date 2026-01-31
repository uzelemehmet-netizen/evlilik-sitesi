
import React, { useState, useEffect, useRef } from 'react';

// Maskotun alabileceği profesyonel durumlar
export type NikoMood = 'IDLE' | 'WAVE' | 'PULL' | 'SUCCESS' | 'THINK' | 'SHY' | 'WALKING_HEART' | 'SAD' | 'EATING_APPLE' | 'CELEBRATE' | 'NONE';

interface MascotNikoProps {
  mood: NikoMood;
  customText?: string;
  onComplete?: () => void;
  /** 
   * Buraya tasarladığınız dosyanın URL'sini koyabilirsiniz. 
   * Örn: Lottie JSON URL, Rive URL veya şeffaf bir GIF/PNG 
   */
  customAssetUrl?: string; 
}

/**
 * MascotNiko: Profesyonel tasarımlar için optimize edilmiş akıllı taşıyıcı.
 * Tasarım bittiğinde bu bileşen sadece bir 'Player' görevi görecektir.
 */
const MascotNiko: React.FC<MascotNikoProps> = ({ mood, customText, onComplete, customAssetUrl }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (mood !== 'NONE' || customText) {
      setIsVisible(true);
      // Karakter belirdikten kısa süre sonra balon çıksın (Senkron)
      const bubbleTimer = setTimeout(() => setShowBubble(true), 300);

      // Metin uzunluğuna göre okuma süresi hesapla (Min 4sn)
      const displayDuration = Math.max(4000, (customText?.length || 0) * 80);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setShowBubble(false);
        setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 400);
      }, displayDuration);

      return () => {
        clearTimeout(bubbleTimer);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    } else {
      setShowBubble(false);
      setIsVisible(false);
    }
  }, [mood, customText, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[999] pointer-events-none flex flex-col items-end gap-2 max-w-[300px]">
      
      {/* MESAJ BALONU - Ultra Modern & Hafif */}
      <div className={`transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        showBubble ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'
      }`}>
        <div className="bg-white/95 backdrop-blur-md border border-rose-100 rounded-3xl rounded-br-none p-5 shadow-[0_15px_30px_rgba(0,0,0,0.08)] relative">
          <p className="text-[13px] font-semibold text-gray-700 leading-snug">
            {customText}
          </p>
          {/* Ok ucu */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white/95 border-r border-b border-rose-100 rotate-45"></div>
        </div>
      </div>

      {/* KARAKTER ALANI (120px x 120px - İdeal Boyut) */}
      <div className={`relative w-28 h-28 transition-all duration-500 ease-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
      }`}>
        
        {customAssetUrl ? (
          /* Sizin tasarladığınız profesyonel dosya burada görünecek */
          <div className="w-full h-full animate-float">
             <img src={customAssetUrl} className="w-full h-full object-contain" alt="Niko Mascot" />
          </div>
        ) : (
          /* Geçici Minimalist Tasarım (Placeholder) */
          <div className="w-full h-full animate-float bg-gradient-to-br from-rose-400 to-rose-600 rounded-full shadow-lg flex items-center justify-center border-4 border-white">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-niko-blink"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-niko-blink"></div>
            </div>
          </div>
        )}
        
        {/* Durum Göstergesi */}
        <div className="absolute bottom-2 right-2 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
      </div>

      <style>{`
        @keyframes niko-blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        .animate-niko-blink { animation: niko-blink 4s infinite; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default MascotNiko;
