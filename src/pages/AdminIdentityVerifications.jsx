import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { authFetch } from '../utils/authFetch';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function fmtTs(ts) {
  try {
    const ms = typeof ts?.toMillis === 'function' ? ts.toMillis() : (typeof ts === 'number' ? ts : 0);
    if (!ms) return '-';
    return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ms));
  } catch {
    return '-';
  }
}

export default function AdminIdentityVerifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [noteByUserId, setNoteByUserId] = useState({});

  useEffect(() => {
    const q = query(
      collection(db, 'matchmakingUsers'),
      where('identityVerification.status', '==', 'pending'),
      orderBy('updatedAt', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = [];
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        setItems(rows);
        setLoading(false);
      },
      (e) => {
        console.error('matchmakingUsers load failed:', e);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  const approve = async (userId, ok) => {
    setActing(true);
    setErr('');
    setMsg('');
    try {
      await authFetch('/api/matchmaking-admin-identity-verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId,
          status: ok ? 'verified' : 'rejected',
          note: safeStr(noteByUserId?.[userId]),
        }),
      });

      setMsg(ok ? 'Kullanıcı doğrulandı.' : 'Doğrulama reddedildi.');
      setNoteByUserId((p) => ({ ...p, [userId]: '' }));
    } catch (e) {
      setErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const grouped = useMemo(() => {
    const byMethod = { whatsapp: [], kyc: [], manual: [], other: [] };
    for (const u of items) {
      const m = safeStr(u?.identityVerification?.method).toLowerCase();
      if (m === 'whatsapp') byMethod.whatsapp.push(u);
      else if (m === 'kyc') byMethod.kyc.push(u);
      else if (m === 'manual') byMethod.manual.push(u);
      else byMethod.other.push(u);
    }
    return byMethod;
  }, [items]);

  const renderList = (rows) => {
    if (rows.length === 0) return <p className="text-sm text-slate-600 mt-2">Kayıt yok.</p>;

    return (
      <div className="mt-3 space-y-3">
        {rows.map((u) => {
          const userId = u.id;
          const method = safeStr(u?.identityVerification?.method) || '-';
          const ref = safeStr(u?.identityVerification?.referenceCode) || '-';
          const requestedAt = u?.identityVerification?.requestedAt || u?.updatedAt || null;

          return (
            <div key={userId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">User ID: <span className="font-mono text-xs">{userId}</span></p>
                  <p className="text-xs text-slate-600 mt-1">Method: <span className="font-semibold">{method}</span> • Ref: <span className="font-semibold">{ref}</span></p>
                  <p className="text-xs text-slate-600">Requested: {fmtTs(requestedAt)}</p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <input
                    value={noteByUserId?.[userId] || ''}
                    onChange={(e) => setNoteByUserId((p) => ({ ...p, [userId]: e.target.value }))}
                    placeholder="Not (opsiyonel)"
                    className="w-full sm:w-72 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    disabled={acting}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => approve(userId, true)}
                      disabled={acting}
                      className="px-4 py-2 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60"
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={() => approve(userId, false)}
                      disabled={acting}
                      className="px-4 py-2 rounded-full bg-rose-700 text-white text-sm font-semibold hover:bg-rose-800 disabled:opacity-60"
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Kimlik Doğrulamalar (Admin)</h1>
          <div className="flex items-center gap-3">
            <Link to="/admin/matchmaking-matches" className="text-sm font-semibold text-sky-700 hover:underline">Eşleşmeler</Link>
            <Link to="/admin/dashboard" className="text-sm font-semibold text-sky-700 hover:underline">Admin panel</Link>
          </div>
        </div>

        {msg ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">{msg}</div> : null}
        {err ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">{err}</div> : null}

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Yükleniyor…</p>
        ) : (
          <div className="mt-4 space-y-6">
            <section className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">WhatsApp</p>
              {renderList(grouped.whatsapp)}
            </section>
            <section className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Otomatik KYC</p>
              {renderList(grouped.kyc)}
            </section>
            <section className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Manuel</p>
              {renderList(grouped.manual)}
            </section>
            <section className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Diğer</p>
              {renderList(grouped.other)}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
