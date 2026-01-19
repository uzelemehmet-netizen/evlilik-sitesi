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

function pad2(n) {
  return String(n).padStart(2, '0');
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function buildPublicProfile(app, userStatus) {
  const details = app?.details || {};
  return {
    identityVerified: !!userStatus?.identityVerified,
    proMember: !!userStatus?.membershipActive,
    profileNo: typeof app?.profileNo === 'number' ? app.profileNo : null,
    profileCode: typeof app?.profileCode === 'string' ? app.profileCode : '',
    username: typeof app?.username === 'string' ? app.username : '',
    age: typeof app?.age === 'number' ? app.age : null,
    city: typeof app?.city === 'string' ? app.city : '',
    country: typeof app?.country === 'string' ? app.country : '',
    photoUrls: Array.isArray(app?.photoUrls) ? app.photoUrls.filter((u) => typeof u === 'string' && u.trim()) : [],
    details: {
      maritalStatus: typeof details?.maritalStatus === 'string' ? details.maritalStatus : '',
    },
  };
}

loadEnvLocal();

const args = parseArgs(process.argv.slice(2));
const cleanup = !!args.cleanup;
const count = Math.max(1, Math.min(50, Number(args.count || 6)));

const seedBatchId =
  (typeof args.batch === 'string' && args.batch.trim()) || `mk_seed_${new Date().toISOString().replace(/[:.]/g, '-')}_${randomId()}`;

const SEED_TAG = 'mk_seed';

const { db, FieldValue } = getAdmin();

async function seed() {
  const now = Date.now();
  const membershipValidUntilMs = now + 30 * 24 * 60 * 60 * 1000;

  const pairs = [];

  for (let i = 1; i <= count; i += 1) {
    const idx = pad2(i);

    const maleUserId = `seed_${seedBatchId}_male_${idx}`;
    const femaleUserId = `seed_${seedBatchId}_female_${idx}`;

    const male = {
      userId: maleUserId,
      profileNo: 1000 + i,
      profileCode: `MK-${1000 + i}`,
      username: `seed_erkek_${idx}`,
      fullName: `Seed Erkek ${idx}`,
      age: 28 + (i % 5),
      city: 'İstanbul',
      country: 'Türkiye',
      whatsapp: `+90555000${idx}`,
      email: `seed.erkek.${idx}@example.test`,
      instagram: `seed_erkek_${idx}`,
      nationality: 'tr',
      gender: 'male',
      lookingForNationality: 'id',
      lookingForGender: 'female',
      details: {
        heightCm: 175 + (i % 3),
        weightKg: 75 + (i % 4),
        occupation: 'employee',
        education: 'university',
        maritalStatus: 'single',
        hasChildren: 'no',
        childrenCount: 0,
        incomeLevel: 'good',
        religion: 'islam',
        religiousValues: 'religious',
        familyObstacle: 'no',
        familyObstacleDetails: '',
        familyApprovalStatus: 'yes',
        marriageTimeline: '6_12',
        relocationWillingness: 'yes',
        preferredLivingCountry: 'tr',
        languages: {
          native: { code: 'tr', other: '' },
          foreign: { codes: ['en'], other: '' },
        },
        communicationLanguage: 'tr',
        communicationLanguageOther: '',
        canCommunicateWithTranslationApp: true,
        smoking: 'no',
        alcohol: 'no',
      },
      partnerPreferences: {
        heightMinCm: 155,
        heightMaxCm: 180,
        ageMaxOlderYears: null,
        ageMaxYoungerYears: null,
        ageMin: 20,
        ageMax: 35,
        maritalStatus: 'single',
        religion: 'islam',
        communicationLanguage: 'en',
        communicationLanguageOther: '',
        canCommunicateWithTranslationApp: true,
        livingCountry: 'id',
        smokingPreference: 'no',
        alcoholPreference: 'no',
        childrenPreference: 'no_children',
        educationPreference: 'university',
        occupationPreference: 'employee',
        familyValuesPreference: 'religious',
      },
      about: 'Seed test profili (erkek).',
      expectations: 'Uygun eşleşme testi.',
      photoUrls: [],
      photoPaths: [],
      photoCloudinary: [],
      photoContentTypes: ['', '', ''],
      photoOriginalTypes: ['', '', ''],
      lang: 'tr',
      source: 'seed',
      status: 'new',
      consent18Plus: true,
      consentPrivacy: true,
      consentTerms: true,
      consentPhotoShare: true,
    };

    const female = {
      userId: femaleUserId,
      profileNo: 2000 + i,
      profileCode: `MK-${2000 + i}`,
      username: `seed_kadin_${idx}`,
      fullName: `Seed Kadın ${idx}`,
      age: 24 + (i % 5),
      city: 'Jakarta',
      country: 'Indonesia',
      whatsapp: `+62811000${idx}`,
      email: `seed.kadin.${idx}@example.test`,
      instagram: `seed_kadin_${idx}`,
      nationality: 'id',
      gender: 'female',
      lookingForNationality: 'tr',
      lookingForGender: 'male',
      details: {
        heightCm: 160 + (i % 3),
        weightKg: 55 + (i % 4),
        occupation: 'employee',
        education: 'university',
        maritalStatus: 'single',
        hasChildren: 'no',
        childrenCount: 0,
        incomeLevel: 'medium',
        religion: 'islam',
        religiousValues: 'religious',
        familyObstacle: 'no',
        familyObstacleDetails: '',
        familyApprovalStatus: 'yes',
        marriageTimeline: '6_12',
        relocationWillingness: 'yes',
        preferredLivingCountry: 'id',
        languages: {
          native: { code: 'id', other: '' },
          foreign: { codes: ['en'], other: '' },
        },
        communicationLanguage: 'id',
        communicationLanguageOther: '',
        canCommunicateWithTranslationApp: true,
        smoking: 'no',
        alcohol: 'no',
      },
      partnerPreferences: {
        heightMinCm: 165,
        heightMaxCm: 190,
        ageMaxOlderYears: null,
        ageMaxYoungerYears: null,
        ageMin: 24,
        ageMax: 40,
        maritalStatus: 'single',
        religion: 'islam',
        communicationLanguage: 'en',
        communicationLanguageOther: '',
        canCommunicateWithTranslationApp: true,
        livingCountry: 'tr',
        smokingPreference: 'no',
        alcoholPreference: 'no',
        childrenPreference: 'no_children',
        educationPreference: 'university',
        occupationPreference: 'employee',
        familyValuesPreference: 'religious',
      },
      about: 'Seed test profili (kadın).',
      expectations: 'Uygun eşleşme testi.',
      photoUrls: [],
      photoPaths: [],
      photoCloudinary: [],
      photoContentTypes: ['', '', ''],
      photoOriginalTypes: ['', '', ''],
      lang: 'id',
      source: 'seed',
      status: 'new',
      consent18Plus: true,
      consentPrivacy: true,
      consentTerms: true,
      consentPhotoShare: true,
    };

    pairs.push({ maleUserId, femaleUserId, male, female });
  }

  // 1) matchmakingUsers (üyelik + doğrulama) oluştur
  for (const p of pairs) {
    await db
      .collection('matchmakingUsers')
      .doc(p.maleUserId)
      .set(
        {
          seedTag: SEED_TAG,
          seedBatchId,
          gender: 'male',
          membership: { active: true, validUntilMs: membershipValidUntilMs },
          identityVerified: true,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    await db
      .collection('matchmakingUsers')
      .doc(p.femaleUserId)
      .set(
        {
          seedTag: SEED_TAG,
          seedBatchId,
          gender: 'female',
          membership: { active: true, validUntilMs: membershipValidUntilMs },
          identityVerification: { status: 'verified' },
          identityVerified: true,
          updatedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }

  // 2) matchmakingApplications oluştur
  for (const p of pairs) {
    const maleRef = db.collection('matchmakingApplications').doc();
    const femaleRef = db.collection('matchmakingApplications').doc();

    await maleRef.set({
      ...p.male,
      seedTag: SEED_TAG,
      seedBatchId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await femaleRef.set({
      ...p.female,
      seedTag: SEED_TAG,
      seedBatchId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    p.maleAppId = maleRef.id;
    p.femaleAppId = femaleRef.id;
  }

  // 3) matchmakingMatches: bire bir eşleşme üret
  for (const p of pairs) {
    const userIdsSorted = [p.maleUserId, p.femaleUserId].sort();
    const matchId = `${userIdsSorted[0]}__${userIdsSorted[1]}`;

    const aUserId = userIdsSorted[0];
    const bUserId = userIdsSorted[1];
    const aIsMale = aUserId === p.maleUserId;

    const aApp = aIsMale ? p.male : p.female;
    const bApp = aIsMale ? p.female : p.male;

    const aAppId = aIsMale ? p.maleAppId : p.femaleAppId;
    const bAppId = aIsMale ? p.femaleAppId : p.maleAppId;

    const aStatus = { identityVerified: true, membershipActive: true };
    const bStatus = { identityVerified: true, membershipActive: true };

    await db
      .collection('matchmakingMatches')
      .doc(matchId)
      .set({
        seedTag: SEED_TAG,
        seedBatchId,
        userIds: userIdsSorted,
        aUserId,
        bUserId,
        aApplicationId: aAppId,
        bApplicationId: bAppId,
        scoreAtoB: 95,
        scoreBtoA: 95,
        score: 95,
        status: 'proposed',
        decisions: { a: null, b: null },
        profiles: {
          a: buildPublicProfile(aApp, aStatus),
          b: buildPublicProfile(bApp, bStatus),
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
  }

  console.log(JSON.stringify({ ok: true, seedBatchId, pairs: pairs.map((p) => ({
    maleUserId: p.maleUserId,
    femaleUserId: p.femaleUserId,
    maleAppId: p.maleAppId,
    femaleAppId: p.femaleAppId,
  })) }, null, 2));
}

async function cleanupBatch() {
  const batch = typeof args.batch === 'string' && args.batch.trim() ? args.batch.trim() : '';
  if (!batch) {
    console.error('Missing --batch=... for cleanup');
    process.exitCode = 2;
    return;
  }

  const toDelete = [];

  const appsSnap = await db.collection('matchmakingApplications').where('seedBatchId', '==', batch).get();
  appsSnap.docs.forEach((d) => toDelete.push(d.ref));

  const usersSnap = await db.collection('matchmakingUsers').where('seedBatchId', '==', batch).get();
  usersSnap.docs.forEach((d) => toDelete.push(d.ref));

  const matchesSnap = await db.collection('matchmakingMatches').where('seedBatchId', '==', batch).get();
  matchesSnap.docs.forEach((d) => toDelete.push(d.ref));

  for (const ref of toDelete) {
    await ref.delete();
  }

  console.log(JSON.stringify({ ok: true, deleted: toDelete.length, seedBatchId: batch }, null, 2));
}

if (cleanup) {
  await cleanupBatch();
} else {
  await seed();
}
