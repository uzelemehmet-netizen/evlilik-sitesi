export const toursDataEn = {
	bali: {
		name: "Bali Island",
		hero: "/bali-rice-terraces-green.jpg",
		summary:
			"Bali—with its rice terraces, waterfalls, and tropical beaches—is the most comprehensive and most meticulously prepared island in our experience-focused group holiday route.",
		suitableFor: [
			"Nature & Adventure",
			"Sea & Beach Holiday",
			"Cultural Exploration",
			"Wellness & Spa",
		],
		duration: "6 Nights 7 Days",
		concept:
			"Round-trip flights are included in the package up to $750 per person. Because flight prices are highly variable, this cap is fixed; any amount above the cap is paid by the participant.",
		price: "3.699",
		packages: [
			{
				id: "bali-basic",
				level: "temel",
				name: "Bali Discovery Basic",
				badge: "Budget-friendly",
				headline:
					"Entry-level package for those who want to lock in flights, accommodation, and breakfast, and choose all activities optionally.",
				priceMultiplier: 0.7,
				highlights: [
					"Round-trip flight ticket from Istanbul (airline/layover details are shared in writing after booking)",
					"6 nights accommodation in selected hotels in Ubud and the coast area, including breakfast every day at the hotel restaurant",
					"Main transfers airport–hotel–hotel and 24/7 reachable Turkish-language support",
					"All days in the program are free; the guided tour to Tegenungan Waterfall and the Tegalalang rice terraces, the Ubud Monkey Forest visit, the Ayung River rafting day, the full-day boat tour, the ATV Quad Safari on Day 3, and water-sports experiences such as Sea Walker, Jet Ski, and Parasailing on Day 5 are not included in this package; if you wish, you can add these activities as optional extras during booking or on-site at least 24 hours in advance",
				],
				notes:
					"This package provides a fully flexible holiday foundation. The Day 2 guided Ubud tour we describe in the detailed program (Tegenungan Waterfall, Tegalalang rice terraces, Ubud Monkey Forest and other stops during the day), the Day 4 Ayung River rafting & nature day, and the Day 6 full-day boat tour are not included in this package; additionally, water-sports experiences such as the Day 3 ATV Quad Safari and the Day 5 Sea Walker, Jet Ski, and Parasailing are not included in the budget-friendly package. If you wish, you can add all these activities either during booking or on-site at least 24 hours in advance as optional extras. The goal is to lock in flights + accommodation + breakfast, and allow you to choose activities later based on your interests and budget.",
			},
			{
				id: "bali-plus",
				level: "plus",
				name: "Bali Experience Standard",
				badge: "Balanced option",
				headline:
					"A balanced comfort-and-experience level that includes flights, accommodation, breakfast, and the guided activities on Days 2 and 4.",
				priceMultiplier: 0.85,
				highlights: [
					"Round-trip flight ticket from Istanbul",
					"6 nights accommodation in selected hotels in Ubud and the coast area, including breakfast every day at the hotel restaurant",
					"Day 2: nature and experience-focused guided day in and around Ubud is included",
					"Day 4: Ayung River rafting & nature adventure and transfer to the Sanur area are included",
					"On these guided days, lunch at the same restaurant as a group is included",
				],
				notes:
					"The full-day boat tour on Day 6 and free-day activities such as ATV and water sports on Days 3 and 5 are not included in this package; if you wish, they can be added as optional extras during booking or on-site at least 24 hours in advance. The Standard package includes the core experience days (Days 2 and 4) and keeps the other days flexible based on budget and interest.",
			},
			{
				id: "bali-premium",
				level: "premium",
				name: "Bali Experience Premium",
				badge: "Most comprehensive",
				headline:
					"The fully comprehensive package described day-by-day; designed to minimize surprise costs, including flights, rafting, and the full-day boat tour.",
				priceMultiplier: 1,
				highlights: [
					"Round-trip flight ticket from Istanbul",
					"6 nights accommodation in selected upper-segment hotels or boutique properties in Ubud and the coast area, including breakfast every day at the hotel restaurant",
					"Day 2 guided Ubud & surroundings tour, Day 4 Ayung River rafting & nature adventure, and Day 6 full-day boat tour are included",
					"On guided days, group lunches and many extra details specified in the program are included",
				],
				notes:
					"This package is the fully comprehensive version that references the program described day-by-day on the page; flights, guided activities on Days 2 and 4, and the full-day boat tour on Day 6 are included upfront. The full-day boat tour is organized as a private or shared boat depending on group size; if a private boat is preferred, an optional per-person difference may apply. Optional experiences such as the Day 3 ATV Quad Safari and the Day 5 water-sports package are not included; however, Premium guests receive special discounted rates of up to ~25% off the list price; the exact amount is shared in writing before you confirm your selection.",
			},
		],
		itinerary: [
			{
				day: 1,
				title: "Meet at Bali Airport, Hotel Check-in, and Free Time",
				activities: [
					"Flights are planned from Istanbul and included in the package. If you request a different departure city, availability and any price difference will be clarified in writing.",
					"Our team welcomes you at Bali Airport; the tour officially starts here.",
					"Private transfer from the airport to the hotel and check-in",
					"Free time to rest after the journey and get used to the Bali vibe",
				],
				accommodation: "Selected hotel or boutique property in the Ubud area",
			},
			{
				day: 2,
				title: "Ubud & Surroundings – Nature and Experience-Focused Guided Day",
				activities: [
					"08:30 – Departure from the hotel",
					"Nature walk at Tegenungan Waterfall, photo time, and a swim break for those who wish",
					"Short walk and photo break at the Tegalalang rice-terrace viewpoints",
					"Walk and observation in the natural habitat at Ubud Monkey Forest (entrance fee included)",
					"Short break at a local coffee and tea tasting spot around Ubud",
					"Group lunch at the same restaurant; individual menu choice",
					"Free exploration time in Ubud streets and the handicrafts area: cafés, ateliers, and local discovery",
					"17:30 – Return to the hotel; free evening",
				],
				accommodation: "Selected hotel or boutique property in the Ubud area",
			},
			{
				day: 3,
				title: "Free Day – Personal Planning",
				activities: [
					"Accommodation at the scheduled hotel and breakfast at the hotel restaurant are included in the package",
					"Throughout the day you can explore Ubud streets and cafés, visit nearby nature spots, relax by the hotel pool and spa, or shop",
					"Food and beverage expenses at restaurants and cafés outside the hotel are not included; additional guiding and organization can be provided upon request. Guests who wish can join the planned ATV Quad Safari extra activity in the Ubud area after reviewing the content by clicking the optional extra activity card on the side",
				],
				accommodation: "Selected hotel or boutique property in the Ubud area",
				optionalExtras: [
					{
						id: "bali-free-day-ubud-atv",
						title: "Day 3 | Ubud Area – ATV Quad Safari (Optional)",
						shortDescription:
							"An optional paid ATV Quad Safari experience on beginner-friendly routes through Ubud’s rice fields and forest trails.",
						estimatedPricePerPerson: 155,
						priceNote:
							"Depending on package content, around 125–180 USD per person; not included in the tour and offered as an optional extra service.",
						details: [
							"📍 Location: Ubud – Tegalalang / Payangan corridor",
							"⏱ Duration: About 1.5–2 hours of riding (3–4 hours total experience including prep and transfers)",
							"🎒 Level: Suitable for beginner and intermediate participants",
							"👥 Who it’s for: Ideal for young guests, young-at-heart guests, and adrenaline lovers",
							"Riding between rice fields on scenic routes",
							"Progressing on forest trails and natural tracks",
							"Fun sections with muddy areas and small stream crossings in some parts",
							"Safe riding with a professional guide; helmet and basic equipment included",
							"Short safety and usage briefing before the ride",
						],
						notes:
							"This ATV experience is not included in the main tour package; it is fully optional and subject to an additional fee. Prices typically range around 125–180 USD per person depending on the selected route and seasonal demand. For Premium package guests, this activity is offered with special discounted rates of up to ~25% off the list price; the exact amount is shared in writing before you confirm your selection.",
					},
				],
			},
			{
				day: 4,
				title: "Ayung River Rafting & Nature Adventure – Guided Day",
				activities: [
					"08:00 – Departure from the hotel",
					"Rafting experience on the Ayung River for about 2–2.5 hours with 2-person or 4–6-person rafts",
					"A pleasant route with tropical forest views, small waterfalls, and calm-to-moderate currents",
					"Professional guiding, life jacket, helmet, and required safety equipment are included throughout the route",
					"13:30 – 14:30 lunch at a nearby restaurant (as a group; individual menu choice)",
					"15:00 – 16:30 nature walk and photo breaks at panoramic viewpoints",
					"17:30 – Transfer to the hotel in the beachside Sanur area and check-in",
				],
				accommodation: "Selected hotel or resort in the Sanur beach area",
			},
			{
				day: 5,
				title: "Free Day – Beach and Personal Preferences",
				activities: [
					"Accommodation at the scheduled hotel and breakfast at the hotel restaurant are included in the package",
					"You can spend the day with sea, pool, spa, or city exploration in Sanur",
					"Food and beverage expenses at restaurants and cafés outside the hotel are not included. Guiding or private organization requests are arranged individually for an additional fee; guests who wish can join the additional water-sports event planned for the free day after reviewing the content by clicking the optional extra activity card on the side",
				],
				accommodation: "Selected hotel or resort in the Sanur beach area",
				optionalExtras: [
					{
						id: "bali-free-day-watersports",
						title: "Free Day – Extra Sea & Water Sports Experience (Optional)",
						shortDescription:
							"A special optional paid bundle where you can try water sports like Sea Walker, Jet Ski, and Parasailing in Bali’s tropical waters—on the same day.",
						estimatedPricePerPerson: 230,
						priceNote:
							"Depending on the bundle and selected activities, around 210–250 USD per person; not included in the tour and offered as an optional extra service.",
						details: [
							"This day is fully free. Guests who wish can join the Water Sports Experience Package that combines adrenaline and fun in Bali’s tropical seas.",
							"The package is designed for guests who want to enjoy multiple experiences in one day; all activities are carried out with professional teams and safety measures.",
							"Sea Walker (Underwater Walk): With an oxygen helmet, walk on the seabed and observe Bali’s colorful corals and tropical fish up close. Suitable even for non-swimmers. (Duration: about 30 minutes including preparation)",
							"Jet Ski: A guided, controlled, high-tempo jet ski ride in open waters of the Indian Ocean. Short but impactful for adrenaline lovers. (Duration: about 15 minutes)",
							"Parasailing: A memorable experience combining scenery and excitement as you rise above the sea and view Bali’s coastline from above. (Flight time: about 5–7 minutes)",
						],
						note:
							"This package is not included in the tour price. Guests who want to join should inform our guide or operations team at least 24–48 hours in advance for suitable time and availability, or mark it during booking to include it in the package at a discounted rate. For Premium package guests, this water-sports bundle is offered with special discounted rates of up to ~25% off the list price; the exact amount is shared in writing before you confirm your selection.",
					},
				],
			},
			{
				day: 6,
				title: "Full-Day Boat Tour & Island Experience – Guided Day",
				activities: [
					"08:00 – Boarding at the port on the Sanur coast and departure preparations",
					"In the morning, a pleasant boat ride along Bali’s east coast toward nearby islands (e.g., around Nusa Lembongan)",
					"Stops during the day at coral-reef spots suitable for snorkeling and basic diving; chance to observe marine life up close with mask and snorkel",
					"Anchoring in a calm bay for swimming, sunbathing, and photo breaks",
					"For guests who wish: amateur fishing experience on the boat (basic equipment provided)",
					"Lunch on the boat or on a suitable island (included in the tour program)",
					"16:30 – 17:00 sunset experience on the boat or shore and return to Sanur",
					"18:30 – Arrival at the hotel; free evening",
					"The boat day is planned as a private or shared boat depending on group size; if a private boat is preferred, an optional per-person difference may apply",
				],
				accommodation: "Selected hotel or resort in the Sanur beach area",
			},
			{
				day: 7,
				title: "Free Time, Transfer to Bali Airport, and Return",
				activities: [
					"Breakfast",
					"Free time in Sanur or nearby areas depending on flight time",
					"If suitable, a small farewell meetup / celebration at a stylish café near the beach",
					"Hotel check-out and transfer to Bali Airport",
					"The tour program ends at Bali Airport; all flights and layover processes after this point are the guest’s responsibility.",
				],
				accommodation: "-",
			},
		],
		activities: [
			{
				category: "Beach & Water Sports",
				items: [
					"Surf lessons and wave spots",
					"Swimming at snorkeling areas and coral reefs",
					"Full-day boat tour and island visits",
					"Stand-up paddle and sea activities",
					"Beach clubs and sunset experiences",
				],
			},
			{
				category: "Culture & History",
				items: [
					"Ancient temple tours",
					"Traditional dance performances",
					"Art galleries",
					"Local market visits",
					"Balinese cuisine workshop",
				],
			},
			{
				category: "Nature & Adventure",
				items: [
					"Tegenungan Waterfall and nature walks",
					"Body rafting and canyon track experience",
					"Scenic walks through forests and village roads",
					"Cycling and light trekking routes",
					"Ubud Monkey Forest and wildlife observation",
				],
			},
			{
				category: "Wellness & Spa",
				items: [
					"Balinese massage",
					"Yoga sessions",
					"Spa treatments",
					"Meditation",
					"Wellness center",
				],
			},
		],
		about: {
			nature:
				"Bali is a natural wonder: green rice terraces, volcanoes, magnificent waterfalls, and crystal-clear beaches. Thanks to its tropical climate, the island stays lush year-round and stands out with palm trees, exotic flowers, and rich vegetation.",
			culture:
				"A living museum of Hindu culture, Bali has a mystical atmosphere with thousands of temples, daily offerings, and traditional ceremonies. The Balinese passion for art, dance, and music can be felt everywhere on the island.",
			lifestyle:
				"Time flows differently in Bali. Yoga in the mornings, beaches and spa during the day, sunsets and great food in the evenings… The island is a perfect destination both for those seeking peace and for adventure lovers.",
		},
		included: [
			"All packages: round-trip flight ticket from Istanbul (included up to $750 per person; because flight prices are variable, the cap is fixed; any excess is paid by the participant)",
			"All packages: 6 nights accommodation in selected hotels and breakfast every day at the hotel restaurant",
			"All packages: main transfers airport–hotel–hotel and 24/7 reachable Turkish-language support",
			"Standard and Premium packages: guided-day trips and group services included in the program",
			"Standard and Premium packages: Day 2 nature and experience-focused guided Ubud & surroundings tour",
			"Standard and Premium packages: Day 4 Ayung River rafting experience (raft, equipment, and professional guiding included)",
			"Premium package only: Day 6 full-day boat tour and island visits",
			"Standard and Premium packages: lunches on guided days at a restaurant selected by us (guests can choose any dish from the menu)",
		],
		notIncluded: [
			"For the Basic package: the guided days and all activities described in the detailed program are not included in this price; this includes the Day 2 guided Ubud tour (Tegenungan Waterfall, Tegalalang rice terraces, Ubud Monkey Forest and other stops), the Day 4 Ayung River rafting & nature day, the Day 6 full-day boat tour, the Day 3 ATV Quad Safari, and the Day 5 water-sports packages such as Sea Walker, Jet Ski, and Parasailing; these experiences are planned as optional extras if requested",
			"For the Standard package: the Day 6 full-day boat tour, the water-sports bundle, and other extra activities on free days (charged additionally based on participation)",
			"All packages: dinners and any food & beverage expenses chosen outside the hotel scope on free days",
			"All packages: personal expenses, spa, massage, and extra services based on individual preferences",
			"All packages: optional extra activities such as the Day 3 ATV Quad Safari and the Day 5 sea & water-sports bundle (discounted rates apply for Premium guests, but activities joined are paid additionally)",
			"Indonesia/Bali tourist tax and official entry fees are not included in this tour package; before arriving in Bali, you must pay the tourist tax online by credit card via https://lovebali.baliprov.go.id (the official website of the Bali Provincial Government) and show the barcode sent to your phone to the authorities at Bali Airport.",
			"The international departure fee paid when leaving Turkey is paid by the participant and is not included in this package.",
		],
		notes: {
			approach:
				"This route is an experience-focused group holiday organization designed with the Premium package as the reference. Round-trip flights are included in the package up to $750 per person. Because flight prices are highly variable, this cap is fixed; any amount above the cap is paid by the participant and is clearly communicated before payment. Accommodation and breakfast are fixed. In Standard and Premium packages, guided activities on Days 2 and 4 are included; in the Premium package, the full-day boat tour on Day 6 is also included. For other meals and optional activities, guests may choose either the hotel restaurant or different venues and experiences outside. This creates a transparent structure where you can manage your budget by deciding how much to spend on what.",
			freeTime:
				"Free time blocks are intentionally kept flexible so participants can move according to their own taste, budget, and pace. For dinners and meals on free days, you may choose from the hotel restaurant menu or explore new places outside. Food and beverage expenses at restaurants and cafés outside the hotel are not included; if requested, our guide and team support you with restaurant and venue suggestions.",
			discipline:
				"For the program to run smoothly and pleasantly, respect for group order, punctuality, and mutual courtesy are essential. Avoiding behaviors that disrupt group harmony is important for everyone to have a peaceful and unforgettable holiday.",
		},
		routes: [
			{ name: "Seminyak Beach", description: "Stylish beach clubs and sunset" },
			{ name: "Ubud", description: "The center of art, culture, and nature" },
			{ name: "Tanah Lot", description: "Iconic temple in the ocean" },
			{ name: "Uluwatu", description: "Clifftop temple and Kecak dance" },
			{ name: "Tegalalang", description: "Famous rice terraces" },
			{ name: "Nusa Dua", description: "Luxury resorts and white sand" },
		],
		gallery: [
			"/bali-rice-terraces-green.jpg",
			"/tanah-lot-temple-sunset-ocean.jpg",
			"/bali-beach-seminyak-palm-trees.jpg",
			"/ubud-monkey-forest-bali.jpg",
			"/bali-traditional-dance-kecak.jpg",
			"/bali-luxury-pool-villa.jpg",
		],
	},
	lombok: {
		name: "Lombok Island",
		hero: "/lombok-island-beach-mountain-panoramic.jpg",
		summary:
			"Bali’s calm and authentic sister, Lombok, is a paradise for adventure and nature lovers with untouched white-sand beaches, the magnificent Mount Rinjani volcano, and turquoise waters. The crystal-clear sea of the Gili Islands, surf-paradise beaches in the south, and waterfalls in the north come together on this route.",
		suitableFor: [
			"Nature & Adventure",
			"Sea & Beach Holiday",
			"Surf",
			"Trekking",
			"Honeymoon",
			"Friends Group",
		],
		duration: "6 Nights 7 Days",
		concept:
			"Round-trip flights are included in the package up to $750 per person. Because flight prices are highly variable, this cap is fixed; any amount above the cap is paid by the participant.",
		price: "3.299",
		packages: [
			{
				id: "lombok-basic",
				level: "temel",
				name: "Lombok Discovery Basic",
				badge: "Budget-friendly",
				headline:
					"Entry-level package for those who want to lock in flights and accommodation and add Gili, waterfalls, and south beach tours later based on preference.",
				priceMultiplier: 0.7,
				highlights: [
					"Round-trip flight ticket from Istanbul (airline/layover details are shared in writing after booking)",
					"Total 6 nights accommodation: first 3 nights in Senggigi beach area, last 3 nights around Kuta Lombok in selected hotels or boutique properties; daily breakfast included",
					"Main transfers airport–hotel–hotel and 24/7 reachable Turkish-language support",
					"Gili Islands boat tour, Senaru waterfalls day, and south beaches & surf tours are not included; if you wish, they can be added as optional extras during booking or on-site at least 24 hours in advance",
				],
				notes:
					"This package secures the flight and accommodation backbone in Lombok; day tours are kept flexible so you can add them later based on budget and interest. Detailed tours such as the Gili Islands boat tour, Senaru waterfalls, and the south beaches & surf day are not included in the Basic package, but can be planned individually or as a bundle upon request.",
			},
			{
				id: "lombok-plus",
				level: "plus",
				name: "Lombok Experience Standard",
				badge: "Balanced option",
				headline:
					"A balanced experience level for those who want to include the Gili Islands boat tour and the south beaches & surf day, while keeping other days more flexible.",
				priceMultiplier: 0.85,
				highlights: [
					"In addition to flights, 6 nights accommodation and breakfast, one full-day Gili Islands boat tour is included",
					"On the Gili day, snorkel gear, a basic island bike ride, and group lunch at a designated restaurant on the island are included",
					"A guided day including South Lombok beaches (Tanjung Aan, Selong Belanak, etc.) and a light surf try-out is included",
					"Additional boat tours like the Pink Beach boat tour are not included; they can be added as optional extras on your free days in Kuta or Senggigi",
				],
				notes:
					"The Standard package includes the heart of the Lombok experience: the Gili day and the south beaches & surf day. This way, you have a full program one day on the northwest islands and one day on the southern coasts, while keeping free days in between for rest and flexible planning around Senggigi and Kuta. Tours like the Pink Beach boat tour can be planned as optional extras on your free days.",
			},
			{
				id: "lombok-premium",
				level: "premium",
				name: "Lombok Experience Premium",
				badge: "Most comprehensive",
				headline:
					"A fully comprehensive Lombok package that minimizes surprise costs, including the Gili boat tour, Senaru waterfalls & Mount Rinjani viewpoints, and the south beaches & surf day.",
				priceMultiplier: 1,
				highlights: [
					"Round-trip flight ticket from Istanbul",
					"6 nights accommodation in selected upper-segment hotels or boutique properties in Senggigi and Kuta Lombok; daily breakfast included",
					"One full-day Gili Islands boat tour (snorkel stops, Gili Trawangan & Gili Air combo, group lunch included)",
					"Full-day nature tour including the Sendang Gile & Tiu Kelep waterfall hike in Senaru and Mount Rinjani viewpoints (included)",
					"A guided day including South Lombok beaches (Tanjung Aan, Selong Belanak, Mawun, etc.) and a beginner-level surf try-out is included",
				],
				notes:
					"The Premium package combines Lombok’s northern waterfalls and Rinjani views, the western Senggigi coasts, the turquoise sea of the Gili islands, and the southern surf beaches in a single flow. The Gili, Senaru, and south beaches & surf days are included upfront; more specific experiences like the Pink Beach boat tour or advanced surf/diving are planned as optional extras—especially on your free day in Kuta.",
			},
		],
		itinerary: [
			{
				day: 1,
				title: "Arrival in Lombok, Transfer to Senggigi, and Sunset",
				activities: [
					"Flight from Istanbul to Lombok Airport (Praya); layover and airline details are shared in writing after booking",
					"Welcome at Lombok Airport and private transfer to the Senggigi area on the west coast",
					"Check-in and settle in at a selected hotel or boutique property near the beach",
					"Late afternoon sunset walk on Senggigi beach, light acclimatization, and rest",
					"Optional: dinner at local restaurants along the beach (meals are not included)",
				],
				accommodation: "Selected hotel or boutique property in the Senggigi beach area",
			},
			{
				day: 2,
				title: "Gili Islands – Snorkeling and Island Tour (Guided Day)",
				activities: [
					"After breakfast, a short transfer from Senggigi to the boat pier",
					"Boat ride to Gili Trawangan; snorkeling and swimming breaks around the island",
					"Observe marine life with mask & snorkel at spots where you may see sea turtles",
					"Free time in Gili Trawangan for a short bike ride around the island and coffee breaks",
					"Around lunchtime: group lunch at a beachfront restaurant on Gili Air or the designated island (included in Standard and Premium packages)",
					"Near sunset: photo and rest break at swing spots",
					"Late afternoon boat return to Senggigi and transfer to the hotel",
				],
				accommodation: "Selected hotel or boutique property in the Senggigi beach area",
			},
			{
				day: 3,
				title: "Free Day – Personal Preferences in and around Senggigi",
				activities: [
					"After breakfast, you can explore Senggigi beach and surroundings at your own pace",
					"Free time for beach walks, sea and hotel pool relaxation, local cafés, and massage & spa centers",
					"Optional activities such as diving or extra snorkeling tours around the Gilis can be planned upon request",
					"For the evening, a local cuisine experience, sunset bars, or a calm beach walk is recommended (meals are not included)",
				],
				accommodation: "Selected hotel or boutique property in the Senggigi beach area",
				optionalExtras: [
					{
						id: "lombok-gili-diving",
						title: "Diving Experience in the Gili Islands (Optional)",
						shortDescription:
							"A 1- or 2-dive package with certified dive centers on the reefs around the Gilis; beginner or advanced options.",
						estimatedPricePerPerson: 180,
						priceNote:
							"Around 150–210 USD per person depending on the number of dives and equipment needs; not included in the tour and offered as an optional diving package.",
						details: [
							"📍 Location: Gili Trawangan and surrounding dive sites",
							"⏱ Package options: 1 or 2 tank dives (near half-day experience including prep and boat)",
							"🎒 Level: discovery dive for beginners; deeper reef options for certified divers",
							"All technical equipment, dive instructor, and safety briefing are included",
							"Free time on the island after diving and a chance to relax by the sea",
						],
						note:
							"This diving package is not included in the tour price. To reserve appropriate time and availability, guests who want to join must notify at least 48 hours in advance. Premium package guests receive special discounted rates of around 20–25% off the list price; the exact amount is shared in writing before you confirm your selection.",
					},
				],
			},
			{
				day: 4,
				title: "Senaru Waterfalls & Mount Rinjani Views – Transfer of Stay to Kuta",
				activities: [
					"After breakfast, a panoramic drive from Senggigi northward toward the Senaru area",
					"Short forest walk to Sendang Gile waterfall and photo breaks",
					"A slightly more energetic hike to Tiu Kelep waterfall with stream crossings and an optional swim break",
					"Around lunchtime: scenic lunch at a local restaurant near Senaru (included in Premium packages)",
					"Short stops at viewpoints where you can see the silhouette of Mount Rinjani",
					"In the afternoon: drive toward the southern coasts and arrive in the Kuta Lombok area",
					"In the evening: check-in at a selected hotel or boutique property around Kuta",
				],
				accommodation: "Selected hotel or boutique property in the Kuta Lombok area",
			},
			{
				day: 5,
				title: "Free Day – Personal Preferences in and around Kuta",
				activities: [
					"After breakfast, you can explore Kuta Lombok and surroundings at your own pace",
					"Free time for cafés, beach bars, boutique shops, and massage & spa centers",
					"Optional: Pink Beach and southeast coves boat tour or extra surf/paragliding experiences can be planned upon request",
					"For the evening, a local cuisine experience, sunset bars, or a calm beach walk is recommended (meals are not included)",
				],
				accommodation: "Selected hotel or boutique property in the Kuta Lombok area",
				optionalExtras: [
					{
						id: "lombok-pink-beach-boat",
						title: "Pink Beach & Southeast Coves Boat Tour (Optional)",
						shortDescription:
							"A full-day boat tour including swimming, snorkeling, and scenic stops at Lombok’s pink-sand beaches and turquoise coves in the southeast.",
						estimatedPricePerPerson: 210,
						priceNote:
							"Around 180–260 USD per person depending on boat type and group size; not included in the tour and offered as an optional boat tour.",
						details: [
							"📍 Location: Lombok’s southeast coasts and around Pink Beach",
							"Early morning transfer from Kuta to the port and boarding",
							"Multiple swimming and snorkeling breaks in different coves during the day",
							"Photo break and free time at Pink Beach",
							"Light lunch on the boat or beach (may be included depending on package)",
							"Late afternoon return to Kuta and transfer to the hotel",
						],
						note:
							"The Pink Beach boat tour is not included in the tour price. Guests who want to join should notify at least 48 hours in advance so the exact time and day can be set based on sea and weather conditions. Premium package guests may receive around ~20% discount off the list price; the exact amount is shared in writing before you confirm your selection.",
					},
				],
			},
			{
				day: 6,
				title: "South Lombok Beaches & Light Surf Experience – Guided Day",
				activities: [
					"After breakfast, departure from Kuta center",
					"Photo and swimming breaks at Tanjung Aan and nearby bays",
					"Basic surf lesson and wave try-outs at a beginner-friendly beach such as Selong Belanak (included in Standard and Premium packages)",
					"Lunch and rest break at a beachfront restaurant",
					"Near sunset: swimming and scenic break at hidden bays like Mawun",
					"Late afternoon return to the hotel in Kuta; free evening",
				],
				accommodation: "Selected hotel or boutique property in the Kuta Lombok area",
			},
			{
				day: 7,
				title: "Free Time, Transfer to the Airport, and Return",
				activities: [
					"Breakfast and short free time in Kuta or nearby depending on your flight time",
					"Hotel check-out and private transfer to Lombok Airport",
					"If suitable, a short farewell coffee or snack at a café near the beach before heading to the airport",
					"The tour program ends at Lombok Airport; all flights and layover processes after this point are the guest’s responsibility",
				],
				accommodation: "-",
			},
		],
		activities: [
			{
				category: "Beach & Water Sports",
				items: [
					"Beginner and intermediate surf lessons in South Lombok",
					"Snorkeling around the Gili Islands and swimming with sea turtles",
					"Boat tours around Pink Beach and nearby",
					"Stand-up paddle and canoe experiences",
					"Sunset beach walks and beach bars",
				],
			},
			{
				category: "Nature & Adventure",
				items: [
					"Nature hikes to Sendang Gile and Tiu Kelep waterfalls",
					"Mount Rinjani viewpoints and photo stops",
					"Bike tours on rural village roads",
					"Exploration routes around Pink Beach",
					"Short treks to rock formations and hidden coves",
				],
			},
			{
				category: "Cultural Experiences",
				items: [
					"Visit to a Sasak village and seeing traditional houses up close",
					"Observing handicraft textile and sarong production at local weaving workshops",
					"Visits to coffee and spice farms",
					"Traditional Lombok cuisine and seafood at beach restaurants",
					"Local markets and handicraft shopping",
				],
			},
		],
		about: {
			nature:
				"Lombok is a nature paradise with untouched white-sand beaches and crystal-clear seas stretching under the shadow of the magnificent Mount Rinjani volcano. Pink Beach’s pink sand, the Gili Islands’ turquoise waters, and the northern waterfalls create a powerful combination for adventure and scenery lovers.",
			culture:
				"Home to the Sasak people, Lombok offers cultural richness with traditional weaving arts, distinctive architecture, and authentic villages. Compared to Bali, the island is calmer and less touristic, giving you a chance to observe local life in a more raw and natural form.",
			lifestyle:
				"Lombok has world-renowned southern beaches for surf enthusiasts, and trekking and waterfall routes in the north for nature lovers. It’s one of the rare islands that has largely preserved its authenticity—where you can spend the day close to the sea in the Gilis and relax in the evenings in a quiet coastal town.",
		},
		included: [
			"All packages: round-trip flight ticket from Istanbul (included up to $750 per person; because flight prices are variable, the cap is fixed; any excess is paid by the participant)",
			"All packages: 6 nights accommodation in selected hotels or boutique properties in Senggigi and/or Kuta Lombok, and daily hotel breakfast",
			"All packages: transfers Lombok Airport–hotel–hotel and 24/7 reachable Turkish-language support",
			"Standard and Premium packages: one full-day Gili Islands boat tour (as per the program content)",
			"Standard and Premium packages: one guided day including south beaches & surf experience",
			"Premium package only: full-day nature tour including Senaru waterfalls and Mount Rinjani viewpoints, plus lunch as specified in the program",
		],
		notIncluded: [
			"For the Basic package: the Gili Islands boat tour, the Senaru waterfalls day, and the south beaches & surf tours are not included; planned as optional extras upon request",
			"For the Standard package: experiences like the Senaru waterfalls & Mount Rinjani viewpoint tour and the Pink Beach boat tour are not included",
			"All packages: dinners and any food & beverage expenses outside the hotel scope on free days",
			"All packages: personal expenses, spa, massage, and extra services based on individual preferences",
			"All packages: optional extra activities such as diving, advanced surf, and the Pink Beach boat tour (charged additionally based on participation)",
			"Tourist taxes and official entry fees for the Indonesia/Lombok region (if applicable) are not included; current practices and payment methods are shared with you in writing",
			"The international departure fee paid when leaving Turkey is paid by the participant and is not included in this package.",
		],
		notes: {
			approach:
				"This route is an experience-focused Lombok holiday designed with the Premium package as the reference. Round-trip flights are included in the package up to $750 per person. Because flight prices are highly variable, this cap is fixed; any amount above the cap is paid by the participant and is clearly communicated before payment. Accommodation and breakfast are fixed. In Standard and Premium packages, the Gili boat tour and the south beaches & surf day are included; in the Premium package, the Senaru waterfalls & Mount Rinjani viewpoints tour is also included upfront. For other meals and optional activities, guests can choose based on their own budget and interests.",
			freeTime:
				"Free time blocks are intentionally preserved so you can find your own rhythm in Lombok. Especially for evenings around Kuta Lombok and Senggigi, there is no mandatory fixed restaurant; you can choose local warungs along the beach or more stylish restaurants and cafés. Food and beverage expenses outside the hotel are not included; if requested, our team supports you with venue and activity recommendations suitable for the area.",
			discipline:
				"For the program to run smoothly and pleasantly, respect for group order, punctuality, and mutual courtesy are essential. Following safety instructions is especially important in activities such as boat tours, waterfall hikes, and surf lessons. Avoiding behaviors that disrupt group harmony is critical for everyone to have a peaceful and unforgettable holiday.",
		},
		routes: [
			{
				name: "Gili Trawangan",
				description: "Lively island life, snorkeling, and sunset points",
			},
			{
				name: "Gili Air",
				description: "A balance of local life and calm beach atmosphere",
			},
			{
				name: "Kuta Lombok",
				description: "Southern beaches, surf spots, and a bohemian vibe",
			},
			{
				name: "Senaru & Waterfalls",
				description:
					"Sendang Gile and Tiu Kelep waterfalls, Mount Rinjani viewpoints",
			},
			{ name: "Pink Beach", description: "Pink sand and turquoise coves in the southeast" },
			{ name: "Senggigi", description: "Sunset beaches and cafés on the west coast" },
		],
		gallery: [
			"/gili-islands-turquoise-water-beach.jpg",
			"/lombok-rinjani-volcano-mountain.jpg",
			"/lombok-beach-surfing-waves.jpg",
			"/placeholder.svg?height=600&width=900",
			"/placeholder.svg?height=600&width=900",
			"/placeholder.svg?height=600&width=900",
		],
	},
	sumatra: {
		name: "Sumatra Island",
		hero: "/sumatra-rainforest-orangutan-lake-toba.jpg",
		summary:
			"Wild and untouched North Sumatra promises a real adventure with rainforests that are the natural habitat of orangutans (Bukit Lawang) and the world’s largest volcanic lake, Lake Toba (Samosir Island). After long overland travel days, rest and free-time blocks are intentionally preserved so the pace stays more sustainable.",
		suitableFor: [
			"Nature & Adventure",
			"Cultural Exploration",
			"Wildlife",
			"Photography",
		],
		duration: "8 Nights 9 Days",
		concept: "Nature & Adventure",
		price: "3.499",
		packages: [
			{
				id: "sumatra-basic",
				level: "temel",
				name: "Sumatra Discovery Basic",
				badge: "Budget-friendly",
				headline:
					"Entry-level package for those who want to lock in flights + accommodation, and add trekking, culture day, and some experiences later based on budget/interest.",
				priceMultiplier: 0.7,
				highlights: [
					"Round-trip flight ticket from Istanbul (included up to $750 per person; because flight prices are variable, the cap is fixed; any excess is paid by the participant)",
					"Total 8 nights accommodation: Medan (1 night) + Bukit Lawang (3 nights) + Samosir/Lake Toba (4 nights)",
					"Airport and main route transfers + ferry crossing and 24/7 reachable Turkish-language support",
					"Arrival-day short sunset boat tour (Samosir) included (may be moved to Day 6 depending on weather/ferry conditions)",
					"Orangutan trekking & tubing and the Batak culture day are not included; can be planned as optional extras if desired",
				],
				notes:
					"The Basic package secures the logistics backbone of the Sumatra route (flights + accommodation + main transfer flow). Trekking, the culture day, and optional tours can be added later based on your budget.",
			},
			{
				id: "sumatra-plus",
				level: "plus",
				name: "Sumatra Experience Standard",
				badge: "Balanced option",
				headline:
					"A balanced experience level for those who want to include the orangutan trekking & tubing day and keep the other days more flexible.",
				priceMultiplier: 0.85,
				highlights: [
					"In addition to flights, 8 nights accommodation and breakfast, the Day 3 orangutan trekking & tubing experience (guided) is included",
					"Airport and main route transfers + ferry crossing and 24/7 reachable Turkish-language support",
					"Arrival-day short sunset boat tour (Samosir) included (may be moved to Day 6 depending on weather/ferry conditions)",
					"Extra tours such as Tele Observation Tower / panorama tour are not included; can be added optionally on free days",
					"The Batak culture & island tour is not included; can be planned as an optional extra if desired",
				],
				notes:
					"The Standard package includes upfront the strongest day of the Sumatra experience: orangutan trekking & river day. On the Lake Toba/Samosir side, free time blocks are preserved; extra panorama tours are planned upon request.",
			},
			{
				id: "sumatra-premium",
				level: "premium",
				name: "Sumatra Experience Premium",
				badge: "Most comprehensive",
				headline:
					"Includes trekking + culture day; a full Sumatra experience designed to minimize surprise costs.",
				priceMultiplier: 1,
				highlights: [
					"Round-trip flight ticket from Istanbul (included up to $750 per person; because flight prices are variable, the cap is fixed; any excess is paid by the participant)",
					"8 nights accommodation in Medan, Bukit Lawang, and Samosir/Lake Toba areas (per program flow)",
					"Airport and main route transfers + ferry crossing and 24/7 reachable Turkish-language support",
					"Day 3 orangutan trekking & tubing experience (guided) included",
					"Batak culture & island tour (around Samosir) included (flow may be adjusted based on field conditions)",
				],
				notes:
					"The Premium package reduces planning effort by including trekking and cultural exploration blocks upfront. Optional extra experiences (private tours/extra activities) can be added upon request on free days.",
			},
		],
		itinerary: [
			{
				day: 1,
				title: "Arrival in Medan & City Introduction",
				activities: [
					"Our tour program starts here.",
					"Arrival in Medan based on your flight plan; welcome at the airport and brief orientation for the day’s flow.",
					"Transfer to the hotel (~45–60 min) and check-in; rest to shake off travel fatigue.",
					"If time and energy allow, a short city introduction: around Maimun Palace and the Grand Mosque (light pace, photo breaks).",
					"Evening: free time (dine at your own rhythm with local restaurant suggestions).",
				],
				accommodation: "JW Marriott Medan (5⭐)",
			},
			{
				day: 2,
				title: "Medan → Bukit Lawang (Gateway to Gunung Leuser) | Semi-Free",
				activities: [
					"08:30 – Check-out from the hotel in Medan and depart (times may flex with traffic).",
					"Overland transfer ~3.5–4.5 hours: a route with palm groves, village roads, and natural scenery.",
					"Around 13:00 arrival in Bukit Lawang, hotel check-in and rest (there may be a wait depending on room readiness).",
					"Light walk along the Bohorok River: village center, riverside, and photo points.",
					"Trekking briefing: national park rules, safety, and gear suggestions (closed shoes, rain jacket, leech socks, etc.).",
					"Evening: free time (light dinner + early rest recommended for the next day).",
				],
				accommodation: "Ecolodge Bukit Lawang (Boutique)",
			},
			{
				day: 3,
				title: "Bukit Lawang | Orangutan Trekking & River Experience (Activity Day)",
				activities: [
					"08:00 – Meet the guide and do orangutan observation trekking around Gunung Leuser (approx. 3–5 hours; fitness: moderate).",
					"Wildlife observation during the trek: gibbons, Thomas leaf monkeys, and tropical bird species; keep a safe distance from animals.",
					"Afternoon tubing on the Bohorok River: safe route depending on current; follow life-jacket/guide recommendations.",
					"Optional short exploration for those who wish: Bat Cave – flashlight and local guide recommended.",
					"Evening: rest by the river and free time (with jungle sounds).",
				],
				accommodation: "Ecolodge Bukit Lawang (Boutique)",
			},
			{
				day: 4,
				title: "Bukit Lawang | Free Day (Rest + Optional Extra Experiences)",
				activities: [
					"Free day: catch up on sleep, relax by the river, café breaks, and short walks at your own pace.",
					"Village center exploration: local shops, riverside walkways, and photo points.",
					"Optional (paid) ideas: short waterfall walk / rafting / extra tubing route (depending on season and water levels).",
					"If you wish, our team can help you plan times and logistics for paid optional tours based on your interests.",
				],
				optionalExtras: [
					{
						id: "sumatra-bukitlawang-tangkahan-elephants",
						title: "Day 4 | Tangkahan Elephant Camp & River Scenery (Optional)",
						shortDescription:
							"A day trip from Bukit Lawang to the Tangkahan area for a nature experience around the elephant camp and river landscapes (optional and paid).",
						priceNote:
							"Not included; price varies based on the number of people, vehicle type, and season. The exact fee is clarified during booking.",
						details: [
							"📍 Location: Tangkahan (North Sumatra)",
							"⏱ Duration: Full day (including transfers; early departure recommended)",
							"Content: nature walk / riverside exploration / brief info about conservation projects",
							"Note: The program may change depending on on-site conditions and current local practices",
						],
						note:
							"This tour is a good alternative for guests who want a calmer and different nature atmosphere; it offers a more balanced day plan rather than an exhausting trek.",
					},
				],
				accommodation: "Ecolodge Bukit Lawang (Boutique)",
			},
			{
				day: 5,
				title: "Bukit Lawang → Lake Toba (Samosir Island) | Semi-Free",
				activities: [
					"08:00 – Check-out from the hotel in Bukit Lawang and depart toward Lake Toba.",
					"Overland transfer ~5–6.5 hours (depending on traffic/rain); short breaks and scenic stops en route.",
					"Parapat to Samosir (Tuk-Tuk) ferry ~45–60 min; scenic lake crossing.",
					"16:30–18:00 – Arrival in Samosir, hotel check-in and rest.",
					"Evening: lakeside walk + sunset; free dinner.",
					"Arrival-day short sunset boat tour (60–90 min) is included in the tour package; if there is weather/ferry delay, it may be moved to Day 6.",
				],
				accommodation: "Toledo Inn Lake Toba (4⭐)",
			},
			{
				day: 6,
				title: "Samosir | Free Day (Rest + Lake Time)",
				activities: [
					"Free day: relax by the lake, café breaks, and calm walks to soak in the Samosir atmosphere.",
					"Swimming in safe areas or free time around the pier (depending on season/local advice).",
					"Flexible day with light activities like a short bike ride (around Tuk-Tuk) or canoeing.",
					"Paid optional tours are listed in the cards below.",
				],
				optionalExtras: [
					{
						id: "sumatra-samosir-tele-aek-pano",
						title: "Day 6 | Tele Observation Tower + Aek Tano Ponggol Panorama Tour (Optional)",
						shortDescription:
							"A day route including the Tele viewpoint for a 360° view of Lake Toba and the Aek Tano Ponggol photo stop (optional and paid).",
						priceNote:
							"Not included; price varies by vehicle type and number of people. The exact fee is shared during booking.",
						details: [
							"⏱ Duration: About 5–7 hours (depending on time at stops)",
							"📸 Content: Tele panoramic viewpoint + Aek Tano Ponggol bridge photo stop",
							"Suitability: Light pace – a scenery-focused day",
							"Note: Weather can affect the view; a flexible plan is recommended",
						],
					},
				],
				accommodation: "Toledo Inn Lake Toba (4⭐)",
			},
			{
				day: 7,
				title: "Samosir: Batak Culture & Lake Activities (Activity Day)",
				activities: [
					"08:30 – Short introduction walk in the Tuk-Tuk area: lakeshore, piers, and the rhythm of daily life.",
					"09:30 – Cultural Village Visit: guide narration on traditional Batak house architecture, key rituals, and lifestyle.",
					"11:00 – Batak king tombs and stone monuments: photo + storytelling at historical stops (short and smooth route).",
					"12:30 – Lunch break with lake view: individual menu choice (whether included depends on package selection).",
					"14:00 – Samosir bike tour (2–3 hours): an easy route adapted to the group pace with stops at viewpoints.",
					"16:30 – Free time: swimming in safe areas or canoeing; café breaks for those who wish.",
					"Around 20:15 – Traditional Batak dance show on available days: watch the music/dance culture on-site (depending on schedule).",
				],
				accommodation: "Toledo Inn Lake Toba (4⭐)",
			},
			{
				day: 8,
				title: "Samosir → Medan | Rest and Free Evening (Relaxed Day After Travel)",
				activities: [
					"09:30 – Check-out from the hotel in Samosir; start return to Medan via ferry + overland.",
					"Total travel ~4–5.5 hours (depending on traffic/ferry times); short breaks are planned.",
					"15:00–16:30 – Arrival in Medan, hotel check-in and rest.",
					"Evening: free time (last shopping / dining suggestions; early rest recommended for next day’s flight).",
				],
				accommodation: "JW Marriott Medan (5⭐)",
			},
			{
				day: 9,
				title: "Farewell, Sumatra",
				activities: [
					"Breakfast and check-out depending on flight time (usually leaving the hotel 3–4 hours before the flight).",
					"Transfer to Medan Airport (KNO) ~45–90 min; allow time for check-in and passport procedures.",
					"Return flight to Istanbul.",
					"Our tour program ends here.",
				],
				accommodation: "-",
			},
		],
		activities: [
			{
				category: "Wildlife",
				items: [
					"Guided orangutan observation trekking (around Gunung Leuser)",
					"Gibbons and Thomas leaf monkey observation",
					"Birdwatching and nature photography",
				],
			},
			{
				category: "Nature Experiences",
				items: [
					"Rainforest walks (1-day route)",
					"Bohorok River tubing",
					"Swimming (in safe areas) and canoeing at Lake Toba",
					"Tele panoramic viewpoints",
				],
			},
			{
				category: "Cultural Exploration",
				items: [
					"Batak cultural villages and traditional houses",
					"Traditional Batak dance show (depending on available days)",
					"Handicrafts and local markets",
					"Sumatra cuisine experience (local restaurant suggestions)",
				],
			},
		],
		about: {
			nature:
				"Sumatra is one of the world’s most biodiverse islands. The rainforests of Gunung Leuser National Park are home to endangered orangutans, as well as tigers and elephants. Lake Toba, the world’s largest volcanic lake, offers stunning scenery.",
			culture:
				"The unique architecture, music, and traditions of the Batak people make Sumatra culturally rich. Traditional houses, ceremonies, and flavors that attract gastronomy lovers are among the island’s highlights.",
			lifestyle:
				"Sumatra is ideal for those who want to experience authentic, non-touristic life. It offers a wide range of experiences—from jungle trekking to lakeside relaxation, wildlife observation to discovering local culture.",
		},
		routes: [
			{
				name: "Bukit Lawang",
				description: "Orangutan trekking, Bat Cave, and Bohorok River tubing",
			},
			{
				name: "Gunung Leuser NP",
				description: "UNESCO World Heritage rainforest ecosystem",
			},
			{
				name: "Lake Toba",
				description: "UNESCO Global Geopark – volcanic lake panoramas",
			},
			{
				name: "Samosir (Tuk-Tuk)",
				description: "Bike tour, Batak villages, and lake activities",
			},
			{ name: "Tele Observation Tower", description: "360° panoramic viewpoint" },
			{ name: "Aek Tano Ponggol", description: "Bridge and photo spot" },
		],
		gallery: [
			"/sumatra-rainforest-orangutan-lake-toba.jpg",
			"/ernests-vaga-mzJFI9o5_zc-unsplash.jpg",
			"/placeholder.jpg",
			"/placeholder.jpg",
			"/placeholder.jpg",
			"/placeholder.jpg",
		],
	},
	java: {
		name: "Java Island",
		hero: "/java-borobudur-temple-volcano-sunrise.jpg",
		summary:
			"Experience Java not as a classic ‘single-city tour’, but as a comfortable road trip that starts in Jakarta and stretches to the highlands of Bandung, the rivers & canyons of Pangandaran, and the cultural routes of Yogyakarta—offering very different atmospheres with just a few accommodation hubs.",
		suitableFor: [
			"Road Trip",
			"Cultural Exploration",
			"Nature & Adventure",
			"Photography",
			"City Tour",
		],
		duration: "10 Nights 11 Days",
		concept: "Road Trip & Cities",
		price: "3.199",
		notes: {
			freeTime:
				"Free days are intentionally kept flexible so you can explore the city at your own rhythm and freely plan shopping and café/restaurant time. If you wish, optional stops and experiences can be added to these periods.",
			discipline:
				"For the program to run smoothly, punctuality and respect for group order are essential. Following safety briefings and guide directions is expected. Important information note (please read): This Java tour includes a long overland journey aside from short route transitions. For this reason, it is not recommended for families with small children, guests over 50, people who dislike long road travel, or people whose holiday expectations are mainly water sports/adrenaline/nightclubs. This tour is designed for guests who enjoy long journeys, value nature tourism and historical/cultural visits, and are open to learning new cultures.",
		},
		packages: [
			{
				id: "temel",
				level: "temel",
				name: "Basic Package",
				badge: "Not offered on this tour",
				headline: "This Java tour is planned only as a Premium package.",
				priceMultiplier: 0,
				highlights: [],
				notes: "This package is not on sale; pricing is shown as 0.",
			},
			{
				id: "plus",
				level: "plus",
				name: "Standard Package",
				badge: "Not offered on this tour",
				headline: "This Java tour is planned only as a Premium package.",
				priceMultiplier: 0,
				highlights: [],
				notes: "This package is not on sale; pricing is shown as 0.",
			},
			{
				id: "premium",
				level: "premium",
				name: "Premium Package",
				badge: "Active package",
				headline: "The only planned package for this Java tour.",
				priceMultiplier: 1,
				highlights: [
					"The day-by-day program on this page is for the Premium package.",
					"The route, accommodation standard, and operations plan are built to Premium level.",
				],
				notes:
					"The exact service scope and operational details are shared in writing before booking, based on dates, group size, and preferences.",
			},
		],
		itinerary: [
			{
				day: 1,
				title: "Arrival in Jakarta, Rest, and Free Time",
				activities: [
					"Arrival in Jakarta from Istanbul (flight details are shared in writing after booking)",
					"Welcome at the airport, brief orientation, and transfer to the hotel",
					"Hotel check-in and rest after the journey",
					"Optional short city introduction (depending on time/energy): around Monas or the Kota Tua area",
					"Evening: free time (rest / short walk / optional dinner suggestions)",
				],
				accommodation: "The Hermitage Jakarta (5⭐)",
			},
			{
				day: 2,
				title: "Free Day – Jakarta → Bandung (Train) Transfer and Free Evening",
				activities: [
					"After breakfast, depart at 10:25 on the Whoosh high-speed train to Bandung",
					"Arrival in Bandung at 11:15",
					"11:35 transfer to the hotel, check-in, and a short rest",
					"Lunch (per group plan)",
					"Then a short Bandung city tour (guests who wish can spend the day fully free)",
					"Toward evening: return to the hotel and free time",
				],
				accommodation: "Selected hotel in central Bandung (4⭐/5⭐)",
			},
			{
				day: 3,
				title:
					"Ciwidey Highlands – Tea Gardens, Situ Patengan, and Rengganis Suspension Bridge (Guided Day)",
				activities: [
					"After breakfast, we leave the hotel and reach the Ciwidey area after a 1.5–2-hour drive",
					"Highland tour around Situ Patenggang (Situ Patengan): tea gardens, lake and plateau scenery with picnic areas, viewpoints, and photo breaks",
					"Visit to a local market and free time for shopping",
					"A 10–15-minute drive to the Rengganis area",
					"At Rengganis, crossing the 1,500-meter-long swinging suspension bridge with scenic and photo breaks",
					"At the end of the day, you can discover and enjoy the open-air thermal hot springs hidden in the forest",
					"Return to Bandung and free time",
				],
				accommodation: "Selected hotel in central Bandung (4⭐/5⭐)",
			},
			{
				day: 4,
				title: "Free Day – Bandung City and Personal Preferences",
				activities: [
					"After breakfast at the hotel, a fully free day as you decide",
					"Cafés, malls, and city exploration: follow local life up close, shop, and spend the day with a drink",
					"For city travel, you can easily arrange taxi or motorbike transport via the Gojek, GoCar, or Grab mobile apps",
					"On free days, if you request guidance for city visits, shopping, cafés, and restaurants, a guide can be arranged to accompany you for a fee",
					"Optional: short museum/viewpoint stop or local market visit",
					"Evening: free time",
				],
				accommodation: "Selected hotel in central Bandung (4⭐/5⭐)",
			},
			{
				day: 5,
				title: "Bandung → Pangandaran (Overland) and Beach Evening",
				activities: [
					"After breakfast, hotel check-out and departure from Bandung",
					"Overland transfer from Bandung to Pangandaran (about 5–6 hours; breaks planned)",
					"Upon arrival, hotel check-in, settle in, and rest until evening",
					"Toward evening, head to the beach for sunset with coconut water and relax at chill-out areas",
					"Evening: free time",
				],
				accommodation: "Selected hotel or resort in the Pangandaran beach area",
			},
			{
				day: 6,
				title: "Pangandaran – Body Rafting & Nature Day (Guided Day)",
				activities: [
					"After breakfast, we leave the hotel and reach the Citumang body rafting area after a 45-minute drive",
					"After a short briefing at the body rafting area, we put on life jackets",
					"After a short walk, we reach the starting point",
					"With the guide, we let ourselves flow with the calm currents of the Citumang River",
					"As we progress for about 2 km, jumping from small jump points at some spots is among the most fun moments",
					"At the end of the activity, lunch before leaving and a rest break back at Pangandaran beach",
					"Evening: free time",
				],
				accommodation: "Selected hotel or resort in the Pangandaran beach area",
			},
			{
				day: 7,
				title: "Pangandaran Free Day – Beach & Personal Preferences",
				activities: [
					"Free time on the beach after breakfast",
					"Optional: Green Canyon boat/river route or alternative nature activities like Citumang",
					"Free flow for cafés, sea, relaxation, and photos",
					"Evening: free time",
				],
				accommodation: "Selected hotel or resort in the Pangandaran beach area",
			},
			{
				day: 8,
				title:
					"Free Day – Pangandaran → Yogyakarta (Overland) and Free Evening",
				activities: [
					"Breakfast and check-out",
					"Overland transfer from Pangandaran to Yogyakarta (about 5–6 hours; breaks planned)",
					"Upon arrival, check-in and a short rest",
					"Evening: free walk / shopping around Malioboro (depending on energy)",
				],
				accommodation: "Selected hotel in central Yogyakarta (4⭐/5⭐)",
			},
			{
				day: 9,
				title: "Mount Merapi Off-Road (Jeep) Tour (Guided Day)",
				activities: [
					"After breakfast, depart toward the Merapi area (timing per operations plan)",
					"Off-road route around Merapi by jeep: lava fields and scenic stops",
					"Short museum/viewpoint stops per program flow (subject to availability and weather)",
					"Lunch break (per operations plan)",
					"In the afternoon, transfer to Obelix Sea View: entertainment areas, photo points, and Yogyakarta scenery",
					"Toward sunset, enjoy sunset at the Obelix Sea View terrace (weather permitting)",
					"Return to the hotel in the evening and rest",
					"Evening: free time",
				],
				accommodation: "Selected hotel in central Yogyakarta (4⭐/5⭐)",
			},
			{
				day: 10,
				title: "Prambanan & Plaosan Jeep Tour (Guided Day)",
				activities: [
					"Visit to the Prambanan Temple Complex: with the guide, we tour the main temples (Shiva, Brahma, and Vishnu) in this impressive UNESCO-listed Hindu temple group; we examine courtyards, reliefs, and story-telling stone carvings, with time for photos and free exploration",
					"After Prambanan, a jeep tour in the Plaosan area: rural route, scenic stops, and photo breaks",
					"Lunch and a short rest/break depending on program flow",
					"Evening: free time",
				],
				accommodation: "Selected hotel in central Yogyakarta (4⭐/5⭐)",
			},
			{
				day: 11,
				title: "Borobudur Visit and Return",
				activities: [
					"Breakfast and check-out (depending on flight time)",
					"Borobudur visit (time and entry rules are clarified per operations plan)",
					"Transfer to the airport",
					"Return to Istanbul (flight details are shared in writing after booking)",
					"At this point we say goodbye and our long Java journey is complete",
				],
				accommodation: "-",
			},
		],
		activities: [
			{
				category: "Cultural Experiences",
				items: [
					"Kraton Palace and traditional Javanese life",
					"Batik introduction and workshop experience",
					"Local markets and street food",
					"Traditional dance/music performance (optional)",
				],
			},
			{
				category: "History & Architecture",
				items: [
					"Borobudur Temple",
					"Prambanan Temple Complex",
					"Mendut Temple",
					"Kota Tua colonial architecture walk",
				],
			},
			{
				category: "Nature & Scenery",
				items: [
					"Mount Bromo sunrise viewpoints",
					"Short walks inside the caldera and photo breaks",
					"Savanna and sea-of-sand area",
					"Seasonal tea/green route stops (optional)",
				],
			},
		],
		about: {
			nature:
				"Java offers captivating natural landscapes with active volcanoes, lush rice fields, and tea plantations. Volcanoes like Bromo and Ijen are among the world’s most impressive natural formations.",
			culture:
				"As Indonesia’s cultural center, Java carries traces of Hindu, Buddhist, and Islamic civilizations. UNESCO World Heritage temples such as Borobudur and Prambanan witness the island’s rich history. Batik art, wayang performances, and gamelan music are essentials of Javanese culture.",
			lifestyle:
				"Java offers a wide spectrum—from traditional village life to modern Jakarta’s cosmopolitan atmosphere. Yogyakarta’s artistic spirit, the liveliness of local markets, and the hospitality of the people make the island special.",
		},
		routes: [
			{ name: "Jakarta", description: "Arrival, rest, and a short city vibe" },
			{ name: "Bandung", description: "Café-city culture and highland routes" },
			{ name: "Ciwidey", description: "Tea gardens, lake/highlands, and hot springs" },
			{ name: "Pangandaran", description: "Beach + river/canyon nature experiences" },
			{ name: "Yogyakarta", description: "City culture and UNESCO temple routes" },
			{ name: "Prambanan", description: "UNESCO Hindu temple complex" },
			{ name: "Borobudur", description: "UNESCO Buddhist temple" },
		],
		gallery: [
			"/java-borobudur-temple-volcano-sunrise.jpg",
			"/ernests-vaga-mzJFI9o5_zc-unsplash.jpg",
			"/placeholder.jpg",
			"/placeholder.jpg",
			"/placeholder.jpg",
			"/placeholder.jpg",
		],
	},
	komodo: {
		name: "Komodo Island",
		hero:
			"https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=1200",
		summary:
			"An adventure-focused route where you explore the UNESCO World Heritage-listed Komodo National Park via Labuan Bajo boat routes—combining highlights such as Komodo dragons, Rinca trekking, Padar panorama, Pink Beach, and Manta Point snorkeling.",
		suitableFor: [
			"Nature & Adventure",
			"Sea & Snorkeling",
			"Photography",
			"Cultural Exploration",
			"Families (with slower-paced options)",
		],
		duration: "6 Nights 7 Days",
		concept: "Nature • Sea • Adventure • Culture",
		price: "3.899",
		packages: [
			{
				id: "komodo-basic",
				level: "temel",
				name: "Komodo Adventure Basic",
				badge: "Flexible & economical",
				headline:
					"Ideal for those who want to lock in accommodation and basic coordination, and shape the boat/diving intensity to their preference.",
				priceMultiplier: 0.7,
				highlights: [
					"6 nights Labuan Bajo 4★ accommodation (breakfast included)",
					"Airport transfers + local coordination",
					"Island/boat days based on selection (can be added optionally)",
					"24/7 support line",
				],
				notes:
					"The Basic package locks in accommodation and main coordination. Island/boat days and national park fees can be added optionally based on preference.",
			},
			{
				id: "komodo-plus",
				level: "plus",
				name: "Komodo Adventure Standard",
				badge: "Balanced option",
				headline:
					"For those who want to experience Komodo’s strongest stops (Rinca/Komodo, Padar, Pink Beach, Manta Point) with balanced intensity.",
				priceMultiplier: 0.85,
				highlights: [
					"6 nights Labuan Bajo 4★ accommodation (breakfast included)",
					"Rinca & Komodo trekking routes",
					"Padar + Pink Beach + Manta Point snorkeling route",
					"Lunch on boat-tour days",
				],
				notes:
					"The Standard package references the main stops in the day-by-day flow on this page. Operational details (such as times/routes) are shared in writing after booking.",
			},
			{
				id: "komodo-premium",
				level: "premium",
				name: "Komodo Adventure Premium",
				badge: "Most comprehensive",
				headline:
					"For those who want higher comfort, clearer scope, and a denser boat/snorkel schedule.",
				priceMultiplier: 1,
				highlights: [
					"6 nights upper-segment Labuan Bajo accommodation option (subject to availability)",
					"More comprehensive boat/island route planning",
					"Clarification of scope for national park entry/port taxes",
					"Priority booking coordination",
				],
				notes:
					"The Premium package is planned to make the scope as clear as possible. Special requests such as diving and equipment needs are planned additionally based on selection.",
			},
		],
		itinerary: [
			{
				day: 1,
				title: "Arrival in Labuan Bajo",
				activities: [
					"Welcome at Flores (Labuan Bajo) airport and a quick warm greeting",
					"Transfer to the hotel, check-in, and a short rest to shake off travel fatigue",
					"Optional short walk at the marina: enjoy the boats, the coastal town vibe, and evening lights",
					"Briefing on the flow: route logic for upcoming days and key notes for boat days",
					"Sunset at Seraya Hill or Bukit Cinta: catch the best light to view Labuan Bajo from above (depending on flight time)",
				],
				accommodation: "Labuan Bajo boutique hotel (4⭐)",
			},
			{
				day: 2,
				title: "Rinca Island & Komodo Trekking",
				activities: [
					"Early morning transfer to the boat and set sail: move through calmer bays in the day’s first hours",
					"Rinca Island national park tour: safe route and nature narration with a park guide",
					"Guided trekking: observe Komodo dragons and wildlife (safety rules are explained by the guide)",
					"Kalong (flying fox) spot: near sunset, watch the sky fill with flights (depending on weather/route suitability)",
					"Return to Labuan Bajo and free time in the evening",
				],
				accommodation: "Labuan Bajo boutique hotel (4⭐)",
			},
			{
				day: 3,
				title: "Komodo & Pink Beach (Padar Panorama + Snorkeling)",
				activities: [
					"Morning departure – Padar Island viewpoint: a short hike for the legendary three-bay panorama and plenty of photos",
					"Pink Beach: free time on pink sands; one of the most enjoyable stops for swimming & snorkeling",
					"Lunch on the boat: a practical and pleasant break since we’re on the sea all day",
					"Kanawa or Taka Makassar: snorkeling for corals and colorful fish, rest, and sun time (depending on route suitability)",
				],
				accommodation: "Labuan Bajo boutique hotel (4⭐)",
			},
			{
				day: 4,
				title: "Manta Point & Underwater Exploration",
				activities: [
					"Early morning at Manta Point: a chance to see giant mantas with the right timing and luck",
					"Explore underwater by snorkeling; scuba plan for those who wish (optional, based on preference)",
					"Continue the route at small islands such as Siaba or Bidadari: calmer bays and clear water (depending on sea/weather)",
					"Swimming and free time for the rest of the day: relax on the boat and enjoy the scenery",
				],
				accommodation: "Labuan Bajo boutique hotel (4⭐)",
			},
			{
				day: 5,
				title: "Free Day",
				activities: [
					"Today is a free day for everyone; you can go to the beach, shop, or relax at cafés.",
					"Optional paid: local village visit (can be selected from the optional extra activity card on the side)",
					"Our guides provide shopping, café, and restaurant recommendations upon request.",
					"If desired, we can assign a guide for a fee for any topic you prefer.",
				],
				accommodation: "Labuan Bajo boutique hotel (4⭐)",
				optionalExtras: [
					{
						id: "komodo-free-day-village-tour",
						title: "Day 5 | Local Village Visit (Optional)",
						shortDescription:
							"A short, culture-focused village visit to see local life up close around Labuan Bajo (optional and paid).",
						estimatedPricePerPerson: 75,
						priceNote:
							"Around 60–90 USD per person; not included in the tour and offered as an optional extra service.",
						details: [
							"📍 Location: Around Labuan Bajo (route is planned based on weather and accessibility)",
							"⏱ Duration: About half a day",
							"👥 Who it’s for: Culture and local life enthusiasts, photographers",
							"Local village life, daily rhythms, and region-specific storytelling",
							"Short walks and photo stops",
							"Transport and organizational coordination (subject to availability)",
						],
						notes:
							"This village visit is not included in the tour package and is an optional add-on service. Exact time/route is planned based on group pace and current conditions.",
					},
				],
			},
			{
				day: 6,
				title: "Labuan Bajo Bay & Sunset",
				activities: [
					"Morning: city exploration or port/marina walk; catch Labuan Bajo’s daytime rhythm",
					"Canoe / water sports (included; depending on weather and availability): for those who want a more active sea day",
					"Afternoon: Seraya Hill or Bukit Cinta sunset point; one of the best farewell views of the tour",
					"Photo & scenery break: lots of shooting while the light is at its best",
					"Evening: local cuisine experience (optional) – recommendations for seafood and local flavors",
				],
				accommodation: "Labuan Bajo boutique hotel (4⭐)",
			},
			{
				day: 7,
				title: "Return",
				activities: [
					"Breakfast and packing",
					"Our last day together: a short café meetup and goodbye at suitable times",
					"Hotel check-out and transfer organization",
					"Support at airport check-in and farewell",
					"Return flight",
				],
				accommodation: "-",
			},
		],
		activities: [
			{
				category: "Wildlife",
				items: [
					"Observe Komodo dragons in their natural habitat",
					"Guided trekking on Rinca & Komodo",
					"Wildlife photography",
				],
			},
			{
				category: "Sea & Snorkeling",
				items: [
					"Swimming & snorkeling at Pink Beach",
					"Manta Point snorkeling (chance to see manta rays)",
					"Kanawa / Taka Makassar snorkeling stops (depending on route suitability)",
					"Scuba diving (optional)",
				],
			},
			{
				category: "Scenery & Photography",
				items: [
					"Padar Island panorama",
					"Seraya Hill / Bukit Cinta sunset",
					"Labuan Bajo marina and coastal town atmosphere",
				],
			},
		],
		included: [
			"All packages: 6 nights accommodation in Labuan Bajo (4★ hotel/boutique property) and daily hotel breakfast",
			"All packages: transfers airport–hotel–hotel and 24/7 reachable Turkish-language coordination",
			"Standard and Premium packages: island/boat days departing from Labuan Bajo (including the main stops in the program)",
			"Standard and Premium packages: Rinca & Komodo trekking (with local park guide)",
			"Standard and Premium packages: Padar panorama, Pink Beach, and Manta Point snorkeling routes (depending on sea/weather)",
			"Standard and Premium packages: lunch on the boat on boat-tour days",
			"Standard and Premium packages: national park entries and port/ferry taxes (as per program scope)",
			"All packages: Day 6 canoe / water sports experience (depending on weather and availability)",
			"Premium package only: more comprehensive route/boat planning and upper-segment accommodation option (subject to availability)",
		],
		notIncluded: [
			"For the Basic package: Rinca & Komodo trekking, Padar/Pink Beach/Manta Point boat days, and national park entries are not included; can be planned as optional extras if desired",
			"All packages: international flights",
			"All packages: scuba diving and diving equipment (optional)",
			"All packages: lunches/dinners outside boat days and all food & beverage expenses outside the hotel scope",
			"All packages: beverages, tips, and personal expenses",
			"All packages: optional extra activities such as the Day 5 local village visit (charged additionally based on participation)",
		],
		about: {
			nature:
				"Komodo National Park offers one of Indonesia’s most striking nature scenes, with dramatic hills, savanna landscapes, pink beaches, and clear turquoise bays.",
			culture:
				"Flores and the surrounding islands offer an authentic coastal culture with small fishing towns, local markets, and a cuisine centered on fresh seafood.",
			lifestyle:
				"It balances adventure and rest: island exploration and snorkeling by boat during the day, and free time and sunset spots in Labuan Bajo in the evenings.",
		},
		routes: [
			{ name: "Labuan Bajo", description: "The coastal town where tours start" },
			{ name: "Rinca Island", description: "Guided trekking and Komodo observation" },
			{ name: "Komodo National Park", description: "UNESCO routes and wild nature" },
			{ name: "Padar Island", description: "Iconic panoramic viewpoint" },
			{ name: "Pink Beach", description: "Pink-sand beach and snorkeling" },
			{ name: "Manta Point", description: "Manta ray area – snorkeling" },
			{ name: "Kanawa / Taka Makassar", description: "Snorkeling & rest breaks" },
			{ name: "Seraya Hill / Bukit Cinta", description: "Sunset and photography" },
		],
		gallery: [
			"https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/11896657/pexels-photo-11896657.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200",
		],
	},
	sulawesi: {
		name: "Sulawesi Island",
		hero:
			"https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200",
		summary:
			"A flight-heavy discovery route that starts with Makassar’s tropical coastal rhythm, continues to Manado and Bunaken’s underwater world, and adds a final metropolitan touch with Jakarta—moving via domestic connecting flights within Indonesia.",
		suitableFor: [
			"Sea & Snorkeling",
			"Diving (optional)",
			"Nature & Wildlife",
			"Photography",
			"City & Café Culture",
		],
		duration: "8 Nights 9 Days",
		concept: "Sea • Nature • Diving • Tropical City",
		price: "4.199",
		packages: [
			{
				id: "sulawesi-basic",
				level: "temel",
				name: "Sulawesi Discovery Basic",
				badge: "Flexible & economical",
				headline:
					"For those who want to lock in the accommodation + flight backbone and shape boat/park days to their preference.",
				priceMultiplier: 0.7,
				highlights: [
					"Total 8 nights accommodation: Makassar (2 nights) + Manado (5 nights) + Jakarta (1 night)",
					"Domestic flights Makassar → Manado and Manado → Jakarta",
					"Airport transfers + 24/7 Turkish-language coordination",
					"Free-day blocks and flexibility for personal exploration",
				],
				notes:
					"The Basic package locks in the flight backbone and accommodation. Boat/park days can be planned optionally based on preference.",
			},
			{
				id: "sulawesi-plus",
				level: "plus",
				name: "Sulawesi Discovery Standard",
				badge: "Balanced option",
				headline:
					"A package that combines standout experiences like a Makassar island day + Bunaken + Tangkoko at a balanced pace.",
				priceMultiplier: 0.85,
				highlights: [
					"Makassar tropical island boat day",
					"Bunaken National Park (snorkeling/diving day)",
					"Tangkoko rainforest – wildlife discovery",
					"A short metropolitan touch in Jakarta",
				],
				notes:
					"The Standard package references the main stops in the day-by-day flow on this page. Flight times and operational details are shared in writing after booking.",
			},
			{
				id: "sulawesi-premium",
				level: "premium",
				name: "Sulawesi Discovery Premium",
				badge: "Most comprehensive",
				headline:
					"An upper-level package for those who want clearer scope, fuller planning, and higher comfort.",
				priceMultiplier: 1,
				highlights: [
					"Tomohon volcanic scenery + Lake Linow + thermal stops",
					"More comprehensive planning on the Bunaken day (depending on sea/weather)",
					"More extensive booking coordination and prioritization",
				],
				notes:
					"The Premium package aims to plan the program with clearer scope and fuller days. Special requests like diving are planned additionally based on preference.",
			},
		],
		itinerary: [
			{
				day: 1,
				title: "Makassar – First Step into the Tropics",
				activities: [
					"Arrival in Makassar and welcome at the airport",
					"Transfer to the hotel (about 30–40 min) and check-in",
					"After a short rest, a walk along the coast: first tropical touch and sea air",
					"Free time at sunset: café time / sit and watch the city / rest",
				],
				accommodation: "Makassar city hotel (4⭐)",
			},
			{
				day: 2,
				title: "Makassar – Island & Sea Experience (Guided Day)",
				activities: [
					"Morning meetup and comfortable transfer to the boat pier: we catch the day’s rhythm early",
					"Boat ride to tropical islands off Makassar (about 30–45 min): wind, sea scent, and first views",
					"All-day ‘turquoise water + pure white sand’ vibe: swim breaks in calm coves and the best snorkeling spots",
					"Meet coral textures and colorful fish while snorkeling: a great warm-up ‘before Bunaken’ even without diving",
					"Free time along the shoreline: sunbathing, short walks, photos, and rest breaks",
					"Optional time window for jet ski and water sports at the beach area (subject to availability and sea conditions)",
					"Return by boat in the afternoon: last frames on the sea in the day’s best light",
					"Free evening after arriving back in Makassar: wrap up the day with recommended cafés/restaurants",
				],
				accommodation: "Makassar city hotel (4⭐)",
			},
			{
				day: 3,
				title: "Makassar → Manado – Arrival & Free Day (Depending on Remaining Time)",
				activities: [
					"Morning transfer to the airport",
					"Domestic flight Makassar → Manado (about 1 hour 45 min)",
					"After arrival, transfer to the hotel and check-in",
					"Remaining time: free time (depending on flight and arrival time)",
				],
				accommodation: "Manado city hotel (4⭐)",
				optionalExtras: [
					{
						id: "sulawesi-manado-arrival-short-city",
						title: "Day 3 | Short Manado City Exploration (Optional)",
						shortDescription:
							"A short coastal walk/city exploration depending on remaining time on the arrival day (optional and paid).",
						estimatedPricePerPerson: 35,
						priceNote:
							"Around 25–55 USD per person; not included (planned depending on remaining time).",
						details: [
							"⏱ Duration: 1–2.5 hours depending on arrival time",
							"🗺 Content: coastline, short photo stops, local café/market break",
							"📌 Note: Program is shaped by flight times and traffic",
						],
						notes:
							"This activity is not included in the tour price. It can be done the same day depending on flight/arrival time; if time is not suitable, it can be moved to the next available free-time window.",
					},
				],
			},
			{
				day: 4,
				title: "Bunaken National Park – Journey Under the Ocean (Guided Day)",
				activities: [
					"Early morning meetup and boat ride to Bunaken National Park (about 40–50 min): the sea color changes as you go",
					"Short briefing upon arrival: day flow, safety, and the best snorkel spots (depending on sea conditions)",
					"Snorkel breaks: coral gardens, tropical fish, and an ‘aquarium’ feeling underwater (controlled options even for non-swimmers)",
					"Island time for non-divers: relax on the sand, photo points, and a calm tropical day",
					"Safe discovery dive with an instructor for non-certified guests (optional; subject to availability)",
					"For certified divers: Bunaken’s famous wall-diving routes (optional; subject to conditions)",
					"Lunch on the island: recharge and a short rest",
					"Return to Manado by boat and transfer to the hotel: salty hair, lots of photos, and a full day",
				],
				accommodation: "Manado city hotel (4⭐)",
			},
			{
				day: 5,
				title: "Manado – Free Day",
				activities: [
					"Full free day after breakfast",
					"Optional: extra diving, a short island tour, or beach time (based on preference)",
					"Optional: spa, rest, and personal exploration",
					"Free evening: café/restaurant suggestions are shared",
					"For those who want, diving is planned; for those who want, a boat tour is planned.",
				],
				accommodation: "Manado city hotel (4⭐)",
				optionalExtras: [
					{
						id: "sulawesi-free-day-adrenaline-watersports",
						title: "Day 5 | Jet Ski & Water Sports Tour (Optional)",
						shortDescription:
							"Short adrenaline-focused activities such as jet ski (optional and paid).",
						estimatedPricePerPerson: 90,
						priceNote: "Around 60–120 USD per person; not included.",
						details: [
							"Content is clarified based on local operator and availability",
							"Safety equipment and a short briefing are provided by the operator",
						],
						notes:
							"This activity is not included in the tour price; it is charged additionally based on participation.",
					},
				],
			},
			{
				day: 6,
				title: "Tomohon – Volcanoes, Mist, and Thermal Waters (Guided Day)",
				activities: [
					"Morning departure from Manado to the Tomohon area (about 1.5 hours): scenery transforms from coast to higher altitude",
					"Volcanic scenery stops: postcard-like photo points with mist, green slopes, and dramatic silhouettes",
					"Lake Linow: walk and scenery break at the lake whose tones change with daylight (time for the best shots)",
					"Short free time in the cool air: hot drink break and time to absorb the surroundings",
					"Relax at natural thermal sources: release the day’s fatigue and refresh the body",
					"Return to Manado in the evening: complete the tour with views toward sunset",
				],
				accommodation: "Manado city hotel (4⭐)",
			},
			{
				day: 7,
				title: "Tangkoko – Wild Nature in the Rainforest (Guided Day)",
				activities: [
					"Early morning departure and transfer to Tangkoko National Park (about 1.5–2 hours): enter tropical nature in sunrise light",
					"Guided rainforest walk: bird sounds, giant trees, and a true ‘wild nature’ atmosphere",
					"Chance to observe tarsiers (one of the world’s smallest primates) and black macaques in their natural habitat",
					"Short stops during the walk: photo, breath, and nature-absorption breaks (pace set to the group’s rhythm)",
					"Nature and photography-focused exploration: guide directions to capture ‘documentary-scene’ moments",
					"Return to Manado in late afternoon and free evening: balance the day’s impact with a calm night",
				],
				accommodation: "Manado city hotel (4⭐)",
			},
			{
				day: 8,
				title: "Manado → Jakarta – Transition to the Metropolis",
				activities: [
					"Morning check-out and transfer to the airport",
					"Domestic flight Manado → Jakarta (about 3 hours)",
					"Arrival in Jakarta, transfer to the hotel, and a short rest",
					"Evening short city walk: café time and free time",
				],
				accommodation: "Jakarta city hotel (4⭐)",
			},
			{
				day: 9,
				title: "Jakarta → Istanbul – Return",
				activities: [
					"Free time after breakfast",
					"Transfer to Jakarta Airport depending on flight time (about 45–60 min)",
					"Support at airport check-in and farewell",
					"Jakarta → Istanbul flight",
				],
				accommodation: "-",
			},
		],
		included: [
			"All packages: total 8 nights accommodation (Makassar 2 + Manado 5 + Jakarta 1) and daily hotel breakfast",
			"All packages: domestic flight Makassar → Manado (airline/time details shared in writing after booking)",
			"All packages: domestic flight Manado → Jakarta (airline/time details shared in writing after booking)",
			"All packages: airport–hotel transfers and 24/7 reachable Turkish-language coordination",
			"Standard and Premium packages: Day 2 Makassar island boat day (including the main stops in the program)",
			"Standard and Premium packages: Day 4 Bunaken National Park boat day (snorkeling routes) and lunch on the island",
			"Standard and Premium packages: Day 5 Tangkoko rainforest tour (guided)",
			"Premium package only: Day 6 Tomohon + Lake Linow + thermal sources day (as per program scope)",
		],
		notIncluded: [
			"For the Basic package: the Makassar island boat day, the Bunaken day, and the Tangkoko tour are not included; can be planned as optional extras if desired",
			"All packages: international flights (Istanbul → Indonesia round trip)",
			"All packages: scuba diving, diving equipment, and instructor fees (optional)",
			"All packages: lunches/dinners and food & beverage expenses outside the hotel scope",
			"All packages: personal expenses, tips, and optional water sports",
			"The international departure fee paid when leaving Turkey is paid by the participant",
		],
		notes: {
			approach:
				"This program is a flight-heavy flow that moves via domestic connecting flights within Indonesia. Long and exhausting overland journeys are not planned; only short ground transfers required for day tours are done. On guided days (boat/national park/rainforest routes), timing, transfers, and operational flow are planned in advance; you just focus on the experience. Free-time blocks are intentionally preserved: they provide flexibility for rest, coastal/café exploration, and optional extra experiences. Flight times, boat departures, and operational details are shared in writing after booking.",
			freeTime:
				"Free day and free evening blocks are not ‘empty days’; they are intentionally preserved to balance the pace and let you experience Sulawesi in your own rhythm. We support you with suggestions like sunset on the coast, café/restaurant exploration, spa/massage, and short walking routes. If you wish, depending on remaining time and availability, extra experiences such as diving or a boat tour can also be planned; participation is entirely your choice.",
			discipline:
				"On guided days, flights/boats/national park entries run on a schedule, so it’s important to be on time and follow safety instructions. We build the flow to be as smooth and stress-free as possible; what we expect from you is to be ready on time and follow the guide’s directions. Respect for group order and mutual courtesy directly raises both comfort and experience quality.",
		},
		routes: [
			{ name: "Makassar", description: "Tropical coastal city, route start" },
			{ name: "Makassar Islands", description: "Tropical islands by boat, swimming & snorkeling" },
			{ name: "Manado", description: "Gateway to North Sulawesi" },
			{ name: "Bunaken", description: "World-famous national park for snorkeling and diving" },
			{ name: "Tangkoko", description: "Rainforest and wildlife observation" },
			{ name: "Tomohon & Lake Linow", description: "Volcanic scenery and thermal stops" },
			{ name: "Jakarta", description: "Metropolitan vibe and a short break before return" },
		],
		gallery: [
			"https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200",
		],
	},
};
