import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

import fs from 'node:fs';
import path from 'node:path';

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

      const current = process.env[key];
      if (current === undefined || String(current).trim() === '') {
        if (key.toUpperCase().includes('PRIVATE_KEY')) {
          process.env[key] = value.replace(/\\n/g, '\n');
        } else {
          process.env[key] = value;
        }
      }
    }
  } catch {
    // ignore
  }
}

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function usageAndExit() {
  // Intentionally minimal; see MATCHMAKING_TEST_KILAVUZU.md for full examples.
  console.log('Usage:');
  console.log('  node scripts/matchmaking-time-travel.mjs --matchId <id> --expire-proposed');
  console.log('  node scripts/matchmaking-time-travel.mjs --matchId <id> --auto-confirm-48h');
  console.log('  node scripts/matchmaking-time-travel.mjs --matchId <id> --inactive-24h --inactiveSide a|b|both');
  process.exit(1);
}

const matchId = argValue('--matchId');
if (!matchId) usageAndExit();

loadEnvLocal();

const doExpireProposed = hasFlag('--expire-proposed');
const doAutoConfirm48h = hasFlag('--auto-confirm-48h');
const doInactive24h = hasFlag('--inactive-24h');

const modes = [doExpireProposed, doAutoConfirm48h, doInactive24h].filter(Boolean).length;
if (modes !== 1) usageAndExit();

const { db } = getAdmin();

const nowMs = Date.now();
const HOUR = 60 * 60 * 1000;

const matchRef = db.collection('matchmakingMatches').doc(String(matchId));
const snap = await matchRef.get();
if (!snap.exists) {
  console.error('[time-travel] match_not_found:', matchId);
  process.exit(2);
}

const match = snap.data() || {};
const userIds = Array.isArray(match.userIds) ? match.userIds.map(String).filter(Boolean) : [];
const aUserId = String(match.aUserId || userIds[0] || '');
const bUserId = String(match.bUserId || userIds[1] || '');

if (!aUserId || !bUserId) {
  console.error('[time-travel] match_missing_user_ids');
  process.exit(3);
}

if (doExpireProposed) {
  await matchRef.set(
    {
      status: 'proposed',
      proposedExpiresAtMs: nowMs - 1000,
      createdAtMs: nowMs - 49 * HOUR,
      createdAt: new Date(nowMs - 49 * HOUR),
    },
    { merge: true }
  );

  console.log('[time-travel] ok: proposed will expire on next cron run');
  console.log(JSON.stringify({ matchId, aUserId, bUserId }, null, 2));
  process.exit(0);
}

if (doAutoConfirm48h) {
  // Auto-confirm logic uses baseMs = chatEnabledAtMs || mutualAcceptedAtMs (or timestamps).
  const base = nowMs - 49 * HOUR;
  await matchRef.set(
    {
      status: 'mutual_accepted',
      mutualAcceptedAtMs: base,
      mutualAcceptedAt: new Date(base),
      chatEnabledAtMs: base,
      chatEnabledAt: new Date(base),
      confirmedAtMs: null,
      confirmedAt: null,
      confirmedReason: null,
    },
    { merge: true }
  );

  console.log('[time-travel] ok: mutual_accepted will be auto-confirmed on next cron run');
  console.log(JSON.stringify({ matchId, aUserId, bUserId }, null, 2));
  process.exit(0);
}

if (doInactive24h) {
  const side = (argValue('--inactiveSide') || 'both').toLowerCase();
  const inactiveAtMs = nowMs - 25 * HOUR;

  // Tek tarafı offline yaparken diğer tarafın lastSeenAtMs'ini "şimdi"ye çek.
  // Aksi halde lastSeen olmayan kullanıcılar baseMs fallback'i yüzünden pasif sayılabilir.
  const keepActiveAtMs = nowMs;

  const updates = [];
  if (side === 'a' || side === 'both') {
    updates.push(db.collection('matchmakingUsers').doc(aUserId).set({ lastSeenAtMs: inactiveAtMs }, { merge: true }));
  }
  if (side === 'b' || side === 'both') {
    updates.push(db.collection('matchmakingUsers').doc(bUserId).set({ lastSeenAtMs: inactiveAtMs }, { merge: true }));
  }

  if (side === 'a') {
    updates.push(db.collection('matchmakingUsers').doc(bUserId).set({ lastSeenAtMs: keepActiveAtMs }, { merge: true }));
  }
  if (side === 'b') {
    updates.push(db.collection('matchmakingUsers').doc(aUserId).set({ lastSeenAtMs: keepActiveAtMs }, { merge: true }));
  }

  // Also make the match old enough that fallback logic (no lastSeen) would still cancel.
  await matchRef.set(
    {
      createdAtMs: nowMs - 25 * HOUR,
      createdAt: new Date(nowMs - 25 * HOUR),
      mutualAcceptedAtMs: match.mutualAcceptedAtMs ? nowMs - 25 * HOUR : match.mutualAcceptedAtMs,
      chatEnabledAtMs: match.chatEnabledAtMs ? nowMs - 25 * HOUR : match.chatEnabledAtMs,
    },
    { merge: true }
  );

  await Promise.all(updates);

  console.log('[time-travel] ok: match should be cancelled as inactive_24h on next cron run');
  console.log(JSON.stringify({ matchId, aUserId, bUserId, side }, null, 2));
  process.exit(0);
}
