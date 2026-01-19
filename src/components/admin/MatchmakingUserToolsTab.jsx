import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
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
  const [stats, setStats] = useState(null);

  const [membershipDays, setMembershipDays] = useState('30');

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
    const uid = trimmedUserId;
    if (!uid) {
      setErr('User ID girin.');
      return;
    }

    setLoading(true);
    setErr('');
    setMsg('');
    try {
      const snap = await getDoc(doc(db, 'matchmakingUsers', uid));
      setUserDoc(snap.exists() ? (snap.data() || {}) : null);

      try {
        const data = await authFetch('/api/admin-matchmaking-user-stats', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ userId: uid }),
        });
        setStats(data || null);
      } catch (e) {
        setStats(null);
      }
    } catch (e) {
      setErr(String(e?.message || 'Kullanıcı okunamadı.'));
      setUserDoc(null);
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
                Ücretsiz aktif:{' '}
                <span className="font-semibold">
                  {freeActiveInfo.active ? 'Aktif' : freeActiveInfo.blocked ? 'Bloklu' : 'Pasif'}
                </span>
              </div>
              <div className="sm:col-span-2 text-xs text-slate-600">
                Üyelik bitiş: {membershipInfo.untilMs ? fmtDateTimeTr(membershipInfo.untilMs) : '-'}
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
