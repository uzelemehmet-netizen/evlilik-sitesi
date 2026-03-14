# Google Flirt Sertifikası – Sistem İşleyişi (Uçtan Uca)

Bu doküman, Uniqah eşleştirme deneyiminin (web uygulaması) kullanıcı kaydından başlayarak; başvuru, eşleşme, sohbet, iletişim paylaşımı, şikayet/moderasyon, güvenlik ve veri silme akışlarını Google’a sunulabilecek şekilde teknik doğrulukla açıklar.

## 1) Ürün özeti

Uniqah; kullanıcıların evlilik/eş arayışı için profil bilgileri üzerinden tanışmasını sağlayan bir eşleştirme platformudur.

- Web uygulaması: `https://uniqah.com/`
- Eşleştirme sayfası: `https://uniqah.com/eslestirme`
- Profil/panel (giriş gerektirir): `https://uniqah.com/profilim`

## 2) Kayıt ve giriş (Authentication)

Kullanıcılar web uygulamasında hesap oluşturabilir ve giriş yapabilir:

- E-posta/şifre ile kayıt ve giriş
- Google ile giriş

Kimlik doğrulama, Firebase Authentication ile yapılır. Uygulama, oturum durumunu dinleyerek kullanıcıyı panel/profil alanına yönlendirir.

## 3) Başvuru (Eşleştirme formu) ve kullanıcı profili

### 3.1 Başvuru formu

Eşleştirme sistemi için kullanıcıdan bir “başvuru/profil” formu alınır. Bu form; temel kimlik/profil alanları (ör. yaş, şehir, cinsiyet, medeni durum vb.) ve metin alanları (özellikle “Hakkımda” ve “Beklentiler”) içerir.

Başvuru akışı API üzerinden yürür:

- Profil no tahsisi: `/api/matchmaking-allocate-profile-no`
- “Tek seferlik” düzenleme hakkı (varsa): `/api/matchmaking-application-edit-once`
- Başvuruyu gönderme: `/api/matchmaking-application-submit`

### 3.2 Açık rıza ve yasal metinler

Başvuru sırasında kullanıcıdan; gizlilik/policy metinleri ve KVKK aydınlatma metni gibi dokümanlara erişim sağlanır ve ilgili onay/uyum metinleri gösterilir.

İlgili sayfalar:

- Gizlilik bildirimi (SPA): `https://uniqah.com/privacy`
- Dokümanlar hub (yasal dokümanlar listesi): `https://uniqah.com/documents`
- KVKK Aydınlatma Metni (TR): `https://uniqah.com/docs/kvkk-aydinlatma-metni.html`
- KVKK Information Notice (EN): `https://uniqah.com/docs/kvkk-information-notice-en.html`

### 3.3 PII / iletişim bilgisi engelleme (profil metinleri)

Başvuru metin alanlarında; iletişim bilgisi, banka/kimlik vb. hassas kişisel verilerin yazılması engellenir.

- Server tarafında PII tespiti yapılır (`detectPII`), yasaklı türler (email/telefon/link/iban/kimlik vb.) bulunduğunda başvuru reddedilir.

Bu sayede kullanıcıların daha başvuru aşamasında iletişim bilgisi paylaşması teknik olarak azaltılır.

### 3.5 Çok dil (TR/ID) profil metni

“Hakkımda” ve “Beklentiler” metinleri, uygun konfigürasyon varsa server tarafında karşı dile çevrilerek saklanabilir. Böylece iki taraf farklı diller konuşsa bile profil metinleri daha anlaşılır hale getirilebilir.

Not: Sohbet çevirisi ayrı bir akıştır (bkz. 6.4).

## 4) Uygunluk (Eligibility) ve temel kısıtlar

Sistem; belirli aksiyonları gerçekleştirebilmek için server tarafında uygunluk kontrolleri uygular.

- Minimum yaş politikası (env ile yönetilir; varsayılan minimum yaş kuralı mevcuttur)
- Profil tamamlama zorunluluğu: profil/başvuru metinleri tamamlanmadan etkileşim (mesaj/istek) engellenir
- Üyelik gereksinimi: bazı etkileşimlerde üyelik gerekebilir; bazı durumlarda (örn. belirli cinsiyet) ücretsiz aktiflik kuralı devreye girebilir

Bu kontroller, hem istemci UI’da hem de server API seviyesinde uygulanır.

## 5) Eşleşme ve keşif (Pool + Matches)

Uniqah’ta iki ana keşif/eşleşme yüzeyi vardır:

### 5.1 Havuz (Pool) – aday profilleri keşfetme

Kullanıcı, havuz ekranında (`/app/pool`) kendisine uygun adayları listeler:

- Aday listesini getirme: `/api/matchmaking-browse`
- Kullanıcı bir aday için “ön eşleşme/erişim isteği” gönderebilir: `/api/matchmaking-pre-match-request`
- Karşı taraf bu isteği onaylayabilir veya reddedebilir: `/api/matchmaking-pre-match-respond`

Bu istekler ve durumları Firestore’da kullanıcı alt koleksiyonlarında tutulur:

- Gönderilen istekler: `matchmakingUsers/{uid}/outboxPreMatchRequests`
- Gelen istekler: `matchmakingUsers/{uid}/inboxPreMatchRequests`

Onaylanan akışlarda kullanıcı ilgili eşleşme kartına yönlendirilir.

### 5.2 Eşleşmeler (Matches) – sistem tarafından oluşturulan eşleşme kartları

Sistem; server-side bir süreç ile eşleşme dokümanları oluşturabilir ve yönetebilir. Admin tarafında eşleştirme süreci tetiklenebilir:

- Admin tetikleme: `/api/admin-matchmaking-run-now` (admin yetkisi ile)
- Eşleştirme motoru: `/api/matchmaking-run` (cron/secret ile korunur)

Kullanıcı tarafında eşleşmeler Firestore’dan takip edilir:

- Eşleşme dokümanları: `matchmakingMatches` koleksiyonu

## 6) Karar, sohbet ve eşleşme yaşam döngüsü

Eşleşme dokümanlarında durum (status) bazlı bir yaşam döngüsü bulunur (ör. `proposed`, `mutual_interest`, `mutual_accepted`, `contact_unlocked`).

### 6.1 Beğeni / karar verme

Kullanıcı eşleşme için karar verir:

- Karar gönderme (accept/reject vb.): `/api/matchmaking-decision`

Karar akışı sonrasında, iki tarafın karşılıklı ilgisi oluşursa sistem “mutual interest” aşamasına geçebilir.

### 6.2 İki adımlı aktivasyon ve “tek aktif eşleşme” kuralı

Karşılıklı ilgi oluştuğunda, eşleşmenin aktifleşmesi iki adımlı bir akışla yapılır:

- Aktifleştirme isteği: `/api/matchmaking-active-start`

Kurallar:

- Sadece iki taraf da “aktif başlatma” yaptığında eşleşme `mutual_accepted` olur.
- Sistem, kullanıcıya aynı anda sadece 1 aktif eşleşme kilidi uygular (`matchmakingLock`).
- Aktif eşleşme varken başka profillerle etkileşim sınırlanır.

### 6.3 Mesajlaşma (Chat) – kısa/uzun sohbet

Mesaj gönderimi server tarafından yapılır:

- Mesaj gönderme: `/api/matchmaking-chat-send`
- Okundu işaretleme: `/api/matchmaking-chat-mark-read`

Sistem iki sohbet modunu uygular:

- Kısa sohbet: Aktif eşleşme değilken veya belirli durumlarda sınırlı sayıda ve daha kısa mesaj
- Uzun sohbet: Sadece aktif eşleşme kilidi kullanıcıda iken ve eşleşme `mutual_accepted`/`contact_unlocked` durumundayken açılır

Ayrıca güvenlik/uyumluluk için mesaj içeriğinde iletişim bilgisi benzeri paylaşımlar filtrelenir (link, sosyal medya, telefon vb. tespiti → `filtered`).

### 6.4 Sohbet çevirisi

Kullanıcı isterse gelen mesajı hedef dile çevirebilir:

- Mesaj çeviri isteği: `/api/matchmaking-chat-translate`

Not: Çeviri; otomatik “mesajı karşı tarafa başka dilde zorla iletme” şeklinde değil, kullanıcı isteğiyle görüntüleme amaçlıdır.

### 6.5 İptal/sonlandırma

Aktif eşleşmeyi iptal akışı:

- Aktif iptal isteği: `/api/matchmaking-active-cancel`

Bu akış, aktif eşleşme kilidinin yönetimi ve kullanıcıların tekrar eşleşme havuzuna dönebilmesi için kullanılır.

## 7) İletişim bilgisi paylaşımı (WhatsApp) – 48 saat kuralı + onay

Uniqah, kullanıcıların iletişim bilgisi paylaşmasını kontrollü ve gecikmeli bir akışla yönetir.

### 7.1 48 saat kilidi (zorunlu site içi iletişim)

Yeni modelde, ilk 48 saat boyunca site içi sohbet (in-app chat) esastır. İletişim bilgisi alma/paylaşma işlemleri, chat başlangıcından itibaren 48 saat geçmeden açılmaz.

- Bu kilit, server tarafında süre hesabıyla uygulanır.

### 7.2 Eşleşme “confirm” (iki tarafın onayı)

48 saat sonrasında kullanıcılar eşleşmeyi onaylayabilir:

- Eşleşmeyi onaylama: `/api/matchmaking-confirm`

Bu endpoint, iki taraf da onay verdiğinde eşleşmeye `confirmedAtMs` gibi alanlar yazar.

### 7.3 İletişim isteği ve karşı taraf onayı

İletişim paylaşımı iki adımlıdır:

1) İletişim isteği:
- `/api/matchmaking-contact-request`

2) Karşı tarafın onayı:
- `/api/matchmaking-contact-approve`

Onay gerçekleştiğinde eşleşme mesajlarına sistem mesajı olarak “contact_shared” türünde bir kayıt düşülür ve WhatsApp numaraları bu akış üzerinden kontrollü şekilde kullanılabilir hale gelir.

### 7.4 İletişim bilgisini görüntüleme

İletişim bilgisi alma (server’dan çekme):

- `/api/matchmaking-contact`

Koşullar:

- 48 saat kilidi geçmiş olmalı
- İletişim isteği onaylanmış olmalı (veya eski uyumluluk için bazı “contact_unlocked” eşleşmelerde otomatik kabul)

Bu sayede kullanıcıların erken aşamada platform dışına yönlenmesi teknik olarak azaltılır.

## 8) Şikayet/geri bildirim ve moderasyon

Kullanıcılar platform içinden şikayet/geri bildirim (ticket) oluşturabilir:

- Ticket oluşturma: `/api/matchmaking-feedback-submit`
- Opsiyonel: ekran görüntüsü yükleme (Cloudinary entegrasyonu kullanılabilir)

Admin panelinde bu ticket’lar listelenir ve durum güncellenebilir:

- Listeleme: `/api/admin-feedback-list`
- Güncelleme: `/api/admin-feedback-update`

Bu akış; spam, uygunsuz davranış, kural ihlali ve güvenlik incelemeleri için moderasyon imkanı sağlar.

## 9) Kimlik doğrulama (opsiyonel)

Kullanıcı panelinde kimlik doğrulama opsiyonel bir akıştır. UI’da iki yöntem bulunabilir:

- Belge yükleyerek doğrulama (kimlik/selfie gibi)
- WhatsApp üzerinden doğrulama akışı (konfigüre ise)

Amaç; güven ve doğruluk seviyesini artırmak, sahte hesapları azaltmaktır.

## 10) Veri güvenliği, gizlilik ve KVKK

### 10.1 KVKK ve gizlilik sayfaları

Kullanıcılar yasal metinlere her zaman erişebilir:

- Gizlilik: `https://uniqah.com/privacy`
- Dokümanlar: `https://uniqah.com/documents`
- KVKK (TR): `https://uniqah.com/docs/kvkk-aydinlatma-metni.html`

### 10.2 Veri minimizasyonu ve PII kontrolleri

- Profil metinlerinde iletişim/banka/kimlik gibi hassas bilgilerin girilmesi engellenir.
- Sohbette link/sosyal medya/telefon gibi iletişim bilgisi benzeri paylaşımlar filtrelenir.
- İletişim bilgisi paylaşımı, 48 saat + istek/onay mekanizması ile kontrollü yapılır.

## 11) Hesap silme ve veri silme

Kullanıcı kendi hesabını silebilir:

- Hesap silme endpoint’i: `/api/matchmaking-account-delete`

Güvenlik önlemleri:

- Kullanıcının belirli bir onay cümlesini yazması (TR/EN/ID destekli)
- Son onay (confirmFinal)

Silme işlemi kapsamında:

- Kullanıcıya ait başvuru/ödeme/rezervasyon gibi ilişkili dokümanlar silinir (best-effort)
- Eşleşmeler, diğer kullanıcıyı kırmamak için silinmek yerine “deleted_user” benzeri durumla işaretlenir
- Firebase Auth üzerindeki kullanıcı hesabı silinir

## 12) Google başvurusu için referans URL’ler

- Ürün ana sayfa: `https://uniqah.com/`
- Eşleştirme: `https://uniqah.com/eslestirme`
- Profil/panel: `https://uniqah.com/profilim`
- Gizlilik: `https://uniqah.com/privacy`
- Dokümanlar hub: `https://uniqah.com/documents`
- KVKK (TR): `https://uniqah.com/docs/kvkk-aydinlatma-metni.html`

Ek: Google form alanlarına kopyala-yapıştır URL listesi için ayrıca `GOOGLE-FLIRT-SERTIFIKA_URL_LISTESI.md` dokümanını kullanabilirsiniz.
