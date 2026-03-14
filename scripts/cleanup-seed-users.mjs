import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FieldPath } from 'firebase-admin/firestore';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

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

      const current = process.env[key];
      const shouldOverride = key.startsWith('FIREBASE_SERVICE_ACCOUNT');
      if (shouldOverride || current === undefined || String(current).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function hasFlag(name) {
  const n = String(name).toLowerCase();
  return process.argv.some((a) => String(a).toLowerCase() === n);
}

function getArg(name, fallback = '') {
  const n = String(name);
  const idx = process.argv.findIndex((a) => a === n);
  if (idx >= 0 && idx + 1 < process.argv.length) return String(process.argv[idx + 1]);
  return fallback;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function collectAll(query, { maxPages = 200 } = {}) {
  const docs = [];
  let q = query;
  for (let i = 0; i < maxPages; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const snap = await q.get();
    if (snap.empty) break;
    docs.push(...snap.docs);
    const last = snap.docs[snap.docs.length - 1];
    q = q.startAfter(last);
    if (snap.size < 500) break;
  }
  return docs;
}

async function commitDeletes(db, refs, { apply, label }) {
  const batches = chunk(refs, 450);
  let deleted = 0;
  for (const group of batches) {
    if (!apply) {
      deleted += group.length;
      continue;
    }
    const batch = db.batch();
    for (const ref of group) batch.delete(ref);
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
    deleted += group.length;
  }
  return { deleted, batches: batches.length, label };
}

async function main() {
  loadEnvLocal();

  const apply = hasFlag('--apply');
  const prefix = getArg('--prefix', 'seed_');
  const keepTest = true; // explicit: do not delete test* accounts

  const { db } = getAdmin();

  const prefixStart = prefix;
  const prefixEnd = `${prefix}\uf8ff`;

  // 1) Collect seed matchmakingUsers by document id prefix
  const usersQuery = db
    .collection('matchmakingUsers')
    .orderBy(FieldPath.documentId())
    .startAt(prefixStart)
    .endAt(prefixEnd)
    .limit(500);

  const userDocs = await collectAll(usersQuery);
  const seedUserIds = userDocs
    .map((d) => String(d.id))
    .filter((uid) => uid.startsWith(prefix))
    .filter((uid) => {
      if (!keepTest) return true;
      return !uid.toLowerCase().includes('test');
    });

  const seedUserIdSet = new Set(seedUserIds);

  // 2) Collect matchmakingApplications where userId has prefix OR seedTag==mk_seed
  const appsByUserIdQuery = db
    .collection('matchmakingApplications')
    .where('userId', '>=', prefixStart)
    .where('userId', '<=', prefixEnd)
    .orderBy('userId')
    .limit(500);

  const appDocsByUid = await collectAll(appsByUserIdQuery).catch(() => []);

  const appsBySeedTagQuery = db
    .collection('matchmakingApplications')
    .where('seedTag', '==', 'mk_seed')
    .limit(500);

  const appDocsBySeedTag = await collectAll(appsBySeedTagQuery).catch(() => []);

  const appRefs = new Map();
  for (const d of [...appDocsByUid, ...appDocsBySeedTag]) {
    const data = d.data() || {};
    const uid = String(data.userId || '');
    if (uid && uid.startsWith(prefix) && keepTest && uid.toLowerCase().includes('test')) continue;
    if (uid && uid.startsWith(prefix)) appRefs.set(d.ref.path, d.ref);
    if (String(data.seedTag || '') === 'mk_seed') appRefs.set(d.ref.path, d.ref);
    if (String(data.seedBatchId || '')) appRefs.set(d.ref.path, d.ref);
  }

  // 3) Collect matchmakingMatches where aUserId/bUserId has prefix OR seedTag==mk_seed
  const matchRefs = new Map();

  const matchesByAQuery = db
    .collection('matchmakingMatches')
    .where('aUserId', '>=', prefixStart)
    .where('aUserId', '<=', prefixEnd)
    .orderBy('aUserId')
    .limit(500);

  const matchDocsByA = await collectAll(matchesByAQuery).catch(() => []);

  const matchesByBQuery = db
    .collection('matchmakingMatches')
    .where('bUserId', '>=', prefixStart)
    .where('bUserId', '<=', prefixEnd)
    .orderBy('bUserId')
    .limit(500);

  const matchDocsByB = await collectAll(matchesByBQuery).catch(() => []);

  const matchesBySeedTagQuery = db
    .collection('matchmakingMatches')
    .where('seedTag', '==', 'mk_seed')
    .limit(500);

  const matchDocsBySeedTag = await collectAll(matchesBySeedTagQuery).catch(() => []);

  for (const d of [...matchDocsByA, ...matchDocsByB, ...matchDocsBySeedTag]) {
    const data = d.data() || {};
    const a = String(data.aUserId || '');
    const b = String(data.bUserId || '');

    const aSeed = a.startsWith(prefix) && (!keepTest || !a.toLowerCase().includes('test'));
    const bSeed = b.startsWith(prefix) && (!keepTest || !b.toLowerCase().includes('test'));

    if (aSeed || bSeed || String(data.seedTag || '') === 'mk_seed' || String(data.seedBatchId || '')) {
      matchRefs.set(d.ref.path, d.ref);
    }
  }

  // 4) Delete the seed matchmakingUsers themselves
  const userRefs = seedUserIds.map((uid) => db.collection('matchmakingUsers').doc(uid));

  const report = {
    ok: true,
    apply,
    prefix,
    protectTestAccounts: keepTest,
    counts: {
      matchmakingUsers: userRefs.length,
      matchmakingApplications: appRefs.size,
      matchmakingMatches: matchRefs.size,
    },
    sample: {
      userIds: seedUserIds.slice(0, 12),
      applicationDocPaths: Array.from(appRefs.keys()).slice(0, 8),
      matchDocPaths: Array.from(matchRefs.keys()).slice(0, 8),
    },
  };

  if (!apply) {
    console.log(JSON.stringify({ ...report, note: 'dry_run (add --apply to delete)' }, null, 2));
    return;
  }

  const results = [];
  results.push(await commitDeletes(db, Array.from(matchRefs.values()), { apply, label: 'matchmakingMatches' }));
  results.push(await commitDeletes(db, Array.from(appRefs.values()), { apply, label: 'matchmakingApplications' }));
  results.push(await commitDeletes(db, userRefs, { apply, label: 'matchmakingUsers' }));

  console.log(JSON.stringify({ ...report, deleted: results }, null, 2));
}

main().catch((e) => {
  console.error('cleanup-seed-users failed:', e?.message || e);
  process.exitCode = 1;
});
