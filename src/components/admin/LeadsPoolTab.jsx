import React, { useMemo, useState } from 'react';
import { authFetch } from '../../utils/authFetch';

function fmtDateTimeTr(ms) {
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

function statusLabel(status) {
  if (status === 'new') return badge('Yeni', 'indigo');
  if (status === 'contacted') return badge('İletişime geçildi', 'green');
  if (status === 'archived') return badge('Arşiv', 'slate');
  if (status === 'rejected') return badge('Reddedildi', 'rose');
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

function practicesLabel(arr) {
  const a = Array.isArray(arr) ? arr : [];
  const map = {
    prayer_5: '5 vakit namaz',
    fasting: 'Oruç',
    hajj: 'Hac',
    umrah: 'Umre',
  };
  const out = a.map((x) => map[x] || x).filter(Boolean);
  return out.length ? out.join(', ') : '-';
}

function maritalStatusLabel(v) {
  const s = String(v || '').trim();
  const map = {
    single: 'Bekar',
    never_married: 'Bekar',
    married: 'Evli',
    divorced: 'Boşanmış',
    widowed: 'Dul',
    any: 'Fark etmez',
  };
  return map[s] || (s ? s : '-');
}

function genderLabel(v) {
  const s = String(v || '').trim().toLowerCase();
  if (s === 'female') return 'Kadın';
  if (s === 'male') return 'Erkek';
  return s ? v : '-';
}

function yesNoLabel(v) {
  if (v === true) return 'Evet';
  if (v === false) return 'Hayır';
  const s = String(v || '').trim().toLowerCase();
  if (s === 'unknown' || s === 'not_yet' || s === 'notyet' || s === 'pending') return 'Henüz ailemle konuşmadım';
  if (s === 'yes' || s === 'true' || s === '1') return 'Evet';
  if (s === 'no' || s === 'false' || s === '0') return 'Hayır';
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

function hasChildrenLabel(v) {
  const s = String(v || '').trim();
  const map = {
    yes: 'Evet',
    no: 'Hayır',
    with_children: 'Var',
    without_children: 'Yok',
    any: 'Fark etmez',
  };
  return map[s] || (s ? s : '-');
}

function incomeLabel(v) {
  const s = String(v || '').trim();
  const map = {
    low: 'Düşük',
    mid: 'Orta',
    high: 'Yüksek',
    any: 'Fark etmez',
  };
  return map[s] || (s ? s : '-');
}

function workStatusLabel(v) {
  const s = String(v || '').trim();
  const map = {
    civil_servant: 'Memur',
    worker: 'İşçi',
    business_owner: 'Kendi işinin sahibi',
    retired: 'Emekli',
    not_working: 'Çalışmıyor',
    any: 'Fark etmez',
  };
  return map[s] || (s ? s : '-');
}

function isHasChildrenYes(v) {
  const s = String(v || '').trim();
  return s === 'yes' || s === 'with_children';
}

function boolLabel(v) {
  if (v === true) return 'Evet';
  if (v === false) return 'Hayır';
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
  const tabs = useMemo(
    () => [
      { id: 'female', label: 'Kadınlar' },
      { id: 'male', label: 'Erkekler' },
    ],
    []
  );

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
    if (!c) return 'Çeviri başarısız.';
    if (c === 'pii_blocked') return 'Hassas bilgi içerdiği için çeviri engellendi.';
    if (c === 'translate_rate_limited') return 'Çeviri isteği çok sık yapıldı. Lütfen biraz sonra tekrar deneyin.';
    if (c === 'translate_not_configured') return 'Çeviri servisi yapılandırılmamış.';
    if (c === 'not_authenticated') return 'Oturum açılmadı.';
    if (c === 'forbidden') return 'Yetkisiz.';
    return c;
  };

  const translateToTr = async (key, text) => {
    const k = String(key || '').trim();
    const t = String(text || '').trim();
    if (!k || !t) return;
    if (translateState.loadingKey) return;

    setTranslateState((p) => ({ ...p, loadingKey: k, error: '' }));
    try {
      const payload = await authFetch(`/api/admin-translate-text?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key: k, targetLang: 'tr', text: t }),
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
    const ok = window.confirm('Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.');
    if (!ok) return;

    setPatch({ saving: true, error: '', success: '' });
    try {
      await authFetch(`/api/admin-lead-delete?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: leadId }),
      });

      setItems((p) => (Array.isArray(p) ? p.filter((x) => x?.id !== leadId) : []));
      setDetail({ open: false, item: null });
      setPatch({ saving: false, error: '', success: 'Silindi.' });
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setPatch({ saving: false, error: msg || 'Silinemedi.', success: '' });
    }
  };

  const reload = async (gender) => {
    const g = normalizeGenderTab(gender || activeGender);
    setLoading(true);
    setErr('');
    try {
      const payload = await authFetch(`/api/admin-leads-list?ts=${Date.now()}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ gender: g, limit: 200 }),
      });
      setItems(Array.isArray(payload?.items) ? payload.items : []);
      setLastLoadedAtMs(Date.now());
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setErr(msg || 'Havuz yüklenemedi.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

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

      setPatch({ saving: false, error: '', success: 'Kaydedildi.' });
      await reload(activeGender);
    } catch (e) {
      const msg = String(e?.message || '').trim();
      setPatch({ saving: false, error: msg || 'Kaydetme başarısız.', success: '' });
    }
  };

  const currentCount = items.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Aracılık Havuzu</h2>
            <p className="mt-1 text-xs text-slate-600">
              Kayıt olmadan gelen başvurular. Sekmeye göre cinsiyet filtresi uygulanır.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => reload(activeGender)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              {loading ? 'Yükleniyor…' : 'Yenile'}
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveGender(t.id);
                reload(t.id);
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
          {lastLoadedAtMs ? `Son güncelleme: ${fmtDateTimeTr(lastLoadedAtMs)}` : 'Henüz yüklenmedi.'} • Adet:{' '}
          <span className="font-semibold text-slate-900">{currentCount}</span>
        </div>

        {err ? <div className="mt-2 text-sm text-rose-700">{err}</div> : null}

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="text-[11px] text-slate-600">
              <tr>
                <th className="py-2 pr-3">İsim</th>
                <th className="py-2 pr-3">Yaş</th>
                <th className="py-2 pr-3">Şehir</th>
                <th className="py-2 pr-3">WhatsApp</th>
                <th className="py-2 pr-3">Durum</th>
                <th className="py-2 pr-3">Tarih</th>
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
                  <td className="py-2 pr-3">{statusLabel(it.status)}</td>
                  <td className="py-2 pr-3">{fmtDateTimeTr(it.createdAtMs)}</td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => openDetail(it)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 && !loading ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">Kayıt yok.</div>
        ) : null}
      </div>

      {detail.open && detail.item ? (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-900">Başvuru Detayı</div>
                <div className="text-xs text-slate-600">{detail.item.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => deleteLead(detail.item.id)}
                  disabled={patch.saving}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  Sil
                </button>
                <button
                  onClick={closeDetail}
                  disabled={patch.saving}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Kapat
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
                  <div className="text-xs font-bold text-slate-900">Kişi</div>
                  <div className="mt-2 space-y-1">
                    {labelValue('İsim', detail.item.lead?.fullName)}
                    {labelValue('Cinsiyet', genderLabel(detail.item.lead?.gender))}
                    {labelValue('Yaş', typeof detail.item.lead?.age === 'number' ? detail.item.lead.age : '-')}
                    {labelValue('Şehir', detail.item.lead?.city)}
                    {labelValue('WhatsApp', detail.item.lead?.whatsapp)}
                    {labelValue('Medeni durum', maritalStatusLabel(detail.item.lead?.maritalStatus))}
                    {labelValue('Çocuk durumu', hasChildrenLabel(detail.item.lead?.hasChildren))}
                    {isHasChildrenYes(detail.item.lead?.hasChildren) ? (
                      <>
                        {labelValue('Kaç çocuk', detail.item.lead?.childrenCount)}
                        {labelValue('Çocuklar kaç yaşında', detail.item.lead?.childrenAges)}
                        {labelValue('Çocuklar kimle yaşıyor', detail.item.lead?.childrenLivingWith)}
                      </>
                    ) : null}
                    {labelValue('Kimle yaşıyor', detail.item.lead?.livingWith)}
                    {labelValue('İş durumu', workStatusLabel(detail.item.lead?.occupation))}
                    {labelValue('Meslek', detail.item.lead?.profession || '-')}
                    {labelValue('Gelir', incomeLabel(detail.item.lead?.income))}
                    {labelValue('Yabancı dil', detail.item.lead?.foreignLanguage)}
                    {labelValue('Çeviri kabul', boolLabel(detail.item.lead?.translationOk))}
                    {labelValue('Aile onayı', yesNoLabel(detail.item.lead?.familyApproval))}
                    {labelValue('Ek bilgi var mı?', yesNoLabel(detail.item.lead?.additionalInfoStatus))}
                    {detail.item.lead?.additionalInfoStatus === 'yes' ? (
                      <div className="text-xs text-slate-700">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            Ek bilgi: <span className="font-semibold">{String(detail.item.lead?.additionalInfoText || '').trim() || '-'}</span>
                          </div>
                          {String(detail.item.lead?.additionalInfoText || '').trim() ? (
                            <button
                              type="button"
                              onClick={() => translateToTr('lead.additionalInfoText', detail.item.lead?.additionalInfoText)}
                              disabled={!!translateState.loadingKey}
                              className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              {translateState.loadingKey === 'lead.additionalInfoText' ? 'Çevriliyor…' : 'Türkçeye çevir'}
                            </button>
                          ) : null}
                        </div>
                        {translateState.textByKey?.['lead.additionalInfoText'] ? (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800">
                            <div className="text-[11px] font-semibold text-slate-600">Çeviri (TR)</div>
                            <div className="mt-1 whitespace-pre-wrap">{translateState.textByKey['lead.additionalInfoText']}</div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {labelValue(
                      'Dini görevler',
                      practicesLabel(
                        mergeUniqueStrings(detail.item.lead?.religiousPractices, detail.item.lead?.religiousValues)
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
                              title="Fotoğrafı yeni sekmede aç"
                            >
                              <img src={url} alt={`Fotoğraf ${idx + 1}`} className="w-full aspect-square object-cover rounded-md border" />
                            </a>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => downloadUrl(url, `${detail.item.id}_photo_${idx + 1}.jpg`)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                İndir
                              </button>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-center"
                              >
                                Aç
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs font-bold text-slate-900">Aranan Kişi</div>
                  <div className="mt-2 space-y-1">
                    {labelValue('Çocuk durumu', hasChildrenLabel(detail.item.partner?.hasChildren))}
                    {labelValue('Medeni durum', maritalStatusLabel(detail.item.partner?.maritalStatus))}
                    {labelValue('Yaş', `${detail.item.partner?.ageMin ?? '-'} - ${detail.item.partner?.ageMax ?? '-'}`)}
                    {labelValue('Boy', `${detail.item.partner?.heightMinCm ?? '-'} - ${detail.item.partner?.heightMaxCm ?? '-'}`)}
                    {labelValue('Kilo', `${detail.item.partner?.weightMinKg ?? '-'} - ${detail.item.partner?.weightMaxKg ?? '-'}`)}
                    {labelValue('İş durumu', workStatusLabel(detail.item.partner?.occupation))}
                    <div className="text-xs text-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          Nasıl bir eş adayı arıyor?:{' '}
                          <span className="font-semibold">{String(detail.item.partner?.spouseWanted || '').trim() || '-'}</span>
                        </div>
                        {String(detail.item.partner?.spouseWanted || '').trim() ? (
                          <button
                            type="button"
                            onClick={() => translateToTr('partner.spouseWanted', detail.item.partner?.spouseWanted)}
                            disabled={!!translateState.loadingKey}
                            className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            {translateState.loadingKey === 'partner.spouseWanted' ? 'Çevriliyor…' : 'Türkçeye çevir'}
                          </button>
                        ) : null}
                      </div>
                      {translateState.textByKey?.['partner.spouseWanted'] ? (
                        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800">
                          <div className="text-[11px] font-semibold text-slate-600">Çeviri (TR)</div>
                          <div className="mt-1 whitespace-pre-wrap">{translateState.textByKey['partner.spouseWanted']}</div>
                        </div>
                      ) : null}
                    </div>
                    {labelValue('Gelir', incomeLabel(detail.item.partner?.income))}
                    {labelValue('Kimle yaşıyor', detail.item.partner?.livingWith)}
                    {labelValue('Dinî değerler', detail.item.partner?.religiousValues)}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-bold text-slate-900">Admin</div>
                  <div className="text-xs text-slate-600">Durum: {statusLabel(detail.item.status)}</div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-900">Durum</label>
                    <select
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                      value={detail.item.status || 'new'}
                      onChange={(e) => updateDetailField('status', e.target.value)}
                      disabled={patch.saving}
                    >
                      <option value="new">Yeni</option>
                      <option value="contacted">İletişime geçildi</option>
                      <option value="archived">Arşiv</option>
                      <option value="rejected">Reddedildi</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-900">İletişime geçildi</label>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!detail.item.contacted}
                        onChange={(e) => updateDetailField('contacted', e.target.checked)}
                        disabled={patch.saving}
                      />
                      <span className="text-xs text-slate-700">Evet</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs font-semibold text-slate-900">Not</label>
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
                    {patch.saving ? 'Kaydediliyor…' : 'Kaydet'}
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
