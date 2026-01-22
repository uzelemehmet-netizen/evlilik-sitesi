import React, { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';

async function copyText(text) {
  const s = String(text || '');
  if (!s) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(s);
      return true;
    }
  } catch {
    // ignore
  }

  try {
    const el = document.createElement('textarea');
    el.value = s;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  } catch {
    return false;
  }
}

function safeUrls(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
}

export default function MatchmakingPhotoUpdatesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [status, setStatus] = useState('pending'); // pending | approved | rejected
  const [copiedMsg, setCopiedMsg] = useState('');

  useEffect(() => {
    setLoading(true);

    const q = query(
      collection(db, 'matchmakingPhotoUpdateRequests'),
      where('status', '==', status),
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
        console.error('matchmakingPhotoUpdateRequests load failed:', e);
        setLoading(false);
      }
    );

    return unsub;
  }, [status]);

  const decide = async (requestId, ok) => {
    const confirmText = ok
      ? 'Bu fotoğraf güncellemesi ONAYLANACAK ve başvuru fotoğrafları değişecek. Devam edilsin mi?'
      : 'Bu fotoğraf güncellemesi REDDEDİLECEK. Devam edilsin mi?';

    if (!window.confirm(confirmText)) return;

    setActing(true);
    setErr('');
    setMsg('');

    try {
      await authFetch('/api/matchmaking-admin-photo-update-decide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requestId, approve: ok }),
      });

      setMsg(ok ? 'Fotoğraf güncellemesi onaylandı.' : 'Fotoğraf güncellemesi reddedildi.');
    } catch (e) {
      setErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const summary = useMemo(() => {
    return { total: items.length };
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Fotoğraf Güncelleme İstekleri</h2>
            <p className="text-sm text-slate-600">Kullanıcının yüklediği yeni fotoğrafları inceleyip onaylayın/reddedin.</p>
          </div>
          <div className="text-xs text-slate-600">Gösterilen: <span className="font-semibold text-slate-900">{summary.total}</span></div>
        </div>

        {msg ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">{msg}</div> : null}
        {err ? <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">{err}</div> : null}
        {copiedMsg ? <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 text-sm">{copiedMsg}</div> : null}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatus('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              status === 'pending'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Bekleyen
          </button>
          <button
            type="button"
            onClick={() => setStatus('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              status === 'approved'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Onaylanan
          </button>
          <button
            type="button"
            onClick={() => setStatus('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              status === 'rejected'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Reddedilen
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Yükleniyor…</div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          {items.length === 0 ? (
            <p className="text-sm text-slate-600">Kayıt yok.</p>
          ) : (
            <div className="space-y-3">
              {items.map((r) => {
                const urls = safeUrls(r?.photoUrls);
                return (
                  <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">Request: {r.id}</p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span>
                            User: <span className="font-semibold">{r?.userId || '-'}</span>
                          </span>
                          {r?.userId ? (
                            <button
                              type="button"
                              className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold hover:bg-slate-50"
                              onClick={async () => {
                                const ok = await copyText(r.userId);
                                setCopiedMsg(ok ? 'User ID kopyalandı.' : 'Kopyalanamadı.');
                                setTimeout(() => setCopiedMsg(''), 1500);
                              }}
                            >
                              Kopyala
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span>
                            Application: <span className="font-semibold">{r?.applicationId || '-'}</span>
                          </span>
                          {r?.applicationId ? (
                            <button
                              type="button"
                              className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold hover:bg-slate-50"
                              onClick={async () => {
                                const ok = await copyText(r.applicationId);
                                setCopiedMsg(ok ? 'Application ID kopyalandı.' : 'Kopyalanamadı.');
                                setTimeout(() => setCopiedMsg(''), 1500);
                              }}
                            >
                              Kopyala
                            </button>
                          ) : null}
                        </div>

                        {urls.length ? (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {urls.slice(0, 3).map((u) => (
                              <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={u} alt="Photo" className="w-full h-28 object-cover rounded-lg border border-slate-200" loading="lazy" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-slate-600">Foto yok.</p>
                        )}
                      </div>

                      {status === 'pending' ? (
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => decide(r.id, true)}
                            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Onayla
                          </button>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => decide(r.id, false)}
                            className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
                          >
                            Reddet
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
