import React, { useMemo, useState } from 'react';
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

function badge(text, color) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border';
  const map = {
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  };
  return <span className={`${base} ${map[color] || map.slate}`}>{text}</span>;
}

function RowTable({ title, subtitle, items }) {
  const displayUser = (r) => {
    const uname = typeof r?.username === 'string' ? r.username.trim() : '';
    if (uname) return `@${uname}`;
    const fullName = typeof r?.fullName === 'string' ? r.fullName.trim() : '';
    if (fullName) return fullName;
    const uid = typeof r?.userId === 'string' ? r.userId.trim() : '';
    return uid ? `${uid.slice(0, 10)}…` : '-';
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="text-xs text-slate-600">Adet: <span className="font-semibold text-slate-900">{items.length}</span></div>
      </div>

      <div className="mt-3 overflow-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="text-[11px] text-slate-600">
            <tr>
              <th className="py-2 pr-3">Kullanıcı</th>
              <th className="py-2 pr-3">Cinsiyet</th>
              <th className="py-2 pr-3">Aradığı</th>
              <th className="py-2 pr-3">Yaş</th>
              <th className="py-2 pr-3">Medeni</th>
              <th className="py-2 pr-3">Son görülme</th>
              <th className="py-2 pr-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((r) => (
              <tr key={`${r.userId}-${r.applicationId}`} className="text-slate-800">
                <td className="py-2 pr-3">
                  <div className="text-xs font-semibold text-slate-900">{displayUser(r)}</div>
                  <div className="font-mono text-[11px] text-slate-500">{String(r.userId || '').slice(0, 10)}…</div>
                </td>
                <td className="py-2 pr-3">{r.gender || '-'}</td>
                <td className="py-2 pr-3">{r.lookingForGender || '-'}</td>
                <td className="py-2 pr-3">{typeof r.age === 'number' ? r.age : '-'}</td>
                <td className="py-2 pr-3">{r?.details?.maritalStatus || '-'}</td>
                <td className="py-2 pr-3">{fmtDateTimeTr(r.lastSeenAtMs)}</td>
                <td className="py-2 pr-3">
                  <div className="flex flex-wrap gap-1">
                    {r.hasFreeSlot ? badge('slot', 'green') : badge('slot yok', 'slate')}
                    {r.lockActive ? badge('kilit', 'amber') : null}
                    {r.cooldownUntilMs && r.cooldownUntilMs > Date.now() ? badge('cooldown', 'amber') : null}
                    {r.inactive ? badge('pasif', 'rose') : null}
                    {r.blocked ? badge('engelli', 'rose') : null}
                    {r.newUserSlotActive ? badge('new-slot', 'indigo') : null}
                    {r.rejectedAllAtMs ? badge('reject-all', 'amber') : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">Kayıt yok.</div>
      ) : null}
    </section>
  );
}

function LastRunCard({ lastRun }) {
  if (!lastRun) return null;

  const ok = lastRun.ok;
  const started = typeof lastRun.startedAtMs === 'number' ? lastRun.startedAtMs : 0;
  const finished = typeof lastRun.finishedAtMs === 'number' ? lastRun.finishedAtMs : 0;
  const summary = lastRun.summary || {};

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {ok === true ? badge('cron: ok', 'green') : ok === false ? badge('cron: fail', 'rose') : badge('cron: ?', 'slate')}
        {lastRun.triggeredBy ? badge(`kaynak: ${lastRun.triggeredBy}`, 'slate') : null}
        {started ? badge(`başladı: ${fmtDateTimeTr(started)}`, 'slate') : badge('başladı: -', 'slate')}
        {finished ? badge(`bitti: ${fmtDateTimeTr(finished)}`, 'slate') : badge('bitti: -', 'slate')}
      </div>

      {lastRun.error ? <div className="mt-2 text-xs text-rose-900">Hata: {String(lastRun.error)}</div> : null}

      {summary && typeof summary === 'object' ? (
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
          {typeof summary.created === 'number' ? badge(`created: ${summary.created}`, 'indigo') : null}
          {typeof summary.skippedExisting === 'number' ? badge(`skipped: ${summary.skippedExisting}`, 'slate') : null}
          {typeof summary.apps === 'number' ? badge(`apps: ${summary.apps}`, 'slate') : null}
          {typeof summary.expiredProposed === 'number' ? badge(`expired: ${summary.expiredProposed}`, 'slate') : null}
        </div>
      ) : null}
    </div>
  );
}

export default function MatchmakingPoolTab() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [data, setData] = useState(null);
  const [lastLoadedAtMs, setLastLoadedAtMs] = useState(0);
  const [runAction, setRunAction] = useState({ loading: false, error: '', success: '' });
  const [rollbackAction, setRollbackAction] = useState({ loading: false, error: '', success: '' });

  const counts = useMemo(() => {
    const c = data?.counts || {};
    return {
      open: c.open || 0,
      hasFreeSlot: c.hasFreeSlot || 0,
      rejectedAll: c.rejectedAll || 0,
      renewed: c.renewed || 0,
      blocked: c.blocked || 0,
      inactive: c.inactive || 0,
      cooldown: c.cooldown || 0,
      locked: c.locked || 0,
    };
  }, [data]);

  const reload = async () => {
    setLoading(true);
    setErr('');
    try {
      const payload = await authFetch(`/api/admin-matchmaking-pool?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ limitApps: 500, sampleLimit: 60 }),
      });
      setData(payload || null);
      setLastLoadedAtMs(Date.now());
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const mapped =
        msg === 'not_found' || msg === 'request_failed_404'
          ? 'API route bulunamadı (404). Lokal geliştirmede `npm run dev` (api+web) sürecini yeniden başlatın.'
          : (msg || 'Havuz yüklenemedi.');
      setErr(mapped);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const runNow = async () => {
    if (runAction.loading) return;
    setRunAction({ loading: true, error: '', success: '' });
    try {
      const payload = await authFetch(`/api/admin-matchmaking-run-now?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ threshold: 70, limitApps: 500 }),
      });

      const created = typeof payload?.created === 'number' ? payload.created : null;
      const skipped = typeof payload?.skippedExisting === 'number' ? payload.skippedExisting : null;
      const dbg = payload?.debug && typeof payload.debug === 'object' ? payload.debug : null;
      const seekersProcessed = typeof dbg?.seekers?.processed === 'number' ? dbg.seekers.processed : null;
      const seekersTotal = typeof dbg?.seekers?.total === 'number' ? dbg.seekers.total : null;
      const noPool = typeof dbg?.seekers?.skipped?.no_pool_candidates === 'number' ? dbg.seekers.skipped.no_pool_candidates : null;
      const inactive = typeof dbg?.seekers?.skipped?.inactive === 'number' ? dbg.seekers.skipped.inactive : null;
      const locked = typeof dbg?.seekers?.skipped?.blocked_or_locked === 'number' ? dbg.seekers.skipped.blocked_or_locked : null;
      const msg =
        `Çalıştırıldı.` +
        `${created !== null ? ` created=${created}` : ''}` +
        `${skipped !== null ? ` skipped=${skipped}` : ''}` +
        `${seekersTotal !== null ? ` seekers=${seekersTotal}` : ''}` +
        `${seekersProcessed !== null ? ` processed=${seekersProcessed}` : ''}` +
        `${inactive !== null ? ` inactiveSkip=${inactive}` : ''}` +
        `${locked !== null ? ` lockedSkip=${locked}` : ''}` +
        `${noPool !== null ? ` noPool=${noPool}` : ''}`;
      setRunAction({ loading: false, error: '', success: msg });
      await reload();
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const mapped =
        msg === 'cron_secret_not_configured'
          ? 'Sunucuda MATCHMAKING_CRON_SECRET ayarlı değil (admin tetikleme devre dışı).'
          : (msg || 'Çalıştırma başarısız.');
      setRunAction({ loading: false, error: mapped, success: '' });
    }
  };

  const rollbackLastRun = async () => {
    if (rollbackAction.loading) return;
    const ok = window.confirm(
      'Son cron çalıştırmasının ürettiği PROPOSED eşleşmeler iptal edilecek. Bu işlem geri alınamaz (silmez; cancelled yapar). Devam edilsin mi?'
    );
    if (!ok) return;

    setRollbackAction({ loading: true, error: '', success: '' });
    try {
      const payload = await authFetch(`/api/admin-matchmaking-rollback-last-run?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ limitMatches: 250 }),
      });

      const cancelled = typeof payload?.cancelled === 'number' ? payload.cancelled : null;
      const found = typeof payload?.found === 'number' ? payload.found : null;
      const msg = `Geri alındı.${cancelled !== null ? ` cancelled=${cancelled}` : ''}${found !== null ? ` found=${found}` : ''}`;
      setRollbackAction({ loading: false, error: '', success: msg });
      await reload();
    } catch (e) {
      const msg = String(e?.message || '').trim();
      const mapped = msg === 'invalid_window' ? 'Son çalıştırma zamanı bulunamadı; önce havuzu yenileyin veya cron çalıştırın.' : (msg || 'Geri alma başarısız.');
      setRollbackAction({ loading: false, error: mapped, success: '' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Eşleştirme Havuzu</h2>
            <p className="text-sm text-slate-600">
              Başvurusu olan kullanıcıları “eşleşmeye açık / slotu var / reject-all / yenilemiş” gibi durumlara göre gruplar.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Not: Bu ekran sadece admin için; veriler anlık olarak API’den hesaplanır.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={runNow}
              disabled={runAction.loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {runAction.loading ? 'Çalıştırılıyor…' : 'Eşleştirmeyi çalıştır'}
            </button>

            <button
              onClick={rollbackLastRun}
              disabled={rollbackAction.loading}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
            >
              {rollbackAction.loading ? 'Geri alınıyor…' : 'Son eşleşmeleri geri al'}
            </button>

            <button
              onClick={reload}
              disabled={loading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Yükleniyor…' : 'Yenile'}
            </button>
          </div>
        </div>

        {runAction.error ? <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">{runAction.error}</div> : null}
        {runAction.success ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">{runAction.success}</div> : null}

        {rollbackAction.error ? <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">{rollbackAction.error}</div> : null}
        {rollbackAction.success ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">{rollbackAction.success}</div> : null}

        {err ? <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">{err}</div> : null}

        {data?.meta ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
            {badge(`apps: ${data.meta.totalApplications || 0}`, 'slate')}
            {badge(`users: ${data.meta.totalUsers || 0}`, 'slate')}
            {badge(`now: ${fmtDateTimeTr(data.meta.nowMs)}`, 'slate')}
            {typeof data?.meta?.sampleLimit === 'number' ? badge(`sample: ${data.meta.sampleLimit}`, 'slate') : null}
            {lastLoadedAtMs ? badge(`loaded: ${fmtDateTimeTr(lastLoadedAtMs)}`, 'slate') : null}
          </div>
        ) : null}

        {data?.lastRun ? <LastRunCard lastRun={data.lastRun} /> : null}

        {data?.counts ? (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="text-slate-600">Açık</div>
              <div className="mt-1 text-lg font-bold text-slate-900">{counts.open}</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs">
              <div className="text-emerald-700">Slotu var</div>
              <div className="mt-1 text-lg font-bold text-emerald-900">{counts.hasFreeSlot}</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
              <div className="text-amber-700">Reject-all</div>
              <div className="mt-1 text-lg font-bold text-amber-900">{counts.rejectedAll}</div>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs">
              <div className="text-indigo-700">Yenilemiş</div>
              <div className="mt-1 text-lg font-bold text-indigo-900">{counts.renewed}</div>
            </div>
          </div>
        ) : null}
      </div>

      {data?.sample ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RowTable title="Slotu olanlar" subtitle="Eşleşmeye açık + kilit yok + cooldown yok." items={data.sample.hasFreeSlot || []} />
          <RowTable title="Eşleşmeye açık" subtitle="Engelli değil + pasif değil." items={data.sample.open || []} />
          <RowTable title="Reject-all" subtitle="Hepsini reddetmiş kullanıcılar (timestamp var)." items={data.sample.rejectedAll || []} />
          <RowTable title="Yenilemiş" subtitle="Yeni eşleşme istemiş / new-slot / replacement credit gibi sinyaller." items={data.sample.renewed || []} />
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Havuzu görmek için “Yenile”ye bas.
        </div>
      )}
    </div>
  );
}
