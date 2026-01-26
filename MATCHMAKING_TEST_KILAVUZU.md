# Matchmaking – Test Kılavuzu (Smoke Test)

Bu repo’da bir sürü akış değiştiği için, “çalışıyor mu?” sorusunu iki katmanda ele almak en sağlıklısı:

1) **Otomatik doğrulama** (build / syntax check)
2) **Sistem içi smoke test** (2 test hesabıyla kritik akışları hızlıca gezmek)

> Not: `npm run lint:full` şu an repo genelinde çok sayıda eski uyarı/hata verdiği için (baseline), “çalışırlık teyidi” için tek başına güvenilir bir sinyal değil. Bunun yerine hedefli kontroller + build + smoke test kullanıyoruz.

---

## 1) Otomatik doğrulama (lokalde)

PowerShell:

- Ortam dosyasını hazırla:
  - `npm run ensure:env`

- Frontend build al:
  - `npm run build`

- API route dosyalarında parse/syntax kontrolü (çalıştırmadan):
  - `node --check apiRoutes\matchmaking-quick-questions.js`
  - `node --check apiRoutes\matchmaking-chat-release-held.js`
  - `node --check apiRoutes\matchmaking-decision.js`
  - `node --check api\[...route].js`

İstersen Panel + i18n hedefli lint:
- `npx eslint src\pages\Panel.jsx`
- `npx eslint src\i18nResources\tr.js src\i18nResources\en.js src\i18nResources\id.js`

---

## 2) Test ortamı hazırlama (lokalde gerçek akış için)

Matchmaking akışları `/api` üzerinden Firebase Admin kullandığı için **service account şart**.

### 2.1 .env.local ayarları

- `npm run ensure:env`
- `.env.local` içinde şunu doldur:
  - `FIREBASE_SERVICE_ACCOUNT_JSON_FILE=C:\...\firebase-service-account.json`

> Service account: Firebase Console → Project settings → Service accounts → Generate new private key

### 2.2 Seed data + test kullanıcıları

Seed script artık opsiyonel olarak **Firebase Auth kullanıcılarını da** oluşturabiliyor.

- 3 adet seed eşleşme üret (Auth dahil):
  - `npm run seed:matchmaking -- --count=3 --withAuth --password=Test1234!`

Çıktıda `seedBatchId` ve kullanıcı uid/email’leri görünür.

- Seed match’lerden 1 tanesini “mutual_accepted”a yükselt (ileriki adımları test etmek için):
  - `npm run seed:promote-matches -- --limit=1 --to=mutual_accepted --interaction=chat`

- İstersen contact açılmış bir senaryo da üret:
  - `npm run seed:promote-matches -- --limit=1 --to=contact_unlocked`

### 2.3 Lokal çalıştırma

- `npm run dev`

Sonra browser’da iki farklı profil ile giriş yap:
- Email’ler seed çıktısındaki `seed.erkek.<batch>.<idx>@example.test` ve `seed.kadin.<batch>.<idx>@example.test`
- Şifre: `Test1234!` (sen değiştirdiysen o)

---

## 3) Smoke test checklist (kritik akışlar)

Aşağıdaki checklist’i 2 kullanıcıyla (A ve B) tek bir match üzerinde uygula.

### A) Proposed chat limit + karar CTA
- A ve B: proposed chat ekranına gir
- Mesajlaşmayı limit dolana kadar sürdür
- Limit dolunca:
  - “karar ver” CTA / bilgilendirme görünür
  - Mesaj gönderme engellenir (beklenen davranış)
- Translate:
  - Mesaj çevir butonu görünür ve çalışır (translate provider yoksa beklenen hata mesajı)

### B) Pause + held message
- A: sohbeti pause et (pause UI)
- B: mesaj gönder
- A tarafında:
  - Mesaj “held” olarak gizlenir/özetlenir (mevcut tasarıma göre)
  - Banner/rozet görünür
- A: held mesajları “reveal” ile aç
- A: “release/teslim et” aksiyonu ile mesajı delivered yap

### C) Presence (son aktif)
- A ve B: sırayla sayfayı aç/kapat
- “online/son aktif” göstergesi mantıklı şekilde güncelleniyor mu kontrol et

### D) Progress stepper
- Match akışında status ilerledikçe stepper adımları güncelleniyor mu?
  - proposed → mutual_accepted → contact_unlocked

### E) Trust badges
- Kart üzerinde rozetler:
  - identity verified / pro / mutual / confirmed / contact unlocked/pending
  - “yakın zamanda aktif” rozetinin beklenen koşullarda çıkması

### F) Ret gerekçesi (opsiyonel)
- A: reject seç
- Opsiyonel reason seç (values/distance/communication/...)
- Beklenen:
  - Karar başarılı
  - (Admin/DB tarafında) `rejectionFeedback` alanı oluşur

### G) 3 kısa soru (quick questions)
- A: q1/q2/q3 için seçeneklere tıkla
- B: aynı soruları cevapla
- Beklenen:
  - “Sen / O” cevapları görünür
  - Aynı seçenek seçildiyse görsel olarak “uyum” rengi (emerald) görünür

---

## 3.5) Eşleşme havuzu (pool) – madde madde kontrol listesi

Bu sistemin “ana iskeleti” iki koleksiyon üzerinden ilerliyor:

- `matchmakingApplications`: Kullanıcının başvurusu (eşleşme üretiminde "seeker" olarak alınır)
- `matchmakingUsers`: Kullanıcının durum/engelleri (blocked, lock, lastSeen, cooldown, membership, newUserSlot)

### A) Havuzda olmanın minimum şartları (seeker)
Bir kullanıcı "yeni eşleşme üretimi" açısından havuzda sayılabilmesi için (basitleştirilmiş):

- `matchmakingApplications` içinde bu `userId` için en az 1 doc olmalı
- Application alanları dolu olmalı: `gender`, `lookingForGender`
- `matchmakingUsers/{uid}` engelli olmamalı:
  - `blocked != true`
  - `matchmakingLock.active != true`
- Cooldown aktif olmamalı:
  - `newMatchCooldownUntilMs <= now`
- 24h pasif olmamalı:
  - `lastSeenAtMs > now-24h` (lastSeen yoksa application.createdAtMs ile fallback)

> Not: Bu liste “havuzda mı değil mi?” kontrolü için. Eşleşme üretilirken ayrıca aday (candidate) filtreleri, re-match politikası ve skor/threshold devreye girer.

### B) Aday (candidate) tarafında uygulanan filtreler (özet)
Seeker havuzdaysa bile, karşı tarafa şu filtreler uygulanır:

- Aday da engelli/kilitli/pasif olmamalı
- Karşılıklı “kim arıyorum” uyumu:
  - Adayın `lookingForGender`i seeker.gender ile uyumlu olmalı (doluysa)
  - Adayın `lookingForNationality`si seeker.nationality ile uyumlu olmalı (doluysa)
- Seeker `lookingForNationality` seçtiyse adayın nationality’si uymalı (other değilse)
- Re-match politikası: aynı ikiliyi sürekli üretmemek (reddedilenler ancak belirli cooldown ve limitlerle tekrar önerilir)
- `newUserSlot.active` varsa: sadece `sinceMs` sonrası kaydolanlardan ve `threshold` üstü skorlulardan 1 eşleşme üret

### C) “Havuzda mı?” hızlı doğrulama adımları (en pratik yol)

1) Kullanıcının uid’sini al (seed çıktısından veya Firebase Auth’tan)
2) Debug çıktısını al:
   - `npm run matchmaking:debug-user -- --uid <uid>`
3) Çıktıda `derived.eligibleForNewMatches=true` olmalı.
   - `excludedReasons` doluysa, hangi sebeple havuz dışı kaldığını net gösterir.

### D) “Match üretimi çalışıyor mu?” doğrulama adımları

1) Cron’u tetikle:
   - `npm run matchmaking:cron`
2) Response içinde şunlara bak:
   - `created` artıyor mu?
   - `expiredProposed` / `inactiveCleanup` / `autoConfirmed` beklenen senaryoda artıyor mu?
3) Firestore’da `matchmakingMatches`:
   - Yeni match’ler `status: proposed` ve `proposedExpiresAtMs` dolu mu?

### E) “Neden kimseye eşleşme gelmiyor?” en sık 6 kök sebep

- Service account yok → `/api` 503 döner (eşleşme üretimi/heartbeat akışı bozulur)
- Kullanıcı 24h pasif görünüyor (`lastSeenAtMs` eski)
- Kullanıcı cooldown’da (`newMatchCooldownUntilMs` ileri tarihte)
- Kullanıcı kilitli (`matchmakingLock.active=true`) veya blocked
- Application alanları eksik (`gender` / `lookingForGender`)
- Re-match/filtreler yüzünden uygun aday kalmıyor (özellikle nationality + karşılıklı tercihler dar ise)

### F) “Aktif eşleşme” nedir? (lock + focus)

Bu sistemde **aktif eşleşme** pratikte şu anlama gelir:

- Match `status: mutual_accepted` olur.
- İki kullanıcıya da `matchmakingLock.active=true` yazılır ve `matchmakingLock.matchId=<matchId>` olur.
- Kullanıcı bir kişiye kilitliyken:
  - Yeni eşleşme üretimi o kullanıcı için durur (cron, `matchmakingLock.active=true` gördüğü için).
  - Kullanıcının diğer `proposed` sohbetleri “beklemede/pause” durumuna alınır (heartbeat bunu otomatik işaretler).

Hızlı doğrulama:
- Firestore → `matchmakingUsers/{uid}`:
  - `matchmakingLock.active` true mu?
  - `matchmakingLock.matchId` doğru match’i mi gösteriyor?
- Firestore → `matchmakingMatches/{matchId}`:
  - `status: mutual_accepted`
  - `chatEnabledAtMs` set mi?

### G) “Kesin eşleşme” nedir? (48 saat auto-confirm)

**Kesin eşleşme** burada “status değişti” değil; match üzerinde şu alanın set olması:

- `confirmedAtMs` set → eşleşme “kesinleşmiş” sayılır.

Not: Bu noktada status **halen** `mutual_accepted` kalır (contact/chat akışları kırılmesin diye).

Cron doğrulaması:
- `npm run matchmaking:cron` sonrası match’te `confirmedAtMs` ve `confirmedReason: auto_48h` görünmeli.
- Kesinleşince iki tarafın diğer `proposed` match’leri `cancelledReason: confirmed_elsewhere` ile kapanır.

### H) Mesajlaşma akışı (proposed vs mutual_accepted)

- `proposed`:
  - Kart görünür; “kabul/ret” kararı verilebilir.
  - Mesajlaşma varsa: limit dolunca “karar ver” CTA ve gönderim engeli beklenir.
- `mutual_accepted`:
  - Chat otomatik aktif edilir (`chatEnabledAtMs` set olur).
  - İki kullanıcı da birbirine kilitlenir (`matchmakingLock`).

“Focus” davranışı (önemli):
- Kullanıcı kilitliyken, aynı kullanıcının diğer `proposed` match’lerine `proposedChatPause.active=true` yazılır.
- Kilit kalkınca, heartbeat bu pause’u otomatik kapatır.

### I) 24+ saat offline olanlar: havuza dönüş / telafi kredisi

Kuralın amacı: “aktif kullanıcı”yı bekletmemek ve havuzu temiz tutmak.

- Eğer bir match (özellikle `mutual_accepted`) taraflardan biri için **24+ saat pasif** kalırsa:
  - Match `cancelledReason: inactive_24h` ile iptal edilir.
  - İki tarafın `matchmakingLock` ve `matchmakingChoice` alanları (bu match’e bağlıysa) temizlenir.
  - Pasif olmayan tarafa `newMatchReplacementCredits +1` verilir.

Bu temizlik iki yerden tetiklenebilir:
- Cron: `npm run matchmaking:cron` (sunucu tarafı temizlik)
- Heartbeat: aktif kullanıcı sayfayı açınca (kullanıcı mağdur olmasın diye anlık temizlik)

Beklenen “havuza dahil edilme” sonucu:
- Aktif kullanıcı kilitten çıkar → tekrar eşleşme üretimine/isteğine uygun hale gelir.
- Pasif kalan kullanıcı ise yeni eşleşme üretiminde aday/seeker olarak **offline kaldığı sürece dışarıda** kalır; geri gelince heartbeat ile `lastSeenAtMs` güncellenir ve tekrar havuza döner.

---

## 4) 24/48 saat senaryoları (time-travel + cron)

Bu senaryoları “48 saat beklemeden” test etmek için 2 yardımcı araç var:

- Time-travel: `scripts/matchmaking-time-travel.mjs`
- Cron runner: `scripts/run-matchmaking-cron.mjs` (script: `npm run matchmaking:cron`)

### 4.1 Ön koşullar
- `npm run ensure:env`
- `.env.local` içinde şu değerler dolu olmalı:
  - `FIREBASE_SERVICE_ACCOUNT_JSON_FILE=...`
  - `MATCHMAKING_CRON_SECRET=...` (localde varsayılan `local-dev-secret` olarak eklenir)

### 4.2 48h: proposed TTL expire testi
1) Test edeceğin matchId’yi seç (Firestore `matchmakingMatches/{matchId}` veya seed çıktısından)
2) Proposed’ı “süresi dolmuş” hale getir:
  - `node scripts/matchmaking-time-travel.mjs --matchId <matchId> --expire-proposed`
3) Cron’u çalıştır:
  - `npm run matchmaking:cron`
4) Beklenen:
  - Match `status: cancelled`
  - `cancelledReason: ttl_expired`

### 4.3 48h: mutual_accepted auto-confirm testi
1) Match’i auto-confirm kriterine sok:
  - `node scripts/matchmaking-time-travel.mjs --matchId <matchId> --auto-confirm-48h`
2) Cron’u çalıştır:
  - `npm run matchmaking:cron`
3) Beklenen:
  - Match üzerinde `confirmedAtMs` set olur
  - `confirmedReason: auto_48h`
  - İki kullanıcı için diğer `proposed` match’ler `cancelledReason: confirmed_elsewhere` olur

### 4.4 24h: inaktif kullanıcı iptal testi
1) Bir tarafı “25 saat pasif” yap (a/b/both):
  - `node scripts/matchmaking-time-travel.mjs --matchId <matchId> --inactive-24h --inactiveSide a`
2) Cron’u çalıştır:
  - `npm run matchmaking:cron`
3) Beklenen:
  - Match `status: cancelled`
  - `cancelledReason: inactive_24h`

---

## 5) Otomatik E2E (Playwright) – yeni sistem testi

Bu repo’da yeni bir **smoke E2E** testi eklendi: login + panel yükleniyor + match kartları görünüyor.

### 5.1 Kurulum
- `npm run playwright:install`

### 5.2 Çalıştırma (Windows PowerShell)

1) Dev ortamı çalıştır:
- `npm run dev`

2) Başka bir terminalde env verip testi çalıştır:

- `$env:E2E_EMAIL="seed.erkek.<batch>.<idx>@example.test"`
- `$env:E2E_PASSWORD="Test1234!"`
- `npm run test:e2e`

Notlar:
- Base URL farklıysa: `$env:E2E_BASE_URL="http://127.0.0.1:5173"`
- Test dosyası: `tests/matchmaking.smoke.spec.js`

---

## 6) Temizlik (seed cleanup)

Seed batch’i sil:
- `npm run seed:matchmaking:cleanup -- --batch=<seedBatchId>`

Auth kullanıcılarını da silmek istersen:
- `npm run seed:matchmaking:cleanup -- --batch=<seedBatchId> --cleanup-auth`
