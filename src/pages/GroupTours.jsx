import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { getWhatsAppNumber, openWhatsApp } from "../utils/whatsapp";

const WHATSAPP_NUMBER = getWhatsAppNumber();

// Tur sayfası GRUP formları için özel EmailJS yapılandırması
const EMAILJS_TOURS_SERVICE_ID = "service_a4cvjdi";
const EMAILJS_TOURS_TEMPLATE_ID_GROUP = "template_lv114n8";
const EMAILJS_TOURS_PUBLIC_KEY = "ztyFnl3RMNaTFeReI";

const tours = [
  {
    id: "bali",
    name: "Bali Adası",
    description:
      "Tropik cennet Bali, muhteşem plajları, antik tapınakları ve yeşil pirinç teraslarıyla sizi büyüleyecek.",
    suitableFor: ["Balayı", "Lüks & Dinlenme", "Deniz & Plaj Tatili"],
    duration: "4 Gece 5 Gün",
    concept: "Uçak bileti hariç fiyat",
    image: "/bali-island-tropical-beach-temple.jpg",
  },
  {
    id: "lombok",
    name: "Lombok Adası",
    description:
      "Bali'nin sakin kız kardeşi Lombok, el değmemiş plajları ve Rinjani Yanardağı ile macera severleri bekliyor.",
    suitableFor: ["Doğa & Macera", "Deniz & Plaj Tatili", "Sörf"],
    duration: "5 Gece 6 Gün",
    concept: "Doğa & Plaj",
    image: "/lombok-island-beach-waterfall.jpg",
  },
  {
    id: "sumatra",
    name: "Sumatra Adası",
    description:
      "Vahşi Sumatra, yağmur ormanları, orangutanlar ve etkileyici Toba Gölü ile eşsiz bir doğa deneyimi sunuyor.",
    suitableFor: ["Doğa & Macera", "Kültürel Keşif", "Yaban Hayatı"],
    duration: "6 Gece 7 Gün",
    concept: "Doğa & Macera",
    image: "/sumatra-rainforest-orangutan-lake-toba.jpg",
  },
  {
    id: "java",
    name: "Java Adası",
    description:
      "Endonezya'nın kalbi Java, büyüleyici Borobudur Tapınağı, Prambanan ve aktif yanardağlarıyla kültür hazinesi.",
    suitableFor: ["Kültürel Keşif", "Tarih", "Fotoğrafçılık"],
    duration: "5 Gece 6 Gün",
    concept: "Kültürel Keşif",
    image: "/java-borobudur-temple-volcano-sunrise.jpg",
  },
];

export default function GroupTours() {
  const [openGroupId, setOpenGroupId] = useState(null);

  // Sayfa başlığı ve açıklaması (SEO)
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "Grup Endonezya Turları | Şirket, Okul ve Özel Gruplar";
      const metaDesc = document.querySelector("meta[name='description']");
      if (metaDesc) {
        metaDesc.setAttribute(
          "content",
          "Şirket, okul veya arkadaş grubunuz için kişi sayısı ve tarihleri size özel Endonezya tur organizasyonları. Bali, Komodo ve daha fazlası için grup turları ve yerel operasyon desteği.",
        );
      }
    }
  }, []);

  const handleInlineGroupSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    console.log("Inline group request from list page:", data);

    const tourId = e.target.getAttribute("data-tour-id");
    const tour = tours.find((t) => t.id === tourId);

    const whatsappText = `Grup turu teklif talebi (liste sayfası)\n\n`
      + `Referans rota: ${tour ? `${tour.name} (${tour.duration})` : data.routes}\n`
      + `Ad Soyad: ${data.name}\n`
      + `E-posta: ${data.email}\n`
      + `Telefon: ${data.phone}\n`
      + `Kurum / Grup adı: ${data.organization || "-"}\n`
      + `Grup tipi: ${data.groupType}\n`
      + `Planlanan tarihler: ${data.dates}\n`
      + `Tahmini kişi sayısı: ${data.people}\n`
      + `İlgilenilen bölgeler / rotalar: ${data.routes || "-"}\n`
      + `Kişi başı bütçe: ${data.budget || "-"}\n`
      + `Ek notlar: ${data.notes || "-"}`;

    if (WHATSAPP_NUMBER) {
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;
      openWhatsApp(url);
    } else {
      console.warn("VITE_WHATSAPP_NUMBER tanımlı değil.");
    }

    if (EMAILJS_TOURS_SERVICE_ID && EMAILJS_TOURS_TEMPLATE_ID_GROUP && EMAILJS_TOURS_PUBLIC_KEY) {
      emailjs
        .send(
          EMAILJS_TOURS_SERVICE_ID,
          EMAILJS_TOURS_TEMPLATE_ID_GROUP,
          {
            tour_name: tour ? tour.name : data.routes,
            tour_duration: tour ? tour.duration : "",
            name: data.name,
            email: data.email,
            phone: data.phone,
            organization: data.organization,
            group_type: data.groupType,
            dates: data.dates,
            people: data.people,
            routes: data.routes,
            budget: data.budget,
            notes: data.notes,
          },
          EMAILJS_TOURS_PUBLIC_KEY,
        )
        .then(
          () => {
            console.log("EmailJS inline group form başarıyla gönderildi");
          },
          (error) => {
            console.error("EmailJS inline group form hata:", error);
          },
        );
    }

    e.target.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/30 relative">
      {/* Sol alt köşede, arka plansız ve beyaz yazılı geri dön butonu */}
      <Link
        to={-1}
        className="fixed left-4 bottom-4 z-50 text-white text-sm font-semibold px-0 py-0 bg-transparent border-none shadow-none hover:underline focus:underline focus:outline-none"
        style={{textShadow: '0 1px 6px rgba(0,0,0,0.35)'}}
      >
        &#8592; Önceki sayfaya dön
      </Link>
      <Navigation />

      {/* Hero + sekmeler */}
      <section className="pt-24 pb-6 px-4 text-center max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
          Gruplar İçin Endonezya Tur Organizasyonları
        </h1>

        <div className="inline-flex items-center justify-center gap-2 mb-6 bg-white/70 border border-slate-200 rounded-full p-1 shadow-sm">
          <Link
            to="../tours"
            className="px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Kişisel / Aile Olarak Toplu Turlara Katılım
          </Link>
          <button
            type="button"
            className="px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold bg-emerald-600 text-white shadow"
          >
            Gruplar İçin Tur Organizasyonu
          </button>
        </div>

        <p className="text-sm md:text-base text-gray-700 max-w-3xl mx-auto mb-4">
          Şirket, okul, dernek veya arkadaş grubunuz için; kişi sayısı, tarih ve beklentilerinize göre tam size özel Endonezya
          ur programları tasarlıyoruz. Aşağıdaki adalar, grup rotalarınızı planlarken temel aldığımız başlıca destinasyonlardır.
        </p>

        <p className="text-xs md:text-sm text-gray-600 max-w-3xl mx-auto">
          Toplantı salonu tedariki, ekip çalışması aktiviteleri, özel gala akşamları, marka etkinlikleri ve fotoğraf/video
          prodüksiyonu gibi ekstra hizmetleri de paketlere ekleyebiliyoruz. Detaylar için bir ada seçip tur sayfasının altındaki
          "Grubum için teklif al" butonunu kullanabilirsiniz.
        </p>
      </section>

      {/* Grup odaklı tur kartları (fiyat ve kampanya odaksız) */}
      <section className="pb-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tours.map((tour) => (
            <article
              key={tour.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={tour.image}
                  alt={tour.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-left">
                  <h2 className="text-2xl font-bold text-white mb-1">{tour.name}</h2>
                  <p className="text-sm text-white/90 line-clamp-2">{tour.description}</p>
                </div>
              </div>

              <div className="p-6 space-y-5 flex-1 flex flex-col">
                <div className="flex flex-wrap gap-2">
                  {tour.suitableFor.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroupId((prev) => (prev === tour.id ? null : tour.id))
                    }
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Grubum için teklif al
                  </button>
                </div>

                {openGroupId === tour.id && (
                  <form
                    data-tour-id={tour.id}
                    onSubmit={handleInlineGroupSubmit}
                    className="mt-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 space-y-4 text-sm text-gray-800"
                  >
                    <p className="font-semibold text-gray-900">
                      {tour.name} benzeri rota için grup turu teklif formu
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Ad Soyad *</label>
                        <input
                          name="name"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Adınız ve soyadınız"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">E-posta *</label>
                        <input
                          type="email"
                          name="email"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="ornek@kurum.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Telefon *</label>
                        <input
                          name="phone"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="+90 5xx xxx xx xx"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Kurum / Grup Adı</label>
                        <input
                          name="organization"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Şirket, okul, dernek veya grup adı"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Grup Tipi *</label>
                        <select
                          name="groupType"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Grubunuzu seçiniz</option>
                          <option value="company">Şirket / Kurumsal ekip</option>
                          <option value="school">Okul / Üniversite grubu</option>
                          <option value="association">Dernek / Topluluk</option>
                          <option value="friends">Arkadaş grubu</option>
                          <option value="other">Diğer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Planlanan Tarihler *</label>
                        <input
                          name="dates"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Örn: Haziran 2025, 7-10 gün"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Tahmini Kişi Sayısı *</label>
                        <input
                          type="number"
                          name="people"
                          required
                          min="5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Örn: 15-25 kişi"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Kişi Başı Bütçe Aralığı</label>
                        <select
                          name="budget"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Bütçe seçiniz</option>
                          <option value="1500-2000$">1500-2000$</option>
                          <option value="2000-2500$">2000-2500$</option>
                          <option value="3000-4500$">3000-4500$</option>
                          <option value="5000+">5000$ ve üzeri</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">İlgilendiğiniz Bölgeler / Rotalar</label>
                        <input
                          name="routes"
                          defaultValue={tour.name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Örn: Bali + Nusa, Bali + Lombok, Endonezya adaları"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Ek Notlar</label>
                        <input
                          name="notes"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Özel etkinlikler, sunumlar, talepler vb."
                        />
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-[11px] text-gray-700">
                      <input
                        type="checkbox"
                        name="privacy"
                        required
                        className="mt-1 h-4 w-4 border-gray-300 rounded"
                      />
                      <p>
                        <span>
                          Gizlilik politikasını okudum, kabul ediyorum ve paylaştığım bilgilerin yalnızca grup tur tekliflendirmesi
                          ve iletişim amacıyla kullanılmasını onaylıyorum.
                        </span>{" "}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline font-semibold"
                        >
                          Gizlilik Politikası
                        </a>
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="w-full md:w-auto px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      Grup Tur Teklif Talebimi Gönder
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
                  <div>
                    <p className="font-semibold">Program Süresi</p>
                    <p>{tour.duration}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Genel Konsept</p>
                    <p>{tour.concept}</p>
                  </div>
                </div>

                <div className="text-sm text-gray-800">
                  <p className="font-semibold mb-1">Grup Organizasyonunda Planlanabilen Ekstralar</p>
                  <ul className="space-y-1 list-disc list-inside text-xs md:text-sm">
                    <li>Toplantı / sunum salonu ve teknik ekipman tedariki</li>
                    <li>Takım çalışması ve ekip bağını güçlendiren aktiviteler</li>
                    <li>Özel gala akşamı, ödül töreni veya lansman organizasyonu</li>
                    <li>Profesyonel fotoğraf ve video çekimi</li>
                  </ul>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                  <p className="text-xs text-gray-500 max-w-xs">
                    Grubunuz için en iyi teklifi sunabilmemiz için teklif alın.
                  </p>
                  <Link
                    to={`/tours/${tour.id}`}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Ada Detaylarını Gör
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
