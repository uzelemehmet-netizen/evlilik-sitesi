import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../utils/authFetch';

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

export default function ClickLogsTab() {
  const [days, setDays] = useState(30);
  const [activeDayKey, setActiveDayKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [clickStats, setClickStats] = useState(null);
  const [signups, setSignups] = useState(null);

  const dayKeys = Array.isArray(clickStats?.dayKeys) ? clickStats.dayKeys : [];
  const selectedKey = activeDayKey && dayKeys.includes(activeDayKey) ? activeDayKey : dayKeys[0] || '';
  const selectedDoc = selectedKey ? clickStats?.byDay?.[selectedKey] : null;

  const selectedEvents = useMemo(() => flattenEvents(selectedDoc), [selectedDoc]);

  useEffect(() => {
    if (!dayKeys.length) return;
    setActiveDayKey((prev) => (prev && dayKeys.includes(prev) ? prev : dayKeys[0]));
  }, [dayKeys]);

  const signupEventKeys = useMemo(
    () => ['cta_signup_home_hero', 'cta_signup_home_sticky', 'cta_signup_home_services_card', 'cta_signup_home_howitworks'],
    []
  );

  const selectedSignupClicks = useMemo(() => sumEventTotalsForKeys(selectedDoc, signupEventKeys), [selectedDoc, signupEventKeys]);

  const selectedSignups = useMemo(() => {
    if (!selectedKey) return 0;
    return safeNum(signups?.countsByDay?.[selectedKey]);
  }, [signups, selectedKey]);

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const countryTotals = useMemo(() => sumCountries(selectedEvents), [selectedEvents]);

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
            Toplam unique tıklama: <span className="font-bold">{safeNum(selectedDoc?.totalUnique)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Kayıt Ol tıklaması</div>
          <div className="text-lg font-bold text-slate-900">{selectedSignupClicks}</div>
          <div className="mt-2 text-sm text-slate-700">
            Kayıt olan: <span className="font-bold">{selectedSignups}</span>
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
                  <td className="py-2 pr-3 font-mono text-xs">{e.eventKey}</td>
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
          <h3 className="text-sm font-bold text-slate-900">Seçili gün — Ülke kırılımı</h3>
          <div className="mt-3 space-y-2">
            {countryTotals.slice(0, 12).map((c) => (
              <div key={c.k} className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">{c.k}</div>
                <div className="text-sm font-bold text-slate-900">{c.v}</div>
              </div>
            ))}
            {!countryTotals.length ? <div className="text-sm text-slate-500">-</div> : null}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Not: Ülke, Vercel/Cloudflare header’ları varsa görünür. Yoksa UN olarak kalır.
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
                <th className="py-2 pr-3">Unique tıklama</th>
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
