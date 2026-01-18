export const kesfetDataId = {
  islands: [
    {
      id: "bali",
      name: "Bali",
      description:
        "Asap dupa dari pura, hijau sawah, dan oranye pantai saat matahari terbenam bisa bertemu dalam satu hari; di Bali, setiap pagi terasa seperti halaman pertama dari cerita baru. Di antara ritual spa, air terjun tersembunyi, dan kota-kota pantai yang santai, kamu perlahan menyatu dengan ritme pulau ini.",
      image: {
        storageKey: "bali-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 9,
      highlights: ["Pura", "Pantai", "Teras Sawah"],
      tags: ["balayi", "aile"],
    },
    {
      id: "java",
      name: "Java",
      description:
        "Pura yang muncul dari kabut pagi di bawah bayang-bayang gunung berapi aktif, malamnya berganti menjadi jalanan yang ramai dan kuliner kaki lima. Di Java, setiap sudut membuatmu merasakan Indonesia modern sekaligus tradisi yang tak berubah selama berabad-abad.",
      image: {
        storageKey: "java-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 5,
      highlights: ["Borobudur", "Gunung Berapi", "Jakarta"],
      tags: ["macera"],
    },
    {
      id: "lombok",
      name: "Lombok",
      description:
        "Siluet Rinjani di belakang pantai yang panjang dan sunyi, serta perahu nelayan yang berpadu dengan suara ombak sepanjang hari… Lombok cocok untuk yang ingin melambat jauh dari keramaian—lebih tenang dari Bali, tapi sama memikatnya.",
      image: {
        storageKey: "lombok-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 5,
      highlights: ["Gunung Rinjani", "Kepulauan Gili", "Air Terjun"],
      tags: ["sakin", "macera"],
    },
    {
      id: "komodo",
      name: "Komodo",
      description:
        "Pantai berpasir pink, teluk biru toska, dan komodo yang biasanya kamu lihat di dokumenter… Gugusan pulau ini membuka dunia yang terasa tidak nyata—namun benar-benar nyata, dari spot diving hingga tur sunset.",
      image: {
        storageKey: "komodo-hero",
        defaultUrl:
          "https://images.pexels.com/photos/11896657/pexels-photo-11896657.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 2,
      highlights: ["Komodo", "Labuan Bajo"],
      tags: ["macera"],
    },
    {
      id: "sulawesi",
      name: "Sulawesi",
      description:
        "Dari upacara Toraja di desa pegunungan hingga terumbu karang kelas dunia, Sulawesi terasa seperti perjalanan panjang. Di setiap pemberhentian, budaya, lanskap, dan cerita yang berbeda muncul; pulau ini mengajakmu menjelajah pelan-pelan, tanpa terburu-buru.",
      image: {
        storageKey: "sulawesi-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 4,
      highlights: ["Toraja", "Bunaken", "Rumah Adat"],
      tags: ["macera"],
    },
    {
      id: "sumatra",
      name: "Sumatra",
      description:
        "Desa yang tersembunyi di antara pegunungan berkabut, hutan hujan yang lebat, dan orangutan yang bebas di antara pepohonan… Di Sumatra, alam menampilkan sisi paling liar dan paling murninya, mengundangmu ke penemuan baru di setiap sudut.",
      image: {
        storageKey: "sumatra-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 6,
      highlights: ["Danau Toba", "Orangutan", "Surf"],
      tags: ["macera", "sakin"],
    },
  ],

  islandData: {
    bali: {
      name: "Bali",
      description:
        "Bali menonjol dengan pura yang indah, teras sawah yang hijau, dan pantai terkenal dunia—pulau yang memikat dengan alamnya dan suasana yang tenang.",
      heroImage: {
        storageKey: "bali-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "10–14 hari (3–4 area)",
        budget: "$$ - $$$",
        vibe: "Keseimbangan spa, pura, dan pantai",
      },
      destinations: [
        {
          id: "ubud",
          name: "Ubud",
          image: {
            storageKey: "bali-ubud-hero",
            defaultUrl:
              "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          description:
            "Jantung spiritual Bali—hari yang tenang namun penuh, di antara teras sawah, pura mistis, dan Monkey Forest",
          rating: 4.8,
          activities: ["Pura", "Teras Sawah", "Yoga", "Spa"],
          crowd: "Tenang & spiritual",
        },
        {
          id: "kuta",
          name: "Kuta",
          image: {
            storageKey: "bali-kuta-hero",
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          description:
            "Garis pantai paling hidup di Bali—pas untuk mencoba surf pertama kali atau menikmati sunset di beach bar yang ramai",
          rating: 4.8,
          activities: ["Surf", "Sunset", "Pantai", "Olahraga Air"],
          crowd: "Ramai & hidup",
        },
        {
          id: "seminyak",
          name: "Seminyak",
          description:
            "Pengalaman Bali yang lebih stylish dengan hotel butik, restoran chic, dan beach club yang ramai saat matahari terbenam",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Pantai", "Surf", "Belanja", "Restoran"],
          crowd: "Stylish & ramai",
        },
        {
          id: "uluwatu",
          name: "Uluwatu",
          description:
            "Pura di tebing menghadap samudra, ombak surf legendaris, dan tari Kecak saat sunset—Bali dalam versi paling dramatis",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Pura", "Surf", "Tebing", "Tari Kecak"],
          crowd: "Ramai tapi ikonik",
        },
        {
          id: "nusa-dua",
          name: "Nusa Dua",
          description:
            "Zona nyaman di area resort yang tenang, aman, dan tertata—laut yang tenang sekaligus olahraga air",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Resort Mewah", "Olahraga Air", "Golf", "Spa"],
          crowd: "Ramah keluarga & tertata",
        },
        {
          id: "canggu",
          name: "Canggu",
          description:
            "Papan surf, digital nomad dengan laptop, dan kopi third-wave—kawasan paling muda dan paling ‘cool’ di Bali",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Surf", "Beach Club", "Yoga", "Kafe"],
          crowd: "Muda & trendy",
        },
        {
          id: "sanur",
          name: "Sanur",
          description:
            "Kota pantai old-school untuk jalan pagi saat sunrise, pantai yang nyaman untuk anak, dan ritme liburan yang santai",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Sunrise", "Bersepeda", "Diving", "Pantai"],
          crowd: "Tenang untuk keluarga",
        },
        {
          id: "munduk",
          name: "Munduk",
          description:
            "Rute air terjun berkabut, kebun kopi, dan udara sejuk—merasakan atmosfer desa pegunungan Bali",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.8,
          activities: ["Air Terjun", "Trekking", "Tur Kopi", "Alam"],
          crowd: "Sejuk & damai",
        },
        {
          id: "amed",
          name: "Amed",
          description:
            "Kota nelayan yang tenang dengan pantai pasir hitam, snorkeling dari tepi pantai, dan vibe damai untuk penyelam",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Diving", "Snorkeling", "Pantai", "Desa Tradisional"],
          crowd: "Sangat tenang",
        },
      ],
    },

    java: {
      name: "Java",
      description:
        "Jantung budaya dan ekonomi Indonesia—penuh gunung berapi spektakuler dan pura bersejarah.",
      heroImage: {
        storageKey: "java-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "7–10 hari (2–3 kota)",
        budget: "$$",
        vibe: "Budaya, kota, dan gunung berapi",
      },
      destinations: [
        {
          id: "yogyakarta",
          name: "Yogyakarta",
          description:
            "Ibu kota budaya Jawa—pura UNESCO seperti Borobudur dan Prambanan, plus street art dan energi kota pelajar",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Borobudur", "Prambanan", "Keraton", "Batik"],
        },
        {
          id: "pangandaran",
          name: "Pangandaran",
          description:
            "Kota pantai yang menjaga keseimbangan laut–alam: pantai sepi, penginapan kecil tepi laut, dan hutan hijau di belakangnya",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Diving", "Snorkeling", "Alam", "Seafood"],
        },
        {
          id: "bandung",
          name: "Bandung",
          description:
            "Dijuluki ‘Paris van Java’: udara pegunungan yang sejuk, kafe desain, outlet shopping, dan lanskap vulkanik—favorit untuk liburan singkat",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Belanja", "Kebun Teh", "Gunung Berapi", "Kafe"],
        },
        {
          id: "banyuwangi",
          name: "Banyuwangi",
          description:
            "Rute fokus alam: mulai mendaki Kawah Ijen tengah malam untuk melihat blue fire, lalu surf di pantai terdekat keesokan harinya",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.8,
          activities: ["Blue Fire", "Trekking", "Surf", "Diving"],
        },
        {
          id: "malang",
          name: "Malang",
          description:
            "Perpaduan lembut kota dan alam: iklim sejuk, taman bunga berwarna-warni, dan air terjun di sekitarnya",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Taman", "Air Terjun", "Trekking", "Kafe"],
        },
      ],
    },

    lombok: {
      name: "Lombok",
      description:
        "Tetangga Bali yang lebih tenang, terkenal dengan Gunung Rinjani dan Kepulauan Gili yang seperti surga.",
      heroImage: {
        storageKey: "lombok-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "7–10 hari (2–3 area)",
        budget: "$$",
        vibe: "Teluk tenang dan surf",
      },
      destinations: [
        {
          id: "gili-trawangan",
          name: "Gili Trawangan",
          description:
            "Siang bersepeda keliling pulau dan snorkeling mencari penyu, malamnya lanjut musik di bar pantai—kecil tapi energik",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.8,
          activities: ["Diving", "Snorkeling", "Party", "Bersepeda"],
        },
        {
          id: "mount-rinjani",
          name: "Mount Rinjani",
          description:
            "Gunung legendaris Lombok: pendakian menantang dengan pemandangan danau kawah, sunrise di atas awan",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Trekking", "Gunung Berapi", "Danau", "Camping"],
        },
        {
          id: "senggigi",
          name: "Senggigi",
          description:
            "Jalur resort klasik Lombok: pantai berpalem, panorama sunset sepanjang jalan pesisir, dan tur perahu ke Gili",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Pantai", "Sunset", "Snorkeling", "Resort"],
        },
        {
          id: "kuta-lombok",
          name: "Kuta Lombok",
          description:
            "Teluk pasir putih yang banyak masih alami, spot surf, dan bukit dengan pemandangan gunung–laut; suasana ‘pra‑Bali’ yang lebih tenang",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Surf", "Pantai", "Trekking", "Fotografi"],
        },
        {
          id: "benang-stokel",
          name: "Air Terjun Benang Stokel",
          description:
            "Kolam bertingkat yang menyegarkan, muncul setelah jalur jalan kaki singkat di dalam hutan",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Air Terjun", "Trekking", "Berenang", "Piknik"],
        },
      ],
    },

    komodo: {
      name: "Komodo",
      description: "Pulau unik yang terkenal dengan komodo.",
      heroImage: {
        storageKey: "komodo-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/11896657/pexels-photo-11896657.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "3–4 hari (tur kapal)",
        budget: "$$$ (dengan tur)",
        vibe: "Petualangan total & taman nasional",
      },
      destinations: [
        {
          id: "komodo-island",
          name: "Pulau Komodo",
          description:
            "Pulau taman nasional dengan jalur berpemandu untuk melihat komodo di habitat aslinya—nuansa alam liar di darat dan laut",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 5.0,
          activities: ["Komodo", "Trekking", "Satwa Liar", "Safari"],
        },
        {
          id: "labuan-bajo",
          name: "Labuan Bajo",
          description:
            "Pelabuhan awal tur Komodo: tur perahu seharian, malamnya naik ke bukit untuk menikmati sunset di atas kota",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.4,
          activities: ["Tur Kapal", "Diving", "Sunset", "Seafood"],
        },
      ],
    },

    sulawesi: {
      name: "Sulawesi",
      description:
        "Pulau dengan bentuk unik, menawarkan budaya Toraja dan spot diving yang menakjubkan.",
      heroImage: {
        storageKey: "sulawesi-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "8–12 hari (2–3 area)",
        budget: "$$",
        vibe: "Budaya Toraja dan diving",
      },
      destinations: [
        {
          id: "bunaken",
          name: "Bunaken",
          description:
            "Salah satu spot diving paling terkenal: wall dive, terumbu karang berwarna-warni, dan peluang berenang dengan penyu",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Diving", "Snorkeling", "Kehidupan Laut", "Tur Kapal"],
        },
        {
          id: "makassar",
          name: "Makassar",
          description:
            "Gerbang Sulawesi Selatan: jalan sore di Pantai Losari saat sunset, nuansa pelabuhan bersejarah, dan hidangan seafood berbumbu kuat",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.4,
          activities: ["Tempat Bersejarah", "Seafood", "Pantai", "Benteng"],
        },
        {
          id: "wakatobi",
          name: "Wakatobi",
          description:
            "Dicapai dengan kombinasi pesawat + kapal, Wakatobi adalah impian penyelam: air jernih dan terumbu karang yang hampir tak tersentuh",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 5.0,
          activities: ["Diving", "Snorkeling", "Resort", "Kehidupan Laut"],
        },
        {
          id: "togean",
          name: "Kepulauan Togean",
          description:
            "Gugusan pulau terisolasi dengan listrik dan internet terbatas; teluk sebening kaca dan danau ubur-ubur membuat waktu terasa melambat",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Pulau", "Snorkeling", "Danau Ubur-ubur", "Pantai"],
        },
      ],
    },

    sumatra: {
      name: "Sumatra",
      description: "Rumah bagi hutan hujan, Danau Toba, dan orangutan liar.",
      heroImage: {
        storageKey: "sumatra-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "10–14 hari (2–3 area)",
        budget: "$$",
        vibe: "Hutan hujan dan pelarian ke danau",
      },
      destinations: [
        {
          id: "lake-toba",
          name: "Danau Toba",
          description:
            "Danau raksasa yang mengisi kawah supervolcano—dengan Pulau Samosir di tengah dan desa Batak di tepiannya",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.8,
          activities: ["Danau", "Pulau", "Budaya Batak", "Bersepeda"],
        },
        {
          id: "bukit-lawang",
          name: "Bukit Lawang",
          description:
            "Trekking hutan berpemandu dengan peluang melihat orangutan liar, ditambah bungalow tepi sungai untuk tidur ditemani suara alam",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Orangutan", "Trekking", "Hutan Hujan", "Rafting"],
        },
        {
          id: "mentawai",
          name: "Kepulauan Mentawai",
          description:
            "Rantai pulau terisolasi dengan surf camp yang dicapai lewat kapal, ombak yang konsisten, dan budaya suku lokal yang masih hidup",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Surf", "Tur Kapal", "Budaya", "Pantai"],
        },
        {
          id: "bukittinggi",
          name: "Bukittinggi",
          description:
            "Kota pegunungan yang khas: udara sejuk, rumah bergaya Minangkabau, dan pemandangan ngarai yang membelah kota",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Budaya", "Rumah Adat", "Ngarai", "Pasar"],
        },
        {
          id: "kerinci",
          name: "Kerinci",
          description:
            "Rute yang menantang tapi memuaskan: trekking panjang menuju puncak tertinggi Indonesia, dengan kebun teh di lereng-lerengnya",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Pendakian Vulkan", "Kebun Teh", "Air Terjun", "Satwa Liar"],
        },
        {
          id: "nias",
          name: "Pulau Nias",
          description:
            "Perpaduan budaya dan petualangan: ombak kuat untuk surf, atraksi lompat batu di alun-alun desa, dan warisan megalitik",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Surf", "Budaya", "Tarian Perang", "Musik", "Lompat Batu", "Pantai"],
        },
      ],
    },
  },
};
