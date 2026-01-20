import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { formatProfileCode } from '../utils/profileCode';

function labelForGender(v) {
  if (v === 'female') return 'Kadın';
  if (v === 'male') return 'Erkek';
  return v || '-';
}

function labelForNationality(v) {
  if (v === 'tr') return 'Türk';
  if (v === 'id') return 'Endonezyalı';
  if (v === 'other') return 'Diğer';
  return v || '-';
}

function labelForLanguageCode(v, other = '') {
  if (v === 'tr') return 'Türkçe';
  if (v === 'id') return 'Endonezce';
  if (v === 'en') return 'İngilizce';
  if (v === 'ar') return 'Arapça';
  if (v === 'none') return 'Yabancı dil bilmiyor';
  if (v === 'other') return other ? `Diğer: ${other}` : 'Diğer';
  return v || '-';
}

function labelForYesNo(v) {
  if (v === true) return 'Evet';
  if (v === false) return 'Hayır';
  if (v === 'yes') return 'Evet';
  if (v === 'no') return 'Hayır';
  if (v === 'unsure') return 'Emin değilim';
  return v || '-';
}

function labelForLivingCountry(v) {
  if (v === 'tr') return 'Türkiye';
  if (v === 'id') return 'Endonezya';
  if (v === 'doesnt_matter' || v === 'doesntMatter') return 'Farketmez';
  return v || '-';
}

function labelForDoesntMatter(v) {
  if (v === 'doesnt_matter' || v === 'doesntMatter') return 'Farketmez';
  return v || '-';
}

function labelForMaritalStatus(v) {
  if (v === 'doesnt_matter' || v === 'doesntMatter') return 'Farketmez';
  if (v === 'single') return 'Bekar';
  if (v === 'widowed') return 'Eşi vefat etmiş';
  if (v === 'divorced') return 'Boşanmış';
  if (v === 'other') return 'Diğer';
  return v || '-';
}

function labelForEducation(v) {
  if (v === 'doesnt_matter' || v === 'doesntMatter') return 'Farketmez';
  if (v === 'secondary') return 'Ortaöğretim';
  if (v === 'university') return 'Üniversite';
  if (v === 'masters') return 'Yüksek lisans';
  if (v === 'phd') return 'Doktora';
  if (v === 'other') return 'Diğer';
  return v || '-';
}

function labelForOccupation(v) {
  if (v === 'doesnt_matter' || v === 'doesntMatter') return 'Farketmez';
  if (v === 'civilServant') return 'Memur';
  if (v === 'employee') return 'Çalışan';
  if (v === 'retired') return 'Emekli';
  if (v === 'businessOwner') return 'İşletme sahibi';
  if (v === 'other') return 'Diğer';
  return v || '-';
}

function labelForIncome(v) {
  if (v === 'low') return 'Düşük';
  if (v === 'medium') return 'Orta';
  if (v === 'good') return 'İyi';
  if (v === 'veryGood') return 'Çok iyi';
  if (v === 'preferNot') return 'Belirtmek istemiyorum';
  return v || '-';
}

function labelForReligion(v) {
  if (v === 'islam') return 'İslam';
  if (v === 'christian') return 'Hristiyanlık';
  if (v === 'hindu') return 'Hinduizm';
  if (v === 'buddhist') return 'Budizm';
  if (v === 'other') return 'Diğer';
  return v || '-';
}

function labelForTimeline(v) {
  if (v === '0_3') return '0–3 ay içinde';
  if (v === '3_6') return '3–6 ay içinde';
  if (v === '6_12') return '6–12 ay içinde';
  if (v === '1_plus') return '1 yıl veya daha sonra';
  return v || '-';
}

function labelForFamilyApproval(v) {
  if (v === 'approved') return 'Onaylı';
  if (v === 'inProgress') return 'Görüşülüyor';
  if (v === 'problem') return 'Sorun/engel var';
  return v || '-';
}

function labelForPartnerChildrenPreference(v) {
  if (v === 'doesnt_matter' || v === 'doesntMatter') return 'Farketmez';
  if (v === 'wantChildren') return 'Çocuk istesin';
  if (v === 'noChildren') return 'Çocuk istemesin';
  return v || '-';
}

function formatValue(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

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

export default function AdminMatchmakingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [item, setItem] = useState(null);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [userBlocked, setUserBlocked] = useState(false);
  const [userMembership, setUserMembership] = useState(null);
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  const title = useMemo(() => {
    if (!item) return 'Başvuru Detayı';
    return `${item.fullName || 'Başvuru'}${typeof item.age === 'number' ? ` (${item.age})` : ''}`;
  }, [item]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');
      try {
        if (!id) throw new Error('Missing id');
        const snap = await getDoc(doc(db, 'matchmakingApplications', id));
        if (!snap.exists()) {
          if (cancelled) return;
          setItem(null);
          setError('Bu başvuru bulunamadı.');
          return;
        }

        const data = { id: snap.id, ...(snap.data() || {}) };
        if (cancelled) return;
        setItem(data);

        // Kullanıcı engelli mi? (opsiyonel)
        try {
          const userId = data.userId;
          if (userId && typeof userId === 'string') {
            const userSnap = await getDoc(doc(db, 'matchmakingUsers', userId));
            const u = userSnap.exists() ? (userSnap.data() || {}) : {};
            const blocked = !!u.blocked;
            if (!cancelled) {
              setUserBlocked(blocked);
              setUserMembership(u.membership || null);
            }
          } else if (!cancelled) {
            setUserBlocked(false);
            setUserMembership(null);
          }
        } catch {
          if (!cancelled) {
            setUserBlocked(false);
            setUserMembership(null);
          }
        }

        const directUrls = Array.isArray(data.photoUrls) ? data.photoUrls : [];
        const urls = directUrls.filter((u) => typeof u === 'string' && u.trim());

        if (!urls.length) {
          const paths = Array.isArray(data.photoPaths) ? data.photoPaths : [];
          for (const p of paths) {
            if (!p || typeof p !== 'string') continue;
            try {
              urls.push(await getDownloadURL(ref(storage, p)));
            } catch {
              // ignore (rules/missing)
            }
          }
        }
        if (cancelled) return;
        setPhotoUrls(urls);
      } catch (e) {
        if (cancelled) return;
        setError(String(e?.message || 'Detay yüklenemedi.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const userId = item?.userId && typeof item.userId === 'string' ? item.userId : '';

  const membershipInfo = useMemo(() => {
    const m = userMembership || null;
    const validUntilMs = typeof m?.validUntilMs === 'number' ? m.validUntilMs : 0;
    const active = !!m?.active && validUntilMs > Date.now();
    const msLeft = validUntilMs - Date.now();
    const daysLeft = msLeft > 0 ? Math.ceil(msLeft / 86400000) : 0;
    const untilText = validUntilMs
      ? new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(
          new Date(validUntilMs)
        )
      : '';
    const plan = typeof m?.plan === 'string' ? m.plan : '';
    return { active, validUntilMs, daysLeft, untilText, plan };
  }, [userMembership]);

  const setBlocked = async (nextBlocked) => {
    if (!userId) return;
    setActing(true);
    setActionErr('');
    setActionMsg('');

    try {
      const reason = nextBlocked
        ? (window.prompt('Engelleme nedeni (opsiyonel):', '') || '').trim()
        : '';

      await setDoc(
        doc(db, 'matchmakingUsers', userId),
        {
          blocked: !!nextBlocked,
          blockedAt: nextBlocked ? serverTimestamp() : null,
          blockedBy: auth.currentUser?.uid || null,
          blockedReason: nextBlocked ? reason : null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setUserBlocked(!!nextBlocked);
      setActionMsg(nextBlocked ? 'Kullanıcı engellendi.' : 'Kullanıcının engeli kaldırıldı.');
    } catch (e) {
      setActionErr(String(e?.message || 'İşlem başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const deleteApplication = async () => {
    if (!id) return;
    const name = item?.fullName ? String(item.fullName) : 'bu başvuru';
    const ok = window.confirm(
      `${name} kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`
    );
    if (!ok) return;

    setActing(true);
    setActionErr('');
    setActionMsg('');
    try {
      await deleteDoc(doc(db, 'matchmakingApplications', id));
      setActionMsg('Başvuru silindi.');
      navigate('/admin/dashboard');
    } catch (e) {
      setActionErr(String(e?.message || 'Silme işlemi başarısız.'));
    } finally {
      setActing(false);
    }
  };

  const details = item?.details || {};
  const partner = item?.partnerPreferences || {};
  const languages = details?.languages || {};
  const nativeLang = languages?.native || {};
  const foreignLang = languages?.foreign || {};

  const foreignLangLabel = useMemo(() => {
    const codes = Array.isArray(foreignLang?.codes) ? foreignLang.codes : [];
    if (codes.includes('none')) return 'Yabancı dil bilmiyor';
    const filtered = codes.filter((c) => c && c !== 'other');
    const base = filtered.map((c) => labelForLanguageCode(c)).filter(Boolean);
    const otherText = typeof foreignLang?.other === 'string' ? foreignLang.other.trim() : '';
    if (codes.includes('other')) {
      base.push(otherText ? `Diğer: ${otherText}` : 'Diğer');
    }
    return base.length ? base.join(', ') : '-';
  }, [foreignLang]);

  const partnerAgeSummary = useMemo(() => {
    const min = typeof partner?.ageMin === 'number' ? partner.ageMin : null;
    const max = typeof partner?.ageMax === 'number' ? partner.ageMax : null;
    const older = typeof partner?.ageMaxOlderYears === 'number' ? partner.ageMaxOlderYears : null;
    const younger = typeof partner?.ageMaxYoungerYears === 'number' ? partner.ageMaxYoungerYears : null;

    const range = min !== null || max !== null ? `${min ?? '-'}–${max ?? '-'}` : '';
    const diff =
      older !== null || younger !== null ? `(+${older ?? 0} / -${younger ?? 0})` : '';

    return (range || diff) ? `${range}${range && diff ? ' ' : ''}${diff}`.trim() : '-';
  }, [partner]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">{title}</h1>
          <div className="flex items-center gap-2">
            {!loading && item && (
              <>
                {userId && (
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                      userBlocked
                        ? 'bg-rose-50 text-rose-900 border-rose-200'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}
                  >
                    {userBlocked ? 'Kullanıcı engelli' : 'Kullanıcı aktif'}
                  </span>
                )}
                {userId && (
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => setBlocked(!userBlocked)}
                    className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold border transition ${
                      userBlocked
                        ? 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
                        : 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                    } ${acting ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {userBlocked ? 'Engeli kaldır' : 'Engelle'}
                  </button>
                )}
                <button
                  type="button"
                  disabled={acting}
                  onClick={deleteApplication}
                  className={`inline-flex items-center justify-center rounded-lg bg-white border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 ${
                    acting ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  Sil
                </button>
              </>
            )}

            <Link
              to="/admin/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Panele dön
            </Link>
          </div>
        </div>

        {(actionErr || actionMsg) && (
          <div
            className={`mt-4 rounded-xl border p-4 text-sm ${
              actionErr
                ? 'border-rose-200 bg-rose-50 text-rose-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}
          >
            {actionErr || actionMsg}
          </div>
        )}

        {loading && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">Yükleniyor…</div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{error}</div>
        )}

        {!loading && item && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Başvuru</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><span className="font-semibold">Kullanıcı Kodu:</span> {formatProfileCode(item) || '-'}</p>
                <p><span className="font-semibold">Başvuru ID:</span> {item.id}</p>
                <p><span className="font-semibold">Tarih:</span> {formatTs(item.createdAt) || '-'}</p>
                <p><span className="font-semibold">Durum:</span> {item.status || '-'}</p>
                <p><span className="font-semibold">Dil:</span> {labelForLanguageCode(item.lang) || '-'}</p>
                <p className="md:col-span-2"><span className="font-semibold">Kullanıcı ID:</span> {userId || '-'}</p>
                <p className="md:col-span-2">
                  <span className="font-semibold">Üyelik:</span>{' '}
                  {membershipInfo.active
                    ? `Aktif${membershipInfo.daysLeft ? ` • ${membershipInfo.daysLeft} gün kaldı` : ''}${membershipInfo.untilText ? ` • Bitiş: ${membershipInfo.untilText}` : ''}${membershipInfo.plan ? ` • Plan: ${membershipInfo.plan}` : ''}`
                    : (membershipInfo.untilText ? `Pasif/bitmiş • Son bitiş: ${membershipInfo.untilText}` : 'Yok')}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Kişi Bilgileri</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><span className="font-semibold">Ad Soyad:</span> {item.fullName || '-'}</p>
                <p><span className="font-semibold">Yaş:</span> {typeof item.age === 'number' ? item.age : '-'}</p>
                <p><span className="font-semibold">WhatsApp:</span> {item.whatsapp || '-'}</p>
                <p><span className="font-semibold">E-posta:</span> {item.email || '-'}</p>
                <p><span className="font-semibold">Instagram:</span> {item.instagram || '-'}</p>
                <p><span className="font-semibold">Şehir/Ülke:</span> {item.city ? `${item.city}${item.country ? ` / ${item.country}` : ''}` : (item.country || '-')}</p>
                <p><span className="font-semibold">Cinsiyet:</span> {labelForGender(item.gender)}</p>
                <p><span className="font-semibold">Uyruk:</span> {labelForNationality(item.nationality)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Dil</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p>
                  <span className="font-semibold">Kendi dili:</span>{' '}
                  {labelForLanguageCode(nativeLang?.code, nativeLang?.other)}
                </p>
                <p><span className="font-semibold">Yabancı diller:</span> {foreignLangLabel}</p>
                <p>
                  <span className="font-semibold">Çeviri uygulaması ile konuşabilir:</span>{' '}
                  {labelForYesNo(details?.canCommunicateWithTranslationApp)}
                </p>
              </div>
            </div>

            {photoUrls.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Fotoğraflar</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {photoUrls.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer" className="block">
                      <img src={u} alt="photo" className="w-full h-56 object-cover rounded-lg border border-slate-200" loading="lazy" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Ek Bilgiler</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><span className="font-semibold">Boy/Kilo:</span> {details?.heightCm ? `${details.heightCm} cm` : '-'} / {details?.weightKg ? `${details.weightKg} kg` : '-'}</p>
                <p><span className="font-semibold">Meslek:</span> {labelForOccupation(details?.occupation)}</p>
                <p><span className="font-semibold">Eğitim:</span> {labelForEducation(details?.education)}</p>
                <p><span className="font-semibold">Medeni durum:</span> {labelForMaritalStatus(details?.maritalStatus)}</p>
                <p><span className="font-semibold">Çocuk:</span> {details?.hasChildren ? labelForYesNo(details.hasChildren) : '-'}</p>
                <p><span className="font-semibold">Çocuk sayısı:</span> {typeof details?.childrenCount === 'number' ? details.childrenCount : '-'}</p>
                <p><span className="font-semibold">Gelir:</span> {labelForIncome(details?.incomeLevel)}</p>
                <p><span className="font-semibold">Din:</span> {labelForReligion(details?.religion)}</p>
                <p className="md:col-span-2"><span className="font-semibold">Dinî değerler:</span> {details?.religiousValues || '-'}</p>
                <p className="md:col-span-2"><span className="font-semibold">Aile engeli:</span> {details?.familyObstacle ? labelForYesNo(details.familyObstacle) : '-'}</p>
                <p className="md:col-span-2"><span className="font-semibold">Aile engeli (detay):</span> {details?.familyObstacleDetails || '-'}</p>
                <p><span className="font-semibold">Aile onayı:</span> {details?.familyApprovalStatus ? labelForFamilyApproval(details.familyApprovalStatus) : '-'}</p>
                <p><span className="font-semibold">Evlilik zamanı:</span> {details?.marriageTimeline ? labelForTimeline(details.marriageTimeline) : '-'}</p>
                <p><span className="font-semibold">Taşınma:</span> {details?.relocationWillingness ? labelForYesNo(details.relocationWillingness) : '-'}</p>
                <p><span className="font-semibold">Yaşamak istediği ülke:</span> {details?.preferredLivingCountry ? labelForLivingCountry(details.preferredLivingCountry) : '-'}</p>
                <p><span className="font-semibold">Sigara:</span> {details?.smoking ? labelForYesNo(details.smoking) : '-'}</p>
                <p><span className="font-semibold">Alkol:</span> {details?.alcohol ? labelForYesNo(details.alcohol) : '-'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Aradığı Kişi</p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p><span className="font-semibold">Uyruk:</span> {labelForNationality(item.lookingForNationality)}</p>
                <p><span className="font-semibold">Cinsiyet:</span> {labelForGender(item.lookingForGender)}</p>
                <p><span className="font-semibold">Boy aralığı:</span> {partner?.heightMinCm ? `${partner.heightMinCm} cm` : '-'} – {partner?.heightMaxCm ? `${partner.heightMaxCm} cm` : '-'}</p>
                <p><span className="font-semibold">Yaş:</span> {partnerAgeSummary}</p>
                <p><span className="font-semibold">Medeni durum:</span> {labelForMaritalStatus(partner?.maritalStatus)}</p>
                <p><span className="font-semibold">Din:</span> {labelForReligion(partner?.religion)}</p>
                <p>
                  <span className="font-semibold">İletişim dili:</span>{' '}
                  {labelForLanguageCode(partner?.communicationLanguage, partner?.communicationLanguageOther)}
                </p>
                <p>
                  <span className="font-semibold">Çeviri uygulaması ile konuşabilir:</span>{' '}
                  {labelForYesNo(partner?.canCommunicateWithTranslationApp)}
                </p>
                <p><span className="font-semibold">Yaşanacak ülke:</span> {partner?.livingCountry ? labelForLivingCountry(partner.livingCountry) : '-'}</p>
                <p><span className="font-semibold">Sigara:</span> {partner?.smokingPreference ? labelForDoesntMatter(partner.smokingPreference) : '-'}</p>
                <p><span className="font-semibold">Alkol:</span> {partner?.alcoholPreference ? labelForDoesntMatter(partner.alcoholPreference) : '-'}</p>
                <p><span className="font-semibold">Çocuk tercihi:</span> {partner?.childrenPreference ? labelForPartnerChildrenPreference(partner.childrenPreference) : '-'}</p>
                <p><span className="font-semibold">Eğitim tercihi:</span> {partner?.educationPreference ? labelForEducation(partner.educationPreference) : '-'}</p>
                <p><span className="font-semibold">Meslek tercihi:</span> {partner?.occupationPreference ? labelForOccupation(partner.occupationPreference) : '-'}</p>
                <p><span className="font-semibold">Aile değerleri:</span> {partner?.familyValuesPreference ? labelForDoesntMatter(partner.familyValuesPreference) : '-'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Kısa Tanıtım</p>
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{item.about || '-'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Beklentiler</p>
              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{item.expectations || '-'}</p>
            </div>

            <details className="rounded-xl border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">Ham veri (debug)</summary>
              <pre className="mt-3 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{formatValue(item)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
