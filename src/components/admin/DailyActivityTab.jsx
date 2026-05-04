import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authFetch } from '../../utils/authFetch';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function getBaseLang(language) {
  const base = String(language || 'tr').toLowerCase().split('-')[0];
  return base === 'en' || base === 'id' ? base : 'tr';
}

const UI = {
  tr: {
    title: 'Günlük Aktivite',
    subtitle: 'Seçili gün için karşılıklı beğeni, tüm mesaj hareketi, karşılıklı sohbetler ve çevrimiçi kullanıcı özeti.',
    loading: 'Yükleniyor…',
    refresh: 'Yenile',
    mutualLikes: 'Karşılıklı Beğeni',
    allMessages: 'Tüm Mesaj Hareketi',
    reciprocalChat: 'Karşılıklı Sohbet',
    online: 'Gün İçinde Çevrimiçi',
    share: 'Arkadaş Daveti / Paylaşım',
    match: 'Eşleşme',
    user: 'Kullanıcı',
    message: 'Mesaj',
    day: 'Gün',
    click: 'Tıklama',
    page: 'Sayfa',
    action: 'Aksiyon',
    time: 'Saat',
    sameDay: 'Aynı gün iki tarafın da yazdığı eşleşme',
    mutualLikeList: 'Karşılıklı Beğeni Listesi',
    activeMessageUsers: 'Mesaj Gönderen Kullanıcılar',
    activeMessageUsersNote: 'Seçili günde tek taraflı olsa bile mesaj gönderen kullanıcılar ve kime yazdıkları.',
    senderRecipientPairs: 'Kim Kime Yazdı',
    senderRecipientPairsNote: 'Seçili günde gönderilen gerçek chat mesajlarının yön bazlı dökümü.',
    activeMessageMatches: 'Mesaj Hareketi Olan Eşleşmeler',
    activeMessageMatchesNote: 'Seçili günde en az bir mesaj gönderilen tüm eşleşmeler; tek taraflı olanlar da dahil.',
    reciprocalUsers: 'Karşılıklı Sohbet Eden Kullanıcılar',
    reciprocalUsersNote: 'Seçili günde mesaj hareketi olan ve toplamda iki tarafın da en az bir kez yazdığı sohbetler.',
    onlineUsers: 'Gün İçinde Çevrimiçi Olan Kullanıcılar',
    reciprocalMatches: 'Karşılıklı Sohbet Eşleşmeleri',
    reciprocalMatchesNote: 'Listede, seçili günde aktif olan ve toplam mesaj geçmişinde iki tarafın da yazdığı eşleşmeler yer alır.',
    referralShareLog: 'Arkadaş Daveti / Paylaşım Tıklama Günlüğü',
    referralShareLogNote: 'Seçili günde arkadaş daveti ve paylaşım butonlarına gelen tekil tıklama kayıtları.',
    headers: ['Eşleşme', 'Kullanıcılar', 'Durum', 'Saat'],
    activeUserHeaders: ['Kullanıcı', 'Mesaj eşleşmesi', 'Gönderdiği mesaj', 'Kime yazdı', 'Son mesaj'],
    pairHeaders: ['Gönderen', 'Alıcı', 'Mesaj', 'Eşleşme', 'Mod', 'Son hareket'],
    userHeaders: ['Kullanıcı', 'Çift yönlü sohbet', 'Gönderdiği mesaj', 'Kime yazdı', 'Son mesaj'],
    onlineHeaders: ['Kullanıcı', 'Cinsiyet', 'Şehir', 'Üyelik', 'Son görülme'],
    activeMatchHeaders: ['Eşleşme', 'Kullanıcılar', 'Mesaj', 'Akış', 'Son mesaj'],
    matchHeaders: ['Eşleşme', 'Kullanıcılar', 'Mesaj', 'Son yön', 'Son mesaj'],
    shareHeaders: ['Saat', 'Platform', 'Aksiyon', 'Sayfa'],
    active: 'Aktif',
    oneWay: 'Tek taraflı',
    reciprocal: 'Karşılıklı',
    emptyLikes: 'Seçili gün için karşılıklı beğeni yok.',
    emptyActiveUsers: 'Seçili gün içinde mesaj gönderen kullanıcı yok.',
    emptyPairs: 'Seçili gün içinde yön bazlı mesaj kaydı yok.',
    emptyActiveMatches: 'Seçili gün içinde mesaj hareketi olan eşleşme yok.',
    emptyChats: 'Seçili gün içinde aktif karşılıklı sohbet yok.',
    emptyOnline: 'Seçili gün için çevrimiçi kullanıcı yok.',
    emptyMatches: 'Seçili gün içinde aktif karşılıklı sohbet eşleşmesi yok.',
    emptyShare: 'Seçili gün için arkadaş daveti/paylaşım tıklaması yok.',
    female: 'Kadın',
    male: 'Erkek',
    noTarget: '—',
    platforms: {
      whatsapp_status: 'WhatsApp durum',
      whatsapp_direct: 'WhatsApp',
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok',
    },
    actions: {
      native: 'Doğal paylaşım',
      fallback: 'Yedek açılış',
      open: 'Açılış',
    },
    warnings: {
      fallback: 'Mesaj raporu hızlı sorgudan alınamadı; eşleşme bazlı yedek tarama kullanıldı.',
      unavailable: 'Mesaj raporu şu an tam yüklenemedi; veri eksik olabilir.',
    },
  },
  en: {
    title: 'Daily Activity',
    subtitle: 'Summary of mutual likes, all message activity, reciprocal chats, and online users for the selected day.',
    loading: 'Loading…',
    refresh: 'Refresh',
    mutualLikes: 'Mutual Likes',
    allMessages: 'All Message Activity',
    reciprocalChat: 'Reciprocal Chats',
    online: 'Online During Day',
    share: 'Friend Invite / Share',
    match: 'Match',
    user: 'User',
    message: 'Message',
    day: 'Day',
    click: 'Click',
    page: 'Page',
    action: 'Action',
    time: 'Time',
    sameDay: 'Matches where both sides wrote on the same day',
    mutualLikeList: 'Mutual Likes List',
    activeMessageUsers: 'Users Who Sent Messages',
    activeMessageUsersNote: 'Users who sent messages on the selected day, including one-sided conversations and who they wrote to.',
    senderRecipientPairs: 'Who Messaged Whom',
    senderRecipientPairsNote: 'Direction-based breakdown of real chat messages sent on the selected day.',
    activeMessageMatches: 'Matches With Message Activity',
    activeMessageMatchesNote: 'All matches with at least one message on the selected day, including one-sided ones.',
    reciprocalUsers: 'Users in Reciprocal Chats',
    reciprocalUsersNote: 'Chats with activity on the selected day where both sides have written at least once overall.',
    onlineUsers: 'Users Online During Day',
    reciprocalMatches: 'Reciprocal Chat Matches',
    reciprocalMatchesNote: 'Matches active on the selected day where both sides have written in total message history.',
    referralShareLog: 'Friend Invite / Share Click Log',
    referralShareLogNote: 'Unique click records for friend invite and share buttons on the selected day.',
    headers: ['Match', 'Users', 'Status', 'Time'],
    activeUserHeaders: ['User', 'Message matches', 'Sent messages', 'Messaged to', 'Last message'],
    pairHeaders: ['Sender', 'Recipient', 'Messages', 'Matches', 'Mode', 'Last activity'],
    userHeaders: ['User', 'Two-way chat', 'Sent messages', 'Messaged to', 'Last message'],
    onlineHeaders: ['User', 'Gender', 'City', 'Membership', 'Last seen'],
    activeMatchHeaders: ['Match', 'Users', 'Messages', 'Flow', 'Last message'],
    matchHeaders: ['Match', 'Users', 'Messages', 'Last direction', 'Last message'],
    shareHeaders: ['Time', 'Platform', 'Action', 'Page'],
    active: 'Active',
    oneWay: 'One-sided',
    reciprocal: 'Reciprocal',
    emptyLikes: 'No mutual likes for the selected day.',
    emptyActiveUsers: 'No users sent messages on the selected day.',
    emptyPairs: 'No direction-based message records on the selected day.',
    emptyActiveMatches: 'No message activity matches for the selected day.',
    emptyChats: 'No active reciprocal chats during the selected day.',
    emptyOnline: 'No online users for the selected day.',
    emptyMatches: 'No active reciprocal chat matches during the selected day.',
    emptyShare: 'No friend invite/share clicks for the selected day.',
    female: 'Female',
    male: 'Male',
    noTarget: '—',
    platforms: {
      whatsapp_status: 'WhatsApp status',
      whatsapp_direct: 'WhatsApp',
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok',
    },
    actions: {
      native: 'Native share',
      fallback: 'Fallback open',
      open: 'Open',
    },
    warnings: {
      fallback: 'Message report could not use the fast query; match-based fallback scan was used.',
      unavailable: 'Message report could not be loaded completely right now; data may be incomplete.',
    },
  },
  id: {
    title: 'Aktivitas Harian',
    subtitle: 'Ringkasan saling suka, semua aktivitas pesan, chat dua arah, dan pengguna online untuk hari yang dipilih.',
    loading: 'Memuat…',
    refresh: 'Segarkan',
    mutualLikes: 'Saling Suka',
    allMessages: 'Semua Aktivitas Pesan',
    reciprocalChat: 'Chat Dua Arah',
    online: 'Online Hari Itu',
    share: 'Undang Teman / Bagikan',
    match: 'Match',
    user: 'Pengguna',
    message: 'Pesan',
    day: 'Hari',
    click: 'Klik',
    page: 'Halaman',
    action: 'Aksi',
    time: 'Waktu',
    sameDay: 'Match saat kedua pihak menulis pada hari yang sama',
    mutualLikeList: 'Daftar Saling Suka',
    activeMessageUsers: 'Pengguna yang Mengirim Pesan',
    activeMessageUsersNote: 'Pengguna yang mengirim pesan pada hari terpilih, termasuk percakapan satu arah dan kepada siapa mereka menulis.',
    senderRecipientPairs: 'Siapa Menulis ke Siapa',
    senderRecipientPairsNote: 'Rincian berbasis arah untuk pesan chat nyata yang dikirim pada hari terpilih.',
    activeMessageMatches: 'Match dengan Aktivitas Pesan',
    activeMessageMatchesNote: 'Semua match dengan setidaknya satu pesan pada hari terpilih, termasuk yang satu arah.',
    reciprocalUsers: 'Pengguna yang Chat Dua Arah',
    reciprocalUsersNote: 'Chat pada hari terpilih di mana kedua pihak pernah menulis setidaknya sekali.',
    onlineUsers: 'Pengguna Online Hari Itu',
    reciprocalMatches: 'Match Chat Dua Arah',
    reciprocalMatchesNote: 'Match aktif pada hari terpilih di mana kedua pihak pernah menulis dalam riwayat pesan.',
    referralShareLog: 'Log Klik Undang Teman / Bagikan',
    referralShareLogNote: 'Catatan klik unik untuk tombol undang teman dan bagikan pada hari yang dipilih.',
    headers: ['Match', 'Pengguna', 'Status', 'Waktu'],
    activeUserHeaders: ['Pengguna', 'Match pesan', 'Pesan terkirim', 'Menulis ke', 'Pesan terakhir'],
    pairHeaders: ['Pengirim', 'Penerima', 'Pesan', 'Match', 'Mode', 'Aktivitas terakhir'],
    userHeaders: ['Pengguna', 'Chat dua arah', 'Pesan terkirim', 'Menulis ke', 'Pesan terakhir'],
    onlineHeaders: ['Pengguna', 'Gender', 'Kota', 'Membership', 'Terakhir terlihat'],
    activeMatchHeaders: ['Match', 'Pengguna', 'Pesan', 'Arus', 'Pesan terakhir'],
    matchHeaders: ['Match', 'Pengguna', 'Pesan', 'Arah terakhir', 'Pesan terakhir'],
    shareHeaders: ['Waktu', 'Platform', 'Aksi', 'Halaman'],
    active: 'Aktif',
    oneWay: 'Satu arah',
    reciprocal: 'Dua arah',
    emptyLikes: 'Tidak ada saling suka untuk hari terpilih.',
    emptyActiveUsers: 'Tidak ada pengguna yang mengirim pesan pada hari terpilih.',
    emptyPairs: 'Tidak ada catatan pesan berbasis arah pada hari terpilih.',
    emptyActiveMatches: 'Tidak ada match dengan aktivitas pesan pada hari terpilih.',
    emptyChats: 'Tidak ada chat dua arah aktif pada hari terpilih.',
    emptyOnline: 'Tidak ada pengguna online untuk hari terpilih.',
    emptyMatches: 'Tidak ada match chat dua arah aktif pada hari terpilih.',
    emptyShare: 'Tidak ada klik undang teman/bagikan untuk hari terpilih.',
    female: 'Perempuan',
    male: 'Laki-laki',
    noTarget: '—',
    platforms: {
      whatsapp_status: 'Status WhatsApp',
      whatsapp_direct: 'WhatsApp',
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok',
    },
    actions: {
      native: 'Bagikan native',
      fallback: 'Buka fallback',
      open: 'Buka',
    },
    warnings: {
      fallback: 'Laporan pesan tidak bisa memakai kueri cepat; pemindaian cadangan berbasis match digunakan.',
      unavailable: 'Laporan pesan belum bisa dimuat penuh saat ini; data mungkin tidak lengkap.',
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

function shortId(s, head = 6, tail = 4) {
  const v = safeStr(s);
  if (!v) return '';
  if (v.length <= head + tail + 1) return v;
  return `${v.slice(0, head)}…${v.slice(-tail)}`;
}

function userLabel(uid, userByUid) {
  const u = userByUid?.[uid] || null;
  const parts = [safeStr(u?.userCode), safeStr(u?.username) ? `@${safeStr(u?.username)}` : '', safeStr(u?.fullName)].filter(Boolean);
  return parts.join(' • ') || shortId(uid, 10, 6) || '—';
}

function matchLabel(item) {
  const code = safeStr(item?.matchCode);
  if (code) return code;
  if (typeof item?.matchNo === 'number' && Number.isFinite(item.matchNo)) return `ES-${item.matchNo}`;
  return shortId(item?.id, 10, 6) || '—';
}

function genderLabel(value, ui) {
  const v = safeStr(value).toLowerCase();
  if (v === 'female') return ui.female;
  if (v === 'male') return ui.male;
  return safeStr(value) || '-';
}

function targetSummary(item, userByUid, ui) {
  const targets = item?.targets && typeof item.targets === 'object' ? item.targets : {};
  const entries = Object.entries(targets)
    .map(([uid, count]) => ({ uid: safeStr(uid), count: safeNum(count) }))
    .filter((entry) => entry.uid && entry.count > 0)
    .sort((a, b) => b.count - a.count);

  if (!entries.length) return ui.noTarget;

  return entries
    .map((entry) => `${userLabel(entry.uid, userByUid)} (${entry.count})`)
    .join(', ');
}

function lastDirectionLabel(item, userByUid, ui) {
  const senderUid = safeStr(item?.lastMessageSenderUid);
  const userIds = Array.isArray(item?.userIds) ? item.userIds.map((uid) => safeStr(uid)).filter(Boolean) : [];
  if (!senderUid || !userIds.length) return ui.noTarget;
  const targets = userIds.filter((uid) => uid !== senderUid);
  if (!targets.length) return userLabel(senderUid, userByUid);
  return `${userLabel(senderUid, userByUid)} -> ${targets.map((uid) => userLabel(uid, userByUid)).join(', ')}`;
}

function platformLabel(value, ui) {
  const key = safeStr(value).toLowerCase();
  return ui?.platforms?.[key] || key.replace(/_/g, ' ') || ui.noTarget;
}

function actionLabel(value, ui) {
  const key = safeStr(value).toLowerCase();
  return ui?.actions?.[key] || key.replace(/_/g, ' ') || ui.noTarget;
}

function messageFlowLabel(item, userByUid, ui) {
  const direction = lastDirectionLabel(item, userByUid, ui);
  const mode = item?.sameDayReciprocal ? ui.reciprocal : ui.oneWay;
  if (!direction || direction === ui.noTarget) return mode;
  return `${mode} • ${direction}`;
}

function pairModeLabel(item, ui) {
  return item?.sameDayReciprocal ? ui.reciprocal : ui.oneWay;
}

export default function DailyActivityTab() {
  const { i18n } = useTranslation();
  const lang = getBaseLang(i18n?.language);
  const ui = UI[lang];

  const [dayKey, setDayKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [data, setData] = useState(null);

  const load = async (nextDayKey = '') => {
    setLoading(true);
    setErr('');
    try {
      const payload = { days: 30, limit: 250, ...(safeStr(nextDayKey || dayKey) ? { dayKey: safeStr(nextDayKey || dayKey) } : {}) };
      const res = await authFetch('/api/admin-daily-activity-summary', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setData(res && typeof res === 'object' ? res : null);
      const resolvedDayKey = safeStr(res?.dayKey);
      if (resolvedDayKey) setDayKey(resolvedDayKey);
    } catch (e) {
      setErr(String(e?.message || 'daily_activity_load_failed'));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
  }, []);

  const summary = data?.summary && typeof data.summary === 'object' ? data.summary : {};
  const userByUid = data?.userByUid && typeof data.userByUid === 'object' ? data.userByUid : {};
  const dayKeys = Array.isArray(data?.dayKeys) ? data.dayKeys : [];
  const mutualLikes = Array.isArray(data?.mutualLikes) ? data.mutualLikes : [];
  const activeMessageMatches = Array.isArray(data?.activeMessageMatches) ? data.activeMessageMatches : [];
  const activeMessageSenders = Array.isArray(data?.activeMessageSenders) ? data.activeMessageSenders : [];
  const senderRecipientPairs = Array.isArray(data?.senderRecipientPairs) ? data.senderRecipientPairs : [];
  const reciprocalMatches = Array.isArray(data?.reciprocalMatches) ? data.reciprocalMatches : [];
  const reciprocalMessagers = Array.isArray(data?.reciprocalMessagers) ? data.reciprocalMessagers : [];
  const onlineUsers = Array.isArray(data?.onlineUsers) ? data.onlineUsers : [];
  const referralShareClicks = Array.isArray(data?.referralShareClicks) ? data.referralShareClicks : [];
  const activeMessageSource = safeStr(data?.activeMessageSource);
  const activeMessageFallbackReason = safeStr(data?.activeMessageFallbackReason);
  const messageWarning = useMemo(() => {
    if (activeMessageSource === 'match_fallback') return ui?.warnings?.fallback || '';
    if (activeMessageSource === 'unavailable') return ui?.warnings?.unavailable || '';
    return '';
  }, [activeMessageSource, ui]);

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{ui.title}</h2>
          <p className="text-sm text-gray-600">{ui.subtitle}</p>
        </div>

        <div className="flex gap-2 items-center">
          <select value={dayKey} onChange={(e) => setDayKey(String(e.target.value || ''))} className="px-3 py-2 border rounded-lg text-sm" disabled={loading}>
            {dayKeys.map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
          <button type="button" onClick={() => load(dayKey)} disabled={loading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
            {loading ? ui.loading : ui.refresh}
          </button>
        </div>
      </div>

      {err ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{err}</div> : null}
      {messageWarning ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {messageWarning}{activeMessageFallbackReason ? ` (${activeMessageFallbackReason})` : ''}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{ui.mutualLikes}</div>
          <div className="text-2xl font-bold text-slate-900">{safeNum(summary?.mutualLikeMatches)}</div>
          <div className="mt-2 text-sm text-slate-700">{ui.match}: <span className="font-bold">{safeNum(summary?.mutualLikeMatches)}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.user}: <span className="font-bold">{safeNum(summary?.mutualLikeUsers)}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{ui.allMessages}</div>
          <div className="text-2xl font-bold text-slate-900">{safeNum(summary?.activeMessageUsers)}</div>
          <div className="mt-2 text-sm text-slate-700">{ui.user}: <span className="font-bold">{safeNum(summary?.activeMessageUsers)}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.match}: <span className="font-bold">{safeNum(summary?.activeMessageMatches)}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.message}: <span className="font-bold">{safeNum(summary?.activeMessageTotal)}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{ui.reciprocalChat}</div>
          <div className="text-2xl font-bold text-slate-900">{safeNum(summary?.reciprocalMessageUsers)}</div>
          <div className="mt-2 text-sm text-slate-700">{ui.user}: <span className="font-bold">{safeNum(summary?.reciprocalMessageUsers)}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.match}: <span className="font-bold">{safeNum(summary?.reciprocalMessageMatches)}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.message}: <span className="font-bold">{safeNum(summary?.reciprocalMessageTotal)}</span></div>
          <div className="mt-1 text-xs text-slate-500">{ui.sameDay}: <span className="font-semibold text-slate-700">{safeNum(summary?.sameDayReciprocalMessageMatches)}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{ui.online}</div>
          <div className="text-2xl font-bold text-slate-900">{safeNum(summary?.onlineUsers)}</div>
          <div className="mt-2 text-sm text-slate-700">{ui.user}: <span className="font-bold">{safeNum(summary?.onlineUsers)}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.day}: <span className="font-bold">{safeStr(data?.dayKey) || '-'}</span></div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">{ui.share}</div>
          <div className="text-2xl font-bold text-slate-900">{safeNum(summary?.referralShareClicks)}</div>
          <div className="mt-2 text-sm text-slate-700">{ui.click}: <span className="font-bold">{safeNum(summary?.referralShareClicks)}</span></div>
          <div className="mt-1 text-sm text-slate-700">{ui.day}: <span className="font-bold">{safeStr(data?.dayKey) || '-'}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">{ui.mutualLikeList}</h3>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {ui.headers.map((header) => (
                    <th key={header} className="text-left px-3 py-2">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mutualLikes.length ? mutualLikes.map((item) => (
                  <tr key={safeStr(item?.id)} className="border-t">
                    <td className="px-3 py-2 font-semibold text-slate-900">{matchLabel(item)}</td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        {(Array.isArray(item?.userIds) ? item.userIds : []).map((uid) => (
                          <div key={uid} className="text-xs text-slate-700">{userLabel(uid, userByUid)}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700">{safeStr(item?.status) || '-'}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(item?.eventAtMs, lang)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="px-3 py-6 text-center text-sm text-slate-500">{ui.emptyLikes}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">{ui.activeMessageUsers}</h3>
            <p className="mt-1 text-xs text-slate-500">{ui.activeMessageUsersNote}</p>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {ui.activeUserHeaders.map((header) => (
                    <th key={header} className="text-left px-3 py-2">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeMessageSenders.length ? activeMessageSenders.map((item) => (
                  <tr key={safeStr(item?.uid)} className="border-t">
                    <td className="px-3 py-2 text-xs text-slate-800">{userLabel(item?.uid, userByUid)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{safeNum(item?.messageMatchCount)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{safeNum(item?.sentCount)}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{targetSummary(item, userByUid, ui)}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(item?.lastMessageAtMs, lang)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">{ui.emptyActiveUsers}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">{ui.senderRecipientPairs}</h3>
            <p className="mt-1 text-xs text-slate-500">{ui.senderRecipientPairsNote}</p>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {ui.pairHeaders.map((header) => (
                    <th key={header} className="text-left px-3 py-2">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {senderRecipientPairs.length ? senderRecipientPairs.map((item, index) => (
                  <tr key={`${safeStr(item?.fromUid)}_${safeStr(item?.toUid)}_${index}`} className="border-t">
                    <td className="px-3 py-2 text-xs text-slate-800">{userLabel(item?.fromUid, userByUid)}</td>
                    <td className="px-3 py-2 text-xs text-slate-800">{userLabel(item?.toUid, userByUid)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{safeNum(item?.sentCount)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{safeNum(item?.matchCount)}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{pairModeLabel(item, ui)}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(item?.lastMessageAtMs, lang)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="px-3 py-6 text-center text-sm text-slate-500">{ui.emptyPairs}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">{ui.reciprocalUsers}</h3>
            <p className="mt-1 text-xs text-slate-500">{ui.reciprocalUsersNote}</p>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {ui.userHeaders.map((header) => (
                    <th key={header} className="text-left px-3 py-2">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reciprocalMessagers.length ? reciprocalMessagers.map((item) => (
                  <tr key={safeStr(item?.uid)} className="border-t">
                    <td className="px-3 py-2 text-xs text-slate-800">{userLabel(item?.uid, userByUid)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{safeNum(item?.reciprocalMatchCount)}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{safeNum(item?.sentCount)}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{targetSummary(item, userByUid, ui)}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(item?.lastMessageAtMs, lang)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">{ui.emptyChats}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-900">{ui.activeMessageMatches}</h3>
          <p className="mt-1 text-xs text-slate-500">{ui.activeMessageMatchesNote}</p>
        </div>
        <div className="max-h-[320px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {ui.activeMatchHeaders.map((header) => (
                  <th key={header} className="text-left px-3 py-2">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeMessageMatches.length ? activeMessageMatches.map((item) => (
                <tr key={safeStr(item?.id)} className="border-t">
                  <td className="px-3 py-2 font-semibold text-slate-900">{matchLabel(item)}</td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      {(Array.isArray(item?.userIds) ? item.userIds : []).map((uid) => (
                        <div key={uid} className="text-xs text-slate-700">{userLabel(uid, userByUid)} <span className="text-slate-500">({safeNum(item?.perUidCount?.[uid])})</span></div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{safeNum(item?.totalMessages)}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{messageFlowLabel(item, userByUid, ui)}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(item?.lastMessageAtMs, lang)}</td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">{ui.emptyActiveMatches}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-900">{ui.onlineUsers}</h3>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {ui.onlineHeaders.map((header) => (
                  <th key={header} className="text-left px-3 py-2">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {onlineUsers.length ? onlineUsers.map((row) => {
                const user = userByUid?.[row.uid] || null;
                return (
                  <tr key={safeStr(row?.uid)} className="border-t">
                    <td className="px-3 py-2 text-xs text-slate-800">{userLabel(row?.uid, userByUid)}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{genderLabel(user?.gender, ui)}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{safeStr(user?.city) || safeStr(user?.country) || '-'}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{user?.membershipActive ? ui.active : '-'}</td>
                    <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(row?.lastSeenAtMs, lang)}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">{ui.emptyOnline}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-900">{ui.referralShareLog}</h3>
          <p className="mt-1 text-xs text-slate-500">{ui.referralShareLogNote}</p>
        </div>
        <div className="max-h-[320px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {ui.shareHeaders.map((header) => (
                  <th key={header} className="text-left px-3 py-2">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referralShareClicks.length ? referralShareClicks.map((item) => (
                <tr key={safeStr(item?.id)} className="border-t">
                  <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(item?.createdAtMs, lang)}</td>
                  <td className="px-3 py-2 text-xs text-slate-800">{platformLabel(item?.platform, ui)}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{actionLabel(item?.action, ui)}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{safeStr(item?.page) || '-'}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="px-3 py-6 text-center text-sm text-slate-500">{ui.emptyShare}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-bold text-slate-900">{ui.reciprocalMatches}</h3>
          <p className="mt-1 text-xs text-slate-500">{ui.reciprocalMatchesNote}</p>
        </div>
        <div className="max-h-[320px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {ui.matchHeaders.map((header) => (
                  <th key={header} className="text-left px-3 py-2">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reciprocalMatches.length ? reciprocalMatches.map((item) => (
                <tr key={safeStr(item?.id)} className="border-t">
                  <td className="px-3 py-2 font-semibold text-slate-900">{matchLabel(item)}</td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      {(Array.isArray(item?.userIds) ? item.userIds : []).map((uid) => (
                        <div key={uid} className="text-xs text-slate-700">{userLabel(uid, userByUid)} <span className="text-slate-500">({safeNum(item?.perUidCount?.[uid])})</span></div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{safeNum(item?.totalMessages)}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{lastDirectionLabel(item, userByUid, ui)}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{fmtDate(item?.lastMessageAtMs, lang)}</td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">{ui.emptyMatches}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}