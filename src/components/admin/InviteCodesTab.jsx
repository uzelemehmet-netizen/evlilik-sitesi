import React, { useEffect, useState } from 'react';
import { authFetch } from '../../utils/authFetch';

function fmtDate(ms) {
  try {
    if (!ms || typeof ms !== 'number') return '-';
    return new Intl.DateTimeFormat('tr-TR', {
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

function shortUid(uid) {
  const s = String(uid || '');
  if (!s) return '-';
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export default function InviteCodesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await authFetch('/api/admin-invite-codes-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pageSize: 200 }),
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setErr(String(e?.message || 'liste_yuklenemedi'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Davet Kodları</h2>
          <p className="text-sm text-gray-600">Kullanıcıların WhatsApp ile ürettiği 4 haneli kodlar</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="app-btn app-btn-indigo h-10 px-4 disabled:opacity-60"
        >
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </button>
      </div>

      {err ? <div className="mt-3 text-sm text-rose-700">{err}</div> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="px-3 py-2">Kod</th>
              <th className="px-3 py-2">Durum</th>
              <th className="px-3 py-2">Kullanıcı Kodu</th>
              <th className="px-3 py-2">Kullanıcı Adı</th>
              <th className="px-3 py-2">UID</th>
              <th className="px-3 py-2">Oluşturma</th>
              <th className="px-3 py-2">Kullanan UID</th>
              <th className="px-3 py-2">Kullanım</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-mono font-semibold text-gray-900">{String(x.code || '-')}</td>
                <td className="px-3 py-2">{String(x.status || '-')}</td>
                <td className="px-3 py-2 font-mono">{x.inviterUserCode ? String(x.inviterUserCode) : '-'}</td>
                <td className="px-3 py-2">{x.inviterName ? String(x.inviterName) : '-'}</td>
                <td className="px-3 py-2 font-mono">{shortUid(x.inviterUid)}</td>
                <td className="px-3 py-2">{fmtDate(x.createdAtMs)}</td>
                <td className="px-3 py-2 font-mono">{x.redeemedByUid ? shortUid(x.redeemedByUid) : '-'}</td>
                <td className="px-3 py-2">{x.redeemedAtMs ? fmtDate(x.redeemedAtMs) : '-'}</td>
              </tr>
            ))}
            {!items.length && !loading ? (
              <tr>
                <td className="px-3 py-4 text-gray-600" colSpan={8}>Kayıt yok.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
