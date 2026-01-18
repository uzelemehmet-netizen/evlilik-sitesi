import { LEGAL_DOCS } from "../config/legalDocs";
import { COMPANY } from "../config/company";
import { downloadTextFile } from "./downloadFile";

function escapeHtml(v) {
  const s = String(v ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtUsd(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return `$${Math.round(n * 100) / 100}`;
}

function normalizeReservationSource({ reservation, paymentState, reservationId, paymentReference, audit }) {
  const sourceReservation = reservation && typeof reservation === "object" ? reservation : null;
  const sourcePayment = paymentState && typeof paymentState === "object" ? paymentState : null;

  const resolvedReservationId =
    String(reservationId || "").trim() ||
    String(sourceReservation?.id || sourceReservation?._id || "").trim() ||
    null;

  const resolvedPaymentReference =
    String(paymentReference || "").trim() ||
    String(sourceReservation?.paymentReference || sourcePayment?.paymentReference || "").trim() ||
    null;

  const contact = sourceReservation?.contact || sourcePayment?.contact || {};
  const totalsUsd = sourceReservation?.totalsUsd || sourcePayment?.totalsUsd || {};

  const reservationType =
    (sourceReservation?.reservationType || sourcePayment?.reservationType) === "full" ? "full" : "deposit";

  const people = Number(sourceReservation?.people ?? sourcePayment?.people) || 0;

  const tourName = sourceReservation?.tourName || sourcePayment?.tourName || "";
  const packageName = sourceReservation?.packageName || sourcePayment?.packageName || "";

  const amountToPayNowUsd = Number(totalsUsd?.amountToPayNowUsd ?? sourcePayment?.amountToPayNowUsd) || 0;
  const depositPercent = Number(totalsUsd?.depositPercent ?? sourcePayment?.depositPercent) || 0;

  const packageTotalUsd = Number(totalsUsd?.packageTotalUsd ?? sourcePayment?.packageTotalUsd) || 0;
  const extrasTotalUsd = Number(totalsUsd?.extrasTotalUsd ?? sourcePayment?.extrasTotalUsd) || 0;
  const grandTotalUsd = Number(totalsUsd?.grandTotalUsd ?? sourcePayment?.grandTotalUsd) || 0;

  const finalTotalUsd = Number(totalsUsd?.finalTotalUsd) || null;
  const balanceDueUsd =
    Number.isFinite(Number(totalsUsd?.balanceDueUsd))
      ? Number(totalsUsd.balanceDueUsd)
      : finalTotalUsd && Number.isFinite(finalTotalUsd)
        ? Math.max(0, Math.round((finalTotalUsd - amountToPayNowUsd) * 100) / 100)
        : grandTotalUsd
          ? Math.max(0, Math.round((grandTotalUsd - amountToPayNowUsd) * 100) / 100)
          : null;

  const extrasSelected =
    Array.isArray(sourceReservation?.extrasSelected)
      ? sourceReservation.extrasSelected
      : Array.isArray(sourcePayment?.extrasSelected)
        ? sourcePayment.extrasSelected
        : [];

  const resolvedAudit =
    audit && typeof audit === "object"
      ? audit
      : sourceReservation?.audit && typeof sourceReservation.audit === "object"
        ? sourceReservation.audit
        : sourcePayment?.audit && typeof sourcePayment.audit === "object"
          ? sourcePayment.audit
          : null;

  return {
    reservationId: resolvedReservationId,
    paymentReference: resolvedPaymentReference,

    tourName,
    packageName,
    people,
    reservationType,

    contact: {
      name: contact?.name || "",
      email: contact?.email || "",
      phone: contact?.phone || "",
      notes: contact?.notes || "",
    },

    totalsUsd: {
      packageTotalUsd,
      extrasTotalUsd,
      grandTotalUsd,
      depositPercent,
      amountToPayNowUsd,
      balanceDueUsd,
      finalTotalUsd,
    },

    extrasSelected,
    audit: resolvedAudit,
  };
}

export function buildEk1Html({ reservation, paymentState, reservationId, paymentReference, audit }) {
  const model = normalizeReservationSource({ reservation, paymentState, reservationId, paymentReference, audit });
  const nowIso = new Date().toISOString();

  const acceptances = model?.audit?.acceptances || {};
  const legalDocs = model?.audit?.legalDocs || {};

  const extrasRows = (model.extrasSelected || []).map((ex) => {
    const title = ex?.title || "";
    const day = Number(ex?.day);
    const per = Number(ex?.estimatedPricePerPersonUsd ?? ex?.estimatedPricePerPerson) || 0;
    const dayLabel = Number.isFinite(day) && day > 0 ? `${day}. Gün` : "-";
    const est = model.people > 0 ? per * model.people : null;

    return `
      <tr>
        <td>${escapeHtml(dayLabel)}</td>
        <td>${escapeHtml(title)}</td>
        <td>${escapeHtml(fmtUsd(per))}</td>
        <td>${escapeHtml(est === null ? "-" : fmtUsd(est))}</td>
      </tr>
    `;
  });

  const agreementUrl = LEGAL_DOCS.packageTourAgreement.url;
  const agreementVersion = LEGAL_DOCS.packageTourAgreement.version;

  const distanceSalesUrl = LEGAL_DOCS.distanceSalesAgreement?.url;
  const distanceSalesVersion = LEGAL_DOCS.distanceSalesAgreement?.version;

  const kvkkUrl = LEGAL_DOCS.kvkk.url;
  const kvkkVersion = LEGAL_DOCS.kvkk.version;

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Ek-1 – Tur Bilgileri ve Ödeme Özeti</title>
  <style>
    :root { --fg:#0f172a; --muted:#475569; --border:#e2e8f0; --bg:#ffffff; --soft:#f8fafc; }
    *{ box-sizing:border-box; }
    body{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue"; color:var(--fg); background:var(--bg); margin:0; padding:24px; }
    .wrap{ max-width: 920px; margin:0 auto; }
    h1{ font-size:20px; margin:0 0 8px; }
    .sub{ font-size:12px; color:var(--muted); margin:0 0 18px; }
    .grid{ display:grid; grid-template-columns: 1fr 1fr; gap:12px; }
    .card{ border:1px solid var(--border); border-radius:12px; padding:12px; background:var(--soft); }
    .card h2{ font-size:13px; margin:0 0 8px; }
    .row{ display:flex; gap:8px; font-size:12px; line-height:1.35; }
    .k{ width:190px; color:var(--muted); }
    .v{ flex:1; font-weight:600; }
    .v.muted{ font-weight:500; color:var(--fg); }
    table{ width:100%; border-collapse:collapse; font-size:12px; margin-top:10px; }
    th, td{ border:1px solid var(--border); padding:8px; text-align:left; vertical-align:top; }
    th{ background:#fff; }
    .note{ margin-top:12px; font-size:11px; color:var(--muted); line-height:1.45; }
    .hr{ height:1px; background:var(--border); margin:14px 0; }
    @media print { body{ padding:0; } .card{ break-inside:avoid; } }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Ek-1 – Tur Bilgileri ve Ödeme Özeti</h1>
    <p class="sub">Oluşturulma zamanı (istemci): ${escapeHtml(nowIso)}</p>

    <div class="grid">
      <div class="card">
        <h2>Organizatör</h2>
        <div class="row"><div class="k">Ünvan</div><div class="v">${escapeHtml(COMPANY.legalName)}</div></div>
        <div class="row"><div class="k">Adres</div><div class="v muted">${escapeHtml(COMPANY.address)}</div></div>
        <div class="row"><div class="k">Vergi / Kayıt</div><div class="v muted">${escapeHtml(COMPANY.tax)} | NIB ${escapeHtml(COMPANY.nib)}</div></div>
        <div class="row"><div class="k">E-posta</div><div class="v muted">${escapeHtml(COMPANY.email)}</div></div>
        <div class="row"><div class="k">Telefon</div><div class="v muted">${escapeHtml(COMPANY.phoneTr)} | ${escapeHtml(COMPANY.phoneIdDisplay)}</div></div>
      </div>

      <div class="card">
        <h2>Katılımcı (Rezervasyon Sahibi)</h2>
        <div class="row"><div class="k">Ad Soyad</div><div class="v">${escapeHtml(model.contact.name || "-")}</div></div>
        <div class="row"><div class="k">E-posta</div><div class="v muted">${escapeHtml(model.contact.email || "-")}</div></div>
        <div class="row"><div class="k">Telefon</div><div class="v muted">${escapeHtml(model.contact.phone || "-")}</div></div>
      </div>
    </div>

    <div class="hr"></div>

    <div class="grid">
      <div class="card">
        <h2>Tur Bilgileri</h2>
        <div class="row"><div class="k">Rezervasyon No</div><div class="v">${escapeHtml(model.reservationId || "-")}</div></div>
        <div class="row"><div class="k">Ödeme Referansı</div><div class="v">${escapeHtml(model.paymentReference || "-")}</div></div>
        <div class="row"><div class="k">Tur</div><div class="v">${escapeHtml(model.tourName || "-")}</div></div>
        <div class="row"><div class="k">Paket</div><div class="v">${escapeHtml(model.packageName || "-")}</div></div>
        <div class="row"><div class="k">Katılımcı Sayısı</div><div class="v">${escapeHtml(model.people || 0)}</div></div>
      </div>

      <div class="card">
        <h2>Ödeme Özeti (USD)</h2>
        <div class="row"><div class="k">Paket Toplamı</div><div class="v">${escapeHtml(fmtUsd(model.totalsUsd.packageTotalUsd))}</div></div>
        <div class="row"><div class="k">Ekstralar Toplamı</div><div class="v">${escapeHtml(fmtUsd(model.totalsUsd.extrasTotalUsd))}</div></div>
        <div class="row"><div class="k">Genel Toplam</div><div class="v">${escapeHtml(fmtUsd(model.totalsUsd.grandTotalUsd))}</div></div>
        <div class="row"><div class="k">Kapora Oranı</div><div class="v muted">${escapeHtml(model.reservationType === "deposit" ? `%${model.totalsUsd.depositPercent || 0}` : "-" )}</div></div>
        <div class="row"><div class="k">Ödenen / Ödenecek</div><div class="v">${escapeHtml(fmtUsd(model.totalsUsd.amountToPayNowUsd))}</div></div>
        <div class="row"><div class="k">Kalan Ödeme (tahmini)</div><div class="v muted">${escapeHtml(model.totalsUsd.balanceDueUsd === null ? "-" : fmtUsd(model.totalsUsd.balanceDueUsd))}</div></div>
      </div>
    </div>

    <div class="card" style="margin-top:12px;">
      <h2>Onay ve Doküman Bilgisi (Audit)</h2>
      <div class="row"><div class="k">Onay Zamanı (istemci)</div><div class="v muted">${escapeHtml(model?.audit?.createdAtClientIso || "-")}</div></div>
      <div class="row"><div class="k">Sözleşme</div><div class="v muted">${escapeHtml((legalDocs?.packageTourAgreement?.version || agreementVersion) || "-")}
        ${legalDocs?.packageTourAgreement?.url || agreementUrl ? ` | ${escapeHtml(legalDocs?.packageTourAgreement?.url || agreementUrl)}` : ""}
      </div></div>
      <div class="row"><div class="k">Mesafeli Satış</div><div class="v muted">${escapeHtml((legalDocs?.distanceSalesAgreement?.version || distanceSalesVersion) || "-")}
        ${legalDocs?.distanceSalesAgreement?.url || distanceSalesUrl ? ` | ${escapeHtml(legalDocs?.distanceSalesAgreement?.url || distanceSalesUrl)}` : ""}
      </div></div>
      <div class="row"><div class="k">KVKK</div><div class="v muted">${escapeHtml((legalDocs?.kvkk?.version || kvkkVersion) || "-")}
        ${legalDocs?.kvkk?.url || kvkkUrl ? ` | ${escapeHtml(legalDocs?.kvkk?.url || kvkkUrl)}` : ""}
      </div></div>
      <div class="row"><div class="k">Zorunlu Onaylar</div><div class="v muted">
        acceptTerms: ${escapeHtml(acceptances?.acceptTerms)} | 
        acceptDistanceSales: ${escapeHtml(acceptances?.acceptDistanceSales)} | 
        acceptPricingScope: ${escapeHtml(acceptances?.acceptPricingScope)} | 
        acceptKvkk: ${escapeHtml(acceptances?.acceptKvkk)} | 
        acceptDepositTerms: ${escapeHtml(acceptances?.acceptDepositTerms)}
      </div></div>
    </div>

    <div class="card" style="margin-top:12px;">
      <h2>Seçilen Opsiyonel Ekstralar</h2>
      ${extrasRows.length === 0 ? "<p class=\"sub\" style=\"margin:0;\">Seçili ekstra yok.</p>" : `
        <table>
          <thead>
            <tr>
              <th>Gün</th>
              <th>Aktivite</th>
              <th>Kişi Başı (tahmini)</th>
              <th>Toplam (tahmini)</th>
            </tr>
          </thead>
          <tbody>
            ${extrasRows.join("\n")}
          </tbody>
        </table>
      `}
    </div>

    <p class="note">
      Bu Ek-1, endonezyakasifi.com üzerinden yapılan rezervasyon sürecinde tarafınızca seçilen paket/ekstralar, iletişim bilgileri ve onayların özetini içerir.
      Bu metin, Paket Tur Sözleşmesi’nin ayrılmaz eki olarak değerlendirilir. Asıl sözleşme: ${escapeHtml(agreementUrl)}.
    </p>
  </div>
</body>
</html>`;
}

export function downloadEk1Html({ reservation, paymentState, reservationId, paymentReference, audit }) {
  const html = buildEk1Html({ reservation, paymentState, reservationId, paymentReference, audit });
  const idPart = String(reservationId || reservation?.id || "").trim();
  const base = idPart ? `ek-1-${idPart}` : "ek-1";
  downloadTextFile({
    filename: `${base}.html`,
    text: html,
    mimeType: "text/html;charset=utf-8",
  });
}

export function openEk1InNewTab({ reservation, paymentState, reservationId, paymentReference, audit }) {
  const html = buildEk1Html({ reservation, paymentState, reservationId, paymentReference, audit });
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
}
