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

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase();
}

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return '';
  return next;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    if (!stdin.isTTY) {
      reject(new Error('stdin_not_tty'));
      return;
    }

    let value = '';
    stdout.write(question);

    const onData = (chunk) => {
      const s = chunk.toString('utf8');

      // Enter
      if (s === '\r' || s === '\n' || s === '\r\n') {
        stdout.write('\n');
        cleanup();
        resolve(value);
        return;
      }

      // Ctrl+C
      if (s === '\u0003') {
        stdout.write('\n');
        cleanup();
        reject(new Error('cancelled'));
        return;
      }

      // Backspace (Windows: \b, some terminals: DEL)
      if (s === '\b' || s === '\u007f') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          // Move back, erase, move back
          stdout.write('\b \b');
        }
        return;
      }

      // Ignore other control chars
      if (/^[\x00-\x1F\x7F]$/.test(s)) {
        return;
      }

      value += s;
      stdout.write('*');
    };

    const cleanup = () => {
      try {
        stdin.setRawMode(false);
      } catch {
        // ignore
      }
      stdin.pause();
      stdin.removeListener('data', onData);
    };

    try {
      stdin.setRawMode(true);
      stdin.resume();
      stdin.on('data', onData);
    } catch (e) {
      cleanup();
      reject(e);
    }
  });
}

function usage(exitCode = 0) {
  // eslint-disable-next-line no-console
  console.log(`\nKullanım:\n  node scripts/admin-user.mjs --email <mail> --check\n  node scripts/admin-user.mjs --email <mail> --create-if-missing\n  node scripts/admin-user.mjs --email <mail> --set-password <yeniSifre> --create-if-missing\n  node scripts/admin-user.mjs --email <mail> --set-admin-claim\n  node scripts/admin-user.mjs --email <mail> --clear-admin-claim\n\nDavranış:\n- --set-password verilmezse script şifreyi terminalde sorar (maskeli).\n- --set-admin-claim / --clear-admin-claim: Firebase Auth custom claim yazar.\n\nNotlar:\n- .env.local içindeki FIREBASE_SERVICE_ACCOUNT_JSON_FILE / JSON ile admin yetkisi gerekir.\n- Custom claim değişince kullanıcı tekrar giriş yapmalı (token yenilensin).\n`);
  process.exit(exitCode);
}

loadEnvLocal();

const email = normalizeEmail(getArgValue('--email'));
if (!email) usage(1);

const doCheck = hasFlag('--check');
const setAdminClaim = hasFlag('--set-admin-claim');
const clearAdminClaim = hasFlag('--clear-admin-claim');
let newPassword = getArgValue('--set-password');
const createIfMissing = hasFlag('--create-if-missing');

if (setAdminClaim && clearAdminClaim) {
  // eslint-disable-next-line no-console
  console.error('Hata: --set-admin-claim ve --clear-admin-claim aynı anda kullanılamaz.');
  process.exit(1);
}

if ((setAdminClaim || clearAdminClaim) && doCheck) {
  // eslint-disable-next-line no-console
  console.error('Hata: --check ile admin-claim bayraklarını birlikte kullanmayın.');
  process.exit(1);
}

if (!doCheck && !setAdminClaim && !clearAdminClaim && newPassword === null) {
  // password not provided -> prompt
  try {
    newPassword = await promptHidden('Yeni şifre: ');
  } catch {
    usage(1);
  }
}

const firebaseAdminPath = path.join(projectRoot, 'apiRoutes', '_firebaseAdmin.js');
const { getAdmin } = await import(pathToFileURL(firebaseAdminPath).href);
const { auth } = getAdmin();

async function getUserByEmailSafe(targetEmail) {
  try {
    const user = await auth.getUserByEmail(targetEmail);
    return { user, found: true };
  } catch (e) {
    const code = String(e?.code || '');
    if (code === 'auth/user-not-found') return { user: null, found: false };
    throw e;
  }
}

function summarizeUser(user) {
  const providers = Array.isArray(user?.providerData)
    ? user.providerData.map((p) => String(p?.providerId || '')).filter(Boolean)
    : [];

  return {
    uid: user?.uid || null,
    email: user?.email || null,
    emailVerified: !!user?.emailVerified,
    disabled: !!user?.disabled,
    providers,
    customClaims: user?.customClaims && typeof user.customClaims === 'object' ? user.customClaims : {},
    createdAt: user?.metadata?.creationTime || null,
    lastSignInAt: user?.metadata?.lastSignInTime || null,
  };
}

if (doCheck) {
  const { user, found } = await getUserByEmailSafe(email);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ email, found, user: found ? summarizeUser(user) : null }, null, 2));
  process.exit(0);
}

if (setAdminClaim || clearAdminClaim) {
  const { user, found } = await getUserByEmailSafe(email);
  if (!found) {
    // eslint-disable-next-line no-console
    console.error('Hata: Bu email bu Firebase projesinde bulunamadı.');
    process.exit(1);
  }

  const currentClaims = user.customClaims && typeof user.customClaims === 'object' ? user.customClaims : {};
  const nextClaims = { ...currentClaims };
  if (setAdminClaim) nextClaims.admin = true;
  if (clearAdminClaim) delete nextClaims.admin;

  await auth.setCustomUserClaims(user.uid, nextClaims);
  const updated = await auth.getUser(user.uid);
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        action: setAdminClaim ? 'set_admin_claim' : 'clear_admin_claim',
        email,
        uid: updated.uid,
        customClaims: updated.customClaims || {},
      },
      null,
      2
    )
  );
  process.exit(0);
}

if (typeof newPassword !== 'string' || newPassword.length < 6) {
  // eslint-disable-next-line no-console
  console.error('Hata: --set-password <yeniSifre> zorunlu ve en az 6 karakter olmalı.');
  process.exit(1);
}

const { user, found } = await getUserByEmailSafe(email);

if (!found) {
  if (!createIfMissing) {
    // eslint-disable-next-line no-console
    console.error('Hata: Bu email bu Firebase projesinde bulunamadı. Oluşturmak için --create-if-missing ekleyin.');
    process.exit(1);
  }

  const created = await auth.createUser({
    email,
    password: newPassword,
    emailVerified: true,
    disabled: false,
  });

  const createdUser = await auth.getUser(created.uid);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ action: 'created', user: summarizeUser(createdUser) }, null, 2));
  process.exit(0);
}

await auth.updateUser(user.uid, { password: newPassword, disabled: false });
const updated = await auth.getUser(user.uid);
// eslint-disable-next-line no-console
console.log(JSON.stringify({ action: 'updated_password', user: summarizeUser(updated) }, null, 2));
