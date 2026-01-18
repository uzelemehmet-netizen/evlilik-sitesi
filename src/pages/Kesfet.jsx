import { useState, useEffect } from "react";
import { MapPin, ChevronRight, Palmtree } from "lucide-react";
import Navigation from "../components/Navigation";
import HeroSocialButtons from "../components/HeroSocialButtons";
import { db } from "../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { getKesfetDataForLang } from "../data/kesfet";

export default function KesfetPage() {
  const [imageUrls, setImageUrls] = useState({});
  const [activeFilter, setActiveFilter] = useState("hepsi");
  const { t, i18n } = useTranslation();

  const DEFAULT_YOUTUBE_SHORTS_KEŞFET = [
    "https://youtube.com/shorts/GMWJqDjrfCc?si=EvzLwcEHvNgrsmBB",
    "https://youtube.com/shorts/Mekyn6lNScU?si=L_fcl1et_3Ux1HlF",
    "https://youtube.com/shorts/MAwCT5fAexg?si=baM6FEK-FEnFO8NE",
    "https://youtube.com/shorts/IMtr5iyK_wo?si=cYcPTTBblJcm_967",
    "https://youtube.com/shorts/XC-PBPhRwPY?si=DnhZJHCXjW5XgY3R",
    "https://youtube.com/shorts/IDAnn-tz6HA?si=aF6Fsi_gi44a7_5F",
  ];

  const toYouTubeEmbedUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== "string") return "";
    const input = rawUrl.trim();
    if (!input) return "";

    try {
      const url = new URL(input);
      let videoId = "";

      if (url.hostname === "youtu.be") {
        videoId = url.pathname.replace(/^\//, "").split("/")[0];
      } else if (url.pathname.startsWith("/shorts/")) {
        videoId = url.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      } else {
        videoId = url.searchParams.get("v") || "";
      }

      if (!videoId) return "";
      return `https://www.youtube.com/embed/${videoId}`;
    } catch {
      const match = input.match(/(?:shorts\/|v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
      if (!match?.[1]) return "";
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  };

  // localStorage'dan resim URL'lerini ilk değer olarak yükle
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

  // Firestore'dan imageUrls konfigurasyonunu dinle
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
    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_title: t("kesfet.analyticsTitle"),
        page_path: "/kesfet",
      });
    }
  }, [i18n.language, t]);

  const { islands } = getKesfetDataForLang(i18n.language);

  const resolveImageUrl = (image) => {
    if (!image) return "";
    if (typeof image === "string") return image;
    const { storageKey, defaultUrl } = image;
    return (storageKey && imageUrls[storageKey]) || defaultUrl || "";
  };

  const filters = ["hepsi", "balayi", "aile", "macera", "sakin"].map((id) => ({
    id,
    label: t(`kesfet.filters.${id}`),
  }));

  const filteredIslands =
    activeFilter === "hepsi"
      ? islands
      : islands.filter((island) => island.tags?.includes(activeFilter));

  const totalDestinations = islands.reduce(
    (sum, island) => sum + (Number(island.destinationCount) || 0),
    0,
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col">
        <Navigation />

        <div className="flex flex-1">
          <div className="flex-1">
            <div
              className="relative py-12 sm:py-16 lg:py-20 overflow-hidden"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="absolute inset-0 bg-black/30" />
              <div className="max-w-none ml-0 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-4xl">
                  <div className="flex items-center mb-4">
                    <Palmtree size={32} className="text-white mr-3" />
                    <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-poppins font-bold text-white leading-tight">
                      {t("kesfet.heroTitle")}
                    </h1>
                  </div>
                  <p className="text-[16px] sm:text-[18px] lg:text-[20px] font-poppins font-normal text-white/90 max-w-2xl mb-4">
                    {t("kesfet.heroSubtitle")}
                  </p>

                  <div className="inline-flex flex-wrap items-center gap-3 text-[12px] sm:text-[13px] font-inter text-white/90 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="flex items-center gap-1">
                      <span className="text-xs">🏝</span>
                      <span>{t("kesfet.stats.islands", { count: islands.length })}</span>
                    </span>
                    <span className="h-3 w-px bg-white/40 hidden sm:inline-block" />
                    <span className="flex items-center gap-1">
                      <span className="text-xs">📍</span>
                      <span>{t("kesfet.stats.destinations", { count: totalDestinations })}</span>
                    </span>
                    <span className="h-3 w-px bg-white/40 hidden sm:inline-block" />
                    <span className="flex items-center gap-1">
                      <span className="text-xs">✨</span>
                      <span>{t("kesfet.stats.suggestions")}</span>
                    </span>
                  </div>
                </div>
                <HeroSocialButtons align="right" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#121212]">
              <div className="max-w-none ml-0 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                <div className="mb-8">
                  <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-poppins font-bold text-black dark:text-white leading-tight mb-2">
                    {t("kesfet.sectionTitle")}
                  </h2>
                  <p className="text-[14px] sm:text-[16px] font-poppins font-normal text-[#555555] dark:text-[#A0A0A0]">
                    {t("kesfet.sectionSubtitle")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {filters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-inter border transition-all duration-200 ${
                          activeFilter === filter.id
                            ? "bg-[#FF8940] text-white border-[#FF8940] shadow-sm"
                            : "bg-white/70 dark:bg-[#1E1E1E] text-[#555555] dark:text-[#CCCCCC] border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#232323]"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {filteredIslands.map((island) => (
                    <a
                      key={island.id}
                      href={`/kesfet/${island.id}`}
                      className="group bg-white dark:bg-[#1E1E1E] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <img
                          src={resolveImageUrl(island.image)}
                          alt={island.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                          <div className="w-full px-4 pb-3 flex items-center justify-between text-[12px] sm:text-[13px] text-white/90">
                            <span className="font-medium">
                              {t("kesfet.card.overlayExplore", { name: island.name })}
                            </span>
                            <ChevronRight size={16} className="shrink-0" />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6">
                        <p className="text-[11px] sm:text-[12px] font-inter font-medium uppercase tracking-[0.16em] text-[#FF8940] dark:text-[#FF9D55] mb-1">
                          {t("kesfet.card.categoryLabel")}
                        </p>
                        <h3 className="text-[18px] sm:text-[20px] font-poppins font-bold text-black dark:text-white mb-2">
                          {island.name}
                        </h3>
                        {island.tags && island.tags.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-1.5">
                            {island.tags
                              .filter((tag) => t(`kesfet.tagLabels.${tag}`, { defaultValue: "" }))
                              .slice(0, 2)
                              .map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-inter font-medium bg-[#FF8940]/10 text-[#FF8940] dark:text-[#FF9D55] border border-[#FF8940]/30"
                                >
                                  {t(`kesfet.tagLabels.${tag}`)}
                                </span>
                              ))}
                          </div>
                        )}
                        <p className="text-[13px] sm:text-[14px] font-inter text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-5 mb-4">
                          {island.description}
                        </p>

                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-[13px] font-inter font-semibold text-gray-700 dark:text-gray-300">
                            <MapPin size={16} className="inline mr-1 text-[#FF8940]" />
                            {t("kesfet.card.destinations", { count: island.destinationCount })}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {island.highlights.slice(0, 2).map((highlight, idx) => (
                            <span
                              key={idx}
                              className="text-[12px] font-inter font-medium px-3 py-1.5 bg-[#FF8940] bg-opacity-10 text-[#FF8940] dark:text-[#FF9D55] rounded-full"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>

                        <div className="inline-flex items-center gap-1 text-[13px] sm:text-[14px] font-inter font-semibold text-[#FF8940] dark:text-[#FF9D55] bg-[#FF8940] bg-opacity-10 dark:bg-[#FF9D55] dark:bg-opacity-15 border border-[#FF8940] border-opacity-30 rounded-full px-4 py-2 transition-colors duration-300 hover:bg-opacity-20 dark:hover:bg-opacity-25">
                          <span>{t("kesfet.card.viewDetails")}</span>
                          <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Ada kartlarının altı: YouTube Shorts izleme alanı (3x2) */}
                <div className="mt-10 max-w-6xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DEFAULT_YOUTUBE_SHORTS_KEŞFET.map((u, idx) => {
                      const embedUrl = toYouTubeEmbedUrl(u);
                      return (
                        <div key={`${idx}-${u}`} className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                          <div className="relative w-full pt-[177.78%]">
                            {embedUrl ? (
                              <iframe
                                src={embedUrl}
                                title={`YouTube Shorts ${idx + 1}`}
                                className="absolute inset-0 w-full h-full"
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                                {t("kesfet.videoNotFound")}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

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
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }

        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .line-clamp-5 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
        }
      `,
        }}
      />
    </>
  );
}
