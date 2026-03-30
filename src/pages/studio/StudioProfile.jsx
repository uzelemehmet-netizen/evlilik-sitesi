import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocFromServer, getDocs, limit, onSnapshot, query, where } from 'firebase/firestore';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { getDownloadURL, ref } from 'firebase/storage';
import { AlertTriangle, BookOpen, Compass, Edit, Images, LogOut, Menu, MessageCircle, Share2, ShieldCheck, Star, Trash2, UploadCloud, Users, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useAuth } from '../../auth/AuthProvider';
import { auth } from '../../config/firebaseAuth';
import { db } from '../../config/firebaseDb';
import { storage } from '../../config/firebaseStorage';
import { authFetch } from '../../utils/authFetch';
import { uploadImageToCloudinaryAuto } from '../../utils/cloudinaryUpload';
import { translateStudioApiError } from '../../utils/studioErrorI18n';
import { buildWhatsAppShareUrl, buildWhatsAppUrl, getWhatsAppNumber } from '../../utils/whatsapp';
import PwaInstallCard from '../../components/PwaInstallCard.jsx';
import { openPreviewGate } from '../../utils/previewGate';
import { buildPreviewProfile } from '../../utils/studioPreviewData';
import StudioBottomNav from '../../components/studio/StudioBottomNav';
import { isOneTimeHintShown, markOneTimeHintShown } from '../../utils/oneTimeHints.js';
import { isPwaInstalled } from '../../utils/pwaInstalled.js';
import { enablePushForCurrentUser, hasSavedPushToken } from '../../utils/pushNotifications.js';
import { trackClick } from '../../utils/clickTracker';

const DEFAULT_LOOKING_FOR_NATIONALITY = 'id';

function getBaseLang(raw) {
  const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'in') return 'id';
  if (base === 'tr' || base === 'en' || base === 'id') return base;
  return 'tr';
}

function getStudioTrustUi(lang) {
  const copy = {
    tr: {
      eyebrow: 'Uye odasi',
      title: 'Profiliniz herkesin baktigi bir vitrin gibi calismaz',
      body: 'Fotograflar, dogrulama ve temas ayni anda acilmaz. Sistem, duzgun bir akisi korumak icin bunlari kontrollu yonetir.',
      facts: [
        'Profil ve fotograflar kontrollu akista gorunur',
        'Dogrulanmis hesaplar daha guvenli sinyal verir',
        'Iletisim once sistem ici adimlardan gecer',
      ],
    },
    en: {
      eyebrow: 'Member room',
      title: 'Your profile does not work like a public showcase',
      body: 'Photos, verification and contact do not open at the same time. The system controls each part to keep the flow orderly.',
      facts: [
        'Profile and photos appear in a controlled flow',
        'Verified accounts send a stronger trust signal',
        'Contact first moves through in-system steps',
      ],
    },
    id: {
      eyebrow: 'Ruang anggota',
      title: 'Profil Anda tidak bekerja seperti etalase publik',
      body: 'Foto, verifikasi, dan kontak tidak dibuka bersamaan. Sistem mengatur semuanya agar alurnya tetap rapi.',
      facts: [
        'Profil dan foto tampil dalam alur yang terkontrol',
        'Akun terverifikasi memberi sinyal kepercayaan lebih kuat',
        'Kontak selalu melewati langkah sistem terlebih dahulu',
      ],
    },
  };

  return copy[lang] || copy.tr;
}

const LS_PUSH_AFTER_INSTALL_PENDING_PREFIX = 'uniqah:push:nudgeAfterInstall:pending';
const LS_PUSH_AFTER_INSTALL_DISMISSED_PREFIX = 'uniqah:push:nudgeAfterInstall:dismissed';

function deriveLookingForGender(gender) {
  const value = String(gender || '').trim().toLowerCase();
  if (value === 'male') return 'female';
  if (value === 'female') return 'male';
  return '';
}

function pushAfterInstallKey(prefix, uid) {
  return `${prefix}:${uid}`;
}

function isPushEnabledInBrowser() {
  if (typeof window === 'undefined') return false;
  try {
    if (!('Notification' in window)) return false;
    if (String(Notification.permission || '') !== 'granted') return false;
  } catch {
    return false;
  }

  try {
    return hasSavedPushToken();
  } catch {
    return false;
  }
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeGenderValue(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function normalizeMaritalStatus(v) {
  return safeStr(v).toLowerCase();
}

function isMinimumProfileCompleteFromUserAndApp(mmUser, latestApp) {
  const userDoc = mmUser && typeof mmUser === 'object' ? mmUser : {};
  const appFromUser = userDoc?.application && typeof userDoc.application === 'object' ? userDoc.application : null;
  const publicProfile = userDoc?.publicProfile && typeof userDoc.publicProfile === 'object' ? userDoc.publicProfile : null;
  const app = latestApp && typeof latestApp === 'object' ? latestApp : null;

  const merged = {
    ...(publicProfile || {}),
    ...(appFromUser || {}),
    ...(app || {}),
    ...(userDoc || {}),
    details: {
      ...((publicProfile && typeof publicProfile.details === 'object' ? publicProfile.details : {}) || {}),
      ...((appFromUser && typeof appFromUser.details === 'object' ? appFromUser.details : {}) || {}),
      ...((app && typeof app.details === 'object' ? app.details : {}) || {}),
      ...((userDoc?.details && typeof userDoc.details === 'object' ? userDoc.details : {}) || {}),
    },
  };

  const details = merged?.details && typeof merged.details === 'object' ? merged.details : {};

  const fullName = safeStr(merged?.fullName);
  const age = asNum(merged?.age);
  const gender = normalizeGenderValue(merged?.gender);
  const city = safeStr(merged?.city);
  const country = safeStr(merged?.country);
  const nationality = safeStr(merged?.nationality);
  const occupation = safeStr(details?.occupation) || safeStr(merged?.occupation);
  const maritalStatus = normalizeMaritalStatus(details?.maritalStatus || merged?.maritalStatus);

  if (!fullName) return false;
  if (!(typeof age === 'number' && Number.isFinite(age) && age >= 18 && age <= 99)) return false;
  if (!gender) return false;
  if (!city) return false;
  if (!country) return false;
  if (!nationality) return false;
  if (!occupation) return false;
  if (!maritalStatus) return false;

  if (maritalStatus === 'widowed' || maritalStatus === 'divorced') {
    const hasChildren = safeStr(details?.hasChildren || merged?.hasChildren).toLowerCase();
    if (!hasChildren) return false;
    if (hasChildren === 'yes') {
      const cnt = asNum(details?.childrenCount);
      if (!(typeof cnt === 'number' && Number.isFinite(cnt) && cnt >= 1 && cnt <= 20)) return false;
    }
  }

  return true;
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

function appCompletenessScore(app) {
  if (!app || typeof app !== 'object') return 0;
  let s = 0;
  if (typeof app?.age === 'number' && Number.isFinite(app.age)) s += 3;
  if (safeStr(app?.gender)) s += 3;
  if (safeStr(app?.country)) s += 2;
  if (safeStr(app?.city)) s += 1;
  if (safeStr(app?.nationality)) s += 1;
  const photos = Array.isArray(app?.photoUrls) ? app.photoUrls.filter(Boolean) : [];
  if (photos.length) s += 1;
  if (safeStr(app?.about) || safeStr(app?.details?.about)) s += 1;
  if (safeStr(app?.expectations)) s += 1;
  return s;
}

function pickMoreCompleteApp(a, b) {
  const sa = appCompletenessScore(a);
  const sb = appCompletenessScore(b);
  if (sb > sa) return b;
  return a || b || null;
}

export default function StudioProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const rawUid = String(user?.uid || '').trim();
  const isPreview = !user || user.isAnonymous || !rawUid;
  const uid = isPreview ? '' : rawUid;

  const [pwaInstalled, setPwaInstalled] = useState(() => isPwaInstalled());
  const [pushAfterInstallPending, setPushAfterInstallPending] = useState(false);
  const [pushAfterInstallDismissed, setPushAfterInstallDismissed] = useState(false);
  const [pushEnabledNow, setPushEnabledNow] = useState(() => isPushEnabledInBrowser());
  const [pushNudgeBusy, setPushNudgeBusy] = useState(false);
  const [pushNudgeFeedback, setPushNudgeFeedback] = useState('');

  useEffect(() => {
    if (!uid) {
      setPushAfterInstallPending(false);
      setPushAfterInstallDismissed(false);
      return;
    }

    try {
      const pending = window.localStorage.getItem(pushAfterInstallKey(LS_PUSH_AFTER_INSTALL_PENDING_PREFIX, uid)) === '1';
      const dismissed = window.localStorage.getItem(pushAfterInstallKey(LS_PUSH_AFTER_INSTALL_DISMISSED_PREFIX, uid)) === '1';
      setPushAfterInstallPending(pending);
      setPushAfterInstallDismissed(dismissed);
    } catch {
      setPushAfterInstallPending(false);
      setPushAfterInstallDismissed(false);
    }
  }, [uid]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onAppInstalled = () => {
      setPwaInstalled(true);

      // After install, show a one-time (dismissible) reminder to enable notifications.
      if (uid) {
        try {
          window.localStorage.setItem(pushAfterInstallKey(LS_PUSH_AFTER_INSTALL_PENDING_PREFIX, uid), '1');
          window.localStorage.removeItem(pushAfterInstallKey(LS_PUSH_AFTER_INSTALL_DISMISSED_PREFIX, uid));
        } catch {
          // ignore
        }
        setPushAfterInstallPending(true);
        setPushAfterInstallDismissed(false);
      }
    };

    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [uid]);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuWrapRef = useRef(null);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [location?.pathname]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setProfileMenuOpen(false);
    };

    const onPointerDown = (e) => {
      const wrap = profileMenuWrapRef.current;
      if (!wrap) return;
      if (wrap.contains(e.target)) return;
      setProfileMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [profileMenuOpen]);

  const isTr = String(i18n?.language || '').toLowerCase().startsWith('tr');
  const shortLabel = (fallbackKey, trText) => (isTr ? trText : t(fallbackKey));
  const studioTrustUi = getStudioTrustUi(getBaseLang(i18n?.language));

  useEffect(() => {
    setPushEnabledNow(isPushEnabledInBrowser());
  }, [pwaInstalled]);

  const blockInteraction = () => {
    openPreviewGate({ reason: t('previewGate.body') });
  };

  const [mmUser, setMmUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [applyBannerOpen, setApplyBannerOpen] = useState(true);
  

  const [latestApp, setLatestApp] = useState(null);
  const [latestAppId, setLatestAppId] = useState('');
  const [appLoading, setAppLoading] = useState(true);

  const [deleteState, setDeleteState] = useState({ loading: false, error: '' });
  const [membershipAction, setMembershipAction] = useState({ loading: false, error: '', success: '' });

  const [inviteState, setInviteState] = useState({ loading: false, error: '' });

  const [emailVerifyState, setEmailVerifyState] = useState({ loading: false, error: '', success: '' });

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [identityIntroModalOpen, setIdentityIntroModalOpen] = useState(false);
  const [actionIntroModal, setActionIntroModal] = useState({ open: false, hintId: '', title: '', body: '', cta: '' });
  const actionIntroContinueRef = useRef(null);
  const [guidanceModalOpen, setGuidanceModalOpen] = useState(false);
  const guidanceScrollRef = useRef(null);
  const [verifySocialForm, setVerifySocialForm] = useState({ platform: 'instagram', username: '' });
  const [verifyAction, setVerifyAction] = useState({ loading: false, error: '', success: '' });
  const [verifyMode, setVerifyMode] = useState('whatsapp_video'); // whatsapp_video | social
  const [verifySelectAction, setVerifySelectAction] = useState({ loading: false, error: '', result: null });

  const openVerifyModalFlow = () => {
    setVerifyAction({ loading: false, error: '', success: '' });
    setVerifySelectAction({ loading: false, error: '', result: null });
    setEmailVerifyState({ loading: false, error: '', success: '' });
    const nextMode = !whatsappNumber
      ? 'social'
      : String(profile?.identityMethod || '').toLowerCase().trim() === 'social'
        ? 'social'
        : 'whatsapp_video';
    setVerifyMode(nextMode);
    setVerifyModalOpen(true);
  };

  const onClickVerifyNow = () => {
    if (isPreview) return blockInteraction();
    const hintId = 'identity-verify-intro-v1';
    if (isOneTimeHintShown(uid, hintId)) return openVerifyModalFlow();
    setIdentityIntroModalOpen(true);
  };

  const closeActionIntroModal = () => {
    setActionIntroModal({ open: false, hintId: '', title: '', body: '', cta: '' });
    actionIntroContinueRef.current = null;
  };

  const openOneTimeActionIntro = ({ hintId, titleKey, bodyKey, ctaKey, onContinue }) => {
    if (isPreview) return blockInteraction();

    const id = String(hintId || '').trim();
    if (!id) return;

    if (isOneTimeHintShown(uid, id)) {
      try {
        onContinue?.();
      } catch {
        // ignore
      }
      return;
    }

    actionIntroContinueRef.current = () => {
      markOneTimeHintShown(uid, id);
      try {
        onContinue?.();
      } catch {
        // ignore
      }
    };

    setActionIntroModal({
      open: true,
      hintId: id,
      title: t(titleKey),
      body: t(bodyKey),
      cta: t(ctaKey),
    });
  };

  const [textDraft, setTextDraft] = useState({ about: '', expectations: '' });
  const [textTouched, setTextTouched] = useState(false);
  const [textSaveState, setTextSaveState] = useState({ loading: false, error: '', success: '' });

  const [partnerPrefsModalOpen, setPartnerPrefsModalOpen] = useState(false);
  const [partnerPrefsDraft, setPartnerPrefsDraft] = useState({
    lookingForNationality: DEFAULT_LOOKING_FOR_NATIONALITY,
    lookingForGender: '',
    partnerPreferences: {
      heightMinCm: '',
      heightMaxCm: '',
      ageMaxOlderYears: '',
      ageMaxYoungerYears: '',
      maritalStatus: '',
      religion: '',
      livingCountry: '',
      childrenPreference: '',
      educationPreference: '',
      occupationPreference: '',
      familyValuesPreference: '',
      smokingPreference: '',
      alcoholPreference: '',
      communicationMethods: [],
    },
  });
  const [partnerPrefsSaveState, setPartnerPrefsSaveState] = useState({ loading: false, error: '', success: '' });

  const [photoPrivacyState, setPhotoPrivacyState] = useState({ loading: false, error: '' });
  const [localPhotosBlurred, setLocalPhotosBlurred] = useState(null);
  const [photoUpdateAction, setPhotoUpdateAction] = useState({ loading: false, error: '', success: '' });
  const [showAllMyPhotos, setShowAllMyPhotos] = useState(false);

  const [photoManagerOpen, setPhotoManagerOpen] = useState(false);
  const [photoManagerDraft, setPhotoManagerDraft] = useState({
    urls: ['', '', '', '', ''],
    files: [null, null, null, null, null],
    previews: ['', '', '', '', ''],
  });

  const [resolvedPhotoUrls, setResolvedPhotoUrls] = useState([]);

  const [topInlinePanel, setTopInlinePanel] = useState('');

  const didNormalizeStubRef = useRef(false);
  const freshSignupRedirectRef = useRef(false);

  useEffect(() => {
    if (!isPreview) return;
    const sample = buildPreviewProfile();
    setMmUser(sample?.mmUser || null);
    setLatestApp(sample?.latestApp || null);
    setLatestAppId(sample?.latestApp?.id ? String(sample.latestApp.id) : '');
    setResolvedPhotoUrls(Array.isArray(sample?.resolvedPhotoUrls) ? sample.resolvedPhotoUrls : []);
    setLoading(false);
    setAppLoading(false);
  }, [isPreview]);

  const isProfileIncomplete = useMemo(() => {
    return !isMinimumProfileCompleteFromUserAndApp(mmUser, latestApp);
  }, [
    latestApp,
    mmUser,
  ]);

  useEffect(() => {
    if (freshSignupRedirectRef.current) return;
    if (isPreview || !uid) return;
    if (loading || appLoading) return;
    if (!isProfileIncomplete) return;

    let shouldRedirect = false;
    try {
      const raw = String(window.sessionStorage.getItem('auth_just_signed_up') || '').trim();
      const atMs = Number(raw);
      if (Number.isFinite(atMs) && atMs > 0) {
        const ageMs = Date.now() - atMs;
        if (ageMs >= 0 && ageMs <= 15 * 60 * 1000) shouldRedirect = true;
      }
      if (raw) window.sessionStorage.removeItem('auth_just_signed_up');
    } catch {
      // ignore
    }

    if (!shouldRedirect) return;

    freshSignupRedirectRef.current = true;
    navigate('/evlilik/eslestirme-basvuru?w=1', {
      replace: true,
      state: { returnTo: '/profilim', from: 'postSignupProfileRedirect' },
    });
  }, [appLoading, isPreview, isProfileIncomplete, loading, navigate, uid]);

  const showIncompleteExploreWarning = !isPreview && isProfileIncomplete;

  const applySource = String(location?.state?.from || '').trim();
  const showApplyBanner =
    applyBannerOpen && ['matchmakingApply', 'matchmakingEditOnce', 'applyRedirectExisting'].includes(applySource);

  const openApplyInline = () => {
    // Inline/iframe apply bloğu kaldırıldı. Kullanıcıyı doğrudan başvuru sayfasına yönlendir.
    navigate('/evlilik/eslestirme-basvuru?w=1', { state: { returnTo: '/profilim' } });
  };

  useEffect(() => {
    if (!uid) return;

    setLoading(true);
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
        setMmUser(snap?.exists?.() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      } catch {
        // best-effort
      }
    })();

    const unsub = onSnapshot(
      ref,
      (snap) => {
        setMmUser(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        setLoading(false);
      },
      (e) => {
        console.error('matchmakingUsers load failed', e);
        setMmUser(null);
        setLoading(false);
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
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setLatestApp(null);
      setLatestAppId('');
      setAppLoading(false);
      return;
    }
    let cancelled = false;

    setAppLoading(true);
    (async () => {
      try {
        const q = query(collection(db, 'matchmakingApplications'), where('userId', '==', uid), limit(10));
        const snap = await getDocs(q);
        if (cancelled) return;
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        const best = pickBestNonStubApplication(items);
        setLatestApp(best);
        setLatestAppId(best?.id ? String(best.id) : '');
      } catch (e) {
        console.warn('matchmakingApplications read failed:', e);
        setLatestApp(null);
        setLatestAppId('');
      } finally {
        if (!cancelled) setAppLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const refreshLatestApplication = useCallback(async () => {
    if (isPreview) return;
    if (!uid) return;
    try {
      const q = query(collection(db, 'matchmakingApplications'), where('userId', '==', uid), limit(10));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
      const best = pickBestNonStubApplication(items);
      setLatestApp(best);
      setLatestAppId(best?.id ? String(best.id) : '');
    } catch {
      // ignore (best-effort)
    }
  }, [isPreview, uid]);

  useEffect(() => {
    if (isPreview) return;
    if (!uid) return;
    if (didNormalizeStubRef.current) return;
    didNormalizeStubRef.current = true;

    (async () => {
      try {
        await authFetch('/api/matchmaking-application-normalize', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
        });
      } catch {
        // best-effort
      }

      try {
        await refreshLatestApplication();
      } catch {
        // ignore
      }
    })();
  }, [isPreview, refreshLatestApplication, uid]);

  useEffect(() => {
    if (!uid || !latestAppId) return;

    const ref = doc(db, 'matchmakingApplications', latestAppId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        setLatestApp({ id: snap.id, ...(snap.data() || {}) });
      },
      () => {
        // ignore snapshot errors (best-effort realtime)
      }
    );

    return () => {
      try {
        unsub();
      } catch {
        // noop
      }
    };
  }, [latestAppId, uid]);

  const profile = useMemo(() => {
    const appFromUser = mmUser?.application && typeof mmUser.application === 'object' ? mmUser.application : null;
    const app = pickMoreCompleteApp(appFromUser, latestApp);
    const publicProfile = mmUser?.publicProfile && typeof mmUser.publicProfile === 'object' ? mmUser.publicProfile : null;

    const username = String(app?.username || publicProfile?.username || '').trim();
    const name =
      String(username || app?.fullName || mmUser?.fullName || '').trim() ||
      (user?.email ? String(user.email).split('@')[0] : t('studio.common.profile'));

    const age = typeof app?.age === 'number' ? app.age : typeof publicProfile?.age === 'number' ? publicProfile.age : null;

    const genderValue = String(app?.gender || publicProfile?.gender || mmUser?.gender || mmUser?.details?.gender || '').trim();
    const genderRaw = genderValue.toLowerCase();
    const genderLabel =
      genderRaw === 'male'
        ? t('matchmakingPage.form.options.gender.male')
        : genderRaw === 'female'
          ? t('matchmakingPage.form.options.gender.female')
          : genderValue;

    const photoUrlsRaw =
      (Array.isArray(app?.photoUrls) && app.photoUrls) ||
      (Array.isArray(publicProfile?.photoUrls) && publicProfile.photoUrls) ||
      (Array.isArray(mmUser?.photoUrls) && mmUser.photoUrls) ||
      [];

    const photoUrls = photoUrlsRaw.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 5);

    const photoPathsRaw =
      (Array.isArray(app?.photoPaths) && app.photoPaths) ||
      (Array.isArray(publicProfile?.photoPaths) && publicProfile.photoPaths) ||
      (Array.isArray(mmUser?.photoPaths) && mmUser.photoPaths) ||
      [];

    const photoPaths = photoPathsRaw.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 5);

    const bio =
      String(app?.details?.about || app?.details?.bio || mmUser?.details?.about || mmUser?.details?.bio || '').trim();

    const aboutText = String(app?.about || app?.details?.about || mmUser?.details?.about || mmUser?.details?.bio || '').trim();
    const expectationsText = String(app?.expectations || mmUser?.details?.expectations || '').trim();

    const isVerified =
      !!mmUser?.identityVerified ||
      ['verified', 'approved'].includes(String(mmUser?.identityVerification?.status || '').toLowerCase().trim()) ||
      !!publicProfile?.identityVerified;

    const membershipObj = mmUser?.membership && typeof mmUser.membership === 'object' ? mmUser.membership : null;
    const membershipValidUntilMs = (() => {
      const v = membershipObj?.validUntilMs;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (v && typeof v.toMillis === 'function') return v.toMillis();
      if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
      return 0;
    })();
    const now = Date.now();
    const membershipActive =
      (membershipValidUntilMs > 0 && membershipValidUntilMs > now) ||
      (!!membershipObj?.active && (!membershipValidUntilMs || membershipValidUntilMs > now));
    const membershipPlan = String(membershipObj?.plan || '').trim();

    const identityStatus = String(mmUser?.identityVerification?.status || '').trim();
    const identityMethod = String(mmUser?.identityVerification?.method || '').trim();
    const identityRef = String(mmUser?.identityVerification?.referenceCode || '').trim();

    return {
      username,
      name,
      age,
      genderLabel,
      photoUrl: photoUrls.length ? photoUrls[0] : '',
      photoUrls,
      photoPaths,
      bio,
      aboutText,
      expectationsText,
      isVerified,
      membershipActive,
      membershipPlan,
      membershipValidUntilMs,
      identityStatus,
      identityMethod,
      identityRef,
      appLoading,
    };
  }, [appLoading, latestApp, mmUser, t, user?.email]);

  const bestApp = useMemo(() => {
    const appFromUser = mmUser?.application && typeof mmUser.application === 'object' ? mmUser.application : null;
    return pickMoreCompleteApp(appFromUser, latestApp);
  }, [latestApp, mmUser]);

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

  const yesNoDoesntMatterOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'yes', label: t('matchmakingPage.form.options.common.yes') },
      { id: 'no', label: t('matchmakingPage.form.options.common.no') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t]
  );

  const partnerChildrenPreferenceOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'want_children', label: t('matchmakingPage.form.options.partnerChildren.wantChildren') },
      { id: 'no_children', label: t('matchmakingPage.form.options.partnerChildren.noChildren') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t]
  );

  const partnerEducationPreferenceOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'secondary', label: t('matchmakingPage.form.options.education.secondary') },
      { id: 'university', label: t('matchmakingPage.form.options.education.university') },
      { id: 'masters', label: t('matchmakingPage.form.options.education.masters') },
      { id: 'phd', label: t('matchmakingPage.form.options.education.phd') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t]
  );

  const partnerOccupationPreferenceOptions = useMemo(
    () => [
      { id: '', label: t('matchmakingPage.form.options.common.select') },
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
      { id: '', label: t('matchmakingPage.form.options.common.select') },
      { id: 'religious', label: t('matchmakingPage.form.options.familyValues.religious') },
      { id: 'liberal', label: t('matchmakingPage.form.options.familyValues.liberal') },
      { id: 'doesnt_matter', label: t('matchmakingPage.form.options.common.doesntMatter') },
    ],
    [t]
  );

  const partnerCommunicationMethodOptions = useMemo(
    () => [
      { id: 'own_language', label: t('matchmakingPage.form.options.partnerCommunicationMethods.ownLanguage') },
      { id: 'foreign_language', label: t('matchmakingPage.form.options.partnerCommunicationMethods.foreignLanguage') },
      { id: 'translation_app', label: t('matchmakingPage.form.options.partnerCommunicationMethods.translationApp') },
    ],
    [t]
  );

  const openPartnerPrefsModal = () => {
    if (isPreview) {
      blockInteraction();
      return;
    }

    const app = bestApp && typeof bestApp === 'object' ? bestApp : {};
    const partner = app?.partnerPreferences && typeof app.partnerPreferences === 'object' ? app.partnerPreferences : {};

    setPartnerPrefsSaveState({ loading: false, error: '', success: '' });
    setPartnerPrefsDraft({
      lookingForNationality: DEFAULT_LOOKING_FOR_NATIONALITY,
      lookingForGender: deriveLookingForGender(app?.gender),
      partnerPreferences: {
        heightMinCm: partner?.heightMinCm ?? partner?.heightMinCm === 0 ? String(partner.heightMinCm) : '',
        heightMaxCm: partner?.heightMaxCm ?? partner?.heightMaxCm === 0 ? String(partner.heightMaxCm) : '',
        ageMaxOlderYears: partner?.ageMaxOlderYears ?? partner?.ageMaxOlderYears === 0 ? String(partner.ageMaxOlderYears) : '',
        ageMaxYoungerYears: partner?.ageMaxYoungerYears ?? partner?.ageMaxYoungerYears === 0 ? String(partner.ageMaxYoungerYears) : '',
        maritalStatus: String(partner?.maritalStatus || '').trim(),
        religion: String(partner?.religion || '').trim(),
        livingCountry: String(partner?.livingCountry || '').trim(),
        childrenPreference: String(partner?.childrenPreference || '').trim(),
        educationPreference: String(partner?.educationPreference || '').trim(),
        occupationPreference: String(partner?.occupationPreference || '').trim(),
        familyValuesPreference: String(partner?.familyValuesPreference || '').trim(),
        smokingPreference: String(partner?.smokingPreference || '').trim(),
        alcoholPreference: String(partner?.alcoholPreference || '').trim(),
        communicationMethods: Array.isArray(partner?.communicationMethods) ? partner.communicationMethods : [],
      },
    });
    setPartnerPrefsModalOpen(true);
  };

  const closePartnerPrefsModal = () => {
    if (partnerPrefsSaveState.loading) return;
    setPartnerPrefsModalOpen(false);
  };

  const savePartnerPrefs = async () => {
    if (isPreview) {
      blockInteraction();
      return;
    }
    if (partnerPrefsSaveState.loading) return;

    setPartnerPrefsSaveState({ loading: true, error: '', success: '' });
    try {
      await authFetch('/api/matchmaking-partner-preferences-update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          payload: {
            lookingForNationality: DEFAULT_LOOKING_FOR_NATIONALITY,
            lookingForGender: deriveLookingForGender(bestApp?.gender),
            partnerPreferences: partnerPrefsDraft?.partnerPreferences || {},
          },
        }),
      });
      setPartnerPrefsSaveState({ loading: false, error: '', success: t('studio.profile.partnerPrefsSaved') });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const mapped = translateStudioApiError(t, msg) || t('studio.profile.partnerPrefsErrors.failed');
      setPartnerPrefsSaveState({ loading: false, error: mapped, success: '' });
    }
  };

  useEffect(() => {
    let cancelled = false;

    const direct = Array.isArray(profile?.photoUrls) ? profile.photoUrls : [];
    const paths = Array.isArray(profile?.photoPaths) ? profile.photoPaths : [];

    if (direct.length) {
      setResolvedPhotoUrls(direct);
      return () => {
        cancelled = true;
      };
    }

    if (!paths.length) {
      setResolvedPhotoUrls([]);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      const urls = [];
      for (const p of paths) {
        if (!p) continue;
        try {
          urls.push(await getDownloadURL(ref(storage, p)));
        } catch {
          // ignore
        }
      }
      if (!cancelled) setResolvedPhotoUrls(urls);
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.photoPaths, profile?.photoUrls]);

  const myPhotoUrls = useMemo(() => {
    const urls = Array.isArray(resolvedPhotoUrls) ? resolvedPhotoUrls : [];
    if (urls.length) return urls;
    return Array.isArray(profile?.photoUrls) ? profile.photoUrls : [];
  }, [profile?.photoUrls, resolvedPhotoUrls]);

  const avatarUrl = myPhotoUrls.length ? String(myPhotoUrls[0] || '').trim() : '';

  const closePhotoManager = () => {
    if (photoUpdateAction.loading) return;
    try {
      const prevs = Array.isArray(photoManagerDraft?.previews) ? photoManagerDraft.previews : [];
      for (const p of prevs) {
        if (p && String(p).startsWith('blob:')) {
          try {
            URL.revokeObjectURL(p);
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
    setPhotoManagerOpen(false);
  };

  const openPhotoManager = () => {
    if (isPreview) {
      blockInteraction();
      return;
    }

    setPhotoUpdateAction({ loading: false, error: '', success: '' });

    const base = (Array.isArray(myPhotoUrls) ? myPhotoUrls : [])
      .map((s) => String(s || '').trim())
      .filter(Boolean)
      .slice(0, 5);

    const urls = ['', '', '', '', ''];
    for (let i = 0; i < Math.min(5, base.length); i += 1) urls[i] = base[i];

    // Eski preview URL'lerini temizle.
    try {
      const prevs = Array.isArray(photoManagerDraft?.previews) ? photoManagerDraft.previews : [];
      for (const p of prevs) {
        if (p && String(p).startsWith('blob:')) {
          try {
            URL.revokeObjectURL(p);
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }

    setPhotoManagerDraft({ urls, files: [null, null, null, null, null], previews: ['', '', '', '', ''] });
    setPhotoManagerOpen(true);
  };

  const openPhotoManagerFromNavOnceRef = useRef(false);
  useEffect(() => {
    try {
      if (openPhotoManagerFromNavOnceRef.current) return;
      const s = location?.state && typeof location.state === 'object' ? location.state : null;
      if (!s || s.openPhotoManager !== true) return;
      openPhotoManagerFromNavOnceRef.current = true;

      setTopInlinePanel('photoPrivacy');
      openPhotoManager();
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state]);

  const isImageFile = (file) => {
    if (!file) return false;
    const typ = String(file?.type || '').toLowerCase();
    return typ.startsWith('image/');
  };

  const savePhotoUpdates = async () => {
    if (isPreview) {
      blockInteraction();
      return;
    }
    if (!uid) return;
    if (photoUpdateAction.loading) return;

    const draftUrls = Array.isArray(photoManagerDraft?.urls) ? photoManagerDraft.urls : [];
    const draftFiles = Array.isArray(photoManagerDraft?.files) ? photoManagerDraft.files : [];
    const selectedFiles = draftFiles.filter(Boolean);
    const hasAny = draftUrls.some((u) => String(u || '').trim()) || selectedFiles.length > 0;

    if (!hasAny) {
      setPhotoUpdateAction({ loading: false, error: t('matchmakingPanel.photos.updateRequest.errors.photosRequired'), success: '' });
      return;
    }

    if (selectedFiles.some((f) => !isImageFile(f))) {
      setPhotoUpdateAction({ loading: false, error: t('matchmakingPanel.photos.updateRequest.errors.photoType'), success: '' });
      return;
    }

    setPhotoUpdateAction({ loading: true, error: '', success: '' });
    try {
      const uploadedSlots = ['', '', '', '', ''];
      for (let i = 0; i < 5; i += 1) {
        const f = draftFiles[i] || null;
        if (!f) continue;
        const up = await uploadImageToCloudinaryAuto(f, {
          folder: `matchmaking/photos/${uid || 'unknown'}`,
          tags: ['matchmaking', 'photo-update', `photo${i + 1}`],
        });
        uploadedSlots[i] = String(up?.secureUrl || '').trim();
      }

      const finalSlots = [];
      for (let i = 0; i < 5; i += 1) {
        finalSlots.push(String(uploadedSlots[i] || draftUrls[i] || '').trim());
      }
      const finalUrls = finalSlots.filter(Boolean).slice(0, 5);
      if (!finalUrls.length) {
        setPhotoUpdateAction({ loading: false, error: t('matchmakingPanel.photos.updateRequest.errors.photosRequired'), success: '' });
        return;
      }

      await authFetch('/api/matchmaking-photo-update-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          applicationId: latestAppId || '',
          photoUrls: finalUrls,
        }),
      });

      closePhotoManager();
      setPhotoUpdateAction({ loading: false, error: '', success: t('matchmakingPanel.photos.updateRequest.success') });

      await refreshLatestApplication();
    } catch (e) {
      const msg = safeStr(e?.message);
      const mapped =
        msg === 'application_not_found'
            ? t('matchmakingPanel.photos.updateRequest.errors.applicationNotFound')
            : translateStudioApiError(t, msg) || msg || t('matchmakingPanel.photos.updateRequest.errors.failed');

      setPhotoUpdateAction({ loading: false, error: mapped, success: '' });
    }
  };

  const photosBlurred = useMemo(() => {
    if (typeof localPhotosBlurred === 'boolean') return localPhotosBlurred;
    const v1 = mmUser?.publicProfile && typeof mmUser.publicProfile === 'object' ? mmUser.publicProfile.photosBlurred : undefined;
    if (typeof v1 === 'boolean') return v1;
    const v2 = mmUser?.photosBlurred;
    if (typeof v2 === 'boolean') return v2;
    return false;
  }, [localPhotosBlurred, mmUser]);

  useEffect(() => {
    // Server'dan gelen değer geldiyse optimistic state'i senkronla.
    const v1 = mmUser?.publicProfile && typeof mmUser.publicProfile === 'object' ? mmUser.publicProfile.photosBlurred : undefined;
    const v2 = mmUser?.photosBlurred;
    const serverVal = typeof v1 === 'boolean' ? v1 : typeof v2 === 'boolean' ? v2 : null;
    if (typeof serverVal === 'boolean') setLocalPhotosBlurred(serverVal);
  }, [mmUser]);

  const setPhotosBlurred = async (next) => {
    if (isPreview) {
      blockInteraction();
      return;
    }
    if (!uid) return;
    if (photoPrivacyState.loading) return;

    const prev = photosBlurred;

    setPhotoPrivacyState({ loading: true, error: '' });
    setLocalPhotosBlurred(!!next);
    try {
      await authFetch('/api/matchmaking-photo-blur-set', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ blur: !!next }),
      });
      setPhotoPrivacyState({ loading: false, error: '' });
    } catch (e) {
      const msg = safeStr(e?.message) || 'action_failed';
      setLocalPhotosBlurred(!!prev);
      setPhotoPrivacyState({ loading: false, error: translateStudioApiError(t, msg) || msg });
    }
  };

  useEffect(() => {
    if (textTouched) return;
    setTextDraft({ about: profile.aboutText || '', expectations: profile.expectationsText || '' });
  }, [profile.aboutText, profile.expectationsText, textTouched]);

  const saveProfileTexts = async () => {
    if (isPreview) {
      blockInteraction();
      return;
    }
    if (!uid) return;
    if (textSaveState.loading) return;

    setTextSaveState({ loading: true, error: '', success: '' });
    try {
      await authFetch('/api/matchmaking-profile-text-update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ about: textDraft.about, expectations: textDraft.expectations }),
      });
      setTextSaveState({ loading: false, error: '', success: t('studio.profile.textsSaved') });
      setTextTouched(false);
    } catch (e) {
      const msg = String(e?.message || 'save_failed').trim();
      setTextSaveState({ loading: false, error: translateStudioApiError(t, msg) || msg, success: '' });
    }
  };

  const logoutNow = async () => {
    if (isPreview) {
      blockInteraction();
      return;
    }
    try {
      await signOut(auth);
    } finally {
      navigate('/');
    }
  };

  const cancelMembership = async () => {
    if (isPreview) {
      blockInteraction();
      return;
    }
    if (membershipAction.loading) return;

    const ok = typeof window !== 'undefined' ? window.confirm(t('studio.profile.confirmCancelMembership')) : true;
    if (!ok) return;

    setMembershipAction({ loading: true, error: '', success: '' });
    try {
      await authFetch('/api/matchmaking-membership-cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      setMembershipAction({ loading: false, error: '', success: t('studio.profile.membershipCancelled') });
    } catch (e) {
      const msg = String(e?.message || 'membership_cancel_failed').trim();
      setMembershipAction({ loading: false, error: translateStudioApiError(t, msg) || msg, success: '' });
    }
  };

  const generateInviteCodeAndShareWhatsApp = async () => {
    if (isPreview) {
      blockInteraction();
      return;
    }
    if (inviteState.loading) return;

    setInviteState({ loading: true, error: '' });
    try {
      const res = await authFetch('/api/matchmaking-invite-code-generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      const code = String(res?.code || '').trim();
      if (!code || !/^\d{4}$/.test(code)) {
        throw new Error('invite_code_generation_failed');
      }

      const baseLang = (() => {
        const raw = String(i18n?.language || '').trim().toLowerCase();
        const base = raw.split(/[-_]/)[0];
        if (base === 'in') return 'id';
        if (base === 'tr' || base === 'en' || base === 'id') return base;
        return 'tr';
      })();

      const inviteUrl = (() => {
        try {
          const origin = String(window.location?.origin || 'https://uniqah.com').trim() || 'https://uniqah.com';
          const u = new URL('/login', origin);
          u.searchParams.set('mode', 'signup');
          u.searchParams.set('lang', baseLang);
          u.searchParams.set('ref', code);
          return u.toString();
        } catch {
          return `https://uniqah.com/login?mode=signup&lang=${encodeURIComponent(baseLang)}&ref=${encodeURIComponent(code)}`;
        }
      })();

      const msg = t('studio.referral.shareMessage', { code, url: inviteUrl });

      const waShareUrl = buildWhatsAppShareUrl(msg);

      setInviteState({ loading: false, error: '' });

      try {
        if (typeof window !== 'undefined' && waShareUrl) {
          window.location.href = waShareUrl;
        }
      } catch {
        // ignore
      }
    } catch (e) {
      const msg = String(e?.message || 'invite_failed').trim();
      setInviteState({ loading: false, error: translateStudioApiError(t, msg) || msg });
    }
  };

  const submitSocialVerification = async () => {
    if (isPreview) {
      blockInteraction();
      return;
    }
    if (verifyAction.loading) return;

    const platform = String(verifySocialForm?.platform || '').trim().toLowerCase();
    const username = String(verifySocialForm?.username || '').trim().replace(/^@+/, '');
    const allowed = new Set(['instagram', 'tiktok', 'youtube', 'facebook']);
    if (!allowed.has(platform) || !username) {
      setVerifyAction({ loading: false, error: t('studio.profile.verifySocialMissing'), success: '' });
      return;
    }

    setVerifyAction({ loading: true, error: '', success: '' });
    try {
      await authFetch('/api/matchmaking-verification-social-submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          platform,
          username,
        }),
      });

      setVerifyAction({ loading: false, error: '', success: t('studio.profile.verifySocialSubmitted') });
      setVerifySocialForm((p) => ({ ...(p || {}), username: '' }));
    } catch (e) {
      const msg = String(e?.message || 'verification_submit_failed').trim();
      setVerifyAction({ loading: false, error: translateStudioApiError(t, msg) || msg, success: '' });
    }
  };

  const whatsappNumber = useMemo(() => {
    try {
      return getWhatsAppNumber({ lang: String(i18n?.language || 'tr') });
    } catch {
      return '';
    }
  }, [i18n?.language]);

  const startWhatsAppCallVerification = async () => {
    if (isPreview) {
      blockInteraction();
      return;
    }
    if (verifySelectAction.loading) return;

    if (!whatsappNumber) {
      setVerifySelectAction({ loading: false, error: t('matchmakingPanel.verification.errors.whatsappNotConfigured'), result: null });
      return;
    }

    setVerifySelectAction({ loading: true, error: '', result: null });
    try {
      const data = await authFetch('/api/matchmaking-verification-select', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method: 'whatsapp' }),
      });

      setVerifySelectAction({ loading: false, error: '', result: data || null });

      const msg = String(data?.whatsappMessage || '').trim();
      const urlFromServer = String(data?.whatsappUrl || '').trim();
      const url = urlFromServer || (msg ? buildWhatsAppUrl(msg, { lang: String(i18n?.language || 'tr') }) : '');
      if (url) {
        try {
          window.open(url, '_blank', 'noopener,noreferrer');
        } catch {
          window.location.href = url;
        }
      }
    } catch (e) {
      const code = String(e?.message || '').trim();
      const mapped =
        code === 'whatsapp_not_configured'
          ? t('matchmakingPanel.verification.errors.whatsappNotConfigured')
          : (translateStudioApiError(t, code) || code || t('studio.errors.generic'));
      setVerifySelectAction({ loading: false, error: mapped, result: null });
    }
  };

  const closeVerifyModal = () => {
    if (verifyAction.loading || verifySelectAction.loading) return;
    setVerifyAction({ loading: false, error: '', success: '' });
    setVerifySelectAction({ loading: false, error: '', result: null });
    setVerifyModalOpen(false);
  };

  useEffect(() => {
    if (!verifyModalOpen) return;
    try {
      const st = String(profile?.identityStatus || '').toLowerCase().trim();
      const m = String(profile?.identityMethod || '').toLowerCase().trim();
      if (st === 'pending' && m === 'whatsapp') {
        setVerifyMode('whatsapp_video');
        return;
      }
      if (st === 'pending' && m === 'social') {
        setVerifyMode('social');
        return;
      }
    } catch {
      // ignore
    }
    setVerifyMode('whatsapp_video');
  }, [verifyModalOpen, profile?.identityStatus, profile?.identityMethod]);

  const normalizeDeleteConfirmText = (v) => {
    const raw = String(v || '').trim();
    try {
      return i18n?.language === 'tr' ? raw.toLocaleLowerCase('tr-TR') : raw.toLocaleLowerCase();
    } catch {
      return raw.toLowerCase();
    }
  };

  const isDeleteConfirmTextOk = (norm) => {
    const allowed = new Set(['hesabımı sil', 'hesabimi sil', 'delete my account', 'hapus akun saya']);
    return allowed.has(String(norm || '').trim());
  };

  const deletePromptText = () => {
    const phrase = t('studio.membershipModal.deletePhrase');
    return t('studio.membershipModal.deleteTypePrompt', { phrase });
  };

  const deleteAccount = async () => {
    if (isPreview) {
      blockInteraction();
      return;
    }
    if (deleteState.loading) return;

    const ok = typeof window !== 'undefined' ? window.confirm(t('studio.profile.confirmDelete')) : true;
    if (!ok) return;

    const fallbackPhrase = t('studio.membershipModal.deletePhrase');
    const typed = typeof window !== 'undefined' ? window.prompt(deletePromptText()) : fallbackPhrase;
    if (typed === null) return;

    const norm = normalizeDeleteConfirmText(typed);
    if (!isDeleteConfirmTextOk(norm)) {
      setDeleteState({ loading: false, error: deletePromptText() });
      return;
    }

    setDeleteState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-account-delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmText: norm, confirmFinal: true }),
      });
      setDeleteState({ loading: false, error: '' });

      try {
        await signOut(auth);
      } catch {
        // ignore
      }
      navigate('/');
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setDeleteState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'account_delete_failed' });
    }
  };

  const toggleTopInlinePanel = (key) => {
    setTopInlinePanel((prev) => (prev === key ? '' : key));
  };

  const guidanceSections = useMemo(() => {
    const getItems = (key) => {
      const v = t(key, { returnObjects: true });
      return Array.isArray(v) ? v : [];
    };

    return [
      {
        title: t('studio.profile.guidance.sections.gettingToKnow.title'),
        items: getItems('studio.profile.guidance.sections.gettingToKnow.items'),
      },
      {
        title: t('studio.profile.guidance.sections.preparations.title'),
        items: getItems('studio.profile.guidance.sections.preparations.items'),
      },
      {
        title: t('studio.profile.guidance.sections.marriageStage.title'),
        items: getItems('studio.profile.guidance.sections.marriageStage.items'),
      },
      {
        title: t('studio.profile.guidance.sections.afterMarriage.title'),
        items: getItems('studio.profile.guidance.sections.afterMarriage.items'),
      },
    ];
  }, [t]);

  const guidanceWhatsAppUrl = useMemo(() => {
    const text = t('studio.profile.guidance.whatsappMessage');
    return buildWhatsAppUrl(text, { lang: String(i18n?.language || 'tr') });
  }, [i18n?.language, t]);

  useEffect(() => {
    if (!guidanceModalOpen) return;
    const el = guidanceScrollRef.current;
    if (el && typeof el.scrollTop === 'number') el.scrollTop = 0;
  }, [guidanceModalOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 sm:pb-0">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl mb-3">
          <Link
            to="/aracilik"
            className="inline-flex items-center justify-between gap-3 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 transition"
            onClick={() => {
              try {
                void trackClick('cta_lead_apply_profile');
              } catch {
                // ignore
              }
            }}
          >
            <span>{t('navigation.leadApply')}</span>
            <span className="text-emerald-900/70">→</span>
          </Link>
        </div>

        <div className="mx-auto max-w-5xl overflow-visible rounded-[30px] border border-white bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] shadow-[0_26px_90px_rgba(15,23,42,0.10)]">
          {/* Banner */}
          <div className="relative h-48 w-full bg-slate-200 overflow-hidden rounded-t-[30px]">
            {Array.isArray(myPhotoUrls) && myPhotoUrls.length ? (
              <div className="h-full w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex">
                {myPhotoUrls.slice(0, 5).map((u, idx) => (
                  <img
                    key={`${u}-${idx}`}
                    src={u}
                    alt={t('matchmakingPanel.photos.title')}
                    className="h-full w-full flex-shrink-0 object-cover opacity-60 snap-center"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                  />
                ))}
              </div>
            ) : (
              <img
                src="/placeholder.jpg"
                alt={t('studio.profile.bannerAlt')}
                className="h-full w-full object-cover opacity-60"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>

          <div className="relative overflow-hidden p-6 md:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
              <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),rgba(16,185,129,0)_62%)] blur-2xl" />
            </div>
            {/* Avatar */}
            <div className="absolute -top-12 left-6">
              <div className="relative">
                {avatarUrl ? (
                  <button
                    type="button"
                    onClick={openPhotoManager}
                    className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label={shortLabel('matchmakingPanel.photos.title', 'Fotoğraflar')}
                    title={shortLabel('matchmakingPanel.photos.title', 'Fotoğraflar')}
                  >
                    <img
                      src={avatarUrl}
                      alt={profile.name}
                      className="h-24 w-24 rounded-full border-4 border-white object-cover shadow"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openPhotoManager}
                    className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-100 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    aria-label={shortLabel('matchmakingPanel.photos.title', 'Fotoğraflar')}
                    title={shortLabel('matchmakingPanel.photos.title', 'Fotoğraflar')}
                  >
                    <span className="text-2xl font-bold text-slate-500">{safeStr(profile.name).slice(0, 1).toUpperCase() || '?'}</span>
                  </button>
                )}

                {profile.isVerified ? (
                  <div className="absolute bottom-1 right-1 rounded-full bg-emerald-600 p-1.5 ring-2 ring-white">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="relative pt-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-900 shadow-[0_10px_24px_rgba(16,185,129,0.10)]">
                  <Star className="h-3.5 w-3.5" />
                  {studioTrustUi.eyebrow}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  {profile.name}{profile.age ? `, ${profile.age}` : ''}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {safeStr(mmUser?.userCode || (mmUser?.publicProfile && mmUser.publicProfile.userCode)) ? (
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-900 border border-indigo-200">
                      {t('studio.profile.userCode.label')}: {safeStr(mmUser?.userCode || (mmUser?.publicProfile && mmUser.publicProfile.userCode))}
                    </span>
                  ) : null}
                  {profile.isVerified ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900 border border-emerald-200">
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                      {t('studio.common.verified')}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {t('studio.myInfo.fields.username')}: {profile.username || t('studio.common.unknown')}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {t('studio.myInfo.fields.gender')}: {profile.genderLabel || t('studio.common.unknown')}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  {t('studio.profile.membershipLabel')}: {profile.membershipActive ? t('studio.profile.membershipActive') : t('studio.profile.membershipPassive')}
                  {profile.membershipPlan ? ` (${profile.membershipPlan})` : ''}
                </p>

                <p className="mt-2 text-sm font-semibold text-emerald-700">{t('studio.profile.freeUsageNotice')}</p>
                {profile.membershipValidUntilMs ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {t('studio.profile.endsAt')}: {new Intl.DateTimeFormat(String(i18n?.language || 'tr'), { dateStyle: 'medium' }).format(new Date(profile.membershipValidUntilMs))}
                  </p>
                ) : null}

                <div className="mt-4 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.94))] p-5 shadow-[0_16px_40px_rgba(148,163,184,0.10)]">
                  <div className="text-lg font-semibold text-slate-900">{studioTrustUi.title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-slate-600">{studioTrustUi.body}</div>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    {studioTrustUi.facts.map((fact, index) => (
                      <div key={fact} className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(148,163,184,0.08)]">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">0{index + 1}</div>
                        <div className="mt-1 text-sm leading-relaxed text-slate-700">{fact}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {showIncompleteExploreWarning ? (
                  <div role="alert" className="mt-4 rounded-[24px] border border-red-200 bg-[linear-gradient(135deg,rgba(254,242,242,0.96),rgba(255,255,255,0.92))] p-4 text-red-950 shadow-[0_12px_32px_rgba(248,113,113,0.10)]">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-200 text-red-900">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-white px-2 py-0.5 text-xs font-bold tracking-wide text-red-800">
                            {t('studio.profileGate.important')}
                          </span>
                          <p className="font-semibold">{t('studio.profileIncompleteExploreWarning.title')}</p>
                        </div>
                        <p className="mt-1 text-sm text-red-900/90">{t('studio.profileIncompleteExploreWarning.body')}</p>
                        <div className="mt-3">
                          <button type="button" onClick={openApplyInline} className="app-btn app-btn-flat">
                            {t('studio.profileGate.cta')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(15,23,42,0.92))] p-5 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">{studioTrustUi.eyebrow}</div>
                <div className="mt-2 text-lg font-semibold text-white">{studioTrustUi.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-300">{studioTrustUi.body}</div>

                <div className="mt-4 grid grid-cols-1 gap-2">
                  {studioTrustUi.facts.map((fact) => (
                    <div key={`${fact}-aside`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
                      {fact}
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-1 sm:items-center">
                <div ref={profileMenuWrapRef} className="relative col-span-2 sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen((v) => !v)}
                    className="app-btn app-btn-danger w-full sm:w-auto h-10 px-5"
                    aria-expanded={profileMenuOpen}
                    aria-controls="profile-hamburger-menu"
                  >
                    {profileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    {isTr ? 'İşlem Menüsü' : t('studio.common.actionMenu', { defaultValue: 'Actions' })}
                  </button>

                  {profileMenuOpen ? (
                    <div
                      id="profile-hamburger-menu"
                      className="fixed left-1/2 bottom-3 z-50 w-[calc(100vw-1rem)] max-w-[520px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg sm:absolute sm:bottom-auto sm:top-full sm:mt-2"
                      role="dialog"
                      aria-modal="false"
                    >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900">
                            {isTr ? 'İşlem Menüsü' : t('studio.common.actionMenu', { defaultValue: 'Actions' })}
                          </div>
                          <button
                            type="button"
                            onClick={() => setProfileMenuOpen(false)}
                            className="app-btn app-btn-outline"
                            aria-label={isTr ? 'Kapat' : t('studio.common.close', { defaultValue: 'Close' })}
                          >
                            <X className="h-4 w-4" />
                            {isTr ? 'Kapat' : t('studio.common.close', { defaultValue: 'Close' })}
                          </button>
                        </div>

                      <div className="mt-2 grid max-h-[60vh] grid-cols-1 gap-2 overflow-auto sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            openOneTimeActionIntro({
                              hintId: 'profile-action-explore-v1',
                              titleKey: 'studio.profile.actionIntro.explore.title',
                              bodyKey: 'studio.profile.actionIntro.explore.body',
                              ctaKey: 'studio.profile.actionIntro.explore.cta',
                              onContinue: () => navigate('/app/pool'),
                            });
                          }}
                          className="app-btn app-btn-action-menu relative h-12 w-full px-5 justify-start"
                          aria-label={shortLabel('studio.pool.title', 'Keşfet')}
                        >
                          <span
                            className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
                            aria-hidden="true"
                          >
                            <Compass className="h-6 w-6 text-white" />
                          </span>
                          <span className="min-w-0 pl-14 text-sm font-semibold tracking-wide text-white">
                            <span className="block whitespace-nowrap">{shortLabel('studio.pool.title', 'Keşfet')}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            openOneTimeActionIntro({
                              hintId: 'profile-action-edit-profile-v1',
                              titleKey: 'studio.profile.actionIntro.editProfile.title',
                              bodyKey: 'studio.profile.actionIntro.editProfile.body',
                              ctaKey: 'studio.profile.actionIntro.editProfile.cta',
                              onContinue: () =>
                                navigate('/evlilik/eslestirme-basvuru?w=1', { state: { returnTo: '/profilim' } }),
                            });
                          }}
                          className="app-btn app-btn-action-menu relative h-12 w-full px-5 justify-start"
                          aria-label={shortLabel('studio.profile.editProfile', 'Profil')}
                        >
                          <span
                            className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
                            aria-hidden="true"
                          >
                            <Edit className="h-6 w-6 text-white" />
                          </span>
                          <span className="min-w-0 pl-14 text-sm font-semibold tracking-wide text-white">
                            <span className="block whitespace-nowrap">{shortLabel('studio.profile.editProfile', 'Profil')}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            openOneTimeActionIntro({
                              hintId: 'profile-action-matches-v1',
                              titleKey: 'studio.profile.actionIntro.matches.title',
                              bodyKey: 'studio.profile.actionIntro.matches.body',
                              ctaKey: 'studio.profile.actionIntro.matches.cta',
                              onContinue: () => navigate('/app/matches'),
                            });
                          }}
                          className="app-btn app-btn-action-menu relative h-12 w-full px-5 justify-start"
                          aria-label={shortLabel('studio.profile.myMatches', 'Eşleşmelerim')}
                        >
                          <span
                            className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
                            aria-hidden="true"
                          >
                            <Users className="h-6 w-6 text-white" />
                          </span>
                          <span className="min-w-0 pl-14 text-sm font-semibold tracking-wide text-white">
                            <span className="block whitespace-nowrap">{shortLabel('studio.profile.myMatches', 'Eşleşmelerim')}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            openOneTimeActionIntro({
                              hintId: 'profile-action-partner-prefs-v1',
                              titleKey: 'studio.profile.actionIntro.partnerPrefs.title',
                              bodyKey: 'studio.profile.actionIntro.partnerPrefs.body',
                              ctaKey: 'studio.profile.actionIntro.partnerPrefs.cta',
                              onContinue: () => openPartnerPrefsModal(),
                            });
                          }}
                          className="app-btn app-btn-action-menu relative h-12 w-full px-5 justify-start"
                          title={t('studio.profile.partnerPrefsTitle')}
                          aria-label={t('studio.profile.partnerPrefsTitle')}
                        >
                          <span
                            className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
                            aria-hidden="true"
                          >
                            <Edit className="h-6 w-6 text-white" />
                          </span>
                          <span className="min-w-0 pl-14 text-sm font-semibold tracking-wide text-white">
                            <span className="block whitespace-nowrap">{t('studio.profile.partnerPrefsTitle')}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            openOneTimeActionIntro({
                              hintId: 'profile-action-membership-v1',
                              titleKey: 'studio.profile.actionIntro.membership.title',
                              bodyKey: 'studio.profile.actionIntro.membership.body',
                              ctaKey: 'studio.profile.actionIntro.membership.cta',
                              onContinue: () => toggleTopInlinePanel('membership'),
                            });
                          }}
                          className="app-btn app-btn-action-menu relative h-12 w-full px-5 justify-start"
                          title={t('studio.profile.subscriptionTitle')}
                          aria-label={shortLabel('studio.profile.subscriptionTitle', 'Üyelik')}
                        >
                          <span
                            className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
                            aria-hidden="true"
                          >
                            <Star className="h-6 w-6 text-white" />
                          </span>
                          <span className="min-w-0 pl-14 text-sm font-semibold tracking-wide text-white">
                            <span className="block whitespace-nowrap">{shortLabel('studio.profile.subscriptionTitle', 'Üyelik')}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            openOneTimeActionIntro({
                              hintId: 'profile-action-photo-v1',
                              titleKey: 'studio.profile.actionIntro.photo.title',
                              bodyKey: 'studio.profile.actionIntro.photo.body',
                              ctaKey: 'studio.profile.actionIntro.photo.cta',
                              onContinue: () => {
                                toggleTopInlinePanel('photoPrivacy');
                                openPhotoManager();
                              },
                            });
                          }}
                          className="app-btn app-btn-action-menu relative h-12 w-full px-5 justify-start"
                          title={t('studio.profile.photoPrivacy.title')}
                          aria-label={shortLabel('studio.profile.photoPrivacy.title', 'Fotoğraf')}
                        >
                          <span
                            className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
                            aria-hidden="true"
                          >
                            <Images className="h-6 w-6 text-white" />
                          </span>
                          <span className="min-w-0 pl-14 text-sm font-semibold tracking-wide text-white">
                            <span className="block whitespace-nowrap">{shortLabel('studio.profile.photoPrivacy.title', 'Fotoğraf')}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            openOneTimeActionIntro({
                              hintId: 'profile-action-guidance-v1',
                              titleKey: 'studio.profile.actionIntro.guidance.title',
                              bodyKey: 'studio.profile.actionIntro.guidance.body',
                              ctaKey: 'studio.profile.actionIntro.guidance.cta',
                              onContinue: () => setGuidanceModalOpen(true),
                            });
                          }}
                          className="app-btn app-btn-action-menu relative h-12 w-full px-5 justify-start"
                          title={t('studio.profile.guidance.button')}
                          aria-label={shortLabel('studio.profile.guidance.button', 'Rehberlik')}
                        >
                          <span
                            className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
                            aria-hidden="true"
                          >
                            <BookOpen className="h-6 w-6 text-white" />
                          </span>
                          <span className="min-w-0 pl-14 text-sm font-semibold tracking-wide text-white">
                            <span className="block whitespace-nowrap">{shortLabel('studio.profile.guidance.button', 'Rehberlik')}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            openOneTimeActionIntro({
                              hintId: 'profile-action-feedback-v1',
                              titleKey: 'studio.profile.actionIntro.feedback.title',
                              bodyKey: 'studio.profile.actionIntro.feedback.body',
                              ctaKey: 'studio.profile.actionIntro.feedback.cta',
                              onContinue: () => navigate('/profilim/destek'),
                            });
                          }}
                          className="app-btn app-btn-action-menu relative h-12 w-full px-5 justify-start"
                          aria-label={shortLabel('studio.feedback.nav', 'Şikayet/İstek')}
                        >
                          <span
                            className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
                            aria-hidden="true"
                          >
                            <MessageCircle className="h-6 w-6 text-white" />
                          </span>
                          <span className="min-w-0 pl-10 text-sm font-semibold tracking-wide text-white">
                            <span className="block whitespace-nowrap">{shortLabel('studio.feedback.nav', 'Şikayet/İstek')}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            openOneTimeActionIntro({
                              hintId: 'profile-action-identity-panel-v1',
                              titleKey: 'studio.profile.actionIntro.identity.title',
                              bodyKey: 'studio.profile.actionIntro.identity.body',
                              ctaKey: 'studio.profile.actionIntro.identity.cta',
                              onContinue: () => toggleTopInlinePanel('identity'),
                            });
                          }}
                          className="app-btn app-btn-action-menu relative h-12 w-full px-5 justify-start"
                          title={shortLabel('studio.profile.identityTitle', 'Kimlik doğrula')}
                          aria-label={shortLabel('studio.profile.identityTitle', 'Kimlik doğrula')}
                        >
                          <span
                            className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
                            aria-hidden="true"
                          >
                            <ShieldCheck className="h-6 w-6 text-white" />
                          </span>
                          <span className="min-w-0 pl-14 text-sm font-semibold tracking-wide text-white">
                            <span className="block whitespace-nowrap">{shortLabel('studio.profile.identityTitle', 'Kimlik doğrula')}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            openOneTimeActionIntro({
                              hintId: 'profile-action-referral-v1',
                              titleKey: 'studio.profile.actionIntro.referral.title',
                              bodyKey: 'studio.profile.actionIntro.referral.body',
                              ctaKey: 'studio.profile.actionIntro.referral.cta',
                              onContinue: () => toggleTopInlinePanel('referral'),
                            });
                          }}
                          className="app-btn app-btn-action-menu relative h-12 w-full px-5 justify-start"
                          title={t('studio.referral.title')}
                          aria-label={shortLabel('studio.referral.title', 'Davet')}
                        >
                          <span
                            className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
                            aria-hidden="true"
                          >
                            <Users className="h-6 w-6 text-white" />
                          </span>
                          <span className="min-w-0 pl-14 text-sm font-semibold tracking-wide text-white">
                            <span className="block whitespace-nowrap">{shortLabel('studio.referral.title', 'Davet')}</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            openOneTimeActionIntro({
                              hintId: 'profile-action-logout-v1',
                              titleKey: 'studio.profile.actionIntro.logout.title',
                              bodyKey: 'studio.profile.actionIntro.logout.body',
                              ctaKey: 'studio.profile.actionIntro.logout.cta',
                              onContinue: () => logoutNow(),
                            });
                          }}
                          className="app-btn app-btn-action-menu relative h-12 w-full px-5 justify-start"
                          title={t('studio.profile.logout')}
                          aria-label={shortLabel('studio.profile.logout', 'Çıkış')}
                        >
                          <span
                            className="absolute left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"
                            aria-hidden="true"
                          >
                            <LogOut className="h-6 w-6 text-white" />
                          </span>
                          <span className="min-w-0 pl-14 text-sm font-semibold tracking-wide text-white">
                            <span className="block whitespace-nowrap">{shortLabel('studio.profile.logout', 'Çıkış')}</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

            {topInlinePanel ? (
              <div className="mt-5 grid grid-cols-1 gap-4">
                {topInlinePanel === 'membership' ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-base font-semibold">
                      <Star className="h-5 w-5 text-amber-500" />
                      {t('studio.profile.subscriptionTitle')}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {profile.membershipActive
                        ? t('studio.profile.subscriptionActiveDesc')
                        : t('studio.profile.subscriptionPassiveDesc')}
                    </p>

                    <p className="mt-2 text-sm font-semibold text-emerald-700">{t('studio.profile.freeUsageNotice')}</p>

                    {membershipAction.error ? (
                      <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">{membershipAction.error}</div>
                    ) : null}
                    {membershipAction.success ? (
                      <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">{membershipAction.success}</div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={cancelMembership}
                        disabled={membershipAction.loading}
                        className="app-btn app-btn-danger disabled:opacity-60"
                      >
                        {t('studio.profile.cancelMembership')}
                      </button>

                      <Link
                        to="/profilim/bilgilerim"
                        className="app-btn app-btn-outline"
                      >
                        {t('studio.profile.myInfo')}
                      </Link>
                    </div>
                  </div>
                ) : null}

                {topInlinePanel === 'identity' ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-base font-semibold">
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                      {t('studio.profile.identityTitle')}
                    </h3>

                    {profile.isVerified ? (
                      <p className="mt-2 text-sm text-slate-600">{t('studio.profile.identityVerified')}</p>
                    ) : profile.identityStatus ? (
                      <p className="mt-2 text-sm text-slate-600">
                        {t('studio.profile.identityStatus')}: <span className="font-semibold">{profile.identityStatus}</span>
                        {profile.identityMethod ? ` (${profile.identityMethod})` : ''}
                        {profile.identityRef ? ` • Ref: ${profile.identityRef}` : ''}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">{t('studio.profile.identityHelp')}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onClickVerifyNow}
                        className="app-btn app-btn-primary"
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        {t('studio.profile.verifyNow')}
                      </button>
                    </div>

                    {user?.email && user?.emailVerified === false ? (
                      <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-sm font-semibold text-slate-900">{t('studio.profile.emailVerify.title')}</div>
                        <p className="mt-1 text-sm text-slate-700">{t('studio.profile.emailVerify.body', { email: String(user.email || '') })}</p>

                        {emailVerifyState.error ? (
                          <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">
                            {emailVerifyState.error}
                          </div>
                        ) : null}
                        {emailVerifyState.success ? (
                          <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">
                            {emailVerifyState.success}
                          </div>
                        ) : null}

                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={async () => {
                              if (emailVerifyState.loading) return;
                              setEmailVerifyState({ loading: true, error: '', success: '' });
                              try {
                                if (!auth.currentUser) throw new Error('not_authenticated');
                                await sendEmailVerification(auth.currentUser);
                                setEmailVerifyState({ loading: false, error: '', success: t('studio.profile.emailVerify.sent') });
                              } catch (e) {
                                setEmailVerifyState({ loading: false, error: t('studio.profile.emailVerify.failed'), success: '' });
                              }
                            }}
                            disabled={emailVerifyState.loading}
                            className="app-btn app-btn-outline disabled:opacity-60"
                          >
                            {emailVerifyState.loading ? t('studio.common.processing') : t('studio.profile.emailVerify.cta')}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {topInlinePanel === 'photoPrivacy' ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-base font-semibold">
                      <Images className="h-5 w-5 text-indigo-600" />
                      {t('studio.profile.photoPrivacy.title')}
                    </h3>

                    <div className="mt-3">
                      {Array.isArray(myPhotoUrls) && myPhotoUrls.length ? (
                        <div>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                            {(showAllMyPhotos ? myPhotoUrls : myPhotoUrls.slice(0, 6)).map((u) => (
                              <a
                                key={u}
                                href={u}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-lg border border-slate-200 bg-white"
                                title={t('matchmakingPanel.photos.title')}
                              >
                                <img
                                  src={u}
                                  alt={t('matchmakingPanel.photos.title')}
                                  className="h-20 w-full object-cover"
                                  loading="lazy"
                                />
                              </a>
                            ))}
                          </div>

                          {myPhotoUrls.length > 6 ? (
                            <button
                              type="button"
                              onClick={() => setShowAllMyPhotos((p) => !p)}
                              className="mt-3 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                            >
                              {showAllMyPhotos ? t('studio.common.readLess') : `${t('studio.common.readMore')} (${myPhotoUrls.length})`}
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600">{t('matchmakingPanel.photos.empty')}</p>
                      )}
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{shortLabel('matchmakingPanel.photos.title', 'Fotoğraflar')}</div>
                          <div className="mt-1 text-sm text-slate-600">
                            {isTr ? 'En fazla 5 görsel ekleyebilirsiniz.' : 'You can add up to 5 images.'}
                          </div>
                        </div>

                        <button type="button" onClick={openPhotoManager} className="app-btn app-btn-primary" disabled={photoUpdateAction.loading}>
                          <UploadCloud className="mr-2 h-4 w-4" />
                          {photoUpdateAction.loading ? t('studio.common.processing') : isTr ? 'Fotoğraf Ekle/Değiştir' : 'Add/Change Photos'}
                        </button>
                      </div>

                      {photoUpdateAction.error ? (
                        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">{photoUpdateAction.error}</div>
                      ) : null}
                      {photoUpdateAction.success ? (
                        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">{photoUpdateAction.success}</div>
                      ) : null}
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <p className="text-sm text-slate-600">{t('studio.profile.photoPrivacy.body')}</p>

                      <div className="mt-3 space-y-2 text-sm text-amber-900">
                        <p>{t('studio.profile.photoPrivacy.fairnessWarning')}</p>
                        <p>{t('studio.match.photos.reciprocityHint')}</p>
                        <ul className="list-disc pl-5 text-amber-900/90">
                          <li>{t('studio.profile.photoPrivacy.rules.firstBlurLock48h')}</li>
                          <li>{t('studio.profile.photoPrivacy.rules.unblurLock48h')}</li>
                          <li>{t('studio.profile.photoPrivacy.rules.onlyAllowed')}</li>
                        </ul>
                      </div>

                      {photoPrivacyState.error ? (
                        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">
                          {photoPrivacyState.error}
                        </div>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-800">{t('studio.profile.photoPrivacy.toggleLabel')}</div>
                        <button
                          type="button"
                          onClick={() => setPhotosBlurred(!photosBlurred)}
                          disabled={photoPrivacyState.loading}
                          className={
                            'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ' +
                              (photosBlurred ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-900 hover:bg-slate-300')
                          }
                        >
                          {photoPrivacyState.loading
                            ? t('studio.common.processing')
                            : photosBlurred
                              ? t('studio.profile.photoPrivacy.stateOn')
                              : t('studio.profile.photoPrivacy.stateOff')}
                        </button>
                      </div>

                      {photosBlurred ? (
                        <p className="mt-3 text-xs text-slate-600">{t('studio.profile.photoPrivacy.hintOn')}</p>
                      ) : (
                        <p className="mt-3 text-xs text-slate-600">{t('studio.profile.photoPrivacy.hintOff')}</p>
                      )}
                    </div>
                  </div>
                ) : null}

                {topInlinePanel === 'referral' ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-base font-semibold">
                      <Users className="h-5 w-5 text-indigo-600" />
                      {t('studio.referral.title')}
                    </h3>

                    <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                      <button
                        type="button"
                        onClick={generateInviteCodeAndShareWhatsApp}
                        disabled={inviteState.loading}
                        className="app-btn app-btn-primary disabled:opacity-60"
                      >
                        {inviteState.loading ? t('studio.common.processing') : t('studio.referral.shareButton')}
                        <Share2 className="h-4 w-4" />
                      </button>

                      {inviteState.error ? (
                        <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">{inviteState.error}</div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {!pwaInstalled ? (
              <div className="mt-6">
                <PwaInstallCard variant="light" />
              </div>
            ) : pwaInstalled && pushAfterInstallPending && !pushAfterInstallDismissed && !pushEnabledNow ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                      <AlertTriangle className="h-4 w-4 text-emerald-800" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{t('pwa.install.notifications.title')}</div>
                      <div className="mt-1 text-sm text-slate-700">{t('pwa.install.installedHint')}</div>
                      {pushNudgeFeedback ? (
                        <div className="mt-2 text-sm font-semibold text-slate-700">{pushNudgeFeedback}</div>
                      ) : null}
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          disabled={pushNudgeBusy}
                          onClick={async () => {
                            if (pushNudgeBusy) return;
                            setPushNudgeFeedback('');
                            setPushNudgeBusy(true);
                            try {
                              const res = await enablePushForCurrentUser().catch(() => null);

                              if (res?.ok) {
                                setPushEnabledNow(true);
                                if (uid) {
                                  try {
                                    window.localStorage.removeItem(pushAfterInstallKey(LS_PUSH_AFTER_INSTALL_PENDING_PREFIX, uid));
                                  } catch {
                                    // ignore
                                  }
                                }
                                setPushAfterInstallPending(false);
                                setPushNudgeFeedback(
                                  res?.serverSync === false
                                    ? t('pwa.install.notifications.enabledButNotSaved')
                                    : t('pwa.install.notifications.enabled')
                                );
                                return;
                              }

                              const code = String(res?.code || '').trim();
                              const msgKey =
                                code === 'not_supported' || code === 'messaging_not_supported'
                                  ? 'pwa.install.notifications.notSupported'
                                  : code === 'not_secure_context'
                                    ? 'pwa.install.notifications.notSecureContext'
                                    : code === 'service_worker_not_ready'
                                      ? 'pwa.install.notifications.serviceWorkerNotReady'
                                      : code === 'missing_vapid_key'
                                        ? 'pwa.install.notifications.missingSetup'
                                        : code === 'invalid_vapid_key'
                                          ? 'pwa.install.notifications.invalidVapidKey'
                                          : code === 'permission_denied'
                                            ? 'pwa.install.notifications.denied'
                                            : 'pwa.install.notifications.error';

                              setPushNudgeFeedback(t(msgKey));
                            } finally {
                              setPushNudgeBusy(false);
                            }
                          }}
                          className="app-btn app-btn-primary"
                        >
                          {pushNudgeBusy ? t('studio.common.processing') : t('pwa.install.notifications.button')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (uid) {
                              try {
                                window.localStorage.removeItem(pushAfterInstallKey(LS_PUSH_AFTER_INSTALL_PENDING_PREFIX, uid));
                                window.localStorage.setItem(pushAfterInstallKey(LS_PUSH_AFTER_INSTALL_DISMISSED_PREFIX, uid), '1');
                              } catch {
                                // ignore
                              }
                            }
                            setPushAfterInstallPending(false);
                            setPushAfterInstallDismissed(true);
                            setPushNudgeFeedback('');
                          }}
                          className="app-btn app-btn-outline"
                        >
                          {t('studio.common.close')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {showApplyBanner ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                      <Star className="h-4 w-4 text-amber-700" />
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">{t('studio.profile.applySuccess.title')}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setApplyBannerOpen(false)}
                    className="app-btn app-btn-ghost h-8 px-2 text-xs text-slate-700 hover:bg-amber-100"
                  >
                    {t('studio.common.close')}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
                  <Link
                    to="/app/pool"
                    className="app-btn app-btn-orange w-full sm:w-auto"
                  >
                    {t('studio.profile.applySuccess.ctas.pool')}
                  </Link>
                  <Link
                    to="/app/matches"
                    className="app-btn app-btn-soft w-full sm:w-auto"
                  >
                    {t('studio.profile.applySuccess.ctas.matches')}
                  </Link>
                  <Link
                    to="/evlilik/eslestirme"
                    className="app-btn app-btn-soft w-full sm:w-auto"
                  >
                    {t('studio.profile.applySuccess.ctas.learn')}
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="mt-6 border-t border-slate-200 pt-6">
              <h2 className="text-lg font-semibold">{t('studio.profile.aboutTitle')}</h2>
              {loading ? (
                <p className="mt-2 text-slate-600">{t('studio.common.loading')}</p>
              ) : !mmUser ? (
                <p className="mt-2 text-slate-600">{t('studio.errors.profileNotFound')}</p>
              ) : profile.bio ? (
                <p className="mt-2 text-slate-700">{profile.bio}</p>
              ) : (
                <p className="mt-2 text-slate-600">{t('studio.profile.noBio')}</p>
              )}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{t('studio.profile.textsTitle')}</h2>
                <button
                  type="button"
                  onClick={saveProfileTexts}
                  disabled={textSaveState.loading || !textTouched}
                  className="app-btn app-btn-primary disabled:opacity-60"
                >
                  {textSaveState.loading ? t('studio.common.processing') : t('studio.profile.saveTexts')}
                </button>
              </div>

              {textSaveState.error ? (
                <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">{textSaveState.error}</div>
              ) : null}
              {textSaveState.success ? (
                <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">{textSaveState.success}</div>
              ) : null}

              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-800">{t('studio.profile.aboutLabel')}</label>
                  <textarea
                    value={textDraft.about}
                    maxLength={1800}
                    onChange={(e) => {
                      setTextTouched(true);
                      setTextSaveState({ loading: false, error: '', success: '' });
                      setTextDraft((p) => ({ ...p, about: String(e?.target?.value || '') }));
                    }}
                    placeholder={t('studio.profile.aboutPlaceholder')}
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    rows={5}
                  />
                  <p className="mt-1 text-xs text-slate-500">{textDraft.about.length} / 1800</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800">{t('studio.profile.expectationsLabel')}</label>
                  <textarea
                    value={textDraft.expectations}
                    maxLength={1800}
                    onChange={(e) => {
                      setTextTouched(true);
                      setTextSaveState({ loading: false, error: '', success: '' });
                      setTextDraft((p) => ({ ...p, expectations: String(e?.target?.value || '') }));
                    }}
                    placeholder={t('studio.profile.expectationsPlaceholder')}
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                    rows={5}
                  />
                  <p className="mt-1 text-xs text-slate-500">{textDraft.expectations.length} / 1800</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <h3 className="text-lg font-semibold text-rose-800">{t('studio.profile.accountTitle')}</h3>
                <p className="mt-2 text-sm text-rose-800/80">
                  {t('studio.profile.accountDeleteDesc')}
                </p>

                {deleteState.error ? (
                  <div className="mt-3 rounded-md border border-rose-200 bg-white p-2 text-sm text-rose-700">
                    {deleteState.error}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={deleteState.loading}
                  className="mt-3 app-btn app-btn-danger disabled:opacity-60"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteState.loading ? t('studio.profile.deleting') : t('studio.profile.deleteAccount')}
                </button>
              </div>
            </div>

            {verifyModalOpen ? (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto">
                <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0">
                    <h3 className="text-lg font-semibold">{t('studio.profile.verifyModalTitle')}</h3>
                    <button
                      type="button"
                      onClick={closeVerifyModal}
                      className="app-btn app-btn-ghost h-8 px-2 text-xs"
                    >
                      {t('studio.common.close')}
                    </button>
                  </div>

                  <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm text-slate-700 whitespace-pre-line">{t('studio.profile.verifyModalInfo')}</p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setVerifyMode('whatsapp_video')}
                          disabled={verifyAction.loading || verifySelectAction.loading || String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                          className={
                            "rounded-md border px-3 py-2 text-sm font-semibold transition " +
                            (verifyMode === 'whatsapp_video'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50')
                          }
                        >
                          {t('studio.profile.verifyMethodSelfieVideo')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerifyMode('social')}
                          disabled={verifyAction.loading || verifySelectAction.loading || String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                          className={
                            "rounded-md border px-3 py-2 text-sm font-semibold transition " +
                            (verifyMode === 'social'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50')
                          }
                        >
                          {t('studio.profile.verifyMethodSocial')}
                        </button>
                      </div>

                      {String(profile?.identityStatus || '').toLowerCase().trim() === 'pending' ? (
                        <p className="mt-2 text-xs text-slate-600">
                          {t('studio.profile.identityStatus')}: <span className="font-semibold">{profile.identityStatus}</span>
                          {profile.identityMethod ? ` (${profile.identityMethod})` : ''}
                          {profile.identityRef ? ` • Ref: ${profile.identityRef}` : ''}
                        </p>
                      ) : null}
                    </div>

                    {verifyMode === 'whatsapp_video' ? (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-sm font-semibold text-emerald-900">{t('studio.profile.verifySelfieVideoTitle')}</p>
                        <p className="mt-1 text-sm text-emerald-900/80">{t('studio.profile.verifySelfieVideoBody')}</p>

                        {verifySelectAction.error ? (
                          <div className="mt-3 rounded-md border border-rose-200 bg-white p-2 text-sm text-rose-700">
                            {verifySelectAction.error}
                          </div>
                        ) : null}

                        {verifySelectAction?.result?.referenceCode ? (
                          <p className="mt-2 text-xs text-emerald-900/70">
                            Ref: <span className="font-mono">{String(verifySelectAction.result.referenceCode || '')}</span>
                          </p>
                        ) : null}

                        <button
                          type="button"
                          onClick={startWhatsAppCallVerification}
                          disabled={verifySelectAction.loading || !whatsappNumber || String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                          className="mt-3 app-btn app-btn-primary w-full disabled:opacity-60"
                        >
                          {verifySelectAction.loading ? t('studio.common.loading') : t('studio.profile.verifySelfieVideoCta')}
                        </button>

                        {!whatsappNumber ? (
                          <p className="mt-2 text-xs text-emerald-900/70">{t('matchmakingPanel.verification.errors.whatsappNotConfigured')}</p>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-900">{t('studio.profile.verifySocialTitle')}</p>
                          <p className="mt-1 text-sm text-slate-700">{t('studio.profile.verifySocialBody')}</p>

                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="text-sm font-semibold text-slate-800">
                              {t('studio.profile.verifySocialPlatform')}
                              <select
                                value={verifySocialForm.platform}
                                onChange={(e) => setVerifySocialForm((p) => ({ ...(p || {}), platform: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                                disabled={String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                              >
                                <option value="instagram">Instagram</option>
                                <option value="tiktok">TikTok</option>
                                <option value="youtube">YouTube</option>
                                <option value="facebook">Facebook</option>
                              </select>
                            </label>

                            <label className="text-sm font-semibold text-slate-800">
                              {t('studio.profile.verifySocialUsername')}
                              <input
                                value={verifySocialForm.username}
                                onChange={(e) => setVerifySocialForm((p) => ({ ...(p || {}), username: e.target.value }))}
                                placeholder="ornek_kullanici"
                                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                                disabled={String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                              />
                            </label>
                          </div>
                        </div>

                        {verifyAction.error ? (
                          <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">
                            {verifyAction.error}
                          </div>
                        ) : null}
                        {verifyAction.success ? (
                          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">
                            {verifyAction.success}
                          </div>
                        ) : null}
                      </>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeVerifyModal}
                        disabled={verifyAction.loading || verifySelectAction.loading}
                        className="app-btn app-btn-outline disabled:opacity-60"
                      >
                        {t('studio.common.cancel')}
                      </button>
                      {verifyMode === 'whatsapp_video' ? null : (
                        <button
                          type="button"
                          onClick={submitSocialVerification}
                          disabled={verifyAction.loading || String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                          className="app-btn app-btn-primary disabled:opacity-60"
                        >
                          {verifyAction.loading ? t('studio.common.loading') : t('studio.profile.submitVerification')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {identityIntroModalOpen ? (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto" role="dialog" aria-modal="true">
                <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0">
                    <h3 className="text-lg font-semibold">{t('studio.profile.identityIntro.title')}</h3>
                    <button
                      type="button"
                      onClick={() => setIdentityIntroModalOpen(false)}
                      className="app-btn app-btn-ghost h-8 px-2 text-xs"
                    >
                      {t('studio.common.close')}
                    </button>
                  </div>

                  <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm text-slate-700 whitespace-pre-line">{t('studio.profile.identityIntro.body')}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIdentityIntroModalOpen(false)}
                        className="app-btn app-btn-outline"
                      >
                        {t('studio.common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const hintId = 'identity-verify-intro-v1';
                          markOneTimeHintShown(uid, hintId);
                          setIdentityIntroModalOpen(false);
                          openVerifyModalFlow();
                        }}
                        className="app-btn app-btn-primary"
                      >
                        {t('studio.profile.identityIntro.cta')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {actionIntroModal?.open ? (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto" role="dialog" aria-modal="true">
                <div className="w-full max-w-xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0">
                    <h3 className="text-lg font-semibold">{actionIntroModal.title}</h3>
                    <button type="button" onClick={closeActionIntroModal} className="app-btn app-btn-ghost h-8 px-2 text-xs">
                      {t('studio.common.close')}
                    </button>
                  </div>

                  <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm text-slate-700 whitespace-pre-line">{actionIntroModal.body}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={closeActionIntroModal} className="app-btn app-btn-outline">
                        {t('studio.common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const fn = actionIntroContinueRef.current;
                          closeActionIntroModal();
                          try {
                            fn?.();
                          } catch {
                            // ignore
                          }
                        }}
                        className="app-btn app-btn-primary"
                      >
                        {actionIntroModal.cta}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {partnerPrefsModalOpen ? (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto" role="dialog" aria-modal="true">
                <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0">
                    <h3 className="text-lg font-semibold">{t('studio.profile.partnerPrefsTitle')}</h3>
                    <button
                      type="button"
                      onClick={closePartnerPrefsModal}
                      disabled={partnerPrefsSaveState.loading}
                      className="app-btn app-btn-ghost h-8 px-2 text-xs disabled:opacity-60"
                    >
                      {t('studio.common.close')}
                    </button>
                  </div>

                  <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {partnerPrefsSaveState.error ? (
                      <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">{partnerPrefsSaveState.error}</div>
                    ) : null}
                    {partnerPrefsSaveState.success ? (
                      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">{partnerPrefsSaveState.success}</div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerHeightMin')}
                        <input
                          inputMode="numeric"
                          value={partnerPrefsDraft?.partnerPreferences?.heightMinCm ?? ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), heightMinCm: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                          placeholder="160"
                        />
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerHeightMax')}
                        <input
                          inputMode="numeric"
                          value={partnerPrefsDraft?.partnerPreferences?.heightMaxCm ?? ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), heightMaxCm: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                          placeholder="190"
                        />
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerAgeMaxOlderYears')}
                        <input
                          inputMode="numeric"
                          value={partnerPrefsDraft?.partnerPreferences?.ageMaxOlderYears ?? ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), ageMaxOlderYears: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                          placeholder="5"
                        />
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerAgeMaxYoungerYears')}
                        <input
                          inputMode="numeric"
                          value={partnerPrefsDraft?.partnerPreferences?.ageMaxYoungerYears ?? ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), ageMaxYoungerYears: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                          placeholder="3"
                        />
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerMaritalStatus')}
                        <select
                          value={partnerPrefsDraft?.partnerPreferences?.maritalStatus || ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), maritalStatus: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          {partnerMaritalStatusOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerReligion')}
                        <select
                          value={partnerPrefsDraft?.partnerPreferences?.religion || ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), religion: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          {religionOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerLivingCountry')}
                        <input
                          value={partnerPrefsDraft?.partnerPreferences?.livingCountry || ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), livingCountry: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                          placeholder={t('matchmakingPage.form.placeholders.country')}
                        />
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerChildrenPreference')}
                        <select
                          value={partnerPrefsDraft?.partnerPreferences?.childrenPreference || ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), childrenPreference: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          {partnerChildrenPreferenceOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerEducationPreference')}
                        <select
                          value={partnerPrefsDraft?.partnerPreferences?.educationPreference || ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), educationPreference: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          {partnerEducationPreferenceOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerOccupationPreference')}
                        <select
                          value={partnerPrefsDraft?.partnerPreferences?.occupationPreference || ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), occupationPreference: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          {partnerOccupationPreferenceOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerFamilyValuesPreference')}
                        <select
                          value={partnerPrefsDraft?.partnerPreferences?.familyValuesPreference || ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), familyValuesPreference: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          {partnerFamilyValuesPreferenceOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerSmokingPreference')}
                        <select
                          value={partnerPrefsDraft?.partnerPreferences?.smokingPreference || ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), smokingPreference: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          {yesNoDoesntMatterOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm font-semibold text-slate-800">
                        {t('matchmakingPage.form.labels.partnerAlcoholPreference')}
                        <select
                          value={partnerPrefsDraft?.partnerPreferences?.alcoholPreference || ''}
                          onChange={(e) =>
                            setPartnerPrefsDraft((p) => ({
                              ...(p || {}),
                              partnerPreferences: { ...((p || {})?.partnerPreferences || {}), alcoholPreference: e.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          {yesNoDoesntMatterOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="sm:col-span-2">
                        <p className="text-sm font-semibold text-slate-800">{t('matchmakingPage.form.labels.partnerCommunicationMethods')}</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {partnerCommunicationMethodOptions.map((opt) => (
                            <label
                              key={opt.id}
                              className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                            >
                              <input
                                type="checkbox"
                                className="mt-1"
                                checked={
                                  Array.isArray(partnerPrefsDraft?.partnerPreferences?.communicationMethods)
                                    ? partnerPrefsDraft.partnerPreferences.communicationMethods.includes(opt.id)
                                    : false
                                }
                                onChange={() =>
                                  setPartnerPrefsDraft((prev) => {
                                    const prevObj = prev && typeof prev === 'object' ? prev : {};
                                    const prevPartner =
                                      prevObj.partnerPreferences && typeof prevObj.partnerPreferences === 'object' ? prevObj.partnerPreferences : {};
                                    const list = Array.isArray(prevPartner.communicationMethods) ? prevPartner.communicationMethods : [];
                                    const has = list.includes(opt.id);
                                    const next = has ? list.filter((x) => x !== opt.id) : [...list, opt.id];
                                    return { ...prevObj, partnerPreferences: { ...prevPartner, communicationMethods: next } };
                                  })
                                }
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={closePartnerPrefsModal}
                        disabled={partnerPrefsSaveState.loading}
                        className="app-btn app-btn-outline disabled:opacity-60"
                      >
                        {t('studio.common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={savePartnerPrefs}
                        disabled={partnerPrefsSaveState.loading}
                        className="app-btn app-btn-primary disabled:opacity-60"
                      >
                        {partnerPrefsSaveState.loading ? t('studio.profile.partnerPrefsSaving') : t('studio.profile.partnerPrefsSave')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {guidanceModalOpen ? (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6" role="dialog" aria-modal="true">
                <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0">
                    <div>
                      <h3 className="text-lg font-semibold">{t('studio.profile.guidance.modalTitle')}</h3>
                      <p className="mt-1 text-sm text-slate-600">{t('studio.profile.guidance.subtitle')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuidanceModalOpen(false)}
                      className="app-btn app-btn-ghost h-8 px-2 text-xs"
                    >
                      {t('studio.common.close')}
                    </button>
                  </div>

                  <div ref={guidanceScrollRef} className="p-4 space-y-4 overflow-y-auto flex-1">
                    <p className="text-sm text-slate-700">{t('studio.profile.guidance.intro')}</p>

                    <div className="space-y-4">
                      {guidanceSections.map((s, idx) => (
                        <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                          {Array.isArray(s.items) && s.items.length ? (
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                              {s.items.map((item, i2) => (
                                <li key={i2}>{item}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
                    <Link
                      to="/evlilik"
                      className="app-btn app-btn-primary"
                      onClick={() => setGuidanceModalOpen(false)}
                    >
                      {t('studio.profile.guidance.learnMore')}
                    </Link>

                    <a
                      href={guidanceWhatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="app-btn app-btn-primary"
                    >
                      {t('studio.profile.guidance.whatsappCta')}
                    </a>

                    <button
                      type="button"
                      onClick={() => setGuidanceModalOpen(false)}
                      className="app-btn app-btn-outline"
                    >
                      {t('studio.common.close')}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <StudioBottomNav />

      {photoManagerOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/60" onClick={closePhotoManager} />
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0">
              <div className="font-semibold text-slate-900">{shortLabel('matchmakingPanel.photos.title', 'Fotoğraflar')}</div>
              <button type="button" onClick={closePhotoManager} className="app-btn app-btn-ghost h-9 px-3">
                <X className="h-4 w-4" />
                {isTr ? 'Kapat' : t('studio.common.close', { defaultValue: 'Close' })}
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <div className="text-sm text-slate-600">
                {isTr
                  ? 'Mevcut fotoğraflarınızı görüntüleyin ve dilediğiniz zaman yenileyin. En fazla 5 görsel.'
                  : 'View your photos and update any time. Up to 5 images.'}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const url = String(photoManagerDraft?.urls?.[idx] || '').trim();
                  const preview = String(photoManagerDraft?.previews?.[idx] || '').trim();
                  const file = photoManagerDraft?.files?.[idx] || null;
                  const shown = preview || url;
                  const label = isTr ? `Fotoğraf ${idx + 1}` : `Photo ${idx + 1}`;

                  return (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-semibold text-slate-700">{label}</div>
                        {shown ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoManagerDraft((p) => {
                                const nextUrls = Array.isArray(p?.urls) ? [...p.urls] : ['', '', '', '', ''];
                                const nextFiles = Array.isArray(p?.files) ? [...p.files] : [null, null, null, null, null];
                                const nextPreviews = Array.isArray(p?.previews) ? [...p.previews] : ['', '', '', '', ''];

                                if (nextPreviews[idx] && String(nextPreviews[idx]).startsWith('blob:')) {
                                  try {
                                    URL.revokeObjectURL(nextPreviews[idx]);
                                  } catch {
                                    // ignore
                                  }
                                }

                                nextUrls[idx] = '';
                                nextFiles[idx] = null;
                                nextPreviews[idx] = '';

                                return { ...p, urls: nextUrls, files: nextFiles, previews: nextPreviews };
                              });
                            }}
                            className="app-btn app-btn-ghost h-7 px-2 text-xs"
                            title={isTr ? 'Kaldır' : 'Remove'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-2 overflow-hidden rounded-md border border-slate-200 bg-white">
                        {shown ? (
                          <a href={shown} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={shown} alt={label} className="h-28 w-full object-cover" loading="lazy" />
                          </a>
                        ) : (
                          <div className="flex h-28 items-center justify-center text-xs text-slate-500">
                            {isTr ? 'Boş' : 'Empty'}
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        <input
                          id={`photo-slot-${idx}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            if (!f) return;
                            if (!isImageFile(f)) {
                              setPhotoUpdateAction({ loading: false, error: t('matchmakingPanel.photos.updateRequest.errors.photoType'), success: '' });
                              return;
                            }

                            let previewUrl = '';
                            try {
                              previewUrl = URL.createObjectURL(f);
                            } catch {
                              previewUrl = '';
                            }

                            setPhotoManagerDraft((p) => {
                              const nextUrls = Array.isArray(p?.urls) ? [...p.urls] : ['', '', '', '', ''];
                              const nextFiles = Array.isArray(p?.files) ? [...p.files] : [null, null, null, null, null];
                              const nextPreviews = Array.isArray(p?.previews) ? [...p.previews] : ['', '', '', '', ''];

                              if (nextPreviews[idx] && String(nextPreviews[idx]).startsWith('blob:')) {
                                try {
                                  URL.revokeObjectURL(nextPreviews[idx]);
                                } catch {
                                  // ignore
                                }
                              }

                              nextFiles[idx] = f;
                              nextPreviews[idx] = previewUrl;
                              return { ...p, urls: nextUrls, files: nextFiles, previews: nextPreviews };
                            });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              document.getElementById(`photo-slot-${idx}`)?.click();
                            } catch {
                              // ignore
                            }
                          }}
                          className="app-btn app-btn-outline w-full"
                          disabled={photoUpdateAction.loading}
                        >
                          {shown ? (isTr ? 'Değiştir' : 'Replace') : isTr ? 'Ekle' : 'Add'}
                        </button>
                        {file?.name ? <div className="mt-1 text-[11px] text-slate-500 break-words">{file.name}</div> : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {photoUpdateAction.error ? (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">{photoUpdateAction.error}</div>
              ) : null}
              {photoUpdateAction.success ? (
                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">{photoUpdateAction.success}</div>
              ) : null}

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={closePhotoManager} className="app-btn app-btn-outline" disabled={photoUpdateAction.loading}>
                  {isTr ? 'Vazgeç' : 'Cancel'}
                </button>
                <button type="button" onClick={savePhotoUpdates} className="app-btn app-btn-primary" disabled={photoUpdateAction.loading}>
                  {photoUpdateAction.loading ? t('studio.common.processing') : isTr ? 'Kaydet' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pwaInstalled ? (
        <div className="mt-8">
          <PwaInstallCard variant="light" />
        </div>
      ) : null}

      <Footer />
    </div>
  );
}
