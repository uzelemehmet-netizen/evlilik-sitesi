import fs from 'node:fs';
import path from 'node:path';

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
  const out = { confirm: false, enable: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = String(argv[i] || '').trim();
    if (a === '--confirm') out.confirm = true;
    if (a === '--enable') out.enable = true;
    if (a === '--disable') out.enable = false;
  }
  return out;
}

async function main() {
  loadEnvLocal();
  const args = parseArgs(process.argv);

  if (args.enable !== true && args.enable !== false) {
    console.log('Usage:');
    console.log('  node scripts/matchmaking-heartbeat-automation.mjs --disable');
    console.log('  node scripts/matchmaking-heartbeat-automation.mjs --enable');
    console.log('Add --confirm to apply. Default is dry-run.');
    process.exitCode = 2;
    return;
  }

  const { db, FieldValue, projectId } = getAdmin();
  const ref = db.collection('matchmakingAutomation').doc('heartbeat_run');

  const payload = {
    enabled: args.enable,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: 'script:matchmaking-heartbeat-automation',
  };

  console.log(JSON.stringify({ ok: true, firebaseProjectId: projectId || null, args, payload }, null, 2));

  if (!args.confirm) {
    console.log('DRY RUN: would set matchmakingAutomation/heartbeat_run:', payload);
    console.log('Add --confirm to apply.');
    return;
  }

  await ref.set(payload, { merge: true });
  console.log(`Applied: heartbeat automation enabled=${args.enable}`);
}

main().catch((e) => {
  console.error('matchmaking-heartbeat-automation failed:', e?.message || e);
  process.exitCode = 1;
});
