import { asegurarInstantaneaEnCache } from './catalogoPublico';

/**
 * Datos al abrir la app: en cuanto el service worker controla la página, se piden
 * los dos únicos datos públicos que necesitan las páginas estáticas para verse sin
 * conexión (ver matriz en vite.config.ts):
 *   - /api/cms                  textos, horarios y dirección (portada, Quiénes somos, Contacto, pie)
 *   - /api/products?size=1000   información del catálogo (instantánea)
 *
 * NO precarga chunks (el código de las páginas estáticas va en el precache del build) ni
 * imágenes de productos (solo se guardan al verse con conexión), ni pide ofertas,
 * descuentos o temporadas (páginas dinámicas: se guardan al visitarlas). Nunca checkout,
 * pago, login, notificaciones, configuración ni nada de admin/empleado.
 *
 * /api/cms se pide con fetch directo: en la primera visita la página ya lo tenía en memoria
 * de antes de que el SW tomara el control y no se volvería a pedir; solo lo que pasa por el SW
 * queda en caché. La instantánea pasa por catalogoPublico (asegurarInstantaneaEnCache): solo
 * se repite si la petición de la página fue previa al SW; si no, comparte la misma petición.
 * No depende de saveData (son ~10 KB).
 */

const URL_CMS = '/api/cms';

let listo: Promise<boolean> | null = null;
let hecho = false;

/** Espera a que el SW controle la página (una sola vez), a que cargue y a un hueco ocioso. */
function esperarCondiciones(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return Promise.resolve(false);

  const controlada = navigator.serviceWorker.controller
    ? Promise.resolve()
    : new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }),
      );
  const cargada = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }));

  return Promise.all([controlada, cargada]).then(
    () =>
      new Promise<boolean>((resolve) => {
        const listoParaPedir = () => resolve(navigator.onLine);
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(listoParaPedir, { timeout: 2000 });
        } else {
          setTimeout(listoParaPedir, 1000);
        }
      }),
  );
}

/** Una vez por carga de página. Los errores se ignoran: es solo preparar la caché. */
export function cargarDatosOffline() {
  if (!listo) listo = esperarCondiciones();
  listo.then(async (puede) => {
    if (!puede || hecho) return;
    hecho = true;
    // Caché antigua de versiones anteriores (reemplazada por api-catalogo y api-detalle).
    try { await caches.delete('api-publica'); } catch { /* silencioso */ }
    try { await fetch(URL_CMS, { priority: 'low' } as RequestInit); } catch { /* silencioso */ }
    try { await asegurarInstantaneaEnCache(); } catch { /* silencioso */ }
  });
}
