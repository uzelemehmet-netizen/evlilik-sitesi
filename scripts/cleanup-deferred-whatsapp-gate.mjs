import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FieldPath, FieldValue } from 'firebase-admin/firestore';

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

      if (process.env[key] === undefined || String(process.env[key] || '').trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function defaultServiceAccountFromRepoIfMissing() {
  if (
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE ||
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE
  ) {
    return;
  }

  process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE = path.resolve(projectRoot, 'secrets/firebase-service-account.json');
}

function hasFlag(name) {
  const want = String(name).toLowerCase();
  return process.argv.some((arg) => String(arg).toLowerCase() === want);
}

function getArg(name, fallback = '') {
  const idx = process.argv.findIndex((arg) => arg === name);
  if (idx >= 0 && idx + 1 < process.argv.length) return String(process.argv[idx + 1]);
  return fallback;
}

function toInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.max(1, Math.trunc(n)) : fallback;
}

function chunk(values, size) {
  const out = [];
  for (let i = 0; i < values.length; i += size) out.push(values.slice(i, i + size));
  return out;
}

function toMs(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v?.toMillis === 'function') {
    try {
      return v.toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof v?.seconds === 'number') {
    return Math.floor(v.seconds * 1000 + (typeof v?.nanoseconds === 'number' ? v.nanoseconds / 1e6 : 0));
  }
  return 0;
}

function getNested(obj, parts) {
  let cur = obj;
  for (const part of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur?.[part];
  }
  return cur;
}

const FIELD_SPECS = [
  { path: 'deferredWhatsappRequiredAfterMs', parts: ['deferredWhatsappRequiredAfterMs'] },
  { path: 'whatsappRequirement.requiredAfterMs', parts: ['whatsappRequirement', 'requiredAfterMs'] },
  { path: 'application.deferredWhatsappRequiredAfterMs', parts: ['application', 'deferredWhatsappRequiredAfterMs'] },
  { path: 'application.whatsappRequirement.requiredAfterMs', parts: ['application', 'whatsappRequirement', 'requiredAfterMs'] },
  { path: 'publicProfile.deferredWhatsappRequiredAfterMs', parts: ['publicProfile', 'deferredWhatsappRequiredAfterMs'] },
  { path: 'publicProfile.whatsappRequirement.requiredAfterMs', parts: ['publicProfile', 'whatsappRequirement', 'requiredAfterMs'] },
];

function collectPathsToClear(data) {
  const out = [];
  for (const spec of FIELD_SPECS) {
    const raw = getNested(data, spec.parts);
    if (raw !== undefined) out.push(spec.path);
  }
  return out;
}

async function collectDocs(collectionRef, { pageSize, maxPages }) {
  const docs = [];
  let cursor = null;
  for (let page = 0; page < maxPages; page += 1) {
    let query = collectionRef.orderBy(FieldPath.documentId()).limit(pageSize);
    if (cursor) query = query.startAfter(cursor);
    // eslint-disable-next-line no-await-in-loop
    const snap = await query.get();
    if (snap.empty) break;
    docs.push(...snap.docs);
    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < pageSize) break;
  }
  return docs;
}

async function applyPatches(db, patches) {
  let committed = 0;
  for (const group of chunk(patches, 400)) {
    const batch = db.batch();
    for (const item of group) {
      const payload = {};
      for (const fieldPath of item.paths) payload[fieldPath] = FieldValue.delete();
      batch.update(item.ref, payload);
    }
    // eslint-disable-next-line no-await-in-loop
    await batch.commit();
    committed += group.length;
  }
  return committed;
}

async function main() {
  loadEnvLocal();
  defaultServiceAccountFromRepoIfMissing();

  const apply = hasFlag('--apply');
  const pageSize = toInt(getArg('--page-size', '500'), 500);
  const maxPages = toInt(getArg('--max-pages', '200'), 200);

  const { db, projectId } = getAdmin();

  const [userDocs, appDocs] = await Promise.all([
    collectDocs(db.collection('matchmakingUsers'), { pageSize, maxPages }),
    collectDocs(db.collection('matchmakingApplications'), { pageSize, maxPages }),
  ]);

  const patches = [];
  const byCollection = {
    matchmakingUsers: { docsScanned: userDocs.length, docsToPatch: 0, fieldsToDelete: 0, sample: [] },
    matchmakingApplications: { docsScanned: appDocs.length, docsToPatch: 0, fieldsToDelete: 0, sample: [] },
  };

  for (const doc of userDocs) {
    const paths = collectPathsToClear(doc.data() || {});
    if (!paths.length) continue;
    patches.push({ ref: doc.ref, paths });
    byCollection.matchmakingUsers.docsToPatch += 1;
    byCollection.matchmakingUsers.fieldsToDelete += paths.length;
    if (byCollection.matchmakingUsers.sample.length < 12) byCollection.matchmakingUsers.sample.push({ id: doc.id, paths });
  }

  for (const doc of appDocs) {
    const paths = collectPathsToClear(doc.data() || {});
    if (!paths.length) continue;
    patches.push({ ref: doc.ref, paths });
    byCollection.matchmakingApplications.docsToPatch += 1;
    byCollection.matchmakingApplications.fieldsToDelete += paths.length;
    if (byCollection.matchmakingApplications.sample.length < 12) byCollection.matchmakingApplications.sample.push({ id: doc.id, paths });
  }

  const report = {
    ok: true,
    apply,
    projectId,
    pageSize,
    maxPages,
    totals: {
      docsScanned: userDocs.length + appDocs.length,
      docsToPatch: patches.length,
      fieldsToDelete:
        byCollection.matchmakingUsers.fieldsToDelete + byCollection.matchmakingApplications.fieldsToDelete,
    },
    byCollection,
  };

  if (!apply) {
    console.log(JSON.stringify({ ...report, note: 'dry_run (add --apply to persist changes)' }, null, 2));
    return;
  }

  const patchedDocs = patches.length ? await applyPatches(db, patches) : 0;
  console.log(JSON.stringify({ ...report, patchedDocs }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }, null, 2));
  process.exitCode = 1;
});