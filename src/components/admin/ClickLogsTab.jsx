import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../utils/authFetch';
import { firebaseConfig } from '../../config/firebasePublicConfig';

function safeNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

const regionNamesTr =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['tr'], { type: 'region' })
    : null;

function normalizeCountryCode(code) {
  const raw = String(code || '').trim().toUpperCase();
  if (!raw || raw === 'UNKNOWN' || raw === 'NULL' || raw === 'N/A' || raw === '-') return 'UN';
  return raw;
}

function countryNameTr(code) {
  const normalized = normalizeCountryCode(code);
  const explicit = {
    UN: 'Bilinmeyen',
    XX: 'Bilinmeyen',
    ZZ: 'Bilinmeyen',
    EU: 'Avrupa Birliği',
  };
  if (explicit[normalized]) return explicit[normalized];

  const alias = {
    UK: 'GB',
  };
  const lookupCode = alias[normalized] || normalized;
  if (regionNamesTr && /^[A-Z]{2}$/.test(lookupCode)) {
    const label = regionNamesTr.of(lookupCode);
    if (label && label !== lookupCode) return label;
  }
  return normalized;
}

function formatCountryLabel(code) {
  const normalized = normalizeCountryCode(code);
  const name = countryNameTr(normalized);
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
  };
  if (exact[raw]) return exact[raw];

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

export default function ClickLogsTab() {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Tıklama Günlüğü</h2>
          <p className="text-sm text-slate-600">
            Her tarayıcı için, aynı gün içinde aynı buton/sekme sadece 1 kez sayılır. Ülke bilgisi varsa proxy header’larından alınır.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">Gün</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
          >
            <option value={1}>Bugün</option>
            <option value={7}>Son 7 gün</option>
            <option value={14}>Son 14 gün</option>
            <option value={30}>Son 30 gün</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black"
            disabled={loading}
          >
            Yenile
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Seçili gün</div>
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
            Toplam unique event: <span className="font-bold">{safeNum(selectedDoc?.totalUnique)}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">
            Oturum başlangıcı (yaklaşık ziyaretçi): <span className="font-bold">{getEventTotal(selectedDoc, 'session_start')}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Signup modunda açılış</div>
          <div className="text-lg font-bold text-slate-900">{selectedPassiveSignupLandings}</div>
          <div className="mt-2 text-sm text-slate-700">
            Landing→aksiyon sürtünmesi: <span className="font-bold">{selectedUpperFunnelFriction}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">CTA görünümü: <span className="font-bold">{selectedLandingCtaImpressions}</span></div>
          <div className="mt-1 text-sm text-slate-700">Aksiyonsuz çıkış: <span className="font-bold">{selectedLandingDropoff}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Gerçek kayıt başlangıcı</div>
          <div className="text-lg font-bold text-slate-900">{selectedSignupStarts}</div>
          <div className="mt-2 text-sm text-slate-700">
            Email/Şifre seçildi: <span className="font-bold">{selectedEmailPasswordMethodClicks}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">
            Auth kaydı: <span className="font-bold">{selectedSignups}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">
            Hesap oluştu (istemci): <span className="font-bold">{selectedClientAccountCreated}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">Profil hazır (event): <span className="font-bold">{selectedSignupProfileReady}</span></div>
          <div className="mt-1 text-sm text-slate-700">Başvuru stub hazır (event): <span className="font-bold">{selectedSignupApplyBootstrapReady}</span></div>
          <div className="mt-1 text-sm text-slate-700">Backend gerçek form: <span className="font-bold">{selectedSubmittedSignupCount}</span></div>
          <div className="mt-1 text-sm text-slate-700">Backend bilinmeyen/stub: <span className="font-bold">{selectedUnknownSignupCount}</span></div>
          <div className="mt-1 text-sm text-slate-700">WhatsApp/Tur yardımı: <span className="font-bold">{selectedLandingHelpActions}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Başlangıç sonrası kayıp</div>
          <div className="text-lg font-bold text-slate-900">{selectedPostStartLoss}</div>
          <div className="mt-2 text-sm text-slate-700">Sadece gerçek kayıt başlatan kullanıcılar baz alınır.</div>
          <div className="mt-1 text-sm text-slate-700">Pasif landing sayıları bu metriğe dahil edilmez.</div>
        </div>
      </div>

      {(firebaseProjectInfo.mismatch || selectedClientAuthGap > 0 || selectedProvisioningGap > 0) ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <div className="font-bold">Signup teşhis özeti</div>
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
          <div className="text-xs uppercase tracking-wide text-slate-500">Google kayıt başlangıcı</div>
          <div className="text-lg font-bold text-slate-900">{googleSignupDiagnostics.start}</div>
          <div className="mt-2 text-sm text-slate-700">Popup başlangıcı: <span className="font-bold">{googleSignupDiagnostics.popupStart}</span></div>
          <div className="mt-2 text-sm text-slate-700">Yönlendirme başlangıcı: <span className="font-bold">{googleSignupDiagnostics.redirectStart}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Google kayıt başarısı</div>
          <div className="text-lg font-bold text-emerald-700">{googleSignupDiagnostics.success}</div>
          <div className="mt-2 text-sm text-slate-700">Kurtarılan yönlendirme: <span className="font-bold">{googleSignupDiagnostics.salvaged}</span></div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs uppercase tracking-wide text-amber-700">Redirect sorunları</div>
          <div className="text-lg font-bold text-amber-900">{googleSignupDiagnostics.timeout + googleSignupDiagnostics.noResult}</div>
          <div className="mt-2 text-sm text-amber-900">Zaman aşımı: <span className="font-bold">{googleSignupDiagnostics.timeout}</span> · Sonuçsuz dönüş: <span className="font-bold">{googleSignupDiagnostics.noResult}</span></div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-xs uppercase tracking-wide text-rose-700">Riskli çevre</div>
          <div className="text-lg font-bold text-rose-900">{googleSignupDiagnostics.popupFallback + googleSignupDiagnostics.inAppBlocked}</div>
          <div className="mt-2 text-sm text-rose-900">Popup→yönlendirme: <span className="font-bold">{googleSignupDiagnostics.popupFallback}</span> · Uygulama içi blok: <span className="font-bold">{googleSignupDiagnostics.inAppBlocked}</span></div>
        </div>
      </div>

      {(googleSignupDiagnostics.noResultCountries.length || googleSignupDiagnostics.timeoutCountries.length) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900">Google yönlendirmesi sonuçsuz dönen ülkeler</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {googleSignupDiagnostics.noResultCountries.map((c) => (
                <span key={c.k} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
                  {formatCountryLabel(c.k)}:{c.v}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-bold text-slate-900">Google yönlendirmesi zaman aşımına düşen ülkeler</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {googleSignupDiagnostics.timeoutCountries.map((c) => (
                <span key={c.k} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
                  {formatCountryLabel(c.k)}:{c.v}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 overflow-x-auto">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Seçili gün — Olay listesi</h3>
            {loading ? <div className="text-xs text-slate-500">Yükleniyor…</div> : null}
          </div>

          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                <th className="py-2 pr-3">Olay</th>
                <th className="py-2 pr-3">Tekil</th>
                <th className="py-2">Ülke (top)</th>
              </tr>
            </thead>
            <tbody>
              {selectedEvents.slice(0, 50).map((e) => (
                <tr key={e.eventKey} className="border-b last:border-b-0">
                  <td className="py-2 pr-3">
                    <div className="text-sm font-semibold text-slate-900">{eventLabelTr(e.eventKey)}</div>
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
                            {formatCountryLabel(c.k)}:{c.v}
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
                    Henüz veri yok.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">Seçili gün — Ülke kırılımı (Oturum başlangıcı)</h3>
          <div className="mt-3 space-y-2">
            {(sessionStartCountries.length ? sessionStartCountries : countryTotals).slice(0, 12).map((c) => (
              <div key={c.k} className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">{formatCountryLabel(c.k)}</div>
                <div className="text-sm font-bold text-slate-900">{c.v}</div>
              </div>
            ))}
            {!countryTotals.length ? <div className="text-sm text-slate-500">-</div> : null}
          </div>
          {!sessionStartCountries.length && countryTotals.length ? (
            <div className="mt-3 text-xs text-amber-700">Oturum başlangıcı ülke verisi yok; tüm event toplamı gösteriliyor.</div>
          ) : null}
          <div className="mt-3 text-xs text-slate-500">
            Not: Ülke, Vercel/Cloudflare header’ları varsa görünür. Yoksa UN (Bilinmeyen) olarak kalır.
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Kullanıcı İzleri (ham tıklama akışı)</h3>
            <p className="text-xs text-slate-600">
              Bu tablo, buton/link tıklamalarını (best-effort) trace olarak yazar. Adblock/ETP veya JS sorunlarında eksik olabilir.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">Aralık</label>
            <select
              value={traceDays}
              onChange={(e) => setTraceDays(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
            >
              <option value={1}>24 saat</option>
              <option value={2}>48 saat</option>
              <option value={7}>7 gün</option>
              <option value={14}>14 gün</option>
            </select>
            <button
              type="button"
              onClick={loadTrace}
              className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black"
              disabled={traceLoading}
            >
              Yenile
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Anon oturumlar</div>
            <div className="mt-2">
              <select
                value={activeAnonId}
                onChange={(e) => setActiveAnonId(String(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
              >
                {anonSummaries.slice(0, 60).map((x) => (
                  <option key={x.anonId} value={x.anonId}>
                    {x.anonId.slice(0, 10)}… ({x.count} / {x.uniquePages} sayfa)
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
              <div className="text-xs uppercase tracking-wide text-slate-500">Son hareketler</div>
              {traceLoading ? <div className="text-xs text-slate-500">Yükleniyor…</div> : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {traceUaTotals.map((item) => (
                <span key={item.k} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs">
                  {item.k}:{item.v}
                </span>
              ))}
              {!traceUaTotals.length ? <span className="text-xs text-slate-400">Tarayıcı ipucu henüz yok</span> : null}
            </div>

            <table className="w-full mt-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                  <th className="py-2 pr-3">Zaman</th>
                  <th className="py-2 pr-3">Ülke</th>
                  <th className="py-2 pr-3">Tarayıcı</th>
                  <th className="py-2 pr-3">Dil</th>
                  <th className="py-2 pr-3">TZ</th>
                  <th className="py-2 pr-3">Olay</th>
                  <th className="py-2">Sayfa</th>
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
                    <td className="py-2 pr-3 text-xs font-semibold">{formatCountryLabel(e.country || 'UN')}</td>
                    <td className="py-2 pr-3 text-xs font-mono">{String(e.uaHint || '-')}</td>
                    <td className="py-2 pr-3 text-xs font-mono">{String(e.lang || '-')}</td>
                    <td className="py-2 pr-3 text-xs font-mono">{String(e.tz || '-')}</td>
                    <td className="py-2 pr-3">
                      <div className="text-xs font-semibold text-slate-900">{eventLabelTr(e?.eventKey)}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-500">{String(e.eventKey || '')}</div>
                    </td>
                    <td className="py-2 text-xs font-mono">{String(e.page || '')}</td>
                  </tr>
                ))}
                {!visibleTrace.length ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-slate-500">
                      Henüz trace yok.
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
          <h3 className="text-sm font-bold text-slate-900">Son {days} gün — Özet</h3>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                <th className="py-2 pr-3">Gün</th>
                <th className="py-2 pr-3">Tekil olay</th>
                <th className="py-2 pr-3">Gerçek kayıt başlangıcı</th>
                <th className="py-2 pr-3">Email/Şifre seçildi</th>
                <th className="py-2 pr-3">Kayıt</th>
                <th className="py-2">Bilinmeyen/Stub</th>
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
    </div>
  );
}
