import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { getWhatsAppNumber, openWhatsApp } from "../utils/whatsapp";
import { useAuth } from "../auth/AuthProvider";
import { createReservationFromPaymentState } from "../utils/reservations";
import { downloadJson } from "../utils/downloadFile";
import { downloadEk1Html, openEk1InNewTab } from "../utils/ek1";

const WHATSAPP_NUMBER = getWhatsAppNumber();

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const state = location?.state || {};

  const [reservationId, setReservationId] = useState(state.reservationId || "");
  const [paymentReference, setPaymentReference] = useState(state.paymentReference || "");
  const [reservationBusy, setReservationBusy] = useState(false);
  const [reservationError, setReservationError] = useState("");

  const audit = useMemo(() => {
    const fromState = state?.audit && typeof state.audit === "object" ? state.audit : null;
    if (fromState) return fromState;
    const auditId = state?.auditId || state?.audit?.auditId;
    if (!auditId) return null;
    try {
      const raw = localStorage.getItem(`reservation_audit_${auditId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [state?.audit, state?.auditId]);

  const DEFAULT_FLIGHT_INCLUDED_LIMIT_USD = 750;
  const isFlightIncluded = state.includeFlight !== false;
  const effectiveFlightLimitPerPersonUsd = isFlightIncluded
    ? DEFAULT_FLIGHT_INCLUDED_LIMIT_USD
    : null;

  const amount = Number(state.amountToPayNowUsd) || 0;
  const reservationType = state.reservationType === "deposit" ? "deposit" : "full";

  const extrasSelected = Array.isArray(state.extrasSelected) ? state.extrasSelected : [];

  const people = Number(state.people) || 0;
  const packageTotalUsd = Number(state.packageTotalUsd) || 0;
  const extrasTotalUsd = Number(state.extrasTotalUsd) || 0;
  const grandTotalUsd = Number(state.grandTotalUsd) || 0;
  const depositPercent = Number(state.depositPercent) || 0;

  const perPersonPackageUsd = people > 0 ? Math.round((packageTotalUsd / people) * 100) / 100 : 0;
  const perPersonExtrasUsd = people > 0 ? Math.round((extrasTotalUsd / people) * 100) / 100 : 0;
  const perPersonGrandUsd = people > 0 ? Math.round((grandTotalUsd / people) * 100) / 100 : 0;

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      if (reservationId) return;
      if (!state?.tourId) return;

      setReservationBusy(true);
      setReservationError("");
      try {
        const result = await createReservationFromPaymentState({
          user,
          paymentState: state,
        });
        setReservationId(result?.id || "");
        setPaymentReference(result?.paymentReference || "");
      } catch (e) {
        console.error("Rezervasyon kaydı oluşturulamadı:", e);
        setReservationError("Rezervasyon kaydı oluşturulamadı. Lütfen sayfayı yenileyin veya WhatsApp'tan yazın.");
      } finally {
        setReservationBusy(false);
      }
    };

    run();
  }, [reservationId, state, user]);

  const paymentOptionsWhatsappText = useMemo(() => {
    const lines = [];
    lines.push("Ödeme yöntemleri hakkında bilgi almak istiyorum.");
    lines.push("");

    if (reservationId) lines.push(`Rezervasyon No: ${reservationId}`);
    if (paymentReference) lines.push(`Ödeme Referansı: ${paymentReference}`);

    if (state.tourName) lines.push(`Tur: ${state.tourName}`);
    if (state.packageName) lines.push(`Paket: ${state.packageName}`);
    lines.push(`Katılımcı sayısı: ${Number(state.people) || 0}`);
    lines.push(`Uçak bileti: ${isFlightIncluded ? "Dahil" : "Hariç"}`);
    if (isFlightIncluded) {
      lines.push(`Uçak bileti limiti: kişi başı $${Number(effectiveFlightLimitPerPersonUsd) || 0}’a kadar`);
    }

    if (extrasSelected.length > 0) {
      lines.push("");
      lines.push("Seçilen opsiyonel aktiviteler:");
      extrasSelected.forEach((extra) => {
        const title = extra?.title || "";
        const day = Number(extra?.day);
        const perPerson = Number(extra?.estimatedPricePerPersonUsd) || 0;
        const dayPrefix = Number.isFinite(day) && day > 0 ? `${day}. gün | ` : "";
        lines.push(`- ${dayPrefix}${title} (kişi başı ~$${perPerson})`);
      });
    }

    lines.push("");
    lines.push(`Paket toplamı: $${Number(state.packageTotalUsd) || 0}`);
    lines.push(`Opsiyonel aktiviteler toplamı: $${Number(state.extrasTotalUsd) || 0}`);
    lines.push(`Genel toplam: $${Number(state.grandTotalUsd) || 0}`);
    lines.push(reservationType === "deposit"
      ? `Kapora (%${Number(state.depositPercent) || 0}): $${amount}`
      : `Ödenecek tutar: $${amount}`);

    const contact = state.contact || {};
    if (contact.name || contact.phone || contact.email || contact.notes) {
      lines.push("");
      lines.push("İletişim bilgileri:");
      if (contact.name) lines.push(`Ad Soyad: ${contact.name}`);
      if (contact.phone) lines.push(`Telefon: ${contact.phone}`);
      if (contact.email) lines.push(`E-posta: ${contact.email}`);
      if (contact.notes) lines.push(`Not: ${contact.notes}`);
    }

    return lines.join("\n");
  }, [
    amount,
    extrasSelected,
    effectiveFlightLimitPerPersonUsd,
    isFlightIncluded,
    reservationId,
    paymentReference,
    reservationType,
    state.contact,
    state.depositPercent,
    state.extrasTotalUsd,
    state.grandTotalUsd,
    state.packageName,
    state.packageTotalUsd,
    state.people,
    state.tourName,
  ]);

  const openWhatsAppWithText = (text) => {
    if (!WHATSAPP_NUMBER) {
      console.warn("VITE_WHATSAPP_NUMBER tanımlı değil.");
      return;
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    openWhatsApp(url);
  };

  const cardPaymentRequestText = useMemo(() => {
    const lines = [];
    lines.push("Kredi kartı ile (3D Secure zorunlu) ödeme yapmak istiyorum.");
    lines.push("Kredi kartından IDR (veya mümkünse USD) tahsilat seçeneklerini paylaşır mısınız?");
    lines.push("");

    if (reservationId) lines.push(`Rezervasyon No: ${reservationId}`);
    if (paymentReference) lines.push(`Ödeme Referansı: ${paymentReference}`);

    if (state.tourName) lines.push(`Tur: ${state.tourName}`);
    if (state.packageName) lines.push(`Paket: ${state.packageName}`);
    lines.push(`Katılımcı sayısı: ${Number(state.people) || 0}`);
    lines.push(reservationType === "deposit"
      ? `Kapora (%${Number(state.depositPercent) || 0}): $${amount}`
      : `Ödenecek tutar: $${amount}`);

    const contact = state.contact || {};
    if (contact.name || contact.phone || contact.email) {
      lines.push("");
      lines.push("İletişim:");
      if (contact.name) lines.push(`Ad Soyad: ${contact.name}`);
      if (contact.phone) lines.push(`Telefon: ${contact.phone}`);
      if (contact.email) lines.push(`E-posta: ${contact.email}`);
    }

    return lines.join("\n");
  }, [amount, reservationId, paymentReference, reservationType, state.contact, state.depositPercent, state.packageName, state.people, state.tourName]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50/40">
      <Navigation />

      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Ödeme</h1>
          <p className="text-sm text-gray-600 mb-2">
            Bu sayfa, rezervasyon özetinizi gösterir ve ödeme adımına yönlendirir.
          </p>

          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/logos/moonstar-mark-square.png"
                alt="PT MoonStar Global Indonesia"
                className="h-9 w-9 rounded-lg border border-slate-200 bg-white object-contain"
                loading="lazy"
              />
              <div>
                <p className="text-[11px] text-slate-600">Yasal satıcı</p>
                <p className="text-sm font-semibold text-slate-900">PT MoonStar Global Indonesia</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/kurumsal")}
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-white transition-colors"
            >
              Kurumsal bilgileri gör
            </button>
          </div>

          <div className="space-y-2 text-sm text-gray-800">
            <p>
              Rezervasyon No:{" "}
              <span className="font-semibold">
                {reservationBusy ? "Oluşturuluyor…" : reservationId || "-"}
              </span>
            </p>
            <p>
              Ödeme Referansı:{" "}
              <span className="font-semibold">
                {reservationBusy ? "Oluşturuluyor…" : paymentReference || "-"}
              </span>
              <span className="text-gray-600"> (Wise/SWIFT/EFT açıklamasına yazın)</span>
            </p>
            {reservationError ? (
              <p className="text-xs text-rose-700">{reservationError}</p>
            ) : null}
            <p>
              Tur: <span className="font-semibold">{state.tourName || "-"}</span>
            </p>
            <p>
              Paket: <span className="font-semibold">{state.packageName || "-"}</span>
            </p>
            <p>
              Katılımcı sayısı: <span className="font-semibold">{state.people || 0}</span>
            </p>
            <p>
              Uçak bileti: {isFlightIncluded ? (
                <span className="font-semibold">Dahil</span>
              ) : (
                <span className="font-semibold">Hariç</span>
              )}
              {isFlightIncluded ? (
                <span className="text-gray-600"> (kişi başı ${effectiveFlightLimitPerPersonUsd}’a kadar)</span>
              ) : null}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-200 space-y-1">
              <p>
                Paket toplamı: <span className="font-semibold">${packageTotalUsd}</span>
                {people ? <span className="text-gray-600"> (kişi başı ${perPersonPackageUsd})</span> : null}
              </p>
              <p>
                Opsiyonel aktiviteler: <span className="font-semibold">${extrasTotalUsd}</span>
                {people ? <span className="text-gray-600"> (kişi başı ${perPersonExtrasUsd})</span> : null}
              </p>
              <p>
                Genel toplam: <span className="font-semibold">${grandTotalUsd}</span>
                {people ? <span className="text-gray-600"> (kişi başı ${perPersonGrandUsd})</span> : null}
              </p>
              {reservationType === "deposit" && (
                <p>
                  Kapora (%{depositPercent || 0}): <span className="font-semibold">${amount}</span>
                </p>
              )}
              {reservationType === "full" && (
                <p>
                  Ödenecek tutar: <span className="font-semibold">${amount}</span>
                </p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm font-semibold text-gray-900">Seçilen opsiyonel aktiviteler</p>
              {extrasSelected.length === 0 ? (
                <p className="text-sm text-gray-600 mt-1">Seçili ekstra yok.</p>
              ) : (
                <div className="mt-2 space-y-1 text-sm text-gray-800">
                  {extrasSelected.map((ex) => {
                    const title = ex?.title || 'Ekstra';
                    const day = Number(ex?.day);
                    const per = Number(ex?.estimatedPricePerPersonUsd) || 0;
                    const estTotal = per * (people || 0);
                    return (
                      <div key={ex?.id || ex?.title} className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                        <div>
                          <span className="font-semibold">{title}</span>
                          {Number.isFinite(day) && day > 0 ? <span className="text-gray-600"> • Gün {day}</span> : null}
                        </div>
                        <div className="text-gray-700">
                          {people ? `${people} kişi × $${per} ≈ $${estTotal}` : `Kişi başı ≈ $${per}`}
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-gray-500 mt-2">Not: Opsiyonel/ekstra kalemlerin bedelleri yaklaşık olabilir; seçime ve satın alma anına göre değişebilir.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm font-semibold text-gray-900">İletişim</p>
              <div className="mt-2 space-y-1 text-sm text-gray-800">
                <p>Ad Soyad: <span className="font-semibold">{state?.contact?.name || '-'}</span></p>
                <p>Telefon: <span className="font-semibold">{state?.contact?.phone || '-'}</span></p>
                <p>E-posta: <span className="font-semibold">{state?.contact?.email || user?.email || '-'}</span></p>
                {state?.contact?.notes ? <p>Not: <span className="font-semibold">{state.contact.notes}</span></p> : null}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Geri dön
            </button>
            <a
              href="/dokumanlar?doc=odeme-yontemleri"
              className="px-5 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors text-center"
            >
              Ödeme yöntemlerini görüntüle
            </a>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-gray-800 font-semibold">Ödeme seçenekleri</p>
            <p className="text-xs text-slate-600 mt-1">
              Fiyatlar USD olarak gösterilebilir; tahsilat işlem anındaki kur/komisyonlara göre IDR veya desteklenen para biriminde yapılabilir.
              Kredi kartında 3D Secure (3DS) zorunludur.
            </p>
            <p className="text-xs text-slate-600 mt-2">
              İade süreçlerinde, mevzuatın ve/veya ödeme kuruluşu/banka kurallarının zorunlu kıldığı haller saklı kalmak kaydıyla; iadeler kural olarak banka transferi (EFT/FAST/SWIFT) ile yapılır ve kredi kartına iade yapılmaması esastır.
              Banka transferiyle tahsil edilen döviz cinsinden ödemeler, mümkün olduğu ölçüde aynı döviz cinsinden iade edilir.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-900">English legal documents</p>
              <p className="text-[11px] text-slate-600 mt-1">
                For payment-provider review purposes. Turkish documents and the written official offer/annexes prevail.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href="/dokumanlar?lang=en"
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-900 text-xs font-semibold hover:bg-slate-50"
                >
                  Documents (EN) hub
                </a>
                <a
                  href="/docs/package-tour-agreement-en.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-900 text-xs font-semibold hover:bg-slate-50"
                >
                  Package Tour (EN)
                </a>
                <a
                  href="/docs/distance-sales-agreement-en.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-900 text-xs font-semibold hover:bg-slate-50"
                >
                  Distance Sales (EN)
                </a>
                <a
                  href="/docs/pre-information-form-en.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-900 text-xs font-semibold hover:bg-slate-50"
                >
                  Pre-Information (EN)
                </a>
                <a
                  href="/docs/cancellation-refund-policy-en.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-900 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancellation/Refund (EN)
                </a>
                <a
                  href="/docs/kvkk-information-notice-en.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-900 text-xs font-semibold hover:bg-slate-50"
                >
                  KVKK Notice (EN)
                </a>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openWhatsAppWithText(cardPaymentRequestText)}
                className="w-full px-5 py-3 rounded-2xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors text-left"
              >
                Kredi Kartı (3D Secure) ile öde
                <div className="text-xs font-normal text-white/90 mt-1">IDR (veya mümkünse USD) tahsilat</div>
              </button>

              <a
                href="/dokumanlar?doc=wise-odeme-talimatlari"
                className="w-full px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50 transition-colors text-left"
              >
                Wise ile ödeme
                <div className="text-xs font-normal text-slate-600 mt-1">Talimatları görüntüle</div>
              </a>

              <a
                href="/dokumanlar?doc=swift-odeme-talimatlari"
                className="w-full px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50 transition-colors text-left"
              >
                SWIFT ile ödeme
                <div className="text-xs font-normal text-slate-600 mt-1">Banka transferi</div>
              </a>

              <a
                href="/dokumanlar?doc=eft-fast-odeme-talimatlari"
                className="w-full px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50 transition-colors text-left"
              >
                EFT / FAST (Türkiye)
                <div className="text-xs font-normal text-slate-600 mt-1">Alternatif ödeme</div>
              </a>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-600 font-medium">WhatsApp ile ödeme talebi gönder</p>
              <button
                type="button"
                onClick={() => openWhatsAppWithText(paymentOptionsWhatsappText)}
                className="mt-2 w-full px-5 py-2 rounded-full border border-slate-300 text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors"
              >
                Ödeme özeti + alternatif yöntemler
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-slate-600">
                Tahsilat ve sözleşmeler, <span className="font-semibold">PT MoonStar Global Indonesia</span> üzerinden yürütülür.
              </p>
              <img
                src="/logos/moonstar-lockup-horizontal.png"
                alt="MoonStar"
                className="h-7 w-auto opacity-90"
                loading="lazy"
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Kayıt & onay logu</p>
            <p className="text-xs text-slate-600 mt-1">
              Bu dosya; seçtiğiniz paket/ekstralar, iletişim bilgileriniz ve sözleşme/KVKK onaylarınızın özetini içerir.
            </p>

            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={!audit}
                onClick={() => {
                  const payload = {
                    ...state,
                    reservationType,
                    people,
                    extrasSelected,
                    totalsUsd: {
                      packageTotalUsd,
                      extrasTotalUsd,
                      grandTotalUsd,
                      depositPercent,
                      amountToPayNowUsd: amount,
                    },
                    contact: state?.contact || null,
                    audit,
                  };

                  downloadEk1Html({
                    paymentState: payload,
                    reservationId: reservationId || null,
                    paymentReference: paymentReference || null,
                    audit,
                  });
                }}
                className="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ek-1 indir (HTML)
              </button>

              <button
                type="button"
                disabled={!audit}
                onClick={() => {
                  const payload = {
                    ...state,
                    reservationType,
                    people,
                    extrasSelected,
                    totalsUsd: {
                      packageTotalUsd,
                      extrasTotalUsd,
                      grandTotalUsd,
                      depositPercent,
                      amountToPayNowUsd: amount,
                    },
                    contact: state?.contact || null,
                    audit,
                  };

                  openEk1InNewTab({
                    paymentState: payload,
                    reservationId: reservationId || null,
                    paymentReference: paymentReference || null,
                    audit,
                  });
                }}
                className="px-5 py-2 rounded-full border border-emerald-300 text-emerald-800 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ek-1 önizle
              </button>

              <button
                type="button"
                disabled={!audit}
                onClick={() => {
                  const payload = {
                    exportedAtClientIso: new Date().toISOString(),
                    reservationId: reservationId || null,
                    paymentReference: paymentReference || null,
                    paymentState: {
                      tourId: state?.tourId || null,
                      tourName: state?.tourName || null,
                      packageId: state?.packageId || null,
                      packageName: state?.packageName || null,
                      reservationType,
                      people,
                      includeFlight: isFlightIncluded,
                      flightLimitPerPersonUsd: Number(effectiveFlightLimitPerPersonUsd) || null,
                      extrasSelected,
                      totalsUsd: {
                        packageTotalUsd,
                        extrasTotalUsd,
                        grandTotalUsd,
                        depositPercent,
                        amountToPayNowUsd: amount,
                      },
                      contact: state?.contact || null,
                    },
                    audit,
                  };
                  const base = reservationId ? `reservation-${reservationId}-log` : "reservation-log";
                  downloadJson({ filename: base, data: payload });
                }}
                className="px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Log indir (JSON)
              </button>

              <a
                href="/docs/paket-tur-sozlesmesi.html"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-full border border-slate-300 text-slate-900 text-sm font-semibold hover:bg-slate-50 text-center"
              >
                Sözleşmeyi aç
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
