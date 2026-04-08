function normalizeInstallLang(raw) {
  const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'in') return 'id';
  if (base === 'tr' || base === 'en' || base === 'id') return base;
  return 'tr';
}

export const APP_INSTALL_PATH = '/uygulama';
export const APP_INSTALL_SHARE_URL = 'https://uniqah.com/uygulama';

const COPY = {
  tr: {
    eyebrow: 'Tek kurulum linki',
    title: 'Uygulamayı yükle',
    cta: 'Kurulum linkini aç',
    homeBody: 'Telefonunda uygulama gibi açılan tek kurulum bağlantısı. Önce yükle, sonra kayıt olup içeride devam et.',
    loginBody: 'İstersen önce uygulamayı yükle. İstersen bu sayfadan kayıt olup web üzerinden devam edebilirsin.',
    leadBody: 'Bu sayfadan önce ya da sonra aynı kurulum linkini açıp uygulamayı telefonuna ekleyebilirsin.',
  },
  en: {
    eyebrow: 'Single install link',
    title: 'Install the app',
    cta: 'Open install link',
    homeBody: 'One install link that opens the app-style flow on the phone. Install first, then sign up and continue inside.',
    loginBody: 'You can install first, or sign up on this page and continue on the web flow.',
    leadBody: 'You can open the same install link before or after this page and add the app to the phone.',
  },
  id: {
    eyebrow: 'Satu tautan pemasangan',
    title: 'Pasang aplikasi',
    cta: 'Buka tautan pemasangan',
    homeBody: 'Satu tautan pemasangan yang membuka alur seperti aplikasi di ponsel. Pasang dulu, lalu daftar dan lanjutkan di dalamnya.',
    loginBody: 'Anda bisa memasang dulu, atau daftar di halaman ini dan melanjutkan lewat alur web.',
    leadBody: 'Anda bisa membuka tautan pemasangan yang sama sebelum atau sesudah halaman ini dan menambahkan aplikasi ke ponsel.',
  },
};

export function getAppInstallLinkUi(rawLang) {
  const lang = normalizeInstallLang(rawLang);
  return COPY[lang] || COPY.tr;
}