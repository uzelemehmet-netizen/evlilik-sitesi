import { kesfetDestinationDetailsTr } from './tr';
import { deepMerge } from './merge';

const kesfetDestinationDetailsEnOverrides = {
	bali: {
		ubud: {
			description:
				"Ubud is Bali’s cultural and spiritual heart. With lush rice terraces, ancient temples, and traditional art galleries, it’s perfect for travelers seeking calm, nature, and a deeper local atmosphere.",
			gezilecekYerler: [
				{
					name: "Monkey Forest",
					description: "Sacred forest area with free-roaming monkeys and temples",
				},
				{
					name: "Campuhan Ridge Walk",
					description: "Scenic ridge walk with valley views, ideal for sunset",
				},
				{
					name: "Goa Gajah (Elephant Cave)",
					description: "Ancient Hindu-Buddhist temple complex",
				},
				{
					name: "Tirta Empul Temple",
					description: "Temple where holy-water purification rituals are performed",
				},
				{
					name: "Gunung Kawi",
					description: "Ancient rock-cut tombs and shrines",
				},
				{
					name: "Tegenungan Waterfall",
					description: "Swimming spots and viewpoints",
				},
				{
					name: "Kanto Lampo Waterfall",
					description: "Stepped rock waterfall, popular for photos",
				},
				{
					name: "Ubud Palace",
					description: "Traditional architecture and evening Balinese dance shows",
				},
				{
					name: "Ubud Art Market",
					description: "Handicrafts and local products",
				},
			],
			aktiviteler: [
				{
					name: "Rafting (Ayung River)",
					description: "Guided white-water rafting with jungle views",
					icon: "🚣",
				},
				{
					name: "Yoga & Meditation",
					description: "Beginner to advanced classes at world-famous yoga studios",
					icon: "🧘",
				},
				{
					name: "Nature Walks",
					description: "Forest trails and routes with valley views",
					icon: "🥾",
				},
				{
					name: "Waterfall Tours",
					description: "Guided or self-planned trips with swimming breaks",
					icon: "💧",
				},
				{
					name: "Spa & Healing Therapies",
					description: "Balinese massage, sound therapy, and energy-balancing sessions",
					icon: "💆",
				},
				{
					name: "Cultural Workshops",
					description: "Balinese dance, traditional music, and handicraft experiences",
					icon: "🎨",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"Local / Indonesian – Balinese": [
					{
						name: "Ayam Betutu",
						description: "Slow-cooked chicken with spices—tender and aromatic",
					},
					{
						name: "Nasi Campur",
						description: "Rice with chicken, vegetables, egg, and Balinese-style sides",
					},
					{
						name: "Nasi Goreng",
						description: "Spicy fried rice with egg",
					},
					{
						name: "Sate Ayam",
						description: "Grilled chicken skewers with peanut sauce",
					},
					{
						name: "Gado-Gado",
						description: "Boiled vegetables and egg with a rich peanut sauce",
					},
					{
						name: "Tempeh & Tofu",
						description: "Soy-based local protein dishes—fried or stir-fried",
					},
					{
						name: "Soto Ayam",
						description: "Light chicken soup with ginger and spices",
					},
				],
				"Western Cuisine": [
					{
						name: "Vegan & Vegetarian Restaurants",
						description: "Ubud is Bali’s hub for plant-based dining",
					},
					{
						name: "Italian and French Cuisine",
						description: "Classic European flavors",
					},
					{
						name: "Organic & Farm-to-Table",
						description: "Restaurants using fresh ingredients from local farms",
					},
					{
						name: "Healthy Breakfast & Brunch",
						description: "Organic and nutritionally balanced options",
					},
				],
				"Turkish Cuisine – Available Nearby (Kuta/Canggu 45–60 min)": [
					{
						name: "Cappadocia Turkish Restaurant (Canggu)",
						description:
							"45–60 minutes from Ubud. AUTHENTIC Turkish. Pide, Döner, Adana Kebab, Meze, Baklava. 4.7/5 ⭐. +62 812-3841-1575",
					},
					{
						name: "Sumak Turkish Cuisine (Seminyak)",
						description:
							"50–60 minutes from Ubud. MICHELIN LEVEL Turkish. Adana Kebab, Iskender, Turkish Dumplings. 4.8/5 ⭐. sumakbali.com",
					},
				],
				"Non-Alcoholic Drinks": [
					{
						name: "Fresh Fruit Juices",
						description: "Papaya, mango, pineapple, dragon fruit",
					},
					{
						name: "Smoothies & Detox Drinks",
						description: "Made with greens and tropical fruits",
					},
					{
						name: "Balinese Coffee",
						description: "Intensely aromatic, made from local beans",
					},
					{
						name: "Herbal Teas",
						description: "Ginger, lemongrass, cinnamon",
					},
					{
						name: "Coconut Water",
						description: "A natural source of electrolytes",
					},
				],
				"Specialty Coffee & Cafe Experiences": [
					{
						name: "Luwak Coffee",
						description: "One of the world’s most famous and expensive coffees",
					},
					{
						name: "Single Origin Arabica",
						description: "High-quality coffee from different regions of Bali",
					},
					{
						name: "Specialty Brewing Methods",
						description: "Pour-over, siphon, espresso, and other manual brews",
					},
					{
						name: "Artisan Cafes",
						description: "Minimalist cafés blending art and coffee, with work-friendly areas",
					},
				],
				"Asian Cuisine": [
					{
						name: "Thai Dishes",
						description: "Tom yum, pad thai, green curry, and spicy Thai salads",
					},
					{
						name: "Japanese Cuisine",
						description: "Sushi, ramen, donburi, and tempura",
					},
					{
						name: "Korean Cuisine",
						description: "Bibimbap, bulgogi, kimchi, and tteokbokki",
					},
					{
						name: "Vietnamese Cuisine",
						description: "Pho, banh mi, spring rolls, and fish-sauce salads",
					},
				],
				"Desserts & Traditional Balinese Pastries": [
					{
						name: "Jaje Kueh",
						description: "Traditional Balinese sweets made with coconut and gula Jawa",
					},
					{
						name: "Lumpia",
						description: "Sweet sticky rolls commonly filled with banana",
					},
					{
						name: "Pisang Goreng",
						description: "Fried banana with caramel and sweet syrup",
					},
					{
						name: "Modern Pastry Scene",
						description: "Fusion desserts, macarons, cheesecake, and craft pastries",
					},
				],
				"Raw Food & Wellness Cafes": [
					{
						name: "Smoothie & Acai Bowls",
						description: "Tropical fruits, granola, and coconut flakes",
					},
					{
						name: "Raw Vegan Plates",
						description: "Raw vegetables, seeds, and fermented dishes",
					},
					{
						name: "Detox & Cleanse Programs",
						description: "Special diets with green juices and organic vegetable-based menus",
					},
					{
						name: "Superfood Lattes",
						description: "Matcha, turmeric, spirulina, and plant-based milk drinks",
					},
				],
			},
			konaklama: [
				{
					name: "Boutique Hotels",
					description: "Close to central Ubud, surrounded by nature, small-room concepts",
				},
				{
					name: "Jungle & Rice Field View Resorts",
					description: "Quiet and luxurious stays with forest and rice-field views",
				},
				{
					name: "Private Pool Villas",
					description: "Ideal for honeymoons and longer stays",
				},
				{
					name: "Eco Lodges & Bamboo Hotels",
					description: "Sustainable, nature-friendly accommodation",
				},
				{
					name: "Guesthouses & Yoga Retreat Centers",
					description: "Focused on long stays and spiritual experiences",
				},
			],
			konaklamaSuresi: "4 days",
			konaklamaBudgeti: "USD 1,000–1,500",
			alisveris: [
				{
					name: "Ubud Market",
					description: "Ubud’s most famous market for traditional textiles, art, and handicrafts",
				},
				{
					name: "Ubud Arts Festival Market",
					description: "Seasonal market selling paintings, sculptures, and decorative items by local artists",
				},
				{
					name: "Tegallalang Craft Village",
					description: "Village market near the rice terraces for wood carving and souvenirs",
				},
				{
					name: "Batik & Silver Workshops",
					description: "Batik dyeing and silver jewelry shops—watch the making process",
				},
				{
					name: "Ubud Shopping Mall",
					description: "Modern mall in central Ubud with brands and local products",
				},
				{
					name: "Hand-Carved Wood Art",
					description: "Masks, statues, decorative objects",
				},
				{
					name: "Silver Jewelry",
					description: "Handmade by local artisans",
				},
				{
					name: "Art Paintings & Prints",
					description: "From Ubud’s artist villages",
				},
				{
					name: "Yoga & Meditation Products",
					description: "Mats, clothing, natural accessories",
				},
				{
					name: "Natural Cosmetics",
					description: "Soaps, oils, incense",
				},
				{
					name: "Textiles & Batik",
					description: "Shawls, pareos, handwoven fabrics",
				},
				{
					name: "Bali-Themed Gifts",
					description: "Cultural symbols and decorative items",
				},
			],
		},
		kuta: {
			description:
				"Kuta is Bali’s most famous beach destination, known for world-class surf spots, iconic sunsets, and a lively beachfront scene. As one of the main tourist hubs, Kuta offers a wide range of accommodation, dining, and entertainment options for both water-sports lovers and holidaymakers.",
			gezilecekYerler: [
				{
					name: "Kuta Beach",
					description: "Surfing, swimming, and watching the sunset",
				},
				{
					name: "Legian Beach",
					description: "Next to Kuta—quieter beach area with quality surf waves",
				},
				{
					name: "Legian Street",
					description: "Nightlife with bars and clubs",
				},
				{
					name: "Beachwalk Mall",
					description: "Shopping with cafés and restaurants",
				},
				{
					name: "Waterbom Bali",
					description: "One of Asia’s best waterparks—full-day activity",
				},
				{
					name: "Tanah Lot Temple",
					description: "Capture sunset photos at the iconic sea temple",
				},
			],
			aktiviteler: [
				{
					name: "Surfing",
					description: "Ideal beginner waves; 1:1 surf lessons available along the beach",
					icon: "🏄",
				},
				{
					name: "Jet Ski",
					description: "Short adrenaline activity at Kuta Beach",
					icon: "🚤",
				},
				{
					name: "Banana Boat",
					description: "Fun group water activity",
					icon: "🛥️",
				},
				{
					name: "Parasailing",
					description: "A scenic flight experience over the sea",
					icon: "🪂",
				},
				{
					name: "Swimming",
					description: "Wide sandy beach—watch out for strong waves",
					icon: "🏊",
				},
				{
					name: "Beach Clubs & Bars",
					description: "Music all day, sunset vibes, and socializing",
					icon: "🍹",
				},
				{
					name: "Nightclubs",
					description: "Kuta has Bali’s most energetic nightlife",
					icon: "🎉",
				},
				{
					name: "ATV Tours",
					description: "Mud, jungle, and off-road riding in nearby villages",
					icon: "🏍️",
				},
				{
					name: "Spa & Massage",
					description: "Affordable Balinese massage and reflexology centers",
					icon: "💆",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"🔹 Local / Indonesian – Balinese": [
					{
						name: "Nasi Goreng",
						description: "Vegetable, egg, and spicy fried rice; with chicken or plain",
					},
					{
						name: "Mie Goreng",
						description: "Spicy fried noodles with vegetables and chicken",
					},
					{
						name: "Nasi Campur",
						description: "Rice with chicken, vegetables, egg, and assorted small sides",
					},
					{
						name: "Sate Ayam",
						description: "Grilled chicken skewers served with peanut sauce",
					},
					{
						name: "Gado-Gado",
						description: "Boiled vegetables and egg salad with peanut sauce",
					},
					{
						name: "Soto Ayam",
						description: "Ginger-and-spice chicken soup—light but filling",
					},
				],
				"🔹 Western Cuisine": [
					{
						name: "Pizza & Pasta",
						description: "Italian restaurants are common and use fresh ingredients",
					},
					{
						name: "Burger & Steak",
						description: "American and Australian-style dining",
					},
					{
						name: "Seafood",
						description: "Grilled fish, shrimp, and calamari",
					},
				],
				"🔹 Turkish Cuisine – Available Nearby": [
					{
						name: "Cappadocia Turkish Restaurant (Canggu - 15 min)",
						description:
							"Jl. Munduk Catu No.3 (Canggu). AUTHENTIC Turkish. Pide, Döner, Adana Kebab, Meze, Baklava. 4.7/5 ⭐ TripAdvisor. +62 812-3841-1575",
					},
					{
						name: "Sumak Turkish Cuisine (Seminyak/Kerobokan - 15 min)",
						description:
							"MICHELIN LEVEL authentic Turkish. Adana Kebab, Iskender, Turkish Dumplings, Baklava. 4.8/5 ⭐ TripAdvisor. sumakbali.com",
					},
					{
						name: "Istanbul Meze Kebab House (Kerobokan - 10 min)",
						description:
							"Fresh mezze, kebab, manti, babaganoush. 4.2/5 ⭐ TripAdvisor. Shisha place with vegetarian options.",
					},
				],
				"🔹 Non-Alcoholic Drinks": [
					{
						name: "Coconut Water",
						description: "Fresh and widely available from street vendors",
					},
					{
						name: "Mango / Pineapple / Papaya Juice",
						description: "Natural and unsweetened",
					},
					{
						name: "Avocado Juice",
						description: "A Bali specialty—milky and filling",
					},
					{
						name: "Balinese Coffee",
						description: "Strong local coffee",
					},
					{
						name: "Ginger Tea",
						description: "Refreshing and soothing for the stomach",
					},
				],
			},
			konaklama: [
				{
					name: "Luxury Beach Resorts",
					description: "5-star hotels with direct beach access and infinity pools",
				},
				{
					name: "Boutique Beach Hotels",
					description: "Stylish design hotels with high service quality",
				},
				{
					name: "Budget Beach Hotels",
					description: "Ideal for young travelers and budget-friendly holidays",
				},
				{
					name: "Beach Bungalows",
					description: "Comfortable and affordable stays with private gardens near the beach",
				},
				{
					name: "Luxury Pool Villas",
					description: "High-comfort villas with private pools",
				},
			],
			konaklamaSuresi: "3 days",
			konaklamaBudgeti: "USD 700–1,000",
			alisveris: [
				{
					name: "Beachwalk Mall",
					description: "Modern seaside mall in Kuta with international and local brands",
				},
				{
					name: "Discovery Shopping Mall",
					description: "Shopping center with fashion, electronics, and home goods",
				},
				{
					name: "Kuta Square",
					description: "Open-air area selling local crafts, textiles, and souvenirs",
				},
				{
					name: "Legian Street Market",
					description: "Night market with local designer items and cultural souvenirs",
				},
				{
					name: "Tanah Lot Craft Market",
					description: "Market near Tanah Lot for traditional Balinese crafts and gifts",
				},
				{
					name: "Surf Clothing & Gear",
					description: "Brands like Rip Curl, Billabong; boards and protective gear",
				},
				{
					name: "Beachwear",
					description: "Shorts, dresses, pareos, flip-flops, and beach accessories",
				},
				{
					name: "Bali-Themed T-Shirts",
					description: "Popular gifts; very affordable",
				},
				{
					name: "Wooden Masks & Statues",
					description: "Traditional Balinese craftsmanship; custom designs possible",
				},
				{
					name: "Handmade Bracelets & Jewelry",
					description: "Bargain at street markets; many colors and designs",
				},
				{
					name: "Magnets & Small Souvenirs",
					description: "Easy-to-carry keepsakes, common in tourist shops",
				},
			],
		},
		seminyak: {
			description:
				"Seminyak is Bali’s most upscale and sophisticated beach area. Known for iconic beach clubs, gourmet restaurants, and high-end hotels and villas, it’s a favorite for travelers seeking comfort, style, and a lively (but polished) nightlife scene.",
			gezilecekYerler: [
				{
					name: "Seminyak Beach",
					description: "One of Bali’s most popular beaches, famous for sunsets and beachfront vibes",
				},
				{
					name: "Oberoi Street",
					description: "Trendy street lined with luxury restaurants, cafés, and boutiques",
				},
				{
					name: "Double Six Beach Club",
					description: "Popular beach club for sunset parties and upscale dining",
				},
				{
					name: "Seminyak Village",
					description: "Shopping area with boutique stores, galleries, and designer shops",
				},
				{
					name: "Café & Restaurant Clusters",
					description: "Prestigious venues serving world cuisines and Balinese favorites",
				},
				{
					name: "Umalas Walks",
					description: "Easy nature walks near Seminyak through greenery and local fields",
				},
				{
					name: "Petitenget Temple",
					description: "A small temple to experience Balinese Hindu culture",
				},
				{
					name: "Ku De Ta Beachfront",
					description: "Iconic beachfront spot with ocean views and sunset atmosphere",
				},
			],
			aktiviteler: [
				{
					name: "Beach Time & Swimming",
					description: "Seminyak Beach is wide and sandy—great for relaxing and swimming",
					icon: "🏊",
				},
				{
					name: "Beach Club Experience",
					description: "Spend a full day at Potato Head, Ku De Ta, and similar venues",
					icon: "🍹",
				},
				{
					name: "Spa & Wellness",
					description: "Balinese massage, aromatherapy, and premium spa experiences",
					icon: "💆",
				},
				{
					name: "Yoga & Pilates",
					description: "Studio and beach-based classes for all levels",
					icon: "🧘",
				},
				{
					name: "Sunset Watching",
					description: "Enjoy sunsets from beach bars and beach clubs",
					icon: "🌅",
				},
				{
					name: "Café & Restaurant Hopping",
					description: "One of Bali’s densest areas for top-rated restaurants",
					icon: "🍽️",
				},
				{
					name: "Nightlife",
					description: "Stylish bars and lounges—generally more upscale than Kuta",
					icon: "🎉",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"🔹 Local / Indonesian – Balinese": [
					{ name: "Nasi Campur", description: "Rice with chicken, vegetables, and assorted Balinese sides" },
					{ name: "Nasi Goreng", description: "Spicy fried rice with egg" },
					{ name: "Sate Ayam", description: "Grilled chicken skewers with peanut sauce" },
					{ name: "Gado-Gado", description: "Vegetables and egg with a rich peanut sauce" },
					{ name: "Soto Ayam", description: "Light, spiced chicken soup" },
					{ name: "Tempeh & Tofu", description: "Local soy-based proteins—fried or stir-fried" },
				],
				"🔹 Gourmet & Fine Dining": [
					{
						name: "Mozaic Beach Club",
						description: "High-end dining with Indonesian and international fusion influences",
					},
					{
						name: "Kayuputi",
						description: "Fine dining—seafood and modern Balinese-inspired dishes",
					},
					{
						name: "Kafe Wayan Restaurant",
						description: "Authentic Balinese and Javanese flavors served in an elegant setting",
					},
				],
				"🔹 Beach Club Cuisine": [
					{
						name: "Double Six Dining",
						description: "Mediterranean and international dishes with beachfront views",
					},
					{
						name: "Bali Hai Cliff Club",
						description: "Seafood and global cuisine with panoramic views",
					},
					{
						name: "Seminyak Beach Club Menus",
						description: "Casual bites and cocktails paired with live music",
					},
				],
				"🔹 Casual Dining": [
					{ name: "Warungs & Local Restaurants", description: "Affordable and traditional Balinese meals" },
					{ name: "Cafés & Coffee Spots", description: "Espresso drinks and outdoor seating are common" },
				],
				"🔹 Turkish Cuisine – Sumak Turkish Cuisine (near Kerobokan)": [
					{
						name: "Sumak Turkish Cuisine",
						description:
							"About 3–5 km from Seminyak (10–15 minutes). Authentic Turkish dishes such as Adana kebab, Iskender, manti, baklava, and fresh meze platters. (Info as listed by venue.)",
					},
					{
						name: "Döner & Kebab Options",
						description: "Special döner and a variety of kebabs (lamb/chicken) depending on menu",
					},
					{
						name: "Pide & Turkish Bread",
						description: "House-made pide and bread options",
					},
				],
				"🔹 Non-Alcoholic Drinks": [
					{ name: "Smoothies & Smoothie Bowls", description: "Made with tropical fruits" },
					{ name: "Fresh Juices", description: "Mango, pineapple, watermelon, dragon fruit" },
					{ name: "Herbal Teas", description: "Ginger, lemongrass, mint" },
					{ name: "Cold Brew & Specialty Coffee", description: "Third-wave coffee shops are common" },
					{ name: "Coconut Water", description: "Natural and refreshing" },
				],
			},
			konaklama: [
				{ name: "4-Star Hotels", description: "Modern design, near the beach, often with pools" },
				{ name: "5-Star Hotels & Resorts", description: "Luxury stays with spa and beach club amenities" },
				{ name: "Pool Villas", description: "Private pools—great for couples and groups" },
				{ name: "Boutique Hotels", description: "Smaller, stylish, and quieter concepts" },
				{ name: "Serviced Apartments", description: "Flexible budgets and longer stays" },
			],
			konaklamaSuresi: "3 days",
			konaklamaBudgeti: "USD 900–1,300",
			alisveris: [
				{ name: "Seminyak Village", description: "Boutique stores, designer clothing, and art galleries" },
				{ name: "Oberoi Street Shopping", description: "High-end brands and independent designer shops" },
				{ name: "Petitenget Gallery", description: "Art, jewelry, and decorative items" },
				{ name: "Seminyak Beachfront Shops", description: "Beachwear, surf gear, and sports brands" },
				{ name: "Local Craft Markets", description: "Handmade products, souvenirs, and textiles" },
				{ name: "Designer Boutiques", description: "Local and international fashion labels" },
				{ name: "Resort & Beach Clothing", description: "Chic dresses, pareos, sandals" },
				{ name: "Handmade Jewelry", description: "Silver, natural stones, and boho designs" },
				{ name: "Home Décor", description: "Bali-style wooden and bamboo items" },
				{ name: "Natural Cosmetics & Spa Products", description: "Coconut oil, soaps, incense" },
				{ name: "Souvenirs", description: "Minimal Bali-themed accessories" },
			],
		},
		uluwatu: {
			description:
				"Uluwatu is one of Bali’s most dramatic cliffside areas. It’s famous for the ancient Uluwatu Temple perched above the ocean, iconic surf breaks, and ocean-view beach clubs. Sunset sessions and Kecak dance performances are major highlights.",
			gezilecekYerler: [
				{ name: "Uluwatu Temple", description: "Watch the sunset and the Kecak dance at the cliffside temple" },
				{ name: "Pasir Putih Beach", description: "A quieter beach—popular for surfing and snorkeling" },
				{ name: "Padang Padang Beach", description: "Small bay for swimming and photos" },
				{ name: "Suluban / Blue Point Beach", description: "Surf beach accessed through a cave-like passage" },
				{ name: "Bingin Beach", description: "Peaceful bay for sunsets and beach walks" },
				{ name: "Dreamland Beach", description: "Wide sandy beach for swimming and sunbathing" },
				{ name: "Melasti Beach", description: "Turquoise water, cliff views, and photo spots" },
				{ name: "Single Fin", description: "Iconic cliff bar with a sunset viewpoint" },
			],
			aktiviteler: [
				{ name: "Surfing (Advanced)", description: "World-famous reef breaks—best for experienced surfers", icon: "🏄" },
				{ name: "Beach Time & Swimming", description: "Enjoy natural coves—pay attention to tides", icon: "🏊" },
				{ name: "Cliff Beach Club Experience", description: "Ocean-view pools and all-day relaxation", icon: "🏖️" },
				{ name: "Sunset Watching", description: "Some of Bali’s most impressive sunsets from the cliffs", icon: "🌅" },
				{ name: "Yoga & Meditation", description: "Outdoor sessions in quiet nature settings", icon: "🧘" },
				{ name: "Spa & Massage", description: "Wellness treatments with sea views", icon: "💆" },
				{ name: "Photography & Drone Shots", description: "Cliffs and turquoise seascapes are perfect backdrops", icon: "📸" },
				{ name: "Boat & Coast Exploration", description: "Short boat trips to nearby coves", icon: "🚤" },
				{ name: "Snorkeling", description: "Explore reef areas with local guidance", icon: "🤿" },
				{ name: "Kecak Dance Show", description: "Traditional Balinese performance at Uluwatu Temple", icon: "🎭" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Local / Indonesian – Balinese": [
					{ name: "Nasi Goreng (Uluwatu Style)", description: "Special fried rice with seafood and local spices" },
					{ name: "Ikan Bakar (Grilled Fish)", description: "Fresh daily catch grilled with Balinese spices" },
					{ name: "Sate Ayam", description: "Grilled chicken skewers with peanut sauce" },
					{ name: "Nasi Campur", description: "Rice with chicken, vegetables, and assorted sides" },
				],
				"Beach Clubs & Fine Dining": [
					{ name: "Seafood Platter", description: "Fresh seafood served grilled or with Asian-style sauces" },
					{ name: "Gourmet Fusion", description: "Asian–Western fusion with ocean views" },
					{ name: "Steak & Grill", description: "Premium meats prepared by the chef" },
				],
				"Non-Alcoholic Drinks": [
					{ name: "Coconut Water", description: "Fresh and natural" },
					{ name: "Fresh Juices", description: "Mango, papaya, pineapple, watermelon" },
					{ name: "Smoothies & Detox Drinks", description: "Refreshing and nourishing" },
					{ name: "Balinese Coffee", description: "Local beans with bold aroma" },
					{ name: "Herbal Teas", description: "Ginger, lemongrass, chamomile" },
				],
				"Western Cuisine": [
					{ name: "Fine-Dining Restaurants", description: "High-end cooking and presentation" },
					{ name: "Steakhouse & Seafood", description: "Premium meats and seafood" },
					{ name: "Mediterranean Cuisine", description: "Greek, Spanish, and Italian flavors" },
					{ name: "Italian Cuisine", description: "Pasta, risotto, and classics" },
					{ name: "Vegan & Healthy Menus", description: "Organic and balanced options" },
				],
				"Turkish Cuisine – Available Nearby (Kuta ~30 min)": [
					{
						name: "Cappadocia Turkish Restaurant (Canggu - 25–30 min)",
						description:
							"Authentic Turkish cuisine (pide, döner, Adana kebab, meze, baklava). (Info as listed by venue.)",
					},
					{
						name: "Istanbul Meze Kebab House (Kerobokan - 20 min)",
						description:
							"Fresh meze, kebab, manti, babaganoush. Also known for shisha and vegetarian options.",
					},
				],
			},
			konaklama: [
				{ name: "Cliff-View Resorts", description: "Luxury concept on the cliffs with ocean views" },
				{ name: "5-Star Hotels", description: "Private beach access, spa, and fine dining" },
				{ name: "Pool Villas", description: "Infinity pools—ideal for couples and honeymoons" },
				{ name: "Boutique Hotels", description: "Quiet, stylish, nature-friendly design" },
				{ name: "Surf Lodges & Guesthouses", description: "Practical and budget-friendly options for surfers" },
			],
			konaklamaSuresi: "3 days",
			konaklamaBudgeti: "USD 1,100–1,700",
			alisveris: [
				{ name: "Uluwatu Beach Club Shops", description: "Surfwear, bikinis, and beachwear brands" },
				{ name: "Local Craft Market", description: "Handicrafts, jewelry, and decorative items" },
				{ name: "Surf & Water Sports Stores", description: "Boards, clothing, and water-sports equipment" },
				{ name: "Art Galleries", description: "Paintings and sculptures by local artists" },
				{ name: "Bali-Themed Souvenirs", description: "Temple replicas and traditional accessories" },
			],
		},
		nusaDua: {
			description:
				"Nusa Dua is Bali’s most premium, master-planned resort area. Built as an organized tourism complex, it hosts world-class resorts, golf courses, yachting and water-sports facilities. With calm, safe beaches and clear water, it’s a top choice for luxury-focused holidays.",
			gezilecekYerler: [
				{ name: "Nusa Dua Beach", description: "Calm sea for swimming and sunbathing" },
				{ name: "Water Blow", description: "Natural wave-splash spectacle and photo spot" },
				{ name: "Geger Beach", description: "A quieter, more local-feeling beach with clear water" },
				{ name: "Bali Collection", description: "Shopping, restaurants, and cafés in one complex" },
				{ name: "Museum PASIFIKA", description: "Asia–Pacific art collections and cultural exhibits" },
				{ name: "Puputan Monument", description: "Historical monument area related to Balinese history" },
				{ name: "Turtle Island (Pulau Penyu)", description: "An island where you can see sea turtles (visit responsibly)" },
				{ name: "Bali Nusa Dua Convention Center", description: "Events and conferences; sometimes hosts cultural shows" },
			],
			aktiviteler: [
				{ name: "Jet Ski", description: "High-speed rides in controlled, safe zones", icon: "🏎️" },
				{ name: "Banana Boat", description: "Fun water activity for families and groups", icon: "🍌" },
				{ name: "Parasailing", description: "Scenic flight above the ocean", icon: "🪂" },
				{ name: "Snorkeling", description: "Coral and fish spotting in calm, clear water", icon: "🤿" },
				{ name: "Scuba Diving", description: "Beginner and certified dive options", icon: "🤿" },
				{ name: "Swimming", description: "One of Bali’s calmest beaches—usually low waves", icon: "🏊" },
				{ name: "Golf", description: "Ocean-view, world-standard golf courses", icon: "⛳" },
				{ name: "Spa & Wellness", description: "Luxury resort spas with Balinese treatments", icon: "💆" },
				{ name: "Cycling Tours", description: "Flat routes through resort areas and along the coast", icon: "🚴" },
				{ name: "Boat Trip", description: "Yachting and exploring nearby waters", icon: "⛵" },
				{ name: "Sunset Cruise", description: "Romantic dinner-cruise experience", icon: "🌅" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Local / Indonesian – Balinese": [
					{ name: "Nasi Goreng", description: "Local-style spicy fried rice" },
					{ name: "Sate Lilit", description: "Balinese minced satay (often fish) with aromatic spices" },
					{ name: "Bebek Betutu", description: "Duck cooked slowly in spices, traditionally wrapped" },
				],
				"Fine Dining": [
					{ name: "Michelin-Star-Level Restaurants", description: "High-end cooking and presentation" },
					{ name: "International Cuisine", description: "European, Asian, and American options" },
					{ name: "Seafood Specialty Restaurants", description: "Signature preparations of fresh seafood" },
				],
				"Non-Alcoholic Drinks": [
					{ name: "Fresh Juices", description: "Made from Bali’s tropical fruits" },
					{ name: "Balinese Coffee", description: "Bold coffee from local beans" },
					{ name: "Smoothies & Detox", description: "Made with organic fruits and greens" },
				],
				"Turkish Cuisine – Available Nearby (Kuta ~40 min)": [
					{
						name: "Sumak Turkish Cuisine (Seminyak - 35–40 min)",
						description:
							"Authentic Turkish dishes such as Adana kebab, Iskender, manti, and baklava. (Info as listed by venue.)",
					},
					{
						name: "Cappadocia Turkish Restaurant (Canggu - 40–45 min)",
						description:
							"Authentic Turkish cuisine (pide, döner, Adana kebab, meze, baklava). (Info as listed by venue.)",
					},
				],
			},
			konaklama: [
				{
					name: "5-Star Resorts",
					description:
						"Large properties with private beaches and half-board/all-inclusive options",
				},
				{ name: "Ultra-Luxury Hotels", description: "Private-villa concepts with personal butler services" },
				{ name: "Beachfront Hotels", description: "Quiet and secure stays right on the sea" },
				{ name: "Family-Friendly Resorts", description: "Kids clubs, water parks, and family activities" },
				{ name: "Pool Villas", description: "For more privacy and a quieter stay" },
			],
			konaklamaSuresi: "3 days",
			konaklamaBudgeti: "USD 1,300–2,000",
			alisveris: [
				{ name: "Bali Collection", description: "International brands and luxury boutiques" },
				{ name: "Nusa Dua Plaza", description: "Trendy products and electronics" },
				{ name: "Resort Shops", description: "Designer stores inside hotels" },
				{ name: "Beachfront Gift Shops", description: "Bali souvenirs and gifts" },
				{ name: "Jewelry & Watch Stores", description: "Luxury watches and jewelry" },
				{ name: "Handicrafts", description: "Wood carvings and Balinese masks" },
				{ name: "Batik & Textiles", description: "Shawls, pareos, and woven fabrics" },
				{ name: "Natural Cosmetics & Spa Products", description: "Oils, soaps, and care sets" },
				{ name: "Resort Stores", description: "Luxury gifts and beach accessories" },
				{ name: "Photo & Souvenir Items", description: "Magnets, postcards, and decorative keepsakes" },
			],
		},
		canggu: {
			description:
				"Canggu is Bali’s trendiest and most dynamic area. Known for great surf spots, hip cafés and bars, design-forward boutique hotels, and a young creative community, it’s especially popular with digital nomads and young professionals—and it offers some of Bali’s liveliest nightlife.",
			gezilecekYerler: [
				{ name: "Batu Bolong Beach", description: "Surfing, sunsets, and beach walks" },
				{ name: "Echo Beach", description: "Surf breaks, seaside restaurants, and photo spots" },
				{ name: "Berawa Beach", description: "Wide coastline and beach clubs" },
				{ name: "Tanah Lot Temple", description: "Iconic sea temple and sunset views" },
				{ name: "Rice Fields", description: "Easy walks and photo opportunities" },
				{ name: "Canggu Street Art Spots", description: "Modern murals and art corners" },
				{ name: "Finns Beach Club", description: "Popular beach club with music and sunsets" },
				{ name: "Old Man's", description: "A well-known sunset bar near surf spots" },
				{ name: "Padma Utara Temple", description: "Quiet, authentic Hindu temple" },
				{ name: "Betelnut Cafe", description: "Trendy, Instagram-friendly café" },
				{ name: "Bali Swing", description: "Jungle swing experience" },
				{ name: "Warung Bodag Baruna", description: "Seaside seafood restaurant" },
				{ name: "Canggu Komputer", description: "Local market feel for a more authentic vibe" },
				{ name: "Pantai Batu Mejan", description: "Quieter local beach" },
				{ name: "Goa Gajah Tembuku", description: "Cave-temple spot mixing nature and history" },
				{ name: "Pererenan Beach", description: "Less-known, more secluded beach" },
			],
			aktiviteler: [
				{ name: "Surfing", description: "Great waves for beginners and intermediates", icon: "🏄" },
				{ name: "Surf Lessons", description: "Private or group classes with certified instructors", icon: "🏄" },
				{ name: "ATV Tours", description: "Off-road rides through rice fields and village roads", icon: "🏍️" },
				{ name: "Yoga & Meditation", description: "World-class studios and retreat centers", icon: "🧘" },
				{ name: "Spa & Massage", description: "Balinese massage, aromatherapy, and relaxation therapies", icon: "💆" },
				{ name: "Swimming", description: "Ocean and pool alternatives", icon: "🏊" },
				{ name: "Beach Club Experience", description: "All-day music, relaxing, and socializing", icon: "🏖️" },
				{ name: "Bicycle & Scooter Tours", description: "Explore freely along the coast and village roads", icon: "🚴" },
				{ name: "Sunset Watching", description: "Sunset vibes from the beach and beach clubs", icon: "🌅" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Local / Indonesian – Balinese": [
					{ name: "Nasi Goreng", description: "Local-style spicy fried rice" },
					{ name: "Satay & BBQ", description: "Various grilled meat styles" },
					{ name: "Gado-Gado", description: "Vegetable salad with peanut sauce" },
					{ name: "Lumpia", description: "Fried spring rolls with a seasoned filling" },
					{ name: "Perkedel", description: "Golden, crispy potato patties" },
					{ name: "Rendang", description: "Rich coconut beef stew with deep spices" },
				],
				"Cafés & Health Food": [
					{ name: "Organic Brunch", description: "Healthy and organic breakfast menus" },
					{ name: "Vegan & Vegetarian", description: "Plant-based meal options" },
					{ name: "Smoothies & Bowls", description: "Açaí bowls and smoothie bowls" },
				],
				"International & Fusion": [
					{ name: "Modern Asian Cuisine", description: "Contemporary Asian flavors" },
					{ name: "Mediterranean", description: "Mediterranean-style dishes" },
					{ name: "Mexican & Latin", description: "Mexican and Latin American cuisine" },
				],
				"Turkish Cuisine – Cappadocia Turkish Restaurant": [
					{
						name: "Cappadocia Turkish Restaurant",
						description:
							"Located in Canggu (Jl. Munduk Catu No.3). Turkish classics such as pide, döner, Adana kebab, meze platters, manti, baklava, and Turkish coffee. (Info as listed by venue.)",
					},
					{ name: "Pide & Manti", description: "House-made pide and manti options" },
					{ name: "Kebab Varieties", description: "Adana kebab, lamb shish, chicken kebab (menu-dependent)" },
					{ name: "Meze & Appetizers", description: "Hummus, baba ganoush, tzatziki, dolma, and more" },
					{ name: "Turkish Desserts", description: "Baklava and other classic sweets" },
				],
				"Non-Alcoholic Drinks": [
					{ name: "Coconut Water", description: "Natural and fresh" },
					{ name: "Smoothie Bowls", description: "Fruit and superfood blends" },
					{ name: "Fresh Juices", description: "Mango, pineapple, papaya" },
					{ name: "Cold Brew Coffee", description: "Popular cold-brew options" },
					{ name: "Herbal Teas", description: "Ginger, lemongrass" },
					{ name: "Es Jeruk", description: "Local citrus drink—sweet and refreshing" },
				],
			},
			konaklama: [
				{ name: "4–5 Star Hotels", description: "Modern design, close to the beach, social spaces" },
				{ name: "Pool Villas", description: "Private pools—ideal for couples and groups" },
				{ name: "Boutique Hotels", description: "Design-forward, quiet, and stylish" },
				{ name: "Hostels & Co-Living", description: "Popular with digital nomads and young travelers" },
				{ name: "Surf Lodges", description: "Surfer-friendly stays with gear support" },
			],
			konaklamaSuresi: "4 days",
			konaklamaBudgeti: "USD 1,100–1,600",
			alisveris: [
				{ name: "Canggu Street Shops", description: "Local designer stores and boutique shops" },
				{ name: "Vintage & Thrift Stores", description: "Vintage clothing and retro items" },
				{ name: "Yoga & Sportswear", description: "Yoga and activewear" },
				{ name: "Art Galleries", description: "Works by local artists" },
				{ name: "Café Accessories", description: "Coffee culture items and small gifts" },
				{ name: "Surf Stores", description: "Boards, wetsuits, and gear" },
				{ name: "Local Designer Boutiques", description: "Bali-style clothing" },
				{ name: "Beachwear & Accessories", description: "Pareos, hats, bags" },
				{ name: "Handmade Jewelry", description: "Silver, natural stones, and wood" },
				{ name: "Yoga & Sports Items", description: "Mats, apparel, and accessories" },
				{ name: "Café Souvenirs", description: "Coffee beans, mugs, tote bags" },
			],
		},
		sanur: {
			description:
				"Sanur is a calm, family-friendly coastal town in Bali. With a protected lagoon, gentle waters, a traditional fish market, and a more local atmosphere, it’s a great choice for travelers who want a slower pace and a more authentic Bali feel.",
			gezilecekYerler: [
				{ name: "Sanur Beach", description: "Protected shoreline—ideal for swimming and walks" },
				{ name: "Sanur Market", description: "Traditional fish market and local products" },
				{ name: "Pura Belanjong Temple", description: "Historic Hindu temple and monument" },
				{ name: "Sunrise Point", description: "One of the best places in Bali to watch sunrise" },
				{ name: "Pelangi Beach Club", description: "Modern beach club and relaxation area" },
				{ name: "Sanur Beach Path", description: "Long seaside path for cycling, running, and strolling" },
				{ name: "Sindhu Beach", description: "Quiet beach vibe with local cafés" },
				{ name: "Le Mayeur Museum", description: "Balinese culture and an art collection of a Belgian painter" },
				{ name: "Bali Orchid Garden", description: "Tropical orchid garden—nice for photos and a light nature visit" },
				{ name: "Serangan Island", description: "Turtle conservation area and calm beach experience" },
			],
			aktiviteler: [
				{ name: "Swimming", description: "Shallow and low-wave sea—safe for kids", icon: "🏊" },
				{ name: "Snorkeling", description: "Near-shore coral and fish spotting", icon: "🤿" },
				{ name: "Cycling Tours", description: "Seaside cycling and walking path", icon: "🚴" },
				{ name: "Yoga & Meditation", description: "Outdoor sessions in a calm coastal setting", icon: "🧘" },
				{ name: "Spa & Massage", description: "Balinese massage and relaxing therapies", icon: "💆" },
				{ name: "Canoe & Paddle Board", description: "Paddling activities on calm water", icon: "🚣" },
				{ name: "Sunrise Watching", description: "Sanur is famous for sunrise", icon: "🌅" },
				{ name: "Fishermen Boat Tours", description: "Experience local fishing life", icon: "⛵" },
				{ name: "Fish Market Visit", description: "Early-morning market walk for local life", icon: "🐟" },
				{ name: "Ceramics & Handicraft Workshop", description: "Learn crafts with local artists", icon: "🎨" },
				{ name: "Night Fishing Tour", description: "Watch night fishing with lights", icon: "🌙" },
				{ name: "Sea Turtle Conservation", description: "Participate in conservation programs", icon: "🐢" },
				{ name: "Traditional Balinese Dance", description: "Cultural dance learning/performances", icon: "💃" },
				{ name: "Beach Cleanup Volunteering", description: "Eco-friendly community activity", icon: "🌍" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Local / Indonesian – Balinese": [
					{ name: "Nasi Goreng", description: "Spicy fried rice with vegetables and egg" },
					{ name: "Nasi Campur", description: "Rice with chicken, vegetables, and Balinese sides" },
					{ name: "Sate Ayam", description: "Chicken satay with peanut sauce" },
					{ name: "Soto Ayam", description: "Spiced chicken soup" },
					{ name: "Ayam Betutu", description: "Spice-marinated chicken cooked slowly" },
					{ name: "Tempeh & Tofu", description: "Soy-based dishes—fried or stir-fried" },
					{ name: "Lumpia", description: "Fried spring rolls with a seasoned filling" },
					{ name: "Perkedel", description: "Golden, crispy potato patties" },
					{ name: "Rendang", description: "Rich coconut beef stew" },
					{ name: "Ikan Bakar", description: "Grilled fresh fish with lime and spices" },
				],
				"Western Cuisine": [
					{ name: "Mediterranean Cuisine", description: "Greek, Spanish, and Italian flavors" },
					{ name: "Italian Pizza & Pasta", description: "Italian classics with fresh ingredients" },
					{ name: "Seafood Restaurants", description: "Specialist places for fresh seafood" },
					{ name: "Vegan & Vegetarian", description: "Plant-based and healthy options" },
					{ name: "Beach Cafés & Brunch", description: "Organic and fresh breakfast options" },
				],
				"Turkish Cuisine": [
					{ name: "Döner", description: "Classic Turkish döner" },
					{ name: "Kebab Varieties", description: "Different kebab styles and preparations" },
					{ name: "Pide", description: "Turkish flatbread ‘pizza’ with various toppings" },
					{ name: "Manti", description: "Turkish dumplings served with yogurt sauce" },
					{ name: "Çiğ Köfte", description: "Spiced bulgur bites (often served as vegetarian)" },
					{ name: "Lahmacun", description: "Thin Turkish flatbread with minced topping" },
					{ name: "Meze Selection", description: "Hummus, muhammara, tzatziki, and more" },
					{ name: "Turkish & Middle Eastern", description: "Restaurants serving Turkish and Middle Eastern menus" },
				],
				"Non-Alcoholic Drinks": [
					{ name: "Coconut Water", description: "Fresh and natural" },
					{ name: "Fresh Juices", description: "Orange, mango, pineapple" },
					{ name: "Herbal Teas", description: "Ginger, lemongrass" },
					{ name: "Balinese Coffee", description: "Strong aroma from local beans" },
					{ name: "Iced Coffee & Smoothies", description: "Cold brew and fruit smoothies" },
					{ name: "Es Jeruk", description: "Local citrus drink—sweet and refreshing" },
					{ name: "Teh Dingin", description: "Sweet iced tea, local style" },
				],
			},
			konaklama: [
				{ name: "4–5 Star Beach Hotels", description: "Beachfront, calm, with spacious grounds" },
				{ name: "Boutique Hotels", description: "Small-scale, peaceful, local style" },
				{ name: "Family-Friendly Hotels", description: "Kids pools and safe beach access" },
				{ name: "Pool Villas", description: "Private stays in quiet neighborhoods" },
				{ name: "Long-Stay Hotels", description: "Serviced apartments and residence-style stays" },
			],
			konaklamaSuresi: "3 days",
			konaklamaBudgeti: "USD 900–1,300",
			alisveris: [
				{ name: "Sanur Market", description: "Local products in the traditional market" },
				{ name: "Batik & Textiles", description: "Handmade batik fabrics and textiles" },
				{ name: "Art Galleries", description: "Paintings and sculptures by local artists" },
				{ name: "Souvenirs", description: "Bali-themed souvenirs and decorative items" },
				{ name: "Beachwear & Accessories", description: "Beach clothing and accessories" },
				{ name: "Seafood & Local Fish Markets", description: "Fresh fish and seafood from local fishermen" },
				{ name: "Handmade Jewelry Shops", description: "Handmade silver and jewelry" },
				{ name: "Wooden Crafts & Sculptures", description: "Wood carving arts and handmade sculptures" },
				{ name: "Local Coffee Shops", description: "Balinese coffee beans and coffee products" },
				{ name: "Organic & Health Products", description: "Organic and natural goods, herbal teas" },
				{ name: "Traditional Boat Souvenirs", description: "Boat models and fishing-themed gifts" },
				{ name: "Spice Markets & Local Herbs", description: "Spices, local herbs, and blends" },
				{ name: "Shell & Coral Handicrafts", description: "Shell-based handicrafts and sea-themed items" },
				{ name: "Woven Bags & Home Decor", description: "Woven bags and home décor" },
				{ name: "Antique & Vintage Shops", description: "Antique and vintage finds" },
			],
		},
		munduk: {
			description:
				"Munduk is a peaceful mountain town in northern Bali—lush, green, and cooler than the coast. With crater lakes, coffee plantations, waterfalls, and misty hills, it’s a paradise for nature lovers.",
			gezilecekYerler: [
				{ name: "Danau Beratan", description: "Lake area for temple visits and boat rides" },
				{ name: "Pura Ulun Danu Bratan", description: "Iconic temple on the lake" },
				{ name: "Munduk Waterfall (Labuhan Kebo)", description: "Multi-tier waterfall in a misty forest" },
				{ name: "Coffee Plantations", description: "Luwak coffee production and tastings" },
				{ name: "Bukit Asah Viewpoint", description: "Mountain viewpoints and photo spots" },
				{ name: "Lake Buyan", description: "Calm nature walks and light water activities" },
				{ name: "Melanting Waterfall", description: "Forest trekking and nature experience" },
				{ name: "Red Coral Waterfall", description: "Waterfall scenery among reddish rocks" },
				{ name: "Twin Lakes Viewpoint (Buyan & Tamblingan)", description: "Scenic viewpoint over the twin lakes" },
				{ name: "Lake Tamblingan", description: "Quiet walks and canoeing" },
				{ name: "Munduk Village", description: "Observe local life and culture" },
				{ name: "Asah Goblek Waterfall", description: "Two-tier waterfall with fewer visitors" },
				{ name: "Wanagiri Hidden Hills", description: "Lake views from photo decks and terraces" },
				{ name: "Goa Gajah Tembuku (Bat Cave)", description: "Bat cave with a mystical atmosphere" },
				{ name: "Pura Batu Karu", description: "High-altitude temple with mountain views" },
				{ name: "Sunset Point Munduk", description: "A good place to catch sunset" },
				{ name: "Local Traditional Market", description: "See daily life and local produce" },
				{ name: "Organic Farm Visits", description: "Hands-on visits to local farms" },
				{ name: "Wildlife Sanctuary", description: "Birdwatching and nature observation" },
			],
			aktiviteler: [
				{ name: "Trekking & Nature Walks", description: "Forest trails, waterfall routes, and mountain exploration", icon: "🥾" },
				{ name: "Waterfall Tours", description: "Visit multiple waterfalls on one route", icon: "💧" },
				{ name: "Photography", description: "Misty mountains, lakes, and forest landscapes", icon: "📸" },
				{ name: "Coffee & Spice Tours", description: "Local coffee and clove plantations", icon: "☕" },
				{ name: "Yoga & Meditation", description: "Quiet and cool mountain atmosphere", icon: "🧘" },
				{ name: "Birdwatching", description: "Observe Bali’s endemic bird species", icon: "🦅" },
				{ name: "Cycling Tours", description: "Scenic downhill rides on mountain roads", icon: "🚴" },
				{ name: "Sunrise Watching", description: "High-altitude views over lakes and valleys", icon: "🌅" },
				{ name: "Canoe & Kayak on the Lake", description: "Peaceful paddling on Danau Beratan", icon: "🛶" },
				{ name: "Forest Bathing", description: "Nature therapy walks and mindful hiking", icon: "🌲" },
				{ name: "Jeep Safari", description: "Off-road routes through mountain villages and farmland", icon: "🚙" },
				{ name: "Herbal Spa & Massage", description: "Natural therapies using local herbs", icon: "💆" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Local / Indonesian – Balinese": [
					{ name: "Nasi Goreng", description: "Spicy fried rice" },
					{ name: "Sate Ayam", description: "Chicken satay with peanut sauce" },
					{ name: "Gado-Gado", description: "Vegetable salad with peanut sauce" },
					{ name: "Perkedel", description: "Potato patties" },
					{ name: "Lumpia", description: "Fried spring rolls" },
					{ name: "Tempeh Goreng", description: "Crispy fried tempeh" },
					{ name: "Nasi Kuning", description: "Yellow rice colored with turmeric" },
					{ name: "Soto Ayam", description: "Spiced chicken soup" },
					{ name: "Lalapan", description: "Raw vegetables served with dipping sauces" },
				],
				"Coffee & Tea": [
					{ name: "Balinese Coffee", description: "Bold coffee from local beans" },
					{ name: "Luwak Coffee", description: "Bali’s famous premium coffee" },
					{ name: "Herbal Teas", description: "Ginger, lemongrass, and local herbs" },
					{ name: "Iced Tea", description: "Sweet iced tea" },
				],
				"Western Cuisine": [
					{ name: "Pasta & Pizza", description: "Italian-style dishes" },
					{ name: "Salads & Vegetables", description: "Fresh local organic vegetables" },
					{ name: "Bread & Pastries", description: "Homemade bread and bakery items" },
					{ name: "Burgers", description: "Comfort burgers with fresh ingredients" },
				],
				"Non-Alcoholic Drinks": [
					{ name: "Coconut Water", description: "Fresh and natural" },
					{ name: "Fresh Juices", description: "Papaya, mango, pineapple" },
					{ name: "Smoothie Bowls", description: "Fruit and superfood blends" },
					{ name: "Ginger Drink (Jahe Hangat)", description: "Warm ginger drink—comforting and popular" },
					{ name: "Wedang Jahe", description: "Traditional hot ginger drink" },
					{ name: "Jamu", description: "Herbal drink with turmeric and ginger" },
					{ name: "Es Cendol", description: "Sweet iced drink with green jelly" },
					{ name: "Bandrek", description: "Spiced ginger drink" },
				],
			},
			konaklama: [
				{ name: "Boutique Hotels in Nature", description: "Quiet stays with forest and valley views" },
				{ name: "Mountain & Forest Lodges", description: "Wood architecture, immersed in nature" },
				{ name: "Scenic Villas", description: "Private terraces overlooking misty valleys" },
				{ name: "Eco-Lodges & Bungalows", description: "Sustainable, eco-friendly accommodation" },
				{ name: "Guesthouses", description: "Friendly stays run by local families" },
			],
			konaklamaSuresi: "2–3 days",
			konaklamaBudgeti: "USD 600–900",
			alisveris: [
				{ name: "Coffee Products", description: "Balinese coffee and Luwak beans" },
				{ name: "Local Handicrafts", description: "Handmade wooden and woven items" },
				{ name: "Organic Products", description: "Organic produce from local farmers" },
				{ name: "Herbal Teas", description: "Local herbs and tea blends" },
				{ name: "Souvenirs", description: "Bali-themed gifts and decorations" },
				{ name: "Clove Products", description: "Clove tea, clove oil, aromatherapy" },
				{ name: "Handmade Soaps & Beauty Products", description: "Handmade soaps and beauty goods" },
				{ name: "Wooden Handicrafts", description: "Wood carvings and decorative items" },
				{ name: "Woven Baskets & Textiles", description: "Woven baskets and fabrics" },
				{ name: "Honey & Bee Products", description: "Local honey and bee products" },
				{ name: "Herbal Medicines & Jamu", description: "Traditional herbal remedies" },
				{ name: "Art & Paintings", description: "Paintings by local artists" },
				{ name: "Dried Spices & Herbs", description: "Dried spices and herb mixes" },
				{ name: "Ceramic & Pottery", description: "Ceramics and pottery items" },
				{ name: "Natural Dyes & Batik", description: "Batik items dyed with natural colors" },
			],
		},

		amed: {
			description:
				"Amed is a quiet diving town on Bali’s northeast coast. It’s known for easy dive spots for all ages, snorkeling, shipwrecks, and vibrant coral reefs. With less tourist pressure, it’s a great place for an authentic, laid-back Bali experience.",
			gezilecekYerler: [
				{ name: "Amed Beach", description: "Long black-sand coastline for swimming and snorkeling" },
				{ name: "Japanese Patrol Boat Wreck", description: "A dive wreck that can also be seen while snorkeling" },
				{ name: "Lipah Bay", description: "Calm bay with house reef and corals" },
				{ name: "Pura Lempuyang Temple", description: "Iconic mountain temple for views" },
				{ name: "Jemeluk Bay", description: "Protected bay for safe snorkeling" },
				{ name: "Mount Agung", description: "Bali’s highest volcano—trekking and viewpoints" },
				{ name: "Bunutan Beach", description: "Alternative shoreline with fewer tourists" },
				{ name: "Banyuning Beach", description: "Local fishermen and an authentic atmosphere" },
				{ name: "Amed Reef", description: "Snorkeling area and coral reef" },
				{ name: "Pura Puncak Penulisan", description: "Mountain temple with views" },
				{ name: "Air Terjun Aling", description: "Waterfall and nature walk" },
				{ name: "Seraya Secret", description: "Deeper reef area for diving" },
				{ name: "East Bali Shelters", description: "Modern architecture and beach" },
				{ name: "Basmati Museum", description: "Art and culture museum" },
				{ name: "Coral Garden", description: "Protected coral garden" },
				{ name: "Salt Ponds", description: "Traditional salt-making and local life" },
				{ name: "Tulamben Beach (nearby)", description: "Shipwrecks and a popular diving hub" },
				{ name: "Japanese Garden", description: "Underwater garden dive site" },
			],
			aktiviteler: [
				{ name: "Diving (PADI Certified)", description: "Diving courses from beginner to advanced", icon: "🤿" },
				{ name: "Snorkeling", description: "Observe coral reefs and fish", icon: "🏊" },
				{ name: "Shipwreck Exploration", description: "Visit historic wrecks by diving", icon: "⚓" },
				{ name: "Yoga & Meditation", description: "Relaxation and calm by the sea", icon: "🧘" },
				{ name: "Fish Watching", description: "Underwater photography and marine-life observation", icon: "📷" },
				{ name: "Boat Trip", description: "Boat tours along the Amed coast", icon: "⛵" },
				{ name: "Mountain Hike", description: "Mount Agung trekking and sunrise", icon: "🥾" },
				{ name: "Spa & Massage", description: "Relaxing therapies by the sea", icon: "💆" },
				{ name: "Night Dive", description: "Nocturnal sea creatures and glowing plankton", icon: "🌙" },
				{ name: "Macro Photography", description: "Detailed shots of tiny marine creatures", icon: "📸" },
				{ name: "Underwater Photography", description: "Professional underwater photo sessions", icon: "🎥" },
				{ name: "Canoe & Kayak", description: "Water sports on calm waters and near beaches", icon: "🛶" },
				{ name: "Sport Fishing", description: "Fishing tours and adventure", icon: "🎣" },
				{ name: "Marine Biology Intro", description: "Educational tours about marine life", icon: "🐠" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Local / Indonesian – Balinese": [
					{ name: "Nasi Goreng", description: "Spicy fried rice" },
					{ name: "Sate Ayam", description: "Grilled chicken skewers with peanut sauce" },
					{ name: "Ikan Bakar", description: "Grilled fresh fish" },
					{ name: "Gado-Gado", description: "Vegetable salad with peanut sauce" },
					{ name: "Perkedel", description: "Golden, crispy potato patties" },
					{ name: "Lumpia", description: "Fried spring rolls" },
					{ name: "Satay Lilit", description: "Seasoned minced meat satay (often chicken/fish)" },
					{ name: "Uduk Udukan", description: "Fresh grilled fish skewers" },
					{ name: "Tahu Goreng", description: "Crispy fried tofu" },
				],
				"Seafood & Fish": [
					{ name: "Fresh Seafood", description: "Catch of the day and assorted seafood" },
					{ name: "Grilled Lobster", description: "Lobster grilled over charcoal" },
					{ name: "Calamari", description: "Fried squid" },
					{ name: "Fish Soup", description: "Local-style fish soup" },
				],
				"Western Cuisine": [
					{ name: "Pasta & Pizza", description: "Italian-style dishes" },
					{ name: "Salads", description: "Fresh organic vegetables" },
					{ name: "Burgers & Sandwiches", description: "Light and filling options" },
				],
				"Non-Alcoholic Drinks": [
					{ name: "Coconut Water", description: "Fresh and natural" },
					{ name: "Fresh Fruit Juices", description: "Tropical fruits" },
					{ name: "Balinese Coffee", description: "Local coffee" },
					{ name: "Smoothie Bowls", description: "Healthy drinks and bowls" },
					{ name: "Es Jeruk", description: "Local citrus drink—sweet and refreshing" },
					{ name: "Teh Dingin", description: "Sweet iced tea, local style" },
					{ name: "Jamu", description: "Herbal drink with turmeric and ginger" },
					{ name: "Wedang Jahe", description: "Traditional hot ginger drink" },
					{ name: "Bandrek", description: "Spiced ginger drink, traditional recipe" },
				],
			},
			konaklama: [
				{ name: "Beachfront Boutique Hotels", description: "Quiet vibe, close to dive spots" },
				{ name: "Diving & Snorkeling Hotels", description: "Equipment, guide, and boat support" },
				{ name: "Pool Villas", description: "Sea or Mount Agung views" },
				{ name: "Eco Lodges & Bungalows", description: "Simple, calm, close to nature" },
				{ name: "Guesthouses & Pensions", description: "Long-stay and budget-friendly options" },
				{ name: "Liveaboard Dive Boats", description: "Stay on a boat combined with dive trips" },
				{ name: "Yoga Retreat & Wellness Hotels", description: "Packages combining yoga, meditation, and spa" },
				{ name: "Private Beach Access Villas", description: "Villas with private beach access" },
				{ name: "Honeymoon & Romantic Suites", description: "Specially designed rooms for couples" },
				{ name: "Family-Friendly Resorts", description: "Kids areas and family activities" },
				{ name: "Budget Hostels & Backpacker", description: "Hostels for social travelers" },
				{ name: "Beach Glamping", description: "Luxury camping by the sea" },
				{ name: "All-Inclusive Dive Packages", description: "Accommodation + dive guide + equipment" },
			],
			konaklamaSuresi: "3–4 days",
			konaklamaBudgeti: "USD 500–800",
			alisveris: [
				{ name: "Local Coffee & Spices", description: "Coffee beans, cloves, cinnamon" },
				{ name: "Handmade Wooden Items", description: "Small decorative objects" },
				{ name: "Natural Soaps & Oils", description: "Herbal and aromatic products" },
				{ name: "Handwoven Textiles", description: "Shawls and covers" },
				{ name: "Local Honey & Natural Foods", description: "Organic honey and local products" },
				{ name: "Nature-Themed Gifts", description: "Stone, bamboo, and wooden items" },
				{ name: "Diving Gear & Souvenirs", description: "Masks, fins, dive-logo t-shirts" },
				{ name: "Coral & Sea-Life Jewelry", description: "Collections and jewelry" },
				{ name: "Underwater Photo Prints", description: "Professional underwater photo prints" },
				{ name: "Local Fish Market Products", description: "Smoked fish, dried seafood" },
				{ name: "Beach Wear & Swimwear", description: "Beach clothing collections" },
				{ name: "Handmade Jewellery", description: "Handmade jewelry and accessories" },
				{ name: "Organic Coconut Products", description: "Coconut oil and related products" },
				{ name: "Bali Artwork & Canvas", description: "Sea-themed art by local artists" },
				{ name: "Vegan & Eco-Friendly Products", description: "Eco-conscious, nature-friendly items" },
				{ name: "Yoga & Wellness Accessories", description: "Yoga mats, meditation cushions" },
			],
		},
	},
	java: {
		yogyakarta: {
			description:
				"Yogyakarta is Java’s cultural capital and a former royal center. With world-famous temples like Borobudur and Prambanan, strong traditions in art and craftsmanship, and a lively street-food scene, it’s one of Indonesia’s best places to experience authentic Javanese culture.",
			gezilecekYerler: [
				{ name: "Borobudur Temple", description: "UNESCO World Heritage Site—the largest Buddhist temple complex in the world" },
				{ name: "Prambanan Temple", description: "A magnificent Hindu temple complex with dramatic spires" },
				{ name: "Kraton (Sultan’s Palace)", description: "The still-active royal palace of the Yogyakarta Sultanate" },
				{ name: "Taman Sari (Water Castle)", description: "18th-century royal water gardens and bathing complex" },
				{ name: "Malioboro Street", description: "The iconic street for shopping, street food, and nightlife" },
				{ name: "Jomblang Cave", description: "A spectacular cave where sunlight beams into the underground forest" },
				{ name: "Vredeburg Fort", description: "Historic Dutch fort and museum near Gedung Agung" },
				{ name: "Kotagede", description: "Former Mataram capital—traditional architecture and silver craftsmanship" },
				{ name: "Sonobudoyo Museum", description: "Javanese culture museum with wayang, textiles, masks, and gamelan instruments" },
				{ name: "Ullen Sentalu Museum", description: "A museum dedicated to Javanese royal culture on the slopes of Mount Merapi" },
				{ name: "Tugu Monument", description: "One of Yogyakarta’s symbols, built by Sultan Hamengkubuwono VI" },
				{ name: "Mount Merapi", description: "An active volcano with epic views and trekking opportunities" },
				{ name: "Kaliurang", description: "A forested highland area on Merapi’s slopes—cool weather and nature views" },
				{ name: "Parangtritis Beach", description: "Famous black-sand beach south of the city—great for sunsets" },
				{ name: "Ngobaran Beach", description: "A natural beach in Gunung Kidul with rocky scenery and reef areas" },
				{ name: "Ngrenehan Beach", description: "A picturesque cove between rocky hills—known for seafood and local boats" },
				{ name: "Gesing Wonderland", description: "A nature-themed recreation area with forest and mountain views" },
				{ name: "Obelix Sea View", description: "A viewpoint in Gunung Kidul for ocean panoramas and sunset watching" },
			],
			aktiviteler: [
				{ name: "Sunrise Tour (Borobudur)", description: "A magical sunrise experience at the temple complex", icon: "🌅" },
				{ name: "Prambanan Temple Tour", description: "Guided tour of the iconic Hindu temple complex", icon: "🏛️" },
				{ name: "Batik Workshop", description: "Learn traditional batik-making from local artisans", icon: "🎨" },
				{ name: "Merapi Jeep Safari", description: "Off-road jeep adventure around the active volcano", icon: "🚙" },
				{ name: "Merapi Off-Road Tour", description: "Explore the rugged volcanic landscape by 4x4", icon: "🚙" },
				{ name: "Kalasan Temple Visit", description: "A smaller Buddhist temple complex on the way to Prambanan", icon: "🏛️" },
				{ name: "Ratu Boko Palace Tour", description: "Visit the ancient palace ruins just south of Prambanan", icon: "🏰" },
				{ name: "Zoo Visit", description: "Family-friendly day at the local zoo and gardens", icon: "🦁" },
				{ name: "Ramayana Ballet", description: "Traditional dance performance at Prambanan", icon: "💃" },
				{ name: "Cave Tubing", description: "Float through Gua Pindul cave on an inner tube", icon: "🏊" },
				{ name: "Village Cycling Tour", description: "Cycle through traditional villages and countryside", icon: "🚴" },
			],
			yiyecekIcecekler: [
				{ name: "Gudeg", description: "Yogyakarta’s signature dish—sweet young jackfruit stew served with chicken and egg" },
				{ name: "Ayam Goreng Mbok Berek", description: "Famous fried chicken with a special spice blend" },
				{ name: "Bakpia", description: "Traditional sweet pastry filled with mung bean" },
				{ name: "Angkringan", description: "Street-food stalls serving small bites, coffee, and local snacks" },
				{ name: "Wedang Ronde", description: "Sweet hot ginger drink" },
				{ name: "Soto Yogyakarta", description: "Local-style soup with aromatic spices" },
				{ name: "Nasi Langgi (Sego Langgi)", description: "Warm rice served with assorted side dishes" },
				{ name: "Kipo", description: "Green cassava pastry filled with sweet coconut" },
				{ name: "Jadah Tempe", description: "Sticky rice cake with sweet tempeh—classic local snack" },
				{ name: "Es Rujak", description: "Chilled fruit salad with mango, papaya, pineapple, cucumber and spices" },
				{ name: "Kopi Joss", description: "Strong Javanese coffee served with a piece of hot charcoal" },
				{ name: "Sate Klathak", description: "Traditional goat satay, often grilled on iron skewers" },
				{ name: "Pizza", description: "Italian-style pizza, widely available in tourist areas" },
				{ name: "Hamburger", description: "Classic burger in a soft bun" },
			],
			turkYemekleri: [
				{
					name: "Turkish Restaurants",
					description:
						"There are Turkish-food spots across Yogyakarta (Kotagede, Caturtunggal, Cik Di Tiro, etc.). Chains like Istanbul Kebab Turki, Kebab Turkiyem, and Kebab Baba Rafi serve döner, kebab, and Turkish-style dishes.",
				},
			],
			konaklama: [
				{ name: "3-Star Hotels", description: "Clean, affordable stays around Malioboro and the Kraton—great for sightseeing" },
				{ name: "4-Star Hotels", description: "Comfortable hotels with pools and spa services—good for couples and families" },
				{ name: "5-Star Hotels", description: "Luxury resorts and city hotels with gardens, wellness areas, and high service standards" },
				{ name: "Boutique & Heritage Hotels", description: "Converted historic buildings featuring traditional Javanese architecture" },
				{ name: "Hostels & Guesthouses", description: "Budget-friendly options with a social atmosphere and local feel" },
				{ name: "Luxury Pool Villas", description: "Private villas with pools—ideal for families and groups" },
			],
			konaklamaSuresi: "3–4 days",
			konaklamaBudgeti: "USD 450–800 (stay + food + tours + activities)",
			alisveris: [
				{ name: "Malioboro Street", description: "Batik, handicrafts, and tourist souvenirs in a lively setting" },
				{ name: "Beringharjo Market", description: "Traditional market for batik textiles and local goods" },
				{ name: "Yogyakarta Batik Center", description: "Workshops and shops where you can watch batik-making and buy pieces" },
				{ name: "Borobudur Craft Market", description: "Near Borobudur—souvenirs, jewelry, and crafts" },
				{ name: "Matahari Department Store", description: "Modern shopping with international brands and local products" },
				{ name: "Pasar Ngasem", description: "Market for daily items, snacks, and small gifts" },
				{ name: "Malioboro Mall", description: "Central mall with common shops and fast-food chains" },
				{ name: "Galleria Mall", description: "Compact mall with a food court and youth-oriented eateries" },
				{ name: "Kotagede", description: "A famous area for silver handicrafts and traditional architecture" },
				{ name: "Hamzah Batik (Mirota Batik)", description: "Large family-run store with batik and crafts" },
				{ name: "Tjokrosuharto", description: "Handicraft store since 1954—wayang, batik, keris, and traditional items" },
			],
		},
		pangandaran: {
			description:
				"Pangandaran is a calm coastal town on Java’s south coast, known for natural beauty. With clean beaches, coral reefs, dive spots, and green forests, it’s a paradise for nature lovers—far from heavy tourist crowds and ideal for a more local Javanese experience.",
			gezilecekYerler: [
				{ name: "Pangandaran Beach", description: "Long sandy shoreline—ideal for swimming and sunbathing" },
				{ name: "Pangandaran National Park", description: "Protected marine area with coral reefs, fish diversity, and Monkey Beach" },
				{ name: "Citumang", description: "River flowing through rocks—nature walks and calm water spots" },
				{ name: "Green Canyon", description: "Green river canyon—boat rides, rock scenery, and trekking" },
				{ name: "Batu Karas Beach", description: "A quieter beach popular for snorkeling and diving" },
				{ name: "Pangandaran Aquarium", description: "Marine-life aquarium and education center" },
				{ name: "Batu Hue", description: "Rock formations and viewpoint by the shore" },
				{ name: "Banyu Tibo Waterfall", description: "Multi-tier waterfall with short nature walks" },
				{ name: "Cigamea Beach", description: "Long and clean beach stretch" },
				{ name: "Puncak Batu Karas", description: "Hill viewpoint—great for sunsets" },
				{ name: "Grotto Beach", description: "Cave-like beach area—short treks and exploration" },
				{ name: "Fisher Village (Kampung Nelayan)", description: "Local fishing village—everyday coastal life" },
				{ name: "Pasir Putih Beach", description: "White-sand beach area" },
				{ name: "Bukit Panenjoan Viewpoint", description: "Panoramic viewpoint over the coast" },
			],
			aktiviteler: [
				{ name: "Diving (PADI Certified)", description: "Diving courses from beginner to advanced", icon: "🤿" },
				{ name: "Snorkeling", description: "Observe coral reefs and fish", icon: "🏊" },
				{ name: "Canoe & Kayak", description: "Kayaking tours in Green Canyon", icon: "🛶" },
				{ name: "Nature Hiking", description: "Forest and mountain trekking routes", icon: "🥾" },
				{ name: "Marine-Life Watching", description: "Underwater photography and wildlife observation", icon: "📷" },
				{ name: "Sunset Boat Ride", description: "Watch the sunset from the sea", icon: "⛵" },
				{ name: "Spa & Massage", description: "Relaxing therapies and hot-spring options", icon: "💆" },
				{ name: "Local Village Visit", description: "Meet locals and learn about Javanese daily life", icon: "🏘️" },
				{ name: "Underwater Photography", description: "Create professional underwater photo memories", icon: "📸" },
				{ name: "Nature Photography", description: "Waterfalls, beaches, and scenic landscapes", icon: "📷" },
				{ name: "Waterfall Trek", description: "Trek to Banyu Tibo and nearby waterfalls", icon: "💧" },
				{ name: "ATV & Mountain Biking", description: "Off-road adventure on rugged trails", icon: "🚙" },
				{ name: "Citumang Body Rafting", description: "Swim and float through rock channels", icon: "🏊" },
				{ name: "National Park Tour", description: "Guided exploration in the national park", icon: "🌳" },
				{ name: "Jet Ski", description: "Fast-paced water sports", icon: "🚤" },
				{ name: "Banana Boat", description: "Group fun on inflatable water rides", icon: "🛥️" },
			],
			yiyecekIcecekler: {
				__replace: true,
				"Local / Javanese – Indonesian": [
					{ name: "Nasi Goreng", description: "Spicy fried rice" },
					{ name: "Soto Ayam", description: "Spiced chicken soup" },
					{ name: "Bakso", description: "Meatball soup—an Indonesian classic" },
					{ name: "Soto Java", description: "Traditional soup found across Java" },
					{ name: "Gado-Gado", description: "Vegetable salad with peanut sauce" },
					{ name: "Cuanki", description: "Popular street food—potato/tofu dumplings in broth" },
					{ name: "Perkedel", description: "Crispy potato patties" },
					{ name: "Sate Ayam", description: "Chicken satay with peanut sauce" },
				],
				"Seafood & Fish": [
					{ name: "Fresh Seafood", description: "Catch of the day and assorted seafood" },
					{ name: "Grilled Fish", description: "Fresh fish grilled over open flame" },
					{ name: "Shrimp & Calamari", description: "Shrimp and squid dishes" },
					{ name: "Fish Soup", description: "Local-style fish soup" },
				],
				"Western Cuisine": [
					{ name: "Pizza", description: "Italian-style pizza available at tourist restaurants" },
					{ name: "Chicken Burger", description: "A common, easy option" },
					{ name: "Cheeseburger", description: "A popular classic" },
					{ name: "Salad", description: "Fresh organic vegetables" },
					{ name: "Sandwich", description: "Light and filling choices" },
				],
				"Non-Alcoholic Drinks": [
					{ name: "Coconut Water", description: "Fresh and natural" },
					{ name: "Fresh Fruit Juices", description: "Mango, papaya, pineapple" },
					{ name: "Java Coffee", description: "Local coffee" },
					{ name: "Smoothie Bowls", description: "Healthy drinks and bowls" },
					{ name: "Es Cendol", description: "Sweet tropical drink with coconut milk and green jelly" },
					{ name: "Jamu", description: "Traditional herbal drink" },
					{ name: "Es Jeruk", description: "Local citrus drink—cooling and refreshing" },
					{ name: "Bandrek", description: "Hot ginger-and-spice drink—warming and comforting" },
				],
			},
			konaklama: [
				{ name: "Boutique Hotels Near the Beach", description: "Quiet vibe, walkable to the shore" },
				{ name: "Bungalows & Beach Huts", description: "Simple but comfortable stays close to nature" },
				{ name: "Pool Villas", description: "Private spaces with sea or forest views" },
				{ name: "Guesthouses & Pensions", description: "Budget-friendly and good for longer stays" },
				{ name: "Eco-Friendly Resorts", description: "Sustainable, nature-focused accommodation" },
			],
			konaklamaSuresi: "2–3 days",
			konaklamaBudgeti: "USD 400–700",
			turkyemekleriNotu:
				"There are no traditional Turkish restaurants in Pangandaran. Local Indonesian dishes and seafood are the main options.",
			alisveris: [
				{ name: "Local Fish Market", description: "Smoked fish and dried seafood" },
				{ name: "Pangandaran-Print Clothing Shops", description: "T-shirts, shorts, pants, and casual wear" },
				{ name: "Handmade Crafts", description: "Handmade wooden and woven products" },
				{ name: "Local Coffee & Spices", description: "Organic coffee and regional spices" },
				{ name: "Beach Wear & Swimwear", description: "Beach clothing collections" },
				{ name: "Local Art & Souvenirs", description: "Paintings and decorative items" },
				{ name: "Natural & Organic Products", description: "Natural soaps, oils, and beauty products" },
			],
		},
		malang: {
			description:
				"Malang is a historic city in East Java and a popular base for Mount Bromo adventures. Located about 60–65 km from Bromo Tengger Semeru National Park, it’s ideal for sunrise tours and volcano trekking. The city is known for its cool climate, colonial architecture, and local food.",
			gezilecekYerler: [
				{
					name: "Bromo Tengger Semeru National Park",
					description:
						"An active volcano park famous for sunrise views and the ‘Sea of Sand’—about 60–65 km from Malang",
				},
				{
					name: "Ijen Boulevard",
					description: "Historic colonial boulevard lined with bougainvillea and old buildings",
				},
				{
					name: "Jodipan Colorful Village",
					description: "Instagram-famous neighborhood with brightly painted houses and a glass bridge",
				},
				{
					name: "Singosari Temple",
					description: "A Hindu temple dating back to the 1300s, about 12 km north of the city",
				},
				{ name: "Balekambang Beach", description: "A black-sand beach on Malang’s south coast" },
				{
					name: "Malang Night Paradise (Dino Park)",
					description: "Night-time theme park with dinosaur replicas and light attractions",
				},
				{ name: "Candi Jago", description: "A 13th-century Hindu temple near Singosari" },
				{ name: "Candi Kidal", description: "A 13th-century Hindu temple in the Singosari temple area" },
			],
			aktiviteler: [
				{
					name: "Bromo Sunrise Tour",
					description: "Early departure from Cemoro Lawang; packaged tours are common on weekends",
					icon: "🌅",
				},
				{
					name: "Bromo Trekking",
					description: "Walk across the Sea of Sand and climb to the crater rim—guide recommended",
					icon: "🥾",
				},
				{
					name: "Jeep Safari (Bromo)",
					description: "4x4 jeep tours across Bromo’s sand sea with mountain views",
					icon: "🚙",
				},
				{
					name: "Motorbike Rental (DIY)",
					description: "Ride to Bromo by motorbike (2–3 hours)—best for experienced riders",
					icon: "🏍️",
				},
				{ name: "Nature Walks", description: "Hikes through nearby mountains and farmland", icon: "🥾" },
				{ name: "Spa & Massage", description: "Relaxing treatments around Malang city", icon: "💆" },
				{
					name: "Sanggar Senaputra – East Java Dances",
					description: "Traditional East Java dance performances and art workshops",
					icon: "💃",
				},
				{
					name: "Ken Dedes Ancient Pools",
					description:
						"Ancient bathing pools and statues from the Singosari kingdom near Singosari Temple",
					icon: "🏛️",
				},
				{
					name: "Mountain Hiking",
					description: "Guided climbs on Mount Panderman, Mount Arjuna, and surrounding peaks",
					icon: "⛰️",
				},
				{ name: "Golf", description: "Play on a professional course with Mount Arjuna views", icon: "⛳" },
				{
					name: "Balekambang Beach – Swimming",
					description: "Beach time and swimming on Malang’s south-coast black-sand beach",
					icon: "🏖️",
				},
				{
					name: "Hindu Temple Tours",
					description: "Full tours of Singosari, Jago, and Kidal temples with historical context",
					icon: "🏯",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"Local / Javanese – Indonesian": [
					{ name: "Bakso Malang", description: "Malang’s famous meatball soup—served in several variations" },
					{ name: "Ayam Goreng Kampung", description: "Crispy village-style fried chicken" },
					{ name: "Cwie Mie", description: "Malang’s signature noodle dish" },
					{ name: "Orem-orem", description: "Tempeh, boiled egg, and chicken in a coconut-milk sauce" },
					{ name: "Jagung Bakar", description: "Grilled corn—fresh from street vendors" },
					{ name: "Nasi Goreng", description: "Spicy fried rice" },
				],
				"Turkish Cuisine": [
					{ name: "Grilled Meats", description: "Grilled chicken, lamb skewers, steak, and meat meze" },
					{ name: "Pide", description: "Traditional Turkish pide varieties with cheese or minced meat" },
					{ name: "Lahmacun", description: "Turkish-style ‘pizza’ with spiced minced meat" },
					{ name: "Middle Eastern Mezze", description: "Hummus, baba ghanoush, falafel, and more" },
					{ name: "Baklava & Turkish Desserts", description: "Baklava, künefe, lokma, and similar sweets" },
				],
				"Western Cuisine": [
					{ name: "Signora Pasta", description: "Italian pasta dishes" },
					{ name: "Chefkim", description: "Korean food options" },
				],
				"Non-Alcoholic Drinks": [
					{ name: "Kopi Jahe", description: "Ginger coffee—strong and flavorful" },
					{ name: "Fresh Fruit Juices", description: "Apple and tropical fruit juices" },
					{ name: "Apel Malang", description: "Malang’s famous green apples—very fresh" },
					{ name: "Tropical Milkshakes", description: "Mango, strawberry, and avocado shakes made with fresh tropical fruit" },
					{ name: "Boba Tea / Bubble Tea", description: "Modern tea-based drink with tapioca pearls" },
					{ name: "Es Campur", description: "Mixed shaved-ice dessert drink with fruits and syrup" },
					{ name: "Coconut Water", description: "Fresh coconut water—natural and refreshing" },
				],
			},
			konaklama: [
				{ name: "Budget Hostels", description: "Popular backpacker options for social travelers" },
				{ name: "Budget Hotels", description: "Simple, clean hotels in central areas" },
				{ name: "Mid-Range Hotels", description: "Modern comfort with good facilities" },
				{ name: "Boutique & Character Hotels", description: "Restored colonial buildings and design-forward stays" },
				{ name: "Luxury Hotels", description: "High-end hotels with distinctive style and service" },
			],
			konaklamaSuresi: "1–2 days",
			konaklamaBudgeti: "USD 400–600",
			alisveris: [
				{ name: "Ijen Boulevard Market", description: "Sunday market with local stalls" },
				{ name: "Malang Town Square (Matos)", description: "Modern mall with cinema and entertainment" },
				{ name: "Soekarno Hatta Boulevard", description: "Trendy food, shopping, and nightlife strip" },
				{ name: "Mall Olympic Garden (MOG)", description: "Large mall with fashion brands and retail stores" },
				{ name: "Batik Keris", description: "Local textiles and handicrafts" },
				{ name: "Apel Malang Products", description: "Fresh apples and apple-based products" },
				{ name: "Fabulous Spa & Salon", description: "Professional spa treatments and massage services" },
			],
		},
		banyuwangi: {
			description:
				"Banyuwangi is the gateway city on Java’s eastern tip. It’s only about 30–40 km from Kawah Ijen, famous for the blue-fire phenomenon and sulfur crater lake. Nearby highlights include Baluran National Park, Red Island Beach for snorkeling/diving, and G-Land’s world-class surf breaks.",
			gezilecekYerler: [
				{
					name: "Kawah Ijen (Ijen Crater)",
					description:
						"Famous for blue fire, sulfur mining, and a crater lake—30–40 km away; sunrise trekking is popular",
				},
				{ name: "Red Island Beach", description: "Red-sand beach—snorkeling, diving, and coastal views" },
				{
					name: "Bangsring Underwater",
					description:
						"A semi-artificial snorkeling area with abundant corals and fish life; entry is around 5,000 Rp",
				},
				{
					name: "Baluran National Park",
					description: "Savanna, forest, and coastline with secluded beaches and wildlife",
				},
				{ name: "Alas Purwo National Park", description: "Remote nature park with ancient Javanese temple sites" },
				{ name: "G-Land (Grajagan Beach)", description: "World-famous surf breaks—best for advanced surfers" },
				{
					name: "Taman Blambangan Park",
					description: "City-center park with night markets, street food, and local culture",
				},
				{
					name: "Mozes Misdy Gallery & Museum",
					description: "Modern art gallery by renowned artist Mozes Misdy near Ketapang Port",
				},
				{
					name: "Gandrung Cultural Performances",
					description:
						"Banyuwangi’s iconic dance tradition dedicated to Dewi Sri—performed on specific dates",
				},
			],
			aktiviteler: [
				{
					name: "Ijen Blue Fire Tour",
					description: "Night hike (2–3 hours) to see blue fire and sunrise views",
					icon: "🔵",
				},
				{
					name: "Kawah Ijen Trekking",
					description: "Early-morning trek to the crater lake and sulfur areas",
					icon: "🥾",
				},
				{
					name: "Diving & Snorkeling",
					description: "Explore coral reefs and fish life at Bangsring and Red Island Beach",
					icon: "🤿",
				},
				{ name: "Surfing", description: "Surf at G-Land or easier beginner breaks", icon: "🏄" },
				{
					name: "Nature Hiking",
					description: "Explore Baluran and Alas Purwo National Parks",
					icon: "🥾",
				},
				{
					name: "Bali Ferry Crossing",
					description: "Take the ferry to Gilimanuk in ~45 minutes for easy access to Bali",
					icon: "⛴️",
				},
				{
					name: "Red Island Beach – Diving & Surf",
					description: "Combine snorkeling/diving and surfing on the red-sand shore",
					icon: "🌊",
				},
				{
					name: "Gandrung Dance Show",
					description: "Watch Banyuwangi’s signature art form—book via the tourist information center",
					icon: "💃",
				},
				{
					name: "Ijen Coffee Plantation Tour",
					description: "Visit coffee plantations on the Ijen Plateau and try local coffee",
					icon: "☕",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"Local Banyuwangi Dishes": [
					{ name: "Rujak Soto", description: "Local specialty combining vegetables with a spiced soup" },
					{ name: "Pecel Rawon", description: "Rawon beef soup paired with pecel-style vegetable salad" },
					{ name: "Sego Tempong", description: "Rice with spicy sambal and side dishes (often chicken)" },
					{ name: "Nasi Cawuk", description: "Spiced rice dish—Banyuwangi specialty" },
					{ name: "Onde-onde", description: "Sweet sesame-coated balls—popular street snack" },
					{ name: "Uyah Asem", description: "Salty-and-sour local dish/salad specialty" },
					{ name: "Pecel Pitik", description: "Banyuwangi-style chicken with pecel seasoning" },
				],
				"Indonesian Cuisine": [
					{ name: "Nasi Goreng", description: "Spicy fried rice" },
					{ name: "Ayam Goreng Kampung", description: "Crispy village-style fried chicken" },
					{ name: "Sate Ayam", description: "Grilled chicken skewers" },
					{ name: "Gado-Gado", description: "Vegetable salad with peanut sauce" },
				],
				"Seafood & Fish": [
					{ name: "Fresh Seafood", description: "Daily catch—fish, shrimp, and shellfish" },
					{ name: "Grilled Fish", description: "Smoked or grilled fish dishes" },
					{ name: "Seafood Soup", description: "Fish and seafood soup" },
				],
				"Non-Alcoholic Drinks": [
					{ name: "Kopi Ijen", description: "Special coffee from the Ijen plateau—found in local cafés" },
					{ name: "Tropical Fruit Juices", description: "Fresh juices from tropical fruits" },
					{ name: "Jamu", description: "Traditional Indonesian herbal drink" },
					{ name: "Es Cendol", description: "Coconut milk drink with green starch jelly" },
				],
			},
			konaklama: [
				{ name: "Budget Hotels", description: "Budget options near Ketapang Port and in the city center" },
				{ name: "Mid-Range Hotels", description: "Comfort stays in town and waterfront areas" },
				{ name: "Ijen Trekking Stays", description: "Simple accommodation for early-morning hikes" },
			],
			konaklamaSuresi: "1–2 days",
			konaklamaBudgeti: "USD 500–700",
			alisveris: [
				{ name: "Taman Blambangan Park", description: "Night markets, street food, and local products" },
				{ name: "Brawijaya Bus Terminal Market", description: "Local market—textiles and daily essentials" },
				{ name: "Mozes Misdy Gallery & Museum", description: "Local art gallery with paintings and sculptures" },
				{ name: "Local Handicraft Shops", description: "Batik textiles and traditional crafts" },
				{ name: "Fish & Seafood Markets", description: "Fresh daily seafood near the port" },
				{ name: "Ijen Plantation Products", description: "Coffee varieties and local snacks" },
			],
		},
		bandung: {
			description:
				"Bandung is a cool mountain city often nicknamed the ‘Paris of Java’. It’s known for Tangkuban Perahu volcano, the turquoise crater lake of Kawah Putih, tea plantations, outlet shopping, Art Deco architecture, and delicious Sundanese food.",
			gezilecekYerler: [
				{
					name: "Tangkuban Perahu Volcano",
					description: "Active volcano ~20 km north of Bandung—crater walks and volcanic views",
				},
				{
					name: "Kawah Putih (White Crater Lake)",
					description: "Turquoise crater lake ~40 km south—great for nature walks and photography",
				},
				{
					name: "Situ Patengan (Patengang Lake)",
					description: "Lake views, boat rides, tea plantations, nature walks, and bamboo forests",
				},
				{
					name: "Rengganis Hot Springs & Long Suspension Bridge",
					description: "Long suspension bridge walk, photo spots, hot springs, and spa experiences",
				},
				{ name: "Dusun Bambu Lembang", description: "Nature walks, restaurants, picnic areas, and bamboo gardens" },
				{ name: "Tebing Keraton", description: "Forest-and-city viewpoints—popular for sunrise" },
				{
					name: "Ciwidey Strawberry Fields & Ranca Upas",
					description: "Strawberry fields, camping areas, and deer spotting",
				},
				{
					name: "Floating Market Lembang",
					description: "Shopping and local food experience with boat rides",
				},
				{
					name: "Saung Angklung Udjo",
					description: "Traditional Sundanese music and dance with angklung instruments",
				},
				{ name: "Braga Street", description: "Cafés, galleries, and Art Deco buildings on a historic walk" },
				{ name: "Farmhouse Lembang", description: "European-themed village—photo spots and kids’ activities" },
				{
					name: "Alun-alun (City Square)",
					description: "Historic central square with a relaxed atmosphere and shaded paths",
				},
				{
					name: "Masjid Raya Bandung (Grand Mosque)",
					description: "On the city square—81 m minarets; minaret visits on Fridays",
				},
				{
					name: "Gedung Merdeka",
					description: "Historic Art Deco building where the 1955 Asia–Africa Conference took place",
				},
				{
					name: "Geological Museum",
					description: "Large collections of rocks, minerals, and fossils—located around the Dago area",
				},
				{
					name: "Djuanda Forest Park",
					description: "Forest park in Dago with botanical areas and WWII-era caves",
				},
				{ name: "Savoy Homann Hotel", description: "Iconic 1920s Art Deco heritage hotel building" },
			],
			aktiviteler: [
				{
					name: "Volcano Trekking",
					description: "Crater walks and viewpoint exploration at Tangkuban Perahu",
					icon: "🥾",
				},
				{
					name: "Sunrise Watching",
					description: "Watch and photograph sunrise from Tebing Keraton or Tangkuban Perahu",
					icon: "🌅",
				},
				{
					name: "Photography Tours",
					description:
						"Photo sessions at Floating Market, Farmhouse Lembang, Kawah Putih, and Situ Patengan",
					icon: "📷",
				},
				{
					name: "Sundanese Music & Dance Show",
					description: "Traditional Sundanese music with angklung instruments at Saung Angklung Udjo",
					icon: "🎵",
				},
				{
					name: "Hot Springs & Spa",
					description: "Relax and recharge at thermal hot springs in Rengganis and Ciater",
					icon: "♨️",
				},
				{
					name: "Nature Walks",
					description: "Forest and lakeside walks in Djuanda Forest Park, Ranca Upas, and Situ Patengan",
					icon: "🌲",
				},
				{
					name: "Suspension Bridge Walk",
					description: "Walk across the long suspension bridge at Rengganis for views and nature vibes",
					icon: "🌉",
				},
				{
					name: "Tea & Strawberry Farm Visits",
					description: "Tour tea plantations near Situ Patengan and pick strawberries in Ciwidey",
					icon: "🌾",
				},
				{
					name: "Museum Tours",
					description: "Visit the Geological Museum, Asia–Africa Museum, and local art galleries",
					icon: "🏛️",
				},
				{
					name: "Sunday Markets & Car-Free Day",
					description: "Sunday markets at Gasibu and car-free activities on Jalan Dago",
					icon: "🛍️",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"Sundanese Cuisine": [
					{ name: "Siomay (Bakso Tahu)", description: "Steamed dumplings with peanut sauce—Bandung favorite" },
					{ name: "Soto Bandung", description: "Beef soup with vegetables" },
					{ name: "Laksa Bandung", description: "Chicken soup with coconut milk and rice cakes" },
					{ name: "Lotek", description: "Boiled-vegetable salad with spicy peanut sauce" },
					{ name: "Batagor", description: "Fried dumplings—crispy version of siomay" },
					{ name: "Basreng", description: "Spicy fried meatball snacks" },
					{ name: "Bubur Ayam", description: "Chicken rice porridge—classic breakfast" },
					{ name: "Kupat Tahu", description: "Rice cakes and tofu with peanut sauce" },
					{ name: "Mie Goreng", description: "Spicy fried noodles" },
					{ name: "Oncom", description: "Fermented soybean cake used in local dishes" },
				],
				"Indonesian Cuisine": [
					{ name: "Nasi Goreng", description: "Spicy fried rice" },
					{ name: "Ayam Goreng", description: "Crispy fried chicken" },
					{ name: "Sate Ayam", description: "Chicken satay with peanut sauce" },
					{ name: "Gado-Gado", description: "Vegetable salad with peanut sauce" },
				],
				"Turkish Cuisine": [
					{ name: "Demir Kebab & Grill", description: "Kebab and grill dishes with Turkish-inspired flavors" },
					{ name: "Istanbul Kebab Turki TKI 2", description: "Traditional döner and kebab" },
					{ name: "Kebab Baba Sultan by Hakan Idris", description: "Highly rated kebab spot" },
					{ name: "Merhaba Kebab Cikutra", description: "Affordable kebab and wraps" },
					{ name: "Kebuli Abuya Batununggal", description: "Kebab and Middle Eastern-style dishes" },
					{ name: "Merhaba Kebab Dipatiukur", description: "Popular kebab stop" },
					{ name: "Merhaba Kebab Gerlong", description: "Traditional kebab shop" },
					{ name: "Kebab Sultan Panyileukan", description: "Kebab and wrap-style meals" },
					{ name: "Ngebabs Everyday", description: "Kebab and Middle Eastern snacks" },
				],
				"Western & Modern": [
					{ name: "Pizza", description: "Italian-style pizza at modern restaurants" },
					{ name: "Burgers & Steak", description: "Western-style burgers and meat dishes" },
					{ name: "Pastry & Cafes", description: "Café culture and classic pastry shops" },
				],
				"Non-Alcoholic Drinks": [
					{ name: "Coffee", description: "Modern coffee culture with a wide variety of drinks" },
					{ name: "Fresh Fruit Juices", description: "Seasonal tropical fruit juices" },
					{ name: "Jamu", description: "Traditional Indonesian herbal drink" },
					{ name: "Es Cendol", description: "Coconut milk drink with green starch jelly" },
				],
			},
			turkyemekleriNotu: "Some Turkish restaurants in Bandung also offer grilled dishes and pide varieties.",
			konaklama: [
				{ name: "Budget Hotels", description: "Hostels and budget-friendly stays" },
				{ name: "Mid-Range Hotels", description: "Comfortable heritage hotels with Art Deco vibes" },
				{ name: "Luxury Hotels", description: "Five-star service and mountain views at high-end properties" },
				{ name: "Mountain Resorts & Villas", description: "Nature stays around Lembang and nearby highlands" },
				{ name: "Trans Studio Complex", description: "Mall + theme park area with large hotel options" },
			],
			konaklamaSuresi: "2–3 days",
			konaklamaBudgeti: "USD 600–1000",
			alisveris: [
				{ name: "Paris Van Java Mall", description: "Large mall with international and local brands" },
				{ name: "Trans Studio Mall", description: "Indoor theme park complex with shopping and dining" },
				{ name: "BTC Fashion Mall", description: "Affordable fashion and local brands" },
				{ name: "Factory Outlets (Jl Riau & Jl Dago)", description: "Outlet shopping with good prices" },
				{ name: "Jalan Cihampelas (Jeans Street)", description: "Jeans shops and street shopping—also known for its skywalk" },
				{ name: "Distros (Independent Designers)", description: "Local designer streetwear and youth culture fashion" },
				{ name: "Cibaduyut (Leather Goods)", description: "Custom leather boots and shoes (production noted as 3–7 days)" },
				{ name: "Saung Angklung Udjo Gallery", description: "Sundanese handicrafts, angklung instruments, and wayang golek puppets" },
				{ name: "Jalan Braga", description: "Historic shopping street with cafés, galleries, and Art Deco buildings" },
				{ name: "Pasar Baru Trade Centre", description: "Central textile and clothing market" },
				{ name: "Electronics Shops (in malls)", description: "Electronics, computers, and accessories in major malls" },
			],
		},
	},
	lombok: {
		giliTrawangan: {
			description:
				"Gili Trawangan is the largest and most developed of Lombok’s three Gili Islands. With crystal-clear water, world-class dive sites, lively nightlife, and yoga studios, it’s a paradise for ocean lovers and adventure seekers. Motorized vehicles are banned—getting around is by bicycle and boat tours.",
			gezilecekYerler: [
				{
					name: "Gili Trawangan Beach (Main Beach)",
					description:
						"On the east coast, north of the harbor—turquoise water, white sand, swimming and snorkeling, easy access.",
				},
				{
					name: "Northwest Reef",
					description:
						"On the west side of the island—healthier coral sections; access can be over sharp dead coral, water shoes recommended.",
				},
				{
					name: "Shark Point",
					description:
						"A popular dive/snorkel spot with reef sharks and often sea turtles—always go with a guide and respect wildlife.",
				},
				{
					name: "Sunset Hill (South Hill)",
					description:
						"A hill on the southern side with old windmills and WWII relics—great for sunset; on clear mornings you may see Mount Rinjani.",
				},
				{
					name: "Gili Meno & Gili Air",
					description:
						"Neighboring islands for day trips—boat rides, snorkeling, a calmer atmosphere, and easy island hopping.",
				},
				{
					name: "Underwater Statues (Divers Down)",
					description:
						"An underwater art installation that doubles as a dive site—an interesting mix of art and marine life.",
				},
				{
					name: "Art Market (Pasar Seni)",
					description:
						"Next to the harbor—local handicrafts, batik textiles, and traditional Indonesian souvenirs.",
				},
				{
					name: "Gili Trawangan Bike Loop",
					description:
						"Cycle the island’s ~7 km perimeter (about 90–120 minutes)—small villages, fish farms, and nature views.",
				},
				{
					name: "Mangrove Forest",
					description:
						"Kayak tours and easy eco-time—birdwatching and wildlife spotting in mangrove channels.",
				},
				{
					name: "Freedive Gili Center",
					description:
						"Apnea and freediving courses from beginner to advanced—breath-hold training with experienced instructors.",
				},
				{
					name: "Gili Cooking Classes (near the Art Market)",
					description:
						"Short classes (around 3 hours) where you learn multiple Indonesian/Lombok dishes using local ingredients.",
				},
				{
					name: "Subwing Gili",
					description:
						"A fun water activity where you ‘fly’ underwater while being pulled by a boat—typically done in short sessions.",
				},
			],
			aktiviteler: [
				{
					name: "World-class Scuba Diving",
					description:
						"Many dive shops with courses and certifications—spot manta rays (seasonal), reef sharks, turtles, and vibrant reefs (5–40 m).",
					icon: "🤿",
				},
				{
					name: "Snorkeling",
					description:
						"Easy shoreline snorkeling over coral and tropical fish—popular routes include Shark Point with a guide.",
					icon: "🏊",
				},
				{
					name: "Surfing",
					description:
						"Seasonal breaks; in the broader Lombok region the January–June window is often best.",
					icon: "🏄",
				},
				{
					name: "Yoga Sessions",
					description: "Yoga studios with morning/evening classes—often beachside.",
					icon: "🧘",
				},
				{
					name: "Bike Tour",
					description:
						"Cycle the island loop—villages, fish farms, and quiet coastal stretches.",
					icon: "🚴",
				},
				{
					name: "Horse Riding",
					description:
						"Beach and coastal trail rides—sunrise and sunset options are especially popular.",
					icon: "🐴",
				},
				{
					name: "Party Boat Trips",
					description:
						"Boat cruises with music, swimming and snorkeling—check operator safety and reviews before booking.",
					icon: "🎉",
				},
				{
					name: "Cooking Classes",
					description:
						"Learn Indonesian cooking with local ingredients—hands-on and beginner-friendly.",
					icon: "👨‍🍳",
				},
				{
					name: "Sunrise Watching",
					description: "From the east coast—great for photos and calm beach time.",
					icon: "🌅",
				},
				{
					name: "Night Snorkeling",
					description:
						"Guided night snorkels to see nocturnal marine life; bioluminescence may appear on some nights.",
					icon: "🌙",
				},
				{
					name: "Freediving & Apnea Course",
					description:
						"Breath-hold diving training from beginner to advanced—always do it with certified instructors.",
					icon: "🫁",
				},
				{
					name: "Muck Diving",
					description:
						"A specialty style of diving focused on unusual bottom-dwelling creatures—great for photographers.",
					icon: "📸",
				},
				{
					name: "Walking Tours",
					description:
						"Walk the island loop (about 90–120 minutes)—includes viewpoints and WWII-era bunkers.",
					icon: "🥾",
				},
				{
					name: "Technical Diving",
					description:
						"Advanced dives (e.g., CCR / trimix) with specialist operators—requires proper certification.",
					icon: "🛻",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"Indonesian & Asian": [
					{
						name: "Nasi Goreng & Mie Goreng",
						description:
							"Local-style fried rice and fried noodles with vegetables and your choice of protein.",
					},
					{
						name: "Satay (Sate)",
						description: "Spiced grilled skewers served with peanut sauce.",
					},
					{
						name: "Gado-Gado",
						description:
							"Vegetable salad with peanut sauce, tofu, and egg—an Indonesian classic.",
					},
					{
						name: "Lumpia",
						description: "Fried spring rolls served with sweet and spicy sauces.",
					},
					{
						name: "Som Tam (Papaya Salad)",
						description:
							"Spicy Thai-style green papaya salad with lime and fish sauce.",
					},
					{
						name: "Bakso",
						description:
							"Meatball soup commonly found at night markets and local warungs.",
					},
					{
						name: "Dessert Pancakes",
						description:
							"Sweet street pancakes often sold at night markets—great for a late snack.",
					},
				],
				Seafood: [
					{
						name: "Fresh Fish",
						description:
							"Daily catch served grilled, fried, or steamed depending on the restaurant.",
					},
					{
						name: "Grilled Fish",
						description:
							"Snapper and trevally are popular—often grilled over open fire in the evenings.",
					},
					{
						name: "Prawns & Squid",
						description: "Fresh prawns and squid, grilled or lightly fried with spices.",
					},
					{
						name: "Fish Cakes & Patties",
						description: "Local fish cake variations—baked or fried.",
					},
				],
				"Western Cuisine": [
					{
						name: "Pizza & Pasta",
						description: "Italian-style pizza and pasta, often wood-fired.",
					},
					{
						name: "Burgers & Sandwiches",
						description: "Fresh ingredients and plenty of gourmet options.",
					},
					{
						name: "Salad Bar",
						description:
							"Fresh vegetables with protein choices and a variety of dressings.",
					},
				],
				"Non-alcoholic drinks": [
					{
						name: "Tropical Fruit Juices",
						description:
							"Fresh-pressed mango, papaya, pineapple, passion fruit, and guava.",
					},
					{
						name: "Boba Tea / Bubble Tea",
						description: "Tea-based drinks with tapioca pearls in many flavors.",
					},
					{
						name: "Es Campur",
						description:
							"Indonesian shaved-ice dessert drink with jelly and mixed toppings.",
					},
					{
						name: "Coconut Water",
						description:
							"Fresh coconut water—naturally rich in electrolytes and minerals.",
					},
					{
						name: "Kopi (Coffee)",
						description:
							"Indonesian coffee (often robusta), served black or sweetened.",
					},
					{
						name: "Jamu",
						description:
							"Traditional herbal drink popular for wellness and energy.",
					},
					{
						name: "Tea",
						description:
							"Hot or iced tea—local blends and spiced teas are common.",
					},
				],
			},
			konaklama: [
				{
					name: "Budget Hostels",
					description:
						"Many hostels ranging from dorms to private rooms—social, backpacker-friendly.",
				},
				{
					name: "Affordable Hotels",
					description:
						"Small hotels with basic comfort and good value (availability varies by season).",
				},
				{
					name: "Mid-range Hotels",
					description:
						"Boutique stays with pools and front-desk service—good comfort-to-price balance.",
				},
				{
					name: "Boutique Villas",
					description:
						"Designer villas, some beachfront—great for couples, families, and groups.",
				},
				{
					name: "Luxury Resorts",
					description:
						"High-end beachfront options with premium service and amenities.",
				},
			],
			konaklamaSuresi: "3–5 days",
			konaklamaBudgeti: "USD 900–1700",
			alisveris: [
				{
					name: "Art Market (near Santai Beach Club)",
					description:
						"Local art, batik textiles, wooden crafts, and traditional Indonesian products.",
				},
				{
					name: "Beachwalk Shops",
					description:
						"Small shops along the beach selling souvenirs, beachwear, and jewelry.",
				},
				{
					name: "ATMs & Money Exchange",
					description:
						"Multiple ATMs and exchange offices—still carry some cash for smaller vendors.",
				},
				{
					name: "Souvenir & Craft Shops",
					description: "Batik, wood carving, and locally made handicrafts.",
				},
				{
					name: "Clothing & Beachwear",
					description:
						"Swimwear, surf clothing, yoga wear, and locally designed pieces.",
				},
				{
					name: "Pharmacy & Health",
					description:
						"Basic medicine, sunscreen, insect repellent, and everyday health products.",
				},
				{
					name: "William’s Bookshop",
					description:
						"Behind the Art Market—postage stamps, postcards/shipping, and books.",
				},
				{
					name: "Internet Cafés & Laundry",
					description:
						"Internet cafés and laundry services are available behind the Art Market area.",
				},
			],
		},
		mountRinjani: {
			description:
				"Mount Rinjani is Lombok’s iconic active volcano and Indonesia’s second-highest mountain. At 3,726 meters, it’s famous for the crater lake Segara Anak (“Child of the Sea”), hot springs, and dramatic sunrise views. It’s best for experienced hikers seeking a challenging but rewarding trek.",
			gezilecekYerler: [
				{
					name: "Segara Anak Crater Lake",
					description:
						"A crater lake at ~2,000 m elevation—known for its unique volcanic setting and warm-water areas near hot springs.",
				},
				{
					name: "Aik Kalak Hot Springs",
					description:
						"Hot springs near the crater area—popular for soaking after hiking.",
				},
				{
					name: "Gua Susu (Milk Cave)",
					description:
						"A steamy cave considered sacred by locals—often visited for quiet reflection.",
				},
				{
					name: "Sendanggile Waterfall",
					description:
						"A scenic waterfall at the mountain foothills—great for easier nature walks and photos.",
				},
				{
					name: "Crater Rim",
					description:
						"Panoramic viewpoints around 2,600+ meters with sweeping views of the lake and the Barujari cone—ideal for sunrise.",
				},
			],
			aktiviteler: [
				{
					name: "2D/1N Trek (Crater Rim)",
					description:
						"A shorter trek from Senaru or Sembalun to the crater rim—typically includes sunrise viewing.",
					icon: "🥾",
					uyari:
						"⚠️ Altitude-sickness risk (2000m+). Good fitness required. Certified guide is mandatory.",
				},
				{
					name: "3D/2N Trek (Rim + Lake)",
					description:
						"Crater rim plus descent to Segara Anak lake and hot springs—organized with trekking operators.",
					icon: "⛺",
					uyari:
						"⚠️ Reaches 2000m+ altitude. Temperatures can drop below freezing. Emergency response is limited; very good fitness required.",
				},
				{
					name: "4D/3N Trek (Summit Attempt)",
					description:
						"Rim → summit (3,726m) → lake → descent. The most demanding route.",
					icon: "⛰️",
					uyari:
						"⚠️ MOST DIFFICULT OPTION — summit temps can be -4°C to +5°C. Severe altitude risk. No helicopter rescue. Only for very fit, experienced hikers with professional guides.",
				},
				{
					name: "Sunrise Trek",
					description:
						"Night hiking to catch sunrise from the crater rim—one of the most memorable moments on Rinjani.",
					icon: "🌅",
					uyari:
						"⚠️ Night hiking is risky: cold temperatures, proper lighting required, slippery sections possible. Fitness required.",
				},
				{
					name: "Waterfall Trips",
					description:
						"Easier hikes to waterfalls in Senaru/Sembalun areas—good as a lighter alternative to summit treks.",
					icon: "💧",
					uyari:
						"⚠️ Wet rocks can be slippery; high water levels can be dangerous. Wear proper shoes and use caution.",
				},
			],
			yiyecekIcecekler: [
				{
					name: "Warung Meals (Nasi Goreng, Mie Goreng)",
					description:
						"Simple local meals in Senaru and Sembalun villages—fried rice and noodles are the staples.",
				},
				{
					name: "Trekking Meal Packs",
					description:
						"Hot meals and snacks prepared by porters on organized treks—focused on energy and recovery.",
				},
				{
					name: "Energy Bars & Fruit",
					description:
						"High-energy foods to buy before starting: dried fruit, nuts, chocolate, and energy bars.",
				},
				{
					name: "Tea & Coffee",
					description:
						"Hot tea and coffee in Senaru/Sembalun—useful for early starts and cold nights.",
				},
			],
			konaklama: [
				{
					name: "Senaru Village Stays",
					description:
						"Guesthouses and small hotels near the northern trailhead (around 600m elevation).",
				},
				{
					name: "Sembalun Lawang Stays",
					description:
						"An alternative eastern starting point (around 1,150m)—closer to the summit route.",
				},
				{
					name: "Mountain Campsites",
					description:
						"Designated camping areas on the trek (including crater-rim camps).",
				},
				{
					name: "Nearby Areas",
					description:
						"Senggigi, Tanjung, and the Gili Islands can be used as bases, depending on your route.",
				},
			],
			konaklamaSuresi: "2–4 days",
			konaklamaBudgeti: "USD 500–900",
			alisveris: [
				{
					name: "Senaru & Sembalun Village Markets",
					description:
						"Basic supplies, bottled water, snacks, and last-minute trek essentials.",
				},
				{
					name: "Trekking Gear Rental",
					description:
						"Hiking poles, headlamps, gloves, sleeping bags, and mats (availability varies).",
				},
				{
					name: "Pharmacy & First Aid",
					description:
						"Basic medicine, painkillers, stomach meds, sunscreen, and insect repellent.",
				},
			],
			turkyemekleriNotu:
				"⚠️ CRITICAL SAFETY WARNING: Mount Rinjani trekking is an extremely dangerous high-mountain climb. In 2025, at least 2 people died, including Brazilian Juliana Marins (26) and Malaysian Rennie Abdul Ghani (57). Dozens of deaths have been recorded historically (e.g., drowning at Segara Anak in 2016; 7 deaths from cold in 2007). RISKS: altitude sickness (2000m+), summit temperatures -4°C to +5°C, NO helicopter rescue, very high physical demands. Recommended only for excellent health/fitness, with certified professional guides. Penalties for violating Indonesian regulations can be severe. Proper safety briefing and insurance are strongly advised before trekking.",
		},
		senggigi: {
			description:
				"Senggigi is Lombok’s main beach resort area and the most developed tourist hub on the west coast. It’s known for long beaches, sunset views, water sports, and a solid range of hotels and resorts—often seen as a calmer alternative to Bali with modern comforts.",
			gezilecekYerler: [
				{
					name: "Senggigi Beach (Main Beach)",
					description:
						"A coastline stretching for several kilometers—turquoise water, sunsets, and full tourist facilities.",
				},
				{
					name: "Pura Batu Bolong Temple",
					description:
						"An ancient seaside temple on a rock outcrop—popular for ceremonies and photos.",
				},
				{
					name: "Three Gilis Day Trip",
					description:
						"Boat tours to Gili Trawangan, Gili Meno, and Gili Air for snorkeling and diving.",
				},
				{
					name: "Senggigi Art Market",
					description:
						"Local art, batik textiles, carved wood, handicrafts, and souvenirs near the beach.",
				},
				{
					name: "Mandalika Resort Area",
					description:
						"A developing area south of Senggigi with modern venues, cafés, and restaurants.",
				},
				{
					name: "Lombok Pottery Workshop",
					description:
						"Traditional pottery workshops where you can see the process and buy handmade pieces.",
				},
				{
					name: "Aik Kalak Hot Springs (Rinjani tour)",
					description:
						"A day trip option from Senggigi (about 60–90 minutes by car), near Rinjani’s foothills.",
				},
			],
			aktiviteler: [
				{
					name: "Snorkeling",
					description:
						"Snorkel near the beach or join tours toward the Gili Islands—corals and tropical fish.",
					icon: "🏊",
				},
				{
					name: "Scuba Diving",
					description:
						"Certified dive instructors and trips around the Gilis and Lombok coastline.",
					icon: "🤿",
				},
				{
					name: "Sunset Cruises",
					description:
						"Boat rides with sunset views—often with music and a relaxed vibe.",
					icon: "🌅",
				},
				{
					name: "Jet Ski & Water Sports",
					description:
						"Jet ski, parasailing, tubing, wakeboarding—varies by beach operator.",
					icon: "🚤",
				},
				{
					name: "Spa & Massage",
					description:
						"Hotel spas and standalone centers—Balinese massage and wellness treatments.",
					icon: "💆",
				},
				{
					name: "Yoga & Meditation",
					description:
						"Morning/evening classes and beachside sessions.",
					icon: "🧘",
				},
				{
					name: "Walking Tours",
					description:
						"Beach walks and village routes with breakfast stops.",
					icon: "🥾",
				},
				{
					name: "Cultural Tours",
					description:
						"Temple visits, pottery workshops, local markets, and traditional crafts.",
					icon: "🎭",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"Indonesian & Asian": [
					{
						name: "Nasi Goreng & Mie Goreng",
						description:
							"Local-style fried rice and noodles with vegetables and protein options.",
					},
					{
						name: "Satay (Sate)",
						description:
							"Grilled skewers with peanut or curry sauce—common in street food and restaurants.",
					},
					{
						name: "Lumpia",
						description: "Spring rolls with sweet and spicy sauces—night-market favorite.",
					},
					{
						name: "Pecel Ayam",
						description:
							"Chicken served with vegetable salad and peanut-based sauce—simple and satisfying.",
					},
				],
				Seafood: [
					{
						name: "Grilled Fish",
						description:
							"Daily catch like snapper and trevally—spice-grilled and widely available in the evenings.",
					},
					{
						name: "Prawns & Squid",
						description:
							"Garlic-butter prawns, tempura-style squid, or spicy fried variations.",
					},
					{
						name: "Lobster",
						description:
							"Fresh lobster served grilled or fried—often in specialty restaurants.",
					},
					{
						name: "Fish Cakes",
						description: "Local fish cake dishes, baked or fried.",
					},
				],
				"Western Cuisine": [
					{
						name: "Pizza",
						description:
							"Wood-fired options with fresh ingredients—Italian and fusion styles.",
					},
					{
						name: "Burgers & Sandwiches",
						description:
							"Gourmet burgers with fresh-baked bread and crisp vegetables.",
					},
					{
						name: "Steak",
						description:
							"Quality cuts cooked to your preferred doneness at fine-dining venues.",
					},
					{
						name: "Salad Bar",
						description:
							"Fresh salads with protein choices—health-focused menus are common.",
					},
				],
				"Non-alcoholic drinks": [
					{
						name: "Tropical Fruit Juices",
						description:
							"Fresh mango, papaya, pineapple and passion fruit—served at cafés and juice stands.",
					},
					{
						name: "Boba Tea",
						description: "Bubble tea in many flavors—popular with younger crowds.",
					},
					{
						name: "Indonesian Coffee",
						description:
							"Local robusta coffee, often served black or sweetened.",
					},
					{
						name: "Jamu",
						description:
							"Traditional herbal drink used for wellness and energy.",
					},
					{
						name: "Coconut Water",
						description: "Fresh coconut water, naturally rich in electrolytes.",
					},
				],
			},
			konaklama: [
				{
					name: "Luxury Resorts",
					description:
						"Five-star beachfront complexes (e.g., Sheraton-style resorts) with full amenities and resort concepts.",
				},
				{
					name: "Boutique Hotels",
					description:
						"Smaller boutique stays with a more intimate feel and mid-to-upper comfort.",
				},
				{
					name: "Mid-range Hotels",
					description:
						"Comfortable hotels with pools and essential facilities.",
				},
				{
					name: "Budget Hostels",
					description:
						"Backpacker hostels with dorm rooms and a social atmosphere.",
				},
				{
					name: "Airbnb & Villas",
					description:
						"Private villas suitable for families and groups—often good value.",
				},
			],
			konaklamaSuresi: "2–4 days",
			konaklamaBudgeti: "USD 1200–2500",
			alisveris: [
				{
					name: "Senggigi Art Market",
					description:
						"Beachside market for batik, wood carving, and traditional souvenir items.",
				},
				{
					name: "Senggigi Shopping Center",
					description:
						"A small modern shopping area with local and international brands.",
				},
				{
					name: "Beachwalk Shops",
					description:
						"Boutiques along the beach selling souvenirs, beachwear and jewelry.",
				},
				{
					name: "Money Exchange & ATMs",
					description:
						"ATMs and exchange offices in town—carry cash for smaller vendors.",
				},
				{
					name: "Spa & Wellness Shops",
					description:
						"Aromatherapy oils, skincare, and traditional wellness products.",
				},
				{
					name: "Pharmacy & Health",
					description:
						"Basic medicine, sunscreen, insect repellent and health essentials.",
				},
			],
		},
		kutaLombok: {
			description:
				"Kuta Lombok is a world-famous surf haven on Lombok’s south coast, known for white-sand beaches and a raw, natural feel. With quality waves, beautiful scenery, and a rapidly developing infrastructure, it has become increasingly popular. Its proximity to Desert Point makes legendary surf spots more accessible.",
			gezilecekYerler: [
				{
					name: "Kuta Beach (Main Beach)",
					description:
						"White sand, turquoise water, and an easygoing beach for swimming and casual snorkeling.",
				},
				{
					name: "Desert Point",
					description:
						"A world-class left-hand surf break with long barrels; season and conditions vary—go with experienced locals.",
				},
				{
					name: "Tanjung Aan Beach",
					description:
						"A calm beach near Kuta with clear water and reef sections—good for a relaxed day.",
				},
				{
					name: "Benang Kelambu (Waterfall day trip)",
					description:
						"A waterfall reachable by a short walk—cool freshwater pools and a picnic-friendly area.",
				},
				{
					name: "Menus Cliff (Panoramic Viewpoint)",
					description:
						"A hilltop viewpoint with panoramic coastal views—popular for sunset and photos.",
				},
				{
					name: "Selong Belanak Beach",
					description:
						"A quieter beach west of Kuta—often beginner-friendly for surf lessons.",
				},
				{
					name: "Mawun Beach",
					description:
						"A scenic cove southeast of Kuta—calmer water and a more secluded atmosphere.",
				},
				{
					name: "Gerupuk Bay",
					description:
						"A bay with dramatic rock formations, surf breaks, and a traditional fishing-village vibe.",
				},
			],
			aktiviteler: [
				{
					name: "World-class Surfing",
					description:
						"From Desert Point to beginner beaches—conditions vary by season; lessons available for all levels.",
					icon: "🏄",
				},
				{
					name: "Snorkeling",
					description:
						"Reef snorkeling near beaches and via day trips—tropical fish and shallow coral areas.",
					icon: "🏊",
				},
				{
					name: "Scuba Diving",
					description:
						"Local dive schools offer certifications and reef dives at nearby spots.",
					icon: "🤿",
				},
				{
					name: "Trekking & Hiking",
					description:
						"Short hikes to viewpoints, waterfalls, and village routes—good for nature breaks.",
					icon: "🥾",
				},
				{
					name: "Sunrise & Sunset",
					description:
						"Sunset at viewpoints like Menus Cliff, and sunrise walks on the beach.",
					icon: "🌅",
				},
				{
					name: "Spa & Massage",
					description:
						"Traditional massages and wellness sessions at hotels and standalone spas.",
					icon: "💆",
				},
				{
					name: "Cultural Tours",
					description:
						"Craft villages, local markets, weaving traditions, and small cultural sites.",
					icon: "🎭",
				},
				{
					name: "Boat Trips",
					description:
						"Island hopping, snorkeling tours, sunset cruises, and private charters.",
					icon: "⛵",
				},
				{
					name: "Photography / Instagram Spots",
					description:
						"Beaches, cliffs, and sunsets—guided photo tours are available.",
					icon: "📸",
				},
				{
					name: "Yoga & Meditation",
					description:
						"Morning beach yoga and sunset meditation sessions in wellness retreats.",
					icon: "🧘",
				},
				{
					name: "ATV / Motorbike Tours",
					description:
						"Adventure rides on coastal and hill routes—explore villages and off-road tracks.",
					icon: "🏍️",
				},
				{
					name: "Fishing Trips",
					description:
						"Day or night fishing tours by boat with local fishermen.",
					icon: "🎣",
				},
				{
					name: "Kayaking & Paddle Boarding",
					description:
						"Coastal paddling and calm-water sessions depending on conditions.",
					icon: "🛶",
				},
				{
					name: "Local Cooking Class",
					description:
						"Cook Indonesian dishes with a guide—often includes a local market visit.",
					icon: "👨‍🍳",
				},
				{
					name: "Rock Climbing",
					description:
						"Climb around areas like Gerupuk with professional guidance.",
					icon: "🧗",
				},
				{
					name: "Community / Responsible Travel Tours",
					description:
						"Visit fishing villages and craft workshops—support local communities.",
					icon: "🤝",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				Info: [
					{
						name: "",
						description:
							"There is no Turkish cuisine in Kuta Lombok, but you can find Mediterranean-style restaurants.",
					},
				],
				"Indonesian & Asian": [
					{
						name: "Nasi & Mie Goreng",
						description:
							"Warung-style fried rice and noodles—simple, filling lunch and dinner staples.",
					},
					{
						name: "Satay",
						description:
							"Grilled skewers found as street food and in casual restaurants—often with spicy sauces.",
					},
					{
						name: "Gado-Gado",
						description:
							"Vegetable salad with peanut sauce—an Indonesian classic.",
					},
					{
						name: "Lumpia",
						description:
							"Fried spring rolls often sold at night markets.",
					},
					{
						name: "Martabak Terang Bulan",
						description:
							"Sweet stuffed pancake with many toppings—popular in evening markets.",
					},
					{
						name: "Es Cendol",
						description:
							"Traditional iced sweet drink with coconut and palm-sugar syrup.",
					},
				],
				Seafood: [
					{
						name: "Grilled Fish",
						description:
							"Daily catch like snapper and trevally—open-fire grilled at local prices.",
					},
					{
						name: "Prawns & Squid",
						description:
							"Garlic, teriyaki, or spicy options—often served at beach restaurants.",
					},
					{
						name: "Cumi Karaage",
						description:
							"Japanese-style fried squid—popular local variation.",
					},
					{
						name: "Fresh White Fish Specials",
						description:
							"Fresh white fish from nearby fishing villages—served as daily specials.",
					},
					{
						name: "Seafood BBQ Platters",
						description:
							"Mixed grilled seafood platters with fish, prawns, and squid.",
					},
					{
						name: "Fresh Fish Ceviche",
						description:
							"A citrus-cured fish dish—an adapted Western-style favorite in some cafés.",
					},
					{
						name: "Seaweed / Seagrass Snacks",
						description:
							"Local seaweed-based snacks—light, salty bites.",
					},
				],
				"Western Cuisine": [
					{
						name: "Pizza",
						description:
							"Kuta is known for good pizza—often wood-fired with fresh Italian-style ingredients.",
					},
					{
						name: "Burgers",
						description: "Gourmet burgers with fresh buns and local ingredients.",
					},
					{
						name: "Pasta",
						description:
							"Pasta with various sauces—seafood versions are a common favorite.",
					},
					{
						name: "Café Smoothies",
						description:
							"Fruit smoothies and acai bowls—health-focused breakfasts.",
					},
					{
						name: "Balinese / Lombok Fusion",
						description:
							"Modern takes that blend Balinese and Lombok flavors.",
					},
				],
				"Non-alcoholic drinks": [
					{
						name: "Tropical Fruit Juices",
						description: "Fresh-pressed mango, papaya, and passion fruit.",
					},
					{
						name: "Indonesian Coffee",
						description:
							"Local robusta coffee, sometimes served with a foamy top (ombak).",
					},
					{
						name: "Jamu",
						description:
							"Traditional herbal mix used for energy and wellness.",
					},
					{
						name: "Boba Tea",
						description:
							"Bubble tea and fruit teas—popular with younger crowds.",
					},
					{
						name: "Teh Tarik",
						description:
							"Pulled milk tea—sweet, foamy, and widely found at street cafés.",
					},
					{
						name: "Seasonal Fresh Juices",
						description:
							"Seasonal blends using local fruits—ask what’s best that day.",
					},
					{
						name: "Es Kelapa Muda",
						description:
							"Young coconut water served cold—natural electrolytes.",
					},
				],
			},
			konaklama: [
				{
					name: "Boutique Beach Hotels",
					description:
						"Quality stays near the beach with a boutique feel.",
				},
				{
					name: "Resort Complexes",
					description: "Mandalika area resorts and higher-end options with full facilities.",
				},
				{
					name: "Hostels & Backpacker Stays",
					description: "Dorm rooms and social hostels for budget travelers.",
				},
				{
					name: "Airbnb & Villas",
					description: "Private villas for groups/families—often good value.",
				},
				{
					name: "Surf Camps",
					description:
						"Surf-focused stays with lessons included—ideal for learning and progression.",
				},
				{
					name: "Luxury Villa Resorts",
					description:
						"Premium resorts with private pools and concierge—five-star experiences.",
				},
				{
					name: "Budget Hotels",
					description:
						"Simple, clean, and good value—popular with backpackers.",
				},
				{
					name: "Beachfront Bungalows",
					description:
						"Direct beach access with a romantic vibe and sunset views.",
				},
				{
					name: "Eco-lodges & Green Resorts",
					description:
						"Sustainable stays designed to blend with nature.",
				},
			],
			konaklamaSuresi: "3–5 days",
			konaklamaBudgeti: "USD 1200–2100",
			alisveris: [
				{
					name: "Kuta Night Market",
					description: "Night market for local products, clothing, and small souvenirs.",
				},
				{
					name: "Art & Craft Galleries",
					description: "Pottery pieces, wood carvings, and batik textiles.",
				},
				{
					name: "Surf Shops",
					description: "Surfboards, clothing, accessories, plus rentals.",
				},
				{
					name: "Money Exchange & ATMs",
					description:
						"Limited availability—plan cash needs in advance.",
				},
				{
					name: "Pharmacy & Health",
					description: "Basic medicine, sunscreen, bandages, and essentials.",
				},
				{
					name: "Phones & Accessories",
					description: "Phone accessories and repairs—availability varies.",
				},
				{
					name: "Electronics (Mataram ~45 km)",
					description:
						"Cameras, drones, and broader electronics are mainly found in Mataram—can be arranged as a trip.",
				},
				{
					name: "Artisan / Souvenir Shops",
					description:
						"Handmade jewelry, beachwear, magnets, small gifts, and local creator items.",
				},
				{
					name: "Boutiques",
					description:
						"Beach dresses, bikinis, hats, and designer-style pieces.",
				},
				{
					name: "Sasak / Pottery Villages (Batu Layar)",
					description:
						"Pottery, handwoven textiles, and traditional crafts—often direct from artisans.",
				},
			],
		},
		benangStokel: {
			description:
				"Benang Stokel Waterfall is a beautiful multi-tier waterfall system in eastern Lombok with refreshing freshwater pools. Set on the foothills of Mount Rinjani, the first three tiers are relatively easy to reach, making it a favorite eco-stop for forest walks, swimming, and nature time.",
			gezilecekYerler: [
				{
					name: "Benang Stokel Waterfall (Level 1)",
					description:
						"Main waterfall (~15 m) with a natural pool—about a 10-minute walk.",
				},
				{
					name: "Benang Stokel Tier 2",
					description:
						"Second tier (~20 m) with a second pool—usually less crowded (around 15 minutes).",
				},
				{
					name: "Benang Stokel Tier 3",
					description:
						"Third tier (~25 m)—the furthest easy-to-reach point, quieter forest setting.",
				},
				{
					name: "Benang Kelambu Waterfall",
					description:
						"A nearby alternative waterfall reached via a separate trail—calmer and more secluded.",
				},
				{
					name: "Forest Trekking Trail",
					description:
						"Forest walk with birdwatching and wildlife spotting—great for nature photography.",
				},
				{
					name: "Natural Plunge Pools",
					description:
						"Cool freshwater pools at the waterfall base—swimming and short dips.",
				},
				{
					name: "Picnic Areas",
					description:
						"Small clearings suitable for picnics—simple local catering may be available via guides.",
				},
			],
			aktiviteler: [
				{
					name: "Waterfall Trekking",
					description:
						"Visit the tiers via 1–3 hour routes—suitable for many fitness levels.",
					icon: "🥾",
				},
				{
					name: "Freshwater Swimming",
					description:
						"Swim in the waterfall pools—cold water and a refreshing natural setting.",
					icon: "🏊",
				},
				{
					name: "Birdwatching",
					description:
						"Spot tropical bird species—early morning tours can be best.",
					icon: "🦅",
				},
				{
					name: "Photography",
					description:
						"Waterfall portraits and forest scenery—great for nature shots.",
					icon: "📸",
				},
				{
					name: "Picnic / BBQ",
					description:
						"Forest picnics for couples, families, and groups—can be arranged with local catering.",
					icon: "🧺",
				},
				{
					name: "Meditation & Yoga",
					description:
						"Quiet sessions surrounded by nature—forest-bathing style relaxation.",
					icon: "🧘",
				},
				{
					name: "Wildlife Spotting",
					description:
						"Observe monkeys, birds, and insects—bring binoculars if you have them.",
					icon: "🔭",
				},
				{
					name: "Rockpool Hopping",
					description:
						"Move between rock pools for dips—fun for adventure seekers; watch your footing.",
					icon: "🏞️",
				},
				{
					name: "Drone Photography",
					description:
						"Aerial shots of the waterfall and forest—follow local rules and be respectful.",
					icon: "🚁",
				},
				{
					name: "Nature Art / Sketching",
					description:
						"Sketching and creative sessions in a calm outdoor setting.",
					icon: "🎨",
				},
				{
					name: "Learn Local Flora & Fauna",
					description:
						"Guided walks to learn plants, insects, and birds—basic ecosystem knowledge.",
					icon: "🌱",
				},
				{
					name: "Macro Photography",
					description:
						"Close-up photos of insects, flowers, and details in the forest.",
					icon: "🔬",
				},
			],
			yiyecekIcecekler: {
				__replace: true,
				"Indonesian & Local": [
					{
						name: "Packed Meals (Lunch Boxes)",
						description:
							"Simple boxed meals (e.g., nasi kuning with side dishes) often arranged by guides.",
					},
					{
						name: "Warung Meals",
						description:
							"Basic village warungs serving staples like nasi goreng and mie goreng.",
					},
					{
						name: "Desserts",
						description:
							"Indonesian sweets like pisang goreng and martabak from local stalls.",
					},
					{
						name: "Rujak (Fruit Salad)",
						description:
							"Mixed fruits like papaya and pineapple with a tamarind-based spicy-sweet sauce.",
					},
				],
				"Protein Dishes": [
					{
						name: "Ikan Bakar (Grilled Fish)",
						description:
							"Freshwater or local fish grilled with Indonesian spices.",
					},
					{
						name: "Ayam Satay (Sate Ayam)",
						description:
							"Chicken satay skewers with peanut sauce—often picked up from local markets.",
					},
					{
						name: "Tahu Goreng (Fried Tofu)",
						description:
							"Fried tofu with sweet sauce—an easy vegetarian option.",
					},
					{
						name: "Ayam Goreng (Fried Chicken)",
						description:
							"Crispy fried chicken with local spices—great for picnic-style meals.",
					},
				],
				"Snacks & Energy": [
					{
						name: "Granola & Muesli",
						description:
							"Portable snacks for trekking—nuts and mixed cereals.",
					},
					{
						name: "Kacang Panggang (Roasted Peanuts)",
						description:
							"Roasted peanuts—high in protein and easy to carry.",
					},
					{
						name: "Bananas & Tropical Fruit",
						description:
							"Fresh bananas and seasonal fruits—natural quick energy.",
					},
					{ name: "Energy Bars", description: "Store-bought energy bars with long shelf life." },
				],
				"Picnic Favorites": [
					{
						name: "Perkedel (Potato Croquettes)",
						description:
							"Indonesian-style potato croquettes—easy to pack.",
					},
					{
						name: "Lumpia (Spring Rolls)",
						description: "Spring rolls served cool or at room temperature.",
					},
					{
						name: "Ketoprak",
						description:
							"Vegetable mix with tofu and egg—often part of picnic boxes.",
					},
					{
						name: "BBQ Package Options",
						description:
							"Group picnic catering and BBQ packs arranged through guides.",
					},
				],
				"Electrolytes & Sports Drinks": [
					{
						name: "Pocari Sweat",
						description:
							"Popular electrolyte drink to help replace fluids after sweating.",
					},
					{
						name: "Local Sports Drinks",
						description:
							"Indonesian-brand sports drinks—easy alternatives to global brands.",
					},
					{
						name: "Oral Rehydration (Salt/Sugar Water)",
						description:
							"A simple DIY rehydration mix—use responsibly and prefer proper ORS when available.",
					},
					{
						name: "Fresh Lime Juice (Es Jeruk)",
						description:
							"Fresh citrus drink and vitamin C boost—often made by local vendors.",
					},
				],
				"Non-alcoholic drinks": [
					{
						name: "Es Teh Manis (Sweet Iced Tea)",
						description:
							"Sweet iced tea—one of the most common local drinks.",
					},
					{
						name: "Indonesian Coffee",
						description:
							"Local robusta coffee, often carried in a thermos for day trips.",
					},
					{
						name: "Coconut Water",
						description: "Fresh coconut water—electrolyte-rich and refreshing.",
					},
					{
						name: "Jamu",
						description:
							"Traditional herbal drink sometimes prepared fresh nearby.",
					},
					{
						name: "Bottled Water",
						description:
							"Bring plenty of safe drinking water—don’t drink directly from streams.",
					},
				],
			},
			konaklama: [
				{
					name: "Tetebatu Village Guesthouses",
					description:
						"Budget-friendly, family-run stays in nearby Tetebatu village.",
				},
				{
					name: "Sembalun Valley Bungalows",
					description:
						"More remote stays with a nature vibe—useful as an alternative base.",
				},
				{
					name: "Lombok Ecotourism Lodges",
					description:
						"Eco-lodges focused on outdoor living and nature immersion.",
				},
				{
					name: "Mount Rinjani Gateways",
					description:
						"Stays near gateway areas like Senaru or Sembalun—useful for combining with Rinjani trips.",
				},
				{
					name: "Camping Options",
					description:
						"Basic camping near nature areas (where permitted)—check local rules and safety.",
				},
			],
			konaklamaSuresi: "1–2 days",
			konaklamaBudgeti: "USD 600–950",
			alisveris: [
				{
					name: "Tetebatu Village Shop",
					description:
						"Nearby village shops for water, tea, snacks, and basic supplies.",
				},
				{
					name: "Local Farmers Market",
					description:
						"Morning market for fresh fruit, vegetables, and local products.",
				},
				{
					name: "Craft Shops",
					description:
						"Local handicrafts such as wood carving and pottery—small nature-tour souvenirs.",
				},
				{
					name: "ATMs & Money Exchange",
					description:
						"ATMs are limited (often in Tetebatu or Sembalun)—carry enough cash in advance.",
				},
			],
		},
	},
};

export const kesfetDestinationDetailsEn = deepMerge(
	kesfetDestinationDetailsTr,
	kesfetDestinationDetailsEnOverrides,
);
