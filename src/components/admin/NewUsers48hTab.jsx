import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../config/firebaseDb';
import {
  dedupeAdminNewUsers,
  getAnyAbout,
  getCreatedAtMs,
  hasKnownAccountIdentity,
  isUnknownUserWithAccount,
  pickAccountDisplayName,
  pickAccountEmail,
  safeStr,
} from '../../utils/adminNewUsers';

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

function normalizeGender(g) {
  const s = safeStr(g).toLowerCase();
  if (s === 'female') return 'female';
  if (s === 'male') return 'male';
  return '';
}

function genderLabel(g) {
  if (g === 'female') return 'Kadın';
  if (g === 'male') return 'Erkek';
  return '-';
}


function displayLabel(app, userDoc = null) {
  const username = safeStr(app?.username) || safeStr(userDoc?.username);
  if (username) return `@${username}`;

  const fullName = safeStr(app?.fullName) || safeStr(userDoc?.fullName) || safeStr(userDoc?.publicProfile?.fullName);
  if (fullName) return fullName;

  const displayName = pickAccountDisplayName(app, userDoc);
  if (displayName) return displayName;

  const accountEmail = pickAccountEmail(app, userDoc);
  if (accountEmail) return accountEmail;

  if (isUnknownUserWithAccount(app, userDoc)) return 'Bilinmeyen kullanıcı';

  return '-';
}

function pillClass(kind) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border';
  if (kind === 'unknown') return `${base} border-rose-200 bg-rose-50 text-rose-900`;
  if (kind === 'filled') return `${base} border-emerald-200 bg-emerald-50 text-emerald-900`;
  return `${base} border-slate-200 bg-slate-50 text-slate-700`;
}

export default function NewUsers48hTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [subTab, setSubTab] = useState('unknown');
  const [userInfoByUid, setUserInfoByUid] = useState({});
  const [userLoadingByUid, setUserLoadingByUid] = useState({});

  const didInitRef = useRef(false);

  const cutoffMs = useMemo(() => Date.now() - 48 * 60 * 60 * 1000, []);

  useEffect(() => {
    setLoading(true);
    setError('');

    const q = query(
      collection(db, 'matchmakingApplications'),
      where('createdAtMs', '>=', cutoffMs),
      orderBy('createdAtMs', 'desc'),
      limit(500)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        setItems(next);
        setLoading(false);
        if (!didInitRef.current) didInitRef.current = true;
      },
      (e) => {
        setItems([]);
        setLoading(false);
        setError(String(e?.message || 'Yeni kullanıcılar yüklenemedi.'));
      }
    );

    return () => unsub();
  }, [cutoffMs]);

  useEffect(() => {
    let cancelled = false;

    const toFetch = () => {
      const list = Array.isArray(items) ? items : [];
      const uids = [];
      for (const it of list) {
        const uid = safeStr(it?.userId);
        if (!uid) continue;
        if (userInfoByUid[uid] !== undefined) continue;
        if (userLoadingByUid[uid]) continue;
        uids.push(uid);
        if (uids.length >= 40) break;
      }
      return uids;
    };

    const run = async () => {
      const uids = toFetch();
      if (!uids.length) return;

      setUserLoadingByUid((prev) => {
        const next = { ...prev };
        for (const uid of uids) next[uid] = true;
        return next;
      });

      try {
        const snaps = await Promise.all(uids.map((uid) => getDoc(doc(db, 'matchmakingUsers', uid))));
        const patch = {};
        for (let i = 0; i < uids.length; i += 1) {
          patch[uids[i]] = snaps[i].exists() ? (snaps[i].data() || {}) : null;
        }
        if (!cancelled) setUserInfoByUid((prev) => ({ ...prev, ...patch }));
      } catch {
        if (!cancelled) {
          const patch = {};
          for (const uid of uids) patch[uid] = null;
          setUserInfoByUid((prev) => ({ ...prev, ...patch }));
        }
      } finally {
        if (!cancelled) {
          setUserLoadingByUid((prev) => {
            const next = { ...prev };
            for (const uid of uids) delete next[uid];
            return next;
          });
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [items, userInfoByUid, userLoadingByUid]);

  const normalizedItems = useMemo(() => dedupeAdminNewUsers(items, userInfoByUid), [items, userInfoByUid]);

  const groups = useMemo(() => {
    const list = Array.isArray(normalizedItems) ? normalizedItems : [];
    const unknown = [];
    const filled = [];

    for (const it of list) {
      const uid = safeStr(it?.userId);
      const userDoc = uid ? userInfoByUid[uid] : null;
      if (isUnknownUserWithAccount(it, userDoc)) unknown.push(it);
      else filled.push(it);
    }

    return { unknown, filled, total: list.length };
  }, [normalizedItems, userInfoByUid]);

  const visible = subTab === 'filled' ? groups.filled : groups.unknown;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Yeni Kullanıcılar (Son 48 Saat)</h2>
          <p className="text-sm text-gray-600">
            Son 48 saatteki benzersiz kullanıcılar. Toplam: <span className="font-semibold text-gray-900">{groups.total}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('unknown')}
            className={
              `px-3 py-2 rounded-lg text-sm font-semibold border transition ` +
              (subTab === 'unknown'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50')
            }
          >
            Bilinmeyenler ({groups.unknown.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('filled')}
            className={
              `px-3 py-2 rounded-lg text-sm font-semibold border transition ` +
              (subTab === 'filled'
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50')
            }
          >
            Form Dolduranlar ({groups.filled.length})
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-4 border rounded-xl overflow-hidden">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-3 py-2">Durum</th>
                <th className="text-left px-3 py-2">UC</th>
                <th className="text-left px-3 py-2">İsim</th>
                <th className="text-left px-3 py-2">Yaş</th>
                <th className="text-left px-3 py-2">Cinsiyet</th>
                <th className="text-left px-3 py-2">Kayıt</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((it) => {
                const uid = safeStr(it?.userId);
                const userDoc = uid ? userInfoByUid[uid] : null;
                const createdAtMs = getCreatedAtMs(it);
                const uc = safeStr(it?.userCode);
                const label = displayLabel(it, userDoc);
                const age = typeof it?.age === 'number' && Number.isFinite(it.age) ? it.age : '';
                const gender = normalizeGender(it?.gender);
                const kind = isUnknownUserWithAccount(it, userDoc) ? 'unknown' : 'filled';

                return (
                  <tr key={it?.id} className="border-t">
                    <td className="px-3 py-2">
                      <span className={pillClass(kind)}>{kind === 'unknown' ? 'Bilinmeyen' : 'Form'}</span>
                    </td>
                    <td className="px-3 py-2 font-mono">{uc || '-'}</td>
                    <td className="px-3 py-2">{label}</td>
                    <td className="px-3 py-2">{age || '-'}</td>
                    <td className="px-3 py-2">{genderLabel(gender)}</td>
                    <td className="px-3 py-2">{createdAtMs ? fmtDate(createdAtMs) : '-'}</td>
                  </tr>
                );
              })}

              {!visible.length && !loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    Bu grupta kullanıcı yok.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-gray-50 text-xs text-gray-600">
          Not: Bilinmeyenler listesindeki bir kullanıcı form doldurunca otomatik olarak “Form Dolduranlar” sekmesine geçer.
        </div>
      </div>
    </div>
  );
}
