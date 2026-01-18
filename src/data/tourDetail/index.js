import { toursDataTr } from './tr';
import { toursDataEn } from './en';
import { toursDataId } from './id';

export function getToursDataForLang(lng) {
  const raw = lng == null ? 'tr' : String(lng);
  const base = raw.toLowerCase().split(/[-_]/)[0];
  if (base === 'en') return toursDataEn;
  if (base === 'id' || base === 'in') return toursDataId;
  return toursDataTr;
}
