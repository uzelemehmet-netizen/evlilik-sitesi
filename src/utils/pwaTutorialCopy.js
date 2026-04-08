function normalizePwaTutorialLang(raw) {
  const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'in') return 'id';
  if (base === 'tr' || base === 'en' || base === 'id') return base;
  return 'tr';
}

const FALLBACK_COPY = {
  tr: {
    eyebrow: 'Uygulama kurulumu',
    linkBody: 'Kullanıcıya gönderilecek tek link: önce kurulum, sonra bildirim, sonra uygulama girişi.',
    linkCta: 'Kurulum adımını aç',
  },
  en: {
    eyebrow: 'App setup',
    linkBody: 'One link to send to the user: install first, then notifications, then app sign-in.',
    linkCta: 'Open install flow',
  },
  id: {
    eyebrow: 'Persiapan aplikasi',
    linkBody: 'Satu tautan yang bisa dikirim ke pengguna: pemasangan dulu, lalu notifikasi, lalu masuk aplikasi.',
    linkCta: 'Buka alur pemasangan',
  },
};

function resolveCopy(t, key, fallback) {
  const value = t(key, { defaultValue: fallback });
  return typeof value === 'string' && value === key ? fallback : value;
}

export function getPwaTutorialCopy(t, rawLang) {
  const lang = normalizePwaTutorialLang(rawLang);
  const fallback = FALLBACK_COPY[lang] || FALLBACK_COPY.tr;

  return {
    eyebrow: resolveCopy(t, 'pwa.tutorial.eyebrow', fallback.eyebrow),
    linkBody: resolveCopy(t, 'pwa.tutorial.linkBody', fallback.linkBody),
    linkCta: resolveCopy(t, 'pwa.tutorial.linkCta', fallback.linkCta),
  };
}