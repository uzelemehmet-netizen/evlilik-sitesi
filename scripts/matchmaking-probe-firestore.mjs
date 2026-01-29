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

      // Scripts: local env her zaman geçsin (yanlış projeyi okumayalım)
      process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

async function main() {
  loadEnvLocal();

  const { db } = getAdmin();

  const apps = await db.collection('matchmakingApplications').limit(1).get();
  const users = await db.collection('matchmakingUsers').limit(1).get();
  const matches = await db.collection('matchmakingMatches').limit(1).get();
  const runs = await db.collection('matchmakingRuns').limit(5).get();

  console.log(
    JSON.stringify(
      {
        ok: true,
        sample: {
          matchmakingApplications: apps.size,
          matchmakingUsers: users.size,
          matchmakingMatches: matches.size,
          matchmakingRuns: runs.size,
          matchmakingRunsDocIds: runs.docs.map((d) => d.id),
        },
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error('probe-firestore failed:', e?.message || e);
  process.exitCode = 1;
});
