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

function userLabel(uid, userByUid) {
  const u = userByUid?.[uid] || null;
  const uc = safeStr(u?.userCode);
  const username = safeStr(u?.username);
  const fullName = safeStr(u?.fullName);

  const primary = [uc, username ? `@${username}` : ''].filter(Boolean).join(' ');
  const secondary = fullName ? fullName : '';

  if (primary) {
    return { text: primary, sub: secondary || null, title: uid };
  }

  return { text: shortId(uid, 10, 6) || '—', sub: null, title: uid };
}

function statusBadge(status) {
  const st = safeStr(status).toLowerCase();
  if (st === 'contact_unlocked' || st === 'mutual_accepted') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (st === 'mutual_interest') {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  if (st === 'cancelled') {
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

const FILTERS = [
  { key: 'active', label: 'Aktif' },
  { key: 'pending', label: 'Başlatma bekliyor' },
  { key: 'cancelled', label: 'İptal' },
  { key: 'all', label: 'Tümü' },
];

const SINCE = [
  { key: '24h', label: 'Son 24 saat', ms: 24 * 60 * 60 * 1000 },
  { key: '7d', label: 'Son 7 gün', ms: 7 * 24 * 60 * 60 * 1000 },
  { key: '30d', label: 'Son 30 gün', ms: 30 * 24 * 60 * 60 * 1000 },
  { key: 'all', label: 'Tümü', ms: 0 },
];

export default function MatchActivityTab() {
  const [limit, setLimit] = useState(120);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [items, setItems] = useState([]);
  const [userByUid, setUserByUid] = useState({});

  const [filterKey, setFilterKey] = useState('active');
  const [sinceKey, setSinceKey] = useState('7d');
  const [q, setQ] = useState('');

  const [selectedUserId, setSelectedUserId] = useState('');
  const [histLoading, setHistLoading] = useState(false);
  const [histErr, setHistErr] = useState('');
  const [histItems, setHistItems] = useState([]);
  const [histUserByUid, setHistUserByUid] = useState({});

  const payload = useMemo(() => ({ limit }), [limit]);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await authFetch('/api/admin-match-activity-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setItems(Array.isArray(data?.items) ? data.items : []);
      setUserByUid(data?.userByUid && typeof data.userByUid === 'object' ? data.userByUid : {});
    } catch (e) {
      setErr(String(e?.message || 'match_activity_load_failed'));
      setItems([]);
      setUserByUid({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sinceMs = useMemo(() => {
    const found = SINCE.find((x) => x.key === sinceKey) || SINCE[1];
    if (!found?.ms) return 0;
    return Date.now() - found.ms;
  }, [sinceKey]);

  const filteredItems = useMemo(() => {
    const needle = safeStr(q).toLowerCase();

    const byFilter = (m) => {
      const st = safeStr(m?.status).toLowerCase();
      if (filterKey === 'active') return st === 'mutual_accepted' || st === 'contact_unlocked';
      if (filterKey === 'pending') return st === 'mutual_interest';
      if (filterKey === 'cancelled') return st === 'cancelled';
      return true;
    };

    const bySince = (m) => {
      if (!sinceMs) return true;
      const t = typeof m?.updatedAtMs === 'number' ? m.updatedAtMs : 0;
      return t > sinceMs;
    };

    const byNeedle = (m) => {
      if (!needle) return true;
      const matchCode = safeStr(m?.matchCode);
      const status = safeStr(m?.status);
      const matchNo = typeof m?.matchNo === 'number' ? String(m.matchNo) : '';
      const userIds = Array.isArray(m?.userIds) ? m.userIds : [];
      const userText = userIds
        .map((uid) => {
          const u = userByUid?.[uid] || {};
          return [safeStr(u?.userCode), safeStr(u?.username), safeStr(u?.fullName)].filter(Boolean).join(' ');
        })
        .join(' ');
      const blob = `${matchCode} ${matchNo} ${status} ${userText}`.toLowerCase();
      return blob.includes(needle);
    };

    return (items || []).filter((m) => byFilter(m) && bySince(m) && byNeedle(m));
  }, [items, filterKey, sinceMs, q, userByUid]);

  const loadUserHistory = async (uid) => {
    const x = safeStr(uid);
    if (!x) return;

    setHistLoading(true);
    setHistErr('');
    try {
      const data = await authFetch('/api/admin-user-matches-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: x, limit: 120 }),
      });
      setHistItems(Array.isArray(data?.items) ? data.items : []);
      setHistUserByUid(data?.userByUid && typeof data.userByUid === 'object' ? data.userByUid : {});
    } catch (e) {
      setHistErr(String(e?.message || 'user_match_history_load_failed'));
      setHistItems([]);
      setHistUserByUid({});
    } finally {
      setHistLoading(false);
    }
  };

  const onPickUser = (uid) => {
    const x = safeStr(uid);
    if (!x) return;
    setSelectedUserId(x);
    loadUserHistory(x);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Eşleşme Aktivitesi</h2>
          <p className="text-sm text-gray-600">Kullanıcıya tıklayıp UC/@username ile geçmiş eşleşmeleri gör.</p>
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={filterKey}
            onChange={(e) => setFilterKey(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            disabled={loading}
            title="Filtre"
          >
            {FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>

          <select
            value={sinceKey}
            onChange={(e) => setSinceKey(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
            disabled={loading}
            title="Zaman aralığı"
          >
            {SINCE.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara: UC / @username / durum / ES-..."
            className="px-3 py-2 border rounded-lg text-sm w-[260px]"
            disabled={loading}
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

      <div className="mt-4 border rounded-xl overflow-hidden">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-3 py-2">Eşleşme</th>
                <th className="text-left px-3 py-2">Durum</th>
                <th className="text-left px-3 py-2">Kullanıcılar</th>
                <th className="text-left px-3 py-2">Aktif Başlat</th>
                <th className="text-left px-3 py-2">Aktif İptal</th>
                <th className="text-left px-3 py-2">Güncellendi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((m) => {
                const matchCode = safeStr(m?.matchCode) || (typeof m?.matchNo === 'number' ? `ES-${m.matchNo}` : '');
                const userIds = Array.isArray(m?.userIds) ? m.userIds : [];

                const started = m?.activeStartByUid && typeof m.activeStartByUid === 'object' ? Object.keys(m.activeStartByUid).filter((k) => m.activeStartByUid[k]) : [];
                const cancelled = m?.activeCancelByUid && typeof m.activeCancelByUid === 'object' ? Object.keys(m.activeCancelByUid).filter((k) => m.activeCancelByUid[k]) : [];

                return (
                  <tr key={safeStr(m?.id)} className="border-t">
                    <td className="px-3 py-2">
                      <div className="text-xs font-semibold text-gray-900">{matchCode || '-'}</div>
                      <div className="text-[11px] text-gray-600 font-mono" title={safeStr(m?.id)}>{shortId(m?.id, 10, 6) || ''}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md border text-xs ${statusBadge(m?.status)}`}>
                        {safeStr(m?.status) || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        {userIds.length ? (
                          userIds.map((uid) => {
                            const lbl = userLabel(uid, userByUid);
                            return (
                              <button
                                key={uid}
                                type="button"
                                onClick={() => onPickUser(uid)}
                                className="block text-left text-xs text-indigo-700 hover:underline"
                                title={lbl.title}
                              >
                                <span className="font-semibold">{lbl.text}</span>
                                {lbl.sub ? <span className="text-gray-600">{' '}• {lbl.sub}</span> : null}
                              </button>
                            );
                          })
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {started.length ? (
                        <div className="text-xs text-gray-800 space-y-1">
                          {started.map((uid) => {
                            const lbl = userLabel(uid, userByUid);
                            return (
                              <button
                                key={uid}
                                type="button"
                                onClick={() => onPickUser(uid)}
                                className="block text-left text-xs text-indigo-700 hover:underline"
                                title={lbl.title}
                              >
                                {lbl.text}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {cancelled.length ? (
                        <div className="text-xs text-gray-800 space-y-1">
                          {cancelled.map((uid) => {
                            const lbl = userLabel(uid, userByUid);
                            return (
                              <button
                                key={uid}
                                type="button"
                                onClick={() => onPickUser(uid)}
                                className="block text-left text-xs text-indigo-700 hover:underline"
                                title={lbl.title}
                              >
                                {lbl.text}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-700">{fmtDate(m?.updatedAtMs)}</td>
                  </tr>
                );
              })}

              {!filteredItems.length && !loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">Kayıt yok.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
          <div>Gösterilen: <span className="font-semibold text-gray-900">{filteredItems.length}</span></div>
          <div className="flex items-center gap-2">
            <span>Limit</span>
            <input
              value={String(limit)}
              onChange={(e) => setLimit(Math.max(20, Math.min(200, Number(e.target.value) || 120)))}
              className="w-20 px-2 py-1 border rounded"
              type="number"
              min={20}
              max={200}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {selectedUserId ? (
        <div className="mt-4 border rounded-xl overflow-hidden">
          <div className="p-3 bg-gray-50 flex items-center justify-between gap-2">
            <div className="text-sm text-gray-800">
              <span className="font-semibold">Kullanıcı eşleşme geçmişi:</span>{' '}
              <span className="text-gray-700">
                {(() => {
                  const merged = { ...userByUid, ...histUserByUid };
                  const lbl = userLabel(selectedUserId, merged);
                  return `${lbl.text}${lbl.sub ? ` • ${lbl.sub}` : ''}`;
                })()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedUserId('');
                setHistItems([]);
                setHistErr('');
                setHistUserByUid({});
              }}
              className="px-3 py-1.5 rounded-lg border text-sm hover:bg-white"
            >
              Kapat
            </button>
          </div>

          {histErr ? <div className="m-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-sm">{histErr}</div> : null}

          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-white text-gray-700 sticky top-0 border-b">
                <tr>
                  <th className="text-left px-3 py-2">Eşleşme</th>
                  <th className="text-left px-3 py-2">Durum</th>
                  <th className="text-left px-3 py-2">Karşı taraf</th>
                  <th className="text-left px-3 py-2">Güncellendi</th>
                  <th className="text-left px-3 py-2">İptal nedeni</th>
                </tr>
              </thead>
              <tbody>
                {(histItems || []).map((m) => {
                  const matchCode = safeStr(m?.matchCode) || (typeof m?.matchNo === 'number' ? `ES-${m.matchNo}` : '');
                  const otherUid = safeStr(m?.otherUserId);
                  const merged = { ...userByUid, ...histUserByUid };
                  const other = otherUid ? userLabel(otherUid, merged) : null;
                  return (
                    <tr key={safeStr(m?.id)} className="border-t">
                      <td className="px-3 py-2">
                        <div className="text-xs font-semibold text-gray-900">{matchCode || '-'}</div>
                        <div className="text-[11px] text-gray-600 font-mono" title={safeStr(m?.id)}>{shortId(m?.id, 10, 6) || ''}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md border text-xs ${statusBadge(m?.status)}`}>
                          {safeStr(m?.status) || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {otherUid ? (
                          <button
                            type="button"
                            onClick={() => onPickUser(otherUid)}
                            className="text-left text-xs text-indigo-700 hover:underline"
                            title={other?.title || otherUid}
                          >
                            <span className="font-semibold">{other?.text || shortId(otherUid, 10, 6)}</span>
                            {other?.sub ? <span className="text-gray-600">{' '}• {other.sub}</span> : null}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700">{fmtDate(m?.updatedAtMs)}</td>
                      <td className="px-3 py-2 text-xs text-gray-700">{safeStr(m?.cancelledReason) || '—'}</td>
                    </tr>
                  );
                })}

                {!histItems.length && !histLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">Kayıt yok.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
            <div>
              {histLoading ? 'Yükleniyor…' : 'Gösterilen: '}
              <span className="font-semibold text-gray-900">{histItems.length}</span>
            </div>
            <div className="text-gray-500">Karşı tarafa tıklayıp zincir şekilde ilerleyebilirsin.</div>
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-gray-600">
        Not: Üst liste <span className="font-mono">matchmakingMatches.updatedAt</span> ile son güncellenenleri getirir; kullanıcıya tıklayınca eşleşme geçmişi yüklenir.
      </p>
    </div>
  );
}
