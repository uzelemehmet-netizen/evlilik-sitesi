import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDownloadURL, ref } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import { storage } from '../../config/firebase';
import { db } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';
import { formatProfileCode } from '../../utils/profileCode';

function formatTs(ts) {
  try {
    if (!ts) return '';
    if (typeof ts.toDate === 'function') {
      const d = ts.toDate();
      return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    }
    return String(ts);
  } catch (e) {
    return '';
  }
}

function labelForStatus(v) {
  if (!v) return '-';
  if (v === 'new') return 'Yeni';
  if (v === 'read') return 'Okundu';
  if (v === 'reviewed') return 'İncelendi';
  if (v === 'contacted') return 'İletişime geçildi';
  if (v === 'archived') return 'Arşivlendi';
  if (v === 'deleted') return 'Silindi';
  return String(v);
}

export default function MatchmakingTab({ items, newCount, onMarkAllRead }) {
  const [permissionMsg, setPermissionMsg] = useState('');
  const [photoUrlById, setPhotoUrlById] = useState({});
  const [activeGender, setActiveGender] = useState('female'); // female | male
  const [activeId, setActiveId] = useState('');
  const [search, setSearch] = useState('');

  const [activeMembership, setActiveMembership] = useState(null);
  const [activeMembershipLoading, setActiveMembershipLoading] = useState(false);

  const [activeUserStats, setActiveUserStats] = useState({ loading: false, error: '', data: null });

  const [membershipByUserId, setMembershipByUserId] = useState({});
  const [membershipLoadingByUserId, setMembershipLoadingByUserId] = useState({});

  const canNotify = useMemo(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  }, []);

  const requestNotifications = async () => {
    setPermissionMsg('');
    if (!canNotify) {
      setPermissionMsg('Bu tarayıcı bildirimleri desteklemiyor.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setPermissionMsg('Bildirim izni verildi. Yeni başvurular geldiğinde tarayıcı bildirimi göreceksiniz.');
      } else {
        setPermissionMsg('Bildirim izni verilmedi. Yine de panelde sayaç/badge görünecek.');
      }
    } catch (e) {
      setPermissionMsg('Bildirim izni alınamadı.');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const next = {};
      const list = Array.isArray(items) ? items : [];

      for (const it of list) {
        if (!it?.id) continue;
        if (it.photoUrl && typeof it.photoUrl === 'string') {
          next[it.id] = it.photoUrl;
          continue;
        }
        const urls = Array.isArray(it.photoUrls) ? it.photoUrls : [];
        const firstUrl = urls.find((u) => typeof u === 'string' && u.trim());
        if (firstUrl) {
          next[it.id] = firstUrl;
          continue;
        }

        const paths = Array.isArray(it.photoPaths) ? it.photoPaths : [];
        const path = it.photoPath || paths[0];
        if (!path || typeof path !== 'string') continue;

        try {
          const url = await getDownloadURL(ref(storage, path));
          next[it.id] = url;
        } catch (e) {
          // if rules block or missing, ignore
        }
      }

      if (cancelled) return;
      setPhotoUrlById((prev) => ({ ...prev, ...next }));
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const genderCounts = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const female = list.filter((it) => it?.gender === 'female').length;
    const male = list.filter((it) => it?.gender === 'male').length;
    return { female, male };
  }, [items]);

  const filteredItems = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const base = list.filter((it) => it?.gender === activeGender);

    const term = String(search || '').trim().toLowerCase();
    if (!term) return base;

    const num = Number(term);
    const isNumeric = Number.isFinite(num) && String(num) === term;

    return base.filter((it) => {
      const name = String(it?.fullName || '').toLowerCase();
      const id = String(it?.id || '').toLowerCase();
      const code = String(it?.profileCode || '').toLowerCase();
      const no = typeof it?.profileNo === 'number' ? String(it.profileNo) : '';
      if (isNumeric && typeof it?.profileNo === 'number' && it.profileNo === num) return true;
      return name.includes(term) || id.includes(term) || code.includes(term) || (no && no.includes(term));
    });
  }, [activeGender, items, search]);

  useEffect(() => {
    let cancelled = false;

    const toFetch = () => {
      const list = Array.isArray(filteredItems) ? filteredItems : [];
      const ids = [];
      for (const it of list) {
        const uid = it?.userId && typeof it.userId === 'string' ? it.userId : '';
        if (!uid) continue;
        if (membershipByUserId[uid] !== undefined) continue; // cached (including null)
        if (membershipLoadingByUserId[uid]) continue;
        ids.push(uid);
        if (ids.length >= 30) break; // limit reads per change
      }
      return ids;
    };

    const run = async () => {
      const ids = toFetch();
      if (!ids.length) return;

      setMembershipLoadingByUserId((prev) => {
        const next = { ...prev };
        for (const uid of ids) next[uid] = true;
        return next;
      });

      try {
        const snaps = await Promise.all(ids.map((uid) => getDoc(doc(db, 'matchmakingUsers', uid))));
        const patch = {};
        for (let i = 0; i < ids.length; i += 1) {
          const uid = ids[i];
          const snap = snaps[i];
          const data = snap.exists() ? (snap.data() || {}) : {};
          patch[uid] = data.membership || null;
        }
        if (!cancelled) {
          setMembershipByUserId((prev) => ({ ...prev, ...patch }));
        }
      } catch (e) {
        if (!cancelled) {
          const patch = {};
          for (const uid of ids) patch[uid] = null;
          setMembershipByUserId((prev) => ({ ...prev, ...patch }));
        }
      } finally {
        if (!cancelled) {
          setMembershipLoadingByUserId((prev) => {
            const next = { ...prev };
            for (const uid of ids) delete next[uid];
            return next;
          });
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [filteredItems, membershipByUserId, membershipLoadingByUserId]);

  useEffect(() => {
    const list = Array.isArray(filteredItems) ? filteredItems : [];
    if (!list.length) {
      setActiveId('');
      return;
    }

    const exists = activeId && list.some((it) => it?.id === activeId);
    if (!exists) {
      setActiveId(list[0]?.id || '');
    }
  }, [activeGender, filteredItems, activeId]);

  const activeItem = useMemo(() => {
    const list = Array.isArray(filteredItems) ? filteredItems : [];
    return list.find((it) => it?.id === activeId) || null;
  }, [filteredItems, activeId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const uid = activeItem?.userId && typeof activeItem.userId === 'string' ? activeItem.userId : '';
      if (!uid) {
        setActiveMembership(null);
        return;
      }

      setActiveMembershipLoading(true);
      try {
        const snap = await getDoc(doc(db, 'matchmakingUsers', uid));
        const data = snap.exists() ? (snap.data() || {}) : {};
        if (!cancelled) setActiveMembership(data.membership || null);
      } catch (e) {
        if (!cancelled) setActiveMembership(null);
      } finally {
        if (!cancelled) setActiveMembershipLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [activeItem?.userId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const uid = activeItem?.userId && typeof activeItem.userId === 'string' ? activeItem.userId : '';
      if (!uid) {
        setActiveUserStats({ loading: false, error: '', data: null });
        return;
      }

      setActiveUserStats({ loading: true, error: '', data: null });
      try {
        const data = await authFetch('/api/admin-matchmaking-user-stats', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ userId: uid }),
        });
        if (!cancelled) setActiveUserStats({ loading: false, error: '', data: data || null });
      } catch (e) {
        const msg = String(e?.message || '').trim();
        if (!cancelled) setActiveUserStats({ loading: false, error: msg || 'Stats yüklenemedi.', data: null });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [activeItem?.userId]);

  const formatDateTimeTr = (ms) => {
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
  };

  const activityLabel = (ms) => {
    if (!ms || typeof ms !== 'number') return 'Bilinmiyor';
    const diff = Date.now() - ms;
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return 'Bugün aktif';
    if (days === 1) return 'Dün aktif';
    if (days < 7) return `${days} gün önce aktif`;
    if (days < 30) return `${Math.floor(days / 7)} hafta önce aktif`;
    return `${Math.floor(days / 30)} ay önce aktif`;
  };

  const activeMembershipInfo = useMemo(() => {
    const m = activeMembership || null;
    const validUntilMs = typeof m?.validUntilMs === 'number' ? m.validUntilMs : 0;
    const active = !!m?.active && validUntilMs > Date.now();
    const msLeft = validUntilMs - Date.now();
    const daysLeft = msLeft > 0 ? Math.ceil(msLeft / 86400000) : 0;
    const untilText = validUntilMs
      ? new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
          new Date(validUntilMs)
        )
      : '';
    return { active, daysLeft, untilText };
  }, [activeMembership]);

  const tabLabel = (it) => {
    const name = (it?.fullName || '-').trim();
    const age = typeof it?.age === 'number' ? it.age : null;
    const profile = formatProfileCode(it);
    const base = age !== null ? `${name} ${age}` : name;
    return profile ? `${base} • ${profile}` : base;
  };

  const membershipBadge = (it) => {
    const uid = it?.userId && typeof it.userId === 'string' ? it.userId : '';
    if (!uid) return null;

    if (membershipLoadingByUserId[uid]) {
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border border-slate-200 bg-white text-slate-600">
          Üyelik…
        </span>
      );
    }

    const m = membershipByUserId[uid];
    if (!m) {
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border border-slate-200 bg-white text-slate-600">
          Üyelik yok
        </span>
      );
    }

    const validUntilMs = typeof m?.validUntilMs === 'number' ? m.validUntilMs : 0;
    const active = !!m?.active && validUntilMs > Date.now();
    if (!active) {
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border border-rose-200 bg-rose-50 text-rose-900">
          Süresi doldu
        </span>
      );
    }

    const msLeft = validUntilMs - Date.now();
    const daysLeft = msLeft > 0 ? Math.ceil(msLeft / 86400000) : 0;

    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-900">
        Üye{daysLeft ? ` • ${daysLeft}g` : ''}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Evlilik Eşleştirme Başvuruları</h2>
            <p className="text-sm text-slate-600">Profiller herkese açık değildir; sadece admin panelde görüntülenir.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={requestNotifications}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold"
            >
              Bildirimleri Aç
            </button>
            <button
              type="button"
              onClick={onMarkAllRead}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
            >
              Okundu Olarak İşaretle {newCount > 0 ? `(${newCount})` : ''}
            </button>
          </div>
        </div>
        {permissionMsg && <p className="mt-3 text-xs text-slate-700">{permissionMsg}</p>}
      </div>

      {activeItem ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Kullanıcı Özeti</p>
              <p className="text-xs text-slate-600 mt-1">Seçili başvuruya bağlı kullanıcı (matchmakingUsers + eşleşmeler + ödemeler).</p>
            </div>
            <div className="text-right">
              {activeItem?.userId ? (
                <div className="text-[11px] text-slate-600">UID: <span className="font-semibold text-slate-900">{activeItem.userId}</span></div>
              ) : null}
              <div className="text-[11px] text-slate-600">Cinsiyet: <span className="font-semibold text-slate-900">{activeItem?.gender === 'female' ? 'Kadın' : activeItem?.gender === 'male' ? 'Erkek' : (activeItem?.gender || '-')}</span></div>
            </div>
          </div>

          {activeUserStats.loading ? (
            <div className="mt-3 text-sm text-slate-600">Yükleniyor…</div>
          ) : null}

          {activeUserStats.error ? (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-sm">{activeUserStats.error}</div>
          ) : null}

          {activeUserStats.data?.ok && activeUserStats.data?.user ? (
            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">Durum</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-800">
                  <div>Üyelik: <span className="font-semibold">{activeUserStats.data.user.membershipActive ? 'Aktif' : 'Yok/Pasif'}</span></div>
                  <div>Doğrulama: <span className="font-semibold">{activeUserStats.data.user.identityVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}</span></div>
                  <div>Engel: <span className="font-semibold">{activeUserStats.data.user.blocked ? 'Engelli' : 'Normal'}</span></div>
                  <div>Aktiflik: <span className="font-semibold">{activityLabel(activeUserStats.data.user.lastActivityAtMs)}</span></div>
                  <div className="sm:col-span-2 text-xs text-slate-600">Son hareket: {formatDateTimeTr(activeUserStats.data.user.lastActivityAtMs)}</div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-800">
                  <div>Yenileme (toplam): <span className="font-semibold">{Number.isFinite(activeUserStats.data.user.newMatchRequestTotalCount) ? activeUserStats.data.user.newMatchRequestTotalCount : 0}</span></div>
                  <div>Yenileme (bugün): <span className="font-semibold">{(() => {
                    const q = activeUserStats.data.user.newMatchRequestQuota || null;
                    const c = typeof q?.count === 'number' ? q.count : 0;
                    const l = typeof q?.limit === 'number' ? q.limit : 3;
                    return `${c}/${l}`;
                  })()}</span></div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">Eşleşme İstatistikleri</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-800">
                  <div>Toplam eşleşme: <span className="font-semibold">{activeUserStats.data.counts?.matchesTotal ?? 0}</span></div>
                  <div>Teklifte: <span className="font-semibold">{activeUserStats.data.counts?.proposedCount ?? 0}</span></div>
                  <div>Karşılıklı onay: <span className="font-semibold">{activeUserStats.data.counts?.mutualAcceptedCount ?? 0}</span></div>
                  <div>2. onay geçti: <span className="font-semibold">{activeUserStats.data.counts?.secondStepCount ?? 0}</span></div>
                  <div>İletişim açıldı: <span className="font-semibold">{activeUserStats.data.counts?.contactUnlockedCount ?? 0}</span></div>
                  <div>İptal: <span className="font-semibold">{activeUserStats.data.counts?.cancelledCount ?? 0}</span></div>
                  <div>Reddedilme: <span className="font-semibold">{activeUserStats.data.counts?.cancelledRejectedCount ?? 0}</span></div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 lg:col-span-2">
                <p className="text-xs font-semibold text-slate-900">Ödemeler</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm text-slate-800">
                  <div>Toplam: <span className="font-semibold">{activeUserStats.data.payments?.total ?? 0}</span></div>
                  <div>Pending: <span className="font-semibold">{activeUserStats.data.payments?.pending ?? 0}</span></div>
                  <div>Approved: <span className="font-semibold">{activeUserStats.data.payments?.approved ?? 0}</span></div>
                  <div>Rejected: <span className="font-semibold">{activeUserStats.data.payments?.rejected ?? 0}</span></div>
                </div>

                {(activeUserStats.data.payments?.recent || []).length ? (
                  <div className="mt-3 overflow-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Tarih</th>
                          <th className="px-3 py-2 text-left">Durum</th>
                          <th className="px-3 py-2 text-left">Tutar</th>
                          <th className="px-3 py-2 text-left">Match</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeUserStats.data.payments.recent || []).map((p) => (
                          <tr key={p.id} className="border-t border-slate-100">
                            <td className="px-3 py-2">{formatDateTimeTr(p.createdAtMs)}</td>
                            <td className="px-3 py-2">{p.status || '-'}</td>
                            <td className="px-3 py-2">{typeof p.amount === 'number' ? `${p.amount} ${p.currency || ''}` : '-'}</td>
                            <td className="px-3 py-2">{p.matchId || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-600">Ödeme kaydı yok.</div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 lg:col-span-2">
                <p className="text-xs font-semibold text-slate-900">Son Eşleşmeler</p>
                {(activeUserStats.data.recentMatches || []).length ? (
                  <div className="mt-2 overflow-auto rounded-lg border border-slate-200">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Tarih</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Mode</th>
                          <th className="px-3 py-2 text-left">Decisions</th>
                          <th className="px-3 py-2 text-left">Cancel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeUserStats.data.recentMatches || []).map((m) => (
                          <tr key={m.id} className="border-t border-slate-100">
                            <td className="px-3 py-2">{formatDateTimeTr(m.createdAtMs)}</td>
                            <td className="px-3 py-2">{m.status || '-'}</td>
                            <td className="px-3 py-2">{m.interactionMode || '-'}</td>
                            <td className="px-3 py-2">
                              a:{String(m?.decisions?.a ?? '-')}, b:{String(m?.decisions?.b ?? '-')}
                            </td>
                            <td className="px-3 py-2">{m.cancelledReason ? `${m.cancelledReason}${m.cancelledByUserId ? ` (${m.cancelledByUserId.slice(0, 6)}…)` : ''}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-600">Eşleşme kaydı yok.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveGender('female')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              activeGender === 'female'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Kadın ({genderCounts.female})
          </button>
          <button
            type="button"
            onClick={() => setActiveGender('male')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              activeGender === 'male'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Erkek ({genderCounts.male})
          </button>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-600">Arama (Kullanıcı Adı / Başvuru ID / İsim)</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Örn: MK-10023 veya 10023 veya Mehmet"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        {(!filteredItems || filteredItems.length === 0) ? (
          <div className="p-3 text-sm text-slate-700">Bu sekmede henüz başvuru yok.</div>
        ) : (
          <div className="flex flex-col md:flex-row gap-3">
            <div className="md:w-80">
              <p className="px-2 pb-2 text-xs font-semibold text-slate-600">Başvurular (isim + yaş)</p>
              <div className="max-h-[60vh] overflow-auto pr-1">
                <div className="flex flex-col gap-2">
                  {filteredItems.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => setActiveId(it.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-semibold transition ${
                        activeId === it.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{tabLabel(it)}</span>
                        <span className="flex items-center gap-2">
                          {membershipBadge(it)}
                          <span className={`text-xs ${activeId === it.id ? 'text-white/80' : 'text-slate-500'}`}>{formatTs(it.createdAt)}</span>
                        </span>
                      </div>
                      <div className={`mt-1 text-xs ${activeId === it.id ? 'text-white/80' : 'text-slate-600'}`}>
                        {formatProfileCode(it)
                          ? `${formatProfileCode(it)}${it.city ? ` • ${it.city}` : ''}`
                          : (it.city ? it.city : '')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1">
              {activeItem ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-56">
                      {photoUrlById[activeItem.id] ? (
                        <img
                          src={photoUrlById[activeItem.id]}
                          alt={activeItem.fullName || 'photo'}
                          className="w-full h-56 object-cover rounded-lg border border-slate-200"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-56 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-500">
                          Foto yok
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-bold text-slate-900">{tabLabel(activeItem)}</p>
                          <p className="text-xs text-slate-600">
                            {formatTs(activeItem.createdAt)}
                            {activeItem.city ? ` • ${activeItem.city}` : ''}
                          </p>
                          {formatProfileCode(activeItem) ? (
                            <p className="text-xs text-slate-700 mt-1">Kullanıcı Kodu: <span className="font-semibold">{formatProfileCode(activeItem)}</span></p>
                          ) : null}
                        </div>
                        {activeItem.id && (
                          <Link
                            to={`/admin/matchmaking/${activeItem.id}`}
                            className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            Formu aç
                          </Link>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <p><span className="font-semibold">WhatsApp:</span> {activeItem.whatsapp || '-'}</p>
                        <p><span className="font-semibold">E-posta:</span> {activeItem.email || '-'}</p>
                        <p><span className="font-semibold">Instagram:</span> {activeItem.instagram || '-'}</p>
                        <p><span className="font-semibold">Durum:</span> {labelForStatus(activeItem.status)}</p>
                        <p className="md:col-span-2">
                          <span className="font-semibold">Üyelik:</span>{' '}
                          {activeMembershipLoading
                            ? 'Yükleniyor…'
                            : activeMembershipInfo.active
                              ? `Aktif${activeMembershipInfo.daysLeft ? ` • ${activeMembershipInfo.daysLeft} gün kaldı` : ''}${activeMembershipInfo.untilText ? ` • Bitiş: ${activeMembershipInfo.untilText}` : ''}`
                              : (activeMembershipInfo.untilText ? `Pasif/bitmiş • Son bitiş: ${activeMembershipInfo.untilText}` : 'Yok')}
                        </p>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm font-semibold text-slate-900">Kısa bilgi</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{activeItem.about || '-'}</p>
                      </div>

                      {activeItem.expectations && (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-slate-900">Beklenti</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{activeItem.expectations}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-sm text-slate-700">Bir başvuru seçin.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
