import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../config/firebaseStorage';
import { authFetch } from '../../utils/authFetch';
import { formatProfileCode } from '../../utils/profileCode';
import { getDraftFieldLabel, getDraftProgressInfo } from '../../utils/adminDraftProgress';
import {
  dedupeAdminNewUsers,
  getAdminNewUserKind,
  hasKnownAccountIdentity,
  pickAccountDisplayName,
  pickAccountEmail,
  resolveAdminNewUserGender,
  resolveAdminNewUserUid,
  safeStr,
} from '../../utils/adminNewUsers';

const LS_NOTIFY_KEY = 'admin_new_users_notify_v1';
const LS_SOUND_KEY = 'admin_new_users_sound_v1';

function formatTs(ts) {
  try {
    if (!ts) return '';
    if (typeof ts.toDate === 'function') {
      const d = ts.toDate();
      return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    }
    return String(ts);
  } catch {
    return '';
  }
}

function normalizeForJson(value) {
  if (value === null || value === undefined) return value;

  // Firestore Timestamp
  if (value && typeof value === 'object' && typeof value.toDate === 'function') {
    try {
      return value.toDate().toISOString();
    } catch {
      return String(value);
    }
  }

  if (Array.isArray(value)) return value.map(normalizeForJson);

  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalizeForJson(v);
    return out;
  }

  return value;
}

function getUcCodeFromUserDoc(userDoc) {
  const uc = safeStr(userDoc?.userCode) || safeStr(userDoc?.publicProfile?.userCode);
  return uc;
}

function getUcCodeFromApplicationDoc(appDoc) {
  const uc = safeStr(appDoc?.userCode) || safeStr(appDoc?.publicProfile?.userCode);
  return uc;
}

function getKindLabel(kind) {
  if (kind === 'filled') return 'Form';
  if (kind === 'partial') return 'On Kayit';
  if (kind === 'unknown') return 'Bilinmeyen';
  return 'Eksik Form';
}

function getKindPillClass(kind) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border';
  if (kind === 'filled') return `${base} border-emerald-200 bg-emerald-50 text-emerald-900`;
  if (kind === 'partial') return `${base} border-amber-200 bg-amber-50 text-amber-900`;
  if (kind === 'unknown') return `${base} border-rose-200 bg-rose-50 text-rose-900`;
  return `${base} border-slate-200 bg-slate-50 text-slate-800`;
}

function loadBool(key, fallback = false) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === '1') return true;
    if (raw === '0') return false;
    return fallback;
  } catch {
    return fallback;
  }
}

function saveBool(key, value) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // ignore
  }
}

function canNotify() {
  try {
    return typeof window !== 'undefined' && typeof window.Notification !== 'undefined';
  } catch {
    return false;
  }
}

function notificationPermission() {
  if (!canNotify()) return 'unsupported';
  try {
    return Notification.permission;
  } catch {
    return 'unsupported';
  }
}

async function ensureNotificationPermission() {
  if (!canNotify()) return 'unsupported';
  const cur = notificationPermission();
  if (cur === 'granted' || cur === 'denied') return cur;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'default';
  }
}

function playMelody(durationMs = 2000) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    gain.gain.value = 0.0;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const dur =
      typeof durationMs === 'number' && Number.isFinite(durationMs) ? Math.max(400, Math.min(10_000, durationMs)) : 2000;
    const start = ctx.currentTime;
    const end = start + dur / 1000;

    // Gentle ramp to avoid clicks.
    gain.gain.setValueAtTime(0.0, start);
    gain.gain.linearRampToValueAtTime(0.08, start + 0.03);
    gain.gain.setValueAtTime(0.08, Math.max(start + 0.03, end - 0.15));
    gain.gain.linearRampToValueAtTime(0.0, end);

    // Melodic alert: small arpeggio loop (C5-E5-G5-C6) repeated.
    // Frequencies (Hz): C5=523.25, E5=659.25, G5=783.99, C6=1046.50
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25];
    const step = 0.22;
    let t = start;
    // Start at first note.
    osc.frequency.setValueAtTime(notes[0], t);
    while (t < end) {
      for (let i = 0; i < notes.length; i += 1) {
        const at = t + i * step;
        if (at >= end) break;
        // Quick glide for a nicer feel.
        osc.frequency.setValueAtTime(notes[i], at);
        const nextAt = Math.min(end, at + step);
        const next = notes[(i + 1) % notes.length];
        osc.frequency.linearRampToValueAtTime(next, Math.min(end, nextAt));
      }
      t += notes.length * step;
    }

    osc.start();
    osc.stop(end);
    osc.onended = () => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    };
  } catch {
    // ignore
  }
}

async function testNotify() {
  const perm = await ensureNotificationPermission();
  if (perm !== 'granted') return { ok: false, perm };
  try {
    const n = new Notification('Test bildirimi', {
      body: 'Yeni kullanıcı bildirimi bu şekilde gelecek.',
    });
    n.onclick = () => {
      try {
        window.focus();
      } catch {
        // ignore
      }
    };
  } catch {
    return { ok: false, perm: 'granted_but_failed' };
  }
  return { ok: true, perm };
}

function displayUserLabel(it, userDoc = null) {
  const username = safeStr(it?.username) || safeStr(userDoc?.username);
  if (username) return `@${username}`;

  const fullName = safeStr(it?.fullName) || safeStr(userDoc?.fullName) || safeStr(userDoc?.publicProfile?.fullName);
  if (fullName) return fullName;

  const displayName = pickAccountDisplayName(it, userDoc);
  if (displayName) return displayName;

  const accountEmail = pickAccountEmail(it, userDoc);
  if (accountEmail) return accountEmail;

  if (getAdminNewUserKind(it, userDoc) === 'unknown' && !hasKnownAccountIdentity(it, userDoc)) return 'Bilinmeyen kullanıcı';

  const profile = formatProfileCode(it);
  if (profile) return profile;

  return '-';
}

function GenderPill({ gender }) {
  const g = String(gender || '');
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border';
  if (g === 'female') return <span className={`${base} border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900`}>Kadın</span>;
  if (g === 'male') return <span className={`${base} border-sky-200 bg-sky-50 text-sky-900`}>Erkek</span>;
  return <span className={`${base} border-slate-200 bg-slate-50 text-slate-700`}>{g || '-'}</span>;
}

function draftUpdatedAtLabel(ms) {
  if (!ms || typeof ms !== 'number') return '-';
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(ms));
  } catch {
    return '-';
  }
}

function Modal({ open, onClose, item, userDoc }) {
  const [photoUrls, setPhotoUrls] = useState([]);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!open || !item) return;

      setPhotoLoading(true);
      try {
        const urls = [];

        const directUrls = Array.isArray(item.photoUrls) ? item.photoUrls : [];
        for (const u of directUrls) {
          if (typeof u === 'string' && u.trim()) urls.push(u.trim());
        }

        if (!urls.length) {
          const paths = Array.isArray(item.photoPaths) ? item.photoPaths : [];
          const legacy = typeof item.photoPath === 'string' ? [item.photoPath] : [];
          const all = [...paths, ...legacy];

          for (const p of all) {
            if (!p || typeof p !== 'string') continue;
            try {
              urls.push(await getDownloadURL(ref(storage, p)));
            } catch {
              // ignore
            }
          }
        }

        if (!cancelled) setPhotoUrls(urls);
      } finally {
        if (!cancelled) setPhotoLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [open, item]);

  if (!open || !item) return null;

  const safe = normalizeForJson(item);
  const safeUser = normalizeForJson(userDoc);
  const ucCode = getUcCodeFromApplicationDoc(item) || getUcCodeFromUserDoc(userDoc);
  const hideSensitive = getAdminNewUserKind(item, userDoc) === 'unknown' && !hasKnownAccountIdentity(item, userDoc);
  const draftInfo = getDraftProgressInfo(item);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl max-h-[85vh] overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate">{displayUserLabel(item, userDoc)}</h3>
                <GenderPill gender={item.gender} />
                {ucCode ? (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-900">
                    {ucCode}
                  </span>
                ) : null}
                {formatProfileCode(item) ? (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-800">
                    {formatProfileCode(item)}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Kayıt: <span className="font-semibold text-slate-900">{formatTs(item.createdAt) || '-'}</span>
                {item?.id && !hideSensitive ? (
                  <>
                    {' '}• Başvuru ID: <span className="font-mono text-[11px] text-slate-800">{String(item.id)}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {item?.id ? (
                <Link
                  to={`/admin/matchmaking/${item.id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Formu sayfada aç
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-bold text-slate-900">Görseller (sansürsüz)</h4>
            {photoLoading ? <div className="mt-2 text-sm text-slate-600">Yükleniyor…</div> : null}
            {!photoLoading && photoUrls.length === 0 ? (
              <div className="mt-2 text-sm text-slate-700">Görsel bulunamadı.</div>
            ) : null}

            {photoUrls.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {photoUrls.map((u) => (
                  <a
                    key={u}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg overflow-hidden border border-slate-200 bg-white"
                    title="Yeni sekmede aç"
                  >
                    <img src={u} alt="photo" className="w-full h-40 object-cover" loading="lazy" />
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-bold text-slate-900">Kullanıcı Kodu</h4>
            <div className="mt-2 text-sm text-slate-800">{ucCode || '-'}</div>
            <p className="mt-1 text-xs text-slate-600">Bu kod `matchmakingUsers.userCode` alanından gelir (UC-...).</p>
          </section>

          {draftInfo ? (
            <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <h4 className="text-sm font-bold text-indigo-950">Form Drop-off Özeti</h4>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-indigo-950">
                <div><span className="text-indigo-700">İlerleme:</span> {draftInfo.totalRequiredCount > 0 ? `${draftInfo.completedRequiredCount}/${draftInfo.totalRequiredCount}` : '-'}</div>
                <div><span className="text-indigo-700">Takıldığı alan:</span> {draftInfo.firstMissingRequiredLabel}</div>
                <div><span className="text-indigo-700">Son dokunduğu alan:</span> {draftInfo.lastInputKey ? draftInfo.lastInputLabel : '-'}</div>
                <div><span className="text-indigo-700">Son taslak kaydı:</span> {draftUpdatedAtLabel(draftInfo.draftUpdatedAtMs)}</div>
              </div>
              {draftInfo.completedRequiredKeys.length > 0 ? (
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Tamamlanan zorunlu alanlar</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {draftInfo.completedRequiredKeys.map((key) => (
                      <span key={key} className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-2 py-1 text-[11px] font-semibold text-indigo-900">
                        {key === 'photo' && draftInfo.photoComplete ? 'Fotoğraf' : getDraftFieldLabel(key)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-bold text-slate-900">Form Bilgileri (tamamı)</h4>
            <p className="mt-1 text-xs text-slate-600">Aşağıdaki JSON, başvuru dokümanındaki tüm alanları içerir.</p>
            <pre className="mt-3 max-h-[40vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-800">
{JSON.stringify(safe, null, 2)}
            </pre>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-bold text-slate-900">Kullanıcı Dokümanı (matchmakingUsers)</h4>
            <p className="mt-1 text-xs text-slate-600">Kullanıcı kodu ve sistem alanları bu dokümanda durur.</p>
            <pre className="mt-3 max-h-[40vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-800">
{JSON.stringify(safeUser, null, 2)}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function NewUsersTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [activeGender, setActiveGender] = useState('all');

  const [notifyEnabled, setNotifyEnabled] = useState(() => loadBool(LS_NOTIFY_KEY, false));
  const [soundEnabled, setSoundEnabled] = useState(() => loadBool(LS_SOUND_KEY, true));
  const [notifyHint, setNotifyHint] = useState('');
  const previousIdsRef = useRef(new Set());
  const didInitLoadRef = useRef(false);

  const [userInfoByUid, setUserInfoByUid] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await authFetch('/api/admin-new-users-list', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sinceMs: todayStart, limit: 300, window: 'today' }),
        });
        if (cancelled) return;

        const nextItems = Array.isArray(data?.items) ? data.items : [];
        const nextUserInfo = data?.userInfoByUid && typeof data.userInfoByUid === 'object' ? data.userInfoByUid : {};
        const nextIds = new Set(nextItems.map((it) => safeStr(it?.id)).filter(Boolean));
        const isFirst = !didInitLoadRef.current;

        if (!isFirst && notifyEnabled && canNotify() && notificationPermission() === 'granted') {
          const prevIds = previousIdsRef.current;
          const addedItems = nextItems.filter((it) => {
            const itemId = safeStr(it?.id);
            return itemId && !prevIds.has(itemId);
          });

          for (const added of addedItems) {
            const uid = resolveAdminNewUserUid(added);
            const userDoc = uid ? nextUserInfo?.[uid] : null;
            const gender = safeStr(added?.gender) || '-';
            const label = displayUserLabel(added, userDoc);
            const code = formatProfileCode(added) || '';

            try {
              const n = new Notification('Yeni kullanıcı başvurusu', {
                body: `${gender} • ${label}${code ? ` • ${code}` : ''}`,
              });
              n.onclick = () => {
                try {
                  window.focus();
                } catch {
                  // ignore
                }
              };
            } catch {
              // ignore
            }

            if (soundEnabled) playMelody(2000);
          }
        }

        previousIdsRef.current = nextIds;
        if (!didInitLoadRef.current) didInitLoadRef.current = true;
        setItems(nextItems);
        setUserInfoByUid(nextUserInfo);
      } catch (e) {
        if (cancelled) return;
        setItems([]);
        setUserInfoByUid({});
        setError(String(e?.message || 'Bugünkü kayıtlar yüklenemedi.'));
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
  }, [notifyEnabled, soundEnabled, todayStart]);

  useEffect(() => {
    saveBool(LS_NOTIFY_KEY, notifyEnabled);
  }, [notifyEnabled]);

  useEffect(() => {
    saveBool(LS_SOUND_KEY, soundEnabled);
  }, [soundEnabled]);

  const normalizedItems = useMemo(() => dedupeAdminNewUsers(items, userInfoByUid), [items, userInfoByUid]);

  const counts = useMemo(() => {
    const list = Array.isArray(normalizedItems) ? normalizedItems : [];
    return {
      female: list.filter((it) => resolveAdminNewUserGender(it, (() => {
        const uid = resolveAdminNewUserUid(it);
        return uid ? userInfoByUid[uid] : null;
      })()) === 'female').length,
      male: list.filter((it) => resolveAdminNewUserGender(it, (() => {
        const uid = resolveAdminNewUserUid(it);
        return uid ? userInfoByUid[uid] : null;
      })()) === 'male').length,
      other: list.filter((it) => {
        const uid = resolveAdminNewUserUid(it);
        const gender = resolveAdminNewUserGender(it, uid ? userInfoByUid[uid] : null);
        return gender !== 'female' && gender !== 'male';
      }).length,
      total: list.length,
    };
  }, [normalizedItems, userInfoByUid]);

  const filtered = useMemo(() => {
    const list = Array.isArray(normalizedItems) ? normalizedItems : [];
    if (activeGender === 'all') return list;
    return list.filter((it) => {
      const uid = resolveAdminNewUserUid(it);
      const gender = resolveAdminNewUserGender(it, uid ? userInfoByUid[uid] : null);
      return activeGender === 'other' ? (gender !== 'female' && gender !== 'male') : gender === activeGender;
    });
  }, [normalizedItems, activeGender, userInfoByUid]);

  const openModal = (it) => {
    setActiveItem(it);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveItem(null);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Yeni Kullanıcılar (Bugün)</h2>
            <p className="text-sm text-slate-600">
              Bugün saat 00:00'dan itibaren benzersiz kullanıcılar. Toplam: <span className="font-semibold text-slate-900">{counts.total}</span>
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="text-xs text-slate-600">
              Başlangıç:{' '}
              <span className="font-semibold text-slate-900">
                {new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())} 00:00
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const next = !notifyEnabled;
                  if (next) {
                    const perm = await ensureNotificationPermission();
                    if (perm !== 'granted') {
                      setNotifyHint('Bildirim izni verilmedi (tarayıcı izinlerinden açılmalı).');
                      setNotifyEnabled(false);
                      return;
                    }
                  }
                  setNotifyHint('');
                  setNotifyEnabled(next);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  notifyEnabled ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
                title={
                  canNotify()
                    ? `Bildirim izni: ${notificationPermission()}`
                    : 'Tarayıcı bildirimini desteklemiyor'
                }
              >
                Bildirim: {notifyEnabled ? 'Açık' : 'Kapalı'}
              </button>

              <button
                type="button"
                onClick={() => setSoundEnabled((v) => !v)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                  soundEnabled ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
                title="Ses tarayıcı politikalarına göre engellenebilir"
              >
                Ses: {soundEnabled ? 'Açık' : 'Kapalı'}
              </button>

              <button
                type="button"
                onClick={() => {
                  playMelody(2000);
                }}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                title="Ses gelmiyorsa: siteyi PWA olarak yükleyip tekrar deneyin veya tarayıcı ses/otomatik oynatma ayarlarını kontrol edin"
              >
                Test sesi
              </button>

              <button
                type="button"
                onClick={async () => {
                  const r = await testNotify();
                  if (!r.ok) {
                    setNotifyHint(
                      r.perm === 'unsupported'
                        ? 'Tarayıcı bildirimini desteklemiyor.'
                        : 'Test bildirimi gönderilemedi (izin/ayar kontrol et).'
                    );
                  } else {
                    setNotifyHint('');
                  }
                }}
                className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              >
                Test bildirim
              </button>
            </div>

            {!canNotify() ? (
              <div className="text-[11px] text-slate-500">Tarayıcı bildirimi desteklenmiyor.</div>
            ) : notificationPermission() === 'denied' ? (
              <div className="text-[11px] text-rose-700">Bildirim izni engelli (browser ayarlarından açman gerekir).</div>
            ) : null}

            {notifyHint ? <div className="text-[11px] text-amber-700">{notifyHint}</div> : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveGender('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              activeGender === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tümü ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveGender('female')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              activeGender === 'female'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Kadın ({counts.female})
          </button>
          <button
            type="button"
            onClick={() => setActiveGender('male')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
              activeGender === 'male'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Erkek ({counts.male})
          </button>
          {counts.other > 0 ? (
            <button
              type="button"
              onClick={() => setActiveGender('other')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                activeGender === 'other'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Diğer ({counts.other})
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        {loading ? <div className="p-3 text-sm text-slate-600">Yükleniyor…</div> : null}
        {error ? <div className="m-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-900 text-sm">{error}</div> : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="p-3 text-sm text-slate-700">Bugün bu grupta kayıt yok.</div>
        ) : null}

        {filtered.length > 0 ? (
          <div className="overflow-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-[11px] text-slate-600 bg-slate-50">
                <tr>
                  <th className="px-3 py-2">Kullanıcı</th>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2">İlerleme</th>
                  <th className="px-3 py-2">Takıldığı Alan</th>
                  <th className="px-3 py-2">Kullanıcı Kodu (UC)</th>
                  <th className="px-3 py-2">Başvuru Kodu</th>
                  <th className="px-3 py-2">Yaş</th>
                  <th className="px-3 py-2">Kayıt</th>
                  <th className="px-3 py-2">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((it) => {
                  const uid = resolveAdminNewUserUid(it);
                  const u = uid ? userInfoByUid[uid] : null;
                  const kind = getAdminNewUserKind(it, u);
                  const gender = resolveAdminNewUserGender(it, u);
                  const draftInfo = getDraftProgressInfo(it);
                  return (
                  <tr key={it.id} className="text-slate-800">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-900">{displayUserLabel(it, u)}</div>
                        <GenderPill gender={gender} />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={getKindPillClass(kind)}>{getKindLabel(kind)}</span>
                    </td>
                    <td className="px-3 py-2">
                      {draftInfo?.totalRequiredCount > 0 ? (
                        <div>
                          <div className="font-semibold text-slate-900">{draftInfo.completedRequiredCount}/{draftInfo.totalRequiredCount}</div>
                          <div className="text-[11px] text-slate-500">{draftUpdatedAtLabel(draftInfo.draftUpdatedAtMs)}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={draftInfo?.firstMissingRequiredKey ? 'font-semibold text-amber-900' : 'text-slate-500'}>
                        {draftInfo?.firstMissingRequiredLabel || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {(() => {
                        const uc = getUcCodeFromApplicationDoc(it) || getUcCodeFromUserDoc(u);
                        return <span className="font-semibold">{uc || '-'}</span>;
                      })()}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-semibold">{formatProfileCode(it) || '-'}</span>
                    </td>
                    <td className="px-3 py-2">{typeof it.age === 'number' ? it.age : '-'}</td>
                    <td className="px-3 py-2">{formatTs(it.createdAt) || '-'}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => openModal(it)}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Detay (modal)
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        item={activeItem}
        userDoc={(() => {
          const uid = resolveAdminNewUserUid(activeItem);
          return uid ? userInfoByUid[uid] || null : null;
        })()}
      />
    </div>
  );
}
