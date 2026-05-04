import { useEffect, useMemo, useState } from 'react';

import { authFetch } from '../../utils/authFetch';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeLang(raw) {
  const base = String(raw || 'tr').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'en' || base === 'id') return base;
  return 'tr';
}

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
  if (!v) return '-';
  if (v.length <= head + tail + 1) return v;
  return `${v.slice(0, head)}…${v.slice(-tail)}`;
}

const UI = {
  tr: {
    title: 'Silinen Hesaplar',
    subtitle: 'Hesabını kendi isteğiyle silen kullanıcılar burada görünür.',
    search: 'Ara: isim / e-posta / uid / kullanıcı adı / telefon',
    refresh: 'Yenile',
    loading: 'Yükleniyor…',
    empty: 'Henüz silinen hesap kaydı yok.',
    shown: 'Gösterilen',
    limit: 'Limit',
    time: 'Silinme zamanı',
    person: 'Kişi',
    contact: 'İletişim',
    uid: 'UID',
    source: 'Kaynak',
    sourceSelf: 'Kullanıcı kendi sildi',
  },
  en: {
    title: 'Deleted Accounts',
    subtitle: 'Users who deleted their own account appear here.',
    search: 'Search: name / email / uid / username / phone',
    refresh: 'Refresh',
    loading: 'Loading…',
    empty: 'No deleted-account records yet.',
    shown: 'Shown',
    limit: 'Limit',
    time: 'Deleted at',
    person: 'Person',
    contact: 'Contact',
    uid: 'UID',
    source: 'Source',
    sourceSelf: 'User self-deleted',
  },
  id: {
    title: 'Akun Dihapus',
    subtitle: 'Pengguna yang menghapus akunnya sendiri akan muncul di sini.',
    search: 'Cari: nama / email / uid / username / telepon',
    refresh: 'Segarkan',
    loading: 'Memuat…',
    empty: 'Belum ada catatan akun dihapus.',
    shown: 'Ditampilkan',
    limit: 'Batas',
    time: 'Waktu hapus',
    person: 'Orang',
    contact: 'Kontak',
    uid: 'UID',
    source: 'Sumber',
    sourceSelf: 'Pengguna menghapus sendiri',
  },
};

export default function DeletedAccountsTab({ lang = 'tr' }) {
  const ui = useMemo(() => UI[normalizeLang(lang)] || UI.tr, [lang]);
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(120);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const payload = useMemo(() => {
    const next = { limit };
    if (safeStr(q)) next.q = safeStr(q);
    return next;
  }, [q, limit]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch('/api/admin-account-deletion-logs-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(String(e?.message || 'request_failed'));
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

      {error ? <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-sm">{error}</div> : null}

      <div className="mt-4 border rounded-xl overflow-hidden">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-3 py-2">{ui.time}</th>
                <th className="text-left px-3 py-2">{ui.person}</th>
                <th className="text-left px-3 py-2">{ui.contact}</th>
                <th className="text-left px-3 py-2">{ui.uid}</th>
                <th className="text-left px-3 py-2">{ui.source}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item?.id} className="border-t">
                  <td className="px-3 py-2 text-xs text-gray-700">{fmtDate(item?.deletedAtMs, lang)}</td>
                  <td className="px-3 py-2">
                    <div className="text-sm font-semibold text-gray-900">{safeStr(item?.fullName) || '-'}</div>
                    <div className="text-xs text-gray-600">@{safeStr(item?.username) || '-'}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-xs text-gray-800 break-all">{safeStr(item?.email) || '-'}</div>
                    <div className="text-[11px] text-gray-600">{safeStr(item?.whatsapp) || '-'}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{shortId(item?.uid)}</td>
                  <td className="px-3 py-2 text-xs text-gray-700">{item?.source === 'self_service' ? ui.sourceSelf : safeStr(item?.source) || '-'}</td>
                </tr>
              ))}

              {!items.length && !loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">{ui.empty}</td>
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