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
    title: 'Dönüşüm riski / Moderasyon',
    subtitle: 'Yalnızca dönüşüm kaybı sinyali taşıyan matchmakingFeedback kayıtları',
    all: 'Tümü',
    new: 'Yeni',
    inProgress: 'İşlemde',
    done: 'Tamam',
    rejected: 'Reddedildi',
    today: 'Bugün',
    kind: 'kind (opsiyonel)',
    search: 'Ara: matchId / uid / email / step',
    loading: 'Yükleniyor…',
    refresh: 'Yenile',
    updated: 'Güncellendi.',
    empty: 'Kayıt yok.',
    feedback: 'Feedback',
    detail: 'Detay',
    created: 'Gönderim',
    updatedAt: 'Güncelleme',
    adminNote: 'Admin notu (opsiyonel)',
    update: 'Güncelle',
    shown: 'Gösterilen',
    limit: 'Limit',
  },
  en: {
    title: 'Conversion Risk / Moderation',
    subtitle: 'Only matchmakingFeedback records that signal conversion loss',
    all: 'All',
    new: 'New',
    inProgress: 'In progress',
    done: 'Done',
    rejected: 'Rejected',
    today: 'Today',
    kind: 'kind (optional)',
    search: 'Search: matchId / uid / email / step',
    loading: 'Loading…',
    refresh: 'Refresh',
    updated: 'Updated.',
    empty: 'No records.',
    feedback: 'Feedback',
    detail: 'Detail',
    created: 'Submitted',
    updatedAt: 'Updated',
    adminNote: 'Admin note (optional)',
    update: 'Update',
    shown: 'Shown',
    limit: 'Limit',
  },
  id: {
    title: 'Risiko Konversi / Moderasi',
    subtitle: 'Hanya rekaman matchmakingFeedback yang memberi sinyal kehilangan konversi',
    all: 'Semua',
    new: 'Baru',
    inProgress: 'Diproses',
    done: 'Selesai',
    rejected: 'Ditolak',
    today: 'Hari ini',
    kind: 'kind (opsional)',
    search: 'Cari: matchId / uid / email / step',
    loading: 'Memuat…',
    refresh: 'Segarkan',
    updated: 'Diperbarui.',
    empty: 'Tidak ada data.',
    feedback: 'Feedback',
    detail: 'Detail',
    created: 'Dikirim',
    updatedAt: 'Diperbarui',
    adminNote: 'Catatan admin (opsional)',
    update: 'Perbarui',
    shown: 'Ditampilkan',
    limit: 'Batas',
  },
};

function fmtDate(tsLike, lang) {
  try {
    let ms = 0;
    if (typeof tsLike?.toMillis === 'function') ms = tsLike.toMillis();
    else if (typeof tsLike === 'number') ms = tsLike;
    if (!ms) return '-';
    return new Intl.DateTimeFormat(lang, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ms));
  } catch {
    return '-';
  }
}

export default function ModerationTab() {
  const { i18n } = useTranslation();
  const lang = getBaseLang(i18n?.language);
  const ui = UI[lang];
  const statusOptions = [
    { id: '', label: ui.all },
    { id: 'new', label: ui.new },
    { id: 'in_progress', label: ui.inProgress },
    { id: 'done', label: ui.done },
    { id: 'rejected', label: ui.rejected },
  ];
  const [status, setStatus] = useState('new');
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(80);
  const [todayOnly, setTodayOnly] = useState(false);

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
    if (todayOnly) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      next.sinceMs = d.getTime();
    }
    return next;
  }, [status, kind, q, limit, todayOnly]);

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
      setMsg(ui.updated);
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
          <h2 className="text-lg font-semibold text-gray-800">{ui.title}</h2>
          <p className="text-sm text-gray-600">{ui.subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border rounded text-sm" disabled={loading || acting}>
            {statusOptions.map((x) => (
              <option key={x.id || 'all'} value={x.id}>{x.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-3 py-2 border rounded text-sm bg-white">
            <input
              type="checkbox"
              checked={todayOnly}
              onChange={(e) => setTodayOnly(e.target.checked)}
              disabled={loading || acting}
            />
            {ui.today}
          </label>
          <input
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            placeholder={ui.kind}
            className="px-3 py-2 border rounded text-sm"
            disabled={loading || acting}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ui.search}
            className="w-full sm:w-80 px-3 py-2 border rounded text-sm"
            disabled={loading || acting}
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
      {msg ? <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-900 text-sm">{msg}</div> : null}

      {!items.length && !loading ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">{ui.empty}</div>
      ) : null}

      <div className="mt-4 space-y-3">
        {items.map((it) => {
          const id = safeStr(it?.id);
          const st = safeStr(statusById?.[id]) || safeStr(it?.status) || 'new';
          const note = safeStr(noteById?.[id]);
          const createdAt = it?.createdAt || null;
          const updatedAt = it?.updatedAt || null;

          return (
            <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 break-all">{safeStr(it?.step) || safeStr(it?.kind) || ui.feedback}</div>
                  <div className="mt-1 text-xs text-slate-700 break-all">
                    <span className="font-semibold">ID:</span> <span className="font-mono">{id || '-'}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-700 break-all">
                    <span className="font-semibold">User:</span> <span className="font-mono">{safeStr(it?.userId) || '-'}</span>
                    {safeStr(it?.userEmail) ? <span className="ml-2 text-slate-600">({safeStr(it.userEmail)})</span> : null}
                  </div>
                  {safeStr(it?.contact) || safeStr(it?.context?.contact) ? (
                    <div className="mt-1 text-xs text-slate-700 break-all">
                      <span className="font-semibold">Contact:</span>{' '}
                      <span className="font-mono">{safeStr(it?.contact) || safeStr(it?.context?.contact)}</span>
                    </div>
                  ) : null}
                  <div className="mt-1 text-xs text-slate-700 break-all">
                    <span className="font-semibold">Match:</span> <span className="font-mono">{safeStr(it?.matchId) || '-'}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    <span className="font-semibold">{ui.created}:</span> {fmtDate(createdAt, lang)}
                    {updatedAt && updatedAt !== createdAt ? (
                      <span className="ml-2">
                        <span className="font-semibold">{ui.updatedAt}:</span> {fmtDate(updatedAt, lang)}
                      </span>
                    ) : null}
                  </div>

                  {safeStr(it?.text) ? (
                    <div className="mt-2 text-sm text-slate-900 whitespace-pre-wrap">{safeStr(it.text)}</div>
                  ) : null}

                  {it?.data ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">{ui.detail}</summary>
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
                    {statusOptions.filter((x) => x.id).map((x) => (
                      <option key={x.id} value={x.id}>{x.label}</option>
                    ))}
                  </select>
                  <input
                    value={note}
                    onChange={(e) => setNoteById((p) => ({ ...p, [id]: e.target.value }))}
                    placeholder={ui.adminNote}
                    className="px-3 py-2 border rounded text-sm"
                    disabled={acting}
                  />
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => update(it)}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
                  >
                    {ui.update}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-gray-600 flex items-center justify-between">
        <div>{ui.shown}: <span className="font-semibold text-gray-900">{items.length}</span></div>
        <div className="flex items-center gap-2">
          <span>{ui.limit}</span>
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
