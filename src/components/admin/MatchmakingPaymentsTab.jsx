import React, { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';

function fmtMoney(amount, currency) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '-';
  const cur = typeof currency === 'string' ? currency : '';
  return `${amount} ${cur}`.trim();
}

function fmtDateTr(ms) {
  if (!ms || typeof ms !== 'number') return '';
  try {
    return new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
  } catch {
    return '';
  }
}

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

export default function MatchmakingPaymentsTab() {
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
      collection(db, 'matchmakingPayments'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
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
        console.error('matchmakingPayments load failed:', e);
        setLoading(false);
      }
    );

    return unsub;
  }, [status]);

  const approve = async (paymentId, ok) => {
    const confirmText = ok
      ? 'Bu ödeme bildirimi ONAYLANACAK ve üyelik aktif edilecek. Devam edilsin mi?'
      : 'Bu ödeme bildirimi REDDEDİLECEK. Devam edilsin mi?';

    if (!window.confirm(confirmText)) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      const data = await authFetch('/api/matchmaking-admin-approve-payment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ paymentId, approve: ok }),
      });

      if (ok) {
        const until = typeof data?.validUntilMs === 'number' ? data.validUntilMs : 0;
        const untilText = fmtDateTr(until);
        setMsg(untilText ? `Ödeme onaylandı; üyelik aktif edildi. Bitiş: ${untilText}` : 'Ödeme onaylandı; üyelik aktif edildi.');
      } else {
        setMsg('Ödeme reddedildi.');
      }
    } catch (e) {
      setErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const summary = useMemo(() => {
    const total = items.length;
    const byCurrency = {};
    for (const p of items) {
      const c = typeof p?.currency === 'string' ? p.currency : 'unknown';
      byCurrency[c] = (byCurrency[c] || 0) + 1;
    }
    return { total, byCurrency };
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Ödeme Bildirimleri</h2>
            <p className="text-sm text-slate-600">Bekleyen/onaylanan/reddedilen ödeme bildirimlerini yönetin.</p>
          </div>
          <div className="text-xs text-slate-600">Gösterilen: <span className="font-semibold text-slate-900">{summary.total}</span></div>
        </div>

        {msg ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">{msg}</div>
        ) : null}
        {err ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">{err}</div>
        ) : null}
        {copiedMsg ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-slate-800 text-sm">{copiedMsg}</div>
        ) : null}
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
        <p className="mt-2 text-xs text-slate-600">
          Toplam: <span className="font-semibold">{summary.total}</span>
          {Object.keys(summary.byCurrency).length
            ? ` ( ${Object.entries(summary.byCurrency)
                .map(([k, v]) => `${k}:${v}`)
                .join(' , ')} )`
            : ''}
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Yükleniyor…</div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          {items.length === 0 ? (
            <p className="text-sm text-slate-600">Kayıt yok.</p>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{fmtMoney(p?.amount, p?.currency)}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Yöntem: <span className="font-semibold">{p?.method || '-'}</span>
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>
                          User: <span className="font-semibold">{p?.userId || '-'}</span>
                        </span>
                        {p?.userId ? (
                          <button
                            type="button"
                            className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold hover:bg-slate-50"
                            onClick={async () => {
                              const ok = await copyText(p.userId);
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
                          Match: <span className="font-semibold">{p?.matchId || '-'}</span>
                        </span>
                        {p?.matchId ? (
                          <button
                            type="button"
                            className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold hover:bg-slate-50"
                            onClick={async () => {
                              const ok = await copyText(p.matchId);
                              setCopiedMsg(ok ? 'Match ID kopyalandı.' : 'Kopyalanamadı.');
                              setTimeout(() => setCopiedMsg(''), 1500);
                            }}
                          >
                            Kopyala
                          </button>
                        ) : null}
                      </div>

                      {p?.amountMatches === false ? (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                          Uyarı: Tutar beklenen fiyatla eşleşmiyor. Beklenen:{' '}
                          <span className="font-semibold">{fmtMoney(p?.expectedAmount, p?.currency)}</span>
                        </div>
                      ) : null}

                      {p?.reference ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span>
                            Referans: <span className="font-semibold">{p.reference}</span>
                          </span>
                          <button
                            type="button"
                            className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold hover:bg-slate-50"
                            onClick={async () => {
                              const ok = await copyText(p.reference);
                              setCopiedMsg(ok ? 'Referans kopyalandı.' : 'Kopyalanamadı.');
                              setTimeout(() => setCopiedMsg(''), 1500);
                            }}
                          >
                            Kopyala
                          </button>
                        </div>
                      ) : null}

                      {p?.note ? (
                        <p className="text-xs text-slate-600 mt-1">
                          Not: <span className="font-semibold">{p.note}</span>
                        </p>
                      ) : null}

                      {p?.receiptUrl ? (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">Dekont</p>
                            <div className="flex items-center gap-2">
                              <a
                                href={p.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-sky-700 hover:underline"
                              >
                                Aç
                              </a>
                              <button
                                type="button"
                                className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold hover:bg-slate-50"
                                onClick={async () => {
                                  const ok = await copyText(p.receiptUrl);
                                  setCopiedMsg(ok ? 'Dekont linki kopyalandı.' : 'Kopyalanamadı.');
                                  setTimeout(() => setCopiedMsg(''), 1500);
                                }}
                              >
                                Kopyala
                              </button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="block">
                              <img
                                src={p.receiptUrl}
                                alt="dekont"
                                className="w-full max-w-md h-56 object-contain rounded-lg border border-slate-200 bg-white"
                                loading="lazy"
                              />
                            </a>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold text-slate-900">Hazır mesaj</p>
                        <div className="mt-2 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            className="px-4 py-2 rounded-full border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50"
                            onClick={async () => {
                              const t =
                                'Merhaba, evlilik eşleştirme üyelik ödemeniz onaylandı. Panelinizden iletişim bilgilerini açabilirsiniz. Teşekkürler.';
                              const ok = await copyText(t);
                              setCopiedMsg(ok ? 'Onay mesajı kopyalandı.' : 'Kopyalanamadı.');
                              setTimeout(() => setCopiedMsg(''), 1500);
                            }}
                          >
                            Onay mesajını kopyala
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-full border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50"
                            onClick={async () => {
                              const t =
                                'Merhaba, ödeme bildiriminizi doğrulayamadık. Lütfen dekont/ref. bilgisini kontrol edip tekrar ödeme bildirimi gönderin.';
                              const ok = await copyText(t);
                              setCopiedMsg(ok ? 'Red mesajı kopyalandı.' : 'Kopyalanamadı.');
                              setTimeout(() => setCopiedMsg(''), 1500);
                            }}
                          >
                            Red mesajını kopyala
                          </button>
                        </div>
                      </div>
                    </div>

                    {status === 'pending' ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => approve(p.id, true)}
                          className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => approve(p.id, false)}
                          className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
                        >
                          Reddet
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
