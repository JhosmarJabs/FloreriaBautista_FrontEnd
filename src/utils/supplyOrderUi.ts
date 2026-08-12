import type { SupplyOrderEstado, SupplyOrderLineaEstado } from '../services/adminService';

/** Color y etiqueta de cada estado de la solicitud, iguales en historial y detalle. */
export const ESTADO_SOLICITUD: Record<SupplyOrderEstado, { label: string; badge: string; dot: string }> = {
  BORRADOR: {
    label: 'Borrador',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  ENVIADA: {
    label: 'Enviada',
    badge: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  RECIBIDA_PARCIAL: {
    label: 'Recibida parcial',
    badge: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  RECIBIDA: {
    label: 'Recibida',
    badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  CANCELADA: {
    label: 'Cancelada',
    badge: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

export const ESTADO_LINEA: Record<SupplyOrderLineaEstado, { label: string; badge: string }> = {
  PENDIENTE: { label: 'Sin decidir', badge: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
  COMPLETO:  { label: 'Completo',    badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  PARCIAL:   { label: 'Parcial',     badge: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  NO_LLEGO:  { label: 'No llegó',    badge: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
  EXCEDENTE: { label: 'Excedente',   badge: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
};

/** Misma regla que calcula el backend, para reflejarla en vivo mientras se captura. */
export function estadoLineaDe(solicitada: number, recibida: number | null | undefined): SupplyOrderLineaEstado {
  if (recibida === null || recibida === undefined) return 'PENDIENTE';
  if (recibida === 0) return 'NO_LLEGO';
  if (recibida < solicitada) return 'PARCIAL';
  if (recibida === solicitada) return 'COMPLETO';
  return 'EXCEDENTE';
}

export const formatoMoneda = (valor: number) =>
  valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
