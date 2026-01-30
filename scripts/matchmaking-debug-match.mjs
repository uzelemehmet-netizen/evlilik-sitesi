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
      if (current === undefined || String(current).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return '';
  const v = process.argv[idx + 1];
  if (!v || v.startsWith('--')) return '';
  return String(v).trim();
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
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

function uniqNonEmptyStrings(arr) {
  const seen = new Set();
  const out = [];
  for (const v of Array.isArray(arr) ? arr : []) {
    const s = safeStr(v);
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

async function main() {
  loadEnvLocal();

  const matchId = argValue('--matchId') || argValue('-m');
  const uid = argValue('--uid') || '';

  if (!matchId) {
    console.error('Usage: node scripts/matchmaking-debug-match.mjs --matchId <matchDocId> [--uid <uidToCheck>]');
    process.exitCode = 2;
    return;
  }

  const { db } = getAdmin();

  const snap = await db.collection('matchmakingMatches').doc(String(matchId)).get();
  if (!snap.exists) {
    console.log(JSON.stringify({ ok: false, error: 'not_found', matchId }, null, 2));
    return;
  }

  const m = snap.data() || {};
  const aUserId = safeStr(m?.aUserId);
  const bUserId = safeStr(m?.bUserId);
  const canonicalUserIds = uniqNonEmptyStrings([aUserId, bUserId]);
  const storedUserIds = uniqNonEmptyStrings(m?.userIds);

  const updatedAtMs = tsToMs(m?.updatedAt) || (typeof m?.updatedAtMs === 'number' ? m.updatedAtMs : 0);
  const createdAtMs = tsToMs(m?.createdAt) || (typeof m?.createdAtMs === 'number' ? m.createdAtMs : 0);

  const result = {
    ok: true,
    matchId: snap.id,
    status: safeStr(m?.status),
    aUserId,
    bUserId,
    storedUserIds,
    canonicalUserIds,
    userIdsLooksCorrect:
      canonicalUserIds.length === 2 &&
      storedUserIds.length === 2 &&
      canonicalUserIds.every((x) => storedUserIds.includes(x)),
    containsUid: uid ? storedUserIds.includes(String(uid).trim()) : undefined,
    decisions: m?.decisions || null,
    updatedAtMs,
    createdAtMs,
    mutualInterestAtMs: typeof m?.mutualInterestAtMs === 'number' ? m.mutualInterestAtMs : tsToMs(m?.mutualInterestAt),
    mutualAcceptedAtMs: typeof m?.mutualAcceptedAtMs === 'number' ? m.mutualAcceptedAtMs : tsToMs(m?.mutualAcceptedAt),
    cancelledAtMs: typeof m?.cancelledAtMs === 'number' ? m.cancelledAtMs : tsToMs(m?.cancelledAt),
    dismissals: m?.dismissals && typeof m.dismissals === 'object' ? m.dismissals : null,
  };

  const dismissedByUid = uid && result.dismissals ? !!result.dismissals[String(uid).trim()] : false;
  const dismissalCount = result.dismissals ? Object.keys(result.dismissals).length : 0;

  const parts = [
    `matchId=${result.matchId}`,
    `status=${result.status || '-'}`,
    `a=${result.aUserId || '-'}`,
    `b=${result.bUserId || '-'}`,
    `userIdsLooksCorrect=${String(result.userIdsLooksCorrect)}`,
    uid ? `containsUid=${String(result.containsUid)}` : null,
    uid ? `dismissedByUid=${String(dismissedByUid)}` : null,
    `dismissalCount=${dismissalCount}`,
    `decisions=${JSON.stringify(result.decisions)}`,
    `updatedAtMs=${result.updatedAtMs}`,
  ].filter(Boolean);
  console.log(parts.join(' | '));
}

main().catch((e) => {
  console.error('debug-match failed:', e?.message || e);
  process.exitCode = 1;
});
