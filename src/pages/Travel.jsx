import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import HeroSocialButtons from '../components/HeroSocialButtons';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plane, MapPin, Calendar, Users, DollarSign, CheckCircle, MessageCircle, AlertCircle, Palmtree, Send } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { buildWhatsAppUrl } from '../utils/whatsapp';

export default function Travel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    from_name: '',
    from_email: '',
    phone: '',
    participation_type: '',
    group_type: '',
    travel_dates: '',
    number_of_people: '',
    package_preference: '',
    interests: '',
    budget_range: '',
    additional_details: '',
    privacy_consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    emailjs.init({
      publicKey: '4gPu39idFW7kmAtv3',
      blockHeadless: false,
    });
  }, []);

  // URL parametrelerinden katılım tipi ve tur bilgisini form alanlarına yansıt
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const participation = params.get('participation');
    const tour = params.get('tour');

    if (!participation && !tour) return;

    setFormData((prev) => ({
      ...prev,
      participation_type: participation || prev.participation_type,
      package_preference: tour || prev.package_preference,
    }));
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleInterestChipClick = (chip) => {
    setFormData((prev) => {
      if (!prev.interests) return { ...prev, interests: chip };
      if (prev.interests.includes(chip)) return prev;
      return { ...prev, interests: `${prev.interests}, ${chip}` };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.privacy_consent) {
      setError('Gizlilik politikasını okuduğunuzu ve kabul ettiğinizi onaylamalısınız.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await emailjs.send(
        'service_cnba43s',
        'template_an057sw',
        {
          from_name: formData.from_name,
          from_email: formData.from_email,
          phone: formData.phone,
              participation_type: formData.participation_type,
              group_type: formData.group_type,
          travel_dates: formData.travel_dates,
          number_of_people: formData.number_of_people,
          package_preference: formData.package_preference,
          interests: formData.interests,
          budget_range: formData.budget_range,
          additional_details: formData.additional_details,
          to_email: 'uzelemehmet@gmail.com'
        }
      );

      if (response.status === 200) {
        // Google Ads Conversion Tracking
        if (window.gtag) {
          window.gtag('event', 'conversion', {
            'send_to': 'AW-17732388792/X1NRCLaZ4sQbELiPu4dC',
            'value': 1.0,
            'currency': 'TRY',
            'transaction_id': response.status
          });
        }
        setSuccess(true);
        setFormData({
          from_name: '',
          from_email: '',
          phone: '',
          participation_type: '',
          group_type: '',
          travel_dates: '',
          number_of_people: '',
          package_preference: '',
          interests: '',
          budget_range: '',
          additional_details: '',
          privacy_consent: false,
        });
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      setError('Teklif gönderilirken hata oluştu. Lütfen tekrar deneyiniz.');
      console.error('EmailJS Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50/40">
      <Navigation />

      {/* Hero Section - Bireysel Seyahat & Balayı */}
      <section
        className="pt-20 pb-12 px-4 relative overflow-hidden min-h-80"
        style={{
          backgroundImage:
            "url(https://res.cloudinary.com/dj1xg1c56/image/upload/v1767374141/vecteezy_airplane-in-flight-taking-off-against-a-stunning-sunset-sky_75330371_nzeduz.jpg)",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/30" />
        <div className="max-w-7xl mx-auto relative z-10 text-center flex flex-col justify-center items-center min-h-80">
          <h1
            className="text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-2 drop-shadow-[0_5px_18px_rgba(0,0,0,0.65)]"
          >
            Endonezya Bireysel Seyahat ve Balayı Planlama
          </h1>
          <p
            className="text-xs md:text-sm text-white/90 mb-5 max-w-2xl leading-relaxed drop-shadow-[0_3px_12px_rgba(0,0,0,0.6)]"
          >
            Hazır tur paketleri yerine; bütçenize, konfor beklentinize ve tatilden ne beklediğinize göre tamamen size özel bir Endonezya
            seyahati planlıyoruz. Ekonomik, standart ve VIP seçenekler arasından stilinizi seçin; konaklama, ulaşım, aktiviteler ve yemekler
            planınıza göre şekillensin.
          </p>
        </div>

        {/* Hero alt buton grubu */}
        <div className="absolute inset-x-0 bottom-5 md:bottom-7 z-10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('form');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-4 md:px-5 py-2 rounded-full font-medium text-xs md:text-sm flex items-center gap-2 border transition-all bg-sky-50/95 text-sky-900 border-sky-100 shadow-sm hover:bg-sky-100 hover:shadow-md backdrop-blur-sm/90"
            >
              <Calendar size={18} className="text-sky-600" />
              Seyahat formunu doldur
            </button>
            <button
              type="button"
              onClick={() => navigate('/kesfet')}
              className="px-4 md:px-5 py-2 rounded-full font-medium text-xs md:text-sm flex items-center gap-2 border transition-all bg-emerald-50/95 text-emerald-900 border-emerald-100 shadow-sm hover:bg-emerald-100 hover:shadow-md backdrop-blur-sm/90"
            >
              <Palmtree size={18} className="text-emerald-500" />
              Popüler Adaları Keşfet
            </button>
          </div>
        </div>
        <HeroSocialButtons />
      </section>

      {/* Alt Başlık ve Açıklama - Bireysel Seyahat Broşürü */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto bg-white/95 rounded-3xl shadow-xl px-6 py-10 md:px-10 md:py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-medium text-gray-900 mb-3">
              Tur Paketlerinden Ayrı, Size Özel Seyahat Planı
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full mx-auto mb-6" />
            <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
              Bu sayfa; hazır tur paketlerinden bağımsız, tamamen size veya ailenize özel planlanan Endonezya seyahatleri içindir.
              Konaklama, ulaşım, aktiviteler ve yemekler; bütçenize, stilinize ve seçtiğiniz konfor seviyesine göre tek tek planlanır.
            </p>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed mb-6">
              Balayı, aile tatili ya da arkadaşlarla özel bir kaçamak olsun; siz hayal ettiğiniz tatili tarif edin, biz de ekonomik,
              standart veya VIP seçenekler arasından size en uygun kombinasyonu oluşturalım. Aşağıdaki başlıklardan hangileri size
              daha yakınsa, formda belirtmeniz yeterli.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-sm text-gray-800 mt-4">
              <div className="space-y-2">
                <p className="font-medium text-xs md:text-sm text-gray-900">Nelerle ilgileniyorsunuz?</p>
                <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-gray-800">
                  <li>Doğa, şelale ve pirinç tarlası turları</li>
                  <li>Plaj ve adalar (Nusa, Gili, Lombok vb.)</li>
                  <li>Kültürel geziler ve tapınak turları</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-xs md:text-sm text-gray-900">Sizin için önemli olan ne?</p>
                <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-gray-800">
                  <li>Bütçeyi koruyarak keyifli bir program</li>
                  <li>Seçilen sınıfa göre otel/villa ve ulaşım konforu</li>
                  <li>Balayı veya aile tatiline uygun dengeli akış</li>
                </ul>
              </div>
            </div>

            {/* Görsel Kolaj */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="relative h-28 md:h-32 rounded-2xl overflow-hidden shadow-md">
                <img
                  src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Tropik sahilde gün batımı"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="relative h-28 md:h-32 rounded-2xl overflow-hidden shadow-md">
                <img
                  src="https://images.pexels.com/photos/753626/pexels-photo-753626.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Havuzlu villa ve palmiyeler"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="hidden md:block relative h-32 rounded-2xl overflow-hidden shadow-md">
                <img
                  src="https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Doğa yürüyüşü ve şelale"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Güven Bloğu - Bireysel Seyahat */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-3">
            <div className="mt-1 text-blue-500">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm md:text-base font-medium text-gray-900 mb-1">Türkçe Bilen Yerel Ekip</p>
              <p className="text-xs md:text-sm text-gray-700">
                Endonezya'da yaşayan, bölgeyi yakından tanıyan Türkçe konuşan bir ekip ile sürecinizi birlikte planlıyoruz.
              </p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex gap-3">
            <div className="mt-1 text-emerald-500">
              <MapPin size={22} />
            </div>
            <div>
              <p className="text-sm md:text-base font-medium text-gray-900 mb-1">Size Özel Rota ve Program</p>
              <p className="text-xs md:text-sm text-gray-700">
                Hazır turlar yerine; ilgi alanlarınız, bütçeniz ve seçtiğiniz konfor sınıfına göre tamamen bireysel bir seyahat planlıyoruz.
              </p>
            </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex gap-3">
            <div className="mt-1 text-indigo-500">
              <Plane size={22} />
            </div>
            <div>
              <p className="text-sm md:text-base font-medium text-gray-900 mb-1">Balayı ve Aile Tatilleri İçin</p>
              <p className="text-xs md:text-sm text-gray-700">
                Balayı, yıldönümü veya çocuklu aile tatilleri için; tempo, konaklama ve aktiviteleri sizin için en rahat edecek şekilde
                birlikte tasarlıyoruz.
              </p>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Seyahat Konfor Sınıfları - Ekonomik / Standart / VIP */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-sky-50/60">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl md:text-2xl font-medium text-center mb-8 text-gray-900">
            Bireysel Seyahat İçin Konfor Seçenekleri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Ekonomik Paket */}
            <div className="relative rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
              <div className="absolute inset-0">
                <img
                  src="https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Uygun bütçeli şehir oteli ve havuz"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="relative p-8 bg-gradient-to-b from-black/5 to-black/25 flex flex-col h-full">
                <h3 className="text-lg md:text-xl font-medium mb-3 text-white">Ekonomik Seyahat</h3>
                <p className="text-xs md:text-sm text-emerald-200 mb-2 font-medium">Örn. 5-7 Gece · 1 Lokasyon (Tamamen esnek)</p>
                <ul className="space-y-3 text-sm text-slate-100 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                    <span>Güvenilir ve temiz 3 yıldızlı otel veya apart konaklama</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                    <span>Havalimanı transferleri ve temel şehir içi ulaşımın planlanması</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                    <span>Yemekler tamamen opsiyonel; bütçenize uygun restoran ve kafe önerileri</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                    <span>Talebinize göre 1-2 gün rehberli tur, kalan günlerde serbest keşif</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                    <span>Temel ama keyifli aktiviteler (şelale, plaj, şehir turları vb.)</span>
                  </li>
                </ul>
                <p className="text-xs text-slate-200 mb-1">
                  Önerilen rota: Bali merkez + 1 günlük ada turu.
                </p>
                <p className="text-xs text-slate-200">İlk kez Endonezya'ya gelecek çiftler ve
                  aileler için sade ama keyifli bir başlangıç.</p>
                <p className="text-xs md:text-sm text-emerald-200 font-medium mt-4 pt-4 border-t border-emerald-300/40">
                  Ekonomik konfor seviyesi · Süre ve içerik tamamen kişiselleştirilebilir
                </p>
              </div>
            </div>

            {/* Standart Paket */}
            <div className="relative rounded-xl shadow-2xl overflow-hidden border-2 border-blue-400 flex flex-col h-full">
              <div className="absolute inset-0">
                <img
                  src="https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  alt="Tropik otelde deniz ve havuz manzarası"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="relative p-8 flex flex-col h-full bg-gradient-to-b from-black/5 to-black/25">
                <h3 className="text-lg md:text-xl font-medium mb-3 text-white">Standart Seyahat</h3>
                <p className="text-xs md:text-sm text-cyan-200 mb-2 font-medium">Örn. 8-10 Gece · 2 Lokasyon (Tamamen esnek)</p>
                <ul className="space-y-3 text-sm text-slate-100 mb-4">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span>4 yıldızlı oteller veya havuzlu butik tesisler</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span>Tüm transferlerde size özel araç ve şoför</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span>Kahvaltı genellikle dahil; diğer öğünler opsiyonel ve esnek</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span>Bazı günler profesyonel rehberli turlar, bazı günler tamamen serbest zaman</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span>Gündüz ve akşam aktiviteleri (tekne turu, masaj, gün batımı vb.) tamamen isteğe göre</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span>Balayı veya aile tatili için yüksek konforlu ama dengeli bir tempo</span>
                  </li>
                </ul>
                <p className="text-xs text-slate-200 mb-1">
                  Önerilen rota: Bali + Nusa Penida veya Bali + Gili Adaları.
                </p>
                <p className="text-xs text-slate-200">Balayı veya uzun süreli tatil planlayan
                  çiftler ve aileler için konfor ve keşfi bir arada sunar.</p>
                <p className="text-xs md:text-sm text-cyan-200 font-medium mt-4 pt-4 border-t border-cyan-300/40">
                  Standart konfor seviyesi - En iyi fiyat/deneyim dengesi · Süre ve içerik tamamen kişiselleştirilebilir
                </p>
              </div>
            </div>

            {/* VIP Paket */}
            <div className="relative rounded-xl shadow-lg overflow-hidden flex flex-col h-full">
              <div className="absolute inset-0">
                <img
                  src="https://res.cloudinary.com/dj1xg1c56/image/upload/v1767606632/vecteezy_thai-balinese-luxury-villa-with-infinity-swimming-pool-a_26608931_wvxgqa.jpg"
                  alt="Lüks havuzlu villa ve sonsuzluk havuzu manzarası"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="relative p-8 bg-gradient-to-b from-black/5 to-black/25 flex flex-col h-full">
                <h3 className="text-xl md:text-2xl font-semibold mb-3 text-white">VIP Seyahat</h3>
                <p className="text-xs md:text-sm text-fuchsia-200 mb-2 font-medium">Örn. 10-14 Gece · 2-3 Lokasyon (Tamamen esnek)</p>
                  <ul className="space-y-3 text-sm text-slate-100 mb-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={20} className="text-fuchsia-300 flex-shrink-0 mt-0.5" />
                      <span>Özel havuzlu villalar ve 5 yıldızlı oteller</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={20} className="text-fuchsia-300 flex-shrink-0 mt-0.5" />
                      <span>Tüm konaklama süresince size özel VIP araç ve şoför</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={20} className="text-fuchsia-300 flex-shrink-0 mt-0.5" />
                      <span>Tüm yemekler opsiyonel; fine-dining, özel akşam yemeği ve sürprizler için rezervasyon desteği</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={20} className="text-fuchsia-300 flex-shrink-0 mt-0.5" />
                      <span>Süreç boyunca 7/24 ulaşabileceğiniz Türkçe bilen asistan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={20} className="text-fuchsia-300 flex-shrink-0 mt-0.5" />
                      <span>İsteğe bağlı profesyonel fotoğraf ve video çekimleri</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={20} className="text-fuchsia-300 flex-shrink-0 mt-0.5" />
                      <span>Tamamen size göre planlanan benzersiz aktiviteler (özel tekne turları, spa günleri vb.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={20} className="text-fuchsia-300 flex-shrink-0 mt-0.5" />
                      <span>Tüm program, konaklama ve aktiviteler tamamen kişiselleştirilebilir</span>
                    </li>
                  </ul>
                  <p className="text-xs text-slate-200 mb-1">
                    Önerilen rota: Bali + Nusa Penida + Lombok veya isteğe göre özel kombinasyonlar.
                  </p>
                  <p className="text-xs text-slate-200">Özel havuzlu villa, VIP araç ve tamamen size
                    özel gün/gün program isteyenler için esnek ve lüks bir seçenek.</p>
                  <p className="text-xs md:text-sm text-fuchsia-200 font-medium mt-4 pt-4 border-t border-fuchsia-300/40">
                    Lüks ve unutulmaz bireysel deneyim · Süre ve içerik tamamen kişiselleştirilebilir
                  </p>
                </div>
              </div>
            </div>

          {/* Önemli Notlar - Bireysel Seyahat */}
          <div className="mt-8 max-w-3xl mx-auto px-4">
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-left">
              <h3 className="text-sm font-semibold text-gray-900 mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                Önemli Notlar
              </h3>
              <ul className="text-xs text-gray-600 leading-relaxed space-y-1.5" style={{ fontFamily: '"Poppins", sans-serif' }}>
                <li>* Buradaki ekonomik, standart ve VIP başlıkları; hazır tur paketleri değil, konfor seviyelerini ifade eder.</li>
                <li>* Süre (gece/gün) ve lokasyon sayıları tamamen esnektir; bütçenize ve vakit durumunuza göre birlikte planlanır.</li>
                <li>* Uçak bileti hiçbir seçenekte otomatik olarak dahil değildir; dilerseniz teklifinize ekleyebiliriz.</li>
                <li>* Yemekler tamamen opsiyoneldir; isterseniz sadece kahvaltı, isterseniz bazı akşam yemekleri veya özel organizasyonlar eklenir.</li>
                <li>* Tüm plan bireysel veya ailenize özel hazırlanır; lütfen formda balayı mı, aile tatili mi yoksa arkadaşlarla seyahat mi olduğunu belirtin.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section
        id="form"
        className="relative py-20 px-4 bg-gradient-to-b from-[#fdf8f3] via-[#fbf3ea] to-[#f7ecdf] overflow-hidden"
      >
        <div className="pointer-events-none absolute -right-24 -top-10 w-72 h-72 bg-amber-200/40 rounded-full blur-3xl hidden md:block" />
        <div className="max-w-3xl mx-auto relative">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              Size Özel Seyahat Planı ve Fiyat Alın
            </h2>
            <p className="text-xl text-gray-600" style={{ fontFamily: '"Poppins", sans-serif' }}>
              Formu doldurun, 24 saat içinde bütçenize ve tercihlerinize uygun, size özel bir Endonezya seyahat planı ve fiyat teklifi gönderelim.
            </p>
            <p className="mt-2 text-sm text-gray-500" style={{ fontFamily: '"Poppins", sans-serif' }}>
              Paylaştığınız bilgiler yalnızca Endonezya tatil planınızı hazırlamak için kullanılacaktır.
            </p>
          </div>

          {/* 3 Adımda Nasıl Çalışıyoruz */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex gap-3">
              <div className="mt-1 text-blue-500">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: '"Poppins", sans-serif' }}>1. Bilgilerinizi Bize İletin</p>
                <p className="text-xs text-gray-600" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  Tarih, kişi sayısı ve tatilden beklentilerinizi formda kısaca paylaşın.
                </p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex gap-3">
              <div className="mt-1 text-emerald-500">
                <MessageCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: '"Poppins", sans-serif' }}>2. Sizinle İletişime Geçelim</p>
                <p className="text-xs text-gray-600" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  WhatsApp veya telefon üzerinden birkaç kısa soruyla detayları netleştirelim.
                </p>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex gap-3">
              <div className="mt-1 text-indigo-500">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: '"Poppins", sans-serif' }}>3. Size Özel Planı Sunalım</p>
                <p className="text-xs text-gray-600" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  Bütçenize ve ilgi alanlarınıza uygun, size özel rota ve fiyat teklifi hazırlayalım.
                </p>
              </div>
            </div>
          </div>

          {success && (
            <div className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="text-emerald-600 flex-shrink-0" size={24} />
              <div>
                <p className="font-semibold text-emerald-800" style={{ fontFamily: '"Poppins", sans-serif' }}>Talebiniz başarıyla gönderildi!</p>
                <p className="text-sm text-emerald-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  formu doldurdugunuz icin tesekkur ederiz 24 saat icinde size geri donus yapacagiz
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              <p className="text-red-800" style={{ fontFamily: '"Poppins", sans-serif' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="from_name"
                  value={formData.from_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Adınız ve soyadınız"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  E-posta <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="from_email"
                  value={formData.from_email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ornek@email.com"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+90 555 123 4567"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  Tercih Ettiğiniz Seyahat Sınıfı
                </label>
                <select
                  name="package_preference"
                  value={formData.package_preference}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  <option value="">Seyahat sınıfı seçiniz (opsiyonel)</option>
                  <option value="Ekonomik Seyahat">Ekonomik Seyahat</option>
                  <option value="Standart Seyahat">Standart Seyahat</option>
                  <option value="VIP Seyahat">VIP Seyahat</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  Seyahat Tarihleri <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="travel_dates"
                  value={formData.travel_dates}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: 15-25 Haziran 2025"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {(formData.participation_type === 'group' || formData.participation_type === 'planned')
                    ? 'Tahmini Kişi Sayısı'
                    : 'Kişi Sayısı'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="number_of_people"
                  value={formData.number_of_people}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Kaç kişi?"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  İlgi Alanları
                </label>
                <input
                  type="text"
                  name="interests"
                  value={formData.interests}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Doğa, Plajlar, Kultur, Macera"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Doğa', 'Plajlar', 'Kültür', 'Macera', 'Alışveriş', 'Balayı'].map((chip) => (
                    <button
                      type="button"
                      key={chip}
                      onClick={() => handleInterestChipClick(chip)}
                      className="px-3 py-1 rounded-full border border-blue-200 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                      style={{ fontFamily: '"Poppins", sans-serif' }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  Bütçe Aralığı
                </label>
                <select
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  <option value="">Bütçe Seçiniz</option>
                  <option value="1500-2000$">1500-2000$</option>
                  <option value="2000-2500$">2000-2500$</option>
                  <option value="3000-4500$">3000-4500$</option>
                  <option value="5000+$">5000+$</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                Ek Detaylar / Özel İstekler
              </label>
              <textarea
                name="additional_details"
                value={formData.additional_details}
                onChange={handleChange}
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Sizin için özel istekleriniz, tercihleri veya ihtiyaçlarınız nelerdir?"
                style={{ fontFamily: '"Poppins", sans-serif' }}
              />
            </div>

            <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="privacy_consent"
                name="privacy_consent"
                checked={formData.privacy_consent}
                onChange={handleChange}
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="privacy_consent" className="ml-3 text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                <span className="font-semibold">
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Gizlilik Politikası
                  </a>
                  nı okudum ve onaylıyorum
                </span>
                <p className="text-sm text-gray-600 mt-1">Seyahat planlama amaçlı paylaştığınız bilgiler güvenli şekilde saklanacaktır.</p>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              {loading ? (
                'Gönderiliyor...'
              ) : (
                <>
                  <Send size={18} className="text-white/90" />
                  <span>Teklif Al</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Alt WhatsApp CTA */}
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 p-6 md:p-8 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
          <div>
            <h3 className="text-lg md:text-xl font-bold mb-1">Bireysel Seyahat veya Balayı Planınızı Birlikte Netleştirelim</h3>
            <p className="text-sm md:text-base opacity-95">
              Formu doldurmak istemiyorsanız, WhatsApp üzerinden yazın; tarih, lokasyon, bütçe ve konfor beklentinize göre size özel bir
              Endonezya seyahat planı konuşalım.
            </p>
          </div>
          <a
            href={buildWhatsAppUrl(
              "Merhaba, Endonezya'da bireysel veya ailemle birlikte seyahat (veya balayı) planlamak istiyorum. Bana özel bir seyahat planı ve tahmini bütçe konusunda konuşabilir miyiz?"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-5 py-3 rounded-xl font-bold hover:bg-blue-50 transition shadow-md"
          >
            <MessageCircle size={20} />
            WhatsApp'tan Seyahatimi Sor
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}





