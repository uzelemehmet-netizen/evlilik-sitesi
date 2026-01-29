const fs = require('fs');
const path = require('path');

const files = [
  'src/i18nResources/tr.js',
  'src/i18nResources/en.js',
  'src/i18nResources/id.js',
];

function stripToursBlock(source) {
  // Remove everything from the top-level `tours` key up to (but not including) the top-level `contact` key.
  // This covers both `tours` and `tourDetail` blocks which were used by removed pages.
  const pattern = /\r?\n\s{2}tours\s*:\s*\{[\s\S]*?\r?\n\s{2}contact\s*:\s*\{/m;
  if (!pattern.test(source)) return { changed: false, source };
  const next = source.replace(pattern, '\n\n  contact: {');
  return { changed: next !== source, source: next };
}

let changedAny = false;

for (const rel of files) {
  const abs = path.resolve(process.cwd(), rel);
  const original = fs.readFileSync(abs, 'utf8');
  const { changed, source } = stripToursBlock(original);

  if (changed) {
    fs.writeFileSync(abs, source, 'utf8');
    console.log(`[OK] Stripped tours/tourDetail from ${rel}`);
    changedAny = true;
  } else {
    console.log(`[SKIP] No tours block found in ${rel}`);
  }
}

if (!changedAny) {
  console.log('No files changed.');
}
