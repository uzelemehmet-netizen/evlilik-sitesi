import { youtubeVideosTr } from "./tr";
import { youtubeVideosEn } from "./en";
import { youtubeVideosId } from "./id";

const normalizeLang = (lng = "") => String(lng || "").split("-")[0].toLowerCase();

export function getYouTubeVideosForLang(lng) {
  const base = normalizeLang(lng);
  if (base === "en") return youtubeVideosEn;
  if (base === "id" || base === "in") return youtubeVideosId;
  return youtubeVideosTr;
}
