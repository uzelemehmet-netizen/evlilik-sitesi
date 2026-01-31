import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { authFetch } from '../utils/authFetch';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function fmtTs(v) {
  try {
    if (!v) return '';
    if (typeof v === 'number') return new Date(v).toLocaleString();
    if (typeof v?.toMillis === 'function') return new Date(v.toMillis()).toLocaleString();
    if (typeof v?.seconds === 'number') return new Date(v.seconds * 1000).toLocaleString();
  } catch {
    // ignore
  }
  return '';
}

const STATUS_OPTIONS = ['new', 'in_progress', 'done', 'rejected'];

export default function AdminFeedback() {
  const [filters, setFilters] = useState({ kind: '', status: 'new', q: '' });
  const [state, setState] = useState({ loading: true, error: '', items: [] });
  const [updatingId, setUpdatingId] = useState('');
  const [noteDraftById, setNoteDraftById] = useState({});

  const queryPayload = useMemo(
    () => ({
      kind: safeStr(filters.kind),
      status: safeStr(filters.status),
      q: safeStr(filters.q),
      limit: 80,
    }),
    [filters.kind, filters.q, filters.status]
  );

  const load = async () => {
    setState((p) => ({ ...p, loading: true, error: '' }));
    try {
      const data = await authFetch('/api/admin-feedback-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(queryPayload),
      });
      const items = Array.isArray(data?.items) ? data.items : [];
      setState({ loading: false, error: '', items });
    } catch (e) {
      setState({ loading: false, error: String(e?.message || 'load_failed'), items: [] });
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPayload.kind, queryPayload.status]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const note = safeStr(noteDraftById?.[id]);
      await authFetch('/api/admin-feedback-update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, status, ...(note ? { note } : {}) }),
      });
      setNoteDraftById((p) => ({ ...p, [id]: '' }));
      await load();
    } catch (e) {
      alert(String(e?.message || 'update_failed'));
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Admin dashboard
            </Link>
            <h1 className="text-xl font-bold">Gelen bildirimler</h1>
          </div>

          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Yenile
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700">Kategori</span>
            <select
              value={filters.kind}
              onChange={(e) => setFilters((p) => ({ ...p, kind: e.target.value }))}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">(hepsi)</option>
              <option value="bug">bug</option>
              <option value="suggestion">suggestion</option>
              <option value="complaint">complaint</option>
              <option value="other">other</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700">Durum</span>
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">(hepsi)</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-slate-700">Ara (id/matchId/user)</span>
            <input
              value={filters.q}
              onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="örn: matchId, userId, email"
            />
            <button
              type="button"
              onClick={load}
              className="mt-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ara
            </button>
          </label>
        </div>

        {state.error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {state.error}
          </div>
        ) : null}

        <div className="mt-4">
          {state.loading ? (
            <div className="text-sm text-slate-600">Yükleniyor…</div>
          ) : state.items.length === 0 ? (
            <div className="text-sm text-slate-600">Kayıt yok.</div>
          ) : (
            <div className="space-y-3">
              {state.items.map((x) => {
                const createdAt = fmtTs(x?.createdAt) || fmtTs(x?.createdAtMs);
                const attachments = Array.isArray(x?.attachments) ? x.attachments : [];

                return (
                  <div key={x.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {safeStr(x?.kind) || 'other'} • {safeStr(x?.status) || '-'}
                      </div>
                      <div className="text-xs text-slate-500">{createdAt}</div>
                    </div>

                    <div className="mt-2 text-xs text-slate-600">
                      <div>id: {x.id}</div>
                      {x?.matchId ? <div>matchId: {x.matchId}</div> : null}
                      {x?.step ? <div>step: {x.step}</div> : null}
                      {x?.userEmail ? <div>user: {x.userEmail}</div> : x?.userId ? <div>userId: {x.userId}</div> : null}
                    </div>

                    <div className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                      {safeStr(x?.message) || '-'}
                    </div>

                    {attachments.length ? (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                        {attachments.map((a, idx) => (
                          <a key={idx} href={a?.secureUrl} target="_blank" rel="noreferrer" className="block">
                            <img
                              src={a?.secureUrl}
                              alt={a?.originalFilename || 'attachment'}
                              className="h-28 w-full rounded-lg object-cover border border-slate-200"
                              loading="lazy"
                              decoding="async"
                            />
                          </a>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      <label className="md:col-span-2">
                        <div className="text-xs font-semibold text-slate-700">Admin notu (opsiyonel)</div>
                        <input
                          value={safeStr(noteDraftById?.[x.id])}
                          onChange={(e) => setNoteDraftById((p) => ({ ...p, [x.id]: e.target.value }))}
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                          placeholder="Kısa not..."
                        />
                      </label>

                      <label>
                        <div className="text-xs font-semibold text-slate-700">Durum güncelle</div>
                        <select
                          value={safeStr(x?.status) || 'new'}
                          onChange={(e) => updateStatus(x.id, e.target.value)}
                          disabled={updatingId === x.id}
                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-60"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
