import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authFetch } from '../../utils/authFetch';
import { formatProfileCode } from '../../utils/profileCode';

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function getBaseLang(language) {
  const base = String(language || 'tr').toLowerCase().split('-')[0];
  return base === 'en' || base === 'id' ? base : 'tr';
}

const UI = {
  tr: {
    copied: 'kopyalandı.',
    copyFailed: 'Kopyalanamadı.',
    noRecord: 'Kayıt yok.',
    noAppInfo: '(Başvuru bilgisi yok)',
    userCode: 'Kullanıcı Kodu:',
    openDetail: 'Detayı aç',
    technicalDetails: 'Teknik detaylar',
    copy: 'Kopyala',
    applicationId: 'Başvuru ID:',
    requested: 'Talep',
    social: 'Sosyal',
    idFront: 'Kimlik (Ön)',
    idBack: 'Kimlik (Arka)',
    selfie: 'Selfie',
    notePlaceholder: 'Not (opsiyonel)',
    approve: 'Onayla',
    reject: 'Reddet',
    title: 'Kimlik Doğrulama',
    pendingInfo: 'Bekleyen doğrulamalar: matchmakingUsers.identityVerification.status == pending',
    total: 'Toplam',
    loadingApplications: 'Başvuru bilgileri yükleniyor…',
    manualTitle: 'Manuel kimlik onayı',
    manualInfo: 'Bekleyen kayıt olmasa bile, kullanıcı kodu (UC-...) ile kullanıcıya doğrulanmış rozetini verebilirsiniz.',
    userCodePlaceholder: 'Kullanıcı Kodu (UC-...)',
    verify: 'Doğrula',
    loading: 'Yükleniyor…',
    whatsapp: 'WhatsApp',
    kyc: 'Otomatik KYC',
    socialMedia: 'Sosyal medya',
    manual: 'Manuel',
    other: 'Diğer',
    userVerified: 'Kullanıcı doğrulandı.',
    verificationRejected: 'Doğrulama reddedildi.',
    actionFailed: 'İşlem başarısız.',
    userNotFound: 'Kullanıcı bulunamadı. (Kullanıcı kodu UC-... olmalı)',
    confirmApprove: 'Bu kullanıcı için kimlik doğrulamayı ONAYLA?\n\nUC: {{userCode}}\nUID: {{uid}}',
    manualApproved: 'Kimlik doğrulama onaylandı (manuel).',
    userId: 'User ID:',
  },
  en: {
    copied: 'copied.',
    copyFailed: 'Copy failed.',
    noRecord: 'No records.',
    noAppInfo: '(No application data)',
    userCode: 'User Code:',
    openDetail: 'Open details',
    technicalDetails: 'Technical details',
    copy: 'Copy',
    applicationId: 'Application ID:',
    requested: 'Requested',
    social: 'Social',
    idFront: 'ID (Front)',
    idBack: 'ID (Back)',
    selfie: 'Selfie',
    notePlaceholder: 'Note (optional)',
    approve: 'Approve',
    reject: 'Reject',
    title: 'Identity Verification',
    pendingInfo: 'Pending verifications: matchmakingUsers.identityVerification.status == pending',
    total: 'Total',
    loadingApplications: 'Loading application details…',
    manualTitle: 'Manual identity approval',
    manualInfo: 'Even if there is no pending record, you can grant the verified badge using the user code (UC-...).',
    userCodePlaceholder: 'User Code (UC-...)',
    verify: 'Verify',
    loading: 'Loading…',
    whatsapp: 'WhatsApp',
    kyc: 'Automatic KYC',
    socialMedia: 'Social media',
    manual: 'Manual',
    other: 'Other',
    userVerified: 'User verified.',
    verificationRejected: 'Verification rejected.',
    actionFailed: 'Action failed.',
    userNotFound: 'User not found. (User code must be UC-...)',
    confirmApprove: 'APPROVE identity verification for this user?\n\nUC: {{userCode}}\nUID: {{uid}}',
    manualApproved: 'Identity verification approved (manual).',
    userId: 'User ID:',
  },
  id: {
    copied: 'disalin.',
    copyFailed: 'Gagal menyalin.',
    noRecord: 'Tidak ada data.',
    noAppInfo: '(Tidak ada data aplikasi)',
    userCode: 'Kode Pengguna:',
    openDetail: 'Buka detail',
    technicalDetails: 'Detail teknis',
    copy: 'Salin',
    applicationId: 'ID Aplikasi:',
    requested: 'Diminta',
    social: 'Sosial',
    idFront: 'ID (Depan)',
    idBack: 'ID (Belakang)',
    selfie: 'Selfie',
    notePlaceholder: 'Catatan (opsional)',
    approve: 'Setujui',
    reject: 'Tolak',
    title: 'Verifikasi Identitas',
    pendingInfo: 'Verifikasi tertunda: matchmakingUsers.identityVerification.status == pending',
    total: 'Total',
    loadingApplications: 'Memuat detail aplikasi…',
    manualTitle: 'Persetujuan identitas manual',
    manualInfo: 'Meski tidak ada data tertunda, Anda bisa memberi badge terverifikasi dengan kode pengguna (UC-...).',
    userCodePlaceholder: 'Kode Pengguna (UC-...)',
    verify: 'Verifikasi',
    loading: 'Memuat…',
    whatsapp: 'WhatsApp',
    kyc: 'KYC Otomatis',
    socialMedia: 'Media sosial',
    manual: 'Manual',
    other: 'Lainnya',
    userVerified: 'Pengguna diverifikasi.',
    verificationRejected: 'Verifikasi ditolak.',
    actionFailed: 'Aksi gagal.',
    userNotFound: 'Pengguna tidak ditemukan. (Kode pengguna harus UC-...)',
    confirmApprove: 'SETUJUI verifikasi identitas untuk pengguna ini?\n\nUC: {{userCode}}\nUID: {{uid}}',
    manualApproved: 'Verifikasi identitas disetujui (manual).',
    userId: 'User ID:',
  },
};

function fmtTs(ts, lang) {
  try {
    const ms = typeof ts?.toMillis === 'function' ? ts.toMillis() : (typeof ts === 'number' ? ts : 0);
    if (!ms) return '-';
    return new Intl.DateTimeFormat(lang, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ms));
  } catch {
    return '-';
  }
}

function shortId(v, head = 6, tail = 4) {
  const s = safeStr(v);
  if (!s) return '';
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

async function copyTextToClipboard(s) {
  const v = safeStr(s);
  if (!v) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(v);
      return true;
    }
  } catch {
    // ignore
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = v;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.left = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return !!ok;
  } catch {
    return false;
  }
}

function renderFileLink(label, url) {
  const u = safeStr(url);
  if (!u) return null;
  return (
    <a
      key={label}
      href={u}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50"
    >
      {label}
    </a>
  );
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function formatGender(value, lang) {
  const v = safeStr(value).toLowerCase();
  if (v === 'female') return lang === 'tr' ? 'Kadın' : lang === 'id' ? 'Perempuan' : 'Female';
  if (v === 'male') return lang === 'tr' ? 'Erkek' : lang === 'id' ? 'Laki-laki' : 'Male';
  return safeStr(value);
}

function formatPersonSummary(app, userDoc, lang) {
  const fullName = safeStr(app?.fullName) || safeStr(userDoc?.fullName) || safeStr(userDoc?.publicProfile?.fullName) || safeStr(userDoc?.details?.fullName);
  const age =
    (typeof app?.age === 'number' ? app.age : null) ??
    (typeof userDoc?.age === 'number' ? userDoc.age : null);
  const gender = formatGender(safeStr(app?.gender) || safeStr(userDoc?.gender), lang);
  const city = safeStr(app?.city) || safeStr(userDoc?.city);
  const country = safeStr(app?.country) || safeStr(userDoc?.country);
  const username = safeStr(app?.username) || safeStr(userDoc?.username);
  const profileCode = safeStr(app?.profileCode) || safeStr(userDoc?.profileCode) || safeStr(userDoc?.userCode);

  const bits = [];
  if (fullName) bits.push(fullName);
  if (username) bits.push(`@${username}`);
  if (profileCode) bits.push(profileCode);
  if (age !== null) bits.push(String(age));
  if (gender) bits.push(gender);
  if (city || country) bits.push([city, country].filter(Boolean).join(', '));
  return bits.length ? bits.join(' • ') : '';
}

export default function MatchmakingIdentityTab() {
  const { i18n } = useTranslation();
  const lang = getBaseLang(i18n?.language);
  const ui = UI[lang];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [noteByUserId, setNoteByUserId] = useState({});
  const [appByUserId, setAppByUserId] = useState({});
  const [appsLoading, setAppsLoading] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState('');

  const [manualUserCode, setManualUserCode] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [manualActing, setManualActing] = useState(false);
  const [manualMsg, setManualMsg] = useState('');
  const [manualErr, setManualErr] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErr('');
      try {
        setAppsLoading(true);
        const data = await authFetch('/api/admin-identity-verifications-list', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ limit: 100 }),
        });
        if (!cancelled) {
          setItems(Array.isArray(data?.items) ? data.items : []);
          setAppByUserId(data?.appByUserId && typeof data.appByUserId === 'object' ? data.appByUserId : {});
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setAppByUserId({});
          setErr(String(e?.message || ui.actionFailed));
        }
      } finally {
        if (!cancelled) {
          setAppsLoading(false);
          setLoading(false);
        }
      }
    };

    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [ui.actionFailed]);

  const approve = async (userId, ok) => {
    setActing(true);
    setErr('');
    setMsg('');
    try {
      await authFetch('/api/matchmaking-admin-identity-verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId,
          status: ok ? 'verified' : 'rejected',
          note: safeStr(noteByUserId?.[userId]),
        }),
      });

      setMsg(ok ? ui.userVerified : ui.verificationRejected);
      setNoteByUserId((p) => ({ ...p, [userId]: '' }));
    } catch (e) {
      setErr(String(e?.message || ui.actionFailed));
    } finally {
      setActing(false);
    }
  };

  const approveManual = async () => {
    const userCode = safeStr(manualUserCode);
    if (!userCode) return;

    setManualActing(true);
    setManualErr('');
    setManualMsg('');

    try {
      const lookup = await authFetch('/api/admin-users-list', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: userCode, pageSize: 1 }),
      });

      const uid = safeStr(lookup?.users?.[0]?.uid);
      if (!uid) {
        setManualErr(ui.userNotFound);
        return;
      }

      const ok = window.confirm(ui.confirmApprove.replace('{{userCode}}', userCode).replace('{{uid}}', uid));
      if (!ok) return;

      await authFetch('/api/admin-user-action', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          uid,
          action: 'approveIdentity',
          note: safeStr(manualNote) || null,
        }),
      });

      setManualMsg(ui.manualApproved);
      setManualNote('');
    } catch (e) {
      setManualErr(String(e?.message || ui.actionFailed));
    } finally {
      setManualActing(false);
    }
  };

  const grouped = useMemo(() => {
    const byMethod = { whatsapp: [], kyc: [], manual: [], social: [], other: [] };
    for (const u of items) {
      const m = safeStr(u?.identityVerification?.method).toLowerCase();
      if (m === 'whatsapp') byMethod.whatsapp.push(u);
      else if (m === 'kyc') byMethod.kyc.push(u);
      else if (m === 'manual') byMethod.manual.push(u);
      else if (m === 'social') byMethod.social.push(u);
      else byMethod.other.push(u);
    }
    return byMethod;
  }, [items]);

  const renderList = (rows) => {
    if (rows.length === 0) return <p className="text-sm text-slate-600 mt-2">{ui.noRecord}</p>;

    return (
      <div className="mt-3 space-y-3">
        {rows.map((u) => {
          const userId = u.id;
          const method = safeStr(u?.identityVerification?.method) || '-';
          const ref = safeStr(u?.identityVerification?.referenceCode) || '-';
          const requestedAt = u?.identityVerification?.requestedAt || u?.updatedAt || null;
          const files = u?.identityVerification?.files || null;
          const hasFiles = !!(safeStr(files?.idFrontUrl) || safeStr(files?.idBackUrl) || safeStr(files?.selfieUrl));
          const app = appByUserId?.[userId] || null;
          const person = formatPersonSummary(app, u, lang);
          const appId = safeStr(app?.id);
          const profileCode = formatProfileCode(app);

          const copy = async (label, value) => {
            const ok = await copyTextToClipboard(value);
            setCopiedMsg(ok ? `${label} ${ui.copied}` : ui.copyFailed);
            window.setTimeout(() => setCopiedMsg(''), 2000);
          };

          return (
            <div key={userId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {person || profileCode ? <span>{person || profileCode}</span> : <span className="text-slate-900">{ui.noAppInfo}</span>}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {profileCode ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-800">
                        {ui.userCode} <span className="ml-1 font-mono">{profileCode}</span>
                      </span>
                    ) : null}

                    {appId ? (
                      <Link
                        to={`/admin/matchmaking/${encodeURIComponent(appId)}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-full bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800"
                      >
                        {ui.openDetail}
                      </Link>
                    ) : null}
                  </div>

                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-800">{ui.technicalDetails}</summary>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-800">
                        <span className="text-slate-600">{ui.userId}</span>
                        <span className="font-mono">{shortId(userId)}</span>
                        <button type="button" onClick={() => copy('User ID', userId)} className="font-semibold text-sky-700 hover:underline">
                          {ui.copy}
                        </button>
                      </span>
                      {appId ? (
                        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-800">
                          <span className="text-slate-600">{ui.applicationId}</span>
                          <span className="font-mono">{shortId(appId)}</span>
                          <button type="button" onClick={() => copy(ui.applicationId.replace(':', ''), appId)} className="font-semibold text-sky-700 hover:underline">
                            {ui.copy}
                          </button>
                        </span>
                      ) : null}
                    </div>
                  </details>
                  <p className="text-xs text-slate-600 mt-1">
                    Method: <span className="font-semibold">{method}</span> • Ref:{' '}
                    <span className="font-semibold">{ref}</span>
                  </p>
                  <p className="text-xs text-slate-600">{ui.requested}: {fmtTs(requestedAt, lang)}</p>

                  {(() => {
                    const social = u?.identityVerification?.social && typeof u.identityVerification.social === 'object' ? u.identityVerification.social : null;
                    const plat = safeStr(social?.platform);
                    const uname = safeStr(social?.username);
                    if (safeStr(method).toLowerCase() !== 'social') return null;
                    if (!plat && !uname) return null;
                    return (
                      <div className="mt-2 text-xs text-slate-700">
                        <span className="font-semibold">{ui.social}</span>: {plat || '-'} {uname ? <span className="font-mono">@{uname}</span> : null}
                      </div>
                    );
                  })()}

                  {hasFiles ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {renderFileLink(ui.idFront, files?.idFrontUrl)}
                      {renderFileLink(ui.idBack, files?.idBackUrl)}
                      {renderFileLink(ui.selfie, files?.selfieUrl)}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <input
                    value={noteByUserId?.[userId] || ''}
                    onChange={(e) => setNoteByUserId((p) => ({ ...p, [userId]: e.target.value }))}
                    placeholder={ui.notePlaceholder}
                    className="w-full sm:w-72 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    disabled={acting}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => approve(userId, true)}
                      disabled={acting}
                      className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {ui.approve}
                    </button>
                    <button
                      type="button"
                      onClick={() => approve(userId, false)}
                      disabled={acting}
                      className="px-4 py-2 rounded-full bg-rose-700 text-white text-sm font-semibold hover:bg-rose-800 disabled:opacity-60"
                    >
                      {ui.reject}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{ui.title}</h2>
            <p className="text-sm text-slate-600">{ui.pendingInfo}</p>
          </div>
          <div className="text-xs text-slate-600">{ui.total}: <span className="font-semibold text-slate-900">{items.length}</span></div>
        </div>

        {appsLoading ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800 text-sm">
            {ui.loadingApplications}
          </div>
        ) : null}

        {copiedMsg ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-900 text-sm">{copiedMsg}</div>
        ) : null}

        {msg ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">{msg}</div>
        ) : null}
        {err ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">{err}</div>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">{ui.manualTitle}</h3>
        <p className="mt-1 text-xs text-slate-600">{ui.manualInfo}</p>

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            value={manualUserCode}
            onChange={(e) => setManualUserCode(e.target.value)}
            placeholder={ui.userCodePlaceholder}
            className="w-full sm:flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={manualActing}
          />
          <input
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
            placeholder={ui.notePlaceholder}
            className="w-full sm:flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={manualActing}
          />
          <button
            type="button"
            onClick={approveManual}
            disabled={manualActing || !safeStr(manualUserCode)}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {ui.verify}
          </button>
        </div>

        {manualMsg ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-sm">{manualMsg}</div>
        ) : null}
        {manualErr ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 text-sm">{manualErr}</div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{ui.loading}</div>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{ui.whatsapp}</p>
            {renderList(grouped.whatsapp)}
          </section>
          <section className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{ui.kyc}</p>
            {renderList(grouped.kyc)}
          </section>
          <section className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{ui.socialMedia}</p>
            {renderList(grouped.social)}
          </section>
          <section className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{ui.manual}</p>
            {renderList(grouped.manual)}
          </section>
          <section className="rounded-2xl bg-white border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{ui.other}</p>
            {renderList(grouped.other)}
          </section>
        </div>
      )}
    </div>
  );
}
