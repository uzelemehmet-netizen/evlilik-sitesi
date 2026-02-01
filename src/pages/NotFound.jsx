import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-medium text-gray-900 mb-3">404</h1>
          <p className="text-base md:text-lg text-gray-600 mb-6">{t('notFoundPage.title')}</p>
          <a
            href="/"
            className="inline-block bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition text-sm md:text-base"
          >
            {t('notFoundPage.backHome')}
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
