import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '../../utils/authFetch';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function getBaseLang(language) {
  const base = String(language || 'tr').toLowerCase().split('-')[0];
  return base === 'en' || base === 'id' ? base : 'tr';
}

const UI = {
  tr: {
    title: 'Admin Logları',
    subtitle: 'Admin aksiyon kayıtları',
    search: 'Ara: aksiyon / uid / e-posta / hata',
    loading: 'Yükleniyor…',
    refresh: 'Yenile',
    time: 'Zaman',
    admin: 'Admin',
    action: 'Aksiyon',
    target: 'Hedef',
    result: 'Sonuç',
    meta: 'Meta',
    ok: 'OK',
    error: 'HATA',
    show: 'Göster',
    empty: 'Kayıt yok.',
    shown: 'Gösterilen',
    limit: 'Limit',
  },
  en: {
    title: 'Admin Logs',
    subtitle: 'Admin action records',
    search: 'Search: action / uid / email / error',
    loading: 'Loading…',
    refresh: 'Refresh',
    time: 'Time',
    admin: 'Admin',
    action: 'Action',
    target: 'Target',
    result: 'Result',
    meta: 'Meta',
    ok: 'OK',
    error: 'ERROR',
    show: 'Show',
    empty: 'No records.',
    shown: 'Shown',
    limit: 'Limit',
  },
  id: {
    title: 'Log Admin',
    subtitle: 'Catatan aksi admin',
    search: 'Cari: aksi / uid / email / error',
    loading: 'Memuat…',
    refresh: 'Segarkan',
    time: 'Waktu',
    admin: 'Admin',
    action: 'Aksi',
    target: 'Target',
    result: 'Hasil',
    meta: 'Meta',
    ok: 'OK',
    error: 'ERROR',
    show: 'Lihat',
    empty: 'Tidak ada data.',
    shown: 'Ditampilkan',
    limit: 'Batas',
  },
};

function fmtDate(ms, lang) {
  try {
    if (!ms || typeof ms !== 'number') return '-';
    return new Intl.DateTimeFormat(lang, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return '-';
  }
}

function shortId(s, head = 6, tail = 4) {
  const v = safeStr(s);
  if (!v) return '';
  if (v.length <= head + tail + 1) return v;
  return `${v.slice(0, head)}…${v.slice(-tail)}`;
}

function auditActionLabel(value) {
  const raw = safeStr(value);
  if (!raw) return '-';
  const labels = {
    login: 'Giriş',
    logout: 'Çıkış',
    create: 'Oluşturma',
    update: 'Güncelleme',
    delete: 'Silme',
    approve: 'Onaylama',
    reject: 'Reddetme',
    run: 'Çalıştırma',
  };
  if (labels[raw]) return labels[raw];
  return raw.replace(/_/g, ' ');
}

function auditErrorLabel(value) {
  const raw = safeStr(value);
  if (!raw) return '';
  const labels = {
    unauthorized: 'yetkisiz',
    forbidden: 'erişim yasak',
    not_found: 'bulunamadı',
    bad_request: 'geçersiz istek',
    server_error: 'sunucu hatası',
    audit_load_failed: 'kayıtlar yüklenemedi',
  };
  return labels[raw] || raw.replace(/_/g, ' ');
}

export default function AuditLogsTab() {
  const { i18n } = useTranslation();
  const lang = getBaseLang(i18n?.language);
  const ui = UI[lang];
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(120);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const payload = useMemo(() => {
    const next = { limit };
    if (safeStr(q)) next.q = safeStr(q);
    return next;
  }, [q, limit]);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await authFetch('/api/admin-audit-logs-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setErr(String(e?.message || 'audit_load_failed'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{ui.title}</h2>
          <p className="text-sm text-gray-600">{ui.subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ui.search}
            className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded text-sm"
            disabled={loading}
          />
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? ui.loading : ui.refresh}
          </button>
        </div>
      </div>

      {err ? <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-sm">{err}</div> : null}

      <div className="mt-4 border rounded-xl overflow-hidden">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-3 py-2">{ui.time}</th>
                <th className="text-left px-3 py-2">{ui.admin}</th>
                <th className="text-left px-3 py-2">{ui.action}</th>
                <th className="text-left px-3 py-2">{ui.target}</th>
                <th className="text-left px-3 py-2">{ui.result}</th>
                <th className="text-left px-3 py-2">{ui.meta}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x?.id} className="border-t">
                  <td className="px-3 py-2 text-xs text-gray-700">{fmtDate(x?.createdAtMs, lang)}</td>
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-800 break-all">{safeStr(x?.adminEmail) || '-'}</div>
                    <div className="text-[11px] text-gray-600 font-mono">{shortId(x?.adminUid) || ''}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">{auditActionLabel(x?.action)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{shortId(x?.targetUid) || '-'}</td>
                  <td className="px-3 py-2">
                    {x?.ok ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-900">{ui.ok}</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border border-rose-200 bg-rose-50 text-rose-900">{ui.error}</span>
                    )}
                    {!x?.ok && safeStr(x?.error) ? <div className="mt-1 text-xs text-rose-800">{auditErrorLabel(x.error)}</div> : null}
                  </td>
                  <td className="px-3 py-2">
                    {x?.meta ? (
                      <details>
                        <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">{ui.show}</summary>
                        <pre className="mt-2 text-[11px] overflow-auto bg-white border rounded p-2">{JSON.stringify(x.meta, null, 2)}</pre>
                      </details>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {!items.length && !loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">{ui.empty}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
          <div>{ui.shown}: <span className="font-semibold text-gray-900">{items.length}</span></div>
          <div className="flex items-center gap-2">
            <span>{ui.limit}</span>
            <input
              value={String(limit)}
              onChange={(e) => setLimit(Math.max(20, Math.min(300, Number(e.target.value) || 120)))}
              className="w-20 px-2 py-1 border rounded"
              type="number"
              min={20}
              max={300}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

