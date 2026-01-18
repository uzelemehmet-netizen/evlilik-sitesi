import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { auth, db } from "../config/firebase";
import { useAuth } from "../auth/AuthProvider";
import { getReservationStatusLabel, normalizePhoneForWhatsApp, RESERVATION_STATUS } from "../utils/reservationStatus";
import { formatMaybeTimestamp } from "../utils/formatDate";
import { downloadJson } from "../utils/downloadFile";
import { downloadEk1Html, openEk1InNewTab } from "../utils/ek1";
import { getWhatsAppNumber } from "../utils/whatsapp";

export default function ReservationsPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "reservations"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(25)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setReservations(items);
        setReservationsLoading(false);
      },
      (err) => {
        console.error("Rezervasyonlar yüklenemedi:", err);
        setReservationsLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  const whatsappNumber = getWhatsAppNumber();

  const openWhatsApp = (text) => {
    if (!whatsappNumber) return;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/40">
      <Navigation />

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Rezervasyonlarım</h1>
              <p className="text-sm text-gray-600 mt-1">Tur rezervasyonları, kapora ve kalan ödeme adımları.</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            >
              Çıkış
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Hesap</p>
            <p className="text-sm text-slate-700 mt-1">
              Kullanıcı adı (e-posta): <span className="font-semibold">{user?.email || "-"}</span>
            </p>
            {user?.displayName ? (
              <p className="text-sm text-slate-700">
                Ad: <span className="font-semibold">{user.displayName}</span>
              </p>
            ) : null}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Rezervasyonlar</p>
            {reservationsLoading ? (
              <p className="text-sm text-slate-600 mt-1">Yükleniyor…</p>
            ) : reservations.length === 0 ? (
              <p className="text-sm text-slate-600 mt-1">Henüz rezervasyon kaydınız yok.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {reservations.map((r) => {
                  const statusLabel = getReservationStatusLabel(r.status);
                  const created = formatMaybeTimestamp(r.createdAt);
                  const amountNow = Number(r?.totalsUsd?.amountToPayNowUsd) || 0;
                  const paymentReference = r?.paymentReference || "";
                  const canRequestBalance = r.status === RESERVATION_STATUS.BALANCE_PAYMENT_OPEN;
                  const contactPhone = r?.contact?.phone || "";

                  return (
                    <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{r.tourName || "Tur"}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            Rezervasyon No: <span className="font-semibold">{r.id}</span>
                          </p>
                          {created ? <p className="text-xs text-slate-500">Oluşturma: {created}</p> : null}
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-slate-600">Durum</p>
                          <p className="text-sm font-semibold text-slate-900">{statusLabel}</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-white border border-slate-200 p-3">
                        <p className="text-xs text-slate-600">Ödeme referansı</p>
                        <p className="text-sm font-semibold text-slate-900">{paymentReference || "-"}</p>
                        <p className="text-[11px] text-slate-500 mt-1">Wise/SWIFT/EFT açıklamasına yazmanız önerilir.</p>
                      </div>

                      <div className="mt-3 flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => downloadEk1Html({ reservation: { id: r.id, ...r } })}
                          className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                        >
                          Ek-1 indir (HTML)
                        </button>

                        <button
                          type="button"
                          onClick={() => openEk1InNewTab({ reservation: { id: r.id, ...r } })}
                          className="px-4 py-2 rounded-full border border-emerald-300 text-emerald-800 text-sm font-semibold hover:bg-emerald-50"
                        >
                          Ek-1 önizle
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadJson({ filename: `reservation-${r.id}`, data: { id: r.id, ...r } })}
                          className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                        >
                          Log indir (JSON)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            openWhatsApp(
                              [
                                "Kapora ödememi yaptım, dekontu paylaşıyorum.",
                                `Rezervasyon No: ${r.id}`,
                                paymentReference ? `Ödeme Referansı: ${paymentReference}` : "",
                                r.tourName ? `Tur: ${r.tourName}` : "",
                                `Kapora: $${amountNow}`,
                              ]
                                .filter(Boolean)
                                .join("\n")
                            );
                          }}
                          className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                        >
                          Kapora dekontu gönder
                        </button>

                        <button
                          type="button"
                          disabled={!canRequestBalance}
                          onClick={() => {
                            openWhatsApp(
                              [
                                "Rezervasyonu tamamlamak (kalan ödeme) istiyorum.",
                                `Rezervasyon No: ${r.id}`,
                                r.tourName ? `Tur: ${r.tourName}` : "",
                                contactPhone ? `Telefon: ${normalizePhoneForWhatsApp(contactPhone)}` : "",
                              ]
                                .filter(Boolean)
                                .join("\n")
                            );
                          }}
                          className={
                            canRequestBalance
                              ? "px-4 py-2 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700"
                              : "px-4 py-2 rounded-full border border-slate-300 text-slate-400 text-sm font-semibold cursor-not-allowed"
                          }
                        >
                          Rezervasyonu tamamla
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/tours" className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                Turları incele
              </Link>
              <a
                href="/docs/odeme-yontemleri.html"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full border border-slate-300 text-slate-800 text-sm font-semibold hover:bg-slate-50"
              >
                Ödeme yöntemleri
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
