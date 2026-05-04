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
    title: 'Ödemeler',
    subtitle: 'matchmakingPayments kayıtları (admin onayı / arama)',
    statuses: { pending: 'Bekleyen', approved: 'Onaylanan', rejected: 'Reddedilen', all: 'Tümü' },
    search: 'Ara: paymentId / uid / email',
    loading: 'Yükleniyor…',
    refresh: 'Yenile',
    approvePrompt: 'Ödemeyi onayla?',
    approved: 'Ödeme onaylandı.',
    approve: 'Onayla',
    empty: 'Kayıt yok.',
    shown: 'Gösterilen',
    limit: 'Limit',
    notePrefix: 'Not: Onayla butonu, ilgili',
    noteSuffix: 'kaydını onaylar ve üyeliği aktif eder.',
    headers: ['ID', 'Kullanıcı', 'Durum', 'Paket', 'Tutar', 'Oluştu', 'Karar', 'İşlem'],
    by: 'by',
  },
  en: {
    title: 'Payments',
    subtitle: 'matchmakingPayments records (admin approval / search)',
    statuses: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', all: 'All' },
    search: 'Search: paymentId / uid / email',
    loading: 'Loading…',
    refresh: 'Refresh',
    approvePrompt: 'Approve this payment?',
    approved: 'Payment approved.',
    approve: 'Approve',
    empty: 'No records.',
    shown: 'Shown',
    limit: 'Limit',
    notePrefix: 'Note: The approve button approves the related',
    noteSuffix: 'record and activates the membership.',
    headers: ['ID', 'User', 'Status', 'Tier', 'Amount', 'Created', 'Decision', 'Action'],
    by: 'by',
  },
  id: {
    title: 'Pembayaran',
    subtitle: 'rekaman matchmakingPayments (persetujuan admin / pencarian)',
    statuses: { pending: 'Pending', approved: 'Disetujui', rejected: 'Ditolak', all: 'Semua' },
    search: 'Cari: paymentId / uid / email',
    loading: 'Memuat…',
    refresh: 'Segarkan',
    approvePrompt: 'Setujui pembayaran ini?',
    approved: 'Pembayaran disetujui.',
    approve: 'Setujui',
    empty: 'Tidak ada data.',
    shown: 'Ditampilkan',
    limit: 'Batas',
    notePrefix: 'Catatan: Tombol setujui akan menyetujui',
    noteSuffix: 'terkait dan mengaktifkan membership.',
    headers: ['ID', 'Pengguna', 'Status', 'Paket', 'Jumlah', 'Dibuat', 'Keputusan', 'Aksi'],
    by: 'oleh',
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

export default function PaymentsTab() {
  const { i18n } = useTranslation();
  const lang = getBaseLang(i18n?.language);
  const ui = UI[lang];

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
  }, []);

  const approve = async (row) => {
    const paymentId = safeStr(row?.id);
    const uid = safeStr(row?.userId);
    if (!paymentId || !uid) return;

    const ok = window.confirm(`${ui.approvePrompt}\npaymentId=${paymentId}\nuid=${uid}`);
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
      setMsg(ui.approved);
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
          <h2 className="text-lg font-semibold text-gray-800">{ui.title}</h2>
          <p className="text-sm text-gray-600">{ui.subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded text-sm" disabled={loading || acting}>
            <option value="pending">{ui.statuses.pending}</option>
            <option value="approved">{ui.statuses.approved}</option>
            <option value="rejected">{ui.statuses.rejected}</option>
            <option value="all">{ui.statuses.all}</option>
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ui.search} className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded text-sm" disabled={loading || acting} />
          <button type="button" onClick={load} disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
            {loading ? ui.loading : ui.refresh}
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
                {ui.headers.map((header, index) => (
                  <th key={header} className={`${index === ui.headers.length - 1 ? 'text-right' : 'text-left'} px-3 py-2`}>{header}</th>
                ))}
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
                    <td className="px-3 py-2">{typeof x?.amount === 'number' ? `${x.amount}${safeStr(x?.currency) ? ` ${safeStr(x.currency)}` : ''}` : '-'}</td>
                    <td className="px-3 py-2">{fmtDate(x?.createdAtMs, lang)}</td>
                    <td className="px-3 py-2">
                      <div className="text-[11px] text-gray-700">{safeStr(x?.decidedBy) ? `${ui.by} ${shortId(x.decidedBy)}` : '-'}</div>
                      <div className="text-[11px] text-gray-600">{x?.decidedAtMs ? fmtDate(x.decidedAtMs, lang) : ''}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isPending && safeStr(x?.userId) ? (
                        <button type="button" disabled={acting} onClick={() => approve(x)} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-60">
                          {ui.approve}
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
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500">{ui.empty}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
          <div>{ui.shown}: <span className="font-semibold text-gray-900">{items.length}</span></div>
          <div className="flex items-center gap-2">
            <span>{ui.limit}</span>
            <input value={String(limit)} onChange={(e) => setLimit(Math.max(20, Math.min(300, Number(e.target.value) || 120)))} className="w-20 px-2 py-1 border rounded" type="number" min={20} max={300} disabled={loading || acting} />
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-600">
        {ui.notePrefix} <span className="font-mono">paymentId</span> {ui.noteSuffix}
      </p>
    </div>
  );
}
