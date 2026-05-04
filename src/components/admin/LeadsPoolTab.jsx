import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '../../utils/authFetch';

const MediationMatchesTab = lazy(() => import('./MediationMatchesTab'));

function getBaseLang(language) {
  const base = String(language || 'tr').toLowerCase().split('-')[0];
  return base === 'en' || base === 'id' ? base : 'tr';
}

const UI = {
  tr: {
    tabs: { leads: 'Aracılık Havuzu', mediationMatches: 'Aracılık Eşleşmeleri', formLeads: 'Form Dolduranlar', whatsappLeads: 'WhatsApp Eklenenler', female: 'Kadınlar', male: 'Erkekler' },
    status: { new: 'Yeni', contacted: 'İletişime geçildi', archived: 'Arşiv', rejected: 'Reddedildi' },
    title: 'Aracılık Havuzu',
    subtitle: {
      form: 'Aracılık sayfasına form doldurarak gelen başvurular. Sekmeye göre cinsiyet filtresi uygulanır.',
      manual: 'WhatsApp üzerinden admin tarafından eklenen kişiler. Sekmeye göre cinsiyet filtresi uygulanır.',
    },
    loading: 'Yükleniyor…',
    refresh: 'Yenile',
    lastUpdate: 'Son güncelleme:',
    notLoaded: 'Henüz yüklenmedi.',
    count: 'Adet:',
    name: 'İsim', age: 'Yaş', city: 'Şehir', whatsapp: 'WhatsApp', statusLabel: 'Durum', date: 'Tarih', detail: 'Detay',
    noRecord: 'Kayıt yok.',
    detailTitle: 'Başvuru Detayı',
    delete: 'Sil', close: 'Kapat',
    person: 'Kişi', partner: 'Aranan Kişi', admin: 'Admin',
    labels: {
      fullName: 'İsim', gender: 'Cinsiyet', age: 'Yaş', city: 'Şehir', whatsapp: 'WhatsApp', maritalStatus: 'Medeni durum', hasChildren: 'Çocuk durumu',
      childrenCount: 'Kaç çocuk', childrenAges: 'Çocuklar kaç yaşında', childrenLivingWith: 'Çocuklar kimle yaşıyor', liveWithChildrenAfterMarriage: 'Evlendikten sonra çocuklarıyla mı yaşayacak', livingWith: 'Kimle yaşıyor',
      occupation: 'İş durumu', profession: 'Meslek', income: 'Gelir', foreignLanguage: 'Yabancı dil', translationOk: 'Çeviri kabul', familyApproval: 'Aile onayı',
      plannedLivingCountry: 'Evlilikten sonra yaşamak istediği ülke', religion: 'Din', additionalInfoStatus: 'Ek bilgi var mı?', additionalInfoText: 'Ek bilgi', religiousPractices: 'Dini görevler', partnerSpouseWanted: 'Nasıl bir eş adayı arıyor?',
      partnerAge: 'Yaş', partnerHeight: 'Boy', partnerWeight: 'Kilo', religiousValues: 'Dinî değerler', contacted: 'İletişime geçildi', note: 'Not'
    },
    translateFailed: 'Çeviri başarısız.', piiBlocked: 'Hassas bilgi içerdiği için çeviri engellendi.', rateLimited: 'Çeviri isteği çok sık yapıldı. Lütfen biraz sonra tekrar deneyin.',
    translateNotConfigured: 'Çeviri servisi yapılandırılmamış.', notAuthenticated: 'Oturum açılmadı.', forbidden: 'Yetkisiz.',
    confirmDelete: 'Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
    alreadyDeleted: 'Kayıt zaten silinmişti; listeden kaldırıldı.', deleted: 'Silindi.', deleteFailed: 'Silinemedi.',
    poolLoadFailed: 'Havuz yüklenemedi.', saved: 'Kaydedildi.', saveFailed: 'Kaydetme başarısız.', saving: 'Kaydediliyor…', save: 'Kaydet',
    translate: 'Çevir', translating: 'Çevriliyor…', translation: 'Çeviri', openPhoto: 'Fotoğrafı yeni sekmede aç', download: 'İndir', open: 'Aç',
    yes: 'Evet', no: 'Hayır', unknownFamily: 'Henüz ailemle konuşmadım',
    female: 'Kadın', male: 'Erkek', single: 'Bekar', married: 'Evli', divorced: 'Boşanmış', widowed: 'Dul', any: 'Fark etmez',
    withChildren: 'Var', withoutChildren: 'Yok', low: 'Düşük', mid: 'Orta', high: 'Yüksek', civilServant: 'Memur', worker: 'İşçi', businessOwner: 'Kendi işinin sahibi', retired: 'Emekli', notWorking: 'Çalışmıyor',
    prayer5: '5 vakit namaz', fasting: 'Oruç', hajj: 'Hac', umrah: 'Umre', islam: 'İslam', christian: 'Hristiyan', hindu: 'Hindu', buddhist: 'Budist'
  },
  en: {
    tabs: { leads: 'Leads Pool', mediationMatches: 'Mediation Matches', formLeads: 'Form Leads', whatsappLeads: 'WhatsApp Added', female: 'Women', male: 'Men' },
    status: { new: 'New', contacted: 'Contacted', archived: 'Archived', rejected: 'Rejected' },
    title: 'Matchmaking Leads Pool',
    subtitle: {
      form: 'Applications submitted through the mediation page form. Gender filter follows the selected tab.',
      manual: 'People added manually from WhatsApp by admin. Gender filter follows the selected tab.',
    },
    loading: 'Loading…',
    refresh: 'Refresh',
    lastUpdate: 'Last update:',
    notLoaded: 'Not loaded yet.',
    count: 'Count:',
    name: 'Name', age: 'Age', city: 'City', whatsapp: 'WhatsApp', statusLabel: 'Status', date: 'Date', detail: 'Detail',
    noRecord: 'No records.',
    detailTitle: 'Application Detail',
    delete: 'Delete', close: 'Close',
    person: 'Person', partner: 'Desired Partner', admin: 'Admin',
    labels: {
      fullName: 'Name', gender: 'Gender', age: 'Age', city: 'City', whatsapp: 'WhatsApp', maritalStatus: 'Marital status', hasChildren: 'Children status',
      childrenCount: 'Children count', childrenAges: 'Children ages', childrenLivingWith: 'Who the children live with', liveWithChildrenAfterMarriage: 'Will live with children after marriage', livingWith: 'Lives with',
      occupation: 'Work status', profession: 'Profession', income: 'Income', foreignLanguage: 'Foreign language', translationOk: 'Translation accepted', familyApproval: 'Family approval',
      plannedLivingCountry: 'Preferred country after marriage', religion: 'Religion', additionalInfoStatus: 'Any additional info?', additionalInfoText: 'Additional info', religiousPractices: 'Religious practices', partnerSpouseWanted: 'What kind of spouse is sought?',
      partnerAge: 'Age', partnerHeight: 'Height', partnerWeight: 'Weight', religiousValues: 'Religious values', contacted: 'Contacted', note: 'Note'
    },
    translateFailed: 'Translation failed.', piiBlocked: 'Translation was blocked because it contains sensitive information.', rateLimited: 'Translation was requested too frequently. Please try again later.',
    translateNotConfigured: 'Translation service is not configured.', notAuthenticated: 'Not signed in.', forbidden: 'Unauthorized.',
    confirmDelete: 'Are you sure you want to delete this record? This action cannot be undone.',
    alreadyDeleted: 'The record had already been deleted; it was removed from the list.', deleted: 'Deleted.', deleteFailed: 'Delete failed.',
    poolLoadFailed: 'Failed to load the pool.', saved: 'Saved.', saveFailed: 'Save failed.', saving: 'Saving…', save: 'Save', translate: 'Translate', translating: 'Translating…', translation: 'Translation', openPhoto: 'Open photo in a new tab', download: 'Download', open: 'Open',
    yes: 'Yes', no: 'No', unknownFamily: 'I have not spoken with my family yet',
    female: 'Female', male: 'Male', single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed', any: 'Does not matter',
    withChildren: 'Has children', withoutChildren: 'No children', low: 'Low', mid: 'Medium', high: 'High', civilServant: 'Civil servant', worker: 'Worker', businessOwner: 'Business owner', retired: 'Retired', notWorking: 'Not working',
    prayer5: 'Five daily prayers', fasting: 'Fasting', hajj: 'Hajj', umrah: 'Umrah', islam: 'Islam', christian: 'Christian', hindu: 'Hindu', buddhist: 'Buddhist'
  },
  id: {
    tabs: { leads: 'Pool Lead', mediationMatches: 'Kecocokan Mediasi', formLeads: 'Dari Form', whatsappLeads: 'Dari WhatsApp', female: 'Perempuan', male: 'Laki-laki' },
    status: { new: 'Baru', contacted: 'Sudah dihubungi', archived: 'Arsip', rejected: 'Ditolak' },
    title: 'Pool Lead Matchmaking',
    subtitle: {
      form: 'Aplikasi yang dikirim lewat form halaman mediasi. Filter gender mengikuti tab yang dipilih.',
      manual: 'Orang yang ditambahkan admin dari WhatsApp. Filter gender mengikuti tab yang dipilih.',
    },
    loading: 'Memuat…',
    refresh: 'Segarkan',
    lastUpdate: 'Pembaruan terakhir:',
    notLoaded: 'Belum dimuat.',
    count: 'Jumlah:',
    name: 'Nama', age: 'Usia', city: 'Kota', whatsapp: 'WhatsApp', statusLabel: 'Status', date: 'Tanggal', detail: 'Detail',
    noRecord: 'Tidak ada data.',
    detailTitle: 'Detail Aplikasi',
    delete: 'Hapus', close: 'Tutup',
    person: 'Orang', partner: 'Pasangan yang Dicari', admin: 'Admin',
    labels: {
      fullName: 'Nama', gender: 'Gender', age: 'Usia', city: 'Kota', whatsapp: 'WhatsApp', maritalStatus: 'Status pernikahan', hasChildren: 'Status anak',
      childrenCount: 'Jumlah anak', childrenAges: 'Usia anak', childrenLivingWith: 'Anak tinggal dengan siapa', liveWithChildrenAfterMarriage: 'Akan tinggal dengan anak setelah menikah', livingWith: 'Tinggal dengan',
      occupation: 'Status kerja', profession: 'Profesi', income: 'Pendapatan', foreignLanguage: 'Bahasa asing', translationOk: 'Terima terjemahan', familyApproval: 'Persetujuan keluarga',
      plannedLivingCountry: 'Negara tempat tinggal setelah menikah', religion: 'Agama', additionalInfoStatus: 'Ada info tambahan?', additionalInfoText: 'Info tambahan', religiousPractices: 'Praktik agama', partnerSpouseWanted: 'Pasangan seperti apa yang dicari?',
      partnerAge: 'Usia', partnerHeight: 'Tinggi', partnerWeight: 'Berat', religiousValues: 'Nilai agama', contacted: 'Sudah dihubungi', note: 'Catatan'
    },
    translateFailed: 'Terjemahan gagal.', piiBlocked: 'Terjemahan diblokir karena mengandung informasi sensitif.', rateLimited: 'Permintaan terjemahan terlalu sering. Coba lagi nanti.',
    translateNotConfigured: 'Layanan terjemahan belum dikonfigurasi.', notAuthenticated: 'Belum login.', forbidden: 'Tidak berwenang.',
    confirmDelete: 'Yakin ingin menghapus data ini? Tindakan ini tidak bisa dibatalkan.',
    alreadyDeleted: 'Data sudah terhapus; telah dihapus dari daftar.', deleted: 'Dihapus.', deleteFailed: 'Gagal menghapus.',
    poolLoadFailed: 'Gagal memuat pool.', saved: 'Tersimpan.', saveFailed: 'Gagal menyimpan.', saving: 'Menyimpan…', save: 'Simpan', translate: 'Terjemahkan', translating: 'Menerjemahkan…', translation: 'Terjemahan', openPhoto: 'Buka foto di tab baru', download: 'Unduh', open: 'Buka',
    yes: 'Ya', no: 'Tidak', unknownFamily: 'Saya belum bicara dengan keluarga saya',
    female: 'Perempuan', male: 'Laki-laki', single: 'Lajang', married: 'Menikah', divorced: 'Cerai', widowed: 'Janda/Duda', any: 'Tidak masalah',
    withChildren: 'Punya anak', withoutChildren: 'Tidak punya anak', low: 'Rendah', mid: 'Sedang', high: 'Tinggi', civilServant: 'PNS', worker: 'Pekerja', businessOwner: 'Pemilik usaha', retired: 'Pensiun', notWorking: 'Tidak bekerja',
    prayer5: 'Salat 5 waktu', fasting: 'Puasa', hajj: 'Haji', umrah: 'Umrah', islam: 'Islam', christian: 'Kristen', hindu: 'Hindu', buddhist: 'Buddha'
  },
};

function fmtDateTime(ms, lang) {
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

function statusLabel(status, ui) {
  if (status === 'new') return badge(ui.status.new, 'indigo');
  if (status === 'contacted') return badge(ui.status.contacted, 'green');
  if (status === 'archived') return badge(ui.status.archived, 'slate');
  if (status === 'rejected') return badge(ui.status.rejected, 'rose');
  return badge(status || '-', 'slate');
}

function labelValue(label, value) {
  const v = value === null || value === undefined || value === '' ? '-' : String(value);
  return (
    <div className="text-xs text-slate-700">
      {label}: <span className="font-semibold">{v}</span>
    </div>
  );
}

function practicesLabel(arr, ui) {
  const a = Array.isArray(arr) ? arr : [];
  const map = {
    prayer_5: ui.prayer5,
    fasting: ui.fasting,
    hajj: ui.hajj,
    umrah: ui.umrah,
  };
  const out = a.map((x) => map[x] || x).filter(Boolean);
  return out.length ? out.join(', ') : '-';
}

function religionLabel(v, ui) {
  const s = String(v || '').trim().toLowerCase();
  const map = {
    islam: ui.islam,
    christian: ui.christian,
    hindu: ui.hindu,
    buddhist: ui.buddhist,
  };
  return map[s] || (s ? v : '-');
}

function maritalStatusLabel(v, ui) {
  const s = String(v || '').trim();
  const map = {
    single: ui.single,
    never_married: ui.single,
    married: ui.married,
    divorced: ui.divorced,
    widowed: ui.widowed,
    any: ui.any,
  };
  return map[s] || (s ? s : '-');
}

function genderLabel(v, ui) {
  const s = String(v || '').trim().toLowerCase();
  if (s === 'female') return ui.female;
  if (s === 'male') return ui.male;
  return s ? v : '-';
}

function yesNoLabel(v, ui) {
  if (v === true) return ui.yes;
  if (v === false) return ui.no;
  const s = String(v || '').trim().toLowerCase();
  if (s === 'unknown' || s === 'not_yet' || s === 'notyet' || s === 'pending') return ui.unknownFamily;
  if (s === 'yes' || s === 'true' || s === '1') return ui.yes;
  if (s === 'no' || s === 'false' || s === '0') return ui.no;
  return s ? v : '-';
}

function mergeUniqueStrings(...parts) {
  const out = [];
  const seen = new Set();
  for (const p of parts) {
    const arr = Array.isArray(p) ? p : [];
    for (const raw of arr) {
      const s = String(raw || '').trim();
      if (!s) continue;
      if (seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

function hasChildrenLabel(v, ui) {
  const s = String(v || '').trim();
  const map = {
    yes: ui.yes,
    no: ui.no,
    with_children: ui.withChildren,
    without_children: ui.withoutChildren,
    any: ui.any,
  };
  return map[s] || (s ? s : '-');
}

function incomeLabel(v, ui) {
  const s = String(v || '').trim();
  const map = {
    low: ui.low,
    mid: ui.mid,
    high: ui.high,
    any: ui.any,
  };
  return map[s] || (s ? s : '-');
}

function workStatusLabel(v, ui) {
  const s = String(v || '').trim();
  const map = {
    civil_servant: ui.civilServant,
    worker: ui.worker,
    business_owner: ui.businessOwner,
    retired: ui.retired,
    not_working: ui.notWorking,
    any: ui.any,
  };
  return map[s] || (s ? s : '-');
}

function isHasChildrenYes(v) {
  const s = String(v || '').trim();
  return s === 'yes' || s === 'with_children';
}

function boolLabel(v, ui) {
  if (v === true) return ui.yes;
  if (v === false) return ui.no;
  return '-';
}

function downloadUrl(url, filename = 'foto.jpg') {
  try {
    const a = document.createElement('a');
    a.href = String(url || '');
    a.download = filename;
    a.rel = 'noopener noreferrer';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    // ignore
  }
}

function photoListFromLead(lead) {
  const urls = Array.isArray(lead?.photoUrls) ? lead.photoUrls : [];
  const legacy = lead?.photoUrl ? [lead.photoUrl] : [];
  const all = (urls.length ? urls : legacy).map((x) => String(x || '').trim()).filter(Boolean);
  return all.slice(0, 5);
}

function normalizeGenderTab(v) {
  return v === 'male' ? 'male' : 'female';
}

export default function LeadsPoolTab() {
  const { i18n } = useTranslation();
  const lang = getBaseLang(i18n?.language);
  const ui = UI[lang];

  const sectionTabs = useMemo(
    () => [
      { id: 'leads', label: ui.tabs.leads },
      { id: 'mediationMatches', label: ui.tabs.mediationMatches },
    ],
    [ui.tabs.leads, ui.tabs.mediationMatches]
  );

  const tabs = useMemo(
    () => [
      { id: 'female', label: ui.tabs.female },
      { id: 'male', label: ui.tabs.male },
    ],
    [ui.tabs.female, ui.tabs.male]
  );

  const sourceTabs = useMemo(
    () => [
      { id: 'form', label: ui.tabs.formLeads },
      { id: 'manual', label: ui.tabs.whatsappLeads },
    ],
    [ui.tabs.formLeads, ui.tabs.whatsappLeads]
  );

  const [activeSection, setActiveSection] = useState('leads');
  const [activeSourceKind, setActiveSourceKind] = useState('form');
  const [activeGender, setActiveGender] = useState('female');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [items, setItems] = useState([]);
  const [lastLoadedAtMs, setLastLoadedAtMs] = useState(0);

  const [detail, setDetail] = useState({ open: false, item: null });
  const [patch, setPatch] = useState({ saving: false, error: '', success: '' });
  const [translateState, setTranslateState] = useState({ loadingKey: '', error: '', textByKey: {} });

  const friendlyTranslateError = (code) => {
    const c = String(code || '').trim();
    if (!c) return ui.translateFailed;
    if (c === 'pii_blocked') return ui.piiBlocked;
    if (c === 'translate_rate_limited') return ui.rateLimited;
    if (c === 'translate_not_configured') return ui.translateNotConfigured;
    if (c === 'not_authenticated') return ui.notAuthenticated;
    if (c === 'forbidden') return ui.forbidden;
    return c;
  };

  const translateText = async (key, text) => {
    const k = String(key || '').trim();
    const t = String(text || '').trim();
    if (!k || !t) return;
    if (translateState.loadingKey) return;

    setTranslateState((p) => ({ ...p, loadingKey: k, error: '' }));
    try {
      const payload = await authFetch(`/api/admin-translate-text?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: k, targetLang: lang, text: t }),
      });

      const out = String(payload?.text || '').trim();
      if (!out) throw new Error(String(payload?.error || 'translate_failed'));

      setTranslateState((p) => ({
        ...p,
        loadingKey: '',
        error: '',
        textByKey: { ...(p.textByKey || {}), [k]: out },
      }));
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setTranslateState((p) => ({ ...p, loadingKey: '', error: friendlyTranslateError(msg) }));
    }
  };

  const deleteLead = async (id) => {
    const leadId = String(id || '').trim();
    if (!leadId) return;
    const ok = window.confirm(ui.confirmDelete);
    if (!ok) return;

    setPatch({ saving: true, error: '', success: '' });
    try {
      const payload = await authFetch(`/api/admin-lead-delete?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: leadId }),
      });

      setItems((p) => (Array.isArray(p) ? p.filter((x) => x?.id !== leadId) : []));
      setDetail({ open: false, item: null });
      setPatch({
        saving: false,
        error: '',
        success: payload?.alreadyDeleted ? ui.alreadyDeleted : ui.deleted,
      });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setPatch({ saving: false, error: msg || ui.deleteFailed, success: '' });
    }
  };

  const reload = async (gender, sourceKind) => {
    const g = normalizeGenderTab(gender || activeGender);
    const nextSourceKind = sourceKind === 'manual' ? 'manual' : 'form';
    setLoading(true);
    setErr('');
    try {
      const payload = await authFetch(`/api/admin-leads-list?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gender: g, sourceKind: nextSourceKind, limit: 200 }),
      });
      setItems(Array.isArray(payload?.items) ? payload.items : []);
      setLastLoadedAtMs(Date.now());
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setErr(msg || ui.poolLoadFailed);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection !== 'leads') return;
    if (loading || lastLoadedAtMs) return;
    void reload(activeGender, activeSourceKind);
  }, [activeGender, activeSection, activeSourceKind, lastLoadedAtMs, loading]);

  const openDetail = (it) => {
    setDetail({ open: true, item: it });
    setPatch({ saving: false, error: '', success: '' });
    setTranslateState({ loadingKey: '', error: '', textByKey: {} });
  };

  const closeDetail = () => {
    setDetail({ open: false, item: null });
    setPatch({ saving: false, error: '', success: '' });
    setTranslateState({ loadingKey: '', error: '', textByKey: {} });
  };

  const updateDetailField = (key, value) => {
    setDetail((p) => ({
      ...p,
      item: p.item ? { ...p.item, [key]: value } : p.item,
    }));
  };

  const savePatch = async () => {
    if (!detail.item?.id || patch.saving) return;
    setPatch({ saving: true, error: '', success: '' });
    try {
      const payload = await authFetch(`/api/admin-leads-update?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: detail.item.id,
          status: detail.item.status,
          adminNotes: detail.item.adminNotes || '',
          contacted: !!detail.item.contacted,
        }),
      });

      if (!payload?.ok) throw new Error(String(payload?.error || 'update_failed'));

      setPatch({ saving: false, error: '', success: ui.saved });
      await reload(activeGender);
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setPatch({ saving: false, error: msg || ui.saveFailed, success: '' });
    }
  };

  const currentCount = items.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-2 sm:p-3">
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 px-2 pb-2">
          {sectionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSection(tab.id);
                setDetail({ open: false, item: null });
                setPatch({ saving: false, error: '', success: '' });
                setTranslateState({ loadingKey: '', error: '', textByKey: {} });
              }}
              className={
                `px-4 py-2 text-sm font-semibold transition whitespace-nowrap ` +
                (activeSection === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-800')
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSection === 'mediationMatches' ? (
        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              {ui.loading}
            </div>
          }
        >
          <MediationMatchesTab />
        </Suspense>
      ) : null}

      {activeSection === 'leads' ? (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{ui.title}</h2>
            <p className="mt-1 text-xs text-slate-600">{activeSourceKind === 'manual' ? ui.subtitle.manual : ui.subtitle.form}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => reload(activeGender, activeSourceKind)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              {loading ? ui.loading : ui.refresh}
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 border-b border-gray-200 overflow-x-auto">
          {sourceTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveSourceKind(t.id);
                setDetail({ open: false, item: null });
                reload(activeGender, t.id);
              }}
              className={
                `px-4 py-2 text-sm font-semibold transition whitespace-nowrap ` +
                (activeSourceKind === t.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-800')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveGender(t.id);
                reload(t.id, activeSourceKind);
              }}
              className={
                `px-4 py-2 text-sm font-semibold transition whitespace-nowrap ` +
                (activeGender === t.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-800')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-3 text-xs text-slate-600">
          {lastLoadedAtMs ? `${ui.lastUpdate} ${fmtDateTime(lastLoadedAtMs, lang)}` : ui.notLoaded} • {ui.count}{' '}
          <span className="font-semibold text-slate-900">{currentCount}</span>
        </div>

        {err ? <div className="mt-2 text-sm text-rose-700">{err}</div> : null}

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="text-[11px] text-slate-600">
              <tr>
                <th className="py-2 pr-3">{ui.name}</th>
                <th className="py-2 pr-3">{ui.age}</th>
                <th className="py-2 pr-3">{ui.city}</th>
                <th className="py-2 pr-3">{ui.whatsapp}</th>
                <th className="py-2 pr-3">{ui.statusLabel}</th>
                <th className="py-2 pr-3">{ui.date}</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it) => (
                <tr key={it.id} className="text-slate-800">
                  <td className="py-2 pr-3">
                    <div className="text-xs font-semibold text-slate-900">{it.lead?.fullName || '-'}</div>
                    <div className="text-[11px] text-slate-500">{it.id.slice(0, 10)}…</div>
                  </td>
                  <td className="py-2 pr-3">{typeof it.lead?.age === 'number' ? it.lead.age : '-'}</td>
                  <td className="py-2 pr-3">{it.lead?.city || '-'}</td>
                  <td className="py-2 pr-3">{it.lead?.whatsapp || '-'}</td>
                  <td className="py-2 pr-3">{statusLabel(it.status, ui)}</td>
                  <td className="py-2 pr-3">{fmtDateTime(it.createdAtMs, lang)}</td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => openDetail(it)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {ui.detail}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && !loading ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">{ui.noRecord}</div>
        ) : null}
      </div>
      ) : null}

      {activeSection === 'leads' && detail.open && detail.item ? (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900">{ui.detailTitle}</div>
                <div className="text-xs text-slate-600">{detail.item.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => deleteLead(detail.item.id)}
                  disabled={patch.saving}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  {ui.delete}
                </button>
                <button
                  onClick={closeDetail}
                  disabled={patch.saving}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {ui.close}
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {translateState.error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  {translateState.error}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs font-bold text-slate-900">{ui.person}</div>
                  <div className="mt-2 space-y-1">
                    {labelValue(ui.labels.fullName, detail.item.lead?.fullName)}
                    {labelValue(ui.labels.gender, genderLabel(detail.item.lead?.gender, ui))}
                    {labelValue(ui.labels.age, typeof detail.item.lead?.age === 'number' ? detail.item.lead.age : '-')}
                    {labelValue(ui.labels.city, detail.item.lead?.city)}
                    {labelValue(ui.labels.plannedLivingCountry, detail.item.lead?.plannedLivingCountry)}
                    {labelValue(ui.labels.whatsapp, detail.item.lead?.whatsapp)}
                    {labelValue(ui.labels.maritalStatus, maritalStatusLabel(detail.item.lead?.maritalStatus, ui))}
                    {labelValue(ui.labels.religion, religionLabel(detail.item.lead?.religion, ui))}
                    {labelValue(ui.labels.hasChildren, hasChildrenLabel(detail.item.lead?.hasChildren, ui))}
                    {isHasChildrenYes(detail.item.lead?.hasChildren) ? (
                      <>
                        {labelValue(ui.labels.childrenCount, detail.item.lead?.childrenCount)}
                        {labelValue(ui.labels.childrenAges, detail.item.lead?.childrenAges)}
                        {labelValue(ui.labels.childrenLivingWith, detail.item.lead?.childrenLivingWith)}
                        {labelValue(ui.labels.liveWithChildrenAfterMarriage, yesNoLabel(detail.item.lead?.liveWithChildrenAfterMarriage, ui))}
                      </>
                    ) : null}
                    {labelValue(ui.labels.livingWith, detail.item.lead?.livingWith)}
                    {labelValue(ui.labels.occupation, workStatusLabel(detail.item.lead?.occupation, ui))}
                    {labelValue(ui.labels.profession, detail.item.lead?.profession || '-')}
                    {labelValue(ui.labels.income, incomeLabel(detail.item.lead?.income, ui))}
                    {labelValue(ui.labels.foreignLanguage, detail.item.lead?.foreignLanguage)}
                    {labelValue(ui.labels.translationOk, boolLabel(detail.item.lead?.translationOk, ui))}
                    {labelValue(ui.labels.familyApproval, yesNoLabel(detail.item.lead?.familyApproval, ui))}
                    {labelValue(ui.labels.additionalInfoStatus, yesNoLabel(detail.item.lead?.additionalInfoStatus, ui))}
                    {detail.item.lead?.additionalInfoStatus === 'yes' ? (
                      <div className="text-xs text-slate-700">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            {ui.labels.additionalInfoText}: <span className="font-semibold">{String(detail.item.lead?.additionalInfoText || '').trim() || '-'}</span>
                          </div>
                          {String(detail.item.lead?.additionalInfoText || '').trim() ? (
                            <button
                              type="button"
                              onClick={() => translateText('lead.additionalInfoText', detail.item.lead?.additionalInfoText)}
                              disabled={!!translateState.loadingKey}
                              className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              {translateState.loadingKey === 'lead.additionalInfoText' ? ui.translating : ui.translate}
                            </button>
                          ) : null}
                        </div>
                        {translateState.textByKey?.['lead.additionalInfoText'] ? (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800">
                            <div className="text-[11px] font-semibold text-slate-600">{ui.translation} ({lang.toUpperCase()})</div>
                            <div className="mt-1 whitespace-pre-wrap">{translateState.textByKey['lead.additionalInfoText']}</div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {labelValue(
                      ui.labels.religiousPractices,
                      practicesLabel(
                        mergeUniqueStrings(detail.item.lead?.religiousPractices, detail.item.lead?.religiousValues),
                        ui
                      )
                    )}
                  </div>
                  {photoListFromLead(detail.item.lead).length ? (
                    <div className="mt-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {photoListFromLead(detail.item.lead).map((url, idx) => (
                          <div key={`${url}_${idx}`} className="rounded-lg border border-slate-200 p-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                              title={ui.openPhoto}
                            >
                              <img src={url} alt={`${ui.translation} ${idx + 1}`} className="w-full aspect-square object-cover rounded-md border" />
                            </a>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => downloadUrl(url, `${detail.item.id}_photo_${idx + 1}.jpg`)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {ui.download}
                              </button>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-center"
                              >
                                {ui.open}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs font-bold text-slate-900">{ui.partner}</div>
                  <div className="mt-2 space-y-1">
                    {labelValue(ui.labels.hasChildren, hasChildrenLabel(detail.item.partner?.hasChildren, ui))}
                    {labelValue(ui.labels.maritalStatus, maritalStatusLabel(detail.item.partner?.maritalStatus, ui))}
                    {labelValue(ui.labels.partnerAge, `${detail.item.partner?.ageMin ?? '-'} - ${detail.item.partner?.ageMax ?? '-'}`)}
                    {labelValue(ui.labels.partnerHeight, `${detail.item.partner?.heightMinCm ?? '-'} - ${detail.item.partner?.heightMaxCm ?? '-'}`)}
                    {labelValue(ui.labels.partnerWeight, `${detail.item.partner?.weightMinKg ?? '-'} - ${detail.item.partner?.weightMaxKg ?? '-'}`)}
                    {labelValue(ui.labels.occupation, workStatusLabel(detail.item.partner?.occupation, ui))}
                    <div className="text-xs text-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          {ui.labels.partnerSpouseWanted}:{' '}
                          <span className="font-semibold">{String(detail.item.partner?.spouseWanted || '').trim() || '-'}</span>
                        </div>
                        {String(detail.item.partner?.spouseWanted || '').trim() ? (
                          <button
                            type="button"
                            onClick={() => translateText('partner.spouseWanted', detail.item.partner?.spouseWanted)}
                            disabled={!!translateState.loadingKey}
                            className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            {translateState.loadingKey === 'partner.spouseWanted' ? ui.translating : ui.translate}
                          </button>
                        ) : null}
                      </div>
                      {translateState.textByKey?.['partner.spouseWanted'] ? (
                        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800">
                          <div className="text-[11px] font-semibold text-slate-600">{ui.translation} ({lang.toUpperCase()})</div>
                          <div className="mt-1 whitespace-pre-wrap">{translateState.textByKey['partner.spouseWanted']}</div>
                        </div>
                      ) : null}
                    </div>
                    {labelValue(ui.labels.income, incomeLabel(detail.item.partner?.income, ui))}
                    {labelValue(ui.labels.livingWith, detail.item.partner?.livingWith)}
                    {labelValue(ui.labels.religiousValues, detail.item.partner?.religiousValues)}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-bold text-slate-900">{ui.admin}</div>
                  <div className="text-xs text-slate-600">{ui.statusLabel}: {statusLabel(detail.item.status, ui)}</div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-900">{ui.statusLabel}</label>
                    <select
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                      value={detail.item.status || 'new'}
                      onChange={(e) => updateDetailField('status', e.target.value)}
                      disabled={patch.saving}
                    >
                      <option value="new">{ui.status.new}</option>
                      <option value="contacted">{ui.status.contacted}</option>
                      <option value="archived">{ui.status.archived}</option>
                      <option value="rejected">{ui.status.rejected}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-900">{ui.labels.contacted}</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!detail.item.contacted}
                        onChange={(e) => updateDetailField('contacted', e.target.checked)}
                        disabled={patch.saving}
                      />
                      <span className="text-xs text-slate-700">{ui.yes}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-semibold text-slate-900">{ui.labels.note}</label>
                  <textarea
                    className="mt-1 w-full min-h-24 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    value={detail.item.adminNotes || ''}
                    onChange={(e) => updateDetailField('adminNotes', e.target.value)}
                    disabled={patch.saving}
                  />
                </div>

                {patch.error ? <div className="mt-2 text-sm text-rose-700">{patch.error}</div> : null}
                {patch.success ? <div className="mt-2 text-sm text-emerald-700">{patch.success}</div> : null}

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={savePatch}
                    disabled={patch.saving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {patch.saving ? ui.saving : ui.save}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
