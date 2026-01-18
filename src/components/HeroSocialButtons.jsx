import { Youtube } from "lucide-react";

const instagramLink = "https://www.instagram.com/endonezyakasifi";
const youtubeLink = "https://www.youtube.com/@endonezyakasifi";

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="w-4 h-4"
    >
      <defs>
        <linearGradient id="igGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="40%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#8134AF" />
        </linearGradient>
      </defs>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill="url(#igGradient)"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="white"
        strokeWidth="2"
      />
      <circle cx="17" cy="7" r="1.2" fill="white" />
    </svg>
  );
}

export default function HeroSocialButtons({ align = "left", showYoutube = true, inline = false }) {
  const horizontalClass = align === "right" ? "right-4" : "left-4";
  const wrapperClass = inline ? "" : `absolute ${horizontalClass} bottom-4 z-20`;

  return (
    <div className={wrapperClass}>
      <div className="flex items-center gap-3 rounded-full bg-black/35 backdrop-blur-md px-4 py-2 shadow-lg border border-white/20">
        <span className="hidden sm:inline text-xs font-medium text-white/80 tracking-wide">
          Bizi takip edin
        </span>
        <div className="flex items-center gap-2">
          <a
            href={instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white pl-2 pr-3 py-1.5 text-xs font-semibold shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-200"
            title="Instagram"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white">
              <InstagramIcon />
            </span>
            <span className="hidden sm:inline border-l border-white/30 pl-2 ml-1">
              Instagram
            </span>
          </a>
          {showYoutube && (
            <a
              href={youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-3 py-1.5 text-xs font-semibold shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-200"
              title="YouTube"
            >
              <Youtube size={16} />
              <span className="hidden sm:inline">YouTube</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
