import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { Trans, useTranslation } from 'react-i18next';
import { COMPANY } from '../config/company';

export default function Privacy() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('tr') ? 'tr-TR' : i18n.language?.startsWith('id') ? 'id-ID' : 'en-US';
  const formattedDate = new Intl.DateTimeFormat(locale).format(new Date());
  const collectedItems = t('privacyPage.sections.dataCollected.items', { returnObjects: true });
  const usageItems = t('privacyPage.sections.dataUsage.items', { returnObjects: true });

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold mb-12 text-gray-900">{t('privacyPage.title')}</h1>
        
        <div className="space-y-8 text-gray-600">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyPage.sections.intro.title')}</h2>
            <p>{t('privacyPage.sections.intro.text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyPage.sections.dataCollected.title')}</h2>
            <p>{t('privacyPage.sections.dataCollected.text')}</p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              {Array.isArray(collectedItems)
                ? collectedItems.map((item) => <li key={item}>{item}</li>)
                : null}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyPage.sections.dataUsage.title')}</h2>
            <p>{t('privacyPage.sections.dataUsage.text')}</p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              {Array.isArray(usageItems) ? usageItems.map((item) => <li key={item}>{item}</li>) : null}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyPage.sections.security.title')}</h2>
            <p>{t('privacyPage.sections.security.text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyPage.sections.rights.title')}</h2>
            <p>{t('privacyPage.sections.rights.text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyPage.sections.contact.title')}</h2>
            <p>
              <Trans
                i18nKey="privacyPage.sections.contact.text"
                values={{ email: COMPANY.email }}
                components={{
                  emailLink: (
                    <a href={`mailto:${COMPANY.email}`} className="text-emerald-600 hover:underline" />
                  ),
                }}
              />
            </p>
          </section>

          <div className="border-t pt-8 mt-8 text-sm text-gray-500">
            <p>{t('privacyPage.lastUpdated', { date: formattedDate })}</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
