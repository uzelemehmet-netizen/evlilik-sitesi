import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '../../utils/authFetch';
import { uploadImageToCloudinaryAuto } from '../../utils/cloudinaryUpload';

function getBaseLang(language) {
  const base = String(language || 'tr').toLowerCase().split('-')[0];
  return base === 'en' || base === 'id' ? base : 'tr';
}

const UI = {
  tr: {
    title: 'Aracılık Eşleşmeleri',
    subtitle: 'Adminin yönettiği aracılık eşleşmeleri, bitiş nedenleri ve formu olmayan kişiler burada tutulur.',
    refresh: 'Yenile',
    loading: 'Yükleniyor…',
    empty: 'Kayıt yok.',
    filters: { all: 'Tümü', active: 'Aktif', ended: 'Bitenler' },
    searchPlaceholder: 'İsim, WhatsApp, UC, username veya not ara',
    createLeadTitle: 'WhatsApp’tan gelen yeni kişi ekle',
    createLeadBody: 'Formu olmayan kişiyi lead olarak ekleyip sonra eşleşmeye dahil edebilirsiniz.',
    createMatchTitle: 'Yeni aracılık eşleşmesi oluştur',
    createMatchBody: 'Yeni eşleşme yalnızca Aracılık Havuzu içindeki kişiler seçilerek başlatılır. A ve B tarafını aşağıdaki listelerden seçin.',
    editMatchTitle: 'Eşleşmeyi düzenle',
    endMatchTitle: 'Eşleşmeyi bitir',
    labels: {
      fullName: 'İsim soyisim',
      gender: 'Cinsiyet',
      age: 'Yaş',
      city: 'Şehir',
      country: 'Ülke',
      whatsapp: 'WhatsApp',
      occupation: 'Meslek',
      maritalStatus: 'Medeni durum',
      note: 'Not',
      photos: 'Fotoğraf URL listesi',
      identifier: 'Kimlik',
      matchedAt: 'Eşleşme tarihi',
      endedAt: 'Bitiş tarihi',
      endReason: 'Bitiş sebebi',
      endNote: 'Bitiş notu',
    },
    sourceType: { user: 'Kullanıcı', lead: 'Lead / harici kişi' },
    gender: { female: 'Kadın', male: 'Erkek' },
    status: { active: 'Aktif', ended: 'Bitti' },
    buttons: {
      saveLead: 'Kişiyi ekle',
      createMatch: 'Eşleşmeyi oluştur',
      saveMatch: 'Değişiklikleri kaydet',
      endMatch: 'Eşleşmeyi bitir',
      uploadPhotos: 'Fotoğraf yükle',
      removePhoto: 'Kaldır',
    },
    hints: {
      photos: 'Her satıra bir fotoğraf URL’si yapıştırın veya doğrudan dosya yükleyin.',
      userIdentifier: 'UID, UC kodu, username veya kayıtlı WhatsApp',
      leadIdentifier: 'Lead id, tam isim veya kayıtlı WhatsApp',
    },
    candidatePicker: {
      title: 'Aracılık aday listeleri',
      body: 'Form dolduranları ve WhatsApp üzerinden eklenen kişileri ayrı listede görüp A veya B tarafına tek tıkla seçebilirsiniz.',
      userTitle: 'Normal kullanıcılar',
      formTitle: 'Form dolduranlar',
      manualTitle: 'WhatsApp eklenenler',
      userTag: 'Kullanıcı',
      formTag: 'Form',
      manualTag: 'WhatsApp',
      pickA: 'A olarak seç',
      pickB: 'B olarak seç',
      empty: 'Gösterilecek kayıt yok.',
      activeBadge: 'Aktif eşleşmesi var',
    },
    detail: {
      meta: 'Eşleşme Bilgisi',
      people: 'Kişiler',
      createdBy: 'Oluşturan',
      matchedAt: 'Eşleşti',
      endedAt: 'Bitti',
      endReason: 'Sebep',
      note: 'Not',
      none: 'Yok',
    },
    reasonOptions: {
      uyumsuzluk: 'Uyumsuzluk',
      cevap_yok: 'Cevap yok',
      aile_istemedi: 'Aile istemedi',
      iletisim_koptu: 'İletişim koptu',
      baska_biriyle_ilerledi: 'Başka biriyle ilerledi',
      admin_sonlandirdi: 'Admin sonlandırdı',
      evlilik_surecine_girdi: 'Evlilik sürecine girdi',
      diger: 'Diğer',
    },
    toast: {
      leadCreated: 'Harici kişi eklendi.',
      matchCreated: 'Aracılık eşleşmesi oluşturuldu.',
      matchUpdated: 'Eşleşme güncellendi.',
      matchEnded: 'Eşleşme kapatıldı.',
      loadFailed: 'Kayıtlar yüklenemedi.',
      actionFailed: 'İşlem tamamlanamadı.',
      photoUploaded: 'Fotoğraf yüklendi.',
      photoUploadFailed: 'Fotoğraf yüklenemedi.',
    },
  },
  en: {
    title: 'Mediation Matches',
    subtitle: 'Admin-managed mediation matches, ending reasons, and external people without forms are tracked here.',
    refresh: 'Refresh',
    loading: 'Loading…',
    empty: 'No records.',
    filters: { all: 'All', active: 'Active', ended: 'Ended' },
    searchPlaceholder: 'Search by name, WhatsApp, UC, username, or note',
    createLeadTitle: 'Add a new WhatsApp contact',
    createLeadBody: 'Create a no-form external person as a lead and then include them in a mediation match.',
    createMatchTitle: 'Create a new mediation match',
    createMatchBody: 'New matches are started only by selecting people from the mediation pool below. Pick side A and side B from the lists.',
    editMatchTitle: 'Edit match',
    endMatchTitle: 'End match',
    labels: {
      fullName: 'Full name',
      gender: 'Gender',
      age: 'Age',
      city: 'City',
      country: 'Country',
      whatsapp: 'WhatsApp',
      occupation: 'Occupation',
      maritalStatus: 'Marital status',
      note: 'Note',
      photos: 'Photo URL list',
      identifier: 'Identifier',
      matchedAt: 'Matched at',
      endedAt: 'Ended at',
      endReason: 'End reason',
      endNote: 'End note',
    },
    sourceType: { user: 'User', lead: 'Lead / external person' },
    gender: { female: 'Female', male: 'Male' },
    status: { active: 'Active', ended: 'Ended' },
    buttons: {
      saveLead: 'Add person',
      createMatch: 'Create match',
      saveMatch: 'Save changes',
      endMatch: 'End match',
      uploadPhotos: 'Upload photos',
      removePhoto: 'Remove',
    },
    hints: {
      photos: 'Paste one photo URL per line or upload directly.',
      userIdentifier: 'UID, UC code, username, or stored WhatsApp',
      leadIdentifier: 'Lead id, full name, or stored WhatsApp',
    },
    candidatePicker: {
      title: 'Mediation candidate lists',
      body: 'See form leads and WhatsApp-added people separately, then assign either one to side A or B with one click.',
      userTitle: 'Users',
      formTitle: 'Form leads',
      manualTitle: 'WhatsApp added',
      userTag: 'User',
      formTag: 'Form',
      manualTag: 'WhatsApp',
      pickA: 'Pick for A',
      pickB: 'Pick for B',
      empty: 'No records to show.',
      activeBadge: 'Has active match',
    },
    detail: {
      meta: 'Match Meta',
      people: 'People',
      createdBy: 'Created by',
      matchedAt: 'Matched',
      endedAt: 'Ended',
      endReason: 'Reason',
      note: 'Note',
      none: 'None',
    },
    reasonOptions: {
      uyumsuzluk: 'Not compatible',
      cevap_yok: 'No response',
      aile_istemedi: 'Family declined',
      iletisim_koptu: 'Communication stopped',
      baska_biriyle_ilerledi: 'Moved on with someone else',
      admin_sonlandirdi: 'Closed by admin',
      evlilik_surecine_girdi: 'Moved into marriage process',
      diger: 'Other',
    },
    toast: {
      leadCreated: 'External person added.',
      matchCreated: 'Mediation match created.',
      matchUpdated: 'Match updated.',
      matchEnded: 'Match closed.',
      loadFailed: 'Could not load records.',
      actionFailed: 'Action failed.',
      photoUploaded: 'Photo uploaded.',
      photoUploadFailed: 'Photo upload failed.',
    },
  },
  id: {
    title: 'Kecocokan Mediasi',
    subtitle: 'Kecocokan mediasi yang dikelola admin, alasan berakhir, dan orang luar tanpa form disimpan di sini.',
    refresh: 'Segarkan',
    loading: 'Memuat…',
    empty: 'Tidak ada data.',
    filters: { all: 'Semua', active: 'Aktif', ended: 'Selesai' },
    searchPlaceholder: 'Cari nama, WhatsApp, UC, username, atau catatan',
    createLeadTitle: 'Tambah kontak baru dari WhatsApp',
    createLeadBody: 'Tambahkan orang luar tanpa form sebagai lead lalu sertakan ke kecocokan mediasi.',
    createMatchTitle: 'Buat kecocokan mediasi baru',
    createMatchBody: 'Kecocokan baru dimulai hanya dengan memilih orang dari pool mediasi di bawah. Pilih sisi A dan sisi B dari daftar.',
    editMatchTitle: 'Edit kecocokan',
    endMatchTitle: 'Akhiri kecocokan',
    labels: {
      fullName: 'Nama lengkap',
      gender: 'Gender',
      age: 'Usia',
      city: 'Kota',
      country: 'Negara',
      whatsapp: 'WhatsApp',
      occupation: 'Pekerjaan',
      maritalStatus: 'Status pernikahan',
      note: 'Catatan',
      photos: 'Daftar URL foto',
      identifier: 'Identitas',
      matchedAt: 'Tanggal cocok',
      endedAt: 'Tanggal selesai',
      endReason: 'Alasan selesai',
      endNote: 'Catatan selesai',
    },
    sourceType: { user: 'Pengguna', lead: 'Lead / orang luar' },
    gender: { female: 'Perempuan', male: 'Laki-laki' },
    status: { active: 'Aktif', ended: 'Selesai' },
    buttons: {
      saveLead: 'Tambah orang',
      createMatch: 'Buat kecocokan',
      saveMatch: 'Simpan perubahan',
      endMatch: 'Akhiri kecocokan',
      uploadPhotos: 'Unggah foto',
      removePhoto: 'Hapus',
    },
    hints: {
      photos: 'Tempel satu URL foto per baris atau unggah langsung.',
      userIdentifier: 'UID, kode UC, username, atau WhatsApp tersimpan',
      leadIdentifier: 'Lead id, nama lengkap, atau WhatsApp tersimpan',
    },
    candidatePicker: {
      title: 'Daftar kandidat mediasi',
      body: 'Lihat terpisah lead dari form dan orang yang ditambahkan lewat WhatsApp, lalu pilih ke sisi A atau B dengan satu klik.',
      userTitle: 'Pengguna normal',
      formTitle: 'Dari form',
      manualTitle: 'Dari WhatsApp',
      userTag: 'Pengguna',
      formTag: 'Form',
      manualTag: 'WhatsApp',
      pickA: 'Pilih untuk A',
      pickB: 'Pilih untuk B',
      empty: 'Tidak ada data untuk ditampilkan.',
      activeBadge: 'Punya match aktif',
    },
    detail: {
      meta: 'Info Kecocokan',
      people: 'Orang',
      createdBy: 'Dibuat oleh',
      matchedAt: 'Dicocokkan',
      endedAt: 'Selesai',
      endReason: 'Alasan',
      note: 'Catatan',
      none: 'Tidak ada',
    },
    reasonOptions: {
      uyumsuzluk: 'Tidak cocok',
      cevap_yok: 'Tidak ada jawaban',
      aile_istemedi: 'Keluarga menolak',
      iletisim_koptu: 'Komunikasi terputus',
      baska_biriyle_ilerledi: 'Lanjut dengan orang lain',
      admin_sonlandirdi: 'Ditutup admin',
      evlilik_surecine_girdi: 'Masuk proses pernikahan',
      diger: 'Lainnya',
    },
    toast: {
      leadCreated: 'Orang luar ditambahkan.',
      matchCreated: 'Kecocokan mediasi dibuat.',
      matchUpdated: 'Kecocokan diperbarui.',
      matchEnded: 'Kecocokan ditutup.',
      loadFailed: 'Data gagal dimuat.',
      actionFailed: 'Aksi gagal.',
      photoUploaded: 'Foto berhasil diunggah.',
      photoUploadFailed: 'Foto gagal diunggah.',
    },
  },
};

function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function canonicalParticipantIdentifier(participant) {
  return safeStr(participant?.refId) || safeStr(participant?.userCode) || safeStr(participant?.username) || safeStr(participant?.whatsapp);
}

function fmtDateTime(value, lang) {
  try {
    if (!value || typeof value !== 'number') return '-';
    return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : lang === 'id' ? 'id-ID' : 'en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '-';
  }
}

function toDateTimeLocalValue(value) {
  if (!value || typeof value !== 'number') return '';
  const date = new Date(value);
  const pad = (item) => String(item).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parsePhotoLines(value) {
  return String(value || '')
    .split(/\r?\n/g)
    .map((item) => safeStr(item))
    .filter(Boolean)
    .slice(0, 5);
}

function personText(person) {
  const userCode = safeStr(person?.userCode);
  const username = safeStr(person?.username);
  const fullName = safeStr(person?.fullName);
  if (userCode && username) return `${userCode} @${username}`;
  if (userCode) return userCode;
  if (username) return `@${username}`;
  if (fullName) return fullName;
  return safeStr(person?.refId) || '-';
}

function personSubText(person) {
  const parts = [safeStr(person?.fullName), safeStr(person?.city), safeStr(person?.whatsapp)].filter(Boolean);
  return parts.join(' · ');
}

function leadGenderText(value, ui) {
  const normalized = safeStr(value);
  if (normalized === 'female') return ui.gender.female;
  if (normalized === 'male') return ui.gender.male;
  return '-';
}

function useParticipantSuggestions(sourceType, query) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const normalized = safeStr(query);
    if (normalized.length < 2) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let alive = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await authFetch('/api/admin-mediation-participant-search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sourceType, query: normalized, limit: 8 }),
        });
        if (!alive) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch {
        if (!alive) return;
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 220);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query, sourceType]);

  return { items, loading };
}

function PersonCard({ title, person, ui }) {
  const photoUrls = Array.isArray(person?.photoUrls) ? person.photoUrls.filter(Boolean) : [];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
          <div className="mt-1 text-sm font-bold text-slate-900">{personText(person)}</div>
          <div className="mt-1 text-xs text-slate-600">{personSubText(person) || ui.detail.none}</div>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">{safeStr(person?.sourceType) || '-'}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700">
        <div><span className="font-semibold">ID:</span> {safeStr(person?.refId) || '-'}</div>
        <div><span className="font-semibold">WhatsApp:</span> {safeStr(person?.whatsapp) || '-'}</div>
        <div><span className="font-semibold">Yaş:</span> {person?.age ?? '-'}</div>
        <div><span className="font-semibold">Şehir:</span> {safeStr(person?.city) || '-'}</div>
      </div>

      {photoUrls.length ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photoUrls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <img src={url} alt={safeStr(person?.fullName) || 'photo'} className="h-24 w-full object-cover" />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SuggestionList({ items, loading, onSelect, ui }) {
  if (loading) {
    return <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500">{ui.loading}</div>;
  }

  if (!items.length) return null;

  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-sm">
      {items.map((item) => (
        <button
          key={`${item.sourceType}-${item.refId}`}
          type="button"
          onClick={() => onSelect(item)}
          className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
        >
          {item.photoUrl ? <img src={item.photoUrl} alt={item.label || item.refId} className="h-9 w-9 rounded-lg object-cover" /> : <div className="h-9 w-9 rounded-lg bg-slate-100" />}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900">{item.label || item.refId}</div>
            <div className="truncate text-xs text-slate-500">{item.subLabel || item.lookupValue || item.refId}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function CandidateList({ title, tag, items, onPickA, onPickB, ui }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{tag}</div>
        </div>
        <div className="text-xs text-slate-500">{items.length}</div>
      </div>

      {!items.length ? <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">{ui.candidatePicker.empty}</div> : null}

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={`${item.sourceType}-${item.refId}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start gap-3">
              {item.photoUrl ? <img src={item.photoUrl} alt={item.fullName || item.refId} className="h-12 w-12 rounded-xl object-cover" /> : <div className="h-12 w-12 rounded-xl bg-slate-200" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900">{safeStr(item.fullName) || safeStr(item.label) || item.refId}</div>
                <div className="mt-1 text-xs text-slate-600">{[leadGenderText(item.gender, ui), safeStr(item.city), safeStr(item.whatsapp)].filter(Boolean).join(' · ') || '-'}</div>
                {item.activeMatch ? (
                  <div className="mt-2">
                    <div className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                      {ui.candidatePicker.activeBadge}
                    </div>
                    {item.activeMatchLabel ? <div className="mt-1 text-[11px] text-amber-800/90">{item.activeMatchLabel}</div> : null}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => onPickA(item)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100">
                {ui.candidatePicker.pickA}
              </button>
              <button type="button" onClick={() => onPickB(item)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100">
                {ui.candidatePicker.pickB}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MediationMatchesTab() {
  const { i18n } = useTranslation();
  const lang = getBaseLang(i18n?.language);
  const ui = UI[lang] || UI.tr;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filterKey, setFilterKey] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [savingLead, setSavingLead] = useState(false);
  const [savingMatch, setSavingMatch] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [endingMatch, setEndingMatch] = useState(false);
  const [uploadingLeadPhotos, setUploadingLeadPhotos] = useState(false);
  const [candidateListsLoading, setCandidateListsLoading] = useState(false);
  const [formLeadCandidates, setFormLeadCandidates] = useState([]);
  const [manualLeadCandidates, setManualLeadCandidates] = useState([]);
  const leadPhotoInputRef = useRef(null);

  const [leadForm, setLeadForm] = useState({
    fullName: '',
    gender: 'female',
    age: '',
    city: '',
    country: '',
    whatsapp: '',
    occupation: '',
    maritalStatus: '',
    note: '',
    photoLines: '',
  });
  const [matchForm, setMatchForm] = useState({
    aSourceType: 'lead',
    aIdentifier: '',
    bSourceType: 'lead',
    bIdentifier: '',
    matchedAt: '',
    note: '',
  });
  const [editForm, setEditForm] = useState({
    aSourceType: 'user',
    aIdentifier: '',
    bSourceType: 'lead',
    bIdentifier: '',
    matchedAt: '',
    note: '',
    endedAt: '',
    endReasonCode: 'diger',
    endReasonNote: '',
  });
  const [endForm, setEndForm] = useState({ endedAt: '', endReasonCode: 'diger', endReasonNote: '' });

  const leadPhotoUrls = useMemo(() => parsePhotoLines(leadForm.photoLines), [leadForm.photoLines]);
  const editASuggestions = useParticipantSuggestions(editForm.aSourceType, editForm.aIdentifier);
  const editBSuggestions = useParticipantSuggestions(editForm.bSourceType, editForm.bIdentifier);
  const allLeadCandidates = useMemo(() => [...formLeadCandidates, ...manualLeadCandidates], [formLeadCandidates, manualLeadCandidates]);
  const selectedCreateA = useMemo(
    () => allLeadCandidates.find((item) => safeStr(item?.refId) === safeStr(matchForm.aIdentifier)) || null,
    [allLeadCandidates, matchForm.aIdentifier]
  );
  const selectedCreateB = useMemo(
    () => allLeadCandidates.find((item) => safeStr(item?.refId) === safeStr(matchForm.bIdentifier)) || null,
    [allLeadCandidates, matchForm.bIdentifier]
  );

  const loadLeadCandidates = async () => {
    setCandidateListsLoading(true);
    try {
      const data = await authFetch('/api/admin-mediation-candidates-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ leadLimit: 24 }),
      });

      setFormLeadCandidates(Array.isArray(data?.formLeads) ? data.formLeads : []);
      setManualLeadCandidates(Array.isArray(data?.manualLeads) ? data.manualLeads : []);
    } catch {
      setFormLeadCandidates([]);
      setManualLeadCandidates([]);
    } finally {
      setCandidateListsLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch('/api/admin-mediation-matches-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ limit: 200 }),
      });
      const nextItems = Array.isArray(data?.items) ? data.items : [];
      setItems(nextItems);
      setSelectedId((prev) => prev || nextItems[0]?.id || '');
    } catch (err) {
      setError(String(err?.message || ui.toast.loadFailed));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadLeadCandidates();
  }, []);

  const refreshAll = async () => {
    await Promise.all([load(), loadLeadCandidates()]);
  };

  const filteredItems = useMemo(() => {
    const needle = safeStr(query).toLowerCase();
    return items.filter((item) => {
      if (filterKey === 'active' && safeStr(item?.status) !== 'active') return false;
      if (filterKey === 'ended' && safeStr(item?.status) !== 'ended') return false;
      if (!needle) return true;
      const hay = [
        safeStr(item?.note),
        safeStr(item?.endReasonCode),
        safeStr(item?.endReasonNote),
        personText(item?.participants?.a),
        personText(item?.participants?.b),
        safeStr(item?.participants?.a?.whatsapp),
        safeStr(item?.participants?.b?.whatsapp),
        safeStr(item?.participants?.a?.fullName),
        safeStr(item?.participants?.b?.fullName),
      ].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [filterKey, items, query]);

  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedId) || items.find((item) => item.id === selectedId) || filteredItems[0] || null,
    [filteredItems, items, selectedId]
  );

  useEffect(() => {
    if (!selectedItem) return;
    const a = selectedItem.participants?.a || {};
    const b = selectedItem.participants?.b || {};
    setEditForm({
      aSourceType: safeStr(a.sourceType) || 'user',
      aIdentifier: canonicalParticipantIdentifier(a),
      bSourceType: safeStr(b.sourceType) || 'lead',
      bIdentifier: canonicalParticipantIdentifier(b),
      matchedAt: toDateTimeLocalValue(selectedItem.matchedAtMs),
      note: safeStr(selectedItem.note),
      endedAt: toDateTimeLocalValue(selectedItem.endedAtMs),
      endReasonCode: safeStr(selectedItem.endReasonCode) || 'diger',
      endReasonNote: safeStr(selectedItem.endReasonNote),
    });
  }, [selectedItem]);

  const onLeadChange = (key) => (event) => setLeadForm((prev) => ({ ...prev, [key]: event.target.value }));
  const onMatchChange = (key) => (event) => setMatchForm((prev) => ({ ...prev, [key]: event.target.value }));
  const onEditChange = (key) => (event) => setEditForm((prev) => ({ ...prev, [key]: event.target.value }));
  const onEndChange = (key) => (event) => setEndForm((prev) => ({ ...prev, [key]: event.target.value }));

  const removeLeadPhoto = (index) => {
    const next = leadPhotoUrls.filter((_, itemIndex) => itemIndex !== index);
    setLeadForm((prev) => ({ ...prev, photoLines: next.join('\n') }));
  };

  const uploadLeadPhotos = async (event) => {
    const files = Array.from(event?.target?.files || []);
    if (!files.length) return;
    setUploadingLeadPhotos(true);
    setError('');
    setMessage('');
    try {
      const uploaded = [];
      for (const file of files.slice(0, Math.max(0, 5 - leadPhotoUrls.length))) {
        const result = await uploadImageToCloudinaryAuto(file, {
          folder: 'uniqah/matchmakingLeads',
          tags: ['lead', 'admin_manual_mediation'],
          source: 'admin_panel',
        });
        if (result?.secureUrl) uploaded.push(result.secureUrl);
      }
      if (uploaded.length) {
        const merged = [...leadPhotoUrls, ...uploaded].slice(0, 5);
        setLeadForm((prev) => ({ ...prev, photoLines: merged.join('\n') }));
        setMessage(ui.toast.photoUploaded);
      }
    } catch (err) {
      setError(String(err?.message || ui.toast.photoUploadFailed));
    } finally {
      setUploadingLeadPhotos(false);
      try {
        if (leadPhotoInputRef.current) leadPhotoInputRef.current.value = '';
      } catch {
        // ignore
      }
    }
  };

  const applySuggestion = (target, item) => {
    const nextValue = canonicalParticipantIdentifier(item);
    if (!nextValue) return;
    if (target === 'createA') setMatchForm((prev) => ({ ...prev, aIdentifier: nextValue }));
    if (target === 'createB') setMatchForm((prev) => ({ ...prev, bIdentifier: nextValue }));
    if (target === 'editA') setEditForm((prev) => ({ ...prev, aIdentifier: nextValue }));
    if (target === 'editB') setEditForm((prev) => ({ ...prev, bIdentifier: nextValue }));
  };

  const pickLeadCandidate = (target, item) => {
    const leadId = safeStr(item?.refId);
    if (!leadId) return;
    if (target === 'a') {
      setMatchForm((prev) => ({ ...prev, aSourceType: 'lead', aIdentifier: leadId }));
      return;
    }
    setMatchForm((prev) => ({ ...prev, bSourceType: 'lead', bIdentifier: leadId }));
  };

  const createLead = async () => {
    if (savingLead) return;
    setSavingLead(true);
    setError('');
    setMessage('');
    try {
      const data = await authFetch('/api/admin-mediation-lead-create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...leadForm,
          photoUrls: parsePhotoLines(leadForm.photoLines),
        }),
      });
      const created = data?.item || null;
      setMessage(ui.toast.leadCreated);
      if (created?.refId) {
        setMatchForm((prev) => ({
          ...prev,
          bSourceType: 'lead',
          bIdentifier: prev.bIdentifier || created.refId,
        }));
      }
      await loadLeadCandidates();
      setLeadForm({
        fullName: '',
        gender: 'female',
        age: '',
        city: '',
        country: '',
        whatsapp: '',
        occupation: '',
        maritalStatus: '',
        note: '',
        photoLines: '',
      });
    } catch (err) {
      setError(String(err?.message || ui.toast.actionFailed));
    } finally {
      setSavingLead(false);
    }
  };

  const createMatch = async () => {
    if (savingMatch) return;
    if (!safeStr(matchForm.aIdentifier) || !safeStr(matchForm.bIdentifier)) {
      setError('Eslesme baslatmak icin Aracilik Havuzu listesinden iki kisi secin.');
      setMessage('');
      return;
    }
    setSavingMatch(true);
    setError('');
    setMessage('');
    try {
      const data = await authFetch('/api/admin-mediation-match-create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(matchForm),
      });
      const created = data?.item || null;
      setMessage(ui.toast.matchCreated);
      setMatchForm((prev) => ({ ...prev, aSourceType: 'lead', bSourceType: 'lead', aIdentifier: '', bIdentifier: '', matchedAt: '', note: '' }));
      await refreshAll();
      if (created?.id) setSelectedId(created.id);
    } catch (err) {
      setError(String(err?.message || ui.toast.actionFailed));
    } finally {
      setSavingMatch(false);
    }
  };

  const updateSelectedMatch = async () => {
    if (savingEdit || !selectedItem?.id) return;
    setSavingEdit(true);
    setError('');
    setMessage('');
    try {
      await authFetch('/api/admin-mediation-match-update', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: selectedItem.id, ...editForm }),
      });
      setMessage(ui.toast.matchUpdated);
      await refreshAll();
    } catch (err) {
      setError(String(err?.message || ui.toast.actionFailed));
    } finally {
      setSavingEdit(false);
    }
  };

  const endSelectedMatch = async () => {
    if (endingMatch || !selectedItem?.id) return;
    setEndingMatch(true);
    setError('');
    setMessage('');
    try {
      await authFetch('/api/admin-mediation-match-end', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId: selectedItem.id, ...endForm }),
      });
      setMessage(ui.toast.matchEnded);
      setEndForm({ endedAt: '', endReasonCode: 'diger', endReasonNote: '' });
      await refreshAll();
    } catch (err) {
      setError(String(err?.message || ui.toast.actionFailed));
    } finally {
      setEndingMatch(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{ui.title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">{ui.subtitle}</p>
          </div>
          <button type="button" onClick={refreshAll} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            {ui.refresh}
          </button>
        </div>
        {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</div> : null}
        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">{ui.createLeadTitle}</h3>
            <p className="mt-1 text-sm text-slate-600">{ui.createLeadBody}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input value={leadForm.fullName} onChange={onLeadChange('fullName')} placeholder={ui.labels.fullName} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <select value={leadForm.gender} onChange={onLeadChange('gender')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                <option value="female">{ui.gender.female}</option>
                <option value="male">{ui.gender.male}</option>
              </select>
              <input value={leadForm.age} onChange={onLeadChange('age')} placeholder={ui.labels.age} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <input value={leadForm.city} onChange={onLeadChange('city')} placeholder={ui.labels.city} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <input value={leadForm.country} onChange={onLeadChange('country')} placeholder={ui.labels.country} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <input value={leadForm.whatsapp} onChange={onLeadChange('whatsapp')} placeholder={ui.labels.whatsapp} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <input value={leadForm.occupation} onChange={onLeadChange('occupation')} placeholder={ui.labels.occupation} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <input value={leadForm.maritalStatus} onChange={onLeadChange('maritalStatus')} placeholder={ui.labels.maritalStatus} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            </div>

            <textarea value={leadForm.photoLines} onChange={onLeadChange('photoLines')} placeholder={ui.labels.photos} className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <div className="mt-1 text-xs text-slate-500">{ui.hints.photos}</div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input ref={leadPhotoInputRef} id="admin-mediation-lead-photo-input" type="file" accept="image/*" multiple onChange={uploadLeadPhotos} className="hidden" />
              <button type="button" disabled={uploadingLeadPhotos || leadPhotoUrls.length >= 5} onClick={() => leadPhotoInputRef.current?.click()} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60">
                {uploadingLeadPhotos ? ui.loading : ui.buttons.uploadPhotos}
              </button>
              <div className="text-xs text-slate-500">{leadPhotoUrls.length} / 5</div>
            </div>

            {leadPhotoUrls.length ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {leadPhotoUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img src={url} alt={`lead-${index + 1}`} className="h-24 w-full object-cover" />
                    <button type="button" onClick={() => removeLeadPhoto(index)} className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm">
                      {ui.buttons.removePhoto}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <textarea value={leadForm.note} onChange={onLeadChange('note')} placeholder={ui.labels.note} className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <button type="button" disabled={savingLead} onClick={createLead} className="mt-4 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60">
              {ui.buttons.saveLead}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">{ui.createMatchTitle}</h3>
            <p className="mt-1 text-sm text-slate-600">{ui.createMatchBody}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-500">Secilen A</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{selectedCreateA ? personText(selectedCreateA) : '-'}</div>
                <div className="mt-1 text-xs text-slate-600">{selectedCreateA ? personSubText(selectedCreateA) || '-' : 'Aracilik Havuzu listesinden secin.'}</div>
                {selectedCreateA ? (
                  <button type="button" onClick={() => setMatchForm((prev) => ({ ...prev, aIdentifier: '' }))} className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100">
                    Temizle
                  </button>
                ) : null}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-500">Secilen B</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{selectedCreateB ? personText(selectedCreateB) : '-'}</div>
                <div className="mt-1 text-xs text-slate-600">{selectedCreateB ? personSubText(selectedCreateB) || '-' : 'Aracilik Havuzu listesinden secin.'}</div>
                {selectedCreateB ? (
                  <button type="button" onClick={() => setMatchForm((prev) => ({ ...prev, bIdentifier: '' }))} className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100">
                    Temizle
                  </button>
                ) : null}
              </div>

              <input type="datetime-local" value={matchForm.matchedAt} onChange={onMatchChange('matchedAt')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
              <textarea value={matchForm.note} onChange={onMatchChange('note')} placeholder={ui.labels.note} className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button type="button" disabled={savingMatch} onClick={createMatch} className="mt-4 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
              {ui.buttons.createMatch}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">{ui.candidatePicker.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{ui.candidatePicker.body}</p>
            {candidateListsLoading ? <div className="mt-4 text-sm text-slate-500">{ui.loading}</div> : null}
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <CandidateList title={ui.candidatePicker.formTitle} tag={ui.candidatePicker.formTag} items={formLeadCandidates} onPickA={(item) => pickLeadCandidate('a', item)} onPickB={(item) => pickLeadCandidate('b', item)} ui={ui} />
              <CandidateList title={ui.candidatePicker.manualTitle} tag={ui.candidatePicker.manualTag} items={manualLeadCandidates} onPickA={(item) => pickLeadCandidate('a', item)} onPickB={(item) => pickLeadCandidate('b', item)} ui={ui} />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-2 overflow-x-auto">
                {Object.entries(ui.filters).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilterKey(key)}
                    className={
                      `rounded-full px-3 py-1.5 text-sm font-semibold ` +
                      (filterKey === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ui.searchPlaceholder} className="w-full max-w-md rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            </div>

            {loading ? <div className="mt-4 text-sm text-slate-500">{ui.loading}</div> : null}
            {!loading && !filteredItems.length ? <div className="mt-4 text-sm text-slate-500">{ui.empty}</div> : null}

            <div className="mt-4 space-y-2">
              {filteredItems.map((item) => {
                const active = item.id === selectedItem?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={
                      `w-full rounded-2xl border px-4 py-3 text-left transition ` +
                      (active ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50')
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{personText(item.participants?.a)} ↔ {personText(item.participants?.b)}</div>
                        <div className="mt-1 text-xs text-slate-600">{fmtDateTime(item.matchedAtMs, lang)}{item.status === 'ended' && item.endedAtMs ? ` · ${fmtDateTime(item.endedAtMs, lang)}` : ''}</div>
                        <div className="mt-1 text-xs text-slate-500">{safeStr(item.note) || safeStr(item.endReasonNote) || '-'}</div>
                      </div>
                      <div className={item.status === 'ended' ? 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700' : 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800'}>
                        {item.status === 'ended' ? ui.status.ended : ui.status.active}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedItem ? (
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{ui.detail.meta}</h3>
                <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                  <div><span className="font-semibold">{ui.detail.createdBy}:</span> {safeStr(selectedItem.createdByEmail) || '-'}</div>
                  <div><span className="font-semibold">{ui.detail.matchedAt}:</span> {fmtDateTime(selectedItem.matchedAtMs, lang)}</div>
                  <div><span className="font-semibold">{ui.detail.endedAt}:</span> {selectedItem.endedAtMs ? fmtDateTime(selectedItem.endedAtMs, lang) : ui.detail.none}</div>
                  <div><span className="font-semibold">{ui.detail.endReason}:</span> {ui.reasonOptions[safeStr(selectedItem.endReasonCode)] || ui.detail.none}</div>
                  <div className="md:col-span-2"><span className="font-semibold">{ui.detail.note}:</span> {safeStr(selectedItem.note) || safeStr(selectedItem.endReasonNote) || ui.detail.none}</div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-bold text-slate-900">{ui.detail.people}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <PersonCard title="A" person={selectedItem.participants?.a || {}} ui={ui} />
                  <PersonCard title="B" person={selectedItem.participants?.b || {}} ui={ui} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-lg font-bold text-slate-900">{ui.editMatchTitle}</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <select value={editForm.aSourceType} onChange={onEditChange('aSourceType')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                    <option value="user">A: {ui.sourceType.user}</option>
                    <option value="lead">A: {ui.sourceType.lead}</option>
                  </select>
                  <div>
                    <input value={editForm.aIdentifier} onChange={onEditChange('aIdentifier')} placeholder={ui.labels.identifier} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                    <SuggestionList items={editASuggestions.items} loading={editASuggestions.loading} onSelect={(item) => applySuggestion('editA', item)} ui={ui} />
                  </div>

                  <select value={editForm.bSourceType} onChange={onEditChange('bSourceType')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                    <option value="user">B: {ui.sourceType.user}</option>
                    <option value="lead">B: {ui.sourceType.lead}</option>
                  </select>
                  <div>
                    <input value={editForm.bIdentifier} onChange={onEditChange('bIdentifier')} placeholder={ui.labels.identifier} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                    <SuggestionList items={editBSuggestions.items} loading={editBSuggestions.loading} onSelect={(item) => applySuggestion('editB', item)} ui={ui} />
                  </div>

                  <input type="datetime-local" value={editForm.matchedAt} onChange={onEditChange('matchedAt')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                  <textarea value={editForm.note} onChange={onEditChange('note')} placeholder={ui.labels.note} className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm" />

                  {selectedItem.status === 'ended' ? (
                    <>
                      <input type="datetime-local" value={editForm.endedAt} onChange={onEditChange('endedAt')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                      <select value={editForm.endReasonCode} onChange={onEditChange('endReasonCode')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                        {Object.entries(ui.reasonOptions).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      <textarea value={editForm.endReasonNote} onChange={onEditChange('endReasonNote')} placeholder={ui.labels.endNote} className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
                    </>
                  ) : null}
                </div>

                <button type="button" disabled={savingEdit} onClick={updateSelectedMatch} className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                  {ui.buttons.saveMatch}
                </button>
              </div>

              {selectedItem.status !== 'ended' ? (
                <div className="rounded-2xl border border-rose-200 bg-white p-4">
                  <h3 className="text-lg font-bold text-slate-900">{ui.endMatchTitle}</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input type="datetime-local" value={endForm.endedAt} onChange={onEndChange('endedAt')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
                    <select value={endForm.endReasonCode} onChange={onEndChange('endReasonCode')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                      {Object.entries(ui.reasonOptions).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <textarea value={endForm.endReasonNote} onChange={onEndChange('endReasonNote')} placeholder={ui.labels.endNote} className="min-h-24 rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
                  </div>
                  <button type="button" disabled={endingMatch} onClick={endSelectedMatch} className="mt-4 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60">
                    {ui.buttons.endMatch}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
