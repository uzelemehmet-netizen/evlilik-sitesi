import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

      if (process.env[key] === undefined || String(process.env[key]).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function getArg(name, fallback = '') {
  const idx = process.argv.findIndex((arg) => arg === name);
  if (idx >= 0 && idx + 1 < process.argv.length) return String(process.argv[idx + 1] || '').trim();
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

loadEnvLocal();

const email = String(getArg('--email')).trim().toLowerCase();
const apply = hasFlag('--apply');

if (!email) {
  console.error('Usage: node scripts/cleanup-e2e-user.mjs --email <email> [--apply]');
  process.exit(2);
}

const { auth, db, FieldValue } = getAdmin();

async function getUserByEmailSafe(targetEmail) {
  try {
    const user = await auth.getUserByEmail(targetEmail);
    return { found: true, user };
  } catch (error) {
    if (String(error?.code || '') === 'auth/user-not-found') {
      return { found: false, user: null };
    }
    throw error;
  }
}

const { found, user } = await getUserByEmailSafe(email);
const uid = String(user?.uid || '').trim();

const applicationsSnap = uid
  ? await db.collection('matchmakingApplications').where('userId', '==', uid).limit(25).get()
  : { docs: [], size: 0 };
const paymentsSnap = uid
  ? await db.collection('matchmakingPayments').where('userId', '==', uid).limit(50).get().catch(() => ({ docs: [], size: 0 }))
  : { docs: [], size: 0 };
const reservationsSnap = uid
  ? await db.collection('reservations').where('userId', '==', uid).limit(50).get().catch(() => ({ docs: [], size: 0 }))
  : { docs: [], size: 0 };
const matchesSnap = uid
  ? await db.collection('matchmakingMatches').where('userIds', 'array-contains', uid).limit(50).get().catch(() => ({ docs: [], size: 0 }))
  : { docs: [], size: 0 };

const report = {
  ok: true,
  apply,
  email,
  found,
  uid: uid || null,
  counts: {
    matchmakingApplications: Number(applicationsSnap?.size || 0),
    matchmakingPayments: Number(paymentsSnap?.size || 0),
    reservations: Number(reservationsSnap?.size || 0),
    matchmakingMatches: Number(matchesSnap?.size || 0),
    matchmakingUsers: uid ? 1 : 0,
    authUsers: found ? 1 : 0,
  },
};

if (!apply) {
  console.log(JSON.stringify({ ...report, note: 'dry_run (add --apply to delete)' }, null, 2));
  process.exit(0);
}

if (uid) {
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  for (const doc of applicationsSnap.docs || []) batch.delete(doc.ref);
  for (const doc of paymentsSnap.docs || []) batch.delete(doc.ref);
  for (const doc of reservationsSnap.docs || []) batch.delete(doc.ref);

  for (const doc of matchesSnap.docs || []) {
    batch.set(
      doc.ref,
      {
        status: 'deleted_user',
        deletedUserIds: {
          [uid]: now,
        },
        updatedAt: now,
      },
      { merge: true }
    );
  }

  batch.delete(db.collection('matchmakingUsers').doc(uid));
  await batch.commit();
}

if (found && uid) {
  try {
    await auth.deleteUser(uid);
  } catch (error) {
    if (String(error?.code || '') !== 'auth/user-not-found') throw error;
  }
}

console.log(JSON.stringify({ ...report, deleted: true }, null, 2));