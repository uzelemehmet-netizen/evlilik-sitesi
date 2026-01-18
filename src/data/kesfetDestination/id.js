import { kesfetDestinationDetailsTr } from './tr';
import { deepMerge } from './merge';

const kesfetDestinationDetailsIdOverrides = {
	bali: {
		ubud: {
			description:
				"Ubud adalah jantung budaya dan spiritual Bali. Dengan teras sawah hijau, pura kuno, dan galeri seni tradisional, tempat ini cocok untuk yang mencari suasana tenang, dekat alam, dan pengalaman Bali yang lebih otentik.",
			gezilecekYerler: [
				{
					name: "Monkey Forest",
					description: "Kawasan hutan suci dengan monyet berkeliaran bebas dan pura",
				},
				{
					name: "Campuhan Ridge Walk",
					description: "Jalur jalan kaki dengan pemandangan lembah, ideal saat matahari terbenam",
				},
				{
					name: "Goa Gajah (Gua Gajah)",
					description: "Kompleks pura Hindu-Buddha kuno",
				},
				{
					name: "Pura Tirta Empul",
					description: "Pura untuk ritual penyucian diri dengan air suci",
				},
				{
					name: "Gunung Kawi",
					description: "Makam dan relief kuno yang dipahat di tebing batu",
				},
				{
					name: "Air Terjun Tegenungan",
					description: "Spot berenang dan titik pemandangan",
				},
				{
					name: "Air Terjun Kanto Lampo",
					description: "Air terjun bertingkat di bebatuan, populer untuk foto",
				},
				{
					name: "Istana Ubud",
					description: "Arsitektur tradisional dan pertunjukan tari Bali di malam hari",
				},
				{
					name: "Pasar Seni Ubud",
					description: "Kerajinan tangan dan produk lokal",
				},
			],
			aktiviteler: [
				{
					name: "Arung Jeram (Sungai Ayung)",
					description: "Arung jeram berpemandu dengan pemandangan hutan",
					icon: "🚣",
				},
				{
					name: "Yoga & Meditasi",
					description: "Kelas pemula hingga lanjutan di studio yoga terkenal",
					icon: "🧘",
				},
				{
					name: "Jalan-jalan Alam",
					description: "Jalur di hutan dan rute dengan pemandangan lembah",
					icon: "🥾",
				},
				{
					name: "Tur Air Terjun",
					description: "Tur berpemandu atau mandiri, biasanya dengan waktu berenang",
					icon: "💧",
				},
				{
					name: "Spa & Terapi Healing",
					description: "Pijat Bali, terapi suara, dan sesi penyeimbangan energi",
					icon: "💆",
				},
				{
					name: "Workshop Budaya",
					description: "Tari Bali, musik tradisional, dan pengalaman kerajinan tangan",
					icon: "🎨",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"Lokal / Indonesia – Balinese": [
					{
						name: "Ayam Betutu",
						description: "Ayam berbumbu yang dimasak lama—empuk dan aromatik",
					},
					{
						name: "Nasi Campur",
						description: "Nasi dengan ayam, sayur, telur, dan lauk khas Bali",
					},
					{
						name: "Nasi Goreng",
						description: "Nasi goreng pedas dengan telur",
					},
					{
						name: "Sate Ayam",
						description: "Sate ayam panggang dengan saus kacang",
					},
					{
						name: "Gado-Gado",
						description: "Sayuran rebus dan telur dengan saus kacang yang kental",
					},
					{
						name: "Tempeh & Tofu",
						description: "Menu protein lokal berbahan kedelai—digoreng atau ditumis",
					},
					{
						name: "Soto Ayam",
						description: "Sup ayam ringan dengan jahe dan rempah",
					},
				],
				"Masakan Barat": [
					{
						name: "Restoran Vegan & Vegetarian",
						description: "Ubud adalah pusat kuliner plant-based di Bali",
					},
					{
						name: "Masakan Italia dan Prancis",
						description: "Rasa klasik Eropa",
					},
					{
						name: "Organik & Farm-to-Table",
						description: "Restoran yang memakai bahan segar dari petani lokal",
					},
					{
						name: "Sarapan Sehat & Brunch",
						description: "Pilihan organik dan nutrisi seimbang",
					},
				],
				"Masakan Turki – Tersedia di Sekitar (Kuta/Canggu 45–60 menit)": [
					{
						name: "Cappadocia Turkish Restaurant (Canggu)",
						description:
							"45–60 menit dari Ubud. AUTHENTIC Turkish. Pide, Döner, Adana Kebab, Meze, Baklava. 4.7/5 ⭐. +62 812-3841-1575",
					},
					{
						name: "Sumak Turkish Cuisine (Seminyak)",
						description:
							"50–60 menit dari Ubud. MICHELIN LEVEL Turkish. Adana Kebab, Iskender, Turkish Dumplings. 4.8/5 ⭐. sumakbali.com",
					},
				],
				"Minuman Non-Alkohol": [
					{
						name: "Jus Buah Segar",
						description: "Pepaya, mangga, nanas, buah naga",
					},
					{
						name: "Smoothie & Minuman Detox",
						description: "Dibuat dari sayuran hijau dan buah tropis",
					},
					{
						name: "Kopi Bali",
						description: "Aroma kuat dari biji lokal",
					},
					{
						name: "Teh Herbal",
						description: "Jahe, serai, kayu manis",
					},
					{
						name: "Air Kelapa",
						description: "Sumber elektrolit alami",
					},
				],
				"Specialty Coffee & Cafe Experiences": [
					{
						name: "Kopi Luwak",
						description: "Salah satu kopi paling terkenal dan mahal di dunia",
					},
					{
						name: "Single Origin Arabica",
						description: "Kopi berkualitas dari berbagai wilayah di Bali",
					},
					{
						name: "Metode Seduh Specialty",
						description: "Pour over, siphon, espresso, dan manual brew lainnya",
					},
					{
						name: "Kafe Artisan",
						description: "Kafe minimalis yang memadukan seni dan kopi, cocok untuk bekerja",
					},
				],
				"Masakan Asia": [
					{
						name: "Masakan Thailand",
						description: "Tom yum, pad thai, green curry, dan salad Thailand pedas",
					},
					{
						name: "Masakan Jepang",
						description: "Sushi, ramen, donburi, dan tempura",
					},
					{
						name: "Masakan Korea",
						description: "Bibimbap, bulgogi, kimchi, dan tteokbokki",
					},
					{
						name: "Masakan Vietnam",
						description: "Pho, banh mi, spring rolls, dan salad saus ikan",
					},
				],
				"Desserts & Traditional Balinese Pastries": [
					{
						name: "Jaje Kueh",
						description: "Kue tradisional Bali dengan kelapa dan gula Jawa",
					},
					{
						name: "Lumpia",
						description: "Gulungan manis lengket, biasanya berisi pisang",
					},
					{
						name: "Pisang Goreng",
						description: "Pisang goreng dengan karamel dan sirup manis",
					},
					{
						name: "Pastry Modern",
						description: "Dessert fusion, macarons, cheesecake, dan craft pastries",
					},
				],
				"Raw Food & Wellness Cafes": [
					{
						name: "Smoothie & Acai Bowls",
						description: "Buah tropis, granola, dan serutan kelapa",
					},
					{
						name: "Raw Vegan Plates",
						description: "Sayuran mentah, biji-bijian, dan makanan fermentasi",
					},
					{
						name: "Detox & Cleanse Programs",
						description: "Program diet dengan green juice dan menu organik berbasis sayur",
					},
					{
						name: "Superfood Lattes",
						description: "Matcha, kunyit, spirulina, dan minuman susu nabati",
					},
				],
			},
			konaklama: [
				{
					name: "Hotel Butik",
					description: "Dekat pusat Ubud, menyatu dengan alam, konsep kamar terbatas",
				},
				{
					name: "Resort View Hutan & Sawah",
					description: "Tenang dan mewah dengan pemandangan hutan dan teras sawah",
				},
				{
					name: "Vila dengan Kolam Pribadi",
					description: "Ideal untuk bulan madu dan menginap lebih lama",
				},
				{
					name: "Eco Lodge & Hotel Bambu",
					description: "Akomodasi berkelanjutan dan ramah alam",
				},
				{
					name: "Guesthouse & Pusat Yoga Retreat",
					description: "Fokus pada long stay dan pengalaman spiritual",
				},
			],
			konaklamaSuresi: "4 hari",
			konaklamaBudgeti: "USD 1.000–1.500",
			alisveris: [
				{
					name: "Pasar Ubud",
					description: "Pasar paling terkenal di Ubud untuk tekstil tradisional, seni, dan kerajinan",
				},
				{
					name: "Pasar Festival Seni Ubud",
					description: "Pasar musiman dengan lukisan, patung, dan dekorasi karya seniman lokal",
				},
				{
					name: "Desa Kerajinan Tegallalang",
					description: "Pasar dekat teras sawah untuk ukiran kayu dan suvenir",
				},
				{
					name: "Workshop Batik & Perak",
					description: "Toko batik dan perhiasan perak—bisa melihat proses pembuatannya",
				},
				{
					name: "Ubud Shopping Mall",
					description: "Pusat belanja modern di pusat Ubud dengan brand dan produk lokal",
				},
				{
					name: "Ukiran Kayu Buatan Tangan",
					description: "Topeng, patung, dan dekorasi",
				},
				{
					name: "Perhiasan Perak",
					description: "Dibuat handmade oleh pengrajin lokal",
				},
				{
					name: "Lukisan & Karya Seni",
					description: "Dari desa-desa seniman di Ubud",
				},
				{
					name: "Produk Yoga & Meditasi",
					description: "Matras, pakaian, dan aksesori alami",
				},
				{
					name: "Kosmetik Alami",
					description: "Sabun, minyak, dupa",
				},
				{
					name: "Tekstil & Batik",
					description: "Syal, pareo, kain tenun",
				},
				{
					name: "Suvenir Bertema Bali",
					description: "Simbol budaya dan dekorasi",
				},
			],
		},
		kuta: {
			description:
				"Kuta adalah destinasi pantai paling terkenal di Bali, dikenal dengan spot selancar kelas dunia, pemandangan sunset ikonik, dan suasana pantai yang ramai. Sebagai salah satu pusat wisata, Kuta menawarkan banyak pilihan akomodasi, kuliner, dan hiburan untuk pencinta olahraga air maupun pelancong.",
			gezilecekYerler: [
				{
					name: "Pantai Kuta",
					description: "Berselancar, berenang, dan menikmati matahari terbenam",
				},
				{
					name: "Pantai Legian",
					description: "Di sebelah Kuta—lebih tenang dengan ombak selancar yang bagus",
				},
				{
					name: "Jalan Legian",
					description: "Nightlife, bar, dan klub",
				},
				{
					name: "Beachwalk Mall",
					description: "Belanja, kafe, dan restoran",
				},
				{
					name: "Waterbom Bali",
					description: "Salah satu waterpark terbaik di Asia—aktivitas seharian",
				},
				{
					name: "Pura Tanah Lot",
					description: "Ambil foto sunset di pura ikonik di atas laut",
				},
			],
			aktiviteler: [
				{
					name: "Selancar",
					description: "Ombak ideal untuk pemula; tersedia kursus selancar 1:1 di sepanjang pantai",
					icon: "🏄",
				},
				{
					name: "Jet Ski",
					description: "Aktivitas adrenalin singkat di Pantai Kuta",
					icon: "🚤",
				},
				{
					name: "Banana Boat",
					description: "Aktivitas air seru untuk grup",
					icon: "🛥️",
				},
				{
					name: "Parasailing",
					description: "Pengalaman terbang dengan pemandangan laut",
					icon: "🪂",
				},
				{
					name: "Berenang",
					description: "Pantai luas berpasir—perhatikan ombak yang kuat",
					icon: "🏊",
				},
				{
					name: "Beach Club & Bar",
					description: "Musik sepanjang hari, suasana sunset, dan bersosialisasi",
					icon: "🍹",
				},
				{
					name: "Klub Malam",
					description: "Kuta punya nightlife paling ramai di Bali",
					icon: "🎉",
				},
				{
					name: "Tur ATV",
					description: "Off-road melewati lumpur, hutan, dan jalur desa sekitar",
					icon: "🏍️",
				},
				{
					name: "Spa & Pijat",
					description: "Pijat Bali dan refleksi dengan harga terjangkau",
					icon: "💆",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"🔹 Lokal / Indonesia – Balinese": [
					{
						name: "Nasi Goreng",
						description: "Nasi goreng pedas dengan sayur dan telur; bisa dengan ayam atau polos",
					},
					{
						name: "Mie Goreng",
						description: "Mie goreng pedas dengan sayur dan ayam",
					},
					{
						name: "Nasi Campur",
						description: "Nasi dengan ayam, sayur, telur, dan aneka lauk kecil",
					},
					{
						name: "Sate Ayam",
						description: "Sate ayam panggang disajikan dengan saus kacang",
					},
					{
						name: "Gado-Gado",
						description: "Salad sayur rebus dan telur dengan saus kacang",
					},
					{
						name: "Soto Ayam",
						description: "Sup ayam jahe dan rempah—ringan tapi mengenyangkan",
					},
				],
				"🔹 Masakan Barat": [
					{
						name: "Pizza & Pasta",
						description: "Restoran Italia banyak, biasanya memakai bahan segar",
					},
					{
						name: "Burger & Steak",
						description: "Gaya Amerika dan Australia",
					},
					{
						name: "Seafood",
						description: "Ikan bakar, udang, dan calamari",
					},
				],
				"🔹 Masakan Turki – Tersedia di Sekitar": [
					{
						name: "Cappadocia Turkish Restaurant (Canggu - 15 min)",
						description:
							"Jl. Munduk Catu No.3 (Canggu). AUTHENTIC Turkish. Pide, Döner, Adana Kebab, Meze, Baklava. 4.7/5 ⭐ TripAdvisor. +62 812-3841-1575",
					},
					{
						name: "Sumak Turkish Cuisine (Seminyak/Kerobokan - 15 min)",
						description:
							"MICHELIN LEVEL Turkish authentic. Adana Kebab, Iskender, Turkish Dumplings, Baklava. 4.8/5 ⭐ TripAdvisor. sumakbali.com",
					},
					{
						name: "Istanbul Meze Kebab House (Kerobokan - 10 min)",
						description:
							"Mezze segar, kebab, manti, babaganoush. 4.2/5 ⭐ TripAdvisor. Tempat shisha dan ada opsi vegetarian.",
					},
				],
				"🔹 Minuman Non-Alkohol": [
					{
						name: "Air Kelapa",
						description: "Segar dan mudah ditemukan di penjual kaki lima",
					},
					{
						name: "Jus Mangga / Nanas / Pepaya",
						description: "Alami dan tanpa gula",
					},
					{
						name: "Jus Alpukat",
						description: "Khas Bali—kental dan mengenyangkan",
					},
					{
						name: "Kopi Bali",
						description: "Kopi lokal dengan rasa kuat",
					},
					{
						name: "Teh Jahe",
						description: "Menyegarkan dan menenangkan perut",
					},
				],
			},
			konaklama: [
				{
					name: "Resort Pantai Mewah",
					description: "Hotel 5 bintang dengan akses pantai langsung dan infinity pool",
				},
				{
					name: "Hotel Pantai Butik",
					description: "Hotel desain stylish dengan layanan berkualitas",
				},
				{
					name: "Hotel Pantai Budget",
					description: "Cocok untuk traveler muda dan liburan hemat",
				},
				{
					name: "Bungalow Pantai",
					description: "Nyaman dan terjangkau, dekat pantai dengan taman pribadi",
				},
				{
					name: "Vila Mewah dengan Kolam",
					description: "Vila nyaman dengan kolam pribadi",
				},
			],
			konaklamaSuresi: "3 hari",
			konaklamaBudgeti: "USD 700–1.000",
			alisveris: [
				{
					name: "Beachwalk Mall",
					description: "Mall modern di tepi pantai Kuta dengan brand internasional dan lokal",
				},
				{
					name: "Discovery Shopping Mall",
					description: "Pusat belanja dengan fashion, elektronik, dan kebutuhan rumah",
				},
				{
					name: "Kuta Square",
					description: "Area terbuka yang menjual kerajinan lokal, tekstil, dan suvenir",
				},
				{
					name: "Legian Street Market",
					description: "Pasar malam dengan produk desainer lokal dan suvenir budaya",
				},
				{
					name: "Tanah Lot Craft Market",
					description: "Pasar dekat Tanah Lot untuk kerajinan Bali dan hadiah",
				},
				{
					name: "Pakaian & Perlengkapan Selancar",
					description: "Brand seperti Rip Curl, Billabong; papan selancar dan perlengkapan",
				},
				{
					name: "Pakaian Pantai",
					description: "Celana pendek, dress, pareo, sandal, dan aksesori pantai",
				},
				{
					name: "Kaos Bertema Bali",
					description: "Oleh-oleh populer; sangat terjangkau",
				},
				{
					name: "Topeng & Patung Kayu",
					description: "Kerajinan tradisional Bali; bisa custom desain",
				},
				{
					name: "Gelang & Perhiasan Handmade",
					description: "Bisa tawar-menawar di pasar; banyak warna dan desain",
				},
				{
					name: "Magnet & Suvenir Kecil",
					description: "Mudah dibawa; banyak di toko turis",
				},
			],
		},
		seminyak: {
			description:
				"Seminyak adalah kawasan pantai paling mewah dan berkelas di Bali. Dipenuhi beach club terkenal, restoran gourmet, serta hotel dan vila upscale, Seminyak cocok untuk traveler yang mencari kenyamanan, gaya, dan nightlife yang lebih ‘polished’.",
			gezilecekYerler: [
				{ name: "Pantai Seminyak", description: "Salah satu pantai paling populer di Bali—terkenal untuk sunset dan suasana beachfront" },
				{ name: "Jalan Oberoi", description: "Jalan trendi dengan restoran mewah, kafe, dan butik" },
				{ name: "Double Six Beach Club", description: "Beach club populer untuk party saat sunset dan dining berkelas" },
				{ name: "Seminyak Village", description: "Area belanja dengan butik, galeri seni, dan toko desainer" },
				{ name: "Kompleks Kafe & Restoran", description: "Banyak pilihan kuliner dunia dan menu Bali yang terkenal" },
				{ name: "Jalur Jalan Santai Umalas", description: "Jalan santai dekat Seminyak melewati area hijau dan sawah" },
				{ name: "Pura Petitenget", description: "Pura kecil untuk melihat budaya Hindu Bali" },
				{ name: "Ku De Ta (Area Beachfront)", description: "Spot ikonik dengan view laut dan atmosfer sunset" },
			],
			aktiviteler: [
				{ name: "Pantai & Berenang", description: "Pantai Seminyak luas dan berpasir—cocok untuk santai dan berenang", icon: "🏊" },
				{ name: "Pengalaman Beach Club", description: "Habiskan seharian di Potato Head, Ku De Ta, dan tempat sejenis", icon: "🍹" },
				{ name: "Spa & Wellness", description: "Pijat Bali, aromaterapi, dan spa premium", icon: "💆" },
				{ name: "Yoga & Pilates", description: "Kelas di studio atau di area pantai, cocok untuk semua level", icon: "🧘" },
				{ name: "Menikmati Sunset", description: "Sunset di bar pantai dan beach club", icon: "🌅" },
				{ name: "Tour Kafe & Restoran", description: "Area ini punya konsentrasi restoran terbaik di Bali", icon: "🍽️" },
				{ name: "Nightlife", description: "Bar dan lounge yang lebih elegan dibanding Kuta", icon: "🎉" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"🔹 Lokal / Indonesia – Balinese": [
					{ name: "Nasi Campur", description: "Nasi dengan ayam, sayur, dan aneka lauk khas Bali" },
					{ name: "Nasi Goreng", description: "Nasi goreng pedas dengan telur" },
					{ name: "Sate Ayam", description: "Sate ayam panggang dengan saus kacang" },
					{ name: "Gado-Gado", description: "Sayuran dan telur dengan saus kacang yang kental" },
					{ name: "Soto Ayam", description: "Sup ayam ringan berbumbu" },
					{ name: "Tempeh & Tofu", description: "Protein lokal berbahan kedelai—digoreng atau ditumis" },
				],
				"🔹 Kuliner Gourmet & Fine Dining": [
					{ name: "Mozaic Beach Club", description: "Fine dining dengan sentuhan fusion Indonesia dan internasional" },
					{ name: "Kayuputi", description: "Fine dining—seafood dan menu modern terinspirasi Bali" },
					{ name: "Kafe Wayan Restaurant", description: "Rasa Balinese dan Jawa dalam suasana yang elegan" },
				],
				"🔹 Kuliner Beach Club": [
					{ name: "Double Six Dining", description: "Menu Mediterania dan internasional dengan view pantai" },
					{ name: "Bali Hai Cliff Club", description: "Seafood dan menu global dengan pemandangan" },
					{ name: "Menu Beach Club Seminyak", description: "Cemilan santai dan koktail dengan live music" },
				],
				"🔹 Makan Santai": [
					{ name: "Warung & Restoran Lokal", description: "Masakan Bali tradisional dengan harga lebih terjangkau" },
					{ name: "Kafe & Kedai Kopi", description: "Espresso dan tempat duduk outdoor sangat umum" },
				],
				"🔹 Masakan Turki – Sumak Turkish Cuisine (dekat Kerobokan)": [
					{
						name: "Sumak Turkish Cuisine",
						description:
							"Sekitar 3–5 km dari Seminyak (10–15 menit). Menu Turki autentik seperti Adana kebab, Iskender, manti, baklava, dan meze. (Info mengikuti keterangan venue.)",
					},
					{ name: "Opsi Döner & Kebab", description: "Döner dan aneka kebab (lamb/ayam) tergantung menu" },
					{ name: "Pide & Roti Turki", description: "Pide dan roti buatan sendiri" },
				],
				"🔹 Minuman Non-Alkohol": [
					{ name: "Smoothie & Smoothie Bowl", description: "Dibuat dari buah tropis" },
					{ name: "Jus Buah Segar", description: "Mangga, nanas, semangka, dragon fruit" },
					{ name: "Teh Herbal", description: "Jahe, serai, mint" },
					{ name: "Cold Brew & Specialty Coffee", description: "Kedai kopi third-wave cukup banyak" },
					{ name: "Air Kelapa", description: "Alami dan menyegarkan" },
				],
			},
			konaklama: [
				{ name: "Hotel Bintang 4", description: "Desain modern, dekat pantai, biasanya ada kolam" },
				{ name: "Hotel & Resort Bintang 5", description: "Akomodasi mewah dengan fasilitas spa dan beach club" },
				{ name: "Vila dengan Kolam", description: "Kolam privat—cocok untuk pasangan dan grup" },
				{ name: "Hotel Butik", description: "Konsep lebih kecil, stylish, dan tenang" },
				{ name: "Apartemen Servis", description: "Cocok untuk long stay dan budget fleksibel" },
			],
			konaklamaSuresi: "3 hari",
			konaklamaBudgeti: "USD 900–1.300",
			alisveris: [
				{ name: "Seminyak Village", description: "Butik, pakaian desainer, dan galeri seni" },
				{ name: "Belanja di Jalan Oberoi", description: "Brand premium dan toko desainer independen" },
				{ name: "Petitenget Gallery", description: "Seni, perhiasan, dan barang dekoratif" },
				{ name: "Toko Beachfront Seminyak", description: "Beachwear, perlengkapan selancar, dan brand olahraga" },
				{ name: "Pasar Kerajinan Lokal", description: "Produk handmade, suvenir, dan tekstil" },
				{ name: "Butik Desainer", description: "Label fashion lokal dan internasional" },
				{ name: "Pakaian Resort & Pantai", description: "Dress chic, pareo, sandal" },
				{ name: "Perhiasan Handmade", description: "Perak, batu alam, dan desain boho" },
				{ name: "Dekorasi Rumah", description: "Produk kayu dan bambu khas Bali" },
				{ name: "Kosmetik Alami & Produk Spa", description: "Minyak kelapa, sabun, dupa" },
				{ name: "Suvenir", description: "Aksesori minimalis bertema Bali" },
			],
		},
		uluwatu: {
			description:
				"Uluwatu adalah kawasan tebing paling dramatis di Bali. Terkenal dengan Pura Uluwatu di atas tebing, spot selancar ikonik, dan beach club dengan view laut. Sunset dan pertunjukan tari Kecak menjadi daya tarik utama.",
			gezilecekYerler: [
				{ name: "Pura Uluwatu", description: "Menikmati sunset dan pertunjukan tari Kecak di pura tepi tebing" },
				{ name: "Pantai Pasir Putih", description: "Pantai yang lebih tenang—populer untuk selancar dan snorkeling" },
				{ name: "Pantai Padang Padang", description: "Teluk kecil untuk berenang dan foto" },
				{ name: "Pantai Suluban / Blue Point", description: "Pantai selancar yang diakses lewat jalur mirip gua" },
				{ name: "Pantai Bingin", description: "Teluk yang lebih sepi untuk sunset dan jalan santai" },
				{ name: "Pantai Dreamland", description: "Pantai berpasir luas untuk berenang dan berjemur" },
				{ name: "Pantai Melasti", description: "Air turquoise, pemandangan tebing, dan spot foto" },
				{ name: "Single Fin", description: "Cliff bar ikonik dengan view sunset" },
			],
			aktiviteler: [
				{ name: "Selancar (Advanced)", description: "Reef break terkenal—lebih cocok untuk peselancar berpengalaman", icon: "🏄" },
				{ name: "Pantai & Berenang", description: "Nikmati cove alami—perhatikan pasang surut", icon: "🏊" },
				{ name: "Cliff Beach Club Experience", description: "Kolam dengan view laut dan relaks seharian", icon: "🏖️" },
				{ name: "Menikmati Sunset", description: "Salah satu sunset paling spektakuler di Bali dari area tebing", icon: "🌅" },
				{ name: "Yoga & Meditasi", description: "Sesi outdoor di suasana alam yang tenang", icon: "🧘" },
				{ name: "Spa & Pijat", description: "Wellness dengan pemandangan laut", icon: "💆" },
				{ name: "Fotografi & Drone", description: "Tebing dan view laut turquoise sangat fotogenik", icon: "📸" },
				{ name: "Eksplor Pantai dengan Perahu", description: "Trip singkat ke cove sekitar", icon: "🚤" },
				{ name: "Snorkeling", description: "Eksplor reef dengan panduan lokal", icon: "🤿" },
				{ name: "Pertunjukan Tari Kecak", description: "Pertunjukan tradisional Bali di Pura Uluwatu", icon: "🎭" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Lokal / Indonesia – Balinese": [
					{ name: "Nasi Goreng (Gaya Uluwatu)", description: "Nasi goreng spesial dengan seafood dan rempah lokal" },
					{ name: "Ikan Bakar", description: "Ikan segar hasil tangkapan harian, dibakar dengan bumbu Bali" },
					{ name: "Sate Ayam", description: "Sate ayam panggang dengan saus kacang" },
					{ name: "Nasi Campur", description: "Nasi dengan ayam, sayur, dan aneka lauk" },
				],
				"Beach Club & Fine Dining": [
					{ name: "Seafood Platter", description: "Aneka seafood segar—grill atau saus ala Asia" },
					{ name: "Gourmet Fusion", description: "Fusion Asia–Barat dengan view laut" },
					{ name: "Steak & Grill", description: "Pilihan daging premium" },
				],
				"Minuman Non-Alkohol": [
					{ name: "Air Kelapa", description: "Segar dan alami" },
					{ name: "Jus Buah Segar", description: "Mangga, pepaya, nanas, semangka" },
					{ name: "Smoothie & Detox Drinks", description: "Menyegarkan dan bernutrisi" },
					{ name: "Kopi Bali", description: "Kopi lokal dengan aroma kuat" },
					{ name: "Teh Herbal", description: "Jahe, serai, chamomile" },
				],
				"Masakan Barat": [
					{ name: "Restoran Fine Dining", description: "Kualitas masak dan plating premium" },
					{ name: "Steakhouse & Seafood", description: "Daging dan seafood premium" },
					{ name: "Masakan Mediterania", description: "Rasa Yunani, Spanyol, dan Italia" },
					{ name: "Masakan Italia", description: "Pasta, risotto, dan menu klasik" },
					{ name: "Menu Vegan & Sehat", description: "Pilihan organik dan seimbang" },
				],
				"Masakan Turki – Tersedia di Sekitar (Kuta ~30 menit)": [
					{
						name: "Cappadocia Turkish Restaurant (Canggu - 25–30 menit)",
						description:
							"Masakan Turki autentik seperti pide, döner, Adana kebab, meze, baklava. (Info mengikuti keterangan venue.)",
					},
					{
						name: "Istanbul Meze Kebab House (Kerobokan - 20 menit)",
						description:
							"Meze segar, kebab, manti, babaganoush. Juga dikenal sebagai tempat shisha dan ada opsi vegetarian.",
					},
				],
			},
			konaklama: [
				{ name: "Resort View Tebing", description: "Konsep mewah di tepi tebing dengan view laut" },
				{ name: "Hotel Bintang 5", description: "Akses pantai privat, spa, dan fine dining" },
				{ name: "Vila dengan Kolam", description: "Infinity pool—cocok untuk pasangan dan honeymoon" },
				{ name: "Hotel Butik", description: "Tenang, stylish, dan menyatu dengan alam" },
				{ name: "Surf Lodge & Guesthouse", description: "Pilihan praktis dan lebih terjangkau untuk surfer" },
			],
			konaklamaSuresi: "3 hari",
			konaklamaBudgeti: "USD 1.100–1.700",
			alisveris: [
				{ name: "Toko Beach Club Uluwatu", description: "Surfwear, bikini, dan beachwear" },
				{ name: "Pasar Kerajinan Lokal", description: "Kerajinan tangan, perhiasan, dan dekorasi" },
				{ name: "Toko Surf & Water Sports", description: "Papan selancar, pakaian, dan perlengkapan" },
				{ name: "Galeri Seni", description: "Lukisan dan patung dari seniman lokal" },
				{ name: "Suvenir Bertema Bali", description: "Replika pura dan aksesori tradisional" },
			],
		},
		nusaDua: {
			description:
				"Nusa Dua adalah kawasan resort paling premium dan tertata di Bali. Dibangun sebagai kompleks pariwisata terencana, area ini memiliki resort kelas dunia, lapangan golf, fasilitas yachting, dan water sports. Pantainya tenang dan aman dengan air jernih—pilihan utama untuk liburan mewah.",
			gezilecekYerler: [
				{ name: "Pantai Nusa Dua", description: "Laut tenang untuk berenang dan berjemur" },
				{ name: "Water Blow", description: "Fenomena ombak menghantam karang—spot foto populer" },
				{ name: "Pantai Geger", description: "Lebih lokal, lebih tenang, airnya jernih" },
				{ name: "Bali Collection", description: "Kompleks belanja, restoran, dan kafe" },
				{ name: "Museum PASIFIKA", description: "Koleksi seni Asia-Pasifik" },
				{ name: "Puputan Monument", description: "Monumen terkait sejarah Bali" },
				{ name: "Turtle Island (Pulau Penyu)", description: "Pulau untuk melihat penyu (kunjungi dengan bertanggung jawab)" },
				{ name: "Bali Nusa Dua Convention Center", description: "Pusat event/konferensi dan kadang pertunjukan budaya" },
			],
			aktiviteler: [
				{ name: "Jet Ski", description: "Pengalaman kecepatan tinggi di area yang terkontrol", icon: "🏎️" },
				{ name: "Banana Boat", description: "Aktivitas air seru untuk keluarga dan grup", icon: "🍌" },
				{ name: "Parasailing", description: "Terbang dengan view panorama laut", icon: "🪂" },
				{ name: "Snorkeling", description: "Mengamati karang dan ikan di air yang tenang dan jernih", icon: "🤿" },
				{ name: "Scuba Diving", description: "Opsi untuk pemula maupun penyelam bersertifikat", icon: "🤿" },
				{ name: "Berenang", description: "Salah satu pantai paling tenang di Bali", icon: "🏊" },
				{ name: "Golf", description: "Lapangan golf standar internasional dengan view laut", icon: "⛳" },
				{ name: "Spa & Wellness", description: "Spa resort mewah dengan treatment khas Bali", icon: "💆" },
				{ name: "Tur Sepeda", description: "Rute datar di area resort dan sepanjang pantai", icon: "🚴" },
				{ name: "Tur Perahu", description: "Yachting dan eksplor perairan sekitar", icon: "⛵" },
				{ name: "Sunset Cruise", description: "Pengalaman dinner cruise romantis", icon: "🌅" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Lokal / Indonesia – Balinese": [
					{ name: "Nasi Goreng", description: "Nasi goreng pedas ala lokal" },
					{ name: "Sate Lilit", description: "Sate cincang khas Bali (sering ikan) dengan bumbu aromatik" },
					{ name: "Bebek Betutu", description: "Bebek dimasak lama dengan rempah" },
				],
				"Fine Dining": [
					{ name: "Restoran Kelas Michelin", description: "Masakan dan presentasi tingkat tinggi" },
					{ name: "Masakan Internasional", description: "Pilihan Eropa, Asia, dan Amerika" },
					{ name: "Restoran Spesialis Seafood", description: "Olahan seafood segar khas restoran" },
				],
				"Minuman Non-Alkohol": [
					{ name: "Jus Buah Segar", description: "Dari buah tropis Bali" },
					{ name: "Kopi Bali", description: "Kopi lokal dengan aroma kuat" },
					{ name: "Smoothie & Detox", description: "Dibuat dari buah dan sayur organik" },
				],
				"Masakan Turki – Tersedia di Sekitar (Kuta ~40 menit)": [
					{
						name: "Sumak Turkish Cuisine (Seminyak - 35–40 menit)",
						description:
							"Menu Turki seperti Adana kebab, Iskender, manti, baklava. (Info mengikuti keterangan venue.)",
					},
					{
						name: "Cappadocia Turkish Restaurant (Canggu - 40–45 menit)",
						description:
							"Masakan Turki autentik seperti pide, döner, Adana kebab, meze, baklava. (Info mengikuti keterangan venue.)",
					},
				],
			},
			konaklama: [
				{
					name: "Resort Bintang 5",
					description:
						"Properti besar dengan private beach, opsi half-board atau all-inclusive",
				},
				{ name: "Hotel Ultra Mewah", description: "Konsep vila privat dengan layanan butler" },
				{ name: "Hotel Beachfront", description: "Menginap tepat di pantai, suasana tenang dan aman" },
				{ name: "Resort Ramah Keluarga", description: "Kids club, water park, dan aktivitas keluarga" },
				{ name: "Vila dengan Kolam", description: "Cocok untuk yang ingin lebih privat dan tenang" },
			],
			konaklamaSuresi: "3 hari",
			konaklamaBudgeti: "USD 1.300–2.000",
			alisveris: [
				{ name: "Bali Collection", description: "Brand internasional dan butik mewah" },
				{ name: "Nusa Dua Plaza", description: "Produk trendi dan elektronik" },
				{ name: "Resort Shops", description: "Toko desainer di dalam hotel" },
				{ name: "Toko Suvenir Beachfront", description: "Suvenir dan hadiah khas Bali" },
				{ name: "Toko Jam & Perhiasan", description: "Jam dan perhiasan premium" },
				{ name: "Kerajinan Tangan", description: "Ukiran kayu dan topeng Bali" },
				{ name: "Batik & Tekstil", description: "Syal, pareo, dan kain tenun" },
				{ name: "Kosmetik Alami & Produk Spa", description: "Minyak, sabun, dan set perawatan" },
				{ name: "Toko Resort", description: "Hadiah mewah dan aksesori pantai" },
				{ name: "Produk Foto & Kenang-kenangan", description: "Magnet, kartu pos, dan dekorasi kecil" },
			],
		},
		canggu: {
			description:
				"Canggu adalah kawasan paling trendi dan dinamis di Bali. Terkenal dengan spot selancar yang bagus, kafe dan bar yang hip, boutique hotel dengan desain keren, serta komunitas kreatif anak muda. Canggu juga favorit digital nomad dan profesional muda, dengan nightlife yang sangat hidup.",
			gezilecekYerler: [
				{ name: "Pantai Batu Bolong", description: "Selancar, sunset, dan jalan santai di pantai" },
				{ name: "Echo Beach", description: "Spot selancar, restoran tepi pantai, dan spot foto" },
				{ name: "Pantai Berawa", description: "Area pantai luas dan banyak beach club" },
				{ name: "Pura Tanah Lot", description: "Pura ikonik di atas laut dan view sunset" },
				{ name: "Sawah", description: "Jalan santai dan foto-foto" },
				{ name: "Spot Street Art Canggu", description: "Mural modern dan titik seni" },
				{ name: "Finns Beach Club", description: "Beach club populer dengan musik dan sunset" },
				{ name: "Old Man's", description: "Bar terkenal dekat spot selancar" },
				{ name: "Padma Utara Temple", description: "Pura Hindu yang tenang dan otentik" },
				{ name: "Betelnut Cafe", description: "Kafe trendi dan Instagram-friendly" },
				{ name: "Bali Swing", description: "Pengalaman ayunan di area hutan" },
				{ name: "Warung Bodag Baruna", description: "Restoran seafood tepi pantai" },
				{ name: "Canggu Komputer", description: "Nuansa pasar lokal untuk pengalaman yang lebih autentik" },
				{ name: "Pantai Batu Mejan", description: "Pantai lokal yang lebih sepi" },
				{ name: "Goa Gajah Tembuku", description: "Spot gua/pura dengan nuansa alam dan sejarah" },
				{ name: "Pantai Pererenan", description: "Pantai yang lebih tersembunyi dan tenang" },
			],
			aktiviteler: [
				{ name: "Selancar", description: "Ombak cocok untuk pemula dan menengah", icon: "🏄" },
				{ name: "Kursus Selancar", description: "Private atau grup dengan instruktur bersertifikat", icon: "🏄" },
				{ name: "Tur ATV", description: "Off-road melewati sawah dan jalur desa", icon: "🏍️" },
				{ name: "Yoga & Meditasi", description: "Studio yoga kelas dunia dan retreat center", icon: "🧘" },
				{ name: "Spa & Pijat", description: "Pijat Bali, aromaterapi, dan terapi relaksasi", icon: "💆" },
				{ name: "Berenang", description: "Opsi laut atau kolam", icon: "🏊" },
				{ name: "Beach Club Experience", description: "Musik seharian, santai, dan bersosialisasi", icon: "🏖️" },
				{ name: "Tur Sepeda & Scooter", description: "Eksplor bebas sepanjang pantai dan jalur desa", icon: "🚴" },
				{ name: "Menikmati Sunset", description: "Sunset di pantai dan beach club", icon: "🌅" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Lokal / Indonesia – Balinese": [
					{ name: "Nasi Goreng", description: "Nasi goreng pedas ala lokal" },
					{ name: "Satay & BBQ", description: "Aneka gaya daging panggang" },
					{ name: "Gado-Gado", description: "Salad sayur dengan saus kacang" },
					{ name: "Lumpia", description: "Lumpia goreng dengan isian berbumbu" },
					{ name: "Perkedel", description: "Perkedel kentang renyah" },
					{ name: "Rendang", description: "Gulai daging bersantan dengan rempah kuat" },
				],
				"Kafe & Healthy Food": [
					{ name: "Organic Brunch", description: "Menu brunch sehat dan organik" },
					{ name: "Vegan & Vegetarian", description: "Pilihan makanan berbasis nabati" },
					{ name: "Smoothie & Bowls", description: "Açaí bowl dan smoothie bowl" },
				],
				"International & Fusion": [
					{ name: "Modern Asian Cuisine", description: "Rasa Asia kontemporer" },
					{ name: "Mediterranean", description: "Menu ala Mediterania" },
					{ name: "Mexican & Latin", description: "Masakan Meksiko dan Amerika Latin" },
				],
				"Masakan Turki – Cappadocia Turkish Restaurant": [
					{
						name: "Cappadocia Turkish Restaurant",
						description:
							"Berlokasi di Canggu (Jl. Munduk Catu No.3). Menu Turki seperti pide, döner, Adana kebab, meze, manti, baklava, Turkish coffee. (Info mengikuti keterangan venue.)",
					},
					{ name: "Pide & Manti", description: "Pide dan manti buatan sendiri" },
					{ name: "Aneka Kebab", description: "Adana kebab, lamb shish, chicken kebab (tergantung menu)" },
					{ name: "Meze & Appetizer", description: "Hummus, baba ganoush, tzatziki, dolma, dan lainnya" },
					{ name: "Dessert Turki", description: "Baklava dan dessert klasik" },
				],
				"Minuman Non-Alkohol": [
					{ name: "Air Kelapa", description: "Alami dan segar" },
					{ name: "Smoothie Bowls", description: "Campuran buah dan superfood" },
					{ name: "Jus Buah Segar", description: "Mangga, nanas, pepaya" },
					{ name: "Cold Brew Coffee", description: "Pilihan cold brew populer" },
					{ name: "Teh Herbal", description: "Jahe, serai" },
					{ name: "Es Jeruk", description: "Minuman jeruk khas—manis dan menyegarkan" },
				],
			},
			konaklama: [
				{ name: "Hotel Bintang 4–5", description: "Desain modern, dekat pantai, banyak area sosial" },
				{ name: "Vila dengan Kolam", description: "Kolam privat—cocok untuk pasangan dan grup" },
				{ name: "Hotel Butik", description: "Fokus desain, stylish, dan tenang" },
				{ name: "Hostel & Co-Living", description: "Populer untuk digital nomad dan traveler muda" },
				{ name: "Surf Lodge", description: "Akomodasi untuk surfer dengan dukungan gear" },
			],
			konaklamaSuresi: "4 hari",
			konaklamaBudgeti: "USD 1.100–1.600",
			alisveris: [
				{ name: "Canggu Street Shops", description: "Toko desainer lokal dan butik" },
				{ name: "Vintage & Thrift Store", description: "Pakaian vintage dan item retro" },
				{ name: "Yoga & Sportswear", description: "Pakaian yoga dan olahraga" },
				{ name: "Galeri Seni", description: "Karya seniman lokal" },
				{ name: "Aksesori Kafe", description: "Produk kecil terkait coffee culture" },
				{ name: "Toko Selancar", description: "Papan, wetsuit, dan perlengkapan" },
				{ name: "Butik Desainer Lokal", description: "Pakaian gaya Bali" },
				{ name: "Beachwear & Aksesori", description: "Pareo, topi, tas" },
				{ name: "Perhiasan Handmade", description: "Perak, batu alam, dan kayu" },
				{ name: "Produk Yoga & Olahraga", description: "Matras, apparel, dan aksesori" },
				{ name: "Suvenir dari Kafe", description: "Biji kopi, mug, tote bag" },
			],
		},
		sanur: {
			description:
				"Sanur adalah kota pantai yang tenang dan ramah keluarga di Bali. Dengan laguna yang terlindungi, air laut yang lebih tenang, pasar ikan tradisional, dan atmosfer lokal, Sanur cocok untuk traveler yang ingin suasana santai dan Bali yang lebih otentik.",
			gezilecekYerler: [
				{ name: "Pantai Sanur", description: "Pantai terlindungi—ideal untuk berenang dan jalan santai" },
				{ name: "Pasar Sanur", description: "Pasar ikan tradisional dan produk lokal" },
				{ name: "Pura Belanjong", description: "Pura Hindu bersejarah dan monumen" },
				{ name: "Spot Sunrise", description: "Salah satu spot sunrise terbaik di Bali" },
				{ name: "Pelangi Beach Club", description: "Beach club modern untuk santai" },
				{ name: "Jalur Pantai Sanur", description: "Jalur panjang untuk sepeda, jogging, dan jalan kaki" },
				{ name: "Pantai Sindhu", description: "Suasana pantai tenang dengan kafe lokal" },
				{ name: "Museum Le Mayeur", description: "Koleksi seni dan budaya Bali dari pelukis Belgia" },
				{ name: "Bali Orchid Garden", description: "Taman anggrek tropis—cocok untuk foto" },
				{ name: "Pulau Serangan", description: "Konservasi penyu dan pantai yang lebih sepi" },
			],
			aktiviteler: [
				{ name: "Berenang", description: "Laut dangkal dan minim ombak—aman untuk anak", icon: "🏊" },
				{ name: "Snorkeling", description: "Melihat karang dan ikan dekat pantai", icon: "🤿" },
				{ name: "Tur Sepeda", description: "Jalur sepeda dan jalan kaki di tepi pantai", icon: "🚴" },
				{ name: "Yoga & Meditasi", description: "Sesi outdoor di suasana pantai yang tenang", icon: "🧘" },
				{ name: "Spa & Pijat", description: "Pijat Bali dan terapi relaksasi", icon: "💆" },
				{ name: "Kano & Paddle Board", description: "Aktivitas dayung di laut yang tenang", icon: "🚣" },
				{ name: "Menikmati Sunrise", description: "Sanur sangat terkenal untuk sunrise", icon: "🌅" },
				{ name: "Tur Perahu Nelayan", description: "Merasakan kehidupan nelayan lokal", icon: "⛵" },
				{ name: "Tur Pasar Ikan", description: "Kunjungi pasar pagi untuk melihat aktivitas lokal", icon: "🐟" },
				{ name: "Workshop Kerajinan", description: "Belajar kerajinan dengan seniman lokal", icon: "🎨" },
				{ name: "Tur Memancing Malam", description: "Melihat aktivitas memancing malam dengan lampu", icon: "🌙" },
				{ name: "Konservasi Penyu", description: "Ikut program konservasi", icon: "🐢" },
				{ name: "Tari Tradisional Bali", description: "Belajar/menonton tari budaya Bali", icon: "💃" },
				{ name: "Beach Cleanup", description: "Aktivitas komunitas yang ramah lingkungan", icon: "🌍" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Lokal / Indonesia – Balinese": [
					{ name: "Nasi Goreng", description: "Nasi goreng pedas dengan sayur dan telur" },
					{ name: "Nasi Campur", description: "Nasi dengan ayam, sayur, dan lauk khas Bali" },
					{ name: "Sate Ayam", description: "Sate ayam dengan saus kacang" },
					{ name: "Soto Ayam", description: "Sup ayam berbumbu" },
					{ name: "Ayam Betutu", description: "Ayam berbumbu yang dimasak lama" },
					{ name: "Tempeh & Tofu", description: "Menu kedelai—digoreng atau ditumis" },
					{ name: "Lumpia", description: "Lumpia goreng dengan isian berbumbu" },
					{ name: "Perkedel", description: "Perkedel kentang renyah" },
					{ name: "Rendang", description: "Gulai daging bersantan" },
					{ name: "Ikan Bakar", description: "Ikan segar bakar dengan jeruk nipis dan rempah" },
				],
				"Masakan Barat": [
					{ name: "Masakan Mediterania", description: "Rasa Yunani, Spanyol, dan Italia" },
					{ name: "Pizza & Pasta Italia", description: "Menu Italia dengan bahan segar" },
					{ name: "Restoran Seafood", description: "Spesialis seafood segar" },
					{ name: "Vegan & Vegetarian", description: "Pilihan plant-based dan sehat" },
					{ name: "Beach Café & Brunch", description: "Opsi sarapan organik dan segar" },
				],
				"Masakan Turki": [
					{ name: "Döner", description: "Döner Turki klasik" },
					{ name: "Aneka Kebab", description: "Berbagai gaya dan olahan kebab" },
					{ name: "Pide", description: "‘Pizza’ ala Turki dengan berbagai topping" },
					{ name: "Manti", description: "Pangsit Turki dengan saus yogurt" },
					{ name: "Çiğ Köfte", description: "Bulgur pedas (sering disajikan vegetarian)" },
					{ name: "Lahmacun", description: "Roti tipis ala Turki dengan topping daging cincang" },
					{ name: "Aneka Meze", description: "Hummus, muhammara, tzatziki, dan lainnya" },
					{ name: "Turki & Timur Tengah", description: "Restoran yang menyajikan menu Turki dan Timur Tengah" },
				],
				"Minuman Non-Alkohol": [
					{ name: "Air Kelapa", description: "Segar dan alami" },
					{ name: "Jus Buah Segar", description: "Jeruk, mangga, nanas" },
					{ name: "Teh Herbal", description: "Jahe, serai" },
					{ name: "Kopi Bali", description: "Aroma kuat dari biji kopi lokal" },
					{ name: "Iced Coffee & Smoothie", description: "Cold brew dan smoothie buah" },
					{ name: "Es Jeruk", description: "Minuman jeruk khas—manis dan menyegarkan" },
					{ name: "Teh Dingin", description: "Es teh manis ala lokal" },
				],
			},
			konaklama: [
				{ name: "Hotel Pantai Bintang 4–5", description: "Beachfront, tenang, dan area luas" },
				{ name: "Hotel Butik", description: "Skala kecil, damai, gaya lokal" },
				{ name: "Hotel Ramah Keluarga", description: "Kolam anak dan akses pantai yang aman" },
				{ name: "Vila dengan Kolam", description: "Akomodasi privat di area yang lebih tenang" },
				{ name: "Hotel Long Stay", description: "Tipe apartemen/residence" },
			],
			konaklamaSuresi: "3 hari",
			konaklamaBudgeti: "USD 900–1.300",
			alisveris: [
				{ name: "Sanur Market", description: "Produk lokal di pasar tradisional" },
				{ name: "Batik & Tekstil", description: "Batik dan kain tenun" },
				{ name: "Galeri Seni", description: "Lukisan dan patung dari seniman lokal" },
				{ name: "Suvenir", description: "Suvenir dan dekorasi bertema Bali" },
				{ name: "Beachwear & Aksesori", description: "Pakaian pantai dan aksesori" },
				{ name: "Seafood & Pasar Ikan Lokal", description: "Ikan dan seafood segar dari nelayan" },
				{ name: "Toko Perhiasan Handmade", description: "Perhiasan handmade dan perak" },
				{ name: "Kerajinan Kayu & Patung", description: "Ukiran kayu dan patung handmade" },
				{ name: "Kedai Kopi Lokal", description: "Biji kopi Bali dan produk kopi" },
				{ name: "Produk Organik & Sehat", description: "Produk organik, natural, dan teh herbal" },
				{ name: "Suvenir Perahu Tradisional", description: "Model perahu dan hadiah bertema nelayan" },
				{ name: "Pasar Rempah & Herbal", description: "Rempah, herbal lokal, dan campuran bumbu" },
				{ name: "Kerajinan Kerang", description: "Produk kerajinan dari kerang dan tema laut" },
				{ name: "Tas Anyaman & Dekorasi Rumah", description: "Tas anyaman dan dekorasi" },
				{ name: "Toko Antik & Vintage", description: "Barang antik dan vintage" },
			],
		},
		munduk: {
			description:
				"Munduk adalah kota pegunungan yang tenang di Bali utara—hijau, sejuk, dan menenangkan. Dengan danau kawah, perkebunan kopi, air terjun, dan perbukitan berkabut, Munduk cocok untuk pecinta alam.",
			gezilecekYerler: [
				{ name: "Danau Beratan", description: "Area danau untuk kunjungan pura dan wisata perahu" },
				{ name: "Pura Ulun Danu Bratan", description: "Pura ikonik di atas danau" },
				{ name: "Munduk Waterfall (Labuhan Kebo)", description: "Air terjun bertingkat di hutan berkabut" },
				{ name: "Perkebunan Kopi", description: "Produksi kopi luwak dan sesi tasting" },
				{ name: "Bukit Asah Viewpoint", description: "View pegunungan dan spot foto" },
				{ name: "Danau Buyan", description: "Jalan alam yang tenang dan aktivitas ringan di air" },
				{ name: "Melanting Waterfall", description: "Trekking hutan dan pengalaman alam" },
				{ name: "Red Coral Waterfall", description: "Air terjun dengan bebatuan kemerahan" },
				{ name: "Twin Lakes Viewpoint (Buyan & Tamblingan)", description: "Viewpoint dengan pemandangan dua danau" },
				{ name: "Danau Tamblingan", description: "Jalan santai yang sepi dan canoe" },
				{ name: "Desa Munduk", description: "Melihat kehidupan lokal dan budaya" },
				{ name: "Asah Goblek Waterfall", description: "Air terjun dua tingkat, lebih sepi" },
				{ name: "Wanagiri Hidden Hills", description: "Dek foto dan teras dengan view danau" },
				{ name: "Goa Gajah Tembuku (Bat Cave)", description: "Gua kelelawar dengan suasana mistis" },
				{ name: "Pura Batu Karu", description: "Pura dataran tinggi dengan view pegunungan" },
				{ name: "Sunset Point Munduk", description: "Spot sunset yang bagus" },
				{ name: "Pasar Tradisional Lokal", description: "Melihat hasil bumi dan aktivitas harian" },
				{ name: "Kunjungan Farm Organik", description: "Kunjungan ke kebun/peternakan lokal" },
				{ name: "Wildlife Sanctuary", description: "Birdwatching dan observasi alam" },
			],
			aktiviteler: [
				{ name: "Trekking & Nature Walk", description: "Jalur hutan, rute air terjun, dan eksplor pegunungan", icon: "🥾" },
				{ name: "Tur Air Terjun", description: "Mengunjungi beberapa air terjun dalam satu rute", icon: "💧" },
				{ name: "Fotografi", description: "Gunung berkabut, danau, dan lanskap hutan", icon: "📸" },
				{ name: "Tur Kopi & Rempah", description: "Perkebunan kopi dan cengkeh", icon: "☕" },
				{ name: "Yoga & Meditasi", description: "Suasana pegunungan yang sejuk dan tenang", icon: "🧘" },
				{ name: "Birdwatching", description: "Mengamati burung endemik Bali", icon: "🦅" },
				{ name: "Tur Sepeda", description: "Rute menurun dengan pemandangan pegunungan", icon: "🚴" },
				{ name: "Menikmati Sunrise", description: "View danau dan lembah dari ketinggian", icon: "🌅" },
				{ name: "Canoe & Kayak di Danau", description: "Dayung santai di Danau Beratan", icon: "🛶" },
				{ name: "Forest Bathing", description: "Terapi alam dan jalan mindful di hutan", icon: "🌲" },
				{ name: "Jeep Safari", description: "Off-road ke desa pegunungan dan jalur ladang", icon: "🚙" },
				{ name: "Spa Herbal & Pijat", description: "Terapi alami dengan herbal lokal", icon: "💆" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Lokal / Indonesia – Balinese": [
					{ name: "Nasi Goreng", description: "Nasi goreng pedas" },
					{ name: "Sate Ayam", description: "Sate ayam dengan saus kacang" },
					{ name: "Gado-Gado", description: "Salad sayur dengan saus kacang" },
					{ name: "Perkedel", description: "Perkedel kentang" },
					{ name: "Lumpia", description: "Lumpia goreng" },
					{ name: "Tempeh Goreng", description: "Tempe goreng renyah" },
					{ name: "Nasi Kuning", description: "Nasi kuning dengan kunyit" },
					{ name: "Soto Ayam", description: "Sup ayam berbumbu" },
					{ name: "Lalapan", description: "Sayur mentah dengan sambal/saus" },
				],
				"Kopi & Teh": [
					{ name: "Kopi Bali", description: "Kopi lokal dengan aroma kuat" },
					{ name: "Kopi Luwak", description: "Kopi premium terkenal dari Bali" },
					{ name: "Teh Herbal", description: "Jahe, serai, dan herbal lokal" },
					{ name: "Teh Dingin", description: "Es teh manis" },
				],
				"Masakan Barat": [
					{ name: "Pasta & Pizza", description: "Menu bergaya Italia" },
					{ name: "Salad & Sayur", description: "Sayuran organik lokal yang segar" },
					{ name: "Roti & Pastry", description: "Roti buatan sendiri dan bakery" },
					{ name: "Burger", description: "Burger dengan bahan segar" },
				],
				"Minuman Non-Alkohol": [
					{ name: "Air Kelapa", description: "Segar dan alami" },
					{ name: "Jus Buah Segar", description: "Pepaya, mangga, nanas" },
					{ name: "Smoothie Bowls", description: "Campuran buah dan superfood" },
					{ name: "Minuman Jahe (Jahe Hangat)", description: "Minuman jahe hangat yang menenangkan" },
					{ name: "Wedang Jahe", description: "Minuman jahe hangat tradisional" },
					{ name: "Jamu", description: "Minuman herbal dengan kunyit dan jahe" },
					{ name: "Es Cendol", description: "Minuman es manis dengan jelly hijau" },
					{ name: "Bandrek", description: "Minuman jahe berbumbu" },
				],
			},
			konaklama: [
				{ name: "Hotel Butik di Alam", description: "Suasana tenang dengan view hutan/lembah" },
				{ name: "Lodge Pegunungan & Hutan", description: "Arsitektur kayu, menyatu dengan alam" },
				{ name: "Vila View", description: "Teras privat dengan view lembah berkabut" },
				{ name: "Eco-Lodge & Bungalow", description: "Akomodasi ramah lingkungan" },
				{ name: "Guesthouse", description: "Akomodasi hangat yang dikelola keluarga lokal" },
			],
			konaklamaSuresi: "2–3 hari",
			konaklamaBudgeti: "USD 600–900",
			alisveris: [
				{ name: "Produk Kopi", description: "Kopi Bali dan biji kopi luwak" },
				{ name: "Kerajinan Lokal", description: "Produk kayu dan anyaman handmade" },
				{ name: "Produk Organik", description: "Hasil kebun organik dari petani lokal" },
				{ name: "Teh Herbal", description: "Herbal lokal dan campuran teh" },
				{ name: "Suvenir", description: "Hadiah dan dekorasi bertema Bali" },
				{ name: "Produk Cengkeh", description: "Teh cengkeh, minyak cengkeh, aromaterapi" },
				{ name: "Sabun & Produk Kecantikan Handmade", description: "Sabun dan produk kecantikan buatan tangan" },
				{ name: "Kerajinan Kayu", description: "Ukiran kayu dan dekorasi" },
				{ name: "Keranjang Anyaman & Tekstil", description: "Keranjang anyaman dan kain" },
				{ name: "Madu & Produk Lebah", description: "Madu lokal dan produk lebah" },
				{ name: "Obat Herbal & Jamu", description: "Ramuan herbal tradisional" },
				{ name: "Seni & Lukisan", description: "Lukisan dari seniman lokal" },
				{ name: "Rempah & Herbal Kering", description: "Rempah kering dan campuran herbal" },
				{ name: "Keramik & Pottery", description: "Produk keramik dan tembikar" },
				{ name: "Pewarna Alami & Batik", description: "Produk batik dengan pewarna alami" },
			],
		},

		amed: {
			description:
				"Amed adalah kota kecil yang tenang di pesisir timur laut Bali dan terkenal untuk diving. Ada spot menyelam yang mudah untuk semua usia, snorkeling, bangkai kapal, serta terumbu karang yang hidup. Jauh dari keramaian turis, Amed cocok untuk pengalaman Bali yang lebih santai dan otentik.",
			gezilecekYerler: [
				{ name: "Pantai Amed", description: "Pantai pasir hitam yang panjang, cocok untuk berenang dan snorkeling" },
				{ name: "Japanese Patrol Boat Wreck", description: "Bangkai kapal untuk diving, juga bisa dilihat saat snorkeling" },
				{ name: "Teluk Lipah", description: "Teluk tenang dengan house reef dan karang" },
				{ name: "Pura Lempuyang", description: "Pura ikonik di pegunungan untuk menikmati pemandangan" },
				{ name: "Teluk Jemeluk", description: "Teluk terlindungi untuk snorkeling yang aman" },
				{ name: "Gunung Agung", description: "Gunung tertinggi di Bali—trekking dan spot view" },
				{ name: "Pantai Bunutan", description: "Pilihan pantai lain dengan turis lebih sedikit" },
				{ name: "Pantai Banyuning", description: "Suasana nelayan lokal dan atmosfer yang otentik" },
				{ name: "Amed Reef", description: "Area snorkeling dengan terumbu karang" },
				{ name: "Pura Puncak Penulisan", description: "Pura di pegunungan dengan pemandangan" },
				{ name: "Air Terjun Aling", description: "Air terjun dan jalan-jalan alam" },
				{ name: "Seraya Secret", description: "Area terumbu yang lebih dalam untuk diving" },
				{ name: "East Bali Shelters", description: "Arsitektur modern dan area pantai" },
				{ name: "Basmati Museum", description: "Museum seni dan budaya" },
				{ name: "Coral Garden", description: "Taman karang yang dilindungi" },
				{ name: "Salt Ponds", description: "Pembuatan garam tradisional dan kehidupan lokal" },
				{ name: "Pantai Tulamben (dekat)", description: "Bangkai kapal dan pusat diving populer" },
				{ name: "Japanese Garden", description: "Spot diving berupa taman bawah laut" },
			],
			aktiviteler: [
				{ name: "Diving (Sertifikasi PADI)", description: "Kursus diving dari pemula hingga lanjutan", icon: "🤿" },
				{ name: "Snorkeling", description: "Mengamati terumbu karang dan ikan", icon: "🏊" },
				{ name: "Eksplorasi Bangkai Kapal", description: "Mengunjungi bangkai kapal bersejarah dengan diving", icon: "⚓" },
				{ name: "Yoga & Meditasi", description: "Relaksasi dan ketenangan di suasana pantai", icon: "🧘" },
				{ name: "Observasi Ikan", description: "Fotografi bawah laut dan mengamati kehidupan laut", icon: "📷" },
				{ name: "Tur Perahu", description: "Tur perahu di sepanjang pesisir Amed", icon: "⛵" },
				{ name: "Trekking Gunung", description: "Trekking Gunung Agung dan sunrise", icon: "🥾" },
				{ name: "Spa & Pijat", description: "Terapi relaksasi dengan suasana laut", icon: "💆" },
				{ name: "Night Dive", description: "Hewan laut nokturnal dan plankton bercahaya", icon: "🌙" },
				{ name: "Fotografi Makro", description: "Foto detail untuk biota laut kecil", icon: "📸" },
				{ name: "Fotografi Bawah Laut", description: "Sesi fotografi bawah laut secara profesional", icon: "🎥" },
				{ name: "Kano & Kayak", description: "Aktivitas air di perairan tenang dan dekat pantai", icon: "🛶" },
				{ name: "Sport Fishing", description: "Tur memancing dan petualangan", icon: "🎣" },
				{ name: "Edukasi Biologi Laut", description: "Tur edukasi untuk mengenal marine life", icon: "🐠" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Lokal / Indonesia – Balinese": [
					{ name: "Nasi Goreng", description: "Nasi goreng pedas" },
					{ name: "Sate Ayam", description: "Sate ayam panggang dengan saus kacang" },
					{ name: "Ikan Bakar", description: "Ikan segar bakar" },
					{ name: "Gado-Gado", description: "Salad sayur dengan saus kacang" },
					{ name: "Perkedel", description: "Perkedel kentang, renyah dan keemasan" },
					{ name: "Lumpia", description: "Lumpia goreng" },
					{ name: "Satay Lilit", description: "Sate lilit berbumbu (umumnya ayam/ikan)" },
					{ name: "Uduk Udukan", description: "Sate ikan segar yang dipanggang" },
					{ name: "Tahu Goreng", description: "Tahu goreng renyah" },
				],
				"Seafood & Ikan": [
					{ name: "Seafood Segar", description: "Tangkapan hari ini dan aneka seafood" },
					{ name: "Grilled Lobster", description: "Lobster bakar" },
					{ name: "Calamari", description: "Cumi goreng" },
					{ name: "Fish Soup", description: "Sup ikan gaya lokal" },
				],
				"Masakan Barat": [
					{ name: "Pasta & Pizza", description: "Menu bergaya Italia" },
					{ name: "Salad", description: "Sayuran organik segar" },
					{ name: "Burger & Sandwich", description: "Pilihan yang ringan namun mengenyangkan" },
				],
				"Minuman Non-Alkohol": [
					{ name: "Air Kelapa", description: "Segar dan alami" },
					{ name: "Jus Buah Segar", description: "Aneka buah tropis" },
					{ name: "Kopi Bali", description: "Kopi lokal" },
					{ name: "Smoothie Bowls", description: "Minuman/bowl sehat" },
					{ name: "Es Jeruk", description: "Minuman jeruk khas—manis dan menyegarkan" },
					{ name: "Teh Dingin", description: "Es teh manis ala lokal" },
					{ name: "Jamu", description: "Minuman herbal dengan kunyit dan jahe" },
					{ name: "Wedang Jahe", description: "Minuman jahe hangat tradisional" },
					{ name: "Bandrek", description: "Minuman jahe berbumbu, resep tradisional" },
				],
			},
			konaklama: [
				{ name: "Hotel Butik Tepi Pantai", description: "Suasana tenang, dekat spot diving" },
				{ name: "Hotel Diving & Snorkeling", description: "Dukungan alat, guide, dan perahu" },
				{ name: "Vila dengan Kolam", description: "Pemandangan laut atau Gunung Agung" },
				{ name: "Eco-Lodge & Bungalow", description: "Sederhana, tenang, dekat alam" },
				{ name: "Guesthouse & Penginapan", description: "Cocok untuk long stay dan budget" },
				{ name: "Kapal Liveaboard Diving", description: "Menginap di kapal sekaligus ikut trip diving" },
				{ name: "Hotel Yoga Retreat & Wellness", description: "Paket yoga, meditasi, dan spa" },
				{ name: "Vila Akses Pantai Privat", description: "Vila dengan akses pantai privat" },
				{ name: "Suite Bulan Madu & Romantis", description: "Kamar khusus untuk pasangan" },
				{ name: "Resort Ramah Keluarga", description: "Area anak dan aktivitas keluarga" },
				{ name: "Hostel Budget & Backpacker", description: "Hostel untuk traveler yang suka bersosialisasi" },
				{ name: "Glamping Tepi Pantai", description: "Pengalaman camping mewah di dekat laut" },
				{ name: "Paket Diving All-Inclusive", description: "Akomodasi + dive guide + perlengkapan" },
			],
			konaklamaSuresi: "3–4 hari",
			konaklamaBudgeti: "USD 500–800",
			alisveris: [
				{ name: "Kopi & Rempah Lokal", description: "Biji kopi, cengkeh, kayu manis" },
				{ name: "Produk Kayu Handmade", description: "Dekorasi kecil" },
				{ name: "Sabun & Minyak Alami", description: "Produk herbal dan aromatik" },
				{ name: "Tekstil Tenun", description: "Syal dan kain penutup" },
				{ name: "Madu Lokal & Produk Alami", description: "Madu organik dan produk lokal" },
				{ name: "Suvenir Bertema Alam", description: "Produk batu, bambu, dan kayu" },
				{ name: "Perlengkapan Diving & Suvenir", description: "Masker, fin, kaos bertema diving" },
				{ name: "Perhiasan Bertema Laut", description: "Koleksi dan jewelry" },
				{ name: "Cetakan Foto Bawah Laut", description: "Print foto bawah laut profesional" },
				{ name: "Produk Pasar Ikan Lokal", description: "Ikan asap dan seafood kering" },
				{ name: "Beach Wear & Swimwear", description: "Koleksi pakaian pantai" },
				{ name: "Handmade Jewellery", description: "Perhiasan dan aksesori buatan tangan" },
				{ name: "Produk Kelapa Organik", description: "Minyak kelapa dan turunannya" },
				{ name: "Seni Bali & Kanvas", description: "Seni bertema laut dari seniman lokal" },
				{ name: "Produk Vegan & Eco-Friendly", description: "Produk ramah lingkungan" },
				{ name: "Aksesori Yoga & Wellness", description: "Matras yoga dan bantal meditasi" },
			],
		},
	},
	java: {
		yogyakarta: {
			description:
				"Yogyakarta adalah pusat budaya Jawa dan bekas kota kerajaan. Dengan candi terkenal seperti Borobudur dan Prambanan, tradisi seni yang kuat, serta kuliner jalanan yang hidup, kota ini menjadi salah satu tempat terbaik di Indonesia untuk merasakan budaya Jawa yang autentik.",
			gezilecekYerler: [
				{ name: "Candi Borobudur", description: "Situs UNESCO—kompleks candi Buddha terbesar di dunia" },
				{ name: "Candi Prambanan", description: "Kompleks candi Hindu yang megah dengan puncak-puncak dramatis" },
				{ name: "Kraton (Keraton Sultan)", description: "Istana kerajaan yang masih aktif di Yogyakarta" },
				{ name: "Taman Sari (Istana Air)", description: "Taman air kerajaan abad ke-18 dan kompleks pemandian" },
				{ name: "Jalan Malioboro", description: "Jalan ikonik untuk belanja, street food, dan suasana malam" },
				{ name: "Gua Jomblang", description: "Gua spektakuler dengan ‘cahaya surga’ yang masuk ke hutan bawah tanah" },
				{ name: "Benteng Vredeburg", description: "Benteng Belanda bersejarah dan museum di pusat kota" },
				{ name: "Kotagede", description: "Bekas ibu kota Mataram—arsitektur tradisional dan kerajinan perak" },
				{ name: "Museum Sonobudoyo", description: "Museum budaya Jawa: wayang, tekstil, topeng, dan gamelan" },
				{ name: "Museum Ullen Sentalu", description: "Museum budaya keraton di lereng Gunung Merapi" },
				{ name: "Monumen Tugu", description: "Ikon kota Yogyakarta, dibangun oleh Sultan Hamengkubuwono VI" },
				{ name: "Gunung Merapi", description: "Gunung api aktif dengan pemandangan epik dan opsi trekking" },
				{ name: "Kaliurang", description: "Area dataran tinggi di lereng Merapi—udara sejuk dan panorama alam" },
				{ name: "Pantai Parangtritis", description: "Pantai pasir hitam terkenal di selatan kota—bagus untuk sunset" },
				{ name: "Pantai Ngobaran", description: "Pantai alami di Gunung Kidul dengan lanskap karang" },
				{ name: "Pantai Ngrenehan", description: "Teluk cantik di antara bukit batu—terkenal seafood" },
				{ name: "Gesing Wonderland", description: "Area rekreasi bernuansa alam dengan view hutan dan pegunungan" },
				{ name: "Obelix Sea View", description: "Titik pandang di Gunung Kidul untuk panorama laut dan sunset" },
			],
			aktiviteler: [
				{ name: "Tur Sunrise (Borobudur)", description: "Menyaksikan matahari terbit di area candi", icon: "🌅" },
				{ name: "Tur Candi Prambanan", description: "Tur berpemandu di kompleks candi Hindu ikonik", icon: "🏛️" },
				{ name: "Workshop Batik", description: "Belajar membuat batik dari pengrajin lokal", icon: "🎨" },
				{ name: "Jeep Safari Merapi", description: "Petualangan off-road jeep di sekitar gunung api", icon: "🚙" },
				{ name: "Tur Off-Road Merapi", description: "Menjelajah lanskap vulkanik dengan 4x4", icon: "🚙" },
				{ name: "Kunjungan Candi Kalasan", description: "Kompleks candi Buddha lebih kecil menuju Prambanan", icon: "🏛️" },
				{ name: "Tur Situs Ratu Boko", description: "Mengunjungi reruntuhan istana kuno dekat Prambanan", icon: "🏰" },
				{ name: "Kunjungan Kebun Binatang", description: "Aktivitas keluarga di kebun binatang dan taman", icon: "🦁" },
				{ name: "Ramayana Ballet", description: "Pertunjukan tari tradisional di Prambanan", icon: "💃" },
				{ name: "Cave Tubing", description: "Menyusuri Gua Pindul dengan ban pelampung", icon: "🏊" },
				{ name: "Tur Sepeda Desa", description: "Bersepeda melewati desa tradisional dan pedesaan", icon: "🚴" },
			],
			yiyecekIcecekler: [
				{ name: "Gudeg", description: "Hidangan khas Yogya—nangka muda manis, biasanya dengan ayam dan telur" },
				{ name: "Ayam Goreng Mbok Berek", description: "Ayam goreng terkenal dengan racikan bumbu khas" },
				{ name: "Bakpia", description: "Kue tradisional dengan isian kacang hijau" },
				{ name: "Angkringan", description: "Warung kaki lima untuk camilan kecil, kopi, dan jajanan lokal" },
				{ name: "Wedang Ronde", description: "Minuman jahe hangat manis" },
				{ name: "Soto Yogyakarta", description: "Soto dengan racikan rempah khas lokal" },
				{ name: "Nasi Langgi (Sego Langgi)", description: "Nasi hangat dengan aneka lauk" },
				{ name: "Kipo", description: "Kue singkong berwarna hijau berisi kelapa manis" },
				{ name: "Jadah Tempe", description: "Ketan dengan tempe manis—snack klasik" },
				{ name: "Es Rujak", description: "Rujak buah dingin: mangga, pepaya, nanas, mentimun dan bumbu" },
				{ name: "Kopi Joss", description: "Kopi dengan arang panas—unik khas Yogya" },
				{ name: "Sate Klathak", description: "Sate kambing tradisional, sering memakai tusuk besi" },
				{ name: "Pizza", description: "Pizza ala Italia, banyak tersedia di area wisata" },
				{ name: "Hamburger", description: "Burger klasik" },
			],
			turkYemekleri: [
				{
					name: "Restoran Turki",
					description:
						"Ada beberapa tempat makan bergaya Turki di Yogyakarta (Kotagede, Caturtunggal, Cik Di Tiro, dll). Brand seperti Istanbul Kebab Turki, Kebab Turkiyem, dan Kebab Baba Rafi menyajikan döner, kebab, dan menu serupa.",
				},
			],
			konaklama: [
				{ name: "Hotel Bintang 3", description: "Nyaman dan terjangkau di sekitar Malioboro dan Keraton" },
				{ name: "Hotel Bintang 4", description: "Fasilitas lebih lengkap, sering ada kolam renang dan spa" },
				{ name: "Hotel Bintang 5", description: "Akomodasi mewah dengan layanan premium" },
				{ name: "Hotel Butik & Heritage", description: "Bangunan bersejarah dengan nuansa arsitektur Jawa" },
				{ name: "Hostel & Guesthouse", description: "Opsi hemat dengan suasana sosial" },
				{ name: "Vila Kolam Pribadi", description: "Vila privat, cocok untuk keluarga/grup" },
			],
			konaklamaSuresi: "3–4 hari",
			konaklamaBudgeti: "USD 450–800 (penginapan + makan + tur + aktivitas)",
			alisveris: [
				{ name: "Jalan Malioboro", description: "Batik, kerajinan, dan suvenir" },
				{ name: "Pasar Beringharjo", description: "Pasar tradisional untuk batik dan produk lokal" },
				{ name: "Sentra Batik Yogyakarta", description: "Workshop dan toko batik—bisa melihat proses pembuatan" },
				{ name: "Pasar Kerajinan Borobudur", description: "Dekat Borobudur: suvenir, perhiasan, dan kerajinan" },
				{ name: "Matahari Department Store", description: "Belanja modern dengan brand populer" },
				{ name: "Pasar Ngasem", description: "Pasar untuk jajanan, kebutuhan harian, dan oleh-oleh kecil" },
				{ name: "Malioboro Mall", description: "Mall pusat kota dengan berbagai toko" },
				{ name: "Galleria Mall", description: "Mall kecil dengan food court" },
				{ name: "Kotagede", description: "Area terkenal untuk kerajinan perak" },
				{ name: "Hamzah Batik (Mirota Batik)", description: "Toko besar untuk batik dan kerajinan" },
				{ name: "Tjokrosuharto", description: "Toko kerajinan sejak 1954: wayang, batik, keris, dll" },
			],
		},
		pangandaran: {
			description:
				"Pangandaran adalah kota pesisir yang tenang di selatan Jawa, dikenal dengan keindahan alamnya. Pantai bersih, terumbu karang, spot menyelam, serta hutan hijau membuatnya cocok untuk pecinta alam—lebih sepi dari keramaian wisata dan terasa lebih lokal.",
			gezilecekYerler: [
				{ name: "Pantai Pangandaran", description: "Garis pantai panjang—cocok untuk berenang dan berjemur" },
				{ name: "Taman Nasional Pangandaran", description: "Kawasan laut terlindungi dengan terumbu karang, ikan, dan Monkey Beach" },
				{ name: "Citumang", description: "Sungai di antara bebatuan—jalan santai dan spot air tenang" },
				{ name: "Green Canyon", description: "Ngabuburit di sungai hijau—boat ride, tebing batu, dan trekking" },
				{ name: "Pantai Batu Karas", description: "Pantai lebih tenang, populer untuk snorkeling dan diving" },
				{ name: "Akuarium Pangandaran", description: "Pusat edukasi dan akuarium kehidupan laut" },
				{ name: "Batu Hue", description: "Formasi batu dan viewpoint di tepi pantai" },
				{ name: "Air Terjun Banyu Tibo", description: "Air terjun bertingkat dengan jalur jalan kaki singkat" },
				{ name: "Pantai Cigamea", description: "Pantai panjang dan relatif bersih" },
				{ name: "Puncak Batu Karas", description: "Viewpoint di bukit—bagus untuk sunset" },
				{ name: "Grotto Beach", description: "Area pantai seperti gua—cocok untuk eksplor singkat" },
				{ name: "Kampung Nelayan", description: "Desa nelayan lokal dengan suasana harian pesisir" },
				{ name: "Pantai Pasir Putih", description: "Area pantai pasir putih" },
				{ name: "Bukit Panenjoan Viewpoint", description: "Pemandangan panorama garis pantai" },
			],
			aktiviteler: [
				{ name: "Diving (Sertifikasi PADI)", description: "Kursus diving pemula hingga lanjutan", icon: "🤿" },
				{ name: "Snorkeling", description: "Melihat terumbu karang dan ikan", icon: "🏊" },
				{ name: "Kano & Kayak", description: "Tur kayak di Green Canyon", icon: "🛶" },
				{ name: "Trekking Alam", description: "Rute trekking hutan dan perbukitan", icon: "🥾" },
				{ name: "Observasi Marine Life", description: "Fotografi bawah laut dan melihat biota laut", icon: "📷" },
				{ name: "Sunset Boat Ride", description: "Menikmati sunset dari laut", icon: "⛵" },
				{ name: "Spa & Pijat", description: "Pijat relaksasi dan opsi pemandian air panas", icon: "💆" },
				{ name: "Kunjungan Desa Lokal", description: "Berinteraksi dengan warga dan mengenal kehidupan Jawa", icon: "🏘️" },
				{ name: "Fotografi Bawah Laut", description: "Sesi foto bawah laut profesional", icon: "📸" },
				{ name: "Fotografi Alam", description: "Air terjun, pantai, dan lanskap", icon: "📷" },
				{ name: "Trekking Air Terjun", description: "Trekking ke Banyu Tibo dan air terjun sekitar", icon: "💧" },
				{ name: "ATV & Sepeda Gunung", description: "Petualangan off-road di jalur menantang", icon: "🚙" },
				{ name: "Citumang Body Rafting", description: "Mengapung/berenang di aliran sungai berbatu", icon: "🏊" },
				{ name: "Tur Taman Nasional", description: "Eksplorasi berpemandu di taman nasional", icon: "🌳" },
				{ name: "Jet Ski", description: "Olahraga air yang cepat dan seru", icon: "🚤" },
				{ name: "Banana Boat", description: "Wahana air seru bersama rombongan", icon: "🛥️" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Lokal / Jawa – Indonesia": [
					{ name: "Nasi Goreng", description: "Nasi goreng pedas" },
					{ name: "Soto Ayam", description: "Sup ayam berbumbu" },
					{ name: "Bakso", description: "Sup bakso—klasik Indonesia" },
					{ name: "Soto Jawa", description: "Soto tradisional yang umum di Jawa" },
					{ name: "Gado-Gado", description: "Salad sayur dengan saus kacang" },
					{ name: "Cuanki", description: "Street food populer: dumpling tahu/kentang dalam kuah" },
					{ name: "Perkedel", description: "Perkedel kentang" },
					{ name: "Sate Ayam", description: "Sate ayam dengan saus kacang" },
				],
				"Seafood & Ikan": [
					{ name: "Seafood Segar", description: "Tangkapan hari ini dan aneka seafood" },
					{ name: "Ikan Bakar", description: "Ikan segar yang dibakar" },
					{ name: "Udang & Calamari", description: "Hidangan udang dan cumi" },
					{ name: "Sup Ikan", description: "Sup ikan ala lokal" },
				],
				"Masakan Barat": [
					{ name: "Pizza", description: "Pizza ala Italia di restoran wisata" },
					{ name: "Chicken Burger", description: "Burger ayam—opsi yang umum" },
					{ name: "Cheese Burger", description: "Burger keju—favorit banyak orang" },
					{ name: "Salad", description: "Sayuran organik segar" },
					{ name: "Sandwich", description: "Pilihan ringan namun mengenyangkan" },
				],
				"Minuman Non-Alkohol": [
					{ name: "Air Kelapa", description: "Segar dan alami" },
					{ name: "Jus Buah Segar", description: "Mangga, pepaya, nanas" },
					{ name: "Kopi Jawa", description: "Kopi lokal" },
					{ name: "Smoothie Bowls", description: "Minuman/bowl sehat" },
					{ name: "Es Cendol", description: "Minuman manis tropis dengan santan dan jelly hijau" },
					{ name: "Jamu", description: "Minuman herbal tradisional" },
					{ name: "Es Jeruk", description: "Minuman jeruk khas—segar" },
					{ name: "Bandrek", description: "Minuman jahe berbumbu—hangat dan menenangkan" },
				],
			},
			konaklama: [
				{ name: "Hotel Butik Dekat Pantai", description: "Suasana tenang, bisa jalan kaki ke pantai" },
				{ name: "Bungalow & Beach Huts", description: "Sederhana namun nyaman, dekat alam" },
				{ name: "Vila dengan Kolam", description: "Ruang privat dengan view laut atau hutan" },
				{ name: "Guesthouse & Pensi", description: "Budget-friendly, cocok untuk long stay" },
				{ name: "Resort Ramah Lingkungan", description: "Akomodasi berkonsep sustainable" },
			],
			konaklamaSuresi: "2–3 hari",
			konaklamaBudgeti: "USD 400–700",
			turkyemekleriNotu:
				"Tidak ada restoran Turki tradisional di Pangandaran. Pilihan utama adalah masakan lokal Indonesia dan seafood.",
			alisveris: [
				{ name: "Pasar Ikan Lokal", description: "Ikan asap dan seafood kering" },
				{ name: "Toko Pakaian Print Pangandaran", description: "Kaos, celana pendek, dan pakaian kasual" },
				{ name: "Kerajinan Handmade", description: "Produk kayu dan anyaman buatan tangan" },
				{ name: "Kopi & Rempah Lokal", description: "Kopi organik dan rempah daerah" },
				{ name: "Beach Wear & Swimwear", description: "Koleksi pakaian pantai" },
				{ name: "Seni Lokal & Suvenir", description: "Lukisan dan dekorasi" },
				{ name: "Produk Natural & Organik", description: "Sabun alami, minyak, dan produk kecantikan" },
			],
		},
		malang: {
			description:
				"Malang adalah kota bersejarah di Jawa Timur dan basis populer untuk petualangan Gunung Bromo. Berjarak sekitar 60–65 km dari Taman Nasional Bromo Tengger Semeru, kota ini ideal untuk tur sunrise dan trekking vulkanik. Malang juga dikenal dengan udara sejuk, arsitektur kolonial, dan kuliner lokal.",
			gezilecekYerler: [
				{
					name: "Taman Nasional Bromo Tengger Semeru",
					description: "Gunung api aktif, spot sunrise, dan ‘Sea of Sand’, sekitar 60–65 km dari Malang",
				},
				{ name: "Ijen Boulevard", description: "Boulevard kolonial bersejarah dengan bangunan tua" },
				{ name: "Jodipan Colorful Village", description: "Kampung warna-warni yang populer untuk foto" },
				{ name: "Candi Singosari", description: "Candi Hindu dari sekitar tahun 1300-an, sekitar 12 km utara" },
				{ name: "Pantai Balekambang", description: "Pantai pasir hitam di selatan Malang" },
				{ name: "Malang Night Paradise (Dino Park)", description: "Taman hiburan malam dengan replika dinosaurus" },
				{ name: "Candi Jago", description: "Candi Hindu abad ke-13 dekat Singosari" },
				{ name: "Candi Kidal", description: "Candi Hindu abad ke-13 di area Singosari" },
			],
			aktiviteler: [
				{
					name: "Tur Sunrise Bromo",
					description: "Berangkat dini hari dari Cemoro Lawang; paket tur umum saat akhir pekan",
					icon: "🌅",
				},
				{
					name: "Trekking Bromo",
					description: "Menyusuri Sea of Sand lalu naik ke bibir kawah—guide disarankan",
					icon: "🥾",
				},
				{ name: "Jeep Safari (Bromo)", description: "Tur jeep 4x4 di area pasir dan panorama pegunungan", icon: "🚙" },
				{ name: "Sewa Motor (DIY)", description: "Berkendara ke Bromo 2–3 jam—untuk yang berpengalaman", icon: "🏍️" },
				{ name: "Jalan Alam", description: "Jalur berjalan di pegunungan dan area ladang", icon: "🥾" },
				{ name: "Spa & Pijat", description: "Terapi relaksasi di kota Malang", icon: "💆" },
				{
					name: "Sanggar Senaputra – Tari Jawa Timur",
					description: "Pertunjukan tari tradisional dan workshop seni",
					icon: "💃",
				},
				{
					name: "Kolam Antik Ken Dedes",
					description: "Kolam pemandian antik dari kerajaan Singosari dekat Candi Singosari",
					icon: "🏛️",
				},
				{ name: "Pendakian Gunung", description: "Tur pendakian Panderman, Arjuna, dan sekitar", icon: "⛰️" },
				{ name: "Golf", description: "Lapangan golf dengan view Gunung Arjuna", icon: "⛳" },
				{ name: "Pantai Balekambang – Berenang", description: "Aktivitas pantai dan berenang", icon: "🏖️" },
				{ name: "Tur Candi Hindu", description: "Tur lengkap candi Singosari, Jago, dan Kidal", icon: "🏯" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Lokal / Jawa – Indonesia": [
					{ name: "Bakso Malang", description: "Bakso khas Malang dengan banyak variasi" },
					{ name: "Ayam Goreng Kampung", description: "Ayam kampung goreng yang renyah" },
					{ name: "Cwie Mie", description: "Mie khas Malang" },
					{ name: "Orem-orem", description: "Tempe, telur rebus, dan ayam dalam kuah santan" },
					{ name: "Jagung Bakar", description: "Jagung bakar dari pedagang kaki lima" },
					{ name: "Nasi Goreng", description: "Nasi goreng pedas" },
				],
				"Masakan Turki": [
					{ name: "Daging Panggang", description: "Ayam/domba panggang, tusuk sate, steak, dan meze" },
					{ name: "Pide", description: "Pide Turki dengan isian keju atau daging" },
					{ name: "Lahmacun", description: "‘Pizza’ Turki dengan daging cincang berbumbu" },
					{ name: "Mezze Timur Tengah", description: "Hummus, baba ghanoush, falafel, dll" },
					{ name: "Baklava & Dessert Turki", description: "Baklava, künefe, lokma, dan sejenisnya" },
				],
				"Masakan Barat": [
					{ name: "Signora Pasta", description: "Menu pasta ala Italia" },
					{ name: "Chefkim", description: "Pilihan makanan Korea" },
				],
				"Minuman Non-Alkohol": [
					{ name: "Kopi Jahe", description: "Kopi jahe yang kuat dan hangat" },
					{ name: "Jus Buah Segar", description: "Jus apel dan buah tropis" },
					{ name: "Apel Malang", description: "Apel hijau khas Malang—sangat segar" },
					{ name: "Milkshake Tropis", description: "Mango, strawberry, dan alpukat dari buah segar" },
					{ name: "Boba Tea / Bubble Tea", description: "Minuman teh modern dengan boba" },
					{ name: "Es Campur", description: "Minuman es campur dengan buah dan sirup" },
					{ name: "Air Kelapa", description: "Air kelapa segar" },
				],
			},
			konaklama: [
				{ name: "Hostel Budget", description: "Opsi populer untuk backpacker" },
				{ name: "Hotel Ekonomis", description: "Hotel sederhana dan bersih di pusat kota" },
				{ name: "Hotel Mid-Range", description: "Nyaman dengan fasilitas yang baik" },
				{ name: "Hotel Butik & Karakter", description: "Bangunan kolonial yang direstorasi" },
				{ name: "Hotel Mewah", description: "Layanan high-end dan pengalaman premium" },
			],
			konaklamaSuresi: "1–2 hari",
			konaklamaBudgeti: "USD 400–600",
			alisveris: [
				{ name: "Ijen Boulevard Market", description: "Pasar hari Minggu" },
				{ name: "Malang Town Square (Matos)", description: "Mall modern dengan bioskop dan hiburan" },
				{ name: "Soekarno Hatta Boulevard", description: "Kawasan makan, belanja, dan hiburan yang trendy" },
				{ name: "Mall Olympic Garden (MOG)", description: "Mall besar dengan fashion brand" },
				{ name: "Batik Keris", description: "Tekstil lokal dan kerajinan" },
				{ name: "Produk Apel Malang", description: "Apel segar dan olahannya" },
				{ name: "Fabulous Spa & Salon", description: "Perawatan spa dan pijat profesional" },
			],
		},
		banyuwangi: {
			description:
				"Banyuwangi adalah kota gerbang di ujung timur Jawa. Berjarak sekitar 30–40 km dari Kawah Ijen yang terkenal dengan fenomena blue fire dan danau kawah sulfur. Di sekitarnya ada Taman Nasional Baluran, Red Island Beach untuk snorkeling/diving, serta spot selancar kelas dunia G-Land.",
			gezilecekYerler: [
				{
					name: "Kawah Ijen (Ijen Crater)",
					description:
						"Fenomena blue fire, tambang belerang, dan danau kawah—30–40 km; trekking sunrise sangat populer",
				},
				{ name: "Red Island Beach", description: "Pantai pasir kemerahan—snorkeling, diving, dan pemandangan" },
				{
					name: "Bangsring Underwater",
					description: "Area snorkeling dengan terumbu karang dan ikan; tiket masuk sekitar 5.000 Rp",
				},
				{ name: "Taman Nasional Baluran", description: "Savanna, hutan, dan pantai dengan satwa liar" },
				{ name: "Taman Nasional Alas Purwo", description: "Taman alam yang terpencil dengan situs-situs kuno" },
				{ name: "G-Land (Grajagan Beach)", description: "Spot selancar terkenal dunia—cocok untuk advanced" },
				{ name: "Taman Blambangan", description: "Taman kota dengan pasar malam, street food, dan budaya lokal" },
				{ name: "Gallery & Museum Mozes Misdy", description: "Galeri seni modern dekat Pelabuhan Ketapang" },
				{ name: "Pertunjukan Gandrung", description: "Tarian ikonik Banyuwangi, digelar di hari tertentu" },
			],
			aktiviteler: [
				{ name: "Tur Blue Fire Ijen", description: "Pendakian malam 2–3 jam untuk melihat blue fire dan sunrise", icon: "🔵" },
				{ name: "Trekking Kawah Ijen", description: "Trekking pagi ke danau kawah dan area belerang", icon: "🥾" },
				{ name: "Diving & Snorkeling", description: "Biota laut di Bangsring dan Red Island", icon: "🤿" },
				{ name: "Selancar", description: "Selancar di G-Land atau spot yang lebih mudah", icon: "🏄" },
				{ name: "Jalan Alam", description: "Eksplor Baluran dan Alas Purwo", icon: "🥾" },
				{ name: "Feri ke Bali", description: "Menyeberang ke Gilimanuk sekitar 45 menit", icon: "⛴️" },
				{ name: "Red Island – Diving & Surf", description: "Gabungkan snorkeling/diving dan surfing", icon: "🌊" },
				{ name: "Pertunjukan Tari Gandrung", description: "Menonton seni tradisional khas Banyuwangi", icon: "💃" },
				{ name: "Tur Perkebunan Kopi Ijen", description: "Kunjungi perkebunan kopi dan coba kopi lokal", icon: "☕" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Hidangan Khas Banyuwangi": [
					{ name: "Rujak Soto", description: "Spesial Banyuwangi: rujak dipadukan kuah berbumbu" },
					{ name: "Pecel Rawon", description: "Rawon daging dengan pecel sayur" },
					{ name: "Sego Tempong", description: "Nasi dengan sambal pedas dan lauk" },
					{ name: "Nasi Cawuk", description: "Nasi berbumbu khas Banyuwangi" },
					{ name: "Onde-onde", description: "Camilan manis berbalut wijen" },
					{ name: "Uyah Asem", description: "Hidangan/rujak bercita rasa asin-asam khas" },
					{ name: "Pecel Pitik", description: "Ayam berbumbu pecel ala Banyuwangi" },
				],
				"Masakan Indonesia": [
					{ name: "Nasi Goreng", description: "Nasi goreng pedas" },
					{ name: "Ayam Goreng Kampung", description: "Ayam kampung goreng renyah" },
					{ name: "Sate Ayam", description: "Sate ayam" },
					{ name: "Gado-Gado", description: "Salad sayur dengan saus kacang" },
				],
				"Seafood & Ikan": [
					{ name: "Seafood Segar", description: "Ikan, udang, dan kerang segar" },
					{ name: "Ikan Bakar", description: "Ikan bakar atau asap" },
					{ name: "Sup Seafood", description: "Sup ikan/seafood" },
				],
				"Minuman Non-Alkohol": [
					{ name: "Kopi Ijen", description: "Kopi khas Dataran Tinggi Ijen" },
					{ name: "Jus Buah Tropis", description: "Jus segar dari buah tropis" },
					{ name: "Jamu", description: "Minuman herbal tradisional" },
					{ name: "Es Cendol", description: "Minuman santan dengan jelly hijau" },
				],
			},
			konaklama: [
				{ name: "Hotel Budget", description: "Dekat Pelabuhan Ketapang dan pusat kota" },
				{ name: "Hotel Mid-Range", description: "Opsi nyaman di area kota dan waterfront" },
				{ name: "Penginapan untuk Trek Ijen", description: "Akomodasi sederhana untuk start dini hari" },
			],
			konaklamaSuresi: "1–2 hari",
			konaklamaBudgeti: "USD 500–700",
			alisveris: [
				{ name: "Taman Blambangan", description: "Pasar malam, street food, dan produk lokal" },
				{ name: "Pasar Terminal Bus Brawijaya", description: "Tekstil dan kebutuhan harian" },
				{ name: "Gallery & Museum Mozes Misdy", description: "Galeri lukisan dan patung (bisa dibeli)" },
				{ name: "Toko Kerajinan Lokal", description: "Tekstil batik dan kerajinan tradisional" },
				{ name: "Pasar Ikan & Seafood", description: "Seafood segar harian dekat pelabuhan" },
				{ name: "Produk Perkebunan Ijen", description: "Kopi dan camilan lokal" },
			],
		},
		bandung: {
			description:
				"Bandung adalah kota pegunungan yang sejuk, sering dijuluki ‘Paris van Java’. Kota ini terkenal dengan Gunung Tangkuban Perahu, danau kawah Kawah Putih, kebun teh, belanja outlet, arsitektur Art Deco, serta kuliner Sunda yang lezat.",
			gezilecekYerler: [
				{ name: "Gunung Tangkuban Perahu", description: "Gunung api aktif sekitar 20 km—jalan ke kawah dan view vulkanik" },
				{ name: "Kawah Putih", description: "Danau kawah berwarna toska sekitar 40 km—spot foto dan jalan alam" },
				{ name: "Situ Patengan", description: "Danau, boat ride, kebun teh, jalur jalan, dan hutan bambu" },
				{ name: "Rengganis Hot Springs & Suspension Bridge", description: "Jembatan gantung panjang, pemandian air panas, dan spa" },
				{ name: "Dusun Bambu Lembang", description: "Area alam, restoran, dan piknik" },
				{ name: "Tebing Keraton", description: "Viewpoint hutan dan kota, populer untuk sunrise" },
				{ name: "Ciwidey Strawberry Fields & Ranca Upas", description: "Kebun stroberi, camping, dan melihat rusa" },
				{ name: "Floating Market Lembang", description: "Kuliner lokal dan belanja dengan konsep pasar terapung" },
				{ name: "Saung Angklung Udjo", description: "Pertunjukan musik dan tari Sunda dengan angklung" },
				{ name: "Jalan Braga", description: "Jalan bersejarah dengan kafe, galeri, dan bangunan Art Deco" },
				{ name: "Farmhouse Lembang", description: "Desa bertema Eropa untuk foto dan aktivitas anak" },
				{ name: "Alun-alun (City Square)", description: "Alun-alun pusat kota yang ikonik" },
				{ name: "Masjid Raya Bandung", description: "Masjid besar di alun-alun dengan menara tinggi" },
				{ name: "Gedung Merdeka", description: "Bangunan bersejarah Konferensi Asia-Afrika 1955" },
				{ name: "Museum Geologi", description: "Koleksi batu, mineral, dan fosil—area Dago" },
				{ name: "Taman Hutan Raya Djuanda", description: "Hutan kota dengan gua era Perang Dunia II" },
				{ name: "Hotel Savoy Homann", description: "Bangunan Art Deco ikonik dari era 1920-an" },
			],
			aktiviteler: [
				{ name: "Trekking Vulkanik", description: "Jalan kawah di Tangkuban Perahu", icon: "🥾" },
				{ name: "Menyaksikan Sunrise", description: "Sunrise di Tebing Keraton atau Tangkuban Perahu", icon: "🌅" },
				{ name: "Tur Fotografi", description: "Foto di Floating Market, Farmhouse, Kawah Putih, Situ Patengan", icon: "📷" },
				{ name: "Musik & Tari Sunda", description: "Pertunjukan tradisional di Saung Angklung Udjo", icon: "🎵" },
				{ name: "Hot Springs & Spa", description: "Relaksasi di Rengganis dan Ciater", icon: "♨️" },
				{ name: "Jalan Alam", description: "Walking trail di Djuanda, Ranca Upas, dan Situ Patengan", icon: "🌲" },
				{ name: "Jembatan Gantung", description: "Jalan di jembatan gantung Rengganis", icon: "🌉" },
				{ name: "Kebun Teh & Stroberi", description: "Kunjungan kebun teh dan petik stroberi", icon: "🌾" },
				{ name: "Tur Museum", description: "Museum Geologi, museum Asia-Afrika, dan galeri", icon: "🏛️" },
				{ name: "Sunday Market & Car-Free Day", description: "Aktivitas Minggu di Gasibu dan Jalan Dago", icon: "🛍️" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Masakan Sunda": [
					{ name: "Siomay (Bakso Tahu)", description: "Siomay dengan saus kacang—favorit Bandung" },
					{ name: "Soto Bandung", description: "Soto daging dengan sayur" },
					{ name: "Laksa Bandung", description: "Sup ayam santan dengan ketupat" },
					{ name: "Lotek", description: "Sayur rebus dengan saus kacang pedas" },
					{ name: "Batagor", description: "Bakso tahu goreng, versi renyah siomay" },
					{ name: "Basreng", description: "Camilan bakso goreng pedas" },
					{ name: "Bubur Ayam", description: "Bubur ayam untuk sarapan" },
					{ name: "Kupat Tahu", description: "Ketupat dan tahu dengan saus kacang" },
					{ name: "Mie Goreng", description: "Mie goreng pedas" },
					{ name: "Oncom", description: "Fermentasi kedelai khas Sunda" },
				],
				"Masakan Indonesia": [
					{ name: "Nasi Goreng", description: "Nasi goreng pedas" },
					{ name: "Ayam Goreng", description: "Ayam goreng renyah" },
					{ name: "Sate Ayam", description: "Sate ayam dengan saus kacang" },
					{ name: "Gado-Gado", description: "Salad sayur dengan saus kacang" },
				],
				"Masakan Turki": [
					{ name: "Demir Kebab & Grill", description: "Kebab dan grill dengan cita rasa Turki" },
					{ name: "Istanbul Kebab Turki TKI 2", description: "Döner dan kebab" },
					{ name: "Kebab Baba Sultan by Hakan Idris", description: "Tempat kebab dengan rating tinggi" },
					{ name: "Merhaba Kebab Cikutra", description: "Kebab dan wrap dengan harga terjangkau" },
					{ name: "Kebuli Abuya Batununggal", description: "Kebab dan menu bergaya Timur Tengah" },
					{ name: "Merhaba Kebab Dipatiukur", description: "Spot kebab populer" },
					{ name: "Merhaba Kebab Gerlong", description: "Kebab klasik" },
					{ name: "Kebab Sultan Panyileukan", description: "Kebab dan wrap" },
					{ name: "Ngebabs Everyday", description: "Kebab dan snack Timur Tengah" },
				],
				"Masakan Barat & Modern": [
					{ name: "Pizza", description: "Pizza ala Italia di restoran modern" },
					{ name: "Burger & Steak", description: "Burger dan menu daging ala Barat" },
					{ name: "Pastry & Kafe", description: "Budaya kafe dan pastry" },
				],
				"Minuman Non-Alkohol": [
					{ name: "Kopi", description: "Budaya kopi modern dengan banyak variasi" },
					{ name: "Jus Buah Segar", description: "Jus buah musiman" },
					{ name: "Jamu", description: "Minuman herbal tradisional" },
					{ name: "Es Cendol", description: "Minuman santan dengan jelly hijau" },
				],
			},
			turkyemekleriNotu: "Beberapa restoran Turki di Bandung juga menyediakan menu grill dan variasi pide.",
			konaklama: [
				{ name: "Hotel Budget", description: "Hostel dan penginapan hemat" },
				{ name: "Hotel Mid-Range", description: "Hotel heritage dengan nuansa Art Deco" },
				{ name: "Hotel Mewah", description: "Layanan bintang lima dan view pegunungan" },
				{ name: "Resort & Vila Pegunungan", description: "Menginap di sekitar Lembang dan dataran tinggi" },
				{ name: "Kompleks Trans Studio", description: "Area mall + theme park dengan banyak pilihan hotel" },
			],
			konaklamaSuresi: "2–3 hari",
			konaklamaBudgeti: "USD 600–1000",
			alisveris: [
				{ name: "Paris Van Java Mall", description: "Mall besar dengan brand lokal dan internasional" },
				{ name: "Trans Studio Mall", description: "Kompleks theme park indoor dengan shopping dan dining" },
				{ name: "BTC Fashion Mall", description: "Fashion terjangkau dan brand lokal" },
				{ name: "Factory Outlets (Jl Riau & Jl Dago)", description: "Outlet dengan harga menarik" },
				{ name: "Jalan Cihampelas (Jeans Street)", description: "Kawasan jeans dan street shopping, termasuk skywalk" },
				{ name: "Distros (Desainer Independen)", description: "Streetwear desainer lokal dan fashion anak muda" },
				{ name: "Cibaduyut (Produk Kulit)", description: "Sepatu/boot kulit custom (produksi 3–7 hari)" },
				{ name: "Saung Angklung Udjo Gallery", description: "Kerajinan Sunda dan instrumen angklung" },
				{ name: "Jalan Braga", description: "Jalan belanja bersejarah dengan kafe dan galeri" },
				{ name: "Pasar Baru Trade Centre", description: "Pusat tekstil dan pakaian" },
				{ name: "Toko Elektronik (di mall)", description: "Elektronik dan aksesori di mall besar" },
			],
		},
	},
	lombok: {
		giliTrawangan: {
			description:
				"Gili Trawangan adalah pulau terbesar dan paling berkembang dari tiga Kepulauan Gili di Lombok. Dengan air laut jernih, spot diving kelas dunia, nightlife yang hidup, dan studio yoga, tempat ini adalah surga bagi pecinta laut dan pencari petualangan. Kendaraan bermotor dilarang—keliling pulau dengan sepeda atau tur perahu.",
			gezilecekYerler: [
				{
					name: "Pantai Gili Trawangan (Pantai Utama)",
					description:
						"Di sisi timur, utara pelabuhan—air biru kehijauan, pasir putih, berenang dan snorkeling, akses mudah.",
				},
				{
					name: "Northwest Reef",
					description:
						"Di sisi barat pulau—bagian karang lebih sehat; akses bisa melewati karang mati yang tajam, disarankan pakai sepatu air.",
				},
				{
					name: "Shark Point",
					description:
						"Spot diving/snorkeling populer untuk melihat hiu karang dan sering juga penyu—sebaiknya dengan pemandu dan hormati satwa.",
				},
				{
					name: "Sunset Hill (South Hill)",
					description:
						"Bukit di sisi selatan dengan kincir angin tua dan peninggalan WWII—bagus untuk sunset; saat pagi cerah bisa melihat Gunung Rinjani.",
				},
				{
					name: "Gili Meno & Gili Air",
					description:
						"Pulau tetangga untuk day trip—naik perahu, snorkeling, suasana lebih tenang, mudah untuk island hopping.",
				},
				{
					name: "Patung Bawah Laut (Divers Down)",
					description:
						"Instalasi seni bawah laut yang sekaligus menjadi spot menyelam—perpaduan unik seni dan kehidupan laut.",
				},
				{
					name: "Pasar Seni (Pasar Seni)",
					description:
						"Di sebelah pelabuhan—kerajinan lokal, kain batik, dan oleh-oleh khas Indonesia.",
				},
				{
					name: "Rute Sepeda Keliling Gili Trawangan",
					description:
						"Bersepeda mengelilingi pulau sekitar 7 km (±90–120 menit)—melewati kampung kecil, tambak, dan pemandangan alam.",
				},
				{
					name: "Hutan Mangrove",
					description:
						"Tur kayak dan eco-trip ringan—birdwatching dan melihat satwa di kanal mangrove.",
				},
				{
					name: "Freedive Gili Center",
					description:
						"Kursus apnea dan freediving dari pemula hingga advanced—latihan menahan napas dengan instruktur berpengalaman.",
				},
				{
					name: "Kelas Memasak Gili (dekat Pasar Seni)",
					description:
						"Kelas singkat (sekitar 3 jam) untuk belajar beberapa hidangan Indonesia/Lombok dengan bahan lokal.",
				},
				{
					name: "Subwing Gili",
					description:
						"Aktivitas seru ‘terbang’ di bawah air sambil ditarik perahu—biasanya sesi singkat.",
				},
			],
			aktiviteler: [
				{
					name: "Scuba Diving Kelas Dunia",
					description:
						"Banyak dive shop dengan kursus & sertifikasi—bisa melihat manta (musiman), hiu karang, penyu, dan terumbu berwarna (5–40 m).",
					icon: "🤿",
				},
				{
					name: "Snorkeling",
					description:
						"Snorkeling mudah dari tepi pantai di atas karang dan ikan tropis—rute populer termasuk Shark Point dengan pemandu.",
					icon: "🏊",
				},
				{
					name: "Surfing",
					description:
						"Ombak musiman; di wilayah Lombok, periode Januari–Juni sering dianggap paling baik.",
					icon: "🏄",
				},
				{
					name: "Sesi Yoga",
					description: "Studio yoga dengan kelas pagi/sore—sering di dekat pantai.",
					icon: "🧘",
				},
				{
					name: "Tur Sepeda",
					description:
						"Keliling pulau dengan sepeda—melewati kampung, tambak, dan jalur pesisir yang tenang.",
					icon: "🚴",
				},
				{
					name: "Berkuda",
					description:
						"Rute pantai dan jalur pesisir—opsi sunrise & sunset sangat populer.",
					icon: "🐴",
				},
				{
					name: "Party Boat Trip",
					description:
						"Cruise dengan musik, berenang, dan snorkeling—cek keamanan operator dan ulasan sebelum booking.",
					icon: "🎉",
				},
				{
					name: "Kelas Memasak",
					description:
						"Belajar masakan Indonesia dengan bahan lokal—hands-on dan ramah pemula.",
					icon: "👨‍🍳",
				},
				{
					name: "Menikmati Sunrise",
					description: "Dari sisi timur pulau—bagus untuk foto dan suasana pantai yang tenang.",
					icon: "🌅",
				},
				{
					name: "Night Snorkeling",
					description:
						"Snorkeling malam dengan pemandu untuk melihat biota nokturnal; pada malam tertentu bisa muncul bioluminesensi.",
					icon: "🌙",
				},
				{
					name: "Kursus Freediving & Apnea",
					description:
						"Latihan menyelam menahan napas dari pemula hingga advanced—selalu bersama instruktur bersertifikat.",
					icon: "🫁",
				},
				{
					name: "Muck Diving",
					description:
						"Gaya diving khusus untuk melihat makhluk unik di dasar laut—cocok untuk fotografer.",
					icon: "📸",
				},
				{
					name: "Walking Tour",
					description:
						"Jalan kaki keliling pulau (±90–120 menit)—termasuk viewpoint dan bunker era WWII.",
					icon: "🥾",
				},
				{
					name: "Technical Diving",
					description:
						"Diving tingkat lanjut (mis. CCR / trimix) dengan operator spesialis—perlu sertifikasi.",
					icon: "🛻",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"Indonesia & Asia": [
					{
						name: "Nasi Goreng & Mie Goreng",
						description:
							"Nasi goreng dan mie goreng ala lokal dengan sayur dan pilihan protein.",
					},
					{ name: "Sate (Sate)", description: "Tusuk bakar berbumbu dengan saus kacang." },
					{
						name: "Gado-Gado",
						description:
							"Salad sayur dengan saus kacang, tahu, dan telur—klasik Indonesia.",
					},
					{
						name: "Lumpia",
						description: "Lumpia goreng dengan saus manis dan pedas.",
					},
					{
						name: "Som Tam (Salad Pepaya)",
						description:
							"Salad pepaya muda ala Thailand yang pedas dengan jeruk nipis.",
					},
					{
						name: "Bakso",
						description:
							"Sup bakso yang sering dijual di pasar malam dan warung.",
					},
					{
						name: "Pancake Dessert",
						description:
							"Pancake manis street food di pasar malam—pas untuk camilan malam.",
					},
				],
				"Makanan Laut": [
					{
						name: "Ikan Segar",
						description:
							"Tangkapan harian yang disajikan bakar, goreng, atau kukus.",
					},
					{
						name: "Ikan Bakar",
						description:
							"Snapper dan trevally populer—sering dibakar di malam hari.",
					},
					{
						name: "Udang & Cumi",
						description:
							"Udang dan cumi segar, dibakar atau digoreng ringan dengan bumbu.",
					},
					{ name: "Fish Cake", description: "Variasi fish cake lokal—dipanggang atau digoreng." },
				],
				"Masakan Barat": [
					{ name: "Pizza & Pasta", description: "Pizza dan pasta ala Italia, sering wood-fired." },
					{ name: "Burger & Sandwich", description: "Pilihan burger dan sandwich yang beragam." },
					{
						name: "Salad Bar",
						description:
							"Sayur segar dengan pilihan protein dan dressing.",
					},
				],
				"Minuman Non-Alkohol": [
					{
						name: "Jus Buah Tropis",
						description:
							"Jus segar: mangga, pepaya, nanas, markisa, dan jambu.",
					},
					{ name: "Boba Tea / Bubble Tea", description: "Minuman teh dengan boba dalam banyak rasa." },
					{
						name: "Es Campur",
						description:
							"Minuman dessert es serut dengan jelly dan topping campur.",
					},
					{ name: "Air Kelapa", description: "Air kelapa segar kaya elektrolit." },
					{ name: "Kopi", description: "Kopi Indonesia (sering robusta), bisa pahit atau manis." },
					{ name: "Jamu", description: "Minuman herbal tradisional untuk energi dan kesehatan." },
					{ name: "Teh", description: "Teh panas/dingin—blend lokal dan teh rempah umum ditemui." },
				],
			},
			konaklama: [
				{
					name: "Hostel Budget",
					description:
						"Banyak hostel dari dorm hingga private—suasana sosial, ramah backpacker.",
				},
				{ name: "Hotel Terjangkau", description: "Hotel kecil dengan kenyamanan dasar dan value bagus." },
				{
					name: "Hotel Mid-Range",
					description:
						"Boutique stay dengan kolam renang dan layanan front desk.",
				},
				{
					name: "Vila Boutique",
					description:
						"Vila desain modern, beberapa beachfront—cocok untuk pasangan/keluarga/grup.",
				},
				{ name: "Resort Mewah", description: "Opsi beachfront premium dengan layanan dan fasilitas lengkap." },
			],
			konaklamaSuresi: "3–5 hari",
			konaklamaBudgeti: "USD 900–1700",
			alisveris: [
				{
					name: "Pasar Seni (dekat Santai Beach Club)",
					description:
						"Seni lokal, batik, kerajinan kayu, dan produk tradisional.",
				},
				{ name: "Beachwalk Shops", description: "Toko kecil di sepanjang pantai: souvenir, beachwear, perhiasan." },
				{ name: "ATM & Money Exchange", description: "Ada beberapa ATM dan money changer—tetap siapkan uang tunai." },
				{ name: "Toko Souvenir & Kerajinan", description: "Batik, ukiran kayu, dan kerajinan lokal." },
				{ name: "Pakaian & Beachwear", description: "Swimwear, pakaian surfing, yoga wear, dan desain lokal." },
				{ name: "Apotek & Kesehatan", description: "Obat dasar, sunscreen, anti-nyamuk, kebutuhan kesehatan." },
				{ name: "William’s Bookshop", description: "Di belakang Pasar Seni—perangko, pengiriman/postcard, buku." },
				{ name: "Warnet & Laundry", description: "Tersedia di area belakang Pasar Seni." },
			],
		},
		mountRinjani: {
			description:
				"Gunung Rinjani adalah gunung berapi aktif ikonik di Lombok dan merupakan gunung tertinggi kedua di Indonesia. Dengan ketinggian 3.726 meter, Rinjani terkenal dengan Danau Kawah Segara Anak, pemandian air panas, dan pemandangan sunrise dramatis. Cocok untuk pendaki berpengalaman yang mencari trek menantang.",
			gezilecekYerler: [
				{
					name: "Danau Kawah Segara Anak",
					description:
						"Danau kawah di ketinggian ~2.000 m—pemandangan vulkanik unik dan area hangat dekat pemandian air panas.",
				},
				{ name: "Pemandian Air Panas Aik Kalak", description: "Pemandian air panas dekat area kawah—favorit setelah hiking." },
				{ name: "Gua Susu", description: "Gua beruap yang dianggap sakral—sering dikunjungi untuk refleksi." },
				{ name: "Air Terjun Sendanggile", description: "Air terjun indah di kaki gunung—cocok untuk jalan alam yang lebih ringan." },
				{ name: "Crater Rim", description: "Viewpoint panorama di 2.600+ meter—ideal untuk melihat sunrise." },
			],
			aktiviteler: [
				{
					name: "Trek 2H/1M (Crater Rim)",
					description:
						"Rute lebih singkat dari Senaru atau Sembalun ke bibir kawah—biasanya termasuk sunrise.",
					icon: "🥾",
					uyari:
						"⚠️ Risiko altitude sickness (2000m+). Perlu kondisi fisik baik. Wajib pemandu bersertifikat.",
				},
				{
					name: "Trek 3H/2M (Rim + Danau)",
					description:
						"Crater rim plus turun ke Danau Segara Anak dan pemandian air panas—diatur oleh operator trekking.",
					icon: "⛺",
					uyari:
						"⚠️ Ketinggian 2000m+. Suhu bisa turun hingga di bawah nol. Respon darurat terbatas; perlu kondisi fisik sangat baik.",
				},
				{
					name: "Trek 4H/3M (Summit Attempt)",
					description:
						"Rim → puncak (3.726m) → danau → turun. Opsi paling berat.",
					icon: "⛰️",
					uyari:
						"⚠️ OPSI PALING SULIT — suhu puncak bisa -4°C hingga +5°C. Risiko ketinggian tinggi. Tidak ada evakuasi helikopter. Hanya untuk pendaki sangat fit dan berpengalaman dengan pemandu profesional.",
				},
				{
					name: "Trek Sunrise",
					description:
						"Pendakian malam untuk menangkap sunrise dari bibir kawah—momen paling berkesan di Rinjani.",
					icon: "🌅",
					uyari:
						"⚠️ Trek malam berisiko: suhu dingin, wajib penerangan, bisa licin. Perlu kondisi fisik.",
				},
				{
					name: "Trip Air Terjun",
					description:
						"Hiking ringan ke air terjun sekitar Senaru/Sembalun—alternatif lebih santai.",
					icon: "💧",
					uyari:
						"⚠️ Batu basah bisa licin; debit air tinggi bisa berbahaya. Gunakan sepatu yang tepat.",
				},
			],
			yiyecekIcecekler: [
				{
					name: "Makan Warung (Nasi/Mie Goreng)",
					description:
						"Menu sederhana di desa Senaru dan Sembalun—nasi dan mie goreng adalah andalan.",
				},
				{ name: "Paket Makan Trekking", description: "Makan hangat dan snack dari porter saat trek—fokus energi dan pemulihan." },
				{ name: "Energy Bar & Buah", description: "Bekal energi sebelum mulai: kacang, cokelat, dried fruit, energy bar." },
				{ name: "Teh & Kopi", description: "Teh/kopi hangat di Senaru/Sembalun—berguna untuk start dini dan malam dingin." },
			],
			konaklama: [
				{ name: "Penginapan Desa Senaru", description: "Guesthouse dan hotel kecil dekat trailhead utara (±600m)." },
				{ name: "Penginapan Sembalun Lawang", description: "Start point timur (±1.150m)—lebih dekat rute puncak." },
				{ name: "Campsite Gunung", description: "Area camping selama trek (termasuk camp di bibir kawah)." },
				{ name: "Area Sekitar", description: "Senggigi, Tanjung, dan Kepulauan Gili bisa jadi base tergantung rute." },
			],
			konaklamaSuresi: "2–4 hari",
			konaklamaBudgeti: "USD 500–900",
			alisveris: [
				{ name: "Pasar Desa Senaru & Sembalun", description: "Kebutuhan dasar, air botol, snack, dan perlengkapan terakhir sebelum trek." },
				{ name: "Sewa Perlengkapan Trekking", description: "Trekking pole, headlamp, sarung tangan, sleeping bag, matras (tergantung ketersediaan)." },
				{ name: "Apotek & P3K", description: "Obat dasar, painkiller, obat perut, sunscreen, anti-nyamuk." },
			],
			turkyemekleriNotu:
				"⚠️ PERINGATAN KESELAMATAN KRITIS: Trek Gunung Rinjani adalah pendakian high-mountain yang sangat berbahaya. Pada 2025, setidaknya 2 orang meninggal termasuk Juliana Marins (26) asal Brasil dan Rennie Abdul Ghani (57) asal Malaysia. Secara historis ada puluhan kasus kematian (misalnya tenggelam di Segara Anak 2016; 7 orang meninggal karena hipotermia 2007). RISIKO: altitude sickness (2000m+), suhu puncak -4°C hingga +5°C, TIDAK ada evakuasi helikopter, tuntutan fisik sangat tinggi. Direkomendasikan hanya untuk kondisi kesehatan & fisik sangat baik, dengan pemandu profesional bersertifikat. Pelanggaran regulasi Indonesia bisa berakibat sanksi berat. Sangat disarankan briefing keselamatan dan asuransi sebelum trekking.",
		},
		senggigi: {
			description:
				"Senggigi adalah area resort pantai utama di Lombok sekaligus pusat wisata paling berkembang di pesisir barat. Terkenal dengan pantai panjang, sunset, water sports, serta pilihan hotel dan resort yang lengkap—sering dianggap alternatif yang lebih tenang dari Bali namun tetap nyaman.",
			gezilecekYerler: [
				{ name: "Pantai Senggigi (Pantai Utama)", description: "Garis pantai beberapa kilometer—air jernih, sunset, dan fasilitas wisata lengkap." },
				{ name: "Pura Batu Bolong", description: "Pura tua di tepi laut di atas batu—populer untuk upacara dan foto." },
				{ name: "Day Trip Tiga Gili", description: "Tur perahu ke Gili Trawangan, Gili Meno, dan Gili Air untuk snorkeling/diving." },
				{ name: "Pasar Seni Senggigi", description: "Seni lokal, batik, ukiran kayu, kerajinan tangan, dan souvenir dekat pantai." },
				{ name: "Area Resort Mandalika", description: "Area berkembang di selatan Senggigi dengan venue modern, kafe, dan restoran." },
				{ name: "Workshop Gerabah Lombok", description: "Workshop gerabah tradisional—lihat proses dan beli karya handmade." },
				{ name: "Pemandian Air Panas Aik Kalak (Tur Rinjani)", description: "Opsi trip dari Senggigi (±60–90 menit) dekat kaki Rinjani." },
			],
			aktiviteler: [
				{ name: "Snorkeling", description: "Snorkeling dekat pantai atau ikut tur ke Gili—karang dan ikan tropis.", icon: "🏊" },
				{ name: "Scuba Diving", description: "Instruktur bersertifikat dan trip ke spot sekitar Gili dan pesisir Lombok.", icon: "🤿" },
				{ name: "Sunset Cruise", description: "Tur perahu menikmati sunset—sering dengan musik dan suasana santai.", icon: "🌅" },
				{ name: "Jet Ski & Water Sports", description: "Jet ski, parasailing, tubing, wakeboard—tergantung operator di pantai.", icon: "🚤" },
				{ name: "Spa & Pijat", description: "Spa hotel dan pusat pijat—pijat Bali dan perawatan wellness.", icon: "💆" },
				{ name: "Yoga & Meditasi", description: "Kelas pagi/sore, termasuk sesi di tepi pantai.", icon: "🧘" },
				{ name: "Walking Tour", description: "Jalan pantai dan rute desa dengan breakfast stop.", icon: "🥾" },
				{ name: "Tur Budaya", description: "Kunjungan pura, workshop gerabah, pasar lokal, dan kerajinan tradisional.", icon: "🎭" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Indonesia & Asia": [
					{ name: "Nasi Goreng & Mie Goreng", description: "Nasi/mie goreng ala lokal dengan sayur dan pilihan protein." },
					{ name: "Sate", description: "Tusuk bakar dengan saus kacang atau saus kari—umum di street food dan restoran." },
					{ name: "Lumpia", description: "Lumpia dengan saus manis pedas—favorit pasar malam." },
					{ name: "Pecel Ayam", description: "Ayam dengan salad sayur dan saus kacang—sederhana dan mengenyangkan." },
				],
				"Makanan Laut": [
					{ name: "Ikan Bakar", description: "Tangkapan harian seperti snapper/trevally—dibakar dengan bumbu, mudah ditemui malam hari." },
					{ name: "Udang & Cumi", description: "Udang mentega bawang, cumi tempura, atau versi goreng pedas." },
					{ name: "Lobster", description: "Lobster segar dibakar atau digoreng—sering di restoran khusus." },
					{ name: "Fish Cake", description: "Fish cake lokal, dipanggang atau digoreng." },
				],
				"Masakan Barat": [
					{ name: "Pizza", description: "Banyak opsi wood-fired dengan bahan segar." },
					{ name: "Burger & Sandwich", description: "Burger gourmet dengan roti fresh dan sayur renyah." },
					{ name: "Steak", description: "Potongan daging berkualitas di venue fine-dining." },
					{ name: "Salad Bar", description: "Menu salad segar dengan opsi protein—banyak pilihan sehat." },
				],
				"Minuman Non-Alkohol": [
					{ name: "Jus Buah Tropis", description: "Jus mangga/pepaya/nanas/markisa—di kafe dan juice stand." },
					{ name: "Boba Tea", description: "Bubble tea dalam banyak rasa—populer di kalangan muda." },
					{ name: "Kopi Indonesia", description: "Kopi robusta lokal, sering disajikan pahit atau manis." },
					{ name: "Jamu", description: "Minuman herbal tradisional untuk wellness dan energi." },
					{ name: "Air Kelapa", description: "Air kelapa segar kaya elektrolit." },
				],
			},
			konaklama: [
				{ name: "Resort Mewah", description: "Kompleks beachfront bintang lima dengan fasilitas lengkap." },
				{ name: "Hotel Boutique", description: "Hotel lebih kecil dengan nuansa intim dan kenyamanan mid-to-upper." },
				{ name: "Hotel Mid-Range", description: "Hotel nyaman dengan kolam dan fasilitas esensial." },
				{ name: "Hostel Budget", description: "Hostel backpacker dengan dorm dan suasana sosial." },
				{ name: "Airbnb & Vila", description: "Vila pribadi cocok untuk keluarga/grup—sering value bagus." },
			],
			konaklamaSuresi: "2–4 hari",
			konaklamaBudgeti: "USD 1200–2500",
			alisveris: [
				{ name: "Pasar Seni Senggigi", description: "Batik, ukiran kayu, dan souvenir tradisional di tepi pantai." },
				{ name: "Senggigi Shopping Center", description: "Area belanja modern kecil dengan brand lokal/internasional." },
				{ name: "Beachwalk Shops", description: "Boutique di sepanjang pantai: souvenir, beachwear, perhiasan." },
				{ name: "Money Exchange & ATM", description: "Tersedia di kota—siapkan uang tunai untuk vendor kecil." },
				{ name: "Toko Spa & Wellness", description: "Aromatherapy, skincare, dan produk wellness tradisional." },
				{ name: "Apotek & Kesehatan", description: "Obat dasar, sunscreen, anti-nyamuk, dan kebutuhan kesehatan." },
			],
		},
		kutaLombok: {
			description:
				"Kuta Lombok adalah surga surfing terkenal di pesisir selatan Lombok, dengan pantai pasir putih dan nuansa alam yang masih ‘raw’. Dengan ombak berkualitas, pemandangan indah, dan infrastruktur yang cepat berkembang, tempat ini makin populer. Dekat dengan Desert Point sehingga spot surfing legendaris lebih mudah dijangkau.",
			gezilecekYerler: [
				{ name: "Pantai Kuta (Pantai Utama)", description: "Pasir putih, air biru kehijauan—cocok untuk berenang dan snorkeling santai." },
				{ name: "Desert Point", description: "Spot surf kiri kelas dunia dengan barrel panjang; kondisi musiman—lebih aman dengan surfer lokal berpengalaman." },
				{ name: "Pantai Tanjung Aan", description: "Pantai tenang dekat Kuta dengan air jernih dan area karang." },
				{ name: "Benang Kelambu (Trip Air Terjun)", description: "Air terjun untuk trip singkat—kolam air tawar dan area piknik." },
				{ name: "Menus Cliff (Viewpoint)", description: "Viewpoint di bukit dengan pemandangan pesisir—populer untuk sunset dan foto." },
				{ name: "Pantai Selong Belanak", description: "Pantai lebih sepi di barat Kuta—sering ramah pemula untuk surf lesson." },
				{ name: "Pantai Mawun", description: "Teluk indah di tenggara Kuta—air lebih tenang dan suasana secluded." },
				{ name: "Teluk Gerupuk", description: "Teluk dengan formasi batu, spot surf, dan nuansa kampung nelayan." },
			],
			aktiviteler: [
				{ name: "Surfing Kelas Dunia", description: "Dari Desert Point hingga pantai pemula—lesson tersedia untuk semua level.", icon: "🏄" },
				{ name: "Snorkeling", description: "Snorkeling karang dekat pantai dan via day trip—ikan tropis dan area dangkal.", icon: "🏊" },
				{ name: "Scuba Diving", description: "Dive school lokal menawarkan sertifikasi dan reef dive di spot sekitar.", icon: "🤿" },
				{ name: "Trekking & Hiking", description: "Hiking singkat ke viewpoint, air terjun, dan rute desa.", icon: "🥾" },
				{ name: "Sunrise & Sunset", description: "Sunset di Menus Cliff dan sunrise walk di pantai.", icon: "🌅" },
				{ name: "Spa & Pijat", description: "Pijat tradisional dan sesi wellness di hotel/spa.", icon: "💆" },
				{ name: "Tur Budaya", description: "Desa kerajinan, pasar lokal, tradisi tenun, dan situs budaya kecil.", icon: "🎭" },
				{ name: "Boat Trip", description: "Island hopping, tur snorkeling, sunset cruise, charter privat.", icon: "⛵" },
				{ name: "Spot Foto / Instagram", description: "Pantai, tebing, dan sunset—tur foto tersedia.", icon: "📸" },
				{ name: "Yoga & Meditasi", description: "Yoga pagi di pantai dan meditasi saat sunset di retreat.", icon: "🧘" },
				{ name: "Tur ATV / Motor", description: "Jalur pesisir dan bukit—jelajah desa dan off-road.", icon: "🏍️" },
				{ name: "Fishing Trip", description: "Tur memancing siang/malam bersama nelayan lokal.", icon: "🎣" },
				{ name: "Kayak & Paddle Board", description: "Aktivitas dayung di pesisir saat kondisi tenang.", icon: "🛶" },
				{ name: "Kelas Masak Lokal", description: "Masak menu Indonesia dengan pemandu—kadang termasuk belanja ke pasar.", icon: "👨‍🍳" },
				{ name: "Panjat Tebing", description: "Climbing di area seperti Gerupuk dengan pemandu profesional.", icon: "🧗" },
				{ name: "Tur Komunitas / Responsible Travel", description: "Kunjungi kampung nelayan dan workshop kerajinan—dukung komunitas lokal.", icon: "🤝" },
			],
			yiyecekIcecekler: {
				__replace: true,
				Info: [
					{
						name: "",
						description:
							"Tidak ada masakan Turki di Kuta Lombok, namun ada restoran bergaya Mediterania.",
					},
				],
				"Indonesia & Asia": [
					{ name: "Nasi & Mie Goreng", description: "Menu warung: nasi/mie goreng—praktis dan mengenyangkan." },
					{ name: "Sate", description: "Tusuk bakar yang mudah ditemukan—sering dengan saus pedas." },
					{ name: "Gado-Gado", description: "Salad sayur dengan saus kacang—klasik Indonesia." },
					{ name: "Lumpia", description: "Lumpia goreng di pasar malam." },
					{ name: "Martabak Terang Bulan", description: "Pancake manis berisi topping beragam—populer malam hari." },
					{ name: "Es Cendol", description: "Minuman es manis dengan santan dan gula merah." },
				],
				"Makanan Laut": [
					{ name: "Ikan Bakar", description: "Tangkapan harian seperti snapper/trevally—dibakar dengan harga lokal." },
					{ name: "Udang & Cumi", description: "Opsi garlic/teriyaki atau pedas—sering di restoran pantai." },
					{ name: "Cumi Karaage", description: "Cumi goreng ala Jepang—variasi favorit." },
					{ name: "Menu Ikan Putih Segar", description: "Ikan putih segar dari desa nelayan sekitar—sering jadi menu spesial harian." },
					{ name: "Seafood BBQ Platter", description: "Paket BBQ campur: ikan, udang, cumi." },
					{ name: "Ceviche Ikan Segar", description: "Hidangan ikan dengan citrus—adaptasi gaya Barat di beberapa kafe." },
					{ name: "Snack Rumput Laut", description: "Camilan berbasis rumput laut—ringan dan asin." },
				],
				"Masakan Barat": [
					{ name: "Pizza", description: "Kuta dikenal punya pizza enak—sering wood-fired dengan bahan segar." },
					{ name: "Burger", description: "Burger gourmet dengan bun fresh dan bahan lokal." },
					{ name: "Pasta", description: "Pasta dengan beragam saus—pasta seafood populer." },
					{ name: "Smoothie Kafe", description: "Smoothie buah dan acai bowl—sarapan gaya sehat." },
					{ name: "Fusion Bali/Lombok", description: "Menu modern yang memadukan rasa Bali dan Lombok." },
				],
				"Minuman Non-Alkohol": [
					{ name: "Jus Buah Tropis", description: "Jus segar mangga/pepaya/markisa." },
					{ name: "Kopi Indonesia", description: "Kopi robusta lokal, kadang disajikan dengan busa (ombak)." },
					{ name: "Jamu", description: "Campuran herbal tradisional untuk energi dan wellness." },
					{ name: "Boba Tea", description: "Bubble tea dan fruit tea—populer." },
					{ name: "Teh Tarik", description: "Teh susu yang ‘ditarik’—manis dan berbusa." },
					{ name: "Jus Musiman", description: "Mix buah musiman—tanya menu terbaik hari itu." },
					{ name: "Es Kelapa Muda", description: "Air kelapa muda dingin—elektrolit alami." },
				],
			},
			konaklama: [
				{ name: "Hotel Beach Boutique", description: "Menginap dekat pantai dengan nuansa boutique." },
				{ name: "Resort", description: "Resort area Mandalika dan opsi high-end dengan fasilitas lengkap." },
				{ name: "Hostel & Backpacker", description: "Dorm dan hostel sosial untuk traveler budget." },
				{ name: "Airbnb & Vila", description: "Vila pribadi untuk grup/keluarga—sering value bagus." },
				{ name: "Surf Camp", description: "Akomodasi fokus surfing dengan lesson—ideal untuk belajar/progres." },
				{ name: "Resort Vila Mewah", description: "Resort premium dengan private pool dan concierge." },
				{ name: "Hotel Budget", description: "Sederhana, bersih, value bagus untuk backpacker." },
				{ name: "Bungalow Beachfront", description: "Akses pantai langsung dengan suasana romantis dan sunset." },
				{ name: "Eco-lodge / Green Resort", description: "Penginapan berkelanjutan yang menyatu dengan alam." },
			],
			konaklamaSuresi: "3–5 hari",
			konaklamaBudgeti: "USD 1200–2100",
			alisveris: [
				{ name: "Kuta Night Market", description: "Pasar malam untuk produk lokal, pakaian, dan souvenir kecil." },
				{ name: "Galeri Seni & Kerajinan", description: "Gerabah, ukiran kayu, dan kain batik." },
				{ name: "Surf Shop", description: "Surfboard, pakaian, aksesori, dan rental." },
				{ name: "Money Exchange & ATM", description: "Ketersediaan terbatas—rencanakan uang tunai lebih awal." },
				{ name: "Apotek & Kesehatan", description: "Obat dasar, sunscreen, perban, dan kebutuhan esensial." },
				{ name: "Ponsel & Aksesori", description: "Aksesori dan servis ponsel—tergantung ketersediaan." },
				{ name: "Elektronik (Mataram ±45 km)", description: "Kamera, drone, dan elektronik lebih lengkap biasanya di Mataram." },
				{ name: "Toko Souvenir", description: "Perhiasan handmade, beachwear, magnet, hadiah kecil, produk kreator lokal." },
				{ name: "Boutique", description: "Dress pantai, bikini, topi, dan item bergaya designer." },
				{ name: "Desa Sasak / Gerabah (Batu Layar)", description: "Gerabah, kain tenun, dan kerajinan tradisional langsung dari pengrajin." },
			],
		},
		benangStokel: {
			description:
				"Air Terjun Benang Stokel adalah sistem air terjun bertingkat yang indah di Lombok bagian timur, dengan kolam air tawar yang menyegarkan. Berada di kaki Gunung Rinjani, tiga tingkat pertama relatif mudah dijangkau sehingga jadi destinasi eco-trip favorit untuk forest walk, berenang, dan menikmati alam.",
			gezilecekYerler: [
				{ name: "Air Terjun Benang Stokel (Tingkat 1)", description: "Air terjun utama (~15 m) dengan kolam alami—sekitar 10 menit berjalan." },
				{ name: "Benang Stokel Tingkat 2", description: "Tingkat kedua (~20 m) dengan kolam kedua—biasanya lebih sepi (±15 menit)." },
				{ name: "Benang Stokel Tingkat 3", description: "Tingkat ketiga (~25 m)—poin mudah terjauh, suasana hutan lebih tenang." },
				{ name: "Air Terjun Benang Kelambu", description: "Alternatif dekat dengan jalur berbeda—lebih sepi dan terasa secluded." },
				{ name: "Jalur Trek Hutan", description: "Forest walk untuk birdwatching dan melihat satwa—bagus untuk foto alam." },
				{ name: "Kolam Alami", description: "Kolam air tawar dingin di dasar air terjun—berenang dan berendam singkat." },
				{ name: "Area Piknik", description: "Area kecil untuk piknik—catering sederhana bisa diatur via pemandu." },
			],
			aktiviteler: [
				{ name: "Trekking Air Terjun", description: "Kunjungi beberapa tingkat lewat rute 1–3 jam—cocok untuk banyak level fitness.", icon: "🥾" },
				{ name: "Berenang Air Tawar", description: "Berenang di kolam air terjun—air dingin dan suasana alam segar.", icon: "🏊" },
				{ name: "Birdwatching", description: "Melihat burung tropis—pagi hari biasanya terbaik.", icon: "🦅" },
				{ name: "Fotografi", description: "Foto air terjun dan hutan—cocok untuk nature shot.", icon: "📸" },
				{ name: "Piknik / BBQ", description: "Piknik hutan untuk pasangan/keluarga/grup—bisa diatur dengan catering lokal.", icon: "🧺" },
				{ name: "Meditasi & Yoga", description: "Sesi tenang di alam—relaksasi ala forest bathing.", icon: "🧘" },
				{ name: "Melihat Satwa", description: "Amati monyet, burung, serangga—bawa binocular jika ada.", icon: "🔭" },
				{ name: "Rockpool Hopping", description: "Pindah antar kolam batu untuk berendam—perhatikan pijakan.", icon: "🏞️" },
				{ name: "Foto Drone", description: "Ambil aerial shot air terjun dan hutan—ikuti aturan lokal.", icon: "🚁" },
				{ name: "Sketsa / Nature Art", description: "Sketsa dan sesi kreatif di suasana outdoor yang tenang.", icon: "🎨" },
				{ name: "Belajar Flora & Fauna", description: "Tur berpemandu untuk mengenal tanaman, serangga, dan burung.", icon: "🌱" },
				{ name: "Macro Photography", description: "Foto close-up serangga, bunga, dan detail hutan.", icon: "🔬" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Indonesia & Lokal": [
					{ name: "Makanan Kotak (Lunch Box)", description: "Makanan kotak sederhana (mis. nasi kuning) sering diatur oleh pemandu." },
					{ name: "Makan Warung", description: "Warung desa dengan menu nasi/mie goreng dan makanan sederhana." },
					{ name: "Dessert", description: "Manisan Indonesia seperti pisang goreng dan martabak dari kios lokal." },
					{ name: "Rujak (Salad Buah)", description: "Buah campur dengan saus asam-manis pedas berbasis asam jawa." },
				],
				"Menu Protein": [
					{ name: "Ikan Bakar", description: "Ikan lokal dibakar dengan bumbu Indonesia." },
					{ name: "Sate Ayam", description: "Sate ayam dengan saus kacang—sering dibeli dari pasar lokal." },
					{ name: "Tahu Goreng", description: "Tahu goreng dengan saus manis—opsi vegetarian sederhana." },
					{ name: "Ayam Goreng", description: "Ayam goreng crispy dengan bumbu lokal—pas untuk bekal piknik." },
				],
				"Snack & Energi": [
					{ name: "Granola & Muesli", description: "Snack praktis untuk trekking—kacang dan cereal campur." },
					{ name: "Kacang Panggang", description: "Kacang panggang tinggi protein dan mudah dibawa." },
					{ name: "Pisang & Buah Tropis", description: "Pisang segar dan buah musiman—energi cepat alami." },
					{ name: "Energy Bar", description: "Energy bar siap beli dengan daya simpan lama." },
				],
				"Favorit Piknik": [
					{ name: "Perkedel", description: "Perkedel kentang ala Indonesia—mudah dibawa." },
					{ name: "Lumpia", description: "Lumpia untuk camilan, bisa dinikmati suhu ruang." },
					{ name: "Ketoprak", description: "Campuran sayur dengan tahu dan telur—sering ada di lunch box." },
					{ name: "Paket BBQ", description: "Catering piknik dan paket BBQ untuk grup via pemandu." },
				],
				"Elektrolit & Minuman Olahraga": [
					{ name: "Pocari Sweat", description: "Minuman elektrolit populer untuk mengganti cairan setelah banyak berkeringat." },
					{ name: "Minuman Olahraga Lokal", description: "Sport drink merek Indonesia—alternatif mudah." },
					{ name: "Rehidrasi (Air Garam/Gula)", description: "Campuran sederhana—gunakan dengan bijak; prefer ORS jika ada." },
					{ name: "Es Jeruk", description: "Jus jeruk/limau segar—vitamin C, sering dibuat pedagang lokal." },
				],
				"Minuman Non-Alkohol": [
					{ name: "Es Teh Manis", description: "Teh manis dingin—minuman lokal paling umum." },
					{ name: "Kopi Indonesia", description: "Kopi robusta lokal, sering dibawa dalam termos untuk day trip." },
					{ name: "Air Kelapa", description: "Air kelapa segar kaya elektrolit." },
					{ name: "Jamu", description: "Minuman herbal tradisional, kadang dibuat fresh di sekitar." },
					{ name: "Air Botol", description: "Bawa air minum aman yang cukup—jangan minum langsung dari aliran sungai." },
				],
			},
			konaklama: [
				{ name: "Guesthouse Desa Tetebatu", description: "Penginapan keluarga yang hemat di desa Tetebatu terdekat." },
				{ name: "Bungalow Lembah Sembalun", description: "Penginapan lebih remote dengan vibe alam—alternatif base." },
				{ name: "Lodge Ekowisata Lombok", description: "Eco-lodge untuk outdoor living dan immersion alam." },
				{ name: "Gateway Rinjani", description: "Menginap di area Senaru/Sembalun—cocok untuk dikombinasikan dengan trip Rinjani." },
				{ name: "Opsi Camping", description: "Camping dasar di area alam (jika diizinkan)—cek aturan dan keamanan." },
			],
			konaklamaSuresi: "1–2 hari",
			konaklamaBudgeti: "USD 600–950",
			alisveris: [
				{ name: "Toko Desa Tetebatu", description: "Toko kebutuhan untuk air, teh, snack, dan suplai dasar." },
				{ name: "Pasar Petani Lokal", description: "Pasar pagi untuk buah segar, sayur, dan produk lokal." },
				{ name: "Toko Kerajinan", description: "Kerajinan lokal seperti ukiran kayu dan gerabah—souvenir nature tour." },
				{ name: "ATM & Money Exchange", description: "ATM terbatas (sering di Tetebatu/Sembalun)—siapkan uang tunai cukup." },
			],
		},
	},
};

export const kesfetDestinationDetailsId = deepMerge(
	kesfetDestinationDetailsTr,
	kesfetDestinationDetailsIdOverrides,
);
