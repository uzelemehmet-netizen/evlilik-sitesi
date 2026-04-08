import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FieldPath } from 'firebase-admin/firestore';

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
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined || String(process.env[key] || '').trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
}

function safeStr(value, maxLen) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  return typeof maxLen === 'number' && maxLen > 0 && s.length > maxLen ? s.slice(0, maxLen) : s;
}

function asObj(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
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

function appCreatedAtMs(app) {
  const ms = typeof app?.createdAtMs === 'number' && Number.isFinite(app.createdAtMs) ? app.createdAtMs : 0;
  if (ms > 0) return ms;
  const ts = tsToMs(app?.createdAt);
  return ts > 0 ? ts : 0;
}

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return '';
  return String(next).trim();
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function usage(exitCode = 0) {
  console.log(`Kullanim:
  node scripts/backfill-matchmaking-occupation-translations.mjs [--dryRun] [--batchSize 100] [--maxWrites 500] [--startAfter <uid>] [--uid <uid>]

Aciklama:
  matchmakingUsers ve matchmakingApplications icindeki meslek alanlarini bulur,
  eksik TR<->ID cevirilerini tamamlar ve kullanici cache alanlarini birlikte gunceller.
`);
  process.exit(exitCode);
}

function pickBestNonStubApplication(apps, isStubMatchmakingApplication) {
  const list = Array.isArray(apps) ? apps : [];
  let best = null;
  let bestScore = -Infinity;
  for (const app of list) {
    if (!app || typeof app !== 'object') continue;
    const created = appCreatedAtMs(app);
    const isStub = isStubMatchmakingApplication(app);
    const score = (isStub ? 0 : 1000) + (created > 0 ? created : 0);
    if (score > bestScore) {
      best = app;
      bestScore = score;
    }
  }
  return best;
}

function getOccupationSnapshot(bestApp, user) {
  const appDetails = asObj(bestApp?.details);
  const userApp = asObj(user?.application);
  const userAppDetails = asObj(userApp?.details);
  const userDetails = asObj(user?.details);
  const publicProfile = asObj(user?.publicProfile);

  const original =
    safeStr(userAppDetails?.occupation, 160) ||
    safeStr(appDetails?.occupation, 160) ||
    safeStr(userDetails?.occupation, 160) ||
    safeStr(publicProfile?.occupation, 160) ||
    safeStr(userAppDetails?.profession, 160) ||
    safeStr(appDetails?.profession, 160) ||
    safeStr(userDetails?.profession, 160) ||
    safeStr(publicProfile?.profession, 160);

  const tr =
    safeStr(userAppDetails?.occupationTr, 160) ||
    safeStr(appDetails?.occupationTr, 160) ||
    safeStr(userDetails?.occupationTr, 160) ||
    safeStr(publicProfile?.occupationTr, 160);

  const id =
    safeStr(userAppDetails?.occupationId, 160) ||
    safeStr(appDetails?.occupationId, 160) ||
    safeStr(userDetails?.occupationId, 160) ||
    safeStr(publicProfile?.occupationId, 160);

  return {
    original,
    tr,
    id,
    appDetails,
    userAppDetails,
    userDetails,
    publicProfile,
  };
}

loadEnvLocal();

if (hasFlag('--help') || hasFlag('-h')) usage(0);

const dryRun = hasFlag('--dryRun');
const batchSize = Number(getArgValue('--batchSize') || '100');
const maxWrites = Number(getArgValue('--maxWrites') || '500');
const targetUid = getArgValue('--uid');
const startAfter = targetUid ? '' : getArgValue('--startAfter');

if (!Number.isFinite(batchSize) || batchSize <= 0 || batchSize > 1000) {
  console.error('Gecersiz --batchSize');
  process.exit(1);
}

if (!Number.isFinite(maxWrites) || maxWrites < 0) {
  console.error('Gecersiz --maxWrites');
  process.exit(1);
}

const firebaseAdminPath = path.join(projectRoot, 'apiRoutes', '_firebaseAdmin.js');
const profileTextPath = path.join(projectRoot, 'apiRoutes', '_matchmakingProfileText.js');
const profileCompletionPath = path.join(projectRoot, 'src', 'utils', 'matchmakingProfileCompletion.js');

const [{ getAdmin }, profileText, { isStubMatchmakingApplication }] = await Promise.all([
  import(pathToFileURL(firebaseAdminPath).href),
  import(pathToFileURL(profileTextPath).href),
  import(pathToFileURL(profileCompletionPath).href),
]);

const { buildBilingualProfileText, inferProfileTextLang, isProfileTextTranslationConfigured, normalizeProfileLang } = profileText;

if (!isProfileTextTranslationConfigured()) {
  console.error(JSON.stringify({ ok: false, error: 'translate_not_configured' }, null, 2));
  process.exit(1);
}

const { db, FieldValue } = getAdmin();
const usersCol = db.collection('matchmakingUsers');
const appsCol = db.collection('matchmakingApplications');

let scanned = 0;
let writes = 0;
let userWrites = 0;
let appWrites = 0;
let translatedFields = 0;
let normalizedFields = 0;
let skippedNoText = 0;
let skippedNoApp = 0;
let skippedAmbiguous = 0;
let skippedPiiBlocked = 0;
let erroredUsers = 0;
let lastDocId = startAfter || '';

async function processUser(uid) {
  const [userSnap, appsSnap] = await Promise.all([
    usersCol.doc(uid).get(),
    appsCol.where('userId', '==', uid).limit(10).get(),
  ]);

  if (!userSnap.exists) return { action: 'missing_user' };

  const user = userSnap.data() || {};
  const apps = Array.isArray(appsSnap?.docs) ? appsSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) })) : [];
  const bestApp = pickBestNonStubApplication(apps, isStubMatchmakingApplication);
  if (!bestApp) skippedNoApp += 1;

  const snapshot = getOccupationSnapshot(bestApp, user);
  if (!snapshot.original) {
    skippedNoText += 1;
    return { action: 'no_text' };
  }

  const profileLang =
    normalizeProfileLang(bestApp?.profileTextLang) ||
    normalizeProfileLang(user?.profileTextLang) ||
    normalizeProfileLang(bestApp?.lang) ||
    normalizeProfileLang(user?.lang);

  const resolvedSource =
    inferProfileTextLang({
      original: snapshot.original,
      trValue: snapshot.tr,
      idValue: snapshot.id,
    }) || normalizeProfileLang(profileLang);

  if (!resolvedSource) {
    skippedAmbiguous += 1;
    return { action: 'ambiguous' };
  }

  let bilingual = null;
  try {
    bilingual = await buildBilingualProfileText(snapshot.original, resolvedSource, {
      maxLen: 160,
      translateChars: 160,
      minChars: 1,
      fallbackSourceLang: resolvedSource,
      trValue: snapshot.tr,
      idValue: snapshot.id,
    });
  } catch (error) {
    if (String(error?.message || error) === 'pii_blocked') {
      skippedPiiBlocked += 1;
      return { action: 'pii_blocked' };
    }
    throw error;
  }

  const nextTr = resolvedSource === 'tr' ? snapshot.original : (snapshot.tr || bilingual.tr || '');
  const nextId = resolvedSource === 'id' ? snapshot.original : (snapshot.id || bilingual.id || '');
  const nowMs = Date.now();

  const appNeeds =
    !!bestApp?.id &&
    (
      safeStr(snapshot.appDetails?.occupation, 160) !== snapshot.original ||
      safeStr(snapshot.appDetails?.occupationTr, 160) !== nextTr ||
      safeStr(snapshot.appDetails?.occupationId, 160) !== nextId
    );
  const userAppNeeds =
    safeStr(snapshot.userAppDetails?.occupation, 160) !== snapshot.original ||
    safeStr(snapshot.userAppDetails?.occupationTr, 160) !== nextTr ||
    safeStr(snapshot.userAppDetails?.occupationId, 160) !== nextId;
  const userDetailsNeeds =
    safeStr(snapshot.userDetails?.occupation, 160) !== snapshot.original ||
    safeStr(snapshot.userDetails?.occupationTr, 160) !== nextTr ||
    safeStr(snapshot.userDetails?.occupationId, 160) !== nextId;
  const publicProfileNeeds =
    safeStr(snapshot.publicProfile?.occupation, 160) !== snapshot.original ||
    safeStr(snapshot.publicProfile?.occupationTr, 160) !== nextTr ||
    safeStr(snapshot.publicProfile?.occupationId, 160) !== nextId;

  if (!appNeeds && !userAppNeeds && !userDetailsNeeds && !publicProfileNeeds) {
    skippedNoText += 1;
    return { action: 'noop' };
  }

  const userPatch = {
    application: {
      details: {
        occupation: snapshot.original,
        occupationTr: nextTr,
        occupationId: nextId,
        profileDetailsTranslatedAtMs: nowMs,
      },
    },
    details: {
      occupation: snapshot.original,
      occupationTr: nextTr,
      occupationId: nextId,
    },
    publicProfile: {
      occupation: snapshot.original,
      occupationTr: nextTr,
      occupationId: nextId,
    },
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtMs: nowMs,
  };

  const appPatch = {
    details: {
      occupation: snapshot.original,
      occupationTr: nextTr,
      occupationId: nextId,
      profileDetailsTranslatedAtMs: nowMs,
    },
    updatedAt: FieldValue.serverTimestamp(),
    updatedAtMs: nowMs,
  };

  const pendingWrites = (bestApp?.id ? 1 : 0) + 1;

  if (dryRun) {
    return {
      action: 'would_write',
      pendingWrites,
      uid,
      appId: bestApp?.id || null,
      sourceLang: resolvedSource,
      translated: !!bilingual?.translated,
    };
  }

  const batch = db.batch();
  if (bestApp?.id) batch.set(appsCol.doc(bestApp.id), appPatch, { merge: true });
  batch.set(usersCol.doc(uid), userPatch, { merge: true });
  await batch.commit();

  writes += pendingWrites;
  if (bestApp?.id) appWrites += 1;
  userWrites += 1;
  if (bilingual?.translated) translatedFields += 1;
  normalizedFields += 1;
  return { action: 'written', pendingWrites };
}

console.log(JSON.stringify({ ok: true, dryRun, batchSize, maxWrites, startAfter: lastDocId || null, uid: targetUid || null }, null, 2));

try {
  if (targetUid) {
    scanned = 1;
    const result = await processUser(targetUid);
    console.log(JSON.stringify({ ok: true, uid: targetUid, result }, null, 2));
  } else {
    while (true) {
      let q = usersCol.orderBy(FieldPath.documentId()).limit(batchSize);
      if (lastDocId) q = q.startAfter(lastDocId);

      const page = await q.get();
      if (page.empty) break;

      for (const docSnap of page.docs) {
        const uid = docSnap.id;
        lastDocId = uid;
        scanned += 1;

        if (!dryRun && maxWrites > 0 && writes >= maxWrites) throw new Error('max_writes_reached');

        try {
          const result = await processUser(uid);
          if (dryRun && result?.action === 'would_write') writes += result.pendingWrites || 0;
        } catch (error) {
          erroredUsers += 1;
          console.error(JSON.stringify({ ok: false, uid, error: String(error?.message || error) }, null, 2));
        }
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        scanned,
        writes,
        userWrites,
        appWrites,
        translatedFields,
        normalizedFields,
        skippedNoText,
        skippedNoApp,
        skippedAmbiguous,
        skippedPiiBlocked,
        erroredUsers,
        lastDocId: lastDocId || null,
      },
      null,
      2,
    ),
  );
} catch (error) {
  const message = String(error?.message || error);
  const ok = message === 'max_writes_reached';
  console.log(
    JSON.stringify(
      {
        ok,
        dryRun,
        error: ok ? null : message,
        scanned,
        writes,
        userWrites,
        appWrites,
        translatedFields,
        normalizedFields,
        skippedNoText,
        skippedNoApp,
        skippedAmbiguous,
        skippedPiiBlocked,
        erroredUsers,
        lastDocId: lastDocId || null,
      },
      null,
      2,
    ),
  );
  if (!ok) process.exitCode = 1;
}