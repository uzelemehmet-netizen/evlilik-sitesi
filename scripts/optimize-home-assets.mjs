import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');

const files = {
  logoPng: path.join(publicDir, 'ChatGPT Image 17 Şub 2026 14_35_26.png'),
  logoWebp: path.join(publicDir, 'brand-logo.webp'),
  heroJpg: path.join(publicDir, 'pexels-fotobi-12900522.jpg'),
  heroWebp: path.join(publicDir, 'pexels-fotobi-12900522.webp'),
  heroAvif: path.join(publicDir, 'pexels-fotobi-12900522.avif'),
  heroTmp: path.join(publicDir, 'pexels-fotobi-12900522.__tmp.jpg'),

  homeBeachJpg: path.join(publicDir, 'bali-beach-seminyak-palm-trees.jpg'),
  homeBeachWebp: path.join(publicDir, 'bali-beach-seminyak-palm-trees.webp'),
  homeBeachAvif: path.join(publicDir, 'bali-beach-seminyak-palm-trees.avif'),

  homeRiceJpg: path.join(publicDir, 'bali-rice-terraces-green.jpg'),
  homeRiceWebp: path.join(publicDir, 'bali-rice-terraces-green.webp'),
  homeRiceAvif: path.join(publicDir, 'bali-rice-terraces-green.avif'),
};

const fmtBytes = (b) => {
  if (!Number.isFinite(b)) return '-';
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

async function statSafe(p) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

async function main() {
  console.log('Optimizing assets in public/ …');

  const logoStat = await statSafe(files.logoPng);
  if (!logoStat) throw new Error(`Logo source not found: ${files.logoPng}`);

  const heroStat = await statSafe(files.heroJpg);
  if (!heroStat) throw new Error(`Hero source not found: ${files.heroJpg}`);

  console.log('Before:');
  console.log(`- logo png: ${fmtBytes(logoStat.size)}`);
  console.log(`- hero jpg: ${fmtBytes(heroStat.size)}`);

  // 1) Logo: webp (sufficient for max ~320px display; generate ~640px for retina)
  await sharp(files.logoPng)
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(files.logoWebp);

  // 2) Hero: recompress in-place (keep same filename for compatibility)
  await sharp(files.heroJpg)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 72, progressive: true })
    .toFile(files.heroTmp);

  // Replace original hero with optimized version
  await fs.rename(files.heroTmp, files.heroJpg);

  // 3) Hero modern formats (same basename; used by CSS image-set)
  await sharp(files.heroJpg)
    .webp({ quality: 70, effort: 5 })
    .toFile(files.heroWebp);

  await sharp(files.heroJpg)
    .avif({ quality: 48, effort: 6 })
    .toFile(files.heroAvif);

  // 4) Home cards (optional): generate modern formats without replacing originals
  const homeBeachStat = await statSafe(files.homeBeachJpg);
  if (homeBeachStat) {
    await sharp(files.homeBeachJpg)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 70, effort: 5 })
      .toFile(files.homeBeachWebp);

    await sharp(files.homeBeachJpg)
      .resize({ width: 1600, withoutEnlargement: true })
      .avif({ quality: 48, effort: 6 })
      .toFile(files.homeBeachAvif);
  }

  const homeRiceStat = await statSafe(files.homeRiceJpg);
  if (homeRiceStat) {
    await sharp(files.homeRiceJpg)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 70, effort: 5 })
      .toFile(files.homeRiceWebp);

    await sharp(files.homeRiceJpg)
      .resize({ width: 1600, withoutEnlargement: true })
      .avif({ quality: 48, effort: 6 })
      .toFile(files.homeRiceAvif);
  }

  const logoWebpStat = await statSafe(files.logoWebp);
  const heroAfterStat = await statSafe(files.heroJpg);
  const heroWebpStat = await statSafe(files.heroWebp);
  const heroAvifStat = await statSafe(files.heroAvif);
  const homeBeachWebpStat = await statSafe(files.homeBeachWebp);
  const homeBeachAvifStat = await statSafe(files.homeBeachAvif);
  const homeRiceWebpStat = await statSafe(files.homeRiceWebp);
  const homeRiceAvifStat = await statSafe(files.homeRiceAvif);

  console.log('After:');
  console.log(`- logo webp: ${fmtBytes(logoWebpStat?.size)}`);
  console.log(`- hero jpg: ${fmtBytes(heroAfterStat?.size)}`);
  console.log(`- hero webp: ${fmtBytes(heroWebpStat?.size)}`);
  console.log(`- hero avif: ${fmtBytes(heroAvifStat?.size)}`);
  if (homeBeachStat) {
    console.log(`- home beach webp: ${fmtBytes(homeBeachWebpStat?.size)}`);
    console.log(`- home beach avif: ${fmtBytes(homeBeachAvifStat?.size)}`);
  }
  if (homeRiceStat) {
    console.log(`- home rice webp: ${fmtBytes(homeRiceWebpStat?.size)}`);
    console.log(`- home rice avif: ${fmtBytes(homeRiceAvifStat?.size)}`);
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error('optimize-home-assets failed:', e);
  process.exitCode = 1;
});
