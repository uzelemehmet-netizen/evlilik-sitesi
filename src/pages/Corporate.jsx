import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Building2, BadgeCheck, Globe, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY } from '../config/company';
import { useTranslation } from 'react-i18next';

export default function Corporate() {
  const { t } = useTranslation();
  const brand = 'Endonezya Kaşifi';
  const instagram = 'https://www.instagram.com/endonezyakasifi';
  const youtube = 'https://www.youtube.com/@endonezyakasifi';
  const dameTurk = 'https://www.dameturk.com';

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <section
        className="pt-20 pb-12 px-4 relative overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(15,23,42,0.80) 0%, rgba(30,64,175,0.65) 40%, rgba(16,185,129,0.55) 100%), url(https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 70%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <p className="inline-flex items-center gap-2 text-xs md:text-sm text-emerald-100 tracking-wide uppercase mb-2">
            <Building2 size={16} />
            {t('corporatePage.hero.badge')}
          </p>
          <h1
            className="text-3xl md:text-5xl font-semibold text-white mb-4"
            style={{ fontFamily: '"Poppins", sans-serif', textShadow: '0 4px 12px rgba(0,0,0,0.7)' }}
          >
            {brand} <span className="text-white/80">—</span> {COMPANY.legalName}
          </h1>
          <p
            className="text-base md:text-lg text-white/95 max-w-3xl mx-auto"
            style={{ fontFamily: '"Poppins", sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          >
            {t('corporatePage.hero.description')}
          </p>
        </div>
      </section>

      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 p-5 rounded-2xl border border-emerald-100 bg-emerald-50/60">
            <p className="text-sm text-gray-800" style={{ fontFamily: '"Poppins", sans-serif' }}>
              <span className="font-semibold">{brand}</span> {t('corporatePage.summary.brandLine', { company: COMPANY.legalName })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/dokumanlar"
                className="inline-flex items-center gap-2 rounded-full bg-white border border-emerald-200 px-4 py-2 text-sm hover:shadow-sm transition"
              >
                <BadgeCheck size={16} className="text-emerald-700" />
                {t('corporatePage.summary.documents')}
              </Link>
              <a
                href="/docs/tur-brosurleri.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm hover:shadow-sm transition"
              >
                <BadgeCheck size={16} className="text-slate-700" />
                {t('corporatePage.summary.brochures')}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-emerald-100 bg-emerald-50/60">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('corporatePage.brandInfo.title')}
              </h2>
              <div className="space-y-2 text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                <p>
                  <span className="font-semibold">{t('corporatePage.brandInfo.labels.brand')}:</span> {brand}
                </p>
                <p>
                  <span className="font-semibold">{t('corporatePage.brandInfo.labels.legalName')}:</span> {COMPANY.legalName}
                </p>
                <p>
                  <span className="font-semibold">{t('corporatePage.brandInfo.labels.tax')}:</span> {COMPANY.tax}
                </p>
                <p>
                  <span className="font-semibold">{t('corporatePage.brandInfo.labels.nib')}:</span> {COMPANY.nib}
                </p>
              </div>
              <div className="mt-4 text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('corporatePage.brandInfo.socialNote')}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('corporatePage.contact.title')}
              </h2>
              <div className="space-y-3 text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                <div className="flex items-start gap-2">
                  <MapPin size={18} className="mt-0.5 text-emerald-700" />
                  <p>{COMPANY.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-emerald-700" />
                  <a className="hover:underline" href={`mailto:${COMPANY.email}`}>
                    {COMPANY.email}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-emerald-700" />
                  <a className="hover:underline" href="tel:+905550343852">
                    +90 555 034 3852
                  </a>
                  <span className="text-gray-500">({t('corporatePage.contact.trLabel')})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-emerald-700" />
                  <a className="hover:underline" href="tel:+6285888978383">
                    {COMPANY.phoneIdDisplay}
                  </a>
                  <span className="text-gray-500">({t('corporatePage.contact.idLabel')})</span>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm hover:shadow-sm transition"
                  >
                    <Globe size={16} /> Instagram
                  </a>
                  <a
                    href={youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm hover:shadow-sm transition"
                  >
                    <Globe size={16} /> YouTube
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-6 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row gap-6 items-center">
            <img
              src="/logos/moonstar-lockup-horizontal.png"
              alt="MoonStar"
              className="w-full max-w-[520px] md:max-w-[420px] rounded-2xl border border-slate-200 bg-white object-contain p-3"
              loading="lazy"
            />
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-slate-600 mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('corporatePage.parentCompany.badge')}
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="/logos/moonstar-mark-square.png"
                  alt="PT MoonStar Global Indonesia"
                  className="h-10 w-10 rounded-xl border border-slate-200 bg-white object-contain"
                  loading="lazy"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    PT MoonStar Global Indonesia
                  </p>
                  <p className="text-sm text-slate-600" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    {t('corporatePage.parentCompany.caption', { brand })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 p-6 rounded-2xl border border-slate-200 bg-white">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('corporatePage.billing.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-700 mb-1" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('corporatePage.billing.items.collection.title')}
                </p>
                <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('corporatePage.billing.items.collection.body', { company: COMPANY.legalName })}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="text-xs uppercase tracking-wide text-slate-700 mb-1" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('corporatePage.billing.items.contract.title')}
                </p>
                <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('corporatePage.billing.items.contract.body', { company: COMPANY.legalName })}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs uppercase tracking-wide text-emerald-700 mb-1" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('corporatePage.documents.title')}
                </p>
                <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('corporatePage.documents.body')}
                </p>
                <div className="mt-3">
                  <Link to="/dokumanlar" className="inline-flex items-center gap-2 rounded-full bg-white border border-emerald-200 px-4 py-2 text-sm hover:shadow-sm transition">
                    <BadgeCheck size={16} className="text-emerald-700" />
                    {t('corporatePage.documents.cta')}
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200">
              <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('corporatePage.documents.brochureNote')}{' '}
                <a className="text-emerald-700 font-semibold hover:underline" href="/docs/tur-brosurleri.html" target="_blank" rel="noopener noreferrer">
                  {t('corporatePage.documents.brochureLink')}
                </a>
              </p>
            </div>
          </div>

          <div className="mt-10 p-6 rounded-2xl border border-slate-200 bg-white">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('corporatePage.otherBrand.title')}
            </h2>
            <a
              href={dameTurk}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-sm transition block"
              aria-label={t('corporatePage.otherBrand.aria')}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wide text-slate-700 mb-1" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  DaMeTurk
                </p>
                <ExternalLink size={16} className="text-slate-500" />
              </div>
              <p className="text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('corporatePage.otherBrand.body', { company: COMPANY.legalName })}
              </p>
              <p className="mt-2 text-sm text-emerald-700 font-semibold" style={{ fontFamily: '"Poppins", sans-serif' }}>
                dameturk.com
              </p>
            </a>
          </div>

          <div className="mt-10 p-6 rounded-2xl border border-slate-200 bg-slate-50">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('corporatePage.faq.title')}
            </h2>
            <div className="space-y-3">
              <details className="group rounded-xl bg-white border border-slate-200 p-4">
                <summary className="cursor-pointer font-semibold text-gray-900 flex items-center gap-2">
                  <BadgeCheck size={18} className="text-emerald-700" />
                  {t('corporatePage.faq.items.siteCompany.q')}
                </summary>
                <p className="mt-2 text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('corporatePage.faq.items.siteCompany.a', { brand, company: COMPANY.legalName })}
                </p>
              </details>

              <details className="group rounded-xl bg-white border border-slate-200 p-4">
                <summary className="cursor-pointer font-semibold text-gray-900 flex items-center gap-2">
                  <BadgeCheck size={18} className="text-emerald-700" />
                  {t('corporatePage.faq.items.paymentCompany.q')}
                </summary>
                <p className="mt-2 text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('corporatePage.faq.items.paymentCompany.a', { company: COMPANY.legalName })}
                </p>
              </details>

              <details className="group rounded-xl bg-white border border-slate-200 p-4">
                <summary className="cursor-pointer font-semibold text-gray-900 flex items-center gap-2">
                  <BadgeCheck size={18} className="text-emerald-700" />
                  {t('corporatePage.faq.items.dameturk.q')}
                </summary>
                <p className="mt-2 text-sm text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  {t('corporatePage.faq.items.dameturk.a', { company: COMPANY.legalName })}
                </p>
              </details>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
