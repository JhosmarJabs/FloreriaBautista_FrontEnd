import { isAxiosError } from 'axios';
import api from './api';

/**
 * Solicitudes de cotización de eventos sociales (bodas, bautizos, corporativos...).
 * Cliente: POST /api/solicitudes-evento · Admin: GET/PATCH /api/admin/solicitudes-evento.
 * Los tipos viven aquí a propósito (no en types.ts).
 */

export type TipoEvento = 'BODA' | 'BAUTIZO' | 'CORPORATIVO' | 'CONMEMORATIVO' | 'OTRO';
export type EstadoSolicitudEvento = 'PENDIENTE' | 'CONTACTADA' | 'CERRADA';

export const TIPOS_EVENTO: { value: TipoEvento; label: string }[] = [
  { value: 'BODA', label: 'Boda' },
  { value: 'BAUTIZO', label: 'Bautizo' },
  { value: 'CORPORATIVO', label: 'Evento corporativo' },
  { value: 'CONMEMORATIVO', label: 'Arreglo conmemorativo' },
  { value: 'OTRO', label: 'Otro' },
];

export const ESTADOS_SOLICITUD: { value: EstadoSolicitudEvento; label: string }[] = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'CONTACTADA', label: 'Contactada' },
  { value: 'CERRADA', label: 'Cerrada' },
];

export const etiquetaTipoEvento = (tipo: string): string =>
  TIPOS_EVENTO.find(t => t.value === tipo)?.label ?? tipo;

export interface CrearSolicitudEvento {
  tipoEvento: TipoEvento;
  /** YYYY-MM-DD */
  fechaEvento: string;
  invitadosAprox?: number | null;
  nombreContacto: string;
  telefonoContacto: string;
  correoContacto?: string | null;
  mensaje?: string | null;
}

export interface SolicitudEvento {
  id: string;
  customerId: string;
  clienteNombre: string;
  tipoEvento: TipoEvento;
  /** YYYY-MM-DD (DateOnly) */
  fechaEvento: string;
  invitadosAprox: number | null;
  nombreContacto: string;
  telefonoContacto: string;
  correoContacto: string | null;
  mensaje: string | null;
  estado: EstadoSolicitudEvento;
  creadoEn: string;
  actualizadoEn: string;
}

export interface SolicitudesEventoPagina {
  items: SolicitudEvento[];
  total: number;
  pagina: number;
  tamanoPagina: number;
  totalPaginas: number;
}

export const MSG_SIN_CONEXION = 'Sin conexión. Inténtalo cuando tengas Internet.';

/** Mensaje legible para el usuario a partir de un error de la API (o de red). */
export function mensajeDeErrorSolicitud(err: unknown, porDefecto: string): string {
  if (isAxiosError(err)) {
    if (!err.response) return MSG_SIN_CONEXION;
    const msg = (err.response.data as { message?: unknown } | undefined)?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (err.response.status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.';
    if (err.response.status === 403) return 'No tienes permiso para realizar esta acción.';
  }
  return porDefecto;
}

export const SolicitudesEventoService = {
  crear: async (dto: CrearSolicitudEvento): Promise<SolicitudEvento> => {
    const res = await api.post<{ data: SolicitudEvento }>('/api/solicitudes-evento', dto);
    return res.data.data;
  },

  listarAdmin: async (
    { estado, page = 1, size = 50 }: { estado?: EstadoSolicitudEvento | ''; page?: number; size?: number } = {},
  ): Promise<SolicitudesEventoPagina> => {
    const params: Record<string, string | number> = { page, size };
    if (estado) params.estado = estado;
    const res = await api.get<{ data: SolicitudesEventoPagina }>('/api/admin/solicitudes-evento', { params });
    return res.data.data;
  },

  cambiarEstado: async (id: string, estado: EstadoSolicitudEvento): Promise<SolicitudEvento> => {
    const res = await api.patch<{ data: SolicitudEvento }>(`/api/admin/solicitudes-evento/${id}/estado`, { estado });
    return res.data.data;
  },
};
