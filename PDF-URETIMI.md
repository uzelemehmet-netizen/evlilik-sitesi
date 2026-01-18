# Broşür PDF Üretimi (Playwright)

Bu projede broşür PDF’leri, `public/docs/*.html` sayfalarının Playwright ile A4 PDF’e çevrilmesiyle üretilir.

## 1) Kurulum

### Windows (PowerShell)
- `npm run playwright:install`

### WSL / Linux
- Tercihen (gerekli sistem bağımlılıklarını da kurar): `npm run playwright:install:deps`
- Eğer `--with-deps` izin/sudo isterse: `sudo` ile çalıştırın veya sadece tarayıcıyı kurun: `npm run playwright:install`

Not: `libnspr4.so` gibi “shared library missing” hataları alırsanız, sistem bağımlılıklarını kurmanız gerekir:
- `sudo npx playwright install-deps chromium`

## 2) PDF üret

- Normal: `npm run generate:brochure-pdfs`
- Zorunlu (tarayıcı yoksa hata verdir): `npm run generate:brochure-pdfs:strict`

PDF’ler şu klasöre yazılır:
- `public/docs/pdf/`

## 3) Build ile ilişki

Varsayılan `npm run build` içinde PDF üretimi adımı vardır. Eğer Playwright tarayıcısı kurulu değilse script PDF üretimini **atlayabilir** (ortama göre), ama tarayıcı kuruluysa üretir.
