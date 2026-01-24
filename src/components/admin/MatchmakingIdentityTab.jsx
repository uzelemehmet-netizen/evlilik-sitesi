import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';
import { formatProfileCode } from '../../utils/profileCode';

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

function shortId(v, head = 6, tail = 4) {
  const s = safeStr(v);
  if (!s) return '';
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

async function copyTextToClipboard(s) {
  const v = safeStr(s);
  if (!v) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(v);
      return true;
    }
  } catch {
    // ignore
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = v;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.left = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  } catch {
    return false;
  }
}

function renderFileLink(label, url) {
  const u = safeStr(url);
  if (!u) return null;
  return (
    <a
      key={label}
      href={u}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50"
    >
      {label}
    </a>
  );
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function formatPersonSummary(app) {
  const fullName = safeStr(app?.fullName);
  const age = typeof app?.age === 'number' ? app.age : null;
  const gender = safeStr(app?.gender);
  const city = safeStr(app?.city);
  const country = safeStr(app?.country);
  const username = safeStr(app?.username);
  const profileCode = safeStr(app?.profileCode);

  const bits = [];
  if (fullName) bits.push(fullName);
  if (username) bits.push(`@${username}`);
  if (profileCode) bits.push(profileCode);
  if (age !== null) bits.push(String(age));
  if (gender) bits.push(gender);
  if (city || country) bits.push([city, country].filter(Boolean).join(', '));
  return bits.length ? bits.join(' • ') : '';
}

export default function MatchmakingIdentityTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [noteByUserId, setNoteByUserId] = useState({});
  const [appByUserId, setAppByUserId] = useState({});
  const [appsLoading, setAppsLoading] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState('');

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

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const ids = Array.isArray(items) ? items.map((u) => safeStr(u?.id)).filter(Boolean) : [];
        if (!ids.length) {
          if (!cancelled) setAppByUserId({});
          return;
        }

        setAppsLoading(true);

        // Firestore "in" sorgusu max 10 eleman.
        const chunks = chunkArray(Array.from(new Set(ids)), 10);
        const next = {};

        for (const group of chunks) {
          const qq = query(collection(db, 'matchmakingApplications'), where('userId', 'in', group));
          const snap = await getDocs(qq);
          snap.forEach((d) => {
            const data = d.data() || {};
            const uid = safeStr(data?.userId);
            if (!uid) return;

            // Aynı userId için birden fazla doc varsa, en yeni olanı seç.
            const prev = next[uid];
            const prevTs = prev?.updatedAt?.toMillis?.() || prev?.createdAt?.toMillis?.() || 0;
            const ts = data?.updatedAt?.toMillis?.() || data?.createdAt?.toMillis?.() || 0;
            if (!prev || ts >= prevTs) {
              next[uid] = { id: d.id, ...data };
            }
          });
        }

        if (!cancelled) setAppByUserId(next);
      } catch (e) {
        console.error('matchmakingApplications load failed:', e);
        if (!cancelled) {
          setAppByUserId({});
        }
      } finally {
        if (!cancelled) setAppsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [items]);

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
          const files = u?.identityVerification?.files || null;
          const hasFiles = !!(safeStr(files?.idFrontUrl) || safeStr(files?.idBackUrl) || safeStr(files?.selfieUrl));
          const app = appByUserId?.[userId] || null;
          const person = formatPersonSummary(app);
          const appId = safeStr(app?.id);
          const profileCode = formatProfileCode(app);

          const copy = async (label, value) => {
            const ok = await copyTextToClipboard(value);
            setCopiedMsg(ok ? `${label} kopyalandı.` : 'Kopyalanamadı.');
            window.setTimeout(() => setCopiedMsg(''), 2000);
          };

          return (
            <div key={userId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {person || profileCode ? <span>{person || profileCode}</span> : <span className="text-slate-900">(Başvuru bilgisi yok)</span>}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {profileCode ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                        Kullanıcı Kodu: <span className="ml-1 font-mono">{profileCode}</span>
                      </span>
                    ) : null}

                    {appId ? (
                      <Link
                        to={`/admin/matchmaking/${encodeURIComponent(appId)}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-full bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800"
                      >
                        Detayı aç
                      </Link>
                    ) : null}
                  </div>

                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">Teknik detaylar</summary>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-800">
                        <span className="text-slate-600">User ID:</span>
                        <span className="font-mono">{shortId(userId)}</span>
                        <button type="button" onClick={() => copy('User ID', userId)} className="font-semibold text-sky-700 hover:underline">
                          Kopyala
                        </button>
                      </span>
                      {appId ? (
                        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-800">
                          <span className="text-slate-600">Başvuru ID:</span>
                          <span className="font-mono">{shortId(appId)}</span>
                          <button type="button" onClick={() => copy('Başvuru ID', appId)} className="font-semibold text-sky-700 hover:underline">
                            Kopyala
                          </button>
                        </span>
                      ) : null}
                    </div>
                  </details>
                  <p className="text-xs text-slate-600 mt-1">
                    Method: <span className="font-semibold">{method}</span> • Ref:{' '}
                    <span className="font-semibold">{ref}</span>
                  </p>
                  <p className="text-xs text-slate-600">Requested: {fmtTs(requestedAt)}</p>

                  {hasFiles ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {renderFileLink('Kimlik (Ön)', files?.idFrontUrl)}
                      {renderFileLink('Kimlik (Arka)', files?.idBackUrl)}
                      {renderFileLink('Selfie', files?.selfieUrl)}
                    </div>
                  ) : null}
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
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Kimlik Doğrulama</h2>
            <p className="text-sm text-slate-600">Bekleyen doğrulamalar: matchmakingUsers.identityVerification.status == pending</p>
          </div>
          <div className="text-xs text-slate-600">Toplam: <span className="font-semibold text-slate-900">{items.length}</span></div>
        </div>

        {appsLoading ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 text-sm">
            Başvuru bilgileri yükleniyor…
          </div>
        ) : null}

        {copiedMsg ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 text-sm">{copiedMsg}</div>
        ) : null}

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
  );
}
