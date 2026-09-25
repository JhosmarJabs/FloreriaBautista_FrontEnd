import { isJwtExpired, limpiarSesion } from '../utils/auth';

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

const getToken = (): string => {
  const stored = localStorage.getItem('accessToken');
  if (stored && !isJwtExpired(stored)) return stored;
  limpiarSesion();
  if (window.location.pathname !== '/login') window.location.href = '/login';
  throw new Error('Sin sesión activa');
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${getToken()}`,
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
    const res = await fetch(`${API_BASE}?${params}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al cargar notificaciones'));
    const json: ApiResponse<PagedNotifications> = await res.json();
    return json.data;
  },

  contarNoLeidas: async (): Promise<number> => {
    const res = await fetch(`${API_BASE}/no-leidas/count`, { headers: authHeaders() });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al contar notificaciones'));
    const json: ApiResponse<{ count: number }> = await res.json();
    return json.data.count;
  },

  marcarLeida: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/${id}/leer`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al marcar como leída'));
  },

  marcarTodasLeidas: async (): Promise<void> => {
    const res = await fetch(`${API_BASE}/leer-todas`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al marcar todas como leídas'));
  },

  eliminar: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al eliminar notificación'));
  },
};
