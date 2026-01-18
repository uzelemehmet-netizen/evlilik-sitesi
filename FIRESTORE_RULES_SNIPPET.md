# Firestore Rules (rezervasyon + admin panel)

Bu repo içinde `firebase.json`/deploy yoksa bile, aşağıdaki rules bloğunu Firebase Console → Firestore Database → Rules ekranına yapıştırabilirsiniz.

> Admin allowlist: `uzelemehmet@gmail.com` ve `articelikkapi@gmail.com`

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
        request.auth.token.email in [
          'uzelemehmet@gmail.com',
          'articelikkapi@gmail.com'
        ]
      );
    }

    // Public read, admin write
    match /tours/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /imageUrls/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /siteSettings/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Reservations
    match /reservations/{reservationId} {
      allow create: if isNonAnonymous() && request.resource.data.userId == request.auth.uid;
      allow read: if isAdmin() || (isNonAnonymous() && resource.data.userId == request.auth.uid);
      allow update, delete: if isAdmin();
    }

    // Matchmaking Applications (signed-in create, admin-only read)
    // Not: Profil listesi herkese açık değildir; admin panel üzerinden incelenir.
    match /matchmakingApplications/{applicationId} {
      allow create: if isNonAnonymous()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.consent18Plus == true
        && request.resource.data.consentPrivacy == true
        && request.resource.data.consentPhotoShare == true;
      allow read, update, delete: if isAdmin();
    }

    // Matchmaking Users (block / lock gibi yönetim alanları)
    match /matchmakingUsers/{userId} {
      allow read: if isAdmin() || (isNonAnonymous() && request.auth.uid == userId);
      allow write: if isAdmin();
    }

    // Matchmaking Matches (kullanıcıya özel eşleşme kartları)
    // Not: Kullanıcılar sadece kendi dahil oldukları eşleşmeleri okuyabilir.
    // Karar verme işlemi client'tan direkt update ile değil, server API ile yapılmalıdır.
    match /matchmakingMatches/{matchId} {
      allow read: if isNonAnonymous() && (request.auth.uid in resource.data.userIds);
      allow create, update, delete: if isAdmin();

      // Matchmaking Chat messages
      // Not: Mesaj yazma işlemini sadece server API ile yapın (client write kapalı).
      match /messages/{messageId} {
        allow read: if isNonAnonymous() && (request.auth.uid in get(/databases/$(database)/documents/matchmakingMatches/$(matchId)).data.userIds);
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
