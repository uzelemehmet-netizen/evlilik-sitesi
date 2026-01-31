
import React from 'react';

interface LandingPageProps {
  onLogin: () => void;
  hasSavedAccount: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, hasSavedAccount }) => {
  return (
    <div className="relative flex flex-col items-center">
      
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        <div className="absolute top-20 -left-20 w-80 h-80 gradient-bg rounded-full blur-[140px] opacity-20"></div>
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-amber-400 rounded-full blur-[140px] opacity-10"></div>

        <div className="max-w-4xl relative z-10 animate-in fade-in zoom-in duration-1000">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-rose-50 text-rose-600 rounded-full text-[12px] font-black uppercase tracking-[0.3em] mb-12 shadow-sm shadow-rose-100">
             <i className="fa-solid fa-shield-heart text-rose-400"></i>
             Sadece Ciddi Niyetliler İçin
          </div>

          <h1 className="text-6xl md:text-[7rem] font-black text-slate-900 mb-10 leading-[0.85] tracking-tighter">
            Gerçek Bir Yuva,<br />
            <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
              Burada Başlar.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 mb-14 max-w-3xl mx-auto leading-relaxed font-medium">
            Türkiye ve Endonezya'nın en prestijli, ciddi evlilik odaklı tanışma platformuna hoş geldiniz. 
            Amacı sadece hayat arkadaşını bulmak olan insanların buluşma noktası.
          </p>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
            <button 
              onClick={onLogin}
              className="group relative px-14 py-7 gradient-bg text-white font-black text-2xl rounded-[3rem] shadow-[0_30px_60px_-12px_rgba(244,63,94,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-5 min-w-[340px]"
            >
              <i className="fa-solid fa-heart-circle-check text-2xl"></i>
              {hasSavedAccount ? 'Hesabıma Dön' : 'Yolculuğa Başla'}
            </button>
            
            <a href="#kurallar" className="px-12 py-7 bg-white text-slate-700 font-bold text-2xl rounded-[3rem] border-2 border-slate-100 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-4 shadow-xl min-w-[300px]">
              Platform Kuralları
            </a>
          </div>
        </div>
      </section>

      {/* Rules & Integrity Section */}
      <section id="kurallar" className="w-full bg-white py-24 px-6 border-y border-rose-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Ciddiyet Sözleşmemiz</h2>
            <div className="w-24 h-1.5 gradient-bg mx-auto rounded-full"></div>
            <p className="mt-8 text-slate-400 font-bold uppercase tracking-widest text-xs">Okumanız Zorunludur</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            <div className="space-y-8">
              <RuleCard 
                icon="fa-ring"
                title="Sadece Evlilik Amacı"
                content="Bu platform; eğlence, boş vakit geçirme veya evlilik dışı flört ilişkileri arayanlar için uygun değildir. Amacınız gerçekten yuva kurmak ise doğru yerdesiniz."
              />
              <RuleCard 
                icon="fa-check-double"
                title="Şeffaflık ve Doğru Bilgi"
                content="Profil formundaki bilgiler eşleşme kalitesini belirler. Yanıltıcı bilgi eklemekten kaçının; dürüstlük, güven inşa etmenin ilk adımıdır."
              />
              <RuleCard 
                icon="fa-lock"
                title="Maksimum Veri Koruması"
                content="Gerçek adınız ve telefonunuz sistemde saklı kalır. Sadece izin verdiğiniz kişiler sizinle site içi güvenli kanaldan iletişim kurabilir."
              />
            </div>

            <div className="space-y-8">
              <div className="p-10 rules-card rounded-[3rem] shadow-sm">
                <h3 className="text-2xl font-black text-rose-600 mb-6 flex items-center gap-3">
                  <i className="fa-solid fa-gavel"></i>
                  Sıfır Tolerans Politikası
                </h3>
                <div className="space-y-4 text-slate-600 font-semibold leading-relaxed text-sm">
                  <p className="flex gap-3">
                    <span className="text-rose-500 font-black">•</span>
                    Küfürlü, hakaret içerikli konuşmalar, ekran görüntüleri ile kanıtlandığı anda kullanıcı <b>kalıcı olarak</b> sistemden engellenir.
                  </p>
                  <p className="flex gap-3">
                    <span className="text-rose-500 font-black">•</span>
                    Engellenen kullanıcının varsa aktif üyeliği <b>iptal edilir ve ücret iadesi yapılmaz.</b>
                  </p>
                  <p className="flex gap-3">
                    <span className="text-rose-500 font-black">•</span>
                    Platformda herkese <b>eşleşme garantisi verilmez.</b> Uygun adaylar kriterlerinize göre profil sayfanızda listelenir.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <i className="fa-solid fa-handshake-angle text-8xl"></i>
                </div>
                <h4 className="text-xl font-black mb-4">Huzurlu Bir Başlangıç</h4>
                <p className="text-slate-400 font-medium leading-relaxed">
                  Gerçekten evlilik gayesi güden insanların buluşma noktasına adım attınız. 
                  Saygı, dürüstlük ve ciddiyet temel ilkemizdir.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

const RuleCard = ({ icon, title, content }: any) => (
  <div className="flex gap-6 p-8 rounded-[2.5rem] bg-white border border-slate-50 hover:border-rose-100 transition-all duration-500 hover:shadow-xl hover:shadow-rose-50 group">
    <div className="w-16 h-16 shrink-0 gradient-bg rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform">
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <div>
      <h3 className="text-lg font-black text-slate-800 mb-2 uppercase tracking-tight">{title}</h3>
      <p className="text-slate-500 text-sm font-medium leading-relaxed">{content}</p>
    </div>
  </div>
);

export default LandingPage;
