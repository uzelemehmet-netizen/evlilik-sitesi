import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import StickyWhatsApp from '../components/StickyWhatsApp';
import HeroSocialButtons from '../components/HeroSocialButtons';
import { Heart, CheckCircle, AlertCircle, Phone, MessageCircle, Files, Route, Compass, ClipboardCheck } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { db } from '../config/firebaseDb';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../auth/AuthProvider';
import { staticAssetUrl } from '../utils/staticAssetUrl';
import { trackClick } from '../utils/clickTracker';

const FALLBACK_THUMB_DATA_URL =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <rect width="1280" height="720" fill="#000"/>
      <g opacity="0.9">
        <circle cx="640" cy="360" r="84" fill="#fff" opacity="0.18"/>
        <path d="M 615 318 L 615 402 L 695 360 Z" fill="#fff"/>
      </g>
      <text x="50%" y="92%" text-anchor="middle" fill="#fff" font-size="28" font-family="Arial, sans-serif" opacity="0.9">Önizleme yüklenemedi</text>
    </svg>`
  );

const DEFAULT_MEDIA = Object.freeze({
  heroBackgroundUrl:
    '/ChatGPT Image 2 Şub 2026 22_19_01.png',
  introImage1Url: '/ChatGPT Image 2 Şub 2026 22_36_18.png',
  introImage2Url: '/ChatGPT Image 2 Şub 2026 22_36_39.png',
});

function parseYouTubeId(url) {
  try {
    const raw = String(url || '').trim();
    if (!raw) return '';

    // Accept youtu.be/<id>
    if (raw.includes('youtu.be/')) {
      const u = new URL(raw);
      const id = String(u.pathname || '').replace(/^\//, '').split('/')[0] || '';
      return id.slice(0, 32);
    }

    // Accept youtube.com/watch?v=<id> and embed variants
    const u = new URL(raw);
    const host = String(u.hostname || '').toLowerCase();
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const v = u.searchParams.get('v');
      if (v) return String(v).slice(0, 32);

      const path = String(u.pathname || '');
      const m = path.match(/\/(embed|shorts)\/([^/?#]+)/i);
      if (m && m[2]) return String(m[2]).slice(0, 32);
    }

    return '';
  } catch {
    return '';
  }
}

export default function Wedding() {
	const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const BRAND_LOGO_SRC = staticAssetUrl('/brand-logo.webp');
  const youtubeVideos = [
    'https://youtu.be/-liIjzJmZ_E?si=zWR-QpcJqt9KzF0k',
    'https://youtu.be/94ann0PCzO4?si=OTiLFnY6rBPCEUSv',
    'https://youtu.be/WiniiVzcQ24?si=oy8Gw8za6VRfWPI5',
  ];

  const [activeVideoIndex, setActiveVideoIndex] = useState(null);
  const tArray = (key) => {
    const value = t(key, { returnObjects: true });
    return Array.isArray(value) ? value : [];
  };

  const [media, setMedia] = useState(DEFAULT_MEDIA);

  const heroBackgroundUrl = useMemo(() => {
    const raw = String(media.heroBackgroundUrl || '').trim();
    if (!raw) return '';

    const normalized = raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')
      ? raw
      : `/${raw}`;

    try {
      return new URL(normalized, window.location.origin).toString();
    } catch {
      return normalized;
    }
  }, [media.heroBackgroundUrl]);

  const [formData, setFormData] = useState({
    from_name: '',
    phone: '',
    city: '',
    age: '',
    nationality: '',
    nationality_other: '',
    living_country: '',
    living_country_other: '',
    budget: '',
    employment_status: '',
    profession: '',
    marital_status: '',
    has_children: '',
    legal_where: '',
    planned_live_where: '',
    indonesia_duration: '',
    services: [],
    wedding_date: '',
    partner_age: '',
    partner_city: '',
    partner_marital_status: '',
    partner_has_children: '',
    partner_children_count: '',
    partner_children_live_with_us: '',
    honeymoon_plan: '',
  });
  const [mobileTab, setMobileTab] = useState('planlama');
  const [documentsPlace, setDocumentsPlace] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizStepIndex, setQuizStepIndex] = useState(0);
  const [quizError, setQuizError] = useState('');

  const mobileBasePath = useMemo(() => {
    const path = String(location.pathname || '');
    return path.startsWith('/evlilik') ? '/evlilik' : '/wedding';
  }, [location.pathname]);

  const routeMobileTab = useMemo(() => {
    const raw = String(params?.tab || '').trim().toLowerCase();
    if (!raw) return '';
    // normalize
    if (raw === 'belgeler') return 'belgeler';
    if (raw === 'surec' || raw === 'süreç') return 'surec';
    if (raw === 'rehberlik') return 'rehberlik';
    if (raw === 'planlama') return 'planlama';
    return '';
  }, [params?.tab]);

  useEffect(() => {
    if (!routeMobileTab) return;
    setMobileTab(routeMobileTab);
  }, [routeMobileTab]);

  useEffect(() => {
    if (mobileTab !== 'rehberlik') return;
    trackClick('wedding_app_view_rehberlik', { page: String(location?.pathname || '') || '/' });
  }, [mobileTab, location?.pathname]);

  useEffect(() => {
    const page = String(location?.pathname || '') || '/';
    trackClick('landing_wedding', { page });
    try {
      const ref = String(document?.referrer || '').trim();
      const isDirect = !ref || (typeof window !== 'undefined' && !ref.startsWith(window.location.origin));
      if (isDirect) trackClick('landing_wedding_direct', { page });
    } catch {
      // ignore
    }
  }, [location?.pathname]);

  useEffect(() => {
    if (!routeMobileTab) return;
    if (mobileTab !== routeMobileTab) return;

    const sectionIdByTab = {
      belgeler: 'wedding-documents',
      surec: 'wedding-process',
      rehberlik: 'wedding-services',
      planlama: 'wedding-form',
    };

    const sectionId = sectionIdByTab[routeMobileTab];
    if (!sectionId) return;

    const scrollToSection = () => {
      const el = document.getElementById(sectionId);
      if (!el) return;
      el.scrollIntoView({ behavior: 'auto', block: 'start' });
    };

    // Wait for conditional tab content to mount.
    requestAnimationFrame(() => requestAnimationFrame(scrollToSection));
  }, [routeMobileTab, mobileTab]);

  useEffect(() => {
    try {
      const stored = window.localStorage?.getItem('weddingDocumentsPlace') || '';
      if (stored === 'tr' || stored === 'id') {
        setDocumentsPlace(stored);
        return;
      }

      // Desktop'ta (ve ilk girişte) belgeler boş kalmasın: dili baz alıp varsayılan seç.
      const raw = String(i18n?.language || 'tr').trim().toLowerCase();
      const base = raw.split('-')[0] === 'in' ? 'id' : raw.split('-')[0];
      setDocumentsPlace(base === 'id' ? 'id' : 'tr');
    } catch {
      // ignore
    }
  }, [i18n?.language]);

  useEffect(() => {
    if (!documentsPlace) return;
    try {
      window.localStorage?.setItem('weddingDocumentsPlace', documentsPlace);
    } catch {
      // ignore
    }
  }, [documentsPlace]);

  const openPlanForm = () => {
    trackClick('wedding_click:open_plan_form', { page: String(location?.pathname || '') || '/' });

    const targetPath = `${mobileBasePath}/app/planlama`;
    const currentPath = String(location?.pathname || '') || '';
    if (currentPath !== targetPath) {
      navigate(targetPath);
      return;
    }

    setMobileTab('planlama');
    requestAnimationFrame(() => {
      const el = document.getElementById('wedding-form');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const goToPlanningForm = () => {
    trackClick('wedding_click:go_to_planlama', { page: String(location?.pathname || '') || '/' });
    // If we're on the mobile tab route (/wedding/app/:tab), change the route so the tab state doesn't override.
    if (routeMobileTab) {
      navigate(`${mobileBasePath}/app/planlama`);
      return;
    }

    openPlanForm();
  };

  const renderRehberlik = () => (
    <div id="wedding-services" className="space-y-6 scroll-mt-24">
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-6 rounded-xl shadow-lg border border-rose-100">
        <h3
          className="text-2xl font-bold text-rose-600 mb-5"
          style={{ fontFamily: '"Poppins", sans-serif' }}
        >
          {t('weddingPage.intro.servicesTitle')}
        </h3>

        <div className="grid grid-cols-1 gap-4 mb-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
          {tArray('weddingPage.intro.cards').map((card, idx) => (
            <div key={idx} className="bg-white/80 rounded-lg p-4 shadow-sm border border-rose-100">
              <h4 className="font-semibold text-rose-600 mb-2 text-sm">{card.title}</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {(card.items || []).map((item, itemIdx) => (
                  <li key={itemIdx}>✓ {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-2 pt-5 border-t border-rose-200">
          <h4
            className="text-lg font-bold text-rose-600 mb-2"
            style={{ fontFamily: '"Poppins", sans-serif' }}
          >
            {t('weddingPage.intro.flexibleTitle')}
          </h4>
          <p className="text-gray-700 leading-relaxed text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.intro.flexibleP1')}
          </p>
          <p
            className="text-gray-700 leading-relaxed mt-3 text-sm"
            style={{ fontFamily: '"Poppins", sans-serif' }}
          >
            {t('weddingPage.intro.flexibleP2')}
          </p>
          <p className="text-xs font-light text-gray-600 mt-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.intro.flexibleNote')}
          </p>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="relative rounded-3xl overflow-hidden shadow-xl h-56">
          <img
            src={media.introImage1Url}
            alt={t('weddingPage.images.prepAlt')}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative rounded-3xl overflow-hidden shadow-xl">
          <img
            src={media.introImage2Url}
            alt={t('weddingPage.images.ceremonyAlt')}
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    </div>
  );

  const renderSurec = () => (
    <div id="wedding-process" className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 space-y-4 scroll-mt-24">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
          {t('weddingPage.process.title')}
        </h2>
        <p className="text-gray-600 text-center text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
          {t('weddingPage.process.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tArray('weddingPage.steps').map((step, idx) => (
          <div key={idx} className="flex flex-col items-start bg-white border border-rose-100 rounded-xl p-4 shadow-sm">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-50 text-rose-600 mb-3">
              <span className="font-semibold text-sm">{idx + 1}</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {step.title}
            </h4>
            <p className="text-xs text-gray-600" style={{ fontFamily: '"Poppins", sans-serif' }}>{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const quizSteps = useMemo(() => {
    const steps = [
      { id: 'personal' },
      { id: 'nationality' },
      { id: 'livingCountry' },
      { id: 'employment' },
      { id: 'profession' },
      { id: 'marital' },
      { id: 'children' },
      { id: 'legalWhere' },
      { id: 'plannedLiveWhere' },
      { id: 'budget' },
    ];

    // Only ask "How long in Indonesia?" if they plan to live in Turkey.
    if (formData.planned_live_where === 'tr') {
      steps.push({ id: 'indonesiaDuration' });
    }

    steps.push(
      { id: 'weddingDate' },
      { id: 'partnerAge' },
      { id: 'partnerCity' },
      { id: 'partnerMarital' },
    );

    if (formData.partner_marital_status === 'widowed' || formData.partner_marital_status === 'divorced') {
      steps.push({ id: 'partnerChildren' });
    }

    steps.push({ id: 'services' });
    return steps;
  }, [formData.partner_marital_status, formData.planned_live_where]);

  useEffect(() => {
    if (!quizStarted) return;
    if (quizStepIndex < quizSteps.length) return;
    setQuizStepIndex(Math.max(0, quizSteps.length - 1));
  }, [quizStarted, quizStepIndex, quizSteps.length]);

  const requiredText = (value) => String(value || '').trim().length > 0;
  const requiredYesNo = (value) => value === 'yes' || value === 'no';
  const requiredYesNoLater = (value) => value === 'yes' || value === 'no' || value === 'later';
  const requiredTrIdOther = (value) => value === 'tr' || value === 'id' || value === 'other';

  const validateQuizStep = (stepId) => {
    if (stepId === 'personal') {
      if (!requiredText(formData.from_name)) return t('weddingPage.plan.quiz.errors.required');
      if (!requiredText(formData.age)) return t('weddingPage.plan.quiz.errors.required');
      if (!requiredText(formData.city)) return t('weddingPage.plan.quiz.errors.required');
      if (!requiredText(formData.phone)) return t('weddingPage.plan.quiz.errors.required');
      return '';
    }

    if (stepId === 'nationality') {
      if (!requiredTrIdOther(formData.nationality)) return t('weddingPage.plan.quiz.errors.required');
      if (formData.nationality === 'other' && !requiredText(formData.nationality_other)) return t('weddingPage.plan.quiz.errors.required');
      return '';
    }

    if (stepId === 'livingCountry') {
      if (!requiredTrIdOther(formData.living_country)) return t('weddingPage.plan.quiz.errors.required');
      if (formData.living_country === 'other' && !requiredText(formData.living_country_other)) return t('weddingPage.plan.quiz.errors.required');
      return '';
    }

    if (stepId === 'employment') return requiredText(formData.employment_status) ? '' : t('weddingPage.plan.quiz.errors.required');
    if (stepId === 'profession') return requiredText(formData.profession) ? '' : t('weddingPage.plan.quiz.errors.required');
    if (stepId === 'marital') return requiredText(formData.marital_status) ? '' : t('weddingPage.plan.quiz.errors.required');
    if (stepId === 'children') return requiredYesNo(formData.has_children) ? '' : t('weddingPage.plan.quiz.errors.required');
    if (stepId === 'legalWhere') return requiredText(formData.legal_where) ? '' : t('weddingPage.plan.quiz.errors.required');
    if (stepId === 'plannedLiveWhere') return requiredText(formData.planned_live_where) ? '' : t('weddingPage.plan.quiz.errors.required');
    if (stepId === 'budget') return requiredText(formData.budget) ? '' : t('weddingPage.plan.quiz.errors.required');
    if (stepId === 'indonesiaDuration') return requiredText(formData.indonesia_duration) ? '' : t('weddingPage.plan.quiz.errors.required');
    if (stepId === 'weddingDate') return requiredText(formData.wedding_date) ? '' : t('weddingPage.plan.quiz.errors.required');
    if (stepId === 'partnerAge') return requiredText(formData.partner_age) ? '' : t('weddingPage.plan.quiz.errors.required');
    if (stepId === 'partnerCity') return requiredText(formData.partner_city) ? '' : t('weddingPage.plan.quiz.errors.required');
    if (stepId === 'partnerMarital') return requiredText(formData.partner_marital_status) ? '' : t('weddingPage.plan.quiz.errors.required');

    if (stepId === 'partnerChildren') {
      if (!requiredYesNo(formData.partner_has_children)) return t('weddingPage.plan.quiz.errors.required');
      if (formData.partner_has_children === 'yes') {
        if (!requiredText(formData.partner_children_count)) return t('weddingPage.plan.quiz.errors.required');
        if (!requiredYesNo(formData.partner_children_live_with_us)) return t('weddingPage.plan.quiz.errors.required');
      }
      return '';
    }

    if (stepId === 'services') return requiredYesNoLater(formData.honeymoon_plan) ? '' : t('weddingPage.plan.quiz.errors.required');

    return '';
  };

  const goNextQuizStep = () => {
    const current = quizSteps[quizStepIndex];
    if (!current) return;
    const err = validateQuizStep(current.id);
    if (err) {
      setQuizError(err);
      return;
    }
    setQuizError('');
    setQuizStepIndex((prev) => Math.min(prev + 1, quizSteps.length - 1));
  };

  const goPrevQuizStep = () => {
    setQuizError('');
    setQuizStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const formatQuizValue = (value) => {
    const v = String(value ?? '').trim();
    return v || '-';
  };

  const buildQuizWhatsAppMessage = () => {
    const yesNo = (value) => (value === 'yes' ? t('weddingPage.plan.quiz.options.yes') : t('weddingPage.plan.quiz.options.no'));
    const country = (value) => (value === 'tr' ? t('weddingPage.plan.quiz.options.turkiye') : t('weddingPage.plan.quiz.options.indonesia'));
    const yesNoLater = (value) => {
      if (value === 'later') return t('weddingPage.plan.quiz.options.later');
      return requiredYesNo(String(value)) ? yesNo(value) : '-';
    };

    const trIdOtherToText = (value, otherText) => {
      if (value === 'tr') return t('weddingPage.plan.quiz.options.turkiye');
      if (value === 'id') return t('weddingPage.plan.quiz.options.indonesia');
      if (value === 'other') return formatQuizValue(otherText);
      return '-';
    };

    const employmentMap = {
      worker: t('weddingPage.plan.quiz.options.employment.worker'),
      civilServant: t('weddingPage.plan.quiz.options.employment.civilServant'),
      retired: t('weddingPage.plan.quiz.options.employment.retired'),
      publicEmployee: t('weddingPage.plan.quiz.options.employment.publicEmployee'),
      businessOwner: t('weddingPage.plan.quiz.options.employment.businessOwner'),
      other: t('weddingPage.plan.quiz.options.employment.other'),
    };

    const maritalMap = {
      single: t('weddingPage.plan.quiz.options.marital.single'),
      widowed: t('weddingPage.plan.quiz.options.marital.widowed'),
      divorced: t('weddingPage.plan.quiz.options.marital.divorced'),
      divorceInProgress: t('weddingPage.plan.quiz.options.marital.divorceInProgress'),
    };

    const partnerMaritalMap = {
      single: t('weddingPage.plan.quiz.options.partnerMarital.single'),
      widowed: t('weddingPage.plan.quiz.options.partnerMarital.widowed'),
      divorced: t('weddingPage.plan.quiz.options.partnerMarital.divorced'),
    };

    const selectedServices = (formData.services || [])
      .map((id) => t(`weddingPage.plan.form.services.options.${id}`))
      .filter(Boolean);

    const summaryText = t('weddingPage.plan.quiz.whatsapp.summaryTemplate', {
      nationality: trIdOtherToText(formData.nationality, formData.nationality_other),
      livingCountry: trIdOtherToText(formData.living_country, formData.living_country_other),
      legalWhere: formData.legal_where ? country(formData.legal_where) : '-',
      plannedLiveWhere: formData.planned_live_where ? country(formData.planned_live_where) : '-',
      budget: formatQuizValue(formData.budget),
    });

    const fillable = '…';

    const lines = [
      t('weddingPage.plan.quiz.whatsapp.intro'),
      `- ${t('weddingPage.plan.quiz.whatsapp.labels.summary')}: ${summaryText}`,
      '',
    ];

    const bullet = (label, value) => `- ${label}: ${value}`;

    lines.push(
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.name'), formatQuizValue(formData.from_name)),
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.age'), formatQuizValue(formData.age)),
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.city'), formatQuizValue(formData.city)),
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.phone'), formatQuizValue(formData.phone)),
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.nationality'), trIdOtherToText(formData.nationality, formData.nationality_other)),
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.livingCountry'), trIdOtherToText(formData.living_country, formData.living_country_other)),
      '',
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.employment'), employmentMap[formData.employment_status] || '-'),
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.profession'), formatQuizValue(formData.profession)),
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.maritalStatus'), maritalMap[formData.marital_status] || '-'),
      bullet(
        t('weddingPage.plan.quiz.whatsapp.labels.hasChildren'),
        requiredYesNo(String(formData.has_children)) ? yesNo(formData.has_children) : '-',
      ),
      '',
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.legalWhere'), formData.legal_where ? country(formData.legal_where) : '-'),
      bullet(
        t('weddingPage.plan.quiz.whatsapp.labels.plannedLiveWhere'),
        formData.planned_live_where ? country(formData.planned_live_where) : '-',
      ),
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.marriageMunicipality'), fillable),
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.budget'), formatQuizValue(formData.budget)),
    );

    if (formData.planned_live_where === 'tr') {
      lines.push(bullet(t('weddingPage.plan.quiz.whatsapp.labels.indonesiaDuration'), formatQuizValue(formData.indonesia_duration)));
    }

    lines.push(
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.weddingDate'), formatQuizValue(formData.wedding_date)),
      '',
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.partnerAge'), formatQuizValue(formData.partner_age)),
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.partnerCity'), formatQuizValue(formData.partner_city)),
      bullet(t('weddingPage.plan.quiz.whatsapp.labels.partnerMaritalStatus'), partnerMaritalMap[formData.partner_marital_status] || '-'),
    );

    if (formData.partner_marital_status === 'widowed' || formData.partner_marital_status === 'divorced') {
      lines.push(
        bullet(
          t('weddingPage.plan.quiz.whatsapp.labels.partnerHasChildren'),
          requiredYesNo(String(formData.partner_has_children)) ? yesNo(formData.partner_has_children) : '-',
        ),
      );
      if (formData.partner_has_children === 'yes') {
        lines.push(
          bullet(t('weddingPage.plan.quiz.whatsapp.labels.partnerChildrenCount'), formatQuizValue(formData.partner_children_count)),
        );
        lines.push(
          bullet(
            t('weddingPage.plan.quiz.whatsapp.labels.partnerChildrenLiveWithUs'),
            requiredYesNo(String(formData.partner_children_live_with_us)) ? yesNo(formData.partner_children_live_with_us) : '-',
          ),
        );
      }
    }

    lines.push('');
    lines.push(`- ${t('weddingPage.plan.quiz.whatsapp.labels.services')}:`);
    if (!selectedServices.length) {
      lines.push(`  - ${t('weddingPage.plan.quiz.whatsapp.none')}`);
    } else {
      selectedServices.forEach((s) => lines.push(`  - ${s}`));
    }

    lines.push('');
    lines.push(bullet(t('weddingPage.plan.quiz.whatsapp.labels.honeymoon'), yesNoLater(formData.honeymoon_plan)));

    lines.push('');
    lines.push(bullet(t('weddingPage.plan.quiz.whatsapp.labels.extraNote'), fillable));

    return lines.join('\n');
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    const current = quizSteps[quizStepIndex];
    if (current) {
      const err = validateQuizStep(current.id);
      if (err) {
        setQuizError(err);
        return;
      }
    }
    setQuizError('');
    trackClick('wedding_click:quiz_submit_whatsapp', { page: String(location?.pathname || '') || '/' });
    const message = buildQuizWhatsAppMessage();
    const url = buildWhatsAppUrl(message, { lang: String(i18n?.language || 'tr') });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderQuizStep = (stepId) => {
    const radioButton = (name, value, label) => (
      <button
        type="button"
        onClick={() => setFormData((prev) => ({ ...prev, [name]: value }))}
        className={
          'w-full rounded-xl px-4 py-3 text-sm font-semibold transition border text-center ' +
          (String(formData[name]) === String(value)
            ? 'bg-rose-600 text-white border-rose-600'
            : 'bg-white text-gray-800 border-gray-200 hover:border-rose-200')
        }
        style={{ fontFamily: '"Poppins", sans-serif' }}
      >
        {label}
      </button>
    );

    const countryRadio = (name) => (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {radioButton(name, 'tr', t('weddingPage.plan.quiz.options.turkiye'))}
        {radioButton(name, 'id', t('weddingPage.plan.quiz.options.indonesia'))}
        {radioButton(name, 'other', t('weddingPage.plan.quiz.options.other'))}
      </div>
    );

    if (stepId === 'personal') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.personal.desc')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('weddingPage.plan.form.sections.basicInfo.labels.name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="from_name"
                value={formData.from_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                placeholder={t('weddingPage.plan.form.sections.basicInfo.placeholders.name')}
                style={{ fontFamily: '"Poppins", sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('weddingPage.plan.form.sections.basicInfo.labels.age')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="18"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                placeholder={t('weddingPage.plan.form.sections.basicInfo.placeholders.age')}
                style={{ fontFamily: '"Poppins", sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('weddingPage.plan.form.sections.basicInfo.labels.city')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                placeholder={t('weddingPage.plan.form.sections.basicInfo.placeholders.city')}
                style={{ fontFamily: '"Poppins", sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('weddingPage.plan.form.sections.basicInfo.labels.phone')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                placeholder={t('weddingPage.plan.form.sections.basicInfo.placeholders.phone')}
                style={{ fontFamily: '"Poppins", sans-serif' }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (stepId === 'nationality') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.nationality.desc')}
          </p>

          {countryRadio('nationality')}

          {formData.nationality === 'other' ? (
            <div>
              <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('weddingPage.plan.quiz.fields.nationalityOther')}
              </label>
              <input
                type="text"
                name="nationality_other"
                value={formData.nationality_other}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                placeholder={t('weddingPage.plan.quiz.placeholders.nationalityOther')}
                style={{ fontFamily: '"Poppins", sans-serif' }}
              />
            </div>
          ) : null}
        </div>
      );
    }

    if (stepId === 'livingCountry') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.livingCountry.desc')}
          </p>

          {countryRadio('living_country')}

          {formData.living_country === 'other' ? (
            <div>
              <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('weddingPage.plan.quiz.fields.livingCountryOther')}
              </label>
              <input
                type="text"
                name="living_country_other"
                value={formData.living_country_other}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                placeholder={t('weddingPage.plan.quiz.placeholders.livingCountryOther')}
                style={{ fontFamily: '"Poppins", sans-serif' }}
              />
            </div>
          ) : null}
        </div>
      );
    }

    if (stepId === 'employment') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.employment.desc')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {radioButton('employment_status', 'worker', t('weddingPage.plan.quiz.options.employment.worker'))}
            {radioButton('employment_status', 'civilServant', t('weddingPage.plan.quiz.options.employment.civilServant'))}
            {radioButton('employment_status', 'retired', t('weddingPage.plan.quiz.options.employment.retired'))}
            {radioButton('employment_status', 'publicEmployee', t('weddingPage.plan.quiz.options.employment.publicEmployee'))}
            {radioButton('employment_status', 'businessOwner', t('weddingPage.plan.quiz.options.employment.businessOwner'))}
            {radioButton('employment_status', 'other', t('weddingPage.plan.quiz.options.employment.other'))}
          </div>
        </div>
      );
    }

    if (stepId === 'profession') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.profession.desc')}
          </p>
          <input
            type="text"
            name="profession"
            value={formData.profession}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
            placeholder={t('weddingPage.plan.quiz.placeholders.profession')}
            style={{ fontFamily: '"Poppins", sans-serif' }}
          />
        </div>
      );
    }

    if (stepId === 'marital') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.marital.desc')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {radioButton('marital_status', 'single', t('weddingPage.plan.quiz.options.marital.single'))}
            {radioButton('marital_status', 'widowed', t('weddingPage.plan.quiz.options.marital.widowed'))}
            {radioButton('marital_status', 'divorced', t('weddingPage.plan.quiz.options.marital.divorced'))}
            {radioButton('marital_status', 'divorceInProgress', t('weddingPage.plan.quiz.options.marital.divorceInProgress'))}
          </div>
        </div>
      );
    }

    if (stepId === 'children') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.children.desc')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {radioButton('has_children', 'yes', t('weddingPage.plan.quiz.options.yes'))}
            {radioButton('has_children', 'no', t('weddingPage.plan.quiz.options.no'))}
          </div>
        </div>
      );
    }

    if (stepId === 'legalWhere') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.legalWhere.desc')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {radioButton('legal_where', 'tr', t('weddingPage.plan.quiz.options.turkiye'))}
            {radioButton('legal_where', 'id', t('weddingPage.plan.quiz.options.indonesia'))}
          </div>
        </div>
      );
    }

    if (stepId === 'plannedLiveWhere') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.plannedLiveWhere.desc')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {radioButton('planned_live_where', 'id', t('weddingPage.plan.quiz.options.indonesia'))}
            {radioButton('planned_live_where', 'tr', t('weddingPage.plan.quiz.options.turkiye'))}
          </div>
        </div>
      );
    }

    if (stepId === 'budget') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.budget.desc')}
          </p>
          <input
            type="text"
            inputMode="numeric"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
            placeholder={t('weddingPage.plan.form.sections.basicInfo.placeholders.budget')}
            style={{ fontFamily: '"Poppins", sans-serif' }}
          />
          <p className="text-xs text-gray-600" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.form.sections.basicInfo.hints.budget')}
          </p>
        </div>
      );
    }

    if (stepId === 'indonesiaDuration') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.indonesiaDuration.desc')}
          </p>
          <input
            type="text"
            name="indonesia_duration"
            value={formData.indonesia_duration}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
            placeholder={t('weddingPage.plan.quiz.placeholders.indonesiaDuration')}
            style={{ fontFamily: '"Poppins", sans-serif' }}
          />
        </div>
      );
    }

    if (stepId === 'weddingDate') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.weddingDate.desc')}
          </p>
          <input
            type="date"
            name="wedding_date"
            value={formData.wedding_date}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
            style={{ fontFamily: '"Poppins", sans-serif' }}
          />
        </div>
      );
    }

    if (stepId === 'partnerAge') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.partnerAge.desc')}
          </p>
          <input
            type="number"
            name="partner_age"
            value={formData.partner_age}
            onChange={handleChange}
            min="18"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
            placeholder={t('weddingPage.plan.quiz.placeholders.partnerAge')}
            style={{ fontFamily: '"Poppins", sans-serif' }}
          />
        </div>
      );
    }

    if (stepId === 'partnerCity') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.partnerCity.desc')}
          </p>
          <input
            type="text"
            name="partner_city"
            value={formData.partner_city}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
            placeholder={t('weddingPage.plan.quiz.placeholders.partnerCity')}
            style={{ fontFamily: '"Poppins", sans-serif' }}
          />
        </div>
      );
    }

    if (stepId === 'partnerMarital') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.partnerMarital.desc')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {radioButton('partner_marital_status', 'single', t('weddingPage.plan.quiz.options.partnerMarital.single'))}
            {radioButton('partner_marital_status', 'widowed', t('weddingPage.plan.quiz.options.partnerMarital.widowed'))}
            {radioButton('partner_marital_status', 'divorced', t('weddingPage.plan.quiz.options.partnerMarital.divorced'))}
          </div>
        </div>
      );
    }

    if (stepId === 'partnerChildren') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.partnerChildren.desc')}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {radioButton('partner_has_children', 'yes', t('weddingPage.plan.quiz.options.yes'))}
            {radioButton('partner_has_children', 'no', t('weddingPage.plan.quiz.options.no'))}
          </div>

          {formData.partner_has_children === 'yes' ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('weddingPage.plan.quiz.fields.partnerChildrenCount')}
                </label>
                <input
                  type="number"
                  name="partner_children_count"
                  value={formData.partner_children_count}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
                  placeholder={t('weddingPage.plan.quiz.placeholders.partnerChildrenCount')}
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                />
              </div>

              <div>
                <p className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('weddingPage.plan.quiz.fields.partnerChildrenLiveWithUs')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {radioButton('partner_children_live_with_us', 'yes', t('weddingPage.plan.quiz.options.yes'))}
                  {radioButton('partner_children_live_with_us', 'no', t('weddingPage.plan.quiz.options.no'))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    if (stepId === 'services') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.plan.quiz.steps.services.desc')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceOptions.map((service) => (
              <button
                type="button"
                key={service.id}
                onClick={() => handleServiceChange(service.id)}
                className={
                  `flex items-center justify-between w-full px-4 py-3 rounded-xl border text-sm transition-all duration-150 ` +
                  (formData.services.includes(service.id)
                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-rose-300 hover:bg-rose-50/60')
                }
                style={{ fontFamily: '"Poppins", sans-serif' }}
              >
                <span>{service.label}</span>
                {formData.services.includes(service.id) && (
                  <CheckCircle size={16} className="text-rose-500 ml-2" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50/60 p-4">
            <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('weddingPage.plan.quiz.steps.honeymoon.title')}
            </p>
            <p className="text-xs text-gray-700 mt-1" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('weddingPage.plan.quiz.steps.honeymoon.desc')}
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {radioButton('honeymoon_plan', 'yes', t('weddingPage.plan.quiz.options.yes'))}
              {radioButton('honeymoon_plan', 'no', t('weddingPage.plan.quiz.options.no'))}
              {radioButton('honeymoon_plan', 'later', t('weddingPage.plan.quiz.options.later'))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderPlan = () => (
    <div id="wedding-form" className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 scroll-mt-24">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center" style={{ fontFamily: '"Poppins", sans-serif' }}>
        {t('weddingPage.plan.title')}
      </h2>
      <p className="text-gray-600 text-center mb-8 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
        {t('weddingPage.plan.subtitle')}
      </p>

      <div className="mb-6 rounded-xl border border-rose-100 bg-rose-50/60 p-4">
        <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: '"Poppins", sans-serif' }}>
          {t('weddingPage.plan.quiz.introTitle')}
        </p>
        <p className="text-xs text-gray-700 mt-1" style={{ fontFamily: '"Poppins", sans-serif' }}>
          {t('weddingPage.plan.quiz.introText')}
        </p>

        {tArray('weddingPage.plan.quiz.introItems').length ? (
          <ul
            className="mt-3 space-y-2 text-xs text-gray-700 list-disc list-inside"
            style={{ fontFamily: '"Poppins", sans-serif' }}
          >
            {tArray('weddingPage.plan.quiz.introItems').map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
        <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: '"Poppins", sans-serif' }}>
          {t('weddingPage.plan.why.title')}
        </p>
        <p className="text-xs text-gray-700 mt-2 leading-relaxed" style={{ fontFamily: '"Poppins", sans-serif' }}>
          {t('weddingPage.plan.why.text')}
        </p>
      </div>

      {quizError ? (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>{quizError}</p>
        </div>
      ) : null}

      {!quizStarted ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setQuizStarted(true);
              setQuizStepIndex(0);
              setQuizError('');
            }}
            className="w-full bg-rose-600 text-white py-3.5 rounded-xl font-semibold hover:bg-rose-700 transition shadow-lg"
            style={{ fontFamily: '"Poppins", sans-serif' }}
          >
            {t('weddingPage.plan.quiz.start')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleQuizSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('weddingPage.plan.quiz.progress', { current: quizStepIndex + 1, total: quizSteps.length })}
            </p>
          </div>

          <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/60">
            <h3 className="text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t(`weddingPage.plan.quiz.steps.${quizSteps[quizStepIndex]?.id}.title`)}
            </h3>
            {renderQuizStep(quizSteps[quizStepIndex]?.id)}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goPrevQuizStep}
              disabled={quizStepIndex === 0}
              className={
                'flex-1 py-3 rounded-xl font-semibold border transition ' +
                (quizStepIndex === 0
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-rose-200')
              }
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              {t('weddingPage.plan.quiz.back')}
            </button>

            {quizStepIndex < quizSteps.length - 1 ? (
              <button
                type="button"
                onClick={goNextQuizStep}
                className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700 transition shadow-sm"
                style={{ fontFamily: '"Poppins", sans-serif' }}
              >
                {t('weddingPage.plan.quiz.next')}
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700 transition shadow-sm"
                style={{ fontFamily: '"Poppins", sans-serif' }}
              >
                {t('weddingPage.plan.quiz.submit')}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div id="wedding-documents" className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100 scroll-mt-24">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 text-center" style={{ fontFamily: '"Poppins", sans-serif' }}>
        {t('weddingPage.documents.title')}
      </h2>
      <p className="text-gray-600 text-center mb-8 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
        {t('weddingPage.documents.subtitle')}
      </p>
      <p className="text-gray-500 text-center mb-8 text-xs flex items-center justify-center gap-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
        <AlertCircle size={14} className="text-gray-400" />
        <span>{t('weddingPage.documents.disclaimer')}</span>
      </p>

      {/* Ülkeye göre belge listesi değişiyor */}
      <div className="mb-6">
        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
          <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.mobileDocuments.question.title')}
          </p>
          <p className="text-xs text-gray-700 mt-1" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.mobileDocuments.question.hint')}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDocumentsPlace('id')}
              className={
                'rounded-xl px-3 py-2 text-xs font-semibold border transition ' +
                (documentsPlace === 'id'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-gray-800 border-rose-200')
              }
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              {t('weddingPage.mobileDocuments.question.options.indonesia')}
            </button>
            <button
              type="button"
              onClick={() => setDocumentsPlace('tr')}
              className={
                'rounded-xl px-3 py-2 text-xs font-semibold border transition ' +
                (documentsPlace === 'tr'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-gray-800 border-rose-200')
              }
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              {t('weddingPage.mobileDocuments.question.options.turkiye')}
            </button>
          </div>
        </div>
      </div>

      {documentsPlace === 'tr' ? (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.mobileDocuments.trRequirements.title')}
          </p>
          <p className="text-xs text-gray-700 mt-1" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {t('weddingPage.mobileDocuments.trRequirements.note')}
          </p>

          <div className="mt-4 space-y-3" style={{ fontFamily: '"Poppins", sans-serif' }}>
            {tArray('weddingPage.mobileDocuments.trRequirements.steps').map((step, idx) => (
              <div key={idx} className="rounded-xl border border-rose-200/70 bg-white/70 p-3">
                <p className="text-xs font-bold text-gray-900">{step.title}</p>
                {step.intro ? <p className="text-[11px] text-gray-700 mt-1">{step.intro}</p> : null}
                {(step.items || []).length ? (
                  <ul className="mt-2 space-y-1 text-[11px] text-gray-700 list-disc list-inside">
                    {(step.items || []).map((item, itemIdx) => (
                      <li
                        key={itemIdx}
                        className={
                          String(item || '').includes('Endonezya vatandaşı için gerekli belgeler') ||
                          String(item || '').includes('Türk vatandaşı')
                          || String(item || '').trim().startsWith('👩')
                          || String(item || '').trim().startsWith('👨')
                            ? 'font-extrabold text-gray-900 text-[12px]'
                            : undefined
                        }
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {(step.notes || []).length ? (
                  <div className="mt-2 space-y-1">
                    {(step.notes || []).map((n, nIdx) => (
                      <p key={nIdx} className="text-[11px] text-gray-700">{n}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <a
            href={buildWhatsAppUrl(t('weddingPage.mobileDocuments.trRequirements.whatsappMessage'), { lang: String(i18n?.language || 'tr') })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick('wedding_click:whatsapp_tr_requirements', { page: String(location?.pathname || '') || '/' })}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 text-sm font-semibold shadow-lg ring-1 ring-white/20 hover:shadow-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
          >
            <MessageCircle size={16} />
            {t('weddingPage.mobileDocuments.trRequirements.action')}
          </a>
        </div>
      ) : null}

      {(documentsPlace === 'tr') ? null : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-full flex flex-col">
          <h3 className="text-xl font-bold text-rose-600 mb-3">{t('weddingPage.documents.foreignSpouse.title')}</h3>
          <p className="text-gray-600 text-sm mb-3">{t('weddingPage.documents.foreignSpouse.intro')}</p>
          <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
            {tArray('weddingPage.documents.foreignSpouse.items').map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-full flex flex-col">
          <h3 className="text-xl font-bold text-rose-600 mb-3">{t('weddingPage.documents.indonesianSpouse.title')}</h3>
          <p className="text-gray-600 text-sm mb-3">{t('weddingPage.documents.indonesianSpouse.intro')}</p>
          <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
            {tArray('weddingPage.documents.indonesianSpouse.items').map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      )}

      {(documentsPlace === 'tr') ? null : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-rose-600 mb-3">{t('weddingPage.documents.extras.title')}</h3>
          <p className="text-gray-600 text-sm mb-3">{t('weddingPage.documents.extras.intro')}</p>
          <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
            {tArray('weddingPage.documents.extras.items').map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
          <h3 className="text-lg font-bold text-blue-700 mb-3">{t('weddingPage.documents.importantNotes.title')}</h3>
          <ul className="space-y-2 text-sm text-blue-900 list-disc list-inside">
            {tArray('weddingPage.documents.importantNotes.items').map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 shadow-sm">
          <h3 className="text-lg font-bold text-yellow-800 mb-3">{t('weddingPage.documents.personalDifferences.title')}</h3>
          <p className="text-sm text-yellow-900 mb-2">{t('weddingPage.documents.personalDifferences.p1')}</p>
          <p className="text-sm text-yellow-900">{t('weddingPage.documents.personalDifferences.p2')}</p>
        </div>
      </div>
      )}

      {(documentsPlace === 'tr') ? null : (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('weddingPage.documents.faqTitle')}</h3>
        <div className="space-y-3 text-sm text-gray-700">
          {faqItems.map((item, idx) => (
            <div key={idx}>
              <p className="font-semibold">{item.q}</p>
              <p>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
      )}

      {(documentsPlace === 'tr') ? null : (
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-6 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
        <div>
          <h3 className="text-lg font-bold mb-1">{t('weddingPage.documents.whatsappCta.title')}</h3>
          <p className="text-sm opacity-90">{t('weddingPage.documents.whatsappCta.description')}</p>
        </div>
        <a
          href={buildWhatsAppUrl(t('weddingPage.documents.whatsappCta.message'), { lang: String(i18n?.language || 'tr') })}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClick('wedding_click:whatsapp_documents_cta', { page: String(location?.pathname || '') || '/' })}
          className="inline-flex items-center gap-2 bg-white text-rose-600 px-6 py-3 rounded-xl font-bold hover:bg-rose-50 transition shadow-md"
        >
          <MessageCircle size={20} />
          {t('weddingPage.documents.whatsappCta.action')}
        </a>
      </div>
      )}
    </div>
  );

  const faqItems = useMemo(() => {
    const items = t('weddingPage.faq.items', { returnObjects: true });
    return Array.isArray(items) ? items : [];
  }, [t]);

  const faqSchema = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };
  }, [faqItems]);

  useEffect(() => {
    let cancelled = false;

    async function loadMedia() {
      try {
        const snap = await getDoc(doc(db, 'weddingContent', 'media'));
        const data = snap.exists() ? snap.data() || {} : {};
        if (cancelled) return;
        const heroFromDb = String(data.heroBackgroundUrl || '').trim();
        setMedia({
          heroBackgroundUrl: heroFromDb || DEFAULT_MEDIA.heroBackgroundUrl,
          introImage1Url: String(data.introImage1Url || DEFAULT_MEDIA.introImage1Url),
          introImage2Url: String(data.introImage2Url || DEFAULT_MEDIA.introImage2Url),
        });
      } catch (err) {
        // Public sayfa: rules izin vermezse yine de sayfa çalışsın.
        console.warn('Wedding media load failed (fallback to defaults):', err);
      }
    }

    loadMedia();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [faqSchema]);

  const serviceOptionIds = useMemo(
    () => [
      'communicationInterpretation',
      'research',
      'documentCollection',
      'legalFollowUp',
      'flightTicket',
      'accommodation',
      'localTransport',
      'postMarriage',
      'visaResidence',
    ],
    [],
  );

  const serviceOptions = useMemo(() => {
    return serviceOptionIds.map((id) => ({
      id,
      label: t(`weddingPage.plan.form.services.options.${id}`),
    }));
  }, [serviceOptionIds, t]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleServiceChange = (serviceId) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation variant="heroOverlay" />
      
      {/* Hero Section */}
      <section
        className="-mt-[72px] pt-[72px] md:mt-0 md:pt-20 pb-16 px-4 relative overflow-hidden min-h-[420px] sm:min-h-[480px] md:min-h-96 bg-slate-900 bg-none md:bg-[image:var(--hero-bg)] bg-scroll md:bg-fixed bg-[position:center] md:bg-[position:center_35%] bg-no-repeat md:bg-cover"
        style={{
      '--hero-bg': heroBackgroundUrl ? `url("${heroBackgroundUrl}")` : 'none',
        }}
      >
        {heroBackgroundUrl && (
          <img
            src={heroBackgroundUrl}
            alt=""
            aria-hidden="true"
            className="md:hidden absolute inset-0 w-full h-full object-contain object-center"
            loading="eager"
            decoding="async"
          />
        )}

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center justify-end text-center min-h-[420px] sm:min-h-[480px] md:min-h-96">
          {/* Mobilde logo+badge: görselin üstüne overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center md:static md:top-auto md:left-auto md:translate-x-0">
            <img
              src={BRAND_LOGO_SRC}
              alt="Turk&Indo"
              className="hidden md:block h-14 md:h-20 w-auto mb-3 translate-x-0 md:translate-x-[10cm] drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
              loading="eager"
              decoding="async"
            />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/80 shadow-md mb-3 translate-x-0 md:translate-x-[10cm]">
              <Heart size={18} className="text-white" />
              <span className="hidden md:inline text-[10px] md:text-[11px] font-medium uppercase tracking-wide text-white drop-shadow-md">
				    {t('weddingPage.hero.badge')}
              </span>
            </div>
          </div>

          <div className="hidden md:block md:translate-y-3">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-3 drop-shadow-[0_6px_20px_rgba(0,0,0,0.65)]">
              {t('weddingPage.hero.title')}
            </h1>

            <p className="text-xs md:text-sm text-white/95 max-w-2xl mb-5 md:mb-6 leading-relaxed drop-shadow-[0_4px_14px_rgba(0,0,0,0.7)]">
              {t('weddingPage.hero.description')}
            </p>
          </div>
        </div>
        <HeroSocialButtons />
      </section>

      {/* Banner sonrası: beyaz alanda butonlar */}
      <div className="bg-white px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
            <button
              type="button"
              onClick={() => {
                openPlanForm();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose-600 text-white px-5 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-xs md:text-sm shadow-md hover:bg-rose-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <Heart size={18} className="text-white" />
              {t('weddingPage.hero.actions.openForm')}
            </button>

            <Link
              to="/eslestirme"
              onClick={() => trackClick('wedding_click:go_matchmaking_hub', { page: String(location?.pathname || '') || '/' })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 text-white px-5 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-xs md:text-sm shadow-md hover:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <MessageCircle size={18} className="text-white" />
              {t('weddingPage.hero.actions.matchmakingHub')}
            </Link>

            <Link
              to="/aracilik"
              onClick={() => {
                try {
                  void trackClick('wedding_click:go_lead_apply', { page: String(location?.pathname || '') || '/' });
                } catch {
                  // ignore
                }
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-xs md:text-sm shadow-md hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <MessageCircle size={18} className="text-white" />
              {t('navigation.leadApply')}
            </Link>

            <a
              href={buildWhatsAppUrl(t('weddingPage.whatsapp.quickChatMessage'), { lang: String(i18n?.language || 'tr') })}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('wedding_click:whatsapp_quick_chat', { page: String(location?.pathname || '') || '/' })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-rose-700 px-5 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-xs md:text-sm border border-rose-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <Phone size={18} className="text-rose-500" />
              {t('weddingPage.hero.actions.quickChat')}
            </a>
          </div>

          <p className="mt-3 text-center text-[11px] md:text-xs text-slate-500">
            {t('weddingPage.hero.actions.matchmakingHint')}
          </p>

          <div className="mt-4 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 text-slate-700" />
                <p className="text-sm text-slate-800 leading-relaxed">
                  {t('weddingPage.publicNote.p1')}{' '}
                  <Link
                    to="/eslestirme"
                    onClick={() =>
                      trackClick('wedding_note:go_matchmaking', { page: String(location?.pathname || '') || '/' })
                    }
                    className="font-semibold underline underline-offset-2 text-slate-900 hover:text-slate-900"
                  >
                    {t('weddingPage.publicNote.link')}
                  </Link>
                  {t('weddingPage.publicNote.p2')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {youtubeVideos.slice(0, 3).map((videoUrl, idx) => {
              const videoId = parseYouTubeId(videoUrl);
              const isActive = activeVideoIndex === idx;
              const thumb = videoId ? staticAssetUrl(`/youtube-thumbs/${videoId}.jpg`) : '';
              const embed = videoId
                ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
                : '';

              const handleThumbError = (e) => {
                try {
                  const img = e?.currentTarget;
                  if (!img || !videoId) return;

                  const step = Number(img?.dataset?.fallbackStep || '0');
                  if (step === 0) {
                    img.dataset.fallbackStep = '1';
                    img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    return;
                  }
                  if (step === 1) {
                    img.dataset.fallbackStep = '2';
                    img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                    return;
                  }
                  if (step === 2) {
                    img.dataset.fallbackStep = '3';
                    img.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
                    return;
                  }

                  img.dataset.fallbackStep = '4';
                  img.onerror = null;
                  img.src = FALLBACK_THUMB_DATA_URL;
                } catch {
                  // ignore
                }
              };

              return (
                <div
                  key={`${videoId || 'video'}_${idx}`}
                  className={
                    'rounded-3xl border border-rose-100 bg-white overflow-hidden shadow-sm ' +
                    (idx === 0 ? '' : 'hidden sm:block')
                  }
                >
                  <div className="relative w-full pt-[56.25%]">
                    {isActive && embed ? (
                      <iframe
                        className="absolute inset-0 h-full w-full"
                        src={embed}
                        title={`YouTube video ${idx + 1}`}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveVideoIndex(idx)}
                        className="absolute inset-0 w-full h-full text-left"
                        aria-label="Videoyu oynat"
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                            onError={handleThumbError}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                            Video önizlemesi
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full bg-white/95 border border-rose-100 px-3 py-1 text-[11px] font-semibold text-slate-900 shadow-sm">
                          Oynat
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 pb-28 sm:pb-16">
        {/* Mobil App Görünümü */}
        <div className="sm:hidden">
          <div className="space-y-8">
            {mobileTab === 'rehberlik' ? renderRehberlik() : null}
            {mobileTab === 'surec' ? renderSurec() : null}
            {mobileTab === 'planlama' ? renderPlan() : null}
            {mobileTab === 'belgeler' ? renderDocuments() : null}
          </div>
        </div>

        {/* Masaüstü: Mobildeki "app tab" deneyimini kullan */}
        <div className="hidden sm:block">
          <div className="mb-8 rounded-2xl bg-slate-950/90 backdrop-blur border border-white/10 p-3 shadow-sm">
            <div className="grid grid-cols-4 gap-2">
              <Link
                to={`${mobileBasePath}/app/rehberlik`}
                aria-current={mobileTab === 'rehberlik' ? 'page' : undefined}
                className={
                  'app-btn h-11 w-full px-4 ring-offset-slate-950 ' +
                  (mobileTab === 'rehberlik'
                    ? 'app-btn-primary'
                    : 'app-btn-primary-light opacity-85 hover:opacity-100')
                }
              >
                {t('weddingPage.mobileTabs.guidance')}
                <Compass />
              </Link>

              <Link
                to={`${mobileBasePath}/app/surec`}
                aria-current={mobileTab === 'surec' ? 'page' : undefined}
                className={
                  'app-btn h-11 w-full px-4 ring-offset-slate-950 ' +
                  (mobileTab === 'surec'
                    ? 'app-btn-primary'
                    : 'app-btn-primary-light opacity-85 hover:opacity-100')
                }
              >
                {t('weddingPage.mobileTabs.process')}
                <Route />
              </Link>

              <Link
                to={`${mobileBasePath}/app/planlama`}
                aria-current={mobileTab === 'planlama' ? 'page' : undefined}
                className={
                  'app-btn h-11 w-full px-4 ring-offset-slate-950 ' +
                  (mobileTab === 'planlama'
                    ? 'app-btn-primary'
                    : 'app-btn-primary-light opacity-85 hover:opacity-100')
                }
              >
                {t('weddingPage.mobileTabs.planning')}
                <ClipboardCheck />
              </Link>

              <Link
                to={`${mobileBasePath}/app/belgeler`}
                aria-current={mobileTab === 'belgeler' ? 'page' : undefined}
                className={
                  'app-btn h-11 w-full px-4 ring-offset-slate-950 ' +
                  (mobileTab === 'belgeler'
                    ? 'app-btn-primary'
                    : 'app-btn-primary-light opacity-85 hover:opacity-100')
                }
              >
                {t('weddingPage.mobileTabs.documents')}
                <Files />
              </Link>
            </div>
          </div>

          <div className="space-y-8">
            {mobileTab === 'rehberlik' ? renderRehberlik() : null}
            {mobileTab === 'surec' ? renderSurec() : null}
            {mobileTab === 'planlama' ? renderPlan() : null}
            {mobileTab === 'belgeler' ? renderDocuments() : null}
          </div>
        </div>
      </div>

      {/* Mobil alt sekme barı */}
      <div
        className="sm:hidden fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.98))] shadow-[0_-18px_48px_rgba(2,6,23,0.42)] backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-4xl mx-auto px-2 py-1.5">
          <div className="mx-auto mb-1.5 h-1 w-20 rounded-full bg-white/10" />
          <div className="grid grid-cols-4 gap-1">
              <Link
                to={`${mobileBasePath}/app/belgeler`}
                className={
                  'group relative flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-center select-none touch-manipulation ' +
                  'transition-[transform,background-color,box-shadow] duration-150 ease-out active:scale-[0.98] ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70 ' +
                  (mobileTab === 'belgeler'
                    ? 'bg-white text-rose-800 shadow-[0_10px_26px_rgba(255,255,255,0.2)] ring-1 ring-white/80'
                    : 'bg-rose-800/90 text-white hover:bg-rose-700')
                }
                aria-current={mobileTab === 'belgeler' ? 'page' : undefined}
              >
                <span
                  className={
                    'inline-flex h-9 w-9 items-center justify-center rounded-2xl transition-colors duration-150 ' +
                    (mobileTab === 'belgeler' ? 'bg-rose-100' : 'bg-white/5 group-hover:bg-white/10')
                  }
                >
                  <Files
                    size={20}
                    className={
                      'transition-[transform,filter,color] duration-150 ' +
                      (mobileTab === 'belgeler'
                        ? 'text-rose-700 scale-[1.04] drop-shadow-sm'
                        : 'text-white/90')
                    }
                  />
                </span>
                <span
                  className={
                    'mt-0.5 min-h-[20px] text-center text-[10px] leading-3 transition-colors duration-150 ' +
                    (mobileTab === 'belgeler' ? 'font-bold text-rose-800' : 'font-medium text-white/80')
                  }
                  style={{ fontFamily: '"Orbitron", sans-serif' }}
                >
                  {t('weddingPage.mobileTabs.documents')}
                </span>
                <span
                  className={
                    'mt-0.5 h-[2px] w-6 rounded-full bg-rose-500 transition-opacity duration-150 ' +
                    (mobileTab === 'belgeler' ? 'opacity-100' : 'opacity-0')
                  }
                />
              </Link>
              <Link
                to={`${mobileBasePath}/app/surec`}
                className={
                  'group relative flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-center select-none touch-manipulation ' +
                  'transition-[transform,background-color,box-shadow] duration-150 ease-out active:scale-[0.98] ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70 ' +
                  (mobileTab === 'surec'
                    ? 'bg-white text-rose-800 shadow-[0_10px_26px_rgba(255,255,255,0.2)] ring-1 ring-white/80'
                    : 'bg-rose-800/90 text-white hover:bg-rose-700')
                }
                aria-current={mobileTab === 'surec' ? 'page' : undefined}
              >
                <span
                  className={
                    'inline-flex h-9 w-9 items-center justify-center rounded-2xl transition-colors duration-150 ' +
                    (mobileTab === 'surec' ? 'bg-rose-100' : 'bg-white/5 group-hover:bg-white/10')
                  }
                >
                  <Route
                    size={20}
                    className={
                      'transition-[transform,filter,color] duration-150 ' +
                      (mobileTab === 'surec'
                        ? 'text-rose-700 scale-[1.04] drop-shadow-sm'
                        : 'text-white/90')
                    }
                  />
                </span>
                <span
                  className={
                    'mt-0.5 min-h-[20px] text-center text-[10px] leading-3 transition-colors duration-150 ' +
                    (mobileTab === 'surec' ? 'font-bold text-rose-800' : 'font-medium text-white/80')
                  }
                  style={{ fontFamily: '"Orbitron", sans-serif' }}
                >
                  {t('weddingPage.mobileTabs.process')}
                </span>
                <span
                  className={
                    'mt-0.5 h-[2px] w-6 rounded-full bg-rose-500 transition-opacity duration-150 ' +
                    (mobileTab === 'surec' ? 'opacity-100' : 'opacity-0')
                  }
                />
              </Link>
              <Link
                to={`${mobileBasePath}/app/rehberlik`}
                className={
                  'group relative flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-center select-none touch-manipulation ' +
                  'transition-[transform,background-color,box-shadow] duration-150 ease-out active:scale-[0.98] ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70 ' +
                  (mobileTab === 'rehberlik'
                    ? 'bg-white text-rose-800 shadow-[0_10px_26px_rgba(255,255,255,0.2)] ring-1 ring-white/80'
                    : 'bg-rose-800/90 text-white hover:bg-rose-700')
                }
                aria-current={mobileTab === 'rehberlik' ? 'page' : undefined}
                onClick={() => trackClick('wedding_app_nav_rehberlik', { page: String(location?.pathname || '') || '/' })}
              >
                <span
                  className={
                    'inline-flex h-9 w-9 items-center justify-center rounded-2xl transition-colors duration-150 ' +
                    (mobileTab === 'rehberlik' ? 'bg-rose-100' : 'bg-white/5 group-hover:bg-white/10')
                  }
                >
                  <Compass
                    size={20}
                    className={
                      'transition-[transform,filter,color] duration-150 ' +
                      (mobileTab === 'rehberlik'
                        ? 'text-rose-700 scale-[1.04] drop-shadow-sm'
                        : 'text-white/90')
                    }
                  />
                </span>
                <span
                  className={
                    'mt-0.5 min-h-[20px] text-center text-[10px] leading-3 transition-colors duration-150 ' +
                    (mobileTab === 'rehberlik' ? 'font-bold text-rose-800' : 'font-medium text-white/80')
                  }
                  style={{ fontFamily: '"Orbitron", sans-serif' }}
                >
                  {t('weddingPage.mobileTabs.guidance')}
                </span>
                <span
                  className={
                    'mt-0.5 h-[2px] w-6 rounded-full bg-rose-500 transition-opacity duration-150 ' +
                    (mobileTab === 'rehberlik' ? 'opacity-100' : 'opacity-0')
                  }
                />
              </Link>
              <Link
                to={`${mobileBasePath}/app/planlama`}
                className={
                  'group relative flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 text-center select-none touch-manipulation ' +
                  'transition-[transform,background-color,box-shadow] duration-150 ease-out active:scale-[0.98] ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200/70 ' +
                  (mobileTab === 'planlama'
                    ? 'bg-white text-rose-800 shadow-[0_10px_26px_rgba(255,255,255,0.2)] ring-1 ring-white/80'
                    : 'bg-rose-800/90 text-white hover:bg-rose-700')
                }
                aria-current={mobileTab === 'planlama' ? 'page' : undefined}
              >
                <span
                  className={
                    'inline-flex h-9 w-9 items-center justify-center rounded-2xl transition-colors duration-150 ' +
                    (mobileTab === 'planlama' ? 'bg-rose-100' : 'bg-white/5 group-hover:bg-white/10')
                  }
                >
                  <ClipboardCheck
                    size={20}
                    className={
                      'transition-[transform,filter,color] duration-150 ' +
                      (mobileTab === 'planlama'
                        ? 'text-rose-700 scale-[1.04] drop-shadow-sm'
                        : 'text-white/90')
                    }
                  />
                </span>
                <span
                  className={
                    'mt-0.5 min-h-[20px] text-center text-[10px] leading-3 transition-colors duration-150 ' +
                    (mobileTab === 'planlama' ? 'font-bold text-rose-800' : 'font-medium text-white/80')
                  }
                  style={{ fontFamily: '"Orbitron", sans-serif' }}
                >
                  {t('weddingPage.mobileTabs.planning')}
                </span>
                <span
                  className={
                    'mt-0.5 h-[2px] w-6 rounded-full bg-rose-500 transition-opacity duration-150 ' +
                    (mobileTab === 'planlama' ? 'opacity-100' : 'opacity-0')
                  }
                />
              </Link>
          </div>
        </div>
      </div>

      {/* CTA Bölümü - Formun Altında */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-8 md:p-12 rounded-3xl text-center text-white mx-4 md:mx-0 mb-8">
        <h3 className="text-xl md:text-2xl font-medium mb-3">{t('weddingPage.bottomCta.title')}</h3>
        <p className="text-sm md:text-base mb-6 md:mb-8 opacity-90">
          {t('weddingPage.bottomCta.description')}
        </p>
        <button
          type="button"
          onClick={goToPlanningForm}
          className="inline-flex items-center gap-3 bg-white/95 text-rose-700 px-5 md:px-6 py-3 rounded-2xl font-semibold hover:bg-white transition shadow-sm ring-1 ring-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 text-sm md:text-base"
        >
          <Heart size={20} />
          {t('weddingPage.bottomCta.action')}
        </button>
        <p className="text-xs md:text-sm mt-4 opacity-90">
          {t('weddingPage.bottomCta.note')}
        </p>
      </div>

      <StickyWhatsApp positionClassName="bottom-24 right-4 sm:bottom-8 sm:right-6" />

      {user?.uid ? (
        <Link
          to="/profilim"
          className="fixed bottom-36 right-4 z-50 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-white/20 hover:bg-slate-800 sm:bottom-20"
          aria-label={t('weddingPage.stickyBackToProfile.aria')}
        >
          {t('weddingPage.stickyBackToProfile.label')}
        </Link>
      ) : null}

      <Footer />
    </div>
  );
}

