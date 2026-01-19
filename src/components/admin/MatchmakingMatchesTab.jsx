import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';

const MANUAL_MATCH_DRAFT_KEY = 'mk_admin_manual_match_draft_v1';

function isIndexError(e) {
  const code = String(e?.code || '').toLowerCase();
  const msg = String(e?.message || '').toLowerCase();
  return code === 'failed-precondition' || msg.includes('requires an index');
}

function toMs(v) {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (typeof v?.seconds === 'number') return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
}

function profileCodeOf(p) {
  const code = typeof p?.profileCode === 'string' ? p.profileCode.trim() : '';
  if (code) return code;
  return typeof p?.profileNo === 'number' ? `MK-${p.profileNo}` : '';
}

function appIdOf(m, side) {
  const key = side === 'a' ? 'aApplicationId' : 'bApplicationId';
  const v = typeof m?.[key] === 'string' ? m[key].trim() : '';
  return v;
}

function shortenId(id) {
  const s = typeof id === 'string' ? id : '';
  if (!s) return '';
  if (s.length <= 18) return s;
  return `${s.slice(0, 10)}…${s.slice(-6)}`;
}

async function copyText(text) {
  const s = String(text || '');
  if (!s) return false;
  try {
    await navigator.clipboard.writeText(s);
    return true;
  } catch (e) {
    return false;
  }
}

export default function MatchmakingMatchesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [manualA, setManualA] = useState('');
  const [manualB, setManualB] = useState('');
  const [manualStatus, setManualStatus] = useState('proposed');
  const [manualOverwrite, setManualOverwrite] = useState(false);

  // Sekme değiştirince bu component unmount olduğu için input state'i sıfırlanıyordu.
  // Admin'in kopyala/yapıştır akışını bozmamak için taslağı sessionStorage'ta tutuyoruz.
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      const raw = window.sessionStorage.getItem(MANUAL_MATCH_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed?.manualA === 'string') setManualA(parsed.manualA);
      if (typeof parsed?.manualB === 'string') setManualB(parsed.manualB);
      if (typeof parsed?.manualStatus === 'string') setManualStatus(parsed.manualStatus);
      if (typeof parsed?.manualOverwrite === 'boolean') setManualOverwrite(parsed.manualOverwrite);
    } catch (e) {
      // ignore (corrupt storage)
    }
  }, []);

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      window.sessionStorage.setItem(
        MANUAL_MATCH_DRAFT_KEY,
        JSON.stringify({ manualA, manualB, manualStatus, manualOverwrite })
      );
    } catch (e) {
      // ignore
    }
  }, [manualA, manualB, manualStatus, manualOverwrite]);

  const clearManualDraft = () => {
    setManualA('');
    setManualB('');
    setManualStatus('proposed');
    setManualOverwrite(false);
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) return;
      window.sessionStorage.removeItem(MANUAL_MATCH_DRAFT_KEY);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    setErr('');
    const base = collection(db, 'matchmakingMatches');
    const qPrimary = query(
      base,
      where('status', 'in', ['mutual_accepted', 'contact_unlocked']),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    const qFallback = query(base, where('status', 'in', ['mutual_accepted', 'contact_unlocked']), limit(50));

    let unsubFallback = null;

    const unsub = onSnapshot(
      qPrimary,
      (snap) => {
        const rows = [];
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        setItems(rows);
        setLoading(false);
      },
      (e) => {
        if (isIndexError(e)) {
          console.warn('matchmakingMatches primary query requires index; falling back to unordered query.');
          unsubFallback = onSnapshot(
            qFallback,
            (snap) => {
              const rows = [];
              snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
              rows.sort((a, b) => toMs(b?.updatedAt) - toMs(a?.updatedAt));
              setItems(rows);
              setLoading(false);
            },
            (e2) => {
              console.error('matchmakingMatches fallback load failed:', e2);
              setErr(String(e2?.message || 'Eşleşmeler yüklenemedi.'));
              setLoading(false);
            }
          );
          return;
        }

        console.error('matchmakingMatches load failed:', e);
        setErr(String(e?.message || 'Eşleşmeler yüklenemedi.'));
        setLoading(false);
      }
    );

    return () => {
      unsub();
      if (typeof unsubFallback === 'function') unsubFallback();
    };
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

  const createManualMatch = async () => {
    const a = String(manualA || '').trim();
    const b = String(manualB || '').trim();
    if (!a || !b) {
      setErr('Lütfen A ve B için Application ID veya Profil Kodu girin.');
      return;
    }

    setActing(true);
    setErr('');
    setMsg('');
    try {
      const data = await authFetch('/api/matchmaking-admin-create-match', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          a,
          b,
          status: manualStatus,
          overwrite: !!manualOverwrite,
          clearLocks: true,
        }),
      });

      const extra = data?.existed
        ? ' (Zaten vardı: güncellendi)'
        : data?.skippedBecauseExists
          ? ' (Zaten vardı: atlandı)'
          : '';
      setMsg(`Manuel eşleşme hazır. Match ID: ${data?.matchId || '-'}${extra}`);
    } catch (e) {
      const details = e?.details ? ` (${JSON.stringify(e.details)})` : '';
      setErr(String(e?.message || 'İşlem başarısız.') + details);
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
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Eşleşmeler</h2>
            <p className="text-sm text-slate-600">Karşılıklı onay ve iletişim açılmış eşleşmeler.</p>
          </div>
          <div className="text-xs text-slate-600">Toplam: <span className="font-semibold text-slate-900">{items.length}</span></div>
        </div>

        {msg ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">{msg}</div>
        ) : null}
        {err ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">{err}</div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Yükleniyor…</div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Manuel eşleştir</p>
            <p className="text-xs text-slate-600 mt-1">
              A ve B için “Application ID” veya “Profil Kodu” (örn: MK-123) girin. Bu işlem iki kullanıcı arasında bir
              eşleşme dokümanı oluşturur.
            </p>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">A (Application ID / Profil Kodu)</label>
                <input
                  value={manualA}
                  onChange={(e) => setManualA(e.target.value)}
                  placeholder="Örn: MK-101 veya applicationId"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">B (Application ID / Profil Kodu)</label>
                <input
                  value={manualB}
                  onChange={(e) => setManualB(e.target.value)}
                  placeholder="Örn: MK-202 veya applicationId"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Başlangıç durumu</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="proposed">proposed (beğeni/ret test)</option>
                  <option value="mutual_accepted">mutual_accepted (chat/contact seçimi test)</option>
                  <option value="contact_unlocked">contact_unlocked (iletişim açılmış test)</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-center">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={manualOverwrite}
                  onChange={(e) => setManualOverwrite(e.target.checked)}
                />
                Aynı match varsa üzerine yaz
              </label>

              <button
                type="button"
                disabled={acting}
                onClick={createManualMatch}
                className="px-4 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60"
              >
                Manuel eşleştir
              </button>

              <button
                type="button"
                disabled={acting}
                onClick={clearManualDraft}
                className="px-4 py-2 rounded-full bg-slate-100 text-slate-800 text-sm font-semibold hover:bg-slate-200 disabled:opacity-60"
              >
                Alanları temizle
              </button>

              <Link
                to="/admin/matchmaking-matches"
                className="text-sm font-semibold text-sky-700 hover:underline"
              >
                Detaylı eşleşme sayfasını aç
              </Link>
            </div>
          </section>

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
                    {(() => {
                      const aCode = profileCodeOf(m?.profiles?.a);
                      const bCode = profileCodeOf(m?.profiles?.b);
                      const aAppId = appIdOf(m, 'a');
                      const bAppId = appIdOf(m, 'b');
                      return aCode || bCode ? (
                        <p className="text-xs text-slate-700 mt-1">
                          Eşleşme:{' '}
                          <span className="font-semibold">
                            {aAppId && aCode ? (
                              <Link to={`/admin/matchmaking/${aAppId}`} className="text-sky-700 hover:underline">
                                {aCode}
                              </Link>
                            ) : (
                              aCode || 'A'
                            )}{' '}
                            ↔{' '}
                            {bAppId && bCode ? (
                              <Link to={`/admin/matchmaking/${bAppId}`} className="text-sky-700 hover:underline">
                                {bCode}
                              </Link>
                            ) : (
                              bCode || 'B'
                            )}
                          </span>
                        </p>
                      ) : null;
                    })()}
                    <p className="text-xs text-slate-600 mt-1">Skor: {typeof m.score === 'number' ? `%${m.score}` : '-'}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                      <span>Kayıt ID: <span className="font-mono">{shortenId(m.id)}</span></span>
                      <button
                        type="button"
                        className="text-sky-700 hover:underline"
                        onClick={async () => {
                          const ok = await copyText(m.id);
                          setMsg(ok ? 'Kayıt ID kopyalandı.' : 'Kopyalanamadı.');
                          setTimeout(() => setMsg(''), 1200);
                        }}
                      >
                        kopyala
                      </button>
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => cancel(m.id)}
                        className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
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
                    {(() => {
                      const aCode = profileCodeOf(m?.profiles?.a);
                      const bCode = profileCodeOf(m?.profiles?.b);
                      const aAppId = appIdOf(m, 'a');
                      const bAppId = appIdOf(m, 'b');
                      return aCode || bCode ? (
                        <p className="text-xs text-slate-700 mt-1">
                          Eşleşme:{' '}
                          <span className="font-semibold">
                            {aAppId && aCode ? (
                              <Link to={`/admin/matchmaking/${aAppId}`} className="text-sky-700 hover:underline">
                                {aCode}
                              </Link>
                            ) : (
                              aCode || 'A'
                            )}{' '}
                            ↔{' '}
                            {bAppId && bCode ? (
                              <Link to={`/admin/matchmaking/${bAppId}`} className="text-sky-700 hover:underline">
                                {bCode}
                              </Link>
                            ) : (
                              bCode || 'B'
                            )}
                          </span>
                        </p>
                      ) : null;
                    })()}
                    <p className="text-xs text-slate-600 mt-1">Skor: {typeof m.score === 'number' ? `%${m.score}` : '-'}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                      <span>Kayıt ID: <span className="font-mono">{shortenId(m.id)}</span></span>
                      <button
                        type="button"
                        className="text-sky-700 hover:underline"
                        onClick={async () => {
                          const ok = await copyText(m.id);
                          setMsg(ok ? 'Kayıt ID kopyalandı.' : 'Kopyalanamadı.');
                          setTimeout(() => setMsg(''), 1200);
                        }}
                      >
                        kopyala
                      </button>
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => cancel(m.id)}
                        className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
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
  );
}
