import { spawn } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';

function spawnLogged(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    // Windows'ta npm/node gibi komutlar güvenilir şekilde PATH üzerinden çalışsın.
    shell: process.platform === 'win32',
    ...options,
  });
  return child;
}

const projectRoot = process.cwd();
const apiPortFile = path.join(projectRoot, '.tmp-dev-api-port');

function safeUnlink(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
}

function readPortFile() {
  try {
    const raw = fs.readFileSync(apiPortFile, 'utf8');
    const n = Number(String(raw || '').trim());
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function waitForPortFile({ timeoutMs = 15000, intervalMs = 150 } = {}) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tick = () => {
      const port = readPortFile();
      if (port) {
        resolve(port);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error('Timed out waiting for dev-api port file'));
        return;
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

function waitForTcp(port, { timeoutMs = 15000, intervalMs = 200 } = {}) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tick = () => {
      const socket = net.connect({ host: '127.0.0.1', port }, () => {
        socket.end();
        resolve(true);
      });

      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for TCP port ${port}`));
          return;
        }
        setTimeout(tick, intervalMs);
      });
    };

    tick();
  });
}

let apiChild;
let webChild;

function shutdown(code = 0) {
  try {
    if (webChild && !webChild.killed) webChild.kill();
  } catch {
    // ignore
  }
  try {
    if (apiChild && !apiChild.killed) apiChild.kill();
  } catch {
    // ignore
  }

  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

(async () => {
  // Ensure .env.local exists and has required keys.
  const ensure = spawnLogged('npm', ['run', 'ensure:env'], {
    env: { ...process.env },
  });

  const ensureExit = await new Promise((resolve) => {
    ensure.on('exit', (c) => resolve(typeof c === 'number' ? c : 1));
  });
  if (ensureExit !== 0) shutdown(ensureExit);

  safeUnlink(apiPortFile);

  apiChild = spawnLogged('npm', ['run', 'dev:api'], {
    env: { ...process.env },
  });

  apiChild.on('exit', (code) => {
    const exitCode = typeof code === 'number' ? code : 1;
    // API kapanırsa dev ortamı da kapanmalı (beklenmeyen durum).
    shutdown(exitCode);
  });

  const apiPort = await waitForPortFile({ timeoutMs: 15000, intervalMs: 150 });

  // Vite proxy target should follow the chosen API port.
  const proxyTarget = `http://localhost:${apiPort}`;
  // eslint-disable-next-line no-console
  console.log(`[dev] Vite proxy: /api -> ${proxyTarget}`);

  webChild = spawnLogged('npm', ['run', 'dev:web:direct'], {
    env: {
      ...process.env,
      VITE_API_PROXY_TARGET: proxyTarget,
    },
  });

  webChild.on('exit', (code) => {
    const exitCode = typeof code === 'number' ? code : 1;
    shutdown(exitCode);
  });
})().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[dev] Failed to start dev environment:', err);
  shutdown(1);
});
