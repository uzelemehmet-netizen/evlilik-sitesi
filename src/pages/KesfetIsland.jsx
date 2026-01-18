import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { db } from "../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { getKesfetDataForLang } from "../data/kesfet";

export default function IslandDestinationsPage() {
  const [imageUrls, setImageUrls] = useState({});
  const { island } = useParams();
  const { t, i18n } = useTranslation();

  // localStorage'dan resim URL'lerini ilk değer olarak yükle
  useEffect(() => {
    const saved = localStorage.getItem('imageUrls');
    if (saved) {
      try {
        setImageUrls(JSON.parse(saved));
      } catch (e) {
        console.error('imageUrls localStorage parse hatası:', e);
      }
    }
  }, []);

  // Firestore'dan imageUrls konfigurasyonunu dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'imageUrls', 'imageUrls'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() || {};
          setImageUrls((prev) => ({ ...prev, ...data }));
        }
      },
      (error) => {
        console.error('Firestore imageUrls dinleme hatası:', error);
      },
    );

    return () => unsubscribe();
  }, []);

  // Google Analytics - Page View Tracking
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: t("kesfetIsland.analyticsTitle", {
          island: island?.charAt(0).toUpperCase() + island?.slice(1),
        }),
        page_path: `/kesfet/${island}`,
      });
      // Track destination view
      window.gtag('event', 'view_item', {
        items: [
          {
            item_name: island,
            item_category: 'destination',
          }
        ]
      });
    }
  }, [island, i18n.language, t]);

  // Helper function to get image URL
  const getImageUrl = (defaultUrl, storageKey) => {
    return imageUrls[storageKey] || defaultUrl;
  };

  const resolveImageUrl = (image) => {
    if (!image) return "";
    if (typeof image === "string") return image;
    return getImageUrl(image.defaultUrl || "", image.storageKey);
  };

  const { islandData } = getKesfetDataForLang(i18n.language);
  const rawIsland = islandData[island] || islandData.bali;
  const currentIsland = {
    ...rawIsland,
    heroImage: resolveImageUrl(rawIsland.heroImage),
    destinations: (rawIsland.destinations || []).map((d) => ({
      ...d,
      image: resolveImageUrl(d.image),
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col">
      {/* Navigation */}
      <Navigation />

      <div className="flex flex-1">
      {/* Main Content Area */}
      <div className="flex-1">
        {/* Hero Section with Island Image */}
        <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden">
          <img
            src={currentIsland.heroImage}
            alt={t("kesfetIsland.heroAlt", { name: currentIsland.name })}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

          {/* Island Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
            {/* Back Button */}
            <a
              href={`/kesfet`}
              className="inline-flex items-center mb-4 px-4 py-2 bg-black/35 dark:bg-black/35 backdrop-blur-sm rounded-full text-white/90 border border-white/25 hover:bg-black/45 hover:text-white transition-colors duration-300"
            >
              <ArrowLeft size={16} className="mr-2" />
              <span className="text-[13px] sm:text-[14px] font-poppins font-semibold">
                {t("kesfetIsland.backToIslands")}
              </span>
            </a>

            <h1 className="text-[32px] sm:text-[44px] lg:text-[56px] font-poppins font-bold text-white leading-tight mb-3">
              {currentIsland.name}
            </h1>
            <p className="text-[16px] sm:text-[18px] lg:text-[20px] font-poppins font-normal text-white/90 max-w-3xl mb-4">
              {currentIsland.description}
            </p>

            {currentIsland.meta && (
              <div className="inline-flex flex-wrap items-center gap-3 text-[11px] sm:text-[12px] font-inter text-white/90 bg-black/35 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <span className="flex items-center gap-1">
                  <span className="text-xs">📍</span>
                  <span>
                    {t("kesfetIsland.stats.destinations", {
                      count: currentIsland.destinations.length,
                    })}
                  </span>
                </span>
                <span className="hidden sm:inline-block h-3 w-px bg-white/40" />
                <span className="flex items-center gap-1">
                  <span className="text-xs">⏱️</span>
                  <span>
                    {t("kesfetIsland.stats.recommendedStay", {
                      stay: currentIsland.meta.stay,
                    })}
                  </span>
                </span>
                <span className="hidden sm:inline-block h-3 w-px bg-white/40" />
                <span className="flex items-center gap-1">
                  <span className="text-xs">💰</span>
                  <span>
                    {t("kesfetIsland.stats.averageBudget", {
                      budget: currentIsland.meta.budget,
                    })}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Destinations Section */}
        <div className="bg-white dark:bg-[#121212]">
          <div className="max-w-none ml-0 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            {/* Section Header */}
            <div className="mb-8">
              <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-poppins font-bold text-black dark:text-white leading-tight mb-2">
                {t("kesfetIsland.sectionTitle")}
              </h2>
              <p className="text-[14px] sm:text-[16px] font-poppins font-normal text-[#555555] dark:text-[#A0A0A0]">
                {t("kesfetIsland.sectionSubtitle", {
                  count: currentIsland.destinations.length,
                })}
              </p>
            </div>

            {/* Destinations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {currentIsland.destinations.map((destination) => (
                <a
                  key={destination.id}
                  href={`/kesfet/${island}/${destination.id}`}
                  className="group bg-white dark:bg-[#1E1E1E] border border-[#E4E4E4] dark:border-[#404040] rounded-2xl overflow-hidden cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_4px_16px_rgba(255,255,255,0.08)] hover:translate-y-[-4px] hover:border-[#6A54E7] dark:hover:border-[#7C69FF] transition-all duration-300 focus:outline-2 focus:outline-[#6A54E7] dark:focus:outline-[#7C69FF] focus:outline-offset-2"
                >
                  {/* Destination Image */}
                  <div className="relative h-[180px] overflow-hidden">
                    <img
                      src={destination.image}
                      alt={destination.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center">
                      <Star
                        size={12}
                        className="text-yellow-500 fill-yellow-500 mr-1"
                      />
                      <span className="text-[12px] font-poppins font-semibold text-black dark:text-white">
                        {destination.rating}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    {/* Destination Name */}
                    <h3 className="text-[18px] sm:text-[20px] font-poppins font-bold text-black dark:text-white leading-tight mb-2 line-clamp-1">
                      {destination.name}
                    </h3>

                    {/* Crowd level / vibe */}
                    {destination.crowd && (
                      <span className="inline-flex items-center px-2.5 py-0.5 mb-2 rounded-full text-[11px] font-poppins font-medium bg-[#F5F3FF] dark:bg-[#2E2E3E] text-[#6A54E7] dark:text-[#7C69FF]">
                        {destination.crowd}
                      </span>
                    )}

                    {/* Description */}
                    <p className="text-[12px] sm:text-[13px] font-poppins font-normal text-[#6D6D6D] dark:text-[#A0A0A0] leading-relaxed mb-3 line-clamp-3">
                      {destination.description}
                    </p>

                    {/* Activities */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {destination.activities
                        .slice(0, 3)
                        .map((activity, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-[#F5F3FF] dark:bg-[#2E2E3E] rounded text-[11px] font-poppins font-medium text-[#6A54E7] dark:text-[#7C69FF]"
                          >
                            {activity}
                          </span>
                        ))}
                      {destination.activities.length > 3 && (
                        <span className="px-2 py-0.5 bg-[#F5F3FF] dark:bg-[#2E2E3E] rounded text-[11px] font-poppins font-medium text-[#6A54E7] dark:text-[#7C69FF]">
                          +{destination.activities.length - 3}
                        </span>
                      )}
                    </div>

                    {/* View Details */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-[#6A54E7] dark:text-[#7C69FF]">
                        <MapPin size={14} className="mr-1" />
                        <span className="text-[12px] font-poppins font-medium">
                          {currentIsland.name}
                        </span>
                      </div>
                      <span className="text-[13px] font-poppins font-semibold text-[#6A54E7] dark:text-[#7C69FF] group-hover:underline">
                        {t("kesfetIsland.card.details")}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
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

        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .line-clamp-3 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
}