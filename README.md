# Endonezya Turizm Web Sitesi

Vite + React ile inşa edilmiş basit ve hızlı bir web sitesi.

## Özellikler

- ✨ 8 sayfa (Ana Sayfa, Hakkımızda, Seyahat, Evlilik, İletişim, YouTube, Gizlilik, 404)
- 📱 Responsive tasarım (Tailwind CSS)
- 🚀 Çok hızlı (Vite build)
- ⚡ Client-side routing (React Router)
- 📝 İletişim ve Seyahat formu

## Kurulum

```bash
npm install
npm run dev
```

## Local Dev Notları (/api + Firebase)

Bu proje bazı işlemler için `/api/*` endpoint'lerini çağırır (ör. Cloudinary imzası, heartbeat vb.). Localde tarayıcı konsolunda `/api/... 404` görüyorsanız backend'i ayrıca çalıştırmanız gerekir:

```bash
npm run dev:api
```

Notlar:
- Vite dev server, `/api` isteklerini varsayılan olarak `http://localhost:3000` adresine proxy'ler. İsterseniz `VITE_API_PROXY_TARGET` ile değiştirebilirsiniz.
- Firestore "The query requires an index" / `FAILED_PRECONDITION` hatası alırsanız, konsoldaki linke tıklayıp index oluşturmanız gerekir. Bu projede özellikle şu sorgular index ister:
	- `matchmakingMatches`: `where('userIds','array-contains', uid)` + `orderBy('createdAt','desc')`
	- `matchmakingMatches`: `where('status','in',[...])` + `orderBy('updatedAt','desc')`
- "Missing or insufficient permissions" hatası Firestore Rules kaynaklıdır; daha kapsamlı snippet için [FIRESTORE_RULES_SNIPPET.md](FIRESTORE_RULES_SNIPPET.md) dosyasına bakın.
- Firebase Storage CORS hataları için [FIREBASE_STORAGE_CORS.md](FIREBASE_STORAGE_CORS.md) adımlarını izleyin.

## Admin Panel Görsel Yükleme (Cloudinary)

Admin panelde lokal dosyadan görsel yükleme için Cloudinary "unsigned upload preset" gerekir.

1. `.env.example` dosyasını `.env.local` olarak kopyalayın
2. Cloudinary Dashboard → Settings → Upload → Upload presets → **Add upload preset**
3. **Unsigned: ENABLE** edin
4. Preset adını `.env.local` içine yazın:

```dotenv
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset_name
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

Not: Vite env değişiklikleri için `npm run dev` sürecini yeniden başlatmanız gerekir.

Canlı (deploy) sitede ise `.env.local` okunmaz; `VITE_*` değişkenleri build sırasında gömülür. Bu yüzden Vercel proje ayarlarından **Environment Variables** kısmına `VITE_CLOUDINARY_UPLOAD_PRESET` (ve gerekirse `VITE_CLOUDINARY_CLOUD_NAME`) ekleyip **yeniden deploy** etmelisiniz.

## Admin Panel Firestore İzinleri

Admin panel, bazı ayarları Firestore'a okur/yazar:

- `imageUrls/imageUrls`
- `siteSettings/youtubeShorts`
- `tours/*`

Tarayıcı konsolunda `FirebaseError: Missing or insufficient permissions` görüyorsanız, bu genelde Firestore Security Rules'un bu kullanıcıya izin vermediği anlamına gelir.

Geliştirme için (minimum) örnek kural:

```txt
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		function isSignedIn() { return request.auth != null; }

		match /imageUrls/{docId} {
			allow read, write: if isSignedIn();
		}
		match /siteSettings/{docId} {
			allow read, write: if isSignedIn();
		}
		match /tours/{tourId} {
			allow read, write: if isSignedIn();
		}
	}
}
```

Üretim ortamında daha güvenli bir yaklaşım için admin kullanıcılarını **Custom Claims** ile işaretleyip sadece admin claim'ine izin vermeniz önerilir.

## Build

```bash
npm run build
npm run preview
```

## Deploy

### Vercel'e Deploy

1. [Vercel](https://vercel.com) hesabı oluşturun
2. Projeyi GitHub'a push edin
3. Vercel dashboard'da `Import Project` tıklayın
4. GitHub repo'yu seçin
5. Deploy edin

### Alternatifler

Deployment:
- Vercel: `npm run build` sonrası Vercel ile otomatik deploy (önerilen)
- GitHub Pages: Vercel yerine GitHub Pages kullanabilirsiniz
- Heroku: Static host için uygun değildir

## Dosya Yapısı

```
web-sitem-new/
├── src/
│   ├── pages/        # Sayfa komponenti
│   ├── components/   # Reusable components
│   ├── App.jsx       # Router
│   ├── main.jsx      # Entry point
│   └── index.css     # Tailwind CSS
├── public/           # Static dosyalar
├── dist/             # Build output
├── index.html        # HTML template
├── vite.config.js    # Vite config
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## Sayfalar

- `/` - Ana Sayfa
- `/about` - Hakkımızda
- `/contact` - İletişim Formu
- `/travel` - Seyahat Planı Formu
- `/wedding` - Evlilik Hizmetleri
- `/youtube` - YouTube Videoları
- `/privacy` - Gizlilik Politikası

## Teknolojiler

- React 18
- React Router 6
- Vite 5
- Tailwind CSS
- Lucide Icons

## Lisans

MIT
