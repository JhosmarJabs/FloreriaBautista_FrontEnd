import axios from 'axios';
import api from './api';

// Módulo de WhatsApp (solo ADMIN). Habla únicamente con /api/admin/whatsapp/*: la URL y la
// API key de Evolution nunca llegan al navegador. Estas respuestas NO pasan por apiCache
// (el QR no debe guardarse en ningún lado).

const BASE = '/api/admin/whatsapp';

export type EstadoWhatsApp =
  | 'NO_CONFIGURADO'
  | 'CONECTADO'
  | 'CONECTANDO'
  | 'DESCONECTADO'
  | 'SERVICIO_NO_DISPONIBLE';

export interface WhatsAppEstado {
  configurado: boolean;
  habilitado: boolean;
  estado: EstadoWhatsApp;
  numeroVinculado: string | null;
  ultimaVerificacionEn: string | null;
  desconectadoDesde: string | null;
}

export interface WhatsAppVincular {
  qrBase64: string | null;
  pairingCode: string | null;
  expiraEnSegundos: number;
}

export interface WhatsAppConfiguracion {
  habilitado: boolean;
  notificarPedidoNuevo: boolean;
  notificarCambioEstado: boolean;
  estadosNotificados: string[];
  notificarStockBajo: boolean;
  notificarVentaInstantanea: boolean;
  notificarReabastecimiento: boolean;
}

export interface WhatsAppDestinatario {
  id: string;
  nombre: string;
  telefonoEnmascarado: string;
  telefono: string | null;
  activo: boolean;
  verificado: boolean | null;
}

export interface WhatsAppDestinatarioRequest {
  nombre: string;
  telefono: string;
  activo?: boolean;
}

export interface WhatsAppMensaje {
  creadoEn: string;
  enviadoEn: string | null;
  tipoEvento: string;
  destinatario: string;
  estado: 'PENDIENTE' | 'ENVIADO' | 'FALLIDO' | 'EXPIRADO';
  intentos: number;
  ultimoError: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Resultado con el mensaje del backend (para los toasts). */
export interface ConMensaje<T> {
  data: T;
  message: string;
}

/** Mensaje legible de un error de la API (`ApiResponseDto.message`). */
export function errorWhatsApp(err: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as Partial<ApiResponse<unknown>> | undefined)?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
    if (err.response?.status === 403) return 'No tienes permiso para esta acción.';
    if (!err.response) return 'No se pudo conectar con el servidor.';
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

async function get<T>(url: string): Promise<T> {
  const resp = await api.get<ApiResponse<T>>(url);
  return resp.data.data;
}

async function send<T>(method: 'post' | 'put', url: string, body?: unknown): Promise<ConMensaje<T>> {
  const resp = await api.request<ApiResponse<T>>({ method, url, data: body ?? {} });
  return { data: resp.data.data, message: resp.data.message };
}

export const WhatsAppService = {
  estado: () => get<WhatsAppEstado>(`${BASE}/estado`),
  vincular: () => send<WhatsAppVincular>('post', `${BASE}/vincular`),
  desvincular: () => send<{ estado: EstadoWhatsApp }>('post', `${BASE}/desvincular`),
  prueba: (recipientId?: string) =>
    send<{ encolados: number }>('post', `${BASE}/prueba`, { recipientId: recipientId ?? null }),

  configuracion: () => get<WhatsAppConfiguracion>(`${BASE}/configuracion`),
  guardarConfiguracion: (cfg: WhatsAppConfiguracion) =>
    send<WhatsAppConfiguracion>('put', `${BASE}/configuracion`, cfg),

  destinatarios: () => get<WhatsAppDestinatario[]>(`${BASE}/destinatarios`),
  destinatario: (id: string) => get<WhatsAppDestinatario>(`${BASE}/destinatarios/${id}`),
  crearDestinatario: (dto: WhatsAppDestinatarioRequest) =>
    send<WhatsAppDestinatario>('post', `${BASE}/destinatarios`, dto),
  actualizarDestinatario: (id: string, dto: WhatsAppDestinatarioRequest) =>
    send<WhatsAppDestinatario>('put', `${BASE}/destinatarios/${id}`, dto),

  versionSugerida: () => get<{ version: string | null; fuente: string }>(`${BASE}/version-sugerida`),
  reiniciar: () => send<{ estado: EstadoWhatsApp }>('post', `${BASE}/reiniciar`),

  mensajes: (limite = 50) => get<WhatsAppMensaje[]>(`${BASE}/mensajes?limite=${limite}`),
};
