import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { getWhatsAppNumber, openWhatsApp } from "../utils/whatsapp";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { useTranslation } from "react-i18next";

// Uçak bileti fiyatları çok değişken olduğu için kullanıcıya net fiyat sunabilmek adına
// tüm turlarda kişi başı aynı limit kullanılır.
const DEFAULT_FLIGHT_INCLUDED_LIMIT_USD = 750;

// Admin paneli tarafından da kullanılan temel tur listesi
// Next.js projesindeki "ada" bazlı turları referans alır
export const TOURS_CONFIG = [
	{
		id: "bali",
		name: "Bali Adası",
		description:
			"Tropik cennet Bali, muhteşem plajları, mistik tapınakları, yeşil pirinç terasları ve misafirperver halkıyla sizi büyüleyecek. Bu rota; body rafting, tam gün tekne turu gibi özenle seçilmiş deneyimlerin dahil olduğu, sürpriz maliyetleri en aza indiren, premium bir tatil paketi olarak tasarlandı.",
		duration: "6 Gece 7 Gün",
		concept:
			`Uçak bileti kişi başı $${DEFAULT_FLIGHT_INCLUDED_LIMIT_USD}’a kadar pakete dahildir. Uçuş fiyatları çok değişken olduğu için bu limit sabitlenmiştir; limit üzeri fark katılımcı tarafından ödenir.`,
		suitableFor: [
			"Balayı",
			"Lüks & Dinlenme",
			"Deniz & Plaj Tatili",
			"Yoga & Wellness",
			"Adrenalin",
			"Macera",
			"Doğa",
		],
		includes: [
			"İstanbul çıkışlı gidiş-dönüş uçak bileti",
			"Ubud ve sahil bölgesinde 6 gece konaklama",
			"Her gün otelde sabah kahvaltısı",
			"Programdaki seçili rehberli günler ve transferler",
		],
		dateRange: "Planlanan tarih: 28 Mart - 3 Nisan (7 gün / 6 gece)",
		price: 3699,
		discountPercent: 25,
		image: "/bali-island-tropical-beach-temple.jpg",
	},
	{
		id: "lombok",
		name: "Lombok Adası",
		description:
			"Bali'nin sakin kız kardeşi Lombok, el değmemiş plajları ve Rinjani Yanardağı ile macera severleri bekliyor.",
		duration: "6 Gece 7 Gün",
		concept: "Doğa & Plaj",
		suitableFor: ["Doğa & Macera", "Deniz & Plaj Tatili", "Sörf", "Adrenalin", "Su Sporları", "Lüks & Dinlenme"],
		includes: [
			"İstanbul çıkışlı gidiş-dönüş uçak bileti",
			"Gili ve sahil bölgesinde 6 gece konaklama",
			"Her gün otelde sabah kahvaltısı",
			"Programdaki seçili rehberli günler ve transferler",
		],
		dateRange: "Sezonluk dönemlerde",
		price: 3299,
		image: "/lombok-island-beach-waterfall.jpg",
	},
	{
		id: "java",
		name: "Java Adası",
		description:
			"Java'yı klasik bir şehir turu gibi değil; Jakarta'dan başlayıp Bandung'un yaylalarına, Pangandaran'ın nehir & doğa rotalarına ve Yogyakarta'nın UNESCO tapınaklarına uzanan konforlu bir road trip olarak yaşayın.",
		duration: "10 Gece 11 Gün",
		concept: "Road Trip & Şehirler (Premium)",
		suitableFor: ["Road Trip", "Kültürel Keşif", "Doğa & Macera", "Fotoğrafçılık", "Şehir Turu"],
		includes: [
			"Jakarta, Bandung, Pangandaran ve Yogyakarta konaklamaları",
			"Rota içi transferler (tren/araç) ve operasyon koordinasyonu",
			"Programdaki rehberli günler ve transferler",
			"Planlama ve rezervasyon öncesi yazılı bilgilendirme",
		],
		dateRange: "Belirli dönemlerde sınırlı kontenjanla",
		price: 3199,
		packages: [
			{
				id: "java-premium",
				level: "premium",
				name: "Premium Paket",
				priceMultiplier: 1,
			},
		],
		image: "/java-borobudur-temple-volcano-sunrise.jpg",
	},
	{
		id: "sumatra",
		name: "Sumatra Adası",
		description:
			"Vahşi Sumatra, yağmur ormanları, orangutanlar ve etkileyici Toba Gölü ile eşsiz bir doğa deneyimi sunuyor.",
		duration: "8 Gece 9 Gün",
		concept: "Doğa & Macera",
		suitableFor: ["Doğa & Macera", "Kültürel Keşif", "Yaban Hayatı"],
		includes: [
			"Medan, Bukit Lawang ve Samosir (Lake Toba) konaklamaları",
			"Rota içi özel araç transferleri + feribot geçişleri",
			"Her gün otelde sabah kahvaltısı",
			"Programdaki rehberli günler ve seçili aktiviteler",
		],
		dateRange: "Belirli dönemlerde sınırlı kontenjanla",
		price: 3499,
		image: "/sumatra-rainforest-orangutan-lake-toba.jpg",
		},
		{
		id: "komodo",
		name: "Komodo Adası",
		description:
			"UNESCO Dünya Mirası Komodo Ulusal Parkı, Komodo ejderleri, pembe kumsallar ve turkuaz koylarıyla vahşi doğa ve tekne turu deneyimini bir arada sunar.",
		duration: "6 Gece 7 Gün",
		concept: "Doğa & Plaj",
			suitableFor: ["Tekne Turu", "Doğa & Macera", "Şnorkel", "Fotoğrafçılık", "Deniz & Plaj Tatili", "Adrenalin"],
		includes: [
			"İstanbul çıkışlı gidiş-dönüş uçak bileti",
				"Labuan Bajo konaklamaları + her gün otelde sabah kahvaltısı",
				"Programdaki tekne günleri ve rehberli trekking rotaları (pakete göre)",
				"Rota içi transferler (havalimanı/otel/liman) ve operasyon koordinasyonu",
		],
		dateRange: "Belirli sezonlarda, sınırlı tekne kontenjanı ile",
		price: 3899,
			packages: [
				{
					id: "komodo-premium",
					level: "premium",
					name: "Premium Paket",
					priceMultiplier: 1,
				},
			],
		image:
			"https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=1200",
	},
	{
		id: "sulawesi",
		name: "Sulawesi Adası",
		description:
			"Makassar'ın tropik sahil ritminden başlayıp Manado ve Bunaken'in su altı dünyasına uzanan; Tangkoko yağmur ormanı ve Tomohon'un volkanik manzaralarıyla güçlenen, finalde Jakarta ile metropol dokunuşu ekleyen uçuş ağırlıklı keşif rotası.",
		duration: "8 Gece 9 Gün",
		concept: "Deniz • Doğa • Dalış • Tropik Şehir",
		suitableFor: [
			"Deniz & Şnorkel",
			"Dalış (isteğe bağlı)",
			"Doğa & Vahşi Yaşam",
			"Fotoğrafçılık",
			"Şehir & Kafe Kültürü",
			"Macera",
		],
		includes: [
			"Makassar (2 gece) + Manado (5 gece) + Jakarta (1 gece) toplam 8 gece konaklama",
			"Makassar → Manado ve Manado → Jakarta iç hat uçuşları (pakete dahildir)",
			"Havalimanı transferleri + rota içi operasyon koordinasyonu",
			"7/24 Türkçe destek ve yerel ekip (rehberli günler pakete göre)",
		],
		dateRange: "Özel tarihler ve resmi tatillere göre planlanır",
		price: 4199,
		packages: [
			{
				id: "sulawesi-premium",
				level: "premium",
				name: "Premium Paket",
				priceMultiplier: 1,
			},
		],
		image: "/20160724_101830.jpg",
	},
];

const WHATSAPP_NUMBER = getWhatsAppNumber();
// Tur sayfası BİREYSEL (planned) formlar için özel EmailJS yapılandırması
const EMAILJS_TOURS_SERVICE_ID = "service_a4cvjdi";
const EMAILJS_TOURS_TEMPLATE_ID_PLANNED = "template_vrs7wm9";
const EMAILJS_TOURS_PUBLIC_KEY = "ztyFnl3RMNaTFeReI";

export default function Tours() {
	const { t, i18n } = useTranslation();
	const currentLang = (i18n.language || "tr").split("-")[0];

	const tString = (key, fallback, options) => {
		const value = t(key, options);
		if (!value || value === key) return fallback;
		return value;
	};

	const tArray = (key, fallback, options) => {
		const value = t(key, { ...(options || {}), returnObjects: true });
		return Array.isArray(value) ? value : fallback;
	};

	const [tours, setTours] = useState(TOURS_CONFIG);
	const [tourOverrides, setTourOverrides] = useState({});
	const [imageUrls, setImageUrls] = useState({});
	const DEFAULT_YOUTUBE_SHORTS = [
		"https://youtube.com/shorts/vWmWhptuxO4?si=0J9sYR6GEoeteCtd",
		"https://youtube.com/shorts/uA76Odj1Krw?si=Q4B4f8U7E8EoijcC",
		"https://youtube.com/shorts/nfxlrWqq5HI?si=sM09lqmFWjJmuP6E",
		"https://youtube.com/shorts/LNOCVMd2Ndc?si=QgMChHopi8BvN2Ne",
	];
	const [youtubeShortUrls, setYoutubeShortUrls] = useState(DEFAULT_YOUTUBE_SHORTS);
	const [activeShortIndex, setActiveShortIndex] = useState(null);
	const shortCardRefs = useRef([]);
	const [openPreRegId, setOpenPreRegId] = useState(null);
	const [isTourPickerOpen, setIsTourPickerOpen] = useState(false);
	const activeTour = openPreRegId ? tours.find((t) => t.id === openPreRegId) : null;

	// Firestore'dan tur tarih/fiyat/promo override'larını yükle
	useEffect(() => {
		const fetchTours = async () => {
			try {
				const snapshot = await getDocs(collection(db, "tours"));
				const overrides = {};
				snapshot.forEach((docSnap) => {
					overrides[docSnap.id] = docSnap.data();
				});
				setTourOverrides(overrides);

				const formatDurationFromDaysNights = (days, nights) => {
					const d = Number(days);
					const n = Number(nights);
					if (!Number.isFinite(d) || !Number.isFinite(n) || d <= 0) return "";
					return `${n} Gece ${d} Gün`;
				};

				const extractDaysNightsFromText = (text) => {
					if (!text || typeof text !== "string") return null;
					// ör: "(7 gün / 6 gece)" veya "(6 gece / 7 gün)"
					const m1 = text.match(/(\d+)\s*g[uü]n\s*\/\s*(\d+)\s*gece/i);
					if (m1) return { days: Number(m1[1]), nights: Number(m1[2]) };
					const m2 = text.match(/(\d+)\s*gece\s*\/\s*(\d+)\s*g[uü]n/i);
					if (m2) return { nights: Number(m2[1]), days: Number(m2[2]) };
					return null;
				};

				const parseDateFlexible = (input) => {
					if (!input) return null;
					let s = input.toString().trim();
					// "Planlanan tarih:" gibi prefix'leri, parantez içlerini ve gereksiz karakterleri temizle
					s = s.replace(/\(.*?\)/g, " ");
					s = s.replace(/planlanan\s*tarih\s*:\s*/i, "");
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

					// Yaygın format: "12-19 Mart" veya "12–19 Mart 2026"
					let m = cleaned.match(
						/(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([a-zA-ZğüşöçıİĞÜŞÖÇ]+)\s*(\d{4})?/i,
					);
					if (m) {
						const d1 = Number(m[1]);
						const d2 = Number(m[2]);
						const monthName = m[3];
						const year = m[4] ? Number(m[4]) : new Date().getFullYear();
						const start = parseDateFlexible(`${d1} ${monthName} ${year}`);
						const end = parseDateFlexible(`${d2} ${monthName} ${year}`);
						return start && end ? { start, end } : null;
					}

					// Format: "28 Mart - 3 Nisan" / "28 Mart – 3 Nisan 2026"
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

					// Fallback: "to" / "–" / "—" / " - " ayracıyla iki parçaya böl
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

				const isReasonableDate = (d) => {
					return d instanceof Date && !isNaN(d) && d.getFullYear && d.getFullYear() >= 2000 && d.getFullYear() <= 2100;
				};

				// Tarih bilgisini de temel listeye yansıt
				setTours((prev) =>
					prev.map((tour) => {
						const o = overrides[tour.id] || {};
						// Eğer admin panelinden startDate / endDate geliyorsa, okunabilir dateRange hazırla
						let dateRange = o.dateRange || tour.dateRange || "";
						let computedDuration = "";
						// Desteklenen farklı admin alan adları için esnek start/end okuma
						const possibleStart =
							o.startDate ||
							o.start_date ||
							o.dateStart ||
							o.date_start ||
							o.start ||
							o.sDate ||
							o.s_date ||
							o.startAt ||
							o.start_at ||
							(o.dates && (o.dates.start || o.dates.startDate || o.dates.dateStart)) ||
							null;
						const possibleEnd =
							o.endDate ||
							o.end_date ||
							o.dateEnd ||
							o.date_end ||
							o.end ||
							o.eDate ||
							o.e_date ||
							o.endAt ||
							o.end_at ||
							(o.dates && (o.dates.end || o.dates.endDate || o.dates.dateEnd)) ||
							null;
						if (possibleStart && possibleEnd) {
							try {
								const sRaw = possibleStart;
								const eRaw = possibleEnd;
								const s = typeof sRaw?.toDate === "function" ? sRaw.toDate() : new Date(sRaw);
								const e = typeof eRaw?.toDate === "function" ? eRaw.toDate() : new Date(eRaw);
								if (!isNaN(s) && !isNaN(e)) {
									const msPerDay = 1000 * 60 * 60 * 24;
									const days = Math.round((e - s) / msPerDay) + 1;
									const nights = Math.max(0, days - 1);
									// dateRange metni admin tarafından verilmişse (ör. bayram dönemi notu), onu koru.
									// Yoksa sadece okunabilir tarih aralığı üret.
									if (!o.dateRange) {
										const fmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
										const startFmt = fmt.format(s);
										const endFmt = fmt.format(e);
										dateRange = `${startFmt} - ${endFmt}`;
									}
									computedDuration = formatDurationFromDaysNights(days, nights);
								}
							} catch (err) {
								// parsing hatası olursa mevcut dateRange bırakılır
							}
						} else if (o.dateRange && typeof o.dateRange === "string") {
							// Admin dateRange string'i içinden önce (x gün / y gece) yakala; yoksa start-end tarihlerini parse et
							const extracted = extractDaysNightsFromText(o.dateRange);
							if (extracted?.days && extracted?.nights >= 0) {
								computedDuration = formatDurationFromDaysNights(extracted.days, extracted.nights);
							} else {
								try {
									const range = parseDateRangeText(o.dateRange);
									if (range?.start && range?.end && isReasonableDate(range.start) && isReasonableDate(range.end)) {
										const s = range.start;
										const e = range.end;
										const msPerDay = 1000 * 60 * 60 * 24;
										const days = Math.round((e - s) / msPerDay) + 1;
										if (days > 0 && days < 1000) {
											const nights = Math.max(0, days - 1);
											computedDuration = formatDurationFromDaysNights(days, nights);
										}
									}
								} catch (err) {
									// ignore
								}
							}
						}
						return {
							...tour,
							dateRange,
							duration: computedDuration || tour.duration,
						};
					}),
				);
			} catch (error) {
				console.error("Tur ayarları yüklenirken hata:", error);
			}
		};

		fetchTours();
	}, []);

	const normalizePlannedDateRangeLabel = (text) => {
		if (!text || typeof text !== "string") return "";
		return text
			.replace(/^\s*planlanan\s*tarih\s*:\s*/i, "")
			.replace(/^\s*planlanan\s*tur\s*tarihleri\s*:\s*/i, "")
			.trim();
	};

	// Firestore + localStorage'dan görsel URL'lerini yükle
	useEffect(() => {
		try {
			const saved = localStorage.getItem("imageUrls");
			if (saved) {
				setImageUrls(JSON.parse(saved));
			}
		} catch (e) {
			console.error("imageUrls localStorage okuma hatası:", e);
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
							console.error("imageUrls localStorage yazma hatası:", e);
						}
						return merged;
					});
				}
			} catch (error) {
				console.error("Firestore imageUrls yüklenirken hata:", error);
			}
		};

		fetchImageUrls();
	}, []);

	// Firestore + localStorage'dan YouTube Shorts URL'lerini yükle
	useEffect(() => {
		try {
			const saved = localStorage.getItem("youtubeShortUrls");
			if (saved) {
				const parsed = JSON.parse(saved);
				if (Array.isArray(parsed) && parsed.length > 0) {
					setYoutubeShortUrls((prev) => {
						const next = [...prev];
						for (let i = 0; i < Math.min(4, parsed.length); i += 1) {
							if (typeof parsed[i] === "string" && parsed[i].trim()) next[i] = parsed[i].trim();
						}
						return next;
					});
				}
			}
		} catch (e) {
			console.error("youtubeShortUrls localStorage okuma hatası:", e);
		}

		const fetchShorts = async () => {
			try {
				const snap = await getDoc(doc(db, "siteSettings", "youtubeShorts"));
				if (snap.exists()) {
					const data = snap.data() || {};
					const urls = Array.isArray(data.urls) ? data.urls : [];
					if (urls.length > 0) {
						setYoutubeShortUrls((prev) => {
							const next = [...prev];
							for (let i = 0; i < Math.min(4, urls.length); i += 1) {
								if (typeof urls[i] === "string" && urls[i].trim()) next[i] = urls[i].trim();
							}
							try {
								localStorage.setItem("youtubeShortUrls", JSON.stringify(next));
							} catch (e) {
								console.error("youtubeShortUrls localStorage yazma hatası:", e);
							}
							return next;
						});
					}
				}
			} catch (error) {
				console.error("Firestore youtubeShorts yüklenirken hata:", error);
			}
		};

		fetchShorts();
	}, []);

	// Aktif Shorts videosu ekrandan çıkınca otomatik kapat
	useEffect(() => {
		if (activeShortIndex === null || activeShortIndex === undefined) return;
		const el = shortCardRefs.current?.[activeShortIndex];
		if (!el) return;
		if (typeof IntersectionObserver === "undefined") return;

		let closed = false;
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry) return;
				// Kart görünürlük oranı düşükse kapat (küçük scroll jitter'ında kapanmaması için eşik)
				if (!closed && entry.intersectionRatio < 0.15) {
					closed = true;
					setActiveShortIndex(null);
				}
			},
			{ threshold: [0, 0.15, 0.25, 0.5, 1] },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [activeShortIndex]);

	const toYouTubeEmbedUrl = (inputUrl) => {
		if (!inputUrl || typeof inputUrl !== "string") return "";
		const raw = inputUrl.trim();
		if (!raw) return "";
		try {
			const url = new URL(raw);
			const host = url.hostname.replace(/^www\./, "").toLowerCase();
			let videoId = "";
			if (host === "youtube.com" || host === "m.youtube.com") {
				// /shorts/{id}
				const shortsMatch = url.pathname.match(/^\/shorts\/([^/?#]+)/i);
				if (shortsMatch) videoId = shortsMatch[1];
				// /watch?v={id}
				if (!videoId) {
					const v = url.searchParams.get("v");
					if (v) videoId = v;
				}
			} else if (host === "youtu.be") {
				videoId = url.pathname.replace(/^\//, "").split("/")[0] || "";
			}
			if (!videoId) return "";
			const embed = new URL(`https://www.youtube.com/embed/${videoId}`);
			embed.searchParams.set("rel", "0");
			embed.searchParams.set("modestbranding", "1");
			embed.searchParams.set("playsinline", "1");
			return embed.toString();
		} catch {
			return "";
		}
	};

	const getYouTubeVideoId = (inputUrl) => {
		if (!inputUrl || typeof inputUrl !== "string") return "";
		const raw = inputUrl.trim();
		if (!raw) return "";
		try {
			const url = new URL(raw);
			const host = url.hostname.replace(/^www\./, "").toLowerCase();
			let videoId = "";
			if (host === "youtube.com" || host === "m.youtube.com") {
				const shortsMatch = url.pathname.match(/^\/shorts\/([^/?#]+)/i);
				if (shortsMatch) videoId = shortsMatch[1];
				if (!videoId) {
					const v = url.searchParams.get("v");
					if (v) videoId = v;
				}
			} else if (host === "youtu.be") {
				videoId = url.pathname.replace(/^\//, "").split("/")[0] || "";
			}
			return videoId;
		} catch {
			return "";
		}
	};

	const handleInlinePreRegSubmit = (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		const data = Object.fromEntries(formData.entries());

		const tourId = e.target.getAttribute("data-tour-id");
		const tour = tours.find((t) => t.id === tourId);

		const whatsappText =
			`${t('tours.whatsapp.preRegRequestTitle')}\n\n` +
			`${t('tours.whatsapp.labels.tour')}: ${tour ? `${tour.name} (${tour.duration})` : data.tour}\n` +
			`${t('tours.whatsapp.labels.fullName')}: ${data.name}\n` +
			`${t('tours.whatsapp.labels.email')}: ${data.email}\n` +
			`${t('tours.whatsapp.labels.phone')}: ${data.phone}\n` +
			`${t('tours.whatsapp.labels.participationType')}: ${data.participation || "-"}\n` +
			`${t('tours.whatsapp.labels.requestedTour')}: ${data.tour || "-"}\n` +
			`${t('tours.whatsapp.labels.peopleCount')}: ${data.people || "-"}\n` +
			`${t('tours.whatsapp.labels.notes')}: ${data.notes || "-"}`;

		if (WHATSAPP_NUMBER) {
			const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;
			openWhatsApp(url);
		} else {
			console.warn(t('tours.whatsapp.missingNumberWarn'));
		}

		if (EMAILJS_TOURS_SERVICE_ID && EMAILJS_TOURS_TEMPLATE_ID_PLANNED && EMAILJS_TOURS_PUBLIC_KEY) {
			emailjs
				.send(
					EMAILJS_TOURS_SERVICE_ID,
					EMAILJS_TOURS_TEMPLATE_ID_PLANNED,
					{
						tour_name: tour ? tour.name : data.tour,
						tour_duration: tour ? tour.duration : "",
						name: data.name,
						email: data.email,
						phone: data.phone,
						participation: data.participation || "liste-sayfasi",
						tour: data.tour,
						people: data.people,
						notes: data.notes,
					},
					EMAILJS_TOURS_PUBLIC_KEY,
				)
				.then(
					() => {
						console.log("EmailJS inline planned form başarıyla gönderildi");
					},
					(error) => {
						console.error("EmailJS inline planned form hata:", error);
					},
				);
		} else {
		}

		e.target.reset();
		setOpenPreRegId(null);
	};

	// Title/description yönetimi TitleManager tarafından yapılır.

	const scrollToToursList = () => {
		if (typeof document === "undefined") return;
		const el = document.getElementById("tours-list");
		if (!el) return;
		el.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const openToursWhatsApp = () => {
		const text = `${t('tours.whatsapp.quickInfoGreeting')}\n${t('tours.whatsapp.quickInfoQuestion')}`;
		const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
		openWhatsApp(url);
	};

	const openTourPicker = () => {
		setIsTourPickerOpen(true);
	};

	const closeTourPicker = () => {
		setIsTourPickerOpen(false);
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-sky-50/40 overflow-x-hidden pb-24 md:pb-0">
			<Navigation />

			{/* Hero + sekmeler */}
			<section className="pt-24 pb-8 px-4 text-center max-w-5xl mx-auto">
				<h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
					{t('tours.ui.heroTitle')}
				</h1>

				<div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
					<div className="relative w-full sm:w-auto">
						<span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-[10px] font-semibold text-gray-900 shadow-sm">
							{t('tours.ui.click')}
						</span>
						<button
							type="button"
							onClick={scrollToToursList}
							className="w-full sm:w-auto px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold bg-sky-600 text-white shadow-md hover:bg-sky-700 transition-colors cursor-pointer"
						>
							{t('tours.ui.personalToursCta')}
						</button>
					</div>
					<div className="relative w-full sm:w-auto">
						<span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-[10px] font-semibold text-gray-900 shadow-sm">
							{t('tours.ui.click')}
						</span>
						<Link
							to="/tours/groups"
							className="w-full sm:w-auto px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-semibold border border-sky-500 text-sky-700 bg-white shadow-sm hover:bg-sky-50 hover:border-sky-600 transition-colors cursor-pointer inline-flex items-center justify-center"
						>
							{t('tours.ui.groupToursCta')}
						</Link>
					</div>
				</div>

				<p className="text-sm md:text-base text-gray-700 max-w-3xl mx-auto">
					{t('tours.ui.heroDescription')}
				</p>
			</section>

			{/* Güven & süreç özeti */}
			<section className="px-4 max-w-6xl mx-auto pb-10">
				<div className="bg-white/70 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-4 md:p-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left">
							<p className="text-xs font-semibold text-slate-900 mb-1">{t('tours.ui.trust.transparentTitle')}</p>
							<p className="text-xs text-slate-700">
								{t('tours.ui.trust.transparentDesc')}
							</p>
						</div>
						<div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left">
							<p className="text-xs font-semibold text-slate-900 mb-1">{t('tours.ui.trust.confirmTitle')}</p>
							<p className="text-xs text-slate-700">
								{t('tours.ui.trust.confirmDesc')}
							</p>
						</div>
						<div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left">
							<p className="text-xs font-semibold text-slate-900 mb-1">{t('tours.ui.trust.fastContactTitle')}</p>
							<p className="text-xs text-slate-700">
								{t('tours.ui.trust.fastContactDesc')}
							</p>
						</div>
					</div>

					<div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3 text-left">
						<div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
							<p className="text-xs font-semibold text-emerald-900 mb-1">{t('tours.ui.steps.1.title')}</p>
							<p className="text-[11px] text-emerald-900/80">{t('tours.ui.steps.1.desc')}</p>
						</div>
						<div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
							<p className="text-xs font-semibold text-emerald-900 mb-1">{t('tours.ui.steps.2.title')}</p>
							<p className="text-[11px] text-emerald-900/80">{t('tours.ui.steps.2.desc')}</p>
						</div>
						<div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
							<p className="text-xs font-semibold text-emerald-900 mb-1">{t('tours.ui.steps.3.title')}</p>
							<p className="text-[11px] text-emerald-900/80">{t('tours.ui.steps.3.desc')}</p>
						</div>
						<div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
							<p className="text-xs font-semibold text-emerald-900 mb-1">{t('tours.ui.steps.4.title')}</p>
							<p className="text-[11px] text-emerald-900/80">{t('tours.ui.steps.4.desc')}</p>
						</div>
					</div>
				</div>
			</section>

			{/* Tur kartları */}
			<section id="tours-list" className="pb-16 px-4 max-w-6xl mx-auto scroll-mt-28">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{tours.map((tour) => {
						const localizedTour = {
							...tour,
							name: tString(`tours.data.${tour.id}.name`, tour.name),
							description: tString(`tours.data.${tour.id}.description`, tour.description),
							duration: tString(`tours.data.${tour.id}.duration`, tour.duration),
							concept: tString(`tours.data.${tour.id}.concept`, tour.concept),
							suitableFor: tArray(`tours.data.${tour.id}.suitableFor`, tour.suitableFor),
							includes: tArray(`tours.data.${tour.id}.includes`, tour.includes),
							dateRange: tString(`tours.data.${tour.id}.dateRange`, tour.dateRange),
						};

						const formatUSD = (value) => {
							if (typeof value !== "number" || !isFinite(value)) return "";
							return `$${Math.round(value)}`;
						};

						const normalizeUsdNumber = (value) => {
							if (value === undefined || value === null || value === "") return null;
							if (typeof value === "number" && isFinite(value)) return value;
							if (typeof value === "string") {
								const n = Number(value.replace(/[^0-9.]/g, ""));
								return isFinite(n) && n > 0 ? n : null;
							}
							return null;
						};

						const override = tourOverrides[tour.id] || {};
						const flightLimitUsd = DEFAULT_FLIGHT_INCLUDED_LIMIT_USD;
						const flightNoteShort = t('tours.ui.flightNoteShort', { limit: formatUSD(flightLimitUsd) });
						const flightNoteReason = t('tours.ui.flightNoteReason');

						const basePriceRaw =
							override.price !== undefined && override.price !== null && override.price !== ""
								? override.price
								: tour.price;
						const normalizedBasePrice =
							typeof basePriceRaw === "string"
								? basePriceRaw.replace(/[^0-9]/g, "")
								: basePriceRaw;
						const basePrice = normalizedBasePrice ? Number(normalizedBasePrice) : null;
						const discountPercentRaw =
							override.discountPercent !== undefined && override.discountPercent !== null
								? override.discountPercent
								: tour.discountPercent ?? 0;
						const discountPercent = Number(discountPercentRaw) || 0;
						// Fiyat kutusunda her zaman temel/en ucuz paket baz alınsın.
						const sourcePackages =
							override.packages && Array.isArray(override.packages) && override.packages.length > 0
								? override.packages
								: tour.packages && Array.isArray(tour.packages) && tour.packages.length > 0
								? tour.packages
								: null;

						let cheapestMultiplier = tour.id === "java" || tour.id === "komodo" || tour.id === "sulawesi" ? 1 : 0.7; // Premium kart: Java/Komodo/Sulawesi
						if (sourcePackages) {
							if (tour.id === "java" || tour.id === "komodo" || tour.id === "sulawesi") {
								const premiumPkg = sourcePackages.find((p) => {
									const level = (p?.level || "").toString().toLowerCase();
									const pid = (p?.id || "").toString().toLowerCase();
									return level === "premium" || pid.includes("premium");
								});
								const premiumMultiplier = premiumPkg && typeof premiumPkg.priceMultiplier === "number" ? premiumPkg.priceMultiplier : 1;
								cheapestMultiplier = premiumMultiplier > 0 ? premiumMultiplier : 1;
							} else {
								const multipliers = sourcePackages
									.map((p) => (typeof p?.priceMultiplier === "number" ? p.priceMultiplier : null))
									.filter((n) => typeof n === "number" && n > 0);
								if (multipliers.length > 0) {
									cheapestMultiplier = Math.min(...multipliers);
								}
							}
						}

						const pkgBasePrice = basePrice !== null ? Math.round(basePrice * cheapestMultiplier) : null;
						const hasDiscount = pkgBasePrice !== null && discountPercent > 0;
						const displayPrice = hasDiscount
							? Math.round(pkgBasePrice * (1 - discountPercent / 100))
							: pkgBasePrice;
						const promoLabel = override.promoLabel || "";
						const discountNote = hasDiscount
							? (() => {
								const promoText = promoLabel ? promoLabel.trim() : "";
								if (promoText) {
									const hasPercentInText = /%\s*\d+/.test(promoText);
									return hasPercentInText ? promoText : `${promoText} %${discountPercent}`;
								}
								return t('tours.ui.price.discountedSpecial', { percent: discountPercent });
							})()
							: t('tours.ui.price.currentPerPerson');

						const heroKey = `${tour.id}-tour-hero`;
						const heroImage =
							imageUrls[heroKey] || tour.image || "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg";

						const mobilePerks = tArray(`tours.data.${tour.id}.mobilePerks`, null) || (
							tour.id === "bali" || tour.id === "lombok"
								? [
									t('tours.ui.perks.hotel'),
									t('tours.ui.perks.breakfastTransfers'),
									t('tours.ui.perks.support'),
								]
								: tour.id === "sumatra"
									? [
										t('tours.ui.perks.roadTripNature'),
										t('tours.ui.perks.breakfastRouteTransfers'),
										t('tours.ui.perks.support'),
									]
									: tour.id === "java"
										? [
											t('tours.ui.perks.roadTripTrains'),
											t('tours.ui.perks.guidedAndFreeTime'),
											t('tours.ui.perks.support'),
										]
										: tour.id === "komodo"
											? [
												t('tours.ui.perks.boatFocus'),
												t('tours.ui.perks.opsSafety'),
												t('tours.ui.perks.support'),
											]
											: tour.id === "sulawesi"
												? [
													t('tours.ui.perks.flightHeavy'),
													t('tours.ui.perks.guidedAndFreeTime'),
													t('tours.ui.perks.support'),
												]
												: [t('tours.ui.perks.stayBreakfast'), t('tours.ui.perks.transfersCoord'), t('tours.ui.perks.supportShort')]
						);

						return (
							<article
								key={tour.id}
								className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300 h-full"
							>
								<Link
									to={`/tours/${tour.id}`}
									className="relative h-64 overflow-hidden block group"
								>
									<img
										src={heroImage}
										alt={localizedTour.name}
										className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
										loading="lazy"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />

									{(promoLabel || hasDiscount) && (
										<div className="absolute top-4 left-4 z-10 flex items-center gap-3">
											{promoLabel && (
												<div className="flex flex-col gap-1 max-w-xs">
													<span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/80 drop-shadow-md">
															{t('tours.ui.promoLabel')}
													</span>
													<span className="text-sm sm:text-base font-semibold leading-snug text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
														{promoLabel}
													</span>
													<span className="inline-flex w-fit text-[11px] font-semibold text-white bg-red-600/95 px-3 py-1 rounded-full drop-shadow-[0_3px_8px_rgba(0,0,0,0.7)] mt-1">
															{t('tours.ui.promoDontMiss')}
													</span>
												</div>
											)}
											{hasDiscount && (
												<div className="transform -rotate-12">
													<div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 text-white flex items-center justify-center text-lg font-extrabold shadow-[0_20px_40px_rgba(0,0,0,0.7)]">
														%{discountPercent}
													</div>
												</div>
											)}
										</div>
									)}

									<div className="absolute bottom-0 left-0 right-0 p-5 flex justify-between items-end gap-3 text-left">
										<div>
											<h2 className="text-2xl font-bold text-white mb-1">{localizedTour.name}</h2>
											<p className="text-xs text-white/90 line-clamp-2 md:line-clamp-3">{localizedTour.description}</p>
										</div>
									</div>
								</Link>

								<div className="p-5 space-y-4 flex-1 flex flex-col">
									<div className="flex flex-wrap gap-2">
										{localizedTour.suitableFor.map((tag) => (
											<span
												key={tag}
												className="px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100"
											>
												{tag}
											</span>
										))}
									</div>

									{/* Süre + ek avantajlar + fiyat bloğu */}
									<div className="mt-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 text-xs text-gray-700">
										<div className="sm:mr-2">
											<p>{localizedTour.duration}</p>
											<ul className="sm:hidden text-[11px] text-gray-600 mt-1 space-y-0.5">
												{mobilePerks.map((item) => (
													<li key={item} className="flex items-start gap-2">
														<span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
														<span className="leading-snug">{item}</span>
													</li>
												))}
											</ul>
											<div className="hidden sm:block text-[11px] text-gray-600 mt-0.5 space-y-0.5">
												{(() => {
													const fallbackDesktopPerks =
														tour.id === "bali" || tour.id === "lombok"
															? [
																t('tours.ui.perks.hotel'),
																t('tours.ui.perks.sharedRoom'),
																t('tours.ui.perks.breakfastHotels'),
																t('tours.ui.perks.airportHotelTransfers'),
																t('tours.ui.perks.supportFull'),
															]
														: tour.id === "sumatra"
															? [
																t('tours.ui.perks.roadTripFewStops'),
																t('tours.ui.perks.hotel34Boutique'),
																t('tours.ui.perks.sharedRoom'),
																t('tours.ui.perks.breakfastHotels'),
																t('tours.ui.perks.medanRouteTransfers'),
																t('tours.ui.perks.supportFull'),
															]
															: tour.id === "java"
																? [
																	t('tours.ui.perks.roadTripFewStops'),
																	t('tours.ui.perks.trainRoad'),
																	t('tours.ui.perks.guidedBalance'),
																	t('tours.ui.perks.opsCoordination'),
																	t('tours.ui.perks.supportFull'),
																]
																: tour.id === "komodo"
																	? [
																		t('tours.ui.perks.boatMaxSeaDays'),
																		t('tours.ui.perks.guidedBoatBalance'),
																		t('tours.ui.perks.parkOpsSafety'),
																		t('tours.ui.perks.opsCoordination'),
																		t('tours.ui.perks.supportFull'),
																	]
																	: tour.id === "sulawesi"
																		? [
																			t('tours.ui.perks.flightFlowNoLongRoad'),
																			t('tours.ui.perks.domesticFlights'),
																			t('tours.ui.perks.guidedBalanceLocations'),
																			t('tours.ui.perks.opsCoordination'),
																			t('tours.ui.perks.supportFull'),
																		]
																		: [t('tours.ui.perks.hotel34'), t('tours.ui.perks.privateBusTours'), t('tours.ui.perks.localGuide247')];

													const desktopPerks = tArray(`tours.data.${tour.id}.desktopPerks`, fallbackDesktopPerks);
													return desktopPerks.map((line) => <p key={line}>{line}</p>);
												})()}
											</div>
										</div>
										<div className="flex flex-col items-start sm:items-end w-full sm:w-[220px]">
											<div className="inline-block rounded-2xl bg-gradient-to-l from-emerald-600/90 to-emerald-500/80 px-3 py-2 text-right shadow-sm w-full min-h-[112px] flex flex-col justify-center">
												{pkgBasePrice ? (
													<>
														<div className="flex flex-col items-end">
															<p className={`text-sm font-semibold mb-0.5 ${hasDiscount ? "text-white line-through decoration-red-500 decoration-1" : "text-white/90"}`}>
																		{hasDiscount ? formatUSD(pkgBasePrice) : (tour.id === "java" || tour.id === "komodo" || tour.id === "sulawesi" ? t('tours.ui.price.premium') : t('tours.ui.price.total'))}
															</p>
														</div>
														<p className="text-xl font-bold text-white whitespace-nowrap leading-none">
															<span className="block">
																{hasDiscount ? (
																	<span className="inline-flex items-baseline gap-1">
																		<span className="text-[10px] font-semibold text-white/90 whitespace-nowrap">{t('tours.ui.price.discounted')}</span>
																		<span>{formatUSD(displayPrice)}</span>
																	</span>
																) : (
																formatUSD(displayPrice)
															)}
														</span>
														<span className="block text-[10px] font-normal text-white/90 leading-none">
																{flightNoteShort}
														</span>
														<span className="block text-[10px] font-normal text-white/85 leading-tight mt-0.5">
															{flightNoteReason}
														</span>
													</p>
																<p className="text-sm text-white/90 mt-0.5">
																	{tour.id === "java" || tour.id === "komodo" || tour.id === "sulawesi" ? t('tours.ui.price.premiumPackagePrice') : t('tours.ui.price.startingFrom')}
																</p>
													<p className="text-[11px] text-white/90">
														{discountNote}
													</p>
												</>
											) : (
												<p className="text-[11px] text-white/90">{t('tours.ui.price.comingSoon')}</p>
											)}
										</div>

									</div>
									</div>

									{/* Alt bilgi ve CTA bloğunu kartın altına sabitle */}
									<div className="mt-auto pt-3 space-y-3">
										<p className="text-[11px] text-gray-600">{t('tours.ui.notes.company')}</p>
										<p className="text-[11px] text-gray-600">{t('tours.ui.notes.paymentFlow')}</p>
										{localizedTour.dateRange && (
											<p className="text-xs text-gray-700 font-semibold">
												{t('tours.ui.plannedDatesLabel')}: {normalizePlannedDateRangeLabel(localizedTour.dateRange)}
											</p>
										)}

										{Array.isArray(localizedTour.includes) && localizedTour.includes.length > 0 && (
											<div className="text-xs text-gray-700">
												<p className="font-semibold mb-1">{t('tours.ui.includes.someIncluded')}</p>
												<ul className="space-y-0.5 sm:hidden">
													{localizedTour.includes.slice(0, 4).map((item) => (
														<li key={item} className="flex items-center gap-1.5">
															<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
															<span>{item}</span>
														</li>
													))}
												</ul>
												{localizedTour.includes.length > 4 && (
													<p className="sm:hidden mt-1 text-[11px] text-gray-500">
														{t('tours.ui.includes.moreItems', { count: localizedTour.includes.length - 4 })}
													</p>
												)}

												<div className="hidden sm:block">
													<ul className="space-y-0.5">
														{localizedTour.includes.map((item) => (
															<li key={item} className="flex items-center gap-1.5">
																<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
																<span>{item}</span>
														</li>
														))}
													</ul>

													{(() => {
														const fallbackNoteByTour = {
															bali: `Program kapsamındaki otel konaklamaları ve her gün sabah kahvaltısı fiyata dahildir; 2. ve 4. gün rehberli programlarda grup halinde öğle yemeği dahildir. Diğer öğünler ve otel dışındaki yiyecek-içecek harcamaları tura dahil değildir.`,
															lombok: `Lombok rotasında konaklamalar Gili ve sahil bölgelerinde planlanır; kahvaltılar fiyata dahil olup bölgesel transferler ve seçili doğa turları programa dahildir. Özel su sporu aktiviteleri ve bazı rehberli deneyimler paket kapsamında olmayabilir ve opsiyonel ek hizmet olarak sunulur.`,
															java: `Java turu road trip konseptindedir ve yalnızca Premium paket olarak planlanır. Rota içi transferler ve rehberli gün akışı paket kapsamında organize edilir; uçak bileti kişi başı ${formatUSD(DEFAULT_FLIGHT_INCLUDED_LIMIT_USD)}’a kadar dahildir (uçuş fiyatları değişken olduğu için limit sabitlenmiştir).`,
															komodo: `Komodo turu tekne odaklı bir ada keşfi konseptindedir. Tekne günleri, milli park operasyonu ve rehberli trekking akışı paket kapsamında organize edilir. Uçak bileti kişi başı ${formatUSD(DEFAULT_FLIGHT_INCLUDED_LIMIT_USD)}’a kadar dahildir (uçuş fiyatları değişken olduğu için limit sabitlenmiştir).`,
															sulawesi: `Sulawesi turu uçuş ağırlıklı bir akıştır; uzun ve yorucu kara yolu günleri planlanmaz. İç hat uçuşları ve rehberli gün akışı paket kapsamında organize edilir. Uçak bileti kişi başı ${formatUSD(DEFAULT_FLIGHT_INCLUDED_LIMIT_USD)}’a kadar dahildir (uçuş fiyatları değişken olduğu için limit sabitlenmiştir).`,
															sumatra: `Sumatra turu doğa & macera odaklı, road trip mantığında planlanır. Medan → Bukit Lawang → Samosir (Lake Toba) rotasında transferler ve rehberli gün akışı paket kapsamında organize edilir. Uçak bileti kişi başı ${formatUSD(DEFAULT_FLIGHT_INCLUDED_LIMIT_USD)}’a kadar dahildir (uçuş fiyatları değişken olduğu için limit sabitlenmiştir).`,
														};
														const fallbackNote = fallbackNoteByTour[tour.id];
														if (!fallbackNote) return null;
														const note = tString(`tours.data.${tour.id}.includesNote`, fallbackNote, {
															flightLimit: formatUSD(DEFAULT_FLIGHT_INCLUDED_LIMIT_USD),
														});
														return <p className="mt-1 text-[11px] text-gray-600">{note}</p>;
													})()}
												</div>
											</div>
										)}

										<div className="flex flex-col sm:flex-row sm:items-center gap-2">
											<button
												type="button"
												onClick={() => setOpenPreRegId(tour.id)}
												className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
											>
												{t('tours.ui.cta.preReg')}
											</button>
											<Link
												to={`/tours/${tour.id}`}
												className="text-xs md:text-sm font-semibold text-sky-700 hover:text-sky-800 underline-offset-2 hover:underline"
											>
												{t('tours.ui.cta.viewDetails')}
											</Link>
										</div>
									</div>

								</div>

							</article>
						);
					})}
				</div>
			</section>

			{/* Tur kartlarının altı: YouTube Shorts izleme alanı (2x2) */}
			<section className="pb-16 px-4 max-w-6xl mx-auto">
				<h2 className="text-lg md:text-xl font-bold mb-3 text-gray-900">{t('tours.ui.shorts.title')}</h2>
				<p className="text-xs md:text-sm text-gray-700 mb-4 max-w-3xl">
					{t('tours.ui.shorts.description')}
				</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{youtubeShortUrls.slice(0, 4).map((u, idx) => {
						const embedBaseUrl = toYouTubeEmbedUrl(u);
						const videoId = getYouTubeVideoId(u);
						const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "";
						const isActive = activeShortIndex === idx;
						const embedUrl = (() => {
							if (!embedBaseUrl) return "";
							try {
								const url = new URL(embedBaseUrl);
								url.searchParams.set("autoplay", "1");
								url.searchParams.set("mute", "1");
								return url.toString();
							} catch {
								return embedBaseUrl;
							}
						})();
						return (
							<div
								key={`${idx}-${u || "empty"}`}
								ref={(node) => {
									shortCardRefs.current[idx] = node;
								}}
								className="bg-white rounded-2xl shadow-md overflow-hidden"
							>
								<div className="relative w-full pt-[177.78%]">
									{embedBaseUrl ? (
										isActive ? (
											<>
												<button
													type="button"
													onClick={() => setActiveShortIndex(null)}
													className="absolute top-2 right-2 z-10 bg-black/60 text-white text-[11px] font-semibold px-3 py-1 rounded-full"
													aria-label={t('tours.ui.shorts.closeAria')}
												>
													{t('tours.ui.shorts.close')}
												</button>
												<iframe
													src={embedUrl}
													title={`YouTube Shorts ${idx + 1}`}
													className="absolute inset-0 w-full h-full"
													allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
													allowFullScreen
												/>
											</>
										) : (
											<button
												type="button"
												onClick={() => setActiveShortIndex(idx)}
												className="absolute inset-0 w-full h-full group"
												aria-label={t('tours.ui.shorts.playAria', { index: idx + 1 })}
											>
												{thumbnailUrl ? (
													<img
														src={thumbnailUrl}
														alt={t('tours.ui.shorts.thumbnailAlt', { index: idx + 1 })}
														className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
														loading="lazy"
													/>
												) : (
													<div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
														{t('tours.ui.shorts.noPreview')}
													</div>
												)}
												<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
												<div className="absolute inset-0 flex items-center justify-center">
													<span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/95 text-slate-900 text-2xl shadow-lg group-hover:scale-105 transition-transform">
														▶
													</span>
												</div>
												<p className="absolute bottom-2 left-3 right-3 text-[11px] text-white/90">
													{t('tours.ui.shorts.tapToPlay')}
												</p>
											</button>
										)
									) : (
										<div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
											{t('tours.ui.shorts.missingUrl')}
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</section>

			{/* Resmi metinler / doğrulanabilir güven unsurları */}
			<section className="max-w-6xl mx-auto px-4 mb-16">
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
						<div>
							<h2 className="text-lg md:text-xl font-bold text-gray-900">{t('tours.ui.legal.title')}</h2>
							<p className="text-xs md:text-sm text-gray-700 mt-1 max-w-3xl">
								{t('tours.ui.legal.description')}
							</p>
						</div>
						<button
							type="button"
							onClick={openToursWhatsApp}
							className="inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700"
						>
							{t('tours.ui.legal.whatsappCta')}
						</button>
					</div>

					<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
						<a
							href="/docs/on-kayit-bilgi-paketi.html"
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors p-4"
						>
							<p className="text-sm font-semibold text-slate-900">{t('tours.ui.legal.cards.preRegInfoPack.title')}</p>
							<p className="text-[11px] text-slate-600 mt-1">{t('tours.ui.legal.cards.preRegInfoPack.desc')}</p>
						</a>
						<a
							href="/docs/tur-brosurleri.html"
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors p-4"
						>
							<p className="text-sm font-semibold text-slate-900">{t('tours.ui.legal.cards.brochures.title')}</p>
							<p className="text-[11px] text-slate-600 mt-1">{t('tours.ui.legal.cards.brochures.desc')}</p>
						</a>
						<a
							href="/docs/kvkk-aydinlatma-metni.html"
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors p-4"
						>
							<p className="text-sm font-semibold text-slate-900">{t('tours.ui.legal.cards.kvkk.title')}</p>
							<p className="text-[11px] text-slate-600 mt-1">{t('tours.ui.legal.cards.kvkk.desc')}</p>
						</a>
						<a
							href="/docs/on-bilgilendirme-formu.html"
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors p-4"
						>
							<p className="text-sm font-semibold text-slate-900">{t('tours.ui.legal.cards.preInfo.title')}</p>
							<p className="text-[11px] text-slate-600 mt-1">{t('tours.ui.legal.cards.preInfo.desc')}</p>
						</a>
						<a
							href="/docs/paket-tur-sozlesmesi.html"
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors p-4"
						>
							<p className="text-sm font-semibold text-slate-900">{t('tours.ui.legal.cards.packageAgreement.title')}</p>
							<p className="text-[11px] text-slate-600 mt-1">{t('tours.ui.legal.cards.packageAgreement.desc')}</p>
						</a>
						<a
							href="/privacy"
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors p-4"
						>
							<p className="text-sm font-semibold text-slate-900">{t('tours.ui.legal.cards.privacy.title')}</p>
							<p className="text-[11px] text-slate-600 mt-1">{t('tours.ui.legal.cards.privacy.desc')}</p>
						</a>
					</div>

					<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
						<p className="text-[11px] md:text-xs text-amber-950/90">
							{t('tours.ui.preRegNote')}
						</p>
					</div>
				</div>
			</section>

			{/* SSS / itiraz karşılama */}
			<section className="max-w-6xl mx-auto px-4 mb-16">
				<h2 className="text-lg md:text-xl font-bold mb-3 text-gray-900">{t('tours.ui.faq.title')}</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<details className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
						<summary className="cursor-pointer list-none font-semibold text-sm text-slate-900 flex items-center justify-between">
							{t('tours.ui.faq.q1.question')}
							<span className="ml-3 text-slate-400 group-open:rotate-180 transition-transform">⌄</span>
						</summary>
						<p className="mt-2 text-xs text-slate-700">
							{t('tours.ui.faq.q1.answer')}
						</p>
					</details>
					<details className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
						<summary className="cursor-pointer list-none font-semibold text-sm text-slate-900 flex items-center justify-between">
							{t('tours.ui.faq.q2.question')}
							<span className="ml-3 text-slate-400 group-open:rotate-180 transition-transform">⌄</span>
						</summary>
						<p className="mt-2 text-xs text-slate-700">
							{t('tours.ui.faq.q2.answer')}
						</p>
					</details>
					<details className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
						<summary className="cursor-pointer list-none font-semibold text-sm text-slate-900 flex items-center justify-between">
							{t('tours.ui.faq.q3.question')}
							<span className="ml-3 text-slate-400 group-open:rotate-180 transition-transform">⌄</span>
						</summary>
						<p className="mt-2 text-xs text-slate-700">
							{t('tours.ui.faq.q3.answerPrefix')} <span className="font-semibold">${DEFAULT_FLIGHT_INCLUDED_LIMIT_USD}</span>{t('tours.ui.faq.q3.answerSuffix')}
						</p>
					</details>
					<details className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
						<summary className="cursor-pointer list-none font-semibold text-sm text-slate-900 flex items-center justify-between">
							{t('tours.ui.faq.q4.question')}
							<span className="ml-3 text-slate-400 group-open:rotate-180 transition-transform">⌄</span>
						</summary>
						<p className="mt-2 text-xs text-slate-700">
							{t('tours.ui.faq.q4.answer')}
						</p>
						<button
							type="button"
							onClick={openToursWhatsApp}
							className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700"
						>
							{t('tours.ui.faq.q4.whatsappCta')}
						</button>
					</details>
				</div>
			</section>

			{/* Önemli Açıklamalar & Uyarılar (Liste sayfası için özet) */}
			<section className="max-w-6xl mx-auto px-4 mb-16 text-sm text-gray-800">
				<h2 className="text-lg md:text-xl font-bold mb-3 text-gray-900">
					{t('tours.ui.warnings.title')}
				</h2>
				<p className="text-xs md:text-sm text-gray-700 mb-3">
					{t('tours.ui.warnings.description')}
				</p>
				<ol className="list-decimal list-inside space-y-1.5 text-xs md:text-sm">
					<li>{t('tours.ui.warnings.items.1', { days: 10 })}</li>
					<li>{t('tours.ui.warnings.items.2')}</li>
					<li>{t('tours.ui.warnings.items.3')}</li>
					<li>{t('tours.ui.warnings.items.4', { limit: DEFAULT_FLIGHT_INCLUDED_LIMIT_USD })}</li>
					<li>{t('tours.ui.warnings.items.5')}</li>
					<li>{t('tours.ui.warnings.items.6')}</li>
					<li>{t('tours.ui.warnings.items.7')}</li>
					<li>{t('tours.ui.warnings.items.8', { months: 6 })}</li>
					<li>{t('tours.ui.warnings.items.9')}</li>
					<li>{t('tours.ui.warnings.items.10')}</li>
					<li>{t('tours.ui.warnings.items.11')}</li>
					<li>{t('tours.ui.warnings.items.12')}</li>
					<li>{t('tours.ui.warnings.items.13')}</li>
				</ol>
			</section>

			<section className="pb-20 px-4 max-w-5xl mx-auto text-center text-sm text-gray-700">
				<h2 className="text-base md:text-lg font-semibold mb-2">
					{t('tours.ui.groupCta.title')}
				</h2>
				<p className="max-w-3xl mx-auto mb-4">
					{t('tours.ui.groupCta.description')}
				</p>
				<Link
					to="../group-tours"
					className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors"
				>
					{t('tours.ui.groupCta.button')}
				</Link>
			</section>

			{activeTour && (
				<div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/80 px-4 pt-16 md:pt-20">
					<div className="relative bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-5 md:p-6 text-sm text-gray-800">
						<button
							type="button"
							onClick={() => setOpenPreRegId(null)}
							className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-900/70 text-white text-[10px] md:text-xs font-normal shadow-sm hover:bg-gray-900/90"
						>
							<span className="text-xs md:text-sm leading-none">×</span>
							<span>{t('tours.ui.common.close')}</span>
						</button>

						<h2 className="text-base md:text-lg font-semibold mb-2 text-gray-900">
							{t('tours.ui.preRegModal.title', { tourName: tString(`tours.data.${activeTour.id}.name`, activeTour.name) })}
						</h2>
						<p className="text-[11px] md:text-xs text-gray-700 mb-4">
							{t('tours.ui.preRegModal.description')}
						</p>

						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
							<form
								data-tour-id={activeTour.id}
								onSubmit={handleInlinePreRegSubmit}
								className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 md:p-5 space-y-4 text-sm text-gray-800"
							>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-semibold mb-1">{t('tours.ui.form.fullName')} *</label>
										<input
											name="name"
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
											placeholder={t('tours.ui.form.fullNamePlaceholder')}
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold mb-1">{t('tours.ui.form.email')} *</label>
										<input
											type="email"
											name="email"
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
											placeholder={t('tours.ui.form.emailPlaceholder')}
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-semibold mb-1">{t('tours.ui.form.phone')} *</label>
										<input
											name="phone"
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
											placeholder={t('tours.ui.form.phonePlaceholder')}
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold mb-1">{t('tours.ui.form.participationType')} *</label>
										<select
											name="participation"
											defaultValue="bireysel"
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
										>
											<option value="bireysel">{t('tours.ui.form.participationOptions.individual')}</option>
											<option value="aile">{t('tours.ui.form.participationOptions.family')}</option>
											<option value="cift">{t('tours.ui.form.participationOptions.couple')}</option>
											<option value="arkadas">{t('tours.ui.form.participationOptions.friends')}</option>
											<option value="diger">{t('tours.ui.form.participationOptions.other')}</option>
										</select>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-semibold mb-1">{t('tours.ui.form.requestedTour')} *</label>
										<input
											name="tour"
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
											placeholder={`${tString(`tours.data.${activeTour.id}.name`, activeTour.name)} - ${tString(`tours.data.${activeTour.id}.duration`, activeTour.duration)}`}
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold mb-1">{t('tours.ui.form.peopleCount')} *</label>
										<input
											type="number"
											name="people"
											min="1"
											required
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
											placeholder={t('tours.ui.form.peopleCountPlaceholder')}
										/>
									</div>
								</div>

								<div>
									<label className="block text-xs font-semibold mb-1">{t('tours.ui.form.notes')}</label>
									<input
										name="notes"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
										placeholder={t('tours.ui.form.notesPlaceholder')}
									/>
								</div>

								<div className="flex items-start gap-2 text-[11px] text-gray-700">
									<input
										type="checkbox"
										name="privacy"
										required
										className="mt-1 h-4 w-4 border-gray-300 rounded"
									/>
									<p>
										<span>
											{t('tours.ui.form.privacyConsentText')}
										</span>{" "}
										<a
											href="/privacy"
											target="_blank"
											rel="noopener noreferrer"
											className="text-sky-600 hover:underline font-semibold"
										>
											{t('tours.ui.form.privacyPolicyLink')}
										</a>
									</p>
								</div>

								<button
									type="submit"
									className="w-full md:w-auto px-6 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
								>
									{t('tours.ui.form.submit')}
								</button>
							</form>

							<div className="bg-emerald-900/5 border border-emerald-100 rounded-2xl p-4 md:p-5 text-[11px] md:text-xs leading-relaxed text-gray-800">
								<h3 className="text-sm font-semibold mb-2 text-emerald-800">{t('tours.ui.warnings.title')}</h3>
								<p className="mb-2">
									{t('tours.ui.preRegModal.warningsIntro')}
								</p>
								<ol className="list-decimal list-inside space-y-1.5">
									<li>{t('tours.ui.warnings.items.1', { days: 10 })}</li>
									<li>{t('tours.ui.warnings.items.2')}</li>
									<li>{t('tours.ui.warnings.items.3')}</li>
									<li>{t('tours.ui.warnings.items.4', { limit: DEFAULT_FLIGHT_INCLUDED_LIMIT_USD })}</li>
									<li>{t('tours.ui.warnings.items.5')}</li>
									<li>{t('tours.ui.warnings.items.6')}</li>
									<li>{t('tours.ui.warnings.items.7')}</li>
									<li>{t('tours.ui.warnings.items.8', { months: 6 })}</li>
									<li>{t('tours.ui.warnings.items.9')}</li>
									<li>{t('tours.ui.warnings.items.10')}</li>
									<li>{t('tours.ui.warnings.items.11')}</li>
									<li>{t('tours.ui.warnings.items.12')}</li>
									<li>{t('tours.ui.warnings.items.13')}</li>
								</ol>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Mobil Sticky CTA */}
			{!activeTour && (
				<div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden">
					<div className="mx-auto max-w-6xl px-4 pb-3">
						<div className="bg-white/90 backdrop-blur border border-slate-200 shadow-lg rounded-2xl p-3 flex items-center gap-2">
							<button
								type="button"
								onClick={openToursWhatsApp}
								className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700"
							>
								{t('tours.ui.sticky.whatsapp')}
							</button>
							<button
								type="button"
								onClick={openTourPicker}
								className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
							>
								{t('tours.ui.sticky.preReg')}
							</button>
							<button
								type="button"
								onClick={scrollToToursList}
								className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 text-slate-800 bg-white hover:bg-slate-50"
							>
								{t('tours.ui.sticky.tours')}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Tur seçici (mobilde sticky CTA ile açılır) */}
			{!activeTour && isTourPickerOpen && (
				<div className="fixed inset-0 z-[200] bg-black/70 flex items-end md:hidden" onClick={closeTourPicker}>
					<div
						className="w-full bg-white rounded-t-3xl p-4 max-h-[75vh] overflow-y-auto"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-semibold text-slate-900">{t('tours.ui.tourPicker.title')}</h3>
							<button
								type="button"
								onClick={closeTourPicker}
								className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800"
							>
								{t('tours.ui.common.close')}
							</button>
						</div>
						<div className="space-y-2">
							{tours.map((t) => (
								<button
									key={`pick-${t0.id}`}
									type="button"
									onClick={() => {
										setIsTourPickerOpen(false);
										setOpenPreRegId(t0.id);
									}}
									className="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"
								>
									<p className="text-sm font-semibold text-slate-900">{tString(`tours.data.${t0.id}.name`, t0.name)}</p>
									<p className="text-[11px] text-slate-600">{tString(`tours.data.${t0.id}.duration`, t0.duration)}</p>
								</button>
							))}
						</div>
					</div>
				</div>
			)}

			<Footer />
		</div>
		);
	}
