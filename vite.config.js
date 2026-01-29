import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function readDevApiPortFromFile() {
  try {
    const portFile = path.join(process.cwd(), '.tmp-dev-api-port');
    const raw = fs.readFileSync(portFile, 'utf8');
    const port = Number(String(raw || '').trim());
    return Number.isFinite(port) && port > 0 ? port : null;
  } catch {
    return null;
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devApiPort = readDevApiPortFromFile();
  // Windows + WSL ortamlarında `localhost` bazen ::1'e çözülüp WSL relay'e gidebiliyor.
  // Varsayılanı IPv4 loopback'e sabitleyerek /api proxy 503 sorunlarını azaltıyoruz.
  const fallbackTarget = devApiPort ? `http://127.0.0.1:${devApiPort}` : 'http://127.0.0.1:3000';
  const apiTarget = env.VITE_API_PROXY_TARGET || fallbackTarget;

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      port: 5173,
      strictPort: false,
      open: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
