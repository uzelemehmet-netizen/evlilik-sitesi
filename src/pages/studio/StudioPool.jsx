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

const NEW_USER_BADGE_WINDOW_MS = 48 * 60 * 60 * 1000;

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

function isMinimumProfileCompleteFromUserDoc(d) {
  const userDoc = d && typeof d === 'object' ? d : {};
  const appFromUser = userDoc?.application && typeof userDoc.application === 'object' ? userDoc.application : null;
  const publicProfile = userDoc?.publicProfile && typeof userDoc.publicProfile === 'object' ? userDoc.publicProfile : null;
  const merged = {
    ...(publicProfile || {}),
    ...(appFromUser || {}),
    ...(userDoc || {}),
    details: {
      ...((publicProfile && typeof publicProfile.details === 'object' ? publicProfile.details : {}) || {}),
      ...((appFromUser && typeof appFromUser.details === 'object' ? appFromUser.details : {}) || {}),
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

function formatPresenceLabel(t, lastSeenAtMs) {
  const ms = typeof lastSeenAtMs === 'number' && Number.isFinite(lastSeenAtMs) ? lastSeenAtMs : 0;
  if (!ms) return '';

  const nowMs = Date.now();
  const diffMs = Math.max(0, nowMs - ms);
  const onlineWindowMs = 5 * 60 * 1000;

  if (diffMs <= onlineWindowMs) return t('studio.presence.online');

  const minutes = Math.round(diffMs / (60 * 1000));
  if (minutes < 60) return t('studio.presence.lastSeenMinutes', { count: minutes });

  const hours = Math.round(diffMs / (60 * 60 * 1000));
  if (hours < 24) return t('studio.presence.lastSeenHours', { count: hours });

  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  return t('studio.presence.lastSeenDays', { count: days });
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
  const [grantedMap, setGrantedMap] = useState({});
  const [requestingUid, setRequestingUid] = useState('');

  const [inboxAccess, setInboxAccess] = useState([]);
  const [accessAction, setAccessAction] = useState({ loadingId: '', error: '' });

  const [inboxModal, setInboxModal] = useState({ open: false });
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0, title: '' });

  const [myLock, setMyLock] = useState({ active: false, matchId: '' });
  const [myMembership, setMyMembership] = useState({ active: false });
  const [myGender, setMyGender] = useState('');
  const [myPhotosBlurred, setMyPhotosBlurred] = useState(false);
  const [paywallNotice, setPaywallNotice] = useState('');
  const [profileGateNotice, setProfileGateNotice] = useState('');
  const [myProfileComplete, setMyProfileComplete] = useState(true);
  const [myHasAnyPhoto, setMyHasAnyPhoto] = useState(null); // null=unknown
  const [myHasAnyApplication, setMyHasAnyApplication] = useState(null); // null=unknown

  const [completeProfileGateOpen, setCompleteProfileGateOpen] = useState(false);

  const redirectedToApplyRef = useRef(false);

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

  // Başvuru formu doldurulmadıysa Keşfet'i hiç gösterme.
  // Not: Bu sekme bazı akışlarda route-level gate'ten geçmeden açılabiliyor; burada ekstra güvenlik katmanı.
  useEffect(() => {
    if (redirectedToApplyRef.current) return;
    if (isPreview) return;

    // `needsApplication` backend'e göre profil/about yoksa true olabilir.
    // `myProfileComplete` ise matchmakingUsers cache'inden about metni var mı kontrolü.
    if (needsApplication || myProfileComplete === false) {
      redirectedToApplyRef.current = true;
      const from = `${location?.pathname || ''}${location?.search || ''}`;
      navigate('/evlilik/eslestirme-basvuru?w=1', {
        replace: true,
        state: { profileGate: true, from },
      });
    }
  }, [isPreview, needsApplication, myProfileComplete, navigate, location?.pathname, location?.search]);

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
        let count = 0;
        let hasPhoto = false;
        snap.forEach((d) => {
          count += 1;
          if (hasPhoto) return;
          const data = typeof d?.data === 'function' ? d.data() || {} : d?.data || {};
          const urls = Array.isArray(data?.photoUrls) ? data.photoUrls : [];
          if (urls.some((u) => safeStr(u))) hasPhoto = true;
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

  const requireProfile = () => {
    setProfileGateNotice(t('studio.profileGate.body'));
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

  const goToProfileForm = () => {
    try {
      navigate('/evlilik/eslestirme-basvuru?w=1', { replace: false });
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

  const startCompleteProfileGate = () => {
    dismissCompleteProfileGate();
    const mustApply = needsApplication || myHasAnyApplication === false;
    const to = mustApply ? '/evlilik/eslestirme-basvuru?w=1' : '/evlilik/eslestirme-basvurusu?editOnce=1&w=1';
    const state = mustApply
      ? { afterSubmitOpenPhotoManager: true }
      : {
          returnTo: '/profilim',
          afterSaveOpenPhotoManager: true,
        };

    try {
      navigate(to, { replace: false, state });
    } catch {
      // fallback
      try {
        window.location.href = to;
      } catch {
        // noop
      }
    }
  };

  const profileFormTo = needsApplication ? '/evlilik/eslestirme-basvuru?w=1' : '/evlilik/eslestirme-basvurusu?editOnce=1&w=1';

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

    if (needsApplication || myProfileComplete === false || myHasAnyPhoto === false) {
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
  }, [meta, t]);

  const requestAccess = async ({ targetUid } = {}) => {
    if (isPreview) {
      openPreviewGate({ reason: t('previewGate.body') });
      return;
    }

    const uid = effectiveUid;
    const toUid = safeStr(targetUid);
    if (!uid || !toUid || requestingUid) return;

    if (needsApplication || myProfileComplete === false || myHasAnyPhoto === false) {
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
                  if (needsApplication) requireProfile();
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
                {t('studio.profile.completeProfileTutorial.body', {
                  defaultValue: isTr
                    ? 'Ön eşleşme için profilini tamamlayıp en az 1 fotoğraf yüklemelisin.'
                    : 'To use pre-match, please complete your profile and upload at least 1 photo.',
                })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={startCompleteProfileGate} className="app-btn app-btn-primary">
                  {t('studio.profile.completeProfileTutorial.actions.ok', { defaultValue: isTr ? 'Tamam' : 'Continue' })}
                </button>
                <button type="button" onClick={dismissCompleteProfileGate} className="app-btn app-btn-outline">
                  {t('studio.profile.completeProfileTutorial.actions.later', { defaultValue: isTr ? 'Daha sonra' : 'Not now' })}
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
                <Link to={profileFormTo} className="text-sm font-semibold underline">
                  {t('studio.profileGate.cta')}
                </Link>
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
              <div className="mt-4">
                <PwaInstallCard variant="light" />
              </div>
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
            actionsDisabled={needsApplication}
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
