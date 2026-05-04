import fs from 'node:fs';
import path from 'node:path';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function loadEnvLocal() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      const current = process.env[key];
      if (current === undefined || String(current).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return '';
  return String(next).trim();
}

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function usage(exitCode = 0) {
  console.log('Kullanım: node scripts/admin-fullname-lookup.mjs --name "Ad Soyad"');
  process.exit(exitCode);
}

loadEnvLocal();

const rawName = getArgValue('--name');
if (!rawName) usage(1);

const target = normalizeName(rawName);
if (!target) usage(1);

const { db } = getAdmin();

async function scanCollection(name, fields) {
  const out = [];
  let lastDoc = null;

  while (true) {
    let query = db.collection(name).limit(500);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snap = await query.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      const data = doc.data() || {};
      for (const field of fields) {
        if (normalizeName(data?.[field]) !== target) continue;

        out.push({
          collection: name,
          id: doc.id,
          field,
          fullName: data?.fullName || null,
          displayName: data?.displayName || null,
          username: data?.username || null,
          usernameLower: data?.usernameLower || null,
          userId: data?.userId || null,
          status: data?.status || null,
        });
        break;
      }

      lastDoc = doc;
    }

    if (snap.size < 500) break;
  }

  return out;
}

const matches = [
  ...(await scanCollection('matchmakingUsers', ['fullName', 'displayName'])),
  ...(await scanCollection('matchmakingApplications', ['fullName', 'displayName'])),
];

console.log(
  JSON.stringify(
    {
      query: { rawName, normalizedName: target },
      found: matches.length > 0,
      count: matches.length,
      matches,
    },
    null,
    2
  )
);