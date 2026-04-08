import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocalizedProfileText } from '../../utils/profileText';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function genderLabel(t, raw) {
  const s = safeStr(raw).toLowerCase();
  if (!s) return '';
  if (s === 'female' || s === 'f' || s === 'kadin' || s === 'kadın') return t('matchmakingPage.form.options.gender.female');
  if (s === 'male' || s === 'm' || s === 'erkek') return t('matchmakingPage.form.options.gender.male');
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
  actionsDisabled,
  onRequireProfile,
  loadingId,
  error,
}) {
  const { t, i18n } = useTranslation();
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-6 overflow-y-auto">
      <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 shrink-0">
          <p className="font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="app-btn app-btn-soft h-9"
          >
            {t('studio.common.close')}
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {error ? <p className="mb-3 text-rose-700">{error}</p> : null}

          {visible.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
              {mode === 'messages' ? t('studio.inboxModal.emptyMessages') : t('studio.inboxModal.emptyRequests')}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {visible.map((it) => {
                const fromUid = safeStr(it?.fromUid);
                const id = safeStr(it?.requestId) || safeStr(it?.id);
                const type = safeStr(it?.type);
                const isPreMatch = type === 'pre_match';
                const isPeopleList = type === 'people_list';
                const p = it?.fromProfile && typeof it.fromProfile === 'object' ? it.fromProfile : {};

                const name = safeStr(p?.username) || t('studio.common.profile');
                const age = typeof p?.age === 'number' ? `, ${p.age}` : '';
                const gender = genderLabel(t, p?.gender);
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
                const yes = t('apply.form.options.common.yes');
                const no = t('apply.form.options.common.no');
                const hasChildren =
                  typeof p?.hasChildren === 'boolean' ? (p.hasChildren ? yes : no) : pickLabelValue(p?.hasChildren);
                const wantChildren =
                  typeof p?.wantChildren === 'boolean' ? (p.wantChildren ? yes : no) : pickLabelValue(p?.wantChildren);
                const about = getLocalizedProfileText(p, 'about', i18n.language) || pickLabelValue(p?.about);

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
                              {t('studio.inboxModal.new')}
                            </span>
                          ) : null}
                        </div>

                        {msg ? (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-800">
                            {msg}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-slate-700">
                            {safeStr(it?.type) === 'people_list'
                              ? t('studio.inboxModal.requestText.peopleList')
                              : safeStr(it?.type) === 'pre_match'
                              ? t('studio.inboxModal.requestText.preMatch')
                              : safeStr(it?.type) === 'photo_access'
                                ? t('studio.inboxModal.requestText.photoAccess')
                                : t('studio.inboxModal.requestText.profileAccess')}
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
                                {isUnread ? t('studio.inboxModal.markRead') : t('studio.inboxModal.read')}
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                <button
                                  type="button"
                                  disabled={!!loadingId || !id}
                                  onClick={() => setExpandedId(expanded ? '' : id)}
                                  className={`app-btn app-btn-soft w-full ${isPeopleList ? 'col-span-2 sm:col-span-3' : 'col-span-2 sm:col-span-1'}`}
                                >
                                  {expanded ? t('studio.inboxModal.hideProfile') : t('studio.inboxModal.reviewProfile')}
                                </button>

                                {isPeopleList ? null : actionsDisabled ? (
                                  <button
                                    type="button"
                                    disabled={!!loadingId}
                                    onClick={() => onRequireProfile?.()}
                                    className="app-btn app-btn-primary col-span-2 w-full sm:col-span-2"
                                  >
                                    {t('studio.profileGate.cta')}
                                  </button>
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
                                      className="app-btn app-btn-primary w-full"
                                    >
                                      {isPreMatch ? t('studio.inboxModal.approve') : t('studio.inboxModal.allow')}
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
                                      {t('studio.inbox.reject')}
                                    </button>
                                  </>
                                )}

                                {msg && isUnread ? (
                                  <button
                                    type="button"
                                    disabled={!!loadingId}
                                    onClick={() => onMarkRead?.({ requestId: id, fromUid })}
                                    className="app-btn app-btn-soft col-span-2 w-full h-9 text-xs sm:col-span-3"
                                  >
                                    {t('studio.inboxModal.markRead')}
                                  </button>
                                ) : null}
                              </div>

                              {actionsDisabled ? (
                                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                                  {t('studio.profileGate.body')}
                                </div>
                              ) : null}

                              {isPeopleList ? (
                                <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
                                  {t('studio.matches.people.savedLabel')}
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>

                        {mode !== 'messages' && expanded ? (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                              {gender ? <p><span className="text-slate-500">{t('myInfo.fields.gender')}:</span> {gender}</p> : null}
                              {city ? <p><span className="text-slate-500">{t('myInfo.fields.city')}:</span> {city}</p> : null}
                              {maritalStatus ? <p><span className="text-slate-500">{t('myInfo.fields.maritalStatus')}:</span> {maritalStatus}</p> : null}
                              {education ? <p><span className="text-slate-500">{t('myInfo.fields.education')}:</span> {education}</p> : null}
                              {occupation ? <p><span className="text-slate-500">{t('myInfo.fields.occupation')}:</span> {occupation}</p> : null}
                              {hasChildren ? <p><span className="text-slate-500">{t('myInfo.fields.hasChildren')}:</span> {hasChildren}</p> : null}
                              {wantChildren ? <p><span className="text-slate-500">{t('studio.inboxModal.wantChildren')}:</span> {wantChildren}</p> : null}
                            </div>
                            {about ? <p className="mt-2"><span className="text-slate-500">{t('myInfo.fields.about')}:</span> {about}</p> : null}
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
                {t('studio.common.close')}
              </button>
            </div>

            <div className="overflow-hidden rounded-xl bg-black">
              <img
                src={lightbox.urls[lightbox.index]}
                alt={lightbox.title || t('studio.inboxModal.photoAlt')}
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
                  {t('studio.inboxModal.prev')}
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
                  {t('studio.inboxModal.next')}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
