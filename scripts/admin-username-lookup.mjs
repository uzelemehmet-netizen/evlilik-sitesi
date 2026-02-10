import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

    if (process.env[key] === undefined || String(process.env[key]).trim() === '') {
      process.env[key] = value;
    }
  }
}

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return '';
  return next;
}

function normalizeUsernameLower(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_\-\.]/g, '');
}

function usage(exitCode = 0) {
  // eslint-disable-next-line no-console
  console.log(`\nKullanım:\n  node scripts/admin-username-lookup.mjs --username <username>\n\nNotlar:\n- Firebase Admin erişimi için .env.local içinde FIREBASE_SERVICE_ACCOUNT_JSON_FILE veya JSON gerekir.\n- Bu script sadece var/yok ve minimal özet basar (PII dökmez).\n`);
  process.exit(exitCode);
}

loadEnvLocal();

const rawUsername = getArgValue('--username');
if (!rawUsername) usage(1);

const usernameLower = normalizeUsernameLower(rawUsername);
if (!usernameLower) {
  // eslint-disable-next-line no-console
  console.error('Hata: geçerli bir username verin.');
  process.exit(1);
}

const firebaseAdminPath = path.join(projectRoot, 'apiRoutes', '_firebaseAdmin.js');
const { getAdmin } = await import(pathToFileURL(firebaseAdminPath).href);
const { db } = getAdmin();

async function safeGetDoc(col, id) {
  try {
    const snap = await db.collection(col).doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, data: snap.data() };
  } catch (e) {
    return { error: String(e?.message || e) };
  }
}

function pickMinimalApp(doc) {
  const data = doc?.data && typeof doc.data === 'object' ? doc.data : {};
  return {
    id: doc?.id || null,
    usernameLower: data?.usernameLower || null,
    userId: data?.userId || null,
    source: data?.source || null,
    createdAtMs: data?.createdAtMs ?? null,
    updatedAtMs: data?.updatedAtMs ?? null,
  };
}

function pickMinimalUser(doc) {
  const data = doc?.data && typeof doc.data === 'object' ? doc.data : {};
  return {
    id: doc?.id || null,
    usernameLower: data?.usernameLower || null,
    isAdmin: !!data?.isAdmin,
    markedSystem: !!data?.markedSystem,
    createdAtMs: data?.createdAtMs ?? null,
    updatedAtMs: data?.updatedAtMs ?? null,
  };
}

const out = {
  query: { rawUsername, usernameLower },
  applications: { byDocId: null, byField: [] },
  users: { byDocId: null, byField: [] },
};

// 1) matchmakingApplications: docId==usernameLower (yeni sistem) kontrolü
const appById = await safeGetDoc('matchmakingApplications', usernameLower);
if (appById && !appById.error) out.applications.byDocId = pickMinimalApp(appById);
if (appById && appById.error) out.applications.byDocId = { error: appById.error };

// 2) matchmakingApplications: usernameLower alanı eşleşmesi (legacy docs)
try {
  const snap = await db.collection('matchmakingApplications').where('usernameLower', '==', usernameLower).limit(10).get();
  out.applications.byField = snap.docs.map((d) => pickMinimalApp({ id: d.id, data: d.data() }));
} catch (e) {
  out.applications.byField = [{ error: String(e?.message || e) }];
}

// 3) matchmakingUsers cache: docId==uid olma ihtimali yüksek ama yine de docId==usernameLower kontrolü
const userById = await safeGetDoc('matchmakingUsers', usernameLower);
if (userById && !userById.error) out.users.byDocId = pickMinimalUser(userById);
if (userById && userById.error) out.users.byDocId = { error: userById.error };

// 4) matchmakingUsers: usernameLower alanı eşleşmesi
try {
  const snap = await db.collection('matchmakingUsers').where('usernameLower', '==', usernameLower).limit(10).get();
  out.users.byField = snap.docs.map((d) => pickMinimalUser({ id: d.id, data: d.data() }));
} catch (e) {
  out.users.byField = [{ error: String(e?.message || e) }];
}

const found =
  (!!out.applications.byDocId && !out.applications.byDocId.error) ||
  (Array.isArray(out.applications.byField) && out.applications.byField.some((x) => x && !x.error)) ||
  (!!out.users.byDocId && !out.users.byDocId.error) ||
  (Array.isArray(out.users.byField) && out.users.byField.some((x) => x && !x.error));

// eslint-disable-next-line no-console
console.log(JSON.stringify({ ok: true, found, ...out }, null, 2));
