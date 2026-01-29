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

      const current = process.env[key];
      const shouldOverride = key.startsWith('FIREBASE_SERVICE_ACCOUNT');
      if (shouldOverride || current === undefined || String(current).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function fmtMs(ms) {
  if (!ms || typeof ms !== 'number' || !Number.isFinite(ms)) return '';
  try {
    return new Date(ms).toISOString();
  } catch {
    return String(ms);
  }
}

function summarizeDebug(debug) {
  if (!debug || typeof debug !== 'object') return null;
  const seekers = debug?.seekers || null;
  const matches = debug?.matches || null;
  const params = debug?.params || null;

  return {
    params: {
      threshold: params?.threshold ?? null,
      limitApps: params?.limitApps ?? null,
      includeSeeds: params?.includeSeeds ?? null,
      dryRun: params?.dryRun ?? null,
      inactiveTtlHours: params?.inactiveTtlHours ?? null,
      inactiveCutoffMs: params?.inactiveCutoffMs ?? null,
      inactiveCutoffIso: fmtMs(params?.inactiveCutoffMs),
      nowMs: params?.nowMs ?? null,
      nowIso: fmtMs(params?.nowMs),
    },
    seekers: {
      total: seekers?.total ?? null,
      processed: seekers?.processed ?? null,
      withCandidates: seekers?.withCandidates ?? null,
      skipped: seekers?.skipped ?? null,
      fallbacks: seekers?.fallbacks ?? null,
    },
    matches: {
      writeAttempts: matches?.writeAttempts ?? null,
      written: matches?.written ?? null,
      skippedExisting: matches?.skippedExisting ?? null,
    },
  };
}

async function main() {
  loadEnvLocal();

  const { db } = getAdmin();
  const snap = await db.collection('matchmakingRuns').doc('last').get();
  if (!snap.exists) {
    const probe = await db.collection('matchmakingRuns').limit(5).get();
    const ids = probe.docs.map((d) => d.id);
    console.log(
      JSON.stringify(
        { ok: false, error: 'no_last_run_doc', anyDocs: probe.size > 0, sampleDocIds: ids },
        null,
        2
      )
    );
    return;
  }

  const data = snap.data() || {};
  const summary = data.summary || null;
  const debug = summary?.debug || null;
  const out = {
    ok: true,
    startedAtMs: data.startedAtMs || null,
    startedAtIso: fmtMs(data.startedAtMs),
    finishedAtMs: data.finishedAtMs || null,
    finishedAtIso: fmtMs(data.finishedAtMs),
    runOk: typeof data.ok === 'boolean' ? data.ok : null,
    error: data.error || null,
    triggeredBy: data.triggeredBy || null,
    vercelId: data.vercelId || null,
    userAgent: data.userAgent || null,
    summary,
    diagnostics: summarizeDebug(debug),
  };

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error('matchmaking-last-run failed:', e?.message || e);
  process.exitCode = 1;
});
