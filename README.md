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
- Localde tarayıcı konsolunda `/api/matchmaking-... 503 (firebase_admin_not_configured)` görüyorsanız, bu backend'in Firebase Admin ile Firestore/Auth'a bağlanamadığı anlamına gelir. Çözüm:
	- Firebase Console → Project settings → Service accounts → **Generate new private key**
	- İnen JSON dosyasının yolunu `.env.local` içine yazın:
		- `FIREBASE_SERVICE_ACCOUNT_JSON_FILE=C:\\path\\to\\service-account.json`
	- `npm run dev` sürecini yeniden başlatın.
- Firestore "The query requires an index" / `FAILED_PRECONDITION` hatası alırsanız, konsoldaki linke tıklayıp index oluşturmanız gerekir. Bu projede özellikle şu sorgular index ister:
	- `matchmakingMatches`: `where('userIds','array-contains', uid)` + `orderBy('createdAt','desc')`
	- `matchmakingMatches`: `where('status','in',[...])` + `orderBy('updatedAt','desc')`
- "Missing or insufficient permissions" hatası Firestore Rules kaynaklıdır; daha kapsamlı snippet için [FIRESTORE_RULES_SNIPPET.md](FIRESTORE_RULES_SNIPPET.md) dosyasına bakın.
- Firebase Storage CORS hataları için [FIREBASE_STORAGE_CORS.md](FIREBASE_STORAGE_CORS.md) adımlarını izleyin.

## Deployment notları (uniqah.com)

- Google ile girişte `auth/unauthorized-domain` görürseniz: Firebase Console → Authentication → Settings → **Authorized domains** kısmına `uniqah.com` ve `www.uniqah.com` ekleyin.
- Prod ortamında `.env`/Vercel env değerlerinde `VITE_FIREBASE_*` değişkenlerinin (özellikle `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`) doğru Firebase projesini işaret ettiğini doğrulayın.
- Fotoğraflar/Storage istekleri CORS yüzünden bloklanıyorsa: [FIREBASE_STORAGE_CORS.md](FIREBASE_STORAGE_CORS.md) dosyasındaki adımlarla bucket CORS ayarına `uniqah.com` originlerini ekleyin.

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

## Sohbet Manuel Çeviri (DeepL)

Bu projede sohbet çevirisi **manuel** çalışır: kullanıcı "Çevir" butonuna basınca `/api/matchmaking-chat-translate` DeepL'e istek atar ve sonucu mesaj dokümanına cache'ler.

Localde çalıştırmak için `.env.local` içine şunları ekleyin (gizli anahtarları paylaşmayın):

```dotenv
TRANSLATE_PROVIDER=deepl
DEEPL_API_KEY=YOUR_DEEPL_KEY

# Free plan kullanıyorsanız:
DEEPL_API_URL=https://api-free.deepl.com/v2/translate

# Pro plan kullanıyorsanız:
# DEEPL_API_URL=https://api.deepl.com/v2/translate
```

Notlar:
- `DEEPL_API_KEY` yoksa API `501 translate_not_configured` döner ve UI "Çeviri servisi ayarlı değil" mesajını gösterir.
- Çeviri istekleri server-side yapıldığı için tarayıcı CSP ayarları DeepL'i etkilemez.
- Çeviri yetkileri ve kotalar server-side uygulanır (paket/limit mantığı).

Vercel deploy için aynı değişkenleri Vercel → Project → Settings → **Environment Variables** bölümüne ekleyip yeniden deploy edin.

## Sohbet Manuel Çeviri (Gemini)

Gemini entegrasyonu **server-side** çalışır (API key tarayıcıya gitmez). Çeviri butonuna basınca `/api/matchmaking-chat-translate` Gemini'ye istek atar ve sonucu mesaj dokümanına cache'ler.

Gerekli env:

```dotenv
# Gemini'yi aktif etmek için:
GEMINI_API_KEY=YOUR_GEMINI_KEY

# Opsiyonel: model seçimi (uyumsuzsa farklı model deneyin)
GEMINI_TRANSLATE_MODEL=gemini-3-flash

# Opsiyonel: yalnızca GEMINI_TRANSLATE_MODEL kullan (fallback model deneme kapalı)
# GEMINI_STRICT_MODEL=1

# Opsiyonel: model uyumluluğu için v1beta/models ile discovery yap (ek bir HTTP çağrısı)
# GEMINI_ENABLE_MODEL_DISCOVERY=1

# Opsiyonel: server-side RPM guard (global). Varsayılan 15.
# Billing/plan varsa yükseltin veya 0 yapıp kapatın.
# GEMINI_TRANSLATE_RPM_LIMIT=60

# Opsiyonel: Gemini rate-limit / arıza olursa fallback sağlayıcı
TRANSLATE_FALLBACK_PROVIDER=deepl
DEEPL_API_KEY=YOUR_DEEPL_KEY
```

Notlar:
- "Hazır kütüphane" (TR↔ID sık sorular) yalnızca bazı kalıpları çevirir; her cümlenin çevrilebilmesi için **harici sağlayıcı** (Gemini/DeepL/Google/LibreTranslate) env ile ayarlı olmalıdır.
- Çeviri bazı mesajlarda özellikle **telefon/e‑posta/URL** gibi kişisel bilgi (PII) algılanırsa güvenlik nedeniyle `pii_blocked` ile bilinçli olarak engellenir.
- Gemini için dakikada istek limiti (RPM) uygulanır (`GEMINI_TRANSLATE_RPM_LIMIT`); aşılırsa `translate_rate_limited` dönebilir ve fallback sağlayıcı ayarlıysa otomatik düşer.
- `429 RESOURCE_EXHAUSTED` görüyorsanız bu Gemini tarafında quota/rate limit'e takıldığınız anlamına gelir. Kullanımı/limitleri kontrol edin: https://ai.dev/rate-limit

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
