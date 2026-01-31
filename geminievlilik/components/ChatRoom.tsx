
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile, Message } from '../types';
import RelationshipRoadmap from './RelationshipRoadmap';
import { translateMessage } from '../geminiService';
import { COMMON_QUESTIONS, ReadyQuestion } from '../dataContent';

interface ChatRoomProps {
  user: UserProfile;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ user }) => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
     { id: '1', matchId: matchId!, senderId: 'p1', text: 'Selamlar, profilinizi çok samimi buldum.', timestamp: Date.now() - 3600000 }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showReadyQuestions, setShowReadyQuestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isSending) return;
    
    setIsSending(true);
    const tempId = Date.now().toString();
    const targetLang = user.country === 'Turkey' ? 'Indonesian' : 'Turkish';
    
    const newMessage: Message = { 
      id: tempId, 
      matchId: matchId!, 
      senderId: user.uid, 
      text: text, 
      timestamp: Date.now() 
    };
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setShowReadyQuestions(false);

    try {
      const translated = await translateMessage(text, targetLang);
      if (translated !== text) {
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, translatedText: translated } : m
        ));
      }
    } catch (e) {
      console.warn("Çeviri atlandı (API hatası)");
    } finally {
      setIsSending(false);
    }
  };

  const sendReadyQuestion = (q: ReadyQuestion) => {
    const text = user.country === 'Turkey' ? q.tr : q.id;
    const translation = user.country === 'Turkey' ? q.id : q.tr;
    
    const newMessage: Message = { 
      id: Date.now().toString(), 
      matchId: matchId!, 
      senderId: user.uid, 
      text: text,
      translatedText: translation, 
      timestamp: Date.now() 
    };
    setMessages(prev => [...prev, newMessage]);
    setShowReadyQuestions(false);
  };

  const simulateVoiceMessage = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const newMessage: Message = {
        id: Date.now().toString(),
        matchId: matchId!,
        senderId: user.uid,
        audioUrl: 'mock-audio-url',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, newMessage]);
    }, 2000);
  };

  const cancelMatch = async () => {
    if (window.confirm("Bu görüşmeyi sonlandırmak istediğinize emin misiniz?")) {
      localStorage.removeItem('active_match_id');
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row h-[calc(100vh-120px)] p-6 gap-6">
      <div className="md:w-1/3 flex flex-col gap-4">
        <RelationshipRoadmap currentHours={12} />
        <div className="glass rounded-[3rem] p-8 space-y-4 bg-white shadow-xl">
           <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Görüşme Yönetimi</h4>
           <button onClick={cancelMatch} className="w-full py-4 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all text-[10px] uppercase border border-dashed border-gray-200">
             Görüşmeyi İptal Et
           </button>
        </div>
      </div>

      <div className="md:w-2/3 flex flex-col glass rounded-[3rem] overflow-hidden bg-white/40 border border-white relative">
        {showReadyQuestions && (
          <div className="absolute inset-x-0 bottom-24 z-50 p-6 animate-in slide-in-from-bottom-10">
            <div className="glass bg-white/95 rounded-[2.5rem] p-6 shadow-2xl border-2 border-rose-100 max-h-64 overflow-y-auto custom-scrollbar">
               <div className="flex justify-between items-center mb-4 px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500">Buz Kırıcı Hazır Sorular</h4>
                  <button onClick={() => setShowReadyQuestions(false)}><i className="fa-solid fa-circle-xmark text-gray-300"></i></button>
               </div>
               <div className="grid grid-cols-1 gap-2">
                  {COMMON_QUESTIONS.map((q, i) => (
                    <button 
                      key={i} 
                      onClick={() => sendReadyQuestion(q)}
                      className="text-left p-4 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 group"
                    >
                      <span className="text-[10px] font-black text-rose-300 uppercase mr-2">{q.category}</span>
                      <p className="text-xs font-bold text-gray-700 group-hover:text-rose-600">{user.country === 'Turkey' ? q.tr : q.id}</p>
                    </button>
                  ))}
               </div>
            </div>
          </div>
        )}

        <div className="p-6 border-b border-white bg-white/60 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500"><i className="fa-solid fa-user"></i></div>
              <h3 className="font-black text-gray-800 tracking-tight">Eş Adayınız</h3>
           </div>
        </div>

        <div ref={scrollRef} className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar">
           {messages.map(m => (
             <div key={m.id} className={`flex ${m.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[80%] p-6 rounded-[2.5rem] shadow-sm relative ${
                 m.senderId === user.uid ? 'gradient-bg text-white' : 'bg-white text-gray-800 border border-rose-50'
               }`}>
                 {m.text && <p className="text-sm font-medium">{m.text}</p>}
                 {m.translatedText && (
                   <div className="mt-2 pt-2 border-t border-white/20 text-[10px] font-bold italic opacity-80">
                     <i className="fa-solid fa-language mr-1"></i> {m.translatedText}
                   </div>
                 )}
                 {m.audioUrl && (
                   <div className="flex items-center gap-4 min-w-[150px]">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><i className="fa-solid fa-play"></i></div>
                      <div className="flex-grow h-1 bg-white/30 rounded-full relative overflow-hidden">
                         <div className="absolute inset-0 bg-white/60 w-1/2 animate-pulse"></div>
                      </div>
                      <span className="text-[10px] font-black opacity-60">0:12</span>
                   </div>
                 )}
               </div>
             </div>
           ))}
        </div>

        <div className="p-6 bg-white/90 backdrop-blur-md flex items-center gap-4 border-t border-white">
          <button 
            disabled={isSending}
            onClick={() => setShowReadyQuestions(!showReadyQuestions)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              showReadyQuestions ? 'gradient-bg text-white' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
            }`}
          >
            <i className="fa-solid fa-comments-question"></i>
          </button>

          <input 
            value={inputText} 
            disabled={isSending}
            onChange={e => setInputText(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={isSending ? "Çevriliyor..." : "Duygularınızı paylaşın..."} 
            className="flex-grow bg-gray-50 px-8 py-5 rounded-[2rem] outline-none font-bold shadow-inner border border-transparent focus:border-rose-100 transition-all disabled:opacity-50" 
          />
          
          <button 
            type="button"
            onClick={simulateVoiceMessage}
            disabled={isSending}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hidden sm:flex ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
            }`}
          >
            <i className={`fa-solid ${isRecording ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
          </button>

          <button 
            onClick={() => handleSend()} 
            disabled={isSending || !inputText.trim()}
            className="w-14 h-14 gradient-bg text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSending ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
