import React, { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { db } from '../../config/firebase';
import { authFetch } from '../../utils/authFetch';

function fmtMoney(amount, currency) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '-';
  const cur = typeof currency === 'string' ? currency : '';
  return `${amount} ${cur}`.trim();
}

function langToLocale(lang) {
  const l = typeof lang === 'string' ? lang.toLowerCase() : '';
  if (l.startsWith('tr')) return 'tr-TR';
  if (l.startsWith('id')) return 'id-ID';
  return 'en-US';
}

function fmtDate(ms, lang) {
  if (!ms || typeof ms !== 'number') return '';
  try {
    return new Intl.DateTimeFormat(langToLocale(lang), { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
      new Date(ms)
    );
  } catch {
    return '';
  }
}

function methodLabel(t, method) {
  const m = typeof method === 'string' ? method : '';
  if (m === 'eft_fast') return t('admin.matchmakingPayments.methods.eft_fast');
  if (m === 'swift_wise') return t('admin.matchmakingPayments.methods.swift_wise');
  if (m === 'qris') return t('admin.matchmakingPayments.methods.qris');
  if (m === 'card') return t('admin.matchmakingPayments.methods.card');
  if (m === 'other') return t('admin.matchmakingPayments.methods.other');
  return m || '-';
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
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [status, setStatus] = useState('pending'); // pending | approved | rejected
  const [copiedMsg, setCopiedMsg] = useState('');
  const [usingIndexFallback, setUsingIndexFallback] = useState(false);
  const [tierByPaymentId, setTierByPaymentId] = useState({});

  const normalizeTier = (v) => {
    const s = typeof v === 'string' ? v.toLowerCase().trim() : '';
    return s === 'eco' || s === 'standard' || s === 'pro' ? s : 'pro';
  };

  const tierLabel = (tier) => {
    const tierKey = normalizeTier(tier);
    if (tierKey === 'eco') return t('admin.matchmakingPayments.tiers.eco');
    if (tierKey === 'standard') return t('admin.matchmakingPayments.tiers.standard');
    return t('admin.matchmakingPayments.tiers.pro');
  };

  const isIndexRequiredError = (e) => {
    const code = String(e?.code || e?.name || '');
    const message = String(e?.message || '');
    // Firestore web SDK: "failed-precondition" + "The query requires an index"
    return code === 'failed-precondition' || message.includes('requires an index');
  };

  useEffect(() => {
    setLoading(true);
    setUsingIndexFallback(false);

    const primaryQuery = query(
      collection(db, 'matchmakingPayments'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const fallbackQuery = query(collection(db, 'matchmakingPayments'), orderBy('createdAt', 'desc'), limit(50));

    let unsub = null;
    let fellBack = false;

    const subscribe = (q, { filterStatus }) => {
      return onSnapshot(
        q,
        (snap) => {
          const rows = [];
          snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
          const next = filterStatus ? rows.filter((r) => String(r?.status || '') === String(status)) : rows;
          setItems(next);
          setLoading(false);
        },
        (e) => {
          console.error('matchmakingPayments load failed:', e);

          // Index yoksa otomatik fallback: orderBy(createdAt) + client-side filter.
          if (!fellBack && isIndexRequiredError(e)) {
            fellBack = true;
            setUsingIndexFallback(true);
            setErr('');
            setMsg('');
            try {
              if (typeof unsub === 'function') unsub();
            } catch {
              // ignore
            }
            setLoading(true);
            unsub = subscribe(fallbackQuery, { filterStatus: true });
            return;
          }

          setLoading(false);
        }
      );
    };

    unsub = subscribe(primaryQuery, { filterStatus: false });
    return () => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch {
        // ignore
      }
    };
  }, [status]);

  const approve = async (paymentId, ok, tier) => {
    const appliedTier = normalizeTier(tier);
    const confirmText = ok
      ? t('admin.matchmakingPayments.confirms.approve', { tier: tierLabel(appliedTier) })
      : t('admin.matchmakingPayments.confirms.reject');

    if (!window.confirm(confirmText)) return;

    setActing(true);
    setErr('');
    setMsg('');
    try {
      const data = await authFetch('/api/matchmaking-admin-approve-payment', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ paymentId, approve: ok, tier: ok ? appliedTier : undefined }),
      });

      if (ok) {
        const until = typeof data?.validUntilMs === 'number' ? data.validUntilMs : 0;
        const untilText = fmtDate(until, i18n.language);
        setMsg(
          untilText
            ? t('admin.matchmakingPayments.messages.approvedWithUntil', { until: untilText })
            : t('admin.matchmakingPayments.messages.approved')
        );
      } else {
        setMsg(t('admin.matchmakingPayments.messages.rejected'));
      }
    } catch (e) {
      setErr(String(e?.message || t('admin.matchmakingPayments.errors.actionFailed')));
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
            <h2 className="text-lg font-bold text-slate-900">{t('admin.matchmakingPayments.titles.tab')}</h2>
            <p className="text-sm text-slate-600">{t('admin.matchmakingPayments.titles.tabSubtitle')}</p>
          </div>
          <div className="text-xs text-slate-600">
            {t('admin.matchmakingPayments.labels.shown')}: <span className="font-semibold text-slate-900">{summary.total}</span>
          </div>
        </div>

        {msg ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">{msg}</div>
        ) : null}
        {usingIndexFallback ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm">
            {t('admin.matchmakingPayments.notices.indexFallback')}
          </div>
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
            {t('admin.matchmakingPayments.statuses.pending')}
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
            {t('admin.matchmakingPayments.statuses.approved')}
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
            {t('admin.matchmakingPayments.statuses.rejected')}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          {t('admin.matchmakingPayments.labels.total')}: <span className="font-semibold">{summary.total}</span>
          {Object.keys(summary.byCurrency).length
            ? ` ( ${Object.entries(summary.byCurrency)
                .map(([k, v]) => `${k}:${v}`)
                .join(' , ')} )`
            : ''}
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          {t('admin.matchmakingPayments.common.loading')}
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          {items.length === 0 ? (
            <p className="text-sm text-slate-600">{t('admin.matchmakingPayments.common.empty')}</p>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      {(() => {
                        const selectedTier = normalizeTier(tierByPaymentId?.[p.id] ?? p?.appliedTier ?? p?.tier ?? 'pro');
                        return (
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <span>
                              {t('admin.matchmakingPayments.labels.package')}: <span className="font-semibold text-slate-900">{tierLabel(selectedTier)}</span>
                            </span>
                            {status === 'pending' ? (
                              <select
                                value={selectedTier}
                                onChange={(e) => setTierByPaymentId((prev) => ({ ...(prev || {}), [p.id]: e.target.value }))}
                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                                disabled={acting}
                              >
                                <option value="eco">{t('admin.matchmakingPayments.tiers.eco')}</option>
                                <option value="standard">{t('admin.matchmakingPayments.tiers.standard')}</option>
                                <option value="pro">{t('admin.matchmakingPayments.tiers.pro')}</option>
                              </select>
                            ) : null}
                          </div>
                        );
                      })()}

                      <p className="text-sm font-semibold text-slate-900">{fmtMoney(p?.amount, p?.currency)}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {t('admin.matchmakingPayments.labels.method')}: <span className="font-semibold">{methodLabel(t, p?.method)}</span>
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>
                          {t('admin.matchmakingPayments.labels.userId')}: <span className="font-semibold">{p?.userId || '-'}</span>
                        </span>
                        {p?.userId ? (
                          <button
                            type="button"
                            className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold hover:bg-slate-50"
                            onClick={async () => {
                              const ok = await copyText(p.userId);
                              setCopiedMsg(
                                ok
                                  ? t('admin.matchmakingPayments.copy.copied', {
                                      what: t('admin.matchmakingPayments.copy.what.userId'),
                                    })
                                  : t('admin.matchmakingPayments.copy.failed')
                              );
                              setTimeout(() => setCopiedMsg(''), 1500);
                            }}
                          >
                            {t('admin.matchmakingPayments.actions.copy')}
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>
                          {t('admin.matchmakingPayments.labels.match')}: <span className="font-semibold">{p?.matchId || '-'}</span>
                        </span>
                        {p?.matchId ? (
                          <button
                            type="button"
                            className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold hover:bg-slate-50"
                            onClick={async () => {
                              const ok = await copyText(p.matchId);
                              setCopiedMsg(
                                ok
                                  ? t('admin.matchmakingPayments.copy.copied', {
                                      what: t('admin.matchmakingPayments.copy.what.matchId'),
                                    })
                                  : t('admin.matchmakingPayments.copy.failed')
                              );
                              setTimeout(() => setCopiedMsg(''), 1500);
                            }}
                          >
                            {t('admin.matchmakingPayments.actions.copy')}
                          </button>
                        ) : null}
                      </div>

                      {p?.amountMatches === false ? (
                        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-900 text-xs">
                          {t('admin.matchmakingPayments.warnings.amountMismatch', {
                            expected: fmtMoney(p?.expectedAmount, p?.currency),
                          })}
                        </div>
                      ) : null}

                      {p?.reference ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span>
                            {t('admin.matchmakingPayments.labels.reference')}: <span className="font-semibold">{p.reference}</span>
                          </span>
                          <button
                            type="button"
                            className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold hover:bg-slate-50"
                            onClick={async () => {
                              const ok = await copyText(p.reference);
                              setCopiedMsg(
                                ok
                                  ? t('admin.matchmakingPayments.copy.copied', {
                                      what: t('admin.matchmakingPayments.copy.what.reference'),
                                    })
                                  : t('admin.matchmakingPayments.copy.failed')
                              );
                              setTimeout(() => setCopiedMsg(''), 1500);
                            }}
                          >
                            {t('admin.matchmakingPayments.actions.copy')}
                          </button>
                        </div>
                      ) : null}

                      {p?.note ? (
                        <p className="text-xs text-slate-600 mt-1">
                          {t('admin.matchmakingPayments.labels.note')}: <span className="font-semibold">{p.note}</span>
                        </p>
                      ) : null}

                      {p?.receiptUrl ? (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">{t('admin.matchmakingPayments.labels.receipt')}</p>
                            <div className="flex items-center gap-2">
                              <a
                                href={p.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-sky-700 hover:underline"
                              >
                                {t('admin.matchmakingPayments.actions.open')}
                              </a>
                              <button
                                type="button"
                                className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold hover:bg-slate-50"
                                onClick={async () => {
                                  const ok = await copyText(p.receiptUrl);
                                  setCopiedMsg(
                                    ok
                                      ? t('admin.matchmakingPayments.copy.copied', {
                                          what: t('admin.matchmakingPayments.copy.what.receiptLink'),
                                        })
                                      : t('admin.matchmakingPayments.copy.failed')
                                  );
                                  setTimeout(() => setCopiedMsg(''), 1500);
                                }}
                              >
                                {t('admin.matchmakingPayments.actions.copy')}
                              </button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="block">
                              <img
                                src={p.receiptUrl}
                                alt={t('admin.matchmakingPayments.alts.receipt')}
                                className="w-full max-w-md h-56 object-contain rounded-lg border border-slate-200 bg-white"
                                loading="lazy"
                              />
                            </a>
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold text-slate-900">{t('admin.matchmakingPayments.labels.readyMessage')}</p>
                        <div className="mt-2 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            className="px-4 py-2 rounded-full border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50"
                            onClick={async () => {
                              const text = t('admin.matchmakingPayments.templates.whatsapp.approved');
                              const ok = await copyText(text);
                              setCopiedMsg(
                                ok
                                  ? t('admin.matchmakingPayments.copy.copied', {
                                      what: t('admin.matchmakingPayments.copy.what.approvalMessage'),
                                    })
                                  : t('admin.matchmakingPayments.copy.failed')
                              );
                              setTimeout(() => setCopiedMsg(''), 1500);
                            }}
                          >
                            {t('admin.matchmakingPayments.actions.copyApprovalMessage')}
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-full border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50"
                            onClick={async () => {
                              const text = t('admin.matchmakingPayments.templates.whatsapp.rejected');
                              const ok = await copyText(text);
                              setCopiedMsg(
                                ok
                                  ? t('admin.matchmakingPayments.copy.copied', {
                                      what: t('admin.matchmakingPayments.copy.what.rejectionMessage'),
                                    })
                                  : t('admin.matchmakingPayments.copy.failed')
                              );
                              setTimeout(() => setCopiedMsg(''), 1500);
                            }}
                          >
                            {t('admin.matchmakingPayments.actions.copyRejectionMessage')}
                          </button>
                        </div>
                      </div>
                    </div>

                    {status === 'pending' ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => {
                            const selectedTier = normalizeTier(tierByPaymentId?.[p.id] ?? p?.appliedTier ?? p?.tier ?? 'pro');
                            approve(p.id, true, selectedTier);
                          }}
                          className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {t('admin.matchmakingPayments.actions.approve')}
                        </button>
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => approve(p.id, false)}
                          className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
                        >
                          {t('admin.matchmakingPayments.actions.reject')}
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
