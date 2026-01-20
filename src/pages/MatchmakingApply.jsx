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
        const q = query(collection(db, 'matchmakingApplications'), where('userId', '==', user.uid), limit(1));
        const snap = await getDocs(q);
        if (cancelled) return;
        if (!snap.empty) {
          const id = snap.docs[0]?.id;
          navigate('/panel', { replace: true, state: { from: 'applyRedirectExisting', applicationId: id } });
        }
      } catch (e) {
        // ignore (rules/index/config) - kullanıcı yine formu görebilir.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, user?.uid]);

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

  const educationOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'secondary', label: t('matchmakingPage.form.options.education.secondary') },
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
    nationality: 'tr',
    gender: 'male',
    lookingForNationality: 'id',
    lookingForGender: 'female',
    heightCm: '',
    weightKg: '',
    occupation: '',
    education: '',
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
    partnerCommunicationLanguage: '',
    partnerCommunicationLanguageOther: '',
    partnerCanCommunicateWithTranslationApp: '',
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
      // "none" (bilmiyorum) seçeneği diğerleriyle birlikte seçilemesin.
      let next = exists ? list.filter((x) => x !== code) : [...list, code];
      if (code === 'none') {
        next = exists ? [] : ['none'];
      } else if (next.includes('none')) {
        next = next.filter((x) => x !== 'none');
      }
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
      return setError(t('matchmakingPage.form.errors.consentsRequired'));
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
    if (!requiredValue(form.partnerCommunicationLanguage)) return setError(t('matchmakingPage.form.errors.partnerCommunicationLanguage'));
    if (form.partnerCommunicationLanguage === 'other' && !requiredValue(form.partnerCommunicationLanguageOther)) {
      return setError(t('matchmakingPage.form.errors.partnerCommunicationLanguageOther'));
    }
    if (!requiredValue(form.partnerCanCommunicateWithTranslationApp)) {
      return setError(t('matchmakingPage.form.errors.partnerTranslationApp'));
    }
    if (!requiredValue(form.partnerLivingCountry)) return setError(t('matchmakingPage.form.errors.partnerLivingCountry'));
    if (!requiredValue(form.partnerSmokingPreference)) return setError(t('matchmakingPage.form.errors.partnerSmokingPreference'));
    if (!requiredValue(form.partnerAlcoholPreference)) return setError(t('matchmakingPage.form.errors.partnerAlcoholPreference'));
    if (!requiredValue(form.partnerChildrenPreference)) return setError(t('matchmakingPage.form.errors.partnerChildrenPreference'));
    if (!requiredValue(form.partnerEducationPreference)) return setError(t('matchmakingPage.form.errors.partnerEducationPreference'));
    if (!requiredValue(form.partnerOccupationPreference)) return setError(t('matchmakingPage.form.errors.partnerOccupationPreference'));
    if (!requiredValue(form.partnerFamilyValuesPreference)) return setError(t('matchmakingPage.form.errors.partnerFamilyValuesPreference'));

    if (!requiredValue(form.about)) return setError(t('matchmakingPage.form.errors.about'));
    if (!requiredValue(form.expectations)) return setError(t('matchmakingPage.form.errors.expectations'));

    if (!photoFiles.photo1) return setError(t('matchmakingPage.form.errors.photo1Required'));
    if (!photoFiles.photo2) return setError(t('matchmakingPage.form.errors.photo2Required'));
    if (!photoFiles.photo3) return setError(t('matchmakingPage.form.errors.photo3Required'));

    if (photoFiles.photo1 && !isImageFile(photoFiles.photo1)) return setError(t('matchmakingPage.form.errors.photoType'));
    if (photoFiles.photo2 && !isImageFile(photoFiles.photo2)) return setError(t('matchmakingPage.form.errors.photoType'));
    if (photoFiles.photo3 && !isImageFile(photoFiles.photo3)) return setError(t('matchmakingPage.form.errors.photoType'));

    const ageStr = String(form.age ?? '').trim();
    const ageNum = ageStr ? Number(ageStr) : null;
    if (ageStr && (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 99)) {
      return setError(t('matchmakingPage.form.errors.ageRange'));
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
      const docRef = doc(colRef);

      // Kullanıcı adı benzersiz olmalı (case-insensitive).
      try {
        const qLower = query(collection(db, 'matchmakingApplications'), where('usernameLower', '==', normalizedUsername), limit(1));
        const snapLower = await getDocs(qLower);
        if (!snapLower.empty) {
          return setError(t('matchmakingPage.form.errors.usernameTaken'));
        }

        const exact = String(form.username || '').trim();
        if (exact) {
          const qExact = query(collection(db, 'matchmakingApplications'), where('username', '==', exact), limit(1));
          const snapExact = await getDocs(qExact);
          if (!snapExact.empty) {
            return setError(t('matchmakingPage.form.errors.usernameTaken'));
          }
        }
      } catch (e) {
        // Hata olursa, kullanıcıyı yanlış yönlendirmemek için gönderimi durdur.
        console.error('username uniqueness check failed:', e);
        return setError(t('matchmakingPage.form.errors.submitFailed'));
      }

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

      const payload = {
        profileCode: String(form.username || '').trim(),
        username: String(form.username || '').trim(),
        usernameLower: normalizedUsername,
        fullName: String(form.fullName || '').trim(),
        age: ageNum,
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
          maritalStatus: form.maritalStatus || '',
          hasChildren: form.hasChildren || '',
          childrenCount: childrenCountNum,
          incomeLevel: form.incomeLevel || '',
          religion: form.religion || '',
          religiousValues: (form.religiousValues || '').trim(),
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
          communicationLanguage: form.partnerCommunicationLanguage || '',
          communicationLanguageOther:
            form.partnerCommunicationLanguage === 'other' ? String(form.partnerCommunicationLanguageOther).trim() : '',
          canCommunicateWithTranslationApp: form.partnerCanCommunicateWithTranslationApp === 'yes',
          translationAppPreference: form.partnerCanCommunicateWithTranslationApp || '',
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
        status: 'new',
      };

      await setDoc(docRef, payload);

      setLastApplicationId(docRef.id);

      try {
        localStorage.setItem('mk_apply_last_submit_at', String(Date.now()));
      } catch (err) {
        // ignore
      }

      navigate('/panel', {
        replace: true,
        state: { from: 'matchmakingApply', applicationId: docRef.id },
      });
      return;
    } catch (err) {
      console.error('matchmaking submit error:', err);
      const code = err?.code || err?.name || '';
      if (code === 'permission-denied') {
        setError(t('matchmakingPage.form.errors.permissionDenied'));
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
    <div className="min-h-screen bg-white" id="matchmaking-top">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{t('matchmakingPage.title')}</h1>
        <p className="mt-3 text-sm md:text-base text-slate-700 leading-relaxed">{t('matchmakingPage.intro')}</p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-800">{t('matchmakingPage.privacyNote')}</p>
        </div>

        {isAuthGate ? (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t('matchmakingPage.title')}</h2>
            <p className="mt-2 text-gray-700">{t('matchmakingPage.authGate.message')}</p>
            {loading && <p className="mt-1 text-sm text-gray-500">{t('common.loading')}</p>}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                to="/login"
                state={{ from: location.pathname, fromState: null }}
              >
                {t('matchmakingPage.authGate.login')}
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                to="/login?mode=signup"
                state={{
                  from: '/panel',
                  fromState: {
                    showMatchmakingIntro: true,
                    matchmakingNext: location.pathname,
                  },
                }}
              >
                {t('matchmakingPage.authGate.signup')}
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">{t('matchmakingPage.authGate.note')}</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-6">
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
              <label className="block text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.username')}</label>
              <input
                value={form.username}
                onChange={onChange('username')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.username')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.fullName')}</label>
              <input
                value={form.fullName}
                onChange={onChange('fullName')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.fullName')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.age')}</label>
              <input
                value={form.age}
                onChange={onChange('age')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                inputMode="numeric"
                placeholder={t('matchmakingPage.form.placeholders.age')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.city')}</label>
              <input
                value={form.city}
                onChange={onChange('city')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.city')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.country')}</label>
              <input
                value={form.country}
                onChange={onChange('country')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.country')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.whatsapp')}</label>
              <input
                value={form.whatsapp}
                onChange={onChange('whatsapp')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.whatsapp')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.email')}</label>
              <input
                value={form.email}
                onChange={onChange('email')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.email')}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.instagram')}</label>
              <input
                value={form.instagram}
                onChange={onChange('instagram')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.instagram')}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{t('matchmakingPage.form.sections.moreDetails')}</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.height')}</label>
                <input
                  value={form.heightCm}
                  onChange={onChange('heightCm')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  inputMode="numeric"
                  placeholder={t('matchmakingPage.form.placeholders.height')}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.weight')}</label>
                <input
                  value={form.weightKg}
                  onChange={onChange('weightKg')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  inputMode="numeric"
                  placeholder={t('matchmakingPage.form.placeholders.weight')}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.occupation')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.education')}</label>
                <select
                  value={form.education}
                  onChange={onChange('education')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {educationOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.maritalStatus')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.hasChildren')}</label>
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
                  <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.childrenCount')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.incomeLevel')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.religion')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.nativeLanguage')}</label>
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
                  <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.nativeLanguageOther')}</label>
                  <input
                    value={form.nativeLanguageOther}
                    onChange={onChange('nativeLanguageOther')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.nativeLanguageOther')}
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.foreignLanguages')}</label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Array.isArray(form.foreignLanguages) ? form.foreignLanguages.includes('none') : false}
                      onChange={toggleForeignLanguage('none')}
                    />
                    <span className="text-slate-800">{t('matchmakingPage.form.options.foreignLanguages.none')}</span>
                  </label>
                  {communicationLanguageOptions
                    .filter((opt) => opt.id !== form.nativeLanguage)
                    .map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Array.isArray(form.foreignLanguages) ? form.foreignLanguages.includes(opt.id) : false}
                          onChange={toggleForeignLanguage(opt.id)}
                          disabled={Array.isArray(form.foreignLanguages) ? form.foreignLanguages.includes('none') : false}
                        />
                        <span className="text-slate-800">{opt.label}</span>
                      </label>
                    ))}
                </div>
                <p className="mt-1 text-xs text-slate-600">{t('matchmakingPage.form.hints.foreignLanguages')}</p>
              </div>

              {(form.foreignLanguages || []).includes('other') && (
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.foreignLanguageOther')}</label>
                  <input
                    value={form.foreignLanguageOther}
                    onChange={onChange('foreignLanguageOther')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.foreignLanguageOther')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.communicationLanguages')}</label>
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
                  <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.communicationLanguageOther')}</label>
                  <input
                    value={form.communicationLanguageOther}
                    onChange={onChange('communicationLanguageOther')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.communicationLanguageOther')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.smoking')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.alcohol')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.religiousValues')}</label>
                <textarea
                  value={form.religiousValues}
                  onChange={onChange('religiousValues')}
                  className="mt-1 w-full min-h-[80px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder={t('matchmakingPage.form.placeholders.religiousValues')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.familyApprovalStatus')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.marriageTimeline')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.relocationWillingness')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.preferredLivingCountry')}</label>
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
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">{t('matchmakingPage.form.sections.me')}</p>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.nationality')}</label>
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
                  <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.gender')}</label>
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

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">{t('matchmakingPage.form.sections.lookingFor')}</p>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.lookingForNationality')}</label>
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
                  <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.lookingForGender')}</label>
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
            <label className="block text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.photos')}</label>
            <div className="mt-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t('matchmakingPage.form.labels.photo1')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFiles((p) => ({ ...p, photo1: e.target.files?.[0] || null }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t('matchmakingPage.form.labels.photo2')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFiles((p) => ({ ...p, photo2: e.target.files?.[0] || null }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t('matchmakingPage.form.labels.photo3')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFiles((p) => ({ ...p, photo3: e.target.files?.[0] || null }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600">{t('matchmakingPage.form.photoHint')}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.about')}</label>
            <textarea
              value={form.about}
              onChange={onChange('about')}
              className="mt-1 w-full min-h-[110px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder={t('matchmakingPage.form.placeholders.about')}
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{t('matchmakingPage.form.sections.partnerPreferences')}</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerHeightMin')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerHeightMax')}</label>
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
                    <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerAgeMaxOlderYears')}</label>
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
                    <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerAgeMaxYoungerYears')}</label>
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
                  <p className="mt-1 text-xs text-slate-600">
                    {t('matchmakingPage.form.hints.partnerAgeComputed', { min: partnerAgeMinForUi, max: partnerAgeMaxForUi })}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-600">{t('matchmakingPage.form.hints.partnerAgeNeedsYourAge')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerMaritalStatus')}</label>
                <select
                  value={form.partnerMaritalStatus}
                  onChange={onChange('partnerMaritalStatus')}
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerReligion')}</label>
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

              <div>
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerCommunicationLanguages')}</label>
                <select
                  value={form.partnerCommunicationLanguage}
                  onChange={onChange('partnerCommunicationLanguage')}
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

              {form.partnerCommunicationLanguage === 'other' && (
                <div>
                  <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerCommunicationLanguageOther')}</label>
                  <input
                    value={form.partnerCommunicationLanguageOther}
                    onChange={onChange('partnerCommunicationLanguageOther')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.partnerCommunicationLanguageOther')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerTranslationApp')}</label>
                <select
                  value={form.partnerCanCommunicateWithTranslationApp}
                  onChange={onChange('partnerCanCommunicateWithTranslationApp')}
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerLivingCountry')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerSmokingPreference')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerAlcoholPreference')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerChildrenPreference')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerEducationPreference')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerOccupationPreference')}</label>
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
                <label className="block text-sm text-slate-700">{t('matchmakingPage.form.labels.partnerFamilyValuesPreference')}</label>
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
              <label className="block text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.expectations')}</label>
              <textarea
                value={form.expectations}
                onChange={onChange('expectations')}
                className="mt-1 w-full min-h-[90px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.expectations')}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-4">
            <label className="flex items-start gap-3 text-sm text-slate-800">
              <input type="checkbox" checked={form.consent18Plus} onChange={onChange('consent18Plus')} className="mt-1" />
              <span>{t('matchmakingPage.form.consents.age')}</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-800">
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
                        className="text-sky-700 hover:underline font-semibold"
                      />
                    ),
                  }}
                />
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-800">
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
                        className="text-sky-700 hover:underline font-semibold"
                      />
                    ),
                  }}
                />
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-800">
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
            className="w-full rounded-xl bg-rose-600 text-white font-semibold py-3 hover:bg-rose-700 transition disabled:opacity-60 active:scale-[0.99] active:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
            aria-busy={submitting ? 'true' : 'false'}
          >
            {submitting ? t('matchmakingPage.form.submitting') : t('matchmakingPage.form.submit')}
          </button>

          <p className="text-xs text-slate-500">{t('matchmakingPage.bottomNote')}</p>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
