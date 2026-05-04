import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebaseAuth';
import { db } from '../config/firebaseDb';
import { storage } from '../config/firebaseStorage';
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useAuth } from '../auth/AuthProvider';
import { uploadImageToCloudinaryAuto } from '../utils/cloudinaryUpload';
import { authFetch } from '../utils/authFetch';
import { staticAssetUrl } from '../utils/staticAssetUrl';
import { tiktokTrack } from '../utils/tiktokPixel';
import { markFunnelApplyCompleted } from '../utils/funnelTracker';
import { trackClick } from '../utils/clickTracker';
import { pickMatchmakingPhotoRefs } from '../utils/matchmakingProfileCompletion';
import { isRunningAsPwa } from '../utils/pwaInstalled';

const PHOTO_FIELD_KEYS = ['photo1', 'photo2', 'photo3', 'photo4', 'photo5'];
const IMAGE_FILE_NAME_RE = /\.(avif|bmp|gif|heic|heif|jpe?g|png|webp)$/i;
const DEFAULT_LOOKING_FOR_NATIONALITY = 'id';
const TOUR_FORCE_KEY = 'uniqah:tour:force';
const EMPTY_PHOTO_FILES = Object.freeze(
  PHOTO_FIELD_KEYS.reduce((acc, key) => {
    acc[key] = null;
    return acc;
  }, {})
);

function getBaseLang(raw) {
  const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'in') return 'id';
  if (base === 'tr' || base === 'en' || base === 'id') return base;
  return 'tr';
}

function getApplyPremiumUi(lang) {
  const copy = {
    tr: {
      heroFacts: [
        {
          title: 'Kisa ve secili form',
          body: 'Ilk adim uzun bir sorgu degil; sistemin sizi tanimasi icin gerekli cekirdek bilgiler istenir.',
        },
        {
          title: 'Profil herkese acik degil',
          body: 'Paylastiginiz bilgi ve fotograflar kontrollu akis icinde kullanilir; vitrin gibi yayinlanmaz.',
        },
        {
          title: 'Iletisim kilitli baslar',
          body: 'Temas hemen acilmaz; once uygunluk, sonra sistem ici akis ve karsilikli onay gerekir.',
        },
      ],
      editorialEyebrow: 'Basvuru masasi',
      editorialTitle: 'Iletisim bilgileriniz sadece sistem icin gereklidir',
      editorialBody: 'Kimseyle paylasilmaz.',
      formDeskTitle: 'Form boyunca neye dikkat ediyoruz?',
      formDeskBody: 'Netlik, mahremiyet ve kontrollu iletisim. Bu uc nokta, tum akis boyunca korunur.',
      footerNoteTitle: 'Formdan sonra ne olur?',
      footerNoteBody: 'Bilgileriniz sistem akisini hazirlar. Uygunluk, profil tamamlama ve temas adimlari topluca degil kontrollu sekilde acilir.',
    },
    en: {
      heroFacts: [
        {
          title: 'Short and selective form',
          body: 'The first step is not an endless questionnaire; it asks for the core details needed to place you correctly.',
        },
        {
          title: 'Your profile is not public',
          body: 'Your details and photos stay inside the controlled flow; they are not published like a showcase.',
        },
        {
          title: 'Contact starts locked',
          body: 'Contact does not open immediately; fit, in-system flow and mutual approval come first.',
        },
      ],
      editorialEyebrow: 'Application desk',
      editorialTitle: 'Your contact details are only required for the system',
      editorialBody: 'They are not shared with anyone.',
      formDeskTitle: 'What do we protect throughout this form?',
      formDeskBody: 'Clarity, privacy and controlled contact. Those three principles stay in place across the whole flow.',
      footerNoteTitle: 'What happens after the form?',
      footerNoteBody: 'Your details prepare the system flow. Fit, profile completion and contact do not open all at once; they open in a controlled sequence.',
    },
    id: {
      heroFacts: [
        {
          title: 'Form singkat dan terpilih',
          body: 'Langkah awal ini bukan pertanyaan panjang; hanya meminta inti informasi yang dibutuhkan sistem.',
        },
        {
          title: 'Profil tidak publik',
          body: 'Informasi dan foto Anda dipakai dalam alur terkontrol; tidak dipublikasikan seperti etalase.',
        },
        {
          title: 'Kontak tetap terkunci dulu',
          body: 'Kontak tidak langsung dibuka; kecocokan, alur sistem, dan persetujuan kedua pihak didahulukan.',
        },
      ],
      editorialEyebrow: 'Meja pengajuan',
      editorialTitle: 'Informasi kontak Anda hanya diperlukan untuk sistem',
      editorialBody: 'Tidak dibagikan kepada siapa pun.',
      formDeskTitle: 'Apa yang kami jaga sepanjang form ini?',
      formDeskBody: 'Kejelasan, privasi, dan kontak yang terkontrol. Tiga prinsip ini dijaga sepanjang alur.',
      footerNoteTitle: 'Apa yang terjadi setelah form?',
      footerNoteBody: 'Data Anda menyiapkan alur sistem. Kecocokan, kelengkapan profil, dan kontak tidak dibuka sekaligus; semuanya dibuka bertahap.',
    },
  };

  return copy[lang] || copy.tr;
}

function getApplyFlowUi(lang) {
  const copy = {
    tr: {
      shortTitle: 'Ilk kayit icin kisa basvuru',
      shortBody: 'Bu ilk ekranda sadece zorunlu bilgileri aliyoruz. Diger profil detaylarini daha sonra Profilim alanindan tamamlayabilirsiniz.',
      fullTitle: 'Profili tamamla',
      fullBody: 'Bu modda ek profil detaylarini ve es tercihlerini duzenleyebilirsiniz.',
      photoTitle: 'Fotograf',
      photoBody: 'Isterseniz simdi 1-5 fotograf ekleyin; isterseniz basvurudan sonra profilinizden yukleyin.',
      photoPrivacyBody: 'Fotograflariniz herkese acik paylasilmaz. Ancak etkilesim ozellikleri acilmadan once profilinizde en az 1 fotograf bulunmasi gerekir.',
      photoPrivacyBodyFemale: 'Kadin kullanicilar icin fotograf istege baglidir; fotograf yuklemeden de basvurunuz tamamlanir ve herhangi bir kisit uygulanmaz.',
      photoFormatWarning: 'Fotograflarinizin JPEG formatinda olmasina dikkat edin.',
      photoCta: 'Fotograf',
      photoHide: 'Fotografi gizle',
      photoDone: 'Tamamla',
      photoSlotLabel: 'Foto',
      photoEmpty: 'Bos slot',
      photoExisting: 'Kayitli',
      photoSelected: 'Yeni secildi',
      photoReplace: 'Fotograf sec',
      photoRemove: 'Secimi kaldir',
      photoCount: '{{count}} / 5 fotograf hazir',
      whatsappPrivacyBody: 'WhatsApp numaraniz tamamen gizli tutulur, baska kullanicilara gosterilmez. Gerektiginde size ulasabilmemiz icin sistem tarafindan saklanir.',
      shortBadge: 'Zorunlu alanlar',
      fullBadge: 'Tam profil modu',
    },
    en: {
      shortTitle: 'Short application for signup',
      shortBody: 'This first screen only collects the required fields. You can complete the rest later from your profile.',
      fullTitle: 'Complete your profile',
      fullBody: 'This mode lets you update optional profile details and partner preferences.',
      photoTitle: 'Photo',
      photoBody: 'Add 1-5 photos now if you want, or upload them later from your profile after submitting.',
      photoPrivacyBody: 'Your photos are not shared publicly with everyone. However, at least 1 photo must exist on your profile before interaction features unlock.',
      photoPrivacyBodyFemale: 'For women, photos are optional; your application can be completed without uploading a photo and no restriction will be applied.',
      photoFormatWarning: 'Please make sure your photos are in JPEG format.',
      photoCta: 'Photo',
      photoHide: 'Hide photos',
      photoDone: 'Done',
      photoSlotLabel: 'Photo',
      photoEmpty: 'Empty slot',
      photoExisting: 'Saved',
      photoSelected: 'New file selected',
      photoReplace: 'Choose photo',
      photoRemove: 'Remove selection',
      photoCount: '{{count}} / 5 photos ready',
      whatsappPrivacyBody: 'Your WhatsApp number is kept completely private and is not shown to other users. It is stored by the system so we can reach you when necessary.',
      shortBadge: 'Required only',
      fullBadge: 'Full profile mode',
    },
    id: {
      shortTitle: 'Form singkat untuk pendaftaran',
      shortBody: 'Layar pertama ini hanya meminta data wajib. Detail lain bisa dilengkapi nanti dari profil Anda.',
      fullTitle: 'Lengkapi profil',
      fullBody: 'Mode ini untuk melengkapi detail profil tambahan dan preferensi pasangan.',
      photoTitle: 'Foto',
      photoBody: 'Jika mau, tambahkan 1-5 foto sekarang; jika tidak, Anda bisa mengunggahnya nanti dari profil setelah pengajuan tersimpan.',
      photoPrivacyBody: 'Foto Anda tidak dibagikan secara publik ke semua orang. Namun, setidaknya 1 foto harus ada di profil sebelum fitur interaksi dibuka.',
      photoPrivacyBodyFemale: 'Untuk pengguna wanita, foto bersifat opsional; pengajuan tetap bisa selesai tanpa unggah foto dan tidak ada pembatasan yang diterapkan.',
      photoFormatWarning: 'Pastikan foto Anda menggunakan format JPEG.',
      photoCta: 'Foto',
      photoHide: 'Sembunyikan foto',
      photoDone: 'Selesai',
      photoSlotLabel: 'Foto',
      photoEmpty: 'Slot kosong',
      photoExisting: 'Tersimpan',
      photoSelected: 'File baru dipilih',
      photoReplace: 'Pilih foto',
      photoRemove: 'Hapus pilihan',
      photoCount: '{{count}} / 5 foto siap',
      whatsappPrivacyBody: 'Nomor WhatsApp Anda disimpan sepenuhnya rahasia dan tidak ditampilkan ke pengguna lain. Nomor ini disimpan oleh sistem agar kami bisa menghubungi Anda bila diperlukan.',
      shortBadge: 'Hanya wajib',
      fullBadge: 'Mode profil lengkap',
    },
  };

  return copy[lang] || copy.tr;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isImageFile(file) {
  if (!file) return false;
  if (typeof file.type === 'string' && file.type.startsWith('image/')) return true;
  return IMAGE_FILE_NAME_RE.test(String(file?.name || '').trim());
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function shouldKeepCurrentValue(currentValue) {
  if (typeof currentValue === 'string') return currentValue.trim().length > 0;
  if (typeof currentValue === 'number') return Number.isFinite(currentValue);
  if (typeof currentValue === 'boolean') return currentValue === true;
  if (Array.isArray(currentValue)) return currentValue.length > 0;
  if (currentValue && typeof currentValue === 'object') return Object.keys(currentValue).length > 0;
  return false;
}

function preferExistingUserInput(currentValue, incomingValue) {
  return shouldKeepCurrentValue(currentValue) ? currentValue : incomingValue;
}

function normalizePathOnly(path) {
  return safeStr(path).split(/[?#]/)[0];
}

function isMatchmakingApplyPath(path) {
  const normalized = normalizePathOnly(path);
  return normalized === '/wedding/apply' || normalized === '/evlilik/eslestirme-basvuru' || normalized === '/evlilik/eslestirme-basvurusu';
}

function isIndonesianNationality(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return false;
  if (s === 'id') return true;
  if (s === 'indonesia' || s === 'indonezya' || s === 'endonezya') return true;
  return s.includes('indonesia') || s.includes('indonezya') || s.includes('endonezya');
}

function deriveLookingForGender(gender) {
  const value = String(gender || '').trim().toLowerCase();
  if (value === 'male') return 'female';
  if (value === 'female') return 'male';
  return '';
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

function isAutoStubApplication(app) {
  const source = safeStr(app?.source).toLowerCase();
  return source === 'auto_stub' || app?.details?.autoBootstrap === true;
}

function hasDraftResumeData(app) {
  if (!isAutoStubApplication(app)) return false;
  const draftProgress = app?.draftProgress && typeof app.draftProgress === 'object' ? app.draftProgress : {};
  if (Number(draftProgress?.completedRequiredCount) > 0) return true;
  return !!(
    safeStr(app?.username) ||
    safeStr(app?.fullName) ||
    safeStr(app?.whatsapp) ||
    safeStr(app?.city) ||
    safeStr(app?.about) ||
    safeStr(app?.expectations) ||
    safeStr(app?.details?.occupation)
  );
}

function pickBestDraftResumeApplication(items) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;

  const scored = list
    .filter((item) => hasDraftResumeData(item))
    .map((item) => {
      const draftUpdatedAtMs =
        (typeof item?.draftUpdatedAtMs === 'number' && Number.isFinite(item.draftUpdatedAtMs) ? item.draftUpdatedAtMs : 0) ||
        (typeof item?.updatedAtMs === 'number' && Number.isFinite(item.updatedAtMs) ? item.updatedAtMs : 0) ||
        asMs(item?.draftUpdatedAt) ||
        asMs(item?.updatedAt) ||
        (typeof item?.createdAtMs === 'number' && Number.isFinite(item.createdAtMs) ? item.createdAtMs : 0) ||
        asMs(item?.createdAt);
      return { item, draftUpdatedAtMs };
    })
    .sort((left, right) => right.draftUpdatedAtMs - left.draftUpdatedAtMs);

  return scored[0]?.item || null;
}

const DRAFT_REQUIRED_FIELD_ORDER = [
  'photo',
  'username',
  'fullName',
  'age',
  'city',
  'nationality',
  'gender',
  'occupation',
  'maritalStatus',
  'consent18Plus',
  'consentPrivacy',
  'consentTerms',
];

function buildDraftProgressSnapshot(form, { hasStoredPhoto = false, lastInputKey = '', wizardStep = 0 } = {}) {
  const completed = [];
  const missing = [];
  const maritalStatus = String(form?.maritalStatus || '').trim().toLowerCase();
  const requiresChildrenInfo = maritalStatus === 'widowed' || maritalStatus === 'divorced';

  const pushState = (key, isDone) => {
    if (isDone) completed.push(key);
    else missing.push(key);
  };

  pushState('photo', !!hasStoredPhoto);
  pushState('username', !!normalizeUsername(form?.username));
  pushState('fullName', !!safeStr(form?.fullName));
  pushState('age', !!String(form?.age ?? '').trim());
  pushState('city', !!safeStr(form?.city));
  pushState('nationality', !!safeStr(form?.nationality));
  pushState('gender', !!safeStr(form?.gender));
  pushState('whatsapp', !!safeStr(form?.whatsapp));
  pushState('occupation', !!safeStr(form?.occupation));
  pushState('maritalStatus', !!safeStr(form?.maritalStatus));

  if (requiresChildrenInfo) {
    pushState('hasChildren', !!safeStr(form?.hasChildren));
    if (String(form?.hasChildren || '').trim() === 'yes') {
      pushState('childrenCount', !!String(form?.childrenCount ?? '').trim());
      pushState('childrenLivingSituation', !!safeStr(form?.childrenLivingSituation));
      pushState('liveWithChildrenAfterMarriage', !!safeStr(form?.liveWithChildrenAfterMarriage));
    }
  }

  pushState('consent18Plus', form?.consent18Plus === true);
  pushState('consentPrivacy', form?.consentPrivacy === true);
  pushState('consentTerms', form?.consentTerms === true);

  return {
    lastInputKey: lastInputKey || '',
    firstMissingRequiredKey: missing[0] || '',
    missingRequiredKeys: missing,
    completedRequiredKeys: completed,
    completedRequiredCount: completed.length,
    totalRequiredCount: completed.length + missing.length,
    photoComplete: !!hasStoredPhoto,
    wizardStep,
  };
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
    } catch {
      // ignore
    }
  }
}

function createDeferredPhotoProcessingError(failures = []) {
  const err = new Error('Photo preprocessing failed');
  err.code = 'photo/preprocess-failed';
  err.details = {
    failures: Array.isArray(failures)
      ? failures.map((failure) => ({
          key: String(failure?.key || '').trim(),
          name: String(failure?.name || '').trim(),
          message: String(failure?.message || '').trim(),
        }))
      : [],
  };
  return err;
}

export default function MatchmakingApply() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const currentUser = user || auth?.currentUser || null;
  const location = useLocation();
  const navigate = useNavigate();
  const applyPremiumUi = getApplyPremiumUi(getBaseLang(i18n?.language));
  const applyFlowUi = getApplyFlowUi(getBaseLang(i18n?.language));
  const isIndonesianUi = useMemo(() => String(i18n?.language || '').trim().toLowerCase().startsWith('id'), [i18n?.language]);
  const isMobileAppFormTheme = useMemo(() => {
    if (typeof window === 'undefined') return false;
    if (!isRunningAsPwa()) return false;
    try {
      return window.matchMedia('(max-width: 767px)').matches;
    } catch {
      return window.innerWidth < 768;
    }
  }, []);

  const isEmbedded = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      return params.get('embed') === '1' || params.get('embedded') === '1';
    } catch {
      return false;
    }
  }, [location.search]);
  const isEditOnceMode = useMemo(() => {
    // Ürün kararı (29 Mart 2026): "1 defalık düzeltme" modu kaldırıldı.
    // Kullanıcılar bu sayfadan istedikleri zaman bilgilerini güncelleyebilsin.
    return false;
  }, []);
  const isFullProfileMode = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      if (params.get('full') === '1') return true;
    } catch {
      // ignore
    }

    if (location?.state?.profileMode === 'full') return true;
    return false;
  }, [location.search, location.state]);

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

  const forceTour = (tourId) => {
    const id = String(tourId || '').trim();
    if (!id) return;
    try {
      if (typeof window === 'undefined') return;
      window.sessionStorage.setItem(TOUR_FORCE_KEY, id);
    } catch {
      // ignore
    }
  };

  const resolvePostSubmitReturnTo = () => {
    const raw = safeStr(location?.state?.returnTo || location?.state?.from);
    if (!raw) return '';

    const pathOnly = normalizePathOnly(raw);
    if (!pathOnly.startsWith('/')) return '';
    if (pathOnly === '/login') return '';
    if (isMatchmakingApplyPath(pathOnly)) return '';

    return raw;
  };

  const navigateAfterApplySubmit = (state) => {
    const returnTo = resolvePostSubmitReturnTo();
    if (returnTo && normalizePathOnly(returnTo) === '/profilim') {
      if (isEmbedded) {
        try {
          if (typeof window !== 'undefined' && window.top && window.top !== window.self) {
            window.top.location.assign(returnTo);
            return;
          }
        } catch {
          // ignore
        }
      }

      navigate(returnTo, { replace: true, state });
      return;
    }

    navigateToProfile(state);
  };

  const isWizardMode = useMemo(() => {
    try {
      if (!isFullProfileMode) return false;
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
      return !!(isEmbedded && isFullProfileMode);
    }
  }, [isEmbedded, isFullProfileMode, location.search]);

  const requestedWizardStep = useMemo(() => {
    try {
      const fromState = Number(location?.state?.startStep);
      if (Number.isInteger(fromState) && fromState >= 0) return fromState;
      const params = new URLSearchParams(location.search || '');
      const raw = Number(params.get('step'));
      if (Number.isInteger(raw) && raw >= 0) return raw;
    } catch {
      // ignore
    }
    return 0;
  }, [location.search, location.state]);

  const WIZARD_TOTAL_STEPS = isFullProfileMode ? 3 : 1;
  const [wizardStep, setWizardStep] = useState(0);

  const wizardSteps = useMemo(() => {
    if (!isFullProfileMode) {
      return [
        {
          title: t('matchmakingPage.form.wizard.steps.basic.title'),
          desc: applyFlowUi.shortBody,
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
  }, [applyFlowUi.shortBody, isFullProfileMode, t]);

  const wizardCurrent = wizardSteps?.[wizardStep] || { title: '', desc: '' };
  const consentsWizardStep = 0;

  useEffect(() => {
    if (!isWizardMode) return;
    setWizardStep(Math.max(0, Math.min(WIZARD_TOTAL_STEPS - 1, requestedWizardStep)));
  }, [WIZARD_TOTAL_STEPS, isWizardMode, requestedWizardStep]);

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
  const isAuthGate = !currentUser || currentUser.isAnonymous;

  // Kullanıcı zaten daha önce başvuru gönderdi ise tekrar form doldurtmayalım.
  useEffect(() => {
    if (!currentUser?.uid) return;
    let cancelled = false;

    (async () => {
      try {
        const q = query(collection(db, 'matchmakingApplications'), where('userId', '==', currentUser.uid), limit(10));
        const snap = await getDocs(q);
        if (cancelled) return;
        if (!snap.empty) {
          const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
          const best = pickBestNonStubApplication(items) || pickBestDraftResumeApplication(items);
          if (!best) return;

          const id = best?.id;
          const data = best || {};

          // Yeni ürün kararı: Daha önce başvuru yapılmış olsa bile kullanıcı bu sayfada kalabilsin
          // ve daha önce boş bıraktığı yerleri doldurabilsin.
          setExistingApplication({ id, ...data });

          setForm((prev) => {
            const details = data?.details && typeof data.details === 'object' ? data.details : {};
            const languages = details?.languages && typeof details.languages === 'object' ? details.languages : {};
            const nativeLang = languages?.native && typeof languages.native === 'object' ? languages.native : {};
            const foreignLang = languages?.foreign && typeof languages.foreign === 'object' ? languages.foreign : {};

            const nextGender = String(preferExistingUserInput(prev.gender, data?.gender || '') || '');
            const nextPartnerPreferences = {
              ...(data?.partnerPreferences && typeof data.partnerPreferences === 'object' ? data.partnerPreferences : {}),
              ...(prev.partnerPreferences && typeof prev.partnerPreferences === 'object' ? prev.partnerPreferences : {}),
            };

            const next = {
              ...prev,
              username: String(preferExistingUserInput(prev.username, data?.username || '') || ''),
              fullName: String(preferExistingUserInput(prev.fullName, data?.fullName || '') || ''),
              age: String(preferExistingUserInput(prev.age, data?.age === 0 || data?.age ? String(data.age) : '') || ''),
              city: String(preferExistingUserInput(prev.city, data?.city || '') || ''),
              country: String(preferExistingUserInput(prev.country, data?.country || '') || ''),
              whatsapp: String(preferExistingUserInput(prev.whatsapp, data?.whatsapp || '') || ''),
              nationality: String(preferExistingUserInput(prev.nationality, data?.nationality || '') || ''),
              gender: nextGender,
              heightCm: String(preferExistingUserInput(prev.heightCm, details?.heightCm === 0 || details?.heightCm ? String(details.heightCm) : '') || ''),
              weightKg: String(preferExistingUserInput(prev.weightKg, details?.weightKg === 0 || details?.weightKg ? String(details.weightKg) : '') || ''),
              occupation: String(preferExistingUserInput(prev.occupation, details?.occupation || '') || ''),
              education: String(preferExistingUserInput(prev.education, details?.education || '') || ''),
              educationDepartment: String(preferExistingUserInput(prev.educationDepartment, details?.educationDepartment || '') || ''),
              maritalStatus: String(preferExistingUserInput(prev.maritalStatus, details?.maritalStatus || '') || ''),
              hasChildren: String(preferExistingUserInput(prev.hasChildren, details?.hasChildren || '') || ''),
              childrenCount: String(preferExistingUserInput(prev.childrenCount, details?.childrenCount === 0 || details?.childrenCount ? String(details.childrenCount) : '') || ''),
              childrenLivingSituation: String(preferExistingUserInput(prev.childrenLivingSituation, details?.childrenLivingSituation || '') || ''),
              liveWithChildrenAfterMarriage: String(preferExistingUserInput(prev.liveWithChildrenAfterMarriage, details?.liveWithChildrenAfterMarriage || '') || ''),
              familyApprovalStatus: String(preferExistingUserInput(prev.familyApprovalStatus, details?.familyApprovalStatus || '') || ''),
              religion: String(preferExistingUserInput(prev.religion, details?.religion || '') || ''),
              religiousValues: String(preferExistingUserInput(prev.religiousValues, details?.religiousValues || '') || ''),
              incomeLevel: String(preferExistingUserInput(prev.incomeLevel, details?.incomeLevel || '') || ''),
              marriageTimeline: String(preferExistingUserInput(prev.marriageTimeline, details?.marriageTimeline || '') || ''),
              relocationWillingness: String(preferExistingUserInput(prev.relocationWillingness, details?.relocationWillingness || '') || ''),
              preferredLivingCountry: String(preferExistingUserInput(prev.preferredLivingCountry, details?.preferredLivingCountry || '') || ''),
              nativeLanguage: String(preferExistingUserInput(prev.nativeLanguage, nativeLang?.code || '') || ''),
              nativeLanguageOther: String(preferExistingUserInput(prev.nativeLanguageOther, nativeLang?.other || '') || ''),
              foreignLanguages: Array.isArray(prev.foreignLanguages) && prev.foreignLanguages.length
                ? prev.foreignLanguages
                : (Array.isArray(foreignLang?.codes) ? foreignLang.codes : []),
              foreignLanguageOther: String(preferExistingUserInput(prev.foreignLanguageOther, foreignLang?.other || '') || ''),
              communicationLanguage: String(preferExistingUserInput(prev.communicationLanguage, details?.communicationLanguage || '') || ''),
              communicationLanguageOther: String(preferExistingUserInput(prev.communicationLanguageOther, details?.communicationLanguageOther || '') || ''),
              smoking: String(preferExistingUserInput(prev.smoking, details?.smoking || '') || ''),
              alcohol: String(preferExistingUserInput(prev.alcohol, details?.alcohol || '') || ''),
              about: String(preferExistingUserInput(prev.about, data?.about || '') || ''),
              expectations: String(preferExistingUserInput(prev.expectations, data?.expectations || '') || ''),
              lookingForNationality: DEFAULT_LOOKING_FOR_NATIONALITY,
              lookingForGender: String(preferExistingUserInput(prev.lookingForGender, deriveLookingForGender(nextGender)) || ''),
              partnerPreferences: nextPartnerPreferences,

              consent18Plus: !!(prev?.consent18Plus || data?.consent18Plus),
              consentPrivacy: !!(prev?.consentPrivacy || data?.consentPrivacy),
              consentPhotoShare: true,
              consentTerms: !!(prev?.consentTerms || data?.consentTerms),
            };

            try {
              formRef.current = next;
            } catch {
              // ignore
            }

            return next;
          });
        }
      } catch {
        // ignore (rules/index/config) - kullanıcı yine formu görebilir.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid, isEditOnceMode, navigate]);

  const [existingApplication, setExistingApplication] = useState(null);

  // Kayıt sırasında zaten alınan temel bilgileri tekrar sormayalım.
  // matchmakingsUsers dokümanından best-effort prefill edip alanları doldururuz.
  useEffect(() => {
    const uid = String(currentUser?.uid || '').trim();
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
          fullName: safeStr(application?.fullName || publicProfile?.fullName || mmUser?.fullName || currentUser?.displayName),
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

          const maybeFill = (key, value) => {
            const prevVal = String(prev?.[key] ?? '').trim();
            const nextVal = String(value ?? '').trim();
            if (!prevVal && nextVal) {
              next[key] = nextVal;
            }
          };

          maybeFill('username', candidate.username);
          maybeFill('fullName', candidate.fullName);
          maybeFill('age', candidate.age);
          maybeFill('city', candidate.city);
          maybeFill('country', candidate.country);
          maybeFill('gender', candidate.gender);
          maybeFill('occupation', candidate.occupation);

          const changed = Object.keys(next).some((key) => next[key] !== prev[key]);
          if (!changed) {
            return prev;
          }

          try {
            formRef.current = next;
          } catch {
            // ignore
          }
          return next;
        });
      } catch {
        // ignore (rules/missing) - kullanıcı yine formu doldurabilir.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.displayName, currentUser?.uid]);

  const genderOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'male', label: t('matchmakingPage.form.options.gender.male') },
      { id: 'female', label: t('matchmakingPage.form.options.gender.female') },
    ],
    [t]
  );

  const yesNoMaybeOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'yes', label: t('matchmakingPage.form.options.common.yes') },
      { id: 'no', label: t('matchmakingPage.form.options.common.no') },
      { id: 'unsure', label: t('matchmakingPage.form.options.common.unsure') },
    ],
    [t]
  );

  const yesNoOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'yes', label: t('matchmakingPage.form.options.common.yes') },
      { id: 'no', label: t('matchmakingPage.form.options.common.no') },
    ],
    [t]
  );

  const childrenLivingSituationOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'with_children', label: t('matchmakingPage.form.options.childrenLivingSituation.withChildren') },
      { id: 'separate', label: t('matchmakingPage.form.options.childrenLivingSituation.separate') },
    ],
    [t]
  );

  const maritalStatusOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'single', label: t('matchmakingPage.form.options.maritalStatus.single') },
      { id: 'widowed', label: t('matchmakingPage.form.options.maritalStatus.widowed') },
      { id: 'divorced', label: t('matchmakingPage.form.options.maritalStatus.divorced') },
      { id: 'other', label: t('matchmakingPage.form.options.maritalStatus.other') },
    ],
    [t]
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
    [t]
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
    [t]
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
    [t]
  );

  const communicationLanguageOptions = useMemo(
    () => [
      { id: 'tr', label: t('matchmakingPage.form.options.commLanguage.tr') },
      { id: 'id', label: t('matchmakingPage.form.options.commLanguage.id') },
      { id: 'en', label: t('matchmakingPage.form.options.commLanguage.en') },
      { id: 'translation_app', label: t('matchmakingPage.form.options.commLanguage.translationApp') },
      { id: 'other', label: t('matchmakingPage.form.options.commLanguage.other') },
    ],
    [t]
  );

  const religiousValuesOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'weak', label: t('matchmakingPage.form.options.religiousValues.weak') },
      { id: 'medium', label: t('matchmakingPage.form.options.religiousValues.medium') },
      { id: 'conservative', label: t('matchmakingPage.form.options.religiousValues.conservative') },
    ],
    [t]
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
    [t]
  );

  const yesNoDoesntMatterOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'yes', label: t('matchmakingPage.form.options.common.yes') },
      { id: 'no', label: t('matchmakingPage.form.options.common.no') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t]
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
    liveWithChildrenAfterMarriage: '',
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
    expectations: '',
    lookingForNationality: DEFAULT_LOOKING_FOR_NATIONALITY,
    lookingForGender: '',
    partnerPreferences: {},
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
  }, [t, communicationLanguageOptions, form.communicationLanguage]);

  const nationalityPreferenceOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'tr', label: t('matchmakingPage.form.options.nationality.tr') },
      { id: 'id', label: t('matchmakingPage.form.options.nationality.id') },
      { id: 'other', label: t('matchmakingPage.form.options.nationality.other') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t]
  );

  const partnerMaritalStatusOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'single', label: t('matchmakingPage.form.options.maritalStatus.single') },
      { id: 'widowed', label: t('matchmakingPage.form.options.maritalStatus.widowed') },
      { id: 'divorced', label: t('matchmakingPage.form.options.maritalStatus.divorced') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.maritalStatus.doesnt_matter') },
    ],
    [t]
  );

  const partnerChildrenPreferenceOptions = useMemo(
    () => [
      { id: 'want_children', label: t('matchmakingPage.form.options.partnerChildren.wantChildren') },
      { id: 'no_children', label: t('matchmakingPage.form.options.partnerChildren.noChildren') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t]
  );

  const partnerEducationPreferenceOptions = useMemo(
    () => [
      { id: 'secondary', label: t('matchmakingPage.form.options.education.secondary') },
      { id: 'high_school', label: t('matchmakingPage.form.options.education.highSchool') },
      { id: 'university', label: t('matchmakingPage.form.options.education.university') },
      { id: 'masters', label: t('matchmakingPage.form.options.education.masters') },
      { id: 'phd', label: t('matchmakingPage.form.options.education.phd') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t]
  );

  const partnerOccupationPreferenceOptions = useMemo(
    () => [
      { id: 'civil_servant', label: t('matchmakingPage.form.options.occupation.civilServant') },
      { id: 'employee', label: t('matchmakingPage.form.options.occupation.employee') },
      { id: 'retired', label: t('matchmakingPage.form.options.occupation.retired') },
      { id: 'business_owner', label: t('matchmakingPage.form.options.occupation.businessOwner') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t]
  );

  const partnerFamilyValuesPreferenceOptions = useMemo(
    () => [
      { id: 'religious', label: t('matchmakingPage.form.options.familyValues.religious') },
      { id: 'liberal', label: t('matchmakingPage.form.options.familyValues.liberal') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t]
  );

  const partnerAgeDiffOptions = useMemo(() => {
    const options = [{ id: '', label: t('matchmakingPage.form.options.common.select') }];
    for (let year = 0; year <= 20; year += 1) {
      options.push({
        id: String(year),
        label: year === 0 ? t('matchmakingPage.form.options.ageDiff.none') : t('matchmakingPage.form.options.ageDiff.years', { count: year }),
      });
    }
    return options;
  }, [t]);

  const partnerCommunicationLanguageOptions = useMemo(() => {
    const out = [{ id: '', label: t('matchmakingPage.form.options.common.select') }];
    for (const opt of communicationLanguageOptions) out.push(opt);
    out.push({ id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') });

    const current = String(form?.partnerPreferences?.communicationLanguage || '').trim();
    if (current === 'other') {
      out.push({ id: 'other', label: t('matchmakingPage.form.options.commLanguage.other') });
    }

    const map = new Map();
    for (const opt of out) map.set(opt.id, opt);
    return Array.from(map.values());
  }, [communicationLanguageOptions, form?.partnerPreferences?.communicationLanguage, t]);

  const [genderConfirm, setGenderConfirm] = useState({ open: false, value: '' });
  const genderConfirmLabel = useMemo(() => {
    const v = String(genderConfirm?.value || '').trim();
    if (!v) return '';
    return genderOptions.find((opt) => opt.id === v)?.label || v;
  }, [genderConfirm?.value, genderOptions]);

  const [photoFiles, setPhotoFiles] = useState(() => ({ ...EMPTY_PHOTO_FILES }));
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState(() =>
    PHOTO_FIELD_KEYS.reduce((acc, key) => {
      acc[key] = '';
      return acc;
    }, {})
  );
  const [photoManagerOpen, setPhotoManagerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [lastApplicationId, setLastApplicationId] = useState('');
  const [invalidFieldKeys, setInvalidFieldKeys] = useState([]);
  const applyTelemetryMode = isFullProfileMode ? 'full' : 'short';

  const formElRef = useRef(null);
  const fieldRefs = useRef({});
  const photoSectionRef = useRef(null);
  const consentsSectionRef = useRef(null);
  const hasTrackedFormOpenRef = useRef(false);
  const hasTrackedFormStartRef = useRef(false);
  const firstInputTelemetryRef = useRef('');
  const validationAttemptSourceRef = useRef('');
  const pendingInvalidFocusKeyRef = useRef('');
  const userInteractedRef = useRef(false);
  const lastDraftInputKeyRef = useRef('');
  const lastDraftSavedHashRef = useRef('');
  const invalidFieldSet = useMemo(() => new Set(invalidFieldKeys), [invalidFieldKeys]);

  const trackApplyEvent = (eventKey, { trace = false } = {}) => {
    try {
      void trackClick(eventKey, { page: String(location?.pathname || '/'), trace });
    } catch {
      // ignore
    }
  };

  const markFormStarted = (key) => {
    const normalizedKey = String(key || '').trim().toLowerCase();
    if (!hasTrackedFormStartRef.current) {
      hasTrackedFormStartRef.current = true;
      trackApplyEvent(`apply_form_started:${applyTelemetryMode}`, { trace: true });
    }
    if (normalizedKey && !firstInputTelemetryRef.current) {
      firstInputTelemetryRef.current = normalizedKey;
      trackApplyEvent(`apply_form_first_input:${applyTelemetryMode}:${normalizedKey}`, { trace: true });
    }
  };

  const registerFieldRef = (key) => (node) => {
    if (!key) return;
    if (node) fieldRefs.current[key] = node;
    else delete fieldRefs.current[key];
  };

  const clearInvalidFields = (...keys) => {
    const filtered = keys.filter(Boolean);
    if (!filtered.length) return;
    setInvalidFieldKeys((prev) => prev.filter((key) => !filtered.includes(key)));
  };

  const getWizardStepForField = (key) => {
    if (!isWizardMode) return null;
    if (!key) return null;
    if (
      key === 'photo' ||
      key === 'username' ||
      key === 'fullName' ||
      key === 'age' ||
      key === 'city' ||
      key === 'nationality' ||
      key === 'gender' ||
      key === 'occupation' ||
      key === 'maritalStatus' ||
      key === 'hasChildren' ||
      key === 'childrenCount' ||
      key === 'childrenLivingSituation' ||
      key === 'whatsapp' ||
      key === 'consent18Plus' ||
      key === 'consentPrivacy' ||
      key === 'consentTerms'
    ) {
      return 0;
    }
    return null;
  };

  const scrollToField = (key) => {
    const target = key === 'photo'
      ? photoSectionRef.current
      : key === 'consent18Plus' || key === 'consentPrivacy' || key === 'consentTerms'
        ? consentsSectionRef.current
        : fieldRefs.current[key];
    if (!target) return;

    window.requestAnimationFrame(() => {
      try {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        try {
          target.scrollIntoView();
        } catch {
          // ignore
        }
      }

      try {
        if (typeof target.focus === 'function') target.focus({ preventScroll: true });
      } catch {
        // ignore
      }
    });
  };

  const failValidation = (keys, message) => {
    const normalizedKeys = Array.from(new Set((Array.isArray(keys) ? keys : [keys]).filter(Boolean)));
    const validationSource = String(validationAttemptSourceRef.current || '').trim();
    setInvalidFieldKeys(normalizedKeys);
    setError(message);
    if (validationSource === 'submit') {
      const firstKey = normalizedKeys[0] || 'unknown';
      trackApplyEvent(`apply_form_submit_blocked:${applyTelemetryMode}:${firstKey}`, { trace: true });
    } else if (validationSource.startsWith('wizard_next')) {
      const firstKey = normalizedKeys[0] || 'unknown';
      trackApplyEvent(`apply_form_step_blocked:${applyTelemetryMode}:${firstKey}`, { trace: true });
    }
    validationAttemptSourceRef.current = '';
    const firstKey = normalizedKeys[0] || '';
    if (firstKey) {
      const targetWizardStep = getWizardStepForField(firstKey);
      if (targetWizardStep !== null && targetWizardStep !== wizardStep) {
        pendingInvalidFocusKeyRef.current = firstKey;
        setWizardStep(targetWizardStep);
      } else {
        pendingInvalidFocusKeyRef.current = '';
        scrollToField(firstKey);
      }
    }
    return false;
  };

  const getFieldClassName = (key) => {
    const base = 'mt-1 w-full rounded-lg border px-3 py-2 text-sm';
    return invalidFieldSet.has(key)
      ? `${base} border-rose-500 bg-rose-50 ring-2 ring-rose-200`
      : `${base} border-slate-300`;
  };

  const getMobileAppReadableTextClassName = (className) => {
    const base = String(className || '');
    if (!isMobileAppFormTheme) return base;
    return base
      .replace('text-slate-950 md:text-white', 'text-white md:text-white')
      .replace('text-slate-900 md:text-slate-100', 'text-white md:text-slate-100')
      .replace('text-slate-900 md:text-slate-50', 'text-white md:text-slate-50')
      .replace('text-slate-700 md:text-slate-200', 'text-white/75 md:text-slate-200')
      .replace('text-slate-600 md:text-slate-300', 'text-white/70 md:text-slate-300')
      .replace('text-slate-500 md:text-slate-300', 'text-white/70 md:text-slate-300')
      .replace('text-slate-800 md:text-white/90', 'text-white/90 md:text-white/90')
      .replace('text-slate-800 md:text-white/80', 'text-white/80 md:text-white/80')
      .replace('text-slate-800', 'text-white/90');
  };

  const getLabelClassName = (key, base) => {
    const resolvedBase = getMobileAppReadableTextClassName(base);
    return invalidFieldSet.has(key)
      ? `${resolvedBase} ${isMobileAppFormTheme ? 'text-rose-200' : 'text-rose-700'}`
      : resolvedBase;
  };

  useEffect(() => {
    if (!error || invalidFieldKeys.length > 0) return;
    try {
      submitFeedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      // ignore
    }
  }, [error, invalidFieldKeys.length]);

  useEffect(() => {
    const pendingKey = String(pendingInvalidFocusKeyRef.current || '').trim();
    if (!pendingKey) return;
    if (!invalidFieldSet.has(pendingKey)) {
      pendingInvalidFocusKeyRef.current = '';
      return;
    }
    pendingInvalidFocusKeyRef.current = '';
    scrollToField(pendingKey);
  }, [invalidFieldSet, wizardStep]);

  useEffect(() => {
    if (isAuthGate) return;
    if (hasTrackedFormOpenRef.current) return;
    hasTrackedFormOpenRef.current = true;
    trackApplyEvent(`apply_form_open:${applyTelemetryMode}`, { trace: true });
  }, [applyTelemetryMode, isAuthGate]);

  const onChange = (key) => (e) => {
    userInteractedRef.current = true;
    lastDraftInputKeyRef.current = key;
    markFormStarted(key);
    const value = e?.target?.type === 'checkbox' ? !!e.target.checked : e.target.value;
    try {
      formRef.current = { ...(formRef.current || {}), [key]: value };
    } catch {
      // ignore
    }
    setForm((prev) => ({ ...prev, [key]: value }));
    clearInvalidFields(key);
    if (error) setError('');
  };

  const onPartnerChange = (key) => (e) => {
    userInteractedRef.current = true;
    lastDraftInputKeyRef.current = key;
    markFormStarted(`partner_${key}`);
    const value = e?.target?.type === 'checkbox' ? !!e.target.checked : e.target.value;
    setForm((prev) => {
      const next = {
        ...prev,
        partnerPreferences: {
          ...(prev.partnerPreferences || {}),
          [key]: value,
        },
      };
      try {
        formRef.current = next;
      } catch {
        // ignore
      }
      return next;
    });
    clearInvalidFields(key);
    if (error) setError('');
  };

  const onGenderChange = (e) => {
    userInteractedRef.current = true;
    lastDraftInputKeyRef.current = 'gender';
    markFormStarted('gender');
    const next = String(e?.target?.value || '').trim();
    if (!next) {
      try {
        formRef.current = { ...(formRef.current || {}), gender: '', lookingForGender: '' };
      } catch {
        // ignore
      }
      setForm((prev) => ({ ...prev, gender: '', lookingForGender: '' }));
      clearInvalidFields('gender');
      if (error) setError('');
      return;
    }
    setGenderConfirm({ open: true, value: next });
    if (error) setError('');
  };

  const confirmGenderApply = () => {
    userInteractedRef.current = true;
    lastDraftInputKeyRef.current = 'gender';
    markFormStarted('gender');
    const g = String(genderConfirm?.value || '').trim();
    if (!g) {
      setGenderConfirm({ open: false, value: '' });
      return;
    }
    try {
      formRef.current = { ...(formRef.current || {}), gender: g, lookingForGender: deriveLookingForGender(g) };
    } catch {
      // ignore
    }
    setForm((prev) => ({ ...prev, gender: g, lookingForGender: deriveLookingForGender(g) }));
    setGenderConfirm({ open: false, value: '' });
    clearInvalidFields('gender');
  };

  const confirmGenderCancel = () => setGenderConfirm({ open: false, value: '' });

  useEffect(() => {
    if (!genderConfirm.open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setGenderConfirm({ open: false, value: '' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [genderConfirm.open]);

  const onEducationChange = (e) => {
    userInteractedRef.current = true;
    lastDraftInputKeyRef.current = 'education';
    markFormStarted('education');
    const value = e?.target?.value || '';
    setForm((prev) => {
      const needsDept = value === 'university' || value === 'masters' || value === 'phd';
      const next = {
        ...prev,
        education: value,
        educationDepartment: needsDept ? prev.educationDepartment : '',
      };
      try {
        formRef.current = next;
      } catch {
        // ignore
      }
      return next;
    });
    clearInvalidFields('education', 'educationDepartment');
  };

  const onMaritalStatusChange = (e) => {
    userInteractedRef.current = true;
    lastDraftInputKeyRef.current = 'maritalStatus';
    markFormStarted('maritalStatus');
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
        next.liveWithChildrenAfterMarriage = '';
      }
      try {
        formRef.current = { ...(formRef.current || {}), ...next };
      } catch {
        // ignore
      }
      return next;
    });
    clearInvalidFields('maritalStatus', 'hasChildren', 'childrenCount', 'childrenLivingSituation', 'liveWithChildrenAfterMarriage');
    if (error) setError('');
  };

  const onHasChildrenChange = (e) => {
    userInteractedRef.current = true;
    lastDraftInputKeyRef.current = 'hasChildren';
    markFormStarted('hasChildren');
    const value = String(e?.target?.value || '');
    setForm((prev) => {
      const next = {
        ...prev,
        hasChildren: value,
      };
      if (value !== 'yes') {
        next.childrenCount = '';
        next.childrenLivingSituation = '';
        next.liveWithChildrenAfterMarriage = '';
      }
      try {
        formRef.current = { ...(formRef.current || {}), ...next };
      } catch {
        // ignore
      }
      return next;
    });
    clearInvalidFields('hasChildren', 'childrenCount', 'childrenLivingSituation', 'liveWithChildrenAfterMarriage');
    if (error) setError('');
  };

  const onPickPhoto = (key) => (e) => {
    userInteractedRef.current = true;
    lastDraftInputKeyRef.current = 'photo';
    markFormStarted('photo');
    const file = e?.target?.files?.[0] || null;
    if (file && !isImageFile(file)) {
      failValidation('photo', t('matchmakingPage.form.errors.photoType'));
      try {
        if (e?.target) e.target.value = '';
      } catch {
        // ignore
      }
      return;
    }
    setPhotoFiles((prev) => ({ ...(prev || {}), [key]: file }));
    clearInvalidFields('photo');
    if (error) setError('');
    try {
      if (e?.target) e.target.value = '';
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const objectUrls = [];
    const nextPreviews = PHOTO_FIELD_KEYS.reduce((acc, key) => {
      const file = photoFiles?.[key] || null;
      if (file && isImageFile(file)) {
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        acc[key] = url;
      } else {
        acc[key] = '';
      }
      return acc;
    }, {});

    setPhotoPreviewUrls(nextPreviews);

    return () => {
      objectUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
    };
  }, [photoFiles]);

  const existingPhotoRefs = useMemo(() => pickMatchmakingPhotoRefs(existingApplication), [existingApplication]);
  const existingPhotoUrlSlots = useMemo(
    () => PHOTO_FIELD_KEYS.map((_, index) => safeStr(existingApplication?.photoUrls?.[index])),
    [existingApplication]
  );
  const existingPhotoPathSlots = useMemo(
    () => PHOTO_FIELD_KEYS.map((_, index) => safeStr(existingApplication?.photoPaths?.[index])),
    [existingApplication]
  );
  const existingPhotoCloudinarySlots = useMemo(
    () => PHOTO_FIELD_KEYS.map((_, index) => existingApplication?.photoCloudinary?.[index] || null),
    [existingApplication]
  );
  const existingPhotoContentTypeSlots = useMemo(
    () => PHOTO_FIELD_KEYS.map((_, index) => safeStr(existingApplication?.photoContentTypes?.[index])),
    [existingApplication]
  );
  const existingPhotoOriginalTypeSlots = useMemo(
    () => PHOTO_FIELD_KEYS.map((_, index) => safeStr(existingApplication?.photoOriginalTypes?.[index])),
    [existingApplication]
  );
  const existingDisplayablePhotoSlots = useMemo(
    () =>
      PHOTO_FIELD_KEYS.map((_, index) => {
        const raw = safeStr(existingPhotoUrlSlots[index] || existingPhotoRefs[index] || existingPhotoPathSlots[index]);
        return /^(https?:|data:|\/)/i.test(raw) ? raw : '';
      }),
    [existingPhotoPathSlots, existingPhotoRefs, existingPhotoUrlSlots]
  );
  const hasExistingPhoto = existingPhotoRefs.length > 0;
  const hasNewPhotoSelection = PHOTO_FIELD_KEYS.some((key) => !!photoFiles?.[key]);
  const preparedPhotoCount = PHOTO_FIELD_KEYS.reduce((count, key, index) => {
    if (photoPreviewUrls?.[key] || existingPhotoUrlSlots[index] || existingPhotoPathSlots[index]) return count + 1;
    return count;
  }, 0);
  const isFemaleApplicant = String(form?.gender || '').trim().toLowerCase() === 'female';
  const photoPrivacyNotice = isFemaleApplicant ? applyFlowUi.photoPrivacyBodyFemale : applyFlowUi.photoPrivacyBody;
  const isDraftResumeApplication = !!(existingApplication && isAutoStubApplication(existingApplication));

  useEffect(() => {
    const uid = String(user?.uid || '').trim();
    if (!uid || user?.isAnonymous) return undefined;
    if (!userInteractedRef.current) return undefined;
    if (submitting || success) return undefined;

    const existingIsNonStub = !!(existingApplication && !isAutoStubApplication(existingApplication));
    if (existingIsNonStub) return undefined;

    const snapshot = formRef.current || form;
    const payload = {
      username: String(snapshot?.username || '').trim(),
      usernameLower: normalizeUsername(snapshot?.username),
      fullName: String(snapshot?.fullName || '').trim(),
      age: String(snapshot?.age || '').trim(),
      city: String(snapshot?.city || '').trim(),
      nationality: String(snapshot?.nationality || '').trim(),
      gender: String(snapshot?.gender || '').trim(),
      whatsapp: String(snapshot?.whatsapp || '').trim(),
      occupation: String(snapshot?.occupation || '').trim(),
      maritalStatus: String(snapshot?.maritalStatus || '').trim(),
      hasChildren: String(snapshot?.hasChildren || '').trim(),
      childrenCount: String(snapshot?.childrenCount || '').trim(),
      childrenLivingSituation: String(snapshot?.childrenLivingSituation || '').trim(),
      liveWithChildrenAfterMarriage: String(snapshot?.liveWithChildrenAfterMarriage || '').trim(),
      consent18Plus: snapshot?.consent18Plus === true,
      consentPrivacy: snapshot?.consentPrivacy === true,
      consentTerms: snapshot?.consentTerms === true,
    };
    const progress = buildDraftProgressSnapshot(snapshot, {
      hasStoredPhoto: hasExistingPhoto,
      lastInputKey: lastDraftInputKeyRef.current,
      wizardStep,
    });
    const requestBody = { payload, progress };
    const requestHash = JSON.stringify(requestBody);
    if (requestHash === lastDraftSavedHashRef.current) return undefined;

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await authFetch('/api/matchmaking-application-draft', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(requestBody),
          });
          lastDraftSavedHashRef.current = requestHash;

          const nextId = safeStr(res?.applicationId);
          if (nextId) {
            setExistingApplication((prev) => {
              if (prev && safeStr(prev?.id)) return prev;
              return {
                id: nextId,
                source: 'auto_stub',
                details: { autoBootstrap: true },
                draftProgress: progress,
              };
            });
          }
        } catch {
          // best-effort only
        }
      })();
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [
    existingApplication,
    form,
    hasExistingPhoto,
    hasNewPhotoSelection,
    submitting,
    success,
    user?.isAnonymous,
    user?.uid,
    wizardStep,
  ]);
  const photoSlots = useMemo(
    () =>
      PHOTO_FIELD_KEYS.map((key, index) => ({
        key,
        index,
        previewUrl: photoPreviewUrls?.[key] || existingDisplayablePhotoSlots[index] || '',
        hasExisting: !!(existingPhotoUrlSlots[index] || existingPhotoPathSlots[index]),
        hasNewSelection: !!photoFiles?.[key],
      })),
    [existingDisplayablePhotoSlots, existingPhotoPathSlots, existingPhotoUrlSlots, photoFiles, photoPreviewUrls]
  );

  const togglePhotoManager = () => setPhotoManagerOpen(true);
  const closePhotoManager = () => setPhotoManagerOpen(false);

  const clearSelectedPhoto = (key) => {
    setPhotoFiles((prev) => ({ ...(prev || {}), [key]: null }));
  };

  useEffect(() => {
    if (!photoManagerOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setPhotoManagerOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [photoManagerOpen]);

  const onNativeLanguageChange = (e) => {
    userInteractedRef.current = true;
    lastDraftInputKeyRef.current = 'nativeLanguage';
    markFormStarted('nativeLanguage');
    const value = e?.target?.value || '';
    setForm((prev) => {
      const foreign = Array.isArray(prev.foreignLanguages) ? prev.foreignLanguages : [];
      const nextForeign = foreign.filter((code) => code && code !== value);
      const keepForeignOther = nextForeign.includes('other');
      const next = {
        ...prev,
        nativeLanguage: value,
        nativeLanguageOther: value === 'other' ? prev.nativeLanguageOther : '',
        foreignLanguages: nextForeign,
        foreignLanguageOther: keepForeignOther ? prev.foreignLanguageOther : '',
      };
      try {
        formRef.current = next;
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleForeignLanguage = (code) => () => {
    userInteractedRef.current = true;
    lastDraftInputKeyRef.current = 'foreignLanguages';
    markFormStarted(`foreign_${code}`);
    setForm((prev) => {
      const list = Array.isArray(prev.foreignLanguages) ? prev.foreignLanguages : [];
      const exists = list.includes(code);
      // "none" seçeneği diğerlerini kilitlemesin.
      // Başka bir dil seçildiğinde "none" otomatik çıkarılır (çelişkiyi engeller).
      let next = exists ? list.filter((x) => x !== code) : [...list, code];
      if (code !== 'none' && next.includes('none')) next = next.filter((x) => x !== 'none');
      const nextState = {
        ...prev,
        foreignLanguages: next,
        foreignLanguageOther: next.includes('other') ? prev.foreignLanguageOther : '',
      };
      try {
        formRef.current = nextState;
      } catch {
        // ignore
      }
      return nextState;
    });
  };

  // multi-select iptal edildi

  const ageNumForUi = toNumberOrNull(form.age);
  const partnerAgeOlderNum = toNumberOrNull(form?.partnerPreferences?.ageMaxOlderYears);
  const partnerAgeYoungerNum = toNumberOrNull(form?.partnerPreferences?.ageMaxYoungerYears);
  const partnerAgeMinForUi = ageNumForUi !== null && partnerAgeYoungerNum !== null ? Math.max(18, ageNumForUi - partnerAgeYoungerNum) : null;
  const partnerAgeMaxForUi = ageNumForUi !== null && partnerAgeOlderNum !== null ? Math.min(99, ageNumForUi + partnerAgeOlderNum) : null;

  const requiredValue = (value) => String(value ?? '').trim();

  const validatePhotoInputs = () => {
    for (const key of PHOTO_FIELD_KEYS) {
      if (photoFiles?.[key] && !isImageFile(photoFiles[key])) return failValidation('photo', t('matchmakingPage.form.errors.photoType'));
    }
    return true;
  };

  const validateRequiredForm = (f) => {
    const minApplicantAge = isIndonesianNationality(f?.nationality) ? 21 : 18;
    const normalizedUsername = normalizeUsername(f?.username);
    const isFemaleApplicant = String(f?.gender || '').trim().toLowerCase() === 'female';
    if (!normalizedUsername) return failValidation('username', t('matchmakingPage.form.errors.username'));
    if (!requiredValue(f?.fullName)) return failValidation('fullName', t('matchmakingPage.form.errors.fullName'));
    if (!requiredValue(f?.age)) return failValidation('age', t('matchmakingPage.form.errors.age'));
    if (!requiredValue(f?.city)) return failValidation('city', t('matchmakingPage.form.errors.city'));
    if (!requiredValue(f?.nationality)) return failValidation('nationality', t('matchmakingPage.form.errors.nationality'));
    if (!requiredValue(f?.gender)) return failValidation('gender', t('matchmakingPage.form.errors.gender'));
    if (!requiredValue(f?.occupation)) return failValidation('occupation', t('matchmakingPage.form.errors.occupation'));
    if (!requiredValue(f?.maritalStatus)) return failValidation('maritalStatus', t('matchmakingPage.form.errors.maritalStatus'));

    const maritalStatus = String(f?.maritalStatus || '').trim().toLowerCase();
    const requiresChildrenInfo = maritalStatus === 'widowed' || maritalStatus === 'divorced';
    if (requiresChildrenInfo) {
      if (!requiredValue(f?.hasChildren)) return failValidation('hasChildren', t('matchmakingPage.form.errors.hasChildren'));
      if (f?.hasChildren === 'yes') {
        if (!requiredValue(f?.childrenCount)) return failValidation('childrenCount', t('matchmakingPage.form.errors.childrenCount'));
        if (!requiredValue(f?.childrenLivingSituation)) return failValidation('childrenLivingSituation', t('matchmakingPage.form.errors.childrenLivingSituation'));
        if (!requiredValue(f?.liveWithChildrenAfterMarriage)) {
          return failValidation('liveWithChildrenAfterMarriage', t('matchmakingPage.form.errors.liveWithChildrenAfterMarriage'));
        }
      }
    }

    if (!f?.consent18Plus || !f?.consentPrivacy || !f?.consentTerms) {
      return failValidation(
        ['consent18Plus', 'consentPrivacy', 'consentTerms'].filter((key) => f?.[key] !== true),
        t('matchmakingPage.form.errors.consentsRequired', { minAge: minApplicantAge })
      );
    }

    const ageStr = String(f?.age ?? '').trim();
    const ageNum = ageStr ? Number(ageStr) : null;
    if (ageStr && (!Number.isFinite(ageNum) || ageNum < minApplicantAge || ageNum > 99)) {
      return failValidation('age', t('matchmakingPage.form.errors.ageRange', { minAge: minApplicantAge }));
    }

    return validatePhotoInputs();
  };

  const validateOptionalForm = (f) => {
    const heightNum = toNumberOrNull(f?.heightCm);
    if (heightNum !== null && (heightNum < 120 || heightNum > 230)) return failValidation('heightCm', t('matchmakingPage.form.errors.heightRange'));

    const weightNum = toNumberOrNull(f?.weightKg);
    if (weightNum !== null && (weightNum < 35 || weightNum > 250)) return failValidation('weightKg', t('matchmakingPage.form.errors.weightRange'));

    const partnerHeightMin = String(f?.partnerPreferences?.heightMinCm ?? '').trim();
    const partnerHeightMax = String(f?.partnerPreferences?.heightMaxCm ?? '').trim();
    if (
      partnerHeightMin &&
      partnerHeightMax &&
      partnerHeightMin !== 'any' &&
      partnerHeightMax !== 'any' &&
      partnerHeightMin !== 'doesnt_matter' &&
      partnerHeightMax !== 'doesnt_matter'
    ) {
      const minNum = Number(partnerHeightMin);
      const maxNum = Number(partnerHeightMax);
      if (Number.isFinite(minNum) && Number.isFinite(maxNum) && minNum > maxNum) {
        return failValidation('partnerPreferences.heightMaxCm', t('matchmakingPage.form.errors.partnerHeightRange'));
      }
    }

    return true;
  };

  const scrollWizardToTop = () => {
    try {
      document.getElementById('matchmaking-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      // ignore
    }
  };

  const validateWizardStep = (step) => {
    const f = (formRef.current && typeof formRef.current === 'object' ? formRef.current : form);

    if (step === 0) {
      return validateRequiredForm(f);
    }

    return true;
  };

  const wizardCheckpoint = useMemo(() => {
    if (wizardStep === 0) return t('matchmakingPage.form.wizard.checkpoints.basic.body');
    if (wizardStep === 1) return t('matchmakingPage.form.wizard.checkpoints.details.body');
    return t('matchmakingPage.form.wizard.complete.body');
  }, [t, wizardStep]);

  const goWizardNext = () => {
    if (!isWizardMode) return;
    if (submitting) return;
    setError('');
    validationAttemptSourceRef.current = `wizard_next_${wizardStep}`;
    if (!validateWizardStep(wizardStep)) return;
    validationAttemptSourceRef.current = '';
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
    setInvalidFieldKeys([]);
    validationAttemptSourceRef.current = '';

    const hasExistingId = !!(existingApplication && typeof existingApplication === 'object' && safeStr(existingApplication?.id));
    const isNewApplication = !hasExistingId;

    const minApplicantAge = isIndonesianNationality(form.nationality) ? 21 : 18;

    // Honeypot (botlar genelde doldurur)
    // Not: Gerçek kullanıcılarda browser/password-manager autofill'i bu gizli alanı
    // yanlışlıkla doldurabiliyor. Bu durumda submit'i kesmek sahte spam bloklarına yol açıyor.
    // Auth + rate limit + zaman kontrolü zaten mevcut olduğu için burada sadece sinyal olarak loglayıp devam ediyoruz.
    if (String(form.hpCompany || '').trim()) {
      console.warn('matchmaking honeypot filled; ignoring likely autofill false-positive');
      try {
        formRef.current = { ...(formRef.current || form), hpCompany: '' };
      } catch {
        // ignore
      }
      setForm((prev) => ({ ...(prev || {}), hpCompany: '' }));
    }

    if (!isEditOnceMode) {
      // Yeni başvuru: istemci tarafında sadece tekrar submit spam'ini azalt.
      // Sabit "form acildiktan sonra X sn bekle" kuralı, autofill ve hızlı ama gerçek
      // kullanıcıları yanlış pozitif ile engelleyebiliyor.
      if (isNewApplication) {
        // Basit client-side rate-limit (sunucu tarafı kadar güvenli değil ama spam'i azaltır)
        try {
          const last = Number(localStorage.getItem('mk_apply_last_submit_at') || '0');
          if (last && Date.now() - last < 60_000) {
            return setError(t('matchmakingPage.form.errors.rateLimited'));
          }
        } catch {
          // ignore
        }
      }

      // Firestore rules, başvuru kaydı için bu onayların true olmasını bekliyor.
      // Diğer tüm alanlar opsiyonel kalsa bile, bu 3 onay olmadan gönderim engellenir.
      validationAttemptSourceRef.current = 'submit';
      if (!form.consent18Plus || !form.consentPrivacy || !form.consentTerms) {
        return failValidation(
          ['consent18Plus', 'consentPrivacy', 'consentTerms'].filter((key) => form?.[key] !== true),
          t('matchmakingPage.form.errors.consentsRequired', { minAge: minApplicantAge })
        );
      }
    }

    validationAttemptSourceRef.current = 'submit';
    const normalizedUsername = normalizeUsername(form.username);
    if (!validateRequiredForm(form)) return;
    validationAttemptSourceRef.current = '';

    const inviteCodeRaw = String(form.inviteCode || '').trim();
    const inviteCode = inviteCodeRaw.replace(/\s+/g, '');
    if (inviteCode && !/^\d{4}$/.test(inviteCode)) {
      return setError(t('matchmakingPage.form.errors.inviteCodeInvalid'));
    }

    const maritalStatus = String(form.maritalStatus || '').trim().toLowerCase();
    const requiresChildrenInfo = maritalStatus === 'widowed' || maritalStatus === 'divorced';

    if (requiresChildrenInfo) {
      if (!requiredValue(form.hasChildren)) return setError(t('matchmakingPage.form.errors.hasChildren'));
      if (form.hasChildren === 'yes') {
        if (!requiredValue(form.childrenCount)) return setError(t('matchmakingPage.form.errors.childrenCount'));
        if (!requiredValue(form.childrenLivingSituation)) {
          return setError(t('matchmakingPage.form.errors.childrenLivingSituation'));
        }
        if (!requiredValue(form.liveWithChildrenAfterMarriage)) {
          return setError(t('matchmakingPage.form.errors.liveWithChildrenAfterMarriage'));
        }
      }
    }

    const ageStr = String(form.age ?? '').trim();
    const ageNum = ageStr ? Number(ageStr) : null;
    if (!validateOptionalForm(form)) return;
    validationAttemptSourceRef.current = '';

    let childrenCountNum = toNumberOrNull(form.childrenCount);
    let childrenLivingSituation = String(form.childrenLivingSituation || '').trim() || null;
    let liveWithChildrenAfterMarriage = String(form.liveWithChildrenAfterMarriage || '').trim() || null;
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

      const allowedYesNo = new Set(['yes', 'no']);
      if (liveWithChildrenAfterMarriage && !allowedYesNo.has(liveWithChildrenAfterMarriage)) {
        return setError(t('matchmakingPage.form.errors.liveWithChildrenAfterMarriage'));
      }
      if (!liveWithChildrenAfterMarriage) liveWithChildrenAfterMarriage = null;
    } else {
      // Hayır/emin değilim seçildiyse sayıyı saklamayalım.
      childrenCountNum = null;
      childrenLivingSituation = null;
      liveWithChildrenAfterMarriage = null;
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

      const compressedPhotos = await Promise.all(
        PHOTO_FIELD_KEYS.map(async (key, index) => {
          const sourcePhoto = photoFiles?.[key];
          if (!sourcePhoto) return null;
          try {
            return await compressImageToJpeg(sourcePhoto);
          } catch (photoPrepErr) {
            const message = typeof photoPrepErr?.message === 'string' && photoPrepErr.message.trim()
              ? photoPrepErr.message.trim()
              : 'unknown_photo_preprocess_error';
            console.warn('Photo preprocessing failed; retrying with original file:', { key, message, error: photoPrepErr });
            return sourcePhoto;
          }
        })
      );

      const nextPhotoSlots = PHOTO_FIELD_KEYS.map((_, index) => ({
        url: existingPhotoUrlSlots[index] || '',
        path: existingPhotoPathSlots[index] || '',
        cloudinary: existingPhotoCloudinarySlots[index] || null,
        contentType: existingPhotoContentTypeSlots[index] || '',
        originalType: existingPhotoOriginalTypeSlots[index] || '',
      }));

      const folder = `uniqah/matchmakingApplications/${docRef.id}`;
      const tags = ['matchmaking', 'application'];

      const hasAnyPreparedPhoto = compressedPhotos.some(Boolean);
      let cloudinaryOk = !hasAnyPreparedPhoto;
      let cloudinaryErr = null;
      let deferredPhotoUploadErr = null;
      try {
        if (hasAnyPreparedPhoto) {
          // Signed upload varsa onu, yoksa unsigned preset'i otomatik kullanır.
          for (let index = 0; index < compressedPhotos.length; index += 1) {
            const preparedPhoto = compressedPhotos[index];
            if (!preparedPhoto) continue;
            const originalPhoto = photoFiles?.[PHOTO_FIELD_KEYS[index]] || preparedPhoto;
            let uploaded = null;
            let uploadedFile = preparedPhoto;
            try {
              uploaded = await uploadImageToCloudinaryAuto(preparedPhoto, { folder, tags });
            } catch (preparedUploadErr) {
              if (preparedPhoto !== originalPhoto) {
                console.warn('Compressed photo upload failed; retrying original file:', preparedUploadErr);
                uploaded = await uploadImageToCloudinaryAuto(originalPhoto, { folder, tags });
                uploadedFile = originalPhoto;
              } else {
                throw preparedUploadErr;
              }
            }
            nextPhotoSlots[index] = {
              url: uploaded.secureUrl,
              path: '',
              cloudinary: uploaded,
              contentType: uploadedFile?.type || originalPhoto?.type || 'image/jpeg',
              originalType: originalPhoto?.type || '',
            };
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
          deferredPhotoUploadErr = e;
        } else {
          try {
            for (let index = 0; index < compressedPhotos.length; index += 1) {
              const compressedPhoto = compressedPhotos[index];
              if (!compressedPhoto) continue;
              const storageRef = ref(storage, `matchmakingApplications/${docRef.id}/photo${index + 1}.jpg`);
              await uploadBytes(storageRef, compressedPhoto, { contentType: compressedPhoto.type || 'image/jpeg' });
              nextPhotoSlots[index] = {
                url: '',
                path: storageRef.fullPath,
                cloudinary: null,
                contentType: compressedPhoto.type || 'image/jpeg',
                originalType: photoFiles?.[PHOTO_FIELD_KEYS[index]]?.type || '',
              };
              try {
                nextPhotoSlots[index].url = await getDownloadURL(storageRef);
              } catch {
                // ignore (rules/missing)
              }
            }
          } catch (storageErr) {
            deferredPhotoUploadErr = storageErr;
            console.warn('Storage fallback upload failed; deferring photo completion:', storageErr);
          }
        }
      }

      const mergedPhotoSlots = nextPhotoSlots.filter((slot) => slot?.url || slot?.path);
      const photoPaths = mergedPhotoSlots.map((slot) => slot.path || '');
      const photoUrls = mergedPhotoSlots.map((slot) => slot.url || '');
      const photoCloudinary = mergedPhotoSlots.map((slot) => slot.cloudinary || null);
      const photoContentTypes = mergedPhotoSlots.map((slot) => slot.contentType || '');
      const photoOriginalTypes = mergedPhotoSlots.map((slot) => slot.originalType || '');

      // Fotoğraf seçilmediyse bu alanları payload'a hiç koymayalım.
      // Böylece mevcut fotoğraflar (varsa) güncelleme sırasında yanlışlıkla silinmez.
      const includePhotoFields = mergedPhotoSlots.length > 0;
      if (hasNewPhotoSelection && mergedPhotoSlots.length < 1 && deferredPhotoUploadErr) {
        console.warn('Photo upload deferred; continuing application submit without stored photos:', deferredPhotoUploadErr);
      }

      // Kısa ve anlaşılır başvuru kodu: MK-<profileNo>
      // Not: Upload başarısız olursa numara boşa gidebilir; kabul edilebilir (sayaç sadece artar).
      let allocatedProfileNo = null;
      if (!isEditOnceMode && isNewApplication) {
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

      const partnerPreferences = {
        ...(form.partnerPreferences && typeof form.partnerPreferences === 'object' ? form.partnerPreferences : {}),
      };
      const partnerCommunicationLanguage = String(partnerPreferences.communicationLanguage || '').trim();
      if (partnerCommunicationLanguage === 'translation_app') {
        partnerPreferences.canCommunicateWithTranslationApp = true;
        partnerPreferences.translationAppPreference = 'yes';
        partnerPreferences.communicationMethods = ['translation_app'];
      } else if (partnerCommunicationLanguage && partnerCommunicationLanguage !== 'doesnt_matter') {
        partnerPreferences.canCommunicateWithTranslationApp = false;
        partnerPreferences.translationAppPreference = 'no';
        partnerPreferences.communicationMethods = ['foreign_language'];
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
        country: String(form.nationality || form.country || '').trim(),
        whatsapp: String(form.whatsapp || '').trim(),
        nationality: form.nationality || '',
        gender: form.gender || '',
        lookingForNationality: DEFAULT_LOOKING_FOR_NATIONALITY,
        lookingForGender: deriveLookingForGender(form.gender),
        partnerPreferences,
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
          childrenCount: requiresChildrenInfo && form.hasChildren === 'yes' ? childrenCountNum : null,
          childrenLivingSituation: requiresChildrenInfo && form.hasChildren === 'yes' ? childrenLivingSituation : null,
          liveWithChildrenAfterMarriage: requiresChildrenInfo && form.hasChildren === 'yes' ? liveWithChildrenAfterMarriage : null,
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
        expectations: String(form.expectations || '').trim(),
        ...(includePhotoFields
          ? {
              photoPaths,
              photoUrls,
              photoCloudinary,
              photoContentTypes,
              photoOriginalTypes,
            }
          : {}),
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

        navigateToProfile({ from: 'matchmakingEditOnce', applicationId: nextId });
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
      } catch {
        // ignore
      }

      // Funnel: signup -> apply completion
      markFunnelApplyCompleted();

      void submitRes;

      const hadDeferredPhotoUpload = hasNewPhotoSelection && mergedPhotoSlots.length < 1 && deferredPhotoUploadErr;
      navigateAfterApplySubmit({
        from: 'matchmakingApply',
        applicationId: nextId,
        triggerPushTutorial: true,
        ...(hadDeferredPhotoUpload
          ? {
              openPhotoManager: true,
              photoUploadDeferred: true,
              photoUploadDeferredMessage: t('matchmakingPage.form.errors.photoUploadDeferred'),
            }
          : {}),
      });
      return;
    } catch (err) {
      console.error('matchmaking submit error:', err);
      const code = err?.code || err?.name || '';
      const apiMsg = typeof err?.message === 'string' ? err.message.trim() : '';
      const status = typeof err?.status === 'number' ? err.status : null;
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
      } else if (apiMsg === 'rate_limited' || apiMsg === 'translate_rate_limited' || apiMsg === 'translate_quota_exhausted') {
        setError(t('matchmakingPage.form.errors.rateLimited'));
      } else if (apiMsg === 'edit_once_used') {
        setError(t('matchmakingPage.form.errors.editOnceUsed'));
      } else if (code === 'unauthenticated' || apiMsg === 'unauthenticated' || apiMsg === 'not_authenticated') {
        setError(t('matchmakingPage.form.errors.mustLogin'));
      } else if (apiMsg === 'blocked') {
        setError(t('matchmakingPage.form.errors.blocked'));
      } else if (apiMsg === 'bad_request') {
        setError(t('matchmakingPage.form.errors.submitFailed'));
      } else if (apiMsg === 'api_unreachable') {
        setError(t('studio.errors.apiUnavailable'));
      } else if (typeof code === 'string' && (code.startsWith('storage/') || code.startsWith('cloudinary/') || code.startsWith('photo/'))) {
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
        // Best-effort: surfacing some HTTP context helps support/debugging.
        if (status && status >= 500) {
          setError(t('matchmakingPage.form.errors.submitFailed'));
        } else {
          setError(t('matchmakingPage.form.errors.submitFailed'));
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const mobileFlatWizardSectionClass = 'rounded-none border-0 bg-transparent p-0 text-white shadow-none backdrop-blur-none [&_label]:!text-white/90 [&_p]:!text-white/80 md:rounded-[26px] md:border md:border-white/10 md:bg-white/5 md:p-6 md:shadow-[0_20px_60px_rgba(0,0,0,0.25)] md:backdrop-blur-none';

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

      <main className={"relative max-w-3xl mx-auto px-4 " + (isEmbedded ? 'pt-6 pb-10' : 'pt-10 md:pt-20 pb-12')}>
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
          <div className={"mt-6 p-0 " + (isMobileAppFormTheme ? 'text-white ' : 'text-slate-900 ') + 'md:rounded-[28px] md:border md:border-slate-200/80 md:bg-slate-100 md:p-6 md:text-slate-900 md:shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:backdrop-blur-none'}>
          <form
            ref={formElRef}
            onSubmit={onSubmit}
            className="relative overflow-hidden space-y-5 rounded-none border-0 bg-transparent p-0 shadow-none backdrop-blur-none md:space-y-6 md:rounded-2xl md:border md:border-slate-200/80 md:bg-slate-50 md:p-6 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)] md:backdrop-blur-none [&_input]:bg-white [&_select]:bg-white [&_textarea]:bg-white [&_input]:text-slate-900 [&_select]:text-slate-900 [&_textarea]:text-slate-900 [&_input]:placeholder:text-slate-400 [&_textarea]:placeholder:text-slate-400 [&_select]:placeholder:text-slate-400 [&_option]:text-slate-900 [&_input]:shadow-sm [&_select]:shadow-sm [&_textarea]:shadow-sm [&_input:focus-visible]:outline-none [&_select:focus-visible]:outline-none [&_textarea:focus-visible]:outline-none [&_input:focus-visible]:ring-2 [&_select:focus-visible]:ring-2 [&_textarea:focus-visible]:ring-2 [&_input:focus-visible]:ring-amber-300/60 [&_select:focus-visible]:ring-amber-300/60 [&_textarea:focus-visible]:ring-amber-300/60 [&_input:focus-visible]:border-amber-300 [&_select:focus-visible]:border-amber-300 [&_textarea:focus-visible]:border-amber-300"
          >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-16 -right-12 h-44 w-44 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.22),rgba(251,191,36,0)_62%)] blur-2xl md:-top-24 md:-right-20 md:h-72 md:w-72 md:bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.18),rgba(245,158,11,0)_62%)] md:blur-none" />
            <div className="absolute -bottom-16 -left-12 h-48 w-48 bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.14),rgba(244,114,182,0)_60%)] blur-2xl md:-bottom-24 md:-left-20 md:h-80 md:w-80 md:bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.14),rgba(99,102,241,0)_60%)] md:blur-none" />
          </div>
          <div className="relative">

          <div className="sr-only" aria-hidden="true">
            <label>
              Leave blank
              <input
                value={form.hpCompany}
                onChange={onChange('hpCompany')}
                tabIndex={-1}
                name="contact_time"
                autoComplete="new-password"
                inputMode="none"
                data-lpignore="true"
                data-form-type="other"
              />
            </label>
          </div>

          {isWizardMode && isFullProfileMode ? (
            <div
              ref={wizardTopRef}
              className="rounded-[24px] border border-amber-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,248,235,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_16px_40px_rgba(148,163,184,0.14)] gemini-fade-up md:rounded-[26px] md:border-slate-700/70 md:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.82))] md:p-6 md:shadow-[0_20px_60px_rgba(2,6,23,0.40)] md:backdrop-blur-none"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,248,220,0.98),rgba(254,240,200,0.98))] px-3 py-1 text-[11px] font-bold tracking-wide text-amber-950 shadow-[0_10px_24px_rgba(245,158,11,0.10)] md:border-0 md:bg-none md:px-3 md:py-1 md:text-white md:shadow-none gemini-gradient">
                    {t('matchmakingPage.form.wizard.badge')}
                    <span className="text-amber-700/70 md:text-white/75">•</span>
                    <span className="text-amber-950 md:text-white/95">
                      {t('matchmakingPage.form.wizard.step', { current: wizardStep + 1, total: WIZARD_TOTAL_STEPS })}
                    </span>
                  </div>

                  {wizardCurrent?.title ? (
                    <h2 className={getMobileAppReadableTextClassName('mt-3 text-lg md:text-xl font-semibold text-slate-950 leading-snug md:text-white')}>
                      {wizardCurrent.title}
                    </h2>
                  ) : null}
                  {wizardCurrent?.desc ? (
                    <p className={getMobileAppReadableTextClassName('mt-1 text-sm leading-relaxed text-slate-700 md:text-slate-200')}>{wizardCurrent.desc}</p>
                  ) : null}

                  <div className="mt-5 hidden grid-cols-1 gap-2.5 md:grid md:grid-cols-3 md:gap-3">
                    {wizardSteps.map((step, index) => {
                      const isCurrent = index === wizardStep;
                      const isPassed = index < wizardStep;
                      return (
                        <div
                          key={step.title || index}
                          className={
                            'rounded-2xl border px-4 py-3 backdrop-blur-[2px] transition ' +
                            (isCurrent
                              ? 'border-amber-200/80 bg-amber-300/20 shadow-[0_14px_40px_rgba(245,158,11,0.22)]'
                              : isPassed
                                ? 'border-emerald-300/45 bg-emerald-400/14 shadow-[0_12px_32px_rgba(16,185,129,0.12)]'
                                : 'border-slate-200/80 bg-white/75 shadow-[0_10px_30px_rgba(148,163,184,0.08)] md:border-slate-700/70 md:bg-slate-900/65 md:shadow-none')
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ' +
                                (isCurrent
                                  ? 'bg-amber-300 text-slate-950'
                                  : isPassed
                                    ? 'bg-emerald-400 text-slate-950'
                                    : 'bg-slate-200 text-slate-700 md:bg-slate-800 md:text-slate-200')
                              }
                            >
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                                <div className={getMobileAppReadableTextClassName('text-sm font-semibold text-slate-900 md:text-slate-100')}>{step.title}</div>
                                <div className={getMobileAppReadableTextClassName('mt-0.5 line-clamp-2 text-xs text-slate-600 md:text-slate-300')}>{step.desc}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full flex-shrink-0 md:w-auto md:text-right">
                  <div className="px-0 py-0 md:rounded-2xl md:border md:border-slate-700/70 md:bg-slate-950/55 md:px-4 md:py-3 md:shadow-none">
                    <div className={getMobileAppReadableTextClassName('text-[11px] uppercase tracking-[0.18em] text-slate-500 md:text-slate-300')}>Progress</div>
                    <div className={getMobileAppReadableTextClassName('mt-1 text-lg font-semibold text-slate-900 md:text-slate-50')}>{Math.round(((wizardStep + 1) / WIZARD_TOTAL_STEPS) * 100)}%</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-amber-100 md:bg-slate-800">
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
              <div className="mt-3">
                <Link
                  to="/uygulama"
                  className="inline-flex items-center rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-100"
                >
                  {t('matchmakingPage.form.installAppCta')}
                </Link>
              </div>
            </div>
          )}

          {isDraftResumeApplication ? (
            <div className="rounded-[22px] border border-sky-200 bg-sky-50 p-4 text-sky-950 shadow-[0_12px_32px_rgba(14,165,233,0.10)]">
              <p className="text-sm font-semibold">{t('matchmakingPage.form.draftResume.title')}</p>
              <p className="mt-1 text-sm leading-relaxed text-sky-900/80">{t('matchmakingPage.form.draftResume.body')}</p>
              {!hasExistingPhoto ? (
                <p className="mt-2 text-sm leading-relaxed text-sky-900/90">{t('matchmakingPage.form.draftResume.photoMissing')}</p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-[22px] border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,250,240,0.96),rgba(255,243,214,0.92))] p-4 text-amber-950 shadow-[0_14px_36px_rgba(245,158,11,0.10)] md:border-slate-200 md:bg-white md:text-slate-900 md:shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-amber-700 md:bg-slate-100 md:text-slate-700">
                  {isFullProfileMode ? applyFlowUi.fullBadge : applyFlowUi.shortBadge}
                </div>
                <p className="mt-3 text-base font-semibold">{isFullProfileMode ? applyFlowUi.fullTitle : applyFlowUi.shortTitle}</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-900/80 md:text-slate-600">
                  {isFullProfileMode ? applyFlowUi.fullBody : applyFlowUi.shortBody}
                </p>
              </div>
            </div>
          </div>

          {(!isWizardMode || wizardStep === 0) && (
            <div
              key={isWizardMode ? `wizard-step-${wizardStep}` : 'all-steps'}
              className={
                isWizardMode
                  ? mobileFlatWizardSectionClass
                  : ''
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={getLabelClassName('username', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.username')}</label>
                  <input
                    ref={registerFieldRef('username')}
                    value={form.username}
                    onChange={onChange('username')}
                    className={getFieldClassName('username')}
                    placeholder={t('matchmakingPage.form.placeholders.username')}
                  />
                </div>
                <div>
                  <label className={getLabelClassName('fullName', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.fullName')}</label>
                  <input
                    ref={registerFieldRef('fullName')}
                    value={form.fullName}
                    onChange={onChange('fullName')}
                    className={getFieldClassName('fullName')}
                    placeholder={t('matchmakingPage.form.placeholders.fullName')}
                  />
                </div>

                {isEditOnceMode ? (
                  <div className="md:col-span-2">
                    <label className={getMobileAppReadableTextClassName('block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.inviteCode')}</label>
                    <input
                      value={form.inviteCode}
                      onChange={onChange('inviteCode')}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      inputMode="numeric"
                      placeholder={t('matchmakingPage.form.placeholders.inviteCode')}
                    />
                    <div className="mt-2 text-xs text-white/70">{t('matchmakingPage.form.inviteCodeHelp')}</div>
                  </div>
                ) : null}

                <div>
                  <label className={getLabelClassName('age', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.age')}</label>
                  <input
                    ref={registerFieldRef('age')}
                    value={form.age}
                    onChange={onChange('age')}
                    className={getFieldClassName('age')}
                    inputMode="numeric"
                    placeholder={t('matchmakingPage.form.placeholders.age')}
                  />
                </div>
                <div>
                  <label className={getLabelClassName('city', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.city')}</label>
                  <input
                    ref={registerFieldRef('city')}
                    value={form.city}
                    onChange={onChange('city')}
                    className={getFieldClassName('city')}
                    placeholder={t('matchmakingPage.form.placeholders.city')}
                  />
                </div>
                <div>
                  <label className={getLabelClassName('nationality', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.nationality')}</label>
                  <input
                    ref={registerFieldRef('nationality')}
                    value={form.nationality}
                    onChange={onChange('nationality')}
                    maxLength={60}
                    className={getFieldClassName('nationality')}
                    placeholder={t('matchmakingPage.form.placeholders.nationality')}
                  />
                </div>
                <div>
                  <label className={getLabelClassName('gender', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.gender')}</label>
                  <select
                    ref={registerFieldRef('gender')}
                    value={form.gender}
                    onChange={onGenderChange}
                    className={getFieldClassName('gender')}
                  >
                    {genderOptions.map((opt) => (
                      <option key={opt.id} value={opt.id} disabled={!opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!isEditOnceMode ? (
                  <>
                    <div>
                      <label className={getLabelClassName('occupation', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.occupation')}</label>
                      <input
                        ref={registerFieldRef('occupation')}
                        value={form.occupation}
                        onChange={onChange('occupation')}
                        className={getFieldClassName('occupation')}
                        placeholder={t('matchmakingPage.form.placeholders.occupation')}
                      />
                    </div>
                    <div>
                      <label className={getLabelClassName('maritalStatus', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.maritalStatus')}</label>
                      <select
                        ref={registerFieldRef('maritalStatus')}
                        value={form.maritalStatus}
                        onChange={onMaritalStatusChange}
                        className={getFieldClassName('maritalStatus')}
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
                          <label className={getLabelClassName('hasChildren', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.hasChildren')}</label>
                          <select
                            ref={registerFieldRef('hasChildren')}
                            value={form.hasChildren}
                            onChange={onHasChildrenChange}
                            className={getFieldClassName('hasChildren')}
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
                              <label className={getLabelClassName('childrenCount', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.childrenCount')}</label>
                              <input
                                ref={registerFieldRef('childrenCount')}
                                value={form.childrenCount}
                                onChange={onChange('childrenCount')}
                                className={getFieldClassName('childrenCount')}
                                inputMode="numeric"
                                placeholder={t('matchmakingPage.form.placeholders.childrenCount')}
                              />
                            </div>

                            <div>
                              <label className={getLabelClassName('childrenLivingSituation', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.childrenLivingSituation')}</label>
                              <select
                                ref={registerFieldRef('childrenLivingSituation')}
                                value={form.childrenLivingSituation}
                                onChange={onChange('childrenLivingSituation')}
                                className={getFieldClassName('childrenLivingSituation')}
                              >
                                {childrenLivingSituationOptions.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={getLabelClassName('liveWithChildrenAfterMarriage', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.liveWithChildrenAfterMarriage')}</label>
                              <select
                                ref={registerFieldRef('liveWithChildrenAfterMarriage')}
                                value={form.liveWithChildrenAfterMarriage}
                                onChange={onChange('liveWithChildrenAfterMarriage')}
                                className={getFieldClassName('liveWithChildrenAfterMarriage')}
                              >
                                {yesNoOptions.map((opt) => (
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
                  </>
                ) : null}

                <div>
                  <label className={getLabelClassName('whatsapp', 'block text-sm font-semibold text-white/90 md:text-slate-800')}>{t('matchmakingPage.form.labels.whatsapp')}</label>
                  <input
                    ref={registerFieldRef('whatsapp')}
                    value={form.whatsapp}
                    onChange={onChange('whatsapp')}
                    className={getFieldClassName('whatsapp')}
                    placeholder={t('matchmakingPage.form.placeholders.whatsapp')}
                  />
                  <div className="mt-2 space-y-1 text-xs text-white/70">
                    <div>{applyFlowUi.whatsappPrivacyBody}</div>
                    <div>{t('matchmakingPage.form.contactNumberNote')}</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {isFullProfileMode && (!isWizardMode || wizardStep === 1) && (
          <div
            key={isWizardMode ? `wizard-step-${wizardStep}` : 'all-steps-more'}
            className={
              isWizardMode
                ? mobileFlatWizardSectionClass
                : 'rounded-[24px] border border-white/12 bg-white/5 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm md:rounded-xl md:border md:border-slate-200 md:bg-transparent md:p-4 md:shadow-none md:backdrop-blur-none'
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

              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.about')}</label>
                <textarea
                  value={form.about}
                  onChange={onChange('about')}
                  className="mt-1 min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder={t('matchmakingPage.form.placeholders.about')}
                />
              </div>
            </div>
          </div>
          )}

          {isFullProfileMode && (!isWizardMode || wizardStep === 2) && (
          <div
            key={isWizardMode ? `wizard-step-${wizardStep}` : 'all-steps-identity'}
            className={
              isWizardMode
                ? mobileFlatWizardSectionClass
                : ''
            }
          >
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerHeightMin')}</label>
                <select
                  value={form.partnerPreferences?.heightMinCm || ''}
                  onChange={onPartnerChange('heightMinCm')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('matchmakingPage.form.options.common.select')}</option>
                  <option value="doesnt_matter">{t('matchmakingPage.form.options.common.doesntMatter')}</option>
                  {heightRangeOptions.map((cm) => (
                    <option key={cm} value={cm}>{cm} cm</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerHeightMax')}</label>
                <select
                  value={form.partnerPreferences?.heightMaxCm || ''}
                  onChange={onPartnerChange('heightMaxCm')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">{t('matchmakingPage.form.options.common.select')}</option>
                  <option value="doesnt_matter">{t('matchmakingPage.form.options.common.doesntMatter')}</option>
                  {heightRangeOptions.map((cm) => (
                    <option key={cm} value={cm}>{cm} cm</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerAgeMaxOlderYears')}</label>
                <select
                  value={form.partnerPreferences?.ageMaxOlderYears || ''}
                  onChange={onPartnerChange('ageMaxOlderYears')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerAgeDiffOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerAgeMaxYoungerYears')}</label>
                <select
                  value={form.partnerPreferences?.ageMaxYoungerYears || ''}
                  onChange={onPartnerChange('ageMaxYoungerYears')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerAgeDiffOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {partnerAgeMinForUi !== null && partnerAgeMaxForUi !== null ? (
                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600">
                  {t('matchmakingPage.form.hints.partnerAgeComputed', { min: partnerAgeMinForUi, max: partnerAgeMaxForUi })}
                </div>
              ) : null}

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerMaritalStatus')}</label>
                <select
                  value={form.partnerPreferences?.maritalStatus || ''}
                  onChange={onPartnerChange('maritalStatus')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerMaritalStatusOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerReligion')}</label>
                <select
                  value={form.partnerPreferences?.religion || ''}
                  onChange={onPartnerChange('religion')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {religionOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerLivingCountry')}</label>
                <select
                  value={form.partnerPreferences?.livingCountry || ''}
                  onChange={onPartnerChange('livingCountry')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {nationalityPreferenceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerCommunicationLanguages')}</label>
                <select
                  value={form.partnerPreferences?.communicationLanguage || ''}
                  onChange={onPartnerChange('communicationLanguage')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerCommunicationLanguageOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {form.partnerPreferences?.communicationLanguage === 'other' ? (
                <div className="md:col-span-2">
                  <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerCommunicationLanguageOther')}</label>
                  <input
                    value={form.partnerPreferences?.communicationLanguageOther || ''}
                    onChange={onPartnerChange('communicationLanguageOther')}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder={t('matchmakingPage.form.placeholders.partnerCommunicationLanguageOther')}
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerSmokingPreference')}</label>
                <select
                  value={form.partnerPreferences?.smokingPreference || ''}
                  onChange={onPartnerChange('smokingPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {yesNoDoesntMatterOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerAlcoholPreference')}</label>
                <select
                  value={form.partnerPreferences?.alcoholPreference || ''}
                  onChange={onPartnerChange('alcoholPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {yesNoDoesntMatterOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerChildrenPreference')}</label>
                <select
                  value={form.partnerPreferences?.childrenPreference || 'doesnt_matter'}
                  onChange={onPartnerChange('childrenPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerChildrenPreferenceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerEducationPreference')}</label>
                <select
                  value={form.partnerPreferences?.educationPreference || 'doesnt_matter'}
                  onChange={onPartnerChange('educationPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerEducationPreferenceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerOccupationPreference')}</label>
                <select
                  value={form.partnerPreferences?.occupationPreference || 'doesnt_matter'}
                  onChange={onPartnerChange('occupationPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerOccupationPreferenceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-white/80 md:text-slate-700">{t('matchmakingPage.form.labels.partnerFamilyValuesPreference')}</label>
                <select
                  value={form.partnerPreferences?.familyValuesPreference || 'doesnt_matter'}
                  onChange={onPartnerChange('familyValuesPreference')}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {partnerFamilyValuesPreferenceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white md:text-slate-900">{t('matchmakingPage.form.labels.expectations')}</label>
              <textarea
                value={form.expectations}
                onChange={onChange('expectations')}
                className="mt-1 min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('matchmakingPage.form.placeholders.expectations')}
              />
            </div>
          </div>

          </div>
          )}

          {genderConfirm.open && typeof document !== 'undefined'
            ? createPortal(
                <div
                  className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="mk-gender-confirm-title"
                  onClick={confirmGenderCancel}
                >
                  <div
                    className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="border-b border-slate-200 px-5 py-4">
                      <p id="mk-gender-confirm-title" className="font-semibold text-slate-900">
                        {t('matchmakingPage.form.confirmGender.title')}
                      </p>
                    </div>
                    <div className="px-5 py-5">
                      <p className="text-sm leading-relaxed text-slate-700">
                        {t('matchmakingPage.form.confirmGender.text', { gender: genderConfirmLabel })}
                      </p>
                      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={confirmGenderCancel}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          {t('matchmakingPage.form.confirmGender.cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={confirmGenderApply}
                          className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
                        >
                          {t('matchmakingPage.form.confirmGender.confirm')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )
            : null}

          {photoManagerOpen && typeof document !== 'undefined'
            ? createPortal(
                <div
                  className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-950/70 p-4"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="mk-photo-manager-title"
                  onClick={closePhotoManager}
                >
                  <div
                    className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.35)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="border-b border-slate-200 px-5 py-4 md:px-7 md:py-5">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p id="mk-photo-manager-title" className="text-lg font-semibold text-slate-900">
                            {applyFlowUi.photoTitle}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">{applyFlowUi.photoBody}</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">{photoPrivacyNotice}</p>
                          <p className="mt-1 text-sm font-medium leading-relaxed text-amber-700">{applyFlowUi.photoFormatWarning}</p>
                        </div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {applyFlowUi.photoCount.replace('{{count}}', String(preparedPhotoCount))}
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-4 md:px-5 md:py-5">
                      <div className="grid grid-cols-5 gap-2.5">
                        {photoSlots.map((slot) => {
                          return (
                          <div key={slot.key} className="rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
                            <div className="relative">
                              <div
                                aria-label={`${applyFlowUi.photoSlotLabel} ${slot.index + 1}`}
                                className={
                                  'group block w-full overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white text-left ' +
                                  (submitting ? 'pointer-events-none opacity-60' : 'cursor-pointer')
                                }
                              >
                                <div className="relative aspect-square w-full bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),rgba(255,255,255,0.92))]">
                                  {slot.previewUrl ? (
                                    <img src={slot.previewUrl} alt={`photo-slot-${slot.index + 1}`} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full items-center justify-center px-1 text-center text-[11px] font-medium leading-tight text-slate-500">
                                      {applyFlowUi.photoSlotLabel} {slot.index + 1}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {submitting ? null : (
                                <input
                                  type="file"
                                  accept="image/*,.heic,.heif,.avif"
                                  aria-label={`${applyFlowUi.photoSlotLabel} ${slot.index + 1}`}
                                  tabIndex={-1}
                                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                  onChange={onPickPhoto(slot.key)}
                                />
                              )}
                            </div>
                            <div className="mt-2 space-y-1.5">
                              <div className="text-center text-[10px] font-medium leading-tight text-slate-500">
                                {slot.hasNewSelection
                                  ? applyFlowUi.photoSelected
                                  : slot.hasExisting
                                    ? applyFlowUi.photoExisting
                                    : applyFlowUi.photoEmpty}
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="w-full rounded-full bg-slate-900 px-2 py-1.5 text-center text-[10px] font-semibold text-white">
                                  {applyFlowUi.photoSlotLabel} {slot.index + 1}
                                </div>
                                {slot.hasNewSelection ? (
                                  <button
                                    type="button"
                                    onClick={() => clearSelectedPhoto(slot.key)}
                                    className="w-full rounded-full border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    X
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );})}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 px-5 py-4 md:px-7">
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={closePhotoManager}
                          className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          {applyFlowUi.photoDone}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )
            : null}

          {(!isWizardMode || wizardStep === consentsWizardStep) && (
          <div
            key={isWizardMode ? `wizard-step-${wizardStep}-consents` : 'all-steps-consents'}
            className={
              isWizardMode
                ? mobileFlatWizardSectionClass
                : ''
            }
          >
          <div ref={photoSectionRef}>
            <div className={invalidFieldSet.has('photo') ? 'rounded-[24px] border border-rose-300 bg-rose-50 p-4 shadow-[0_14px_32px_rgba(244,63,94,0.10)]' : 'rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-[0_14px_32px_rgba(15,23,42,0.08)]'}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <label className={getLabelClassName('photo', 'block text-sm font-semibold text-slate-800')}>{applyFlowUi.photoTitle}</label>
                </div>
                <button
                  type="button"
                  onClick={togglePhotoManager}
                  className={invalidFieldSet.has('photo') ? 'inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(244,63,94,0.22)] hover:bg-rose-700' : 'inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(15,23,42,0.18)] hover:bg-slate-800'}
                >
                  {applyFlowUi.photoCta}
                </button>
              </div>

              <div className="mt-3 text-xs font-medium text-slate-600">{applyFlowUi.photoCount.replace('{{count}}', String(preparedPhotoCount))}</div>
              <div className="mt-2 text-xs leading-relaxed text-slate-600">{photoPrivacyNotice}</div>
              <div className="mt-2 text-xs font-medium leading-relaxed text-amber-700">{applyFlowUi.photoFormatWarning}</div>
              {invalidFieldSet.has('photo') ? <div className="mt-2 text-xs font-semibold text-rose-700">{error || t('matchmakingPage.form.errors.photoRequired')}</div> : null}
            </div>
          </div>

          <div ref={consentsSectionRef} className={isWizardMode ? 'space-y-3' : 'space-y-3 rounded-none border-0 md:rounded-xl md:border md:border-slate-200 p-0 md:p-4'}>
            <label className={getLabelClassName('consent18Plus', 'flex items-start gap-3 text-sm text-white/80 md:text-slate-800')}>
              <input ref={registerFieldRef('consent18Plus')} type="checkbox" checked={form.consent18Plus} onChange={onChange('consent18Plus')} className="mt-1" />
              <span>{t('matchmakingPage.form.consents.age', { minAge: isIndonesianNationality(form.nationality) ? 21 : 18 })}</span>
            </label>
            <label className={getLabelClassName('consentPrivacy', 'flex items-start gap-3 text-sm text-white/80 md:text-slate-800')}>
              <input ref={registerFieldRef('consentPrivacy')} type="checkbox" checked={form.consentPrivacy} onChange={onChange('consentPrivacy')} className="mt-1" />
              <span>
                <Trans
                  i18nKey="matchmakingPage.form.consents.privacy"
                  components={{
                    privacyLink: (
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 md:text-sky-200 hover:underline font-semibold"
                      />
                    ),
                    kvkkLink: (
                      <a
                        href={i18n.language?.startsWith('en') ? '/docs/kvkk-information-notice-en.html' : '/docs/kvkk-aydinlatma-metni.html'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 md:text-sky-200 hover:underline font-semibold"
                      />
                    ),
                  }}
                />
              </span>
            </label>
            <label className={getLabelClassName('consentTerms', 'flex items-start gap-3 text-sm text-white/80 md:text-slate-800')}>
              <input ref={registerFieldRef('consentTerms')} type="checkbox" checked={form.consentTerms} onChange={onChange('consentTerms')} className="mt-1" />
              <span>
                <Trans
                  i18nKey="matchmakingPage.form.consents.terms"
                  components={{
                    termsLink: (
                      <a
                        href="/docs/matchmaking-kullanim-sozlesmesi.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 md:text-sky-200 hover:underline font-semibold"
                      />
                    ),
                  }}
                />
              </span>
            </label>
            {invalidFieldSet.has('consent18Plus') || invalidFieldSet.has('consentPrivacy') || invalidFieldSet.has('consentTerms') ? (
              <div className="text-xs font-semibold text-rose-700">{t('matchmakingPage.form.errors.consentsRequired', { minAge: isIndonesianNationality(form.nationality) ? 21 : 18 })}</div>
            ) : null}
          </div>

          </div>
          )}

          <div ref={submitFeedbackRef} />
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 text-sm">
              {error}
            </div>
          )}

          {isWizardMode && isFullProfileMode ? (
            <div className="w-full border-t border-amber-200/70 pt-4 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
              <div className="mb-4 overflow-hidden rounded-[20px] border border-amber-200/80 bg-[linear-gradient(135deg,#fff8df,#fff0c2)] p-3 text-amber-950 shadow-[0_12px_28px_rgba(245,158,11,0.10)] md:rounded-[24px] md:p-4 md:shadow-[0_16px_40px_rgba(245,158,11,0.12)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700/75">
                      {wizardStep >= WIZARD_TOTAL_STEPS - 1 ? t('matchmakingPage.form.wizard.completeCta') : t('matchmakingPage.form.wizard.step', { current: wizardStep + 1, total: WIZARD_TOTAL_STEPS })}
                    </div>
                    <div className="mt-1 text-sm font-medium leading-relaxed text-amber-950">{wizardCheckpoint}</div>
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={goWizardBack}
                  disabled={submitting || (wizardStep <= 0 && !isEditOnceMode)}
                  className="order-3 w-full sm:order-1 sm:w-40 gemini-organic-btn rounded-full border border-slate-200 bg-white text-slate-900 font-semibold py-3 shadow-[0_10px_30px_rgba(148,163,184,0.10)] hover:bg-slate-50 transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
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
                    {submitting ? t('matchmakingPage.form.submitting') : t('matchmakingPage.form.wizard.completeCta')}
                  </button>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="order-2 w-full sm:order-2 sm:w-44 gemini-organic-btn rounded-full border border-slate-200 bg-white text-slate-900 font-semibold py-3 shadow-[0_10px_30px_rgba(148,163,184,0.10)] hover:bg-slate-50 transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                      aria-busy={submitting ? 'true' : 'false'}
                    >
                      {submitting ? t('matchmakingPage.form.submitting') : t('matchmakingPage.form.wizard.finish')}
                    </button>
                    <button
                      type="button"
                      onClick={goWizardNext}
                      disabled={submitting}
                      className="order-1 w-full sm:order-3 sm:w-56 gemini-organic-btn rounded-full gemini-gradient text-white font-semibold py-3 shadow-[0_18px_50px_rgba(244,63,94,0.20)] hover:brightness-110 transition disabled:opacity-60 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      {t('matchmakingPage.form.wizard.next')}
                    </button>
                  </>
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
                {submitting ? t('matchmakingPage.form.submitting') : (!isFullProfileMode ? t('matchmakingPage.form.wizard.completeCta') : t('matchmakingPage.form.submit'))}
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
