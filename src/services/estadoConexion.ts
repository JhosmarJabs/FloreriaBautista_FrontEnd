/**
 * Estado global de la conexión: un solo store para toda la web (aviso de la
 * tienda, panel de admin y pastilla del empleado).
 *
 * - red: lo que dice el navegador (navigator.onLine + eventos online/offline).
 * - servidor: 'inaccesible' cuando una petición a /api falla por red, responde
 *   502/503/504 o llega servida desde la caché del service worker (cabecera
 *   X-Desde-Cache, ver vite.config.ts) estando en línea. Vuelve a 'ok' con la
 *   siguiente respuesta de red real.
 * - datosGuardadosDesde: cabecera Date de la última respuesta servida desde caché.
 * - restablecida: true durante 4 s al volver de "sin conexión" a todo en orden.
 */

export interface EstadoConexion {
  red: 'en-linea' | 'sin-red';
  servidor: 'ok' | 'inaccesible';
  datosGuardadosDesde: number | null;
  restablecida: boolean;
  sinConexion: boolean;
}

type CabecerasLegibles = { get(nombre: string): string | null };
interface RespuestaObservada {
  status: number;
  headers: CabecerasLegibles | Record<string, unknown> | undefined;
}

const MS_RESTABLECIDA = 4000;

let estado: EstadoConexion = construir(
  typeof navigator !== 'undefined' && navigator.onLine === false ? 'sin-red' : 'en-linea',
  'ok',
  null,
  false,
);
const suscriptores = new Set<() => void>();
let temporizadorRestablecida: ReturnType<typeof setTimeout> | null = null;

function construir(
  red: EstadoConexion['red'],
  servidor: EstadoConexion['servidor'],
  datosGuardadosDesde: number | null,
  restablecida: boolean,
): EstadoConexion {
  return { red, servidor, datosGuardadosDesde, restablecida, sinConexion: red === 'sin-red' || servidor === 'inaccesible' };
}

function actualizar(cambios: Partial<Omit<EstadoConexion, 'sinConexion'>>) {
  const red = cambios.red ?? estado.red;
  const servidor = cambios.servidor ?? estado.servidor;
  const datos = 'datosGuardadosDesde' in cambios ? cambios.datosGuardadosDesde ?? null : estado.datosGuardadosDesde;
  let restablecida = cambios.restablecida ?? estado.restablecida;

  const estabaSinConexion = estado.sinConexion;
  const siguiente = construir(red, servidor, datos, restablecida);

  if (estabaSinConexion && !siguiente.sinConexion) {
    restablecida = true;
    if (temporizadorRestablecida) clearTimeout(temporizadorRestablecida);
    temporizadorRestablecida = setTimeout(() => {
      temporizadorRestablecida = null;
      actualizar({ restablecida: false });
    }, MS_RESTABLECIDA);
  } else if (siguiente.sinConexion && restablecida) {
    restablecida = false;
    if (temporizadorRestablecida) clearTimeout(temporizadorRestablecida);
    temporizadorRestablecida = null;
  }

  const final = construir(red, servidor, datos, restablecida);
  if (
    final.red === estado.red &&
    final.servidor === estado.servidor &&
    final.datosGuardadosDesde === estado.datosGuardadosDesde &&
    final.restablecida === estado.restablecida
  ) return;
  estado = final;
  suscriptores.forEach((fn) => fn());
}

export function obtenerEstado(): EstadoConexion {
  return estado;
}

export function suscribir(fn: () => void): () => void {
  suscriptores.add(fn);
  return () => { suscriptores.delete(fn); };
}

function leerCabecera(headers: RespuestaObservada['headers'], nombre: string): string | null {
  if (!headers) return null;
  if (typeof (headers as CabecerasLegibles).get === 'function') {
    try { return (headers as CabecerasLegibles).get(nombre); } catch { return null; }
  }
  const valor = (headers as Record<string, unknown>)[nombre.toLowerCase()];
  return typeof valor === 'string' ? valor : null;
}

/** Una respuesta de /api llegó (de la red o de la caché del service worker). */
export function reportarRespuesta(res: RespuestaObservada) {
  if (leerCabecera(res.headers, 'x-desde-cache') === '1') {
    const fecha = Date.parse(leerCabecera(res.headers, 'date') ?? '');
    actualizar({
      // Sin red el aviso ya lo explica la red; en línea, el servidor no respondió a tiempo.
      servidor: navigator.onLine ? 'inaccesible' : estado.servidor,
      datosGuardadosDesde: Number.isFinite(fecha) ? fecha : null,
    });
    return;
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    actualizar({ servidor: 'inaccesible' });
    return;
  }
  actualizar({ red: 'en-linea', servidor: 'ok', datosGuardadosDesde: null });
}

/** Una petición a /api no obtuvo respuesta (sin red, servidor caído, CORS...). */
export function reportarFalloRed() {
  actualizar(navigator.onLine ? { servidor: 'inaccesible' } : { red: 'sin-red' });
}

function esApiPropia(entrada: RequestInfo | URL): boolean {
  try {
    const texto = typeof entrada === 'string' ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
    const url = new URL(texto, window.location.href);
    return url.origin === window.location.origin && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

let instalado = false;

/**
 * Observa (sin alterarlas) las peticiones fetch a la API propia y los eventos de
 * red del navegador. Se llama una vez desde main.tsx; axios informa por su cuenta
 * desde el interceptor de services/api.ts.
 */
export function instalarObservadorConexion() {
  if (instalado || typeof window === 'undefined') return;
  instalado = true;

  window.addEventListener('online', () => actualizar({ red: 'en-linea' }));
  window.addEventListener('offline', () => actualizar({ red: 'sin-red' }));

  const fetchOriginal = window.fetch.bind(window);
  window.fetch = (entrada: RequestInfo | URL, init?: RequestInit) => {
    const promesa = fetchOriginal(entrada, init);
    if (esApiPropia(entrada)) {
      promesa.then(
        (res) => reportarRespuesta(res),
        (err) => {
          if ((err as { name?: string })?.name !== 'AbortError') reportarFalloRed();
        },
      );
    }
    return promesa;
  };
}
