import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { collection, doc, getDoc, getDocFromServer, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../auth/AuthProvider';
import { db } from '../../config/firebaseDb';
import { authFetch } from '../../utils/authFetch';
import { translateStudioApiError } from '../../utils/studioErrorI18n';
import StudioInboxModal from '../../components/studio/StudioInboxModal';
import { useMatchmakingResetAtMs } from '../../utils/matchmakingReset';
import { HelpCircle, RefreshCcw, ShieldCheck, Users } from 'lucide-react';
import ImageLightbox from '../../components/ImageLightbox';
import PwaInstallCard from '../../components/PwaInstallCard';
import { openPreviewGate } from '../../utils/previewGate';
import { buildPreviewPoolItems } from '../../utils/studioPreviewData';
import StudioBottomNav from '../../components/studio/StudioBottomNav';
import { isTutorialActive } from '../../utils/tutorialState.js';
import { hasMinimumMatchmakingProfileInUserDoc, isStubMatchmakingApplication } from '../../utils/matchmakingProfileCompletion';

const NEW_USER_BADGE_WINDOW_MS = 48 * 60 * 60 * 1000;

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

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
  const [lastUpdatedMs, setLastUpdatedMs] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [needsApplication, setNeedsApplication] = useState(false);

  const [outboxMap, setOutboxMap] = useState({});
  const [, setGrantedMap] = useState({});
  const [requestingUid, setRequestingUid] = useState('');

  const [inboxAccess, setInboxAccess] = useState([]);
  const [accessAction, setAccessAction] = useState({ loadingId: '', error: '' });

  const [inboxModal, setInboxModal] = useState({ open: false });
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0, title: '' });

  const [myLock, setMyLock] = useState({ active: false, matchId: '' });
  const [, setMyMembership] = useState({ active: false });
  const [, setMyGender] = useState('');
  const [myPhotosBlurred, setMyPhotosBlurred] = useState(false);
  const [paywallNotice, setPaywallNotice] = useState('');
  const [profileGateNotice, setProfileGateNotice] = useState('');
  const [myProfileComplete, setMyProfileComplete] = useState(true);
  const [myHasAnyPhoto, setMyHasAnyPhoto] = useState(null); // null=unknown
  const [myHasAnyApplication, setMyHasAnyApplication] = useState(null); // null=unknown
  const [myOptionalDetailsMissing, setMyOptionalDetailsMissing] = useState(false);

  const [completeProfileGateOpen, setCompleteProfileGateOpen] = useState(false);
  const [optionalDetailsPromptOpen, setOptionalDetailsPromptOpen] = useState(false);

  const profileGateAutoShownRef = useRef(false);
  const optionalDetailsPromptAutoShownRef = useRef(false);

  const applicationRequired = useMemo(() => {
    // Backend'den gelen needsApplication bazı edge-case'lerde yanlış pozitif olabiliyor.
    // Kullanıcı zaten form doldurduysa (application var) UI'da tekrar forma yönlendirmeyelim.
    if (myHasAnyApplication === true) return false;
    if (myHasAnyApplication === false) return true;
    // Uygulama var/yok henüz bilinmiyorsa kullanıcıyı bloklamayalım;
    // eksikse backend çağrısı zaten application_not_found/profile_incomplete ile döner.
    return false;
  }, [myHasAnyApplication]);

  const interactionLocked = useMemo(() => {
    return applicationRequired || myProfileComplete === false || myHasAnyPhoto === false;
  }, [applicationRequired, myProfileComplete, myHasAnyPhoto]);

  const profileGateMode = useMemo(() => {
    if (myHasAnyApplication === false) return 'application';
    if (myHasAnyApplication === true) {
      if (myHasAnyPhoto === false) return 'photo';
      if (myHasAnyPhoto === null && myProfileComplete === false) return '';
      if (myProfileComplete === false) return 'application';
    }
    return '';
  }, [myHasAnyApplication, myHasAnyPhoto, myProfileComplete]);

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

  const load = useCallback(
    async ({ silent } = { silent: false }) => {
      if (isPreview) {
        const sample = buildPreviewPoolItems();
        setNeedsApplication(false);
        setAutoRefreshEnabled(false);
        setMeta({ total: sample.length });
        setItems(sample);
        setLastUpdatedMs(Date.now());
        setState({ loading: false, error: '' });
        return;
      }
      if (!silent) setState({ loading: true, error: '' });
      try {
        const data = await authFetch('/api/matchmaking-browse', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ limit: 30 }),
        });

        if (cancelledRef.current) return;
        setNeedsApplication(!!(data?.meta && data.meta.needsApplication));
        setAutoRefreshEnabled(true);
        setMeta(data?.meta || null);
        setItems(Array.isArray(data?.items) ? data.items : []);
        setLastUpdatedMs(Date.now());
        setState({ loading: false, error: '' });
      } catch (e) {
        if (cancelledRef.current) return;
        const msg = safeStr(e?.message) || 'load_failed';

        if (msg === 'application_not_found') {
          setNeedsApplication(true);
          setAutoRefreshEnabled(false);
        }

        setItems([]);
        setMeta(null);
        setState({ loading: false, error: translateStudioApiError(t, msg) || msg });
      }
    },
    [isPreview, t]
  );

  useEffect(() => {
    if (!isPreview) return;
    const sample = buildPreviewPoolItems();
    setNeedsApplication(false);
    setAutoRefreshEnabled(false);
    setMeta({ total: sample.length });
    setItems(sample);
    setLastUpdatedMs(Date.now());
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
    if (isPreview) return;
    if (interactionLocked) {
      setOptionalDetailsPromptOpen(false);
      return;
    }
    if (!myHasAnyApplication || !myProfileComplete || !myOptionalDetailsMissing) {
      setOptionalDetailsPromptOpen(false);
      return;
    }
    if (optionalDetailsPromptAutoShownRef.current) return;

    optionalDetailsPromptAutoShownRef.current = true;
    setOptionalDetailsPromptOpen(true);
  }, [interactionLocked, isPreview, myHasAnyApplication, myOptionalDetailsMissing, myProfileComplete]);

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
      setMyLock({ active: false, matchId: '' });
      setMyMembership({ active: false });
      setMyPhotosBlurred(false);
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

        const lock = d?.matchmakingLock && typeof d.matchmakingLock === 'object' ? d.matchmakingLock : null;
        const active = !!lock?.active;
        const matchId = typeof lock?.matchId === 'string' ? String(lock.matchId).trim() : '';
        setMyLock({ active, matchId });

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

        const v1 = d?.publicProfile && typeof d.publicProfile === 'object' ? d.publicProfile.photosBlurred : undefined;
        const v2 = d?.photosBlurred;
        const blur = typeof v1 === 'boolean' ? v1 : typeof v2 === 'boolean' ? v2 : false;
        setMyPhotosBlurred(!!blur);
      } catch {
        // best-effort
      }
    })();

    const unsub = onSnapshot(
      ref,
      (snap) => {
        const d = snap.exists() ? snap.data() || {} : {};

        const lock = d?.matchmakingLock && typeof d.matchmakingLock === 'object' ? d.matchmakingLock : null;
        const active = !!lock?.active;
        const matchId = typeof lock?.matchId === 'string' ? String(lock.matchId).trim() : '';
        setMyLock({ active, matchId });

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

        const v1 = d?.publicProfile && typeof d.publicProfile === 'object' ? d.publicProfile.photosBlurred : undefined;
        const v2 = d?.photosBlurred;
        const blur = typeof v1 === 'boolean' ? v1 : typeof v2 === 'boolean' ? v2 : false;
        setMyPhotosBlurred(!!blur);
      },
      () => {
        setMyLock({ active: false, matchId: '' });
        setMyMembership({ active: false });
        setMyGender('');
        setMyPhotosBlurred(false);
        setMyProfileComplete(true);
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
      return;
    }

    const parseAppsSnap = (snap) => {
      try {
        const ids = [];
        let hasPhoto = false;
        let bestApp = null;
        snap.forEach((d) => {
          const id = safeStr(d?.id);
          if (id) ids.push(id);
          const data = typeof d?.data === 'function' ? d.data() || {} : d?.data || {};
          bestApp = pickBestApplicationCandidate(bestApp, { id, ...data });
          const urls = Array.isArray(data?.photoUrls) ? data.photoUrls : [];
          if (urls.some((u) => safeStr(u))) hasPhoto = true;
        });
        return { ids, hasPhoto, bestApp };
      } catch {
        return null;
      }
    };

    const qAppsUserId = query(collection(db, 'matchmakingApplications'), where('userId', '==', uid), limit(10));
    const qAppsUid = query(collection(db, 'matchmakingApplications'), where('uid', '==', uid), limit(10));
    const qAppsUserUid = query(collection(db, 'matchmakingApplications'), where('userUid', '==', uid), limit(10));

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
        const [s1, s2, s3] = await Promise.all([getDocs(qAppsUserId), getDocs(qAppsUid), getDocs(qAppsUserUid)]);
        if (cancelled) return;
        const p1 = parseAppsSnap(s1);
        const p2 = parseAppsSnap(s2);
        const p3 = parseAppsSnap(s3);
        mergeAndSet([p1, p2, p3].filter(Boolean));
      } catch {
        // ignore
      }
    })();

    const live = { userId: null, uid: null, userUid: null };
    const applyLive = () => mergeAndSet([live.userId, live.uid, live.userUid].filter(Boolean));

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

    const unsub2 = onSnapshot(
      qAppsUid,
      (snap) => {
        live.uid = parseAppsSnap(snap);
        applyLive();
      },
      () => {
        live.uid = null;
        applyLive();
      }
    );

    const unsub3 = onSnapshot(
      qAppsUserUid,
      (snap) => {
        live.userUid = parseAppsSnap(snap);
        applyLive();
      },
      () => {
        live.userUid = null;
        applyLive();
      }
    );

    return () => {
      cancelled = true;
      try {
        unsub1();
      } catch {
        // noop
      }
      try {
        unsub2();
      } catch {
        // noop
      }
      try {
        unsub3();
      } catch {
        // noop
      }
    };
  }, [effectiveUid]);

  const requireProfile = () => {
    setProfileGateNotice(profileGateBody);
    try {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // noop
    }
  };

  useEffect(() => {
    const st = location?.state && typeof location.state === 'object' ? location.state : null;
    if (!st?.profileGate) return;
    requireProfile();
    // Not: state'i burada temizlemiyoruz; sadece best-effort uyarı göster.
    // Aksi halde history replace karmaşıklaşabiliyor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state]);

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
    setCompleteProfileGateOpen(true);
    try {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // noop
    }
  };

  const dismissCompleteProfileGate = () => setCompleteProfileGateOpen(false);

  const dismissOptionalDetailsPrompt = () => setOptionalDetailsPromptOpen(false);

  const startCompleteProfileGate = () => {
    dismissCompleteProfileGate();
    goToProfileCompletionTarget();
  };

  const goToOptionalDetailsTarget = () => {
    dismissOptionalDetailsPrompt();
    try {
      navigate('/evlilik/eslestirme-basvuru?w=1', {
        replace: false,
        state: {
          returnTo: `${location.pathname || '/app/pool'}${location.search || ''}`,
          startStep: 1,
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
      if (msg === 'profile_incomplete' || msg === 'application_not_found' || msg === 'application_required') openCompleteProfileGate();
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

    if (!autoRefreshEnabled) {
      return () => {
        cancelledRef.current = true;
      };
    }

    const id = setInterval(() => {
      load({ silent: true });
    }, 20000);

    return () => {
      cancelledRef.current = true;
      try {
        clearInterval(id);
      } catch {
        // noop
      }
    };
  }, [autoRefreshEnabled, load]);

  const headerHint = useMemo(() => {
    // Yaş filtresi kaldırıldı; header'da yaş aralığı göstermiyoruz.
    return '';
  }, []);

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
            type: 'pre_match',
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
      if (msg === 'profile_incomplete' || msg === 'application_not_found' || msg === 'application_required') {
        openCompleteProfileGate();
        return;
      }
      setState((s) => ({ ...s, error: translateStudioApiError(t, msg) || msg }));
    }
  };

  const pendingAccessCount = useMemo(() => {
    const list = Array.isArray(inboxAccess) ? inboxAccess : [];
    if (myLock?.active) return 0;
    return list.filter((x) => safeStr(x?.status) === 'pending').length;
  }, [inboxAccess, myLock?.active]);

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
                  if (interactionLocked) {
                    openCompleteProfileGate();
                    return;
                  }
                  setInboxModal({ open: true });
                }}
                className="app-btn w-full sm:w-auto"
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
                className="app-btn w-full sm:w-auto"
                onClick={(e) => {
                  if (isPreview) {
                    e.preventDefault();
                    openPreviewGate({ reason: t('previewGate.body') });
                    return;
                  }
                  if (interactionLocked) {
                    e.preventDefault();
                    openCompleteProfileGate();
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
            <p className="mt-1 text-xs text-slate-500">{t('studio.pool.countHint', { total: meta.total, shown: items.length })}</p>
          ) : null}

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-slate-700">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{t('studio.pool.trust.title')}</p>
                <p className="mt-1 text-sm text-slate-700 whitespace-pre-line">{t('studio.pool.trust.body')}</p>
                <p className="mt-2 text-xs text-slate-500">{t('studio.pool.trust.sortNote')}</p>
              </div>
            </div>
          </div>

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
                  {t('studio.profile.completeProfileTutorial.title', { defaultValue: isTr ? 'Profilini tamamla' : 'Complete your profile' })}
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
                  debug: hasApp={String(myHasAnyApplication)} hasPhoto={String(myHasAnyPhoto)} profileComplete={String(myProfileComplete)} needsApplication={String(needsApplication)}
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

          {!state.loading && !state.error && items.length === 0 ? (
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
              {!needsApplication && myProfileComplete !== false ? (
                <div className="mt-4">
                  <PwaInstallCard variant="light" />
                </div>
              ) : null}
            </div>
          ) : null}

          {myPhotosBlurred ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <div className="text-sm font-semibold">{t('studio.match.photos.reciprocityHint')}</div>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => {
              const p = it?.profile && typeof it.profile === 'object' ? it.profile : {};
              const targetUid = safeStr(it?.uid);
              const createdAtMs = typeof it?.createdAtMs === 'number' && Number.isFinite(it.createdAtMs) ? it.createdAtMs : 0;
              const isNewUser = createdAtMs > 0 && Date.now() - createdAtMs <= NEW_USER_BADGE_WINDOW_MS;
              const isVerified = p?.identityVerified === true;
              const out = targetUid ? outboxMap?.[targetUid] : null;
              const pending = safeStr(out?.status) === 'pending';
              const approved = safeStr(out?.status) === 'approved';
              const approvedMatchId = safeStr(out?.matchId);
              const name = safeStr(p?.username) || t('studio.common.profile');
              const age = typeof p?.age === 'number' ? `, ${p.age}` : '';
              const userCode = safeStr(p?.userCode);
              const city = safeStr(p?.city);
              const marital = safeStr(p?.details?.maritalStatus);
              const occupation = safeStr(p?.details?.occupation);
              const genderText = genderLabel(t, p?.gender);
              const maritalText = maritalStatusLabel(t, marital);
              const about = clip(p?.about, 180);
              const exp = clip(p?.expectations, 180);
              const isUnknown = p?.profileIncomplete === true;
              const photos = Array.isArray(p?.photoUrls) ? p.photoUrls.map(safeStr).filter(Boolean) : [];
              const photo = photos.length ? photos[0] : '';
              const canSeePhotos = !myPhotosBlurred;

              return (
                <div key={safeStr(it?.uid) || safeStr(it?.applicationId)} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
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

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-lg font-semibold">{name}{age}</p>
                      <div className="flex flex-wrap items-center gap-1">
                        {isNewUser ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 border border-emerald-200">
                            {t('memberFeed.badge.newUser')}
                          </span>
                        ) : null}
                      </div>
                    </div>

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

                    {/* Presence/last-seen UI is temporarily disabled until we reach enough users. */}
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      {genderText ? <p>{genderText}</p> : null}
                      {maritalText ? <p>{maritalText}</p> : null}
                      {city ? <p>{city}</p> : null}
                      {occupation ? <p>{occupation}</p> : null}
                    </div>

                    {about || exp ? (
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        {about ? <p><span className="font-semibold">{t('studio.myInfo.fields.about')}:</span> {about}</p> : null}
                        {exp ? <p><span className="font-semibold">{t('studio.myInfo.fields.expectations')}:</span> {exp}</p> : null}
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
            })}
          </div>

          <StudioInboxModal
            open={!!inboxModal?.open}
            onClose={() => setInboxModal({ open: false })}
            title={t('studio.inbox.modalTitleRequests')}
            items={myLock?.active ? [] : inboxAccess}
            mode="requests"
            onMarkRead={markInboxMessageRead}
            onApprove={({ fromUid }) => respondAccessRequest({ fromUid, decision: 'approve' })}
            onReject={({ fromUid }) => respondAccessRequest({ fromUid, decision: 'reject' })}
            actionsDisabled={interactionLocked}
            onRequireProfile={() => {
              requireProfile();
            }}
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
        </div>
      </main>

      <StudioBottomNav />
    </div>
  );
}
