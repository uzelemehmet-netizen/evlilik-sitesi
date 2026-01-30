import { useMemo } from 'react';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function genderLabelTR(raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  if (s === 'female' || s === 'f' || s === 'kadin' || s === 'kadın') return 'Kadın';
  if (s === 'male' || s === 'm' || s === 'erkek') return 'Erkek';
  return '';
}

function clip(s, maxLen) {
  const v = safeStr(s);
  if (!v) return '';
  return v.length > maxLen ? `${v.slice(0, maxLen)}…` : v;
}

function asMs(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v && typeof v.toMillis === 'function') return v.toMillis();
  if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
  return 0;
}

export default function StudioInboxModal({
  open,
  onClose,
  title,
  items,
  mode,
  onMarkRead,
  onApprove,
  onReject,
  loadingId,
  error,
}) {
  const list = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const visible = useMemo(() => {
    const pending = list.filter((x) => safeStr(x?.status) === 'pending');
    if (mode === 'messages') {
      // inboxMessages: status delivered, readAtMs
      // accessRequests: status pending, messageText/messageCreatedAtMs
      return list
        .filter((x) => !!safeStr(x?.text) || !!safeStr(x?.messageText))
        .sort(
          (a, b) =>
            (asMs(b?.createdAtMs) || asMs(b?.messageCreatedAtMs) || 0) - (asMs(a?.createdAtMs) || asMs(a?.messageCreatedAtMs) || 0)
        );
    }
    return pending.sort((a, b) => (asMs(b?.createdAtMs) || 0) - (asMs(a?.createdAtMs) || 0));
  }, [list, mode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <p className="font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto p-4">
          {error ? <p className="mb-3 text-rose-700">{error}</p> : null}

          {visible.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              {mode === 'messages' ? 'Şu anda yeni mesaj yok.' : 'Şu anda yeni istek yok.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {visible.map((it) => {
                const fromUid = safeStr(it?.fromUid);
                const id = safeStr(it?.requestId) || safeStr(it?.id);
                const type = safeStr(it?.type);
                const isPreMatch = type === 'pre_match';
                const p = it?.fromProfile && typeof it.fromProfile === 'object' ? it.fromProfile : {};

                const name = safeStr(p?.username) || 'Profil';
                const age = typeof p?.age === 'number' ? `, ${p.age}` : '';
                const gender = genderLabelTR(p?.gender);
                const city = safeStr(p?.city);
                const photoUrl = safeStr(p?.photoUrl);

                const msg = clip(mode === 'messages' ? (it?.text || it?.messageText) : it?.messageText, 600);
                const readMsRaw = mode === 'messages' ? it?.readAtMs : it?.messageReadAtMs;
                const readMs = typeof readMsRaw === 'number' && Number.isFinite(readMsRaw) ? readMsRaw : 0;
                const isUnread = !!msg && readMs <= 0;

                return (
                  <div key={id || fromUid} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="flex gap-3 p-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {photoUrl ? <img src={photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" /> : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="truncate text-sm font-semibold text-slate-900">{name}{age}</p>
                              {gender ? (
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                  {gender}
                                </span>
                              ) : null}
                            </div>
                            {city ? <p className="truncate text-xs text-slate-600">{city}</p> : null}
                          </div>

                          {isUnread ? (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                              Yeni
                            </span>
                          ) : null}
                        </div>

                        {msg ? (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-800">
                            {msg}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-slate-700">
                            {safeStr(it?.type) === 'pre_match'
                              ? 'Ön eşleşme isteği gönderdi.'
                              : 'Profilini görmek için izin istiyor.'}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {mode === 'messages' ? (
                            <>
                              <button
                                type="button"
                                disabled={!!loadingId || !id}
                                onClick={() => onMarkRead?.({ messageId: id })}
                                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                              >
                                {isUnread ? 'Okundu yap' : 'Okundu'}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={!!loadingId}
                                onClick={async () => {
                                  try {
                                    if (msg && isUnread) await onMarkRead?.({ requestId: id, fromUid });
                                  } catch {
                                    // noop
                                  }
                                  onApprove?.({ fromUid, type });
                                }}
                                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {isPreMatch ? 'Onayla' : 'İzin ver'}
                              </button>

                              <button
                                type="button"
                                disabled={!!loadingId}
                                onClick={async () => {
                                  try {
                                    if (msg && isUnread) await onMarkRead?.({ requestId: id, fromUid });
                                  } catch {
                                    // noop
                                  }
                                  onReject?.({ fromUid, type });
                                }}
                                className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                              >
                                Reddet
                              </button>

                              {msg && isUnread ? (
                                <button
                                  type="button"
                                  disabled={!!loadingId}
                                  onClick={() => onMarkRead?.({ requestId: id, fromUid })}
                                  className="ml-auto inline-flex items-center justify-center rounded-md px-2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                                >
                                  Okundu yap
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
