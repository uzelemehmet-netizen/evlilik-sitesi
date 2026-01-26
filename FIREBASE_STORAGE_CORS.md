# Firebase Storage CORS (endonezyakasifi.com / uniqah.com)

Bu proje Firebase Storage'a tarayıcıdan (web) fotoğraf yüklüyor. Kendi domain'iniz (örn. `https://www.endonezyakasifi.com`) üzerinden upload yaparken aşağıdaki hata görülürse:

- `has been blocked by CORS policy` 
- `Response to preflight request doesn't pass access control check`

**sebep büyük ihtimalle Storage bucket CORS ayarının bu origin'i izinli görmemesidir.**

## 1) CORS JSON dosyası

Repo içinde hazır dosya var: `cors.firebase-storage.json`

Not: Bu dosyada `https://uniqah.com` ve `https://www.uniqah.com` originleri de tanımlıdır.

İçeriği (gerekirse domain ekleyin):

```json
[
  {
    "origin": [
      "https://endonezyakasifi.com",
      "https://www.endonezyakasifi.com",
      "http://localhost:5173",
      "http://localhost:4173"
    ],
    "method": ["GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"],
    "responseHeader": ["Content-Type", "Authorization", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
```

## 2) gsutil ile bucket'a uygula

Bucket adı bu projede genelde:

- `gs://web-sitem-new-firebase.appspot.com`

Komut:

```bash
gsutil cors set cors.firebase-storage.json gs://web-sitem-new-firebase.appspot.com
```

Kontrol:

```bash
gsutil cors get gs://web-sitem-new-firebase.appspot.com
```

## 3) Windows notu

`gsutil` için Google Cloud SDK kurulumu gerekir:

- https://cloud.google.com/sdk/docs/install

Kurulum sonrası `gcloud auth login` ve gerekirse `gcloud config set project <PROJECT_ID>` yapın.

## 4) Hâlâ olmuyorsa

- Firebase Storage rules (izin) `storage/unauthorized` üretebilir.
- Admin panelinde fotoğraf URL'leri de aynı CORS/rules nedeniyle yüklenemeyebilir.

Tarayıcı konsolundaki hatada `storage/...` kodu ve HTTP status görülüyorsa onu paylaşın.
