import en from "./en.js";

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
  previewGate: {
    title: 'Anda harus mendaftar terlebih dahulu',
    body: 'Untuk melakukan ini, Anda harus mendaftar dan mengisi formulir pencocokan terlebih dahulu.',
    signup: 'Daftar',
    dismiss: 'Lewati',
  },

  appErrorBoundary: {
    title: 'Terjadi kesalahan',
    body: 'Halaman tidak dapat dimuat. Silakan coba muat ulang.',
    tryAgain: 'Coba lagi',
    reload: 'Muat ulang halaman',
    report: {
      button: 'Laporkan error',
      sending: 'Mengirim…',
      sent: 'Terkirim. Terima kasih.',
      failed: 'Laporan tidak terkirim. Silakan coba lagi.',
    },
  },
  navigation: {
    siteTitle: "Uniqah",
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
    matchmaking: "Pencocokan",
    leadApply: "Perantara Jodoh",
    panel: "Profil saya",
    documents: "Dokumen",
    youtube: "YouTube",
    contact: "Kontak",
    language: "Bahasa",
    menu: "Menu utama",
    openMenu: "Buka menu",
    closeMenu: "Tutup menu",
    close: "Tutup",
  },

  footer: {
    brandBlurb:
      'Bagian dari {{company}}. Kami menghubungkan orang dengan penuh perhatian — dari perkenalan hingga pernikahan.',
    brandsTitle: 'Merek',
    brandNoteDameturk: '',
    sections: {
      quickLinks: 'Tautan Cepat',
      showEmailFallback: 'Ada kendala? Lanjutkan dengan email',
    preview: {
      matches: {
        title: 'Profil Anda: Kecocokan',
        body: 'Kecocokan, permintaan, dan chat dikelola dari layar Profil Anda.',
      },
      pool: {
        title: 'Pool: Kandidat',
        body: 'Anda bisa melihat kandidat dan mengirim permintaan atau like.',
      },
      request: {
        title: 'Kirim permintaan cocok',
        body: 'Tombol ini hanya pratinjau. Untuk aksi sebenarnya, Anda harus daftar dan mengisi formulir terlebih dulu.',
      },
    },
      legal: 'Hukum',
      contact: 'Kontak',
      social: 'Sosial',
    },
    links: {
      membership: 'Keanggotaan',
      whatsapp: 'WhatsApp',
    },
    legal: {
      documents: 'Dokumen',
      userAgreement: 'Perjanjian Penggunaan (Pencocokan)',
      kvkkNotice: 'Pemberitahuan Data Pribadi (KVKK)',
      siteRules: 'Aturan Situs',
      refundPolicy: 'Kebijakan Pembatalan & Pengembalian Dana',
      privacyPolicy: 'Kebijakan Privasi',
      confirmError: 'Konfirmasi gagal: {{error}}',
      contactRequestError: 'Permintaan kontak gagal: {{error}}',
      contactApproveError: 'Persetujuan kontak gagal: {{error}}',
      title: 'Informasi hukum',
      labels: {
        legalName: 'Nama resmi perusahaan',
        address: 'Alamat',
        tax: 'Pajak',
      },
    },
    companyInfo: {
      title: 'Informasi Perusahaan',
      labels: {
        legalName: 'Nama resmi',
        address: 'Alamat',
        tax: 'Pajak',
        nib: 'NIB',
      },
    },
    phoneNotes: {
      trLine: 'Nomor WhatsApp',
      idLine: 'Nomor WhatsApp (Alternatif)',
    },
    whatsappMessages: {
      general: 'Halo, saya ingin bertanya informasi.',
      wedding: 'Halo, saya ingin informasi tentang panduan pernikahan dan proses Uniqah.',
      youtube: 'Halo, saya punya pertanyaan tentang konten YouTube Anda.',
      contact: 'Halo, saya ingin menghubungi Anda.',
      home: 'Halo, saya sedang melihat situs Anda dan ingin informasi lebih lanjut.',
    },
    social: {
      instagram: 'Instagram',
      youtube: 'YouTube',
      whatsapp: 'WhatsApp',
    },
    copyright: '© {{year}} {{company}}. Seluruh hak cipta dilindungi.',
  },

  leadNoAuth: {
    title: 'Pendaftaran Perantara Jodoh',
    subtitle:
      'Banyak orang tidak percaya pada situs perkenalan online dan meminta kami menjadi perantara agar bisa bertemu orang yang tepercaya, serta mempertemukan mereka ketika ada kandidat dengan kriteria yang diinginkan. Karena itu, mirip dengan sistem taaruf di Indonesia, kami menggunakan informasi yang Anda berikan untuk menemukan calon pasangan yang sesuai, melakukan penelusuran seperlunya, lalu membantu Anda berkenalan. Jika Anda ingin menikah dengan cara ini, klik di sini.',
    info: {
      title: 'Tentang Layanan Ini',
      b1: 'Halaman ini dibuat untuk orang yang tidak ingin mendaftar di platform pencocokan dan ingin menemukan jodoh yang tepercaya melalui perantara kami.',
      b2: 'Saat ada kandidat yang cocok, Anda akan diberi tahu dan diperkenalkan kepada kandidat tersebut.',
      b3: 'Jika Anda ingin, dapat dilakukan penelusuran lebih detail secara timbal balik dan informasi yang diberikan dapat diverifikasi untuk memastikan keandalan.',
      b4: 'Dengan mengisi formulir di bawah ini, kami siap menjadi perantara saat kandidat yang cocok ditemukan.',
      b5: 'Informasi yang Anda berikan di sini tidak dibagikan kepada siapa pun selain kandidat yang cocok dan hanya digunakan untuk menemukan kandidat yang sesuai untuk Anda.',
      b6: 'Setelah Anda bertemu kandidat yang cocok, semua informasi dapat dihapus dari sistem atas permintaan Anda.',
    },
    success: {
      title: 'Pengajuan Anda sudah diterima.',
      ref: 'Referensi: {{id}}',
      note: 'Anda akan diberi tahu saat ditemukan kandidat yang cocok.',
    },
    errors: {
      required: 'Silakan isi kolom wajib dan centang kotak persetujuan.',
      rateLimited: 'Terlalu banyak percobaan dalam waktu singkat. Silakan coba lagi nanti.',
    },
    common: {
      select: 'Pilih…',
      yes: 'Ya',
      no: 'Tidak',
      any: 'Tidak masalah',
      female: 'Perempuan',
      male: 'Laki-laki',
      uploading: 'Mengunggah…',
    },
    actions: {
      pickPhoto: 'Pilih foto',
      remove: 'Hapus',
      submit: 'Kirim pengajuan',
      sending: 'Mengirim…',
      done: 'Selesai',
    },
    placeholders: {
      whatsapp: 'Contoh: +62 8xx xxx xxx / +90 ...',
      heightCm: 'contoh: 165',
      weightKg: 'contoh: 55',
      profession: 'contoh: Guru',
      childrenCount: 'Contoh: 2',
      childrenAges: 'Contoh: 3 dan 7',
      additionalInfoText: 'Boleh tulis singkat…',
    },
    fields: {
      gender: 'Jenis kelamin',
      fullName: 'Nama',
      age: 'Usia',
      heightCm: 'Tinggi (cm)',
      weightKg: 'Berat (kg)',
      city: 'Kota',
      whatsapp: 'Telepon / WhatsApp',
      maritalStatus: 'Status pernikahan',
      hasChildren: 'Anak',
      livingWith: 'Tinggal dengan siapa?',
      occupation: 'Status pekerjaan',
      profession: 'Pekerjaan',
      income: 'Tingkat penghasilan',
      foreignLanguage: 'Bahasa asing',
      translationOk: 'Bersedia komunikasi lewat terjemahan?',
      familyApproval: 'Apakah keluarga Anda mengizinkan menikah dengan orang asing?',
      additionalInfo: 'Apakah ada informasi tentang Anda yang perlu diketahui pihak lain?',
      photo: 'Foto',
    },
    options: {
      marital: {
        single: 'Belum menikah',
        widowed: 'Duda/Janda',
        divorced: 'Bercerai',
        married: 'Menikah',
      },
      hasChildren: {
        yes: 'Saya punya anak',
        no: 'Saya tidak punya anak',
      },
      familyApproval: {
        unknown: 'Saya belum membicarakannya dengan keluarga',
      },
      workStatus: {
        civilServant: 'PNS',
        worker: 'Pekerja',
        businessOwner: 'Pemilik usaha',
        retired: 'Pensiunan',
        notWorking: 'Tidak bekerja',
      },
      income: {
        low: 'Rendah',
        mid: 'Sedang',
        good: 'Baik',
      },
      livingWith: {
        withFamily: 'Tinggal bersama keluarga',
        titleShort: 'Notifikasi',
        withChildren: 'Dengan anak saya',
        modalTitleRequests: 'Notifikasi',
        withFriend: 'Tinggal bersama teman',
        alone: 'Sendiri',
      },
      childrenLivingWith: {
        withMe: 'Dengan saya',
        notWithMe: 'Tidak dengan saya',
      },
    },
    children: {
      title: 'Detail Anak',
      count: 'Berapa anak?',
      ages: 'Berapa usia anak?',
      livingWith: 'Tinggal dengan siapa?',
    },
    photo: {
      uploadedAlt: 'Foto yang diunggah {{index}}',
    },
    photoNote: 'Anda dapat mengunggah 1 sampai 5 foto.',
    partner: {
      title: 'Kriteria Pasangan',
      hasChildren: 'Anak',
      maritalStatus: 'Status pernikahan',
      ageMin: 'Usia (min)',
      ageMax: 'Usia (maks)',
      heightMin: 'Tinggi (min, cm)',
      heightMax: 'Tinggi (maks, cm)',
      weightMin: 'Berat (min, kg)',
      weightMax: 'Berat (maks, kg)',
      occupation: 'Status pekerjaan',
      spouseWanted: 'Seperti apa pasangan yang Anda cari?',
      income: 'Tingkat penghasilan',
      livingWith: 'Kondisi tinggal',
      religiousValues: 'Nilai agama',
    },
    partnerOptions: {
      hasChildren: {
        yes: 'Boleh punya anak',
        no: 'Sebaiknya tidak punya anak',
      },
      livingWith: {
        withFamily: 'Tinggal dengan keluarga',
        withChildren: 'Tinggal dengan anak',
        alone: 'Tinggal sendiri',
        withFriends: 'Tinggal dengan teman',
      },
      religiousValues: {
        religious: 'Religius',
      },
    },
    checklist: {
      title: 'Daftar cek',
      accuracy: 'Saya menyatakan informasi yang saya berikan benar.',
      disclaimer: 'Saya menerima bahwa uniqah.com tidak bertanggung jawab atas hasil apa pun yang timbul dari informasi yang saya berikan.',
    },
    religious: {
      title: 'Ibadah (praktik keagamaan)',
      options: {
        prayer5: 'Salat 5 waktu',
        fasting: 'Puasa',
        hajj: 'Haji',
        umrah: 'Ibadah umrah',
      },
    },
  },

  matchmakingPreview: {
    badge: 'Pratinjau Profil Anda',
    title: 'Pratinjau layar Profil Anda (tutorial)',
    subtitle:
      'Bagian di bawah ini adalah pratinjau. Untuk mengirim permintaan, like, atau chat, Anda harus daftar dan mengisi formulir terlebih dulu.',
    actions: {
      signup: 'Daftar',
      goProfile: 'Ke Profil Anda',
      goApply: 'Isi formulir',
    },
    gate: {
      title: 'Anda harus daftar terlebih dulu',
      body: 'Untuk like, chat, atau mengirim permintaan cocok, Anda harus daftar dan mengisi formulir terlebih dulu.',
      ctaSignup: 'Daftar dan isi formulir',
      ctaApply: 'Ke formulir',
    },
    cards: {
      matches: {
        title: 'Kecocokan',
        body: 'Pantau permintaan, like, dan kecocokan di sini.',
        cta: 'Lihat kecocokan',
      },
      pool: {
        title: 'Kandidat',
        body: 'Lihat kandidat dan kirim permintaan atau like.',
        cta: 'Ke pool',
        request: 'Kirim permintaan',
        like: 'Suka',
      },
      chat: {
        title: 'Percakapan',
        body: 'Jika cocok, Anda bisa chat di sini.',
        mockTitle: 'Contoh chat',
        mockSystem: 'Sistem',
        mockMsg1: 'Halo, apa kabar?',
        mockMsg2: 'Baik, terima kasih. Kamu?',
        inputPlaceholder: 'Tulis pesan…',
        send: 'Kirim',
        gateHint: 'Untuk chat, Anda harus daftar dulu.',
      },
    },
    note: 'Catatan: Ini pratinjau; data asli akan muncul di halaman profil Anda.',
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
    googleSignupCta: 'Daftar dengan Google',
    emailLoginCta: 'Masuk dengan email/kata sandi',
    emailSignupCta: 'Daftar dengan email/kata sandi',
    appleCta: 'Lanjutkan dengan Apple',
    appleSignupCta: 'Daftar dengan Apple',
    redirecting: 'Mengalihkan ke login…',
    infos: {
      startingGoogle: 'Membuka login Google…',
      inAppBrowserGoogleRedirect: 'Membuka login Google… Langkah ini bisa memerlukan beberapa detik di browser dalam aplikasi.',
      googleInAppHelp:
        'Login Google kadang bisa berhenti di browser dalam aplikasi. Anda bisa lanjut dengan email, atau pilih “Buka di browser” lalu coba lagi.',
      accountExistsTryLogin: 'Anda sudah memiliki akun. Silakan coba masuk dengan email dan kata sandi Anda.',
      existingAccountSwitchedToLogin: 'Email ini tampaknya sudah terdaftar. Kami alihkan ke layar masuk agar Anda bisa melanjutkan dengan akun Anda.',
      existingAccountUseGoogle: 'Email ini tampaknya terdaftar dengan Google. Silakan masuk dengan Google.',
    },
    redirectScreen: {
      title: 'Mengalihkan…',
      body: 'Membuka halaman Profil Saya. Jika layar ini lama, Anda bisa lanjut lewat tombol di bawah.',
      goProfile: 'Ke Profil Saya',
      refresh: 'Muat ulang',
    },
    trustNote: {
      title: 'Gratis, serius, dan berfokus pada niat pernikahan Islami',
      body: 'Uniqah adalah sistem berorientasi pernikahan yang didirikan oleh pasangan Turki-Indonesia. Ini bukan aplikasi dating biasa; kami tidak memberi ruang bagi orang yang tujuannya bukan pernikahan. Pendaftaran saat ini sepenuhnya gratis. Setelah suka menjadi timbal balik, pengguna masuk ke tahap pencocokan aktif, dan selama pencocokan aktif berlanjut mereka dapat berbicara tanpa batas di jendela privat dengan dukungan terjemahan.',
    },
    tour: {
      eyebrow: 'Tur kepercayaan',
      teaserTitle: 'Mengapa saya perlu mendaftar di Uniqah.com sebelum membuat akun?',
      teaserBody: 'Jika mau, ikuti tur singkat kami. Di sini kami menjelaskan mengapa orang memilih kami, bahwa sistem saat ini sepenuhnya gratis, bagaimana alur pencocokan aktif bekerja, dan bagaimana chat dengan dukungan terjemahan tetap terkontrol.',
      durationLabel: 'Tur singkat',
      durationValue: 'Kurang dari 1 menit',
      durationBody: 'Setelah setiap kartu, Anda bisa menghentikan tur dan langsung masuk ke pendaftaran atau login.',
      inviteLead: 'Daripada membiarkan penjelasan kepercayaan menumpuk di halaman, kami menyajikannya sebagai alur opsional bagi pengguna yang membutuhkan keyakinan lebih.',
      open: 'Ikuti tur',
      close: 'Tutup tur',
      back: 'Kembali',
      next: 'Lanjut',
      finish: 'Lanjut daftar',
      signupNow: 'Daftar',
      loginNow: 'Masuk',
      progress: 'Langkah {{current}} / {{total}}',
      flowTitle: 'Alur',
      cardEyebrow: 'Mengapa orang memilih kami',
      previewStep: 'Langkah {{number}}',
      exitHint: 'Tur ini tidak wajib. Anda bisa menutupnya kapan saja lalu langsung lanjut dengan Google atau email/kata sandi.',
      steps: [
        {
          eyebrow: 'Pendiri',
          title: 'Uniqah dibangun oleh pasangan Turki-Indonesia nyata untuk orang yang serius menuju pernikahan',
          body: 'Website ini adalah salah satu lini usaha PT Moonstar Global Indonesia milik pasangan Turki-Indonesia, dan dibuat khusus untuk melayani orang-orang yang benar-benar mencari pernikahan serius.',
          points: [
            'Ini bukan situs listing acak dengan pemilik yang tidak jelas.',
            'Tujuannya bukan obrolan santai, tetapi mempertemukan orang-orang serius di ruang yang lebih aman.',
            'Jika Anda mau, nanti kita juga bisa menambahkan foto pasangan pendiri pada langkah ini.'
          ]
        },
        {
          eyebrow: 'Proses terkontrol',
          title: 'Kalau saya sudah bertemu seseorang, bagaimana saya bisa percaya?',
          body: 'Anda tidak harus membangun rasa percaya sendirian setelah match; jika Anda mau, kami bisa membantu proses itu secara aktif.',
          points: [
            'Sebelum mengambil keputusan menikah, jika Anda mau, kami bisa meneliti semua hal tentang orang yang Anda kenal itu.',
            'Jika Anda meminta, kami bisa menghubungi orang tersebut dan keluarganya.',
            'Kami bisa menjadwalkan percakapan lewat WhatsApp dan membantu sebagai penerjemah untuk Anda, atau untuk Anda bersama keluarga Anda, saat berbicara dengan orang itu.'
          ]
        },
        {
          eyebrow: 'Kepercayaan',
          title: 'Sistem ini bukan untuk pencari hiburan, tetapi untuk orang yang benar-benar ingin menikah',
          body: 'Struktur perkenalan di sini tidak dirancang untuk orang yang hanya mencari kesenangan atau mengisi waktu, tetapi untuk orang yang membawa niat menikah yang serius.',
          points: [
            'Semua orang bisa saling mengirim pesan singkat, tetapi percakapan penuh hanya terbuka antara orang-orang yang memulai match aktif.',
            'Saat suka menjadi timbal balik, tahap pencocokan aktif dimulai; setelah kedua pihak menyetujui, chat privat terbuka.',
            'Selama pencocokan aktif berlanjut, dukungan terjemahan membantu setiap orang berbicara dalam bahasa mereka sendiri dengan lebih nyaman.'
          ]
        },
        {
          eyebrow: 'Mulai gratis',
          title: 'Anda tidak kehilangan apa pun untuk mencoba: daftar gratis, ruangnya serius, dan jaringannya sedang tumbuh',
          body: 'Anda bisa mendaftar gratis dan melihat sistemnya lebih dulu. Saat ini kami fokus pada pengguna Turki dan Indonesia dengan niat pernikahan Islami yang serius, dan dalam waktu dekat kami akan menambah negara lain secara terkontrol.',
          points: [
            'Sistem ini berbeda dari aplikasi dating biasa; kami tidak memberi tempat bagi tujuan di luar pernikahan.',
            'Anda mulai dari pendaftaran gratis, lalu lanjut ke alur form dan panel hanya jika cocok untuk Anda.',
            'Begitu suka timbal balik berubah menjadi pencocokan aktif, Anda bisa langsung memakai chat privat dengan dukungan terjemahan.',
            'Tujuan kami bukan keramaian tanpa arah, tetapi pertumbuhan yang aman dengan niat yang benar.'
          ]
        }
      ]
    },
    signupGuide: 'Pendaftaran saat ini sepenuhnya gratis. Lanjutkan dengan Google, lalu isi formulir matchmaking yang berfokus pada pernikahan Islami. Saat suka menjadi timbal balik, Anda masuk ke tahap pencocokan aktif dan bisa berbicara tanpa batas di jendela privat dengan dukungan terjemahan.',
    signupExistingAccountHint: 'Jika Anda sudah punya akun, masuk dengan Google.',
    appEntry: {
      eyebrow: 'Pintu masuk aplikasi',
      badge: 'Alur aplikasi penuh',
      title: 'Selamat datang di aplikasi Uniqah',
      subtitle: 'Layar pembuka ini disusun seperti alur aplikasi: pertama buka akun Anda, lalu lengkapi formulir pendaftaran, kemudian masuk ke area matchmaking di dalam aplikasi.',
      stepsTitle: 'Alur pembuka',
      ctaEyebrow: 'Mulai',
      ctaTitle: 'Buka akun Anda dan masuk ke aplikasi',
      ctaBody: 'Jika Anda pengguna baru, setelah mendaftar Anda akan diarahkan ke formulir pendaftaran. Jika Anda sudah punya akun, Anda bisa masuk dan melanjutkan dari tempat terakhir.',
      footerNote: 'Ini memberi PWA nuansa aplikasi yang lebih alami dan menyiapkan fondasi onboarding yang berguna nanti jika Anda bergerak menuju rilis Google Play.',
      steps: {
        account: {
          title: 'Buka akun Anda',
          body: 'Daftar dengan Google atau email, atau masuk dengan akun Anda yang sudah ada.',
        },
        form: {
          title: 'Lengkapi pendaftaran',
          body: 'Jika Anda baru, sistem akan otomatis mengarahkan Anda ke formulir aplikasi matchmaking.',
        },
        notify: {
          title: 'Aktifkan notifikasi',
          body: 'Setelah Anda mulai melihat profil lain, Anda bisa mengaktifkan notifikasi di dalam aplikasi dan menerima pembaruan segera.',
        },
      },
    },
    quickProfile: {
      title: 'Profil Cepat',
      lead: 'Lengkapi profil singkat Anda, lalu lanjutkan.',
      labels: {
        fullName: 'Nama',
        age: 'Usia',
        gender: 'Jenis kelamin',
        city: 'Kota',
        country: 'Negara',
        maritalStatus: 'Status pernikahan',
        hasChildren: 'Punya anak?',
        childrenCount: 'Berapa?',
        occupation: 'Pekerjaan',
        photo: 'Foto profil (1)',
      },
      placeholders: {
        fullName: 'Nama Anda',
        age: 'contoh: 28',
        city: 'Kota',
        childrenCount: 'contoh: 1',
        occupation: 'Pekerjaan',
      },
      options: {
        select: 'Pilih',
        countryTr: 'Turki',
        countryId: 'Indonesia',
        countryOther: 'Lainnya',
        maritalSingle: 'Lajang',
        maritalMarried: 'Menikah',
        maritalDivorced: 'Bercerai',
        maritalWidowed: 'Duda/Janda',
        hasChildrenNo: 'Tidak',
        hasChildrenYes: 'Ya',
      },
      statuses: {
        photoUploading: 'Mengunggah foto…',
        photoUploaded: 'Foto berhasil diunggah.',
      },
      actions: {
        createProfile: 'Buat profil saya',
      },
      steps: {
        step2Google: 'Langkah 2: Daftar dengan Google',
      },
      infos: {
        ready: 'Profil Anda siap. Anda bisa lanjut sekarang.',
      },
      errors: {
        fillFirst: 'Silakan isi formulir profil cepat terlebih dahulu.',
        nameRequired: 'Nama wajib diisi.',
        ageInvalid: 'Usia harus antara 18–99.',
        genderRequired: 'Jenis kelamin wajib diisi.',
        cityRequired: 'Kota wajib diisi.',
        countryRequired: 'Negara wajib diisi.',
        maritalRequired: 'Status pernikahan wajib diisi.',
        occupationRequired: 'Pekerjaan wajib diisi.',
        hasChildrenRequired: 'Status anak wajib diisi.',
        childrenCountRequired: 'Jumlah anak (1–20) wajib diisi.',
        photoRequired: 'Foto profil wajib diisi.',
        photoNotImage: 'Silakan pilih file gambar.',
        photoUploadFailed: 'Gagal mengunggah foto.',
        saveFailed: 'Profil tidak dapat disimpan. Silakan coba lagi.',
      },
    },
    or: 'atau',
    labels: {
      email: 'Email',
      password: 'Kata sandi',
      confirmPassword: 'Konfirmasi kata sandi',
      gender: 'Jenis kelamin',
      nationality: 'Kewarganegaraan',
      nationalityOther: 'Kewarganegaraan lain (tulis)',
      age: 'Usia',
    },
    placeholders: {
      email: 'contoh@email.com',
      password: 'Kata sandi Anda',
      confirmPassword: 'Ketik ulang kata sandi Anda',
      nationality: 'Pilih kewarganegaraan',
      nationalityOther: 'contoh: Jerman',
      age: 'contoh: 27',
    },
    actions: {
      login: 'Masuk',
      signup: 'Daftar',
      openInBrowser: 'Buka di browser dan lanjutkan',
      switchToSignup: 'Belum punya akun? Daftar',
      switchToLogin: 'Sudah punya akun? Masuk',
      showEmailFallback: 'Ada kendala? Lanjutkan dengan email',
      forgot: 'Lupa kata sandi',
    },
    signup: {
      genderMale: 'Saya laki-laki',
      genderFemale: 'Saya perempuan',
      nationalityTr: 'Turki',
      nationalityId: 'Indonesia',
      nationalityOther: 'Lainnya',
      ageHint: 'Anda harus berusia minimal {{minAge}} tahun.',
    },
    forgotHint: {
      prefix: 'Jika Anda lupa kata sandi, klik',
      suffix: 'untuk menerima tautan reset melalui email.',
    },
    passwordToggle: {
      show: 'Tampilkan',
      hide: 'Sembunyikan',
    },
    feedback: {
      title: 'Keluhan / Masukan',
      lead: 'Jika Anda mengalami kendala saat pendaftaran, mohon laporkan masalahnya beserta nomor kontak atau email Anda. Kami akan segera cek dan menghubungi Anda kembali.',
      contactLabel: 'Kontak (telepon atau email)',
      contactPlaceholder: 'Contoh: +62 812… atau nama@site.com',
      placeholder: 'Kontak (telepon atau email) + kendala yang Anda alami…',
      note: 'Catatan: Sertakan kontak agar kami bisa menghubungi Anda.',
      reportCta: 'Laporkan error ini',
      prefillHeader: 'Mohon isi detail di bawah ini:',
      prefillContact: 'Kontak (telepon atau email):',
      prefillProblem: 'Masalah (apa yang Anda lakukan / apa yang terjadi?):',
      prefillUiError: 'Error yang terlihat',
      prefillDebugCode: 'Kode error',
      prefillDebugMessage: 'Pesan teknis',
      send: 'Kirim',
      sending: 'Mengirim…',
      sent: 'Terkirim. Terima kasih.',
      tooShort: 'Silakan tulis minimal {{min}} karakter.',
      failed: 'Gagal mengirim. Silakan coba lagi.',
    },
    idSignupHelp: {
      summary: 'Ada kendala saat daftar? (Indonesia) Kirim formulir singkat via WhatsApp',
      labels: {
        name: 'Nama',
        age: 'Usia',
        maritalStatus: 'Status pernikahan',
        hasChildren: 'Punya anak?',
        childrenCount: 'Berapa anak?',
        job: 'Pekerjaan',
        criteriaNote: 'Kriteria yang dicari (catatan singkat)',
      },
      placeholders: {
        name: 'Nama Anda',
        age: 'contoh: 28',
        maritalStatus: 'Lajang / Bercerai / Duda/Janda',
        childrenCount: 'contoh: 1',
        job: 'contoh: guru',
        criteriaNote: 'Catatan singkat…',
      },
      options: {
        select: 'Pilih',
        hasChildrenNo: 'Tidak',
        hasChildrenYes: 'Ya',
      },
      note: 'Form ini akan mengirim pesan ke nomor WhatsApp Indonesia.',
      sendWhatsApp: 'Kirim via WhatsApp',
      messageTitle: 'Kendala pendaftaran (Indonesia) - info singkat',
      messageFields: {
        name: 'Nama',
        age: 'Usia',
        maritalStatus: 'Status pernikahan',
        hasChildren: 'Anak',
        childrenCount: 'Jumlah anak',
        job: 'Pekerjaan',
        criteriaNote: 'Catatan kriteria',
      },
    },
    legal: {
      prefix: 'Dengan melanjutkan, Anda menyetujui',
      contract: 'Perjanjian Pengguna / Keanggotaan',
      cancelRefund: 'Kebijakan pembatalan & refund',
      privacy: 'Kebijakan Privasi',
    },
    resetSent: 'Tautan reset kata sandi telah dikirim ke email Anda.',
    errors: {
      noAccountFoundSignupRequired:
        'Akun tidak ditemukan. Anda perlu mendaftar terlebih dahulu. Kami mengalihkan Anda ke pendaftaran—pilih jenis kelamin/kewarganegaraan, masukkan usia, lalu coba lagi.',
      accountExistsWithDifferentCredential:
        'Email ini sudah terdaftar dengan metode lain. Silakan masuk dengan email/kata sandi dulu; setelah itu kami bisa menautkan login Google.',
      domainNotFound: '(domain tidak ditemukan)',
      googleFailedDev:
        'Login Google gagal ({{code}}).\n\nDi Firebase Console → Authentication → Settings → Authorized domains, tambahkan: {{host}}\nJuga periksa VITE_FIREBASE_AUTH_DOMAIN di env Anda.',
      googleUnauthorizedDomain:
        'Login Google gagal (unauthorized-domain).\n\nTambahkan domain ini di Firebase Console → Authentication → Settings → Authorized domains: {{host}}',
      googleOperationNotAllowed:
        'Login Google dinonaktifkan. Aktifkan penyedia Google di Firebase Console → Authentication → Sign-in method.',
      appleOperationNotAllowed:
        'Login Apple dinonaktifkan. Aktifkan penyedia Apple di Firebase Console → Authentication → Sign-in method.',
      firebaseAuthInvalidConfig:
        'Konfigurasi Firebase Auth tidak valid. Periksa nilai `VITE_FIREBASE_*` di `.env.local` (dan env Vercel).',
      googleInAppBlocked:
        'Masuk dengan Google mungkin diblokir di browser dalam aplikasi ini. Silakan gunakan “Buka di browser” (Chrome/Safari) lalu coba lagi, atau lanjutkan dengan email.',
      googlePopupBlocked:
        'Browser memblokir popup Google. Izinkan popup lalu coba lagi. Jika masih gagal, buka di Chrome/Safari atau lanjutkan dengan email.',
      googlePopupClosed:
        'Jendela Google ditutup sebelum proses selesai. Silakan coba lagi.',
      googleRedirectNoResult:
        'Masuk dengan Google tidak berhasil diselesaikan setelah kembali dari Google. Silakan coba lagi, atau lanjutkan dengan email/kata sandi.',
      googleFailed: 'Masuk dengan Google gagal.',
      appleFailed: 'Masuk dengan Apple gagal.',
      invalidCredential: 'Email atau kata sandi salah (atau akun tidak ditemukan). Jika Anda lupa kata sandi, gunakan “Lupa kata sandi”.',
      invalidEmail: 'Alamat email tampak tidak valid. Silakan periksa dan coba lagi.',
      emailAlreadyInUse: 'Akun dengan email ini sudah ada. Silakan masuk atau gunakan “Lupa kata sandi”.',
      weakPassword: 'Kata sandi terlalu lemah. Silakan pilih kata sandi yang lebih kuat (mis. minimal 6 karakter).',
      rateLimited: 'Terlalu banyak percobaan dalam waktu singkat. Silakan tunggu sekitar satu menit dan coba lagi.',
      networkFailed: 'Terjadi kesalahan jaringan. Periksa koneksi Anda dan coba lagi.',
      passwordsDoNotMatch: 'Kata sandi tidak cocok. Silakan ketik ulang kata sandi yang sama.',
      emailPasswordRequired: 'Email dan kata sandi wajib diisi.',
      genderRequired: 'Pilih jenis kelamin untuk mendaftar.',
      nationalityRequired: 'Pilih kewarganegaraan untuk mendaftar.',
      nationalityOtherRequired: 'Tuliskan kewarganegaraan Anda.',
      ageRequired: 'Masukkan usia Anda untuk mendaftar.',
      ageMin: 'Untuk mendaftar, Anda harus berusia minimal {{minAge}} tahun.',
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

  tour: {
    common: {
      skip: 'Lewati',
      next: 'Lanjut',
      done: 'Selesai',
      missingHint: 'Langkah ini belum terlihat saat ini. Anda bisa melanjutkan.',
    },
    preview: {
      matches: {
        title: 'Profil Saya: Kecocokan',
        body: 'Kecocokan, permintaan, dan chat dikelola dari layar Profil Saya.',
      },
      pool: {
        title: 'Pool: Kandidat',
        body: 'Anda dapat menelusuri kandidat dan mengirim permintaan atau like.',
      },
      request: {
        title: 'Kirim permintaan kecocokan',
        body: 'Tombol ini hanya pratinjau. Untuk melakukan aksi nyata, Anda harus mendaftar dan mengisi formulir terlebih dahulu.',
      },
    },
    publicGuidance: {
      step1: {
        title: 'Pembayaran & kepercayaan (1/2)',
        body: 'Agar Anda merasa aman, kami tidak meminta biaya pendampingan apa pun sampai Anda tiba di Indonesia. Pembayaran bisa dilakukan setelah Anda sampai di sini. Anda bisa memanfaatkan layanan pendampingan kami dengan harga terbaik, dan mewujudkan pernikahan dengan cara paling mudah tanpa harus mengurus proses rumit selain mengumpulkan dokumen Anda sendiri.',
      },
      step2: {
        title: 'Proses pendampingan (2/2)',
        body: 'Layanan pendampingan kami dijalankan langsung di Indonesia oleh tim Turki yang tinggal di sini. Kami mendampingi setiap tahap untuk teman-teman yang akan datang ke Indonesia untuk menikah—mulai dari penjemputan di bandara hingga mengantar Anda dan pasangan ke bandara saat kepulangan.',
      },
    },
    onboarding: {
      matches: {
        title: 'Kecocokan',
        body: 'Kelola suka, permintaan, dan kecocokan di layar ini.',
      },
      pool: {
        title: 'Kandidat',
        body: 'Lihat kandidat dan kirim permintaan kecocokan.',
      },
      request: {
        title: 'Permintaan kecocokan',
        body: 'Kirim permintaan kecocokan. Jika disetujui, kecocokan dibuat.',
      },
    },
    like: {
      title: 'Suka',
      body: 'Gunakan Suka untuk menunjukkan minat. Jika orang itu juga menyukai Anda, tahap pencocokan aktif dimulai; lalu Anda bisa memulainya dan berbicara di jendela privat dengan dukungan terjemahan.',
    },
    activeStart: {
      title: 'Kecocokan aktif',
      body: 'Setelah saling suka, mulai pencocokan aktif untuk membuka chat privat dengan dukungan terjemahan. Selama pencocokan aktif berlanjut, Anda dapat terus berbicara tanpa batas.',
    },
    chat: {
      input: {
        title: 'Pesan',
        body: 'Ketik pesan Anda di sini.',
      },
      send: {
        title: 'Kirim',
        body: 'Gunakan tombol ini untuk mengirim pesan.',
      },
    },
    profileDetails: {
      title: 'Detail profil',
      body: 'Minta izin untuk melihat detail profil.',
    },

    pwaNudge: {
      title: 'Instal aplikasi dan aktifkan notifikasi',
      body: 'Instal aplikasi dan aktifkan notifikasi agar tidak ketinggalan pesan, permintaan, dan persetujuan.',
      primary: 'Satu klik: Instal + Aktifkan',
      later: 'Nanti',
      installAndNotify: {
        title: 'Pasang aplikasi agar tidak tertinggal pesan',
        body: 'Kami sarankan Anda memasang aplikasi dan mengaktifkan notifikasi agar langsung tahu saat ada pesan baru, permintaan, atau kandidat yang cocok.',
        primary: 'Lanjutkan, pasang dan aktifkan',
      },
      installOnly: {
        title: 'Instal aplikasi',
        body: 'Notifikasi Anda tampak sudah aktif. Kami tetap menyarankan memasang aplikasi agar pengalaman lebih stabil dan masalah masuk atau muat halaman berkurang.',
        primary: 'Instal aplikasi',
      },
      notifyOnly: {
        title: 'Aktifkan notifikasi',
        body: 'Aplikasi tampaknya sudah terpasang. Aktifkan notifikasi sekarang agar pesan, permintaan, dan persetujuan langsung sampai tanpa terlewat.',
        primary: 'Aktifkan notifikasi',
      },
      success: {
        install: 'Berhasil. Langkah pemasangan aplikasi selesai.',
        notify: 'Berhasil. Notifikasi sekarang sudah aktif.',
        installAndNotify: 'Berhasil. Aplikasi dan notifikasi sekarang siap.',
      },
    },
  },

  ui: {
    lightbox: {
      close: 'Tutup',
      prev: 'Sebelumnya',
      next: 'Berikutnya',
      imageAlt: 'Gambar {{index}}',
    },
    favorite: {
      add: 'Tambahkan ke favorit',
      remove: 'Hapus dari favorit',
    },
  },

  admin: {
    userTools: {
      prompts: {
        matchmakingHub: 'Cari pasangan',
        matchmakingHint: 'Belum punya calon pasangan? Daftar ke sistem pencocokan kami dan temukan calon pasangan di sini.',
        noteOptional: 'Catatan (opsional):',
      },
      defaults: {
        whatsappVerificationNote: 'Verifikasi WhatsApp',
      },
      confirms: {
        grantMembershipDays: 'Berikan membership {{days}} hari untuk pengguna ini?',
        revokeMembership: 'Nonaktifkan membership berbayar pengguna ini?',
        grantTranslationPackDays: 'Berikan paket terjemahan {{days}} hari untuk pengguna ini?',
        revokeTranslationPack: 'Nonaktifkan paket terjemahan pengguna ini?',
        resetFreeActiveMembership:
          'Reset status free active membership (freeActiveMembership)? (blocked=false, active=false, counters=0)',
      },
      messages: {
        userBlocked: 'Pengguna diblokir.',
        userUnblocked: 'Blokir pengguna dibuka.',
        whatsappVerified: 'Pengguna diverifikasi via verifikasi WhatsApp.',
        membershipGranted: 'Membership diaktifkan. Berakhir: {{until}}',
        membershipRevoked: 'Membership dinonaktifkan.',
        translationPackGranted: 'Paket terjemahan diaktifkan. Berakhir: {{until}}',
        translationPackRevoked: 'Paket terjemahan dinonaktifkan.',
        freeActiveReset: 'Status free active membership di-reset.',
      },
      errors: {
        userIdRequired: 'Masukkan user ID.',
        applicationNotFoundForMk: 'Tidak ada aplikasi untuk kode MK ini.',
        applicationMissingUserId: 'Aplikasi ditemukan tetapi userId kosong.',
        userReadFailed: 'Gagal memuat pengguna.',
        actionFailed: 'Aksi gagal.',
        daysRange: 'Hari harus antara 1 dan 365.',
        translationTierInvalid: 'Tier harus standard atau pro.',
      },
    },

    matchmakingMatches: {
      titles: {
        page: 'Pencocokan (Admin)',
        tab: 'Pencocokan',
        tabSubtitle: 'Pencocokan dengan persetujuan mutual dan kontak terbuka.',
      },
      nav: {
        identityVerifications: 'Verifikasi identitas',
        paymentNotifications: 'Notifikasi pembayaran',
        adminPanel: 'Panel admin',
        openDetailedPage: 'Buka halaman pencocokan detail',
      },
      common: {
        loading: 'Memuat…',
        empty: 'Tidak ada data.',
      },
      labels: {
        total: 'Total',
        match: 'Pencocokan:',
        score: 'Skor: {{score}}',
        recordId: 'ID rekaman:',
      },
      actions: {
        cancel: 'Batalkan pencocokan (buka kunci)',
        copy: 'salin',
      },
      sections: {
        mutual: 'Disetujui mutual (menunggu pilihan langkah-2)',
        contactUnlocked: 'Kontak terbuka (kunci aktif)',
      },
      manual: {
        title: 'Pencocokan manual',
        titleTest: 'Pencocokan manual (untuk tes)',
        description:
          'Masukkan “Application ID” atau “Username” untuk A dan B. Ini akan membuat dokumen pencocokan antara dua pengguna (untuk menguji alur suka/tolak/chat).',
        descriptionShort:
          'Masukkan “Application ID” atau “Username” untuk A dan B. Ini akan membuat dokumen pencocokan antara dua pengguna.',
        notePrefix: 'Catatan: Daftar di halaman ini hanya menampilkan',
        noteAnd: 'dan',
        noteSuffix: 'status.',
        labels: {
          a: 'A (Application ID / Kode profil)',
          b: 'B (Application ID / Kode profil)',
          startStatus: 'Status awal',
          overwrite: 'Timpa jika match sudah ada',
        },
        placeholders: {
          a: 'mis. moonstar_34 atau applicationId',
          b: 'mis. blueocean_21 atau applicationId',
        },
        statusOptions: {
          proposed: 'proposed (tes suka/tolak)',
          mutualAccepted: 'mutual_accepted (tes pilihan chat/kontak)',
          contactUnlocked: 'contact_unlocked (tes kontak terbuka)',
        },
        actions: {
          create: 'Buat match',
          clear: 'Bersihkan field',
        },
      },
      confirms: {
        cancelMatch: 'Match ini akan ditandai dibatalkan dan kunci akan dibuka. Lanjutkan?',
      },
      messages: {
        cancelSuccess: 'Match dibatalkan. Kunci dibuka; match baru bisa ditampilkan.',
        manualCreated: 'Pencocokan manual dibuat. Match ID: {{matchId}}{{extra}}',
        manualExtraUpdated: ' (Sudah ada: diperbarui)',
        manualExtraSkipped: ' (Sudah ada: dilewati)',
        copySuccess: 'ID rekaman tersalin.',
        copyFailed: 'Gagal menyalin.',
      },
      errors: {
        loadFailed: 'Gagal memuat pencocokan.',
        actionFailed: 'Aksi gagal.',
        manualInputRequired: 'Masukkan Application ID atau Kode Profil untuk A dan B.',
      },
    },

    matchmakingPayments: {
      titles: {
        page: 'Notifikasi Pembayaran (Admin)',
        tab: 'Notifikasi Pembayaran',
        tabSubtitle: 'Kelola notifikasi pembayaran yang pending/disetujui/ditolak.',
      },
      nav: {
        matches: 'Pencocokan',
        adminPanel: 'Panel admin',
      },
      notices: {
        indexFallback: 'Catatan: Menggunakan daftar "fallback" karena indeks Firestore belum ada (mungkin sedikit lebih lambat).',
        receiptViaWhatsApp:
          'Catatan: Pengguna menandai bahwa bukti pembayaran akan dikirim via WhatsApp. (Tidak ada tautan yang diunggah dari panel.)',
      },
      common: {
        loading: 'Memuat…',
        empty: 'Tidak ada data.',
      },
      statuses: {
        pending: 'Pending',
        approved: 'Disetujui',
        rejected: 'Ditolak',
      },
      statusHeadings: {
        pending: 'Notifikasi pending',
        approved: 'Disetujui',
        rejected: 'Ditolak',
      },
      labels: {
        shown: 'Ditampilkan',
        total: 'Total',
        package: 'Paket',
        method: 'Metode',
        user: 'Pengguna',
        userId: 'User ID',
        match: 'Match',
        reference: 'Referensi',
        receiptChannel: 'Kanal bukti',
        note: 'Catatan',
        receipt: 'Bukti',
        readyMessage: 'Pesan siap',
      },
      receiptChannels: {
        whatsapp: 'WhatsApp',
        upload: 'Unggahan',
      },
      tiers: {
        eco: 'Eko',
        standard: 'Standar',
        pro: 'Pro',
      },
      methods: {
        eft_fast: 'EFT / FAST',
        swift_wise: 'SWIFT / Wise',
        qris: 'QRIS',
        card: 'Kartu kredit',
        other: 'Lainnya',
      },
      actions: {
        copy: 'salin',
        open: 'Buka',
        approve: 'Setujui',
        reject: 'Tolak',
        copyApprovalMessage: 'Salin pesan persetujuan',
        copyRejectionMessage: 'Salin pesan penolakan',
      },
      copy: {
        copied: '{{what}} tersalin.',
        failed: 'Gagal menyalin.',
        what: {
          userId: 'User ID',
          translateTargetLabel: 'Terjemahkan ke',
          matchId: 'Match ID',
          reference: 'Referensi',
          receiptLink: 'Tautan bukti',
          approvalMessage: 'Pesan persetujuan',
          rejectionMessage: 'Pesan penolakan',
        },
      },
      warnings: {
        amountMismatch: 'Peringatan: Nominal tidak sesuai dengan harga yang diharapkan. Diharapkan: {{expected}}',
      },
      confirms: {
        approve: 'Notifikasi pembayaran ini akan DISETUJUI dan paket "{{tier}}" akan diaktifkan. Lanjutkan?',
        reject: 'Notifikasi pembayaran ini akan DITOLAK. Lanjutkan?',
      },
      messages: {
        approvedWithUntil: 'Pembayaran disetujui; membership diaktifkan. Berakhir: {{until}}',
        approved: 'Pembayaran disetujui; membership diaktifkan.',
        rejected: 'Pembayaran ditolak.',
      },
      errors: {
        actionFailed: 'Aksi gagal.',
      },
      templates: {
        whatsapp: {
          approved:
            'Halo, pembayaran membership matchmaking Anda telah disetujui. Anda bisa membuka info kontak dari panel Anda. Terima kasih.',
          rejected:
            'Halo, kami tidak dapat memverifikasi notifikasi pembayaran Anda. Silakan periksa bukti/ref. dan kirim ulang notifikasi pembayaran.',
        },
      },
      alts: {
        receipt: 'bukti pembayaran',
      },
    },

    photoUpdates: {
      titles: {
        tab: 'Permintaan Pembaruan Foto',
        tabSubtitle: 'Tinjau foto baru yang diunggah pengguna lalu setujui/tolak.',
      },
      common: {
        loading: 'Memuat…',
        empty: 'Tidak ada data.',
        noPhoto: 'Tidak ada foto.',
      },
      statuses: {
        pending: 'Pending',
        approved: 'Disetujui',
        rejected: 'Ditolak',
      },
      labels: {
        shown: 'Ditampilkan',
        requestId: 'Permintaan',
        userId: 'User ID',
        applicationId: 'Application',
      },
      actions: {
        copy: 'salin',
        approve: 'Setujui',
        reject: 'Tolak',
      },
      copy: {
        copied: '{{what}} tersalin.',
        failed: 'Gagal menyalin.',
        what: {
          userId: 'User ID',
          applicationId: 'Application ID',
        },
      },
      confirms: {
        approve: 'Permintaan pembaruan foto ini akan DISETUJUI dan foto aplikasi akan diperbarui. Lanjutkan?',
        reject: 'Permintaan pembaruan foto ini akan DITOLAK. Lanjutkan?',
      },
      messages: {
        approved: 'Pembaruan foto disetujui.',
        rejected: 'Pembaruan foto ditolak.',
      },
      errors: {
        actionFailed: 'Aksi gagal.',
      },
      alts: {
        photo: 'Foto',
      },
    },
  },

  studio: {
    common: {
      back: 'Kembali',
      open: 'Buka',
      actionMenu: 'Menu aksi',
      close: 'Tutup',
      cancel: 'Batal',
      send: 'Kirim',
      loading: 'Memuat…',
      processing: 'Memproses…',
      readMore: 'Baca selengkapnya',
      readLess: 'Tampilkan lebih sedikit',
      match: 'Pencocokan',
      profile: 'Profil',
      verified: 'Pengguna terpercaya',
      unknown: 'Tidak diketahui',
      zoom: 'Perbesar',
      enlargePhotoAria: 'Perbesar foto {{name}}',
    },

    presence: {
      online: 'Sedang online',
      lastSeenMinutes_one: 'Terakhir aktif: {{count}} menit lalu',
      lastSeenMinutes_other: 'Terakhir aktif: {{count}} menit lalu',
      lastSeenHours_one: 'Terakhir aktif: {{count}} jam lalu',
      lastSeenHours_other: 'Terakhir aktif: {{count}} jam lalu',
      lastSeenDays_one: 'Terakhir aktif: {{count}} hari lalu',
      lastSeenDays_other: 'Terakhir aktif: {{count}} hari lalu',
    },

    referral: {
      title: 'Undang Teman',
      description: 'Anda bisa merekomendasikan Uniqah dengan pesan singkat yang rapi dan membagikan alur pemasangan aplikasi.',
      spotlightEyebrow: 'Undang teman',
      spotlightBody: 'Kalau ada orang yang menurut Anda cocok, bagikan Uniqah lewat WhatsApp dengan pesan singkat dan alur pemasangan aplikasi.',
      spotlightCta: 'Undang teman',
      myCodeLabel: 'Kode undangan Anda',
      shareButton: 'Bagikan via WhatsApp',
      shareMessage:
        'Aplikasi ini sangat bagus, saya merekomendasikannya. Anda bisa pasang aplikasi dulu, aktifkan notifikasi, lalu daftar gratis untuk berkenalan dengan orang baru di Uniqah.\n\n{{url}}',
      copy: 'Salin',
      copied: 'Tersalin.',
      enterCodeLabel: 'Kode undangan',
      enterCodePlaceholder: 'UC-1001',
      acceptButton: 'Konfirmasi kode',
      invitedByLabel: 'Diundang oleh',
      claimButton: 'Klaim keanggotaan gratis',
      statusAccepted: 'Kode undangan tersimpan.',
      statusAlreadyAccepted: 'Kode undangan ini sudah tersimpan.',
      statusClaimed: 'Hadiah diterapkan. Keanggotaan Anda diperbarui.',
      statusAlreadyClaimed: 'Hadiah sudah diklaim.',
      errors: {
        referralDisabled: 'Sistem referral sedang dinonaktifkan.',
        userCodeMissing: 'Kode undangan Anda belum siap. Coba lagi nanti.',
        invalidInviteCode: 'Kode undangan tidak valid.',
        inviteCodeNotFound: 'Kode undangan tidak ditemukan.',
        selfReferralNotAllowed: 'Anda tidak bisa memakai kode Anda sendiri.',
        alreadyReferred: 'Anda sudah pernah memakai kode undangan.',
        referralNotFound: 'Data referral tidak ditemukan.',
        referralNotAccepted: 'Referral belum dikonfirmasi.',
        referralMismatch: 'Data referral tidak cocok.',
        verificationRequired: 'Kedua pengguna harus terverifikasi identitas untuk mengklaim hadiah.',
      },
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
      error: 'Kesalahan',
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
      titleShort: 'Permintaan',
      modalTitleMessages: 'Pesan',
      modalTitleRequests: 'Permintaan',
    },

    accessInbox: {
      title: 'Permintaan akses profil ({{count}})',
      requested: 'Meminta izin untuk melihat profilmu',
      approve: 'Izinkan',
      reject: 'Tolak',
      openButton: 'Permintaan masuk',
      openButtonWithCount: 'Permintaan masuk ({{count}})',
    },

    inboxModal: {
      emptyMessages: 'Belum ada pesan baru.',
      emptyRequests: 'Belum ada permintaan baru.',
      new: 'Baru',
      markRead: 'Tandai dibaca',
      read: 'Dibaca',
      reviewProfile: 'Tinjau profil',
      hideProfile: 'Sembunyikan profil',
      approve: 'Setujui',
      allow: 'Izinkan',
      prev: 'Sebelumnya',
      next: 'Berikutnya',
      photoAlt: 'Foto',
      wantChildren: 'Ingin punya anak',
      requestText: {
        peopleList: 'Menambahkan Anda ke daftar orangnya.',
        preMatch: 'Mengirim permintaan pra-kecocokan.',
        photoAccess: 'Meminta izin untuk melihat foto Anda.',
        profileAccess: 'Meminta izin untuk melihat profil Anda.',
      },
    },

    messagesHub: {
      title: 'Pusat pesan',
      subtitle: 'Pesan baru kini terlihat jauh lebih jelas dalam satu layar.',
      totalActivity: '{{count}} pesan belum dibaca',
      summaryMessages: 'Pesan belum dibaca',
      summaryLikes: 'Suka baru',
      summaryRequests: 'Permintaan tertunda',
      emptyTitle: 'Belum ada pesan baru.',
      emptyBody: 'Pesan baru akan langsung muncul di sini.',
      sectionMessages: 'Pesan',
      sectionMessagesHint: 'Orang yang mengirim pesan akan muncul di sini. Ketuk untuk langsung membuka percakapan.',
      sectionLikes: 'Suka',
      sectionLikesHint: 'Suka masuk ditonjolkan di sini agar tidak terlewat.',
      sectionRequests: 'Permintaan',
      sectionRequestsHint: 'Permintaan akses profil dan pra-kecocokan diringkas di sini.',
      openChat: 'Buka chat',
      openRequests: 'Buka permintaan',
      unread: '{{count}} baru',
      noPreview: 'Percakapan baru dengan orang ini sedang menunggu Anda.',
      requestApproved: 'Permintaan disetujui.',
      requestRejected: 'Permintaan ditolak.',
    },

    notificationsHub: {
      title: 'Notifikasi',
      subtitle: 'Notifikasi suka dan permintaan dikumpulkan di layar ini.',
      totalActivity: '{{count}} notifikasi baru',
      summaryLikes: 'Suka baru',
      summaryRequests: 'Permintaan tertunda',
      emptyTitle: 'Belum ada notifikasi baru.',
      emptyBody: 'Suka atau permintaan baru akan langsung muncul di sini.',
      sectionLikes: 'Suka',
      sectionLikesHint: 'Suka masuk ditonjolkan di sini agar tidak terlewat.',
      sectionRequests: 'Permintaan',
      sectionRequestsHint: 'Permintaan akses profil dan pra-kecocokan diringkas di sini.',
      requestApproved: 'Permintaan disetujui.',
      requestRejected: 'Permintaan ditolak.',
    },

    pool: {
      title: 'Jelajahi',
      backToMatches: '← Kembali ke Favoritku',
      refresh: 'Muat ulang',
      lastUpdated: 'Otomatis diperbarui (20 dtk).',
      countHint: 'Total: {{total}} • Ditampilkan: {{shown}}',
      retrying: 'Ada masalah koneksi saat memuat daftar kandidat. Sedang dicoba ulang otomatis…',
      cachedResults: 'Kandidat terakhir yang tersedia ditampilkan sampai koneksi pulih.',
      loadMore: 'Tampilkan {{count}} kandidat lagi',
      filtersHint: 'Rentang usia: {{min}} – {{max}}',
      myPeoplePrompt: {
        title: 'Buka Favoritku untuk tindakan lain dan interaksi dengan koneksi Anda',
        body: 'Status suka, pencocokan aktif, dan langkah lain terkait koneksi Anda bisa dikelola dari halaman Favoritku.',
        cta: 'Ke Favoritku',
      },
      trust: {
        title: 'Kepercayaan & verifikasi',
        body:
          'Sistem ini berfokus pada pernikahan dan berjalan dengan alur yang terkontrol. Verifikasi identitas tidak wajib; ini adalah lencana kepercayaan bagi pengguna yang memilih melakukannya.\n\nInformasi yang dikirim untuk verifikasi hanya digunakan untuk tujuan verifikasi dan tidak disimpan secara permanen setelah verifikasi selesai. Anda dapat menghapus akun kapan saja; setelah dihapus, data profil dan kecocokan Anda dihapus dari sistem.',
        sortNote: 'Catatan: Profil terverifikasi ditampilkan di urutan teratas di Jelajahi.',
      },
      importantNotice: {
        eyebrow: 'Peringatan penting',
        tapSticker: 'Klik',
        openButton: 'Penting: wajib dibaca',
        title: 'Penting: wajib dibaca',
        summary: 'Sebelum melanjutkan, baca dulu cara kerja platform ini, batas tanggung jawabnya, dan situasi apa saja yang harus segera dilaporkan.',
        intro: 'Semua orang yang mendaftar ke situs kami mendaftar secara pribadi melalui iklan Facebook, Instagram, dan TikTok lalu membuat profil mereka sendiri.',
        body1: 'Tidak ada pengguna yang bergabung ke sistem ini yang merupakan orang yang kami kenal dekat secara pribadi. Karena itu, Anda harus menguji, meneliti, dan mempertimbangkan dengan matang karakter, kepribadian, dan tujuan orang yang Anda kenal di sini.',
        body2: 'Uniqah.com hanya menyediakan platform agar Anda bisa berkenalan dengan tujuan menikah. Uniqah.com tidak bertanggung jawab atas informasi yang diberikan pengguna, ataupun karakter, kepribadian, dan niat mereka.',
        analysisTitle: 'Mohon ingat hal-hal ini',
        analysisItems: [
          'Orang baik maupun orang buruk bisa ada di mana saja di dunia. Karena itu, kami sangat menyarankan Anda untuk menganalisis orang yang Anda kenal dengan baik.',
          'Jangan terlalu cepat percaya hanya karena seseorang ada di platform ini; perhatikan konsistensinya dari waktu ke waktu.',
          'Rasa hormat, kejujuran, dan niat yang bersih sangat penting dalam sistem ini.',
        ],
        positiveTitle: 'Tanda yang bisa membantu Anda mengenali orang yang tepat',
        positiveLead: 'Tanda-tanda ini tidak menjamin apa pun sendirian, tetapi saat Anda saling mengenal, ini bisa menunjukkan niat yang lebih sehat dan serius:',
        positiveItems: [
          'Mereka berusaha mengenal karakter, nilai hidup, dan cara berpikir Anda sebelum fokus pada fisik atau materi.',
          'Ketika hubungan mulai berkembang, mereka bersedia membicarakan keluarga.',
          'Mereka mau memperkenalkan Anda kepada keluarganya.',
          'Mereka bisa jujur tentang beberapa hal sulit atau sensitif dalam hidupnya sendiri.',
          'Mereka bisa membicarakan cinta, batasan, dan hal-hal yang tidak mereka inginkan dalam pernikahan secara terbuka.',
          'Mereka terlihat sungguh-sungguh siap mengambil langkah nyata menuju pernikahan.',
        ],
        reportTitle: 'Jika ada tanda ini, jauhi, blokir, dan laporkan',
        reportLead: 'Perilaku di bawah ini adalah tanda bahaya yang serius. Jika Anda melihatnya, jangan lanjutkan percakapan; blokir pengguna tersebut dan laporkan kepada kami disertai screenshot jika memungkinkan:',
        reportItems: [
          'Jika sejak awal mereka terlalu akrab secara berlebihan.',
          'Jika mereka terus mengorek pendapatan, kondisi keuangan, atau kemampuan materi Anda.',
          'Jika mereka mencoba mengarahkan percakapan ke topik seksual atau kedekatan yang tidak pantas.',
          'Jika mereka mengajak Anda ke link lain, situs lain, atau aplikasi pesan lain.',
          'Jika mereka berusaha membuat Anda iba soal kondisi keuangannya lalu meminta uang atau bantuan.',
          'Jika mereka tampak mengejar keuntungan pribadi lewat kebohongan atau manipulasi.',
          'Jika ucapan mereka tidak konsisten dengan informasi yang mereka berikan.',
        ],
        reportOutro: 'Jauhi orang seperti ini. Blokir dan laporkan kepada kami melalui area Keluhan / Permintaan.',
        guidanceTitle: 'Opsi pendampingan dan konsultasi tambahan',
        guidanceBody1: 'Jika Anda ingin dilakukan penelusuran tentang orang yang Anda kenal, keluarganya, atau tempat tinggalnya, Anda dapat meminta layanan pendampingan dan konsultasi dari kami dengan biaya tertentu agar rasa saling percaya bisa terbentuk sebelum keputusan menikah diambil.',
        guidanceBody2: 'Selain itu, jika Anda sudah benar-benar memutuskan untuk menikah, Anda juga dapat meminta pendampingan dan konsultasi berbayar dari kami untuk seluruh proses pernikahan resmi.',
        closing1: 'Tujuan situs ini adalah membantu orang-orang yang benar-benar ingin menikah agar dapat menemukan satu sama lain.',
        closing2: 'Karena sistem ini masih sangat baru, mungkin masih ada kekurangan atau gangguan. Dalam situasi seperti itu, mohon jangan lupa melaporkannya kepada kami melalui tombol Keluhan / Permintaan.',
        closing3: 'Setiap hari akan ada orang baru yang bergabung ke sistem. Silakan instal aplikasi di ponsel Anda dan aktifkan notifikasi agar Anda bisa langsung mengetahui pesan dan suka yang masuk.',
        footer: 'Terima kasih sudah membaca sampai sini. Semoga Anda menemukan pernikahan bahagia yang Anda cari.',
        closeButton: 'Tutup',
      },
      empty: 'Belum ada profil untuk ditampilkan.',
      requestProfileNow: 'Tambah ke Favoritku',
      requesting: 'Menambahkan…',
      requestSent: 'Ditambahkan ke Favoritku',
      openProfile: 'Buka profil',
      profileModalTitle: 'Profil',
      actionsSoon: 'Segera: pesan singkat',
      notInTheirRange: 'Untuk interaksi, kamu harus masuk rentang usianya.',
      notInTheirRangeShort: 'Rentang usia tidak cocok',
      optionalDetailsRecommendation: {
        title: 'Detail sisanya bisa Anda lengkapi nanti',
        body: 'Kolom wajib Anda sudah lengkap. Jika mau, sekarang Anda bisa melengkapi sisa detail profil dan preferensi agar saran pasangan lebih baik. Jika pilih nanti, Anda bisa terus memakai Jelajah.',
        actions: {
          ok: 'Baik',
          later: 'Nanti',
        },
      },
    },

    waitingNote: {
      title: 'Sedang mencari pasangan yang cocok',
      body:
        'Kami sedang mencari pasangan yang sesuai dengan informasi profil dan kriteria Anda. Profil yang cocok akan tampil di tab <explore>Jelajah</explore> (Discover). Instal aplikasi dan aktifkan notifikasi agar mendapat pemberitahuan secara instan.',
    },

    paywall: {
      upgradeTitle: 'Aktivasi keanggotaan diperlukan',
      upgradeToInteract: 'Aktifkan keanggotaan untuk lanjut. Gratis untuk saat ini.',
      upgradeToReply: 'Aktifkan keanggotaan untuk membalas. Gratis untuk saat ini.',
      upgradeCta: 'Aktifkan keanggotaan (Gratis)',
    },

    profileGate: {
      important: 'PENTING',
      title: 'Lengkapi profilmu',
      body: 'Karena sistem ini mempertemukan orang-orang yang berniat menikah, Anda perlu mengisi formulir profil untuk dapat berinteraksi dengan pengguna lain.',
      photoBody: 'Formulir Anda sudah pernah diisi. Untuk berinteraksi sekarang, Anda perlu mengunggah minimal 1 foto. Silakan tambahkan dari bagian Foto Saya.',
      cta: 'Isi formulir profil',
      photoCta: 'Unggah foto',
      badge: 'Pengguna tidak dikenal',
    },

    profileIncompleteExploreWarning: {
      title: 'Silakan isi formulir profil',
      body: 'Karena informasi profil Anda belum ada, halaman Jelajahi bisa menampilkan orang dengan jenis kelamin yang sama, bukan lawan jenis. Silakan isi formulir profil.',
    },

    membershipModal: {
      deletePhrase: 'hapus akun saya',
      deleteTypePrompt: 'Jika Anda benar-benar ingin menghapus akun: ketik "{{phrase}}".',
    },

    myInfo: {
      title: 'Info saya',
      subtitle: 'Ringkasan informasi yang Anda berikan di aplikasi.',
      noProfile: 'Data profil tidak ditemukan.',
      appMissing: 'Data formulir aplikasi tidak ditemukan. (Data aplikasi atau profil pengguna mungkin hilang.)',
      contactPrivacyNotice:
        'Detail kontak Anda seperti WhatsApp, email, dan Instagram bersifat privat. Informasi ini tidak ditampilkan secara publik saat Anda mengisi formulir maupun di antarmuka aplikasi.',
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
        email: 'Alamat email',
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
        familyObstacle: 'Ada hambatan dari keluarga?',
        familyObstacleDetails: 'Hambatan keluarga (detail)',
        familyApprovalStatus: 'Persetujuan keluarga',
        religion: 'Agama',
        religiousValues: 'Nilai agama',
        incomeLevel: 'Pendapatan',
        marriageTimeline: 'Rencana waktu menikah',
        relocationWillingness: 'Bersedia pindah',
        preferredLivingCountry: 'Negara tinggal yang diinginkan',
        communicationLanguage: 'Bahasa komunikasi',
        communicationLanguageOther: 'Bahasa komunikasi (lainnya)',
        canCommunicateWithTranslationApp: 'Bisa berkomunikasi dengan aplikasi terjemahan',
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
      tier: {
        pre_match: 'Pra-pencocokan',
      },
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
        message: 'Pesan singkat',
        messageLong: 'Pesan',
        profileDetails: 'Detail profil',
      },
      photos: {
        showMine: 'Tampilkan foto saya',
        hideMine: 'Sembunyikan foto saya',
        reciprocityHint: 'Catatan: Jika Anda menyembunyikan foto dari seseorang, Anda juga tidak bisa melihat foto mereka (resiprositas).',
        reciprocityConfirm:
          'Jika Anda menyembunyikan foto Anda, Anda juga tidak akan bisa melihat foto orang ini (resiprositas). Lanjutkan?',
        reciprocityBlocked: 'Foto terkunci: karena Anda menyembunyikan foto Anda.',
      },
      photoAccess: {
        needOtherPermission: 'Untuk melihat foto, Anda harus mendapatkan izin dari pihak lain.',
        request: 'Minta izin foto',
        status: {
          pending: 'Permintaan terkirim (menunggu)',
          approved: 'Permintaan disetujui',
          granted: 'Akses sudah diberikan',
          unknown: 'Status saat ini: {{status}}',
        },
        actions: {
          requested: 'Permintaan terkirim',
          granted: 'Akses diberikan',
        },
      },
      banners: {
        locked: 'Anda punya pencocokan aktif — yang lain terkunci',
        newMessage: 'Pesan baru',
        incomingLikeNote: 'Orang ini mengirimkan suka kepada Anda',
        activeChatStarted: 'Pencocokan aktif Anda sudah dimulai. Ketuk tombol Pesan untuk mulai chat tanpa batas dengan dukungan terjemahan.',
      },
    },

    matches: {
      title: 'Favoritku',
      showingCount: 'Menampilkan {{count}} orang.',
      emptyHint: 'Orang yang Anda simpan dan pencocokan aktif muncul di sini.',
      backToProfile: '← Kembali ke profil',
      findNew: 'Cari pencocokan baru',
      finding: 'Mencari…',
      howTitle: 'Bagaimana cara kerja?',
      howReadMore: 'Baca selengkapnya',
      howReadLess: 'Tampilkan lebih sedikit',
      howItems: [
        'Tinjau profil yang cocok di Jelajahi lalu tambahkan langsung ke Favoritku.',
        'Pihak lain tidak perlu menyetujui langkah ini; mereka hanya menerima notifikasi.',
        'Kartu di Favoritku punya aksi suka, pesan singkat, dan profil lengkap.',
        'Tombol profil lengkap langsung membuka seluruh isian formulir dan preferensi pasangan.',
        'Saat Anda menyukai seseorang, sistem pencocokan yang ada akan mengirim suka itu melalui dokumen match.',
        'Jika suka menjadi saling berbalas, tahap pencocokan aktif bisa dimulai.',
        'Saat pencocokan aktif dimulai, interaksi dengan profil lain terkunci dan chat privat panjang dengan dukungan terjemahan terbuka.',
        'Setelah periode 48 jam pencocokan aktif, berbagi kontak dapat dibuka.',
      ],
      activeLockTitle: 'Anda punya pencocokan aktif',
      activeLockBody: 'Interaksi dengan profil lain terkunci. Buka <link>halaman pencocokan aktif</link> untuk mengelolanya.',
      requestFailed: 'Permintaan gagal: {{error}}',
      requestOk: 'Ditambahkan ke Favoritku.',
      loading: 'Memuat…',
      loadFailed: 'Pencocokan tidak bisa dimuat: {{error}}',
      noneTitle: 'Anda belum menambahkan siapa pun.',
      noneBody:
        'Dari halaman Jelajahi, Anda bisa langsung menambahkan profil yang sesuai ke Favoritku. Mereka akan muncul di halaman ini, lalu Anda bisa memberi suka, mengirim pesan singkat, atau langsung membuka profil lengkapnya. Jika belum menemukan profil yang cocok, instal aplikasi dan aktifkan notifikasi agar segera mendapat kabar saat ada pembaruan.',
      people: {
        savedLabel: 'Tersimpan',
        grantedLabel: 'Akses profil ada',
        inspect: 'Profil lengkap',
        profileRequested: 'Permintaan tinjau profil dikirim untuk {{name}}.',
        messageModalSubtitle: 'Kirim pesan singkat',
        messagePlaceholder: 'Tulis pesan singkat…',
        messageSent: 'Pesan singkat terkirim.',
        profileModalTitle: 'Detail profil',
      },
      shortModal: {
        subtitle: 'Pesan singkat (batas 5) • untuk info singkat di luar profil',
        remaining: 'Sisa: {{remaining}} / {{limit}}',
        noMessages: 'Belum ada pesan.',
        translateError: 'Terjemahan gagal: {{error}}',
        translating: 'Menerjemahkan…',
        translate: 'Terjemahkan',
        placeholder: 'Tulis pertanyaan singkat…',
      },
      inboxSync: {
        title: 'Masalah inbox',
        refresh: 'Muat ulang dari server',
        refreshing: 'Memuat ulang…',
        note: 'Catatan: Ambil data dari server jika listener Firestore bermasalah.',
        permissionDenied: 'Tidak ada izin baca Firestore (permission-denied). Proyek Firebase: {{projectId}} (coba muat ulang dari server)',
        listenFailed: 'Inbox Firestore ({{kind}}) gagal: {{error}} (coba muat ulang dari server)',
        kinds: {
          likes: 'suka',
          requests: 'permintaan',
          profileAccess: 'akses profil',
          messages: 'pesan',
        },
      },
      errors: {
          goToMatchCard: 'Buka kartu pasangan',
        activeLocked: 'Anda tidak bisa mengirim pesan ke profil lain saat punya pencocokan aktif. Akhiri dulu pencocokan aktif Anda.',
        shortLimit: 'Pesan singkat Anda habis (5). Untuk lanjut, mulai pencocokan aktif.',
      },
    },

    chat: {
      backToMatches: '← Kembali ke pencocokan',
      translateTargetLabel: 'Terjemahkan ke',
      chatTitle: 'Chat',
      emoji: 'Emoji',
      emojiHint: 'Anda bisa menambahkan emoji',
      matchTestOnlyActive: 'Tes kecocokan hanya bisa dibuka pada pencocokan aktif.',
      shortAreaTitle: 'Area pesan singkat',
      shortAreaDesc: 'Untuk pertanyaan cepat (topik di luar profil).',
      shortAreaLimit: 'Batas: {{limit}} • Sisa: {{remaining}}',
      otherActiveLock: 'Pencocokan aktif Anda dengan orang lain. Chat panjang di sini ditutup.',
      noMessages: 'Belum ada pesan. Kirim pesan pertama.',
      matchLoading: 'Memuat pencocokan…',
      matchNotFound: 'Pencocokan tidak ditemukan.',
      messagesLoading: 'Memuat pesan…',
      sendFailed: 'Pesan tidak bisa dikirim. {{error}}',
      inputPlaceholderLong: 'Tulis pesan…',
      inputPlaceholderShort: 'Tulis pertanyaan/pesan singkat…',
      notAvailable: 'Pesan saat ini tidak tersedia.',
      lockedTitle: 'Pencocokan lain sementara terkunci',
      lockedBody: 'Saat Anda memiliki pencocokan aktif, pesan di pencocokan lain dinonaktifkan.',
      notAllowed: 'Anda tidak diizinkan melihat chat ini.',
      notOpenTitle: 'Pesan belum dibuka',
      notOpenBody: 'Pesan terbuka saat pencocokan menjadi aktif.',
      you: 'Anda',
      remainingTime: '{{hours}}j {{minutes}}m',
      lock48h: {
        title: 'Chat privat 48 jam + berbagi kontak',
        subtitle: 'Setelah 48 jam, konfirmasi bersama, percakapan di setidaknya dua hari berbeda, dan minimal 5 pesan per pihak, Anda bisa membagikan nomor Anda.',
        lockedRemaining: 'Terkunci. Sisa: {{time}}',
        confirming: 'Mengonfirmasi…',
        confirmed: 'Dikonfirmasi',
        confirm: 'Konfirmasi 48 jam',
        requesting: 'Membagikan nomor Anda…',
        requestContact: 'Bagikan nomor kontak saya',
        approving: 'Menyetujui…',
        approveContact: 'Setujui berbagi kontak',
        keepChat: 'Lanjut chat di dalam situs',
        keepChatSaving: 'Menyimpan pilihan Anda…',
        confirmStatusLabel: 'Status konfirmasi:',
        confirmStatus: {
          both: 'Dikonfirmasi mutual',
          you: 'Anda sudah konfirmasi (menunggu pihak lain)',
          other: 'Pihak lain sudah konfirmasi (menunggu Anda)',
          none: 'Belum ada konfirmasi',
        },
        contactStatusLabel: 'Berbagi kontak:',
        contactStatus: {
          approved: 'Kontak dibuka',
          bothShared: 'Kedua pihak membagikan nomornya',
          mineShared: 'Anda membagikan nomor Anda',
          otherShared: 'Pihak lain membagikan nomornya',
          continueChat: 'Sementara lanjut di dalam situs',
          pendingMine: 'Permintaan terkirim (menunggu persetujuan)',
          pendingOther: 'Pihak lain meminta (Anda bisa menyetujui)',
          closed: 'Tertutup',
        },
        confirmError: 'Konfirmasi gagal: {{error}}',
        contactRequestError: 'Berbagi nomor gagal: {{error}}',
        contactApproveError: 'Persetujuan kontak gagal: {{error}}',
        keepChatError: 'Pilihan Anda tidak bisa disimpan: {{error}}',
        whatsappTitle: 'WhatsApp',
        openInWhatsApp: 'Buka di WhatsApp',
        sharedMineHint: 'Anda sudah membagikan nomor Anda. Pihak lain dapat menghubungi Anda melalui nomor ini kapan saja.',
        keepChatHint: 'Pilihan Anda tersimpan. Untuk sekarang Anda melanjutkan percakapan di dalam situs.',
        otherSharedHint: 'Pihak lain membagikan nomornya. Anda bisa menghubungi mereka lewat WhatsApp kapan saja.',
        activityRuleTitle: 'Syarat percakapan tambahan untuk berbagi kontak',
        activityRuleBody: 'Agar berbagi kontak terbuka, kedua pihak harus sudah berbicara pada setidaknya {{minDays}} hari berbeda dan masing-masing mengirim minimal {{minMessages}} pesan. Status saat ini: hari {{days}}/{{minDays}}, Anda {{yourCount}}/{{minMessages}}, pihak lain {{otherCount}}/{{minMessages}}.',
        reportCta: 'Laporkan',
        blockCta: 'Blokir',
        blocking: 'Memblokir…',
        blockConfirm: 'Apakah Anda yakin ingin memblokir pengguna ini? Pencocokan aktif akan ditutup dan orang ini tidak akan ditampilkan lagi kepada Anda.',
        blockError: 'Gagal memblokir: {{error}}',
      },
    },

    profile: {
      membershipLabel: 'Keanggotaan',
      membershipActive: 'Aktif',
      membershipPassive: 'Tidak aktif',
      endsAt: 'Berakhir',
      completeProfileTutorial: {
        title: 'Lengkapi profil Anda',
        body: 'Untuk bisa berinteraksi, silakan isi formulir profil dan selesaikan pembuatan profil Anda (termasuk minimal 1 foto).',
        photoBody: 'Formulir Anda sudah tersimpan. Untuk berinteraksi sekarang, Anda perlu mengunggah minimal 1 foto. Buka Foto Saya lalu tambahkan foto.',
        actions: {
          ok: 'Isi formulir',
          uploadPhoto: 'Unggah foto',
          later: 'Nanti saja',
        },
      },
      editProfile: 'Edit profil',
      myMatches: 'Favoritku',
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

      partnerPrefsTitle: 'Preferensi pasangan',
      partnerPrefsCta: 'Ubah',
      partnerPrefsSave: 'Simpan',
      partnerPrefsSaving: 'Menyimpan…',
      partnerPrefsSaved: 'Tersimpan.',
      partnerPrefsErrors: {
        failed: 'Tidak dapat menyimpan. Silakan coba lagi.',
      },

      subscriptionTitle: 'Langganan',
      subscriptionActiveDesc: 'Keanggotaan Anda aktif. Anda dapat mengakses semua fitur.',
      subscriptionPassiveDesc: 'Keanggotaan Anda tidak aktif. Beberapa tindakan mungkin dibatasi tanpa keanggotaan.',
      buySoon: 'Beli keanggotaan (segera)',
      activateMembership: 'Aktifkan akun gratis',
      cancelMembership: 'Batalkan keanggotaan',
      membershipActivated: 'Akun diaktifkan.',
      membershipCancelled: 'Keanggotaan dibatalkan.',
      confirmCancelMembership: 'Apakah Anda ingin membatalkan keanggotaan?',
      myInfo: 'Info saya',
      identityTitle: 'Verifikasi identitas',
      identityVerified: 'Identitas Anda tampak terverifikasi.',
      identityStatus: 'Status identitas',
      verifyNow: 'Verifikasi identitas saya',
      identityHelp: 'Dengan memverifikasi identitas, Anda dapat meningkatkan kepercayaan dan menghapus batasan fitur/keanggotaan.',
      identityIntro: {
        title: 'Apa itu verifikasi identitas?',
        body:
          'Langkah ini tidak wajib.\n\nVerifikasi identitas ditujukan untuk pengguna yang ingin meningkatkan skor kepercayaan, mendapatkan lencana kepercayaan di profil, dan ditampilkan lebih atas di Jelajahi.\n\nInformasi yang dikirim untuk verifikasi hanya digunakan untuk verifikasi dan tidak disimpan secara permanen setelah proses selesai.',
        cta: 'Saya sudah baca, lanjutkan',
      },
      actionIntro: {
        explore: {
          title: 'Jelajahi',
          body: 'Jelajahi menampilkan profil yang dipilih untuk Anda. Profil terverifikasi bisa muncul lebih atas.',
          cta: 'Saya sudah baca, buka',
        },
        editProfile: {
          title: 'Profil',
          body: 'Di sini Anda dapat memperbarui informasi pengajuan/profil. Perubahan dapat memengaruhi pencocokan.',
          cta: 'Saya sudah baca, lanjutkan',
        },
        matches: {
          title: 'Pencocokan saya',
          body: 'Kelola pencocokan di sini: suka, setujui/tolak, dan langkah chat ada di sini.',
          cta: 'Saya sudah baca, buka',
        },
        partnerPrefs: {
          title: 'Preferensi pasangan',
          body: 'Memperbarui kriteria membantu Anda melihat pencocokan yang lebih relevan.',
          cta: 'Saya sudah baca, edit',
        },
        membership: {
          title: 'Keanggotaan',
          body: 'Lihat status keanggotaan dan kelola fitur terkait keanggotaan di sini.',
          cta: 'Saya sudah baca, buka',
        },
        photo: {
          title: 'Foto',
          body: 'Kelola foto Anda dan (opsional) aktifkan privasi foto (blur).',
          cta: 'Saya sudah baca, buka',
        },
        guidance: {
          title: 'Panduan pernikahan',
          body: 'Lihat informasi panduan proses pernikahan dan opsi kontak cepat.',
          cta: 'Saya sudah baca, buka',
        },
        feedback: {
          title: 'Masukan / Laporan',
          body: 'Gunakan ini untuk meminta dukungan atau melaporkan perilaku yang tidak pantas.',
          cta: 'Saya sudah baca, lanjutkan',
        },
        identity: {
          title: 'Verifikasi identitas',
          body: 'Ini membuka opsi verifikasi identitas. Verifikasi bersifat opsional dan meningkatkan lencana kepercayaan Anda.',
          cta: 'Saya sudah baca, buka',
        },
        referral: {
          title: 'Undang',
          body: 'Undang teman dengan kode/tautan dan pantau manfaat referral di sini.',
          cta: 'Saya sudah baca, buka',
        },
        logout: {
          title: 'Keluar',
          body: 'Anda akan keluar dengan aman. Anda bisa masuk kembali kapan saja dan melanjutkan dari tempat terakhir.',
          cta: 'Saya sudah baca, keluar',
        },
      },
      discoverPrompt: {
        eyebrow: 'Langkah berikutnya',
        title: 'Buka halaman Jelajahi untuk melihat calon pasangan',
        body: 'Banyak pengguna menunggu di halaman profil dan mengira tidak ada siapa-siapa. Buka Jelajahi sekarang untuk melihat kandidat yang cocok dan meninjau profil baru.',
        cta: 'Ke Jelajahi',
      },
      identityTrust: {
        title: 'Untuk apa verifikasi ini?',
        points: {
          optional: 'Tidak wajib; ini hanya lencana kepercayaan (opsional).',
          privacy: 'Detail verifikasi tidak dibagikan di luar tujuan verifikasi.',
          matchmakingHub: 'Hub pencocokan',
          matchmakingHint: 'Jika Anda belum punya calon pasangan, Anda bisa masuk ke alur pencocokan dari sini.',
          verifyMethodUpload: 'Unggah foto identitas',
          verifyMethodWhatsApp: 'Panggilan video WhatsApp',
          destroy: 'Setelah verifikasi selesai, file/data verifikasi yang dikirim tidak disimpan secara permanen.',
          deleteAccount: 'Anda dapat menghapus akun kapan saja untuk menghapus data profil dan kecocokan.',
          sorting: 'Profil terverifikasi ditampilkan di urutan teratas di Jelajahi.',
        },
      },

      emailVerify: {
        title: 'Verifikasi email (opsional)',
        body: 'Email Anda: {{email}}. Jika Anda ingin, kami bisa mengirim email verifikasi.',
        cta: 'Kirim email verifikasi',
        sent: 'Email verifikasi terkirim. Silakan cek kotak masuk Anda.',
        failed: 'Tidak dapat mengirim email verifikasi. Silakan coba lagi.',
      },
      accountTitle: 'Akun',
      accountDeleteDesc: 'Anda dapat menghapus akun dan data terkait secara permanen.',
      deleteAccount: 'Hapus akun',
      deleting: 'Menghapus…',
      oldPanel: 'Panel lama (sementara)',
      verifyModalTitle: 'Verifikasi identitas',
      verifyModalInfo:
        'Verifikasi identitas bersifat opsional.\n\nPilih metode dan ikuti langkahnya. Setelah ditinjau, lencana akan muncul di profil Anda.',
      verifyMethodUpload: 'Unggah foto identitas',
      verifyMethodWhatsApp: 'Panggilan video WhatsApp',
      verifyWhatsAppTitle: 'Verifikasi lewat panggilan video WhatsApp',
      verifyWhatsAppBody: 'Verifikasi dilakukan melalui panggilan video WhatsApp. Anda dapat membuat permintaan dan membuka WhatsApp.',
      verifyWhatsAppCta: 'Buka WhatsApp',
      verifyMethodSelfieVideo: 'Verifikasi video selfie',
      verifyMethodSocial: 'Verifikasi via media sosial',
      verifySelfieVideoTitle: 'Verifikasi video selfie (WhatsApp)',
      verifySelfieVideoBody: 'Anda akan diminta mengirim video selfie 5 detik lewat WhatsApp. Anda dapat membuat permintaan dan membuka WhatsApp.',
      verifySelfieVideoCta: 'Buka WhatsApp',
      verifySocialTitle: 'Verifikasi via media sosial',
      verifySocialBody: 'Pilih akun Instagram / TikTok / YouTube / Facebook Anda dan kirim username. Tim kami akan meninjau dan memberikan lencana.',
      verifySocialPlatform: 'Platform',
      verifySocialUsername: 'Nama pengguna',
      verifySocialMissing: 'Silakan pilih platform dan masukkan username Anda.',
      verifySocialSubmitted: 'Terkirim. Menunggu peninjauan.',
      idType: 'Jenis ID',
      idTypeTrId: 'ID Nasional',
      idTypePassport: 'Paspor',
      idTypeDriver: 'SIM',
      verifyPhotosHint: 'Foto hanya digunakan untuk verifikasi.',
      verifyPrivacyNote: 'Tidak perlu menampilkan seluruh identitas; nama/penyebutan dan tanggal lahir sudah cukup.',
      idFront: 'Depan ID',
      idBack: 'Belakang ID',
      selfie: 'Selfie',
      verifyMissingFiles: 'Harap unggah depan/belakang ID dan selfie.',
      verifySubmitted: 'Permintaan verifikasi Anda telah diterima. Sedang ditinjau.',
      submitVerification: 'Kirim',
      confirmDelete: 'Apakah Anda ingin menghapus akun secara permanen? Ini tidak dapat dibatalkan.',

      photoPrivacy: {
        title: 'Foto',
        body:
          'Saat Anda memburamkan foto Anda, foto akan tampil blur pada kartu pencocokan dan hanya orang yang Anda izinkan yang dapat melihatnya dengan jelas.',
        toggleLabel: 'Buramkan foto saya',
        stateOn: 'Aktif',
        stateOff: 'Nonaktif',
        hintOn: 'Di daftar pencocokan, Anda bisa memberi izin per orang lewat tombol “Tampilkan foto saya” di setiap kartu.',
        hintOff: 'Saat blur nonaktif, tombol izin foto tambahan tidak ditampilkan di kartu pencocokan.',
        fairnessWarning:
          'Penggunaan adil: Setelah Anda memburamkan foto Anda, foto pada kartu pencocokan hanya dapat dilihat untuk orang yang Anda izinkan.',
        rules: {
          firstBlurLock48h: 'Setelah Anda memburamkan foto untuk pertama kali, Anda tidak dapat membuatnya terlihat kembali selama 48 jam.',
          unblurLock48h: 'Setelah Anda membuat foto terlihat, Anda tidak dapat memburamkannya lagi selama 48 jam.',
          onlyAllowed:
            'Saat visibilitas nonaktif, hanya orang yang Anda izinkan yang dapat melihat foto Anda; dan Anda hanya dapat melihat foto orang yang Anda izinkan.',
        },
        cooldownError: 'Ada masa tunggu untuk tindakan ini. Sisa: {{time}}',
      },
      photoManager: {
        maxFive: 'Anda dapat menambahkan hingga 5 gambar.',
        manageButton: 'Tambah/Ubah foto',
        modalIntro: 'Lihat foto Anda saat ini dan perbarui kapan saja. Maksimal 5 gambar.',
        slotLabel: 'Foto {{index}}',
        remove: 'Hapus',
        empty: 'Kosong',
        replace: 'Ganti',
        add: 'Tambah',
        save: 'Simpan',
      },

      userCode: {
        label: 'Kode Pengguna',
      },

      guidance: {
        button: 'Panduan Pernikahan',
        modalTitle: 'Panduan Pernikahan',
        subtitle: 'Sistem kami bukan hanya pencocokan',
        intro:
          'Sistem kami bukan hanya layanan pencocokan. Setelah Anda memutuskan untuk menikah, kami membantu dan membimbing warga Indonesia dan Turki dalam setiap tahap—sebelum menikah, saat proses pernikahan, hingga setelah menikah—agar semua urusan berjalan lancar.',
        learnMore: 'Pelajari lebih lanjut (Halaman pernikahan)',
        whatsappCta: 'Chat via WhatsApp',
        whatsappMessage: 'Halo, saya ingin mendapatkan informasi tentang panduan pernikahan.',
        sections: {
          gettingToKnow: {
            title: '1) Tahap berkenalan',
            items: [
              'Melakukan riset/pemeriksaan latar belakang tentang calon pasangan',
              'Bertemu dan berdiskusi dengan keluarga',
              'Mediasi serta layanan penerjemahan saat panggilan video antar calon pasangan',
              'Mediasi serta layanan penerjemahan dalam komunikasi antar keluarga',
            ],
          },
          preparations: {
            title: '2) Persiapan pernikahan',
            panel: {
              membership: {
                title: 'Syarat keanggotaan',
                lead: 'Syarat keanggotaan:',
                freeActiveTermsTitle: 'Syarat aktivasi gratis',
              },
            },
            items: [
              'Menyiapkan dokumen yang diperlukan',
              'Memulai proses hukum',
              'Menentukan tanggal pernikahan',
              'Menghitung biaya pernikahan',
            ],
          },
          marriageStage: {
            title: '3) Tahap pernikahan',
            items: [
              'Tiket penerbangan ke Indonesia',
              'Akomodasi hotel di Indonesia',
              'Perencanaan transportasi di Indonesia (mobil pribadi, pesawat, kereta, atau kapal)',
              'Mengurus proses hukum di Indonesia',
              'Persiapan akad/nikah',
              'Layanan penerjemahan dan pendampingan selama berada di Indonesia',
            ],
          },
          afterMarriage: {
            title: '4) Setelah pernikahan',
            items: [
              'Pencatatan/registrasi pernikahan di instansi Turki dan Indonesia',
              'Perencanaan langkah administrasi setelah menikah berdasarkan negara domisili',
            ],
          },
        },
      },

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
          install: 'Pasang aplikasi',
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
      tabs: {
        preview: 'Pratinjau',
        details: 'Detail profil',
      },
      detailsAccess: {
        needsPermission: 'Untuk melihat detail profil, pengguna ini harus memberikan izin.',
        grantedHint: 'Sekarang Anda dapat melihat detail profil.',
        status: {
          pending: 'Permintaan terkirim (menunggu)',
          approved: 'Permintaan disetujui',
          granted: 'Akses sudah diberikan',
          unknown: 'Status saat ini: {{status}}',
        },
        actions: {
          request: 'Kirim permintaan',
          requested: 'Permintaan terkirim',
          granted: 'Akses diberikan',
        },
        retry: 'Coba lagi',
        refresh: 'Muat ulang',
        viewPersonProfile: 'Lihat profil orang',
        mayRequireApproval: 'Detail mungkin memerlukan persetujuan pihak lain.',
      },
      photos: {
        onlyAllowed: 'Hanya yang diberi izin dapat melihat',
        reciprocityBlocked: 'Foto terkunci: karena Anda menyembunyikan foto Anda.',
      },
      profileTitle: 'Info profil',
      contactHidden:
        'Detail kontak disembunyikan. Tidak ditampilkan saat mengisi formulir maupun di UI aplikasi. Detail ini hanya dapat dibagikan setelah periode pencocokan aktif 48 jam jika tercapai kecocokan pasti, dan hanya dengan persetujuan Anda.',
      rulesTitle: 'Aturan (singkat)',
      rules: {
        generic: 'Kesalahan',
        likeFirst: 'Jika suka timbal balik, “Suka timbal balik” terbentuk.',
        startActive: 'Chat panjang dengan dukungan terjemahan terbuka setelah kedua pihak menyetujui “Mulai pencocokan aktif”.',
        onlyOneActive: 'Hanya 1 pencocokan aktif; saat aktif, suka/pesan dengan profil lain terkunci.',
        unlockAfterCancel: 'Profil lain terbuka kembali setelah pencocokan aktif dibatalkan oleh kedua pihak.',
      },
      activeStart: {
        starting: 'Memulai…',
        waiting: 'Menunggu persetujuan',
        start: 'Mulai pencocokan aktif',
        confirmPrompt:
          'Anda akan memulai pencocokan aktif.\n\n- Anda hanya bisa punya 1 pencocokan aktif (profil lain akan terkunci).\n- Setelah aktif, Anda tidak bisa membatalkan selama 2 jam pertama.\n\nApakah Anda setuju?',
        activatedNotice: 'Pencocokan aktif dimulai. Chat panjang dengan dukungan terjemahan sekarang terbuka.',
        waitingNotice: 'Permintaan terkirim. Setelah pihak lain menyetujui, chat panjang dengan dukungan terjemahan akan terbuka.',
      },
      cancel: {
        title: 'Akhiri pencocokan aktif',
        desc: 'Pengakhiran bersifat mutual. Setelah Anda mengakhiri, pihak lain juga harus mengakhiri.',
        cooldown: 'Untuk mencegah penyalahgunaan, pembatalan dinonaktifkan selama 2 jam pertama. Sisa: {{time}}',
        request: 'Akhiri pencocokan aktif',
        requestSent: 'Permintaan pengakhiran terkirim',
        waitingOther: 'Menunggu pihak lain mengakhiri.',
        confirmPrompt:
          'Anda akan mengakhiri pencocokan aktif.\n\n- Pengakhiran mutual: pencocokan ditutup setelah kedua pihak mengakhiri.\n- Setelah diakhiri, lock interaksi dengan profil lain dihapus.\n\nApakah Anda setuju?',
      },
      mutualLike: {
        title: 'Anda memiliki suka timbal balik',
        body: 'Suka timbal balik memulai tahap pencocokan aktif. Setelah kedua pihak menyetujui, chat privat dengan dukungan terjemahan terbuka dan Anda bisa berbicara tanpa batas selama pencocokan aktif berlanjut.',
      },
      longChatClosedTitle: 'Chat panjang ditutup',
      longChatClosedBody: 'Chat panjang tersedia hanya setelah memulai pencocokan aktif. Pada tahap ini Anda hanya bisa menggunakan pesan singkat.',
      shortModal: {
        title: 'Pesan singkat',
      },
      translate: {
        errors: {
          tooLong: 'Pesan ini terlalu panjang; silakan dipersingkat untuk diterjemahkan.',
          onlyIncoming: 'Hanya pesan masuk yang bisa diterjemahkan.',
          notConfigured: 'Layanan terjemahan belum dikonfigurasi.',
          rateLimited:
            'Terjemahan sedang padat (Gemini ada limit 15/menit). Coba lagi 1 menit atau upgrade plan.',
          piiBlocked: 'Terjemahan otomatis diblokir karena berisi info pribadi/kontak. Silakan hapus info tersebut.',
          failed: 'Terjemahan gagal.',
        },
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
      generic: 'Kesalahan',
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
      contactShareMissingNumber: 'Nomor WhatsApp untuk dibagikan tidak ditemukan. Silakan periksa info kontak di profil Anda.',
      contactNotShared: 'Pihak lain belum membagikan nomor kontaknya.',
      contactActivityRequired: 'Berbagi kontak mensyaratkan percakapan pada setidaknya dua hari berbeda dan minimal 5 pesan dari masing-masing pihak.',
      blockedUserPair: 'Interaksi dengan pengguna ini ditutup. Salah satu pihak telah memblokir pihak lainnya.',
      cancelCooldown: 'Untuk mencegah penyalahgunaan, pembatalan sementara dinonaktifkan. Sisa: {{time}}',
    },
  },

  home: {
    hero: {
      badgeCompany: 'PT MoonStar Global Indonesia',
      badgeSocial: 'Kanal sosial Uniqah',
      title: 'Uniqah',
      subtitle: 'Matchmaking • Panduan pernikahan • Komunikasi aman di aplikasi',
      description:
        'Uniqah adalah sistem matchmaking berorientasi pernikahan. Kami menargetkan proses yang aman, saling menghormati, dan transparan dengan langkah-langkah yang jelas. Jika diperlukan, kami juga memberi dukungan seperti penerjemahan dan panduan proses.',
      note: 'Berorientasi pernikahan dengan privasi dan keamanan sebagai prioritas.',
      freeNote: 'Menggunakan aplikasi ini sepenuhnya gratis.',
      ctaTours: 'Mulai ajukan',
      ctaBrochures: 'Lihat dokumen',
      ctaTrust: 'Kepercayaan & Legal',
    },
    trust: {
      items: [
        {
          title: 'Proses transparan',
          description: 'Pra-pendaftaran → penawaran tertulis → kontrak/pembayaran berjalan jelas.',
        },
        {
          title: 'Dukungan cepat',
          description: 'Dukungan via WhatsApp; bantuan multi-bahasa bila diperlukan.',
        },
        {
          title: 'Pendiri & legal',
          description: 'Uniqah didirikan oleh pasangan Turki–Indonesia dan beroperasi di bawah PT MoonStar Global Indonesia.',
        },
      ],
    },
    services: {
      title: 'Apa yang kami lakukan untuk Anda?',
      cards: {
        joinTours: {
          title: 'Dukungan aplikasi & profil',
          description:
            'Dukungan langkah demi langkah untuk aplikasi, pembuatan profil, dan pengelolaan proses.',
        },
        groupTours: {
          title: 'Koordinasi keluarga/komunitas',
          description:
            'Panduan untuk komunikasi keluarga dan koordinasi bila diperlukan.',
        },
        privateTravel: {
          title: 'Panduan praktis',
          description:
            'Panduan praktis di lapangan bila diperlukan.',
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
      ctaTryFree: 'Coba gratis',
      ctaWeddingGuidance: 'Buka panduan pernikahan',
      ctaMatchmaking: 'Cari pasangan',
      matchmakingHint:
        'Untuk berkenalan dengan beberapa calon pasangan yang sesuai dan berkomunikasi langsung, Anda bisa mendaftar di aplikasi matchmaking kami, mengisi formulir, meninjau profil calon pasangan, atau menghubungi mereka. Klik di sini untuk mendaftar dan mulai berkomunikasi dengan calon pasangan.',
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
        'adalah merek dari perusahaan {{company}}. Pihak kontrak dan proses penagihan dilakukan oleh badan hukum ini.',
      documents: 'Dokumen & Kontrak',
      brochures: 'Dokumen (PDF)',
    },
    brandInfo: {
      title: 'Informasi merek & perusahaan',
      labels: {
        brand: 'Merek',
        legalName: 'Nama legal',
        tax: 'NPWP',
        nib: 'NIB',
      },
      socialNote: 'Kami membagikan konten dan panduan melalui Uniqah.',
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
          body: 'Dalam kontrak layanan/penjualan jarak jauh, badan hukum yang tercantum adalah {{company}}.',
        },
      },
    },
    documents: {
      title: 'Pusat dokumen',
      body: 'Semua dokumen, kontrak, dan kebijakan terbaru ada di sini.',
      cta: 'Buka dokumen',
      brochureNote: 'Dokumen tambahan:',
      brochureLink: 'Dokumen',
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
          a: '{{brand}} adalah merek dari {{company}}. Kontrak dan penagihan dilakukan oleh badan hukum ini.',
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
      editOnce: {
        usernameLocked: 'Dalam mode edit, nama pengguna tidak dapat diubah (hak perbaikan satu kali).',
        photosLocked: 'Dalam mode edit, pembaruan foto dinonaktifkan. Anda hanya dapat memperbaiki kolom formulir.',
      },
    },
  },

  matchmakingHub: {
    metaTitle: "Pencocokan",
    badge: "Proses privat & dimoderasi",
    title: "Sistem pencocokan untuk pernikahan",
    liveJoinToast: 'Peserta baru bergabung',
    description:
      "Sistem ini tidak memiliki tujuan yang sama dengan aplikasi dating biasa. Di sini tidak ada ruang bagi orang yang mencari hiburan, penipuan, atau kepuasan seksual alih-alih pernikahan yang sungguh-sungguh. Sistem ini sepenuhnya gratis; hari ini kami menghubungkan orang-orang antara Turki dan Indonesia, dan segera akan berkembang menjadi struktur yang membantu orang dari lebih banyak negara saling menemukan serta, bila diperlukan, mendapat pendampingan dalam perjalanan menuju pernikahan.",
    preview: {
      title: "Setelah daftar, apa yang akan kamu lihat di 'Profil Saya'?",
      subtitle:
        'Kartu contoh ini bukan data pengguna nyata; hanya untuk memperlihatkan alur sistem yang saat ini sepenuhnya gratis, langkah suka timbal balik, dan keuntungan chat dengan dukungan terjemahan secara singkat.',
      cta: 'Daftar gratis',
      cards: {
        matches: {
          title: 'Kecocokan & status',
          body: 'Suka timbal balik, tahap pencocokan aktif, dan chat privat berjalan di sini. Selama pencocokan aktif, kedua pihak dapat berbicara dengan dukungan terjemahan.',
          mockTitle: 'Contoh',
          mockItem1: 'Kecocokan yang disarankan',
          mockItem1Sub: 'Status: minat bersama (contoh)',
          mockTag1: 'Lihat',
          mockItem2: 'Kecocokan aktif',
          mockItem2Sub: 'Status: chat terbuka (contoh)',
          mockTag2: 'Pesan',
        },
        pool: {
          title: 'Pool (kandidat)',
          body: 'Lihat kandidat yang sesuai, kirim permintaan, atau lewati. Jika disetujui, kartu kecocokan terbuka.',
          mockTitle: 'Contoh',
          mockItem1: 'Kartu profil kandidat (contoh)',
          mockItem1Sub: 'Usia • Kota • Ringkasan singkat (contoh)',
          mockCta: 'Kirim permintaan',
        },
        chat: {
          title: 'Chat lebih aman',
          body: 'Pesan difilter; selama pencocokan aktif, kedua pihak dapat berbicara di jendela privat dengan dukungan terjemahan dan tanpa terlalu khawatir soal bahasa.',
          mockTitle: 'Contoh',
          mockSystem: 'Sistem: Komunikasi lebih aman aktif',
          mockMsg1: 'Halo, apa kabar? (contoh)',
          mockMsg2: 'Chat dulu, lalu langkah persetujuan (contoh)',
          mockHint: 'Catatan: selama pencocokan aktif berlanjut, Anda dapat berbicara tanpa batas di jendela privat; berbagi kontak terbuka setelah 48 jam + persetujuan kedua pihak.',
        },
      },
    },
    actions: {
      loginExisting: "Masuk jika sudah punya profil",
      apply: "Ajukan pencocokan",
      goPanel: "Profil saya",
      tour: "Lihat tur panel",
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
      previewProfile: {
        title: 'Pratinjau layar Profil Anda (tutorial)',
        body: 'Sebelum mengirim, lihat singkat cara kerja layar Profil Anda. Pratinjau terbuka di tab baru.',
        open: 'Buka pratinjau profil',
      },
      preSubmitTour: {
        title: 'Sebelum mengirim, lihat dulu layar Profil Anda',
        body:
          'Setelah pengajuan terkirim, Anda akan mengelola kecocokan dari layar “Profil Anda”. Sebelum pengiriman terakhir, mari lihat tutorial singkat. (Terbuka di tab baru; formulir ini tetap terbuka.)',
        open: 'Buka Profil Anda (tab baru)',
        continue: 'Lanjut dan kirim pengajuan',
        later: 'Nanti saja',
      },
      applicationIdLabel: 'ID Pengajuan',
      deferCta: 'Isi nanti',
      deferError: 'Tidak dapat mengarahkan sekarang. Silakan coba lagi.',
      wizard: {
        badge: 'Pengajuan Cepat',
        step: 'Langkah {{current}} / {{total}}',
        back: 'Kembali',
        next: 'Lanjutkan',
        finish: 'Selesai',
        completeCta: 'Selesai',
        steps: {
          basic: {
            title: 'Informasi wajib',
            desc: 'Masukkan informasi inti yang dibutuhkan untuk menyelesaikan pengajuan Anda.',
          },
          details: {
            title: 'Detail opsional',
            desc: 'Tambahkan informasi tambahan jika Anda ingin kami mengenal Anda lebih baik.',
          },
          identity: {
            title: 'Kriteria pasangan',
            desc: 'Di langkah terakhir, Anda dapat menjelaskan kualitas pasangan yang Anda cari.',
          },
          photos: {
            title: 'Foto & perkenalan singkat',
            desc: 'Unggah hingga 5 foto dan perkenalkan diri secara singkat.',
          },
          preferences: {
            title: 'Preferensi pasangan & persetujuan',
            desc: 'Lengkapi preferensi dan kirim pengajuan Anda.',
          },
        },
        checkpoints: {
          basic: {
            body: 'Anda bisa menyelesaikan formulir di sini, atau lanjut ke langkah 2 agar kami bisa menemukan kandidat yang paling tepat untuk Anda.',
          },
          details: {
            body: 'Anda bisa menyelesaikan formulir di sini, atau lanjut ke langkah terakhir untuk menjelaskan kualitas pasangan yang Anda cari.',
          },
        },
        complete: {
          body: 'Terima kasih sudah mengisi semua informasi. Anda sudah mengambil keputusan terbaik untuk membantu kami menemukan orang yang tepat bagi Anda.',
        },
      },
      editOnce: {
        oneTimeWarning:
          'Peringatan: Anda hanya dapat memperbarui formulir ini satu kali. Pastikan semua informasi sudah benar sebelum menyimpan.',
        usernameLocked: 'Dalam mode edit, nama pengguna tidak dapat diubah (perbaikan satu kali).',
        photosLocked: 'Dalam mode edit, pembaruan foto dinonaktifkan. Anda hanya dapat memperbaiki kolom formulir.',
      },
      photo: {
        choose: 'Pilih file',
        noFileChosen: 'Belum ada file dipilih',
        uploaded: 'Terunggah',
      },
      sections: {
        me: 'Saya',
        lookingFor: 'Yang saya cari',
        details: 'Detail',
        moreDetails: 'Detail tambahan',
        partnerPreferences: 'Preferensi calon pasangan',
      },
      contactPrivacyNotice:
        'Detail kontak Anda seperti WhatsApp dan email bersifat privat. Informasi ini tidak ditampilkan secara publik saat Anda mengisi formulir maupun di tampilan aplikasi.',
      contactNumberNote: 'Nomor kontak Anda tidak dibagikan kepada siapa pun; diperlukan agar kami dapat menghubungi Anda jika dibutuhkan.',
      confirmGender: {
        title: 'Konfirmasi gender',
        text: 'Anda memilih gender Anda sebagai "{{gender}}". Konfirmasi?',
        cancel: 'Batal',
        confirm: 'Konfirmasi',
      },
      labels: {
        username: 'Nama pengguna',
        fullName: 'Nama lengkap',
        age: 'Usia',
        city: 'Kota',
        country: 'Anda tinggal di negara mana?',
        whatsapp: 'Nomor kontak',
        email: 'Alamat email',
        instagram: 'Instagram (opsional)',
        nationality: 'Apa kewarganegaraan Anda?',
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
        familyObstacle: 'Jika ada kendala/keberatan keluarga, apa?',
        marriageTimeline: 'Kapan Anda ingin menikah?',
        relocationWillingness: 'Apakah Anda bersedia tinggal di luar negara Anda?',
        preferredLivingCountry: 'Negara tempat tinggal yang diinginkan',

        photos: 'Foto (1 wajib, hingga 5)',
        photo: 'Foto',
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
        nationality: 'contoh: Indonesia / Turki',
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
        familyObstacleDetails: 'tuliskan singkat kendala/keberatan keluarga',
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
          years: '{{count}} tahun',
          years_one: '{{count}} tahun',
          years_other: '{{count}} tahun',
        },
        familyApproval: {
          approved: 'Menyetujui',
          inProgress: 'Dalam tahap pembicaraan',
          problem: 'Ada masalah/keberatan',
        },
      },
      hints: {
        lookingForGenderAuto: 'Gender yang Anda cari diatur otomatis berdasarkan gender Anda.',
        countryNationality: 'Negara tempat tinggal dan kewarganegaraan Anda bisa berbeda. Yang satu menanyakan tempat tinggal Anda, yang lain menanyakan kewarganegaraan Anda.',
        foreignLanguages: 'Jika tidak ada, pilih “Tidak ada”. Jika memilih “Lainnya”, tuliskan bahasanya.',
        multiSelect: 'Anda dapat memilih lebih dari satu opsi.',
        partnerAgeNeedsYourAge: 'Rentang usia dihitung berdasarkan usia Anda.',
        partnerAgeComputed: 'Perkiraan rentang usia: {{min}}–{{max}}',
      },
      photoHint: 'Minimal 1 foto wajib diunggah, dan Anda dapat mengunggah hingga 5 foto jika mau. Silakan unggah foto terbaru yang jelas (wajah terlihat), tanpa filter berat.',
      consents: {
        age: 'Saya berusia 18+.',
        privacy:
          'Saya telah membaca <privacyLink>Kebijakan Privasi</privacyLink> dan <kvkkLink>Pemberitahuan Data Pribadi (KVKK)</kvkkLink>, serta menyetujui pemrosesan data untuk evaluasi/komunikasi.',
        terms: 'Saya telah membaca dan menyetujui <termsLink>Syarat & Ketentuan</termsLink>.',
        photo: 'Saya menyetujui penggunaan foto untuk proses pencocokan (tidak dipublikasikan).',
      },
      submit: 'Kirim pengajuan',
      submitting: 'Mengirim…',
      success: 'Pengajuan Anda berhasil dikirim.',
      installAppCta: 'Pasang aplikasi dan aktifkan notifikasi',
      errors: {
        alreadySubmitted: 'Anda sudah memiliki pengajuan matchmaking. Anda bisa memperbarui info dari halaman Profil.',
        profileTextWriteOnceUsed: 'Teks “Tentang saya” dan “Kriteria pasangan” hanya bisa ditulis sekali dan tidak bisa diubah setelah disimpan.',
        profileTextPII: 'Jangan menulis info kontak (telepon, email, tautan, Instagram, IBAN, dll.) di “Tentang saya” atau “Kriteria pasangan”.',
        honeypotTriggered: 'Form tidak bisa dikirim. Autofill browser mungkin mengisi kolom tersembunyi. Muat ulang halaman lalu coba lagi.',
        tooFast: 'Anda mengirim terlalu cepat. Silakan coba lagi.',
        rateLimited: 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
        consent18Plus: 'Untuk mengirim, Anda harus mengonfirmasi bahwa Anda berusia 18+.',
        consentPrivacy: 'Untuk mengirim, Anda harus menyetujui Kebijakan Privasi.',
        consentPhotoShare: 'Untuk mengirim, Anda harus menyetujui penggunaan foto untuk pencocokan.',
        consentsRequired:
          'Untuk mengirim, Anda harus menyetujui kotak persetujuan (18+, kebijakan privasi, syarat & ketentuan, persetujuan foto).',

        username: 'Nama pengguna wajib diisi.',
        usernameTaken: 'Nama pengguna ini sudah digunakan.',
        fullName: 'Nama lengkap wajib diisi.',
        age: 'Usia wajib diisi.',
        ageRange: 'Usia harus berada pada rentang yang wajar.',
        city: 'Kota wajib diisi.',
        country: 'Negara wajib diisi.',
        whatsapp: 'Nomor WhatsApp wajib diisi.',
        email: 'Email wajib diisi.',
        instagram: 'Silakan masukkan Instagram yang valid.',
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
        familyObstacle: 'Silakan jelaskan kendala/keberatan keluarga.',
        familyObstacleDetails: 'Silakan tuliskan detail kendala/keberatan keluarga.',
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
        partnerAgeRange: 'Rentang usia pasangan tidak valid.',
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

        photoRequired: 'Silakan unggah foto.',
        photo1Required: 'Foto 1 wajib diunggah.',
        photo2Required: 'Foto 2 wajib diunggah.',
        photo3Required: 'Foto 3 wajib diunggah.',
        photoType: 'Silakan unggah file gambar yang valid (JPG/PNG/WebP).',
        photoUploadFailed: 'Unggah foto gagal. Silakan coba lagi.',

        languageLevelTr: 'Silakan pilih tingkat Bahasa Turki.',
        languageLevelId: 'Silakan pilih tingkat Bahasa Indonesia.',
        languageLevelEn: 'Silakan pilih tingkat Bahasa Inggris.',
        translationApp: 'Silakan tuliskan/pilih aplikasi terjemahan.',

        mustLogin: 'Anda harus masuk untuk mengirim pengajuan.',
        blocked: 'Akun Anda diblokir dari pengajuan.',
        permissionDenied: 'Izin ditolak. Silakan hubungi dukungan.',
        editOnceUsed:
          'Formulir profil hanya bisa diperbarui satu kali. Karena hak edit Anda sudah habis, permintaan Anda tidak dapat diproses.',
        submitFailed: 'Pengiriman gagal. Silakan coba lagi.',
      },
    },
  },

  newsletter: {
    title: 'Buletin Uniqah',
    subtitle: 'Tinggalkan email Anda untuk menerima pembaruan Uniqah, fitur baru, dan pengumuman penting.',
    placeholderEmail: 'Alamat email Anda',
    cta: {
      subscribe: 'Berlangganan',
      sending: 'Mengirim…',
    },
    success: 'Berhasil disimpan! Terima kasih.',
    error: 'Email ini sudah terdaftar atau terjadi kesalahan.',
    privacy: 'Kami menghormati privasi Anda. Anda dapat berhenti berlangganan kapan saja.',
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
    studioBanner: {
      text: 'UI Studio baru sudah tersedia. Beralih untuk tampilan profil + kecocokan yang lebih rapi.',
    },
    membershipPromo: {
      freeLabel: 'Gratis',
      until: 'Sampai {{date}}',
    },
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
        lead: 'Unggah 1–3 foto baru. Foto akan diperbarui setelah disetujui admin.',
        pending: 'Sedang ditinjau',
        cta: 'Kirim permintaan',
        uploading: 'Mengunggah…',
        success: 'Permintaan diterima. Foto akan diperbarui setelah ditinjau.',
        errors: {
          photosRequired: 'Silakan pilih minimal 1 foto.',
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
      goToStudio: 'Buka Studio',
      whatsapp: 'Chat via WhatsApp',
      remove: 'Hapus',
      sending: 'Mengirim…',
      pending: 'Menunggu…',
      canceling: 'Membatalkan…',
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
    chat: {
      sidebarTitle: 'Chat',
      noActiveChat: 'Belum ada chat aktif saat ini.',
      inputPlaceholderShort: 'Tulis pesan singkat…',
      lock48h: {
        approving: 'Menyetujui…',
      },
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
      editOnceWarning:
        'Peringatan: Hak perbaikan ini hanya satu kali. Setelah disimpan, formulir tidak bisa diedit lagi.',
      editOnceCta: 'Simpan perubahan (satu kali)',
      editOnceSaving: 'Menyimpan…',
      editOnceSuccess: 'Pembaruan diterima. Formulir Anda telah diperbarui.',
      editOnceUsed:
        'Formulir profil hanya bisa diperbarui satu kali. Karena hak edit Anda sudah habis, permintaan Anda tidak dapat diproses.',
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
      freePaidMembershipCta: 'Aktifkan akun gratis',
      paidMembershipCta: 'Aktifkan keanggotaan',
      freeActiveTitle: 'Aktivasi gratis',
      freeActiveBody:
        'Jika identitas Anda terverifikasi, Anda dapat mengaktifkan akun secara gratis. (Aturan tidak aktif 48/24 jam berlaku.)',
      freeActiveNeedsVerification: 'Verifikasi identitas diperlukan untuk aktivasi gratis.',
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
      membershipOrVerificationRequired: 'Aksi ini membutuhkan akun aktif.',
      freeActiveMembershipRequired: 'Aksi ini membutuhkan akun aktif.',
      freeActiveMembershipBlocked: 'Hak aktivasi Anda dinonaktifkan. Anda perlu keanggotaan berbayar untuk aksi ini.',
      otherUserMatched: 'Orang ini sudah cocok dengan orang lain.',
      alreadyMatched: 'Anda sudah memiliki kecocokan.',
      userLocked: 'Proses kecocokan Anda terkunci. Aksi ini tidak diizinkan.',
      pendingContinueExists: 'Anda sudah memilih seseorang untuk dilanjutkan. Putuskan dulu di kecocokan itu.',
      applicationRequired: 'Anda harus menyelesaikan pengajuan pencocokan terlebih dahulu.',
      requestNewFailed: 'Tidak bisa meminta kecocokan baru.',
      requestNewRateLimited: 'Anda terlalu sering meminta. Silakan coba lagi nanti.',
      requestNewQuotaExhausted: 'Kuota permintaan kecocokan baru hari ini sudah habis (3/3). Silakan coba lagi besok.',
      requestNewFreeActiveBlocked: 'Anda tidak bisa meminta kecocokan baru karena hak aktivasi Anda dibatalkan. Silakan hubungi dukungan.',
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
      profileNotCreatedHint: 'Profil Anda belum dibuat. Silakan isi formulir pengajuan terlebih dahulu.',
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
      readOnly: 'Bidang ini tidak dapat diubah (hanya-baca).',
    },
    contact: {
      errors: {
        fetchFailed: 'Info kontak tidak dapat diambil. Silakan coba lagi.',
        notConfirmed: 'Info kontak tidak dapat ditampilkan sebelum kecocokan dikonfirmasi.',
      },
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
      planLabels: {
        eco: 'Eco',
        standard: 'Standar',
        pro: 'Pro',
      },
      inactive: 'Keanggotaan tidak aktif. Sampai aktif, Anda tidak bisa melihat detail penuh atau memberi suka/tolak.',
      inactiveMale: 'Keanggotaan tidak aktif. Sampai aktif, Anda tidak bisa melihat detail penuh atau memberi suka/tolak.',
      inactiveFemale: 'Keanggotaan tidak aktif. Untuk beberapa aksi, akun Anda harus aktif.',
      activeViaVerification: 'Identitas Anda terverifikasi. Anda dapat mengaktifkan akun Anda.',
      freeActiveActive: 'Akun Anda aktif.',
      freeActiveTermsTitle: 'Syarat aktivasi gratis',
      freeActiveTermsBody:
        'Jika Anda mengaktifkan akun gratis dan tidak aktif selama 48 jam, status aktivasi dapat dibatalkan. Saat mengaktifkan kembali, batas waktu turun menjadi 24 jam. Jika tetap tidak aktif, Anda perlu keanggotaan berbayar untuk mengaktifkan kembali dan meminta kecocokan baru.',
      freeActiveApply: 'Aktifkan akun gratis',
      freeActiveApplying: 'Mengajukan…',
      freeActiveApplied: 'Akun gratis diaktifkan. Durasi: {{hours}} jam.',
      daysLeft_one: 'Sisa waktu: {{count}} hari.',
      daysLeft_other: 'Sisa waktu: {{count}} hari.',
      until: 'Berakhir: {{date}}.',
    },
    membershipNotice: {
      title: 'Info suka / detail / kontak',
      male: {
        lead: 'Akses fitur:',
        points: [
          'Pencocokan dan pratinjau terbatas gratis.',
          'Melihat detail penuh, suka/tolak, dan menghubungi memerlukan membership berbayar.',
        ],
      },
      female: {
        lead: 'Akses fitur:',
        points: [
          'Pencocokan dan pratinjau terbatas gratis.',
          'Melihat detail penuh, suka/tolak, dan menghubungi memerlukan akun aktif.',
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
            a: 'Suka / detail lengkap / kontak memerlukan akun aktif.',
          },
          {
            q: 'Untuk apa verifikasi identitas?',
            a: 'Sebagai lencana kepercayaan. Membantu proses keluhan dengan bukti dan dapat membuka beberapa alur.',
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
        'Pencocokan dan pratinjau profil tidak memerlukan keanggotaan. Untuk setuju/tolak atau menghubungi pasangan, Anda perlu akun aktif.',
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
        freeUsageNotice: 'Menggunakan aplikasi ini sepenuhnya gratis.',
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
      verifiedBadge: 'Pengguna terpercaya',
      requiredTitle: 'Verifikasi identitas (lencana)',
      requiredBody: 'Verifikasi identitas adalah lencana kepercayaan. Jika ada pelanggaran aturan, Anda bisa mengajukan keluhan dengan screenshot/bukti.',
      unverifiedTitle: 'Belum terverifikasi (lencana)',
      unverifiedBodyMale: 'Verifikasi identitas bersifat opsional. Catatan: untuk pria, aksi membutuhkan keanggotaan aktif.',
      unverifiedBodyFemale: 'Verifikasi identitas bersifat opsional. Catatan: verifikasi identitas dapat membuka beberapa alur.',
      referenceCode: 'Kode verifikasi',
      pendingHint: 'Status: menunggu peninjauan',
      tabs: {
        selfieVideo: 'Video selfie',
        social: 'Media sosial',
      },
      selfieVideo: {
        title: 'Verifikasi dengan video selfie (WhatsApp)',
        lead: 'Kirim video selfie 5 detik lewat WhatsApp. Anda dapat membuat permintaan dan membuka WhatsApp.',
        pendingHint: 'Permintaan verifikasi video selfie dibuat. Silakan selesaikan pengiriman video lewat WhatsApp.',
      },
      social: {
        title: 'Verifikasi dengan media sosial',
        lead: 'Pilih platform dan kirim username Anda. Setelah ditinjau, lencana akan diberikan.',
        platformLabel: 'Media sosial',
        usernameLabel: 'Username',
        submit: 'Kirim',
        success: 'Terkirim. Menunggu peninjauan.',
        pendingHint: 'Permintaan verifikasi media sosial dibuat. Menunggu peninjauan.',
      },
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
        kycNotConfigured: 'KYC otomatis belum dikonfigurasi. Silakan gunakan WhatsApp atau verifikasi media sosial.',
        whatsappNotConfigured: 'Nomor WhatsApp belum dikonfigurasi. Silakan gunakan verifikasi media sosial.',
        missingFiles: 'Silakan pilih ID (depan/belakang) dan selfie.',
        missingSocial: 'Silakan pilih platform dan masukkan username Anda.',
      },
    },

    membershipModal: {
      openFree: 'Aktifkan keanggotaan gratis',
      open: 'Status keanggotaan',
      title: 'Kelola keanggotaan',
      statusLabel: 'Keanggotaan',
      activate: 'Aktifkan keanggotaan saya',
      freeActivateCta: 'Aktifkan gratis',
      cancel: 'Batalkan keanggotaan saya',
      cancelDisabledHint: 'Anda tidak bisa membatalkan sebelum keanggotaan aktif.',
      deleteAccount: 'Hapus akun',
      deletePhrase: 'hapus akun saya',
      deleteTypePrompt: 'Jika Anda benar-benar ingin menghapus akun: ketik "{{phrase}}".',
      deleteFinalConfirm: 'Akun Anda akan dihapus permanen dari sistem. Anda yakin?',
      deleteCancel: 'Batal',
      deleteContinue: 'Lanjutkan',
      deleteBack: 'Kembali',
      deleteYes: 'Ya, hapus akun saya',
      loading: 'Memproses…',
      alreadyActive: 'Keanggotaan Anda sudah aktif',
      successActivated: 'Keanggotaan Anda diaktifkan.',
      successActivatedUntil: 'Keanggotaan Anda diaktifkan. Berlaku sampai: {{date}} (sisa {{count}} hari).',
      promoActivated: 'Paket Eco Anda diaktifkan gratis. Berakhir pada {{date}} (sisa {{count}} hari).',
      freeNowTitle: 'Keanggotaan gratis untuk saat ini',
      freeNowBody: 'Keanggotaan saat ini gratis dan bisa diaktifkan langsung.\nSaat jumlah anggota sudah cukup, kami dapat menambahkan pembayaran dan beralih ke model berbayar.',
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
    receipt: {
      view: 'Lihat bukti pembayaran',
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
      pendingContinueExists: 'Anda sudah memilih seseorang untuk dilanjutkan. Putuskan dulu di kecocokan itu.',
      cancelConfirm: 'Yakin ingin membatalkan kecocokan ini?',
      errors: {
        activeLocked: 'Proses kecocokan Anda terkunci. Aksi ini tidak diizinkan.',
      },
      proposedActions: {
        interested: 'Tertarik',
        notSuitable: 'Tidak cocok',
      },
      proposedChat: {
        title: 'Pesan langsung',
        noticeTitle: 'Informasi',
        noticeBody: 'Ini adalah kanal pesan langsung yang terbatas. Harap tulis singkat dan sopan.',
      },
      rejectReason: {
        title: 'Pilih alasan…',
      },
      contactShare: {
        title: 'Berbagi kontak',
        approved: 'Detail kontak dibagikan dengan persetujuan bersama.',
        pending: 'Permintaan kontak dikirim. Menunggu persetujuan pihak lain.',
        lock48h: 'Untuk berbagi nomor telepon, diperlukan 48 jam chat di dalam situs. Sisa waktu: {{time}}.',
        requestCta: 'Minta berbagi kontak',
        requestHint: 'Jika pihak lain menyetujui, nomor telepon akan terlihat.',
      },
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
        open: 'Pesan',
        title: 'Chat di Dalam Situs',
        directMessage: 'Pesan langsung',
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
        lastMessages: 'Pesan terakhir',
        placeholder: 'Tulis pesan…',
        send: 'Kirim',
        lockedByActive: {
          title: 'Chat ini ditutup',
          body:
            'Chat ini ditutup karena Anda sedang memiliki kecocokan aktif. Untuk bisa melanjutkan chat dengan kecocokan lain, Anda perlu membatalkan kecocokan aktif dari layar chat.',
          cancelCta: 'Batalkan kecocokan aktif',
        },
        system: {
          contactRequest: {
            mine: 'Anda mengirim permintaan berbagi kontak.',
            other: 'Pihak lain ingin berbagi detail kontak.',
            approveHint: 'Jika Anda menyetujui, nomor telepon akan muncul di pesan.',
          },
          contactShared: 'Detail kontak dibagikan:\n{{aWhatsapp}}\n{{bWhatsapp}}',
          contactSharedMineTitle: 'Nomor kontak Anda telah dibagikan',
          contactSharedMineBody: 'Pihak lain sekarang bisa menghubungi Anda melalui nomor ini.',
          contactSharedOtherTitle: '{{name}} membagikan nomor kontaknya',
          contactSharedOtherBody: 'Anda bisa menghubungi orang ini melalui nomor tersebut kapan saja.',
        },
        translate: {
          title: 'Terjemahkan pesan',
          cta: 'Terjemahkan',
          translating: 'Menerjemahkan…',
          billing: {
            sponsored: 'Terjemahan sponsor (biaya ditagihkan ke lawan bicara)',
            self: 'Mengurangi kuota terjemahan Anda',
          },
          usageWarning: 'Anda sudah menggunakan %{{usagePercent}} dari limit.',
          errors: {
            quotaExceededWithUsage:
              'Anda sudah menggunakan %{{usagePercent}} dari limit. Akan diperbarui bulanan, atau upgrade plan / Boost.',
            quotaExceeded: 'Limit terjemahan Anda habis. Akan diperbarui bulanan, atau upgrade plan / Boost.',
            tooLong: 'Pesan ini terlalu panjang; silakan dipersingkat untuk diterjemahkan.',
            onlyIncoming: 'Hanya pesan masuk yang bisa diterjemahkan.',
            authRequired: 'Perlu login.',
            notConfigured: 'Layanan terjemahan belum dikonfigurasi.',
            rateLimited:
              'Terjemahan sedang padat (Gemini ada limit 15/menit). Coba lagi 1 menit atau upgrade plan.',
            piiBlocked: 'Terjemahan otomatis diblokir karena berisi info pribadi/kontak. Silakan hapus info tersebut.',
            failed: 'Terjemahan gagal.',
          },
        },
        continue: 'Lanjut (Setuju)',
        reject: 'Tidak cocok (Tolak)',
        errors: {
          sendFailed: 'Pesan gagal dikirim.',
          messageTooLong: 'Pesan terlalu panjang. Maks 240 karakter.',
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
            contactLocked: 'Anda tidak bisa mengirim permintaan kontak sebelum 48 jam berlalu.',
            approveLocked: 'Tidak bisa menyetujui sebelum 48 jam berlalu.',
            contactNotPending: 'Tidak ada permintaan berbagi kontak yang menunggu untuk disetujui.',
          },
        },
      },
      candidate: {
        fallbackName: 'Kandidat',
        verifiedBadge: 'Pengguna terpercaya',
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
    title: 'Keanggotaan',
    lead: 'Keanggotaan aktif secara otomatis. Menggunakan aplikasi ini sepenuhnya gratis.',
    freeNowTitle: 'Sepenuhnya gratis',
    freeNowBody: 'Semua fitur di aplikasi gratis; tidak ada pembayaran atau langkah aktivasi tambahan.',
    freeActivateCta: 'Aktifkan keanggotaan saya gratis',
    activating: 'Mengaktifkan…',
    activated: 'Keanggotaan diaktifkan.',
    activatedUntil: 'Keanggotaan diaktifkan. Berlaku sampai: {{date}}',
    freeActivatedInfo:
      'Keanggotaan gratis Anda berlaku sampai {{date}}.\nDengan keanggotaan ini, Anda dapat like/tolak profil kecocokan dan menggunakan {{translatedCount}} pesan terjemahan.\nBatas ganti kecocokan harian Anda adalah {{dailyLimit}}.',
    freeDisabled: 'Aktivasi keanggotaan gratis sedang dinonaktifkan. Silakan coba lagi nanti.',
    activateFailed: 'Tidak dapat mengaktifkan keanggotaan. Silakan coba lagi.',
    errors: {
      notAuthenticated: 'Sesi tidak dapat diverifikasi. Silakan keluar lalu masuk kembali.',
      serverNotConfigured: 'Konfigurasi server tidak lengkap. Silakan hubungi dukungan.',
      apiUnavailableDev: 'API tidak dapat dijangkau. Di local dev, jalankan `npm run dev` (api+web).',
    },
    backToPanel: 'Kembali ke panel',
    freeNowFootnote: 'Catatan: Aplikasi ini sepenuhnya gratis.',
  },

  meta: {
    baseTitle: 'Uniqah | Matchmaking Pernikahan',
    baseDescription:
      'Uniqah adalah sistem matchmaking tertutup yang berfokus pada pernikahan dan komunikasi yang lebih aman di dalam aplikasi.',
    pages: {
      home: { title: 'Uniqah | Matchmaking Pernikahan' },
      about: { title: 'Tentang Kami' },
      corporate: { title: 'Perusahaan' },
      contact: { title: 'Kontak' },
      travel: { title: 'Perjalanan' },
      tours: {
        title: 'Paket Tur',
        description:
          'Paket tur Indonesia yang terencana dan tur grup: program di lapangan untuk Bali, Lombok, Komodo dan lainnya.',
      },
      wedding: {
        title: 'Panduan Pernikahan',
        description:
          'Panduan proses pernikahan Anda di Indonesia: dukungan menyeluruh untuk hotel, transportasi, penerjemahan, dan dokumen resmi.',
      },
      explore: { title: 'Jelajahi' },
      youtube: { title: 'YouTube' },
      gallery: { title: 'Galeri' },
      privacy: { title: 'Kebijakan Privasi' },
      documents: { title: 'Dokumen' },
    },
  },

  common: {
    open: 'Buka',
    close: 'Tutup',
    loading: 'Memuat…',
    downloadPdf: 'Unduh PDF',
    learnMore: 'Pelajari',
    back: 'Kembali',
    you: 'Kamu',
    them: 'Dia',
    enlarge: 'Perbesar',
    time: {
      minutesShort: '{{minutes}} mnt',
      hmShort: '{{h}}j {{m}}mnt',
    },
    privacySecurity: {
      title: 'Privasi & Keamanan',
      text: 'Halaman ini dilacak dengan Google Analytics. Data Anda dilindungi dengan enkripsi SSL/TLS.',
      policyLink: 'Kebijakan Privasi',
    },
  },

  documentsHub: {
    title: 'Dokumen',
    subtitle:
      'Akses perjanjian paket tur, perjanjian penjualan jarak jauh, pemberitahuan privasi, kebijakan pembatalan/pengembalian, serta instruksi pembayaran dalam satu halaman.',
    sidebarTitle: 'DOKUMEN',
    openNewTab: 'Buka di tab baru',
    source: 'Sumber: {{file}}',
    note:
      'Catatan: Halaman ini hanya menampilkan dokumen. Pada langkah pembayaran/reservasi, kotak persetujuan yang relevan tetap berlaku.',
  },

  youtubePage: {
    hero: {
      title: 'Video YouTube',
      subscribe: 'Berlangganan',
    },
    intro: {
      title: 'Video',
      text: 'Di sini Anda bisa menemukan video tentang kehidupan kami di Indonesia, tur, dan perjalanan kami.',
    },
    video: {
      watch: 'Tonton',
    },
    cta: {
      title: 'Kunjungi kanal kami untuk lebih banyak',
      text: 'Kunjungi kanal YouTube kami dan berlangganan agar tidak ketinggalan video baru.',
      visit: 'Kunjungi kanal',
    },
  },

  floatingWhatsapp: {
    label: 'WhatsApp',
    ariaLabel: 'Chat lewat WhatsApp',
    messages: {
      default: 'Halo, saya ingin mendapatkan informasi lebih lanjut.',
      home: 'Halo, saya ingin mendapatkan informasi tentang Uniqah.',
      explore: 'Halo, saya ingin mendapatkan informasi lebih lanjut.',
      travel: 'Halo, saya ingin mendapatkan informasi lebih lanjut.',
      wedding: 'Halo, saya ingin mendapatkan informasi tentang proses pernikahan.',
      youtube: 'Halo, saya ingin mendapatkan informasi tentang video YouTube Anda.',
      contact: 'Halo, saya ingin mendapatkan informasi tentang cara menghubungi Anda.',
      tours: 'Halo, saya ingin mendapatkan informasi lebih lanjut.',
      documents: 'Halo, saya ingin mendapatkan informasi tentang dokumen Anda.',
    },
  },

  about: {
    hero: {
      title: 'Tentang Kami',
      subtitle:
        'Uniqah adalah sistem pencocokan (matchmaking) dan dukungan perjalanan menuju pernikahan yang berfokus pada Indonesia. Tujuan kami: mempertemukan orang yang tepat melalui proses yang aman, saling menghormati, dan transparan—serta memberi dukungan nyata di lapangan bila diperlukan (penerjemahan, logistik, langkah resmi).',
    },
    brand: {
      title: 'Di bawah MoonStar Global Indonesia',
      p1:
        'Situs ini adalah etalase dan titik kontak layanan Uniqah yang kami jalankan di bawah PT MoonStar Global Indonesia.',
      p2:
        'MoonStar Global Indonesia didirikan oleh wirausahawan Turki yang tinggal di Indonesia untuk membangun jembatan yang andal antara dua budaya, mengelola proses pernikahan dengan benar, dan menyediakan solusi praktis di lapangan bagi orang yang bepergian ke Indonesia.',
      cards: {
        communityContentTitle: 'Konten komunitas',
        communityContentDesc:
          'Panduan dan konten bermanfaat tentang hubungan, komunikasi, dan alur proses.',
        toursTitle: 'Panduan pernikahan',
        toursDesc: 'Panduan langkah resmi, penerjemahan, dan koordinasi.',
        weddingTitle: 'Uniqah – Matchmaking',
        weddingDesc:
          'Pencocokan serius dengan langkah keamanan, pengelolaan profil, alur chat, dan proses keputusan yang jelas.',
        dameturkTitle: 'DaMeTurk',
        dameturkDesc:
          'Produksi dan penjualan es krim Turki asli di Indonesia—dibangun sebagai nilai merek lokal di bawah PT MoonStar Global Indonesia. dameturk.com',
      },
      socialNote:
        'Kami mendukung komunitas Uniqah melalui panduan dan konten.',
    },

    philosophy: {
      title: 'Cara kami melihat matchmaking',
      intro:
        'Bagi kami, pernikahan bukan sekadar bertemu—melainkan perjalanan yang dibangun dengan saling menghormati, kecocokan, dan kepercayaan. Kami membangun Uniqah dengan cara pandang ini: sistem yang memperjelas proses, memprioritaskan keamanan, dan membantu komunikasi yang sehat antara dua budaya.',
      sections: {
        direct: {
          title: 'Sistem + tanggung jawab di lapangan',
          p1:
            'Uniqah bukan papan daftar publik. Profil, foto, dan alur proses dirancang untuk mengurangi penyalahgunaan. Bila perlu, kami turun tangan dengan peninjauan manual dan dukungan, serta mengambil tanggung jawab atas prosesnya.',
          p2:
            'Tujuan kami adalah lingkungan yang saling menghormati, di mana pengguna yang serius merasa aman dan dapat bertemu orang yang tepat.',
        },
        planning: {
          title: 'Bertahap, fokus pada kecocokan',
          p1:
            'Kami tidak menyerahkan semuanya pada kebetulan. Kami memandang pengajuan, pengecekan kelayakan, pembuatan profil, pencocokan, dan chat sebagai alur bertahap. Dengan begitu ekspektasi lebih jelas dan keputusan lebih sehat.',
          bullets: [
            'Pengajuan dan pengecekan kelayakan (usia/aturan).',
            'Pembuatan profil dan verifikasi foto.',
            'Pencocokan, chat, dan keputusan bersama.',
            'Penerjemahan dan panduan komunikasi lintas budaya bila diperlukan.',
          ],
          p2: 'Dengan demikian proses tetap manusiawi—namun konsisten dan terukur.',
        },
        transparency: {
          title: 'Transparansi dan privasi',
          p1:
            'Langkah proses, aturan, dan ekspektasi harus jelas sejak awal. Pada saat yang sama, privasi adalah fondasi: data pribadi dan komunikasi dikelola secara terkendali, dengan kanal dukungan dan pelaporan bila dibutuhkan.',
        },
        comfort: {
          title: 'Komunikasi yang sopan dan batasan',
          p1:
            'Saling menghormati, kesopanan, dan menjaga batasan adalah prinsip utama. Komunitas Uniqah memiliki aturan dan mekanisme keamanan untuk menjaga kualitas komunikasi.',
          p2:
            'Dengan alur pelaporan, pemblokiran, dan dukungan, kami berupaya mencegah pengalaman negatif terulang.',
        },
        guidance: {
          title: 'Jembatan lintas bahasa dan budaya',
          p1:
            'Jika komunikasi lintas bahasa dan perbedaan budaya tidak dikelola dengan baik, proses menjadi lebih sulit. Kami membantu kedua pihak mengekspresikan diri dengan benar melalui penerjemahan, dukungan komunikasi, dan panduan.',
        },
        wedding: {
          title: 'Panduan pernikahan',
          p1:
            'Selain matchmaking, kami membimbing pasangan yang merencanakan proses pernikahan terkait waktu, praktik lokal, dan koordinasi proses.',
          p2:
            'Mulai dari dokumen dan janji temu, penerjemahan, akomodasi/transport, hingga perencanaan acara—kami mengambil tanggung jawab sebagai tim di lapangan.',
        },
        expectation: {
          title: 'Ekspektasi jelas, waktu realistis',
          p1:
            'Di Uniqah, langkah proses, aturan, dan perkiraan waktu dibicarakan secara terbuka. Pengguna tahu apa yang diharapkan dan bisa melangkah tanpa terburu-buru mengambil keputusan.',
        },
      },
      outro:
        'Untuk informasi lebih lanjut tentang sistem matchmaking <1>Uniqah</1> dan panduan <3>Pernikahan</3>, Anda dapat melihat halaman tersebut. Untuk teks dan kebijakan resmi, gunakan bagian <5>Dokumen</5>.',
    },

    story: {
      title: 'Cerita singkat kami',
      steps: [
        'Kami pindah ke Indonesia dan membangun kehidupan serta rutinitas di sini.',
        'Kami membangun jaringan di lapangan dan komunitas yang memperkuat komunikasi lintas budaya.',
        'Kami mulai memproduksi konten dan panduan agar proses lebih mudah dipahami.',
        'Hari ini, kami menjalankan matchmaking Uniqah bersama panduan pernikahan dan layanan pendukung lainnya di bawah MoonStar Global Indonesia.',
      ],
      stepLabel: 'Langkah',
    },

    support: {
      title: 'Kami membantu Anda dalam hal',
      items: {
        joinScheduled: {
          title: 'Dukungan aplikasi & profil',
          description:
            'Dukungan langkah demi langkah untuk aplikasi, pembuatan profil, dan pengelolaan proses.',
        },
        translation: {
          title: 'Dukungan penerjemahan & komunikasi',
          description:
            'Kami dapat membantu komunikasi lintas bahasa dengan penerjemah untuk chat matchmaking, pertemuan resmi, atau kebutuhan lain—mengurangi hambatan bahasa dan meningkatkan rasa percaya diri.',
        },
        privatePlan: {
          title: 'Perencanaan perjalanan pribadi & bulan madu',
          description:
            'Jika Anda ingin merencanakan perjalanan Indonesia atau bulan madu tanpa ikut tur grup, kami menyusun penerbangan, akomodasi, rute harian, dan rekomendasi pengalaman bersama lalu membuat rencana yang sesuai untuk Anda.',
        },
        privateGroups: {
          title: 'Tur khusus untuk perusahaan & grup teman',
          description:
            'Untuk perusahaan, komunitas, atau grup teman, kami merancang program tur khusus berdasarkan tanggal, anggaran, dan ekspektasi Anda—serta merencanakan rute, tempo, dan logistik dari awal sampai akhir.',
        },
        logistics: {
          title: 'Perencanaan akomodasi & transportasi',
          description:
            'Untuk hotel, penerbangan, transfer, atau sewa mobil, kami membantu Anda memilih opsi yang aman dan sesuai anggaran/kenyamanan Anda.',
        },
        wedding: {
          title: 'Panduan proses pernikahan',
          description:
            'Untuk pasangan yang berencana menikah, kami memberi panduan terkait waktu, praktik lokal, penerjemahan, dan koordinasi proses.',
        },
      },
    },

    galleryTeaser: {
      title: 'Beberapa momen dari kehidupan dan pekerjaan kami',
      description:
        'Di bawah ini Anda bisa melihat beberapa momen pilihan dari kehidupan kami di Indonesia, pekerjaan kami di lapangan, dan perjalanan kami. Untuk lebih banyak, silakan kunjungi galeri.',
      cta: 'Kunjungi galeri untuk melihat semua foto',
      previewAlt1: 'Momen dari kehidupan kami di Indonesia',
      previewAlt2: 'Momen dari hari yang kami habiskan bersama di Indonesia',
      previewAlt3: 'Momen dari kenangan spesial di Indonesia',
    },

    youtubeHighlights: {
      title: 'Video yang paling menggambarkan kami',
      description:
        'Di kanal YouTube kami, Anda dapat menemukan video tentang kehidupan di Indonesia, budaya, perjalanan, dan pengalaman kami di lapangan. Dua video di bawah ini merangkum pendekatan kami dan dukungan yang kami berikan.',
      v1Title: 'Kisah pasangan yang kami dukung selama proses pernikahan di Indonesia',
      v1Desc:
        'Anda dapat melihat pengalaman pasangan yang menjalani proses pernikahan di Indonesia bersama kami dan bagaimana kami membantu.',
      v1ThumbAlt: 'Kisah pasangan yang kami dukung selama proses pernikahan di Indonesia',
      v2Title: 'Anda tidak akan percaya tempat seperti ini ada di Indonesia! Petualangan Citumang',
      v2Desc: 'Potongan seru tentang alam, petualangan, dan kehidupan sehari-hari di Indonesia.',
      v2ThumbAlt: 'Video petualangan Citumang',
    },

    whyUs: {
      title: 'Kenapa kami?',
      items: [
        {
          title: 'Sistem + pengalaman lapangan',
          description:
            'Kami menggabungkan sistem terstruktur dengan pengalaman di lapangan—mengambil tanggung jawab dalam matchmaking, komunikasi, dan panduan proses.',
        },
        {
          title: 'Fokus keamanan dan privasi',
          description:
            'Aturan, langkah, dan prinsip privasi jelas. Kami bekerja dengan mekanisme keamanan yang dirancang untuk mengurangi penyalahgunaan.',
        },
        {
          title: 'Komunikasi sehat lintas budaya',
          description:
            'Dengan penerjemahan dan panduan komunikasi lintas bahasa, kami mengurangi kesalahpahaman dan mendukung proses yang lebih sehat.',
        },
      ],
    },

    modal: {
      close: 'Tutup',
    },
  },

  contact: {
    form: {
      consent: 'Saya telah membaca dan menyetujui <privacyLink>Kebijakan Privasi</privacyLink>.',
      privacyLink: 'Kebijakan Privasi',
    },
  },

  galleryPage: {
    hero: {
      title: 'Galeri Foto',
      description:
        'Cuplikan singkat dari perjalanan pernikahan kami di Indonesia, perjalanan wisata, dan kehidupan sehari-hari.',
    },
    content: {
      title: 'Cuplikan dari Indonesia',
      description:
        'Di galeri foto kami, Anda dapat menemukan momen dari pernikahan, eksplorasi kami di Indonesia, dan kehidupan sehari-hari. Kami akan terus memperbarui halaman ini dengan foto terbaru secara berkala.',
      backToAbout: 'Kembali ke Tentang Kami',
      footerNote:
        'Visual di halaman ini akan kami perbarui seiring waktu dengan foto asli dari arsip kami sendiri.',
    },
    modal: {
      close: 'Tutup',
    },
    images: {
      '1': { alt: 'Cuplikan dari air terjun Siti Gunung, Sukabumi' },
      '2': { alt: 'Kenangan dari kunjungan kuil kami' },
      '3': { alt: 'Satu momen dari kuil-kuil di Yogyakarta' },
      '4': { alt: 'Momen dari kebun teh Ciwidey' },
      '5': { alt: 'Cuplikan dari jalan-jalan di alam Indonesia' },
      '6': { alt: 'Cuplikan dari pemandangan Danau Situ Patenggan' },
      '7': { alt: 'Momen dari pernikahan Salih dan Tini' },
      '8': { alt: 'Kenangan dari tur kuil Yogyakarta' },
      '9': { alt: 'Cuplikan dari hari pernikahan Salih dan Tini' },
      '10': { alt: 'Cuplikan dari tur ATV di pantai Pangandaran' },
      '11': { alt: 'Kenangan dari resort di Pangandaran' },
      '12': { alt: 'Pemandangan dari air terjun Sukabumi' },
      '13': { alt: 'Cuplikan dari area body rafting Citumang' },
    },
  },

  privacyPage: {
    title: 'Kebijakan Privasi',
    sections: {
      intro: {
        title: '1. Pendahuluan',
        text:
          'Uniqah menghormati privasi pelanggan dan hak perlindungan data. Kebijakan privasi ini menjelaskan bagaimana data pribadi Anda dikumpulkan, digunakan, dan dilindungi.',
      },
      dataCollected: {
        title: '2. Data yang Dikumpulkan',
        text: 'Melalui situs web kami, kami dapat mengumpulkan data berikut:',
        items: [
          'Nama lengkap',
          'Alamat email',
          'Nomor telepon',
          'Informasi aplikasi/profil',
          'Informasi browser dan perangkat',
        ],
      },
      dataUsage: {
        title: '3. Penggunaan Data',
        text: 'Data yang dikumpulkan digunakan untuk tujuan berikut:',
        items: [
          'Menyediakan layanan matchmaking dan panduan',
          'Menyediakan komunikasi dan dukungan pelanggan',
          'Meningkatkan situs web',
          'Mengirim pesan pemasaran dan promosi (dengan persetujuan)',
        ],
      },
      security: {
        title: '4. Keamanan Data',
        text:
          'Data pribadi Anda dilindungi dengan enkripsi dan langkah keamanan standar industri. Namun, tidak ada transmisi melalui internet yang 100% aman.',
      },
      rights: {
        title: '5. Hak Anda',
        text:
          'Anda dapat meminta informasi tentang data pribadi Anda, meminta perbaikan, atau meminta penghapusan dengan menghubungi kami secara tertulis.',
      },
      contact: {
        title: '6. Kontak',
        text:
          'Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, Anda dapat menghubungi kami di <emailLink>{{email}}</emailLink>.',
      },
    },
    lastUpdated: 'Terakhir diperbarui: {{date}}',
  },

  notFoundPage: {
    title: 'Halaman tidak ditemukan',
    backHome: 'Kembali ke Beranda',
  },

  weddingPage: {
    publicNote: {
      p1: 'Catatan: Halaman ini dibuat untuk membantu pasangan yang sedang merencanakan pernikahan dalam prosedur pernikahan. Jika Anda belum memiliki calon pasangan, silakan kunjungi',
      link: 'halaman Calon Pasangan kami',
      p2: '.',
    },
    hero: {
      badge: 'Pendampingan untuk proses pernikahan',
      title: 'Kami mendampingi persiapan pernikahan Anda',
      description:
        'Dokumen, prosedur resmi, komunikasi antar keluarga, dan langkah organisasi utama kami rencanakan bersama—mengubahnya menjadi perjalanan yang menenangkan, jauh dari pertanyaan yang mengganggu.',
      actions: {
        openForm: 'Buka Form Rencana Pernikahan',
        matchmakingHub: 'Pencocokan',
        matchmakingApply: 'Ajukan pencocokan',
        quickChat: 'Konsultasi cepat via WhatsApp',
        enableNotifications: 'Aktifkan notifikasi',
        notificationsEnabled: 'Notifikasi aktif.',
        notificationsDenied: 'Izin notifikasi tidak diberikan.',
        notificationsNotSupported: 'Browser ini tidak mendukung notifikasi.',
        notificationTitle: 'Pesan baru',
        notificationBody: 'Anda mendapat pesan baru dari pasangan Anda.',
      },
    },
    whatsapp: {
      quickChatMessage: 'Halo, saya ingin mendapatkan informasi tentang persiapan pernikahan dan pendampingan.',
    },
    stickyBackToProfile: {
      label: 'Kembali ke profil saya',
      aria: 'Kembali ke halaman profil',
    },
    intro: {
      servicesTitle: 'Layanan kami',
      cards: [
        {
          title: 'Dokumen & proses resmi',
          items: [
            'Persiapan dan pengecekan semua dokumen yang diperlukan',
            'Pengajuan resmi pernikahan dan pemantauan proses',
            'Penyelesaian urusan resmi setelah pernikahan',
          ],
        },
        {
          title: 'Komunikasi & penerjemahan',
          items: [
            'Dukungan komunikasi dengan calon pasangan dan keluarganya',
            'Penerjemahan untuk WhatsApp dan pertemuan tatap muka',
            'Jawaban jelas untuk pertanyaan Anda sepanjang proses',
          ],
        },
        {
          title: 'Transportasi & akomodasi',
          items: [
            'Rencana perjalanan bagi yang pertama kali bepergian ke luar negeri',
            'Pengaturan transportasi kendaraan pribadi di Indonesia',
            'Perencanaan hotel dan akomodasi',
          ],
        },
        {
          title: 'Pendampingan berkelanjutan',
          items: [
            'Pendampingan tanpa henti hingga pernikahan selesai',
            'Panduan umum untuk langkah resmi (melalui instansi resmi)',
            'Peta jalan administrasi tingkat tinggi setelah menikah',
          ],
        },
      ],
      flexibleTitle: 'Pendekatan layanan yang fleksibel',
      flexibleP1:
        'Anda bisa menggunakan semua layanan kami dari A sampai Z, atau meminta dukungan hanya pada bagian yang Anda butuhkan.',
      flexibleP2:
        'Anda dapat mengenal proses, kami, dan cara kerja kami lebih dekat dengan menonton video di kanal YouTube kami.',
      flexibleNote:
        'Anda dapat mengisi form "Rencana Pernikahan" di bawah, atau meninjau dokumen yang diperlukan secara detail pada tab "Dokumen Pernikahan di Indonesia".',
    },
    process: {
      title: 'Bagaimana prosesnya berjalan?',
      subtitle: 'Langkah-langkah ini adalah peta jalan umum; detailnya bisa berbeda tergantung kasus dan instansi resmi.',
    },
    steps: [
      {
        title: 'Langkah pertama: formulir perencanaan',
        description:
          'Untuk memahami Anda dan kondisi Anda saat ini dengan lebih baik, Anda mengisi dan mengirimkan formulir 15 pertanyaan di bagian Perencanaan. Tahap ini sepenuhnya gratis dan hanya memerlukan beberapa menit.',
      },
      {
        title: 'Kami merencanakan bersama Anda',
        description:
          'Setelah meninjau informasi yang Anda kirimkan, kami menghubungi Anda kembali dan menyusun peta jalan yang jelas sesuai kebutuhan proses pernikahan Anda.',
      },
      {
        title: 'Kesepakatan & layanan pendampingan',
        description:
          'Saat Anda memutuskan untuk menggunakan layanan pendampingan kami, Anda membayar 40% dari total anggaran yang telah dihitung. Demi rasa saling percaya, 60% sisanya kami terima setelah Anda tiba di Indonesia.',
      },
      {
        title: 'Proses administrasi pernikahan',
        description:
          'Kami mengajukan permohonan nikah resmi ke kantor KUA yang menaungi calon pasangan Anda dan memulai prosesnya. Kami membantu Anda mengumpulkan dokumen yang diperlukan langkah demi langkah dan menerjemahkan dokumen yang Anda kirim melalui WhatsApp.',
      },
      {
        title: 'Tahap di Indonesia',
        description:
          'Jika Anda menghendaki, kami mengatur tiket pesawat, hotel, dan transportasi lokal di Indonesia untuk Anda. Mulai dari penjemputan di bandara hingga mengantar Anda bersama pasangan saat kembali ke Turki, kami mendampingi di setiap tahap, termasuk membantu penerjemahan dalam komunikasi dengan pasangan, keluarga, dan lingkungan sekitarnya. Jika Anda mau, kami juga bisa hanya memulai proses nikah dan menyiapkan rencana yang lebih fleksibel agar langkah selanjutnya Anda selesaikan bersama pasangan Anda.',
      },
      {
        title: 'Prosedur setelah menikah',
        description:
          'Setelah pernikahan selesai, kami mengikuti langkah-langkah yang diperlukan agar pernikahan Anda diakui oleh instansi resmi. Jika Anda akan tinggal di Turki, kami menangani proses visa pasangan Anda; jika Anda akan tinggal di Indonesia, kami mengurus proses izin tinggal. Jika diminta, kami juga dapat membantu perencanaan bulan madu.',
      },
      {
        title: 'Penyelesaian layanan pendampingan',
        description:
          'Setelah semua proses selesai dengan lengkap, kami menutup pendampingan dan menyelesaikan pemeriksaan akhir bersama Anda agar Anda bisa memulai pernikahan dengan cara yang paling rapi dan nyaman.',
      },
    ],
    images: {
      prepAlt: 'Detail persiapan pernikahan di Indonesia',
      ceremonyAlt: 'Upacara pernikahan di Indonesia',
    },
    tabs: {
      plan: 'Rencana Pernikahan',
      documents: 'Dokumen Pernikahan di Indonesia',
    },
    mobileTabs: {
      documents: 'Dokumen',
      process: 'Proses',
      guidance: 'Panduan',
      planning: 'Perencanaan',
    },
    mobileDocuments: {
      question: {
        title: 'Pernikahan akan dilaksanakan di mana?',
        hint: 'Dokumen yang dibutuhkan berbeda tergantung negara tempat pernikahan dicatat.',
        options: {
          indonesia: 'Di Indonesia',
          turkiye: 'Di Turki',
        },
      },
      trRequirements: {
        title: 'Dokumen yang diperlukan untuk pernikahan resmi di Turki',
        note:
          'Catatan: Persyaratan dapat berbeda tergantung kota/instansi dan peraturan terbaru. Kita bisa memastikan checklist paling update sesuai kantor tempat Anda mendaftar.',
        steps: [
          {
            title: '🇮🇩 1️⃣ KBRI Ankara: izin menikah (CNI)',
            intro: '(Surat tidak ada halangan menikah / bukti lajang)',
            items: [
              '👩 Dokumen untuk perempuan WNI',
              'Paspor (asli + fotokopi)',
              'Fotokopi KTP',
              'Kartu Keluarga (KK)',
              'Akte kelahiran',
              'Bukti status belum menikah',
              'Surat kelayakan menikah dari instansi lokal di Indonesia (setara N1/N4)',
              'Foto 2–4 lembar',
              'Jika ada: putusan cerai atau akta kematian pasangan',
              '👨 Dokumen untuk pria warga negara Turki',
              'Fotokopi kartu identitas',
              'Ekstrak catatan kependudukan',
              'Surat keterangan domisili',
              'Bukti status belum menikah',
              '2 foto',
              'Bukti penghasilan',
            ],
            notes: [
              '📌 Setelah verifikasi, KBRI menerbitkan Certificate of No Impediment / surat izin menikah.',
              '📌 Dalam beberapa kasus, bisa diminta surat izin dari keluarga di Indonesia.',
              '📌 Terjemahan bahasa Turki untuk dokumen yang diminta biasanya harus dilegalisasi notaris; beberapa dokumen dapat memerlukan pengesahan tambahan sesuai ketentuan instansi.',
            ],
          },
          {
            title: '🇹🇷 2️⃣ Turki: dokumen untuk kantor nikah (Belediye Evlendirme Dairesi)',
            intro: 'Instansi pendaftaran nikah: Kantor Nikah (Belediye Evlendirme Dairesi).',
            items: [
              '👩 Dokumen untuk WNI',
              'Paspor + terjemahan bahasa Turki yang dilegalisasi notaris',
              'Akte kelahiran (terjemahan bahasa Turki + apostille)',
              'Surat izin menikah dari KBRI',
              'Surat keterangan belum menikah',
              'Surat kesehatan (diambil di Turki)',
              'Foto biometrik 4–6 lembar',
              'Pernyataan alamat tinggal',
              '👨 Dokumen untuk WN Turki',
              'Kartu identitas / Kimlik',
              'Ekstrak catatan kependudukan',
              'Surat keterangan domisili',
              'Surat kesehatan',
              'Foto 4–6 lembar',
            ],
            notes: [
              '📌 Syarat penting saat pendaftaran nikah di Turki',
              '✔ Dokumen asing harus ber-apostille',
              '✔ Terjemahan bahasa Turki harus dilegalisasi notaris',
              '✔ Penulisan nama harus sama persis di semua dokumen',
              '✔ Surat keterangan belum menikah wajib',
              '✔ Surat kesehatan biasanya diambil di Turki (dokter keluarga/klinik yang ditunjuk)',
              '⏱ Perkiraan durasi',
              'Surat izin menikah dari KBRI: 1–5 hari',
              'Terjemahan & notaris: 1–3 hari',
              'Janji nikah: 1–14 hari (tergantung kepadatan kota)',
              '⚠️ Kesalahan umum yang membuat proses jadi sulit',
              '❌ Tidak melakukan apostille',
              '❌ Penulisan nama berbeda',
              '❌ Surat keterangan belum menikah tidak lengkap',
              '❌ Dokumen sudah terlalu lama/expired',
              '❌ Tidak menggunakan penerjemah tersumpah',
            ],
          },
        ],
        action: 'Tanyakan checklist terbaru via WhatsApp',
        whatsappMessage:
          'Halo, bisa dibagikan checklist dokumen terbaru dan langkah pendaftaran untuk pernikahan resmi di Turki (WN Turki + WNI)? Kota/kecamatan: …',
      },
    },
    plan: {
      title: 'Sampaikan rencana pernikahan Anda kepada kami',
      subtitle:
        'Isi kolom di bawah; kami akan segera menghubungi Anda dengan respons yang sesuai dengan situasi Anda.',
      successTitle: 'Permintaan Anda berhasil dikirim!',
      successText: 'Terima kasih telah mengisi form. Kami akan menghubungi Anda dalam 24 jam.',
      why: {
        title: 'Kenapa perencanaan itu penting?',
        text:
          'Dalam pernikahan lintas negara, masalah terbesar adalah tidak mengelola proses dengan benar. Bahkan kesalahan kecil seperti salah satu huruf saja dapat menyebabkan kerugian besar—baik dari sisi biaya maupun waktu. Karena itu, merencanakan proses sejak awal dengan benar adalah syarat utama. Layanan bimbingan kami membantu Anda merencanakan dengan cara yang paling mudah dan paling tepat, sehingga proses pernikahan dapat selesai dengan lancar. Agar kami bisa merencanakan seluruh proses dengan benar untuk Anda, kami membutuhkan informasi yang Anda berikan. Karena itu, meluangkan beberapa menit untuk mengisi formulir 15 pertanyaan yang kami siapkan akan sangat bermanfaat bagi Anda.',
      },
      quiz: {
        start: 'Mulai perencanaan',
      },
      form: {
        sections: {
          basicInfo: {
            title: '1. Informasi dasar Anda',
            labels: {
              name: 'Nama lengkap',
              phone: 'Nomor kontak',
              city: 'Kota',
              age: 'Usia',
            },
            placeholders: {
              name: 'Nama lengkap Anda',
              phone: '+90 555 034 3852',
              city: 'Kota Anda',
              age: 'Usia Anda',
            },
          },
          privacyNote:
            'Catatan privasi: Detail pengajuan Anda diproses untuk pencocokan dan keamanan; profil Anda tidak ditampilkan secara publik. Jika ada pelanggaran aturan, Anda dapat menghubungi dukungan dengan bukti (mis. screenshot).',
        },
        services: {
          title: '2. Layanan yang Anda butuhkan',
          hint:
            'Anda dapat memilih lebih dari satu opsi. Jika Anda belum yakin, Anda bisa membiarkannya kosong.',
          options: {
            consulting: 'Konsultasi',
            paperworkTracking: 'Pelacakan dokumen',
            familyCommunication: 'Komunikasi antar keluarga',
            transport: 'Transportasi',
            interpretation: 'Penerjemahan',
            ongoingGuidance: 'Pendampingan berkelanjutan sepanjang proses',
            accommodation: 'Akomodasi',
            honeymoon: 'Bulan madu',
          },
        },
        schedule: {
          weddingDateLabel: 'Tanggal pernikahan yang direncanakan',
          privacyConsent:
            'Saya telah membaca dan menyetujui <privacyLink>Kebijakan Privasi</privacyLink>.',
          privacyNote:
            'Informasi yang Anda bagikan akan digunakan hanya untuk perencanaan pernikahan dan tidak akan dibagikan kepada pihak ketiga.',
        },
        actions: {
          submit: 'Minta penawaran untuk rencana pernikahan saya',
          submitting: 'Mengirim...',
        },
        errors: {
          privacyConsent: 'Anda harus mengonfirmasi bahwa Anda telah membaca dan menyetujui Kebijakan Privasi.',
          sendFailed: 'Terjadi kesalahan saat mengirim permintaan Anda. Silakan coba lagi.',
        },
        note:
          'Jika Anda tidak ingin mengisi form, Anda dapat menghubungi kami langsung melalui tombol WhatsApp di bagian bawah halaman.',
      },
    },
    documents: {
      title: 'Dokumen yang diperlukan untuk pernikahan warga asing–Indonesia di Indonesia',
      subtitle:
        'Judul-judul di bawah ini hanya informasi umum. Kami akan memeriksa daftar yang tepat dan terbaru sesuai situasi Anda bersama-sama.',
      foreignSpouse: {
        title: 'Dokumen untuk pasangan asing',
        intro: 'Secara umum, ini adalah dokumen utama yang diminta dari pasangan asing:',
        items: [
          'Paspor yang masih berlaku (minimal 6 bulan masa berlaku)',
          'Visa masuk Indonesia atau ITAS/ITAP',
          'Surat keterangan tidak ada halangan menikah (dari Kedutaan Besar Turki di Indonesia)',
          'Akte kelahiran (multibahasa)',
          'Surat keterangan belum menikah (diterjemahkan ke Bahasa Indonesia dan apostille)',
          'Jika ada: putusan cerai atau akta kematian (diterjemahkan dan dilegalisasi)',
          'Bukti domisili',
          'Pas foto diambil dalam 6 bulan terakhir',
        ],
      },
      indonesianSpouse: {
        title: 'Dokumen untuk pasangan WNI',
        intro: 'Untuk pasangan WNI, dokumen berikut umumnya diperlukan:',
        items: [
          'KTP (kartu tanda penduduk)',
          'Akte Lahir',
          'Kartu Keluarga',
          'Surat keterangan status perkawinan (lajang / cerai / duda/janda)',
          'Formulir N1–N10 dan persetujuan RW/RT',
          'Pas foto diambil dalam 6 bulan terakhir',
        ],
      },
      extras: {
        title: 'Dokumen tambahan yang mungkin diminta',
        intro:
          'Tidak wajib untuk setiap kasus, namun di beberapa kota dokumen berikut juga dapat diminta:',
        items: ['Bukti penghasilan atau laporan keuangan', 'SKCK / catatan kepolisian', 'Surat keterangan sehat', 'Ijazah'],
      },
      importantNotes: {
        title: '📌 Catatan penting',
        items: [
          'Untuk banyak dokumen, apostille dan terjemahan Bahasa Indonesia bersifat wajib. (Periksa dengan KUA tempat pasangan Anda terdaftar)',
          'Satu kesalahan ketik kecil, dokumen yang kurang, atau urutan proses yang salah dapat berdampak buruk pada seluruh pengajuan.',
          'Dokumen yang diperlukan dan alur kerja dapat berbeda tergantung kota, instansi, dan petugas.',
        ],
      },
      personalDifferences: {
        title: '⚠️ Perbedaan kondisi pribadi',
        p1:
          'Judul-judul ini menjelaskan kerangka umum; faktor seperti pernah menikah, memiliki anak, atau kewarganegaraan dapat mengubah daftar dokumen Anda.',
        p2:
          'Kami memverifikasi daftar yang tepat sesuai situasi Anda dan membimbing Anda langkah demi langkah agar semuanya siap dengan benar.',
      },
      faqTitle: 'Pertanyaan yang sering diajukan',
      whatsappCta: {
        title: 'Masih ragu soal dokumen?',
        description:
          'Kirim pesan; berdasarkan kota, kewarganegaraan, dan situasi Anda, mari kita perjelas daftar dokumen terbaru bersama.',
        action: 'Tanyakan daftar dokumen saya di WhatsApp',
        message: 'Halo, saya ingin mendapatkan informasi tentang proses pernikahan dan dokumen yang diperlukan di Indonesia.',
      },
    },
    faq: {
      items: [
        {
          q: 'Rata-rata berapa lama proses pernikahan di Indonesia?',
          a: 'Tergantung kesiapan dokumen, kota tempat mengajukan, dan beban kerja instansi; perencanaan dan prosedur resmi biasanya memakan waktu dari beberapa minggu hingga beberapa bulan.',
        },
        {
          q: 'Apa langkah pertama untuk menikah di Indonesia?',
          a: 'Langkah pertama adalah memastikan dokumen apa saja yang dibutuhkan untuk kasus Anda. Setelah itu, Anda bisa menghubungi kami via WhatsApp untuk menyusun checklist terbaru berdasarkan kota dan situasi Anda.',
        },
        {
          q: 'Apakah Anda mengelola seluruh proses dari awal sampai akhir?',
          a: 'Sesuai kebutuhan Anda, kami bisa membantu hanya pada langkah tertentu, atau mengorganisir seluruh dokumen, janji temu, dan prosedur resmi secara menyeluruh.',
        },
        {
          q: 'Bisakah saya mengurus prosesnya sendiri?',
          a: 'Bisa—namun penting untuk memahami setiap langkah dan dokumen yang diminta secara rinci. Kesalahan kecil, pengajuan yang keliru, atau dokumen yang kurang dapat menyebabkan kerugian waktu dan biaya yang signifikan, serta menambah beban emosional.',
        },
      ],
    },
    bottomCta: {
      title: 'Mari rencanakan pernikahan Anda bersama',
      description: 'Isi form di bawah atau hubungi kami via WhatsApp sekarang juga.',
      action: 'Tanyakan sekarang di WhatsApp',
      message: 'Halo, saya ingin mendapatkan informasi tentang paket pernikahan.',
      note:
        'Kami membalas dalam Bahasa Turki; jika diperlukan, kami juga membantu Anda berkomunikasi dengan keluarga pasangan dalam Bahasa Indonesia.',
    },
  },

  panel: {
    membership: {
      title: "Syarat keanggotaan",
      lead: "Syarat keanggotaan:",
      freeActiveTermsTitle: "Syarat aktivasi gratis",
    },
  },

  pwa: {
    install: {
      title: 'Pasang aplikasi',
      lead:
        'Tambahkan ke layar utama agar lebih cepat dibuka. Setelah Anda mendaftar dan mulai melihat profil lain, kami sarankan mengaktifkan notifikasi agar tidak ketinggalan pesan dan match.',
      installButton: 'Pasang aplikasi',
      installed: 'Terpasang',
      installedHint: 'Aplikasi sudah ada di layar utama. Setelah masuk ke dalam aplikasi, Anda bisa mengaktifkan notifikasi kapan pun Anda mau.',
      installAvailableHint: 'Browser Anda mendukung instalasi. Klik untuk memasang.',
      installNotAvailableHint:
        'Jika tombol install tidak muncul: buka menu browser lalu pilih “Tambah ke Layar Utama / Pasang aplikasi” (di beberapa perangkat muncul setelah kunjungan pertama via HTTPS). Jika tautan dibuka di browser dalam aplikasi (WhatsApp/Instagram), pilih “Buka di Safari/Chrome” lalu coba lagi.',
      actions: {
        waitingForPrompt: 'Opsi pemasangan sedang disiapkan…',
        openInBrowser: 'Buka di browser lalu pasang',
        copyLink: 'Salin tautan',
        inAppBrowserTitle: 'Halaman ini tampaknya dibuka di browser dalam aplikasi',
        inAppBrowserBody: 'Prompt pemasangan biasanya tidak muncul di WhatsApp, Instagram, dan browser dalam aplikasi sejenis. Buka halaman ini di Safari/Chrome terlebih dahulu, lalu pasang dari sana.',
        copiedIos: 'Tautan disalin. Buka di Safari lalu lanjutkan dengan Bagikan → “Tambah ke Layar Utama”.',
        copiedAndroid: 'Tautan disalin. Buka di Chrome lalu pilih “Tambahkan ke layar utama” atau “Instal aplikasi” dari menu.',
        copiedDesktop: 'Tautan disalin. Buka di browser desktop Anda lalu gunakan opsi “Instal aplikasi” dari menu.',
        copyFailed: 'Tautan tidak dapat disalin. Buka halaman ini secara manual di Chrome/Safari.',
      },
      ios: {
        title: 'Untuk iPhone/iPad (Safari)',
        step1: 'Buka situs di Safari.',
        step2: 'Ketuk Bagikan (kotak + panah).',
        matchmakingHub: 'Cari calon pasangan',
        matchmakingHint: 'Belum punya calon pasangan? Bergabunglah dengan sistem pencocokan kami dan telusuri kandidat dari sini.',
        step3: 'Pilih “Tambah ke Layar Utama” lalu konfirmasi.',
      },
      preview: {
        matches: {
          title: 'Profil Saya: Kecocokan',
          body: 'Kecocokan, permintaan, dan percakapan dikelola dari layar Profil Saya.',
        },
        pool: {
          title: 'Pool: Kandidat',
          body: 'Anda dapat menelusuri kandidat dan mengirim permintaan atau suka.',
        },
        request: {
          title: 'Kirim permintaan kecocokan',
          body: 'Tombol ini hanya pratinjau. Untuk melakukan aksi nyata, Anda harus mendaftar dan mengisi formulir terlebih dahulu.',
        },
      },
      notifications: {
        title: 'Notifikasi',
        lead: 'Jika Anda mengaktifkan notifikasi (jika didukung), kami dapat menampilkan notifikasi untuk:',
        button: 'Aktifkan notifikasi',
        testButton: 'Kirim notifikasi uji',
        testHint: 'Aktifkan notifikasi terlebih dulu (registrasi token push).',
        testTitle: 'Notifikasi uji',
        testBody: 'Ini adalah notifikasi uji.',
        testSent: 'Notifikasi uji dikirim (mungkin butuh beberapa detik).',
        testFailed: 'Notifikasi uji gagal dikirim. (Token tidak ada atau konfigurasi belum lengkap.)',
        alreadyEnabled: 'Izin notifikasi sudah aktif.',
        enabled: 'Notifikasi diaktifkan.',
        enabledButNotSaved:
          'Izin notifikasi aktif, tetapi token tidak dapat disimpan ke server. Silakan login lalu coba lagi (atau muat ulang halaman).',
        denied:
          'Browser belum memberikan izin notifikasi saat ini.\n1) Jika prompt izin muncul, tekan “Izinkan”.\n2) Jika sebelumnya sudah ditolak, buka ikon gembok di bilah alamat atau pengaturan situs browser lalu ubah Notifications menjadi Allow untuk situs ini.\n3) Setelah itu tekan lagi tombol “Aktifkan notifikasi”.',
        notSupported: 'Notifikasi tidak didukung di perangkat/browser ini.',
        notSecureContext: 'Notifikasi memerlukan HTTPS. Silakan buka situs melalui https.',
        serviceWorkerNotReady: 'Sistem notifikasi belum siap. Muat ulang halaman lalu coba lagi.',
        timeout: 'Izin notifikasi atau langkah pemasangan tidak selesai tepat waktu. Periksa prompt izin di browser lalu coba lagi.',
        missingSetup: 'Konfigurasi push belum lengkap: kunci VAPID belum disetel.',
        invalidVapidKey:
          'Konfigurasi push tidak valid: kunci VAPID tidak benar. Salin Public key yang benar dari Firebase Console.',
        notLoggedIn: 'Anda harus login untuk mengaktifkan notifikasi.',
        testNoTokens: 'Token notifikasi tidak ditemukan. Tekan “Aktifkan notifikasi” lalu coba lagi.',
        error: 'Notifikasi tidak dapat diaktifkan. Silakan coba lagi.',
        note:
          'Ini hanya saran: daftar dan lihat-lihat profil dulu, lalu tekan Aktifkan notifikasi agar Anda tidak ketinggalan pesan dan match. Di browser yang mendukung, tombol ini akan membuka prompt izin secara otomatis.',
        items: {
          newMessage: 'Pesan baru pada match aktif',
          newLike: 'Like / interaksi',
          profileAccess: 'Permintaan/izin melihat profil',
          shortMessage: 'Pesan singkat / pesan pertama',
          activeMatch: 'Permintaan/persetujuan match aktif',
          poolCandidates: 'Kandidat baru di pool',
        },
        photos: {
          showMine: 'Tampilkan foto saya',
          hideMine: 'Sembunyikan foto saya',
          reciprocityHint: 'Catatan: Jika Anda menyembunyikan foto Anda, Anda juga tidak bisa melihat foto mereka (resiprositas).',
          reciprocityConfirm:
            'Jika Anda menyembunyikan foto Anda, Anda juga tidak bisa melihat foto orang ini (resiprositas). Lanjutkan?',
          reciprocityBlocked: 'Foto terkunci karena Anda menyembunyikan foto Anda sendiri.',
        },
        photoAccess: {
          needOtherPermission: 'Untuk melihat foto, Anda perlu izin dari pihak lain.',
          request: 'Minta izin foto',
          status: {
            pending: 'Permintaan terkirim (menunggu)',
            approved: 'Permintaan disetujui',
            granted: 'Izin sudah diberikan',
            unknown: 'Status saat ini: {{status}}',
          },
          actions: {
            requested: 'Permintaan terkirim',
            granted: 'Izin diberikan',
          },
        },
      },
      tutorial: {
        eyebrow: 'Persiapan aplikasi',
        badge: 'Alur tutorial yang dibuka dari tautan',
        title: 'Pasang aplikasi, lalu daftar dan lihat dulu',
        body: 'Halaman ini disiapkan agar Anda bisa menambahkan aplikasi ke layar utama dan mulai lebih cepat. Buka aplikasi, buat akun, selesaikan formulir singkat, lalu lihat pengalaman aplikasinya terlebih dahulu. Kami menyarankan Anda mengaktifkan notifikasi nanti dari dalam aplikasi, setelah Anda mulai melihat profil lain.',
        backHome: 'Beranda',
        stepLabel: 'Langkah {{step}}',
        note: 'Setelah pemasangan, aplikasi akan muncul di layar utama. Anda bisa daftar dan melihat-lihat dulu; saran notifikasi akan muncul nanti di dalam aplikasi pada waktu yang lebih tepat.',
        installEyebrow: 'Langkah 1',
        notificationsEyebrow: 'Langkah 2',
        readyEyebrow: 'Langkah 2',
        readyTitle: 'Pemasangan selesai, sekarang buka aplikasi',
        readyBody: 'Sekarang Anda bisa masuk ke aplikasi dan mendaftar. Jika Anda pengguna baru, alur pembukaan akan mengarahkan Anda ke formulir pendaftaran. Setelah mulai melihat profil lain, Anda bisa mengaktifkan notifikasi dari dalam aplikasi.',
        readyBodyWeb: 'Bahkan jika aplikasi tidak bisa dipasang di perangkat ini, Anda tetap bisa lanjut lewat web. Daftar dan selesaikan pendaftaran Anda lebih dulu, lalu coba aplikasi dan notifikasi lagi nanti saat sudah memungkinkan.',
        readyBodyNoPush: 'Sekarang Anda bisa masuk ke aplikasi dan mendaftar. Notifikasi bisa diaktifkan nanti dari alur aplikasi atau pengaturan browser.',
        openApp: 'Buka aplikasi',
        continueOnWeb: 'Lanjutkan lewat halaman web',
        continueWithoutNotifications: 'Lanjutkan, notifikasi diatur nanti',
        standaloneHint: 'Aplikasi tampaknya sudah terbuka dalam mode terpasang. Lanjutkan untuk masuk langsung ke alur masuk aplikasi.',
        browserHint: 'Di beberapa perangkat tombol ini masih bisa membuka tab browser. Jika begitu, ketuk ikon Uniqah di layar utama dan lanjutkan dari sana.',
        linkBody: 'Satu tautan yang bisa dikirim ke pengguna: pemasangan dulu, lalu notifikasi, lalu masuk aplikasi.',
        linkCta: 'Buka alur pemasangan',
        steps: {
          install: {
            title: 'Pasang aplikasi',
            body: 'Tambahkan aplikasi ke ponsel lebih dulu agar langkah berikutnya terasa seperti alur aplikasi sungguhan.',
          },
          open: {
            title: 'Masuk ke aplikasi',
            body: 'Buka aplikasi dan daftar dengan Google atau email. Saran notifikasi akan muncul nanti di dalam aplikasi, saat momennya lebih tepat.',
          },
        },
      },
    },
  },

  memberFeed: {
    badge: {
      newUser: 'Baru',
    },
    toast: {
      title: 'Live',
      closeAria: 'Tutup',
      generic: 'Ada aktivitas baru.',
      signupAnonymous: 'Seseorang baru saja bergabung.',
      signupKnown: '{{label}} baru saja bergabung.',
      profileCompletedAnonymous: 'Pengguna baru menyelesaikan profilnya.',
      profileCompletedKnown: '{{label}} menyelesaikan profilnya.',
    },
  },
};

export default deepMerge(en, overrides);

/*
export default {
      previewGate: {
        title: 'Anda harus mendaftar dulu',
        body: 'Untuk melakukan ini, Anda harus mendaftar dan mengisi formulir matchmaking terlebih dahulu.',
        signup: 'Daftar',
        dismiss: 'Lewati',
      },
    pwa: {
      install: {
        title: 'Pasang aplikasi',
        lead:
          'Tambahkan ke layar utama agar lebih cepat dibuka. Aktifkan notifikasi untuk mendapat kabar instan tentang pesan, like, dan permintaan match.',
        installButton: 'Pasang aplikasi',
        installed: 'Terpasang',
        installedHint: 'Aplikasi sudah ada di layar utama. Anda juga bisa mengaktifkan notifikasi.',
        installAvailableHint: 'Browser Anda mendukung instalasi. Klik untuk memasang.',
        installNotAvailableHint:
          'Jika tombol install tidak muncul: buka menu browser lalu pilih “Tambah ke Layar Utama / Pasang aplikasi” (di beberapa perangkat muncul setelah kunjungan pertama via HTTPS).',
        actions: {
          waitingForPrompt: 'Opsi pemasangan sedang disiapkan…',
          openInBrowser: 'Buka di browser lalu pasang',
          copyLink: 'Salin tautan',
          inAppBrowserTitle: 'Halaman ini tampaknya dibuka di browser dalam aplikasi',
          inAppBrowserBody: 'Prompt pemasangan biasanya tidak muncul di WhatsApp, Instagram, dan browser dalam aplikasi sejenis. Buka halaman ini di Safari/Chrome terlebih dahulu, lalu pasang dari sana.',
          copiedIos: 'Tautan disalin. Buka di Safari lalu lanjutkan dengan Bagikan → “Tambah ke Layar Utama”.',
          copiedAndroid: 'Tautan disalin. Buka di Chrome lalu pilih “Tambahkan ke layar utama” atau “Instal aplikasi” dari menu.',
          copiedDesktop: 'Tautan disalin. Buka di browser desktop Anda lalu gunakan opsi “Instal aplikasi” dari menu.',
          copyFailed: 'Tautan tidak dapat disalin. Buka halaman ini secara manual di Chrome/Safari.',
        },
        ios: {
          title: 'Untuk iPhone/iPad (Safari)',
          step1: 'Buka situs di Safari.',
          step2: 'Ketuk Bagikan (kotak + panah).',
          step3: 'Pilih “Tambah ke Layar Utama” lalu konfirmasi.',
        },
        notifications: {
          title: 'Notifikasi',
          lead: 'Jika Anda mengaktifkan notifikasi (jika didukung), kami dapat memberi notifikasi untuk:',
          button: 'Aktifkan notifikasi',
          alreadyEnabled: 'Izin notifikasi sudah aktif.',
          enabled: 'Notifikasi diaktifkan.',
          denied: 'Izin notifikasi tampaknya sedang mati. Anda bisa mengaktifkannya untuk situs ini dari ikon gembok di kolom alamat atau dari pengaturan browser. Jika mau, Anda juga bisa lanjut dulu tanpa notifikasi lalu menyalakannya nanti.',
          notSupported: 'Notifikasi tidak didukung di browser/perangkat ini.',
          note:
            'Catatan: Di beberapa perangkat Anda harus menambahkan aplikasi ke layar utama terlebih dahulu. Push saat aplikasi tertutup mungkin butuh pengaturan tambahan.',
          items: {
            newMessage: 'Pesan baru pada match aktif',
            newLike: 'Like / interaksi',
            profileAccess: 'Permintaan/izin melihat profil',
            shortMessage: 'Pesan singkat / pesan pertama',
            activeMatch: 'Permintaan/persetujuan match aktif',
            poolCandidates: 'Kandidat baru di pool',
          },
        },
      },
    },
  navigation: {
    siteTitle: "Uniqah",
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
    matchmaking: "Pencocokan",
    documents: "Dokumen",
    youtube: "YouTube",
    contact: "Kontak",
  },

  ui: {
    lightbox: {
      close: 'Tutup',
      prev: 'Sebelumnya',
      next: 'Berikutnya',
      imageAlt: 'Gambar {{index}}',
    },
  },

  matchmakingHub: {
    metaTitle: 'Pencocokan',
    badge: 'Proses privat & dimoderasi',
    title: 'Sistem pencocokan untuk pernikahan',
    description:
      'Sistem ini masih baru—mohon bersabar. Pencocokan biasanya datang dalam 1–3 hari. Instal aplikasinya dan aktifkan notifikasi agar tidak ketinggalan pembaruan.',
    preview: {
      title: "Setelah daftar, apa yang akan kamu lihat di 'Profil Saya'?",
      subtitle:
        'Kartu contoh ini bukan data pengguna nyata; hanya untuk memperlihatkan alur sistem setelah registrasi secara singkat.',
      cta: 'Daftar gratis',
      cards: {
        matches: {
          title: 'Kecocokan & status',
          body: 'Minat bersama, aktivasi, dan langkah komunikasi berjalan di sini—setiap langkah terkontrol.',
          mockTitle: 'Contoh',
          mockItem1: 'Kecocokan yang disarankan',
          mockItem1Sub: 'Status: minat bersama (contoh)',
          mockTag1: 'Lihat',
          mockItem2: 'Kecocokan aktif',
          mockItem2Sub: 'Status: chat terbuka (contoh)',
          mockTag2: 'Pesan',
        },
        pool: {
          title: 'Pool (kandidat)',
          body: 'Lihat kandidat yang sesuai, kirim permintaan, atau lewati. Jika disetujui, kartu kecocokan terbuka.',
          mockTitle: 'Contoh',
          mockItem1: 'Kartu profil kandidat (contoh)',
          mockItem1Sub: 'Usia • Kota • Ringkasan singkat (contoh)',
          mockCta: 'Kirim permintaan',
        },
        chat: {
          title: 'Chat lebih aman',
          body: 'Pesan difilter; selama pencocokan aktif, kedua pihak dapat berbicara di jendela privat dengan dukungan terjemahan dan tanpa terlalu khawatir soal bahasa.',
          mockTitle: 'Contoh',
          mockSystem: 'Sistem: Komunikasi lebih aman aktif',
          mockMsg1: 'Halo, apa kabar? (contoh)',
          mockMsg2: 'Chat dulu, lalu langkah persetujuan (contoh)',
          mockHint: 'Catatan: selama pencocokan aktif berlanjut, Anda dapat berbicara tanpa batas di jendela privat; berbagi kontak terbuka setelah 48 jam + persetujuan kedua pihak.',
        },
      },
    },
    actions: {
      apply: 'Ajukan pencocokan',
      goPanel: 'Profil saya',
      tour: 'Lihat tur panel',
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
    baseTitle: "Uniqah | PT MoonStar Global Indonesia",
            consentsRequired: 'Untuk mengirim, Anda harus menyetujui kotak persetujuan (18+, Kebijakan Privasi, Syarat & Ketentuan, persetujuan foto).',
      "Uniqah (PT MoonStar Global Indonesia) menyediakan layanan matchmaking dan panduan proses pernikahan di Indonesia.",
    pages: {
      home: { title: "Uniqah | PT MoonStar Global Indonesia" },
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
      badge: 'Pendampingan untuk proses pernikahan',
      title: 'Kami mendampingi persiapan pernikahan Anda',
      description:
        'Dokumen, prosedur resmi, komunikasi antar keluarga, dan langkah organisasi utama kami rencanakan bersama—mengubahnya menjadi perjalanan yang menenangkan, jauh dari pertanyaan yang mengganggu.',
      actions: {
        openForm: "Buka Form Rencana Pernikahan",
        matchmakingHub: "Pencocokan",
        matchmakingApply: 'Ajukan pencocokan',
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
      quickChatMessage: 'Halo, saya ingin mendapatkan informasi tentang persiapan pernikahan dan pendampingan.',
    },
    stickyBackToProfile: {
      label: 'Kembali ke profil saya',
      aria: 'Kembali ke halaman profil',
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
        "Uniqah (PT MoonStar Global Indonesia) menyediakan layanan matchmaking dan panduan proses pernikahan di Indonesia.",
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
      home: "Halo, saya ingin mendapatkan informasi tentang Uniqah.",
      explore: "Halo, saya ingin mendapatkan informasi tentang destinasi di Indonesia.",
      travel: "Halo, saya ingin mendapatkan informasi tentang rencana liburan ke Indonesia.",
      wedding: 'Halo, saya ingin mendapatkan informasi tentang proses pernikahan.',
      youtube: "Halo, saya ingin mendapatkan informasi tentang video YouTube Anda.",
      contact: "Halo, saya ingin mendapatkan informasi tentang cara menghubungi Anda.",
      tours: "Halo, saya ingin mendapatkan informasi tentang paket tur Anda.",
      documents: "Halo, saya ingin mendapatkan informasi tentang dokumen Anda.",
    },
  },

  home: {
    hero: {
      badgeCompany: 'PT MoonStar Global Indonesia',
      badgeSocial: "kanal sosial Uniqah",
      title: "Uniqah",
      subtitle: 'Matchmaking • Panduan pernikahan • Komunikasi aman di aplikasi',
      description:
        'Uniqah adalah sistem matchmaking berorientasi pernikahan. Kami menargetkan proses yang aman, saling menghormati, dan transparan dengan langkah-langkah yang jelas. Jika diperlukan, kami juga memberi dukungan seperti penerjemahan dan panduan proses.',
      note: 'Berorientasi pernikahan dengan privasi dan keamanan sebagai prioritas.',
      ctaTours: "Mulai ajukan",
      ctaBrochures: "Lihat dokumen",
      ctaTrust: "Kepercayaan & Legal",
      ctaHow: "Cara kerja",
    },
    trust: {
      items: [
        {
          title: "Proses jelas",
          description: "Pra-registrasi → penawaran tertulis → langkah kontrak/pembayaran.",
        },
        {
          title: 'Dukungan cepat',
          description: 'Dukungan via WhatsApp; bantuan multi-bahasa bila diperlukan.',
        },
        {
          title: "Struktur legal",
          description: 'Uniqah adalah merek di bawah PT MoonStar Global Indonesia.',
        },
      ],
    },
    services: {
      title: "Apa yang kami lakukan untuk Anda?",
      cards: {
        matchmaking: {
          title: "Matchmaking Uniqah",
          description:
            "Pengalaman matchmaking yang terstruktur untuk niat serius: pengajuan, kelayakan, alur profil, chat, dan keputusan bersama.",
        },
        communityContent: {
          title: "Konten komunitas",
          aria: "Konten komunitas",
          description:
            "Kami membagikan panduan dan konten bermanfaat tentang hubungan, komunikasi, dan alur proses untuk komunitas Uniqah.",
        },
        wedding: {
          title: 'Panduan pernikahan',
          description:
            'Anda sudah memiliki calon pasangan yang sudah Anda kenal dan sudah memutuskan untuk menikah, tetapi Anda belum paham bagaimana cara menikah dan bagaimana proses resmi berjalan—dan Anda butuh bantuan atau pendampingan. Klik di sini; kami bantu Anda dalam segala hal, termasuk semua proses dan dokumen, agar Anda bisa mewujudkan pernikahan impian dengan cara yang paling nyaman dan mudah.',
        },
        youtube: {
          title: "Video YouTube",
          description:
            "Kenali pendekatan kami lewat video tentang kehidupan di Indonesia, budaya, perjalanan, dan proses pernikahan.",
        },
        dameturk: {
          title: "DaMeTurk (sub-merek)",
          aria: "DaMeTurk - Es krim Turki asli",
          description:
            "Di bawah PT MoonStar Global Indonesia, kami menjalankan DaMeTurk untuk produksi dan penjualan es krim Turki asli di Indonesia. Kunjungi dameturk.com untuk detail.",
        },
      },
    },

    howItWorks: {
      title: "Bagaimana prosesnya?",
      steps: [
        {
          title: "1) Ajukan",
          description: "Setujui aturan dan selesaikan pengajuan Anda.",
        },
        {
          title: "2) Profil & verifikasi",
          description: "Buat profil Anda dan jelaskan foto serta detailnya.",
        },
        {
          title: "3) Pencocokan & chat",
          description: "Chat dengan match yang sesuai dan putuskan bersama.",
        },
      ],
      ctaTours: "Buka Uniqah",
      ctaDocuments: "Dokumen",
    },

    features: {
      title: "Mengapa lebih mudah bersama kami?",
      items: [
        {
          title: "Keamanan dan alur proses",
          description:
            "Tujuan kami bukan pencocokan acak—melainkan lingkungan yang aman dan sopan dengan alur bertahap yang jelas.",
        },
        {
          title: "Komunikasi jelas",
          description:
            "Dengan dukungan bahasa Turki dan Indonesia, kami membantu kedua pihak menyampaikan maksud dengan benar dan mengurangi salah paham.",
        },
        {
          title: "Dukungan nyata di lapangan",
          description:
            "Bila diperlukan, kami memberi dukungan praktis di lapangan untuk matchmaking dan panduan pernikahan.",
        },
      ],
    },

    faq: {
      title: 'FAQ singkat',
      items: [
        {
          q: 'Apakah pengajuan gratis?',
          a: 'Memulai pengajuan dan mengisi info dasar gratis. Saat proses berlanjut (verifikasi/keanggotaan/dukungan khusus), detail dan biaya dijelaskan bertahap.',
        },
        {
          q: 'Bagaimana menjaga keamanannya?',
          a: 'Tujuan kami bukan pencocokan acak. Kami memakai aturan, kontrol kelayakan dasar, dan alur bertahap untuk lingkungan yang lebih aman dan sopan.',
        },
        {
          q: 'Berapa lama prosesnya?',
          a: 'Tergantung orangnya. Berdasarkan kelengkapan profil, verifikasi, dan kecepatan keputusan bersama, bisa beberapa hari hingga beberapa minggu.',
        },
      ],
    },

    cta: {
      eyebrow: "Silakan bertanya",
      title: "Mari kita jelaskan semuanya tentang Uniqah dan proses di Indonesia",
      description:
        "Alur matchmaking atau panduan pernikahan… tanyakan apa pun dan kita buat prosesnya lebih sederhana dan jelas bersama.",
      ctaContact: "Buka formulir kontak",
      ctaWhatsapp: "Tanya via WhatsApp",
    },
  },

  about: {
    hero: {
      title: "Tentang Kami",
      subtitle:
        "Uniqah adalah sistem matchmaking dan panduan proses pernikahan yang berfokus pada Indonesia.",
    },
    brand: {
      title: "Struktur merek",
      p1:
        "Situs ini adalah etalase dan titik kontak layanan Uniqah yang kami jalankan di bawah PT MoonStar Global Indonesia.",
      p2:
        "MoonStar Global Indonesia dibangun oleh wirausahawan Turki yang tinggal di Indonesia untuk membangun jembatan komunikasi lintas budaya dan menyediakan dukungan praktis di lapangan.",
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
        "Kami membagikan panduan dan konten melalui Uniqah.",
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
    googleSignupCta: 'Daftar dengan Google',
    emailLoginCta: 'Masuk dengan email/kata sandi',
    emailSignupCta: 'Daftar dengan email/kata sandi',
    appleCta: 'Lanjutkan dengan Apple',
    appleSignupCta: 'Daftar dengan Apple',
    redirecting: 'Mengalihkan ke login…',
    infos: {
      startingGoogle: 'Membuka login Google…',
      inAppBrowserGoogleRedirect: 'Membuka login Google… Langkah ini bisa memerlukan beberapa detik di browser dalam aplikasi.',
      googleInAppHelp:
        'Login Google kadang macet di browser dalam aplikasi. Anda bisa lanjut dengan email, atau pilih “Buka di browser” lalu coba lagi.',
      openingExternalBrowser: 'Membuka browser… Lanjutkan dengan Google di tab atau browser baru.',
    },
    redirectScreen: {
      title: 'Mengalihkan…',
      body: 'Membuka halaman Profil Saya. Jika layar ini lama, Anda bisa lanjut lewat tombol di bawah.',
      goProfile: 'Ke Profil Saya',
      refresh: 'Muat ulang',
    },
    tour: {
      eyebrow: 'Tur kepercayaan',
      teaserTitle: 'Mengapa saya perlu mendaftar di Uniqah.com sebelum membuat akun?',
      teaserBody: 'Jika mau, ikuti tur singkat kami. Di sini kami menjelaskan mengapa orang memilih kami, bahwa sistem saat ini sepenuhnya gratis, bagaimana alur pencocokan aktif bekerja, dan bagaimana chat dengan dukungan terjemahan tetap terkontrol.',
      durationLabel: 'Tur singkat',
      durationValue: 'Kurang dari 1 menit',
      durationBody: 'Setelah setiap kartu, Anda bisa menghentikan tur dan langsung masuk ke pendaftaran atau login.',
      inviteLead: 'Daripada membiarkan penjelasan kepercayaan menumpuk di halaman, kami menyajikannya sebagai alur opsional bagi pengguna yang membutuhkan keyakinan lebih.',
      open: 'Ikuti tur',
      close: 'Tutup tur',
      back: 'Kembali',
      next: 'Lanjut',
      finish: 'Lanjut daftar',
      signupNow: 'Daftar',
      loginNow: 'Masuk',
      progress: 'Langkah {{current}} / {{total}}',
      flowTitle: 'Alur',
      cardEyebrow: 'Mengapa orang memilih kami',
      previewStep: 'Langkah {{number}}',
      exitHint: 'Tur ini tidak wajib. Anda bisa menutupnya kapan saja lalu langsung lanjut dengan Google atau email/kata sandi.',
      steps: [
        {
          eyebrow: 'Pendiri',
          title: 'Uniqah dibangun oleh pasangan Turki-Indonesia nyata untuk orang yang serius menuju pernikahan',
          body: 'Website ini adalah salah satu lini usaha PT Moonstar Global Indonesia milik pasangan Turki-Indonesia, dan dibuat khusus untuk melayani orang-orang yang benar-benar mencari pernikahan serius.',
          points: [
            'Ini bukan situs listing acak dengan pemilik yang tidak jelas.',
            'Tujuannya bukan obrolan santai, tetapi mempertemukan orang-orang serius di ruang yang lebih aman.',
            'Jika Anda mau, nanti kita juga bisa menambahkan foto pasangan pendiri pada langkah ini.'
          ]
        },
        {
          eyebrow: 'Proses terkontrol',
          title: 'Kalau saya sudah bertemu seseorang, bagaimana saya bisa percaya?',
          body: 'Anda tidak harus membangun rasa percaya sendirian setelah match; jika Anda mau, kami bisa membantu proses itu secara aktif.',
          points: [
            'Sebelum mengambil keputusan menikah, jika Anda mau, kami bisa meneliti semua hal tentang orang yang Anda kenal itu.',
            'Jika Anda meminta, kami bisa menghubungi orang tersebut dan keluarganya.',
            'Kami bisa menjadwalkan percakapan lewat WhatsApp dan membantu sebagai penerjemah untuk Anda, atau untuk Anda bersama keluarga Anda, saat berbicara dengan orang itu.'
          ]
        },
        {
          eyebrow: 'Kepercayaan',
          title: 'Sistem ini bukan untuk pencari hiburan, tetapi untuk orang yang benar-benar ingin menikah',
          body: 'Struktur perkenalan di sini tidak dirancang untuk orang yang hanya mencari kesenangan atau mengisi waktu, tetapi untuk orang yang membawa niat menikah yang serius.',
          points: [
            'Semua orang bisa saling mengirim pesan singkat, tetapi percakapan penuh hanya terbuka antara orang-orang yang memulai match aktif.',
            'Saat suka menjadi timbal balik, tahap pencocokan aktif dimulai; setelah kedua pihak menyetujui, chat privat terbuka.',
            'Selama pencocokan aktif berlanjut, dukungan terjemahan membantu setiap orang berbicara dalam bahasa mereka sendiri dengan lebih nyaman.'
          ]
        }
      ]
    },
    signupGuide: 'Untuk mendaftar, lanjutkan dengan Google, lalu isi formulir pendaftaran matchmaking. Saat suka menjadi timbal balik, Anda masuk ke tahap pencocokan aktif dan bisa berbicara tanpa batas di jendela privat dengan dukungan terjemahan.',
    signupExistingAccountHint: 'Jika Anda sudah punya akun, masuk dengan Google.',
    quickProfile: {
      title: 'Profil Cepat',
      lead: 'Lengkapi profil singkat Anda, lalu lanjutkan.',
      labels: {
        fullName: 'Nama',
        age: 'Usia',
        gender: 'Jenis kelamin',
        city: 'Kota',
        country: 'Negara',
        maritalStatus: 'Status pernikahan',
        hasChildren: 'Punya anak?',
        childrenCount: 'Berapa?',
        occupation: 'Pekerjaan',
        photo: 'Foto profil (1)',
      },
      placeholders: {
        fullName: 'Nama Anda',
        age: 'contoh: 28',
        city: 'Kota',
        childrenCount: 'contoh: 1',
        occupation: 'Pekerjaan',
      },
      options: {
        select: 'Pilih',
        countryTr: 'Turki',
        countryId: 'Indonesia',
        countryOther: 'Lainnya',
        maritalSingle: 'Lajang',
        maritalMarried: 'Menikah',
        maritalDivorced: 'Bercerai',
        maritalWidowed: 'Duda/Janda',
        hasChildrenNo: 'Tidak',
        hasChildrenYes: 'Ya',
      },
      statuses: {
        photoUploading: 'Mengunggah foto…',
        photoUploaded: 'Foto berhasil diunggah.',
      },
      actions: {
        createProfile: 'Buat profil saya',
      },
      steps: {
        step2Google: 'Langkah 2: Daftar dengan Google',
      },
      infos: {
        ready: 'Profil Anda siap. Anda bisa lanjut sekarang.',
      },
      errors: {
        fillFirst: 'Silakan isi formulir profil cepat terlebih dahulu.',
        nameRequired: 'Nama wajib diisi.',
        ageInvalid: 'Usia harus antara 18–99.',
        genderRequired: 'Jenis kelamin wajib diisi.',
        cityRequired: 'Kota wajib diisi.',
        countryRequired: 'Negara wajib diisi.',
        maritalRequired: 'Status pernikahan wajib diisi.',
        occupationRequired: 'Pekerjaan wajib diisi.',
        hasChildrenRequired: 'Status anak wajib diisi.',
        childrenCountRequired: 'Jumlah anak (1–20) wajib diisi.',
        photoRequired: 'Foto profil wajib diisi.',
        photoNotImage: 'Silakan pilih file gambar.',
        photoUploadFailed: 'Gagal mengunggah foto.',
        saveFailed: 'Profil tidak dapat disimpan. Silakan coba lagi.',
      },
    },
    or: 'atau',
    labels: {
      email: 'Email',
      password: 'Kata sandi',
      confirmPassword: 'Konfirmasi kata sandi',
      gender: 'Jenis kelamin',
      nationality: 'Kewarganegaraan',
      nationalityOther: 'Kewarganegaraan lain (tulis)',
      age: 'Usia',
    },
    placeholders: {
      email: 'contoh@email.com',
      password: 'Kata sandi Anda',
      confirmPassword: 'Ketik ulang kata sandi Anda',
      nationality: 'Pilih kewarganegaraan',
      nationalityOther: 'contoh: Jerman',
      age: 'contoh: 27',
    },
    actions: {
      login: 'Masuk',
      signup: 'Daftar',
      openInBrowser: 'Buka di browser dan lanjutkan',
      switchToSignup: 'Belum punya akun? Daftar',
      switchToLogin: 'Sudah punya akun? Masuk',
      showEmailFallback: 'Ada kendala? Lanjutkan dengan email',
      forgot: 'Lupa kata sandi',
    },
    signup: {
      genderMale: 'Saya laki-laki',
      genderFemale: 'Saya perempuan',
      nationalityTr: 'Turki',
      nationalityId: 'Indonesia',
      nationalityOther: 'Lainnya',
      ageHint: 'Anda harus berusia minimal {{minAge}} tahun.',
    },
    forgotHint: {
      prefix: 'Jika Anda lupa kata sandi, klik',
      suffix: 'untuk menerima tautan reset melalui email.',
    },
    passwordToggle: {
      show: 'Tampilkan',
      hide: 'Sembunyikan',
    },
    feedback: {
      title: 'Keluhan / Masukan',
      lead: 'Jika Anda mengalami kendala saat pendaftaran, mohon laporkan masalahnya beserta nomor kontak atau email Anda. Kami akan segera cek dan menghubungi Anda kembali.',
      contactLabel: 'Kontak (telepon atau email)',
      contactPlaceholder: 'Contoh: +62 812… atau nama@site.com',
      placeholder: 'Kontak (telepon atau email) + kendala yang Anda alami…',
      note: 'Catatan: Sertakan kontak agar kami bisa menghubungi Anda.',
      reportCta: 'Laporkan error ini',
      prefillHeader: 'Mohon isi detail di bawah ini:',
      prefillContact: 'Kontak (telepon atau email):',
      prefillProblem: 'Masalah (apa yang Anda lakukan / apa yang terjadi?):',
      prefillUiError: 'Error yang terlihat',
      prefillDebugCode: 'Kode error',
      prefillDebugMessage: 'Pesan teknis',
      send: 'Kirim',
      sending: 'Mengirim…',
      sent: 'Terkirim. Terima kasih.',
      tooShort: 'Silakan tulis minimal {{min}} karakter.',
      failed: 'Gagal mengirim. Silakan coba lagi.',
    },
    legal: {
      prefix: 'Dengan melanjutkan, Anda menyetujui',
      contract: 'Perjanjian Pengguna / Keanggotaan',
      cancelRefund: 'Kebijakan pembatalan & refund',
      privacy: 'Kebijakan Privasi',
    },
    resetSent: 'Tautan reset kata sandi telah dikirim ke email Anda.',
    infos: {
      accountExistsTryLogin: 'Anda sudah memiliki akun. Silakan coba masuk dengan email dan kata sandi Anda.',
      inAppBrowserGoogleRedirect:
        'Masuk dengan Google mungkin tidak berfungsi di browser dalam aplikasi TikTok. Kami akan membuka login Google dengan redirect…',
    },
    errors: {
      noAccountFoundSignupRequired:
        'Akun tidak ditemukan. Anda perlu mendaftar terlebih dahulu. Kami mengalihkan Anda ke pendaftaran—pilih jenis kelamin/kewarganegaraan, masukkan usia, lalu coba lagi.',
      accountExistsWithDifferentCredential:
        'Email ini sudah terdaftar dengan metode lain. Silakan masuk dengan email/kata sandi dulu; setelah itu kami bisa menautkan login Google.',
      domainNotFound: '(domain tidak ditemukan)',
      googleFailedDev:
        'Login Google gagal ({{code}}).\n\nDi Firebase Console → Authentication → Settings → Authorized domains, tambahkan: {{host}}\nJuga periksa VITE_FIREBASE_AUTH_DOMAIN di env Anda.',
      googleUnauthorizedDomain:
        'Login Google gagal (unauthorized-domain).\n\nTambahkan domain ini di Firebase Console → Authentication → Settings → Authorized domains: {{host}}',
      googleOperationNotAllowed:
        'Login Google dinonaktifkan. Aktifkan penyedia Google di Firebase Console → Authentication → Sign-in method.',
      appleOperationNotAllowed:
        'Login Apple dinonaktifkan. Aktifkan penyedia Apple di Firebase Console → Authentication → Sign-in method.',
      firebaseAuthInvalidConfig:
        'Konfigurasi Firebase Auth tidak valid. Periksa nilai `VITE_FIREBASE_*` di `.env.local` (dan env Vercel).',
      googleInAppBlocked:
          'Masuk dengan Google kadang bisa berhenti di browser dalam aplikasi ini. Anda bisa lanjut dengan email, atau pilih “Buka di browser” lalu coba lagi di Chrome/Safari.',
      googleRedirectNoResult:
        'Masuk dengan Google tidak berhasil diselesaikan setelah kembali dari Google. Silakan coba lagi, atau lanjutkan dengan email/kata sandi.',
      googleFailed: 'Masuk dengan Google gagal.',
      appleFailed: 'Masuk dengan Apple gagal.',
      invalidCredential: 'Email atau kata sandi salah (atau akun tidak ditemukan). Jika Anda lupa kata sandi, gunakan “Lupa kata sandi”.',
      invalidEmail: 'Alamat email tampak tidak valid. Silakan periksa dan coba lagi.',
      emailAlreadyInUse: 'Akun dengan email ini sudah ada. Silakan masuk atau gunakan “Lupa kata sandi”.',
      weakPassword: 'Kata sandi terlalu lemah. Silakan pilih kata sandi yang lebih kuat (mis. minimal 6 karakter).',
      passwordsDoNotMatch: 'Kata sandi tidak cocok. Silakan ketik ulang kata sandi yang sama.',
      emailPasswordRequired: 'Email dan kata sandi wajib diisi.',
      genderRequired: 'Pilih jenis kelamin untuk mendaftar.',
      nationalityRequired: 'Pilih kewarganegaraan untuk mendaftar.',
      nationalityOtherRequired: 'Tuliskan kewarganegaraan Anda.',
      ageRequired: 'Masukkan usia Anda untuk mendaftar.',
      ageMin: 'Untuk mendaftar, Anda harus berusia minimal {{minAge}} tahun.',
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
      copy: 'Salin',
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
      membershipOrVerificationRequired: 'Aksi ini membutuhkan akun aktif.',
      freeActiveMembershipRequired: 'Aksi ini membutuhkan akun aktif.',
      freeActiveMembershipBlocked: 'Hak aktivasi Anda dinonaktifkan. Silakan hubungi dukungan.',
      otherUserMatched: 'Orang ini sudah cocok dengan orang lain.',
      alreadyMatched: 'Anda sudah memiliki kecocokan.',
      userLocked: 'Proses kecocokan Anda terkunci. Aksi ini tidak diizinkan.',
      requestNewFailed: 'Tidak bisa meminta kecocokan baru.',
      requestNewRateLimited: 'Anda terlalu sering meminta. Silakan coba lagi nanti.',
      requestNewQuotaExhausted: 'Kuota permintaan kecocokan baru hari ini sudah habis (3/3). Silakan coba lagi besok.',
      requestNewFreeActiveBlocked: 'Anda tidak bisa meminta kecocokan baru karena hak aktivasi Anda dibatalkan. Anda perlu keanggotaan berbayar untuk mengaktifkan kembali.',
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
      inactiveFemale: 'Keanggotaan tidak aktif. Untuk beberapa aksi, akun Anda harus aktif.',
      activeViaVerification: 'Identitas Anda terverifikasi. Anda dapat mengaktifkan akun Anda.',
      freeActiveActive: 'Akun Anda aktif.',
      freeActiveTermsTitle: 'Syarat aktivasi gratis',
      freeActiveTermsBody:
        'Jika Anda mengaktifkan akun gratis dan tidak aktif selama 48 jam, status aktivasi dapat dibatalkan. Saat mengaktifkan kembali, batas waktu turun menjadi 24 jam. Jika tetap tidak aktif, aktivasi dapat dibatalkan lagi dan permintaan kecocokan baru bisa dibatasi.',
      freeActiveApply: 'Aktifkan akun gratis',
      freeActiveApplying: 'Mengajukan…',
      freeActiveApplied: 'Akun gratis diaktifkan. Durasi: {{hours}} jam.',
      daysLeft_one: 'Sisa waktu: {{count}} hari.',
      daysLeft_other: 'Sisa waktu: {{count}} hari.',
      until: 'Berakhir: {{date}}.',
    },
    membershipNotice: {
      title: 'Info suka / detail / kontak',
      male: {
        lead: 'Akses fitur:',
        points: [
          'Pencocokan dan pratinjau terbatas gratis.',
          'Melihat detail penuh, suka/tolak, dan menghubungi memerlukan keanggotaan aktif (gratis untuk saat ini).',
        ],
      },
      female: {
        lead: 'Akses fitur:',
        points: [
          'Pencocokan dan pratinjau terbatas gratis.',
          'Melihat detail penuh, suka/tolak, dan menghubungi memerlukan keanggotaan aktif (gratis untuk saat ini).',
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
            a: 'Suka / detail lengkap / kontak memerlukan akun aktif.',
          },
          {
            q: 'Untuk apa verifikasi identitas?',
            a: 'Sebagai lencana kepercayaan. Membantu proses keluhan dengan bukti dan dapat membuka beberapa alur.',
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
      verifiedBadge: 'Pengguna terpercaya',
      requiredTitle: 'Verifikasi identitas (lencana)',
      requiredBody: 'Verifikasi identitas adalah lencana kepercayaan. Jika ada pelanggaran aturan, Anda bisa mengajukan keluhan dengan screenshot/bukti.',
      unverifiedTitle: 'Belum terverifikasi (lencana)',
      unverifiedBodyMale: 'Verifikasi identitas bersifat opsional. Catatan: untuk pria, aksi membutuhkan keanggotaan aktif.',
      unverifiedBodyFemale: 'Verifikasi identitas bersifat opsional. Catatan: verifikasi identitas dapat membuka beberapa alur.',
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
        verifiedBadge: 'Pengguna terpercaya',
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
        referenceHint: 'Saat membayar, tulis ini di kolom referensi/deskripsi: {{code}}',
        referencePlaceholder: 'No bukti, keterangan, nama pengirim…',
        note: 'Catatan (opsional)',
        notePlaceholder: 'Tambahkan info jika perlu',
        noteHelpEftFastWise:
          'Saat mengirim EFT/transfer (atau Wise/SWIFT), Anda harus menulis kode pengguna MK di atas persis pada kolom “Referensi / Deskripsi” bank.',
        noteHelpEftFastExtra:
          'Dengan EFT/FAST, pembayaran masuk ke rekening Turki milik pihak berwenang atas nama perusahaan kami.',
        noteHelpOther:
          'Tergantung metode pembayaran, kolom referensi mungkin tidak wajib. Namun tetap simpan info referensi di atas.',
        receipt: 'Bukti bayar (opsional)',
        receiptHelp: 'Anda bisa unggah foto atau tempel tautan bukti bayar di bawah.',
        receiptLink: 'Tautan bukti bayar (opsional)',
        viewReceipt: 'Lihat bukti bayar',
        uploadingReceipt: 'Mengunggah bukti bayar…',
        receiptViaUpload: 'Unggah bukti pembayaran',
        receiptViaWhatsapp: 'Saya akan mengirim bukti via WhatsApp',
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
      eligibilityPointFemale: 'Pencocokan dan melihat info profil terbatas di dalam situs tidak memerlukan keanggotaan. Untuk setuju/tolak dan menghubungi pasangan, Anda perlu akun aktif.',
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
