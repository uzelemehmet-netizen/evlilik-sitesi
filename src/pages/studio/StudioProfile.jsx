import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { collection, doc, getDocs, limit, onSnapshot, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { getDownloadURL, ref } from 'firebase/storage';
import { AlertTriangle, BookOpen, Edit, Images, LogOut, MessageCircle, ShieldCheck, Star, Trash2, UploadCloud, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useAuth } from '../../auth/AuthProvider';
import { auth, db, storage } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';
import { uploadImageToCloudinaryAuto } from '../../utils/cloudinaryUpload';
import { translateStudioApiError } from '../../utils/studioErrorI18n';
import { buildWhatsAppUrl, getWhatsAppNumber } from '../../utils/whatsapp';
import PwaInstallCard from '../../components/PwaInstallCard.jsx';

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

export default function StudioProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const referralUiEnabled = (() => {
    try {
      const raw = String(import.meta?.env?.VITE_MATCHMAKING_REFERRAL_ENABLED || '').toLowerCase().trim();
      return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
    } catch {
      return false;
    }
  })();


  const uid = String(user?.uid || '').trim();

  const [mmUser, setMmUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [applyBannerOpen, setApplyBannerOpen] = useState(true);

  const [latestApp, setLatestApp] = useState(null);
  const [latestAppId, setLatestAppId] = useState('');
  const [appLoading, setAppLoading] = useState(true);

  const [deleteState, setDeleteState] = useState({ loading: false, error: '' });
  const [membershipAction, setMembershipAction] = useState({ loading: false, error: '', success: '' });

  const [referralCodeDraft, setReferralCodeDraft] = useState('');
  const [referralAcceptState, setReferralAcceptState] = useState({ loading: false, error: '', success: '' });
  const [referralClaimState, setReferralClaimState] = useState({ loading: false, error: '', success: '' });
  const [referralCopyState, setReferralCopyState] = useState({ success: '' });

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [guidanceModalOpen, setGuidanceModalOpen] = useState(false);
  const guidanceScrollRef = useRef(null);
  const [verifyForm, setVerifyForm] = useState({
    idType: 'tc_id',
    idFront: null,
    idBack: null,
    selfie: null,
  });
  const [verifyAction, setVerifyAction] = useState({ loading: false, error: '', success: '' });
  const [verifyMode, setVerifyMode] = useState('upload'); // upload | whatsapp_call
  const [verifySelectAction, setVerifySelectAction] = useState({ loading: false, error: '', result: null });

  const [textDraft, setTextDraft] = useState({ about: '', expectations: '' });
  const [textTouched, setTextTouched] = useState(false);
  const [textSaveState, setTextSaveState] = useState({ loading: false, error: '', success: '' });

  const [photoPrivacyState, setPhotoPrivacyState] = useState({ loading: false, error: '' });
  const [localPhotosBlurred, setLocalPhotosBlurred] = useState(null);

  const [photoUpdateFiles, setPhotoUpdateFiles] = useState({ photo1: null, photo2: null, photo3: null });
  const [photoUpdateAction, setPhotoUpdateAction] = useState({ loading: false, error: '', success: '' });
  const [showAllMyPhotos, setShowAllMyPhotos] = useState(false);

  const [resolvedPhotoUrls, setResolvedPhotoUrls] = useState([]);

  const [topInlinePanel, setTopInlinePanel] = useState('');

  const isProfileIncomplete = useMemo(() => {
    const wroteOnce =
      typeof mmUser?.profileTextWriteOnceUsedAtMs === 'number' && Number.isFinite(mmUser.profileTextWriteOnceUsedAtMs)
        ? mmUser.profileTextWriteOnceUsedAtMs
        : 0;
    const about = safeStr(mmUser?.details?.about) || safeStr(mmUser?.publicProfile?.about);
    const expectations = safeStr(mmUser?.details?.expectations) || safeStr(mmUser?.publicProfile?.expectations);
    if (wroteOnce > 0 || (about && expectations)) return false;

    const source = safeStr(latestApp?.source).toLowerCase();
    const isStub = source === 'auto_stub' || latestApp?.details?.autoBootstrap === true;
    return !!isStub;
  }, [latestApp?.details?.autoBootstrap, latestApp?.source, mmUser?.details?.about, mmUser?.details?.expectations, mmUser?.profileTextWriteOnceUsedAtMs, mmUser?.publicProfile?.about, mmUser?.publicProfile?.expectations]);

  const applySource = String(location?.state?.from || '').trim();
  const applyApplicationId = String(location?.state?.applicationId || '').trim();
  const showApplyBanner =
    applyBannerOpen && ['matchmakingApply', 'matchmakingEditOnce', 'applyRedirectExisting'].includes(applySource);
  const applyNextSteps = t('studio.profile.applySuccess.steps', { returnObjects: true });

  useEffect(() => {
    if (!uid) return;

    setLoading(true);
    const ref = doc(db, 'matchmakingUsers', uid);
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
    const app = appFromUser || latestApp || null;
    const publicProfile = mmUser?.publicProfile && typeof mmUser.publicProfile === 'object' ? mmUser.publicProfile : null;

    const username = String(app?.username || publicProfile?.username || '').trim();
    const name =
      String(username || app?.fullName || mmUser?.fullName || '').trim() ||
      (user?.email ? String(user.email).split('@')[0] : t('studio.common.profile'));

    const age = typeof app?.age === 'number' ? app.age : typeof publicProfile?.age === 'number' ? publicProfile.age : null;

    const genderRaw = String(app?.gender || publicProfile?.gender || '').trim().toLowerCase();
    const genderLabel =
      genderRaw === 'male'
        ? t('matchmakingPage.form.options.gender.male')
        : genderRaw === 'female'
          ? t('matchmakingPage.form.options.gender.female')
          : String(app?.gender || publicProfile?.gender || '').trim();

    const photoUrlsRaw =
      (Array.isArray(app?.photoUrls) && app.photoUrls) ||
      (Array.isArray(publicProfile?.photoUrls) && publicProfile.photoUrls) ||
      (Array.isArray(mmUser?.photoUrls) && mmUser.photoUrls) ||
      [];

    const photoUrls = photoUrlsRaw.map(String).map((s) => s.trim()).filter(Boolean);

    const photoPathsRaw =
      (Array.isArray(app?.photoPaths) && app.photoPaths) ||
      (Array.isArray(publicProfile?.photoPaths) && publicProfile.photoPaths) ||
      (Array.isArray(mmUser?.photoPaths) && mmUser.photoPaths) ||
      [];

    const photoPaths = photoPathsRaw.map(String).map((s) => s.trim()).filter(Boolean);

    const photoUpdateStatus = safeStr(app?.photoUpdate?.status);

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
      photoUpdateStatus,
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

  const isImageFile = (file) => {
    if (!file) return false;
    const typ = String(file?.type || '').toLowerCase();
    return typ.startsWith('image/');
  };

  const refreshLatestApplication = async () => {
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
  };

  const requestPhotoUpdate = async () => {
    if (!uid) return;
    if (photoUpdateAction.loading) return;

    if (profile.photoUpdateStatus === 'pending') {
      setPhotoUpdateAction({ loading: false, error: t('matchmakingPanel.photos.updateRequest.pending'), success: '' });
      return;
    }

    const f1 = photoUpdateFiles.photo1;
    const f2 = photoUpdateFiles.photo2;
    const f3 = photoUpdateFiles.photo3;

    if (!f1 || !f2 || !f3) {
      setPhotoUpdateAction({ loading: false, error: t('matchmakingPanel.photos.updateRequest.errors.photosRequired'), success: '' });
      return;
    }
    if (!isImageFile(f1) || !isImageFile(f2) || !isImageFile(f3)) {
      setPhotoUpdateAction({ loading: false, error: t('matchmakingPanel.photos.updateRequest.errors.photoType'), success: '' });
      return;
    }

    setPhotoUpdateAction({ loading: true, error: '', success: '' });
    try {
      const up1 = await uploadImageToCloudinaryAuto(f1, {
        folder: `matchmaking/photo-update-requests/${uid || 'unknown'}`,
        tags: ['matchmaking', 'photo-update', 'photo1'],
      });
      const up2 = await uploadImageToCloudinaryAuto(f2, {
        folder: `matchmaking/photo-update-requests/${uid || 'unknown'}`,
        tags: ['matchmaking', 'photo-update', 'photo2'],
      });
      const up3 = await uploadImageToCloudinaryAuto(f3, {
        folder: `matchmaking/photo-update-requests/${uid || 'unknown'}`,
        tags: ['matchmaking', 'photo-update', 'photo3'],
      });

      await authFetch('/api/matchmaking-photo-update-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ photoUrls: [up1.secureUrl, up2.secureUrl, up3.secureUrl] }),
      });

      setPhotoUpdateFiles({ photo1: null, photo2: null, photo3: null });
      setPhotoUpdateAction({ loading: false, error: '', success: t('matchmakingPanel.photos.updateRequest.success') });

      // Studio profile doesn't listen to application doc in realtime; refresh so pending badge appears.
      await refreshLatestApplication();
    } catch (e) {
      const msg = safeStr(e?.message);
      const mapped =
        msg === 'pending_exists'
          ? t('matchmakingPanel.photos.updateRequest.pending')
          : msg === 'application_not_found'
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
    try {
      await signOut(auth);
    } finally {
      navigate('/');
    }
  };

  const activateFreeMembership = async () => {
    if (membershipAction.loading) return;
    setMembershipAction({ loading: true, error: '', success: '' });
    try {
      await authFetch('/api/matchmaking-membership-activate-free', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      setMembershipAction({ loading: false, error: '', success: t('studio.profile.membershipActivated') });
    } catch (e) {
      const msg = String(e?.message || 'membership_activate_failed').trim();
      setMembershipAction({ loading: false, error: translateStudioApiError(t, msg) || msg, success: '' });
    }
  };

  const cancelMembership = async () => {
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

  const copyInviteCode = async () => {
    const code = safeStr(mmUser?.userCode || (mmUser?.publicProfile && mmUser.publicProfile.userCode));
    if (!code) return;
    try {
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const el = document.createElement('textarea');
        el.value = code;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setReferralCopyState({ success: t('studio.referral.copied') });
      setTimeout(() => setReferralCopyState({ success: '' }), 1500);
    } catch {
      // ignore
    }
  };

  const acceptReferralCode = async () => {
    if (referralAcceptState.loading) return;

    const code = String(referralCodeDraft || '').trim();
    if (!code) {
      setReferralAcceptState({ loading: false, error: t('studio.referral.errors.invalidInviteCode'), success: '' });
      return;
    }

    setReferralAcceptState({ loading: true, error: '', success: '' });
    try {
      const res = await authFetch('/api/matchmaking-referral-accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const status = String(res?.status || '').trim();
      const msg = status === 'already_accepted' ? t('studio.referral.statusAlreadyAccepted') : t('studio.referral.statusAccepted');
      setReferralAcceptState({ loading: false, error: '', success: msg });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setReferralAcceptState({ loading: false, error: translateStudioApiError(t, msg) || msg, success: '' });
    }
  };

  const claimReferralReward = async () => {
    if (referralClaimState.loading) return;
    setReferralClaimState({ loading: true, error: '', success: '' });
    try {
      const res = await authFetch('/api/matchmaking-referral-claim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });

      const status = String(res?.status || '').trim();
      const msg = status === 'already_claimed' ? t('studio.referral.statusAlreadyClaimed') : t('studio.referral.statusClaimed');
      setReferralClaimState({ loading: false, error: '', success: msg });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setReferralClaimState({ loading: false, error: translateStudioApiError(t, msg) || msg, success: '' });
    }
  };

  const submitManualVerification = async () => {
    if (verifyAction.loading) return;

    const idFront = verifyForm.idFront;
    const idBack = verifyForm.idBack;
    const selfie = verifyForm.selfie;
    if (!idFront || !idBack || !selfie) {
      setVerifyAction({ loading: false, error: t('studio.profile.verifyMissingFiles'), success: '' });
      return;
    }

    setVerifyAction({ loading: true, error: '', success: '' });
    try {
      const folder = 'matchmaking/identity';
      const tags = ['identity_verification', 'manual', verifyForm.idType].filter(Boolean);

      const upFront = await uploadImageToCloudinaryAuto(idFront, { folder, tags });
      const upBack = await uploadImageToCloudinaryAuto(idBack, { folder, tags });
      const upSelfie = await uploadImageToCloudinaryAuto(selfie, { folder, tags });

      await authFetch('/api/matchmaking-verification-manual-submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          idType: verifyForm.idType,
          idFrontUrl: upFront?.secureUrl || '',
          idBackUrl: upBack?.secureUrl || '',
          selfieUrl: upSelfie?.secureUrl || '',
        }),
      });

      setVerifyAction({ loading: false, error: '', success: t('studio.profile.verifySubmitted') });
      setVerifyForm({ idType: verifyForm.idType, idFront: null, idBack: null, selfie: null });
    } catch (e) {
      const msg = String(e?.message || 'verification_submit_failed').trim();
      setVerifyAction({ loading: false, error: translateStudioApiError(t, msg) || msg, success: '' });
    }
  };

  const whatsappNumber = useMemo(() => {
    try {
      return getWhatsAppNumber();
    } catch {
      return '';
    }
  }, []);

  const startWhatsAppCallVerification = async () => {
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
      const url = urlFromServer || (msg ? buildWhatsAppUrl(msg) : '');
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
        setVerifyMode('whatsapp_call');
        return;
      }
    } catch {
      // ignore
    }
    setVerifyMode('upload');
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
  }, [i18n?.language, t]);

  const guidanceWhatsAppUrl = useMemo(() => {
    const text = t('studio.profile.guidance.whatsappMessage');
    return buildWhatsAppUrl(text);
  }, [i18n?.language, t]);

  useEffect(() => {
    if (!guidanceModalOpen) return;
    const el = guidanceScrollRef.current;
    if (el && typeof el.scrollTop === 'number') el.scrollTop = 0;
  }, [guidanceModalOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Banner */}
          <div className="relative h-44 w-full bg-slate-200">
            <img
              src="/bali-island-temple-ocean-sunset-panoramic.jpg"
              alt={t('studio.profile.bannerAlt')}
              className="h-full w-full object-cover opacity-60"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="relative p-6">
            {/* Avatar */}
            <div className="absolute -top-12 left-6">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.name}
                    className="h-24 w-24 rounded-full border-4 border-white object-cover shadow"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-100 shadow">
                    <span className="text-2xl font-bold text-slate-500">{safeStr(profile.name).slice(0, 1).toUpperCase() || '?'}</span>
                  </div>
                )}

                {profile.isVerified ? (
                  <div className="absolute bottom-1 right-1 rounded-full bg-emerald-600 p-1.5 ring-2 ring-white">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="pt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  {profile.name}{profile.age ? `, ${profile.age}` : ''}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {safeStr(mmUser?.userCode || (mmUser?.publicProfile && mmUser.publicProfile.userCode)) ? (
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-900 border border-indigo-200">
                      {t('studio.profile.userCode.label')}: {safeStr(mmUser?.userCode || (mmUser?.publicProfile && mmUser.publicProfile.userCode))}
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
                {profile.membershipValidUntilMs ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {t('studio.profile.endsAt')}: {new Intl.DateTimeFormat(String(i18n?.language || 'tr'), { dateStyle: 'medium' }).format(new Date(profile.membershipValidUntilMs))}
                  </p>
                ) : null}

                {isProfileIncomplete ? (
                  <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-950">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-200 text-red-900">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-white px-2 py-0.5 text-xs font-bold tracking-wide text-red-800">
                            {t('studio.profileGate.important')}
                          </span>
                          <p className="font-semibold">{t('studio.profileGate.title')}</p>
                        </div>
                        <p className="mt-1 text-sm text-red-900/90">{t('studio.profileGate.body')}</p>
                        <div className="mt-3">
                          <Link
                            to="/evlilik/eslestirme-basvuru?w=1"
                            className="inline-flex items-center justify-center rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                          >
                            {t('studio.profileGate.cta')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <Link
                  to="/evlilik/eslestirme-basvurusu?editOnce=1"
                  className="app-btn w-full sm:w-auto"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t('studio.profile.editProfile')}
                </Link>

                <Link
                  to="/profilim/destek"
                  className="app-btn w-full sm:w-auto"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t('studio.feedback.nav')}
                </Link>

                <button
                  type="button"
                  onClick={() => toggleTopInlinePanel('membership')}
                  className="app-btn w-full sm:w-auto"
                  title={t('studio.profile.subscriptionTitle')}
                >
                  <Star className="mr-2 h-4 w-4" />
                  {t('studio.profile.subscriptionTitle')}
                </button>

                <button
                  type="button"
                  onClick={() => toggleTopInlinePanel('identity')}
                  className="app-btn w-full sm:w-auto"
                  title={t('studio.profile.identityTitle')}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {t('studio.profile.identityTitle')}
                </button>

                <button
                  type="button"
                  onClick={() => toggleTopInlinePanel('photoPrivacy')}
                  className="app-btn w-full sm:w-auto"
                  title={t('studio.profile.photoPrivacy.title')}
                >
                  <Images className="mr-2 h-4 w-4" />
                  {t('studio.profile.photoPrivacy.title')}
                </button>

                {referralUiEnabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReferralAcceptState({ loading: false, error: '', success: '' });
                      setReferralClaimState({ loading: false, error: '', success: '' });
                      toggleTopInlinePanel('referral');
                    }}
                    className="app-btn w-full sm:w-auto"
                    title={t('studio.referral.title')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {t('studio.referral.title')}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setGuidanceModalOpen(true)}
                  className="app-btn w-full sm:w-auto"
                  title={t('studio.profile.guidance.button')}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  {t('studio.profile.guidance.button')}
                </button>

                <Link
                  to="/app/matches"
                  className="app-btn app-btn-accent w-full sm:w-auto"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <span>{t('studio.profile.myMatches')}</span>
                    <span className="app-badge">Liste</span>
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={logoutNow}
                  className="app-btn app-btn-logout w-full sm:w-auto"
                  title={t('studio.profile.logout')}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('studio.profile.logout')}
                </button>
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

                    {membershipAction.error ? (
                      <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">{membershipAction.error}</div>
                    ) : null}
                    {membershipAction.success ? (
                      <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">{membershipAction.success}</div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500"
                        title={t('studio.profile.buySoon')}
                      >
                        {t('studio.profile.buySoon')}
                      </button>

                      <button
                        type="button"
                        onClick={activateFreeMembership}
                        disabled={membershipAction.loading}
                        className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                      >
                        {membershipAction.loading ? t('studio.common.processing') : t('studio.profile.activateMembership')}
                      </button>

                      <button
                        type="button"
                        onClick={cancelMembership}
                        disabled={membershipAction.loading}
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        {t('studio.profile.cancelMembership')}
                      </button>

                      <Link
                        to="/profilim/bilgilerim"
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
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
                        onClick={() => {
                          setVerifyAction({ loading: false, error: '', success: '' });
                          setVerifySelectAction({ loading: false, error: '', result: null });
                          setVerifyMode('upload');
                          setVerifyModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        {t('studio.profile.verifyNow')}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setVerifyAction({ loading: false, error: '', success: '' });
                          setVerifySelectAction({ loading: false, error: '', result: null });
                          setVerifyMode('whatsapp_call');
                          setVerifyModalOpen(true);
                        }}
                        disabled={!whatsappNumber || String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                        className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {t('studio.profile.verifyMethodWhatsApp')}
                      </button>
                    </div>

                    {!whatsappNumber ? (
                      <p className="mt-2 text-xs text-slate-500">{t('matchmakingPanel.verification.errors.whatsappNotConfigured')}</p>
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
                          <div className="text-sm font-semibold text-slate-900">{t('matchmakingPanel.photos.updateRequest.title')}</div>
                          <div className="mt-1 text-sm text-slate-600">{t('matchmakingPanel.photos.updateRequest.lead')}</div>
                        </div>

                        {profile.photoUpdateStatus === 'pending' ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                            {t('matchmakingPanel.photos.updateRequest.pending')}
                          </span>
                        ) : null}
                      </div>

                      {photoUpdateAction.error ? (
                        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">{photoUpdateAction.error}</div>
                      ) : null}
                      {photoUpdateAction.success ? (
                        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">{photoUpdateAction.success}</div>
                      ) : null}

                      {profile.photoUpdateStatus === 'pending' ? null : (
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {[1, 2, 3].map((idx) => {
                            const key = `photo${idx}`;
                            const file = photoUpdateFiles?.[key] || null;
                            return (
                              <div key={key} className="rounded-lg border border-slate-200 bg-white p-3">
                                <div className="text-xs font-semibold text-slate-700">{t(`matchmakingPage.form.labels.${key}`)}</div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="mt-2 block w-full text-xs"
                                  onChange={(e) =>
                                    setPhotoUpdateFiles((p) => ({
                                      ...p,
                                      [key]: e.target.files?.[0] || null,
                                    }))
                                  }
                                />
                                <div className="mt-2 text-[11px] text-slate-500 break-words">{file?.name || t('matchmakingPage.form.photo.noFileChosen')}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {profile.photoUpdateStatus === 'pending' ? null : (
                        <button
                          type="button"
                          onClick={requestPhotoUpdate}
                          disabled={photoUpdateAction.loading}
                          className="mt-3 inline-flex items-center justify-center rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-60"
                        >
                          {photoUpdateAction.loading ? t('studio.common.processing') : t('matchmakingPanel.photos.updateRequest.cta')}
                        </button>
                      )}
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
                            (photosBlurred ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-slate-200 text-slate-900 hover:bg-slate-300')
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

                {referralUiEnabled && topInlinePanel === 'referral' ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-base font-semibold">
                      <Users className="h-5 w-5 text-indigo-600" />
                      {t('studio.referral.title')}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">{t('studio.referral.description')}</p>

                    <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm">
                          <div className="font-semibold text-slate-900">{t('studio.referral.myCodeLabel')}</div>
                          <div className="mt-1 font-mono text-slate-700">
                            {safeStr(mmUser?.userCode || (mmUser?.publicProfile && mmUser.publicProfile.userCode)) || t('studio.common.unknown')}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={copyInviteCode}
                            disabled={!safeStr(mmUser?.userCode || (mmUser?.publicProfile && mmUser.publicProfile.userCode))}
                            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60"
                          >
                            {t('studio.referral.copy')}
                          </button>
                          {referralCopyState.success ? (
                            <span className="text-xs font-semibold text-emerald-700">{referralCopyState.success}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {safeStr(mmUser?.referral?.invitedByUid) ? (
                      <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                        <div>
                          <span className="font-semibold">{t('studio.referral.invitedByLabel')}:</span>{' '}
                          {safeStr(mmUser?.referral?.invitedByCode) || t('studio.common.unknown')}
                        </div>

                        {referralClaimState.error ? (
                          <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">{referralClaimState.error}</div>
                        ) : null}
                        {referralClaimState.success ? (
                          <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">{referralClaimState.success}</div>
                        ) : null}

                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={claimReferralReward}
                            disabled={referralClaimState.loading}
                            className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                          >
                            {referralClaimState.loading ? t('studio.common.processing') : t('studio.referral.claimButton')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                        <label className="block text-sm font-semibold text-slate-900" htmlFor="referralCode">
                          {t('studio.referral.enterCodeLabel')}
                        </label>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <input
                            id="referralCode"
                            value={referralCodeDraft}
                            onChange={(e) => setReferralCodeDraft(e.target.value)}
                            placeholder={t('studio.referral.enterCodePlaceholder')}
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            onClick={acceptReferralCode}
                            disabled={referralAcceptState.loading}
                            className="inline-flex items-center justify-center rounded-md bg-indigo-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-60"
                          >
                            {referralAcceptState.loading ? t('studio.common.processing') : t('studio.referral.acceptButton')}
                          </button>
                        </div>

                        {referralAcceptState.error ? (
                          <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">{referralAcceptState.error}</div>
                        ) : null}
                        {referralAcceptState.success ? (
                          <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-900">{referralAcceptState.success}</div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-6">
              <PwaInstallCard variant="light" />
            </div>

            {showApplyBanner ? (
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                      <Star className="h-4 w-4 text-amber-700" />
                    </div>

                    <div>
                      <div className="font-semibold text-slate-900">{t('studio.profile.applySuccess.title')}</div>
                      <div className="mt-1 text-sm text-slate-700">{t('studio.profile.applySuccess.subtitle')}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setApplyBannerOpen(false)}
                    className="rounded-md px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-amber-100"
                  >
                    {t('studio.common.close')}
                  </button>
                </div>

                {Array.isArray(applyNextSteps) ? (
                  <ul className="mt-3 space-y-1 text-sm text-slate-700">
                    {applyNextSteps.map((s, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-amber-700">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
                  <Link
                    to="/app/pool"
                    className="app-btn app-btn-primary w-full sm:w-auto"
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

                  {applyApplicationId ? (
                    <div className="text-xs text-slate-500">
                      {t('studio.profile.applySuccess.applicationIdLabel')}: {applyApplicationId}
                    </div>
                  ) : null}
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
                  className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
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
                  className="mt-3 inline-flex items-center justify-center rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteState.loading ? t('studio.profile.deleting') : t('studio.profile.deleteAccount')}
                </button>
              </div>
            </div>

            {verifyModalOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 p-4">
                    <h3 className="text-lg font-semibold">{t('studio.profile.verifyModalTitle')}</h3>
                    <button
                      type="button"
                      onClick={closeVerifyModal}
                      className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      {t('studio.common.close')}
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm text-slate-700 whitespace-pre-line">{t('studio.profile.verifyModalInfo')}</p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setVerifyMode('upload')}
                          disabled={verifyAction.loading || verifySelectAction.loading || String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                          className={
                            "rounded-md border px-3 py-2 text-sm font-semibold transition " +
                            (verifyMode === 'upload'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50')
                          }
                        >
                          {t('studio.profile.verifyMethodUpload')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerifyMode('whatsapp_call')}
                          disabled={verifyAction.loading || verifySelectAction.loading || String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                          className={
                            "rounded-md border px-3 py-2 text-sm font-semibold transition " +
                            (verifyMode === 'whatsapp_call'
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50')
                          }
                        >
                          {t('studio.profile.verifyMethodWhatsApp')}
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

                    {verifyMode === 'whatsapp_call' ? (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-sm font-semibold text-emerald-900">{t('studio.profile.verifyWhatsAppTitle')}</p>
                        <p className="mt-1 text-sm text-emerald-900/80">{t('studio.profile.verifyWhatsAppBody')}</p>
                        <p className="mt-2 text-xs text-emerald-900/80 whitespace-pre-line">{t('studio.profile.verifyPrivacyNote')}</p>

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
                          className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                        >
                          {verifySelectAction.loading ? t('studio.common.loading') : t('studio.profile.verifyWhatsAppCta')}
                        </button>

                        {!whatsappNumber ? (
                          <p className="mt-2 text-xs text-emerald-900/70">{t('matchmakingPanel.verification.errors.whatsappNotConfigured')}</p>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-slate-800">{t('studio.profile.idType')}</label>
                          <select
                            value={verifyForm.idType}
                            onChange={(e) => setVerifyForm((p) => ({ ...p, idType: e.target.value }))}
                            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                          >
                            <option value="tc_id">{t('studio.profile.idTypeTrId')}</option>
                            <option value="passport">{t('studio.profile.idTypePassport')}</option>
                            <option value="driver_license">{t('studio.profile.idTypeDriver')}</option>
                          </select>
                          <p className="mt-1 text-xs text-slate-500">{t('studio.profile.verifyPhotosHint')}</p>
                          <p className="mt-1 text-xs text-slate-500 whitespace-pre-line">{t('studio.profile.verifyPrivacyNote')}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div>
                            <label className="block text-sm font-semibold text-slate-800">{t('studio.profile.idFront')}</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setVerifyForm((p) => ({ ...p, idFront: e.target.files?.[0] || null }))}
                              className="mt-1 block w-full text-sm"
                              disabled={String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-800">{t('studio.profile.idBack')}</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setVerifyForm((p) => ({ ...p, idBack: e.target.files?.[0] || null }))}
                              className="mt-1 block w-full text-sm"
                              disabled={String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-800">{t('studio.profile.selfie')}</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setVerifyForm((p) => ({ ...p, selfie: e.target.files?.[0] || null }))}
                              className="mt-1 block w-full text-sm"
                              disabled={String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                            />
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
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {t('studio.common.cancel')}
                      </button>
                      {verifyMode === 'whatsapp_call' ? null : (
                        <button
                          type="button"
                          onClick={submitManualVerification}
                          disabled={verifyAction.loading || String(profile?.identityStatus || '').toLowerCase().trim() === 'pending'}
                          className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                        >
                          {verifyAction.loading ? t('studio.common.loading') : t('studio.profile.submitVerification')}
                        </button>
                      )}
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
                      className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
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
                      className="inline-flex items-center justify-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                      onClick={() => setGuidanceModalOpen(false)}
                    >
                      {t('studio.profile.guidance.learnMore')}
                    </Link>

                    <a
                      href={guidanceWhatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      {t('studio.profile.guidance.whatsappCta')}
                    </a>

                    <button
                      type="button"
                      onClick={() => setGuidanceModalOpen(false)}
                      className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
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

      <Footer />
    </div>
  );
}
