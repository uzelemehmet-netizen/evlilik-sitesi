import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

function nowMs() {
  return Date.now();
}

function formatRelative(ms) {
  const diff = Math.max(0, nowMs() - ms);
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return 'az önce';
  if (sec < 60) return `${sec} sn önce`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} dk önce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} sa önce`;
  const d = Math.floor(h / 24);
  return `${d} gün önce`;
}

export default function LiveJoinEvents({ className = '' }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const cutoffMs = useMemo(() => nowMs() - 24 * 60 * 60 * 1000, []);

  useEffect(() => {
    setError('');

    const colRef = collection(db, 'publicJoinEvents');
    const q = query(colRef, where('createdAtMs', '>=', cutoffMs), orderBy('createdAtMs', 'desc'), limit(40));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() || {}) }))
          .filter((x) => typeof x.createdAtMs === 'number' && Number.isFinite(x.createdAtMs));
        setItems(next);
      },
      (e) => {
        setError(String(e?.message || 'firestore_error'));
      }
    );

    return () => unsub();
  }, [cutoffMs]);

  const count24h = items.length;
  const recent = items.slice(0, 6);

  return (
    <div className={className}>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-white">Canlı katılım</div>
            <div className="mt-0.5 text-[12px] text-white/70">Son 24 saatte {count24h} yeni kişi katıldı</div>
          </div>
          <div className="text-[11px] text-white/55">Realtime</div>
        </div>

        {error ? <div className="mt-2 text-[12px] text-rose-200/90">{error}</div> : null}

        {recent.length ? (
          <div className="mt-3 grid grid-cols-1 gap-2">
            {recent.map((it) => (
              <div key={it.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-[12px] text-white/85">Yeni üye katıldı</div>
                <div className="text-[11px] text-white/55">{formatRelative(it.createdAtMs)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 text-[12px] text-white/65">Henüz yeni katılım görünmüyor.</div>
        )}

        <div className="mt-3 text-[11px] text-white/50">
          Not: Burada kişisel bilgi gösterilmez.
        </div>
      </div>
    </div>
  );
}
