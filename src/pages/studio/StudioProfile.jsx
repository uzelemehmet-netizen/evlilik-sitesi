import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { collection, doc, getDocs, limit, onSnapshot, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Edit, LogOut, MessageCircle, ShieldCheck, Star, Trash2, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useAuth } from '../../auth/AuthProvider';
import { auth, db } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';
import { uploadImageToCloudinaryAuto } from '../../utils/cloudinaryUpload';
import { translateStudioApiError } from '../../utils/studioErrorI18n';

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


  const uid = String(user?.uid || '').trim();

  const [mmUser, setMmUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [applyBannerOpen, setApplyBannerOpen] = useState(true);

  const [latestApp, setLatestApp] = useState(null);
  const [appLoading, setAppLoading] = useState(true);

  const [deleteState, setDeleteState] = useState({ loading: false, error: '' });
  const [membershipAction, setMembershipAction] = useState({ loading: false, error: '', success: '' });

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    idType: 'tc_id',
    idFront: null,
    idBack: null,
    selfie: null,
  });
  const [verifyAction, setVerifyAction] = useState({ loading: false, error: '', success: '' });

  const [textDraft, setTextDraft] = useState({ about: '', expectations: '' });
  const [textTouched, setTextTouched] = useState(false);
  const [textSaveState, setTextSaveState] = useState({ loading: false, error: '', success: '' });

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
    if (!uid) return;
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
      } catch (e) {
        console.warn('matchmakingApplications read failed:', e);
        setLatestApp(null);
      } finally {
        if (!cancelled) setAppLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

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

  const closeVerifyModal = () => {
    if (verifyAction.loading) return;
    setVerifyAction({ loading: false, error: '', success: '' });
    setVerifyModalOpen(false);
  };

  const deleteAccount = async () => {
    if (deleteState.loading) return;

    const ok = typeof window !== 'undefined' ? window.confirm(t('studio.profile.confirmDelete')) : true;
    if (!ok) return;

    setDeleteState({ loading: true, error: '' });
    try {
      await authFetch('/api/matchmaking-account-delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      setDeleteState({ loading: false, error: '' });
      navigate('/');
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setDeleteState({ loading: false, error: translateStudioApiError(t, msg) || msg || 'account_delete_failed' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Banner */}
          <div className="relative h-44 w-full bg-slate-200">
            <img
              src="https://picsum.photos/seed/header/1400/360"
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
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
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
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/evlilik/eslestirme-basvurusu?editOnce=1"
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t('studio.profile.editProfile')}
                </Link>

                <Link
                  to="/profilim/destek"
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t('studio.feedback.nav')}
                </Link>

                <Link
                  to="/app/matches"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  {t('studio.profile.myMatches')}
                </Link>

                <button
                  type="button"
                  onClick={logoutNow}
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  title={t('studio.profile.logout')}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('studio.profile.logout')}
                </button>
              </div>
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

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    to="/app/pool"
                    className="inline-flex items-center justify-center rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400"
                  >
                    {t('studio.profile.applySuccess.ctas.pool')}
                  </Link>
                  <Link
                    to="/app/matches"
                    className="inline-flex items-center justify-center rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-amber-50"
                  >
                    {t('studio.profile.applySuccess.ctas.matches')}
                  </Link>
                  <Link
                    to="/evlilik/uniqah"
                    className="inline-flex items-center justify-center rounded-md border border-amber-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-amber-50"
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
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
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

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
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
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500"
                    title={t('studio.profile.buySoon')}
                  >
                    {t('studio.profile.buySoon')}
                  </button>

                  <button
                    type="button"
                    onClick={activateFreeMembership}
                    disabled={membershipAction.loading}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
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
                </div>

                <div className="mt-3">
                  <Link
                    to="/profilim/bilgilerim"
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    {t('studio.profile.myInfo')}
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
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
                  <p className="mt-2 text-sm text-slate-600">
                    {t('studio.profile.identityHelp')}
                  </p>
                )}

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyAction({ loading: false, error: '', success: '' });
                      setVerifyModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {t('studio.profile.verifyNow')}
                  </button>
                </div>
              </div>

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

            {/* Geçiş/fallback */}
            <div className="mt-8 flex flex-col gap-2 text-sm">
              <Link to="/profilim-eski" className="font-semibold text-slate-600 hover:underline">
                {t('studio.profile.oldPanel')}
              </Link>
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
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="block text-sm font-semibold text-slate-800">{t('studio.profile.idFront')}</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setVerifyForm((p) => ({ ...p, idFront: e.target.files?.[0] || null }))}
                          className="mt-1 block w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-800">{t('studio.profile.idBack')}</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setVerifyForm((p) => ({ ...p, idBack: e.target.files?.[0] || null }))}
                          className="mt-1 block w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-800">{t('studio.profile.selfie')}</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setVerifyForm((p) => ({ ...p, selfie: e.target.files?.[0] || null }))}
                          className="mt-1 block w-full text-sm"
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

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={closeVerifyModal}
                        disabled={verifyAction.loading}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {t('studio.common.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={submitManualVerification}
                        disabled={verifyAction.loading}
                        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {verifyAction.loading ? t('studio.common.loading') : t('studio.profile.submitVerification')}
                      </button>
                    </div>
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
