import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NewsletterSignup() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // 'success', 'error', null
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    // Basit localStorage kayıt (gerçek uygulamada API'ye gönderilir)
    try {
      const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
      
      if (subscribers.includes(email)) {
        setStatus('error');
        setLoading(false);
        return;
      }

      subscribers.push(email);
      localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
      
      setStatus('success');
      setEmail('');
      
      // Google Analytics event
      if (window.gtag) {
        window.gtag('event', 'newsletter_signup', {
          event_category: 'engagement',
          event_label: 'newsletter'
        });
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(null), 5000);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 sm:p-8 text-white">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Mail size={24} />
          <h3 className="text-xl sm:text-2xl font-bold">
            {t('newsletter.title')}
          </h3>
        </div>
        <p className="text-emerald-50 mb-6 text-sm sm:text-base">
          {t('newsletter.subtitle')}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter.placeholderEmail')}
            required
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? t('newsletter.cta.sending') : t('newsletter.cta.subscribe')}
          </button>
        </form>
        {status === 'success' && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-white/20 rounded-lg p-3">
            <CheckCircle size={20} />
            <span>{t('newsletter.success')}</span>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-4 flex items-center gap-2 text-sm bg-red-500/20 rounded-lg p-3">
            <AlertCircle size={20} />
            <span>{t('newsletter.error')}</span>
          </div>
        )}
        <p className="text-xs text-emerald-100 mt-4">
          {t('newsletter.privacy')}
        </p>
      </div>
    </div>
  );
}





