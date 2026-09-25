import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { limpiarSesion } from '../utils/auth';

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

let refrescando: Promise<string> | null = null;

interface ConfigConReintento extends InternalAxiosRequestConfig {
  _reintentada?: boolean;
}

async function renovarTokens(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('Sin refresh token');

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

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as ConfigConReintento | undefined;

    if (!error.response) return Promise.reject(error);

    if (error.response.status !== 401 || !config) {
      return Promise.reject(error);
    }

    if (config._reintentada) return Promise.reject(error);

    if (config.url?.includes('/api/auth/token/refresh')) {
      limpiarSesion();
      redirigirALogin();
      return Promise.reject(error);
    }

    config._reintentada = true;

    try {
      if (!refrescando) {
        refrescando = renovarTokens().finally(() => { refrescando = null; });
      }
      const nuevoToken = await refrescando;
      config.headers.Authorization = `Bearer ${nuevoToken}`;
      return api(config);
    } catch {
      // Antes de rendirse, releer localStorage: otra pestaña pudo haber renovado.
      const ultimoToken = localStorage.getItem('accessToken');
      if (ultimoToken && ultimoToken !== config.headers.Authorization?.toString().replace('Bearer ', '')) {
        config.headers.Authorization = `Bearer ${ultimoToken}`;
        return api(config);
      }

      limpiarSesion();
      redirigirALogin();
      return Promise.reject(error);
    }
  },
);

function redirigirALogin() {
  const ruta = window.location.pathname + window.location.search;
  const destino = ruta && ruta !== '/login' && ruta !== '/'
    ? `/login?redirect=${encodeURIComponent(ruta)}`
    : '/login';
  window.location.href = destino;
}

export default api;