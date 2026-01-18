import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.endonezyakasifi.com';

// Ana sabit sayfalar
const staticRoutes = [
  '/',
  '/about',
  '/travel',
  '/tours',
  '/tours/groups',
  '/gallery',
  '/kesfet',
  '/wedding',
  '/youtube',
  '/contact',
  '/privacy',
];

// Tours detay sayfaları (/tours/:id)
const tourIds = ['bali', 'lombok', 'sumatra', 'java', 'komodo', 'sulawesi'];
const tourDetailRoutes = tourIds.map((id) => `/tours/${id}`);

// Keşfet ada sayfaları (/kesfet/:island)
const kesfetIslandIds = ['bali', 'java', 'lombok', 'komodo', 'sulawesi', 'sumatra'];
const kesfetIslandRoutes = kesfetIslandIds.map((id) => `/kesfet/${id}`);

// Keşfet destinasyon detayları (/kesfet/:island/:destination)
// Bu slugglar, KesfetIsland.jsx ve KesfetDestination.jsx içindeki id alanlarıyla uyumludur.
const kesfetDestinationSlugs = [
  // Bali
  { island: 'bali', slug: 'ubud' },
  { island: 'bali', slug: 'kuta' },
  { island: 'bali', slug: 'seminyak' },
  { island: 'bali', slug: 'uluwatu' },
  { island: 'bali', slug: 'nusa-dua' },
  { island: 'bali', slug: 'canggu' },
  { island: 'bali', slug: 'sanur' },
  { island: 'bali', slug: 'munduk' },
  { island: 'bali', slug: 'amed' },
  // Java
  { island: 'java', slug: 'yogyakarta' },
  { island: 'java', slug: 'pangandaran' },
  { island: 'java', slug: 'bandung' },
  { island: 'java', slug: 'banyuwangi' },
  { island: 'java', slug: 'malang' },
  // Lombok
  { island: 'lombok', slug: 'gili-trawangan' },
  { island: 'lombok', slug: 'mount-rinjani' },
  { island: 'lombok', slug: 'senggigi' },
  { island: 'lombok', slug: 'kuta-lombok' },
  { island: 'lombok', slug: 'benang-stokel' },
  // Komodo
  { island: 'komodo', slug: 'komodo-island' },
  { island: 'komodo', slug: 'labuan-bajo' },
  // Sulawesi
  { island: 'sulawesi', slug: 'bunaken' },
  { island: 'sulawesi', slug: 'makassar' },
  { island: 'sulawesi', slug: 'wakatobi' },
  { island: 'sulawesi', slug: 'togean' },
  // Sumatra
  { island: 'sumatra', slug: 'lake-toba' },
  { island: 'sumatra', slug: 'bukit-lawang' },
  { island: 'sumatra', slug: 'mentawai' },
  { island: 'sumatra', slug: 'bukittinggi' },
  { island: 'sumatra', slug: 'kerinci' },
  { island: 'sumatra', slug: 'nias' },
];

const kesfetDestinationRoutes = kesfetDestinationSlugs.map(
  ({ island, slug }) => `/kesfet/${island}/${slug}`
);

const allRoutes = [
  ...staticRoutes,
  ...tourDetailRoutes,
  ...kesfetIslandRoutes,
  ...kesfetDestinationRoutes,
];

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...allRoutes.map((route) => {
    const priority = route === '/' ? '1.0' : '0.8';
    return [
      '  <url>',
      `    <loc>${BASE_URL}${route}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      `    <priority>${priority}</priority>`,
      '  </url>',
    ].join('\n');
  }),
  '</urlset>',
  '',
].join('\n');

const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');

writeFileSync(sitemapPath, xml, 'utf8');

console.log(`Sitemap generated with ${allRoutes.length} URLs at ${sitemapPath}`);
