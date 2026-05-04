import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDraftProgressInfo } from '../../utils/adminDraftProgress';
import { authFetch } from '../../utils/authFetch';
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

function getBaseLang(language) {
  const base = String(language || 'tr').toLowerCase().split('-')[0];
  return base === 'en' || base === 'id' ? base : 'tr';
}

const UI = {
  tr: {
    female: 'Kadın',
    male: 'Erkek',
    single: 'Bekar',
    widowed: 'Dul',
    divorced: 'Boşanmış',
    married: 'Evli',
    yes: 'Evet',
    no: 'Hayır',
    hasPhoto: 'Var',
    unknownUser: 'Bilinmeyen kullanıcı',
    draftReview: 'Zorunlu Alan İncelemesi',
    close: 'Kapat',
    noDraft: 'Bu kullanıcı için kaydedilmiş taslak ilerleme bilgisi bulunamadı.',
    progress: 'İlerleme:',
    blockedField: 'Takıldığı alan:',
    lastTouched: 'Son dokunduğu alan:',
    lastDraft: 'Son taslak kaydı:',
    completedFields: 'Doldurulan zorunlu alanlar',
    noCompletedFields: 'Henüz kaydedilmiş zorunlu alan yok.',
    missingFields: 'Boş bırakılan zorunlu alanlar',
    noMissingFields: 'Eksik zorunlu alan görünmüyor.',
    title: 'Yeni Kullanıcılar (Son 48 Saat)',
    total: 'Son 48 saatteki benzersiz kullanıcılar. Toplam:',
    incompleteTab: 'Eksik / Ön Kayıt',
    filledTab: 'Formu Tamamlayanlar',
    loadFailed: 'Yeni kullanıcılar yüklenemedi.',
    status: 'Durum',
    uc: 'UC',
    name: 'İsim',
    age: 'Yaş',
    gender: 'Cinsiyet',
    created: 'Kayıt',
    kindFilled: 'Form',
    kindPartial: 'Ön Kayıt',
    kindUnknown: 'Bilinmeyen',
    kindStub: 'Eksik Form',
    emptyGroup: 'Bu grupta kullanıcı yok.',
    footerNote: 'Not: Zorunlu kayıt alanları dolu olan kullanıcılar artık "Ön Kayıt" olarak görünür; tam başvuru tamamlandığında otomatik olarak "Formu Tamamlayanlar" sekmesine geçer.',
    fieldLabels: {
      photo: 'Fotoğraf',
      username: 'Kullanıcı adı',
      fullName: 'Ad soyad',
      age: 'Yaş',
      city: 'Şehir',
      nationality: 'Uyruk',
      gender: 'Cinsiyet',
      whatsapp: 'WhatsApp',
      occupation: 'Meslek',
      maritalStatus: 'Medeni durum',
      hasChildren: 'Çocuk durumu',
      childrenCount: 'Çocuk sayısı',
      childrenLivingSituation: 'Çocukların yaşam durumu',
      consent18Plus: '18+ onayı',
      consentPrivacy: 'Gizlilik onayı',
      consentTerms: 'Şartlar onayı',
    },
  },
  en: {
    female: 'Female',
    male: 'Male',
    single: 'Single',
    widowed: 'Widowed',
    divorced: 'Divorced',
    married: 'Married',
    yes: 'Yes',
    no: 'No',
    hasPhoto: 'Available',
    unknownUser: 'Unknown user',
    draftReview: 'Required Fields Review',
    close: 'Close',
    noDraft: 'No saved draft progress was found for this user.',
    progress: 'Progress:',
    blockedField: 'Blocked field:',
    lastTouched: 'Last touched field:',
    lastDraft: 'Last draft save:',
    completedFields: 'Completed required fields',
    noCompletedFields: 'No required fields have been saved yet.',
    missingFields: 'Missing required fields',
    noMissingFields: 'No missing required fields are visible.',
    title: 'New Users (Last 48 Hours)',
    total: 'Unique users in the last 48 hours. Total:',
    incompleteTab: 'Incomplete / Pre-registration',
    filledTab: 'Completed Forms',
    loadFailed: 'Failed to load new users.',
    status: 'Status',
    uc: 'UC',
    name: 'Name',
    age: 'Age',
    gender: 'Gender',
    created: 'Created',
    kindFilled: 'Form',
    kindPartial: 'Pre-registration',
    kindUnknown: 'Unknown',
    kindStub: 'Incomplete Form',
    emptyGroup: 'No users in this group.',
    footerNote: 'Note: Users whose required registration fields are filled now appear as "Pre-registration"; when the full application is completed they move automatically to the "Completed Forms" tab.',
    fieldLabels: {
      photo: 'Photo',
      username: 'Username',
      fullName: 'Full name',
      age: 'Age',
      city: 'City',
      nationality: 'Nationality',
      gender: 'Gender',
      whatsapp: 'WhatsApp',
      occupation: 'Occupation',
      maritalStatus: 'Marital status',
      hasChildren: 'Children status',
      childrenCount: 'Children count',
      childrenLivingSituation: 'Children living situation',
      consent18Plus: '18+ consent',
      consentPrivacy: 'Privacy consent',
      consentTerms: 'Terms consent',
    },
  },
  id: {
    female: 'Perempuan',
    male: 'Laki-laki',
    single: 'Lajang',
    widowed: 'Janda/Duda',
    divorced: 'Cerai',
    married: 'Menikah',
    yes: 'Ya',
    no: 'Tidak',
    hasPhoto: 'Ada',
    unknownUser: 'Pengguna tidak dikenal',
    draftReview: 'Tinjauan Field Wajib',
    close: 'Tutup',
    noDraft: 'Tidak ada progres draft tersimpan untuk pengguna ini.',
    progress: 'Progres:',
    blockedField: 'Field yang terhenti:',
    lastTouched: 'Field terakhir disentuh:',
    lastDraft: 'Simpan draft terakhir:',
    completedFields: 'Field wajib yang sudah diisi',
    noCompletedFields: 'Belum ada field wajib yang tersimpan.',
    missingFields: 'Field wajib yang masih kosong',
    noMissingFields: 'Tidak ada field wajib yang hilang.',
    title: 'Pengguna Baru (48 Jam Terakhir)',
    total: 'Pengguna unik dalam 48 jam terakhir. Total:',
    incompleteTab: 'Belum lengkap / Pra-pendaftaran',
    filledTab: 'Form Selesai',
    loadFailed: 'Gagal memuat pengguna baru.',
    status: 'Status',
    uc: 'UC',
    name: 'Nama',
    age: 'Usia',
    gender: 'Gender',
    created: 'Dibuat',
    kindFilled: 'Form',
    kindPartial: 'Pra-pendaftaran',
    kindUnknown: 'Tidak dikenal',
    kindStub: 'Form Belum Lengkap',
    emptyGroup: 'Tidak ada pengguna di grup ini.',
    footerNote: 'Catatan: Pengguna yang field pendaftaran wajibnya sudah terisi kini tampil sebagai "Pra-pendaftaran"; saat aplikasi penuh selesai, mereka otomatis pindah ke tab "Form Selesai".',
    fieldLabels: {
      photo: 'Foto',
      username: 'Username',
      fullName: 'Nama lengkap',
      age: 'Usia',
      city: 'Kota',
      nationality: 'Kewarganegaraan',
      gender: 'Gender',
      whatsapp: 'WhatsApp',
      occupation: 'Pekerjaan',
      maritalStatus: 'Status pernikahan',
      hasChildren: 'Status anak',
      childrenCount: 'Jumlah anak',
      childrenLivingSituation: 'Kondisi tinggal anak',
      consent18Plus: 'Persetujuan 18+',
      consentPrivacy: 'Persetujuan privasi',
      consentTerms: 'Persetujuan syarat',
    },
  },
};

function fmtDate(ms, lang) {
  try {
    if (!ms || typeof ms !== 'number') return '-';
    return new Intl.DateTimeFormat(lang, {
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

function genderLabel(g, ui) {
  if (g === 'female') return ui.female;
  if (g === 'male') return ui.male;
  return '-';
}

function maritalStatusLabel(value, ui) {
  const s = safeStr(value).toLowerCase();
  if (s === 'single') return ui.single;
  if (s === 'widowed') return ui.widowed;
  if (s === 'divorced') return ui.divorced;
  if (s === 'married') return ui.married;
  return s || '-';
}

function yesNoLabel(value, ui) {
  if (value === true) return ui.yes;
  if (value === false) return ui.no;
  const s = safeStr(value).toLowerCase();
  if (s === 'yes') return ui.yes;
  if (s === 'no') return ui.no;
  return s || '-';
}

function draftUpdatedAtLabel(ms, lang) {
  try {
    if (!ms || typeof ms !== 'number') return '-';
    return new Intl.DateTimeFormat(lang, {
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

function getDraftFieldLabel(key, ui) {
  const normalized = safeStr(key);
  return ui.fieldLabels?.[normalized] || normalized || '-';
}

function formatRequiredFieldValue(application, key, ui) {
  const app = application && typeof application === 'object' ? application : {};
  const details = app?.details && typeof app.details === 'object' ? app.details : {};

  if (key === 'photo') return getDraftProgressInfo(app)?.photoComplete ? ui.hasPhoto : '-';
  if (key === 'username') return safeStr(app?.username) || '-';
  if (key === 'fullName') return safeStr(app?.fullName) || '-';
  if (key === 'age') return typeof app?.age === 'number' && Number.isFinite(app.age) ? String(app.age) : '-';
  if (key === 'city') return safeStr(app?.city) || '-';
  if (key === 'nationality') return safeStr(app?.nationality || app?.country) || '-';
  if (key === 'gender') return genderLabel(normalizeGender(app?.gender), ui);
  if (key === 'whatsapp') return safeStr(app?.whatsapp) || '-';
  if (key === 'occupation') return safeStr(details?.occupation) || '-';
  if (key === 'maritalStatus') return maritalStatusLabel(details?.maritalStatus, ui);
  if (key === 'hasChildren') return yesNoLabel(details?.hasChildren, ui);
  if (key === 'childrenCount') {
    return typeof details?.childrenCount === 'number' && Number.isFinite(details.childrenCount)
      ? String(details.childrenCount)
      : '-';
  }
  if (key === 'childrenLivingSituation') return safeStr(details?.childrenLivingSituation) || '-';
  if (key === 'consent18Plus') return yesNoLabel(app?.consent18Plus, ui);
  if (key === 'consentPrivacy') return yesNoLabel(app?.consentPrivacy, ui);
  if (key === 'consentTerms') return yesNoLabel(app?.consentTerms, ui);

  return '-';
}


function displayLabel(app, userDoc = null, ui) {
  const username = safeStr(app?.username) || safeStr(userDoc?.username);
  if (username) return `@${username}`;

  const fullName = safeStr(app?.fullName) || safeStr(userDoc?.fullName) || safeStr(userDoc?.publicProfile?.fullName);
  if (fullName) return fullName;

  const displayName = pickAccountDisplayName(app, userDoc);
  if (displayName) return displayName;

  const accountEmail = pickAccountEmail(app, userDoc);
  if (accountEmail) return accountEmail;

  if (getAdminNewUserKind(app, userDoc) === 'unknown' && !hasKnownAccountIdentity(app, userDoc)) return ui.unknownUser;

  return '-';
}

function pillClass(kind) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border';
  if (kind === 'unknown') return `${base} border-rose-200 bg-rose-50 text-rose-900`;
  if (kind === 'partial') return `${base} border-amber-200 bg-amber-50 text-amber-900`;
  if (kind === 'filled') return `${base} border-emerald-200 bg-emerald-50 text-emerald-900`;
  return `${base} border-slate-200 bg-slate-50 text-slate-700`;
}

function DraftFieldsModal({ open, item, userDoc, onClose, ui, lang }) {
  if (!open || !item) return null;

  const draftInfo = getDraftProgressInfo(item);
  const label = displayLabel(item, userDoc, ui);
  const completedKeys = draftInfo?.completedRequiredKeys || [];
  const missingKeys = draftInfo?.missingRequiredKeys || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{ui.draftReview}</h3>
            <p className="mt-1 text-sm text-slate-600">{label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {ui.close}
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!draftInfo ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {ui.noDraft}
            </div>
          ) : (
            <>
              <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-indigo-950">
                  <div><span className="text-indigo-700">{ui.progress}</span> {draftInfo.totalRequiredCount > 0 ? `${draftInfo.completedRequiredCount}/${draftInfo.totalRequiredCount}` : '-'}</div>
                  <div><span className="text-indigo-700">{ui.blockedField}</span> {getDraftFieldLabel(draftInfo.firstMissingRequiredKey, ui)}</div>
                  <div><span className="text-indigo-700">{ui.lastTouched}</span> {draftInfo.lastInputKey ? getDraftFieldLabel(draftInfo.lastInputKey, ui) : '-'}</div>
                  <div><span className="text-indigo-700">{ui.lastDraft}</span> {draftUpdatedAtLabel(draftInfo.draftUpdatedAtMs, lang)}</div>
                </div>
              </section>

              <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <h4 className="text-sm font-bold text-emerald-950">{ui.completedFields}</h4>
                {completedKeys.length === 0 ? (
                  <p className="mt-2 text-sm text-emerald-900">{ui.noCompletedFields}</p>
                ) : (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {completedKeys.map((key) => (
                      <div key={key} className="rounded-lg border border-emerald-200 bg-white p-3 text-sm">
                        <div className="font-semibold text-emerald-950">{getDraftFieldLabel(key, ui)}</div>
                        <div className="mt-1 text-emerald-900 break-words">{formatRequiredFieldValue(item, key, ui)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h4 className="text-sm font-bold text-amber-950">{ui.missingFields}</h4>
                {missingKeys.length === 0 ? (
                  <p className="mt-2 text-sm text-amber-900">{ui.noMissingFields}</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {missingKeys.map((key) => (
                      <span key={key} className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-900">
                        {getDraftFieldLabel(key, ui)}
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
  const { i18n } = useTranslation();
  const lang = getBaseLang(i18n?.language);
  const ui = UI[lang];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [subTab, setSubTab] = useState('incomplete');
  const [userInfoByUid, setUserInfoByUid] = useState({});
  const [activeItem, setActiveItem] = useState(null);

  const cutoffMs = useMemo(() => Date.now() - 48 * 60 * 60 * 1000, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await authFetch('/api/admin-new-users-list', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sinceMs: cutoffMs, limit: 500 }),
        });
        if (!cancelled) {
          setItems(Array.isArray(data?.items) ? data.items : []);
          setUserInfoByUid(data?.userInfoByUid && typeof data.userInfoByUid === 'object' ? data.userInfoByUid : {});
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setUserInfoByUid({});
          setError(String(e?.message || ui.loadFailed));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [cutoffMs, ui.loadFailed]);

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
          <h2 className="text-lg font-semibold text-gray-800">{ui.title}</h2>
          <p className="text-sm text-gray-600">
            {ui.total} <span className="font-semibold text-gray-900">{groups.total}</span>
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
            {ui.incompleteTab} ({groups.incomplete.length})
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
            {ui.filledTab} ({groups.filled.length})
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-4 border rounded-xl overflow-hidden">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="text-left px-3 py-2">{ui.status}</th>
                <th className="text-left px-3 py-2">{ui.uc}</th>
                <th className="text-left px-3 py-2">{ui.name}</th>
                <th className="text-left px-3 py-2">{ui.age}</th>
                <th className="text-left px-3 py-2">{ui.gender}</th>
                <th className="text-left px-3 py-2">{ui.created}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((it) => {
                const uid = resolveAdminNewUserUid(it);
                const userDoc = uid ? userInfoByUid[uid] : null;
                const createdAtMs = getCreatedAtMs(it);
                const uc = safeStr(it?.userCode) || safeStr(userDoc?.userCode) || safeStr(userDoc?.publicProfile?.userCode);
                const label = displayLabel(it, userDoc, ui);
                const age = typeof it?.age === 'number' && Number.isFinite(it.age) ? it.age : '';
                const gender = resolveAdminNewUserGender(it, userDoc);
                const kind = getAdminNewUserKind(it, userDoc);
                const canInspectDraft = kind === 'unknown';

                return (
                  <tr key={it?.id} className="border-t">
                    <td className="px-3 py-2">
                      <span className={pillClass(kind)}>{kind === 'filled' ? ui.kindFilled : kind === 'partial' ? ui.kindPartial : kind === 'unknown' ? ui.kindUnknown : ui.kindStub}</span>
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
                    <td className="px-3 py-2">{genderLabel(gender, ui)}</td>
                    <td className="px-3 py-2">{createdAtMs ? fmtDate(createdAtMs, lang) : '-'}</td>
                  </tr>
                );
              })}

              {!visible.length && !loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    {ui.emptyGroup}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-gray-50 text-xs text-gray-600">
          {ui.footerNote}
        </div>

        <DraftFieldsModal
          open={!!activeItem}
          item={activeItem}
          userDoc={activeItem ? userInfoByUid[resolveAdminNewUserUid(activeItem)] : null}
          onClose={closeDraftModal}
          ui={ui}
          lang={lang}
        />
      </div>
    </div>
  );
}
