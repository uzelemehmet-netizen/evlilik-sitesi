import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { LEGAL_DOCS } from "../config/legalDocs";
import { getWhatsAppNumber, openWhatsApp } from "../utils/whatsapp";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import emailjs from "@emailjs/browser";
import { MapPin, Calendar, Users, Award, Hotel } from "lucide-react";
import ImageLightbox from "../components/ImageLightbox";
import { db } from "../config/firebase";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { TOURS_CONFIG } from "./Tours";
import { getToursDataForLang } from "../data/tourDetail";

// Ön rezervasyon hesaplamaları için varsayılan kapora oranı (yüzde)
const DEPOSIT_PERCENT = 30;

// Metinler içinde geçen dahil/haric ifadelerini (TR/EN/ID), ayrıca Bali turist vergisi linkini vurgulamak için yardımcı fonksiyon
const renderWithInclusionHighlight = (text, lng = "tr") => {
  if (typeof text !== "string") return text;

  const baseLng = (lng || "tr").toLowerCase().split("-")[0];
  const baliTaxUrl = "https://lovebali.baliprov.go.id";

  const phrasesByLang = {
    tr: { negative: ["dahil değildir"], positive: ["dahildir"] },
    en: { negative: ["not included"], positive: ["included"] },
    id: { negative: ["tidak termasuk"], positive: ["termasuk"] },
  };

  const langPhrases = phrasesByLang[baseLng] || phrasesByLang.tr;

  // Not: Bazı içerikler (özellikle paket farkları) şimdilik TR kalabildiği için,
  // TR ifadelerini tüm dillerde de yakalamaya çalışıyoruz.
  const negativePhrases = Array.from(
    new Set([...(phrasesByLang.tr.negative || []), ...(langPhrases.negative || [])]),
  );
  const positivePhrases = Array.from(
    new Set([...(phrasesByLang.tr.positive || []), ...(langPhrases.positive || [])]),
  );

  const elements = [];
  let remaining = text;
  let key = 0;

  const findFirstIndexOfAny = (haystack, needles) => {
    let best = { index: -1, phrase: null };
    needles.forEach((needle) => {
      const idx = haystack.toLowerCase().indexOf(needle.toLowerCase());
      if (idx === -1) return;
      if (best.index === -1 || idx < best.index) best = { index: idx, phrase: needle };
    });
    return best;
  };

  while (remaining.length > 0) {
    const neg = findFirstIndexOfAny(remaining, negativePhrases);
    const pos = findFirstIndexOfAny(remaining, positivePhrases);
    const idxUrl = remaining.indexOf(baliTaxUrl);

    const idxNeg = neg.index;
    const idxPos = pos.index;

    const negative = neg.phrase;
    const positive = pos.phrase;

    if (idxNeg === -1 && idxPos === -1 && idxUrl === -1) {
      elements.push(remaining);
      break;
    }

    // En önce gelen ifadeyi bul (negatif, pozitif veya URL)
    const candidates = [
      { index: idxNeg, type: "negative", phrase: negative },
      { index: idxPos, type: "positive", phrase: positive },
      { index: idxUrl, type: "url", phrase: baliTaxUrl },
    ].filter((c) => c.index !== -1 && c.phrase);

    candidates.sort((a, b) => a.index - b.index);
    const { index, type, phrase } = candidates[0];

    if (index > 0) {
      elements.push(remaining.slice(0, index));
    }

    const matched = remaining.slice(index, index + phrase.length);

    if (type === "url") {
      elements.push(
        <a
          key={`inc-${key}`}
          href={baliTaxUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-emerald-600 hover:text-emerald-700"
        >
          {phrase}
        </a>
      );
    } else if (type === "negative" || type === "positive") {
      elements.push(
        <span
          key={`inc-${key}`}
          className={
            type === "negative"
              ? "inline-flex items-center px-1.5 py-0.5 rounded-md bg-red-50 text-red-800 border border-red-200 font-semibold"
              : "inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
          }
        >
          {matched}
        </span>
      );
    }

    remaining = remaining.slice(index + phrase.length);
    key += 1;
  }

  return elements;
};



// Liste sayfasındaki tur ID'lerini detay sayfasındaki ana rota ID'lerine eşleştir
// Örn: "bali-klasik" kartına tıklayınca burada "bali" detayını göster.
const TOUR_ID_MAP = {
  "bali-klasik": "bali",
  "bali-java": "java",
  "bali-aile": "bali",
  "bali-komodo": "komodo",
};

const WHATSAPP_NUMBER = getWhatsAppNumber();

// Tur sayfası BİREYSEL ve GRUP formları için özel EmailJS yapılandırması
const EMAILJS_TOURS_SERVICE_ID = "service_a4cvjdi";
const EMAILJS_TOURS_TEMPLATE_ID_PLANNED = "template_vrs7wm9";
const EMAILJS_TOURS_TEMPLATE_ID_GROUP = "template_lv114n8";
const EMAILJS_TOURS_PUBLIC_KEY = "ztyFnl3RMNaTFeReI";

export default function TourDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const effectiveId = id && TOUR_ID_MAP[id] ? TOUR_ID_MAP[id] : id;
  const navigate = useNavigate();
  const toursData = getToursDataForLang(i18n.language);
  const tour = effectiveId ? toursData[effectiveId] : null;

  const tString = (key, fallback, options) => {
    const v = t(key, { ...options, defaultValue: fallback });
    return typeof v === "string" ? v : fallback;
  };

  const tArray = (key, fallback = []) => {
    const v = t(key, { returnObjects: true });
    return Array.isArray(v) ? v : fallback;
  };

  const displayTour = tour
    ? {
        ...tour,
        name: tString(`tours.data.${effectiveId}.name`, tour.name),
        summary: tString(`tours.data.${effectiveId}.description`, tour.summary),
        duration: tString(`tours.data.${effectiveId}.duration`, tour.duration),
        concept: tString(`tours.data.${effectiveId}.concept`, tour.concept),
      }
    : null;

  const isBali = effectiveId === "bali";
  const isLombok = effectiveId === "lombok";
  const isJava = effectiveId === "java";
  const isSumatra = effectiveId === "sumatra";
  const isKomodo = effectiveId === "komodo";
  const isSulawesi = effectiveId === "sulawesi";

  const getPremiumDifferences = (tourKey, pkgLevel) => {
    if (pkgLevel === "premium") return [];

    const fromI18n = tArray(`tourDetail.packages.premiumDifferencesByTour.${tourKey}.${pkgLevel}`, []);
    if (fromI18n.length > 0) return fromI18n;

    if (tourKey === "bali") {
      return pkgLevel === "temel"
        ? [
            "Ayung Nehri rafting deneyimi bu pakete dahil değildir (isteğe bağlı eklenebilir).",
            "Tam gün tekne turu ve bazı ekstra aktiviteler bu fiyata dahil değildir.",
            "Otel konforu ve dahil öğün sayısı Premium'a göre daha sade tutulur; bütçeyi korumaya odaklıdır.",
          ]
        : [
            "Tam gün tekne turu bu pakete dahil değildir (isterseniz opsiyonel olarak eklenebilir).",
            "Yemekler ve ekstra aktiviteler Premium pakete göre daha sınırlıdır.",
          ];
    }

    if (tourKey === "lombok") {
      return pkgLevel === "temel"
        ? [
            "Gili Adaları tekne turu bu pakete dahil değildir (isteğe bağlı eklenebilir).",
            "Güney plajları & sörf deneyimi bu pakete dahil değildir (isteğe bağlı eklenebilir).",
            "Senaru şelaleleri & Rinjani manzara turu bu pakete dahil değildir.",
          ]
        : [
            "Senaru şelaleleri & Rinjani manzara turu bu pakete dahil değildir (isterseniz opsiyonel olarak eklenebilir).",
            "Pink Beach tekne turu gibi ek deneyimler bu pakete dahil değildir.",
          ];
    }

    if (tourKey === "sumatra") {
      return pkgLevel === "temel"
        ? [
            "Orangutan trekking & tubing deneyimi bu pakete dahil değildir (isteğe bağlı eklenebilir).",
            "Batak kültür & ada turu bu pakete dahil değildir (isteğe bağlı eklenebilir).",
            "Tele Observation Tower / panorama turu gibi ek turlar bu fiyata dahil değildir.",
          ]
        : [
            "Batak kültür & ada turu bu pakete dahil değildir (isterseniz opsiyonel olarak eklenebilir).",
            "Tele Observation Tower / panorama turu gibi ek turlar bu pakete dahil değildir.",
          ];
    }

    return [];
  };

  const [showPlannedForm, setShowPlannedForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);

  // Bali paket kartlarında fiyattan sonraki detay bloklarını toplu açıp kapamak için
  const [packagesExpanded, setPackagesExpanded] = useState(false);

  // Kaporalı ön rezervasyon alanını açıp kapamak için
  const [showDepositForm, setShowDepositForm] = useState(false);

  // Önemli açıklamalar & uyarılar bloğunu açıp kapamak için
  const [showImportantNotes, setShowImportantNotes] = useState(false);

  // Serbest günlerdeki opsiyonel, ücretli ekstra aktivitelerin kartlarını açıp kapamak için
  const [openOptionalExtraId, setOpenOptionalExtraId] = useState(null);

  // Opsiyonel ekstra kartları boş alana tıklayınca kapansın
  useEffect(() => {
    if (!openOptionalExtraId) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target || typeof target.closest !== "function") return;

      // Opsiyonel ekstra kartlarının içinde tıklama varsa kapanma
      if (target.closest('[data-optional-extra-card]')) return;

      setOpenOptionalExtraId(null);
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openOptionalExtraId]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [pricingOverride, setPricingOverride] = useState(null);
  const [imageUrls, setImageUrls] = useState({});

  const importantNotesItemKeys = [
    "registrationDeadline",
    "preInfoAndContract",
    "plansMayChange",
    "travelInsurance",
    "healthIssue",
    "followRules",
    "passportValidity",
    "visaRemovedForTurkishCitizens",
    "entryRulesMayChange",
    "contactThroughGuide",
    "comfortPriority",
    "allNotesAccepted",
  ];

  const importantNotesComponentsPlanned = {
    strong: <span className="font-semibold" />,
    b: <span className="font-semibold" />,
  };

  const importantNotesComponentsDefault = {
    strong: <span className="font-semibold text-rose-600" />,
    b: <span className="font-semibold" />,
  };

  const resolveImageUrl = (maybeUrl) => {
    if (!maybeUrl || typeof maybeUrl !== "string") return maybeUrl;

    // Zaten uzaktaki (CDN) veya data URL ise dokunma
    if (/^(https?:)?\/\//i.test(maybeUrl) || /^(data:|blob:)/i.test(maybeUrl)) return maybeUrl;

    // public kök yollarını Firestore/localStorage override ile çöz
    const key = maybeUrl.startsWith("/") ? maybeUrl.slice(1) : maybeUrl;
    return imageUrls?.[maybeUrl] || imageUrls?.[key] || maybeUrl;
  };

  // Sayfa her açıldığında en üste kaydır
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(
      doc(db, "tours", id),
      (snap) => {
        if (snap.exists()) {
          setPricingOverride(snap.data());
        }
      },
      (error) => {
        console.error("Firestore 'tours' detay dinleme hatası:", error);
      },
    );

    return () => unsubscribe();
  }, [id]);

  const basePriceRaw =
    pricingOverride?.price !== undefined && pricingOverride?.price !== null && pricingOverride?.price !== ""
      ? pricingOverride.price
      : tour?.price;
  const normalizedBasePrice =
    typeof basePriceRaw === "string"
      ? basePriceRaw.replace(/[^0-9]/g, "")
      : basePriceRaw;
  const basePrice = normalizedBasePrice ? Number(normalizedBasePrice) : null;
  const discountPercentRaw =
    pricingOverride?.discountPercent !== undefined && pricingOverride?.discountPercent !== null
      ? pricingOverride.discountPercent
      : tour?.discountPercent ?? 0;
  const discountPercent = Number(discountPercentRaw) || 0;
  const hasDiscount = basePrice !== null && discountPercent > 0;
  const discountedPrice = hasDiscount ? Math.round(basePrice * (1 - discountPercent / 100)) : basePrice;
  const promoLabel = pricingOverride?.promoLabel || "";

  const normalizeUsdNumber = (value) => {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === "number" && isFinite(value)) return value;
    if (typeof value === "string") {
      const n = Number(value.replace(/[^0-9.]/g, ""));
      return isFinite(n) && n > 0 ? n : null;
    }
    return null;
  };

  const DEFAULT_FLIGHT_INCLUDED_LIMIT_USD = 750;
  // Fiyat şeffaflığı için tüm turlarda aynı uçuş limiti kullanılır.
  const flightLimitPerPersonUsdRounded = DEFAULT_FLIGHT_INCLUDED_LIMIT_USD;
  const hasFlightLimit = true;
  const flightInclusionShortNote = t("tourDetail.flight.shortNote", {
    flightLimit: flightLimitPerPersonUsdRounded,
  });
  const flightInclusionLongNote = t("tourDetail.flight.longNote", {
    flightLimit: flightLimitPerPersonUsdRounded,
  });

  const normalizePlannedDateRangeLabel = (text) => {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/^\s*planlanan\s*tarih\s*:\s*/i, "")
      .replace(/^\s*planlanan\s*tur\s*tarihleri\s*:\s*/i, "")
      .trim();
  };

  const parseDateFlexible = (input) => {
    if (!input) return null;
    let s = input.toString().trim();
    s = s.replace(/\(.*?\)/g, " ");
    s = s.replace(/planlanan\s*tarih\s*:\s*/i, "");
    s = s.replace(/planlanan\s*tur\s*tarihleri\s*:\s*/i, "");
    s = s.replace(/^[^0-9a-zA-ZğüşöçıİĞÜŞÖÇ]+/g, "");
    s = s.replace(/[^0-9a-zA-ZğüşöçıİĞÜŞÖÇ\.\-\/\s]+/g, " ").trim();

    let d = new Date(s);
    if (!isNaN(d)) return d;

    const monthsTR = {
      ocak: "January",
      şubat: "February",
      mart: "March",
      nisan: "April",
      mayıs: "May",
      haziran: "June",
      temmuz: "July",
      ağustos: "August",
      agustos: "August",
      eylül: "September",
      ekim: "October",
      kasım: "November",
      aralık: "December",
    };

    let replaced = s.toLowerCase();
    Object.keys(monthsTR).forEach((tr) => {
      replaced = replaced.replace(new RegExp(tr, "g"), monthsTR[tr]);
    });
    d = new Date(replaced);
    if (!isNaN(d)) return d;

    const m = replaced.match(/(\d{1,2})[\.\-/ ](\d{1,2})[\.\-/ ](\d{2,4})/);
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]) - 1;
      let year = Number(m[3]);
      if (year < 100) year += 2000;
      return new Date(year, month, day);
    }

    const m2 = replaced.match(/(\d{1,2})\s+([a-zA-Z]+)\s*(\d{4})?/);
    if (m2) {
      const day = Number(m2[1]);
      const monthName = m2[2];
      const year = m2[3] ? Number(m2[3]) : new Date().getFullYear();
      const tryDate = new Date(`${monthName} ${day}, ${year}`);
      if (!isNaN(tryDate)) return tryDate;
    }

    return null;
  };

  const parseDateRangeText = (text) => {
    if (!text || typeof text !== "string") return null;
    let cleaned = text
      .replace(/\(.*?\)/g, " ")
      .replace(/planlanan\s*tarih\s*:\s*/i, "")
      .replace(/planlanan\s*tur\s*tarihleri\s*:\s*/i, "")
      .trim();

    // "12-19 Mart" veya "12–19 Mart 2026"
    let m = cleaned.match(/(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([a-zA-ZğüşöçıİĞÜŞÖÇ]+)\s*(\d{4})?/i);
    if (m) {
      const d1 = Number(m[1]);
      const d2 = Number(m[2]);
      const monthName = m[3];
      const year = m[4] ? Number(m[4]) : new Date().getFullYear();
      const start = parseDateFlexible(`${d1} ${monthName} ${year}`);
      const end = parseDateFlexible(`${d2} ${monthName} ${year}`);
      return start && end ? { start, end } : null;
    }

    // "28 Mart - 3 Nisan" / "28 Mart – 3 Nisan 2026"
    m = cleaned.match(
      /(\d{1,2})\s+([a-zA-ZğüşöçıİĞÜŞÖÇ]+)\s*[-–—]\s*(\d{1,2})\s+([a-zA-ZğüşöçıİĞÜŞÖÇ]+)\s*(\d{4})?/i,
    );
    if (m) {
      const d1 = Number(m[1]);
      const month1 = m[2];
      const d2 = Number(m[3]);
      const month2 = m[4];
      const year = m[5] ? Number(m[5]) : new Date().getFullYear();
      const start = parseDateFlexible(`${d1} ${month1} ${year}`);
      const end = parseDateFlexible(`${d2} ${month2} ${year}`);
      return start && end ? { start, end } : null;
    }

    const parts = cleaned
      .split(/\s[-–—]\s|\bto\b/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      const start = parseDateFlexible(parts[0]);
      const end = parseDateFlexible(parts[1]);
      return start && end ? { start, end } : null;
    }

    return null;
  };

  const computeDaysNightsFromDates = (start, end) => {
    if (!(start instanceof Date) || !(end instanceof Date) || isNaN(start) || isNaN(end)) return null;
    const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.round((endUtc - startUtc) / msPerDay) + 1;
    if (!Number.isFinite(days) || days <= 0 || days >= 1000) return null;
    const nights = Math.max(0, days - 1);
    return { days, nights };
  };

  const formatDurationFromDaysNights = (days, nights) => {
    const d = Number(days);
    const n = Number(nights);
    if (!Number.isFinite(d) || !Number.isFinite(n) || d <= 0) return "";
    return `${n} Gece ${d} Gün`;
  };

  const configTour = effectiveId ? TOURS_CONFIG.find((t) => t.id === effectiveId) : null;
  const plannedDateRangeTextRaw = pricingOverride?.dateRange || configTour?.dateRange || "";
  const plannedDateRangeText = normalizePlannedDateRangeLabel(plannedDateRangeTextRaw);

  const possibleStart =
    pricingOverride?.startDate ||
    pricingOverride?.start_date ||
    pricingOverride?.dateStart ||
    pricingOverride?.date_start ||
    pricingOverride?.start ||
    pricingOverride?.sDate ||
    pricingOverride?.s_date ||
    pricingOverride?.startAt ||
    pricingOverride?.start_at ||
    (pricingOverride?.dates && (pricingOverride.dates.start || pricingOverride.dates.startDate || pricingOverride.dates.dateStart)) ||
    null;
  const possibleEnd =
    pricingOverride?.endDate ||
    pricingOverride?.end_date ||
    pricingOverride?.dateEnd ||
    pricingOverride?.date_end ||
    pricingOverride?.end ||
    pricingOverride?.eDate ||
    pricingOverride?.e_date ||
    pricingOverride?.endAt ||
    pricingOverride?.end_at ||
    (pricingOverride?.dates && (pricingOverride.dates.end || pricingOverride.dates.endDate || pricingOverride.dates.dateEnd)) ||
    null;

  const startDate = possibleStart
    ? (typeof possibleStart?.toDate === "function" ? possibleStart.toDate() : new Date(possibleStart))
    : null;
  const endDate = possibleEnd
    ? (typeof possibleEnd?.toDate === "function" ? possibleEnd.toDate() : new Date(possibleEnd))
    : null;

  const computedDaysNights = startDate && endDate ? computeDaysNightsFromDates(startDate, endDate) : null;
  const computedDurationFromDates = computedDaysNights
    ? formatDurationFromDaysNights(computedDaysNights.days, computedDaysNights.nights)
    : "";

  const computedDurationFromText = (() => {
    const t = pricingOverride?.dateRange;
    if (!t || typeof t !== "string") return "";
    const m1 = t.match(/(\d+)\s*g[uü]n\s*\/\s*(\d+)\s*gece/i);
    if (m1) return formatDurationFromDaysNights(Number(m1[1]), Number(m1[2]));
    const m2 = t.match(/(\d+)\s*gece\s*\/\s*(\d+)\s*g[uü]n/i);
    if (m2) return formatDurationFromDaysNights(Number(m2[2]), Number(m2[1]));
    const range = parseDateRangeText(t);
    if (range?.start && range?.end) {
      const dn = computeDaysNightsFromDates(range.start, range.end);
      return dn ? formatDurationFromDaysNights(dn.days, dn.nights) : "";
    }
    return "";
  })();

  const effectiveDuration = computedDurationFromDates || computedDurationFromText || displayTour?.duration || "";

  const routeNames = Array.isArray(displayTour?.routes)
    ? displayTour.routes.map((r) => r?.name).filter(Boolean)
    : [];
  const routesShortText = routeNames.length > 0
    ? `${routeNames.slice(0, 4).join(", ")}${routeNames.length > 4 ? "…" : ""}`
    : "";

  const fallbackPackages = [
    {
      id: `${effectiveId || id || "tur"}-basic`,
      level: "temel",
      name: tString("tourDetail.packages.fallback.basic.name", "Temel Paket"),
      badge: tString("tourDetail.packages.fallback.basic.badge", "Başlangıç"),
      headline: tString(
        "tourDetail.packages.fallback.basic.headline",
        "Program akışını koruyan, daha esnek içerikli başlangıç paketi.",
      ),
      priceMultiplier: 1,
      highlights: [
        effectiveDuration
          ? tString("tourDetail.packages.highlights.duration", `Süre: ${effectiveDuration}`, {
              duration: effectiveDuration,
            })
          : "",
        displayTour?.concept
          ? tString("tourDetail.packages.highlights.concept", `Konsept: ${displayTour.concept}`, {
              concept: displayTour.concept,
            })
          : "",
        routesShortText
          ? tString("tourDetail.packages.highlights.route", `Rota: ${routesShortText}`, {
              route: routesShortText,
            })
          : "",
      ].filter(Boolean),
      notes: tString(
        "tourDetail.packages.fallback.basic.notes",
        "Bu tur için dahil/haric kapsam, seçilen paket seviyesine göre değişebilir. Net kapsam ve operasyon detayları rezervasyon öncesinde yazılı paylaşılır.",
      ),
    },
    {
      id: `${effectiveId || id || "tur"}-standard`,
      level: "plus",
      name: tString("tourDetail.packages.fallback.standard.name", "Standart Paket"),
      badge: tString("tourDetail.packages.fallback.standard.badge", "Dengeli"),
      headline: tString(
        "tourDetail.packages.fallback.standard.headline",
        "Daha dolu içerik ve daha az belirsizlik isteyenler için dengeli seçenek.",
      ),
      priceMultiplier: 1,
      highlights: [
        effectiveDuration
          ? tString("tourDetail.packages.highlights.duration", `Süre: ${effectiveDuration}`, {
              duration: effectiveDuration,
            })
          : "",
        displayTour?.concept
          ? tString("tourDetail.packages.highlights.concept", `Konsept: ${displayTour.concept}`, {
              concept: displayTour.concept,
            })
          : "",
        routesShortText
          ? tString("tourDetail.packages.highlights.route", `Rota: ${routesShortText}`, {
              route: routesShortText,
            })
          : "",
      ].filter(Boolean),
      notes: tString(
        "tourDetail.packages.fallback.standard.notes",
        "Standart paket, programın ana akışını referans alır ve kapsamı netleştirir. Operasyonel detaylar (saat/rota gibi) rezervasyon sonrası yazılı olarak paylaşılır.",
      ),
    },
    {
      id: `${effectiveId || id || "tur"}-premium`,
      level: "premium",
      name: tString("tourDetail.packages.fallback.premium.name", "Premium Paket"),
      badge: tString("tourDetail.packages.fallback.premium.badge", "En kapsamlı"),
      headline: tString(
        "tourDetail.packages.fallback.premium.headline",
        "Daha kapsamlı planlama ve daha yüksek konfor beklentisi olanlar için üst seviye paket.",
      ),
      priceMultiplier: 1,
      highlights: [
        effectiveDuration
          ? tString("tourDetail.packages.highlights.duration", `Süre: ${effectiveDuration}`, {
              duration: effectiveDuration,
            })
          : "",
        displayTour?.concept
          ? tString("tourDetail.packages.highlights.concept", `Konsept: ${displayTour.concept}`, {
              concept: displayTour.concept,
            })
          : "",
        routesShortText
          ? tString("tourDetail.packages.highlights.route", `Rota: ${routesShortText}`, {
              route: routesShortText,
            })
          : "",
      ].filter(Boolean),
      notes: tString(
        "tourDetail.packages.fallback.premium.notes",
        "Premium paket, daha kapsamlı bir planlama hedefler. Operasyonel detaylar (saat/rota gibi) rezervasyon sonrası yazılı olarak paylaşılır.",
      ),
    },
  ];

  const rawPackages = Array.isArray(tour?.packages) && (tour?.packages?.length ?? 0) > 0
    ? tour.packages
    : fallbackPackages;

  const hasPackages = Array.isArray(rawPackages) && (rawPackages?.length ?? 0) > 0;
  let packagePrices = [];
  let packages = rawPackages || [];

  if (hasPackages && basePrice) {
    packages = rawPackages.map((pkg) => {
      const multiplier = typeof pkg.priceMultiplier === "number" ? pkg.priceMultiplier : 1;
      const pkgBasePrice = Math.round(basePrice * multiplier);
      const pkgFinalPrice = hasDiscount
        ? Math.round(pkgBasePrice * (1 - discountPercent / 100))
        : pkgBasePrice;
      packagePrices.push(pkgFinalPrice);
      return {
        ...pkg,
        computedBasePrice: pkgBasePrice,
        computedPrice: pkgFinalPrice,
      };
    });
  }

  const nonZeroPackagePrices = packagePrices.filter((p) => typeof p === "number" && p > 0);
  const startingPrice = hasPackages && nonZeroPackagePrices.length > 0
    ? Math.min(...nonZeroPackagePrices)
    : discountedPrice;

  const defaultDepositPackageId = hasPackages
    ? (isJava
        ? (packages.find((p) => p.level === "premium" && typeof p.computedPrice === "number" && p.computedPrice > 0)?.id ||
            packages.find((p) => p.level === "premium")?.id ||
            packages[0]?.id ||
            "")
        : (packages[0]?.id || ""))
    : "";

  // Tur hero görselleri için imageUrls yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem("imageUrls");
      if (saved) {
        setImageUrls(JSON.parse(saved));
      }
    } catch (e) {
      console.error("imageUrls localStorage okuma hatası (TourDetail):", e);
    }

    const fetchImageUrls = async () => {
      try {
        const snap = await getDoc(doc(db, "imageUrls", "imageUrls"));
        if (snap.exists()) {
          const data = snap.data() || {};
          setImageUrls((prev) => {
            const merged = { ...prev, ...data };
            try {
              localStorage.setItem("imageUrls", JSON.stringify(merged));
            } catch (e) {
              console.error("imageUrls localStorage yazma hatası (TourDetail):", e);
            }
            return merged;
          });
        }
      } catch (error) {
        console.error("Firestore imageUrls yüklenirken hata (TourDetail):", error);
      }
    };

    fetchImageUrls();
  }, []);

  const heroKey = id ? `${id}-tour-hero` : "";
  const heroImage = heroKey && imageUrls[heroKey]
    ? imageUrls[heroKey]
    : tour?.hero || tour?.image || "/placeholder.svg";

  const [plannedForm, setPlannedForm] = useState(() => ({
    name: "",
    email: "",
    phone: "",
    participation: "bireysel",
    tour: tour ? `${tour.name} - ${effectiveDuration}` : "",
    people: "",
    notes: "",
    privacy: false,
  }));

  const [depositForm, setDepositForm] = useState(() => ({
    packageId: defaultDepositPackageId,
    people: "",
    name: "",
    email: "",
    phone: "",
    notes: "",
    extras: {},
    reservationType: "deposit",
    includeFlight: true,
    acceptTerms: false,
    acceptDistanceSales: false,
    acceptPricingScope: false,
    acceptKvkk: false,
    acceptDepositTerms: false,
  }));

  const [groupForm, setGroupForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    groupType: "",
    dates: "",
    people: "",
    routes: tour ? tour.name : "",
    budget: "",
    budgetOther: "",
    notes: "",
    privacy: false,
  });

  const handlePlannedChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPlannedForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleGroupChange = (e) => {
    const { name, type, checked, value } = e.target;
    setGroupForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleDepositChange = (e) => {
    const { name, type, checked, value } = e.target;
    setDepositForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const proceedToPayment = () => {
    const reservationType = depositForm.reservationType === "full" ? "full" : "deposit";
    const amountToPayNow = reservationType === "deposit" ? depositAmount : adjustedDepositGrandTotal;

    let auditId = "";
    try {
      auditId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `audit-${Math.random().toString(36).slice(2)}`;
    } catch {
      auditId = `audit-${Math.random().toString(36).slice(2)}`;
    }

    const audit = {
      schemaVersion: 1,
      auditId,
      createdAtClientIso: new Date().toISOString(),
      acceptances: {
        acceptTerms: !!depositForm.acceptTerms,
        acceptDistanceSales: !!depositForm.acceptDistanceSales,
        acceptPricingScope: !!depositForm.acceptPricingScope,
        acceptKvkk: !!depositForm.acceptKvkk,
        acceptDepositTerms: reservationType === "deposit" ? !!depositForm.acceptDepositTerms : null,
      },
      legalDocs: {
        packageTourAgreement: LEGAL_DOCS.packageTourAgreement,
        distanceSalesAgreement: LEGAL_DOCS.distanceSalesAgreement,
        kvkk: LEGAL_DOCS.kvkk,
        paymentMethods: LEGAL_DOCS.paymentMethods,
        tourRulesAnchor: "#tour-rules",
        pricingDetailsAnchor: "#pricing-details",
      },
      client: {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        language: typeof navigator !== "undefined" ? navigator.language : "",
        timeZone:
          typeof Intl !== "undefined" && Intl.DateTimeFormat
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : "",
      },
    };

    try {
      localStorage.setItem(`reservation_audit_${auditId}`, JSON.stringify(audit));
    } catch {
      // ignore
    }

    navigate("/payment", {
      state: {
        audit,
        tourId: id,
        tourName: tour?.name || "",
        packageId: selectedDepositPackage?.id || "",
        packageName: selectedDepositPackage?.name || "",
        reservationType,
        people: depositPeopleCount,
        includeFlight: true,
        flightLimitPerPersonUsd: hasFlightLimit ? flightLimitPerPersonUsdRounded : DEFAULT_FLIGHT_INCLUDED_LIMIT_USD,
        flightDeductionTotalUsd: 0,
        packageTotalUsd: adjustedDepositPackageTotal,
        extrasSelected: selectedExtrasList.map((extra) => ({
          id: extra.id,
          day: extra.day,
          title: extra.title,
          estimatedPricePerPersonUsd: Number(extra.estimatedPricePerPerson) || 0,
        })),
        extrasTotalUsd: extrasTotal,
        grandTotalUsd: adjustedDepositGrandTotal,
        depositPercent: DEPOSIT_PERCENT,
        amountToPayNowUsd: amountToPayNow,
        contact: {
          name: depositForm.name,
          email: depositForm.email,
          phone: depositForm.phone,
          notes: depositForm.notes,
        },
      },
    });
  };

  const handleDepositExtraToggle = (extraId) => {
    setDepositForm((prev) => ({
      ...prev,
      extras: {
        ...prev.extras,
        [extraId]: !prev.extras?.[extraId],
      },
    }));
  };

  const handlePlannedSubmit = (e) => {
    e.preventDefault();
    console.log("Planned tour pre-registration:", plannedForm);

    const tourName = displayTour?.name || tour.name;

    const whatsappText =
      `${t('tourDetail.whatsapp.planned.title')}\n\n`
      + `${t('tourDetail.whatsapp.labels.tour')}: ${tourName} (${effectiveDuration})\n`
      + `${t('tourDetail.whatsapp.labels.fullName')}: ${plannedForm.name}\n`
      + `${t('tourDetail.whatsapp.labels.email')}: ${plannedForm.email}\n`
      + `${t('tourDetail.whatsapp.labels.phone')}: ${plannedForm.phone}\n`
      + `${t('tourDetail.whatsapp.labels.participationType')}: ${plannedForm.participation}\n`
      + `${t('tourDetail.whatsapp.labels.requestedTour')}: ${plannedForm.tour}\n`
      + `${t('tourDetail.whatsapp.labels.peopleCount')}: ${plannedForm.people}\n`
      + `${t('tourDetail.whatsapp.labels.notes')}: ${plannedForm.notes || "-"}`;

    if (WHATSAPP_NUMBER) {
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;
      openWhatsApp(url);
    } else {
      console.warn(t('tourDetail.whatsapp.missingNumberWarn'));
    }

    if (EMAILJS_TOURS_SERVICE_ID && EMAILJS_TOURS_TEMPLATE_ID_PLANNED && EMAILJS_TOURS_PUBLIC_KEY) {
      emailjs
        .send(
          EMAILJS_TOURS_SERVICE_ID,
          EMAILJS_TOURS_TEMPLATE_ID_PLANNED,
          {
            tour_name: tourName,
            tour_duration: effectiveDuration,
            name: plannedForm.name,
            email: plannedForm.email,
            phone: plannedForm.phone,
            participation: plannedForm.participation,
            tour: plannedForm.tour,
            people: plannedForm.people,
            notes: plannedForm.notes,
          },
          EMAILJS_TOURS_PUBLIC_KEY,
        )
        .then(
          () => {
            console.log("EmailJS planned form başarıyla gönderildi");
          },
          (error) => {
            console.error("EmailJS planned form hata:", error);
          },
        );
    }
  };

  const handleGroupSubmit = (e) => {
    e.preventDefault();
    console.log("Group tour request:", groupForm);

    const tourName = displayTour?.name || tour.name;

    const resolvedBudget = groupForm.budget === "diger" && groupForm.budgetOther
      ? groupForm.budgetOther
      : groupForm.budget;

    const whatsappText =
      `${t('tourDetail.whatsapp.group.title')}\n\n`
      + `${t('tourDetail.whatsapp.labels.referenceRoute')}: ${tourName} (${effectiveDuration})\n`
      + `${t('tourDetail.whatsapp.labels.fullName')}: ${groupForm.name}\n`
      + `${t('tourDetail.whatsapp.labels.email')}: ${groupForm.email}\n`
      + `${t('tourDetail.whatsapp.labels.phone')}: ${groupForm.phone}\n`
      + `${t('tourDetail.whatsapp.labels.organization')}: ${groupForm.organization || "-"}\n`
      + `${t('tourDetail.whatsapp.labels.groupType')}: ${groupForm.groupType}\n`
      + `${t('tourDetail.whatsapp.labels.dates')}: ${groupForm.dates}\n`
      + `${t('tourDetail.whatsapp.labels.peopleCount')}: ${groupForm.people}\n`
      + `${t('tourDetail.whatsapp.labels.routes')}: ${groupForm.routes || "-"}\n`
      + `${t('tourDetail.whatsapp.labels.budget')}: ${resolvedBudget || "-"}\n`
      + `${t('tourDetail.whatsapp.labels.notes')}: ${groupForm.notes || "-"}`;

    if (WHATSAPP_NUMBER) {
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;
      openWhatsApp(url);
    } else {
      console.warn(t('tourDetail.whatsapp.missingNumberWarn'));
    }

    if (EMAILJS_TOURS_SERVICE_ID && EMAILJS_TOURS_TEMPLATE_ID_GROUP && EMAILJS_TOURS_PUBLIC_KEY) {
      emailjs
        .send(
          EMAILJS_TOURS_SERVICE_ID,
          EMAILJS_TOURS_TEMPLATE_ID_GROUP,
          {
            tour_name: tourName,
            tour_duration: effectiveDuration,
            name: groupForm.name,
            email: groupForm.email,
            phone: groupForm.phone,
            organization: groupForm.organization,
            group_type: groupForm.groupType,
            dates: groupForm.dates,
            people: groupForm.people,
            routes: groupForm.routes,
            budget: resolvedBudget,
            notes: groupForm.notes,
          },
          EMAILJS_TOURS_PUBLIC_KEY,
        )
        .then(
          () => {
            console.log("EmailJS group form başarıyla gönderildi");
          },
          (error) => {
            console.error("EmailJS group form hata:", error);
          },
        );
    }
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();

    const reservationType = depositForm.reservationType === "full" ? "full" : "deposit";

    const missing = [];

    if (!selectedDepositPackage) missing.push(t('tourDetail.deposit.validation.missing.package'));
    if (!depositPeopleCount || depositPeopleCount < 1) missing.push(t('tourDetail.deposit.validation.missing.peopleCount'));

    if (!String(depositForm.name || "").trim()) missing.push(t('tourDetail.deposit.validation.missing.fullName'));
    if (!String(depositForm.email || "").trim()) missing.push(t('tourDetail.deposit.validation.missing.email'));
    if (!String(depositForm.phone || "").trim()) missing.push(t('tourDetail.deposit.validation.missing.phone'));

    if (!depositForm.acceptTerms) missing.push(t('tourDetail.deposit.validation.missing.acceptTerms'));
    if (!depositForm.acceptDistanceSales) missing.push(t('tourDetail.deposit.validation.missing.acceptDistanceSales'));
    if (!depositForm.acceptPricingScope) missing.push(t('tourDetail.deposit.validation.missing.acceptPricingScope'));
    if (!depositForm.acceptKvkk) missing.push(t('tourDetail.deposit.validation.missing.acceptKvkk'));
    if (reservationType === "deposit" && !depositForm.acceptDepositTerms) missing.push(t('tourDetail.deposit.validation.missing.acceptDepositTerms'));

    if (missing.length > 0) {
      // Not: Bu formda preventDefault kullanıldığı için native HTML 'required' validasyonu çalışmaz.
      // Bu yüzden manuel doğrulama + kullanıcı uyarısı yapıyoruz.
      window.alert(
        `${t('tourDetail.deposit.validation.alertPrefix')}\n\n- ${missing.join("\n- ")}`,
      );
      return;
    }

    if (!selectedDepositPackage || !depositPeopleCount || !adjustedDepositGrandTotal || !depositAmount) {
      console.warn("Kaporalı ön rezervasyon için eksik bilgi: paket, kişi sayısı veya tutarlar hesaplanamadı.");
      return;
    }

    const extrasSummary = selectedExtrasList.length
      ? selectedExtrasList
          .map((extra) => `- ${extra.title || extra.id}`)
          .join("\n")
      : t('tourDetail.whatsapp.deposit.noExtras');

    const reservationTypeLabel =
      reservationType === "full"
        ? t('tourDetail.whatsapp.deposit.type.full')
        : t('tourDetail.whatsapp.deposit.type.deposit');

    const tourName = displayTour?.name || tour.name;

    const whatsappText =
      `${t('tourDetail.whatsapp.deposit.title', { type: reservationTypeLabel })}\n\n`
      + `${t('tourDetail.whatsapp.labels.tour')}: ${tourName} - ${selectedDepositPackage.name}\n`
      + `${t('tourDetail.whatsapp.labels.peopleCount')}: ${depositPeopleCount}\n`
      + `${t('tourDetail.whatsapp.deposit.labels.packageTotal')}: $${depositPackageTotal}\n`
      + `${t('tourDetail.whatsapp.deposit.labels.extrasSelected')}\n${extrasSummary}\n`
      + `${t('tourDetail.whatsapp.deposit.labels.grandTotal')}: $${adjustedDepositGrandTotal}\n`
      + (reservationType === "deposit"
        ? `${t('tourDetail.whatsapp.deposit.labels.depositToPayNow')}: $${depositAmount}\n`
        : "")
      + `${t('tourDetail.whatsapp.labels.fullName')}: ${depositForm.name}\n`
      + `${t('tourDetail.whatsapp.labels.email')}: ${depositForm.email}\n`
      + `${t('tourDetail.whatsapp.labels.phone')}: ${depositForm.phone}\n`
      + `${t('tourDetail.whatsapp.labels.notes')}: ${depositForm.notes || "-"}`;

    if (EMAILJS_TOURS_SERVICE_ID && EMAILJS_TOURS_TEMPLATE_ID_PLANNED && EMAILJS_TOURS_PUBLIC_KEY) {
      emailjs
        .send(
          EMAILJS_TOURS_SERVICE_ID,
          EMAILJS_TOURS_TEMPLATE_ID_PLANNED,
          {
            tour_name: tourName,
            tour_duration: effectiveDuration,
            name: depositForm.name,
            email: depositForm.email,
            phone: depositForm.phone,
            participation:
              reservationType === "full"
                ? t("tourDetail.email.participation.full")
                : t("tourDetail.email.participation.deposit"),
            tour: `${tourName} - ${selectedDepositPackage.name}`,
            people: String(depositPeopleCount),
            notes:
              (reservationType === "full"
                ? t("tourDetail.email.summaryPrefix.full")
                : t("tourDetail.email.summaryPrefix.deposit")) + whatsappText,
          },
          EMAILJS_TOURS_PUBLIC_KEY,
        )
        .then(
          () => {
            console.log("EmailJS deposit form başarıyla gönderildi");
          },
          (error) => {
            console.error("EmailJS deposit form hata:", error);
          },
        );
    }

      proceedToPayment();
  };

  if (!tour) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50/40">
        <Navigation />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold mb-4">{t("tourDetail.notFound.title")}</h1>
          <p className="text-gray-600 mb-6">{t("tourDetail.notFound.description")}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-full bg-sky-600 text-white font-semibold hover:bg-sky-700 transition-colors"
          >
            {t("common.back")}
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Tur detay sayfası galerisi için admin panel override + fallback
  const MAX_GALLERY_IMAGES = 8;
  const galleryOverride = [];

  if (id) {
    for (let i = 0; i < MAX_GALLERY_IMAGES; i += 1) {
      const key = `${id}-tour-gallery-${i}`;
      if (imageUrls[key]) {
        galleryOverride.push(imageUrls[key]);
      }
    }
  }

  const galleryImages = galleryOverride.length > 0
    ? galleryOverride
    : tour.gallery || [];

  const resolvedGalleryImages = Array.isArray(galleryImages)
    ? galleryImages.map((img) => resolveImageUrl(img || "/placeholder.svg"))
    : [];

  // İlgili tur için, serbest günlerdeki opsiyonel ekstra aktiviteleri rezervasyon alanında kullanmak üzere düz listeye çevir
  const baseOptionalExtras = Array.isArray(tour.itinerary)
    ? tour.itinerary.flatMap((day) =>
        Array.isArray(day.optionalExtras)
          ? day.optionalExtras.map((extra) => ({
              ...extra,
              day: day.day,
            }))
          : [],
      )
    : [];

  const selectedDepositPackage = hasPackages
    ? (packages.find((p) => p.id === depositForm.packageId) || packages.find((p) => p.level === "premium") || packages[0])
    : null;

  // Kaporalı rezervasyon hesabı için kişi sayısını sayıya çevir
  const depositPeopleCount = Math.max(0, Number(depositForm.people) || 0);

  // Seçilen paket fiyatını kişi sayısı ile çarparak toplam paket tutarını hesapla
  const depositPackageTotal = selectedDepositPackage?.computedPrice
    ? selectedDepositPackage.computedPrice * depositPeopleCount
    : 0;

  // Uçak bileti hariç seçilirse, tur için belirlenen uçak dahil limiti toplamdan düş
  const flightDeductionTotal = hasFlightLimit && !depositForm.includeFlight
    ? flightLimitPerPersonUsdRounded * depositPeopleCount
    : 0;
  const adjustedDepositPackageTotal = Math.max(0, depositPackageTotal - flightDeductionTotal);

  // Seçilen pakete göre, paket fiyatına dahil olmayan rehberli günleri de opsiyonel ekstra olarak sun
  // Şu an için opsiyonel ekstralar, tur programındaki tanımlı ekstralarla sınırlıdır.
  // (İleride Bali için paket seviyesine göre ekstra günler eklemek istenirse burası genişletilebilir.)
  const optionalExtras = baseOptionalExtras;

  const selectedExtrasList = optionalExtras.filter((extra) => depositForm.extras?.[extra.id]);
  let extrasTotalPerPerson = selectedExtrasList.reduce(
    (sum, extra) => sum + (Number(extra.estimatedPricePerPerson) || 0),
    0,
  );
  if (selectedDepositPackage && selectedDepositPackage.level === "premium") {
    extrasTotalPerPerson *= 0.75;
  }
  const extrasTotal = depositPeopleCount * extrasTotalPerPerson;
  const adjustedDepositGrandTotal = adjustedDepositPackageTotal + extrasTotal;
  const depositAmount = adjustedDepositGrandTotal > 0 ? Math.round((adjustedDepositGrandTotal * DEPOSIT_PERCENT) / 100) : 0;

  return (
    <div className="tour-detail-root min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50/40">
      <Navigation />

      {/* Mobil: her zaman görünen geri butonu (floating) */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label={t("tourDetail.nav.backAria")}
        className="md:hidden fixed left-4 z-[80] inline-flex items-center justify-center rounded-full bg-slate-900/90 text-white w-11 h-11 shadow-[0_14px_30px_rgba(0,0,0,0.32)] ring-1 ring-white/20 backdrop-blur-sm active:scale-95 transition-transform"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <span className="text-xl leading-none">↩</span>
      </button>

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        {/* Kampanya/indirim: mobilde overlay yapma, içerikte göster */}
        {promoLabel && (
          <div className="hidden md:flex absolute top-10 left-4 sm:left-10 z-20 items-center gap-3">
            <div className="flex flex-col gap-1 max-w-xs sm:max-w-sm">
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase text-white/80 drop-shadow-md">
                {t("tourDetail.promo.label")}
              </span>
              <span className="text-sm sm:text-base md:text-lg font-semibold leading-snug text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]">
                {promoLabel}
              </span>
              <span className="inline-flex w-fit text-[11px] sm:text-xs font-semibold text-white bg-red-600/95 px-3 py-1 rounded-full drop-shadow-[0_3px_8px_rgba(0,0,0,0.7)] mt-1">
	            {t("tourDetail.promo.earlyBird")}
              </span>
            </div>
            {hasDiscount && (
              <div className="transform -rotate-12">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-lg sm:text-2xl font-extrabold shadow-[0_20px_40px_rgba(0,0,0,0.7)]">
                    %{discountPercent}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <img
          src={heroImage}
          alt={displayTour?.name || tour.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-10">
          {promoLabel && (
            <div className="md:hidden mb-4 flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-white/80 drop-shadow-md">
                  {t("tourDetail.promo.label")}
                </span>
                <span className="text-sm font-semibold leading-snug text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]">
                  {promoLabel}
                </span>
                <span className="inline-flex w-fit text-[11px] font-semibold text-white bg-red-600/95 px-3 py-1 rounded-full drop-shadow-[0_3px_8px_rgba(0,0,0,0.7)] mt-1">
                  {t("tourDetail.promo.earlyBird")}
                </span>
              </div>
              {hasDiscount && (
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center text-lg font-extrabold shadow-[0_16px_32px_rgba(0,0,0,0.65)]">
                    %{discountPercent}
                  </div>
                </div>
              )}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">{displayTour?.name || tour.name}</h1>
          <p className="text-base md:text-lg text-white/90 max-w-3xl">{displayTour?.summary || tour.summary}</p>

          {/* Kısa özet etiketleri: süre, konsept ve premium deneyim vurgusu */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs md:text-sm text-white/90">
            {effectiveDuration && (
              <span className="px-3 py-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-[2px]">
                {effectiveDuration}
              </span>
            )}
            {tour.concept && (
              <span className="px-3 py-1 rounded-full bg-black/35 border border-white/15 backdrop-blur-[2px]">
                {displayTour?.concept || tour.concept}
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-emerald-500/90 text-white border border-emerald-300/70 shadow-sm">
              {t("tourDetail.tags.experienceGroupHoliday")}
            </span>
          </div>

          {/* Broşür: tüm destinasyonlarda hero alanında göster */}
          {effectiveId && (
            <div className="hidden md:block mt-6 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={effectiveId === "bali" ? "/docs/bali-tatil-brosuru.html" : `/docs/tur-brosuru-${effectiveId}-v2.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/95 text-sky-900 text-xs sm:text-sm font-semibold px-4 py-2 shadow-md shadow-black/40 hover:bg-white transition-colors"
                >
                  <span className="text-base sm:text-lg">📄</span>
                  <span>{t("tourDetail.brochure.open", { tourName: displayTour?.name || tour.name })}</span>
                </a>
                <a
                  href={effectiveId === "bali" ? "/docs/pdf/bali-tatil-brosuru.pdf" : `/docs/pdf/tur-brosuru-${effectiveId}-v2.pdf`}
                  download
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white text-xs sm:text-sm font-semibold px-4 py-2 border border-white/20 backdrop-blur-[2px] hover:bg-white/15 transition-colors"
                >
                  <span className="text-base sm:text-lg">⬇️</span>
                  <span>{t("common.downloadPdf")}</span>
                </a>
              </div>
              <p className="text-[11px] text-white/85 max-w-md">{t("tourDetail.brochure.pdfHint")}</p>
            </div>
          )}

          {/* Masaüstü: yazılı geri dön */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t("tourDetail.nav.backAria")}
            className="hidden md:inline-flex absolute left-4 bottom-6 items-center justify-start gap-1 text-xs md:text-sm text-white bg-transparent px-0 py-0 hover:underline transition-colors"
          >
            <span>←</span>
            <span>{t("tourDetail.nav.backText")}</span>
          </button>
        </div>
      </section>

      {/* Üst Bilgiler */}
      <section className="max-w-6xl mx-auto px-4 -mt-10 relative z-10 mb-12">
        {effectiveId && (
          <div className="md:hidden mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={effectiveId === "bali" ? "/docs/bali-tatil-brosuru.html" : `/docs/tur-brosuru-${effectiveId}-v2.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white text-sky-900 text-xs font-semibold px-4 py-2 shadow-sm border border-slate-200"
              >
                <span className="text-base">📄</span>
                <span>{t("tourDetail.brochure.open", { tourName: displayTour?.name || tour.name })}</span>
              </a>
              <a
                href={effectiveId === "bali" ? "/docs/pdf/bali-tatil-brosuru.pdf" : `/docs/pdf/tur-brosuru-${effectiveId}-v2.pdf`}
                download
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white text-xs font-semibold px-4 py-2 shadow-sm border border-slate-800"
              >
                <span className="text-base">⬇️</span>
                <span>{t("common.downloadPdf")}</span>
              </a>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 max-w-md">{t("tourDetail.brochure.pdfHint")}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-sky-50 to-emerald-50 rounded-2xl shadow p-5 flex items-start gap-3">
          <div className="mt-1 text-sky-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{t("tourDetail.durationConcept.title")}</h3>
            <p className="text-sm text-gray-800">{effectiveDuration}</p>
            {plannedDateRangeText && (
              <p className="mt-1 text-[11px] text-gray-700 font-semibold">
                {t("tourDetail.durationConcept.plannedDatesLabel")}: {plannedDateRangeText}
              </p>
            )}
            {tour.concept && (
              <p className="mt-1 inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100">
                {tour.concept}
              </p>
            )}
            <ul className="mt-2 space-y-0.5 text-[11px] text-gray-700 list-disc list-inside">
              {(Array.isArray(t("tourDetail.durationConcept.bullets", { returnObjects: true }))
                ? t("tourDetail.durationConcept.bullets", { returnObjects: true })
                : []
              ).map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <p className="text-[11px] text-gray-500 mt-1">{t("tourDetail.durationConcept.note")}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 via-sky-50 to-white rounded-2xl shadow p-5">
      <p className="text-[11px] md:text-xs text-gray-600 mb-1">{t("tourDetail.packages.intro")}</p>
  <p className="text-xs md:text-sm font-semibold text-gray-900 mb-2">{t("tourDetail.packages.title")}</p>
  <p className="text-xs md:text-sm text-gray-800 leading-relaxed">
    {isJava
      ? t("tourDetail.packages.javaOnly")
      : t("tourDetail.packages.variants")}
  </p>
  </div>
          <div className="bg-gradient-to-br from-sky-600 to-emerald-500 rounded-2xl shadow p-5 text-white flex items-start gap-3">
            <div className="mt-1">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                {hasPackages
                  ? (isJava ? t("tourDetail.pricing.startingPrice.javaPremium") : t("tourDetail.pricing.startingPrice.basic"))
                  : t("tourDetail.pricing.startingPrice.default")}
              </h3>
              {startingPrice ? (
                <>
                  {hasDiscount ? (
                    <>
                      <p className="text-base font-semibold line-through text-red-200 mb-0.5">
                        ${hasPackages ? discountedPrice : basePrice}
                      </p>
                      <p className="text-3xl font-bold mb-1">
                        ${startingPrice}
                        <span className="text-xs font-normal ml-1 align-middle">
	                  {flightInclusionShortNote}
                        </span>
                      </p>
                      <p className="text-xs opacity-90">
                        {(() => {
                          const promoText = promoLabel ? promoLabel.trim() : "";
                          if (promoText) {
                            const hasPercentInText = /%\s*\d+/.test(promoText);
                            return hasPercentInText ? promoText : `${promoText} %${discountPercent}`;
                          }
                          return t("tourDetail.pricing.discountFallback", { discountPercent });
                        })()}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold mb-1">
                        ${startingPrice}
                        <span className="text-xs font-normal ml-1 align-middle">
	                  {flightInclusionShortNote}
                        </span>
                      </p>
                      <p className="text-xs opacity-90">
                        {hasPackages
                          ? t("tourDetail.pricing.perPersonStartEconomy")
                          : t("tourDetail.pricing.perPersonCurrent")}
                      </p>
                    </>
                  )}
				  {isSulawesi && (
				    <p className="text-[11px] opacity-90 mt-1">
				      {t("tourDetail.pricing.sulawesiDomesticFlightsIncluded")}
				    </p>
				  )}
                </>
              ) : (
                <p className="text-xs opacity-90">{t("tourDetail.pricing.priceInfoSoon")}</p>
              )}
              <p className="text-[11px] opacity-90 mt-2">
                {isJava
                  ? t("tourDetail.pricing.programNoteJava")
                  : t("tourDetail.pricing.programNoteDefault")}
              </p>
              <p className="text-[11px] opacity-90 mt-1">
                {t("tourDetail.pricing.whyThisPrice")}
              </p>
            </div>
          </div>
        </div>
      </section>


      {hasPackages && (
  <section className="max-w-6xl mx-auto px-4 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(isJava ? packages.filter((pkg) => pkg.level === "premium") : packages).map((pkg) => (
              <div
                key={pkg.id}
                className={[
                  "relative rounded-2xl border bg-slate-900 shadow-sm p-5 flex flex-col h-full overflow-hidden text-white",
                  pkg.level === "plus" ? "border-emerald-300/70 shadow-md" : "border-slate-700",
                ].join(" ")}
                style={
                  effectiveId === "bali"
                    ? {
                        backgroundImage:
                          pkg.level === "premium"
                            ? "linear-gradient(to bottom right, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.55)), url('/bali-luxury-pool-villa.jpg')"
                            : pkg.level === "plus"
                            ? "linear-gradient(to bottom right, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.5)), url('/bali-rice-terraces-green.jpg')"
                            : "linear-gradient(to bottom right, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.5)), url('/bali-beach-seminyak-palm-trees.jpg')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                <h3 className="mt-1 text-base md:text-lg font-semibold text-white mb-1">{pkg.name}</h3>
                {pkg.headline && (
                  <p className="text-xs md:text-sm text-slate-100/90 mb-3">
                    {pkg.headline}
                  </p>
                )}

                {typeof pkg.computedPrice === "number" && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-100/80">
	              {flightInclusionLongNote}
                    </p>
			    {isSulawesi && (
			      <p className="text-xs text-slate-100/90 mt-1">
			        Program kapsamındaki Endonezya iç hatlar uçuşları paket kapsamındadır, fiyata dahildir.
			      </p>
			    )}
                    <p className="text-2xl font-bold text-emerald-200">
                      ${pkg.computedPrice}
                    </p>
                    {hasDiscount && pkg.computedBasePrice && (
                      <p className="text-[11px] text-red-300 line-through">
                        ${pkg.computedBasePrice}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPackagesExpanded((prev) => !prev)}
                  className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/60 text-[11px] font-medium text-white bg-white/20 hover:bg-white/25 transition-colors mb-2"
                >
                  {packagesExpanded ? t("tourDetail.packages.toggle.hide") : t("tourDetail.packages.toggle.show")}
                  <span className="ml-1 text-xs">{packagesExpanded ? "−" : "+"}</span>
                </button>

                {packagesExpanded && (
                  <>
                    {Array.isArray(pkg.highlights) && pkg.highlights.length > 0 && (
                      <ul className="mt-1 mb-3 space-y-1.5 text-xs md:text-sm text-slate-50">
                        {pkg.highlights.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span>{renderWithInclusionHighlight(item, i18n.language)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {pkg.level !== "premium" && (
                      <div className="mb-3 border-t border-dashed border-white/25 pt-2">
                        <p className="text-[11px] font-medium text-slate-50 mb-1">
                          {t("tourDetail.packages.premiumDifferences")}
                        </p>
                        <ul className="space-y-1.5 text-[11px] text-slate-100/90">
                          {getPremiumDifferences(effectiveId, pkg.level).map((item) => (
                            <li key={item}>{renderWithInclusionHighlight(item, i18n.language)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {pkg.notes && (
                      <p className="mt-auto text-[11px] text-slate-100/80 border-t border-white/20 pt-2">
                        {renderWithInclusionHighlight(pkg.notes, i18n.language)}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA ve buton altı açılan formlar (sayfanın üst kısmında) */}
      <section className="bg-gradient-to-r from-sky-600 to-emerald-500 py-10 md:py-12 relative overflow-hidden">
        {/* Bali / Lombok / Java / Sumatra / Komodo / Sulawesi sayfalarında, CTA arka planına tam yükseklik görseller bindir */}
        {(isBali || isLombok || isJava || isSumatra || isKomodo || isSulawesi) && (
          <div className="pointer-events-none absolute inset-0 z-0">
            {/* Üstten alta kadar sol tarafta dalış & mercan resifi görseli */}
            <div className="absolute inset-y-0 left-0 w-1/2 md:w-1/3 lg:w-1/4 opacity-95">
              <img
                src={resolveImageUrl(
                  isJava
                    ? tour?.hero || tour?.image || "/placeholder.svg"
                    : isSulawesi
                      ? "/20160724_101830.jpg"
                    : isKomodo
                      ? "/vecteezy_ai-generated-woman-walking-on-the-beach-romantic_37348905.jpg"
                      : isSumatra
                        ? "/sumatra-rainforest-orangutan-lake-toba.jpg"
                    : isLombok
                      ? "/surya-bali-jet-ski-sanur.jpg"
                      : "https://res.cloudinary.com/dj1xg1c56/image/upload/v1767781298/vecteezy_diver-swimming-over-a-coral-reef-ai-generated_33502407_lsciky.jpg"
                )}
                alt={
                  tString(
                    `tourDetail.ctaTop.images.leftAlt.${effectiveId}`,
                    isJava
                      ? "Java - tur görseli"
                      : isSulawesi
                        ? "Sulawesi - tur görseli"
                        : isKomodo
                          ? "Komodo - sahil yürüyüşü"
                          : isSumatra
                            ? "Sumatra - yağmur ormanı"
                            : isLombok
                              ? "Lombok - su sporu"
                              : "Bali - dalış ve mercan resifi",
                  )
                }
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Üstten alta kadar sağ tarafta tekne / arkadaş grubu görseli */}
            <div className="absolute inset-y-0 right-0 w-1/2 md:w-1/3 lg:w-1/4 opacity-95">
              <img
                src={resolveImageUrl(
                  isJava
                    ? (Array.isArray(tour?.gallery) && tour.gallery[1] ? tour.gallery[1] : tour?.hero || tour?.image || "/placeholder.svg")
                    : isSulawesi
                      ? "/22392be0-3624-49f7-ba42-3405352c5c8d.avif"
                    : isKomodo
                      ? "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200"
                      : isSumatra
                        ? "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=1200"
                    : isLombok
                      ? "/lombok-island-beach-waterfall.jpg"
                      : "/three-happy-cheerful-european-people-having-lunch-board-yacht-drinking-champagne-spending-fantastic-time-together-friends-arranged-surprise-party-boat-b-day-girl.jpg"
                )}
                alt={
                  tString(
                    `tourDetail.ctaTop.images.rightAlt.${effectiveId}`,
                    isJava
                      ? "Java - tur görseli"
                      : isSulawesi
                        ? "Sulawesi - uçuş ağırlıklı rota"
                        : isKomodo
                          ? "Labuan Bajo - tekne manzarası"
                          : isSumatra
                            ? "Sumatra - Lake Toba"
                            : "Lombok - teknede kutlama ve arkadaş grubu",
                  )
                }
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Mobilde metin okunabilirliği için karartma overlay */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-black/55 md:bg-black/30" />

        <div className="max-w-6xl mx-auto px-4 text-white relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("tourDetail.ctaTop.title", { tourName: displayTour?.name || tour.name })}
            </h2>
            <p className="text-sm md:text-base mb-6 text-white/90">
              {t("tourDetail.ctaTop.description")}
            </p>
            <div className="max-w-3xl mx-auto mb-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
              <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">{t("tourDetail.ctaTop.steps.1.title")}</p>
                <p className="text-xs text-white/90 mt-1">{t("tourDetail.ctaTop.steps.1.desc")}</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">{t("tourDetail.ctaTop.steps.2.title")}</p>
                <p className="text-xs text-white/90 mt-1">{t("tourDetail.ctaTop.steps.2.desc")}</p>
              </div>
              <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">{t("tourDetail.ctaTop.steps.3.title")}</p>
                <p className="text-xs text-white/90 mt-1">{t("tourDetail.ctaTop.steps.3.desc")}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <a
                href="/docs/pdf/on-kayit-bilgi-paketi.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-2 text-xs text-white transition-colors"
              >
                <span className="font-semibold">{t("tourDetail.ctaTop.pdfs.preRegPack")}</span>
                <span className="text-white/80">{t("tourDetail.ctaTop.pdfs.open")}</span>
              </a>
              <a
                href={effectiveId === "bali" ? "/docs/pdf/bali-tatil-brosuru.pdf" : `/docs/pdf/tur-brosuru-${effectiveId}-v2.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-2 text-xs text-white transition-colors"
              >
                <span className="font-semibold">{t("tourDetail.ctaTop.pdfs.brochure")}</span>
                <span className="text-white/80">{t("tourDetail.ctaTop.pdfs.open")}</span>
              </a>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3 mb-4">
              <button
                type="button"
                onClick={() =>
                  setShowPlannedForm((prev) => {
                    const next = !prev;
                    if (next) {
                      setShowGroupForm(false);
                      setShowDepositForm(false);
                    }
                    return next;
                  })
                }
                className="inline-flex items-center justify-center px-5 py-2 rounded-full border border-white/80 bg-white/95 text-sky-700 font-medium text-xs md:text-sm hover:bg-white shadow-sm transition-colors"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {t("tourDetail.ctaTop.actions.wantInfo")}
              </button>
              <button
                type="button"
				onClick={() =>
					setShowGroupForm((prev) => {
						const next = !prev;
						if (next) {
							setShowPlannedForm(false);
							setShowDepositForm(false);
						}
						return next;
					})
				}
				className="inline-flex items-center justify-center px-5 py-2 rounded-full border border-sky-200 bg-sky-600/95 text-white font-medium text-xs md:text-sm hover:bg-sky-700 shadow-sm transition-colors"
              >
                {t("tourDetail.ctaTop.actions.groupOffer")}
              </button>
              {hasPackages && (
                <button
                  type="button"
                  onClick={() =>
                    setShowDepositForm((prev) => {
                      const next = !prev;
                      if (next) {
                        setShowPlannedForm(false);
                        setShowGroupForm(false);
                      }
                      return next;
                    })
                  }
                  className="inline-flex items-center justify-center px-5 py-2 rounded-full border border-amber-200 bg-amber-50/95 text-amber-900 font-medium text-xs md:text-sm hover:bg-amber-100 shadow-sm transition-colors"
                >
                  {t("tourDetail.ctaTop.actions.paymentOptions")}
                </button>
              )}
            </div>
          </div>

          {showPlannedForm && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <form
                onSubmit={handlePlannedSubmit}
                className="bg-white/95 text-left text-gray-900 rounded-2xl p-6 md:p-8 shadow space-y-6"
              >
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  {t("tourDetail.forms.planned.title", { tourName: displayTour?.name || tour.name })}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-4">
                  {t("tourDetail.forms.planned.description")}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.planned.fields.fullName.label")}</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={plannedForm.name}
                      onChange={handlePlannedChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm"
                      placeholder={t("tourDetail.forms.planned.fields.fullName.placeholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.planned.fields.email.label")}</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={plannedForm.email}
                      onChange={handlePlannedChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm"
                      placeholder={t("tourDetail.forms.planned.fields.email.placeholder")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.planned.fields.phone.label")}</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={plannedForm.phone}
                      onChange={handlePlannedChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm"
                      placeholder={t("tourDetail.forms.planned.fields.phone.placeholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.planned.fields.participation.label")}</label>
                    <select
                      name="participation"
                      required
                      value={plannedForm.participation}
                      onChange={handlePlannedChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm"
                    >
                      <option value="bireysel">{t("tourDetail.forms.planned.fields.participation.options.individual")}</option>
                      <option value="aile">{t("tourDetail.forms.planned.fields.participation.options.family")}</option>
                      <option value="cift">{t("tourDetail.forms.planned.fields.participation.options.couple")}</option>
                      <option value="arkadas">{t("tourDetail.forms.planned.fields.participation.options.friends")}</option>
                      <option value="diger">{t("tourDetail.forms.planned.fields.participation.options.other")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.planned.fields.requestedTour.label")}</label>
                    <input
                      type="text"
                      name="tour"
                      required
                      value={plannedForm.tour}
                      onChange={handlePlannedChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm"
                      placeholder={
                        tour
                          ? `${displayTour?.name || tour.name} - ${effectiveDuration}`
                          : t("tourDetail.forms.planned.fields.requestedTour.placeholderExample")
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.planned.fields.peopleCount.label")}</label>
                    <input
                      type="number"
                      name="people"
                      required
                      min="1"
                      value={plannedForm.people}
                      onChange={handlePlannedChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm"
                      placeholder={t("tourDetail.forms.planned.fields.peopleCount.placeholder")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.planned.fields.notes.label")}</label>
                    <input
                      type="text"
                      name="notes"
                      value={plannedForm.notes}
                      onChange={handlePlannedChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-sm"
                      placeholder={t("tourDetail.forms.planned.fields.notes.placeholder")}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 text-[11px] text-gray-700">
                  <input
                    type="checkbox"
                    name="privacy"
                    checked={plannedForm.privacy}
                    onChange={handlePlannedChange}
                    required
                    className="mt-1 h-4 w-4 border-gray-300 rounded"
                  />
                  <p>
                    <span>{t("tourDetail.forms.planned.privacy.text")}</span>{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:underline font-semibold"
                    >
                      {t("tourDetail.forms.planned.privacy.link")}
                    </a>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-2.5 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors"
                >
                  {t("tourDetail.forms.planned.submit")}
                </button>
              </form>

              <div className="bg-sky-900/40 border border-white/20 rounded-2xl p-5 md:p-6 text-xs md:text-sm leading-relaxed">
                <h3 className="text-base md:text-lg font-semibold mb-3 text-white">
                  {t("tourDetail.importantNotes.title")}
                </h3>
                <p className="text-white/90 mb-3">
                  {t("tourDetail.importantNotes.plannedBoxDescription")}
                </p>
                <ol className="list-decimal list-inside space-y-1.5 md:space-y-2 text-white text-[11px] md:text-xs">
                  {importantNotesItemKeys.map((k) => (
                    <li key={k}>
                      <Trans
                        i18nKey={`tourDetail.importantNotes.items.${k}`}
                        components={importantNotesComponentsPlanned}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {showDepositForm && hasPackages && (
            <form
              onSubmit={handleDepositSubmit}
              className="mt-8 max-w-3xl mx-auto bg-white/95 text-left text-gray-900 rounded-2xl p-6 md:p-8 shadow space-y-5"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-900">{t("tourDetail.deposit.intro.title")}</h3>

              <p className="text-xs md:text-sm text-gray-600 mb-3">
                <Trans
                  i18nKey="tourDetail.deposit.intro.p1"
                  components={{ b: <span className="font-semibold" /> }}
                />
              </p>
              <p className="text-xs md:text-sm text-gray-600 mb-3">
                {t("tourDetail.deposit.intro.p2")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.deposit.ui.packageSelectionLabel")}</label>
                  <select
                    name="packageId"
                    required
                    value={depositForm.packageId}
                    onChange={handleDepositChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                  >
                      {(isJava ? packages.filter((pkg) => pkg.level === "premium") : packages).map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({t("tourDetail.deposit.ui.perPersonPrice", { price: pkg.computedPrice })})
                      </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.deposit.ui.reservationTypeLabel")}</label>
                  <select
                    name="reservationType"
                    required
                    value={depositForm.reservationType}
                    onChange={handleDepositChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                  >
                    <option value="full">{t("tourDetail.deposit.ui.reservationType.full")}</option>
                    <option value="deposit">{t("tourDetail.deposit.ui.reservationType.deposit")}</option>
                  </select>
                </div>
              </div>

              {hasFlightLimit && (
                <div className="border border-dashed border-slate-200 rounded-xl p-3 md:p-4 bg-slate-50">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{t("tourDetail.deposit.ui.flightPolicyLabel")}</span> {flightInclusionLongNote}
                  </p>
                </div>
              )}

              {optionalExtras.length > 0 && (
                <div className="border border-dashed border-amber-200 rounded-xl p-3 md:p-4 bg-amber-50/60">
                  <p className="text-xs md:text-sm font-semibold text-amber-900 mb-2">{t("tourDetail.deposit.ui.optionalExtras.title")}</p>
                  <p className="text-[11px] md:text-xs text-amber-900/90 mb-3">
                    {t("tourDetail.deposit.ui.optionalExtras.description")}
                  </p>
                  <div className="space-y-2">
                    {optionalExtras.map((extra) => {
                      const est = Number(extra.estimatedPricePerPerson) || 0;
                      const checked = !!depositForm.extras?.[extra.id];
                      const isPremiumPackage = selectedDepositPackage && selectedDepositPackage.level === "premium";
                      const discountedEst = est > 0 && isPremiumPackage ? Math.round(est * 0.75) : est;
                      const displayValue = discountedEst;
                      return (
                        <label
                          key={extra.id}
                          className="flex items-start gap-2 text-[11px] md:text-xs text-gray-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleDepositExtraToggle(extra.id)}
                            className="mt-0.5 h-4 w-4 border-gray-300 rounded"
                          />
                          <span>
                            <span className="font-semibold">{extra.title}</span>{" "}
                            <span className="text-gray-600">
                              {est > 0 ? (
                                checked ? (
                                  t("tourDetail.deposit.ui.optionalExtras.priceToday", { price: displayValue })
                                ) : isPremiumPackage ? (
                                  t("tourDetail.deposit.ui.optionalExtras.priceEstimatedPremiumDiscount", { price: displayValue })
                                ) : (
                                  t("tourDetail.deposit.ui.optionalExtras.priceEstimated", { price: est })
                                )
                              ) : (
                                t("tourDetail.deposit.ui.optionalExtras.priceContactUs")
                              )}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-xs md:text-sm text-gray-800">
                  <h4 className="font-semibold text-gray-900">{t("tourDetail.deposit.ui.summary.title")}</h4>
                  <p>
                    {t("tourDetail.deposit.ui.summary.packageTotal")}:
                    <span className="font-semibold ml-1">${adjustedDepositPackageTotal || 0}</span>
                  </p>
                  <p>
                    {t("tourDetail.deposit.ui.summary.extrasTotal")}:
                    <span className="font-semibold ml-1">${extrasTotal || 0}</span>
                  </p>
                  <p>
                    {t("tourDetail.deposit.ui.summary.grandTotal")}:
                    <span className="font-semibold ml-1">${adjustedDepositGrandTotal || 0}</span>
                  </p>
                  {depositForm.reservationType === "deposit" && (
                    <>
                      <p>
                        {t("tourDetail.deposit.ui.summary.depositPercent")}:
                        <span className="font-semibold ml-1">%{DEPOSIT_PERCENT}</span>
                      </p>
                      <p>
                        {t("tourDetail.deposit.ui.summary.depositToPayNow")}:
                        <span className="font-semibold ml-1">${depositAmount || 0}</span>
                      </p>
                    </>
                  )}
                  {depositForm.reservationType === "full" && (
                    <p>
                      {t("tourDetail.deposit.ui.summary.totalToPay")}:
                      <span className="font-semibold ml-1">${adjustedDepositGrandTotal || 0}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-gray-600 mt-1">
                    {t("tourDetail.deposit.ui.summary.note")}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.deposit.form.fullNameLabel")}</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={depositForm.name}
                        onChange={handleDepositChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder={t("tourDetail.deposit.form.fullNamePlaceholder")}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.deposit.form.emailLabel")}</label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={depositForm.email}
                          onChange={handleDepositChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                          placeholder={t("tourDetail.deposit.form.emailPlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.deposit.form.phoneLabel")}</label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={depositForm.phone}
                          onChange={handleDepositChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                          placeholder={t("tourDetail.deposit.form.phonePlaceholder")}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.deposit.form.peopleCountLabel")}</label>
                      <input
                        type="number"
                        name="people"
                        required
                        min="1"
                        value={depositForm.people}
                        onChange={handleDepositChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder={t("tourDetail.deposit.form.peopleCountPlaceholder")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.deposit.form.notesLabel")}</label>
                      <input
                        type="text"
                        name="notes"
                        value={depositForm.notes}
                        onChange={handleDepositChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                        placeholder={t("tourDetail.deposit.form.notesPlaceholder")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-[11px] md:text-xs text-gray-700">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4">
                  <p className="text-[11px] md:text-xs font-semibold text-slate-900 mb-2">{t("tourDetail.deposit.terms.contract.title")}</p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={depositForm.acceptTerms}
                      onChange={handleDepositChange}
                      required
                      className="mt-0.5 h-4 w-4 border-gray-300 rounded"
                    />
                    <span>
                      <Trans
                        i18nKey="tourDetail.deposit.terms.contract.text"
                        components={{
                          agreementLink: (
                            <a
                              href="/dokumanlar?doc=paket-tur-sozlesmesi"
                              className="text-sky-600 underline font-semibold"
                            />
                          ),
                          rulesLink: (
                            <a
                              href="#tour-rules"
                              className="text-sky-600 underline font-semibold"
                            />
                          ),
                        }}
                      />
                    </span>
                  </label>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4">
                  <p className="text-[11px] md:text-xs font-semibold text-slate-900 mb-2">{t("tourDetail.deposit.terms.distanceSales.title")}</p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="acceptDistanceSales"
                      checked={depositForm.acceptDistanceSales}
                      onChange={handleDepositChange}
                      required
                      className="mt-0.5 h-4 w-4 border-gray-300 rounded"
                    />
                    <span>
                      <Trans
                        i18nKey="tourDetail.deposit.terms.distanceSales.text"
                        components={{
                          link: (
                            <a
                              href="/dokumanlar?doc=mesafeli-satis-sozlesmesi"
                              className="text-sky-600 underline font-semibold"
                            />
                          ),
                        }}
                      />
                    </span>
                  </label>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4">
                  <p className="text-[11px] md:text-xs font-semibold text-slate-900 mb-2">{t("tourDetail.deposit.terms.pricingScope.title")}</p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="acceptPricingScope"
                      checked={depositForm.acceptPricingScope}
                      onChange={handleDepositChange}
                      required
                      className="mt-0.5 h-4 w-4 border-gray-300 rounded"
                    />
                    <span>
                      <a
                        href="#pricing-details"
                        className="text-sky-600 underline font-semibold"
                      >
                        {t("tourDetail.deposit.terms.pricingScope.linkText")}
                      </a>
                      {" "}
                      {t("tourDetail.deposit.terms.pricingScope.text.part1")}
                      {" "}
                      <span className="font-semibold">${flightLimitPerPersonUsdRounded}</span>
                      {" "}
                      {t("tourDetail.deposit.terms.pricingScope.text.part2")}
                      {" "}
                      <span className="font-semibold">${flightLimitPerPersonUsdRounded} {t("tourDetail.deposit.terms.pricingScope.text.overLabel")}</span>
                      {" "}
                      {t("tourDetail.deposit.terms.pricingScope.text.part3")}
                    </span>
                  </label>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-4">
                  <p className="text-[11px] md:text-xs font-semibold text-slate-900 mb-2">{t("tourDetail.deposit.terms.kvkk.title")}</p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="acceptKvkk"
                      checked={depositForm.acceptKvkk}
                      onChange={handleDepositChange}
                      required
                      className="mt-0.5 h-4 w-4 border-gray-300 rounded"
                    />
                    <span>
                      <Trans
                        i18nKey="tourDetail.deposit.terms.kvkk.text"
                        components={{
                          link: (
                            <a
                              href="/dokumanlar?doc=kvkk-aydinlatma-metni"
                              className="text-sky-600 underline font-semibold"
                            />
                          ),
                        }}
                      />
                    </span>
                  </label>
                </div>

                {depositForm.reservationType === "deposit" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 md:p-4">
                    <p className="text-[11px] md:text-xs font-semibold text-amber-900 mb-2">{t("tourDetail.deposit.terms.depositApproval.title")}</p>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="acceptDepositTerms"
                        checked={depositForm.acceptDepositTerms}
                        onChange={handleDepositChange}
                        required
                        className="mt-0.5 h-4 w-4 border-gray-300 rounded"
                      />
                      <span>{t("tourDetail.deposit.terms.depositApproval.text")}</span>
                    </label>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-white p-3 md:p-4">
                  <p className="text-[11px] md:text-xs font-semibold text-slate-900">{t("tourDetail.deposit.terms.englishDocs.title")}</p>
                  <p className="text-[11px] text-slate-600 mt-1">{t("tourDetail.deposit.terms.englishDocs.description")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href="/dokumanlar?lang=en"
                      className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-[11px] font-semibold hover:bg-slate-100"
                    >
                      {t("tourDetail.deposit.terms.englishDocs.links.hub")}
                    </a>
                    <a
                      href="/docs/package-tour-agreement-en.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-[11px] font-semibold hover:bg-slate-100"
                    >
                      {t("tourDetail.deposit.terms.englishDocs.links.packageTour")}
                    </a>
                    <a
                      href="/docs/distance-sales-agreement-en.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-[11px] font-semibold hover:bg-slate-100"
                    >
                      {t("tourDetail.deposit.terms.englishDocs.links.distanceSales")}
                    </a>
                    <a
                      href="/docs/pre-information-form-en.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-[11px] font-semibold hover:bg-slate-100"
                    >
                      {t("tourDetail.deposit.terms.englishDocs.links.preInformation")}
                    </a>
                    <a
                      href="/docs/cancellation-refund-policy-en.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-[11px] font-semibold hover:bg-slate-100"
                    >
                      {t("tourDetail.deposit.terms.englishDocs.links.cancellationRefund")}
                    </a>
                    <a
                      href="/docs/kvkk-information-notice-en.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-[11px] font-semibold hover:bg-slate-100"
                    >
                      {t("tourDetail.deposit.terms.englishDocs.links.kvkkNotice")}
                    </a>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  !String(depositForm.name || "").trim()
                  || !String(depositForm.email || "").trim()
                  || !String(depositForm.phone || "").trim()
                  || !depositPeopleCount
                  || !depositForm.acceptTerms
                  || !depositForm.acceptDistanceSales
                  || !depositForm.acceptPricingScope
                  || !depositForm.acceptKvkk
                  || (depositForm.reservationType === "deposit" && !depositForm.acceptDepositTerms)
                }
                className={[
                  "w-full md:w-auto px-6 py-2.5 rounded-full text-sm font-semibold transition-colors",
                  "bg-amber-500 text-slate-900 hover:bg-amber-400",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500",
                ].join(" ")}
              >
                {t("tourDetail.deposit.ui.submit")}
              </button>
            </form>
          )}


          {showGroupForm && (
            <form
              onSubmit={handleGroupSubmit}
              className="mt-8 max-w-3xl mx-auto bg-white/95 text-left text-gray-900 rounded-2xl p-6 md:p-8 shadow space-y-6"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                {t("tourDetail.forms.group.title", { tourName: displayTour?.name || tour.name })}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 mb-4">
                {t("tourDetail.forms.group.description")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.group.fields.fullName.label")}</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={groupForm.name}
                    onChange={handleGroupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder={t("tourDetail.forms.group.fields.fullName.placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.group.fields.email.label")}</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={groupForm.email}
                    onChange={handleGroupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder={t("tourDetail.forms.group.fields.email.placeholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.group.fields.phone.label")}</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={groupForm.phone}
                    onChange={handleGroupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder={t("tourDetail.forms.group.fields.phone.placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.group.fields.organization.label")}</label>
                  <input
                    type="text"
                    name="organization"
                    value={groupForm.organization}
                    onChange={handleGroupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder={t("tourDetail.forms.group.fields.organization.placeholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.group.fields.groupType.label")}</label>
                  <select
                    name="groupType"
                    required
                    value={groupForm.groupType}
                    onChange={handleGroupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="">{t("tourDetail.forms.group.fields.groupType.placeholder")}</option>
                    <option value="company">{t("tourDetail.forms.group.fields.groupType.options.company")}</option>
                    <option value="school">{t("tourDetail.forms.group.fields.groupType.options.school")}</option>
                    <option value="association">{t("tourDetail.forms.group.fields.groupType.options.association")}</option>
                    <option value="friends">{t("tourDetail.forms.group.fields.groupType.options.friends")}</option>
                    <option value="other">{t("tourDetail.forms.group.fields.groupType.options.other")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.group.fields.peopleCount.label")}</label>
                  <input
                    type="number"
                    name="people"
                    required
                    min="5"
                    value={groupForm.people}
                    onChange={handleGroupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder={t("tourDetail.forms.group.fields.peopleCount.placeholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.group.fields.dates.label")}</label>
                  <input
                    type="text"
                    name="dates"
                    required
                    value={groupForm.dates}
                    onChange={handleGroupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder={t("tourDetail.forms.group.fields.dates.placeholder")}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.group.fields.routes.label")}</label>
                  <input
                    type="text"
                    name="routes"
                    value={groupForm.routes}
                    onChange={handleGroupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder={t("tourDetail.forms.group.fields.routes.placeholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.group.fields.budget.label")}</label>
                  <select
                    name="budget"
                    value={groupForm.budget}
                    onChange={handleGroupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="">{t("tourDetail.forms.group.fields.budget.placeholder")}</option>
                    <option value="1500-2000$">1500-2000$</option>
                    <option value="2000-2500$">2000-2500$</option>
                    <option value="3000-4500$">3000-4500$</option>
                    <option value="5000+">{t("tourDetail.forms.group.fields.budget.options.5000plus")}</option>
                    <option value="diger">{t("tourDetail.forms.group.fields.budget.options.other")}</option>
                  </select>
                  {groupForm.budget === "diger" && (
                    <>
                      <label className="block text-xs font-semibold text-gray-800 mb-1 mt-3">{t("tourDetail.forms.group.fields.budgetOther.label")}</label>
                      <input
                        type="text"
                        name="budgetOther"
                        value={groupForm.budgetOther}
                        onChange={handleGroupChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder={t("tourDetail.forms.group.fields.budgetOther.placeholder")}
                      />
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{t("tourDetail.forms.group.fields.notes.label")}</label>
                  <input
                    type="text"
                    name="notes"
                    value={groupForm.notes}
                    onChange={handleGroupChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder={t("tourDetail.forms.group.fields.notes.placeholder")}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 text-[11px] text-gray-700">
                <input
                  type="checkbox"
                  name="privacy"
                  checked={groupForm.privacy}
                  onChange={handleGroupChange}
                  required
                  className="mt-1 h-4 w-4 border-gray-300 rounded"
                />
                <span>
                  {t("tourDetail.forms.group.privacy.text")}
                </span>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                {t("tourDetail.forms.group.submit")}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Tur Programı – Gün Gün Akış */}
      <section id="tour-rules" className="w-full px-4 mb-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 max-w-6xl mr-auto">
          {t("tourDetail.itinerary.title")}
        </h2>
        <div className="space-y-5">
          {Array.isArray(tour.itinerary) && tour.itinerary.length > 0 ? (
            tour.itinerary.map((day) => {
            const maxItineraryDay = Array.isArray(tour.itinerary)
              ? Math.max(...tour.itinerary.map((d) => Number(d?.day) || 0))
              : 0;
            const dayBgKey = id ? `${id}-itinerary-day-${day.day}` : "";
            const dayBgKeyEffective = effectiveId ? `${effectiveId}-itinerary-day-${day.day}` : "";
            const dayBgOverride = (dayBgKey && imageUrls[dayBgKey])
              ? imageUrls[dayBgKey]
              : (dayBgKeyEffective && imageUrls[dayBgKeyEffective])
                ? imageUrls[dayBgKeyEffective]
                : null;
            const dayBgImage = dayBgOverride
              ? dayBgOverride
              : "https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=1200";

            const normalizedDayTitle = (day.title || "").toLowerCase();
            const isExplicitGuidedDay = normalizedDayTitle.includes("rehberli");
            const isEdgeDay = (Number(day.day) || 0) === 1 || (Number(day.day) || 0) === maxItineraryDay;

            const isFreeDay =
              normalizedDayTitle.includes("serbest gün") ||
              normalizedDayTitle.includes("serbest gun") ||
              normalizedDayTitle.includes("tam gün serbest") ||
              normalizedDayTitle.includes("tam gun serbest") ||
              ((effectiveId === "lombok" && (day.day === 1 || day.day === 7)) || (isEdgeDay && !isExplicitGuidedDay));

            // Serbest günler: sade, açık renk kart
            if (isFreeDay) {
              // Her serbest gün kartını sağa doğru uzat, soluna görsel yerleştir
              const freeDayImages = [
                "/vecteezy_two-men-riding-jet-skis-side-by-side-on-the-water-concept_68431320.jpg",
                "/vecteezy_luxurious-yacht-anchored-in-a-tropical-paradise-under-a-clear_73309259.jpeg",
                "/young-slim-woman-sitting-bikini-bathing-suit-yacht-basking-sun.jpg",
              ];
              const freeImageIndex = day.day % freeDayImages.length;
              const freeImageSrc = dayBgOverride || freeDayImages[freeImageIndex];
              const freeImageResolved = resolveImageUrl(freeImageSrc);

              return (
                <div key={day.day} className="relative w-full">
                    {/* Mobilde üstte görsel */}
                    <div className="md:hidden mb-3 rounded-lg overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
                      <img
                        src={freeImageResolved}
                        alt={t("tourDetail.itinerary.dayImageAlt", { dayTitle: day.title || "" })}
                        className="w-full h-44 object-cover"
                        loading="lazy"
                      />
                    </div>

                  {/* Sol tarafta görsel alanı – kartın üst ve alt noktalarıyla hizalı */}
                  <div className="hidden md:block absolute inset-y-0 left-4 md:left-4 w-52 lg:left-8 lg:w-56 rounded-none overflow-hidden shadow-lg border border-slate-200 bg-slate-100">
                    <img
                      src={freeImageResolved}
                      alt={t("tourDetail.itinerary.dayImageAlt", { dayTitle: day.title || "" })}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Asıl serbest gün kartı – geniş alan kaplasın diye sağa doğru uzatıldı */}
                  <div className="rounded-lg bg-slate-50 text-slate-900 shadow-sm border border-slate-200 p-4 md:p-5 flex gap-4 md:gap-6 ml-0 md:ml-56 lg:ml-64 mr-0 md:mr-6 lg:mr-10">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-white flex items-center justify-center text-xs md:text-sm font-semibold shadow">
                        {t("tourDetail.itinerary.dayNumber", { dayNumber: day.day })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch">
                        <div className="md:flex-1">
                          <h3 className="font-semibold text-base md:text-lg mb-2 text-slate-900">{day.title}</h3>
                          <ul className="space-y-1.5 mb-1 text-sm text-slate-700">
                            {day.activities.map((activity, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                <span>{renderWithInclusionHighlight(activity, i18n.language)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {Array.isArray(day.optionalExtras) && day.optionalExtras.length > 0 && (
                          <div className="w-full md:w-72 lg:w-80 flex-shrink-0">
                            {day.optionalExtras.map((extra) => {
                              const extraKey = `${day.day}-${extra.id}`;
                              const isOpen = openOptionalExtraId === extraKey;
                              return (
                                <div
                                  key={extra.id}
                                  data-optional-extra-card
                                  className="bg-white rounded-lg border border-slate-200 p-3 text-xs md:text-sm shadow-sm"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenOptionalExtraId((prev) => (prev === extraKey ? null : extraKey))
                                    }
                                    className="w-full text-left flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <p className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800 mb-1">
                                        {t("tourDetail.itinerary.optionalExtra.badge")}
                                      </p>
                                      <p className="font-semibold leading-snug text-slate-900">
                                        {extra.title}
                                      </p>
                                      {extra.shortDescription && (
                                        <p className="text-[11px] text-slate-600 mt-0.5">
                                          {extra.shortDescription}
                                        </p>
                                      )}
                                      <p className="text-[10px] text-rose-600 mt-1">
                                        {isOpen
                                          ? t("tourDetail.itinerary.optionalExtra.hint.close")
                                          : t("tourDetail.itinerary.optionalExtra.hint.open")}
                                      </p>
                                    </div>
                                    <span className="text-base font-semibold text-emerald-700">
                                      {isOpen ? "−" : "+"}
                                    </span>
                                  </button>

                                  {isOpen && (
                                    <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
                                      {extra.priceNote && (
                                        <p className="text-[11px] font-semibold text-emerald-800">
                                          {renderWithInclusionHighlight(extra.priceNote, i18n.language)}
                                        </p>
                                      )}
                                      {Array.isArray(extra.details) && extra.details.length > 0 && (
                                        <ul className="space-y-1.5 text-[11px] text-slate-700">
                                          {extra.details.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                              <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                                              <span>{renderWithInclusionHighlight(item, i18n.language)}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                      {extra.note && (
                                        <p className="text-[10px] text-slate-600">
                                          {renderWithInclusionHighlight(extra.note, i18n.language)}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Diğer günler: yalnızca program kartı (rehberli gün)
            return (
              <div key={day.day} className="relative w-full">
                {/* Mobilde kartın dışında görsel (serbest günlerdeki gibi) */}
                <div className="md:hidden mb-3 rounded-lg overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
                  <img
                    src={dayBgImage}
                    alt=""
                    className="w-full h-44 object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Rehberli gün kartı – masaüstünde sağdan sayfa bitişine kadar uzar */}
                <div className="relative overflow-hidden rounded-lg bg-slate-300 text-slate-900 shadow-sm border border-slate-400 p-4 md:p-5 md:pr-[18rem] lg:pr-[22rem] flex gap-4 md:gap-6 ml-0 md:ml-0 lg:ml-0 mr-0 md:mr-[150px]">
                  {/* Sağ tarafta arka plan görseli (rehberli gün kartının üstünde) */}
                  <div className="pointer-events-none hidden md:block absolute inset-y-0 right-0 md:w-[18rem] lg:w-[22rem] z-20">
                    <img
                      src={dayBgImage}
                      alt=""
                      className="w-full h-full object-cover -translate-x-[40px]"
                      loading="lazy"
                    />
                  </div>

                  <div className="relative z-10 w-full flex gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-white flex items-center justify-center text-[13px] md:text-sm font-semibold shadow-lg">
                      {t("tourDetail.itinerary.dayNumber", { dayNumber: day.day })}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch">
                      <div className="md:flex-1">
                        <h3 className="font-semibold text-lg md:text-xl mb-2">{day.title}</h3>
                        <ul className="space-y-1.5 mb-1">
                          {day.activities.map((activity, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                              <span>{renderWithInclusionHighlight(activity, i18n.language)}</span>
                            </li>
                          ))}
                        </ul>
                        </div>
                      </div>

                      {Array.isArray(day.optionalExtras) && day.optionalExtras.length > 0 && (
                        <div className="w-full md:w-72 lg:w-80 flex-shrink-0">
                          {day.optionalExtras.map((extra) => {
                            const extraKey = `${day.day}-${extra.id}`;
                            const isOpen = openOptionalExtraId === extraKey;
                            return (
                              <div
                                key={extra.id}
                                data-optional-extra-card
                                className="bg-white rounded-lg border border-slate-200 p-3 text-xs md:text-sm shadow-sm"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenOptionalExtraId((prev) => (prev === extraKey ? null : extraKey))
                                  }
                                  className="w-full text-left flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <p className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800 mb-1">
                                      {t("tourDetail.itinerary.optionalExtra.badge")}
                                    </p>
                                    <p className="font-semibold leading-snug text-slate-900">
                                      {extra.title}
                                    </p>
                                    {extra.shortDescription && (
                                      <p className="text-[11px] text-slate-600 mt-0.5">
                                        {extra.shortDescription}
                                      </p>
                                    )}
                                    <p className="text-[10px] text-rose-600 mt-1">
                                      {isOpen
                                        ? t("tourDetail.itinerary.optionalExtra.hint.close")
                                        : t("tourDetail.itinerary.optionalExtra.hint.open")}
                                    </p>
                                  </div>
                                  <span className="text-base font-semibold text-emerald-700">
                                    {isOpen ? "−" : "+"}
                                  </span>
                                </button>

                                {isOpen && (
                                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
                                    {extra.priceNote && (
                                      <p className="text-[11px] font-semibold text-emerald-800">
                                        {renderWithInclusionHighlight(extra.priceNote, i18n.language)}
                                      </p>
                                    )}
                                    {Array.isArray(extra.details) && extra.details.length > 0 && (
                                      <ul className="space-y-1.5 text-[11px] text-slate-700">
                                        {extra.details.map((item, idx) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                                            <span>{renderWithInclusionHighlight(item, i18n.language)}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    {extra.note && (
                                      <p className="text-[10px] text-slate-600">
                                        {renderWithInclusionHighlight(extra.note, i18n.language)}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
          ) : (
            <p className="text-sm text-gray-600">
              {t("tourDetail.itinerary.missing")}
            </p>
          )}
        </div>
      </section>

      {/* Tur Kapsamı ve Hizmet Yaklaşımı (varsa) */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">{t("tourDetail.scope.title")}</h2>
          <div className="mb-5 rounded-2xl bg-gradient-to-r from-emerald-600/10 to-sky-500/10 border border-emerald-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 mb-1">
              {t("tourDetail.scope.premiumBadge")}
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">
              {t("tourDetail.scope.premiumDescription")}
            </p>
          </div>

          {((tour.notes && tour.notes.approach) || (!tour.notes && true)) && (
            <p className="text-sm text-gray-700 mb-4">
              {renderWithInclusionHighlight(
                tour.notes?.approach ||
                  tString(
                    "tourDetail.scope.approachFallback",
                    "Bu sayfadaki içerik, seçilen paket seviyesine göre uyarlanabilen bir tur akışını temsil eder. Net kapsam ve operasyon detayları rezervasyon öncesinde yazılı olarak paylaşılır.",
                  )
              , i18n.language)}
            </p>
          )}

          <div id="pricing-details" className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {(Array.isArray(tour.included) ? tour.included.length > 0 : true) && (
              <div className="rounded-2xl shadow-sm border border-emerald-300 p-5 bg-gradient-to-br from-emerald-600 to-emerald-500">
                <h3 className="text-lg font-semibold mb-3 text-white">{t("tourDetail.scope.includedTitle")}</h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-white/95">
                  {(Array.isArray(tour.included)
                    ? tour.included
                    : tArray("tourDetail.scope.fallbackIncluded", [
                        "Tur akışı ve operasyon planlaması",
                        "Programda belirtilen ana rota ve temel koordinasyon",
                        "Rezervasyon sürecinde yazılı olarak netleştirilen hizmet kapsamı",
                      ])
                  ).map((item, idx) => (
                    <li key={idx}>{renderWithInclusionHighlight(item, i18n.language)}</li>
                  ))}
                </ul>
              </div>
            )}
            {(Array.isArray(tour.notIncluded) ? tour.notIncluded.length > 0 : true) && (
              <div className="rounded-2xl shadow-sm border border-rose-300 p-5 bg-gradient-to-br from-rose-600 to-rose-500">
                <h3 className="text-lg font-semibold mb-3 text-white">{t("tourDetail.scope.notIncludedTitle")}</h3>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-white/95">
                  {(Array.isArray(tour.notIncluded)
                    ? tour.notIncluded
                    : tArray("tourDetail.scope.fallbackNotIncluded", [
                        "Kişisel harcamalar ve bireysel tercihler",
                        "Programda yer alsa bile seçime bağlı opsiyonel deneyimler",
                        "Resmi vergiler/harçlar (varsa) ve yurtdışı çıkış harcı",
                      ])
                  ).map((item, idx) => (
                    <li key={idx}>{renderWithInclusionHighlight(item, i18n.language)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {((tour.notes && (tour.notes.freeTime || tour.notes.discipline)) || !tour.notes) && (
            <div className="space-y-4">
              {(tour.notes?.freeTime || !tour.notes) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{t("tourDetail.scope.freeTimeTitle")}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {renderWithInclusionHighlight(
                      tour.notes?.freeTime ||
                        tString(
                          "tourDetail.scope.freeTimeFallback",
                          "Serbest zaman dilimleri, katılımcıların kendi ritmi ve tercihleriyle hareket edebilmesi için esnek bırakılır. Dilerseniz bu zamanlara opsiyonel aktiviteler eklenebilir.",
                        )
                    , i18n.language)}
                  </p>
                </div>
              )}
              {(tour.notes?.discipline || !tour.notes) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{t("tourDetail.scope.disciplineTitle")}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {renderWithInclusionHighlight(
                      tour.notes?.discipline ||
                        tString(
                          "tourDetail.scope.disciplineFallback",
                          "Programın sağlıklı ilerlemesi için zamanlamaya uyum ve grup düzenine saygı esastır. Güvenlik brifingleri ve rehber yönlendirmelerine uyulması beklenir.",
                        )
                    , i18n.language)}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

      {/* Önemli Açıklamalar & Uyarılar (açılır/kapanır) */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <button
          type="button"
          onClick={() => setShowImportantNotes((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm hover:bg-slate-50 transition-colors"
        >
          <div>
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-0.5">{t("tourDetail.importantNotes.title")}</h2>
            <p className="text-xs md:text-sm text-gray-600">
              {showImportantNotes
                ? t("tourDetail.importantNotes.subtitle.open")
                : t("tourDetail.importantNotes.subtitle.closed")}
            </p>
          </div>
          <span className="text-lg md:text-xl text-slate-500">
            {showImportantNotes ? "−" : "+"}
          </span>
        </button>

        {showImportantNotes && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {t("tourDetail.importantNotes.lead")}
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-800 leading-relaxed">
              {importantNotesItemKeys.slice(0, 3).map((k) => (
                <li key={k}>
                  <Trans
                    i18nKey={`tourDetail.importantNotes.items.${k}`}
                    components={importantNotesComponentsDefault}
                  />
                </li>
              ))}

              <li>
                {t("tourDetail.importantNotes.flightPolicy", { flightLimit: flightLimitPerPersonUsdRounded })}
              </li>

              {importantNotesItemKeys.slice(3).map((k) => (
                <li key={k}>
                  <Trans
                    i18nKey={`tourDetail.importantNotes.items.${k}`}
                    components={importantNotesComponentsDefault}
                  />
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* Güven Bloğu ve Kısa Yorumlar */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 bg-gradient-to-br from-emerald-600/10 to-sky-500/10 border border-emerald-100 rounded-2xl p-5">
            <h2 className="text-lg md:text-xl font-bold mb-3 text-gray-900">{t("tourDetail.trust.title")}</h2>
            <ul className="space-y-2 text-sm text-gray-800">
              {tArray("tourDetail.trust.bullets", [
                "Endonezya'da yaşayan ve bölgeyi yakından tanıyan yerel operasyon ekibi",
                "Sürpriz masraf yerine; fiyata dahil olan ve olmayan hizmetlerin şeffaf şekilde belirtilmesi",
                "Deneyim odaklı, gün boyu dolu programlar ve bilinçli bırakılan serbest zamanlar",
                "Küçük grup veya butik yaklaşım ile daha sakin ve kişisel bir tatil deneyimi",
              ]).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between">
              <p className="text-sm text-gray-800 mb-3">
                {t("tourDetail.trust.testimonials.1.text")}
              </p>
              <div className="text-xs text-gray-600">
                <p className="font-semibold">{t("tourDetail.trust.testimonials.1.person")}</p>
                <p>{t("tourDetail.trust.testimonials.1.meta")}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between">
              <p className="text-sm text-gray-800 mb-3">
                {t("tourDetail.trust.testimonials.2.text")}
              </p>
              <div className="text-xs text-gray-600">
                <p className="font-semibold">{t("tourDetail.trust.testimonials.2.person")}</p>
                <p>{t("tourDetail.trust.testimonials.2.meta")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ada hakkında */}
      {tour.about && (
        <section className="bg-white/80 py-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">{t("tourDetail.about.title")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-sky-700">{t("tourDetail.about.nature")}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{tour.about.nature}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-sky-700">{t("tourDetail.about.culture")}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{tour.about.culture}</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2 text-sky-700">{t("tourDetail.about.lifestyle")}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{tour.about.lifestyle}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Rotalar & Ziyaret Noktaları */}
      <section className="py-16 bg-gradient-to-r from-sky-50 via-white to-emerald-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">{t("tourDetail.routes.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.isArray(tour.routes) && tour.routes.length > 0 ? (
              tour.routes.map((route) => (
                <div
                  key={route.name}
                  className="bg-white rounded-2xl shadow p-4 flex items-start gap-3"
                >
                  <div className="mt-1 text-sky-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">{route.name}</h3>
                    <p className="text-xs md:text-sm text-gray-700">{route.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600 col-span-full">
                {t("tourDetail.routes.missing")}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Galeri */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">{t("tourDetail.gallery.title")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {resolvedGalleryImages.map((image, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                }}
                className="relative h-56 rounded-2xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-white"
              >
                <img
                  src={image || "/placeholder.svg"}
                  alt={`${displayTour?.name || tour.name} ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sayfa altı fiyat özeti */}
      {startingPrice && (
        <section className="max-w-6xl mx-auto px-4 mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
	        {t("tourDetail.priceSummary.title")}
              </p>
              <p className="text-sm text-gray-700">
                {t("tourDetail.priceSummary.description")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-0.5">{t("tourDetail.priceSummary.perPersonLabel")}</p>
              <p className="text-xl font-bold text-slate-900">
                ${startingPrice}
                <span className="ml-1 text-[11px] font-normal align-middle text-slate-600">
	          {flightInclusionShortNote}
                </span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Alt CTA kutusu */}
      <section className="max-w-6xl mx-auto px-4 mb-10">
        <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-emerald-500 text-white px-5 py-6 md:px-8 md:py-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-lg md:text-xl font-bold mb-1">{t("tourDetail.ctaBottom.title")}</h2>
            <p className="text-xs md:text-sm text-white/90">
              {t("tourDetail.ctaBottom.description")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setShowPlannedForm(true);
                setShowGroupForm(false);
                setShowDepositForm(false);
              }}
              className="px-4 py-2 rounded-full bg-white text-sky-700 text-xs md:text-sm font-semibold shadow hover:bg-slate-100 transition-colors"
            >
              {t("tourDetail.ctaBottom.actions.preRegister")}
            </button>
            <button
              type="button"
              onClick={() => {
                const text = t("tourDetail.ctaBottom.actions.whatsappMessage", {
                  tourName: displayTour?.name || tour.name,
                });
                const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
                openWhatsApp(url);
              }}
              className="px-4 py-2 rounded-full border border-white/80 text-white text-xs md:text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              {t("tourDetail.ctaBottom.actions.askWhatsapp")}
            </button>
          </div>
        </div>
      </section>

      {lightboxOpen && (
        <ImageLightbox
          images={resolvedGalleryImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* CTA ve buton altı açılan formlar */}

      {/* Geri Dön Linki */}
      <section className="max-w-6xl mx-auto px-4 py-10 flex justify-between items-center text-sm text-gray-600">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900"
        >
          <span>←</span>
          <span>{t("tourDetail.footerNav.back")}</span>
        </button>
        <button
          onClick={() => navigate("/tours")}
          className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900"
        >
          <span>{t("tourDetail.footerNav.allTours")}</span>
          <span>→</span>
        </button>
      </section>

      <Footer />
    </div>
  );
}
