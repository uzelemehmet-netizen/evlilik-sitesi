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
  node scripts/backfill-user-codes.mjs [--dryRun] [--batchSize 200] [--maxWrites 5000] [--startAfter <uid>]

Açıklama:
  matchmakingUsers koleksiyonunu tarar ve eksik UC kodlarını atar.
  Kadın: UC-1001+ | Erkek: UC-2001+
`);
  process.exit(exitCode);
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeGender(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'male' || s === 'm' || s === 'man' || s === 'erkek') return 'male';
  if (s === 'female' || s === 'f' || s === 'woman' || s === 'kadin' || s === 'kadın') return 'female';
  return '';
}

function parseUcNo(v) {
  const s = safeStr(v).toUpperCase();
  const m = /^UC-(\d{3,})$/.exec(s);
  if (!m) return 0;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function formatUcNo(n) {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return '';
  return `UC-${Math.floor(v)}`;
}

function doesUserCodeMatchGender(no, gender) {
  const numeric = typeof no === 'number' ? no : Number(no);
  const genderNorm = normalizeGender(gender);
  if (!Number.isFinite(numeric) || numeric <= 0) return true;
  if (genderNorm === 'female') return numeric >= 1001 && numeric < 2000;
  if (genderNorm === 'male') return numeric >= 2001;
  return true;
}

loadEnvLocal();

if (hasFlag('--help') || hasFlag('-h')) usage(0);

const dryRun = hasFlag('--dryRun');
const batchSize = Number(getArgValue('--batchSize') || '200');
const maxWrites = Number(getArgValue('--maxWrites') || '5000');
const startAfter = getArgValue('--startAfter');

if (!Number.isFinite(batchSize) || batchSize <= 0 || batchSize > 1000) {
  // eslint-disable-next-line no-console
  console.error('Geçersiz --batchSize');
  process.exit(1);
}

if (!Number.isFinite(maxWrites) || maxWrites < 0) {
  // eslint-disable-next-line no-console
  console.error('Geçersiz --maxWrites');
  process.exit(1);
}

const firebaseAdminPath = path.join(projectRoot, 'apiRoutes', '_firebaseAdmin.js');
const { getAdmin } = await import(pathToFileURL(firebaseAdminPath).href);
const { db, FieldValue } = getAdmin();

const usersCol = db.collection('matchmakingUsers');
const countersRef = db.collection('matchmakingMeta').doc('userCodeCounters');

let scanned = 0;
let writes = 0;
let assigned = 0;
let normalized = 0;
let reassigned = 0;
let skippedNoGender = 0;
let lastDocId = startAfter || '';

async function processUserDoc(docSnap) {
  const uid = docSnap.id;

  const res = await db.runTransaction(async (tx) => {
    const freshSnap = await tx.get(usersCol.doc(uid));
    const user = freshSnap.exists ? (freshSnap.data() || {}) : {};

    const existingUserCode = safeStr(user?.userCode) || safeStr(user?.publicProfile?.userCode);
    const existingUserCodeNo =
      (typeof user?.userCodeNo === 'number' ? user.userCodeNo : 0) ||
      (typeof user?.publicProfile?.userCodeNo === 'number' ? user.publicProfile.userCodeNo : 0);

    const genderNorm = normalizeGender(user?.gender);
    const patch = {};
    let normalizedUserCode = existingUserCode;
    let normalizedUserCodeNo = existingUserCodeNo;

    // Normalize already-existing fields first (does not touch counters).
    if (existingUserCode && !(existingUserCodeNo > 0)) {
      const parsed = parseUcNo(existingUserCode);
      if (parsed > 0) {
        patch.userCodeNo = parsed;
        patch['publicProfile.userCode'] = existingUserCode;
        patch['publicProfile.userCodeNo'] = parsed;
        patch.userCodeGender = normalizeGender(user?.userCodeGender) || genderNorm || user?.userCodeGender || '';
        normalizedUserCodeNo = parsed;
      }
    }

    if (!existingUserCode && existingUserCodeNo > 0) {
      const formatted = formatUcNo(existingUserCodeNo);
      if (formatted) {
        patch.userCode = formatted;
        patch['publicProfile.userCode'] = formatted;
        patch['publicProfile.userCodeNo'] = existingUserCodeNo;
        patch.userCodeGender = normalizeGender(user?.userCodeGender) || genderNorm || user?.userCodeGender || '';
        normalizedUserCode = formatted;
      }
    }

    const hasBandMismatch =
      !!normalizedUserCode &&
      normalizedUserCodeNo > 0 &&
      (genderNorm === 'female' || genderNorm === 'male') &&
      !doesUserCodeMatchGender(normalizedUserCodeNo, genderNorm);

    // Allocate a brand-new UC code if missing.
    if ((!normalizedUserCode && !(normalizedUserCodeNo > 0)) || hasBandMismatch) {
      if (!(genderNorm === 'female' || genderNorm === 'male')) {
        return { ok: true, action: 'skip_no_gender' };
      }

      const countersSnap = await tx.get(countersRef);
      const counters = countersSnap.exists ? (countersSnap.data() || {}) : {};

      const baseFemale = 1001;
      const baseMale = 2001;

      const nextFemaleRaw = typeof counters?.nextFemale === 'number' ? counters.nextFemale : parseUcNo(counters?.nextFemaleCode);
      const nextMaleRaw = typeof counters?.nextMale === 'number' ? counters.nextMale : parseUcNo(counters?.nextMaleCode);

      const nextFemale = Number.isFinite(nextFemaleRaw) && nextFemaleRaw >= baseFemale ? Math.floor(nextFemaleRaw) : baseFemale;
      const nextMale = Number.isFinite(nextMaleRaw) && nextMaleRaw >= baseMale ? Math.floor(nextMaleRaw) : baseMale;

      const assignedNo = genderNorm === 'female' ? nextFemale : nextMale;
      const assignedCode = formatUcNo(assignedNo);

      if (!assignedCode) {
        return { ok: false, action: 'error', error: 'assignedCode_empty' };
      }

      patch.userCode = assignedCode;
      patch.userCodeNo = assignedNo;
      patch['publicProfile.userCode'] = assignedCode;
      patch['publicProfile.userCodeNo'] = assignedNo;
      patch.userCodeGender = genderNorm;
      patch.userCodeAssignedAtMs = Date.now();
      patch.userCodeBackfilledAtMs = Date.now();
      if (hasBandMismatch) {
        patch.previousUserCode = normalizedUserCode;
        patch.previousUserCodeNo = normalizedUserCodeNo;
        patch.userCodeReassignedAtMs = Date.now();
      }

      tx.set(
        countersRef,
        {
          nextFemale: genderNorm === 'female' ? assignedNo + 1 : nextFemale,
          nextMale: genderNorm === 'male' ? assignedNo + 1 : nextMale,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: Date.now(),
        },
        { merge: true }
      );

      tx.set(
        usersCol.doc(uid),
        {
          ...patch,
          updatedAt: FieldValue.serverTimestamp(),
          updatedAtMs: Date.now(),
        },
        { merge: true }
      );

      return { ok: true, action: hasBandMismatch ? 'reassigned' : 'assigned', code: assignedCode };
    }

    if (!Object.keys(patch).length) {
      return { ok: true, action: 'noop' };
    }

    tx.set(
      usersCol.doc(uid),
      {
        ...patch,
        userCodeBackfilledAtMs: Date.now(),
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: Date.now(),
      },
      { merge: true }
    );

    return { ok: true, action: 'normalized' };
  });

  return res;
}

// eslint-disable-next-line no-console
console.log(
  JSON.stringify(
    {
      ok: true,
      dryRun,
      batchSize,
      maxWrites,
      startAfter: lastDocId || null,
    },
    null,
    2
  )
);

try {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = usersCol.orderBy(FieldPath.documentId()).limit(batchSize);
    if (lastDocId) q = q.startAfter(lastDocId);

    const page = await q.get();
    if (page.empty) break;

    for (const doc of page.docs) {
      if (maxWrites > 0 && writes >= maxWrites) break;

      scanned += 1;
      lastDocId = doc.id;

      if (dryRun) continue;

      const r = await processUserDoc(doc);
      if (!r?.ok) {
        // eslint-disable-next-line no-console
        console.error(JSON.stringify({ ok: false, uid: doc.id, error: r?.error || 'unknown' }, null, 2));
        continue;
      }

      if (r.action === 'assigned') {
        assigned += 1;
        writes += 1;
      } else if (r.action === 'reassigned') {
        reassigned += 1;
        writes += 1;
      } else if (r.action === 'normalized') {
        normalized += 1;
        writes += 1;
      } else if (r.action === 'skip_no_gender') {
        skippedNoGender += 1;
      }
    }

    if (maxWrites > 0 && writes >= maxWrites) break;
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        scanned,
        writes,
        assigned,
        reassigned,
        normalized,
        skippedNoGender,
        resumeHint: lastDocId ? `--startAfter ${lastDocId}` : null,
      },
      null,
      2
    )
  );
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ ok: false, error: String(e?.code || e?.message || e) }, null, 2));
  process.exitCode = 1;
}
