import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useEffect, useMemo, useRef, useState } from 'react';
import { uploadImageToCloudinaryAuto } from '../utils/cloudinaryUpload';
import { useTranslation } from 'react-i18next';
import { ensureI18nLanguageLoaded, normalizeLang } from '../i18n.js';
import { useNavigate } from 'react-router-dom';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function toIntOrEmpty(v) {
  const s = safeStr(v);
  if (!s) return '';
  const n = Number(s);
  if (!Number.isFinite(n)) return '';
  return String(Math.trunc(n));
}

const WORK_STATUS_OPTIONS = [
  { value: 'civil_servant', labelKey: 'leadNoAuth.options.workStatus.civilServant' },
  { value: 'worker', labelKey: 'leadNoAuth.options.workStatus.worker' },
  { value: 'business_owner', labelKey: 'leadNoAuth.options.workStatus.businessOwner' },
  { value: 'retired', labelKey: 'leadNoAuth.options.workStatus.retired' },
  { value: 'not_working', labelKey: 'leadNoAuth.options.workStatus.notWorking' },
];

export default function MatchmakingLeadNoAuth() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState('');
  const successDoneRef = useRef(null);

  const goToWeddingGuidance = () => {
    const pathname = String(window?.location?.pathname || '').trim();
    const base = pathname.startsWith('/evlilik') ? '/evlilik' : '/wedding';
    const to = `${base}/app/rehberlik`;
    try {
      navigate(to);
    } catch {
      try {
        window.location.href = to;
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    try {
      const lng = normalizeLang(i18n?.language) || 'tr';
      void ensureI18nLanguageLoaded(lng);
      void ensureI18nLanguageLoaded('tr');
    } catch {
      // ignore
    }
  }, [i18n?.language]);

  const [photoState, setPhotoState] = useState({ uploading: false, items: [], error: '' });

  const [form, setForm] = useState({
    gender: '',
    fullName: '',
    age: '',
    heightCm: '',
    weightKg: '',
    city: '',
    whatsapp: '',
    maritalStatus: '',
    hasChildren: '',
    childrenCount: '',
    childrenAges: '',
    childrenLivingWith: '',
    livingWith: '',
    occupation: '',
    profession: '',
    income: '',
    foreignLanguage: '',
    translationOk: '',
    familyApproval: '',
    additionalInfoStatus: '',
    additionalInfoText: '',
    religiousPractices: [],

    partnerAgeMin: '',
    partnerAgeMax: '',
    partnerOccupation: '',
    partnerSpouseWanted: '',
    partnerIncome: '',
    partnerLivingWith: '',
    partnerReligiousValues: '',
    partnerMaritalStatus: '',
    partnerHasChildren: '',

    consentAccuracy: false,
    consentDisclaimer: false,
  });

  const disabled = sending || photoState.uploading || !!successId;
  const sectionCardClass = 'rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)]';

  useEffect(() => {
    if (!successId) return;

    // Success overlay açıkken arka plan scroll'u kapat.
    const prev = document?.body?.style?.overflow;
    try {
      document.body.style.overflow = 'hidden';
    } catch {
      // ignore
    }

    // Kullanıcı doğrudan mesajı görsün + CTA odakta olsun.
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // ignore
    }
    const tm = window.setTimeout(() => {
      try {
        successDoneRef.current?.focus?.();
      } catch {
        // ignore
      }
    }, 50);

    return () => {
      try {
        window.clearTimeout(tm);
      } catch {
        // ignore
      }
      try {
        document.body.style.overflow = prev || '';
      } catch {
        // ignore
      }
    };
  }, [successId]);

  const scrollToFirstMissingRequired = () => {
    const scrollTo = (id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        // ignore
      }
      try {
        if (typeof el.focus === 'function') el.focus({ preventScroll: true });
      } catch {
        // ignore
      }
      return true;
    };

    if (!safeStr(form.gender)) return scrollTo('lead_gender');
    if (!safeStr(form.fullName)) return scrollTo('lead_fullName');
    if (!safeStr(form.age)) return scrollTo('lead_age');
    if (!safeStr(form.city)) return scrollTo('lead_city');
    if (!safeStr(form.whatsapp)) return scrollTo('lead_whatsapp');

    const photoCount = Array.isArray(photoState.items) ? photoState.items.length : 0;
    if (photoCount < 1) return scrollTo('lead_photos');

    if (!form.consentAccuracy) return scrollTo('lead_consentAccuracy');
    if (!form.consentDisclaimer) return scrollTo('lead_consentDisclaimer');
    return false;
  };

  const canSubmit = useMemo(() => {
    if (!safeStr(form.gender)) return false;
    if (!safeStr(form.fullName)) return false;
    if (!safeStr(form.age)) return false;
    if (!safeStr(form.city)) return false;
    if (!safeStr(form.whatsapp)) return false;
    const photoCount = Array.isArray(photoState.items) ? photoState.items.length : 0;
    if (photoCount < 1) return false;
    if (!form.consentAccuracy || !form.consentDisclaimer) return false;
    return true;
  }, [form, photoState.items]);

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const toggleMulti = (key, value) => {
    const v = String(value || '').trim();
    if (!v) return;
    setForm((p) => {
      const cur = Array.isArray(p[key]) ? p[key] : [];
      const has = cur.includes(v);
      return { ...p, [key]: has ? cur.filter((x) => x !== v) : [...cur, v] };
    });
  };


  const uploadPhotos = async (files) => {
    const list = Array.from(files || []).filter(Boolean);
    if (!list.length) return;

    setPhotoState((p) => ({ ...p, uploading: true, error: '' }));
    try {
      for (const file of list) {
        // read current count from latest state by functional update
        const res = await uploadImageToCloudinaryAuto(file, {
          folder: 'uniqah/matchmakingLeads',
          tags: ['matchmaking', 'lead'],
        });

        const item = { url: res.secureUrl, publicId: res.publicId || '' };
        setPhotoState((p) => {
          const cur = Array.isArray(p.items) ? p.items : [];
          if (cur.length >= 5) return { ...p, items: cur };
          return { ...p, items: [...cur, item] };
        });
      }

      setPhotoState((p) => ({ ...p, uploading: false, error: '' }));
    } catch (e) {
      setPhotoState((p) => ({ ...p, uploading: false, error: String(e?.message || 'upload_failed') }));
    }
  };

  const removePhotoAt = (idx) => {
    const i = typeof idx === 'number' ? idx : -1;
    if (i < 0) return;
    setPhotoState((p) => {
      const cur = Array.isArray(p.items) ? p.items : [];
      return { ...p, items: cur.filter((_, k) => k !== i) };
    });
  };

  const onHasChildrenChange = (value) => {
    setForm((p) => {
      const next = { ...p, hasChildren: value };
      if (value !== 'yes') {
        next.childrenCount = '';
        next.childrenAges = '';
        next.childrenLivingWith = '';
      }
      return next;
    });
  };

  const submit = async () => {
    if (disabled) return;
    setError('');
    setSuccessId('');

    if (!canSubmit) {
      setError(t('leadNoAuth.errors.required'));
      scrollToFirstMissingRequired();
      return;
    }

    setSending(true);
    try {
      const payload = {
        consentAccuracy: !!form.consentAccuracy,
        consentDisclaimer: !!form.consentDisclaimer,
        lead: {
          gender: safeStr(form.gender),
          fullName: safeStr(form.fullName),
          age: Number(toIntOrEmpty(form.age) || 0) || null,
          heightCm: (() => {
            const s = toIntOrEmpty(form.heightCm);
            return s ? Number(s) : null;
          })(),
          weightKg: (() => {
            const s = toIntOrEmpty(form.weightKg);
            return s ? Number(s) : null;
          })(),
          city: safeStr(form.city),
          whatsapp: safeStr(form.whatsapp),
          maritalStatus: safeStr(form.maritalStatus),
          hasChildren: safeStr(form.hasChildren),
          childrenCount: form.hasChildren === 'yes' ? safeStr(form.childrenCount) : '',
          childrenAges: form.hasChildren === 'yes' ? safeStr(form.childrenAges) : '',
          childrenLivingWith: form.hasChildren === 'yes' ? safeStr(form.childrenLivingWith) : '',
          livingWith: safeStr(form.livingWith),
          occupation: safeStr(form.occupation),
          profession: safeStr(form.profession),
          income: safeStr(form.income),
          foreignLanguage: safeStr(form.foreignLanguage),
          translationOk: form.translationOk === 'yes',
          familyApproval: safeStr(form.familyApproval),
          additionalInfoStatus: safeStr(form.additionalInfoStatus),
          additionalInfoText: form.additionalInfoStatus === 'yes' ? safeStr(form.additionalInfoText) : '',
          religiousPractices: Array.isArray(form.religiousPractices) ? form.religiousPractices : [],
          photoUrls: (Array.isArray(photoState.items) ? photoState.items : []).map((x) => safeStr(x?.url)).filter(Boolean).slice(0, 5),
          photoPublicIds: (Array.isArray(photoState.items) ? photoState.items : []).map((x) => safeStr(x?.publicId)).filter(Boolean).slice(0, 5),
        },
        partner: {
          ageMin: Number(toIntOrEmpty(form.partnerAgeMin) || 0) || null,
          ageMax: Number(toIntOrEmpty(form.partnerAgeMax) || 0) || null,
          occupation: safeStr(form.partnerOccupation),
          spouseWanted: safeStr(form.partnerSpouseWanted),
          income: safeStr(form.partnerIncome),
          livingWith: safeStr(form.partnerLivingWith),
          religiousValues: safeStr(form.partnerReligiousValues),
          maritalStatus: safeStr(form.partnerMaritalStatus),
          hasChildren: safeStr(form.partnerHasChildren),
        },
      };

      const res = await fetch('/api/public-lead-submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        const msg = String(data?.error || `HTTP_${res.status}`);
        throw new Error(msg);
      }

      setSuccessId(String(data.id || ''));
      setError('');
    } catch (e) {
      const msg = String(e?.message || 'submit_failed');
      setError(msg === 'rate_limited' ? t('leadNoAuth.errors.rateLimited') : msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fffaf3_0%,#fffdf8_30%,#f8fafc_100%)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 right-[-40px] h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18),rgba(251,191,36,0)_68%)] blur-3xl" />
        <div className="absolute top-56 left-[-60px] h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.10),rgba(244,114,182,0)_70%)] blur-3xl" />
      </div>
      <Navigation />

      <div className="relative mx-auto max-w-4xl px-4 py-8 md:py-10">
        <div className="rounded-[30px] border border-white/80 bg-white/86 p-5 shadow-[0_30px_90px_rgba(148,163,184,0.16)] backdrop-blur-xl md:p-8">
          <div className="mb-5 rounded-[24px] border border-amber-200/80 bg-[linear-gradient(135deg,#fff9e8,#fff2d2)] p-4 shadow-[0_16px_44px_rgba(245,158,11,0.12)]">
            <div className="text-sm font-semibold text-slate-900">{t('leadNoAuth.info.title')}</div>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li>{t('leadNoAuth.info.b1')}</li>
              <li>{t('leadNoAuth.info.b2')}</li>
              <li>{t('leadNoAuth.info.b3')}</li>
              <li>{t('leadNoAuth.info.b4')}</li>
              <li>{t('leadNoAuth.info.b5')}</li>
              <li>{t('leadNoAuth.info.b6')}</li>
            </ul>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-white/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_14px_34px_rgba(148,163,184,0.08)]">
            <h1 className="text-xl font-bold text-slate-900 md:text-2xl">{t('leadNoAuth.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{t('leadNoAuth.subtitle')}</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 rounded-[26px] border border-slate-200/80 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_20px_60px_rgba(148,163,184,0.12)] backdrop-blur-sm md:p-5">
            <div>
              <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.gender')} *</label>
              <select
                id="lead_gender"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                disabled={disabled}
              >
                <option value="">{t('leadNoAuth.common.select')}</option>
                <option value="female">{t('leadNoAuth.common.female')}</option>
                <option value="male">{t('leadNoAuth.common.male')}</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.fullName')} *</label>
              <input
                id="lead_fullName"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.age')} *</label>
                <input
                  id="lead_age"
                  type="number"
                  min="18"
                  max="99"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={form.age}
                  onChange={(e) => set('age', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.city')} *</label>
                <input
                  id="lead_city"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 items-end gap-4 sm:flex sm:flex-wrap">
              <div className="w-full sm:w-32">
                <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.heightCm')}</label>
                <input
                  type="number"
                  min="120"
                  max="230"
                  inputMode="numeric"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={form.heightCm}
                  onChange={(e) => set('heightCm', e.target.value)}
                  disabled={disabled}
                  placeholder={t('leadNoAuth.placeholders.heightCm')}
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.weightKg')}</label>
                <input
                  type="number"
                  min="35"
                  max="250"
                  inputMode="numeric"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={form.weightKg}
                  onChange={(e) => set('weightKg', e.target.value)}
                  disabled={disabled}
                  placeholder={t('leadNoAuth.placeholders.weightKg')}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.whatsapp')} *</label>
              <input
                id="lead_whatsapp"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                placeholder={t('leadNoAuth.placeholders.whatsapp')}
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.maritalStatus')}</label>
                <select
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  value={form.maritalStatus}
                  onChange={(e) => set('maritalStatus', e.target.value)}
                  disabled={disabled}
                >
                  <option value="">{t('leadNoAuth.common.select')}</option>
                  <option value="single">{t('leadNoAuth.options.marital.single')}</option>
                  <option value="widowed">{t('leadNoAuth.options.marital.widowed')}</option>
                  <option value="divorced">{t('leadNoAuth.options.marital.divorced')}</option>
                  <option value="married">{t('leadNoAuth.options.marital.married')}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.hasChildren')}</label>
                <select
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  value={form.hasChildren}
                  onChange={(e) => onHasChildrenChange(e.target.value)}
                  disabled={disabled}
                >
                  <option value="">{t('leadNoAuth.common.select')}</option>
                  <option value="yes">{t('leadNoAuth.options.hasChildren.yes')}</option>
                  <option value="no">{t('leadNoAuth.options.hasChildren.no')}</option>
                </select>
              </div>
            </div>

            {form.hasChildren === 'yes' ? (
              <div className={sectionCardClass}>
                <div className="text-sm font-semibold text-slate-900">{t('leadNoAuth.children.title')}</div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.children.count')}</label>
                    <input
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={form.childrenCount}
                      onChange={(e) => set('childrenCount', e.target.value)}
                      disabled={disabled}
                      placeholder={t('leadNoAuth.placeholders.childrenCount')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.children.ages')}</label>
                    <input
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={form.childrenAges}
                      onChange={(e) => set('childrenAges', e.target.value)}
                      disabled={disabled}
                      placeholder={t('leadNoAuth.placeholders.childrenAges')}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.children.livingWith')}</label>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                    value={form.childrenLivingWith}
                    onChange={(e) => set('childrenLivingWith', e.target.value)}
                    disabled={disabled}
                  >
                    <option value="">{t('leadNoAuth.common.select')}</option>
                    <option value="with_me">{t('leadNoAuth.options.childrenLivingWith.withMe')}</option>
                    <option value="not_with_me">{t('leadNoAuth.options.childrenLivingWith.notWithMe')}</option>
                  </select>
                </div>
              </div>
            ) : null}

            <div>
              <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.livingWith')}</label>
              <select
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                value={form.livingWith}
                onChange={(e) => set('livingWith', e.target.value)}
                disabled={disabled}
              >
                <option value="">{t('leadNoAuth.common.select')}</option>
                <option value="with_family">{t('leadNoAuth.options.livingWith.withFamily')}</option>
                <option value="with_children">{t('leadNoAuth.options.livingWith.withChildren')}</option>
                <option value="with_friend">{t('leadNoAuth.options.livingWith.withFriend')}</option>
                <option value="alone">{t('leadNoAuth.options.livingWith.alone')}</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.occupation')}</label>
              <select
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                value={form.occupation}
                onChange={(e) => set('occupation', e.target.value)}
                disabled={disabled}
              >
                <option value="">{t('leadNoAuth.common.select')}</option>
                {WORK_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.profession')}</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                value={form.profession}
                onChange={(e) => set('profession', e.target.value)}
                disabled={disabled}
                placeholder={t('leadNoAuth.placeholders.profession')}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.income')}</label>
              <select
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                value={form.income}
                onChange={(e) => set('income', e.target.value)}
                disabled={disabled}
              >
                <option value="">{t('leadNoAuth.common.select')}</option>
                <option value="low">{t('leadNoAuth.options.income.low')}</option>
                <option value="mid">{t('leadNoAuth.options.income.mid')}</option>
                <option value="good">{t('leadNoAuth.options.income.good')}</option>
              </select>
            </div>

            <div className={sectionCardClass}>
              <div className="text-sm font-semibold text-slate-900">{t('leadNoAuth.religious.title')}</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-800">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Array.isArray(form.religiousPractices) && form.religiousPractices.includes('prayer_5')}
                    onChange={() => toggleMulti('religiousPractices', 'prayer_5')}
                    disabled={disabled}
                  />
                  <span>{t('leadNoAuth.religious.options.prayer5')}</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Array.isArray(form.religiousPractices) && form.religiousPractices.includes('fasting')}
                    onChange={() => toggleMulti('religiousPractices', 'fasting')}
                    disabled={disabled}
                  />
                  <span>{t('leadNoAuth.religious.options.fasting')}</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Array.isArray(form.religiousPractices) && form.religiousPractices.includes('hajj')}
                    onChange={() => toggleMulti('religiousPractices', 'hajj')}
                    disabled={disabled}
                  />
                  <span>{t('leadNoAuth.religious.options.hajj')}</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Array.isArray(form.religiousPractices) && form.religiousPractices.includes('umrah')}
                    onChange={() => toggleMulti('religiousPractices', 'umrah')}
                    disabled={disabled}
                  />
                  <span>{t('leadNoAuth.religious.options.umrah')}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.foreignLanguage')}</label>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                value={form.foreignLanguage}
                onChange={(e) => set('foreignLanguage', e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.translationOk')}</label>
                <select
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  value={form.translationOk}
                  onChange={(e) => set('translationOk', e.target.value)}
                  disabled={disabled}
                >
                  <option value="">{t('leadNoAuth.common.select')}</option>
                  <option value="yes">{t('leadNoAuth.common.yes')}</option>
                  <option value="no">{t('leadNoAuth.common.no')}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.familyApproval')}</label>
                <select
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  value={form.familyApproval}
                  onChange={(e) => set('familyApproval', e.target.value)}
                  disabled={disabled}
                >
                  <option value="">{t('leadNoAuth.common.select')}</option>
                  <option value="yes">{t('leadNoAuth.common.yes')}</option>
                  <option value="no">{t('leadNoAuth.common.no')}</option>
                  <option value="unknown">{t('leadNoAuth.options.familyApproval.unknown')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.additionalInfo')}</label>
              <select
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                value={form.additionalInfoStatus}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((p) => ({ ...p, additionalInfoStatus: v, additionalInfoText: v === 'yes' ? p.additionalInfoText : '' }));
                }}
                disabled={disabled}
              >
                <option value="">{t('leadNoAuth.common.select')}</option>
                <option value="yes">{t('leadNoAuth.common.yes')}</option>
                <option value="no">{t('leadNoAuth.common.no')}</option>
              </select>

              {form.additionalInfoStatus === 'yes' ? (
                <textarea
                  className="mt-2 w-full min-h-24 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={form.additionalInfoText}
                  onChange={(e) => set('additionalInfoText', e.target.value)}
                  placeholder={t('leadNoAuth.placeholders.additionalInfoText')}
                  disabled={disabled}
                />
              ) : null}
            </div>

            <div id="lead_photos" tabIndex={-1} className={sectionCardClass}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t('leadNoAuth.fields.photo')} *</div>
                  <div className="text-xs text-slate-600">{t('leadNoAuth.photoNote')}</div>
                </div>
                <label
                  className={`inline-flex items-center gap-2 text-xs font-semibold ${disabled || (Array.isArray(photoState.items) && photoState.items.length >= 5) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} text-slate-700`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={disabled || (Array.isArray(photoState.items) && photoState.items.length >= 5)}
                    className="hidden"
                    onChange={(e) => {
                      // Bazı tarayıcılarda `e.target.value = ''` yapınca FileList anında boşalabiliyor.
                      // Bu yüzden önce dosyaları kopyalayıp sonra input'u sıfırlıyoruz.
                      const picked = Array.from(e.target.files || []).filter(Boolean);
                      e.target.value = '';
                      if (picked.length) void uploadPhotos(picked);
                    }}
                  />
                  <span className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                    {photoState.uploading ? t('leadNoAuth.common.uploading') : t('leadNoAuth.actions.pickPhoto')}
                  </span>
                </label>
              </div>

              {photoState.error ? <div className="mt-2 text-xs text-rose-700">{photoState.error}</div> : null}
              {Array.isArray(photoState.items) && photoState.items.length ? (
                <div className="mt-3">
                  <div className="text-[11px] text-slate-600">{photoState.items.length}/5</div>
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {photoState.items.map((it, idx) => (
                      <div key={`${it?.url || 'photo'}_${idx}`} className="relative">
                        <img
                          src={it?.url}
                          alt={`Yüklenen fotoğraf ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhotoAt(idx)}
                          disabled={disabled}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 disabled:opacity-60"
                          title="Kaldır"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className={`${sectionCardClass} mt-2`}>
              <h2 className="text-base font-bold text-slate-900">{t('leadNoAuth.partner.title')}</h2>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.partner.hasChildren')}</label>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                    value={form.partnerHasChildren}
                    onChange={(e) => set('partnerHasChildren', e.target.value)}
                    disabled={disabled}
                  >
                    <option value="">{t('leadNoAuth.common.select')}</option>
                    <option value="yes">{t('leadNoAuth.partnerOptions.hasChildren.yes')}</option>
                    <option value="no">{t('leadNoAuth.partnerOptions.hasChildren.no')}</option>
                    <option value="any">{t('leadNoAuth.common.any')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.partner.maritalStatus')}</label>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                    value={form.partnerMaritalStatus}
                    onChange={(e) => set('partnerMaritalStatus', e.target.value)}
                    disabled={disabled}
                  >
                    <option value="">{t('leadNoAuth.common.select')}</option>
                    <option value="single">{t('leadNoAuth.options.marital.single')}</option>
                    <option value="widowed">{t('leadNoAuth.options.marital.widowed')}</option>
                    <option value="divorced">{t('leadNoAuth.options.marital.divorced')}</option>
                    <option value="any">{t('leadNoAuth.common.any')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.partner.ageMin')}</label>
                  <input
                    type="number"
                    min="18"
                    max="99"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    value={form.partnerAgeMin}
                    onChange={(e) => set('partnerAgeMin', e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.partner.ageMax')}</label>
                  <input
                    type="number"
                    min="18"
                    max="99"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    value={form.partnerAgeMax}
                    onChange={(e) => set('partnerAgeMax', e.target.value)}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.partner.occupation')}</label>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                    value={form.partnerOccupation}
                    onChange={(e) => set('partnerOccupation', e.target.value)}
                    disabled={disabled}
                  >
                    <option value="">{t('leadNoAuth.common.select')}</option>
                    {WORK_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </option>
                    ))}
                    <option value="any">{t('leadNoAuth.common.any')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.partner.income')}</label>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                    value={form.partnerIncome}
                    onChange={(e) => set('partnerIncome', e.target.value)}
                    disabled={disabled}
                  >
                    <option value="">{t('leadNoAuth.common.select')}</option>
                    <option value="low">{t('leadNoAuth.options.income.low')}</option>
                    <option value="mid">{t('leadNoAuth.options.income.mid')}</option>
                    <option value="good">{t('leadNoAuth.options.income.good')}</option>
                    <option value="any">{t('leadNoAuth.common.any')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.partner.livingWith')}</label>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                    value={form.partnerLivingWith}
                    onChange={(e) => set('partnerLivingWith', e.target.value)}
                    disabled={disabled}
                  >
                    <option value="">{t('leadNoAuth.common.select')}</option>
                    <option value="with_family">{t('leadNoAuth.partnerOptions.livingWith.withFamily')}</option>
                    <option value="with_children">{t('leadNoAuth.partnerOptions.livingWith.withChildren')}</option>
                    <option value="alone">{t('leadNoAuth.partnerOptions.livingWith.alone')}</option>
                    <option value="with_friends">{t('leadNoAuth.partnerOptions.livingWith.withFriends')}</option>
                    <option value="any">{t('leadNoAuth.common.any')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.partner.religiousValues')}</label>
                  <select
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                    value={form.partnerReligiousValues}
                    onChange={(e) => set('partnerReligiousValues', e.target.value)}
                    disabled={disabled}
                  >
                    <option value="">{t('leadNoAuth.common.select')}</option>
                    <option value="religious">{t('leadNoAuth.partnerOptions.religiousValues.religious')}</option>
                    <option value="any">{t('leadNoAuth.common.any')}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-slate-900">{t('leadNoAuth.partner.spouseWanted')}</label>
                  <textarea
                    className="mt-1 w-full min-h-24 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    value={form.partnerSpouseWanted}
                    onChange={(e) => set('partnerSpouseWanted', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>

            <div className={sectionCardClass}>
              <div className="text-sm font-semibold text-slate-900">{t('leadNoAuth.checklist.title')} *</div>
              <label className="mt-3 flex items-start gap-2 text-sm text-slate-800">
                <input
                  id="lead_consentAccuracy"
                  type="checkbox"
                  className="mt-1"
                  checked={!!form.consentAccuracy}
                  onChange={(e) => set('consentAccuracy', e.target.checked)}
                  disabled={disabled}
                />
                <span>{t('leadNoAuth.checklist.accuracy')}</span>
              </label>
              <label className="mt-2 flex items-start gap-2 text-sm text-slate-800">
                <input
                  id="lead_consentDisclaimer"
                  type="checkbox"
                  className="mt-1"
                  checked={!!form.consentDisclaimer}
                  onChange={(e) => set('consentDisclaimer', e.target.checked)}
                  disabled={disabled}
                />
                <span>{t('leadNoAuth.checklist.disclaimer')}</span>
              </label>
            </div>

            <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-3 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <button
                type="button"
                disabled={disabled}
                onClick={submit}
                className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(225,29,72,0.22)] hover:brightness-105 disabled:opacity-60"
              >
                {sending ? t('leadNoAuth.actions.sending') : t('leadNoAuth.actions.submit')}
              </button>

              {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}
            </div>
          </div>
        </div>
      </div>

      {successId ? (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

          <div className="absolute left-3 right-3 top-24 max-w-2xl mx-auto">
            <div className="relative pointer-events-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xl">
              <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold text-slate-900">{t('leadNoAuth.success.title')}</p>
                <p className="mt-2 text-base text-slate-800 leading-relaxed">{t('leadNoAuth.success.note')}</p>
                <p className="mt-3 text-xs text-slate-500">{t('leadNoAuth.success.ref', { id: successId })}</p>
                <p className="mt-2 text-xs text-slate-500">1/1</p>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  ref={successDoneRef}
                  type="button"
                  onClick={goToWeddingGuidance}
                  className="app-btn app-btn-primary"
                >
                  {t('leadNoAuth.actions.done')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}
