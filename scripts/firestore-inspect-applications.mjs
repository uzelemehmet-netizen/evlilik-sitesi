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
    const snap = await query.count().get();
    const data = typeof snap?.data === 'function' ? snap.data() : null;
    const count = data && typeof data.count === 'number' ? data.count : null;
    return { ok: true, count };
  } catch (e) {
    return { ok: false, error: String(e?.code || e?.message || e) };
  }
}

function tsToIso(v) {
  try {
    if (!v) return null;
    if (typeof v?.toDate === 'function') return v.toDate().toISOString();
    return null;
  } catch {
    return null;
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

  const appsRef = db.collection('matchmakingApplications');

  const [countAll, countSubmit, countStub, countUnknownSource] = await Promise.all([
    tryCount(appsRef),
    tryCount(appsRef.where('source', '==', 'apply_submit')),
    tryCount(appsRef.where('source', '==', 'auto_stub')),
    tryCount(appsRef.where('source', '==', '')),
  ]);

  let latest = [];
  try {
    const snap = await appsRef.orderBy('createdAtMs', 'desc').limit(args.limit).get();
    latest = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        userId: typeof data?.userId === 'string' ? data.userId : null,
        source: typeof data?.source === 'string' ? data.source : null,
        status: typeof data?.status === 'string' ? data.status : null,
        createdAtMs: typeof data?.createdAtMs === 'number' ? data.createdAtMs : null,
        createdAt: tsToIso(data?.createdAt),
        updatedAtMs: typeof data?.updatedAtMs === 'number' ? data.updatedAtMs : null,
        updatedAt: tsToIso(data?.updatedAt),
        hasPhotoUrls: Array.isArray(data?.photoUrls) ? data.photoUrls.length : 0,
      };
    });
  } catch (e) {
    latest = [{ error: String(e?.code || e?.message || e) }];
  }

  const payload = {
    ok: true,
    projectId: projectId || null,
    matchmakingApplications: {
      count: countAll.ok ? countAll.count : null,
      countError: countAll.ok ? null : countAll.error,
      countApplySubmit: countSubmit.ok ? countSubmit.count : null,
      countApplySubmitError: countSubmit.ok ? null : countSubmit.error,
      countAutoStub: countStub.ok ? countStub.count : null,
      countAutoStubError: countStub.ok ? null : countStub.error,
      countEmptySource: countUnknownSource.ok ? countUnknownSource.count : null,
      countEmptySourceError: countUnknownSource.ok ? null : countUnknownSource.error,
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
