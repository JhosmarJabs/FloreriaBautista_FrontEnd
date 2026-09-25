# Reporte Final de Optimizacion de Performance — Frontend Floreria Bautista

**Fecha:** 2026-09-24
**Autor:** Claude (Senior Frontend Performance Engineer)
**Stack:** React 19 + Vite 6 + Tailwind CSS 4 + motion v12
**Alcance:** Optimizacion de carga inicial (homepage publica), reduccion de bundle, deferimiento de recursos no criticos.

---

## A. Diagnostico Inicial

### Metricas de Referencia (Lighthouse pre-optimizacion)

| Metrica | Valor |
|---------|-------|
| FCP | 18.6 s |
| LCP | 39.6 s |
| Speed Index | 25.5 s |
| TBT | 2,134 ms |
| Main Thread Work | 10,019 ms |
| JS Execution Time | 3,645 ms |

### Problemas Identificados

1. **Bundle principal monolitico (371 KB / 108 KB gz)**: contenia AdminLayout, EmployeeLayout, NavbarCliente, DataService, SignalR, react-icons, y toda la logica de todos los roles.
2. **SignalR cargado para todos los usuarios**: `vendor-signalr` (55 KB) se importaba estaticamente en App.tsx via `RealtimeOrdersProvider`, incluso para visitantes publicos.
3. **xlsx (338 KB) importado estaticamente**: `import * as XLSX from "xlsx"` en ImportModal.tsx se incluia en el chunk de CatalogPage aunque solo se usa cuando el admin sube un archivo.
4. **react-icons en la ruta critica**: Footer.tsx importaba `react-icons/fa` (tree-shakeable, pero la dependencia completa se incluia en el grafo de modulos).
5. **LCP image sin preload**: la imagen hero de `lh3.googleusercontent.com` no tenia hint de precarga.
6. **Google Fonts render-blocking**: la hoja de estilos de fuentes bloqueaba el render.
7. **PWA precache excesivo**: sin limite de tamano, el Service Worker precacheaba xlsx (430 KB) y jspdf (391 KB) innecesariamente.

---

## B. Cambios Implementados

### Fix 1: Vendor Chunking (React, SignalR, Motion)
- **Archivo:** `vite.config.ts`
- **Hipotesis:** Separar dependencias de terceros en chunks nombrados permite cache de larga duracion independiente y paralelismo de descarga.
- **Cambio:** Agregados `manualChunks` para `vendor-react`, `vendor-signalr`, `vendor-motion`.
- **Impacto:** Cada vendor se cachea por separado; actualizaciones de codigo de la app no invalidan los chunks de librerias.

### Fix 2: Lazy-load de Layouts por Rol
- **Archivos:** `Layout.tsx`
- **Hipotesis:** AdminLayout (22 iconos lucide, motion, NotificationsService) y EmployeeLayout no se necesitan para visitantes publicos.
- **Cambio:** `AdminLayout`, `EmployeeLayout`, `NavbarCliente` convertidos a `React.lazy()` con `<Suspense fallback={null}>`.
- **Impacto:** Bundle principal reducido de 371 KB a 231 KB (-38%).

### Fix 3: DataService init() diferido
- **Archivo:** `Layout.tsx`
- **Hipotesis:** DataService carga 6 archivos JSON (~42 KB total) que solo se usan en paginas admin. No debe bloquear el render publico.
- **Cambio:** Convertido de `import { DataService }` a `import('../services/dataService').then(m => m.DataService.init())`.
- **Impacto:** Eliminado del bundle principal. Se carga asincrona y no bloquea el hilo principal.

### Fix 4: RealtimeWrapper (SignalR condicional)
- **Archivos:** `App.tsx`, nuevo `RealtimeWrapper.tsx`
- **Hipotesis:** Solo admin/empleado necesitan WebSocket de pedidos en tiempo real. El 90%+ del trafico (visitantes publicos) no lo necesita.
- **Cambio:** Creado `RealtimeWrapper.tsx` que agrupa `RealtimeOrdersProvider` + `RealtimeModals`. Cargado via `React.lazy()` solo cuando `esAdmin || esEmpleado`.
- **Impacto:** `vendor-signalr` (55 KB) ya NO se carga en la homepage publica. Verificado via network requests.

### Fix 5: xlsx con import() dinamico
- **Archivo:** `ImportModal.tsx`
- **Hipotesis:** xlsx (338 KB raw, 430 KB chunk) solo se necesita cuando el usuario selecciona un archivo para importar, no al cargar el modal.
- **Cambio:** `import * as XLSX from "xlsx"` reemplazado por `const XLSX = await import("xlsx")` dentro de `handleFileChange`.
- **Impacto:** xlsx se carga bajo demanda, no en el chunk de CatalogPage.

### Fix 6: react-icons eliminado del Footer
- **Archivo:** `Footer.tsx`
- **Hipotesis:** Importar `react-icons/fa` para 3 iconos arrastra la dependencia al grafo de modulos critico.
- **Cambio:** `FaFacebook`, `FaInstagram`, `FaWhatsapp` reemplazados con SVGs inline (<1 KB total vs dependencia de modulo).
- **Impacto:** Eliminada dependencia de `react-icons` de la ruta critica del footer.

### Fix 7: Preload de la imagen LCP
- **Archivo:** `index.html`
- **Hipotesis:** La imagen hero es el elemento LCP. Sin preload, el navegador no comienza la descarga hasta que React renderiza el componente HeroSection.
- **Cambio:** Agregado `<link rel="preload" as="image" href="..." fetchpriority="high" />` antes de la hoja de fuentes.
- **Impacto:** El navegador comienza la descarga de la imagen LCP inmediatamente, sin esperar JavaScript.

### Fix 8: Google Fonts no-blocking
- **Archivo:** `index.html`
- **Hipotesis:** La hoja de estilos de Google Fonts bloquea el render (~90ms en cada carga).
- **Cambio:** `media="print" onload="this.media='all'"` en el link de fuentes.
- **Impacto:** Las fuentes se cargan asincronamente. El texto se muestra con fuente del sistema inmediatamente y hace swap cuando la fuente carga.

### Fix 9: PWA Service Worker optimizado
- **Archivo:** `vite.config.ts`
- **Hipotesis:** Precachear xlsx (430 KB) y jspdf (391 KB) en el SW consume ~820 KB de cache sin beneficio real (se usan raramente y bajo demanda).
- **Cambio:** `globIgnores` para excluir xlsx y jspdf del precache. Runtime caching `StaleWhileRevalidate` para chunks JS. `CacheFirst` para Google Fonts.
- **Impacto:** Precache reducido a 194 entradas (2,303 KB). Chunks grandes se cachean al primer uso via runtime caching.

---

## C. Tabla Comparativa

### Bundle Sizes

| Metrica | Antes | Despues | Cambio |
|---------|-------|---------|--------|
| Bundle principal (index.js) | 371 KB (108 KB gz) | 231 KB (72 KB gz) | **-38%** |
| vendor-react | (incluido en index.js) | 50 KB (17 KB gz) | separado |
| vendor-motion | 134 KB (44 KB gz) | 127 KB (42 KB gz) | -5% |
| vendor-signalr (homepage) | 55 KB (14 KB gz) cargado | 55 KB (14 KB gz) **diferido** | no carga en publico |
| xlsx (CatalogPage) | 338 KB en el chunk | **import() dinamico** | no carga sin interaccion |
| Total JS inicial (homepage) | ~583 KB raw | ~430 KB raw | **-26%** |
| Total JS gzipped (homepage) | ~173 KB | ~138 KB | **-20%** |

### Recursos Cargados en Homepage Publica

| Recurso | Antes | Despues |
|---------|-------|---------|
| vendor-signalr | SI | NO |
| AdminLayout chunk | SI | NO |
| EmployeeLayout chunk | SI | NO |
| NavbarCliente chunk | SI | NO |
| DataService (init) | Sincrono | Async |
| react-icons/fa | SI | NO (SVG inline) |
| xlsx chunk | Via CatalogPage | Solo con interaccion |
| Google Fonts CSS | Render-blocking | Non-blocking |
| Hero image | Sin preload | Preloaded (high priority) |

---

## D. Validacion Funcional

### Paginas Verificadas

| Pagina | Estado | Notas |
|--------|--------|-------|
| Homepage (/) | OK | Hero, categorias, como funciona, eventos, testimonios, envio, FAQ, footer renderizan correctamente |
| Catalogo (/catalogo) | OK | Filtros, busqueda, grid de productos funcionales |
| Login (/login) | OK | Formulario con campos email/contrasena, boton, diseño split-screen |
| Footer | OK | Iconos SVG inline (Facebook, Instagram, WhatsApp), enlaces, contacto, horarios |
| Navegacion | OK | Logo, menu items, boton "Iniciar sesion" |
| PantallaCarga | OK | Se muestra correctamente durante lazy loading |

### Errores de Consola

- Solo errores 500 de `/api/cms` — esperado sin backend. Frontend maneja gracefully con valores por defecto.
- Sin errores de JavaScript.
- Sin errores de hidratacion o warnings de React.

---

## E. Optimizaciones Investigadas y Descartadas

### Motion (vendor-motion, 127 KB)
- **Investigado:** Posibilidad de eliminar o diferir `motion/react` de la ruta critica.
- **Conclusion:** Motion se usa en 7 de 7 secciones visibles del homepage (HeroSection, FeaturedCategories, HowItWorks, EventsSection, Testimonials, Shipping, FAQ) ademas de `PageTransition` y `AnimatePresence` en AppRoutes.tsx. Eliminar motion del homepage requeriria reescribir todos estos componentes, lo cual viola la regla de no hacer reestructuracion completa por estetica. Ya esta en un chunk separado (vendor-motion) que se cachea independientemente.

### Separacion de CSS
- **Investigado:** CSS output de 240 KB (29 KB gz).
- **Conclusion:** Es Tailwind CSS 4 con solo utilidades usadas. 29 KB gzip es razonable para una app completa. La separacion critico/no-critico para Tailwind 4 requeriria una configuracion de extraccion compleja con beneficio marginal.

### Public Sans font
- **Investigado:** Se carga pero solo se usa en paginas internas (Product, Checkout, Orders).
- **Conclusion:** Ya es non-blocking gracias al Fix 8 (`media="print"`), asi que no afecta la carga inicial.

---

## F. Proximos Pasos Recomendados

1. **Optimizar imagenes del catalogo:** Las imagenes de categorias se cargan desde URLs externas. Considerar servir desde CDN propio con formatos WebP/AVIF y `srcset` responsivo.
2. **Reducir weights de fuentes:** Manrope se carga con 5 weights (300-800). La homepage solo necesita 400, 600, 700. Usar `&text=` subsetting o reducir weights.
3. **Considerar `@font-face` con `font-display: swap`:** En lugar de Google Fonts via stylesheet, self-host los archivos woff2 para eliminar la dependencia de DNS de terceros.
4. **Evaluar IntersectionObserver para secciones below-fold:** Las secciones HowItWorks, EventsSection, Testimonials, Shipping, FAQ podrian lazy-renderizar su contenido pesado.
5. **Analisis con backend activo:** Las metricas reales de LCP dependen del tiempo de respuesta de `/api/cms`. Un TTL mas largo en `apiCache` o un endpoint mas ligero mejoraria el FCP percibido.

---

## G. Resumen Ejecutivo

Se implementaron **9 optimizaciones controladas** sobre el frontend React de Floreria Bautista, enfocadas en reducir el JavaScript critico para la carga inicial de la homepage publica:

- **Bundle principal reducido 38%** (371 KB -> 231 KB) mediante lazy-loading de layouts de admin/empleado.
- **SignalR eliminado de la ruta publica** (55 KB ahorrados para visitantes no autenticados).
- **xlsx diferido a interaccion del usuario** (430 KB no se cargan hasta que se selecciona un archivo).
- **Imagen LCP pre-cargada** para iniciar descarga antes de que React ejecute.
- **Fuentes Google desbloquean el render** mediante carga asincrona.
- **PWA optimizado** con precache selectivo y runtime caching.

**Total JS inicial en homepage:** ~583 KB -> ~430 KB (**-26% raw, -20% gzipped**)

Todas las optimizaciones son:
- Basadas en hipotesis tecnicas verificables
- Reversibles (cada cambio es independiente)
- Sin impacto en funcionalidad, seguridad o contratos de API
- Verificadas via build exitosa y preview visual
