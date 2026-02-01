import { useEffect, useMemo, useState } from 'react';

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

function normalizePhotoUrls(p) {
  const arr = Array.isArray(p?.photoUrls) ? p.photoUrls : [];
  const clean = arr.map((u) => safeStr(u)).filter(Boolean);
  const primary = safeStr(p?.photoUrl);
  if (primary && !clean.includes(primary)) clean.unshift(primary);
  return clean;
}

function pickLabelValue(v) {
  const s = safeStr(v);
  return s ? s : null;
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
  const [lightbox, setLightbox] = useState({ open: false, urls: [], index: 0, title: '' });
  const [expandedId, setExpandedId] = useState('');

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

  useEffect(() => {
    if (!open) {
      setLightbox({ open: false, urls: [], index: 0, title: '' });
      setExpandedId('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <p className="font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="app-btn app-btn-soft h-9"
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
                const photoUrls = normalizePhotoUrls(p);
                const photoUrl = safeStr(photoUrls[0] || '');

                const msg = clip(mode === 'messages' ? (it?.text || it?.messageText) : it?.messageText, 600);
                const readMsRaw = mode === 'messages' ? it?.readAtMs : it?.messageReadAtMs;
                const readMs = typeof readMsRaw === 'number' && Number.isFinite(readMsRaw) ? readMsRaw : 0;
                const isUnread = !!msg && readMs <= 0;

                const expanded = !!id && expandedId === id;

                const maritalStatus = pickLabelValue(p?.maritalStatus);
                const education = pickLabelValue(p?.education);
                const occupation = pickLabelValue(p?.occupation);
                const hasChildren =
                  typeof p?.hasChildren === 'boolean' ? (p.hasChildren ? 'Evet' : 'Hayır') : pickLabelValue(p?.hasChildren);
                const wantChildren =
                  typeof p?.wantChildren === 'boolean' ? (p.wantChildren ? 'Evet' : 'Hayır') : pickLabelValue(p?.wantChildren);
                const about = pickLabelValue(p?.about);

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
                              : safeStr(it?.type) === 'photo_access'
                                ? 'Fotoğraflarını görmek için izin istiyor.'
                                : 'Profilini görmek için izin istiyor.'}
                          </p>
                        )}

                        {mode !== 'messages' && photoUrls.length ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {photoUrls.slice(0, 6).map((u, idx) => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => setLightbox({ open: true, urls: photoUrls, index: idx, title: name })}
                                className="group relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                              >
                                <img src={u} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                              </button>
                            ))}
                          </div>
                        ) : null}

                        <div className={mode === 'messages' ? "mt-3" : "mt-3"}>
                          {mode === 'messages' ? (
                            <>
                              <button
                                type="button"
                                disabled={!!loadingId || !id}
                                onClick={() => onMarkRead?.({ messageId: id })}
                                className="app-btn app-btn-soft w-full sm:w-auto"
                              >
                                {isUnread ? 'Okundu yap' : 'Okundu'}
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                <button
                                  type="button"
                                  disabled={!!loadingId || !id}
                                  onClick={() => setExpandedId(expanded ? '' : id)}
                                  className="app-btn app-btn-soft col-span-2 w-full sm:col-span-1"
                                >
                                  {expanded ? 'Profili gizle' : 'Profili incele'}
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
                                    onApprove?.({ fromUid, type });
                                  }}
                                  className="app-btn app-btn-primary w-full"
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
                                  className="app-btn app-btn-danger w-full"
                                >
                                  Reddet
                                </button>

                                {msg && isUnread ? (
                                  <button
                                    type="button"
                                    disabled={!!loadingId}
                                    onClick={() => onMarkRead?.({ requestId: id, fromUid })}
                                    className="app-btn app-btn-soft col-span-2 w-full h-9 text-xs sm:col-span-3"
                                  >
                                    Okundu yap
                                  </button>
                                ) : null}
                              </div>
                            </>
                          )}
                        </div>

                        {mode !== 'messages' && expanded ? (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                              {gender ? <p><span className="text-slate-500">Cinsiyet:</span> {gender}</p> : null}
                              {city ? <p><span className="text-slate-500">Şehir:</span> {city}</p> : null}
                              {maritalStatus ? <p><span className="text-slate-500">Medeni durum:</span> {maritalStatus}</p> : null}
                              {education ? <p><span className="text-slate-500">Eğitim:</span> {education}</p> : null}
                              {occupation ? <p><span className="text-slate-500">Meslek:</span> {occupation}</p> : null}
                              {hasChildren ? <p><span className="text-slate-500">Çocuk:</span> {hasChildren}</p> : null}
                              {wantChildren ? <p><span className="text-slate-500">Çocuk isteği:</span> {wantChildren}</p> : null}
                            </div>
                            {about ? <p className="mt-2"><span className="text-slate-500">Hakkında:</span> {about}</p> : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {lightbox.open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox({ open: false, urls: [], index: 0, title: '' })}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-white">{lightbox.title || ''}</p>
              <button
                type="button"
                className="app-btn app-btn-soft h-9 bg-white/10 text-white ring-white/20 hover:bg-white/20"
                onClick={() => setLightbox({ open: false, urls: [], index: 0, title: '' })}
              >
                Kapat
              </button>
            </div>

            <div className="overflow-hidden rounded-xl bg-black">
              <img
                src={lightbox.urls[lightbox.index]}
                alt={lightbox.title || 'Fotoğraf'}
                className="max-h-[75vh] w-full object-contain"
              />
            </div>

            {lightbox.urls.length > 1 ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="app-btn app-btn-soft h-9 bg-white/10 text-white ring-white/20 hover:bg-white/20"
                  onClick={() =>
                    setLightbox((s) => ({
                      ...s,
                      index: (s.index - 1 + s.urls.length) % s.urls.length,
                    }))
                  }
                >
                  Önceki
                </button>
                <p className="text-sm text-white/80">
                  {lightbox.index + 1} / {lightbox.urls.length}
                </p>
                <button
                  type="button"
                  className="app-btn app-btn-soft h-9 bg-white/10 text-white ring-white/20 hover:bg-white/20"
                  onClick={() =>
                    setLightbox((s) => ({
                      ...s,
                      index: (s.index + 1) % s.urls.length,
                    }))
                  }
                >
                  Sonraki
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
