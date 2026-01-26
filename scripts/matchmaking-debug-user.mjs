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

function msToIso(ms) {
  if (!ms || !Number.isFinite(ms)) return null;
  try {
    return new Date(ms).toISOString();
  } catch {
    return null;
  }
}

function safeLower(s) {
  return String(s || '').toLowerCase().trim();
}

function usageAndExit() {
  console.log('Usage:');
  console.log('  node scripts/matchmaking-debug-user.mjs --uid <uid>');
  console.log('  node scripts/matchmaking-debug-user.mjs --uid <uid> --inactiveHours 24');
  process.exit(1);
}

const uid = argValue('--uid');
if (!uid) usageAndExit();

loadEnvLocal();

const inactiveHours = Number(argValue('--inactiveHours') || 24);
const nowMs = Date.now();
const cutoffMs = nowMs - inactiveHours * 60 * 60 * 1000;

const { db } = getAdmin();

const userRef = db.collection('matchmakingUsers').doc(String(uid));
const userSnap = await userRef.get();
const user = userSnap.exists ? (userSnap.data() || {}) : null;

const appsSnap = await db.collection('matchmakingApplications').where('userId', '==', String(uid)).limit(5).get();
const apps = appsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

const matchesSnap = await db
  .collection('matchmakingMatches')
  .where('userIds', 'array-contains', String(uid))
  .orderBy('createdAt', 'desc')
  .limit(50)
  .get();
const matches = matchesSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));

const lastSeenAtMs = user && typeof user.lastSeenAtMs === 'number' ? user.lastSeenAtMs : 0;
const lock = user && user.matchmakingLock && typeof user.matchmakingLock === 'object' ? user.matchmakingLock : null;
const lockActive = !!(lock && lock.active);
const lockMatchId = lockActive ? String(lock.matchId || '') : '';
const blocked = !!(user && user.blocked);
const cooldownUntilMs = user && typeof user.newMatchCooldownUntilMs === 'number' ? user.newMatchCooldownUntilMs : 0;

const replacementCredits = user && typeof user.newMatchReplacementCredits === 'number' ? user.newMatchReplacementCredits : 0;

const membership = user && user.membership ? user.membership : null;
const membershipActive = !!(membership && membership.active && typeof membership.validUntilMs === 'number' && membership.validUntilMs > nowMs);
const membershipPlan = membership ? safeLower(membership.plan) : '';

const newUserSlot = user && user.newUserSlot ? user.newUserSlot : null;
const newUserSlotActive = !!(newUserSlot && newUserSlot.active);
const newUserSlotSinceMs = newUserSlot && typeof newUserSlot.sinceMs === 'number' ? newUserSlot.sinceMs : 0;
const newUserSlotThreshold = newUserSlot && typeof newUserSlot.threshold === 'number' ? newUserSlot.threshold : 70;

const activeApp = apps[0] || null;
const appCreatedAtMs = activeApp && typeof activeApp.createdAtMs === 'number' ? activeApp.createdAtMs : 0;
const appGender = activeApp ? safeLower(activeApp.gender) : '';
const appLookingForGender = activeApp ? safeLower(activeApp.lookingForGender) : '';

const inactive = lastSeenAtMs > 0 ? lastSeenAtMs <= cutoffMs : appCreatedAtMs > 0 && appCreatedAtMs <= cutoffMs;
const cooldownActive = cooldownUntilMs > nowMs;

const reasons = [];
if (!user) reasons.push('matchmakingUsers doc missing');
if (blocked) reasons.push('blocked');
if (lockActive) reasons.push('matchmakingLock.active');
if (cooldownActive) reasons.push('cooldown_active');
if (!activeApp) reasons.push('no matchmakingApplication');
if (activeApp && (!appGender || !appLookingForGender)) reasons.push('application missing gender/lookingForGender');
if (inactive) reasons.push(`inactive_${inactiveHours}h`);

const eligibleForNewMatches = reasons.length === 0;

const matchStatusCounts = {};
for (const m of matches) {
  const st = safeLower(m.status || '');
  if (!st) continue;
  matchStatusCounts[st] = (matchStatusCounts[st] || 0) + 1;
}

const summary = {
  uid: String(uid),
  nowMs,
  nowIso: msToIso(nowMs),
  inactiveCutoffMs: cutoffMs,
  inactiveCutoffIso: msToIso(cutoffMs),
  userDoc: user ? {
    blocked,
    lockActive,
    lockMatchId,
    newMatchReplacementCredits: replacementCredits,
    lastSeenAtMs,
    lastSeenAtIso: msToIso(lastSeenAtMs),
    cooldownUntilMs,
    cooldownUntilIso: msToIso(cooldownUntilMs),
    membershipActive,
    membershipPlan,
    membershipValidUntilMs: membership && typeof membership.validUntilMs === 'number' ? membership.validUntilMs : 0,
    membershipValidUntilIso: membership && typeof membership.validUntilMs === 'number' ? msToIso(membership.validUntilMs) : null,
    newUserSlotActive,
    newUserSlotSinceMs,
    newUserSlotSinceIso: msToIso(newUserSlotSinceMs),
    newUserSlotThreshold,
  } : null,
  application: activeApp ? {
    id: activeApp.id,
    createdAtMs: appCreatedAtMs,
    createdAtIso: msToIso(appCreatedAtMs),
    gender: appGender,
    lookingForGender: appLookingForGender,
    lookingForNationality: safeLower(activeApp.lookingForNationality || ''),
    nationality: safeLower(activeApp.nationality || ''),
  } : null,
  matches: {
    totalChecked: matches.length,
    statusCounts: matchStatusCounts,
    latest: matches.slice(0, 5).map((m) => ({
      id: m.id,
      status: safeLower(m.status || ''),
      createdAtMs: typeof m.createdAtMs === 'number' ? m.createdAtMs : 0,
      proposedExpiresAtMs: typeof m.proposedExpiresAtMs === 'number' ? m.proposedExpiresAtMs : 0,
      cancelledReason: safeLower(m.cancelledReason || ''),
      confirmedReason: safeLower(m.confirmedReason || ''),
    })),
  },
  derived: {
    inactive,
    cooldownActive,
    eligibleForNewMatches,
    excludedReasons: reasons,
  },
};

console.log(JSON.stringify(summary, null, 2));

if (hasFlag('--explain')) {
  console.log('\nExplanation:');
  console.log('- eligibleForNewMatches is a simplified check used for debugging.');
  console.log('- Actual matching additionally filters by candidate preferences, rematch policy, scoring, and slot rules.');
}
