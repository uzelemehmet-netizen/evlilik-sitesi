import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { RESERVATION_STATUS, getReservationStatusLabel, normalizePhoneForWhatsApp } from '../../utils/reservationStatus';
import { formatMaybeTimestamp } from '../../utils/formatDate';
import { downloadJson } from '../../utils/downloadFile';
import { downloadEk1Html, openEk1InNewTab } from '../../utils/ek1';
import { getWhatsAppNumber } from '../../utils/whatsapp';

function isPermissionDenied(err) {
  const code = err?.code || err?.name;
  const msg = String(err?.message || '');
  return code === 'permission-denied' || msg.includes('Missing or insufficient permissions');
}

export default function ReservationsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState('');
  const [ek1MailProofById, setEk1MailProofById] = useState({});

  const whatsappBusinessNumber = useMemo(() => {
    return getWhatsAppNumber();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = [];
        snap.forEach((d) => next.push({ id: d.id, ...d.data() }));
        setItems(next);
        setLoading(false);
      },
      (err) => {
        console.error('Reservations snapshot error:', err);
        if (isPermissionDenied(err)) {
          setError('Firestore yetkisi yok: reservations okumak için Firestore Rules güncellenmeli.');
        } else {
          setError('Rezervasyonlar yüklenemedi. Konsolu kontrol edin.');
        }
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const haystack = [r.id, r.userEmail, r.tourName, r.contact?.name, r.contact?.phone]
        .filter(Boolean)
        .join(' | ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search]);

  const updateReservation = async (id, patch) => {
    setBusyId(id);
    setError('');
    try {
      await updateDoc(doc(db, 'reservations', id), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Reservation update error:', err);
      if (isPermissionDenied(err)) {
        setError('Firestore yetkisi yok: reservations update için Firestore Rules güncellenmeli.');
      } else {
        setError('Güncelleme başarısız. Konsolu kontrol edin.');
      }
    } finally {
      setBusyId('');
    }
  };

  const openWhatsAppToCustomer = (customerPhone, text) => {
    const phone = normalizePhoneForWhatsApp(customerPhone);
    if (!phone) return;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openWhatsAppToBusiness = (text) => {
    const url = `https://wa.me/${whatsappBusinessNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getCustomerGreetingLine = (r) => {
    const rawName = String(r?.contact?.name || '').trim();
    const name = rawName.replace(/\s+/g, ' ');
    return name ? `Merhaba Sayın ${name},` : 'Merhaba Sayın Misafirimiz,';
  };

  const getCustomerIntroLines = (r) => {
    const tourName = String(r?.tourName || '').trim();
    const tourPart = tourName ? ` ${tourName}` : '';
    return [
      `Bu mesaj endonezyakasifi.com üzerinde planladığınız${tourPart} turu kapsamında bilgilendirme amacıyla gönderilmiştir.`,
      '',
    ];
  };

  const getDepositReceivedMessage = (r) => {
    const tourName = r?.tourName || '';
    const packageName = r?.packageName || '';
    const people = Number(r?.people) || 0;
    const amountNow = Number(r?.totalsUsd?.amountToPayNowUsd) || 0;

    const lines = [];
    lines.push(getCustomerGreetingLine(r));
    lines.push('');
    lines.push(...getCustomerIntroLines(r));
    lines.push(`Rezervasyon No: ${r.id}`);
    if (r?.paymentReference) lines.push(`Ödeme Referansı: ${r.paymentReference}`);
    if (tourName) lines.push(`Tur: ${tourName}`);
    if (packageName) lines.push(`Paket: ${packageName}`);
    if (people) lines.push(`Katılımcı sayısı: ${people}`);
    lines.push('');
    lines.push(`$${amountNow} tutarındaki kapora ödemeniz alındı.`);
    lines.push('Tur paket fiyatları netleştiğinde kalan tutar tarafınıza ayrıca bildirilecektir.');
    lines.push('Web sitemiz üzerindeki size ait panele giriş yaptığınızda “Rezervasyonu tamamla” butonu aktifleşecektir.');
    lines.push('Bu aşamada kalan tutarı ödeyerek rezervasyonunuzu tamamlayabilirsiniz.');
    lines.push('Rezervasyon tamamlandıktan sonra uçak bileti, otel rezervasyonları ve tüm tur programı hakkında bilgilendirileceksiniz.');
    lines.push('');
    lines.push('İyi günler dileriz.');
    return lines.join('\n');
  };

  const getBalancePaymentOpenedMessage = (r) => {
    const tourName = r?.tourName || '';
    const packageName = r?.packageName || '';
    const people = Number(r?.people) || 0;

    const amountNow = Number(r?.totalsUsd?.amountToPayNowUsd) || 0;
    const finalTotal = Number(r?.offer?.finalTotalUsd);
    const fallbackTotal = Number(r?.totalsUsd?.grandTotalUsd) || 0;
    const totalUsd = Number.isFinite(finalTotal) && finalTotal > 0 ? finalTotal : fallbackTotal;

    const balanceDue = totalUsd > 0 ? Math.max(0, Math.round((totalUsd - amountNow) * 100) / 100) : null;

    const lines = [];
    lines.push(getCustomerGreetingLine(r));
    lines.push('');
    lines.push(...getCustomerIntroLines(r));
    lines.push('Panelinizde “Rezervasyonu tamamla” butonu aktif edilmiştir.');
    lines.push(`Rezervasyon No: ${r.id}`);
    if (r?.paymentReference) lines.push(`Ödeme Referansı: ${r.paymentReference}`);
    if (tourName) lines.push(`Tur: ${tourName}`);
    if (packageName) lines.push(`Paket: ${packageName}`);
    if (people) lines.push(`Katılımcı sayısı: ${people}`);
    lines.push('');
    if (balanceDue !== null) {
      lines.push(`Kalan ödeme tutarınız: $${balanceDue}`);
    }
    lines.push('Kalan ödeme işlemini tamamladıktan sonra tüm tur kapsamı hakkında detaylı bilgilendirme yapılacaktır.');
    lines.push('İyi günler dileriz.');
    return lines.join('\n');
  };

  const getReservationCompletedMessage = (r) => {
    const tourName = r?.tourName || '';
    const packageName = r?.packageName || '';

    const lines = [];
    lines.push(getCustomerGreetingLine(r));
    lines.push('');
    lines.push(...getCustomerIntroLines(r));
    lines.push('Rezervasyonunuz tamamlanmıştır.');
    lines.push(`Rezervasyon No: ${r.id}`);
    if (r?.paymentReference) lines.push(`Ödeme Referansı: ${r.paymentReference}`);
    if (tourName) lines.push(`Tur: ${tourName}`);
    if (packageName) lines.push(`Paket: ${packageName}`);
    lines.push('');
    lines.push('Bir sonraki adımda sizinle uçak bileti, otel rezervasyonları ve tur programı hakkında detaylı bilgilendirme yapılacaktır.');
    lines.push(`${tourName ? `${tourName} ` : ''}seyahatinde sizleri aramızda görmekten mutluluk duyuyoruz.`.trim());
    lines.push('Seyahatinizin en güzel şekilde geçmesi için elimizden gelen tüm çabayı göstereceğimizden emin olabilirsiniz.');
    lines.push('');
    lines.push('İyi günler dileriz.');
    return lines.join('\n');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Rezervasyonlar</h2>
            <p className="text-xs text-gray-500 mt-1">
              Kapora → admin teklif → kalan ödeme açma akışı buradan yönetilir.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara: rezervasyon no, e-posta, tur, telefon…"
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Yükleniyor…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">Kayıt bulunamadı.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {filtered.map((r) => {
              const created = formatMaybeTimestamp(r.createdAt);
              const statusLabel = getReservationStatusLabel(r.status);
              const amountNow = Number(r?.totalsUsd?.amountToPayNowUsd) || 0;
              const people = Number(r?.people) || 0;
              const packageTotalUsd = Number(r?.totalsUsd?.packageTotalUsd) || 0;
              const extrasTotalUsd = Number(r?.totalsUsd?.extrasTotalUsd) || 0;
              const grandTotalUsd = Number(r?.totalsUsd?.grandTotalUsd) || 0;
              const depositPercent = Number(r?.totalsUsd?.depositPercent) || 0;

              const perPersonPackageUsd = people > 0 ? Math.round((packageTotalUsd / people) * 100) / 100 : 0;
              const perPersonExtrasUsd = people > 0 ? Math.round((extrasTotalUsd / people) * 100) / 100 : 0;
              const perPersonGrandUsd = people > 0 ? Math.round((grandTotalUsd / people) * 100) / 100 : 0;

              const finalTotalUsd = r?.offer?.finalTotalUsd ?? '';
              const note = r?.offer?.note ?? '';

              const depositPaymentMethod = r?.depositPaymentMethod || '';

              const audit = r?.audit && typeof r.audit === 'object' ? r.audit : null;
              const acceptances = audit?.acceptances || {};
              const docs = audit?.legalDocs || {};

              const ek1MailProofValue =
                ek1MailProofById?.[r.id] ??
                (r?.deliveryProof?.ek1?.messageId ? String(r.deliveryProof.ek1.messageId) : '');

              const extras = Array.isArray(r?.extrasSelected) ? r.extrasSelected : [];
              const extrasEstimatedTotal = extras.reduce((sum, ex) => {
                const per = Number(ex?.estimatedPricePerPersonUsd) || 0;
                return sum + per * (people || 0);
              }, 0);

              return (
                <div key={r.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.tourName || 'Tur'}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Rezervasyon No: <span className="font-semibold">{r.id}</span>
                      </p>
                      {r.paymentReference ? (
                        <p className="text-xs text-gray-600">
                          Ödeme Referansı: <span className="font-semibold">{r.paymentReference}</span>
                        </p>
                      ) : null}
                      <p className="text-xs text-gray-600">
                        Müşteri: {r.contact?.name || '-'} | {r.userEmail || r.contact?.email || '-'} | {r.contact?.phone || '-'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Paket: {r.packageName || '-'} | Kişi: {people || 0}
                      </p>
                      {created ? <p className="text-xs text-gray-500">Oluşturma: {created}</p> : null}
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-xs text-gray-600">Durum</p>
                      <p className="text-sm font-semibold text-gray-900">{statusLabel}</p>
                      <p className="text-xs text-gray-500 mt-1">Kapora: ${amountNow}{depositPercent ? ` (\u0025${depositPercent})` : ''}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadEk1Html({ reservation: { id: r.id, ...r } })}
                        className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                      >
                        Ek-1 indir (HTML)
                      </button>

                      <button
                        type="button"
                        onClick={() => openEk1InNewTab({ reservation: { id: r.id, ...r } })}
                        className="px-3 py-1.5 rounded-full border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-50"
                      >
                        Ek-1 önizle
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadJson({ filename: `reservation-${r.id}`, data: { id: r.id, ...r } })}
                        className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                      >
                        Log indir (JSON)
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-800">Onay / Audit Özeti</p>
                    {!audit ? (
                      <p className="text-xs text-gray-500 mt-1">Audit bulunamadı (eski kayıt olabilir).</p>
                    ) : (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                          <p className="text-[11px] text-gray-600">Sözleşme</p>
                          <p className="text-xs font-semibold text-gray-900">
                            {docs?.packageTourAgreement?.version || '-'}
                          </p>
                          {docs?.packageTourAgreement?.url ? (
                            <p className="text-[11px] text-gray-500 break-all">{docs.packageTourAgreement.url}</p>
                          ) : null}
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                          <p className="text-[11px] text-gray-600">Mesafeli Satış</p>
                          <p className="text-xs font-semibold text-gray-900">
                            {docs?.distanceSalesAgreement?.version || '-'}
                          </p>
                          {docs?.distanceSalesAgreement?.url ? (
                            <p className="text-[11px] text-gray-500 break-all">{docs.distanceSalesAgreement.url}</p>
                          ) : null}
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                          <p className="text-[11px] text-gray-600">KVKK</p>
                          <p className="text-xs font-semibold text-gray-900">{docs?.kvkk?.version || '-'}</p>
                          {docs?.kvkk?.url ? (
                            <p className="text-[11px] text-gray-500 break-all">{docs.kvkk.url}</p>
                          ) : null}
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 md:col-span-3">
                          <p className="text-[11px] text-gray-600">Zorunlu checkbox'lar</p>
                          <p className="text-xs text-gray-800">
                            Terms: <span className={acceptances?.acceptTerms ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>{String(!!acceptances?.acceptTerms)}</span>
                            {' | '}Distance Sales: <span className={acceptances?.acceptDistanceSales ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>{String(!!acceptances?.acceptDistanceSales)}</span>
                            {' | '}Pricing: <span className={acceptances?.acceptPricingScope ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>{String(!!acceptances?.acceptPricingScope)}</span>
                            {' | '}KVKK: <span className={acceptances?.acceptKvkk ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>{String(!!acceptances?.acceptKvkk)}</span>
                            {' | '}Deposit: <span className={acceptances?.acceptDepositTerms ? 'font-semibold text-emerald-700' : 'font-semibold text-gray-600'}>{String(acceptances?.acceptDepositTerms)}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">Onay zamanı (client): {audit?.createdAtClientIso || '-'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Paket toplamı</p>
                      <p className="text-sm font-semibold text-gray-900">${packageTotalUsd}</p>
                      {people ? <p className="text-[11px] text-gray-500 mt-1">Kişi başı: ${perPersonPackageUsd}</p> : null}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Ekstralar toplamı</p>
                      <p className="text-sm font-semibold text-gray-900">${extrasTotalUsd}</p>
                      {people ? <p className="text-[11px] text-gray-500 mt-1">Kişi başı: ${perPersonExtrasUsd}</p> : null}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Genel toplam</p>
                      <p className="text-sm font-semibold text-gray-900">${grandTotalUsd}</p>
                      {people ? <p className="text-[11px] text-gray-500 mt-1">Kişi başı: ${perPersonGrandUsd}</p> : null}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Durum Güncelle</label>
                      <select
                        value={r.status || ''}
                        onChange={(e) => updateReservation(r.id, { status: e.target.value })}
                        disabled={busyId === r.id}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      >
                        {Object.values(RESERVATION_STATUS).map((s) => (
                          <option key={s} value={s}>
                            {getReservationStatusLabel(s)}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Not: Müşteri panelinde "Rezervasyonu tamamla" sadece "Kalan ödeme açıldı" durumunda aktif olur.
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Kapora Ödeme Yöntemi</label>
                      <select
                        value={depositPaymentMethod}
                        onChange={(e) => updateReservation(r.id, { depositPaymentMethod: e.target.value || null })}
                        disabled={busyId === r.id}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Seçilmedi</option>
                        <option value="card">Kredi kartı</option>
                        <option value="wise">Wise</option>
                        <option value="eft_fast">EFT/FAST</option>
                        <option value="swift">SWIFT</option>
                        <option value="cash">Nakit</option>
                        <option value="other">Diğer</option>
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1">Bunu admin işaretler; müşteri panelinde de görünebilir.</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Nihai Toplam (USD)</label>
                      <input
                        type="number"
                        min="0"
                        defaultValue={finalTotalUsd}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (String(v) === String(finalTotalUsd)) return;
                          updateReservation(r.id, { offer: { ...(r.offer || {}), finalTotalUsd: v === '' ? null : Number(v) } });
                        }}
                        disabled={busyId === r.id}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="Örn: 4200"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Teklif netleşince burayı girip "Kalan ödeme"yi açabilirsiniz.</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Notu</label>
                      <input
                        type="text"
                        defaultValue={note}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (String(v) === String(note)) return;
                          updateReservation(r.id, { offer: { ...(r.offer || {}), note: v || null } });
                        }}
                        disabled={busyId === r.id}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="Örn: Uçuş dahil değil, fiyat güncellendi"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Bu alan müşteri tarafına gösterilmez (şimdilik).</p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Ek-1 Gönderim Delili (E-posta No)</label>
                      <input
                        type="text"
                        value={ek1MailProofValue}
                        onChange={(e) =>
                          setEk1MailProofById((prev) => ({
                            ...(prev || {}),
                            [r.id]: e.target.value,
                          }))
                        }
                        disabled={busyId === r.id}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="Örn: MSG-2026-000123 veya provider messageId"
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={async () => {
                            const trimmed = String(ek1MailProofValue || '').trim();
                            const to = r?.contact?.email || r?.userEmail || null;
                            await updateReservation(r.id, {
                              'deliveryProof.ek1.channel': trimmed ? 'email' : null,
                              'deliveryProof.ek1.to': trimmed ? to : null,
                              'deliveryProof.ek1.messageId': trimmed || null,
                              'deliveryProof.ek1.sentAt': trimmed ? serverTimestamp() : null,
                            });
                          }}
                          className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                        >
                          Kaydet
                        </button>
                        <p className="text-[11px] text-gray-500">
                          {r?.deliveryProof?.ek1?.sentAt ? `Kaydedildi: ${formatMaybeTimestamp(r.deliveryProof.ek1.sentAt)}` : 'Henüz kaydedilmedi'}
                        </p>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Not: Bu alan, Ek-1 nüshasının e-posta ile gönderildiğine ilişkin delil kaydı tutmak içindir.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-800">Opsiyonel Ekstralar</p>
                    {extras.length === 0 ? (
                      <p className="text-xs text-gray-500 mt-1">Seçili ekstra yok.</p>
                    ) : (
                      <div className="mt-2 space-y-1">
                        {extras.map((ex) => {
                          const per = Number(ex?.estimatedPricePerPersonUsd) || 0;
                          const estTotal = per * (people || 0);
                          return (
                            <div key={ex?.id || ex?.title} className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 text-xs">
                              <div className="text-gray-800">
                                <span className="font-semibold">{ex?.title || 'Ekstra'}</span>
                                {ex?.day ? <span className="text-gray-500"> • Gün {ex.day}</span> : null}
                              </div>
                              <div className="text-gray-600">
                                {people ? `${people} kişi × $${per} ≈ $${estTotal}` : `Kişi başı ≈ $${per}`}
                              </div>
                            </div>
                          );
                        })}
                        {people ? (
                          <p className="text-[11px] text-gray-500 mt-2">
                            Tahmini ekstra toplamı: <span className="font-semibold">≈ ${extrasEstimatedTotal}</span>
                          </p>
                        ) : null}
                        <p className="text-[11px] text-gray-500">
                          Not: Bu tutarlar tahminidir; nihai toplam teklif aşamasında yazılı netleşir.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col md:flex-row gap-2">
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() =>
                        updateReservation(r.id, {
                          status: RESERVATION_STATUS.DEPOSIT_PAID,
                          depositPaidAt: serverTimestamp(),
                        })
                      }
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Kapora alındı işaretle
                    </button>

                    <button
                      type="button"
                      disabled={!r.contact?.phone}
                      onClick={() => openWhatsAppToCustomer(r.contact?.phone, getDepositReceivedMessage(r))}
                      className={
                        r.contact?.phone
                          ? "px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50"
                          : "px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-300 text-sm font-semibold cursor-not-allowed"
                      }
                      title={r.contact?.phone ? "Kapora alındı mesajını müşteriye gönder" : "Müşteri telefonu yok"}
                    >
                      Kapora alındı mesajı (WhatsApp)
                    </button>

                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={async () => {
                        const customerPhone = r?.contact?.phone;

                        const amountNowLocal = Number(r?.totalsUsd?.amountToPayNowUsd) || 0;
                        const finalTotalLocal = Number(r?.offer?.finalTotalUsd);
                        const fallbackTotalLocal = Number(r?.totalsUsd?.grandTotalUsd) || 0;
                        const totalUsdLocal = Number.isFinite(finalTotalLocal) && finalTotalLocal > 0 ? finalTotalLocal : fallbackTotalLocal;
                        const balanceDueLocal = totalUsdLocal > 0 ? Math.max(0, Math.round((totalUsdLocal - amountNowLocal) * 100) / 100) : null;

                        const patch = {
                          status: RESERVATION_STATUS.BALANCE_PAYMENT_OPEN,
                          balancePaymentOpenedAt: serverTimestamp(),
                        };
                        if (balanceDueLocal !== null) {
                          patch['totalsUsd.balanceDueUsd'] = balanceDueLocal;
                          patch['totalsUsd.finalTotalUsd'] = totalUsdLocal;
                        }

                        await updateReservation(r.id, patch);

                        if (customerPhone) {
                          openWhatsAppToCustomer(customerPhone, getBalancePaymentOpenedMessage(r));
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-60"
                    >
                      Kalan ödemeyi aç
                    </button>

                    <button
                      type="button"
                      disabled={busyId === r.id || !r.contact?.phone || r.status !== RESERVATION_STATUS.COMPLETED}
                      onClick={() => openWhatsAppToCustomer(r.contact?.phone, getReservationCompletedMessage(r))}
                      className={
                        busyId === r.id || !r.contact?.phone || r.status !== RESERVATION_STATUS.COMPLETED
                          ? "px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-300 text-sm font-semibold cursor-not-allowed"
                          : "px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50"
                      }
                      title={
                        !r.contact?.phone
                          ? 'Müşteri telefonu yok'
                          : r.status !== RESERVATION_STATUS.COMPLETED
                            ? 'Bu mesajı göndermek için durum Tamamlandı olmalı'
                            : 'Rezervasyon tamamlandı mesajını gönder'
                      }
                    >
                      Rezervasyon tamamlandı mesajı
                    </button>

                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() =>
                        openWhatsAppToCustomer(
                          r.contact?.phone,
                          [
                            getCustomerGreetingLine(r),
                            '',
                            ...getCustomerIntroLines(r),
                            'Rezervasyonunuzla ilgili bilgilendirme sağlamak istiyorum.',
                            `Rezervasyon No: ${r.id}`,
                            r.paymentReference ? `Ödeme Referansı: ${r.paymentReference}` : '',
                            r.tourName ? `Tur: ${r.tourName}` : '',
                            'Kapora kaydınızı gördük. Tur planını ve nihai fiyatları netleştiriyoruz.',
                          ].filter(Boolean).join('\n')
                        )
                      }
                      className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                    >
                      Müşteriye WhatsApp yaz
                    </button>
                  </div>

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsAppToBusiness(
                          [
                            'Admin notu (kendime):',
                            `Rezervasyon No: ${r.id}`,
                            r.contact?.name ? `Müşteri: ${r.contact.name}` : '',
                            r.userEmail ? `E-posta: ${r.userEmail}` : '',
                          ].filter(Boolean).join('\n')
                        )
                      }
                      className="text-[11px] text-gray-500 hover:text-gray-700"
                    >
                      (İstersen kendi WhatsApp hattına not bırak)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
