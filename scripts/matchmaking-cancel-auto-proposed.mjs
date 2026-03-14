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
  const out = {
    confirm: false,
    all: false,
    limit: 500,
    delete: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = String(argv[i] || '').trim();
    if (a === '--confirm') out.confirm = true;
    if (a === '--all') out.all = true;
    if (a === '--delete') out.delete = true;
    if (a === '--limit') {
      const v = Number(String(argv[i + 1] || '').trim());
      if (Number.isFinite(v) && v > 0) out.limit = Math.min(2000, Math.floor(v));
      i += 1;
    }
  }

  return out;
}

function tsToMs(v) {
  if (!v) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v?.toMillis === 'function') {
    try {
      return v.toMillis();
    } catch {
      return 0;
    }
  }
  const seconds = typeof v?.seconds === 'number' ? v.seconds : null;
  const nanoseconds = typeof v?.nanoseconds === 'number' ? v.nanoseconds : 0;
  if (seconds !== null) return Math.floor(seconds * 1000 + nanoseconds / 1e6);
  return 0;
}

function getCreatedAtMs(m) {
  return (
    (typeof m?.createdAtMs === 'number' && Number.isFinite(m.createdAtMs) ? m.createdAtMs : 0) ||
    tsToMs(m?.createdAt) ||
    0
  );
}

function isAutoRunMatchDoc(m) {
  // Signature fields written by apiRoutes/matchmaking-run.js
  const hasExpires = typeof m?.proposedExpiresAtMs === 'number' && Number.isFinite(m.proposedExpiresAtMs) && m.proposedExpiresAtMs > 0;
  const hasTier = typeof m?.matchTier === 'string' && m.matchTier.trim();
  const hasFirst = typeof m?.firstCreatedAtMs === 'number' && Number.isFinite(m.firstCreatedAtMs) && m.firstCreatedAtMs > 0;
  const hasReproposed = typeof m?.reproposedAtMs === 'number' && Number.isFinite(m.reproposedAtMs) && m.reproposedAtMs > 0;
  return Boolean(hasExpires || hasTier || hasFirst || hasReproposed);
}

async function deleteMatchDeep({ db, matchRef }) {
  if (typeof db?.recursiveDelete === 'function') {
    await db.recursiveDelete(matchRef);
    return { method: 'recursiveDelete' };
  }

  // Fallback: delete known subcollections + doc
  const msgs = await matchRef.collection('messages').limit(800).get();
  if (!msgs.empty) {
    const batch = db.batch();
    msgs.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await matchRef.delete();
  return { method: 'manual' };
}

async function main() {
  loadEnvLocal();
  const args = parseArgs(process.argv);

  const { db, FieldValue, projectId } = getAdmin();

  const settingsSnap = await db.collection('siteSettings').doc('matchmaking').get().catch(() => null);
  const settings = settingsSnap?.exists ? (settingsSnap.data() || {}) : {};
  const resetAtMs = typeof settings?.matchmakingResetAtMs === 'number' && Number.isFinite(settings.matchmakingResetAtMs) ? settings.matchmakingResetAtMs : 0;

  const nowMs = Date.now();

  const out = {
    ok: true,
    firebaseProjectId: projectId || null,
    args,
    resetAtMs: resetAtMs || null,
    mode: args.delete ? 'delete' : 'cancel',
    scanned: 0,
    matched: 0,
    applied: 0,
    skipped: {
      notAuto: 0,
      afterReset: 0,
      nonProposed: 0,
      adminCreated: 0,
      preMatchCreated: 0,
    },
    sampleMatchIds: [],
  };

  // Fast query: only docs that have proposedExpiresAtMs (>=1) — typical for auto-run.
  // This avoids scanning the entire collection.
  let q = db
    .collection('matchmakingMatches')
    .where('status', '==', 'proposed')
    .where('proposedExpiresAtMs', '>=', 1)
    .orderBy('proposedExpiresAtMs', 'asc')
    .limit(Math.max(1, Math.min(2000, args.limit)));

  const snap = await q.get().catch(() => null);
  const docs = snap?.docs || [];

  out.scanned = docs.length;

  for (const d of docs) {
    const m = d.data() || {};
    if (String(m?.status || '') !== 'proposed') {
      out.skipped.nonProposed += 1;
      continue;
    }

    if (typeof m?.createdByAdminId === 'string' && m.createdByAdminId.trim()) {
      out.skipped.adminCreated += 1;
      continue;
    }

    if (String(m?.createdBy || '') === 'pre_match_request') {
      out.skipped.preMatchCreated += 1;
      continue;
    }

    if (!isAutoRunMatchDoc(m)) {
      out.skipped.notAuto += 1;
      continue;
    }

    const createdAtMs = getCreatedAtMs(m);
    const firstCreatedAtMs = typeof m?.firstCreatedAtMs === 'number' && Number.isFinite(m.firstCreatedAtMs) ? m.firstCreatedAtMs : 0;
    const effectiveCreatedMs = firstCreatedAtMs || createdAtMs;

    if (!args.all && resetAtMs > 0 && effectiveCreatedMs > 0 && effectiveCreatedMs >= resetAtMs) {
      out.skipped.afterReset += 1;
      continue;
    }

    out.matched += 1;
    if (out.sampleMatchIds.length < 12) out.sampleMatchIds.push(d.id);

    if (!args.confirm) continue;

    if (args.delete) {
      await deleteMatchDeep({ db, matchRef: d.ref });
      out.applied += 1;
      continue;
    }

    await d.ref.set(
      {
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledAtMs: nowMs,
        cancelledByUserId: 'system',
        cancelledReason: 'cleanup_auto_proposed',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    out.applied += 1;
  }

  if (!args.confirm) {
    out.note = 'dry_run_add_--confirm_to_apply';
  }

  if (args.delete && args.confirm) {
    out.warning = 'deleted_docs_and_messages_subcollection_best_effort';
  }

  console.log(JSON.stringify(out, null, 2));

  if (!args.confirm) {
    console.log('\nNext:');
    console.log('  - Add --confirm to apply');
    console.log('  - Optional: add --all to also cancel/delete matches created after resetAtMs');
    console.log('  - Optional: add --delete to hard-delete match docs (+ messages)');
  }
}

main().catch((e) => {
  console.error('matchmaking-cancel-auto-proposed failed:', e?.message || e);
  process.exitCode = 1;
});
