import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, getDoc, getDocFromServer, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider';
import { db } from '../../config/firebaseDb';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import ImageLightbox from '../../components/ImageLightbox';
import YouTubeVisitCard from '../../components/YouTubeVisitCard';
import StudioMatchCard from '../../components/studio/StudioMatchCard';
import StudioPersonCard from '../../components/studio/StudioPersonCard';
import StudioInboxModal from '../../components/studio/StudioInboxModal';
import { authFetch } from '../../utils/authFetch';
import { useAutoLocalizedProfileText } from '../../hooks/useAutoLocalizedProfileText';
import { getLocalizedProfileText } from '../../utils/profileText';
import { translateStudioApiError } from '../../utils/studioErrorI18n';
import { useMatchmakingResetAtMs } from '../../utils/matchmakingReset';
import { HelpCircle, MessageCircle, Share2, User, Compass } from 'lucide-react';
import { openPreviewGate } from '../../utils/previewGate';
import { buildPreviewMatches } from '../../utils/studioPreviewData';
import StudioBottomNav from '../../components/studio/StudioBottomNav';
import StudioInviteFriendsCard from '../../components/studio/StudioInviteFriendsCard.jsx';
import { isTutorialActive } from '../../utils/tutorialState.js';
import { formatDateTimeFromMs, formatRelativeTimeFromMs, timestampToMs } from '../../utils/relativeTime';
import {
  hasAnyMatchmakingPhotoInApplicationDoc,
  hasAnyStoredMatchmakingPhotoInApplicationDoc,
  hasAnyMatchmakingPhotoInUserDoc,
  hasAnyMatchmakingProfileInUserDoc,
  hasMinimumMatchmakingProfileInUserDoc,
} from '../../utils/matchmakingProfileCompletion';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

const OPEN_CHAT_MODEL = true;

function getOtherUidFromMatch(match, currentUid) {
  const aId = safeStr(match?.aUserId);
  const bId = safeStr(match?.bUserId);
  if (!currentUid) return '';
  if (aId && aId === currentUid) return bId;
  if (bId && bId === currentUid) return aId;
  return '';
}

function isMinimumProfileCompleteFromUserDoc(d) {
  return hasMinimumMatchmakingProfileInUserDoc(d);
}

function mergeInboxAccessItems(nextItems, prevItems) {
  const next = Array.isArray(nextItems) ? nextItems : [];
  const prev = Array.isArray(prevItems) ? prevItems : [];
  const nextIds = new Set(
    next
      .map((item) => safeStr(item?.requestId) || safeStr(item?.id))
      .filter(Boolean)
  );

  const preservedPeopleList = prev.filter((item) => {
    const id = safeStr(item?.requestId) || safeStr(item?.id);
    if (!id || nextIds.has(id)) return false;
    if (safeStr(item?.type) !== 'people_list') return false;
    const status = safeStr(item?.status);
    return status === 'pending' || !status;
  });

  if (!preservedPeopleList.length) return next;
  return [...next, ...preservedPeopleList];
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
  const v = safeStr(raw).toLowerCase();
  if (!v) return '';
  if (v === 'yes') return t('matchmakingPage.form.options.common.yes');
  if (v === 'no') return t('matchmakingPage.form.options.common.no');
  if (v === 'unsure') return t('matchmakingPage.form.options.common.unsure');
  if (v === 'doesnt_matter' || v === 'doesntmatter') return t('matchmakingPage.form.options.common.doesntMatter');
  return safeStr(raw);
}

function formatGenderLabel(t, raw) {
  const v = safeStr(raw).toLowerCase();
  if (!v) return '';
  if (v === 'female' || v === 'f' || v === 'kadin' || v === 'kadın') return t('matchmakingPage.form.options.gender.female');
  if (v === 'male' || v === 'm' || v === 'erkek') return t('matchmakingPage.form.options.gender.male');
  return safeStr(raw);
}

function formatNationalityLabel(t, raw) {
  const v = safeStr(raw).toLowerCase();
  if (!v) return '';
  if (v === 'tr') return t('matchmakingPage.form.options.nationality.tr');
  if (v === 'id') return t('matchmakingPage.form.options.nationality.id');
  if (v === 'other') return t('matchmakingPage.form.options.nationality.other');
  return safeStr(raw);
}

function formatMappedProfileValue(t, kind, raw, extra = '') {
  const v = safeStr(raw).toLowerCase();
  if (!v) return '';

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
    familyValuesPreference: {
      religious: 'matchmakingPage.form.options.familyValues.religious',
      liberal: 'matchmakingPage.form.options.familyValues.liberal',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
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
    partnerChildrenPreference: {
      want_children: 'matchmakingPage.form.options.partnerChildren.wantChildren',
      wantchildren: 'matchmakingPage.form.options.partnerChildren.wantChildren',
      no_children: 'matchmakingPage.form.options.partnerChildren.noChildren',
      nochildren: 'matchmakingPage.form.options.partnerChildren.noChildren',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    },
    partnerCommunicationMethod: {
      own_language: 'matchmakingPage.form.options.partnerCommunicationMethods.ownLanguage',
      ownlanguage: 'matchmakingPage.form.options.partnerCommunicationMethods.ownLanguage',
      foreign_language: 'matchmakingPage.form.options.partnerCommunicationMethods.foreignLanguage',
      foreignlanguage: 'matchmakingPage.form.options.partnerCommunicationMethods.foreignLanguage',
      translation_app: 'matchmakingPage.form.options.partnerCommunicationMethods.translationApp',
      translationapp: 'matchmakingPage.form.options.partnerCommunicationMethods.translationApp',
    },
    livingCountry: {
      tr: 'matchmakingPage.form.options.livingCountry.tr',
      id: 'matchmakingPage.form.options.livingCountry.id',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    },
  };

  const key = maps?.[kind]?.[v] || '';
  if (key) {
    if (kind === 'communicationLanguage' && v === 'ar') return 'Arapca';
    return t(key);
  }

  if (kind === 'smoking' || kind === 'alcohol' || kind === 'children' || kind === 'translationAppPreference' || kind === 'familyApprovalStatus' || kind === 'relocationWillingness') {
    return formatYesNoLike(t, raw);
  }

  if (kind === 'communicationLanguage' && v === 'other') {
    return extra ? `${t('matchmakingPage.form.options.commLanguage.other')}: ${extra}` : t('matchmakingPage.form.options.commLanguage.other');
  }

  return safeStr(raw);
}

function formatLanguageChoice(t, raw, other = '') {
  const formatted = formatMappedProfileValue(t, 'communicationLanguage', raw, other);
  if (safeStr(raw).toLowerCase() === 'other' && other) return `${formatted}: ${other}`;
  return formatted || safeStr(other);
}

function buildPersonProfileSections(profile, t) {
  const p = profile && typeof profile === 'object' ? profile : {};
  const details = p?.details && typeof p.details === 'object' ? p.details : {};
  const partner = p?.partnerPreferences && typeof p.partnerPreferences === 'object' ? p.partnerPreferences : {};
  const languages = details?.languages && typeof details.languages === 'object' ? details.languages : {};
  const nativeLang = languages?.native && typeof languages.native === 'object' ? languages.native : {};
  const foreignLang = languages?.foreign && typeof languages.foreign === 'object' ? languages.foreign : {};

  const identity = [
    { label: t('myInfo.fields.age'), value: typeof p?.age === 'number' ? String(p.age) : '' },
    { label: t('myInfo.fields.city'), value: safeStr(p?.city) },
    { label: t('myInfo.fields.country'), value: safeStr(p?.country) },
    { label: t('matchmakingPage.form.labels.nationality'), value: formatNationalityLabel(t, p?.nationality) },
    { label: t('matchmakingPage.form.labels.gender'), value: formatGenderLabel(t, p?.gender) },
    { label: t('matchmakingPage.form.labels.lookingForGender'), value: formatGenderLabel(t, p?.lookingForGender) },
    { label: t('matchmakingPage.form.labels.lookingForNationality'), value: formatNationalityLabel(t, p?.lookingForNationality) },
  ].filter((item) => hasMeaningfulProfileValue(item.value));

  const detailsEntries = [
    { label: t('matchmakingPage.form.labels.height'), value: typeof details?.heightCm === 'number' ? `${details.heightCm} cm` : '' },
    { label: t('matchmakingPage.form.labels.weight'), value: typeof details?.weightKg === 'number' ? `${details.weightKg} kg` : '' },
    { label: t('matchmakingPage.form.labels.occupation'), value: formatMappedProfileValue(t, 'occupation', details?.occupation || p?.occupation) || safeStr(details?.occupation || p?.occupation) },
    { label: t('matchmakingPage.form.labels.education'), value: formatMappedProfileValue(t, 'education', details?.education || p?.education) || safeStr(details?.education || p?.education) },
    { label: t('matchmakingPage.form.labels.educationDepartment'), value: safeStr(details?.educationDepartment) },
    { label: t('matchmakingPage.form.labels.maritalStatus'), value: formatMappedProfileValue(t, 'maritalStatus', details?.maritalStatus || p?.maritalStatus) },
    { label: t('matchmakingPage.form.labels.hasChildren'), value: formatYesNoLike(t, details?.hasChildren || p?.hasChildren) },
    { label: t('matchmakingPage.form.labels.childrenCount'), value: typeof details?.childrenCount === 'number' ? String(details.childrenCount) : '' },
    { label: t('matchmakingPage.form.labels.childrenLivingSituation'), value: formatMappedProfileValue(t, 'childrenLivingSituation', details?.childrenLivingSituation) },
    { label: t('matchmakingPage.form.labels.liveWithChildrenAfterMarriage'), value: formatYesNoLike(t, details?.liveWithChildrenAfterMarriage) },
    { label: t('matchmakingPage.form.labels.incomeLevel'), value: formatMappedProfileValue(t, 'incomeLevel', details?.incomeLevel) },
    { label: t('matchmakingPage.form.labels.religion'), value: formatMappedProfileValue(t, 'religion', details?.religion) },
    { label: t('matchmakingPage.form.labels.religiousValues'), value: formatMappedProfileValue(t, 'religiousValues', details?.religiousValues) || safeStr(details?.religiousValues) },
    { label: t('matchmakingPage.form.labels.familyApprovalStatus'), value: formatMappedProfileValue(t, 'familyApprovalStatus', details?.familyApprovalStatus) },
    { label: t('matchmakingPage.form.labels.marriageTimeline'), value: formatMappedProfileValue(t, 'marriageTimeline', details?.marriageTimeline) },
    { label: t('matchmakingPage.form.labels.relocationWillingness'), value: formatMappedProfileValue(t, 'relocationWillingness', details?.relocationWillingness) },
    { label: t('matchmakingPage.form.labels.preferredLivingCountry'), value: safeStr(details?.preferredLivingCountry) },
    { label: t('matchmakingPage.form.labels.nativeLanguage'), value: formatLanguageChoice(t, nativeLang?.code, nativeLang?.other) },
    {
      label: t('matchmakingPage.form.labels.foreignLanguages'),
      value: Array.isArray(foreignLang?.codes)
        ? foreignLang.codes
            .map((code) => formatLanguageChoice(t, code, code === 'other' ? foreignLang?.other : ''))
            .filter(Boolean)
            .join(', ')
        : '',
    },
    { label: t('matchmakingPage.form.labels.communicationLanguages'), value: formatLanguageChoice(t, details?.communicationLanguage, details?.communicationLanguageOther) },
    {
      label: t('matchmakingPage.form.labels.partnerTranslationApp'),
      value: details?.communicationLanguage === 'translation_app' || details?.canCommunicateWithTranslationApp === true
        ? t('apply.form.options.common.yes')
        : details?.communicationLanguage
          ? t('apply.form.options.common.no')
          : '',
    },
    { label: t('matchmakingPage.form.labels.smoking'), value: formatMappedProfileValue(t, 'smoking', details?.smoking || p?.smoking) },
    { label: t('matchmakingPage.form.labels.alcohol'), value: formatMappedProfileValue(t, 'alcohol', details?.alcohol || p?.alcohol) },
  ].filter((item) => hasMeaningfulProfileValue(item.value));

  const communicationMethods = Array.isArray(partner?.communicationMethods)
    ? partner.communicationMethods
        .map((method) => formatMappedProfileValue(t, 'partnerCommunicationMethod', method))
        .filter(Boolean)
        .join(', ')
    : '';

  const partnerEntries = [
    { label: t('myInfo.fields.partnerAgeMin'), value: hasMeaningfulProfileValue(partner?.ageMin) ? String(partner.ageMin) : '' },
    { label: t('myInfo.fields.partnerAgeMax'), value: hasMeaningfulProfileValue(partner?.ageMax) ? String(partner.ageMax) : '' },
    { label: t('matchmakingPage.form.labels.partnerAgeMaxOlderYears'), value: hasMeaningfulProfileValue(partner?.ageMaxOlderYears) ? String(partner.ageMaxOlderYears) : '' },
    { label: t('matchmakingPage.form.labels.partnerAgeMaxYoungerYears'), value: hasMeaningfulProfileValue(partner?.ageMaxYoungerYears) ? String(partner.ageMaxYoungerYears) : '' },
    { label: t('myInfo.fields.partnerHeightMinCm'), value: hasMeaningfulProfileValue(partner?.heightMinCm) ? `${partner.heightMinCm} cm` : '' },
    { label: t('myInfo.fields.partnerHeightMaxCm'), value: hasMeaningfulProfileValue(partner?.heightMaxCm) ? `${partner.heightMaxCm} cm` : '' },
    { label: t('matchmakingPage.form.labels.partnerMaritalStatus'), value: formatMappedProfileValue(t, 'maritalStatus', partner?.maritalStatus) },
    { label: t('matchmakingPage.form.labels.partnerReligion'), value: formatMappedProfileValue(t, 'religion', partner?.religion) },
    { label: t('matchmakingPage.form.labels.partnerLivingCountry'), value: formatMappedProfileValue(t, 'livingCountry', partner?.livingCountry) || safeStr(partner?.livingCountry) },
    { label: t('matchmakingPage.form.labels.partnerChildrenPreference'), value: formatMappedProfileValue(t, 'partnerChildrenPreference', partner?.childrenPreference) },
    { label: t('matchmakingPage.form.labels.partnerEducationPreference'), value: formatMappedProfileValue(t, 'education', partner?.educationPreference) },
    { label: t('matchmakingPage.form.labels.partnerOccupationPreference'), value: formatMappedProfileValue(t, 'occupation', partner?.occupationPreference) },
    { label: t('matchmakingPage.form.labels.partnerFamilyValuesPreference'), value: formatMappedProfileValue(t, 'familyValuesPreference', partner?.familyValuesPreference) },
    { label: t('matchmakingPage.form.labels.partnerCommunicationLanguages'), value: formatLanguageChoice(t, partner?.communicationLanguage, partner?.communicationLanguageOther) },
    { label: t('matchmakingPage.form.labels.partnerCommunicationMethods'), value: communicationMethods },
    {
      label: t('matchmakingPage.form.labels.partnerTranslationApp'),
      value: partner?.translationAppPreference === 'yes' || partner?.canCommunicateWithTranslationApp === true
        ? t('apply.form.options.common.yes')
        : partner?.translationAppPreference === 'no' || Array.isArray(partner?.communicationMethods)
          ? t('apply.form.options.common.no')
          : '',
    },
    { label: t('matchmakingPage.form.labels.partnerSmokingPreference'), value: formatMappedProfileValue(t, 'smoking', partner?.smokingPreference) },
    { label: t('matchmakingPage.form.labels.partnerAlcoholPreference'), value: formatMappedProfileValue(t, 'alcohol', partner?.alcoholPreference) },
  ].filter((item) => hasMeaningfulProfileValue(item.value));

  return { identity, detailsEntries, partnerEntries };
}

export default function StudioMatches() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isPreview = !user || user.isAnonymous;
  const effectiveUid = isPreview ? '' : String(user?.uid || '').trim();
  const currentUidForView = isPreview ? 'guest' : effectiveUid;

  const mmReset = useMatchmakingResetAtMs();
  const resetAtMs = typeof mmReset?.resetAtMs === 'number' && Number.isFinite(mmReset.resetAtMs) ? mmReset.resetAtMs : 0;

  const targetLang = useMemo(() => {
    const raw = String(i18n?.language || 'tr');
    const base = raw.split('-')[0];
    return base || 'tr';
  }, [i18n?.language]);

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [inboxLikes, setInboxLikes] = useState([]);
  const [inboxAction, setInboxAction] = useState({ loadingId: '', error: '' });
  const [myPeople, setMyPeople] = useState([]);
  const [peopleAction, setPeopleAction] = useState({ loadingUid: '', kind: '', error: '', notice: '' });

  const [inboxAccess, setInboxAccess] = useState([]); // pre-match requests
  const [inboxProfileAccess, setInboxProfileAccess] = useState([]); // profile access requests
  const [accessAction, setAccessAction] = useState({ loadingId: '', error: '' });

  const [inboxMessages, setInboxMessages] = useState([]);

  const [inboxModal, setInboxModal] = useState({ open: false, mode: 'requests' });
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0, title: '' });

  useEffect(() => {
    const st = location?.state && typeof location.state === 'object' ? location.state : null;
    const requestedMode = String(st?.openInbox || '').trim();
    if (!requestedMode) return;

    const nextMode = requestedMode === 'messages' ? 'messages' : 'requests';
    setInboxModal({ open: true, mode: nextMode });

    try {
      navigate(`${location.pathname || '/app/matches'}${location.search || ''}${location.hash || ''}`, { replace: true, state: {} });
    } catch {
      // noop
    }
  }, [location.hash, location.pathname, location.search, location.state, navigate]);

  const [inboxLoad, setInboxLoad] = useState({ loading: false, error: '', lastSource: '' });
  const inboxLoadRef = useRef({ loading: false, error: '', lastSource: '' });
  const clientProjectId = useMemo(() => {
    try {
      return db?.app?.options?.projectId || '';
    } catch {
      return '';
    }
  }, []);

  const [shortModal, setShortModal] = useState({ open: false, matchId: '', displayName: '' });
  const [shortText, setShortText] = useState('');
  const [shortState, setShortState] = useState({ loading: false, error: '' });
  const [shortMatch, setShortMatch] = useState(null);
  const [shortMessages, setShortMessages] = useState([]);
  const [shortLoading, setShortLoading] = useState(false);
  const [shortNowMs, setShortNowMs] = useState(() => Date.now());
  const shortScrollRef = useRef(null);
  const [translateState, setTranslateState] = useState({ loadingId: '', error: '' });
  const [personMessageModal, setPersonMessageModal] = useState({ open: false, targetUid: '', displayName: '', photoUrl: '' });
  const [personMessageText, setPersonMessageText] = useState('');
  const [personMessageState, setPersonMessageState] = useState({ loading: false, error: '' });
  const [personProfileModal, setPersonProfileModal] = useState({ open: false, loading: false, error: '', profile: null, displayName: '' });
  const [personProfilePhotoIndex, setPersonProfilePhotoIndex] = useState(0);

  const activateMembershipRef = useRef(false);
  const paywallAutoActivateRef = useRef(false);

  const [myMembership, setMyMembership] = useState({ active: false });
  const [paywallNotice, setPaywallNotice] = useState('');
  const [profileGateNotice, setProfileGateNotice] = useState('');
  const [myProfileComplete, setMyProfileComplete] = useState(true);
  const [myHasAnyPhoto, setMyHasAnyPhoto] = useState(null); // null=unknown
  const [myHasAnyApplication, setMyHasAnyApplication] = useState(null); // null=unknown
  const [myHasAnyPhotoFromUserDoc, setMyHasAnyPhotoFromUserDoc] = useState(null);
  const [myHasAnyApplicationFromUserDoc, setMyHasAnyApplicationFromUserDoc] = useState(null);

  const [completeProfileGateOpen, setCompleteProfileGateOpen] = useState(false);

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

  useEffect(() => {
    if (!profileGateNotice || !profileGateMode) return;
    setProfileGateNotice((current) => (current === profileGateBody ? current : profileGateBody));
  }, [profileGateBody, profileGateMode, profileGateNotice]);

  const [presenceByUid, setPresenceByUid] = useState({});
  const presenceUiEnabled = true;

  useEffect(() => {
    inboxLoadRef.current = inboxLoad;
  }, [inboxLoad]);

  useEffect(() => {
    if (!isPreview) return;
    const sample = buildPreviewMatches({ currentUid: currentUidForView });
    setMatches(sample);
    setLoading(false);
    setError('');
    setInboxLikes([]);
    setMyPeople([]);
    setInboxAccess([]);
    setInboxProfileAccess([]);
    setInboxMessages([]);
    setPaywallNotice('');
    setProfileGateNotice('');
    setMyMembership({ active: false });
    setMyProfileComplete(false);
    setPresenceByUid({});
    setPeopleAction({ loadingUid: '', kind: '', error: '', notice: '' });
  }, [currentUidForView, isPreview]);

  const asMs = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (v && typeof v.toMillis === 'function') return v.toMillis();
    if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
    return 0;
  };

  const getMatchActivityMs = (match) => {
    const updatedAtMs = typeof match?.updatedAtMs === 'number' && Number.isFinite(match.updatedAtMs) ? match.updatedAtMs : 0;
    const updatedAt = asMs(match?.updatedAt);
    const chatLastMessageAtMsAny =
      typeof match?.chatLastMessageAtMsAny === 'number' && Number.isFinite(match.chatLastMessageAtMsAny)
        ? match.chatLastMessageAtMsAny
        : 0;
    const createdAtMs = typeof match?.createdAtMs === 'number' && Number.isFinite(match.createdAtMs) ? match.createdAtMs : 0;
    const createdAt = asMs(match?.createdAt);
    return Math.max(updatedAtMs, updatedAt, chatLastMessageAtMsAny, createdAtMs, createdAt);
  };

  const filterInboxLikes = (raw, uid, cutoffMs) => {
    const me = String(uid || '').trim();
    const list = Array.isArray(raw) ? raw : [];
    return list
      .filter((x) => {
        if (!x || typeof x !== 'object') return false;
        const createdAtMs = typeof x?.createdAtMs === 'number' && Number.isFinite(x.createdAtMs) ? x.createdAtMs : 0;
        if (cutoffMs > 0 && createdAtMs > 0 && createdAtMs < cutoffMs) return false;
        if (String(x?.type || '').trim() && String(x?.type || '').trim() !== 'like') return false;
        if (String(x?.status || '').trim() !== 'pending') return false;
        const fromUid = String(x?.fromUid || '').trim();
        const toUid = String(x?.toUid || '').trim();
        if (me && fromUid && fromUid === me) return false;
        if (me && toUid && toUid !== me) return false;
        const mid = String(x?.matchId || x?.id || '').trim();
        return !!mid;
      })
      .slice(0, 50);
  };

  const refreshInboxViaApi = useCallback(async () => {
    if (isPreview) return;
    const uid = effectiveUid;
    const prev = inboxLoadRef.current;
    if (!uid || prev.loading) return;
    setInboxLoad({ loading: true, error: '', lastSource: prev.lastSource || '' });
    try {
      const data = await authFetch('/api/matchmaking-inbox-summary', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ limit: 60 }),
      });
      const likes = filterInboxLikes(Array.isArray(data?.inboxLikes) ? data.inboxLikes : [], uid, resetAtMs);
      const preMatch = Array.isArray(data?.inboxPreMatchRequests) ? data.inboxPreMatchRequests : [];
      const profileAccess = Array.isArray(data?.inboxAccessRequests) ? data.inboxAccessRequests : [];
      setInboxLikes(likes);
      setInboxAccess((current) => mergeInboxAccessItems(preMatch, current));
      setInboxProfileAccess(profileAccess);
      setInboxMessages(Array.isArray(data?.inboxMessages) ? data.inboxMessages : []);
      setInboxLoad({ loading: false, error: '', lastSource: 'api' });
    } catch (e) {
      const msg = String(e?.message || '').trim() || 'inbox_refresh_failed';
      setInboxLoad({ loading: false, error: translateStudioApiError(t, msg) || msg, lastSource: 'api' });
    }
  }, [effectiveUid, isPreview, resetAtMs, t]);

  useEffect(() => {
    if (isPreview || !effectiveUid) return;
    void refreshInboxViaApi();
  }, [effectiveUid, isPreview, refreshInboxViaApi]);

  useEffect(() => {
    if (!inboxModal?.open || isPreview || !effectiveUid) return;
    void refreshInboxViaApi();
  }, [effectiveUid, inboxModal?.mode, inboxModal?.open, isPreview, refreshInboxViaApi]);

  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) return;

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

        setMyProfileComplete(isMinimumProfileCompleteFromUserDoc(d));
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

        // 2026-02: Apply form no longer asks for expectations.
        setMyProfileComplete(isMinimumProfileCompleteFromUserDoc(d));
        setMyHasAnyApplicationFromUserDoc(hasAnyMatchmakingProfileInUserDoc(d));
        setMyHasAnyPhotoFromUserDoc(hasAnyMatchmakingPhotoInUserDoc(d));
      },
      () => {
        setMyMembership({ active: false });
        setMyProfileComplete(true);
        setMyHasAnyApplicationFromUserDoc(null);
        setMyHasAnyPhotoFromUserDoc(null);
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

  const requireProfile = () => {
    goToProfileCompletionTarget();
  };

  // En az 1 fotoğraf + en az 1 başvuru var mı? (pre-match gate için)
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
        let count = 0;
        let hasPhoto = false;
        snap.forEach((d) => {
          const data = typeof d?.data === 'function' ? d.data() || {} : d?.data || {};
          if (hasAnyStoredMatchmakingPhotoInApplicationDoc(data)) hasPhoto = true;
          if (data && typeof data === 'object' && !data?.details?.autoBootstrap && String(data?.source || '').trim().toLowerCase() !== 'auto_stub') {
            count += 1;
          }
        });
        return { count, hasPhoto };
      } catch {
        return null;
      }
    };

    const qApps = query(collection(db, 'matchmakingApplications'), where('userId', '==', uid), limit(10));

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(qApps);
        if (cancelled) return;
        const parsed = parseAppsSnap(snap);
        if (!parsed) return;
        setMyHasAnyApplication(parsed.count > 0);
        setMyHasAnyPhoto(!!parsed.hasPhoto);
      } catch {
        // ignore
      }
    })();

    const unsub = onSnapshot(
      qApps,
      (snap) => {
        const parsed = parseAppsSnap(snap);
        if (!parsed) return;
        setMyHasAnyApplication(parsed.count > 0);
        setMyHasAnyPhoto(!!parsed.hasPhoto);
      },
      () => {
        setMyHasAnyApplication(null);
        setMyHasAnyPhoto(null);
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

  const openCompleteProfileGate = () => {
    goToProfileCompletionTarget();
  };

  const openDeferredPhotoGate = () => {
    try {
      navigate('/profilim', { replace: false, state: { openPhotoManager: true, profileGate: 'deferred_photo_required' } });
    } catch {
      // noop
    }
  };

  const openDeferredWhatsappGate = () => {
    try {
      navigate('/profilim', { replace: false, state: { profileGate: 'deferred_whatsapp_required' } });
    } catch {
      // noop
    }
  };

  const dismissCompleteProfileGate = () => setCompleteProfileGateOpen(false);

  const goToProfileCompletionTarget = () => {
    if (profileGateMode === 'photo') {
      try {
        navigate('/profilim', { replace: false, state: { openPhotoManager: true, profileGate: 'photo_required' } });
      } catch {
        // noop
      }
      return;
    }

    try {
      navigate('/evlilik/eslestirme-basvuru?w=1', {
        replace: false,
        state: { returnTo: `${location.pathname || '/app/matches'}${location.search || ''}` },
      });
    } catch {
      // noop
    }
  };

  const startCompleteProfileGate = () => {
    dismissCompleteProfileGate();
    goToProfileCompletionTarget();
  };

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
      const msg = String(e?.message || '').trim() || 'membership_activate_failed';
      setPaywallNotice(translateStudioApiError(t, msg) || msg);
    } finally {
      activateMembershipRef.current = false;
    }
  }, [effectiveUid, t]);

  useEffect(() => {
    if (!paywallNotice) {
      paywallAutoActivateRef.current = false;
      return;
    }
    if (paywallAutoActivateRef.current) return;
    paywallAutoActivateRef.current = true;
    void activateFreeMembershipNow();
  }, [activateFreeMembershipNow, paywallNotice]);

  const buildMatchesQuery = ({ uid, preferUpdatedAt }) => {
    const base = [collection(db, 'matchmakingMatches'), where('userIds', 'array-contains', uid)];
    if (preferUpdatedAt) {
      return query(...base, orderBy('updatedAt', 'desc'), limit(25));
    }
    return query(...base, orderBy('createdAt', 'desc'), limit(100));
  };

  // Gelen beğeniler (inbox)
  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) {
      setInboxLikes([]);
      return;
    }

    const qInbox = query(
      collection(db, 'matchmakingUsers', uid, 'inboxLikes'),
      orderBy('createdAtMs', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(
      qInbox,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        // Sadece bekleyen + bana gelen beğeniler görünmeli; ayrıca canlı kaydı kalmamış
        // göndericilerin eski snapshot'ları gösterilmemeli.
        const filtered = filterInboxLikes(items, uid, resetAtMs);
        setInboxLikes(filtered);
        setInboxLoad((s) => (s.lastSource === 'api' ? s : { ...s, error: '', lastSource: 'firestore' }));
      },
      (e) => {
        setInboxLikes([]);
        const code = String(e?.code || '').trim();
        const msg = String(e?.message || '').trim();
        const errText = code || msg || 'unknown_error';
        const hint =
          code === 'permission-denied'
            ? t('studio.matches.inboxSync.permissionDenied', { projectId: clientProjectId || '?' })
            : t('studio.matches.inboxSync.listenFailed', {
                kind: t('studio.matches.inboxSync.kinds.likes'),
                error: errText,
              });
        setInboxLoad((s) => ({ ...s, error: hint, lastSource: s.lastSource || 'firestore' }));
        refreshInboxViaApi();
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [clientProjectId, effectiveUid, refreshInboxViaApi, resetAtMs, t]);

  // Gelen ön eşleşme istekleri
  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) {
      setInboxAccess([]);
      return;
    }

    const qInbox = query(
      collection(db, 'matchmakingUsers', uid, 'inboxPreMatchRequests'),
      orderBy('createdAtMs', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      qInbox,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxAccess((current) => mergeInboxAccessItems(items, current));
        setInboxLoad((s) => (s.lastSource === 'api' ? s : { ...s, error: '', lastSource: 'firestore' }));
      },
      (e) => {
        setInboxAccess([]);
        const code = String(e?.code || '').trim();
        const msg = String(e?.message || '').trim();
        const errText = code || msg || 'unknown_error';
        const hint =
          code === 'permission-denied'
            ? t('studio.matches.inboxSync.permissionDenied', { projectId: clientProjectId || '?' })
            : t('studio.matches.inboxSync.listenFailed', {
                kind: t('studio.matches.inboxSync.kinds.requests'),
                error: errText,
              });
        setInboxLoad((s) => ({ ...s, error: hint, lastSource: s.lastSource || 'firestore' }));
        refreshInboxViaApi();
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [clientProjectId, effectiveUid, refreshInboxViaApi, t]);

  // Gelen profil erişim istekleri
  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) {
      setInboxProfileAccess([]);
      return;
    }

    const qInbox = query(
      collection(db, 'matchmakingUsers', uid, 'inboxAccessRequests'),
      orderBy('createdAtMs', 'desc'),
      limit(25)
    );

    const unsub = onSnapshot(
      qInbox,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxProfileAccess(items);
        setInboxLoad((s) => (s.lastSource === 'api' ? s : { ...s, error: '', lastSource: 'firestore' }));
      },
      (e) => {
        setInboxProfileAccess([]);
        const code = String(e?.code || '').trim();
        const msg = String(e?.message || '').trim();
        const errText = code || msg || 'unknown_error';
        const hint =
          code === 'permission-denied'
            ? t('studio.matches.inboxSync.permissionDenied', { projectId: clientProjectId || '?' })
            : t('studio.matches.inboxSync.listenFailed', {
                kind: t('studio.matches.inboxSync.kinds.profileAccess'),
                error: errText,
              });
        setInboxLoad((s) => ({ ...s, error: hint, lastSource: s.lastSource || 'firestore' }));
        refreshInboxViaApi();
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [clientProjectId, effectiveUid, refreshInboxViaApi, t]);

  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) {
      setMyPeople([]);
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
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setMyPeople(items);
      },
      () => setMyPeople([])
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [effectiveUid]);

  // Gelen direkt mesajlar (inbox)
  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) {
      setInboxMessages([]);
      return;
    }

    const qInbox = query(
      collection(db, 'matchmakingUsers', uid, 'inboxMessages'),
      orderBy('createdAtMs', 'desc'),
      limit(40)
    );

    const unsub = onSnapshot(
      qInbox,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setInboxMessages(items);
        setInboxLoad((s) => (s.lastSource === 'api' ? s : { ...s, error: '', lastSource: 'firestore' }));
      },
      (e) => {
        setInboxMessages([]);
        const code = String(e?.code || '').trim();
        const msg = String(e?.message || '').trim();
        const errText = code || msg || 'unknown_error';
        const hint =
          code === 'permission-denied'
            ? t('studio.matches.inboxSync.permissionDenied', { projectId: clientProjectId || '?' })
            : t('studio.matches.inboxSync.listenFailed', {
                kind: t('studio.matches.inboxSync.kinds.messages'),
                error: errText,
              });
        setInboxLoad((s) => ({ ...s, error: hint, lastSource: s.lastSource || 'firestore' }));
        refreshInboxViaApi();
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [clientProjectId, effectiveUid, refreshInboxViaApi, t]);

  const respondInboxLike = async ({ matchId, decision }) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const uid = effectiveUid;
    const mid = String(matchId || '').trim();
    const d = String(decision || '').trim();
    if (!uid || !mid || (d !== 'accept' && d !== 'reject')) return;
    if (inboxAction.loadingId) return;

    setInboxAction({ loadingId: mid, error: '' });
    try {
      await authFetch('/api/matchmaking-decision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid, decision: d }),
      });
      setInboxAction({ loadingId: '', error: '' });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      if (msg === 'membership_required') requirePaid();
      if (msg === 'photo_review_required') {
        navigate('/profilim', { replace: false, state: { openPhotoManager: true, profileGate: 'photo_review_required' } });
      } else if (msg === 'deferred_photo_required') {
        openDeferredPhotoGate();
      } else if (msg === 'deferred_whatsapp_required') {
        openDeferredWhatsappGate();
      } else if (msg === 'profile_incomplete' || msg === 'application_not_found' || msg === 'application_required' || msg === 'photo_required') {
        requireProfile();
      }
      setInboxAction({ loadingId: '', error: translateStudioApiError(t, msg) || msg || 'action_failed' });
    }
  };

  const respondAccessRequest = async ({ fromUid, decision, type }) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const uid = effectiveUid;
    const from = String(fromUid || '').trim();
    const d = String(decision || '').trim();
    if (!uid || !from || (d !== 'approve' && d !== 'reject')) return;
    if (accessAction.loadingId) return;

    const reqType = String(type || '').trim();
    const endpoint =
      reqType === 'profile_access'
        ? '/api/matchmaking-profile-access-respond'
        : reqType === 'photo_access'
          ? '/api/matchmaking-photo-access-respond'
          : '/api/matchmaking-pre-match-respond';
    const loadingKey = `${reqType || 'pre_match'}:${from}`;

    const isPreMatch = endpoint === '/api/matchmaking-pre-match-respond';

    setAccessAction({ loadingId: loadingKey, error: '' });
    try {
      await authFetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fromUid: from, decision: d }),
      });
      setAccessAction({ loadingId: '', error: '' });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      if (msg === 'membership_required') requirePaid();
      if (msg === 'photo_review_required') {
        navigate('/profilim', { replace: false, state: { openPhotoManager: true, profileGate: 'photo_review_required' } });
      } else if (msg === 'deferred_photo_required') {
        openDeferredPhotoGate();
      } else if (msg === 'deferred_whatsapp_required') {
        openDeferredWhatsappGate();
      } else if (msg === 'profile_incomplete' || msg === 'application_not_found' || msg === 'application_required' || msg === 'photo_required') {
        if (isPreMatch) openCompleteProfileGate();
        else requireProfile();
      }
      setAccessAction({ loadingId: '', error: translateStudioApiError(t, msg) || msg || 'action_failed' });
    }
  };

  useEffect(() => {
    const uid = effectiveUid;
    const mid = String(shortModal?.matchId || '').trim();
    if (!uid || !shortModal?.open || !mid) {
      setShortMatch(null);
      setShortMessages([]);
      setShortLoading(false);
      return;
    }

    setShortLoading(true);

    const matchRef = doc(db, 'matchmakingMatches', mid);
    const unsubMatch = onSnapshot(
      matchRef,
      (snap) => {
        setShortMatch(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      },
      () => setShortMatch(null)
    );

    const q = query(collection(db, 'matchmakingMatches', mid, 'messages'), orderBy('createdAt', 'asc'), limit(60));
    const unsubMsgs = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setShortMessages(items);
        setShortLoading(false);
      },
      () => {
        setShortMessages([]);
        setShortLoading(false);
      }
    );

    return () => {
      try {
        unsubMatch();
      } catch {
        // noop
      }
      try {
        unsubMsgs();
      } catch {
        // noop
      }
    };
  }, [effectiveUid, shortModal?.matchId, shortModal?.open]);

  useEffect(() => {
    if (!shortModal?.open) return;
    try {
      const el = shortScrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch {
      // noop
    }
  }, [shortModal?.open, shortMessages.length]);

  useEffect(() => {
    if (!shortModal?.open) return;
    if (!Array.isArray(shortMessages) || shortMessages.length === 0) return;
    const timer = setInterval(() => setShortNowMs(Date.now()), 30000);
    return () => {
      try {
        clearInterval(timer);
      } catch {
        // noop
      }
    };
  }, [shortMessages, shortModal?.open]);

  const shortLimitInfo = useMemo(() => {
    const uid = effectiveUid;
    const m = shortMatch && typeof shortMatch === 'object' ? shortMatch : null;
    const status = String(m?.status || '').trim();
    const limit = 5;

    if (!uid || !m) return { used: 0, remaining: limit, limit };

    if (status === 'proposed') {
      const counts = m?.proposedChatCountByUid && typeof m.proposedChatCountByUid === 'object' ? m.proposedChatCountByUid : {};
      const used = typeof counts?.[uid] === 'number' ? counts[uid] : 0;
      const u = Number.isFinite(used) && used > 0 ? used : 0;
      return { used: u, remaining: Math.max(0, limit - u), limit };
    }

    const counts = m?.limitedChatCountByUid && typeof m.limitedChatCountByUid === 'object' ? m.limitedChatCountByUid : {};
    const used = typeof counts?.[uid] === 'number' ? counts[uid] : 0;
    const u = Number.isFinite(used) && used > 0 ? used : 0;
    return { used: u, remaining: Math.max(0, limit - u), limit };
  }, [effectiveUid, shortMatch]);

  const shortOther = useMemo(() => {
    const uid = effectiveUid;
    const m = shortMatch && typeof shortMatch === 'object' ? shortMatch : null;
    if (!uid || !m) return null;

    const aId = typeof m?.aUserId === 'string' ? m.aUserId.trim() : '';
    const bId = typeof m?.bUserId === 'string' ? m.bUserId.trim() : '';
    const mySide = uid && aId === uid ? 'a' : uid && bId === uid ? 'b' : '';
    if (!mySide) return null;
    const otherSide = mySide === 'a' ? 'b' : 'a';

    const p = m?.profiles?.[otherSide] && typeof m.profiles[otherSide] === 'object' ? m.profiles[otherSide] : null;
    return p;
  }, [effectiveUid, shortMatch]);

  const shortOtherName = useMemo(() => {
    const n =
      String(shortOther?.username || '').trim() ||
      String(shortModal?.displayName || '').trim();
    return n || t('studio.common.match');
  }, [shortModal?.displayName, shortOther, t]);

  const shortOtherPhoto = useMemo(() => {
    const urls = Array.isArray(shortOther?.photoUrls) ? shortOther.photoUrls : [];
    const first = urls.length ? String(urls[0] || '').trim() : '';
    return first;
  }, [shortOther]);

  useEffect(() => {
    const uid = effectiveUid;
    if (!uid) return;

    setLoading(true);
    setError('');

    let unsub = null;
    let didFallback = false;

    const startListen = ({ preferUpdatedAt }) => {
      const q = buildMatchesQuery({ uid, preferUpdatedAt });
      unsub = onSnapshot(
        q,
        (snap) => {
          const items = [];
          snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
          setMatches(items);
          setLoading(false);
        },
        (e) => {
          // Eğer updatedAt index'i yoksa (failed-precondition) createdAt ile tekrar dene.
          const code = String(e?.code || '').trim();
          if (!didFallback && preferUpdatedAt && code === 'failed-precondition') {
            didFallback = true;
            try {
              unsub?.();
            } catch {
              // noop
            }
            startListen({ preferUpdatedAt: false });
            return;
          }

          console.error('StudioMatches load failed', e);
          setError(String(e?.message || '').trim() || code || 'unknown');
          setMatches([]);
          setLoading(false);
        }
      );
    };

    startListen({ preferUpdatedAt: true });

    return () => {
      try {
        unsub?.();
      } catch {
        // noop
      }
    };
  }, [effectiveUid]);

  const visibleMatches = useMemo(() => {
    const list = Array.isArray(matches) ? matches : [];
    return list
      .filter((m) => {
        const st = String(m?.status || '').trim();
        return st !== 'cancelled';
      })
      .filter((m) => {
        if (!resetAtMs) return true;
        const created =
          (typeof m?.createdAtMs === 'number' && Number.isFinite(m.createdAtMs) ? m.createdAtMs : 0) ||
          asMs(m?.createdAt) ||
          0;
        // Soft reset: reset öncesi match'leri yok say.
        if (created > 0 && created < resetAtMs) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        const aMs = getMatchActivityMs(a);
        const bMs = getMatchActivityMs(b);
        if (bMs !== aMs) return bMs - aMs;
        return String(a?.id || '').localeCompare(String(b?.id || ''));
      });
  }, [matches, resetAtMs]);

  const visibleMatchIdSet = useMemo(() => {
    const set = new Set();
    (Array.isArray(visibleMatches) ? visibleMatches : []).forEach((m) => {
      const id = String(m?.id || '').trim();
      if (id) set.add(id);
    });
    return set;
  }, [visibleMatches]);

  const matchOtherUidSet = useMemo(() => {
    const set = new Set();
    (Array.isArray(visibleMatches) ? visibleMatches : []).forEach((match) => {
      const otherUid = getOtherUidFromMatch(match, effectiveUid);
      if (otherUid) set.add(otherUid);
    });
    return set;
  }, [effectiveUid, visibleMatches]);

  const visiblePeople = useMemo(() => {
    const list = Array.isArray(myPeople) ? myPeople : [];
    return list
      .filter((item) => safeStr(item?.type) === 'people_list')
      .filter((item) => {
        const status = safeStr(item?.status);
        return status !== 'rejected' && status !== 'cancelled';
      })
      .filter((item) => {
        const updatedAtMs = typeof item?.updatedAtMs === 'number' && Number.isFinite(item.updatedAtMs) ? item.updatedAtMs : 0;
        if (resetAtMs > 0 && updatedAtMs > 0 && updatedAtMs < resetAtMs) return false;
        return true;
      })
      .filter((item) => {
        const targetUid = safeStr(item?.toUid || item?.targetUid);
        if (!targetUid) return false;
        if (matchOtherUidSet.has(targetUid)) return false;
        const targetProfile = item?.targetProfile && typeof item.targetProfile === 'object' ? item.targetProfile : null;
        return !!targetProfile;
      })
      .slice()
      .sort((a, b) => {
        const aMs = typeof a?.updatedAtMs === 'number' && Number.isFinite(a.updatedAtMs) ? a.updatedAtMs : 0;
        const bMs = typeof b?.updatedAtMs === 'number' && Number.isFinite(b.updatedAtMs) ? b.updatedAtMs : 0;
        if (bMs !== aMs) return bMs - aMs;
        return safeStr(a?.id).localeCompare(safeStr(b?.id));
      });
  }, [matchOtherUidSet, myPeople, resetAtMs]);

  const inboxLikesBanner = useMemo(() => {
    const list = Array.isArray(inboxLikes) ? inboxLikes : [];
    // Match listesinde zaten görünen like'lar için üst banner göstermeyelim.
    return list.filter((it) => {
      const mid = String(it?.matchId || it?.id || '').trim();
      if (!mid) return false;
      return !visibleMatchIdSet.has(mid);
    });
  }, [inboxLikes, visibleMatchIdSet]);

  const pendingAccessRequests = useMemo(() => {
    const list1 = Array.isArray(inboxAccess) ? inboxAccess : [];
    const list2 = Array.isArray(inboxProfileAccess) ? inboxProfileAccess : [];
    const merged = [...list1, ...list2];
    return merged.filter((x) => {
      if (String(x?.type || '').trim() === 'people_list') return false;
      if (String(x?.status || '').trim() !== 'pending') return false;
      const createdAtMs = typeof x?.createdAtMs === 'number' && Number.isFinite(x.createdAtMs) ? x.createdAtMs : 0;
      if (resetAtMs > 0 && createdAtMs > 0 && createdAtMs < resetAtMs) return false;
      return true;
    });
  }, [inboxAccess, inboxProfileAccess, resetAtMs]);

  const unreadMessageCount = useMemo(() => {
    const list = Array.isArray(inboxMessages) ? inboxMessages : [];
    return list.filter((x) => {
      const msg = String(x?.text || '').trim();
      if (!msg) return false;
      const readMs = typeof x?.readAtMs === 'number' && Number.isFinite(x.readAtMs) ? x.readAtMs : 0;
      return readMs <= 0;
    }).length;
  }, [inboxMessages]);

  const modalAbout = useAutoLocalizedProfileText(personProfileModal.profile, 'about', i18n.language);
  const modalExpectations = useAutoLocalizedProfileText(personProfileModal.profile, 'expectations', i18n.language);

  const closePersonProfileModal = () => {
    setPersonProfileModal({ open: false, loading: false, error: '', profile: null, displayName: '' });
  };

  useEffect(() => {
    setPersonProfilePhotoIndex(0);
  }, [personProfileModal.open, personProfileModal.profile?.uid]);

  const markInboxMessageRead = async ({ requestId, fromUid }) => {
    // accessRequests mesajı (opsiyonel)
    if (requestId || fromUid) {
      try {
        await authFetch('/api/matchmaking-inbox-mark-read', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ requestId, fromUid }),
        });
      } catch {
        // best-effort
      }
      return;
    }
  };

  const markDirectMessageRead = async ({ messageId }) => {
    const id = String(messageId || '').trim();
    if (!id) return;
    try {
      await authFetch('/api/matchmaking-inbox-message-mark-read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messageId: id }),
      });
    } catch {
      // best-effort
    }
  };

  const requirePaid = () => {
    setPaywallNotice(t('studio.paywall.upgradeToInteract'));
    try {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const openPersonMessage = async (person) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }
    const targetUid = safeStr(person?.toUid || person?.targetUid || person?.uid);
    const profile = person?.targetProfile && typeof person.targetProfile === 'object' ? person.targetProfile : {};
    if (!targetUid) return;

    if (OPEN_CHAT_MODEL) {
      setPeopleAction({ loadingUid: targetUid, kind: 'message', error: '', notice: '' });
      try {
        const ensured = await authFetch('/api/matchmaking-people-match-ensure', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ targetUid }),
        });
        const matchId = safeStr(ensured?.matchId);
        if (!matchId) throw new Error('match_ensure_failed');
        setPeopleAction({ loadingUid: '', kind: '', error: '', notice: '' });
        navigate(`/app/chat/${matchId}`);
      } catch (e) {
        const msg = String(e?.message || '').trim();
        if (msg === 'membership_required' || msg === 'free_active_membership_required') requirePaid();
        if (msg === 'photo_review_required') {
          navigate('/profilim', { replace: false, state: { openPhotoManager: true, profileGate: 'photo_review_required' } });
        } else if (msg === 'deferred_photo_required') {
          openDeferredPhotoGate();
        } else if (msg === 'deferred_whatsapp_required') {
          openDeferredWhatsappGate();
        } else if (msg === 'profile_incomplete' || msg === 'application_not_found' || msg === 'application_required' || msg === 'photo_required') {
          openCompleteProfileGate();
        }
        setPeopleAction({ loadingUid: '', kind: '', error: translateStudioApiError(t, msg) || msg || 'action_failed', notice: '' });
      }
      return;
    }

    setPersonMessageModal({
      open: true,
      targetUid,
      displayName: safeStr(profile?.username) || t('studio.common.profile'),
      photoUrl: safeStr(profile?.photoUrl || (Array.isArray(profile?.photoUrls) ? profile.photoUrls[0] : '')),
    });
    setPersonMessageText('');
    setPersonMessageState({ loading: false, error: '' });
  };

  const sendPersonMessage = async (e) => {
    e?.preventDefault?.();
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const targetUid = safeStr(personMessageModal?.targetUid);
    const text = safeStr(personMessageText);
    if (!targetUid || !text || personMessageState.loading) return;

    setPersonMessageState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-inbox-message-send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetUid, text }),
      });
      setPersonMessageState({ loading: false, error: '' });
      setPersonMessageModal({ open: false, targetUid: '', displayName: '', photoUrl: '' });
      setPersonMessageText('');
      setPeopleAction({ loadingUid: '', kind: '', error: '', notice: t('studio.matches.people.messageSent') });
    } catch (e2) {
      const msg = String(e2?.message || '').trim();
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
      setPersonMessageState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'send_failed' });
    }
  };

  const fetchAndOpenPersonProfile = async ({ targetUid, displayName }) => {
    setPersonProfileModal({ open: true, loading: true, error: '', profile: null, displayName });
    try {
      const data = await authFetch('/api/matchmaking-profile-view', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetUid }),
      });
      setPersonProfileModal({ open: true, loading: false, error: '', profile: data?.profile || null, displayName });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setPersonProfileModal({ open: true, loading: false, error: translateStudioApiError(t, msg) || msg || 'load_failed', profile: null, displayName });
    }
  };

  const inspectPerson = async (person) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const targetUid = safeStr(person?.toUid || person?.targetUid || person?.uid);
    const profile = person?.targetProfile && typeof person.targetProfile === 'object' ? person.targetProfile : {};
    const displayName = safeStr(profile?.username) || t('studio.common.profile');
    if (!targetUid || peopleAction.loadingUid) return;

    setPeopleAction({ loadingUid: targetUid, kind: 'profile', error: '', notice: '' });
    try {
      await fetchAndOpenPersonProfile({ targetUid, displayName });
      setPeopleAction({ loadingUid: '', kind: '', error: '', notice: '' });
    } catch (e) {
      const msg = String(e?.message || '').trim();
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
      setPeopleAction({ loadingUid: '', kind: '', error: translateStudioApiError(t, msg) || msg || 'load_failed', notice: '' });
    }
  };

  const openPersonPhotos = ({ images, index = 0, title = '' }) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const photoList = Array.isArray(images)
      ? images.map((item) => safeStr(item)).filter(Boolean)
      : [];
    if (!photoList.length) return;

    const safeIndex = Number.isFinite(index) ? Math.max(0, Math.min(index, photoList.length - 1)) : 0;
    setLightbox({ open: true, images: photoList, index: safeIndex, title: safeStr(title) });
  };

  const openInboxPersonProfile = async (item) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const targetUid = safeStr(item?.fromUid || item?.targetUid || item?.uid);
    const profile = item?.fromProfile && typeof item.fromProfile === 'object' ? item.fromProfile : {};
    const displayName = safeStr(profile?.username) || t('studio.common.profile');
    if (!targetUid) return;
    await fetchAndOpenPersonProfile({ targetUid, displayName });
  };

  const likePerson = async (person) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const targetUid = safeStr(person?.toUid || person?.targetUid || person?.uid);
    if (!targetUid || peopleAction.loadingUid) return;

    setPeopleAction({ loadingUid: targetUid, kind: 'like', error: '', notice: '' });
    try {
      const ensured = await authFetch('/api/matchmaking-people-match-ensure', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetUid }),
      });
      const matchId = safeStr(ensured?.matchId);
      if (!matchId) throw new Error('match_ensure_failed');

      await authFetch('/api/matchmaking-decision', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId, decision: 'accept' }),
      });

      setPeopleAction({ loadingUid: '', kind: '', error: '', notice: '' });
      navigate(`/app/match/${matchId}`);
    } catch (e) {
      const msg = String(e?.message || '').trim();
      if (msg === 'membership_required' || msg === 'free_active_membership_required') requirePaid();
      if (msg === 'photo_review_required') {
        navigate('/profilim', { replace: false, state: { openPhotoManager: true, profileGate: 'photo_review_required' } });
      } else if (msg === 'deferred_photo_required') {
        openDeferredPhotoGate();
      } else if (msg === 'deferred_whatsapp_required') {
        openDeferredWhatsappGate();
      } else if (msg === 'profile_incomplete' || msg === 'application_not_found' || msg === 'application_required' || msg === 'photo_required') {
        openCompleteProfileGate();
      }
      setPeopleAction({ loadingUid: '', kind: '', error: translateStudioApiError(t, msg) || msg || 'action_failed', notice: '' });
    }
  };

  const refreshPresence = useCallback(async () => {
    if (!presenceUiEnabled) return;
    if (isPreview) return;
    const uid = effectiveUid;
    if (!uid) return;

    const otherUids = [];
    const seen = new Set();
    const registerUid = (candidateUid) => {
      const other = String(candidateUid || '').trim();
      if (!other || other === uid) return;
      if (seen.has(other)) return;
      seen.add(other);
      otherUids.push(other);
    };

    const list = Array.isArray(matches) ? matches : [];
    for (const m of list) {
      const aId = String(m?.aUserId || '').trim();
      const bId = String(m?.bUserId || '').trim();
      const other = aId === uid ? bId : bId === uid ? aId : '';
      registerUid(other);
      if (otherUids.length >= 50) break;
    }

    if (otherUids.length < 50) {
      const people = Array.isArray(visiblePeople) ? visiblePeople : [];
      for (const person of people) {
        const targetUid = safeStr(person?.toUid || person?.targetUid || person?.uid);
        registerUid(targetUid);
        if (otherUids.length >= 50) break;
      }
    }

    if (!otherUids.length) {
      setPresenceByUid({});
      return;
    }

    try {
      const data = await authFetch('/api/matchmaking-presence-batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uids: otherUids }),
      });
      const m = data?.presenceByUid && typeof data.presenceByUid === 'object' ? data.presenceByUid : {};
      setPresenceByUid(m);
    } catch {
      // best-effort
    }
  }, [effectiveUid, isPreview, matches, presenceUiEnabled, visiblePeople]);

  useEffect(() => {
    if (!presenceUiEnabled) return;

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
  }, [presenceUiEnabled, refreshPresence]);

  const openShort = async ({ matchId, displayName }) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const uid = effectiveUid;
    const mid = String(matchId || '').trim();
    if (!uid || !mid) return;

    if (OPEN_CHAT_MODEL) {
      navigate(`/app/chat/${mid}`);
      return;
    }

    setShortModal({ open: true, matchId: mid, displayName: String(displayName || '').trim() });
    setShortText('');
    setShortState({ loading: false, error: '' });

    try {
      await authFetch('/api/matchmaking-chat-mark-read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid }),
      });
    } catch {
      // noop
    }
  };

  const sendShort = async (e) => {
    e?.preventDefault?.();
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const uid = effectiveUid;
    const mid = String(shortModal?.matchId || '').trim();
    const text = String(shortText || '').trim();

    if (!uid || !mid || !text) return;

    // Ücretsiz kullanıcılar kısa mesaj gönderemez.
    if (!myMembership?.active) {
      requirePaid();
      setShortState({ loading: false, error: t('studio.paywall.upgradeToReply') });
      return;
    }

    if (shortState.loading) return;
    if (shortLimitInfo.remaining <= 0) {
      setShortState({ loading: false, error: t('studio.errors.shortLimit') });
      return;
    }

    setShortState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-chat-send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid, text }),
      });
      setShortText('');
      setShortState({ loading: false, error: '' });
    } catch (err) {
      const msg = String(err?.message || '').trim();
      if (msg === 'short_message_limit' || msg === 'short_message_daily_limit' || msg === 'chat_limit_reached') {
        setShortState({ loading: false, error: t('studio.errors.shortLimit') });
      } else {
        setShortState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'send_failed' });
      }
    }
  };

  const translateMessage = async ({ matchId, messageId }) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const uid = effectiveUid;
    const mid = String(matchId || '').trim();
    const msgId = String(messageId || '').trim();
    if (!uid || !mid || !msgId) return;
    if (translateState.loadingId) return;

    setTranslateState({ loadingId: msgId, error: '' });
    try {
      await authFetch('/api/matchmaking-chat-translate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: mid, messageId: msgId, targetLang }),
      });
      setTranslateState({ loadingId: '', error: '' });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setTranslateState({ loadingId: '', error: translateStudioApiError(t, msg) || msg || 'translate_failed' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-0">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {inboxLoad.error ? (
          <div className="mb-6 mx-auto max-w-5xl rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{t('studio.matches.inboxSync.title')}</p>
              <button
                type="button"
                onClick={refreshInboxViaApi}
                disabled={inboxLoad.loading}
                className="app-btn app-btn-danger disabled:opacity-60"
              >
                {inboxLoad.loading ? t('studio.matches.inboxSync.refreshing') : t('studio.matches.inboxSync.refresh')}
              </button>
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap">{inboxLoad.error}</p>
            <p className="mt-2 text-xs text-rose-700">
              {t('studio.matches.inboxSync.note')}
            </p>
          </div>
        ) : null}

        {/* İstekler üst banner yerine modal içinde gösterilir. */}

        {inboxLikesBanner.length ? (
          <div className="mb-6 mx-auto max-w-5xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {t('studio.inbox.likesTitle', { count: inboxLikesBanner.length })}
              </p>
              {inboxAction.error ? (
                <p className="text-sm text-rose-700">{inboxAction.error}</p>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {inboxLikesBanner.map((it) => {
                const p = it?.fromProfile && typeof it.fromProfile === 'object' ? it.fromProfile : null;
                const name = String(p?.username || '').trim() || t('studio.common.match');
                const age = typeof p?.age === 'number' ? `${p.age} ${t('studio.common.ageSuffix')}` : '';
                const photo = Array.isArray(p?.photoUrls) && p.photoUrls.length ? String(p.photoUrls[0] || '').trim() : '';
                const mid = String(it?.matchId || it?.id || '').trim();
                const acting = inboxAction.loadingId && inboxAction.loadingId === mid;

                return (
                  <div key={it.id} className="rounded-lg border border-amber-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      {photo ? (
                        <img src={photo} alt={name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{name}{age ? ` • ${age}` : ''}</p>
                        <p className="text-xs text-slate-600">{t('studio.inbox.likeReceived')}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {mid ? (
                        <Link
                          to={`/app/match/${mid}`}
                          className="app-btn app-btn-outline"
                        >
                          {t('studio.inbox.viewProfile')}
                        </Link>
                      ) : null}

                      <button
                        type="button"
                        disabled={acting || !mid}
                        onClick={() => respondInboxLike({ matchId: mid, decision: 'accept' })}
                        className="app-btn app-btn-primary disabled:opacity-60"
                      >
                        {acting ? t('studio.common.processing') : t('studio.inbox.accept')}
                      </button>

                      <button
                        type="button"
                        disabled={acting || !mid}
                        onClick={() => respondInboxLike({ matchId: mid, decision: 'reject' })}
                        className="app-btn app-btn-danger disabled:opacity-60"
                      >
                        {t('studio.inbox.reject')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-700">{t('studio.matches.title')}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {visibleMatches.length || visiblePeople.length
                ? t('studio.matches.showingCount', { count: visibleMatches.length + visiblePeople.length })
                : t('studio.matches.emptyHint')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => setInboxModal({ open: true, mode: 'requests' })}
              className="app-btn hidden w-full sm:inline-flex sm:w-auto"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <HelpCircle className="h-4 w-4" />
                <span>{t('studio.inbox.modalTitleRequests')}</span>
                {pendingAccessRequests.length ? <span className="app-badge">{pendingAccessRequests.length}</span> : null}
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/app/messages')}
              className="app-btn app-btn-primary hidden w-full sm:inline-flex sm:w-auto"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>{t('studio.inbox.modalTitleMessages')}</span>
                {unreadMessageCount ? <span className="app-badge">{unreadMessageCount}</span> : null}
              </span>
            </button>

            <Link
              to="/profilim"
              className="app-btn app-btn-danger w-full sm:w-auto"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <User className="h-4 w-4" />
                <span>{t('studio.matches.backToProfile')}</span>
              </span>
            </Link>

            <Link
              to="/profilim?panel=referral"
              className="app-btn app-btn-outline w-full sm:w-auto"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Share2 className="h-4 w-4" />
                <span>{t('studio.referral.title')}</span>
              </span>
            </Link>
            <Link
              to="/app/pool"
              data-tutorial-id="matches-go-pool"
              className="app-btn app-btn-orange hidden w-full sm:inline-flex sm:w-auto"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Compass className="h-4 w-4" />
                  <span>{t('studio.pool.title')}</span>
              </span>
            </Link>
          </div>
        </div>

        <StudioInviteFriendsCard
          className="mb-6 mx-auto max-w-5xl"
          compact
          onClick={() => {
            if (isPreview) {
              openPreviewGate({ reason: t('previewGate.body') });
              return;
            }
            navigate('/profilim?panel=referral');
          }}
        />

        <YouTubeVisitCard className="mb-6 mx-auto max-w-5xl" compact />

        <StudioInboxModal
          open={!!inboxModal?.open}
          onClose={() => setInboxModal({ open: false, mode: 'requests' })}
          title={inboxModal?.mode === 'messages' ? t('studio.inbox.modalTitleMessages') : t('studio.inbox.modalTitleRequests')}
          items={
            inboxModal?.mode === 'messages'
              ? inboxMessages
              : [...(Array.isArray(inboxAccess) ? inboxAccess : []), ...(Array.isArray(inboxProfileAccess) ? inboxProfileAccess : [])]
          }
          mode={inboxModal?.mode}
          onMarkRead={inboxModal?.mode === 'messages' ? markDirectMessageRead : markInboxMessageRead}
          onApprove={inboxModal?.mode === 'messages' ? null : ({ fromUid, type }) => respondAccessRequest({ fromUid, decision: 'approve', type })}
          onReject={inboxModal?.mode === 'messages' ? null : ({ fromUid, type }) => respondAccessRequest({ fromUid, decision: 'reject', type })}
          onOpenProfile={openInboxPersonProfile}
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

        {paywallNotice ? (
          <div className="mb-4 mx-auto max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
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
          <div role="alert" className="mb-4 mx-auto max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
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

        {profileGateNotice ? (
          <div className="mb-4 mx-auto max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
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

        {peopleAction.notice ? (
          <div className="mb-4 mx-auto max-w-4xl rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{peopleAction.notice}</p>
              <button
                type="button"
                onClick={() => setPeopleAction((state) => ({ ...state, notice: '' }))}
                className="rounded-md px-2 py-1 text-sm font-semibold text-emerald-900/70 hover:bg-emerald-100"
              >
                {t('studio.common.close')}
              </button>
            </div>
          </div>
        ) : null}

        {peopleAction.error ? (
          <div className="mb-4 mx-auto max-w-4xl rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
            {peopleAction.error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-center text-slate-600">{t('studio.matches.loading')}</p>
        ) : error ? (
          <div className="mx-auto max-w-xl rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
            {t('studio.matches.loadFailed', { error })}
          </div>
        ) : visibleMatches.length === 0 && visiblePeople.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-slate-800 font-semibold">{t('studio.matches.noneTitle')}</p>
            <p className="mt-2 text-sm text-slate-600">
              {t('studio.matches.noneBody')}
            </p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
              <p className="font-semibold text-slate-900">{t('studio.waitingNote.title')}</p>
              <p className="mt-1 text-sm text-slate-700">
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
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Link
                to="/app/pool"
                className="app-btn app-btn-orange"
              >
                {t('studio.pool.title')}
              </Link>
              <Link
                to="/profilim"
                className="app-btn app-btn-outline"
              >
                {t('studio.matches.backToProfile')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {visiblePeople.map((person) => {
              const targetUid = safeStr(person?.toUid || person?.targetUid || person?.uid);
              return (
                <StudioPersonCard
                  key={safeStr(person?.id) || targetUid}
                  person={person}
                  onLike={likePerson}
                  onMessage={openPersonMessage}
                  onInspect={inspectPerson}
                  onOpenPhotos={openPersonPhotos}
                  actionLoadingUid={peopleAction.loadingUid}
                  actionKind={peopleAction.kind}
                  presenceByUid={presenceByUid}
                />
              );
            })}

            {visibleMatches.map((m) => (
              <StudioMatchCard
                key={m.id}
                match={m}
                currentUid={currentUidForView}
                onOpenShort={
                  isPreview
                    ? () => openPreviewGate({ reason: t('previewGate.body') })
                    : openShort
                }
                interactionsDisabled={isPreview}
                onInteractDisabled={() => openPreviewGate({ reason: t('previewGate.body') })}
                canSeeFullProfiles={myMembership.active}
                profileComplete={myProfileComplete}
                membershipActive={!!myMembership.active}
                onRequireProfile={() => {}}
                onRequirePaid={requirePaid}
                presenceByUid={presenceByUid}
              />
            ))}
          </div>
        )}

        {personMessageModal.open ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg rounded-xl bg-white text-slate-900 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <div className="min-w-0 flex items-center gap-3">
                  {personMessageModal.photoUrl ? (
                    <img src={personMessageModal.photoUrl} alt={personMessageModal.displayName} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-100" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{personMessageModal.displayName}</p>
                    <p className="text-xs text-slate-500">{t('studio.matches.people.messageModalSubtitle')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPersonMessageModal({ open: false, targetUid: '', displayName: '', photoUrl: '' })}
                  className="app-btn app-btn-ghost h-8 px-2 text-xs"
                >
                  {t('studio.common.close')}
                </button>
              </div>

              <form onSubmit={sendPersonMessage} className="p-4">
                <textarea
                  value={personMessageText}
                  onChange={(e) => setPersonMessageText(e.target.value)}
                  rows={5}
                  maxLength={240}
                  placeholder={t('studio.matches.people.messagePlaceholder')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />

                {personMessageState.error ? <div className="mt-2 text-sm text-rose-700">{personMessageState.error}</div> : null}

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPersonMessageModal({ open: false, targetUid: '', displayName: '', photoUrl: '' })}
                    className="app-btn app-btn-outline"
                  >
                    {t('studio.common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={personMessageState.loading || !safeStr(personMessageText)}
                    className="app-btn app-btn-primary disabled:opacity-60"
                  >
                    {personMessageState.loading ? t('studio.common.processing') : t('studio.common.send')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {personProfileModal.open ? (
          <div
            data-testid="person-profile-overlay"
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            onClick={closePersonProfileModal}
          >
            <div
              data-testid="person-profile-modal"
              className="w-full max-w-4xl rounded-xl bg-white text-slate-900 shadow-xl max-h-[85vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 p-4 sticky top-0 bg-white">
                <p className="font-semibold">{personProfileModal.displayName || t('studio.matches.people.profileModalTitle')}</p>
                <button
                  type="button"
                  onClick={closePersonProfileModal}
                  className="app-btn app-btn-ghost h-8 px-2 text-xs"
                >
                  {t('studio.common.close')}
                </button>
              </div>

              <div className="p-4">
                {personProfileModal.loading ? <p className="text-sm text-slate-500">{t('studio.common.loading')}</p> : null}
                {personProfileModal.error ? <p className="text-sm text-rose-700">{personProfileModal.error}</p> : null}

                {!personProfileModal.loading && !personProfileModal.error && personProfileModal.profile ? (
                  <div className="space-y-5">
                    {(() => {
                      const localizedAbout = modalAbout || getLocalizedProfileText(personProfileModal.profile, 'about', i18n.language);
                      const localizedExpectations = modalExpectations || getLocalizedProfileText(personProfileModal.profile, 'expectations', i18n.language);
                      const modalPhotoUrls = Array.isArray(personProfileModal.profile?.photoUrls)
                        ? personProfileModal.profile.photoUrls.filter((url) => safeStr(url)).slice(0, 6)
                        : [];
                      const activePhotoIndex = modalPhotoUrls.length
                        ? Math.max(0, Math.min(personProfilePhotoIndex, modalPhotoUrls.length - 1))
                        : 0;
                      return (
                        <>
                    {modalPhotoUrls.length ? (
                      <div className="space-y-3">
                        <button
                          type="button"
                          className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100"
                          onClick={() =>
                            setLightbox({
                              open: true,
                              images: modalPhotoUrls,
                              index: activePhotoIndex,
                              title: personProfileModal.displayName || t('studio.matches.people.profileModalTitle'),
                            })
                          }
                        >
                          <img
                            src={modalPhotoUrls[activePhotoIndex]}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />

                          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white">
                            {activePhotoIndex + 1}/{modalPhotoUrls.length}
                          </div>

                          {modalPhotoUrls.length > 1 ? (
                            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
                              <button
                                type="button"
                                className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-lg text-white transition hover:bg-black/60"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setPersonProfilePhotoIndex((prev) => (prev - 1 + modalPhotoUrls.length) % modalPhotoUrls.length);
                                }}
                                aria-label={t('studio.matchProfile.prevPhoto')}
                              >
                                ‹
                              </button>

                              <button
                                type="button"
                                className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-lg text-white transition hover:bg-black/60"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setPersonProfilePhotoIndex((prev) => (prev + 1) % modalPhotoUrls.length);
                                }}
                                aria-label={t('studio.matchProfile.nextPhoto')}
                              >
                                ›
                              </button>
                            </div>
                          ) : null}
                        </button>

                        {modalPhotoUrls.length > 1 ? (
                          <div className="flex flex-wrap gap-2">
                            {modalPhotoUrls.map((url, index) => (
                              <button
                                key={url}
                                type="button"
                                className={
                                  'h-16 w-16 overflow-hidden rounded-lg border-2 bg-slate-100 transition ' +
                                  (index === activePhotoIndex ? 'border-emerald-500' : 'border-transparent hover:border-slate-300')
                                }
                                onClick={() => setPersonProfilePhotoIndex(index)}
                                aria-label={`${index + 1}. fotoğraf`}
                              >
                                <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {(() => {
                      const sections = buildPersonProfileSections(personProfileModal.profile, t);
                      return (
                        <>
                          {sections.identity.length ? (
                            <div data-testid="person-profile-identity-section" className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                              <p className="font-semibold text-slate-900">{t('studio.matches.people.profileModalTitle')}</p>
                              <div data-testid="person-profile-identity-list" className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                                {sections.identity.map((item) => (
                                  <p data-testid="person-profile-identity-item" key={item.label}><span className="text-slate-500">{item.label}:</span> {item.value}</p>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {sections.detailsEntries.length ? (
                            <div data-testid="person-profile-details-section" className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                              <p className="font-semibold text-slate-900">{t('matchmakingPage.form.sections.details')}</p>
                              <div data-testid="person-profile-details-list" className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                                {sections.detailsEntries.map((item) => (
                                  <p data-testid="person-profile-details-item" key={item.label}><span className="text-slate-500">{item.label}:</span> {item.value}</p>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {sections.partnerEntries.length ? (
                            <div data-testid="person-profile-partner-preferences" className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                              <p className="font-semibold text-slate-900">{t('matchmakingPage.form.sections.partnerPreferences')}</p>
                              <div data-testid="person-profile-partner-list" className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
                                {sections.partnerEntries.map((item) => (
                                  <p data-testid="person-profile-partner-item" key={item.label}><span className="text-slate-500">{item.label}:</span> {item.value}</p>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </>
                      );
                    })()}

                    {safeStr(localizedAbout) ? (
                      <div data-testid="person-profile-about-section" className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                        <p className="font-semibold text-slate-900">{t('myInfo.fields.about')}</p>
                        <p className="mt-1 whitespace-pre-wrap">{localizedAbout}</p>
                      </div>
                    ) : null}

                    {safeStr(localizedExpectations) ? (
                      <div data-testid="person-profile-expectations-section" className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                        <p className="font-semibold text-slate-900">{t('myInfo.fields.expectations')}</p>
                        <p className="mt-1 whitespace-pre-wrap">{localizedExpectations}</p>
                      </div>
                    ) : null}
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {shortModal.open ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto" role="dialog" aria-modal="true">
            <div className="w-full max-w-lg rounded-xl bg-white text-slate-900 shadow-xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0">
                <div className="min-w-0 flex items-center gap-3">
                  {shortOtherPhoto ? (
                    <img src={shortOtherPhoto} alt={shortOtherName} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-100" />
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-semibold">{shortOtherName}</p>
                    <p className="text-xs text-slate-500">{t('studio.matches.shortModal.subtitle')}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {t('studio.matches.shortModal.remaining', {
                        remaining: shortLimitInfo.remaining,
                        limit: shortLimitInfo.limit,
                      })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShortModal({ open: false, matchId: '', displayName: '' })}
                  className="app-btn app-btn-ghost h-8 px-2 text-xs"
                >
                  {t('studio.common.close')}
                </button>
              </div>

              <div className="p-4 pt-3 overflow-y-auto flex-1">
                <div ref={shortScrollRef} className="h-56 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {shortLoading ? <p className="text-sm text-slate-500">{t('studio.common.loading')}</p> : null}
                  {!shortLoading && (!Array.isArray(shortMessages) || shortMessages.length === 0) ? (
                    <p className="text-sm text-slate-500">{t('studio.matches.shortModal.noMessages')}</p>
                  ) : null}

                  {translateState.error ? (
                    <p className="mt-2 text-sm text-rose-700">
                      {t('studio.matches.shortModal.translateError', { error: translateState.error })}
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    {(Array.isArray(shortMessages) ? shortMessages : [])
                      .filter((m) => String(m?.text || '').trim())
                      .filter((m) => String(m?.chatMode || '') === 'short')
                      .slice(-40)
                      .map((m) => {
                        const fromMe = String(m?.userId || '').trim() === String(currentUidForView || '').trim();
                        const sentAtMs = timestampToMs(m?.createdAtMs) || timestampToMs(m?.createdAt);
                        const sentAtLabel = formatRelativeTimeFromMs(sentAtMs, { nowMs: shortNowMs, locale: i18n?.language || 'tr' });
                        const sentAtTitle = formatDateTimeFromMs(sentAtMs, { locale: i18n?.language || 'tr' });
                        const translated =
                          m?.translations && typeof m.translations === 'object'
                            ? String(m.translations?.[targetLang] || '').trim()
                            : '';
                        return (
                          <div key={m.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={
                              'max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ' +
                              (fromMe ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900')
                            }>
                              {String(m.text || '').trim()}
                              {sentAtLabel ? (
                                <div
                                  className={
                                    'mt-2 text-[11px] ' +
                                    (fromMe ? 'text-emerald-100/90 text-right' : 'text-slate-500')
                                  }
                                  title={sentAtTitle}
                                >
                                  {sentAtLabel}
                                </div>
                              ) : null}
                              {!fromMe ? (
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  {translated ? <div className="text-xs text-slate-600">{targetLang.toUpperCase()}: {translated}</div> : <span />}
                                  <button
                                    type="button"
                                    onClick={() => translateMessage({ matchId: shortModal.matchId, messageId: m.id })}
                                    disabled={translateState.loadingId === m.id}
                                    className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-60"
                                  >
                                    {translateState.loadingId === m.id
                                      ? t('studio.matches.shortModal.translating')
                                      : t('studio.matches.shortModal.translate')}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              <form onSubmit={sendShort} className="p-4 pt-0">
                <textarea
                  value={shortText}
                  onChange={(e) => setShortText(e.target.value)}
                  rows={4}
                  maxLength={240}
                  placeholder={t('studio.matches.shortModal.placeholder')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />

                {shortState.error ? <div className="mt-2 text-sm text-rose-700">{shortState.error}</div> : null}

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShortModal({ open: false, matchId: '', displayName: '' })}
                    className="app-btn app-btn-outline"
                  >
                    {t('studio.common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={shortState.loading || !String(shortText || '').trim() || shortLimitInfo.remaining <= 0}
                    className="app-btn app-btn-primary disabled:opacity-60"
                  >
                    {shortState.loading ? t('studio.common.processing') : t('studio.common.send')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </main>

      <StudioBottomNav />
      <Footer />
    </div>
  );
}
