import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '../../utils/authFetch';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../config/firebaseStorage';

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

function shortUid(uid) {
  const s = String(uid || '');
  if (s.length <= 10) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function genderLabel(g) {
  const s = String(g || '').toLowerCase();
  if (s === 'female') return 'Kadın';
  if (s === 'male') return 'Erkek';
  return '-';
}

function statusLabel(code) {
  const c = String(code || '').toUpperCase();
  if (c === 'DISABLED') return 'DEVRE DIŞI';
  if (c === 'BLOCKED') return 'ENGELLİ';
  if (c === 'FORM') return 'FORM';
  if (c === 'CACHE') return 'FORM CACHE';
  if (c === 'STUB') return 'STUB';
  if (c === 'PROFILE') return 'PROFİL';
  if (c === 'SYSTEM') return 'SİSTEM';
  if (c === 'NO_AUTH') return 'AUTH YOK';
  if (c === 'NO_DOC') return 'DOKÜMAN YOK';
  return c || '-';
}

function statusPillClass(code) {
  const c = String(code || '').toUpperCase();
  if (c === 'BLOCKED' || c === 'DISABLED') return 'bg-rose-100 text-rose-800';
  if (c === 'FORM') return 'bg-emerald-100 text-emerald-800';
  if (c === 'CACHE') return 'bg-teal-100 text-teal-800';
  if (c === 'STUB') return 'bg-amber-100 text-amber-800';
  if (c === 'PROFILE') return 'bg-sky-100 text-sky-800';
  if (c === 'SYSTEM') return 'bg-slate-200 text-slate-800';
  if (c === 'NO_AUTH') return 'bg-fuchsia-100 text-fuchsia-800';
  return 'bg-amber-100 text-amber-800';
}

function applicationStateLabel(state) {
  const s = String(state || '').toLowerCase();
  if (s === 'real') return 'Gerçek form';
  if (s === 'cache') return 'Cache form';
  if (s === 'stub' || s === 'stub_cache') return 'Stub';
  if (s === 'profile') return 'Profil cache';
  return 'Yok';
}

function pill(color) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border';
  if (color === 'green') return `${base} border-emerald-200 bg-emerald-50 text-emerald-900`;
  if (color === 'red') return `${base} border-rose-200 bg-rose-50 text-rose-900`;
  if (color === 'amber') return `${base} border-amber-200 bg-amber-50 text-amber-900`;
  if (color === 'slate') return `${base} border-slate-200 bg-slate-50 text-slate-800`;
  return `${base} border-gray-200 bg-gray-50 text-gray-800`;
}

export default function AllUsersTab() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [sortMode, setSortMode] = useState('created_desc');
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [formModal, setFormModal] = useState({
    open: false,
    uid: '',
    loading: false,
    error: '',
    application: null,
    user: null,
    count: 0,
  });

  const [formPhotoState, setFormPhotoState] = useState({ loading: false, urls: [], error: '' });
  const [formLightbox, setFormLightbox] = useState({ open: false, urls: [], index: 0, title: '' });
  const [showRawJson, setShowRawJson] = useState(false);

  const [selected, setSelected] = useState(null);
  const [acting, setActing] = useState(false);
  const [actionErr, setActionErr] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const [membershipDays, setMembershipDays] = useState('30');
  const [membershipPlan, setMembershipPlan] = useState('eco');
  const [blockReason, setBlockReason] = useState('');
  const [paymentId, setPaymentId] = useState('');

  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteFinal, setDeleteFinal] = useState(false);

  const [campaignState, setCampaignState] = useState({ loading: false, error: '', msg: '', details: null });

  const trimmedQuery = useMemo(() => String(query || '').trim(), [query]);

  const visibleUsers = useMemo(() => {
    const list = Array.isArray(users) ? [...users] : [];
    const dir = sortMode === 'created_asc' ? 1 : -1;
    list.sort((a, b) => {
      const am = typeof a?.createdAtMs === 'number' && Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0;
      const bm = typeof b?.createdAtMs === 'number' && Number.isFinite(b.createdAtMs) ? b.createdAtMs : 0;
      if (am !== bm) return (am - bm) * dir;
      const au = String(a?.uid || '');
      const bu = String(b?.uid || '');
      return au.localeCompare(bu);
    });
    return list;
  }, [users, sortMode]);

  const load = async ({ mode }) => {
    setLoading(true);
    setErr('');
    try {
      const payload = {
        pageSize: 50,
      };

      if (mode === 'search' && trimmedQuery) {
        payload.query = trimmedQuery;
      } else if (mode === 'more' && nextPageToken) {
        payload.pageToken = nextPageToken;
      }

      const data = await authFetch('/api/admin-users-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const list = Array.isArray(data?.users) ? data.users : [];
      const token = data?.nextPageToken || null;

      if (mode === 'more') {
        setUsers((prev) => [...prev, ...list]);
      } else {
        setUsers(list);
      }
      setNextPageToken(token);

      // Eğer seçili kullanıcı artık listede yoksa (silindiyse vs.) seçimi temizle.
      if (selected?.uid) {
        const stillThere = [...(mode === 'more' ? users : []), ...list].some((u) => u?.uid === selected.uid);
        if (!stillThere && trimmedQuery && (trimmedQuery === selected.uid || trimmedQuery === selected.email)) {
          setSelected(null);
        }
      }
    } catch (e) {
      setErr(String(e?.message || 'liste_yuklenemedi'));
    } finally {
      setLoading(false);
    }
  };

  const loadFirst = async () => {
    await load({ mode: trimmedQuery ? 'search' : 'first' });
  };

  const loadMore = async () => {
    if (!nextPageToken) return;
    await load({ mode: 'more' });
  };

  useEffect(() => {
    // İlk açılışta listeyi getir.
    load({ mode: 'first' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectUser = (u) => {
    setSelected(u || null);
    setActionErr('');
    setActionMsg('');
    setBlockReason('');
    setPaymentId('');
    setDeleteFinal(false);

    const uid = String(u?.uid || '').trim();
    setDeleteConfirmText(uid ? `delete:${uid}` : '');

    const plan = String(u?.membershipPlan || 'eco').toLowerCase();
    setMembershipPlan(['eco', 'standard', 'pro'].includes(plan) ? plan : 'eco');

    // default 30
    setMembershipDays('30');
  };

  const refreshSelected = async () => {
    if (!selected?.uid) return;
    try {
      const data = await authFetch('/api/admin-users-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: selected.uid }),
      });
      const u = Array.isArray(data?.users) ? data.users[0] : null;
      if (u) {
        setSelected(u);
        setUsers((prev) => prev.map((x) => (x?.uid === u.uid ? { ...x, ...u } : x)));
      }
    } catch {
      // ignore
    }
  };

  const doAction = async (payload) => {
    setActing(true);
    setActionErr('');
    setActionMsg('');
    try {
      await authFetch('/api/admin-user-action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (payload?.action === 'delete' && payload?.uid) {
        const deletedUid = String(payload.uid);
        setUsers((prev) => prev.filter((x) => String(x?.uid || '') !== deletedUid));
        if (selected?.uid && String(selected.uid) === deletedUid) setSelected(null);
        setActionMsg('Kullanıcı silindi.');
        return;
      }

      setActionMsg('İşlem başarılı.');
      await refreshSelected();
    } catch (e) {
      setActionErr(String(e?.message || 'islem_basarisiz'));
    } finally {
      setActing(false);
    }
  };

  const bulkMarkSystemUsers = async () => {
    const phrase = window.prompt(
      'Bu işlem tüm mevcut kullanıcıları "sistem kullanıcısı" olarak işaretler. Devam etmek için: MARK_ALL_SYSTEM_USERS yazın',
      ''
    );
    if (!phrase) return;

    setActing(true);
    setActionErr('');
    setActionMsg('');
    try {
      const data = await authFetch('/api/admin-users-mark-system', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'allExisting', confirmText: phrase, limit: 500 }),
      });
      setActionMsg(`Sistem kullanıcısı işaretlendi: ${data?.marked || 0}`);
      await loadFirst();
      await refreshSelected();
    } catch (e) {
      setActionErr(String(e?.message || 'bulk_islem_basarisiz'));
    } finally {
      setActing(false);
    }
  };

  const sendIncompleteApplicationPushOnce = async ({ dryRun } = {}) => {
    setCampaignState({ loading: true, error: '', msg: '', details: null });
    try {
      const isDryRun = dryRun !== false;
      const totalWanted = 200;
      const chunkLimit = 60;

      let cursorUid = '';
      let totalCandidates = 0;
      let processed = 0;
      let totalSent = 0;
      let totalSkipped = 0;
      let totalWouldSend = 0;

      let lastData = null;

      for (let i = 0; i < 20; i++) {
        const data = await authFetch('/api/admin-push-incomplete-application-once', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            dryRun: isDryRun,
            limit: chunkLimit,
            cursorUid,
            title: 'Başvurunu tamamla',
            body: 'İletişim numaranızı ekleyin; gerektiğinde sizinle iletişime geçebilmemiz için gerekli.',
            url: '/evlilik/eslestirme-basvuru?w=1',
          }),
        });

        lastData = data || null;
        totalCandidates = typeof data?.candidates === 'number' ? data.candidates : totalCandidates;
        processed += typeof data?.processed === 'number' ? data.processed : 0;
        totalSent += typeof data?.sent === 'number' ? data.sent : 0;
        totalSkipped += typeof data?.skipped === 'number' ? data.skipped : 0;
        totalWouldSend += typeof data?.wouldSend === 'number' ? data.wouldSend : 0;

        const next = String(data?.nextCursorUid || '').trim();
        cursorUid = next;

        const line = isDryRun
          ? `Dry-run: işlenen ${processed}, gönderilecek ${totalWouldSend}, atlanan ${totalSkipped}`
          : `Gönderim: işlenen ${processed}, gönderilen ${totalSent}, atlanan ${totalSkipped}`;
        setCampaignState({ loading: true, error: '', msg: line, details: lastData });

        // Stop if finished or we processed enough.
        if (!cursorUid) break;
        if (processed >= totalWanted) break;
      }

      const finalLine = isDryRun
        ? `Dry-run bitti: aday ${totalCandidates || 0}, işlenen ${processed}, gönderilecek ${totalWouldSend}, atlanan ${totalSkipped}`
        : `Gönderim bitti: aday ${totalCandidates || 0}, işlenen ${processed}, gönderilen ${totalSent}, atlanan ${totalSkipped}`;

      setCampaignState({ loading: false, error: '', msg: finalLine, details: lastData });
    } catch (e) {
      setCampaignState({ loading: false, error: String(e?.message || 'push_gonderilemedi'), msg: '', details: null });
    }
  };

  const selectedUid = selected?.uid ? String(selected.uid) : '';

  function safeStr(v) {
    return typeof v === 'string' ? v.trim() : '';
  }

  function isPrimitive(v) {
    return v == null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
  }

  function labelizeKey(k) {
    const s = String(k || '').trim();
    if (!s) return '';

    const map = {
      // Form / profil alanları
      fullName: 'Ad Soyad',
      username: 'Kullanıcı Adı',
      userCode: 'Kullanıcı Kodu',
      age: 'Yaş',
      gender: 'Cinsiyet',
      city: 'Şehir',
      country: 'Ülke',
      lang: 'Dil',
      profileTextLang: 'Profil Dili',
      about: 'Hakkında',
      expectations: 'Beklentiler',
      wantChildren: 'Çocuk İstiyor Mu',
      hasChildren: 'Çocuğu Var Mı',
      height: 'Boy',
      weight: 'Kilo',
      education: 'Eğitim',
      job: 'Meslek',
      occupation: 'Meslek',
      occupationTr: 'Meslek (TR)',
      occupationId: 'Meslek (ID)',
      religion: 'Din',
      maritalStatus: 'Medeni Durum',
      childrenCount: 'Çocuk Sayısı',
      smoking: 'Sigara',
      alcohol: 'Alkol',
      hobbies: 'Hobiler',

      // İletişim / sosyal
      email: 'E-posta',
      instagram: 'Instagram',
      whatsapp: 'WhatsApp',

      // Arama tercihleri
      lookingForGender: 'Aradığı Cinsiyet',
      lookingForNationality: 'Aradığı Uyruk',
      nationality: 'Uyruğu',

      // Eş tercihleri (partnerPreferences)
      partnerPreferences: 'Eş Tercihleri',
      heightMinCm: 'Boy (Min, cm)',
      heightMaxCm: 'Boy (Max, cm)',
      ageMaxOlderYears: 'Yaş (Max büyük, yıl)',
      ageMaxYoungerYears: 'Yaş (Max küçük, yıl)',
      livingCountry: 'Yaşadığı Ülke',
      translationAppPreference: 'Çeviri Uygulaması',
      smokingPreference: 'Sigara Tercihi',
      alcoholPreference: 'Alkol Tercihi',
      childrenPreference: 'Çocuk Tercihi',
      educationPreference: 'Eğitim Tercihi',
      occupationPreference: 'Meslek Tercihi',
      familyValuesPreference: 'Aile Değerleri',
      communicationMethods: 'İletişim Yöntemleri',

      // Onaylar
      consent18Plus: '+18 Onayı',
      consentPhotoShare: 'Fotoğraf Paylaşım Onayı',
      consentPrivacy: 'Gizlilik Politikası Onayı',
      consentTerms: 'Kullanım Şartları Onayı',
      consentMarketing: 'Pazarlama Onayı',

      // Profil kodları
      profileCode: 'Profil Kodu',
      profileNo: 'Profil No',
      userNameLower: 'Kullanıcı Adı (küçük harf)',
      usernameLower: 'Kullanıcı Adı (küçük harf)',
      source: 'Kaynak',
      site: 'Site',

      // Sistem alanları
      id: 'Doküman ID',
      userId: 'Kullanıcı UID',
      applicationId: 'Başvuru ID',
      createdAt: 'Oluşturma Zamanı',
      createdAtMs: 'Oluşturma (ms)',
      updatedAt: 'Güncelleme Zamanı',
      updatedAtMs: 'Güncelleme (ms)',
      status: 'Durum',
      pool: 'Havuz',
      publicProfile: 'Genel Profil',
      details: 'Detaylar',
      membership: 'Üyelik',
    };

    if (map[s]) return map[s];

    return s
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatPrimitive(v, hintKeyOrLabel = '') {
    const hint = String(hintKeyOrLabel || '').toLowerCase();
    const isPreferenceContext =
      hint.includes('partnerpreferences') ||
      hint.includes('preference') ||
      hint.includes('tercih') ||
      hint.includes('communicationmethods');

    if (v == null) return isPreferenceContext ? 'Farketmez' : '—';
    if (typeof v === 'boolean') return v ? 'Evet' : 'Hayır';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '—';

    const s = String(v).trim();
    if (!s) return isPreferenceContext ? 'Farketmez' : '—';
    const low = s.toLowerCase();

    // "Farketmez" varyasyonları
    if (
      low === 'doesnt_matter' ||
      low === 'doesntmatter' ||
      low === "doesn't_matter" ||
      low === "doesn'tmatter" ||
      low === 'dont_care' ||
      low === 'dontcare' ||
      low === 'no_preference' ||
      low === 'nopreference' ||
      low === 'any' ||
      low === 'all' ||
      low === 'farketmez'
    ) {
      return 'Farketmez';
    }

    // Evet/Hayır stringleri (form seçenekleri)
    if (low === 'yes') return 'Evet';
    if (low === 'no') return 'Hayır';

    if (hint.includes('cinsiyet') || hint.includes('gender')) {
      if (low === 'female') return 'Kadın';
      if (low === 'male') return 'Erkek';
    }

    if (hint.includes('maritalstatus') || hint.includes('medeni')) {
      const map = {
        single: 'Bekar',
        married: 'Evli',
        widowed: 'Dul',
        divorced: 'Boşanmış',
      };
      if (map[low]) return map[low];
    }

    if (hint.includes('dil') || hint.includes('lang')) {
      if (low === 'tr') return 'Türkçe';
      if (low === 'id') return 'Endonezce';
      if (low === 'en') return 'İngilizce';
    }

    if (hint.includes('durum') || hint === 'status') {
      const statusMap = {
        new: 'Yeni',
        pending: 'Beklemede',
        approved: 'Onaylı',
        rejected: 'Reddedildi',
        active: 'Aktif',
        cancelled: 'İptal',
        canceled: 'İptal',
        disabled: 'Devre dışı',
        blocked: 'Engelli',
      };
      if (statusMap[low]) return statusMap[low];
    }

    // Ülke/uyruk normalize
    if (hint.includes('uyruk') || hint.includes('nationality') || hint.includes('ülke') || hint.includes('country')) {
      const natMap = {
        tr: 'Türkiye',
        id: 'Endonezya',
        indonesia: 'Endonezya',
        turkey: 'Türkiye',
      };
      if (natMap[low]) return natMap[low];
    }

    return s;
  }

  function looksLikeImageUrl(url) {
    const s = safeStr(url).toLowerCase();
    if (!s) return false;
    if (!s.startsWith('http://') && !s.startsWith('https://')) return false;
    if (s.includes('ucarecdn.com') || s.includes('ucarecd.net') || s.includes('cloudinary.com') || s.includes('googleusercontent.com')) return true;
    if (s.includes('firebasestorage.googleapis.com')) return true;
    return /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(s);
  }

  function normalizeForJson(value, depth = 0) {
    if (depth > 15) return '[max_depth]';
    if (value == null) return value;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.map((x) => normalizeForJson(x, depth + 1));

    if (value instanceof Date) return value.toISOString();

    if (typeof value === 'object') {
      const s = value?._seconds ?? value?.seconds;
      const ns = value?._nanoseconds ?? value?.nanoseconds;
      if (typeof s === 'number' && typeof ns === 'number') {
        const ms = s * 1000 + Math.floor(ns / 1e6);
        return { __type: 'timestamp', ms, iso: fmtDate(ms) };
      }

      const out = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = normalizeForJson(v, depth + 1);
      }
      return out;
    }
    return String(value);
  }

  const openFormModal = async (uidOverride) => {
    // Not: onClick handler'larında bu fonksiyon direkt verilirse React event objesini parametre diye geçirir.
    // UID yerine "[object PointerEvent]" gibi değerler gitmesin diye sadece string uid kabul ediyoruz.
    const uidToLoad = typeof uidOverride === 'string' && uidOverride.trim()
      ? uidOverride.trim()
      : String(selectedUid ?? '').trim();
    if (!uidToLoad) return;
    setShowRawJson(false);
    setFormLightbox({ open: false, urls: [], index: 0, title: '' });
    setFormPhotoState({ loading: false, urls: [], error: '' });
    setFormModal({ open: true, uid: uidToLoad, loading: true, error: '', application: null, user: null, count: 0 });
    try {
      const data = await authFetch('/api/admin-user-application-get', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uid: uidToLoad }),
      });

      setFormModal({
        open: true,
        uid: uidToLoad,
        loading: false,
        error: '',
        application: data?.application || null,
        user: data?.user || null,
        count: typeof data?.count === 'number' ? data.count : 0,
      });
    } catch (e) {
      setFormModal({
        open: true,
        uid: uidToLoad,
        loading: false,
        error: String(e?.message || 'form_yuklenemedi'),
        application: null,
        user: null,
        count: 0,
      });
    }
  };

  const closeFormModal = () => {
    setFormModal({ open: false, uid: '', loading: false, error: '', application: null, user: null, count: 0 });
    setFormPhotoState({ loading: false, urls: [], error: '' });
    setFormLightbox({ open: false, urls: [], index: 0, title: '' });
    setShowRawJson(false);
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!formModal.open) return;
      if (formModal.loading) return;
      if (!formModal.uid) return;

      const app = formModal.application && typeof formModal.application === 'object' ? formModal.application : null;
      const user = formModal.user && typeof formModal.user === 'object' ? formModal.user : null;

      const direct = [];
      const pushDirect = (arr) => {
        const list = Array.isArray(arr) ? arr : [];
        for (const u of list) {
          const s = safeStr(u);
          if (!s) continue;
          if (direct.includes(s)) continue;
          direct.push(s);
        }
      };

      // Bazı eski/alternatif şemalarda foto alanları details altında olabilir.
      const appDetails = app?.details && typeof app.details === 'object' ? app.details : null;
      const userDetails = user?.details && typeof user.details === 'object' ? user.details : null;

      pushDirect(app?.photoUrls);
      pushDirect(app?.publicProfile?.photoUrls);
      pushDirect(appDetails?.photoUrls);
      pushDirect(appDetails?.photos);
      pushDirect(user?.photoUrls);
      pushDirect(user?.publicProfile?.photoUrls);
      pushDirect(userDetails?.photoUrls);
      pushDirect(userDetails?.photos);

      // Eğer direkt URL varsa önce onları göster.
      if (direct.length) {
        if (!cancelled) setFormPhotoState({ loading: false, urls: direct, error: '' });
        return;
      }

      const paths = [];
      const pushPaths = (arr) => {
        const list = Array.isArray(arr) ? arr : [];
        for (const p of list) {
          const s = safeStr(p);
          if (!s) continue;
          if (paths.includes(s)) continue;
          paths.push(s);
        }
      };

      pushPaths(app?.photoPaths);
      pushPaths(app?.publicProfile?.photoPaths);
      pushPaths(appDetails?.photoPaths);
      pushPaths(user?.photoPaths);
      pushPaths(user?.publicProfile?.photoPaths);
      pushPaths(userDetails?.photoPaths);
      if (safeStr(user?.photoPath)) paths.push(safeStr(user.photoPath));
      if (safeStr(app?.photoPath)) paths.push(safeStr(app.photoPath));
      if (safeStr(appDetails?.photoPath)) paths.push(safeStr(appDetails.photoPath));
      if (safeStr(userDetails?.photoPath)) paths.push(safeStr(userDetails.photoPath));

      if (!paths.length) {
        if (!cancelled) setFormPhotoState({ loading: false, urls: [], error: '' });
        return;
      }

      if (!cancelled) setFormPhotoState({ loading: true, urls: [], error: '' });

      const resolved = [];
      for (const p of paths.slice(0, 24)) {
        try {
          // Firebase Storage path (ör: users/uid/...) -> download URL
          const url = await getDownloadURL(ref(storage, p));
          if (url && !resolved.includes(url)) resolved.push(url);
        } catch {
          // ignore
        }
      }

      if (!cancelled) {
        setFormPhotoState({
          loading: false,
          urls: resolved,
          error: resolved.length ? '' : 'Fotoğraflar bulunamadı veya link çözümlenemedi.',
        });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [formModal.open, formModal.loading, formModal.uid, formModal.application, formModal.user]);

  function FieldRow({ label, value, hintKey }) {
    const v = value;
    const isLongText = typeof v === 'string' && v.trim().length > 140;

    return (
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-2 py-2 border-b last:border-b-0">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        <div className={isLongText ? 'text-sm text-slate-900 whitespace-pre-wrap' : 'text-sm text-slate-900'}>
          {formatPrimitive(v, hintKey || label)}
        </div>
      </div>
    );
  }

  function RenderAny({ data, depth = 0, hintKey = '' }) {
    if (depth > 6) {
      return <div className="text-xs text-slate-600">[derin nesne]</div>;
    }

    if (isPrimitive(data)) {
      return <span className="text-sm text-slate-900">{formatPrimitive(data, hintKey)}</span>;
    }

    if (Array.isArray(data)) {
      if (!data.length) {
        const hint = String(hintKey || '').toLowerCase();
        const isPreferenceContext =
          hint.includes('partnerpreferences') ||
          hint.includes('preference') ||
          hint.includes('tercih') ||
          hint.includes('communicationmethods');
        return <span className="text-sm text-slate-500">{isPreferenceContext ? 'Farketmez' : '—'}</span>;
      }

      const allPrimitive = data.every((x) => isPrimitive(x));
      if (allPrimitive) {
        return (
          <div className="flex flex-wrap gap-2">
            {data
              .map((x) => formatPrimitive(x, hintKey))
              .filter((x) => x && x !== '—')
              .slice(0, 40)
              .map((x, i) => (
                <span key={i} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-800 border border-slate-200">
                  {x}
                </span>
              ))}
          </div>
        );
      }

      return (
        <div className="space-y-2">
          {data.slice(0, 20).map((x, idx) => (
            <div key={idx} className="rounded-lg border bg-white p-2">
              <RenderAny data={x} depth={depth + 1} hintKey={hintKey} />
            </div>
          ))}
          {data.length > 20 ? <div className="text-xs text-slate-500">(+{data.length - 20} öğe)</div> : null}
        </div>
      );
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data || {});
      if (!entries.length) return <span className="text-sm text-slate-500">—</span>;

      function shouldHideKeyByPath(path) {
        const p = String(path || '').trim();
        if (!p) return false;
        const low = p.toLowerCase();

        // Teknik / admin için gürültü olan alanlar (ham JSON'da zaten görülebilir)
        if (low === 'application.id') return true;
        if (low === 'application.userid' || low.endsWith('.userid')) return true;
        if (low.endsWith('.applicationid') || low === 'application.applicationid') return true;

        if (low.endsWith('createdat') || low.endsWith('updatedat')) return true;
        if (low.endsWith('createdatms') || low.endsWith('updatedatms')) return true;
        if (low.endsWith('profiletexttranslatedatms') || low.includes('profiletexttranslate')) return true;

        if (low.includes('.pool')) return true;
        if (low.includes('.photocloudinary') || low.includes('.photocontenttypes') || low.includes('.photooriginaltypes')) return true;

        // Checklist/onay alanları (istenmiyor)
        if (low.includes('consent18plus') || low.includes('consentprivacy') || low.includes('consentterms') || low.includes('consentphotoshare') || low.includes('consentmarketing')) return true;

        return false;
      }

      // Büyük/teknik alanları burada göstermek istemiyoruz.
      const skipKeys = new Set([
        'profileTextTranslate',
        'photoUrls',
        'photoPaths',
      ]);

      const shown = entries
        .filter(([k]) => !skipKeys.has(String(k)))
        .sort(([a], [b]) => String(a).localeCompare(String(b), 'tr'));

      return (
        <div className="space-y-3">
          {shown.map(([k, v]) => {
            const key = String(k);
            const label = labelizeKey(key) || key;
            const nextHintKey = hintKey ? `${hintKey}.${key}` : key;

            if (shouldHideKeyByPath(nextHintKey)) return null;

            // Partner prefs içinde boş/varsayılan "Farketmez" değerleri gürültü yapıyor: gizle.
            const isPreferencePath = nextHintKey.toLowerCase().includes('partnerpreferences');
            if (Array.isArray(v) && isPreferencePath && v.length === 0) return null;

            if (isPrimitive(v)) {
              const formatted = formatPrimitive(v, nextHintKey);
              if (formatted === '—') return null;
              if (isPreferencePath && formatted === 'Farketmez') return null;
            }


            // URL gibi görünüyorsa linkle
            if (typeof v === 'string' && looksLikeImageUrl(v)) {
              return (
                <div key={key} className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-2 py-2 border-b last:border-b-0">
                  <div className="text-xs font-semibold text-slate-600">{label}</div>
                  <div className="text-sm">
                    <a className="text-indigo-700 hover:underline break-all" href={v} target="_blank" rel="noreferrer">
                      {v}
                    </a>
                  </div>
                </div>
              );
            }

            if (isPrimitive(v)) {
              return <FieldRow key={key} label={label} value={v} hintKey={nextHintKey} />;
            }

            return (
              <details key={key} className="rounded-lg border border-slate-200 bg-slate-50">
                <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-slate-800">
                  {label}
                </summary>
                <div className="p-3 bg-white border-t border-slate-200">
                  <RenderAny data={v} depth={depth + 1} hintKey={nextHintKey} />
                </div>
              </details>
            );
          })}
        </div>
      );
    }

    return <span className="text-sm text-slate-900">{String(data)}</span>;
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Tüm Kullanıcılar</h2>
          <p className="text-sm text-gray-600">Firebase Auth kullanıcıları listelenir; Firestore (matchmakingUsers) durumları da gösterilir.</p>
        </div>
      </div>

      {campaignState.error ? <p className="mt-3 text-sm text-rose-700">{campaignState.error}</p> : null}
      {campaignState.msg ? <p className="mt-3 text-sm text-emerald-700">{campaignState.msg}</p> : null}

      {Array.isArray(campaignState?.details?.results) && campaignState.details.results.length ? (
        <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-slate-800">
            Push sonucu detayları (ilk {Math.min(20, campaignState.details.results.length)})
          </summary>
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="space-y-1">
              {campaignState.details.results.slice(0, 20).map((r, idx) => (
                <div key={idx} className="text-xs text-slate-800 break-all">
                  <span className="font-semibold">{String(r?.uid || '')}</span>
                  {r?.skipped ? ' • skipped' : r?.dryRun ? ' • dryRun' : ''}
                  {r?.reason ? ` • reason:${String(r.reason)}` : ''}
                  {r?.appSource ? ` • appSource:${String(r.appSource)}` : ''}
                  {r?.appId ? ` • appId:${String(r.appId)}` : ''}
                  {r?.error ? ` • error:${String(r.error)}` : ''}
                </div>
              ))}
            </div>
          </div>
        </details>
      ) : null}

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-3 flex flex-col md:flex-row md:items-center gap-2">
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-800 disabled:opacity-60"
              disabled={acting}
              onClick={bulkMarkSystemUsers}
              title="Mevcut tüm kullanıcıları sistem kullanıcısı olarak işaretle"
            >
              Tümünü Sistem Kullanıcısı Yap
            </button>

            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
              disabled={acting || campaignState.loading}
              onClick={() => sendIncompleteApplicationPushOnce({ dryRun: true })}
              title="Push açık olanlardan formu eksik görünenlere (tek seferlik) dry-run"
            >
              Eksik Forma Push (Dry-run)
            </button>

            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-60"
              disabled={acting || campaignState.loading}
              onClick={() => {
                const ok = window.confirm('Push açık olan ve formu eksik olanlara tek seferlik bildirim gönderilecek. Devam?');
                if (!ok) return;
                sendIncompleteApplicationPushOnce({ dryRun: false });
              }}
              title="Push açık olanlardan formu eksik görünenlere tek seferlik gönder"
            >
              Eksik Forma Push Gönder
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara: UC-..., email veya uid"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />

            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              aria-label="Kayıt tarihine göre sırala"
            >
              <option value="created_desc">Kayıt: En yeni → En eski</option>
              <option value="created_asc">Kayıt: En eski → En yeni</option>
            </select>

            <button
              type="button"
              onClick={loadFirst}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? 'Yükleniyor…' : 'Yükle'}
            </button>
          </div>

          {err ? <p className="mt-2 text-sm text-rose-700">{err}</p> : null}

          <div className="mt-4 border rounded-xl overflow-hidden">
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="text-left px-3 py-2">UC</th>
                    <th className="text-left px-3 py-2">İsim</th>
                    <th className="text-left px-3 py-2">Yaş</th>
                    <th className="text-left px-3 py-2">Cinsiyet</th>
                    <th className="text-left px-3 py-2">WhatsApp</th>
                    <th className="text-left px-3 py-2">Email</th>
                    <th className="text-left px-3 py-2">UID</th>
                    <th className="text-left px-3 py-2">Durum</th>
                    <th className="text-left px-3 py-2">Üyelik</th>
                    <th className="text-left px-3 py-2">Ödeme</th>
                    <th className="text-left px-3 py-2">Kimlik</th>
                    <th className="text-left px-3 py-2">Uygulama</th>
                    <th className="text-left px-3 py-2">Bildirim</th>
                    <th className="text-left px-3 py-2">Oluştu</th>
                    <th className="text-left px-3 py-2">Son giriş</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u) => {
                    const isSelected = selected?.uid && u?.uid === selected.uid;
                    const applicationStatusCode =
                      u?.applicationState === 'real'
                        ? 'FORM'
                        : u?.applicationState === 'cache'
                          ? 'CACHE'
                          : u?.applicationState === 'stub' || u?.applicationState === 'stub_cache'
                            ? 'STUB'
                            : u?.applicationState === 'profile'
                              ? 'PROFILE'
                              : null;
                    const status = [
                      u?.disabled ? 'DISABLED' : null,
                      u?.blocked ? 'BLOCKED' : null,
                      applicationStatusCode,
                      u?.systemUser ? 'SYSTEM' : null,
                      u?.hasAuthRecord === false ? 'NO_AUTH' : null,
                      u?.hasUserDoc ? null : 'NO_DOC',
                    ].filter(Boolean);

                    const membership = u?.membershipActive
                      ? `AKTİF (${String(u?.membershipPlan || '').toUpperCase()})`
                      : u?.membershipPlan
                        ? `PASİF (${String(u?.membershipPlan || '').toUpperCase()})`
                        : '—';

                    const paymentPill = u?.lastApprovedPaymentId
                      ? { label: 'ALINDI', cls: pill('green') }
                      : u?.membershipActive
                        ? { label: 'VAR', cls: pill('green') }
                        : { label: '—', cls: 'text-gray-500' };

                    const identityPill =
                      u?.identityVerified === true
                        ? { label: 'DOĞRULANDI', cls: pill('green') }
                        : u?.identityVerified === false
                          ? { label: 'DOĞRULANMADI', cls: pill('amber') }
                          : { label: '—', cls: 'text-gray-500' };

                    const pwaPill = u?.pwaInstalled
                      ? { label: 'YÜKLÜ', cls: pill('green') }
                      : { label: '—', cls: 'text-gray-500' };

                    const pushPill = u?.pushEnabled
                      ? { label: 'AÇIK', cls: pill('green') }
                      : { label: '—', cls: 'text-gray-500' };

                    return (
                      <tr
                        key={u?.uid}
                        className={
                          'border-t cursor-pointer ' +
                          (isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50')
                        }
                        onClick={() => {
                          selectUser(u);
                          // İstenen UX: Kullanıcıya tıklayınca (fotoğrafı varsa) fotoğrafları görebilmeliyiz.
                          // Form modalı zaten fotoğrafları çözüp gösteriyor; tıklamada otomatik açıyoruz.
                          openFormModal(u?.uid);
                        }}
                      >
                        <td className="px-3 py-2 font-mono">{u?.userCode || '-'}</td>
                        <td className="px-3 py-2">{u?.fullName || '-'}</td>
                        <td className="px-3 py-2">{typeof u?.age === 'number' ? u.age : '-'}</td>
                        <td className="px-3 py-2">{genderLabel(u?.gender)}</td>
                        <td className="px-3 py-2 font-mono break-all">{u?.whatsapp || '-'}</td>
                        <td className="px-3 py-2 break-all">{u?.email || '-'}</td>
                        <td className="px-3 py-2 font-mono">{shortUid(u?.uid)}</td>
                        <td className="px-3 py-2">
                          {status.length ? (
                            <span className="inline-flex flex-wrap gap-1">
                              {status.map((s) => (
                                <span
                                  key={s}
                                  className={
                                    'px-2 py-0.5 rounded-full text-xs ' +
                                    statusPillClass(s)
                                  }
                                >
                                  {statusLabel(s)}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{membership}</td>
                        <td className="px-3 py-2">
                          {paymentPill.cls.includes('text-gray-500') ? (
                            <span className={paymentPill.cls}>{paymentPill.label}</span>
                          ) : (
                            <span className={paymentPill.cls}>{paymentPill.label}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {identityPill.cls.includes('text-gray-500') ? (
                            <span className={identityPill.cls}>{identityPill.label}</span>
                          ) : (
                            <span className={identityPill.cls}>{identityPill.label}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {pwaPill.cls.includes('text-gray-500') ? (
                            <span className={pwaPill.cls}>{pwaPill.label}</span>
                          ) : (
                            <span className={pwaPill.cls}>{pwaPill.label}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {pushPill.cls.includes('text-gray-500') ? (
                            <span className={pushPill.cls}>{pushPill.label}</span>
                          ) : (
                            <span className={pushPill.cls}>{pushPill.label}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{fmtDate(u?.createdAtMs)}</td>
                        <td className="px-3 py-2">{fmtDate(u?.lastSignInAtMs)}</td>
                      </tr>
                    );
                  })}

                  {!users.length && !loading ? (
                    <tr>
                      <td colSpan={14} className="px-3 py-6 text-center text-gray-500">
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-600">Toplam gösterilen: {users.length}</div>
              <button
                type="button"
                className="px-3 py-2 rounded-lg bg-white border text-sm hover:bg-gray-100 disabled:opacity-60"
                disabled={!nextPageToken || loading}
                onClick={loadMore}
              >
                Daha fazla yükle
              </button>
            </div>
          </div>
        </div>

        {selected ? (
          <div className="border rounded-xl p-4 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Seçili Kullanıcı</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={selected.membershipActive ? pill('green') : pill('amber')}>
                    Üyelik: {selected.membershipActive ? 'Aktif' : 'Pasif'}
                  </span>
                  <span className={selected.hasApplication ? pill('green') : pill('amber')}>
                    Başvuru: {applicationStateLabel(selected.applicationState)}
                  </span>
                  <span className={selected.blocked ? pill('red') : pill('slate')}>
                    {selected.blocked ? 'Engelli' : 'Engel yok'}
                  </span>
                  <span className={selected.disabled ? pill('red') : pill('slate')}>
                    Auth: {selected.disabled ? 'Devre dışı' : 'Aktif'}
                  </span>
                  <span className={selected.identityVerified === true ? pill('green') : pill('amber')}>
                    Kimlik: {selected.identityVerified === true ? 'Doğrulandı' : 'Doğrulanmadı'}
                  </span>
                  <span className={selected.pwaInstalled ? pill('green') : pill('amber')}>
                    Uygulama: {selected.pwaInstalled ? 'Yüklü' : 'Yok'}
                  </span>
                  <span className={selected.pushEnabled ? pill('green') : pill('amber')}>
                    Bildirim: {selected.pushEnabled ? 'Açık' : 'Kapalı'}
                  </span>
                  <span className={selected.lastApprovedPaymentId ? pill('green') : pill('amber')}>
                    Ödeme: {selected.lastApprovedPaymentId ? 'Alındı' : 'Yok'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2">
                <button
                  type="button"
                  onClick={() => openFormModal(selectedUid)}
                  disabled={!selectedUid}
                  className="px-3 py-2 rounded-lg bg-white border text-sm hover:bg-gray-100 disabled:opacity-60"
                  title="Seçili kullanıcının form/başvuru detaylarını ve fotoğraflarını göster"
                >
                  Form & Fotoğraflar
                </button>

                <div className="text-xs text-gray-700 space-y-1">
                  {(() => {
                    const app = formModal?.uid && formModal.uid === selectedUid ? formModal.application : null;
                    const city = typeof app?.city === 'string' ? app.city.trim() : '';
                    const country = typeof app?.country === 'string' ? app.country.trim() : '';

                    return (
                      <>
                        <div><span className="font-semibold">UC:</span> <span className="font-mono">{selected.userCode || '-'}</span></div>
                        <div><span className="font-semibold">İsim:</span> {selected.fullName || '-'}</div>
                        <div><span className="font-semibold">Yaş:</span> {typeof selected.age === 'number' ? selected.age : '-'}</div>
                        <div><span className="font-semibold">Cinsiyet:</span> {genderLabel(selected.gender)}</div>
                        <div><span className="font-semibold">Meslek:</span> {formatPrimitive(selected.occupation, 'occupation')}</div>

                        <div><span className="font-semibold">Medeni Durum:</span> {formatPrimitive(selected.maritalStatus, 'maritalStatus')}</div>
                        <div><span className="font-semibold">Çocuğu Var mı:</span> {formatPrimitive(selected.hasChildren, 'hasChildren')}</div>
                        {typeof selected.childrenCount === 'number' ? (
                          <div><span className="font-semibold">Çocuk Sayısı:</span> {formatPrimitive(selected.childrenCount, 'childrenCount')}</div>
                        ) : null}

                        <div><span className="font-semibold">Şehir:</span> {city || '-'}</div>
                        <div><span className="font-semibold">Ülke:</span> {country || '-'}</div>

                        <div><span className="font-semibold">Email:</span> {selected.email || '-'}</div>
                        <div><span className="font-semibold">UID:</span> <span className="font-mono">{selected.uid}</span></div>
                        <div><span className="font-semibold">Üyelik bitiş:</span> {selected.membershipValidUntilMs ? fmtDate(selected.membershipValidUntilMs) : '-'}</div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {actionErr ? <p className="mt-2 text-sm text-rose-700">{actionErr}</p> : null}
            {actionMsg ? <p className="mt-2 text-sm text-emerald-700">{actionMsg}</p> : null}

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border p-3">
                <div className="text-xs font-semibold text-gray-700 mb-2">Onaylar</div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      const ok = window.confirm('Seçili kullanıcı için kimlik doğrulamayı ONAYLA?');
                      if (!ok) return;
                      doAction({ uid: selectedUid, action: 'approveIdentity' });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
                  >
                    Kimlik Doğrulama Onayı
                  </button>

                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => {
                      const ok = window.confirm('Seçili kullanıcı için son bekleyen ödemeyi ONAYLA? (Üyelik de aktif olur)');
                      if (!ok) return;
                      doAction({ uid: selectedUid, action: 'approveLatestPayment' });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-60"
                  >
                    Ödeme Onayı (Son bekleyen)
                  </button>

                  <div className="mt-1">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ödeme ID ile onayla (opsiyonel)</label>
                    <div className="flex gap-2">
                      <input
                        value={paymentId}
                        onChange={(e) => setPaymentId(e.target.value)}
                        className="flex-1 px-2 py-2 border rounded text-sm font-mono"
                        placeholder="paymentId"
                        disabled={acting}
                      />
                      <button
                        type="button"
                        disabled={acting || !String(paymentId || '').trim()}
                        onClick={() => {
                          const ok = window.confirm('Bu ödeme ID kaydını ONAYLA? (Üyelik de aktif olur)');
                          if (!ok) return;
                          doAction({ uid: selectedUid, action: 'approvePayment', paymentId });
                        }}
                        className="px-3 py-2 rounded-lg bg-amber-700 text-white text-sm hover:bg-amber-800 disabled:opacity-60"
                      >
                        ID ile Onayla
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-3">
                <div className="text-xs font-semibold text-gray-700 mb-2">Üyelik</div>
                <div className="flex gap-2">
                  <select
                    value={membershipPlan}
                    onChange={(e) => setMembershipPlan(e.target.value)}
                    className="w-1/2 px-2 py-2 border rounded text-sm"
                    disabled={acting}
                  >
                    <option value="eco">Eko</option>
                    <option value="standard">Standart</option>
                    <option value="pro">Pro</option>
                  </select>
                  <input
                    value={membershipDays}
                    onChange={(e) => setMembershipDays(e.target.value)}
                    className="w-1/2 px-2 py-2 border rounded text-sm"
                    placeholder="Gün (örn 30)"
                    disabled={acting}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() =>
                      doAction({
                        uid: selectedUid,
                        action: 'activateMembership',
                        membershipDays,
                        plan: membershipPlan,
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Üyeliği Aktif Et
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => doAction({ uid: selectedUid, action: 'cancelMembership' })}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-800 disabled:opacity-60"
                  >
                    Üyeliği İptal Et
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-lg border p-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Engelle</div>
                  <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-2 py-2 border rounded text-sm"
                    placeholder="Engelleme nedeni (opsiyonel)"
                    disabled={acting}
                    rows={2}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() => doAction({ uid: selectedUid, action: 'block', reason: blockReason })}
                      className="flex-1 px-3 py-2 rounded-lg bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-60"
                    >
                      Hesabı Engelle
                    </button>
                    <button
                      type="button"
                      disabled={acting}
                      onClick={() => doAction({ uid: selectedUid, action: 'unblock' })}
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm hover:bg-gray-300 disabled:opacity-60"
                    >
                      Engeli Kaldır
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">Not: Engelleme, Auth hesabını da disabled yapar.</p>
                </div>

                <div className="bg-white rounded-lg border border-rose-200 p-3">
                  <div className="text-xs font-semibold text-rose-800 mb-2">Hesabı Sil (Geri alınamaz)</div>
                  <input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-2 py-2 border rounded text-sm font-mono"
                    disabled={acting}
                  />
                  <label className="mt-2 flex items-center gap-2 text-xs text-rose-900">
                    <input
                      type="checkbox"
                      checked={deleteFinal}
                      onChange={(e) => setDeleteFinal(e.target.checked)}
                      disabled={acting}
                    />
                    Evet, geri alınamaz şekilde silmek istiyorum
                  </label>
                  <button
                    type="button"
                    disabled={acting || !deleteFinal}
                    onClick={() =>
                      doAction({
                        uid: selectedUid,
                        action: 'delete',
                        confirmText: deleteConfirmText,
                        confirmFinal: deleteFinal,
                      })
                    }
                    className="mt-2 w-full px-3 py-2 rounded-lg bg-rose-700 text-white text-sm hover:bg-rose-800 disabled:opacity-60"
                  >
                    Hesabı Sil
                  </button>
                  <p className="mt-2 text-xs text-gray-600">Onay metni formatı: <span className="font-mono">delete:&lt;uid&gt;</span></p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-xl p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Seçili Kullanıcı</h3>
            <p className="mt-2 text-sm text-gray-600">Listeden bir kullanıcı seçin.</p>
          </div>
        )}
      </div>

      {formModal.open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={closeFormModal}
        >
          <div
            className="w-full max-w-4xl rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-4 shrink-0 gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">Form Bilgileri</h3>
                <p className="mt-1 text-xs text-slate-600 truncate">
                  UID: <span className="font-mono">{formModal.uid}</span>
                  {formModal.count ? <span className="ml-2">(Bulunan: {formModal.count})</span> : null}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-white border text-sm hover:bg-gray-100"
                  onClick={() => openFormModal(formModal.uid)}
                  disabled={formModal.loading}
                >
                  Yenile
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-white border text-sm hover:bg-gray-100"
                  onClick={() => setShowRawJson((v) => !v)}
                  disabled={formModal.loading}
                  title="Debug için ham JSON göster/gizle"
                >
                  {showRawJson ? 'Ham JSON Gizle' : 'Ham JSON Göster'}
                </button>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto">
              {formModal.error ? <p className="mb-3 text-sm text-rose-700">{formModal.error}</p> : null}

              {formModal.loading ? (
                <p className="text-sm text-slate-700">Yükleniyor…</p>
              ) : (
                <>
                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-sm font-bold text-slate-900">Fotoğraflar</h4>
                    <p className="mt-1 text-xs text-slate-600">Başvuru ve kullanıcı dokümanındaki foto alanlarından çözülür.</p>

                    {formPhotoState.loading ? <div className="mt-2 text-sm text-slate-600">Yükleniyor…</div> : null}
                    {!formPhotoState.loading && formPhotoState.error ? (
                      <div className="mt-2 text-sm text-amber-700">{formPhotoState.error}</div>
                    ) : null}
                    {!formPhotoState.loading && !formPhotoState.error && formPhotoState.urls.length === 0 ? (
                      <div className="mt-2 text-sm text-slate-700">Fotoğraf bulunamadı.</div>
                    ) : null}

                    {formPhotoState.urls.length > 0 ? (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {formPhotoState.urls.map((u, idx) => (
                          <button
                            key={u}
                            type="button"
                            className="block rounded-lg overflow-hidden border border-slate-200 bg-white text-left"
                            onClick={() => setFormLightbox({ open: true, urls: formPhotoState.urls, index: idx, title: 'Fotoğraflar' })}
                            title="Büyüt"
                          >
                            <img src={u} alt="photo" className="w-full h-40 object-cover" loading="lazy" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  {(() => {
                    const hasUserCache = !!(
                      formModal.user?.userCode ||
                      formModal.user?.fullName ||
                      typeof formModal.user?.age === 'number' ||
                      formModal.user?.gender ||
                      (Array.isArray(formModal.user?.photoUrls) && formModal.user.photoUrls.length) ||
                      (Array.isArray(formModal.user?.photoPaths) && formModal.user.photoPaths.length) ||
                      formModal.user?.photoPath ||
                      formModal.user?.details ||
                      formModal.user?.publicProfile ||
                      formModal.user?.application
                    );

                    if (formModal.application) return null;

                    if (hasUserCache) {
                      return (
                        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
                          <p className="font-semibold">Gerçek başvuru dokümanı bulunamadı, kullanıcı önbellek/profil verisi gösteriliyor.</p>
                          <p className="mt-1 text-sky-800">Bu kullanıcı sistemde aktif olabilir; bazı alanlar matchmakingUsers veya publicProfile önbelleğinden geliyor.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="mt-4 text-sm text-slate-700">
                        <p className="font-semibold">Başvuru/Form bulunamadı.</p>
                        <p className="mt-1 text-slate-600">Kullanıcı henüz form doldurmamış olabilir veya kayıt farklı koleksiyonda olabilir.</p>
                      </div>
                    );
                  })()}

                  {formModal.application && String(formModal.application?.source || '').trim().toLowerCase() === 'auto_stub' ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      <p className="font-semibold">Bu kullanıcıda sadece otomatik stub başvuru var.</p>
                      <p className="mt-1 text-amber-800">
                        Kullanıcı başvuru formunu tamamlamamış olabilir. Bu yüzden meslek/medeni durum/çocuk gibi alanlar boş görünebilir.
                      </p>
                    </div>
                  ) : null}

                  {formModal.application && String(formModal.application?.source || '').trim().toLowerCase() === 'user_profile_cache' ? (
                    <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
                      <p className="font-semibold">Bu kayıt kullanıcı profil önbelleğinden derlendi.</p>
                      <p className="mt-1 text-sky-800">Yani ayrı bir matchmakingApplications dokümanı bulunamadı; admin görünümü matchmakingUsers/publicProfile verisini gösteriyor.</p>
                    </div>
                  ) : null}

                  <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-bold text-slate-900">Özet</h4>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-600">Kullanıcı (matchmakingUsers)</div>
                        <div className="mt-2 space-y-1">
                          <div className="text-sm"><span className="text-slate-600">UC:</span> <span className="font-mono">{safeStr(formModal.user?.userCode) || '-'}</span></div>
                          <div className="text-sm"><span className="text-slate-600">Ad Soyad:</span> {safeStr(formModal.user?.fullName) || safeStr(formModal.application?.fullName) || '-'}</div>
                          <div className="text-sm"><span className="text-slate-600">Yaş:</span> {typeof formModal.user?.age === 'number' ? formModal.user.age : (typeof formModal.application?.age === 'number' ? formModal.application.age : '-')}</div>
                          <div className="text-sm"><span className="text-slate-600">Cinsiyet:</span> {formatPrimitive(formModal.user?.gender || formModal.application?.gender, 'gender')}</div>
                          {(() => {
                            const app = formModal.application && typeof formModal.application === 'object' ? formModal.application : null;
                            const appDetails = app?.details && typeof app.details === 'object' ? app.details : null;
                            const userAppDetails = formModal.user?.application?.details && typeof formModal.user.application.details === 'object'
                              ? formModal.user.application.details
                              : null;
                            const userDetails = formModal.user?.details && typeof formModal.user.details === 'object' ? formModal.user.details : null;
                            const ppDetails = formModal.user?.publicProfile?.details && typeof formModal.user.publicProfile.details === 'object'
                              ? formModal.user.publicProfile.details
                              : null;
                            const d = {
                              ...(ppDetails || {}),
                              ...(userDetails || {}),
                              ...(userAppDetails || {}),
                              ...(appDetails || {}),
                            };
                            const occupation = d ? (safeStr(d?.occupationTr) || safeStr(d?.occupation) || safeStr(d?.job) || safeStr(d?.profession)) : '';
                            const maritalStatus = d ? (safeStr(d?.maritalStatus) || safeStr(d?.marital)) : '';
                            const hasChildren = d ? (d?.hasChildren ?? d?.children ?? null) : null;
                            const childrenCount = d ? (d?.childrenCount ?? d?.childCount ?? null) : null;

                            const blocks = [];

                            blocks.push(
                              <div key="occupation" className="text-sm"><span className="text-slate-600">Meslek:</span> {formatPrimitive(occupation || null, 'occupation')}</div>
                            );
                            blocks.push(
                              <div key="maritalStatus" className="text-sm"><span className="text-slate-600">Medeni Durum:</span> {formatPrimitive(maritalStatus || null, 'maritalStatus')}</div>
                            );
                            blocks.push(
                              <div key="hasChildren" className="text-sm"><span className="text-slate-600">Çocuk:</span> {formatPrimitive(hasChildren, 'hasChildren')}</div>
                            );

                            const ccNum = typeof childrenCount === 'number' ? childrenCount : Number(String(childrenCount ?? '').trim());
                            const hasChildrenFmt = formatPrimitive(hasChildren, 'hasChildren');
                            if (hasChildrenFmt === 'Evet' || (Number.isFinite(ccNum) && ccNum >= 0 && ccNum <= 20)) {
                              blocks.push(
                                <div key="childrenCount" className="text-sm"><span className="text-slate-600">Çocuk Sayısı:</span> {Number.isFinite(ccNum) ? String(Math.trunc(ccNum)) : '—'}</div>
                              );
                            }

                            const whatsapp = safeStr(app?.whatsapp);
                            const instagram = safeStr(app?.instagram);
                            if (whatsapp) blocks.push(
                              <div key="whatsapp" className="text-sm"><span className="text-slate-600">WhatsApp:</span> {whatsapp}</div>
                            );
                            if (instagram) blocks.push(
                              <div key="instagram" className="text-sm"><span className="text-slate-600">Instagram:</span> {instagram}</div>
                            );

                            return blocks;
                          })()}
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-600">İletişim Bilgileri</div>
                        <div className="mt-2 space-y-1">
                          {(() => {
                            const app = formModal.application && typeof formModal.application === 'object' ? formModal.application : null;
                            const fromApp = safeStr(app?.whatsapp);
                            const fromSelected = safeStr(selected?.whatsapp);
                            const fromUser = safeStr(formModal.user?.whatsapp) || safeStr(formModal.user?.application?.whatsapp);
                            const v = fromApp || fromSelected || fromUser;

                            if (v) {
                              return (
                                <div className="text-sm">
                                  <span className="text-slate-600">İletişim numarası:</span>{' '}
                                  <span className="font-mono break-all">{v}</span>
                                </div>
                              );
                            }

                            return (
                              <div className="text-sm text-slate-600">İletişim numarası yok</div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold text-slate-600">Başvuru (matchmakingApplications)</div>
                        <div className="mt-2 space-y-1">
                          <div className="text-sm"><span className="text-slate-600">Kaynak:</span> {safeStr(formModal.application?.source) || '-'}</div>
                          <div className="text-sm"><span className="text-slate-600">Durum:</span> {formatPrimitive(formModal.application?.status, 'status')}</div>
                          <div className="text-sm"><span className="text-slate-600">Şehir:</span> {safeStr(formModal.application?.city) || '-'}</div>
                          <div className="text-sm"><span className="text-slate-600">Ülke:</span> {safeStr(formModal.application?.country) || '-'}</div>
                          <div className="text-sm"><span className="text-slate-600">Oluştu:</span> {typeof formModal.application?.createdAtMs === 'number' ? fmtDate(formModal.application.createdAtMs) : (formModal.application?.createdAt?.ms ? fmtDate(formModal.application.createdAt.ms) : '-')}</div>
                          <div className="text-sm"><span className="text-slate-600">Güncellendi:</span> {typeof formModal.application?.updatedAtMs === 'number' ? fmtDate(formModal.application.updatedAtMs) : (formModal.application?.updatedAt?.ms ? fmtDate(formModal.application.updatedAt.ms) : '-')}</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {formModal.application ? (
                    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-bold text-slate-900">Aradığı Kişi (Tercihler)</h4>
                      <p className="mt-1 text-xs text-slate-600">Eşleşme kriterleri: aradığı cinsiyet/uyruk ve partnerPreferences.</p>

                    {(() => {
                      const app = formModal.application && typeof formModal.application === 'object' ? formModal.application : {};
                      const partner = app?.partnerPreferences && typeof app.partnerPreferences === 'object' ? app.partnerPreferences : {};
                      const commMethods = Array.isArray(partner?.communicationMethods)
                        ? partner.communicationMethods.map((x) => String(x || '').trim()).filter(Boolean).join(', ')
                        : partner?.communicationMethods;

                      return (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                          <div>
                            <FieldRow label={labelizeKey('lookingForGender')} value={app?.lookingForGender} hintKey="lookingForGender" />
                            <FieldRow label={labelizeKey('lookingForNationality')} value={app?.lookingForNationality} hintKey="lookingForNationality" />
                            <FieldRow label={labelizeKey('ageMin')} value={partner?.ageMin} hintKey="partnerPreferences.ageMin" />
                            <FieldRow label={labelizeKey('ageMax')} value={partner?.ageMax} hintKey="partnerPreferences.ageMax" />
                            <FieldRow label={labelizeKey('heightMinCm')} value={partner?.heightMinCm} hintKey="partnerPreferences.heightMinCm" />
                            <FieldRow label={labelizeKey('heightMaxCm')} value={partner?.heightMaxCm} hintKey="partnerPreferences.heightMaxCm" />
                            <FieldRow label={labelizeKey('maritalStatus')} value={partner?.maritalStatus} hintKey="partnerPreferences.maritalStatus" />
                            <FieldRow label={labelizeKey('religion')} value={partner?.religion} hintKey="partnerPreferences.religion" />
                          </div>
                          <div>
                            <FieldRow label={labelizeKey('livingCountry')} value={partner?.livingCountry} hintKey="partnerPreferences.livingCountry" />
                            <FieldRow label={labelizeKey('communicationMethods')} value={commMethods} hintKey="partnerPreferences.communicationMethods" />
                            <FieldRow label={labelizeKey('smokingPreference')} value={partner?.smokingPreference} hintKey="partnerPreferences.smokingPreference" />
                            <FieldRow label={labelizeKey('alcoholPreference')} value={partner?.alcoholPreference} hintKey="partnerPreferences.alcoholPreference" />
                            <FieldRow label={labelizeKey('childrenPreference')} value={partner?.childrenPreference} hintKey="partnerPreferences.childrenPreference" />
                            <FieldRow label={labelizeKey('educationPreference')} value={partner?.educationPreference} hintKey="partnerPreferences.educationPreference" />
                            <FieldRow label={labelizeKey('occupationPreference')} value={partner?.occupationPreference} hintKey="partnerPreferences.occupationPreference" />
                            <FieldRow label={labelizeKey('familyValuesPreference')} value={partner?.familyValuesPreference} hintKey="partnerPreferences.familyValuesPreference" />
                          </div>
                        </div>
                      );
                    })()}
                    </section>
                  ) : null}

                  {formModal.application ? (
                    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <h4 className="text-sm font-bold text-slate-900">Doldurulan Alanlar</h4>
                      <p className="mt-1 text-xs text-slate-600">Alanlar otomatik olarak gruplandırılır; nesneler açılabilir.</p>
                      <div className="mt-3">
                        <RenderAny data={formModal.application} hintKey="application" />
                      </div>
                    </section>
                  ) : null}

                  {showRawJson ? (
                    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Ham JSON (debug)</h4>
                          <p className="mt-1 text-xs text-slate-600">Bu bölüm çok uzun olabilir.</p>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-900"
                          onClick={async () => {
                            const normalized = normalizeForJson({ application: formModal.application, user: formModal.user });
                            const text = JSON.stringify(normalized, null, 2);
                            try {
                              await navigator.clipboard.writeText(text);
                            } catch {
                              window.prompt('Kopyalamak için Ctrl+C, Enter', text);
                            }
                          }}
                        >
                          JSON Kopyala
                        </button>
                      </div>
                      <pre className="mt-3 w-full whitespace-pre-wrap break-words text-xs bg-slate-50 border rounded-lg p-3 text-slate-900 overflow-auto">
                        {JSON.stringify(normalizeForJson({ application: formModal.application, user: formModal.user }), null, 2)}
                      </pre>
                    </section>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {formLightbox.open ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setFormLightbox({ open: false, urls: [], index: 0, title: '' })}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-white">{formLightbox.title || 'Fotoğraf'}</p>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm font-semibold text-white/90 hover:bg-white/10"
                onClick={() => setFormLightbox({ open: false, urls: [], index: 0, title: '' })}
              >
                Kapat
              </button>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-black">
              <img
                src={formLightbox.urls[formLightbox.index]}
                alt=""
                className="max-h-[78vh] w-full object-contain"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/40 p-2">
                <button
                  type="button"
                  className="rounded-md px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 disabled:opacity-40"
                  disabled={formLightbox.index <= 0}
                  onClick={() =>
                    setFormLightbox((prev) => ({ ...prev, index: Math.max(0, (prev.index || 0) - 1) }))
                  }
                >
                  Önceki
                </button>
                <div className="text-xs text-white/80">
                  {formLightbox.index + 1} / {formLightbox.urls.length}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={formLightbox.urls[formLightbox.index]}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    Yeni sekmede aç
                  </a>
                  <button
                    type="button"
                    className="rounded-md px-3 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 disabled:opacity-40"
                    disabled={formLightbox.index >= formLightbox.urls.length - 1}
                    onClick={() =>
                      setFormLightbox((prev) => ({
                        ...prev,
                        index: Math.min(prev.urls.length - 1, (prev.index || 0) + 1),
                      }))
                    }
                  >
                    Sonraki
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
