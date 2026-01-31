import en from "./en";

function isPlainObject(value) {
  return (
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function deepMerge(base, override) {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override;
  }

  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(base[key])) {
      out[key] = deepMerge(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

// Indonesian translations: no TR/EN fallback here.
// Only keys defined below will be shown in Indonesian.
const overrides = {
  navigation: {
    siteTitle: "Endonezya Kaşifi",
    siteSubtitle: "PT MoonStar Global Indonesia",
    taglineTravelOrg: "Organisasi perjalanan",
    taglineWeddingGuidance: "Panduan pernikahan",
    home: "Beranda",
    about: "Tentang Kami",
    corporate: "Perusahaan",
    travel: "Perjalanan",
    tours: "Paket Tur",
    explore: "Jelajahi",
    wedding: "Panduan Pernikahan",
    matchmaking: "Uniqah",
    panel: "Profil saya",
    documents: "Dokumen",
    youtube: "YouTube",
    contact: "Kontak",
    language: "Bahasa",
  },

  studio: {
    common: {
      back: 'Kembali',
      open: 'Buka',
      close: 'Tutup',
      cancel: 'Batal',
      send: 'Kirim',
      loading: 'Memuat…',
      processing: 'Memproses…',
      match: 'Pencocokan',
      profile: 'Profil',
      verified: 'Terverifikasi',
      unknown: 'Tidak diketahui',
    },

    feedback: {
      nav: 'Dukungan / Laporan',
      backToProfile: 'Kembali ke profil',
      title: 'Dukungan • Masukan • Laporkan masalah',
      subtitle: 'Kirim saran/komentar atau laporkan langkah yang tidak berfungsi.',
      urgentNote: 'Untuk keluhan mendesak yang butuh bukti, jalur tercepat:',
      whatsappCta: 'Dukungan WhatsApp',
      kindLabel: 'Kategori',
      kinds: {
        bug: 'Bug / Tidak berfungsi',
        suggestion: 'Saran / Masukan',
        complaint: 'Keluhan (singkat)',
        other: 'Lainnya',
      },
      matchIdLabel: 'ID match (opsional)',
      matchIdPlaceholder: 'Jika ada matchId',
      stepLabel: 'Langkah (opsional)',
      stepPlaceholder: 'mis. “Kirim pesan chat”',
      messageLabel: 'Pesan',
      messagePlaceholder:
        'Apa yang terjadi, apa yang Anda harapkan, di layar mana? Jika bisa tambahkan tanggal/jam dan detail singkat. (Jangan bagikan info kontak.)',
      privacyNote: 'Privasi: Jangan bagikan informasi kontak.',
      submit: 'Kirim',
      success: 'Laporan Anda kami terima. Terima kasih!',
      ticketId: 'Tiket',
      error: 'Error',
      footerNote: 'Catatan: Form ini dikirim ke dukungan. Waktu respon bisa berbeda tergantung beban kerja.',

      screenshotLabel: 'Screenshot (opsional)',
      screenshotDisabled: 'Upload screenshot dinonaktifkan (Cloudinary belum dikonfigurasi).',
      selectedFile: 'File dipilih',
      uploading: 'Mengunggah screenshot…',
      uploadFailed: 'Upload gagal',

      sendToWhatsApp: 'Dukungan WhatsApp dengan tiket',
      sendToWhatsAppHint: 'Tiket dan matchId ditambahkan otomatis.',
    },

    inbox: {
      likesTitle: 'Suka masuk ({{count}})',
      likeReceived: 'Mengirim Anda suka',
      viewProfile: 'Lihat profil',
      accept: 'Suka balik',
      reject: 'Tolak',
    },

    accessInbox: {
      title: 'Permintaan akses profil ({{count}})',
      requested: 'Meminta izin untuk melihat profilmu',
      approve: 'Izinkan',
      reject: 'Tolak',
    },

    pool: {
      title: 'Pool',
      backToMatches: '← Kembali ke pencocokan',
      refresh: 'Muat ulang',
      lastUpdated: 'Otomatis diperbarui (20 dtk).',
      countHint: 'Total: {{total}} • Ditampilkan: {{shown}}',
      filtersHint: 'Rentang usia: {{min}} – {{max}}',
      empty: 'Tidak ada profil untuk filter ini.',
      requestProfileNow: 'Kirim permintaan kecocokan',
      requesting: 'Mengirim…',
      requestSent: 'Terkirim',
      openProfile: 'Buka profil',
      profileModalTitle: 'Profil',
      actionsSoon: 'Segera: pesan singkat',
      notInTheirRange: 'Untuk berinteraksi, kamu juga harus masuk rentang usia yang dia tentukan.',
      notInTheirRangeShort: 'Rentang usia tidak cocok',
    },

    paywall: {
      upgradeTitle: 'Perlu keanggotaan',
      upgradeToInteract: 'Keanggotaan aktif diperlukan untuk melakukan ini. Upgrade ke paket berbayar untuk menyukai dan mengirim pesan.',
      upgradeToReply: 'Keanggotaan aktif diperlukan untuk membalas. Upgrade ke paket berbayar untuk mengirim pesan.',
      upgradeCta: 'Upgrade',
    },

    myInfo: {
      title: 'Info saya',
      subtitle: 'Ringkasan informasi yang Anda berikan di aplikasi.',
      noProfile: 'Data profil tidak ditemukan.',
      appMissing: 'Data formulir aplikasi tidak ditemukan. (Data aplikasi atau profil pengguna mungkin hilang.)',
      sections: {
        basic: 'Info dasar',
        contact: 'Kontak',
        details: 'Detail',
        partner: 'Preferensi pasangan',
        about: 'Tentang Anda',
        membership: 'Keanggotaan & verifikasi',
      },
      fields: {
        username: 'Nama pengguna',
        fullName: 'Nama lengkap',
        age: 'Usia',
        gender: 'Jenis kelamin',
        city: 'Kota',
        country: 'Negara',
        nationality: 'Kebangsaan',
        whatsapp: 'WhatsApp',
        email: 'Email',
        instagram: 'Instagram',
        heightCm: 'Tinggi (cm)',
        weightKg: 'Berat (kg)',
        occupation: 'Pekerjaan',
        education: 'Pendidikan',
        educationDepartment: 'Jurusan',
        maritalStatus: 'Status pernikahan',
        hasChildren: 'Punya anak?',
        childrenCount: 'Jumlah anak',
        childrenLivingSituation: 'Tinggal bersama anak?',
        familyApprovalStatus: 'Persetujuan keluarga',
        religion: 'Agama',
        religiousValues: 'Nilai agama',
        incomeLevel: 'Pendapatan',
        marriageTimeline: 'Rencana waktu menikah',
        relocationWillingness: 'Bersedia pindah',
        preferredLivingCountry: 'Negara tinggal yang diinginkan',
        communicationLanguage: 'Bahasa komunikasi',
        communicationLanguageOther: 'Bahasa komunikasi (lainnya)',
        smoking: 'Merokok',
        alcohol: 'Alkohol',
        nativeLanguage: 'Bahasa ibu',
        nativeLanguageOther: 'Bahasa ibu (lainnya)',
        foreignLanguages: 'Bahasa asing',
        foreignLanguageOther: 'Bahasa asing (lainnya)',
        lookingForGender: 'Mencari (gender)',
        lookingForNationality: 'Mencari (kebangsaan)',
        partnerAgeMin: 'Usia (min)',
        partnerAgeMax: 'Usia (maks)',
        partnerHeightMinCm: 'Tinggi (min cm)',
        partnerHeightMaxCm: 'Tinggi (maks cm)',
        partnerMaritalStatus: 'Status pernikahan',
        partnerReligion: 'Agama',
        partnerCommunicationMethods: 'Metode komunikasi',
        partnerLivingCountry: 'Negara tempat tinggal',
        partnerSmokingPreference: 'Merokok',
        partnerAlcoholPreference: 'Alkohol',
        partnerChildrenPreference: 'Anak',
        partnerEducationPreference: 'Pendidikan',
        partnerOccupationPreference: 'Pekerjaan',
        partnerFamilyValuesPreference: 'Nilai keluarga',
        about: 'Tentang',
        expectations: 'Harapan',
        membershipPlan: 'Paket keanggotaan',
        membershipActive: 'Keanggotaan aktif',
        membershipValidUntil: 'Keanggotaan berakhir',
        identityVerified: 'Identitas terverifikasi',
        identityStatus: 'Status identitas',
        identityMethod: 'Metode verifikasi',
        identityRef: 'Referensi',
      },
      developerView: 'Tampilan developer (JSON)',
      developerHint: 'Bisa Anda bagikan ke admin bila diperlukan.',
    },

    match: {
      status: {
        proposed: 'Perkenalan',
        mutual_interest: 'Suka timbal balik',
        mutual_accepted: 'Aktif',
        contact_unlocked: 'Kontak terbuka',
        cancelled: 'Dibatalkan',
      },
      avatarAlt: 'Foto profil {{name}}',
      actions: {
        like: 'Suka',
        liked: 'Disukai',
        unlike: 'Batalkan suka',
        unlike: 'Batalkan suka',
        message: 'Kirim pesan',
      },
      banners: {
        locked: 'Anda punya pencocokan aktif — yang lain terkunci',
        newMessage: 'Pesan baru',
      },
    },

    matches: {
      title: 'Pencocokan saya',
      showingCount: 'Menampilkan {{count}} pencocokan.',
      emptyHint: 'Pencocokan Anda akan muncul di sini.',
      backToProfile: '← Kembali ke profil',
      findNew: 'Cari pencocokan baru',
      finding: 'Mencari…',
      howTitle: 'Bagaimana cara kerja?',
      howItems: {
        likeFirst: 'Pertama, sukai profil (jika saling suka, “Suka timbal balik” terbentuk).',
        startActive: 'Setelah saling suka, jika kedua pihak menyetujui “Mulai pencocokan aktif”, chat panjang terbuka.',
        onlyOneActive: 'Anda hanya bisa punya 1 pencocokan aktif pada satu waktu.',
        lockUntilCancel: 'Sampai pencocokan aktif dibatalkan oleh kedua pihak, suka/pesan dengan profil lain terkunci.',
      },
      activeLockTitle: 'Anda punya pencocokan aktif',
      activeLockBody: 'Interaksi dengan profil lain terkunci. Buka <link>halaman pencocokan aktif</link> untuk mengelolanya.',
      requestFailed: 'Permintaan pencocokan gagal: {{error}}',
      requestOk: 'Permintaan terkirim. Bisa muncul di daftar dalam beberapa detik.',
      loading: 'Memuat…',
      loadFailed: 'Pencocokan tidak bisa dimuat. ({{error}})',
      noneTitle: 'Belum ada pencocokan.',
      noneBody: 'Jika Anda baru membuat profil, pencocokan pertama bisa dibuat dalam beberapa detik. Anda juga bisa memicunya secara manual di sini.',
      shortModal: {
        subtitle: 'Pesan singkat (batas 5) • untuk info singkat di luar profil',
        remaining: 'Sisa: {{remaining}} / {{limit}}',
        noMessages: 'Belum ada pesan.',
        translateError: 'Kesalahan terjemahan: {{error}}',
        translating: 'Menerjemahkan…',
        translate: 'Terjemahkan',
        placeholder: 'Tulis pertanyaan singkat…',
      },
      errors: {
        activeLocked: 'Saat Anda punya pencocokan aktif, Anda tidak bisa mengirim pesan ke profil lain. Batalkan pencocokan aktif Anda secara mutual terlebih dahulu.',
        shortLimit: 'Anda sudah menggunakan semua pesan singkat (5). Untuk lanjut, setelah saling suka Anda harus memulai pencocokan aktif.',
      },
    },

    chat: {
      backToMatches: '← Kembali ke pencocokan',
      chatTitle: 'Chat',
      emoji: 'Emoji',
      emojiHint: 'Anda bisa menambahkan emoji',
      matchTestOnlyActive: 'Tes kecocokan hanya bisa dibuka pada pencocokan aktif.',
      shortAreaTitle: 'Area pesan singkat',
      shortAreaDesc:
        'Area ini hanya untuk mengetahui lebih banyak tentang orang tersebut (topik yang tidak ada di profil, pertanyaan singkat tentang karakter).',
      shortAreaLimit: 'Batas Anda {{limit}} pesan. Sisa: {{remaining}}',
      otherActiveLock: 'Karena pencocokan aktif Anda dengan orang lain, chat panjang tidak tersedia di pencocokan ini.',
      noMessages: 'Belum ada pesan. Kirim pesan pertama.',
      matchLoading: 'Memuat pencocokan…',
      matchNotFound: 'Pencocokan tidak ditemukan.',
      messagesLoading: 'Memuat pesan…',
      sendFailed: 'Pesan tidak bisa dikirim: {{error}}',
      inputPlaceholderLong: 'Tulis pesan…',
      inputPlaceholderShort: 'Tulis pertanyaan/pesan singkat…',
      notAvailable: 'Pesan saat ini tidak tersedia.',
      lockedTitle: 'Pencocokan lain sementara terkunci',
      lockedBody: 'Saat Anda memiliki pencocokan aktif, pesan di pencocokan lain dinonaktifkan. Akan terbuka kembali saat lock berakhir.',
      notAllowed: 'Anda tidak diizinkan melihat chat ini.',
      notOpenTitle: 'Pesan belum dibuka',
      notOpenBody: 'Pesan terbuka setelah pencocokan menjadi aktif (persetujuan kedua pihak).',
      you: 'Anda',
      remainingTime: '{{hours}}j {{minutes}}m',
      lock48h: {
        title: 'Chat privat 48 jam + berbagi kontak',
        subtitle: 'Setelah konfirmasi mutual dan waktu selesai, kontak dapat dibagikan.',
        lockedRemaining: 'Masih terkunci. Sisa: {{time}}',
        confirming: 'Mengonfirmasi…',
        confirmed: 'Dikonfirmasi',
        confirm: 'Konfirmasi 48 jam',
        requesting: 'Mengirim permintaan…',
        requestContact: 'Minta berbagi kontak',
        approving: 'Menyetujui…',
        approveContact: 'Setujui berbagi kontak',
        confirmStatusLabel: 'Status konfirmasi:',
        confirmStatus: {
          both: 'Dikonfirmasi mutual',
          you: 'Anda sudah konfirmasi (menunggu pihak lain)',
          other: 'Pihak lain sudah konfirmasi (menunggu Anda)',
          none: 'Belum ada konfirmasi',
        },
        contactStatusLabel: 'Berbagi kontak:',
        contactStatus: {
          approved: 'Dibagikan',
          pendingMine: 'Permintaan terkirim (menunggu persetujuan)',
          pendingOther: 'Pihak lain meminta (Anda bisa menyetujui)',
          closed: 'Tertutup',
        },
        confirmError: 'Kesalahan konfirmasi: {{error}}',
        contactRequestError: 'Kesalahan permintaan kontak: {{error}}',
        contactApproveError: 'Kesalahan persetujuan kontak: {{error}}',
        whatsappTitle: 'WhatsApp',
        openInWhatsApp: 'Buka di WhatsApp',
      },
    },

    profile: {
      membershipLabel: 'Keanggotaan',
      membershipActive: 'Aktif',
      membershipPassive: 'Tidak aktif',
      endsAt: 'Berakhir',
      editProfile: 'Edit profil',
      myMatches: 'Pencocokan saya',
      logout: 'Keluar',
      bannerAlt: 'Banner profil',
      aboutTitle: 'Tentang',
      noBio: 'Belum ada deskripsi.',
      textsTitle: 'Teks profil',
      aboutLabel: 'Ceritakan singkat tentang diri Anda',
      expectationsLabel: 'Ceritakan pasangan yang Anda cari',
      aboutPlaceholder: 'Tulis pengenalan singkat tentang diri Anda…',
      expectationsPlaceholder: 'Tulis apa yang Anda cari…',
      saveTexts: 'Simpan',
      textsSaved: 'Tersimpan.',
      subscriptionTitle: 'Langganan',
      subscriptionActiveDesc: 'Keanggotaan Anda aktif. Anda dapat mengakses semua fitur.',
      subscriptionPassiveDesc: 'Keanggotaan Anda tidak aktif. Beberapa tindakan mungkin dibatasi tanpa keanggotaan.',
      buySoon: 'Beli keanggotaan (segera)',
      activateMembership: 'Aktifkan keanggotaan saya',
      cancelMembership: 'Batalkan keanggotaan',
      membershipActivated: 'Keanggotaan diaktifkan.',
      membershipCancelled: 'Keanggotaan dibatalkan.',
      confirmCancelMembership: 'Apakah Anda ingin membatalkan keanggotaan?',
      myInfo: 'Info saya',
      identityTitle: 'Verifikasi identitas',
      identityVerified: 'Identitas Anda tampak terverifikasi.',
      identityStatus: 'Status',
      verifyNow: 'Verifikasi identitas saya',
      identityHelp: 'Dengan memverifikasi identitas, Anda dapat meningkatkan kepercayaan dan menghapus batasan fitur/keanggotaan.',
      accountTitle: 'Akun',
      accountDeleteDesc: 'Anda dapat menghapus akun dan data terkait secara permanen.',
      deleteAccount: 'Hapus akun',
      deleting: 'Menghapus…',
      oldPanel: 'Panel lama (sementara)',
      verifyModalTitle: 'Verifikasi identitas',
      idType: 'Jenis ID',
      idTypeTrId: 'ID Nasional',
      idTypePassport: 'Paspor',
      idTypeDriver: 'SIM',
      verifyPhotosHint: 'Foto hanya digunakan untuk verifikasi.',
      idFront: 'Depan ID',
      idBack: 'Belakang ID',
      selfie: 'Selfie',
      verifyMissingFiles: 'Harap unggah depan/belakang ID dan selfie.',
      verifySubmitted: 'Permintaan verifikasi Anda telah diterima. Sedang ditinjau.',
      submitVerification: 'Kirim',
      confirmDelete: 'Apakah Anda ingin menghapus akun secara permanen? Ini tidak dapat dibatalkan.',

      applySuccess: {
        title: 'Pengajuan diterima',
        subtitle: 'Langkah berikutnya: cek pool dari panel Anda dan ikuti saran kecocokan.',
        steps: [
          'Di pool, profil yang kompatibel akan ditampilkan (pratinjau terbatas).',
          'Jika saling suka, chat 48 jam di dalam situs akan terbuka.',
          'Setelah 48 jam, Anda bisa meminta berbagi kontak; jika disetujui, nomor telepon akan terlihat.',
        ],
        applicationIdLabel: 'ID Pengajuan',
        ctas: {
          pool: 'Buka pool',
          matches: 'Pencocokan saya',
          learn: 'Cara kerja sistem',
        },
      },
    },

    matchProfile: {
      askShort: 'Tanya singkat',
      viewProfile: 'Lihat profil',
      hideProfile: 'Sembunyikan profil',
      prevPhoto: 'Foto sebelumnya',
      nextPhoto: 'Foto berikutnya',
      profileTitle: 'Info profil',
      contactHidden:
        'Detail kontak disembunyikan. Tidak ditampilkan saat mengisi formulir maupun di UI aplikasi. Detail ini hanya dapat dibagikan setelah periode pencocokan aktif 48 jam jika tercapai kecocokan pasti, dan hanya dengan persetujuan Anda.',
      rulesTitle: 'Aturan (singkat)',
      rules: {
        likeFirst: 'Jika suka timbal balik, “Suka timbal balik” terbentuk.',
        startActive: 'Chat panjang terbuka setelah kedua pihak menyetujui “Mulai pencocokan aktif”.',
        onlyOneActive: 'Hanya 1 pencocokan aktif; saat aktif, suka/pesan dengan profil lain terkunci.',
        unlockAfterCancel: 'Profil lain terbuka kembali setelah pencocokan aktif dibatalkan oleh kedua pihak.',
      },
      activeStart: {
        starting: 'Memulai…',
        waiting: 'Menunggu persetujuan',
        start: 'Mulai pencocokan aktif',
        confirmPrompt:
          'Anda akan memulai pencocokan aktif.\n\n- Anda hanya bisa punya 1 pencocokan aktif (profil lain akan terkunci).\n- Setelah aktif, Anda tidak bisa membatalkan selama 2 jam pertama.\n\nApakah Anda setuju?',
      },
      cancel: {
        title: 'Batalkan pencocokan aktif',
        desc: 'Pembatalan bersifat mutual. Setelah Anda membatalkan, pihak lain juga harus membatalkan.',
        cooldown: 'Untuk mencegah penyalahgunaan, pembatalan dinonaktifkan selama 2 jam pertama. Sisa: {{time}}',
        request: 'Batalkan pencocokan aktif',
        requestSent: 'Permintaan pembatalan terkirim',
        waitingOther: 'Menunggu pihak lain membatalkan.',
        confirmPrompt:
          'Anda akan membatalkan pencocokan aktif.\n\n- Pembatalan mutual: pencocokan ditutup setelah kedua pihak membatalkan.\n- Setelah dibatalkan, lock interaksi dengan profil lain dihapus.\n\nApakah Anda setuju?',
      },
      mutualLike: {
        title: 'Anda memiliki suka timbal balik',
        body: 'Chat panjang terbuka hanya setelah kedua pihak menyetujui “Mulai pencocokan aktif”.',
      },
      longChatClosedTitle: 'Chat panjang ditutup',
      longChatClosedBody: 'Chat panjang tersedia hanya setelah memulai pencocokan aktif. Pada tahap ini Anda hanya bisa menggunakan pesan singkat.',
      shortModal: {
        title: 'Pesan singkat',
      },
      time: {
        minutes: '{{minutes}} menit',
        hours: '{{hours}} jam',
        hm: '{{hours}} jam {{minutes}} menit',
      },
      errors: {
        activeMatchLocked: 'Saat Anda punya pencocokan aktif, Anda tidak bisa berinteraksi dengan profil lain. Batalkan pencocokan aktif Anda secara mutual terlebih dahulu.',
        otherUserActiveMatch: 'Pihak lain saat ini memiliki pencocokan aktif. Pencocokan ini tidak bisa diaktifkan.',
        cancelCooldown: 'Untuk mencegah penyalahgunaan, pembatalan dinonaktifkan selama 2 jam pertama. Sisa: {{time}}',
        notAvailable: 'Tindakan ini tidak tersedia pada tahap ini.',
        forbidden: 'Anda tidak diizinkan melakukan tindakan ini.',
        activeStartLocked: 'Anda tidak bisa memulai pencocokan aktif baru saat Anda sudah punya pencocokan aktif.',
      },
    },

    errors: {
      profileNotFound: 'Data profil tidak ditemukan.',
      apiUnavailable: 'API tidak dapat diakses. Untuk local dev, jalankan `npm run dev` (api+web).',
      serverNotConfigured: 'Konfigurasi server belum lengkap. Silakan hubungi dukungan.',
      activeLocked: 'Saat Anda punya pencocokan aktif, Anda tidak bisa berinteraksi dengan profil lain. Batalkan pencocokan aktif Anda secara mutual terlebih dahulu.',
      shortLimit: 'Anda sudah menggunakan semua pesan singkat (5). Untuk lanjut, setelah saling suka Anda harus memulai pencocokan aktif.',
      shortMessageTooLong: 'Pesan terlalu panjang. Maksimal 240 karakter.',
      filtered: 'Jangan bagikan info kontak (tautan, telepon, media sosial).',
      notInTheirAgeRange: 'Rentang usia Anda tidak cocok untuk orang ini.',
      ageRequired: 'Informasi usia Anda belum ada. Silakan lengkapi profil Anda dan coba lagi.',
      notAvailable: 'Tindakan ini tidak tersedia pada tahap ini.',
      forbidden: 'Anda tidak diizinkan melakukan tindakan ini.',
      cancelCooldown: 'Untuk mencegah penyalahgunaan, pembatalan sementara dinonaktifkan. Sisa: {{time}}',
    },
  },

  home: {
    hero: {
      badgeCompany: 'Terdaftar di Indonesia: PT MoonStar Global Indonesia',
      badgeSocial: 'Akun sosial EndonezyaKaşifi',
      title: 'Endonezya Kaşifi',
      subtitle: 'Organisasi tur • Panduan pernikahan • Dukungan langsung di lapangan',
      description:
        'Kami menyiapkan paket tur butik untuk bulan madu, eksplorasi, dan liburan di Indonesia, serta rencana perjalanan yang disesuaikan. Selain itu, kami mendampingi pasangan yang menikah di Indonesia dalam urusan hotel, transportasi, penerjemahan, dan proses dokumen resmi secara bertahap.',
      note: 'Didirikan oleh wirausahawan Turki yang tinggal di Indonesia, berbasis di Indonesia.',
      ctaTours: 'Lihat paket tur',
      ctaBrochures: 'Unduh brosur PDF',
      ctaTrust: 'Kepercayaan & Legal',
    },
    trust: {
      items: [
        {
          title: 'Proses transparan',
          description: 'Pra-pendaftaran → penawaran tertulis → kontrak/pembayaran berjalan jelas.',
        },
        {
          title: 'Dukungan bahasa Turki',
          description: 'Dukungan WhatsApp jalur Turki; operasi di lapangan Indonesia.',
        },
        {
          title: 'Struktur legal',
          description: 'Endonezya Kaşifi adalah merek PT MoonStar Global Indonesia yang terdaftar di Indonesia.',
        },
      ],
    },
    services: {
      title: 'Apa yang kami lakukan untuk Anda?',
      cards: {
        joinTours: {
          title: 'Ikut tur grup',
          description:
            'Anda dapat ikut paket tur terjadwal ke Bali, Lombok, Komodo, dan pulau Indonesia lainnya sendiri, bersama keluarga, atau teman.',
        },
        groupTours: {
          title: 'Organisasi tur korporat',
          description:
            'Untuk perusahaan, sekolah, komunitas, dan kelompok teman, kami menyiapkan tur grup khusus sesuai tanggal, jumlah peserta, dan anggaran; termasuk rapat, acara, dan program team-building.',
        },
        privateTravel: {
          title: 'Perjalanan pribadi / keluarga',
          description:
            'Kami menyiapkan rencana liburan Indonesia yang dipersonalisasi mencakup penerbangan, akomodasi, dan rute—agar Anda menjelajah Bali dan sekitarnya dengan ritme sendiri.',
        },
        wedding: {
          title: 'Konsultasi pernikahan',
          description:
            'Kami mendampingi seluruh proses pernikahan: dokumen, legalitas, penerjemah, transportasi, dan akomodasi agar pernikahan di Indonesia berjalan lancar.',
        },
        youtube: {
          title: 'Video YouTube',
          description:
            'Temukan video pilihan dari perjalanan dan proses pernikahan kami di situs ini, serta tonton video lainnya di YouTube untuk mengenal Indonesia lebih dekat.',
        },
        dameturk: {
          title: 'DaMeTurk (sub-brand)',
          aria: 'DaMeTurk - Es krim Turki asli',
          description:
            'Di bawah PT MoonStar Global Indonesia, kami menjalankan merek DaMeTurk di Indonesia. Kunjungi dameturk.com untuk detail terbaru.',
        },
      },
    },
    howItWorks: {
      title: 'Bagaimana prosesnya?',
      steps: [
        {
          title: '1) Pra-pendaftaran',
          description: 'Gratis dan tidak mengikat. Kami memahami kebutuhan Anda.',
        },
        {
          title: '2) Paket tertulis',
          description: 'Program + termasuk/tidak termasuk + catatan penting dibagikan tertulis.',
        },
        {
          title: '3) Persetujuan & pembayaran',
          description: 'Review kontrak → pembayaran → reservasi dikonfirmasi.',
        },
      ],
      ctaTours: 'Lihat paket tur',
      ctaDocuments: 'Dokumen',
    },
    features: {
      title: 'Mengapa lebih mudah bersama kami?',
      items: [
        {
          title: 'Pendampingan berbasis pengalaman',
          description:
            'Pengalaman tinggal di Indonesia dan mengelola tur di lapangan kami gunakan untuk membantu memilih rute, akomodasi, dan alur harian terbaik.',
        },
        {
          title: 'Komunikasi sederhana & transparan',
          description:
            'Dengan dukungan Bahasa Indonesia, Turki, dan Inggris, kami menjelaskan semua proses dengan jelas dan menghilangkan keraguan sejak awal.',
        },
        {
          title: 'Perencanaan sesuai anggaran',
          description:
            'Kami menyusun biaya perjalanan, akomodasi, dan kebutuhan harian agar mengurangi biaya tak terduga.',
        },
      ],
    },
    cta: {
        open: 'Pesan',
      eyebrow: 'Jangan ragu bertanya',
      title: 'Mari kita jelaskan semua hal tentang Indonesia bersama-sama',
      description:
        'Baik tentang paket tur maupun rencana perjalanan pribadi Anda… Tanyakan semuanya, dan kami bantu menyederhanakan prosesnya.',
      ctaContact: 'Buka formulir kontak',
      ctaWhatsapp: 'Tanya via WhatsApp',
    },
  },

  corporatePage: {
    hero: {
      badge: 'Kepercayaan & Legal',
      description:
        'Halaman ini adalah pusat informasi resmi yang menjawab: “Siapa pemilik situs ini?”, “Pembayaran/penagihan atas nama siapa?”, dan “Kontrak dengan badan hukum mana?”.',
    },
    summary: {
      brandLine:
        'adalah merek dari perusahaan {{company}} yang terdaftar di Indonesia. Pihak kontrak dan proses penagihan dilakukan oleh badan hukum ini.',
      documents: 'Dokumen & Kontrak',
      brochures: 'Brosur tur (PDF)',
    },
    brandInfo: {
      title: 'Informasi merek & perusahaan',
      labels: {
        brand: 'Merek',
        legalName: 'Nama legal',
        tax: 'NPWP',
        nib: 'NIB',
      },
      socialNote: 'Nama akun YouTube dan Instagram kami tetap endonezyakasifi dan mendukung komunikasi merek.',
    },
    contact: {
      title: 'Kontak & alamat',
      trLabel: 'TR / WhatsApp',
      idLabel: 'ID',
    },
    parentCompany: {
      badge: 'Perusahaan induk',
      caption: 'Payung hukum untuk operasi {{brand}}',
    },
        partnerAgeMin: 'Usia min',
        partnerAgeMax: 'Usia max',
    billing: {
      title: 'Pembayaran, penagihan, dan kontrak',
      items: {
        collection: {
          title: 'Penagihan',
          body: 'Pembayaran dapat tercatat atas nama {{company}} pada catatan perbankan.',
        },
        contract: {
          title: 'Pihak kontrak',
          body: 'Dalam kontrak paket tur/penjualan jarak jauh, badan hukum yang tercantum adalah {{company}}.',
        },
      },
    },
    documents: {
      title: 'Pusat dokumen',
      body: 'Semua dokumen, kontrak, dan kebijakan terbaru ada di sini.',
      cta: 'Buka dokumen',
      brochureNote: 'Jika ingin mengunduh brosur PDF:',
      brochureLink: 'Brosur Tur',
    },
    otherBrand: {
      title: 'Merek kami yang lain',
      aria: 'Buka situs DaMeTurk',
      body: 'Merek es krim Turki asli kami di bawah {{company}}.',
    },
    faq: {
      title: 'Pertanyaan singkat yang sering ditanya',
      items: {
        siteCompany: {
          q: 'Situs ini milik perusahaan mana?',
          a: '{{brand}} adalah merek dari {{company}} yang terdaftar di Indonesia. Kontrak dan penagihan dilakukan oleh badan hukum ini.',
        },
        paymentCompany: {
          q: 'Jika di layar pembayaran muncul nama perusahaan berbeda?',
          a: 'Itu normal: karena penagihan dan kontrak dilakukan oleh {{company}}, nama ini dapat muncul di kanal pembayaran.',
        },
        dameturk: {
          q: 'Apakah DaMeTurk milik Anda?',
          a: 'Ya. DaMeTurk adalah salah satu merek di bawah {{company}} dan beroperasi melalui situsnya sendiri.',
        },
      },
    },
  },

  matchmakingHub: {
    metaTitle: "Uniqah",
    badge: "Proses privat & dimoderasi",
    title: "Sistem pencocokan untuk pernikahan",
    description:
      "Sistem pencocokan tertutup yang mempertemukan orang-orang yang serius ingin menikah—dengan syarat yang adil dan aman. Profil tidak publik; sistem menampilkan kandidat paling cocok di panel Anda dan membantu Anda menemukan pasangan yang tepat lebih cepat.",
    actions: {
      apply: "Ajukan pencocokan",
      goPanel: "Profil saya",
      backWedding: "Kembali ke halaman pernikahan",
      supportWhatsApp: "Dukungan WhatsApp",
    },
    whatsappSupportMessage:
      "Halo, saya butuh bantuan terkait sistem pencocokan. Saya punya laporan/permintaan peninjauan.",
    cards: {
      private: {
        title: "Tidak ada profil publik",
        desc: "Profil tidak dipublikasikan; evaluasi ditangani oleh sistem.",
      },
      review: {
        title: "Evaluasi sistem",
        desc: "Saat ada kecocokan, proses berlanjut dengan aman melalui panel Anda.",
      },
      panel: {
        title: "Kelola lewat panel",
        desc: "Anda mengelola pratinjau, kecocokan, dan langkah berikutnya dari panel.",
      },
    },
    how: {
      title: "Bagaimana cara kerjanya?",
      subtitle: "Alur dari daftar hingga komunikasi dibuat terkontrol dan jelas.",
      steps: [
        {
          title: "Daftar dan buat profil",
          desc: "Setelah daftar, Anda membuat profil dengan mengisi formulir.",
        },
        {
          title: "Lihat profil yang cocok di panel",
          desc: "Sistem menampilkan profil paling cocok (pratinjau terbatas).",
        },
        {
          title: "Suka / lewati",
          desc: "Sukai profil yang Anda minati; jika saling suka, tahap pertama selesai.",
        },
        {
          title: "Chat di dalam situs 48 jam",
          desc: "Setelah saling menerima, 48 jam pertama hanya chat di dalam situs untuk saling mengenal dengan aman.",
        },
        {
          title: "Minta berbagi kontak",
          desc: "Setelah 48 jam, Anda bisa mengirim permintaan kontak; jika disetujui, nomor telepon akan terlihat.",
        },
      ],
    },
    matching: {
      title: 'Bagaimana kami mencocokkan?',
      subtitle: 'Tujuannya bukan “acak”; tetapi kesesuaian kriteria dan progres yang aman. Profil Anda tidak publik.',
      badge: 'Kriteria • Persetujuan mutual • Kontak terkontrol',
      points: [
        'Sistem membuat saran dari pool kandidat berdasarkan rentang usia, preferensi inti, dan detail pengajuan.',
        'Interaksi maju dengan persetujuan kedua pihak—tidak ada alur kontak paksa.',
        'Kontak tidak dibagikan langsung: chat 48 jam di dalam situs, lalu persetujuan permintaan kontak.',
      ],
      note: 'Catatan: Bagian ini untuk transparansi. Mekanisme moderasi dan pelaporan tetap berlaku untuk keamanan.',
    },
    safety: {
      title: "Keamanan dan kualitas",
      subtitle:
        "Tidak seperti platform pencarian publik, sistem ini mempersempit ruang gerak pelaku buruk.",
      points: [
        "Karena profil tidak publik, akses yang tidak diinginkan dan gangguan berkurang drastis.",
        "Penipuan dan eksploitasi finansial bisa diblokir cepat lewat deteksi dan laporan.",
        "Kirim laporan ke dukungan WhatsApp; setelah ditinjau, akun dihapus dari sistem.",
      ],
      tagline: 'Moderasi + jalur laporan',
    },

    brandAlt: 'Turk&Indo',
    miniCard: {
      title: 'Uniqah',
      desc: 'Sistem tertutup, kumpulan kandidat terkontrol, dan proses bertahap.',
      stats: {
        privateTitle: 'Privat',
        privateSubtitle: 'profil',
        fairTitle: 'Adil',
        fairSubtitle: 'kecocokan',
        safeTitle: 'Aman',
        safeSubtitle: 'komunikasi',
      },
    },
    benefits: {
      b1Title: 'Keunggulan',
      b1Body: 'Tidak ada browsing publik; proses lebih fokus.',
      b2Title: 'Kontrol',
      b2Body: 'Suka/lewati dan pilih kontak lewat panel.',
      b3Title: 'Cepat',
      b3Body: 'Saran kecocokan fokus pada kesesuaian kriteria.',
    },
    flow: {
      title: 'Proses bertahap',
      badge: 'Alur Uniqah',
    },

    faq: {
      title: 'Pertanyaan yang sering ditanyakan',
      subtitle: 'Jawaban singkat untuk pertanyaan paling umum tentang pengajuan dan prosesnya.',
      sideNote: 'Dukungan WhatsApp selalu tersedia.',
      items: [
        {
          q: 'Apakah profil saya bersifat publik?',
          a: 'Tidak. Profil tidak dipublikasikan; proses berjalan terkontrol melalui panel Anda.',
        },
        {
          q: 'Kapan informasi kontak dibagikan?',
          a: 'Setelah saling menerima, 48 jam pertama hanya chat di dalam situs. Setelah 48 jam, Anda bisa meminta berbagi kontak; jika disetujui, nomor telepon akan terlihat.',
        },
        {
          q: 'Siapa yang bisa melihat foto saya?',
          a: 'Foto digunakan dalam proses dan untuk keamanan. Foto ditampilkan secara terkontrol melalui panel saat pencocokan.',
        },
        {
          q: 'Jika ada perilaku tidak pantas, apa yang harus saya lakukan?',
          a: 'Laporkan ke dukungan WhatsApp dengan bukti (screenshot). Setelah ditinjau, akun dapat dihapus dari sistem.',
        },
      ],
    },

    trust: {
      title: 'Dirancang untuk kepercayaan',
      subtitle: 'Sistem berjalan dengan privasi, moderasi, dan langkah komunikasi yang terkontrol.',
      badge: 'Privasi • Moderasi • Komunikasi terkontrol',
      cards: {
        privacy: {
          title: 'Privasi',
          desc: 'Profil tidak dipublikasikan; hanya ditampilkan dalam proses melalui panel.',
        },
        review: {
          title: 'Kontrol & moderasi',
          desc: 'Alur laporan dan peninjauan membantu menghentikan pelaku buruk dengan cepat.',
        },
        support: {
          title: 'Dukungan',
          desc: 'Jika Anda mengalami kendala, Anda bisa menghubungi kami via WhatsApp.',
        },
      },
    },

    cta: {
      title: 'Siap mulai?',
      subtitle: 'Selesaikan pengajuan dalam 1–3 menit lalu lihat kecocokan di panel Anda.',
    },
  },

  matchmakingPage: {
    title: 'Pengajuan Pencocokan Pernikahan',
    intro:
      'Halaman ini adalah formulir pengajuan untuk pencocokan yang berfokus pada pernikahan. Profil tidak dipublikasikan; pengajuan hanya ditinjau oleh tim kami. Profil yang cocok akan ditampilkan di halaman Profil Anda.',
    privacyNote:
      'Catatan privasi: Data pengajuan Anda diproses untuk pencocokan dan keamanan; profil Anda tidak ditampilkan secara publik. Jika ada pelanggaran aturan, Anda bisa menghubungi dukungan dengan bukti (screenshot, dll.). Pastikan informasi yang Anda isi akurat; Anda bertanggung jawab atas informasi yang Anda masukkan di formulir ini, dan pencocokan dilakukan berdasarkan informasi tersebut. Pengguna yang sengaja memberikan informasi palsu akan diblokir; jika memiliki keanggotaan aktif, akan dibatalkan dan tidak ada pengembalian dana.',
    authGate: {
      message: 'Untuk mengirim pengajuan pencocokan, silakan masuk atau buat akun.',
      login: 'Masuk',
      signup: 'Daftar',
      note: 'Setelah masuk, Anda akan otomatis diarahkan kembali ke halaman ini.',
    },
    bottomNote:
      'Catatan: Ini adalah pendaftaran berfokus pada pernikahan; profil tidak ditampilkan secara publik di situs.',
    form: {
      applicationIdLabel: 'ID Pengajuan',
      wizard: {
        badge: 'Pengajuan Cepat',
        step: 'Langkah {{current}} / {{total}}',
        back: 'Kembali',
        next: 'Lanjut',
        steps: {
          basic: {
            title: 'Kontak & informasi dasar',
            desc: 'Mulai dari informasi inti dan detail kontak Anda.',
          },
          details: {
            title: 'Detail tambahan',
            desc: 'Gaya hidup dan preferensi bahasa membantu pencocokan.',
          },
          identity: {
            title: 'Tentang Anda & yang dicari',
            desc: 'Pilih kewarganegaraan/jenis kelamin dan kriteria pasangan.',
          },
          photos: {
            title: 'Foto & perkenalan singkat',
            desc: 'Unggah 3 foto dan perkenalkan diri secara singkat.',
          },
          preferences: {
            title: 'Preferensi pasangan & persetujuan',
            desc: 'Lengkapi preferensi dan kirim pengajuan Anda.',
          },
        },
      },
      editOnce: {
        usernameLocked: 'Dalam mode edit, nama pengguna tidak dapat diubah (perbaikan satu kali).',
        photosLocked: 'Dalam mode edit, pembaruan foto dinonaktifkan. Anda hanya dapat memperbaiki kolom formulir.',
      },
      photo: {
        choose: 'Pilih file',
        noFileChosen: 'Belum ada file dipilih',
      },
      sections: {
        me: 'Saya',
        lookingFor: 'Yang saya cari',
        moreDetails: 'Detail tambahan',
        partnerPreferences: 'Preferensi calon pasangan',
      },
      contactPrivacyNotice:
        'Detail kontak Anda (WhatsApp/email/Instagram) bersifat privat. Tidak ditampilkan secara publik saat Anda mengisi formulir maupun di tampilan aplikasi. Detail ini hanya dapat dibagikan kepada orang yang benar-benar cocok dengan Anda setelah periode pencocokan aktif 48 jam, dan hanya dengan persetujuan Anda.',
      labels: {
        username: 'Nama pengguna',
        fullName: 'Nama lengkap',
        age: 'Usia',
        city: 'Kota',
        country: 'Negara',
        whatsapp: 'Nomor WhatsApp',
        email: 'Email',
        instagram: 'Instagram (opsional)',
        nationality: 'Kewarganegaraan',
        gender: 'Jenis kelamin',
        lookingForNationality: 'Kewarganegaraan',
        lookingForGender: 'Jenis kelamin',
        height: 'Tinggi (cm)',
        weight: 'Berat (kg)',
        occupation: 'Pekerjaan',
        education: 'Pendidikan',
        educationDepartment: 'Jurusan / Program studi',
        maritalStatus: 'Status pernikahan',
        hasChildren: 'Apakah Anda punya anak?',
        childrenCount: 'Jika ya, berapa?',
        childrenLivingSituation: 'Apakah Anda tinggal bersama anak Anda?',
        incomeLevel: 'Tingkat pendapatan',
        religion: 'Agama',
        religiousValues: 'Nilai keagamaan (singkat)',
        nativeLanguage: 'Bahasa ibu',
        nativeLanguageOther: 'Bahasa ibu (tuliskan)',
        foreignLanguages: 'Bahasa asing',
        foreignLanguageOther: 'Bahasa asing lain (tuliskan)',
        communicationLanguages: 'Bagaimana Anda berencana berkomunikasi?',
        communicationLanguageOther: 'Bahasa lain (tuliskan)',
        smoking: 'Merokok?',
        alcohol: 'Minum alkohol?',
        familyApprovalStatus: 'Apakah keluarga Anda akan menyetujui menikah dengan orang asing?',
        marriageTimeline: 'Kapan Anda ingin menikah?',
        relocationWillingness: 'Apakah Anda bersedia tinggal di luar negara Anda?',
        preferredLivingCountry: 'Negara tempat tinggal yang diinginkan',

        photos: 'Foto (3)',
        photo1: 'Foto 1',
        photo2: 'Foto 2',
        photo3: 'Foto 3',

        about: 'Perkenalan singkat',
        expectations: 'Harapan / kriteria yang dicari',

        partnerHeightMin: 'Tinggi pasangan (min)',
        partnerHeightMax: 'Tinggi pasangan (maks)',
        partnerAgeMaxOlderYears: 'Maks. lebih tua dari saya (tahun)',
        partnerAgeMaxYoungerYears: 'Maks. lebih muda dari saya (tahun)',
        partnerMaritalStatus: 'Status pernikahan pasangan',
        partnerReligion: 'Agama pasangan',
        partnerCommunicationLanguages: 'Bahasa komunikasi pasangan',
        partnerCommunicationMethods: 'Metode komunikasi pasangan',
        partnerCommunicationLanguageOther: 'Bahasa lain untuk pasangan (tuliskan)',
        partnerTranslationApp: 'Aplikasi terjemahan untuk pasangan',
        partnerLivingCountry: 'Negara tinggal pasangan',
        partnerSmokingPreference: 'Preferensi merokok pasangan',
        partnerAlcoholPreference: 'Preferensi alkohol pasangan',
        partnerChildrenPreference: 'Preferensi anak pasangan',
        partnerEducationPreference: 'Preferensi pendidikan pasangan',
        partnerOccupationPreference: 'Preferensi pekerjaan pasangan',
        partnerFamilyValuesPreference: 'Preferensi nilai keluarga pasangan',
      },
      placeholders: {
        username: 'contoh: moonstar_34',
        fullName: 'contoh: Siti Aisyah',
        age: 'contoh: 29',
        city: 'contoh: Jakarta',
        country: 'contoh: Indonesia',
        whatsapp: 'contoh: +62 8xx xxxx xxxx',
        email: 'contoh: contoh@mail.com',
        instagram: 'contoh: @username',
        height: 'contoh: 165',
        weight: 'contoh: 55',
        occupation: 'contoh: Guru / Dokter / Insinyur',
        educationDepartment: 'contoh: Teknik Informatika',
        childrenCount: 'contoh: 1',
        nativeLanguageOther: 'tuliskan bahasa Anda',
        foreignLanguageOther: 'tuliskan bahasa',
        communicationLanguageOther: 'tuliskan bahasa',
        religiousValues: 'contoh: menjalankan ibadah, moderat, dsb.',
        about: 'Ceritakan singkat tentang diri Anda',
        partnerCommunicationLanguageOther: 'tuliskan bahasa',
        expectations: 'Tulis kriteria/harapan Anda',
      },
      options: {
        common: {
          select: 'Pilih',
          yes: 'Ya',
          no: 'Tidak',
          unsure: 'Belum yakin',
      confirmGender: {
        title: 'Konfirmasi gender',
        text: 'Anda memilih gender Anda sebagai "{{gender}}". Konfirmasi?',
        cancel: 'Batal',
        confirm: 'Konfirmasi',
      },
      hints: {
        lookingForGenderAuto: 'Gender yang Anda cari diatur otomatis berdasarkan gender Anda.',
      },
          doesntMatter: 'Tidak masalah',
        },
        nationality: {
          tr: 'Turki',
          id: 'Indonesia',
          other: 'Lainnya',
        },
        gender: {
          male: 'Pria',
          female: 'Wanita',
        },
        maritalStatus: {
          single: 'Lajang',
          widowed: 'Duda/Janda (ditinggal)',
          divorced: 'Bercerai',
          other: 'Lainnya',
          doesnt_matter: 'Tidak masalah',
        },
        childrenLivingSituation: {
          withChildren: 'Saya tinggal bersama anak saya',
          separate: 'Saya tinggal terpisah dari anak saya',
        },
        religiousValues: {
          weak: 'Rendah',
          medium: 'Sedang',
          conservative: 'Konservatif',
        },
        partnerCommunicationMethods: {
          ownLanguage: 'Bahasa saya',
          foreignLanguage: 'Bahasa asing',
          translationApp: 'Aplikasi terjemahan',
        },
        education: {
          secondary: 'SMP',
          highSchool: 'SMA/SMK',
          university: 'Sarjana',
          masters: 'Magister',
          phd: 'Doktor',
          other: 'Lainnya',
        },
        occupation: {
          civilServant: 'PNS',
          employee: 'Karyawan',
          retired: 'Pensiunan',
          businessOwner: 'Wirausaha',
          other: 'Lainnya',
        },
        income: {
          low: 'Rendah',
          medium: 'Sedang',
          good: 'Baik',
          veryGood: 'Sangat baik',
          preferNot: 'Memilih tidak menjawab',
        },
        religion: {
          islam: 'Islam',
          christian: 'Kristen',
          hindu: 'Hindu',
          buddhist: 'Buddha',
          other: 'Lainnya',
        },
        languageLevel: {
          none: 'Tidak bisa',
          basic: 'Dasar',
          intermediate: 'Menengah',
          advanced: 'Mahir',
          native: 'Penutur asli',
        },
        commLanguage: {
          tr: 'Bahasa Turki',
          id: 'Bahasa Indonesia',
          en: 'Bahasa Inggris',
          translationApp: 'Aplikasi terjemahan',
          other: 'Lainnya',
        },
        livingCountry: {
          tr: 'Turki',
          id: 'Indonesia',
        },
        timeline: {
          '0_3': '0–3 bulan',
          '3_6': '3–6 bulan',
          '6_12': '6–12 bulan',
          '1_plus': '1 tahun+',
        },
        foreignLanguages: {
          none: 'Tidak ada',
        },
        familyValues: {
          religious: 'Religius',
          liberal: 'Modern/Liberal',
        },
        partnerChildren: {
          wantChildren: 'Ingin punya anak',
          noChildren: 'Tidak ingin anak',
        },
        ageDiff: {
          none: 'Tidak ada',
          years_one: '{{count}} tahun',
          years_other: '{{count}} tahun',
        },
      },
      hints: {
        foreignLanguages: 'Jika tidak ada, pilih “Tidak ada”. Jika memilih “Lainnya”, tuliskan bahasanya.',
        partnerAgeNeedsYourAge: 'Rentang usia dihitung berdasarkan usia Anda.',
        partnerAgeComputed: 'Perkiraan rentang usia: {{min}}–{{max}}',
      },
      photoHint: 'Silakan unggah 3 foto terbaru yang jelas (wajah terlihat), tanpa filter berat.',
      consents: {
        age: 'Saya berusia 18+.',
        privacy: 'Saya menyetujui pemrosesan data sesuai kebijakan privasi.',
        terms: 'Saya telah membaca dan menyetujui <termsLink>Syarat & Ketentuan</termsLink>.',
        photo: 'Saya menyetujui penggunaan foto untuk proses pencocokan (tidak dipublikasikan).',
      },
      submit: 'Kirim pengajuan',
      submitting: 'Mengirim…',
      success: 'Pengajuan Anda berhasil dikirim.',
      errors: {
        honeypotTriggered: 'Pengiriman diblokir (terdeteksi spam).',
        tooFast: 'Anda mengirim terlalu cepat. Silakan coba lagi.',
        rateLimited: 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
        consentsRequired:
          'Untuk mengirim, Anda harus menyetujui kotak persetujuan (18+, kebijakan privasi, syarat & ketentuan, persetujuan foto).',
        recaptchaFailed: 'Verifikasi keamanan gagal. Silakan coba lagi.',
        recaptchaRejected: 'Verifikasi keamanan ditolak. Silakan coba lagi.',

        username: 'Nama pengguna wajib diisi.',
        usernameTaken: 'Nama pengguna ini sudah digunakan.',
        fullName: 'Nama lengkap wajib diisi.',
        age: 'Usia wajib diisi.',
        ageRange: 'Usia harus berada pada rentang yang wajar.',
        city: 'Kota wajib diisi.',
        country: 'Negara wajib diisi.',
        whatsapp: 'Nomor WhatsApp wajib diisi.',
        email: 'Email wajib diisi.',
        nationality: 'Kewarganegaraan wajib dipilih.',
        gender: 'Jenis kelamin wajib dipilih.',
        lookingForNationality: 'Kewarganegaraan pasangan wajib dipilih.',
        lookingForGender: 'Jenis kelamin pasangan wajib dipilih.',

        heightRequired: 'Tinggi wajib diisi.',
        heightRange: 'Tinggi harus berada pada rentang yang wajar.',
        weightRequired: 'Berat wajib diisi.',
        weightRange: 'Berat harus berada pada rentang yang wajar.',

        occupation: 'Pekerjaan wajib diisi.',
        education: 'Pendidikan wajib dipilih.',
        educationDepartment: 'Silakan isi jurusan/program studi Anda.',
        maritalStatus: 'Status pernikahan wajib dipilih.',
        hasChildren: 'Silakan pilih apakah Anda punya anak.',
        childrenCount: 'Silakan isi jumlah anak.',
        childrenLivingSituation: 'Silakan pilih kondisi tinggal dengan anak Anda.',
        incomeLevel: 'Tingkat pendapatan wajib dipilih.',
        religion: 'Agama wajib dipilih.',
        religiousValues: 'Nilai keagamaan wajib diisi.',
        familyApprovalStatus: 'Silakan pilih persetujuan keluarga.',
        marriageTimeline: 'Silakan pilih rencana waktu menikah.',
        relocationWillingness: 'Silakan pilih kesediaan pindah negara.',
        preferredLivingCountry: 'Silakan pilih negara tinggal yang diinginkan.',

        nativeLanguage: 'Bahasa ibu wajib dipilih.',
        nativeLanguageOther: 'Silakan tuliskan bahasa ibu Anda.',
        foreignLanguages: 'Silakan pilih minimal satu opsi bahasa asing.',
        foreignLanguageOther: 'Silakan tuliskan bahasa asing lainnya.',
        communicationLanguage: 'Silakan pilih cara komunikasi.',
        communicationLanguageOther: 'Silakan tuliskan bahasa lain untuk komunikasi.',
        smoking: 'Silakan pilih status merokok.',
        alcohol: 'Silakan pilih status alkohol.',

        partnerHeightMin: 'Silakan pilih tinggi pasangan (min).',
        partnerHeightMax: 'Silakan pilih tinggi pasangan (maks).',
        partnerHeightRange: 'Rentang tinggi pasangan tidak valid.',
        partnerAgeMaxOlderYears: 'Silakan pilih batas usia lebih tua.',
        partnerAgeMaxYoungerYears: 'Silakan pilih batas usia lebih muda.',
        partnerMaritalStatus: 'Silakan pilih status pernikahan pasangan.',
        partnerReligion: 'Silakan pilih agama pasangan.',
        partnerCommunicationLanguage: 'Silakan pilih bahasa komunikasi pasangan.',
        partnerCommunicationLanguageOther: 'Silakan tuliskan bahasa komunikasi pasangan.',
        partnerTranslationApp: 'Silakan pilih preferensi aplikasi terjemahan.',
        partnerLivingCountry: 'Silakan pilih negara tinggal pasangan.',
        partnerSmokingPreference: 'Silakan pilih preferensi merokok pasangan.',
        partnerAlcoholPreference: 'Silakan pilih preferensi alkohol pasangan.',
        partnerChildrenPreference: 'Silakan pilih preferensi anak pasangan.',
        partnerEducationPreference: 'Silakan pilih preferensi pendidikan pasangan.',
        partnerOccupationPreference: 'Silakan pilih preferensi pekerjaan pasangan.',
        partnerFamilyValuesPreference: 'Silakan pilih preferensi nilai keluarga pasangan.',

        about: 'Perkenalan singkat wajib diisi.',
        expectations: 'Harapan/kriteria wajib diisi.',

        photo1Required: 'Foto 1 wajib diunggah.',
        photo2Required: 'Foto 2 wajib diunggah.',
        photo3Required: 'Foto 3 wajib diunggah.',
        photoType: 'Silakan unggah file gambar yang valid (JPG/PNG/WebP).',
        photoUploadFailed: 'Unggah foto gagal. Silakan coba lagi.',

        mustLogin: 'Anda harus masuk untuk mengirim pengajuan.',
        blocked: 'Akun Anda diblokir dari pengajuan.',
        permissionDenied: 'Izin ditolak. Silakan hubungi dukungan.',
        submitFailed: 'Pengiriman gagal. Silakan coba lagi.',
      },
    },
  },

  authPage: {
    title: "Masuk / Daftar",
    context: {
      payment: "Silakan masuk untuk melanjutkan ke pembayaran.",
      panel: "Silakan masuk untuk melanjutkan ke profil Anda.",
      generic: "Silakan masuk untuk melanjutkan.",
    },
    forceInfo:
      "Aksi ini meminta login ulang. Silakan masuk kembali.",
    googleCta: "Lanjut dengan Google",
    googleSignupCta: "Daftar dengan Google",
    redirecting: "Mengarahkan ke masuk Google…",
    signupGuide: "Untuk mendaftar, pilih jenis kelamin dan kewarganegaraan, lalu konfirmasi batas usia.",
    or: "atau",
    labels: {
      email: 'Email',
      password: 'Kata sandi',
      gender: 'Jenis kelamin',
      nationality: 'Kewarganegaraan',
      nationalityOther: 'Kewarganegaraan lain (tulis)',
    },
    placeholders: {
      email: 'contoh@email.com',
      password: 'Kata sandi Anda',
      nationality: 'Pilih kewarganegaraan',
      nationalityOther: 'contoh: Jerman',
    },
    actions: {
      login: 'Masuk',
      signup: 'Daftar',
      switchToSignup: 'Belum punya akun? Daftar',
      switchToLogin: 'Sudah punya akun? Masuk',
      forgot: 'Lupa kata sandi',
    },
    signup: {
      genderMale: 'Saya laki-laki',
      genderFemale: 'Saya perempuan',
      nationalityTr: 'Turki',
      nationalityId: 'Indonesia',
      nationalityOther: 'Lainnya',
      ageConfirm: 'Saya mengonfirmasi bahwa saya berusia minimal {{minAge}} tahun. (Buka perjanjian untuk detail)',
      ageConfirmLink: 'Perjanjian',
    },
    forgotHint: {
      prefix: 'Jika Anda lupa kata sandi, klik',
      suffix: 'untuk menerima tautan reset melalui email.',
    },
    legal: {
      prefix: 'Dengan melanjutkan, Anda menyetujui',
      contract: 'Perjanjian Pengguna / Keanggotaan',
      cancelRefund: 'Kebijakan pembatalan & refund',
      privacy: 'Kebijakan Privasi',
    },
    resetSent: 'Tautan reset kata sandi telah dikirim ke email Anda.',
    errors: {
      googleFailed: 'Masuk dengan Google gagal.',
      invalidCredential: 'Email atau kata sandi salah (atau akun tidak ditemukan). Jika Anda lupa kata sandi, gunakan “Lupa kata sandi”.',
      invalidEmail: 'Alamat email tampak tidak valid. Silakan periksa dan coba lagi.',
      emailAlreadyInUse: 'Akun dengan email ini sudah ada. Silakan masuk atau gunakan “Lupa kata sandi”.',
      weakPassword: 'Kata sandi terlalu lemah. Silakan pilih kata sandi yang lebih kuat (mis. minimal 6 karakter).',
      emailPasswordRequired: 'Email dan kata sandi wajib diisi.',
      genderRequired: 'Pilih jenis kelamin untuk mendaftar.',
      nationalityRequired: 'Pilih kewarganegaraan untuk mendaftar.',
      nationalityOtherRequired: 'Tuliskan kewarganegaraan Anda.',
      ageConfirmRequired: 'Untuk mendaftar, Anda harus mengonfirmasi bahwa Anda berusia minimal {{minAge}} tahun.',
      loginFailed: 'Gagal masuk.',
      resetEmailRequired: 'Masukkan email untuk mereset kata sandi.',
      resetFailed: 'Tidak dapat mengirim email reset kata sandi.',
      emailNotVerified: 'Email belum diverifikasi. Silakan klik tautan verifikasi di inbox Anda.',
      emailVerificationSent: 'Email verifikasi telah dikirim. Silakan cek inbox Anda.',
      emailVerificationSend: 'Kirim ulang email verifikasi',
      emailVerificationFailed: 'Email verifikasi gagal dikirim. Silakan coba lagi.',
    },
  },

  matchmakingPanel: {
        profile: {
          guidanceAfterConfirm: {
            title: 'Dukungan setelah konfirmasi',
            body:
              'Setelah keputusan kecocokan final, Anda bisa mendapatkan layanan dari tim pendamping kami melalui halaman panduan pernikahan untuk membantu membangun kepercayaan antar kandidat serta dukungan seperti komunikasi antar keluarga, penerjemah, verifikasi kebenaran informasi sebelum keputusan pernikahan, dan banyak kemudahan lainnya.',
            cta: 'Buka panduan pernikahan',
          },
        },
    title: 'Profil Saya',
    subtitle: 'Langkah pencocokan, keanggotaan, dan kontak Anda akan tampil di sini.',
    tabs: {
      info: 'Info/Aturan',
      matches: 'Kecocokan saya',
    },
    photos: {
      title: 'Foto saya',
      lead: 'Foto yang Anda unggah saat mengisi formulir.',
      empty: 'Belum ada foto yang diunggah.',
      updateRequest: {
        title: 'Permintaan pembaruan foto',
        lead: 'Unggah 3 foto baru. Foto akan diperbarui setelah disetujui admin.',
        pending: 'Sedang ditinjau',
        cta: 'Kirim permintaan',
        uploading: 'Mengunggah…',
        success: 'Permintaan diterima. Foto akan diperbarui setelah ditinjau.',
        errors: {
          photosRequired: 'Silakan pilih 3 foto.',
          photoType: 'Silakan pilih file gambar saja (jpg/png/webp).',
          applicationNotFound: 'Pengajuan tidak ditemukan. Silakan isi formulir terlebih dahulu.',
          failed: 'Tidak bisa mengirim permintaan. Silakan coba lagi.',
        },
      },
    },
    trust: {
      title: 'Kenapa kami meminta Anda mengisi formulir?',
      lead:
        'Ini bukan sekadar melihat-lihat secara acak. Ini adalah sistem pencocokan tertutup yang bekerja berdasarkan informasi Anda. Mengisi formulir sekali membantu kami memilih kandidat yang cocok dengan lebih akurat dan menjalankan proses dengan aman. Profil Anda tidak ditampilkan secara publik.',
      cards: {
        quality: {
          title: 'Pencocokan lebih tepat',
          body: 'Detail utama seperti usia, lokasi, dan harapan membantu kami menemukan kandidat yang sesuai lebih cepat.',
        },
        privacy: {
          title: 'Privasi diutamakan',
          body: 'Profil Anda tidak bersifat publik. Kandidat muncul di panel Anda secara terkontrol; kontak tidak dibagikan tanpa persetujuan kedua pihak.',
        },
        control: {
          title: 'Anda tetap memegang kendali',
          body: 'Anda melanjutkan proses dengan terima/tolak di panel. Jika perlu perubahan, Anda bisa memperbarui lewat WhatsApp.',
        },
      },
      rulesTitle: 'Aturan sistem (singkat)',
      rules: [
        'Sistem ini dirancang hanya untuk orang yang berniat menikah.',
        'Niat untuk flirting, hiburan, mengisi waktu luang, atau hubungan di luar tujuan pernikahan sama sekali tidak diperbolehkan.',
        'Saling menghormati sangat penting di situs ini; kata-kata kasar, bahasa gaul yang menghina, dan ujaran merendahkan dilarang.',
        'Perilaku tidak bermoral tidak akan ditoleransi.',
        'Penipuan, upaya mengelabui, jebakan uang digital/kripto, atau upaya mencari keuntungan serupa dilarang.',
        'Pelecehan seksual sama sekali dilarang.',
        'Pelanggar aturan akan diblokir segera setelah pelanggaran terdeteksi; jika ada keanggotaan aktif akan dibatalkan dan tidak ada pengembalian dana.',
        'Siapa pun yang membuat akun dianggap telah membaca dan menyetujui aturan ini.',
      ],
    },
    actions: {
      logout: 'Keluar',
      profileForm: 'Formulir profil',
      whatsapp: 'Chat via WhatsApp',
      remove: 'Hapus',
      sending: 'Mengirim…',
      pending: 'Menunggu…',
      accept: 'Setujui',
      accepted: 'Disetujui',
      reject: 'Tolak',
      rejected: 'Ditolak',
      rejectAll: 'Tolak semua',
      rejectAllConfirm: 'Yakin ingin menolak semua kandidat?',
      rejectAllSuccess_one: '{{count}} kecocokan ditolak.',
      rejectAllSuccess_other: '{{count}} kecocokan ditolak.',
      showOldMatches: 'Tampilkan kandidat sebelumnya',
      hideOldMatches: 'Tampilkan hanya pilihan saya',
      dismissMatch: 'Hapus kecocokan dari panel saya',
      requestNew: 'Minta kecocokan baru',
      requestNewWithRemaining: 'Minta kecocokan baru ({{remaining}}/{{limit}})',
      requestingNew: 'Mengirim permintaan…',
      requestNewQuotaHint: 'Kuota harian: {{remaining}}/{{limit}}',
      requestNewSuccess: 'Permintaan Anda diterima. Kandidat baru akan muncul jika tersedia.',
      freeSlot: 'Kosongkan slot (harian 1)',
      freeSlotHint: 'Ini membuka slot khusus untuk pendaftar baru. Slot akan tetap kosong sampai muncul kecocokan {{threshold}}+ dari pengguna baru. Jika ingin kandidat langsung dari pool yang ada, gunakan “Minta kecocokan baru”.',
      freeSlotConfirm: 'Hapus kandidat ini dan buka slot pendaftar baru? (Harian 1)',
      freeSlotSuccess: 'Slot dikosongkan. {{creditGranted}} kredit diberikan. Slot akan tetap kosong sampai pendaftar baru ({{threshold}}+) cocok dengan Anda. Cooldown: {{remaining}}',
      removedCreditNotice: 'Kecocokan ini dihapus dari daftar Anda. 1 kredit diberikan untuk meminta kecocokan baru. Cooldown: {{remaining}}',
    },
    profileForm: {
      loading: 'Memuat formulir…',
      empty: 'Formulir pengajuan pencocokan belum ditemukan. Silakan isi formulir terlebih dahulu.',
      openOriginalEditOnce: 'Buka formulir asli (edit satu kali)',
      detailsToggle: 'Tampilkan detail pengajuan',
      applicationId: 'ID Pengajuan',
      applicantNationality: 'Kewarganegaraan Anda',
      applicantGender: 'Jenis kelamin Anda',
      partnerNationality: 'Kewarganegaraan orang yang Anda cari',
      partnerGender: 'Jenis kelamin orang yang Anda cari',
      moreDetailsTitle: 'Detail lainnya',
      partnerPrefsTitle: 'Preferensi pasangan',
      editOnceTitle: 'Perbaiki formulir (satu kali)',
      editOnceLead:
        'Jika Anda meninggalkan kolom kosong atau mengisi sesuatu dengan salah, Anda dapat memperbaruinya di sini. Ini hanya bisa digunakan satu kali (setelah disimpan tidak bisa diubah lagi).',
      editOnceCta: 'Simpan perubahan (satu kali)',
      editOnceSaving: 'Menyimpan…',
      editOnceSuccess: 'Pembaruan diterima. Formulir Anda telah diperbarui.',
      editOnceUsed: 'Hak edit satu kali sudah digunakan. Formulir tidak dapat diedit lagi.',
      editOnceErrors: {
        failed: 'Pembaruan gagal. Silakan coba lagi.',
        empty: 'Anda tidak dapat mengirim pembaruan kosong. Isi setidaknya satu kolom.',
        notFound: 'Pengajuan tidak ditemukan. Anda harus mengisi formulir terlebih dahulu.',
      },
    },
    activation: {
      title: 'Aktivasi keanggotaan & pembayaran',
      lead:
        'Anda dapat mengikuti langkah aktivasi/membuka aksi dari sini. Jika keanggotaan Anda belum aktif, lakukan pembayaran dan kirim “laporan pembayaran” dengan bukti/nomor referensi (keanggotaan aktif setelah persetujuan admin).',
      freePaidMembershipCta: 'Aktifkan keanggotaan saya gratis',
      paidMembershipCta: 'Aktifkan keanggotaan',
      freeActiveTitle: 'Wanita: keanggotaan aktif gratis',
      freeActiveBody:
        'Jika identitas Anda terverifikasi, Anda dapat mengajukan keanggotaan aktif gratis. Ini dapat membuka aksi tanpa keanggotaan berbayar (aturan tidak aktif 48/24 jam berlaku).',
      freeActiveNeedsVerification: 'Verifikasi identitas diperlukan untuk keanggotaan aktif gratis.',
      paymentTitle: 'Keanggotaan berbayar (bulanan) / pembayaran',
      paymentBody:
        'Untuk mengaktifkan keanggotaan, lakukan pembayaran dengan salah satu metode di bawah ini, lalu kirim laporan pembayaran dengan detail bukti/referensi.',
      selectMatchTitle: 'Pilih kecocokan untuk laporan pembayaran',
      selectMatchHelp:
        'Secara teknis, laporan pembayaran terhubung ke sebuah kecocokan. Jika Anda belum punya kecocokan, hubungi dukungan via WhatsApp.',
      selectMatchPlaceholder: 'Pilih kecocokan…',
      matchOption: '{{status}} • {{matchCode}}',
      selectMatchRequired: 'Anda harus memilih kecocokan untuk mengirim laporan pembayaran.',
    },
    choice: {
      title: 'Anda memilih satu kandidat.',
      body: 'Kandidat lain tidak dihapus. Anda bisa memilih untuk menampilkan hanya pilihan Anda atau melihat kandidat sebelumnya kapan saja.',
    },
    errors: {
      actionFailed: 'Aksi gagal.',
      rejectAllFailed: 'Gagal menolak semua.',
      membershipRequired: 'Keanggotaan aktif diperlukan untuk setuju/tolak.',
      verificationRequired: 'Verifikasi identitas diperlukan untuk melakukan aksi ini.',
      membershipOrVerificationRequired: 'Aksi ini membutuhkan keanggotaan berbayar atau (untuk wanita) verifikasi identitas + keanggotaan aktif gratis.',
      freeActiveMembershipRequired: 'Aksi ini membutuhkan keanggotaan aktif gratis Anda. Jika sudah terverifikasi, Anda bisa mengajukan dari panel.',
      freeActiveMembershipBlocked: 'Hak keanggotaan aktif gratis Anda dinonaktifkan. Anda perlu keanggotaan berbayar untuk aksi ini.',
      otherUserMatched: 'Orang ini sudah cocok dengan orang lain.',
      alreadyMatched: 'Anda sudah memiliki kecocokan.',
      userLocked: 'Proses kecocokan Anda terkunci. Aksi ini tidak diizinkan.',
      pendingContinueExists: 'Anda sudah memilih seseorang untuk dilanjutkan. Putuskan dulu di kecocokan itu.',
      requestNewFailed: 'Tidak bisa meminta kecocokan baru.',
      requestNewRateLimited: 'Anda terlalu sering meminta. Silakan coba lagi nanti.',
      requestNewQuotaExhausted: 'Kuota permintaan kecocokan baru hari ini sudah habis (3/3). Silakan coba lagi besok.',
      requestNewFreeActiveBlocked: 'Anda tidak bisa meminta kecocokan baru karena hak keanggotaan aktif gratis Anda dibatalkan. Anda perlu keanggotaan berbayar untuk mengaktifkan kembali.',
      freeSlotFailed: 'Aksi mengosongkan slot gagal.',
      freeSlotQuotaExhausted: 'Kuota mengosongkan slot hari ini sudah habis (1/1). Silakan coba lagi besok.',
      cooldownActive: 'Silakan tunggu sebentar sebelum mencoba lagi. Sisa: {{remaining}}',
      newUserSlotAlreadyActive: 'Slot pendaftar baru Anda sudah aktif. Tunggu pendaftar baru yang cocok, atau gunakan refresh normal.',
    },
    afterSubmit: {
      title: 'Pengajuan Anda diterima.',
      body: 'Anda dapat melihat detail pengajuan di bawah. Jika perlu perubahan, hubungi kami via WhatsApp.',
    },
    account: {
      title: 'Akun',
      usernameLabel: 'Nama pengguna',
      nameLabel: 'Nama',
    },
    application: {
      title: 'Pengajuan Pencocokan Pernikahan',
      empty: 'Anda belum memiliki pengajuan pencocokan.',
      goToForm: 'Buka formulir pengajuan',
      fallbackName: 'Pengajuan',
      profileNo: 'Kode Pengajuan',
      username: 'Nama pengguna',
      applicationId: 'ID Pengajuan',
      photoAlt: 'Profil',
    },
    common: {
      status: 'Status',
      age: 'Usia',
      whatsapp: 'WhatsApp',
      email: 'Email',
      instagram: 'Instagram',
      cityCountry: 'Kota/Negara',
    },
    statuses: {
      proposed: 'Diusulkan',
      mutual_accepted: 'Disetujui bersama',
      contact_unlocked: 'Kontak dibuka',
      cancelled: 'Dibatalkan',
      rejected: 'Ditolak',
      pending: 'Menunggu',
      approved: 'Disetujui',
    },
    update: {
      title: 'Perbarui info',
      body: 'Kami tidak mengubah formulir secara online. Jika ingin memperbarui info, silakan chat via WhatsApp.',
      whatsappMessage: 'Saya ingin memperbarui informasi pengajuan pencocokan pernikahan saya.\nNama lengkap: {{fullName}}\nKode pengajuan: {{profileCode}}',
    },
    onboarding: {
      title: 'Sebelum mulai',
      intro:
        'Panel ini untuk mengelola proses pencocokan. Untuk membuat profil, Anda mengisi formulir sekali. Setelah profil dibuat, setiap login berikutnya langsung membuka panel ini.',
      rulesTitle: 'Tujuan sistem & aturan',
      rules: {
        r1: 'Ini bukan area melihat profil publik; profil tidak dipublikasikan secara terbuka.',
        r2: 'Informasi digunakan untuk pencocokan dan komunikasi yang aman.',
        r3: 'Jika ada kecocokan, kandidat muncul di panel Anda; Anda lanjut dengan suka/lewati.',
        r4: 'Berbagi kontak dibuka berdasarkan persetujuan bersama dan aturan yang berlaku.',
      },
      confirm: 'Saya sudah membaca penjelasan dan aturan.',
      createProfile: 'Buat profil',
      startForm: 'Isi formulir untuk memulai pencocokan',
      howWorks: 'Bagaimana sistem bekerja?',
      note: 'Catatan: Setelah membuat profil, kirim formulir satu kali. Login berikutnya tidak akan diarahkan ke formulir lagi.',
    },
    membership: {
      title: 'Status keanggotaan',
      active: 'Keanggotaan Anda aktif.',
      inactive: 'Keanggotaan tidak aktif. Sampai aktif, Anda tidak bisa melihat detail penuh atau memberi suka/tolak.',
      inactiveMale: 'Keanggotaan tidak aktif. Sampai aktif, Anda tidak bisa melihat detail penuh atau memberi suka/tolak.',
      inactiveFemale: 'Keanggotaan tidak aktif. Pencocokan dan pratinjau terbatas gratis. Untuk melakukan aksi, Anda perlu keanggotaan aktif gratis (dengan verifikasi) atau keanggotaan berbayar.',
      activeViaVerification: 'Identitas Anda terverifikasi. Untuk melakukan aksi, Anda bisa mengajukan keanggotaan aktif gratis atau membeli keanggotaan berbayar.',
      freeActiveActive: 'Keanggotaan aktif gratis Anda aktif (melalui verifikasi identitas).',
      freeActiveTermsTitle: 'Syarat keanggotaan aktif gratis',
      freeActiveTermsBody: 'Jika Anda mendapatkan keanggotaan aktif gratis lewat verifikasi identitas dan tidak aktif selama 48 jam, keanggotaan aktif gratis akan dibatalkan. Saat mengajukan kembali, batas waktu turun menjadi 24 jam. Jika tetap tidak aktif, Anda tidak bisa mendapatkan keanggotaan aktif gratis sampai membeli keanggotaan berbayar, dan Anda tidak bisa meminta kecocokan baru.',
      freeActiveApply: 'Ajukan keanggotaan aktif gratis',
      freeActiveApplying: 'Mengajukan…',
      freeActiveApplied: 'Keanggotaan aktif gratis Anda diaktifkan. Durasi: {{hours}} jam.',
      daysLeft_one: 'Sisa waktu: {{count}} hari.',
      daysLeft_other: 'Sisa waktu: {{count}} hari.',
      until: 'Berakhir: {{date}}.',
    },
    membershipNotice: {
      title: 'Info suka / detail / kontak',
      male: {
        lead: 'Alur untuk pengguna pria:',
        points: [
          'Pencocokan dan pratinjau terbatas gratis.',
          'Melihat detail penuh, suka/tolak, dan menghubungi memerlukan membership berbayar.',
        ],
      },
      female: {
        lead: 'Alur untuk pengguna wanita:',
        points: [
          'Pencocokan dan pratinjau terbatas gratis.',
          'Melihat detail penuh, suka/tolak, dan menghubungi memerlukan verifikasi identitas + free active membership atau membership berbayar.',
          'Free active membership memiliki aturan tidak aktif (lihat bagian syarat di panel).',
        ],
      },
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Alur sistem, aturan, dan FAQ — di satu tempat.',
      faq: {
        title: 'Pertanyaan umum (FAQ)',
        items: [
          {
            q: 'Kenapa saya tidak melihat profil secara publik?',
            a: 'Ini adalah sistem tertutup. Profil tidak ditampilkan publik; kandidat paling cocok muncul di panel Anda.',
          },
          {
            q: 'Apa yang diperlukan untuk suka / detail / kontak?',
            a: 'Untuk pengguna pria, membership berbayar diperlukan. Untuk pengguna wanita, verifikasi identitas + free active membership atau membership berbayar diperlukan.',
          },
          {
            q: 'Untuk apa verifikasi identitas?',
            a: 'Sebagai lencana kepercayaan. Membantu proses keluhan dengan bukti dan (untuk wanita) dapat membuka alur free active membership.',
          },
          {
            q: 'Jika ada perilaku mencurigakan/penipuan, apa yang harus saya lakukan?',
            a: 'Hubungi dukungan WhatsApp. Setelah ditinjau, akun dapat diblokir dari sistem.',
          },
        ],
      },
    },

    intro: {
      title: 'Cara kerja pencocokan',
      body: 'Tujuan kami adalah membantu orang yang serius ingin menikah untuk berkenalan dengan aman. Poin di bawah menjelaskan cara kerja sistem.',
      eligibilityPointMale:
        'Pencocokan dan pratinjau profil tidak memerlukan keanggotaan. Untuk melihat detail penuh, setuju/tolak, atau menghubungi pasangan, Anda perlu keanggotaan aktif.',
      eligibilityPointFemale:
        'Pencocokan dan pratinjau profil tidak memerlukan keanggotaan. Untuk setuju/tolak atau menghubungi pasangan, Anda perlu verifikasi identitas + free active membership atau keanggotaan berbayar.',
      points: [
        'Profil tidak bersifat publik. Hanya pengguna yang cocok yang bisa melihat detail satu sama lain.',
        'Di panel Anda ditampilkan maksimal 3 / 5 / 10 kandidat sesuai paket. Menandai satu kandidat tidak menghapus kandidat lain; Anda bisa memilih untuk menampilkan hanya pilihan Anda.',
        'Langkah 1: Tinjau kandidat → Setuju atau Tolak. Jika salah satu menolak, kecocokan dibatalkan.',
        'Langkah 2: Jika kedua pihak setuju, pilih langkah berikutnya (chat di dalam situs atau berbagi kontak). Langkah aktif hanya jika kedua pihak memilih opsi yang sama.',
        'Kunci: Saat langkah 2 disepakati, proses terkunci dan Anda tidak bisa meminta kecocokan baru sampai selesai/dibatalkan.',
        '{{eligibilityPoint}}',
      ],
    },

    rules: {
      title: 'Janji, aturan, dan keamanan',
      lead: 'Aturan dibuat untuk menjaga keamanan dan keseriusan. Pelanggaran dengan bukti dapat berujung blokir permanen.',
      why: {
        title: 'Mengapa aturannya banyak?',
        body:
          'Aturan ini bukan untuk menghukum pengguna. Tujuannya menjaga sistem tetap aman dan fokus untuk orang yang serius ingin menikah, serta menyaring penipuan, profil palsu, dan penggunaan “sekadar hiburan” sedini mungkin.',
        points: [
          'Keamanan: mengurangi penipuan, permintaan uang, pelecehan, dan profil palsu.',
          'Keseriusan: mempersulit niat di luar pernikahan untuk bertahan di sistem.',
          'Kualitas: mencegah pool macet dan siklus kandidat yang berulang.',
          'Kejelasan: limit/cooldown/langkah 48 jam mengurangi ketidakpastian proses.',
        ],
        note:
          'Jika tujuan utama hanya meningkatkan interaksi, kami bisa membuat aturan jauh lebih longgar dan membiarkan komunikasi lebih bebas.\nNamun sistem ini dibuat untuk orang yang ingin membangun keluarga — kualitas lebih penting daripada kuantitas.',
      },
      promise: {
        title: 'Janji kami',
        p1Title: 'Privasi',
        p1Body: 'Profil tidak dipublikasikan secara umum. Hanya kandidat yang cocok yang muncul di panel.',
        p2Title: 'Moderasi',
        p2Body: 'Sistem dan admin memantau laporan untuk mengurangi penipuan dan penyalahgunaan.',
        p3Title: 'Kejelasan alur',
        p3Body: 'Langkah setuju/tolak dan pembukaan chat/kontak dibuat jelas dan bertahap.',
        p4Title: 'Keamanan komunikasi',
        p4Body: 'Di chat dalam situs, berbagi nomor/sosmed/link dibatasi.',
        p5Title: 'Dukungan',
        p5Body: 'Jika ada masalah, hubungi dukungan WhatsApp dan sertakan bukti.',
      },
      zeroTolerance: {
        title: 'Zero tolerance',
        r1Title: 'Penipuan / permintaan uang',
        r1Body: 'Meminta uang, hadiah, investasi/kripto, atau mengarahkan ke link mencurigakan dilarang.',
        r2Title: 'Pelecehan / bahasa kasar',
        r2Body: 'Pelecehan, hinaan, atau konten seksual tidak ditoleransi.',
        r3Title: 'Info palsu',
        r3Body: 'Memberi informasi palsu/menyesatkan untuk memanipulasi pihak lain dilarang.',
        r4Title: 'Niat di luar pernikahan',
        r4Body: 'Flirt, hiburan, atau niat di luar pernikahan dilarang.',
        r5Title: 'Pelanggaran privasi',
        r5Body: 'Menyebarkan data pribadi pihak lain tanpa izin dilarang.',
        r6Title: 'Pelanggaran aturan chat',
        r6Body: 'Berbagi kontak/sosmed/link di tahap yang dilarang akan diblokir.',
      },
      enforcement: {
        title: 'Sanksi & kebijakan refund',
        e1a: 'Pengguna yang melanggar aturan (jika terbukti dengan screenshot/bukti) akan',
        e1b: 'diblokir permanen',
        e1c: 'dan kecocokannya dibatalkan.',
        e2a: 'Jika pelanggar memiliki',
        e2b: 'keanggotaan aktif, tetap akan dibatalkan',
        e3a: 'Meskipun keanggotaan dibatalkan, pelanggar',
        e3b: 'tidak dapat meminta refund',
        e4a: 'Setiap pengguna platform ini dianggap telah',
        e4b: 'membaca dan menyetujui aturan ini',
      },
      complaint: {
        title: 'Keluhan / pengiriman bukti',
        body: 'Jika Anda merasa pihak lain tidak berniat menikah, memberi info palsu/menyesatkan, menghina, atau mencoba menipu/meminta uang, kumpulkan bukti dan kirim ke dukungan WhatsApp:',
        extraFemale: 'Jika ada kata-kata kasar, pelecehan, ajakan bernuansa seksual, niat di luar pernikahan, atau profil palsu, kirim screenshot ke dukungan WhatsApp.',
        extraMale: 'Jika ada yang meminta uang sejak awal, mencoba menipu, mengarahkan ke situs lain/token, atau profil tidak sesuai, kirim screenshot ke dukungan WhatsApp.',
      },
    },
    verification: {
      title: 'Verifikasi identitas',
      cta: 'Verifikasi identitas',
      verifiedBadge: 'Identitas terverifikasi',
      requiredTitle: 'Verifikasi identitas (lencana)',
      requiredBody: 'Verifikasi identitas adalah lencana kepercayaan. Jika ada pelanggaran aturan, Anda bisa mengajukan keluhan dengan screenshot/bukti.',
      unverifiedTitle: 'Belum terverifikasi (lencana)',
      unverifiedBodyMale: 'Verifikasi identitas bersifat opsional. Catatan: untuk pria, aksi membutuhkan keanggotaan aktif.',
      unverifiedBodyFemale: 'Verifikasi identitas bersifat opsional. Catatan: wanita bisa menggunakan aksi dengan keanggotaan atau verifikasi identitas.',
      referenceCode: 'Kode verifikasi',
      manualUpload: {
        title: 'Verifikasi di situs (manual)',
        lead: 'Tidak wajib. Unggah foto KTP/ID (depan & belakang) dan satu selfie. Setelah ditinjau, lencana akan diberikan ke akun Anda.',
        idFrontLabel: 'ID (depan)',
        idBackLabel: 'ID (belakang)',
        selfieLabel: 'Selfie',
        submit: 'Kirim',
        uploading: 'Mengunggah…',
        success: 'Dokumen Anda berhasil dikirim. Menunggu peninjauan.',
        pendingHint: 'Status: menunggu peninjauan',
        reviewNote: 'Setelah Anda mengirim file, verifikasi identitas akan ditinjau dan disetujui oleh sistem.',
      },
      actions: {
        startWhatsapp: 'Verifikasi via WhatsApp',
        startKyc: 'KYC otomatis (ID + selfie)',
        startManual: 'Minta persetujuan manual',
        openWhatsapp: 'Kirim pesan verifikasi di WhatsApp',
      },
      errors: {
        kycNotConfigured: 'KYC otomatis belum dikonfigurasi. Silakan gunakan WhatsApp atau verifikasi manual.',
        whatsappNotConfigured: 'Nomor WhatsApp belum dikonfigurasi. Silakan gunakan verifikasi manual.',
        missingFiles: 'Silakan pilih ID (depan/belakang) dan selfie.',
      },
    },

    membershipModal: {
      openFree: 'Aktifkan keanggotaan gratis',
      open: 'Status keanggotaan',
      title: 'Kelola keanggotaan',
      statusLabel: 'Keanggotaan',
      activate: 'Aktifkan keanggotaan saya',
      cancel: 'Batalkan keanggotaan saya',
      cancelDisabledHint: 'Anda tidak bisa membatalkan sebelum keanggotaan aktif.',
      deleteAccount: 'Hapus akun',
      deleteTypePrompt: 'Jika Anda benar-benar ingin menghapus akun: ketik "hesabımı sil".',
      deleteFinalConfirm: 'Akun Anda akan dihapus permanen dari sistem. Anda yakin?',
      deleteCancel: 'Batal',
      deleteContinue: 'Lanjutkan',
      deleteBack: 'Kembali',
      deleteYes: 'Ya, hapus akun saya',
      loading: 'Memproses…',
      alreadyActive: 'Keanggotaan Anda sudah aktif',
      successActivated: 'Keanggotaan Anda diaktifkan.',
      promoActivated: 'Paket Eco Anda diaktifkan gratis. Berakhir pada {{date}} (sisa {{count}} hari).',
      successCancelled: 'Keanggotaan Anda dibatalkan.',
    },

    membershipGate: {
      title: 'Keanggotaan diperlukan',
      body: 'Sampai keanggotaan aktif, Anda hanya bisa melihat foto, nama pengguna, usia, kota dan status pernikahan. Keanggotaan diperlukan untuk setuju/tolak. Anda bisa menghapus kecocokan dan meminta yang baru.',
    },
    membershipOrVerificationGate: {
      title: 'Keanggotaan atau verifikasi identitas diperlukan',
      body: 'Sampai Anda memiliki keanggotaan aktif atau verifikasi identitas, Anda hanya bisa melihat detail profil terbatas. Anda tetap bisa menghapus kecocokan dan meminta yang baru.',
    },
    payment: {
      title: 'Pembayaran & transaksi',
      empty: 'Belum ada transaksi.',
      amount: 'Jumlah',
      status: 'Status',
      date: 'Tanggal',
      invoice: 'Faktur',
      actions: {
        view: 'Lihat',
        pay: 'Bayar',
      },
    },
    membershipInfo: {
      title: 'Keanggotaan',
      subtitle: 'Ringkasan status Anda',
      details: {
        type: 'Tipe',
        start: 'Mulai',
        end: 'Berakhir',
      },
    },
    agreement: {
      title: 'Aturan & kebijakan',
      intro: 'Dengan menggunakan panel ini, Anda dianggap telah membaca dan menyetujui aturan berikut:',
      safety: {
        title: 'Pengingat keamanan',
        s1: 'Tetap waspada saat proses perkenalan; berhati-hati saat membagikan informasi pribadi.',
        s2: 'Jangan pernah mengirim uang; jika ada permintaan uang, segera laporkan.',
        s3: 'Memverifikasi informasi profil adalah tanggung jawab pengguna; jika ragu, minta dukungan.',
      },
      complaint: {
        title: 'Keluhan / pengiriman bukti',
        body: 'Jika dalam chat di situs atau percakapan WhatsApp Anda merasa pihak lain tidak berniat menikah, memberi info palsu/menyesatkan, menghina, atau mencoba menipu/meminta uang:',
        extraFemale: 'Jika ada kata-kata kasar, pelecehan, ajakan bernuansa seksual, niat di luar pernikahan, atau profil palsu, Anda dapat mengirim screenshot ke dukungan WhatsApp.',
        extraMale: 'Jika ada yang meminta uang sejak awal, mencoba menipu, mengarahkan ke situs lain/token, atau profil tidak sesuai, kirimkan screenshot ke dukungan WhatsApp.',
        c1Title: 'Kumpulkan bukti',
        c1Body: 'tangkapan layar, pesan, detail permintaan uang, dll.',
        c2Title: 'Kirim ke kami',
        c2Body: 'chat dukungan WhatsApp dari panel dan jelaskan situasinya.',
        c3Title: 'Peninjauan',
        c3Body: 'Setelah ditinjau, pihak yang bersalah diblokir dan keanggotaannya dibatalkan.',
      },
      enforcement: {
        title: 'Sanksi & kebijakan refund',
        e1a: 'Pengguna yang melanggar aturan (jika terbukti dengan screenshot/bukti) akan',
        e1b: 'diblokir permanen',
        e1c: 'dan kecocokannya dibatalkan.',
        e2a: 'Jika pelanggar memiliki',
        e2b: 'keanggotaan aktif, tetap akan dibatalkan',
        e3a: 'Meskipun keanggotaan dibatalkan, pelanggar',
        e3b: 'tidak dapat meminta refund',
        e4a: 'Setiap pengguna platform ini dianggap telah',
        e4b: 'membaca dan menyetujui aturan ini',
      },
    },

    lock: {
      title: 'Proses kecocokan Anda sedang berjalan.',
      body: 'Setelah saling menerima, kecocokan ini menjadi proses aktif Anda. 48 jam pertama hanya chat di dalam situs. Setelah 48 jam, Anda bisa mengirim permintaan kontak; nomor telepon hanya terlihat jika pihak lain menyetujui.',
      matchId: 'Kode Kecocokan',
    },

    matches: {
      autoRunNotice: 'Pencocokan otomatis berjalan kira-kira setiap {{minutes}} menit. Anda juga bisa meminta kecocokan baru secara manual di sini.',
      presence: {
        online: 'Online',
        lastSeen: 'Terakhir aktif: {{time}}',
        unknown: 'Terakhir aktif: -',
      },
      progress: {
        title: 'Progres',
        steps: {
          proposed: 'Perkenalan',
          mutualAccepted: 'Saling setuju',
          confirm48h: 'Konfirmasi 48 jam',
          contact: 'Kontak',
        },
        remaining: 'Sisa waktu: {{h}} jam {{m}} mnt',
      },

      quickQuestions: {
        title: '3 pertanyaan singkat',
        lead: 'Kalau mau, jawab 3 pertanyaan singkat dengan sekali tap untuk saling mengenal lebih cepat. Opsional.',
        yourAnswer: 'Kamu',
        otherAnswer: 'Dia',
        pickOne: 'Pilih satu',
        otherAnswered: 'Sudah jawab',
        otherNotAnswered: 'Belum jawab',
        questions: {
          q1: {
            title: 'Kamu prefer pace seperti apa?',
            options: {
              slow: 'Pelan',
              normal: 'Normal',
              fast: 'Cepat',
            },
          },
          q2: {
            title: 'Keluarga vs kemandirian?',
            options: {
              family: 'Fokus keluarga',
              balanced: 'Seimbang',
              independent: 'Mandiri',
            },
          },
          q3: {
            title: 'Pindah kota / relokasi?',
            options: {
              local: 'Kota yang sama',
              open: 'Terbuka',
              flexible: 'Fleksibel',
            },
          },
        },
      },

      matchTest: {
        button: 'Tes kecocokan',
        title: 'Tes kecocokan',
        lead: 'Lihat seberapa cocok kalian lewat 3 pertanyaan singkat.',
        score: 'Skor: {{points}} / {{max}}',
        close: 'Tutup',
        questionCounter: 'Pertanyaan {{cur}} / {{total}}',
        sameAnswer: 'Jawaban sama: +10 poin',
        differentAnswer: 'Jawaban berbeda',
        prev: 'Sebelumnya',
        next: 'Berikutnya',
      },
      title: 'Kecocokan Anda',
      subtitle: 'Maksimal 3 / 5 / 10 kandidat ditampilkan sesuai paket Anda.',
      inactivityNotice: {
        title: 'Aturan tidak aktif (24 jam)',
        body:
          'Jika Anda tidak aktif lebih dari 24 jam, daftar kecocokan Anda akan direset. Orang-orang di daftar Anda akan dikembalikan ke pool kecocokan. Saat Anda aktif kembali, Anda bisa meminta kecocokan lagi nanti—namun Anda akan kehilangan kecocokan saat ini.',
      },
      newUserSlotNotice: {
        title: 'Slot pendaftar baru aktif',
        body:
          'Anda telah membuka slot khusus untuk pendaftar baru. Slot ini akan tetap kosong sampai muncul kecocokan {{threshold}}+ dari pengguna baru (yang mendaftar setelah Anda membuka slot). Selama slot ini aktif, Anda tidak akan menerima kandidat dari pool umum.',
      },
      inactiveReset: {
        title: 'Kecocokan direset karena tidak aktif',
        body: 'Kecocokan ini dibatalkan dan dikembalikan ke pool karena salah satu pihak tidak aktif lebih dari 24 jam.',
      },
      focusActiveReset: {
        title: 'Kecocokan ini ditutup',
        body: 'Pihak lain sedang melanjutkan satu jendela perkenalan yang lain. Ini bukan penilaian negatif tentang Anda; sistem akan menampilkan kandidat baru jika sudah waktunya.',
      },
      empty: 'Ketika ditemukan kecocokan yang sesuai dengan profil Anda, akan muncul di sini. Simpan halaman ini di ponsel atau komputer Anda agar mudah dibuka kembali saat ingin mengecek.',
      savePage: 'Simpan halaman',
      savePageAlready: 'Halaman ini sudah ditambahkan ke layar utama / terpasang sebagai aplikasi.',
      savePageIosHint: 'iPhone/iPad: Di Safari, ketuk Bagikan → “Tambah ke Layar Utama”. (Tautan disalin.)',
      savePageAndroidHint: 'Android: Dari menu browser pilih “Tambahkan ke layar utama” atau “Instal aplikasi”. (Tautan disalin.)',
      savePageDesktopHint: 'Komputer: Dari menu browser pilih “Instal aplikasi” (jika ada) atau tambahkan bookmark (Ctrl+D). (Tautan disalin.)',
      waitingOther: 'Menunggu jawaban pihak lain.',
      mutualAcceptedNotice: 'Kedua pihak menyetujui. Anda bisa memilih langkah berikutnya.',
      rejectedByOther: {
        title: 'Orang ini menolak Anda.',
        body: 'Anda bisa menghapus kecocokan ini dari panel dan meminta kandidat baru (batas harian berlaku).',
      },
      interaction: {
        title: 'Langkah berikutnya',
        lead: 'Aksi terjadi hanya ketika kedua pihak memilih opsi yang sama. Anda bisa mengubah pilihan; sistem akan menerapkan ketika kedua pihak sepakat.',
        offsite: 'Lanjut di luar situs',
        cancel: 'Batalkan kecocokan',
        offsiteShort: 'Lanjut di luar situs',
        cancelShort: 'Batalkan kecocokan',
        offsiteInfoTitle: 'Jika lanjut di luar situs',
        offsiteInfoBody: 'Jika kedua pihak memilih ini, detail kontak akan terbuka untuk kedua pihak dan Anda bisa lanjut via WhatsApp, dll.',
        cancelInfoTitle: 'Jika membatalkan kecocokan',
        cancelInfoBody: 'Jika kedua pihak memilih ini, kecocokan berakhir, kunci dilepas, dan kandidat lain terlihat lagi.',
        choosePrompt: 'Pilih opsi untuk melanjutkan.',
        yourChoice: 'Pilihan Anda: {{choice}}',
        membershipRequired: 'Keanggotaan aktif diperlukan untuk langkah ini.',
        verificationRequired: 'Verifikasi identitas diperlukan untuk langkah ini.',
        otherPrefersOffsite: '{{name}} memilih “lanjut di luar situs”. Anda bisa membuka kontak dengan memilih itu juga.',
        otherPrefersCancel: '{{name}} memilih “batalkan kecocokan”. Anda bisa mengakhiri kecocokan dengan memilih batal juga.',
        offsiteWaiting: 'Pilihan Anda tersimpan. Menunggu pihak lain memilih opsi yang sama.',
      },
      chat: {
        title: 'Chat di Dalam Situs',
        lead: 'Anda bisa ngobrol di sini sebelum memutuskan. Berbagi nomor/WhatsApp, sosmed, dan link diblokir.',
        enableNotifications: 'Aktifkan notifikasi',
        notificationsEnabled: 'Notifikasi aktif.',
        notificationsDenied: 'Izin notifikasi ditolak.',
        notificationsNotSupported: 'Browser ini tidak mendukung notifikasi.',
        notificationTitle: 'Pesan baru',
        notificationBody: 'Ada pesan baru dari kecocokan Anda.',
        timeLeft: 'Sisa waktu: {{minutes}} menit',
        timeUnknown: 'Sisa waktu: -',
        rulesTitle: 'Aturan',
        rulesBody: 'Nomor telepon/WhatsApp, Instagram/Facebook dan link tidak boleh pada tahap ini.',
        empty: 'Belum ada pesan. Anda bisa kirim pesan pertama.',
        placeholder: 'Tulis pesan…',
        send: 'Kirim',
        continue: 'Lanjut (Setuju)',
        reject: 'Tidak cocok (Tolak)',
        errors: {
          sendFailed: 'Pesan gagal dikirim.',
        },

        confirm48h: {
          title: '48 jam berlalu: Konfirmasi kecocokan',
          body:
            'Mulai tahap ini, kecocokan Anda akan ditandai sebagai “terkonfirmasi” dan fitur berbagi kontak (nomor telepon) akan diaktifkan. Setelah konfirmasi, saran lain di slot kecocokan Anda bisa dihapus.',
          note: 'Setelah Anda konfirmasi, kami akan menunggu konfirmasi dari pihak lain juga.',
          confirmButton: 'Konfirmasi kecocokan',
          cancelButton: 'Batal',
          waitingOther: 'Anda sudah konfirmasi. Menunggu konfirmasi pihak lain.',
          confirmed: 'Kecocokan terkonfirmasi. Anda dapat meminta berbagi kontak.',
          contactLockedUntilConfirm: 'Untuk meminta berbagi kontak, Anda harus mengonfirmasi kecocokan ini terlebih dahulu.',
          errors: {
            locked: 'Tidak bisa dikonfirmasi sebelum 48 jam berlalu.',
            confirmRequired: 'Berbagi kontak memerlukan konfirmasi kecocokan terlebih dahulu.',
          },
        },
      },
      candidate: {
        fallbackName: 'Kandidat',
        verifiedBadge: 'Identitas terverifikasi',
        proBadge: 'PRO',
        standardBadge: 'STANDAR',
        matchedProfile: 'Profil kecocokan',
        score: 'Skor kecocokan',
        likeBadge: '♥ Anda mendapat like',
        likeSentBadge: '✓ Like terkirim',
        profileInfo: 'Tampilkan info profil',
        hideProfileInfo: 'Sembunyikan',
        profileInfoTitle: 'Info profil (tanpa kontak)',
        partnerAgeMin: 'Usia min',
        partnerAgeMax: 'Usia max',
        photoAlt: 'Foto',
        maritalStatus: 'Status pernikahan',
        detailsTitle: 'Detail',
        aboutLabel: 'Tentang',
        expectationsLabel: 'Harapan',
        heightLabel: 'Tinggi',
        educationLabel: 'Pendidikan',
        occupationLabel: 'Pekerjaan',
        religionLabel: 'Agama',
      },
    },
  },

  matchmakingMembership: {
    title: 'Aktivasi keanggotaan',
    lead: 'Anda dapat mengaktifkan keanggotaan Anda di sini.',
    planTitle: 'Keanggotaan bulanan',
    monthlyPrice: 'Harga: ${{amount}} / bulan',
    promoTitle: 'Promo: Aktivasi gratis',
    promoBody: 'Aktivasi keanggotaan gratis sampai {{date}}.',
    promoEndedTitle: 'Promo berakhir',
    promoEndedBody: 'Setelah {{date}}, aktivasi keanggotaan berbayar dan aktif setelah pembayaran.',
    freeActivateCta: 'Aktifkan keanggotaan saya gratis',
    paidActivationCta: 'Lanjut ke pembayaran',
    activating: 'Mengaktifkan…',
    activated: 'Keanggotaan diaktifkan.',
    activatedUntil: 'Keanggotaan diaktifkan. Berlaku sampai: {{date}}',
    freeActivatedInfo:
      'Keanggotaan gratis Anda berlaku sampai {{date}}.\nDengan keanggotaan ini, Anda dapat like/tolak profil kecocokan dan menggunakan {{translatedCount}} pesan terjemahan.\nBatas ganti kecocokan harian Anda adalah {{dailyLimit}}.',
    promoExpired: 'Promo berakhir. Setelah {{date}}, aktivasi berbayar dan aktif setelah pembayaran.',
    promoDisabled: 'Promo saat ini dinonaktifkan. Silakan coba lagi nanti.',
    activateFailed: 'Tidak dapat mengaktifkan keanggotaan. Silakan coba lagi.',
    errors: {
      notAuthenticated: 'Sesi tidak dapat diverifikasi. Silakan keluar lalu masuk kembali.',
      serverNotConfigured: 'Konfigurasi server tidak lengkap. Silakan hubungi dukungan.',
      apiUnavailableDev: 'API tidak dapat dijangkau. Di local dev, jalankan `npm run dev` (api+web).',
    },
    backToPanel: 'Kembali ke panel',
    paymentMethodsSoon: 'Catatan: Aktivasi keanggotaan gratis sampai {{date}}.',
    paidAdminApprovalNote: 'Catatan: Setelah {{date}}, aktivasi berbayar dan aktif setelah pembayaran.',
  },

  panel: {
    membership: {
      title: "Syarat keanggotaan",
      lead: "Syarat keanggotaan:",
      freeActiveTermsTitle: "Syarat keanggotaan aktif gratis",
    },
  },
};

export default deepMerge(en, overrides);

/*
export default {
  navigation: {
    siteTitle: "Endonezya Kaşifi",
    siteSubtitle: "PT MoonStar Global Indonesia",
      taglineTravelOrg: "Organisasi perjalanan",
      taglineWeddingGuidance: "Panduan pernikahan",
    home: "Beranda",
    about: "Tentang Kami",
    corporate: "Perusahaan",
    travel: "Perjalanan",
    tours: "Paket Tur",
    explore: "Jelajahi",
    wedding: "Panduan Pernikahan",
    matchmaking: "Uniqah",
    documents: "Dokumen",
    youtube: "YouTube",
    contact: "Kontak",
  },

  matchmakingHub: {
    metaTitle: 'Uniqah',
    badge: 'Proses privat & dimoderasi',
    title: 'Sistem pencocokan untuk pernikahan',
    description:
      'Sistem pencocokan tertutup yang mempertemukan orang-orang yang serius ingin menikah—dengan syarat yang adil dan aman. Profil tidak publik; sistem menampilkan kandidat paling cocok di panel Anda dan membantu Anda menemukan pasangan yang tepat lebih cepat.',
    actions: {
      apply: 'Ajukan pencocokan',
      goPanel: 'Profil saya',
      backWedding: 'Kembali ke halaman pernikahan',
      supportWhatsApp: 'Dukungan WhatsApp',
    },
    whatsappSupportMessage: 'Halo, saya butuh bantuan terkait sistem pencocokan. Saya punya laporan/permintaan peninjauan.',
    cards: {
      private: {
        title: 'Tidak ada profil publik',
        desc: 'Profil tidak dipublikasikan; evaluasi ditangani oleh sistem.',
      },
      review: {
        title: 'Evaluasi sistem',
        desc: 'Saat ada kecocokan, proses berlanjut dengan aman melalui panel Anda.',
      },
      panel: {
        title: 'Kelola lewat panel',
        desc: 'Anda mengelola pratinjau, kecocokan, dan langkah berikutnya dari panel.',
      },
    },
    how: {
      title: 'Bagaimana cara kerjanya?',
      subtitle: 'Alur dari daftar hingga komunikasi dibuat terkontrol dan jelas.',
      steps: [
        { title: 'Daftar dan buat profil', desc: 'Setelah daftar, Anda membuat profil dengan mengisi formulir.' },
        { title: 'Lihat profil yang cocok di panel', desc: 'Sistem menampilkan profil paling cocok (pratinjau terbatas).' },
        { title: 'Suka / lewati', desc: 'Sukai profil yang Anda minati; jika saling suka, tahap pertama selesai.' },
        { title: 'Pilih metode kontak', desc: 'Pilih “bagikan kontak saya” atau “chat di dalam situs”.' },
        { title: 'Mulai komunikasi', desc: 'Jika keduanya berbagi kontak, detail muncul; jika keduanya memilih chat, ruang chat terbuka di panel.' },
      ],
    },
    safety: {
      title: 'Keamanan dan kualitas',
      subtitle: 'Tidak seperti platform pencarian publik, sistem ini mempersempit ruang gerak pelaku buruk.',
      points: [
        'Karena profil tidak publik, akses yang tidak diinginkan dan gangguan berkurang drastis.',
        'Penipuan dan eksploitasi finansial bisa diblokir cepat lewat deteksi dan laporan.',
        'Kirim laporan ke dukungan WhatsApp; setelah ditinjau, akun dihapus dari sistem.',
            terms: 'Saya telah membaca dan menyetujui <termsLink>Syarat & Ketentuan</termsLink>.',
    },
  },

  meta: {
    baseTitle: "Endonezya Kaşifi | PT MoonStar Global Indonesia",
            consentsRequired: 'Untuk mengirim, Anda harus menyetujui kotak persetujuan (18+, Kebijakan Privasi, Syarat & Ketentuan, persetujuan foto).',
      "Endonezya Kaşifi (PT MoonStar Global Indonesia) menyediakan layanan tur di Indonesia, perencanaan perjalanan khusus, bulan madu, serta panduan pernikahan.",
    pages: {
      home: { title: "Endonezya Kaşifi | PT MoonStar Global Indonesia" },
      about: { title: "Tentang Kami" },
      corporate: { title: "Perusahaan" },
      contact: { title: "Kontak" },
      travel: { title: "Perjalanan" },
      tours: {
        title: "Paket Tur",
        description:
          "Paket tur Indonesia yang terencana dan tur grup: program di lapangan untuk Bali, Lombok, Komodo dan lainnya.",
      },
      wedding: {
        title: "Panduan Pernikahan",
        description:
          "Panduan proses pernikahan Anda di Indonesia: dukungan menyeluruh untuk hotel, transportasi, penerjemahan, dan dokumen resmi.",
      },
          lead: 'Jika Anda mengalami masalah, tangkapan layar, dan detail singkat, tulis ke WhatsApp dukungan kami. Semua laporan ditinjau. {{complaintLeadExtra}}',
          extraFemale: 'Jika Anda menerima bahasa kasar/seksual, tekanan, pelecehan, atau pengiriman materi yang tidak pantas, segera ambil screenshot dan laporkan.',
          extraMale: 'Jika Anda diminta uang/hadiah, diarahkan ke “token/coin”, investasi/kripto, link mencurigakan, atau ada upaya penipuan, segera ambil screenshot dan laporkan.',
      youtube: { title: "YouTube" },
      gallery: { title: "Galeri" },
      privacy: { title: "Kebijakan Privasi" },
      documents: { title: "Dokumen" },
    },
  },

  weddingPage: {
    hero: {
      badge: "Pendampingan khusus untuk pasangan Turki–Indonesia",
      title: "Kami mendampingi persiapan pernikahan Anda di Indonesia",
      description:
        "Dokumen, prosedur resmi, komunikasi antar keluarga, dan seluruh proses organisasi di Indonesia kami rencanakan bersama—mengubahnya menjadi perjalanan yang menenangkan, jauh dari pertanyaan yang mengganggu.",
      actions: {
        openForm: "Buka Form Rencana Pernikahan",
        matchmakingHub: "Pencocokan",
        quickChat: "Konsultasi cepat via WhatsApp",
        enableNotifications: 'Aktifkan notifikasi',
        notificationsEnabled: 'Notifikasi aktif.',
        notificationsDenied: 'Izin notifikasi tidak diberikan.',
        notificationsNotSupported: 'Browser ini tidak mendukung notifikasi.',
        notificationTitle: 'Pesan baru',
        notificationBody: 'Anda mendapat pesan baru dari pasangan Anda.',
      },
    },
    whatsapp: {
      quickChatMessage: "Halo, saya ingin mendapatkan informasi tentang pernikahan di Indonesia.",
    },
    intro: {
      servicesTitle: "Layanan kami",
      cards: [
        {
          title: "Dokumen & proses resmi",
          items: [
            "Persiapan dan pengecekan semua dokumen yang diperlukan",
            "Pengajuan resmi pernikahan dan pemantauan proses",
            "Penyelesaian urusan resmi setelah pernikahan",
          ],
        },
        {
          title: "Komunikasi & penerjemahan",
          items: [
            "Dukungan komunikasi dengan calon pasangan dan keluarganya",
            "Penerjemahan untuk WhatsApp dan pertemuan tatap muka",
            "Jawaban jelas untuk pertanyaan Anda sepanjang proses",
          ],
        },
        {
          title: "Transportasi & akomodasi",
          items: [
            "Rencana perjalanan bagi yang pertama kali bepergian ke luar negeri",
            "Pengaturan transportasi kendaraan pribadi di Indonesia",
            "Perencanaan hotel dan akomodasi",
          ],
        },
        {
          title: "Pendampingan berkelanjutan & visa",
          items: [
            "Pendampingan tanpa henti hingga pernikahan selesai",
            "Konsultasi visa dan izin tinggal untuk menetap di Indonesia",
            "Arahan proses visa pasangan dan izin tinggal untuk tinggal di Turki",
          ],
        },
      ],
      flexibleTitle: "Pendekatan layanan yang fleksibel",
      flexibleP1:
        "Anda bisa menggunakan semua layanan kami dari A sampai Z, atau meminta dukungan hanya pada bagian yang Anda butuhkan.",
      flexibleP2:
        "Anda dapat mengenal proses, kami, dan cara kerja kami lebih dekat dengan menonton video di kanal YouTube kami.",
      flexibleNote:
        'Anda dapat mengisi form "Rencana Pernikahan" di bawah, atau meninjau dokumen yang diperlukan secara detail pada tab "Dokumen Pernikahan di Indonesia".',
    },
    steps: [
      {
        title: "Kami memahami Anda dan situasi Anda",
        description:
        ],
      },
    },
        title: "Kami merencanakan bersama Anda",
        description:
          "Dokumen, tanggal, dan langkah proses kami susun bersama sesuai anggaran dan harapan Anda.",
      baseDescription:
        "Endonezya Kaşifi (PT MoonStar Global Indonesia) menyediakan layanan tur di Indonesia, perencanaan perjalanan khusus, bulan madu, serta panduan pernikahan.",
        title: "Kami mengelola proses langkah demi langkah",
        description:
          "Dari kedatangan Anda di Indonesia hingga pernikahan selesai, kami mendampingi di setiap langkah.",
      },
    ],
    images: {
      prepAlt: "Detail persiapan pernikahan di Indonesia",
      ceremonyAlt: "Upacara pernikahan di Indonesia",
    },
    tabs: {
      plan: "Rencana Pernikahan",
      documents: "Dokumen Pernikahan di Indonesia",
    },
    plan: {
      title: "Sampaikan rencana pernikahan Anda kepada kami",
      subtitle:
        explore: { title: "Jelajahi" },
        "Isi kolom di bawah; kami akan segera menghubungi Anda dengan respons yang sesuai dengan situasi Anda.",
      successTitle: "Permintaan Anda berhasil dikirim!",
      successText: "Terima kasih telah mengisi form. Kami akan menghubungi Anda dalam 24 jam.",
      form: {
        sections: {
          basicInfo: {
            title: "1. Informasi dasar Anda",
            labels: {
              name: "Nama lengkap",
              phone: "Nomor kontak",
              city: "Kota",
              age: "Usia",
            },
            placeholders: {
              name: "Nama lengkap Anda",
              phone: "+90 555 034 3852",
              city: "Kota Anda",
              age: "Usia Anda",
            },
          },
        },
        services: {
          title: "2. Layanan yang Anda butuhkan",
          hint:
            "Anda dapat memilih lebih dari satu opsi. Jika tidak yakin, Anda dapat membiarkannya kosong.",
          options: {
            consulting: "Konsultasi",
            paperworkTracking: "Pemantauan dokumen",
            familyCommunication: "Komunikasi antar keluarga",
            transport: "Transportasi",
            interpretation: "Penerjemahan",
            ongoingGuidance: "Pendampingan selama proses",
            accommodation: "Akomodasi",
            honeymoon: "Bulan madu",
          },
        },
        schedule: {
          weddingDateLabel: "Tanggal pernikahan yang direncanakan",
          privacyConsent:
            "Saya telah membaca dan menyetujui <privacyLink>Kebijakan Privasi</privacyLink>.",
          privacyNote:
            "Informasi yang Anda bagikan hanya akan digunakan untuk keperluan perencanaan pernikahan dan tidak akan dibagikan kepada pihak ketiga.",
        },
        actions: {
          submit: "Minta penawaran untuk rencana pernikahan saya",
          submitting: "Mengirim...",
        },
        errors: {
          privacyConsent:
            "Anda harus mengonfirmasi bahwa Anda telah membaca dan menyetujui Kebijakan Privasi.",
          sendFailed:
            "Terjadi kesalahan saat mengirim permintaan. Silakan coba lagi.",
        },
        note:
          "Jika Anda tidak ingin mengisi form, Anda juga dapat menghubungi kami langsung melalui tombol WhatsApp di bagian bawah halaman.",
      },
    },
    documents: {
      title: "Dokumen yang diperlukan untuk pernikahan WNA–WNI di Indonesia",
      subtitle:
        "Judul-judul di bawah ini hanya untuk informasi umum. Kami akan mengecek daftar yang pasti dan terbaru untuk situasi Anda bersama.",
      foreignSpouse: {
        title: "Dokumen untuk pasangan WNA",
        intro: "Secara umum, dokumen utama yang diminta dari pasangan WNA:",
        items: [
          "Paspor yang masih berlaku (minimal 6 bulan)",
          "Visa masuk Indonesia atau ITAS/ITAP",
          "Surat keterangan tidak ada halangan menikah (dari Kedutaan Besar Turki di Indonesia)",
          "Akta kelahiran (multibahasa)",
          "Surat keterangan lajang (diterjemahkan ke Bahasa Indonesia dan apostille)",
          "Jika ada, putusan cerai atau akta kematian (diterjemahkan dan dilegalisasi notaris)",
          "Surat keterangan domisili",
          "Foto paspor diambil dalam 6 bulan terakhir",
        ],
      },
      indonesianSpouse: {
        title: "Dokumen untuk pasangan WNI",
        intro: "Untuk pasangan warga negara Indonesia, dokumen berikut umumnya diminta:",
        items: [
          "KTP (kartu identitas)",
          "Akte Lahir (akta kelahiran)",
          "Kartu Keluarga",
          "Surat keterangan status perkawinan (lajang / cerai / duda/janda)",
          "Formulir N1–N10 dan persetujuan RW/RT",
          "Foto paspor diambil dalam 6 bulan terakhir",
        ],
      },
      extras: {
        title: "Tambahan yang mungkin diminta",
        intro:
          "Tidak wajib untuk setiap berkas, tetapi di beberapa kota dokumen berikut juga dapat diminta:",
        items: [
          "Bukti penghasilan atau pernyataan kondisi finansial",
          "Surat keterangan catatan kepolisian",
          "Surat keterangan kesehatan",
          "Ijazah",
        ],
      },
      importantNotes: {
        title: "📌 Catatan penting",
        items: [
          "Untuk banyak dokumen, apostille dan terjemahan Bahasa Indonesia wajib. (Tanyakan ke KUA tempat pasangan Anda terdaftar)",
          "Satu kesalahan huruf, dokumen yang kurang, atau urutan proses yang salah dapat berdampak buruk pada seluruh proses.",
          "Daftar dokumen dan alur dapat berubah tergantung kota, instansi, dan petugas.",
        ],
      },
      personalDifferences: {
        title: "⚠️ Perbedaan kondisi pribadi",
        p1:
          "Bagian ini menjelaskan kerangka umum; pernikahan sebelumnya, anak, atau kewarganegaraan dapat mengubah daftar dokumen Anda.",
        p2:
          "Kami mengecek daftar yang pasti untuk situasi Anda bersama dan membimbing Anda langkah demi langkah agar semuanya lengkap.",
      },
      faqTitle: "Pertanyaan yang sering diajukan",
      whatsappCta: {
        title: "Masih ragu soal dokumen?",
        description:
          "Tulis kepada kami; berdasarkan kota, kewarganegaraan, dan situasi Anda, mari kita pastikan daftar dokumen paling terbaru bersama.",
        action: "Tanyakan daftar dokumen saya via WhatsApp",
        message:
          "Halo, saya ingin mendapatkan informasi tentang proses pernikahan dan dokumen yang diperlukan di Indonesia.",
      },
    },
    faq: {
      items: [
        {
          q: "Berapa lama rata-rata proses pernikahan di Indonesia?",
          a: "Tergantung kesiapan dokumen, kota tempat pengajuan, dan kesibukan instansi. Umumnya, bagian perencanaan dan proses resmi selesai dalam beberapa minggu hingga beberapa bulan.",
        },
        {
          q: "Langkah pertama apa yang harus saya lakukan untuk menikah di Indonesia?",
          a: "Pertama, pastikan dokumen apa saja yang dibutuhkan untuk kasus Anda. Setelah meninjau daftar, Anda dapat menghubungi kami via WhatsApp agar kami dapat membuat checklist terbaru sesuai kota dan situasi Anda.",
        },
        {
          q: "Apakah Anda menangani seluruh proses dari awal sampai akhir?",
          a: "Sesuai kebutuhan Anda, kami bisa membantu hanya pada langkah tertentu, atau mengorganisir seluruh dokumen, janji temu, dan proses resmi secara end-to-end.",
        },
        {
          q: "Apakah saya bisa mengurus proses pernikahan sendiri?",
          a: "Bisa, namun sangat penting memastikan Anda memahami setiap langkah dan dokumen yang diminta secara detail. Kesalahan kecil, pengajuan yang tidak tepat, atau dokumen yang kurang dapat menyebabkan kerugian waktu dan biaya serta dapat menguras emosi.",
        },
      ],
    },
    bottomCta: {
      title: "Mari rencanakan pernikahan Anda bersama",
      description: "Isi form di bawah atau hubungi kami via WhatsApp sekarang juga.",
      action: "Tanya sekarang di WhatsApp",
      message: "Halo, saya ingin mendapatkan informasi tentang paket pernikahan.",
      note:
        "Kami membalas dalam bahasa Turki; jika diperlukan, kami juga membantu komunikasi dengan keluarga pasangan Anda dalam bahasa Indonesia.",
    },
  },

  common: {
    open: "Buka",
    loading: 'Memuat…',
    downloadPdf: "Unduh PDF",
    learnMore: "Pelajari",
     back: "Kembali",
    privacySecurity: {
      title: "Privasi & Keamanan",
      text: "Halaman ini dilacak dengan Google Analytics. Data Anda dilindungi dengan enkripsi SSL/TLS.",
      policyLink: "Kebijakan Privasi",
    },
  },

  documentsHub: {
    title: "Dokumen",
    subtitle:
      "Akses perjanjian paket tur, perjanjian penjualan jarak jauh, pemberitahuan privasi, kebijakan pembatalan/pengembalian, serta instruksi pembayaran dalam satu halaman.",
    sidebarTitle: "DOKUMEN",
    openNewTab: "Buka di tab baru",
    source: "Sumber: {{file}}",
    note:
      "Catatan: Halaman ini hanya menampilkan dokumen. Pada langkah pembayaran/reservasi, kotak persetujuan yang relevan tetap berlaku.",
  },

  youtubePage: {
    hero: {
      title: "Video YouTube",
      subscribe: "Berlangganan",
    },
    intro: {
      title: "Video",
      text:
        "Di sini Anda bisa menemukan video tentang kehidupan kami di Indonesia, tur, dan perjalanan kami.",
    },
    video: {
      watch: "Tonton",
    },
    cta: {
      title: "Kunjungi kanal kami untuk lebih banyak",
      text: "Kunjungi kanal YouTube kami dan berlangganan agar tidak ketinggalan video baru.",
      visit: "Kunjungi kanal",
    },
  },

  floatingWhatsapp: {
    label: "WhatsApp",
    ariaLabel: "Chat lewat WhatsApp",
    messages: {
      default: "Halo, saya ingin mendapatkan informasi lebih lanjut.",
      home: "Halo, saya ingin mendapatkan informasi tentang Endonezya Kaşifi.",
      explore: "Halo, saya ingin mendapatkan informasi tentang destinasi di Indonesia.",
      travel: "Halo, saya ingin mendapatkan informasi tentang rencana liburan ke Indonesia.",
      wedding: "Halo, saya ingin mendapatkan informasi tentang menikah di Indonesia.",
      youtube: "Halo, saya ingin mendapatkan informasi tentang video YouTube Anda.",
      contact: "Halo, saya ingin mendapatkan informasi tentang cara menghubungi Anda.",
      tours: "Halo, saya ingin mendapatkan informasi tentang paket tur Anda.",
      documents: "Halo, saya ingin mendapatkan informasi tentang dokumen Anda.",
    },
  },

  home: {
    hero: {
      badgeCompany: "Terdaftar di Indonesia: PT MoonStar Global Indonesia",
      badgeSocial: "akun sosial endonezyakasifi",
      title: "Endonezya Kaşifi",
      subtitle: "Organisasi tur • Panduan pernikahan • Dukungan di lapangan",
      description:
        "Kami merancang paket tur butik dan rencana perjalanan khusus di Indonesia yang berfokus pada bulan madu, eksplorasi, dan liburan. Kami juga membimbing pasangan yang datang ke Indonesia untuk menikah—langkah demi langkah—dalam hotel, transportasi, penerjemahan, dan proses dokumen resmi.",
      note: "Struktur berbasis Indonesia yang didirikan oleh wirausahawan Turki yang tinggal di Indonesia.",
      ctaTours: "Lihat paket tur",
      ctaBrochures: "Unduh brosur (PDF)",
      ctaTrust: "Kepercayaan & Legal",
    },
    trust: {
      items: [
        {
          title: "Proses jelas",
          description: "Pra-registrasi → penawaran tertulis → langkah kontrak/pembayaran.",
        },
        {
          title: "Dukungan bahasa Turki",
          description: "Dukungan WhatsApp via jalur Türkiye; operasi di Indonesia.",
        },
        {
          title: "Struktur legal",
          description: "Endonezya Kaşifi adalah merek di bawah PT MoonStar Global Indonesia di Indonesia.",
        },
      ],
    },
    services: {
      title: "Apa yang kami lakukan untuk Anda?",
      cards: {
        joinTours: {
          title: "Ikut tur grup terjadwal",
          description:
            "Anda dapat ikut paket tur terencana kami ke Bali, Lombok, Komodo, dan pulau Indonesia lainnya—sendiri, bersama keluarga, atau teman.",
        },
        groupTours: {
          title: "Tur grup perusahaan",
          description:
            "Untuk perusahaan, sekolah, komunitas, dan grup teman kami merencanakan tur grup Indonesia sesuai tanggal, jumlah orang, dan anggaran—termasuk program meeting dan event.",
        },
        privateTravel: {
          title: "Perjalanan pribadi / keluarga",
          description:
            "Kami menyiapkan rencana liburan Indonesia khusus termasuk penerbangan, akomodasi, dan rute—agar Anda bisa menjelajahi Bali dan sekitarnya sesuai tempo Anda.",
        },
        wedding: {
          title: "Konsultasi pernikahan",
          description:
            "Kami mendampingi proses pernikahan Anda—dokumen, prosedur legal, panduan, penerjemahan, transportasi, dan akomodasi—agar pernikahan Anda di Indonesia berjalan lancar.",
        },
        youtube: {
          title: "Video YouTube",
          description:
            "Tonton pilihan video dari perjalanan dan proses pernikahan kami di situs ini; temukan lebih banyak di kanal YouTube kami.",
        },
        dameturk: {
          title: "DaMeTurk (sub-merek)",
          aria: "DaMeTurk - Es krim Turki asli",
          description:
            "Di bawah PT MoonStar Global Indonesia, kami menjalankan merek DaMeTurk untuk es krim Turki asli di Indonesia. Kunjungi dameturk.com untuk detail dan pembaruan.",
        },
      },
    },

    howItWorks: {
      title: "Bagaimana prosesnya?",
      steps: [
        {
          title: "1) Pra-registrasi",
          description: "Gratis dan tidak mengikat. Kami memahami kebutuhan Anda.",
        },
        {
          title: "2) Paket tertulis",
          description: "Program + termasuk/tidak termasuk + catatan penting dibagikan secara tertulis.",
        },
        {
          title: "3) Persetujuan & pembayaran",
          description: "Tinjau kontrak → pembayaran → reservasi dikonfirmasi.",
        },
      ],
      ctaTours: "Lihat paket tur",
      ctaDocuments: "Dokumen",
    },

    features: {
      title: "Mengapa lebih mudah bersama kami?",
      items: [
        {
          title: "Panduan dari pengalaman nyata",
          description:
            "Kami menggunakan pengalaman tinggal di Indonesia dan mengatur tur di lapangan untuk rute, akomodasi, dan alur harian.",
        },
        {
          title: "Komunikasi sederhana & transparan",
          description:
            "Dengan dukungan bahasa Indonesia, Turki, dan Inggris, kami menjelaskan proses dengan jelas sejak awal.",
        },
        {
          title: "Perencanaan sesuai anggaran",
          description:
            "Dengan mempertimbangkan biaya perjalanan, akomodasi, dan pengeluaran harian, kami meminimalkan biaya tak terduga.",
        },
      ],
    },

    cta: {
      eyebrow: "Silakan bertanya",
      title: "Mari kita jelaskan semuanya tentang Indonesia bersama",
      description:
        "Baik paket tur maupun rencana perjalanan pribadi Anda… Anda bisa bertanya, dan kami akan membuat prosesnya lebih sederhana dan jelas.",
      ctaContact: "Buka formulir kontak",
      ctaWhatsapp: "Tanya via WhatsApp",
    },
  },

  about: {
    hero: {
      title: "Tentang Kami",
      subtitle:
        "Kami memudahkan pengalaman perjalanan dan tur Anda di Indonesia selangkah demi selangkah dengan struktur dan pengalaman di lapangan.",
    },
    brand: {
      title: "Struktur merek",
      p1:
        "Situs ini adalah etalase dan titik kontak layanan yang kami jalankan di bawah PT MoonStar Global Indonesia. Komunikasi merek publik kami dilakukan dengan nama Endonezya Kaşifi.",
      p2:
        "MoonStar Global Indonesia dibangun oleh wirausahawan Turki yang tinggal di Indonesia untuk memahami kebutuhan tamu Turki secara langsung dan menyelesaikannya di lapangan. Paket tur dan komunikasi penjualan dilakukan di bawah merek Endonezya Kaşifi agar lebih mudah dipahami.",
      cards: {
        toursTitle: "Organisasi tur",
        toursDesc: "Tur terencana dan rencana perjalanan khusus untuk Bali, Lombok, Komodo, dan lainnya.",
        weddingTitle: "Panduan pernikahan",
        weddingDesc: "Pendampingan menyeluruh termasuk hotel, transportasi, penerjemahan, dan dokumen resmi.",
        dameturkTitle: "DaMeTurk",
        dameturkDesc:
          "Merek es krim Turki asli kami di bawah PT MoonStar Global Indonesia. Kunjungi dameturk.com untuk detail.",
      },
      socialNote:
        "Nama akun YouTube dan Instagram kami tetap endonezyakasifi dan mendukung merek ini melalui produksi konten.",
    },
    philosophy: {
      title: "Cara kami melihat perjalanan",
      intro:
        "Kami tidak melihat perjalanan hanya sebagai pergi ke destinasi. Bagi kami, perjalanan yang direncanakan dengan baik tidak melelahkan, benar-benar menyegarkan, menumbuhkan rasa eksplorasi, dan membuat Anda berkata ‘senang sekali datang’.",
      sections: {
        direct: {
          title: "Organisasi langsung, perencanaan lokal",
          p1:
            "Semua program tur kami direncanakan dan dijalankan langsung oleh tim kami di Indonesia. Kami tidak menawarkan paket yang dibuat di meja dan melewati banyak perantara. Perbedaan utamanya: anggaran Anda digunakan untuk pengalaman, bukan biaya perantara.",
          p2:
            "Dengan anggaran yang sama, Anda mendapatkan konten lebih kaya, aktivitas lebih berkualitas, dan cakupan yang lebih jelas.",
        },
        planning: {
          title: "Kami merencanakan dengan seimbang",
          p1:
            "Setiap tur dirancang dengan mempertimbangkan logika rute, tempo harian, keseimbangan hari bebas dan hari berpemandu, faktor kelelahan, dan profil peserta yang berbeda.",
          bullets: [
            "Pada hari berpemandu kami memasukkan aktivitas utama untuk dinikmati bersama.",
            "Pada hari bebas kami memberi ruang fleksibilitas.",
            "Pengalaman opsional dijelaskan sejak awal.",
          ],
          p2: "Sehingga tidak ada kebingungan apa yang termasuk dan apa yang ekstra.",
        },
        transparency: {
          title: "Transparansi adalah standar",
          p1:
            "Apa yang termasuk dan tidak termasuk jelas sejak awal. Biaya kejutan dan tambahan mendadak bukan bagian dari cara kerja kami.",
        },
        comfort: {
          title: "Liburan yang nyaman untuk semua",
          p1:
            "Tur kami diatur agar setiap peserta bisa menikmati liburan dengan adil. Harmoni grup dan rasa saling menghormati sangat penting.",
          p2:
            "Tujuan kami adalah suasana yang tenang, aman, dan seimbang agar semua orang pulang dengan puas.",
        },
        guidance: {
          title: "Bukan hanya tur—panduan nyata",
          p1:
            "Layanan kami lebih dari sekadar paket tur. Kami bekerja dengan tim di lapangan yang mengenal wilayah dan dapat menyelesaikan masalah dengan cepat.",
        },
        wedding: {
          title: "Panduan pernikahan di Indonesia",
          p1:
            "Selain organisasi perjalanan, kami juga memberi panduan untuk proses khusus seperti menikah di Indonesia.",
          p2:
            "Panduan pernikahan membutuhkan pemahaman prosedur resmi, praktik lokal, waktu, dan koordinasi.",
        },
        expectation: {
          title: "Bersama kami Anda tahu apa yang didapat",
          p1:
            "Mereka yang bepergian bersama kami tahu apa yang mereka dapatkan dan bayarkan—sehingga bisa fokus menikmati liburan.",
        },
      },
      outro:
        "Untuk informasi lebih lanjut tentang sistem matchmaking <1>Uniqah</1> dan panduan <3>Pernikahan</3> di Indonesia, Anda dapat melihat halaman ini. Untuk teks dan kebijakan resmi, gunakan bagian <5>Dokumen</5>.",
    },
    story: {
      title: "Cerita singkat kami",
      steps: [
        "Kami pindah ke Indonesia dan membangun kehidupan di sini.",
        "Kami menjelajahi berbagai pulau dan mengenal negara ini lebih dekat.",
        "Kami mulai berbagi kehidupan di Indonesia dan pengalaman perjalanan melalui kanal YouTube kami.",
        "Hari ini, kami membimbing tamu yang merencanakan perjalanan/tur ke Indonesia serta pasangan yang menjalani proses pernikahan dengan pengalaman ini.",
      ],
      stepLabel: "Langkah",
    },

    support: {
      title: "Kami membantu Anda dalam hal",
      items: {
        joinScheduled: {
          title: "Ikut tur terjadwal sebagai individu / keluarga",
          description:
            "Anda dapat ikut paket tur Indonesia terencana kami sendiri, bersama pasangan, atau keluarga. Pilih tur dengan tanggal, kuota, dan cakupan yang jelas lalu lakukan reservasi langsung melalui halaman Paket Tur.",
        },
        translation: {
          title: "Dukungan penerjemahan & komunikasi",
          description:
            "Penerjemah berbahasa Turki dapat mendampingi Anda saat hari berpemandu, waktu bebas, maupun belanja pribadi—membantu mengurangi hambatan bahasa dan membuat Anda lebih nyaman di Indonesia.",
        },
        privatePlan: {
          title: "Perencanaan perjalanan pribadi & bulan madu",
          description:
            "Jika Anda ingin merencanakan perjalanan Indonesia atau bulan madu tanpa ikut tur grup, kami menyusun penerbangan, akomodasi, rute harian, dan rekomendasi pengalaman bersama lalu membuat rencana yang sesuai untuk Anda.",
        },
        privateGroups: {
          title: "Tur khusus untuk perusahaan & grup teman",
          description:
            "Untuk perusahaan, sekolah, komunitas, atau grup teman, kami merancang program tur khusus berdasarkan tanggal, anggaran, dan ekspektasi Anda. Anda dapat mengajukan permintaan melalui halaman Tur Grup.",
        },
        logistics: {
          title: "Perencanaan akomodasi & transportasi",
          description:
            "Bahkan tanpa membeli paket tur penuh, Anda bisa menggunakan layanan tambahan seperti pemesanan hotel, tiket pesawat, atau sewa mobil. Kami memilih opsi yang aman dan sesuai anggaran/kenyamanan Anda.",
        },
        wedding: {
          title: "Panduan proses pernikahan di Indonesia",
          description:
            "Untuk pasangan yang berencana menikah di Indonesia, kami memberi panduan terkait waktu, praktik lokal, dan koordinasi proses. Detailnya kami bahas khusus di halaman panduan pernikahan.",
        },
      },
    },

    galleryTeaser: {
      title: "Beberapa contoh dari perjalanan kami",
      description:
        "Di bawah ini Anda bisa melihat beberapa momen pilihan dari perjalanan dan pengalaman kami di Indonesia. Untuk lebih banyak, silakan kunjungi galeri kami.",
      cta: "Kunjungi galeri untuk melihat semua foto",
      previewAlt1: "Momen dari kehidupan kami di Indonesia",
      previewAlt2: "Momen dari hari yang kami habiskan bersama di Indonesia",
      previewAlt3: "Momen dari kenangan spesial di Indonesia",
    },

    youtubeHighlights: {
      title: "Video yang paling menggambarkan kami",
      description:
        "Di kanal YouTube kami, Anda dapat menemukan video tentang kehidupan kami di Indonesia, perjalanan dan eksplorasi. Dua video di bawah ini merangkum kami dan dukungan yang kami berikan.",
      v1Title: "Kisah pasangan yang kami dukung selama proses pernikahan di Indonesia",
      v1Desc:
        "Anda dapat melihat pengalaman pasangan yang menjalani proses pernikahan di Indonesia bersama kami dan bagaimana kami membantu.",
      v1ThumbAlt: "Kisah pasangan yang kami dukung selama proses pernikahan di Indonesia",
      v2Title: "Anda tidak akan percaya tempat seperti ini ada di Indonesia! Petualangan Citumang",
      v2Desc: "Potongan seru tentang alam, petualangan, dan kehidupan sehari-hari di Indonesia.",
      v2ThumbAlt: "Video petualangan Citumang",
    },

    whyUs: {
      title: "Mengapa kami?",
      items: [
        {
          title: "Bekerja langsung dengan penyelenggara",
          description:
            "Alih-alih perantara, Anda bekerja dengan tim yang merencanakan dan menjalankan tur di lapangan—keputusan dan jawaban dari sumbernya.",
        },
        {
          title: "Biaya transparan dan jelas",
          description:
            "Kami jelaskan yang termasuk dan tidak termasuk sejak awal, dan memberikan gambaran biaya yang terbuka tanpa biaya tersembunyi.",
        },
        {
          title: "Tim yang bertanggung jawab di lapangan",
          description:
            "Kami tidak hanya hadir saat penjualan—kami juga bersama Anda di lapangan, mengikuti alur, dan memberi solusi saat diperlukan.",
        },
      ],
    },

    modal: {
      close: "Tutup",
    },
  },


  contact: {
    hero: {
      title: "Kontak",
      p1: "Hubungi kami untuk pertanyaan, saran, atau rencana perjalanan Anda. Kami senang membantu.",
      p2:
        "Silakan hubungi kami untuk apa pun yang Anda pikirkan. Kami menyediakan konsultasi gratis. Isi formulir atau hubungi via WhatsApp.",
    },
    sidebar: {
      title: "Informasi kontak",
      socialTitle: "Sosial",
      phone: "Telepon",
      email: "Email",
      whatsapp: "WhatsApp",
      location: "Lokasi",
      askNow: "Tanya sekarang",
      indonesia: "Indonesia",
    },
    form: {
      title: "Kirim pesan",
      success: "Terima kasih. Kami akan menghubungi Anda dalam 24 jam.",
      privacyError: "Anda harus mengonfirmasi bahwa Anda telah membaca dan menyetujui kebijakan privasi.",
      sendError: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.",
      labels: {
        name: "Nama lengkap *",
        email: "Email *",
        phone: "Telepon",
        subject: "Subjek *",
        message: "Pesan *",
      },
      placeholders: {
        name: "Nama lengkap Anda",
        email: "contoh@email.com",
        phone: "+62 ...",
        subject: "Subjek singkat",
        message: "Tulis pesan Anda",
      },
      consentPrefix: "Saya telah membaca dan menyetujui kebijakan privasi.",
      privacyLink: "Kebijakan Privasi",
      submit: "Kirim",
      submitting: "Mengirim…",
    },
  },

  authPage: {
    title: 'Masuk / Daftar',
    context: {
      payment: 'Silakan masuk untuk melanjutkan ke pembayaran.',
      panel: 'Silakan masuk untuk melanjutkan ke profil Anda.',
      generic: 'Silakan masuk untuk melanjutkan.',
    },
    forceInfo: 'Untuk aksi ini diminta masuk ulang. Silakan masuk kembali.',
    googleCta: 'Lanjutkan dengan Google',
    redirecting: 'Mengalihkan ke login Google…',
    or: 'atau',
    labels: {
      email: 'Email',
      password: 'Kata sandi',
      gender: 'Jenis kelamin',
      nationality: 'Kewarganegaraan',
      nationalityOther: 'Kewarganegaraan lain (tulis)',
    },
    placeholders: {
      email: 'contoh@email.com',
      password: 'Kata sandi Anda',
      nationality: 'Pilih kewarganegaraan',
      nationalityOther: 'contoh: Jerman',
    },
    actions: {
      login: 'Masuk',
      signup: 'Daftar',
      switchToSignup: 'Belum punya akun? Daftar',
      switchToLogin: 'Sudah punya akun? Masuk',
      forgot: 'Lupa kata sandi',
    },
    signup: {
      genderMale: 'Saya laki-laki',
      genderFemale: 'Saya perempuan',
      nationalityTr: 'Turki',
      nationalityId: 'Indonesia',
      nationalityOther: 'Lainnya',
      ageConfirm: 'Saya mengonfirmasi bahwa saya berusia minimal {{minAge}} tahun. (Buka perjanjian untuk detail)',
      ageConfirmLink: 'Perjanjian',
    },
    forgotHint: {
      prefix: 'Jika Anda lupa kata sandi, klik',
      suffix: 'untuk menerima tautan reset melalui email.',
    },
    legal: {
      prefix: 'Dengan melanjutkan, Anda menyetujui',
      contract: 'Perjanjian Pengguna / Keanggotaan',
      cancelRefund: 'Kebijakan pembatalan & refund',
      privacy: 'Kebijakan Privasi',
    },
    resetSent: 'Tautan reset kata sandi telah dikirim ke email Anda.',
    errors: {
      googleFailed: 'Masuk dengan Google gagal.',
      invalidCredential: 'Email atau kata sandi salah (atau akun tidak ditemukan). Jika Anda lupa kata sandi, gunakan “Lupa kata sandi”.',
      invalidEmail: 'Alamat email tampak tidak valid. Silakan periksa dan coba lagi.',
      emailAlreadyInUse: 'Akun dengan email ini sudah ada. Silakan masuk atau gunakan “Lupa kata sandi”.',
      weakPassword: 'Kata sandi terlalu lemah. Silakan pilih kata sandi yang lebih kuat (mis. minimal 6 karakter).',
      emailPasswordRequired: 'Email dan kata sandi wajib diisi.',
      genderRequired: 'Pilih jenis kelamin untuk mendaftar.',
      nationalityRequired: 'Pilih kewarganegaraan untuk mendaftar.',
      nationalityOtherRequired: 'Tuliskan kewarganegaraan Anda.',
      ageConfirmRequired: 'Untuk mendaftar, Anda harus mengonfirmasi bahwa Anda berusia minimal {{minAge}} tahun.',
      loginFailed: 'Gagal masuk.',
      resetEmailRequired: 'Masukkan email untuk mereset kata sandi.',
      resetFailed: 'Tidak dapat mengirim email reset kata sandi.',
      emailNotVerified: 'Email belum diverifikasi. Silakan klik tautan verifikasi di inbox Anda.',
      emailVerificationSent: 'Email verifikasi telah dikirim. Silakan cek inbox Anda.',
      emailVerificationSend: 'Kirim ulang email verifikasi',
      emailVerificationFailed: 'Email verifikasi gagal dikirim. Silakan coba lagi.',
    },
  },

  matchmakingPanel: {
    title: 'Profil Saya',
    subtitle: 'Langkah pencocokan, keanggotaan, dan kontak Anda akan tampil di sini.',
    tabs: {
      info: 'Info/Aturan',
      matches: 'Kecocokan saya',
    },
    photos: {
      updateRequest: {
        title: 'Permintaan pembaruan foto',
        lead: 'Unggah 3 foto baru. Foto akan diperbarui setelah disetujui admin.',
        pending: 'Sedang ditinjau',
        cta: 'Kirim permintaan',
        uploading: 'Mengunggah…',
        success: 'Permintaan diterima. Foto akan diperbarui setelah ditinjau.',
        errors: {
          photosRequired: 'Silakan pilih 3 foto.',
          photoType: 'Silakan pilih file gambar saja (jpg/png/webp).',
          applicationNotFound: 'Pengajuan tidak ditemukan. Silakan isi formulir terlebih dahulu.',
          failed: 'Tidak bisa mengirim permintaan. Silakan coba lagi.',
        },
      },
    },
    trust: {
      title: 'Kenapa kami meminta Anda mengisi formulir?',
      lead:
        'Ini bukan sekadar melihat-lihat secara acak. Ini adalah sistem pencocokan tertutup yang bekerja berdasarkan informasi Anda. Mengisi formulir sekali membantu kami memilih kandidat yang cocok dengan lebih akurat dan menjalankan proses dengan aman. Profil Anda tidak ditampilkan secara publik.',
      cards: {
        quality: {
          title: 'Pencocokan lebih tepat',
          body: 'Detail utama seperti usia, lokasi, dan harapan membantu kami menemukan kandidat yang sesuai lebih cepat.',
        },
        privacy: {
          title: 'Privasi diutamakan',
          body: 'Profil Anda tidak bersifat publik. Kandidat muncul di panel Anda secara terkontrol; kontak tidak dibagikan tanpa persetujuan kedua pihak.',
        },
        control: {
          title: 'Anda tetap memegang kendali',
          body: 'Anda melanjutkan proses dengan terima/tolak di panel. Jika perlu perubahan, Anda bisa memperbarui lewat WhatsApp.',
        },
      },
      rulesTitle: 'Aturan sistem (singkat)',
      rules: [
        'Berikan informasi yang benar dan terbaru; jangan memberikan data yang menyesatkan.',
        'Gunakan bahasa yang sopan; pelecehan dan pesan yang memaksa tidak diperbolehkan.',
        'Hormati privasi: jangan membagikan tangkapan layar atau data pribadi.',
        'Detail kontak hanya dibagikan dengan persetujuan kedua pihak dan sesuai aturan.',
      ],
    },
    actions: {
      logout: 'Keluar',
      whatsapp: 'Chat via WhatsApp',
      remove: 'Hapus',
      sending: 'Mengirim…',
      pending: 'Menunggu…',
      accept: 'Setujui',
      accepted: 'Disetujui',
      reject: 'Tolak',
      rejected: 'Ditolak',
      rejectAll: 'Tolak semua',
      rejectAllConfirm: 'Yakin ingin menolak semua kandidat?',
      rejectAllSuccess_one: '{{count}} kecocokan ditolak.',
      rejectAllSuccess_other: '{{count}} kecocokan ditolak.',
      showOldMatches: 'Tampilkan kandidat sebelumnya',
      hideOldMatches: 'Tampilkan hanya pilihan saya',
      dismissMatch: 'Hapus kecocokan dari panel saya',
      requestNew: 'Minta kecocokan baru',
      requestNewWithRemaining: 'Minta kecocokan baru ({{remaining}}/{{limit}})',
      requestingNew: 'Mengirim permintaan…',
      requestNewQuotaHint: 'Kuota harian: {{remaining}}/{{limit}}',
      requestNewSuccess: 'Permintaan Anda diterima. Kandidat baru akan muncul jika tersedia.',
    },
    choice: {
      title: 'Anda memilih satu kandidat.',
      body: 'Kandidat lain tidak dihapus. Anda bisa memilih untuk menampilkan hanya pilihan Anda atau melihat kandidat sebelumnya kapan saja.',
    },
    errors: {
      actionFailed: 'Aksi gagal.',
      rejectAllFailed: 'Gagal menolak semua.',
      membershipRequired: 'Keanggotaan aktif diperlukan untuk setuju/tolak.',
      verificationRequired: 'Verifikasi identitas diperlukan untuk melakukan aksi ini.',
      membershipOrVerificationRequired: 'Aksi ini membutuhkan keanggotaan berbayar atau (untuk wanita) verifikasi identitas + keanggotaan aktif gratis.',
      freeActiveMembershipRequired: 'Aksi ini membutuhkan keanggotaan aktif gratis Anda. Jika sudah terverifikasi, Anda bisa mengajukan dari panel.',
      freeActiveMembershipBlocked: 'Hak keanggotaan aktif gratis Anda dinonaktifkan. Anda perlu keanggotaan berbayar untuk aksi ini.',
      otherUserMatched: 'Orang ini sudah cocok dengan orang lain.',
      alreadyMatched: 'Anda sudah memiliki kecocokan.',
      userLocked: 'Proses kecocokan Anda terkunci. Aksi ini tidak diizinkan.',
      requestNewFailed: 'Tidak bisa meminta kecocokan baru.',
      requestNewRateLimited: 'Anda terlalu sering meminta. Silakan coba lagi nanti.',
      requestNewQuotaExhausted: 'Kuota permintaan kecocokan baru hari ini sudah habis (3/3). Silakan coba lagi besok.',
      requestNewFreeActiveBlocked: 'Anda tidak bisa meminta kecocokan baru karena hak keanggotaan aktif gratis Anda dibatalkan. Anda perlu keanggotaan berbayar untuk mengaktifkan kembali.',
    },
    afterSubmit: {
      title: 'Pengajuan Anda diterima.',
      body: 'Anda dapat melihat detail pengajuan di bawah. Jika perlu perubahan, hubungi kami via WhatsApp.',
    },
    account: {
      title: 'Akun',
      emailLabel: 'Nama pengguna (email)',
      nameLabel: 'Nama',
    },
    application: {
      title: 'Pengajuan Pencocokan Pernikahan',
      empty: 'Anda belum memiliki pengajuan pencocokan.',
      goToForm: 'Buka formulir pengajuan',
      fallbackName: 'Pengajuan',
      profileNo: 'Kode Pengajuan',
      username: 'Nama pengguna',
      applicationId: 'ID Pengajuan',
      photoAlt: 'Profil',
    },
    common: {
      status: 'Status',
      age: 'Usia',
      whatsapp: 'WhatsApp',
      email: 'Email',
      instagram: 'Instagram',
      cityCountry: 'Kota/Negara',
    },
    update: {
      title: 'Perbarui info',
      body: 'Kami tidak mengubah formulir secara online. Jika ingin memperbarui info, silakan chat via WhatsApp.',
      whatsappMessage: 'Saya ingin memperbarui informasi pengajuan pencocokan pernikahan saya.\nNama lengkap: {{fullName}}\nKode pengajuan: {{profileCode}}',
    },
    onboarding: {
      title: 'Sebelum mulai',
      intro:
        'Panel ini untuk mengelola proses pencocokan. Untuk membuat profil, Anda mengisi formulir sekali. Setelah profil dibuat, setiap login berikutnya langsung membuka panel ini.',
      rulesTitle: 'Tujuan sistem & aturan',
      rules: {
        r1: 'Ini bukan area melihat profil publik; profil tidak dipublikasikan secara terbuka.',
        r2: 'Informasi digunakan untuk pencocokan dan komunikasi yang aman.',
        r3: 'Jika ada kecocokan, kandidat muncul di panel Anda; Anda lanjut dengan suka/lewati.',
        r4: 'Berbagi kontak dibuka berdasarkan persetujuan bersama dan aturan yang berlaku.',
      },
      confirm: 'Saya sudah membaca penjelasan dan aturan.',
      createProfile: 'Buat profil',
      startForm: 'Isi formulir untuk memulai pencocokan',
      howWorks: 'Bagaimana sistem bekerja?',
      note: 'Catatan: Setelah membuat profil, kirim formulir satu kali. Login berikutnya tidak akan diarahkan ke formulir lagi.',
    },
    membership: {
      title: 'Status keanggotaan',
      active: 'Keanggotaan Anda aktif.',
      inactive: 'Keanggotaan tidak aktif. Sampai aktif, Anda tidak bisa melihat detail penuh atau memberi suka/tolak.',
      inactiveMale: 'Keanggotaan tidak aktif. Sampai aktif, Anda tidak bisa melihat detail penuh atau memberi suka/tolak.',
      inactiveFemale: 'Keanggotaan tidak aktif. Pencocokan dan pratinjau terbatas gratis. Untuk melakukan aksi, Anda perlu keanggotaan aktif gratis (dengan verifikasi) atau keanggotaan berbayar.',
      activeViaVerification: 'Identitas Anda terverifikasi. Untuk melakukan aksi, Anda bisa mengajukan keanggotaan aktif gratis atau membeli keanggotaan berbayar.',
      freeActiveActive: 'Keanggotaan aktif gratis Anda aktif (melalui verifikasi identitas).',
      freeActiveTermsTitle: 'Syarat keanggotaan aktif gratis',
      freeActiveTermsBody: 'Jika Anda mendapatkan keanggotaan aktif gratis lewat verifikasi identitas dan tidak aktif selama 48 jam, keanggotaan aktif gratis akan dibatalkan. Saat mengajukan kembali, batas waktu turun menjadi 24 jam. Jika tetap tidak aktif, Anda tidak bisa mendapatkan keanggotaan aktif gratis sampai membeli keanggotaan berbayar, dan Anda tidak bisa meminta kecocokan baru.',
      freeActiveApply: 'Ajukan keanggotaan aktif gratis',
      freeActiveApplying: 'Mengajukan…',
      freeActiveApplied: 'Keanggotaan aktif gratis Anda diaktifkan. Durasi: {{hours}} jam.',
      daysLeft_one: 'Sisa waktu: {{count}} hari.',
      daysLeft_other: 'Sisa waktu: {{count}} hari.',
      until: 'Berakhir: {{date}}.',
    },
    membershipNotice: {
      title: 'Info suka / detail / kontak',
      male: {
        lead: 'Alur untuk pengguna pria:',
        points: [
          'Pencocokan dan pratinjau terbatas gratis.',
          'Melihat detail penuh, suka/tolak, dan menghubungi memerlukan membership berbayar.',
        ],
      },
      female: {
        lead: 'Alur untuk pengguna wanita:',
        points: [
          'Pencocokan dan pratinjau terbatas gratis.',
          'Melihat detail penuh, suka/tolak, dan menghubungi memerlukan verifikasi identitas + free active membership atau membership berbayar.',
          'Free active membership memiliki aturan tidak aktif (lihat bagian syarat di panel).',
        ],
      },
    },
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Alur sistem, aturan, dan FAQ — di satu tempat.',
      faq: {
        title: 'Pertanyaan umum (FAQ)',
        items: [
          {
            q: 'Kenapa saya tidak melihat profil secara publik?',
            a: 'Ini adalah sistem tertutup. Profil tidak ditampilkan publik; kandidat paling cocok muncul di panel Anda.',
          },
          {
            q: 'Apa yang diperlukan untuk suka / detail / kontak?',
            a: 'Untuk pengguna pria, membership berbayar diperlukan. Untuk pengguna wanita, verifikasi identitas + free active membership atau membership berbayar diperlukan.',
          },
          {
            q: 'Untuk apa verifikasi identitas?',
            a: 'Sebagai lencana kepercayaan. Membantu proses keluhan dengan bukti dan (untuk wanita) dapat membuka alur free active membership.',
          },
          {
            q: 'Jika ada perilaku mencurigakan/penipuan, apa yang harus saya lakukan?',
            a: 'Hubungi dukungan WhatsApp. Setelah ditinjau, akun dapat diblokir dari sistem.',
          },
        ],
      },
    },
    verification: {
      title: 'Verifikasi identitas',
      verifiedBadge: 'Identitas terverifikasi',
      requiredTitle: 'Verifikasi identitas (lencana)',
      requiredBody: 'Verifikasi identitas adalah lencana kepercayaan. Jika ada pelanggaran aturan, Anda bisa mengajukan keluhan dengan screenshot/bukti.',
      unverifiedTitle: 'Belum terverifikasi (lencana)',
      unverifiedBodyMale: 'Verifikasi identitas bersifat opsional. Catatan: untuk pria, aksi membutuhkan keanggotaan aktif.',
      unverifiedBodyFemale: 'Verifikasi identitas bersifat opsional. Catatan: wanita bisa menggunakan aksi dengan keanggotaan atau verifikasi identitas.',
      referenceCode: 'Kode verifikasi',
      actions: {
        startWhatsapp: 'Verifikasi via WhatsApp',
        startKyc: 'KYC otomatis (ID + selfie)',
        startManual: 'Minta persetujuan manual',
        openWhatsapp: 'Kirim pesan verifikasi di WhatsApp',
      },
      errors: {
        kycNotConfigured: 'KYC otomatis belum dikonfigurasi. Silakan gunakan WhatsApp atau verifikasi manual.',
        whatsappNotConfigured: 'Nomor WhatsApp belum dikonfigurasi. Silakan gunakan verifikasi manual.',
      },
    },
    membershipGate: {
      title: 'Keanggotaan diperlukan',
      body: 'Sampai keanggotaan aktif, Anda hanya bisa melihat foto, nama pengguna, usia, kota dan status pernikahan. Keanggotaan diperlukan untuk setuju/tolak. Anda bisa menghapus kecocokan dan meminta yang baru.',
    },
    membershipOrVerificationGate: {
      title: 'Keanggotaan atau verifikasi identitas diperlukan',
      body: 'Sampai Anda memiliki keanggotaan aktif atau verifikasi identitas, Anda hanya bisa melihat detail profil terbatas. Anda tetap bisa menghapus kecocokan dan meminta yang baru.',
    },
    lock: {
      title: 'Proses kecocokan Anda sedang berjalan.',
      body: 'Setelah saling menerima, kecocokan ini menjadi proses aktif Anda. 48 jam pertama hanya chat di dalam situs. Setelah 48 jam, Anda bisa mengirim permintaan kontak; nomor telepon hanya terlihat jika pihak lain menyetujui.',
      matchId: 'Kode Kecocokan',
    },
    matches: {
      autoRunNotice: 'Pencocokan otomatis berjalan kira-kira setiap {{minutes}} menit. Anda juga bisa meminta kecocokan baru secara manual di sini.',
      presence: {
        online: 'Online',
        lastSeen: 'Terakhir aktif: {{time}}',
        unknown: 'Terakhir aktif: -',
      },

      progress: {
        title: 'Progres',
        steps: {
          proposed: 'Perkenalan',
          mutualAccepted: 'Saling setuju',
          confirm48h: 'Konfirmasi 48 jam',
          contact: 'Kontak',
        },
        remaining: 'Sisa waktu: {{h}} jam {{m}} mnt',
      },

      quickQuestions: {
        title: '3 pertanyaan singkat',
        lead: 'Kalau mau, jawab 3 pertanyaan singkat dengan sekali tap untuk saling mengenal lebih cepat. Opsional.',
        yourAnswer: 'Kamu',
        otherAnswer: 'Dia',
        pickOne: 'Pilih satu',
        otherAnswered: 'Sudah jawab',
        otherNotAnswered: 'Belum jawab',
        questions: {
          q1: {
            title: 'Kamu prefer pace seperti apa?',
            options: {
              slow: 'Pelan',
              normal: 'Normal',
              fast: 'Cepat',
            },
          },
          q2: {
            title: 'Keluarga vs kemandirian?',
            options: {
              family: 'Fokus keluarga',
              balanced: 'Seimbang',
              independent: 'Mandiri',
            },
          },
          q3: {
            title: 'Pindah kota / relokasi?',
            options: {
              local: 'Kota yang sama',
              open: 'Terbuka',
              flexible: 'Fleksibel',
            },
          },
        },
      },
      title: 'Kecocokan Anda',
      subtitle: 'Maksimal 3 / 5 / 10 kandidat ditampilkan sesuai paket Anda.',
      empty: 'Ketika ditemukan kecocokan yang sesuai dengan profil Anda, akan muncul di sini. Simpan halaman ini di ponsel atau komputer Anda agar mudah dibuka kembali saat ingin mengecek.',
      savePage: 'Simpan halaman',
      savePageAlready: 'Halaman ini sudah ditambahkan ke layar utama / terpasang sebagai aplikasi.',
      savePageIosHint: 'iPhone/iPad: Di Safari, ketuk Bagikan → “Tambah ke Layar Utama”. (Tautan disalin.)',
      savePageAndroidHint: 'Android: Dari menu browser pilih “Tambahkan ke layar utama” atau “Instal aplikasi”. (Tautan disalin.)',
      savePageDesktopHint: 'Komputer: Dari menu browser pilih “Instal aplikasi” (jika ada) atau tambahkan bookmark (Ctrl+D). (Tautan disalin.)',
      waitingOther: 'Menunggu jawaban pihak lain.',
      mutualAcceptedNotice: 'Kedua pihak menyetujui. Anda bisa memilih langkah berikutnya.',
      rejectedByOther: {
        title: 'Orang ini menolak Anda.',
        body: 'Anda bisa menghapus kecocokan ini dari panel dan meminta kandidat baru (batas harian berlaku).',
      },
      interaction: {
        title: 'Langkah berikutnya',
        lead: 'Aksi terjadi hanya ketika kedua pihak memilih opsi yang sama. Anda bisa mengubah pilihan; sistem akan menerapkan ketika kedua pihak sepakat.',
        offsite: 'Lanjut di luar situs',
        cancel: 'Batalkan kecocokan',
        offsiteShort: 'Lanjut di luar situs',
        cancelShort: 'Batalkan kecocokan',
        offsiteInfoTitle: 'Jika lanjut di luar situs',
        offsiteInfoBody: 'Jika kedua pihak memilih ini, detail kontak akan terbuka untuk kedua pihak dan Anda bisa lanjut via WhatsApp, dll.',
        cancelInfoTitle: 'Jika membatalkan kecocokan',
        cancelInfoBody: 'Jika kedua pihak memilih ini, kecocokan berakhir, kunci dilepas, dan kandidat lain terlihat lagi.',
        choosePrompt: 'Pilih opsi untuk melanjutkan.',
        yourChoice: 'Pilihan Anda: {{choice}}',
        membershipRequired: 'Keanggotaan aktif diperlukan untuk langkah ini.',
        verificationRequired: 'Verifikasi identitas diperlukan untuk langkah ini.',
        otherPrefersOffsite: '{{name}} memilih “lanjut di luar situs”. Anda bisa membuka kontak dengan memilih itu juga.',
        otherPrefersCancel: '{{name}} memilih “batalkan kecocokan”. Anda bisa mengakhiri kecocokan dengan memilih batal juga.',
        offsiteWaiting: 'Pilihan Anda tersimpan. Menunggu pihak lain memilih opsi yang sama.',
      },
      chat: {
        open: 'Pesan',
        title: 'Chat di Dalam Situs',
        lead: 'Anda bisa ngobrol di sini sebelum memutuskan. Berbagi kontak/IG/FB/link diblokir.',
        enableNotifications: 'Aktifkan notifikasi',
        notificationsEnabled: 'Notifikasi aktif.',
        notificationsDenied: 'Izin notifikasi ditolak.',
        notificationsNotSupported: 'Browser ini tidak mendukung notifikasi.',
        notificationTitle: 'Pesan baru',
        notificationBody: 'Ada pesan baru dari kecocokan Anda.',
        timeLeft: 'Sisa waktu: {{minutes}} menit',
        timeUnknown: 'Sisa waktu: -',
        rulesTitle: 'Aturan',
        rulesBody: 'Nomor telepon/WhatsApp, Instagram/Facebook dan link tidak boleh pada tahap ini.',
        empty: 'Belum ada pesan. Anda bisa kirim pesan pertama.',
        placeholder: 'Tulis pesan…',
        send: 'Kirim',
        continue: 'Lanjut (Setuju)',
        reject: 'Tidak cocok (Tolak)',
        proposedLimit: {
          counter: 'Chat: {{used}} / {{limit}}',
          reachedTitle: 'Saatnya memutuskan',
          reachedBody: 'Batas pesan sudah tercapai. Setujui untuk lanjut atau tolak jika tidak cocok.',
          startActive: 'Mulai kecocokan aktif',
          pendingYou: 'Permintaan kecocokan aktif Anda sudah dikirim. Menunggu persetujuan lawan bicara.',
          pendingIncomingTitle: '{{name}} meminta kecocokan aktif',
          pendingIncomingBody: 'Setujui untuk memulai kecocokan aktif.',
        },
        rejectReasons: {
          hint: 'Alasan menolak (opsional):',
          notFeeling: 'Kurang cocok',
          values: 'Nilai/kecocokan',
          distance: 'Jarak/lokasi',
          communication: 'Gaya komunikasi',
          notReady: 'Belum siap saat ini',
          other: 'Lainnya',
        },
        pause: {
          focusTitle: 'Chat ini sedang ditahan',
          focusBody: 'Karena Anda sedang melanjutkan kecocokan lain, chat ini sementara dijeda. Anda tidak bisa mengirim pesan.',
          otherTitle: 'Chat sementara ditahan',
          otherBody: 'Pesan Anda belum dikirim sekarang; chat akan lanjut otomatis saat tersedia.',
          heldBadge: 'Ditahan (belum terkirim)',
          deliveredBadge: 'Terkirim',
        },
        heldSummary: {
          title: '{{count}} pesan ditahan',
          body: 'Saat chat ini ditahan, pihak lain mengirim pesan. Anda bisa memilih untuk melihatnya sekarang.',
          show: 'Tampilkan pesan',
          keepHidden: 'Sembunyikan dulu',
          releaseFailed: 'Pesan tidak dapat dibuka. Silakan coba lagi.',
        },
        limitReachedNotice: {
          title: 'Anda mencapai batas pesan',
          body:
            'Untuk melanjutkan percakapan, Anda perlu memulai kecocokan aktif. Memulai kecocokan aktif akan menahan kecocokan lain, dan Anda hanya akan melanjutkan chat dengan kecocokan aktif Anda.',
          dismiss: 'OK',
        },
        errors: {
          filtered: 'Pesan Anda terdeteksi berisi kontak/sosmed/link dan diblokir.',
          rateLimited: 'Anda mengirim terlalu cepat. Tunggu sebentar.',
          closed: 'Chat sudah habis atau ditutup.',
          notEnabled: 'Chat di dalam situs tidak diaktifkan untuk kecocokan ini.',
          membershipRequired: 'Keanggotaan aktif diperlukan untuk chat.',
          verificationRequired: 'Verifikasi identitas diperlukan untuk chat.',
          limitReached: 'Batas pesan tercapai. Anda perlu memutuskan.',
          chatPaused: 'Chat ini sementara ditahan.',
          sendFailed: 'Pesan gagal dikirim.',
          decisionFailed: 'Keputusan gagal disimpan.',
        },
      },
      candidate: {
        fallbackName: 'Kandidat',
        verifiedBadge: 'Identitas terverifikasi',
        proBadge: 'PRO',
        standardBadge: 'STANDAR',
        badges: {
          activeRecent: 'Baru aktif',
          mutualAccepted: 'Saling setuju',
          confirmed: 'Terkonfirmasi',
          contactUnlocked: 'Kontak terbuka',
          contactPending: 'Permintaan kontak menunggu',
        },
        matchedProfile: 'Profil kecocokan',
        score: 'Skor kecocokan',
        likeBadge: '♥ Anda mendapat like',
        likeSentBadge: '✓ Like terkirim',
        profileInfo: 'Tampilkan info profil',
        hideProfileInfo: 'Sembunyikan',
        profileInfoTitle: 'Info profil (tanpa kontak)',
        partnerAgeMin: 'Usia min',
        partnerAgeMax: 'Usia max',
        photoAlt: 'Foto',
        maritalStatus: 'Status pernikahan',
        detailsTitle: 'Detail',
        aboutLabel: 'Tentang',
        expectationsLabel: 'Harapan',
        heightLabel: 'Tinggi',
        educationLabel: 'Pendidikan',
        occupationLabel: 'Pekerjaan',
        religionLabel: 'Agama',
      },
      contactUnlocked: {
        title: 'Berbagi kontak sudah terbuka.',
        body: 'Anda bisa membuka detail kontak dari panel. Harap tetap sopan dan patuhi aturan.',
      },
      contactLocked: {
        title: 'Detail kontak (terkunci 48 jam)',
        body: 'Detail kontak akan terbuka 48 jam setelah chat aktif. Sementara itu, Anda bisa chat di dalam situs.',
      },
      paymentStatus: {
        pending: 'Pemberitahuan pembayaran Anda masih menunggu. Keanggotaan akan aktif setelah disetujui admin.',
        rejected: 'Pemberitahuan pembayaran terakhir Anda ditolak. Periksa bukti bayar/referensi lalu kirim ulang.',
        approved: 'Pembayaran disetujui. Keanggotaan diaktifkan.',
      },
      contact: {
        title: 'Detail kontak',
      },
      contactUnlock: {
        membershipActiveTitle: 'Anda memenuhi syarat',
        membershipActiveBody: 'Klik tombol untuk membuka detail kontak. (Pihak lain juga harus memenuhi aturan kelayakan.)',
        lockedTitle: 'Kontak terkunci',
        lockedBody: 'Detail kontak terbuka 48 jam setelah chat dimulai. Sisa waktu: {{time}}',
        lockedBodyNoTime: 'Detail kontak terbuka 48 jam setelah chat dimulai.',
        opening: 'Membuka…',
        open: 'Bagikan info kontak saya',
        verificationRequired: 'Verifikasi identitas diperlukan untuk membuka detail kontak.',
      },
      payment: {
        membershipRequiredTitle: 'Keanggotaan diperlukan',
        membershipRequiredBody: 'Keanggotaan bulanan membuka detail kontak.',
        pendingNotice: 'Pemberitahuan pembayaran untuk kecocokan ini masih menunggu.',
        trTitle: 'Turki',
        idTitle: 'Indonesia',
        amount: 'Jumlah',
        package: 'Paket',
        packageEco: 'Eco',
        packageStandard: 'Standar',
        packagePro: 'Pro',
        perMonth: 'langganan bulanan',
        badgeValue: 'Paling hemat',
        badgePopular: 'Populer',
        badgePro: 'Tertinggi',
        descEco: 'Akses dasar dan terjemahan secukupnya.',
        descStandard: 'Lebih banyak kandidat dan terjemahan sponsor.',
        descPro: 'Kandidat maksimum dan kuota terjemahan tinggi.',
        featureMaxCandidates: 'Maks. {{count}} kandidat di panel',
        featureTranslateMonthly: '{{count}} pesan diterjemahkan / bulan',
        sponsoredIfOther: 'Bisa disponsori jika lawan bicara Standard/Pro',
        sponsorsOthers: 'Terjemahan sponsor untuk lawan bicara (biaya ditagihkan ke Anda)',
        feature48hLock: 'Bagikan kontak: setujui setelah 48 jam chat',
        translationCostEstimate: 'Perkiraan biaya API terjemahan: ~$ {{amount}} / bulan',
        packageHelp: 'Harga dan izin diterapkan sesuai paket yang dipilih.',
        recipient: 'Penerima',
        iban: 'IBAN',
        detailsSoon: 'Detail rekening akan segera ditambahkan.',
        payWithQris: 'Bayar dengan QRIS (tautan)',
        reportTitle: 'Pemberitahuan pembayaran',
        currency: 'Mata uang',
        currencyTRY: 'TRY (Turki)',
        currencyIDR: 'IDR (Indonesia)',
        currencyUSD: 'USD (Dolar)',
        method: 'Metode pembayaran',
        methodEftFast: 'EFT / FAST',
        methodSwiftWise: 'SWIFT / Wise',
        methodQris: 'QRIS',
        methodOther: 'Lainnya',
        reference: 'Referensi / keterangan (opsional)',
        referencePlaceholder: 'No bukti, keterangan, nama pengirim…',
        note: 'Catatan (opsional)',
        notePlaceholder: 'Tambahkan info jika perlu',
        receipt: 'Bukti bayar (opsional)',
        receiptHelp: 'Anda bisa unggah foto atau tempel tautan bukti bayar di bawah.',
        receiptLink: 'Tautan bukti bayar (opsional)',
        viewReceipt: 'Lihat bukti bayar',
        uploadingReceipt: 'Mengunggah bukti bayar…',
        sendPayment: 'Kirim pemberitahuan pembayaran ({{amount}} {{currency}})',
        supportWhatsapp: 'Dukungan WhatsApp',
        supportWhatsappMessage: 'Saya butuh bantuan terkait keanggotaan/pembayaran dalam proses pencocokan. Kode Kecocokan: {{matchCode}}',
      },
    },
    intro: {
      title: 'Cara kerja pencocokan',
      body: 'Tujuan kami adalah membantu orang yang berniat menikah berkenalan dengan aman. Poin di bawah menjelaskan cara kerja sistem sebenarnya.',
      cta: 'Isi formulir pencocokan',
      eligibilityPointMale: 'Pencocokan dan pratinjau profil di dalam situs tidak memerlukan keanggotaan. Untuk melihat detail profil lengkap, setuju/tolak, atau menghubungi pasangan, Anda harus membeli keanggotaan aktif.',
      eligibilityPointFemale: 'Pencocokan dan melihat info profil terbatas di dalam situs tidak memerlukan keanggotaan. Untuk setuju/tolak dan menghubungi pasangan, Anda harus mengajukan keanggotaan aktif gratis dengan verifikasi identitas atau membeli keanggotaan berbayar.',
      points: [
        'Profil tidak bersifat publik. Hanya pengguna yang cocok yang bisa melihat detail satu sama lain.',
        'Maksimal 3 / 5 / 10 kandidat ditampilkan sesuai paket. Menandai/memilih kandidat tidak menghapus kandidat lain; Anda bisa memilih untuk menampilkan hanya pilihan Anda.',
        'Langkah 1: Tinjau kandidat → Setuju atau Tolak. Jika salah satu menolak, kecocokan dibatalkan.',
        'Langkah 2 (persetujuan kedua): Jika kedua pihak setuju, pilih langkah berikutnya di panel (chat di dalam situs atau berbagi kontak). Langkah aktif hanya jika kedua pihak memilih opsi yang sama.',
        'Kunci: Saat langkah 2 disepakati, proses terkunci dan Anda tidak bisa meminta kecocokan baru sampai selesai/dibatalkan.',
        'Chat di dalam situs memblokir nomor telepon/WhatsApp, sosmed dan tautan. Jika berbagi kontak terbuka, tanggung jawab ada pada masing-masing pihak.',
        'Permintaan kandidat baru: Jika Anda ditolak, Anda bisa menghapus kecocokan itu dari panel dan meminta yang baru (kuota harian: 3).',
        '{{eligibilityPoint}}',
        'Keamanan: Jika aturan dilanggar (info palsu, hinaan/pelecehan, pelecehan seksual, eksploitasi finansial, niat kencan/hiburan) dan terbukti dengan screenshot/bukti, pengguna diblokir permanen dan tidak dapat meminta refund.',
      ],
    },
    rules: {
      title: 'Pencocokan Pernikahan: Janji Kami, Aturan & Keamanan',
      lead: 'Platform ini bukan untuk kencan/hiburan. Platform ini dibuat agar perkenalan berniat menikah lebih aman dan lebih terkontrol.',
      open: 'Lihat aturan dan proses',
      promise: {
        title: 'Apa yang kami janjikan?',
        p1Title: 'Sistem fokus pernikahan',
        p1Body: 'Tujuannya bukan kencan/bermain-main. Ini adalah proses terkontrol untuk berkenalan dengan niat menikah yang serius.',
        p2Title: 'Privasi',
        p2Body: 'Profil tidak bersifat publik. Detail hanya ditampilkan kepada pihak yang menerima penawaran kecocokan.',
        p3Title: 'Mekanisme keputusan',
        p3Body: 'Penawaran kecocokan berjalan dengan keputusan setuju/tolak. Tanpa persetujuan dua pihak, proses tidak berlanjut; satu penolakan mengakhiri kecocokan.',
        p4Title: 'Persetujuan kedua + keanggotaan',
        p4Body: 'Setelah persetujuan dua pihak, persetujuan kedua dilakukan dengan memilih opsi yang sama di panel (chat di dalam situs atau berbagi kontak). Proses terkunci hanya setelah ada kesepakatan ini.',
        p5Title: 'Nol toleransi untuk niat buruk',
        p5Body: 'Tidak mentolerir hinaan, penipuan, kebohongan, dan perilaku serupa.',
      },
      zeroTolerance: {
        title: 'Aturan ketat (nol toleransi)',
        r1Title: 'Tidak sopan/umpatan/hinaan',
        r1Body: 'Bahasa kasar, merendahkan, mengancam, atau melecehkan dilarang keras.',
        r2Title: 'Niat selain pernikahan',
        r2Body: 'Niat kencan/hiburan, relasi kepentingan, pelecehan/penyalahgunaan seksual, atau penggunaan tanpa niat menikah dilarang.',
        r3Title: 'Penipuan / meminta uang',
        r3Body: 'Meminta uang, mengarahkan ke tautan, permintaan investasi/kripto, skenario “butuh uang cepat”, dan sejenisnya dilarang.',
        r4Title: 'Informasi menyesatkan & profil palsu',
        r4Body: 'Menggunakan info/foto yang tidak sesuai atau berbohong pada hal penting (identitas/usia/status, dll.) dilarang.',
        r5Title: 'Spam & penyalahgunaan',
        r5Body: 'Pesan massal, mengejar terus-menerus, manipulasi, laporan palsu, atau mengeksploitasi celah sistem dilarang.',
        r6Title: 'Berbagi ke pihak ketiga',
        r6Body: 'Membagikan foto/pesan/info pasangan ke pihak ketiga tanpa izin dilarang.',
      },
      enforcement: {
        title: 'Sanksi & kebijakan refund',
        e1a: 'Pengguna yang melanggar aturan (jika terbukti dengan screenshot/bukti) akan',
        e1b: 'diblokir permanen',
        e1c: 'dan kecocokannya dibatalkan.',
        e2a: 'Jika pelanggar memiliki',
        e2b: 'keanggotaan aktif, tetap akan dibatalkan',
        e3a: 'Meskipun keanggotaan dibatalkan, pelanggar',
        e3b: 'tidak dapat meminta refund',
        e4a: 'Setiap pengguna platform ini dianggap telah',
        e4b: 'membaca dan menyetujui aturan ini',
      },
      complaint: {
        title: 'Keluhan / pengiriman bukti',
        body: 'Jika dalam chat di situs atau percakapan WhatsApp Anda merasa pihak lain tidak berniat menikah, memberi info palsu/menyesatkan, menghina, atau mencoba menipu/meminta uang:',
        extraFemale: 'Jika ada kata-kata kasar, pelecehan, ajakan bernuansa seksual, niat di luar pernikahan, atau profil palsu, Anda dapat mengirim screenshot ke dukungan WhatsApp.',
        extraMale: 'Jika ada yang meminta uang sejak awal, mencoba menipu, mengarahkan ke situs lain/token, atau profil tidak sesuai, kirimkan screenshot ke dukungan WhatsApp.',
        c1Title: 'Kumpulkan bukti',
        c1Body: 'tangkapan layar, pesan, detail permintaan uang, dll.',
        c2Title: 'Kirim ke kami',
        c2Body: 'chat dukungan WhatsApp dari panel dan jelaskan situasinya.',
        c3Title: 'Peninjauan',
        c3Body: 'Setelah ditinjau, pihak yang bersalah diblokir dan keanggotaannya dibatalkan.',
      },
      safety: {
        title: 'Pengingat keamanan',
        s1: 'Tetap waspada saat proses perkenalan; berhati-hati saat membagikan informasi pribadi.',
        s2: 'Jangan pernah mengirim uang; jika ada permintaan uang, segera laporkan.',
        s3: 'Memverifikasi informasi profil adalah tanggung jawab pengguna; jika ragu, minta dukungan.',
      },

      quickQuestions: {
        title: '3 pertanyaan singkat',
        lead: 'Kalau mau, jawab 3 pertanyaan singkat dengan sekali tap untuk saling mengenal lebih cepat. Opsional.',
        yourAnswer: 'Kamu',
        otherAnswer: 'Dia',
        pickOne: 'Pilih satu',
        otherAnswered: 'Sudah jawab',
        otherNotAnswered: 'Belum jawab',
        questions: {
          q1: {
            title: 'Kamu prefer pace seperti apa?',
            options: {
              slow: 'Pelan',
              normal: 'Normal',
              fast: 'Cepat',
            },
          },
          q2: {
            title: 'Keluarga vs kemandirian?',
            options: {
              family: 'Fokus keluarga',
              balanced: 'Seimbang',
              independent: 'Mandiri',
            },
          },
          q3: {
            title: 'Pindah kota / relokasi?',
            options: {
              local: 'Kota yang sama',
              open: 'Terbuka',
              flexible: 'Fleksibel',
            },
          },
        },
      },
    },
  },
};
*/
