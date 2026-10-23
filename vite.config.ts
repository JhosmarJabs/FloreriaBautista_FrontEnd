import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { compression } from 'vite-plugin-compression2';

/**
 * El CSS principal (~240 KB, todo Tailwind) deja de bloquear el primer pintado:
 * así el esqueleto de index.html (con estilos en línea) se pinta en cuanto llega
 * el HTML. Se descarga con prioridad alta vía preload y main.tsx espera a que
 * esté aplicado antes de montar React, para no pintar la app sin estilos.
 */
const cssNoBloqueante = (): Plugin => ({
  name: 'css-no-bloqueante',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler: (html) =>
      html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/,
        (_, href) =>
          `<link rel="preload" as="style" crossorigin href="${href}">` +
          `<link rel="stylesheet" crossorigin href="${href}" id="app-css" media="print" onload="this.media='all'">`,
      ),
  },
});

/**
 * Precache del PWA = shell + PÁGINAS ESTÁTICAS PÚBLICAS.
 *
 * REGLA: toda página estática pública nueva (Política de privacidad, Términos y
 * condiciones, Aviso de privacidad...) se añade a PAGINAS_ESTATICAS: así queda
 * guardada, con su JS/CSS, desde que se abre la app, y se ve sin conexión sin
 * haberla visitado. (Sus imágenes van en includeAssets de VitePWA, más abajo.)
 *
 * Matriz de caché (detalle en documentacion/01-planificacion/pwa-cache-catalogo-offline.md §8.1):
 *   Al abrir la app (precache)   shell, portada y sus secciones, Quiénes somos, Contacto,
 *                                el CÓDIGO del Catálogo, /img/landing y /img/nosotros.
 *   Al abrir la app (datos)      /api/cms y la instantánea /api/products?size=1000
 *                                (services/calentamientoOffline.ts). Nunca imágenes de productos.
 *   Solo al visitarlas           ficha de producto, ofertas, eventos, testimonios, inicio del
 *                                cliente, carrito, mis pedidos, login/registro, checkout... (runtime).
 *   Nunca                        datos privados, /admin y /empleado en navegación.
 */
const PAGINAS_ESTATICAS = [
  // Portada (HomePage ya va en el shell) y sus secciones diferidas
  'src/components/FeaturedCategories.tsx',
  'src/components/HowItWorks.tsx',
  'src/components/EventsSection.tsx',
  'src/components/Testimonials.tsx',
  'src/components/Shipping.tsx',
  'src/components/FAQ.tsx',
  'src/components/Footer.tsx',
  // Quiénes somos, Contacto y el código del Catálogo (sus datos se piden al abrir)
  'src/pages/client/AboutPage.tsx',
  'src/pages/client/ContactPage.tsx',
  'src/pages/client/CatalogPage.tsx',
  // Piezas de la app pública que esas páginas necesitan (un cliente con sesión las ve sin red)
  'src/components/PwaCliente.tsx',
  'src/components/AvisoConexion.tsx',
  'src/components/NavbarCliente.tsx',
];

const precachePwa = new Set<string>();
const recogerPrecachePwa = (): Plugin => ({
  name: 'recoger-precache-pwa',
  apply: 'build',
  generateBundle(_opciones, bundle) {
    const chunks = Object.values(bundle).filter((c) => c.type === 'chunk');
    const pendientes = chunks.filter((c) => c.isEntry).map((c) => c.fileName);
    for (const ruta of PAGINAS_ESTATICAS) {
      const encontrados = chunks.filter((c) =>
        c.moduleIds.some((id) => id.replaceAll('\\', '/').endsWith('/' + ruta)),
      );
      if (encontrados.length === 0) {
        // Un renombre no debe sacar una página del precache sin que nadie lo note.
        this.error(`PAGINAS_ESTATICAS: "${ruta}" no produce ningún chunk (¿se renombró o movió?). Actualiza vite.config.ts.`);
      }
      pendientes.push(...encontrados.map((c) => c.fileName));
    }
    // El registro del SW (PwaUpdatePrompt -> virtual:pwa-register/react) carga workbox-window
    // con import dinámico, que el recorrido de abajo (solo imports estáticos) no sigue.
    const workboxWindow = chunks.filter((c) =>
      c.moduleIds.some((id) => id.replaceAll('\\', '/').includes('/node_modules/workbox-window/')),
    );
    if (workboxWindow.length === 0) {
      this.error('workbox-window no produce ningún chunk (¿cambió el registro del SW o el plugin?). Actualiza vite.config.ts.');
    }
    pendientes.push(...workboxWindow.map((c) => c.fileName));
    while (pendientes.length > 0) {
      const archivo = pendientes.pop()!;
      if (precachePwa.has(archivo)) continue;
      precachePwa.add(archivo);
      const chunk = bundle[archivo];
      if (chunk?.type !== 'chunk') continue;
      pendientes.push(...chunk.imports);
      chunk.viteMetadata?.importedCss.forEach((css) => precachePwa.add(css));
    }
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL || 'http://localhost:5000';

  console.log(`🚀 Vite Proxy Target: ${apiTarget}`);

  return {
    plugins: [
      react(),
      tailwindcss(),
      cssNoBloqueante(),
      recogerPrecachePwa(),
      compression({ algorithm: 'gzip', threshold: 1024, deleteOriginalAssets: false }),
      VitePWA({
        // 'prompt': la versión nueva espera a que el usuario pulse "Actualizar"
        // (PwaUpdatePrompt.tsx). Con autoUpdate, tras un deploy el HTML abierto
        // pedía chunks que ya no existían.
        registerType: 'prompt',
        // El registro lo hace useRegisterSW dentro de un chunk diferido: no se
        // inyecta registerSW.js y no bloquea el renderizado.
        injectRegister: false,
        // Imágenes de las páginas estáticas (portada y Quiénes somos): precache, ver PAGINAS_ESTATICAS.
        includeAssets: ['favicon-64.png', 'Logo-sm.webp', 'apple-touch-icon.png', 'img/landing/*.webp', 'img/nosotros/*.webp'],
        manifest: {
          id: '/',
          name: 'Florería Bautista',
          short_name: 'Fl. Bautista',
          description: 'Arreglos florales artesanales para cada ocasión en San Felipe Orizatlán y alrededores. Envío a domicilio.',
          lang: 'es-MX',
          categories: ['shopping', 'lifestyle'],
          theme_color: '#1a3b5b',
          background_color: '#f0f7ff',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          start_url: '/',
          scope: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Catálogo', url: '/catalogo', icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
            { name: 'Mis pedidos', url: '/mis-pedidos', icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
            { name: 'Contacto', url: '/contacto', icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }] },
          ],
          screenshots: [
            { src: 'pwa-screenshot-wide.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide', label: 'Inicio de Florería Bautista' },
            { src: 'pwa-screenshot-narrow.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow', label: 'Catálogo de arreglos florales' },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          // Toma el control en la primera visita (sin esperar a recargar) para
          // empezar a guardar lo que se visita. No implica skipWaiting.
          clientsClaim: true,
          // Precache = shell + páginas estáticas (ver recogerPrecachePwa). El resto de
          // /assets se guarda al visitarlo, con la regla CacheFirst de abajo.
          manifestTransforms: [
            async (entradas) => ({
              manifest: entradas.filter((e) => !e.url.startsWith('assets/') || precachePwa.has(e.url)),
              warnings: [],
            }),
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/, /^\/hubs/, /^\/admin/, /^\/empleado/],
          // OJO: las funciones de urlPattern se copian como texto a sw.js; no
          // pueden usar variables de este archivo.
          runtimeCaching: [
            {
              // El web privado nunca se sirve desde caché: sin red, offline.html.
              urlPattern: ({ request, url, sameOrigin }) =>
                sameOrigin && request.mode === 'navigate' && /^\/(admin|empleado)(\/|$)/.test(url.pathname),
              handler: 'NetworkOnly',
              options: { precacheFallback: { fallbackURL: '/offline.html' } },
            },
            {
              // Chunks y CSS con hash en el nombre: inmutables. Quedan los de las páginas visitadas.
              urlPattern: ({ url, sameOrigin }) => sameOrigin && /^\/assets\/.+\.(js|css)$/.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'assets-visitados',
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
                // Inmutables (hash en el nombre): se ignora Vary. Si el hosting manda
                // Vary: Origin, lo guardado por el calentamiento (fetch, sin Origin) no
                // coincidiría con la petición de módulo del navegador.
                matchOptions: { ignoreVary: true },
                plugins: [
                  {
                    // Un chunk que ya no existe (tras un deploy) no da 404: el hosting
                    // responde 200 con index.html. Guardarlo dejaría HTML en lugar de
                    // JS durante 30 días, así que solo se guarda JS/CSS de verdad.
                    cacheWillUpdate: async ({ response }) =>
                      response.status === 200 && !(response.headers.get('content-type') || '').includes('text/html')
                        ? response
                        : null,
                  },
                ],
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-css', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-archivos',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/img/'),
              handler: 'CacheFirst',
              options: { cacheName: 'imagenes-sitio', expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 } },
            },
            {
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'imagenes-productos',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            // GET públicos de la API, por LISTA de rutas (no por patrón general), en
            // dos cachés para que la instantánea del catálogo no la expulsen las fichas:
            //   api-catalogo  /api/cms                            sitio: textos, horarios, dirección
            //                 /api/offers  ·  /api/discounts      ofertas y descuentos públicos
            //                 /api/catalogos/temporadas-proximas
            //                 /api/products sin catalogo/categoria/busqueda  (instantánea ?size=1000)
            //   api-detalle   /api/products/{id}  ·  /api/products/recomendados
            //                 /api/products/{id}/recomendados
            //                 /api/products con catalogo, categoria o busqueda  (relacionados)
            // Ninguna devuelve datos por usuario. Además se exige que la petición NO
            // lleve Authorization: el SW nunca guarda una respuesta autenticada.
            // Todo lo demás de /api y /hubs (p. ej. /api/orders/my) no tiene regla
            // y va siempre directo a la red.
            // Lo servido desde la caché (sin red o tras 3 s) llega a la página como un
            // 200 normal: se marca con X-Desde-Cache para que estadoConexion.ts avise.
            {
              urlPattern: ({ url, request, sameOrigin }) =>
                sameOrigin &&
                !request.headers.has('authorization') &&
                (/^\/api\/(cms|offers|discounts|catalogos\/temporadas-proximas)$/i.test(url.pathname) ||
                  (/^\/api\/products$/i.test(url.pathname) &&
                    !url.searchParams.has('catalogo') &&
                    !url.searchParams.has('categoria') &&
                    !url.searchParams.has('busqueda'))),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-catalogo',
                networkTimeoutSeconds: 3,
                expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [200] },
                plugins: [
                  {
                    cachedResponseWillBeUsed: async ({ cachedResponse }) => {
                      if (!cachedResponse) return cachedResponse;
                      const headers = new Headers(cachedResponse.headers);
                      headers.set('X-Desde-Cache', '1');
                      return new Response(await cachedResponse.blob(), {
                        status: cachedResponse.status,
                        statusText: cachedResponse.statusText,
                        headers,
                      });
                    },
                  },
                ],
              },
            },
            {
              urlPattern: ({ url, request, sameOrigin }) =>
                sameOrigin &&
                !request.headers.has('authorization') &&
                (/^\/api\/products(\/recomendados|\/[0-9a-f-]{36}(\/recomendados)?)$/i.test(url.pathname) ||
                  (/^\/api\/products$/i.test(url.pathname) &&
                    (url.searchParams.has('catalogo') ||
                      url.searchParams.has('categoria') ||
                      url.searchParams.has('busqueda')))),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-detalle',
                networkTimeoutSeconds: 3,
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [200] },
                plugins: [
                  {
                    cachedResponseWillBeUsed: async ({ cachedResponse }) => {
                      if (!cachedResponse) return cachedResponse;
                      const headers = new Headers(cachedResponse.headers);
                      headers.set('X-Desde-Cache', '1');
                      return new Response(await cachedResponse.blob(), {
                        status: cachedResponse.status,
                        statusText: cachedResponse.statusText,
                        headers,
                      });
                    },
                  },
                ],
              },
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
            // lucide-react sin chunk propio: agrupado arrastraba a la landing los
            // iconos de todo el panel (JS sin usar). Así cada página lleva los suyos.
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