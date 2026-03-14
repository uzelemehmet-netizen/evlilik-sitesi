import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import HeroSocialButtons from "../components/HeroSocialButtons";
import { Play, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getYouTubeVideosForLang } from "../data/youtube";
import React from "react";
import { staticAssetUrl } from "../utils/staticAssetUrl";

const FALLBACK_THUMB_DATA_URL =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <rect width="1280" height="720" fill="#000"/>
      <g opacity="0.9">
        <circle cx="640" cy="360" r="84" fill="#fff" opacity="0.18"/>
        <path d="M 615 318 L 615 402 L 695 360 Z" fill="#fff"/>
      </g>
      <text x="50%" y="92%" text-anchor="middle" fill="#fff" font-size="28" font-family="Arial, sans-serif" opacity="0.9">Önizleme yüklenemedi</text>
    </svg>`
  );

function getYouTubeThumbnailCandidates(videoId) {
  const id = String(videoId || '').trim();
  if (!id) return [];

  // Some videos don't have max resolution thumbnails (404). Fall back gracefully.
  return [
    // Prefer self-hosted thumbs (works even when YouTube domains are blocked)
    staticAssetUrl(`/youtube-thumbs/${id}.jpg`),
    `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${id}/default.jpg`,
    // Secondary host (some networks treat these differently)
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    // Last resort: inline placeholder (avoids broken-image icon when thumbnails are blocked)
    FALLBACK_THUMB_DATA_URL,
  ];
}

function YouTubeThumb({ videoId, title }) {
  const candidates = getYouTubeThumbnailCandidates(videoId);
  const [index, setIndex] = React.useState(0);
  const src = candidates[index] || '';

  return (
    <img
      src={src}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
      loading="lazy"
      decoding="async"
      onError={() => {
        setIndex((prev) => (prev + 1 < candidates.length ? prev + 1 : prev));
      }}
    />
  );
}
export default function YouTube() {
  const { t, i18n } = useTranslation();
  const videos = getYouTubeVideosForLang(i18n.language);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-44 px-4 relative overflow-hidden min-h-96" style={{
  		backgroundImage: 'linear-gradient(180deg, rgba(15,23,42,0.45), rgba(15,23,42,0.75)), url(/ernests-vaga-mzJFI9o5_zc-unsplash.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center 112%',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Youtube className="text-red-300" size={48} />
            </div>
            <h1 className="text-2xl md:text-3xl font-medium text-white" style={{ textShadow: '0 3px 10px rgba(0,0,0,0.65)' }}>
              {t("youtubePage.hero.title")}
            </h1>
          </div>
        </div>
      </section>

      {/* Content Section Title */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl md:text-2xl font-medium text-gray-900 mb-3">
            {t("youtubePage.intro.title")}
          </h2>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">
            {t("youtubePage.intro.text")}
          </p>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="py-12 px-4" id="videos">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition duration-300 group"
              >
                {/* Thumbnail - Küçültülmüş */}
                <div className="relative w-full bg-gray-900 overflow-hidden aspect-video">
                  <YouTubeThumb videoId={video.videoId} title={video.title} />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition flex items-center justify-center">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition transform group-hover:scale-110"
                    >
                      <Play size={24} fill="currentColor" />
                    </a>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-sm md:text-base font-medium text-gray-900 mb-2 group-hover:text-red-600 transition line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-gray-600 text-xs md:text-sm mb-4 line-clamp-2">
                    {video.description}
                  </p>

                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-red-600 font-medium hover:text-red-700 transition text-xs md:text-sm"
                  >
                    <Play size={14} fill="currentColor" />
                    {t("youtubePage.video.watch")}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="flex items-start gap-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0">
                <Youtube className="text-red-600" size={32} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-medium text-gray-900 mb-3">
                  {t("youtubePage.cta.title")}
                </h2>
                <p className="text-gray-600 text-sm md:text-base mb-6">
                  {t("youtubePage.cta.text")}
                </p>
                <a
                  href="#videos"
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition text-sm md:text-base"
                >
                  <Youtube size={20} />
                  {t("youtubePage.cta.visit")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
