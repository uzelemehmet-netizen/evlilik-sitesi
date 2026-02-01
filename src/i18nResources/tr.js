export default {
    pwa: {
      install: {
        title: 'Uygulamayı yükle',
        lead:
          'Ana ekrana ekleyerek daha hızlı açın. Mesaj, beğeni ve eşleşme isteklerinden anında haberdar olmak için bildirimleri açın.',
        installButton: 'Uygulamayı yükle',
        installed: 'Yüklendi',
        installedHint: 'Uygulama ana ekranınızda görünüyor. Dilersen bildirimleri de açabilirsiniz.',
        installAvailableHint: 'Tarayıcı yüklemeyi destekliyor. Tıklayıp kurabilirsiniz.',
        installNotAvailableHint:
          'Yükleme seçeneği görünmüyorsa: tarayıcı menüsünden “Ana ekrana ekle / Uygulamayı yükle” seçeneğini kullanın (bazı cihazlarda HTTPS ve ilk ziyaret sonrası görünür).',
        ios: {
          title: 'iPhone/iPad (Safari) için',
          step1: 'Safari ile siteyi açın.',
          step2: 'Paylaş (kare + ok) butonuna dokunun.',
          step3: '“Ana Ekrana Ekle” seçin ve ekleyin.',
        },
        notifications: {
          title: 'Bildirimler',
          lead:
            'Bildirimleri açarsanız (tarayıcı izin verirse) aşağıdaki olaylarda size bildirim gösterebiliriz:',
          button: 'Bildirimleri aç',
          testButton: 'Test bildirimi gönder',
          testHint: 'Önce bildirimleri açın (push token kaydı).',
          testTitle: 'Test bildirimi',
          testBody: 'Bu bir test bildirimidir.',
          testSent: 'Test bildirimi gönderildi (gelmesi birkaç saniye sürebilir).',
          testFailed: 'Test bildirimi gönderilemedi. (Token yok veya kurulum eksik olabilir.)',
          alreadyEnabled: 'Bildirim izni zaten açık.',
          enabled: 'Bildirimler açıldı.',
          denied: 'Bildirim izni verilmedi. Tarayıcı ayarlarından izin verebilirsiniz.',
          notSupported: 'Bu cihaz/tarayıcı bildirimleri desteklemiyor.',
          serviceWorkerNotReady: 'Bildirim altyapısı henüz hazır değil. Sayfayı yenileyip tekrar deneyin.',
          missingSetup: 'Push kurulumu eksik: VAPID anahtarı ayarlanmadı.',
          notLoggedIn: 'Bildirimleri açmak için giriş yapmalısın.',
          photos: {
            showMine: 'Fotoğraflarımı göster',
            hideMine: 'Fotoğraflarımı gizle',
            reciprocityHint: 'Not: Fotoğraflarını gizlediğin kişilerin fotoğraflarını sen de göremezsin (karşılıklılık).',
            reciprocityConfirm:
              'Fotoğraflarını gizlersen bu kişinin fotoğraflarını da göremezsin (karşılıklılık). Devam edilsin mi?',
            reciprocityBlocked: 'Fotoğraflarını gizlediğin için fotoğraflar kapalı',
          },
          photoAccess: {
            needOtherPermission: 'Fotoğrafları görmek için karşı taraftan izin almalısın.',
            request: 'Fotoğraf izni iste',
            status: {
              pending: 'İstek gönderildi (beklemede)',
              approved: 'İstek onaylandı',
              granted: 'İzin zaten verilmiş',
              unknown: 'Durum: {{status}}',
            },
            actions: {
              requested: 'İstek gönderildi',
              granted: 'İzin verildi',
            },
          },
          error: 'Bildirimler açılamadı. Lütfen tekrar deneyin.',
          note:
            'Not: Bazı cihazlarda bildirim için uygulamayı ana ekrana eklemek gerekir. Kapalıyken bildirim (push) için ayrıca kurulum gerekebilir.',
          items: {
            newMessage: 'Aktif eşleşmedeki yeni mesaj',
            newLike: 'Beğeni / etkileşim',
            profileAccess: 'Profil inceleme isteği / izin',
            shortMessage: 'Kısa mesaj / ilk mesaj',
            activeMatch: 'Aktif eşleşme isteği / onayı',
            poolCandidates: 'Havuzda yeni eşleşme adayları',
          },
        },
      },
    },
  navigation: {
    siteTitle: "Uniqah",
    siteSubtitle: "PT MoonStar Global Indonesia",
    taglineTravelOrg: "Seyahat organizasyon",
    taglineWeddingGuidance: "Evlilik rehberliği",
    home: "Ana Sayfa",
    about: "Hakkımızda",
    corporate: "Kurumsal",
    travel: "Seyahat",
    wedding: "Evlilik",
    matchmaking: "Uniqah",
    panel: "Profilim",
    documents: "Dokümanlar",
    youtube: "YouTube",
    contact: "İletişim",
    language: "Dil",
    menu: "Menü",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    close: "Kapat",
  },

  studio: {
    common: {
      back: 'Geri',
      open: 'Aç',
      close: 'Kapat',
      cancel: 'Vazgeç',
      send: 'Gönder',
      loading: 'Yükleniyor…',
      processing: 'İşleniyor…',
      readMore: 'Devamını oku',
      readLess: 'Daha az göster',
      match: 'Eşleşme',
      profile: 'Profil',
      verified: 'Doğrulanmış',
      unknown: 'Bilinmiyor',
    },

    errors: {
      generic: 'Hata',
    },

    feedback: {
      nav: 'Destek / Bildirim',
      backToProfile: 'Profilime dön',
      title: 'Destek • Öneri • Sorun bildir',
      subtitle: 'Sistemle ilgili öneri/yorum yazabilir veya çalışmayan adımları bildirebilirsin.',
      urgentNote: 'Acil şikayet ve kanıt gerektiren durumlarda hızlı yol:',
      whatsappCta: 'WhatsApp destek',
      kindLabel: 'Kategori',
      kinds: {
        bug: 'Çalışmıyor / Hata',
        suggestion: 'Öneri / Yorum',
        complaint: 'Şikayet (kısa)',
        other: 'Diğer',
      },
      matchIdLabel: 'Eşleşme ID (opsiyonel)',
      matchIdPlaceholder: 'Varsa matchId',
      stepLabel: 'Adım (opsiyonel)',
      stepPlaceholder: 'Örn: “Sohbet gönder”',
      messageLabel: 'Mesaj',
      messagePlaceholder:
        'Ne oldu, ne bekliyordun, hangi ekranda oldu? Mümkünse tarih/saat ve kısa detay ekle. (Kişisel iletişim bilgisi yazma.)',
      privacyNote: 'Mahremiyet: İletişim bilgisi paylaşma.',
      submit: 'Gönder',
      success: 'Bildirimin alındı. Teşekkürler!',
      ticketId: 'Kayıt No',
      error: 'Hata',
      footerNote: 'Not: Bu form destek ekibine iletilir. Geri dönüş süresi yoğunluğa göre değişebilir.',

      screenshotLabel: 'Ekran görüntüsü (opsiyonel)',
      screenshotDisabled: 'Ekran görüntüsü yükleme bu ortamda kapalı (Cloudinary ayarı yok).',
      selectedFile: 'Seçilen dosya',
      uploading: 'Ekran görüntüsü yükleniyor…',
      uploadFailed: 'Yükleme başarısız',

      sendToWhatsApp: 'Ticket ile WhatsApp destek',
      sendToWhatsAppHint: 'Ticket no ve matchId otomatik eklendi.',
    },

    inbox: {
      likesTitle: 'Gelen beğeniler ({{count}})',
      likeReceived: 'Sana beğeni gönderdi',
      viewProfile: 'Profili gör',
      accept: 'Beğen',
      reject: 'Reddet',
      modalTitleMessages: 'Mesajlar',
      modalTitleRequests: 'İstekler',
    },

    accessInbox: {
      title: 'Gelen istekler ({{count}})',
      requested: 'Profilini görmek için izin istiyor',
      approve: 'İzin ver',
      reject: 'Reddet',
    },

    pool: {
      title: 'Keşfet',
      backToMatches: '← Eşleşmelere dön',
      refresh: 'Yenile',
      lastUpdated: 'Otomatik yenilenir (20 sn).',
      countHint: 'Toplam: {{total}} • Gösterilen: {{shown}}',
      filtersHint: 'Yaş aralığı: {{min}} – {{max}}',
      empty: 'Bu filtrelerle gösterilecek profil bulunamadı.',
      requestProfileNow: 'Eşleşme isteği gönder',
      requesting: 'İstek gönderiliyor…',
      requestSent: 'İstek gönderildi',
      openProfile: 'Profili aç',
      profileModalTitle: 'Profil',
      actionsSoon: 'Yakında: kısa mesaj',
      notInTheirRange: 'Bu kişiyle etkileşim kurmak için onun belirlediği yaş aralığına da girmen gerekiyor.',
      notInTheirRangeShort: 'Yaş aralığı uymuyor',
    },

    paywall: {
      upgradeTitle: 'Üyelik gerekli',
      upgradeToInteract: 'Bu işlemi yapmak için aktif üyelik gerekiyor. Ücretli plana geçerek beğeni ve mesaj gönderebilirsin.',
      upgradeToReply: 'Yanıt vermek için aktif üyelik gerekiyor. Ücretli plana geçerek mesaj gönderebilirsin.',
      upgradeCta: 'Ücretli plana geç',
    },
    myInfo: {
      title: 'Bilgilerim',
      subtitle: 'Başvuruda verdiğin bilgilerin özeti.',
      noProfile: 'Profil kaydı bulunamadı.',
      appMissing: 'Başvuru formu bilgileri bulunamadı. (Uygulama kaydı ya da kullanıcı profil verisi eksik olabilir.)',
      sections: {
        basic: 'Temel bilgiler',
        contact: 'İletişim',
        details: 'Detaylar',
        partner: 'Eş adayı tercihleri',
        about: 'Kendini anlat',
        membership: 'Üyelik ve doğrulama',
      },
      fields: {
        username: 'Kullanıcı adı',
        fullName: 'Ad Soyad',
        age: 'Yaş',
        gender: 'Cinsiyet',
        city: 'Şehir',
        country: 'Ülke',
        nationality: 'Uyruk',
        whatsapp: 'WhatsApp',
        email: 'E-posta',
        instagram: 'Instagram',
        heightCm: 'Boy (cm)',
        weightKg: 'Kilo (kg)',
        occupation: 'Meslek',
        education: 'Eğitim',
        educationDepartment: 'Bölüm',
        maritalStatus: 'Medeni durum',
        hasChildren: 'Çocuğu var mı?',
        childrenCount: 'Çocuk sayısı',
        childrenLivingSituation: 'Çocuklarıyla yaşıyor mu?',
        familyApprovalStatus: 'Aile onayı',
        religion: 'Din',
        religiousValues: 'Dini hassasiyet',
        incomeLevel: 'Gelir',
        marriageTimeline: 'Evlilik zamanı',
        relocationWillingness: 'Taşınma',
        preferredLivingCountry: 'Tercih edilen ülke',
        communicationLanguage: 'İletişim dili',
        communicationLanguageOther: 'İletişim dili (diğer)',
        smoking: 'Sigara',
        alcohol: 'Alkol',
        nativeLanguage: 'Ana dil',
        nativeLanguageOther: 'Ana dil (diğer)',
        foreignLanguages: 'Yabancı diller',
        foreignLanguageOther: 'Yabancı dil (diğer)',
        lookingForGender: 'Aradığı cinsiyet',
        lookingForNationality: 'Aradığı uyruk',
        partnerAgeMin: 'Yaş (min)',
        partnerAgeMax: 'Yaş (max)',
        partnerHeightMinCm: 'Boy (min cm)',
        partnerHeightMaxCm: 'Boy (max cm)',
        partnerMaritalStatus: 'Medeni durum',
        partnerReligion: 'Din',
        partnerCommunicationMethods: 'İletişim yöntemleri',
        partnerLivingCountry: 'Yaşadığı ülke',
        partnerSmokingPreference: 'Sigara',
        partnerAlcoholPreference: 'Alkol',
        partnerChildrenPreference: 'Çocuk',
        partnerEducationPreference: 'Eğitim',
        partnerOccupationPreference: 'Meslek',
        partnerFamilyValuesPreference: 'Aile değerleri',
        about: 'Hakkında',
        expectations: 'Beklentiler',
        membershipPlan: 'Üyelik planı',
        membershipActive: 'Üyelik aktif',
        membershipValidUntil: 'Üyelik bitiş',
        identityVerified: 'Kimlik doğrulandı',
        identityStatus: 'Kimlik durumu',
        identityMethod: 'Kimlik yöntemi',
        identityRef: 'Referans',
      },
      developerView: 'Geliştirici görünümü (JSON)',
      developerHint: 'Gerektiğinde adminle paylaşabilirsin.',
    },
    match: {
      tier: {
        pre_match: 'Ön eşleşme',
      },
      status: {
        proposed: 'Ön aşama',
        mutual_interest: 'Karşılıklı beğeni',
        mutual_accepted: 'Aktif',
        contact_unlocked: 'İletişim açık',
        cancelled: 'İptal',
      },
      avatarAlt: '{{name}} profil fotoğrafı',
      actions: {
        like: 'Beğen',
        liked: 'Beğendin',
        unlike: 'Beğeniyi geri al',
        message: 'Kısa mesaj',
      },
      banners: {
        locked: 'Aktif eşleşmen var — diğer profiller kilitli',
        newMessage: 'Yeni mesaj',
      },
    },
    matches: {
      title: 'Eşleşmelerim',
      showingCount: '{{count}} eşleşme görüntüleniyor.',
      emptyHint: 'Eşleşmelerin burada listelenir.',
      backToProfile: '← Profile dön',
      findNew: 'Yeni eşleşme ara',
      finding: 'Eşleşme aranıyor…',
      howTitle: 'Nasıl çalışır?',
      howReadMore: 'Devamını oku',
      howReadLess: 'Daha az göster',
      howItems: [
        'Keşfet sayfasında uygun profiller incelenir.',
        'Eşleşme listesinde görülmek istenen profillere ön eşleşme isteği gönderilir.',
        'İstek karşı tarafın onay ekranına düşer; ön eşleşme isteği onaylanırsa iki taraf da birbirini eşleşme listesinde görür.',
        'Bu aşamada eşleşme kartları etkileşime açılır: beğeni, kısa mesaj gönderimi ve profil bilgilerini detaylı inceleme.',
        'Bir tarafa gönderilen beğeni karşılık bulursa sistem aktif eşleşme adımını başlatır.',
        'Aktif eşleşme başladığında iletişim kurmak için çeviri desteğinden faydalanarak mesajlaşma başlar.',
        'Bu aşamadan sonra iki taraf için de eşleşme listesindeki diğer kişilerle etkileşim kapatılır.',
        'Aktif eşleşme karşılıklı iptal edilmedikçe diğer profillerle eşleşme/etkileşim kapalıdır; beğeni ve kısa mesaj gönderimi ile diğer profilleri detaylı inceleme kullanılamaz.',
        'Suistimali önlemek amacıyla aktif eşleşme başladıktan sonra ilk 2 saat iptal edilemez; ayrıca aktif eşleşme varken yeni bir aktif eşleşme başlatılamaz.',
        '48 saat süren aktif eşleşmenin ardından iki tarafa da iletişim bilgilerini paylaşma hakkı tanınır.',
        'İletişim bilgileri, profil detaylarında sadece karşı tarafın görebileceği şekilde açılır.',
        'Bu aşamadan sonra site içinden veya kişisel iletişim kanallarından konuşmaya devam edilebilir.',
        '48 saatlik süreden sonra destek ekibinden tercümanlık aracılığıyla karşılıklı görüntülü görüşme talep edilebilir.',
        'Ayrıca destek ekibi aracılığıyla detaylı bilgi araştırması talep edilebilir.',
      ],
      activeLockTitle: 'Aktif eşleşmen var',
      activeLockBody: 'Diğer profillerle etkileşim kilitli. Aktif eşleşmeyi yönetmek için <link>aktif eşleşme sayfasına</link> git.',
      requestFailed: 'Eşleşme isteği başarısız: {{error}}',
      requestOk: 'İstek gönderildi. Birkaç saniye içinde listene düşebilir.',
      loading: 'Yükleniyor…',
      loadFailed: 'Eşleşmeler yüklenemedi. ({{error}})',
      noneTitle: 'Henüz eşleşmen yok.',
      noneBody: 'Yeni profil oluşturduysan, ilk eşleşme birkaç saniye içinde üretilebilir. İstersen buradan manuel tetikleyebilirsin.',
      shortModal: {
        subtitle: 'Kısa mesaj (5 limit) • profil dışı kısa bilgi için',
        remaining: 'Kalan hak: {{remaining}} / {{limit}}',
        noMessages: 'Henüz mesaj yok.',
        translateError: 'Çeviri hatası: {{error}}',
        translating: 'Çevriliyor…',
        translate: 'Çevir',
        placeholder: 'Kısa bir soru yaz…',
      },
      inboxSync: {
        title: 'Inbox senkron problemi',
        refresh: 'Sunucudan yenile',
        refreshing: 'Yenileniyor…',
        note: 'Not: Bu buton, Firestore dinlemesi bozulsa bile server (Admin SDK) üzerinden aynı veriyi getirir.',
        permissionDenied: 'Firestore okuma izni yok (permission-denied). Firebase projesi: {{projectId}} (Sunucudan yenile deneyin)',
        listenFailed: 'Firestore {{kind}} inbox dinlemesi hata verdi: {{error}} (Sunucudan yenile deneyin)',
        kinds: {
          likes: 'beğeni',
          requests: 'istek',
          profileAccess: 'profil izin',
          messages: 'mesaj',
        },
      },
      errors: {
        activeLocked: 'Aktif eşleşmen varken diğer profillerle mesajlaşamazsın. Önce aktif eşleşmeni karşılıklı iptal et.',
        shortLimit: 'Kısa mesaj hakkın bitti (5 mesaj). Devam etmek için karşılıklı beğeni sonrası aktif eşleşmeyi başlatmalısınız.',
      },
    },
    chat: {
      backToMatches: '← Eşleşmelere dön',
      chatTitle: 'Chat',
      emoji: 'Emoji',
      emojiHint: 'Emoji ekleyebilirsiniz',
      matchTestOnlyActive: 'Eşleşme testi sadece aktif eşleşmede açılır.',
      shortAreaTitle: 'Kısa mesaj alanı',
      shortAreaDesc:
        'Bu alan yalnızca bu kişi hakkında daha fazla bilgi edinmek için kullanılır (profilde olmayan konular, karakteri hakkında kısa sorular).',
      shortAreaLimit: 'Mesaj hakkın {{limit}} mesaj ile sınırlıdır. Kalan: {{remaining}}',
      otherActiveLock: 'Aktif eşleşmen başka biriyle olduğu için bu eşleşmede uzun sohbet açılmaz.',
      noMessages: 'Henüz mesaj yok. İlk mesajı sen gönder.',
      matchLoading: 'Eşleşme yükleniyor…',
      matchNotFound: 'Eşleşme bulunamadı.',
      messagesLoading: 'Mesajlar yükleniyor…',
      sendFailed: 'Mesaj gönderilemedi: {{error}}',
      inputPlaceholderLong: 'Mesaj yaz…',
      inputPlaceholderShort: 'Kısa soru/mesaj yaz…',
      notAvailable: 'Mesajlaşma şu an kullanılamıyor.',
      lockedTitle: 'Diğer eşleşmeler geçici olarak kilitli',
      lockedBody: 'Şu an aktif eşleşmen varken diğer eşleşmelerde mesajlaşma kapalı. Kilit süresi dolunca tekrar açılır.',
      notAllowed: 'Bu sohbeti görüntüleme yetkin yok.',
      notOpenTitle: 'Mesajlaşma henüz açık değil',
      notOpenBody: 'Eşleşme aktif olduktan sonra (karşılıklı onay) mesajlaşma açılır.',
      you: 'Sen',
      remainingTime: '{{hours}}s {{minutes}}dk',
      lock48h: {
        title: '48 saat özel sohbet + iletişim paylaşımı',
        subtitle: 'Karşılıklı onay ve süre tamamlandıktan sonra iletişim bilgileri paylaşılabilir.',
        lockedRemaining: 'Kilit açık değil. Kalan süre: {{time}}',
        confirming: 'Onaylanıyor…',
        confirmed: 'Onaylandı',
        confirm: '48 saati onayla',
        requesting: 'İstek gönderiliyor…',
        requestContact: 'İletişim isteği gönder',
        approving: 'Onaylanıyor…',
        approveContact: 'İletişimi onayla',
        confirmStatusLabel: 'Onay durumu:',
        confirmStatus: {
          both: 'Karşılıklı onaylandı',
          you: 'Siz onayladınız (diğer taraf bekleniyor)',
          other: 'Diğer taraf onayladı (sizin onayınız bekleniyor)',
          none: 'Henüz onay yok',
        },
        contactStatusLabel: 'İletişim paylaşımı:',
        contactStatus: {
          approved: 'Paylaşıldı',
          pendingMine: 'İstek gönderildi (onay bekleniyor)',
          pendingOther: 'Karşı taraf istek gönderdi (onaylayabilirsiniz)',
          closed: 'Kapalı',
        },
        confirmError: 'Onay hatası: {{error}}',
        contactRequestError: 'İletişim isteği hatası: {{error}}',
        contactApproveError: 'İletişim onayı hatası: {{error}}',
        whatsappTitle: 'WhatsApp',
        openInWhatsApp: "WhatsApp'ta aç",
      },
    },

    matchProfile: {
      askShort: 'Kısa bir şey sor',
      viewProfile: 'Profili incele',
      hideProfile: 'Profili gizle',
      prevPhoto: 'Önceki fotoğraf',
      nextPhoto: 'Sonraki fotoğraf',
      tabs: {
        preview: 'Önizleme',
        details: 'Profil detayları',
      },
      detailsAccess: {
        needsPermission: 'Detaylı profil incelemek için bu kullanıcının izin vermesi gerekir.',
        grantedHint: 'Şimdi profil detaylarını inceleyebilirsiniz.',
        status: {
          pending: 'İstek gönderildi (beklemede)',
          approved: 'İstek onaylandı',
          granted: 'İzin zaten verilmiş',
          unknown: 'Durum: {{status}}',
        },
        actions: {
          request: 'İstek gönder',
          requested: 'İstek gönderildi',
          granted: 'İzin verildi',
        },
        retry: 'Tekrar dene',
        refresh: 'Yenile',
        viewPersonProfile: 'Kişi profili incele',
        mayRequireApproval: 'Detaylar için karşı tarafın onayı gerekebilir.',
      },
      photos: {
        onlyAllowed: 'Sadece izin verilenler görebilir',
        reciprocityBlocked: 'Fotoğraflarını gizlediğin için fotoğraflar kapalı',
      },
      profileTitle: 'Profil bilgileri',
      contactHidden:
        'İletişim bilgileri gizlidir. Bu bilgiler formu doldururken de uygulamada görünmez. Yalnızca 48 saatlik aktif eşleşme süreci sonunda kesin eşleşme sağlanırsa ve sizin onayınız olursa paylaşılabilir.',
      rulesTitle: 'Kurallar (kısaca)',
      rules: {
        likeFirst: 'Beğeni karşılıklı olursa “Karşılıklı beğeni” oluşur.',
        startActive: 'İki taraf da “Aktif eşleşmeyi başlat” onayı verince uzun sohbet açılır.',
        onlyOneActive: 'Sadece 1 aktif eşleşme olabilir; aktifken diğer profillerle beğeni/mesajlaşma kilitlenir.',
        unlockAfterCancel: 'Diğer profillerin tekrar açılması için aktif eşleşmenin karşılıklı iptal edilmesi gerekir.',
      },
      activeStart: {
        starting: 'Başlatılıyor…',
        waiting: 'Onay bekleniyor',
        start: 'Aktif eşleşmeyi başlat',
        activatedNotice: 'Aktif eşleşme açıldı — artık uzun sohbet aktif.',
        waitingNotice: 'Onayın gönderildi. Karşı taraf da onaylayınca uzun sohbet açılacak.',
        confirmPrompt:
          'Aktif eşleşmeyi başlatmak üzeresin.\n\n- Sadece 1 kişiyle aktif eşleşme olur (diğer profiller kilitlenir).\n- Aktifleşince ilk 2 saat iptal edemezsiniz.\n\nOnaylıyor musun?',
      },
      cancel: {
        title: 'Aktif eşleşmeyi iptal',
        desc: 'İptal işlemi karşılıklıdır. Sen iptal edince karşı tarafın da iptal etmesi gerekir.',
        cooldown: 'Suistimali önlemek için aktif eşleşme başladıktan sonraki ilk 2 saat iptal kapalı. Kalan süre: {{time}}',
        request: 'Aktif eşleşmeyi iptal et',
        requestSent: 'İptal isteği gönderildi',
        waitingOther: 'Karşı tarafın iptali bekleniyor.',
        confirmPrompt:
          'Aktif eşleşmeyi iptal etmek üzeresin.\n\n- İptal karşılıklıdır: iki taraf da iptal edince eşleşme kapanır.\n- İptal olunca diğer profillerle etkileşim kilidi kalkar.\n\nOnaylıyor musun?',
      },
      mutualLike: {
        title: 'Karşılıklı beğeni var',
        body: 'Uzun sohbet yalnızca iki taraf da “Aktif eşleşmeyi başlat” onayı verince açılır.',
      },
      longChatClosedTitle: 'Uzun sohbet kapalı',
      longChatClosedBody: 'Uzun sohbet yalnızca aktif eşleşme başlatıldığında görünür. Bu aşamada sadece kısa mesaj ile bilgi alabilirsiniz.',
      shortModal: {
        title: 'Kısa mesaj',
      },
      translate: {
        errors: {
          tooLong: 'Bu mesaj çok uzun; çeviri için kısaltılmalı.',
          onlyIncoming: 'Sadece gelen mesajlar çevrilebilir.',
          notConfigured: 'Çeviri servisi ayarlı değil.',
          rateLimited: 'Çeviri yoğun (Gemini dakikada 15 limit). 1 dakika sonra tekrar dene veya ücretli plana geç.',
          piiBlocked: 'Kişisel/iletişim bilgisi içerdiği için otomatik çeviri yapılmadı.',
          failed: 'Çeviri başarısız.',
        },
      },
      time: {
        minutes: '{{minutes}} dk',
        hours: '{{hours}} saat',
        hm: '{{hours}} saat {{minutes}} dk',
      },
      errors: {
        activeMatchLocked: 'Aktif eşleşmen varken başka bir profille işlem yapamazsın. Önce aktif eşleşmeni karşılıklı iptal et.',
        otherUserActiveMatch: 'Karşı tarafın şu anda aktif bir eşleşmesi var. Bu eşleşme aktifleştirilemez.',
        cancelCooldown: 'Suistimali önlemek için aktif eşleşme başladıktan sonraki ilk 2 saat iptal kapalı. Kalan süre: {{time}}',
        notAvailable: 'Bu işlem bu aşamada yapılamıyor.',
        forbidden: 'Bu işlem için yetkin yok.',
        activeStartLocked: 'Başka bir aktif eşleşmen varken yeni aktif eşleşme başlatılamaz.',
      },
    },

    profile: {
      membershipLabel: 'Üyelik',
      membershipActive: 'Aktif',
      membershipPassive: 'Pasif',
      endsAt: 'Bitiş',
      editProfile: 'Profili Düzenle',
      myMatches: 'Eşleşmelerim',
      logout: 'Çıkış',
      bannerAlt: 'Profil banner',
      aboutTitle: 'Hakkımda',
      noBio: 'Henüz bir açıklama eklenmemiş.',
      textsTitle: 'Profil yazıları',
      aboutLabel: 'Kendinizden kısaca bahsedin',
      expectationsLabel: 'Aradığınız kişiden bahsedin',
      aboutPlaceholder: 'Kendinizle ilgili kısa bir tanıtım yazın…',
      expectationsPlaceholder: 'Aradığınız kişiyle ilgili beklentilerinizi yazın…',
      saveTexts: 'Kaydet',
      textsSaved: 'Kaydedildi.',
      subscriptionTitle: 'Abonelik',
      subscriptionActiveDesc: 'Üyeliğiniz aktif. Tüm özelliklere erişebilirsiniz.',
      subscriptionPassiveDesc: 'Üyeliğiniz pasif. Üyelik olmadan bazı aksiyonlar kısıtlı olabilir.',
      buySoon: 'Üyelik Satın Al (yakında)',
      activateMembership: 'Üyeliğimi Aktif Et',
      cancelMembership: 'Üyeliği İptal Et',
      membershipActivated: 'Üyelik aktif edildi.',
      membershipCancelled: 'Üyelik iptal edildi.',
      confirmCancelMembership: 'Üyeliğini iptal etmek istiyor musun?',
      myInfo: 'Bilgilerim',
      identityTitle: 'Kimlik Doğrulama',
      identityVerified: 'Kimliğin doğrulanmış görünüyor.',
      identityStatus: 'Durum',
      verifyNow: 'Kimliğimi Doğrula',
      identityHelp: 'Kimliğini doğrulayarak güven puanını artırabilir ve üyelik/özellik kısıtlarını kaldırabilirsin.',
      accountTitle: 'Hesap',
      accountDeleteDesc: 'Hesabınızı ve ilişkili verileri kalıcı olarak silebilirsiniz.',
      deleteAccount: 'Hesabı Sil',
      deleting: 'Siliniyor…',
      oldPanel: 'Eski panel (geçici)',
      verifyModalTitle: 'Kimlik doğrulama',
      idType: 'Kimlik türü',
      idTypeTrId: 'T.C. Kimlik',
      idTypePassport: 'Pasaport',
      idTypeDriver: 'Ehliyet',
      verifyPhotosHint: 'Fotoğraflar sadece doğrulama için kullanılır.',
      idFront: 'Kimlik ön yüz',
      idBack: 'Kimlik arka yüz',
      selfie: 'Selfie',
      verifyMissingFiles: 'Lütfen kimlik ön/arka ve selfie yükleyin.',
      verifySubmitted: 'Kimlik doğrulama talebin alındı. İnceleniyor.',
      submitVerification: 'Gönder',
      confirmDelete: 'Hesabınızı kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.',

      photoPrivacy: {
        title: 'Fotoğraf gizliliği',
        body:
          'Fotoğraflarını blurladığında, eşleşme kartlarında fotoğrafların bulanık görünür ve sadece izin verdiğin kişiler fotoğraflarını net görebilir.',
        toggleLabel: 'Fotoğraflarımı blurla',
        stateOn: 'Açık',
        stateOff: 'Kapalı',
        hintOn: 'Eşleşme listesinde her kartta “Fotoğraflarımı göster” butonuyla kişi bazında izin verebilirsin.',
        hintOff: 'Blur kapalıyken eşleşme kartlarında ekstra izin butonu gösterilmez.',
        fairnessWarning:
          'Adil kullanım: Fotoğraflarını blurladıktan sonra, eşleşme kartlarındaki kişilerin fotoğrafları da yalnızca izin verdiklerin için görüntülenebilir.',
        rules: {
          firstBlurLock48h: 'Fotoğrafı ilk kez blurladıktan sonra 48 saat yeniden açık hale getiremezsin.',
          unblurLock48h: 'Görünürlüğü açtıktan sonra 48 saat tekrar kapatamazsın.',
          onlyAllowed:
            'Görünürlük kapalıyken sadece izin verdiklerin fotoğraflarını görür; sen de yalnız izin verdiklerinin fotoğraflarını görürsün.',
        },
        cooldownError: 'Bu işlem için bekleme süresi var. Kalan süre: {{time}}',
      },

      userCode: {
        label: 'Kullanıcı Kodu',
      },

      guidance: {
        button: 'Evlilik Rehberliği',
        modalTitle: 'Evlilik Rehberliği',
        subtitle: 'Sistemimiz sadece eşleştirme değil',
        intro:
          'Sistemimiz sadece eşleştirme sistemi değildir. Evlilik kararı aldıktan sonra Endonezya ve Türk vatandaşlarının evlilik yolunda her konuda rehberliğini yapar; evlilik öncesi, evlilik aşaması ve evlilik sonrası tüm işlemlerde sorunsuz bir şekilde evlenmeleri için rehberlik hizmeti veririz.',
        learnMore: 'Detaylı bilgi (Evlilik sayfası)',
        whatsappCta: 'WhatsApp ile yaz',
        whatsappMessage: 'Merhaba, evlilik rehberliği hakkında bilgi almak istiyorum.',
        sections: {
          gettingToKnow: {
            title: '1) Tanışma aşaması',
            items: [
              'Eş adaylarının birbiri hakkında araştırma yapılması',
              'Ailelerle görüşme',
              'Eş adaylarının birbiriyle görüntülü görüşmesinde aracılık ve tercümanlık hizmeti',
              'Eş adaylarının ailelerinin iletişiminde aracılık ve tercümanlık hizmeti',
            ],
          },
          preparations: {
            title: '2) Evlilik hazırlıkları',
            items: [
              'Gerekli evrakların hazırlanması',
              'Yasal işlemlerin başlatılması',
              'Evlilik tarihinin belirlenmesi',
              'Evlilik maliyetinin hesaplanması',
            ],
          },
          marriageStage: {
            title: '3) Evlilik aşaması',
            items: [
              'Endonezya’ya uçuş bileti',
              'Endonezya’da otel konaklaması',
              'Endonezya içi özel araç, uçak, tren veya gemi ile ulaşım planlaması',
              'Endonezya’da yasal işlemlerin yapılması',
              'Nikah hazırlıkları',
              'Endonezya’da bulunulan süre içinde tercümanlık ve rehberlik',
            ],
          },
          afterMarriage: {
            title: '4) Evlilik sonrası',
            items: [
              'Evliliğin Türk ve Endonezya makamlarında tescillenmesi',
              'Türkiye’de yaşanacaksa aile vizesi başvurusu',
              'Endonezya’da yaşanacaksa oturum izni işlemleri',
            ],
          },
        },
      },

      applySuccess: {
        title: 'Başvurun alındı',
        subtitle: 'Şimdi sıradaki adımlar: panelinden havuzu incele ve eşleşme önerilerini takip et.',
        steps: [
          'Havuzda sana uygun profiller listelenir (kısıtlı ön izleme).',
          'Beğeni karşılıklı olunca 48 saat site içi sohbet açılır.',
          '48 saat sonra iletişim isteği gönderilir; onay olursa numaralar görünür.',
        ],
        applicationIdLabel: 'Başvuru ID',
        ctas: {
          pool: 'Havuza git',
          matches: 'Eşleşmelerim',
          learn: 'Sistem nasıl çalışır?',
        },
      },
    },
    errors: {
      generic: 'Hata',
      profileNotFound: 'Profil kaydı bulunamadı.',
      apiUnavailable: 'Sunucuya ulaşılamıyor. Local geliştirmede `npm run dev` (api+web) çalışıyor olmalı.',
      serverNotConfigured: 'Sunucu yapılandırması eksik. Lütfen destek ile iletişime geçin.',
      activeLocked: 'Aktif eşleşmen varken başka bir profille işlem yapamazsın. Önce aktif eşleşmeni karşılıklı iptal et.',
      shortLimit: 'Kısa mesaj hakkın bitti (5 mesaj). Devam etmek için karşılıklı beğeni sonrası aktif eşleşmeyi başlatmalısınız.',
      shortMessageTooLong: 'Mesaj çok uzun. En fazla 240 karakter.',
      filtered: 'İletişim bilgisi (link, telefon, sosyal medya) paylaşmayın.',
      notInTheirAgeRange: 'Bu kişi için yaş aralığınız uygun değil.',
      ageRequired: 'Yaş bilginiz eksik görünüyor. Lütfen formdaki yaş alanını doldurup tekrar deneyin.',
      notAvailable: 'Bu işlem bu aşamada yapılamıyor.',
      forbidden: 'Bu işlem için yetkin yok.',
      cancelCooldown: 'Suistimali önlemek için iptal geçici olarak kapalı. Kalan süre: {{time}}',
    },
  },

  admin: {
    userTools: {
      prompts: {
        blockReason: 'Engelleme nedeni (opsiyonel):',
        noteOptional: 'Not (opsiyonel):',
      },
      defaults: {
        whatsappVerificationNote: 'WhatsApp doğrulama',
      },
      confirms: {
        grantMembershipDays: 'Bu kullanıcıya {{days}} gün üyelik tanımlansın mı?',
        revokeMembership: 'Bu kullanıcının ücretli üyeliği pasif edilsin mi?',
        grantTranslationPackDays: 'Bu kullanıcıya {{days}} gün çeviri paketi tanımlansın mı?',
        revokeTranslationPack: 'Bu kullanıcının çeviri paketi pasif edilsin mi?',
        resetFreeActiveMembership:
          'Ücretsiz aktif üyelik (freeActiveMembership) sıfırlansın mı? (blocked=false, active=false, sayaçlar=0)',
      },
      messages: {
        userBlocked: 'Kullanıcı engellendi.',
        userUnblocked: 'Kullanıcının engeli kaldırıldı.',
        whatsappVerified: 'Kullanıcı WhatsApp doğrulaması ile doğrulandı.',
        membershipGranted: 'Üyelik aktif edildi. Bitiş: {{until}}',
        membershipRevoked: 'Üyelik pasif edildi.',
        translationPackGranted: 'Çeviri paketi aktif edildi. Bitiş: {{until}}',
        translationPackRevoked: 'Çeviri paketi pasif edildi.',
        freeActiveReset: 'Ücretsiz aktif üyelik durumu sıfırlandı.',
      },
      errors: {
        userIdRequired: 'User ID girin.',
        applicationNotFoundForMk: 'Bu MK kodu için başvuru bulunamadı.',
        applicationMissingUserId: 'Başvuru bulundu ama userId yok.',
        userReadFailed: 'Kullanıcı okunamadı.',
        actionFailed: 'İşlem başarısız.',
        daysRange: 'Gün sayısı 1–365 arası olmalı.',
        translationTierInvalid: 'Paket türü standard veya pro olmalı.',
      },
    },

    matchmakingMatches: {
      titles: {
        page: 'Eşleşmeler (Admin)',
        tab: 'Eşleşmeler',
        tabSubtitle: 'Karşılıklı onay ve iletişim açılmış eşleşmeler.',
      },
      nav: {
        identityVerifications: 'Kimlik doğrulama',
        paymentNotifications: 'Ödeme bildirimleri',
        adminPanel: 'Admin panel',
        openDetailedPage: 'Detaylı eşleşme sayfasını aç',
      },
      common: {
        loading: 'Yükleniyor…',
        empty: 'Kayıt yok.',
      },
      labels: {
        total: 'Toplam',
        match: 'Eşleşme:',
        score: 'Skor: {{score}}',
        recordId: 'Kayıt ID:',
      },
      actions: {
        cancel: 'Eşleşmeyi iptal et (kilidi kaldır)',
        copy: 'kopyala',
      },
      sections: {
        mutual: 'Karşılıklı onay (2. adım seçimi bekliyor)',
        contactUnlocked: 'İletişim paylaşımı açılanlar (kilit aktif)',
      },
      manual: {
        title: 'Manuel eşleştir',
        titleTest: 'Manuel eşleştir (test için)',
        description:
          'A ve B için "Application ID" veya "Kullanıcı Adı" yazın. Bu işlem iki kullanıcı arasına bir eşleşme dokümanı oluşturur (beğeni/ret/chat akışını test etmek için).',
        descriptionShort:
          'A ve B için “Application ID” veya “Kullanıcı Adı” girin. Bu işlem iki kullanıcı arasında bir eşleşme dokümanı oluşturur.',
        notePrefix: 'Not: Bu sayfadaki listeler sadece',
        noteAnd: 've',
        noteSuffix: 'durumlarını gösterir.',
        labels: {
          a: 'A (Application ID / Profil Kodu)',
          b: 'B (Application ID / Profil Kodu)',
          startStatus: 'Başlangıç durumu',
          overwrite: 'Aynı match varsa üzerine yaz',
        },
        placeholders: {
          a: 'Örn: moonstar_34 veya applicationId',
          b: 'Örn: blueocean_21 veya applicationId',
        },
        statusOptions: {
          proposed: 'proposed (beğeni/ret test)',
          mutualAccepted: 'mutual_accepted (chat/contact seçimi test)',
          contactUnlocked: 'contact_unlocked (iletişim açılmış test)',
        },
        actions: {
          create: 'Manuel eşleştir',
          clear: 'Alanları temizle',
        },
      },
      confirms: {
        cancelMatch: 'Bu eşleşme iptal edildi olarak işaretlenecek ve kilit kaldırılacak. Devam edilsin mi?',
      },
      messages: {
        cancelSuccess: 'Eşleşme iptal edildi. Kilit kaldırıldı; yeni eşleşmeler gösterilebilir.',
        manualCreated: 'Manuel eşleşme hazır. Match ID: {{matchId}}{{extra}}',
        manualExtraUpdated: ' (Zaten vardı: güncellendi)',
        manualExtraSkipped: ' (Zaten vardı: atlandı)',
        copySuccess: 'Kayıt ID kopyalandı.',
        copyFailed: 'Kopyalanamadı.',
      },
      errors: {
        loadFailed: 'Eşleşmeler yüklenemedi.',
        actionFailed: 'İşlem başarısız.',
        manualInputRequired: 'Lütfen A ve B için Application ID veya Profil Kodu girin.',
      },
    },

    matchmakingPayments: {
      titles: {
        page: 'Ödeme Bildirimleri (Admin)',
        tab: 'Ödeme Bildirimleri',
        tabSubtitle: 'Bekleyen/onaylanan/reddedilen ödeme bildirimlerini yönetin.',
      },
      nav: {
        matches: 'Eşleşmeler',
        adminPanel: 'Admin panel',
      },
      notices: {
        indexFallback: 'Not: Firestore index olmadığı için "fallback" listeleme kullanılıyor (biraz daha yavaş olabilir).',
        receiptViaWhatsApp: 'Not: Kullanıcı dekontu WhatsApp ile göndereceğini işaretlemiş. (Panelden link yüklenmedi.)',
      },
      common: {
        loading: 'Yükleniyor…',
        empty: 'Kayıt yok.',
      },
      statuses: {
        pending: 'Bekleyen',
        approved: 'Onaylanan',
        rejected: 'Reddedilen',
      },
      statusHeadings: {
        pending: 'Bekleyen bildirimler',
        approved: 'Onaylananlar',
        rejected: 'Reddedilenler',
      },
      labels: {
        shown: 'Gösterilen',
        total: 'Toplam',
        package: 'Paket',
        method: 'Yöntem',
        user: 'Kullanıcı',
        userId: 'User ID',
        match: 'Eşleşme',
        reference: 'Referans',
        receiptChannel: 'Dekont kanalı',
        note: 'Not',
        receipt: 'Dekont',
        readyMessage: 'Hazır mesaj',
      },
      receiptChannels: {
        whatsapp: 'WhatsApp',
        upload: 'Yükleme',
      },
      tiers: {
        eco: 'Eko',
        standard: 'Standart',
        pro: 'Pro',
      },
      methods: {
        eft_fast: 'EFT / FAST',
        swift_wise: 'SWIFT / Wise',
        qris: 'QRIS',
        card: 'Kredi kartı',
        other: 'Diğer',
      },
      actions: {
        copy: 'Kopyala',
        open: 'Aç',
        approve: 'Onayla',
        reject: 'Reddet',
        copyApprovalMessage: 'Onay mesajını kopyala',
        copyRejectionMessage: 'Red mesajını kopyala',
      },
      copy: {
        copied: '{{what}} kopyalandı.',
        failed: 'Kopyalanamadı.',
        what: {
          userId: 'User ID',
          matchId: 'Match ID',
          reference: 'Referans',
          receiptLink: 'Dekont linki',
          approvalMessage: 'Onay mesajı',
          rejectionMessage: 'Red mesajı',
        },
      },
      warnings: {
        amountMismatch: 'Uyarı: Tutar beklenen fiyatla eşleşmiyor. Beklenen: {{expected}}',
      },
      confirms: {
        approve: 'Bu ödeme bildirimi ONAYLANACAK ve "{{tier}}" paketi aktif edilecek. Devam edilsin mi?',
        reject: 'Bu ödeme bildirimi REDDEDİLECEK. Devam edilsin mi?',
      },
      messages: {
        approvedWithUntil: 'Ödeme onaylandı; üyelik aktif edildi. Bitiş: {{until}}',
        approved: 'Ödeme onaylandı; üyelik aktif edildi.',
        rejected: 'Ödeme reddedildi.',
      },
      errors: {
        actionFailed: 'İşlem başarısız.',
      },
      templates: {
        whatsapp: {
          approved:
            'Merhaba, evlilik eşleştirme üyelik ödemeniz onaylandı. Panelinizden iletişim bilgilerini açabilirsiniz. Teşekkürler.',
          rejected:
            'Merhaba, ödeme bildiriminizi doğrulayamadık. Lütfen dekont/ref. bilgisini kontrol edip tekrar ödeme bildirimi gönderin.',
        },
      },
      alts: {
        receipt: 'dekont',
      },
    },

    photoUpdates: {
      titles: {
        tab: 'Fotoğraf Güncelleme İstekleri',
        tabSubtitle: 'Kullanıcının yüklediği yeni fotoğrafları inceleyip onaylayın/reddedin.',
      },
      common: {
        loading: 'Yükleniyor…',
        empty: 'Kayıt yok.',
        noPhoto: 'Foto yok.',
      },
      statuses: {
        pending: 'Bekleyen',
        approved: 'Onaylanan',
        rejected: 'Reddedilen',
      },
      labels: {
        shown: 'Gösterilen',
        requestId: 'İstek',
        userId: 'User ID',
        applicationId: 'Başvuru',
      },
      actions: {
        copy: 'Kopyala',
        approve: 'Onayla',
        reject: 'Reddet',
      },
      copy: {
        copied: '{{what}} kopyalandı.',
        failed: 'Kopyalanamadı.',
        what: {
          userId: 'User ID',
          applicationId: 'Application ID',
        },
      },
      confirms: {
        approve: 'Bu fotoğraf güncellemesi ONAYLANACAK ve başvuru fotoğrafları değişecek. Devam edilsin mi?',
        reject: 'Bu fotoğraf güncellemesi REDDEDİLECEK. Devam edilsin mi?',
      },
      messages: {
        approved: 'Fotoğraf güncellemesi onaylandı.',
        rejected: 'Fotoğraf güncellemesi reddedildi.',
      },
      errors: {
        actionFailed: 'İşlem başarısız.',
      },
      alts: {
        photo: 'Fotoğraf',
      },
    },
  },

  matchmakingHub: {
    metaTitle: 'Uniqah',
    badge: 'Gizli ve kontrollü süreç',
    title: 'Evlilik eşleştirme sistemi',
    description:
      'Evlilik planlayan ciddi insanları, adil ve güvenli şartlarda bir araya getiren kapalı bir eşleştirme sistemi. Profiller herkese açık değildir; sistem, kriterlerinize en uygun adayları panelinizde gösterir ve doğru kişiyi daha hızlı bulmanızı kolaylaştırır.',
    actions: {
      apply: 'Eşleştirme başvurusu yap',
      goPanel: 'Profilim',
      backWedding: 'Evlilik sayfasına dön',
      supportWhatsApp: 'WhatsApp destek',
    },
    whatsappSupportMessage: 'Merhaba, eşleştirme sistemi hakkında destek almak istiyorum. Şikayet/inceleme talebim var.',
    cards: {
      private: {
        title: 'Profil yayınlanmaz',
        desc: 'Profiller kamuya açık listelenmez; değerlendirme sistem tarafından yürütülür.',
      },
      review: {
        title: 'Sistem değerlendirmesi',
        desc: 'Size uygun bir aday bulunduğunda süreç panelinizde güvenli şekilde ilerler.',
      },
        showEmptyFields: 'Boş alanları göster',
        hideEmptyFields: 'Boşları gizle',
        partnerAgeMin: 'Min yaş',
        partnerAgeMax: 'Max yaş',
      panel: {
        title: 'Panel üzerinden ilerleme',
        desc: 'Eşleşme, ön izleme ve sonraki adımları panelinizden yönetirsiniz.',
      },
    },
    how: {
      title: 'Sistem nasıl çalışır?',
      subtitle: 'Keşfet → ön eşleşme → aktif eşleşme → iletişim paylaşımı: adım adım, kontrollü süreç.',
      steps: [
        {
          title: 'Keşfet’te uygun profilleri incele',
          desc: 'Paneldeki Keşfet sayfasında kriterlere uygun profiller gösterilir (kısıtlı ön izleme).',
        },
        {
          title: 'Ön eşleşme isteği gönder',
          desc: 'Eşleşme listesinde görülmek istenen profillere ön eşleşme isteği gönderilir.',
        },
        {
          title: 'Karşı taraf inceleyip onaylar',
          desc: 'İstek onaylanırsa iki taraf da birbirini “Eşleşmelerim” listesinde görür.',
        },
        {
          title: 'Eşleşme kartında etkileşim',
          desc: 'Beğeni, kısa mesaj ve profil detaylarını inceleme bu aşamada açılır.',
        },
        {
          title: 'Aktif eşleşme (48 saat)',
          desc: 'Karşılıklı beğeni olduğunda aktif eşleşme başlar; çeviri destekli mesajlaşma açılır ve diğer profiller kilitlenir.',
        },
        {
          title: 'İletişim paylaşımı & destek',
          desc: '48 saat sonunda iletişim bilgileri (karşılıklı onayla) açılır; isterseniz tercümanlı görüntülü görüşme/inceleme için destek alabilirsiniz.',
        },
      ],
    },
    matching: {
      title: 'Nasıl eşleştiriyoruz?',
      subtitle: 'Amaç “rastgele” değil; kriter uyumu ve güvenli ilerleme. Profilin herkese açık yayınlanmaz.',
      badge: 'Kriter uyumu • Karşılıklı onay • Kontrollü iletişim',
      points: [
        'Sistem; yaş aralığı, temel tercihler ve başvurudaki bilgiler üzerinden aday havuzundan öneriler çıkarır.',
        'Etkileşim karşılıklı onayla ilerler: tek taraflı zorla iletişim veya baskı akışı yoktur.',
        'İletişim bilgileri hemen açılmaz: önce 48 saat site içi sohbet, sonra iletişim isteği onayı gerekir.',
      ],
      note: 'Not: Bu bölüm bilgilendirme amaçlıdır. Güvenlik kapsamında moderasyon ve şikayet mekanizmaları uygulanır.',
    },
    safety: {
      title: 'Güvenlik ve kalite',
      subtitle: 'Diğer platformların aksine, sistem evlilik niyeti dışındaki davranış alanını daraltır.',
      points: [
        'Profiller herkese açık olmadığı için uygunsuz niyetli kişilerin erişimi ciddi ölçüde azalır.',
        'Dolandırıcılık, maddi çıkar, token/hediye tuzakları gibi davranışlar tespit ve şikayetle hızlıca engellenir.',
        'Şikayetler WhatsApp destek hattına iletilir; gerekli inceleme sonrası hesap sistemden kaldırılır.',
      ],
      tagline: 'Moderasyon + şikayet hattı',
    },

    brandAlt: 'Turk&Indo',
    miniCard: {
      title: 'Uniqah',
      desc: 'Kapalı sistem, kontrollü aday havuzu ve adım adım ilerleyen süreç.',
      stats: {
        privateTitle: 'Gizli',
        privateSubtitle: 'profil',
        fairTitle: 'Adil',
        fairSubtitle: 'eşleşme',
        safeTitle: 'Güvenli',
        safeSubtitle: 'iletişim',
      },
    },
    benefits: {
      b1Title: 'Avantaj',
      b1Body: 'Kamuya açık gezme yok; süreç hedefli ilerler.',
      b2Title: 'Kontrol',
      b2Body: 'Panel üzerinden beğen/geç ve iletişim seçimi.',
      b3Title: 'Hız',
      b3Body: 'Kriter uyumu odaklı eşleşme önerileri.',
    },
    flow: {
      title: 'Adım adım süreç',
      badge: 'Uniqah akışı',
    },

    faq: {
      title: 'Sık sorulan sorular',
      subtitle: 'Başvuru ve süreç hakkında en çok gelen soruların kısa cevapları.',
      sideNote: 'Destek için WhatsApp her zaman açık.',
      items: [
        {
          q: 'Profilim herkese açık mı?',
          a: 'Hayır. Profiller kamuya açık listelenmez; eşleşme ve süreç panel üzerinden kontrollü ilerler.',
        },
        {
          q: 'İletişim bilgileri ne zaman paylaşılır?',
          a: 'Karşılıklı beğeni sonrası ilk 48 saat site içi sohbet edilir. 48 saat dolunca iletişim isteği gönderilir ve karşı taraf onaylarsa numaralar görünür.',
        },
        {
          q: 'Fotoğraflarım kimlere gösterilir?',
          a: 'Fotoğraflar süreç ve güvenlik kapsamında kullanılır. Eşleşme akışında panel üzerinden, kontrollü şekilde gösterilir.',
        },
        {
          q: 'Şikayet veya uygunsuz davranış olursa ne yapmalıyım?',
          a: 'WhatsApp destek hattına ekran görüntüsü gibi kanıtlarla bildirebilirsiniz. İnceleme sonrası hesap sistemden kaldırılabilir.',
        },
      ],
    },

    trust: {
      title: 'Güven odaklı tasarım',
      subtitle: 'Sistem; mahremiyet, moderasyon ve kontrollü iletişim adımlarıyla ilerler.',
      badge: 'Mahremiyet • Moderasyon • Kontrollü iletişim',
      cards: {
        privacy: {
          title: 'Mahremiyet',
          desc: 'Profilin herkese açık yayınlanmaz; yalnızca süreç içinde panelde gösterilir.',
        },
        review: {
          title: 'Kontrol & moderasyon',
          desc: 'Şikayet hattı ve inceleme süreçleri ile kötü niyetli davranışların önü kesilir.',
        },
        support: {
          title: 'Destek',
          desc: 'Süreçte takıldığında WhatsApp üzerinden destek alabilirsin.',
        },
      },
    },

    cta: {
      title: 'Hazırsan başlayalım',
      subtitle: '1–3 dakikada başvuru formunu tamamla, panelinde eşleşmeleri gör.',
    },
  },

  meta: {
    baseTitle: "Uniqah | PT MoonStar Global Indonesia",
    baseDescription:
      "Uniqah (PT MoonStar Global Indonesia), evlilik eşleştirme, rehberlik ve güvenli iletişim adımları sunar.",
    pages: {
      home: { title: "Uniqah | PT MoonStar Global Indonesia" },
      about: { title: "Hakkımızda" },
      corporate: { title: "Kurumsal" },
      contact: { title: "İletişim" },
      travel: { title: "Seyahat" },
      tours: {
        title: "Tur Paketleri",
        description:
          "Planlı Endonezya tur paketleri ve grup turları: Bali, Lombok, Komodo ve daha fazlası için sahada organize edilen programlar.",
      },
      wedding: {
        title: "Evlilik Rehberliği",
        description:
          "Endonezya'da evlilik süreciniz için rehberlik: otel, ulaşım, tercümanlık ve resmi evrak işlemlerinde uçtan uca destek.",
      },
      explore: { title: "Keşfet" },
      youtube: { title: "YouTube" },
      gallery: { title: "Galeri" },
      privacy: { title: "Gizlilik Politikası" },
      documents: { title: "Dokümanlar" },
    },
  },

  matchmakingPage: {
    title: 'Evlilik Eşleştirme Başvurusu',
    intro:
      'Bu sayfa, evlilik amacıyla uygun aday eşleştirmesi için yapılan başvuru formudur. Profiller herkese açık olarak yayınlanmaz; başvurular sadece ekibimiz tarafından görüntülenir. Sistem profilinizle eşleşen kişileri Profilim sayfasında gösterecektir.',
    privacyNote:
      'Önemli: Bu sayfa herkese açık “profil arama/gezme” alanı değildir. Paylaştığınız bilgiler yalnızca değerlendirme ve iletişim amacıyla kullanılır. Doldurduğunuz bilgilerin doğruluğundan emin olun; bu formda paylaştığınız bilgilerden siz sorumlusunuz ve eşleştirmeleriniz bu bilgiler üzerinden gerçekleşir. Kasıtlı olarak yanlış bilgi verenler sistemden engellenir; aktif üyeliği varsa iptal edilir ve geri ödeme yapılmaz.',
    authGate: {
      message: 'Eşleştirme başvurusu gönderebilmek için lütfen giriş yapın veya yeni hesap oluşturun.',
      login: 'Giriş yap',
      signup: 'Kayıt ol',
      note: 'Giriş yaptıktan sonra otomatik olarak bu sayfaya geri yönlendirilirsiniz.',
    },
    form: {
      applicationIdLabel: 'Başvuru ID',
      wizard: {
        badge: 'Hızlı Başvuru',
        step: 'Adım {{current}} / {{total}}',
        back: 'Geri',
        next: 'Devam',
        steps: {
          basic: {
            title: 'İletişim ve temel bilgiler',
            desc: 'Sizi tanıyabilmemiz için temel bilgileri alalım.',
          },
          details: {
            title: 'Detaylar',
            desc: 'Yaşam tarzı ve iletişim dilini netleştirelim.',
          },
          identity: {
            title: 'Ben ve aradığım kişi',
            desc: 'Uyruğunuz, cinsiyetiniz ve aradığınız kriterleri seçin.',
          },
          photos: {
            title: 'Fotoğraflar ve tanıtım',
            desc: '3 fotoğraf yükleyin ve kendinizi kısaca anlatın.',
          },
          preferences: {
            title: 'Eş adayında aradıklarınız ve onaylar',
            desc: 'Tercihlerinizi seçin ve başvuruyu tamamlayın.',
          },
        },
      },
      editOnce: {
        usernameLocked: 'Bu modda kullanıcı adını da düzeltebilirsiniz (1 defaya mahsus).',
        photosLocked: 'Edit modunda fotoğraf güncelleme kapalı. Sadece form alanlarını düzeltebilirsiniz.',
      },
      photo: {
        choose: 'Dosya seç',
        noFileChosen: 'Dosya seçilmedi',
        uploaded: 'Yüklendi',
      },
      sections: {
        me: 'Ben',
        lookingFor: 'Aradığım',
        details: 'Detaylar',
        moreDetails: 'Ek Bilgiler',
        partnerPreferences: 'Evleneceğim Kişide Aradıklarım',
      },
      contactPrivacyNotice:
        'İletişim bilgileriniz (WhatsApp/e-posta/Instagram) gizlidir. Form doldururken ve uygulamada herkese açık şekilde gösterilmez. Bu bilgiler yalnızca 48 saatlik aktif tanışma sürecinden sonra ve sizin onayınızla paylaşılabilir.',
      confirmGender: {
        title: 'Cinsiyet onayı',
        text: 'Kendi cinsiyetinizi "{{gender}}" olarak seçtiniz. Onaylıyor musunuz?',
        cancel: 'Vazgeç',
        confirm: 'Onayla',
      },
      labels: {
        username: 'Kullanıcı adı',
        fullName: 'Ad Soyad',
        age: 'Yaş',
        city: 'Şehir',
        country: 'Yaşadığınız ülke',
        whatsapp: 'WhatsApp numarası',
        email: 'E-posta',
        instagram: 'Instagram (opsiyonel)',
        nationality: 'Uyruğunuz',
        gender: 'Cinsiyet',
        lookingForNationality: 'Uyruk',
        lookingForGender: 'Cinsiyet',
        height: 'Boy (cm)',
        weight: 'Kilo (kg)',
        occupation: 'Meslek',
        education: 'Tahsil / Eğitim durumu',
        educationDepartment: 'Bölüm',
        maritalStatus: 'Medeni durum',
        hasChildren: 'Çocuğunuz var mı?',
        childrenCount: 'Varsa kaç tane?',
        childrenLivingSituation: 'Çocuklarınızla mı yaşıyorsunuz?',
        incomeLevel: 'Gelir durumu',
        religion: 'Dininiz',
        religiousValues: 'Dinî değerleriniz (kısaca)',
        familyObstacle: 'Ailesel olarak Türk–Endonezyalı evliliğine bir engel var mı?',
        familyApprovalStatus: 'Aileniz yabancı ile evliliğinizi onaylar mı?',
        marriageTimeline: 'Evliliği ne zaman düşünüyorsunuz?',
        relocationWillingness: 'Kendi ülkeniz dışında başka bir ülkede yaşamayı düşünür müsünüz?',
        preferredLivingCountry: 'Tercihen hangi ülkede yaşamak istersiniz?',
        partnerHeightMin: 'Boy aralığı (en az)',
        partnerHeightMax: 'Boy aralığı (en çok)',
        partnerAgeMaxOlderYears: 'Benden en fazla kaç yaş büyük olabilir?',
        partnerAgeMaxYoungerYears: 'Benden en fazla kaç yaş küçük olabilir?',
        partnerMaritalStatus: 'Evleneceğiniz kişinin medeni durumu',
        partnerReligion: 'Evleneceğiniz kişinin dini',
        partnerChildrenPreference: 'Çocuk konusunda tercihiniz',
        partnerEducationPreference: 'Eğitim durumu tercihiniz',
        partnerOccupationPreference: 'Meslek durumu tercihiniz',
        partnerFamilyValuesPreference: 'Aile değerleri tercihiniz',
        nativeLanguage: 'Kendi diliniz',
        nativeLanguageOther: 'Kendi diliniz (yazın)',
        foreignLanguages: 'Yabancı diller',
        foreignLanguageOther: 'Diğer yabancı dil (yazın)',
        communicationLanguages: 'Eş adayınızla nasıl anlaşmayı düşünüyorsunuz?',
        communicationLanguageOther: 'İletişim dili (diğer - yazın)',
        smoking: 'Sigara kullanıyor musunuz?',
        alcohol: 'Alkol kullanıyor musunuz?',
        partnerCommunicationLanguages: 'Aradığınız kişiyle iletişim dili',
        partnerCommunicationMethods: 'Aradığınız kişiyle iletişim yöntemi',
        partnerCommunicationLanguageOther: 'Aradığınız kişi için diğer dil (yazın)',
        partnerTranslationApp: 'Aradığınız kişi ile çeviri uygulamasıyla konuşmak ister misiniz?',
        partnerLivingCountry: 'Yaşanacak ülke tercihi',
        partnerSmokingPreference: 'Aradığınız kişi sigara…',
        partnerAlcoholPreference: 'Aradığınız kişi alkol…',
        photo: 'Fotoğraf',
        photos: 'Fotoğraflar (3 adet)',
        photo1: 'Fotoğraf 1',
        photo2: 'Fotoğraf 2',
        photo3: 'Fotoğraf 3',
        about: 'Kısa tanıtım',
        expectations: 'Evleneceğiniz kişide aradığınız özellikler',
      },
      placeholders: {
        username: 'Örn: moonstar_34',
        fullName: 'Örn: Mehmet Yılmaz',
        age: 'Örn: 29',
        city: 'Örn: İstanbul',
        country: 'Örn: Türkiye',
        whatsapp: 'Örn: +90 5xx xxx xx xx',
        email: 'Örn: ornek@mail.com',
        instagram: 'Örn: @kullaniciadi',
        height: 'Örn: 175',
        weight: 'Örn: 72',
        occupation: 'Örn: Öğretmen / Doktor / Asker',
        educationDepartment: 'Örn: Bilgisayar Mühendisliği',
        childrenCount: 'Örn: 1',
        religiousValues: 'Örn: Dindarım / Dengeliyim / İnançlıyım ama esneğim…',
        familyObstacleDetails: 'Kısaca açıklayın…',
        nativeLanguageOther: 'Örn: Fransızca',
        foreignLanguageOther: 'Örn: Fransızca',
        communicationLanguageOther: 'Örn: Arapça',
        partnerCommunicationLanguageOther: 'Örn: Arapça',
        about: 'Kısaca kendinizi tanıtın (yaşam tarzı, dil, iş, aile planı vb.)',
        expectations: 'Örn: İletişim, yaşam tarzı, yaş/boy tercihi, aile değerleri…',
      },
      options: {
        common: {
          select: 'Seçin',
          yes: 'Evet',
          no: 'Hayır',
          unsure: 'Emin değilim',
          doesntMatter: 'Farketmez',
        },
        nationality: {
          tr: 'Türk',
          id: 'Endonezyalı',
          other: 'Diğer',
        },
        gender: {
          male: 'Erkek',
          female: 'Kadın',
        },
        maritalStatus: {
          single: 'Bekar',
          widowed: 'Dul (eşi vefat etmiş)',
          divorced: 'Boşanmış',
          other: 'Diğer',
          doesnt_matter: 'Farketmez',
        },
        childrenLivingSituation: {
          withChildren: 'Çocuklarımla birlikte yaşıyorum',
          separate: 'Çocuklarımdan ayrı yaşıyorum',
        },
        religiousValues: {
          weak: 'Zayıf',
          medium: 'Orta',
          conservative: 'Muhafazakar',
        },
        partnerCommunicationMethods: {
          ownLanguage: 'Kendi dilim',
          foreignLanguage: 'Yabancı dil bilgim',
          translationApp: 'Çeviri uygulaması',
        },
        education: {
          secondary: 'Ortaöğretim',
          highSchool: 'Lise',
          university: 'Üniversite',
          masters: 'Yüksek lisans',
          phd: 'Doktora',
          other: 'Diğer',
        },
        occupation: {
          civilServant: 'Memur',
          employee: 'Çalışan',
          retired: 'Emekli',
          businessOwner: 'Kendi işinin sahibi',
          other: 'Diğer',
        },
        familyValues: {
          religious: 'Dindar',
          liberal: 'Liberal',
        },
        partnerChildren: {
          wantChildren: 'Çocuğu olsun',
          noChildren: 'Çocuğu olmasın',
        },
        income: {
          low: 'Düşük',
          medium: 'Orta',
          good: 'İyi',
          veryGood: 'Çok iyi',
          preferNot: 'Belirtmek istemiyorum',
        },
        ageDiff: {
          none: '0 (istemiyorum)',
          years: '{{count}} yıl',
        },
        religion: {
          islam: 'İslam',
          christian: 'Hristiyan',
          hindu: 'Hindu',
          buddhist: 'Budist',
          other: 'Diğer',
        },
        languageLevel: {
          none: 'Yok / Bilmiyorum',
          basic: 'Temel',
          intermediate: 'Orta',
          advanced: 'İleri',
          native: 'Ana dil',
        },
        commLanguage: {
          tr: 'Türkçe',
          id: 'Endonezce',
          en: 'İngilizce',
          translationApp: 'Çeviri uygulaması aracılığıyla',
          other: 'Diğer (yaz)',
        },
        foreignLanguages: {
          none: 'Yabancı dil bilmiyorum',
        },
        livingCountry: {
          tr: 'Türkiye',
          id: 'Endonezya',
        },
        timeline: {
          '0_3': '0–3 ay içinde',
          '3_6': '3–6 ay içinde',
          '6_12': '6–12 ay içinde',
          '1_plus': '1 yıl ve sonrası',
        },
        familyApproval: {
          approved: 'Onaylıyor',
          inProgress: 'Görüşme aşamasında',
          problem: 'Sorun/çekince var',
        },
      },
      hints: {
        lookingForGenderAuto: 'Aradığınız cinsiyet, cinsiyet seçiminize göre otomatik ayarlanır.',
        partnerAgeComputed: 'Seçiminize göre yaklaşık aralık: {{min}}–{{max}}',
        partnerAgeNeedsYourAge: 'Not: Yaş aralığını hesaplamak için yaşınızı doğru girin.',
        multiSelect: 'Birden fazla seçenek seçebilirsiniz.',
        foreignLanguages: 'Not: Kendi dilinizi seçtikten sonra aşağıda görünmez. Bilmiyorsanız “Yabancı dil bilmiyorum” seçebilirsiniz.',
      },
      photoHint:
        'Sadece resim dosyası yükleyin. Sistem otomatik olarak sıkıştırıp yükler (öneri: net, güncel ve yüzünüzün göründüğü bir fotoğraf).',
      consents: {
        age: '{{minAge}} yaşından büyük olduğumu onaylıyorum.',
        privacy: '<privacyLink>Gizlilik Politikası</privacyLink>’nı okudum ve verilerimin değerlendirme/iletişim amacıyla işlenmesini kabul ediyorum.',
        terms: '<termsLink>Kullanım Sözleşmesi</termsLink>’ni okudum ve kabul ediyorum.',
        photo: 'Fotoğrafımı, değerlendirme amacıyla admin ekibinin görmesini kabul ediyorum (profil herkese açık yayınlanmaz).',
      },
      submit: 'Başvuruyu Gönder',
      submitting: 'Gönderiliyor…',
      success:
        'Başvurunuz alındı. Profilinizle eşleşen kişiler Profilim sayfanızda görüntülenecektir.',
      errors: {
        blocked: 'Bu hesap evlilik başvurularında engellenmiş. Eğer bunun hata olduğunu düşünüyorsanız bizimle iletişime geçin.',
        mustLogin: 'Başvuruyu göndermek için giriş yapmanız gerekir.',
        consentsRequired: 'Başvuru için onay kutularını ({{minAge}}+, Gizlilik Politikası, Kullanım Sözleşmesi, Fotoğraf paylaşımı) işaretlemeniz gerekir.',
        permissionDenied: 'Başvuru gönderilemedi (izin hatası). Lütfen doğru hesapla giriş yapın veya Firestore kurallarını kontrol edin.',
        honeypotTriggered: 'Form gönderilemedi. Tarayıcı otomatik doldurma (autofill) gizli alanı doldurmuş olabilir. Lütfen sayfayı yenileyin ve otomatik doldurmayı kapatıp tekrar deneyin.',
        photoUploadFailed: 'Fotoğraf yüklenemedi. Bu projede Cloudinary yükleme varsayılan olarak SIGNED (imzalı) çalışır. Bu yüzden genelde sebep: `/api/cloudinary-signature` çalışmıyor veya server env eksik. Çözüm: Lokal geliştirmede `npm run dev` çalıştırın (API + Web birlikte) ve `.env.local` içinde `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` tanımlı olsun. (Unsigned preset ancak özellikle açarsanız kullanılır.)',
        username: 'Lütfen kullanıcı adı belirleyin.',
        usernameTaken: 'Bu kullanıcı adı kullanımda. Lütfen başka bir kullanıcı adı seçin.',
        fullName: 'Lütfen ad soyad girin.',
        age: 'Lütfen yaş girin.',
        ageRange: 'Yaş {{minAge}}–99 arasında olmalı.',
        email: 'Lütfen e-posta adresinizi girin.',
        instagram: 'Lütfen Instagram kullanıcı adınızı girin.',
        nationality: 'Lütfen uyruk seçin.',
        gender: 'Lütfen cinsiyet seçin.',
        lookingForNationality: 'Lütfen aradığınız kişinin uyruğunu seçin.',
        lookingForGender: 'Lütfen aradığınız kişinin cinsiyetini seçin.',
        heightRequired: 'Lütfen boy bilginizi girin.',
        weightRequired: 'Lütfen kilo bilginizi girin.',
        occupation: 'Lütfen mesleğinizi yazın.',
        education: 'Lütfen eğitim durumu seçin.',
        educationDepartment: 'Lütfen bölüm bilginizi yazın.',
        maritalStatus: 'Lütfen medeni durum seçin.',
        hasChildren: 'Lütfen çocuğunuz var mı seçin.',
        childrenLivingSituation: 'Lütfen çocuklarınızla yaşama durumunu seçin.',
        incomeLevel: 'Lütfen gelir durumu seçin.',
        religion: 'Lütfen dininizi seçin.',
        nativeLanguage: 'Lütfen kendi dilinizi seçin.',
        nativeLanguageOther: 'Lütfen kendi dilinizi yazın.',
        foreignLanguages: 'Lütfen yabancı dil seçin.',
        foreignLanguageOther: 'Lütfen diğer yabancı dili yazın.',
        religiousValues: 'Lütfen dinî değerlerinizi kısaca yazın.',
        familyObstacle: 'Lütfen aile engeli sorusunu yanıtlayın.',
        familyObstacleDetails: 'Lütfen aile engelini kısaca açıklayın.',
        familyApprovalStatus: 'Lütfen ailenizin onay durumu sorusunu yanıtlayın.',
        marriageTimeline: 'Lütfen evlilik zamanlamasını seçin.',
        relocationWillingness: 'Lütfen “kendi ülkeniz dışında yaşar mısınız?” sorusunu yanıtlayın.',
        preferredLivingCountry: 'Lütfen yaşamak istediğiniz ülke tercihini seçin.',
        partnerHeightMin: 'Lütfen aradığınız boy için en az seçin.',
        partnerHeightMax: 'Lütfen aradığınız boy için en çok seçin.',
        partnerAgeRange: 'Lütfen aradığınız yaş aralığını seçin.',
        partnerAgeMaxOlderYears: 'Lütfen benden büyük olabilecek yaş farkını seçin.',
        partnerAgeMaxYoungerYears: 'Lütfen benden küçük olabilecek yaş farkını seçin.',
        partnerMaritalStatus: 'Lütfen aradığınız medeni durumu seçin.',
        partnerReligion: 'Lütfen aradığınız kişinin dinini seçin.',
        expectations: 'Lütfen evleneceğiniz kişide aradıklarınızı yazın.',
        languageLevelTr: 'Lütfen Türkçe seviyenizi seçin.',
        languageLevelId: 'Lütfen Endonezce seviyenizi seçin.',
        languageLevelEn: 'Lütfen İngilizce seviyenizi seçin.',
        communicationLanguage: 'Lütfen iletişim dili seçin.',
        communicationLanguageOther: 'Lütfen diğer dili yazın.',
        translationApp: 'Lütfen çeviri uygulaması sorusunu yanıtlayın.',
        smoking: 'Lütfen sigara sorusunu yanıtlayın.',
        alcohol: 'Lütfen alkol sorusunu yanıtlayın.',
        partnerCommunicationLanguage: 'Lütfen aradığınız kişiyle iletişim dili seçin.',
        partnerCommunicationLanguageOther: 'Lütfen aradığınız kişi için diğer dili yazın.',
        partnerTranslationApp: 'Lütfen çeviri uygulaması tercihini seçin.',
        partnerLivingCountry: 'Lütfen yaşanacak ülke tercihini seçin.',
        partnerSmokingPreference: 'Lütfen aradığınız kişinin sigara tercihlerini seçin.',
        partnerAlcoholPreference: 'Lütfen aradığınız kişinin alkol tercihlerini seçin.',
        partnerChildrenPreference: 'Lütfen çocuk tercihlerini seçin.',
        partnerEducationPreference: 'Lütfen eğitim tercihini seçin.',
        partnerOccupationPreference: 'Lütfen meslek tercihini seçin.',
        partnerFamilyValuesPreference: 'Lütfen aile değerleri tercihini seçin.',
        photo1Required: 'Lütfen 1. fotoğrafı yükleyin.',
        photo2Required: 'Lütfen 2. fotoğrafı yükleyin.',
        photo3Required: 'Lütfen 3. fotoğrafı yükleyin.',
        heightRange: 'Boy 120–230 cm arasında olmalı (boş da bırakabilirsiniz).',
        weightRange: 'Kilo 35–250 kg arasında olmalı (boş da bırakabilirsiniz).',
        partnerHeightRange: 'Aradığınız boy aralığında en az, en çoktan büyük olamaz.',
        childrenCount: 'Çocuk sayısı 1–20 arasında olmalı.',
        city: 'Lütfen şehir bilgisini girin.',
        country: 'Lütfen ülke bilgisini girin.',
        whatsapp: 'Lütfen WhatsApp numaranızı girin.',
        about: 'Lütfen kısa bir tanıtım yazın.',
        photoRequired: 'Lütfen bir fotoğraf yükleyin.',
        photoType: 'Lütfen geçerli bir resim dosyası seçin.',
        consent18Plus: 'Devam etmek için {{minAge}}+ onayı gerekli.',
        consentPrivacy: 'Devam etmek için gizlilik onayı gerekli.',
        consentPhotoShare: 'Devam etmek için fotoğraf onayı gerekli.',
        submitFailed: 'Başvuru gönderilemedi. Lütfen tekrar deneyin.',
        tooFast: 'Form çok hızlı gönderildi. Lütfen bilgileri doldurup tekrar deneyin.',
        rateLimited: 'Kısa sürede çok fazla deneme yapıldı. Lütfen 1 dakika sonra tekrar deneyin.',
        recaptchaFailed: 'Spam doğrulaması yapılamadı. Lütfen sayfayı yenileyip tekrar deneyin.',
        recaptchaRejected: 'Spam koruması nedeniyle başvurunuz alınamadı. Lütfen biraz sonra tekrar deneyin.',
      },
    },
    bottomNote:
      'Not: Bu form evlilik amaçlı eşleştirme başvurusudur; profiller site içinde kamuya açık olarak listelenmez.',
  },

  weddingPage: {
    hero: {
      badge: "Türk – Endonezyalı çiftlere özel rehberlik",
      title: "Endonezya'da Evlilik Hazırlıklarınız İçin Yanınızdayız",
      description:
        "Evraklar, resmî işlemler, aileler arası iletişim ve Endonezya'daki tüm organizasyon sürecini birlikte planlayarak bu süreci kafanızı kurcalayan sorulardan uzak, güven veren bir yolculuğa dönüştürüyoruz.",
      actions: {
        openForm: "Evlilik Planı Formunu Aç",
        matchmakingApply: 'Eşleştirme Başvurusu',
        matchmakingHub: 'Eşleştirme',
        quickChat: "WhatsApp ile Hızlı Görüşme",
      },
    },
    whatsapp: {
      quickChatMessage: "Merhaba, Endonezya'da evlilik hakkında bilgi almak istiyorum",
    },
    intro: {
      servicesTitle: "Hizmetlerimiz",
      cards: [
        {
          title: "Evrak ve Resmî İşlemler",
          items: [
            "Gerekli tüm evrakların hazırlanması ve kontrolü",
            "Nikâh için resmi başvuru ve süreç takibi",
            "Nikâh sonrası resmî işlemlerin tamamlanması",
          ],
        },
        {
          title: "İletişim ve Tercümanlık",
          items: [
            "Eş adayınız ve ailesiyle iletişim desteği",
            "WhatsApp ve yüz yüze görüşmelerde tercümanlık",
            "Süreç boyunca aklınızdaki sorulara net yanıtlar",
          ],
        },
        {
          title: "Ulaşım ve Konaklama",
          items: [
            "İlk kez yurt dışına çıkacaklar için yolculuk planı",
            "Endonezya içinde özel araçla ulaşım organizasyonu",
            "Otel ve konaklama planlaması",
          ],
        },
        {
          title: "Sürekli Rehberlik ve Vize",
          items: [
            "Nikâh tamamlanana kadar kesintisiz rehberlik",
            "Endonezya'da yaşamak için vize ve oturum izni danışmanlığı",
            "Türkiye'de yaşamak için eş vizesi ve oturum süreci yönlendirmesi",
          ],
        },
      ],
      flexibleTitle: "Esnek Hizmet Anlayışı",
      flexibleP1:
        "Tüm hizmetlerimizden A'dan Z'ye faydalanabileceğiniz gibi, yalnızca ihtiyaç duyduğunuz alanlarda destek talep edebilirsiniz.",
      flexibleP2:
        "YouTube sayfamızdaki videoları izleyerek süreci, bizi ve çalışma şeklimizi daha yakından tanıyabilirsiniz.",
      flexibleNote:
        'Aşağıdan "Evlilik Planı" formunu doldurabilir ya da "Endonezya\'da Evlilik Belgeleri" sekmesinden gerekli evrakları detaylı inceleyebilirsiniz.',
    },
    steps: [
      {
        title: "Sizi ve Durumunuzu Tanıyoruz",
        description:
          "Formu dolduruyorsunuz; sizden aldığımız bilgilerle ihtiyaçlarınızı netleştiriyoruz.",
      },
      {
        title: "Sizinle Birlikte Planlıyoruz",
        description:
          "Belgeler, tarih ve süreç adımlarını; bütçenize ve beklentilerinize göre birlikte şekillendiriyoruz.",
      },
      {
        title: "Süreci Adım Adım Yönetiyoruz",
        description:
          "Endonezya'ya inişinizden nikâhın tamamlanmasına kadar her adımda yanınızdayız.",
      },
    ],
    images: {
      prepAlt: "Endonezya'da evlilik hazırlığı detay",
      ceremonyAlt: "Endonezya'da evlilik töreni",
    },
    tabs: {
      plan: "Evlilik Planı",
      documents: "Endonezya'da Evlilik Belgeleri",
    },
    plan: {
      title: "Evlilik Planınızı Bize İletin",
      subtitle:
        "Aşağıdaki alanları doldurun; size en kısa sürede, durumunuza özel bir dönüş yapalım.",
      successTitle: "Talebiniz başarıyla gönderildi!",
      successText:
        "Formu doldurduğunuz için teşekkür ederiz. 24 saat içinde size geri dönüş yapacağız.",
      form: {
        sections: {
          basicInfo: {
            title: "1. Temel Bilgileriniz",
            labels: {
              name: "Ad Soyad",
              phone: "İletişim Numarası",
              city: "Şehir",
              age: "Yaş",
            },
            placeholders: {
              name: "Adınız ve soyadınız",
              phone: "+90 555 034 3852",
              city: "Yaşadığınız şehir",
              age: "Yaşınız",
            },
          },
          privacyNote: 'Gizlilik notu: Başvuru bilgileri eşleştirme ve güvenlik amacıyla işlenir; profiliniz kamuya açık listelenmez. Kurallara aykırı durumlarda destek hattına delil (ekran görüntüsü vb.) ile başvurabilirsiniz.',
        },
        services: {
          title: "2. İhtiyaç Duyduğunuz Hizmetler",
          hint:
            "Birden fazla seçenek işaretleyebilirsiniz. Emin olmadığınız alanlar varsa boş bırakabilirsiniz.",
          options: {
            consulting: "Danışmanlık",
            paperworkTracking: "Evrak Takibi",
            familyCommunication: "Ailelerarası İletişim",
            transport: "Ulaşım",
            interpretation: "Tercümelik",
            ongoingGuidance: "Süreç Boyunca Rehberlik",
            accommodation: "Konaklama",
            honeymoon: "Balayı",
          },
        },
        schedule: {
          weddingDateLabel: "Planlanan Evlilik Tarihi",
          privacyConsent:
            "<privacyLink>Gizlilik Politikası</privacyLink>'nı okudum ve onaylıyorum",
          privacyNote:
            "Paylaştığınız bilgiler yalnızca düğün planlama amaçlı kullanılacaktır ve hiçbir şekilde üçüncü taraflara verilmeyecektir.",
        },
        actions: {
          submit: "Evlilik Planım İçin Teklif Al",
          submitting: "Gönderiliyor...",
        },
        errors: {
          privacyConsent:
            "Gizlilik politikasını okuduğunuzu ve kabul ettiğinizi onaylamalısınız.",
          sendFailed: "Teklif gönderilirken hata oluştu. Lütfen tekrar deneyiniz.",
        },
        note:
          "Formu doldurmak istemiyorsanız, sayfanın altındaki WhatsApp butonundan da bize direkt ulaşabilirsiniz.",
      },
    },
    documents: {
      title: "Endonezya'da Yabancı – Endonezyalı Evlilik İçin Gerekli Belgeler",
      subtitle:
        "Aşağıdaki başlıklar genel bilgilendirme içindir. Sizin durumunuz için net ve güncel listeyi birlikte kontrol ediyoruz.",
      foreignSpouse: {
        title: "Yabancı Eş İçin Belgeler",
        intro: "Genel olarak yabancı eşten talep edilen temel belgeler:",
        items: [
          "Geçerli pasaport (en az 6 ay geçerlilik süresi ile)",
          "Endonezya'ya giriş vizesi veya ITAS/ITAP",
          "Evlenme Ehliyet Belgesi (Endonezya Türk Büyükelçiliğinden)",
          "Doğum belgesi (çok dilli)",
          "Bekârlık belgesi (Endonezce çevrili ve apostilli)",
          "Varsa boşanma kararı veya vefat belgesi (çevrili ve noter onaylı)",
          "İkamet belgesi",
          "Son 6 ayda çekilmiş vesikalık fotoğraf",
        ],
      },
      indonesianSpouse: {
        title: "Endonezyalı Eş İçin Belgeler",
        intro: "Endonezya vatandaşı eşten ise çoğu başvuruda şu belgeler istenir:",
        items: [
          "KTP (kimlik kartı)",
          "Akte Lahir (doğum belgesi)",
          "Kartu Keluarga (aile nüfus kaydı)",
          "Medeni durum belgesi (bekâr / boşanmış / dul)",
          "N1-N10 arası formlar ve RW-RT onayları",
          "Son 6 ayda çekilmiş vesikalık fotoğraf",
        ],
      },
      extras: {
        title: "Ek Olarak İstenebilecekler",
        intro:
          "Her dosyada zorunlu olmamakla birlikte bazı şehirlerde aşağıdaki belgeler de talep edilebilir:",
        items: [
          "Gelir belgesi veya maddi durum beyanı",
          "Adli sicil kaydı",
          "Sağlık raporu",
          "Diploma",
        ],
      },
      importantNotes: {
        title: "📌 Önemli Notlar",
        items: [
          "Birçok belge için apostil ve Endonezce tercüme zorunludur. (Eş adayınızın bağlı olduğu KUA'dan öğrenin)",
          "Yapılacak bir harf hatası, eksik bir belge veya bilgi işlem sıralamasındaki bir hata tüm işlemleri olumsuz etkileyebilir.",
          "Şehir, kurum ve memura göre evrak listesi ve işleyiş değişebilir.",
        ],
      },
      personalDifferences: {
        title: "⚠️ Kişisel Durum Farklılıkları",
        p1:
          "Bu başlıklar genel çerçeveyi anlatır; önceki evlilik, çocuk durumu, vatandaşlık gibi konular evrak listenizi değiştirebilir.",
        p2:
          "Sizin durumunuz için net listeyi birlikte kontrol edip, eksiksiz hazırlamanız için adım adım yönlendiriyoruz.",
      },
      faqTitle: "Sık Sorulan Sorular",
      whatsappCta: {
        title: "Belgelerle İlgili Emin Olamadınız mı?",
        description:
          "Bize yazın; bulunduğunuz şehir, vatandaşlık ve durumunuza göre en güncel belge listesini birlikte netleştirelim.",
        action: "WhatsApp'tan Belge Listemi Sor",
        message:
          "Merhaba, Endonezya'da evlilik işlemleri ve gerekli belgeler hakkında bilgi almak istiyorum.",
      },
    },
    faq: {
      items: [
        {
          q: "Endonezya'da evlilik süreci ortalama ne kadar sürer?",
          a: "Belgelerinizin hazır olma durumuna, başvurduğunuz şehre ve kurum yoğunluğuna göre değişmekle birlikte, çoğu çift için sürecin planlama ve resmî işlemler bölümü birkaç hafta ile birkaç ay arasında tamamlanır.",
        },
        {
          q: "Endonezya'da evlilik için önce hangi adımı atmalıyım?",
          a: "Önce hangi belgelerin sizden istendiğini netleştirmek gerekir. Belgeler listesini inceledikten sonra, bulunduğunuz şehir ve durumunuza göre sizin için güncel bir kontrol listesi oluşturmak üzere bizimle WhatsApp üzerinden iletişime geçebilirsiniz.",
        },
        {
          q: "Evlilik sürecini baştan sona siz mi takip ediyorsunuz?",
          a: "Talebinize göre yalnızca belirli adımlarda destek verebildiğimiz gibi, uçtan uca tüm evrak, randevu ve resmî işlemleri sizin adınıza organize ederek süreci baştan sona takip edebiliyoruz.",
        },
        {
          q: "Evlilik işlemlerimi kendim yapabilir miyim?",
          a: "Evet, süreci kendi başınıza da yürütebilirsiniz; ancak tüm adımları ve istenen belgeleri detaylarıyla bildiğinizden emin olmanız çok önemlidir. Yapacağınız küçük bir hata, yanlış bir başvuru veya eksik bir evrak hem zaman hem de maddi açıdan ciddi kayıplara yol açabilir ve süreci manevi olarak da olumsuz etkileyebilir.",
        },
      ],
    },
    bottomCta: {
      title: "Evliliğinizi Birlikte Planlayalım",
      description: "Aşağıdaki formu doldurun veya hemen WhatsApp'tan iletişime geçin.",
      action: "WhatsApp'ta Şimdi Sor",
      message: "Merhaba, düğün paketi hakkında bilgi almak istiyorum.",
      note:
        "Mesajlarınıza Türkçe yanıt veriyoruz; gerektiğinde Endonezce olarak da aile tarafı ile iletişimde size yardımcı oluyoruz.",
    },
  },

  common: {
    open: "Aç",
    close: 'Kapat',
    loading: 'Yükleniyor…',
    downloadPdf: "PDF indir",
    learnMore: "Detaylar",
    back: "Geri dön",
    privacySecurity: {
      title: "Gizlilik & Güvenlik",
      text: "Bu sayfa Google Analytics ile izlenir. Verileriniz SSL/TLS şifreleme ile korunmaktadır.",
      policyLink: "Gizlilik Politikası",
    },
  },

  documentsHub: {
    title: "Dokümanlar",
    subtitle:
      "Paket tur sözleşmesi, mesafeli satış sözleşmesi, KVKK, iptal/iade ve ödeme talimatlarına tek sayfadan erişebilirsiniz.",
    sidebarTitle: "DOKÜMANLAR",
    openNewTab: "Yeni sekmede aç",
    source: "Kaynak: {{file}}",
    note:
      "Not: Bu sayfa yalnızca dokümanları görüntüler. Ödeme/rezervasyon adımlarında yine ilgili onay kutuları geçerlidir.",
  },

  youtubePage: {
    hero: {
      title: "YouTube Videoları",
      subscribe: "Kanalımıza abone ol",
    },
    intro: {
      title: "Videolar",
      text:
        "Endonezya’daki hayatımızı, turlarımızı ve yolculuklarımızı anlattığımız videoları burada bulabilirsiniz.",
    },
    video: {
      watch: "İzle",
    },
    cta: {
      title: "Daha fazlası için kanalımıza göz at",
      text: "Yeni videoları kaçırmamak için YouTube kanalımızı ziyaret edin ve abone olun.",
      visit: "Kanalı ziyaret et",
    },
  },

  galleryPage: {
    hero: {
      title: "Fotoğraf Galerisi",
      description:
        "Endonezya’daki evlilik sürecimizden, seyahatlerimizden ve günlük hayatımızdan kısa kısa kareler.",
    },
    content: {
      title: "Endonezya’dan Kareler",
      description:
        "Fotoğraf galerimizde hem nikah görüntülerinden, hem de Endonezya’daki keşiflerimizden ve günlük hayatımızdan kareleri bulabilirsiniz. Görselleri belirli aralıklarla en son çektiğimiz fotoğraflarla güncellemeye devam edeceğiz.",
      backToAbout: "Hakkımızda sayfamıza dön",
      footerNote:
        "Bu sayfadaki görselleri zamanla kendi arşivimizden gerçek fotoğraflarla güncelleyeceğiz.",
    },
    modal: {
      close: "Kapat",
    },
    images: {
      "1": { alt: "Sukabumi Siti Gunung şelalesinden bir alıntı" },
      "2": { alt: "Tapınak ziyaretimizden bir hatıra" },
      "3": { alt: "Yogyakarta tapınaklarından bir kare" },
      "4": { alt: "Ciwidey çay bahçelerinden bir anımız" },
      "5": { alt: "Endonezya doğasında yürüyüşten bir kare" },
      "6": { alt: "Situ Patenggan Gölü manzarasından bir kare" },
      "7": { alt: "Salih ve Tini'nin nikahından bir kare" },
      "8": { alt: "Yogyakarta tapınak turundan bir an" },
      "9": { alt: "Salih ve Tini'nin nikah anısından bir kare" },
      "10": { alt: "Pangandaran sahilinde ATV turundan bir kare" },
      "11": { alt: "Pangandaran resort otelinden bir hatıra" },
      "12": { alt: "Sukabumi şelalesinden manzaralar" },
      "13": { alt: "Citumang body rafting alanından bir kare" },
    },
  },

  privacyPage: {
    title: "Gizlilik Politikası",
    sections: {
      intro: {
        title: "1. Tanıtım",
        text:
          "Uniqah, müşteri gizliliğine ve veri koruma haklarına saygı duymaktadır. Bu gizlilik politikası, kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.",
      },
      dataCollected: {
        title: "2. Toplanan Veriler",
        text: "Web sitemiz aracılığıyla aşağıdaki verileri toplayabiliriz:",
        items: [
          "Ad ve soyadı",
          "Email adresi",
          "Telefon numarası",
          "Seyahat tercihleri",
          "Tarayıcı ve cihaz bilgileri",
        ],
      },
      dataUsage: {
        title: "3. Verilerin Kullanımı",
        text: "Toplanan veriler aşağıdaki amaçlarla kullanılır:",
        items: [
          "Seyahat ve evlilik hizmetleri sunmak",
          "İletişim ve müşteri desteği sağlamak",
          "Web sitesini geliştirmek",
          "Pazarlama ve promosyon mesajları göndermek (izin ile)",
        ],
      },
      security: {
        title: "4. Veri Güvenliği",
        text:
          "Kişisel verileriniz, endüstri standardı şifreleme ve güvenlik önlemleri kullanılarak korunur. Ancak, internet üzerindeki hiçbir aktarım %100 güvenli değildir.",
      },
      rights: {
        title: "5. Haklarınız",
        text:
          "Kişisel verileriniz hakkında bilgi almak, düzeltmek veya silettirilmek için bize yazılı olarak başvurabilirsiniz.",
      },
      contact: {
        title: "6. İletişim",
        text:
          "Gizlilik politikası hakkında sorularınız için bize <emailLink>endonezyakasifi@gmail.com</emailLink> adresinden ulaşabilirsiniz.",
      },
    },
    lastUpdated: "Son güncellenme: {{date}}",
  },

  notFoundPage: {
    title: "Sayfa Bulunamadı",
    backHome: "Ana Sayfa'ya Dön",
  },

  floatingWhatsapp: {
    label: "WhatsApp",
    ariaLabel: "WhatsApp üzerinden mesaj gönder",
    messages: {
      default: "Merhaba, bilgi almak istiyorum.",
      home: "Merhaba, Uniqah hakkında bilgi almak istiyorum.",
      explore: "Merhaba, Endonezya destinasyonları hakkında bilgi almak istiyorum.",
      travel: "Merhaba, Endonezya tatil planı hakkında bilgi almak istiyorum.",
      wedding: "Merhaba, Endonezya’da evlilik süreci hakkında bilgi almak istiyorum.",
      youtube: "Merhaba, YouTube videolarınız hakkında bilgi almak istiyorum.",
      contact: "Merhaba, iletişim hakkında bilgi almak istiyorum.",
      tours: "Merhaba, tur paketleri hakkında bilgi almak istiyorum.",
      documents: "Merhaba, dokümanlar hakkında bilgi almak istiyorum.",
    },
  },

  home: {
    hero: {
      badgeCompany: "Endonezya’da kayıtlı PT MoonStar Global Indonesia",
      badgeSocial: "Uniqah sosyal hesapları",
      title: "Uniqah",
      subtitle: "Tur organizasyonu • Evlilik rehberliği • Sahada gerçek destek",
      description:
        "Endonezya’da balayı, keşif ve tatil odaklı butik tur paketleri ve kişiye özel seyahat planları tasarlıyoruz. Aynı zamanda Endonezya’da evlilik için gelen çiftlere; otel, ulaşım, tercümanlık ve resmi evrak süreçlerinde adım adım rehberlik ediyoruz.",
      note: "Endonezya’da yaşayan bir Türk girişimci tarafından kurulan, Endonezya merkezli bir yapı.",
      ctaTours: "Tur paketlerini incele",
      ctaBrochures: "Broşürleri PDF indir",
      ctaTrust: "Güven & Yasal",
    },
    trust: {
      items: [
        {
          title: "Şeffaf süreç",
          description: "Ön kayıt → yazılı teklif → sözleşme/ödeme adımları net ilerler.",
        },
        {
          title: "Türkçe destek",
          description: "Türkiye hattı WhatsApp destekli; sahada Endonezya operasyonu.",
        },
        {
          title: "Yasal yapı",
          description: "Uniqah, Endonezya’da kayıtlı PT MoonStar Global Indonesia markasıdır.",
        },
      ],
    },
    services: {
      title: "Sizin için neler yapıyoruz?",
      cards: {
        joinTours: {
          title: "Toplu turlara katılım",
          description:
            "Bali, Lombok, Komodo ve diğer Endonezya adalarına düzenlenen planlı tur paketlerimize bireysel, ailenizle veya arkadaşlarınızla birlikte katılabilirsiniz.",
        },
        groupTours: {
          title: "Kurumsal tur organizasyonu",
          description:
            "Şirketler, okullar, dernekler ve arkadaş grupları için tarih, kişi sayısı ve bütçenize göre özel Endonezya grup turları planlıyor; toplantı, etkinlik ve ekip çalışması programlarını birlikte tasarlıyoruz.",
        },
        privateTravel: {
          title: "Bireysel / aile seyahati",
          description:
            "Kendiniz veya aileniz için uçuş, konaklama ve rota içeren kişiye özel Endonezya tatil planı hazırlıyor, Bali ve çevresini kendi temponuzda keşfetmenizi sağlıyoruz.",
        },
        wedding: {
          title: "Evlilik danışmanlığı",
          description:
            "Evlilik sürecinizde belgeler, yasal işlemler, rehberlik, tercümanlık, ulaşım ve konaklama gibi tüm adımlarda yanınızda olarak Endonezya'da nikahınızı sorunsuzca tamamlamanıza yardımcı oluyoruz.",
        },
        youtube: {
          title: "YouTube videoları",
          description:
            "Seyahatlerimizden ve evlilik sürecimizden seçilmiş videoları bu sitede bulabilir; YouTube kanalımızda diğer videolarımızı izleyerek Endonezya'yı ve sunduğumuz desteği daha yakından tanıyabilirsiniz.",
        },
        dameturk: {
          title: "DaMeTurk (alt marka)",
          aria: "DaMeTurk - Orijinal Türk dondurması",
          description:
            "PT MoonStar Global Indonesia bünyesinde, Endonezya’da DaMeTurk markamızla orijinal Türk dondurması faaliyetini yürütüyoruz. Detaylar ve güncel içerik için dameturk.com’u ziyaret edebilirsiniz.",
        },
      },
    },

    howItWorks: {
      title: "Nasıl ilerliyoruz?",
      steps: [
        {
          title: "1) Ön kayıt",
          description: "Ücretsiz ve bağlayıcı değil. İhtiyacınızı netleştiriyoruz.",
        },
        {
          title: "2) Yazılı paket",
          description: "Program + dahil/hariç + önemli notlar yazılı paylaşılır.",
        },
        {
          title: "3) Onay & ödeme",
          description: "Sözleşme inceleme → ödeme → rezervasyon kesinleşir.",
        },
      ],
      ctaTours: "Tur paketlerini gör",
      ctaDocuments: "Dokümanlar",
    },

    features: {
      title: "Neden bizimle ilerlemek daha kolay?",
      items: [
        {
          title: "Deneyimden gelen rehberlik",
          description:
            "Endonezya'da yaşamanın ve sahada tur organize etmenin getirdiği deneyimi; rota seçimi, konaklama ve günlük akışta sizin için kullanıyoruz.",
        },
        {
          title: "Sade ve şeffaf iletişim",
          description:
            "Endonezce, Türkçe ve İngilizce desteğiyle, tüm süreci anlaşılır bir dille anlatıyor; soru işaretlerini en baştan temizliyoruz.",
        },
        {
          title: "Bütçenize uygun planlama",
          description:
            "Seyahat, konaklama ve günlük hayat masraflarını birlikte ele alarak, sürpriz maliyetleri en aza indiren bir plan çıkarıyoruz.",
        },
      ],
    },

    cta: {
      eyebrow: "Sorularınızı çekinmeden sorun",
      title: "Endonezya ile ilgili aklınızdaki her şeyi birlikte netleştirelim",
      description:
        "İster planladığınız tur paketleri, ister kişisel Endonezya seyahat planınızla ilgili olsun… Kafanıza takılan tüm detayları Türkçe olarak sorabilir, süreci birlikte sade ve anlaşılır hale getirebiliriz.",
      ctaContact: "İletişim formunu aç",
      ctaWhatsapp: "WhatsApp ile sor",
    },
  },

  corporatePage: {
    hero: {
      badge: 'Güven & Yasal',
      description:
        'Bu sayfa; “Bu site kime ait?”, “Ödeme/tahsilat kimin adına?”, “Sözleşmeler hangi tüzel kişiyle?” gibi sorulara net cevap veren kurumsal bilgi merkezidir.',
    },
    summary: {
      brandLine:
        'Endonezya’da kayıtlı {{company}} şirketinin markasıdır. Sözleşme tarafı ve tahsilat süreçleri bu tüzel kişi üzerinden yürütülür.',
      documents: 'Dokümanlar & Sözleşmeler',
      brochures: 'Tur broşürleri (PDF)',
    },
    brandInfo: {
      title: 'Marka ve şirket bilgileri',
      labels: {
        brand: 'Marka',
        legalName: 'Yasal ünvan',
        tax: 'NPWP',
        nib: 'NIB',
      },
      socialNote:
        'YouTube ve Instagram hesap adlarımız endonezyakasifi olarak kalır ve marka iletişimimizi destekler.',
    },
    contact: {
      title: 'İletişim ve adres',
      trLabel: 'TR / WhatsApp',
      idLabel: 'ID',
    },
    parentCompany: {
      badge: 'Ana şirket',
      caption: '{{brand}} operasyonlarının yasal çatısı',
    },
    billing: {
      title: 'Ödeme, tahsilat ve sözleşmeler',
      items: {
        collection: {
          title: 'Tahsilat',
          body: 'Ödemeler, bankacılık kayıtlarında {{company}} adına görünebilir.',
        },
        contract: {
          title: 'Sözleşme tarafı',
          body: 'Paket tur / mesafeli satış gibi sözleşmelerde tüzel kişi olarak {{company}} yer alır.',
        },
      },
    },
    documents: {
      title: 'Doküman merkezi',
      body: 'Tüm güncel dokümanlar, sözleşmeler ve politikalar burada.',
      cta: 'Dokümanları aç',
      brochureNote: 'Broşürleri PDF olarak indirmek isterseniz:',
      brochureLink: 'Tur Broşürleri',
    },
    otherBrand: {
      title: 'Diğer markamız',
      aria: 'DaMeTurk web sitesini aç',
      body: '{{company}} bünyesindeki orijinal Türk dondurması markamız.',
    },
    faq: {
      title: 'Sık sorulan kısa sorular',
      items: {
        siteCompany: {
          q: 'Bu site hangi şirkete bağlı?',
          a: '{{brand}}, Endonezya’da kayıtlı {{company}} şirketinin markasıdır. Sözleşme ve tahsilat süreçleri bu tüzel kişi üzerinden yürütülür.',
        },
        paymentCompany: {
          q: 'Ödeme ekranında farklı bir şirket adı görürsem?',
          a: 'Bu normaldir: tahsilat ve sözleşmeler {{company}} üzerinden yürütüldüğü için, ödeme kanallarında bu ünvan görünebilir.',
        },
        dameturk: {
          q: 'DaMeTurk sizin mi?',
          a: 'Evet. DaMeTurk, {{company}} bünyesinde faaliyet gösteren markalarımızdan biridir ve kendi web sitesi üzerinden hizmet verir.',
        },
      },
      editOnce: {
        usernameLocked: 'Edit modunda kullanıcı adı değiştirilemez (1 defalık düzeltme hakkı).',
        photosLocked: 'Edit modunda fotoğraf güncelleme kapalı. Sadece form alanlarını düzeltebilirsiniz.',
      },
    },
  },

  about: {
    hero: {
      title: "Hakkımızda",
      subtitle: "Endonezya’da seyahat ve tur deneyiminizi, sahada kurduğumuz yapı ve birikimle adım adım kolaylaştırıyoruz.",
    },
    brand: {
      title: "Marka yapımız",
      p1:
        "Bu web sitesi, PT MoonStar Global Indonesia çatısı altında yürüttüğümüz hizmetlerin vitrini ve iletişim noktasıdır. Kamuya dönük marka iletişimimizi ise Uniqah adıyla sürdürüyoruz.",
      p2:
        "MoonStar Global Indonesia; Endonezya’da yaşayan bir Türk girişimci tarafından, Türk misafirlerin beklentilerini yerinde anlayan ve sahada çözen bir yapı kurmak amacıyla hayata geçirilmiştir. Tur paketleri ve satış iletişimi, Türk misafirlere daha anlaşılır bir deneyim sunmak için Uniqah markası altında yürütülür.",
      cards: {
        toursTitle: "Tur organizasyonu",
        toursDesc: "Bali, Lombok, Komodo ve daha fazlası için planlı turlar ve kişiye özel seyahat planları.",
        weddingTitle: "Evlilik rehberliği",
        weddingDesc: "Otel, ulaşım, tercümanlık ve resmi evrak süreci dahil uçtan uca takip.",
        dameturkTitle: "DaMeTurk",
        dameturkDesc:
          "PT MoonStar Global Indonesia bünyesindeki orijinal Türk dondurması markamız. Detaylar için dameturk.com.",
      },
      socialNote:
        "YouTube ve Instagram hesap adlarımız endonezyakasifi olarak kalır ve bu marka çatısına içerik üretimiyle destek verir.",
    },
    philosophy: {
      title: "Seyahati Nasıl Görüyoruz?",
      intro:
        "Biz, seyahati yalnızca bir destinasyona gitmek olarak görmüyoruz. Bizim için seyahat; doğru planlandığında insanı yormayan, gerçekten dinlendiren, keşif hissi uyandıran ve sonunda “iyi ki gelmişim” dedirten bir deneyimdir. Bu bakış açısıyla yola çıktık ve tüm organizasyon anlayışımızı bu temel üzerine inşa ettik.",
      sections: {
        direct: {
          title: "Aracısız organizasyon, yerinde planlama",
          p1:
            "Hazırladığımız tüm tur programları, doğrudan Endonezya’daki saha ekibimiz tarafından planlanır ve uygulanır. Kataloglardan alınmış, birden fazla aracıdan geçmiş, masa başında oluşturulmuş paketler sunmayız. Bu yaklaşımın en büyük farkı şudur: tur bütçesi, aracı maliyetlerine değil doğrudan deneyimin kendisine harcanır.",
          p2:
            "Misafirlerimiz böylece aynı bütçeyle daha dolu içeriklere, daha kaliteli aktivitelere ve daha net, şeffaf kapsama ulaşır.",
        },
        planning: {
          title: "Bilerek, ölçerek ve dengeleyerek planlıyoruz",
          p1:
            "Her tur programı; rota mantığı, günlük tempo dengesi, serbest zaman ve rehberli gün oranı, fiziksel yorgunluk faktörü ve farklı beklentilere sahip katılımcı profilleri dikkate alınarak hazırlanır. Amacımız, programı “kalabalık göstermek” değil; akıcı, dengeli ve gerçekten keyifli hale getirmektir.",
          bullets: [
            "Rehberli günlerde herkesin birlikte deneyimlemesi gereken aktiviteleri kapsama dahil ederiz.",
            "Serbest günlerde misafirlere özgürlük alanı tanırız.",
            "Ekstra deneyimleri baştan net şekilde sunarız.",
          ],
          p2: "Böylece kimsenin aklında “Burada ne ekstra, ne dahil?” sorusu kalmaz.",
        },
        transparency: {
          title: "Şeffaflık bizim için bir seçenek değil, standarttır",
          p1:
            "Bir turun neleri kapsadığı, neleri kapsamadığı en başından bellidir. Belirsiz ifadeler, sürpriz masraflar ve sonradan ortaya çıkan ek ödemeler bizim çalışma anlayışımızda yer almaz. Rehberli günlerde programda yer alan aktiviteler ve grup halinde gerçekleştirilen organizasyonlar tur kapsamındadır; serbest zamanlarda ise tercihler tamamen misafirlere aittir ve bu durum açıkça belirtilir.",
        },
        comfort: {
          title: "Herkes için keyifli ve huzurlu bir tatil",
          p1:
            "Turlarımız, her katılımcının eşit şekilde tatil keyfi yaşayabilmesi prensibiyle organize edilir. Grup içi uyum, karşılıklı saygı ve nezaket bizim için en az program kadar önemlidir.",
          p2:
            "Hedefimiz; kimsenin başkasının tatilini gölgelemediği, huzurlu, güvenli ve dengeli bir ortam sunmak ve herkesin memnun şekilde evine dönmesini sağlamaktır. Çünkü iyi bir tur, sadece gezilen yerlerle değil; nasıl bir atmosferde geçtiğiyle hatırlanır.",
        },
        guidance: {
          title: "Sadece tur değil, gerçek rehberlik sunuyoruz",
          p1:
            "Sunduğumuz hizmet, bir tur paketinin çok ötesindedir. Sahada olan, bölgeyi yakından tanıyan ve gerektiğinde hızlı çözüm üretebilen bir ekiple çalışırız. Misafirlerimizin seyahat sürecinde kendini güvende hissetmesi, bizim için organizasyonun ayrılmaz bir parçasıdır.",
        },
        wedding: {
          title: "Endonezya’da evlilik rehberliği",
          p1:
            "Seyahat organizasyonlarımızın yanı sıra, Endonezya’da evlilik gibi özel ve hassas süreçlerde de rehberlik sunuyoruz. Bu hizmeti ayrı bir başlık olarak ele almamızın nedeni, sürecin ciddiyetini ve sorumluluğunu bilmemizdir.",
          p2:
            "Evlilik rehberliği; resmi prosedürler, yerel uygulamalar, zamanlama ve koordinasyon gibi detaylara hâkim olmayı gerektirir. Bu alanda sunduğumuz rehberlik, sahadaki deneyimimizin ve yerel bilgi birikimimizin doğal bir sonucudur. Bu yaklaşım, misafirlerimize sadece bir hizmet değil; güvenle ilerleyebilecekleri bir süreç yönetimi sunar.",
        },
        expectation: {
          title: "Bizimle seyahat edenler ne bekleyeceğini bilir",
          p1:
            "Bizimle yola çıkanlar; ne alacağını, neye ödeme yaptığını bilir ve tatiline odaklanıp organizasyon detaylarını bize bırakır. Bizim için en büyük referans, tur sonunda “iyi ki bu ekiple gelmişim” diyen misafirlerdir.",
        },
      },
      outro:
        "Uniqah eşleştirme sistemi ve Endonezya’da evlilik rehberliği hakkında daha fazla bilgi için <1>Uniqah</1> ve <3>Evlilik</3> sayfalarına göz atabilir; resmi dokümanlar için <5>Dokümanlar</5> bölümünü kullanabilirsiniz.",
    },
    story: {
      title: "Kısa hikâyemiz",
      steps: [
        "Endonezya’ya yerleşip kendi hayatımızı ve düzenimizi burada kurduk.",
        "Farklı adaları gezerek ülkeyi yakından tanıdık, seyahat ve günlük yaşam ritmimizi oturttuk.",
        "YouTube kanalımızı açarak Endonezya’daki hayatımızı ve seyahat deneyimlerimizi paylaşmaya başladık.",
        "Bugün, Endonezya’ya seyahat ve tur planlayan misafirlerimize ve evlilik sürecindeki çiftlere bu deneyimle rehberlik ediyoruz.",
      ],
      stepLabel: "Adım",
    },

    support: {
      title: "Hangi konularda yanınızdayız?",
      items: {
        joinScheduled: {
          title: "Toplu turlara bireysel / aile katılım",
          description:
            "Planlı Endonezya tur paketlerimize bireysel olarak, eşinizle ya da ailenizle birlikte katılabilirsiniz. Tarih, kontenjan ve kapsamı net şekilde belirtilmiş turlar arasından size uyan programı seçip doğrudan rezervasyon yapmanız için Toplu Tur Paketleri sayfasını kullanabilirsiniz.",
        },
        translation: {
          title: "Çeviri ve iletişim desteği",
          description:
            "Gerek rehberli günlerde, gerek serbest zamanlarınızda ve bireysel alışverişlerinizde Türkçe bilen bir tercüman eşlik edebilir; böylece Endonezya’da dil bariyerini ortadan kaldırıp kendinizi daha güvende hissedebilirsiniz.",
        },
        privatePlan: {
          title: "Bireysel seyahat ve balayı planlama",
          description:
            "Herhangi bir toplu tura katılmak yerine kendi Endonezya seyahatinizi ya da balayı tatilinizi planlamak istiyorsanız; uçuş, konaklama, günlük rota ve deneyim önerilerini birlikte kurguluyor, size özel bir plan çıkarıyoruz. Böylece kendi temponuza uygun, esnek ama iyi düşünülmüş bir programla seyahat edebilirsiniz.",
        },
        privateGroups: {
          title: "Kurumsal ve arkadaş grupları için özel turlar",
          description:
            "Şirketler, okullar, dernekler veya arkadaş grupları için tarih, bütçe ve beklentilere göre tamamen size özel tur programları tasarlıyoruz. Kapalı grup turlarınız için Grup Turları sayfası üzerinden talep oluşturabilirsiniz.",
        },
        logistics: {
          title: "Konaklama ve ulaşım planlama",
          description:
            "İsterseniz tur paketi veya kapsamlı bir seyahat planı almadan da; yalnızca otel rezervasyonu, uçak bileti alımı veya araç kiralama gibi ekstra hizmetlerimizden faydalanabilirsiniz. Bütçenize ve konforunuza uygun, güvenilir alternatifleri birlikte seçeriz.",
        },
        wedding: {
          title: "Endonezya’da evlilik sürecine rehberlik",
          description:
            "Endonezya’da evlilik planlayan çiftler için, resmi adımların zamanlaması, yerel uygulamalar ve süreç koordinasyonu konusunda rehberlik sunuyoruz. Bu hizmetin detaylarını, evlilik rehberliği sayfasında ayrı bir başlık olarak ele alıyoruz.",
        },
      },
    },

    galleryTeaser: {
      title: "Seyahatlerimizden ve deneyimlerimizden birkaç örnek",
      description:
        "Aşağıda, Endonezya’daki seyahatlerimizden ve sahadaki deneyimlerimizden seçtiğimiz birkaç örnek kareyi görebilirsiniz. Daha fazlası için galerimize göz atabilirsiniz.",
      cta: "Fotoğrafların tamamını görmek için galerimizi ziyaret edin",
      previewAlt1: "Endonezya’daki hayatımızdan bir kare",
      previewAlt2: "Endonezya’da birlikte geçirdiğimiz bir günden kare",
      previewAlt3: "Endonezya’daki özel bir anımızdan kare",
    },

    youtubeHighlights: {
      title: "Bizi en iyi anlatan videolar",
      description:
        "YouTube kanalımızda, Endonezya’daki hayatımızı, seyahatlerimizi ve keşiflerimizi anlattığımız videolar bulabilirsiniz. Aşağıdaki iki video, bizi ve sunduğumuz desteği en iyi özetleyen içeriklerdir.",
      v1Title: "Endonezya’da evlilik sürecinde destek verdiğimiz bir çiftin hikâyesi",
      v1Desc:
        "Endonezya’da evlilik sürecini bizimle birlikte yürüten bir çiftin deneyimini ve nasıl destek olduğumuzu görebilirsiniz.",
      v1ThumbAlt: "Endonezya’da evlilik sürecinde destek verdiğimiz bir çiftin hikâyesi",
      v2Title: "Endonezya'da Böyle Bir Yer Olduğuna İnanamayacaksınız! Citumang Maceramız",
      v2Desc: "Doğa, macera ve Endonezya’daki günlük yaşamdan keyifli bir kesit.",
      v2ThumbAlt: "Citumang macerası videosu",
    },

    whyUs: {
      title: "Neden Biz?",
      items: [
        {
          title: "Doğrudan organizatörle çalışma",
          description:
            "Aracı acenteler yerine, turu sahada planlayan ve yürüten ekiple çalışırsınız; kararlar ve cevaplar ilk kaynaktan gelir.",
        },
        {
          title: "Şeffaf ve net maliyetler",
          description:
            "Program, dahil olanlar ve olmayanları en baştan netleştirir; gizli ücretler yerine öngörülebilir, açık bir maliyet tablosu sunarız.",
        },
        {
          title: "Sahada sorumluluk alan ekip",
          description:
            "Sadece turu satarken değil, sahada da yanınızdayız; program akışını takip eder, gerektiğinde yerinde çözüm üreterek misafir memnuniyetini en öncelikli hedef yaparız.",
        },
      ],
    },

    modal: {
      close: "Kapat",
    },
  },


  contact: {
    hero: {
      title: "İletişim",
      p1: "Sorularınız, önerileriniz veya seyahat planınız için bize ulaşın. Size yardımcı olmaktan mutluluk duyarız.",
      p2:
        "Aklınızdaki her soru için bizimle iletişime geçebilirsiniz. Ücretsiz danışmanlık sunuyoruz. Formu doldurarak ya da WhatsApp üzerinden hızlıca ulaşabilirsiniz.",
    },
    sidebar: {
      title: "İletişim Bilgileri",
      socialTitle: "Sosyal Medya",
      phone: "Telefon",
      email: "Email",
      whatsapp: "WhatsApp",
      location: "Konum",
      askNow: "Hemen Sor",
      indonesia: "Endonezya",
    },
    form: {
      title: "Bize Mesaj Gönderin",
      success:
        "Formu doldurduğunuz için teşekkür ederiz. 24 saat içinde size geri dönüş yapacağız.",
      privacyError: "Gizlilik politikasını okuduğunuzu ve kabul ettiğinizi onaylamalısınız.",
      sendError: "Mesaj gönderilirken hata oluştu. Lütfen tekrar deneyin.",
      labels: {
        name: "Ad Soyad *",
        email: "E-posta *",
        phone: "Telefon",
        subject: "Konu *",
        message: "Mesaj *",
      },
      placeholders: {
        name: "Adınız Soyadınız",
        email: "ornek@email.com",
        phone: "+90 5xx xxx xx xx",
        subject: "Kısaca konu başlığı",
        message: "Mesajınızı yazın",
      },
      consent: "<privacyLink>Gizlilik Politikası</privacyLink>'nı okudum ve kabul ediyorum.",
      privacyLink: "Gizlilik Politikası",
      submit: "Gönder",
      submitting: "Gönderiliyor…",
    },
  },

  authPage: {
    title: 'Giriş / Kayıt',
    context: {
      payment: 'Ödeme adımına devam etmek için giriş yapın.',
      panel: 'Profilime devam etmek için giriş yapın.',
      generic: 'Devam etmek için giriş yapın.',
    },
    forceInfo: 'Bu işlem için yeniden giriş yapmanız istendi. Lütfen tekrar giriş yapın.',
    googleCta: 'Google ile devam et',
    googleSignupCta: 'Google ile kayıt ol',
    redirecting: 'Google girişine yönlendiriliyorsunuz…',
    signupGuide: 'Kayıt için önce cinsiyet ve uyruk seçip yaş onayını işaretleyin.',
    or: 'veya',
    labels: {
      email: 'E-posta',
      password: 'Şifre',
      gender: 'Cinsiyet',
      nationality: 'Uyruk',
      nationalityOther: 'Diğer uyruk (yazın)',
    },
    placeholders: {
      email: 'ornek@email.com',
      password: 'Şifreniz',
      nationality: 'Uyruk seçin',
      nationalityOther: 'Örn: Almanya',
    },
    actions: {
      login: 'Giriş yap',
      signup: 'Kayıt ol',
      switchToSignup: 'Hesabın yok mu? Kayıt ol',
      switchToLogin: 'Zaten hesabın var mı? Giriş yap',
      forgot: 'Şifremi unuttum',
    },
    signup: {
      genderMale: 'Erkeğim',
      genderFemale: 'Kadınım',
      nationalityTr: 'Türkiye',
      nationalityId: 'Endonezya',
      nationalityOther: 'Diğer',
      ageConfirm: '{{minAge}} yaşından büyük olduğumu onaylıyorum. (Detaylar için sözleşmeyi aç)',
      ageConfirmLink: 'Sözleşme',
    },
    forgotHint: {
      prefix: 'Şifrenizi unuttuysanız',
      suffix: 'butonuna basıp e-posta adresinize sıfırlama bağlantısı gönderebilirsiniz.',
    },
    legal: {
      prefix: 'Devam ederek',
      contract: 'Kullanıcı / Üyelik sözleşmesi',
      cancelRefund: 'İptal / iade politikası',
      privacy: 'Gizlilik Politikası',
    },
    resetSent: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
    errors: {
      googleFailed: 'Google ile giriş başarısız.',
      invalidCredential: 'E-posta veya şifre hatalı ya da hesap bulunamadı. Şifrenizi unuttuysanız “Şifremi unuttum” ile sıfırlamayı deneyin.',
      invalidEmail: 'E-posta adresi geçersiz görünüyor. Lütfen kontrol edin.',
      emailAlreadyInUse: 'Bu e-posta adresiyle zaten bir hesap var. “Giriş yap” veya “Şifremi unuttum” seçeneğini kullanın.',
      weakPassword: 'Şifre çok zayıf. Daha güçlü bir şifre deneyin (ör. en az 6 karakter).',
      emailPasswordRequired: 'E-posta ve şifre gerekli.',
      genderRequired: 'Kayıt olmak için cinsiyet seçin.',
      nationalityRequired: 'Kayıt olmak için uyruk seçin.',
      nationalityOtherRequired: 'Lütfen uyruğunuzu yazın.',
      ageConfirmRequired: 'Kayıt olmak için en az {{minAge}} yaşında olduğunuzu onaylamalısınız.',
      loginFailed: 'Giriş başarısız.',
      resetEmailRequired: 'Şifre sıfırlamak için e-posta girin.',
      resetFailed: 'Şifre sıfırlama e-postası gönderilemedi.',
      emailNotVerified: 'E-posta doğrulanmadı. Lütfen gelen kutundaki doğrulama bağlantısını tıklayın.',
      emailVerificationSent: 'Doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.',
      emailVerificationSend: 'Doğrulama e-postasını tekrar gönder',
      emailVerificationFailed: 'Doğrulama e-postası gönderilemedi. Lütfen tekrar deneyin.',
    },
  },

  matchmakingPanel: {
        profile: {
          guidanceAfterConfirm: {
            title: 'Kesin eşleşme sonrası destek',
            body:
              'Kesin eşleşme kararından sonra eş adaylarının birbirine güven kazanması ve evlilik adımlarında aileler arası iletişim, tercümanlık, evlilik kararı öncesi eş adaylarının verdiği bilgilerin doğruluğunu araştırma ve daha birçok kolaylıktan faydalanmak için sitemizde bulunan evlilik rehberliği sayfamız aracılığıyla rehberlik ekibimizden hizmet alabilirsiniz.',
            cta: 'Evlilik rehberliği sayfasını aç',
          },
        },
    title: 'Profilim',
    subtitle: 'Evlilik eşleştirme, üyelik ve iletişim adımlarınız burada görünecek.',
    tabs: {
      info: 'Açıklamalar/Kurallar',
      matches: 'Eşleşmelerim',
    },
    photos: {
      title: 'Fotoğraflarım',
      lead: 'Form doldururken yüklediğin fotoğraflar.',
      empty: 'Henüz fotoğraf yüklenmemiş.',
      updateRequest: {
        title: 'Fotoğraf güncelleme isteği',
        lead: '3 yeni fotoğraf yükleyin. Admin onayladıktan sonra profilinizde güncellenecek.',
        pending: 'İncelemede',
        cta: 'İstek gönder',
        uploading: 'Yükleniyor…',
        success: 'İsteğiniz alındı. İnceleme sonrası fotoğraflar güncellenecek.',
        errors: {
          photosRequired: 'Lütfen 3 fotoğraf seçin.',
          photoType: 'Sadece görsel dosyaları seçin (jpg/png/webp).',
          applicationNotFound: 'Başvuru bulunamadı. Önce formu doldurun.',
          failed: 'İstek gönderilemedi. Lütfen tekrar deneyin.',
        },
      },
    },
    trust: {
      title: 'Bu sistem neden form ister?',
      lead:
        'Eşleştirme “rastgele profil gezme” değil; sizin bilgilerinizle çalışan kapalı bir sistem. Formu bir kez doldurmanız, uygun adayları isabetli şekilde seçebilmemiz ve süreci güvenli yürütmemiz için gerekir. Bilgileriniz herkese açık listelenmez.',
      cards: {
        quality: {
          title: 'Daha isabetli eşleşme',
          body: 'Yaş, şehir, beklenti ve temel kriterler; doğru adayı daha hızlı bulmamıza yardım eder.',
        },
        privacy: {
          title: 'Gizlilik odaklı akış',
          body: 'Profiliniz kamuya açık değildir. Adaylar panelinize kontrollü şekilde gelir; siz onaylamadan iletişim açılmaz.',
        },
        control: {
          title: 'Kontrol sizde',
          body: 'Panelde beğen/geç ile ilerlersiniz. Süreçte değişiklik gerekirse WhatsApp’tan kolayca güncelleyebilirsiniz.',
        },
      },
      rulesTitle: 'Sistem kuralları (kısa)',
      rules: [
        'Bu sistem sadece evlilik amacı güdenler için tasarlanmıştır.',
        'Kesinlikle flört, eğlence, boş zaman geçirme, evlilik amacı dışında birliktelik gibi niyetlere izin verilmez.',
        'Bu sitede karşılıklı saygı çok önemlidir; küfürlü, argo ve hakaret içerikli konuşmak yasaktır.',
        'Ahlak dışı davranışlara asla müsamaha gösterilmez.',
        'İnsanları dolandırmaya ve aldatmaya yönelik faaliyetler, dijital para tuzakları ya da benzeri çıkar girişimleri yasaktır.',
        'Cinsel istismar kesinlikle yasaktır.',
        'Kurallara uymayanlar; ihlaller tespit edildiği an sistemden engellenir, varsa aktif üyeliği iptal edilir ve para iadesi yapılmaz.',
        'Bu siteye kayıt oluşturan herkes bu kuralları okumuş ve onaylamış kabul edilir.',
      ],
    },
    actions: {
      logout: 'Çıkış',
      profileForm: 'Profil formu',
      whatsapp: 'WhatsApp’tan yaz',
      remove: 'Kaldır',
      sending: 'Gönderiliyor…',
      canceling: 'İptal ediliyor…',
      pending: 'Beklemede…',
      accept: 'Onayla',
      accepted: 'Onay verdiniz',
      reject: 'Reddet',
      rejected: 'Reddettiniz',
      rejectAll: 'Hepsini reddet',
      rejectAllConfirm: 'Tüm adayları reddetmek istediğinize emin misiniz?',
      rejectAllSuccess_one: '{{count}} eşleşme reddedildi.',
      rejectAllSuccess_other: '{{count}} eşleşme reddedildi.',
      showOldMatches: 'Eski eşleşmeleri göster',
      hideOldMatches: 'Sadece seçtiğim adayı göster',
      dismissMatch: 'Eşleşmeyi panelimden kaldır',
      requestNew: 'Yeni eşleşme talep et',
      requestNewWithRemaining: 'Yeni eşleşme talep et ({{remaining}}/{{limit}})',
      requestingNew: 'Talep gönderiliyor…',
      requestNewQuotaHint: 'Günlük hak: {{remaining}}/{{limit}}',
      requestNewSuccess: 'Yeni eşleşme talebiniz alındı. Uygun aday bulunduğunda panelde görünecek.',
      freeSlot: 'Slotu boşalt (günlük 1)',
      freeSlotHint: 'Bu işlem, "yeni kayıt" adaylar için ayrılmış bir slot açar. Slot, profilinize uygun {{threshold}}+ puanlı yeni kayıt gelene kadar boş kalır. Hemen yeni aday istiyorsanız "Yeni eşleşme talep et" butonunu kullanın.',
      freeSlotConfirm: 'Bu adayı listenden çıkarıp yeni kayıt slotunu açmak istiyor musun? (Günlük 1 hak)',
      freeSlotSuccess: 'Slot boşaltıldı. {{creditGranted}} kredi tanımlandı. Yeni kayıt ({{threshold}}+ puan) gelene kadar slot boş kalacak. Yeni aday talebi için bekleme: {{remaining}}',
      removedCreditNotice: 'Bu eşleşme listenizden çıkarıldı. Yeni eşleşme isteme hakkınız için 1 kredi tanımlandı. Bekleme: {{remaining}}',
    },
    chat: {
      inputPlaceholderShort: 'Kısa bir mesaj yaz…',
      lock48h: {
        approving: 'Onaylanıyor…',
      },
    },
    profileForm: {
      loading: 'Form yükleniyor…',
      empty: 'Henüz eşleştirme başvuru formu bulunamadı. Önce formu doldurun.',
      openOriginalEditOnce: 'Orijinal formu aç (1 kez düzelt)',
      detailsToggle: 'Başvuru bilgilerini göster',
      applicationId: 'Başvuru ID',
      applicantNationality: 'Kendi uyruğunuz',
      applicantGender: 'Kendi cinsiyetiniz',
      partnerNationality: 'Aradığınız kişinin uyruğu',
      partnerGender: 'Aradığınız kişinin cinsiyeti',
      moreDetailsTitle: 'Diğer bilgiler',
      partnerPrefsTitle: 'Aradığınız kişi tercihleri',
      editOnceTitle: 'Formu 1 defaya mahsus düzelt',
      editOnceLead:
        'Başvuruda yanlış/eksik bilgi varsa burada güncelleyebilirsiniz. Bu işlem sadece 1 kez yapılabilir (gönderince tekrar değiştirilemez).',
      editOnceCta: 'Değişiklikleri kaydet (1 kez)',
      editOnceSaving: 'Kaydediliyor…',
      editOnceSuccess: 'Güncelleme alındı. Formunuz güncellendi.',
      editOnceUsed: 'Bu hak daha önce kullanıldı. Form artık tekrar düzenlenemez.',
      editOnceErrors: {
        failed: 'Güncelleme yapılamadı. Lütfen tekrar deneyin.',
        empty: 'Boş güncelleme gönderemezsiniz. En az bir alanı doldurun.',
        notFound: 'Başvuru bulunamadı. Önce formu doldurmanız gerekiyor.',
      },
    },
    activation: {
      title: 'Üyelik aktivasyonu ve ödeme',
      lead: 'Üyelik/aksiyon açma adımlarını buradan takip edebilirsiniz. Üyelik aktif değilse, ödeme yapıp dekontu ekleyerek “Ödeme bildirimi” göndermeniz gerekir (admin onayı sonrası üyelik açılır).',
      freePaidMembershipCta: 'Üyeliğimi ücretsiz aktif et',
      paidMembershipCta: 'Üyeliği aktifleştir',
      freeActiveTitle: 'Kadın kullanıcılar: ücretsiz aktif üyelik',
      freeActiveBody: 'Kimlik doğrulamanız varsa ücretsiz aktif üyelik başvurusu yapabilirsiniz. Bu, ücretli üyelik olmadan aksiyonları açabilir (kurallar/48-24 saat şartları geçerlidir).',
      freeActiveNeedsVerification: 'Ücretsiz aktif üyelik için önce kimlik doğrulama gerekir.',
      paymentTitle: 'Ücretli üyelik (aylık) / ödeme',
      paymentBody: 'Üyeliği aktifleştirmek için aşağıdaki ödeme yöntemlerinden biriyle ödeme yapın, sonra dekont/ref. bilgisi ile bildirim gönderin.',
      selectMatchTitle: 'Ödeme bildirimi için eşleşme seçin',
      selectMatchHelp: 'Teknik olarak ödeme bildirimi bir eşleşmeye bağlanır. Eşleşme yoksa WhatsApp destek hattına yazabilirsiniz.',
      selectMatchPlaceholder: 'Eşleşme seçin…',
      matchOption: '{{status}} • {{matchCode}}',
      selectMatchRequired: 'Ödeme bildirimi göndermek için bir eşleşme seçmelisiniz.',
    },
    payment: {
      success: 'Ödeme bildiriminiz alındı. Admin onayı sonrası üyeliğiniz aktif edilecektir.',
      errors: {
        sendFailed: 'Ödeme bildirimi gönderilemedi.',
        rateLimited: 'Ödeme bildirimi çok sık gönderiliyor. Lütfen biraz bekleyip tekrar deneyin.',
        notReady: 'Şu an ödeme adımına geçilemedi. Lütfen destek hattına yazın.',
      },
    },
    receipt: {
      view: 'Dekontu görüntüle',
      errors: {
        uploadFailed: 'Dekont yüklenemedi. Lokal geliştirmede `npm run dev` (API+Web) çalıştığından ve Cloudinary server env’lerinin tanımlı olduğundan emin olun.',
      },
    },
    choice: {
      title: 'Bir adayı işaretlediniz.',
      body: 'Diğer adaylar sistemden silinmez. İsterseniz sadece seçtiğiniz adayı görüntüleyebilir veya eski eşleşmeleri yeniden görebilirsiniz.',
    },
    errors: {
      actionFailed: 'İşlem başarısız.',
      rejectAllFailed: 'Hepsini reddet işlemi başarısız.',
      membershipRequired: 'Beğeni/ret işlemleri için üyeliğinizin aktif olması gerekir.',
      verificationRequired: 'Bu işlemi yapabilmek için kimlik doğrulaması gerekir.',
      membershipOrVerificationRequired: 'Bu işlem için ücretli üyelik veya (kadın kullanıcılar için) kimlik doğrulama + ücretsiz aktif üyelik gerekir.',
      freeActiveMembershipRequired: 'Bu işlem için ücretsiz aktif üyeliğinizin açık olması gerekir. Kimlik doğrulama yaptıysanız panelden ücretsiz aktif üyelik başvurusu yapabilirsiniz.',
      freeActiveMembershipBlocked: 'Kimlik doğrulama ile ücretsiz aktif üyelik hakkınız devre dışı. Bu işlem için ücretli üyelik satın almanız gerekir.',
      otherUserMatched: 'Bu kişi başka biriyle eşleşmiş. Beğeni gönderemezsiniz.',
      alreadyMatched: 'Zaten bir eşleşmeniz var.',
      userLocked: 'Eşleşme süreciniz kilitli. Bu işlem yapılamaz.',
      pendingContinueExists: 'Devam etmek için zaten bir aday seçtiniz. Önce o eşleşmede karar verin.',
      requestNewFailed: 'Yeni eşleşme talebi gönderilemedi.',
      requestNewRateLimited: 'Yeni eşleşme talebini çok sık gönderiyorsunuz. Lütfen daha sonra tekrar deneyin.',
      requestNewQuotaExhausted: 'Bugünkü yeni eşleşme hakkınız bitti (3/3). Yarın tekrar deneyin.',
      requestNewFreeActiveBlocked: 'Ücretsiz aktif üyelik hakkınız iptal edildiği için yeni eşleşme talep edemezsiniz. Tekrar aktif olmanız için ücretli üyelik gerekir.',
      freeSlotFailed: 'Slot boşaltma işlemi başarısız.',
      freeSlotQuotaExhausted: 'Bugünkü slot boşaltma hakkınız bitti (1/1). Yarın tekrar deneyin.',
      cooldownActive: 'Bu işlem için biraz beklemeniz gerekir. Kalan süre: {{remaining}}',
      newUserSlotAlreadyActive: 'Yeni kayıt slotunuz zaten açık. Uygun yeni kayıt gelene kadar bekleyin veya normal yenileme kullanın.',
    },
    afterSubmit: {
      title: 'Başvurunuz alındı.',
      body: 'Başvuru bilgilerinizi aşağıda görebilirsiniz. Değişiklik gerekiyorsa WhatsApp’tan bize yazın.',
    },
    account: {
      title: 'Hesap',
      usernameLabel: 'Kullanıcı adı',
      nameLabel: 'Ad',
    },
    application: {
      title: 'Evlilik Eşleştirme Başvurusu',
      empty: 'Henüz bir evlilik eşleştirme başvurunuz yok.',
      goToForm: 'Başvuru formuna git',
      fallbackName: 'Başvuru',
      profileNo: 'Başvuru Kodu',
      username: 'Kullanıcı adı',
      applicationId: 'Başvuru ID',
      photoAlt: 'Profil',
    },
    common: {
      status: 'Durum',
      age: 'Yaş',
      whatsapp: 'WhatsApp',
      email: 'E-posta',
      instagram: 'Instagram',
      cityCountry: 'Şehir/Ülke',
      readOnly: 'Bu alan şu anda değiştirilemez (salt okunur).',
    },
    contact: {
      errors: {
        fetchFailed: 'İletişim bilgileri alınamadı. Lütfen tekrar deneyin.',
        notConfirmed: 'Bu eşleşme kesinleşmeden iletişim bilgileri görüntülenemez.',
      },
    },
    statuses: {
      proposed: 'Teklif edildi',
      mutual_accepted: 'Karşılıklı onaylandı',
      contact_unlocked: 'İletişim açıldı',
      cancelled: 'İptal edildi',
      rejected: 'Reddedildi',
      pending: 'Beklemede',
      approved: 'Onaylandı',
    },
    update: {
      title: 'Bilgi güncelleme',
      body: 'Formu online olarak değiştirmiyoruz. Bilgi güncellemek isterseniz WhatsApp’tan bize yazın.',
      whatsappMessage: 'Evlilik eşleştirme başvurumda bilgi güncellemek istiyorum.\nAd Soyad: {{fullName}}\nBaşvuru Kodu: {{profileCode}}',
    },
    onboarding: {
      title: 'Başlamadan önce',
      intro:
        'Bu panel, eşleştirme sürecini yönetmek içindir. Profil oluşturmak için 1 kez başvuru formunu doldurursun; profil oluşturulduktan sonra her girişinde doğrudan bu panel açılır.',
      rulesTitle: 'Sistem amacı ve kurallar',
      rules: {
        r1: 'Bu alan herkese açık profil gezme alanı değildir; profiller kamuya açık listelenmez.',
        r2: 'Bilgiler, eşleştirme ve güvenli iletişim amacıyla kullanılır.',
        r3: 'Uygun eşleşme varsa panelinde görüntülenir; beğen/geç ile ilerlersin.',
        r4: 'İletişim paylaşımı karşılıklı onay ve kurallara göre açılır.',
      },
      confirm: 'Açıklamaları ve kuralları okudum.',
      createProfile: 'Profil oluştur',
      startForm: 'Eşleşme başlatmak için form doldur',
      howWorks: 'Sistem nasıl çalışır?',
      note: 'Not: Profil oluşturduktan sonra formu 1 kez gönder. Sonraki girişlerde tekrar forma yönlendirilmezsin.',
    },
    membership: {
      title: 'Üyelik durumu',
      active: 'Üyeliğiniz aktif.',
      planLabels: {
        eco: 'Eko',
        standard: 'Standart',
        pro: 'Pro',
      },
      inactive: 'Üyelik aktif değil. Üyelik aktif olana kadar adayların tüm detaylarını göremez, beğeni/ret veremezsiniz.',
      inactiveMale: 'Üyelik aktif değil. Üyelik aktif olana kadar adayların tüm detaylarını göremez, beğeni/ret veremezsiniz.',
      inactiveFemale: 'Üyelik aktif değil. Eşleşme ve ön inceleme için üyelik gerekmez. İşlem yapabilmek için ücretsiz aktif üyelik başvurusu (kimlik doğrulama ile) veya ücretli üyelik gerekir.',
      activeViaVerification: 'Kimlik doğrulamanız var. İşlem yapabilmek için ücretsiz aktif üyelik başvurusu yapabilir veya ücretli üyelik satın alabilirsiniz.',
      freeActiveActive: 'Ücretsiz aktif üyeliğiniz açık (kimlik doğrulama ile).',
      freeActiveTermsTitle: 'Ücretsiz aktif üyelik şartları',
      freeActiveTermsBody: 'Kimlik doğrulaması ile ücretsiz aktif üyelik alan kullanıcıların 48 saat aktif olmaması durumunda ücretsiz aktif üyeliği iptal edilir. Yeniden ücretsiz aktif üyelik başvurularında bu süre 24 saate düşer. Bu süre içinde tekrar aktif olunmazsa, ücretli üyelik satın alana kadar geçerli bir aktif üyelik hakkı tanımlanmaz ve yeni eşleşme talebinde bulunulamaz.',
      freeActiveApply: 'Ücretsiz aktif üyelik başvurusu yap',
      freeActiveApplying: 'Başvuru gönderiliyor…',
      freeActiveApplied: 'Ücretsiz aktif üyeliğiniz açıldı. Süre: {{hours}} saat.',
      daysLeft_one: 'Kalan süre: {{count}} gün.',
      daysLeft_other: 'Kalan süre: {{count}} gün.',
      until: 'Bitiş: {{date}}.',
    },
    membershipNotice: {
      title: 'Üyelik şartları',
      male: {
        lead: 'Üyelik şartları:',
        points: [
          'Eşleşme ve kısıtlı ön izleme ücretsizdir.',
          'Detaylı profil inceleme, beğeni/ret ve iletişim adımları için ücretli üyelik gerekir.',
        ],
      },
      female: {
        lead: 'Üyelik şartları:',
        points: [
          'Eşleşme ve kısıtlı ön izleme ücretsizdir.',
          'Detaylı profil inceleme, beğeni/ret ve iletişim için kimlik doğrulama + ücretsiz aktif üyelik veya ücretli üyelik gerekir.',
          'Ücretsiz aktif üyelikte 48/24 saat inaktivite kuralları geçerlidir (paneldeki şartlar bölümüne bakın).',
        ],
      },
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'İşleyiş, kurallar ve sık sorulanlar burada.',
      faq: {
        title: 'Sık sorulanlar (SSS)',
        items: [
          {
            q: 'Eşleşen profilleri neden herkese açık görmüyorum?',
            a: 'Bu sistem kapalı çalışır. Profiller kamuya açık listelenmez; kriterlerinize en uygun adaylar panelinizde görünür.',
          },
          {
            q: 'Beğeni / detay / iletişim için ne gerekiyor?',
            a: 'Erkek kullanıcılar için ücretli üyelik gerekir. Kadın kullanıcılar için kimlik doğrulama + ücretsiz aktif üyelik veya ücretli üyelik gerekir.',
          },
          {
            q: 'Kimlik doğrulama ne işe yarar?',
            a: 'Güven rozetidir. Kurallara aykırı durumlarda kanıtla şikayet sürecini güçlendirir ve (kadın kullanıcılar için) ücretsiz aktif üyelik akışını açabilir.',
          },
          {
            q: 'Şüpheli/dolandırıcılık durumunda ne yapmalıyım?',
            a: 'WhatsApp destek hattına yazın. İnceleme sonrası ilgili hesap sistemden engellenir.',
          },
        ],
      },
    },
    verification: {
      title: 'Kimlik doğrulama',
      cta: 'Kimlik doğrula',
      verifiedBadge: 'Kimliği doğrulanmış',
      requiredTitle: 'Kimlik doğrulama (rozet)',
      requiredBody: 'Kimlik doğrulama zorunlu değildir; bir güven rozetidir. Kurallara aykırı davranışlarda kanıtla şikayet oluşturabilirsiniz.',
      unverifiedTitle: 'Kimlik doğrulama (rozet)',
      unverifiedBodyMale: 'Kimlik doğrulama zorunlu değildir; bir güven rozetidir. (Not: Erkek kullanıcılar için aksiyonlar üyelikle açılır.)',
      unverifiedBodyFemale: 'Kimlik doğrulama zorunlu değildir; bir güven rozetidir. (Not: Kadın kullanıcılar doğrulama + ücretsiz aktif üyelik ile aksiyonları açabilir.)',
      referenceCode: 'Doğrulama kodu',
      manualUpload: {
        title: 'Site üzerinden doğrula (manuel)',
        lead: 'Zorunlu değildir. Kimliğinizin ön/arka fotoğrafını ve bir selfie yükleyin. İnceleme sonrası hesabınıza rozet tanımlanır.',
        idFrontLabel: 'Kimlik (ön)',
        idBackLabel: 'Kimlik (arka)',
        selfieLabel: 'Selfie',
        submit: 'Gönder',
        uploading: 'Yükleniyor…',
        success: 'Belgeleriniz gönderildi. İnceleme bekleniyor.',
        pendingHint: 'Durum: inceleme bekleniyor',
        reviewNote: 'Dosyalar gönderildikten sonra incelemenin ardından kimlik doğrulamanız sistem tarafından onaylanacaktır.',
      },
      actions: {
        startWhatsapp: 'WhatsApp ile doğrula',
        startKyc: 'Otomatik KYC (kimlik + selfie)',
        startManual: 'Manuel onay iste',
        openWhatsapp: 'WhatsApp’tan doğrulama mesajı gönder',
      },
      errors: {
        kycNotConfigured: 'Otomatik KYC şu an yapılandırılmadı. Lütfen WhatsApp veya manuel yöntemi seçin.',
        whatsappNotConfigured: 'WhatsApp numarası yapılandırılmadı. Lütfen manuel yöntemi seçin.',
        missingFiles: 'Lütfen kimlik (ön/arka) ve selfie seçin.',
      },
    },

    membershipModal: {
      openFree: 'Üyeliğimi ücretsiz aktif et',
      open: 'Üyelik durumu',
      title: 'Üyelik işlemleri',
      statusLabel: 'Üyelik',
      activate: 'Üyeliğimi aktif et',
      cancel: 'Üyeliğimi iptal et',
      cancelDisabledHint: 'Üyelik aktif olana kadar iptal edemezsiniz.',
      deleteAccount: 'Hesabı sil',
      deleteTypePrompt: 'Hesabı gerçekten silmek istiyorsanız: "hesabımı sil" yazın.',
      deleteFinalConfirm: 'Hesabınız kalıcı olarak sistemden silinecektir. Emin misiniz?',
      deleteCancel: 'Vazgeç',
      deleteContinue: 'Devam et',
      deleteBack: 'Geri',
      deleteYes: 'Evet hesabımı sil',
      loading: 'İşlem yapılıyor…',
      alreadyActive: 'Üyeliğiniz zaten aktif',
      successActivated: 'Üyeliğiniz aktif edildi.',
      promoActivated: 'Üyeliğiniz Eko pakette ücretsiz aktif edildi. Bitiş: {{date}} ({{count}} gün kaldı).',
      successCancelled: 'Üyeliğiniz iptal edildi.',
    },
    membershipGate: {
      title: 'Üyelik gerekli',
      body: 'Üyelik aktif olana kadar yalnızca fotoğraf, kullanıcı adı, yaş, şehir ve medeni durumu görebilirsiniz. Beğeni/ret için üyelik gerekir. İsterseniz eşleşmeyi kaldırıp yeni eşleşme talep edebilirsiniz.',
    },
    membershipOrVerificationGate: {
      title: 'Üyelik veya kimlik doğrulama gerekli',
      body: 'Üyeliğiniz yoksa, kimlik doğrulama yaparak da adayların detaylarını görüp işlem yapabilirsiniz. İsterseniz eşleşmeyi kaldırıp yeni eşleşme talep edebilirsiniz.',
    },
    lock: {
      title: 'Eşleşme süreciniz devam ediyor.',
      body: 'Karşılıklı onaydan sonra bu eşleşme aktif süreciniz olur. İlk 48 saat sadece site içi sohbet edilir. 48 saat dolunca iletişim isteği gönderebilirsiniz; telefon numaraları yalnızca karşı taraf onaylarsa görünür.',
      matchId: 'Eşleşme Kodu',
    },
    matches: {
      autoRunNotice: 'Otomatik eşleştirme sistemimiz yaklaşık her {{minutes}} dakikada bir çalışır. İsterseniz buradan manuel yeni eşleşme talep edebilirsiniz.',
      cancelConfirm: 'Bu eşleşmeyi iptal ederseniz bu kişi eşleşme listenizden çıkarılacak. Onaylıyor musunuz?',
      errors: {
        activeLocked: 'Eşleşme sürecin kilitli. Bu işlem yapılamaz.',
      },
      presence: {
        online: 'Çevrimiçi',
        lastSeen: 'Son aktif: {{time}}',
        unknown: 'Son aktif: -',
      },
      progress: {
        title: 'Süreç',
        steps: {
          proposed: 'Tanışma',
          mutualAccepted: 'Karşılıklı onay',
          confirm48h: '48 saat kesinleştirme',
          contact: 'İletişim',
        },
        remaining: 'Kalan süre: {{h}}sa {{m}}dk',
      },

      quickQuestions: {
        title: '3 kısa soru',
        lead: 'İsterseniz birbirinizi daha hızlı tanımak için 3 kısa soruya tek tıkla cevap verin. Zorunlu değil.',
        yourAnswer: 'Sen',
        otherAnswer: 'O',
        pickOne: 'Bir seçenek seç',
        otherAnswered: 'Cevapladı',
        otherNotAnswered: 'Henüz cevaplamadı',
        questions: {
          q1: {
            title: 'Tanışma hızın nasıl olsun?',
            options: {
              slow: 'Yavaş',
              normal: 'Normal',
              fast: 'Hızlı',
            },
          },
          q2: {
            title: 'Aile ve bağımsızlık dengesi?',
            options: {
              family: 'Aile odaklı',
              balanced: 'Dengeli',
              independent: 'Bağımsız',
            },
          },
          q3: {
            title: 'Taşınma / şehir değişimi?',
            options: {
              local: 'Aynı şehir',
              open: 'Açığım',
              flexible: 'Esnek',
            },
          },
        },
      },

      matchTest: {
        button: 'Eşleşme testi',
        title: 'Eşleşme testi',
        lead: '3 kısa soruda ne kadar uyumlusunuz?',
        score: 'Skor: {{points}} / {{max}}',
        close: 'Kapat',
        questionCounter: 'Soru {{cur}} / {{total}}',
        sameAnswer: 'Aynı cevap: +10 puan',
        differentAnswer: 'Farklı cevap',
        prev: 'Geri',
        next: 'İleri',
      },
      title: 'Eşleşmeleriniz',
      subtitle: 'Paketinize göre en fazla 3 / 5 / 10 aday gösterilir.',
      inactivityNotice: {
        title: 'Pasiflik kuralı (24 saat)',
        body:
          '24 saatin üzerindeki pasif sürelerde eşleşme listeniz sıfırlanır. Eşleşme listenizdeki kişiler eşleşme havuzuna dahil edilir ve yeniden aktif olduğunuzda eşleşme talep etme hakkınızı daha sonra kullanabilirsiniz; fakat mevcut eşleşmelerinizi kaybedersiniz.',
      },
      newUserSlotNotice: {
        title: 'Yeni kayıt slotu açık',
        body:
          'Slot boş kaldı. Slot açıldıktan sonra sisteme katılan yeni kayıtlar içinden profilinize uygun {{threshold}}+ puanlı bir aday bulunduğunda otomatik dolacak. Hemen yeni aday istiyorsanız "Yeni eşleşme talep et" butonunu kullanın.',
      },
      inactiveReset: {
        title: 'Eşleşme pasiflik nedeniyle sıfırlandı',
        body: 'Taraflardan biri 24 saatten uzun süre pasif kaldığı için bu eşleşme iptal edildi ve havuza geri alındı.',
      },
      focusActiveReset: {
        title: 'Bu eşleşme kapatıldı',
        body: 'Karşı taraf şu an başka bir tanışma penceresini ilerletiyor. Bu sizinle ilgili olumsuz bir değerlendirme değildir; sistem uygun olduğunda yeni adaylar gösterecektir.',
      },
        pendingContinueExists: 'Devam etmek için zaten bir aday seçtiniz. Önce o eşleşmede karar verin.',
      empty: 'Profilinize uygun bir eşleşme bulunduğunda burada görünecektir. Sayfayı telefonunuza ya da bilgisayarınıza kaydedip tekrar kontrol etmek istediğinizde kolayca ulaşmak için kaydedin.',
      savePage: 'Sayfayı kaydet',
      savePageAlready: 'Bu sayfa zaten ana ekrana/uygulama olarak ekli görünüyor.',
      savePageIosHint: 'iPhone/iPad: Safari\'de Paylaş → “Ana Ekrana Ekle” seçin. (Bağlantı kopyalandı.)',
      savePageAndroidHint: 'Android: Tarayıcı menüsünden “Ana ekrana ekle” veya “Uygulamayı yükle” seçin. (Bağlantı kopyalandı.)',
      savePageDesktopHint: 'Bilgisayar: Tarayıcı menüsünden “Uygulamayı yükle” (varsa) veya yer imlerine ekle (Ctrl+D). (Bağlantı kopyalandı.)',
      waitingOther: 'Karşı tarafın cevabı bekleniyor.',
      mutualAcceptedNotice: 'Her iki taraf da onayladı. Bir sonraki adımı seçebilirsiniz.',
      rejectedByOther: {
        title: 'Bu aday sizi reddetti.',
        body: 'Bu eşleşmeyi panelinizden kaldırıp yeni bir aday talep edebilirsiniz (günlük limit var).',
      },
      contactUnlocked: {
        title: 'İletişim paylaşımı karşılıklı onaylandı.',
        body: 'İletişim bilgilerini panelden açabilir ve konuşmaya başlayabilirsiniz. Kurallara aykırı davranışları kanıtıyla bildirirseniz kalıcı engel uygulanır ve geri ödeme talep edilemez.',
      },
      contactLocked: {
        title: 'İletişim bilgileri (48 saat kilitli)',
        body: 'İletişim bilgileri, sohbet aktif olduktan 48 saat sonra açılır. Bu sürede site içinden konuşabilirsiniz.',
      },
      interaction: {
        title: 'Bir sonraki adım',
        lead: 'İki taraf da aynı seçeneği seçince işlem gerçekleşir. Seçimleriniz değiştirilebilir; uzlaşı olunca sistem uygular.',
        offsite: 'Site dışında devam',
        cancel: 'Eşleşmeyi iptal et',
        offsiteShort: 'Site dışında devam',
        cancelShort: 'Eşleşmeyi iptal',
        offsiteInfoTitle: 'Site dışında devam ederseniz',
        offsiteInfoBody: 'İki taraf da bunu seçerse iletişim bilgileriniz karşılıklı açılır ve konuşmayı dışarıda (WhatsApp vb.) sürdürebilirsiniz.',
        cancelInfoTitle: 'Eşleşmeyi iptal ederseniz',
        cancelInfoBody: 'İki taraf da bunu seçerse eşleşme sonlanır, kilit kalkar ve diğer adaylar tekrar görünür.',
        choosePrompt: 'Devam etmek için bir seçenek işaretleyin.',
        yourChoice: 'Seçiminiz: {{choice}}',
        membershipRequired: 'Bu adım için üyelik aktif olmalıdır.',
        verificationRequired: 'Bu adım için kimlik doğrulaması gerekir.',
        otherPrefersOffsite: '{{name}} “site dışında devam” seçti. İsterseniz siz de bunu seçerek iletişim paylaşımını açabilirsiniz.',
        otherPrefersCancel: '{{name}} “eşleşmeyi iptal et” seçti. İsterseniz siz de iptali seçerek eşleşmeyi sonlandırabilirsiniz.',
        offsiteWaiting: 'Seçiminiz kaydedildi. Karşı tarafın aynı seçimi yapması bekleniyor.',
      },
      chat: {
        open: 'Mesajlar',
        directMessage: 'Direkt mesaj',
        title: 'Site İçi Mesajlaşma',
        lead: 'Karar vermeden önce burada konuşabilirsiniz. İletişim/IG/FB/link paylaşımı engellenir.',
        enableNotifications: 'Bildirimleri aç',
        notificationsEnabled: 'Bildirimler açık.',
        notificationsDenied: 'Bildirim izni verilmedi.',
        notificationsNotSupported: 'Bu tarayıcı bildirimleri desteklemiyor.',
        notificationTitle: 'Yeni mesaj',
        notificationBody: 'Eşleşmenizden yeni bir mesaj var.',
        timeLeft: 'Kalan süre: {{minutes}} dk',
        timeUnknown: 'Kalan süre: -',
        rulesTitle: 'Kurallar',
        rulesBody: 'Telefon/WhatsApp, Instagram/Facebook ve link paylaşımı bu aşamada yasaktır.',
        empty: 'Henüz mesaj yok. İlk mesajı siz atabilirsiniz.',
        placeholder: 'Mesaj yaz…',
        send: 'Gönder',
        lockedByActive: {
          title: 'Bu sohbet kapatıldı',
          body:
            'Bu mesaj aktif bir eşleşmeniz olduğu için kapatılmıştır. Her kullanıcının bir kişiyle konuşması evlilik amacı olan herkesin konuştuğu kişinin sadece kendisiyle konuştuğunu bilmesi için gereklidir. Diğer kişilerle mesajlaşmaya devam edebilmek için aktif eşleşmenizi sohbet ekranından iptal etmeniz gerekmektedir.',
          cancelCta: 'Aktif eşleşmeyi iptal et',
        },
        system: {
          contactRequest: {
            mine: 'İletişim isteği gönderdin.',
            other: 'Karşı taraf iletişim bilgilerini paylaşmak istiyor.',
            approveHint: 'Onaylayınca telefon numaraları mesajlarda görünür.',
          },
          contactShared: 'İletişim bilgileri paylaşıldı:\n{{aWhatsapp}}\n{{bWhatsapp}}',
        },
        translate: {
          title: 'Mesajı çevir',
          cta: 'Çevir',
          translating: 'Çevriliyor…',
          billing: {
            sponsored: 'Sponsorlu çeviri (maliyet karşı tarafa yansıtıldı)',
            self: 'Çeviri kotandan düştü',
          },
          usageWarning: "Limitinin %{{usagePercent}}'ini kullandın.",
          errors: {
            quotaExceededWithUsage: "Limitinin %{{usagePercent}}'ini kullandın. Bu ay yenilenir veya Boost/plan yükselt.",
            quotaExceeded: 'Çeviri limitin doldu. Bu ay yenilenir veya Boost/plan yükselt.',
            tooLong: 'Bu mesaj çok uzun; çeviri için kısaltılmalı.',
            onlyIncoming: 'Sadece gelen mesajlar çevrilebilir.',
            authRequired: 'Oturum gerekli.',
            notConfigured: 'Çeviri servisi ayarlı değil.',
            rateLimited: 'Çeviri yoğun (Gemini dakikada 15 limit). 1 dakika sonra tekrar dene veya ücretli plana geç.',
            piiBlocked: 'Kişisel/iletişim bilgisi içerdiği için otomatik çeviri yapılmadı. Lütfen bu bilgileri kaldır.',
            failed: 'Çeviri başarısız.',
          },
        },
        continue: 'Devam edelim (Onay)',
        reject: 'Uymadı (Reddet)',
        proposedLimit: {
          counter: 'Sohbet: {{used}} / {{limit}}',
          reachedTitle: 'Karar zamanı',
          reachedBody: 'Mesaj limiti doldu. Devam etmek için onaylayın veya uygun değilse reddedin.',
          startActive: 'Aktif eşleşmeyi başlat',
          pendingYou: 'Aktif eşleşme talebin gönderildi. Karşı tarafın onayı bekleniyor.',
          pendingIncomingTitle: '{{name}} aktif eşleşme talebinde bulundu',
          pendingIncomingBody: 'Aktif eşleşmeyi başlatmak için onaylayın.',
        },
        rejectReasons: {
          hint: 'Ret gerekçesi (opsiyonel):',
          notFeeling: 'İçime sinmedi',
          values: 'Uyum/değerler',
          distance: 'Mesafe/şehir',
          communication: 'İletişim tarzı',
          notReady: 'Şu an uygun değilim',
          other: 'Diğer',
        },
        pause: {
          focusTitle: 'Bu sohbet beklemede',
          focusBody: 'Şu an başka bir tanışma penceresini ilerlettiğiniz için bu sohbet geçici olarak durduruldu. Mesaj gönderemezsiniz.',
          otherTitle: 'Sohbet geçici olarak beklemede',
          otherBody: 'Mesajlarınız karşı tarafa şu an iletilmez; uygun olduğunda otomatik olarak devam eder.',
          heldBadge: 'Beklemede (henüz iletilmedi)',
          deliveredBadge: 'Teslim edildi',
        },
        heldSummary: {
          title: '{{count}} mesaj beklemede',
          body: 'Bu sohbet daha önce beklemedeyken karşı taraftan mesaj gelmiş. İsterseniz şimdi görüntüleyebilirsiniz.',
          show: 'Mesajları göster',
          keepHidden: 'Şimdilik gizli kalsın',
          releaseFailed: 'Mesajlar açılamadı. Lütfen tekrar deneyin.',
        },
        limitReachedNotice: {
          title: 'Mesaj limitine ulaştınız',
          body:
            'Konuşmaya devam etmek için aktif eşleşme başlatmanız gerekiyor. Aktif eşleşme başlatmak diğer eşleşmelerinizi beklemeye alacak ve sadece aktif eşleşmenizle konuşmaya devam edeceksiniz.',
          dismiss: 'Tamam',
        },
        errors: {
          filtered: 'Mesajınız iletişim bilgisi/sosyal medya/link içerdiği için gönderilemedi.',
          rateLimited: 'Çok hızlı mesaj gönderiyorsunuz. Lütfen biraz bekleyin.',
          closed: 'Mesajlaşma süresi doldu veya sohbet kapandı.',
          notEnabled: 'Bu eşleşmede site içi konuşma aktif değil.',
          membershipRequired: 'Mesajlaşma için üyeliğiniz aktif olmalıdır.',
          verificationRequired: 'Mesajlaşma için kimlik doğrulaması gerekir.',
          limitReached: 'Mesaj limiti doldu. Karar vermeniz gerekiyor.',
          chatPaused: 'Bu sohbet geçici olarak beklemede.',
          messageTooLong: 'Mesaj çok uzun. En fazla 240 karakter.',
          serverNotConfigured: 'Local sunucuda Firebase Admin ayarlı değil. .env.local içine FIREBASE_SERVICE_ACCOUNT_JSON_FILE ekleyip dev sürecini yeniden başlatın.',
          authRequired: 'Mesaj göndermek için giriş yapmanız gerekir. (Anonim hesapla olmaz.)',
          sendFailed: 'Mesaj gönderilemedi.',
          decisionFailed: 'Karar kaydedilemedi.',
        },

        confirm48h: {
          title: '48 saat doldu: Eşleşmeyi kesinleştirme',
          body:
            'Bu aşamadan sonra eşleşmeniz “kesinleşmiş” olarak işaretlenecek ve iletişim paylaşımı (telefon numarası) adımı aktif edilecektir. Kesinleşince eşleşme slotunuzdaki diğer öneriler silinebilir.',
          note: 'Onay verdiğinizde karşı tarafın da onayı beklenir.',
          confirmButton: 'Kesinleştirmeyi onayla',
          cancelButton: 'Vazgeç',
          waitingOther: 'Onay verdiniz. Karşı tarafın onayı bekleniyor.',
          confirmed: 'Eşleşme kesinleşti. İletişim isteği gönderebilirsiniz.',
          contactLockedUntilConfirm: 'İletişim isteği gönderebilmek için önce bu eşleşmeyi kesinleştirmelisiniz.',
          errors: {
            locked: '48 saat dolmadan kesinleştirilemez.',
            confirmRequired: 'İletişim için önce kesinleştirme onayı gereklidir.',
            contactLocked: '48 saat dolmadan iletişim isteği gönderemezsin.',
          },
        },
      },
      candidate: {
        fallbackName: 'Aday',
        verifiedBadge: 'Kimliği doğrulanmış',
        proBadge: 'PRO',
        standardBadge: 'STANDART',
        badges: {
          activeRecent: 'Yakın zamanda aktif',
          mutualAccepted: 'Karşılıklı onay',
          confirmed: 'Kesinleşti',
          contactUnlocked: 'İletişim açıldı',
          contactPending: 'İletişim isteği bekliyor',
        },
        matchedProfile: 'Eşleşme profili',
        score: 'Eşleşme skoru',
        likeBadge: '♥ Beğeni aldınız',
        likeSentBadge: '✓ Beğeni gönderildi',
        profileInfo: 'Profil bilgilerini göster',
        hideProfileInfo: 'Gizle',
        profileInfoTitle: 'Profil bilgileri (iletişim hariç)',
        partnerAgeMin: 'Min yaş',
        partnerAgeMax: 'Max yaş',
        photoAlt: 'Fotoğraf',
        maritalStatus: 'Medeni durum',
        detailsTitle: 'Detaylar',
        aboutLabel: 'Kısa tanıtım',
        expectationsLabel: 'Beklentiler',
        heightLabel: 'Boy',
        educationLabel: 'Eğitim',
        occupationLabel: 'Meslek',
        religionLabel: 'Din',
      },
      paymentStatus: {
        pending: 'Ödeme bildiriminiz beklemede. Admin onayı sonrası üyelik aktif edilir.',
        rejected: 'Son ödeme bildiriminiz reddedildi. Dekont/ref. bilgilerinizi kontrol edip tekrar bildirim gönderebilirsiniz.',
        approved: 'Ödeme onaylandı. Üyelik aktif edildi.',
      },
      contact: {
        title: 'İletişim bilgileri',
      },
      contactUnlock: {
        membershipActiveTitle: 'Kullanıma uygun durumdasınız',
        membershipActiveBody: 'İletişimi açmak için butona tıklayın. (Karşı tarafın da kurallara göre uygun olması gerekir.)',
        lockedTitle: 'İletişim kilitli',
        lockedBody: 'İletişim bilgileri sohbet başladıktan 48 saat sonra açılır. Kalan süre: {{time}}',
        lockedBodyNoTime: 'İletişim bilgileri sohbet başladıktan 48 saat sonra açılır.',
        opening: 'Açılıyor…',
        open: 'İletişim bilgilerimi paylaş',
        verificationRequired: 'İletişim bilgilerini açmak için kimlik doğrulaması gerekir.',
      },
      payment: {
        membershipRequiredTitle: 'Üyelik gerekli',
        membershipRequiredBody: 'Aylık üyelik ile iletişim bilgileri açılır.',
        pendingNotice: 'Bu eşleşme için ödeme bildiriminiz beklemede.',
        trTitle: 'Türkiye',
        idTitle: 'Endonezya',
        amount: 'Tutar',
        package: 'Paket',
        packageEco: 'Eko',
        packageStandard: 'Standart',
        packagePro: 'Pro',
        perMonth: 'aylık üyelik',
        badgeValue: 'Avantajlı',
        badgePopular: 'Popüler',
        badgePro: 'En yüksek',
        descEco: 'Temel erişim ve ölçülü çeviri.',
        descStandard: 'Daha fazla aday ve sponsorlu çeviri.',
        descPro: 'Maksimum aday ve yüksek çeviri hakkı.',
        featureMaxCandidates: 'Panelde en fazla {{count}} aday',
        featureTranslateMonthly: 'Aylık {{count}} mesaj çeviri',
        sponsoredIfOther: 'Karşı taraf Standard/Pro ise sponsorlu çeviri olabilir',
        sponsorsOthers: 'Karşı taraf için sponsorlu çeviri (maliyet sizden)',
        feature48hLock: 'İletişim paylaşımı: 48 saat sohbet sonrası onayla',
        translationCostEstimate: 'Tahmini çeviri API maliyeti: ~$ {{amount}} / ay',
        packageHelp: 'Seçtiğiniz pakete göre tutar ve yetkiler uygulanır.',
        recipient: 'Alıcı',
        iban: 'IBAN',
        detailsSoon: 'Hesap bilgileri yakında eklenecek.',
        payWithQris: 'QRIS ile öde (link)',
        reportTitle: 'Ödeme bildirimi',
        currency: 'Para birimi',
        currencyTRY: 'TRY (Türkiye)',
        currencyIDR: 'IDR (Endonezya)',
        currencyUSD: 'USD (Dolar)',
        method: 'Ödeme yöntemi',
        methodEftFast: 'EFT / FAST',
        methodSwiftWise: 'SWIFT / Wise',
        methodQris: 'QRIS',
        methodOther: 'Diğer',
        reference: 'Referans / açıklama (varsa)',
        referencePlaceholder: 'Dekont no, açıklama, gönderici adı...',
        note: 'Not (opsiyonel)',
        notePlaceholder: 'İsterseniz ek bilgi yazın',
        receipt: 'Dekont (opsiyonel)',
        receiptHelp: 'Foto yükleyebilir veya aşağıya dekont linki yapıştırabilirsiniz.',
        receiptLink: 'Dekont linki (opsiyonel)',
        viewReceipt: 'Dekontu görüntüle',
        uploadingReceipt: 'Dekont yükleniyor…',
        sendPayment: 'Ödeme bildirimini gönder ({{amount}} {{currency}})',
        supportWhatsapp: 'Destek için WhatsApp',
        supportWhatsappMessage: 'Eşleşme sürecimde üyelik/ödeme ile ilgili destek istiyorum. Eşleşme Kodu: {{matchCode}}',
      },
    },
    intro: {
      title: 'Eşleştirme nasıl çalışır?',
      body: 'Keşfet sayfasından başlayarak, ön eşleşme → aktif eşleşme → iletişim paylaşımı adımlarıyla ilerleyen kontrollü bir süreç sunuyoruz. Aşağıdaki maddeler sistemin işleyişini özetler.',
      cta: 'Eşleştirme formunu doldur',
      eligibilityPointMale: 'Site içinde eşleşme ve eşleşilen profili ön inceleme için üyeliğe gerek yoktur. Eşleşen profilin tüm profil bilgilerine ulaşmak, beğeni ya da ret yapabilmek, eşleşilen kişiyle iletişime geçmek için aktif üyelik satın almanız gerekmektedir.',
      eligibilityPointFemale: 'Site içinde eşleşme ve eşleşen kullanıcının kısıtlı profil bilgisini görmek için üyelik satın almaya gerek yoktur. Eşleşen kullanıcıya beğeni göndermek, reddetmek ve iletişime geçebilmek için ücretsiz aktif üye başvurusu ve kimlik doğrulama işlemi yapmanız ya da ücretli üyelik satın almanız gerekmektedir.',
      points: [
        'Profiller herkese açık değildir; yalnızca eşleşme/istek ilişkisi olan kişiler birbirini görür.',
        'Keşfet sayfasında size paketinize göre en fazla 3 / 5 / 10 profil gösterilir (kısıtlı ön izleme).',
        'Eşleşme listende görmek istediğin profillere “ön eşleşme isteği” gönderilir.',
        'İstek, karşı tarafın incelemesine düşer. Karşı taraf onaylarsa iki taraf da birbirini “Eşleşmelerim”de görür.',
        'Bu aşamada eşleşme kartları etkileşime açılır: beğeni, kısa mesaj gönderimi ve profil detaylarını inceleme.',
        'Bir tarafın beğenisi karşılık bulursa sistem “aktif eşleşme” adımını başlatır ve çeviri destekli mesajlaşma açılır.',
        'Aktif eşleşme başladıktan sonra iki taraf için diğer profillerle etkileşim kapanır; aktif eşleşme karşılıklı iptal edilmedikçe yeni eşleşme/like/kısa mesaj/detay inceleme yapılamaz.',
        'Aktif eşleşme 48 saat sürer. Süre tamamlandığında iki tarafa iletişim bilgilerini paylaşma hakkı tanınır; iletişim bilgileri sadece birbirinizin görebileceği şekilde profil detaylarında açılır (karşılıklı onayla).',
        '48 saat sonrası dilerseniz site içinden, dilerseniz kendi iletişim kanallarınızdan devam edebilirsiniz. Ayrıca destek ekibimizden tercümanlı görüntülü görüşme veya detaylı bilgi araştırması talep edebilirsiniz.',
        'Yeni aday talebi: Reddedildiyseniz eşleşmeyi panelden kaldırıp yeni aday isteyebilirsiniz (günlük limit: 3).',
        '{{eligibilityPoint}}',
        'Güvenlik: Kural ihlalleri (yalan bilgi, hakaret/taciz, cinsel istismar, maddi çıkar, evlilik dışı niyet vb.) ekran görüntüsü/kanıt ile doğrulanırsa kalıcı engel uygulanır ve geri ödeme talep edilemez.',
      ],

      quickQuestions: {
        title: '3 kısa soru',
        lead: 'İsterseniz birbirinizi daha hızlı tanımak için 3 kısa soruya tek tıkla cevap verin. Zorunlu değil.',
        yourAnswer: 'Sen',
        otherAnswer: 'O',
        pickOne: 'Bir seçenek seç',
        otherAnswered: 'Cevapladı',
        otherNotAnswered: 'Henüz cevaplamadı',
        questions: {
          q1: {
            title: 'Tanışma hızın nasıl olsun?',
            options: {
              slow: 'Yavaş',
              normal: 'Normal',
              fast: 'Hızlı',
            },
          },
          q2: {
            title: 'Aile ve bağımsızlık dengesi?',
            options: {
              family: 'Aile odaklı',
              balanced: 'Dengeli',
              independent: 'Bağımsız',
            },
          },
          q3: {
            title: 'Taşınma / şehir değişimi?',
            options: {
              local: 'Aynı şehir',
              open: 'Açığım',
              flexible: 'Esnek',
            },
          },
        },
      },
    },
    rules: {
      title: 'Evlilik Eşleştirme: Vaadimiz, Kurallar ve Güvenlik',
      lead: 'Bu platform flört/eğlence için değildir. Evlilik niyetiyle tanışmayı daha güvenli ve kontrollü hale getirmek için tasarlanmıştır.',
      open: 'Kuralları ve işleyişi görüntüle',
      why: {
        title: 'Neden bu kadar kural var?',
        body:
          'Bu kurallar kullanıcıyı cezalandırmak için değil; gerçekten evlilik niyeti olanların güvenle kalabilmesi için var. Amacımız sahte/aldatıcı niyetleri, dolandırıcılığı ve “sadece eğlenmek” isteyenleri mümkün olduğunca erken elemek.',
        points: [
          'Güvenlik: para talebi, sahte profil, taciz gibi riskleri azaltır.',
          'Ciddiyet: evlilik dışı niyetle gelenlerin sistemde tutunmasını zorlaştırır.',
          'Kalite: havuzun tıkanmasını ve aynı kişilerin dönüp durmasını azaltır.',
          'Şeffaflık: limit/cooldown/48saat gibi kurallar süreçte belirsizliği azaltır.',
        ],
        note:
          'Eğer hedef sadece daha fazla etkileşim ve “eğlence” olsaydı; daha az kural, daha serbest iletişim ve daha fazla açık profil ile çok daha fazla kullanım üretmek mümkündü.\nAma biz bu sistemi “aile kurmak isteyenler” için tasarladık; kaliteyi niceliğin önüne koyuyoruz.',
      },
      promise: {
        title: 'Ne vaat ediyoruz?',
        p1Title: 'Evlilik odaklı sistem',
        p1Body: 'Amaç; evlilik niyeti olan kişilerin kontrollü adımlarla tanışmasıdır. Eğlence/flört amaçlı kullanım yasaktır.',
        p2Title: 'Gizlilik',
        p2Body: 'Profiller kamuya açık değildir. Bilgileriniz yalnızca eşleşme teklifi alan kişiyle paylaşılır.',
        p3Title: 'Karar mekanizması',
        p3Body: 'Eşleşme teklifleri onay/ret ile ilerler. Karşılıklı onay olmadan süreç devam etmez; tek taraf ret verirse eşleşme biter.',
        p4Title: '2. onay (panel üzerinden)',
        p4Body: 'Karşılıklı onaydan sonra “2. adım” seçilir (site içi konuşma / iletişim paylaşımı). İki taraf aynı seçeneği seçince o adım açılır; süreç kilitlenir ve yeni aday gösterimi durur.',
        p5Title: 'Kötü niyete sıfır tolerans',
        p5Body: 'Gerçeğe aykırı bilgi, hakaret/taciz, cinsel taciz/istismar, maddi çıkar amaçlı girişimler, flört/eğlence niyeti ve benzeri ihlallerde sıfır tolerans uygulanır.',
      },
      zeroTolerance: {
        title: 'Katı kurallar (sıfır tolerans)',
        r1Title: 'Saygısız/argo/hakaret',
        r1Body: 'Küfürlü, aşağılayıcı, tehditkâr, taciz edici dil kesinlikle yasaktır.',
        r2Title: 'Evlilik dışı niyet',
        r2Body: 'Flört/oyun/çıkar ilişkisi, evlilik amacı taşımayan kullanım, cinsel taciz/istismar veya cinsel içerikli yönlendirme kesinlikle yasaktır.',
        r3Title: 'Dolandırıcılık/para talebi',
        r3Body: 'Para isteme, link yönlendirme, yatırım/kripto vb. gerekçelerle para talep etme, “acil para” senaryoları ve benzeri girişimler yasaktır.',
        r4Title: 'Yanıltıcı bilgi ve sahte profil',
        r4Body: 'Kendisiyle ilgisi olmayan bilgi/fotoğraf kullanma, kimlik/yaş/medeni durum gibi kritik alanlarda bariz yalan beyan yasaktır.',
        r5Title: 'Spam ve kötüye kullanım',
        r5Body: 'Toplu mesaj/ısrarcı takip, manipülasyon, sahte şikayet, sistem açıklarını suistimal etme yasaktır.',
        r6Title: 'Üçüncü kişilere paylaşım',
        r6Body: 'Eşleştiğiniz kişinin fotoğrafını/mesajını/bilgilerini izinsiz üçüncü kişilerle paylaşmak yasaktır.',
      },
      enforcement: {
        title: 'Yaptırımlar ve iade politikası',
        e1a: 'Kuralları ihlal eden kullanıcı (ekran görüntüsü / kanıt ile doğrulandığında)',
        e1b: 'kalıcı olarak engellenir',
        e1c: 've eşleşmeleri iptal edilir.',
        e2a: 'İhlal eden kullanıcının',
        e2b: 'aktif üyeliği varsa dahi iptal edilir',
        e3a: 'Kuralları ihlal eden kullanıcı, üyelik iptal edilse bile',
        e3b: 'hiçbir şekilde geri ödeme talep edemez',
        e4a: 'Bu platformu kullanan herkes, burada yazan kuralları',
        e4b: 'okumuş ve kabul etmiş sayılır',
      },
      complaint: {
        title: 'Şikayet / kanıt gönderme',
        body: 'Site içi veya WhatsApp görüşmelerinde karşı tarafın evlilik dışı niyeti olduğunu, gerçeğe aykırı bilgi verdiğini, hakaret/argo kullandığını, cinsel taciz/istismar yaptığını veya maddi çıkar sağlamaya çalıştığını düşünüyorsanız:',
        lead: 'Site içi veya WhatsApp görüşmelerinde karşı tarafın evlilik dışı niyeti olduğunu, gerçeğe aykırı bilgi verdiğini, hakaret/argo kullandığını, cinsel taciz/istismar yaptığını veya maddi çıkar sağlamaya çalıştığını düşünüyorsanız: {{complaintLeadExtra}}',
        extraFemale: 'Size karşı hakaret içerikli konuşan, cinsel çağrışımlı cümleler kullanan, küfürlü konuşan, amacı evlilik dışı ilişki olan veya profil bilgilerinin gerçek dışı olduğunu anladığınız kişileri ekran görüntüsü ile birlikte WhatsApp destek hattımızdan şikayet edebilirsiniz.',
        extraMale: 'İlk günden para isteyen, sizi dolandırmak amaçlı farklı sitelere ya da token tuzağına çekmek isteyen, evlilik amacı dışında oyun arayan veya profil bilgileriyle uyuşmayan kişileri ekran görüntüleriyle birlikte WhatsApp destek hattımızdan bize iletebilirsiniz.',
        c1Title: 'Kanıt toplayın',
        c1Body: 'ekran görüntüsü, mesajlar, para talebi vb.',
        c2Title: 'Bize iletin',
        c2Body: 'paneldeki WhatsApp destek hattından yazın ve durumu açıklayın.',
        c3Title: 'Değerlendirme',
        c3Body: 'İnceleme sonucunda kusurlu taraf engellenir ve üyeliği iptal edilir.',
      },
      safety: {
        title: 'Güvenlik hatırlatmaları',
        s1: 'Tanışma sürecinde temkinli olun; kişisel bilgilerinizi paylaşırken dikkatli davranın.',
        s2: 'Hiçbir koşulda para göndermeyin; para talebi görürseniz hemen bildirin.',
        s3: 'Profil bilgilerinin doğruluğunu araştırmak kullanıcı sorumluluğundadır; şüphede kalırsanız destek isteyin.',
      },
    },
  },

  matchmakingMembership: {
    title: 'Üyelik aktivasyonu',
    lead: 'Üyeliğinizi buradan aktifleştirebilirsiniz.',
    planTitle: 'Aylık üyelik',
    monthlyPrice: 'Fiyat: ${{amount}} / ay',
    promoTitle: 'Kampanya: Ücretsiz aktivasyon',
    promoBody: '{{date}} tarihine kadar üyelik aktivasyonu ücretsizdir.',
    promoEndedTitle: 'Kampanya bitti',
    promoEndedBody: '{{date}} sonrası üyelik aktivasyonu ücretlidir ve ödeme sonrası aktif olur.',
    freeActivateCta: 'Üyeliğimi ücretsiz aktif et',
    paidActivationCta: 'Ödeme adımına geç',
    activating: 'Aktifleştiriliyor…',
    activated: 'Üyelik aktifleştirildi.',
    activatedUntil: 'Üyelik aktifleştirildi. Bitiş: {{date}}',
    freeActivatedInfo:
      '{{date}} tarihine kadar ücretsiz üyeliğiniz tanımlanmıştır.\nÜyelik kapsamında eşleşme profilini beğenip reddetme ve {{translatedCount}} çevirili mesaj hakkından faydalanabilirsiniz.\nGünlük eşleşme değiştirme hakkınız {{dailyLimit}} ile sınırlıdır.',
    promoExpired: 'Kampanya süresi doldu. {{date}} sonrası aktivasyonlar ücretlidir ve ödeme sonrası aktif olur.',
    promoDisabled: 'Kampanya şu an kapalı. Lütfen daha sonra tekrar deneyin.',
    activateFailed: 'Üyelik aktifleştirilemedi. Lütfen tekrar deneyin.',
    errors: {
      notAuthenticated: 'Oturum doğrulanamadı. Lütfen çıkış yapıp tekrar giriş yapın.',
      serverNotConfigured: 'Sunucu yapılandırması eksik. Lütfen destek ile iletişime geçin.',
      apiUnavailableDev: 'API erişilemiyor. Lokal geliştirmede `npm run dev` (api+web) çalıştırın.',
    },
    backToPanel: 'Panele dön',
    paymentMethodsSoon: 'Not: {{date}} tarihine kadar üyelik aktivasyonu ücretsizdir.',
    paidAdminApprovalNote: 'Not: {{date}} sonrası üyelik aktivasyonu ücretlidir ve ödeme sonrası aktif olur.',
  },
};
