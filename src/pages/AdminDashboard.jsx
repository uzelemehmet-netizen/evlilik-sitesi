import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit2, Upload } from 'lucide-react';
import { collection, getDocs, doc, setDoc, getDoc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { TOURS_CONFIG } from './Tours';
import ReservationsTab from '../components/admin/ReservationsTab';
import MatchmakingTab from '../components/admin/MatchmakingTab';
import WeddingMediaTab from '../components/admin/WeddingMediaTab';
import MatchmakingIdentityTab from '../components/admin/MatchmakingIdentityTab';
import MatchmakingPaymentsTab from '../components/admin/MatchmakingPaymentsTab';
import MatchmakingMatchesTab from '../components/admin/MatchmakingMatchesTab';
import MatchmakingUserToolsTab from '../components/admin/MatchmakingUserToolsTab';
import MatchmakingPhotoUpdatesTab from '../components/admin/MatchmakingPhotoUpdatesTab';
import { isFeatureEnabled } from '../config/siteVariant';

// Tüm ada ve destinasyonlar
const ISLANDS_DATA = {
  bali: {
    name: 'Bali',
    heroId: 'bali-hero',
    destinations: [
      { id: 'ubud', name: 'Ubud' },
      { id: 'seminyak', name: 'Seminyak' },
      { id: 'uluwatu', name: 'Uluwatu' },
      { id: 'nusa-dua', name: 'Nusa Dua' },
      { id: 'canggu', name: 'Canggu' },
      { id: 'sanur', name: 'Sanur' },
      { id: 'munduk', name: 'Munduk' },
      { id: 'amed', name: 'Amed' },
    ]
  },
  java: {
    name: 'Java',
    heroId: 'java-hero',
    destinations: [
      { id: 'yogyakarta', name: 'Yogyakarta' },
      { id: 'pangandaran', name: 'Pangandaran' },
      { id: 'banyuwangi', name: 'Banyuwangi' },
      { id: 'bandung', name: 'Bandung' },
      { id: 'malang', name: 'Malang' },
    ]
  },
  lombok: {
    name: 'Lombok',
    heroId: 'lombok-hero',
    destinations: [
      { id: 'gili-trawangan', name: 'Gili Trawangan' },
      { id: 'mount-rinjani', name: 'Mount Rinjani' },
      { id: 'senggigi', name: 'Senggigi' },
      { id: 'kuta', name: 'Kuta' },
      { id: 'benang-stokel', name: 'Benang Stokel' },
    ]
  },
  komodo: {
    name: 'Komodo',
    heroId: 'komodo-hero',
    destinations: [
      { id: 'komodo-island', name: 'Komodo Island' },
      { id: 'labuan-bajo', name: 'Labuan Bajo' },
    ]
  },
  sulawesi: {
    name: 'Sulawesi',
    heroId: 'sulawesi-hero',
    destinations: [
      { id: 'bunaken', name: 'Bunaken' },
      { id: 'makassar', name: 'Makassar' },
      { id: 'wakatobi', name: 'Wakatobi' },
      { id: 'togean', name: 'Togean' },
    ]
  },
  sumatra: {
    name: 'Sumatra',
    heroId: 'sumatra-hero',
    destinations: [
      { id: 'lake-toba', name: 'Lake Toba' },
      { id: 'bukit-lawang', name: 'Bukit Lawang' },
      { id: 'mentawai', name: 'Mentawai' },
      { id: 'bukittinggi', name: 'Bukittinggi' },
      { id: 'kerinci', name: 'Kerinci' },
      { id: 'nias', name: 'Nias' },
    ]
  }
};

// public klasöründeki bazı büyük/varsayılan görselleri Cloudinary + Firestore'a taşıyıp
// projeyi "public" bağımlılığından kurtarmak için yönetim kartları.
const STATIC_PUBLIC_IMAGES = [
  {
    imageId: 'vecteezy_two-men-riding-jet-skis-side-by-side-on-the-water-concept_68431320.jpg',
    name: 'Serbest gün görseli (Jet-ski)',
    category: 'Sabit (public) görsel'
  },
  {
    imageId: 'vecteezy_luxurious-yacht-anchored-in-a-tropical-paradise-under-a-clear_73309259.jpeg',
    name: 'Serbest gün görseli (Yat - Komodo)',
    category: 'Sabit (public) görsel'
  },
  {
    imageId: 'young-slim-woman-sitting-bikini-bathing-suit-yacht-basking-sun.jpg',
    name: 'Serbest gün görseli (Yat - Güneş)',
    category: 'Sabit (public) görsel'
  },
  {
    imageId: 'three-happy-cheerful-european-people-having-lunch-board-yacht-drinking-champagne-spending-fantastic-time-together-friends-arranged-surprise-party-boat-b-day-girl.jpg',
    name: 'CTA sağ görsel (Arkadaş grubu / tekne)',
    category: 'Sabit (public) görsel'
  },
  {
    imageId: 'ernests-vaga-mzJFI9o5_zc-unsplash.jpg',
    name: 'Varsayılan galeri görseli (Unsplash)',
    category: 'Sabit (public) görsel'
  },
];

export default function AdminDashboard() {
  const weddingOnly = isFeatureEnabled('wedding') && !isFeatureEnabled('travel');
  const [activeTab, setActiveTab] = useState(() => (weddingOnly ? 'matchmaking' : 'islands'));
  const [selectedIsland, setSelectedIsland] = useState('bali');
  const [editingId, setEditingId] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [youtubeShortUrls, setYoutubeShortUrls] = useState([
    'https://youtube.com/shorts/vWmWhptuxO4?si=0J9sYR6GEoeteCtd',
    'https://youtube.com/shorts/uA76Odj1Krw?si=Q4B4f8U7E8EoijcC',
    'https://youtube.com/shorts/nfxlrWqq5HI?si=sM09lqmFWjJmuP6E',
    'https://youtube.com/shorts/LNOCVMd2Ndc?si=QgMChHopi8BvN2Ne',
  ]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [toursSettings, setToursSettings] = useState([]);
  const [toursLoading, setToursLoading] = useState(false);
  const [toursSaving, setToursSaving] = useState(false);
  const [toursMessage, setToursMessage] = useState('');
  const [firestoreBlocked, setFirestoreBlocked] = useState(false);
  const [firestoreBlockedReason, setFirestoreBlockedReason] = useState('');
  const [matchmakingItems, setMatchmakingItems] = useState([]);
  const [matchmakingNewCount, setMatchmakingNewCount] = useState(0);
  const [identityPendingCount, setIdentityPendingCount] = useState(0);
  const [paymentsPendingCount, setPaymentsPendingCount] = useState(0);
  const [photoUpdatesPendingCount, setPhotoUpdatesPendingCount] = useState(0);
  const [activeMatchesCount, setActiveMatchesCount] = useState(0);
  const matchmakingInitializedRef = useRef(false);
  const lastNotifiedAtRef = useRef(0);
  const navigate = useNavigate();

  const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dj1xg1c56';

  const isFirestorePermissionDenied = (err) => {
    const code = err?.code || err?.name;
    const msg = String(err?.message || '');
    return code === 'permission-denied' || msg.includes('Missing or insufficient permissions');
  };

  const blockFirestoreIfNeeded = (err) => {
    if (!isFirestorePermissionDenied(err)) return false;
    const u = auth?.currentUser || null;
    const email = u?.email ? String(u.email) : '';
    const anon = !!u?.isAnonymous;
    const code = err?.code || err?.name || '';
    const msg = String(err?.message || '');
    setFirestoreBlocked(true);
    setFirestoreBlockedReason(
      `Firestore erişim izni yok (Missing or insufficient permissions). Kullanıcı: ${email || '(email yok)'}${anon ? ' (anonymous)' : ''}. Hata: ${code} ${msg}`
    );
    return true;
  };

  const markMatchmakingAllRead = () => {
    const now = Date.now();
    try {
      localStorage.setItem('matchmakingLastSeenAt', String(now));
    } catch (e) {
      // ignore
    }
    setMatchmakingNewCount(0);
  };

  const tryNotify = (title, body) => {
    try {
      if (typeof window === 'undefined') return;
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      new Notification(title, { body });
    } catch (e) {
      // ignore
    }
  };

  // localStorage'dan resim URL'lerini yükle
  useEffect(() => {
    if (weddingOnly) return;
    const saved = localStorage.getItem('imageUrls');
    if (saved) {
      setImageUrls(JSON.parse(saved));
    }
  }, [weddingOnly]);

  // Firestore'dan imageUrls konfigurasyonunu yükle
  useEffect(() => {
    if (weddingOnly) return;
    const fetchImageUrls = async () => {
      if (firestoreBlocked) return;
      try {
        const snap = await getDoc(doc(db, 'imageUrls', 'imageUrls'));
        if (snap.exists()) {
          const data = snap.data() || {};
          setImageUrls((prev) => {
            const merged = { ...prev, ...data };
            try {
              localStorage.setItem('imageUrls', JSON.stringify(merged));
            } catch (e) {
              console.error('imageUrls localStorage yazma hatası:', e);
            }
            return merged;
          });
        }
      } catch (error) {
        if (blockFirestoreIfNeeded(error)) return;
        console.error('Firestore imageUrls yüklenirken hata:', error);
      }
    };

    fetchImageUrls();
  }, [firestoreBlocked, weddingOnly]);

  // localStorage + Firestore'dan YouTube Shorts URL'lerini yükle
  useEffect(() => {
    if (weddingOnly) return;
    try {
      const saved = localStorage.getItem('youtubeShortUrls');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setYoutubeShortUrls((prev) => {
            const next = [...prev];
            for (let i = 0; i < Math.min(4, parsed.length); i += 1) {
              if (typeof parsed[i] === 'string' && parsed[i].trim()) next[i] = parsed[i].trim();
            }
            return next;
          });
        }
      }
    } catch (e) {
      console.error('youtubeShortUrls localStorage okuma hatası:', e);
    }

    const fetchShorts = async () => {
      if (firestoreBlocked) return;
      try {
        const snap = await getDoc(doc(db, 'siteSettings', 'youtubeShorts'));
        if (snap.exists()) {
          const data = snap.data() || {};
          const urls = Array.isArray(data.urls) ? data.urls : [];
          if (urls.length > 0) {
            setYoutubeShortUrls((prev) => {
              const next = [...prev];
              for (let i = 0; i < Math.min(4, urls.length); i += 1) {
                if (typeof urls[i] === 'string' && urls[i].trim()) next[i] = urls[i].trim();
              }
              try {
                localStorage.setItem('youtubeShortUrls', JSON.stringify(next));
              } catch (e) {
                console.error('youtubeShortUrls localStorage yazma hatası:', e);
              }
              return next;
            });
          }
        }
      } catch (error) {
        if (blockFirestoreIfNeeded(error)) return;
        console.error('Firestore youtubeShorts yüklenirken hata:', error);
      }
    };

    fetchShorts();
  }, [firestoreBlocked, weddingOnly]);

  // Matchmaking başvurularını dinle (sadece admin okuyabilir) + yeni başvuru bildirimi
  useEffect(() => {
    if (firestoreBlocked) return;

    const colRef = collection(db, 'matchmakingApplications');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        setMatchmakingItems(items);

        let lastSeen = 0;
        try {
          lastSeen = Number(localStorage.getItem('matchmakingLastSeenAt') || '0') || 0;
        } catch (e) {
          lastSeen = 0;
        }

        const unseenCount = items.filter((it) => {
          const ts = it.createdAt;
          const ms = ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
          return ms > lastSeen;
        }).length;
        setMatchmakingNewCount(unseenCount);

        if (!matchmakingInitializedRef.current) {
          matchmakingInitializedRef.current = true;
          lastNotifiedAtRef.current = Date.now();
          return;
        }

        for (const ch of snap.docChanges()) {
          if (ch.type !== 'added') continue;
          const data = ch.doc.data() || {};
          const ms = data.createdAt && typeof data.createdAt.toMillis === 'function' ? data.createdAt.toMillis() : 0;
          if (!ms) continue;
          if (ms <= lastNotifiedAtRef.current) continue;
          if (ms <= lastSeen) continue;

          lastNotifiedAtRef.current = Math.max(lastNotifiedAtRef.current, ms);
          const name = data.fullName ? String(data.fullName) : 'Yeni başvuru';
          const city = data.city ? String(data.city) : '';
          tryNotify('Yeni evlilik başvurusu', city ? `${name} • ${city}` : name);
        }
      },
      (error) => {
        if (blockFirestoreIfNeeded(error)) return;
        console.error('Firestore matchmakingApplications dinleme hatası:', error);
      }
    );

    return () => unsub();
  }, [firestoreBlocked]);

  // Wedding-only admin sayaçları (tab badge)
  useEffect(() => {
    if (firestoreBlocked) return;
    if (!weddingOnly) return;

    const q = query(
      collection(db, 'matchmakingUsers'),
      where('identityVerification.status', '==', 'pending'),
      limit(200)
    );

    const unsub = onSnapshot(
      q,
      (snap) => setIdentityPendingCount(snap.size),
      (error) => {
        if (blockFirestoreIfNeeded(error)) return;
        console.error('Firestore identity pending count error:', error);
      }
    );

    return () => unsub();
  }, [firestoreBlocked, weddingOnly]);

  useEffect(() => {
    if (firestoreBlocked) return;
    if (!weddingOnly) return;

    const q = query(collection(db, 'matchmakingPhotoUpdateRequests'), where('status', '==', 'pending'), limit(200));

    const unsub = onSnapshot(
      q,
      (snap) => setPhotoUpdatesPendingCount(snap.size),
      (error) => {
        if (blockFirestoreIfNeeded(error)) return;
        console.error('Firestore photo updates pending count error:', error);
      }
    );

    return () => unsub();
  }, [firestoreBlocked, weddingOnly]);

  useEffect(() => {
    if (firestoreBlocked) return;
    if (!weddingOnly) return;

    const q = query(collection(db, 'matchmakingPayments'), where('status', '==', 'pending'), limit(200));

    const unsub = onSnapshot(
      q,
      (snap) => setPaymentsPendingCount(snap.size),
      (error) => {
        if (blockFirestoreIfNeeded(error)) return;
        console.error('Firestore payments pending count error:', error);
      }
    );

    return () => unsub();
  }, [firestoreBlocked, weddingOnly]);

  useEffect(() => {
    if (firestoreBlocked) return;
    if (!weddingOnly) return;

    const q = query(
      collection(db, 'matchmakingMatches'),
      where('status', 'in', ['mutual_accepted', 'contact_unlocked']),
      limit(200)
    );

    const unsub = onSnapshot(
      q,
      (snap) => setActiveMatchesCount(snap.size),
      (error) => {
        if (blockFirestoreIfNeeded(error)) return;
        console.error('Firestore active matches count error:', error);
      }
    );

    return () => unsub();
  }, [firestoreBlocked, weddingOnly]);

  // Firestore'dan tur tarih ve fiyatlarını yükle
  useEffect(() => {
    if (weddingOnly) return;
    const fetchTours = async () => {
      setToursLoading(true);
      try {
        if (firestoreBlocked) {
          const fallback = TOURS_CONFIG.map((tour) => ({
            id: tour.id,
            name: tour.name,
            dateRange: tour.dateRange || '',
            price: tour.price || '',
            discountPercent: '',
            promoLabel: '',
          }));
          setToursSettings(fallback);
          return;
        }
        const snapshot = await getDocs(collection(db, 'tours'));
        const existing = {};
        snapshot.forEach((docSnap) => {
          existing[docSnap.id] = docSnap.data();
        });

        const merged = TOURS_CONFIG.map((tour) => ({
          id: tour.id,
          name: tour.name,
          dateRange: existing[tour.id]?.dateRange || tour.dateRange || '',
          price:
            existing[tour.id]?.price !== undefined && existing[tour.id]?.price !== null
              ? existing[tour.id].price
              : tour.price || '',
          discountPercent:
            existing[tour.id]?.discountPercent !== undefined && existing[tour.id]?.discountPercent !== null
              ? existing[tour.id].discountPercent
              : '',
          promoLabel: existing[tour.id]?.promoLabel || '',
        }));

        setToursSettings(merged);
      } catch (error) {
        if (blockFirestoreIfNeeded(error)) {
          const fallback = TOURS_CONFIG.map((tour) => ({
            id: tour.id,
            name: tour.name,
            dateRange: tour.dateRange || '',
            price: tour.price || '',
            discountPercent: '',
            promoLabel: '',
          }));
          setToursSettings(fallback);
          return;
        }
        console.error('Tur ayarları yüklenirken hata:', error);
        const fallback = TOURS_CONFIG.map((tour) => ({
          id: tour.id,
          name: tour.name,
          dateRange: tour.dateRange || '',
          price: tour.price || '',
          discountPercent: '',
          promoLabel: '',
        }));
        setToursSettings(fallback);
      } finally {
        setToursLoading(false);
      }
    };

    fetchTours();
  }, [firestoreBlocked, weddingOnly]);

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes)) return '';
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;
    if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`;
    if (bytes >= mb) return `${(bytes / mb).toFixed(2)} MB`;
    if (bytes >= kb) return `${(bytes / kb).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const compressImageIfNeeded = async (inputFile, maxBytes = 10 * 1024 * 1024) => {
    if (!inputFile?.type?.startsWith('image/')) {
      throw new Error('Sadece resim dosyaları yüklenebilir.');
    }

    const readJpegOrientation = async (file) => {
      // EXIF orientation sadece JPEG'de anlamlıdır.
      if (file.type !== 'image/jpeg') return 1;

      const slice = file.slice(0, 256 * 1024);
      const buffer = await slice.arrayBuffer();
      const view = new DataView(buffer);

      // JPEG SOI
      if (view.getUint16(0, false) !== 0xffd8) return 1;

      let offset = 2;
      while (offset < view.byteLength) {
        const marker = view.getUint16(offset, false);
        offset += 2;

        // APP1
        if (marker === 0xffe1) {
          const length = view.getUint16(offset, false);
          const exifOffset = offset + 2;

          // "Exif\0\0"
          if (view.getUint32(exifOffset, false) !== 0x45786966) return 1;

          const tiffOffset = exifOffset + 6;
          const little = view.getUint16(tiffOffset, false) === 0x4949;
          const firstIfdOffset = view.getUint32(tiffOffset + 4, little);
          let ifd = tiffOffset + firstIfdOffset;
          if (ifd < 0 || ifd >= view.byteLength) return 1;

          const entries = view.getUint16(ifd, little);
          ifd += 2;
          for (let i = 0; i < entries; i += 1) {
            const entryOffset = ifd + i * 12;
            if (entryOffset + 12 > view.byteLength) break;
            const tag = view.getUint16(entryOffset, little);
            // Orientation tag = 0x0112
            if (tag === 0x0112) {
              const value = view.getUint16(entryOffset + 8, little);
              return value >= 1 && value <= 8 ? value : 1;
            }
          }

          return 1;
        }

        // SOS ya da EOI görürsek bırak.
        if (marker === 0xffda || marker === 0xffd9) break;

        const size = view.getUint16(offset, false);
        offset += size;

        if (size < 2) break;
      }

      return 1;
    };

    const applyOrientationTransform = (ctx, orientation, canvasW, canvasH) => {
      // https://i.stack.imgur.com/VGsAj.gif
      // 1: normal
      // 2: flip horizontal
      // 3: rotate 180
      // 4: flip vertical
      // 5: transpose
      // 6: rotate 90 CW
      // 7: transverse
      // 8: rotate 90 CCW
      switch (orientation) {
        case 2:
          ctx.translate(canvasW, 0);
          ctx.scale(-1, 1);
          break;
        case 3:
          ctx.translate(canvasW, canvasH);
          ctx.rotate(Math.PI);
          break;
        case 4:
          ctx.translate(0, canvasH);
          ctx.scale(1, -1);
          break;
        case 5:
          ctx.rotate(0.5 * Math.PI);
          ctx.scale(1, -1);
          break;
        case 6:
          ctx.rotate(0.5 * Math.PI);
          ctx.translate(0, -canvasH);
          break;
        case 7:
          ctx.rotate(0.5 * Math.PI);
          ctx.translate(canvasW, -canvasH);
          ctx.scale(-1, 1);
          break;
        case 8:
          ctx.rotate(-0.5 * Math.PI);
          ctx.translate(-canvasW, 0);
          break;
        default:
          break;
      }
    };

    if (inputFile.size <= maxBytes) {
      return { file: inputFile, didCompress: false, originalBytes: inputFile.size, outputBytes: inputFile.size };
    }

    const originalBytes = inputFile.size;
    let maxDimension = 2400;
    let quality = 0.85;

    const loadImageElement = (file) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Görsel okunamadı (bozuk dosya/CMYK olabilir).'));
        };
        img.src = objectUrl;
      });

    const loadDrawableSource = async (file) => {
      // Önce createImageBitmap dene (bazı görsellerde daha stabil)
      if (typeof createImageBitmap === 'function') {
        try {
          const bitmap = await createImageBitmap(file);
          return {
            source: bitmap,
            width: bitmap.width,
            height: bitmap.height,
            cleanup: () => {
              try { bitmap.close(); } catch (e) {}
            }
          };
        } catch (e) {
          // fallback: HTMLImageElement
        }
      }

      const img = await loadImageElement(file);
      return {
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => {}
      };
    };

    const toBlob = async (canvas, type, q) => {
      const blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), type, q);
      });
      if (blob) return blob;

      // Safari vb. nadiren null döndürebiliyor; dataURL fallback
      try {
        const dataUrl = canvas.toDataURL(type, q);
        const res = await fetch(dataUrl);
        return await res.blob();
      } catch (e) {
        return null;
      }
    };

    const orientation = await readJpegOrientation(inputFile);

    let drawable;
    try {
      drawable = await loadDrawableSource(inputFile);
    } catch (e) {
      throw new Error(
        'Bu görsel tarayıcıda işlenemiyor (bozuk/CMYK olabilir). Lütfen görseli JPG (sRGB) olarak yeniden dışa aktarın ve tekrar deneyin.'
      );
    }

    const originalW = drawable.width;
    const originalH = drawable.height;

    if (!originalW || !originalH) {
      throw new Error('Görsel boyutları okunamadı.');
    }

    // Sıkıştırmayı birkaç tur dene: önce kalite düşür, sonra boyutu küçült.
    // (10MB+ görselleri garanti altına almak için tur sayısını biraz artırıyoruz.)
    for (let outer = 0; outer < 10; outer += 1) {
      const scale = Math.min(1, maxDimension / Math.max(originalW, originalH));
      const targetW = Math.max(1, Math.round(originalW * scale));
      const targetH = Math.max(1, Math.round(originalH * scale));

      const swapWH = orientation >= 5 && orientation <= 8;
      const canvasW = swapWH ? targetH : targetW;
      const canvasH = swapWH ? targetW : targetH;

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas desteklenmiyor.');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      applyOrientationTransform(ctx, orientation, canvasW, canvasH);
      // drawImage boyutları her zaman "orijinal" hedef boyuttur.
      ctx.drawImage(drawable.source, 0, 0, targetW, targetH);

      // Kaliteyi birkaç adım düşür
      const qualitySteps = [quality, 0.78, 0.7, 0.62, 0.54, 0.46, 0.4, 0.34, 0.3, 0.26];
      for (let i = 0; i < qualitySteps.length; i += 1) {
        const q = qualitySteps[i];
        let blob = await toBlob(canvas, 'image/jpeg', q);
        // JPEG hala büyükse, WebP dene (genelde daha küçük olur)
        if (blob && blob.size > maxBytes) {
          const webp = await toBlob(canvas, 'image/webp', Math.min(0.9, q + 0.1));
          if (webp && webp.size < blob.size) blob = webp;
        }
        if (!blob) continue;
        if (blob.size <= maxBytes) {
          const isWebp = blob.type === 'image/webp';
          const outName = inputFile.name.replace(/\.[a-z0-9]+$/i, '') + (isWebp ? '.webp' : '.jpg');
          const outFile = new File([blob], outName, { type: blob.type || (isWebp ? 'image/webp' : 'image/jpeg') });
          drawable.cleanup();
          return { file: outFile, didCompress: true, originalBytes, outputBytes: blob.size };
        }
      }

      // Hâlâ büyükse boyutu biraz daha küçült
      maxDimension = Math.round(maxDimension * 0.8);
      quality = Math.max(0.7, quality - 0.06);
    }

    drawable.cleanup();

    throw new Error(
      `Görsel 10MB altına indirilemedi. Lütfen daha küçük bir dosya seçin (mevcut: ${formatBytes(originalBytes)}).`
    );
  };

  // Dosya yükleme ve URL kaydetme
  const handleFileUpload = async (e, imageId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(prev => ({ ...prev, [imageId]: 'Yükleniyor...' }));

    try {
      // Firebase Storage (Google Cloud Storage) free planda çoğu projede "Upgrade" isteyebilir.
      // Bu projede pratik çözüm: Cloudinary'ye upload edip URL'yi Firestore'a kaydetmek.
      const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
      const TARGET_UPLOAD_BYTES = Math.floor(MAX_UPLOAD_BYTES * 0.95);
      let progressPrefix = '';
      let fileToUpload = file;
      if (file.size > TARGET_UPLOAD_BYTES) {
        setUploadProgress((prev) => ({
          ...prev,
          [imageId]: `Sıkıştırılıyor... (${formatBytes(file.size)})`,
        }));
        try {
          const compressed = await compressImageIfNeeded(file, TARGET_UPLOAD_BYTES);
          fileToUpload = compressed.file;
          progressPrefix = `Sıkıştırıldı: ${formatBytes(compressed.originalBytes)} → ${formatBytes(compressed.outputBytes)} | `;
          setUploadProgress((prev) => ({
            ...prev,
            [imageId]: `${progressPrefix}Yükleniyor...`,
          }));
        } catch (compressErr) {
          // Bazı JPEG'ler (özellikle CMYK / bozuk metadata) tarayıcıda decode edilemeyebilir.
          // Bu durumda sıkıştırma yapamıyoruz; Cloudinary genelde dosyayı kabul edip işleyebiliyor.
          console.warn('Sıkıştırma başarısız, orijinal dosya ile denenecek:', compressErr);
          // Ancak Cloudinary unsigned upload çoğu zaman 10MB üzerini reddeder.
          // Sıkıştırma başarısızsa, kullanıcıyı net şekilde yönlendirelim.
          if (file.size > MAX_UPLOAD_BYTES) {
            throw new Error(
              `Bu dosya ${formatBytes(file.size)} ve 10MB limitini aşıyor. Tarayıcı bu görseli sıkıştıramadı (bozuk/CMYK olabilir), bu yüzden Cloudinary yüklemeyi reddeder.\n\nÇözüm seçenekleri:\n- Görseli küçültüp tekrar dene (en uzun kenar 2000-2400px, JPEG kalite 75-85).\n- Cloudinary panelinden yükleyip oluşan URL'yi buraya yapıştır.\n- Alternatif: sunucu/worker ile "signed upload" + chunked upload (upload_large) kurabiliriz.`
            );
          }

          // 10MB altındaysa sıkıştırmayı atlayıp orijinali göndermek güvenli.
          fileToUpload = file;
          progressPrefix = `Sıkıştırma atlandı (${formatBytes(file.size)}) | `;
          setUploadProgress((prev) => ({
            ...prev,
            [imageId]: `${progressPrefix}Yükleniyor...`,
          }));
        }
      }

      // Son emniyet: Cloudinary limitini aşmayalım.
      if (fileToUpload?.size && fileToUpload.size > MAX_UPLOAD_BYTES) {
        throw new Error(
          `Sıkıştırma sonrası dosya hâlâ ${formatBytes(fileToUpload.size)} ve 10MB limitini aşıyor.\n\nLütfen daha küçük bir görsel seçin veya Cloudinary panelinden yükleyip URL yapıştırın.`
        );
      }

      const uploadToCloudinary = (uploadFile) =>
        new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const url = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`;
          xhr.open('POST', url);

          xhr.upload.onprogress = (evt) => {
            if (!evt.lengthComputable) return;
            const percent = Math.round((evt.loaded / evt.total) * 100);
            setUploadProgress((prev) => ({
              ...prev,
              [imageId]: `${progressPrefix}Yükleniyor... (${percent}%)`,
            }));
          };

          xhr.onload = () => {
            try {
              const parsed = JSON.parse(xhr.responseText || '{}');
              if (xhr.status >= 200 && xhr.status < 300) {
                const secureUrl = parsed.secure_url || parsed.url;
                if (!secureUrl) {
                  reject(new Error('Cloudinary yanıtında URL bulunamadı.'));
                  return;
                }
                resolve(secureUrl);
                return;
              }
              reject(new Error(`Cloudinary upload başarısız (${xhr.status}): ${parsed?.error?.message || xhr.responseText}`));
            } catch (parseErr) {
              reject(new Error(`Cloudinary upload başarısız (${xhr.status}): ${xhr.responseText}`));
            }
          };

          xhr.onerror = () => reject(new Error('Cloudinary upload ağ hatası.'));

          const formData = new FormData();
          formData.append('file', uploadFile);
          formData.append('upload_preset', cloudinaryUploadPreset);
          formData.append('folder', `endonezya-kasifi/${imageId}`);
          xhr.send(formData);
        });

      let downloadURL;
      if (cloudinaryUploadPreset) {
        downloadURL = await uploadToCloudinary(fileToUpload);
      } else {
        // Cloudinary preset yoksa eski Firebase Storage yoluna düşmek yerine
        // kullanıcıyı net şekilde yönlendirelim (free planda genelde upload bloklanıyor).
        throw new Error(
          "Cloudinary Upload Preset bulunamadı.\n\n- Lokal geliştirmede: `evlilik-site/.env.local` (veya `.env`) içine `VITE_CLOUDINARY_UPLOAD_PRESET` ekleyin ve dev server'ı yeniden başlatın.\n- Canlı (deploy) sitede: Vite env değişkenleri build-time gömülür; Vercel proje ayarlarından Production env olarak `VITE_CLOUDINARY_UPLOAD_PRESET` ekleyin ve yeniden deploy edin.\n\nGerekirse `VITE_CLOUDINARY_CLOUD_NAME` da tanımlayın."
        );
      }

      setImageUrls(prev => ({
        ...prev,
        [imageId]: downloadURL
      }));

      setUploadProgress(prev => ({ ...prev, [imageId]: 'Başarılı' }));
      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [imageId]: null }));
      }, 2000);
    } catch (error) {
      console.error('Yükleme hatası:', error);
      console.error('Yükleme hata detayları:', {
        code: error?.code,
        message: error?.message,
        name: error?.name,
        customData: error?.customData,
        serverResponse: error?.serverResponse,
      });
      setUploadProgress(prev => ({ ...prev, [imageId]: 'Hata!' }));
      alert(error?.message || 'Dosya yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUrlChange = (id, url) => {
    setImageUrls(prev => ({
      ...prev,
      [id]: url
    }));
  };

  const handleYoutubeShortUrlChange = (index, value) => {
    setYoutubeShortUrls((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSave = async () => {
    try {
      localStorage.setItem('imageUrls', JSON.stringify(imageUrls));
    } catch (e) {
      console.error('imageUrls localStorage kaydetme hatası:', e);
    }

    try {
      localStorage.setItem('youtubeShortUrls', JSON.stringify(youtubeShortUrls));
    } catch (e) {
      console.error('youtubeShortUrls localStorage kaydetme hatası:', e);
    }

    if (firestoreBlocked) {
      alert('Kaydedildi (localStorage). Firestore kaydı yapılamadı: yetki yok.');
      return;
    }

    try {
      await Promise.all([
        setDoc(doc(db, 'imageUrls', 'imageUrls'), imageUrls || {}, { merge: true }),
        setDoc(
          doc(db, 'siteSettings', 'youtubeShorts'),
          { urls: (Array.isArray(youtubeShortUrls) ? youtubeShortUrls : []).slice(0, 4) },
          { merge: true }
        ),
      ]);
      alert('Resim URL\'leri ve YouTube Shorts alanı kaydedildi!');
    } catch (error) {
      if (blockFirestoreIfNeeded(error)) {
        alert('Kaydedildi (localStorage). Firestore kaydı yapılamadı: yetki yok.');
        return;
      }
      console.error('Firestore imageUrls kaydetme hatası:', error);
      alert('Kaydetme sırasında bir hata oluştu. Detay için konsolu kontrol edin.');
    }
  };

  const handleTourFieldChange = (id, field, value) => {
    setToursSettings((prev) =>
      prev.map((tour) => (tour.id === id ? { ...tour, [field]: value } : tour))
    );
  };

  const handleSaveTours = async () => {
    if (!toursSettings.length) return;
    setToursSaving(true);
    setToursMessage('');
    try {
      if (firestoreBlocked) {
        setToursMessage('Firestore kaydı yapılamadı: yetki yok. (Bu alan sadece localStorage ile güncellenmez)');
        return;
      }
      await Promise.all(
        toursSettings.map((tour) => {
          const discount = tour.discountPercent === '' ? 0 : Number(tour.discountPercent) || 0;
          return setDoc(
            doc(db, 'tours', tour.id),
            {
              dateRange: tour.dateRange || '',
              price: tour.price || '',
              discountPercent: discount,
              promoLabel: tour.promoLabel || '',
            },
            { merge: true }
          );
        })
      );
      setToursMessage('Tur tarih ve fiyatları kaydedildi.');
    } catch (error) {
      if (blockFirestoreIfNeeded(error)) {
        setToursMessage('Firestore kaydı yapılamadı: yetki yok.');
        return;
      }
      console.error('Tur ayarları kaydedilirken hata:', error);
      setToursMessage('Kaydetme sırasında bir hata oluştu. Detay için konsolu kontrol edin.');
    } finally {
      setToursSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin');
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  const renderContent = () => {
    if (weddingOnly) {
      if (activeTab === 'matchmaking') {
        return (
          <MatchmakingTab
            items={matchmakingItems}
            newCount={matchmakingNewCount}
            onMarkAllRead={markMatchmakingAllRead}
          />
        );
      }

      if (activeTab === 'identity') {
        return <MatchmakingIdentityTab />;
      }

      if (activeTab === 'payments') {
        return <MatchmakingPaymentsTab />;
      }

      if (activeTab === 'photoUpdates') {
        return <MatchmakingPhotoUpdatesTab />;
      }

      if (activeTab === 'matches') {
        return <MatchmakingMatchesTab />;
      }

      if (activeTab === 'userTools') {
        return <MatchmakingUserToolsTab />;
      }

      if (activeTab === 'weddingMedia') {
        return <WeddingMediaTab />;
      }

      return (
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-700">Bu admin panelde sadece evlilik / eşleştirme yönetimi aktiftir.</p>
        </div>
      );
    }

    if (activeTab === 'matchmaking') {
      return (
        <MatchmakingTab
          items={matchmakingItems}
          newCount={matchmakingNewCount}
          onMarkAllRead={markMatchmakingAllRead}
        />
      );
    }

    if (activeTab === 'reservations') {
      return <ReservationsTab />;
    }

    if (activeTab === 'islands') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(ISLANDS_DATA).map(([key, island]) => (
            <ImageCard
              key={island.heroId}
              imageId={island.heroId}
              name={island.name}
              category="Ada Hero"
              imageUrls={imageUrls}
              editingId={editingId}
              setEditingId={setEditingId}
              handleImageUrlChange={handleImageUrlChange}
              handleFileUpload={handleFileUpload}
              uploadProgress={uploadProgress}
            />
          ))}
        </div>
      );
    }

    if (activeTab === 'tourHero') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOURS_CONFIG.map((tour) => (
            <ImageCard
              key={`${tour.id}-tour-hero`}
              imageId={`${tour.id}-tour-hero`}
              name={tour.name}
              category="Tur kartı & detay hero"
              imageUrls={imageUrls}
              editingId={editingId}
              setEditingId={setEditingId}
              handleImageUrlChange={handleImageUrlChange}
              handleFileUpload={handleFileUpload}
              uploadProgress={uploadProgress}
            />
          ))}
        </div>
      );
    }

    if (activeTab === 'destHero') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(ISLANDS_DATA).map(([key, island]) => (
            <ImageCard
              key={`${island.heroId}-dest-hero`}
              imageId={`${island.heroId}-dest-hero`}
              name={island.name}
              category="Ada detay sayfası hero banner"
              imageUrls={imageUrls}
              editingId={editingId}
              setEditingId={setEditingId}
              handleImageUrlChange={handleImageUrlChange}
              handleFileUpload={handleFileUpload}
              uploadProgress={uploadProgress}
            />
          ))}
        </div>
      );
    }

    if (activeTab === 'destinations') {
      const island = ISLANDS_DATA[selectedIsland];
      return (
        <div>
          <div className="mb-6 flex gap-2 flex-wrap">
            {Object.entries(ISLANDS_DATA).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setSelectedIsland(key)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedIsland === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {data.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {island.destinations.map(dest => (
              <ImageCard
                key={`${selectedIsland}-${dest.id}-hero`}
                imageId={`${selectedIsland}-${dest.id}-hero`}
                name={`${dest.name}`}
                category="Destinasyon Hero"
                imageUrls={imageUrls}
                editingId={editingId}
                setEditingId={setEditingId}
                handleImageUrlChange={handleImageUrlChange}
                handleFileUpload={handleFileUpload}
                uploadProgress={uploadProgress}
              />
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'gallery') {
      const island = ISLANDS_DATA[selectedIsland];
      return (
        <div>
          <div className="mb-6 flex gap-2 flex-wrap">
            {Object.entries(ISLANDS_DATA).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setSelectedIsland(key)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedIsland === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {data.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8">
            {island.destinations.map(dest => (
              <div key={`${selectedIsland}-${dest.id}-gallery`}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  {dest.name} Galerisi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map(index => (
                    <ImageCard
                      key={`${selectedIsland}-${dest.id}-img${index}`}
                      imageId={`${selectedIsland}-${dest.id}-img${index}`}
                      name={`Resim ${index + 1}`}
                      category="Galeri"
                      imageUrls={imageUrls}
                      editingId={editingId}
                      setEditingId={setEditingId}
                      handleImageUrlChange={handleImageUrlChange}
                      handleFileUpload={handleFileUpload}
                      uploadProgress={uploadProgress}
                      compact={true}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'tourHero') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOURS_CONFIG.map((tour) => (
            <ImageCard
              key={`${tour.id}-tour-hero`}
              imageId={`${tour.id}-tour-hero`}
              name={tour.name}
              category="Tur kartı & detay hero"
              imageUrls={imageUrls}
              editingId={editingId}
              setEditingId={setEditingId}
              handleImageUrlChange={handleImageUrlChange}
              handleFileUpload={handleFileUpload}
              uploadProgress={uploadProgress}
            />
          ))}
        </div>
      );
    }

    if (activeTab === 'tourItinerary') {
      const DAYS = [1, 2, 3, 4, 5, 6, 7];
      return (
        <div className="space-y-6">
          {TOURS_CONFIG.map((tour) => (
            <div
              key={tour.id}
              className="bg-white rounded-xl shadow p-4 space-y-3 border border-gray-100"
            >
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                {tour.name} - Günlük Program Arka Planları
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DAYS.map((day) => (
                  <ImageCard
                    key={`${tour.id}-itinerary-day-${day}`}
                    imageId={`${tour.id}-itinerary-day-${day}`}
                    name={`${tour.name} - Gün ${day}`}
                    category="Günlük program arka planı"
                    imageUrls={imageUrls}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    handleImageUrlChange={handleImageUrlChange}
                    handleFileUpload={handleFileUpload}
                    uploadProgress={uploadProgress}
                    compact={true}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'tourGallery') {
      const GALLERY_INDEXES = [0, 1, 2, 3, 4, 5];
      return (
        <div className="space-y-6">
          {TOURS_CONFIG.map((tour) => (
            <div
              key={tour.id}
              className="bg-white rounded-xl shadow p-4 space-y-3 border border-gray-100"
            >
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                {tour.name} - Turdan Kareler Galerisi
              </h3>
              <p className="text-xs text-gray-500">
                Buradan tur detay sayfasındaki "Turdan Kareler" bölümünde görünen görselleri yönetebilirsiniz.
                Bu tur için hiç resim eklemezseniz, varsayılan galeri görselleri kullanılmaya devam eder.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {GALLERY_INDEXES.map((index) => (
                  <ImageCard
                    key={`${tour.id}-tour-gallery-${index}`}
                    imageId={`${tour.id}-tour-gallery-${index}`}
                    name={`Galeri Resmi ${index + 1}`}
                    category="Turdan Kareler galerisi"
                    imageUrls={imageUrls}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    handleImageUrlChange={handleImageUrlChange}
                    handleFileUpload={handleFileUpload}
                    uploadProgress={uploadProgress}
                    compact={true}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'staticPublic') {
      return (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Sabit (public) Görseller</h3>
            <p className="text-xs text-gray-500">
              Bu kartlar, projedeki bazı varsayılan public görselleri Cloudinary&apos;ye yükleyip URL&apos;yi Firestore&apos;a kaydetmenizi sağlar.
              Böylece ilgili dosyaları public klasöründen silebilirsiniz.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STATIC_PUBLIC_IMAGES.map((img) => (
              <ImageCard
                key={img.imageId}
                imageId={img.imageId}
                name={img.name}
                category={img.category}
                imageUrls={imageUrls}
                editingId={editingId}
                setEditingId={setEditingId}
                handleImageUrlChange={handleImageUrlChange}
                handleFileUpload={handleFileUpload}
                uploadProgress={uploadProgress}
              />
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'tabGallery') {
      const island = ISLANDS_DATA[selectedIsland];
      const TAB_CONFIG = [
        { id: 'gezilecek', label: 'Gezilecek Yerler' },
        { id: 'aktiviteler', label: 'Aktiviteler' },
        { id: 'yiyecek', label: 'Yiyecek & İçecek' },
        { id: 'konaklama', label: 'Konaklama' },
        { id: 'alisveris', label: 'Alışveriş' },
      ];

      return (
        <div>
          <div className="mb-6 flex gap-2 flex-wrap">
            {Object.entries(ISLANDS_DATA).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setSelectedIsland(key)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  selectedIsland === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {data.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-10">
            {island.destinations.map((dest) => (
              <div key={`${selectedIsland}-${dest.id}-tabs`} className="border rounded-xl p-4 bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                  {dest.name} - Sekme Görselleri
                </h3>

                <div className="space-y-6">
                  {TAB_CONFIG.map((tab) => (
                    <div key={tab.id}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                        <span>{tab.label}</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[0, 1, 2].map((index) => {
                          const imageId = `${selectedIsland}-${dest.id}-${tab.id}-img${index}`;
                          return (
                            <ImageCard
                              key={imageId}
                              imageId={imageId}
                              name={`${tab.label} - Resim ${index + 1}`}
                              category={`Sekme: ${tab.label}`}
                              imageUrls={imageUrls}
                              editingId={editingId}
                              setEditingId={setEditingId}
                              handleImageUrlChange={handleImageUrlChange}
                              handleFileUpload={handleFileUpload}
                              uploadProgress={uploadProgress}
                              compact={true}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'tours') {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Buradan tur kartlarında görünen <span className="font-semibold">tur tarih aralıklarını</span>,
            <span className="font-semibold"> kişi başı normal fiyatları</span> ve isteğe bağlı
            <span className="font-semibold"> kampanya / indirim ayarlarını</span> güncelleyebilirsiniz.
            Değişiklikler kaydedildikten sonra ziyaretçi tarafındaki tur paketleri sayfasına yansır.
          </p>

          {toursLoading ? (
            <p className="text-sm text-gray-500">Tur ayarları yükleniyor...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toursSettings.map((tour) => (
                <div
                  key={tour.id}
                  className="bg-white rounded-xl shadow p-4 space-y-3 border border-gray-100"
                >
                  <h3 className="text-base font-semibold text-gray-800 mb-1">{tour.name}</h3>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tur Tarih Aralığı
                    </label>
                    <input
                      type="text"
                      value={tour.dateRange}
                      onChange={(e) => handleTourFieldChange(tour.id, 'dateRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
	                  placeholder="Örn: 28 Mart - 3 Nisan 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Kişi Başı Normal Fiyat (USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={tour.price}
                      onChange={(e) => handleTourFieldChange(tour.id, 'price', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Örn: 3200"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        İndirim Oranı (%) - Opsiyonel
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={tour.discountPercent}
                        onChange={(e) => handleTourFieldChange(tour.id, 'discountPercent', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Örn: 20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Kampanya Etiketi (Görsel Üstü) - Opsiyonel
                      </label>
                      <input
                        type="text"
                        value={tour.promoLabel}
                        onChange={(e) => handleTourFieldChange(tour.id, 'promoLabel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Örn: Babalar Günü'ne Özel %20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveTours}
              disabled={toursSaving}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {toursSaving ? 'Kaydediliyor...' : 'Tur Ayarlarını Kaydet'}
            </button>
            {toursMessage && (
              <p className="text-xs text-gray-600">{toursMessage}</p>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'shorts') {
      return (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Tur Sayfası – YouTube Shorts (4 video)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Bu alana gireceğiniz URL\'ler tur kartlarının altında 2x2 olarak gözükecek ve video site içinde oynatılacaktır (YouTube\'a yönlendirme yok).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border rounded-xl p-4 bg-gray-50">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Video {i + 1} URL</label>
                <input
                  type="url"
                  value={youtubeShortUrls[i] || ''}
                  onChange={(e) => handleYoutubeShortUrlChange(i, e.target.value)}
                  placeholder="https://youtube.com/shorts/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel — Evlilik & Eşleştirme</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {firestoreBlocked && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              <strong>Firestore erişimi engellendi:</strong> {firestoreBlockedReason || 'Missing or insufficient permissions.'}
            </p>
            <p className="text-xs text-amber-800 mt-1">
              Not: Görsel yükleme (Cloudinary) çalışır; fakat Firestore yazma/okuma kapalıysa "Kaydet" sadece bu tarayıcıda (localStorage) etkili olur.
            </p>
          </div>
        )}
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 overflow-x-auto">
          {weddingOnly && (
            <>
              <button
                onClick={() => setActiveTab('matchmaking')}
                className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                  activeTab === 'matchmaking'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Evlilik Başvuruları
                {matchmakingNewCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-rose-600 text-white text-xs">
                    {matchmakingNewCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('identity')}
                className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                  activeTab === 'identity'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Kimlik Doğrulama
                {identityPendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-amber-600 text-white text-xs">
                    {identityPendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                  activeTab === 'payments'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Ödemeler
                {paymentsPendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-rose-600 text-white text-xs">
                    {paymentsPendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('photoUpdates')}
                className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                  activeTab === 'photoUpdates'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Fotoğraf İstekleri
                {photoUpdatesPendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-rose-600 text-white text-xs">
                    {photoUpdatesPendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('matches')}
                className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                  activeTab === 'matches'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Eşleşmeler
                {activeMatchesCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-slate-700 text-white text-xs">
                    {activeMatchesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('userTools')}
                className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                  activeTab === 'userTools'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Kullanıcı Yönetimi
              </button>

              <button
                onClick={() => setActiveTab('weddingMedia')}
                className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                  activeTab === 'weddingMedia'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Evlilik Görselleri
              </button>
            </>
          )}

          {!weddingOnly && (
            <>
          <button
            onClick={() => setActiveTab('islands')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'islands'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Ada Hero Görselleri
          </button>
          <button
            onClick={() => setActiveTab('destHero')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'destHero'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Destinasyon Hero Banner
          </button>
          <button
            onClick={() => setActiveTab('destinations')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'destinations'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Destinasyon Görselleri
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Galeri Görselleri
          </button>
          <button
            onClick={() => setActiveTab('tourHero')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'tourHero'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Tur Hero Görselleri
          </button>
          <button
            onClick={() => setActiveTab('tourItinerary')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'tourItinerary'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Günlük Program Arka Planları
          </button>
          <button
            onClick={() => setActiveTab('tourGallery')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'tourGallery'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Tur Detay Galerileri
          </button>
          <button
            onClick={() => setActiveTab('tourHero')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'tourHero'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Tur Hero Görselleri
          </button>
          <button

            onClick={() => setActiveTab('tabGallery')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'tabGallery'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Sekme Görselleri
          </button>
          <button
            onClick={() => setActiveTab('tours')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'tours'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Tur Paketleri
          </button>
          <button
            onClick={() => setActiveTab('staticPublic')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'staticPublic'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Sabit (Public) Görseller
          </button>
          <button
            onClick={() => setActiveTab('matchmaking')}
            className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
              activeTab === 'matchmaking'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Evlilik Başvuruları
            {matchmakingNewCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-rose-600 text-white text-xs">
                {matchmakingNewCount}
              </span>
            )}
          </button>
    <button
      onClick={() => setActiveTab('reservations')}
      className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
        activeTab === 'reservations'
          ? 'text-indigo-600 border-b-2 border-indigo-600'
          : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      Rezervasyonlar
    </button>
	  <button
	    onClick={() => setActiveTab('shorts')}
	    className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
	      activeTab === 'shorts'
	        ? 'text-indigo-600 border-b-2 border-indigo-600'
	        : 'text-gray-600 hover:text-gray-800'
	    }`}
	  >
	    YouTube Shorts
	  </button>
            </>
          )}
        </div>
        {/* Content */}
        {renderContent()}

        {/* Save Button */}
        {!weddingOnly && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-8">
            <button
              onClick={handleSave}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Tüm Değişiklikleri Kaydet
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      {!weddingOnly && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 max-w-7xl mx-auto mb-8">
          <p className="text-sm text-blue-800">
            <strong>Dosya Yükleme:</strong> Resim dosyasını seç veya URL gir. Bu projede dosyalar Cloudinary'ye yüklenip URL Firestore'a kaydedilir. 10MB üzeri görseller otomatik sıkıştırılır ve yeni boyut gösterilir.
          </p>
          <p className="text-xs text-blue-700 mt-2">
            <strong>Cloudinary durum:</strong> upload preset {cloudinaryUploadPreset ? 'OK' : 'EKSİK'} | cloud name: {cloudinaryCloudName}
          </p>
        </div>
      )}
    </div>
  );
}

// Image Card Component
function ImageCard({
  imageId,
  name,
  category,
  imageUrls,
  editingId,
  setEditingId,
  handleImageUrlChange,
  handleFileUpload,
  uploadProgress,
  compact = false
}) {
  const isEditing = editingId === imageId;
  const progress = uploadProgress[imageId];

  // Bazı kartlar doğrudan public kök dosya adıyla (örn: "foo.jpg") yönetiliyor.
  // Override yoksa, en azından mevcut public görseli önizleme olarak göster.
  const previewSrc = imageUrls[imageId] || (String(imageId).includes('.') ? `/${imageId}` : null);

  const cardClass = compact 
    ? 'bg-white rounded-lg shadow p-3' 
    : 'bg-white rounded-lg shadow-md p-6';

  const titleClass = compact 
    ? 'text-base font-semibold text-gray-800' 
    : 'text-lg font-semibold text-gray-800';

  return (
    <div className={cardClass}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className={titleClass}>{name}</h3>
          <p className="text-xs text-gray-500">{category}</p>
        </div>
        <button
          onClick={() => setEditingId(isEditing ? null : imageId)}
          className="text-indigo-600 hover:text-indigo-700"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {previewSrc && (
        <div className={`mb-3 overflow-hidden rounded-lg ${compact ? 'h-20' : 'h-40'}`}>
          <img
            src={previewSrc}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      {isEditing && (
        <div className="border-t pt-3 space-y-2">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Dosya Yükle
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, imageId)}
                className="text-xs flex-1"
              />
            </div>
            {progress && (
              <span className={`text-xs font-semibold inline-block mt-1 ${
                progress === 'Başarılı' ? 'text-green-600' :
                progress === 'Hata!' ? 'text-red-600' :
                'text-blue-600'
              }`}>
                {progress}
              </span>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              veya URL Gir
            </label>
            <input
              type="url"
              value={imageUrls[imageId] || ''}
              onChange={(e) => handleImageUrlChange(imageId, e.target.value)}
              placeholder="https://..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}
