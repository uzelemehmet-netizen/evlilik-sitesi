import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../../config/firebaseDb';
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

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function displayUserLabel(m, side) {
  const p = m?.profiles?.[side] || null;
  const username = safeStr(p?.username);
  if (username) return `@${username}`;
  const fullName = safeStr(p?.fullName);
  if (fullName) return fullName;
  const code = profileCodeOf(p);
  if (code) return code;
  const uid = safeStr(side === 'a' ? m?.aUserId : m?.bUserId);
  return uid ? shortenId(uid) : side.toUpperCase();
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
  const { t } = useTranslation();
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
              setErr(String(e2?.message || t('admin.matchmakingMatches.errors.loadFailed')));
              setLoading(false);
            }
          );
          return;
        }

        console.error('matchmakingMatches load failed:', e);
        setErr(String(e?.message || t('admin.matchmakingMatches.errors.loadFailed')));
        setLoading(false);
      }
    );

    return () => {
      unsub();
      if (typeof unsubFallback === 'function') unsubFallback();
    };
  }, []);

  const cancel = async (matchId) => {
    const ok = window.confirm(t('admin.matchmakingMatches.confirms.cancelMatch'));
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
      setMsg(t('admin.matchmakingMatches.messages.cancelSuccess'));
    } catch (e) {
      setErr(String(e?.message || t('admin.matchmakingMatches.errors.actionFailed')));
    } finally {
      setActing(false);
    }
  };

  const createManualMatch = async () => {
    const a = String(manualA || '').trim();
    const b = String(manualB || '').trim();
    if (!a || !b) {
      setErr(t('admin.matchmakingMatches.errors.manualInputRequired'));
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
        ? t('admin.matchmakingMatches.messages.manualExtraUpdated')
        : data?.skippedBecauseExists
          ? t('admin.matchmakingMatches.messages.manualExtraSkipped')
          : '';
      setMsg(t('admin.matchmakingMatches.messages.manualCreated', { matchId: data?.matchId || '-', extra }));
    } catch (e) {
      const details = e?.details ? ` (${JSON.stringify(e.details)})` : '';
      setErr(String(e?.message || t('admin.matchmakingMatches.errors.actionFailed')) + details);
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
            <h2 className="text-lg font-bold text-slate-900">{t('admin.matchmakingMatches.titles.tab')}</h2>
            <p className="text-sm text-slate-600">{t('admin.matchmakingMatches.titles.tabSubtitle')}</p>
          </div>
          <div className="text-xs text-slate-600">
            {t('admin.matchmakingMatches.labels.total')}: <span className="font-semibold text-slate-900">{items.length}</span>
          </div>
        </div>

        {msg ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">{msg}</div>
        ) : null}
        {err ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">{err}</div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{t('admin.matchmakingMatches.common.loading')}</div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{t('admin.matchmakingMatches.manual.title')}</p>
            <p className="text-xs text-slate-600 mt-1">
              {t('admin.matchmakingMatches.manual.descriptionShort')}
            </p>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t('admin.matchmakingMatches.manual.labels.a')}</label>
                <input
                  value={manualA}
                  onChange={(e) => setManualA(e.target.value)}
                  placeholder={t('admin.matchmakingMatches.manual.placeholders.a')}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t('admin.matchmakingMatches.manual.labels.b')}</label>
                <input
                  value={manualB}
                  onChange={(e) => setManualB(e.target.value)}
                  placeholder={t('admin.matchmakingMatches.manual.placeholders.b')}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">{t('admin.matchmakingMatches.manual.labels.startStatus')}</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="proposed">{t('admin.matchmakingMatches.manual.statusOptions.proposed')}</option>
                  <option value="mutual_accepted">{t('admin.matchmakingMatches.manual.statusOptions.mutualAccepted')}</option>
                  <option value="contact_unlocked">{t('admin.matchmakingMatches.manual.statusOptions.contactUnlocked')}</option>
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
                {t('admin.matchmakingMatches.manual.labels.overwrite')}
              </label>

              <button
                type="button"
                disabled={acting}
                onClick={createManualMatch}
                className="px-4 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60"
              >
                {t('admin.matchmakingMatches.manual.actions.create')}
              </button>

              <button
                type="button"
                disabled={acting}
                onClick={clearManualDraft}
                className="px-4 py-2 rounded-full bg-slate-100 text-slate-800 text-sm font-semibold hover:bg-slate-200 disabled:opacity-60"
              >
                {t('admin.matchmakingMatches.manual.actions.clear')}
              </button>

              <Link
                to="/admin/matchmaking-matches"
                className="text-sm font-semibold text-sky-700 hover:underline"
              >
                {t('admin.matchmakingMatches.nav.openDetailedPage')}
              </Link>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{t('admin.matchmakingMatches.sections.mutual')}</p>
            {grouped.mutual.length === 0 ? (
              <p className="text-sm text-slate-600 mt-2">{t('admin.matchmakingMatches.common.empty')}</p>
            ) : (
              <div className="mt-3 space-y-3">
                {grouped.mutual.map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {displayUserLabel(m, 'a')} ↔ {displayUserLabel(m, 'b')}
                    </p>
                    {(() => {
                      const aCode = profileCodeOf(m?.profiles?.a);
                      const bCode = profileCodeOf(m?.profiles?.b);
                      const aAppId = appIdOf(m, 'a');
                      const bAppId = appIdOf(m, 'b');
                      return aCode || bCode ? (
                        <p className="text-xs text-slate-700 mt-1">
                          {t('admin.matchmakingMatches.labels.match')}{' '}
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
                    <p className="text-xs text-slate-600 mt-1">
                      {t('admin.matchmakingMatches.labels.score', {
                        score: typeof m.score === 'number' ? `%${m.score}` : '-',
                      })}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                      <span>
                        {t('admin.matchmakingMatches.labels.recordId')} <span className="font-mono">{shortenId(m.id)}</span>
                      </span>
                      <button
                        type="button"
                        className="text-sky-700 hover:underline"
                        onClick={async () => {
                          const ok = await copyText(m.id);
                          setMsg(ok ? t('admin.matchmakingMatches.messages.copySuccess') : t('admin.matchmakingMatches.messages.copyFailed'));
                          setTimeout(() => setMsg(''), 1200);
                        }}
                      >
                        {t('admin.matchmakingMatches.actions.copy')}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => cancel(m.id)}
                        className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
                      >
                        {t('admin.matchmakingMatches.actions.cancel')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{t('admin.matchmakingMatches.sections.contactUnlocked')}</p>
            {grouped.contactUnlocked.length === 0 ? (
              <p className="text-sm text-slate-600 mt-2">{t('admin.matchmakingMatches.common.empty')}</p>
            ) : (
              <div className="mt-3 space-y-3">
                {grouped.contactUnlocked.map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {displayUserLabel(m, 'a')} ↔ {displayUserLabel(m, 'b')}
                    </p>
                    {(() => {
                      const aCode = profileCodeOf(m?.profiles?.a);
                      const bCode = profileCodeOf(m?.profiles?.b);
                      const aAppId = appIdOf(m, 'a');
                      const bAppId = appIdOf(m, 'b');
                      return aCode || bCode ? (
                        <p className="text-xs text-slate-700 mt-1">
                          {t('admin.matchmakingMatches.labels.match')}{' '}
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
                    <p className="text-xs text-slate-600 mt-1">
                      {t('admin.matchmakingMatches.labels.score', {
                        score: typeof m.score === 'number' ? `%${m.score}` : '-',
                      })}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                      <span>
                        {t('admin.matchmakingMatches.labels.recordId')} <span className="font-mono">{shortenId(m.id)}</span>
                      </span>
                      <button
                        type="button"
                        className="text-sky-700 hover:underline"
                        onClick={async () => {
                          const ok = await copyText(m.id);
                          setMsg(ok ? t('admin.matchmakingMatches.messages.copySuccess') : t('admin.matchmakingMatches.messages.copyFailed'));
                          setTimeout(() => setMsg(''), 1200);
                        }}
                      >
                        {t('admin.matchmakingMatches.actions.copy')}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={acting}
                        onClick={() => cancel(m.id)}
                        className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
                      >
                        {t('admin.matchmakingMatches.actions.cancel')}
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
