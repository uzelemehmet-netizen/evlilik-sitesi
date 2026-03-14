export default {
    previewGate: {
      title: 'Bu işlem için kayıt olmalısınız',
      body: 'Bu işlemi yapabilmek için önce kayıt olmalı ve eşleştirme formunu doldurmalısınız.',
      signup: 'Kayıt ol',
      dismiss: 'Geç',
    },
  appErrorBoundary: {
    title: 'Bir hata oluştu',
    body: 'Sayfa yüklenemedi. Lütfen yenilemeyi deneyin.',
    tryAgain: 'Yeniden dene',
    reload: 'Sayfayı yenile',
    report: {
      button: 'Hata bildir',
      sending: 'Bildiriliyor…',
      sent: 'Bildirildi. Teşekkürler.',
      failed: 'Bildirim gönderilemedi. Lütfen tekrar deneyin.',
    },
  },
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
        'Yükleme seçeneği görünmüyorsa: tarayıcı menüsünden “Ana ekrana ekle / Uygulamayı yükle” seçeneğini kullanın (bazı cihazlarda HTTPS ve ilk ziyaret sonrası görünür). Eğer WhatsApp/Instagram gibi uygulama içi tarayıcıda açtıysanız: sağ üst menüden “Tarayıcıda aç (Safari/Chrome)” deyin; sonra yükleme seçeneği görünür.',
      ios: {
        title: 'iPhone/iPad (Safari) için',
        step1: 'Siteyi Safari’de açın.',
        step2: 'Paylaş’a dokunun (oklu kare).',
        step3: '“Ana Ekrana Ekle” seçin ve ekleyin.',
      },
      notifications: {
        title: 'Bildirimler',
        lead: 'Bildirimleri açarsanız (tarayıcı izin verirse) aşağıdaki olaylarda size bildirim gösterebiliriz:',
        button: 'Bildirimleri aç',
        testButton: 'Test bildirimi gönder',
        testHint: 'Önce bildirimleri açın (push token kaydı).',
        testTitle: 'Test bildirimi',
        testBody: 'Bu bir test bildirimidir.',
        testSent: 'Test bildirimi gönderildi (gelmesi birkaç saniye sürebilir).',
        testFailed: 'Test bildirimi gönderilemedi. (Token yok veya kurulum eksik olabilir.)',
        testNoTokens: 'Bildirim tokenı bulunamadı. Lütfen önce "Bildirimleri Aç" butonuna basıp tekrar deneyin.',
        alreadyEnabled: 'Bildirim izni zaten açık.',
        enabled: 'Bildirimler açıldı.',
        enabledButNotSaved:
          'Bildirim izni açıldı, ancak bildirim kaydı sunucuya kaydedilemedi. Giriş yapıp tekrar deneyin (veya sayfayı yenileyin).',
        denied: 'Bildirim izni verilmedi. Tarayıcı ayarlarından izin verebilirsiniz.',
        notSupported: 'Bu cihaz/tarayıcı bildirimleri desteklemiyor.',
        notSecureContext: 'Bildirimler için HTTPS gerekir. Lütfen siteyi https üzerinden açın.',
        serviceWorkerNotReady: 'Bildirim altyapısı henüz hazır değil. Sayfayı yenileyip tekrar deneyin.',
        missingSetup: 'Push kurulumu eksik: VAPID anahtarı ayarlanmadı.',
        invalidVapidKey: 'Push kurulumu hatalı: VAPID anahtarı geçersiz. Firebase Console’dan doğru Public key’i kopyalayın.',
        notLoggedIn: 'Bildirimleri açmak için giriş yapmalısın.',
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
        photos: {
          showMine: 'Fotoğraflarımı göster',
          hideMine: 'Fotoğraflarımı gizle',
          reciprocityHint: 'Not: Fotoğraflarını gizlediğin kişilerin fotoğraflarını sen de göremezsin (karşılıklılık).',
          reciprocityConfirm:
            'Fotoğraflarını gizlersen bu kişinin fotoğraflarını da göremezsin (karşılıklılık). Devam edilsin mi?',
          reciprocityBlocked: 'Fotoğraflar kilitli: Kendi fotoğraflarını gizlediğin için.',
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
    explore: "Keşfet",
    tours: "Turlar",
    wedding: "Evlilik Rehberliği (TR–ID)",
    matchmaking: "Eş Adayı",
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

  footer: {
    brandBlurb:
      '{{company}} markasıdır. Türkiye–Endonezya evlilik sürecinde; iletişim, evraklar ve resmî adımlarda rehberlik ve koordinasyon desteği sunar. Eşleştirme ise ikinci plandaki yardımcı bir akıştır.',
    brandsTitle: 'Markalarımız',
    brandNoteDameturk: '',
    sections: {
      quickLinks: 'Hızlı Linkler',
      legal: 'Yasal',
      contact: 'İletişim',
      social: 'Sosyal Ağlar',
    },
    links: {
      membership: 'Üyelik',
      whatsapp: 'WhatsApp',
    },
    legal: {
      documents: 'Dokümanlar',
      userAgreement: 'Eşleştirme Kullanım Sözleşmesi',
      kvkkNotice: 'KVKK Aydınlatma Metni',
      siteRules: 'Site Kuralları',
      refundPolicy: 'İptal ve İade Politikası',
      privacyPolicy: 'Gizlilik Politikası',
    },
    companyInfo: {
      title: 'Firma Bilgileri',
      labels: {
        legalName: 'Ticari Ünvan',
        address: 'Adres',
        tax: 'Vergi',
        nib: 'NIB',
      },
    },
    phoneNotes: {
      trLine: 'WhatsApp hattı',
      idLine: 'Alternatif WhatsApp hattı',
    },
    whatsappMessages: {
      general: 'Merhaba, bilgi almak istiyorum.',
      wedding: 'Merhaba, evlilik rehberliği hakkında bilgi almak istiyorum.',
      youtube: 'Merhaba, YouTube içerikleriniz hakkında bir sorum var.',
      contact: 'Merhaba, sizinle iletişime geçmek istiyorum.',
      home: 'Merhaba, sitenizi inceliyorum, bilgi alabilir miyim?',
    },
    social: {
      instagram: 'Instagram',
      youtube: 'YouTube',
      whatsapp: 'WhatsApp',
    },
    copyright: '© {{year}} {{company}}. Tüm hakları saklıdır.',
  },

  tour: {
    common: {
      skip: 'Geç',
      next: 'Devam',
      done: 'Tamam',
      missingHint: 'Bu adım şu an görünmüyor. Devam edebilirsin.',
    },
    publicGuidance: {
      step1: {
        title: 'Ödeme ve güven (1/2)',
        body: 'Güven konusunda içiniz rahat olsun diye, Endonezya’ya gelene kadar hiçbir rehberlik ücreti talep etmiyoruz. Ödemeyi Endonezya’ya geldiğinizde yapabilirsiniz. En uygun fiyatla rehberlik hizmetimizden faydalanabilir, size ait belgeleri toplamaktan başka hiçbir karmaşık işlemle uğraşmadan evliliğinizi en kolay yoldan gerçekleştirebilirsiniz.',
      },
      step2: {
        title: 'Rehberlik süreci (2/2)',
        body: 'Rehberlik hizmetimizi Endonezya’da yaşayan bir Türk ekibi olarak Endonezya’da yürütüyoruz. Endonezya’ya evlilik için gelecek dostlarımıza her aşamada yanlarında bulunarak destek oluyoruz; havaalanından karşılayıp, dönüşte eşinizle birlikte havaalanına bırakana kadar sürecin tamamında yanınızdayız.',
      },
    },
    preview: {
      matches: {
        title: 'Profilim: Eşleşmeler',
        body: 'Eşleşmeler, istekler ve sohbetler Profilim ekranından yönetilir.',
      },
      pool: {
        title: 'Havuz: Adaylar',
        body: 'Adaylara göz atıp istek gönderebilir veya beğeni bırakabilirsin.',
      },
      request: {
        title: 'Eşleşme isteği gönder',
        body: 'Bu butonlar örnek amaçlıdır. Gerçek işlem için önce kayıt olmalı ve formu doldurmalısın.',
      },
    },
    onboarding: {
      matches: {
        title: 'Eşleşmeler',
        body: 'Beğeniler, istekler ve eşleşmeler bu ekranda yönetilir.',
      },
      pool: {
        title: 'Havuz',
        body: 'Adayları görüntüleyip eşleşme isteği gönderebilirsiniz.',
      },
      request: {
        title: 'Eşleşme isteği',
        body: 'Bu buton ile eşleşme isteği gönderilir. Karşı taraf onaylarsa eşleşme oluşturulur.',
      },
    },
    like: {
      title: 'Beğeni',
      body: 'İlgi göstermek için beğenebilirsiniz; isterseniz geri alabilirsiniz.',
    },
    activeStart: {
      title: 'Aktif eşleşme',
      body: 'Karşılıklı beğeni sonrası aktif eşleşmeyi başlatarak sohbeti açabilirsiniz.',
    },
    chat: {
      input: {
        title: 'Mesaj',
        body: 'Mesajınızı buraya yazın.',
      },
      send: {
        title: 'Gönder',
        body: 'Mesajı göndermek için bu butonu kullanın.',
      },
    },
    profileDetails: {
      title: 'Profil detay izni',
      body: 'Profil detaylarını görüntülemek için izin isteyebilirsiniz.',
    },

    pwaNudge: {
      title: 'Uygulamayı yükle ve bildirimleri aç',
      body: 'Uygulamayı ana ekrana ekleyip bildirimleri açarsanız; mesaj, istek ve onayları kaçırmazsınız.',
      primary: 'Tek tık: Yükle + Bildirimleri Aç',
      later: 'Sonra',
    },
  },

  ui: {
    lightbox: {
      close: 'Kapat',
      prev: 'Önceki',
      next: 'Sonraki',
      imageAlt: 'Görsel {{index}}',
    },
  },

  studio: {
    common: {
      back: 'Geri',
      open: 'Aç',
      actionMenu: 'İşlem Menüsü',
      close: 'Kapat',
      cancel: 'Vazgeç',
      send: 'Gönder',
      loading: 'Yükleniyor…',
      processing: 'İşleniyor…',
      readMore: 'Devamını oku',
      readLess: 'Daha az göster',
      match: 'Eşleşme',
      profile: 'Profil',
      verified: 'Güvenilir kullanıcı',
      unknown: 'Bilinmiyor',
      zoom: 'Büyüt',
      enlargePhotoAria: '{{name}} fotoğrafını büyüt',
    },

    presence: {
      online: 'Çevrimiçi',
      lastSeenMinutes_one: 'Son aktif: {{count}} dk önce',
      lastSeenMinutes_other: 'Son aktif: {{count}} dk önce',
      lastSeenHours_one: 'Son aktif: {{count}} saat önce',
      lastSeenHours_other: 'Son aktif: {{count}} saat önce',
      lastSeenDays_one: 'Son aktif: {{count}} gün önce',
      lastSeenDays_other: 'Son aktif: {{count}} gün önce',
    },

    errors: {
      generic: 'Hata',
    },

    referral: {
      title: 'Arkadaşını Davet Et',
      description: 'Bir arkadaşını davet et. İkiniz de kimlik doğrulaması yapınca ikinize de ücretsiz üyelik verilir.',
      myCodeLabel: 'Davet kodun',
      shareButton: 'WhatsApp’tan paylaş',
      shareMessage:
        'https://uniqah.com/login\n\nEvlilik amaçlı tanışma uygulamasına davet kodun {{code}}. Bu kodu kayıt formuna ekleyerek 1 aylık ücretsiz üyelik kazanabilirsin.',
      copy: 'Kopyala',
      copied: 'Kopyalandı.',
      enterCodeLabel: 'Davet kodu',
      enterCodePlaceholder: 'UC-1001',
      acceptButton: 'Kodu Onayla',
      invitedByLabel: 'Davet eden',
      claimButton: 'Ücretsiz üyeliği al',
      statusAccepted: 'Davet kodu kaydedildi.',
      statusAlreadyAccepted: 'Bu davet kodu zaten kaydedilmiş.',
      statusClaimed: 'Ödül uygulandı. Üyeliğin güncellendi.',
      statusAlreadyClaimed: 'Ödül zaten alınmış.',
      errors: {
        referralDisabled: 'Davet sistemi şu an kapalı.',
        userCodeMissing: 'Davet kodun henüz oluşmadı. Biraz sonra tekrar dene.',
        invalidInviteCode: 'Davet kodu geçersiz.',
        inviteCodeNotFound: 'Bu davet kodu bulunamadı.',
        selfReferralNotAllowed: 'Kendi kodunu kullanamazsın.',
        alreadyReferred: 'Daha önce bir davet kodu kullanmışsın.',
        referralNotFound: 'Davet kaydı bulunamadı.',
        referralNotAccepted: 'Davet henüz onaylı değil.',
        referralMismatch: 'Davet bilgisi uyuşmuyor.',
        verificationRequired: 'Ödül için iki tarafın da kimliği doğrulanmış olmalı.',
      },
    },

    feedback: {
      nav: 'Şikayet/İstek',
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
      titleShort: 'İstekler',
      modalTitleMessages: 'Mesajlar',
      modalTitleRequests: 'İstekler',
    },

    accessInbox: {
      title: 'Gelen istekler ({{count}})',
      requested: 'Profilini görmek için izin istiyor',
      approve: 'İzin ver',
      reject: 'Reddet',
      openButton: 'Gelen istekler',
      openButtonWithCount: 'Gelen istekler ({{count}})',
    },

    inboxModal: {
      emptyMessages: 'Şu anda yeni mesaj yok.',
      emptyRequests: 'Şu anda yeni istek yok.',
      new: 'Yeni',
      markRead: 'Okundu yap',
      read: 'Okundu',
      reviewProfile: 'Profili incele',
      hideProfile: 'Profili gizle',
      approve: 'Onayla',
      allow: 'İzin ver',
      prev: 'Önceki',
      next: 'Sonraki',
      photoAlt: 'Fotoğraf',
      wantChildren: 'Çocuk isteği',
      requestText: {
        preMatch: 'Ön eşleşme isteği gönderdi.',
        photoAccess: 'Fotoğraflarını görmek için izin istiyor.',
        profileAccess: 'Profilini görmek için izin istiyor.',
      },
    },

    pool: {
      title: 'Keşfet',
      backToMatches: '← Eşleşmelere dön',
      refresh: 'Yenile',
      lastUpdated: 'Otomatik yenilenir (20 sn).',
      countHint: 'Toplam: {{total}} • Gösterilen: {{shown}}',
      filtersHint: 'Yaş aralığı: {{min}} – {{max}}',
      trust: {
        title: 'Güven ve doğrulama',
        body:
          'Bu sistem evlilik odaklı, kontrollü bir akışla ilerler. Kimlik doğrulama zorunlu değildir; isteyen kullanıcıların güven rozetidir.\n\nDoğrulama için gönderilen bilgiler yalnızca doğrulama amacıyla kullanılır, doğrulama tamamlandıktan sonra kalıcı olarak saklanmaz. Hesabını dilediğin zaman silebilirsin; silme işlemi sonrası profil ve eşleşme verilerin sistemden kaldırılır.',
        sortNote: 'Not: Keşfet ekranında kimlik doğrulaması yapan profiller üst sıralarda gösterilir.',
      },
      empty: 'Şu an gösterilecek profil bulunamadı.',
      goToMatchCard: 'Eşleşme kartına git',
      requestProfileNow: 'Eşleşme isteği gönder',
      requesting: 'İstek gönderiliyor…',
      requestSent: 'İstek gönderildi',
      openProfile: 'Profili aç',
      profileModalTitle: 'Profil',
      actionsSoon: 'Yakında: kısa mesaj',
      notInTheirRange: 'Etkileşim için onun yaş aralığında olmalısın.',
      notInTheirRangeShort: 'Yaş aralığı uymuyor',
    },

    waitingNote: {
      title: 'Uygun eşleşme aranıyor',
      body:
        'Profil bilgilerinize ve aradığınız kriterlere uygun eşleşme arıyoruz. Uygun profiller <explore>Keşfet</explore> sekmesinde görüntülenecektir. Uygulamayı cihazınıza indirip bildirimleri açarak anında bildirim alabilirsiniz.',
    },

    paywall: {
      upgradeTitle: 'Üyelik aktivasyonu gerekli',
      upgradeToInteract: 'Devam etmek için üyeliğini aktifleştir. Şu an ücretsiz.',
      upgradeToReply: 'Yanıtlamak için üyeliğini aktifleştir. Şu an ücretsiz.',
      upgradeCta: 'Üyeliği aktifleştir (Ücretsiz)',
    },

    profileGate: {
      important: 'ÖNEMLİ',
      title: 'Profilini tamamla',
      body: 'Bu sistem evlilik niyetindeki insanları bir araya getirdiği için diğer kullanıcılarla etkileşime geçebilmeniz için profil formunu doldurmanız gerekmektedir.',
      cta: 'Profil formunu doldur',
      badge: 'Bilinmeyen kullanıcı',
    },

    profileIncompleteExploreWarning: {
      title: 'Profil formunu doldurmalısın',
      body: 'Profil bilgileriniz olmadığı için Keşfet sayfasında karşı cinsiyet yerine kendi cinsiyetinizdeki kişiler görüntülenebilir. Bu yüzden lütfen profil formunu doldurun.',
    },

    membershipModal: {
      deletePhrase: 'hesabımı sil',
      deleteTypePrompt: 'Hesabı gerçekten silmek istiyorsanız: "{{phrase}}" yazın.',
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
      contactPrivacyNotice:
        'İletişim bilgileriniz (WhatsApp/e-posta) gizlidir. Form doldururken ve uygulamada herkese açık şekilde gösterilmez.',
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
        familyObstacle: 'Aile engeli var mı?',
        familyObstacleDetails: 'Aile engeli (detay)',
        familyApprovalStatus: 'Aile onayı',
        religion: 'Din',
        religiousValues: 'Dini hassasiyet',
        incomeLevel: 'Gelir',
        marriageTimeline: 'Evlilik zamanı',
        relocationWillingness: 'Taşınma',
        preferredLivingCountry: 'Tercih edilen ülke',
        communicationLanguage: 'İletişim dili',
        communicationLanguageOther: 'İletişim dili (diğer)',
        canCommunicateWithTranslationApp: 'Çeviri uygulaması ile konuşabilir',
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
        messageLong: 'Mesaj',
        profileDetails: 'Profil detayları',
      },
      photos: {
        showMine: 'Fotoğraflarımı göster',
        hideMine: 'Fotoğraflarımı gizle',
        reciprocityHint: 'Not: Fotoğraflarını gizlediğin kişilerin fotoğraflarını sen de göremezsin (karşılıklılık).',
        reciprocityConfirm:
          'Fotoğraflarını gizlersen bu kişinin fotoğraflarını da göremezsin (karşılıklılık). Devam edilsin mi?',
        reciprocityBlocked: 'Fotoğraflar kilitli: Kendi fotoğraflarını gizlediğin için.',
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
      banners: {
        locked: 'Aktif eşleşmen var — diğer profiller kilitli',
        newMessage: 'Yeni mesaj',
        incomingLikeNote: 'Bu kişi size beğeni gönderdi',
        activeChatStarted: 'Aktif eşleşmeniz başlatıldı. Mesaj butonuna tıklayarak sınırsız mesajlaşmaya başlayabilirsiniz.',
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
      requestFailed: 'İstek başarısız: {{error}}',
      requestOk: 'İstek gönderildi. Birkaç saniye içinde listene düşebilir.',
      loading: 'Yükleniyor…',
      loadFailed: 'Eşleşmeler yüklenemedi: {{error}}',
      noneTitle: 'Henüz eşleşmen yok.',
      noneBody:
        'Yeni profil oluşturduysan Keşfet sayfasından sana uygun profillere eşleşme listene ekleme isteği göndererek ya da diğer kullanıcılardan gelen eşleşme listene ekleme isteklerini onaylayarak eşleşme listende birbirinizle beğeni, kısa mesaj ve profil görüntüleme ile etkileşime girebilirsiniz. Eğer uygun bir eşleşme profili bulamadıysan, uygulamayı telefonuna indirip bildirimleri açarak değişikliklerden anında haberdar olabilirsin. Amacın evlilikse doğru kişiyi bulmak zaman alabilir; sabırlı olmanı tavsiye ederiz.',
      shortModal: {
        subtitle: 'Kısa mesaj (5 limit) • profil dışı kısa bilgi için',
        remaining: 'Kalan hak: {{remaining}} / {{limit}}',
        noMessages: 'Henüz mesaj yok.',
        translateError: 'Çeviri olmadı: {{error}}',
        translating: 'Çevriliyor…',
        translate: 'Çevir',
        placeholder: 'Kısa bir soru yaz…',
      },
      inboxSync: {
        title: 'Inbox sorunu',
        refresh: 'Sunucudan getir',
        refreshing: 'Yenileniyor…',
        note: 'Not: Firestore dinlemesi bozulsa bile aynı veriyi sunucudan getirir.',
        permissionDenied: 'Firestore okuma izni yok (permission-denied). Firebase projesi: {{projectId}} (Sunucudan yenile deneyin)',
        listenFailed: 'Firestore inbox ({{kind}}) hata verdi: {{error}} (Sunucudan getir deneyin)',
        kinds: {
          likes: 'beğeni',
          requests: 'istek',
          profileAccess: 'profil izin',
          messages: 'mesaj',
        },
      },
      errors: {
        goToMatchCard: 'Eşleşme kartına git',
        activeLocked: 'Aktif eşleşme varken diğer profillere mesaj atamazsın. Önce aktif eşleşmeni bitir.',
        shortLimit: 'Kısa mesaj hakkın bitti (5). Devam için aktif eşleşme başlatmalısın.',
      },
    },
    chat: {
      backToMatches: '← Eşleşmelere dön',
      translateTargetLabel: 'Şu dile çevir',
      chatTitle: 'Chat',
      emoji: 'Emoji',
      emojiHint: 'Emoji ekleyebilirsiniz',
      matchTestOnlyActive: 'Eşleşme testi sadece aktif eşleşmede açılır.',
      shortAreaTitle: 'Kısa mesaj alanı',
      shortAreaDesc: 'Bu alan kısa sorular içindir (profilde olmayan konular).',
      shortAreaLimit: 'Limit: {{limit}} • Kalan: {{remaining}}',
      otherActiveLock: 'Aktif eşleşmen başka biriyle. Bu eşleşmede uzun sohbet kapalı.',
      noMessages: 'Henüz mesaj yok. İlk mesajı sen gönder.',
      matchLoading: 'Eşleşme yükleniyor…',
      matchNotFound: 'Eşleşme bulunamadı.',
      messagesLoading: 'Mesajlar yükleniyor…',
      sendFailed: 'Mesaj gönderilemedi. {{error}}',
      inputPlaceholderLong: 'Mesaj yaz…',
      inputPlaceholderShort: 'Kısa soru/mesaj yaz…',
      notAvailable: 'Mesajlaşma şu an kullanılamıyor.',
      lockedTitle: 'Diğer eşleşmeler geçici olarak kilitli',
      lockedBody: 'Aktif eşleşmen varken diğer eşleşmelerde mesajlaşma kapalı.',
      notAllowed: 'Bu sohbeti görüntüleme yetkin yok.',
      notOpenTitle: 'Mesajlaşma henüz açık değil',
      notOpenBody: 'Mesajlaşma, eşleşme aktif olunca açılır.',
      you: 'Sen',
      remainingTime: '{{hours}}s {{minutes}}dk',
      lock48h: {
        title: '48 saat özel sohbet + iletişim paylaşımı',
        subtitle: 'Onay + süre tamamlanınca iletişim açılır.',
        lockedRemaining: 'Kilitli. Kalan: {{time}}',
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
        confirmError: 'Onay başarısız: {{error}}',
        contactRequestError: 'İstek başarısız: {{error}}',
        contactApproveError: 'Onay başarısız: {{error}}',
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
        reciprocityBlocked: 'Fotoğraflar kilitli: Kendi fotoğraflarını gizlediğin için.',
      },
      profileTitle: 'Profil bilgileri',
      contactHidden:
        'İletişim bilgileri gizlidir. Bu bilgiler formu doldururken de uygulamada görünmez. Yalnızca 48 saatlik aktif eşleşme süreci sonunda kesin eşleşme sağlanırsa ve sizin onayınız olursa paylaşılabilir.',
      rulesTitle: 'Kurallar (kısaca)',
      rules: {
        generic: 'Hata',
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
        title: 'Aktif eşleşmeyi bitir',
        desc: 'Bitirme işlemi karşılıklıdır. Sen bitirince karşı tarafın da bitirmesi gerekir.',
        cooldown: 'Suistimali önlemek için aktif eşleşme başladıktan sonraki ilk 2 saat iptal kapalı. Kalan süre: {{time}}',
        request: 'Aktif eşleşmeyi bitir',
        requestSent: 'Bitirme isteği gönderildi',
        waitingOther: 'Karşı tarafın bitirmesi bekleniyor.',
        confirmPrompt:
          'Aktif eşleşmeyi bitirmek üzeresin.\n\n- Bitirme karşılıklıdır: iki taraf da bitirince eşleşme kapanır.\n- Bitince diğer profillerle etkileşim kilidi kalkar.\n\nOnaylıyor musun?',
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

      partnerPrefsTitle: 'Aradığım kişi tercihleri',
      partnerPrefsCta: 'Düzenle',
      partnerPrefsSave: 'Kaydet',
      partnerPrefsSaving: 'Kaydediliyor…',
      partnerPrefsSaved: 'Kaydedildi.',
      partnerPrefsErrors: {
        failed: 'Kaydedilemedi. Lütfen tekrar deneyin.',
      },

      subscriptionTitle: 'Abonelik',
      subscriptionActiveDesc: 'Üyeliğiniz aktif. Tüm özelliklere erişebilirsiniz.',
      subscriptionPassiveDesc: 'Üyeliğiniz pasif. Üyelik olmadan bazı aksiyonlar kısıtlı olabilir.',
      buySoon: 'Üyelik Satın Al (yakında)',
      activateMembership: 'Hesabı ücretsiz aktif et',
      cancelMembership: 'Üyeliği İptal Et',
      membershipActivated: 'Hesap aktif edildi.',
      membershipCancelled: 'Üyelik iptal edildi.',
      confirmCancelMembership: 'Üyeliğini iptal etmek istiyor musun?',
      myInfo: 'Bilgilerim',
      identityTitle: 'Kimlik Doğrulama',
      identityVerified: 'Kimliğin doğrulanmış görünüyor.',
      identityStatus: 'Durum',
      verifyNow: 'Kimliğimi Doğrula',
      identityHelp: 'Kimliğini doğrulayarak güven puanını artırabilir ve üyelik/özellik kısıtlarını kaldırabilirsin.',
      identityIntro: {
        title: 'Kimlik doğrulama nedir?',
        body:
          'Bu adım zorunlu değildir.\n\nKimlik doğrulama; güven puanını yükseltmek, profilinde güven rozeti göstermek ve Keşfet\'te daha üst sıralarda yer almak isteyenler içindir.\n\nDoğrulama için gönderilen bilgiler sadece doğrulama amacıyla kullanılır ve süreç tamamlandıktan sonra kalıcı olarak saklanmaz.',
        cta: 'Okudum, devam et',
      },
      actionIntro: {
        explore: {
          title: 'Keşfet',
          body: 'Keşfet, sistemin senin için seçtiği profilleri gösterir. Kimliği doğrulanmış profiller daha üstte görünebilir.',
          cta: 'Okudum, aç',
        },
        editProfile: {
          title: 'Profil',
          body: 'Bu bölümde başvuru/profil bilgilerini güncelleyebilirsin. Değişiklikler eşleşme sürecini etkileyebilir.',
          cta: 'Okudum, devam et',
        },
        matches: {
          title: 'Eşleşmelerim',
          body: 'Eşleşmelerini buradan yönetirsin: beğeni, onay/ret ve sohbet adımları burada ilerler.',
          cta: 'Okudum, aç',
        },
        partnerPrefs: {
          title: 'Aradığım kişi tercihleri',
          body: 'Kriterlerini güncelleyerek daha uygun eşleşmeler görmene yardımcı olur.',
          cta: 'Okudum, düzenle',
        },
        membership: {
          title: 'Üyelik',
          body: 'Üyelik durumunu ve üyeliğe bağlı bazı özellikleri buradan yönetebilirsin.',
          cta: 'Okudum, aç',
        },
        photo: {
          title: 'Fotoğraflar',
          body: 'Fotoğraflarını yönetebilir ve istersen fotoğraf gizliliğini (blur) ayarlayabilirsin.',
          cta: 'Okudum, aç',
        },
        guidance: {
          title: 'Evlilik Rehberliği',
          body: 'Evlilik süreciyle ilgili rehberlik bilgilerini ve hızlı iletişim seçeneklerini görürsün.',
          cta: 'Okudum, aç',
        },
        feedback: {
          title: 'Şikayet/İstek',
          body: 'Uygunsuz davranışları bildirmek veya destek istemek için bu kanalı kullanabilirsin.',
          cta: 'Okudum, devam et',
        },
        identity: {
          title: 'Kimlik doğrulama',
          body: 'Bu bölüm kimlik doğrulama seçeneklerini açar. Doğrulama isteğe bağlıdır ve güven rozetini güçlendirir.',
          cta: 'Okudum, aç',
        },
        referral: {
          title: 'Davet',
          body: 'Davet kodu/bağlantısı ile arkadaşlarını davet edebilir, kampanya/avantaj varsa buradan takip edebilirsin.',
          cta: 'Okudum, aç',
        },
        logout: {
          title: 'Çıkış',
          body: 'Hesabından güvenli şekilde çıkış yaparsın. Tekrar giriş yaptığında kaldığın yerden devam edebilirsin.',
          cta: 'Okudum, çıkış yap',
        },
      },
      identityTrust: {
        title: 'Bu doğrulama ne işe yarar?',
        points: {
          optional: 'Zorunlu değildir; sadece güven rozetidir (isteğe bağlı).',
          privacy: 'Doğrulama bilgileri doğrulama amacı dışında paylaşılmaz.',
          destroy: 'Doğrulama tamamlandıktan sonra gönderdiğin doğrulama dosyaları/verileri kalıcı olarak saklanmaz.',
          deleteAccount: 'Hesabını dilediğin zaman silerek profil ve eşleşme verilerini kaldırabilirsin.',
          sorting: 'Kimlik doğrulaması yapan profiller Keşfet’te üst sıralarda gösterilir.',
        },
      },

      emailVerify: {
        title: 'E-posta doğrulama (isteğe bağlı)',
        body: 'E-posta adresin: {{email}}. Doğrulamak istersen sana bir doğrulama e-postası gönderebiliriz.',
        cta: 'Doğrulama e-postası gönder',
        sent: 'Doğrulama e-postası gönderildi. Gelen kutunu kontrol et.',
        failed: 'E-posta doğrulama gönderilemedi. Lütfen tekrar deneyin.',
      },
      accountTitle: 'Hesap',
      accountDeleteDesc: 'Hesabınızı ve ilişkili verileri kalıcı olarak silebilirsiniz.',
      deleteAccount: 'Hesabı Sil',
      deleting: 'Siliniyor…',
      oldPanel: 'Eski panel (geçici)',
      verifyModalTitle: 'Kimlik doğrulama',
      verifyModalInfo: 'Kimlik doğrulama isteğe bağlıdır.\n\nBir yöntem seçin ve yönergeleri takip edin. İnceleme tamamlandığında rozet profilinizde görünür.',
      verifyMethodSelfieVideo: 'Selfie video doğrulama',
      verifyMethodSocial: 'Sosyal medya ile doğrulama',
      verifySelfieVideoTitle: 'Selfie video (WhatsApp) ile doğrulama',
      verifySelfieVideoBody: 'WhatsApp üzerinden 5 saniyelik bir video selfie göndermeniz istenir. Talep oluşturup WhatsApp\'ı açabilirsiniz.',
      verifySelfieVideoCta: "WhatsApp'ı aç",
      verifySocialTitle: 'Sosyal medya ile doğrulama',
      verifySocialBody: 'Instagram / TikTok / YouTube / Facebook hesabınızı seçin ve kullanıcı adınızı gönderin. Ekibimiz kontrol edip rozetinizi tanımlar.',
      verifySocialPlatform: 'Platform',
      verifySocialUsername: 'Kullanıcı adı',
      verifySocialMissing: 'Lütfen platform seçin ve kullanıcı adınızı yazın.',
      verifySocialSubmitted: 'Talebiniz alındı. İnceleme bekleniyor.',
      idType: 'Kimlik türü',
      idTypeTrId: 'T.C. Kimlik',
      idTypePassport: 'Pasaport',
      idTypeDriver: 'Ehliyet',
      verifyPhotosHint: 'Fotoğraflar sadece doğrulama için kullanılır.',
      verifyPrivacyNote: 'Kimliğinizin tamamını göstermenize gerek yok; sadece isim soyisim ve doğum tarihi bizim için yeterli.',
      idFront: 'Kimlik ön yüz',
      idBack: 'Kimlik arka yüz',
      selfie: 'Selfie',
      verifyMissingFiles: 'Lütfen kimlik ön/arka ve selfie yükleyin.',
      verifySubmitted: 'Kimlik doğrulama talebin alındı. İnceleniyor.',
      submitVerification: 'Gönder',
      confirmDelete: 'Hesabınızı kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.',

      photoPrivacy: {
        title: 'Fotoğraflar',
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

        panel: {
          membership: {
            title: 'Üyelik şartları',
            lead: 'Üyelik şartları:',
            freeActiveTermsTitle: 'Ücretsiz aktivasyon şartları',
          },
        },
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

  matchmakingPreview: {
    badge: 'Profilim önizleme',
    title: 'Profilim ekranını tutorial ile önizle',
    subtitle:
      'Aşağıdaki alanlar örnek/önizlemedir. Beğeni, mesaj ve eşleşme isteği gibi işlemler için önce kayıt olmalı ve başvuru formunu doldurmalısınız.',
    actions: {
      signup: 'Kayıt ol',
      goProfile: 'Profilime git',
      goApply: 'Formu doldur',
    },
    gate: {
      title: 'Bu işlem için önce kayıt olmalısınız',
      body: 'Beğeni / mesaj / eşleşme isteği gönderebilmek için önce kayıt olmalı ve formu doldurmalısınız.',
      ctaSignup: 'Kayıt ol ve formu doldur',
      ctaApply: 'Form sayfasına git',
    },
    cards: {
      matches: {
        title: 'Eşleşmeler',
        body: 'İstekleri, beğenileri ve eşleşmeleri buradan takip edersin.',
        cta: 'Eşleşmeleri gör',
      },
      pool: {
        title: 'Havuz',
        body: 'Adaylara göz atıp istek gönderebilir veya beğeni bırakabilirsin.',
        cta: 'Havuza git',
        request: 'Eşleşme isteği gönder',
        like: 'Beğen',
      },
      chat: {
        title: 'Sohbet',
        body: 'Eşleşme olursa buradan mesajlaşırsın.',
        mockTitle: 'Örnek sohbet',
        mockSystem: 'Sistem',
        mockMsg1: 'Merhaba, nasılsın?',
        mockMsg2: 'İyiyim, teşekkürler. Sen nasılsın?',
        inputPlaceholder: 'Mesaj yaz…',
        send: 'Gönder',
        gateHint: 'Mesajlaşma için önce kayıt olmalısınız.',
      },
    },
    note: 'Not: Bu sayfa bir önizlemedir; gerçek veriler profil sayfasında görünür.',
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
          translateTargetLabel: 'Çeviri dili',
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
    metaTitle: 'Eşleştirme',
    badge: 'Gizli ve kontrollü süreç',
    title: 'Evlilik eşleştirme sistemi',
    liveJoinToast: 'Yeni katılım oldu',
    description:
      'Sistem yeni; lütfen sabırlı olun. Eşleşmeler genelde 1–3 gün içinde gelir. Uygulamayı indirip bildirimleri açarak değişikliklerden anında haberdar olabilirsin.',
    preview: {
      title: "Kayıt olunca 'Profilim'de neler göreceksin?",
      subtitle:
        'Aşağıdaki örnek ekranlar gerçek bir kullanıcıya ait değildir; sadece sistem akışını hızlıca anlatmak içindir.',
      cta: 'Ücretsiz kayıt ol',
      cards: {
        matches: {
          title: 'Eşleşmeler & durumlar',
          body: 'Karşılıklı ilgi, aktifleşme ve iletişim adımları burada ilerler. Her adım kontrollüdür.',
          mockTitle: 'Örnek',
          mockItem1: 'Önerilen eşleşme',
          mockItem1Sub: 'Durum: karşılıklı ilgi (örnek)',
          mockTag1: 'İncele',
          mockItem2: 'Aktif eşleşme',
          mockItem2Sub: 'Durum: sohbet açık (örnek)',
          mockTag2: 'Mesaj',
        },
        pool: {
          title: 'Havuz (adaylar)',
          body: 'Uygun adayları görür, istek gönderir veya geçersin. Karşı taraf onaylarsa eşleşme kartı açılır.',
          mockTitle: 'Örnek',
          mockItem1: 'Aday profili kartı (örnek)',
          mockItem1Sub: 'Yaş • Şehir • Kısa özet (örnek)',
          mockCta: 'İstek gönder',
        },
        chat: {
          title: 'Güvenli mesajlaşma',
          body: 'Mesajlar filtrelenir; erken aşamada telefon/e‑posta/link gibi bilgiler engellenir.',
          mockTitle: 'Örnek',
          mockSystem: 'Sistem: Güvenli iletişim açık',
          mockMsg1: 'Merhaba, nasılsın? (örnek)',
          mockMsg2: 'Süreçte önce sohbet, sonra onay adımları (örnek)',
          mockHint: 'Not: İletişim bilgisi paylaşımı 48 saat + karşılıklı onay adımıyla açılır.',
        },
      },
    },
    actions: {
      loginExisting: 'Kayıtlı profilin varsa giriş yap',
      package: 'Paket',
      packageEco: 'Eko',
      packageStandard: 'Standart',
      packagePro: 'Pro',
      perMonth: 'aylık abonelik',
      badgeValue: 'En iyi fiyat/performans',
      badgePopular: 'Popüler',
      badgePro: 'Üst seviye',
      descEco: 'Temel erişim ve orta seviye çeviri.',
      descStandard: 'Daha fazla aday ve sponsorlu çeviri.',
      descPro: 'Maksimum aday ve yüksek çeviri hakkı.',
      featureMaxCandidates: 'Panelinde en fazla {{count}} aday',
      featureTranslateMonthly: 'Aylık {{count}} çevrilen mesaj',
      sponsoredIfOther: 'Karşı taraf Standard/Pro ise sponsorlu olabilir',
      sponsorsOthers: 'Karşı taraf için sponsorlu çeviri (ücret size yansır)',
      feature48hLock: 'İletişim paylaşımı: 48 saat sohbet sonrası onay',
      translationCostEstimate: 'Tahmini çeviri API maliyeti: ~ ${{amount}} / ay',
      packageHelp: 'Fiyat ve yetkiler seçilen pakete göre uygulanır.',
      apply: 'Ücretsiz Kayıt Ol',
      goPanel: 'Profilim',
      tour: 'Paneli tanıt',
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
      progress: {
        title: 'İlerleme',
        steps: {
          proposed: 'Tanışma',
          mutualAccepted: 'Karşılıklı onay',
          confirm48h: '48 saat onayı',
          contact: 'İletişim',
        },
        remaining: 'Kalan: {{h}}s {{m}}dk',
      },
      steps: [
        { title: 'Kayıt ol ve profilini oluştur', desc: 'Kayıt sonrası formu doldurarak profilini oluşturursun.' },
        { title: 'Panelinde uygun profilleri gör', desc: 'Sistem en uygun profilleri panelinde listeler (kısıtlı ön izleme).' },
        { title: 'Beğen / geç', desc: 'İlgilendiğin profili beğen; karşılıklı olunca ilk adım tamamlanır.' },
        { title: '48 saat site içi sohbet', desc: 'Karşılıklı kabul sonrası ilk 48 saat sadece site içi sohbetle güvenli tanışma.' },
        { title: 'İletişim paylaşımı iste', desc: '48 saat sonunda iletişim isteği gönderirsin; karşı taraf onaylarsa numaralar görünür.' },
      ],
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

  panel: {
    membership: {
      title: 'Üyelik şartları',
      lead: 'Üyelik şartları:',
      freeActiveTermsTitle: 'Ücretsiz aktivasyon şartları',
    },
  },

  meta: {
    baseTitle: 'Uniqah | Türkiye–Endonezya Evlilik Rehberliği',
    baseDescription:
      'Uniqah, Türkiye–Endonezya evlilik sürecinde adım adım rehberlik sunar: evrak kontrolü, resmî süreç zamanlaması, tercüme/iletişim ve sahada koordinasyon.',
    pages: {
      home: { title: 'Uniqah | Türkiye–Endonezya Evlilik Rehberliği' },
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
        title: "Türkiye–Endonezya Evlilik Rehberliği",
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
      previewProfile: {
        title: 'Profilim ekranını tutorial olarak önizle',
        body:
          'Başvuru göndermeden önce Profilim ekranını nasıl kullanacağını kısaca gör. Önizleme yeni sekmede açılır.',
        open: 'Profilim önizlemesini aç',
      },
      preSubmitTour: {
        title: 'Göndermeden önce Profilim ekranını görelim',
        body:
          'Başvuruyu gönderdikten sonra eşleşmelerini “Profilim” ekranından yöneteceksin. Göndermeden önce bu ekranı kısa bir tutorial ile tanıtalım. (Yeni sekmede açılır; bu form kapanmaz.)',
        open: 'Profilim ekranını aç (yeni sekme)',
        continue: 'Devam et ve başvuruyu gönder',
        later: 'Şimdi değil',
      },
      applicationIdLabel: 'Başvuru ID',
      deferCta: 'Daha sonra doldur',
      deferError: 'Şu an yönlendirme yapılamadı. Lütfen tekrar deneyin.',
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
        oneTimeWarning:
          'Uyarı: Profil bilgilerini düzeltme hakkı sadece 1 defaya mahsustur. Lütfen göndermeden önce bilgilerin doğru ve eksiksiz olduğundan emin olun.',
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
        'İletişim bilgileriniz (WhatsApp/e-posta) gizlidir. Form doldururken ve uygulamada herkese açık şekilde gösterilmez.',
      contactNumberNote: 'İletişim numaranız kimseyle paylaşılmaz; sadece sistem doğrulamanız için gereklidir.',
      inviteCodeHelp:
        'Sizi bir arkadaşınız davet ettiyse davet kodunuzu bu alana ekleyip ücretsiz üyelikten faydalanabilirsiniz. Davet kodunuz yoksa bu alanı boş bırakabilirsiniz.',
      confirmGender: {
        title: 'Cinsiyet onayı',
        text: 'Kendi cinsiyetinizi "{{gender}}" olarak seçtiniz. Onaylıyor musunuz?',
        cancel: 'Vazgeç',
        confirm: 'Onayla',
      },
      labels: {
        username: 'Kullanıcı adı',
        fullName: 'Ad Soyad',
        inviteCode: 'Davet kodu (opsiyonel)',
        age: 'Yaş',
        city: 'Şehir',
        country: 'Yaşadığınız ülke',
        whatsapp: 'İletişim numarası',
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
        familyObstacle: 'Ailesel olarak uluslararası bir evliliğe engel var mı?',
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
        inviteCode: 'Örn: 1234',
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
          widowed: 'Eşi vefat etmiş',
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
          years_one: '{{count}} yıl',
          years_other: '{{count}} yıl',
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
        privacy:
          '<privacyLink>Gizlilik Politikası</privacyLink>’nı ve <kvkkLink>KVKK Aydınlatma Metni</kvkkLink>’ni okudum; verilerimin değerlendirme/iletişim amacıyla işlenmesini kabul ediyorum.',
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
        alreadySubmitted: 'Zaten bir evlilik başvurunuz var. Profilim sayfanızdan bilgilerinizi güncelleyebilirsiniz.',
        profileTextWriteOnceUsed: 'Profil metinleri Profilim sayfasından güncellenebilir.',
        profileTextPII: '“Hakkımda” ve “Aradığım kişi” alanlarına iletişim bilgisi (telefon, e-posta, link, Instagram, IBAN vb.) yazmayın.',
        consentsRequired: 'Başvuru için onay kutularını ({{minAge}}+, Gizlilik Politikası, Kullanım Sözleşmesi, Fotoğraf paylaşımı) işaretlemeniz gerekir.',
        permissionDenied: 'Başvuru gönderilemedi (izin hatası). Lütfen doğru hesapla giriş yapın veya Firestore kurallarını kontrol edin.',
        editOnceUsed:
          'Profil bilgileri sadece 1 defaya mahsus güncellenebilir. Düzenleme hakkınız kalmadığı için isteğiniz başarısız oldu.',
        honeypotTriggered: 'Form gönderilemedi. Tarayıcı otomatik doldurma (autofill) gizli alanı doldurmuş olabilir. Lütfen sayfayı yenileyin ve otomatik doldurmayı kapatıp tekrar deneyin.',
        photoUploadFailed: 'Fotoğraf yüklenemedi. Bu projede Cloudinary yükleme varsayılan olarak SIGNED (imzalı) çalışır. Bu yüzden genelde sebep: `/api/cloudinary-signature` çalışmıyor veya server env eksik. Çözüm: Lokal geliştirmede `npm run dev` çalıştırın (API + Web birlikte) ve `.env.local` içinde `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` tanımlı olsun. (Unsigned preset ancak özellikle açarsanız kullanılır.)',
        username: 'Lütfen kullanıcı adı belirleyin.',
        usernameTaken: 'Bu kullanıcı adı kullanımda. Lütfen başka bir kullanıcı adı seçin.',
        fullName: 'Lütfen ad soyad girin.',
        inviteCodeInvalid: 'Davet kodu 4 haneli olmalı (örnek: 1234).',
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
      },
    },
    bottomNote:
      'Not: Bu form evlilik amaçlı eşleştirme başvurusudur; profiller site içinde kamuya açık olarak listelenmez.',
  },

  weddingPage: {
    publicNote: {
      p1: 'Not: Bu sayfa evlilik planı yapan çiftlerin evlilik prosedürlerine yardımcı olmak amacıyla hazırlanmıştır. Eğer bir eş adayınız yoksa',
      link: 'Eş adayı sayfamızı',
      p2: ' ziyaret edin.',
    },
    hero: {
      badge: 'Evlilik süreci için rehberlik',
      title: 'Türkiye–Endonezya Evlilik Rehberliği',
      description:
        'Türk ve Endonezyalı çiftler için; evraklar, resmî işlemler, aileler arası iletişim, tercüme ve saha koordinasyon adımlarını netleştirerek süreci güven veren bir yolculuğa dönüştürüyoruz.',
      actions: {
        openForm: "Evlilik Planı Formunu Aç",
        matchmakingApply: 'Eşleştirme Başvurusu',
        matchmakingHub: 'Eş adayı bul',
        matchmakingHint: 'Henüz bir eş adayınız yok mu? Eşleştirme sistemine kayıt olup eş adaylarını buradan bulabilirsiniz.',
        quickChat: "WhatsApp ile Hızlı Görüşme",
        enableNotifications: 'Bildirimleri aç',
        notificationTitle: 'Bildirimler açık',
        notificationBody: 'Yeni eşleşmeler ve güncellemeler için bildirim gönderebiliriz.',
        notificationsDenied: 'Bildirim izni reddedildi.',
        notificationsEnabled: 'Bildirimler açıldı.',
        notificationsNotSupported: 'Bu tarayıcı bildirimleri desteklemiyor.',
      },
    },
    whatsapp: {
      quickChatMessage: 'Merhaba, evlilik hazırlıkları hakkında bilgi almak istiyorum.',
    },
    stickyBackToProfile: {
      label: 'Profilime dön',
      aria: 'Profil sayfasına dön',
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
            'Varış ülkesinde/şehirde ulaşım organizasyonu',
            "Otel ve konaklama planlaması",
          ],
        },
        {
          title: 'Sürekli Rehberlik',
          items: [
            "Nikâh tamamlanana kadar kesintisiz rehberlik",
            'Ülkeye göre değişen resmî başvuru adımlarında yönlendirme',
            'Gerekli durumlarda konsolosluk/kurum süreçlerinde bilgilendirme',
          ],
        },
      ],
      flexibleTitle: "Esnek Hizmet Anlayışı",
      flexibleP1:
        "Tüm hizmetlerimizden A'dan Z'ye faydalanabileceğiniz gibi, yalnızca ihtiyaç duyduğunuz alanlarda destek talep edebilirsiniz.",
      flexibleP2:
        "YouTube sayfamızdaki videoları izleyerek süreci, bizi ve çalışma şeklimizi daha yakından tanıyabilirsiniz.",
      flexibleNote:
        'Aşağıdan "Evlilik Planı" formunu doldurabilir ya da "Evlilik Belgeleri" sekmesinden gerekli evrakları detaylı inceleyebilirsiniz.',
    },
    process: {
      title: 'Süreç Nasıl İşler?',
      subtitle: 'Aşağıdaki adımlar genel yol haritasıdır; detaylar duruma ve resmî kurumlara göre değişebilir.',
    },
    steps: [
      {
        title: 'İlk adım: Planlama formu',
        description:
          'Sizi tanımamız ve süreci en iyi şekilde planlamamız için Planlama bölümündeki 15 soruluk formu doldurup bize göndermeniz gerekiyor. Bu aşama tamamen ücretsizdir ve sadece birkaç dakikanızı ayırmanız yeterli olacaktır.',
      },
      {
        title: 'Birlikte plan yapıyoruz',
        description:
          'Gönderdiğiniz formu inceledikten sonra size dönüş yapıyoruz ve birlikte süreç hakkında net bir plan hazırlıyoruz.',
      },
      {
        title: 'Anlaşma ve rehberlik anlaşması',
        description:
          'Rehberlik hizmetimizi almayı onayladıktan sonra hesaplanan toplam bütçenin %40’lık kısmının ödemesini yapıyorsunuz. Karşılıklı güven açısından kalan %60’lık kısmı Endonezya’ya geldikten sonra alıyoruz.',
      },
      {
        title: 'Nikâh işlemleri süreci',
        description:
          'Gerekli evrakları birlikte hazırlıyoruz ve nikâh işlemlerini başlatıyoruz. Tüm işlem takibini biz gerçekleştiriyoruz.',
      },
      {
        title: 'Endonezya süreci',
        description:
          'Uçak bileti, otel rezervasyonu ve ulaşım planlamasını yapıyoruz. Nikâh işlemleri boyunca eş adayınız ve ailesiyle iletişiminizde yanınızda olur, tercümanlık yapar ve nikâh tamamlanana kadar size eşlik ederiz.',
      },
      {
        title: 'Nikâh sonrası işlemler',
        description:
          'Nikâhtan sonra evliliğin resmî makamlar tarafından onaylanmasını sağlıyoruz. Türkiye’de yaşanacaksa eş adayı için vize işlemlerini; Endonezya’da yaşanacaksa oturum işlemlerini yürütüyoruz. Talep edilirse Endonezya’da balayı tatilinizi de organize ediyoruz.',
      },
      {
        title: 'Rehberlik hizmetinin tamamlanması',
        description:
          'Tüm işlemlerin eksiksiz tamamlandığından emin olduktan sonra süreci tamamlamış oluyoruz; en kolay yoldan en iyi şekilde evlenerek evliliğinize mutlu bir başlangıç yapmanızı sağlamış oluyoruz.',
      },
    ],
    images: {
      prepAlt: 'Evlilik hazırlığı detayı',
      ceremonyAlt: 'Evlilik töreni',
    },
    tabs: {
      plan: "Evlilik Planı",
      documents: 'Evlilik Belgeleri',
    },
    mobileTabs: {
      documents: 'Belgeler',
      process: 'Süreç',
      guidance: 'Rehberlik',
      planning: 'Planlama',
    },
    mobileDocuments: {
      question: {
        title: 'Nikâh nerede gerçekleşecek?',
        hint: 'Belgeler, nikâhın kıyılacağı ülkeye göre değişir.',
        options: {
          indonesia: 'Endonezya’da',
          turkiye: 'Türkiye’de',
        },
      },
      trRequirements: {
        title: 'Türkiye’de resmî nikâh için gerekli belgeler',
        note:
          'Not: Belgeler; şehir, kurum ve güncel mevzuata göre değişebilir. Bu listeyi birlikte netleştirip en güncel kontrol listesini çıkarabiliriz.',
        steps: [
          {
            title: '🇮🇩 1️⃣ Ankara Endonezya Büyükelçiliği: Evlenme izin belgesi',
            intro: '(Bekârlık ve evlenmeye engel yoktur yazısı)',
            items: [
              '👩 Endonezya vatandaşı için gerekli belgeler',
              'Pasaport (aslı + fotokopi)',
              'KTP (Endonezya kimlik kartı) fotokopi',
              'Aile kartı (Kartu Keluarga)',
              'Doğum belgesi',
              'Bekâr olduğunu gösteren belge',
              'Endonezya’daki yerel makamdan evlenme uygunluk yazısı (N1/N4 eşdeğeri)',
              '2–4 adet fotoğraf',
              'Varsa boşanma kararı veya eşin ölüm belgesi',
              '👨 Türk vatandaşı erkekten istenen belgeler',
              'Kimlik kartı fotokopisi',
              'Nüfus kayıt örneği',
              'İkamet belgesi',
              'Bekâr olduğunu gösterir belge',
              '2 adet fotoğraf',
              'Gelir belgesi',
            ],
            notes: [
              '📌 Büyükelçilik bu ayarlardan sonra Evlenme İzin Yazısı / Certificate of No Impediment düzenler.',
              '📌 Bazı durumlarda kadının Endonezya’daki ailesinden izin yazısı istenebilir.',
              '📌 Türk vatandaşından istenen belgelerin Türkçe çevirisi noter onaylı olmalı; bazı belgeler Dışişleri Bakanlığı’ndan onaylanmalıdır.',
            ],
          },
          {
            title: '🇹🇷 2️⃣ Türkiye’de resmî nikâh için belediyeye verilecek belgeler',
            intro: 'Nikâh başvurusu yapılacak kurum: Belediye Evlendirme Dairesi',
            items: [
              '👩 Endonezya vatandaşı için gerekli belgeler',
              'Pasaport + noter onaylı Türkçe tercümesi',
              'Doğum belgesi (Türkçe tercümeli ve apostilli)',
              'Endonezya Büyükelçiliğinden evlenme izin belgesi',
              'Bekârlık belgesi',
              'Sağlık raporu (Türkiye’de alınır)',
              '4–6 adet biyometrik fotoğraf',
              'İkamet adres beyanı',
              '👨 Türk vatandaşı erkek için gerekli belgeler',
              'Nüfus cüzdanı / T.C. kimlik kartı',
              'Nüfus kayıt örneği',
              'İkametgâh belgesi',
              'Sağlık raporu',
              '4–6 adet fotoğraf',
            ],
            notes: [
              '📌 Türkiye’de nikâh başvurusu sırasında önemli şartlar',
              '✔ Yabancı belgeler apostilli olmalı',
              '✔ Türkçe tercümesi noter onaylı olmalı',
              '✔ İsim yazımları belgelerde birebir aynı olmalı',
              '✔ Bekârlık belgesi zorunludur',
              '✔ Sağlık raporu Türkiye’de aile hekiminden alınır',
              '⏱ Ortalama süre',
              'Büyükelçilik izin yazısı: 1–5 gün',
              'Belge tercüme & noter: 1–3 gün',
              'Nikâh randevusu: şehir yoğunluğuna göre 1–14 gün',
              '⚠️ Süreci zorlaştıran yaygın hatalar',
              '❌ Apostil yapılmaması',
              '❌ İsimlerin farklı yazılması',
              '❌ Bekârlık belgesinin eksik olması',
              '❌ Belgelerin eski tarihli olması',
              '❌ Yeminli tercüme kullanılmaması',
            ],
          },
        ],
        action: 'WhatsApp’tan güncel kontrol listesini sor',
        whatsappMessage:
          'Merhaba, Türkiye’de resmî nikâh (TR vatandaşı + Endonezya vatandaşı) için güncel belge listesini ve başvuru adımlarını paylaşabilir misiniz? Nikâh il/ilçesi: …',
      },
      trPlaceholder: {
        title: 'Türkiye’de nikâh için belge listesi',
        note:
          'Resmî belge listesi; şehir, konsolosluk/valilik uygulaması ve güncel mevzuata göre değişebilir. Bu kısmı doğrulanmış resmî kaynaklara göre birlikte netleştirelim.',
        action: 'WhatsApp’tan belge listesini sor',
        whatsappMessage:
          'Merhaba, Türkiye’de nikâh için (TR vatandaşı + Endonezya vatandaşı) istenen güncel belgeleri ve kaynak linklerini paylaşabilir misiniz?',
      },
    },
    plan: {
      title: "Evlilik Planınızı Bize İletin",
      subtitle:
        "Aşağıdaki alanları doldurun; size en kısa sürede, durumunuza özel bir dönüş yapalım.",
      successTitle: "Talebiniz başarıyla gönderildi!",
      successText:
        "Formu doldurduğunuz için teşekkür ederiz. 24 saat içinde size geri dönüş yapacağız.",
      why: {
        title: 'Neden planlama gerekli?',
        text:
          'Farklı ülkelerden evliliklerde en büyük problem, süreci doğru yönetememektir. Yapılacak bir harf hatası dahi; gerek maddi anlamda, gerekse zaman kaybı anlamında büyük zararlara sebep olabilir. Bu yüzden sürecinizin en baştan doğru planlanması birinci şarttır. Rehberlik hizmetimiz, sizin için bunu en kolay ve doğru yoldan planlamanızı ve evlilik sürecini sıkıntısız tamamlamanızı sağlar. Tüm süreci sizin için doğru planlamamız, vereceğiniz bilgilere bağlıdır. Bu sebeple sizler için hazırladığımız 15 soruluk formu birkaç dakikanızı ayırarak doldurmanız, her açıdan faydanıza olacaktır.',
      },
      quiz: {
        introTitle: 'Adım Adım Evlilik Planı Testi',
        introText:
          "Bu form, hali hazırda evleneceğiniz bir eş adayınız varsa size evlilik prosedürlerinde rehberlik hizmeti vermemiz amacıyla doldurulur. Eğer bir eş adayınız yoksa lütfen ‘Eş adayı bul’ butonuna tıklayarak ya da eş adayı sayfamızı ziyaret ederek ücretsiz kayıt olun ve form doldurarak sistemimize kayıt olun.",
        introItems: [
          'Eş adayı sayfamızdaki eş adayı bulma sistemimiz yeni olduğu için hemen bir eş adayı bulamayabilirsiniz. Uygulamayı telefonunuza indirip bildirimleri açarak size uygun bir eş adayı olduğunda bildirim alabilirsiniz.',
        ],
        start: 'Planlamaya Başla',
        back: 'Geri',
        next: 'Devam',
        submit: 'WhatsApp ile Gönder',
        progress: 'Soru {{current}} / {{total}}',
        errors: {
          required: 'Lütfen bu soruyu yanıtlayın.',
        },
        options: {
          yes: 'Evet',
          no: 'Hayır',
          later: 'Daha sonra karar verecem',
          turkiye: 'Türkiye',
          indonesia: 'Endonezya',
          other: 'Diğer',
          employment: {
            worker: 'Özel sektör',
            civilServant: 'Memur',
            retired: 'Emekli',
            publicEmployee: 'Kamu çalışanı',
            businessOwner: 'İş sahibi',
            other: 'Diğer',
          },
          marital: {
            single: 'Bekâr',
            widowed: 'Eşi vefat etmiş',
            divorced: 'Boşanmış',
            divorceInProgress: 'Boşanma süreci devam ediyor',
          },
          partnerMarital: {
            single: 'Bekâr',
            widowed: 'Eşi vefat etmiş',
            divorced: 'Boşanmış',
          },
        },
        fields: {
          employmentStatus: 'Çalışma durumunuz',
          profession: 'Mesleğiniz',
          maritalStatus: 'Medeni durumunuz',
          hasChildren: 'Çocuğunuz var mı?',
          legalWhere: 'Resmî nikâh hangi ülkede olacak?',
          plannedLiveWhere: 'Evlilik sonrası nerede yaşamayı planlıyorsunuz?',
          nationality: 'Uyruğunuz',
          nationalityOther: 'Uyruğunuz (Diğer)',
          livingCountry: 'Hangi ülkede yaşıyorsunuz?',
          livingCountryOther: 'Yaşadığınız ülke (Diğer)',
          budget: 'Evlilik için ayırdığınız bütçe',
          indonesiaDuration: 'Endonezya’da tahmini kalış süreniz',
          weddingDate: 'Planlanan nikâh tarihi',
          partnerAge: 'Eş adayınızın yaşı',
          partnerCity: 'Eş adayınızın şehri',
          partnerMaritalStatus: 'Eş adayınızın medeni durumu',
          partnerHasChildren: 'Eş adayınızın çocuğu var mı?',
          partnerChildrenCount: 'Kaç çocuğu var?',
          partnerChildrenLiveWithUs: 'Çocuk(lar) sizinle yaşayacak mı?',
        },
        placeholders: {
          profession: 'Örn: Mühendis, öğretmen, esnaf…',
          budget: 'Örn: 100.000 TL',
          indonesiaDuration: 'Örn: 5 gün / 15 gün / 1 ay',
          weddingDate: 'Örn: 2026-06-15',
          partnerAge: 'Örn: 28',
          partnerCity: 'Örn: Jakarta / İstanbul',
          partnerChildrenCount: 'Örn: 1',
          nationalityOther: 'Örn: Alman, Hollandalı…',
          livingCountryOther: 'Örn: Almanya, Hollanda…',
        },
        steps: {
          personal: {
            title: 'Sizi Tanıyalım',
            desc: 'Kısaca temel bilgilerinizi alalım.',
          },
          nationality: {
            title: 'Uyruk',
            desc: 'Uyruğunuzu seçin.',
          },
          livingCountry: {
            title: 'Yaşadığınız Ülke',
            desc: 'Şu anda hangi ülkede yaşıyorsunuz?',
          },
          employment: {
            title: 'İş Durumu',
            desc: 'Çalışma durumunuzu seçin.',
          },
          profession: {
            title: 'Meslek',
            desc: 'Mesleğinizi yazın.',
          },
          marital: {
            title: 'Medeni Durum',
            desc: 'Medeni durumunuzu seçin.',
          },
          children: {
            title: 'Çocuk Durumu',
            desc: 'Çocuğunuz var mı?',
          },
          legalWhere: {
            title: 'Resmî İşlemler',
            desc: 'Resmî nikâh hangi ülkede olacak?',
          },
          plannedLiveWhere: {
            title: 'Yaşam Planı',
            desc: 'Evlilik sonrası yaşamayı planladığınız ülkeyi seçin.',
          },
          budget: {
            title: 'Bütçe',
            desc: 'Planlamayı doğru yapmak için bütçenizi yazın.',
          },
          indonesiaDuration: {
            title: 'Endonezya Süresi',
            desc: 'Endonezya’da süreç için ne kadar kalmayı planlıyorsunuz?',
          },
          weddingDate: {
            title: 'Nikâh Tarihi',
            desc: 'Tahmini nikâh tarihini yazın (bilmiyorsanız yaklaşık).',
          },
          partnerAge: {
            title: 'Eş Adayı Yaş',
            desc: 'Eş adayınızın yaşını yazın.',
          },
          partnerCity: {
            title: 'Eş Adayı Şehir',
            desc: 'Eş adayınızın şehrini yazın.',
          },
          partnerMarital: {
            title: 'Eş Adayı Medeni Durum',
            desc: 'Eş adayınızın medeni durumunu seçin.',
          },
          partnerChildren: {
            title: 'Eş Adayı Çocuk',
            desc: 'Bazı durumlarda bu bilgi evrak ve süreç planını etkiler.',
          },
          services: {
            title: 'Hizmet İhtiyacı',
            desc: 'İhtiyaç duyduğunuz hizmetleri seçin (birden fazla seçebilirsiniz).',
          },
          honeymoon: {
            title: 'Balayı',
            desc: 'Nikâh sonrası balayı tatili düşünür müsünüz?',
          },
        },
        whatsapp: {
          intro: 'Merhaba, evlilik planı testimi gönderiyorum:',
          none: 'Seçim yapılmadı',
          labels: {
            name: 'Ad Soyad',
            age: 'Yaş',
            city: 'Şehir',
            phone: 'Telefon',
            nationality: 'Uyruk',
            livingCountry: 'Yaşadığı ülke',
            employment: 'İş durumu',
            profession: 'Meslek',
            maritalStatus: 'Medeni durum',
            hasChildren: 'Çocuk',
            legalWhere: 'Resmî nikâh ülkesi',
            plannedLiveWhere: 'Yaşam planı',
            budget: 'Bütçe',
            indonesiaDuration: 'Endonezya süresi',
            weddingDate: 'Nikâh tarihi',
            partnerAge: 'Eş adayı yaşı',
            partnerCity: 'Eş adayı şehri',
            partnerMaritalStatus: 'Eş adayı medeni durumu',
            partnerHasChildren: 'Eş adayının çocuğu var mı',
            partnerChildrenCount: 'Çocuk sayısı',
            partnerChildrenLiveWithUs: 'Çocuk(lar) sizinle yaşayacak mı',
            services: 'İstediğim hizmetler',
            honeymoon: 'Balayı',
          },
        },
      },
      form: {
        sections: {
          basicInfo: {
            title: "1. Temel Bilgileriniz",
            labels: {
              name: "Ad Soyad",
              phone: "İletişim Numarası",
              city: "Şehir",
              age: "Yaş",
              budget: 'Evlilik için ayırdığınız bütçe',
            },
            placeholders: {
              name: "Adınız ve soyadınız",
              phone: "+90 555 034 3852",
              city: "Yaşadığınız şehir",
              age: "Yaşınız",
              budget: 'Örn: 100.000 TL',
            },
            hints: {
              budget:
                'Bu alanda belirteceğiniz bütçe, nasıl bir evlilik planlamamız gerektiğini belirtecektir.',
            },
          },
          privacyNote: 'Gizlilik notu: Başvuru bilgileri eşleştirme ve güvenlik amacıyla işlenir; profiliniz kamuya açık listelenmez. Kurallara aykırı durumlarda destek hattına delil (ekran görüntüsü vb.) ile başvurabilirsiniz.',
        },
        services: {
          title: "2. İhtiyaç Duyduğunuz Hizmetler",
          hint:
            "Birden fazla seçenek işaretleyebilirsiniz. Emin olmadığınız alanlar varsa boş bırakabilirsiniz.",
          options: {
            communicationInterpretation: 'Eş adayı ve/veya ailesiyle iletişim tercümanlığı',
            research: 'Araştırma',
            documentCollection: 'Evrak toplama',
            legalFollowUp: 'Nikâh işlemleri',
            flightTicket: 'Uçak bileti',
            accommodation: 'Konaklama',
            localTransport: 'Endonezya içi ulaşım',
            postMarriage: 'Nikâh sonrası işlemler',
            visaResidence: 'Vize / oturum',
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
      title: 'Evlilik İçin Gerekli Belgeler (Genel Liste)',
      subtitle:
        "Aşağıdaki başlıklar genel bilgilendirme içindir. Sizin durumunuz için net ve güncel listeyi birlikte kontrol ediyoruz.",
      disclaimer:
        'Not: Bu içerik genel bilgilendirme amaçlıdır; belge ve şartlar şehir/kurum uygulamalarına ve güncel mevzuata göre değişebilir. Başvuru öncesi ilgili kurumdan teyit edilmelidir.',
      foreignSpouse: {
        title: 'Türk Vatandaşı (Yabancı Eş) İçin Belgeler',
        intro: "Endonezya'da nikâh için Türk vatandaşı eşten istenebilen belgeler:",
        items: [
          'T.C. kimlik kartı',
          "Pasaport (Türkiye'ye dönüş tarihinde en az 6 ay geçerli)",
          'Doğum belgesi',
          'Bekârlık belgesi',
          'İkamet belgesi (bazı KUA ofisleri)',
          'Adli sicil kaydı (bazı KUA ofisleri)',
          'Sağlık raporu (bazı KUA ofisleri)',
          'Daha önce evlendiyse: boşanma mahkeme kararı veya önceki eşin ölüm raporu',
          'Son 6 ay içinde çekilmiş vesikalık fotoğraf',
          'Elçilikten alınacak evlilik izin belgesi',
        ],
      },
      indonesianSpouse: {
        title: 'Endonezya Vatandaşı İçin Belgeler',
        intro: "Endonezya'da nikâh için Endonezya vatandaşı eşten istenebilen belgeler:",
        items: [
          'KTP',
          'Aile kartı (KK)',
          'Ebeveyn bilgileri',
          'Doğum belgesi',
          'N1, N2, N4 formları',
          'RT/RW yazısı',
          'N3 formu',
          'Son 6 ay içinde çekilmiş vesikalık fotoğraf',
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
          '* Yabancı eş için istenen belgeler içinde hangilerinin çevirili olması gerektiği; bağlı bulunan KUA ofisine göre değişiklik gösterebilir.',
          '** Apostil yapılması gereken evraklar mutlaka apostil yaptırılmalıdır.',
          '*** Gerekli belgeler zaman içinde değişen yasalarla birlikte değişebilir; güncel belgeleri sorgulayın.',
          '**** Belgelerde eksiklik veya harf hataları nedeniyle başvurunuz reddedilebilir ve işlemlere en baştan başlamak zorunda kalabilirsiniz; zaman ve maddi zarardan kaçınmak için rehberlik desteği almanızı öneririz.',
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
          'Merhaba, evlilik süreci ve gerekli belgeler hakkında bilgi almak istiyorum.',
      },
    },
    faq: {
      items: [
        {
          q: 'Evlilik süreci ortalama ne kadar sürer?',
          a: "Belgelerinizin hazır olma durumuna, başvurduğunuz şehre ve kurum yoğunluğuna göre değişmekle birlikte, çoğu çift için sürecin planlama ve resmî işlemler bölümü birkaç hafta ile birkaç ay arasında tamamlanır.",
        },
        {
          q: 'Evlilik masrafları ne kadar tutar?',
          a: 'Masraf tamamen sizin bütçenize göre şekillenir. Kimseyi maddi imkânlarının üzerine zorlamıyoruz; ihtiyaçlarınıza ve bütçenize göre birlikte bir plan oluşturuyoruz.',
        },
        {
          q: 'Evlilik için önce hangi adımı atmalıyım?',
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
      description: 'Planlama formunu açıp birkaç dakikada doldurun; size dönüş yapıp birlikte net bir plan çıkaralım.',
      action: 'Planlama Formunu Aç',
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
    you: 'Sen',
    them: 'Karşı taraf',
    enlarge: 'Büyüt',
    time: {
      minutesShort: '{{minutes}} dk',
      hmShort: '{{h}}s {{m}}dk',
    },
    privacySecurity: {
      title: "Gizlilik & Güvenlik",
      text: "Bu sayfa Google Analytics ile izlenir. Verileriniz SSL/TLS şifreleme ile korunmaktadır.",
      policyLink: "Gizlilik Politikası",
    },
  },

  apply: {
    form: {
      options: {
        common: {
          yes: 'Evet',
          no: 'Hayır',
        },
      },
    },
  },

  myInfo: {
    fields: {
      about: 'Hakkımda',
      city: 'Şehir',
      education: 'Eğitim',
      gender: 'Cinsiyet',
      hasChildren: 'Çocuk',
      maritalStatus: 'Medeni durum',
      occupation: 'Meslek',
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
          "Gizlilik politikası hakkında sorularınız için bize <emailLink>{{email}}</emailLink> adresinden ulaşabilirsiniz.",
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
      explore: "Merhaba, bilgi almak istiyorum.",
      travel: "Merhaba, bilgi almak istiyorum.",
      wedding: 'Merhaba, evlilik süreci hakkında bilgi almak istiyorum.',
      youtube: "Merhaba, YouTube videolarınız hakkında bilgi almak istiyorum.",
      contact: "Merhaba, iletişim hakkında bilgi almak istiyorum.",
      tours: "Merhaba, bilgi almak istiyorum.",
      documents: "Merhaba, dokümanlar hakkında bilgi almak istiyorum.",
    },
  },

  home: {
    hero: {
      badgeCompany: 'PT MoonStar Global Indonesia',
      badgeSocial: "Uniqah sosyal hesapları",
      title: "Uniqah",
      subtitle: 'Türkiye–Endonezya • Evlilik rehberliği • Süreç desteği',
      description:
        'Uniqah; Türkiye–Endonezya evlilik sürecinde, iki tarafın da doğru bilgilendirilip adımları net görmesini sağlayan rehberlik sayfamızdır. Evraklar, resmî işlemler, tercüme/iletişim ve sahada koordinasyon konularında pratik bir yol haritası sunarız.',
      note: 'Evlilik odaklı, mahremiyet ve güvenlik öncelikli bir yapı.',
      freeNote: 'Uygulamayı kullanmak tamamen ücretsizdir.',
      ctaTours: "Başvuruyu başlat",
      ctaBrochures: "Dokümanları görüntüle",
      ctaTrust: "Güven & Yasal",
      ctaHow: "Nasıl çalışır?",
    },
    trust: {
      items: [
        {
          title: "Şeffaf süreç",
          description: "Ön kayıt → yazılı teklif → sözleşme/ödeme adımları net ilerler.",
        },
        {
          title: 'Hızlı destek',
          description: 'WhatsApp destekli; gerektiğinde çok dilli destek.',
        },
        {
          title: "Yasal yapı",
          description: 'Uniqah, PT MoonStar Global Indonesia tarafından yürütülen bir markadır.',
        },
      ],
    },
    services: {
      title: "Sizin için neler yapıyoruz?",
      cards: {
        joinTours: {
          title: 'Başvuru ve profil desteği',
          description: 'Başvuru, profil oluşturma ve süreç yönetimi için adım adım destek.',
        },
        groupTours: {
          title: 'Aile/komünite koordinasyonu',
          description: 'Gerektiğinde aile iletişimi ve koordinasyon için rehberlik.',
        },
        privateTravel: {
          title: 'Pratik rehberlik',
          description: 'İhtiyaç halinde sahada pratik rehberlik desteği.',
        },
        matchmaking: {
          title: "Uniqah eşleştirme",
          description:
            "Ciddi niyetli kullanıcılar için başvuru, uygunluk kontrolü, profil yönetimi, sohbet ve karar adımlarıyla düzenli bir eşleştirme deneyimi.",
        },
        communityContent: {
          title: "Topluluk içerikleri",
          aria: "Topluluk içerikleri",
          description:
            "Uniqah topluluğu için ilişki, iletişim ve süreç yönetimi odaklı içerikler ve rehberler paylaşırız.",
        },
        wedding: {
          title: "Endonezya’da evlilik rehberliği",
          description:
            "Evlilik sürecinizde belgeler, yasal işlemler, tercümanlık, ulaşım ve konaklama dahil adım adım ilerler; süreci daha sakin ve yönetilebilir hale getiririz.",
        },
        youtube: {
          title: "YouTube videoları",
          description:
            "Endonezya’daki hayat, kültür, seyahat ve evlilik sürecine dair videolarla bizi daha yakından tanıyabilir; yaklaşımımızı içeriklerimiz üzerinden görebilirsiniz.",
        },
        dameturk: {
          title: "DaMeTurk (alt marka)",
          aria: "DaMeTurk - Orijinal Türk dondurması",
          description:
            "PT MoonStar Global Indonesia bünyesinde, Endonezya’da DaMeTurk markamızla orijinal Türk dondurması üretim ve satış faaliyetini yürütüyoruz. Detaylar için dameturk.com.",
        },
      },
    },

    howItWorks: {
      title: "Nasıl ilerliyoruz?",
      steps: [
        {
          title: "1) İhtiyaç & hedef",
          description: "Türkiye–Endonezya evlilik planınızı ve durumunuzu netleştiriyoruz.",
        },
        {
          title: "2) Evrak & resmî adımlar",
          description: "Gerekli evrakların kontrolü ve resmî süreç adımlarını planlıyoruz.",
        },
        {
          title: "3) Koordinasyon & tamamlama",
          description: "Ulaşım/konaklama, tercüme ve sahada koordinasyonla süreci adım adım tamamlıyoruz.",
        },
      ],
      ctaTours: "Uniqah’a git",
      ctaDocuments: "Dokümanlar",
    },

    features: {
      title: "Neden bizimle ilerlemek daha kolay?",
      items: [
        {
          title: "Güvenlik ve süreç disiplini",
          description:
            "Uniqah’ta amaç rastgele tanıştırmak değil; güvenli ve saygılı bir ortamda, adım adım ilerleyen bir süreç kurmaktır.",
        },
        {
          title: "Şeffaf ve anlaşılır iletişim",
          description:
            "Türkçe ve Endonezce iletişim desteğiyle, iki tarafın da kendini doğru ifade etmesine yardımcı oluruz.",
        },
        {
          title: "Sahada gerçek destek",
          description:
            "Gerek eşleştirme sürecinde, gerek Endonezya’da evlilik/seyahat planlarında ihtiyaç duyulduğunda sahada çözüm üreten destek sunarız.",
        },
      ],
    },

    faq: {
      title: 'Kısa Sorular (FAQ)',
      items: [
        {
          q: 'Başvuru ücretsiz mi?',
          a: 'Başvuruyu başlatıp temel bilgileri girmek ücretsizdir. Süreç ilerledikçe (doğrulama/üyelik/özel destek) adımlara göre ücretlendirme ve bilgilendirme yapılır.',
        },
        {
          q: 'Güvenlik nasıl sağlanıyor?',
          a: 'Amaç rastgele tanıştırmak değil; kurallar, uygunluk kontrolü ve adım adım süreçle daha güvenli ve saygılı bir tanışma ortamı kurmaktır.',
        },
        {
          q: 'Süreç ne kadar sürer?',
          a: 'Kişiden kişiye değişir. Profilin netliği, doğrulama ve karşılıklı karar hızına göre birkaç gün ile birkaç hafta arasında değişebilir.',
        },
      ],
    },

    cta: {
      open: 'Mesaj',
      eyebrow: "Sorularınızı çekinmeden sorun",
      title: 'Uniqah ve süreçlerle ilgili her şeyi birlikte netleştirelim',
      description:
        'Eşleştirme süreci, evlilik rehberliği veya seyahat/balayı planı… Aklınıza takılan her şeyi sorabilirsiniz. Süreci birlikte sade ve anlaşılır hale getirelim.',
      ctaTryFree: "Ücretsiz dene",
      ctaWeddingGuidance: 'Evlilik rehberliğini aç',
      ctaMatchmaking: 'Eş adayı bul',
      matchmakingHint: 'Henüz bir eş adayınız yok mu? O halde eşleştirme sistemimize kayıt olun ve eş adaylarını Profilim sayfanızdan takip edin.',
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
        '{{company}} bünyesinde yürütülen bir markadır. Sözleşme tarafı ve tahsilat süreçleri bu tüzel kişi üzerinden yürütülür.',
      documents: 'Dokümanlar & Sözleşmeler',
      brochures: 'Dokümanlar (PDF)',
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
        'Sosyal içeriklerimizi Uniqah üzerinden paylaşırız.',
    },
    contact: {
      title: 'İletişim ve adres',
      trLabel: 'WhatsApp',
      idLabel: 'Alternatif',
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
          body: 'Hizmet sözleşmeleri ve mesafeli satış süreçlerinde tüzel kişi olarak {{company}} yer alır.',
        },
      },
    },
    documents: {
      title: 'Doküman merkezi',
      body: 'Tüm güncel dokümanlar, sözleşmeler ve politikalar burada.',
      cta: 'Dokümanları aç',
      brochureNote: 'Ek dokümanlar:',
      brochureLink: 'Dokümanlar',
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
          a: '{{brand}}, {{company}} bünyesinde yürütülen bir markadır. Sözleşme ve tahsilat süreçleri bu tüzel kişi üzerinden yürütülür.',
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
    partnerAgeMin: 'Min yaş',
    partnerAgeMax: 'Max yaş',
  },

  about: {
    hero: {
      title: "Hakkımızda",
      subtitle:
        "Uniqah, Endonezya odaklı evlilik ve eşleştirme sistemimizdir. Amacımız; güvenli, saygılı ve şeffaf bir süreçle doğru insanları bir araya getirmek ve gerektiğinde sahada (çeviri, lojistik, resmi süreçler) gerçek destek sunmaktır.",
    },
    brand: {
      title: "MoonStar Global Indonesia çatısı altında",
      p1:
        "Bu web sitesi, PT MoonStar Global Indonesia bünyesinde yürüttüğümüz Uniqah hizmetinin vitrini ve iletişim noktasıdır.",
      p2:
        "MoonStar Global Indonesia, Endonezya’da yaşayan bir Türk girişimci tarafından; iki kültür arasında güvenli iletişim kurmak, evlilik süreçlerini doğru yönetmek ve Endonezya’ya gelen misafirlere sahada çözüm üretmek amacıyla kurulmuştur.",
      cards: {
        communityContentTitle: "Topluluk içerikleri",
        communityContentDesc:
          "İlişki, iletişim ve süreç yönetimi odağında içerikler ve rehberler.",
        toursTitle: "Evlilik rehberliği",
        toursDesc: "Resmi adımlar, tercüme ve süreç koordinasyonu konusunda destek.",
        weddingTitle: "Uniqah – Eşleştirme",
        weddingDesc: "Ciddi niyetli kullanıcılar için güvenlik adımları, profil yönetimi, sohbet ve karar süreci.",
        dameturkTitle: "Türkiye–Endonezya evlilik rehberliği",
        dameturkDesc:
          "Türk ve Endonezyalı çiftler için; evrak listesi, resmi süreç adımları, tercüme/iletişim desteği ve saha koordinasyonu gibi konularda adım adım rehberlik sunuyoruz.",
      },
      socialNote:
        "Uniqah topluluğunu içerikler ve rehberlerle destekliyoruz.",
    },
    philosophy: {
      title: "Eşleştirmeyi Nasıl Görüyoruz?",
      intro:
        "Bizim için evlilik, yalnızca tanışmak değil; karşılıklı saygı, uyum ve güvenle yürüyen bir yolculuktur. Uniqah’ı bu bakış açısıyla kurduk: süreci şeffaflaştıran, güvenliği önceleyen ve iki kültür arasında doğru iletişimi mümkün kılan bir sistem.",
      sections: {
        direct: {
          title: "Sistem + saha: gerçek doğrulama ve sorumluluk",
          p1:
            "Uniqah, sadece bir ilan panosu değildir. Profil, fotoğraf ve süreç adımları; kötüye kullanımı azaltacak şekilde tasarlanır. Gerektiğinde manuel inceleme ve destekle sürecin sorumluluğunu üstleniriz.",
          p2:
            "Hedefimiz; ciddi niyetli kullanıcıların kendini güvende hissettiği, saygılı bir ortamda doğru kişiyle tanışabildiği bir deneyim sunmaktır.",
        },
        planning: {
          title: "Adım adım, uyum odaklı süreç",
          p1:
            "Tanışmayı rastlantıya bırakmıyoruz. Başvuru, uygunluk kontrolü, profil oluşturma, eşleştirme ve sohbet adımlarını kademeli bir süreç olarak ele alıyoruz. Böylece hem beklentiler netleşir hem de karar daha sağlıklı verilir.",
          bullets: [
            "Başvuru ve uygunluk kontrolü (yaş/kurallar).",
            "Profil oluşturma ve fotoğraf doğrulama.",
            "Eşleştirme, sohbet ve karşılıklı karar.",
            "Gerekirse tercüme ve kültürel iletişim rehberliği.",
          ],
          p2: "Bu sayede süreç hem insani hem de ölçülebilir kalır.",
        },
        transparency: {
          title: "Şeffaflık ve gizlilik",
          p1:
            "Süreç adımları, kurallar ve beklentiler baştan net olmalıdır. Aynı zamanda gizlilik, sistemin temelidir: kişisel veriler ve iletişim akışı kontrollü bir şekilde yönetilir; kullanıcılar ihtiyaç duyduğunda destek ve raporlama kanallarına erişebilir.",
        },
        comfort: {
          title: "Saygılı iletişim ve sınırlar",
          p1:
            "Karşılıklı saygı, nezaket ve sınırların korunması bizim için vazgeçilmezdir. Uniqah topluluğunda iletişim kalitesini artıran kurallar ve güvenlik mekanizmaları bulunur.",
          p2:
            "Şikâyet/kanıt iletimi, engelleme ve destek süreçleriyle; olumsuz deneyimlerin tekrarlanmasını önlemeyi hedefleriz.",
        },
        guidance: {
          title: "İki kültür arasında köprü",
          p1:
            "Türkçe ve Endonezce iletişim, kültürel farklılıklar ve beklentiler doğru yönetilmediğinde süreçler zorlaşabilir. Biz; tercüme, iletişim desteği ve rehberlikle iki tarafın da kendini doğru ifade etmesine yardımcı oluruz.",
        },
        wedding: {
          title: "Endonezya’da evlilik rehberliği",
          p1:
            "Eşleştirme sürecinin yanında, Endonezya’da evlilik planlayan çiftlere resmi adımların zamanlaması, yerel uygulamalar ve süreç koordinasyonu konusunda rehberlik sunuyoruz.",
          p2:
            "Evrak, randevu, tercüme, konaklama-ulaşım ve tören planlaması gibi detaylarda; sahada çözüm üreten bir ekip olarak sorumluluk alırız.",
        },
        expectation: {
          title: "Net beklenti, gerçekçi zamanlama",
          p1:
            "Uniqah’ta süreç adımları, kurallar ve olası süreler açıkça konuşulur. Böylece kullanıcı; ne bekleyeceğini bilir, kararını aceleye getirmeden ilerler.",
        },
      },
      outro:
        "Uniqah eşleştirme sistemi ve Endonezya’da evlilik rehberliği hakkında daha fazla bilgi için <1>Uniqah</1> ve <3>Evlilik</3> sayfalarına göz atabilir; resmi metinler için <5>Dokümanlar</5> bölümünü kullanabilirsiniz.",
    },
    story: {
      title: "Kısa hikâyemiz",
      steps: [
        "Endonezya’ya yerleşip kendi hayatımızı ve düzenimizi burada kurduk.",
        "İki kültür arasında iletişimi güçlendiren bir topluluk ve saha ağı oluşturduk.",
        "Topluluk için içerikler üreterek süreçleri daha anlaşılır hale getirmeye başladık.",
        "Bugün; Uniqah ile eşleştirme sistemimizi, MoonStar Global Indonesia çatısı altında evlilik rehberliği ve tamamlayıcı hizmetlerle birlikte sürdürüyoruz.",
      ],
      stepLabel: "Adım",
    },

    support: {
      title: "Hangi konularda yanınızdayız?",
      items: {
        joinScheduled: {
          title: "Başvuru ve profil desteği",
          description:
            "Başvuru, profil oluşturma ve süreci doğru yönetme konusunda adım adım destek sunarız.",
        },
        translation: {
          title: "Çeviri ve iletişim desteği",
          description:
            "Eşleştirme sohbetlerinde ve resmi görüşmelerde tercüme desteğiyle iletişimi kolaylaştırırız.",
        },
        privatePlan: {
          title: "Süreç planlama",
          description:
            "Evlilik ve resmi süreçlerde adım adım planlama yaparak daha net bir yol haritası çıkarırız.",
        },
        privateGroups: {
          title: "Topluluk ve aile koordinasyonu",
          description:
            "Aileler arası iletişim ve süreç koordinasyonu gibi konularda rehberlik sunarız.",
        },
        logistics: {
          title: "Lojistik rehberlik",
          description:
            "Resmi adımlar ve saha süreçlerinde ihtiyaç duyulduğunda pratik rehberlik sağlarız.",
        },
        wedding: {
          title: "Endonezya’da evlilik sürecine rehberlik",
          description:
            "Endonezya’da evlilik planlayan çiftler için; resmi adımların zamanlaması, yerel uygulamalar, tercüme ve süreç koordinasyonu konusunda rehberlik sunuyoruz.",
        },
      },
    },

    galleryTeaser: {
      title: "Hayatımızdan ve çalışmalarımızdan birkaç kare",
      description:
        "Aşağıda, Endonezya’daki hayatımızdan, sahadaki çalışmalarımızdan ve gezilerimizden seçtiğimiz birkaç kareyi görebilirsiniz. Daha fazlası için galerimize göz atabilirsiniz.",
      cta: "Fotoğrafların tamamını görmek için galerimizi ziyaret edin",
      previewAlt1: "Endonezya’daki hayatımızdan bir kare",
      previewAlt2: "Endonezya’da birlikte geçirdiğimiz bir günden kare",
      previewAlt3: "Endonezya’daki özel bir anımızdan kare",
    },

    youtubeHighlights: {
      title: "Bizi en iyi anlatan videolar",
      description:
        "YouTube kanalımızda Endonezya’daki hayatımızı, kültürü, seyahatleri ve sahadaki deneyimlerimizi paylaşıyoruz. Aşağıdaki iki video, yaklaşımımızı ve sunduğumuz desteği en iyi özetleyen içeriklerdir.",
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
          title: "Sistem + saha deneyimi",
          description:
            "Hem dijital sistem hem de sahada deneyim: Eşleştirme, iletişim ve süreç yönetiminde sorumluluk alırız.",
        },
        {
          title: "Güvenlik ve gizlilik odağı",
          description:
            "Kurallar, süreç adımları ve gizlilik prensipleri nettir. Kötüye kullanımı azaltan güvenlik mekanizmalarıyla hareket ederiz.",
        },
        {
          title: "İki kültür arasında doğru iletişim",
          description:
            'Çok dilli iletişimde tercüme ve rehberlik desteğiyle; yanlış anlaşılmaları azaltıp daha sağlıklı bir süreç kurarız.',
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
      indonesia: 'Operasyon',
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
    appleCta: 'Apple ile devam et',
    appleSignupCta: 'Apple ile kayıt ol',
    redirecting: 'Girişe yönlendiriliyorsunuz…',
    redirectScreen: {
      title: 'Yönlendiriliyorsun…',
      body: 'Profil sayfası açılıyor. Bu ekran uzun sürerse aşağıdan devam edebilirsin.',
      goProfile: 'Profilime Git',
      refresh: 'Yenile',
    },
    signupGuide: 'Kayıt olmak için Google ile devam edin; ardından kısa profilinizi tamamlayın.',
    signupExistingAccountHint: 'Zaten hesabın varsa Google ile giriş yap.',
    quickProfile: {
      title: 'Hızlı Profil Formu',
      lead: 'Kısa profilini tamamla, sonra devam et.',
      labels: {
        fullName: 'İsim',
        age: 'Yaş',
        gender: 'Cinsiyet',
        city: 'Şehir',
        country: 'Ülke',
        maritalStatus: 'Medeni durum',
        hasChildren: 'Çocuk var mı?',
        childrenCount: 'Kaç çocuk?',
        occupation: 'Meslek',
        photo: 'Profil fotoğrafı (1 adet)',
      },
      placeholders: {
        fullName: 'Adınız',
        age: 'Örn: 28',
        city: 'Şehir',
        childrenCount: 'Örn: 1',
        occupation: 'Meslek',
      },
      options: {
        select: 'Seçiniz',
        countryTr: 'Türkiye',
        countryId: 'Endonezya',
        countryOther: 'Diğer',
        maritalSingle: 'Bekar',
        maritalMarried: 'Evli',
        maritalDivorced: 'Boşanmış',
        maritalWidowed: 'Dul',
        hasChildrenNo: 'Yok',
        hasChildrenYes: 'Var',
      },
      statuses: {
        photoUploading: 'Fotoğraf yükleniyor…',
        photoUploaded: 'Fotoğraf yüklendi.',
      },
      actions: {
        createProfile: 'Profilimi Oluştur',
      },
      steps: {
        step2Google: 'Adım 2: Google ile kayıt ol',
      },
      infos: {
        ready: 'Profilin hazır. Şimdi devam edebilirsin.',
      },
      errors: {
        fillFirst: 'Önce hızlı profil formunu doldur.',
        nameRequired: 'İsim zorunlu.',
        ageInvalid: 'Yaş 18-99 aralığında olmalı.',
        genderRequired: 'Cinsiyet zorunlu.',
        cityRequired: 'Şehir zorunlu.',
        countryRequired: 'Ülke zorunlu.',
        maritalRequired: 'Medeni durum zorunlu.',
        occupationRequired: 'Meslek zorunlu.',
        hasChildrenRequired: 'Çocuk durumu zorunlu.',
        childrenCountRequired: 'Çocuk sayısı (1-20) zorunlu.',
        photoRequired: 'Profil fotoğrafı zorunlu.',
        photoNotImage: 'Lütfen bir görsel dosyası seçin.',
        photoUploadFailed: 'Fotoğraf yükleme başarısız.',
        saveFailed: 'Profil kaydedilemedi. Lütfen tekrar deneyin.',
      },
    },
    or: 'veya',
    labels: {
      email: 'E-posta',
      password: 'Şifre',
      confirmPassword: 'Şifre (tekrar)',
      gender: 'Cinsiyet',
      nationality: 'Uyruk',
      nationalityOther: 'Diğer uyruk (yazın)',
      age: 'Yaş',
    },
    placeholders: {
      email: 'ornek@email.com',
      password: 'Şifreniz',
      confirmPassword: 'Şifrenizi tekrar girin',
      nationality: 'Uyruk seçin',
      nationalityOther: 'Örn: Almanya',
      age: 'Örn: 27',
    },
    actions: {
      login: 'Giriş yap',
      signup: 'Kayıt ol',
      switchToSignup: 'Hesabın yok mu? Kayıt ol',
      switchToLogin: 'Zaten hesabın var mı? Giriş yap',
      showEmailFallback: 'Sorun mu yaşıyorsun? E-posta ile devam et',
      forgot: 'Şifremi unuttum',
    },
    signup: {
      genderMale: 'Erkeğim',
      genderFemale: 'Kadınım',
      nationalityTr: 'Türkiye',
      nationalityId: 'Endonezya',
      nationalityOther: 'Diğer',
      ageHint: 'En az {{minAge}} yaşında olmalısınız.',
    },
    forgotHint: {
      prefix: 'Şifrenizi unuttuysanız',
      suffix: 'butonuna basıp e-posta adresinize sıfırlama bağlantısı gönderebilirsiniz.',
    },
    passwordToggle: {
      show: 'Göster',
      hide: 'Gizle',
    },
    feedback: {
      title: 'Şikayet / Geri bildirim',
      lead: 'Kayıt aşamasında sorun yaşıyorsanız lütfen iletişim numaranız ya da e‑posta adresinizle birlikte sorunu bize bildirin. Hemen kontrol edip size dönüş yapalım.',
      contactLabel: 'İletişim (telefon veya e‑posta)',
      contactPlaceholder: 'Örn: +62 812… veya ad@site.com',
      placeholder: 'İletişim (telefon veya e‑posta) + yaşadığınız sorunu yazın…',
      note: 'Not: Size dönüş yapabilmemiz için iletişim bilginizi yazın.',
      reportCta: 'Bu hatayı bildir',
      prefillHeader: 'Lütfen aşağıyı doldurun:',
      prefillContact: 'İletişim (telefon veya e-posta):',
      prefillProblem: 'Sorun (ne yapmaya çalışıyordunuz / ne oldu?):',
      prefillUiError: 'Ekrandaki hata',
      prefillDebugCode: 'Hata kodu',
      prefillDebugMessage: 'Teknik mesaj',
      send: 'Gönder',
      sending: 'Gönderiliyor…',
      sent: 'Gönderildi. Teşekkürler.',
      tooShort: 'Lütfen en az {{min}} karakter yazın.',
      failed: 'Gönderilemedi. Lütfen tekrar deneyin.',
    },
    legal: {
      prefix: 'Devam ederek',
      contract: 'Kullanıcı / Üyelik sözleşmesi',
      cancelRefund: 'İptal / iade politikası',
      privacy: 'Gizlilik Politikası',
    },
    resetSent: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
    infos: {
      accountExistsTryLogin: 'Zaten kayıtlı bir hesabınız var. E-posta ve şifrenizi kullanarak giriş yapmayı deneyin.',
      inAppBrowserGoogleRedirect:
        'TikTok uygulama içi tarayıcısında Google ile giriş bazen çalışmıyor. Şimdi Google girişini yönlendirme (redirect) ile açıyoruz…',
    },
    errors: {
      noAccountFoundSignupRequired:
        'Kaydınız bulunamadı. Kayıt olmanız gerekiyor. Kayıt adımına yönlendirildiniz; lütfen cinsiyet/uyruk seçip yaşınızı girin ve tekrar deneyin.',
      accountExistsWithDifferentCredential:
        'Bu e-posta ile daha önce farklı bir yöntemle kayıt olmuşsunuz. Lütfen e-posta/şifre ile giriş yapın; ardından hesabınıza Google girişini bağlayabiliriz.',
      domainNotFound: '(domain bulunamadı)',
      googleFailedDev:
        'Google ile giriş başarısız ({{code}}).\n\nFirebase Console → Authentication → Settings → Authorized domains kısmına şu domain\'i ekleyin: {{host}}\nAyrıca .env ve Vercel env\'de VITE_FIREBASE_AUTH_DOMAIN değerini kontrol edin.',
      googleUnauthorizedDomain:
        'Google ile giriş başarısız (unauthorized-domain).\n\nFirebase Console → Authentication → Settings → Authorized domains kısmına bu domain\'i ekleyin: {{host}}',
      googleOperationNotAllowed:
        'Google ile giriş kapalı. Firebase Console → Authentication → Sign-in method → Google sağlayıcısını etkinleştirin.',
      appleOperationNotAllowed:
        'Apple ile giriş kapalı. Firebase Console → Authentication → Sign-in method → Apple sağlayıcısını etkinleştirin.',
      firebaseAuthInvalidConfig: 'Firebase Auth yapılandırması geçersiz. `.env.local` içindeki `VITE_FIREBASE_*` değerlerini kontrol edin.',
      googleFailed: 'Google ile giriş başarısız.',
      appleFailed: 'Apple ile giriş başarısız.',
      invalidCredential: 'E-posta veya şifre hatalı ya da hesap bulunamadı. Şifrenizi unuttuysanız “Şifremi unuttum” ile sıfırlamayı deneyin.',
      invalidEmail: 'E-posta adresi geçersiz görünüyor. Lütfen kontrol edin.',
      emailAlreadyInUse: 'Bu e-posta adresiyle zaten bir hesap var. “Giriş yap” veya “Şifremi unuttum” seçeneğini kullanın.',
      weakPassword: 'Şifre çok zayıf. Daha güçlü bir şifre deneyin (ör. en az 6 karakter).',
      rateLimited: 'Kısa sürede çok fazla deneme yapıldı. Lütfen 1 dakika bekleyip tekrar deneyin.',
      networkFailed: 'Bağlantı hatası oluştu. İnternetinizi kontrol edip tekrar deneyin.',
      passwordsDoNotMatch: 'Şifreler eşleşmiyor. Lütfen aynı şifreyi tekrar yazın.',
      emailPasswordRequired: 'E-posta ve şifre gerekli.',
      genderRequired: 'Kayıt olmak için cinsiyet seçin.',
      nationalityRequired: 'Kayıt olmak için uyruk seçin.',
      nationalityOtherRequired: 'Lütfen uyruğunuzu yazın.',
      ageRequired: 'Kayıt olmak için yaşınızı girin.',
      ageMin: 'Kayıt olmak için en az {{minAge}} yaşında olmalısınız.',
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

  newsletter: {
    title: 'Uniqah Bülteni',
    subtitle: 'Uniqah güncellemeleri, yeni özellikler ve önemli duyurular için e-posta adresinizi bırakın.',
    placeholderEmail: 'E-posta adresiniz',
    cta: {
      subscribe: 'Abone Ol',
      sending: 'Gönderiliyor…',
    },
    success: 'Başarıyla kaydedildi! Teşekkürler.',
    error: 'Bu e-posta adresi zaten kayıtlı veya bir hata oluştu.',
    privacy: 'Gizliliğinize saygı duyuyoruz. İstediğiniz zaman abonelikten çıkabilirsiniz.',
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
    studioBanner: {
      text: 'Yeni Studio arayüzü hazır. Daha temiz profil + eşleşme görünümü için geçiş yapabilirsiniz.',
    },
    membershipPromo: {
      freeLabel: 'Ücretsiz',
      until: '{{date}} tarihine kadar',
    },
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
        lead: '1-3 yeni fotoğraf yükleyin. Admin onayladıktan sonra profilinizde güncellenecek.',
        pending: 'İncelemede',
        cta: 'İstek gönder',
        uploading: 'Yükleniyor…',
        success: 'İsteğiniz alındı. İnceleme sonrası fotoğraflar güncellenecek.',
        errors: {
          photosRequired: 'Lütfen en az 1 fotoğraf seçin.',
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

    agreement: {
      title: 'Kullanım sözleşmesi ve güvenlik',
      intro:
        'Bu eşleştirme sistemi moderasyonludur. İletişimde saygılı olun ve güvenlik kurallarına uyun. Şüpheli bir durum yaşarsanız kanıtla birlikte bildirin.',
      safety: {
        title: 'Güvenlik kuralları',
        s1: 'İletişim paylaşımı açılmadan önce telefon, sosyal medya, link, IBAN vb. iletişim bilgisini paylaşmayın.',
        s2: 'Baskı, hakaret, cinsel içerik ve maddi çıkar girişimleri kesinlikle yasaktır.',
        s3: 'Şüpheli davranış görürseniz ekran görüntüsü/kanıt ile destek hattına bildirin.',
      },
      complaint: {
        title: 'Şikayet / bildirim',
        body:
          'Şikayetler kanıta göre incelenir. İhlal kesinleşirse hesap sistemden kaldırılabilir.',
        c1Title: 'Kanıt gerekli',
        c1Body: 'Ekran görüntüsü, tarih/saat ve kısa açıklama paylaşın.',
        c2Title: 'Hızlı inceleme',
        c2Body: 'Net kanıt içeren ciddi şikayetler öncelikli değerlendirilir.',
        c3Title: 'Gizlilik',
        c3Body: 'Diğer kullanıcıların özel bilgilerini kamuya açık paylaşmayın; kanıtı yalnızca desteğe iletin.',
        extraMale: 'Erkek kullanıcılar: kural ihlali kesinleşirse üyelik iptal edilir; iade yapılmaz.',
        extraFemale: 'Kadın kullanıcılar: iletişim paylaşımı her zaman isteğe bağlıdır; baskı yaşarsanız hemen bildirin.',
      },
      enforcement: {
        title: 'Yaptırım ve iade politikası',
        e1a: 'Kuralları ihlal eden kullanıcılar (kanıtla tespit edilirse)',
        e1b: 'kalıcı olarak engellenir',
        e1c: 've eşleşmeleri iptal edilir.',
        e2a: 'İhlal yapan kişinin',
        e2b: 'aktif üyeliği varsa iptal edilir.',
        e3a: 'Üyelik iptal edilse bile',
        e3b: 'para iadesi yapılmaz.',
        e4a: 'Bu platformu kullanan herkesin',
        e4b: 'kuralları okuduğu ve kabul ettiği varsayılır.',
      },
    },
    actions: {
      logout: 'Çıkış',
      profileForm: 'Profil formu',
      goToStudio: 'Studio arayüzüne git',
      whatsapp: 'WhatsApp’tan yaz',
      remove: 'Kaldır',
      copy: 'Kopyala',
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
      sidebarTitle: 'Sohbet',
      noActiveChat: 'Şu an aktif sohbet yok.',
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
      editOnceUsed:
        'Profil bilgileri sadece 1 defaya mahsus güncellenebilir. Düzenleme hakkınız kalmadığı için isteğiniz başarısız oldu.',
      editOnceWarning:
        'Uyarı: Bu hak sadece 1 defaya mahsustur. Lütfen göndermeden önce tüm bilgilerin doğru ve eksiksiz olduğundan emin olun.',
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
      freeActiveTitle: 'Ücretsiz aktivasyon',
      freeActiveBody: 'Kimlik doğrulamanız varsa hesabınızı ücretsiz aktif edebilirsiniz. (Kurallar/48-24 saat şartları geçerlidir.)',
      freeActiveNeedsVerification: 'Ücretsiz aktivasyon için önce kimlik doğrulama gerekir.',
      paymentTitle: 'Ücretli üyelik (aylık) / ödeme',
      paymentBody: 'Üyeliği aktifleştirmek için aşağıdaki ödeme yöntemlerinden biriyle ödeme yapın, sonra dekont/ref. bilgisi ile bildirim gönderin.',
      selectMatchTitle: 'Ödeme bildirimi için eşleşme seçin',
      selectMatchHelp: 'Teknik olarak ödeme bildirimi bir eşleşmeye bağlanır. Eşleşme yoksa WhatsApp destek hattına yazabilirsiniz.',
      selectMatchPlaceholder: 'Eşleşme seçin…',
      matchOption: '{{status}} • {{matchCode}}',
      selectMatchRequired: 'Ödeme bildirimi göndermek için bir eşleşme seçmelisiniz.',
    },
    payment: {
      title: 'Ödemeler',
      empty: 'Ödeme kaydı bulunamadı.',
      status: 'Durum',
      amount: 'Tutar',
      date: 'Tarih',
      invoice: 'Fatura / referans',
      actions: {
        pay: 'Öde',
        view: 'Görüntüle',
      },
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
      membershipOrVerificationRequired: 'Bu işlem için aktif üyelik gerekir.',
      freeActiveMembershipRequired: 'Bu işlem için hesabınızın aktif olması gerekir.',
      freeActiveMembershipBlocked: 'Aktivasyon hakkınız devre dışı. Bu işlem için lütfen destek ile iletişime geçin.',
      otherUserMatched: 'Bu kişi başka biriyle eşleşmiş. Beğeni gönderemezsiniz.',
      alreadyMatched: 'Zaten bir eşleşmeniz var.',
      userLocked: 'Eşleşme süreciniz kilitli. Bu işlem yapılamaz.',
      pendingContinueExists: 'Devam etmek için zaten bir aday seçtiniz. Önce o eşleşmede karar verin.',
      applicationRequired: 'Önce eşleştirme başvurunu tamamlamalısın.',
      noCandidatesNow: 'Şu an uygun aday bulunamadı.',
      noMatchGeneratedNow: 'Şu an yeni eşleşme üretilemedi.',
      requestNewFailed: 'Yeni eşleşme talebi gönderilemedi.',
      requestNewRateLimited: 'Yeni eşleşme talebini çok sık gönderiyorsunuz. Lütfen daha sonra tekrar deneyin.',
      requestNewQuotaExhausted: 'Bugünkü yeni eşleşme hakkınız bitti (3/3). Yarın tekrar deneyin.',
      requestNewFreeActiveBlocked: 'Aktivasyon hakkınız iptal edildiği için yeni eşleşme talep edemezsiniz. Lütfen destek ile iletişime geçin.',
      freeSlotFailed: 'Slot boşaltma işlemi başarısız.',
      freeSlotQuotaExhausted: 'Bugünkü slot boşaltma hakkınız bitti (1/1). Yarın tekrar deneyin.',
      cooldownActive: 'Bu işlem için biraz beklemeniz gerekir. Kalan süre: {{remaining}}',
      newUserSlotAlreadyActive: 'Yeni kayıt slotunuz zaten açık. Uygun yeni kayıt gelene kadar bekleyin veya normal yenileme kullanın.',
    },
    hints: {
      creditNotSpentSuffix: ' (hak harcanmadı)',
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
      profileNotCreatedHint: 'Profiliniz henüz oluşturulmadı. Lütfen önce başvuru formunu doldurun.',
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
      lead: 'Üyelik şartları:',
      inactive: 'Üyelik aktif değil. Üyelik aktif olana kadar adayların tüm detaylarını göremez, beğeni/ret veremezsiniz.',
      inactiveMale: 'Üyelik aktif değil. Üyelik aktif olana kadar adayların tüm detaylarını göremez, beğeni/ret veremezsiniz.',
      inactiveFemale: 'Üyelik aktif değil. Eşleşme ve ön inceleme için üyelik gerekmez. İşlem yapabilmek için hesabın aktif olması gerekir.',
      activeViaVerification: 'Kimlik doğrulamanız var. Hesabınızı aktif edebilirsiniz.',
      freeActiveActive: 'Hesabınız aktif.',
      freeActiveTermsTitle: 'Ücretsiz aktivasyon şartları',
      freeActiveTermsBody: 'Hesabınızı ücretsiz aktif ettiyseniz ve 48 saat aktif olmazsanız aktivasyon iptal edilebilir. Yeniden aktivasyonda süre 24 saate düşer. Bu süre içinde tekrar aktif olunmazsa aktivasyon tekrar iptal edilebilir ve yeni eşleşme talebi kısıtlanabilir.',
      freeActiveApply: 'Hesabı ücretsiz aktif et',
      freeActiveApplying: 'Başvuru gönderiliyor…',
      freeActiveApplied: 'Hesabınız ücretsiz aktif edildi. Süre: {{hours}} saat.',
      daysLeft_one: 'Kalan süre: {{count}} gün.',
      daysLeft_other: 'Kalan süre: {{count}} gün.',
      until: 'Bitiş: {{date}}.',
    },

    membershipInfo: {
      title: 'Üyelik bilgileri',
      subtitle: 'Üyelik türünüz ve tarih bilgileri.',
      details: {
        type: 'Tür',
        start: 'Başlangıç',
        end: 'Bitiş',
      },
    },
    membershipNotice: {
      title: 'Üyelik şartları',
      male: {
        lead: 'Üyelik şartları:',
        points: [
          'Eşleşme ve kısıtlı ön izleme ücretsizdir.',
          'Detaylı profil inceleme, beğeni/ret ve iletişim adımları için üyeliğin aktif olması gerekir (şimdilik ücretsiz).',
        ],
      },
      female: {
        lead: 'Üyelik şartları:',
        points: [
          'Eşleşme ve kısıtlı ön izleme ücretsizdir.',
          'Detaylı profil inceleme, beğeni/ret ve iletişim için hesabın aktif olması gerekir.',
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
            a: 'Beğeni / detaylı inceleme / iletişim için hesabın aktif olması gerekir.',
          },
          {
            q: 'Kimlik doğrulama ne işe yarar?',
            a: 'Güven rozetidir. Kurallara aykırı durumlarda kanıtla şikayet sürecini güçlendirir ve bazı akışların kilidini açabilir.',
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
      verifiedBadge: 'Güvenilir kullanıcı',
      requiredTitle: 'Kimlik doğrulama (rozet)',
      requiredBody: 'Kimlik doğrulama zorunlu değildir; bir güven rozetidir. Kurallara aykırı davranışlarda kanıtla şikayet oluşturabilirsiniz.',
      unverifiedTitle: 'Kimlik doğrulama (rozet)',
      unverifiedBodyMale: 'Kimlik doğrulama zorunlu değildir; bir güven rozetidir. (Not: Erkek kullanıcılar için aksiyonlar üyelikle açılır.)',
      unverifiedBodyFemale: 'Kimlik doğrulama zorunlu değildir; bir güven rozetidir. (Not: Kimlik doğrulama bazı akışların kilidini açabilir.)',
      referenceCode: 'Doğrulama kodu',
      pendingHint: 'Durum: inceleme bekleniyor',
      tabs: {
        selfieVideo: 'Selfie video',
        social: 'Sosyal medya',
      },
      selfieVideo: {
        title: 'Selfie video ile doğrula (WhatsApp)',
        lead: 'WhatsApp\'ta 5 saniyelik bir video selfie gönderin. Talep oluşturup WhatsApp\'ı açabilirsiniz.',
        pendingHint: 'Selfie video doğrulama talebiniz alındı. WhatsApp üzerinden video gönderimini tamamlayın.',
      },
      social: {
        title: 'Sosyal medya ile doğrula',
        lead: 'Platformu seçin ve kullanıcı adınızı gönderin. İnceleme sonrası rozet tanımlanır.',
        platformLabel: 'Sosyal medya',
        usernameLabel: 'Kullanıcı adı',
        submit: 'Gönder',
        success: 'Gönderildi. İnceleme bekleniyor.',
        pendingHint: 'Sosyal medya doğrulama talebiniz alındı. İnceleme bekleniyor.',
      },
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
        kycNotConfigured: 'Otomatik KYC şu an yapılandırılmadı. Lütfen WhatsApp veya sosyal medya yöntemiyle doğrulayın.',
        whatsappNotConfigured: 'WhatsApp numarası yapılandırılmadı. Lütfen sosyal medya yöntemiyle doğrulayın.',
        missingFiles: 'Lütfen kimlik (ön/arka) ve selfie seçin.',
        missingSocial: 'Lütfen platform seçin ve kullanıcı adınızı yazın.',
      },
    },

    membershipModal: {
      openFree: 'Hesabı ücretsiz aktif et',
      open: 'Üyelik durumu',
      title: 'Üyelik işlemleri',
      statusLabel: 'Üyelik',
      activate: 'Üyeliğimi aktif et',
      freeActivateCta: 'Üyeliğimi ücretsiz aktifleştir',
      cancel: 'Üyeliğimi iptal et',
      cancelDisabledHint: 'Üyelik aktif olana kadar iptal edemezsiniz.',
      deleteAccount: 'Hesabı sil',
      deletePhrase: 'hesabımı sil',
      deleteTypePrompt: 'Hesabı gerçekten silmek istiyorsanız: "{{phrase}}" yazın.',
      deleteFinalConfirm: 'Hesabınız kalıcı olarak sistemden silinecektir. Emin misiniz?',
      deleteCancel: 'Vazgeç',
      deleteContinue: 'Devam et',
      deleteBack: 'Geri',
      deleteYes: 'Evet hesabımı sil',
      loading: 'İşlem yapılıyor…',
      alreadyActive: 'Üyeliğiniz zaten aktif',
      successActivated: 'Üyeliğiniz aktif edildi.',
      successActivatedUntil: 'Üyeliğiniz aktif edildi. Bitiş: {{date}} ({{count}} gün kaldı).',
      promoActivated: 'Üyeliğiniz Eko pakette ücretsiz aktif edildi. Bitiş: {{date}} ({{count}} gün kaldı).',
      freeNowTitle: 'Üyelik şu an ücretsiz',
      freeNowBody: 'Şimdilik üyelik ücretsizdir ve hemen aktifleştirebilirsiniz.\nYeterli üye sayısına ulaşıldığında ödeme adımı eklenip üyelik ücretli modele geçirilebilir.',
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
      proposedActions: {
        interested: 'İlgileniyorum',
        notSuitable: 'Uygun değil',
      },
      proposedChat: {
        title: 'Direkt mesaj',
        noticeTitle: 'Bilgilendirme',
        noticeBody: 'Bu alan sınırlı bir direkt mesaj alanıdır. Lütfen kısa ve saygılı yazın.',
      },
      rejectReason: {
        title: 'Reddetme sebebini seç…',
      },
      contactShare: {
        title: 'İletişim paylaşımı',
        approved: 'İletişim bilgileri karşılıklı onayla paylaşıldı.',
        pending: 'İletişim isteği gönderildi. Karşı tarafın onayı bekleniyor.',
        lock48h: 'Telefon numaralarını paylaşmak için 48 saat site içi iletişim gerekli. Kalan süre: {{time}}.',
        requestCta: 'İletişim isteği gönder',
        requestHint: 'Karşı taraf onaylarsa telefon numaraları görünür.',
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
        lastMessages: 'Son mesajlar',
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
            approveLocked: '48 saat dolmadan onay verilemez.',
            contactNotPending: 'Onaylanacak bir iletişim isteği yok.',
          },
        },
      },
      candidate: {
        fallbackName: 'Aday',
        verifiedBadge: 'Güvenilir kullanıcı',
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
        referenceHint: 'Ödeme yaparken açıklama/ref. kısmına bunu yazın: {{code}}',
        referencePlaceholder: 'Dekont no, açıklama, gönderici adı...',
        note: 'Not (opsiyonel)',
        notePlaceholder: 'İsterseniz ek bilgi yazın',
        noteHelpEftFastWise:
          'EFT/Havale (veya Wise/SWIFT) gönderirken bankanın “Açıklama / Reference” alanına yukarıdaki MK kullanıcı kodunu tam olarak yazmanız gerekiyor.',
        noteHelpEftFastExtra: 'EFT/FAST seçeneği ile ödemeler şirketimiz adına yetkili kişinin Türkiye hesabına yapılmaktadır.',
        noteHelpOther: 'Ödeme yöntemine göre açıklama alanı gerekmeyebilir. Yine de yukarıdaki referans bilgisini saklayın.',
        receipt: 'Dekont (opsiyonel)',
        receiptHelp: 'Foto yükleyebilir veya aşağıya dekont linki yapıştırabilirsiniz.',
        receiptLink: 'Dekont linki (opsiyonel)',
        viewReceipt: 'Dekontu görüntüle',
        uploadingReceipt: 'Dekont yükleniyor…',
        receiptViaUpload: 'Dekont yükle',
        receiptViaWhatsapp: 'Dekontu WhatsApp’tan göndereceğim',
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
      eligibilityPointFemale: 'Site içinde eşleşme ve eşleşen kullanıcının kısıtlı profil bilgisini görmek için üyelik satın almaya gerek yoktur. Beğeni/ret ve iletişim için hesabın aktif olması gerekir.',
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
      editOnce: {
        usernameLocked: 'Bu modda kullanıcı adını da düzeltebilirsiniz (1 defaya mahsus).',
        photosLocked: 'Edit modunda fotoğraf güncelleme kapalı. Sadece form alanlarını düzeltebilirsiniz.',
      },
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
        freeUsageNotice: 'Uygulamayı kullanmak tamamen ücretsizdir.',
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
    title: 'Üyelik',
    lead: 'Üyelik otomatik olarak aktiftir. Uygulamayı kullanmak tamamen ücretsizdir.',
    freeNowTitle: 'Tamamen ücretsiz',
    freeNowBody: 'Uygulamadaki tüm özellikler ücretsizdir; ekstra bir ödeme veya aktivasyon adımı yoktur.',
    freeActivateCta: 'Üyeliğimi ücretsiz aktif et',
    activating: 'Aktifleştiriliyor…',
    activated: 'Üyelik aktifleştirildi.',
    activatedUntil: 'Üyelik aktifleştirildi. Bitiş: {{date}}',
    freeActivatedInfo:
      '{{date}} tarihine kadar ücretsiz üyeliğiniz tanımlanmıştır.\nÜyelik kapsamında eşleşme profilini beğenip reddetme ve {{translatedCount}} çevirili mesaj hakkından faydalanabilirsiniz.\nGünlük eşleşme değiştirme hakkınız {{dailyLimit}} ile sınırlıdır.',
    freeDisabled: 'Ücretsiz üyelik aktivasyonu şu an kapalı. Lütfen daha sonra tekrar deneyin.',
    activateFailed: 'Üyelik aktifleştirilemedi. Lütfen tekrar deneyin.',
    errors: {
      notAuthenticated: 'Oturum doğrulanamadı. Lütfen çıkış yapıp tekrar giriş yapın.',
      serverNotConfigured: 'Sunucu yapılandırması eksik. Lütfen destek ile iletişime geçin.',
      apiUnavailableDev: 'API erişilemiyor. Lokal geliştirmede `npm run dev` (api+web) çalıştırın.',
    },
    backToPanel: 'Panele dön',
    freeNowFootnote: 'Not: Uygulama tamamen ücretsizdir.',
  },

  memberFeed: {
    badge: {
      newUser: 'Yeni',
    },
    toast: {
      title: 'Canlı',
      closeAria: 'Kapat',
      generic: 'Yeni bir etkinlik oldu.',
      signupAnonymous: 'Yeni biri sisteme katıldı.',
      signupKnown: '{{label}} sisteme katıldı.',
      profileCompletedAnonymous: 'Yeni kullanıcı profilini tamamladı.',
      profileCompletedKnown: '{{label}} profilini tamamladı.',
    },
  },
};
