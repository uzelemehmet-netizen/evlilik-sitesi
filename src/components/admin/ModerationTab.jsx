import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../utils/authFetch';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function fmtDate(tsLike) {
  try {
    let ms = 0;
    if (typeof tsLike?.toMillis === 'function') ms = tsLike.toMillis();
    else if (typeof tsLike === 'number') ms = tsLike;
    if (!ms) return '-';
    return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ms));
  } catch {
    return '-';
  }
}

const STATUS_OPTIONS = [
  { id: '', label: 'Tümü' },
  { id: 'new', label: 'Yeni' },
  { id: 'in_progress', label: 'İşlemde' },
  { id: 'done', label: 'Tamam' },
  { id: 'rejected', label: 'Reddedildi' },
];

export default function ModerationTab() {
  const [status, setStatus] = useState('new');
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(80);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const [noteById, setNoteById] = useState({});
  const [statusById, setStatusById] = useState({});

  const payload = useMemo(() => {
    const next = { limit };
    if (safeStr(status)) next.status = safeStr(status);
    if (safeStr(kind)) next.kind = safeStr(kind);
    if (safeStr(q)) next.q = safeStr(q);
    return next;
  }, [status, kind, q, limit]);

  const load = async () => {
    setLoading(true);
    setErr('');
    setMsg('');
    try {
      const data = await authFetch('/api/admin-feedback-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const rows = Array.isArray(data?.items) ? data.items : [];
      setItems(rows);

      const nextStatusById = {};
      for (const it of rows) {
        const id = safeStr(it?.id);
        if (!id) continue;
        nextStatusById[id] = safeStr(it?.status) || 'new';
      }
      setStatusById((prev) => ({ ...nextStatusById, ...prev }));
    } catch (e) {
      setErr(String(e?.message || 'feedback_load_failed'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (it) => {
    const id = safeStr(it?.id);
    if (!id) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      await authFetch('/api/admin-feedback-update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id,
          status: safeStr(statusById?.[id]) || '',
          note: safeStr(noteById?.[id]) || '',
          userId: safeStr(it?.userId) || '',
        }),
      });
      setMsg('Güncellendi.');
      setNoteById((p) => ({ ...p, [id]: '' }));
      await load();
    } catch (e) {
      setErr(String(e?.message || 'update_failed'));
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Şikayetler / Moderasyon</h2>
          <p className="text-sm text-gray-600">matchmakingFeedback kayıtları</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border rounded text-sm" disabled={loading || acting}>
            {STATUS_OPTIONS.map((x) => (
              <option key={x.id || 'all'} value={x.id}>{x.label}</option>
            ))}
          </select>
          <input
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            placeholder="kind (opsiyonel)"
            className="px-3 py-2 border rounded text-sm"
            disabled={loading || acting}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: matchId / uid / email / step"
            className="w-full sm:w-80 px-3 py-2 border rounded text-sm"
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

      {!items.length && !loading ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">Kayıt yok.</div>
      ) : null}

      <div className="mt-4 space-y-3">
        {items.map((it) => {
          const id = safeStr(it?.id);
          const st = safeStr(statusById?.[id]) || safeStr(it?.status) || 'new';
          const note = safeStr(noteById?.[id]);

          return (
            <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 break-all">{safeStr(it?.step) || safeStr(it?.kind) || 'Feedback'}</div>
                  <div className="mt-1 text-xs text-slate-700 break-all">
                    <span className="font-semibold">ID:</span> <span className="font-mono">{id || '-'}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-700 break-all">
                    <span className="font-semibold">User:</span> <span className="font-mono">{safeStr(it?.userId) || '-'}</span>
                    {safeStr(it?.userEmail) ? <span className="ml-2 text-slate-600">({safeStr(it.userEmail)})</span> : null}
                  </div>
                  <div className="mt-1 text-xs text-slate-700 break-all">
                    <span className="font-semibold">Match:</span> <span className="font-mono">{safeStr(it?.matchId) || '-'}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">Tarih: {fmtDate(it?.createdAt || it?.updatedAt || null)}</div>

                  {safeStr(it?.text) ? (
                    <div className="mt-2 text-sm text-slate-900 whitespace-pre-wrap">{safeStr(it.text)}</div>
                  ) : null}

                  {it?.data ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">Detay</summary>
                      <pre className="mt-2 text-[11px] overflow-auto bg-white border rounded p-2">{JSON.stringify(it.data, null, 2)}</pre>
                    </details>
                  ) : null}
                </div>

                <div className="w-full md:w-80 flex flex-col gap-2">
                  <select
                    value={st}
                    onChange={(e) => setStatusById((p) => ({ ...p, [id]: e.target.value }))}
                    className="px-3 py-2 border rounded text-sm"
                    disabled={acting}
                  >
                    {STATUS_OPTIONS.filter((x) => x.id).map((x) => (
                      <option key={x.id} value={x.id}>{x.label}</option>
                    ))}
                  </select>
                  <input
                    value={note}
                    onChange={(e) => setNoteById((p) => ({ ...p, [id]: e.target.value }))}
                    placeholder="Admin notu (opsiyonel)"
                    className="px-3 py-2 border rounded text-sm"
                    disabled={acting}
                  />
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => update(it)}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
                  >
                    Güncelle
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-600 flex items-center justify-between">
        <div>Gösterilen: <span className="font-semibold text-gray-900">{items.length}</span></div>
        <div className="flex items-center gap-2">
          <span>Limit</span>
          <input
            value={String(limit)}
            onChange={(e) => setLimit(Math.max(10, Math.min(200, Number(e.target.value) || 80)))}
            className="w-20 px-2 py-1 border rounded"
            type="number"
            min={10}
            max={200}
            disabled={loading || acting}
          />
        </div>
      </div>
    </div>
  );
}
