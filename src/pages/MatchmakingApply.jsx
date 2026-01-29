import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../config/firebase';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import {
  getRecaptchaEnterpriseToken,
  isRecaptchaEnterpriseEnabled,
  verifyRecaptchaEnterpriseToken,
} from '../utils/recaptchaEnterprise';
import { useAuth } from '../auth/AuthProvider';
import { uploadImageToCloudinaryAuto } from '../utils/cloudinaryUpload';
import { authFetch } from '../utils/authFetch';

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function getSelectedValuesFromMultiSelect(e) {
  const opts = Array.from(e?.target?.selectedOptions || []);
  return opts.map((o) => String(o.value)).filter((v) => v);
}

function isImageFile(file) {
  return !!file && typeof file.type === 'string' && file.type.startsWith('image/');
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asMs(v) {
  if (!v) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v?.toMillis === 'function') {
    try {
      return v.toMillis();
    } catch {
      return 0;
    }
  }
  const seconds = typeof v?.seconds === 'number' ? v.seconds : null;
  const nanoseconds = typeof v?.nanoseconds === 'number' ? v.nanoseconds : 0;
  if (seconds !== null) return Math.floor(seconds * 1000 + nanoseconds / 1e6);
  return 0;
}

function pickBestNonStubApplication(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;

  const scored = list
    .map((a) => {
      const source = safeStr(a?.source).toLowerCase();
      const isStub = source === 'auto_stub';
      const ms =
        (typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0) ||
        asMs(a?.createdAt);
      const score = (isStub ? 0 : 1000) + (ms > 0 ? ms : 0);
      return { a, isStub, score };
    })
    .sort((x, y) => y.score - x.score);

  const best = scored.find((x) => !x.isStub) || null;
  return best ? best.a : null;
}

function computeAgeGroup(age, groupYears = 5) {
  const a = typeof age === 'number' && Number.isFinite(age) ? age : null;
  const g = typeof groupYears === 'number' && Number.isFinite(groupYears) && groupYears > 0 ? groupYears : 5;
  if (a === null) return null;
  const base = 18;
  const idx = Math.max(0, Math.floor((a - base) / g));
  const start = base + idx * g;
  const end = start + g - 1;
  return { years: g, index: idx, start, end, key: `${start}-${end}` };
}

async function compressImageToJpeg(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = {}) {
  const img = document.createElement('img');
  const url = URL.createObjectURL(file);

  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    const scale = Math.min(1, maxWidth / w, maxHeight / h);
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;

    return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  } finally {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      // ignore
    }
  }
}

export default function MatchmakingApply() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isEditOnceMode = useMemo(() => {
    try {
      return new URLSearchParams(location.search || '').get('editOnce') === '1';
    } catch {
      return false;
    }
  }, [location.search]);

  const BRAND_LOGO_SRC = '/brand.png';

  const submitFeedbackRef = useRef(null);

  // Auth bazen (özellikle local dev / 3rd-party engeller) "loading"da takılı kalabiliyor.
  // Bu sayfanın kilitlenmemesi için gate'i sadece gerçek auth durumuna bağlarız.
  const isAuthGate = !user || user.isAnonymous;

  // Kullanıcı zaten daha önce başvuru gönderdi ise tekrar form doldurtmayalım.
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    (async () => {
      try {
        const q = query(collection(db, 'matchmakingApplications'), where('userId', '==', user.uid), limit(10));
        const snap = await getDocs(q);
        if (cancelled) return;
        if (!snap.empty) {
          const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
          const best = pickBestNonStubApplication(items);
          // Sadece auto_stub varsa: kullanıcı formu doldurabilsin.
          if (!best) return;

          const id = best?.id;
          const data = best || {};

          if (!isEditOnceMode) {
            navigate('/profilim', { replace: true, state: { from: 'applyRedirectExisting', applicationId: id } });
            return;
          }

          // EditOnce modunda: redirect etme; formu mevcut verilerle prefill et.
          setExistingApplication({ id, ...data });
          setForm((prev) => {
            const details = data?.details && typeof data.details === 'object' ? data.details : {};
            const partner = data?.partnerPreferences && typeof data.partnerPreferences === 'object' ? data.partnerPreferences : {};
            const languages = details?.languages && typeof details.languages === 'object' ? details.languages : {};
            const nativeLang = languages?.native && typeof languages.native === 'object' ? languages.native : {};
            const foreignLang = languages?.foreign && typeof languages.foreign === 'object' ? languages.foreign : {};

            return {
              ...prev,
              username: String(data?.username || prev.username || ''),
              fullName: String(data?.fullName || prev.fullName || ''),
              age: data?.age === 0 || data?.age ? String(data.age) : String(prev.age || ''),
              city: String(data?.city || prev.city || ''),
              country: String(data?.country || prev.country || ''),
              whatsapp: String(data?.whatsapp || prev.whatsapp || ''),
              email: String(data?.email || prev.email || ''),
              instagram: String(data?.instagram || prev.instagram || ''),
              nationality: String(data?.nationality || prev.nationality || ''),
              gender: String(data?.gender || prev.gender || ''),
              lookingForNationality: String(data?.lookingForNationality || prev.lookingForNationality || ''),
              lookingForGender: String(data?.lookingForGender || prev.lookingForGender || ''),
              heightCm: details?.heightCm === 0 || details?.heightCm ? String(details.heightCm) : String(prev.heightCm || ''),
              weightKg: details?.weightKg === 0 || details?.weightKg ? String(details.weightKg) : String(prev.weightKg || ''),
              occupation: String(details?.occupation || prev.occupation || ''),
              education: String(details?.education || prev.education || ''),
              educationDepartment: String(details?.educationDepartment || prev.educationDepartment || ''),
              maritalStatus: String(details?.maritalStatus || prev.maritalStatus || ''),
              hasChildren: String(details?.hasChildren || prev.hasChildren || ''),
              childrenCount:
                details?.childrenCount === 0 || details?.childrenCount
                  ? String(details.childrenCount)
                  : String(prev.childrenCount || ''),
              familyApprovalStatus: String(details?.familyApprovalStatus || prev.familyApprovalStatus || ''),
              religion: String(details?.religion || prev.religion || ''),
              religiousValues: String(details?.religiousValues || prev.religiousValues || ''),
              incomeLevel: String(details?.incomeLevel || prev.incomeLevel || ''),
              marriageTimeline: String(details?.marriageTimeline || prev.marriageTimeline || ''),
              relocationWillingness: String(details?.relocationWillingness || prev.relocationWillingness || ''),
              preferredLivingCountry: String(details?.preferredLivingCountry || prev.preferredLivingCountry || ''),
              nativeLanguage: String(nativeLang?.code || prev.nativeLanguage || ''),
              nativeLanguageOther: String(nativeLang?.other || prev.nativeLanguageOther || ''),
              foreignLanguages: Array.isArray(foreignLang?.codes) ? foreignLang.codes : (Array.isArray(prev.foreignLanguages) ? prev.foreignLanguages : []),
              foreignLanguageOther: String(foreignLang?.other || prev.foreignLanguageOther || ''),
              communicationLanguage: String(details?.communicationLanguage || prev.communicationLanguage || ''),
              communicationLanguageOther: String(details?.communicationLanguageOther || prev.communicationLanguageOther || ''),
              smoking: String(details?.smoking || prev.smoking || ''),
              alcohol: String(details?.alcohol || prev.alcohol || ''),

              partnerHeightMinCm:
                partner?.heightMinCm === 0 || partner?.heightMinCm
                  ? String(partner.heightMinCm)
                  : String(prev.partnerHeightMinCm || ''),
              partnerHeightMaxCm:
                partner?.heightMaxCm === 0 || partner?.heightMaxCm
                  ? String(partner.heightMaxCm)
                  : String(prev.partnerHeightMaxCm || ''),
              partnerAgeMaxOlderYears:
                partner?.ageMaxOlderYears === 0 || partner?.ageMaxOlderYears
                  ? String(partner.ageMaxOlderYears)
                  : String(prev.partnerAgeMaxOlderYears || ''),
              partnerAgeMaxYoungerYears:
                partner?.ageMaxYoungerYears === 0 || partner?.ageMaxYoungerYears
                  ? String(partner.ageMaxYoungerYears)
                  : String(prev.partnerAgeMaxYoungerYears || ''),
              partnerMaritalStatus: String((partner?.maritalStatus === 'other' ? 'doesnt_matter' : partner?.maritalStatus) || prev.partnerMaritalStatus || ''),
              partnerReligion: String(partner?.religion || prev.partnerReligion || ''),
              partnerCommunicationMethods: (() => {
                const fromArray = partner?.communicationMethods;
                if (Array.isArray(fromArray)) return fromArray.filter(Boolean);

                const methods = [];
                const legacyLang = String(partner?.communicationLanguage || '').trim();
                const legacyTranslation = String(partner?.translationAppPreference || '').trim();

                // Eski sistemde partner için dil seçildiyse, bunu "yabancı dil" olarak yorumlayıp taşırız.
                if (legacyLang) methods.push('foreign_language');
                if (legacyTranslation === 'yes') methods.push('translation_app');
                return methods;
              })(),
              partnerLivingCountry: String(partner?.livingCountry || prev.partnerLivingCountry || ''),
              partnerSmokingPreference: String(partner?.smokingPreference || prev.partnerSmokingPreference || ''),
              partnerAlcoholPreference: String(partner?.alcoholPreference || prev.partnerAlcoholPreference || ''),
              partnerChildrenPreference: String(partner?.childrenPreference || prev.partnerChildrenPreference || 'doesnt_matter'),
              partnerEducationPreference: String(partner?.educationPreference || prev.partnerEducationPreference || 'doesnt_matter'),
              partnerOccupationPreference: String(partner?.occupationPreference || prev.partnerOccupationPreference || 'doesnt_matter'),
              partnerFamilyValuesPreference: String(partner?.familyValuesPreference || prev.partnerFamilyValuesPreference || 'doesnt_matter'),

              about: String(data?.about || prev.about || ''),
              expectations: String(data?.expectations || prev.expectations || ''),

              consent18Plus: !!data?.consent18Plus,
              consentPrivacy: !!data?.consentPrivacy,
              consentPhotoShare: !!data?.consentPhotoShare,
              consentTerms: !!data?.consentTerms,
            };
          });
        }
      } catch (e) {
        // ignore (rules/index/config) - kullanıcı yine formu görebilir.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditOnceMode, navigate, user?.uid]);

  const [existingApplication, setExistingApplication] = useState(null);

  const nationalityOptions = useMemo(
    () => [
      { id: 'tr', label: t('matchmakingPage.form.options.nationality.tr') },
      { id: 'id', label: t('matchmakingPage.form.options.nationality.id') },
      { id: 'other', label: t('matchmakingPage.form.options.nationality.other') },
    ],
    [t, i18n.language]
  );

  const genderOptions = useMemo(
    () => [
      { id: 'male', label: t('matchmakingPage.form.options.gender.male') },
      { id: 'female', label: t('matchmakingPage.form.options.gender.female') },
    ],
    [t, i18n.language]
  );

  const yesNoMaybeOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'yes', label: t('matchmakingPage.form.options.common.yes') },
      { id: 'no', label: t('matchmakingPage.form.options.common.no') },
      { id: 'unsure', label: t('matchmakingPage.form.options.common.unsure') },
    ],
    [t, i18n.language]
  );

  const yesNoOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'yes', label: t('matchmakingPage.form.options.common.yes') },
      { id: 'no', label: t('matchmakingPage.form.options.common.no') },
    ],
    [t, i18n.language]
  );

  const maritalStatusOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'single', label: t('matchmakingPage.form.options.maritalStatus.single') },
      { id: 'widowed', label: t('matchmakingPage.form.options.maritalStatus.widowed') },
      { id: 'divorced', label: t('matchmakingPage.form.options.maritalStatus.divorced') },
      { id: 'other', label: t('matchmakingPage.form.options.maritalStatus.other') },
    ],
    [t, i18n.language]
  );

  const partnerMaritalStatusOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'single', label: t('matchmakingPage.form.options.maritalStatus.single') },
      { id: 'widowed', label: t('matchmakingPage.form.options.maritalStatus.widowed') },
      { id: 'divorced', label: t('matchmakingPage.form.options.maritalStatus.divorced') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.maritalStatus.doesnt_matter') },
    ],
    [t, i18n.language]
  );

  const educationOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'secondary', label: t('matchmakingPage.form.options.education.secondary') },
      { id: 'high_school', label: t('matchmakingPage.form.options.education.highSchool') },
      { id: 'university', label: t('matchmakingPage.form.options.education.university') },
      { id: 'masters', label: t('matchmakingPage.form.options.education.masters') },
      { id: 'phd', label: t('matchmakingPage.form.options.education.phd') },
      { id: 'other', label: t('matchmakingPage.form.options.education.other') },
    ],
    [t, i18n.language]
  );

  const occupationOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'civil_servant', label: t('matchmakingPage.form.options.occupation.civilServant') },
      { id: 'employee', label: t('matchmakingPage.form.options.occupation.employee') },
      { id: 'retired', label: t('matchmakingPage.form.options.occupation.retired') },
      { id: 'business_owner', label: t('matchmakingPage.form.options.occupation.businessOwner') },
      { id: 'other', label: t('matchmakingPage.form.options.occupation.other') },
    ],
    [t, i18n.language]
  );

  const incomeOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'low', label: t('matchmakingPage.form.options.income.low') },
      { id: 'medium', label: t('matchmakingPage.form.options.income.medium') },
      { id: 'good', label: t('matchmakingPage.form.options.income.good') },
      { id: 'very_good', label: t('matchmakingPage.form.options.income.veryGood') },
      { id: 'prefer_not_to_say', label: t('matchmakingPage.form.options.income.preferNot') },
    ],
    [t, i18n.language]
  );

  const partnerChildrenPreferenceOptions = useMemo(
    () => [
      { id: 'want_children', label: t('matchmakingPage.form.options.partnerChildren.wantChildren') },
      { id: 'no_children', label: t('matchmakingPage.form.options.partnerChildren.noChildren') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t, i18n.language]
  );

  const partnerEducationPreferenceOptions = useMemo(
    () => [
      { id: 'secondary', label: t('matchmakingPage.form.options.education.secondary') },
      { id: 'university', label: t('matchmakingPage.form.options.education.university') },
      { id: 'masters', label: t('matchmakingPage.form.options.education.masters') },
      { id: 'phd', label: t('matchmakingPage.form.options.education.phd') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t, i18n.language]
  );

  const partnerOccupationPreferenceOptions = useMemo(
    () => [
      { id: 'civil_servant', label: t('matchmakingPage.form.options.occupation.civilServant') },
      { id: 'employee', label: t('matchmakingPage.form.options.occupation.employee') },
      { id: 'retired', label: t('matchmakingPage.form.options.occupation.retired') },
      { id: 'business_owner', label: t('matchmakingPage.form.options.occupation.businessOwner') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t, i18n.language]
  );

  const partnerFamilyValuesPreferenceOptions = useMemo(
    () => [
      { id: 'religious', label: t('matchmakingPage.form.options.familyValues.religious') },
      { id: 'liberal', label: t('matchmakingPage.form.options.familyValues.liberal') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t, i18n.language]
  );

  const partnerAgeDiffOptions = useMemo(() => {
    const opts = [{ id: '', label: t('matchmakingPage.form.options.common.select') }];
    for (let i = 0; i <= 20; i += 1) {
      if (i === 0) {
        opts.push({ id: '0', label: t('matchmakingPage.form.options.ageDiff.none') });
      } else {
        opts.push({ id: String(i), label: t('matchmakingPage.form.options.ageDiff.years', { count: i }) });
      }
    }
    return opts;
  }, [t, i18n.language]);

  const religionOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'islam', label: t('matchmakingPage.form.options.religion.islam') },
      { id: 'christian', label: t('matchmakingPage.form.options.religion.christian') },
      { id: 'hindu', label: t('matchmakingPage.form.options.religion.hindu') },
      { id: 'buddhist', label: t('matchmakingPage.form.options.religion.buddhist') },
      { id: 'other', label: t('matchmakingPage.form.options.religion.other') },
    ],
    [t, i18n.language]
  );

  const languageLevelOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'none', label: t('matchmakingPage.form.options.languageLevel.none') },
      { id: 'basic', label: t('matchmakingPage.form.options.languageLevel.basic') },
      { id: 'intermediate', label: t('matchmakingPage.form.options.languageLevel.intermediate') },
      { id: 'advanced', label: t('matchmakingPage.form.options.languageLevel.advanced') },
      { id: 'native', label: t('matchmakingPage.form.options.languageLevel.native') },
    ],
    [t, i18n.language]
  );

  const communicationLanguageOptions = useMemo(
    () => [
      { id: 'tr', label: t('matchmakingPage.form.options.commLanguage.tr') },
      { id: 'id', label: t('matchmakingPage.form.options.commLanguage.id') },
      { id: 'en', label: t('matchmakingPage.form.options.commLanguage.en') },
      { id: 'translation_app', label: t('matchmakingPage.form.options.commLanguage.translationApp') },
      { id: 'other', label: t('matchmakingPage.form.options.commLanguage.other') },
    ],
    [t, i18n.language]
  );

  const partnerCommunicationMethodOptions = useMemo(
    () => [
      { id: 'own_language', label: t('matchmakingPage.form.options.partnerCommunicationMethods.ownLanguage') },
      { id: 'foreign_language', label: t('matchmakingPage.form.options.partnerCommunicationMethods.foreignLanguage') },
      { id: 'translation_app', label: t('matchmakingPage.form.options.partnerCommunicationMethods.translationApp') },
    ],
    [t, i18n.language]
  );

  const religiousValuesOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'weak', label: t('matchmakingPage.form.options.religiousValues.weak') },
      { id: 'medium', label: t('matchmakingPage.form.options.religiousValues.medium') },
      { id: 'conservative', label: t('matchmakingPage.form.options.religiousValues.conservative') },
    ],
    [t, i18n.language]
  );

  const livingCountryOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'tr', label: t('matchmakingPage.form.options.livingCountry.tr') },
      { id: 'id', label: t('matchmakingPage.form.options.livingCountry.id') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t, i18n.language]
  );

  const marriageTimelineOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: '0_3', label: t('matchmakingPage.form.options.timeline.0_3') },
      { id: '3_6', label: t('matchmakingPage.form.options.timeline.3_6') },
      { id: '6_12', label: t('matchmakingPage.form.options.timeline.6_12') },
      { id: '1_plus', label: t('matchmakingPage.form.options.timeline.1_plus') },
    ],
    [t, i18n.language]
  );

  const yesNoDoesntMatterOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'yes', label: t('matchmakingPage.form.options.common.yes') },
      { id: 'no', label: t('matchmakingPage.form.options.common.no') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t, i18n.language]
  );

  const heightRangeOptions = useMemo(() => {
    const values = [];
    for (let cm = 140; cm <= 210; cm += 5) values.push(cm);
    return values;
  }, []);

  const [form, setForm] = useState({
    username: '',
    fullName: '',
    age: '',
    city: '',
    country: '',
    whatsapp: '',
    email: '',
    instagram: '',
    nationality: '',
    gender: '',
    lookingForNationality: '',
    lookingForGender: '',
    heightCm: '',
    weightKg: '',
    occupation: '',
    education: '',
    educationDepartment: '',
    maritalStatus: '',
    hasChildren: '',
    childrenCount: '',
    familyApprovalStatus: '',
    religion: '',
    religiousValues: '',
    incomeLevel: '',
    marriageTimeline: '',
    relocationWillingness: '',
    preferredLivingCountry: '',
    nativeLanguage: '',
    nativeLanguageOther: '',
    foreignLanguages: [],
    foreignLanguageOther: '',
    communicationLanguage: '',
    communicationLanguageOther: '',
    smoking: '',
    alcohol: '',
    partnerHeightMinCm: '',
    partnerHeightMaxCm: '',
    partnerAgeMaxOlderYears: '',
    partnerAgeMaxYoungerYears: '',
    partnerMaritalStatus: '',
    partnerReligion: '',
    partnerCommunicationMethods: [],
    partnerLivingCountry: '',
    partnerSmokingPreference: '',
    partnerAlcoholPreference: '',
    partnerChildrenPreference: 'doesnt_matter',
    partnerEducationPreference: 'doesnt_matter',
    partnerOccupationPreference: 'doesnt_matter',
    partnerFamilyValuesPreference: 'doesnt_matter',
    about: '',
    expectations: '',
    consent18Plus: false,
    consentPrivacy: false,
    consentPhotoShare: false,
    consentTerms: false,
    hpCompany: '',
  });

  const partnerForeignLanguageLabelForUi = useMemo(() => {
    const base = t('matchmakingPage.form.options.partnerCommunicationMethods.foreignLanguage');

    const foreign = Array.isArray(form.foreignLanguages) ? form.foreignLanguages.filter(Boolean) : [];
    const otherValue = String(form.foreignLanguageOther || '').trim();

    const codes = foreign.filter((c) => c && c !== 'none' && c !== 'other' && c !== 'translation_app');
    const labels = codes
      .map((c) => communicationLanguageOptions.find((opt) => opt.id === c)?.label || c)
      .filter(Boolean);

    if (foreign.includes('other') && otherValue) {
      labels.push(`${t('matchmakingPage.form.options.commLanguage.other')}: ${otherValue}`);
    }

    if (!labels.length) return base;

    const maxShown = 3;
    const shown = labels.slice(0, maxShown);
    const remaining = labels.length - shown.length;
    const detail = `${shown.join(', ')}${remaining > 0 ? ` +${remaining}` : ''}`;
    return `${base} (${detail})`;
  }, [t, i18n.language, communicationLanguageOptions, form.foreignLanguages, form.foreignLanguageOther]);

  const partnerOwnLanguageLabelForUi = useMemo(() => {
    const base = t('matchmakingPage.form.options.partnerCommunicationMethods.ownLanguage');

    const code = String(form.nativeLanguage || '').trim();
    if (!code) return base;

    if (code === 'other') {
      const otherValue = String(form.nativeLanguageOther || '').trim();
      if (!otherValue) return base;
      return `${base} (${t('matchmakingPage.form.options.commLanguage.other')}: ${otherValue})`;
    }

    const label = communicationLanguageOptions.find((opt) => opt.id === code)?.label;
    if (!label) return base;
    return `${base} (${label})`;
  }, [t, i18n.language, communicationLanguageOptions, form.nativeLanguage, form.nativeLanguageOther]);

  const [photoFiles, setPhotoFiles] = useState({ photo1: null, photo2: null, photo3: null });
  const [formOpenedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [lastApplicationId, setLastApplicationId] = useState('');

  useEffect(() => {
    if (!error) return;
    try {
      submitFeedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      // ignore
    }
  }, [error]);

  const onChange = (key) => (e) => {
    const value = e?.target?.type === 'checkbox' ? !!e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onEducationChange = (e) => {
    const value = e?.target?.value || '';
    setForm((prev) => {
      const needsDept = value === 'university' || value === 'masters' || value === 'phd';
      return {
        ...prev,
        education: value,
        educationDepartment: needsDept ? prev.educationDepartment : '',
      };
    });
  };

  const onNativeLanguageChange = (e) => {
    const value = e?.target?.value || '';
    setForm((prev) => {
      const foreign = Array.isArray(prev.foreignLanguages) ? prev.foreignLanguages : [];
      const nextForeign = foreign.filter((code) => code && code !== value);
      const keepForeignOther = nextForeign.includes('other');
      return {
        ...prev,
        nativeLanguage: value,
        nativeLanguageOther: value === 'other' ? prev.nativeLanguageOther : '',
        foreignLanguages: nextForeign,
        foreignLanguageOther: keepForeignOther ? prev.foreignLanguageOther : '',
      };
    });
  };

  const toggleForeignLanguage = (code) => () => {
    setForm((prev) => {
      const list = Array.isArray(prev.foreignLanguages) ? prev.foreignLanguages : [];
      const exists = list.includes(code);
      // "none" seçeneği diğerlerini kilitlemesin.
      // Başka bir dil seçildiğinde "none" otomatik çıkarılır (çelişkiyi engeller).
      let next = exists ? list.filter((x) => x !== code) : [...list, code];
      if (code !== 'none' && next.includes('none')) next = next.filter((x) => x !== 'none');
      return {
        ...prev,
        foreignLanguages: next,
        foreignLanguageOther: next.includes('other') ? prev.foreignLanguageOther : '',
      };
    });
  };

  // multi-select iptal edildi

  const ageNumForUi = toNumberOrNull(form.age);
  const partnerAgeMaxOlderForUi = toNumberOrNull(form.partnerAgeMaxOlderYears);
  const partnerAgeMaxYoungerForUi = toNumberOrNull(form.partnerAgeMaxYoungerYears);
  const partnerAgeMinForUi =
    ageNumForUi !== null && partnerAgeMaxYoungerForUi !== null
      ? Math.max(18, ageNumForUi - partnerAgeMaxYoungerForUi)
      : null;
  const partnerAgeMaxForUi =
    ageNumForUi !== null && partnerAgeMaxOlderForUi !== null ? Math.min(99, ageNumForUi + partnerAgeMaxOlderForUi) : null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLastApplicationId('');

    const minApplicantAge = form.nationality === 'id' ? 21 : 18;

    // Honeypot (botlar genelde doldurur)
    // Not: Bazı tarayıcı/eklenti autofill'leri gizli alanları doldurabiliyor.
    // Bu yüzden burada "başarılı" gösterip kaydı yutmuyoruz; kullanıcıya net uyarı veriyoruz.
    if (String(form.hpCompany || '').trim()) {
      console.warn('matchmaking honeypot triggered');
      return setError(t('matchmakingPage.form.errors.honeypotTriggered'));
    }

    // Çok hızlı gönderimi engelle (bot davranışı)
    if (Date.now() - formOpenedAt < 5000) {
      return setError(t('matchmakingPage.form.errors.tooFast'));
    }

    // Basit client-side rate-limit (sunucu tarafı kadar güvenli değil ama spam'i azaltır)
    try {
      const last = Number(localStorage.getItem('mk_apply_last_submit_at') || '0');
      if (last && Date.now() - last < 60_000) {
        return setError(t('matchmakingPage.form.errors.rateLimited'));
      }
    } catch (err) {
      // ignore
    }

    // Firestore rules, başvuru kaydı için bu onayların true olmasını bekliyor.
    // Diğer tüm alanlar opsiyonel kalsa bile, bu 3 onay olmadan gönderim engellenir.
    if (!form.consent18Plus || !form.consentPrivacy || !form.consentPhotoShare || !form.consentTerms) {
      return setError(t('matchmakingPage.form.errors.consentsRequired', { minAge: minApplicantAge }));
    }

    let recaptchaToken = '';
    const recaptchaAction = 'matchmaking_apply_submit';
    try {
      recaptchaToken = await getRecaptchaEnterpriseToken(recaptchaAction);
    } catch (err) {
      if (isRecaptchaEnterpriseEnabled()) {
        console.error('recaptcha enterprise error:', err);
        return setError(t('matchmakingPage.form.errors.recaptchaFailed'));
      }
    }

    if (isRecaptchaEnterpriseEnabled()) {
      if (!recaptchaToken) {
        return setError(t('matchmakingPage.form.errors.recaptchaFailed'));
      }
      try {
        const verdict = await verifyRecaptchaEnterpriseToken({ token: recaptchaToken, expectedAction: recaptchaAction });
        if (!verdict?.allowed) {
          return setError(t('matchmakingPage.form.errors.recaptchaRejected'));
        }
      } catch (err) {
        console.error('recaptcha enterprise verify error:', err);
        return setError(t('matchmakingPage.form.errors.recaptchaFailed'));
      }
    }

    // Kullanıcı isteği: Instagram hariç tüm alanlar zorunlu.
    const requiredValue = (value) => String(value ?? '').trim();
    const foreignLanguages = Array.isArray(form.foreignLanguages) ? form.foreignLanguages.filter(Boolean) : [];

    const normalizedUsername = normalizeUsername(form.username);
    if (!normalizedUsername) {
      return setError(t('matchmakingPage.form.errors.username'));
    }

    if (!requiredValue(form.fullName)) return setError(t('matchmakingPage.form.errors.fullName'));
    if (!requiredValue(form.age)) return setError(t('matchmakingPage.form.errors.age'));
    if (!requiredValue(form.city)) return setError(t('matchmakingPage.form.errors.city'));
    if (!requiredValue(form.country)) return setError(t('matchmakingPage.form.errors.country'));
    if (!requiredValue(form.whatsapp)) return setError(t('matchmakingPage.form.errors.whatsapp'));
    if (!requiredValue(form.email)) return setError(t('matchmakingPage.form.errors.email'));

    if (!requiredValue(form.nationality)) return setError(t('matchmakingPage.form.errors.nationality'));
    if (!requiredValue(form.gender)) return setError(t('matchmakingPage.form.errors.gender'));
    if (!requiredValue(form.lookingForNationality)) return setError(t('matchmakingPage.form.errors.lookingForNationality'));
    if (!requiredValue(form.lookingForGender)) return setError(t('matchmakingPage.form.errors.lookingForGender'));

    if (!requiredValue(form.heightCm)) return setError(t('matchmakingPage.form.errors.heightRequired'));
    if (!requiredValue(form.weightKg)) return setError(t('matchmakingPage.form.errors.weightRequired'));
    if (!requiredValue(form.occupation)) return setError(t('matchmakingPage.form.errors.occupation'));
    if (!requiredValue(form.education)) return setError(t('matchmakingPage.form.errors.education'));
    if ((form.education === 'university' || form.education === 'masters' || form.education === 'phd') && !requiredValue(form.educationDepartment)) {
      return setError(t('matchmakingPage.form.errors.educationDepartment'));
    }
    if (!requiredValue(form.maritalStatus)) return setError(t('matchmakingPage.form.errors.maritalStatus'));
    if (!requiredValue(form.hasChildren)) return setError(t('matchmakingPage.form.errors.hasChildren'));
    if (form.hasChildren === 'yes' && !requiredValue(form.childrenCount)) {
      return setError(t('matchmakingPage.form.errors.childrenCount'));
    }
    if (!requiredValue(form.incomeLevel)) return setError(t('matchmakingPage.form.errors.incomeLevel'));
    if (!requiredValue(form.religion)) return setError(t('matchmakingPage.form.errors.religion'));
    if (!requiredValue(form.religiousValues)) return setError(t('matchmakingPage.form.errors.religiousValues'));
    if (!requiredValue(form.familyApprovalStatus)) return setError(t('matchmakingPage.form.errors.familyApprovalStatus'));
    if (!requiredValue(form.marriageTimeline)) return setError(t('matchmakingPage.form.errors.marriageTimeline'));
    if (!requiredValue(form.relocationWillingness)) return setError(t('matchmakingPage.form.errors.relocationWillingness'));
    if (!requiredValue(form.preferredLivingCountry)) return setError(t('matchmakingPage.form.errors.preferredLivingCountry'));

    if (!requiredValue(form.nativeLanguage)) return setError(t('matchmakingPage.form.errors.nativeLanguage'));
    if (form.nativeLanguage === 'other' && !requiredValue(form.nativeLanguageOther)) {
      return setError(t('matchmakingPage.form.errors.nativeLanguageOther'));
    }
    if (!foreignLanguages.length) return setError(t('matchmakingPage.form.errors.foreignLanguages'));
    if (foreignLanguages.includes('other') && !requiredValue(form.foreignLanguageOther)) {
      return setError(t('matchmakingPage.form.errors.foreignLanguageOther'));
    }
    if (!requiredValue(form.communicationLanguage)) return setError(t('matchmakingPage.form.errors.communicationLanguage'));
    if (form.communicationLanguage === 'other' && !requiredValue(form.communicationLanguageOther)) {
      return setError(t('matchmakingPage.form.errors.communicationLanguageOther'));
    }
    if (!requiredValue(form.smoking)) return setError(t('matchmakingPage.form.errors.smoking'));
    if (!requiredValue(form.alcohol)) return setError(t('matchmakingPage.form.errors.alcohol'));

    if (!requiredValue(form.partnerHeightMinCm)) return setError(t('matchmakingPage.form.errors.partnerHeightMin'));
    if (!requiredValue(form.partnerHeightMaxCm)) return setError(t('matchmakingPage.form.errors.partnerHeightMax'));
    if (!requiredValue(form.partnerAgeMaxOlderYears)) return setError(t('matchmakingPage.form.errors.partnerAgeMaxOlderYears'));
    if (!requiredValue(form.partnerAgeMaxYoungerYears)) return setError(t('matchmakingPage.form.errors.partnerAgeMaxYoungerYears'));
    if (!requiredValue(form.partnerMaritalStatus)) return setError(t('matchmakingPage.form.errors.partnerMaritalStatus'));
    if (!requiredValue(form.partnerReligion)) return setError(t('matchmakingPage.form.errors.partnerReligion'));
    const partnerCommunicationMethods = Array.isArray(form.partnerCommunicationMethods)
      ? form.partnerCommunicationMethods.filter(Boolean)
      : [];
    if (!partnerCommunicationMethods.length) return setError(t('matchmakingPage.form.errors.partnerCommunicationLanguage'));
    if (!requiredValue(form.partnerLivingCountry)) return setError(t('matchmakingPage.form.errors.partnerLivingCountry'));
    if (!requiredValue(form.partnerSmokingPreference)) return setError(t('matchmakingPage.form.errors.partnerSmokingPreference'));
    if (!requiredValue(form.partnerAlcoholPreference)) return setError(t('matchmakingPage.form.errors.partnerAlcoholPreference'));
    if (!requiredValue(form.partnerChildrenPreference)) return setError(t('matchmakingPage.form.errors.partnerChildrenPreference'));
    if (!requiredValue(form.partnerEducationPreference)) return setError(t('matchmakingPage.form.errors.partnerEducationPreference'));
    if (!requiredValue(form.partnerOccupationPreference)) return setError(t('matchmakingPage.form.errors.partnerOccupationPreference'));
    if (!requiredValue(form.partnerFamilyValuesPreference)) return setError(t('matchmakingPage.form.errors.partnerFamilyValuesPreference'));

    if (!requiredValue(form.about)) return setError(t('matchmakingPage.form.errors.about'));
    if (!requiredValue(form.expectations)) return setError(t('matchmakingPage.form.errors.expectations'));

    if (!isEditOnceMode) {
      if (!photoFiles.photo1) return setError(t('matchmakingPage.form.errors.photo1Required'));
      if (!photoFiles.photo2) return setError(t('matchmakingPage.form.errors.photo2Required'));
      if (!photoFiles.photo3) return setError(t('matchmakingPage.form.errors.photo3Required'));
    }

    if (photoFiles.photo1 && !isImageFile(photoFiles.photo1)) return setError(t('matchmakingPage.form.errors.photoType'));
    if (photoFiles.photo2 && !isImageFile(photoFiles.photo2)) return setError(t('matchmakingPage.form.errors.photoType'));
    if (photoFiles.photo3 && !isImageFile(photoFiles.photo3)) return setError(t('matchmakingPage.form.errors.photoType'));

    const ageStr = String(form.age ?? '').trim();
    const ageNum = ageStr ? Number(ageStr) : null;
    if (ageStr && (!Number.isFinite(ageNum) || ageNum < minApplicantAge || ageNum > 99)) {
      return setError(t('matchmakingPage.form.errors.ageRange', { minAge: minApplicantAge }));
    }

    const childrenCountNum = toNumberOrNull(form.childrenCount);
    if (childrenCountNum !== null && (childrenCountNum < 0 || childrenCountNum > 20)) {
      return setError(t('matchmakingPage.form.errors.childrenCount'));
    }

    const heightNum = toNumberOrNull(form.heightCm);
    if (heightNum !== null && (heightNum < 120 || heightNum > 230)) return setError(t('matchmakingPage.form.errors.heightRange'));

    const weightNum = toNumberOrNull(form.weightKg);
    if (weightNum !== null && (weightNum < 35 || weightNum > 250)) return setError(t('matchmakingPage.form.errors.weightRange'));

    const partnerHeightMin = form.partnerHeightMinCm === 'any' ? null : toNumberOrNull(form.partnerHeightMinCm);
    const partnerHeightMax = form.partnerHeightMaxCm === 'any' ? null : toNumberOrNull(form.partnerHeightMaxCm);
    if (partnerHeightMin !== null && partnerHeightMax !== null && partnerHeightMin > partnerHeightMax) {
      return setError(t('matchmakingPage.form.errors.partnerHeightRange'));
    }

    const partnerAgeMaxOlderYears = toNumberOrNull(form.partnerAgeMaxOlderYears);
    const partnerAgeMaxYoungerYears = toNumberOrNull(form.partnerAgeMaxYoungerYears);
    const partnerAgeMin =
      ageNum !== null && partnerAgeMaxYoungerYears !== null ? Math.max(18, ageNum - partnerAgeMaxYoungerYears) : null;
    const partnerAgeMax =
      ageNum !== null && partnerAgeMaxOlderYears !== null ? Math.min(99, ageNum + partnerAgeMaxOlderYears) : null;

    const currentUser = user || auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      return setError(t('matchmakingPage.form.errors.mustLogin'));
    }

    setSubmitting(true);
    try {
      const uid = currentUser?.uid || auth.currentUser?.uid;
      if (!uid) {
        throw new Error('Auth missing uid');
      }

      // Engellenen kullanıcılar başvuru gönderemesin
      try {
        const userSnap = await getDoc(doc(db, 'matchmakingUsers', uid));
        const blocked = userSnap.exists() ? !!(userSnap.data() || {}).blocked : false;
        if (blocked) {
          return setError(t('matchmakingPage.form.errors.blocked'));
        }
      } catch (blockErr) {
        // rules izin vermezse engel kontrolünü atlarız
        console.warn('matchmakingUsers read failed (skipping block check):', blockErr);
      }

      const colRef = collection(db, 'matchmakingApplications');
      // Firestore rules, başkalarının başvurularını okumaya izin vermediği için
      // client-side uniqueness query'leri permission-denied ile kırılır.
      // Bu yüzden benzersizliği docId üzerinden enforce ediyoruz (case-insensitive).
      const docId = isEditOnceMode ? String(existingApplication?.id || '') : String(normalizedUsername || '').trim();
      const docRef = docId ? doc(colRef, docId) : null;
      if (isEditOnceMode && !docRef) {
        return setError(t('matchmakingPage.form.errors.submitFailed'));
      }
      if (!isEditOnceMode && !docRef) {
        return setError(t('matchmakingPage.form.errors.username'));
      }

      // Not: username uniqueness check artık docId üzerinden çalışır.

      const compressed1 = photoFiles.photo1 ? await compressImageToJpeg(photoFiles.photo1) : null;
      const compressed2 = photoFiles.photo2 ? await compressImageToJpeg(photoFiles.photo2) : null;
      const compressed3 = photoFiles.photo3 ? await compressImageToJpeg(photoFiles.photo3) : null;

      const photoPaths = [];
      const photoUrls = [];
      const photoCloudinary = [];

      const folder = `endonezya-kasifi/matchmakingApplications/${docRef.id}`;
      const tags = ['matchmaking', 'application'];

      const hasAnyPhoto = !!(compressed1 || compressed2 || compressed3);
      let cloudinaryOk = !hasAnyPhoto;
      let cloudinaryErr = null;
      try {
        if (hasAnyPhoto) {
          // Signed upload varsa onu, yoksa unsigned preset'i otomatik kullanır.
          if (compressed1) {
            const up1 = await uploadImageToCloudinaryAuto(compressed1, { folder, tags });
            photoUrls.push(up1.secureUrl);
            photoCloudinary.push(up1);
          }
          if (compressed2) {
            const up2 = await uploadImageToCloudinaryAuto(compressed2, { folder, tags });
            photoUrls.push(up2.secureUrl);
            photoCloudinary.push(up2);
          }
          if (compressed3) {
            const up3 = await uploadImageToCloudinaryAuto(compressed3, { folder, tags });
            photoUrls.push(up3.secureUrl);
            photoCloudinary.push(up3);
          }
          cloudinaryOk = true;
        }
      } catch (cloudErr) {
        cloudinaryErr = cloudErr;
        // Cloudinary konfigürasyonu yoksa / hata verirse (dev'de) Storage'a düş.
        console.warn('Cloudinary upload failed:', cloudErr?.details || cloudErr);
      }

      if (!cloudinaryOk) {
        // Varsayılan davranış: Storage fallback KAPALI.
        // Çünkü localhost'ta Firebase Storage CORS / izinler nedeniyle sık kırılıyor.
        // İsterseniz fallback'i açabilirsiniz: VITE_ALLOW_FIREBASE_STORAGE_FALLBACK=1
        const allowStorageFallback = String(import.meta.env.VITE_ALLOW_FIREBASE_STORAGE_FALLBACK || '') === '1';

        if (!allowStorageFallback) {
          const baseMsg = 'Cloudinary upload failed';
          const detailMsg = typeof cloudinaryErr?.message === 'string' && cloudinaryErr.message.trim() ? cloudinaryErr.message.trim() : '';
          const e = new Error(detailMsg || baseMsg);
          e.code = 'cloudinary/upload-failed';
          e.details = cloudinaryErr?.details;
          throw e;
        }

        if (compressed1) {
          const storageRef1 = ref(storage, `matchmakingApplications/${docRef.id}/photo1.jpg`);
          await uploadBytes(storageRef1, compressed1, { contentType: compressed1.type || 'image/jpeg' });
          photoPaths.push(storageRef1.fullPath);
        }

        if (compressed2) {
          const storageRef2 = ref(storage, `matchmakingApplications/${docRef.id}/photo2.jpg`);
          await uploadBytes(storageRef2, compressed2, { contentType: compressed2.type || 'image/jpeg' });
          photoPaths.push(storageRef2.fullPath);
        }

        if (compressed3) {
          const storageRef3 = ref(storage, `matchmakingApplications/${docRef.id}/photo3.jpg`);
          await uploadBytes(storageRef3, compressed3, { contentType: compressed3.type || 'image/jpeg' });
          photoPaths.push(storageRef3.fullPath);
        }
      }

      // Kısa ve anlaşılır başvuru kodu: MK-<profileNo>
      // Not: Upload başarısız olursa numara boşa gidebilir; kabul edilebilir (sayaç sadece artar).
      let allocatedProfileNo = null;
      if (!isEditOnceMode) {
        try {
          const allocated = await authFetch('/api/matchmaking-allocate-profile-no', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({}),
          });
          allocatedProfileNo = typeof allocated?.profileNo === 'number' && Number.isFinite(allocated.profileNo)
            ? allocated.profileNo
            : null;
        } catch (e) {
          console.warn('profileNo allocation failed (fallback to username/profileCode):', e);
        }
      }

      const payload = {
        profileNo: allocatedProfileNo,
        profileCode: allocatedProfileNo !== null ? `MK-${allocatedProfileNo}` : String(form.username || '').trim(),
        username: String(form.username || '').trim(),
        usernameLower: normalizedUsername,
        fullName: String(form.fullName || '').trim(),
        age: ageNum,
        ageGroup: computeAgeGroup(
          ageNum,
          (() => {
            const raw = Number(import.meta.env.VITE_MATCHMAKING_AGE_GROUP_YEARS || 5);
            return Number.isFinite(raw) && raw > 0 ? raw : 5;
          })()
        ),
        city: String(form.city || '').trim(),
        country: String(form.country || '').trim(),
        whatsapp: String(form.whatsapp || '').trim(),
        email: (form.email || '').trim(),
        instagram: (form.instagram || '').trim(),
        nationality: form.nationality || '',
        gender: form.gender || '',
        lookingForNationality: form.lookingForNationality || '',
        lookingForGender: form.lookingForGender || '',
        details: {
          heightCm: heightNum,
          weightKg: weightNum,
          occupation: form.occupation || '',
          education: form.education || '',
          educationDepartment:
            form.education === 'university' || form.education === 'masters' || form.education === 'phd'
              ? String(form.educationDepartment || '').trim()
              : '',
          maritalStatus: form.maritalStatus || '',
          hasChildren: form.hasChildren || '',
          childrenCount: childrenCountNum,
          incomeLevel: form.incomeLevel || '',
          religion: form.religion || '',
          religiousValues: String(form.religiousValues || '').trim(),
          familyApprovalStatus: form.familyApprovalStatus || '',
          marriageTimeline: form.marriageTimeline || '',
          relocationWillingness: form.relocationWillingness || '',
          preferredLivingCountry: form.preferredLivingCountry || '',
          languages: {
            native: {
              code: form.nativeLanguage || '',
              other: form.nativeLanguage === 'other' ? String(form.nativeLanguageOther).trim() : '',
            },
            foreign: {
              codes: Array.isArray(form.foreignLanguages) ? form.foreignLanguages : [],
              other: (form.foreignLanguages || []).includes('other') ? String(form.foreignLanguageOther).trim() : '',
            },
          },
          // geriye dönük: eski alanlar (admin/raporlar için)
          communicationLanguage: form.communicationLanguage || '',
          communicationLanguageOther:
            form.communicationLanguage === 'other' ? String(form.communicationLanguageOther).trim() : '',
          communicationMethod: form.communicationLanguage || '',
          canCommunicateWithTranslationApp: form.communicationLanguage === 'translation_app',
          smoking: form.smoking || '',
          alcohol: form.alcohol || '',
        },
        partnerPreferences: {
          heightMinCm: partnerHeightMin,
          heightMaxCm: partnerHeightMax,
          ageMaxOlderYears: partnerAgeMaxOlderYears,
          ageMaxYoungerYears: partnerAgeMaxYoungerYears,
          ageMin: partnerAgeMin,
          ageMax: partnerAgeMax,
          maritalStatus: form.partnerMaritalStatus || '',
          religion: form.partnerReligion || '',
          communicationMethods: partnerCommunicationMethods,
          // geriye dönük: eski alanlar (admin/raporlar için)
          canCommunicateWithTranslationApp: partnerCommunicationMethods.includes('translation_app'),
          translationAppPreference: partnerCommunicationMethods.includes('translation_app') ? 'yes' : 'no',
          livingCountry: form.partnerLivingCountry || '',
          smokingPreference: form.partnerSmokingPreference || '',
          alcoholPreference: form.partnerAlcoholPreference || '',
          childrenPreference: form.partnerChildrenPreference || 'doesnt_matter',
          educationPreference: form.partnerEducationPreference || 'doesnt_matter',
          occupationPreference: form.partnerOccupationPreference || 'doesnt_matter',
          familyValuesPreference: form.partnerFamilyValuesPreference || 'doesnt_matter',
        },
        about: String(form.about || '').trim(),
        expectations: (form.expectations || '').trim(),
        photoPaths,
        photoUrls,
        photoCloudinary,
        photoContentTypes: [
          compressed1?.type || '',
          compressed2?.type || '',
          compressed3?.type || '',
        ],
        photoOriginalTypes: [
          photoFiles.photo1?.type || '',
          photoFiles.photo2?.type || '',
          photoFiles.photo3?.type || '',
        ],
        userId: uid,
        consent18Plus: !!form.consent18Plus,
        consentPrivacy: !!form.consentPrivacy,
        consentPhotoShare: !!form.consentPhotoShare,
        consentTerms: !!form.consentTerms,
        lang: (i18n.language || 'tr').split('-')[0],
        source: 'site',
        recaptchaEnterprise: {
          provider: 'google-recaptcha-enterprise',
          action: recaptchaAction,
          token: recaptchaToken,
        },
        createdAt: serverTimestamp(),
        pool: {
          active: true,
          addedAt: serverTimestamp(),
          addedAtMs: Date.now(),
          reason: isEditOnceMode ? 'edit_once' : 'apply_submit',
        },
        status: 'new',
      };

      if (isEditOnceMode) {
        const editPayload = { ...payload };
        delete editPayload.createdAt;
        delete editPayload.status;
        delete editPayload.recaptchaEnterprise;
        delete editPayload.photoPaths;
        delete editPayload.photoCloudinary;
        delete editPayload.photoContentTypes;
        delete editPayload.photoOriginalTypes;

        if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
          delete editPayload.photoUrls;
        }

        await authFetch('/api/matchmaking-application-edit-once', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ payload: editPayload }),
        });

        setSuccess(true);
        setLastApplicationId(docRef.id);
        navigate('/profilim', {
          replace: true,
          state: { from: 'matchmakingEditOnce', applicationId: docRef.id },
        });
        return;
      }

      await setDoc(docRef, payload);

      setLastApplicationId(docRef.id);

      try {
        localStorage.setItem('mk_apply_last_submit_at', String(Date.now()));
      } catch (err) {
        // ignore
      }

      navigate('/profilim', {
        replace: true,
        state: { from: 'matchmakingApply', applicationId: docRef.id },
      });
      return;
    } catch (err) {
      console.error('matchmaking submit error:', err);
      const code = err?.code || err?.name || '';
      if (code === 'permission-denied') {
        // Bu sayfada create izinleri dar; permission-denied en sık "doc zaten var" (username taken)
        // veya gerçek yetki problemi olur. EditOnce modunda update zaten admin'e ait.
        if (!isEditOnceMode) {
          setError(t('matchmakingPage.form.errors.usernameTaken'));
        } else {
          setError(t('matchmakingPage.form.errors.permissionDenied'));
        }
      } else if (code === 'unauthenticated') {
        setError(t('matchmakingPage.form.errors.mustLogin'));
      } else if (typeof code === 'string' && (code.startsWith('storage/') || code.startsWith('cloudinary/'))) {
        const baseMsg = t('matchmakingPage.form.errors.photoUploadFailed');
        const detail = typeof err?.message === 'string' ? err.message.trim() : '';
        const missingCandidate =
          (err?.details?.missing && typeof err.details.missing === 'object' ? err.details.missing : null) ||
          (err?.details?.signed?.missing && typeof err.details.signed.missing === 'object' ? err.details.signed.missing : null);
        const missingObj = missingCandidate;
        const missingKeys = missingObj
          ? Object.keys(missingObj).filter((k) => missingObj[k]).join(', ')
          : '';
        const missingLine = missingKeys ? `\nEksik env: ${missingKeys}` : '';
        const withDetail = detail && detail !== 'Cloudinary upload failed'
          ? `${baseMsg}\n\nDetay: ${detail}${missingLine}`
          : baseMsg;
        setError(withDetail);
      } else {
        setError(t('matchmakingPage.form.errors.submitFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] text-white relative" id="matchmaking-top">
      <Navigation />

      {/* Background (Uniqah theme) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(255,215,128,0.18),rgba(255,215,128,0)_60%)]" />
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),rgba(99,102,241,0)_60%)]" />
        <div className="absolute bottom-0 -right-24 w-[620px] h-[620px] bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.14),rgba(20,184,166,0)_60%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <main className="relative max-w-3xl mx-auto px-4 pt-16 md:pt-20 pb-12">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/10 via-white/[0.06] to-transparent shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.35),rgba(245,158,11,0)_60%)] blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.34),rgba(99,102,241,0)_60%)] blur-2xl" />
          </div>

          <div className="relative p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-semibold tracking-wide">
                  <span className="text-white/90">{t('navigation.matchmaking')}</span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/80">{t('matchmakingHub.badge')}</span>
                </div>

                <h1 className="mt-4 text-2xl md:text-3xl font-semibold leading-tight">{t('matchmakingPage.title')}</h1>
                <p className="mt-3 text-sm md:text-base text-white/75 leading-relaxed">{t('matchmakingPage.intro')}</p>
              </div>

              <div className="flex-shrink-0 md:pt-1">
                <img
                  src={BRAND_LOGO_SRC}
                  alt={t('matchmakingHub.brandAlt')}
                  className="h-10 md:h-12 w-auto drop-shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/80">{t('matchmakingPage.privacyNote')}</p>
            </div>
          </div>
        </div>

        {isAuthGate ? (
          <div className="mt-6 rounded-[26px] border border-white/10 bg-white/5 p-6 md:p-7">
            <h2 className="text-lg font-semibold text-white">{t('matchmakingPage.title')}</h2>
            <p className="mt-2 text-white/80">{t('matchmakingPage.authGate.message')}</p>
            {loading && <p className="mt-1 text-sm text-white/60">{t('common.loading')}</p>}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 px-6 py-3 font-semibold text-sm shadow-[0_16px_40px_rgba(245,158,11,0.35)] hover:brightness-110 transition"
                to="/login"
                state={{ from: location.pathname, fromState: null }}
              >
                {t('matchmakingPage.authGate.login')}
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/10 text-white px-6 py-3 font-semibold text-sm hover:bg-white/[0.14] transition"
                to="/login?mode=signup"
                state={{
                  from: location.pathname,
                  fromState: {
                    showMatchmakingIntro: true,
                    matchmakingNext: location.pathname,
                  },
                }}
              >
                {t('matchmakingPage.authGate.signup')}
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/60">{t('matchmakingPage.authGate.note')}</p>
          </div>
        ) : (
          <div className="mt-6 text-white md:text-slate-900 p-0 md:rounded-[28px] md:border md:border-slate-200/80 md:bg-slate-100 md:shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:p-6">
          <form
            onSubmit={onSubmit}
            className="relative space-y-6 bg-transparent p-0 border-0 shadow-none md:rounded-2xl md:bg-slate-50 md:p-6 md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)] [&_input]:bg-white [&_select]:bg-white [&_textarea]:bg-white [&_input]:text-slate-900 [&_select]:text-slate-900 [&_textarea]:text-slate-900 [&_input]:placeholder:text-slate-400 [&_textarea]:placeholder:text-slate-400 [&_select]:placeholder:text-slate-400 [&_option]:text-slate-900 [&_input]:shadow-sm [&_select]:shadow-sm [&_textarea]:shadow-sm [&_input:focus-visible]:outline-none [&_select:focus-visible]:outline-none [&_textarea:focus-visible]:outline-none [&_input:focus-visible]:ring-2 [&_select:focus-visible]:ring-2 [&_textarea:focus-visible]:ring-2 [&_input:focus-visible]:ring-amber-300/60 [&_select:focus-visible]:ring-amber-300/60 [&_textarea:focus-visible]:ring-amber-300/60 [&_input:focus-visible]:border-amber-300 [&_select:focus-visible]:border-amber-300 [&_textarea:focus-visible]:border-amber-300"
          >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute -top-24 -right-20 w-72 h-72 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.18),rgba(245,158,11,0)_62%)]" />
            <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.14),rgba(99,102,241,0)_60%)]" />
          </div>
          <div className="relative">
          <div className="sr-only" aria-hidden="true">
            <label>
              Company
              <input
                value={form.hpCompany}
                onChange={onChange('hpCompany')}
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 text-sm">
              <div>{t('matchmakingPage.form.success')}</div>
              {lastApplicationId && (
                <div className="mt-1 text-xs text-emerald-900/80">
                  {t('matchmakingPage.form.applicationIdLabel')}: {lastApplicationId}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.username')}</label>
              <input
                value={form.username}
                onChange={onChange('username')}
                disabled={isEditOnceMode}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.username')}
              />
              {isEditOnceMode ? (
                <p className="mt-1 text-xs text-white/60 md:text-slate-600">{t('matchmakingPage.form.editOnce.usernameLocked')}</p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.fullName')}</label>
              <input
                value={form.fullName}
                onChange={onChange('fullName')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.fullName')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.age')}</label>
              <input
                value={form.age}
                onChange={onChange('age')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                inputMode="numeric"
                placeholder={t('matchmakingPage.form.placeholders.age')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.city')}</label>
              <input
                value={form.city}
                onChange={onChange('city')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.city')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.country')}</label>
              <input
                value={form.country}
                onChange={onChange('country')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.country')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.whatsapp')}</label>
              <input
                value={form.whatsapp}
                onChange={onChange('whatsapp')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.whatsapp')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.email')}</label>
              <input
                value={form.email}
                onChange={onChange('email')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.email')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.instagram')}</label>
              <input
                value={form.instagram}
                onChange={onChange('instagram')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.instagram')}
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {t('matchmakingPage.form.contactPrivacyNotice')}
          </div>

          <div className="rounded-none border-0 md:rounded-xl md:border md:border-slate-200 p-0 md:p-4">
            <p className="text-sm font-semibold text-white md:text-slate-900">{t('matchmakingPage.form.sections.moreDetails')}</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.height')}</label>
                <input
                  value={form.heightCm}
                  onChange={onChange('heightCm')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  inputMode="numeric"
                  placeholder={t('matchmakingPage.form.placeholders.height')}
                />
              </div>
              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.weight')}</label>
                <input
                  value={form.weightKg}
                  onChange={onChange('weightKg')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  inputMode="numeric"
                  placeholder={t('matchmakingPage.form.placeholders.weight')}
                />
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.occupation')}</label>
                <select
                  value={form.occupation}
                  onChange={onChange('occupation')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {occupationOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.education')}</label>
                <select
                  value={form.education}
                  onChange={onEducationChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {educationOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {(form.education === 'university' || form.education === 'masters' || form.education === 'phd') && (
                <div>
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.educationDepartment')}</label>
                  <input
                    value={form.educationDepartment}
                    onChange={onChange('educationDepartment')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.educationDepartment')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.maritalStatus')}</label>
                <select
                  value={form.maritalStatus}
                  onChange={onChange('maritalStatus')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {maritalStatusOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.hasChildren')}</label>
                <select
                  value={form.hasChildren}
                  onChange={onChange('hasChildren')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {yesNoOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.hasChildren === 'yes' && (
                <div>
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.childrenCount')}</label>
                  <input
                    value={form.childrenCount}
                    onChange={onChange('childrenCount')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    inputMode="numeric"
                    placeholder={t('matchmakingPage.form.placeholders.childrenCount')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.incomeLevel')}</label>
                <select
                  value={form.incomeLevel}
                  onChange={onChange('incomeLevel')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {incomeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.religion')}</label>
                <select
                  value={form.religion}
                  onChange={onChange('religion')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {religionOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.nativeLanguage')}</label>
                <select
                  value={form.nativeLanguage}
                  onChange={onNativeLanguageChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('matchmakingPage.form.options.common.select')}</option>
                  {communicationLanguageOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.nativeLanguage === 'other' && (
                <div>
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.nativeLanguageOther')}</label>
                  <input
                    value={form.nativeLanguageOther}
                    onChange={onChange('nativeLanguageOther')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.nativeLanguageOther')}
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.foreignLanguages')}</label>
                <p className="mt-1 text-xs text-white/60 md:text-slate-600">{t('matchmakingPage.form.hints.multiSelect')}</p>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  <label className="block">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={Array.isArray(form.foreignLanguages) ? form.foreignLanguages.includes('none') : false}
                      onChange={toggleForeignLanguage('none')}
                    />
                    <div className="relative flex items-center rounded-xl border border-slate-200 bg-white pl-9 pr-2 py-1.5 text-[13px] md:pl-10 md:pr-3 md:py-2 md:text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 peer-checked:border-amber-200 peer-checked:bg-gradient-to-r peer-checked:from-amber-300 peer-checked:to-amber-500 peer-checked:text-slate-950">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-4 w-4 items-center justify-center rounded border border-slate-400 bg-white/80">
                        <span className="text-[11px] leading-none opacity-0 transition peer-checked:opacity-100">✓</span>
                      </span>
                      <span className="flex-1 whitespace-normal break-words leading-snug">{t('matchmakingPage.form.options.foreignLanguages.none')}</span>
                    </div>
                  </label>
                  {communicationLanguageOptions
                    .filter((opt) => opt.id !== form.nativeLanguage && opt.id !== 'translation_app')
                    .map((opt) => (
                      <label key={opt.id} className="block">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={Array.isArray(form.foreignLanguages) ? form.foreignLanguages.includes(opt.id) : false}
                          onChange={toggleForeignLanguage(opt.id)}
                        />
                        <div className="relative flex items-center rounded-xl border border-slate-200 bg-white pl-9 pr-2 py-1.5 text-[13px] md:pl-10 md:pr-3 md:py-2 md:text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 peer-checked:border-amber-200 peer-checked:bg-gradient-to-r peer-checked:from-amber-300 peer-checked:to-amber-500 peer-checked:text-slate-950">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-4 w-4 items-center justify-center rounded border border-slate-400 bg-white/80">
                            <span className="text-[11px] leading-none opacity-0 transition peer-checked:opacity-100">✓</span>
                          </span>
                          <span className="flex-1 whitespace-normal break-words leading-snug">{opt.label}</span>
                        </div>
                      </label>
                    ))}
                </div>
                <p className="mt-1 text-xs text-white/60 md:text-slate-600">{t('matchmakingPage.form.hints.foreignLanguages')}</p>
              </div>

              {(form.foreignLanguages || []).includes('other') && (
                <div className="md:col-span-2">
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.foreignLanguageOther')}</label>
                  <input
                    value={form.foreignLanguageOther}
                    onChange={onChange('foreignLanguageOther')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.foreignLanguageOther')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.communicationLanguages')}</label>
                <select
                  value={form.communicationLanguage}
                  onChange={onChange('communicationLanguage')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('matchmakingPage.form.options.common.select')}</option>
                  {communicationLanguageOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.communicationLanguage === 'other' && (
                <div>
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.communicationLanguageOther')}</label>
                  <input
                    value={form.communicationLanguageOther}
                    onChange={onChange('communicationLanguageOther')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.communicationLanguageOther')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.smoking')}</label>
                <select
                  value={form.smoking}
                  onChange={onChange('smoking')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {yesNoOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.alcohol')}</label>
                <select
                  value={form.alcohol}
                  onChange={onChange('alcohol')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {yesNoOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.religiousValues')}</label>
                <select
                  value={form.religiousValues}
                  onChange={onChange('religiousValues')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {religiousValuesOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.familyApprovalStatus')}</label>
                <select
                  value={form.familyApprovalStatus}
                  onChange={onChange('familyApprovalStatus')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {yesNoMaybeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.marriageTimeline')}</label>
                <select
                  value={form.marriageTimeline}
                  onChange={onChange('marriageTimeline')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {marriageTimelineOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.relocationWillingness')}</label>
                <select
                  value={form.relocationWillingness}
                  onChange={onChange('relocationWillingness')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {yesNoMaybeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.preferredLivingCountry')}</label>
                <select
                  value={form.preferredLivingCountry}
                  onChange={onChange('preferredLivingCountry')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {livingCountryOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-none border-0 md:rounded-xl md:border md:border-slate-200 p-0 md:p-4">
              <p className="text-sm font-semibold text-white md:text-slate-900">{t('matchmakingPage.form.sections.me')}</p>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.nationality')}</label>
                  <select
                    value={form.nationality}
                    onChange={onChange('nationality')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {nationalityOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.gender')}</label>
                  <select
                    value={form.gender}
                    onChange={onChange('gender')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {genderOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-none border-0 md:rounded-xl md:border md:border-slate-200 p-0 md:p-4">
              <p className="text-sm font-semibold text-white md:text-slate-900">{t('matchmakingPage.form.sections.lookingFor')}</p>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.lookingForNationality')}</label>
                  <select
                    value={form.lookingForNationality}
                    onChange={onChange('lookingForNationality')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {nationalityOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.lookingForGender')}</label>
                  <select
                    value={form.lookingForGender}
                    onChange={onChange('lookingForGender')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {genderOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.photos')}</label>
            {isEditOnceMode ? (
              <p className="mt-2 text-xs text-white/60 md:text-slate-600">{t('matchmakingPage.form.editOnce.photosLocked')}</p>
            ) : (
              <>
                <div className="mt-2 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.photo1')}</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        id="matchmaking-photo1"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFiles((p) => ({ ...p, photo1: e.target.files?.[0] || null }))}
                        className="sr-only"
                      />
                      <label
                        htmlFor="matchmaking-photo1"
                        className="inline-flex cursor-pointer items-center rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:border-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                      >
                        {t('matchmakingPage.form.photo.choose')}
                      </label>
                      <span className="min-w-0 flex-1 text-xs text-white/60 md:text-slate-600 break-all">
                        {photoFiles.photo1?.name || t('matchmakingPage.form.photo.noFileChosen')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.photo2')}</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        id="matchmaking-photo2"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFiles((p) => ({ ...p, photo2: e.target.files?.[0] || null }))}
                        className="sr-only"
                      />
                      <label
                        htmlFor="matchmaking-photo2"
                        className="inline-flex cursor-pointer items-center rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:border-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                      >
                        {t('matchmakingPage.form.photo.choose')}
                      </label>
                      <span className="min-w-0 flex-1 text-xs text-white/60 md:text-slate-600 break-all">
                        {photoFiles.photo2?.name || t('matchmakingPage.form.photo.noFileChosen')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.photo3')}</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        id="matchmaking-photo3"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFiles((p) => ({ ...p, photo3: e.target.files?.[0] || null }))}
                        className="sr-only"
                      />
                      <label
                        htmlFor="matchmaking-photo3"
                        className="inline-flex cursor-pointer items-center rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:border-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                      >
                        {t('matchmakingPage.form.photo.choose')}
                      </label>
                      <span className="min-w-0 flex-1 text-xs text-white/60 md:text-slate-600 break-all">
                        {photoFiles.photo3?.name || t('matchmakingPage.form.photo.noFileChosen')}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/60 md:text-slate-600">{t('matchmakingPage.form.photoHint')}</p>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.about')}</label>
            <textarea
              value={form.about}
              onChange={onChange('about')}
              className="mt-1 w-full min-h-[110px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-300/60"
              placeholder={t('matchmakingPage.form.placeholders.about')}
            />
          </div>

          <div className="rounded-none border-0 md:rounded-xl md:border md:border-slate-200 p-0 md:p-4">
            <p className="text-sm font-semibold text-white md:text-slate-900">{t('matchmakingPage.form.sections.partnerPreferences')}</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerHeightMin')}</label>
                <select
                  value={form.partnerHeightMinCm}
                  onChange={onChange('partnerHeightMinCm')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('matchmakingPage.form.options.common.select')}</option>
                  <option value="any">{t('matchmakingPage.form.options.common.doesntMatter')}</option>
                  {heightRangeOptions.map((cm) => (
                    <option key={cm} value={cm}>
                      {cm} cm
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerHeightMax')}</label>
                <select
                  value={form.partnerHeightMaxCm}
                  onChange={onChange('partnerHeightMaxCm')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('matchmakingPage.form.options.common.select')}</option>
                  <option value="any">{t('matchmakingPage.form.options.common.doesntMatter')}</option>
                  {heightRangeOptions.map((cm) => (
                    <option key={cm} value={cm}>
                      {cm} cm
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerAgeMaxOlderYears')}</label>
                    <select
                      value={form.partnerAgeMaxOlderYears}
                      onChange={onChange('partnerAgeMaxOlderYears')}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      {partnerAgeDiffOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerAgeMaxYoungerYears')}</label>
                    <select
                      value={form.partnerAgeMaxYoungerYears}
                      onChange={onChange('partnerAgeMaxYoungerYears')}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      {partnerAgeDiffOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {partnerAgeMinForUi !== null && partnerAgeMaxForUi !== null ? (
                  <p className="mt-1 text-xs text-white/60 md:text-slate-600">
                    {t('matchmakingPage.form.hints.partnerAgeComputed', { min: partnerAgeMinForUi, max: partnerAgeMaxForUi })}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-white/60 md:text-slate-600">{t('matchmakingPage.form.hints.partnerAgeNeedsYourAge')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerMaritalStatus')}</label>
                <select
                  value={form.partnerMaritalStatus}
                  onChange={onChange('partnerMaritalStatus')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerMaritalStatusOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerReligion')}</label>
                <select
                  value={form.partnerReligion}
                  onChange={onChange('partnerReligion')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {religionOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerCommunicationLanguages')}</label>
                <p className="mt-1 text-xs text-white/60 md:text-slate-600">{t('matchmakingPage.form.hints.multiSelect')}</p>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2">
                  {partnerCommunicationMethodOptions.map((opt) => (
                    <label key={opt.id} className="block">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={Array.isArray(form.partnerCommunicationMethods) ? form.partnerCommunicationMethods.includes(opt.id) : false}
                        onChange={() => {
                          setForm((prev) => {
                            const list = Array.isArray(prev.partnerCommunicationMethods) ? prev.partnerCommunicationMethods : [];
                            const next = list.includes(opt.id) ? list.filter((x) => x !== opt.id) : [...list, opt.id];
                            return { ...prev, partnerCommunicationMethods: next };
                          });
                        }}
                      />
                      <div className="relative flex items-center rounded-xl border border-slate-200 bg-white pl-9 pr-2 py-1.5 text-[13px] md:pl-10 md:pr-3 md:py-2 md:text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 peer-checked:border-amber-200 peer-checked:bg-gradient-to-r peer-checked:from-amber-300 peer-checked:to-amber-500 peer-checked:text-slate-950">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-4 w-4 items-center justify-center rounded border border-slate-400 bg-white/80">
                          <span className="text-[11px] leading-none opacity-0 transition peer-checked:opacity-100">✓</span>
                        </span>
                        <span className="flex-1 whitespace-normal break-words leading-snug">
                          {opt.id === 'own_language'
                            ? partnerOwnLanguageLabelForUi
                            : opt.id === 'foreign_language'
                              ? partnerForeignLanguageLabelForUi
                              : opt.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerLivingCountry')}</label>
                <select
                  value={form.partnerLivingCountry}
                  onChange={onChange('partnerLivingCountry')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {livingCountryOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerSmokingPreference')}</label>
                <select
                  value={form.partnerSmokingPreference}
                  onChange={onChange('partnerSmokingPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {yesNoDoesntMatterOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerAlcoholPreference')}</label>
                <select
                  value={form.partnerAlcoholPreference}
                  onChange={onChange('partnerAlcoholPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {yesNoDoesntMatterOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerChildrenPreference')}</label>
                <select
                  value={form.partnerChildrenPreference}
                  onChange={onChange('partnerChildrenPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerChildrenPreferenceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerEducationPreference')}</label>
                <select
                  value={form.partnerEducationPreference}
                  onChange={onChange('partnerEducationPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerEducationPreferenceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerOccupationPreference')}</label>
                <select
                  value={form.partnerOccupationPreference}
                  onChange={onChange('partnerOccupationPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerOccupationPreferenceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerFamilyValuesPreference')}</label>
                <select
                  value={form.partnerFamilyValuesPreference}
                  onChange={onChange('partnerFamilyValuesPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerFamilyValuesPreferenceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.expectations')}</label>
              <textarea
                value={form.expectations}
                onChange={onChange('expectations')}
                className="mt-1 w-full min-h-[90px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-300/60"
                placeholder={t('matchmakingPage.form.placeholders.expectations')}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-none border-0 md:rounded-xl md:border md:border-slate-200 p-0 md:p-4">
            <label className="flex items-start gap-3 text-sm text-white/80 md:text-slate-800">
              <input type="checkbox" checked={form.consent18Plus} onChange={onChange('consent18Plus')} className="mt-1" />
              <span>{t('matchmakingPage.form.consents.age', { minAge: form.nationality === 'id' ? 21 : 18 })}</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-white/80 md:text-slate-800">
              <input type="checkbox" checked={form.consentPrivacy} onChange={onChange('consentPrivacy')} className="mt-1" />
              <span>
                <Trans
                  i18nKey="matchmakingPage.form.consents.privacy"
                  components={{
                    privacyLink: (
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-200 md:text-sky-700 hover:underline font-semibold"
                      />
                    ),
                  }}
                />
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-white/80 md:text-slate-800">
              <input type="checkbox" checked={form.consentTerms} onChange={onChange('consentTerms')} className="mt-1" />
              <span>
                <Trans
                  i18nKey="matchmakingPage.form.consents.terms"
                  components={{
                    termsLink: (
                      <a
                        href="/docs/matchmaking-kullanim-sozlesmesi.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-200 md:text-sky-700 hover:underline font-semibold"
                      />
                    ),
                  }}
                />
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-white/80 md:text-slate-800">
              <input type="checkbox" checked={form.consentPhotoShare} onChange={onChange('consentPhotoShare')} className="mt-1" />
              <span>{t('matchmakingPage.form.consents.photo')}</span>
            </label>
          </div>

          <div ref={submitFeedbackRef} />
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-56 sm:mx-auto rounded-full bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 font-semibold py-3 shadow-[0_16px_40px_rgba(245,158,11,0.25)] hover:brightness-110 transition disabled:opacity-60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            aria-busy={submitting ? 'true' : 'false'}
          >
            {submitting ? t('matchmakingPage.form.submitting') : t('matchmakingPage.form.submit')}
          </button>

          <p className="text-xs text-white/60 md:text-slate-500">{t('matchmakingPage.bottomNote')}</p>
          </div>
          </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
