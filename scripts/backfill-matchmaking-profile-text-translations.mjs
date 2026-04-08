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
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined || String(process.env[key]).trim() === '') {
        process.env[key] = key.toUpperCase().includes('PRIVATE_KEY') ? value.replace(/\\n/g, '\n') : value;
      }
    }
  } catch {
    // ignore
  }
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
  // eslint-disable-next-line no-console
  console.log(`Kullanim:
  node scripts/backfill-matchmaking-profile-text-translations.mjs [--dryRun] [--batchSize 100] [--maxWrites 500] [--startAfter <uid>] [--uid <uid>]

Aciklama:
  matchmakingUsers icin en iyi profili bulur, about/expectations alanlarindaki TR<->ID ceviri eksiklerini tamamlar
  ve matchmakingApplications ile matchmakingUsers cache alanlarini birlikte gunceller.
`);
  process.exit(exitCode);
}

function safeStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function asObj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
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

function getFieldSnapshot(bestApp, user, key) {
  const details = asObj(user?.details);
  const publicProfile = asObj(user?.publicProfile);
  const app = {
    original: safeStr(bestApp?.[key]),
    tr: safeStr(bestApp?.[`${key}Tr`]),
    id: safeStr(bestApp?.[`${key}Id`]),
  };
  const detailsFields = {
    original: safeStr(details?.[key]),
    tr: safeStr(details?.[`${key}Tr`]),
    id: safeStr(details?.[`${key}Id`]),
    bio: key === 'about' ? safeStr(details?.bio) : '',
  };
  const publicFields = {
    original: safeStr(publicProfile?.[key]),
    tr: safeStr(publicProfile?.[`${key}Tr`]),
    id: safeStr(publicProfile?.[`${key}Id`]),
  };
  return {
    app,
    details: detailsFields,
    publicProfile: publicFields,
    original: app.original || detailsFields.original || publicFields.original,
    tr: app.tr || detailsFields.tr || publicFields.tr,
    id: app.id || detailsFields.id || publicFields.id,
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
  // eslint-disable-next-line no-console
  console.error('Gecersiz --batchSize');
  process.exit(1);
}

if (!Number.isFinite(maxWrites) || maxWrites < 0) {
  // eslint-disable-next-line no-console
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

const {
  buildBilingualProfileText,
  inferProfileTextLang,
  isProfileTextTranslationConfigured,
  normalizeProfileLang,
} = profileText;

if (!isProfileTextTranslationConfigured()) {
  // eslint-disable-next-line no-console
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

  const profileLang =
    normalizeProfileLang(bestApp?.profileTextLang) ||
    normalizeProfileLang(user?.profileTextLang) ||
    normalizeProfileLang(bestApp?.lang) ||
    normalizeProfileLang(user?.lang);

  const fieldStates = [];
  for (const key of ['about', 'expectations']) {
    const snapshot = getFieldSnapshot(bestApp, user, key);
    if (!snapshot.original) continue;

    const inferredFromText = inferProfileTextLang({ original: snapshot.original });
    const inferredFromStoredFields = inferProfileTextLang({
      original: snapshot.original,
      trValue: snapshot.tr,
      idValue: snapshot.id,
    });
    const resolvedSource = inferredFromText || inferredFromStoredFields || normalizeProfileLang(profileLang);

    if (!resolvedSource) {
      fieldStates.push({ key, snapshot, skipped: 'source_lang_unknown' });
      continue;
    }

    const sourceValue = resolvedSource === 'tr' ? snapshot.tr : snapshot.id;
    const targetValue = resolvedSource === 'tr' ? snapshot.id : snapshot.tr;
    const mirroredTarget = !!targetValue && targetValue === snapshot.original;
    const mirroredSource = !!sourceValue && sourceValue === snapshot.original;
    const targetNeedsTranslation = !targetValue || (mirroredTarget && mirroredSource);
    const bilingual = !dryRun && targetNeedsTranslation
      ? await buildBilingualProfileText(snapshot.original, resolvedSource, { fallbackSourceLang: resolvedSource })
      : null;

    fieldStates.push({
      key,
      snapshot,
      resolvedSource,
      sourceValue,
      targetValue,
      bilingual,
    });
  }

  if (!fieldStates.length) {
    skippedNoText += 1;
    return { action: 'no_text' };
  }

  if (fieldStates.every((item) => item?.skipped === 'source_lang_unknown')) {
    skippedAmbiguous += 1;
    return { action: 'ambiguous' };
  }

  const nowMs = Date.now();
  const appPatch = {};
  const detailsPatch = {};
  const publicProfilePatch = {};
  const userPatch = {};
  const translateMeta = asObj(bestApp?.profileTextTranslate);
  let resolvedProfileLang = '';
  let changed = false;

  for (const state of fieldStates) {
    if (state?.skipped) continue;
    const { key, snapshot, resolvedSource, sourceValue, bilingual, targetValue } = state;
    const targetNeedsTranslation = !targetValue || (targetValue === snapshot.original && sourceValue === snapshot.original);
    const trValue =
      resolvedSource === 'tr'
        ? snapshot.original
        : targetNeedsTranslation
          ? bilingual?.tr || ''
          : snapshot.tr || '';
    const idValue =
      resolvedSource === 'id'
        ? snapshot.original
        : targetNeedsTranslation
          ? bilingual?.id || ''
          : snapshot.id || '';
    const normalizedSourceValue = resolvedSource === 'tr' ? trValue : idValue;
    const targetFilled = resolvedSource === 'tr' ? !!idValue : !!trValue;
    const appNeeds = !!bestApp?.id && (snapshot.app.original !== snapshot.original || snapshot.app.tr !== trValue || snapshot.app.id !== idValue);
    const detailsNeeds =
      snapshot.details.original !== snapshot.original ||
      snapshot.details.tr !== trValue ||
      snapshot.details.id !== idValue ||
      (key === 'about' && snapshot.details.bio !== snapshot.original);
    const publicProfileNeeds =
      snapshot.publicProfile.original !== snapshot.original || snapshot.publicProfile.tr !== trValue || snapshot.publicProfile.id !== idValue;
    const metaNeeds = !asObj(bestApp?.profileTextTranslate)?.[key] || !(bestApp?.profileTextTranslatedAtMs > 0);
    const needsWrite = appNeeds || detailsNeeds || publicProfileNeeds || metaNeeds;

    if (!resolvedProfileLang) resolvedProfileLang = resolvedSource;
    if (!normalizedSourceValue || !needsWrite) continue;

    appPatch[key] = snapshot.original;
    appPatch[`${key}Tr`] = trValue;
    appPatch[`${key}Id`] = idValue;
    detailsPatch[key] = snapshot.original;
    detailsPatch[`${key}Tr`] = trValue;
    detailsPatch[`${key}Id`] = idValue;
    publicProfilePatch[key] = snapshot.original;
    publicProfilePatch[`${key}Tr`] = trValue;
    publicProfilePatch[`${key}Id`] = idValue;
    if (key === 'about') detailsPatch.bio = snapshot.original;

    translateMeta[key] = {
      sourceLang: resolvedSource,
      targetLang: resolvedSource === 'tr' ? 'id' : 'tr',
      translated: !!bilingual?.translated,
      skipped: !bilingual,
      truncated: !!bilingual?.truncated,
      translateConfigured: true,
    };

    if (bilingual?.translated) translatedFields += 1;
    if (!sourceValue || !targetFilled) normalizedFields += 1;
    changed = true;
  }

  if (!resolvedProfileLang) resolvedProfileLang = profileLang;

  const appLangNeeds = !!bestApp?.id && !!resolvedProfileLang && safeStr(bestApp?.profileTextLang) !== resolvedProfileLang;
  const userLangNeeds = !!resolvedProfileLang && safeStr(user?.profileTextLang) !== resolvedProfileLang;

  if (!changed && !appLangNeeds && !userLangNeeds) {
    skippedNoText += 1;
    return { action: 'noop' };
  }

  if (resolvedProfileLang) {
    appPatch.profileTextLang = resolvedProfileLang;
    userPatch.profileTextLang = resolvedProfileLang;
  }

  appPatch.profileTextTranslate = translateMeta;
  appPatch.profileTextTranslatedAtMs = nowMs;
  appPatch.userTextsUpdatedAt = FieldValue.serverTimestamp();
  appPatch.userTextsUpdatedAtMs = nowMs;

  if (Object.keys(detailsPatch).length) userPatch.details = detailsPatch;
  if (Object.keys(publicProfilePatch).length) userPatch.publicProfile = publicProfilePatch;
  userPatch.profileTextsUpdatedAt = FieldValue.serverTimestamp();
  userPatch.profileTextsUpdatedAtMs = nowMs;
  userPatch.updatedAt = FieldValue.serverTimestamp();
  userPatch.updatedAtMs = nowMs;

  const pendingWrites = (bestApp?.id ? 1 : 0) + 1;

  if (dryRun) {
    return {
      action: 'would_write',
      pendingWrites,
      uid,
      appId: bestApp?.id || null,
      profileTextLang: resolvedProfileLang || null,
      fields: fieldStates.map((item) => ({
        key: item.key,
        sourceLang: item.resolvedSource || null,
        translated: !!item?.bilingual?.translated,
        skipped: item.skipped || null,
      })),
    };
  }

  const batch = db.batch();
  if (bestApp?.id) batch.set(appsCol.doc(bestApp.id), appPatch, { merge: true });
  batch.set(usersCol.doc(uid), userPatch, { merge: true });
  await batch.commit();

  writes += pendingWrites;
  if (bestApp?.id) appWrites += 1;
  userWrites += 1;
  return { action: 'written', pendingWrites };
}

// eslint-disable-next-line no-console
console.log(JSON.stringify({ ok: true, dryRun, batchSize, maxWrites, startAfter: lastDocId || null, uid: targetUid || null }, null, 2));

try {
  if (targetUid) {
    scanned = 1;
    const result = await processUser(targetUid);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ok: true, uid: targetUid, result }, null, 2));
  } else {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let q = usersCol.orderBy(FieldPath.documentId()).limit(batchSize);
      if (lastDocId) q = q.startAfter(lastDocId);

      const page = await q.get();
      if (page.empty) break;

      for (const docSnap of page.docs) {
        const uid = docSnap.id;
        lastDocId = uid;
        scanned += 1;

        if (!dryRun && maxWrites > 0 && writes >= maxWrites) {
          throw new Error('max_writes_reached');
        }

        try {
          const result = await processUser(uid);
          if (dryRun && result?.action === 'would_write') writes += result.pendingWrites || 0;
        } catch (error) {
          erroredUsers += 1;
          // eslint-disable-next-line no-console
          console.error(JSON.stringify({ ok: false, uid, error: String(error?.message || error) }, null, 2));
        }
      }
    }
  }

  // eslint-disable-next-line no-console
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
        erroredUsers,
        lastDocId: lastDocId || null,
      },
      null,
      2
    )
  );
} catch (error) {
  const message = String(error?.message || error);
  const ok = message === 'max_writes_reached';
  // eslint-disable-next-line no-console
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
        erroredUsers,
        lastDocId: lastDocId || null,
      },
      null,
      2
    )
  );
  if (!ok) process.exitCode = 1;
}