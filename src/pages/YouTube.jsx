import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { Play, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getYouTubeVideosForLang } from "../data/youtube";
import React from "react";
import { Link } from "react-router-dom";
import { staticAssetUrl } from "../utils/staticAssetUrl";
import { APP_INSTALL_PATH } from "../utils/appInstallLink";
import { trackClick } from "../utils/clickTracker";

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@endonezyakasifi';
const YOUTUBE_CHANNEL_VIDEOS_URL = 'https://www.youtube.com/@endonezyakasifi/videos';

function getYouTubeWatchUrl(videoId) {
  const id = String(videoId || '').trim();
  return id ? `https://www.youtube.com/watch?v=${id}` : YOUTUBE_CHANNEL_VIDEOS_URL;
}

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
  const youtubeHeroSrc = staticAssetUrl('/youtube-channel-banner.png');

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 relative overflow-hidden bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
        <div aria-hidden="true" className="absolute inset-0 opacity-70">
          <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.28),rgba(239,68,68,0)_68%)] blur-3xl" />
          <div className="absolute right-0 top-12 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.18),rgba(59,130,246,0)_72%)] blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Youtube className="text-red-300" size={48} />
            </div>
            <h1 className="text-2xl md:text-3xl font-medium text-white" style={{ textShadow: '0 3px 10px rgba(0,0,0,0.65)' }}>
              {t("youtubePage.hero.title")}
            </h1>
            <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-white/6 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm md:p-4">
              <div className="flex h-[220px] items-center justify-center overflow-hidden rounded-[22px] bg-[#0f1720] md:h-[320px] lg:h-[380px]">
                <img
                  src={youtubeHeroSrc}
                  alt="Endonezya Kasifi YouTube channel banner"
                  className="h-full w-full object-contain"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
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
              <a
                key={video.id}
                href={getYouTubeWatchUrl(video.videoId)}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-lg bg-white shadow-md transition duration-300 hover:shadow-xl"
                onClick={() => {
                  const videoId = String(video.videoId || '').trim();
                  if (!videoId) return;
                  void trackClick(`youtube_video_watch:${videoId}`, {
                    page: '/youtube',
                    trace: true,
                  });
                }}
              >
                {/* Thumbnail - Küçültülmüş */}
                <div className="relative w-full bg-gray-900 overflow-hidden aspect-video">
                  <YouTubeThumb videoId={video.videoId} title={video.title} />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition flex items-center justify-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#ff0033] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,0,51,0.35)] transition transform group-hover:scale-110">
                      <Youtube size={18} fill="currentColor" />
                      <span>YouTube</span>
                      <Play size={24} fill="currentColor" />
                    </div>
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

                  <div className="inline-flex items-center gap-2 rounded-full bg-[#ff0033] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(255,0,51,0.22)] md:text-sm">
                    <Youtube size={15} fill="currentColor" />
                    {t("youtubePage.video.watch")}
                  </div>
                </div>
              </a>
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
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={YOUTUBE_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#ff0033] px-6 py-3 font-semibold text-white shadow-[0_16px_34px_rgba(255,0,51,0.28)] transition hover:bg-[#e0002d] text-sm md:text-base"
                    onClick={() => {
                      void trackClick('youtube_channel_visit:cta', {
                        page: '/youtube',
                        trace: true,
                      });
                    }}
                  >
                    <Youtube size={20} fill="currentColor" />
                      {t('youtubePage.cta.visit')}
                  </a>
                  <Link
                    to={APP_INSTALL_PATH}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-2.5 font-medium text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 text-sm md:text-base"
                  >
                      {t('youtubePage.cta.installPage')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
