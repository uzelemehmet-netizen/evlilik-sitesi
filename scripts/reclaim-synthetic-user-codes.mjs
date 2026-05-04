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
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined || String(process.env[key] || '').trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function getArg(name, fallback = '') {
  const index = process.argv.indexOf(name);
  if (index < 0 || index + 1 >= process.argv.length) return fallback;
  return String(process.argv[index + 1] || '').trim() || fallback;
}

function safeStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseUcNo(value) {
  const raw = safeStr(value).toUpperCase();
  const match = /^UC-(\d{3,})$/.exec(raw);
  if (!match) return 0;
  const numeric = Number(match[1]);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;
}

loadEnvLocal();

const firebaseAdminPath = path.join(projectRoot, 'apiRoutes', '_firebaseAdmin.js');
const syntheticPath = path.join(projectRoot, 'apiRoutes', '_syntheticTestUser.js');
const userCodePath = path.join(projectRoot, 'apiRoutes', '_matchmakingUserCode.js');

const { getAdmin } = await import(pathToFileURL(firebaseAdminPath).href);
const { isSyntheticTestUserRecord } = await import(pathToFileURL(syntheticPath).href);
const { ensureUserCodeAssigned } = await import(pathToFileURL(userCodePath).href);

const { db, FieldValue } = getAdmin();

const apply = hasFlag('--apply');
const batchSize = Number(getArg('--batchSize', '200'));

let scanned = 0;
let reclaimed = 0;
let lastDocId = '';
const sample = [];

while (true) {
  let query = db.collection('matchmakingUsers').orderBy(FieldPath.documentId()).limit(batchSize);
  if (lastDocId) query = query.startAfter(lastDocId);

  const page = await query.get();
  if (page.empty) break;

  for (const doc of page.docs) {
    lastDocId = doc.id;
    scanned += 1;

    const user = doc.data() || {};
    const synthetic = isSyntheticTestUserRecord({
      uid: doc.id,
      email: user?.authEmail || user?.email || '',
      user,
    });
    if (!synthetic) continue;

    const codeNo =
      (typeof user?.userCodeNo === 'number' && Number.isFinite(user.userCodeNo) ? user.userCodeNo : 0) ||
      (typeof user?.publicProfile?.userCodeNo === 'number' && Number.isFinite(user.publicProfile.userCodeNo)
        ? user.publicProfile.userCodeNo
        : 0) ||
      parseUcNo(user?.userCode || user?.publicProfile?.userCode || '');
    if (!(codeNo > 0)) continue;

    if (sample.length < 20) {
      sample.push({
        uid: doc.id,
        email: user?.authEmail || user?.email || null,
        fullName: user?.fullName || user?.displayName || null,
        userCode: user?.userCode || user?.publicProfile?.userCode || null,
      });
    }

    if (apply) {
      const res = await ensureUserCodeAssigned({ db, FieldValue, uid: doc.id, nowMs: Date.now() });
      if (res?.reason === 'synthetic_test_user') reclaimed += 1;
    } else {
      reclaimed += 1;
    }
  }

  if (page.size < batchSize) break;
}

const countersSnap = await db.collection('matchmakingMeta').doc('userCodeCounters').get().catch(() => null);
const counters = countersSnap?.exists ? countersSnap.data() || {} : {};

console.log(
  JSON.stringify(
    {
      ok: true,
      apply,
      scanned,
      reclaimed,
      releasedFemaleCount: Array.isArray(counters?.releasedFemale) ? counters.releasedFemale.length : 0,
      releasedMaleCount: Array.isArray(counters?.releasedMale) ? counters.releasedMale.length : 0,
      sample,
    },
    null,
    2,
  ),
);