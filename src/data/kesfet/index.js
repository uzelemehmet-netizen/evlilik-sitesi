import { kesfetDataTr } from "./tr";
import { kesfetDataEn } from "./en";
import { kesfetDataId } from "./id";

export function getKesfetDataForLang(lng) {
  const raw = lng == null ? "tr" : String(lng);
  const base = raw.toLowerCase().split(/[-_]/)[0];
  if (base === "en") return kesfetDataEn;
  if (base === "id" || base === "in") return kesfetDataId;
  return kesfetDataTr;
}
