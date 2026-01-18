import { kesfetDestinationDetailsTr } from './tr';
import { kesfetDestinationDetailsEn } from './en';
import { kesfetDestinationDetailsId } from './id';

const normalizeLang = (lng = '') => String(lng || '').split('-')[0].toLowerCase();

export function getKesfetDestinationDetailsForLang(lng) {
  const base = normalizeLang(lng);
  if (base === 'en') return kesfetDestinationDetailsEn;
  if (base === 'id' || base === 'in') return kesfetDestinationDetailsId;
  return kesfetDestinationDetailsTr;
}
