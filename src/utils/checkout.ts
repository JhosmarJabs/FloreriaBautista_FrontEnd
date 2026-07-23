// Estado compartido del flujo de checkout, persistido en localStorage para que
// las pantallas (Datos → Revisión → Éxito) muestren exactamente lo mismo.
//
//   checkout_draft  → borrador en construcción (Datos y Revisión lo leen)
//   last_order      → pedido confirmado (solo la pantalla de Éxito lo lee)
//
// La dedicatoria se conserva dentro del borrador; ya no se usa una clave suelta.

import type { CartItem } from '../hooks/useCart';
import type { ZonaEnvio } from './envio';

export interface CheckoutAddress {
  label: string;
  fullAddress: string;
  cp: string;
  // Campos estructurados (necesarios para crear la orden en el backend).
  calle: string;
  colonia: string;
  municipio: string;
  estado: string;
  referencias?: string;
}

export interface CheckoutDraft {
  address: CheckoutAddress;
  orderType: 'instantaneo' | 'anticipado';
  deliveryDate: string;   // YYYY-MM-DD
  timeSlot: string;       // rango horario (vacío para instantáneo)
  dedicatoria: string;    // vacío si el cliente no la activó
  shippingCost: number;
  shippingZona: ZonaEnvio;
}

export interface CompletedOrder extends CheckoutDraft {
  orderNumber: string;
  backendOrderId?: string; // id real del pedido en el backend (para confirmar el pago)
  createdAt: string;      // ISO
  items: CartItem[];
  subtotal: number;
  total: number;
  pagado?: boolean;        // true una vez confirmado el pago en Mercado Pago
}

const DRAFT_KEY = 'checkout_draft';
const ORDER_KEY = 'last_order';

export const saveDraft = (draft: CheckoutDraft) => {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
};

export const getDraft = (): CheckoutDraft | null => {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return null;
  }
};

export const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

export const saveCompletedOrder = (order: CompletedOrder) => {
  localStorage.setItem(ORDER_KEY, JSON.stringify(order));
};

export const getCompletedOrder = (): CompletedOrder | null => {
  const raw = localStorage.getItem(ORDER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CompletedOrder;
  } catch {
    return null;
  }
};

/** Genera un folio legible tipo FB-YYYYMMDD-XXX. */
export const generarFolio = (): string => {
  const now = new Date();
  const fecha = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `FB-${fecha}-${rand}`;
};
