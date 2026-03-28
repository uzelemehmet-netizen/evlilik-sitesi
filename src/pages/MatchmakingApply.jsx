import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebaseAuth';
import { db } from '../config/firebaseDb';
import { storage } from '../config/firebaseStorage';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '../auth/AuthProvider';
import { uploadImageToCloudinaryAuto } from '../utils/cloudinaryUpload';
import { authFetch } from '../utils/authFetch';
import { staticAssetUrl } from '../utils/staticAssetUrl';
import { tiktokTrack } from '../utils/tiktokPixel';
import { markFunnelApplyCompleted } from '../utils/funnelTracker';

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function selectedValuesFromSelectEvent(e) {
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

function isIndonesianNationality(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return false;
  if (s === 'id') return true;
  if (s === 'indonesia' || s === 'indonezya' || s === 'endonezya') return true;
  return s.includes('indonesia') || s.includes('indonezya') || s.includes('endonezya');
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

  const afterSaveOpenPhotoManager = useMemo(() => {
    try {
      return !!(location?.state && typeof location.state === 'object' && location.state.afterSaveOpenPhotoManager);
    } catch {
      return false;
    }
  }, [location?.state]);

  const afterSubmitOpenPhotoManager = useMemo(() => {
    try {
      return !!(location?.state && typeof location.state === 'object' && location.state.afterSubmitOpenPhotoManager);
    } catch {
      return false;
    }
  }, [location?.state]);

  const isEmbedded = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      return params.get('embed') === '1' || params.get('embedded') === '1';
    } catch {
      return false;
    }
  }, [location.search]);

  const [deferState, setDeferState] = useState({ loading: false, error: '' });

  const isEditOnceMode = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const raw = String(
        params.get('editOnce') ||
          params.get('editonce') ||
          params.get('edit_once') ||
          params.get('mode') ||
          ''
      )
        .trim()
        .toLowerCase();
      return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'editonce' || raw === 'edit_once' || raw === 'edit';
    } catch {
      return false;
    }
  }, [location.search]);

  const navigateToProfile = (state) => {
    const nextState = state && typeof state === 'object' ? state : undefined;
    if (isEmbedded) {
      try {
        if (typeof window !== 'undefined' && window.top && window.top !== window.self) {
          try {
            sessionStorage.setItem('mk_profile_skip_apply_inline_once', '1');
          } catch {
            // ignore
          }
          window.top.location.assign('/profilim');
          return;
        }
      } catch {
        // ignore
      }
    }
    navigate('/profilim', { replace: true, state: nextState });
  };

  const deferApply = async () => {
    const uid = String(user?.uid || '').trim();
    if (!uid) return;
    if (deferState.loading) return;

    setDeferState({ loading: true, error: '' });
    try {
      const ref = doc(db, 'matchmakingUsers', uid);
      await setDoc(
        ref,
        {
          applyDeferredAtMs: Date.now(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      navigateToProfile({ from: 'applyDeferred' });
    } catch {
      setDeferState({ loading: false, error: t('matchmakingPage.form.deferError') });
      return;
    }
    setDeferState({ loading: false, error: '' });
  };

  const isWizardMode = useMemo(() => {
    try {
      // Embedded view should default to wizard to avoid a very long single-page form.
      if (isEmbedded) return true;
      const params = new URLSearchParams(location.search || '');

      // Default: wizard ON (ürün kararı: form adım adım doldurulsun).
      // Explicit escape hatch (internal/debug): w=0 / wizard=0 / single=1.
      const single = params.get('single');
      const w = params.get('w');
      const wiz = params.get('wizard');
      if (single === '1') return false;
      if (w === '0' || wiz === '0') return false;
      if (w === '1' || wiz === '1') return true;
      return true;
    } catch {
      return !!isEmbedded;
    }
  }, [isEmbedded, location.search]);

  const WIZARD_TOTAL_STEPS = isEditOnceMode ? 3 : 1;
  const [wizardStep, setWizardStep] = useState(0);

  const wizardSteps = useMemo(() => {
    if (!isEditOnceMode) {
      return [
        {
          title: t('matchmakingPage.form.wizard.steps.basic.title'),
          desc: t('matchmakingPage.form.wizard.steps.basic.desc'),
        },
      ];
    }
    return [
      {
        title: t('matchmakingPage.form.wizard.steps.basic.title'),
        desc: t('matchmakingPage.form.wizard.steps.basic.desc'),
      },
      {
        title: t('matchmakingPage.form.wizard.steps.details.title'),
        desc: t('matchmakingPage.form.wizard.steps.details.desc'),
      },
      {
        title: t('matchmakingPage.form.wizard.steps.identity.title'),
        desc: t('matchmakingPage.form.wizard.steps.identity.desc'),
      },
    ];
  }, [t, isEditOnceMode]);

  const wizardCurrent = wizardSteps?.[wizardStep] || { title: '', desc: '' };
  const consentsWizardStep = isEditOnceMode ? 2 : 0;

  useEffect(() => {
    if (!isWizardMode) return;
    setWizardStep(0);
  }, [isWizardMode]);

  useEffect(() => {
    setWizardStep((s) => Math.max(0, Math.min(WIZARD_TOTAL_STEPS - 1, s)));
  }, [WIZARD_TOTAL_STEPS]);

  const BRAND_LOGO_SRC = staticAssetUrl('/brand-logo.webp');

  const submitFeedbackRef = useRef(null);
  const wizardTopRef = useRef(null);

  useEffect(() => {
    if (!isWizardMode) return;
    const el = wizardTopRef.current;
    if (!el) return;

    let prefersReducedMotion = false;
    try {
      prefersReducedMotion = !!window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    } catch {
      prefersReducedMotion = false;
    }

    const id = window.requestAnimationFrame(() => {
      try {
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      } catch {
        try {
          el.scrollIntoView();
        } catch {
          // ignore
        }
      }
    });

    return () => window.cancelAnimationFrame(id);
  }, [isWizardMode, wizardStep]);

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

          // Yeni ürün kararı: Daha önce başvuru yapılmış olsa bile kullanıcı bu sayfada kalabilsin
          // ve daha önce boş bıraktığı yerleri doldurabilsin.
          setExistingApplication({ id, ...data });

          setAutoPrefilled((prev) => {
            const next = { ...(prev && typeof prev === 'object' ? prev : {}) };
            if (safeStr(data?.username)) next.username = true;
            if (safeStr(data?.fullName)) next.fullName = true;
            if (data?.age === 0 || data?.age) next.age = true;
            if (safeStr(data?.city)) next.city = true;
            if (safeStr(data?.country)) next.country = true;
            if (safeStr(data?.gender)) next.gender = true;
            const details = data?.details && typeof data.details === 'object' ? data.details : {};
            if (safeStr(details?.occupation)) next.occupation = true;
            return next;
          });

          setForm((prev) => {
            const details = data?.details && typeof data.details === 'object' ? data.details : {};
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
              nationality: String(data?.nationality || prev.nationality || ''),
              gender: String(data?.gender || prev.gender || ''),
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
              childrenLivingSituation: String(details?.childrenLivingSituation || prev.childrenLivingSituation || ''),
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
              about: String(data?.about || prev.about || ''),

              consent18Plus: !!data?.consent18Plus,
              consentPrivacy: !!data?.consentPrivacy,
              consentPhotoShare: true,
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

  const [autoPrefilled, setAutoPrefilled] = useState({});

  // Kayıt sırasında zaten alınan temel bilgileri tekrar sormayalım.
  // matchmakingsUsers dokümanından best-effort prefill edip alanları gizleriz.
  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid) return;
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'matchmakingUsers', uid));
        if (cancelled) return;
        if (!snap.exists()) return;

        const mmUser = snap.data() || {};
        const application = mmUser?.application && typeof mmUser.application === 'object' ? mmUser.application : {};
        const publicProfile = mmUser?.publicProfile && typeof mmUser.publicProfile === 'object' ? mmUser.publicProfile : {};
        const details = application?.details && typeof application.details === 'object' ? application.details : {};

        const candidate = {
          username: safeStr(application?.username || publicProfile?.username || mmUser?.username),
          fullName: safeStr(application?.fullName || publicProfile?.fullName || mmUser?.fullName || user?.displayName),
          age:
            application?.age === 0 || application?.age
              ? String(application.age)
              : publicProfile?.age === 0 || publicProfile?.age
                ? String(publicProfile.age)
                : '',
          city: safeStr(application?.city || publicProfile?.city),
          country: safeStr(application?.country || publicProfile?.country),
          gender: safeStr(application?.gender || publicProfile?.gender),
          occupation: safeStr(details?.occupation || application?.occupation || publicProfile?.occupation),
        };

        setForm((prev) => {
          const next = { ...prev };
          const nextPrefilled = {};

          const maybeFill = (key, value) => {
            const prevVal = String(prev?.[key] ?? '').trim();
            const nextVal = String(value ?? '').trim();
            if (!prevVal && nextVal) {
              next[key] = nextVal;
              nextPrefilled[key] = true;
            }
          };

          maybeFill('username', candidate.username);
          maybeFill('fullName', candidate.fullName);
          maybeFill('age', candidate.age);
          maybeFill('city', candidate.city);
          maybeFill('country', candidate.country);
          maybeFill('gender', candidate.gender);
          maybeFill('occupation', candidate.occupation);

          if (!Object.keys(nextPrefilled).length) {
            return prev;
          }

          try {
            formRef.current = next;
          } catch {
            // ignore
          }
          setAutoPrefilled((p) => ({ ...(p && typeof p === 'object' ? p : {}), ...nextPrefilled }));

          return next;
        });
      } catch {
        // ignore (rules/missing) - kullanıcı yine formu doldurabilir.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.displayName, user?.uid]);

  const genderOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
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

  const childrenLivingSituationOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'with_children', label: t('matchmakingPage.form.options.childrenLivingSituation.withChildren') },
      { id: 'separate', label: t('matchmakingPage.form.options.childrenLivingSituation.separate') },
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

  const religiousValuesOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'weak', label: t('matchmakingPage.form.options.religiousValues.weak') },
      { id: 'medium', label: t('matchmakingPage.form.options.religiousValues.medium') },
      { id: 'conservative', label: t('matchmakingPage.form.options.religiousValues.conservative') },
    ],
    [t, i18n.language]
  );

  // livingCountryOptions kaldırıldı: ülke alanları artık tüm ülkeleri destekler.

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
    inviteCode: '',
    age: '',
    city: '',
    country: '',
    whatsapp: '',
    nationality: '',
    gender: '',
    heightCm: '',
    weightKg: '',
    occupation: '',
    education: '',
    educationDepartment: '',
    maritalStatus: '',
    hasChildren: '',
    childrenCount: '',
    childrenLivingSituation: '',
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
    about: '',
    consent18Plus: false,
    consentPrivacy: false,
    consentPhotoShare: true,
    consentTerms: false,
    hpCompany: '',
  });

  // React event batching can cause "select then immediately click next" to validate against stale state.
  // Keep a best-effort sync snapshot for validations.
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Communication preference question: replace the visible "other" option with "doesn't matter".
  // Keep legacy support if an existing value is still 'other'.
  const communicationLanguageDecisionOptions = useMemo(() => {
    const out = [];
    for (const opt of communicationLanguageOptions) {
      if (opt.id === 'other') continue;
      out.push(opt);
    }
    out.push({ id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') });

    if (String(form.communicationLanguage || '').trim() === 'other') {
      out.push({ id: 'other', label: t('matchmakingPage.form.options.commLanguage.other') });
    }

    const map = new Map();
    for (const opt of out) map.set(opt.id, opt);
    return Array.from(map.values());
  }, [t, i18n.language, communicationLanguageOptions, form.communicationLanguage]);

  const [genderConfirm, setGenderConfirm] = useState({ open: false, value: '' });
  const genderConfirmLabel = useMemo(() => {
    const v = String(genderConfirm?.value || '').trim();
    if (!v) return '';
    return genderOptions.find((opt) => opt.id === v)?.label || v;
  }, [genderConfirm?.value, genderOptions]);

  const [photoFiles, setPhotoFiles] = useState({ photo1: null, photo2: null, photo3: null });
  const [formOpenedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [lastApplicationId, setLastApplicationId] = useState('');

  const formElRef = useRef(null);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    if (!error) return;
    try {
      submitFeedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      // ignore
    }
  }, [error]);

  const onChange = (key) => (e) => {
    userInteractedRef.current = true;
    const value = e?.target?.type === 'checkbox' ? !!e.target.checked : e.target.value;
    try {
      formRef.current = { ...(formRef.current || {}), [key]: value };
    } catch {
      // ignore
    }
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const onGenderChange = (e) => {
    userInteractedRef.current = true;
    const next = String(e?.target?.value || '').trim();
    if (!next) {
      try {
        formRef.current = { ...(formRef.current || {}), gender: '' };
      } catch {
        // ignore
      }
      setForm((prev) => ({ ...prev, gender: '' }));
      if (error) setError('');
      return;
    }
    setGenderConfirm({ open: true, value: next });
    if (error) setError('');
  };

  const confirmGenderApply = () => {
    userInteractedRef.current = true;
    const g = String(genderConfirm?.value || '').trim();
    if (!g) {
      setGenderConfirm({ open: false, value: '' });
      return;
    }
    try {
      formRef.current = { ...(formRef.current || {}), gender: g };
    } catch {
      // ignore
    }
    setForm((prev) => ({ ...prev, gender: g }));
    setGenderConfirm({ open: false, value: '' });
  };

  const confirmGenderCancel = () => setGenderConfirm({ open: false, value: '' });

  const onEducationChange = (e) => {
    userInteractedRef.current = true;
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

  const onMaritalStatusChange = (e) => {
    userInteractedRef.current = true;
    const value = String(e?.target?.value || '');
    const normalized = value.trim().toLowerCase();
    const requiresChildrenInfo = normalized === 'widowed' || normalized === 'divorced';

    setForm((prev) => {
      const next = {
        ...prev,
        maritalStatus: value,
      };
      if (!requiresChildrenInfo) {
        next.hasChildren = '';
        next.childrenCount = '';
        next.childrenLivingSituation = '';
      }
      try {
        formRef.current = { ...(formRef.current || {}), ...next };
      } catch {
        // ignore
      }
      return next;
    });
    if (error) setError('');
  };

  const onHasChildrenChange = (e) => {
    const value = String(e?.target?.value || '');
    setForm((prev) => {
      const next = {
        ...prev,
        hasChildren: value,
      };
      if (value !== 'yes') {
        next.childrenCount = '';
        next.childrenLivingSituation = '';
      }
      try {
        formRef.current = { ...(formRef.current || {}), ...next };
      } catch {
        // ignore
      }
      return next;
    });
    if (error) setError('');
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

  const scrollWizardToTop = () => {
    try {
      document.getElementById('matchmaking-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      // ignore
    }
  };

  const validateWizardStep = (step) => {
    const requiredValue = (value) => String(value ?? '').trim();
    const f = (formRef.current && typeof formRef.current === 'object' ? formRef.current : form);
    const maritalStatus = String(f.maritalStatus || '').trim().toLowerCase();
    const requiresChildrenInfo = maritalStatus === 'widowed' || maritalStatus === 'divorced';

    if (step === 0) {
      const normalizedUsername = normalizeUsername(f.username);
      // Username: yeni başvuru için gerekli; ama kullanıcı zaten başvuru yaptıysa
      // mevcut başvuru id'si üzerinden update yapılabildiği için zorunlu değil.
      const hasExisting = !!(existingApplication && typeof existingApplication === 'object' && safeStr(existingApplication?.id));
      if (!hasExisting && !normalizedUsername) return setError(t('matchmakingPage.form.errors.username'));
      return true;
    }

    if (step === 1) {
      if (!isEditOnceMode) return true;
      return true;
    }

    if (step === 2) {
      if (!isEditOnceMode) return true;
      return true;
    }

    if (step === 3) {
      if (isEditOnceMode) return true;
      const minApplicantAge = isIndonesianNationality(form.nationality) ? 21 : 18;
      if (!form.consent18Plus || !form.consentPrivacy || !form.consentTerms) {
        return setError(t('matchmakingPage.form.errors.consentsRequired', { minAge: minApplicantAge }));
      }

      if (photoFiles.photo1 && !isImageFile(photoFiles.photo1)) return setError(t('matchmakingPage.form.errors.photoType'));
      if (photoFiles.photo2 && !isImageFile(photoFiles.photo2)) return setError(t('matchmakingPage.form.errors.photoType'));
      if (photoFiles.photo3 && !isImageFile(photoFiles.photo3)) return setError(t('matchmakingPage.form.errors.photoType'));
      return true;
    }

    return true;
  };

  const goWizardNext = () => {
    if (!isWizardMode) return;
    if (submitting) return;
    setError('');
    if (!validateWizardStep(wizardStep)) return;
    setWizardStep((s) => Math.min(WIZARD_TOTAL_STEPS - 1, s + 1));
    scrollWizardToTop();
  };

  const goWizardBack = () => {
    if (!isWizardMode) return;
    if (submitting) return;
    setError('');
    if (wizardStep <= 0) {
      if (isEditOnceMode) {
        const returnTo = String(location?.state?.returnTo || '').trim();
        if (returnTo) {
          if (isEmbedded) {
            try {
              if (typeof window !== 'undefined' && window.top && window.top !== window.self) {
                try {
                  sessionStorage.setItem('mk_profile_skip_apply_inline_once', '1');
                } catch {
                  // ignore
                }
                window.top.location.assign(returnTo);
                return;
              }
            } catch {
              // ignore
            }
          }
          navigate(returnTo, { replace: true });
          return;
        }

        // Default: bir önceki sayfaya dön; history yoksa profil.
        try {
          navigate(-1);
        } catch {
          navigateToProfile({ from: 'editOnceBack' });
        }
        return;
      }

      setWizardStep(0);
      scrollWizardToTop();
      return;
    }

    setWizardStep((s) => Math.max(0, s - 1));
    scrollWizardToTop();
  };

  const goBackPage = () => {
    if (submitting) return;
    setError('');

    if (!isEditOnceMode) {
      try {
        navigate(-1);
      } catch {
        navigateToProfile({ from: 'applyBack' });
      }
      return;
    }

    const returnTo = String(location?.state?.returnTo || '').trim();
    if (returnTo) {
      if (isEmbedded) {
        try {
          if (typeof window !== 'undefined' && window.top && window.top !== window.self) {
            try {
              sessionStorage.setItem('mk_profile_skip_apply_inline_once', '1');
            } catch {
              // ignore
            }
            window.top.location.assign(returnTo);
            return;
          }
        } catch {
          // ignore
        }
      }
      navigate(returnTo, { replace: true });
      return;
    }

    try {
      navigate(-1);
    } catch {
      navigateToProfile({ from: 'editOnceBack' });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLastApplicationId('');

    const minApplicantAge = isIndonesianNationality(form.nationality) ? 21 : 18;

    // Honeypot (botlar genelde doldurur)
    // Not: Bazı tarayıcı/eklenti autofill'leri gizli alanları doldurabiliyor.
    // Bu yüzden burada "başarılı" gösterip kaydı yutmuyoruz; kullanıcıya net uyarı veriyoruz.
    if (String(form.hpCompany || '').trim()) {
      console.warn('matchmaking honeypot triggered');
      return setError(t('matchmakingPage.form.errors.honeypotTriggered'));
    }

    if (!isEditOnceMode) {
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
      if (!form.consent18Plus || !form.consentPrivacy || !form.consentTerms) {
        return setError(t('matchmakingPage.form.errors.consentsRequired', { minAge: minApplicantAge }));
      }
    }

    const requiredValue = (value) => String(value ?? '').trim();

    const normalizedUsername = normalizeUsername(form.username);
    if (!normalizedUsername) {
      return setError(t('matchmakingPage.form.errors.username'));
    }

    if (!requiredValue(form.fullName)) return setError(t('matchmakingPage.form.errors.fullName'));

    const inviteCodeRaw = String(form.inviteCode || '').trim();
    const inviteCode = inviteCodeRaw.replace(/\s+/g, '');
    if (inviteCode && !/^\d{4}$/.test(inviteCode)) {
      return setError(t('matchmakingPage.form.errors.inviteCodeInvalid'));
    }

    if (!requiredValue(form.age)) return setError(t('matchmakingPage.form.errors.age'));
    if (!requiredValue(form.city)) return setError(t('matchmakingPage.form.errors.city'));
    if (!requiredValue(form.country)) return setError(t('matchmakingPage.form.errors.country'));

    if (!requiredValue(form.nationality)) return setError(t('matchmakingPage.form.errors.nationality'));
    if (!requiredValue(form.gender)) return setError(t('matchmakingPage.form.errors.gender'));

    if (!requiredValue(form.occupation)) return setError(t('matchmakingPage.form.errors.occupation'));
    if (!requiredValue(form.maritalStatus)) return setError(t('matchmakingPage.form.errors.maritalStatus'));

    const maritalStatus = String(form.maritalStatus || '').trim().toLowerCase();
    const requiresChildrenInfo = maritalStatus === 'widowed' || maritalStatus === 'divorced';

    if (requiresChildrenInfo) {
      if (!requiredValue(form.hasChildren)) return setError(t('matchmakingPage.form.errors.hasChildren'));
      if (form.hasChildren === 'yes' && !requiredValue(form.childrenCount)) {
        return setError(t('matchmakingPage.form.errors.childrenCount'));
      }
    }

    if (photoFiles.photo1 && !isImageFile(photoFiles.photo1)) return setError(t('matchmakingPage.form.errors.photoType'));
    if (photoFiles.photo2 && !isImageFile(photoFiles.photo2)) return setError(t('matchmakingPage.form.errors.photoType'));
    if (photoFiles.photo3 && !isImageFile(photoFiles.photo3)) return setError(t('matchmakingPage.form.errors.photoType'));

    const ageStr = String(form.age ?? '').trim();
    const ageNum = ageStr ? Number(ageStr) : null;
    if (ageStr && (!Number.isFinite(ageNum) || ageNum < minApplicantAge || ageNum > 99)) {
      return setError(t('matchmakingPage.form.errors.ageRange', { minAge: minApplicantAge }));
    }

    let childrenCountNum = toNumberOrNull(form.childrenCount);
    let childrenLivingSituation = String(form.childrenLivingSituation || '').trim() || null;
    if (requiresChildrenInfo && String(form.hasChildren || '') === 'yes') {
      // Evet seçildiyse: 1–20 arası zorunlu.
      if (childrenCountNum === null || childrenCountNum < 1 || childrenCountNum > 20) {
        return setError(t('matchmakingPage.form.errors.childrenCount'));
      }

      const allowed = new Set(['with_children', 'separate']);
      if (childrenLivingSituation && !allowed.has(childrenLivingSituation)) {
        return setError(t('matchmakingPage.form.errors.childrenLivingSituation'));
      }
      if (!childrenLivingSituation) childrenLivingSituation = null;
    } else {
      // Hayır/emin değilim seçildiyse sayıyı saklamayalım.
      childrenCountNum = null;
      childrenLivingSituation = null;
    }

    const heightNum = toNumberOrNull(form.heightCm);
    if (heightNum !== null && (heightNum < 120 || heightNum > 230)) return setError(t('matchmakingPage.form.errors.heightRange'));

    const weightNum = toNumberOrNull(form.weightKg);
    if (weightNum !== null && (weightNum < 35 || weightNum > 250)) return setError(t('matchmakingPage.form.errors.weightRange'));

    const currentUser = user || auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) {
      return setError(t('matchmakingPage.form.errors.mustLogin'));
    }

    setSubmitting(true);
    try {
      const uid = currentUser?.uid || auth.currentUser?.uid;
      if (!uid) throw new Error('Auth missing uid');

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
      const hasExistingId = !!(existingApplication && typeof existingApplication === 'object' && safeStr(existingApplication?.id));
      const docId = isEditOnceMode
        ? String(existingApplication?.id || '')
        : hasExistingId
          ? String(existingApplication?.id || '')
          : String(normalizedUsername || '').trim();
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

      const folder = `uniqah/matchmakingApplications/${docRef.id}`;
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
          try {
            photoUrls.push(await getDownloadURL(storageRef1));
          } catch {
            // ignore (rules/missing)
          }
        }

        if (compressed2) {
          const storageRef2 = ref(storage, `matchmakingApplications/${docRef.id}/photo2.jpg`);
          await uploadBytes(storageRef2, compressed2, { contentType: compressed2.type || 'image/jpeg' });
          photoPaths.push(storageRef2.fullPath);
          try {
            photoUrls.push(await getDownloadURL(storageRef2));
          } catch {
            // ignore (rules/missing)
          }
        }

        if (compressed3) {
          const storageRef3 = ref(storage, `matchmakingApplications/${docRef.id}/photo3.jpg`);
          await uploadBytes(storageRef3, compressed3, { contentType: compressed3.type || 'image/jpeg' });
          photoPaths.push(storageRef3.fullPath);
          try {
            photoUrls.push(await getDownloadURL(storageRef3));
          } catch {
            // ignore (rules/missing)
          }
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
        profileCode:
          allocatedProfileNo !== null ? `MK-${allocatedProfileNo}` : String(form.username || '').trim(),
        username: String(form.username || '').trim(),
        usernameLower: normalizedUsername,
        fullName: String(form.fullName || '').trim(),
        inviteCode4: inviteCode ? inviteCode : null,
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
        nationality: form.nationality || '',
        gender: form.gender || '',
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
          hasChildren: requiresChildrenInfo ? (form.hasChildren || '') : '',
          childrenCount: requiresChildrenInfo ? childrenCountNum : null,
          childrenLivingSituation: requiresChildrenInfo ? childrenLivingSituation : null,
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
        about: String(form.about || '').trim(),
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
        consentPhotoShare: true,
        consentTerms: !!form.consentTerms,
        lang: (i18n.language || 'tr').split('-')[0],
        source: 'site',
        // createdAt server-side set edilecek (API submit). Firestore direct create eskisi için.
        createdAt: serverTimestamp(),
        pool: {
          active: true,
          // addedAt server-side set edilecek (API submit). Firestore direct create eskisi için.
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
        delete editPayload.photoPaths;
        delete editPayload.photoCloudinary;
        delete editPayload.photoContentTypes;
        delete editPayload.photoOriginalTypes;

        if (editPayload.pool && typeof editPayload.pool === 'object') {
          const nextPool = { ...editPayload.pool };
          delete nextPool.addedAt;
          editPayload.pool = nextPool;
        }

        if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
          delete editPayload.photoUrls;
        }

        const editRes = await authFetch('/api/matchmaking-application-edit-once', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ payload: editPayload }),
        });

        const nextId =
          typeof editRes?.applicationId === 'string' && editRes.applicationId.trim() ? editRes.applicationId.trim() : docRef.id;
        setSuccess(true);
        setLastApplicationId(nextId);

        tiktokTrack('Lead', {
          source: 'matchmaking_apply',
          mode: 'edit_once',
          applicationId: nextId,
        });

        navigateToProfile({ from: 'matchmakingEditOnce', applicationId: nextId, openPhotoManager: afterSaveOpenPhotoManager });
        return;
      }

      // API üzerinden submit: write-once + PII engeli + TR<->ID çeviri server-side.
      // Not: Firestore serverTimestamp() sentinel'ları JSON'a çevrilemez; gönderirken çıkarıyoruz.
      const submitPayload = { ...payload };
      delete submitPayload.createdAt;
      if (submitPayload.pool && typeof submitPayload.pool === 'object') {
        const nextPool = { ...submitPayload.pool };
        delete nextPool.addedAt;
        submitPayload.pool = nextPool;
      }

      const submitRes = await authFetch('/api/matchmaking-application-submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ docId: docRef.id, payload: submitPayload }),
      });

      const nextId =
        typeof submitRes?.applicationId === 'string' && submitRes.applicationId.trim() ? submitRes.applicationId.trim() : docRef.id;
      setLastApplicationId(nextId);

      tiktokTrack('Lead', {
        source: 'matchmaking_apply',
        mode: 'apply_submit',
        applicationId: nextId,
      });

      // Davet kodu opsiyonel: varsa best-effort redeem et (bulunamazsa/yanlışsa başvuruyu bozmayalım).
      if (inviteCode) {
        try {
          await authFetch('/api/matchmaking-invite-code-redeem', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ code: inviteCode }),
          });
        } catch (e) {
          console.warn('invite code redeem failed (ignored):', e);
        }
      }

      try {
        localStorage.setItem('mk_apply_last_submit_at', String(Date.now()));
      } catch (err) {
        // ignore
      }

      // Funnel: signup -> apply completion
      markFunnelApplyCompleted();

      navigateToProfile({ from: 'matchmakingApply', applicationId: nextId, openPhotoManager: afterSubmitOpenPhotoManager });
      return;
    } catch (err) {
      console.error('matchmaking submit error:', err);
      const code = err?.code || err?.name || '';
      const apiMsg = typeof err?.message === 'string' ? err.message.trim() : '';
      if (code === 'permission-denied') {
        // Bu sayfada create izinleri dar; permission-denied en sık "doc zaten var" (username taken)
        // veya gerçek yetki problemi olur. EditOnce modunda update zaten admin'e ait.
        if (!isEditOnceMode) {
          setError(t('matchmakingPage.form.errors.usernameTaken'));
        } else {
          setError(t('matchmakingPage.form.errors.permissionDenied'));
        }
      } else if (apiMsg === 'username_taken') {
        setError(t('matchmakingPage.form.errors.usernameTaken'));
      } else if (apiMsg === 'already_submitted') {
        setError(t('matchmakingPage.form.errors.alreadySubmitted'));
      } else if (apiMsg === 'profile_text_pii_blocked') {
        setError(t('matchmakingPage.form.errors.profileTextPII'));
      } else if (apiMsg === 'contact_required') {
        setError(t('matchmakingPage.form.errors.contactRequired'));
      } else if (apiMsg === 'rate_limited') {
        setError(t('matchmakingPage.form.errors.rateLimited'));
      } else if (apiMsg === 'edit_once_used') {
        setError(t('matchmakingPage.form.errors.editOnceUsed'));
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
      {isEmbedded ? null : <Navigation />}

      {/* Background (Uniqah theme) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(255,215,128,0.18),rgba(255,215,128,0)_60%)]" />
        <div className="absolute -top-24 -left-24 w-[520px] h-[520px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),rgba(99,102,241,0)_60%)]" />
        <div className="absolute bottom-0 -right-24 w-[620px] h-[620px] bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.14),rgba(20,184,166,0)_60%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <main className={"relative max-w-3xl mx-auto px-4 " + (isEmbedded ? 'pt-6 pb-10' : 'pt-16 md:pt-20 pb-12')}>
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

            {/* Profil formu zorunlu: erteleme CTA'sı kaldırıldı. */}
          </div>
        </div>

        {isEditOnceMode ? (
          <div className="mt-6 rounded-[26px] border border-amber-300/30 bg-amber-500/10 p-5 md:p-6">
            <p className="text-sm text-amber-100">{t('matchmakingPage.form.editOnce.oneTimeWarning')}</p>
          </div>
        ) : null}

        {isAuthGate ? (
          <div className="mt-6 rounded-[26px] border border-white/10 bg-white/5 p-6 md:p-7">
            <h2 className="text-lg font-semibold text-white">{t('matchmakingPage.title')}</h2>
            <p className="mt-2 text-white/80">{t('matchmakingPage.authGate.message')}</p>
            {loading && <p className="mt-1 text-sm text-white/60">{t('common.loading')}</p>}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 px-6 py-3 font-semibold text-sm shadow-[0_16px_40px_rgba(245,158,11,0.35)] hover:brightness-110 transition"
                to="/login"
                state={{ from: `${location.pathname}${location.search || ''}`, fromState: null }}
              >
                {t('matchmakingPage.authGate.login')}
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full bg-white/10 border border-white/10 text-white px-6 py-3 font-semibold text-sm hover:bg-white/[0.14] transition"
                to="/login?mode=signup"
                state={{
                  from: `${location.pathname}${location.search || ''}`,
                  fromState: {
                    showMatchmakingIntro: true,
                    matchmakingNext: `${location.pathname}${location.search || ''}`,
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
            ref={formElRef}
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

          {isWizardMode ? (
            <div
              ref={wizardTopRef}
              className="rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] gemini-fade-up"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-bold tracking-wide text-white gemini-gradient gemini-organic-btn">
                    {t('matchmakingPage.form.wizard.badge')}
                    <span className="text-white/75">•</span>
                    <span className="text-white/95">
                      {t('matchmakingPage.form.wizard.step', { current: wizardStep + 1, total: WIZARD_TOTAL_STEPS })}
                    </span>
                  </div>

                  {wizardCurrent?.title ? (
                    <h2 className="mt-3 text-lg md:text-xl font-semibold text-white leading-snug">
                      {wizardCurrent.title}
                    </h2>
                  ) : null}
                  {wizardCurrent?.desc ? (
                    <p className="mt-1 text-sm text-white/70 leading-relaxed">{wizardCurrent.desc}</p>
                  ) : null}
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-white/60">{Math.round(((wizardStep + 1) / WIZARD_TOTAL_STEPS) * 100)}%</div>
                </div>
              </div>

              <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full gemini-gradient"
                  style={{ width: `${((wizardStep + 1) / WIZARD_TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>
          ) : null}

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

          {(!isWizardMode || wizardStep === 0) && (
            <div
              key={isWizardMode ? `wizard-step-${wizardStep}` : 'all-steps'}
              className={
                isWizardMode
                  ? 'rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] gemini-fade-up'
                  : ''
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {autoPrefilled.username ? null : (
                  <div>
                    <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.username')}</label>
                    <input
                      value={form.username}
                      onChange={onChange('username')}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder={t('matchmakingPage.form.placeholders.username')}
                    />
                  </div>
                )}
                {autoPrefilled.fullName ? null : (
                  <div>
                    <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.fullName')}</label>
                    <input
                      value={form.fullName}
                      onChange={onChange('fullName')}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder={t('matchmakingPage.form.placeholders.fullName')}
                    />
                  </div>
                )}

                {isEditOnceMode ? (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.inviteCode')}</label>
                    <input
                      value={form.inviteCode}
                      onChange={onChange('inviteCode')}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      inputMode="numeric"
                      placeholder={t('matchmakingPage.form.placeholders.inviteCode')}
                    />
                    <div className="mt-2 text-xs text-white/70 md:text-slate-600">{t('matchmakingPage.form.inviteCodeHelp')}</div>
                  </div>
                ) : null}

                {autoPrefilled.age ? null : (
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
                )}
                {autoPrefilled.city ? null : (
                  <div>
                    <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.city')}</label>
                    <input
                      value={form.city}
                      onChange={onChange('city')}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder={t('matchmakingPage.form.placeholders.city')}
                    />
                  </div>
                )}
                {autoPrefilled.country ? null : (
                  <div>
                    <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.country')}</label>
                    <input
                      value={form.country}
                      onChange={onChange('country')}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder={t('matchmakingPage.form.placeholders.country')}
                    />
                  </div>
                )}

                {!isEditOnceMode ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.nationality')}</label>
                      <input
                        value={form.nationality}
                        onChange={onChange('nationality')}
                        maxLength={60}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder={t('matchmakingPage.form.placeholders.country')}
                      />
                    </div>
                    {autoPrefilled.gender ? null : (
                      <div>
                        <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.gender')}</label>
                        <select
                          value={form.gender}
                          onChange={onGenderChange}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                          {genderOptions.map((opt) => (
                            <option key={opt.id} value={opt.id} disabled={!opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {autoPrefilled.occupation ? null : (
                      <div>
                        <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.occupation')}</label>
                        <input
                          value={form.occupation}
                          onChange={onChange('occupation')}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          placeholder={t('matchmakingPage.form.placeholders.occupation')}
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.maritalStatus')}</label>
                      <select
                        value={form.maritalStatus}
                        onChange={onMaritalStatusChange}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        {maritalStatusOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(String(form.maritalStatus || '').trim().toLowerCase() === 'widowed' ||
                      String(form.maritalStatus || '').trim().toLowerCase() === 'divorced') ? (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.hasChildren')}</label>
                          <select
                            value={form.hasChildren}
                            onChange={onHasChildrenChange}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          >
                            {yesNoOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {form.hasChildren === 'yes' ? (
                          <div>
                            <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.childrenCount')}</label>
                            <input
                              value={form.childrenCount}
                              onChange={onChange('childrenCount')}
                              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              inputMode="numeric"
                              placeholder={t('matchmakingPage.form.placeholders.childrenCount')}
                            />
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : null}

                <div>
                  <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.whatsapp')}</label>
                  <input
                    value={form.whatsapp}
                    onChange={onChange('whatsapp')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.whatsapp')}
                  />
                  <div className="mt-2 text-xs text-white/70 md:text-slate-600">{t('matchmakingPage.form.contactNumberNote')}</div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                {t('matchmakingPage.form.contactPrivacyNotice')}
              </div>
            </div>
          )}

          {isEditOnceMode && (!isWizardMode || wizardStep === 1) && (
          <div
            key={isWizardMode ? `wizard-step-${wizardStep}` : 'all-steps-more'}
            className={
              isWizardMode
                ? 'rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] gemini-fade-up'
                : 'rounded-none border-0 md:rounded-xl md:border md:border-slate-200 p-0 md:p-4'
            }
          >
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

              {autoPrefilled.occupation ? null : (
                <div>
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.occupation')}</label>
                  <input
                    value={form.occupation}
                    onChange={onChange('occupation')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.occupation')}
                  />
                </div>
              )}
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
                  onChange={onMaritalStatusChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {maritalStatusOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {(String(form.maritalStatus || '').trim().toLowerCase() === 'widowed' ||
                String(form.maritalStatus || '').trim().toLowerCase() === 'divorced') ? (
                <>
                  <div>
                    <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.hasChildren')}</label>
                    <select
                      value={form.hasChildren}
                      onChange={onHasChildrenChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      {yesNoOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.hasChildren === 'yes' ? (
                    <>
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

                      <div>
                        <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.childrenLivingSituation')}</label>
                        <select
                          value={form.childrenLivingSituation}
                          onChange={onChange('childrenLivingSituation')}
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        >
                          {childrenLivingSituationOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}

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
                  {communicationLanguageDecisionOptions.map((opt) => (
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
                <input
                  value={form.preferredLivingCountry}
                  onChange={onChange('preferredLivingCountry')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder={t('matchmakingPage.form.placeholders.country')}
                />
              </div>
            </div>
          </div>
          )}

          {isEditOnceMode && (!isWizardMode || wizardStep === 2) && (
          <div
            key={isWizardMode ? `wizard-step-${wizardStep}` : 'all-steps-identity'}
            className={
              isWizardMode
                ? 'rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] gemini-fade-up'
                : ''
            }
          >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-none border-0 md:rounded-xl md:border md:border-slate-200 p-0 md:p-4">
              <p className="text-sm font-semibold text-white md:text-slate-900">{t('matchmakingPage.form.sections.me')}</p>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.nationality')}</label>
                  <input
                    value={form.nationality}
                    onChange={onChange('nationality')}
                    maxLength={60}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.country')}
                  />
                </div>
                {autoPrefilled.gender ? null : (
                  <div>
                    <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.gender')}</label>
                    <select
                      value={form.gender}
                      onChange={onGenderChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      {genderOptions.map((opt) => (
                        <option key={opt.id} value={opt.id} disabled={!opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          </div>
          )}

          {genderConfirm.open ? (
            <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-6 overflow-y-auto">
              <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
                <div className="border-b border-slate-200 px-4 py-3 shrink-0">
                  <p className="font-semibold text-slate-900">{t('matchmakingPage.form.confirmGender.title')}</p>
                </div>
                <div className="px-4 py-4 overflow-y-auto flex-1">
                  <p className="text-sm text-slate-700">
                    {t('matchmakingPage.form.confirmGender.text', { gender: genderConfirmLabel })}
                  </p>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={confirmGenderCancel}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      {t('matchmakingPage.form.confirmGender.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={confirmGenderApply}
                      className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                    >
                      {t('matchmakingPage.form.confirmGender.confirm')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {(!isWizardMode || wizardStep === consentsWizardStep) && (
          <div
            key={isWizardMode ? `wizard-step-${wizardStep}-consents` : 'all-steps-consents'}
            className={
              isWizardMode
                ? 'rounded-[26px] border border-white/10 bg-white/5 p-5 md:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] gemini-fade-up'
                : ''
            }
          >
          {isEditOnceMode ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-white/90 md:text-slate-800">{t('matchmakingPage.form.labels.photos')}</label>
                <p className="mt-2 text-xs text-white/60 md:text-slate-600">{t('matchmakingPage.form.editOnce.photosLocked')}</p>
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
            </>
          ) : null}

          <div className={isWizardMode ? 'space-y-3' : 'space-y-3 rounded-none border-0 md:rounded-xl md:border md:border-slate-200 p-0 md:p-4'}>
            <label className="flex items-start gap-3 text-sm text-white/80 md:text-slate-800">
              <input type="checkbox" checked={form.consent18Plus} onChange={onChange('consent18Plus')} className="mt-1" />
              <span>{t('matchmakingPage.form.consents.age', { minAge: isIndonesianNationality(form.nationality) ? 21 : 18 })}</span>
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
                    kvkkLink: (
                      <a
                        href={i18n.language?.startsWith('en') ? '/docs/kvkk-information-notice-en.html' : '/docs/kvkk-aydinlatma-metni.html'}
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
          </div>

          </div>
          )}

          <div ref={submitFeedbackRef} />
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 text-sm">
              {error}
            </div>
          )}

          {isWizardMode ? (
            <div className="w-full">
              <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={goWizardBack}
                  disabled={submitting || (wizardStep <= 0 && !isEditOnceMode)}
                  className="w-full sm:w-40 gemini-organic-btn rounded-full bg-white/10 border border-white/15 text-white font-semibold py-3 hover:bg-white/[0.14] transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                >
                  {t('matchmakingPage.form.wizard.back')}
                </button>

                {wizardStep >= WIZARD_TOTAL_STEPS - 1 ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-56 gemini-organic-btn rounded-full gemini-gradient text-white font-semibold py-3 shadow-[0_18px_50px_rgba(244,63,94,0.20)] hover:brightness-110 transition disabled:opacity-60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    aria-busy={submitting ? 'true' : 'false'}
                  >
                    {submitting ? t('matchmakingPage.form.submitting') : t('matchmakingPage.form.submit')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goWizardNext}
                    disabled={submitting}
                    className="w-full sm:w-56 gemini-organic-btn rounded-full gemini-gradient text-white font-semibold py-3 shadow-[0_18px_50px_rgba(244,63,94,0.20)] hover:brightness-110 transition disabled:opacity-60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    {t('matchmakingPage.form.wizard.next')}
                  </button>
                )}
              </div>

              {isEditOnceMode && wizardStep > 0 ? (
                <div className="mt-3 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={goBackPage}
                    disabled={submitting}
                    className="w-full sm:w-56 gemini-organic-btn rounded-full bg-white/10 border border-white/15 text-white font-semibold py-3 hover:bg-white/[0.14] transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                  >
                    {t('matchmakingPage.form.wizard.backPage')}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              {isEditOnceMode ? (
                <button
                  type="button"
                  onClick={goBackPage}
                  disabled={submitting}
                  className="w-full sm:w-40 gemini-organic-btn rounded-full bg-white/10 border border-white/15 text-white md:text-slate-900 md:bg-white/80 md:border-slate-200 font-semibold py-3 hover:bg-white/[0.14] md:hover:bg-white transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                >
                  {t('matchmakingPage.form.wizard.back')}
                </button>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-56 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 text-slate-950 font-semibold py-3 shadow-[0_16px_40px_rgba(245,158,11,0.25)] hover:brightness-110 transition disabled:opacity-60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                aria-busy={submitting ? 'true' : 'false'}
              >
                {submitting ? t('matchmakingPage.form.submitting') : t('matchmakingPage.form.submit')}
              </button>
            </div>
          )}

          <p className="text-xs text-white/60 md:text-slate-500">{t('matchmakingPage.bottomNote')}</p>
          </div>
          </form>
          </div>
        )}
      </main>
      {isEmbedded ? null : <Footer />}
    </div>
  );
}
