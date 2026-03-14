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
      // Arrays and primitives are treated as leaf values.
      out.add(key);
    }
  }

  return out;
}

function diffKeys(a, b) {
  // returns items in a not in b
  const missing = [];
  for (const k of a) {
    if (!b.has(k)) missing.push(k);
  }
  missing.sort();
  return missing;
}

async function loadResource(relPath) {
  const abs = path.resolve(process.cwd(), relPath);
  const mod = await import(pathToFileURL(abs));
  return mod.default;
}

const files = {
  en: 'src/i18nResources/en.js',
  tr: 'src/i18nResources/tr.js',
  id: 'src/i18nResources/id.js',
};

const resources = {};
for (const [lng, p] of Object.entries(files)) {
  // eslint-disable-next-line no-console
  console.log(`Loading ${lng}… (${p})`);
  resources[lng] = await loadResource(p);
}

const keySets = {};
for (const [lng, res] of Object.entries(resources)) {
  keySets[lng] = flattenKeys(res);
  // eslint-disable-next-line no-console
  console.log(`${lng}: ${keySets[lng].size} keys`);
}

const union = new Set();
for (const set of Object.values(keySets)) {
  for (const k of set) union.add(k);
}

// eslint-disable-next-line no-console
console.log(`\nUnion: ${union.size} keys`);

let hasMissing = false;
for (const [lng, set] of Object.entries(keySets)) {
  const missing = diffKeys(union, set);
  if (missing.length) {
    hasMissing = true;
    // eslint-disable-next-line no-console
    console.log(`\nMissing in ${lng}: ${missing.length}`);
    for (const k of missing.slice(0, 200)) {
      // eslint-disable-next-line no-console
      console.log(`- ${k}`);
    }
    if (missing.length > 200) {
      // eslint-disable-next-line no-console
      console.log(`… and ${missing.length - 200} more`);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`\nMissing in ${lng}: 0`);
  }
}

process.exitCode = hasMissing ? 2 : 0;
