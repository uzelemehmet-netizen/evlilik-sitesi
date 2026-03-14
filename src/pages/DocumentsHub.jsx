import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const DOCS = [
  {
    id: "matchmaking-kullanim-sozlesmesi",
    title: "Uniqah – Kullanıcı / Üyelik Sözleşmesi",
    file: "/docs/matchmaking-kullanim-sozlesmesi.html",
    lang: "tr",
  },
  {
    id: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    file: "/docs/mesafeli-satis-sozlesmesi.html",
    lang: "tr",
  },
  {
    id: "distance-sales-agreement-en",
    title: "Distance Sales Agreement (EN)",
    file: "/docs/distance-sales-agreement-en.html",
    lang: "en",
  },
  {
    id: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    file: "/docs/kvkk-aydinlatma-metni.html",
    lang: "tr",
  },
  {
    id: "kvkk-information-notice-en",
    title: "KVKK Information Notice (EN)",
    file: "/docs/kvkk-information-notice-en.html",
    lang: "en",
  },
  {
    id: "iptal-iade-politikasi",
    title: "İptal / İade Politikası",
    file: "/docs/iptal-iade-politikasi.html",
    lang: "tr",
  },
  {
    id: "cancellation-refund-policy-en",
    title: "Cancellation & Refund Policy (EN)",
    file: "/docs/cancellation-refund-policy-en.html",
    lang: "en",
  },
  {
    id: "on-bilgilendirme-formu",
    title: "Ön Bilgilendirme Formu",
    file: "/docs/on-bilgilendirme-formu.html",
    lang: "tr",
  },
  {
    id: "pre-information-form-en",
    title: "Pre-Information Form (EN)",
    file: "/docs/pre-information-form-en.html",
    lang: "en",
  },
  {
    id: "odeme-yontemleri",
    title: "Ödeme Yöntemleri",
    file: "/docs/odeme-yontemleri.html",
    lang: "tr",
  },
  {
    id: "wise-odeme-talimatlari",
    title: "Wise Ödeme Talimatları",
    file: "/docs/wise-odeme-talimatlari.html",
    lang: "tr",
  },
  {
    id: "swift-odeme-talimatlari",
    title: "SWIFT Ödeme Talimatları",
    file: "/docs/swift-odeme-talimatlari.html",
    lang: "tr",
  },
  {
    id: "eft-fast-odeme-talimatlari",
    title: "EFT / FAST Ödeme Talimatları",
    file: "/docs/eft-fast-odeme-talimatlari.html",
    lang: "tr",
  },
];

export default function DocumentsHub() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const langParam = (searchParams.get("lang") || "tr").trim().toLowerCase();
  const activeLang = langParam === "en" ? "en" : "tr";

  const filteredDocs = useMemo(() => {
    return DOCS.filter((d) => (d.lang || "tr") === activeLang);
  }, [activeLang]);

  const activeId = (searchParams.get("doc") || "").trim();

  const activeDoc = useMemo(() => {
    const fromId = activeId ? DOCS.find((d) => d.id === activeId) : null;
    if (fromId && (fromId.lang || "tr") === activeLang) return fromId;
    return filteredDocs[0] || DOCS[0];
  }, [activeId, activeLang, filteredDocs]);

  const setLang = (lang) => {
    const nextLang = lang === "en" ? "en" : "tr";
    const nextDocs = DOCS.filter((d) => (d.lang || "tr") === nextLang);
    const nextDocId = nextDocs[0]?.id || "paket-tur-sozlesmesi";
    setSearchParams({ lang: nextLang, doc: nextDocId });
  };

  const selectDoc = (docId) => {
    setSearchParams({ lang: activeLang, doc: docId });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{t("documentsHub.title")}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {t("documentsHub.subtitle")}
          </p>

          <div className="mt-3 inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setLang("tr")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                activeLang === "tr" ? "bg-sky-600 text-white" : "text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              TR
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                activeLang === "en" ? "bg-sky-600 text-white" : "text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              EN
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          <div className="lg:sticky lg:top-6 self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold text-slate-500 px-2 pb-2">{t("documentsHub.sidebarTitle")}</p>
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                {filteredDocs.map((doc) => {
                  const isActive = doc.id === activeDoc?.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => selectDoc(doc.id)}
                      className={[
                        "whitespace-nowrap lg:whitespace-normal text-left px-3 py-2 rounded-xl border text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-sky-600 text-white border-sky-600"
                          : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {doc.title}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 px-1">
                <a
                  href={activeDoc.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800"
                >
                  {t("documentsHub.openNewTab")}
                </a>
                <span className="text-[11px] text-slate-500">{t("documentsHub.source", { file: activeDoc.file })}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-900">{activeDoc.title}</p>
            </div>
            <div className="h-[75vh]">
              <iframe
                key={activeDoc.id}
                title={activeDoc.title}
                src={activeDoc.file}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-500">
          {t("documentsHub.note")}
        </div>
      </div>
    </div>
  );
}
