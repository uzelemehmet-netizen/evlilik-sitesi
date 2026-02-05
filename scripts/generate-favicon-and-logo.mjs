import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

function mustExist(p) {
  if (!fs.existsSync(p)) throw new Error(`Dosya bulunamadı: ${p}`);
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

async function writePng({ inputPath, outputPath, size, background = '#ffffff' }) {
  // Not: "background" sadece canvas boşlukları için değil, şeffaf pikseller için de
  // uygulanmalı (arama motoru/favicon preview'larında transparan görünmesin).
  const buf = await sharp(inputPath)
    .ensureAlpha()
    .flatten({ background })
    .resize({ width: size, height: size, fit: 'contain', background })
    .png()
    .toBuffer();
  fs.writeFileSync(outputPath, buf);
  return { outputPath, bytes: buf.length };
}

async function generateFavicon({ srcPngPath, publicDir }) {
  // Google/Chrome için sık kullanılan boyutlar: 16/32/48
  const pngSizes = [16, 32, 48, 64, 192, 512];
  const outPngs = [];

  for (const size of pngSizes) {
    const out = path.join(publicDir, `favicon-${size}x${size}.png`);
    outPngs.push(await writePng({ inputPath: srcPngPath, outputPath: out, size, background: '#ffffff' }));
  }

  // apple-touch-icon (iOS)
  await writePng({
    inputPath: srcPngPath,
    outputPath: path.join(publicDir, 'apple-touch-icon-180x180.png'),
    size: 180,
    background: '#ffffff',
  });

  // favicon.ico (multi-size)
  const icoOut = path.join(publicDir, 'favicon.ico');
  const icoBuf = await pngToIco([
    path.join(publicDir, 'favicon-16x16.png'),
    path.join(publicDir, 'favicon-32x32.png'),
    path.join(publicDir, 'favicon-48x48.png'),
  ]);
  fs.writeFileSync(icoOut, icoBuf);

  return { outPngs, icoOut, icoBytes: icoBuf.length };
}

async function generateBrandSquare({ srcPath, publicDir }) {
  // Site içinde kullanılacak kare logo (beyaz arkaplan)
  const out = path.join(publicDir, 'brand.png');

  // 512 hedef: header'da küçültülür, retina için iyi.
  const buf = await sharp(srcPath)
    .ensureAlpha()
    .flatten({ background: '#ffffff' })
    .resize({ width: 512, height: 512, fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer();

  fs.writeFileSync(out, buf);
  return { out, bytes: buf.length };
}

async function generateBrandSplitFromHorizontal({ srcPath, publicDir }) {
  // Navigasyon için: sembol ayrı, yazı ayrı; tagline yazının altına gelsin.
  // Kaynak genelde yatay: [sembol][Uniqah wordmark]
  const meta = await sharp(srcPath).rotate().metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) throw new Error('brand-horizontal-source ölçüleri okunamadı');

  const square = Math.min(width, height);
  const symbolCrop = { left: 0, top: 0, width: square, height: square };
  const wordmarkCrop = { left: square, top: 0, width: Math.max(1, width - square), height };

  const symbolOut = path.join(publicDir, 'brand-symbol.png');
  const wordmarkOut = path.join(publicDir, 'brand-wordmark.png');

  const symbolBuf = await sharp(srcPath)
    .rotate()
    .extract(symbolCrop)
    .ensureAlpha()
    .flatten({ background: '#ffffff' })
    .resize({ width: 256, height: 256, fit: 'contain', background: '#ffffff' })
    .png()
    .toBuffer();
  fs.writeFileSync(symbolOut, symbolBuf);

  const wordmarkBuf = await sharp(srcPath)
    .rotate()
    .extract(wordmarkCrop)
    .ensureAlpha()
    .flatten({ background: '#ffffff' })
    // Wordmark için yüksekliği sabitleyip genişliği koruyoruz.
    .resize({ height: 96, withoutEnlargement: true })
    .png()
    .toBuffer();
  fs.writeFileSync(wordmarkOut, wordmarkBuf);

  return {
    symbolOut,
    wordmarkOut,
    symbolBytes: symbolBuf.length,
    wordmarkBytes: wordmarkBuf.length,
    meta: { width, height, square },
  };
}

async function main() {
  const repoRoot = process.cwd();
  const publicDir = path.join(repoRoot, 'public');
  ensureDir(publicDir);

  const faviconSrc = path.join(repoRoot, 'public', 'favicon.png');
  const brandSrc = path.join(repoRoot, 'public', 'ChatGPT Image 5 Şub 2026 15_14_20.png');

  mustExist(faviconSrc);
  mustExist(brandSrc);

  const fav = await generateFavicon({ srcPngPath: faviconSrc, publicDir });
  const brand = await generateBrandSquare({ srcPath: brandSrc, publicDir });

  const horizontalSrc = path.join(repoRoot, 'public', 'brand-horizontal-source.jpg');
  let split = null;
  if (fs.existsSync(horizontalSrc)) {
    split = await generateBrandSplitFromHorizontal({ srcPath: horizontalSrc, publicDir });
  }

  console.log('OK');
  console.log('favicon.ico:', fav.icoOut, fav.icoBytes, 'bytes');
  console.log('brand.png:', brand.out, brand.bytes, 'bytes');
  if (split) {
    console.log('brand-symbol.png:', split.symbolOut, split.symbolBytes, 'bytes');
    console.log('brand-wordmark.png:', split.wordmarkOut, split.wordmarkBytes, 'bytes');
  }
}

main().catch((e) => {
  console.error(String(e?.stack || e?.message || e));
  process.exit(1);
});
