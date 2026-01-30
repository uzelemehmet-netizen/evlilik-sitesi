import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

function usage(exitCode = 0) {
  // eslint-disable-next-line no-console
  console.log('Kullanım: node scripts/admin-uid.mjs --uid <uid>');
  process.exit(exitCode);
}

loadEnvLocal();

const uid = getArgValue('--uid');
if (!uid) usage(1);

const firebaseAdminPath = path.join(projectRoot, 'apiRoutes', '_firebaseAdmin.js');
const { getAdmin } = await import(pathToFileURL(firebaseAdminPath).href);
const { auth } = getAdmin();

try {
  const user = await auth.getUser(String(uid));
  const providers = Array.isArray(user?.providerData)
    ? user.providerData.map((p) => String(p?.providerId || '')).filter(Boolean)
    : [];

  const summary = [
    `uid=${user?.uid || ''}`,
    `email=${user?.email || ''}`,
    `emailVerified=${String(!!user?.emailVerified)}`,
    `disabled=${String(!!user?.disabled)}`,
    `providers=${providers.join(',')}`,
    `createdAt=${user?.metadata?.creationTime || ''}`,
    `lastSignInAt=${user?.metadata?.lastSignInTime || ''}`,
  ].join(' | ');

  // eslint-disable-next-line no-console
  console.log(summary);
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ ok: false, error: String(e?.code || e?.message || e) }, null, 2));
  process.exitCode = 1;
}
