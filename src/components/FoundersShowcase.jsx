import { useTranslation } from 'react-i18next';
import { buildWhatsAppUrl } from '../utils/whatsapp';

function getBaseLang(raw) {
  const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'in') return 'id';
  if (base === 'tr' || base === 'en' || base === 'id') return base;
  return 'tr';
}

function getFoundersShowcaseCopy(lang) {
  const copy = {
    tr: {
      eyebrow: 'Kurucular ve guven',
      title: 'Insanlarin guveni bizim icin onemli',
      body:
        'uniqah.com web sitesi pt moonstar global indonesia sirketinin kuruculari olan endonezyali ve turk bir cift tarafindan olusturulmustur ve bu web sitesinde sadece evlilik amaci tasiyan insanlara hizmet verilir,gerek es bulma asamasinda gerekse yasal islemlerde her turlu yardima ve rehberlige haziriz, guvenle sitemizi kullanabilirsiniz, bilgileriniz tamamen gizli tutulur ve izin verdiginiz kisiler disinda kimseyle paylasilmaz',
      chips: ['Sadece evlilik odakli', 'Yasal surecte rehberlik', 'Bilgileriniz gizli tutulur'],
      whatsappNote: 'Dilerseniz WhatsApp hattimizdan bize ulasabilirsiniz.',
      whatsappMessage: 'Merhaba, Uniqah hakkinda bilgi almak istiyorum.',
      imageAltA: 'Uniqah kurucu cift fotografi 1',
      imageAltB: 'Uniqah kurucu cift fotografi 2',
    },
    en: {
      eyebrow: 'Founders and trust',
      title: 'People\'s trust matters to us',
      body:
        'The uniqah.com website was created by an Indonesian and Turkish couple who are the founders of PT MoonStar Global Indonesia. This website serves only people with genuine marriage intentions. We are ready to provide support and guidance both during the spouse search stage and throughout legal procedures. You can use our site with confidence. Your information is kept fully confidential and is never shared with anyone other than the people you explicitly allow.',
      chips: ['Marriage-focused only', 'Guidance for legal steps', 'Your information stays private'],
      whatsappNote: 'If you prefer, you can contact us through our WhatsApp line.',
      whatsappMessage: 'Hello, I would like to get information about Uniqah.',
      imageAltA: 'Uniqah founders couple photo 1',
      imageAltB: 'Uniqah founders couple photo 2',
    },
    id: {
      eyebrow: 'Pendiri dan kepercayaan',
      title: 'Kepercayaan orang-orang penting bagi kami',
      body:
        'Situs uniqah.com dibuat oleh pasangan Indonesia dan Turki yang merupakan pendiri PT MoonStar Global Indonesia. Situs ini hanya melayani orang-orang yang benar-benar memiliki tujuan menikah. Kami siap membantu dan membimbing Anda baik pada tahap mencari pasangan maupun dalam proses legal. Anda dapat menggunakan situs kami dengan aman. Informasi Anda dijaga sepenuhnya rahasia dan tidak akan dibagikan kepada siapa pun selain pihak yang Anda izinkan secara jelas.',
      chips: ['Hanya fokus pernikahan', 'Pendampingan proses legal', 'Informasi Anda tetap rahasia'],
      whatsappNote: 'Jika Anda mau, Anda bisa menghubungi kami melalui jalur WhatsApp kami.',
      whatsappMessage: 'Halo, saya ingin mendapatkan informasi tentang Uniqah.',
      imageAltA: 'Foto pasangan pendiri Uniqah 1',
      imageAltB: 'Foto pasangan pendiri Uniqah 2',
    },
  };

  return copy[lang] || copy.tr;
}

export default function FoundersShowcase({ compact = false, className = '' }) {
  const { i18n } = useTranslation();
  const langBase = getBaseLang(i18n?.language);
  const ui = getFoundersShowcaseCopy(langBase);
  const whatsappHref = buildWhatsAppUrl(ui.whatsappMessage, { lang: String(i18n?.language || 'tr') });
  const rootClass = compact
    ? 'overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(240,253,250,0.95))] shadow-[0_22px_70px_rgba(15,23,42,0.16)]'
    : 'overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.96))] shadow-[0_28px_90px_rgba(15,23,42,0.16)]';
  const gridClass = compact
    ? 'grid grid-cols-1 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)] gap-0'
    : 'grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] gap-0';
  const mediaClass = compact
    ? 'grid grid-cols-2 gap-2 p-2 md:p-3 bg-slate-950 xl:grid-cols-1 xl:gap-3'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 md:p-4 bg-slate-950';
  const imageClass = compact
    ? 'relative overflow-hidden rounded-[20px] min-h-[180px] md:min-h-[220px] xl:min-h-[200px] ring-1 ring-white/10 shadow-[0_12px_34px_rgba(2,6,23,0.24)]'
    : 'relative overflow-hidden rounded-[24px] min-h-[320px] sm:min-h-[420px]';
  const bodyClass = compact ? 'p-4 md:p-6 flex flex-col justify-center' : 'p-6 md:p-8 lg:p-10 flex flex-col justify-center';
  const titleClass = compact
    ? 'mt-3 text-xl md:text-2xl font-semibold leading-tight text-slate-950'
    : 'mt-4 text-2xl md:text-3xl font-semibold leading-tight text-slate-950';
  const textClass = compact ? 'mt-3 text-sm leading-relaxed text-slate-700' : 'mt-4 text-sm md:text-base leading-relaxed text-slate-700';

  return (
    <div className={[rootClass, className].filter(Boolean).join(' ')}>
      <div className={gridClass}>
        <div className={mediaClass}>
          <div className={imageClass}>
            <img
              src="/abc.JPG"
              alt={ui.imageAltA}
              className="h-full w-full object-cover"
              loading="eager"
              fetchpriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
          </div>
          <div className={imageClass}>
            <img
              src="/20250922_142442.jpg"
              alt={ui.imageAltB}
              className="h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
          </div>
        </div>

        <div className={bodyClass}>
          <div className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-900">
            {ui.eyebrow}
          </div>
          <h2 className={titleClass}>{ui.title}</h2>
          <p className={textClass}>{ui.body}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-600">
            {ui.chips.map((chip) => (
              <span key={chip} className="rounded-full border border-slate-200 bg-white px-3 py-2">{chip}</span>
            ))}
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
          >
            {ui.whatsappNote}
          </a>
        </div>
      </div>
    </div>
  );
}