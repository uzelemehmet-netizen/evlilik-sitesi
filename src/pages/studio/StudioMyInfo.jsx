import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, getDocs, limit, onSnapshot, query, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { useAuth } from '../../auth/AuthProvider';
import { db } from '../../config/firebase';

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

function Field({ label, value }) {
  const v = value === null || value === undefined ? '' : String(value).trim();
  if (!v) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="mt-1 text-sm text-slate-900 break-words">{v}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function safeJson(v) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return '';
  }
}

export default function StudioMyInfo() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const uid = String(user?.uid || '').trim();

  const [mmUser, setMmUser] = useState(null);
  const [latestApp, setLatestApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appLoading, setAppLoading] = useState(true);

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

  const info = useMemo(() => {
    const application = mmUser?.application && typeof mmUser.application === 'object' ? mmUser.application : null;
    const publicProfile = mmUser?.publicProfile && typeof mmUser.publicProfile === 'object' ? mmUser.publicProfile : null;
    const membership = mmUser?.membership && typeof mmUser.membership === 'object' ? mmUser.membership : null;
    const identity = mmUser?.identityVerification && typeof mmUser.identityVerification === 'object' ? mmUser.identityVerification : null;

    const bestApp = application || latestApp || null;
    const details = bestApp?.details && typeof bestApp.details === 'object' ? bestApp.details : {};
    const partner = bestApp?.partnerPreferences && typeof bestApp.partnerPreferences === 'object' ? bestApp.partnerPreferences : {};
    const languages = details?.languages && typeof details.languages === 'object' ? details.languages : {};
    const nativeLang = languages?.native && typeof languages.native === 'object' ? languages.native : {};
    const foreignLang = languages?.foreign && typeof languages.foreign === 'object' ? languages.foreign : {};

    return {
      uid,
      profileCode: application?.profileCode || publicProfile?.profileCode || null,
      membership,
      identityVerified: !!mmUser?.identityVerified,
      identityVerification: identity,
      application,
      latestApp,
      bestApp,
      details,
      partner,
      nativeLang,
      foreignLang,
      publicProfile,
      updatedAt: mmUser?.updatedAt || null,
    };
  }, [latestApp, mmUser, uid]);

  const genderLabel = useMemo(() => {
    const g = safeStr(info.bestApp?.gender || info.publicProfile?.gender);
    if (!g) return '';
    if (g === 'male') return t('matchmakingPage.form.options.gender.male');
    if (g === 'female') return t('matchmakingPage.form.options.gender.female');
    return g;
  }, [info.bestApp?.gender, info.publicProfile?.gender, t]);

  const maritalStatusLabel = useMemo(() => {
    const v = safeStr(info.details?.maritalStatus);
    if (!v) return '';
    const map = {
      single: 'matchmakingPage.form.options.maritalStatus.single',
      widowed: 'matchmakingPage.form.options.maritalStatus.widowed',
      divorced: 'matchmakingPage.form.options.maritalStatus.divorced',
      other: 'matchmakingPage.form.options.maritalStatus.other',
      doesnt_matter: 'matchmakingPage.form.options.maritalStatus.doesnt_matter',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.details?.maritalStatus, t]);

  const partnerMaritalStatusLabel = useMemo(() => {
    const v = safeStr(info.partner?.maritalStatus);
    if (!v) return '';
    const map = {
      single: 'matchmakingPage.form.options.maritalStatus.single',
      widowed: 'matchmakingPage.form.options.maritalStatus.widowed',
      divorced: 'matchmakingPage.form.options.maritalStatus.divorced',
      other: 'matchmakingPage.form.options.maritalStatus.other',
      doesnt_matter: 'matchmakingPage.form.options.maritalStatus.doesnt_matter',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.partner?.maritalStatus, t]);

  const nationalityLabel = useMemo(() => {
    const v = safeStr(info.bestApp?.nationality || info.publicProfile?.nationality);
    if (!v) return '';
    const map = {
      tr: 'matchmakingPage.form.options.nationality.tr',
      id: 'matchmakingPage.form.options.nationality.id',
      other: 'matchmakingPage.form.options.nationality.other',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.bestApp?.nationality, info.publicProfile?.nationality, t]);

  const lookingForNationalityLabel = useMemo(() => {
    const v = safeStr(info.bestApp?.lookingForNationality);
    if (!v) return '';
    const map = {
      tr: 'matchmakingPage.form.options.nationality.tr',
      id: 'matchmakingPage.form.options.nationality.id',
      other: 'matchmakingPage.form.options.nationality.other',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.bestApp?.lookingForNationality, t]);

  const lookingForGenderLabel = useMemo(() => {
    const v = safeStr(info.bestApp?.lookingForGender);
    if (!v) return '';
    const map = {
      male: 'matchmakingPage.form.options.gender.male',
      female: 'matchmakingPage.form.options.gender.female',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.bestApp?.lookingForGender, t]);

  const hasChildrenLabel = useMemo(() => {
    const v = safeStr(info.details?.hasChildren);
    if (!v) return '';
    const map = {
      yes: 'matchmakingPage.form.options.common.yes',
      no: 'matchmakingPage.form.options.common.no',
      unsure: 'matchmakingPage.form.options.common.unsure',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.details?.hasChildren, t]);

  const religionLabel = useMemo(() => {
    const v = safeStr(info.details?.religion);
    if (!v) return '';
    const map = {
      islam: 'matchmakingPage.form.options.religion.islam',
      christian: 'matchmakingPage.form.options.religion.christian',
      hindu: 'matchmakingPage.form.options.religion.hindu',
      buddhist: 'matchmakingPage.form.options.religion.buddhist',
      other: 'matchmakingPage.form.options.religion.other',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.details?.religion, t]);

  const partnerReligionLabel = useMemo(() => {
    const v = safeStr(info.partner?.religion);
    if (!v) return '';
    const map = {
      islam: 'matchmakingPage.form.options.religion.islam',
      christian: 'matchmakingPage.form.options.religion.christian',
      hindu: 'matchmakingPage.form.options.religion.hindu',
      buddhist: 'matchmakingPage.form.options.religion.buddhist',
      other: 'matchmakingPage.form.options.religion.other',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.partner?.religion, t]);

  const educationLabel = useMemo(() => {
    const v = safeStr(info.details?.education);
    if (!v) return '';
    const map = {
      secondary: 'matchmakingPage.form.options.education.secondary',
      high_school: 'matchmakingPage.form.options.education.highSchool',
      university: 'matchmakingPage.form.options.education.university',
      masters: 'matchmakingPage.form.options.education.masters',
      phd: 'matchmakingPage.form.options.education.phd',
      other: 'matchmakingPage.form.options.education.other',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.details?.education, t]);

  const partnerEducationLabel = useMemo(() => {
    const v = safeStr(info.partner?.educationPreference);
    if (!v) return '';
    const map = {
      secondary: 'matchmakingPage.form.options.education.secondary',
      university: 'matchmakingPage.form.options.education.university',
      masters: 'matchmakingPage.form.options.education.masters',
      phd: 'matchmakingPage.form.options.education.phd',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.partner?.educationPreference, t]);

  const occupationLabel = useMemo(() => {
    const v = safeStr(info.details?.occupation);
    if (!v) return '';
    const map = {
      civil_servant: 'matchmakingPage.form.options.occupation.civilServant',
      employee: 'matchmakingPage.form.options.occupation.employee',
      retired: 'matchmakingPage.form.options.occupation.retired',
      business_owner: 'matchmakingPage.form.options.occupation.businessOwner',
      other: 'matchmakingPage.form.options.occupation.other',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.details?.occupation, t]);

  const partnerOccupationLabel = useMemo(() => {
    const v = safeStr(info.partner?.occupationPreference);
    if (!v) return '';
    const map = {
      civil_servant: 'matchmakingPage.form.options.occupation.civilServant',
      employee: 'matchmakingPage.form.options.occupation.employee',
      retired: 'matchmakingPage.form.options.occupation.retired',
      business_owner: 'matchmakingPage.form.options.occupation.businessOwner',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.partner?.occupationPreference, t]);

  const incomeLabel = useMemo(() => {
    const v = safeStr(info.details?.incomeLevel);
    if (!v) return '';
    const map = {
      low: 'matchmakingPage.form.options.income.low',
      medium: 'matchmakingPage.form.options.income.medium',
      good: 'matchmakingPage.form.options.income.good',
      very_good: 'matchmakingPage.form.options.income.veryGood',
      prefer_not_to_say: 'matchmakingPage.form.options.income.preferNot',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.details?.incomeLevel, t]);

  const timelineLabel = useMemo(() => {
    const v = safeStr(info.details?.marriageTimeline);
    if (!v) return '';
    const map = {
      '0_3': 'matchmakingPage.form.options.timeline.0_3',
      '3_6': 'matchmakingPage.form.options.timeline.3_6',
      '6_12': 'matchmakingPage.form.options.timeline.6_12',
      '1_plus': 'matchmakingPage.form.options.timeline.1_plus',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.details?.marriageTimeline, t]);

  const partnerChildrenLabel = useMemo(() => {
    const v = safeStr(info.partner?.childrenPreference);
    if (!v) return '';
    const map = {
      want_children: 'matchmakingPage.form.options.partnerChildren.wantChildren',
      no_children: 'matchmakingPage.form.options.partnerChildren.noChildren',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.partner?.childrenPreference, t]);

  const partnerFamilyValuesLabel = useMemo(() => {
    const v = safeStr(info.partner?.familyValuesPreference);
    if (!v) return '';
    const map = {
      religious: 'matchmakingPage.form.options.familyValues.religious',
      liberal: 'matchmakingPage.form.options.familyValues.liberal',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.partner?.familyValuesPreference, t]);

  const partnerCommunicationMethodsLabel = useMemo(() => {
    const list = Array.isArray(info.partner?.communicationMethods) ? info.partner.communicationMethods : [];
    const mapped = list
      .map((x) => safeStr(x))
      .filter(Boolean)
      .map((x) => {
        if (x === 'own_language') return t('matchmakingPage.form.options.partnerCommunicationMethods.ownLanguage');
        if (x === 'foreign_language') return t('matchmakingPage.form.options.partnerCommunicationMethods.foreignLanguage');
        if (x === 'translation_app') return t('matchmakingPage.form.options.partnerCommunicationMethods.translationApp');
        return x;
      });
    return mapped.length ? mapped.join(', ') : '';
  }, [info.partner?.communicationMethods, t]);

  const livingCountryLabel = useMemo(() => {
    const v = safeStr(info.partner?.livingCountry);
    if (!v) return '';
    const map = {
      tr: 'matchmakingPage.form.options.livingCountry.tr',
      id: 'matchmakingPage.form.options.livingCountry.id',
      doesnt_matter: 'matchmakingPage.form.options.common.doesntMatter',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.partner?.livingCountry, t]);

  const commLanguageLabel = useMemo(() => {
    const v = safeStr(info.details?.communicationLanguage);
    if (!v) return '';
    const map = {
      tr: 'matchmakingPage.form.options.commLanguage.tr',
      id: 'matchmakingPage.form.options.commLanguage.id',
      en: 'matchmakingPage.form.options.commLanguage.en',
      translation_app: 'matchmakingPage.form.options.commLanguage.translationApp',
      other: 'matchmakingPage.form.options.commLanguage.other',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.details?.communicationLanguage, t]);

  const nativeLangLabel = useMemo(() => {
    const v = safeStr(info.nativeLang?.code);
    if (!v) return '';
    const map = {
      tr: 'matchmakingPage.form.options.commLanguage.tr',
      id: 'matchmakingPage.form.options.commLanguage.id',
      en: 'matchmakingPage.form.options.commLanguage.en',
      other: 'matchmakingPage.form.options.commLanguage.other',
    };
    return map[v] ? t(map[v]) : v;
  }, [info.nativeLang?.code, t]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div>
              <h1 className="text-xl font-bold">{t('studio.myInfo.title')}</h1>
              <p className="mt-1 text-sm text-slate-600">{t('studio.myInfo.subtitle')}</p>
            </div>
            <Link
              to="/profilim"
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              {t('studio.common.back')}
            </Link>
          </div>

          <div className="p-4">
            {loading ? (
              <p className="text-slate-600">{t('studio.common.loading')}</p>
            ) : !mmUser ? (
              <p className="text-slate-600">{t('studio.myInfo.noProfile')}</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">UID</p>
                  <p className="mt-1 text-sm text-slate-700 break-all">{uid}</p>
                </div>

                {!info.bestApp && !appLoading ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {t('studio.myInfo.appMissing')}
                  </div>
                ) : null}

                <Section title={t('studio.myInfo.sections.basic')}>
                  <Field label={t('studio.myInfo.fields.username')} value={info.bestApp?.username || info.publicProfile?.username || ''} />
                  <Field label={t('studio.myInfo.fields.fullName')} value={info.bestApp?.fullName || info.publicProfile?.fullName || ''} />
                  <Field label={t('studio.myInfo.fields.age')} value={info.bestApp?.age ?? info.publicProfile?.age ?? ''} />
                  <Field label={t('studio.myInfo.fields.gender')} value={genderLabel} />
                  <Field label={t('studio.myInfo.fields.city')} value={info.bestApp?.city || info.publicProfile?.city || ''} />
                  <Field label={t('studio.myInfo.fields.country')} value={info.bestApp?.country || info.publicProfile?.country || ''} />
                  <Field label={t('studio.myInfo.fields.nationality')} value={nationalityLabel} />
                </Section>

                <Section title={t('studio.myInfo.sections.contact')}>
                  <Field label={t('studio.myInfo.fields.whatsapp')} value={info.bestApp?.whatsapp || ''} />
                  <Field label={t('studio.myInfo.fields.email')} value={info.bestApp?.email || ''} />
                  <Field label={t('studio.myInfo.fields.instagram')} value={info.bestApp?.instagram || ''} />
                </Section>

                <Section title={t('studio.myInfo.sections.details')}>
                  <Field label={t('studio.myInfo.fields.heightCm')} value={info.details?.heightCm ?? ''} />
                  <Field label={t('studio.myInfo.fields.weightKg')} value={info.details?.weightKg ?? ''} />
                  <Field label={t('studio.myInfo.fields.occupation')} value={occupationLabel} />
                  <Field label={t('studio.myInfo.fields.education')} value={educationLabel} />
                  <Field label={t('studio.myInfo.fields.educationDepartment')} value={info.details?.educationDepartment || ''} />
                  <Field label={t('studio.myInfo.fields.maritalStatus')} value={maritalStatusLabel} />
                  <Field label={t('studio.myInfo.fields.hasChildren')} value={hasChildrenLabel} />
                  <Field label={t('studio.myInfo.fields.childrenCount')} value={info.details?.childrenCount ?? ''} />
                  <Field label={t('studio.myInfo.fields.familyApprovalStatus')} value={info.details?.familyApprovalStatus || ''} />
                  <Field label={t('studio.myInfo.fields.religion')} value={religionLabel} />
                  <Field label={t('studio.myInfo.fields.religiousValues')} value={info.details?.religiousValues || ''} />
                  <Field label={t('studio.myInfo.fields.incomeLevel')} value={incomeLabel} />
                  <Field label={t('studio.myInfo.fields.marriageTimeline')} value={timelineLabel} />
                  <Field label={t('studio.myInfo.fields.relocationWillingness')} value={info.details?.relocationWillingness || ''} />
                  <Field label={t('studio.myInfo.fields.preferredLivingCountry')} value={info.details?.preferredLivingCountry || ''} />
                  <Field label={t('studio.myInfo.fields.communicationLanguage')} value={commLanguageLabel} />
                  <Field label={t('studio.myInfo.fields.communicationLanguageOther')} value={info.details?.communicationLanguageOther || ''} />
                  <Field label={t('studio.myInfo.fields.smoking')} value={info.details?.smoking || ''} />
                  <Field label={t('studio.myInfo.fields.alcohol')} value={info.details?.alcohol || ''} />
                  <Field label={t('studio.myInfo.fields.nativeLanguage')} value={nativeLangLabel} />
                  <Field label={t('studio.myInfo.fields.nativeLanguageOther')} value={info.nativeLang?.other || ''} />
                  <Field
                    label={t('studio.myInfo.fields.foreignLanguages')}
                    value={Array.isArray(info.foreignLang?.codes) ? info.foreignLang.codes.filter(Boolean).join(', ') : ''}
                  />
                  <Field label={t('studio.myInfo.fields.foreignLanguageOther')} value={info.foreignLang?.other || ''} />
                </Section>

                <Section title={t('studio.myInfo.sections.partner')}>
                  <Field label={t('studio.myInfo.fields.lookingForGender')} value={lookingForGenderLabel} />
                  <Field label={t('studio.myInfo.fields.lookingForNationality')} value={lookingForNationalityLabel} />
                  <Field label={t('studio.myInfo.fields.partnerAgeMin')} value={info.partner?.ageMin ?? ''} />
                  <Field label={t('studio.myInfo.fields.partnerAgeMax')} value={info.partner?.ageMax ?? ''} />
                  <Field label={t('studio.myInfo.fields.partnerHeightMinCm')} value={info.partner?.heightMinCm ?? ''} />
                  <Field label={t('studio.myInfo.fields.partnerHeightMaxCm')} value={info.partner?.heightMaxCm ?? ''} />
                  <Field label={t('studio.myInfo.fields.partnerMaritalStatus')} value={partnerMaritalStatusLabel} />
                  <Field label={t('studio.myInfo.fields.partnerReligion')} value={partnerReligionLabel} />
                  <Field label={t('studio.myInfo.fields.partnerCommunicationMethods')} value={partnerCommunicationMethodsLabel} />
                  <Field label={t('studio.myInfo.fields.partnerLivingCountry')} value={livingCountryLabel} />
                  <Field label={t('studio.myInfo.fields.partnerSmokingPreference')} value={info.partner?.smokingPreference || ''} />
                  <Field label={t('studio.myInfo.fields.partnerAlcoholPreference')} value={info.partner?.alcoholPreference || ''} />
                  <Field label={t('studio.myInfo.fields.partnerChildrenPreference')} value={partnerChildrenLabel} />
                  <Field label={t('studio.myInfo.fields.partnerEducationPreference')} value={partnerEducationLabel} />
                  <Field label={t('studio.myInfo.fields.partnerOccupationPreference')} value={partnerOccupationLabel} />
                  <Field label={t('studio.myInfo.fields.partnerFamilyValuesPreference')} value={partnerFamilyValuesLabel} />
                </Section>

                <Section title={t('studio.myInfo.sections.about')}>
                  <Field label={t('studio.myInfo.fields.about')} value={info.bestApp?.about || ''} />
                  <Field label={t('studio.myInfo.fields.expectations')} value={info.bestApp?.expectations || ''} />
                </Section>

                <Section title={t('studio.myInfo.sections.membership')}>
                  <Field label={t('studio.myInfo.fields.membershipPlan')} value={info.membership?.plan || ''} />
                  <Field label={t('studio.myInfo.fields.membershipActive')} value={info.membership?.active ? t('matchmakingPage.form.options.common.yes') : ''} />
                  <Field
                    label={t('studio.myInfo.fields.membershipValidUntil')}
                    value={
                      typeof info.membership?.validUntilMs === 'number' && info.membership.validUntilMs
                        ? new Date(info.membership.validUntilMs).toLocaleString(i18n.language || 'tr')
                        : ''
                    }
                  />
                  <Field label={t('studio.myInfo.fields.identityVerified')} value={info.identityVerified ? t('matchmakingPage.form.options.common.yes') : ''} />
                  <Field label={t('studio.myInfo.fields.identityStatus')} value={info.identityVerification?.status || ''} />
                  <Field label={t('studio.myInfo.fields.identityMethod')} value={info.identityVerification?.method || ''} />
                  <Field label={t('studio.myInfo.fields.identityRef')} value={info.identityVerification?.referenceCode || ''} />
                </Section>

                <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-900">{t('studio.myInfo.developerView')}</summary>
                  <p className="mt-2 text-xs text-slate-600">{t('studio.myInfo.developerHint')}</p>
                  <pre className="mt-2 max-h-[520px] overflow-auto rounded-md border border-slate-200 bg-white p-3 text-xs text-slate-800">
                    {safeJson(info)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
