export const baliEn = {
  name: "Bali Island",
  hero: "/bali-rice-terraces-green.jpg",
  summary:
    "Bali, with its rice terraces, waterfalls, and tropical beaches, is the most comprehensive and most meticulously prepared island on our experience-focused group holiday route.",
  suitableFor: [
    "Nature & Adventure",
    "Sea & Beach Holiday",
    "Cultural Discovery",
    "Wellness & Spa",
  ],
  duration: "6 Nights 7 Days",
  concept:
    "The flight ticket is included in the package up to $750 per person. Since flight prices are highly variable, this limit is fixed; any amount above the limit is paid by the participant.",
  price: "3.699",
  packages: [
    {
      id: "bali-basic",
      level: "temel",
      name: "Bali Explorer Basic",
      badge: "Budget-friendly",
      headline:
        "An entry-level package for those who want to lock in the flight, accommodation, and breakfast, and choose all activities optionally.",
      priceMultiplier: 0.7,
      highlights: [
        "Round-trip flight ticket departing from Istanbul (airline/layover details are shared in writing after reservation)",
        "6 nights accommodation in selected hotels in Ubud and the coastal area, daily breakfast included at the hotel restaurant",
        "Main airport–hotel–hotel transfers and 24/7 reachable Turkish support",
        "All days in the program are free. The guided tour to Tegenungan Waterfall and the Tegalalang rice terraces, the Ubud Monkey Forest visit, the Ayung River rafting day, the full-day boat tour, as well as the ATV Quad Safari on Day 3 and the Sea Walker, Jet Ski, and Parasailing on Day 5 are not included in this package; if you wish, you can add these experiences as optional extras during reservation or on-site at least 24 hours in advance",
      ],
      notes:
        "This package provides a fully flexible holiday foundation. The Day 2 Ubud guided tour (Tegenungan Waterfall, Tegalalang rice terraces, Ubud Monkey Forest and the other stops during the day), the Day 4 Ayung River rafting & nature day, and the Day 6 full-day boat tour described in the detailed itinerary are not included in this package; additionally, the Day 3 ATV Quad Safari and the Day 5 water sports experiences such as Sea Walker, Jet Ski, and Parasailing are also not included in the budget-friendly package. You can add all of these activities as optional extras either during reservation or on-site at least 24 hours in advance. The goal is to lock in the flight + accommodation + breakfast and let you choose activities later according to your interests and budget.",
    },
    {
      id: "bali-plus",
      level: "plus",
      name: "Bali Experience Standard",
      badge: "Balanced option",
      headline:
        "A balanced level of comfort and experience that includes the flight, accommodation, breakfast, and guided activities on Days 2 and 4.",
      priceMultiplier: 0.85,
      highlights: [
        "Round-trip flight ticket departing from Istanbul",
        "6 nights accommodation in selected hotels in Ubud and the coastal area, daily breakfast included at the hotel restaurant",
        "Day 2 guided day focused on nature and experiences in Ubud & surroundings is included",
        "Day 4 Ayung River rafting & nature adventure and transfer to the Sanur area are included",
        "On these guided days, lunch at the same restaurant as a group is included",
      ],
      notes:
        "The Day 6 full-day boat tour and free-day activities such as the ATV on Day 3 and water sports on Day 5 are not included in this package; if you wish, they can be added as optional extra services either during reservation or on-site at least 24 hours in advance. The Standard package includes the core experience on Days 2 and 4, and keeps the other days flexible based on budget and interests.",
    },
    {
      id: "bali-premium",
      level: "premium",
      name: "Bali Experience Premium",
      badge: "Most comprehensive",
      headline:
        "The fully comprehensive package described day by day; designed to minimize surprise costs with the flight, rafting, and full-day boat tour included.",
      priceMultiplier: 1,
      highlights: [
        "Round-trip flight ticket departing from Istanbul",
        "6 nights accommodation in selected upper-segment hotel or boutique property in Ubud and the coastal area, daily breakfast included at the hotel restaurant",
        "Day 2 Ubud & surroundings guided tour, Day 4 Ayung River rafting & nature adventure, and Day 6 full-day boat tour are included",
        "On guided days, group lunches and many extra details mentioned in the program are included in the price",
      ],
      notes:
        "This package is the fully comprehensive version that uses the day-by-day program on the page as its reference; the flight, the guided activities on Days 2 and 4, and the Day 6 full-day boat tour are included from the start. The full-day boat tour is organized with a private or shared boat depending on group size; if a private boat is preferred, an optional per-person surcharge may apply. Optional experiences such as the ATV Quad Safari on Day 3 and the water sports package on Day 5 are not included in this package; however, for Premium guests they are offered at special discounted rates of up to ~25% off; the exact amount is shared in writing before you confirm your selection.",
    },
  ],
  itinerary: [
    {
      day: 1,
      title: "Meet at Bali Airport, Check-in to the Hotel, and Free Time",
      activities: [
        "Flights are planned as part of the package and departing from Istanbul. If you request a different departure city, availability and any possible price difference will be clarified in writing.",
        "Our team welcomes you at Bali Airport; the tour program officially starts here.",
        "Private transfer from Bali to the hotel and check-in",
        "Free time to rest after the journey and get used to the Bali atmosphere",
      ],
      accommodation: "Selected hotel or boutique property in the Ubud area",
    },
    {
      day: 2,
      title: "Ubud & Surroundings – Guided Day Focused on Nature and Experiences",
      activities: [
        "08:30 – Depart from the hotel",
        "Nature walk at Tegenungan Waterfall, photos, and a swimming break for those who wish",
        "Short walk and photo stop at the Tegalalang rice terrace viewpoints",
        "Walk and observation in the natural habitat at Ubud Monkey Forest (entrance fee included)",
        "Short break at a local coffee and tea tasting spot around Ubud",
        "Group lunch at the same restaurant, individual choice from the menu",
        "Free exploration time in Ubud streets and the handicrafts area: cafés, workshops, and more",
        "17:30 – Return to the hotel, free evening time",
      ],
      accommodation: "Selected hotel or boutique property in the Ubud area",
    },
    {
      day: 3,
      title: "Free Day – Personal Planning",
      activities: [
        "Accommodation at the program hotel and breakfast at the hotel restaurant are included in the package",
        "Throughout the day you can explore Ubud streets, cafés, and nearby nature spots; relax at the hotel pool and spa area; or shop",
        "Food and beverage expenses at restaurants and cafés outside the hotel are not included in the package; extra guidance and organization can be provided upon request. Participants who wish can join the optional ATV Quad Safari activity planned in the Ubud area by clicking the optional extra activity card on the side and reviewing the details",
      ],
      accommodation: "Selected hotel or boutique property in the Ubud area",
      optionalExtras: [
        {
          id: "bali-free-day-ubud-atv",
          title: "Day 3 | Ubud Area – ATV Quad Safari (Optional)",
          shortDescription:
            "An optional paid ATV Quad Safari experience suitable for beginners, on forest trails and paths through Ubud's rice fields.",
          estimatedPricePerPerson: 155,
          priceNote:
            "Depending on the package content, about 125–180 USD per person; not included in the tour and provided as an optional extra service.",
          details: [
            "📍 Location: Ubud – Tegalalang / Payangan route",
            "⏱ Duration: About 1.5 – 2 hours of riding (3–4 hours total experience including preparation and transfers)",
            "🎒 Level: Suitable for beginner and intermediate participants",
            "👥 Who it's for: Ideal for young guests, the young-at-heart, and adrenaline lovers",
            "Riding among rice fields on scenic routes",
            "Progressing on forest trails and natural tracks",
            "Fun stages with muddy sections and stream crossings in some parts",
            "Safe riding with a professional guide; helmet and basic equipment included",
            "Short safety and usage briefing before the ride",
          ],
          notes:
            "This ATV experience is not included in the main tour package; it is completely optional and subject to an additional fee. Prices vary by route and season; typically 125–180 USD per person. For Premium package guests, this activity is offered at a special discounted rate of around ~25% off the list price; the exact amount is shared in writing before you confirm your selection.",
        },
      ],
    },
    {
      day: 4,
      title: "Ayung River Rafting & Nature Adventure – Guided Day",
      activities: [
        "08:00 – Depart from the hotel",
        "Rafting experience on the Ayung River lasting about 2–2.5 hours with 2-person or 4–6-person rafts",
        "A pleasant route with tropical forest views, small waterfalls, and gentle-to-moderate currents",
        "Professional guiding throughout the route; life jacket, helmet, and required safety equipment included",
        "13:30 – 14:30 lunch at a restaurant near the activity area (as a group, individual menu selection)",
        "15:00 – 16:30 nature walk and photo stops at panoramic viewpoints",
        "17:30 – Transfer to the hotel in the coastal Sanur area and check-in",
      ],
      accommodation: "Selected hotel or resort in the Sanur coastal area",
    },
    {
      day: 5,
      title: "Free Day – Beach and Personal Preferences",
      activities: [
        "Accommodation at the program hotel and breakfast at the hotel restaurant are included in the package",
        "You can spend the day with the sea, pool, spa, or city exploration in Sanur",
        "Food and beverage expenses at restaurants and cafés outside the hotel are not included in the package. Guidance or special organization requests are arranged individually for an additional fee; participants who wish can join the optional extra water sports activity planned on the free day by clicking the optional extra activity card on the side and reviewing the details",
      ],
      accommodation: "Selected hotel or resort in the Sanur coastal area",
      optionalExtras: [
        {
          id: "bali-free-day-watersports",
          title: "Free Day – Extra Sea & Water Sports Experience (Optional)",
          shortDescription:
            "A special optional paid package where you can try water sports like Sea Walker, Jet Ski, and Parasailing in Bali's tropical seas on the same day.",
          estimatedPricePerPerson: 230,
          priceNote:
            "Depending on the package content and selected activities, about 210–250 USD per person; not included in the tour and provided as an optional extra service.",
          details: [
            "This day is completely free. Guests who wish can join the Water Sports Experience Package that combines adrenaline and fun in Bali's tropical seas.",
            "The package is prepared for guests who want to experience multiple activities in a single day, and all activities are carried out with professional teams and safety measures.",
            "Sea Walker (Underwater Walk): With an oxygen helmet, walk on the seabed and observe Bali's colorful corals and tropical fish up close. Suitable even for non-swimmers. (Duration: about 30 minutes including preparation)",
            "Jet Ski: A controlled, guided, high-tempo jet ski ride in the open waters of the Indian Ocean. Short but impactful for adrenaline lovers. (Duration: about 15 minutes)",
            "Parasailing: A chance to rise above the sea and watch Bali's coastline from a bird’s-eye view; an unforgettable experience combining scenery and excitement. (Flight time: about 5–7 minutes)",
          ],
          note:
            "This package is not included in the tour price. Guests who wish to participate should inform our guide or operations team at least 24–48 hours in advance for suitable time slots and availability, or they can include it in the package by selecting it during reservation to benefit from the discounted price. For Premium package guests, this water sports package is offered at a special discounted rate of around ~25% off the list price; the exact amount is shared in writing before you confirm your selection.",
        },
      ],
    },
    {
      day: 6,
      title: "Full-Day Boat Tour & Island Experience – Guided Day",
      activities: [
        "08:00 – Boarding our boat at the port on Sanur beach and opening preparations",
        "In the morning, a pleasant boat journey along Bali's east coast to nearby islands (for example around Nusa Lembongan)",
        "Stops at coral reef spots suitable for snorkeling and basic diving; the opportunity to observe marine life up close with mask and snorkel",
        "Anchor in a calm bay for swimming, sunbathing, and photo breaks",
        "Amateur fishing experience on the boat for guests who wish (basic equipment provided)",
        "Lunch on the boat or on a suitable island (included within the tour program)",
        "16:30 – 17:00 sunset experience on the boat or on the shore and return to Sanur",
        "18:30 – Arrival at the hotel, free evening time",
        "The boat day is planned with a private or shared boat depending on group size; if a private boat is preferred, an optional per-person surcharge may apply",
      ],
      accommodation: "Selected hotel or resort in the Sanur coastal area",
    },
    {
      day: 7,
      title: "Free Time, Transfer to Bali Airport, and Return",
      activities: [
        "Breakfast in the morning",
        "Free time in Sanur or nearby areas depending on flight time",
        "If suitable, a small farewell meet-up / celebration at a stylish café close to the beach",
        "Check-out procedures and transfer to Bali Airport",
        "The tour program ends at Bali Airport; all flight and layover processes after this point are the guest's responsibility.",
      ],
      accommodation: "-",
    },
  ],
  activities: [
    {
      category: "Beach & Water Sports",
      items: [
        "Surf lessons and wave spots",
        "Swimming and coral reefs in snorkeling areas",
        "Full-day boat tour and island visits",
        "Stand-up paddle and sea activities",
        "Beach clubs and sunset experiences",
      ],
    },
    {
      category: "Culture & History",
      items: [
        "Ancient temple tours",
        "Traditional dance shows",
        "Art galleries",
        "Local market visits",
        "Balinese cuisine workshop",
      ],
    },
    {
      category: "Nature & Adventure",
      items: [
        "Tegenungan Waterfall and nature walks",
        "Body rafting and canyon route experience",
        "Scenic walks on forest and village roads",
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
      "Bali is a nature-wonder island with its green rice terraces, volcanoes, magnificent waterfalls, and crystal-clear beaches. Thanks to its tropical climate, the island stays green all year; palm trees, exotic flowers, and rich vegetation stand out.",
    culture:
      "A living museum of Hindu culture, Bali has a mystical atmosphere with thousands of temples, daily offerings, and traditional ceremonies. The Balinese people's passion for art, dance, and music is felt in every corner of the island.",
    lifestyle:
      "Time flows differently in Bali. Yoga in the mornings, beaches and spa during the day, sunsets and delicious food in the evenings... The island is a perfect destination both for those seeking peace and for adventure lovers.",
  },
  included: [
    "In all packages: Round-trip flight ticket departing from Istanbul (included up to $750 per person; since flight prices are variable, this limit is fixed; any amount above is paid by the participant)",
    "In all packages: 6 nights accommodation in selected hotels and daily breakfast at the hotel restaurant",
    "In all packages: main airport–hotel–hotel transfers and 24/7 reachable Turkish support",
    "In Standard and Premium packages: guided-day trips and group services included in the program",
    "In Standard and Premium packages: Day 2 Ubud & surroundings guided tour focused on nature and experiences",
    "In Standard and Premium packages: Day 4 Ayung River rafting experience (raft, equipment, and professional guiding included)",
    "Only in the Premium package: Day 6 full-day boat tour and island visits",
    "In Standard and Premium packages: lunches on guided days at a restaurant selected by us (guests can choose any dish from the menu)",
  ],
  notIncluded: [
    "For the Basic package: the guided days and all activities described in the detailed program are not included in this price; this includes the Day 2 Ubud guided tour (Tegenungan Waterfall, Tegalalang rice terraces, Ubud Monkey Forest and other stops), the Day 4 Ayung River rafting & nature day, the Day 6 full-day boat tour, as well as the Day 3 ATV Quad Safari and the Day 5 water sports packages such as Sea Walker, Jet Ski, and Parasailing; these experiences can be planned as optional extras if desired",
    "For the Standard package: the Day 6 full-day boat tour, the water sports package, and other extra activities on free days (charged additionally based on participation)",
    "In all packages: dinners and all food & beverage expenses chosen outside the hotel scope on free days",
    "In all packages: personal expenses, spa, massage, and extra services based on individual preferences",
    "In all packages: optional extra activities such as the Day 3 ATV Quad Safari and the Day 5 sea & water sports package (discounted prices apply for Premium guests, but participating activities are charged separately)",
    "Indonesia/Bali tourist tax and official entry fees are not included in this tour package; before arriving in Bali you must pay the tourist tax online by credit card via https://lovebali.baliprov.go.id (the official site of the Bali Provincial Government), and you must show the barcode sent to your phone by the system to the authorities at Bali Airport.",
    "The overseas departure fee paid when leaving Turkey is paid by the participant and is not included in this package.",
  ],
  notes: {
    approach:
      "This route is an experience-focused group holiday organization designed with the Premium package as the reference. The flight ticket is included in the package up to $750 per person. Since flight prices are highly variable, this limit is fixed; any amount above the limit is paid by the participant and is clearly shared before payment. Accommodation and breakfast are fixed. In the Standard and Premium packages, guided activities on Days 2 and 4 are included; in the Premium package, the Day 6 full-day boat tour is included as well. For other meals and optional activities, guests can choose the hotel restaurant or different venues and experiences outside. This way, you can manage your budget within a transparent structure where you decide what to spend and how much.",
    freeTime:
      "Free-time blocks are intentionally kept flexible so participants can move according to their own taste, budget, and rhythm. For dinners and meals on free days, you can choose from the included options at the hotel restaurant, or discover new places outside. Food and beverage expenses at restaurants and cafés outside the hotel are not included in the tour; upon request, our guide and team support you with restaurant and venue recommendations.",
    discipline:
      "To keep the program running smoothly and pleasantly, respect for group order, adherence to timing, and mutual courtesy are essential. Avoiding behaviors that disrupt group harmony is important so everyone can enjoy a peaceful and unforgettable holiday.",
  },
  routes: [
    { name: "Seminyak Beach", description: "Stylish beach clubs and sunset" },
    { name: "Ubud", description: "The center of art, culture, and nature" },
    { name: "Tanah Lot", description: "Iconic temple in the ocean" },
    { name: "Uluwatu", description: "Clifftop temple and Kecak dance" },
    { name: "Tegalalang", description: "Famous rice terraces" },
    { name: "Nusa Dua", description: "Luxury resort and white sand" },
  ],
  gallery: [
    "/bali-rice-terraces-green.jpg",
    "/tanah-lot-temple-sunset-ocean.jpg",
    "/bali-beach-seminyak-palm-trees.jpg",
    "/ubud-monkey-forest-bali.jpg",
    "/bali-traditional-dance-kecak.jpg",
    "/bali-luxury-pool-villa.jpg",
  ],
};
