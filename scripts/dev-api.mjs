import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import net from 'node:net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvLocal() {
  const envPath = path.join(projectRoot, '.env.local');
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, 'utf8');
  const lines = raw.split(/\r?\n/);
  let setCount = 0;
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
      setCount += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[dev-api] Loaded .env.local (${setCount} keys applied)`);
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.from('')));
  });
}

loadEnvLocal();

// Local geliştirme ergonomisi: matchmaking aksiyonlarında üyelik kapısını geçici olarak bypass et.
// Not: Production deploy’larda bu script kullanılmadığı için etkisi yoktur.
if (process.env.MATCHMAKING_DEV_BYPASS === undefined) {
  process.env.MATCHMAKING_DEV_BYPASS = '1';
}

function hasEnv(key) {
  const v = process.env[key];
  return v !== undefined && String(v).trim() !== '';
}

function safeLen(key) {
  const v = process.env[key];
  if (v === undefined || v === null) return null;
  return String(v).length;
}

// eslint-disable-next-line no-console
console.log('[dev-api] Env check:', {
  CLOUDINARY_CLOUD_NAME: hasEnv('CLOUDINARY_CLOUD_NAME') || hasEnv('VITE_CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: hasEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: hasEnv('CLOUDINARY_API_SECRET'),
  FIREBASE_SERVICE_ACCOUNT_JSON:
    hasEnv('FIREBASE_SERVICE_ACCOUNT_JSON') ||
    hasEnv('FIREBASE_SERVICE_ACCOUNT') ||
    hasEnv('FIREBASE_SERVICE_ACCOUNT_JSON_FILE') ||
    hasEnv('FIREBASE_SERVICE_ACCOUNT_FILE'),
});

const cloudinaryEnvKeys = Object.keys(process.env).filter((k) => k.toUpperCase().includes('CLOUDINARY'));
// eslint-disable-next-line no-console
console.log(
  '[dev-api] Cloudinary keys (names only):',
  cloudinaryEnvKeys.map((k) => ({ key: JSON.stringify(k), hasValue: hasEnv(k), len: safeLen(k) }))
);

const preferredPort = Number(process.env.PORT || 3000);
const portFilePath = path.join(projectRoot, '.tmp-dev-api-port');
const apiHandlerModulePath = path.join(projectRoot, 'api', '[...route].js');
const { default: apiHandler } = await import(pathToFileURL(apiHandlerModulePath).href);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    // Only serve /api/* here. Everything else: 404.
    if (!url.pathname.startsWith('/api')) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'not_found' }));
      return;
    }

    // Attach helpers expected by our Vercel-style handlers.
    req.query = Object.fromEntries(url.searchParams.entries());

    const bodyBuf = await readBody(req);
    if (bodyBuf.length) {
      // Keep body as string; individual handlers normalize/parse as needed.
      req.body = bodyBuf.toString('utf8');
    } else {
      req.body = undefined;
    }

    await apiHandler(req, res);
  } catch (e) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
    }
    res.end(JSON.stringify({ ok: false, error: String(e?.message || 'server_error') }));
  }
});

function isPortFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, '127.0.0.1');
  });
}

async function pickPort(startPort, maxAttempts = 20) {
  const start = Number(startPort);
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = start + i;
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(candidate)) return candidate;
  }
  return start;
}

function writePortFile(port) {
  try {
    fs.writeFileSync(portFilePath, String(port), 'utf8');
  } catch {
    // ignore
  }
}

function safeUnlinkPortFile() {
  try {
    fs.unlinkSync(portFilePath);
  } catch {
    // ignore
  }
}

safeUnlinkPortFile();

async function listenWithFallback(startPort, maxAttempts = 20) {
  // Önce hızlı bir tahmin yapalım (127.0.0.1 probe). Yine de listen sırasında
  // EADDRINUSE çıkabilir (IPv6/dual-stack). Bu yüzden error handler ile retry yapıyoruz.
  let port = await pickPort(startPort, maxAttempts);
  let attemptsLeft = Math.max(1, maxAttempts);

  return await new Promise((resolve, reject) => {
    const tryListen = (p) => {
      server.removeAllListeners('error');
      server.once('error', (err) => {
        const code = String(err?.code || '');
        if (code === 'EADDRINUSE' && attemptsLeft > 0) {
          attemptsLeft -= 1;
          const next = p + 1;
          // eslint-disable-next-line no-console
          console.log(`[dev-api] Port ${p} dolu. ${next} deneniyor…`);
          setTimeout(() => tryListen(next), 50);
          return;
        }
        reject(err);
      });

      server.listen(p, () => resolve(p));
    };

    if (port !== startPort) {
      // eslint-disable-next-line no-console
      console.log(`[dev-api] Port ${startPort} dolu olabilir. ${port} deneniyor…`);
    }
    tryListen(port);
  });
}

const port = await listenWithFallback(preferredPort, 30);
writePortFile(port);
// eslint-disable-next-line no-console
console.log(`[dev-api] API server listening on http://localhost:${port}`);
