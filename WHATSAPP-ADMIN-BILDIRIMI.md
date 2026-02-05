# Admin WhatsApp Bildirimi (Yeni Kullanıcı)

Amaç: Yeni bir başvuru (matchmakingApplications) geldiğinde, admin WhatsApp numarasına kısa bir özet mesajı göndermek.

Bu repo içinde bunun için bir endpoint hazır:
- `POST /api/admin-new-users-whatsapp-notify`

Ek olarak, yeni **kayıt** (Firebase Auth user creation) olduğunda da WhatsApp bildirimi göndermek için ikinci endpoint vardır:
- `POST /api/admin-new-signups-whatsapp-notify`

Endpoint, yeni başvuruları `createdAtMs` alanından takip eder ve tekrar tekrar göndermemek için checkpoint'i Firestore'a yazar:
- `matchmakingAutomation/new_users_whatsapp_notify.lastNotifiedAtMs`

Kayıt bildirimi endpoint'i ise Firebase Auth `creationTime` üzerinden takip eder ve checkpoint'i Firestore'a yazar:
- `matchmakingAutomation/new_signups_whatsapp_notify.lastNotifiedAtMs`

## Çalışma Mantığı

- Scheduler (GitHub Actions cron) her 5 dakikada bir endpoint'i çağırır.
- Endpoint `requireCronSecret` ister (`MATCHMAKING_CRON_SECRET`).
- Yeni başvuru yoksa `status=noop` döner.
- Yeni başvuru varsa tek bir WhatsApp mesajı gönderir ve checkpoint'i günceller.

## Gerekli ENV (Vercel / Prod)

Bu env'leri Vercel'de **Project → Settings → Environment Variables** altına ekleyin:

- `MATCHMAKING_CRON_SECRET` (zaten varsa aynı kalabilir)
- `APP_BASE_URL` (örn: `https://uniqah.com`) (opsiyonel, link için)

Twilio WhatsApp:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM` (örn: `whatsapp:+14155238886` veya onaylı numaranız)
- `ADMIN_WHATSAPP_TO` (örn: `whatsapp:+90...`)

Not: Twilio WhatsApp için numara/sandbox/onay süreçleri gereklidir.

## GitHub Actions Kurulumu

Workflow dosyası hazır:
- `.github/workflows/cron-new-users-whatsapp.yml`

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

- `MATCHMAKING_CRON_SECRET` (Vercel'deki ile aynı)
- `CRON_BASE_URL` (örn: `https://uniqah.com`) (opsiyonel; girmezsen default uniqah.com)

Ardından Actions sekmesinden workflow'u manuel de tetikleyebilirsin (`workflow_dispatch`).

## Test

Prod'da hızlı test için (secret ile):

- `curl -X POST https://uniqah.com/api/admin-new-users-whatsapp-notify -H "X-Cron-Secret: ..." -d '{}'`

Kayıt bildirimi için:

- `curl -X POST https://uniqah.com/api/admin-new-signups-whatsapp-notify -H "X-Cron-Secret: ..." -d '{}'`

Dönen JSON'da:
- `status: "sent"` → mesaj gitti
- `status: "noop"` → yeni kayıt yok
- `error: "twilio_not_configured"` → Twilio env eksik
