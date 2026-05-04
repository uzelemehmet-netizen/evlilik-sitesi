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

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asMs(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v && typeof v.toMillis === 'function') {
    try {
      return v.toMillis();
    } catch {
      return 0;
    }
  }
  if (v && typeof v.seconds === 'number' && Number.isFinite(v.seconds)) return v.seconds * 1000;
  if (v && typeof v._seconds === 'number' && Number.isFinite(v._seconds)) {
    const nanos = typeof v._nanoseconds === 'number' && Number.isFinite(v._nanoseconds) ? v._nanoseconds : 0;
    return v._seconds * 1000 + Math.floor(nanos / 1000000);
  }
  return 0;
}

function usage(exitCode = 0) {
  console.log(`Kullanim:
  node scripts/backfill-held-match-messages.mjs [--apply] [--batchSize 100] [--maxMatches 0] [--startAfter <matchId>] [--matchId <matchId>]

Aciklama:
  Eski delivery.state=held match mesajlarini delivered durumuna tasir.
  Varsayilan mod dry-run'dir; sadece sayim ve ornek doker.
`);
  process.exit(exitCode);
}

loadEnvLocal();

if (hasFlag('--help') || hasFlag('-h')) usage(0);

const apply = hasFlag('--apply');
const batchSize = Number(getArgValue('--batchSize') || '100');
const maxMatches = Number(getArgValue('--maxMatches') || '0');
const startAfter = safeStr(getArgValue('--startAfter'));
const onlyMatchId = safeStr(getArgValue('--matchId'));

if (!Number.isFinite(batchSize) || batchSize <= 0 || batchSize > 500) {
  console.error('Gecersiz --batchSize (1..500)');
  process.exit(1);
}

if (!Number.isFinite(maxMatches) || maxMatches < 0) {
  console.error('Gecersiz --maxMatches');
  process.exit(1);
}

const firebaseAdminPath = path.join(projectRoot, 'apiRoutes', '_firebaseAdmin.js');
const { getAdmin } = await import(pathToFileURL(firebaseAdminPath).href);
const { db, FieldValue, projectId } = getAdmin();

const matchesCol = db.collection('matchmakingMatches');

let scannedMatches = 0;
let affectedMatches = 0;
let releasedMessages = 0;
let lastMatchId = startAfter || '';
const samples = [];

async function releaseHeldForMatch(docSnap, { applyChanges }) {
  const match = docSnap.data() || {};
  const matchId = docSnap.id;
  const heldSnap = await docSnap.ref.collection('messages').where('delivery.state', '==', 'held').limit(500).get();
  const heldDocs = heldSnap.docs || [];
  if (!heldDocs.length) return { matchId, released: 0, latestHeldMs: 0 };

  let latestHeldMs = 0;
  let latestHeldPreview = '';
  let latestHeldSenderUid = '';

  for (const heldDoc of heldDocs) {
    const data = heldDoc.data() || {};
    const createdAtMs = asMs(data?.createdAtMs) || asMs(data?.createdAt);
    if (createdAtMs >= latestHeldMs) {
      latestHeldMs = createdAtMs;
      latestHeldPreview = safeStr(data?.text).slice(0, 120);
      latestHeldSenderUid = safeStr(data?.userId);
    }
  }

  if (samples.length < 20) {
    samples.push({
      matchId,
      released: heldDocs.length,
      latestHeldMs: latestHeldMs || null,
      latestHeldSenderUid: latestHeldSenderUid || null,
      latestHeldPreview: latestHeldPreview || null,
    });
  }

  if (!applyChanges) {
    return { matchId, released: heldDocs.length, latestHeldMs };
  }

  const now = Date.now();
  const batch = db.batch();
  for (const heldDoc of heldDocs) {
    batch.set(
      heldDoc.ref,
      {
        delivery: {
          state: 'delivered',
          deliveredAt: FieldValue.serverTimestamp(),
          deliveredAtMs: now,
          migration: 'backfill-held-match-messages',
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: now,
      },
      { merge: true }
    );
  }

  const currentUpdatedAtMs = asMs(match?.updatedAtMs) || asMs(match?.updatedAt);
  const currentAnyMs = asMs(match?.chatLastMessageAtMsAny);
  const patch = {
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtMs: Math.max(now, currentUpdatedAtMs, latestHeldMs || 0),
  };

  if ((latestHeldMs || 0) > currentAnyMs) {
    patch.chatLastMessageAtMsAny = latestHeldMs;
    if (latestHeldSenderUid) patch.chatLastMessageByUid = latestHeldSenderUid;
    if (latestHeldPreview) patch.chatLastMessagePreview = latestHeldPreview;
  }

  batch.set(docSnap.ref, patch, { merge: true });
  await batch.commit();

  return { matchId, released: heldDocs.length, latestHeldMs };
}

console.log(
  JSON.stringify(
    {
      ok: true,
      projectId: projectId || null,
      mode: apply ? 'apply' : 'dry-run',
      batchSize,
      maxMatches,
      startAfter: lastMatchId || null,
      matchId: onlyMatchId || null,
    },
    null,
    2
  )
);

if (onlyMatchId) {
  const snap = await matchesCol.doc(onlyMatchId).get();
  if (!snap.exists) {
    console.error(JSON.stringify({ ok: false, error: 'match_not_found', matchId: onlyMatchId }, null, 2));
    process.exit(1);
  }
  scannedMatches = 1;
  const result = await releaseHeldForMatch(snap, { applyChanges: apply });
  if (result.released > 0) {
    affectedMatches += 1;
    releasedMessages += result.released;
  }
} else {
  while (true) {
    let q = matchesCol.orderBy(FieldPath.documentId()).limit(batchSize);
    if (lastMatchId) q = q.startAfter(lastMatchId);

    const page = await q.get();
    if (page.empty) break;

    const docs = page.docs || [];
    lastMatchId = docs[docs.length - 1]?.id || lastMatchId;

    for (const docSnap of docs) {
      scannedMatches += 1;
      const result = await releaseHeldForMatch(docSnap, { applyChanges: apply });
      if (result.released > 0) {
        affectedMatches += 1;
        releasedMessages += result.released;
      }
      if (maxMatches > 0 && scannedMatches >= maxMatches) break;
    }

    if (maxMatches > 0 && scannedMatches >= maxMatches) break;
  }
}

console.log(
  JSON.stringify(
    {
      ok: true,
      projectId: projectId || null,
      mode: apply ? 'apply' : 'dry-run',
      scannedMatches,
      affectedMatches,
      releasedMessages,
      lastMatchId: lastMatchId || null,
      samples,
    },
    null,
    2
  )
);