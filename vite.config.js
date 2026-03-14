import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
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
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        registerType: 'prompt',
        injectRegister: null,
        srcDir: 'src',
        filename: 'pwa-sw.js',
        manifestFilename: 'manifest.webmanifest',
        // Bazı ortamlarda plugin generateSW'e düşebildiği için aynı kuralı workbox tarafına da koyuyoruz.
        workbox: {
          // Precache sadece app-shell: fontları precache'e alma (SW install/precache şişmesini azaltır)
          globPatterns: ['**/*.{js,css,ico,svg,webmanifest,txt,xml,json}'],
          globIgnores: ['**/*.{jpg,jpeg,png,webp,avif,gif,mp4,mov,m4v}'],
        },
        injectManifest: {
          // Precache sadece "app shell" için: büyük görseller (public/*.jpg vb.) build'i kırmasın.
          // Precache sadece app-shell: fontları precache'e alma
          globPatterns: ['**/*.{js,css,ico,svg,webmanifest,txt,xml,json}'],
          globIgnores: ['**/*.{jpg,jpeg,png,webp,avif,gif,mp4,mov,m4v}'],
        },
        manifest: {
          name: 'Uniqah',
          short_name: 'Uniqah',
          description: 'Uniqah eşleştirme ve profil paneli',
          start_url: '/panel',
          scope: '/',
          display: 'standalone',
          background_color: '#0b1220',
          theme_color: '#0b1220',
          icons: [
            {
              src: '/pwa-64x64.png?v=20260224-1',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: '/pwa-192x192.png?v=20260224-1',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png?v=20260224-1',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/maskable-icon-512x512.png?v=20260224-1',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Sadece uyarı eşiği: runtime/bundle içeriğini değiştirmez.
      chunkSizeWarningLimit: 2000,
    },
    server: {
      // Windows'ta bazı ortamlarda default host sadece IPv6 (::1) üzerinde dinleyebiliyor.
      // Bu da 127.0.0.1 ile açınca "bağlantı reddedildi" hatasına yol açıyor.
      // `true` => tüm arayüzlerde dinle (IPv4 dahil).
      host: true,
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
