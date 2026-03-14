import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

function toInt(v, fallback) {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function parseArgs(argv) {
  const out = { limit: 10 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--limit') out.limit = Math.max(1, toInt(argv[i + 1], out.limit));
  }
  return out;
}

async function tryCount(query) {
  try {
    // Firestore aggregation queries (count) are supported in recent SDKs.
    const snap = await query.count().get();
    const data = typeof snap?.data === 'function' ? snap.data() : null;
    const count = data && typeof data.count === 'number' ? data.count : null;
    return { ok: true, count };
  } catch (e) {
    return { ok: false, error: String(e?.code || e?.message || e) };
  }
}

async function main() {
  // Default to local repo secret file if env isn't set.
  if (
    !process.env.FIREBASE_SERVICE_ACCOUNT_JSON &&
    !process.env.FIREBASE_SERVICE_ACCOUNT &&
    !process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE &&
    !process.env.FIREBASE_SERVICE_ACCOUNT_FILE
  ) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const defaultPath = path.resolve(__dirname, '../secrets/firebase-service-account.json');
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON_FILE = defaultPath;
  }

  const args = parseArgs(process.argv.slice(2));
  const { db, projectId } = getAdmin();

  const usersRef = db.collection('matchmakingUsers');

  const countRes = await tryCount(usersRef);

  let latest = [];
  try {
    const snap = await usersRef.orderBy('createdAt', 'desc').limit(args.limit).get();
    latest = snap.docs.map((d) => {
      const data = d.data() || {};
      const createdAt = data?.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : null;
      const updatedAt = data?.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : null;

      return {
        id: d.id,
        createdAt,
        updatedAt,
        hasGender: typeof data?.gender === 'string',
        hasNationality: typeof data?.nationality === 'string',
        hasAge: typeof data?.age === 'number',
      };
    });
  } catch (e) {
    latest = [{ error: String(e?.code || e?.message || e) }];
  }

  const payload = {
    ok: true,
    projectId: projectId || null,
    matchmakingUsers: {
      count: countRes.ok ? countRes.count : null,
      countError: countRes.ok ? null : countRes.error,
      latest,
    },
  };

  process.stdout.write(JSON.stringify(payload, null, 2));
  process.stdout.write('\n');
}

main().catch((e) => {
  process.stderr.write(String(e?.stack || e?.message || e));
  process.stderr.write('\n');
  process.exitCode = 1;
});
