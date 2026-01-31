
import React, { useState, useEffect } from 'react';
import { GENDER_SPECIFIC_QUESTIONS, GameQuestion } from '../matchQuestions';
import { UserProfile } from '../types';
import { NikoMood } from './MascotNiko';

interface MatchTestFlowProps {
  partner: UserProfile;
  currentUser: UserProfile;
  onClose: () => void;
  triggerNiko?: (mood: NikoMood, text?: string) => void;
}

const MatchTestFlow: React.FC<MatchTestFlowProps> = ({ partner, currentUser, onClose, triggerNiko }) => {
  const [step, setStep] = useState<'WARNING' | 'GAME' | 'RESULT'>('WARNING');
  const [testAttempt, setTestAttempt] = useState(0);
  const [turnIndex, setTurnIndex] = useState(0); 
  const [phase, setPhase] = useState<'ANSWERING' | 'SCORING'>('ANSWERING');
  const [currentAnswer, setCurrentAnswer] = useState<string | null>(null);
  const [scores, setScores] = useState<{ me: number; partner: number }>({ me: 0, partner: 0 });

  useEffect(() => {
    const key = `test_attempt_${partner.uid}`;
    const saved = Number(localStorage.getItem(key) || 0);
    setTestAttempt(saved % 4); 
  }, [partner.uid]);

  const handleScore = (points: number) => {
    if (currentQuestion.askedBy === currentUser.gender) {
      setScores(prev => ({ ...prev, partner: prev.partner + points }));
    } else {
      setScores(prev => ({ ...prev, me: prev.me + points }));
    }

    if (turnIndex < 9) {
      setTurnIndex(prev => prev + 1);
      setPhase('ANSWERING');
      setCurrentAnswer(null);
    } else {
      const nextAttempt = testAttempt + 1;
      localStorage.setItem(`test_attempt_${partner.uid}`, nextAttempt.toString());
      setStep('RESULT');
      
      // Test sonucu iyiyse Niko elma yesin
      const avg = Math.round((((scores.me + points) / 25) * 100 + (scores.partner / 25) * 100) / 2);
      if (avg >= 70 && triggerNiko) {
        triggerNiko('EATING_APPLE', 'Valla ufukta aşk kokusu var... Ben elmamı bitireyim de siz düğün hazırlığına başlayın! 🍎');
      }
    }
  };

  const sessionQuestions = GENDER_SPECIFIC_QUESTIONS.slice(testAttempt * 10, (testAttempt + 1) * 10);
  const currentQuestion = sessionQuestions[turnIndex];
  const isMyTurnToAnswer = currentQuestion.askedBy !== currentUser.gender;

  if (step === 'WARNING') {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
        <div className="glass max-w-lg w-full p-12 rounded-[3.5rem] text-center bg-white">
          <h2 className="text-3xl font-black mb-4">Uyum Seansı #{testAttempt + 1}</h2>
          <button onClick={() => setStep('GAME')} className="w-full py-5 gradient-bg text-white font-black rounded-2xl">Seansı Başlat</button>
        </div>
      </div>
    );
  }

  if (step === 'RESULT') {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-rose-50/95 backdrop-blur-2xl">
        <div className="glass max-w-md w-full p-10 rounded-[40px] text-center bg-white">
          <h3 className="text-xl font-black mb-3">Analiz Tamamlandı!</h3>
          <p className="text-xs mb-8">Niko sonuçları senin için yorumladı, ekranın sağına bir bak istersen! 😉</p>
          <button onClick={onClose} className="w-full py-5 gradient-bg text-white font-black rounded-2xl">Sohbete Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white/40 backdrop-blur-3xl">
      <div className="w-full max-w-2xl">
        <div className="glass rounded-[40px] p-10 bg-white/95 shadow-2xl">
          <h3 className="text-2xl font-black text-center mb-10">{currentQuestion.text}</h3>
          {phase === 'ANSWERING' ? (
            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((opt, i) => (
                <button key={i} onClick={() => { setCurrentAnswer(opt); setPhase('SCORING'); }} disabled={!isMyTurnToAnswer} className="p-6 border-2 rounded-3xl text-left bg-white font-bold">{opt}</button>
              ))}
            </div>
          ) : (
            <div className="text-center">
               <p className="text-xl font-black mb-8">{currentAnswer}</p>
               <div className="flex justify-center gap-2">
                 {[1,2,3,4,5].map(p => <button key={p} onClick={() => handleScore(p)} className="w-14 h-14 rounded-2xl bg-white border-2 border-rose-100 text-rose-500 font-black">{p}</button>)}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchTestFlow;
