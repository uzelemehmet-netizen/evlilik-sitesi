import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { collection, doc, getDoc, getDocFromServer, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../auth/AuthProvider';
import { db } from '../../config/firebaseDb';
import { authFetch } from '../../utils/authFetch';
import { getPresenceMeta } from '../../utils/presenceLabel';
import { getLocalizedProfileText } from '../../utils/profileText';
import { translateStudioApiError } from '../../utils/studioErrorI18n';
import StudioInboxModal from '../../components/studio/StudioInboxModal';
import { useMatchmakingResetAtMs } from '../../utils/matchmakingReset';
import { AlertTriangle, ChevronDown, ChevronUp, Filter, HelpCircle, RefreshCcw, ShieldCheck, Star, Users, X } from 'lucide-react';
import ImageLightbox from '../../components/ImageLightbox';
import PwaInstallCard from '../../components/PwaInstallCard';
import StudioInviteFriendsCard from '../../components/studio/StudioInviteFriendsCard.jsx';
import { openPreviewGate } from '../../utils/previewGate';
import { buildPreviewPoolItems } from '../../utils/studioPreviewData';
import StudioBottomNav from '../../components/studio/StudioBottomNav';
import { isTutorialActive } from '../../utils/tutorialState.js';
import { isOneTimeHintShown, markOneTimeHintShown } from '../../utils/oneTimeHints.js';
import {
  hasAnyMatchmakingPhotoInApplicationDoc,
  hasAnyStoredMatchmakingPhotoInApplicationDoc,
  hasAnyMatchmakingPhotoInUserDoc,
  hasAnyMatchmakingProfileInApplicationDoc,
  hasAnyMatchmakingProfileInUserDoc,
  hasMinimumMatchmakingProfileInUserDoc,
  isStubMatchmakingApplication,
} from '../../utils/matchmakingProfileCompletion';

const NEW_USER_BADGE_WINDOW_MS = 48 * 60 * 60 * 1000;
const INITIAL_POOL_LIMIT = 120;
const POOL_LOAD_MORE_STEP = 120;
const POOL_RETRY_DELAYS_MS = [1500, 4000];
const OPTIONAL_DETAILS_HINT_ID = 'matchmaking-optional-details-v1';
const POOL_FILTERS_TUTORIAL_HINT_ID = 'pool-filters-tutorial-v1';
const REVIEW_PROMPT_STATUS_EVENT = 'uniqah:app-review-prompt:status';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeProfileTextUiLang(value) {
  const base = safeStr(value).toLowerCase().split(/[-_]/)[0] || '';
  return base === 'tr' || base === 'id' ? base : '';
}

function getStoredProfileTextVariant(profile, field, uiLang) {
  const lang = normalizeProfileTextUiLang(uiLang);
  if (!lang || !profile || typeof profile !== 'object') return '';
  return lang === 'tr' ? safeStr(profile?.[`${field}Tr`]) : safeStr(profile?.[`${field}Id`]);
}

function poolCacheKey(uid) {
  const id = safeStr(uid) || 'guest';
  return `uniqah:pool-cache:v2:${id}`;
}

function readPoolCache(uid) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(poolCacheKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    const meta = parsed?.meta && typeof parsed.meta === 'object' ? parsed.meta : null;
    const savedAtMs = typeof parsed?.savedAtMs === 'number' && Number.isFinite(parsed.savedAtMs) ? parsed.savedAtMs : 0;
    if (!items.length) return null;
    return { items, meta, savedAtMs };
  } catch {
    return null;
  }
}

function writePoolCache(uid, payload) {
  if (typeof window === 'undefined') return;
  try {
    const items = Array.isArray(payload?.items) ? payload.items : [];
    if (!items.length) return;
    const meta = payload?.meta && typeof payload.meta === 'object' ? payload.meta : null;
    sessionStorage.setItem(
      poolCacheKey(uid),
      JSON.stringify({
        items,
        meta,
        savedAtMs: Date.now(),
      })
    );
  } catch {
    // ignore
  }
}

const OPEN_CHAT_MODEL = true;

function isMinimumProfileCompleteFromUserDoc(d) {
  return hasMinimumMatchmakingProfileInUserDoc(d);
}

function clip(s, maxLen) {
  const v = safeStr(s);
  if (!v) return '';
  return v.length > maxLen ? `${v.slice(0, maxLen)}…` : v;
}

function genderLabel(t, raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  if (s === 'female' || s === 'f' || s === 'kadin' || s === 'kadın') return t('matchmakingPage.form.options.gender.female');
  if (s === 'male' || s === 'm' || s === 'erkek') return t('matchmakingPage.form.options.gender.male');
  return '';
}

function maritalStatusLabel(t, raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  const map = {
    single: 'matchmakingPage.form.options.maritalStatus.single',
    widowed: 'matchmakingPage.form.options.maritalStatus.widowed',
    divorced: 'matchmakingPage.form.options.maritalStatus.divorced',
    other: 'matchmakingPage.form.options.maritalStatus.other',
    doesnt_matter: 'matchmakingPage.form.options.maritalStatus.doesnt_matter',
  };
  const key = map[s] || '';
  return key ? t(key) : safeStr(raw);
}

function hasMeaningfulProfileValue(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'boolean') return true;
  if (Array.isArray(v)) return v.some((item) => hasMeaningfulProfileValue(item));
  if (typeof v === 'object') return Object.values(v).some((item) => hasMeaningfulProfileValue(item));
  return true;
}

function formatYesNoLike(t, raw) {
  if (raw === true) return t('matchmakingPage.form.options.common.yes');
  if (raw === false) return t('matchmakingPage.form.options.common.no');
  const value = safeStr(raw).toLowerCase();
  if (!value) return '';
  if (value === 'yes') return t('matchmakingPage.form.options.common.yes');
  if (value === 'no') return t('matchmakingPage.form.options.common.no');
  if (value === 'unsure') return t('matchmakingPage.form.options.common.unsure');
  if (value === 'doesnt_matter' || value === 'doesntmatter') return t('matchmakingPage.form.options.common.doesntMatter');
  return safeStr(raw);
}

function formatGenderLabel(t, raw) {
  const value = safeStr(raw).toLowerCase();
  if (!value) return '';
  if (value === 'female' || value === 'f' || value === 'kadin' || value === 'kadın') return t('matchmakingPage.form.options.gender.female');
  if (value === 'male' || value === 'm' || value === 'erkek') return t('matchmakingPage.form.options.gender.male');
  return safeStr(raw);
}

function formatNationalityLabel(t, raw) {
  const value = safeStr(raw).toLowerCase();
  if (!value) return '';
  if (value === 'tr' || value === 'turkey' || value === 'turkiye' || value === 'türkiye' || value === 'turkish') {
    return t('matchmakingPage.form.options.nationality.tr');
  }
  if (value === 'id' || value === 'indonesia' || value === 'indonesian') return t('matchmakingPage.form.options.nationality.id');
  if (value === 'other') return t('matchmakingPage.form.options.nationality.other');
  return safeStr(raw);
}

function formatCountryLabel(t, raw) {
  const value = safeStr(raw).toLowerCase();
  if (!value) return '';

  const countryMap = {
    tr: 'matchmakingPage.form.options.livingCountry.tr',
    turkey: 'matchmakingPage.form.options.livingCountry.tr',
    turkiye: 'matchmakingPage.form.options.livingCountry.tr',
    'türkiye': 'matchmakingPage.form.options.livingCountry.tr',
    id: 'matchmakingPage.form.options.livingCountry.id',
    indonesia: 'matchmakingPage.form.options.livingCountry.id',
    other: 'matchmakingPage.form.options.common.other',
  };

  const key = countryMap[value] || '';
  return key ? t(key) : safeStr(raw);
}

function formatMappedProfileValue(t, kind, raw, extra = '') {
  const value = safeStr(raw).toLowerCase();
  if (!value) return '';

  const maps = {
    maritalStatus: {
      single: 'matchmakingPage.form.options.maritalStatus.single',
      widowed: 'matchmakingPage.form.options.maritalStatus.widowed',
      divorced: 'matchmakingPage.form.options.maritalStatus.divorced',
      other: 'matchmakingPage.form.options.maritalStatus.other',
      doesnt_matter: 'matchmakingPage.form.options.maritalStatus.doesnt_matter',
    },
    childrenLivingSituation: {
      with_children: 'matchmakingPage.form.options.childrenLivingSituation.withChildren',
      separate: 'matchmakingPage.form.options.childrenLivingSituation.separate',
    },
    education: {
      secondary: 'matchmakingPage.form.options.education.secondary',
      high_school: 'matchmakingPage.form.options.education.highSchool',
      highschool: 'matchmakingPage.form.options.education.highSchool',
      university: 'matchmakingPage.form.options.education.university',
      masters: 'matchmakingPage.form.options.education.masters',
      phd: 'matchmakingPage.form.options.education.phd',
      other: 'matchmakingPage.form.options.education.other',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    },
    occupation: {
      civil_servant: 'matchmakingPage.form.options.occupation.civilServant',
      civilservant: 'matchmakingPage.form.options.occupation.civilServant',
      employee: 'matchmakingPage.form.options.occupation.employee',
      retired: 'matchmakingPage.form.options.occupation.retired',
      business_owner: 'matchmakingPage.form.options.occupation.businessOwner',
      businessowner: 'matchmakingPage.form.options.occupation.businessOwner',
      other: 'matchmakingPage.form.options.occupation.other',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    },
    religion: {
      islam: 'matchmakingPage.form.options.religion.islam',
      christian: 'matchmakingPage.form.options.religion.christian',
      hindu: 'matchmakingPage.form.options.religion.hindu',
      buddhist: 'matchmakingPage.form.options.religion.buddhist',
      other: 'matchmakingPage.form.options.religion.other',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    },
    religiousValues: {
      weak: 'matchmakingPage.form.options.religiousValues.weak',
      medium: 'matchmakingPage.form.options.religiousValues.medium',
      conservative: 'matchmakingPage.form.options.religiousValues.conservative',
    },
    incomeLevel: {
      low: 'matchmakingPage.form.options.income.low',
      medium: 'matchmakingPage.form.options.income.medium',
      good: 'matchmakingPage.form.options.income.good',
      verygood: 'matchmakingPage.form.options.income.veryGood',
      very_good: 'matchmakingPage.form.options.income.veryGood',
      prefernot: 'matchmakingPage.form.options.income.preferNot',
      prefer_not_to_say: 'matchmakingPage.form.options.income.preferNot',
    },
    marriageTimeline: {
      '0_3': 'matchmakingPage.form.options.timeline.0_3',
      '3_6': 'matchmakingPage.form.options.timeline.3_6',
      '6_12': 'matchmakingPage.form.options.timeline.6_12',
      '1_plus': 'matchmakingPage.form.options.timeline.1_plus',
    },
    communicationLanguage: {
      tr: 'matchmakingPage.form.options.commLanguage.tr',
      id: 'matchmakingPage.form.options.commLanguage.id',
      en: 'matchmakingPage.form.options.commLanguage.en',
      ar: 'myInfo.fields.foreignLanguageOther',
      translation_app: 'matchmakingPage.form.options.commLanguage.translationApp',
      translationapp: 'matchmakingPage.form.options.commLanguage.translationApp',
      other: 'matchmakingPage.form.options.commLanguage.other',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    },
    livingCountry: {
      tr: 'matchmakingPage.form.options.livingCountry.tr',
      turkey: 'matchmakingPage.form.options.livingCountry.tr',
      turkiye: 'matchmakingPage.form.options.livingCountry.tr',
      'türkiye': 'matchmakingPage.form.options.livingCountry.tr',
      id: 'matchmakingPage.form.options.livingCountry.id',
      indonesia: 'matchmakingPage.form.options.livingCountry.id',
      other: 'matchmakingPage.form.options.common.other',
    },
  };

  const key = maps?.[kind]?.[value] || '';
  if (key) {
    if (kind === 'communicationLanguage' && value === 'ar') return 'Arapca';
    return t(key);
  }

  if (kind === 'smoking' || kind === 'alcohol' || kind === 'familyApprovalStatus' || kind === 'relocationWillingness') {
    return formatYesNoLike(t, raw);
  }

  if (kind === 'communicationLanguage' && value === 'other') {
    return extra ? `${t('matchmakingPage.form.options.commLanguage.other')}: ${extra}` : t('matchmakingPage.form.options.commLanguage.other');
  }

  return safeStr(raw);
}

function formatLanguageChoice(t, raw, other = '') {
  const formatted = formatMappedProfileValue(t, 'communicationLanguage', raw, other);
  if (safeStr(raw).toLowerCase() === 'other' && other) return `${formatted}: ${other}`;
  return formatted || safeStr(other);
}

function buildPoolCardProfileFields(profile, t, uiLang) {
  const current = profile && typeof profile === 'object' ? profile : {};
  const details = current?.details && typeof current.details === 'object' ? current.details : {};
  const languages = details?.languages && typeof details.languages === 'object' ? details.languages : {};
  const nativeLang = languages?.native && typeof languages.native === 'object' ? languages.native : {};
  const foreignLang = languages?.foreign && typeof languages.foreign === 'object' ? languages.foreign : {};

  return [
    { label: t('studio.myInfo.fields.age'), value: typeof current?.age === 'number' ? String(current.age) : '' },
    { label: t('studio.myInfo.fields.city'), value: safeStr(current?.city) },
    { label: t('studio.myInfo.fields.country'), value: formatCountryLabel(t, current?.country) },
    { label: t('studio.myInfo.fields.nationality'), value: formatNationalityLabel(t, current?.nationality) },
    { label: t('studio.myInfo.fields.gender'), value: formatGenderLabel(t, current?.gender) },
    { label: t('matchmakingPage.form.labels.lookingForGender'), value: formatGenderLabel(t, current?.lookingForGender) },
    { label: t('matchmakingPage.form.labels.lookingForNationality'), value: formatNationalityLabel(t, current?.lookingForNationality) },
    { label: t('studio.myInfo.fields.heightCm'), value: typeof details?.heightCm === 'number' ? `${details.heightCm} cm` : '' },
    { label: t('studio.myInfo.fields.weightKg'), value: typeof details?.weightKg === 'number' ? `${details.weightKg} kg` : '' },
    {
      label: t('studio.myInfo.fields.occupation'),
      value: formatMappedProfileValue(t, 'occupation', getLocalizedProfileText(details, 'occupation', uiLang) || details?.occupation || current?.occupation) || safeStr(getLocalizedProfileText(details, 'occupation', uiLang) || details?.occupation || current?.occupation),
    },
    {
      label: t('studio.myInfo.fields.education'),
      value: formatMappedProfileValue(t, 'education', details?.education || current?.education) || safeStr(details?.education || current?.education),
    },
    {
      label: t('studio.myInfo.fields.educationDepartment'),
      value: getLocalizedProfileText(details, 'educationDepartment', uiLang) || safeStr(details?.educationDepartment),
    },
    { label: t('studio.myInfo.fields.maritalStatus'), value: formatMappedProfileValue(t, 'maritalStatus', details?.maritalStatus || current?.maritalStatus) },
    { label: t('studio.myInfo.fields.hasChildren'), value: formatYesNoLike(t, details?.hasChildren || current?.hasChildren) },
    { label: t('studio.myInfo.fields.childrenCount'), value: typeof details?.childrenCount === 'number' ? String(details.childrenCount) : '' },
    { label: t('studio.myInfo.fields.childrenLivingSituation'), value: formatMappedProfileValue(t, 'childrenLivingSituation', details?.childrenLivingSituation) },
    { label: t('studio.myInfo.fields.liveWithChildrenAfterMarriage'), value: formatYesNoLike(t, details?.liveWithChildrenAfterMarriage) },
    { label: t('studio.myInfo.fields.familyApprovalStatus'), value: formatMappedProfileValue(t, 'familyApprovalStatus', details?.familyApprovalStatus) },
    { label: t('studio.myInfo.fields.religion'), value: formatMappedProfileValue(t, 'religion', details?.religion) },
    {
      label: t('studio.myInfo.fields.religiousValues'),
      value: formatMappedProfileValue(t, 'religiousValues', details?.religiousValues) || safeStr(details?.religiousValues),
    },
    { label: t('studio.myInfo.fields.incomeLevel'), value: formatMappedProfileValue(t, 'incomeLevel', details?.incomeLevel) },
    { label: t('studio.myInfo.fields.marriageTimeline'), value: formatMappedProfileValue(t, 'marriageTimeline', details?.marriageTimeline) },
    { label: t('studio.myInfo.fields.relocationWillingness'), value: formatMappedProfileValue(t, 'relocationWillingness', details?.relocationWillingness) },
    { label: t('studio.myInfo.fields.preferredLivingCountry'), value: formatMappedProfileValue(t, 'livingCountry', details?.preferredLivingCountry) || formatCountryLabel(t, details?.preferredLivingCountry) },
    { label: t('studio.myInfo.fields.nativeLanguage'), value: formatLanguageChoice(t, nativeLang?.code, nativeLang?.other) },
    {
      label: t('studio.myInfo.fields.foreignLanguages'),
      value: Array.isArray(foreignLang?.codes)
        ? foreignLang.codes
            .map((code) => formatLanguageChoice(t, code, code === 'other' ? foreignLang?.other : ''))
            .filter(Boolean)
            .join(', ')
        : '',
    },
    {
      label: t('studio.myInfo.fields.communicationLanguage'),
      value: formatLanguageChoice(t, details?.communicationLanguage, getLocalizedProfileText(details, 'communicationLanguageOther', uiLang) || details?.communicationLanguageOther || ''),
    },
    {
      label: t('matchmakingPage.form.labels.partnerTranslationApp'),
      value:
        details?.communicationLanguage === 'translation_app' || details?.canCommunicateWithTranslationApp === true
          ? t('apply.form.options.common.yes')
          : details?.communicationLanguage
            ? t('apply.form.options.common.no')
            : '',
    },
    { label: t('studio.myInfo.fields.smoking'), value: formatMappedProfileValue(t, 'smoking', details?.smoking || current?.smoking) },
    { label: t('studio.myInfo.fields.alcohol'), value: formatMappedProfileValue(t, 'alcohol', details?.alcohol || current?.alcohol) },
  ].filter((item) => hasMeaningfulProfileValue(item.value));
}

function createPoolFilters() {
  return {
    ageMin: '',
    ageMax: '',
    photoOnly: false,
    verifiedOnly: false,
    maritalStatuses: [],
  };
}

function createInteractionFilterDraft() {
  return {
    requireVerified: false,
    requirePhoto: false,
    ageMin: '',
    ageMax: '',
    allowedMaritalStatuses: [],
  };
}

function parseFilterNumber(raw) {
  const value = Number.parseInt(String(raw || '').trim(), 10);
  return Number.isFinite(value) ? value : null;
}

function normalizeMaritalStatus(raw) {
  const value = safeStr(raw).toLowerCase();
  if (!value) return '';
  if (value === 'single' || value === 'widowed' || value === 'divorced' || value === 'other' || value === 'doesnt_matter') {
    return value;
  }
  return '';
}

function buildInteractionFilterDraft(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const allowedMaritalStatuses = Array.isArray(source?.allowedMaritalStatuses)
    ? Array.from(new Set(source.allowedMaritalStatuses.map((item) => normalizeMaritalStatus(item)).filter(Boolean)))
    : [];

  return {
    requireVerified: source?.requireVerified === true,
    requirePhoto: source?.requirePhoto === true,
    ageMin: source?.ageMin === null || source?.ageMin === undefined ? '' : String(source.ageMin).trim(),
    ageMax: source?.ageMax === null || source?.ageMax === undefined ? '' : String(source.ageMax).trim(),
    allowedMaritalStatuses,
  };
}

function normalizeInteractionFilterPayload(draft) {
  const current = draft && typeof draft === 'object' ? draft : createInteractionFilterDraft();
  const ageMin = parseFilterNumber(current?.ageMin);
  const ageMax = parseFilterNumber(current?.ageMax);
  const payload = {
    requireVerified: current?.requireVerified === true,
    requirePhoto: current?.requirePhoto === true,
    ageMin: Number.isFinite(ageMin) && ageMin >= 18 && ageMin <= 99 ? ageMin : null,
    ageMax: Number.isFinite(ageMax) && ageMax >= 18 && ageMax <= 99 ? ageMax : null,
    allowedMaritalStatuses: Array.isArray(current?.allowedMaritalStatuses)
      ? Array.from(new Set(current.allowedMaritalStatuses.map((item) => normalizeMaritalStatus(item)).filter(Boolean)))
      : [],
  };

  if (payload.ageMin !== null && payload.ageMax !== null && payload.ageMax < payload.ageMin) {
    payload.ageMax = payload.ageMin;
  }

  return payload;
}

function hasActiveInteractionFilterDraft(draft) {
  const payload = normalizeInteractionFilterPayload(draft);
  return !!(
    payload.requireVerified ||
    payload.requirePhoto ||
    payload.ageMin !== null ||
    payload.ageMax !== null ||
    payload.allowedMaritalStatuses.length > 0
  );
}

function getProfileAgeValue(profile) {
  return typeof profile?.age === 'number' && Number.isFinite(profile.age) ? profile.age : null;
}

function getProfilePhotoCount(profile) {
  const list = Array.isArray(profile?.photoUrls) ? profile.photoUrls.map((item) => safeStr(item)).filter(Boolean) : [];
  if (list.length) return list.length;
  return safeStr(profile?.photoUrl) ? 1 : 0;
}

function isProfileVerified(profile) {
  return profile?.identityVerified === true || safeStr(profile?.identityVerification?.status).toLowerCase() === 'approved';
}

function getProfileMaritalStatus(profile) {
  return normalizeMaritalStatus(profile?.details?.maritalStatus || profile?.maritalStatus);
}

function profileMatchesPoolFilters(profile, filters) {
  const candidate = profile && typeof profile === 'object' ? profile : null;
  if (!candidate) return false;

  const ageMin = parseFilterNumber(filters?.ageMin);
  const ageMax = parseFilterNumber(filters?.ageMax);
  const age = getProfileAgeValue(candidate);
  if (ageMin !== null && (age === null || age < ageMin)) return false;
  if (ageMax !== null && (age === null || age > ageMax)) return false;

  if (filters?.photoOnly && getProfilePhotoCount(candidate) <= 0) return false;
  if (filters?.verifiedOnly && !isProfileVerified(candidate)) return false;

  const maritalStatuses = Array.isArray(filters?.maritalStatuses) ? filters.maritalStatuses.filter(Boolean) : [];
  if (maritalStatuses.length) {
    const marital = getProfileMaritalStatus(candidate);
    if (!maritalStatuses.includes(marital)) return false;
  }

  return true;
}

function hasFilledOptionalDetails(application) {
  const app = application && typeof application === 'object' ? application : null;
  if (!app || isStubMatchmakingApplication(app)) return false;

  const details = app?.details && typeof app.details === 'object' ? app.details : {};
  const partner = app?.partnerPreferences && typeof app.partnerPreferences === 'object' ? app.partnerPreferences : {};
  const languages = details?.languages && typeof details.languages === 'object' ? details.languages : {};
  const nativeLang = languages?.native && typeof languages.native === 'object' ? languages.native : {};
  const foreignLang = languages?.foreign && typeof languages.foreign === 'object' ? languages.foreign : {};

  const hasValue = (value) => {
    if (Array.isArray(value)) return value.some((item) => hasValue(item));
    if (value === null || value === undefined) return false;
    if (typeof value === 'number') return Number.isFinite(value);
    if (typeof value === 'boolean') return value;
    const str = safeStr(value);
    return !!str && str !== 'doesnt_matter' && str !== 'any';
  };

  const optionalDetailValues = [
    details?.heightCm,
    details?.weightKg,
    details?.education,
    details?.educationDepartment,
    details?.incomeLevel,
    details?.religion,
    details?.religiousValues,
    details?.familyApprovalStatus,
    details?.marriageTimeline,
    details?.relocationWillingness,
    details?.preferredLivingCountry,
    details?.communicationLanguage,
    details?.communicationLanguageOther,
    details?.smoking,
    details?.alcohol,
    nativeLang?.code,
    nativeLang?.other,
    foreignLang?.codes,
    foreignLang?.other,
    app?.about,
    app?.aboutTr,
    app?.aboutId,
    app?.expectations,
    app?.expectationsTr,
    app?.expectationsId,
  ];

  if (optionalDetailValues.some((value) => hasValue(value))) return true;
  return Object.entries(partner).some(([, value]) => hasValue(value));
}

function pickBestApplicationCandidate(currentBest, nextApp) {
  const best = currentBest && typeof currentBest === 'object' ? currentBest : null;
  const candidate = nextApp && typeof nextApp === 'object' ? nextApp : null;
  if (!candidate) return best;
  if (!best) return candidate;

  const score = (item) => {
    const source = safeStr(item?.source).toLowerCase();
    const isStub = source === 'auto_stub' || item?.details?.autoBootstrap === true;
    const updatedAtMs = typeof item?.updatedAtMs === 'number' && Number.isFinite(item.updatedAtMs) ? item.updatedAtMs : 0;
    const createdAtMs = typeof item?.createdAtMs === 'number' && Number.isFinite(item.createdAtMs) ? item.createdAtMs : 0;
    return (isStub ? 0 : 1000) + updatedAtMs + createdAtMs;
  };

  return score(candidate) >= score(best) ? candidate : best;
}

function PoolCandidateCard({
  item,
  outboxMap,
  myPhotosBlurred,
  requestingUid,
  requestAccess,
  setLightbox,
  presenceByUid,
}) {
  const { t, i18n } = useTranslation();

  const p = item?.profile && typeof item.profile === 'object' ? item.profile : {};
  const targetUid = safeStr(item?.uid);
  const createdAtMs = typeof item?.createdAtMs === 'number' && Number.isFinite(item.createdAtMs) ? item.createdAtMs : 0;
  const isNewUser = createdAtMs > 0 && Date.now() - createdAtMs <= NEW_USER_BADGE_WINDOW_MS;
  const isVerified = p?.identityVerified === true;
  const out = targetUid ? outboxMap?.[targetUid] : null;
  const pending = safeStr(out?.status) === 'pending';
  const approved = safeStr(out?.status) === 'approved';
  const approvedMatchId = safeStr(out?.matchId);
  const name = safeStr(p?.username) || t('studio.common.profile');
  const age = typeof p?.age === 'number' ? ` • ${p.age} ${t('studio.common.ageSuffix')}` : '';
  const userCode = safeStr(p?.userCode);
  const city = safeStr(p?.city);
  const marital = safeStr(p?.details?.maritalStatus);
  const [profileOverride, setProfileOverride] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [translateState, setTranslateState] = useState({ about: { loading: false, error: '', done: false }, expectations: { loading: false, error: '', done: false } });
  const [showOriginal, setShowOriginal] = useState({ about: false, expectations: false });

  useEffect(() => {
    setProfileOverride(null);
    setDetailsOpen(false);
    setTranslateState({ about: { loading: false, error: '', done: false }, expectations: { loading: false, error: '', done: false } });
    setShowOriginal({ about: false, expectations: false });
  }, [item?.applicationId, item?.uid, p?.about, p?.aboutTr, p?.aboutId, p?.expectations, p?.expectationsTr, p?.expectationsId]);

  const effectiveProfile = profileOverride && typeof profileOverride === 'object' ? profileOverride : p;
  const occupation = safeStr(getLocalizedProfileText(effectiveProfile?.details, 'occupation', i18n.language)) || safeStr(effectiveProfile?.details?.occupation);
  const genderText = genderLabel(t, p?.gender);
  const maritalText = maritalStatusLabel(t, marital);
  const lastSeenAtMs = useMemo(() => {
    const fromMap = presenceByUid && typeof presenceByUid === 'object' && typeof presenceByUid?.[targetUid] === 'number' ? presenceByUid[targetUid] : 0;
    const fromProfile = typeof effectiveProfile?.lastSeenAtMs === 'number' && Number.isFinite(effectiveProfile.lastSeenAtMs) ? effectiveProfile.lastSeenAtMs : 0;
    return fromMap || fromProfile || 0;
  }, [effectiveProfile?.lastSeenAtMs, presenceByUid, targetUid]);
  const presenceMeta = useMemo(() => getPresenceMeta(lastSeenAtMs, i18n?.language || 'tr'), [i18n?.language, lastSeenAtMs]);
  const aboutSource = safeStr(effectiveProfile?.about) || getLocalizedProfileText(effectiveProfile, 'about', '');
  const expectationsSource = safeStr(effectiveProfile?.expectations) || getLocalizedProfileText(effectiveProfile, 'expectations', '');
  const aboutTranslated = getStoredProfileTextVariant(effectiveProfile, 'about', i18n.language);
  const expectationsTranslated = getStoredProfileTextVariant(effectiveProfile, 'expectations', i18n.language);
  const aboutHasStoredTranslation = !!aboutTranslated && aboutTranslated !== aboutSource;
  const expectationsHasStoredTranslation = !!expectationsTranslated && expectationsTranslated !== expectationsSource;
  const about = clip(showOriginal.about || !aboutHasStoredTranslation ? aboutSource : aboutTranslated, 180);
  const exp = clip(showOriginal.expectations || !expectationsHasStoredTranslation ? expectationsSource : expectationsTranslated, 180);
  const isUnknown = p?.profileIncomplete === true;
  const photos = Array.isArray(effectiveProfile?.photoUrls) ? effectiveProfile.photoUrls.map(safeStr).filter(Boolean) : [];
  const photo = photos.length ? photos[0] : '';
  const canSeePhotos = !myPhotosBlurred;
  const profileFieldRows = useMemo(() => buildPoolCardProfileFields(effectiveProfile, t, i18n.language), [effectiveProfile, i18n.language, t]);

  const translateField = async (field) => {
    if (field !== 'about' && field !== 'expectations') return;
    const sourceText = field === 'about' ? aboutSource : expectationsSource;
    const translatedText = field === 'about' ? aboutTranslated : expectationsTranslated;
    const hasStoredTranslation = field === 'about' ? aboutHasStoredTranslation : expectationsHasStoredTranslation;
    if (!sourceText) return;

    if (hasStoredTranslation && translatedText) {
      setShowOriginal((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
      setTranslateState((prev) => ({
        ...prev,
        [field]: { ...prev[field], error: '' },
      }));
      return;
    }

    setTranslateState((prev) => ({
      ...prev,
      [field]: { loading: true, error: '', done: false },
    }));

    try {
      const data = await authFetch('/api/matchmaking-profile-text-persist-translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          uid: targetUid,
          applicationId: safeStr(item?.applicationId),
          field,
          text: sourceText,
          targetLang: i18n.language,
          sourceLang: safeStr(effectiveProfile?.profileTextLang),
          trValue: safeStr(effectiveProfile?.[`${field}Tr`]),
          idValue: safeStr(effectiveProfile?.[`${field}Id`]),
        }),
      });

      if (!data?.ok) throw new Error(String(data?.error || 'translate_failed'));

      setProfileOverride((prev) => ({
        ...(p || {}),
        ...((prev && typeof prev === 'object') ? prev : {}),
        [field]: sourceText,
        [`${field}Tr`]: safeStr(data?.trValue),
        [`${field}Id`]: safeStr(data?.idValue),
        ...(safeStr(data?.sourceLang) ? { profileTextLang: safeStr(data?.sourceLang) } : {}),
      }));
      setTranslateState((prev) => ({
        ...prev,
        [field]: { loading: false, error: '', done: true },
      }));
      setShowOriginal((prev) => ({
        ...prev,
        [field]: false,
      }));
    } catch (error) {
      setTranslateState((prev) => ({
        ...prev,
        [field]: { loading: false, error: String(error?.message || 'translate_failed'), done: false },
      }));
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-sm">
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {photo ? (
          <button
            type="button"
            onClick={() => {
              if (!canSeePhotos) return;
              setLightbox({ open: true, images: photos, index: 0, title: name });
            }}
            disabled={!canSeePhotos}
            className={
              'block h-full w-full ' +
              (canSeePhotos ? 'cursor-zoom-in' : 'cursor-not-allowed')
            }
            aria-label={t('studio.common.enlargePhotoAria', { name })}
            title={t('studio.common.zoom')}
          >
            <img
              src={photo}
              alt={name}
              className={'h-full w-full object-cover ' + (!canSeePhotos ? 'blur-[24px] saturate-[0.75] contrast-[0.95]' : '')}
              loading="lazy"
              decoding="async"
            />
          </button>
        ) : (
          <div className="h-full w-full bg-slate-100" />
        )}

        {isVerified ? (
          <div className="absolute left-2 top-2">
            <div
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200"
              title={t('studio.common.verified')}
              aria-label={t('studio.common.verified')}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
            </div>
          </div>
        ) : null}

        {!canSeePhotos ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold text-white">
              {t('studio.match.photos.reciprocityBlocked')}
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-4 text-slate-900">
        <button
          type="button"
          onClick={() => setDetailsOpen((current) => !current)}
          className="block w-full rounded-xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          aria-expanded={detailsOpen}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-lg font-semibold text-slate-900">{name}{age}</p>
            <div className="flex flex-wrap items-center justify-end gap-1">
              {isNewUser ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 border border-emerald-200">
                  {t('memberFeed.badge.newUser')}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <span>{detailsOpen ? t('common.close') : t('common.learnMore')}</span>
              </span>
            </div>
          </div>

          {presenceMeta.label ? (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
              <span
                className={
                  'inline-block h-2 w-2 rounded-full ' +
                  (presenceMeta.isOnline
                    ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
                    : 'bg-slate-300')
                }
                aria-hidden="true"
              />
              <span>{presenceMeta.label}</span>
            </div>
          ) : null}

          {isUnknown ? (
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200">
                {t('studio.profileGate.badge')}
              </span>
            </div>
          ) : null}
          {userCode ? (
            <div className="mt-1">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-900 border border-indigo-200">
                {t('studio.profile.userCode.label')}: {userCode}
              </span>
            </div>
          ) : null}

          <div className="mt-2 space-y-1 text-sm text-slate-600">
            {genderText ? <p>{genderText}</p> : null}
            {maritalText ? <p>{maritalText}</p> : null}
            {city ? <p>{city}</p> : null}
            {occupation ? <p>{occupation}</p> : null}
          </div>
        </button>

        {detailsOpen && profileFieldRows.length ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('studio.matchProfile.profileTitle')}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {profileFieldRows.map((entry) => (
                <div key={`${entry.label}:${entry.value}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{entry.label}</p>
                  <p className="mt-1 text-sm text-slate-800 break-words">{entry.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {about || exp ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {about ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t('studio.myInfo.fields.about')}:</span>
                  <button
                    type="button"
                    onClick={() => translateField('about')}
                    disabled={translateState.about.loading}
                    className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {translateState.about.loading
                      ? t('studio.pool.textTranslate.translating')
                      : aboutHasStoredTranslation
                        ? showOriginal.about
                          ? t('studio.pool.textTranslate.showTranslated')
                          : t('studio.pool.textTranslate.showOriginal')
                        : t('studio.pool.textTranslate.button')}
                  </button>
                  {translateState.about.done && !showOriginal.about ? <span className="text-[11px] font-medium text-emerald-700">{t('studio.pool.textTranslate.done')}</span> : null}
                </div>
                <p className="mt-1">{about}</p>
                {translateState.about.error ? <p className="mt-1 text-[11px] text-rose-600">{t('studio.pool.textTranslate.error')}</p> : null}
              </div>
            ) : null}
            {exp ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t('studio.myInfo.fields.expectations')}:</span>
                  <button
                    type="button"
                    onClick={() => translateField('expectations')}
                    disabled={translateState.expectations.loading}
                    className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {translateState.expectations.loading
                      ? t('studio.pool.textTranslate.translating')
                      : expectationsHasStoredTranslation
                        ? showOriginal.expectations
                          ? t('studio.pool.textTranslate.showTranslated')
                          : t('studio.pool.textTranslate.showOriginal')
                        : t('studio.pool.textTranslate.button')}
                  </button>
                  {translateState.expectations.done && !showOriginal.expectations ? <span className="text-[11px] font-medium text-emerald-700">{t('studio.pool.textTranslate.done')}</span> : null}
                </div>
                <p className="mt-1">{exp}</p>
                {translateState.expectations.error ? <p className="mt-1 text-[11px] text-rose-600">{t('studio.pool.textTranslate.error')}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-2">
          {approved && approvedMatchId ? (
            <Link
              to={`/app/match/${approvedMatchId}`}
              className="app-btn app-btn-primary w-full"
            >
              {t('studio.pool.goToMatchCard')}
            </Link>
          ) : pending ? (
            <button
              type="button"
              disabled
              className="inline-flex flex-1 items-center justify-center rounded-md bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
            >
              {t('studio.pool.requestSent')}
            </button>
          ) : (
            <button
              type="button"
              data-tutorial-id="pool-pre-match-request"
              disabled={requestingUid === targetUid}
              onClick={() => {
                requestAccess({ targetUid });
              }}
              className="app-btn app-btn-primary w-full disabled:opacity-60"
            >
              {requestingUid === targetUid ? t('studio.pool.requesting') : t('studio.pool.requestProfileNow')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudioPool() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isTr = String(i18n?.language || '').toLowerCase().startsWith('tr');

  const isPreview = !user || user.isAnonymous;
  const effectiveUid = isPreview ? '' : String(user?.uid || '').trim();

  const mmReset = useMatchmakingResetAtMs();
  const resetAtMs = typeof mmReset?.resetAtMs === 'number' && Number.isFinite(mmReset.resetAtMs) ? mmReset.resetAtMs : 0;

  const [state, setState] = useState({ loading: true, error: '' });
  const [meta, setMeta] = useState(null);
  const [items, setItems] = useState([]);
  const [poolLimit, setPoolLimit] = useState(INITIAL_POOL_LIMIT);
  const [lastUpdatedMs, setLastUpdatedMs] = useState(0);
  const [recoveryNotice, setRecoveryNotice] = useState('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [needsApplication, setNeedsApplication] = useState(false);
  const [viewFiltersModalOpen, setViewFiltersModalOpen] = useState(false);
  const [interactionFilterModalOpen, setInteractionFilterModalOpen] = useState(false);
  const [poolFilters, setPoolFilters] = useState(createPoolFilters);
  const [interactionFilterState, setInteractionFilterState] = useState({ loading: false, error: '', success: '' });
  const [interactionFilterDraft, setInteractionFilterDraft] = useState(createInteractionFilterDraft);
  const [interactionFilterDirty, setInteractionFilterDirty] = useState(false);
  const [myInteractionFilter, setMyInteractionFilter] = useState(null);

  const [outboxMap, setOutboxMap] = useState({});
  const [, setGrantedMap] = useState({});
  const [requestingUid, setRequestingUid] = useState('');

  const [inboxAccess, setInboxAccess] = useState([]);
  const [accessAction, setAccessAction] = useState({ loadingId: '', error: '' });

  const [inboxModal, setInboxModal] = useState({ open: false });
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0, title: '' });
  const [importantNoticeOpen, setImportantNoticeOpen] = useState(false);
  const [reviewCtaState, setReviewCtaState] = useState('none');
  const [presenceByUid, setPresenceByUid] = useState({});

  const [, setMyMembership] = useState({ active: false });
  const [, setMyGender] = useState('');
  const [myPhotosBlurred, setMyPhotosBlurred] = useState(false);
  const [paywallNotice, setPaywallNotice] = useState('');
  const [profileGateNotice, setProfileGateNotice] = useState('');
  const [myProfileComplete, setMyProfileComplete] = useState(true);
  const [myHasAnyPhoto, setMyHasAnyPhoto] = useState(null); // null=unknown
  const [myHasAnyApplication, setMyHasAnyApplication] = useState(null); // null=unknown
  const [myHasAnyPhotoFromUserDoc, setMyHasAnyPhotoFromUserDoc] = useState(null);
  const [myHasAnyApplicationFromUserDoc, setMyHasAnyApplicationFromUserDoc] = useState(null);
  const [myOptionalDetailsMissing, setMyOptionalDetailsMissing] = useState(false);

  const [completeProfileGateOpen, setCompleteProfileGateOpen] = useState(false);
  const [optionalDetailsPromptOpen, setOptionalDetailsPromptOpen] = useState(false);
  const [filtersTutorialOpen, setFiltersTutorialOpen] = useState(false);

  const profileGateAutoShownRef = useRef(false);
  const optionalDetailsPromptAutoShownRef = useRef(false);

  const openReviewPrompt = useCallback(() => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    if (reviewCtaState !== 'none') {
      return;
    }

    try {
      window.sessionStorage.setItem('uniqah:app-review-prompt:source', 'pool_banner');
      window.dispatchEvent(new Event('uniqah:open-app-review-prompt'));
    } catch {
      // ignore
    }
  }, [isPreview, reviewCtaState, t]);

  useEffect(() => {
    let active = true;

    if (isPreview) {
      setReviewCtaState('none');
      return undefined;
    }

    (async () => {
      try {
        const data = await authFetch('/api/matchmaking-feedback-status', { method: 'GET' });
        if (!active) return;
        const nextState = safeStr(data?.state);
        setReviewCtaState(nextState === 'submitted' || nextState === 'skipped' || nextState === 'shown' ? nextState : 'none');
      } catch {
        if (!active) return;
        setReviewCtaState('none');
      }
    })();

    return () => {
      active = false;
    };
  }, [isPreview]);

  useEffect(() => {
    const handleReviewStatus = (event) => {
      const nextState = safeStr(event?.detail?.status);
      if (nextState === 'submitted' || nextState === 'skipped' || nextState === 'shown') {
        setReviewCtaState(nextState);
      }
    };

    try {
      window.addEventListener(REVIEW_PROMPT_STATUS_EVENT, handleReviewStatus);
    } catch {
      return undefined;
    }

    return () => {
      try {
        window.removeEventListener(REVIEW_PROMPT_STATUS_EVENT, handleReviewStatus);
      } catch {
        // ignore
      }
    };
  }, []);

  const effectiveHasAnyApplication = useMemo(() => {
    if (myHasAnyApplication === true || myHasAnyApplicationFromUserDoc === true) return true;
    if (myHasAnyApplication === false && myHasAnyApplicationFromUserDoc === false) return false;
    return myHasAnyApplication ?? myHasAnyApplicationFromUserDoc;
  }, [myHasAnyApplication, myHasAnyApplicationFromUserDoc]);

  const effectiveHasAnyPhoto = useMemo(() => {
    if (myHasAnyPhoto === true || myHasAnyPhotoFromUserDoc === true) return true;
    if (myHasAnyPhoto === false && myHasAnyPhotoFromUserDoc === false) return false;
    return myHasAnyPhoto ?? myHasAnyPhotoFromUserDoc;
  }, [myHasAnyPhoto, myHasAnyPhotoFromUserDoc]);

  const applicationRequired = useMemo(() => {
    return false;
  }, [effectiveHasAnyApplication]);

  const interactionLocked = useMemo(() => {
    return false;
  }, [applicationRequired, effectiveHasAnyPhoto]);

  const profileGateMode = useMemo(() => {
    return '';
  }, [effectiveHasAnyApplication, effectiveHasAnyPhoto]);

  const profileGateBody = useMemo(() => {
    if (profileGateMode === 'photo') return t('studio.profileGate.photoBody');
    return t('studio.profileGate.body');
  }, [profileGateMode, t]);

  const profileGateCta = useMemo(() => {
    if (profileGateMode === 'photo') return t('studio.profileGate.photoCta');
    return t('studio.profileGate.cta');
  }, [profileGateMode, t]);

  const cancelledRef = useRef(false);
  const activateMembershipRef = useRef(false);
  const retryTimeoutRef = useRef(null);
  const retryAttemptRef = useRef(0);

  useEffect(() => {
    return () => {
      try {
        if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
      } catch {
        // ignore
      }
    };
  }, []);

  const load = useCallback(
    async ({ silent } = { silent: false }) => {
      if (isPreview) {
        const sample = buildPreviewPoolItems();
        setNeedsApplication(false);
        setAutoRefreshEnabled(false);
        setMeta({ total: sample.length });
        setItems(sample);
        setLastUpdatedMs(Date.now());
        setRecoveryNotice('');
        setState({ loading: false, error: '' });
        return;
      }
      if (!silent) setState({ loading: true, error: '' });
      try {
        const data = await authFetch('/api/matchmaking-browse', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ limit: poolLimit }),
        });

        if (cancelledRef.current) return;
        const degraded = data?.degraded === true;
        const degradedMsg = degraded
          ? translateStudioApiError(t, safeStr(data?.error) || safeStr(data?.message) || 'api_unreachable') ||
            t('studio.errors.apiUnavailable')
          : '';
        const nextItems = Array.isArray(data?.items) ? data.items : [];
        const nextMeta = data?.meta || null;
        setNeedsApplication(!!(data?.meta && data.meta.needsApplication));
        setMeta(nextMeta);
        setItems(nextItems);
        setLastUpdatedMs(Date.now());
        retryAttemptRef.current = 0;
        if (retryTimeoutRef.current) {
          window.clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
        if (nextItems.length) {
          writePoolCache(effectiveUid, { items: nextItems, meta: nextMeta });
          setRecoveryNotice('');
        } else if (degraded) {
          const cached = readPoolCache(effectiveUid);
          if (cached?.items?.length) {
            setMeta(cached.meta || nextMeta);
            setItems(cached.items);
            setRecoveryNotice(t('studio.pool.cachedResults'));
          }
        }
        setState({ loading: false, error: degradedMsg });
      } catch (e) {
        if (cancelledRef.current) return;
        const msg = safeStr(e?.message) || 'load_failed';
        const translated = translateStudioApiError(t, msg) || msg;

        if (msg === 'application_not_found') {
          setNeedsApplication(true);
          setAutoRefreshEnabled(false);
        }

        const cached = readPoolCache(effectiveUid);
        if (cached?.items?.length) {
          setMeta(cached.meta || null);
          setItems(cached.items);
          setRecoveryNotice(t('studio.pool.cachedResults'));
        }

        if (msg !== 'application_not_found' && retryAttemptRef.current < POOL_RETRY_DELAYS_MS.length) {
          const retryIndex = retryAttemptRef.current;
          retryAttemptRef.current += 1;
          if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = window.setTimeout(() => {
            retryTimeoutRef.current = null;
            load({ silent: true });
          }, POOL_RETRY_DELAYS_MS[retryIndex]);
          setState({ loading: false, error: t('studio.pool.retrying') });
          return;
        }

        setState({ loading: false, error: translated });
      }
    },
    [effectiveUid, isPreview, poolLimit, t]
  );

  const refreshPresence = useCallback(async () => {
    if (isPreview || !effectiveUid) {
      setPresenceByUid({});
      return;
    }

    const targetUids = [];
    const seen = new Set();
    (Array.isArray(items) ? items : []).forEach((item) => {
      const targetUid = safeStr(item?.uid);
      if (!targetUid || seen.has(targetUid)) return;
      seen.add(targetUid);
      targetUids.push(targetUid);
    });

    if (!targetUids.length) {
      setPresenceByUid({});
      return;
    }

    try {
      const merged = {};
      for (let index = 0; index < targetUids.length; index += 50) {
        const data = await authFetch('/api/matchmaking-presence-batch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ uids: targetUids.slice(index, index + 50) }),
        });
        const batch = data?.presenceByUid && typeof data.presenceByUid === 'object' ? data.presenceByUid : {};
        Object.assign(merged, batch);
      }
      setPresenceByUid(merged);
    } catch {
      // best-effort
    }
  }, [effectiveUid, isPreview, items]);

  useEffect(() => {
    refreshPresence();

    const onFocus = () => refreshPresence();
    try {
      window.addEventListener('focus', onFocus);
    } catch {
      // noop
    }

    const id = setInterval(() => refreshPresence(), 60 * 1000);
    return () => {
      try {
        clearInterval(id);
      } catch {
        // noop
      }
      try {
        window.removeEventListener('focus', onFocus);
      } catch {
        // noop
      }
    };
  }, [refreshPresence]);

  useEffect(() => {
    if (!isPreview) return;
    const sample = buildPreviewPoolItems();
    setNeedsApplication(false);
    setAutoRefreshEnabled(false);
    setMeta({ total: sample.length });
    setItems(sample);
    setLastUpdatedMs(Date.now());
    setRecoveryNotice('');
    setState({ loading: false, error: '' });
    setMyPhotosBlurred(false);
    setMyProfileComplete(false);
  }, [isPreview]);

  // Ürün kararı: Keşfet listesi profil tamamlanmadan da görüntülenebilir.
  // Ancak etkileşim aksiyonları (istek gönderme vb.) profil formu + en az 1 fotoğraf tamamlanana kadar kilitli kalır.
  useEffect(() => {
    if (profileGateAutoShownRef.current) return;
    if (isPreview) return;
    // Auto-uyarıyı sadece gerçekten eksik profil/app olduğu netleştiğinde göster.
    if (!profileGateMode) return;

    profileGateAutoShownRef.current = true;
    setProfileGateNotice(profileGateBody);
  }, [isPreview, profileGateMode, profileGateBody]);

  useEffect(() => {
    if (!profileGateNotice || !profileGateMode) return;
    setProfileGateNotice((current) => (current === profileGateBody ? current : profileGateBody));
  }, [profileGateBody, profileGateMode, profileGateNotice]);

  useEffect(() => {
    if (isPreview) return;
    if (interactionLocked) {
      setOptionalDetailsPromptOpen(false);
      return;
    }
    if (!effectiveHasAnyApplication || !myProfileComplete || !myOptionalDetailsMissing) {
      setOptionalDetailsPromptOpen(false);
      return;
    }
    if (isOneTimeHintShown(effectiveUid, OPTIONAL_DETAILS_HINT_ID)) {
      setOptionalDetailsPromptOpen(false);
      return;
    }
    if (optionalDetailsPromptAutoShownRef.current) return;

    optionalDetailsPromptAutoShownRef.current = true;
    setOptionalDetailsPromptOpen(true);
  }, [effectiveHasAnyApplication, effectiveUid, interactionLocked, isPreview, myOptionalDetailsMissing, myProfileComplete]);

  useEffect(() => {
    if (isPreview) return;
    if (!effectiveUid || state.loading || state.error) return;
    if (!Array.isArray(items) || items.length <= 0) return;
    if (filtersTutorialOpen) return;
    if (isOneTimeHintShown(effectiveUid, POOL_FILTERS_TUTORIAL_HINT_ID)) return;
    setFiltersTutorialOpen(true);
  }, [effectiveUid, filtersTutorialOpen, isPreview, items, state.error, state.loading]);

  // Outbox (benim gönderdiğim ön eşleşme istekleri)
  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) {
      setOutboxMap({});
      return;
    }

    const q = query(
      collection(db, 'matchmakingUsers', uid, 'outboxPreMatchRequests'),
      orderBy('updatedAtMs', 'desc'),
      limit(200)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const m = {};
        snap.forEach((d) => {
          const data = d.data() || {};
          const updatedAtMs = typeof data?.updatedAtMs === 'number' && Number.isFinite(data.updatedAtMs) ? data.updatedAtMs : 0;
          if (resetAtMs > 0 && updatedAtMs > 0 && updatedAtMs < resetAtMs) return;
          const rawToUid = safeStr(data?.toUid) || safeStr(data?.targetUid);
          const docId = safeStr(d.id);

          // Bazı eski dokümanlarda toUid alanı eksik olabilir.
          // Fallback: docId'den (uid__otherUid) hedefi türet.
          let derivedToUid = '';
          const parts = docId.split('__').map(safeStr).filter(Boolean);
          if (parts.length === 2) {
            derivedToUid = parts[0] === uid ? parts[1] : parts[1] === uid ? parts[0] : parts[1];
          } else {
            derivedToUid = docId;
          }

          const toUid = rawToUid || derivedToUid;
          if (!toUid) return;
          m[toUid] = { id: docId, ...data, ...(rawToUid ? {} : { toUid }) };
        });
        setOutboxMap(m);
      },
      () => setOutboxMap({})
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [effectiveUid, resetAtMs]);

  // Gelen ön eşleşme istekleri (inbox)
  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) {
      setInboxAccess([]);
      return;
    }

    const q = query(
      collection(db, 'matchmakingUsers', uid, 'inboxPreMatchRequests'),
      orderBy('createdAtMs', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxAccess(
          resetAtMs > 0
            ? items.filter((x) => {
                const createdAtMs = typeof x?.createdAtMs === 'number' && Number.isFinite(x.createdAtMs) ? x.createdAtMs : 0;
                return !(createdAtMs > 0 && createdAtMs < resetAtMs);
              })
            : items
        );
      },
      () => setInboxAccess([])
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [effectiveUid, resetAtMs]);


  // Üyelik durumu (paywall için)
  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) {
      setMyMembership({ active: false });
      setMyPhotosBlurred(false);
      setMyInteractionFilter(null);
      return;
    }

    const asMs = (v) => {
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (v && typeof v.toMillis === 'function') return v.toMillis();
      if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
      return 0;
    };

    const ref = doc(db, 'matchmakingUsers', uid);

    let cancelled = false;
    (async () => {
      try {
        let snap;
        try {
          snap = await getDocFromServer(ref);
        } catch {
          snap = await getDoc(ref);
        }

        if (cancelled) return;
        const d = snap?.exists?.() ? snap.data() || {} : {};

        const membershipObj = d?.membership && typeof d.membership === 'object' ? d.membership : null;
        const membershipValidUntilMs = asMs(membershipObj?.validUntilMs);
        const now = Date.now();
        const membershipActive =
          (membershipValidUntilMs > 0 && membershipValidUntilMs > now) ||
          (!!membershipObj?.active && (!membershipValidUntilMs || membershipValidUntilMs > now));
        setMyMembership({ active: membershipActive });

        const appFromUser = d?.application && typeof d.application === 'object' ? d.application : null;
        const publicProfile = d?.publicProfile && typeof d.publicProfile === 'object' ? d.publicProfile : null;
        const g = String(appFromUser?.gender || publicProfile?.gender || d?.gender || '').trim().toLowerCase();
        setMyGender(g);

        setMyProfileComplete(isMinimumProfileCompleteFromUserDoc(d));
        setMyHasAnyApplicationFromUserDoc(hasAnyMatchmakingProfileInUserDoc(d));
        setMyHasAnyPhotoFromUserDoc(hasAnyMatchmakingPhotoInUserDoc(d));

        const v1 = d?.publicProfile && typeof d.publicProfile === 'object' ? d.publicProfile.photosBlurred : undefined;
        const v2 = d?.photosBlurred;
        const blur = typeof v1 === 'boolean' ? v1 : typeof v2 === 'boolean' ? v2 : false;
        setMyPhotosBlurred(!!blur);
        setMyInteractionFilter(d?.interactionFilter && typeof d.interactionFilter === 'object' ? d.interactionFilter : null);
      } catch {
        // best-effort
      }
    })();

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.exists() ? snap.data() || {} : {};

        const membershipObj = d?.membership && typeof d.membership === 'object' ? d.membership : null;
        const membershipValidUntilMs = asMs(membershipObj?.validUntilMs);
        const now = Date.now();
        const membershipActive =
          (membershipValidUntilMs > 0 && membershipValidUntilMs > now) ||
          (!!membershipObj?.active && (!membershipValidUntilMs || membershipValidUntilMs > now));
        setMyMembership({ active: membershipActive });

        const appFromUser = d?.application && typeof d.application === 'object' ? d.application : null;
        const publicProfile = d?.publicProfile && typeof d.publicProfile === 'object' ? d.publicProfile : null;
        const g = String(appFromUser?.gender || publicProfile?.gender || d?.gender || '').trim().toLowerCase();
        setMyGender(g);

        setMyProfileComplete(isMinimumProfileCompleteFromUserDoc(d));
        setMyHasAnyApplicationFromUserDoc(hasAnyMatchmakingProfileInUserDoc(d));
        setMyHasAnyPhotoFromUserDoc(hasAnyMatchmakingPhotoInUserDoc(d));

        const v1 = d?.publicProfile && typeof d.publicProfile === 'object' ? d.publicProfile.photosBlurred : undefined;
        const v2 = d?.photosBlurred;
        const blur = typeof v1 === 'boolean' ? v1 : typeof v2 === 'boolean' ? v2 : false;
        setMyPhotosBlurred(!!blur);
        setMyInteractionFilter(d?.interactionFilter && typeof d.interactionFilter === 'object' ? d.interactionFilter : null);
      },
      () => {
        setMyMembership({ active: false });
        setMyGender('');
        setMyPhotosBlurred(false);
        setMyProfileComplete(true);
        setMyHasAnyApplicationFromUserDoc(null);
        setMyHasAnyPhotoFromUserDoc(null);
        setMyInteractionFilter(null);
      }
    );

    return () => {
      cancelled = true;
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [effectiveUid]);

  // En az 1 fotoğraf var mı? (pre-match gate için)
  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) {
      setMyHasAnyPhoto(null);
      setMyHasAnyApplication(null);
      setMyHasAnyPhotoFromUserDoc(null);
      setMyHasAnyApplicationFromUserDoc(null);
      return;
    }

    const parseAppsSnap = (snap) => {
      try {
        const ids = [];
        let hasPhoto = false;
        let bestApp = null;
        snap.forEach((d) => {
          const data = typeof d?.data === 'function' ? d.data() || {} : d?.data || {};
          const id = safeStr(d?.id);
          if (hasAnyMatchmakingProfileInApplicationDoc(data) && id) ids.push(id);
          bestApp = pickBestApplicationCandidate(bestApp, { id, ...data });
          if (hasAnyStoredMatchmakingPhotoInApplicationDoc(data)) hasPhoto = true;
        });
        return { ids, hasPhoto, bestApp };
      } catch {
        return null;
      }
    };

    const qAppsUserId = query(collection(db, 'matchmakingApplications'), where('userId', '==', uid), limit(10));

    const mergeAndSet = (parts) => {
      const list = Array.isArray(parts) ? parts : [];
      const idSet = new Set();
      let hasPhoto = false;
      let bestApp = null;
      for (const p of list) {
        const ids = Array.isArray(p?.ids) ? p.ids : [];
        for (const id of ids) idSet.add(String(id));
        if (p?.hasPhoto) hasPhoto = true;
        bestApp = pickBestApplicationCandidate(bestApp, p?.bestApp);
      }
      setMyHasAnyApplication(idSet.size > 0);
      setMyHasAnyPhoto(!!hasPhoto);
      setMyOptionalDetailsMissing(idSet.size > 0 && !hasFilledOptionalDetails(bestApp));
    };

    let cancelled = false;
    (async () => {
      try {
        const s1 = await getDocs(qAppsUserId);
        if (cancelled) return;
        const p1 = parseAppsSnap(s1);
        mergeAndSet([p1].filter(Boolean));
      } catch {
        // ignore
      }
    })();

    const live = { userId: null };
    const applyLive = () => mergeAndSet([live.userId].filter(Boolean));

    const unsub1 = onSnapshot(
      qAppsUserId,
      (snap) => {
        live.userId = parseAppsSnap(snap);
        applyLive();
      },
      () => {
        live.userId = null;
        applyLive();
      }
    );

    return () => {
      cancelled = true;
      unsub1();
    };
  }, [effectiveUid]);

  const requireProfile = () => {
    goToProfileCompletionTarget();
  };

  useEffect(() => {
    const st = location?.state && typeof location.state === 'object' ? location.state : null;
    if (!st?.profileGate) return;
    requireProfile();
    // Not: state'i burada temizlemiyoruz; sadece best-effort uyarı göster.
    // Aksi halde history replace karmaşıklaşabiliyor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state]);

  useEffect(() => {
    if (!needsApplication) return;
    if (effectiveHasAnyApplication !== false) return;
    requireProfile();
  }, [effectiveHasAnyApplication, needsApplication]);

  const activateFreeMembershipNow = useCallback(async () => {
    const uid = effectiveUid;
    if (!uid) return;
    if (activateMembershipRef.current) return;
    activateMembershipRef.current = true;

    try {
      await authFetch('/api/matchmaking-membership-activate-free', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      setMyMembership({ active: true });
      setPaywallNotice('');
    } catch (e) {
      const msg = safeStr(e?.message) || 'membership_activate_failed';
      setPaywallNotice(translateStudioApiError(t, msg) || msg);
    } finally {
      activateMembershipRef.current = false;
    }
  }, [effectiveUid, t]);

  useEffect(() => {
    if (interactionFilterDirty) return;
    setInteractionFilterDraft(buildInteractionFilterDraft(myInteractionFilter));
  }, [interactionFilterDirty, myInteractionFilter]);

  const interactionFilterActive = useMemo(() => hasActiveInteractionFilterDraft(interactionFilterDraft), [interactionFilterDraft]);

  const updateInteractionFilterDraft = useCallback((updater) => {
    setInteractionFilterState((current) => ({ ...current, error: '', success: '' }));
    setInteractionFilterDirty(true);
    setInteractionFilterDraft((current) => {
      const base = current && typeof current === 'object' ? current : createInteractionFilterDraft();
      const next = typeof updater === 'function' ? updater(base) : updater;
      return next && typeof next === 'object' ? next : base;
    });
  }, []);

  const persistInteractionFilter = useCallback(async (nextDraft) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return false;
    }
    if (!effectiveUid || interactionFilterState.loading) return false;

    const payload = normalizeInteractionFilterPayload(nextDraft);
    const nextActive = hasActiveInteractionFilterDraft(payload);

    setInteractionFilterState({ loading: true, error: '', success: '' });
    try {
      await authFetch('/api/matchmaking-interaction-filter-set', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const nextDraftState = buildInteractionFilterDraft(payload);
      setInteractionFilterDraft(nextDraftState);
      setInteractionFilterDirty(false);
      setMyInteractionFilter(payload);
      setInteractionFilterState({
        loading: false,
        error: '',
        success: nextActive ? t('studio.profile.interactionFilter.saved') : t('studio.profile.interactionFilter.cleared'),
      });
      return true;
    } catch (e) {
      const msg = safeStr(e?.message) || 'save_failed';
      setInteractionFilterState({ loading: false, error: translateStudioApiError(t, msg) || msg, success: '' });
      return false;
    }
  }, [effectiveUid, interactionFilterState.loading, isPreview, t]);

  const saveInteractionFilter = useCallback(async () => {
    const ok = await persistInteractionFilter(interactionFilterDraft);
    if (ok) setInteractionFilterModalOpen(false);
  }, [interactionFilterDraft, persistInteractionFilter]);

  const clearInteractionFilter = useCallback(async () => {
    const ok = await persistInteractionFilter(createInteractionFilterDraft());
    if (ok) setInteractionFilterModalOpen(false);
  }, [persistInteractionFilter]);

  const toggleInteractionFilterMaritalStatus = useCallback((status) => {
    const nextValue = normalizeMaritalStatus(status);
    if (!nextValue) return;
    updateInteractionFilterDraft((current) => {
      const list = Array.isArray(current?.allowedMaritalStatuses) ? current.allowedMaritalStatuses : [];
      const exists = list.includes(nextValue);
      return {
        ...current,
        allowedMaritalStatuses: exists ? list.filter((item) => item !== nextValue) : [...list, nextValue],
      };
    });
  }, [updateInteractionFilterDraft]);

  const paywallAutoActivateRef = useRef(false);
  useEffect(() => {
    if (!paywallNotice) {
      paywallAutoActivateRef.current = false;
      return;
    }
    if (paywallAutoActivateRef.current) return;
    paywallAutoActivateRef.current = true;
    // Üyelik artık otomatik veriliyor; paywall görünürse best-effort arkada düzelt.
    activateFreeMembershipNow();
  }, [paywallNotice, activateFreeMembershipNow]);

  const goToProfileCompletionTarget = () => {
    if (profileGateMode === 'photo') {
      try {
        navigate('/profilim', { replace: false, state: { openPhotoManager: true, profileGate: 'photo_required' } });
      } catch {
        try {
          window.location.href = '/profilim';
        } catch {
          // noop
        }
      }
      return;
    }

    try {
      navigate('/evlilik/eslestirme-basvuru?w=1', {
        replace: false,
        state: { returnTo: `${location.pathname || '/app/pool'}${location.search || ''}` },
      });
    } catch {
      // fallback
      try {
        window.location.href = '/evlilik/eslestirme-basvuru?w=1';
      } catch {
        // noop
      }
    }
  };

  const openCompleteProfileGate = () => {
    goToProfileCompletionTarget();
  };

  const openDeferredPhotoGate = () => {
    try {
      navigate('/profilim', { replace: false, state: { openPhotoManager: true, profileGate: 'deferred_photo_required' } });
    } catch {
      try {
        window.location.href = '/profilim';
      } catch {
        // noop
      }
    }
  };

  const openDeferredWhatsappGate = () => {
    try {
      navigate('/profilim', { replace: false, state: { profileGate: 'deferred_whatsapp_required' } });
    } catch {
      try {
        window.location.href = '/profilim';
      } catch {
        // noop
      }
    }
  };

  const dismissCompleteProfileGate = () => setCompleteProfileGateOpen(false);

  const dismissOptionalDetailsPrompt = () => {
    markOneTimeHintShown(effectiveUid, OPTIONAL_DETAILS_HINT_ID);
    setOptionalDetailsPromptOpen(false);
  };

  const dismissFiltersTutorial = () => {
    markOneTimeHintShown(effectiveUid, POOL_FILTERS_TUTORIAL_HINT_ID);
    setFiltersTutorialOpen(false);
  };

  const openFiltersTutorialPanel = () => {
    markOneTimeHintShown(effectiveUid, POOL_FILTERS_TUTORIAL_HINT_ID);
    setFiltersTutorialOpen(false);
    setViewFiltersModalOpen(true);
  };

  const startCompleteProfileGate = () => {
    dismissCompleteProfileGate();
    goToProfileCompletionTarget();
  };

  const goToOptionalDetailsTarget = () => {
    dismissOptionalDetailsPrompt();
    try {
      navigate('/evlilik/eslestirme-basvuru?w=1&full=1', {
        replace: false,
        state: {
          returnTo: `${location.pathname || '/app/pool'}${location.search || ''}`,
          startStep: 1,
          profileMode: 'full',
        },
      });
    } catch {
      // noop
    }
  };

  useEffect(() => {
    if (!isTutorialActive()) return;
    if (!profileGateNotice) return;
    const id = setTimeout(() => setProfileGateNotice(''), 3000);
    return () => {
      try {
        clearTimeout(id);
      } catch {
        // noop
      }
    };
  }, [profileGateNotice]);

  useEffect(() => {
    if (!isTutorialActive()) return;
    if (!paywallNotice) return;
    const id = setTimeout(() => setPaywallNotice(''), 3000);
    return () => {
      try {
        clearTimeout(id);
      } catch {
        // noop
      }
    };
  }, [paywallNotice]);

  const requirePaid = () => {
    setPaywallNotice(t('studio.paywall.upgradeToInteract'));
    try {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // noop
    }
  };

  const respondAccessRequest = async ({ fromUid, decision }) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    if (interactionLocked) {
      openCompleteProfileGate();
      return;
    }

    const uid = effectiveUid;
    const from = safeStr(fromUid);
    const d = safeStr(decision);
    if (!uid || !from || (d !== 'approve' && d !== 'reject')) return;
    if (accessAction.loadingId) return;

    setAccessAction({ loadingId: from, error: '' });
    try {
      await authFetch('/api/matchmaking-pre-match-respond', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fromUid: from, decision: d }),
      });
      setAccessAction({ loadingId: '', error: '' });
    } catch (e) {
      const msg = safeStr(e?.message) || 'action_failed';
      if (msg === 'membership_required') requirePaid();
      if (msg === 'photo_review_required') {
        navigate('/profilim', { replace: false, state: { openPhotoManager: true, profileGate: 'photo_review_required' } });
      } else if (msg === 'deferred_photo_required') {
        openDeferredPhotoGate();
      } else if (msg === 'deferred_whatsapp_required') {
        openDeferredWhatsappGate();
      } else if (msg === 'profile_incomplete' || msg === 'application_not_found' || msg === 'application_required' || msg === 'photo_required') {
        openCompleteProfileGate();
      }
      setAccessAction({ loadingId: '', error: translateStudioApiError(t, msg) || msg });
    }
  };

  // Granted (bana verilmiş profil izinleri)
  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) {
      setGrantedMap({});
      return;
    }

    const q = query(collection(db, 'matchmakingUsers', uid, 'profileAccessGranted'), orderBy('grantedAtMs', 'desc'), limit(300));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const m = {};
        snap.forEach((d) => {
          const other = String(d.id || '').trim();
          if (!other) return;
          m[other] = true;
        });
        setGrantedMap(m);
      },
      () => setGrantedMap({})
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [effectiveUid]);

  useEffect(() => {
    cancelledRef.current = false;
    load({ silent: false });

    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  const headerHint = useMemo(() => {
    // Yaş filtresi kaldırıldı; header'da yaş aralığı göstermiyoruz.
    return '';
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => profileMatchesPoolFilters(item?.profile, poolFilters));
  }, [items, poolFilters]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      String(poolFilters?.ageMin || '').trim()
      || String(poolFilters?.ageMax || '').trim()
      || poolFilters?.photoOnly
      || poolFilters?.verifiedOnly
      || (Array.isArray(poolFilters?.maritalStatuses) && poolFilters.maritalStatuses.length)
    );
  }, [poolFilters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (String(poolFilters?.ageMin || '').trim()) count += 1;
    if (String(poolFilters?.ageMax || '').trim()) count += 1;
    if (poolFilters?.photoOnly) count += 1;
    if (poolFilters?.verifiedOnly) count += 1;
    if (Array.isArray(poolFilters?.maritalStatuses) && poolFilters.maritalStatuses.length) count += 1;
    return count;
  }, [poolFilters]);

  const resetPoolFilters = useCallback(() => {
    setPoolFilters(createPoolFilters());
  }, []);

  const togglePoolMaritalFilter = useCallback((value) => {
    const nextValue = normalizeMaritalStatus(value);
    if (!nextValue) return;
    setPoolFilters((current) => {
      const list = Array.isArray(current?.maritalStatuses) ? current.maritalStatuses : [];
      const exists = list.includes(nextValue);
      return {
        ...current,
        maritalStatuses: exists ? list.filter((item) => item !== nextValue) : [...list, nextValue],
      };
    });
  }, []);

  const canLoadMore = useMemo(() => {
    const total = typeof meta?.total === 'number' ? meta.total : 0;
    return !state.loading && !needsApplication && items.length > 0 && items.length < total;
  }, [items.length, meta?.total, needsApplication, state.loading]);

  const loadMore = () => {
    setPoolLimit((current) => Math.min(1200, current + POOL_LOAD_MORE_STEP));
  };

  const requestAccess = async ({ targetUid } = {}) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const uid = effectiveUid;
    const toUid = safeStr(targetUid);
    if (!uid || !toUid || requestingUid) return;

    if (interactionLocked) {
      openCompleteProfileGate();
      return;
    }

    setRequestingUid(toUid);
    try {
      await authFetch('/api/matchmaking-pre-match-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetUid: toUid }),
      });

      // Snapshot gecikse bile UI'da "İstek gönderildi" durumunu koru.
      setOutboxMap((prev) => {
        const cur = prev && typeof prev === 'object' ? prev : {};
        const existing = cur?.[toUid] && typeof cur[toUid] === 'object' ? cur[toUid] : null;
        const st = safeStr(existing?.status);
        if (st === 'pending' || st === 'approved') return cur;
        const nowMs = Date.now();
        return {
          ...cur,
          [toUid]: {
            ...(existing || {}),
            id: safeStr(existing?.id) || `${uid}__${toUid}`,
            type: 'people_list',
            status: 'pending',
            fromUid: uid,
            toUid,
            createdAtMs: typeof existing?.createdAtMs === 'number' ? existing.createdAtMs : nowMs,
            updatedAtMs: nowMs,
          },
        };
      });

      setRequestingUid('');
    } catch (e) {
      const msg = safeStr(e?.message) || 'request_failed';
      setRequestingUid('');
      if (msg === 'membership_required') {
        requirePaid();
        return;
      }
      if (msg === 'photo_review_required') {
        navigate('/profilim', { replace: false, state: { openPhotoManager: true, profileGate: 'photo_review_required' } });
        return;
      }
      if (msg === 'deferred_photo_required') {
        openDeferredPhotoGate();
        return;
      }
      if (msg === 'deferred_whatsapp_required') {
        openDeferredWhatsappGate();
        return;
      }
      if (msg === 'profile_incomplete' || msg === 'application_not_found' || msg === 'application_required' || msg === 'photo_required') {
        openCompleteProfileGate();
        return;
      }
      setState((s) => ({ ...s, error: translateStudioApiError(t, msg) || msg }));
    }
  };

  const pendingAccessCount = useMemo(() => {
    const list = Array.isArray(inboxAccess) ? inboxAccess : [];
    return list.filter((x) => safeStr(x?.status) === 'pending' && safeStr(x?.type) !== 'people_list').length;
  }, [inboxAccess]);

  const markInboxMessageRead = async ({ requestId, fromUid }) => {
    try {
      await authFetch('/api/matchmaking-inbox-mark-read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId, fromUid }),
      });
    } catch {
      // best-effort
    }
  };

  const importantNoticeAnalysisItems = useMemo(() => {
    const value = t('studio.pool.importantNotice.analysisItems', { returnObjects: true });
    return Array.isArray(value) ? value : [];
  }, [t]);

  const importantNoticePositiveItems = useMemo(() => {
    const value = t('studio.pool.importantNotice.positiveItems', { returnObjects: true });
    return Array.isArray(value) ? value : [];
  }, [t]);

  const importantNoticeReportItems = useMemo(() => {
    const value = t('studio.pool.importantNotice.reportItems', { returnObjects: true });
    return Array.isArray(value) ? value : [];
  }, [t]);

  const poolFilterTutorialItems = useMemo(() => {
    const value = t('studio.pool.filters.tutorial.items', { returnObjects: true });
    return Array.isArray(value) ? value : [];
  }, [t]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-0">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">{t('studio.pool.title')}</h1>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => {
                  if (isPreview) {
                    openPreviewGate({ reason: t('previewGate.body') });
                    return;
                  }
                  setInboxModal({ open: true });
                }}
                className="app-btn hidden w-full sm:inline-flex sm:w-auto"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>
                    {pendingAccessCount > 0
                      ? t('studio.accessInbox.openButtonWithCount', { count: pendingAccessCount })
                      : t('studio.accessInbox.openButton')}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => load({ silent: false })}
                className="app-btn w-full sm:w-auto"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  <span>{t('studio.pool.refresh')}</span>
                </span>
              </button>
              <Link
                to="/app/matches"
                className="app-btn hidden w-full sm:inline-flex sm:w-auto"
                onClick={(e) => {
                  if (isPreview) {
                    e.preventDefault();
                    openPreviewGate({ reason: t('previewGate.body') });
                  }
                }}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{t('studio.pool.backToMatches')}</span>
                </span>
              </Link>
            </div>
          </div>

          {headerHint ? <p className="mt-2 text-sm text-slate-600">{headerHint}</p> : null}
          {lastUpdatedMs ? (
            <p className="mt-1 text-xs text-slate-500">{t('studio.pool.lastUpdated')}</p>
          ) : null}
          {meta && typeof meta?.total === 'number' ? (
            <p className="mt-1 text-xs text-slate-500">{t('studio.pool.countHint', { total: meta.total, shown: filteredItems.length })}</p>
          ) : null}
          {recoveryNotice ? <p className="mt-1 text-xs text-amber-700">{recoveryNotice}</p> : null}

          {viewFiltersModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="pool-view-filter-modal-title">
              <div id="pool-view-filter-modal" className="w-full max-w-4xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0">
                  <div>
                    <h3 id="pool-view-filter-modal-title" className="text-lg font-semibold text-slate-900">{t('studio.pool.filters.title')}</h3>
                    <p className="mt-1 text-sm text-slate-500">{t('studio.pool.filters.subtitle')}</p>
                  </div>
                  <button type="button" onClick={() => setViewFiltersModalOpen(false)} className="app-btn app-btn-ghost h-9 px-3 text-sm">
                    <span className="inline-flex items-center gap-2"><X className="h-4 w-4" />{t('studio.common.close')}</span>
                  </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{t('studio.pool.filters.ageTitle')}</p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <label className="block text-sm text-slate-700">
                          <span className="mb-1 block">{t('studio.pool.filters.ageMin')}</span>
                          <input
                            type="number"
                            min="18"
                            inputMode="numeric"
                            value={poolFilters.ageMin}
                            onChange={(event) => setPoolFilters((current) => ({ ...current, ageMin: event.target.value }))}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />
                        </label>
                        <label className="block text-sm text-slate-700">
                          <span className="mb-1 block">{t('studio.pool.filters.ageMax')}</span>
                          <input
                            type="number"
                            min="18"
                            inputMode="numeric"
                            value={poolFilters.ageMax}
                            onChange={(event) => setPoolFilters((current) => ({ ...current, ageMax: event.target.value }))}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{t('studio.pool.filters.flagsTitle')}</p>
                      <div className="mt-3 space-y-3">
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={poolFilters.photoOnly}
                            onChange={(event) => setPoolFilters((current) => ({ ...current, photoOnly: event.target.checked }))}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{t('studio.pool.filters.photoOnly')}</span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={poolFilters.verifiedOnly}
                            onChange={(event) => setPoolFilters((current) => ({ ...current, verifiedOnly: event.target.checked }))}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{t('studio.pool.filters.verifiedOnly')}</span>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{t('studio.pool.filters.maritalStatusTitle')}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        {['single', 'widowed', 'divorced'].map((status) => {
                          const checked = poolFilters.maritalStatuses.includes(status);
                          return (
                            <label key={status} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePoolMaritalFilter(status)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{t(`matchmakingPage.form.options.maritalStatus.${status}`)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 shrink-0">
                  <button
                    type="button"
                    onClick={resetPoolFilters}
                    className="app-btn app-btn-outline"
                    disabled={!hasActiveFilters}
                  >
                    {t('studio.pool.filters.reset')}
                  </button>
                  <button type="button" onClick={() => setViewFiltersModalOpen(false)} className="app-btn app-btn-primary">
                    {t('studio.common.close')}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {interactionFilterModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="pool-interaction-filter-modal-title">
              <div id="pool-interaction-filter-modal" className="w-full max-w-4xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0">
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      <h3 id="pool-interaction-filter-modal-title">{t('studio.profile.interactionFilter.title')}</h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{t('studio.profile.interactionFilter.body')}</p>
                    <p className="mt-2 text-xs text-slate-500">{t('studio.profile.interactionFilter.scopeHint')}</p>
                  </div>
                  <button type="button" onClick={() => setInteractionFilterModalOpen(false)} className="app-btn app-btn-ghost h-9 px-3 text-sm">
                    <span className="inline-flex items-center gap-2"><X className="h-4 w-4" />{t('studio.common.close')}</span>
                  </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${interactionFilterActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {interactionFilterActive ? t('studio.profile.interactionFilter.statusOn') : t('studio.profile.interactionFilter.statusOff')}
                    </div>
                  </div>

                  {interactionFilterState.error ? <p className="mt-3 text-sm text-rose-600">{interactionFilterState.error}</p> : null}
                  {interactionFilterState.success ? <p className="mt-3 text-sm text-emerald-700">{interactionFilterState.success}</p> : null}

                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]">
                    <div className="rounded-xl border border-emerald-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">{t('studio.profile.interactionFilter.ageTitle')}</p>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <label className="block text-sm text-slate-700">
                          <span className="mb-1 block">{t('studio.profile.interactionFilter.ageMin')}</span>
                          <input
                            type="number"
                            min="18"
                            inputMode="numeric"
                            value={interactionFilterDraft.ageMin}
                            onChange={(event) => updateInteractionFilterDraft((current) => ({ ...current, ageMin: event.target.value }))}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />
                        </label>
                        <label className="block text-sm text-slate-700">
                          <span className="mb-1 block">{t('studio.profile.interactionFilter.ageMax')}</span>
                          <input
                            type="number"
                            min="18"
                            inputMode="numeric"
                            value={interactionFilterDraft.ageMax}
                            onChange={(event) => updateInteractionFilterDraft((current) => ({ ...current, ageMax: event.target.value }))}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">{t('studio.profile.interactionFilter.flagsTitle')}</p>
                      <div className="mt-3 space-y-3">
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={interactionFilterDraft.requireVerified}
                            onChange={(event) => updateInteractionFilterDraft((current) => ({ ...current, requireVerified: event.target.checked }))}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{t('studio.profile.interactionFilter.requireVerified')}</span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={interactionFilterDraft.requirePhoto}
                            onChange={(event) => updateInteractionFilterDraft((current) => ({ ...current, requirePhoto: event.target.checked }))}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{t('studio.profile.interactionFilter.requirePhoto')}</span>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">{t('studio.profile.interactionFilter.maritalStatusTitle')}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        {['single', 'widowed', 'divorced'].map((status) => {
                          const checked = interactionFilterDraft.allowedMaritalStatuses.includes(status);
                          return (
                            <label key={status} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleInteractionFilterMaritalStatus(status)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{t(`matchmakingPage.form.options.maritalStatus.${status}`)}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 shrink-0">
                  <button
                    type="button"
                    onClick={clearInteractionFilter}
                    className="app-btn app-btn-outline"
                    disabled={interactionFilterState.loading || (!interactionFilterActive && !interactionFilterDirty)}
                  >
                    {t('studio.profile.interactionFilter.clear')}
                  </button>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => setInteractionFilterModalOpen(false)} className="app-btn app-btn-outline">
                      {t('studio.common.close')}
                    </button>
                    <button
                      type="button"
                      onClick={saveInteractionFilter}
                      className="app-btn app-btn-primary"
                      disabled={interactionFilterState.loading}
                    >
                      {interactionFilterState.loading ? t('studio.profile.interactionFilter.saving') : t('studio.profile.interactionFilter.save')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {reviewCtaState === 'none' ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(255,255,255,0.95))] p-4 shadow-[0_18px_38px_rgba(16,185,129,0.10)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700/80">{t('studio.pool.reviewCta.eyebrow')}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{t('studio.pool.reviewCta.title')}</p>
                  <p className="mt-1 text-sm text-slate-700">{t('studio.pool.reviewCta.body')}</p>
                </div>
                <button
                  type="button"
                  onClick={openReviewPrompt}
                  className="app-btn app-btn-primary w-full sm:w-auto"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Star className="h-4 w-4" />
                    <span>{t('studio.pool.reviewCta.button')}</span>
                  </span>
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,255,255,0.94))] p-4 shadow-[0_18px_38px_rgba(217,119,6,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-700/80">{t('studio.pool.importantNotice.eyebrow')}</p>
                <p className="mt-1 text-sm text-slate-700">{t('studio.pool.importantNotice.summary')}</p>
              </div>
              <div className="relative w-full pt-5 sm:w-auto">
                <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0">
                  <div className="-rotate-6 rounded-full border border-white/70 bg-rose-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(244,63,94,0.32)]">
                    {t('studio.pool.importantNotice.tapSticker')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setImportantNoticeOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_14px_30px_rgba(245,158,11,0.28)] transition hover:bg-amber-400 sm:w-auto"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>{t('studio.pool.importantNotice.openButton')}</span>
                </button>
              </div>
            </div>
          </div>

          <StudioInviteFriendsCard
            className="mt-4"
            compact
            onClick={() => {
              if (isPreview) {
                openPreviewGate({ reason: t('previewGate.body') });
                return;
              }
              navigate('/profilim?panel=referral');
            }}
          />
          {canLoadMore ? (
            <div className="mt-3">
              <button type="button" onClick={loadMore} className="app-btn app-btn-outline w-full sm:w-auto">
                {t('studio.pool.loadMore', { count: Math.min(POOL_LOAD_MORE_STEP, Math.max((meta?.total || 0) - items.length, 0)) })}
              </button>
            </div>
          ) : null}

          {paywallNotice ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{t('studio.paywall.upgradeTitle')}</p>
                <button
                  type="button"
                  onClick={() => setPaywallNotice('')}
                  className="rounded-md px-2 py-1 text-sm font-semibold text-amber-900/70 hover:bg-amber-100"
                >
                  {t('studio.common.close')}
                </button>
              </div>
              <p className="mt-1 text-sm text-amber-900/80">{paywallNotice}</p>
            </div>
          ) : null}

          {completeProfileGateOpen ? (
            <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold">
                  {t('studio.profile.completeProfileTutorial.title')}
                </p>
                <button
                  type="button"
                  onClick={dismissCompleteProfileGate}
                  className="rounded-md px-2 py-1 text-sm font-semibold text-amber-900/70 hover:bg-amber-100"
                >
                  {t('studio.common.close')}
                </button>
              </div>
              <p className="mt-1 text-sm text-amber-900/80">
                {profileGateMode === 'photo'
                  ? t('studio.profile.completeProfileTutorial.photoBody')
                  : t('studio.profile.completeProfileTutorial.body')}
              </p>

              {import.meta?.env?.DEV ? (
                <p className="mt-2 text-[11px] text-amber-900/70">
                  debug: hasApp={String(effectiveHasAnyApplication)} hasPhoto={String(effectiveHasAnyPhoto)} profileComplete={String(myProfileComplete)} needsApplication={String(needsApplication)}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={startCompleteProfileGate} className="app-btn app-btn-primary">
                  {profileGateMode === 'photo'
                    ? t('studio.profile.completeProfileTutorial.actions.uploadPhoto')
                    : t('studio.profile.completeProfileTutorial.actions.ok')}
                </button>
                <button type="button" onClick={dismissCompleteProfileGate} className="app-btn app-btn-outline">
                  {t('studio.profile.completeProfileTutorial.actions.later')}
                </button>
              </div>
            </div>
          ) : null}

          {optionalDetailsPromptOpen ? (
            <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold">{t('studio.pool.optionalDetailsRecommendation.title')}</p>
                <button
                  type="button"
                  onClick={dismissOptionalDetailsPrompt}
                  className="rounded-md px-2 py-1 text-sm font-semibold text-emerald-900/70 hover:bg-emerald-100"
                >
                  {t('studio.pool.optionalDetailsRecommendation.actions.later')}
                </button>
              </div>
              <p className="mt-1 text-sm text-emerald-900/80">{t('studio.pool.optionalDetailsRecommendation.body')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={goToOptionalDetailsTarget} className="app-btn app-btn-primary">
                  {t('studio.pool.optionalDetailsRecommendation.actions.ok')}
                </button>
                <button type="button" onClick={dismissOptionalDetailsPrompt} className="app-btn app-btn-outline">
                  {t('studio.pool.optionalDetailsRecommendation.actions.later')}
                </button>
              </div>
            </div>
          ) : null}

          {filtersTutorialOpen ? (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto" role="dialog" aria-modal="true">
              <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0">
                  <h3 className="text-lg font-semibold">{t('studio.pool.filters.tutorial.title')}</h3>
                  <button type="button" onClick={dismissFiltersTutorial} className="app-btn app-btn-ghost h-8 px-2 text-xs">
                    {t('studio.common.close')}
                  </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm text-slate-700 whitespace-pre-line">{t('studio.pool.filters.tutorial.body')}</p>
                  </div>

                  {poolFilterTutorialItems.length ? (
                    <ul className="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950">
                      {poolFilterTutorialItems.map((item, index) => (
                        <li key={`${item}-${index}`} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={dismissFiltersTutorial} className="app-btn app-btn-outline">
                      {t('studio.pool.filters.tutorial.later')}
                    </button>
                    <button type="button" onClick={openFiltersTutorialPanel} className="app-btn app-btn-primary">
                      {t('studio.pool.filters.tutorial.cta')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {profileGateNotice ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{t('studio.profileGate.title')}</p>
                <button
                  type="button"
                  onClick={() => setProfileGateNotice('')}
                  className="rounded-md px-2 py-1 text-sm font-semibold text-amber-900/70 hover:bg-amber-100"
                >
                  {t('studio.common.close')}
                </button>
              </div>
              <p className="mt-1 text-sm text-amber-900/80">{profileGateNotice}</p>
              <div className="mt-3">
                  <button type="button" onClick={goToProfileCompletionTarget} className="app-btn app-btn-primary h-10 px-4">
                    {profileGateCta}
                  </button>
              </div>
            </div>
          ) : null}

          {state.loading ? <p className="mt-6 text-slate-600">{t('studio.common.loading')}</p> : null}
          {state.error ? <p className="mt-6 text-rose-700">{state.error}</p> : null}

          <div className="mt-6">
            <div className="grid grid-cols-2 gap-2 sm:max-w-xl">
                <button
                  type="button"
                  onClick={() => setViewFiltersModalOpen(true)}
                  className="app-btn app-btn-primary w-full"
                  aria-expanded={viewFiltersModalOpen}
                  aria-controls="pool-view-filter-modal"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>{t('studio.pool.filters.toggle')}</span>
                    {activeFilterCount ? <span className="app-badge">{activeFilterCount}</span> : null}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionFilterModalOpen(true)}
                  className="app-btn app-btn-primary w-full"
                  aria-expanded={interactionFilterModalOpen}
                  aria-controls="pool-interaction-filter-modal"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{t('studio.profile.interactionFilter.title')}</span>
                  </span>
                </button>
            </div>
          </div>

          {null}

          {!state.loading && !state.error && !needsApplication && items.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-slate-700">
              <p className="font-semibold text-slate-900">{t('studio.waitingNote.title')}</p>
              <p className="mt-2 text-sm text-slate-700">
                <Trans
                  i18nKey="studio.waitingNote.body"
                  components={{
                    explore: (
                      <Link
                        to="/app/pool"
                        className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[12px] font-semibold text-emerald-900 align-baseline hover:bg-emerald-100"
                      />
                    ),
                  }}
                />
              </p>
              <p className="mt-2 text-sm text-slate-600">{t('studio.pool.empty')}</p>
            </div>
          ) : null}

          {!state.loading && !state.error && !needsApplication && items.length > 0 && filteredItems.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-center text-slate-700 shadow-sm">
              <p className="font-semibold text-slate-900">{t('studio.pool.filters.noResultsTitle')}</p>
              <p className="mt-2 text-sm text-slate-600">{t('studio.pool.filters.noResultsBody')}</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button type="button" onClick={resetPoolFilters} className="app-btn app-btn-outline">
                  {t('studio.pool.filters.reset')}
                </button>
              </div>
            </div>
          ) : null}

          {myPhotosBlurred ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <div className="text-sm font-semibold">{t('studio.match.photos.reciprocityHint')}</div>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((it) => {
              return (
                <PoolCandidateCard
                  key={safeStr(it?.uid) || safeStr(it?.applicationId)}
                  item={it}
                  outboxMap={outboxMap}
                  myPhotosBlurred={myPhotosBlurred}
                  requestingUid={requestingUid}
                  requestAccess={requestAccess}
                  setLightbox={setLightbox}
                  presenceByUid={presenceByUid}
                />
              );
            })}
          </div>

          <StudioInboxModal
            open={!!inboxModal?.open}
            onClose={() => setInboxModal({ open: false })}
            title={t('studio.inbox.modalTitleRequests')}
            items={inboxAccess}
            mode="requests"
            onMarkRead={markInboxMessageRead}
            onApprove={({ fromUid }) => respondAccessRequest({ fromUid, decision: 'approve' })}
            onReject={({ fromUid }) => respondAccessRequest({ fromUid, decision: 'reject' })}
            actionsDisabled={false}
            onRequireProfile={() => {}}
            loadingId={accessAction.loadingId}
            error={accessAction.error}
          />

          {lightbox.open ? (
            <ImageLightbox
              images={lightbox.images}
              currentIndex={lightbox.index}
              onClose={() => setLightbox({ open: false, images: [], index: 0, title: '' })}
            />
          ) : null}

          {importantNoticeOpen ? (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-6 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="pool-important-notice-title">
              <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-[0_34px_100px_rgba(15,23,42,0.28)]">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-700/80">{t('studio.pool.importantNotice.eyebrow')}</p>
                    <h3 id="pool-important-notice-title" className="mt-1 text-lg font-semibold text-slate-950">{t('studio.pool.importantNotice.title')}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportantNoticeOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                    aria-label={t('studio.common.close')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto px-5 py-5">
                  <div className="space-y-5 text-sm leading-6 text-slate-700">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p>{t('studio.pool.importantNotice.intro')}</p>
                      <p className="mt-3">{t('studio.pool.importantNotice.body1')}</p>
                      <p className="mt-3">{t('studio.pool.importantNotice.body2')}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-950">{t('studio.pool.importantNotice.analysisTitle')}</p>
                      <ul className="mt-2 space-y-2 text-slate-700">
                        {importantNoticeAnalysisItems.map((item, index) => (
                          <li key={`analysis-${index}`} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="font-semibold text-emerald-950">{t('studio.pool.importantNotice.positiveTitle')}</p>
                      <p className="mt-2 text-emerald-900/90">{t('studio.pool.importantNotice.positiveLead')}</p>
                      <ul className="mt-3 space-y-2 text-emerald-950">
                        {importantNoticePositiveItems.map((item, index) => (
                          <li key={`positive-${index}`} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <p className="font-semibold text-rose-950">{t('studio.pool.importantNotice.reportTitle')}</p>
                      <p className="mt-2 text-rose-900/90">{t('studio.pool.importantNotice.reportLead')}</p>
                      <ul className="mt-3 space-y-2 text-rose-950">
                        {importantNoticeReportItems.map((item, index) => (
                          <li key={`report-${index}`} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 font-semibold text-rose-950">{t('studio.pool.importantNotice.reportOutro')}</p>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                      <p className="font-semibold text-indigo-950">{t('studio.pool.importantNotice.guidanceTitle')}</p>
                      <p className="mt-2 text-indigo-900/90">{t('studio.pool.importantNotice.guidanceBody1')}</p>
                      <p className="mt-3 text-indigo-900/90">{t('studio.pool.importantNotice.guidanceBody2')}</p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="font-semibold text-amber-950">{t('studio.pool.importantNotice.extraSafetyTitle')}</p>
                      <p className="mt-2 text-amber-900/90">{t('studio.pool.importantNotice.extraSafetyBody')}</p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p>{t('studio.pool.importantNotice.closing1')}</p>
                      <p className="mt-3">{t('studio.pool.importantNotice.closing2')}</p>
                      <p className="mt-3">{t('studio.pool.importantNotice.closing3')}</p>
                    </div>

                    <p className="font-semibold text-slate-950">{t('studio.pool.importantNotice.footer')}</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setImportantNoticeOpen(false)}
                    className="app-btn app-btn-primary w-full"
                  >
                    {t('studio.pool.importantNotice.closeButton')}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <StudioBottomNav />
    </div>
  );
}
