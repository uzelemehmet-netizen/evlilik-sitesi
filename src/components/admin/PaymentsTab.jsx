import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../utils/authFetch';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

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

function shortId(s, head = 6, tail = 4) {
  const v = safeStr(s);
  if (!v) return '';
  if (v.length <= head + tail + 1) return v;
  return `${v.slice(0, head)}…${v.slice(-tail)}`;
}

export default function PaymentsTab() {
  const [status, setStatus] = useState('pending');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(120);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [acting, setActing] = useState(false);

  const payload = useMemo(() => {
    const next = { limit };
    const st = safeStr(status).toLowerCase();
    if (st && st !== 'all') next.status = st;
    const qq = safeStr(q);
    if (qq) next.q = qq;
    return next;
  }, [status, q, limit]);

  const load = async () => {
    setLoading(true);
    setErr('');
    setMsg('');
    try {
      const data = await authFetch('/api/admin-payments-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setErr(String(e?.message || 'payments_load_failed'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (row) => {
    const paymentId = safeStr(row?.id);
    const uid = safeStr(row?.userId);
    if (!paymentId || !uid) return;

    const ok = window.confirm(`Ödemeyi onayla?\npaymentId=${paymentId}\nuid=${uid}`);
    if (!ok) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      await authFetch('/api/admin-user-action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid, action: 'approvePayment', paymentId }),
      });
      setMsg('Ödeme onaylandı.');
      await load();
    } catch (e) {
      setErr(String(e?.message || 'approve_failed'));
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Ödemeler</h2>
          <p className="text-sm text-gray-600">matchmakingPayments kayıtları (admin onayı / arama)</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            disabled={loading || acting}
          >
            <option value="pending">Bekleyen</option>
            <option value="approved">Onaylanan</option>
            <option value="rejected">Reddedilen</option>
            <option value="all">Tümü</option>
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: paymentId / uid / email"
            className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded text-sm"
            disabled={loading || acting}
          />
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </button>
        </div>
      </div>

      {err ? <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-sm">{err}</div> : null}
      {msg ? <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-900 text-sm">{msg}</div> : null}

      <div className="mt-4 border rounded-xl overflow-hidden">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Kullanıcı</th>
                <th className="text-left px-3 py-2">Durum</th>
                <th className="text-left px-3 py-2">Paket</th>
                <th className="text-left px-3 py-2">Tutar</th>
                <th className="text-left px-3 py-2">Oluştu</th>
                <th className="text-left px-3 py-2">Karar</th>
                <th className="text-right px-3 py-2">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => {
                const isPending = safeStr(x?.status).toLowerCase() === 'pending';
                return (
                  <tr key={x?.id} className="border-t">
                    <td className="px-3 py-2 font-mono" title={safeStr(x?.id)}>{shortId(x?.id, 10, 6) || '-'}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-800 break-all">{safeStr(x?.userEmail) || '-'}</div>
                      <div className="text-[11px] text-gray-600 font-mono">{shortId(x?.userId) || '-'}</div>
                    </td>
                    <td className="px-3 py-2">{safeStr(x?.status) || '-'}</td>
                    <td className="px-3 py-2">{safeStr(x?.tier) || '-'}</td>
                    <td className="px-3 py-2">
                      {typeof x?.amount === 'number' ? `${x.amount}${safeStr(x?.currency) ? ` ${safeStr(x.currency)}` : ''}` : '-'}
                    </td>
                    <td className="px-3 py-2">{fmtDate(x?.createdAtMs)}</td>
                    <td className="px-3 py-2">
                      <div className="text-[11px] text-gray-700">{safeStr(x?.decidedBy) ? `by ${shortId(x.decidedBy)}` : '-'}</div>
                      <div className="text-[11px] text-gray-600">{x?.decidedAtMs ? fmtDate(x.decidedAtMs) : ''}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isPending && safeStr(x?.userId) ? (
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => approve(x)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-60"
                        >
                          Onayla
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!items.length && !loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500">Kayıt yok.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
          <div>Gösterilen: <span className="font-semibold text-gray-900">{items.length}</span></div>
          <div className="flex items-center gap-2">
            <span>Limit</span>
            <input
              value={String(limit)}
              onChange={(e) => setLimit(Math.max(20, Math.min(300, Number(e.target.value) || 120)))}
              className="w-20 px-2 py-1 border rounded"
              type="number"
              min={20}
              max={300}
              disabled={loading || acting}
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-600">
        Not: Onayla butonu, ilgili <span className="font-mono">paymentId</span> kaydını onaylar ve üyeliği aktif eder.
      </p>
    </div>
  );
}
