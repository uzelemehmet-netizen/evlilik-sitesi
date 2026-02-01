import en from './en';

function isPlainObject(value) {
  return (
    value != null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
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

// Indonesian translations.
// Missing keys fall back to English via deepMerge.
const overrides = {
  navigation: {
    siteTitle: 'Uniqah',
    siteSubtitle: 'PT MoonStar Global Indonesia',
    taglineTravelOrg: 'Organisasi perjalanan',
    taglineWeddingGuidance: 'Panduan pernikahan',
    home: 'Beranda',
    about: 'Tentang Kami',
    corporate: 'Perusahaan',
    travel: 'Perjalanan',
    tours: 'Paket Tur',
    explore: 'Jelajahi',
    wedding: 'Panduan Pernikahan',
    matchmaking: 'Uniqah',
    panel: 'Profil saya',
    documents: 'Dokumen',
    youtube: 'YouTube',
    contact: 'Kontak',
    language: 'Bahasa',
  },

  meta: {
    baseTitle: 'Uniqah | PT MoonStar Global Indonesia',
    baseDescription:
      'Uniqah (PT MoonStar Global Indonesia) menyediakan layanan tur di Indonesia, rencana perjalanan khusus, bulan madu, serta panduan pernikahan.',
    pages: {
      home: { title: 'Uniqah | PT MoonStar Global Indonesia' },
      about: { title: 'Tentang Kami' },
      corporate: { title: 'Perusahaan' },
      contact: { title: 'Kontak' },
      youtube: { title: 'YouTube' },
      gallery: { title: 'Galeri' },
      privacy: { title: 'Kebijakan Privasi' },
      documents: { title: 'Dokumen' },
      wedding: {
        title: 'Panduan Pernikahan',
        description:
          'Panduan proses pernikahan Anda di Indonesia: dukungan menyeluruh untuk hotel, transportasi, penerjemahan, dan dokumen resmi.',
      },
    },
  },

  common: {
    open: 'Buka',
    loading: 'Memuat',
    downloadPdf: 'Unduh PDF',
    learnMore: 'Pelajari',
    back: 'Kembali',
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
      explore: 'Halo, saya ingin mendapatkan informasi tentang destinasi di Indonesia.',
      travel: 'Halo, saya ingin mendapatkan informasi tentang rencana liburan ke Indonesia.',
      wedding: 'Halo, saya ingin mendapatkan informasi tentang menikah di Indonesia.',
      youtube: 'Halo, saya ingin mendapatkan informasi tentang video YouTube Anda.',
      contact: 'Halo, saya ingin mendapatkan informasi tentang cara menghubungi Anda.',
      tours: 'Halo, saya ingin mendapatkan informasi tentang paket tur Anda.',
      documents: 'Halo, saya ingin mendapatkan informasi tentang dokumen Anda.',
    },
  },

  about: {
    hero: {
      title: 'Tentang Kami',
      subtitle:
        'Kami memudahkan pengalaman perjalanan dan tur Anda di Indonesia selangkah demi selangkah dengan struktur dan pengalaman di lapangan.',
    },
    brand: {
      description: 'Uniqah adalah merek di bawah PT MoonStar Global Indonesia di Indonesia.',
      p1:
        'Situs ini adalah etalase dan titik kontak layanan yang kami jalankan di bawah PT MoonStar Global Indonesia. Komunikasi merek publik kami dilakukan dengan nama Uniqah.',
      p2:
        'MoonStar Global Indonesia dibangun oleh wirausahawan Turki yang tinggal di Indonesia untuk memahami kebutuhan tamu Turki secara langsung dan menyelesaikannya di lapangan. Paket tur dan komunikasi penjualan dilakukan di bawah merek Uniqah agar lebih mudah dipahami.',
      cards: {
        toursTitle: 'Organisasi tur',
        toursDesc: 'Tur terencana dan rencana perjalanan khusus untuk Bali, Lombok, Komodo, dan lainnya.',
        weddingTitle: 'Panduan pernikahan',
        weddingDesc: 'Pendampingan menyeluruh termasuk hotel, transportasi, penerjemahan, dan dokumen resmi.',
        dameturkTitle: 'DaMeTurk',
        dameturkDesc:
          'Merek es krim Turki asli kami di bawah PT MoonStar Global Indonesia. Kunjungi dameturk.com untuk detail.',
      },
      socialNote:
        'Nama akun YouTube dan Instagram kami tetap endonezyakasifi dan mendukung merek ini melalui produksi konten.',
    },
  },

  contact: {
    hero: {
      title: 'Kontak',
      description:
        'Tanyakan tentang paket tur, proses pernikahan, atau kerja sama. Kami akan kembali dalam 24 jam.',
    },
    info: {
      title: 'Kontak & alamat',
      whatsapp: 'WhatsApp',
      email: 'Email',
      address: 'Alamat',
      workingHours: 'Jam kerja',
      workingHoursText: 'Setiap hari 10:0022:00 (WIB)',
    },
    form: {
      title: 'Kirim pesan',
      success: 'Terima kasih. Kami akan menghubungi Anda dalam 24 jam.',
      privacyError: 'Anda harus mengonfirmasi bahwa Anda telah membaca dan menyetujui kebijakan privasi.',
      sendError: 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.',
      labels: {
        name: 'Nama lengkap *',
        email: 'Email *',
        phone: 'Telepon',
        subject: 'Subjek *',
        message: 'Pesan *',
      },
      placeholders: {
        name: 'Nama lengkap Anda',
        email: 'contoh@email.com',
        phone: '+62 ...',
        subject: 'Subjek singkat',
        message: 'Tulis pesan Anda',
      },
      consent: 'Saya telah membaca dan menyetujui <privacyLink>Kebijakan Privasi</privacyLink>.',
      privacyLink: 'Kebijakan Privasi',
      submit: 'Kirim',
      submitting: 'Mengirim',
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
      '7': { alt: "Momen dari pernikahan Salih dan Tini" },
      '8': { alt: 'Kenangan dari tur kuil Yogyakarta' },
      '9': { alt: "Cuplikan dari hari pernikahan Salih dan Tini" },
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
          'Preferensi perjalanan',
          'Informasi browser dan perangkat',
        ],
      },
      dataUsage: {
        title: '3. Penggunaan Data',
        text: 'Data yang dikumpulkan digunakan untuk tujuan berikut:',
        items: [
          'Menyediakan layanan perjalanan dan pernikahan',
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
          'Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, Anda dapat menghubungi kami di <emailLink>endonezyakasifi@gmail.com</emailLink>.',
      },
    },
    lastUpdated: 'Terakhir diperbarui: {{date}}',
  },

  notFoundPage: {
    title: 'Halaman tidak ditemukan',
    backHome: 'Kembali ke Beranda',
  },
};

export default deepMerge(en, overrides);
