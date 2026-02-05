import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import HeroSocialButtons from '../components/HeroSocialButtons';
import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Mail, Phone, MapPin, MessageCircle, Youtube } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { useTranslation, Trans } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    from_name: '',
    from_email: '',
    phone: '',
    subject: '',
    message: '',
    privacy_consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // EmailJS'i başlatma
  useEffect(() => {
    emailjs.init({
      publicKey: '4gPu39idFW7kmAtv3',
      blockHeadless: false,
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.privacy_consent) {
      setError(t('contact.form.privacyError'));
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await emailjs.send(
        'service_cnba43s',
        'template_2n5v9u9',
        {
          from_name: formData.from_name,
          from_email: formData.from_email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          to_email: 'uzelemehmet@gmail.com'
        }
      );

      if (response.status === 200) {
        // Google Ads Conversion Tracking
        if (window.gtag) {
          window.gtag('event', 'conversion', {
            'send_to': 'AW-17732388792/X1NRCLaZ4sQbELiPu4dC',
            'value': 1.0,
            'currency': 'TRY',
            'transaction_id': response.status
          });
        }
        setSuccess(true);
        setFormData({ from_name: '', from_email: '', phone: '', subject: '', message: '', privacy_consent: false });
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      setError(t('contact.form.sendError'));
      console.error('EmailJS Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: t('contact.sidebar.phone'),
      value: '+90 555 034 3852',
      href: 'tel:+905550343852'
    },
    {
      icon: Mail,
      title: t('contact.sidebar.email'),
      value: 'info@uniqah.com',
      href: 'mailto:info@uniqah.com'
    },
    {
      icon: MessageCircle,
      title: t('contact.sidebar.whatsapp'),
      value: t('contact.sidebar.askNow'),
      href: buildWhatsAppUrl(t('floatingWhatsapp.messages.contact'))
    },
    {
      icon: MapPin,
      title: t('contact.sidebar.location'),
      value: t('contact.sidebar.indonesia'),
      href: '#'
    }
  ];

  const socialLinks = [
    {
      icon: Youtube,
      name: 'YouTube',
      href: '/youtube'
    },
    {
      icon: MessageCircle,
      name: 'WhatsApp',
      href: buildWhatsAppUrl(t('floatingWhatsapp.messages.contact'))
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <section className="pt-20 pb-12 px-4 relative overflow-hidden min-h-80" style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1600&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}>
        <div className="absolute inset-0"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center flex flex-col justify-center items-center min-h-80">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6" style={{ fontFamily: '"Poppins", sans-serif', textShadow: '0 4px 12px rgba(0,0,0,0.7)' }}>
            {t('contact.hero.title')}
          </h1>
          <p className="text-xl text-white mb-8" style={{ fontFamily: '"Poppins", sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            {t('contact.hero.p1')}
          </p>
          <p className="text-lg text-white mb-8" style={{ fontFamily: '"Poppins", sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            {t('contact.hero.p2')}
          </p>
        </div>
        <HeroSocialButtons />
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* İletişim Bilgileri Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('contact.sidebar.title')}
              </h2>
              <div className="space-y-4">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <a
                      key={index}
                      href={info.href}
                      target={info.href.startsWith('http') ? '_blank' : undefined}
                      rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-emerald-50 transition group"
                    >
                      <Icon className="text-emerald-600 flex-shrink-0 group-hover:scale-110 transition" size={24} />
                      <div>
                        <p className="font-semibold text-gray-700 text-sm" style={{ fontFamily: '"Poppins", sans-serif' }}>
                          {info.title}
                        </p>
                        <p className="text-gray-600 group-hover:text-emerald-600 transition" style={{ fontFamily: '"Poppins", sans-serif' }}>
                          {info.value}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('contact.sidebar.socialTitle')}
              </h3>
              <div className="space-y-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-emerald-600 hover:text-emerald-700 font-semibold transition"
                      style={{ fontFamily: '"Poppins", sans-serif' }}
                    >
                      <Icon size={20} />
                      {social.name}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Alanı */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 p-8 rounded-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('contact.form.title')}
              </h2>

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                  <p className="text-green-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                    {t('contact.form.success')}
                  </p>
                </div>
              )}
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-red-700" style={{ fontFamily: '"Poppins", sans-serif' }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>{t('contact.form.labels.name')}</label>
                    <input
                      type="text"
                      name="from_name"
                      value={formData.from_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      placeholder={t('contact.form.placeholders.name')}
                      style={{ fontFamily: '"Poppins", sans-serif' }}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>{t('contact.form.labels.email')}</label>
                    <input
                      type="email"
                      name="from_email"
                      value={formData.from_email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      placeholder={t('contact.form.placeholders.email')}
                      style={{ fontFamily: '"Poppins", sans-serif' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>{t('contact.form.labels.phone')}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder={t('contact.form.placeholders.phone')}
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>{t('contact.form.labels.subject')}</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder={t('contact.form.placeholders.subject')}
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2" style={{ fontFamily: '"Poppins", sans-serif' }}>{t('contact.form.labels.message')}</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                    placeholder={t('contact.form.placeholders.message')}
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      name="privacy_consent"
                      checked={formData.privacy_consent}
                      onChange={handleChange}
                      required
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-gray-700" style={{ fontFamily: '"Poppins", sans-serif' }}>
                      <Trans
                        i18nKey="contact.form.consent"
                        components={{
                          privacyLink: (
                            <a
                              href="/privacy"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline font-semibold"
                            />
                          ),
                        }}
                      />
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  {loading ? t('contact.form.submitting') : t('contact.form.submit')}
                </button>
              </form>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600" style={{ fontFamily: '"Poppins", sans-serif' }}>
                  <strong>{t('common.learnMore')}:</strong> {t('common.privacySecurity.text')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

