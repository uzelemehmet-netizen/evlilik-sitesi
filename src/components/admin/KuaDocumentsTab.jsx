import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, ImagePlus, MapPin, Phone, Plus, Save, Trash2, X } from 'lucide-react';

import { authFetch } from '../../utils/authFetch';
import { uploadImageToCloudinaryAuto } from '../../utils/cloudinaryUpload';

function normalizeLang(raw) {
  const base = String(raw || 'tr').trim().toLowerCase().split(/[-_]/)[0];
  if (base === 'en' || base === 'id') return base;
  return 'tr';
}

const UI = {
  tr: {
    title: 'KUA Belgeleri',
    subtitle: 'KUA ofislerine göre istenen nikah belgelerini, açıklamalarını ve örnek belge görsellerini burada saklayabilirsiniz.',
    createButton: 'Yeni oluştur',
    empty: 'Henüz kayıtlı KUA ofisi yok.',
    loading: 'Yükleniyor…',
    listTitle: 'Kayıtlı KUA ofisleri',
    officeCount: '{{count}} kayıt',
    createModalTitle: 'Yeni KUA ofisi oluştur',
    editModalTitle: 'KUA kayıt detayları',
    labels: {
      officeName: 'KUA ofisi adı / bölgesi',
      address: 'Adres',
      phone: 'Telefon numarası',
      maleRequirements: 'Erkekten istenen belgeler',
      femaleRequirements: 'Kadından istenen belgeler',
      requirementText: 'Belge maddesi',
      requirementDescription: 'Açıklama',
      documentImage: 'Belgeler görseli',
      imageCaption: 'Görsel açıklaması',
    },
    placeholders: {
      officeName: 'Örn. KUA Kecamatan Denpasar Selatan',
      address: 'Tam adresi yazın',
      phone: 'Örn. +62 ...',
      requirementText: 'İstenen belgeyi yazın',
      requirementDescription: 'Bu belgeyle ilgili not, ayrıntı veya şartı yazın',
      imageCaption: 'Örn. KUA ofisinden alınan örnek belge fotoğrafı',
    },
    actions: {
      cancel: 'Vazgeç',
      close: 'Kapat',
      create: 'Oluştur',
      creating: 'Oluşturuluyor…',
      save: 'Tamamlayıp kaydet',
      saving: 'Kaydediliyor…',
      edit: 'Yeniden düzenle',
      discardEditing: 'Düzenlemeyi iptal et',
      delete: 'Kaydı sil',
      deleting: 'Siliniyor…',
      addItem: 'Madde ekle',
      removeItem: 'Sil',
      uploadImage: 'Görsel ekle',
      changeImage: 'Görseli değiştir',
      removeImage: 'Görseli kaldır',
    },
    hints: {
      noImage: 'Belge görseli eklenmedi. Alt alana tıklayarak fotoğraf yükleyebilirsiniz.',
      clickToUpload: 'Görsele tıklayarak dosya seçin.',
      clickToPreview: 'Küçük önizlemeye tıklayınca görsel tam boy açılır.',
      noRequirements: 'Henüz belge maddesi eklenmedi.',
    },
    messages: {
      createSuccess: 'KUA kaydı oluşturuldu. Şimdi belge detaylarını doldurabilirsiniz.',
      saveSuccess: 'KUA kaydı güncellendi.',
      deleteSuccess: 'KUA kaydı silindi.',
      uploadSuccess: 'Görsel yüklendi.',
      officeNameRequired: 'KUA ofisi adını girmeniz gerekiyor.',
      deleteConfirm: 'Bu KUA kaydını tamamen silmek istediğinizden emin misiniz?',
      genericError: 'İşlem sırasında bir hata oluştu.',
    },
  },
  en: {
    title: 'KUA Documents',
    subtitle: 'Store required marriage documents, notes, and sample document images by KUA office.',
    createButton: 'Create new',
    empty: 'No KUA office has been saved yet.',
    loading: 'Loading…',
    listTitle: 'Saved KUA offices',
    officeCount: '{{count}} entries',
    createModalTitle: 'Create a new KUA office',
    editModalTitle: 'KUA record details',
    labels: {
      officeName: 'KUA office name / area',
      address: 'Address',
      phone: 'Phone number',
      maleRequirements: 'Documents required from the man',
      femaleRequirements: 'Documents required from the woman',
      requirementText: 'Requirement item',
      requirementDescription: 'Description',
      documentImage: 'Document image',
      imageCaption: 'Image note',
    },
    placeholders: {
      officeName: 'Example: KUA Kecamatan Denpasar Selatan',
      address: 'Enter the full address',
      phone: 'Example: +62 ...',
      requirementText: 'Write the required document item',
      requirementDescription: 'Write any note, detail, or condition for this document',
      imageCaption: 'Example: Sample document photo from the KUA office',
    },
    actions: {
      cancel: 'Cancel',
      close: 'Close',
      create: 'Create',
      creating: 'Creating…',
      save: 'Save all details',
      saving: 'Saving…',
      edit: 'Edit again',
      discardEditing: 'Discard editing',
      delete: 'Delete record',
      deleting: 'Deleting…',
      addItem: 'Add item',
      removeItem: 'Remove',
      uploadImage: 'Add image',
      changeImage: 'Change image',
      removeImage: 'Remove image',
    },
    hints: {
      noImage: 'No document image yet. Click the area below to upload a photo.',
      clickToUpload: 'Click the image area to choose a file.',
      clickToPreview: 'Click the small preview to open the image in full size.',
      noRequirements: 'No document item has been added yet.',
    },
    messages: {
      createSuccess: 'The KUA office was created. You can now fill in the document details.',
      saveSuccess: 'The KUA record was updated.',
      deleteSuccess: 'The KUA record was deleted.',
      uploadSuccess: 'Image uploaded.',
      officeNameRequired: 'You need to enter the KUA office name.',
      deleteConfirm: 'Are you sure you want to permanently delete this KUA record?',
      genericError: 'An error occurred during the operation.',
    },
  },
  id: {
    title: 'Dokumen KUA',
    subtitle: 'Simpan dokumen nikah yang diminta, catatan, dan gambar contoh dokumen berdasarkan kantor KUA.',
    createButton: 'Buat baru',
    empty: 'Belum ada kantor KUA yang disimpan.',
    loading: 'Memuat…',
    listTitle: 'Kantor KUA tersimpan',
    officeCount: '{{count}} data',
    createModalTitle: 'Buat kantor KUA baru',
    editModalTitle: 'Detail data KUA',
    labels: {
      officeName: 'Nama / wilayah kantor KUA',
      address: 'Alamat',
      phone: 'Nomor telepon',
      maleRequirements: 'Dokumen yang diminta dari pihak pria',
      femaleRequirements: 'Dokumen yang diminta dari pihak wanita',
      requirementText: 'Butir dokumen',
      requirementDescription: 'Penjelasan',
      documentImage: 'Gambar dokumen',
      imageCaption: 'Catatan gambar',
    },
    placeholders: {
      officeName: 'Contoh: KUA Kecamatan Denpasar Selatan',
      address: 'Tulis alamat lengkap',
      phone: 'Contoh: +62 ...',
      requirementText: 'Tulis dokumen yang diminta',
      requirementDescription: 'Tulis catatan, detail, atau syarat untuk dokumen ini',
      imageCaption: 'Contoh: Foto contoh dokumen dari kantor KUA',
    },
    actions: {
      cancel: 'Batal',
      close: 'Tutup',
      create: 'Buat',
      creating: 'Sedang dibuat…',
      save: 'Simpan semua detail',
      saving: 'Menyimpan…',
      edit: 'Edit lagi',
      discardEditing: 'Batalkan edit',
      delete: 'Hapus data',
      deleting: 'Menghapus…',
      addItem: 'Tambah butir',
      removeItem: 'Hapus',
      uploadImage: 'Tambah gambar',
      changeImage: 'Ganti gambar',
      removeImage: 'Hapus gambar',
    },
    hints: {
      noImage: 'Belum ada gambar dokumen. Klik area di bawah untuk mengunggah foto.',
      clickToUpload: 'Klik area gambar untuk memilih file.',
      clickToPreview: 'Klik pratinjau kecil untuk membuka gambar ukuran penuh.',
      noRequirements: 'Belum ada butir dokumen yang ditambahkan.',
    },
    messages: {
      createSuccess: 'Data KUA dibuat. Sekarang Anda bisa mengisi detail dokumennya.',
      saveSuccess: 'Data KUA diperbarui.',
      deleteSuccess: 'Data KUA dihapus.',
      uploadSuccess: 'Gambar berhasil diunggah.',
      officeNameRequired: 'Nama kantor KUA wajib diisi.',
      deleteConfirm: 'Anda yakin ingin menghapus permanen data KUA ini?',
      genericError: 'Terjadi kesalahan saat memproses.',
    },
  },
};

function createRequirementId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createRequirementDraft() {
  return { id: createRequirementId(), text: '', description: '' };
}

function initialCreateDraft() {
  return {
    officeName: '',
    address: '',
    phone: '',
  };
}

function normalizeRequirementList(value, ensureOne = false) {
  const list = Array.isArray(value)
    ? value.map((item) => ({
        id: String(item?.id || createRequirementId()),
        text: String(item?.text || '').trim(),
        description: String(item?.description || '').trim(),
      }))
    : [];

  const hasContent = list.some((item) => item.text || item.description);
  if (!list.length && ensureOne) return [createRequirementDraft()];
  if (!hasContent && ensureOne) return [createRequirementDraft()];
  return list;
}

function createEditorDraftFromOffice(office) {
  return {
    id: String(office?.id || ''),
    officeName: String(office?.officeName || '').trim(),
    address: String(office?.address || '').trim(),
    phone: String(office?.phone || '').trim(),
    maleRequirements: normalizeRequirementList(office?.maleRequirements, true),
    femaleRequirements: normalizeRequirementList(office?.femaleRequirements, true),
    documentImageUrl: String(office?.documentImageUrl || '').trim(),
    documentImagePublicId: String(office?.documentImagePublicId || '').trim(),
    documentImageCaption: String(office?.documentImageCaption || '').trim(),
  };
}

function serializeRequirementList(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      id: String(item?.id || createRequirementId()),
      text: String(item?.text || '').trim(),
      description: String(item?.description || '').trim(),
    }))
    .filter((item) => item.text || item.description);
}

function ModalShell({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
      <div className={`w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'} max-h-[92vh] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-74px)] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function KuaDocumentsTab({ lang = 'tr' }) {
  const ui = useMemo(() => UI[normalizeLang(lang)] || UI.tr, [lang]);
  const imageInputRef = useRef(null);

  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState(() => initialCreateDraft());
  const [createBusy, setCreateBusy] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorDraft, setEditorDraft] = useState(null);
  const [editorSnapshot, setEditorSnapshot] = useState(null);
  const [editorMode, setEditorMode] = useState('view');
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadOffices = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await authFetch('/api/admin-kua-offices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      setOffices(Array.isArray(data?.offices) ? data.offices : []);
    } catch (error) {
      setLoadError(String(error?.message || ui.messages.genericError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffices();
  }, [ui.messages.genericError]);

  const setRequirementField = (groupKey, requirementId, field, value) => {
    setEditorDraft((current) => {
      if (!current) return current;
      const nextItems = (Array.isArray(current[groupKey]) ? current[groupKey] : []).map((item) => {
        if (item.id !== requirementId) return item;
        return { ...item, [field]: value };
      });
      return { ...current, [groupKey]: nextItems };
    });
  };

  const addRequirementItem = (groupKey) => {
    setEditorDraft((current) => {
      if (!current) return current;
      const nextItems = [...(Array.isArray(current[groupKey]) ? current[groupKey] : []), createRequirementDraft()];
      return { ...current, [groupKey]: nextItems };
    });
  };

  const removeRequirementItem = (groupKey, requirementId) => {
    setEditorDraft((current) => {
      if (!current) return current;
      const currentItems = Array.isArray(current[groupKey]) ? current[groupKey] : [];
      const nextItems = currentItems.filter((item) => item.id !== requirementId);
      return { ...current, [groupKey]: nextItems.length ? nextItems : [createRequirementDraft()] };
    });
  };

  const openEditor = (office, options = {}) => {
    const nextDraft = createEditorDraftFromOffice(office);
    setMessage({ type: '', text: '' });
    setEditorDraft(nextDraft);
    setEditorSnapshot(nextDraft);
    setEditorMode(options.edit ? 'edit' : 'view');
    setEditorOpen(true);
  };

  const closeCreateModal = () => {
    if (createBusy) return;
    setCreateOpen(false);
    setCreateDraft(initialCreateDraft());
  };

  const closeEditor = () => {
    if (saveBusy || uploadBusy || deleteBusy) return;
    setEditorOpen(false);
    setEditorDraft(null);
    setEditorSnapshot(null);
    setEditorMode('view');
    setImagePreviewOpen(false);
  };

  const startEditing = () => {
    if (!editorDraft || saveBusy || uploadBusy || deleteBusy) return;
    setEditorSnapshot(createEditorDraftFromOffice(editorDraft));
    setEditorMode('edit');
  };

  const discardEditing = () => {
    if (saveBusy || uploadBusy || deleteBusy) return;
    setEditorDraft(editorSnapshot ? createEditorDraftFromOffice(editorSnapshot) : editorDraft);
    setEditorMode('view');
  };

  const handleCreateOffice = async () => {
    const officeName = String(createDraft.officeName || '').trim();
    const address = String(createDraft.address || '').trim();
    const phone = String(createDraft.phone || '').trim();

    if (!officeName) {
      setMessage({ type: 'error', text: ui.messages.officeNameRequired });
      return;
    }

    setCreateBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await authFetch('/api/admin-kua-offices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          office: {
            officeName,
            address,
            phone,
            maleRequirements: [],
            femaleRequirements: [],
            documentImageUrl: '',
            documentImagePublicId: '',
            documentImageCaption: '',
          },
        }),
      });
      const createdOffice = data?.office && typeof data.office === 'object' ? data.office : null;
      setCreateBusy(false);
      setCreateOpen(false);
      setCreateDraft(initialCreateDraft());
      setMessage({ type: 'success', text: ui.messages.createSuccess });
      await loadOffices();
      if (createdOffice) openEditor(createdOffice, { edit: true });
    } catch (error) {
      setCreateBusy(false);
      setMessage({ type: 'error', text: String(error?.message || ui.messages.genericError) });
    }
  };

  const handleSaveEditor = async () => {
    if (!editorDraft?.id) return;

    const officeName = String(editorDraft.officeName || '').trim();
    if (!officeName) {
      setMessage({ type: 'error', text: ui.messages.officeNameRequired });
      return;
    }

    setSaveBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        id: editorDraft.id,
        officeName,
        address: String(editorDraft.address || '').trim(),
        phone: String(editorDraft.phone || '').trim(),
        maleRequirements: serializeRequirementList(editorDraft.maleRequirements),
        femaleRequirements: serializeRequirementList(editorDraft.femaleRequirements),
        documentImageUrl: String(editorDraft.documentImageUrl || '').trim(),
        documentImagePublicId: String(editorDraft.documentImagePublicId || '').trim(),
        documentImageCaption: String(editorDraft.documentImageCaption || '').trim(),
      };

      const data = await authFetch('/api/admin-kua-offices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'update', officeId: editorDraft.id, office: payload }),
      });
      const nextDraft = createEditorDraftFromOffice(data?.office && typeof data.office === 'object' ? data.office : payload);
      setSaveBusy(false);
      setEditorDraft(nextDraft);
      setEditorSnapshot(nextDraft);
      setEditorMode('view');
      setMessage({ type: 'success', text: ui.messages.saveSuccess });
      await loadOffices();
    } catch (error) {
      setSaveBusy(false);
      setMessage({ type: 'error', text: String(error?.message || ui.messages.genericError) });
    }
  };

  const handleDeleteOffice = async () => {
    if (!editorDraft?.id || saveBusy || uploadBusy || deleteBusy) return;

    const confirmed = typeof window === 'undefined' ? true : window.confirm(ui.messages.deleteConfirm);
    if (!confirmed) return;

    setDeleteBusy(true);
    setMessage({ type: '', text: '' });
    try {
      await authFetch('/api/admin-kua-offices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'delete', officeId: editorDraft.id }),
      });
      setDeleteBusy(false);
      setEditorOpen(false);
      setEditorDraft(null);
      setImagePreviewOpen(false);
      setMessage({ type: 'success', text: ui.messages.deleteSuccess });
      await loadOffices();
    } catch (error) {
      setDeleteBusy(false);
      setMessage({ type: 'error', text: String(error?.message || ui.messages.genericError) });
    }
  };

  const handlePickImage = () => {
    if (uploadBusy) return;
    imageInputRef.current?.click?.();
  };

  const handleImageUpload = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file || !editorDraft?.id) return;

    setUploadBusy(true);
    setMessage({ type: '', text: '' });

    try {
      const uploaded = await uploadImageToCloudinaryAuto(file, {
        folder: 'admin/kua-documents',
        tags: ['admin', 'kua-documents', editorDraft.id],
        source: 'admin_kua_documents',
      });

      setEditorDraft((current) => {
        if (!current) return current;
        return {
          ...current,
          documentImageUrl: String(uploaded?.secureUrl || '').trim(),
          documentImagePublicId: String(uploaded?.publicId || '').trim(),
        };
      });
      setMessage({ type: 'success', text: ui.messages.uploadSuccess });
    } catch (error) {
      setMessage({ type: 'error', text: String(error?.message || ui.messages.genericError) });
    } finally {
      setUploadBusy(false);
      if (event?.target) event.target.value = '';
    }
  };

  const renderRequirementGroup = (groupKey, items, title) => {
    return (
      <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <button type="button" onClick={() => addRequirementItem(groupKey)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
            <Plus size={16} />
            {ui.actions.addItem}
          </button>
        </div>

        <div className="mt-3 space-y-2.5">
          {(Array.isArray(items) ? items : []).map((item, index) => (
            <div key={item.id} className="rounded-[12px] border border-slate-200 bg-white p-2.5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">{index + 1}. {ui.labels.requirementText}</div>
                <button type="button" onClick={() => removeRequirementItem(groupKey, item.id)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
                  {ui.actions.removeItem}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
                <div>
                  <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">{ui.labels.requirementText}</div>
                  <textarea
                    value={item.text}
                    onChange={(event) => setRequirementField(groupKey, item.id, 'text', event.target.value)}
                    rows={1}
                    className="min-h-[38px] w-full resize-y rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[13px] leading-5 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
                    placeholder={ui.placeholders.requirementText}
                  />
                </div>

                <div>
                  <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">{ui.labels.requirementDescription}</div>
                  <textarea
                    value={item.description}
                    onChange={(event) => setRequirementField(groupKey, item.id, 'description', event.target.value)}
                    rows={1}
                    className="min-h-[38px] w-full resize-y rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[13px] leading-5 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
                    placeholder={ui.placeholders.requirementDescription}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRequirementListGroup = (items, title) => {
    const list = serializeRequirementList(items);

    return (
      <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3">
        <div className="text-sm font-semibold text-slate-900">{title}</div>

        {list.length ? (
          <div className="mt-3 space-y-3">
            {list.map((item, index) => (
              <div key={item.id} className="border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{index + 1}. {ui.labels.requirementText}</div>
                <div className="mt-1.5 text-sm font-medium text-slate-900">{item.text || '-'}</div>
                {item.description ? <div className="mt-1 text-sm leading-6 text-slate-600">{item.description}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-500">{ui.hints.noRequirements}</div>
        )}
      </div>
    );
  };

  const renderReadOnlyField = (label, value) => {
    return (
      <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
        <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-900">{String(value || '-')}</div>
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
              <Building2 size={14} />
              <span>{ui.title}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">{ui.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{ui.subtitle}</p>
          </div>

          <button type="button" onClick={() => { setMessage({ type: '', text: '' }); setCreateOpen(true); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#334155)] px-5 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(15,23,42,0.20)] transition hover:brightness-105">
            <Plus size={16} />
            {ui.createButton}
          </button>
        </div>

        {message.text ? (
          <div className={`mt-4 rounded-2xl border p-3 text-sm ${message.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
            {message.text}
          </div>
        ) : null}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-lg font-semibold text-slate-900">{ui.listTitle}</div>
          <div className="text-sm text-slate-500">{ui.officeCount.replace('{{count}}', String(offices.length))}</div>
        </div>

        {loading ? <div className="mt-5 text-sm text-slate-500">{ui.loading}</div> : null}
        {!loading && loadError ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{loadError}</div> : null}
        {!loading && !loadError && !offices.length ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">{ui.empty}</div> : null}

        {!loading && !loadError && offices.length ? (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {offices.map((office) => (
              <button
                key={office.id}
                type="button"
                onClick={() => openEditor(office)}
                className="rounded-[24px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff,#f8fafc)] p-4 text-left shadow-sm transition hover:border-sky-300 hover:shadow-[0_18px_34px_rgba(148,163,184,0.18)]"
              >
                <div className="text-base font-semibold text-slate-950">{String(office.officeName || '-')}</div>
                <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>{String(office.address || '-')}</span>
                </div>
                <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                  <Phone size={16} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>{String(office.phone || '-')}</span>
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">{ui.editModalTitle}</div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {createOpen ? (
        <ModalShell title={ui.createModalTitle} onClose={closeCreateModal}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{ui.labels.officeName}</label>
              <input
                value={createDraft.officeName}
                onChange={(event) => setCreateDraft((current) => ({ ...current, officeName: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder={ui.placeholders.officeName}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{ui.labels.address}</label>
              <textarea
                value={createDraft.address}
                onChange={(event) => setCreateDraft((current) => ({ ...current, address: event.target.value }))}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder={ui.placeholders.address}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{ui.labels.phone}</label>
              <input
                value={createDraft.phone}
                onChange={(event) => setCreateDraft((current) => ({ ...current, phone: event.target.value }))}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder={ui.placeholders.phone}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeCreateModal} className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                {ui.actions.cancel}
              </button>
              <button type="button" onClick={handleCreateOffice} disabled={createBusy} className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#334155)] px-5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60">
                {createBusy ? ui.actions.creating : ui.actions.create}
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {editorOpen && editorDraft ? (
        <ModalShell title={ui.editModalTitle} onClose={closeEditor} wide>
          <div className="space-y-6">
            {editorMode === 'edit' ? (
              <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-1">
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{ui.labels.officeName}</label>
                    <input
                      value={editorDraft.officeName}
                      onChange={(event) => setEditorDraft((current) => ({ ...current, officeName: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      placeholder={ui.placeholders.officeName}
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{ui.labels.phone}</label>
                    <input
                      value={editorDraft.phone}
                      onChange={(event) => setEditorDraft((current) => ({ ...current, phone: event.target.value }))}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      placeholder={ui.placeholders.phone}
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{ui.labels.address}</label>
                    <textarea
                      value={editorDraft.address}
                      onChange={(event) => setEditorDraft((current) => ({ ...current, address: event.target.value }))}
                      rows={3}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      placeholder={ui.placeholders.address}
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  {renderRequirementGroup('maleRequirements', editorDraft.maleRequirements, ui.labels.maleRequirements)}
                  {renderRequirementGroup('femaleRequirements', editorDraft.femaleRequirements, ui.labels.femaleRequirements)}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{ui.labels.documentImage}</div>
                      <div className="mt-1 text-sm text-slate-500">{editorDraft.documentImageUrl ? ui.hints.clickToPreview : ui.hints.noImage}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={handlePickImage} disabled={uploadBusy} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60">
                        <ImagePlus size={16} />
                        {editorDraft.documentImageUrl ? ui.actions.changeImage : ui.actions.uploadImage}
                      </button>

                      {editorDraft.documentImageUrl ? (
                        <button type="button" onClick={() => setEditorDraft((current) => ({ ...current, documentImageUrl: '', documentImagePublicId: '', documentImageCaption: '' }))} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100">
                          {ui.actions.removeImage}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={editorDraft.documentImageUrl ? () => setImagePreviewOpen(true) : handlePickImage}
                      disabled={uploadBusy}
                      className="block w-full max-w-[210px] overflow-hidden rounded-[24px] border border-dashed border-slate-300 bg-white text-left transition hover:border-sky-300 disabled:opacity-60"
                    >
                    {editorDraft.documentImageUrl ? (
                      <img src={editorDraft.documentImageUrl} alt={editorDraft.officeName || ui.labels.documentImage} className="aspect-[9/16] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 px-5 text-center text-slate-500">
                        <ImagePlus size={28} />
                        <div className="text-sm font-medium">{uploadBusy ? ui.actions.changeImage : ui.actions.uploadImage}</div>
                        <div className="text-xs leading-relaxed">{ui.hints.noImage}</div>
                      </div>
                    )}
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{ui.labels.imageCaption}</label>
                    <textarea
                      value={editorDraft.documentImageCaption}
                      onChange={(event) => setEditorDraft((current) => ({ ...current, documentImageCaption: event.target.value }))}
                      rows={2}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      placeholder={ui.placeholders.imageCaption}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {renderReadOnlyField(ui.labels.officeName, editorDraft.officeName)}
                  {renderReadOnlyField(ui.labels.phone, editorDraft.phone)}
                  <div className="lg:col-span-3">{renderReadOnlyField(ui.labels.address, editorDraft.address)}</div>
                </div>

                <div className="space-y-5">
                  {renderRequirementListGroup(editorDraft.maleRequirements, ui.labels.maleRequirements)}
                  {renderRequirementListGroup(editorDraft.femaleRequirements, ui.labels.femaleRequirements)}
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                  <div className="text-sm font-semibold text-slate-900">{ui.labels.documentImage}</div>
                  <div className="mt-1 text-sm text-slate-500">{editorDraft.documentImageUrl ? ui.hints.clickToPreview : ui.hints.noImage}</div>

                  <div className="mt-4 flex justify-center">
                    {editorDraft.documentImageUrl ? (
                      <button
                        type="button"
                        onClick={() => setImagePreviewOpen(true)}
                        className="block w-full max-w-[210px] overflow-hidden rounded-[24px] border border-slate-200 bg-white text-left transition hover:border-sky-300"
                      >
                        <img src={editorDraft.documentImageUrl} alt={editorDraft.officeName || ui.labels.documentImage} className="aspect-[9/16] w-full object-cover" />
                      </button>
                    ) : (
                      <div className="flex aspect-[9/16] w-full max-w-[210px] flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-slate-300 bg-white px-5 text-center text-slate-500">
                        <ImagePlus size={28} />
                        <div className="text-xs leading-relaxed">{ui.hints.noImage}</div>
                      </div>
                    )}
                  </div>

                  {editorDraft.documentImageCaption ? (
                    <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-3">
                      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">{ui.labels.imageCaption}</div>
                      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{editorDraft.documentImageCaption}</div>
                    </div>
                  ) : null}
                </div>
              </>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={handleDeleteOffice} disabled={saveBusy || uploadBusy || deleteBusy} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 sm:mr-auto">
                <Trash2 size={16} />
                {deleteBusy ? ui.actions.deleting : ui.actions.delete}
              </button>
              {editorMode === 'edit' ? (
                <>
                  <button type="button" onClick={discardEditing} className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    {ui.actions.discardEditing}
                  </button>
                  <button type="button" onClick={handleSaveEditor} disabled={saveBusy || uploadBusy || deleteBusy} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#334155)] px-5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60">
                    <Save size={16} />
                    {saveBusy ? ui.actions.saving : ui.actions.save}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={closeEditor} className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    {ui.actions.close}
                  </button>
                  <button type="button" onClick={startEditing} disabled={saveBusy || uploadBusy || deleteBusy} className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#334155)] px-5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60">
                    {ui.actions.edit}
                  </button>
                </>
              )}
            </div>
          </div>
        </ModalShell>
      ) : null}

      {imagePreviewOpen && editorDraft?.documentImageUrl ? (
        <ModalShell title={ui.labels.documentImage} onClose={() => setImagePreviewOpen(false)}>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100">
              <img src={editorDraft.documentImageUrl} alt={editorDraft.officeName || ui.labels.documentImage} className="max-h-[70vh] w-full object-contain" />
            </div>
            {editorDraft.documentImageCaption ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {editorDraft.documentImageCaption}
              </div>
            ) : null}
          </div>
        </ModalShell>
      ) : null}
    </section>
  );
}