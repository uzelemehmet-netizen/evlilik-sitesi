import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function isPlainObject(value) {
  return (
    value != null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

function flattenKeys(obj, prefix = '') {
  const out = new Set();
  if (!isPlainObject(obj)) return out;

  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v)) {
      const nested = flattenKeys(v, key);
      for (const nk of nested) out.add(nk);
    } else {
      out.add(key);
    }
  }

  return out;
}

async function loadResource(relPath) {
  const abs = path.resolve(process.cwd(), relPath);
  const mod = await import(pathToFileURL(abs));
  return mod.default;
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next') continue;
      walk(abs, files);
    } else {
      if (!/\.(js|jsx|ts|tsx)$/.test(entry.name)) continue;
      files.push(abs);
    }
  }
  return files;
}

function extractKeysFromSource(source) {
  const keys = new Set();

  // t('a.b.c') / t("a.b.c")
  const tCall = /\bt\(\s*(['"])([^'"\n]+?)\1\s*(?:,|\))/g;
  let m;
  while ((m = tCall.exec(source))) {
    const key = m[2].trim();
    if (!key.includes('${')) keys.add(key);
  }

  // i18nKey="a.b.c" / i18nKey='a.b.c'
  const i18nKeyAttr = /\bi18nKey\s*=\s*(['"])([^'"\n]+?)\1/g;
  while ((m = i18nKeyAttr.exec(source))) {
    const key = m[2].trim();
    if (!key.includes('${')) keys.add(key);
  }

  return keys;
}

function diffKeys(needed, available) {
  const missing = [];
  for (const k of needed) {
    if (!hasKeyOrI18NextVariants(available, k)) missing.push(k);
  }
  missing.sort();
  return missing;
}

function hasKeyOrI18NextVariants(available, key) {
  if (available.has(key)) return true;

  // i18next plural suffixes (resolved when calling t('key', { count }))
  const pluralSuffixes = ['_zero', '_one', '_two', '_few', '_many', '_other'];
  for (const s of pluralSuffixes) {
    if (available.has(`${key}${s}`)) return true;
  }

  // i18next ordinal plural suffixes
  for (const s of pluralSuffixes) {
    if (available.has(`${key}_ordinal${s}`)) return true;
  }

  // i18next context (resolved when calling t('key', { context: 'x' }))
  // We can't know the context value statically, but if any context variant exists
  // we consider the base key satisfied to avoid false positives.
  for (const candidate of [`${key}_male`, `${key}_female`, `${key}_neutral`]) {
    if (available.has(candidate)) return true;
  }

  return false;
}

const files = {
  en: 'src/i18nResources/en.js',
  tr: 'src/i18nResources/tr.js',
  id: 'src/i18nResources/id.js',
};

// Collect used keys from src/
const srcRoot = path.resolve(process.cwd(), 'src');
const srcFiles = walk(srcRoot);

const used = new Set();
for (const f of srcFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const keys = extractKeysFromSource(content);
  for (const k of keys) used.add(k);
}

// eslint-disable-next-line no-console
console.log(`Scanned ${srcFiles.length} files; found ${used.size} used i18n keys`);

const resources = {};
const keySets = {};
for (const [lng, p] of Object.entries(files)) {
  // eslint-disable-next-line no-console
  console.log(`Loading ${lng}… (${p})`);
  resources[lng] = await loadResource(p);
  keySets[lng] = flattenKeys(resources[lng]);
  // eslint-disable-next-line no-console
  console.log(`${lng}: ${keySets[lng].size} available keys`);
}

let hasMissing = false;
const PRINT_LIMIT = Number.parseInt(process.env.I18N_USAGE_AUDIT_LIMIT || '200', 10);
const limit = Number.isFinite(PRINT_LIMIT) ? PRINT_LIMIT : 200;
for (const [lng, available] of Object.entries(keySets)) {
  const missing = diffKeys(used, available);
  if (missing.length) {
    hasMissing = true;
    // eslint-disable-next-line no-console
    console.log(`\nMissing USED keys in ${lng}: ${missing.length}`);
    for (const k of missing.slice(0, limit)) {
      // eslint-disable-next-line no-console
      console.log(`- ${k}`);
    }
    if (missing.length > limit) {
      // eslint-disable-next-line no-console
      console.log(`… and ${missing.length - limit} more`);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`\nMissing USED keys in ${lng}: 0`);
  }
}

process.exitCode = hasMissing ? 2 : 0;
