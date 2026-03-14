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
  node scripts/backfill-match-user-codes.mjs [--dryRun] [--batchSize 200] [--maxWrites 5000] [--startAfter <matchId>]

Açıklama:
  matchmakingMatches dokümanlarında profiles.a/profiles.b altına userCode ve userCodeNo alanlarını backfill eder.
  Kaynak: matchmakingUsers.userCode / publicProfile.userCode.
`);
  process.exit(exitCode);
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

loadEnvLocal();

if (hasFlag('--help') || hasFlag('-h')) usage(0);

const dryRun = hasFlag('--dryRun');
const batchSize = Number(getArgValue('--batchSize') || '200');
const maxWrites = Number(getArgValue('--maxWrites') || '5000');
const startAfter = getArgValue('--startAfter');

if (!Number.isFinite(batchSize) || batchSize <= 0 || batchSize > 500) {
  // eslint-disable-next-line no-console
  console.error('Geçersiz --batchSize (1..500)');
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

const matchesCol = db.collection('matchmakingMatches');
const usersCol = db.collection('matchmakingUsers');

let scanned = 0;
let writes = 0;
let updated = 0;
let lastId = startAfter || '';

async function fetchUserCodes(uids) {
  const out = new Map();
  const unique = Array.from(new Set((uids || []).map(String).filter(Boolean)));
  const chunks = [];
  for (let i = 0; i < unique.length; i += 10) chunks.push(unique.slice(i, i + 10));

  for (const chunk of chunks) {
    const snap = await usersCol.where(FieldPath.documentId(), 'in', chunk).get();
    snap.docs.forEach((d) => {
      const u = d.data() || {};
      const code = safeStr(u?.userCode) || safeStr(u?.publicProfile?.userCode);
      const no =
        typeof u?.userCodeNo === 'number' && Number.isFinite(u.userCodeNo)
          ? u.userCodeNo
          : (typeof u?.publicProfile?.userCodeNo === 'number' && Number.isFinite(u.publicProfile.userCodeNo)
              ? u.publicProfile.userCodeNo
              : null);
      out.set(d.id, { code, no });
    });
  }

  return out;
}

// eslint-disable-next-line no-console
console.log(
  JSON.stringify(
    {
      ok: true,
      dryRun,
      batchSize,
      maxWrites,
      startAfter: lastId || null,
    },
    null,
    2
  )
);

try {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = matchesCol.orderBy(FieldPath.documentId()).limit(batchSize);
    if (lastId) q = q.startAfter(lastId);

    const page = await q.get();
    if (page.empty) break;

    const docs = page.docs || [];
    scanned += docs.length;
    lastId = docs[docs.length - 1]?.id || lastId;

    const uids = [];
    docs.forEach((d) => {
      const m = d.data() || {};
      const a = safeStr(m?.aUserId);
      const b = safeStr(m?.bUserId);
      if (a) uids.push(a);
      if (b) uids.push(b);
    });

    const codeByUid = await fetchUserCodes(uids);

    let batch = db.batch();
    let batchWrites = 0;

    for (const d of docs) {
      if (maxWrites > 0 && writes >= maxWrites) break;

      const m = d.data() || {};
      const aUid = safeStr(m?.aUserId);
      const bUid = safeStr(m?.bUserId);
      if (!aUid || !bUid) continue;

      const pa = m?.profiles?.a && typeof m.profiles.a === 'object' ? m.profiles.a : {};
      const pb = m?.profiles?.b && typeof m.profiles.b === 'object' ? m.profiles.b : {};

      const aCur = safeStr(pa?.userCode);
      const bCur = safeStr(pb?.userCode);

      const a = codeByUid.get(aUid) || { code: '', no: null };
      const b = codeByUid.get(bUid) || { code: '', no: null };

      const patch = {};
      if (!aCur && a.code) {
        patch['profiles.a.userCode'] = a.code;
        if (typeof a.no === 'number') patch['profiles.a.userCodeNo'] = a.no;
      }
      if (!bCur && b.code) {
        patch['profiles.b.userCode'] = b.code;
        if (typeof b.no === 'number') patch['profiles.b.userCodeNo'] = b.no;
      }

      if (!Object.keys(patch).length) continue;

      updated += 1;
      if (dryRun) continue;

      batch.update(d.ref, {
        ...patch,
        updatedAt: FieldValue.serverTimestamp(),
        updatedAtMs: Date.now(),
      });

      writes += 1;
      batchWrites += 1;

      if (batchWrites >= 450) {
        await batch.commit();
        batch = db.batch();
        batchWrites = 0;
      }
    }

    if (!dryRun && batchWrites > 0) {
      await batch.commit();
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
        updated,
        resumeHint: lastId ? `--startAfter ${lastId}` : null,
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
