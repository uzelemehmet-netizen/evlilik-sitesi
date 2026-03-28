import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../utils/authFetch';
import { firebaseConfig } from '../../config/firebasePublicConfig';

function safeNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
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

  // Exact keys
  const exact = {
    session_start: 'Oturum başlangıcı',
    landing_login_signup: 'Login açıldı (kayıt modu)',
    landing_login_auto_signup: 'Login açıldı (otomatik kayıt modu)',
    auth_switch_to_signup: 'Kayıt moduna geçiş (tık)',
    auth_switch_to_login: 'Giriş moduna geçiş (tık)',
    'signup_auto_skipped:inapp': 'Otomatik kayıt atlandı (in-app)',
    'signup_start:google': 'Kayıt başlatıldı (Google)',
    'signup_start:email': 'Kayıt başlatıldı (E-posta)',
    'signup_success:google': 'Kayıt başarılı (Google)',
    'signup_success:google_redirect': 'Kayıt başarılı (Google redirect)',
    'signup_success:email': 'Kayıt başarılı (E-posta)',
    'signin_start:google': 'Giriş başlatıldı (Google)',
    'signin_start:email': 'Giriş başlatıldı (E-posta)',
    'signin_success:google': 'Giriş başarılı (Google)',
    'signin_success:email': 'Giriş başarılı (E-posta)',
  };
  if (exact[raw]) return exact[raw];

  // Prefixed / pattern keys
  if (raw.startsWith('arrival:')) {
    const path = raw.slice('arrival:'.length);
    return path ? `Sayfa görüntüleme: ${path}` : 'Sayfa görüntüleme';
  }

  if (raw.startsWith('landing_clickid:')) {
    const src = raw.slice('landing_clickid:'.length);
    if (!src) return 'Landing: click id bulundu';
    if (src === 'google') return 'Landing: Google click id';
    return `Landing: click id (${src})`;
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
    return v ? `UTM medium: ${v}` : 'UTM medium';
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

  const dayKeys = Array.isArray(clickStats?.dayKeys) ? clickStats.dayKeys : [];
  const selectedKey = activeDayKey && dayKeys.includes(activeDayKey) ? activeDayKey : dayKeys[0] || '';
  const selectedDoc = selectedKey ? clickStats?.byDay?.[selectedKey] : null;

  const selectedEvents = useMemo(() => flattenEvents(selectedDoc), [selectedDoc]);

  useEffect(() => {
    if (!dayKeys.length) return;
    setActiveDayKey((prev) => (prev && dayKeys.includes(prev) ? prev : dayKeys[0]));
  }, [dayKeys]);

  const signupEventKeys = useMemo(
    () => [
      // Primary funnel signals for “signup intent”.
      // NOTE: totals are per-event unique; the same anonId can contribute to multiple keys.
      'auth_switch_to_signup',
      'landing_login_signup',
      'landing_login_auto_signup',
      'signup_auto_trigger:google',
      'signup_start:google',
      'signup_start:email',
    ],
    []
  );

  const signupSuccessEventKeys = useMemo(
    () => [
      'signup_success:google',
      'signup_success:google_redirect',
      'signup_success:email',
    ],
    []
  );

  const selectedSignupClicks = useMemo(() => sumEventTotalsForKeys(selectedDoc, signupEventKeys), [selectedDoc, signupEventKeys]);
  const selectedSignupSuccess = useMemo(
    () => sumEventTotalsForKeys(selectedDoc, signupSuccessEventKeys),
    [selectedDoc, signupSuccessEventKeys]
  );

  const selectedSignups = useMemo(() => {
    if (!selectedKey) return 0;
    return safeNum(signups?.countsByDay?.[selectedKey]);
  }, [signups, selectedKey]);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          <div className="text-xs uppercase tracking-wide text-slate-500">Signup intent (approx)</div>
          <div className="text-lg font-bold text-slate-900">{selectedSignupClicks}</div>
          <div className="mt-2 text-sm text-slate-700">
            Kayıt olan: <span className="font-bold">{selectedSignups}</span>
          </div>
          <div className="mt-1 text-sm text-slate-700">
            Kayıt başarılı event: <span className="font-bold">{selectedSignupSuccess}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Tahmini kayıpsızlık</div>
          <div className="text-lg font-bold text-slate-900">
            {selectedSignupClicks > 0 ? Math.max(0, selectedSignupClicks - selectedSignups) : 0}
          </div>
          <div className="mt-2 text-sm text-slate-700">(Kayıt ol tıklayıp kayıt olmayan approx.)</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 overflow-x-auto">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Seçili gün — Event listesi</h3>
            {loading ? <div className="text-xs text-slate-500">Yükleniyor…</div> : null}
          </div>

          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                <th className="py-2 pr-3">Event</th>
                <th className="py-2 pr-3">Unique</th>
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
                            {c.k}:{c.v}
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
                <div className="text-sm font-semibold text-slate-700">{c.k}</div>
                <div className="text-sm font-bold text-slate-900">{c.v}</div>
              </div>
            ))}
            {!countryTotals.length ? <div className="text-sm text-slate-500">-</div> : null}
          </div>
          {!sessionStartCountries.length && countryTotals.length ? (
            <div className="mt-3 text-xs text-amber-700">Oturum başlangıcı ülke verisi yok; tüm event toplamı gösteriliyor.</div>
          ) : null}
          <div className="mt-3 text-xs text-slate-500">
            Not: Ülke, Vercel/Cloudflare header’ları varsa görünür. Yoksa UN olarak kalır.
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
              <div className="text-xs uppercase tracking-wide text-slate-500">Son olaylar</div>
              {traceLoading ? <div className="text-xs text-slate-500">Yükleniyor…</div> : null}
            </div>

            <table className="w-full mt-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                  <th className="py-2 pr-3">Zaman</th>
                  <th className="py-2 pr-3">Ülke</th>
                  <th className="py-2 pr-3">Dil</th>
                  <th className="py-2 pr-3">TZ</th>
                  <th className="py-2 pr-3">Event</th>
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
                    <td className="py-2 pr-3 text-xs font-semibold">{String(e.country || 'UN')}</td>
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
                    <td colSpan={6} className="py-4 text-slate-500">
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
                <th className="py-2 pr-3">Unique event</th>
                <th className="py-2 pr-3">Kayıt ol tık</th>
                <th className="py-2">Signup</th>
              </tr>
            </thead>
            <tbody>
              {dayKeys.map((k) => {
                const doc = clickStats?.byDay?.[k] || null;
                const totalUnique = safeNum(doc?.totalUnique);
                const signupClicks = sumEventTotalsForKeys(doc, signupEventKeys);
                const signupCount = safeNum(signups?.countsByDay?.[k]);
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
                    <td className="py-2 pr-3 font-bold">{signupClicks}</td>
                    <td className="py-2 font-bold">{signupCount}</td>
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
