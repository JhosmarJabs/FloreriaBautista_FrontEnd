/**
 * Diccionario único de estados de pedido.
 *
 * Antes de este archivo, el mismo estado se escribía a mano en siete pantallas
 * distintas y terminó con tres redacciones y tres colores: `EN_RUTA` se veía
 * como "En camino" en el detalle del admin, "En Ruta" en el dashboard y el panel
 * del empleado, y "En ruta" en la cuenta del cliente. Aquí vive la versión
 * canónica y todas las pantallas la importan.
 *
 * Las claves son los valores reales del enum del backend (ver Transiciones en
 * Backend/Services/OrderService.cs) y NO se tocan: lo único que cambia es el
 * texto y el color con que se pintan.
 */

export type EstadoPedido =
  | 'PENDIENTE_VALIDACION'
  | 'EN_PREPARACION'
  | 'EN_RUTA'
  | 'ENTREGADO'
  | 'CANCELADO'
  | 'PENDIENTE_ANULACION'
  | 'NO_COMPLETADO';

export interface EstadoPedidoUi {
  /** Etiqueta canónica. Es la única que debe verse en pantalla. */
  label: string;
  /** Color de texto, claro y oscuro. */
  text: string;
  /** Color sólido: puntos, barras del stepper y marcadores. */
  dot: string;
  /** Fondo tenue, para badges sobre superficie blanca. */
  bg: string;
  /** Borde que acompaña a `bg`. */
  border: string;
  /** Fondo más marcado, para listas densas del panel del empleado. */
  bgFuerte: string;
  /** Borde que acompaña a `bgFuerte`. */
  borderFuerte: string;
  /** Barra lateral de fila (tabla) o superior (tarjeta). */
  bar: string;
  /**
   * Fondo casi imperceptible sobre la fila completa. Reservado a los estados
   * que exigen que alguien actúe; en los demás va vacío a propósito.
   */
  tint: string;
  /** Badge de una sola clase para la tienda del cliente, que es solo en claro. */
  badge: string;
}

/**
 * Paleta canónica. Se eligió la familia mayoritaria de cada estado para que el
 * color signifique siempre lo mismo:
 * ámbar (falta confirmarlo) → índigo (se está armando) → azul (va en camino) →
 * esmeralda (llegó), y rosa / naranja / pizarra para los desenlaces.
 */
export const ESTADO_PEDIDO: Record<EstadoPedido, EstadoPedidoUi> = {
  PENDIENTE_VALIDACION: {
    label: 'Por confirmar',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-100 dark:border-amber-500/20',
    bgFuerte: 'bg-amber-100 dark:bg-amber-900/30',
    borderFuerte: 'border-amber-200 dark:border-amber-800',
    bar: 'border-l-amber-400',
    tint: 'bg-amber-50/30 dark:bg-amber-500/5',
    badge: 'bg-amber-100 text-amber-700',
  },
  EN_PREPARACION: {
    label: 'En preparación',
    text: 'text-indigo-700 dark:text-indigo-400',
    dot: 'bg-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
    border: 'border-indigo-100 dark:border-indigo-500/20',
    bgFuerte: 'bg-indigo-100 dark:bg-indigo-900/30',
    borderFuerte: 'border-indigo-200 dark:border-indigo-800',
    bar: 'border-l-indigo-400',
    tint: '',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  EN_RUTA: {
    label: 'En camino',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-100 dark:border-blue-500/20',
    bgFuerte: 'bg-blue-100 dark:bg-blue-900/30',
    borderFuerte: 'border-blue-200 dark:border-blue-800',
    bar: 'border-l-blue-400',
    tint: '',
    badge: 'bg-blue-100 text-blue-700',
  },
  ENTREGADO: {
    label: 'Entregado',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-100 dark:border-emerald-500/20',
    bgFuerte: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderFuerte: 'border-emerald-200 dark:border-emerald-800',
    bar: 'border-l-emerald-500',
    tint: '',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  CANCELADO: {
    label: 'Cancelado',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    border: 'border-rose-100 dark:border-rose-500/20',
    bgFuerte: 'bg-rose-100 dark:bg-rose-900/30',
    borderFuerte: 'border-rose-200 dark:border-rose-800',
    bar: 'border-l-rose-400',
    tint: '',
    badge: 'bg-rose-100 text-rose-700',
  },
  PENDIENTE_ANULACION: {
    label: 'Cancelación solicitada',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    border: 'border-orange-100 dark:border-orange-500/20',
    bgFuerte: 'bg-orange-100 dark:bg-orange-900/30',
    borderFuerte: 'border-orange-200 dark:border-orange-800',
    bar: 'border-l-orange-400',
    tint: 'bg-orange-50/30 dark:bg-orange-500/5',
    badge: 'bg-orange-100 text-orange-700',
  },
  NO_COMPLETADO: {
    label: 'No se pudo entregar',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-700/30',
    border: 'border-slate-200 dark:border-slate-600/40',
    bgFuerte: 'bg-slate-100 dark:bg-slate-800',
    borderFuerte: 'border-slate-200 dark:border-slate-700',
    bar: 'border-l-slate-300 dark:border-l-slate-600',
    tint: '',
    badge: 'bg-slate-200 text-slate-600',
  },
};

/** Orden en que avanza un pedido. Sirve para llenar selectores y steppers. */
export const ESTADOS_PEDIDO: EstadoPedido[] = [
  'PENDIENTE_VALIDACION',
  'EN_PREPARACION',
  'EN_RUTA',
  'ENTREGADO',
  'CANCELADO',
  'PENDIENTE_ANULACION',
  'NO_COMPLETADO',
];

/**
 * Valores viejos en minúsculas o en inglés que algunos flujos antiguos todavía
 * devuelven. Se traducen al estado canónico para que no se cuelen etiquetas
 * sueltas como "Enviado" o "Procesando" que ya no existen en el resto del panel.
 */
const ALIAS_ESTADO: Record<string, EstadoPedido> = {
  pending: 'PENDIENTE_VALIDACION',
  pendiente: 'PENDIENTE_VALIDACION',
  procesando: 'EN_PREPARACION',
  shipped: 'EN_RUTA',
  enviado: 'EN_RUTA',
  delivered: 'ENTREGADO',
  entregado: 'ENTREGADO',
  paid: 'ENTREGADO',
  cancelled: 'CANCELADO',
  cancelado: 'CANCELADO',
  failed: 'CANCELADO',
};

/** Cómo se pinta un estado desconocido: gris y con su valor crudo a la vista. */
const ESTADO_DESCONOCIDO: EstadoPedidoUi = {
  ...ESTADO_PEDIDO.NO_COMPLETADO,
  label: 'Sin estado',
};

/**
 * Punto de entrada único: acepta la clave del backend, un alias viejo o
 * cualquier cosa, y siempre devuelve algo pintable.
 */
export function estadoPedido(raw?: string | null): EstadoPedidoUi {
  if (!raw) return ESTADO_DESCONOCIDO;
  const directo = ESTADO_PEDIDO[raw as EstadoPedido];
  if (directo) return directo;
  const alias = ALIAS_ESTADO[raw.toLowerCase()];
  if (alias) return ESTADO_PEDIDO[alias];
  return { ...ESTADO_DESCONOCIDO, label: raw };
}

/** Atajo para cuando solo hace falta el texto. */
export function estadoPedidoLabel(raw?: string | null): string {
  return estadoPedido(raw).label;
}
