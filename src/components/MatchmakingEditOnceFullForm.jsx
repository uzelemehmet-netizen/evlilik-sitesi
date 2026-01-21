import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

function toNumberOrNull(value) {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export default function MatchmakingEditOnceFullForm({
  value,
  setValue,
  onUploadPhoto,
  photoUpload,
  onSubmit,
  submitting,
  consents,
  disableConsents = true,
}) {
  const { t, i18n } = useTranslation();

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

  const onChange = (key) => (e) => {
    const next = e?.target?.type === 'checkbox' ? !!e.target.checked : e.target.value;
    setValue((prev) => ({ ...prev, [key]: next }));
  };

  const onDetailsChange = (key) => (e) => {
    const next = e?.target?.type === 'checkbox' ? !!e.target.checked : e.target.value;
    setValue((prev) => ({ ...prev, details: { ...(prev.details || {}), [key]: next } }));
  };

  const onPartnerChange = (key) => (e) => {
    const next = e?.target?.type === 'checkbox' ? !!e.target.checked : e.target.value;
    setValue((prev) => ({
      ...prev,
      partnerPreferences: { ...(prev.partnerPreferences || {}), [key]: next },
    }));
  };

  const onNativeLanguageChange = (e) => {
    const next = e?.target?.value || '';
    setValue((prev) => {
      const details = prev.details || {};
      const languages = details.languages || {};
      const native = languages.native || {};
      const foreign = languages.foreign || {};
      const foreignCodes = Array.isArray(foreign.codes) ? foreign.codes : [];
      const nextForeignCodes = foreignCodes.filter((code) => code && code !== next);
      const keepForeignOther = nextForeignCodes.includes('other');

      return {
        ...prev,
        details: {
          ...details,
          languages: {
            ...languages,
            native: {
              ...native,
              code: next,
              other: next === 'other' ? String(native.other || '') : '',
            },
            foreign: {
              ...foreign,
              codes: nextForeignCodes,
              other: keepForeignOther ? String(foreign.other || '') : '',
            },
          },
        },
      };
    });
  };

  const toggleForeignLanguage = (code) => () => {
    setValue((prev) => {
      const details = prev.details || {};
      const languages = details.languages || {};
      const foreign = languages.foreign || {};
      const list = Array.isArray(foreign.codes) ? foreign.codes : [];
      const exists = list.includes(code);

      let next = exists ? list.filter((x) => x !== code) : [...list, code];
      if (code !== 'none' && next.includes('none')) next = next.filter((x) => x !== 'none');

      return {
        ...prev,
        details: {
          ...details,
          languages: {
            ...languages,
            foreign: {
              ...foreign,
              codes: next,
              other: next.includes('other') ? String(foreign.other || '') : '',
            },
          },
        },
      };
    });
  };

  const onForeignLanguageOtherChange = (e) => {
    const next = e?.target?.value ?? '';
    setValue((prev) => {
      const details = prev.details || {};
      const languages = details.languages || {};
      const foreign = languages.foreign || {};
      return {
        ...prev,
        details: {
          ...details,
          languages: {
            ...languages,
            foreign: {
              ...foreign,
              other: next,
            },
          },
        },
      };
    });
  };

  const onNativeLanguageOtherChange = (e) => {
    const next = e?.target?.value ?? '';
    setValue((prev) => {
      const details = prev.details || {};
      const languages = details.languages || {};
      const native = languages.native || {};
      return {
        ...prev,
        details: {
          ...details,
          languages: {
            ...languages,
            native: {
              ...native,
              other: next,
            },
          },
        },
      };
    });
  };

  const onPartnerTranslationAppChange = (e) => {
    const next = e?.target?.value || '';
    setValue((prev) => {
      const p = prev.partnerPreferences || {};
      return {
        ...prev,
        partnerPreferences: {
          ...p,
          translationAppPreference: next,
          canCommunicateWithTranslationApp: next === 'yes',
        },
      };
    });
  };

  const ageNum = toNumberOrNull(value?.age);
  const older = toNumberOrNull(value?.partnerPreferences?.ageMaxOlderYears);
  const younger = toNumberOrNull(value?.partnerPreferences?.ageMaxYoungerYears);

  const partnerAgeMinForUi = ageNum !== null && younger !== null ? Math.max(18, ageNum - younger) : null;
  const partnerAgeMaxForUi = ageNum !== null && older !== null ? Math.min(99, ageNum + older) : null;

  const nativeCode = String(value?.details?.languages?.native?.code || '');
  const foreignCodes = Array.isArray(value?.details?.languages?.foreign?.codes)
    ? value.details.languages.foreign.codes
    : [];

  const communicationLang = String(value?.details?.communicationLanguage || '');
  const partnerCommLang = String(value?.partnerPreferences?.communicationLanguage || '');

  const partnerHeightMin = String(value?.partnerPreferences?.heightMinCm ?? '');
  const partnerHeightMax = String(value?.partnerPreferences?.heightMaxCm ?? '');

  const photoUrls = Array.isArray(value?.photoUrls) ? value.photoUrls : [];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="mt-4"
    >
      <p className="text-xs text-white/70">Not: Gönderdiğinde tekrar düzenleyemezsin.</p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.fullName')}</label>
          <input
            value={value?.fullName || ''}
            onChange={onChange('fullName')}
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.age')}</label>
          <input
            value={value?.age || ''}
            onChange={onChange('age')}
            inputMode="numeric"
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.city')}</label>
          <input
            value={value?.city || ''}
            onChange={onChange('city')}
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.country')}</label>
          <input
            value={value?.country || ''}
            onChange={onChange('country')}
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.whatsapp')}</label>
          <input
            value={value?.whatsapp || ''}
            onChange={onChange('whatsapp')}
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.email')}</label>
          <input
            value={value?.email || ''}
            onChange={onChange('email')}
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.instagram')}</label>
          <input
            value={value?.instagram || ''}
            onChange={onChange('instagram')}
            className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-white/10">
        <p className="text-sm font-semibold text-white">{t('matchmakingPage.form.sections.me')}</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.nationality')}</label>
            <select
              value={value?.nationality || ''}
              onChange={onChange('nationality')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {nationalityOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.gender')}</label>
            <select
              value={value?.gender || ''}
              onChange={onChange('gender')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {genderOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-white/10">
        <p className="text-sm font-semibold text-white">{t('matchmakingPage.form.sections.lookingFor')}</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.lookingForNationality')}</label>
            <select
              value={value?.lookingForNationality || ''}
              onChange={onChange('lookingForNationality')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {nationalityOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.lookingForGender')}</label>
            <select
              value={value?.lookingForGender || ''}
              onChange={onChange('lookingForGender')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {genderOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-white/10">
        <p className="text-sm font-semibold text-white">{t('matchmakingPage.form.sections.details')}</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.height')}</label>
            <input
              value={value?.details?.heightCm || ''}
              onChange={onDetailsChange('heightCm')}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder={t('matchmakingPage.form.placeholders.height')}
            />
          </div>
          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.weight')}</label>
            <input
              value={value?.details?.weightKg || ''}
              onChange={onDetailsChange('weightKg')}
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder={t('matchmakingPage.form.placeholders.weight')}
            />
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.occupation')}</label>
            <select
              value={value?.details?.occupation || ''}
              onChange={onDetailsChange('occupation')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {occupationOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.education')}</label>
            <select
              value={value?.details?.education || ''}
              onChange={onDetailsChange('education')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {educationOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.maritalStatus')}</label>
            <select
              value={value?.details?.maritalStatus || ''}
              onChange={onDetailsChange('maritalStatus')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {maritalStatusOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.hasChildren')}</label>
            <select
              value={value?.details?.hasChildren || ''}
              onChange={onDetailsChange('hasChildren')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {yesNoOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {String(value?.details?.hasChildren || '') === 'yes' && (
            <div>
              <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.childrenCount')}</label>
              <input
                value={value?.details?.childrenCount || ''}
                onChange={onDetailsChange('childrenCount')}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                inputMode="numeric"
                placeholder={t('matchmakingPage.form.placeholders.childrenCount')}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.incomeLevel')}</label>
            <select
              value={value?.details?.incomeLevel || ''}
              onChange={onDetailsChange('incomeLevel')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {incomeOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.religion')}</label>
            <select
              value={value?.details?.religion || ''}
              onChange={onDetailsChange('religion')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {religionOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.nativeLanguage')}</label>
            <select
              value={nativeCode}
              onChange={onNativeLanguageChange}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="" className="text-slate-900">{t('matchmakingPage.form.options.common.select')}</option>
              {communicationLanguageOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {nativeCode === 'other' && (
            <div>
              <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.nativeLanguageOther')}</label>
              <input
                value={String(value?.details?.languages?.native?.other || '')}
                onChange={onNativeLanguageOtherChange}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                placeholder={t('matchmakingPage.form.placeholders.nativeLanguageOther')}
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.foreignLanguages')}</label>
            <p className="mt-1 text-xs text-white/60">{t('matchmakingPage.form.hints.multiSelect')}</p>

            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              <label className="block">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={foreignCodes.includes('none')}
                  onChange={toggleForeignLanguage('none')}
                />
                <div className="relative flex items-center rounded-xl border border-white/15 bg-white/5 pl-10 pr-3 py-2 text-sm font-semibold text-white/90 transition hover:border-white/25 peer-checked:border-amber-200/60 peer-checked:bg-amber-500/30">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-4 w-4 items-center justify-center rounded border border-white/30 bg-black/10">
                    <span className="text-[11px] leading-none opacity-0 transition peer-checked:opacity-100">✓</span>
                  </span>
                  <span className="truncate">{t('matchmakingPage.form.options.foreignLanguages.none')}</span>
                </div>
              </label>

              {communicationLanguageOptions
                .filter((opt) => opt.id !== nativeCode)
                .map((opt) => (
                  <label key={opt.id} className="block">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={foreignCodes.includes(opt.id)}
                      onChange={toggleForeignLanguage(opt.id)}
                    />
                    <div className="relative flex items-center rounded-xl border border-white/15 bg-white/5 pl-10 pr-3 py-2 text-sm font-semibold text-white/90 transition hover:border-white/25 peer-checked:border-amber-200/60 peer-checked:bg-amber-500/30">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-4 w-4 items-center justify-center rounded border border-white/30 bg-black/10">
                        <span className="text-[11px] leading-none opacity-0 transition peer-checked:opacity-100">✓</span>
                      </span>
                      <span className="truncate">{opt.label}</span>
                    </div>
                  </label>
                ))}
            </div>

            <p className="mt-1 text-xs text-white/60">{t('matchmakingPage.form.hints.foreignLanguages')}</p>
          </div>

          {foreignCodes.includes('other') && (
            <div className="md:col-span-2">
              <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.foreignLanguageOther')}</label>
              <input
                value={String(value?.details?.languages?.foreign?.other || '')}
                onChange={onForeignLanguageOtherChange}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                placeholder={t('matchmakingPage.form.placeholders.foreignLanguageOther')}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.communicationLanguages')}</label>
            <select
              value={communicationLang}
              onChange={(e) => {
                const next = e?.target?.value || '';
                setValue((prev) => {
                  const details = prev.details || {};
                  return {
                    ...prev,
                    details: {
                      ...details,
                      communicationLanguage: next,
                      communicationLanguageOther: next === 'other' ? String(details.communicationLanguageOther || '') : '',
                      communicationMethod: next,
                      canCommunicateWithTranslationApp: next === 'translation_app',
                    },
                  };
                });
              }}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="" className="text-slate-900">{t('matchmakingPage.form.options.common.select')}</option>
              {communicationLanguageOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {communicationLang === 'other' && (
            <div>
              <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.communicationLanguageOther')}</label>
              <input
                value={String(value?.details?.communicationLanguageOther || '')}
                onChange={onDetailsChange('communicationLanguageOther')}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                placeholder={t('matchmakingPage.form.placeholders.communicationLanguageOther')}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.smoking')}</label>
            <select
              value={value?.details?.smoking || ''}
              onChange={onDetailsChange('smoking')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {yesNoOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.alcohol')}</label>
            <select
              value={value?.details?.alcohol || ''}
              onChange={onDetailsChange('alcohol')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {yesNoOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.religiousValues')}</label>
            <textarea
              value={value?.details?.religiousValues || ''}
              onChange={onDetailsChange('religiousValues')}
              className="mt-1 w-full min-h-[80px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
              placeholder={t('matchmakingPage.form.placeholders.religiousValues')}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.familyApprovalStatus')}</label>
            <select
              value={value?.details?.familyApprovalStatus || ''}
              onChange={onDetailsChange('familyApprovalStatus')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {yesNoMaybeOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.marriageTimeline')}</label>
            <select
              value={value?.details?.marriageTimeline || ''}
              onChange={onDetailsChange('marriageTimeline')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {marriageTimelineOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.relocationWillingness')}</label>
            <select
              value={value?.details?.relocationWillingness || ''}
              onChange={onDetailsChange('relocationWillingness')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {yesNoMaybeOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.preferredLivingCountry')}</label>
            <select
              value={value?.details?.preferredLivingCountry || ''}
              onChange={onDetailsChange('preferredLivingCountry')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {livingCountryOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-white/10">
        <label className="block text-sm font-semibold text-white">{t('matchmakingPage.form.labels.photos')}</label>
        <div className="mt-3 space-y-4">
          {[0, 1, 2].map((idx) => {
            const labelKey = idx === 0 ? 'photo1' : idx === 1 ? 'photo2' : 'photo3';
            const id = `mk-editonce-photo-${idx + 1}`;
            const url = String(photoUrls[idx] || '');
            return (
              <div key={id}>
                <label className="block text-xs font-semibold text-white/70">{t(`matchmakingPage.form.labels.${labelKey}`)}</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    id={id}
                    type="file"
                    accept="image/*"
                    onChange={(e) => onUploadPhoto?.(idx, e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={id}
                    className="inline-flex cursor-pointer items-center rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.12] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                  >
                    {t('matchmakingPage.form.photo.choose')}
                  </label>
                  <span className="min-w-0 flex-1 truncate text-xs text-white/60">
                    {photoUpload?.loading ? t('matchmakingPage.form.submitting') : url ? t('matchmakingPage.form.photo.uploaded') : t('matchmakingPage.form.photo.noFileChosen')}
                  </span>
                </div>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs text-sky-200 hover:underline">
                    {t('matchmakingPanel.receipt.view')}
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-white/60">{t('matchmakingPage.form.photoHint')}</p>
      </div>

      <div className="mt-10 pt-8 border-t border-white/10">
        <label className="block text-sm font-semibold text-white">{t('matchmakingPage.form.labels.about')}</label>
        <textarea
          value={value?.about || ''}
          onChange={onChange('about')}
          className="mt-1 w-full min-h-[110px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          placeholder={t('matchmakingPage.form.placeholders.about')}
        />
      </div>

      <div className="mt-10 pt-8 border-t border-white/10">
        <p className="text-sm font-semibold text-white">{t('matchmakingPage.form.sections.partnerPreferences')}</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerHeightMin')}</label>
            <select
              value={partnerHeightMin}
              onChange={onPartnerChange('heightMinCm')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="" className="text-slate-900">{t('matchmakingPage.form.options.common.select')}</option>
              <option value="any" className="text-slate-900">{t('matchmakingPage.form.options.common.doesntMatter')}</option>
              {heightRangeOptions.map((cm) => (
                <option key={cm} value={cm} className="text-slate-900">
                  {cm} cm
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerHeightMax')}</label>
            <select
              value={partnerHeightMax}
              onChange={onPartnerChange('heightMaxCm')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="" className="text-slate-900">{t('matchmakingPage.form.options.common.select')}</option>
              <option value="any" className="text-slate-900">{t('matchmakingPage.form.options.common.doesntMatter')}</option>
              {heightRangeOptions.map((cm) => (
                <option key={cm} value={cm} className="text-slate-900">
                  {cm} cm
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerAgeMaxOlderYears')}</label>
                <select
                  value={value?.partnerPreferences?.ageMaxOlderYears || ''}
                  onChange={onPartnerChange('ageMaxOlderYears')}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  {partnerAgeDiffOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} className="text-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerAgeMaxYoungerYears')}</label>
                <select
                  value={value?.partnerPreferences?.ageMaxYoungerYears || ''}
                  onChange={onPartnerChange('ageMaxYoungerYears')}
                  className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  {partnerAgeDiffOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} className="text-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {partnerAgeMinForUi !== null && partnerAgeMaxForUi !== null ? (
              <p className="mt-2 text-xs text-white/60">
                {t('matchmakingPage.form.hints.partnerAgeComputed', { min: partnerAgeMinForUi, max: partnerAgeMaxForUi })}
              </p>
            ) : (
              <p className="mt-2 text-xs text-white/60">{t('matchmakingPage.form.hints.partnerAgeNeedsYourAge')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerMaritalStatus')}</label>
            <select
              value={value?.partnerPreferences?.maritalStatus || ''}
              onChange={onPartnerChange('maritalStatus')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {maritalStatusOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerReligion')}</label>
            <select
              value={value?.partnerPreferences?.religion || ''}
              onChange={onPartnerChange('religion')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {religionOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerCommunicationLanguages')}</label>
            <select
              value={partnerCommLang}
              onChange={onPartnerChange('communicationLanguage')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="" className="text-slate-900">{t('matchmakingPage.form.options.common.select')}</option>
              {communicationLanguageOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {partnerCommLang === 'other' && (
            <div>
              <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerCommunicationLanguageOther')}</label>
              <input
                value={value?.partnerPreferences?.communicationLanguageOther || ''}
                onChange={onPartnerChange('communicationLanguageOther')}
                className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                placeholder={t('matchmakingPage.form.placeholders.partnerCommunicationLanguageOther')}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerTranslationApp')}</label>
            <select
              value={value?.partnerPreferences?.translationAppPreference || ''}
              onChange={onPartnerTranslationAppChange}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {yesNoDoesntMatterOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerLivingCountry')}</label>
            <select
              value={value?.partnerPreferences?.livingCountry || ''}
              onChange={onPartnerChange('livingCountry')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {livingCountryOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerSmokingPreference')}</label>
            <select
              value={value?.partnerPreferences?.smokingPreference || ''}
              onChange={onPartnerChange('smokingPreference')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {yesNoDoesntMatterOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerAlcoholPreference')}</label>
            <select
              value={value?.partnerPreferences?.alcoholPreference || ''}
              onChange={onPartnerChange('alcoholPreference')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {yesNoDoesntMatterOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerChildrenPreference')}</label>
            <select
              value={value?.partnerPreferences?.childrenPreference || 'doesnt_matter'}
              onChange={onPartnerChange('childrenPreference')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {partnerChildrenPreferenceOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerEducationPreference')}</label>
            <select
              value={value?.partnerPreferences?.educationPreference || 'doesnt_matter'}
              onChange={onPartnerChange('educationPreference')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {partnerEducationPreferenceOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerOccupationPreference')}</label>
            <select
              value={value?.partnerPreferences?.occupationPreference || 'doesnt_matter'}
              onChange={onPartnerChange('occupationPreference')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {partnerOccupationPreferenceOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-white/70">{t('matchmakingPage.form.labels.partnerFamilyValuesPreference')}</label>
            <select
              value={value?.partnerPreferences?.familyValuesPreference || 'doesnt_matter'}
              onChange={onPartnerChange('familyValuesPreference')}
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
            >
              {partnerFamilyValuesPreferenceOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold text-white">{t('matchmakingPage.form.labels.expectations')}</label>
          <textarea
            value={value?.expectations || ''}
            onChange={onChange('expectations')}
            className="mt-1 w-full min-h-[90px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
            placeholder={t('matchmakingPage.form.placeholders.expectations')}
          />
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-white/10">
        <label className="block text-sm font-semibold text-white">{t('matchmakingPage.form.labels.expectations')}</label>
        <textarea
          value={value?.expectations || ''}
          onChange={onChange('expectations')}
          className="mt-1 w-full min-h-[90px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
          placeholder={t('matchmakingPage.form.placeholders.expectations')}
        />
      </div>

      <div className="mt-10 pt-8 border-t border-white/10">
        <div className="space-y-3">
          <label className="flex items-start gap-3 text-sm text-white/90">
            <input type="checkbox" checked={!!consents?.consent18Plus} disabled={disableConsents} onChange={() => {}} className="mt-1" />
            <span>{t('matchmakingPage.form.consents.age')}</span>
          </label>
          <label className="flex items-start gap-3 text-sm text-white/90">
            <input type="checkbox" checked={!!consents?.consentPrivacy} disabled={disableConsents} onChange={() => {}} className="mt-1" />
            <span>
              <Trans
                i18nKey="matchmakingPage.form.consents.privacy"
                components={{
                  privacyLink: (
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-200 hover:underline font-semibold" />
                  ),
                }}
              />
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-white/90">
            <input type="checkbox" checked={!!consents?.consentTerms} disabled={disableConsents} onChange={() => {}} className="mt-1" />
            <span>
              <Trans
                i18nKey="matchmakingPage.form.consents.terms"
                components={{
                  termsLink: (
                    <a
                      href="/docs/matchmaking-kullanim-sozlesmesi.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-200 hover:underline font-semibold"
                    />
                  ),
                }}
              />
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-white/90">
            <input type="checkbox" checked={!!consents?.consentPhotoShare} disabled={disableConsents} onChange={() => {}} className="mt-1" />
            <span>{t('matchmakingPage.form.consents.photo')}</span>
          </label>
        </div>
        {disableConsents ? <p className="mt-2 text-xs text-white/60">{t('matchmakingPanel.common.readOnly')}</p> : null}
      </div>

      <button
        type="submit"
        disabled={!!submitting}
        className="mt-8 w-full rounded-full bg-amber-300 text-slate-950 font-semibold py-3 hover:bg-amber-200 transition disabled:opacity-60"
        aria-busy={submitting ? 'true' : 'false'}
      >
        {submitting ? t('matchmakingPage.form.submitting') : t('matchmakingPage.form.submit')}
      </button>

      {photoUpload?.error ? (
        <div className="mt-3 rounded-lg border border-rose-300/30 bg-rose-500/10 p-3 text-rose-100 text-xs">{photoUpload.error}</div>
      ) : null}
    </form>
  );
}
