# Firestore Rules (evlilik + admin panel)

Bu repo içinde `firebase.json`/deploy yoksa bile, aşağıdaki rules bloğunu Firebase Console → Firestore Database → Rules ekranına yapıştırabilirsiniz.

> Admin allowlist: kendi admin e-postalarınızı buraya yazın.

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isNonAnonymous() {
      return isSignedIn() && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }

    function isAdmin() {
      return isNonAnonymous() && (
        request.auth.token.email.lower() in [
          'uzelemehmet@gmail.com',
          'articelikkapi@gmail.com'
        ]
      );
    }

    // Varsayılan yaklaşım: sadece aşağıdaki matchmaking koleksiyonlarına izin ver.

    // Matchmaking Applications (signed-in create, admin-only read)
    // Not: Profil listesi herkese açık değildir; admin panel üzerinden incelenir.
    match /matchmakingApplications/{applicationId} {
      allow create: if isNonAnonymous()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.consent18Plus == true
        && request.resource.data.consentPrivacy == true
        && request.resource.data.consentTerms == true
        && request.resource.data.consentPhotoShare == true;

      // Kullanıcı kendi başvurusunu panelde görebilmelidir.
      allow read: if isAdmin() || (isNonAnonymous() && resource.data.userId == request.auth.uid);

      // Düzenleme/silme sadece admin (başvuru PII içerir; kullanıcı tarafında değişiklik yönetimini basit tutuyoruz).
      allow update, delete: if isAdmin();
    }

    // Matchmaking Users (block / lock gibi yönetim alanları)
    match /matchmakingUsers/{userId} {
      function isSelf() {
        return isNonAnonymous() && request.auth.uid == userId;
      }

      function isValidGenderWrite() {
        return request.resource.data.gender in ['male', 'female'];
      }

      // Kullanıcı kendi dokümanını okuyabilir.
      allow read: if isAdmin() || isSelf();

      // Kullanıcı kayıtta sadece gender (+ timestamp) set edebilir.
      allow create: if isSelf()
        && request.resource.data.keys().hasOnly(['gender', 'createdAt', 'updatedAt'])
        && isValidGenderWrite()
        && request.resource.data.createdAt == request.time
        && request.resource.data.updatedAt == request.time;

      // Sonradan gender değişimi kapalı: sadece ilk set (boş/null ise).
      allow update: if isAdmin() || (isSelf()
        && (resource.data.gender == null || resource.data.gender == '')
        && request.resource.data.diff(resource.data).changedKeys().hasOnly(['gender', 'updatedAt'])
        && isValidGenderWrite()
        && request.resource.data.updatedAt == request.time
      );

      allow delete: if isAdmin();
    }

    // Matchmaking Matches (kullanıcıya özel eşleşme kartları)
    // Not: Kullanıcılar sadece kendi dahil oldukları eşleşmeleri okuyabilir.
    // Karar verme işlemi client'tan direkt update ile değil, server API ile yapılmalıdır.
    match /matchmakingMatches/{matchId} {
      // Admin panel tüm eşleşmeleri listeleyebilmelidir.
      allow read: if isAdmin() || (isNonAnonymous() && (request.auth.uid in resource.data.userIds));
      allow create, update, delete: if isAdmin();

      // Matchmaking Chat messages
      // Not: Mesaj yazma işlemini sadece server API ile yapın (client write kapalı).
      match /messages/{messageId} {
        allow read: if isAdmin() || (isNonAnonymous() && (request.auth.uid in get(/databases/$(database)/documents/matchmakingMatches/$(matchId)).data.userIds));
        allow create, update, delete: if false;
      }
    }

    // Matchmaking Payments (ödeme bildirimleri)
    // Not: Bu projede ödeme bildirimi ve onay işlemleri server-side API ile yapılıyor.
    // Kullanıcı sadece kendi ödeme kaydını okuyabilir (opsiyonel), admin hepsini okuyup günceller.
    match /matchmakingPayments/{paymentId} {
      allow read: if isAdmin() || (isNonAnonymous() && resource.data.userId == request.auth.uid);
      allow create: if false;
      allow update, delete: if isAdmin();
    }

    // Counters (profil numarası sayaçları)
    // Not: Bu sayaçlar yalnızca server-side transaction ile güncellenmeli.
    match /counters/{id} {
      allow read, write: if isAdmin();
    }

    // Wedding page content (hero/galeri görselleri gibi public içerikler)
    // Not: Herkese okuma açık; sadece admin yazabilir.
    match /weddingContent/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Admin panel config dokümanları
    // Not: Bazı dashboard ekranları bu dokümanları okumaya çalışır.
    match /imageUrls/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /siteSettings/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Reservations (kullanıcı kendi rezervasyonunu oluşturur; admin hepsini görür/yönetir)
    match /reservations/{reservationId} {
      allow create: if isNonAnonymous()
        && request.resource.data.userId == request.auth.uid;
      allow read: if isAdmin() || (isNonAnonymous() && resource.data.userId == request.auth.uid);
      allow update, delete: if isAdmin();
    }

    // Her şeyin sonu: açıkça kapat (kaza ile yeni koleksiyon açılmasın)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Firebase Storage Rules (foto yükleme) (opsiyonel)

Eğer fotoğrafları Firebase Storage'a yüklüyorsanız, en azından dosya tipi/boyutu kısıtlaması ekleyin:

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    function isNonAnonymous() {
      return isSignedIn() && request.auth.token.firebase.sign_in_provider != 'anonymous';
    }

    function isAdmin() {
      return isNonAnonymous() && (
        request.auth.token.email in [
          'uzelemehmet@gmail.com',
          'articelikkapi@gmail.com'
        ]
      );
    }

    // Signed-in upload (application photo), admin read
    match /matchmakingApplications/{applicationId}/{fileName} {
      allow read: if isAdmin();
      allow write: if isNonAnonymous()
        && request.resource.size < 2 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

Notlar:
- Bu yaklaşım email allowlist ile hızlı güvenlik sağlar.
- Daha sağlam model için admin kullanıcılarına Firebase Custom Claims (ör. `admin: true`) vermek daha iyidir.

## App Check (bot/spam azaltma) (önerilir)

Matchmaking formu gibi herkese açık formlarda bot/spam riskini azaltmak için **Firebase App Check** etkinleştirebilirsiniz.

- Firebase Console → App Check bölümünden **Firestore** ve **Storage** için App Check’i etkinleştirin.
- Web için provider olarak **reCAPTCHA v3** seçin ve site key’i alın.
- Bu projede istemci tarafında App Check opsiyonel olarak hazır: `VITE_FIREBASE_APPCHECK_SITE_KEY` env değişkenini set ederseniz otomatik devreye girer.

Not: App Check’i Console tarafında “Enforce” ettiğinizde, geçerli App Check token’ı olmayan istekler servis tarafından reddedilir (kurallardan bağımsız).
