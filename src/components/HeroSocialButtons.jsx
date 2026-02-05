import { Youtube } from "lucide-react";

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
          {showYoutube && (
            <a
              href="/youtube"
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
