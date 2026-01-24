import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';

function fmtDateTimeTr(ms) {
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

function asNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function parseProfileNoFromInput(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const mk = s.match(/^mk\s*-\s*(\d+)$/i);
  if (mk) return Number(mk[1]);
  const numeric = s.match(/^(\d+)$/);
  if (numeric) return Number(numeric[1]);
  return null;
}

function computeCancelInfo(userDoc) {
  const cb = userDoc?.contactCancelBehaviour || null;
  const events = Array.isArray(cb?.recentContactCancelMs) ? cb.recentContactCancelMs : [];
  const now = Date.now();
  const windowMs = 48 * 3600000;
  const cutoff = now - windowMs;

  const recent = events
    .filter((ms) => typeof ms === 'number' && Number.isFinite(ms))
    .filter((ms) => ms >= cutoff && ms <= now + 60000);

  const count48h = recent.length;
  const lastCancelAtMs = typeof cb?.lastContactCancelAtMs === 'number' ? cb.lastContactCancelAtMs : 0;
  const flagged = !!userDoc?.riskFlags?.frequentCanceller;

  return { count48h, lastCancelAtMs, flagged };
}

export default function MatchmakingUserToolsTab() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const [userDoc, setUserDoc] = useState(null);
  const [applicationDoc, setApplicationDoc] = useState(null);
  const [stats, setStats] = useState(null);

  const [membershipDays, setMembershipDays] = useState('30');
  const [translationPackDays, setTranslationPackDays] = useState('30');
  const [translationPackTier, setTranslationPackTier] = useState('standard');

  const trimmedUserId = useMemo(() => String(userId || '').trim(), [userId]);

  const membershipInfo = useMemo(() => {
    const m = userDoc?.membership || null;
    const untilMs = typeof m?.validUntilMs === 'number' ? m.validUntilMs : 0;
    const active = !!m?.active && untilMs > Date.now();
    const daysLeft = untilMs > Date.now() ? Math.ceil((untilMs - Date.now()) / 86400000) : 0;
    return {
      active,
      untilMs,
      daysLeft,
      plan: typeof m?.plan === 'string' ? m.plan : '',
    };
  }, [userDoc]);

  const translationPackInfo = useMemo(() => {
    const tp = userDoc?.translationPack || null;
    const untilMs = typeof tp?.validUntilMs === 'number' ? tp.validUntilMs : 0;
    const active = !!tp?.active && (!untilMs || untilMs > Date.now());
    const daysLeft = untilMs && untilMs > Date.now() ? Math.ceil((untilMs - Date.now()) / 86400000) : 0;
    return {
      active,
      untilMs,
      daysLeft,
      plan: typeof tp?.plan === 'string' ? tp.plan : '',
    };
  }, [userDoc]);

  const freeActiveInfo = useMemo(() => {
    const fam = userDoc?.freeActiveMembership || null;
    return {
      active: !!fam?.active,
      blocked: !!fam?.blocked,
      windowHours: asNum(fam?.windowHours),
      lastActiveAtMs: asNum(fam?.lastActiveAtMs),
      inactiveCount: asNum(fam?.inactiveCount) ?? 0,
      reapplyCount: asNum(fam?.reapplyCount) ?? 0,
    };
  }, [userDoc]);

  const reload = async () => {
    const input = trimmedUserId;
    if (!input) {
      setErr('User ID girin.');
      return;
    }

    setLoading(true);
    setErr('');
    setMsg('');
    try {
      // 1) Kullanıcı MK kodu ile girildiyse önce başvuru dokümanından userId bul.
      let resolvedUid = input;
      const profileNo = parseProfileNoFromInput(input);

      if (profileNo !== null && Number.isFinite(profileNo)) {
        const qApp = query(collection(db, 'matchmakingApplications'), where('profileNo', '==', profileNo), limit(1));
        const snapApp = await getDocs(qApp);
        if (snapApp.empty) {
          setUserDoc(null);
          setApplicationDoc(null);
          setStats(null);
          setErr('Bu MK kodu için başvuru bulunamadı.');
          return;
        }
        const d = snapApp.docs[0];
        const app = d.data() || {};
        setApplicationDoc({ id: d.id, ...app });
        const u = typeof app?.userId === 'string' ? app.userId.trim() : '';
        if (!u) {
          setUserDoc(null);
          setStats(null);
          setErr('Başvuru bulundu ama userId yok.');
          return;
        }
        resolvedUid = u;
      } else {
        // UID girildiyse: o UID'nin başvurusunu (son başvuru) da çek.
        try {
          const qApp = query(collection(db, 'matchmakingApplications'), where('userId', '==', resolvedUid), orderBy('createdAt', 'desc'), limit(1));
          const snapApp = await getDocs(qApp);
          if (snapApp.empty) {
            setApplicationDoc(null);
          } else {
            const d = snapApp.docs[0];
            setApplicationDoc({ id: d.id, ...(d.data() || {}) });
          }
        } catch (e) {
          setApplicationDoc(null);
        }
      }

      const snap = await getDoc(doc(db, 'matchmakingUsers', resolvedUid));
      setUserDoc(snap.exists() ? (snap.data() || {}) : null);

      try {
        const data = await authFetch('/api/admin-matchmaking-user-stats', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ userId: resolvedUid }),
        });
        setStats(data || null);
      } catch (e) {
        setStats(null);
      }
    } catch (e) {
      setErr(String(e?.message || 'Kullanıcı okunamadı.'));
      setUserDoc(null);
      setApplicationDoc(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // ilk açılışta hiçbir şey yapma
  }, []);

  const setBlocked = async (nextBlocked) => {
    const uid = trimmedUserId;
    if (!uid) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      const reason = nextBlocked ? (window.prompt('Engelleme nedeni (opsiyonel):', '') || '').trim() : '';

      await setDoc(
        doc(db, 'matchmakingUsers', uid),
        {
          blocked: !!nextBlocked,
          blockedAt: nextBlocked ? serverTimestamp() : null,
          blockedReason: nextBlocked ? reason : null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg(nextBlocked ? 'Kullanıcı engellendi.' : 'Kullanıcının engeli kaldırıldı.');
      await reload();
    } catch (e) {
      setErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const markWhatsappVerified = async () => {
    const uid = trimmedUserId;
    if (!uid) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      const note = (window.prompt('Not (opsiyonel):', 'WhatsApp doğrulama') || '').trim();
      await authFetch('/api/matchmaking-admin-identity-verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          status: 'verified',
          method: 'whatsapp',
          note,
        }),
      });

      setMsg('Kullanıcı WhatsApp doğrulaması ile doğrulandı.');
      await reload();
    } catch (e) {
      setErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const grantMembership = async () => {
    const uid = trimmedUserId;
    if (!uid) return;

    const days = Number(membershipDays);
    if (!Number.isFinite(days) || days <= 0 || days > 365) {
      setErr('Gün sayısı 1–365 arası olmalı.');
      return;
    }

    const ok = window.confirm(`Bu kullanıcıya ${days} gün üyelik tanımlansın mı?`);
    if (!ok) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      const now = Date.now();
      const validUntilMs = now + days * 86400000;

      await setDoc(
        doc(db, 'matchmakingUsers', uid),
        {
          membership: {
            active: true,
            plan: 'admin',
            validUntilMs,
            updatedAtMs: now,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg(`Üyelik aktif edildi. Bitiş: ${fmtDateTimeTr(validUntilMs)}`);
      await reload();
    } catch (e) {
      setErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const revokeMembership = async () => {
    const uid = trimmedUserId;
    if (!uid) return;

    const ok = window.confirm('Bu kullanıcının ücretli üyeliği pasif edilsin mi?');
    if (!ok) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      await setDoc(
        doc(db, 'matchmakingUsers', uid),
        {
          membership: {
            active: false,
            validUntilMs: 0,
            plan: 'admin',
            updatedAtMs: Date.now(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg('Üyelik pasif edildi.');
      await reload();
    } catch (e) {
      setErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const grantTranslationPack = async () => {
    const uid = trimmedUserId;
    if (!uid) return;

    const days = Number(translationPackDays);
    if (!Number.isFinite(days) || days <= 0 || days > 365) {
      setErr('Gün sayısı 1–365 arası olmalı.');
      return;
    }

    const tier = String(translationPackTier || '').toLowerCase().trim();
    if (tier !== 'standard' && tier !== 'pro') {
      setErr('Paket türü standard veya pro olmalı.');
      return;
    }

    const ok = window.confirm(`Bu kullanıcıya ${days} gün çeviri paketi tanımlansın mı?`);
    if (!ok) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      const now = Date.now();
      const validUntilMs = now + days * 86400000;

      await setDoc(
        doc(db, 'matchmakingUsers', uid),
        {
          translationPack: {
            active: true,
            plan: tier,
            validUntilMs,
            updatedAtMs: now,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg(`Çeviri paketi aktif edildi. Bitiş: ${fmtDateTimeTr(validUntilMs)}`);
      await reload();
    } catch (e) {
      setErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const revokeTranslationPack = async () => {
    const uid = trimmedUserId;
    if (!uid) return;

    const ok = window.confirm('Bu kullanıcının çeviri paketi pasif edilsin mi?');
    if (!ok) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      await setDoc(
        doc(db, 'matchmakingUsers', uid),
        {
          translationPack: {
            active: false,
            validUntilMs: 0,
            plan: 'admin',
            updatedAtMs: Date.now(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg('Çeviri paketi pasif edildi.');
      await reload();
    } catch (e) {
      setErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const resetFreeActiveMembership = async () => {
    const uid = trimmedUserId;
    if (!uid) return;

    const ok = window.confirm(
      'Ücretsiz aktif üyelik (freeActiveMembership) sıfırlansın mı? (blocked=false, active=false, sayaçlar=0)'
    );
    if (!ok) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      await setDoc(
        doc(db, 'matchmakingUsers', uid),
        {
          freeActiveMembership: {
            active: false,
            blocked: false,
            blockedReason: '',
            windowHours: 48,
            lastActiveAt: null,
            lastActiveAtMs: 0,
            activatedAt: null,
            activatedAtMs: 0,
            inactiveCount: 0,
            reapplyCount: 0,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMsg('Ücretsiz aktif üyelik durumu sıfırlandı.');
      await reload();
    } catch (e) {
      setErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-bold text-slate-900">Kullanıcı Yönetimi</h2>
        <p className="text-sm text-slate-600">User ID ile kullanıcıyı getirip engel/üyelik/free-active durumlarını yönetebilirsiniz.</p>

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID (uid)"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={reload}
            disabled={loading || acting}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-60"
          >
            Yükle
          </button>
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
      ) : null}

      {trimmedUserId && !loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Durum</p>
            {(() => {
              const ci = computeCancelInfo(userDoc);
              return ci.flagged || ci.count48h >= 3 ? (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs font-semibold text-rose-900">Şüpheli davranış</p>
                  <p className="mt-1 text-xs text-slate-700">
                    Son 48 saat iptal sayısı: <span className="font-semibold">{ci.count48h}</span>
                    {ci.lastCancelAtMs ? (
                      <>
                        {' '}• Son iptal: <span className="font-semibold">{fmtDateTimeTr(ci.lastCancelAtMs)}</span>
                      </>
                    ) : null}
                  </p>
                </div>
              ) : null;
            })()}
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-800">
              <div>
                Engel: <span className="font-semibold">{userDoc?.blocked ? 'Engelli' : 'Normal'}</span>
              </div>
              <div>
                Doğrulama:{' '}
                <span className="font-semibold">
                  {userDoc?.identityVerified || ['verified', 'approved'].includes(String(userDoc?.identityVerification?.status || '').toLowerCase())
                    ? 'Doğrulanmış'
                    : 'Doğrulanmamış'}
                </span>
              </div>
              <div>
                Üyelik:{' '}
                <span className="font-semibold">
                  {membershipInfo.active ? `Aktif (${membershipInfo.daysLeft}g)` : 'Pasif'}
                </span>
              </div>
              <div>
                Çeviri paketi:{' '}
                <span className="font-semibold">
                  {translationPackInfo.active
                    ? `Aktif${translationPackInfo.plan ? ` (${String(translationPackInfo.plan).toUpperCase()})` : ''}${
                        translationPackInfo.daysLeft ? ` • ${translationPackInfo.daysLeft}g` : ''
                      }`
                    : 'Pasif'}
                </span>
              </div>
              <div>
                Ücretsiz aktif:{' '}
                <span className="font-semibold">
                  {freeActiveInfo.active ? 'Aktif' : freeActiveInfo.blocked ? 'Bloklu' : 'Pasif'}
                </span>
              </div>
              <div className="sm:col-span-2 text-xs text-slate-600">
                Üyelik bitiş: {membershipInfo.untilMs ? fmtDateTimeTr(membershipInfo.untilMs) : '-'}
              </div>
              <div className="sm:col-span-2 text-xs text-slate-600">
                Çeviri paketi bitiş: {translationPackInfo.untilMs ? fmtDateTimeTr(translationPackInfo.untilMs) : '-'}
              </div>
              <div className="sm:col-span-2 text-xs text-slate-600">
                Ücretsiz aktif son aktif: {freeActiveInfo.lastActiveAtMs ? fmtDateTimeTr(freeActiveInfo.lastActiveAtMs) : '-'}
              </div>
              <div className="sm:col-span-2 text-xs text-slate-600">
                Ücretsiz aktif window: {freeActiveInfo.windowHours ? `${freeActiveInfo.windowHours} saat` : '-'} • inactiveCount: {freeActiveInfo.inactiveCount} • reapplyCount: {freeActiveInfo.reapplyCount}
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={acting}
                onClick={markWhatsappVerified}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-60"
              >
                WhatsApp ile doğrulandı
              </button>

              <button
                type="button"
                disabled={acting}
                onClick={() => setBlocked(!userDoc?.blocked)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition disabled:opacity-60 ${
                  userDoc?.blocked
                    ? 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
                    : 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                }`}
              >
                {userDoc?.blocked ? 'Engeli kaldır' : 'Engelle'}
              </button>

              <button
                type="button"
                disabled={acting}
                onClick={resetFreeActiveMembership}
                className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"
              >
                Ücretsiz aktif sıfırla
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Üyelik Yönetimi</p>
            <p className="text-xs text-slate-600 mt-1">Ödeme dışı manuel üyelik tanımlamak için.</p>

            {applicationDoc ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">Başvuru / Kimlik Bilgileri</p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-800">
                  <div>
                    Ad Soyad: <span className="font-semibold">{applicationDoc.fullName ? String(applicationDoc.fullName) : '-'}</span>
                  </div>
                  <div>
                    MK Kodu:{' '}
                    <span className="font-semibold">
                      {typeof applicationDoc.profileNo === 'number' ? `MK-${applicationDoc.profileNo}` : applicationDoc.profileCode ? String(applicationDoc.profileCode) : '-'}
                    </span>
                  </div>
                  <div>
                    Kullanıcı adı: <span className="font-semibold">{applicationDoc.username ? String(applicationDoc.username) : '-'}</span>
                  </div>
                  <div>
                    Şehir: <span className="font-semibold">{applicationDoc.city ? String(applicationDoc.city) : '-'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-600">Başvuru dokümanı bulunamadı (ad/soyad bu yüzden görünmeyebilir).</div>
            )}

            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                value={membershipDays}
                onChange={(e) => setMembershipDays(e.target.value)}
                className="w-full sm:w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Gün"
              />
              <button
                type="button"
                disabled={acting}
                onClick={grantMembership}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                Üyelik ver
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={revokeMembership}
                className="px-4 py-2 rounded-lg bg-white border border-rose-300 text-rose-700 text-sm font-semibold hover:bg-rose-50 disabled:opacity-60"
              >
                Üyeliği kapat
              </button>
            </div>

            {stats?.ok && stats?.user ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-900">Hızlı İstatistik</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-800">
                  <div>Matches: <span className="font-semibold">{stats.counts?.matchesTotal ?? 0}</span></div>
                  <div>Contact: <span className="font-semibold">{stats.counts?.contactUnlockedCount ?? 0}</span></div>
                  <div>Payments(pending): <span className="font-semibold">{stats.payments?.pending ?? 0}</span></div>
                  <div>Son aktivite: <span className="font-semibold">{fmtDateTimeTr(stats.user.lastActivityAtMs)}</span></div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-600">İstatistik yüklenemedi (opsiyonel).</div>
            )}

            <div className="mt-6 border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-900">Çeviri Paketi</p>
              <p className="text-xs text-slate-600 mt-1">Manuel çeviri özelliğini aç/kapat (aylık kota server-side).</p>

              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <div className="w-full sm:w-40">
                  <div className="text-[11px] text-slate-600 mb-1">Paket</div>
                  <select
                    value={translationPackTier}
                    onChange={(e) => setTranslationPackTier(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    aria-label="Çeviri paketi türü"
                  >
                    <option value="standard">Standard</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
                <input
                  value={translationPackDays}
                  onChange={(e) => setTranslationPackDays(e.target.value)}
                  className="w-full sm:w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Gün"
                />
                <button
                  type="button"
                  disabled={acting}
                  onClick={grantTranslationPack}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60"
                >
                  Çeviri paketi ver
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={revokeTranslationPack}
                  className="px-4 py-2 rounded-lg bg-white border border-rose-300 text-rose-700 text-sm font-semibold hover:bg-rose-50 disabled:opacity-60"
                >
                  Çeviri paketini kapat
                </button>
              </div>

              <div className="mt-2 text-xs text-slate-600">
                Durum: <span className="font-semibold">{translationPackInfo.active ? 'Aktif' : 'Pasif'}</span>
                {translationPackInfo.plan ? (
                  <>
                    {' '}• Paket: <span className="font-semibold">{String(translationPackInfo.plan).toUpperCase()}</span>
                  </>
                ) : null}
                {translationPackInfo.untilMs ? (
                  <>
                    {' '}• Bitiş: <span className="font-semibold">{fmtDateTimeTr(translationPackInfo.untilMs)}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
