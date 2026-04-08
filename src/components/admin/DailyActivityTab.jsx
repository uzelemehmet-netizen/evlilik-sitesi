import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../utils/authFetch';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
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
  const parts = [safeStr(u?.userCode), safeStr(u?.username) ? `@${safeStr(u?.username)}` : '', safeStr(u?.fullName)].filter(Boolean);
  return parts.join(' • ') || shortId(uid, 10, 6) || '—';
}

function matchLabel(item) {
  const code = safeStr(item?.matchCode);
  if (code) return code;
  if (typeof item?.matchNo === 'number' && Number.isFinite(item.matchNo)) return `ES-${item.matchNo}`;
  return shortId(item?.id, 10, 6) || '—';
}

export default function DailyActivityTab() {
  const [dayKey, setDayKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [data, setData] = useState(null);

  const load = async (nextDayKey = '') => {
    setLoading(true);
    setErr('');
    try {
      const payload = { days: 30, limit: 250, ...(safeStr(nextDayKey || dayKey) ? { dayKey: safeStr(nextDayKey || dayKey) } : {}) };
      const res = await authFetch('/api/admin-daily-activity-summary', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setData(res && typeof res === 'object' ? res : null);
      const resolvedDayKey = safeStr(res?.dayKey);
      if (resolvedDayKey) setDayKey(resolvedDayKey);
    } catch (e) {
      setErr(String(e?.message || 'daily_activity_load_failed'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = data?.summary && typeof data.summary === 'object' ? data.summary : {};
  const userByUid = data?.userByUid && typeof data.userByUid === 'object' ? data.userByUid : {};
  const dayKeys = Array.isArray(data?.dayKeys) ? data.dayKeys : [];
  const mutualLikes = Array.isArray(data?.mutualLikes) ? data.mutualLikes : [];
  const reciprocalMatches = Array.isArray(data?.reciprocalMatches) ? data.reciprocalMatches : [];
  const reciprocalMessagers = Array.isArray(data?.reciprocalMessagers) ? data.reciprocalMessagers : [];
  const onlineUsers = Array.isArray(data?.onlineUsers) ? data.onlineUsers : [];

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Günlük Aktivite</h2>
          <p className="text-sm text-gray-600">Seçili gün için karşılıklı beğeni, çift yönlü mesajlaşma ve çevrimiçi kullanıcı özeti.</p>
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={dayKey}
            onChange={(e) => setDayKey(String(e.target.value || ''))}
            className="px-3 py-2 border rounded-lg text-sm"
            disabled={loading}
          >
            {dayKeys.map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => load(dayKey)}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Yükleniyor…' : 'Yenile'}
          </button>
        </div>
      </div>

      {err ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{err}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Karşılıklı Beğeni</div>
          <div className="text-2xl font-bold text-slate-900">{safeNum(summary?.mutualLikeMatches)}</div>
          <div className="mt-2 text-sm text-slate-700">Eşleşme: <span className="font-bold">{safeNum(summary?.mutualLikeMatches)}</span></div>
          <div className="mt-1 text-sm text-slate-700">Kullanıcı: <span className="font-bold">{safeNum(summary?.mutualLikeUsers)}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Karşılıklı Mesajlaşma</div>
          <div className="text-2xl font-bold text-slate-900">{safeNum(summary?.reciprocalMessageUsers)}</div>
          <div className="mt-2 text-sm text-slate-700">Kullanıcı: <span className="font-bold">{safeNum(summary?.reciprocalMessageUsers)}</span></div>
          <div className="mt-1 text-sm text-slate-700">Eşleşme: <span className="font-bold">{safeNum(summary?.reciprocalMessageMatches)}</span></div>
          <div className="mt-1 text-sm text-slate-700">Mesaj: <span className="font-bold">{safeNum(summary?.reciprocalMessageTotal)}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Gün İçinde Çevrimiçi</div>
          <div className="text-2xl font-bold text-slate-900">{safeNum(summary?.onlineUsers)}</div>
          <div className="mt-2 text-sm text-slate-700">Kullanıcı: <span className="font-bold">{safeNum(summary?.onlineUsers)}</span></div>
          <div className="mt-1 text-sm text-slate-700">Gün: <span className="font-bold">{safeStr(data?.dayKey) || '-'}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">Karşılıklı Beğeni Listesi</h3>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2">Eşleşme</th>
                  <th className="text-left px-3 py-2">Kullanıcılar</th>
                  <th className="text-left px-3 py-2">Durum</th>
                  <th className="text-left px-3 py-2">Saat</th>
                </tr>
              </thead>
              <tbody>
                {mutualLikes.length ? mutualLikes.map((item) => (
                  <tr key={safeStr(item?.id)} className="border-t">
                    <td className="px-3 py-2 font-semibold text-slate-900">{matchLabel(item)}</td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        {(Array.isArray(item?.userIds) ? item.userIds : []).map((uid) => (
                          <div key={uid} className="text-xs text-slate-700">{userLabel(uid, userByUid)}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">{safeStr(item?.status) || '-'}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(item?.eventAtMs)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="px-3 py-6 text-center text-sm text-slate-500">Seçili gün için karşılıklı beğeni yok.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">Karşılıklı Mesajlaşan Kullanıcılar</h3>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2">Kullanıcı</th>
                  <th className="text-left px-3 py-2">Çift yönlü sohbet</th>
                  <th className="text-left px-3 py-2">Gönderdiği mesaj</th>
                  <th className="text-left px-3 py-2">Son mesaj</th>
                </tr>
              </thead>
              <tbody>
                {reciprocalMessagers.length ? reciprocalMessagers.map((item) => (
                  <tr key={safeStr(item?.uid)} className="border-t">
                    <td className="px-3 py-2 text-xs text-slate-800">{userLabel(item?.uid, userByUid)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{safeNum(item?.reciprocalMatchCount)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{safeNum(item?.sentCount)}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(item?.lastMessageAtMs)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="px-3 py-6 text-center text-sm text-slate-500">Seçili gün için çift yönlü mesajlaşma yok.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-900">Gün İçinde Çevrimiçi Olan Kullanıcılar</h3>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2">Kullanıcı</th>
                <th className="text-left px-3 py-2">Cinsiyet</th>
                <th className="text-left px-3 py-2">Şehir</th>
                <th className="text-left px-3 py-2">Üyelik</th>
                <th className="text-left px-3 py-2">Son görülme</th>
              </tr>
            </thead>
            <tbody>
              {onlineUsers.length ? onlineUsers.map((row) => {
                const user = userByUid?.[row.uid] || null;
                return (
                  <tr key={safeStr(row?.uid)} className="border-t">
                    <td className="px-3 py-2 text-xs text-slate-800">{userLabel(row?.uid, userByUid)}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{safeStr(user?.gender) || '-'}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{safeStr(user?.city) || safeStr(user?.country) || '-'}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{user?.membershipActive ? 'Aktif' : '-'}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(row?.lastSeenAtMs)}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">Seçili gün için çevrimiçi kullanıcı yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-900">Karşılıklı Mesajlaşma Eşleşmeleri</h3>
        </div>
        <div className="max-h-[320px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2">Eşleşme</th>
                <th className="text-left px-3 py-2">Kullanıcılar</th>
                <th className="text-left px-3 py-2">Mesaj</th>
                <th className="text-left px-3 py-2">Son mesaj</th>
              </tr>
            </thead>
            <tbody>
              {reciprocalMatches.length ? reciprocalMatches.map((item) => (
                <tr key={safeStr(item?.id)} className="border-t">
                  <td className="px-3 py-2 font-semibold text-slate-900">{matchLabel(item)}</td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      {(Array.isArray(item?.userIds) ? item.userIds : []).map((uid) => (
                        <div key={uid} className="text-xs text-slate-700">{userLabel(uid, userByUid)} <span className="text-slate-500">({safeNum(item?.perUidCount?.[uid])})</span></div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{safeNum(item?.totalMessages)}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(item?.lastMessageAtMs)}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="px-3 py-6 text-center text-sm text-slate-500">Seçili gün için karşılıklı mesajlaşma eşleşmesi yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}