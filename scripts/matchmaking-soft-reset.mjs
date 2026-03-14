import fs from 'node:fs';
import path from 'node:path';

import { FieldPath } from 'firebase-admin/firestore';

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

      process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

function parseArgs(argv) {
  const out = { confirm: false, unlockUsers: false, resetAtMs: 0 };
  for (let i = 2; i < argv.length; i += 1) {
    const a = String(argv[i] || '').trim();
    if (a === '--confirm') out.confirm = true;
    if (a === '--unlock-users') out.unlockUsers = true;
    if (a === '--now') out.resetAtMs = Date.now();
    if (a === '--resetAtMs') {
      const v = Number(String(argv[i + 1] || '').trim());
      if (Number.isFinite(v) && v > 0) out.resetAtMs = Math.floor(v);
      i += 1;
    }
  }
  if (!out.resetAtMs) out.resetAtMs = Date.now();
  return out;
}

async function unlockAllUsers({ db, FieldValue, apply }) {
  let last = null;
  let total = 0;

  while (true) {
    let q = db.collection('matchmakingUsers').orderBy(FieldPath.documentId()).limit(400);
    if (last) q = q.startAfter(last);

    const snap = await q.get();
    if (snap.empty) break;

    const batch = db.batch();
    let n = 0;

    for (const d of snap.docs) {
      last = d.id;
      total += 1;

      if (!apply) continue;

      const ref = db.collection('matchmakingUsers').doc(d.id);
      batch.set(
        ref,
        {
          matchmakingLock: { active: false, matchId: '', matchCode: '' },
          matchmakingChoice: { active: false, matchId: '', matchCode: '' },
          matchmakingPendingContinue: { active: false, matchId: '' },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      n += 1;
    }

    if (apply && n > 0) {
      await batch.commit();
      console.log(`unlocked batch: ${n}`);
    } else {
      console.log(`scanned batch: ${snap.size}`);
    }

    if (snap.size < 400) break;
  }

  return { scannedUsers: total };
}

async function main() {
  loadEnvLocal();
  const args = parseArgs(process.argv);

  const { db, FieldValue, projectId } = getAdmin();
  const ref = db.collection('siteSettings').doc('matchmaking');

  console.log(JSON.stringify({ ok: true, firebaseProjectId: projectId || null, args }, null, 2));

  const payload = {
    matchmakingResetAtMs: args.resetAtMs,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: 'script:matchmaking-soft-reset',
  };

  if (!args.confirm) {
    console.log('DRY RUN: would set siteSettings/matchmaking:', payload);
    console.log('Add --confirm to apply. Optional: --unlock-users');
    return;
  }

  await ref.set(payload, { merge: true });
  console.log('Applied soft reset epoch.');

  if (args.unlockUsers) {
    console.log('Unlocking matchmakingUsers (this may take time)...');
    const res = await unlockAllUsers({ db, FieldValue, apply: true });
    console.log('Unlock complete:', res);
  }
}

main().catch((e) => {
  console.error('matchmaking-soft-reset failed:', e?.message || e);
  process.exitCode = 1;
});
