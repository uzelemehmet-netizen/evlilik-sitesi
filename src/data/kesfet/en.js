export const kesfetDataEn = {
  islands: [
    {
      id: "bali",
      name: "Bali",
      description:
        "Temple incense, the green of rice fields, and orange sunset beaches can all fit into a single day; in Bali, every morning feels like the first page of a new story. Between spa rituals, hidden waterfalls, and laid‑back coastal towns, you slowly fall into the island’s rhythm.",
      image: {
        storageKey: "bali-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 9,
      highlights: ["Temples", "Beaches", "Rice Terraces"],
      tags: ["balayi", "aile"],
    },
    {
      id: "java",
      name: "Java",
      description:
        "Temples rising through morning mist under the shadow of active volcanoes give way to lively streets and street food at night. Around every corner, Java lets you feel Indonesia’s modern face and its centuries‑old traditions at the same time.",
      image: {
        storageKey: "java-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 5,
      highlights: ["Borobudur", "Volcanoes", "Jakarta"],
      tags: ["macera"],
    },
    {
      id: "lombok",
      name: "Lombok",
      description:
        "The silhouette of Mount Rinjani behind long, quiet beaches and fishing boats drifting through the day… Lombok is for those who want to slow down away from the crowds—calmer than Bali, but just as mesmerizing.",
      image: {
        storageKey: "lombok-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 5,
      highlights: ["Mt. Rinjani", "Gili Islands", "Waterfalls"],
      tags: ["sakin", "macera"],
    },
    {
      id: "komodo",
      name: "Komodo",
      description:
        "Pink beaches, turquoise bays, and Komodo dragons you’re used to seeing only in documentaries… This island chain opens the door to a world that feels unreal—yet is completely real, from dive sites to sunset cruises.",
      image: {
        storageKey: "komodo-hero",
        defaultUrl:
          "https://images.pexels.com/photos/11896657/pexels-photo-11896657.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 2,
      highlights: ["Komodo Dragons", "Labuan Bajo"],
      tags: ["macera"],
    },
    {
      id: "sulawesi",
      name: "Sulawesi",
      description:
        "From Toraja ceremonies in mountain villages to world‑famous coral reefs, Sulawesi feels like a long journey. Each stop reveals a different culture, landscape, and story; the island asks you to explore slowly, without rushing.",
      image: {
        storageKey: "sulawesi-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 4,
      highlights: ["Toraja", "Bunaken", "Traditional Houses"],
      tags: ["macera"],
    },
    {
      id: "sumatra",
      name: "Sumatra",
      description:
        "Villages tucked between misty mountains, deep rainforests, and orangutans roaming freely among the trees… In Sumatra, nature shows itself at its wildest and purest, inviting you into a different discovery at every turn.",
      image: {
        storageKey: "sumatra-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      destinationCount: 6,
      highlights: ["Lake Toba", "Orangutans", "Surf"],
      tags: ["macera", "sakin"],
    },
  ],

  islandData: {
    bali: {
      name: "Bali",
      description:
        "Bali stands out with its magnificent temples, lush rice terraces, and world‑famous beaches—an island that draws visitors in with its nature and calm atmosphere.",
      heroImage: {
        storageKey: "bali-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "10–14 days (3–4 areas)",
        budget: "$$ - $$$",
        vibe: "A balance of spa, temples, and beaches",
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
            "The spiritual heart of Bali—calm yet full days among rice terraces, mystical temples, and the Monkey Forest",
          rating: 4.8,
          activities: ["Temples", "Rice Terraces", "Yoga", "Spa"],
          crowd: "Calm & spiritual",
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
            "Bali’s liveliest coastline—perfect for your first surf lesson or catching sunset at busy beach bars",
          rating: 4.8,
          activities: ["Surf", "Sunset", "Beach", "Water Sports"],
          crowd: "Busy & lively",
        },
        {
          id: "seminyak",
          name: "Seminyak",
          description:
            "A more stylish Bali experience with designer boutique hotels, chic restaurants, and beach clubs packed at sunset",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Beach", "Surf", "Shopping", "Restaurants"],
          crowd: "Chic & lively",
        },
        {
          id: "uluwatu",
          name: "Uluwatu",
          description:
            "Cliffside temple above the ocean, legendary surf breaks, and the Kecak dance at sunset—Bali at its most dramatic",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Temple", "Surf", "Cliffs", "Kecak Dance"],
          crowd: "Crowded but iconic",
        },
        {
          id: "nusa-dua",
          name: "Nusa Dua",
          description:
            "A comfort zone in a quiet, safe, well‑kept resort area—calm sea plus water sports in one place",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Luxury Resorts", "Water Sports", "Golf", "Spa"],
          crowd: "Family‑friendly & organized",
        },
        {
          id: "canggu",
          name: "Canggu",
          description:
            "Surfboards, laptop‑friendly digital nomads, and third‑wave coffee—Bali’s youngest and coolest neighborhood",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Surf", "Beach Clubs", "Yoga", "Cafés"],
          crowd: "Young & trendy",
        },
        {
          id: "sanur",
          name: "Sanur",
          description:
            "An old‑school beach town for sunrise walks, easy beach time with kids, and a slower vacation rhythm",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Sunrise", "Cycling", "Diving", "Beach"],
          crowd: "Quiet for families",
        },
        {
          id: "munduk",
          name: "Munduk",
          description:
            "A route of misty waterfalls, coffee plantations, and cool air—perfect for Bali’s mountain‑village vibe",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.8,
          activities: ["Waterfalls", "Trekking", "Coffee Tours", "Nature"],
          crowd: "Cool & peaceful",
        },
        {
          id: "amed",
          name: "Amed",
          description:
            "A tranquil fishing town with quiet black‑sand beaches, shore‑entry snorkeling reefs, and a calm vibe for divers",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Diving", "Snorkeling", "Beach", "Traditional Villages"],
          crowd: "Very quiet",
        },
      ],
    },

    java: {
      name: "Java",
      description:
        "Indonesia’s cultural and economic heart—full of spectacular volcanoes and historic temples.",
      heroImage: {
        storageKey: "java-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "7–10 days (2–3 cities)",
        budget: "$$",
        vibe: "Culture, cities, and volcanoes",
      },
      destinations: [
        {
          id: "yogyakarta",
          name: "Yogyakarta",
          description:
            "Java’s cultural capital—UNESCO temples like Borobudur and Prambanan, plus street art and student‑city energy",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Borobudur", "Prambanan", "Palace", "Batik"],
        },
        {
          id: "pangandaran",
          name: "Pangandaran",
          description:
            "A seaside town that keeps the sea‑and‑nature balance: quiet beaches, small beachfront guesthouses, and a lush forest backdrop",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Diving", "Snorkeling", "Nature", "Seafood"],
        },
        {
          id: "bandung",
          name: "Bandung",
          description:
            "Nicknamed ‘Paris van Java’: cool mountain air, design cafés, outlet shopping, and volcanic landscapes—classic weekend escape",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Shopping", "Tea Plantations", "Volcano", "Cafés"],
        },
        {
          id: "banyuwangi",
          name: "Banyuwangi",
          description:
            "A nature‑first route: hike Kawah Ijen at midnight to see the blue fire, then surf nearby beaches the next day",
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
            "A smooth blend of city and nature: cool climate, colorful flower gardens, and waterfalls spread across the surrounding area",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Gardens", "Waterfalls", "Trekking", "Cafés"],
        },
      ],
    },

    lombok: {
      name: "Lombok",
      description:
        "Bali’s quieter neighbor, famous for Mount Rinjani and the paradise‑like Gili Islands.",
      heroImage: {
        storageKey: "lombok-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "7–10 days (2–3 areas)",
        budget: "$$",
        vibe: "Quiet bays and surf",
      },
      destinations: [
        {
          id: "gili-trawangan",
          name: "Gili Trawangan",
          description:
            "Bike around the island by day, snorkel for turtles, then keep going at night with music in beach bars—small but energetic",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.8,
          activities: ["Diving", "Snorkeling", "Parties", "Cycling"],
        },
        {
          id: "mount-rinjani",
          name: "Mount Rinjani",
          description:
            "Lombok’s legendary volcano: challenging climbs with crater‑lake views, and sunrise above the clouds",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Trekking", "Volcano", "Lake", "Camping"],
        },
        {
          id: "senggigi",
          name: "Senggigi",
          description:
            "Lombok’s classic resort strip: palm‑lined beaches, sunset views along the coastal road, and boat trips to the Gili Islands",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Beach", "Sunset", "Snorkeling", "Resorts"],
        },
        {
          id: "kuta-lombok",
          name: "Kuta Lombok",
          description:
            "White‑sand bays—many still untouched—plus surf spots and hill viewpoints with mountain‑to‑sea panoramas; a calmer ‘pre‑Bali’ vibe",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Surf", "Beach", "Trekking", "Photography"],
        },
        {
          id: "benang-stokel",
          name: "Benang Stokel Waterfall",
          description:
            "Multi‑tiered pools hidden after short forest walks—cool and refreshing",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Waterfall", "Trekking", "Swimming", "Picnic"],
        },
      ],
    },

    komodo: {
      name: "Komodo",
      description: "A unique island world, famous for the Komodo dragon.",
      heroImage: {
        storageKey: "komodo-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/11896657/pexels-photo-11896657.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "3–4 days (boat tour)",
        budget: "$$$ (with tour)",
        vibe: "Pure adventure & national park",
      },
      destinations: [
        {
          id: "komodo-island",
          name: "Komodo Island",
          description:
            "A national‑park island where you walk guided trails to see Komodo dragons in the wild—raw nature on both land and sea",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 5.0,
          activities: ["Komodo Dragons", "Trekking", "Wildlife", "Safari"],
        },
        {
          id: "labuan-bajo",
          name: "Labuan Bajo",
          description:
            "The gateway port for Komodo tours: boat trips by day, and sunset hikes to viewpoints above the town at night",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.4,
          activities: ["Boat Trips", "Diving", "Sunset", "Seafood"],
        },
      ],
    },

    sulawesi: {
      name: "Sulawesi",
      description:
        "Known for its distinctive shape, Sulawesi offers Toraja culture and outstanding dive sites.",
      heroImage: {
        storageKey: "sulawesi-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "8–12 days (2–3 areas)",
        budget: "$$",
        vibe: "Toraja culture and diving",
      },
      destinations: [
        {
          id: "bunaken",
          name: "Bunaken",
          description:
            "One of the world’s top dive destinations—wall dives, vibrant coral reefs, and a chance to swim with turtles",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Diving", "Snorkeling", "Marine Life", "Boat Trips"],
        },
        {
          id: "makassar",
          name: "Makassar",
          description:
            "South Sulawesi’s entry point: sunset walks on Losari Beach, historic port vibes, and richly spiced seafood dinners",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.4,
          activities: ["Historic Sites", "Seafood", "Beach", "Fort"],
        },
        {
          id: "wakatobi",
          name: "Wakatobi",
          description:
            "Reached by plane + boat, Wakatobi is a dream for serious divers: clear waters and nearly untouched coral reefs",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 5.0,
          activities: ["Diving", "Snorkeling", "Resorts", "Marine Life"],
        },
        {
          id: "togean",
          name: "Togean Islands",
          description:
            "An isolated island group where electricity and internet are limited, time slows down in glass‑clear bays, and there’s even a jellyfish lake",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Islands", "Snorkeling", "Jellyfish Lake", "Beach"],
        },
      ],
    },

    sumatra: {
      name: "Sumatra",
      description:
        "Home to rainforests, Lake Toba, and wild orangutans.",
      heroImage: {
        storageKey: "sumatra-hero-dest-hero",
        defaultUrl:
          "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=1200",
      },
      meta: {
        stay: "10–14 days (2–3 areas)",
        budget: "$$",
        vibe: "Rainforest and lake escape",
      },
      destinations: [
        {
          id: "lake-toba",
          name: "Lake Toba",
          description:
            "A massive lake filling a supervolcano crater—plus Samosir Island in the middle and Batak villages along the shore",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.8,
          activities: ["Lake", "Island", "Batak Culture", "Cycling"],
        },
        {
          id: "bukit-lawang",
          name: "Bukit Lawang",
          description:
            "Guided jungle treks with a chance to see wild orangutans, plus riverside bungalows for nights with nature’s soundtrack",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.9,
          activities: ["Orangutans", "Trekking", "Rainforest", "Rafting"],
        },
        {
          id: "mentawai",
          name: "Mentawai Islands",
          description:
            "An isolated chain with surf camps reached by boat, some of the world’s most consistent waves, and living local tribal culture",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Surf", "Boat Trips", "Culture", "Beach"],
        },
        {
          id: "bukittinggi",
          name: "Bukittinggi",
          description:
            "A characterful highland city: cool air, Minangkabau architecture, and a canyon cutting through town",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.6,
          activities: ["Culture", "Traditional Houses", "Canyon", "Market"],
        },
        {
          id: "kerinci",
          name: "Kerinci",
          description:
            "A tough but rewarding route: long treks toward Indonesia’s highest peak, with tea plantations across the slopes",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/3601422/pexels-photo-3601422.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.7,
          activities: ["Volcano Climb", "Tea Plantations", "Waterfalls", "Wildlife"],
        },
        {
          id: "nias",
          name: "Nias Island",
          description:
            "A mix of culture and adventure: powerful surf, stone‑jumping shows in village squares, and megalithic heritage",
          image: {
            defaultUrl:
              "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=600",
          },
          rating: 4.5,
          activities: ["Surf", "Culture", "War Dances", "Music", "Stone Jumping", "Beach"],
        },
      ],
    },
  },
};
