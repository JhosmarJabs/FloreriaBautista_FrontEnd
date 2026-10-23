import { isJwtExpired, limpiarSesion } from '../utils/auth';
import { fetchConSesion, renovarOCerrarSesion } from './renovacionSesion';

const API_BASE = '/api/notifications';

export interface NotificationDto {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  entidadTipo: string | null;
  entidadId: string | null;
  leida: boolean;
  leidaEn: string | null;
  creadaEn: string;
}

export interface PagedNotifications {
  items: NotificationDto[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

const getToken = async (): Promise<string> => {
  const stored = localStorage.getItem('accessToken');
  if (stored && !isJwtExpired(stored)) return stored;
  // Sin red no se cierra la sesión: no hay forma de verificarla.
  if (stored && !navigator.onLine) throw new Error('Sin conexión a Internet.');
  // Vencido o ilegible: renovar como el interceptor de axios; solo si no se puede, al login.
  if (stored) return renovarOCerrarSesion(stored);
  limpiarSesion();
  if (window.location.pathname !== '/login') window.location.href = '/login';
  throw new Error('Sin sesión activa');
};

const authHeaders = async () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${await getToken()}`,
});

const errorMessage = async (res: Response, fallback: string): Promise<string> => {
  try {
    const body = await res.json();
    if (typeof body?.message === 'string' && body.message) return body.message;
  } catch { /* sin JSON */ }
  return `${fallback} (error ${res.status})`;
};

export const NotificationsService = {
  listar: async (soloNoLeidas = false, page = 1, size = 20): Promise<PagedNotifications> => {
    const params = new URLSearchParams({
      soloNoLeidas: String(soloNoLeidas),
      page: String(page),
      size: String(size),
    });
    const res = await fetchConSesion(`${API_BASE}?${params}`, { headers: await authHeaders() });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al cargar notificaciones'));
    const json: ApiResponse<PagedNotifications> = await res.json();
    return json.data;
  },

  contarNoLeidas: async (): Promise<number> => {
    const res = await fetchConSesion(`${API_BASE}/no-leidas/count`, { headers: await authHeaders() });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al contar notificaciones'));
    const json: ApiResponse<{ count: number }> = await res.json();
    return json.data.count;
  },

  marcarLeida: async (id: string): Promise<void> => {
    const res = await fetchConSesion(`${API_BASE}/${id}/leer`, {
      method: 'PATCH',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al marcar como leída'));
  },

  marcarTodasLeidas: async (): Promise<void> => {
    const res = await fetchConSesion(`${API_BASE}/leer-todas`, {
      method: 'PATCH',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al marcar todas como leídas'));
  },

  eliminar: async (id: string): Promise<void> => {
    const res = await fetchConSesion(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al eliminar notificación'));
  },
};
