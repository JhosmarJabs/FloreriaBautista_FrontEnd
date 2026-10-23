import axios from 'axios';
import { limpiarSesion } from '../utils/auth';
import { reportarFalloRed, reportarRespuesta } from './estadoConexion';

// Renovación silenciosa de la sesión, compartida por axios (api.ts) y por los
// servicios que usan fetch propio (adminService, notificationsService).
//
// Tiene que ser UNA sola para toda la app: el backend rota el refresh token en
// cada uso, así que dos renovaciones simultáneas con el mismo token harían que
// la segunda recibiera 401 y cerrara la sesión.

let refrescando: Promise<string> | null = null;

// ── Descarga de la página (mitigación parcial de BUG-003) ────────────────
// Si el documento se está descargando (recarga, cierre, navegación completa) no
// se inician renovaciones nuevas: el servidor rotaría el refresh token y el
// documento moriría antes de guardar el nuevo, dejando al documento siguiente
// con un refresh ya usado. Tampoco se limpia la sesión ni se redirige, porque
// el localStorage lo comparte el documento nuevo. NO resuelve la carrera cuando
// el POST de renovación ya salió antes de la descarga (limitación conocida).
//
// El temporizador de seguridad es de 10 s: el documento nuevo tardó ~2,1 s en
// entrar en Vite dev, así que 10 s cubre la navegación con margen. Solo importa
// cuando `beforeunload` no terminó en descarga (enlace de archivo, mailto:,
// navegación cancelada): entonces, como mucho durante 10 s, las renovaciones
// fallan como error de conexión, sin cerrar la sesión.
const MS_SEGURIDAD_DESCARGA = 10_000;
let descargando = false;
let temporizadorDescarga: ReturnType<typeof setTimeout> | undefined;

function marcarDescarga() {
  descargando = true;
  clearTimeout(temporizadorDescarga);
  temporizadorDescarga = setTimeout(() => { descargando = false; }, MS_SEGURIDAD_DESCARGA);
}

function desmarcarDescarga() {
  descargando = false;
  clearTimeout(temporizadorDescarga);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', marcarDescarga);
  window.addEventListener('pagehide', marcarDescarga);
  window.addEventListener('pageshow', desmarcarDescarga);
}

/** ¿La página se está descargando? (también lo consulta el Tester desde la consola). */
export function estaDescargando(): boolean {
  return descargando;
}

/** Error propio: no es un rechazo de la sesión; ver `esRechazoDeSesion`. */
export class ErrorPaginaDescargando extends Error {
  constructor() {
    super('Página descargándose');
    this.name = 'ErrorPaginaDescargando';
  }
}

/**
 * Limpia la sesión y manda al login, salvo que la página se esté descargando.
 * Devuelve false (sin tocar nada) en ese caso: el documento nuevo decidirá.
 */
export function cerrarSesionYRedirigir(): boolean {
  if (descargando) return false;
  limpiarSesion();
  redirigirALogin();
  return true;
}

async function renovarTokens(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('Sin refresh token');

  // axios sin instancia: no pasa por el interceptor de api.ts (evita el bucle).
  const resp = await axios.post('/api/auth/token/refresh', { refreshToken });
  const data = resp.data?.data ?? resp.data;

  const nuevoAccess = data.accessToken;
  const nuevoRefresh = data.refreshToken;

  if (!nuevoAccess) throw new Error('Respuesta sin access token');

  localStorage.setItem('accessToken', nuevoAccess);
  if (nuevoRefresh) localStorage.setItem('refreshToken', nuevoRefresh);
  if (data.usuario) {
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
  }

  return nuevoAccess;
}

/**
 * Devuelve un access token nuevo en lugar de `tokenRechazado`.
 *
 * Si otra petición (o pestaña) ya lo renovó, devuelve el guardado sin pedir otro.
 * Si hay una renovación en curso, espera esa misma. No limpia la sesión ni
 * redirige: eso lo decide quien llama.
 */
export async function renovarSesion(tokenRechazado: string): Promise<string> {
  const actual = localStorage.getItem('accessToken');
  if (!refrescando && actual && actual !== tokenRechazado && !actual.startsWith('local-token-')) {
    return actual;
  }
  if (!refrescando && descargando) throw new ErrorPaginaDescargando();
  if (!refrescando) {
    refrescando = renovarTokens().finally(() => { refrescando = null; });
  }
  try {
    return await refrescando;
  } catch (err) {
    // Antes de rendirse, releer localStorage: otra pestaña pudo haber renovado.
    const ultimo = localStorage.getItem('accessToken');
    if (ultimo && ultimo !== tokenRechazado && !ultimo.startsWith('local-token-')) return ultimo;
    throw err;
  }
}

/**
 * ¿El fallo de la renovación significa que la sesión ya no sirve?
 *
 * NO es rechazo (se conserva la sesión): no hubo respuesta HTTP (sin red,
 * cancelación, timeout) o el servidor respondió 408, 429 o >= 500. Misma regla
 * que mobile-admin/src/services/api.ts.
 * SÍ es rechazo: cualquier otro 4xx y los errores propios sin HTTP
 * ('Sin refresh token', 'Respuesta sin access token').
 */
export function esRechazoDeSesion(err: unknown): boolean {
  if (err instanceof ErrorPaginaDescargando) return false;
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === undefined) return false;
    return !(status === 408 || status === 429 || status >= 500);
  }
  return true;
}

export function redirigirALogin() {
  if (window.location.pathname === '/login') return;
  const ruta = window.location.pathname + window.location.search;
  const destino = ruta && ruta !== '/'
    ? `/login?redirect=${encodeURIComponent(ruta)}`
    : '/login';
  window.location.href = destino;
}

/**
 * Renueva la sesión o, si ya no se puede (sin refresh token o refresh rechazado),
 * la cierra y manda al login. Un fallo transitorio (sin respuesta, 408, 429, 5xx)
 * conserva la sesión y lanza un error de conexión. Para los servicios con fetch propio.
 */
export async function renovarOCerrarSesion(tokenRechazado: string): Promise<string> {
  try {
    return await renovarSesion(tokenRechazado);
  } catch (err) {
    if (!esRechazoDeSesion(err)) {
      // Fallo transitorio de red o servidor: la sesión y la URL se conservan.
      if (axios.isAxiosError(err) && err.response) reportarRespuesta(err.response);
      else if (!axios.isCancel(err) && !(err instanceof ErrorPaginaDescargando)) reportarFalloRed();
      throw new Error('Sin conexión con la tienda.');
    }
    // Con la página descargándose no se limpia ni se redirige, ni ante un 401 real.
    if (!cerrarSesionYRedirigir()) throw new Error('Sin conexión con la tienda.');
    throw new Error('Sesión expirada. Redirigiendo al inicio de sesión…');
  }
}

const tokenEnviado = (headers: HeadersInit | undefined): string | null => {
  const valor = new Headers(headers).get('Authorization');
  return valor?.startsWith('Bearer ') ? valor.slice(7) : null;
};

/**
 * `fetch` con el mismo trato del interceptor de axios: ante un 401 de una
 * petición con la sesión del usuario, renueva una sola vez y la repite una vez.
 * Si el reintento vuelve a dar 401 se devuelve esa respuesta (sin bucle).
 * Cualquier otro estado o fallo de red se devuelve tal cual.
 */
export async function fetchConSesion(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status !== 401) return res;

  const enviado = tokenEnviado(init.headers);
  // Sin refresh token no hay sesión que renovar (token de desarrollo o sin sesión).
  if (!enviado || enviado.startsWith('local-token-') || !localStorage.getItem('refreshToken')) return res;

  const nuevo = await renovarOCerrarSesion(enviado);
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${nuevo}`);
  return fetch(input, { ...init, headers });
}
