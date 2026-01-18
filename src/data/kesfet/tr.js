export const kesfetDataTr = {
  islands: [
    {
      id: "bali",
      name: "Bali",
      description:
        "Tapınakların dumanı, pirinç tarlalarının yeşili ve gün batımı plajlarının turuncusu aynı günde buluşur; Bali'de her sabah yeni bir hikâyenin ilk sayfası gibi başlar. Kendini spa ritüelleri, gizli şelaleler ve sahil kasabaları arasında yavaş yavaş bu adanın ritmine bırakırsın.",
      image: {
        storageKey: "bali-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 9,
      highlights: ["Tapınaklar", "Plajlar", "Pirinç Terasları"],
      tags: ["balayi", "aile"],
    },
    {
      id: "java",
      name: "Java",
      description:
        "Aktif volkanların gölgesinde sabah sisinin içinden yükselen tapınaklar, akşam olduğunda yerini hareketli sokaklara ve sokak lezzetlerine bırakır. Java'da her köşe, Endonezya'nın hem modern yüzünü hem de yüzyıllardır değişmeyen geleneklerini aynı anda hissettirir.",
      image: {
        storageKey: "java-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 5,
      highlights: ["Borobudur", "Volkanlar", "Jakarta"],
      tags: ["macera"],
    },
    {
      id: "lombok",
      name: "Lombok",
      description:
        "Uzun, sessiz kumsalların arkasında yükselen Rinjani silueti ve gün boyu dalga sesine karışan balıkçı tekneleri… Lombok, kalabalıktan uzaklaşıp yavaşlamayı sevenler için, Bali'ye göre daha sakin ama en az onun kadar büyüleyici bir kaçış sunar.",
      image: {
        storageKey: "lombok-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 5,
      highlights: ["Mt. Rinjani", "Gili Adaları", "Şelaleler"],
      tags: ["sakin", "macera"],
    },
    {
      id: "komodo",
      name: "Komodo",
      description:
        "Pembe kumsallar, masmavi koylar ve yalnızca belgesellerde görmeye alışık olduğun Komodo ejderleri… Bu adalar topluluğu, dalış noktalarından gün batımı turlarına kadar, sanki gerçek değilmiş gibi hissettiren ama tamamen gerçek bir dünyanın kapısını aralar.",
      image: {
        storageKey: "komodo-hero",
        defaultUrl:
          "https://images.pexels.com/photos/11896657/pexels-photo-11896657.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 2,
      highlights: ["Komodo Ejderleri", "Labuan Bajo"],
      tags: ["macera"],
    },
    {
      id: "sulawesi",
      name: "Sulawesi",
      description:
        "Dağ köylerindeki Toraja törenlerinden, dünya çapında ünlü mercan resiflerine uzanan uzun bir yolculuk gibi hissedilir Sulawesi. Her durakta bambaşka bir kültür, manzara ve hikâye karşına çıkar; ada kendini acele etmeden, yavaş yavaş keşfetmeni ister.",
      image: {
        storageKey: "sulawesi-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 4,
      highlights: ["Toraja", "Bunaken", "Geleneksel Evler"],
      tags: ["macera"],
    },
    {
      id: "sumatra",
      name: "Sumatra",
      description:
        "Sisli dağların arasına gizlenmiş köyler, derin yağmur ormanları ve ağaçların arasında özgürce dolaşan orangutanlar… Sumatra'da doğa, kendini en vahşi ve en saf haliyle gösterirken, sen de bu büyük adanın her köşesinde farklı bir keşfe davet edilirsin.",
      image: {
        storageKey: "sumatra-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 6,
      highlights: ["Toba Gölü", "Orangutanlar", "Sörf"],
      tags: ["macera", "sakin"],
    },
  ],

  islandData: {
    bali: {
      name: "Bali",
      description:
        "Bali, muhteşem tapınakları, yeşil pirinç terasları ve dünya çapında ünlü plajlarıyla öne çıkan; doğası ve sakin atmosferiyle ziyaretçilerini kendine çeken bir adadır.",
      heroImage: {
        storageKey: "bali-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "10-14 gün (3-4 bölge)",
        budget: "$$ - $$$",
        vibe: "Spa, tapınak ve plaj dengesi",
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
            "Bali'nin ruhani kalbi; pirinç terasları, mistik tapınaklar ve Monkey Forest arasında geçen sakin ama dopdolu günler",
          rating: 4.8,
          activities: ["Tapınaklar", "Pirinç Terasları", "Yoga", "Spa"],
          crowd: "Sakin & ruhani",
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
            "İlk kez sörf denemek ya da gün batımını kalabalık beach barlarda yakalamak için Bali'nin en hareketli sahil hattı",
          rating: 4.8,
          activities: ["Sörf", "Gün Batımı", "Plaj", "Su Sporları"],
          crowd: "Kalabalık & canlı",
        },
        {
          id: "seminyak",
          name: "Seminyak",
          description:
            "Tasarım butik oteller, şık restoranlar ve gün batımında dolup taşan beach club'larla biraz daha şık bir Bali deneyimi",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Plaj", "Sörf", "Alışveriş", "Restoran"],
          crowd: "Şık & hareketli",
        },
        {
          id: "uluwatu",
          name: "Uluwatu",
          description:
            "Okyanusa bakan uçurum tapınağı, efsanevi sörf dalgaları ve gün batımında Kecak dansı ile Bali'yi en dramatik haliyle gösteren nokta",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Tapınak", "Sörf", "Uçurum", "Kecak Dansı"],
          crowd: "Kalabalık ama ikonik",
        },
        {
          id: "nusa-dua",
          name: "Nusa Dua",
          description:
            "Sessiz, güvenli ve bakımlı bir resort bölgesinde, sakin deniz ve su sporlarını bir arada bulabileceğin konfor alanı",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Lüks Resort", "Su Sporları", "Golf", "Spa"],
          crowd: "Aile dostu & düzenli",
        },
        {
          id: "canggu",
          name: "Canggu",
          description:
            "Sörf tahtaları, laptoplu dijital göçebeler ve üçüncü dalga kahvecilerle Bali'nin en genç, en 'cool' mahallesi",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Sörf", "Beach Club", "Yoga", "Café"],
          crowd: "Genç & trendy",
        },
        {
          id: "sanur",
          name: "Sanur",
          description:
            "Gün doğumunda yürüyüş, çocuklarla rahat plaj keyfi ve acele etmeyen bir tatil ritmi arayanlar için eski usul sahil kasabası",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Gün Doğumu", "Bisiklet", "Dalış", "Plaj"],
          crowd: "Aileler için sakin",
        },
        {
          id: "munduk",
          name: "Munduk",
          description:
            "Sislerin arasındaki şelaleler, kahve tarlaları ve serin hava ile Bali'nin dağ köyü atmosferini hissedeceğin rota",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.8,
          activities: ["Şelaleler", "Trekking", "Kahve Turu", "Doğa"],
          crowd: "Serin & huzurlu",
        },
        {
          id: "amed",
          name: "Amed",
          description:
            "Siyah kumlu sakin plajlar, kıyıdan şnorkelle girilebilen mercanlar ve dalış meraklıları için dingin bir balıkçı kasabası",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Dalış", "Snorkeling", "Plaj", "Geleneksel Köy"],
          crowd: "Oldukça sakin",
        },
      ],
    },

    java: {
      name: "Java",
      description:
        "Endonezya'nın kültürel ve ekonomik kalbi, muhteşem volkanlar ve tarihi tapınaklarla dolu.",
      heroImage: {
        storageKey: "java-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "7-10 gün (2-3 şehir)",
        budget: "$$",
        vibe: "Kültür, şehir ve volkanlar",
      },
      destinations: [
        {
          id: "yogyakarta",
          name: "Yogyakarta",
          description:
            "Java'nın kültür başkenti; Borobudur ve Prambanan gibi UNESCO tapınaklarıyla tarih, sokak sanatı ve öğrenci şehri enerjisini bir arada yaşatan şehir",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Borobudur", "Prambanan", "Saray", "Batik"],
        },
        {
          id: "pangandaran",
          name: "Pangandaran",
          description:
            "Sessiz sahiller, denize sıfır küçük pansiyonlar ve arkasındaki yemyeşil ormanlarla deniz–doğa dengesini koruyan sahil kasabası",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Dalış", "Snorkeling", "Doğa", "Deniz Ürünleri"],
        },
        {
          id: "bandung",
          name: "Bandung",
          description:
            "'Paris van Java' lakabını hak eden, serin dağ havası, tasarım kafeleri, outlet alışverişi ve çevresini saran volkanik manzaralarıyla hafta sonu kaçamaklarının klasiği",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Alışveriş", "Çay Bahçeleri", "Volkan", "Café"],
        },
        {
          id: "banyuwangi",
          name: "Banyuwangi",
          description:
            "Gece yarısı başlayan Kawah Ijen tırmanışında mavi alevi görüp, ertesi gün yakın sahillerde sörf yapabileceğin doğa odaklı bir rota",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.8,
          activities: ["Mavi Alev", "Trekking", "Sörf", "Dalış"],
        },
        {
          id: "malang",
          name: "Malang",
          description:
            "Serin iklimi, renkli çiçek bahçeleri ve çevresine yayılmış şelaleleriyle hem şehir hem doğa isteyenler için yumuşak geçişli bir dağ şehri",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Bahçe", "Şelaleler", "Trekking", "Café"],
        },
      ],
    },

    lombok: {
      name: "Lombok",
      description:
        "Bali'nin sakin komşusu, muhteşem Rinjani Volkanı ve cennet Gili Adaları ile ünlü.",
      heroImage: {
        storageKey: "lombok-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "7-10 gün (2-3 bölge)",
        budget: "$$",
        vibe: "Sakin koylar ve sörf",
      },
      destinations: [
        {
          id: "gili-trawangan",
          name: "Gili Trawangan",
          description:
            "Gündüz bisikletle ada turu ve şnorkelle kaplumbağa arayışı, gece ise sahil barlarında müzikle devam eden küçük ama enerjik bir ada",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.8,
          activities: ["Dalış", "Snorkeling", "Parti", "Bisiklet"],
        },
        {
          id: "mount-rinjani",
          name: "Mount Rinjani",
          description:
            "Krater gölü manzaralı zorlu tırmanış rotalarıyla, gün doğumunu bulutların üzerinden izlemek isteyenler için Lombok'un efsanevi volkanı",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Trekking", "Volkan", "Göl", "Kamp"],
        },
        {
          id: "senggigi",
          name: "Senggigi",
          description:
            "Lombok'un klasik resort hattı; palmiyeli plajlar, sahil yolu boyunca gün batımı manzaraları ve Gili adalarına açılan tekne turları",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Plaj", "Gün Batımı", "Snorkeling", "Resort"],
        },
        {
          id: "kuta-lombok",
          name: "Kuta Lombok",
          description:
            "Beyaz kumlu, çoğu hâlâ bakir koylar, sörf spotları ve dağ–deniz manzaralı tepeleriyle daha sakin bir 'Bali öncesi' atmosfer",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Sörf", "Plaj", "Trekking", "Fotoğrafçılık"],
        },
        {
          id: "benang-stokel",
          name: "Benang Stokel Şelalesi",
          description:
            "Ormanın içinden geçen kısa yürüyüş rotaları sonunda karşına çıkan çok katlı, serinletici şelale havuzları",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Şelale", "Trekking", "Yüzme", "Piknik"],
        },
      ],
    },

    komodo: {
      name: "Komodo",
      description: "Dünyaca ünlü Komodo ejderleri ve eşsiz bir ada.",
      heroImage: {
        storageKey: "komodo-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/11896657/pexels-photo-11896657.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "3-4 gün (tekne turu)",
        budget: "$$$ (tur ile)",
        vibe: "Tam macera ve milli park",
      },
      destinations: [
        {
          id: "komodo-island",
          name: "Komodo Adası",
          description:
            "Komodo ejderlerini doğal ortamında görmek için rehberli patikalarda yürüdüğün, hem kara hem deniz tarafında vahşi yaşam hissi veren milli park adası",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 5.0,
          activities: ["Komodo Ejderleri", "Trekking", "Vahşi Yaşam", "Safari"],
        },
        {
          id: "labuan-bajo",
          name: "Labuan Bajo",
          description:
            "Komodo turlarının başlangıç limanı; gün boyu tekne gezileri, akşamları ise tepelere tırmanıp gün batımını izleyebileceğin küçük balıkçı kasabası",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.4,
          activities: ["Tekne Turu", "Dalış", "Gün Batımı", "Seafood"],
        },
      ],
    },

    sulawesi: {
      name: "Sulawesi",
      description:
        "Benzersiz şekliyle dikkat çeken ada, Toraja kültürü ve muhteşem dalış noktaları.",
      heroImage: {
        storageKey: "sulawesi-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "8-12 gün (2-3 bölge)",
        budget: "$$",
        vibe: "Toraja kültürü ve dalış",
      },
      destinations: [
        {
          id: "bunaken",
          name: "Bunaken",
          description:
            "Duvar dalışları, rengârenk mercan resifleri ve kaplumbağalarla yüzme ihtimaliyle dünyanın en ünlü dalış noktalarından biri",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Dalış", "Snorkeling", "Deniz Yaşamı", "Tekne Turu"],
        },
        {
          id: "makassar",
          name: "Makassar",
          description:
            "Gün batımında Losari sahilinde yürüyüş, tarihi liman dokusu ve bol baharatlı deniz ürünleri sofralarıyla Güney Sulawesi'nin giriş kapısı",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.4,
          activities: ["Tarihi Yerler", "Seafood", "Plaj", "Kale"],
        },
        {
          id: "wakatobi",
          name: "Wakatobi",
          description:
            "Uçak + tekne kombinasyonuyla ulaşılan, berrak sular ve neredeyse el değmemiş mercan resifleriyle profesyonel dalgıçların rüya destinasyonu",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 5.0,
          activities: ["Dalış", "Snorkeling", "Resort", "Deniz Yaşamı"],
        },
        {
          id: "togean",
          name: "Togean Adaları",
          description:
            "Elektrik ve internetin sınırlı olduğu, cam gibi koyları ve medüz (jellyfish) gölüyle zamanın yavaşladığı izole ada grubu",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Adalar", "Snorkeling", "Jellyfish Gölü", "Plaj"],
        },
      ],
    },

    sumatra: {
      name: "Sumatra",
      description:
        "Yağmun ormanları, Toba Gölü ve vahşi orangutanların evidir.",
      heroImage: {
        storageKey: "sumatra-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "10-14 gün (2-3 bölge)",
        budget: "$$",
        vibe: "Yağmur ormanı ve göl kaçışı",
      },
      destinations: [
        {
          id: "lake-toba",
          name: "Toba Gölü",
          description:
            "Eski bir süpervolkan kraterinin doldurduğu dev göl, ortasındaki Samosir Adası ve göl kıyısındaki Batak köyleriyle sakin ama etkileyici bir manzara",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.8,
          activities: ["Göl", "Ada", "Batak Kültürü", "Bisiklet"],
        },
        {
          id: "bukit-lawang",
          name: "Bukit Lawang",
          description:
            "Rehberli orman yürüyüşlerinde vahşi orangutan görme ihtimali ve nehir kıyısındaki bungalovlarda doğa sesleriyle uyuma deneyimi",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Orangutan", "Trekking", "Yağmun Ormanı", "Rafting"],
        },
        {
          id: "mentawai",
          name: "Mentawai Adaları",
          description:
            "Dünyanın en tutarlı dalgalarından bazılarını sunan, tekneyle ulaşılan sörf kampları ve hâlâ yaşayan yerel kabile kültürüyle izole ada zinciri",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Sörf", "Tekne Turu", "Kültür", "Plaj"],
        },
        {
          id: "bukittinggi",
          name: "Bukittinggi",
          description:
            "Serin dağ havası, Minangkabau mimarisiyle süslü evler ve şehrin içinden geçen kanyon manzarasıyla Sumatra'nın en karakteristik şehirlerinden biri",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Kültür", "Geleneksel Ev", "Kanyon", "Pazar"],
        },
        {
          id: "kerinci",
          name: "Kerinci",
          description:
            "Endonezya'nın en yüksek zirvesine giden uzun trekking rotaları ve yamaçlara yayılan çay bahçeleriyle hem zorlu hem ödüllendirici bir rota",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Volkan Tırmanışı", "Çay Bahçeleri", "Şelale", "Vahşi Yaşam"],
        },
        {
          id: "nias",
          name: "Nias Adası",
          description:
            "Güçlü dalgalarıyla sörfçülerin uğrak noktası, köy meydanlarında yapılan taş sıçrama gösterileri ve megalitik yapılarıyla kültür + macera karışımı bir ada",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Sörf", "Kültür", "Savaş Dansları", "Müzik", "Taş Sıçrama", "Plaj"],
        },
      ],
    },
  },
};
