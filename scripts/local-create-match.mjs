import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvLocal() {
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
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (const a of argv) {
    if (!a.startsWith('--')) {
      args._.push(a);
      continue;
    }

    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) {
      args[m[1]] = m[2];
    } else {
      args[a.slice(2)] = true;
    }
  }
  return args;
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asNum(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function parseProfileNoFromCode(raw) {
  const s = safeStr(raw);
  if (!s) return null;
  const m = s.match(/^mk\s*[-_]?\s*(\d+)$/i);
  if (m) return Number(m[1]);
  if (/^\d+$/.test(s)) return Number(s);
  return null;
}

function normalizeStatus(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'proposed' || s === 'mutual_accepted' || s === 'contact_unlocked') return s;
  return 'mutual_accepted';
}

function normalizeInteraction(v) {
  const s = safeStr(v).toLowerCase();
  if (s === 'chat' || s === 'contact') return s;
  return 'chat';
}

function isIdentityVerifiedUserDoc(data) {
  if (data?.identityVerified === true) return true;
  const st = String(data?.identityVerification?.status || '').toLowerCase().trim();
  return st === 'verified' || st === 'approved';
}

function isMembershipActiveUserDoc(userDoc) {
  const m = userDoc?.membership || null;
  if (!m || !m.active) return false;
  const until = typeof m.validUntilMs === 'number' ? m.validUntilMs : 0;
  return until > Date.now();
}

function buildProfileSnapshot(app, userDoc) {
  const details = app?.details || {};
  return {
    identityVerified: !!(userDoc && isIdentityVerifiedUserDoc(userDoc)),
    proMember: !!(userDoc && isMembershipActiveUserDoc(userDoc)),
    profileNo: asNum(app?.profileNo),
    profileCode: safeStr(app?.profileCode) || (typeof app?.profileNo === 'number' ? `MK-${app.profileNo}` : ''),
    username: safeStr(app?.username),
    fullName: safeStr(app?.fullName),
    age: asNum(app?.age),
    city: safeStr(app?.city),
    country: safeStr(app?.country),
    photoUrls: Array.isArray(app?.photoUrls) ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [],
    details: {
      maritalStatus: safeStr(details?.maritalStatus),
    },
  };
}

async function resolveApplicationByUserId(db, uid) {
  const q = await db.collection('matchmakingApplications').where('userId', '==', uid).limit(1).get();
  if (q.empty) return null;
  const d = q.docs[0];
  return { id: d.id, ...(d.data() || {}) };
}

async function resolveApplication(db, auth, identifier) {
  const raw = safeStr(identifier);
  if (!raw) return null;

  // 0) Email -> auth uid -> application
  if (raw.includes('@')) {
    const u = await auth.getUserByEmail(raw);
    return await resolveApplicationByUserId(db, u.uid);
  }

  // 0.1) Direct uid -> application
  if (raw.length >= 20 && !raw.includes(' ') && !raw.includes('/')) {
    const byUid = await resolveApplicationByUserId(db, raw);
    if (byUid) return byUid;
  }

  // 1) Direct doc id
  try {
    const direct = await db.collection('matchmakingApplications').doc(raw).get();
    if (direct.exists) return { id: direct.id, ...(direct.data() || {}) };
  } catch {
    // ignore
  }

  // 2) profileCode
  try {
    const byCode = await db.collection('matchmakingApplications').where('profileCode', '==', raw).limit(1).get();
    if (!byCode.empty) {
      const d = byCode.docs[0];
      return { id: d.id, ...(d.data() || {}) };
    }
  } catch {
    // ignore
  }

  // 3) profileNo
  const n = parseProfileNoFromCode(raw);
  if (typeof n === 'number' && Number.isFinite(n)) {
    try {
      const byNo = await db.collection('matchmakingApplications').where('profileNo', '==', n).limit(1).get();
      if (!byNo.empty) {
        const d = byNo.docs[0];
        return { id: d.id, ...(d.data() || {}) };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

function usage() {
  console.log(
    [
      'Kullanım:',
      '  node scripts/local-create-match.mjs --a=<email|uid|appId|profileCode> --b=<email|uid|appId|profileCode> [--status=mutual_accepted] [--interaction=chat] [--overwrite]',
      '',
      'Notlar:',
      '  - Bu script Firebase Admin ile Firestore\'a direkt yazar (lokal test içindir).',
      '  - .env.local içinde FIREBASE_SERVICE_ACCOUNT_* ayarlı olmalı (diğer admin scriptleri gibi).',
    ].join('\n')
  );
}

loadEnvLocal();

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) {
  usage();
  process.exit(0);
}

const aInput = safeStr(args.a);
const bInput = safeStr(args.b);
const status = normalizeStatus(args.status);
const interactionMode = normalizeInteraction(args.interaction);
const overwrite = args.overwrite === true || args.overwrite === 'true';

if (!aInput || !bInput) {
  usage();
  process.exit(2);
}

const { db, FieldValue, auth } = getAdmin();

const [aApp, bApp] = await Promise.all([
  resolveApplication(db, auth, aInput),
  resolveApplication(db, auth, bInput),
]);

if (!aApp || !bApp) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: 'application_not_found',
        details: { aFound: !!aApp, bFound: !!bApp },
      },
      null,
      2
    )
  );
  process.exit(1);
}

const aUserId = safeStr(aApp?.userId);
const bUserId = safeStr(bApp?.userId);

if (!aUserId || !bUserId || aUserId === bUserId) {
  console.error(JSON.stringify({ ok: false, error: 'bad_users', details: { aUserId, bUserId } }, null, 2));
  process.exit(1);
}

const userIdsSorted = [aUserId, bUserId].slice().sort();
const matchId = `${userIdsSorted[0]}__${userIdsSorted[1]}`;
const matchRef = db.collection('matchmakingMatches').doc(matchId);

const existing = await matchRef.get();
if (existing.exists && !overwrite) {
  console.log(JSON.stringify({ ok: true, skippedBecauseExists: true, matchId }, null, 2));
  process.exit(0);
}

const [aUserSnap, bUserSnap] = await Promise.all([
  db.collection('matchmakingUsers').doc(aUserId).get(),
  db.collection('matchmakingUsers').doc(bUserId).get(),
]);

const aUserDoc = aUserSnap.exists ? aUserSnap.data() || {} : null;
const bUserDoc = bUserSnap.exists ? bUserSnap.data() || {} : null;

const existingData = existing.exists ? existing.data() || {} : {};
const matchNo = typeof existingData?.matchNo === 'number' && Number.isFinite(existingData.matchNo) ? existingData.matchNo : null;
const existingMatchCode = safeStr(existingData?.matchCode);
const manualSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
const matchCode = existingMatchCode || `ES-LOCAL-${Date.now()}-${manualSuffix}`;

const baseDoc = {
  matchNo,
  matchCode,
  userIds: userIdsSorted,
  aUserId,
  bUserId,
  aApplicationId: aApp.id,
  bApplicationId: bApp.id,
  scoreAtoB: null,
  scoreBtoA: null,
  score: null,
  status,
  decisions: { a: null, b: null },
  profiles: {
    a: buildProfileSnapshot(aApp, aUserDoc),
    b: buildProfileSnapshot(bApp, bUserDoc),
  },
  createdAt: existing.exists ? existingData?.createdAt || FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  createdBy: 'local-script',
};

if (status === 'mutual_accepted' || status === 'contact_unlocked') {
  baseDoc.decisions = { a: 'accept', b: 'accept' };
  baseDoc.mutualAcceptedAt = FieldValue.serverTimestamp();
  baseDoc.interactionMode = interactionMode;
  baseDoc.interactionChosenAt = FieldValue.serverTimestamp();
  baseDoc.interactionChoices = { [aUserId]: interactionMode, [bUserId]: interactionMode };

  if (interactionMode === 'chat') {
    baseDoc.chatEnabledAt = FieldValue.serverTimestamp();
    baseDoc.chatEnabledAtMs = Date.now();
  }

  if (interactionMode === 'contact' || status === 'contact_unlocked') {
    baseDoc.contactUnlockedAt = FieldValue.serverTimestamp();
  }
}

await matchRef.set(baseDoc, { merge: false });

// Kilitleri temizle ki panelde filtreye takılmasın.
for (const uid of [aUserId, bUserId]) {
  await db.collection('matchmakingUsers').doc(uid).set(
    {
      matchmakingLock: { active: false, matchId: '', matchCode: '' },
      matchmakingChoice: { active: false, matchId: '', matchCode: '' },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

console.log(
  JSON.stringify(
    {
      ok: true,
      matchId,
      matchCode,
      status,
      interactionMode,
      aUserId,
      bUserId,
      aApplicationId: aApp.id,
      bApplicationId: bApp.id,
    },
    null,
    2
  )
);
