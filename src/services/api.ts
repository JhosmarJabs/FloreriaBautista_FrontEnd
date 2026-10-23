import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { reportarFalloRed, reportarRespuesta } from './estadoConexion';
import { cerrarSesionYRedirigir, ErrorPaginaDescargando, esRechazoDeSesion, renovarSesion } from './renovacionSesion';

const api = axios.create({
  baseURL: '/',
});

// ── Interceptor de petición ──────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  try {
    const stored = localStorage.getItem('accessToken');
    if (stored && !stored.startsWith('local-token-')) {
      config.headers.Authorization = `Bearer ${stored}`;
    } else {
      const tokenRes = await fetch('/api/dev/token');
      if (tokenRes.ok) {
        const token = await tokenRes.text();
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
    }
  } catch {
    // Continuar sin token si falla
  }
  return config;
});

// ── Interceptor de respuesta (401 → refresh silencioso) ──────────────────
// La renovación vive en renovacionSesion.ts: la comparten los servicios con fetch
// propio para que toda la app haga un solo refresh a la vez.

interface ConfigConReintento extends InternalAxiosRequestConfig {
  _reintentada?: boolean;
}

api.interceptors.response.use(
  (response) => {
    reportarRespuesta(response);
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as ConfigConReintento | undefined;

    // Aviso de conexión: sin respuesta (y no cancelada) = no hay conexión con la tienda.
    if (error.response) reportarRespuesta(error.response);
    else if (!axios.isCancel(error)) reportarFalloRed();

    if (!error.response) return Promise.reject(error);

    if (error.response.status !== 401 || !config) {
      return Promise.reject(error);
    }

    if (config._reintentada) return Promise.reject(error);

    if (config.url?.includes('/api/auth/token/refresh')) {
      cerrarSesionYRedirigir();
      return Promise.reject(error);
    }

    config._reintentada = true;

    const tokenRechazado = config.headers.Authorization?.toString().replace('Bearer ', '') ?? '';
    try {
      const nuevoToken = await renovarSesion(tokenRechazado);
      config.headers.Authorization = `Bearer ${nuevoToken}`;
      return api(config);
    } catch (errRenovacion) {
      if (!esRechazoDeSesion(errRenovacion)) {
        // Fallo transitorio de la renovación: se conserva la sesión y se rechaza
        // con el error de la renovación para que no se trate como un 401.
        if (axios.isAxiosError(errRenovacion) && errRenovacion.response) reportarRespuesta(errRenovacion.response);
        else if (!axios.isCancel(errRenovacion) && !(errRenovacion instanceof ErrorPaginaDescargando)) reportarFalloRed();
        return Promise.reject(errRenovacion);
      }
      cerrarSesionYRedirigir();
      return Promise.reject(error);
    }
  },
);

export default api;