import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getAdmin } from '../apiRoutes/_firebaseAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const TEST_PREFIX = 'e2e_legacy_uc_gate';
const VIEWER_UID = `${TEST_PREFIX}_viewer`;
const CANDIDATE_UID = `${TEST_PREFIX}_candidate`;
const VIEWER_EMAIL = `${TEST_PREFIX}.viewer@example.test`;
const CANDIDATE_EMAIL = `${TEST_PREFIX}.candidate@example.test`;
const PASSWORD = 'Test1234!';
const VIEWER_CODE = 'UC-990001';
const CANDIDATE_CODE = 'UC-990002';
const VIEWER_APP_ID = `auto_${VIEWER_UID}`;
const CANDIDATE_APP_ID = `auto_${CANDIDATE_UID}`;
const CANDIDATE_USERNAME = 'E2E Legacy Candidate';
const VIEWER_USERNAME = 'E2E Legacy Viewer';

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

function hasFlag(name) {
  const normalized = String(name).toLowerCase();
  return process.argv.some((arg) => String(arg).toLowerCase() === normalized);
}

async function deleteAuthIfExists(auth, uid, email) {
  try {
    await auth.deleteUser(uid);
    return;
  } catch {
    // continue
  }

  try {
    const user = await auth.getUserByEmail(email);
    if (user?.uid) await auth.deleteUser(user.uid);
  } catch {
    // ignore
  }
}

async function cleanup() {
  loadEnvLocal();
  const { auth, db } = getAdmin();

  await db.collection('matchmakingApplications').doc(VIEWER_APP_ID).delete().catch(() => {});
  await db.collection('matchmakingApplications').doc(CANDIDATE_APP_ID).delete().catch(() => {});
  await db.collection('matchmakingUsers').doc(VIEWER_UID).delete().catch(() => {});
  await db.collection('matchmakingUsers').doc(CANDIDATE_UID).delete().catch(() => {});

  await deleteAuthIfExists(auth, VIEWER_UID, VIEWER_EMAIL);
  await deleteAuthIfExists(auth, CANDIDATE_UID, CANDIDATE_EMAIL);

  console.log(JSON.stringify({ ok: true, action: 'cleanup' }, null, 2));
}

async function setup() {
  loadEnvLocal();
  const { auth, db } = getAdmin();
  const now = Date.now();
  const membershipValidUntilMs = now + 14 * 24 * 60 * 60 * 1000;

  await cleanup();

  await auth.createUser({
    uid: VIEWER_UID,
    email: VIEWER_EMAIL,
    password: PASSWORD,
    displayName: 'E2E Legacy Viewer',
    emailVerified: true,
  });

  await auth.createUser({
    uid: CANDIDATE_UID,
    email: CANDIDATE_EMAIL,
    password: PASSWORD,
    displayName: CANDIDATE_USERNAME,
    emailVerified: true,
  });

  await db.collection('matchmakingUsers').doc(VIEWER_UID).set({
    uid: VIEWER_UID,
    email: VIEWER_EMAIL,
    userCode: VIEWER_CODE,
    userCodeNo: 990001,
    userCodeGender: 'male',
    userCodeAssignedAtMs: now,
    gender: 'male',
    lookingForGender: 'female',
    lastSeenAtMs: now,
    createdAtMs: now,
    updatedAtMs: now,
    membership: { active: true, validUntilMs: membershipValidUntilMs },
    publicProfile: {
      userCode: VIEWER_CODE,
      userCodeNo: 990001,
      username: VIEWER_USERNAME,
      gender: 'male',
      lookingForGender: 'female',
      city: 'Istanbul',
      photoUrls: ['https://example.com/e2e-legacy-viewer.jpg'],
      about: 'Legacy UC viewer seed profile for E2E validation.',
    },
  });

  await db.collection('matchmakingUsers').doc(CANDIDATE_UID).set({
    uid: CANDIDATE_UID,
    email: CANDIDATE_EMAIL,
    userCode: CANDIDATE_CODE,
    userCodeNo: 990002,
    userCodeGender: 'female',
    userCodeAssignedAtMs: now,
    gender: 'female',
    lookingForGender: 'male',
    lastSeenAtMs: now,
    createdAtMs: now,
    updatedAtMs: now,
    publicProfile: {
      userCode: CANDIDATE_CODE,
      userCodeNo: 990002,
      gender: 'female',
      lookingForGender: 'male',
    },
  });

  await db.collection('matchmakingApplications').doc(CANDIDATE_APP_ID).set({
    userId: CANDIDATE_UID,
    uid: CANDIDATE_UID,
    userUid: CANDIDATE_UID,
    source: 'e2e_manual',
    username: CANDIDATE_USERNAME,
    fullName: CANDIDATE_USERNAME,
    age: 26,
    city: 'Istanbul',
    country: 'Turkey',
    nationality: 'TR',
    gender: 'female',
    lookingForGender: 'male',
    photoUrls: ['https://example.com/e2e-legacy-candidate.jpg'],
    about: 'Temporary e2e candidate for legacy UC gate coverage.',
    createdAtMs: now,
    updatedAtMs: now,
    details: {
      occupation: 'Engineer',
      maritalStatus: 'single',
    },
  });

  await db.collection('matchmakingApplications').doc(VIEWER_APP_ID).set({
    userId: VIEWER_UID,
    uid: VIEWER_UID,
    userUid: VIEWER_UID,
    source: 'e2e_manual',
    username: VIEWER_USERNAME,
    fullName: 'E2E Legacy Viewer',
    age: 31,
    city: 'Istanbul',
    country: 'Turkey',
    nationality: 'TR',
    gender: 'male',
    lookingForGender: 'female',
    whatsapp: '+905550000001',
    photoUrls: ['https://example.com/e2e-legacy-viewer.jpg'],
    about: 'Legacy UC viewer seed profile for E2E validation.',
    createdAtMs: now,
    updatedAtMs: now,
    details: {
      occupation: 'Engineer',
      maritalStatus: 'single',
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: 'setup',
        viewer: { uid: VIEWER_UID, email: VIEWER_EMAIL, userCode: VIEWER_CODE, username: VIEWER_USERNAME },
        candidate: { uid: CANDIDATE_UID, email: CANDIDATE_EMAIL, userCode: CANDIDATE_CODE, username: CANDIDATE_USERNAME },
      },
      null,
      2,
    ),
  );
}

if (hasFlag('--cleanup')) {
  cleanup().catch((error) => {
    console.error('e2e-legacy-uc-gate cleanup failed:', error?.message || error);
    process.exitCode = 1;
  });
} else {
  setup().catch((error) => {
    console.error('e2e-legacy-uc-gate setup failed:', error?.message || error);
    process.exitCode = 1;
  });
}