import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FieldPath } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvLocal() {
  try {
    const envPath = path.join(projectRoot, '.env.local');
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

      if (process.env[key] === undefined || String(process.env[key]).trim() === '') {
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

function hasFlag(name) {
  return process.argv.includes(name);
}

function usage(exitCode = 0) {
  // eslint-disable-next-line no-console
  console.log(`Kullanım:
  node scripts/repair-applications-createdat.mjs [--dryRun] [--batchSize 250] [--maxWrites 5000] [--startAfter <docId>]

Amaç:
  matchmakingApplications koleksiyonunda eksik kalan createdAt / createdAtMs alanlarını doldurur.
  Bu alanlar eksikse, orderBy('createdAt') veya orderBy('createdAtMs') yapılan sorgularda bazı kayıtlar görünmeyebilir.

Not:
  - createdAt/createdAtMs alanı mevcutsa DOKUNMAZ.
  - Eksikse; createdAtMs için en güvenilir kaynak sırası: createdAtMs → createdAt → updatedAtMs → updatedAt → Firestore createTime/updateTime → now.
`);
  process.exit(exitCode);
}

function tsToMs(v) {
  try {
    if (!v) return 0;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v?.toMillis === 'function') return v.toMillis();
    if (typeof v?.seconds === 'number') return Math.floor(v.seconds * 1000);
    return 0;
  } catch {
    return 0;
  }
}

loadEnvLocal();

if (hasFlag('--help') || hasFlag('-h')) usage(0);

const dryRun = hasFlag('--dryRun');
const batchSizeRaw = Number(getArgValue('--batchSize') || '250');
const batchSize = Number.isFinite(batchSizeRaw) ? Math.max(1, Math.min(500, Math.floor(batchSizeRaw))) : 250;
const maxWritesRaw = Number(getArgValue('--maxWrites') || '5000');
const maxWrites = Number.isFinite(maxWritesRaw) ? Math.max(0, Math.floor(maxWritesRaw)) : 5000;
const startAfter = getArgValue('--startAfter') || '';

const firebaseAdminPath = path.join(projectRoot, 'apiRoutes', '_firebaseAdmin.js');
const { getAdmin } = await import(pathToFileURL(firebaseAdminPath).href);
const { db, FieldValue, projectId } = getAdmin();

// eslint-disable-next-line no-console
console.log(`Project: ${projectId || '(unknown)'} | dryRun=${dryRun} | batchSize=${batchSize} | maxWrites=${maxWrites}`);

const col = db.collection('matchmakingApplications');

let scanned = 0;
let writes = 0;
let repaired = 0;
let lastDocId = startAfter;

function pickRepairMs(docSnap, data) {
  const directCreatedAtMs = typeof data?.createdAtMs === 'number' && Number.isFinite(data.createdAtMs) ? data.createdAtMs : 0;
  if (directCreatedAtMs > 0) return directCreatedAtMs;

  const createdAtMs = tsToMs(data?.createdAt);
  if (createdAtMs > 0) return createdAtMs;

  const updatedAtMs = typeof data?.updatedAtMs === 'number' && Number.isFinite(data.updatedAtMs) ? data.updatedAtMs : 0;
  if (updatedAtMs > 0) return updatedAtMs;

  const updatedAtMs2 = tsToMs(data?.updatedAt);
  if (updatedAtMs2 > 0) return updatedAtMs2;

  const createTimeMs = tsToMs(docSnap?.createTime);
  if (createTimeMs > 0) return createTimeMs;

  const updateTimeMs = tsToMs(docSnap?.updateTime);
  if (updateTimeMs > 0) return updateTimeMs;

  return Date.now();
}

while (writes < maxWrites) {
  let q = col.orderBy(FieldPath.documentId()).limit(batchSize);
  if (lastDocId) q = q.startAfter(lastDocId);

  const snap = await q.get();
  if (snap.empty) break;

  const batch = db.batch();
  let batchWrites = 0;

  for (const docSnap of snap.docs) {
    scanned += 1;
    lastDocId = docSnap.id;

    const data = docSnap.data() || {};

    const hasCreatedAtMs = typeof data?.createdAtMs === 'number' && Number.isFinite(data.createdAtMs) && data.createdAtMs > 0;
    const hasCreatedAt = !!data?.createdAt;

    if (hasCreatedAtMs && hasCreatedAt) continue;

    const ms = pickRepairMs(docSnap, data);

    const patch = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMs: Date.now(),
    };

    if (!hasCreatedAtMs) patch.createdAtMs = ms;
    if (!hasCreatedAt) patch.createdAt = new Date(ms);

    // Small audit trail for one-time repair.
    patch.createdAtRepair = {
      at: FieldValue.serverTimestamp(),
      atMs: Date.now(),
      source: 'scripts/repair-applications-createdat.mjs',
    };

    repaired += 1;
    batchWrites += 1;

    if (!dryRun) batch.set(docSnap.ref, patch, { merge: true });

    if (writes + batchWrites >= maxWrites) break;
  }

  if (batchWrites > 0) {
    if (!dryRun) await batch.commit();
    writes += batchWrites;

    // eslint-disable-next-line no-console
    console.log(`Progress: scanned=${scanned} repaired=${repaired} writes=${writes} lastDocId=${lastDocId}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`Progress: scanned=${scanned} (no repairs) lastDocId=${lastDocId}`);
  }

  if (snap.size < batchSize) break;
  if (writes >= maxWrites) break;
}

// eslint-disable-next-line no-console
console.log(`Done. scanned=${scanned} repaired=${repaired} writes=${writes} lastDocId=${lastDocId}`);
