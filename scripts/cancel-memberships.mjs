import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvLocal() {
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
    if (current === undefined || String(current).trim() === '') {
      if (key.toUpperCase().includes('PRIVATE_KEY')) {
        process.env[key] = value.replace(/\\n/g, '\n');
      } else {
        process.env[key] = value;
      }
    }
  }
}

loadEnvLocal();

function usage() {
  console.log('Usage: node scripts/cancel-memberships.mjs <uidOrEmail1> <uidOrEmail2> ...');
  console.log('Accepts Firebase Auth UID or email; cancels membership + translationPack for matchmakingUsers docs.');
  process.exit(1);
}

const inputs = process.argv.slice(2).map((s) => String(s || '').trim()).filter(Boolean);
if (!inputs.length || inputs.includes('--help') || inputs.includes('-h')) usage();

const { auth, db, FieldValue } = getAdmin();

const now = Date.now();

let ok = 0;
let fail = 0;

async function resolveUid(input) {
  const v = String(input || '').trim();
  if (!v) return '';
  if (v.includes('@')) {
    const user = await auth.getUserByEmail(v);
    return String(user?.uid || '');
  }
  return v;
}

for (const raw of inputs) {
  let uid = '';
  try {
    uid = await resolveUid(raw);
    if (!uid) throw new Error('uid_not_found');

    const ref = db.collection('matchmakingUsers').doc(uid);
    await ref.set(
      {
        membership: {
          active: false,
          plan: 'free',
          validUntilMs: 0,
          cancelledAtMs: now,
        },
        translationPack: {
          active: false,
          plan: 'free',
          validUntilMs: 0,
          cancelledAtMs: now,
        },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`[ok] cancelled membership for input=${raw} uid=${uid}`);
    ok += 1;
  } catch (e) {
    console.error(`[fail] input=${raw} uid=${uid || '-'} error=${String(e?.message || e)}`);
    fail += 1;
  }
}

console.log(`Done. ok=${ok} fail=${fail}`);
process.exit(fail ? 2 : 0);
