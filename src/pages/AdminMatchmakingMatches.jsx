import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { authFetch } from '../utils/authFetch';

export default function AdminMatchmakingMatches() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'matchmakingMatches'),
      where('status', 'in', ['mutual_accepted', 'contact_unlocked']),
      orderBy('updatedAt', 'desc'),
      limit(50)
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
        console.error('matchmakingMatches load failed:', e);
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  const cancel = async (matchId) => {
    const ok = window.confirm('Bu eşleşme iptal edildi olarak işaretlenecek ve kilit kaldırılacak. Devam edilsin mi?');
    if (!ok) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      await authFetch('/api/matchmaking-admin-cancel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId, reason: 'cancelled_after_contact' }),
      });
      setMsg('Eşleşme iptal edildi. Kilit kaldırıldı; yeni eşleşmeler gösterilebilir.');
    } catch (e) {
      setErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const grouped = useMemo(() => {
    const mutual = [];
    const contactUnlocked = [];
    for (const m of items) {
      if (String(m?.status || '') === 'contact_unlocked') contactUnlocked.push(m);
      else mutual.push(m);
    }
    return { mutual, contactUnlocked };
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Eşleşmeler (Admin)</h1>
          <div className="flex items-center gap-3">
            <Link to="/admin/identity-verifications" className="text-sm font-semibold text-sky-700 hover:underline">
              Kimlik doğrulama
            </Link>
            <Link to="/admin/matchmaking-payments" className="text-sm font-semibold text-sky-700 hover:underline">
              Ödeme bildirimleri
            </Link>
            <Link to="/admin/dashboard" className="text-sm font-semibold text-sky-700 hover:underline">
              Admin panel
            </Link>
          </div>
        </div>

        {msg ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">{msg}</div> : null}
        {err ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">{err}</div> : null}

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Yükleniyor…</p>
        ) : (
          <div className="mt-4 space-y-6">
            <section className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Karşılıklı onay (2. adım seçimi bekliyor)</p>
              {grouped.mutual.length === 0 ? (
                <p className="text-sm text-slate-600 mt-2">Kayıt yok.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {grouped.mutual.map((m) => (
                    <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {m?.profiles?.a?.fullName || 'A'} ↔ {m?.profiles?.b?.fullName || 'B'}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Skor: {typeof m.score === 'number' ? `%${m.score}` : '-'}</p>
                      <div className="mt-2 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => cancel(m.id)}
                          className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700"
                        >
                          Eşleşmeyi iptal et (kilidi kaldır)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">İletişim paylaşımı açılanlar (kilit aktif)</p>
              {grouped.contactUnlocked.length === 0 ? (
                <p className="text-sm text-slate-600 mt-2">Kayıt yok.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {grouped.contactUnlocked.map((m) => (
                    <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {m?.profiles?.a?.fullName || 'A'} ↔ {m?.profiles?.b?.fullName || 'B'}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">Skor: {typeof m.score === 'number' ? `%${m.score}` : '-'}</p>
                      <div className="mt-2 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => cancel(m.id)}
                          className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700"
                        >
                          Eşleşmeyi iptal et (kilidi kaldır)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
