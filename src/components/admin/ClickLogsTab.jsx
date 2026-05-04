import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '../../utils/authFetch';
import { firebaseConfig } from '../../config/firebasePublicConfig';
import { getYouTubeVideosForLang } from '../../data/youtube';

function safeNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function getBaseLang(language) {
  const base = String(language || 'tr').toLowerCase().split('-')[0];
  return base === 'en' || base === 'id' ? base : 'tr';
}

const UI = {
  tr: {
    title: 'Tıklama Günlüğü',
    subtitle: 'Her tarayıcı için, aynı gün içinde aynı buton veya sekme yalnızca 1 kez sayılır. Ülke bilgisi varsa proxy headerlarından alınır.',
    day: 'Gün',
    today: 'Bugün',
    last7: 'Son 7 gün',
    last14: 'Son 14 gün',
    last30: 'Son 30 gün',
    refresh: 'Yenile',
    selectedDay: 'Seçili gün',
    totalUnique: 'Toplam unique event',
    sessionStart: 'Oturum başlangıcı (yaklaşık ziyaretçi)',
    signupLanding: 'Signup modunda açılış',
    friction: 'Landing→aksiyon sürtünmesi',
    ctaImpression: 'CTA görünümü',
    dropoff: 'Aksiyonsuz çıkış',
    realSignupStart: 'Gerçek kayıt başlangıcı',
    emailPassword: 'Email/Şifre seçildi',
    authRecord: 'Auth kaydı',
    clientCreated: 'Hesap oluştu (istemci)',
    profileReady: 'Profil hazır (event)',
    stubReady: 'Başvuru stub hazır (event)',
    backendReal: 'Backend gerçek form',
    backendUnknown: 'Backend bilinmeyen/stub',
    helpActions: 'WhatsApp/Tur yardımı',
    postStartLoss: 'Başlangıç sonrası kayıp',
    postStartLossNote1: 'Sadece gerçek kayıt başlatan kullanıcılar baz alınır.',
    postStartLossNote2: 'Pasif landing sayıları bu metriğe dahil edilmez.',
    firebaseMismatch: 'Firebase proje uyuşmazlığı',
    signupSummary: 'Signup teşhis özeti',
    googleStart: 'Google kayıt başlangıcı',
    googleSuccess: 'Google kayıt başarısı',
    redirectIssues: 'Redirect sorunları',
    riskyEnv: 'Riskli çevre',
    noResultCountries: 'Google yönlendirmesi sonuçsuz dönen ülkeler',
    timeoutCountries: 'Google yönlendirmesi zaman aşımına düşen ülkeler',
    dayEvents: 'Seçili gün — Olay listesi',
    event: 'Olay',
    unique: 'Tekil',
    countriesTop: 'Ülke (top)',
    noData: 'Henüz veri yok.',
    countryBreakdown: 'Seçili gün — Ülke kırılımı (Oturum başlangıcı)',
    countryFallback: 'Oturum başlangıcı ülke verisi yok; tüm event toplamı gösteriliyor.',
    countryNote: 'Not: Ülke, Vercel veya Cloudflare headerları varsa görünür. Yoksa UN (Bilinmeyen) olarak kalır.',
    userTraceTitle: 'Kullanıcı İzleri (ham tıklama akışı)',
    userTraceSubtitle: 'Bu tablo, buton ve link tıklamalarını trace olarak yazar. Adblock veya JS sorunlarında eksik olabilir.',
    range: 'Aralık',
    hours24: '24 saat',
    hours48: '48 saat',
    days7: '7 gün',
    days14: '14 gün',
    anonSessions: 'Anon oturumlar',
    pages: 'sayfa',
    lastActions: 'Son hareketler',
    noBrowserHint: 'Tarayıcı ipucu henüz yok',
    time: 'Zaman',
    country: 'Ülke',
    browser: 'Tarayıcı',
    language: 'Dil',
    timezone: 'TZ',
    page: 'Sayfa',
    noTrace: 'Henüz trace yok.',
    summaryLastDays: 'Son {{days}} gün — Özet',
    signupCount: 'Kayıt',
    unknownStub: 'Bilinmeyen/Stub',
    loading: 'Yükleniyor…',
    generalTab: 'Genel',
    youtubeTab: 'YouTube',
    youtubeTitle: 'YouTube akışı',
    youtubeSubtitle: 'YouTube sayfasına geçişler ve video açma tıklamaları bu sekmede ayrı raporlanır.',
    youtubeArrivals: 'YouTube sayfa görüntüleme',
    youtubeDirectNav: 'Doğrudan sekme tıklaması',
    youtubeRedirects: 'Yönlendirme kartı tıklaması',
    youtubeVideoClicks: 'Video açma tıklaması',
    youtubeSourcePages: 'Kaynak sayfalar',
    youtubeVideos: 'Video performansı',
    youtubeVideo: 'Video',
    youtubeRecentClicks: 'YouTube son tıklamalar',
    youtubeNoData: 'Henüz YouTube tıklaması yok.',
  },
  en: {
    title: 'Click Logs',
    subtitle: 'For each browser, the same button or tab is counted only once per day. Country info is taken from proxy headers when available.',
    day: 'Day',
    today: 'Today',
    last7: 'Last 7 days',
    last14: 'Last 14 days',
    last30: 'Last 30 days',
    refresh: 'Refresh',
    selectedDay: 'Selected day',
    totalUnique: 'Total unique events',
    sessionStart: 'Session starts (approx. visitors)',
    signupLanding: 'Signup-mode landings',
    friction: 'Landing → action friction',
    ctaImpression: 'CTA impressions',
    dropoff: 'Dropoff without action',
    realSignupStart: 'Actual signup starts',
    emailPassword: 'Email/Password selected',
    authRecord: 'Auth record',
    clientCreated: 'Client account created',
    profileReady: 'Profile ready (event)',
    stubReady: 'Application stub ready (event)',
    backendReal: 'Backend real form',
    backendUnknown: 'Backend unknown/stub',
    helpActions: 'WhatsApp/Tour help',
    postStartLoss: 'Post-start loss',
    postStartLossNote1: 'Only users who actually started signup are counted.',
    postStartLossNote2: 'Passive landing counts are excluded from this metric.',
    firebaseMismatch: 'Firebase project mismatch',
    signupSummary: 'Signup diagnostics summary',
    googleStart: 'Google signup starts',
    googleSuccess: 'Google signup success',
    redirectIssues: 'Redirect issues',
    riskyEnv: 'Risky environment',
    noResultCountries: 'Countries with Google redirects returning no result',
    timeoutCountries: 'Countries with Google redirect timeouts',
    dayEvents: 'Selected day — Event list',
    event: 'Event',
    unique: 'Unique',
    countriesTop: 'Countries (top)',
    noData: 'No data yet.',
    countryBreakdown: 'Selected day — Country breakdown (session starts)',
    countryFallback: 'No session-start country data; showing totals across all events.',
    countryNote: 'Note: Country is visible when Vercel or Cloudflare headers are present. Otherwise it remains UN (Unknown).',
    userTraceTitle: 'User Traces (raw click flow)',
    userTraceSubtitle: 'This table records button and link clicks as traces. It may be incomplete with ad blockers or JS failures.',
    range: 'Range',
    hours24: '24 hours',
    hours48: '48 hours',
    days7: '7 days',
    days14: '14 days',
    anonSessions: 'Anonymous sessions',
    pages: 'pages',
    lastActions: 'Latest actions',
    noBrowserHint: 'No browser hint yet',
    time: 'Time',
    country: 'Country',
    browser: 'Browser',
    language: 'Language',
    timezone: 'TZ',
    page: 'Page',
    noTrace: 'No trace yet.',
    summaryLastDays: 'Last {{days}} days — Summary',
    signupCount: 'Signups',
    unknownStub: 'Unknown/Stub',
    loading: 'Loading…',
    generalTab: 'General',
    youtubeTab: 'YouTube',
    youtubeTitle: 'YouTube flow',
    youtubeSubtitle: 'Transitions to the YouTube page and video-open clicks are reported separately here.',
    youtubeArrivals: 'YouTube page views',
    youtubeDirectNav: 'Direct tab clicks',
    youtubeRedirects: 'Redirect card clicks',
    youtubeVideoClicks: 'Video open clicks',
    youtubeSourcePages: 'Source pages',
    youtubeVideos: 'Video performance',
    youtubeVideo: 'Video',
    youtubeRecentClicks: 'Recent YouTube clicks',
    youtubeNoData: 'No YouTube clicks yet.',
  },
  id: {
    title: 'Log Klik',
    subtitle: 'Untuk setiap browser, tombol atau tab yang sama hanya dihitung sekali per hari. Info negara diambil dari header proxy bila tersedia.',
    day: 'Hari',
    today: 'Hari ini',
    last7: '7 hari terakhir',
    last14: '14 hari terakhir',
    last30: '30 hari terakhir',
    refresh: 'Segarkan',
    selectedDay: 'Hari terpilih',
    totalUnique: 'Total event unik',
    sessionStart: 'Awal sesi (perkiraan pengunjung)',
    signupLanding: 'Landing mode signup',
    friction: 'Gesekan landing → aksi',
    ctaImpression: 'Tampilan CTA',
    dropoff: 'Keluar tanpa aksi',
    realSignupStart: 'Awal signup nyata',
    emailPassword: 'Email/Password dipilih',
    authRecord: 'Catatan Auth',
    clientCreated: 'Akun klien terbentuk',
    profileReady: 'Profil siap (event)',
    stubReady: 'Stub aplikasi siap (event)',
    backendReal: 'Form nyata backend',
    backendUnknown: 'Unknown/stub backend',
    helpActions: 'Bantuan WhatsApp/Tur',
    postStartLoss: 'Kehilangan setelah mulai',
    postStartLossNote1: 'Hanya pengguna yang benar-benar memulai signup yang dihitung.',
    postStartLossNote2: 'Jumlah landing pasif tidak masuk ke metrik ini.',
    firebaseMismatch: 'Proyek Firebase tidak cocok',
    signupSummary: 'Ringkasan diagnostik signup',
    googleStart: 'Awal signup Google',
    googleSuccess: 'Signup Google berhasil',
    redirectIssues: 'Masalah redirect',
    riskyEnv: 'Lingkungan berisiko',
    noResultCountries: 'Negara dengan redirect Google tanpa hasil',
    timeoutCountries: 'Negara dengan timeout redirect Google',
    dayEvents: 'Hari terpilih — Daftar event',
    event: 'Event',
    unique: 'Unik',
    countriesTop: 'Negara (teratas)',
    noData: 'Belum ada data.',
    countryBreakdown: 'Hari terpilih — Rincian negara (awal sesi)',
    countryFallback: 'Data negara untuk awal sesi tidak ada; menampilkan total semua event.',
    countryNote: 'Catatan: Negara terlihat jika header Vercel atau Cloudflare ada. Jika tidak, tetap UN (Tidak diketahui).',
    userTraceTitle: 'Jejak Pengguna (alur klik mentah)',
    userTraceSubtitle: 'Tabel ini mencatat klik tombol dan tautan sebagai trace. Bisa kurang lengkap jika ada adblock atau masalah JS.',
    range: 'Rentang',
    hours24: '24 jam',
    hours48: '48 jam',
    days7: '7 hari',
    days14: '14 hari',
    anonSessions: 'Sesi anonim',
    pages: 'halaman',
    lastActions: 'Aktivitas terbaru',
    noBrowserHint: 'Belum ada petunjuk browser',
    time: 'Waktu',
    country: 'Negara',
    browser: 'Browser',
    language: 'Bahasa',
    timezone: 'TZ',
    page: 'Halaman',
    noTrace: 'Belum ada trace.',
    summaryLastDays: '{{days}} hari terakhir — Ringkasan',
    signupCount: 'Signup',
    unknownStub: 'Unknown/Stub',
    loading: 'Memuat…',
    generalTab: 'Umum',
    youtubeTab: 'YouTube',
    youtubeTitle: 'Alur YouTube',
    youtubeSubtitle: 'Perpindahan ke halaman YouTube dan klik buka video dilaporkan terpisah di sini.',
    youtubeArrivals: 'Tampilan halaman YouTube',
    youtubeDirectNav: 'Klik tab langsung',
    youtubeRedirects: 'Klik kartu pengarah',
    youtubeVideoClicks: 'Klik buka video',
    youtubeSourcePages: 'Halaman sumber',
    youtubeVideos: 'Performa video',
    youtubeVideo: 'Video',
    youtubeRecentClicks: 'Klik YouTube terbaru',
    youtubeNoData: 'Belum ada klik YouTube.',
  },
};

function getRegionNames(lang) {
  if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') return null;
  try {
    return new Intl.DisplayNames([lang], { type: 'region' });
  } catch {
    return null;
  }
}

function normalizeCountryCode(code) {
  const raw = String(code || '').trim().toUpperCase();
  if (!raw || raw === 'UNKNOWN' || raw === 'NULL' || raw === 'N/A' || raw === '-') return 'UN';
  return raw;
}

function countryName(code, lang) {
  const normalized = normalizeCountryCode(code);
  const explicit = {
    tr: { UN: 'Bilinmeyen', XX: 'Bilinmeyen', ZZ: 'Bilinmeyen', EU: 'Avrupa Birliği' },
    en: { UN: 'Unknown', XX: 'Unknown', ZZ: 'Unknown', EU: 'European Union' },
    id: { UN: 'Tidak diketahui', XX: 'Tidak diketahui', ZZ: 'Tidak diketahui', EU: 'Uni Eropa' },
  };
  if (explicit[lang]?.[normalized]) return explicit[lang][normalized];

  const alias = {
    UK: 'GB',
  };
  const lookupCode = alias[normalized] || normalized;
  const regionNames = getRegionNames(lang);
  if (regionNames && /^[A-Z]{2}$/.test(lookupCode)) {
    const label = regionNames.of(lookupCode);
    if (label && label !== lookupCode) return label;
  }
  return normalized;
}

function formatCountryLabel(code, lang) {
  const normalized = normalizeCountryCode(code);
  const name = countryName(normalized, lang);
  if (!name || name === normalized) return normalized;
  return `${normalized} (${name})`;
}

function fmtDateKey(key) {
  const s = String(key || '').trim();
  if (!s) return '-';
  return s;
}

function sumEventTotalsForKeys(statsDoc, keys) {
  const events = statsDoc?.events && typeof statsDoc.events === 'object' ? statsDoc.events : {};
  let sum = 0;
  for (const k of keys) {
    const v = events?.[k]?.total;
    sum += safeNum(v);
  }
  return sum;
}

function getEventTotal(statsDoc, key) {
  const events = statsDoc?.events && typeof statsDoc.events === 'object' ? statsDoc.events : {};
  return safeNum(events?.[key]?.total);
}

function getEventCountries(statsDoc, key) {
  const events = statsDoc?.events && typeof statsDoc.events === 'object' ? statsDoc.events : {};
  const m = events?.[key]?.countries;
  return m && typeof m === 'object' ? m : {};
}

function flattenEvents(statsDoc) {
  const events = statsDoc?.events && typeof statsDoc.events === 'object' ? statsDoc.events : {};
  const out = [];
  for (const [eventKey, data] of Object.entries(events)) {
    const total = safeNum(data?.total);
    const countryMap = data?.countries && typeof data.countries === 'object' ? data.countries : {};
    const topCountries = Object.entries(countryMap)
      .map(([k, v]) => ({ k, v: safeNum(v) }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 6);
    out.push({ eventKey, total, topCountries, countryMap });
  }
  out.sort((a, b) => b.total - a.total);
  return out;
}

function sumCountries(events) {
  const totals = {};
  for (const e of events) {
    const m = e?.countryMap && typeof e.countryMap === 'object' ? e.countryMap : {};
    for (const [k, v] of Object.entries(m)) {
      totals[k] = (totals[k] || 0) + safeNum(v);
    }
  }
  const arr = Object.entries(totals)
    .map(([k, v]) => ({ k, v }))
    .sort((a, b) => b.v - a.v);
  return arr;
}

function sumSourcePages(events) {
  const totals = {};
  for (const e of events) {
    const key = String(e?.page || '').trim() || '-';
    totals[key] = (totals[key] || 0) + 1;
  }
  return Object.entries(totals)
    .map(([k, v]) => ({ k, v }))
    .sort((a, b) => b.v - a.v);
}

function eventLabelTr(eventKey) {
  const raw = String(eventKey || '').trim();
  if (!raw) return '—';

  const authCodeLabelTr = (value) => {
    const key = String(value || '').trim().toLowerCase();
    const labels = {
      unknown: 'bilinmeyen hata',
      popup_blocked: 'popup engellendi',
      popup_closed: 'popup kullanıcı tarafından kapatıldı',
      popup_cancelled: 'popup isteği iptal edildi',
      user_cancelled: 'kullanıcı iptal etti',
      network_request_failed: 'ağ isteği başarısız',
      network_or_timeout: 'ağ veya zaman aşımı sorunu',
      timeout: 'zaman aşımı',
      redirect_result_null: 'Google dönüşü tamamlanamadı',
      unauthorized_domain: 'yetkisiz alan adı',
      operation_not_allowed: 'oturum açma yöntemi kapalı',
      invalid_api_key: 'geçersiz Firebase API anahtarı',
      configuration_not_found: 'Firebase yapılandırması bulunamadı',
      too_many_requests: 'çok fazla istek',
      invalid_email: 'geçersiz e-posta',
      invalid_credential: 'geçersiz kimlik bilgisi',
      wrong_password: 'yanlış şifre',
      user_not_found: 'kullanıcı bulunamadı',
      email_already_in_use: 'e-posta zaten kullanımda',
      weak_password: 'zayıf şifre',
      profile_save_failed: 'profil kaydı başarısız',
      csp_blocked: 'içerik güvenlik kuralı engelledi',
      internal_error: 'iç sistem hatası',
    };
    return labels[key] || value;
  };

  const signupFlowLabelTr = (value) => {
    const flow = String(value || '').trim();
    if (flow === 'google') return 'Google';
    if (flow === 'google_popup') return 'Google popup';
    if (flow === 'google_redirect') return 'Google yönlendirme';
    if (flow === 'email' || flow === 'email_password') return 'E-posta';
    return flow ? flow.replace(/_/g, ' ') : 'bilinmeyen akış';
  };

  // Exact keys
  const exact = {
    session_start: 'Oturum başlangıcı',
    landing_login_signup: 'Login açıldı (kayıt modu)',
    landing_login_auto_signup: 'Login açıldı (otomatik kayıt modu)',
    landing_primary_cta_impression: 'Ana kayıt kartı görüntülendi',
    landing_dropoff_before_primary_action: 'Landingden ana aksiyon almadan çıktı',
    landing_whatsapp_prequalify_click: 'Landing WhatsApp ön bilgi tıkı',
    landing_tour_open: 'Landing güven turu açıldı',
    auth_switch_to_signup: 'Kayıt moduna geçiş (tık)',
    auth_switch_to_login: 'Giriş moduna geçiş (tık)',
    'signup_auto_skipped:inapp': 'Otomatik kayıt atlandı (uygulama içi tarayıcı)',
    'signup_blocked:google_inapp': 'Google kayıt engellendi (uygulama içi tarayıcı)',
    'login_blocked:google_inapp': 'Google giriş engellendi (uygulama içi tarayıcı)',
    'signup_start:google': 'Kayıt başlatıldı (Google)',
    'signup_start:email': 'Kayıt başlatıldı (E-posta)',
    'signup_start:email_password': 'Kayıt başlatıldı (E-posta)',
    'signup_success:google': 'Kayıt başarılı (Google)',
    'signup_success:google_redirect': 'Kayıt başarılı (Google yönlendirme)',
    'signup_success:email': 'Kayıt başarılı (E-posta)',
    'signup_success:email_password': 'Kayıt başarılı (E-posta)',

    // Legacy keys (older client builds)
    'login_start:google': 'Giriş başlatıldı (Google)',
    'login_start:email_password': 'Giriş başlatıldı (E-posta)',
    'login_success:email_password': 'Giriş başarılı (E-posta)',

    // Canonical signin keys
    'signin_start:google': 'Giriş başlatıldı (Google)',
    'signin_start:email': 'Giriş başlatıldı (E-posta)',
    'signin_success:google': 'Giriş başarılı (Google)',
    'signin_success:google_redirect': 'Giriş başarılı (Google yönlendirme)',
    'signin_success:email': 'Giriş başarılı (E-posta)',

    // Transport / fallback diagnostics
    'signup_popup_start:google': 'Google ile kayıt (popup başlatıldı)',
    'signup_redirect_start:google': 'Google ile kayıt (yönlendirme başlatıldı)',
    'login_redirect_start:google': 'Google ile giriş (yönlendirme başlatıldı)',
    'signup_popup_fallback_to_redirect:google': 'Google popup engellendi (yönlendirme denendi)',
    'login_popup_fallback_to_redirect:google': 'Google popup engellendi (yönlendirme denendi)',
    'signup_redirect_result_timeout:google': 'Google kayıt yönlendirmesi zaman aşımına uğradı',
    'login_redirect_result_timeout:google': 'Google giriş yönlendirmesi zaman aşımına uğradı',
    'auth_redirect_no_result:google': 'Google yönlendirmesi döndü ama sonuç tamamlanamadı',
    'auth_redirect_salvaged:google': 'Google yönlendirmesi kurtarıldı',
    'nav_click:/youtube': 'YouTube sekmesine tıklandı',
    'youtube_page_redirect:visit_card': 'YouTube yönlendirme kartı tıklandı',
    'youtube_channel_visit:cta': 'YouTube kanal CTA tıklandı',
  };
  if (exact[raw]) return exact[raw];

  if (raw.startsWith('youtube_video_watch:')) {
    const videoId = raw.slice('youtube_video_watch:'.length) || '-';
    return `YouTube video açıldı/izlemeye gidildi: ${videoId}`;
  }

  if (raw.startsWith('signup_error:') || raw.startsWith('login_error:') || raw.startsWith('signin_error:')) {
    const parts = raw.split(':');
    const kind = parts[0] || '';
    const flow = parts[1] || '';
    const code = parts.slice(2).join(':');

    const flowLabel = (() => {
      if (flow === 'google_popup') return 'Google popup';
      if (flow === 'google_redirect') return 'Google yönlendirme';
      if (flow === 'google_redirect_start') return 'Google yönlendirme başlangıcı';
      if (flow === 'google_popup_fallback_redirect_start') return 'Google popup→yönlendirme yedeği';
      if (flow === 'email' || flow === 'email_password') return 'E-posta';
      return flow ? flow.replace(/_/g, ' ') : '';
    })();

    const codeLabel = (() => {
      const c = String(code || '').trim();
      if (!c) return 'bilinmeyen hata';
      const short = c
        .replace(/^auth\//, '')
        .replace(/^auth_/, '')
        .replace(/^firebase:/, '')
        .trim();
      return authCodeLabelTr(short || c);
    })();

    const kindLabel = kind.startsWith('signup_') ? 'Kayıt hatası' : kind.startsWith('signin_') || kind.startsWith('login_') ? 'Giriş hatası' : 'Hata';
    return flowLabel ? `${kindLabel} (${flowLabel}): ${codeLabel}` : `${kindLabel}: ${codeLabel}`;
  }

  if (raw.startsWith('signup_profile_ready:')) {
    return `Signup profili hazır: ${signupFlowLabelTr(raw.slice('signup_profile_ready:'.length))}`;
  }

  if (raw.startsWith('signup_profile_created:')) {
    return `Signup profil dokümanı oluşturuldu: ${signupFlowLabelTr(raw.slice('signup_profile_created:'.length))}`;
  }

  if (raw.startsWith('signup_apply_bootstrap_ready:')) {
    return `Signup başvuru bootstrap hazır: ${signupFlowLabelTr(raw.slice('signup_apply_bootstrap_ready:'.length))}`;
  }

  if (raw.startsWith('signup_apply_bootstrap_created:')) {
    return `Signup başvuru stub oluşturuldu: ${signupFlowLabelTr(raw.slice('signup_apply_bootstrap_created:'.length))}`;
  }

  if (raw.startsWith('signup_apply_bootstrap_failed:')) {
    return `Signup başvuru bootstrap başarısız: ${signupFlowLabelTr(raw.slice('signup_apply_bootstrap_failed:'.length))}`;
  }

  // Prefixed / pattern keys
  if (raw.startsWith('arrival:')) {
    const path = raw.slice('arrival:'.length);
    return path ? `Sayfa görüntüleme: ${path}` : 'Sayfa görüntüleme';
  }

  if (raw.startsWith('landing_clickid:')) {
    const src = raw.slice('landing_clickid:'.length);
    if (!src) return 'Açılış: tıklama kimliği bulundu';
    if (src === 'google') return 'Açılış: Google tıklama kimliği';
    return `Açılış: tıklama kimliği (${src})`;
  }

  if (raw.startsWith('utm_source:')) {
    const v = raw.slice('utm_source:'.length);
    return v ? `UTM kaynak: ${v}` : 'UTM kaynak';
  }
  if (raw.startsWith('utm_campaign:')) {
    const v = raw.slice('utm_campaign:'.length);
    return v ? `UTM kampanya: ${v}` : 'UTM kampanya';
  }
  if (raw.startsWith('utm_medium:')) {
    const v = raw.slice('utm_medium:'.length);
    return v ? `UTM ortamı: ${v}` : 'UTM ortamı';
  }

  // Generic fallback
  const pretty = raw
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return pretty || raw;
}

function eventLabelGeneric(eventKey) {
  const raw = String(eventKey || '').trim();
  if (!raw) return '—';
  if (raw === 'nav_click:/youtube') return 'YouTube tab clicked';
  if (raw === 'youtube_page_redirect:visit_card') return 'YouTube redirect card clicked';
  if (raw === 'youtube_channel_visit:cta') return 'YouTube channel CTA clicked';
  if (raw.startsWith('youtube_video_watch:')) {
    return `YouTube video opened/watched: ${raw.slice('youtube_video_watch:'.length) || '-'}`;
  }
  if (raw.startsWith('arrival:')) {
    const path = raw.slice('arrival:'.length);
    return path ? `Page view: ${path}` : 'Page view';
  }
  if (raw.startsWith('utm_source:')) return `UTM source: ${raw.slice('utm_source:'.length) || '-'}`;
  if (raw.startsWith('utm_campaign:')) return `UTM campaign: ${raw.slice('utm_campaign:'.length) || '-'}`;
  if (raw.startsWith('utm_medium:')) return `UTM medium: ${raw.slice('utm_medium:'.length) || '-'}`;
  return raw.replace(/_/g, ' ').replace(/:/g, ' / ');
}

function eventLabel(eventKey, lang) {
  return lang === 'tr' ? eventLabelTr(eventKey) : eventLabelGeneric(eventKey);
}

export default function ClickLogsTab() {
  const { i18n } = useTranslation();
  const lang = getBaseLang(i18n?.language);
  const ui = UI[lang];
  const [innerTab, setInnerTab] = useState('general');
  const [days, setDays] = useState(30);
  const [activeDayKey, setActiveDayKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [clickStats, setClickStats] = useState(null);
  const [signups, setSignups] = useState(null);

  const [traceDays, setTraceDays] = useState(2);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceErr, setTraceErr] = useState('');
  const [traceEvents, setTraceEvents] = useState([]);
  const [activeAnonId, setActiveAnonId] = useState('');

  const dayKeys = useMemo(() => (Array.isArray(clickStats?.dayKeys) ? clickStats.dayKeys : []), [clickStats?.dayKeys]);
  const selectedKey = activeDayKey && dayKeys.includes(activeDayKey) ? activeDayKey : dayKeys[0] || '';
  const selectedDoc = selectedKey ? clickStats?.byDay?.[selectedKey] : null;

  const selectedEvents = useMemo(() => flattenEvents(selectedDoc), [selectedDoc]);

  useEffect(() => {
    if (!dayKeys.length) return;
    setActiveDayKey((prev) => (prev && dayKeys.includes(prev) ? prev : dayKeys[0]));
  }, [dayKeys]);

  const passiveSignupLandingKeys = useMemo(
    () => [
      'landing_login_signup',
      'landing_login_auto_signup',
    ],
    []
  );

  const activeSignupIntentKeys = useMemo(
    () => [
      // Gerçek kullanıcı aksiyonu gerektiren kayıt başlangıç sinyalleri.
      // NOTE: totals are per-event unique; the same anonId can contribute to multiple keys.
      // Email/password yöntemini sadece açmak, gerçek kayıt başlangıcı değildir.
      'signup_auto_trigger:google',
      'signup_start:google',
      'signup_start:email',
      'signup_start:email_password',
    ],
    []
  );

  const signupSuccessFunnelKeys = useMemo(
    () => [
      'funnel_signup_completed:google',
      'funnel_signup_completed:google_redirect',
      'funnel_signup_completed:google_popup',
      'funnel_signup_completed:email',
      'funnel_signup_completed:email_password',
    ],
    []
  );

  const signupSuccessEventKeys = useMemo(
    () => [
      'signup_success:google',
      'signup_success:google_redirect',
      'signup_success:email',
      'signup_success:email_password',
    ],
    []
  );

  const signupProfileReadyKeys = useMemo(
    () => [
      'signup_profile_ready:google',
      'signup_profile_ready:google_popup',
      'signup_profile_ready:google_redirect',
      'signup_profile_ready:email',
      'signup_profile_ready:email_password',
    ],
    []
  );

  const signupApplyBootstrapReadyKeys = useMemo(
    () => [
      'signup_apply_bootstrap_ready:google',
      'signup_apply_bootstrap_ready:google_popup',
      'signup_apply_bootstrap_ready:google_redirect',
      'signup_apply_bootstrap_ready:email',
      'signup_apply_bootstrap_ready:email_password',
    ],
    []
  );

  const selectedPassiveSignupLandings = useMemo(
    () => sumEventTotalsForKeys(selectedDoc, passiveSignupLandingKeys),
    [selectedDoc, passiveSignupLandingKeys]
  );
  const selectedSignupStarts = useMemo(() => sumEventTotalsForKeys(selectedDoc, activeSignupIntentKeys), [selectedDoc, activeSignupIntentKeys]);
  const selectedSignupSuccess = useMemo(
    () => sumEventTotalsForKeys(selectedDoc, signupSuccessEventKeys),
    [selectedDoc, signupSuccessEventKeys]
  );
  const selectedFunnelSignupCompleted = useMemo(
    () => sumEventTotalsForKeys(selectedDoc, signupSuccessFunnelKeys),
    [selectedDoc, signupSuccessFunnelKeys]
  );
  const selectedUpperFunnelFriction = useMemo(
    () => Math.max(0, selectedPassiveSignupLandings - selectedSignupStarts),
    [selectedPassiveSignupLandings, selectedSignupStarts]
  );
  const selectedClientAccountCreated = useMemo(
    () => Math.max(selectedSignupSuccess, selectedFunnelSignupCompleted),
    [selectedFunnelSignupCompleted, selectedSignupSuccess]
  );
  const selectedSignupProfileReady = useMemo(
    () => sumEventTotalsForKeys(selectedDoc, signupProfileReadyKeys),
    [selectedDoc, signupProfileReadyKeys]
  );
  const selectedSignupApplyBootstrapReady = useMemo(
    () => sumEventTotalsForKeys(selectedDoc, signupApplyBootstrapReadyKeys),
    [selectedDoc, signupApplyBootstrapReadyKeys]
  );
  const selectedLandingCtaImpressions = useMemo(() => getEventTotal(selectedDoc, 'landing_primary_cta_impression'), [selectedDoc]);
  const selectedLandingDropoff = useMemo(() => getEventTotal(selectedDoc, 'landing_dropoff_before_primary_action'), [selectedDoc]);
  const selectedLandingHelpActions = useMemo(
    () => getEventTotal(selectedDoc, 'landing_whatsapp_prequalify_click') + getEventTotal(selectedDoc, 'landing_tour_open'),
    [selectedDoc]
  );
  const selectedEmailPasswordMethodClicks = useMemo(
    () => getEventTotal(selectedDoc, 'signup_click_email_password'),
    [selectedDoc]
  );
  const selectedSignupClassification = useMemo(
    () => (signups?.classificationByDay && typeof signups.classificationByDay === 'object' ? signups.classificationByDay[selectedKey] || null : null),
    [selectedKey, signups]
  );
  const selectedSubmittedSignupCount = useMemo(
    () => safeNum(selectedSignupClassification?.submitted),
    [selectedSignupClassification]
  );
  const selectedUnknownSignupCount = useMemo(
    () => safeNum(selectedSignupClassification?.unknown),
    [selectedSignupClassification]
  );
  const selectedStubSignupCount = useMemo(
    () => safeNum(selectedSignupClassification?.byState?.stub),
    [selectedSignupClassification]
  );
  const selectedPartialSignupCount = useMemo(
    () => safeNum(selectedSignupClassification?.byState?.partial),
    [selectedSignupClassification]
  );

  const googleSignupDiagnostics = useMemo(() => {
    const success = getEventTotal(selectedDoc, 'signup_success:google') + getEventTotal(selectedDoc, 'signup_success:google_redirect');
    const start = getEventTotal(selectedDoc, 'signup_start:google');
    const popupStart = getEventTotal(selectedDoc, 'signup_popup_start:google');
    const redirectStart = getEventTotal(selectedDoc, 'signup_redirect_start:google');
    const timeout = getEventTotal(selectedDoc, 'signup_redirect_result_timeout:google');
    const noResult = getEventTotal(selectedDoc, 'auth_redirect_no_result:google');
    const salvaged = getEventTotal(selectedDoc, 'auth_redirect_salvaged:google');
    const popupFallback = getEventTotal(selectedDoc, 'signup_popup_fallback_to_redirect:google');
    const inAppBlocked = getEventTotal(selectedDoc, 'signup_blocked:google_inapp');
    const noResultCountries = Object.entries(getEventCountries(selectedDoc, 'auth_redirect_no_result:google'))
      .map(([k, v]) => ({ k, v: safeNum(v) }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 6);
    const timeoutCountries = Object.entries(getEventCountries(selectedDoc, 'signup_redirect_result_timeout:google'))
      .map(([k, v]) => ({ k, v: safeNum(v) }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 6);

    return {
      start,
      popupStart,
      redirectStart,
      success,
      timeout,
      noResult,
      salvaged,
      popupFallback,
      inAppBlocked,
      noResultCountries,
      timeoutCountries,
    };
  }, [selectedDoc]);

  const selectedSignups = useMemo(() => {
    if (!selectedKey) return 0;
    return safeNum(signups?.countsByDay?.[selectedKey]);
  }, [signups, selectedKey]);
  const selectedClientAuthGap = useMemo(
    () => Math.max(0, selectedClientAccountCreated - selectedSignups),
    [selectedClientAccountCreated, selectedSignups]
  );
  const selectedProvisioningGap = useMemo(
    () => Math.max(
      0,
      selectedClientAccountCreated - selectedSignupProfileReady,
      selectedClientAccountCreated - selectedSignupApplyBootstrapReady
    ),
    [selectedClientAccountCreated, selectedSignupApplyBootstrapReady, selectedSignupProfileReady]
  );
  const selectedPostStartLoss = useMemo(() => Math.max(0, selectedSignupStarts - selectedSignups), [selectedSignupStarts, selectedSignups]);

  const firebaseProjectInfo = useMemo(() => {
    const apiProjectId = String(signups?.projectId || '').trim();
    const webProjectId = String(firebaseConfig?.projectId || '').trim();
    const mismatch = !!(apiProjectId && webProjectId && apiProjectId !== webProjectId);
    return { apiProjectId, webProjectId, mismatch };
  }, [signups]);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const [cs, su] = await Promise.all([
        authFetch('/api/admin-click-stats', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ days }),
        }),
        authFetch('/api/admin-signups-count', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ days }),
        }),
      ]);

      setClickStats(cs);
      setSignups(su);
    } catch (e) {
      setErr(String(e?.message || 'veri_alinamadi'));
    } finally {
      setLoading(false);
    }
  };

  const loadTrace = async () => {
    setTraceLoading(true);
    setTraceErr('');
    try {
      const r = await authFetch('/api/admin-click-trace-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ days: traceDays, limit: 800 }),
      });
      setTraceEvents(Array.isArray(r?.events) ? r.events : []);
    } catch (e) {
      setTraceErr(String(e?.message || 'iz_alinamadi'));
      setTraceEvents([]);
    } finally {
      setTraceLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  useEffect(() => {
    loadTrace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traceDays]);

  const sessionStartCountries = useMemo(() => {
    const m = getEventCountries(selectedDoc, 'session_start');
    return Object.entries(m)
      .map(([k, v]) => ({ k, v: safeNum(v) }))
      .sort((a, b) => b.v - a.v);
  }, [selectedDoc]);

  const countryTotals = useMemo(() => sumCountries(selectedEvents), [selectedEvents]);

  const anonSummaries = useMemo(() => {
    const map = new Map();
    for (const e of traceEvents) {
      const anonId = String(e?.anonId || '').trim();
      if (!anonId) continue;
      const cur = map.get(anonId) || { anonId, count: 0, lastAtMs: 0, pages: new Set(), lastPage: '' };
      cur.count += 1;
      const ms = typeof e?.createdAtMs === 'number' ? e.createdAtMs : 0;
      if (ms > cur.lastAtMs) {
        cur.lastAtMs = ms;
        cur.lastPage = String(e?.page || '') || '';
      }
      const page = String(e?.page || '').trim();
      if (page) cur.pages.add(page);
      map.set(anonId, cur);
    }
    const arr = Array.from(map.values()).map((x) => ({
      anonId: x.anonId,
      count: x.count,
      lastAtMs: x.lastAtMs,
      lastPage: x.lastPage,
      uniquePages: x.pages.size,
    }));
    arr.sort((a, b) => (b.lastAtMs || 0) - (a.lastAtMs || 0));
    return arr;
  }, [traceEvents]);

  useEffect(() => {
    if (!anonSummaries.length) return;
    setActiveAnonId((prev) => {
      if (prev && anonSummaries.some((x) => x.anonId === prev)) return prev;
      return anonSummaries[0]?.anonId || '';
    });
  }, [anonSummaries]);

  const visibleTrace = useMemo(() => {
    if (!activeAnonId) return traceEvents;
    return traceEvents.filter((e) => String(e?.anonId || '').trim() === activeAnonId);
  }, [traceEvents, activeAnonId]);

  const traceUaTotals = useMemo(() => {
    const totals = {};
    for (const e of visibleTrace) {
      const key = String(e?.uaHint || '').trim() || 'unknown';
      totals[key] = (totals[key] || 0) + 1;
    }
    return Object.entries(totals)
      .map(([k, v]) => ({ k, v }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 8);
  }, [visibleTrace]);

  const youtubeVideoMap = useMemo(() => {
    const items = Array.isArray(getYouTubeVideosForLang(lang)) ? getYouTubeVideosForLang(lang) : [];
    const map = new Map();
    for (const item of items) {
      const videoId = String(item?.videoId || '').trim();
      if (!videoId) continue;
      map.set(videoId, item);
    }
    return map;
  }, [lang]);

  const youtubeArrivalCount = useMemo(() => getEventTotal(selectedDoc, 'arrival:youtube'), [selectedDoc]);
  const youtubeDirectNavCount = useMemo(() => getEventTotal(selectedDoc, 'nav_click:/youtube'), [selectedDoc]);
  const youtubeRedirectCount = useMemo(() => getEventTotal(selectedDoc, 'youtube_page_redirect:visit_card'), [selectedDoc]);

  const youtubeVideoEvents = useMemo(() => {
    const all = flattenEvents(selectedDoc);
    return all
      .filter((item) => String(item?.eventKey || '').startsWith('youtube_video_watch:'))
      .map((item) => {
        const videoId = String(item.eventKey || '').slice('youtube_video_watch:'.length);
        const meta = youtubeVideoMap.get(videoId) || null;
        return {
          ...item,
          videoId,
          title: String(meta?.title || videoId || '-'),
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [selectedDoc, youtubeVideoMap]);

  const youtubeVideoClickCount = useMemo(
    () => youtubeVideoEvents.reduce((sum, item) => sum + safeNum(item?.total), 0),
    [youtubeVideoEvents]
  );

  const youtubeTraceEvents = useMemo(
    () => traceEvents.filter((event) => {
      const key = String(event?.eventKey || '');
      return key === 'nav_click:/youtube'
        || key === 'youtube_page_redirect:visit_card'
        || key === 'youtube_channel_visit:cta'
        || key.startsWith('youtube_video_watch:');
    }),
    [traceEvents]
  );

  const youtubeSourcePages = useMemo(() => sumSourcePages(youtubeTraceEvents).slice(0, 10), [youtubeTraceEvents]);

  const youtubeAnonSummaries = useMemo(() => {
    const map = new Map();
    for (const e of youtubeTraceEvents) {
      const anonId = String(e?.anonId || '').trim();
      if (!anonId) continue;
      const cur = map.get(anonId) || { anonId, count: 0, lastAtMs: 0, pages: new Set() };
      cur.count += 1;
      const ms = typeof e?.createdAtMs === 'number' ? e.createdAtMs : 0;
      if (ms > cur.lastAtMs) cur.lastAtMs = ms;
      const page = String(e?.page || '').trim();
      if (page) cur.pages.add(page);
      map.set(anonId, cur);
    }
    return Array.from(map.values())
      .map((item) => ({
        anonId: item.anonId,
        count: item.count,
        lastAtMs: item.lastAtMs,
        uniquePages: item.pages.size,
      }))
      .sort((a, b) => (b.lastAtMs || 0) - (a.lastAtMs || 0));
  }, [youtubeTraceEvents]);

  const [youtubeActiveAnonId, setYouTubeActiveAnonId] = useState('');

  useEffect(() => {
    if (!youtubeAnonSummaries.length) {
      setYouTubeActiveAnonId('');
      return;
    }
    setYouTubeActiveAnonId((prev) => (prev && youtubeAnonSummaries.some((item) => item.anonId === prev) ? prev : youtubeAnonSummaries[0].anonId));
  }, [youtubeAnonSummaries]);

  const visibleYouTubeTrace = useMemo(() => {
    if (!youtubeActiveAnonId) return youtubeTraceEvents;
    return youtubeTraceEvents.filter((event) => String(event?.anonId || '').trim() === youtubeActiveAnonId);
  }, [youtubeActiveAnonId, youtubeTraceEvents]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Tıklama Günlüğü</h2>
          <p className="text-sm text-slate-600">
            {ui.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">{ui.day}</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
          >
            <option value={1}>{ui.today}</option>
            <option value={7}>{ui.last7}</option>
            <option value={14}>{ui.last14}</option>
            <option value={30}>{ui.last30}</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black"
            disabled={loading}
          >
            {ui.refresh}
          </button>
        </div>
      </div>

      {err ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{err}</div> : null}
      {traceErr ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{traceErr}</div> : null}
      {firebaseProjectInfo.mismatch ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <div className="font-bold">Firebase proje uyuşmazlığı</div>
          <div className="mt-1 text-sm text-rose-900">
            API (Admin SDK): <span className="font-semibold">{firebaseProjectInfo.apiProjectId || '-'}</span> · Web (Client SDK):{' '}
            <span className="font-semibold">{firebaseProjectInfo.webProjectId || '-'}</span>
          </div>
          <div className="mt-2 text-sm text-rose-800">
            Bu durumda kullanıcılar farklı bir Firebase projesine kayıt oluyor olabilir; admin panel “Kayıt olan” sayısını 0
            gösterebilir.
          </div>
        </div>
      ) : null}

      <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setInnerTab('general')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${innerTab === 'general' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
        >
          {ui.generalTab}
        </button>
        <button
          type="button"
          onClick={() => setInnerTab('youtube')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${innerTab === 'youtube' ? 'bg-red-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
        >
          {ui.youtubeTab}
        </button>
      </div>

      {innerTab === 'youtube' ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-100 bg-[linear-gradient(135deg,rgba(254,242,242,0.96),rgba(255,255,255,0.98))] p-4">
            <h3 className="text-base font-bold text-slate-900">{ui.youtubeTitle}</h3>
            <p className="mt-1 text-sm text-slate-600">{ui.youtubeSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">{ui.youtubeArrivals}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{youtubeArrivalCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">{ui.youtubeDirectNav}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{youtubeDirectNavCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">{ui.youtubeRedirects}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{youtubeRedirectCount}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">{ui.youtubeVideoClicks}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{youtubeVideoClickCount}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">{ui.youtubeSourcePages}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {youtubeSourcePages.length ? youtubeSourcePages.map((item) => (
                  <span key={item.k} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
                    {item.k}:{item.v}
                  </span>
                )) : <span className="text-sm text-slate-500">{ui.youtubeNoData}</span>}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 overflow-x-auto">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">{ui.youtubeVideos}</h3>
                {loading ? <div className="text-xs text-slate-500">{ui.loading}</div> : null}
              </div>
              <table className="w-full mt-3 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                    <th className="py-2 pr-3">{ui.youtubeVideo}</th>
                    <th className="py-2 pr-3">Video ID</th>
                    <th className="py-2 pr-3">{ui.unique}</th>
                    <th className="py-2">{ui.countriesTop}</th>
                  </tr>
                </thead>
                <tbody>
                  {youtubeVideoEvents.map((item) => (
                    <tr key={item.eventKey} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">
                        <div className="font-semibold text-slate-900">{item.title}</div>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs text-slate-600">{item.videoId || '-'}</td>
                      <td className="py-2 pr-3 font-bold">{item.total}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {item.topCountries.length ? item.topCountries.map((countryItem) => (
                            <span key={countryItem.k} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
                              {formatCountryLabel(countryItem.k, lang)}:{countryItem.v}
                            </span>
                          )) : <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!youtubeVideoEvents.length ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-slate-500">{ui.youtubeNoData}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{ui.youtubeRecentClicks}</h3>
                <p className="text-xs text-slate-600">Anon oturum bazında doğrudan sekme, yönlendirme kartı ve video açma tıklamaları listelenir.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-700">{ui.anonSessions}</label>
                <select
                  value={youtubeActiveAnonId}
                  onChange={(e) => setYouTubeActiveAnonId(String(e.target.value))}
                  className="min-w-[240px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
                >
                  {youtubeAnonSummaries.map((item) => (
                    <option key={item.anonId} value={item.anonId}>
                      {item.anonId.slice(0, 10)}… ({item.count} / {item.uniquePages} {ui.pages})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <table className="w-full mt-3 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                  <th className="py-2 pr-3">{ui.time}</th>
                  <th className="py-2 pr-3">{ui.country}</th>
                  <th className="py-2 pr-3">{ui.browser}</th>
                  <th className="py-2 pr-3">{ui.event}</th>
                  <th className="py-2">{ui.page}</th>
                </tr>
              </thead>
              <tbody>
                {visibleYouTubeTrace.slice(0, 200).map((event) => (
                  <tr key={event.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 text-xs font-mono">
                      {typeof event.createdAtMs === 'number'
                        ? new Date(event.createdAtMs).toISOString().slice(0, 19).replace('T', ' ')
                        : '-'}
                    </td>
                    <td className="py-2 pr-3 text-xs font-semibold">{formatCountryLabel(event.country || 'UN', lang)}</td>
                    <td className="py-2 pr-3 text-xs font-mono">{String(event.uaHint || '-')}</td>
                    <td className="py-2 pr-3">
                      <div className="text-xs font-semibold text-slate-900">{eventLabel(event?.eventKey, lang)}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-500">{String(event.eventKey || '')}</div>
                    </td>
                    <td className="py-2 text-xs font-mono">{String(event.page || '')}</td>
                  </tr>
                ))}
                {!visibleYouTubeTrace.length ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-slate-500">{ui.youtubeNoData}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {innerTab !== 'general' ? null : (
        <>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{ui.selectedDay}</div>
          <div className="text-lg font-bold text-slate-900">{fmtDateKey(selectedKey)}</div>
          {dayKeys.length ? (
            <div className="mt-2">
              <select
                value={selectedKey}
                onChange={(e) => setActiveDayKey(String(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
              >
                {dayKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="mt-2 text-sm text-slate-700">
            {ui.totalUnique}: <span className="font-bold">{safeNum(selectedDoc?.totalUnique)}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {ui.sessionStart}: <span className="font-bold">{getEventTotal(selectedDoc, 'session_start')}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{ui.signupLanding}</div>
          <div className="text-lg font-bold text-slate-900">{selectedPassiveSignupLandings}</div>
          <div className="mt-2 text-sm text-slate-700">
            {ui.friction}: <span className="font-bold">{selectedUpperFunnelFriction}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">{ui.ctaImpression}: <span className="font-bold">{selectedLandingCtaImpressions}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.dropoff}: <span className="font-bold">{selectedLandingDropoff}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{ui.realSignupStart}</div>
          <div className="text-lg font-bold text-slate-900">{selectedSignupStarts}</div>
          <div className="mt-2 text-sm text-slate-700">
            {ui.emailPassword}: <span className="font-bold">{selectedEmailPasswordMethodClicks}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">{ui.authRecord}: <span className="font-bold">{selectedSignups}</span></div>
          <div className="mt-1 text-sm text-slate-700">
            {ui.clientCreated}: <span className="font-bold">{selectedClientAccountCreated}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">{ui.profileReady}: <span className="font-bold">{selectedSignupProfileReady}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.stubReady}: <span className="font-bold">{selectedSignupApplyBootstrapReady}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.backendReal}: <span className="font-bold">{selectedSubmittedSignupCount}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.backendUnknown}: <span className="font-bold">{selectedUnknownSignupCount}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.helpActions}: <span className="font-bold">{selectedLandingHelpActions}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{ui.postStartLoss}</div>
          <div className="text-lg font-bold text-slate-900">{selectedPostStartLoss}</div>
          <div className="mt-2 text-sm text-slate-700">{ui.postStartLossNote1}</div>
          <div className="mt-1 text-sm text-slate-700">{ui.postStartLossNote2}</div>
        </div>
      </div>

      {(firebaseProjectInfo.mismatch || selectedClientAuthGap > 0 || selectedProvisioningGap > 0) ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <div className="font-bold">{ui.signupSummary}</div>
          <div className="mt-2 text-sm">
            Hesap oluştu (istemci): <span className="font-semibold">{selectedClientAccountCreated}</span> · Auth kaydı: <span className="font-semibold">{selectedSignups}</span> · Profil hazır: <span className="font-semibold">{selectedSignupProfileReady}</span> · Başvuru stub hazır: <span className="font-semibold">{selectedSignupApplyBootstrapReady}</span>
          </div>
          <div className="mt-1 text-sm text-amber-900">
            Backend snapshot: gerçek form <span className="font-semibold">{selectedSubmittedSignupCount}</span> · bilinmeyen/stub <span className="font-semibold">{selectedUnknownSignupCount}</span>
            {selectedStubSignupCount > 0 ? <> · stub <span className="font-semibold">{selectedStubSignupCount}</span></> : null}
            {selectedPartialSignupCount > 0 ? <> · on kayıt <span className="font-semibold">{selectedPartialSignupCount}</span></> : null}
          </div>
          {selectedClientAuthGap > 0 ? (
            <div className="mt-1 text-sm text-amber-900">
              İstemci tarafında hesap oluştu sinyali Auth sayısından <span className="font-semibold">{selectedClientAuthGap}</span> fazla. Proje uyuşmazlığı veya auth tamamlanmadan kalan akış ihtimali var.
            </div>
          ) : null}
          {selectedProvisioningGap > 0 ? (
            <div className="mt-1 text-sm text-amber-900">
              Signup provisioning adımlarında en az <span className="font-semibold">{selectedProvisioningGap}</span> kullanıcı profili veya başvuru stub'ı hazır olmadan kalmış görünüyor.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{ui.googleStart}</div>
          <div className="text-lg font-bold text-slate-900">{googleSignupDiagnostics.start}</div>
          <div className="mt-2 text-sm text-slate-700">Popup başlangıcı: <span className="font-bold">{googleSignupDiagnostics.popupStart}</span></div>
          <div className="mt-2 text-sm text-slate-700">Yönlendirme başlangıcı: <span className="font-bold">{googleSignupDiagnostics.redirectStart}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{ui.googleSuccess}</div>
          <div className="text-lg font-bold text-emerald-700">{googleSignupDiagnostics.success}</div>
          <div className="mt-2 text-sm text-slate-700">Kurtarılan yönlendirme: <span className="font-bold">{googleSignupDiagnostics.salvaged}</span></div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs uppercase tracking-wide text-amber-700">{ui.redirectIssues}</div>
          <div className="text-lg font-bold text-amber-900">{googleSignupDiagnostics.timeout + googleSignupDiagnostics.noResult}</div>
          <div className="mt-2 text-sm text-amber-900">Zaman aşımı: <span className="font-bold">{googleSignupDiagnostics.timeout}</span> · Sonuçsuz dönüş: <span className="font-bold">{googleSignupDiagnostics.noResult}</span></div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-xs uppercase tracking-wide text-rose-700">{ui.riskyEnv}</div>
          <div className="text-lg font-bold text-rose-900">{googleSignupDiagnostics.popupFallback + googleSignupDiagnostics.inAppBlocked}</div>
          <div className="mt-2 text-sm text-rose-900">Popup→yönlendirme: <span className="font-bold">{googleSignupDiagnostics.popupFallback}</span> · Uygulama içi blok: <span className="font-bold">{googleSignupDiagnostics.inAppBlocked}</span></div>
        </div>
      </div>

      {(googleSignupDiagnostics.noResultCountries.length || googleSignupDiagnostics.timeoutCountries.length) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900">{ui.noResultCountries}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {googleSignupDiagnostics.noResultCountries.map((c) => (
                <span key={c.k} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
                  {formatCountryLabel(c.k, lang)}:{c.v}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900">{ui.timeoutCountries}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {googleSignupDiagnostics.timeoutCountries.map((c) => (
                <span key={c.k} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
                  {formatCountryLabel(c.k, lang)}:{c.v}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 overflow-x-auto">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">{ui.dayEvents}</h3>
            {loading ? <div className="text-xs text-slate-500">{ui.loading}</div> : null}
          </div>

          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                <th className="py-2 pr-3">{ui.event}</th>
                <th className="py-2 pr-3">{ui.unique}</th>
                <th className="py-2">{ui.countriesTop}</th>
              </tr>
            </thead>
            <tbody>
              {selectedEvents.slice(0, 50).map((e) => (
                <tr key={e.eventKey} className="border-b last:border-b-0">
                  <td className="py-2 pr-3">
                    <div className="text-sm font-semibold text-slate-900">{eventLabel(e.eventKey, lang)}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-500">{e.eventKey}</div>
                  </td>
                  <td className="py-2 pr-3 font-bold">{e.total}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {e.topCountries.length ? (
                        e.topCountries.map((c) => (
                          <span
                            key={c.k}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs"
                          >
                            {formatCountryLabel(c.k, lang)}:{c.v}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!selectedEvents.length ? (
                <tr>
                  <td colSpan={3} className="py-4 text-slate-500">
                    {ui.noData}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">{ui.countryBreakdown}</h3>
          <div className="mt-3 space-y-2">
            {(sessionStartCountries.length ? sessionStartCountries : countryTotals).slice(0, 12).map((c) => (
              <div key={c.k} className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">{formatCountryLabel(c.k, lang)}</div>
                <div className="text-sm font-bold text-slate-900">{c.v}</div>
              </div>
            ))}
            {!countryTotals.length ? <div className="text-sm text-slate-500">-</div> : null}
          </div>
          {!sessionStartCountries.length && countryTotals.length ? (
            <div className="mt-3 text-xs text-amber-700">{ui.countryFallback}</div>
          ) : null}
          <div className="mt-3 text-xs text-slate-500">
            {ui.countryNote}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{ui.userTraceTitle}</h3>
            <p className="text-xs text-slate-600">
              {ui.userTraceSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">{ui.range}</label>
            <select
              value={traceDays}
              onChange={(e) => setTraceDays(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
            >
              <option value={1}>{ui.hours24}</option>
              <option value={2}>{ui.hours48}</option>
              <option value={7}>{ui.days7}</option>
              <option value={14}>{ui.days14}</option>
            </select>
            <button
              type="button"
              onClick={loadTrace}
              className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black"
              disabled={traceLoading}
            >
              {ui.refresh}
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">{ui.anonSessions}</div>
            <div className="mt-2">
              <select
                value={activeAnonId}
                onChange={(e) => setActiveAnonId(String(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
              >
                {anonSummaries.slice(0, 60).map((x) => (
                  <option key={x.anonId} value={x.anonId}>
                    {x.anonId.slice(0, 10)}… ({x.count} / {x.uniquePages} {ui.pages})
                  </option>
                ))}
              </select>
            </div>
            {activeAnonId ? (
              <div className="mt-2 text-xs text-slate-600 break-all">
                anonId: <span className="font-mono">{activeAnonId}</span>
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-500">-</div>
            )}
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-3 overflow-x-auto">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-slate-500">{ui.lastActions}</div>
              {traceLoading ? <div className="text-xs text-slate-500">{ui.loading}</div> : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {traceUaTotals.map((item) => (
                <span key={item.k} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
                  {item.k}:{item.v}
                </span>
              ))}
              {!traceUaTotals.length ? <span className="text-xs text-slate-400">{ui.noBrowserHint}</span> : null}
            </div>

            <table className="w-full mt-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                  <th className="py-2 pr-3">{ui.time}</th>
                  <th className="py-2 pr-3">{ui.country}</th>
                  <th className="py-2 pr-3">{ui.browser}</th>
                  <th className="py-2 pr-3">{ui.language}</th>
                  <th className="py-2 pr-3">{ui.timezone}</th>
                  <th className="py-2 pr-3">{ui.event}</th>
                  <th className="py-2">{ui.page}</th>
                </tr>
              </thead>
              <tbody>
                {visibleTrace.slice(0, 200).map((e) => (
                  <tr key={e.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 text-xs font-mono">
                      {typeof e.createdAtMs === 'number'
                        ? new Date(e.createdAtMs).toISOString().slice(0, 19).replace('T', ' ')
                        : '-'}
                    </td>
                    <td className="py-2 pr-3 text-xs font-semibold">{formatCountryLabel(e.country || 'UN', lang)}</td>
                    <td className="py-2 pr-3 text-xs font-mono">{String(e.uaHint || '-')}</td>
                    <td className="py-2 pr-3 text-xs font-mono">{String(e.lang || '-')}</td>
                    <td className="py-2 pr-3 text-xs font-mono">{String(e.tz || '-')}</td>
                    <td className="py-2 pr-3">
                      <div className="text-xs font-semibold text-slate-900">{eventLabel(e?.eventKey, lang)}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-500">{String(e.eventKey || '')}</div>
                    </td>
                    <td className="py-2 text-xs font-mono">{String(e.page || '')}</td>
                  </tr>
                ))}
                {!visibleTrace.length ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-slate-500">
                      {ui.noTrace}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {dayKeys.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-900">{ui.summaryLastDays.replace('{{days}}', String(days))}</h3>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                <th className="py-2 pr-3">{ui.day}</th>
                <th className="py-2 pr-3">{ui.totalUnique}</th>
                <th className="py-2 pr-3">{ui.realSignupStart}</th>
                <th className="py-2 pr-3">{ui.emailPassword}</th>
                <th className="py-2 pr-3">{ui.signupCount}</th>
                <th className="py-2">{ui.unknownStub}</th>
              </tr>
            </thead>
            <tbody>
              {dayKeys.map((k) => {
                const doc = clickStats?.byDay?.[k] || null;
                const totalUnique = safeNum(doc?.totalUnique);
                const signupStarts = sumEventTotalsForKeys(doc, activeSignupIntentKeys);
                const emailMethodClicks = getEventTotal(doc, 'signup_click_email_password');
                const signupCount = safeNum(signups?.countsByDay?.[k]);
                const unknownCount = safeNum(signups?.classificationByDay?.[k]?.unknown);
                const isActive = k === selectedKey;
                return (
                  <tr key={k} className={`border-b last:border-b-0 ${isActive ? 'bg-emerald-50/70' : ''}`}>
                    <td className="py-2 pr-3 font-semibold">
                      <button
                        type="button"
                        onClick={() => setActiveDayKey(k)}
                        className="text-left hover:underline"
                      >
                        {k}
                      </button>
                    </td>
                    <td className="py-2 pr-3 font-bold">{totalUnique}</td>
                    <td className="py-2 pr-3 font-bold">{signupStarts}</td>
                    <td className="py-2 pr-3 font-bold">{emailMethodClicks}</td>
                    <td className="py-2 pr-3 font-bold">{signupCount}</td>
                    <td className="py-2 font-bold">{unknownCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
        </>
      )}
    </div>
  );
}
