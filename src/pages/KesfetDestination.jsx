import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Utensils,
  Landmark,
  Waves,
  Mountain,
  Camera,
  TreePine,
  Coffee,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { db } from "../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { getKesfetDestinationDetailsForLang } from "../data/kesfetDestination";
function DestinationDetailPage() {
  const { island, destination } = useParams();
  const [activeTab, setActiveTab] = useState("gezilecek");
  const [imageUrls, setImageUrls] = useState({});
  const mobileGalleryRef = useRef(null);
  const { t, i18n } = useTranslation();
  // Load saved image URLs from localStorage as initial value
  useEffect(() => {
    const saved = localStorage.getItem("imageUrls");
    if (saved) {
      try {
        setImageUrls(JSON.parse(saved));
      } catch (e) {
        console.error("imageUrls localStorage parse hatası:", e);
      }
    }
  }, []);

  // Listen imageUrls config from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "imageUrls", "imageUrls"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() || {};
          setImageUrls((prev) => ({ ...prev, ...data }));
        }
      },
      (error) => {
        console.error("Firestore imageUrls dinleme hatası:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  // Google Analytics - Page View Tracking
  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "page_view", {
        page_title: `${destination?.replace(/-/g, " ")} - ${island}`,
        page_path: `/kesfet/${island}/${destination}`,
      });
      window.gtag("event", "view_item_list", {
        items: [
          {
            item_name: destination,
            item_category: "destination_detail",
            item_brand: island,
          },
        ],
      });
    }
  }, [island, destination]);

  // Helper function to get image URL from localStorage or use default
  const getImageUrl = (defaultUrl, storageKey) => {
    return imageUrls[storageKey] || defaultUrl;
  };

  const destinationDetails = getKesfetDestinationDetailsForLang(i18n.language);

  // Helper function to get images based on active tab
  const getImagesForActiveTab = () => {
    if (!detail) return [];

    // Önce admin panelden gelen özel sekme görsellerini dene
    const overrideKeys = [0, 1, 2].map(
      (index) => `${island}-${destination}-${activeTab}-img${index}`
    );
    const overrideImages = overrideKeys
      .map((key) => imageUrls[key])
      .filter(Boolean);

    if (overrideImages.length > 0) {
      return overrideImages;
    }

    // Özel görsel yoksa, destinasyonun default sekme görsellerine dön
    const tabImageMap = {
      gezilecek: detail.gezilecekImages || [],
      aktiviteler: detail.aktivitelerImages || [],
      yiyecek: detail.yiyecekImages || [],
      konaklama: detail.konaklamaImages || [],
      alisveris: detail.alisverisImages || [],
    };

    return tabImageMap[activeTab] || [];
  };

  /*
  Legacy inline destination data moved to src/data/kesfetDestination (kept for reference)
  const destinationDetails = {
    bali: {
      ubud: {
        name: "Ubud",
        island: "Bali",
        description:
          "Ubud, Bali'nin kültürel ve ruhani kalbidir. Yeşil pirinç terasları, antik tapınaklar ve geleneksel sanat galerileri ile dolu bu bölge, huzur ve doğayla iç içe bir tatil arayanlar için mükemmel.",
        images: [
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=1200", 'bali-ubud-img0'),
          getImageUrl("https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-ubud-img1'),
          getImageUrl("https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-ubud-img2'),
          getImageUrl("https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-ubud-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Monkey Forest",
            description: "Kutsal orman alanı, serbest dolaşan maymunlar ve tapınaklar",
          },
          {
            name: "Campuhan Ridge Walk",
            description: "Vadi manzaralı yürüyüş rotası, gün batımı için ideal",
          },
          {
            name: "Goa Gajah (Fil Mağarası)",
            description: "Antik Hindu-Budist tapınak kompleksi",
          },
          {
            name: "Tirta Empul Tapınağı",
            description: "Kutsal su arınma ritüelleri yapılan tapınak",
          },
          {
            name: "Gunung Kawi",
            description: "Kaya oyma antik mezarlar ve tapınaklar",
          },
          {
            name: "Tegenungan Şelalesi",
            description: "Yüzme ve manzara noktaları",
          },
          {
            name: "Kanto Lampo Şelalesi",
            description: "Basamaklı kaya şelalesi, fotoğraf için popüler",
          },
          {
            name: "Ubud Sarayı",
            description: "Geleneksel mimari ve akşam Bali dans gösterileri",
          },
          {
            name: "Ubud Art Market",
            description: "El sanatları ve yerel ürünler",
          },
        ],
        aktiviteler: [
          {
            name: "Rafting (Ayung Nehri)",
            description: "Orman manzarası eşliğinde rehberli beyaz su raftingi",
            icon: "🚣",
          },
          {
            name: "Yoga & Meditasyon",
            description: "Dünyaca ünlü yoga stüdyolarında başlangıç ve ileri seviye dersler",
            icon: "🧘",
          },
          {
            name: "Doğa Yürüyüşleri",
            description: "Orman içi patikalar ve vadi manzaralı rotalar",
            icon: "🥾",
          },
          {
            name: "Şelale Turları",
            description: "Rehberli veya bireysel, yüzme molalı",
            icon: "💧",
          },
          {
            name: "Spa & Healing Terapileri",
            description: "Bali masajı, ses terapisi, enerji dengeleme seansları",
            icon: "💆",
          },
          {
            name: "Kültürel Atölyeler",
            description: "Bali dansı, geleneksel müzik ve el sanatları deneyimleri",
            icon: "🎨",
          },
        ],
        yiyecekIcecekler: {
          "Yerel / Endonezya – Balinese": [
            {
              name: "Ayam Betutu",
              description: "Uzun süre baharatla pişirilen, yumuşak ve aromatik tavuk yemeği",
            },
            {
              name: "Nasi Campur",
              description: "Pilav, tavuk, sebze, yumurta ve çeşitli Bali usulü garnitürler",
            },
            {
              name: "Nasi Goreng",
              description: "Baharatlı, yumurtalı kızarmış pilav",
            },
            {
              name: "Sate Ayam",
              description: "Fıstık soslu ızgara tavuk şiş",
            },
            {
              name: "Gado-Gado",
              description: "Haşlanmış sebzeler ve yumurta, yoğun fıstık sosuyla",
            },
            {
              name: "Tempeh & Tofu",
              description: "Soya bazlı, kızartma veya sote yerel protein yemekleri",
            },
            {
              name: "Soto Ayam",
              description: "Zencefil ve baharatlı, hafif tavuk çorbası",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Vegan & Vejetaryen Restoranlar",
              description: "Ubud bu konuda Bali'nin merkezi",
            },
            {
              name: "İtalyan ve Fransız Mutfağı",
              description: "Avrupa'nın klasik lezzetleri",
            },
            {
              name: "Organik ve Farm-to-Table",
              description: "Yerel çiftliklerden taze malzeme kullanan restoranlar",
            },
            {
              name: "Sağlıklı Kahvaltı ve Brunch",
              description: "Organik ve beslenme dengeli seçenekler",
            },
          ],
          "Türk Mutfağı - Yakında Mevcut (Kuta/Canggu 45-60 min)": [
            {
              name: "Cappadocia Turkish Restaurant (Canggu)",
              description: "Ubud'dan 45-60 dakika. AUTHENTIC Turkish. Pide, Döner, Adana Kebap, Meze, Baklava. 4.7/5 ⭐. +62 812-3841-1575",
            },
            {
              name: "Sumak Turkish Cuisine (Seminyak)",
              description: "Ubud'dan 50-60 dakika. MICHELIN LEVEL Turkish. Adana Kebap, İskender, Turkish Dumplings. 4.8/5 ⭐. sumakbali.com",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Taze Meyve Suları",
              description: "Papaya, mango, ananas, dragon fruit",
            },
            {
              name: "Smoothie & Detox İçecekleri",
              description: "Yeşil sebzeler ve tropikal meyvelerle",
            },
            {
              name: "Bali Kahvesi",
              description: "Yerel çekirdeklerden, yoğun aromalı",
            },
            {
              name: "Bitki Çayları",
              description: "Zencefil, limon otu, tarçın",
            },
            {
              name: "Hindistan Cevizi Suyu",
              description: "Doğal elektrolit kaynağı",
            },
          ],
          "Specialty Coffee & Cafe Experiences": [
            {
              name: "Luwak Kahvesi",
              description: "Dünyanın en ünlü ve pahalı kahvesi, civetten geçmiş",
            },
            {
              name: "Single Origin Arabica",
              description: "Bali'nin çeşitli bölgelerinden yüksek kaliteli kahve",
            },
            {
              name: "Specialty Brewing Methods",
              description: "Pour over, siphon, espresso ve manuel brewler",
            },
            {
              name: "Artisan Cafes",
              description: "Sanat ve kahvenin birleştiği minimalist kafelerde çalışma alanları",
            },
          ],
          "Asya Mutfağı": [
            {
              name: "Thai Yemekleri",
              description: "Tom yum, pad thai, yeşil curry ve baharatlı Thai salatalar",
            },
            {
              name: "Japonca Yemekleri",
              description: "Sushi, ramen, donburi ve tempura",
            },
            {
              name: "Koreli Yemekleri",
              description: "Bibimbap, bulgogi, kimchi ve tteokbokki",
            },
            {
              name: "Vietnamca Yemekleri",
              description: "Pho, banh mi, spring rolls ve balık sosu salatası",
            },
          ],
          "Tatlılar & Geleneksel Balinese Pastane": [
            {
              name: "Jaje Kueh",
              description: "Geleneksel Bali tatlıları, kokos ve gula Jawa ile yapılan",
            },
            {
              name: "Lumpia",
              description: "Yapışkan ve tatlı, muz veya ıstakoz dolu bahar rulolar",
            },
            {
              name: "Pisang Goreng",
              description: "Kızarmış muz, karamel ve es kampuran (tatlı sirup) ile",
            },
            {
              name: "Moderner Pastane Sahnesi",
              description: "Fusion tatlılar, macarons, cheesecake ve craft pastries",
            },
          ],
          "Raw Food & Wellness Cafes": [
            {
              name: "Smoothie & Acai Bowls",
              description: "Tropikal meyveler, granola, coco flakes ile tatlandırılmış",
            },
            {
              name: "Raw Vegan Plates",
              description: "Çiğ sebzeler, tohumlar ve fermente yemekler",
            },
            {
              name: "Detox & Cleanse Programs",
              description: "Özel diyetler, yeşil suyu ve organik sebze merkezli menüler",
            },
            {
              name: "Superfood Lattes",
              description: "Matcha, turmeric, spirulina ve bitki bazlı süt içecekleri",
            },
          ],
        },
        konaklama: [
          {
            name: "Butik Oteller",
            description: "Ubud merkezine yakın, doğayla iç içe, az odalı konsept",
          },
          {
            name: "Jungle & Rice Field View Resortlar",
            description: "Orman ve pirinç tarlası manzaralı, sakin ve lüks",
          },
          {
            name: "Havuzlu Villalar",
            description: "Özel havuzlu, balayı ve uzun konaklama için ideal",
          },
          {
            name: "Eco Lodge & Bambu Oteller",
            description: "Sürdürülebilir, doğa dostu konaklama",
          },
          {
            name: "Guesthouse & Yoga Retreat Merkezleri",
            description: "Uzun süreli konaklama ve spiritüel deneyim odaklı",
          },
        ],
        konaklamaSuresi: "4 gün",
        konaklamaBudgeti: "1.000 – 1.500 USD",
        alisveris: [
          {
            name: "Ubud Market",
            description: "Ubud'un en ünlü pazarı, geleneksel tekstil, sanat eserleri ve el sanatlarının satıldığı yer",
          },
          {
            name: "Ubud Arts Festival Market",
            description: "Yerel sanatçılar tarafından yapılan resim, heykeltaş ve dekoratif eşyaların satıldığı mevsimlik pazar",
          },
          {
            name: "Tegallalang Craft Village",
            description: "Pirinç terasları yakınında, geleneksel ahşap oymacılığı ve hediyelik eşyalarının satıldığı köy pazarı",
          },
          {
            name: "Batik ve Gümüş İşçiliği Atölyeleri",
            description: "Geleneksel batik boyama ve gümüş takı yapımının satış mağazaları, ziyaretçiler üretim sürecini izleyebilir",
          },
          {
            name: "Ubud Shopping Mall",
            description: "Ubud'un merkez bölgesinde yer alan modern alışveriş merkezi, markaları ve yerel ürünleri bulundurur",
          },
          {
            name: "El Yapımı Ahşap Oymalar",
            description: "Maskeler, heykeller, dekoratif objeler",
          },
          {
            name: "Gümüş Takılar",
            description: "Yerel ustalar tarafından el işçiliğiyle üretilir",
          },
          {
            name: "Sanat Tabloları & Resimler",
            description: "Ubud sanatçı köylerinden",
          },
          {
            name: "Yoga & Meditasyon Ürünleri",
            description: "Mat, kıyafet, doğal aksesuarlar",
          },
          {
            name: "Doğal Kozmetik Ürünleri",
            description: "Sabunlar, yağlar, tütsüler",
          },
          {
            name: "Tekstil & Batik Ürünleri",
            description: "Şal, pareo, el dokuması kumaşlar",
          },
          {
            name: "Bali Temalı Hediyelikler",
            description: "Kültürel semboller ve dekoratif ürünler",
          },
        ],
      },
      kuta: {
        name: "Kuta",
        island: "Bali",
        description:
          "Kuta, Bali'nin en ünlü plaj destinasyonu olarak, dünyaca ünlü sörf spotları, gün batımı vistas ve canlı plaj hayatıyla tanınır. Turist bölgesinin merkezinde yer alan Kuta, çok çeşitli konaklama, yemek ve eğlence seçenekleri sunarak hem deniz sporları tutkunları hem de tatilcilerin gözdesidir.",
        images: [
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200", 'bali-kuta-img0'),
          getImageUrl("https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-kuta-img1'),
          getImageUrl("https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-kuta-img2'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-kuta-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Kuta Beach",
            description: "Sörf yapmak, yüzmek, gün batımı izlemek",
          },
          {
            name: "Legian Beach",
            description: "Kuta'ya bitişik, daha sakin plaj bölgesi, yüksek kalite sörf dalgaları",
          },
          {
            name: "Legian Street",
            description: "Gece hayatı, barlar ve kulüpler",
          },
          {
            name: "Beachwalk Mall",
            description: "Alışveriş, kafe ve restoranlar",
          },
          {
            name: "Waterbom Bali",
            description: "Asya'nın en iyi su parklarından biri, tam gün aktivite",
          },
          {
            name: "Tanah Lot Tapınağı",
            description: "Deniz üzerindeki tapınakta gün batımı fotoğrafı çekmek",
          },
        ],
        aktiviteler: [
          {
            name: "Sörf",
            description: "Başlangıç seviyesi için ideal dalgalar, sahil boyunca birebir sörf kursları mevcut",
            icon: "🏄",
          },
          {
            name: "Jet Ski",
            description: "Kuta Beach'te kısa süreli adrenalin aktivitesi",
            icon: "🚤",
          },
          {
            name: "Banana Boat",
            description: "Grup halinde yapılan eğlenceli deniz aktivitesi",
            icon: "🛥️",
          },
          {
            name: "Parasailing",
            description: "Deniz üzerinde manzara eşliğinde uçuş deneyimi",
            icon: "🪂",
          },
          {
            name: "Yüzme",
            description: "Geniş ve kumluk plaj, dalga yoğunluğuna dikkat edilmeli",
            icon: "🏊",
          },
          {
            name: "Beach Club & Barlar",
            description: "Gün boyu müzik, gün batımı ve sosyalleşme",
            icon: "🍹",
          },
          {
            name: "Gece Kulüpleri",
            description: "Bali'nin en hareketli gece hayatı Kuta'dadır",
            icon: "🎉",
          },
          {
            name: "ATV Turları",
            description: "Çevre köylerde çamur, orman ve arazi sürüşü",
            icon: "🏍️",
          },
          {
            name: "Spa & Masaj",
            description: "Uygun fiyatlı Bali masajı ve refleksoloji merkezleri",
            icon: "💆",
          },
        ],
        yiyecekIcecekler: {
          "🔹 Yerel / Endonezya – Balinese": [
            {
              name: "Nasi Goreng",
              description: "Sebzeli, yumurtalı, baharatlı kızarmış pilav; tavuklu veya sade",
            },
            {
              name: "Mie Goreng",
              description: "Sebze ve tavukla yapılan baharatlı kızarmış noodle",
            },
            {
              name: "Nasi Campur",
              description: "Pilav yanında tavuk, sebze, yumurta ve çeşitli küçük garnitürler",
            },
            {
              name: "Sate Ayam",
              description: "Izgara tavuk şiş, fıstık sosuyla servis edilir",
            },
            {
              name: "Gado-Gado",
              description: "Haşlanmış sebzeler, yumurta ve fıstık soslu salata",
            },
            {
              name: "Soto Ayam",
              description: "Zencefil ve baharatlı tavuk çorbası, hafif ve doyurucu",
            },
          ],
          "🔹 Batı Mutfağı": [
            {
              name: "Pizza & Makarna",
              description: "İtalyan restoranları yaygın, taze malzemelerle hazırlanır",
            },
            {
              name: "Burger & Steak",
              description: "Amerikan ve Avustralya tarzı mutfak",
            },
            {
              name: "Deniz Ürünleri",
              description: "Izgara balık, karides, kalamar",
            },
          ],
          "🔹 Türk Mutfağı - Yakında Mevcut": [
            {
              name: "Cappadocia Turkish Restaurant (Canggu - 15 min)",
              description: "Canggu'da Jl. Munduk Catu No.3. AUTHENTIC Turkish. Pide, Döner, Adana Kebap, Meze, Baklava. 4.7/5 ⭐ TripAdvisor. +62 812-3841-1575",
            },
            {
              name: "Sumak Turkish Cuisine (Seminyak/Kerobokan - 15 min)",
              description: "Jalan Kayu Aya No.12xx. MICHELIN LEVEL Turkish authentic. Adana Kebap, İskender, Turkish Dumplings, Baklava. 4.8/5 ⭐ TripAdvisor. sumakbali.com",
            },
            {
              name: "Istanbul Meze Kebab House (Kerobokan - 10 min)",
              description: "Jalan Sunset Road (Kerobokan). Fresh Mezze, Kebap, Manti, Babaganoush. 4.2/5 ⭐ TripAdvisor. Shisha mekanı ve vegetarian seçenekleri.",
            },
          ],
          "🔹 Alkolsüz İçecekler": [
            {
              name: "Hindistan Cevizi",
              description: "Taze, sokak satıcılarında yaygın",
            },
            {
              name: "Mango / Ananas / Papaya Suyu",
              description: "Doğal ve şekersiz",
            },
            {
              name: "Avokado Suyu",
              description: "Bali'ye özgü, sütlü ve doyurucu",
            },
            {
              name: "Bali Kahvesi",
              description: "Sert aromalı yerel kahve",
            },
            {
              name: "Zencefilli Çay",
              description: "Serinletici ve mide rahatlatıcı",
            },
          ],
        },
        konaklama: [
          {
            name: "Lüks Plaj Resort'ları",
            description: "5 yıldızlı, plaja doğrudan erişimli, sonsuzluk havuzlu oteller",
          },
          {
            name: "Boutique Beach Hotels",
            description: "Şık tasarımlı, yüksek hizmet kalitesine sahip özel tasarım oteller",
          },
          {
            name: "Ekonomik Plaj Oteleri",
            description: "Genç seyahatlılar ve bütçe-dostu tatilciler için ideal seçenekler",
          },
          {
            name: "Plajkent Bungalow'ları",
            description: "Plaj kenarında özel bahçeli, rahat ve ekonomik konaklama seçenekleri",
          },
          {
            name: "Havuzlu Lüks Villalar",
            description: "Özel tasarımlı, özel havuzları olan yüksek konforlu villa evler",
          },
        ],
        konaklamaSuresi: "3 gün",
        konaklamaBudgeti: "700 – 1.000 USD",
        alisveris: [
          {
            name: "Beachwalk Mall",
            description: "Kuta'da deniz kenarında yer alan modern AVM, uluslararası ve yerel markaları içerir",
          },
          {
            name: "Discovery Shopping Mall",
            description: "Seminyak'ta bulunan, moda, elektronik ve ev eşyalarının en geniş seçiminin yer aldığı alışveriş merkezi",
          },
          {
            name: "Kuta Square",
            description: "Kuta bölgesinde yerel el sanatları, tekstil ve hatıra eşyaları satılan açık alan pazarı",
          },
          {
            name: "Legian Street Market",
            description: "Gece pazarı, yerel tasarımcıların ürünleri, kültürel eşyalar ve turist hatırası ürünlerinin satıldığı yer",
          },
          {
            name: "Tanah Lot Craft Market",
            description: "Tanah Lot tapınağı yakınında, geleneksel Bali el sanatları ve hediyelik eşyaların satıldığı pazar",
          },
          {
            name: "Sörf Kıyafetleri & Ekipmanları",
            description: "Rip Curl, Billabong gibi markalar, sörf tahtaları ve koruma giysilerinin satıldığı dükkanlar",
          },
          {
            name: "Plaj Kıyafetleri",
            description: "Şort, elbise, pareo, terlik ve plaj aksesuarlarının geniş seçimi",
          },
          {
            name: "Bali Temalı Tişörtler",
            description: "Hediyelik olarak popüler, Bali yazılı ve tişörtler, çok uygun fiyatlı",
          },
          {
            name: "Ahşap Maskeler & Heykeller",
            description: "Bali kültürüne özgü geleneksel el işçiliği, kişiye özel tasarımlar yapılabilir",
          },
          {
            name: "El Yapımı Bileklik & Takılar",
            description: "Sokak pazarlarında pazarlık yapılabilir, çeşitli renkler ve tasarımlar",
          },
          {
            name: "Magnet & Küçük Hediyelikler",
            description: "Turistik dükkânlarda bolca bulunur, kolay taşınabilir hatıra ürünleri",
          },
        ],
      },
      seminyak: {
        name: "Seminyak",
        island: "Bali",
        description:
          "Seminyak, Bali'nin en lüks ve sofistike plaj bölgesi. Ünlü beach clubs, gourmet restoranlar, upscale otel ve villalar ile dolu olan Seminyak, zengin ve ünlü kişilerin tercih ettiği bir destinasyondur.",
        images: [
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200", 'bali-seminyak-img0'),
          getImageUrl("https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-seminyak-img1'),
          getImageUrl("https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-seminyak-img2'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-seminyak-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Seminyak Beach",
            description: "Endonezya'nın en popüler plajlarından biri, balık ve gün batımı görüntüsü ile ünlü",
          },
          {
            name: "Oberoi Street",
            description: "Lüks restoranlar, kafe ve boutique dükkanlarının yer aldığı trendy sokak",
          },
          {
            name: "Double Six Beach Club",
            description: "Gün batımında partiler ve upscale dining için ünlü beach club",
          },
          {
            name: "Seminyak Village",
            description: "Boutique mağazalar, sanat galerileri ve tasarımcı dükkanlarının yer aldığı alışveriş alanı",
          },
          {
            name: "Kafe & Restoran Kompleksleri",
            description: "Dünya mutfağı ve yerel Bali yemeklerinin servis edildiği prestijli mekanlar",
          },
          {
            name: "Umalas Trekking",
            description: "Seminyak yakınında yeşil alanlar, dağ ve tarla manzaralarında doğa yürüyüşü",
          },
          {
            name: "Petitenget Tapınağı",
            description: "Bali Hindu kültürünü yakından görmek",
          },
          {
            name: "Ku De Ta Sahil Hattı",
            description: "İkonik beach club manzarası",
          },
        ],
        aktiviteler: [
          {
            name: "Plaj & Yüzme",
            description: "Seminyak Beach geniş ve kumluk, yüzme için uygun",
            icon: "🏊",
          },
          {
            name: "Beach Club Deneyimi",
            description: "Potato Head, Ku De Ta gibi mekanlarda gün boyu müzik ve deniz keyfi",
            icon: "🍹",
          },
          {
            name: "Spa & Wellness",
            description: "Bali masajı, aromaterapi ve lüks spa merkezleri",
            icon: "💆",
          },
          {
            name: "Yoga & Pilates",
            description: "Sahil ve stüdyo bazlı dersler, her seviyeye uygun",
            icon: "🧘",
          },
          {
            name: "Gün Batımı İzleme",
            description: "Plaj kenarı barlarda ve beach club'larda",
            icon: "🌅",
          },
          {
            name: "Kafe & Restoran Turları",
            description: "Bali'nin en iyi restoran yoğunluğu bu bölgede",
            icon: "🍽️",
          },
          {
            name: "Gece Eğlencesi",
            description: "Şık barlar ve lounge mekanlar, Kuta'ya göre daha elit",
            icon: "🎉",
          },
        ],
        yiyecekIcecekler: {
          "🔹 Yerel / Endonezya – Balinese": [
            {
              name: "Nasi Campur",
              description: "Pilav, tavuk, sebze ve farklı yerel garnitürlerin birleşimi",
            },
            {
              name: "Nasi Goreng",
              description: "Baharatlı, yumurtalı kızarmış pilav",
            },
            {
              name: "Sate Ayam",
              description: "Fıstık soslu ızgara tavuk şiş",
            },
            {
              name: "Gado-Gado",
              description: "Sebzeler, yumurta ve yoğun fıstık soslu salata",
            },
            {
              name: "Soto Ayam",
              description: "Baharatlı ve hafif tavuk çorbası",
            },
            {
              name: "Tempeh & Tofu",
              description: "Soya bazlı kızartma veya sote yerel protein kaynakları",
            },
          ],
          "🔹 Gourmet & Fine Dining": [
            {
              name: "Mozaic Beach Club",
              description: "Michelin yıldızlı şef tarafından yönetilen, endonezya mutfağı ve uluslararası fusion",
            },
            {
              name: "Kayuputi",
              description: "Fine dining, deniz ürünleri ve modern Bali yemekleri",
            },
            {
              name: "Kafe Wayan Restaurant",
              description: "Otantik Balinese ve Jawa mutfağı, zarif ortamda servis",
            },
          ],
          "🔹 Beach Club Cuisine": [
            {
              name: "Double Six Dining",
              description: "Mediteranean ve uluslararası yemekler, plaj manzarasında",
            },
            {
              name: "Bali Hai Cliff Club",
              description: "Seafood ve uluslararası mutfak, manzara eşliğinde",
            },
            {
              name: "Seminyak Beach Club Menus",
              description: "Casual dining, canlı müzik eşliğinde hafif atıştırmalıklar ve kokteyl",
            },
          ],
          "🔹 Casual Dining": [
            {
              name: "Warung & Lokal Restoran",
              description: "Uygun fiyatlı geleneksel Bali yemekleri",
            },
            {
              name: "Kafe & Kahvehane",
              description: "Espresso, latte ve açık hava oturma alanları",
            },
          ],
          "🔹 Türk Mutfağı - Sumak Turkish Cuisine (Kerobokan Yakın)": [
            {
              name: "Sumak Turkish Cuisine",
              description: "Seminyak'ta 3-5 km mesafede (10-15 dakika), MICHELIN seviyesi Turkish authentic cuisine. Adana Kebap, İskender Kebap, Turkish Dumplings, Baklava, Fresh Mezze Platters. TripAdvisor 4.8/5 ⭐ - Authentic Anatolia Flavors. Website: sumakbali.com",
            },
            {
              name: "Döner & Kebap Seçenekleri",
              description: "Sumak'ta özel döner ve çeşitli kebap tatlı lezzeti - arnavut ciğeri, kuzu kebap, adana vb.",
            },
            {
              name: "Pide & Turkish Bread",
              description: "Sumak'ta ev yapımı pide ve tahıl ekmekler",
            },
          ],
          "🔹 Alkolsüz İçecekler": [
            {
              name: "Smoothie & Smoothie Bowl",
              description: "Tropikal meyvelerle hazırlanır",
            },
            {
              name: "Taze Meyve Suları",
              description: "Mango, ananas, karpuz, ejder meyvesi",
            },
            {
              name: "Bitki Çayları",
              description: "Zencefil, limon otu, nane",
            },
            {
              name: "Cold Brew & Specialty Coffee",
              description: "Üçüncü nesil kahveciler yaygın",
            },
            {
              name: "Hindistan Cevizi Suyu",
              description: "Doğal ve serinletici",
            },
          ],
        },
        konaklama: [
          {
            name: "4 Yıldız Oteller",
            description: "Plaja yakın, modern tasarım, havuzlu",
          },
          {
            name: "5 Yıldız Oteller & Resortlar",
            description: "Lüks, beach club ve spa olanaklı",
          },
          {
            name: "Havuzlu Villalar",
            description: "Özel havuz, çiftler ve arkadaş grupları için ideal",
          },
          {
            name: "Boutique Oteller",
            description: "Az odalı, şık ve sakin konsept",
          },
          {
            name: "Apart Oteller",
            description: "Uzun konaklamalar ve esnek bütçeler için",
          },
        ],
        konaklamaSuresi: "3 gün",
        konaklamaBudgeti: "900 – 1.300 USD",
        alisveris: [
          {
            name: "Seminyak Village",
            description: "Boutique mağazalar, tasarımcı kıyafetler ve sanat galerileri",
          },
          {
            name: "Oberoi Street Shopping",
            description: "Lüks markaları ve özel tasarımcı dükkanları",
          },
          {
            name: "Petitenget Gallery",
            description: "Sanat eserleri, takılar ve dekoratif eşyaların yer aldığı galeri",
          },
          {
            name: "Seminyak Beachfront Shops",
            description: "Plaj kıyafetleri, sörf ekipmanları ve spor markaları",
          },
          {
            name: "Local Craft Markets",
            description: "El yapımı ürünler, hediyelik eşyalar ve tekstil",
          },
          {
            name: "Tasarım Butikleri",
            description: "Yerel ve uluslararası moda markaları",
          },
          {
            name: "Plaj & Resort Kıyafetleri",
            description: "Şık elbiseler, pareolar, sandaletler",
          },
          {
            name: "El Yapımı Takılar",
            description: "Gümüş, doğal taş ve bohem tasarımlar",
          },
          {
            name: "Ev Dekorasyon Ürünleri",
            description: "Bali tarzı ahşap ve bambu objeler",
          },
          {
            name: "Doğal Kozmetik & Spa Ürünleri",
            description: "Hindistan cevizi yağı, sabunlar, tütsüler",
          },
          {
            name: "Hediyelik Ürünler",
            description: "Minimal Bali temalı aksesuarlar",
          },
        ],
      },
      uluwatu: {
        name: "Uluwatu",
        island: "Bali",
        description:
          "Uluwatu, Bali'nin en dramatik ve akropolisli destinasyonudur. Dik kayalıklar üzerine inşa edilen antik Uluwatu Tapınağı, ikonik sörf spotları ve okyanus manzaralı beach club'ları ile ünlüdür. Gün batımı deneyimi ve Kecak dans gösterileri, bu bölgenin en önemli çekicilikleridir.",
        images: [
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200", 'bali-uluwatu-img0'),
          getImageUrl("https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-uluwatu-img1'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-uluwatu-img2'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-uluwatu-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Uluwatu Tapınağı",
            description: "Uçurum üzerindeki tapınakta gün batımı ve Kecak dansı izleme",
          },
          {
            name: "Pasir Putih Plajı",
            description: "Gizli plaj, sörf ve snorkeling için ideal",
          },
          {
            name: "Padang Padang Beach",
            description: "Küçük koy, yüzme ve fotoğraf çekimi",
          },
          {
            name: "Suluban / Blue Point Beach",
            description: "Mağara içinden geçilen sörf plajı",
          },
          {
            name: "Bingin Beach",
            description: "Sessiz koy, gün batımı ve sahil yürüyüşleri",
          },
          {
            name: "Dreamland Beach",
            description: "Geniş kumsal, yüzme ve güneşlenme",
          },
          {
            name: "Melasti Beach",
            description: "Turkuaz su, uçurum manzarası ve fotoğraf noktaları",
          },
          {
            name: "Single Fin",
            description: "İkonu haline gelmiş cliff bar, gün batımı manzarası",
          },
        ],
        aktiviteler: [
          {
            name: "Sörf (ileri seviye)",
            description: "Dünya çapında ünlü reef break dalgalar, deneyimli sörfçüler için",
            icon: "🏄",
          },
          {
            name: "Plaj & Yüzme",
            description: "Doğal koylarda, gelgit saatlerine dikkat edilerek",
            icon: "🏊",
          },
          {
            name: "Cliff Beach Club Deneyimi",
            description: "Okyanus manzaralı havuzlar, gün boyu dinlenme",
            icon: "🏖️",
          },
          {
            name: "Gün Batımı İzleme",
            description: "Uçurum kenarında Bali'nin en etkileyici gün batımları",
            icon: "🌅",
          },
          {
            name: "Yoga & Meditasyon",
            description: "Sessiz doğa ortamında açık hava seansları",
            icon: "🧘",
          },
          {
            name: "Spa & Masaj",
            description: "Deniz manzaralı masaj ve wellness terapileri",
            icon: "💆",
          },
          {
            name: "Fotoğraf & Drone Çekimleri",
            description: "Uçurumlar ve turkuaz deniz manzaraları",
            icon: "📸",
          },
          {
            name: "Tekne & Sahil Keşfi",
            description: "Yakın koylara kısa tekne turları",
            icon: "🚤",
          },
          {
            name: "Snorkeling",
            description: "Dalgıç rehberiyle mercan resifleri keşfi",
            icon: "🤿",
          },
          {
            name: "Kecak Dans Gösterisi",
            description: "Uluwatu Tapınağı'nda geleneksel Balinese dans performansı",
            icon: "🎭",
          },
        ],
        yiyecekIcecekler: {
          "Yerel / Endonezya – Balinese": [
            {
              name: "Nasi Goreng Uluwatu Tarzı",
              description: "Seafood ve yerel baharatlarla yapılan özel kızarmış pilav",
            },
            {
              name: "Ikan Bakar (Grilled Fish)",
              description: "Günlük yakalanan taze balık, yerel baharatlarla ızgara",
            },
            {
              name: "Sate Ayam",
              description: "Fıstık soslu ızgara tavuk şiş",
            },
            {
              name: "Nasi Campur",
              description: "Pilav yanında tavuk, sebze ve çeşitli garnitürler",
            },
          ],
          "Beach Club & Fine Dining": [
            {
              name: "Seafood Platter",
              description: "Taze deniz ürünleri, ızgara veya teryaki stilinde",
            },
            {
              name: "Gourmet Fusion",
              description: "Asya ve Batı mutfağı füzyonu, okyanus manzaralı",
            },
            {
              name: "Steak & Grill",
              description: "Premium et seçimleri, şef tarafından hazırlanan",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Hindistan Cevizi Suyu",
              description: "Taze ve doğal",
            },
            {
              name: "Taze Meyve Suları",
              description: "Mango, papaya, ananas, watermelon",
            },
            {
              name: "Smoothie & Detox İçecekleri",
              description: "Serinletici ve besleyici",
            },
            {
              name: "Bali Kahvesi",
              description: "Yoğun aromalı yerel çekirdekler",
            },
            {
              name: "Bitki Çayları",
              description: "Zencefil, limon otu, papatya",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Fine Dining Restoranlar",
              description: "Gourmet ve yüksek kaliteli aşçılık",
            },
            {
              name: "Steakhouse & Seafood",
              description: "Premium et ve deniz ürünleri",
            },
            {
              name: "Akdeniz Mutfağı",
              description: "Yunan, İspanyol ve İtalyan lezzetleri",
            },
            {
              name: "İtalyan Mutfağı",
              description: "Pasta, risotto ve İtalya'nın klasikleri",
            },
            {
              name: "Vegan & Sağlıklı Menüler",
              description: "Organik ve beslenme dengeli seçenekler",
            },
          ],
          "Türk Mutfağı - Yakında Mevcut (Kuta 30 min)": [
            {
              name: "Cappadocia Turkish Restaurant (Canggu - 25-30 min)",
              description: "AUTHENTIC Turkish. Pide, Döner, Adana Kebap, Meze, Baklava. 4.7/5 ⭐ TripAdvisor. +62 812-3841-1575",
            },
            {
              name: "Istanbul Meze Kebab House (Kerobokan - 20 min)",
              description: "Fresh Mezze, Kebap, Manti, Babaganoush. 4.2/5 ⭐ TripAdvisor. Shisha mekanı ve vegetarian seçenekleri.",
            },
          ],
        },
        konaklama: [
          {
            name: "Cliff View Resortlar",
            description: "Uçurum kenarında, okyanus manzaralı, lüks konsept",
          },
          {
            name: "5 Yıldız Oteller",
            description: "Özel plaj erişimi, spa, fine dining restoranlar",
          },
          {
            name: "Havuzlu Villalar",
            description: "Özel infinity pool, balayı ve çiftler için ideal",
          },
          {
            name: "Butik Oteller",
            description: "Sessiz, şık ve doğayla uyumlu tasarım",
          },
          {
            name: "Surf Lodge & Guesthouse'lar",
            description: "Sörfçüler için pratik ve uygun seçenekler",
          },
        ],
        konaklamaSuresi: "3 gün",
        konaklamaBudgeti: "1.100 – 1.700 USD",
        alisveris: [
          {
            name: "Uluwatu Beach Club Shops",
            description: "Sörf kıyafetleri, bikini ve beach wear markaları",
          },
          {
            name: "Yerel Zanaat Pazarı",
            description: "El sanatları, takılar ve dekoratif eşyalar",
          },
          {
            name: "Sörf & Water Sports Mağazaları",
            description: "Sörf tahtası, kıyafet ve su sporları ekipmanları",
          },
          {
            name: "Sanat Galerileri",
            description: "Yerel sanatçılardan resim ve heykeltaş",
          },
          {
            name: "Bali Temalı Hediyelikler",
            description: "Tapınak replikaları ve geleneksel aksesuarlar",
          },
        ],
      },
      nusaDua: {
        name: "Nusa Dua",
        island: "Bali",
        description:
          "Nusa Dua, Bali'nin en lüks ve düzenlemiş turizm bölgesidir. Planlı bir kompleks olarak inşa edilen bu alan, dünyanın en iyi resortlarını, golf alanlarını, yachting ve su sporları tesislerini içerir. Sakin ve güvenli plajları, kristal berrak suları ve high-end hizmetleriyle, lüks tatil arayanların ilk tercihi.",
        images: [
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200", 'bali-nusadua-img0'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-nusadua-img1'),
          getImageUrl("https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-nusadua-img2'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-nusadua-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Nusa Dua Beach",
            description: "Sakin deniz, yüzme ve güneşlenme",
          },
          {
            name: "Water Blow",
            description: "Dalga çarpma noktasında doğal gösteri ve fotoğraf alanı",
          },
          {
            name: "Geger Beach",
            description: "Daha lokal, sessiz ve berrak plaj",
          },
          {
            name: "Bali Collection",
            description: "Alışveriş, restoran ve kafe kompleksi",
          },
          {
            name: "Museum PASIFIKA",
            description: "Asya-Pasifik sanat eserleri ve kültürel koleksiyon",
          },
          {
            name: "Puputan Monument",
            description: "Bali tarihine dair anıt alan",
          },
          {
            name: "Turtle Island (Pulau Penyu)",
            description: "Deniz kaplumbağalarını gözlemleyebileceğiniz ada",
          },
          {
            name: "Bali Nusa Dua Convention Center",
            description: "Etkinlik ve konferans mekanı, kültürel gösterileri barındırır",
          },
        ],
        aktiviteler: [
          {
            name: "Jet Ski",
            description: "Kontrollü ve güvenli alanlarda yüksek hız deneyimi",
            icon: "🏎️",
          },
          {
            name: "Banana Boat",
            description: "Aile ve grup aktiviteleri için eğlenceli su sporu",
            icon: "🍌",
          },
          {
            name: "Parasailing",
            description: "Deniz üzerinde panoramik manzara eşliğinde uçuş",
            icon: "🪂",
          },
          {
            name: "Snorkeling",
            description: "Sakin ve berrak sularda mercan ve balık gözlemi",
            icon: "🤿",
          },
          {
            name: "Dalış (Scuba Diving)",
            description: "Başlangıç ve sertifikalı dalış noktaları",
            icon: "🤿",
          },
          {
            name: "Yüzme",
            description: "Bali'nin en sakin denizlerinden biri, dalgasız plaj",
            icon: "🏊",
          },
          {
            name: "Golf",
            description: "Okyanus manzaralı, dünya standartlarında golf sahaları",
            icon: "⛳",
          },
          {
            name: "Spa & Wellness",
            description: "Lüks resort spa'larında Bali masajı ve bakım kürleri",
            icon: "💆",
          },
          {
            name: "Bisiklet Turları",
            description: "Resort alanları ve sahil boyunca düz parkurlar",
            icon: "🚴",
          },
          {
            name: "Tekne Turu",
            description: "Yachtıng ve mahalledeki adaları keşif",
            icon: "⛵",
          },
          {
            name: "Gün Batımı Cruisesi",
            description: "Romantik dinner cruise deneyimi",
            icon: "🌅",
          },
        ],
        yiyecekIcecekler: {
          "Yerel / Endonezya – Balinese": [
            {
              name: "Nasi Goreng",
              description: "Baharatlı kızarmış pilav, yerel usulde",
            },
            {
              name: "Sate Lilit",
              description: "Balık ve tarçın iç harcı ile yapılan şiş",
            },
            {
              name: "Bebek Betutu",
              description: "Muz yaprağında pişirilen ördek",
            },
          ],
          "Fine Dining": [
            {
              name: "Michelin-Yıldızlı Restoranlar",
              description: "Yüksek düzey aşçılık ve sunuş",
            },
            {
              name: "International Cuisine",
              description: "Avrupa, Asya ve Amerika'dan yemekler",
            },
            {
              name: "Seafood Specialty Restaurants",
              description: "Taze deniz ürünlerinin özel hazırlanışları",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Taze Meyve Suları",
              description: "Bali'nin tropikal meyvelerinden yapılan suyu",
            },
            {
              name: "Bali Kahvesi",
              description: "Yerel çekirdeklerden yoğun aromalı kahve",
            },
            {
              name: "Smoothie & Detox",
              description: "Organik meyveler ve sebzelerden hazırlanır",
            },
          ],
          "Türk Mutfağı - Yakında Mevcut (Kuta 40 min)": [
            {
              name: "Sumak Turkish Cuisine (Seminyak - 35-40 min)",
              description: "MICHELIN LEVEL Turkish. Adana Kebap, İskender, Turkish Dumplings, Baklava. 4.8/5 ⭐ TripAdvisor. sumakbali.com",
            },
            {
              name: "Cappadocia Turkish Restaurant (Canggu - 40-45 min)",
              description: "AUTHENTIC Turkish. Pide, Döner, Adana Kebap, Meze, Baklava. 4.7/5 ⭐ TripAdvisor. +62 812-3841-1575",
            },
          ],
        },
        konaklama: [
          {
            name: "5 Yıldız Resortlar",
            description: "Tüm yemeklerin fiyata dahil olduğu paketler veya yarım pansiyon konseptli, geniş alanlar ve özel plajlar",
          },
          {
            name: "Ultra Lüks Oteller",
            description: "Özel villa konseptleri, kişisel butler hizmetleri",
          },
          {
            name: "Beachfront Oteller",
            description: "Denize sıfır, sakin ve güvenli ortam",
          },
          {
            name: "Aile Dostu Resortlar",
            description: "Çocuk kulüpleri, su parkları ve aktiviteler",
          },
          {
            name: "Havuzlu Villalar",
            description: "Daha özel ve sessiz konaklama arayanlar için",
          },
        ],
        konaklamaSuresi: "3 gün",
        konaklamaBudgeti: "1.300 – 2.000 USD",
        alisveris: [
          {
            name: "Bali Collection",
            description: "Uluslararası markaları ve luxury boutique dükkanları",
          },
          {
            name: "Nusa Dua Plaza",
            description: "Modaya uygun ürünler ve elektronik",
          },
          {
            name: "Resort Shops",
            description: "Oteller içindeki özel tasarımcı dükkanları",
          },
          {
            name: "Beachfront Gift Shops",
            description: "Bali hediyelikleri ve souvenirler",
          },
          {
            name: "Jewelry & Watch Stores",
            description: "Lüks saatler, takılar ve aydınlatma ürünleri",
          },
          {
            name: "El Sanatları Ürünleri",
            description: "Ahşap oymalar, Bali maskeleri",
          },
          {
            name: "Batik & Tekstil Ürünleri",
            description: "Şal, pareo, el dokuması kumaşlar",
          },
          {
            name: "Doğal Kozmetik & Spa Ürünleri",
            description: "Yağlar, sabunlar, bakım setleri",
          },
          {
            name: "Resort Mağazaları",
            description: "Lüks hediyelikler ve plaj aksesuarları",
          },
          {
            name: "Fotoğraf & Hatıra Ürünleri",
            description: "Magnet, kartpostal, dekoratif objeler",
          },
        ],
      },
      canggu: {
        name: "Canggu",
        island: "Bali",
        description:
          "Canggu, Bali'nin en trendy ve dinamik bölgesidir. Plajın kuzeyinde yer alan bu bölge, harika sörf spotları, hip kafe ve barları, tasarım odalı boutique otelleri ve genç, yaratıcı bir toplulukla ünlüdür. Dijital göçebeler ve genç profesyonellerin tercih ettiği Canggu, Bali'nin en canlı gece hayatını sunmaktadır.",
        images: [
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200", 'bali-canggu-img0'),
          getImageUrl("https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-canggu-img1'),
          getImageUrl("https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-canggu-img2'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-canggu-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Batu Bolong Beach",
            description: "Sörf, gün batımı ve plaj yürüyüşleri",
          },
          {
            name: "Echo Beach",
            description: "Sörf, sahil restoranları ve fotoğraf noktaları",
          },
          {
            name: "Berawa Beach",
            description: "Geniş sahil alanı ve beach club'lar",
          },
          {
            name: "Tanah Lot Tapınağı",
            description: "Deniz üzerindeki ikonik tapınak ve gün batımı manzarası",
          },
          {
            name: "Pirinç Tarlaları",
            description: "Doğa yürüyüşleri ve fotoğraf çekimi",
          },
          {
            name: "Canggu Street Art Alanları",
            description: "Modern duvar resimleri ve sanat noktaları",
          },
          {
            name: "Finns Beach Club",
            description: "Popüler beach club, gün batımı ve müzik",
          },
          {
            name: "Old Man's",
            description: "Sörf spot ile ilişkili, gün batımı barı ve konaklama",
          },
          {
            name: "Padma Utara Temple",
            description: "Antik Hindu tapınağı, sakin ve otantik",
          },
          {
            name: "Betelnut Cafe",
            description: "Trendy ve Instagram-friendly kafe",
          },
          {
            name: "Bali Swing",
            description: "Orman içinde salıncak deneyimi",
          },
          {
            name: "Warung Bodag Baruna",
            description: "Sahil kenarında seafood restoranı",
          },
          {
            name: "Canggu Komputer",
            description: "Yerel market, otantik Bali deneyimi",
          },
          {
            name: "Pantai Batu Mejan",
            description: "Daha sessiz, lokal plaj",
          },
          {
            name: "Goa Gajah Tembuku",
            description: "Mağara tapınağı, doğa ve tarih",
          },
          {
            name: "Pererenan Beach",
            description: "Az bilinen ve tenha plaj",
          },
        ],
        aktiviteler: [
          {
            name: "Sörf",
            description: "Yeni başlayanlar ve orta seviye için ideal dalgalar",
            icon: "🏄",
          },
          {
            name: "Sörf Kursları",
            description: "Sertifikalı eğitmenler ile birebir veya grup dersleri",
            icon: "🏄",
          },
          {
            name: "ATV Turları",
            description: "Pirinç tarlaları ve köy yollarında off-road sürüş",
            icon: "🏍️",
          },
          {
            name: "Yoga & Meditasyon",
            description: "Dünya çapında yoga stüdyoları ve retreat merkezleri",
            icon: "🧘",
          },
          {
            name: "Spa & Masaj",
            description: "Bali masajı, aromaterapi ve rahatlama terapileri",
            icon: "💆",
          },
          {
            name: "Yüzme",
            description: "Okyanus ve havuz alternatifleri",
            icon: "🏊",
          },
          {
            name: "Beach Club Deneyimi",
            description: "Gün boyu müzik, dinlenme ve sosyalleşme",
            icon: "🏖️",
          },
          {
            name: "Bisiklet & Scooter Turları",
            description: "Sahil ve köy yollarında serbest keşif",
            icon: "🚴",
          },
          {
            name: "Gün Batımı İzleme",
            description: "Plaj ve beach club'larda gün batımı keyfi",
            icon: "🌅",
          },
        ],
        yiyecekIcecekler: {
          "Yerel / Endonezya – Balinese": [
            {
              name: "Nasi Goreng",
              description: "Yerel usulde baharatlı kızarmış pilav",
            },
            {
              name: "Satay & BBQ",
              description: "Izgara etin çeşitli stilleri",
            },
            {
              name: "Gado-Gado",
              description: "Fıstık soslu sebze salatası",
            },
            {
              name: "Lumpia",
              description: "Kızarmış spring roll'lar, baharatlandırılmış doldurmayla",
            },
            {
              name: "Perkedel",
              description: "Patates topları, altın sarısı ve çıtır",
            },
            {
              name: "Rendang",
              description: "Hindistan cevizli ette güveç, yoğun lezzet",
            },
          ],
          "Cafe & Health Food": [
            {
              name: "Organic Brunch",
              description: "Sağlıklı ve organik kahvaltı menüleri",
            },
            {
              name: "Vegan & Vegetarian",
              description: "Bitki bazlı yemek seçenekleri",
            },
            {
              name: "Smoothie & Bowls",
              description: "Açai ve smoothie bowl'lar",
            },
          ],
          "International & Fusion": [
            {
              name: "Modern Asian Cuisine",
              description: "Çağdaş Asya mutfağı",
            },
            {
              name: "Mediterranean",
              description: "Akdeniz tarzı yemekler",
            },
            {
              name: "Mexican & Latin",
              description: "Meksika ve Latin Amerika mutfağı",
            },
          ],
          "Türk Mutfağı - Cappadocia Turkish Restaurant": [
            {
              name: "Cappadocia Turkish Restaurant",
              description: "Canggu'da YERLEŞKENDİR! Jl. Munduk Catu No.3, Canggu. AUTHENTIC Turkish Cuisine. Pide, Döner, Adana Kebap, Meze Platters, Turkish Dumplings, Baklava, Turkish Coffee. TripAdvisor: 4.7/5 ⭐ (32 reviews). Open: 11:00 AM - 1:00 AM. Phone: +62 812-3841-1575. Website: cappadociabali.com",
            },
            {
              name: "Pide & Manti",
              description: "Cappadocia'da ev yapımı otantik pide ve manti",
            },
            {
              name: "Kebap Çeşitleri",
              description: "Adana kebap, kuzu şiş, tavuk kebap - Cappadocia'nın özel hazırlanışı",
            },
            {
              name: "Meze & Appetizers",
              description: "Fresh hummus, baba ganoush, tzatziki, dolma - daily changing selection",
            },
            {
              name: "Turkish Desserts",
              description: "Baklava, Turkish rice pudding, phyllo pastries - Cappadocia specialty",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Hindistan Cevizi Suyu",
              description: "Doğal ve taze",
            },
            {
              name: "Smoothie Bowls",
              description: "Meyve ve süper gıda içerikli",
            },
            {
              name: "Taze Meyve Suları",
              description: "Mango, ananas, papaya",
            },
            {
              name: "Soğuk Demleme Kahveler",
              description: "Cold brew kahve seçenekleri",
            },
            {
              name: "Bitki Çayları",
              description: "Zencefil, limon otu",
            },
            {
              name: "Es Jeruk (Limon Dondurmacı)",
              description: "Yerel Endonezya içeceği, tatlı ve serinletici",
            },
          ],
        },
        konaklama: [
          {
            name: "4–5 Yıldız Oteller",
            description: "Modern tasarım, plaja yakın, sosyal alanlar",
          },
          {
            name: "Havuzlu Villalar",
            description: "Özel havuzlu, çiftler ve arkadaş grupları için ideal",
          },
          {
            name: "Boutique Oteller",
            description: "Tasarım odaklı, sakin ve şık",
          },
          {
            name: "Hosteller & Co-Living Alanları",
            description: "Dijital göçebeler ve genç gezginler için",
          },
          {
            name: "Surf Lodge'lar",
            description: "Sörfçülere özel konaklama ve ekipman desteği",
          },
        ],
        konaklamaSuresi: "4 gün",
        konaklamaBudgeti: "1.100 – 1.600 USD",
        alisveris: [
          {
            name: "Canggu Street Shops",
            description: "Yerel tasarımcı dükkanları ve boutique mağazalar",
          },
          {
            name: "Vintage & Thrift Stores",
            description: "Vintage kıyafetler ve retro ürünler",
          },
          {
            name: "Yoga & Sportswear",
            description: "Yoga ve spor kıyafetleri",
          },
          {
            name: "Sanat Galerileri",
            description: "Yerel sanatçılardan eserler",
          },
          {
            name: "Kafe Aksesuarları",
            description: "Kahve ve kafe kültürüne ait ürünler",
          },
          {
            name: "Sörf Mağazaları",
            description: "Tahta, wetsuit ve ekipmanlar",
          },
          {
            name: "Yerel Tasarımcı Butikleri",
            description: "Bali tarzı kıyafetler",
          },
          {
            name: "Plaj Giyim & Aksesuarları",
            description: "Pareo, şapka, çanta",
          },
          {
            name: "El Yapımı Takılar",
            description: "Gümüş, doğal taş ve ahşap",
          },
          {
            name: "Yoga & Spor Ürünleri",
            description: "Mat, kıyafet ve aksesuarlar",
          },
          {
            name: "Kafelerden Hediyelik Ürünler",
            description: "Kahve çekirdeği, kupalar, bez çantalar",
          },
        ],
      },
      sanur: {
        name: "Sanur",
        island: "Bali",
        description:
          "Sanur, Bali'nin sakin ve aile dostu sahil kasabasıdır. Korunaklı lagün, sakin deniz, geleneksel balık pazarı ve yerel atmosferi ile ünlüdür. Sanur, hızlı yaşam temposundan uzaklaşmak ve otantik Bali deneyimi yaşamak isteyenler için mükemmel bir seçimdir.",
        images: [
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200", 'bali-sanur-img0'),
          getImageUrl("https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-sanur-img1'),
          getImageUrl("https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-sanur-img2'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-sanur-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Sanur Beach",
            description: "Sakin ve korunaklı sahil, yüzme ve yürüyüş için ideal",
          },
          {
            name: "Sanur Market",
            description: "Geleneksel balık pazarı ve yerel ürünler",
          },
          {
            name: "Pura Belanjong Tapınağı",
            description: "Eski Hindu tapınağı ve tarihi anıt",
          },
          {
            name: "Gün Doğumu Noktası",
            description: "Sabah erken saatlerde spektaküler gün doğumu deneyimi",
          },
          {
            name: "Pelangi Beach Club",
            description: "Modern beach club ve dinlenme alanı",
          },
          {
            name: "Sanur Sahil Yolu",
            description: "Bisiklet, koşu ve sahil gezintisi için uzun ve güzel yol",
          },
          {
            name: "Sindhu Beach",
            description: "Yerel kafeler ve sakin plaj atmosferi",
          },
          {
            name: "Le Mayeur Museum",
            description: "Bali kültürü, sanat eserleri ve Belçika ressam koleksiyonu",
          },
          {
            name: "Bali Orchid Garden",
            description: "Doğa gezisi ve fotoğraf çekimi, tropikal orkideeler",
          },
          {
            name: "Serangan Island",
            description: "Kaplumbağa koruma alanı ve sakin plaj deneyimi",
          },
        ],
        aktiviteler: [
          {
            name: "Yüzme",
            description: "Dalgasız ve sığ deniz, çocuklar için güvenli",
            icon: "🏊",
          },
          {
            name: "Snorkeling",
            description: "Sahile yakın mercan ve balık gözlemi",
            icon: "🤿",
          },
          {
            name: "Bisiklet Turları",
            description: "Sahil boyunca uzanan yürüyüş ve bisiklet yolu",
            icon: "🚴",
          },
          {
            name: "Yoga & Meditasyon",
            description: "Sakin sahil ortamında açık hava seansları",
            icon: "🧘",
          },
          {
            name: "Spa & Masaj",
            description: "Bali masajı ve rahatlatıcı terapiler",
            icon: "💆",
          },
          {
            name: "Kano & Paddle Board",
            description: "Sakin denizde kürek aktiviteleri",
            icon: "🚣",
          },
          {
            name: "Gün Doğumu İzleme",
            description: "Bali'de en iyi sunrise noktalarından biri",
            icon: "🌅",
          },
          {
            name: "Balıkçı Teknesi Turları",
            description: "Yerel balıkçı yaşamını deneyimleme",
            icon: "⛵",
          },
          {
            name: "Balık Pazarı Turu",
            description: "Sabah erken balık pazarını ziyaret ve yerel yaşamı deneyimleme",
            icon: "🐟",
          },
          {
            name: "Seramik & El Sanatları Atölyesi",
            description: "Yerel sanatçılarla el sanatları öğrenmek",
            icon: "🎨",
          },
          {
            name: "Gece Balık Avı Turu",
            description: "Gece ışıklarıyla balık avlamayı izleme",
            icon: "🌙",
          },
          {
            name: "Deniz Kaplumbağa Koruma",
            description: "Koruma programına katılım",
            icon: "🐢",
          },
          {
            name: "Geleneksel Bali Dansı",
            description: "Kültürel dans öğrenmek",
            icon: "💃",
          },
          {
            name: "Sahil Temizliği Gönüllü Programı",
            description: "Çevre dostu aktivite",
            icon: "🌍",
          },
        ],
        yiyecekIcecekler: {
          "Yerel / Endonezya – Balinese": [
            {
              name: "Nasi Goreng",
              description: "Baharatlı, sebzeli ve yumurtalı kızarmış pilav",
            },
            {
              name: "Nasi Campur",
              description: "Tavuk, sebze ve çeşitli Bali garnitürleriyle pilav",
            },
            {
              name: "Sate Ayam",
              description: "Fıstık soslu tavuk şiş",
            },
            {
              name: "Soto Ayam",
              description: "Baharatlı tavuk çorbası",
            },
            {
              name: "Ayam Betutu",
              description: "Baharatlarla marine edilmiş, yavaş pişmiş tavuk",
            },
            {
              name: "Tempeh & Tofu",
              description: "Soya bazlı kızartma veya sotelenmiş yemekler",
            },
            {
              name: "Lumpia",
              description: "Kızarmış spring roll'lar, baharatlandırılmış doldurmayla",
            },
            {
              name: "Perkedel",
              description: "Patates topları, altın sarısı ve çıtır",
            },
            {
              name: "Rendang",
              description: "Hindistan cevizli et güveçi, yoğun lezzet",
            },
            {
              name: "Ikan Bakar",
              description: "Taze balık ızgarası, limon ve baharatlarla",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Akdeniz Mutfağı",
              description: "Yunan, İspanyol ve İtalyan lezzetleri",
            },
            {
              name: "İtalyan Pizzaları ve Makarnalar",
              description: "Taze malzemelerle yapılan İtalyan yemekleri",
            },
            {
              name: "Deniz Ürünleri Restoranları",
              description: "Taze deniz ürünleri spesiyalist mekanlar",
            },
            {
              name: "Vegan ve Vejetaryen Mutfaklar",
              description: "Bitki bazlı ve sağlıklı seçenekler",
            },
            {
              name: "Sahil Kafeleri ve Brunch Menüleri",
              description: "Organik ve taze kahvaltı seçenekleri",
            },
          ],
          "Türk Mutfağı": [
            {
              name: "Döner",
              description: "Geleneksel Türk döner",
            },
            {
              name: "Kebap Çeşitleri",
              description: "Çeşitli kebap stilleri ve hazırlanışlar",
            },
            {
              name: "Pide",
              description: "Türk tarzı pizza, çeşitli dolgularla",
            },
            {
              name: "Manti",
              description: "Geleneksel Türk mantısı, yoğurtlu sosu ile",
            },
            {
              name: "Çiğ Köfte",
              description: "Çiğ köfte, baharatlı ve lezzetli",
            },
            {
              name: "Lahmacun",
              description: "Türk pizzası, kıymalı topping ile",
            },
            {
              name: "Meze Çeşitleri",
              description: "Hummus, Muhammara, Tzatziki ve daha fazlası",
            },
            {
              name: "Türk & Orta Doğu Mutfağı",
              description: "Türk ve Orta Doğu mutfağı sunan restoranlar",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Hindistan Cevizi Suyu",
              description: "Taze ve doğal",
            },
            {
              name: "Taze Meyve Suları",
              description: "Portakal, mango, ananas",
            },
            {
              name: "Bitki Çayları",
              description: "Zencefil, limon otu",
            },
            {
              name: "Bali Kahvesi",
              description: "Yerel çekirdeklerden yoğun aromalı",
            },
            {
              name: "Soğuk Kahve & Smoothie'ler",
              description: "Cold brew ve meyve smoothie'leri",
            },
            {
              name: "Es Jeruk (Limon Dondurmacı)",
              description: "Yerel Endonezya içeceği, tatıl ve serinletici",
            },
            {
              name: "Teh Dingin (Soğuk Çay)",
              description: "Tatlı soğuk çay, yerel tarif",
            },
          ],
        },
        konaklama: [
          {
            name: "4–5 Yıldız Sahil Otelleri",
            description: "Denize sıfır, sakin ve geniş alanlar",
          },
          {
            name: "Boutique Oteller",
            description: "Küçük ölçekli, huzurlu ve yerel tarzda",
          },
          {
            name: "Aile Dostu Oteller",
            description: "Çocuk havuzları ve güvenli plaj erişimi",
          },
          {
            name: "Havuzlu Villalar",
            description: "Sessiz mahallelerde özel konaklama",
          },
          {
            name: "Uzun Süreli Konaklama Otelleri",
            description: "Apart otel ve rezidans tipi",
          },
        ],
        konaklamaSuresi: "3 gün",
        konaklamaBudgeti: "900 – 1.300 USD",
        alisveris: [
          {
            name: "Sanur Market",
            description: "Geleneksel pazarda yerel ürünler",
          },
          {
            name: "Batik & Tekstil",
            description: "El dokuması batik ve kumaşlar",
          },
          {
            name: "Sanat Galerileri",
            description: "Yerel sanatçılardan resim ve heykeltaş",
          },
          {
            name: "Hediyelik Eşyalar",
            description: "Bali temalı souvenirler ve dekoratif ürünler",
          },
          {
            name: "Beach Wear & Aksesuarları",
            description: "Plaj kıyafetleri ve aksesuarlar",
          },
          {
            name: "Seafood & Local Fish Markets",
            description: "Taze balık ve deniz ürünleri, yerel balıkçılardan",
          },
          {
            name: "Handmade Jewelry Shops",
            description: "El yapımı takılar, gümüş ve mücevherler",
          },
          {
            name: "Wooden Crafts & Sculptures",
            description: "Ahşap oyma sanatları ve el yapımı heykeller",
          },
          {
            name: "Local Coffee Shops",
            description: "Bali kahvesi, kahve çekirdeği ve kahve ürünleri",
          },
          {
            name: "Organic & Health Products",
            description: "Organik ve doğal ürünler, bitkisel çaylar",
          },
          {
            name: "Traditional Fishing Boat Souvenir Shops",
            description: "Tekne modelleri ve balıkçılık hediyelikleri",
          },
          {
            name: "Spice Markets & Local Herbs",
            description: "Baharıt, yerel otlar ve baharat karışımları",
          },
          {
            name: "Shell & Coral Handicrafts",
            description: "Kabuk ve mercan el sanatları, deniz ürünleri",
          },
          {
            name: "Woven Bags & Home Decor",
            description: "Dokuma çantalar ve ev dekorasyon ürünleri",
          },
          {
            name: "Antique & Vintage Shops",
            description: "Antika ve vintage ürünler, eski koleksiyonlar",
          },
        ],
      },
      munduk: {
        name: "Munduk",
        island: "Bali",
        description:
          "Munduk, Bali'nin dağlık kuzey bölgesinde bulunan sakin ve yeşil bir dağ kasabası. Katamarsa göller, kahve plantasyonları, şelale ve sisli dağlar ile doğa severlerin cenneti.",
        images: [
          getImageUrl("https://images.pexels.com/photos/417802/pexels-photo-417802.jpeg?auto=compress&cs=tinysrgb&w=1200", 'bali-munduk-img0'),
          getImageUrl("https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-munduk-img1'),
          getImageUrl("https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-munduk-img2'),
          getImageUrl("https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-munduk-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Danau Beratan",
            description: "Üç göl kompleksi, tekne turu ve tapınak ziyareti",
          },
          {
            name: "Pura Ulun Danu Bratan",
            description: "Göl ortasında ikonik tapınak ve ibadet yeri",
          },
          {
            name: "Munduk Waterfall (Labuhan Kebo)",
            description: "Sisli ormanda çok katlı şelale",
          },
          {
            name: "Kahve Plantasyonları",
            description: "Luwak kahvesi üretimi ve tasting",
          },
          {
            name: "Bukit Asah Viewpoint",
            description: "Dağ manzarası ve fotoğraf noktası",
          },
          {
            name: "Buyan Gölü",
            description: "Sakin su sporları ve doğa yürüyüşü",
          },
          {
            name: "Melanting Waterfall",
            description: "Orman içi trekking ve doğa deneyimi",
          },
          {
            name: "Red Coral Waterfall",
            description: "Kızıl kayalar arasında şelale manzarası",
          },
          {
            name: "Twin Lakes Viewpoint (Buyan & Tamblingan)",
            description: "Göl manzarası ve seyir noktası",
          },
          {
            name: "Tamblingan Gölü",
            description: "Sakin doğa yürüyüşleri ve kano",
          },
          {
            name: "Munduk Köyü",
            description: "Yerel yaşamı gözlemleme ve kültür deneyimi",
          },
          {
            name: "Asah Goblek Waterfall",
            description: "İki katlı şelale, daha az ziyaretçi",
          },
          {
            name: "Wanagiri Hidden Hills",
            description: "Balkon tarzı teraslardan göl manzarası",
          },
          {
            name: "Goa Gajah Tembuku (Bat Cave)",
            description: "Yarasa mağarası ve mistik ortam",
          },
          {
            name: "Pura Batu Karu",
            description: "Yüksek rakım tapınağı, dağ manzarası",
          },
          {
            name: "Sunset Point Munduk",
            description: "Gün batımı için optimal nokta",
          },
          {
            name: "Local Traditional Market",
            description: "Yerel pazarda ürün ve yaşamı gözlemlemek",
          },
          {
            name: "Organik Tarım Ziyaretleri",
            description: "Yerel çiftliklerde tarım deneyimi",
          },
          {
            name: "Wildlife Sanctuary",
            description: "Kuş gözlemciliği ve vahşi yaşam",
          },
        ],
        aktiviteler: [
          {
            name: "Doğa Yürüyüşleri (Trekking)",
            description: "Orman içi patikalar, şelale rotaları ve dağ keşfi",
            icon: "🥾",
          },
          {
            name: "Şelale Keşif Turları",
            description: "Birden fazla şelaleyi tek rotada gezme",
            icon: "💧",
          },
          {
            name: "Fotoğrafçılık",
            description: "Sisli dağlar, göller ve orman manzaraları",
            icon: "📸",
          },
          {
            name: "Kahve & Baharat Turları",
            description: "Yerel kahve ve karanfil tarlaları",
            icon: "☕",
          },
          {
            name: "Yoga & Meditasyon",
            description: "Sessiz ve serin dağ atmosferinde huzur",
            icon: "🧘",
          },
          {
            name: "Kuş Gözlemciliği",
            description: "Endemik Bali kuş türleri ve doğa gözlemi",
            icon: "🦅",
          },
          {
            name: "Bisiklet Turları",
            description: "İniş ağırlıklı, manzaralı dağ yolları",
            icon: "🚴",
          },
          {
            name: "Gün Doğumu İzleme",
            description: "Yüksek rakımdan göl ve vadi manzarası",
            icon: "🌅",
          },
          {
            name: "Gölde Kano & Kayak",
            description: "Danau Beratan'da su sporları ve huzurlu gezinti",
            icon: "🛶",
          },
          {
            name: "Forest Bathing (Orman Banyo)",
            description: "Doğa terapisi, meditasyon yürüyüşü ve huzur",
            icon: "🌲",
          },
          {
            name: "Jeep Safari",
            description: "Dağ köyleri, tarla rotaları ve off-road deneyimi",
            icon: "🚙",
          },
          {
            name: "Bitkisel Spa & Masaj",
            description: "Yerel otlarla doğal terapi ve relaksasyon",
            icon: "💆",
          },
        ],
        yiyecekIcecekler: {
          "Yerel / Endonezya – Balinese": [
            {
              name: "Nasi Goreng",
              description: "Baharatlı kızarmış pilav",
            },
            {
              name: "Sate Ayam",
              description: "Fıstık soslu tavuk şiş",
            },
            {
              name: "Gado-Gado",
              description: "Fıstık soslu sebze salatası",
            },
            {
              name: "Perkedel",
              description: "Patates topları",
            },
            {
              name: "Lumpia",
              description: "Kızarmış spring roll'lar",
            },
            {
              name: "Tempeh Goreng",
              description: "Tempe kızartması, çıtır ve lezzetli",
            },
            {
              name: "Nasi Kuning",
              description: "Turmeric ile sarı pilav",
            },
            {
              name: "Soto Ayam",
              description: "Baharatlı tavuk çorbası",
            },
            {
              name: "Lalapan",
              description: "Çiğ sebze ile soslar",
            },
          ],
          "Kahve & Çay": [
            {
              name: "Bali Kahvesi",
              description: "Yerel çekirdeklerden yoğun aromalı",
            },
            {
              name: "Luwak Kahvesi",
              description: "Bali'nin ünlü pahalı kahvesi",
            },
            {
              name: "Bitki Çayları",
              description: "Zencefil, limon otu ve yerel otlar",
            },
            {
              name: "Teh Dingin",
              description: "Soğuk çay",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Pasta & Pizza",
              description: "İtalyan tarzı yemekler",
            },
            {
              name: "Salata & Sebzeler",
              description: "Taze organik yerel sebzeler",
            },
            {
              name: "Ekmek & Hamur İşleri",
              description: "Ev yapımı ekmek ve pastane",
            },
            {
              name: "Burger",
              description: "Yumuşak ekmekte lezzetli et ve taze malzemeler",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Hindistan Cevizi Suyu",
              description: "Taze ve doğal",
            },
            {
              name: "Taze Meyve Suları",
              description: "Papaya, mango, ananas",
            },
            {
              name: "Smoothie Bowls",
              description: "Meyve ve süper gıda içerikli",
            },
            {
              name: "Ginger Drink (Jahe Hangat)",
              description: "Sıcak zencefil içeceği, antibiyotik özellikleri",
            },
            {
              name: "Wedang Jahe",
              description: "Geleneksel zencefilli sıcak içecek",
            },
            {
              name: "Jamu",
              description: "Yerel bitki çayı, turmeric ve ginger karışımı",
            },
            {
              name: "Es Cendol",
              description: "Yeşil bulamaç tatlı içeceği",
            },
            {
              name: "Bandrek",
              description: "Spiced ginger drink, yerel tarif",
            },
          ],
        },
        konaklama: [
          {
            name: "Doğa İçinde Boutique Oteller",
            description: "Orman ve vadi manzaralı, sakin ortam",
          },
          {
            name: "Dağ & Orman Lodge'ları",
            description: "Ahşap mimari, doğayla iç içe",
          },
          {
            name: "Manzaralı Villalar",
            description: "Sisli vadilere bakan özel teraslar",
          },
          {
            name: "Eco-Lodge & Bungalovlar",
            description: "Sürdürülebilir, doğa dostu konaklama",
          },
          {
            name: "Pansiyon & Guesthouse'lar",
            description: "Yerel halk tarafından işletilen samimi tesisler",
          },
        ],
        konaklamaSuresi: "2–3 gün",
        konaklamaBudgeti: "600 – 900 USD",
        alisveris: [
          {
            name: "Kahve Ticareti",
            description: "Bali ve Luwak kahvesi, kahve çekirdeği",
          },
          {
            name: "Yerel Zanaat",
            description: "El yapımı ahşap ve dokuma ürünleri",
          },
          {
            name: "Organik Ürünler",
            description: "Yerel çiftçilerin organik ürünleri",
          },
          {
            name: "Bitki Çayları",
            description: "Yerel otlar ve bitki çayları",
          },
          {
            name: "Hediyelik Eşyalar",
            description: "Bali temalı suvenir ve dekorasyon",
          },
          {
            name: "Karanfil Ürünleri",
            description: "Karanfil çayı, karanfil yağı, aromaterapi",
          },
          {
            name: "Handmade Soaps & Beauty Products",
            description: "El yapımı sabunlar ve güzellik ürünleri",
          },
          {
            name: "Wooden Handicrafts",
            description: "Ahşap oyma ve dekoratif ürünler",
          },
          {
            name: "Woven Baskets & Textiles",
            description: "Dokuma sepetler ve kumaşlar",
          },
          {
            name: "Honey & Bee Products",
            description: "Yerel arı ürünleri ve organik bal",
          },
          {
            name: "Herbal Medicines & Jamu",
            description: "Geleneksel bitki ilaçları",
          },
          {
            name: "Art & Paintings",
            description: "Yerel sanatçılardan resimler",
          },
          {
            name: "Dried Spices & Herbs",
            description: "Kurutulmuş baharatlar ve otlar",
          },
          {
            name: "Ceramic & Pottery",
            description: "Seramik ve çömlekçilik ürünleri",
          },
          {
            name: "Natural Dyes & Batik",
            description: "Doğal boyalarla batik ürünleri",
          },
        ],
      },
      amed: {
        name: "Amed",
        island: "Bali",
        description:
          "Amed, Bali'nin kuzey doğu sahilinde bulunan sakin dalış kasabası. Tüm yaşa uygun kolay dalış noktaları, snorkeling, gemi enkazları ve canlı mercan resifler ile ünlüdür. Turizm baskısından uzak, otantik Bali deneyimi.",
        images: [
          getImageUrl("https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg?auto=compress&cs=tinysrgb&w=1200", 'bali-amed-img0'),
          getImageUrl("https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-amed-img1'),
          getImageUrl("https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-amed-img2'),
          getImageUrl("https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=800", 'bali-amed-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Amed Beach",
            description: "Uzun siyah kum sahili, yüzme ve snorkeling",
          },
          {
            name: "Japanese Patrol Boat Wreck",
            description: "Dalış enkazı, şnorkeling ile de görülebilir",
          },
          {
            name: "Lipah Bay",
            description: "Sakin körfez, ev sahipli reef ve mercan",
          },
          {
            name: "Pura Lempuyang Tapınağı",
            description: "Dağ üzerinde ikonik tapınak, manzara görmek",
          },
          {
            name: "Jemeluk Bay",
            description: "Protektörlü körfez, güvenli snorkeling",
          },
          {
            name: "Agung Dağı",
            description: "Bali'nin en yüksek aktivasyon, trekking ve manzara",
          },
          {
            name: "Bunutan Beach",
            description: "Farklı bir sahil, daha az turist",
          },
          {
            name: "Banyuning Beach",
            description: "Yerel balıkçılar ve otantik atmosfer",
          },
          {
            name: "Amed Reef",
            description: "Snorkeling ve mercan resifi",
          },
          {
            name: "Pura Puncak Penulisan",
            description: "Dağda bulunan tapınak, manzara",
          },
          {
            name: "Air Terjun Aling",
            description: "Şelale ve doğa yürüyüşü",
          },
          {
            name: "Seraya Secret",
            description: "Derin mercan resifi ve dalış",
          },
          {
            name: "East Bali Shelters",
            description: "Modern mimarı yapı ve plaj",
          },
          {
            name: "Basmati Museum",
            description: "Sanat ve kültür müzesi",
          },
          {
            name: "Coral Garden",
            description: "Koruma altındaki mercan bahçesi",
          },
          {
            name: "Salt Ponds",
            description: "Geleneksel tuz işçiliği ve yerel yaşam",
          },
          {
            name: "Tulamben Beach (yakın)",
            description: "Gemi enkazları ve dalış merkezi",
          },
          {
            name: "Japanese Garden",
            description: "Deniz altı bahçesi, dalış noktası",
          },
        ],
        aktiviteler: [
          {
            name: "Dalış (PADI Sertifikalı)",
            description: "Başlangıçtan ileri seviyeye dalış kursları",
            icon: "🤿",
          },
          {
            name: "Snorkeling",
            description: "Mercan resifi ve balık gözlemleme",
            icon: "🏊",
          },
          {
            name: "Gemi Enkazı Keşfi",
            description: "Tarihi gemi enkazlarını dalış ile ziyaret",
            icon: "⚓",
          },
          {
            name: "Yoga & Meditasyon",
            description: "Sahil ortamında huzur ve rahatlama",
            icon: "🧘",
          },
          {
            name: "Balık Gözlemleme",
            description: "Deniz altı fotoğrafçılığı ve yaşamı gözlemleme",
            icon: "📷",
          },
          {
            name: "Tekne Turu",
            description: "Amed sahilinde gemi turları",
            icon: "⛵",
          },
          {
            name: "Dağ Yürüyüşü",
            description: "Agung Dağı trekking ve gün doğumu",
            icon: "🥾",
          },
          {
            name: "Spa & Masaj",
            description: "Denizkıyısında rahatlatıcı terapiler",
            icon: "💆",
          },
          {
            name: "Gece Dalışı",
            description: "Nocturnal deniz hayvanları ve ışıklı plankton",
            icon: "🌙",
          },
          {
            name: "Makro Fotoğrafçılığı",
            description: "Küçük deniz canlılarının detaylı fotoğrafları",
            icon: "📸",
          },
          {
            name: "Deniz Fotoğrafçılığı (Underwater)",
            description: "Profesyonel deniz altı fotoğrafçılığı",
            icon: "🎥",
          },
          {
            name: "Kano & Kayak",
            description: "Sakin sular ve plajlarda su sporları",
            icon: "🛶",
          },
          {
            name: "Sport Fishing",
            description: "Balık avı turları ve macera",
            icon: "🎣",
          },
          {
            name: "Deniz Biyolojisi Eğitimi",
            description: "Marine life hakkında bilgi turu",
            icon: "🐠",
          },
        ],
        yiyecekIcecekler: {
          "Yerel / Endonezya – Balinese": [
            {
              name: "Nasi Goreng",
              description: "Baharatlı kızarmış pilav",
            },
            {
              name: "Sate Ayam",
              description: "Fıstık soslu tavuk şiş",
            },
            {
              name: "Ikan Bakar",
              description: "Taze balık ızgarası",
            },
            {
              name: "Gado-Gado",
              description: "Fıstık soslu sebze salatası",
            },
            {
              name: "Perkedel",
              description: "Patates topları, altın sarısı ve çıtır",
            },
            {
              name: "Lumpia",
              description: "Kızarmış spring roll'lar",
            },
            {
              name: "Satay Lilit",
              description: "Çevirme yapılı baharatlandırılmış tavuk",
            },
            {
              name: "Uduk Udukan",
              description: "Balık şiş, taze ve ızgaralanmış",
            },
            {
              name: "Tahu Goreng",
              description: "Tofu kızartması, çıtır ve lezzetli",
            },
          ],
          "Seafood & Balık": [
            {
              name: "Taze Deniz Ürünleri",
              description: "Günün balığı ve deniz ürünleri",
            },
            {
              name: "Grilled Lobster",
              description: "Izgarada ızgaralanmış istakoz",
            },
            {
              name: "Calamari",
              description: "Mürekkep balığı kızartması",
            },
            {
              name: "Fish Soup",
              description: "Tavıya balık çorbası",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Pasta & Pizza",
              description: "İtalyan yemekleri",
            },
            {
              name: "Salata",
              description: "Taze organik sebzeler",
            },
            {
              name: "Burger & Sandviç",
              description: "Hafif ve besleyici seçenekler",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Hindistan Cevizi Suyu",
              description: "Taze ve doğal",
            },
            {
              name: "Taze Meyve Suları",
              description: "Tropik meyveler",
            },
            {
              name: "Bali Kahvesi",
              description: "Yerel kahve",
            },
            {
              name: "Smoothie Bowls",
              description: "Sağlıklı içecekler",
            },
            {
              name: "Es Jeruk (Limon Dondurmacı)",
              description: "Yerel Endonezya içeceği, tatıl ve serinletici",
            },
            {
              name: "Teh Dingin (Soğuk Çay)",
              description: "Tatlı soğuk çay, yerel tarif",
            },
            {
              name: "Jamu",
              description: "Yerel bitki çayı, turmeric ve ginger karışımı",
            },
            {
              name: "Wedang Jahe",
              description: "Geleneksel zencefilli sıcak içecek",
            },
            {
              name: "Bandrek",
              description: "Spiced ginger drink, yerel tarif",
            },
          ],
        },
        konaklama: [
          {
            name: "Denize Sıfır Boutique Oteller",
            description: "Sakin atmosfer, dalış noktalarına yakın",
          },
          {
            name: "Dalış & Snorkeling Otelleri",
            description: "Ekipman, rehber ve tekne desteği",
          },
          {
            name: "Havuzlu Villalar",
            description: "Deniz veya Agung Dağı manzaralı",
          },
          {
            name: "Eco-Lodge & Bungalovlar",
            description: "Doğayla iç içe, sade ve huzurlu",
          },
          {
            name: "Guesthouse & Pansiyonlar",
            description: "Uzun süreli ve bütçe dostu konaklama",
          },
          {
            name: "Liveaboard Dalış Tekneleri",
            description: "Tekne üzerinde konaklama, dalış turlarıyla birlikte",
          },
          {
            name: "Yoga Retreat & Wellness Otelleri",
            description: "Yoga, meditasyon ve spa ile kombine paketler",
          },
          {
            name: "Private Beach Access Villalar",
            description: "Özel plaj erişimli villalar",
          },
          {
            name: "Honeymoon & Romantic Suites",
            description: "Romantik çiftler için özel dizayn odalar",
          },
          {
            name: "Family-Friendly Resorts",
            description: "Çocuk oyun alanları ve aile aktiviteleri",
          },
          {
            name: "Budget Hostels & Backpacker",
            description: "Sosyalleşme için hosteller",
          },
          {
            name: "Glamping Sahil",
            description: "Lüks kamp deneyimi, doğa ile iç içe",
          },
          {
            name: "All-Inclusive Dalış Paketleri",
            description: "Konaklama + dalış rehberi + ekipman",
          },
        ],
        konaklamaSuresi: "3–4 gün",
        konaklamaBudgeti: "500 – 800 USD",
        alisveris: [
          {
            name: "Yerel Kahve & Baharatlar",
            description: "Kahve çekirdeği, karanfil, tarçın",
          },
          {
            name: "El Yapımı Ahşap Ürünler",
            description: "Küçük dekoratif objeler",
          },
          {
            name: "Doğal Sabun & Yağlar",
            description: "Bitkisel ve aromatik ürünler",
          },
          {
            name: "El Dokuması Tekstil Ürünleri",
            description: "Şal ve örtüler",
          },
          {
            name: "Yerel Bal & Doğal Gıdalar",
            description: "Organik bal ve yerel ürünler",
          },
          {
            name: "Doğa Temalı Hediyelikler",
            description: "Taş, bambu ve ahşap ürünler",
          },
          {
            name: "Dalış Ekipmanı & Souvenir",
            description: "Mask, fin, dalış logolu t-shirt",
          },
          {
            name: "Mercan & Deniz Canlısı Takıları",
            description: "Koleksiyonlar ve jewelry",
          },
          {
            name: "Deniz Altı Fotoğrafı Baskıları",
            description: "Profesyonel sualtı fotoları",
          },
          {
            name: "Yerel Balık Pazarı Ürünleri",
            description: "Tütsülenmiş balık, kurutulmuş deniz ürünleri",
          },
          {
            name: "Beach Wear & Swimwear",
            description: "Plaj giyim koleksiyonu",
          },
          {
            name: "Handmade Jewellery",
            description: "El yapımı takılar ve mücevherler",
          },
          {
            name: "Organic Coconut Products",
            description: "Hindistan cevizi yağı ve ürünleri",
          },
          {
            name: "Bali Artwork & Canvas",
            description: "Yerel sanatçılardan deniz temalı sanatlar",
          },
          {
            name: "Vegan & Eco-Friendly Products",
            description: "Çevreci ve doğa dostu ürünler",
          },
          {
            name: "Yoga & Wellness Accessories",
            description: "Yoga matı, meditasyon yastığı",
          },
        ],
      },
    },
    java: {
      yogyakarta: {
        name: "Yogyakarta",
        island: "Java",
        description:
          "Yogyakarta, Java'nın kültür başkenti ve eski krallık merkezi. Borobudur ve Prambanan gibi dünyaca ünlü tapınaklarıyla, geleneksel sanatlar, el işçiliği ve otantik Cava kültürünün yaşadığı bir şehir.",
        images: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=1200",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Borobudur Tapınağı",
            description:
              "UNESCO Dünya Mirası, dünyanın en büyük Budist tapınağı",
          },
          {
            name: "Prambanan Tapınağı",
            description: "Muhteşem Hindu tapınağı kompleksi",
          },
          {
            name: "Kraton (Sultan Sarayı)",
            description: "Yogyakarta Sultanlığı'nın hala kullanılan sarayı",
          },
          {
            name: "Taman Sari (Su Sarayı)",
            description: "18. yüzyıldan kalma kraliyet su bahçeleri",
          },
          {
            name: "Malioboro Caddesi",
            description: "Alışveriş ve sokak yemekleri için ünlü caddecadde",
          },
          {
            name: "Jomblang Mağarası",
            description: "Gün ışığının içeri girdiği muhteşem yeraltı mağarası",
          },
          {
            name: "Benteng Vredeburg",
            description: "Tarihî Hollanda kalesi, Gedung Agung'un karşısında bulunan kolonyal mimari örneği",
          },
          {
            name: "Kotagede",
            description: "Eski Mataram Sultanatı başkenti, geleneksel Cava mimarisi ve gümüş el sanatları",
          },
          {
            name: "Sonobudoyo Museum",
            description: "Wayang kulit, maskeleri, heykelleri, tekstilleri ve gamelan enstrümanlarını içeren Cava kültür müzesi",
          },
          {
            name: "Ullen Sentalu Museum",
            description: "Mount Merapi eteklerinde, Cava kraliyet kültürü ve yaşantısına adanmış müze",
          },
          {
            name: "Tugu Monument",
            description: "Yogyakarta'nın ikonik anıtı, Sultan Hamengkubuwono VI tarafından inşa edilmiş şehir sembolü",
          },
          {
            name: "Mount Merapi",
            description: "Yogyakarta'nın kuzeyinde yer alan aktif volkan, spektaküler manzara ve trekking imkanı",
          },
          {
            name: "Kaliurang",
            description: "Mount Merapi'nin eteklerinde, doğal manzara ve Ullen Sentalu Museum'un bulunduğu ormanlık bölge",
          },
          {
            name: "Parangtritis Beach",
            description: "Yogyakarta'nın güneyde yer alan siyah kumlu ünlü plaj, gün batımı ve okyanus manzarası",
          },
          {
            name: "Ngobaran Beach",
            description: "Gunung Kidul bölgesinde, deniz atraksiyon ve mercan resifi ile dolu doğal plaj",
          },
          {
            name: "Ngrenehan Beach",
            description: "Kayal taş tepeler arasında yer alan pitoresk plaj, balık ve deniz hayvan çeşitliliği",
          },
          {
            name: "Gesing Wonderland",
            description: "Doğal eğlence parkı, orman ve dağ manzarası içinde aktiviteler",
          },
          {
            name: "Obelix Sea View",
            description: "Gunung Kidul bölgesinde okyanus manzarası ve gün batımı izleme noktası",
          },
        ],
        aktiviteler: [
          {
            name: "Gün Doğumu Turu (Borobudur)",
            description: "Tapınakta büyüleyici gün doğumu deneyimi",
            icon: "🌅",
          },
          {
            name: "Prambanan Tapınağı Turu",
            description: "Muhteşem Hindu tapınak kompleksinin rehberli turu",
            icon: "🏛️",
          },
          {
            name: "Batik Yapımı Atölyesi",
            description: "Geleneksel batik sanatını öğrenme fırsatı",
            icon: "🎨",
          },
          {
            name: "Jeep Safari (Merapi)",
            description: "Aktif Merapi Volkanı etrafında jeep turu",
            icon: "🚙",
          },
          {
            name: "Merapi Off-Road Turu",
            description: "Mount Merapi'nin dağlık arazisinde off-road jeep macerası",
            icon: "🚙",
          },
          {
            name: "Kalasan Tapınağı Turu",
            description: "Prambanan'a gidişte yer alan küçük Budist tapınak kompleksi ziyareti",
            icon: "🏛️",
          },
          {
            name: "Ratu Boko Sarayı Turu",
            description: "Prambanan'ın 2 km güneyinde yer alan antik kraliyet sarayı kompleksi",
            icon: "🏰",
          },
          {
            name: "Hayvanat Bahçesi Gezisi",
            description: "Yogyakarta hayvanatı ve hayvan türlerinin görüldüğü bahçe",
            icon: "🦁",
          },
          {
            name: "Ramayana Balesi",
            description: "Prambanan'da geleneksel dans gösterisi",
            icon: "💃",
          },
          {
            name: "Cave Tubing",
            description: "Gua Pindul'da lastik botla mağara gezisi",
            icon: "🏊",
          },
          {
            name: "Bisiklet ile Köy Turu",
            description: "Geleneksel köylerde bisiklet gezisi",
            icon: "🚴",
          },
        ],
        yiyecekIcecekler: [
          {
            name: "Gudeg",
            description: "Genç jackfruit ile yapılan tatlı geleneksel yemek, tavuk ve yumurta ile servis",
          },
          {
            name: "Ayam Goreng Mbok Berek",
            description: "Ünlü kızarmış tavuk, özel baharatlarla",
          },
          {
            name: "Bakpia",
            description: "Tatlı fasulyeli geleneksel pasta",
          },
          {
            name: "Angkringan",
            description: "Sokak yemekleri sepet menüsü, kopi ve hafif atıştırmalıklar",
          },
          {
            name: "Wedang Ronde",
            description: "Tatlı zencefilli sıcak içecek",
          },
          {
            name: "Soto Yogyakarta",
            description: "Zencefirli geleneksel sos ile yapılmış sığır eti çorbası",
          },
          {
            name: "Nasi Langgi (Sego Langgi)",
            description: "Çeşitli yan yemekler ile servis edilen sıcak pirinç",
          },
          {
            name: "Kipo",
            description: "Tatlı hindistancevizi ile doldurulmuş yeşil maniok pastası",
          },
          {
            name: "Jadah Tempe",
            description: "Pirinç pastası ve tatlı tempeh sanviçi",
          },
          {
            name: "Es Rujak",
            description: "Manga, papaya, elma, ananas ve salatalık ile yapılan meyveli salata",
          },
          {
            name: "Kopi Joss",
            description: "Kızgın kömür düşürülerek ısıtılan güçlü Cava kahvesi",
          },
          {
            name: "Sate Klathak",
            description: "Keçi etinden yapılan geleneksel şiş kebap",
          },
          {
            name: "Pizza",
            description: "İtalyan tarzı, taze malzemelerle yapılan pizza",
          },
          {
            name: "Hamburger",
            description: "Yumuşak ekmekte sarılı, lezzetli hamburger",
          },
        ],
        turkYemekleri: [
          {
            name: "Türk Restoranları",
            description: "Yogyakarta'nın çeşitli bölgelerinde (Kotagede, Caturtunggal, Cik Di Tiro vb.) Türk mutfağı sunulan restoranlar bulunmaktadır. Istanbul Kebab Turki, Kebab Turkiyem ve Kebab Baba Rafi gibi zincir dükkanlar döner, kebap ve Türk tarzı yemek sunar.",
          },
        ],
        konaklama: [
          {
            name: "3 Yıldızlı Oteller",
            description: "Malioboro ve Kraton çevresinde, temiz, ekonomik, gezilecek yerlere yakın konaklama seçenekleri",
          },
          {
            name: "4 Yıldızlı Oteller",
            description: "Havuzlu, spa hizmetleri, aile ve çiftler için ideal konforu sağlayan oteller",
          },
          {
            name: "5 Yıldızlı Oteller",
            description: "Lüks resort ve şehir otelleri, geniş bahçeler, spa & wellness alanları, yüksek hizmet kalitesi",
          },
          {
            name: "Butik & Heritage Oteller",
            description: "Geleneksel Cava mimarisi, tarihi binaların otele dönüştürülmüş versiyonları, kültürel deneyim",
          },
          {
            name: "Hosteller & Guesthouse'lar",
            description: "Backpacker ve genç gezginler için uygun fiyatlı seçenekler, sosyal ortam ve yerel deneyim",
          },
          {
            name: "Havuzlu Lüks Villalar",
            description: "Özel tasarımlı, özel havuzları olan yüksek konforlu villalar, aile grupları için ideal",
          },
        ],
        oneriBudge: {
          sure: "3 – 4 gün",
          butce: "450 – 800 USD (konaklama + yeme-içme + geziler + aktiviteler)",
        },
        alisveris: [
          {
            name: "Malioboro Caddesi",
            description: "Yogyakarta'nın en ünlü caddesi, batik tekstil, el sanatları ve turist hatırası ürünlerinin satıldığı uzun sokak",
          },
          {
            name: "Beringharjo Market",
            description: "Geleneksel Jawa pazarı, batik, tekstil ve yerel ürünlerin el ele geçirilebildiği canlı pazar",
          },
          {
            name: "Yogyakarta Batik Center",
            description: "Geleneksel batik boyama atölyesi ve mağazası, ziyaretçiler üretim sürecini görebilir ve ürün satın alabilir",
          },
          {
            name: "Borobudur Craft Market",
            description: "Borobudur tapınağı yakınında, hediyelik eşyalar, takılar ve el sanatlarının satıldığı pazar",
          },
          {
            name: "Matahari Department Store",
            description: "Yogyakarta'da yer alan modern alışveriş merkezi, uluslararası markalar ve yerel ürünler bulundurur",
          },
          {
            name: "Pasar Ngasem",
            description: "Günlük eşyalar, geleneksel atıştırmalıklar ve hediyelik eşyaların satıldığı pazar",
          },
          {
            name: "Malioboro Mall",
            description: "Yogyakarta'nın en prestijli alışveriş merkezi, Matahari mağazası, Periplus kitapçısı ve uluslararası fast food zincirlerini içerir",
          },
          {
            name: "Galleria Mall",
            description: "Matahari mağazası tarafından ankre edilen kompakt alışveriş merkezi, yiyecek kotu ve gençlerin tercih ettiği restoranlar",
          },
          {
            name: "Kotagede",
            description: "Eski Mataram başkenti, gümüş el sanatları ve geleneksel Cava mimarisi ile ünlü alışveriş bölgesi",
          },
          {
            name: "Hamzah Batik (Mirota Batik)",
            description: "Büyük aile işletmesi mağazası, Yogyakarta ve Endonezya'nın çeşitli bölgelerinden el sanatları ve batik ürünleri",
          },
          {
            name: "Tjokrosuharto",
            description: "1954'ten beri faaliyet gösteren el sanatları mağazası, wayang kulit, wayang golek, batik, keris ve geleneksel Cava ürünleri",
          },
        ],
      },
      pangandaran: {
        name: "Pangandaran",
        island: "Java",
        description:
          "Pangandaran, Java'nın güney sahilinde yer alan sakin ve doğal güzellikleriyle ünlü bir sahil kasabası. Temiz plajları, mercan resifler, dalış noktaları ve yeşil ormanlarıyla doğa severlerin cenneti. Turizm baskısından uzak, otantik Jawa deneyimi.",
        images: [
          getImageUrl("https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&w=1200", 'java-pangandaran-img0'),
          getImageUrl("https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-pangandaran-img1'),
          getImageUrl("https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-pangandaran-img2'),
          getImageUrl("https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-pangandaran-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Pangandaran Beach",
            description: "Uzun kum sahili, yüzme ve güneşlenme için ideal",
          },
          {
            name: "Pangandaran National Park",
            description: "Deniz koruma alanı, mercan resifi, balık çeşitliliği ve Monkey Beach (maymunlar)",
          },
          {
            name: "Citumang",
            description: "Kayalar arasından akan dere, yürüyüş ve doğa deneyimi",
          },
          {
            name: "Green Canyon",
            description: "Yeşil dere, kanyon kayalıkları ve trekking",
          },
          {
            name: "Batu Karas Beach",
            description: "Sakin ve temiz plaj, snorkeling ve dalış",
          },
          {
            name: "Pangandaran Aquarium",
            description: "Deniz yaşamı, akvaryum ve deniz eğitim merkezi",
          },
          {
            name: "Batu Hue",
            description: "Kayalık oluşum ve plaj noktası, manzara",
          },
          {
            name: "Banyu Tibo Waterfall",
            description: "Üç katlı şelale, doğa yürüyüşü",
          },
          {
            name: "Cigamea Beach",
            description: "Uzun ve temiz plaj",
          },
          {
            name: "Puncak Batu Karas",
            description: "Tepe manzarası, gün batımı",
          },
          {
            name: "Grotto Beach",
            description: "Mağara plajı, trekking",
          },
          {
            name: "Kampung Nelayan (Fisher Village)",
            description: "Balıkçı köyü, otantik yaşam",
          },
          {
            name: "Pasir Putih Beach",
            description: "Beyaz kum sahili",
          },
          {
            name: "Bukit Panenjoan Viewpoint",
            description: "Panoramik manzara noktası",
          },
        ],
        aktiviteler: [
          {
            name: "Dalış (PADI Sertifikalı)",
            description: "Başlangıçtan ileri seviyeye dalış kursları",
            icon: "🤿",
          },
          {
            name: "Snorkeling",
            description: "Mercan resifi ve balık gözlemleme",
            icon: "🏊",
          },
          {
            name: "Kano & Kayak",
            description: "Green Canyon'da kano turu",
            icon: "🛶",
          },
          {
            name: "Doğa Yürüyüşü",
            description: "Orman ve dağ trekking rotaları",
            icon: "🥾",
          },
          {
            name: "Balık Gözlemleme",
            description: "Sualtı fotoğrafçılığı ve yaşamı gözlemleme",
            icon: "📷",
          },
          {
            name: "Gün Batımı Teknesi",
            description: "Denizde gün batımı izleme",
            icon: "⛵",
          },
          {
            name: "Spa & Masaj",
            description: "Doğal sıcak su ve rahatlatıcı terapiler",
            icon: "💆",
          },
          {
            name: "Yerel Köy Ziyareti",
            description: "Geleneksel Jawa yaşamını tanıma",
            icon: "🏘️",
          },
          {
            name: "Deniz Altı Fotoğrafçılığı",
            description: "Profesyonel underwater fotoğraflar",
            icon: "📸",
          },
          {
            name: "Doğa Fotoğrafçılığı",
            description: "Şelaleler, plajlar ve manzaralar",
            icon: "📷",
          },
          {
            name: "Şelale Yürüyüşü",
            description: "Banyu Tibo ve Cihara şelalelerine trekking",
            icon: "💧",
          },
          {
            name: "ATV & Dağ Bisikleti",
            description: "Engebeli alanlar ve off-road macera",
            icon: "🚙",
          },
          {
            name: "Citumang Body Rafting",
            description: "Kayalar arasında suya dalarak yüzme macerası",
            icon: "🏊",
          },
          {
            name: "Ulusal Park Gezisi",
            description: "Taman Nasional Pangandaran'da rehberli tur",
            icon: "🌳",
          },
          {
            name: "Jet Ski",
            description: "Hızlı ve heyecanlı deniz sporları",
            icon: "🚤",
          },
          {
            name: "Banana Boat",
            description: "Grup halinde şişme teknede su sporları",
            icon: "🛥️",
          },
        ],
        yiyecekIcecekler: {
          "Yerel / Jawa – Endonezya": [
            {
              name: "Nasi Goreng",
              description: "Baharatlı kızarmış pilav",
            },
            {
              name: "Soto Ayam",
              description: "Baharatlı tavuk çorbası",
            },
            {
              name: "Bakso",
              description: "Et köfte çorbası - tüm Endonezya'da bulunan klasik yemek",
            },
            {
              name: "Soto Java",
              description: "Java adasının her yerinde bulunan geleneksel çorba",
            },
            {
              name: "Gado-Gado",
              description: "Fıstık soslu sebze salatası",
            },
            {
              name: "Cuanki",
              description: "Patates ve tahu köftelerinin içinde bulunduğu peçete - Pangandaran'ın popüler sokak yemeği",
            },
            {
              name: "Perkedel",
              description: "Patates topları",
            },
            {
              name: "Sate Ayam",
              description: "Fıstık soslu tavuk şiş",
            },
          ],
          "Seafood & Balık": [
            {
              name: "Taze Deniz Ürünleri",
              description: "Günün balığı ve deniz ürünleri",
            },
            {
              name: "Grilled Fish",
              description: "Izgarada ızgaralanmış taze balık",
            },
            {
              name: "Shrimp & Calamari",
              description: "Karides ve mürekkep balığı",
            },
            {
              name: "Fish Soup",
              description: "Tavıya balık çorbası",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Pizza",
              description: "İtalyan pizzası - turist restoranlarında mevcût",
            },
            {
              name: "Chicken Burger",
              description: "Tavuk burgeri - yaygın seçenek",
            },
            {
              name: "Cheese Burger",
              description: "Peynirli burger - popüler seçenek",
            },
            {
              name: "Salata",
              description: "Taze organik sebzeler",
            },
            {
              name: "Sandviç",
              description: "Hafif ve besleyici seçenekler",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Hindistan Cevizi Suyu",
              description: "Taze ve doğal",
            },
            {
              name: "Taze Meyve Suları",
              description: "Mango, papaya, ananas",
            },
            {
              name: "Java Kahvesi",
              description: "Yerel kahve",
            },
            {
              name: "Smoothie Bowls",
              description: "Sağlıklı içecekler",
            },
            {
              name: "Es Cendol",
              description: "Yeşil noodles, hindistan cevizi sütü ve kahverengi şeker şurubundan yapılan tatlı tropikal içecek",
            },
            {
              name: "Jamu",
              description: "Geleneksel bitki içeceği, terapötik ve sağlık faydaları olan doğal içecek",
            },
            {
              name: "Es Jeruk",
              description: "Portakal ve limon limonata, serinletici ve taze",
            },
            {
              name: "Bandrek",
              description: "Zencefil ve baharat çayı, sıcak ve rahatlatıcı",
            },
          ],
        },
        konaklama: [
          {
            name: "Denize Yakın Boutique Oteller",
            description: "Sakin atmosfer, plaja yürüme mesafesinde",
          },
          {
            name: "Bungalov & Beach Huts",
            description: "Basit ama rahat, doğa ile iç içe konaklama",
          },
          {
            name: "Havuzlu Villalar",
            description: "Deniz veya orman manzaralı özel alanlar",
          },
          {
            name: "Guesthouse & Pansiyonlar",
            description: "Bütçe dostu ve uzun süreli konaklama",
          },
          {
            name: "Eco-Friendly Resorts",
            description: "Doğa dostu, sürdürülebilir konaklama",
          },
        ],
        konaklamaSuresi: "2–3 gün",
        konaklamaBudgeti: "400 – 700 USD",
        turkyemekleriNotu: "Pangandaran'da geleneksel Türk yemekleri bulunmamaktadır. Bölgede Endonezya usulü yerel yemekler (Nasi Goreng, Bakso, Cuanki, Sate Ayam vb.) ve seafood ana yiyeceklerdir.",
        alisveris: [
          {
            name: "Yerel Balık Pazarı",
            description: "Tütsülenmiş balık ve kurutulmuş deniz ürünleri",
          },
          {
            name: "Pangandaran Baskılı Kıyafet Mağazaları",
            description: "Pangandaran baskılı tişörtler, şortlar, pantolonlar ve eşofmanlar",
          },
          {
            name: "Handmade Crafts",
            description: "El yapımı ahşap ve dokuma ürünleri",
          },
          {
            name: "Yerel Kahve & Baharatlar",
            description: "Organik kahve ve yerel baharatlar",
          },
          {
            name: "Beach Wear & Swimwear",
            description: "Plaj giyim koleksiyonu",
          },
          {
            name: "Yerel Sanat & Hediyelikler",
            description: "Sanatçılardan resim ve dekorasyon",
          },
          {
            name: "Natural & Organic Products",
            description: "Doğal sabunlar, yağlar ve güzellik ürünleri",
          },
        ],
      },
      malang: {
        name: "Malang",
        island: "Java",
        description:
          "Malang, Doğu Java'nın tarihi şehri. Bromo Tengger Semeru Ulusal Parkı'na 60-65 km mesafede, gün doğumu ve volkan trekking için ideal başlangıç noktası. Serin iklim, kolonyal mimari ve yerel lezzetleriyle ünlü.",
        images: [
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=1200", 'java-malang-img0'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-malang-img1'),
          getImageUrl("https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-malang-img2'),
          getImageUrl("https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-malang-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Bromo Tengger Semeru Ulusal Parkı",
            description: "Aktif volkan, gün doğumu manzarası ve 'Kum Denizi', Malang'dan 60-65 km uzak",
          },
          {
            name: "Ijen Boulevard",
            description: "Tarihi kolonyal caddesi, bouganvillea çiçekleri ve eski yapılar",
          },
          {
            name: "Jodipan Colorful Village",
            description: "Renkli boyalı evler, Instagram-uyumlu köy ve cam köprü",
          },
          {
            name: "Singosari Temple",
            description: "1300 AD'den kalma Hindu tapınağı, 12 km kuzeyinde",
          },
          {
            name: "Balekambang Beach",
            description: "Malang'ın güneyinde siyah kumlu plaj",
          },
          {
            name: "Malang Night Paradise (Dino Park)",
            description: "Gece eğlence parkı, dinosaur replikaları ve tema parklar",
          },
          {
            name: "Candi Jago",
            description: "13. yüzyıldan kalma Hindu tapınağı, Singosari yakınında",
          },
          {
            name: "Candi Kidal",
            description: "13. yüzyıldan kalma Hindu tapınağı, Singosari temple bölgesinde",
          },
        ],
        aktiviteler: [
          {
            name: "Bromo Gün Doğumu Turu",
            description: "Erken sabah Cemoro Lawang'dan çıkış, hafta sonu paket turlar mevcut",
            icon: "🌅",
          },
          {
            name: "Bromo Trekking",
            description: "Kum denizini yürü, volkan kenarına tırmandı, profesyonel rehber önerilir",
            icon: "🥾",
          },
          {
            name: "Jeep Safari (Bromo)",
            description: "Bromo alanında jeep turları, kum denizi ve dağ manzarası",
            icon: "🚙",
          },
          {
            name: "Motorbike Rental (DIY)",
            description: "Kendi motorbike ile Bromo'ya gitme, 2-3 saat sürüş (ileri seviyeliler için)",
            icon: "🏍️",
          },
          {
            name: "Doğa Yürüyüşü",
            description: "Çevre dağları ve tarla yürüyüşleri",
            icon: "🥾",
          },
          {
            name: "Spa & Masaj",
            description: "Malang şehrinde rahatlatıcı terapiler",
            icon: "💆",
          },
          {
            name: "Sanggar Senaputra - Doğu Java Dansları",
            description: "Geleneksel Doğu Java dans performansları ve sanat atölyesi",
            icon: "💃",
          },
          {
            name: "Ken Dedes Antik Havuzları",
            description: "Singosari krallığından kalan antik banyo havuzları ve heykeller, Singosari Temple yakınında",
            icon: "🏛️",
          },
          {
            name: "Dağ Tırmanışı",
            description: "Mount Panderman, Mount Arjuna ve çevre dağlarına tırmanma turları",
            icon: "⛰️",
          },
          {
            name: "Golf Oyunu",
            description: "Mount Arjuna manzaralı profesyonel golf sahası",
            icon: "⛳",
          },
          {
            name: "Balekambang Beach - Yüzme",
            description: "Malang'ın güneyinde siyah kumlu plajda yüzme ve plaj aktiviteleri",
            icon: "🏖️",
          },
          {
            name: "Hindu Tapınak Turları",
            description: "Singosari, Jago, Kidal tapınaklarının eksiksiz turları ve tarihi bilgisi",
            icon: "🏯",
          },
        ],
        yiyecekIcecekler: {
          "Yerel / Jawa – Endonezya": [
            {
              name: "Bakso Malang",
              description: "Malang'ın meşhur köfte çorbası, çiğ ve ızgara versiyonları var",
            },
            {
              name: "Ayam Goreng Kampung",
              description: "Köy tavuğu kızartması, ince ve lezzetli",
            },
            {
              name: "Cwie Mie",
              description: "Malang'ın özel noodle yemeği",
            },
            {
              name: "Orem-orem",
              description: "Tempeh, haşlanmış yumurta ve tavuk, hindistan cevizi sütü içinde",
            },
            {
              name: "Jagung Bakar",
              description: "Izgara mısır, sokak satıcılarında taze",
            },
            {
              name: "Nasi Goreng",
              description: "Baharatlı kızarmış pilav",
            },
          ],
          "Türk Mutfağı": [
            {
              name: "Izgara Etler",
              description: "Izgara tavuk, kuzu şiş, biftek ve et mezeler, Malang'daki Türk restoranlarında yapılır",
            },
            {
              name: "Pide",
              description: "Geleneksel Türk pide çeşitleri, kaymak, kıyma, peynir dolulu",
            },
            {
              name: "Lahmacun",
              description: "Türk 'pizza'sı, kıymali ve baharatlı",
            },
            {
              name: "Orta Doğu Mezeler",
              description: "Humus, baba ghanoush, falafel gibi tradisyonel mezeler",
            },
            {
              name: "Baklava & Türk Tatlıları",
              description: "Fistık baklava, künefe, lokma gibi geleneksel tatlılar",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Signora Pasta",
              description: "İtalyan pasta, İtalyan şef",
            },
            {
              name: "Chefkim",
              description: "Kore yemekleri",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Kopi Jahe",
              description: "Zencefilli kahve, güçlü ve lezzetli",
            },
            {
              name: "Taze Meyve Suları",
              description: "Elma ve tropikal meyveler",
            },
            {
              name: "Apel Malang",
              description: "Malang'ın ünlü yeşil elması, çok taze",
            },
            {
              name: "Tropikal Milk Shake'ler",
              description: "Mango shake, strawberry shake, avocado shake - taze tropik meyvelerle yapılmış",
            },
            {
              name: "Boba Tea / Bubble Tea",
              description: "Çay tabanlı modern içecek, perle tapioka topları içeren",
            },
            {
              name: "Es Campur",
              description: "Karışık donmuş tatlı içecek, meyveler ve şirople doldurulmuş",
            },
            {
              name: "Coconut Water",
              description: "Taze hindistan cevizi suyu, doğal ve serinletici",
            },
          ],
        },
        konaklama: [
          {
            name: "Budget Hostels",
            description: "Kampong Tourist (Hotel Helios çatısında), Pondok Backpacker, Kavie Hostel - backpacker severler",
          },
          {
            name: "Ekonomik Oteller",
            description: "Hotel Helios, Hotel Palem 2 - merkezi konum, temiz ve basit",
          },
          {
            name: "Mid-Range Oteller",
            description: "Hotel Pelangi, Regent's Park Hotel (100 odalı modern otel)",
          },
          {
            name: "Boutique & Karakteristik Oteller",
            description: "The Shalimar Boutique (restore edilmiş kolonyal bina, 1930'lardan)",
          },
          {
            name: "Lüks Oteller",
            description: "Tugu Hotel, kolonyal tasarım ve antika dekorasyonlu lüks otel",
          },
        ],
        konaklamaSuresi: "1–2 gün",
        konaklamaBudgeti: "400 – 600 USD",
        alisveris: [
          {
            name: "Ijen Boulevard Market",
            description: "Pazar günü geleneksel pazarı",
          },
          {
            name: "Malang Town Square (Matos)",
            description: "Modern alışveriş merkezi, sinema ve eğlence bölümleri",
          },
          {
            name: "Soekarno Hatta Boulevard",
            description: "Malang'ın yeni alışveriş, yemek ve eğlence merkezi, trendyçi kafeler ve restoranlar",
          },
          {
            name: "Mall Olympic Garden (MOG)",
            description: "Büyük alışveriş merkezi, tanınmış fashion markaları ve retail mağazaları",
          },
          {
            name: "Batik Keris",
            description: "Yerel tekstil ve el sanatları",
          },
          {
            name: "Apel Malang Ürünleri",
            description: "Taze elma ve elma işlenmiş ürünleri",
          },
          {
            name: "Fabulous Spa & Salon",
            description: "Profesyonel masaj, spa tedavileri, Balinese masaj ve saç hizmetleri",
          },
        ],
      },
      banyuwangi: {
        name: "Banyuwangi",
        island: "Java",
        description:
          "Banyuwangi, Java'nın doğu uçunda yer alan kapı şehridir. Kawah Ijen'e 30-40 km mesafede, mavi alev fenomeni ve sülfür havuzuyla ünlü. Baluran Milli Parkı, Red Island Beach dalış ve G-Land sörf spotu yakındadır.",
        images: [
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=1200", 'java-banyuwangi-img0'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-banyuwangi-img1'),
          getImageUrl("https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-banyuwangi-img2'),
          getImageUrl("https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-banyuwangi-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Kawah Ijen (Ijen Crater)",
            description: "Mavi alev fenomeni, sülfür madeni ve gölü, 30-40 km uzak, gün doğumu trekking ideal",
          },
          {
            name: "Red Island Beach",
            description: "Kırmızı kumlu plaj, dalış ve snorkeling parasıtı",
          },
          {
            name: "Bangsring Underwater",
            description: "Yarı yapay snorkeling alanı, yoğun mercan ve balık yaşamı, giriş 5000 Rp",
          },
          {
            name: "Baluran Milli Parkı",
            description: "Çayır, orman ve kıyı parkı, ıssız plajlar ve vahşi yaşam",
          },
          {
            name: "Alas Purwo Milli Parkı",
            description: "Uzak ve ıssız doğa parkı, Jawa'nın en eski tapınakları",
          },
          {
            name: "G-Land (Grajagan Beach)",
            description: "Dünya ünlü sörf spotları, ileri seviye sörf alanları",
          },
          {
            name: "Taman Blambangan Park",
            description: "Şehir merkezinde doğal park, gece pazarları ve sokak yemekleri, yerli kültür",
          },
          {
            name: "Gallery & Museum Mozes Misdy",
            description: "Ünlü Java sanat açısından Mozes Misdy'nin modern sanat galerisi, Ketapang Limanında",
          },
          {
            name: "Gandrung Seni Gösterileri",
            description: "Banyuwangi'nin ikonik dansı, pirinç tanrıçası Dewi Sri'ye dua sahnesi, belirli günlerde yapılır",
          },
        ],
        aktiviteler: [
          {
            name: "Kawah Ijen Mavi Alev Turu",
            description: "Gece çıkışı, 2-3 saatlik trekking, mavi alev ve gün doğumu manzarası",
            icon: "🔵",
          },
          {
            name: "Kawah Ijen Trekking",
            description: "Erken sabah çıkışı, sülfür havuzu ve kum denizi keşfi",
            icon: "🥾",
          },
          {
            name: "Dalış ve Snorkeling",
            description: "Bangsring ve Red Island Beach'te mercan ve balık yaşamı",
            icon: "🤿",
          },
          {
            name: "Sörf",
            description: "G-Land'da ileri seviye sörf veya başlangıç seviye alanları",
            icon: "🏄",
          },
          {
            name: "Doğa Yürüyüşü",
            description: "Baluran ve Alas Purwo milli parkları keşfi",
            icon: "🥾",
          },
          {
            name: "Bali Feribot Geçişi",
            description: "Gilimanuk'a 45 dakikalık feribot, Bali'ye erişim",
            icon: "⛴️",
          },
          {
            name: "Red Island Beach Dalış & Sörf",
            description: "Kırmızı kumlu plajda dalış, snorkeling ve sörf faaliyetleri",
            icon: "🌊",
          },
          {
            name: "Gandrung Dansı Gösterisi",
            description: "Banyuwangi'nin ikonik sanat formu, pirinç tanrıçası Dewi Sri'ye dua, turist bilgilendirme merkezi aracılığıyla",
            icon: "💃",
          },
          {
            name: "Kopi Ijen Plantasyonu Turu",
            description: "Ijen Plateau'dan gelen kahve plantasyonları ziyareti ve tattoo yönetimi",
            icon: "☕",
          },
        ],
        yiyecekIcecekler: {
          "Yerel Banyuwangi Yemekleri": [
            {
              name: "Rujak Soto",
              description: "Banyuwangi'nin özel yemeği, baharatlı çorbada sebzeler",
            },
            {
              name: "Pecel Rawon",
              description: "Siyah et çorbası (rawon) sebze salatası (pecel)",
            },
            {
              name: "Sego Tempong",
              description: "Baharatlı pilavla beraber dilimleme tavuk",
            },
            {
              name: "Nasi Cawuk",
              description: "Özel baharatlanmış pilav, Banyuwangi spesiyalliği",
            },
            {
              name: "Onde-onde",
              description: "Susam kaplı tatlı toplar, feribot limanında sokak satıcıları",
            },
            {
              name: "Uyah Asem",
              description: "Banyuwangi'nin meşhur yemeği, tuzlu ve ekşi tadında, lokomotif salatası",
            },
            {
              name: "Pecel Pitik",
              description: "Tavuk pecel salatası, Banyuwangi stilinde baharatlandırılmış",
            },
          ],
          "Endonezya Mutfağı": [
            {
              name: "Nasi Goreng",
              description: "Baharatlı kızarmış pilav",
            },
            {
              name: "Ayam Goreng Kampung",
              description: "Köy tavuğu kızartması, çıtır ve lezzetli",
            },
            {
              name: "Sate Ayam",
              description: "Baharlı ızgara tavuk şiş, erdirme sos",
            },
            {
              name: "Gado-Gado",
              description: "Sebze salatası, fıstık soslu",
            },
          ],
          "Deniz Ürünleri & Balık": [
            {
              name: "Taze Deniz Ürünleri",
              description: "Günlük yakalanan balık, karides ve kabuklu deniz ürünleri",
            },
            {
              name: "Grilled Fish",
              description: "Tütsülenmiş ve ızgara balık",
            },
            {
              name: "Seafood Soup",
              description: "Balık ve deniz ürünü çorbası",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Kopi Ijen",
              description: "Ijen Plateau'dan gelen özel kahve, lokal kafelerde",
            },
            {
              name: "Tropikal Meyve Suları",
              description: "Mango, papaya, ananas, markisa, jambu gibi tropikal meyvelerden taze sıkılmış suyu",
            },
            {
              name: "Jamu",
              description: "Geleneksel endonez herbal içecek",
            },
            {
              name: "Es Cendol",
              description: "Hindistan cevizi sütü ve yeşil nişasta jeli içecek",
            },
          ],
        },
        konaklama: [
          {
            name: "Bütçe Otelleri",
            description: "Ketapang Limanı yakınında ve şehir merkezinde bütçe seçenekleri",
          },
          {
            name: "Orta Kademe Otelleri",
            description: "Hotel Blambangan (restore edilmiş kolonyal yapı), Ketapang Indah Waterfront",
          },
          {
            name: "Kawah Ijen Trekking Konaklama",
            description: "Gece trekki için Cemoro Lawang kasabasında dağ konaklaması",
          },
        ],
        konaklamaSuresi: "1–2 gün",
        konaklamaBudgeti: "500 – 700 USD",
        alisveris: [
          {
            name: "Taman Blambangan Park",
            description: "Şehir parkı etrafında gece pazarları ve warungs, sokak yemekleri ve yerel ürünler",
          },
          {
            name: "Brawijaya Bus Terminal Pazarı",
            description: "Otobüs terminalinin yakınındaki yerel pazar, tekstil ve günlük ihtiyaçlar",
          },
          {
            name: "Gallery & Museum Mozes Misdy",
            description: "Yerel Jawa sanatçısının resim ve heykeltaş galerisi, satın alma mümkün",
          },
          {
            name: "Yerel El Sanatları Dükkanları",
            description: "Batik tekstil ve geleneksel el sanatları, Ketapang bölgesinde",
          },
          {
            name: "Balık & Deniz Ürünleri Pazarları",
            description: "Ketapang Limanı yakınında günlük taze balık ve deniz ürünleri pazarı",
          },
          {
            name: "Kopi Ijen Plantasyonu Ürünleri",
            description: "Ijen Plateau'dan gelen özel kahve çeşitleri ve yerel kuru yemişler",
          },
        ],
      },
      bandung: {
        name: "Bandung",
        island: "Java",
        description:
          "Bandung, 'Paris van Java' lakabıyla bilinen serin dağ şehridir. Tangkuban Perahu volkanı, Kawah Putih krater gölü ve çay bahçeleriyle ünlüdür. Outlet alışveriş, Art Deco mimarisi ve lezzetli Sundanese mutfağı bulunmaktadır.",
        images: [
          getImageUrl("https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=1200", 'java-bandung-img0'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-bandung-img1'),
          getImageUrl("https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-bandung-img2'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'java-bandung-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Tangkuban Perahu Volkanı",
            description: "Aktif volkan, 20 km kuzeyde, krater yürüyüşü ve volkanik manzara",
          },
          {
            name: "Kawah Putih (Beyaz Krater Gölü)",
            description: "40 km güneyde, turquoise krater gölü, doğa yürüyüşü ve fotoğraf çekimi",
          },
          {
            name: "Situ Patengan (Patengang Lake)",
            description: "Göl manzarası, bot turları, çay bahçeleri, doğa yürüyüşü, bambu ormanları",
          },
          {
            name: "Rengganis Hot Springs & Long Suspension Bridge",
            description: "Uzun asma köprü yürüyüşü, fotoğraf noktası, termal kaplıcalar ve spa deneyimi",
          },
          {
            name: "Dusun Bambu Lembang",
            description: "Doğa yürüyüşü, restoran ve piknik alanı, bambu bahçeleri",
          },
          {
            name: "Tebing Keraton",
            description: "Orman ve şehir manzarası, gün doğumu izleme noktası",
          },
          {
            name: "Ciwidey Strawberry Fields & Ranca Upas",
            description: "Çilek bahçesi, safari park, kamp alanı, geyik gözlemciliği",
          },
          {
            name: "Floating Market Lembang",
            description: "Alışveriş ve yerel yiyecek deneyimi, tekne turları",
          },
          {
            name: "Saung Angklung Udjo",
            description: "Geleneksel Sundanese müzik ve dans gösterisi, angklung enstrümanları",
          },
          {
            name: "Braga Street",
            description: "Kafe ve galeri turu, tarihi şehir yürüyüşü, Art Deco binalar",
          },
          {
            name: "Farmhouse Lembang",
            description: "Avrupa temalı köy, fotoğraf çekimi, çocuk aktiviteleri",
          },
          {
            name: "Alun-alun (Şehir Meydanı)",
            description: "Tarihi merkez meydanı, iki kutsal kuyunun yanında, ağaçlarla çevrili",
          },
          {
            name: "Masjid Raya Bandung (Cuma Camii)",
            description: "Alun-alun'da, 81 metre yüksekliğinde minareler, Cuma günleri minareye ziyaret",
          },
          {
            name: "Gedung Merdeka",
            description: "1955 Asya-Afrika Konferansı gerçekleşen tarihi bina, müze, Art Deco mimarisi",
          },
          {
            name: "Museum Geologi (Geological Museum)",
            description: "250,000 kaya, mineral koleksiyonu, 60,000 fosil, Dago bölgesinde",
          },
          {
            name: "Djuanda Orman Parkı",
            description: "Dago bölgesinde orman parkı, botanik bahçesi, İkinci Dünya Savaşı mağaraları",
          },
          {
            name: "Savoy Homann Otel",
            description: "Art Deco mimarinin ünlü örneği, 1920ler, tarihi otel binası",
          },
        ],
        aktiviteler: [
          {
            name: "Volkan Trekking",
            description: "Tangkuban Perahu volkanında krater yürüyüşü ve manzara keşfi",
            icon: "🥾",
          },
          {
            name: "Gün Doğumu İzleme",
            description: "Tebing Keraton veya Tangkuban Perahu'dan gün doğumunu seyrederek fotoğraf çekimi",
            icon: "🌅",
          },
          {
            name: "Fotoğraf Turları",
            description: "Floating Market, Farmhouse Lembang, Kawah Putih, Situ Patengan'da profesyonel fotoğraf oturumları",
            icon: "📷",
          },
          {
            name: "Sundanese Müzik & Dans Gösterisi",
            description: "Saung Angklung Udjo'da geleneksel Sundanese müzik ve angklung enstrümanları",
            icon: "🎵",
          },
          {
            name: "Sıcak Kaynaklar & Spa",
            description: "Rengganis ve Ciater'deki termal kaplıcalarda relaksasyon ve terapi",
            icon: "♨️",
          },
          {
            name: "Doğa Yürüyüşü",
            description: "Djuanda Orman Parkı, Ranca Upas, Situ Patengan'da orman ve göl kenarı yürüyüşü",
            icon: "🌲",
          },
          {
            name: "Asma Köprü Yürüyüşü",
            description: "Rengganis'teki uzun asma köprüde yüksekte yürüyüş ve doğa deneyimi",
            icon: "🌉",
          },
          {
            name: "Çay & Çilek Bahçesi Ziyareti",
            description: "Situ Patengan çay bahçeleri, Ciwidey çilek tarlalarında bahçe turu ve toplama",
            icon: "🌾",
          },
          {
            name: "Müze Turları",
            description: "Geological Museum (250,000 kaya ve fosil), Asya-Afrika Konferans Müzesi, Sanat Galerileri",
            icon: "🏛️",
          },
          {
            name: "Pazar Pazarları & Car-Free Day",
            description: "Gasibu'da Pazar Pazarı, Jalan Dago'da araç yokluğunda pazar günü etkinlikleri",
            icon: "🛍️",
          },
        ],
        yiyecekIcecekler: {
          "Sundanese Mutfağı": [
            {
              name: "Siomay (Bakso Tahu)",
              description: "Buğulanan et tofu, yer fıstığı soslu, Bandung'un ünlü yemeği",
            },
            {
              name: "Soto Bandung",
              description: "Sığır etli çorba, soya fasulyesi, sebzeler",
            },
            {
              name: "Laksa Bandung",
              description: "Hindistan cevizi sütlü tavuk çorbası, pirinç keki",
            },
            {
              name: "Lotek",
              description: "Haşlanmış sebze salatası, yer fıstığı soslu, acılı",
            },
            {
              name: "Batagor",
              description: "Kızarmış bakso tahu, siomayın kızarmış versiyonu",
            },
            {
              name: "Basreng",
              description: "Baharatlı kızarmış köfte snacks, Bandung spesiyalliği",
            },
            {
              name: "Bubur Ayam",
              description: "Tavuk çorbası, pirinç pilavı, Endonezya klasik kahvaltısı",
            },
            {
              name: "Kupat Tahu",
              description: "Pirinç dumplings, tofu, fasulye filizi, yer fıstığı soslu",
            },
            {
              name: "Mie Goreng",
              description: "Baharatlı kızarmış noodles, sebzeler ve protein",
            },
            {
              name: "Oncom Bandung",
              description: "Fermente soya fasulyesi pastası, özel Sundanese condiment",
            },
          ],
          "Endonezya Mutfağı": [
            {
              name: "Nasi Goreng",
              description: "Baharatlı kızarmış pilav",
            },
            {
              name: "Ayam Goreng",
              description: "Kızarmış tavuk, çıtır ve lezzetli",
            },
            {
              name: "Sate Ayam",
              description: "Baharlı ızgara tavuk şiş, yer fıstığı soslu",
            },
            {
              name: "Gado-Gado",
              description: "Sebze salatası, yer fıstığı soslu",
            },
          ],
          "Türk Mutfağı": [
            {
              name: "Demir Kebab & Grill",
              description: "Cihapit'te kebap, grill ve Türk esintili yemekler",
            },
            {
              name: "Istanbul Kebab Turki TKI 2",
              description: "Kopo Indah'ta geleneksel döner ve kebab",
            },
            {
              name: "Kebab Baba Sultan by Hakan Idris",
              description: "Cihapit'te yüksek puanlı, kaliteli kebapçı",
            },
            {
              name: "Merhaba Kebab Cikutra",
              description: "Cikutra'da uygun fiyatlı kebap ve dürüm",
            },
            {
              name: "Kebuli Abuya Batununggal",
              description: "Batununggal'da kebap ve Orta Doğu tarzı yemekler",
            },
            {
              name: "Merhaba Kebab Dipatiukur",
              description: "Dipati Ukur'da popüler kebap noktası",
            },
            {
              name: "Merhaba Kebab Gerlong",
              description: "Gegerkalong'da geleneksel kebapçı",
            },
            {
              name: "Kebab Sultan Panyileukan",
              description: "Panyileukan'da kebap ve dürüm tarzı yemekler",
            },
            {
              name: "Ngebabs Everyday",
              description: "Paledang'da kebab ve Orta Doğu atıştırmalıkları",
            },
          ],
          "Batı Mutfağı & Modern": [
            {
              name: "Pizza",
              description: "İtalyan tarzı pizza, modern restoranlar",
            },
            {
              name: "Burger ve Steak",
              description: "Batı tarzı hamburger ve et yemekleri",
            },
            {
              name: "Pastry & Kahvehane",
              description: "Hollanda mirası pastane shops, kahve kültürü",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Kahve",
              description: "Modern kahvehane kültürü, çeşitli kahve içecekleri",
            },
            {
              name: "Taze Meyve Suları",
              description: "Mevsimsel tropikal meyveler, taze suyu",
            },
            {
              name: "Jamu",
              description: "Geleneksel endonez herbal içecek",
            },
            {
              name: "Es Cendol",
              description: "Hindistan cevizi sütü ve yeşil nişasta jeli içecek",
            },
          ],
        },
        turkyemekleriNotu: "Bandung'daki Türk restoranlalarında ızgara ve pide çeşitleri de bulunmaktadır.",
        konaklama: [
          {
            name: "Bütçe Otelleri",
            description: "Arkadaş otelleri, hosteller, ekonomik seçenekler",
          },
          {
            name: "Orta Kademe Otelleri",
            description: "Savoy Homann, Grand Preanger, Art Deco mimarisi, konforlu",
          },
          {
            name: "Lüks Oteller",
            description: "Sheraton, Hilton, Padma Hotel, beş yıldız hizmet ve dağ manzarası",
          },
          {
            name: "Mountain Resort & Villalar",
            description: "Lembang ve civarında özel villalar, doğa içinde konaklama",
          },
          {
            name: "Trans Studio Kompleksi",
            description: "Asia'nın en büyük Ibis oteli, altı yıldızlı lüks otel, tema parkı",
          },
        ],
        konaklamaSuresi: "2–3 gün",
        konaklamaBudgeti: "600 – 1000 USD",
        alisveris: [
          {
            name: "Paris Van Java Mall",
            description: "Büyük alışveriş merkezi, uluslararası ve yerel markalar",
          },
          {
            name: "Trans Studio Mall",
            description: "Kapalı tema parkı, Ibis hotel, lüks alışveriş",
          },
          {
            name: "BTC Fashion Mall",
            description: "Northwest Bandung'da ucuz giyim, yerel markalar, modaya uygun fiyatlar",
          },
          {
            name: "Factory Outlets (Jl Riau & Jl Dago)",
            description: "Moda markalarından outlet, sisa export ürünler, uygun fiyatlar",
          },
          {
            name: "Jalan Cihampelas (Jeans Street)",
            description: "Jeans mağazaları, tekstil outlets, sokak alışveriş, 450m skywalk",
          },
          {
            name: "Distros (Bağımsız Tasarımcılar)",
            description: "Yerel tasarımcı giyim, genç kültür, moda, 300+ dükkan (Jalan Trunojoyo)",
          },
          {
            name: "Cibaduyut (Deri Ürünleri)",
            description: "Kişiye özel deri çizmeleri, ayakkabılar, 3-7 gün üretim süresi",
          },
          {
            name: "Saung Angklung Udjo Gallery",
            description: "Sundanese handikraft, angklung enstrümanları, wayang golek bebekleri satışı",
          },
          {
            name: "Jalan Braga",
            description: "Tarihi shopping street, kafe, sanat galerisi, Art Deco binalar",
          },
          {
            name: "Pasar Baru Trade Centre",
            description: "Şehir merkezi, textil ve giyim, Malaysian turist favori",
          },
          {
            name: "Elektronik Mağazaları (Malls'ta)",
            description: "Paris Van Java, Trans Studio Mall, BTC Mall'da elektronik ürünler, bilgisayar, telefon, aksesuarlar",
          },
        ],
      },
    },
    lombok: {
      giliTrawangan: {
        name: "Gili Trawangan",
        island: "Lombok",
        description:
          "Gili Trawangan, Lombok'un üç Gili Adasından en büyüğü ve en gelişmişidir. Kristal berraklığında suları, dünya sınıfı dalış alanları, canlı gece hayatı ve yoga merkezleriyle tanınan bu ada, macera arayanlar ve deniz severler için cennetir. Motorlu araçların yasak olduğu ada, bisikletler ve tekne turlarıyla dolaşılır.",
        images: [
          getImageUrl("https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=1200", 'lombok-gili-trawangan-img0'),
          getImageUrl("https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-gili-trawangan-img1'),
          getImageUrl("https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-gili-trawangan-img2'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-gili-trawangan-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Gili Trawangan Plajı (Ana Plaj)",
            description: "Doğu sahilinde, limanın kuzeyinde, turquoise sular, beyaz kumlu plaj, yüzme ve snorkeling, kolay erişim",
          },
          {
            name: "Kuzey-Batı Mercan Resifi (Northwest Reef)",
            description: "Adanın batı sahilinde, daha iyi mercan resifleri, keskin ölü mercan üzerinden erişim, ayakkabı gerekli",
          },
          {
            name: "Shark Point (Köpek Balığı Noktası)",
            description: "Dalış noktası, köpek balıkları, tatı suyu köpek balıkları, deniz kaplumbağaları, reef köpekbalıkları",
          },
          {
            name: "Gün Batımı Tepesi (South Hill)",
            description: "Adanın güneyde, değirmenlerin yapıları, II. Dünya Savaşı Japonya silahları, akşam gün batımı manzarası, sabah Rinjani manzarası",
          },
          {
            name: "Meno & Air Gili Adaları",
            description: "Komşu adalar, günübirlik tur, tekne ve snorkeling, daha sakin ortam, island hopping",
          },
          {
            name: "Underwater Statues (Divers Down)",
            description: "Deniz altında sanat heykelleri, dalış noktası, sanat ve okyanografi kombinasyonu",
          },
          {
            name: "Art Market (Pasar Seni)",
            description: "Liman yanında, yerel el sanatları, batik tekstiller, geleneksel endonez ürünleri satışı",
          },
          {
            name: "Gili Trawangan Bisiklet Turu",
            description: "Adanın 7 km çevresini bisikletle, 90-120 dakika, lokal köyler, balık çiftlikleri, hayvanlar, doğa",
          },
          {
            name: "Mangrove Forest (Mangrov Ormanı)",
            description: "Kano turları, doğal yaşam gözlemciliği, kuş gözlemciliği, ekoturizm",
          },
          {
            name: "Freedive Gili Center",
            description: "Apnea ve freediving kursları, nefes tutarak dalış, başlangıç ila ileri seviye, İngiliz freelance rekor sahibi tarafından işletiliyor",
          },
          {
            name: "Gili Mutfak Sınıfları (Art Market'te)",
            description: "3 saatlik kurslar, 6 endonez ve Lombok yemeği öğrenme, yerli malzemeleri kullanma, deneyimli öğretmenler",
          },
          {
            name: "Subwing Gili",
            description: "Deniz oyuncağı (subwing), delfin gibi yüzme, reefin üstünde uçma hissi, 2x25 dakika oturumlar",
          },
        ],
        aktiviteler: [
          {
            name: "Dünya Sınıfı Dalış",
            description: "10+ dalış dükkanı, kurslular ve sertifikalar, Manta Rays, Reef Sharks, Turtles, 5-40 metre",
            icon: "🤿",
          },
          {
            name: "Snorkeling",
            description: "Kıyı kenarında snorkeling, mercan resifleri, tropikal balıklar, Shark Point",
            icon: "🏊",
          },
          {
            name: "Sörf",
            description: "Güney sahilinde sağ el dalgaları, Ocak-Haziran mevsimi en iyi",
            icon: "🏄",
          },
          {
            name: "Yoga Seansları",
            description: "3 yoga merkezi, sabah ve akşam seansları, beachside yoga",
            icon: "🧘",
          },
          {
            name: "Bisiklet Turu",
            description: "Adanın 7 km çevresi bisikletli, lokal köyler, balık çiftlikleri, doğa",
            icon: "🚴",
          },
          {
            name: "At Binme",
            description: "Plaj ve lokal yollarında at binme turları, gün doğumu ve gün batımı",
            icon: "🐴",
          },
          {
            name: "Parti Tekne Turları",
            description: "South Sea Nomads ve benzer tur operatörleri, müzik, yüzme, snorkeling",
            icon: "🎉",
          },
          {
            name: "Mutfak Sınıfları",
            description: "Gili Cooking Classes, Endonez mutfağı öğrenme, yerel malzemeleri kullanma",
            icon: "👨‍🍳",
          },
          {
            name: "Gün Doğumu İzleme",
            description: "Doğu sahilinden, plajda yoga ile birlikte, fotoğraf çekimi",
            icon: "🌅",
          },
          {
            name: "Gece Snorkeling",
            description: "Gece plankton, bioluminescence, nocturnal deniz hayatı gözlemciliği",
            icon: "🌙",
          },
          {
            name: "Freediving & Apnea Kursu",
            description: "Nefes tutarak dalış, başlangıç ila ileri seviye, Freedive Gili (İngiliz rekor sahibi tarafından)",
            icon: "🫁",
          },
          {
            name: "Muck Diving (Çamurda Dalış)",
            description: "Deniz tabanında tuhaf canlılar, fotoğrafçılık, teknik dalış",
            icon: "📸",
          },
          {
            name: "Yürüyüş Turları",
            description: "Adanın 7 km çevresinde yürüyüş, 90-120 dakika, tepedeki WWII bunker",
            icon: "🥾",
          },
          {
            name: "Doğru Dalış (Technical Diving)",
            description: "Closed-circuit rebreather, Tri-Mix, 40m+ derinlik, Blue Marlin ile",
            icon: "🛻",
          },
        ],
        yiyecekIcecekler: {
          "Endonez & Asya": [
            {
              name: "Nasi Goreng & Mie Goreng",
              description: "Yerel stilde kızarmış pirinç ve erişte, sebzeler ve protein ile",
            },
            {
              name: "Satay (Sate)",
              description: "Baharatlı ızgara et şişi, fıstık sos ile",
            },
            {
              name: "Gado-Gado",
              description: "Sebze salatası, fıstık soslu, tofu ve yumurta ile",
            },
            {
              name: "Lumpia",
              description: "Yay-şeklinde mısır kurtları, kızarmış, tatlı ve acı sos ile",
            },
            {
              name: "Som Tam (Papaya Salatası)",
              description: "Yeşil papaya, limon, balık sosu, baharatlı Thai salatası",
            },
            {
              name: "Bakso",
              description: "Et köftesi çorbası, gece pazarlarında ve warungslarda servis edilir",
            },
            {
              name: "Tatlı Krep (Dessert Pancakes)",
              description: "Endonez tatlı krep, gece pazarında satılır, benzersiz tat",
            },
          ],
          "Deniz Ürünleri": [
            {
              name: "Taze Balık",
              description: "Günlük yakalanan balık, ızgara, kızarmış ya da steamed",
            },
            {
              name: "Izgara Balık (Grilled Fish)",
              description: "Red/White Snapper ve Trevally, geleneksel açık ateşte ızgara, her akşam hazır",
            },
            {
              name: "Karides & Squid",
              description: "Taze karides ve mürekkep balığı, baharatlı kızartma",
            },
            {
              name: "Fish Cakes & Patties",
              description: "Yerel balık pastası varyasyonları, fırında pişmiş",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Pizza & Pasta",
              description: "İtalyan tarzı, fırında pişmiş pizza, dökme pasta",
            },
            {
              name: "Hamburger & Sandwiç",
              description: "Taze malzemeleri ile yapılan, gourmet versiyonları mevcut",
            },
            {
              name: "Salad Bar",
              description: "Taze sebzeler, protein seçenekleri, dressing varyasyonları",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Tropikal Meyve Suları",
              description: "Mango, papaya, ananas, markisa, jambu suları, taze sıkılmış",
            },
            {
              name: "Boba Tea & Bubble Tea",
              description: "Türkü boba topu, çay tabanlı, çeşitli tatlar",
            },
            {
              name: "Es Campur",
              description: "Endonez tatlı dondurma şerbeti, jeli ve ayran karışımı",
            },
            {
              name: "Coconut Water",
              description: "Taze hindistan cevizi suyu, elektrolit ve mineral bakımından zengin",
            },
            {
              name: "Kopi (Kahve)",
              description: "Endonez kahvesi, lokal robusta çeşitleri, ombak (köpüklü) veya sade",
            },
            {
              name: "Jamu",
              description: "Geleneksel endonez herbal içecek, sağlık ve enerji için",
            },
            {
              name: "Teh (Çay)",
              description: "Sıcak veya soğuk çay, Lombok çayı, tarih ve baharat çayları",
            },
          ],
        },
        konaklama: [
          {
            name: "Bütçe Hosteller",
            description: "Gili Trawangan'da yüzlerce hostel seçeneği, dorm ve private rooms, sosyal atmosfer",
          },
          {
            name: "Ekonomik Oteller",
            description: "Vila Ombak, Trawangan Dive gibi küçük oteller, temel konfor, fiyat dostu",
          },
          {
            name: "Orta Kademe Oteller",
            description: "Jukung, Karma Kayak, The Deck gibi butik oteller, havuz, resepsiyonist",
          },
          {
            name: "Boutique Villalar",
            description: "Özel tasarımcı villalar, beachfront konumlar, aile ve grup için",
          },
          {
            name: "Lüks Resort'lar",
            description: "Beach House, Ko Ko Mo, Wilson's Retreat, Dunia Resto gibi yüksek bütçeli seçenekler",
          },
        ],
        konaklamaSuresi: "3–5 gün",
        konaklamaBudgeti: "900 – 1700 USD",
        alisveris: [
          {
            name: "Art Market (Santai Beach Club yakınında)",
            description: "Yerel sanatçılar, batik tekstiller, ahşap oyuncaklar, geleneksel endonez ürünleri",
          },
          {
            name: "Beachwalk Shops",
            description: "Kumsal boyunca küçük dükkânlar, suvenirler, plaj kıyafetleri, takı",
          },
          {
            name: "ATM'ler & Para Çevirme",
            description: "12+ ATM merkezi, Para dönüştürme ofisleri, bankalar",
          },
          {
            name: "Souvenir & Craft Shops",
            description: "Endonez sanat eserler, batik, ahşap oyma, yerel el sanatları",
          },
          {
            name: "Giyim & Plaj Kıyafetleri",
            description: "Sörf giysileri, plaj kıyafetleri, yoga activation wear, yerel tasarım",
          },
          {
            name: "Eczane & Sağlık Ürünleri",
            description: "Temel ilaçlar, güneş kremi, böcek ilacı, sağlık ürünleri",
          },
          {
            name: "William's Bookshop",
            description: "Art Market'in arkasında, pul satışı, kart gönderme hizmeti, kitaplar",
          },
          {
            name: "Internet Cafeler & Laundry",
            description: "Lightning Fast ve diğer cafeler, yıkama hizmetleri Art Market'in arkasında",
          },
        ],
      },
      mountRinjani: {
        name: "Mount Rinjani",
        island: "Lombok",
        description:
          "Mount Rinjani, Lombok'un ikonik aktivasyon volkanı ve Endonezya'nın ikinci en yüksek dağıdır. 3,726 metre yükseklikte, muhteşem krater gölü Segara Anak (Denizin Çocuğu), sıcak kaynaklar ve nefes kesen gün doğumu manzaraları ile ünlüdür. Zorlu fakat ödüllendirici trekking deneyimi arayan macera tutkularına yönelik bir destinasyondur.",
        images: [
          getImageUrl("https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=1200", 'lombok-mount-rinjani-img0'),
          getImageUrl("https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-mount-rinjani-img1'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-mount-rinjani-img2'),
          getImageUrl("https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-mount-rinjani-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Segara Anak Krater Gölü",
            description: "Mount Rinjani'nin kalbinde, 2000 metre yükseklikte, 'Denizin Çocuğu' adıyla bilinen göl, 22°C sıcak suyu ve volkanik gaz kabarcıkları ile eşsiz doğal sauna deneyimi sunar",
          },
          {
            name: "Aik Kalak Sıcak Kaynakları",
            description: "Krater ağzında yer alan 3 sıcak kaynak, yaşlanmayı yavaşlatıp genç tuttuğuna inanılan termal sular, terapötik banyı deneyimi",
          },
          {
            name: "Gua Susu (Susu Mağarası)",
            description: "Sıcak buharla dolu kutsal mağara, yerel meditasyon yeri, çevre doğal güzelliği ile bağlantı kurma fırsatı",
          },
          {
            name: "Sendanggile Şelalesi",
            description: "Dağ eteğinde yer alan şelale, muhteşem orman manzarası, doğa yürüyüşleri için ideal ve fotoğraf çekimi için mükemmel",
          },
          {
            name: "Krater Ağzı (Crater Rim)",
            description: "2,600-2,641 metre yükseklikte panoramik manzara noktası, Segara Anak gölü ve Gunung Barujari konisinin nefes kesici görüntüsü, gün doğumu için ideal konum",
          },
        ],
        aktiviteler: [
          {
            name: "2 Gün/1 Gece Trekking (Krater Ağzı)",
            description: "Senaru veya Sembalun'dan başlayarak krater ağzına ulaşan kısa trek, gün doğumu izleme",
            icon: "🥾",
            uyari: "⚠️ Yükseklik hastalığı riski (2000m+), iyi fizik kondisyon gerekli, sertifikalı rehber zorunlu",
          },
          {
            name: "3 Gün/2 Gece Trekking (Krater & Göl)",
            description: "Krater ağzı + krater gölü Segara Anak'a iniş, sıcak kaynaklar banyosu, trekking operatörleriyle organize tur",
            icon: "⛺",
            uyari: "⚠️ Yükseklik 2000m+'ye ulaşır, sıcaklık -2°C ile +3°C arasında değişir, acil durum yardım sınırlı, çok iyi kondisyon şart",
          },
          {
            name: "4 Gün/3 Gece Trekking (Zirveye Çıkış)",
            description: "Krater ağzı → zirve (3,726m) → krater gölü → iniş, en zorlayıcı rota, 4-5°C tepe sıcaklığı",
            icon: "⛰️",
            uyari: "⚠️ EN ZORLU ROTA - Tepe sıcaklığı -4°C ile +5°C, şiddetli yükseklik hastalığı riski, profesyonel alpinist kondisyonu gerekli, helikopter yardımı yok",
          },
          {
            name: "Gün Doğumu Trekking",
            description: "Önceki gün çatıdan çıkış, gece yürüyüş, ışıldayan gün doğumu manzarası krater ağzından, belki en düşünceli deneyim",
            icon: "🌅",
            uyari: "⚠️ Gece yürüyüşü riskli, soğuk hava, ışıklandırma gerekli, kayma riskine dikkat, fizik kondisyon zorunlu",
          },
          {
            name: "Şelale Gezileri",
            description: "Sendanggile veya diğer şelale trekking turları, Senaru/Sembalun bölgelerinde daha hafif yürüyüş seçenekleri",
            icon: "💧",
            uyari: "⚠️ Islak alanlar kaygan olabilir, su seviyesi yüksekse tehlikeli, uygun ayakkabı ve dikkat gerekli",
          },
        ],
        yiyecekIcecekler: [
          {
            name: "Warung Yemekleri (Nasi Goreng, Mie Goreng)",
            description: "Senaru ve Sembalun köylerinde basit warung ve restoranlarda yerel style kızarmış pirinç ve erişte",
          },
          {
            name: "Trekking Paket Yemekleri",
            description: "Organize trekingde taşıyıcılar tarafından hazırlanan sıcak yemekler ve ara öğünler, enerji gıdaları",
          },
          {
            name: "Enerji Barları & Meyveler",
            description: "Başlangıçta satın alınması gereken yüksek enerji yiyecekleri, kurutulmuş meyve, fındık, çokolata, enerji çubukları",
          },
          {
            name: "Çay & Kahve",
            description: "Sicak çay ve kahve Senaru/Sembalun'da sabahları enerjikleştirme için, göl kenarında sıcak içecek kutbunda",
          },
        ],
        konaklama: [
          {
            name: "Senaru Köyü Konaklamaları",
            description: "Kuzey taraftaki başlangıç noktası (600m), basit guesthouse'lar ve small hotels, Segara Anak Cottage & Restaurant ve benzer local options",
          },
          {
            name: "Sembalun Lawang Konaklamaları",
            description: "Doğu taraftaki alternatif başlangıç (1,150m), Lembah Rinjani Homestay, daha yüksek başlangıç noktası, zirveye daha yakın",
          },
          {
            name: "Dağ İçi Kamp Alanları",
            description: "Belirlenmiş kampsite alanları, krater ağzında Summit Campsite, trekking rehberleriniz rehberlik eder",
          },
          {
            name: "Yakın Bölgeler",
            description: "Senggigi (ana plaj resort bölgesi, güneye ~30km), Tanjung (kuzey sahili), Gili Adaları (günübirlik dönüş mümkün)",
          },
        ],
        konaklamaSuresi: "2–4 gün",
        konaklamaBudgeti: "500 – 900 USD",
        alisveris: [
          {
            name: "Senaru & Sembalun Köy Pazarları",
            description: "Temel gıda malzemeleri, su şişeleri, hafif gıdalar, başlangıç malzemeleri",
          },
          {
            name: "Trekking Ekipmanı Kiralama",
            description: "Trekking postaları, başlamp, eldiven, uyuyan tulumu, matla kiralama seçenekleri",
          },
          {
            name: "Eczane & İlk Yardım",
            description: "Temel ilaçlar, ağrı kesiciler, mide ilaçları, güneş kremi, böcek ilacı",
          },
        ],
        turkyemekleriNotu: "⚠️ KRİTİK GÜVENLIK UYARISI: Mount Rinjani trekking son derece tehlikeli bir yüksek dağ tırmanışıdır. 2025'te Brezilyalı Juliana Marins (26) ve Malezya'lı Rennie Abdul Ghani (57) dahil 2 kişi öldü. Tarihte onlarca ölüm kaydedilmiş (2016'da Segara Anak'ta boğulma, 2007'de 7 kişi soğuktan ölüm). RISKLER: Yükseklik hastalığı (2000m+), tepe sıcaklığı -4°C ile +5°C, acil durum yardımı YOK (helikopter yok), ağır fizik kondisyon şart. Sadece mükemmel sağlık ve fitness seviyesiyle, sertifikalı profesyonel rehber eşliğinde öneriliyor. Endonezya yasaları ihlal cezası çok sertir. Çıkış öncesi trekking güvenlik aydınlatması ve sigorta zorunlu.",
      },
      senggigi: {
        name: "Senggigi",
        island: "Lombok",
        description:
          "Senggigi, Lombok'un ana plaj resort bölgesi ve batı sahilinde yer alan en gelişmiş turist merkezidir. Kumsal boyunca uzanan resepsiyon bölgesi, dünya sınıfı otel ve resort kompleksleri, su sporları olanakları ve gün batımı manzarası ile ünlüdür. Bali'den daha sakin ama modern olanakları sunan bir alternatif olarak bilinir.",
        images: [
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=1200", 'lombok-senggigi-img0'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-senggigi-img1'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-senggigi-img2'),
          getImageUrl("https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-senggigi-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Senggigi Beach (Ana Plaj)",
            description: "Kumsal boyunca 5 km uzanan plaj, turquoise sular, güneş batımı manzarası, tüm turist olanakları",
          },
          {
            name: "Pura Batu Bolong (Tapınak)",
            description: "Denize açılan kaya üzerinde antik tapınak, tarihi anıt, dini tören mekanı, fotoğraf çekimi ideali",
          },
          {
            name: "Senggigi Three Gilis Tur",
            description: "Gili Trawangan, Meno ve Air adaları untuk günübirlik snorkeling ve dalış turları, tekne taşımacılığı",
          },
          {
            name: "Senggigi Pazar (Art Market)",
            description: "Kumsal yakınında yerel sanat, batik tekstiler, oyma ahşap, el sanatı ürünleri, halı",
          },
          {
            name: "Mandalika Resort Area (Kente)",
            description: "Senggigi'nin güneyinde yeni gelişme bölgesi, modern alışveriş merkezi, kafe ve restoranlar",
          },
          {
            name: "Lombok Pottery Workshop",
            description: "Geleneksel seramik ve çömlekçilik atölyesi, üretim süreci izleme, satın alma imkanı",
          },
          {
            name: "Aik Kalak Sıcak Kaynakları (Mount Rinjani Turu)",
            description: "Senggigi'nden günübirlik tur, 60-90 dakika sürüş, Mount Rinjani eteğindeki termal su",
          },
        ],
        aktiviteler: [
          {
            name: "Snorkeling",
            description: "Kumsal yakın noktalarda snorkeling, mercan resifleri, tropikal balıklar, Gili adaları yönünde turlar",
            icon: "🏊",
          },
          {
            name: "Dalış",
            description: "Profesyonel dalış eğitmenleri, sertifikasyonlar, Gili Adaları ve Lombok kıyısında lokasyonlar",
            icon: "🤿",
          },
          {
            name: "Gün Batımı Turları",
            description: "Tekne turları, müzik ve kokteyl eşliğinde gün batımı izleme, romantik deneyim",
            icon: "🌅",
          },
          {
            name: "Jet Ski & Su Sporları",
            description: "Jet ski, parasailing, tüp-çekim dalış, wakeboard, plaj olanakları",
            icon: "🚤",
          },
          {
            name: "Spa ve Masaj",
            description: "Otel spa merkezleri, geleneksel Balinese masaj, aromaterapi, wellness seansları",
            icon: "💆",
          },
          {
            name: "Yoga & Meditasyon",
            description: "Yoga stüdyoları, sabah/akşam seansları, plaj kenarı yoga deneyimi",
            icon: "🧘",
          },
          {
            name: "Yürüyüş Turları",
            description: "Kumsal yürüyüşleri, lokal köyler turu, kahvaltı stopsları",
            icon: "🥾",
          },
          {
            name: "Kültür Turları",
            description: "Pura Batu Bolong, seramik atölyesi, yerel pazarlar, geleneksel kerajinan",
            icon: "🎭",
          },
        ],
        yiyecekIcecekler: {
          "Endonez & Asya": [
            {
              name: "Nasi Goreng & Mie Goreng",
              description: "Yerel stilde kızarmış pirinç ve erişte, sebzeler, protein seçenekleri",
            },
            {
              name: "Satay (Sate)",
              description: "Izgara et şişi, fıstık veya kari sosu, sokak yemekleri ve restoranlar",
            },
            {
              name: "Lumpia",
              description: "Yay-şeklinde mısır kurtları, tatlı ve acı sos, gece pazarı favorisi",
            },
            {
              name: "Pecel Ayam",
              description: "Tavuk poriyon, sebze salatası, fıstık sosu ve bumbu, lokal hangover çözümü",
            },
          ],
          "Deniz Ürünleri": [
            {
              name: "Izgara Balık (Grilled Fish)",
              description: "Günlük yakalanan snapper ve trevally, baharatlı ızgara, her akşam hazır",
            },
            {
              name: "Karides & Squid",
              description: "Garlic butter karides, squid tempura, baharatlı kızartma",
            },
            {
              name: "Lobster",
              description: "Taze lobster, ızgara veya kızartma, özel restoranlar, hafta sonu pazarı",
            },
            {
              name: "Fish Cakes",
              description: "Yerel balık pastası çeşitleri, fırında veya kızarmış",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Pizza",
              description: "Fırında pişmiş, taze malzemeleri, İtalyan ve fusion stilleri",
            },
            {
              name: "Hamburger & Sandviç",
              description: "Gourmet burger seçenekleri, fresh baked bread, taze sebzeler",
            },
            {
              name: "Steak",
              description: "Kaliteli et porsiyonları, farklı pişirme seviyeleri, fine dining restoranlar",
            },
            {
              name: "Salad Bar",
              description: "Taze sebzeler, protein seçenekleri, sağlık odaklı menüler",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Tropikal Meyve Suları",
              description: "Mango, papaya, ananas, passion fruit, taze sıkılmış, stand ve kafe",
            },
            {
              name: "Boba Tea",
              description: "Bubble tea, çeşitli tatlar, popüler gençlik içeceği",
            },
            {
              name: "Endonez Kahvesi",
              description: "Lokal robusta kahvesi, ombak (köpüklü), sade veya şekerli",
            },
            {
              name: "Jamu",
              description: "Geleneksel herbal içecek, sağlık ve enerji amaçlı",
            },
            {
              name: "Coconut Water",
              description: "Taze hindistan cevizi suyu, elektrolit açısından zengin",
            },
          ],
        },
        konaklama: [
          {
            name: "Lüks Resort'lar",
            description: "Sheraton, Oberoi, Lombok Serenity ve benzeri 5 yıldızlı kompleksler; plaj kenarında, tüm yemeklerin fiyata dahil olduğu resort konsepti",
          },
          {
            name: "Butik Oteller",
            description: "Boutique Lombok, Alam Sari Keliki, mid-range lüks seçenekleri",
          },
          {
            name: "Orta Kademe Oteller",
            description: "Best Western, Novotel alternatif fiyatlar, havuzlu, temel olanaklar",
          },
          {
            name: "Ekonomik Hosteller",
            description: "Backpacker hostelleri, dorm rooms, sosyal atmosfer, kumsal yakınında",
          },
          {
            name: "Airbnb & Villa",
            description: "Privatava villalar, kimya ve aile grupları için, uygun fiyat",
          },
        ],
        konaklamaSuresi: "2–4 gün",
        konaklamaBudgeti: "1200 – 2500 USD",
        alisveris: [
          {
            name: "Senggigi Art Market",
            description: "Kumsal yakınında sanat pazarı, batik, ahşap oyma, geleneksel ürünler",
          },
          {
            name: "Senggigi Shopping Center",
            description: "Modern alışveriş merkezi, uluslararası ve yerel markalar, giyim, elektronik",
          },
          {
            name: "Beachwalk Shops",
            description: "Kumsal boyunca boutique dükkanları, suvenirler, plaj kıyafetleri, takı",
          },
          {
            name: "Para Dönüştürme & ATM",
            description: "Çoklu ATM lokasyonları, para değişim ofisleri, bankalar",
          },
          {
            name: "Spa & Wellness Dükkanları",
            description: "Aromaterapi ürünleri, skincare, yerel geleneksel ürünler",
          },
          {
            name: "Eczane & Sağlık",
            description: "Temel ilaçlar, güneş kremi, böcek ilacı, sağlık ürünleri",
          },
        ],
      },
      kutaLombok: {
        name: "Kuta Lombok",
        island: "Lombok",
        description:
          "Kuta Lombok, Lombok'un güney sahilinde yer alan dünya çapında ünlü sörf cenneti ve beyaz kumlu plajlar paradızıdır. Kaliteli dalga yapısı, bakir doğal güzellik ve gelişmekte olan altyapısı ile son yıllarda artan turlama popülaritesine sahiptir. Desert Point'e yakınlığı ile efsanevi sörf spotları erişilebilir kılmaktadır.",
        images: [
          getImageUrl("https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=1200", 'lombok-kuta-img0'),
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-kuta-img1'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-kuta-img2'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-kuta-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Kuta Beach (Ana Plaj)",
            description: "Beyaz kumlu, turkuaz su, 1 km uzunluğundaki pristine plaj, yüzme ve snorkeling ideali",
          },
          {
            name: "Desert Point (Bukit Peninsula)",
            description: "Dünya sınıfı soldout sörf spot, 1 km+ uzun barrel dalgalar, Kasım-Mart best season, reef break",
          },
          {
            name: "Tanjung Aan Beach",
            description: "Kuta'ya yakın küçük komşu plaj, daha sakin, mercan resifleri, snorkeling fırsat",
          },
          {
            name: "Kuta Waterfall (Benang Kelambu)",
            description: "20 dakika yürüyüş, doğal şelale, tatlı su havuzunda yüzme, piknik mekanı",
          },
          {
            name: "Menus Cliff (Panoramik Manzara)",
            description: "Kuta'ya 15 km, Kuta Lombok sahil manzarasını panoramik olarak gören tepenin üstüne, Instagram lokasyonu, gün batımı ideali",
          },
          {
            name: "Selong Belanak Beach",
            description: "Kuta'nın batısında 10 km, daha sakin alternatif, surfer friendly, oteller var",
          },
          {
            name: "Mawun Beach",
            description: "Kuta'ya 5 km güneydoğu, pembe kumlu plaj, mercan resifleri, snorkeling ideali, daha sakin",
          },
          {
            name: "Gerupuk Bay",
            description: "Kuta'ya 8 km, spektaküler kaya formasyonları, sörf spotları, gün batımı manzarası, lokal balıkçı köyü",
          },
        ],
        aktiviteler: [
          {
            name: "Dünya Sınıfı Sörf",
            description: "Desert Point, Kuta reef breaks, Selong Belanak, November-March best, başlangıç-ileri tüm seviyeler",
            icon: "🏄",
          },
          {
            name: "Snorkeling",
            description: "Kumsal yakında mercan resifleri, tropikal balıklar, günübirlik tur alternatifleri",
            icon: "🏊",
          },
          {
            name: "Dalış",
            description: "Lokal dalış okulları, sertifikasyonlar, reef diving, drop-off noktaları",
            icon: "🤿",
          },
          {
            name: "Trekking & Yürüyüş",
            description: "Benang Kelambu şelalesi, Menus Cliff, lokal köy turları, doğa yürüyüşleri",
            icon: "🥾",
          },
          {
            name: "Gün Doğumu & Batımı",
            description: "Menus Cliff gün batımı, plaj kenarında gün doğumu, fotoğraf peşinde avcılığı",
            icon: "🌅",
          },
          {
            name: "Spa & Masaj",
            description: "Otel ve standalone spa, geleneksel masaj, wellness seansları",
            icon: "💆",
          },
          {
            name: "Kültür Turları",
            description: "Seramik köyü, lokal pazarlar, geleneksel dokuma, tarihsel siteler",
            icon: "🎭",
          },
          {
            name: "Tekne Turları",
            description: "Island hopping, snorkeling tur, gün batımı cruise, tekne kiralama",
            icon: "⛵",
          },
          {
            name: "Fotoğrafçılık & Instagram Fotoshoot",
            description: "Menus Cliff, plajlar, gün batımı, sosyal medya anları, profesyonel rehberli turlar",
            icon: "📸",
          },
          {
            name: "Yoga & Meditasyon",
            description: "Plaj kenarında sabah yoga, sunset meditasyonu, wellness retreat seansları",
            icon: "🧘",
          },
          {
            name: "ATV & Motorbike Tours",
            description: "Dağ ve kıyı rotalarında macera, lokal köyleri keşfetme, off-road trekking",
            icon: "🏍️",
          },
          {
            name: "Balık Tutma (Fishing)",
            description: "Gece veya gündüz tekne balık tutma turları, yerel balıkçılar ile deneyim",
            icon: "🎣",
          },
          {
            name: "Kayak & Paddle Boarding",
            description: "Kuta Waterfall havuzunda, kıyı boyunca, mercan resifleri keşfi",
            icon: "🛶",
          },
          {
            name: "Lokal Mutfak Dersi",
            description: "Rehberle Endonez yemeği hazırlama, lokal pazar turu, geleneksel tarifler",
            icon: "👨‍🍳",
          },
          {
            name: "Kaya Tırmanışı & Rock Climbing",
            description: "Gerupuk Bay'daki kaya formasyonları, macera, profesyonel rehberlik",
            icon: "🧗",
          },
          {
            name: "Sosyal Sorumluluk Turları",
            description: "Lokal balıkçı köyleri, zanaat atölyelerini ziyaret, komunlarla etkileşim, sosyal destekleme",
            icon: "🤝",
          },
        ],
        yiyecekIcecekler: {
          "Bilgi": [
            {
              name: "",
              description: "kuta lombok'ta türk mutfağı bulunmamaktadır, ancak akdeniz mutfağı restoranları mevcuttur",
            },
          ],
          "Endonez & Asya": [
            {
              name: "Nasi & Mie Goreng",
              description: "Lokal warung tarzı, temel malzemeleri, öğle ve gece yemekleri",
            },
            {
              name: "Satay & Kebap",
              description: "Sokak yemekleri, açık alandaki aşçı, baharatlı soslar",
            },
            {
              name: "Gado-Gado",
              description: "Sebze salatası, fıstık sosu, Endonez klasiği",
            },
            {
              name: "Lumpia",
              description: "Yay-şeklinde mısır kurtları, gece pazarında üretim sahnesi",
            },
            {
              name: "Martabak Terang Bulan",
              description: "Tatlı ve gurme versiyonları, sokak yemeği, akşam pazarında popüler",
            },
            {
              name: "Es Cendol",
              description: "Geleneksel Endonez tatlı buzlu içecek, hindistan cevizi ve şeker şurubu",
            },
          ],
          "Deniz Ürünleri": [
            {
              name: "Izgara Balık",
              description: "Günlük yakalanan snapper ve trevally, açık ateş ızgarası, lokal fiyatlar",
            },
            {
              name: "Karides & Squid",
              description: "Garlic, teriyaki veya baharatlı seçenekler, kumsal restoranları",
            },
            {
              name: "Cumi (Mürekkep Balığı) Karaage",
              description: "Japon tarzı kızarmış squid, popüler lokal varyasyon",
            },
            {
              name: "Beyaz Balık Özel Menüsü",
              description: "Kuta'ya yakın balıkçı köylerinin taze beyaz balığı, günlük menü, lokal hazırlama",
            },
            {
              name: "Seafood BBQ Platters",
              description: "Deniz ürünlerinin ızgarada pişirilmiş kombineleri, balık, karides, squid karışımı",
            },
            {
              name: "Fresh Fish Ceviche",
              description: "Taze balığın limon soslu versiyonu, Batı tarzı Kuta adaptasyonu",
            },
            {
              name: "Penyapu Laut (Seagrass) Snacks",
              description: "Lokal deniz ürünü atıştırmalıkları, yenilebilir deniz yosunu çeşitleri",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Pizza",
              description: "Kuta'da pizza ünlü, fırında pişmiş, taze İtalyan malzemesi",
            },
            {
              name: "Hamburger",
              description: "Gourmet burger, taze ekmek, lokal olarak üretilen",
            },
            {
              name: "Pasta",
              description: "Dökme ve çeşitli soslar, deniz ürünlü seçenekler popüler",
            },
            {
              name: "Cafe Smoothies",
              description: "Meyve smoothies, acai bowls, sağlık odaklı kahvaltı",
            },
            {
              name: "Balinese Fusion Cuisine",
              description: "Balinese ve Lokal Lombok yemeklerinin karışımı, modern sunum, gourmet deneyimi",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Tropikal Meyve Suları",
              description: "Fresh mango, papaya, passion fruit, taze sıkılmış",
            },
            {
              name: "Endonez Kahvesi",
              description: "Lokal robusta, ombak (köpüklü), sokak kafe favorisi",
            },
            {
              name: "Jamu",
              description: "Geleneksel herbal mixe, enerji ve sağlık amaçlı",
            },
            {
              name: "Boba Tea",
              description: "Bubble tea, taze meyve çayları, genç kitlesi popüler",
            },
            {
              name: "Teh Tarik",
              description: "Çekilen çay, popüler Asya içeceği, köpüklü ve tatlı, sokak kafelerinde yapılan",
            },
            {
              name: "Lokal Mangga & Buah Jus",
              description: "Sezonluk meyve suları, taze sıkılmış mango, nektarin, durian karışımları",
            },
            {
              name: "Es Kelapa Muda",
              description: "Genç hindistan cevizi suyu, doğal elektrolit, soğuk içecek, sağlıklı",
            },
          ],
        },
        konaklama: [
          {
            name: "Butik Beach Hotels",
            description: "Arida Senggigi, Kuta Lombok Boutique Hotels, kumsal yakın, kaliteli",
          },
          {
            name: "Resort Kompleksleri",
            description: "Aman Lombok, Mandalika otelieri, lüks seçenekler, facilities full",
          },
          {
            name: "Hostel & Backpacker",
            description: "Gili Guesthouse alternatifleri, dorm rooms, sosyal vibe",
          },
          {
            name: "Airbnb & Villalar",
            description: "Privatava, grup ve aile seçenekleri, uygun fiyat",
          },
          {
            name: "Sörf Camp'ları",
            description: "Specialized sörf camps, dersler dahil, sörf cenneti paketleri",
          },
          {
            name: "Luxury Villa Resorts",
            description: "Kuta'nın en iyi lüks villalı resortları, özel havuzlar, konsiyerj hizmeti, 5 yıldızlı deneyim",
          },
          {
            name: "Budget Hotels",
            description: "Ekonomik seçenekler, temel konfor ve hijyen, kalite/fiyat oranı iyi, sırt çantalı seyahatçiler için ideal",
          },
          {
            name: "Beachfront Bungalows",
            description: "Doğrudan plaj kenarı, romantik ortam, uygun fiyat, gün batımı manzarası",
          },
          {
            name: "Eco-Lodges & Green Resorts",
            description: "Sürdürülebilir turizm, çevre dostu yapı, organik, doğa ile uyumlu konaklama",
          },
        ],
        konaklamaSuresi: "3–5 gün",
        konaklamaBudgeti: "1200 – 2100 USD",
        alisveris: [
          {
            name: "Kuta Night Market",
            description: "Gece pazarı, lokal ürünler, suvenirler, giyim, gegegaw",
          },
          {
            name: "Sanat & Zanaat Galerisi",
            description: "Seramik sanat eserleri, oyma ahşap, batik textiler",
          },
          {
            name: "Sörf Dükkanları",
            description: "Sörf tahtası, giysi, ekipman satışı ve kiralama",
          },
          {
            name: "Para Dönüştürme & ATM",
            description: "Sınırlı sayıda, modern ATM'ler, havaalanına yakın",
          },
          {
            name: "Eczane & Sağlık",
            description: "Temel ilaçlar, güneş kremi, yara bandı, ihtiyaç malzemeleri",
          },
          {
            name: "Telefon & Telefon Aksesuarları",
            description: "Telefon satışı ve aksesuarları, lokal ve uluslararası markalar, onarım hizmeti",
          },
          {
            name: "Elektronik Mağazaları (Mataram'da 45 km)",
            description: "Kamera, drone, dijital ekipman ve diğer elektronik eşya sadece Mataram şehrinde mevcuttur, tur aracılığı organize edilebilir",
          },
          {
            name: "Artisan / Souvenir Shops",
            description: "El yapımı takı, plaj kıyafetleri, magnet, küçük hediyelik eşyalar, lokal sanatçıların ürünleri",
          },
          {
            name: "Boutique Dükkanlar",
            description: "Plaj elbiseleri, bikini, t-shirt, şapka, aksesuarlar, tasarımcı kıyafetler, yüksek kalite",
          },
          {
            name: "Sasak / Pottery Köyleri (Batu Layar)",
            description: "Seramik, el dokuması tekstil, geleneksel el sanatları ürünleri, lokal sanatçılardan direkt alım",
          },
        ],
      },
      benangStokel: {
        name: "Benang Stokel Şelalesi",
        island: "Lombok",
        description:
          "Benang Stokel Şelalesi, Lombok'un doğu bölgesinde yer alan muhteşem çok katlı şelale sistemi ve tatlı su havuzlandırıcıdır. Mount Rinjani'nin eteğinde yerleşmiş, ilk 3 katman kolay erişilebilir kalitesi ile ekoturizm favorisi olup, yeşil orman ortamında doğa banyosu ve yüzme deneyimi sunmaktadır.",
        images: [
          getImageUrl("https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200", 'lombok-benang-stokel-img0'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-benang-stokel-img1'),
          getImageUrl("https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-benang-stokel-img2'),
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800", 'lombok-benang-stokel-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Benang Stokel Şelale (Düzey 1)",
            description: "Ana şelale, 15 metre yükseklik, doğal havuz, tatlı su yüzme, ilk aşama (10 dakika yürüyüş)",
          },
          {
            name: "Benang Stokel 2. Katman",
            description: "İkinci şelale düzeyi, 20 metre yükseklik, daha az kalabalık, ikinci havuz (15 dakika yürüyüş)",
          },
          {
            name: "Benang Stokel 3. Katman",
            description: "Üçüncü şelale düzeyi, 25 metre, en uzak erişilebilir nokta, sessiz orman, ileri hikayeciler",
          },
          {
            name: "Benang Kelambu Şelalesi",
            description: "Benang Stokel'e yakın alternatif şelale, ayrı yürüyüş trekking, daha sakin ve romantik, 2 saatlik rota",
          },
          {
            name: "Orman Yürüyüşü (Trekking Yolu)",
            description: "Yaprak döken orman ortamında yürüyüş, kuş gözlemciliği, vahşi yaşam fotoğrafçılığı, çit gözlemciliği",
          },
          {
            name: "Doğal Havuzlar (Plunge Pools)",
            description: "Şelale havuzları, soğuk tatlı su, yüzme ve dalma noktaları, doğal akışı",
          },
          {
            name: "Piknik Mekanları",
            description: "Orman açıklarında piknik alanları, yerel piknik set kalıtımı seçenekleri",
          },
        ],
        aktiviteler: [
          {
            name: "Şelale Trekking",
            description: "Katman katman şelale ziyareti, 1-3 saatlik rotalar, tüm fitness seviyeleri için",
            icon: "🥾",
          },
          {
            name: "Tatlı Su Yüzme",
            description: "Şelale havuzlarında yüzme, soğuk sudolması, doğal havuzlanma deneyimi",
            icon: "🏊",
          },
          {
            name: "Kuş Gözlemciliği",
            description: "Endonez kuşları, tropikal kuş türleri, fotoğraf peşinde avlanma, gündoğumu turları",
            icon: "🦅",
          },
          {
            name: "Fotoğrafçılık",
            description: "Şelale portreleri, doğa fotoğrafı, sosyal medya momentleri, profesyonel turlar",
            icon: "📸",
          },
          {
            name: "Piknik & BBQ",
            description: "Orman pikniği, yerel kateringi, aile ve grup etkinlikleri",
            icon: "🧺",
          },
          {
            name: "Meditasyon & Yoga",
            description: "Doğa meditasyonu, orman banyosu, sessiz yoga oturumları",
            icon: "🧘",
          },
          {
            name: "Vahşi Yaşam Gözlemciliği",
            description: "Endonez simia, makak maymunları, kuş ve böcek hayatı gözlemciliği",
            icon: "🔭",
          },
          {
            name: "Rockpool Hopping",
            description: "Kaya havuzundan havuza atlama ve yüzme, macera arayanlara ideal, soğuk tatlı su",
            icon: "🏞️",
          },
          {
            name: "Dron Fotoğrafçılığı",
            description: "Drone ile havadan şelale ve orman görüntüleri, profesyonel manzara fotoları",
            icon: "🚁",
          },
          {
            name: "Doğa Sanat & Sketching",
            description: "Doğa çizimi, ressam grupları, yaratıcı sanat oturumları",
            icon: "🎨",
          },
          {
            name: "Lokal Flora & Fauna Öğrenme",
            description: "Rehber ile bitki, böcek, kuş tanımlama, ekosistem bilgisi",
            icon: "🌱",
          },
          {
            name: "Makro Fotoğrafçılık",
            description: "Böcek, çiçek, detay fotoğrafı, yakından portre fotoları",
            icon: "🔬",
          },
        ],
        yiyecekIcecekler: {
          "Endonez & Yerel": [
            {
              name: "Paket Yemekleri (Lunch Boxes)",
              description: "Nasi kuning, lauk-pauk, rehber tarafından sağlanan paket yemekler",
            },
            {
              name: "Warung Yemekleri",
              description: "Yakındaki köyde basit warung restoranları, Nasi Goreng, Mie Goreng",
            },
            {
              name: "Tatlı (Dessert)",
              description: "Endonez tatlıları, pisang goreng, martabak, gece pazarı ürünleri",
            },
            {
              name: "Lokal Buah Salatası (Rujak)",
              description: "Papaya, ananas, dut, tamarind sosu, yerel lezzet",
            },
          ],
          "Protein Yemekleri": [
            {
              name: "Ikan Bakar (Grilled Fish)",
              description: "Tatlı su balığı, yerel baharatlı, rehber tarafından pişirilen",
            },
            {
              name: "Ayam Satay (Sate Ayam)",
              description: "Çubuk et, arachis sosla, lokal pazardan satın alınan",
            },
            {
              name: "Tahu Goreng (Fried Tofu)",
              description: "Kızarmış tofu, tatlı sosla, vegetaryen seçeneği",
            },
            {
              name: "Ayam Goreng (Fried Chicken)",
              description: "Çıtır ayam, yerel baharatlı, piknik için ideal",
            },
          ],
          "Snackler & Enerji Gıdaları": [
            {
              name: "Granola & Müsli",
              description: "Enerji çubuğu, kuruyemiş karışımı, trekking sırasında taşınabilir",
            },
            {
              name: "Kacang Panggang (Roasted Peanuts)",
              description: "Yerel kızarmış fındık, protein içeriği yüksek, uzun raf ömrü",
            },
            {
              name: "Muz & Tropikal Meyveler",
              description: "Taze muz, papaya, tarih, doğal şeker kaynağı",
            },
            {
              name: "Energy Bars",
              description: "Ticari enerji barları, supermarketlerden satın alınan, uzun shelf-life",
            },
          ],
          "Piknik Spesialleri": [
            {
              name: "Perkedel (Potato Croquettes)",
              description: "Patates kroket, yerel tarif, piknik için hazırlanmış",
            },
            {
              name: "Lumpia (Spring Rolls)",
              description: "Yapraklı sarma, yerel doldurmalı, soğuk servis",
            },
            {
              name: "Ketoprak (Vegetable Mix)",
              description: "Yerel sebze salataları, tofu ve telur, piknik kutusu içeriği",
            },
            {
              name: "BBQ Paket Seçenekleri",
              description: "Özel piknik catering, rehber tarafından hazırlanmış, grup seçeneği",
            },
          ],
          "Elektrolit & Spor İçecekleri": [
            {
              name: "Pocari Sweat",
              description: "Elektrolit takviyesi, terleme kaybını telafi eden spor içeceği",
            },
            {
              name: "Lokal Enerji İçecekleri",
              description: "Endonez markası spor içecekleri, yerel marka alternatifleri",
            },
            {
              name: "Tuz & Şeker Su (Oral Rehydration)",
              description: "Basit ev yapımı rehidrasyon, iki elektrolit takviyesi",
            },
            {
              name: "Fresh Lime Juice (Es Jeruk)",
              description: "Taze limon suyu, vitamin C kaynağı, rehber tarafından yapılan",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Tatlı Çay (Es Teh Manis)",
              description: "Soğuk tatlı çay, yakında rehber tarafından hazırlanan içecek seçenekleri",
            },
            {
              name: "Endonez Kahvesi",
              description: "Lokal robusta kahvesi, ombak (köpüklü), thermos'da sıcak taşınmış",
            },
            {
              name: "Coconut Water",
              description: "Tatlı hindistan cevizi suyu, rehber satın alımı, elektrolit bakımından zengin",
            },
            {
              name: "Jamu",
              description: "Geleneksel herbal içecek, yakında hazırlanan sağlık içecekleri",
            },
            {
              name: "Su Şişeleri",
              description: "Temiz içme suyu, şelaleden doğrudan emniyet altında su",
            },
          ],
        },
        konaklama: [
          {
            name: "Tetebatu Köyü Guesthouses",
            description: "Yakındaki Tetebatu köyünde ekonomik konaklama, aile işletmeleri, lokal hava",
          },
          {
            name: "Sembalun Valley Bungalows",
            description: "Daha uzak ama Benang Stokel'e alternatif konaklama, doğa çiftçiliği vibe",
          },
          {
            name: "Lombok Ecoturism Lodges",
            description: "Lokal ekotürizm lodges, açık havaya ortam, doğa cenavatı",
          },
          {
            name: "Mount Rinjani Gateways",
            description: "Senaru veya Sembalun yönetim noktaları, dağcılar için konaklama alternatifleri",
          },
          {
            name: "Camping Seçenekleri",
            description: "Şelale yakınında kampçılık imkanları, özel tişörtler sağlananlar",
          },
        ],
        konaklamaSuresi: "1–2 gün",
        konaklamaBudgeti: "600 – 950 USD",
        alisveris: [
          {
            name: "Tetebatu Village Shop",
            description: "Yakındaki köy dükkanı, su, çay, tatlı, temel gıda malzemeleri",
          },
          {
            name: "Lokal Pazarı (Farmers Market)",
            description: "Sabah pazarı, taze meyve, sebze, lokal ürünler, Sembalun yönetimi",
          },
          {
            name: "Craft Dükkanları",
            description: "Yerel el sanatı, ahşap oyma, seramik, doğa turları souvenirler",
          },
          {
            name: "ATM & Para Değişim",
            description: "En yakın ATM: Tetebatu veya Sembalun, önceden nakit hazır bulundurun",
          },
        ],
      },
    },
    komodo: {
      komodoIsland: {
        name: "Komodo Adası",
        island: "Komodo",
        description:
          "Komodo Adası, UNESCO Dünya Mirası olan Komodo Ulusal Parkı'nın kalbi olup, dünyada sadece 3,000-5,000 tane yaşayan Komodo ejderlerinin doğal habitatıdır. Rehberli trekking turları ile bu efsanevi canlıları savanah ortamında gözlemleyebilirsiniz. Ancak kesinlikle tehlikeli ve dikkat gerektiren bir deneyimdir.",
        images: [
          getImageUrl("https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=1200", 'komodo-komodo-island-img0'),
          getImageUrl("https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800", 'komodo-komodo-island-img1'),
          getImageUrl("https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800", 'komodo-komodo-island-img2'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'komodo-komodo-island-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "⚠️ GÜVENLIK UYARISI",
            description: "Komodo Adası, Komodo ejderleri ile ünlüdür. Bu dev kertenkeleler insanlara saldırabilir, özellikle yiyecek kokusu veya ani hareketlerde. Tur rehberi eşliğinde gezmek zorunludur. Rehbersiz yürümek tehlikelidir.",
          },
          {
            name: "Komodo Dragon Habitat (Banuyuning Trek)",
            description: "2 km yürüyüş, 30-45 dakika, ejder görme olasılığı yüksek, rehber zorunlu, 07:00-10:00 arası ideal zaman",
          },
          {
            name: "Loh Sebita Trek (Orta Zorluk)",
            description: "9 km, 3-4 saat, savana ve orman kombinesi, ejderlerin avlanma alanları, ileri grup için",
          },
          {
            name: "Loh Liang Visitor Center",
            description: "Ziyaretçi merkezi, mini müze, ejder bilgi panelleri, restoran ve WC, başlangıç noktası",
          },
          {
            name: "Padar Island Kombinesi",
            description: "Komodo trekking + Padar gün doğumu kombinesi, ortak tur paketleri (erken başlayış 05:30)",
          },
          {
            name: "Sangiang Trek (Zor)",
            description: "17 km, 5-7 saat, en uzak punkt, çok az turist, efsanevi ejder saldırısı hikayesi, expert grup",
          },
          {
            name: "Crater Lake Trek",
            description: "Komodo Island doğusundaki tatlı su göl, trekking + yüzme kombinesi (ender tur)",
          },
          {
            name: "Gunung Ara Tepesi",
            description: "Komodo'dan 800m yükseklik, panoramik manzara, Rinca ve Flores adaları görünüyor",
          },
          {
            name: "Pink Beach (Pantai Merah)",
            description: "Kırmızı kumlu plaj, mercan resifleri, snorkeling ideali, plajda yüzme ve dinlenme",
          },
          {
            name: "Kanawa Island",
            description: "Kombineli adalar turu, snorkeling, balık gözlemciliği, küçük ve sakin ada",
          },
          {
            name: "Labuan Bajo Town",
            description: "Ana şehir, liman, restoranlar, alışveriş, gemi turlarının başlangıç noktası, rehber rezervasyonu",
          },
          {
            name: "Manta Ray Diving Sites",
            description: "Dünya sınıfı manta balığı dalış noktaları, November-April optimal sezon, derin dalış gerekli",
          },
        ],
        aktiviteler: [
          {
            name: "⚠️ GÜVENLIK UYARISI",
            description: "Komodo Adası, Komodo ejderleri ile ünlüdür. Bu dev kertenkeleler insanlara saldırabilir, özellikle yiyecek kokusu veya ani hareketlerde. Tur rehberi eşliğinde gezmek zorunludur. Rehbersiz yürümek tehlikelidir.",
            icon: "⚠️",
          },
          {
            name: "Komodo Ejderi Gözlemciliği",
            description: "Dünyaca ünlü mega faunası, rehberli tur, 07:00-10:00 arası en aktif, parfümlü koşu banka önerilir",
            icon: "🦎",
            uyari: "⚠️ KRITIK: Rehberin hattı mutlak takip, 6 metre sınırı kesin, bir grup tamamını tut, koş yürümek yasak, sakin davran",
          },
          {
            name: "Trekking Turları (3 Seviye)",
            description: "2km (30min) başlangıç, 9km (3-4h) orta, 17km (5-7h) ileri, park tarafından düzenlenen turlar",
            icon: "🥾",
          },
          {
            name: "Fotoğrafçılık Safari",
            description: "Professional fotoğrafçı rehberleri, telephoto lensler, ejder davranışı capture etme",
            icon: "📸",
          },
          {
            name: "Vahşi Yaşam Çalışma Turları",
            description: "Bilim insanları, araştırmacılar için uzun süreli gözlem programları",
            icon: "🔬",
          },
          {
            name: "Rinca Adası Kombinesi",
            description: "Komodo'ya bitişik Rinca adası, benzer ejderler ama daha az kalabalık",
            icon: "⛵",
          },
          {
            name: "Gün Doğumu Trekking",
            description: "Erken sabah çıkış (05:30), soğuk hava, ejderlerin en aktif saati, 2-3 saat tur",
            icon: "🌅",
          },
          {
            name: "Avlanma Davranışı Gözlemciliği",
            description: "Kuru mevsimde (Nisan-Haziran) ejderlerin musk deer ve wild boar avlaması izleme fırsatı",
            icon: "🎯",
          },
          {
            name: "Jeoloji Tur (Volkanik Geçmiş)",
            description: "Komodo'nun volkanik tarihçesi, jeoloji örüntüleri, oluşum hikayesi",
            icon: "🪨",
          },
          {
            name: "Snorkeling & Diving Tours",
            description: "Pink Beach'te snorkeling, mercan resifleri, tropikal balıklar, Manta Ray diving (November-April), profesyonel dalış ekipleri",
            icon: "🤿",
          },
          {
            name: "Boat Tours / Island Hopping",
            description: "Labuan Bajo limanından başlayan adalar turu, Kanawa Island, Kelor Island, Gili Lawa kombinesi, tekne turları",
            icon: "⛵",
          },
          {
            name: "Kuş Gözlemciliği (Birdwatching)",
            description: "Endemik kuş türleri, Eagles, Macaws, Parrots, ornitoloji rehberleri, sabah ve akşam tur saatleri",
            icon: "🦅",
          },
          {
            name: "Gece Ejder Safari",
            description: "Gece ejderleri gözlemlemesi, ender ve enerji yoğun tur, uyku dönemindeki ejderleri izleme, 20:00-23:00 arası",
            icon: "🌙",
          },
          {
            name: "Yüzme & Plaj Aktiviteleri",
            description: "Pink Beach ve diğer plajlarda yüzme, dinlenme, piknik, güneş batımı manzaraları, temel su sporu aktiviteleri",
            icon: "🏊",
          },
        ],
        yiyecekIcecekler: {
          "Endonez & Lokal": [
            {
              name: "Nasi Kuning (Sarı Pirinç)",
              description: "Kunyit ve baharatlarla pişmiş sarı pirinç, geleneksel tur yemeği",
            },
            {
              name: "Ikan Goreng (Kızarmış Balık)",
              description: "Günlük yakalanan lokal balık, açık alanda ızgara, tuz ve limonla",
            },
            {
              name: "Sayuran (Sebze Çorbasında)",
              description: "Yerel sebzeler, hindistan cevizi sütü, baharatlı, geleneksel tur menüsü",
            },
            {
              name: "Bakso Ikan (Balık Köftesi Çorbası)",
              description: "Lokal balık köftesi, gece pazarında satılan hafif öğün",
            },
          ],
          "Deniz Ürünleri": [
            {
              name: "Grilled Snapper",
              description: "Günlük yakalanan kırmızı snapper, bölgenin specialty'si",
            },
            {
              name: "Calamari Goreng",
              description: "Kızarmış mürekkep balığı, kumla kaplı, baharat sosu ile",
            },
            {
              name: "Shrimp Satay",
              description: "Karides şişi, yer fıstığı sosu ile, sokak yemekleri",
            },
            {
              name: "Tuna (Taze Ton Balığı)",
              description: "Günlük yakalanan taze ton balığı, ızgara veya sashimi, premium balık",
            },
            {
              name: "Fish Steak",
              description: "Kalın balık biftek şeklinde pişirilmiş, baharat marinajı, lüks restoranlar",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Pizza",
              description: "Labuan Bajo otellerinde İtalyan tarzı pizza",
            },
            {
              name: "Hamburger",
              description: "Turist otellerinde gourmet seçenekleri",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Es Teh Manis (Soğuk Tatlı Çay)",
              description: "Soğuk tatlı çay, trekking sırasında zorunlu içecek, rehber sağlar",
            },
            {
              name: "Coconut Water",
              description: "Tatlı hindistan cevizi suyu, elektrolit açısından zengin, sıcakta ideal",
            },
            {
              name: "Endonez Kahvesi",
              description: "Lokal robusta kahvesi, sabah energi için",
            },
            {
              name: "Jamu",
              description: "Geleneksel herbal içecek, sağlık ve enerji amaçlı",
            },
          ],
        },
        konaklama: [
          {
            name: "Bilgi",
            description: "Komodo Adası'nda konaklama kısıtlı ve risklidir, o yüzden konaklama Labuan Bajo'da yapılır",
          },
          {
            name: "Labuan Bajo Butik Oteller",
            description: "Komodo Eco Resort, Plataran Komodo, orta-lüks seçenekler, Labuan Bajo'da yer alıyor",
          },
          {
            name: "Bungalow & Guesthouses",
            description: "Ekonomik seçenekler, lokal işletmeler, aile ortamı",
          },
          {
            name: "Liveaboard Cruise'lar",
            description: "2-7 gün liveaboard paketleri, tekne + konaklama + tur kombinesi",
          },
          {
            name: "Luxury Resorts",
            description: "Amanwana, Plataran lüks seçenekleri, all-inclusive turlar",
          },
        ],
        konaklamaSuresi: "1–3 gün (Komodo), 3–5 gün (Liveaboard)",
        konaklamaBudgeti: "1100 – 2000 USD",
        alisveris: [
          {
            name: "Bilgi",
            description: "alışverişler labuan bajo'da yapılmaktadır",
          },
          {
            name: "Lokal Pazarı (Labuan Bajo)",
            description: "Gece pazarı, taze balık, deniz ürünleri, yerel ürünler, haggle zorunlu",
          },
          {
            name: "Tourist Market (Harita & Suvenirler)",
            description: "Komodo haritaları, ahşap ejder heykelleri, batik tekstiler",
          },
          {
            name: "ATM & Para Dönüştürme",
            description: "Labuan Bajo şehirde merkezi ATM'ler, para değişim ofisleri",
          },
          {
            name: "Trekking Ekipmanı",
            description: "Rehber tarafından sağlanan ayakkabı, su şişeleri, güneş kremi kiralama",
          },
          {
            name: "Eczane & Sağlık Ürünleri",
            description: "Güneş kremi, böcek ilacı, ilaçlar, antibiyotik, blister paketi, malarya ilaçları",
          },
          {
            name: "Giyim & Plaj Kıyafetleri",
            description: "T-shirt, şapka, plaj elbiseleri, lokal tasarım, rahat kıyafetler",
          },
          {
            name: "Restoran & Kafe Zinciri",
            description: "Labuan Bajo'da turist restoranları, pide fırını, pizza mekanları, internet kafe",
          },
        ],
      },
      labuanBajo: {
        name: "Labuan Bajo",
        island: "Komodo",
        description:
          "Labuan Bajo, Komodo Ulusal Parkı'nın ana kapısı ve tüm Komodo turlarının başlangıç noktasıdır. Balıkçı kasabası atmosferi taşıyan bu küçük şehir, havaalanı ile bağlantılı modern altyapı sunmakta ve lokal deniz ürünleri pazarı ile ünlüdür. Komodo turlarına çıkmak için 1-2 gün okullanılabilir.",
        images: [
          getImageUrl("https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200", 'komodo-labuan-bajo-img0'),
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800", 'komodo-labuan-bajo-img1'),
          getImageUrl("https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=800", 'komodo-labuan-bajo-img2'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'komodo-labuan-bajo-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Labuan Bajo Balık Pazarı (Pagi Pazarı)",
            description: "Sabah 05:00-08:00, lokal balıkçıların yakaladığı deniz ürünleri satışı, authentik pengalaman",
          },
          {
            name: "Sunset Point (Bukit Cinta)",
            description: "Labuan Bajo'dan 15 dakika yürüyüş, tepe manzarası, gün batımı pararajest, fotoğraf ideali",
          },
          {
            name: "Lokal Restoran Sokağı (Jalan Pantai)",
            description: "Kumsal boyunca restoran ve kafe alanı, deniz ürünleri özelikli, açık hava oturma",
          },
          {
            name: "Labuan Bajo Pazarı (Town Market)",
            description: "Merkezi pazarı, yerel ürünler, tekstilller, batik, geleneksel harika el sanatları",
          },
          {
            name: "Komodo Airport (LBJ) Yakınlarında",
            description: "Havaalanı 2015'de açıldı, modern tesis, lokal ve uluslararası uçuşlar (Jakarta, Bali)",
          },
          {
            name: "Lokal İmaret ve Tapınaklar",
            description: "Cami ve tapınak kompleksleri, dini mimarı, yerel kültür gözlemciliği",
          },
          {
            name: "Manta Ray Watching Point (Menus Strait)",
            description: "Sezon (Kasım-Mayıs) tekne tur, manta ray avı, snorkel ya da dalış kombinesi",
          },
          {
            name: "Pink Beach (Pantai Merah)",
            description: "Komodo'nun en ünlü pembe kumlu plajı, mercan parçaları sebebi pembe renk, snorkeling ve dalış ideali, günübirlik tekne turu",
          },
          {
            name: "Padar Tepe (412 metre)",
            description: "Üç renkli körfez manzarası, 45-60 dakika yürüyüş, taşlı yol, dik eğim, Instagram lokasyonu",
          },
          {
            name: "Padar Adası Plajları",
            description: "Beyaz, pembe ve siyah kumlu plajlar, snorkeling ve yüzme, günübirlik tekne turu",
          },
          {
            name: "Kanawa Adası",
            description: "Padar'ın batısında 5-10 dakika tekne, küçük adacık, snorkeling ve plaj, sakin atmosfer",
          },
          {
            name: "Taka Makassar (Üç Ada Kombinesi)",
            description: "Padar + Komodo + Kanawa full day tour, snorkeling üç lokasyonda, lunch box servis",
          },
        ],
        aktiviteler: [
          {
            name: "Tekne Tur Planlama & Rezervasyon",
            description: "Labuan Bajo'da tüm Komodo turları düzenlenir, 1-7 gün liveaboard paketleri, rehber seçimi",
            icon: "⛵",
          },
          {
            name: "Balık Pazarı Ziyareti",
            description: "Erken sabah pazarı, lokal balıkçıların yakalamalarını görme, authentik deniz deneyimi",
            icon: "🐟",
          },
          {
            name: "Gün Batımı Tekne Tur",
            description: "Kısa tekne turu, gün batımı, müzik ve kokteyl (bazı operatörler), romantik deneyim",
            icon: "🌅",
          },
          {
            name: "Lokal Restoran & Seafood Deneme",
            description: "Labuan Bajo'nun en iyi deniz ürünleri, ızgara balık, karidesleri, garlic butter lobster",
            icon: "🍽️",
          },
          {
            name: "Manta Ray Watching",
            description: "Menus Strait'inde manta ray encounter, sezon: Kasım-Mayıs ayları garantili avı, snorkel/dalış",
            icon: "🦑",
          },
          {
            name: "Scuba Diving Kurs",
            description: "PADI sertifikasyon kurları, başlangıç seviyesi, Labuan Bajo dive shops",
            icon: "🤿",
          },
          {
            name: "Sunset Point Yürüyüş & Fotoğrafçılık",
            description: "Gün batımı manzarası, şehrin panorama görünümü, halk düğünleri ve etkinlikler",
            icon: "📸",
          },
          {
            name: "Havaalanı Transferi & Oryantasyon",
            description: "Havaalanı -> Şehir turizm rehberi, hotels & turlar, tur operatörü bilgisi",
            icon: "✈️",
          },
          {
            name: "Pink Beach Snorkeling & Dalış",
            description: "Pembe kumlu plaja tekne ile gidiş, mercan resifleri, tropikal balıklar, sığ ve derin snorkeling seçenekleri",
            icon: "🏊",
          },
          {
            name: "Manta Ray Gözlemciliği (Pink Beach yakını)",
            description: "Sezon: Kasım-Mayıs ayları manta ray encounter, snorkel veya dalış, takviye deniz yaratığı gözlemciliği",
            icon: "🦑",
          },
          {
            name: "Pink Beach Fotoğrafçılığı",
            description: "Pembe kumlar arka plan, mercan ve balık fotoğrafçılığı, sosyal medya anları, gün batımı shoots",
            icon: "📸",
          },
          {
            name: "Padar Tepe Trekking",
            description: "45-60 dakika orta zorluk, 412 metre yükseklik, taşlı yol, uygun ayakkabı şart",
            icon: "🥾",
          },
          {
            name: "Padar Gün Doğumu Trekking",
            description: "Erken sabah (05:30 başlangıç), ışık manzarası, tepe zirve fotoğrafçılığı",
            icon: "🌅",
          },
          {
            name: "Padar Fotoğrafçılık Safari",
            description: "Üç renkli körfez manzarası fotoğraflanması, Instagram lokasyonu, profesyonel fotoğraf turları",
            icon: "📸",
          },
          {
            name: "Padar Snorkeling",
            description: "Padar çevresindeki körfezlerde snorkeling, mercan bahçeleri, deniz yaşamı gözlemi",
            icon: "🏊",
          },
          {
            name: "Padar Meditasyon & Doğa",
            description: "Tepe zirvede meditasyon, doğa ile bağlantı kurma, stres rahatlaması",
            icon: "🧘",
          },
          {
            name: "Padar Dalış (Diving)",
            description: "Sertifikasyonlu dalış turları, mercan ekosistemi, tüm seviyelere uygun",
            icon: "🤿",
          },
          {
            name: "Padar + Komodo Kombinesi",
            description: "Aynı gün hem Komodo ejderi trekking hem Padar tepe trekking, yoğun macera günü",
            icon: "⛵",
          },
          {
            name: "Kumsal Piknik + Snorkeling",
            description: "Padar plajında lunch servis sonrası snorkeling, mercan bahçeleri, balık gözlemi",
            icon: "🥪",
          },
        ],
        yiyecekIcecekler: {
          "Deniz Ürünleri": [
            {
              name: "Ikan Bakar (Grilled Fish)",
              description: "Günlük yakalanan red snapper, grouper, trevally, açık ateşte ızgara, lemon & salt",
            },
            {
              name: "Udang Goreng (Kızarmış Karidesleri)",
              description: "Garlic butter karidesleri, crispy, baharat sosu ile",
            },
            {
              name: "Cumi Bakar (Grilled Squid)",
              description: "Mürekkep balığı ızgara, teriyaki veya baharatlı sos",
            },
            {
              name: "Lobster Bakar",
              description: "Özel restoranlar, mevsimsel, teriyaki veya butter sauce",
            },
            {
              name: "Tuna Steak",
              description: "Ton balığı biftek, ızgara veya sos ile, premium restoranlar",
            },
            {
              name: "Fish Steak",
              description: "Lokal balık biftek, taze yakalanan balıktan, tartar sos ile servis",
            },
          ],
          "Endonez & Lokal": [
            {
              name: "Nasi Goreng Spesial",
              description: "Lokal nasi goreng, balık veya karidesleri, yerel baharatlar",
            },
            {
              name: "Soto Ayam",
              description: "Tavuk çorbası, sarı baharatlı, sıcak ve besleyici",
            },
            {
              name: "Pecel Ayam",
              description: "Tavuk porsiyonu, sebze salatası, fıstık sosu, Endonez klasiği",
            },
            {
              name: "Nasi Kuning",
              description: "Sarı pirinç, kurkuma ve hindistan cevizi sütü ile, özel günlük seçenek",
            },
            {
              name: "Gado-Gado",
              description: "Sebze salatası, tofu, tahu goreng, fıstık sosu, besleyici ve lezzetli",
            },
            {
              name: "Satay (Sate Ayam)",
              description: "Kılıç kebabı, tavuk veya daging, fıstık sosu, street food favorisi",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Pizza & Pasta",
              description: "Orta-lüks restoranlar, taze malzemeleri, İtalyan tarzı",
            },
            {
              name: "Hamburger",
              description: "Gourmet seçenekleri, taze ekmek, turist mekanı",
            },
          ],
          "Alkolsüz İçecekler": [
            {
              name: "Es Teh Manis",
              description: "Soğuk tatlı çay, lokal favorisi, sokak satıcıları ucuz",
            },
            {
              name: "Endonez Kahvesi",
              description: "Lokal robusta, ombak (köpüklü), sabah kahvesi",
            },
            {
              name: "Tropical Juices",
              description: "Mango, papaya, passion fruit, taze sıkılmış, ş kafe",
            },
            {
              name: "Jamu",
              description: "Geleneksel herbal içecek, sağlık amaçlı, sokak satıcıları",
            },
          ],
        },
        konaklama: [
          {
            name: "Butik Oteller",
            description: "Komodo Eco Resort, Plataran Komodo, orta-lüks seçenekler, kumsal yakın",
          },
          {
            name: "Orta Kademe Oteller",
            description: "Best Western, Novotel alternatif fiyatlar, klima, restoran",
          },
          {
            name: "Ekonomik Guesthouses",
            description: "Backpacker hosteller, lokal işletmeler, dorm + private rooms, sosyal vibe",
          },
          {
            name: "Lüks Resortlar",
            description: "Amanwana liveaboard, all-inclusive turlar, 5 yıldızlı hizmet",
          },
          {
            name: "Airbnb & Villalar",
            description: "Privatava villalar, grup seçenekleri, uygun fiyat",
          },
        ],
        konaklamaSuresi: "1–2 gün (ön/son noktası), 3–5 gün (liveaboard entegreli)",
        konaklamaBudgeti: "1500 – 2400 USD",
        alisveris: [
          {
            name: "Balık Pazarı (Sabah)",
            description: "Lokal balıkçılar, taze deniz ürünleri, görsel ve tat deneyimi",
          },
          {
            name: "Lokal Market",
            description: "Batik tekstiler, ahşap heykeller, geleneksel el sanatları, pazarlık zorunlu",
          },
          {
            name: "Turist Souvenir Dükkânları",
            description: "Komodo haritaları, ahşap ejder heykelleri, deniz kabukluk yapılar",
          },
          {
            name: "Para Dönüştürme & ATM",
            description: "ATM merkezi, para değişim ofisleri, kredi kartı kabul sınırlı, nakit zorunlu",
          },
          {
            name: "Eczane & Sağlık Ürünleri",
            description: "Temel ilaçlar, güneş kremi, böcek ilacı, anti-malaria tablet",
          },
          {
            name: "Tekne Tur Operatörleri",
            description: "Blue Marlin Dive, Salima, Satonda, Indonesian Diving Association turları",
          },
        ],
        onemliNotlar: "⚠️ LABUAN BAJO ENFORMASYONLARı: Elektrik kesintileri sık (2-3 saat), internet yavaş, altyapı gelişmekte. Best season Nisan-Haziran (kuru, iyi görüş). Havaalanı Jakarta/Bali'den günlük uçuşlar. Liveaboard turu planlıyorsanız önceden rezervasyon yapın. Tüm tur operatörleri Labuan Bajo şehirde merkezi. Tayfun riski Kasım-Mart.",
      },
    },
    sulawesi: {
      bunaken: {
        name: "Bunaken",
        island: "Sulawesi",
        description:
          "Bunaken Ulusal Parkı, Sulawesi'nin kuzeyinde yer alan ve dünyanın en iyi dalış noktalarından biri olarak tanınan bir ada. Zengin mercan resifleri, rengârenk balıklar ve temiz sular, dalış ve snorkeling severler için cennettir.",
        images: [
          getImageUrl("https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=1200", 'sulawesi-bunaken-img0'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-bunaken-img1'),
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-bunaken-img2'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-bunaken-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Bunaken Island Main Beach",
            description: "Adanın ana plajı, mercan resifleri, snorkeling ideali, rehberli tur ile erişim",
          },
          {
            name: "Liang Beach",
            description: "Dalış noktası, derin su, yoğun mercan hayatı, tüm seviye dalış mümkün",
          },
          {
            name: "Siladen Island",
            description: "Tecile, snorkeling ve dalış, daha sakin atmosfer, gün turu",
          },
          {
            name: "Manado City",
            description: "Ana şehir, restoranlar, alışveriş, gece hayatı, tekne turlarının başlangıç noktası",
          },
          {
            name: "Manado Tua (Tua Island)",
            description: "Konik eski volkan adası, Bunaken'in güney tarafında, dalış ve snorkeling noktası, görkemli manzara",
          },
        ],
        aktiviteler: [
          {
            name: "Dalış (Scuba Diving)",
            description: "Tüm seviyelere uygun, PADI sertifikalı, profesyonel rehberler, mercan ekosistemi",
            icon: "🤿",
          },
          {
            name: "Snorkeling",
            description: "Kayalık alanlardan direkt erişim, balık gözlemi, yüzme becerisi yeterli",
            icon: "🏊",
          },
          {
            name: "Tekne Turu",
            description: "Adalar arası tekne turları, Siladen kombinesi, gün boyu aktivite",
            icon: "⛵",
          },
          {
            name: "Mercan Resifi Gözlemciliği",
            description: "Dalış rehberi ile mercan ve balık türleri tanıtımı, fotoğrafçılık fırsatı",
            icon: "🐠",
          },
          {
            name: "Yunuslar & Balinalar Gözlemciliği",
            description: "Tekne turlarında veya özel kiralanan tekne ile yunuslar ve balinalar izleme",
            icon: "🐬",
          },
          {
            name: "Hiking (Yürüyüş)",
            description: "Adanın doğu ve kuzey tarafındaki gizli koylar, fiziksel aktivite, doğa keşfi",
            icon: "🥾",
          },
        ],
        yiyecekIcecekler: {
          "Deniz Ürünleri": [
            {
              name: "Ikan Bakar (Grilled Fish)",
              description: "Taze yakalanan yerel balık, açık ateşte ızgara, lemon & salt",
            },
            {
              name: "Tinutuan",
              description: "Balık ve sebze ile yapılan çorba benzeri yemek",
            },
            {
              name: "Ikan & Nasi",
              description: "Resortlarda sunulan klasik buffet yemeği, taze balık & pirinç",
            },
          ],
          "Endonez & Lokal": [
            {
              name: "Nasi Kuning",
              description: "Sarı pirinç, kurkuma ve hindistan cevizi sütü ile",
            },
            {
              name: "Gado-Gado",
              description: "Sebze salatası, tofu, fıstık sosu, besleyici",
            },
            {
              name: "Nasi Campur",
              description: "Karışık pirinç, çeşitli sebze & et, sokak yemeği favörisi",
            },
            {
              name: "Ayam Goreng",
              description: "Kızarmış tavuk, malı ve rempah baharatlarla bahsedilmiş",
            },
            {
              name: "Bakso",
              description: "Et köfte çorbası, klasik Endonez çorbası",
            },
          ],
          "Batı Mutfağı": [
            {
              name: "Pasta & Pizzalar",
              description: "İtalyan tarzı pasta ve pizza, Bunaken Bistro'da sunulur",
            },
            {
              name: "Grilled Meats",
              description: "Izgara kırmızı etler, resort restoranlarında mevcut",
            },
            {
              name: "Sandwiches & Burgers",
              description: "Batı tarzı sandviç ve burgerler, turista mekanlarında",
            },
          ],
          "İçecekler": [
            {
              name: "Es Teh Manis",
              description: "Soğuk tatlı çay, lokal favorisi",
            },
            {
              name: "Tropical Juices",
              description: "Mango, papaya, passion fruit, taze sıkılmış",
            },
            {
              name: "Cap Tikus",
              description: "Lokal kaynatılmış palmiye spirits, limon & buz ile içilir",
            },
            {
              name: "Bintang Beer",
              description: "Endonez'in en popüler birası, soğuk servis",
            },
            {
              name: "Kopi / Es Kopi",
              description: "Endonez kahvesi, sıcak veya buzlu servis, lokal kahve kültürü",
            },
            {
              name: "Air Kelapa",
              description: "Taze hindistan cevizi suyu, tropikal içecek, doğal ve besleyici",
            },
            {
              name: "Bottled Water",
              description: "Temiz şişelenmiş su, adada tatlı su kaynağı yoktur (ısrarcı önerisi)",
            },
            {
              name: "Jamu",
              description: "Geleneksel Endonez medicinal bitki çayı, sağlık faydası",
            },
            {
              name: "Tropical Smoothies",
              description: "Meyve karışımlı smoothie'ler, modern turist seçeneği",
            },
          ],
        },
        konaklama: [
          {
            name: "Luxury Resorts & Villas",
            description: "Siladen Resort & Spa, Tantaa Moon Villas, özel plajlar, spa hizmetleri, infinity pool",
          },
          {
            name: "Dive Resort'ları",
            description: "Dalış odaklı otel paketleri, profesyonel hizmetler, tur dahil",
          },
          {
            name: "Orta Kademe Oteller",
            description: "Manado şehirde, klima, restoran, dalış turları organize",
          },
          {
            name: "Island Bungalows",
            description: "Geleneksel Minahasa tarzı bungalow'lar, doğal ortam, plaj erişimi",
          },
          {
            name: "Ekonomik Guesthouses",
            description: "Backpacker seçenekleri, sosyal ortam, tur rehberleri",
          },
        ],
        konaklamaSuresi: "3–5 gün (turlar dahil)",
        konaklamaBudgeti: "800 – 1500 USD",
        alisveris: [
          {
            name: "Manado Market",
            description: "Lokal pazarı, batik tekstiler, geleneksel sanat",
          },
          {
            name: "Dalış Ekipmanları",
            description: "Kiralama ve satış, profesyonel ekipman",
          },
          {
            name: "Visitors Centre (Liang Beach)",
            description: "Resmi alışveriş merkezi, el sanatları, tişörtler, hediyelik eşyalar",
          },
          {
            name: "Beach Shops",
            description: "Plaj satıcıları, taş boncuk, deniz kabuğu, lokal zanaat",
          },
          {
            name: "Resort Gift Shops",
            description: "Resort dükkanları, batik, geleneksel kumaşlar, lokal sanat",
          },
          {
            name: "Snorkeling Equipment Rental",
            description: "Snorkeling malzemeleri kiralama, masks, fins, wetsuits",
          },
          {
            name: "Lokal Craftwork & Souvenirs",
            description: "Ahşap oyması, el yapımı dekoratif eşyalar, geleneksel sanat",
          },
        ],
      },
      makassar: {
        name: "Makassar",
        island: "Sulawesi",
        description:
          "Makassar, Güney Sulawesi'nin başkenti ve Sulawesi'nin en büyük şehridir. Tarihi liman şehri, Bugis kültürü ve ünlü deniz ürünleriyle tanınan Makassar, Doğu Endonezya'ya açılan kapı görevi yapır. Losari Beach sahili, Fort Rotterdam kalesi ve Paotere limanı tarihi önemini yansıtmaktadır.",
        images: [
          getImageUrl("https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200", 'sulawesi-makassar-img0'),
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-makassar-img1'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-makassar-img2'),
          getImageUrl("https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-makassar-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Losari Beach",
            description: "Şehir merkezinde uzun sahil şeridi, gün batımı manzarası, gece yemek tezgahları ve toplanma yeri",
          },
          {
            name: "Fort Rotterdam",
            description: "Hollanda dönem kalesi, La Galigo müzesi, tarihi anıt, Sulawesi kültürü hakkında bilgi",
          },
          {
            name: "Pulau Samalona",
            description: "Beyaz kumlu ada, dalış ve snorkeling ideali, tekne ile 30-45 dakika, dalış paraşütü",
          },
          {
            name: "Pulau Khayangan",
            description: "Tekne ile 20 dakika mesafede, küçük ve sakin ada, snorkeling fırsatı",
          },
          {
            name: "99 Domes Mosque (Masjid 99 Kubah)",
            description: "Dünyanın 30 benzersiz camisi arasında, etkileyici mimari, İslami sanat merkezi",
          },
          {
            name: "Paotere Port",
            description: "Makassar'ın ana limanı, geleneksel Phinisi tekneleri, balık gemileri, yerli yaşam gözlemi",
          },
          {
            name: "Malino",
            description: "Makassar'ın 2 saat kadar kuzeyindeki dağlık bölge, daha serin iklim, çay plantasyonları, doğal güzellik ve kaçış",
          },
          {
            name: "Tanjung Bira",
            description: "Makassar'ın güneydoğu ucundaki popüler sahil kumsalı, beyaz kumlar, mercan resifi, dingin atmosfer",
          },
        ],
        aktiviteler: [
          {
            name: "Snorkeling & Dalış",
            description: "Pulau Samalona'da dalış, mercan resifi, balık gözlemciliği",
            icon: "🤿",
          },
          {
            name: "Tekne Turları",
            description: "Adalar arası tur, Pulau Khayangan ve Pulau Samalona kombinesi",
            icon: "⛵",
          },
          {
            name: "Trans Studio",
            description: "Dünyanın en büyük kapalı tema parkı, 20+ oyun, tüm yaşlar için",
            icon: "🎢",
          },
          {
            name: "Koşu/Yürüyüş Grubu (Makassar Hash)",
            description: "Haftalık koşu turları, orman ve doğa yürüyüşleri, macera grupları",
            icon: "🏃",
          },
          {
            name: "Gün Batımı İzleme",
            description: "Losari Beach'te mükemmel gün batımı manzarası ve fotoğrafçılık",
            icon: "🌅",
          },
          {
            name: "Fort Rotterdam Müzesi Ziyareti",
            description: "Hollanda dönem kalesi, La Galigo müzesi, Sulawesi tarihi ve kültürü hakkında rehberli turlar",
            icon: "🏰",
          },
          {
            name: "Paotere Limanı Balıkçılık Deneyimi",
            description: "Paotere limanında geleneksel Phinisi tekneleriyle balıkçılık turu, yerli balıkçılarla tanışma",
            icon: "🎣",
          },
          {
            name: "Kapoleta/Lokal Pazar Tur",
            description: "Makassar'ın yemek pazarlarında yürüyüş, lokal ürünler, canlı pazar yaşamı ve tasting",
            icon: "🏪",
          },
          {
            name: "Malino Çay Plantasyonu Turu",
            description: "Kuzeyindeki dağlık Malino bölgesine gün gezisi, çay bahçeleri, doğa yürüyüşü, serin hava",
            icon: "🌿",
          },
          {
            name: "Tanjung Bira Plajı Aktiviteleri",
            description: "Güneydoğu sahil kumsalına gün gezisi, yüzme, ışınlama, sakin plaj atmosferi",
            icon: "🏖️",
          },
        ],
        yiyecekIcecekler: {
          "Makassar Mutfağı": [
            {
              name: "Coto Makassar",
              description: "Makassar'ın ünlü çorbası, baharat ve et ile yapılmış, pirinç kekiyle servis",
            },
            {
              name: "Sop Saudara",
              description: "Geleneksel Güney Sulawesi çorbası, et, karaciğer ve akciğer içerir",
            },
            {
              name: "Sop Konro",
              description: "Dana kaburga çorbası, koyu ve lezzetli, geleneksel baharat ile",
            },
            {
              name: "Pallubasa",
              description: "Makassar tarzı et çorbası, acı ve hindistan cevizi ile",
            },
            {
              name: "Tinutuan",
              description: "Makassar pirinç lapası, yumuşak pirinç, et suyu ile pişirilmiş, popüler kahvaltı",
            },
            {
              name: "Konro Iga",
              description: "Dana kaburga tatlı pişirme, hindistan cevizi sütü ve baharat ile, sos içinde",
            },
            {
              name: "Kepiting Saus Tiram",
              description: "Yer yengeçi ostriye sosuyla, zengin ve lezzetli, özel restoranlarda",
            },
            {
              name: "Bandeng Presto",
              description: "Baskılı balık şekli, sos içinde pişirilmiş, kemikleri yumuşak, geleneksel yemek",
            },
            {
              name: "Kue Bolu",
              description: "Makassar spesiyali tatlı kek, hafif ve kabarık, çay ile servis",
            },
          ],
          "Lokal Spesiyaliteler": [
            {
              name: "Pisang Ijo",
              description: "Yeşil muz tatlısı, yoğun kokosu ve şurup ile, Makassar imzası",
            },
            {
              name: "Nasi Kuning",
              description: "Sarı pirinç, kurkuma ile, popüler kahvaltı yemeği",
            },
            {
              name: "Pangsit Mie",
              description: "BBQ pork ve wontonlu noodle, Çin etkili lokal yemek",
            },
            {
              name: "Mie Kanton",
              description: "Kanton tarzı kızarmış noodle, sebze ve et ile",
            },
          ],
          "Deniz Ürünleri": [
            {
              name: "Ikan Bakar",
              description: "Açık ateşte ızgara balık, yer fıstığı sosu ve hindistan cevizi sütü ile",
            },
            {
              name: "Seafood Restaurant",
              description: "Balık, karides, kalamar, istakoz, çeşitli hazırlama yöntemleri",
            },
          ],
          "İçecekler": [
            {
              name: "Tana Toraja Kahvesi",
              description: "Ünlü Endonez arabika kahvesi, Kopi Api kafe'de en kaliteli",
            },
            {
              name: "Es Teh Manis",
              description: "Soğuk tatlı çay, popüler içecek",
            },
            {
              name: "Tropical Fruit Juices",
              description: "Mango, papaya, avokado, limon otu gibi taze sıkılmış meyve suları",
            },
          ],
        },
        konaklama: [
          {
            name: "Boutique & Business Hotels",
            description: "Aston Hotel Makassar, ibis Makassar City Center, Citadines Royal Bay, klima, restoran",
          },
          {
            name: "Mid-Range Hotels",
            description: "Favor Hotel (yüzme havuzu), konforlu odalı, merkezi lokasyon",
          },
          {
            name: "Budget Hostels",
            description: "New Legend Hostel, POD House, Wisma Jampea, backpacker dostu, ucuz",
          },
          {
            name: "Beachfront Resort Hotels",
            description: "Losari Beach yakınında, deniz manzarası, yüzme havuzu, plaj erişimi, lüks tesis",
          },
          {
            name: "Serviced Apartments",
            description: "Haftalık/aylık konaklama, tam donatılı mutfak, oturma alanı, uzun kalış için ekonomik",
          },
          {
            name: "Heritage/Traditional Hotels",
            description: "Makassar'ın tarihi mimarisini yansıtan oteller, kültürel deneyim, karakteristik dekorasyon",
          },
          {
            name: "International Chain Hotels",
            description: "Radisson, Hilton, Sheraton kalitesi, uluslararası standart, merkezi lokasyon",
          },
        ],
        konaklamaSuresi: "1–2 gün (şehir gezisi)",
        konaklamaBudgeti: "400 – 1000 USD",
        alisveris: [
          {
            name: "MTC Karebosi",
            description: "Elektronik, bilgisayar, telefon, Carrefour Express, lokal dükkanlar",
          },
          {
            name: "Trans Studio Mall",
            description: "Uluslararası markalar (Hugo Boss, Gucci, Louis Vuitton), Metro Dept Store, Gramedia",
          },
          {
            name: "Mall Panakkukang",
            description: "Hypermart, sinema, restoran, kafe, perakende mağazalar",
          },
          {
            name: "Mall Ratu Indah",
            description: "Matahari Dept. Store, Gramedia, Hero Supermarket, XXI Sinema, Breadtalk, McDonald, Pizza Hut, oyun alanı, kafeler",
          },
          {
            name: "Bacan Market (Pasar Bacan)",
            description: "Geleneksel pazar, lokal yiyecekler, tarih erkenden başlar",
          },
          {
            name: "Chinatown (Jl. Sulawesi vb.)",
            description: "Tarihî Çin mahallesi, lokal ürünler, küçük dükkanlar",
          },
        ],
        onemliNotlar: "ℹ️ MAKASSAR BİLGİLERİ: Şehir iklimi sıcak ve nemli. Başlıca ulaşım aracı taksi, Grab uygulaması ve petepete. Sultan Hasanuddin Uluslararası Havaalanı bağlantılı. Güney Sulawesi'ye kapı; Tana Toraja 8-10 saat uzakta (kara yolu). Milli Park ve adalar günübirlik tur olarak erişilebilir. En iyi ziyaret süresi 1-2 gün.",
      },
      wakatobi: {
        name: "Wakatobi",
        island: "Sulawesi",
        description:
          "Wakatobi, Güneydoğu Sulawesi'de yer alan 4 adadan (Wangi-Wangi, Kaledupa, Tomia, Binongko) oluşan bir archipelago ve milli park bölgesi. Dünyanın en iyi dalış noktalarından biri olarak tanınan Wakatobi, saf mercan resifleri, zengin deniz yaşamı ve dakikalar içinde yüksek dalış potansiyeli ile dalış meraklıları için cennettir.",
        images: [
          getImageUrl("https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=1200", 'sulawesi-wakatobi-img0'),
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-wakatobi-img1'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-wakatobi-img2'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-wakatobi-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Hoga Island",
            description: "Kaledupa yakınında, tekne ile yüksek gelgit saatinde erişim, mükemmel snorkeling ve dalış noktası",
          },
          {
            name: "Pantai Hondue",
            description: "Tomia'nın güneyinde, ferry portu yakınında, plaj ve snorkeling fırsatları, rahatlama alanı",
          },
          {
            name: "Abandoned Jetty (Tomia)",
            description: "Tomia'nın kuzeybatı ucunda, en önerilen snorkel spotlarından biri, çeşitli deniz hayatı",
          },
          {
            name: "Coral Stretch East of Pantai Hongaha",
            description: "Tomia'da, spektaküler mercan resifi, II. Dünya Savaşı gemi enkazı, güçlü akıntı dikkat edilmeli",
          },
          {
            name: "Tolandona Island",
            description: "Tomia yakınında, Wakatobi Dive Resort'ün bulunduğu yer, en iyi snorkel noktaları, eski iskele erişim",
          },
          {
            name: "One Melangka Beach (Binongko)",
            description: "Binongko'nun batı-merkez kısmında, pitoresk plaj, yüzme ve dinlenme, daha az ziyaretçi",
          },
          {
            name: "Forts (Fort Patua & Fort Suo-Suo)",
            description: "Tomia'da Buton Krallığı'ndan kalma tarihi kaleler, eski top kalıntıları, panoramik manzara",
          },
          {
            name: "Wangi-Wangi Center (Wanci Town)",
            description: "Ana merkez kasabası, pazar, restoranlar, gece pazarı (Pasar Malam), liman ve rehber hizmetleri",
          },
          {
            name: "Just Outside of Sombu Pier",
            description: "Wangi-Wangi batısında 7 km kuzeyinde, snorkeling noktası, kıyı kenarında, tekne ile erişim",
          },
          {
            name: "In Front of Waha Town",
            description: "Wangi-Wangi kuzeybatısında, Waha Tourism Center yakınında, snorkeling fırsatı, güçlü akıntı dikkat edilmeli",
          },
        ],
        aktiviteler: [
          {
            name: "Scuba Diving (Profesyonel)",
            description: "Tüm seviyelere uygun, PADI sertifikaları, 5-40 metre derinlikte, manta ray turu (mevsim)",
            icon: "🤿",
          },
          {
            name: "Snorkeling",
            description: "Kıyı kenarında ve bot turlarında snorkeling, mercan resifi, tropikal balıklar, güvenli ortam",
            icon: "🏊",
          },
          {
            name: "Island Hopping & Tekne Turları",
            description: "Cantika fast boat ve lokal tekneler, ada arası geziler, 2-3 günlük turlar organize",
            icon: "⛵",
          },
          {
            name: "Motorbike Touring",
            description: "Adalar üzerinde motosiklet kiralama, köy keşfi, lokal yaşam, scooter turları",
            icon: "🏍️",
          },
          {
            name: "Lokal Pazar & Gece Pazarı Ziyareti",
            description: "Wanci'deki lokal pazarı, Pasar Malam'da geleneksel Endonez yemekleri, halka karışma",
            icon: "🏪",
          },
          {
            name: "Dron Fotoğrafçılığı & Su Fotoğrafçılığı",
            description: "Havadan ada görüntüleri, sualtı kamerası, dalış sırasında profesyonel fotoğrafçılık",
            icon: "📸",
          },
          {
            name: "Fort Exploration & Tarihi Trekking",
            description: "Tomia'daki Fort Patua ve Fort Suo-Suo'yu ziyaret, eski top bakıntıları, panoramik manzara, lokal rehber",
            icon: "🏰",
          },
        ],
        yiyecekIcecekler: {
          "Lokal Mutfağı": [
            {
              name: "Parende Fish Soup",
              description: "Wakatobi'nin ünlü balık çorbası, lokal balık türü, baharatlandırılmış, Ambeua'da bulunur",
            },
            {
              name: "Fresh Seafood BBQ",
              description: "Balık, karides, calamar, kalamar, açık ateşte ızgara, Pasar Malam (Gece Pazarı)'da servis",
            },
            {
              name: "Sate Madura",
              description: "Yer fıstığı sosuyla satay, Madura tarzı pişirme, lokal favorisi, restoranlarda bulunur",
            },
            {
              name: "Nasi Kuning",
              description: "Sarı pirinç, lokal tavası, popüler kahvaltı yemeği, kolay bulunur",
            },
          ],
          "Endonez Yemekleri": [
            {
              name: "Bakso (Meatball Soup)",
              description: "Geleneksel et toplama çorbası, noodle ile servis, sıcak ve doyurucu",
            },
            {
              name: "Gado-Gado",
              description: "Sebze karışımı yer fıstığı sosuyla, hafif ve sağlıklı, sokak yemekçileri tarafından sunulur",
            },
            {
              name: "Mie Kuah (Soup Noodles)",
              description: "Çorbalı noodle, sıcak ve tatmin edici, sokak vendörleri ve küçük restoranlar tarafından sunulur",
            },
          ],
          "Finger Food & Snacks": [
            {
              name: "Fried Spring Rolls (Lumpia)",
              description: "Kızarmış bahar sarması, dipping sosuyla, hafif atıştırmalık",
            },
            {
              name: "Perkedel (Potato Croquettes)",
              description: "Patates croquette'i, çıtır dış, yumuşak iç, lokal favori snack",
            },
            {
              name: "Bakpia (Local Sweet)",
              description: "Lokal tatlı pasta, çeşitli fileler, hediyelik ürün olarak da sunulur",
            },
          ],
          "İçecekler": [
            {
              name: "Fresh Fruit Juices",
              description: "Mango, papaya, avokado, soursop, taze sıkılmış meyve suları",
            },
            {
              name: "Coconut Water",
              description: "Taze hindistan cevizi suyu, tropikal içecek, doğal ve besleyici",
            },
            {
              name: "Lokal Coffee & Tea",
              description: "Endonez kahvesi, bitki çayları, sabahın içeceği seçeneği",
            },
          ],
        },
        konaklama: [
          {
            name: "Luxury Dive Resorts",
            description: "Wakatobi Dive Resort (Tolandona), 7-günlük paketler, tüm dalışlar ve yemekler dahil, $2640+",
          },
          {
            name: "Mid-Range Hotels & Villas",
            description: "Villa MM (Kaledupa), Labore Stay (Tomia), Pombero Lodge (Tomia), klima, restoran, tur organize",
          },
          {
            name: "Budget Homestays",
            description: "Jelly Homestay (Wangi-Wangi), Sutiani Homestay (Wangi-Wangi), ucuz, backpacker dostu, sosyal",
          },
          {
            name: "Motel & Guesthouses",
            description: "Motel Anjungan Busoa (Binongko), Hotel Wakatobi (Wangi-Wangi), ekonomik fiyat, temel konfor",
          },
          {
            name: "Liveaboard Dalış Tekneleri",
            description: "Multi-day liveaboard packages, tekne üzerinde konaklama, profesyonel dalış turları, all-inclusive",
          },
          {
            name: "Beachfront/Oceanview Budget Accommodation",
            description: "Sutiani Homestay (Wangi-Wangi) - plaj erişimi, snorkeling imkanı, ucuz ücret, doğa yakınlığı",
          },
        ],
        konaklamaSuresi: "4–7 gün (dalış turları ve keşif)",
        konaklamaBudgeti: "1500 – 4500 USD (budget-luxury range)",
        alisveris: [
          {
            name: "Anemo Wakatobi Souvenir Shop",
            description: "Wanci'de, özel tasarlanmış t-shirtler, çantalar, eşarplar, hediyelik eşyalar",
          },
          {
            name: "Pasar Malam (Gece Pazarı)",
            description: "Wanci'deki gece pazarı, lokal yiyecekler, geleneksel ürünler, halk pazarı deneyimi",
          },
          {
            name: "Lokal Beach Shops",
            description: "Kumsal yakınındaki dükkanlar, taş boncuklar, deniz kabuğu, el sanatı ürünleri",
          },
          {
            name: "Dalış Ekipmanları Kiralama",
            description: "Dalış ekipmanları, kursu, sertifikaları, lokal dive shop'larında",
          },
          {
            name: "Moto Rental Shops",
            description: "Motosiklet kiralama şirketleri, tüm adalar üzerinde merkez, uygun fiyat",
          },
        ],
        onemliNotlar: "⚠️ WAKATOBI ENFORMASYONLARı: Erişim sınırlı - haftada sadece 2 uçuş (Pazartesi/Cuma), Kendari'den 10+ saatlik feribat alternatif. Milli Park alanı - dalgıç ve snorkeling severler için ideal, genel turizme az uygun. Dalış mevsiminde güçlü akıntılar, yerel rehber zorunlu. Altyapı gelişmekte - elektrik kesintileri, internet yavaş. En iyi sezon: Aprıl-Haziran (kuru, iyi görüş). Nakit zorunlu, ATM sınırlı. Liveaboard tour planlıyorsanız önceden rezervasyon yapın.",
      },
      togean: {
        name: "Togean Islands",
        island: "Sulawesi",
        description:
          "Togean Adaları (Kepulauan Togean), Orta Sulawesi'nin kuzeyinde yer alan, tropikal cennet bir archipelago. Temiz su, mercan resifleri, harika dalış, snorkeling, orman trekking ve Bajo halkının benzersiz deniz kültürü ile tanınan destinasyon. Ülkenin en güzel, hala keşfedilmeyen adalarından biri.",
        images: [
          getImageUrl("https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1200", 'sulawesi-togean-img0'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-togean-img1'),
          getImageUrl("https://images.pexels.com/photos/2399077/pexels-photo-2399077.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-togean-img2'),
          getImageUrl("https://images.pexels.com/photos/1250580/pexels-photo-1250580.jpeg?auto=compress&cs=tinysrgb&w=800", 'sulawesi-togean-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Bomba Atoll",
            description: "Togean'ın en ünlü dalış noktası, 'must visit' lokasyonu, görüntü menzili çok iyi, mercan resifi bolca, makro hayat, büyük balıklar (napoleonfish, trevally)",
          },
          {
            name: "Hoga Island (Snorkeling & Diving Hub)",
            description: "Tauban Island yakınında, mükemmel snorkeling ve dalış, eğitim merkezleri, plaj kampları, halk canlı",
          },
          {
            name: "Taupan Island",
            description: "Mercan resifi, snorkeling, dalış, beyaz kumlu plaj, kolay erişim, ailecek gezilir",
          },
          {
            name: "Kadidiri Island - Poki Poki & Sunset Beach",
            description: "Ada başlıca turist merkezi, resort options, plajlar, market, Stingless Jellyfish Lake yakın (40 min)",
          },
          {
            name: "Stingless Jellyfish Lake (Danau Ubur-ubur)",
            description: "Dünyada sadece 2-3 yerde bulunan iğnesiz denizanası gölü, yüzme deneyimi, Kadidiri'den 40 dakika, eşsiz doğa fenomeni",
          },
          {
            name: "Katupat Islands - Fishing & Beach Villages",
            description: "Lokal Bajo balıkçı köyleri, denizci kültürü, konservasyonu, plajlar, snorkeling, otantik deneyim",
          },
          {
            name: "Malenge Island & Coconut Crab Spotting",
            description: "Ada'daki tropikal orman, endemik hayvan türleri (palmiye kereviti), jungle trek, lokal rehber ile",
          },
          {
            name: "Una-Una Volcano Island",
            description: "Aktif volkan, trekking, manzara, Bomba Atoll yakınında diving ile kombinli, ufuk hatları güzel",
          },
          {
            name: "Wakai Town",
            description: "Togean'ın ana şehir merkezi, Ampana'dan feribat giriş noktası, market, supplies, lokal yiyecekler, resmi daire",
          },
          {
            name: "Bajo Villages (Sea Gypsies Community)",
            description: "Autentik Bajo denizci halkının yaşamı, geleneksel ev mimarileri, okyanusla yaşam, kültür gezileri, lokal rehber önerilir",
          },
        ],
        aktiviteler: [
          {
            name: "Scuba Diving",
            description: "Bomba Atoll'da ünlü dalış, en iyi wall diving, Anyang Dive & Lokal dive shop'lar, sertifikaları kabul edilir",
            icon: "🤿",
          },
          {
            name: "Snorkeling",
            description: "Hoga Island, Taupan, Kadidiri yakınında snorkeling, mercan resifi erişimi, uçak fini gerekli, rehberli turlar",
            icon: "🏊",
          },
          {
            name: "Island Hopping & Tekne Turları",
            description: "Tekneler ile ada turu, Wakai başlangıç, 1-7 gün liveaboard turlar, tüm adalar görülebilir",
            icon: "⛵",
          },
          {
            name: "Jungle Trekking & Orman Rehberliği",
            description: "Malenge Island'da tropikal orman trekking, palmiye kereviti (endemik), kuş gözlemciliği, lokal rehber zorunlu",
            icon: "🥾",
          },
          {
            name: "Sea Kayaking",
            description: "Hafif su sportu, lagoonlar içinde kayaking, mangrove gezintileri, tüm seviyelerde uygun",
            icon: "🛶",
          },
          {
            name: "Bajo Cultural Visit & Sea Gypsy Experience",
            description: "Lokal Bajo halkı ile tanışma, geleneksel ağlar ve tekneler, okyanus yaşamı tarihi, fotoğraf fırsatları",
            icon: "🤝",
          },
          {
            name: "Photography & Underwater Macro",
            description: "Profesyonel dalış fotoğrafçılığı, su altı macro, dron fotoğrafçılığı hava görüntüleri, rehber ile",
            icon: "📸",
          },
          {
            name: "Fishing Trips & Night Fishing",
            description: "Lokal balıkçılarla veya paket turlarla balık tutma, gece balık tutma teknikleri, Bajo halkı yöntemleri, öğrenme deneyimi",
            icon: "🎣",
          },
          {
            name: "Moto/Scooter Touring",
            description: "Adaları motosikletle keşfetme, Kadidiri ve Wangi-Wangi tur, lokal köyler ziyareti, kumsal yolları, dağ manzaraları",
            icon: "🏍️",
          },
        ],
        yiyecekIcecekler: {
          "Lokal Mutfağı": [
            {
              name: "Ikan Bakar (Grilled Fish)",
              description: "Açık ateşte ızgaralanan balık, lokal türü, soğan ve limonla, sahil restoranlarında servis",
            },
            {
              name: "Calamari (Calamar Tava)",
              description: "Taze calamar, derin yağda kızartma, padi sodası (tamarind) ile tadı arttırma, Wakai'de bulunur",
            },
            {
              name: "Sate Ikan (Fish Satay)",
              description: "Balık şişleri, yer fıstığı sosuyla, tradisyonel ızgara, lokal favorisi",
            },
            {
              name: "Nasi Kuning (Sarı Pirinç)",
              description: "Çeşitli baharatlı ve curcuma ile renklendirilmiş pirinç, tüm restoranlarda sunulur",
            },
          ],
          "Deniz Ürünleri": [
            {
              name: "Udang (Karides)",
              description: "Taze karides, garlık sosuyla, kızarmış veya kaynatılmış, Togean'ın özelliği",
            },
            {
              name: "Kepiting (Crab Masala)",
              description: "Büyük kepitingeler, baharat sos ile pişirilmiş, festival yemekleri sırasında popüler",
            },
            {
              name: "Lobster (Langusta)",
              description: "Mevsimsel (yazın), taze lobster turlar sırasında servis, lüks resortlar sunabilir",
            },
          ],
          "Endonez Yemekleri": [
            {
              name: "Gado-Gado",
              description: "Sebze karışımı, yer fıstığı sosuyla, hafif ve sağlıklı, halk pazarlarında bulunur",
            },
            {
              name: "Mie Goreng (Kızarmış Noodle)",
              description: "Tatlı soya sosuyla baharatlandırılmış noodle, kolay bulunan sokak yemeği",
            },
            {
              name: "Bakso (Meatball Soup)",
              description: "Et toplama çorbası, noodle ile, sıcak ve doyurucu, küçük restoranlar tarafından sunulur",
            },
          ],
          "İçecekler": [
            {
              name: "Fresh Fruit Juice",
              description: "Tropikal meyve suyu, papaya, mango, ananas, Wakai pazarında taze sıkılır",
            },
            {
              name: "Coconut Water (Kelapa Muda)",
              description: "Taze hindistancevizi suyu, elektrolit, sıcak saatlerde ferahlatıcı, plajda servis",
            },
            {
              name: "Teh Tarik (Çay)",
              description: "Tatlı çay, kaynatılmış süt ile servis, restoranlar tarafından sunulur",
            },
          ],
        },
        yiyecekEkleri: [
          {
            name: "Tinutuan (Rice Porridge)",
            description: "Pirinç porridge, geleneksel kahvaltı yemeği, Orta Sulawesi özelliği, lokal pazarlarda bulunur",
          },
          {
            name: "Soto Ayam (Tavuk Çorbası)",
            description: "Tavuk çorbası, lokal favori, baharat sos ile, kurmaca pirinç veya noodle ile servis",
          },
          {
            name: "Martabak",
            description: "Krepş tarzı, tatlı veya tuzlu dolmalar, peynir/şokolata/et dolgu, sokak yemeği, sabahlar erken seçti",
          },
        ],
        konaklama: [
          {
            name: "Luxury Dive Resorts",
            description: "Anyang Dive Resort, Island Retreat - tam dalış paketleri, rehber, ekipman, 3 öğün yemek, Rp 250-400K",
            icon: "⭐⭐⭐⭐⭐",
          },
          {
            name: "Mid-Range Resorts & Hotels",
            description: "Poki Poki Resort, Sunset Beach, Harmony Bay - tur yönetimi, balık tutma, aktiviteler paket, Rp 150-300K",
            icon: "⭐⭐⭐⭐",
          },
          {
            name: "Budget Homestays & Pondok",
            description: "Pondok Lestari, lokal homestays - basit odalar, gündüz tutma, lokal rehberler bağlantısı, Rp 100-150K",
            icon: "⭐⭐⭐",
          },
          {
            name: "Beach Huts & Bungalows",
            description: "Kumsal yakınında basit kalındırmalar, fan ventilasyonu, ortak banyo, lokal hava, Rp 80-120K",
            icon: "⭐⭐",
          },
          {
            name: "Liveaboard Dive Boats",
            description: "Teknede kalınma, Bomba ve Togean around dalış turları, tüm dahil paket, 7+ gün turlar popüler",
            icon: "⚓",
          },
          {
            name: "Shared Dorm & Backpacker",
            description: "Gençlik hosteli, paylaşımlı odalar, sosyal ortam, tur organizasyonu, Rp 60-100K",
            icon: "⭐⭐",
          },
          {
            name: "Private Villas & Upscale Bungalows",
            description: "Özel tasarım, tam hizmetli, özel plaj erişimi, lüks dekor, privat havuz bazı villalarda",
            icon: "⭐⭐⭐⭐⭐",
          },
        ],
        alisveris: [
          {
            name: "Wakai Market (Pasar Wakai)",
            description: "Ana merkez pazarı, taze balık, meyve, sebze, baharatlı, lokal yiyecekler, sabah erken saatlerde en iyi",
          },
          {
            name: "Resort Souvenir Shops",
            description: "Resort'lerde hediyelik eşyalar, lokal sanatlar, Togean t-shirtleri, plaj aksesuarları",
          },
          {
            name: "Beach Shops & Rental",
            description: "Kumsal yakınında dükkanlar, dalış ekipmanı kiralama, flippers, snorkel, ıslak elbise",
          },
          {
            name: "Lokal Crafts & Artisans",
            description: "El yapımı kordonalar, shell dekorasyonlar, Bajo halkı tarafından yapılmış, authentic hediye",
          },
          {
            name: "Island Convenience Stores",
            description: "Adalar üzerinde temel erzak, su, snack, tütün, lokal fiyata kıyasla yüksek fiyatlar",
          },
        ],
        konaklamaSuresi: "3-7 gün",
        konaklamaBudgeti: "700-1900 USD",
        onemliNotlar: "⚠️ TOGEAN ADALARI BİLGİSİ: Erişim - Ampana'dan feribat (4 saat, Rp 40,000) veya speedboat (40 dk, Rp 150,000). En iyi sezon - Haziran-Eylül (kuru), Aralık-Şubat (yağmurlu). Uyarılar - Sınırlı altyapı, lokal rehber tavsiye edilir, nakit zorunlu (ATM olmayabilir), dalış mevsiminde güçlü akıntılar. Çevre - Mercan resifi hassas, eko-turizm duyarlı davranış beklenir. Paket turlar - Liveaboard 7-10 gün popüler (dalış meraklıları). Para birimi - IDR (Rupiah), resort yemek dahil paket önerilir.",
      },
    },
    sumatra: {
      "bukit-lawang": {
        name: "Bukit Lawang",
        island: "Sumatra",
        description:
          "Bukit Lawang, Gunung Leuser Milli Parkı'nın doğu girişinde, orangutan gözlemi ve yağmur ormanı trekkingiyle ünlü bir köy. UNESCO Dünya Mirası tropik ormanlarının kapısı, Sumatra orangutanı ve zengin biyoçeşitliliğiyle doğa severler için eşsiz bir destinasyon.",
        images: [
          getImageUrl("https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200", 'sumatra-bukitlawang-img0'),
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800", 'sumatra-bukitlawang-img1'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'sumatra-bukitlawang-img2'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Orangutan Gözlem Trekkingi",
            description: "Rehberli orman yürüyüşleriyle yarı-yabani ve vahşi orangutanları doğal ortamında gözlemleme. 1-3 günlük turlar yaygın.",
          },
          {
            name: "Bat Cave (Yarasa Mağarası)",
            description: "Köyün dışında, el feneriyle gezilebilen büyük mağara. Yarasalar ve ilginç kaya oluşumları.",
          },
          {
            name: "Landak Nehri ve Borohok Nehri",
            description: "Köyü çevreleyen nehirler, yüzme, tubing (lastik botla nehirde sürüklenme) ve serinleme için popüler.",
          },
          {
            name: "Jungle Trekking Giriş Noktası",
            description: "Gunung Leuser Milli Parkı'na açılan ana giriş, trekking ve rehberli turların başlangıç noktası.",
          },
          {
            name: "Köy Merkezi ve Nehir Kenarı",
            description: "Küçük dükkanlar, kafeler, konukevleri ve nehir manzaralı yürüyüş yolları.",
          },
          {
            name: "Şelaleler ve Doğa Yürüyüşleri",
            description: "Ormanda rehberle ulaşılabilen küçük şelaleler ve doğal havuzlar.",
          },
          {
            name: "Cuma Pazarı ve Pirinç Tarlaları",
            description: "Köyde haftalık pazar, yerel ürünler ve çevredeki pirinç tarlalarında yürüyüş imkanı.",
          },
        ],
        aktiviteler: [
          {
            name: "Orangutan Gözlem Trekkingi",
            description: "Rehberli orman yürüyüşleriyle yarı-yabani ve vahşi orangutanları doğal ortamında gözlemleme; genellikle sabah ve öğleden sonra turlar düzenlenir.",
            icon: "🐒",
            uyari: "Hayvanları beslemeyin; rehberinizin talimatlarına uyun ve en az 10 metre mesafe bırakın."
          },
          {
            name: "Wildlife & Kuş Gözlemi",
            description: "Gibbons, Thomas leaf monkey ve çeşitli kuş türleri için rehberli kısa yürüyüşler ve fotoğraf turları.",
            icon: "🦜",
          },
          {
            name: "Jungle Treks (1-3 gün)",
            description: "1-3 günlük rehberli kamp turları; daha uzun (7-10 gün) rotalar için tecrübe gereklidir.",
            icon: "🥾",
            uyari: "Yağmur sezonunda rota zorlukları ve sel riski artar; resmi rehber ve izin zorunlu olabilir."
          },
          {
            name: "Tubing (Nehirde lastik tüpler)",
            description: "Köy boyunca nehirde tubing/popüler eğlence; genellikle ucuz (ör: ~Rp 10,000/tube).",
            icon: "🛶",
            uyari: "Akıntılar güçlü olabilir; köprünün ötesine gitmeyin ve can yeleği/rehber önerisine uyun."
          },
          {
            name: "Rafting (Alas/Bohorok Nehri)",
            description: "Hafif-orta zorlukta rafting seçenekleri; bazı turlar Ketembe çevresinde düzenlenir.",
            icon: "🚣",
            uyari: "Rehber ve ekipman kontrolü yapın; su seviyeleri mevsime göre değişir."
          },
          {
            name: "Bat Cave (Yarasa Mağarası)",
            description: "Fenerle keşfedilebilen mağara; küçük giriş ücreti olabilir, rehber önerilir.",
            icon: "🦇",
          },
          {
            name: "Şelaleler ve Doğa Yürüyüşleri",
            description: "Ormanda rehberle erişilen küçük şelaleler ve doğal havuzlar; fotoğraf ve serinleme için ideal.",
            icon: "🌿",
          },
          {
            name: "Tangkahan - Fil Kampı Ziyareti",
            description: "Günlük veya konaklamalı ziyaretler için popüler; fil izleme ve yerel koruma projeleri.",
            icon: "🐘",
          },
          {
            name: "Sıcak Su Kaynakları (Kısa Ekstra Rota)",
            description: "Uzun treklere eklenebilen doğal sıcak su kaynakları (özellikle Ketembe çevresinde).",
            icon: "♨️",
          },
          {
            name: "Köy Turları, Pazarlar ve Gönüllülük",
            description: "Cuma pazarı, köy içi yürüyüşler, 'We Care' tipi sosyal projelere katılım ve yerel kültür etkileşimi.",
            icon: "🤝",
          }
        ],
        yiyecekIcecekler: [
          {
            name: "Tipik Yemekler",
            description: "Nasi Goreng, Gado-Gado, tempe (ve rendang gibi yerel et yemekleri), banana pancake ve diğer yerel lezzetler yaygındır.",
          },
          {
            name: "İçecekler",
            description: "Taze meyve suyu ve hindistancevizi suyu çok yaygın; kahve/çay ve yerel bira seçenekleri de bulunmaktadır.",
          },
          {
            name: "Konukevleri & Trek Yemekleri",
            description: "Çoğu guesthouse ve trekking operatörü yemek sağlar; uzun turlara çıkmadan önce öğün düzenini ve diyet tercihlerini doğrulayın.",
          },
          {
            name: "Hijyen & Pratik Notlar",
            description: "Düşük sezonda bazı dükkanlar kapalı olabilir; ambalajsız veya bilinmeyen içeceklerden kaçının ve su için filtre/arıtma seçenekleri düşünün.",
          },
          {
            name: "Vejetaryen & Vegan",
            description: "Bazı işletmelerde vejetaryen/vegan alternatifler bulunur; özel ihtiyaçlarınızı önceden belirtmek faydalıdır.",
          },
        ],
        konaklama: [
          { name: "Backpacker Bungalows", description: "Nehrin kenarında ekonomik bungalovlar ve hosteller." },
          { name: "Mid-Range Guesthouses", description: "Konforlu odalar, rehber ve tur organizasyonu sunar." },
          { name: "Eco-Lodges (Sınırlı)", description: "Ormana daha yakın, doğal ortam deneyimi sunan küçük tesisler." },
          { name: "Riverfront Bungalows", description: "Nehir kenarında manzara sunan bungalow ve guesthouselar; trekking başlangıçlarına yakın." },
          { name: "Treetop Chalets", description: "Ağaç üstü veya yüksek konaklama seçenekleri; doğa odaklı bir deneyim sunar." },
          { name: "Camping & Backcountry", description: "Rehberli trekking kampları ve backcountry konaklama seçenekleri; izin ve rehber gerektirebilir." },
          { name: "Volunteer / Homestays", description: "Gönüllülük projeleri ve yerel homestay seçenekleri; uzun süreli veya düşük maliyetli konaklama sağlar." },
          { name: "Nearby Alternatives (Tangkahan, Ketambe)", description: "Yakın bölgelerde alternatif konaklama ve aktiviteler (fil kampı, farklı trekking rotaları)." },
        ],
        alisveris: [
          {
            name: "Küçük Hediyelik Dükkanlar",
            description: "Bambu ürünleri, el işi boncuklar, aksesuarlar ve basit turistik hediyelikler; genellikle nehir kenarında küçük dükkanlarda satılır.",
          },
          {
            name: "Batik & Ahşap Oymacılığı",
            description: "Yerel batik parçaları, ahşap oymalar ve el işi dekoratif ürünler; atölyelerden direkt alım mümkün olabilir.",
          },
          {
            name: "Haftalık Pazarlar",
            description: "Cuma/hafta sonu pazarlarında taze meyve, yöresel yiyecekler ve el yapımı ürünler bulunur; ziyaret tarihine göre değişir.",
          },
          {
            name: "Mini-market / Convenience",
            description: "Su, atıştırmalık, temel malzemeleri satan küçük marketler; geniş stok için Kutacane veya daha büyük merkezlere gitmek gerekebilir.",
          },
          {
            name: "İkinci El Kitapçılar",
            description: "Turistlere yönelik ikinci el ve seyahat kitapları satan küçük kitapçılar zaman zaman bulunur.",
          },
          {
            name: "Guesthouse & Tur Stantları",
            description: "Konukevleri genellikle tur rezervasyonları, rehber ve bazı temel hediyelikler sağlar; günlük tur bilgilerinin satıldığı yerler.",
          },
          {
            name: "Yakın Alternatifler (Kutacane / Tangkahan)",
            description: "Yakın kasabalarda daha geniş alışveriş seçenekleri, ekipman ve marketler bulunur; özellikle trekking ekipmanı gerekiyorsa alternatiflere bakın.",
          },
        ],
        konaklamaSuresi: "1-4 gün",
        konaklamaBudgeti: "600-1400 USD",
        onemliNotlar: "⚠️ Trekler için resmi rehber kullanın, milli park izni gerekebilir. Yağmur sezonunda (Ekim-Mart) sel riski ve diğer tehlikelere karşı dikkatli olun.",
      },
      "lake-toba": {
        name: "Lake Toba",
        island: "Sumatra",
        description:
          "Toba Gölü, dünyanın en büyük volkanik gölü ve UNESCO Global Geopark. Ortasında Samosir Adası (ada içinde ada) ile muhteşem doğal görünüm. Toba Batak kültürü, geleneksel yemekler, orman trekking ve rahatlama için ideal destinasyon. Banana Pancake Trail'de popüler.",
        images: [
          getImageUrl("https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=1200", 'sumatra-laketoba-img0'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'sumatra-laketoba-img1'),
          getImageUrl("https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800", 'sumatra-laketoba-img2'),
          getImageUrl("https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800", 'sumatra-laketoba-img3'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Samosir Island",
            description: "Gölün ortasında ada içinde ada, ferry ile Parapat'tan erişim, Tuktuk kasabası merkez",
          },
          {
            name: "Tuk-Tuk Town",
            description: "Samosir'deki ana turist merkezi, resepsiyon, otelciler, restoran ve barlar",
          },
          {
            name: "Batak King Tombs",
            description: "Geçmiş Batak krallık mezarları ve anıtları, tarihî yapılar, monümentler",
          },
          {
            name: "Stone Monuments",
            description: "Geleneksel Batak taş oymacılığı, kral heykelleri, kültür mirası",
          },
          {
            name: "Traditional Batak Houses",
            description: "Geleneksel Batak ev mimarisi, müzesi, kültürü öğrenme",
          },
          {
            name: "Parapat Town",
            description: "Göl kenarında ana şehir, ulaştırma merkezi, ticari bölge, pazar",
          },
          {
            name: "Teobat Museum",
            description: "Wayang kulit, maskeleri, gamelan enstrümanları, Batak kültür müzesi",
          },
          {
            name: "Pine Forests Around Lake",
            description: "Gölü çevreleyen çam ormanları, trekking, manzara, fotoğraf",
          },
          {
            name: "Tele Observation Tower",
            description: "Gölün 360° panoramik manzarası, tepe noktası, en iyi görüntü noktası",
          },
          {
            name: "Aek Tano Ponggol Bridge",
            description: "Önemli tarihî köprü, doğal yapı, manzara noktası, fotoğraf",
          },
        ],
        aktiviteler: [
          {
            name: "Bicycle Touring",
            description: "Samosir'de bisiklet kiralama ve ada turu, lokal yolları keşfetme",
            icon: "🚴",
          },
          {
            name: "Lake Swimming & Bathing",
            description: "Volkanik gölde yüzme, sıcak su, lokal alanlarda erişim, güvenli bölgeler",
            icon: "🏊",
          },
          {
            name: "Overnight Party Boat Tour",
            description: "Göl üzerinde gece teknesi turu, balık tutma, müzik, sosyal etkinlik",
            icon: "⛵",
          },
          {
            name: "Jungle Trekking",
            description: "Gölü çevreleyen orman trekking, yağmun ormanı, lokal rehber zorunlu",
            icon: "🥾",
          },
          {
            name: "Traditional Batak Dance Show",
            description: "Bagus Bay Restoran'da Çarşamba ve Cumartesi (20:15+) geleneksel Batak dansı",
            icon: "💃",
          },
          {
            name: "Photography & Scenic Views",
            description: "360° gölün manzarası, dağ tepeleri, gün batımı, fotoğraf noktaları",
            icon: "📸",
          },
          {
            name: "Cultural Village Visit",
            description: "Toba Batak köyleri ziyareti, ev zanaatları, geleneksel yaşam gözlemleme",
            icon: "🤝",
          },
          {
            name: "Sunrise & Sunset Tour",
            description: "Gölde gün doğumu ve gün batımı türü, manzara fotoğrafçılığı, lokal tekne ile",
            icon: "🌅",
          },
          {
            name: "Watersports & Kayaking",
            description: "Kano, hafif su sporları, lokal rehber ile kayaking turu, gölün sakin bölgelerinde",
            icon: "🛶",
          },
        ],
        yiyecekIcecekler: {
          "Batak Specialties": [
            {
              name: "Arsik Carp (Arsik)",
              description: "Sazan balığı ana malzeme, baharatlandırılmış, odun ateşinde pişirilmiş, ayırt edici aroma",
            },
            {
              name: "Naniura",
              description: "Sazan balığı, tuzlanmış, lime suyu ile marineli, özel baharatlı sosu ile demlenmeli",
            },
            {
              name: "Babi Panggang Karo (BPK)",
              description: "Toba Batak'ın sevdiği yağlı domuz marineli eti, geleneksel piknik yemeği",
            },
            {
              name: "Tinutuan",
              description: "Pirinç porridge, geleneksel kahvaltı, soğan, tuz, kuru biber ile servis",
            },
            {
              name: "Soto Batak",
              description: "Geleneksel Batak çorbası, özel baharat sosu, et parçaları, lokal favori",
            },
            {
              name: "Pulut Kuning",
              description: "Sarı yapışkan pirinç, geleneksel yemek, hindistanceviz ve turmeric ile",
            },
            {
              name: "Ikan Asin",
              description: "Tuzlu balık, lokal spesiyalitesi, kurutulmuş balık, stoğa uzun ömürlü",
            },
          ],
          "Snacks & Desserts": [
            {
              name: "Tipa-Tipa",
              description: "Eski pirinçten yapılmış snack, iki gün ıslatılmış sonra kavrulmuş, altın kahverengi",
            },
            {
              name: "Itak Gurgur",
              description: "Geleneksel Batak event snack'i, el şekilli, kızarmış, içinde eriyen kahverengi şeker",
            },
          ],
          "Drinks": [
            {
              name: "Tuak",
              description: "Geleneksel Batak içkisi, şeker palmu ağacından yapılmış, Marco Polo tarafından yazılmış",
            },
            {
              name: "Fresh Fruit Juice",
              description: "Tropikal meyve suyu, papaya, mango, ananas, lokal pazarlarda taze sıkılmış",
            },
          ],
        },
        konaklama: [
          {
            name: "Mid-Range Hotels & Resorts",
            description: "Tuk-Tuk ve Parapat'ta otelciler, iyi hizmet, bisiklet kiralama, tur organizasyonu",
            icon: "⭐⭐⭐⭐",
          },
          {
            name: "Budget Guesthouses & Cottages",
            description: "Basit konukevi, Samosir'deki local homestays, ev aşçısı, sosyal ortam",
            icon: "⭐⭐⭐",
          },
          {
            name: "Lakefront Bungalows",
            description: "Gölü göz önüne alan bungalow, manzara, doğa erişimi, balkon/teras",
            icon: "⭐⭐⭐⭐",
          },
          {
            name: "Backpacker Hostels",
            description: "Gençlik hostel, paylaşımlı odalar, sosyal alanlar, tur bilgileri",
            icon: "⭐⭐",
          },
          {
            name: "Luxury Resorts & Island Bungalows",
            description: "Özel ada resortları, yüksek hizmet, özel plaj erişimi, gölü göz önüne alan lüks konaklama",
            icon: "⭐⭐⭐⭐⭐",
          },
        ],
        alisveris: [
          {
            name: "Parapat Market (Pasar Parapat)",
            description: "Ana pazarı, lokal yiyecekler, balık, meyve, sebze, baharatlı ürünler",
          },
          {
            name: "Tuk-Tuk Main Street",
            description: "Turist dükkanları, hediyelik eşya, batik, lokal sanatlar, sörvenir",
          },
          {
            name: "Souvenir Shops",
            description: "Batak ev modelleri, ahşap oyma, tekstil, geleneksel çalışma",
          },
          {
            name: "Second-Hand Book Shops",
            description: "Tuk-Tuk'de bol bol eski kitapçı, seyahat kütüphanesi, okuma malzemesi paylaşımı",
          },
          {
            name: "Bicycle Rental Shops",
            description: "Bisiklet kiralama, lokal fiyat Rp 100,000, tüm Samosir'de merkez",
          },
        ],
        konaklamaSuresi: "2-7 gün",
        konaklamaBudgeti: "300-900 USD",
        onemliNotlar: "⚠️ LAKE TOBA BİLGİSİ: Erişim - Medan'dan otobüs/araba (3-4 saat), Silangit Havaalanı (uçak). Samosir Adası'na Parapat'tan ferry (Rp 25,000 lokal fiyat). En iyi sezon - Haziran-Eylül (kuru). Çin Yılı'nda turist yoğunluğu, fiyatlar yüksek. Yüzme - Gölün tüm bölgeleri güvenli değil, lokal tavsiye alın (balık çiftliklerinden kirlenmiş bölgeler var). Hava - Banana Pancake Trail'de rahat dinlenme noktası. Kitap - Tuk-Tuk'te bol eski kitap mağazası (hikaye okuması ücretsiz). Harita - Basit el çizimi haritalar otellerde mevcut.",
      },
      "mentawai": {
        name: "Mentawai Islands",
        island: "Sumatra",
        description:
          "Mentawai Adaları, dünyaca ünlü sörf noktaları, bakir mercan resifleri ve yağmur ormanlarıyla dikkat çeken bir adalar zinciridir. Özellikle sörfçüler için liveaboard ve surf camp seçenekleri ile tatil amaçlı ziyaret edilir.",
        images: [
          getImageUrl("https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=1200", 'sumatra-mentawai-img0'),
          getImageUrl("https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800", 'sumatra-mentawai-img1'),
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Beng Beng",
            description: "Çok tutarlı ve dünya çapında ünlü bir sol dalga; en kolay sörflenebilen dalgalardan biri. En derin ve güvenli spot; çoğu sörf kampı burada yer alır.",
          },
          {
            name: "E-Bay",
            description: "Kalkışta barrel yapan, hollow sol dalga. Deneyimli sörfçüler için ideal; güçlü ve hızlı dalgalar. Sahnesi inanılmaz derecede güzel.",
          },
          {
            name: "Pitstops",
            description: "E-Bay'in sağında kısa bir sağ dalga. Yüksek performanslı, kullanışlı bir dalga; çoğu zaman en tutarlı spot.",
          },
          {
            name: "Nipussi (Pussies)",
            description: "Kısa sağ dalga. Eğlenceli ve sörflenebilir; swell az olduğunda iyi bir seçenek.",
          },
          {
            name: "Hinako Islands (Asu & Bawa)",
            description: "Mentawai'nin yakınındaki iki ada, tutarlı ve dünya çapında kaliteli dalgalarla ünlü. Liveaboard turlarıyla erişilir.",
          },
          {
            name: "Siberut Adası",
            description: "Mentawai archipelagosunun en büyük adası. Yağmun ormanları, trekking ve Mentawai kabilesi geleneksel yaşamı.",
          },
          {
            name: "Mentawai Yerli Köyleri",
            description: "Mentawai kabile kültürü ve geleneksel 'uma' evleri (bambu/ahşap yapılar). Kültürel ziyaretler rehberli olarak düzenlenir (~500€, 3-4 gün).",
          },
          {
            name: "Sipora Adası",
            description: "Sörf kampları ve turist merkezlerinin çoğunun bulunduğu ada. Tuapejat Town ana liman ve merkezi.",
          },
          {
            name: "North Pagai Adası",
            description: "Mentawai archipelagosunun kuzey adası. Daha az kalabalık, doğal plajlar ve bazı sörf kampları.",
          },
          {
            name: "South Pagai Adası",
            description: "Mentawai archipelagosunun güney adası. Endemik türler ve tropik yaşamı. Liveaboard turu destinasyonu.",
          },
          {
            name: "Mercan Resifleri & Dalış Alanları",
            description: "Mentawai çevresinde sağlam mercan bahçeleri. Şnorkeling ve dalış turları sörf kamplarından organize edilir.",
          },
          {
            name: "Boş Plajlar & Sayılı Adacıklar",
            description: "İssız koylar, beyaz kumlu plajlar ve mavi sular. Tekne turları ve island hopping deneyimleri.",
          },
        ],
        aktiviteler: [
          { name: "Sörf", description: "Dünya çapında ünlü dalga noktaları: Beng Beng, E-Bay, Pitstops, Nipussi, Hinako Islands vb. Başlangıç seviyesinden ileri seviyeye kadar çeşitli spot ve sörf kampları.", icon: "🏄" },
          { name: "Ada ve Plaj Keşfi", description: "Issız koylar, beyaz kumlu plajlar ve turquoise sular. Adalar arası keşif turları ve private plaj deneyimleri.", icon: "🏝️" },
          { name: "Şnorkel", description: "Mercan resifleri, tropikal balıklar, kaplumbağalar ve deniz yaşamı. Sörf kampları tarafından organize edilen şnorkel turları.", icon: "🤿" },
          { name: "Tüplü Dalış ve Serbest Dalış", description: "Belirli bölgelerde rehberli veya resort organizasyonlu dalış. Mercan bahçeleri ve deniz yaşamı keşfi.", icon: "🏊" },
          { name: "Kano ve Stand Up Paddle (SUP)", description: "Lagünler ve sakin sularında kano ve paddleboard deneyimleri. Mangrove ormanları arasında geziler.", icon: "🛶" },
          { name: "Balık Tutma", description: "Kıyı balıkçılığı, açık deniz balık tutma ve yerel balıkçılık yöntemleri. Lokal balıkçılarla deneyim.", icon: "🎣" },
          { name: "Mentawai Yerli Kültürü", description: "Siberut Adası, uma evleri ve geleneksel yaşam deneyimi. Kabile ziyaretleri ve kültürel programlar (rehberli, 500€ civarında).", icon: "🤝" },
          { name: "Orman Yürüyüşleri & Jungle Trekking", description: "Tropikal yağmun ormanları, rehberli turlar, endemik bitki ve hayvan türleri gözlemi.", icon: "🥾" },
          { name: "Vahşi Yaşam Gözlemi", description: "Endemik türler ve tropikal fauna. Siberut Milli Parkı'nda doğa gözlemleme turları.", icon: "🦜" },
          { name: "Fotoğraf ve Video Çekimi", description: "Doğa, kültür, sörf, drone çekimleri. Profesyonel fotograflar için ideal konum.", icon: "📸" },
          { name: "Yoga ve Meditasyon", description: "Sörf kampları ve resortlarda yoga dersleri, meditasyon seansları ve wellness programları.", icon: "🧘" },
          { name: "Dijital Detoks & Doğada İnziva", description: "Teknolojisiz tatil, doğada inziva ve wellness retreati. Yoga, meditasyon ve self-discovery programları.", icon: "🌿" },
          { name: "Tekne Turları & Island Hopping", description: "Liveaboard tekne turları, özel tekne kiralama ve adalar arası geziler. Sörf spotlarına doğrudan erişim.", icon: "⛵" },
        ],
        konaklama: [
          { name: "★☆☆ Budget Guesthouses", description: "Tuapejat, Sikakap kasabalarında basit konukevler. Paylaşılan banyo, fan, temel olanaklar. İdeal: Bütçe gezginleri, yerel yaşam deneyimi." },
          { name: "★★☆ Temel Sörf Kampları", description: "Basit ancak temiz bungalow stilinde odalar. Paylaşılan alanlar, komünal yemek servisi. Sörf dersleri dahil. İdeal: Sörf öğreniyorler, sosyal atmosfer arayanlar." },
          { name: "★★★ Apart Oteller & Orta Düzey Sörf Resortları", description: "Özel banyolu odalar, TV, klima, WiFi. Yemek servisi, yoga dersleri, spa hizmetleri. İdeal: Konfor isteyen sörf turistleri, aile tatilleri." },
          { name: "★★★★ Havuzlu Boutique Resortlar", description: "Tasarımcı bungalovlar, özel havuz, sea view. Özel yemek servisi, wellness center, profesyonel sörf rehberliği. İdeal: Lüks arayan, premium sörf deneyimi." },
          { name: "★★★★ Özel Villalar (Havuzlu)", description: "Private veranda, indoors-outdoor shower, özel havuz veya beach access. Şef servisi, butler hizmeti. İdeal: Honeymoon, private retreat, VIP tatili." },
          { name: "★★★★★ Lüks Island Resort", description: "5-yıldızlı ameniteler: spa, fine dining, water sports, yoga, detox programları. Özel plaj, water villa seçenekleri. İdeal: Ultra-lüks, eksklusif tatil." },
          { name: "Liveaboard Boat Charters", description: "7-14 gün turlar. Sörf spotlarında konaklama, open deck, gourmet yemek, krew servisi. Tüm ameniteler dahil. İdeal: Sörf turizmi, adalar arasında dolaşma." },
          { name: "Eco-Luxury Bungalows", description: "Doğa dostu malzemeleriyle yapılmış, havuzsuz ancak şık bungalovlar. Yoga, meditasyon, wellness retreatı. İdeal: Wellness tatili, doğa sevenler." },
        ],
        konaklamaSuresi: "3-14 gün",
        konaklamaBudgeti: "1500-3500 USD",
        yiyecekIcecekler: {
          "Sörf Kampı & Liveaboard Yemekleri": [
            { name: "Sörf Kampı Breakfast", description: "Yumurta, pilav, meyveler, çay ve kahve. Enerji dolu başlangıç." },
            { name: "Liveaboard Öğle Yemeği", description: "Taze balık, sebzeler, pilav. Denizde pişirilen sağlıklı yemekler." },
            { name: "Akşam Barbekü & Grilleme", description: "Balık, karides ve oktopu barbekü. Sosyal ve keyifli deneyim." },
          ],
          "Lokal Endonez Mutfağı": [
            { name: "Ikan Bakar (Grilled Fish)", description: "Taze yerel balık, baharat ve limon ile grilleme. Mentawai'nin en popüler yemeği." },
            { name: "Nasi Goreng", description: "Baharatlı, yumurtalı kızarmış pilav. Yerel malzamelerle hazırlanan lezzetli versiyon." },
            { name: "Sambal & Condiments", description: "Yerel baharat çeşitleri, kırmızı biber sosu ve taze malzemelerle hazırlanan sauceler." },
            { name: "Soto Ikan (Balık Çorbası)", description: "Zencefil, kunyit ve baharatlarla pişirilen geleneksel balık çorbası." },
            { name: "Lumpia", description: "Kızarmış yay rulo, dışarıda çıkışkanken oyuncu tadında." },
            { name: "Tahu Goreng & Tempeh", description: "Tofu ve tempeh kızartması, lokal lezzetlerle servis." },
          ],
          "Taze Deniz Ürünleri & Balıkçılık": [
            { name: "Fresh Seafood Selection", description: "Günün tutumu: taze balık, karides, istakoz, yengec, mürekkepbalığı vb." },
            { name: "Ceviche-Style Preparation", description: "Taze balık, limon, kokos ve baharatlı deniz ürünü salatası." },
            { name: "Grilled Prawns & Lobster", description: "Taze karides ve istakoz, tereyağlı baharat sosuyla grilleme." },
            { name: "Fish Curry", description: "Hindistan cevizi ve yerel baharat çeşitleriyle pişirilen balık kurrisi." },
          ],
          "Meyve & Atıştırmalıklar": [
            { name: "Tropikal Meyveler", description: "Mango, ananas, papaya, dragon fruit, kokos. Taze ve serinletici." },
            { name: "Coconut Fresh", description: "Taze kokos içeceği doğrudan kokos kabuğundan. Doğal elektrolit ve ferahlık." },
            { name: "Pisang Goreng (Kızarmış Muz)", description: "Tatlı muz, tatlı sosla servis. Popüler tatlı snack." },
            { name: "Peanut Snacks", description: "Fıstık çıtırlığı ve yerel kuru meyveler." },
          ],
          "Içecekler": [
            { name: "Süt Çayı & Kopi Lokal", description: "Güçlü, tatlı lokal kahve ve çay. Sörf kamplarında sabah başlangıcı." },
            { name: "Fresh Juices", description: "Mango, ananas, watermelon, papaya suyu. Doğal ve serinletici." },
            { name: "Herbal & Ginger Drinks", description: "Zencefil çayı, kunyit (turmeric) içeceği, bitki çayları." },
            { name: "Bottled Water & Coconut", description: "Aman içme suyu ve taze kokos suyu." },
            { name: "Meyve Kokteylleri", description: "Tropikal meyve karışımı, taze sıkılmış ve buz ile serinletici kokteyl deneyimi." },
            { name: "Boba Tea (Bubble Tea)", description: "Tatlı çay, boba incir ve serinletici içecek kombinasyonu. Modern kafe seçeneği." },
            { name: "Milkshake & Smoothie", description: "Meyve, muz ve süt karışımı. Tatlı, besleyici ve doyurucu içecek." },
          ],
          "Vegan & Vejetaryen Seçenekler": [
            { name: "Gado-Gado", description: "Sebze karışımı, peanut sauce ile servis. Doyurucu ve lezzetli." },
            { name: "Nasi Kuning (Sarı Pilav)", description: "Kunyit ve kokos sütüyle hazırlanan renkli pilav." },
            { name: "Vegetable Stir-fry", description: "Taze sebzeler, baharatlı sauceyla kızartma." },
            { name: "Pecel Sayur", description: "Sebze salatası, peanut sauce ve baharatlı sosis/protein alternatifiyle." },
          ],
          "Batı Mutfağı & International": [
            { name: "Western Breakfast", description: "Bazı sörf kamplarında kahvaltı seçeneği: omlet, tost, tereyağ, reçel." },
            { name: "Pasta & Pizza", description: "Sınırlı seçenekte, bazı daha yüksek fiyatlı sörf resortlarında mevcut." },
            { name: "Vegetable Wraps & Salads", description: "Sebze ve mozzarella dolgulu wrap ve taze salata seçenekleri." },
          ],
          "Özel Deneyimler": [
            { name: "Malaikat Balık Yemekli Tekne Gezileri", description: "Tekne turlarında pişirilen balık yemekleri ve açık deniz öğle yemeği." },
            { name: "Beach Picnic Lunch", description: "Plaj pikniği, taze yiyecekler ve şnorkellem arası öğle yemeği." },
            { name: "Lokal Kah Ev Kahvaltısı", description: "Yerel ailelerin evinde geleneksel kahvaltı deneyimi (rehberli turlar)." },
          ],
        },
        alisveris: [
          { name: "Lokal El Sanatları & Souvenirler", description: "Mentawai kabilesi tarafından yapılmış ahşap oymaları, dönerli takılar, geleneksel talisman ve sanat eserleri." },
          { name: "Kabileden El Yapımı Ürünler", description: "Siberut Adası'ndaki Mentawai kabilesinden satın alınan dokuma, boncuk işleri ve geleneksel el sanatları." },
          { name: "Surf Gear & Rash Guards", description: "Sörf kamplarında ve resort boutiklerinde sörf tahtaları, rash guard, surf wax ve diğer sörf malzemeleri." },
          { name: "Bikini & Plaj Giysileri", description: "Lokal tasarımcılar tarafından yapılmış bikini, plaj elbisesi ve mayo seçenekleri." },
          { name: "Yerel Pazarlar", description: "Tuapejat ve Sikakap kasabalarındaki pazarlarda taze meyve, baharat, lokal ürünler ve temel malzemeler." },
          { name: "Yoga & Wellness Ürünleri", description: "Yoga matı, meditasyon patikaları, essansiyel yağlar ve doğal wellness ürünleri." },
          { name: "Fotoğraf Kartpostalları & Hediyeler", description: "Mentawai Adaları'nın manzarasını çeken kartpostallar, broşürler ve hatıra ürünleri." },
          { name: "Eco-Friendly Products", description: "Sürdürülebilir ürünler, bambu malzemeler, organik güzellik ürünleri ve doğa dostu hediyelikler." },
        ],
        onemliNotlar: "⚠️ GÜVENLİK: Mentawai Adaları Sunda megathrust üzerinde bulunduğu için deprem ve tsunami riski taşır. Ulaşım: Padang'dan Mentawai Fast Ferry ile ulaşılır (hava koşuluna göre iptal olabilir); seaplane de mevcut. Feri seferleri düzensiz olduğu için Instagram/konaklama ile güncel bilgi alın. SÖRF: Tüm dalgalar keskin mercan resifleri üzerinde kırılır—SADECE deneyimli sörfçüler uygun. Cam ve kesik riskleri yüksek. ESNEKLIK: Hava koşulları nedeniyle geri dönüş günü için uçak biletleri aynı gün almayın.",
      },
      "bukittinggi": {
        name: "Bukittinggi",
        island: "Sumatra",
        description: "Bukittinggi, Minangkabau Yüksek Platosunda bulunan ve 930m yüksekliğindeki serinlemeli dağ şehridir. Tarihi tapınaklar, kanyon, geleneksel mimarisi ve canlı pazarlarıyla meşhurdur.",
        images: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=1200",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Sianok Canyon (Ngarai Sianok)",
            description: "Bukittinggi'nin kalbindeki büyüleyici kanyon. Açık ve koyu yeşil sularıyla ünlü, yürüyüş rotaları ve manzara noktaları mevcut. Gün batımında yarasaların göç hareketi izlenebilir.",
          },
          {
            name: "Japanese Caves (Lubang Jepang)",
            description: "II. Dünya Savaşı sırasında Japonlar tarafından inşa edilen yeraltı tünel ve bunker sistemi. Tarih meraklıları için rehberli turlar mevcut. Giriş: Rp25.000, rehber: Rp70.000.",
          },
          {
            name: "Fort de Kock",
            description: "Hollandalılar tarafından 1825'te kurulan tarihi kale. Bundo Kanduang Parkı, Minangkabau Müzesi, Rum Gadang (geleneksel ev) replika ve mini hayvanat bahçesi ile birlikte.",
          },
          {
            name: "Clock Tower (Jam Gadang)",
            description: "Bukittinggi'nin simgesi ve merkez noktası. 1926'da inşa edilen saatli kule, Pasar Ateh (ana pazar) yakınında yer alır. Şehrin en fotoğrafik noktası.",
          },
          {
            name: "House of Bung Hatta",
            description: "Endonezya'nın ilk başkan yardımcısı Mohammad Hatta'nın doğum evi. Ücretsiz ziyaret, Endonezya tarihi hakkında bilgi.",
          },
          {
            name: "Lake Maninjau (Danau Maninjau)",
            description: "Bukittinggi'den 45 km batıda bulunan güzel dağ gölü. Tur paketleri: 8 saat, Rp250.000-450.000. Puncak Lawang, '44 turns' hairpin bends ve panoramik manzaralar.",
          },
          {
            name: "Harau Valley",
            description: "Bukittinggi'nin doğusunda, Payakumbuh'dan 1 saat uzakta. Pirinç tarlalarıyla çevrili kum taşı uçurumlar, şelaleler ve rock climbing noktaları.",
          },
          {
            name: "Pagaruyung Royal Palace",
            description: "Minangkabau turunda ziyaret edilen, geleneksel Minangkabau mimarisinin örneği olan kral sarayı.",
          },
          {
            name: "Pandai Sikek Handcrafts",
            description: "El yapımı dokuma (kain songket), ahşap ve bambu oyma sanat eserleri yapılan köy. Doğrudan ustalardan satın alma imkanı.",
          },
          {
            name: "Equator Monument (Bonjol)",
            description: "Bukittinggi'nin kuzeydoğusunda, ekvatorun işaretlendiği monument. Fotoğraf çekimi için popüler, hem yarımküre bulunan tek yer.",
          },
        ],
        aktiviteler: [
          { name: "Trekking & Hiking", description: "Sianok Canyon, Harau Valley ve çevre dağlarda rehberli veya bireysel yürüyüş turları.", icon: "🥾" },
          { name: "Volkan Tırmanışı", description: "Singgalang (inaktif), Marapi (aktif), Tandikek, Talang gibi 2500m+ volkanların tırmanış rotaları. Rehberli turlar, 1-2 gün.", icon: "🌋" },
          { name: "Rafting & Kayaking", description: "Kuantan River, Anai River, Sinama River gibi nehirlerde seviye 2-5 raftingi mevcut.", icon: "🚣" },
          { name: "Rock Climbing", description: "Baso, Harau Valley ve Sijunjuang'da climb rotaları (5.8-5.14, 20-150m). Tüm seviyeler için rehber mevcudu.", icon: "🧗" },
          { name: "Lake Maninjau Day Tour", description: "Lake Maninjau'ya günüllük tur: 44 hairpin turns, Puncak Lawang panorama noktası, tekne gezisi. 8 saat, Rp250.000-450.000.", icon: "🏞️" },
          { name: "Şelale & Yüzme", description: "Harau Valley'deki doğal şelaleler, yüzme havuzları ve kayalık manzaralar. Fotoğraf için mükemmel.", icon: "💦" },
          { name: "Geleneksel Danslar", description: "Akşam 21:00-22:30 geleneksel Minangkabau dansları gösterisi (90 dakika), CD ve el sanatı satışı.", icon: "🎭" },
          { name: "Minangkabau Cultural Tour", description: "Pagaruyung kral sarayı, Balimbing köyü, geleneksel Rum Gadang evler ve el sanatları (dokuma, oyma). 8 saat tur.", icon: "🏛️" },
          { name: "Paragliding", description: "Puncak Lawang, Pintu Angin, Aia Manih Beach'te paragliding noktaları. Deneyimli pilotar gerekli.", icon: "🪂" },
        ],
        konaklama: [
          { name: "★☆☆ Budget Hotels", description: "Temel ancak temiz odalar, fan ventilasyonu, basit kahvaltı. (Hello Guesthouse, Hotel Asean, d'enam Hotel, Kareem Syariah Hostel)" },
          { name: "★★☆ Mid-Range Hotels", description: "Özel banyo, klima, WiFi, TV. (Hotel Cindua Mato, Orchid Hotel)" },
          { name: "★★★ Comfort Hotels", description: "Konfor odaları, spa, restoran hizmeti." },
          { name: "★★★★ Luxury Hotels", description: "The Hills Bukittinggi (eski Novotel) ve Pusako Hotel, 4-5 yıldızlı lüks konaklama." },
        ],
        konaklamaSuresi: "2-5 gün",
        konaklamaBudgeti: "800-2000 USD",
        yiyecekIcecekler: {
          "Türk & Ortadoğu Mutfağı": [
            { name: "Kebab Turki", description: "Kebab Bro, Kebab Turki Zahara, Kebab Turki Azzahra gibi popüler kebab restoranları." },
            { name: "Lahmacun", description: "Türk tarzı pizza, bazı Türk kebab restoranlarında mevcut." },
            { name: "Doner & Beyti", description: "Döner ve Beyti kebabı seçenekleri popüler lokallerde." },
          ],
          "Lokal Minangkabau Mutfağı": [
            { name: "Padang Cuisine", description: "Krem ve baharatlı yemekler, Bukittinggi'de çoğu restorana ait." },
            { name: "Ikan Bilih (Lake Fish)", description: "Lake Singkarak'tan küçük tatlı su balığı, kızartma veya çorbada pişirilir." },
            { name: "Bika", description: "Hindistan cevizi, pirinç unu ve palmiye şekerinden yapılan geleneksel tatlı." },
          ],
          "Sokak Yemekleri & Snackler": [
            { name: "Nasi Goreng", description: "Kızarmış pilav." },
            { name: "Mie Rebus", description: "Kaynatılmış erişte." },
            { name: "Roti Bakar", description: "Tost ve yumurta." },
            { name: "Martabak Mesir", description: "Et içli krep." },
            { name: "Martabak Bandung", description: "Tatlı krep, 50+ tat (çikolata, peynir, çilek, cengkeh, bal, muz, durian)." },
            { name: "Maniok ve Çerez", description: "Acı maniok cipsleri, kızarmış maniok çubukları, kuru eel, patates cipsleri." },
          ],
          "İçecekler": [
            { name: "Sikotang / Sarobat", description: "Kırmızı zencefil, tarçın, muskatnoz, yumurta ve ekmek karışımı sıcak içecek." },
            { name: "Daun Kawa", description: "Kavurulmuş kahve ağacı yapraklarından yapılan geleneksel içecek." },
            { name: "Jus Pinang", description: "Betel nut (Areca catechu) suyu, uyarlanıcı ve adı geçen cinsel dayanıklılığı etkileyen." },
            { name: "Teh Talua", description: "Sıcak çaya yumurta ve limon karışımı, Minangkabau özel içeceği." },
            { name: "Meyve Suları", description: "Avokado, soursop, portakal, havuç gibi taze meyve suları." },
            { name: "Kopi Luwak", description: "Dünyanın en ünlü kahvesi (civetten geçmiş). Batang Palupuah'ta deneme imkanı." },
          ],
        },
        alisveris: [
          { name: "Pasar Atas (Upper Market)", description: "Bukittinggi'nin en büyük pazarı, souvenir ve giyim. Pazarlık yapılır. Kaliteli ürünler Pandai Sikek'te bulunur." },
          { name: "Pasar Bawah (Lower Market)", description: "Meyve ve sebze pazarı, Jam Gadang yakınında yer alır." },
          { name: "Ramayana Shopping Mall", description: "Modern alışveriş merkezi, kredi kartı kabul eder." },
          { name: "Pasar Aur Kuning (Wholesale Market)", description: "Toptan satış pazarı, grup alışverişler için uygun. Daha ekonomik fiyatlandırma." },
          { name: "Kain Songket (Geleneksel Dokuma)", description: "Altın iplikli geleneksel kumaş, Pandai Sikek'ten alınır. Yüksek kalite ve fiyat." },
          { name: "Pandai Sikek El Sanatları", description: "Rumah Gadang replikaları, anahtarlıklar, el oymaları, dokuma ve tahta oymaları." },
          { name: "Toko Tiga Saudara", description: "Dokuma çantalar, anahtarlıklar, Rumah Gadang replikaları, miniatur bisiklet ve diğer zanaat ürünleri. Toplu alışveriş indirimleri mevcut." },
          { name: "Lokal Çerezler & Snackler", description: "Kuru, baharatlı ve tatlı çerezler: cassava chips, kuru eel, patates cipsleri." },
          { name: "Aishah Chalik Art Shop", description: "Kain songket, ayakkabı, tişört, sarong, dua kilidin ve diğer zanaat ürünleri." },
        ],
        onemliNotlar: "⚠️ KLİMA: 930m yükseklikte, gece sıcaklığı 16-25°C arasında değişir. Kat giyim tavsiye edilir. ULAŞIM: Padang'dan 2 saat, DAMRI otobüsü Rp20.000. Hafta sonları trafik yoğun. YEMEK: Çoğu restoran Padang mutfağı (yağlı ve baharatlı) sundu, gece pazarında taze yemek daha iyi. PAZAR: Cuma/Cumartesi/Pazarlar sokakta daha çok satıcı bulunur.",
      },
      "kerinci": {
        name: "Kerinci",
        island: "Sumatra",
        description: "Kerinci, Endonezya'nın en yüksek volkanı Kerinci Seblat'ın bulunduğu yüksek dağ bölgesidir. Çay bahçeleri, milli park, şelaleler ve zengin vahşi yaşam ile ünlüdür.",
        images: [
          "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=1200",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Kerinci Seblat Volkanı",
            description: "Endonezya'nın en yüksek volkanı (3.805m). Tırmanış 1-3 gün rehberli turlarla yapılır. Manzarası ve açılımı muhteşem.",
          },
          {
            name: "Kerinci Seblat Milli Parkı",
            description: "Sumatran tigers, leopards, Asian elephants, rhinoceros gibi nadir hayvanların yaşadığı biyoçeşitlilik alanı. Rehberli orman trekkingi.",
          },
          {
            name: "Sungai Penuh (Kerinci Merkez Kasabası)",
            description: "Kerinci bölgesinin idari merkezi, pazarlar, restoranlar ve konaklama olanakları bulunan ana şehir.",
          },
          {
            name: "Çay Bahçeleri",
            description: "Yüksek dağlarda geniş çay plantasyonları, yeşil manzaralar ve çay tarlası yürüyüşleri." },
          {
            name: "Şelaleler",
            description: "Kerinci bölgesindeki doğal şelaleler, yüzme havuzları ve orman şelaleleri trekking rotaları.",
          },
          {
            name: "Danau Kerinci (Kerinci Gölü)",
            description: "Sumatra'nın en büyük tatlı su gölü, balık tutma ve tekne turları.",
          },
        ],
        aktiviteler: [
          { name: "Volkan Tırmanışı", description: "Kerinci Seblat'ın 3.805m zirve tırmanışı, 1-3 gün rehberli turlar.", icon: "🌋" },
          { name: "Jungle Trekking", description: "Kerinci Seblat Milli Parkı'nda rehberli orman yürüyüşleri, vahşi yaşam gözlemi.", icon: "🥾" },
          { name: "Çay Bahçesi Turlari", description: "Çay plantasyonlarında yürüyüş, çay üretim süreci gözlemi, lokal çiftçilerle buluşma.", icon: "☕" },
          { name: "Balık Tutma", description: "Danau Kerinci'de balık tutma turları, lokal rehberlerle tekne gezileri.", icon: "🎣" },
          { name: "Fotoğraf Turu", description: "Manzara ve vahşi yaşam fotoğrafçılığı için özel turlar, profesyonel rehberler.", icon: "📷" },
          { name: "Şelale Yürüyüşü", description: "Doğal şelalelere rehberli yürüyüş, yüzme ve doğa fotoğrafçılığı.", icon: "💦" },
          { name: "Kuş Gözlemi (Birdwatching)", description: "Kerinci Seblat'ta nadir kuş türlerini gözleme, ornitoloji rehberleriyle turlar.", icon: "🦅" },
          { name: "Kamp & Outdoor", description: "Milli parkta çadır kampı, rehberli orman kampı deneyimi.", icon: "🏕️" },
          { name: "Lokal Köy Ziyareti", description: "Kerinci bölgesindeki geleneksel köyler, lokal kültür ve ev ziyaretleri.", icon: "🏘️" },
        ],
        konaklama: [
          { name: "★☆☆ Budget Guesthouses", description: "Basit ancak temiz konaklama, fan ventilasyonu, lokal atmosfer." },
          { name: "★★☆ Mid-Range Hotels", description: "Klima, özel banyo, WiFi, temel kahvaltı." },
          { name: "★★★ Tea Plantage Stays", description: "Çay bahçelerinde 'tea cottage' deneyimi, panoramik dağ manzarası." },
          { name: "★★★★ Comfort Hotels", description: "Sungai Penuh'taki konforlu otel seçenekleri, restoran ve hizmetler." },
        ],
        konaklamaSuresi: "3-7 gün",
        konaklamaBudgeti: "900-1800 USD",
        yiyecekIcecekler: {
          "Türk & Ortadoğu Mutfağı": [
            { name: "Kebab Turki", description: "Kebab Turki Aa Rifqii, Kebab Burger Fetih Turki gibi popüler kebab restoranları (Jambi ve çevrede)." },
            { name: "Kebab Burger", description: "Türk tarzı kebab burger kombinasyonu, hızlı yemek seçeneği." },
          ],
          "Lokal Kerinci & Sumatra Mutfağı": [
            { name: "Nasi Kuning", description: "Turmeric (sarı) pirinç, Kerinci'de popüler." },
            { name: "Rendang", description: "Kurutulmuş kırmızı et curry, hindistan cevizi ve baharatlı özel Sumatra yemeği." },
            { name: "Nasi Padang", description: "Pirinç ile çeşitli curry, sebzeler ve protein seçenekleri, Sumatra'nın meşhur yemeği." },
            { name: "Ikan Segar", description: "Danau Kerinci'nden günlük balık (Ikan Bilih vb), kızartma veya çorbada pişirilir." },
            { name: "Tahu & Tempeh", description: "Geleneksel soya ürünleri, çeşitli pişirme yöntemleri." },
          ],
          "Sokak Yemekleri": [
            { name: "Nasi Goreng", description: "Kızarmış pilav, lokal baharat kombinasyonu." },
            { name: "Mie Rebus", description: "Kaynatılmış erişte ve sebzeler." },
            { name: "Lumpia", description: "Endonezya tarzı yay, çeşitli dolgusu." },
          ],
          "İçecekler": [
            { name: "Çay (Local Tea)", description: "Lokal çay bahçesinde üretilen taze çay, çeşitli çeşitleri." },
            { name: "Kahve", description: "Sumatra kahvesi, Kerinci bölgesinde üretilen özel çeşitler." },
            { name: "Meyve Suları", description: "Tropikal meyve suları, lokal seçenekler." },
            { name: "Ginger Tea", description: "Zencefil çayı, sıcak içecek." },
          ],
        },
        alisveris: [
          { name: "Lokal Çay (Tea Direct)", description: "Çay bahçelerinden doğrudan satın alma, taze çay yapraklari." },
          { name: "Çay Bahçesi Hediyeleri", description: "Çay paketleri, çay bardakları, çay aksesuarları." },
          { name: "Kerinci Arabica Kahvesi", description: "Bölgenin meşhur Arabica kahvesi, farklı boylar ve kavrumlarda paketlenmiş halde." },
          { name: "Yerel Baharat & Atıştırmalıklar", description: "Kayu manis (cinnamon) ve diğer lokal baharat ürünleri, çeşitli atıştırmalıklar." },
          { name: "Dodol & Yöresel Tatlılar", description: "Dodol (geleneksel tatlı) ve diğer yöresel yiyecekler, hediye olarak popülerdir." },
          { name: "Lokal El Sanatları", description: "Dokuma, ahşap oymaları ve el yapımı ürünler." },
          { name: "Lokal Pazarlar", description: "Sungai Penuh pazarlarında meyve, sebze ve lokal ürünler." },
        ],
        onemliNotlar: "⚠️ ULAŞIM: Sungai Penuh'a Bukittinggi'den minibus ile 6-8 saat (Rp130.000). VOLKAN TİRMANIŞI: Tecrübe gerektiren, yoğun trekking. Rehber, malzeme ve akklimatizasyon zorunlu. SEZONLiLİK: Yaş mevsimi (Eylül-Mayıs) vol tırmanışı zordur. SAĞLIK: Yükseklik hastalığı riski (3.805m), yavaş tırmanış tavsiye edilir. YEMEK: Lojmanlarda beslenme sınırlı; Sungai Penuh'ta daha çok seçenek. ALIŞVERIŞ: Çoğu mağaza nakit (IDR) ile çalışır, kart kabulü her yerde olmayabilir. Lokal dükkanlarda pazarlık mümkün olabilir. Popüler hediyeler: baharat, kahve, tişört, atıştırmalıklar.",
      },
      "nias": {
        name: "Nias Adası",
        island: "Sumatra",
        description: "Kuzey Sumatra açıklarında yer alan Nias Adası, dünya ünlü sörf noktaları, geleneksel taş tırmanışı merasimi ve antik megalit yapılarıyla bilinir. Vahşi doğası ve benzersiz kültürü ile heyecan verici bir macera destinasyonudur.",
        images: [
          "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=1200",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekImages: [
          "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        aktivitelerImages: [
          "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        yiyecekImages: [
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        konaklamaImages: [
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        alisverisImages: [
          "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
          "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
        ],
        gezilecekYerler: [
          {
            name: "Sorake Beach",
            description: "Dünya ünlü sörf noktası, mükemmel dalgalar ve sörf okulu imkanları. Nias'ın en popüler sörf plajı.",
          },
          {
            name: "Lagundri Bay",
            description: "Nias'ın en iyi sörf spotlarından biri, ileri seviye sörf dalgaları ve plajda konaklama imkanları.",
          },
          {
            name: "Bawomataluo Köyü",
            description: "Nias'ın geleneksel megalithic köyü. Antik taş heykeller, oka rumah (ulu mazmasa) evleri ve Stone Jumping merasiminin yapıldığı yer.",
          },
          {
            name: "Orahili Şelalesi",
            description: "Nias'ın doğal şelalesi, orman içinde serinlik ve doğal güzellik.",
          },
          {
            name: "Museum Pusaka Nias",
            description: "Gunungsitoli'deki Nias mirası müzesi. 6.000'den fazla obje, antik taş oymaları, takılar ve kültürel eserler.",
          },
          {
            name: "Teluk Dalam Kasabası",
            description: "Nias'ın güney ucu sörf bölgesinin ana merkezi. Sörf okulu ve turizm imkanları merkezi.",
          },
          {
            name: "Gunungsitoli Şehri",
            description: "Nias'ın ana şehri ve giriş noktası. Pazarlar, restoranlar, hastane ve ulaşım hizmetleri.",
          },
          {
            name: "Endemik Kuş Türleri & Vahşi Yaşam",
            description: "Nias'ın nadir kuş türleri ve tropikal fauna. Orman trekking ile gözlenebilir.",
          },
        ],
        aktiviteler: [
          { name: "Sörf & Sörf Okulu", description: "Tüm seviyeler için sörf dersler. Mart-Eylül en iyi sezon. Professional instruktörler ve board kiralama.", icon: "🏄" },
          { name: "Taş Tırmanışı (Stone Jumping)", description: "Geleneksel Nias merasimi, rehberli turlar ile güvenli şekilde gerçekleştirilebilir.", icon: "🧗" },
          { name: "Savaş Dansları (War Dances)", description: "Turist için düzenli olarak sahnelenenen geleneksel Nias savaş dansları. Kültür ve sanatın canlı temsili.", icon: "💃" },
          { name: "Yerel Müzik & Kültür", description: "Nias'ın eşsiz ve alıcı güzelliği ile meşhur lokal müzik performansları. Çoğunlukla kadınlar tarafından icra edilir.", icon: "🎵" },
          { name: "Jungle Trekking", description: "Nias ormanlarında rehberli yürüyüşler, vahşi yaşam gözlemi ve köy ziyaretleri.", icon: "🥾" },
          { name: "Şnorkeling & Dalış", description: "Bawo Adası ve çevresi, mercan resifleri ve tropikal balıklar. Dalış kursları mevcut.", icon: "🤿" },
          { name: "Fishing Tours", description: "Lokal tekne ile balık tutma turları, Hint Okyanusu'nda macera.", icon: "🎣" },
          { name: "Kültür Turları", description: "Megaliths ziyareti, köy turları, lokal el sanatları workshopları.", icon: "🏛️" },
          { name: "Motorbike Exploring", description: "Motorla ada keşfi, köyleri, plajaları ve gizli spotları ziyaret et.", icon: "🏍️" },
          { name: "Photography & Sunset Tours", description: "Manzara fotoğrafçılığı, gün batımı turları, tabiat fotoğrafçılığı.", icon: "📷" },
        ],
        konaklama: [
          { name: "★☆☆ Budget Surf Camps", description: "Sorake'de basit ancak kullanışlı sörf kampları ve guesthouses. Sosyal ortam, diğer sörfçülerle bağlantı." },
          { name: "★★☆ Mid-Range Resorts", description: "Sorake ve Lagundri'de klimalı odalar, restoran, WiFi ve sörf aktiviteleriyle konforlu konaklama." },
          { name: "★★★ Beachfront Bungalows", description: "Plaj kenarında bungalow'lar, özel balkonlar, deniz manzarası ve seafood restoranları." },
          { name: "★★★★ Boutique Beach Hotels", description: "Nias'ın en konforlu oteleri. Spa, yoga, lokal aktiviteler organize, ekstra rahat." },
        ],
        konaklamaSuresi: "3-7 gün",
        konaklamaBudgeti: "600-2000 USD",
        yiyecekIcecekler: {
          "Türk & Ortadoğu Mutfağı": [
            { name: "Kebab Turki", description: "Sorake ve Gunungsitoli'deki turist alanlarında Türk kebab restoranları mevcuttur." },
          ],
          "Lokal Nias & Sumatra Mutfağı": [
            { name: "Nias Fish (Ikan Bakar)", description: "Taze deniz balıkları, barbekü usulü pişirilir. Nias'ın en popüler yemeği." },
            { name: "Nasi Kuning", description: "Turmeric ile sarılaştırılmış pirinç, lokal baharatlı kombinasyon." },
            { name: "Gulai Ayam", description: "Tavuk curry, hindistan cevizi ve lokal baharatlar ile yapılan meşhur yemek." },
            { name: "Tahu & Tempeh", description: "Geleneksel soya ürünleri, çeşitli pişirme yöntemleri." },
          ],
          "Sokak Yemekleri": [
            { name: "Nasi Goreng", description: "Kızarmış pilav, lokal baharat kombinasyonu." },
            { name: "Mie Rebus", description: "Kaynatılmış erişte ve sebzeler." },
            { name: "Soto Nias", description: "Nias tarzı sıcak çorba, baharatlı ve doyurucu." },
          ],
          "İçecekler": [
            { name: "Teh Tarik", description: "Çekilen çay, tatlı ve creamy lezzet." },
            { name: "Jus Pala", description: "Hindistan cevizi suyu ve meyve karışımı, tropikal serinlik." },
            { name: "Kopi Nias", description: "Lokal kahve, güçlü ve aromatik tat." },
            { name: "Meyve Suları", description: "Tropikal meyveler: mango, papaya, durian (mevsimsel)." },
          ],
        },
        alisveris: [
          { name: "Sörf Malzemeleri", description: "Board kira/satış, sörf kıyafetleri, rash guard'lar, plaj aksesuarları." },
          { name: "Lokal El Sanatları", description: "Tahta oymaları, taş heykeller, geleneksel dokuma ve zanaat ürünleri." },
          { name: "Megaliths Taş Replika", description: "Miniature taş anıt modelleri, gömlekler ve posterler." },
          { name: "Deniz Ürünleri & Gıda", description: "Kurutulmuş balık, taze seafood, lokal baharat ve koruyucu sos'lar." },
          { name: "Plaj Kıyafetleri & Aksesuar", description: "Tshirt, şapka, gözlük, bikini ve deniz sporları aksesuar." },
          { name: "Antika & Collectibles", description: "Eski taş oymaları, etnik takılar ve geleneksel Nias malzemeleri." },
          { name: "Lokal Pazarlar", description: "Gunungsitoli ve Sorake pazarlarında meyve, sebze, lokal ürünler." },
        ],
        onemliNotlar: "⚠️ LOJİSTİK UYARISI: Kuzey Sumatra'da meydana gelen heyelan ve seller nedeniyle lojistik kesintiler yaşanmaktadır (30 Kasım 2025 itibaren). Gıda, yakıt ve telekomünikasyon hizmetlerinde sorunlar olabilir. Seyahat öncesi güncel bilgi alınması önemlidir.\n\n⚠️ ULAŞIM: Bandar Aceh veya Medan'dan uçak (SRI Gunung Sitoli Havaalanı) veya gemi turları. Ulaşım 2-4 saat. Gemi firmalarının sık sık ticari kesintiye uğrayabileceği dikkate alınmalı.\n\n⚠️ SÖRF SEZONİ: Mart-Eylül en iyi dalgalar (DJF ise daha zayıf).\n\n⚠️ SAĞLIK: Sivrisinek ilacı, aşılar tavsiye edilir. Tıbbi tesisler temel seviyedir - ciddi durumlar için Medan'a referans verilir.\n\n⚠️ PARA: Nakit (IDR) tercih edilir, ATM'ler sınırlıdır.\n\n⚠️ KÜLTÜR: Lokal rehber kiralama merasim ve köy ziyaretleri için tavsiye edilir.\n\n⚠️ TURİZM: Sorake/Lagundri'de turist dostu ortam mevcuttur.",
      },
    },
  };
  */

  // Default data for destinations not detailed yet
  const defaultDetail = {
    name:
      destination.charAt(0).toUpperCase() +
      destination.slice(1).replace(/-/g, " "),
    island: island.charAt(0).toUpperCase() + island.slice(1),
    description: `${destination.charAt(0).toUpperCase() + destination.slice(1).replace(/-/g, " ")}, ${island.charAt(0).toUpperCase() + island.slice(1)} adasının en popüler destinasyonlarından biri. Eşsiz doğal güzellikleri, zengin kültürel mirası ve unutulmaz deneyimleriyle sizi bekliyor.`,
    images: [
      "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=800",
      "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
    ],
    gezilecekYerler: [
      {
        name: "Tarihi Tapınaklar",
        description: "Bölgenin en önemli tarihi ve dini yapıları",
      },
      {
        name: "Doğal Plajlar",
        description: "Kristal berraklığında sular ve beyaz kumlu sahiller",
      },
      {
        name: "Yerel Pazarlar",
        description: "Geleneksel el sanatları ve taze ürünler",
      },
      {
        name: "Panoramik Manzara Noktaları",
        description: "Muhteşem fotoğraf çekimleri için ideal noktalar",
      },
    ],
    aktiviteler: [
      {
        name: "Snorkeling ve Dalış",
        description: "Zengin deniz yaşamını keşfetme fırsatı",
        icon: "🤿",
      },
      {
        name: "Sörf",
        description: "Dünya çapında ünlü sörf noktaları",
        icon: "🏄",
      },
      {
        name: "Trekking",
        description: "Doğa yürüyüşleri ve dağ tırmanışı",
        icon: "🥾",
      },
      {
        name: "Kültür Turları",
        description: "Yerel gelenekler ve kültürel deneyimler",
        icon: "🎭",
      },
      {
        name: "Su Sporları",
        description: "Jet-ski, parasailing ve daha fazlası",
        icon: "🚤",
      },
    ],
    yiyecekIcecekler: [
      {
        name: "Nasi Goreng",
        description: "Endonezya'nın ünlü kızarmış pilavı",
      },
      { name: "Satay", description: "Baharatlı şiş kebap çeşitleri" },
      { name: "Gado-Gado", description: "Fıstık soslu sebze salatası" },
      {
        name: "Taze Deniz Ürünleri",
        description: "Günlük yakalanan balık ve kabuklu deniz ürünleri",
      },
      {
        name: "Pizza",
        description: "İtalyan tarzı, taze malzemelerle yapılan pizza",
      },
      {
        name: "Hamburger",
        description: "Yumuşak ekmekte sarılı, lezzetli hamburger",
      },
      {
        name: "Tavuk Kızartma",
        description: "Çıtır ve lezzetli kızarmış tavuk porsiyonları",
      },
      {
        name: "Kebap",
        description: "Farklı stillerde hazırlanan, baharatlı kebap çeşitleri",
      },
    ],
    konaklama: [
      {
        name: "Lüks Resort'lar",
        description: "5 yıldızlı, tüm ana öğünlerin fiyata dahil olduğu tatil köyleri",
      },
      { name: "Butik Oteller", description: "Şık ve samimi tasarım oteller" },
      {
        name: "Beach Bungalow'lar",
        description: "Plaj kenarında özel kulübeler",
      },
      {
        name: "Havuzlu Lüks Villalar",
        description: "Özel tasarımlı, özel havuzları olan yüksek konforlu villalar",
      },
    ],
    alisveris: [
      {
        name: "Yerel Pazarlar",
        description: "Geleneksel el sanatları, tekstil ve hediyelik eşyaların satıldığı bölge pazarları",
      },
      {
        name: "Sanat ve Zanaat Galerisi",
        description: "Yerel sanatçıların resim, heykeltaş ve dekoratif ürünlerinin sergilenip satıldığı yerler",
      },
      {
        name: "Modern Alışveriş Merkezleri",
        description: "Uluslararası ve yerel markaların bulunduğu modern AVM'ler",
      },
      {
        name: "Tekstil ve Batik Dükkanları",
        description: "Geleneksel batik boyama ve tekstil ürünlerinin satıldığı özel mağazalar",
      },
      {
        name: "Turist Hatıra Pazarları",
        description: "Taşınabilir ve uygun fiyatlı hatıra ürünlerinin satıldığı sokak pazarları",
      },
    ],
  };

  // URL parametresini normalize et (nusa-dua -> nusaDua)
  const normalizedDestination = destination?.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  
  const detail = destinationDetails[island]?.[normalizedDestination] || destinationDetails[island]?.[destination] || defaultDetail;

  const heroImage = (() => {
    const first = detail?.images?.[0];
    if (first && typeof first === "object") {
      return getImageUrl(first.defaultUrl, first.storageKey);
    }
    if (typeof first === "string") return first;
    return defaultDetail.images[0];
  })();

  // Debug: log detail for current destination to help diagnose rendering issues
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('Destination detail loaded:', normalizedDestination, detail);
  }

  // Safety helpers to avoid runtime crashes when data missing
  const isCategoryYiyecek = detail.yiyecekIcecekler && typeof detail.yiyecekIcecekler === 'object' && !Array.isArray(detail.yiyecekIcecekler);
  const safeYiyecekList = Array.isArray(detail.yiyecekIcecekler) ? detail.yiyecekIcecekler : (isCategoryYiyecek ? [] : (detail.yiyecekIcecekler || []));

  const tabs = [
    { id: "gezilecek", label: t("kesfetDestination.tabs.places"), icon: Landmark },
    { id: "aktiviteler", label: t("kesfetDestination.tabs.activities"), icon: Waves },
    { id: "yiyecek", label: t("kesfetDestination.tabs.food"), icon: Utensils },
    { id: "konaklama", label: t("kesfetDestination.tabs.stay"), icon: Coffee },
    { id: "alisveris", label: t("kesfetDestination.tabs.shopping"), icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col">
      {/* Navigation */}
      <Navigation />

      <div className="flex flex-1">
      {/* Main Content Area */}
      <div className="flex-1">

        {/* Hero Image Gallery */}
        <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden">
          <img
            src={heroImage}
            alt={detail.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          {/* Destination Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
            <nav className="mb-2 text-[11px] sm:text-[12px] font-poppins text-white/80 flex flex-wrap items-center gap-1">
              <a href="/kesfet" className="hover:underline">{t("kesfetDestination.breadcrumb.indonesia")}</a>
              <span className="opacity-70">/</span>
              <a
                href={`/kesfet/${island}`}
                className="hover:underline"
              >
                {detail.island}
              </a>
              <span className="opacity-70">/</span>
              <span className="font-semibold text-white">
                {detail.name}
              </span>
            </nav>
            <div className="flex items-center mb-2">
              <MapPin size={20} className="text-white mr-2" />
              <span className="text-[14px] sm:text-[16px] font-poppins font-medium text-white/80">
                {detail.island}
              </span>
            </div>

            <h1 className="text-[32px] sm:text-[40px] lg:text-[56px] font-poppins font-semibold text-white leading-tight mb-4 text-balance">
              {detail.name}
            </h1>
            <p className="text-[14px] sm:text-[16px] lg:text-[18px] font-poppins font-normal text-white/90 max-w-3xl leading-relaxed text-balance">
              {detail.description}
            </p>
          </div>
        </div>



        {/* Tabs Navigation + Back Button */}
        <div className="bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
          <div className="max-w-none ml-0 px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
               {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center px-3 sm:px-4 py-2.5 sm:py-3 font-poppins font-semibold text-[12px] sm:text-[14px] whitespace-nowrap transition-all duration-200 border-b-2
                      ${
                        activeTab === tab.id
                          ? "border-[#6A54E7] dark:border-[#7C69FF] text-[#6A54E7] dark:text-[#7C69FF]"
                          : "border-transparent text-[#6D6D6D] dark:text-[#A0A0A0] hover:text-[#6A54E7] dark:hover:text-[#7C69FF]"
                      }
                    `}
                  >
                    <IconComponent size={18} className="mr-2" />
                    {tab.label}
                  </button>
                );
              })}

              <a
                href={`/kesfet/${island}`}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-poppins font-semibold bg-[#6A54E7] dark:bg-[#7C69FF] text-white shadow-sm hover:shadow-md hover:bg-[#5940E0] dark:hover:bg-[#6A58F0] transition-all duration-200 whitespace-nowrap border border-transparent"
              >
                <ArrowLeft size={12} className="mr-1.5" />
                <span>{t("kesfetDestination.backToIsland", { island: detail.island })}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white dark:bg-[#121212]">
          <div className="max-w-none ml-0 px-4 sm:px-5 lg:px-6 py-8 sm:py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-7xl mx-auto">
              {/* Left: Main Content */}
              <div className="flex-1 min-w-0">
                <div className="max-w-5xl">
                  <div className="mb-6 text-[11px] sm:text-[12px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] flex flex-wrap gap-2">
                    <span>{t("kesfetDestination.weather.today", { air: "28°C", sea: "27°C" })}</span>
                  </div>
              {/* Gezilecek Yerler Tab */}
              {activeTab === "gezilecek" && (
                <div className="space-y-6">
                  <h2 className="text-[22px] sm:text-[24px] font-poppins font-semibold text-[#6A54E7] dark:text-[#C4B5FF] mb-1 text-balance">
                    {t("kesfetDestination.places.title", { destination: detail.name })}
                  </h2>
                  <p className="text-[12px] sm:text-[13px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] mb-6 leading-relaxed text-balance">
                    {t("kesfetDestination.places.subtitle", { destination: detail.name })}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {(detail.gezilecekYerler || []).map((place, idx) => (
                      <div
                        key={idx}
                        className="bg-white/90 dark:bg-[#181818] border border-gray-200/80 dark:border-[#333333] rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 backdrop-blur-sm"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-10 h-10 bg-[#F5F3FF] dark:bg-[#2E2E3E] rounded-lg flex items-center justify-center mr-4">
                            <Landmark
                              size={20}
                              className="text-[#6A54E7] dark:text-[#7C69FF]"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[16px] sm:text-[18px] font-poppins font-semibold text-black dark:text-white mb-1">
                              {place.name}
                            </h3>
                            <p className="text-[12px] sm:text-[13px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] leading-relaxed">
                              {place.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 bg-[#F5F3FF] dark:bg-[#1E1B2E] border border-[#E0D9FF] dark:border-[#3F3B66] rounded-xl p-4 text-[12px] sm:text-[13px] font-poppins text-[#4338CA] dark:text-[#E0E7FF]">
                    {t("kesfetDestination.places.tip", { destination: detail.name })}
                  </div>
                </div>
              )}

              {/* Aktiviteler Tab */}
              {activeTab === "aktiviteler" && (
                <div className="space-y-6">
                  <h2 className="text-[22px] sm:text-[24px] font-poppins font-semibold text-[#0EA5E9] dark:text-[#7DD3FC] mb-1 text-balance">
                    {t("kesfetDestination.activities.title", { destination: detail.name })}
                  </h2>
                  <p className="text-[12px] sm:text-[13px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] mb-6 leading-relaxed text-balance">
                    {t("kesfetDestination.activities.subtitle")}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {(detail.aktiviteler || []).map((activity, idx) => (
                      <div
                        key={idx}
                        className="bg-white/90 dark:bg-[#181818] border border-gray-200/80 dark:border-[#333333] rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 backdrop-blur-sm"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-10 h-10 bg-[#E0F7FF] dark:bg-[#082F3C] rounded-lg flex items-center justify-center mr-4 text-[22px]">
                            {activity.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[14px] sm:text-[16px] font-poppins font-medium text-black dark:text-white mb-1">
                              {activity.name}
                            </h3>
                            <p className="text-[12px] sm:text-[13px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] leading-relaxed">
                              {activity.description}
                            </p>
                            {activity.uyari && (
                              <p className="text-[12px] sm:text-[13px] font-poppins text-[#333333] dark:text-[#E0E0E0] mt-3 bg-[#FFF3E0] dark:bg-[#332E2E] rounded p-2 border-l-4 border-[#FF8940] dark:border-[#FF9D55]">
                                {activity.uyari}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 bg-[#E0F7FF] dark:bg-[#082F3C] border border-[#BAE6FD] dark:border-[#155E75] rounded-xl p-4 text-[12px] sm:text-[13px] font-poppins text-[#0369A1] dark:text-[#E0F2FE]">
                    {t("kesfetDestination.activities.tip", { destination: detail.name })}
                  </div>
                </div>
              )}

              {/* Yiyecek & İçecek Tab */}
              {activeTab === "yiyecek" && (
                <div className="space-y-6">
                  <h2 className="text-[22px] sm:text-[24px] font-poppins font-semibold text-[#FF8940] dark:text-[#FFB45C] mb-1 text-balance">
                    {t("kesfetDestination.food.title", { destination: detail.name })}
                  </h2>
                  <p className="text-[12px] sm:text-[13px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] mb-6 leading-relaxed text-balance">
                    {t("kesfetDestination.food.subtitle")}
                  </p>
                  
                  {isCategoryYiyecek ? (
                    <>
                      {Object.entries(detail.yiyecekIcecekler).map(([category, foods]) => (
                        <div key={category} className="space-y-3">
                          <h3 className="text-[17px] sm:text-[19px] font-poppins font-semibold text-[#FF8940] dark:text-[#FF9D55] mb-4">
                            {category}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                            {foods.map((food, idx) => (
                              <div
                                key={idx}
                                className="bg-white/90 dark:bg-[#181818] border border-gray-200/80 dark:border-[#333333] rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 backdrop-blur-sm"
                              >
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 w-10 h-10 bg-[#FFF8F5] dark:bg-[#2E2E2E] rounded-lg flex items-center justify-center mr-4">
                                    <Utensils
                                      size={20}
                                      className="text-[#FF8940] dark:text-[#FF9D55]"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-[14px] sm:text-[16px] font-poppins font-medium text-black dark:text-white mb-1">
                                      {food.name}
                                    </h4>
                                    <p className="text-[12px] sm:text-[13px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] leading-relaxed">
                                      {food.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      {(safeYiyecekList || []).map((food, idx) => (
                        <div
                          key={idx}
                          className="bg-white/90 dark:bg-[#181818] border border-gray-200/80 dark:border-[#333333] rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 backdrop-blur-sm"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#FFF8F5] dark:bg-[#2E2E2E] rounded-lg flex items-center justify-center mr-4">
                              <Utensils
                                size={20}
                                className="text-[#FF8940] dark:text-[#FF9D55]"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-[14px] sm:text-[16px] font-poppins font-medium text-black dark:text-white mb-1">
                                {food.name}
                              </h3>
                              <p className="text-[12px] sm:text-[13px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] leading-relaxed">
                                {food.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Konaklama Tab */}
              {activeTab === "konaklama" && (
                <div className="space-y-4">
                  <h2 className="text-[22px] sm:text-[24px] font-poppins font-semibold text-[#10B981] dark:text-[#6EE7B7] mb-1 text-balance">
                    {t("kesfetDestination.stay.title", { destination: detail.name })}
                  </h2>
                  <p className="text-[12px] sm:text-[13px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] mb-6 leading-relaxed text-balance">
                    {t("kesfetDestination.stay.subtitle")}
                  </p>
                  
                  {/* Süre ve Bütçe Bilgisi */}
                  {detail.konaklamaSuresi && detail.konaklamaBudgeti && (
                    <div className="bg-gradient-to-r from-[#FFF8F5] to-[#FFF0E8] dark:from-[#2E2E2E] dark:to-[#262626] border border-[#FF8940]/30 dark:border-[#FF9D55]/30 rounded-xl p-6 mb-6">
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex items-start gap-3">
                          <span className="text-[24px]">⏱️</span>
                          <div>
                            <p className="text-[12px] font-poppins font-semibold text-[#FF8940] dark:text-[#FF9D55] uppercase tracking-wide">{t("kesfetDestination.stay.recommendedDuration")}</p>
                            <p className="text-[16px] sm:text-[18px] font-poppins font-bold text-black dark:text-white mt-1">
                              {detail.konaklamaSuresi}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-[24px]">💰</span>
                          <div>
                            <p className="text-[12px] font-poppins font-semibold text-[#FF8940] dark:text-[#FF9D55] uppercase tracking-wide">{t("kesfetDestination.stay.totalBudget", { duration: detail.konaklamaSuresi })}</p>
                            <p className="text-[16px] sm:text-[18px] font-poppins font-bold text-black dark:text-white mt-1">
                              {detail.konaklamaBudgeti}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {detail.konaklama.map((accommodation, idx) => (
                      <div
                        key={idx}
                        className="bg-white/90 dark:bg-[#181818] border border-gray-200/80 dark:border-[#333333] rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 backdrop-blur-sm"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-10 h-10 bg-[#E6FFF7] dark:bg-[#064E3B] rounded-lg flex items-center justify-center mr-4">
                            <Coffee
                              size={20}
                              className="text-[#10B981] dark:text-[#6EE7B7]"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[14px] sm:text-[16px] font-poppins font-medium text-black dark:text-white mb-1">
                              {accommodation.name}
                            </h3>
                            <p className="text-[12px] sm:text-[13px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] leading-relaxed">
                              {accommodation.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 bg-[#FFF8F5] dark:bg-[#2E2E2E] border border-[#FED7AA] dark:border-[#9A3412] rounded-xl p-4 text-[12px] sm:text-[13px] font-poppins text-[#9A3412] dark:text-[#FED7AA]">
                    {t("kesfetDestination.stay.foodTip", { destination: detail.name })}
                  </div>

                  <div className="mt-6 bg-[#E6FFF7] dark:bg-[#064E3B] border border-[#A7F3D0] dark:border-[#10B981] rounded-xl p-4 text-[12px] sm:text-[13px] font-poppins text-[#065F46] dark:text-[#D1FAE5]">
                    {t("kesfetDestination.stay.locationTip", { destination: detail.name })}
                  </div>
                </div>
              )}

              {/* Alışveriş Tab */}
              {activeTab === "alisveris" && (
                <div className="space-y-6">
                  <h2 className="text-[22px] sm:text-[24px] font-poppins font-semibold text-[#EC4899] dark:text-[#F9A8D4] mb-1 text-balance">
                    {t("kesfetDestination.shopping.title", { destination: detail.name })}
                  </h2>
                  <p className="text-[12px] sm:text-[13px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] mb-6 leading-relaxed text-balance">
                    {t("kesfetDestination.shopping.subtitle")}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                    {(detail.alisveris || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white/90 dark:bg-[#181818] border border-gray-200/80 dark:border-[#333333] rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 backdrop-blur-sm"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-10 h-10 bg-[#FFE4F3] dark:bg-[#3B082F] rounded-lg flex items-center justify-center mr-4 text-[22px]">
                            🛍️
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[14px] sm:text-[16px] font-poppins font-medium text-black dark:text-white mb-1">
                              {item.name}
                            </h3>
                            <p className="text-[12px] sm:text-[13px] font-poppins text-[#6D6D6D] dark:text-[#A0A0A0] leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 bg-[#FFE4F3] dark:bg-[#3B082F] border border-[#F9A8D4] dark:border-[#BE185D] rounded-xl p-4 text-[12px] sm:text-[13px] font-poppins text-[#9D174D] dark:text-[#FCE7F3]">
                    {t("kesfetDestination.shopping.tip", { destination: detail.name })}
                  </div>
                </div>
              )}

              {/* Mobile: Image Gallery at bottom of tab content */}
              <div className="mt-8 lg:hidden relative">
                <div
                  ref={mobileGalleryRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory scroll-smooth"
                >
                  {getImagesForActiveTab().map((img, idx) => (
                    <div
                      key={idx}
                      className="flex-none w-[80%] sm:w-[70%] aspect-video bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity duration-200 snap-center"
                    >
                      <img
                        src={img}
                        alt={t("kesfetDestination.gallery.alt", { destination: detail.name, tab: activeTab, index: idx + 1 })}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src =
                            "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=400";
                        }}
                      />
                    </div>
                  ))}
                </div>

                {getImagesForActiveTab().length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (mobileGalleryRef.current) {
                          mobileGalleryRef.current.scrollBy({ left: -260, behavior: "smooth" });
                        }
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 ml-1 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center shadow-sm active:scale-95"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (mobileGalleryRef.current) {
                          mobileGalleryRef.current.scrollBy({ left: 260, behavior: "smooth" });
                        }
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 mr-1 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center shadow-sm active:scale-95"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Image Gallery (Desktop) */}
          <div className="w-full lg:w-[364px] flex-shrink-0 hidden lg:block">
            <div className="sticky top-[100px] space-y-3">
              {getImagesForActiveTab().map((img, idx) => (
                <div
                  key={idx}
                  className="w-full aspect-video bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity duration-200"
                >
                  <img
                    src={img}
                    alt={t("kesfetDestination.gallery.alt", { destination: detail.name, tab: activeTab, index: idx + 1 })}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=400";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

        {/* Footer Section */}
        <Footer />

        {/* Privacy & Security Notice */}
        <div className="bg-gray-100 dark:bg-[#1E1E1E] border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-[12px] sm:text-[13px] font-inter text-gray-600 dark:text-gray-400 text-center">
              🔒 <strong>{t("common.privacySecurity.title")}:</strong> {t("common.privacySecurity.text")}
              <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">{t("common.privacySecurity.policyLink")}</a>
            </p>
          </div>
        </div>
      </div>
    </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }

        .text-balance {
          text-wrap: balance;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export { DestinationDetailPage };
