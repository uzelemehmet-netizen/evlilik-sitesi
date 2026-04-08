import React, { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, getDoc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../config/firebaseDb';
import { getDraftFieldLabel, getDraftProgressInfo } from '../../utils/adminDraftProgress';
import {
  dedupeAdminNewUsers,
  getAdminNewUserKind,
  getCreatedAtMs,
  hasKnownAccountIdentity,
  pickAccountDisplayName,
  pickAccountEmail,
  resolveAdminNewUserGender,
  resolveAdminNewUserUid,
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

function maritalStatusLabel(value) {
  const s = safeStr(value).toLowerCase();
  if (s === 'single') return 'Bekar';
  if (s === 'widowed') return 'Dul';
  if (s === 'divorced') return 'Boşanmış';
  if (s === 'married') return 'Evli';
  return s || '-';
}

function yesNoLabel(value) {
  if (value === true) return 'Evet';
  if (value === false) return 'Hayır';
  const s = safeStr(value).toLowerCase();
  if (s === 'yes') return 'Evet';
  if (s === 'no') return 'Hayır';
  return s || '-';
}

function draftUpdatedAtLabel(ms) {
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

function formatRequiredFieldValue(application, key) {
  const app = application && typeof application === 'object' ? application : {};
  const details = app?.details && typeof app.details === 'object' ? app.details : {};

  if (key === 'photo') return getDraftProgressInfo(app)?.photoComplete ? 'Var' : '-';
  if (key === 'username') return safeStr(app?.username) || '-';
  if (key === 'fullName') return safeStr(app?.fullName) || '-';
  if (key === 'age') return typeof app?.age === 'number' && Number.isFinite(app.age) ? String(app.age) : '-';
  if (key === 'city') return safeStr(app?.city) || '-';
  if (key === 'nationality') return safeStr(app?.nationality || app?.country) || '-';
  if (key === 'gender') return genderLabel(normalizeGender(app?.gender));
  if (key === 'whatsapp') return safeStr(app?.whatsapp) || '-';
  if (key === 'occupation') return safeStr(details?.occupation) || '-';
  if (key === 'maritalStatus') return maritalStatusLabel(details?.maritalStatus);
  if (key === 'hasChildren') return yesNoLabel(details?.hasChildren);
  if (key === 'childrenCount') {
    return typeof details?.childrenCount === 'number' && Number.isFinite(details.childrenCount)
      ? String(details.childrenCount)
      : '-';
  }
  if (key === 'childrenLivingSituation') return safeStr(details?.childrenLivingSituation) || '-';
  if (key === 'consent18Plus') return yesNoLabel(app?.consent18Plus);
  if (key === 'consentPrivacy') return yesNoLabel(app?.consentPrivacy);
  if (key === 'consentTerms') return yesNoLabel(app?.consentTerms);

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

  if (getAdminNewUserKind(app, userDoc) === 'unknown' && !hasKnownAccountIdentity(app, userDoc)) return 'Bilinmeyen kullanıcı';

  return '-';
}

function pillClass(kind) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border';
  if (kind === 'unknown') return `${base} border-rose-200 bg-rose-50 text-rose-900`;
  if (kind === 'partial') return `${base} border-amber-200 bg-amber-50 text-amber-900`;
  if (kind === 'filled') return `${base} border-emerald-200 bg-emerald-50 text-emerald-900`;
  return `${base} border-slate-200 bg-slate-50 text-slate-700`;
}

function DraftFieldsModal({ open, item, userDoc, onClose }) {
  if (!open || !item) return null;

  const draftInfo = getDraftProgressInfo(item);
  const label = displayLabel(item, userDoc);
  const completedKeys = draftInfo?.completedRequiredKeys || [];
  const missingKeys = draftInfo?.missingRequiredKeys || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Zorunlu Alan İncelemesi</h3>
            <p className="mt-1 text-sm text-slate-600">{label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!draftInfo ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Bu kullanıcı için kaydedilmiş taslak ilerleme bilgisi bulunamadı.
            </div>
          ) : (
            <>
              <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-indigo-950">
                  <div><span className="text-indigo-700">İlerleme:</span> {draftInfo.totalRequiredCount > 0 ? `${draftInfo.completedRequiredCount}/${draftInfo.totalRequiredCount}` : '-'}</div>
                  <div><span className="text-indigo-700">Takıldığı alan:</span> {draftInfo.firstMissingRequiredLabel}</div>
                  <div><span className="text-indigo-700">Son dokunduğu alan:</span> {draftInfo.lastInputKey ? draftInfo.lastInputLabel : '-'}</div>
                  <div><span className="text-indigo-700">Son taslak kaydı:</span> {draftUpdatedAtLabel(draftInfo.draftUpdatedAtMs)}</div>
                </div>
              </section>

              <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="text-sm font-bold text-emerald-950">Doldurulan zorunlu alanlar</h4>
                {completedKeys.length === 0 ? (
                  <p className="mt-2 text-sm text-emerald-900">Henüz kaydedilmiş zorunlu alan yok.</p>
                ) : (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {completedKeys.map((key) => (
                      <div key={key} className="rounded-lg border border-emerald-200 bg-white p-3 text-sm">
                        <div className="font-semibold text-emerald-950">{getDraftFieldLabel(key)}</div>
                        <div className="mt-1 text-emerald-900 break-words">{formatRequiredFieldValue(item, key)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h4 className="text-sm font-bold text-amber-950">Boş bırakılan zorunlu alanlar</h4>
                {missingKeys.length === 0 ? (
                  <p className="mt-2 text-sm text-amber-900">Eksik zorunlu alan görünmüyor.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {missingKeys.map((key) => (
                      <span key={key} className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-900">
                        {getDraftFieldLabel(key)}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewUsers48hTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [subTab, setSubTab] = useState('incomplete');
  const [userInfoByUid, setUserInfoByUid] = useState({});
  const [userLoadingByUid, setUserLoadingByUid] = useState({});
  const [activeItem, setActiveItem] = useState(null);

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
        const uid = resolveAdminNewUserUid(it);
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
    const incomplete = [];
    const filled = [];

    for (const it of list) {
      const uid = resolveAdminNewUserUid(it);
      const userDoc = uid ? userInfoByUid[uid] : null;
      const kind = getAdminNewUserKind(it, userDoc);
      if (kind === 'filled') filled.push(it);
      else incomplete.push(it);
    }

    return { incomplete, filled, total: list.length };
  }, [normalizedItems, userInfoByUid]);

  const visible = subTab === 'filled' ? groups.filled : groups.incomplete;

  const openDraftModal = (item) => setActiveItem(item);
  const closeDraftModal = () => setActiveItem(null);

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
            onClick={() => setSubTab('incomplete')}
            className={
              `px-3 py-2 rounded-lg text-sm font-semibold border transition ` +
              (subTab === 'incomplete'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50')
            }
          >
            Eksik / On Kayit ({groups.incomplete.length})
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
            Formu Tamamlayanlar ({groups.filled.length})
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
                const uid = resolveAdminNewUserUid(it);
                const userDoc = uid ? userInfoByUid[uid] : null;
                const createdAtMs = getCreatedAtMs(it);
                const uc = safeStr(it?.userCode) || safeStr(userDoc?.userCode) || safeStr(userDoc?.publicProfile?.userCode);
                const label = displayLabel(it, userDoc);
                const age = typeof it?.age === 'number' && Number.isFinite(it.age) ? it.age : '';
                const gender = resolveAdminNewUserGender(it, userDoc);
                const kind = getAdminNewUserKind(it, userDoc);
                const canInspectDraft = kind === 'unknown';

                return (
                  <tr key={it?.id} className="border-t">
                    <td className="px-3 py-2">
                      <span className={pillClass(kind)}>{kind === 'filled' ? 'Form' : kind === 'partial' ? 'On Kayit' : kind === 'unknown' ? 'Bilinmeyen' : 'Eksik Form'}</span>
                    </td>
                    <td className="px-3 py-2 font-mono">{uc || '-'}</td>
                    <td className="px-3 py-2">
                      {canInspectDraft ? (
                        <button
                          type="button"
                          onClick={() => openDraftModal(it)}
                          className="text-left font-semibold text-rose-700 hover:text-rose-900 hover:underline"
                        >
                          {label}
                        </button>
                      ) : (
                        label
                      )}
                    </td>
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
          Not: Zorunlu kayıt alanları dolu olan kullanıcılar artık "On Kayit" olarak görünür; tam başvuru tamamlandığında otomatik olarak "Formu Tamamlayanlar" sekmesine geçer.
        </div>

        <DraftFieldsModal
          open={!!activeItem}
          item={activeItem}
          userDoc={activeItem ? userInfoByUid[resolveAdminNewUserUid(activeItem)] : null}
          onClose={closeDraftModal}
        />
      </div>
    </div>
  );
}
