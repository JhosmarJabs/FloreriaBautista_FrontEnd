import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { compression } from 'vite-plugin-compression2';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL || 'http://localhost:5000';

  console.log(`🚀 Vite Proxy Target: ${apiTarget}`);

  return {
    plugins: [
      react(),
      tailwindcss(),
      compression({ algorithm: 'gzip', threshold: 1024, deleteOriginalAssets: false }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['Logo.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'Florería Bautista',
          short_name: 'Fl. Bautista',
          theme_color: '#1e3a5f',
          background_color: '#f0f7ff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/, /^\/hubs/, /^\/admin/, /^\/empleado/],
          globIgnores: ['**/xlsx-*.js', '**/jspdf*.js'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
            {
              urlPattern: /\/assets\/.*\.js$/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'js-chunks', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } },
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-signalr': ['@microsoft/signalr'],
            'vendor-icons': ['lucide-react'],
            'vendor-motion': ['motion'],
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
        '/hubs': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
});