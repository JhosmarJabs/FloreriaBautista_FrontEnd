// Estado compartido del flujo de checkout, persistido en localStorage para que
// las pantallas (Datos → Revisión → Éxito) muestren exactamente lo mismo.
//
//   checkout_draft  → borrador en construcción (Datos y Revisión lo leen)
//   last_order      → pedido confirmado (solo la pantalla de Éxito lo lee)
//
// La dedicatoria se conserva dentro del borrador; ya no se usa una clave suelta.

import type { CartItem } from '../hooks/useCart';
import type { ZonaEnvio } from './envio';
import { scopedKey } from './userScope';

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
  solicitudVentaInstantaneaId?: string;
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

// Claves aisladas por usuario para no filtrar el borrador ni el recibo entre cuentas.
const draftKey = () => scopedKey('checkout_draft');
const orderKey = () => scopedKey('last_order');

export const saveDraft = (draft: CheckoutDraft) => {
  localStorage.setItem(draftKey(), JSON.stringify(draft));
};

export const getDraft = (): CheckoutDraft | null => {
  const raw = localStorage.getItem(draftKey());
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return null;
  }
};

// Dedicatoria en curso (aún sin "Continuar a revisión"): sobrevive a que la página de
// datos se desmonte al perder la conexión. Clave propia por usuario, solo de la pestaña;
// no es un CheckoutDraft parcial (Revisión lo leería como borrador completo).
const dedicatoriaKey = () => scopedKey('checkout_dedicatoria');

export const saveDedicatoriaEnCurso = (quiere: boolean, texto: string) => {
  try {
    if (!quiere && !texto) sessionStorage.removeItem(dedicatoriaKey());
    else sessionStorage.setItem(dedicatoriaKey(), JSON.stringify({ quiere, texto }));
  } catch { /* almacenamiento no disponible */ }
};

export const getDedicatoriaEnCurso = (): { quiere: boolean; texto: string } | null => {
  try {
    const raw = sessionStorage.getItem(dedicatoriaKey());
    return raw ? (JSON.parse(raw) as { quiere: boolean; texto: string }) : null;
  } catch {
    return null;
  }
};

export const clearDedicatoriaEnCurso = () => {
  try { sessionStorage.removeItem(dedicatoriaKey()); } catch { /* almacenamiento no disponible */ }
};

// Al cerrar sesión: borra las dedicatorias en curso de la pestaña, de cualquier cuenta.
// Va por prefijo porque tras limpiar la sesión la clave con alcance ya apunta a 'guest'.
export const borrarDedicatoriasEnCurso = () => {
  try {
    const claves: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith('checkout_dedicatoria')) claves.push(k);
    }
    claves.forEach((k) => sessionStorage.removeItem(k));
  } catch { /* almacenamiento no disponible */ }
};

export const clearDraft = () => {
  localStorage.removeItem(draftKey());
  clearDedicatoriaEnCurso();
};

export const saveCompletedOrder = (order: CompletedOrder) => {
  localStorage.setItem(orderKey(), JSON.stringify(order));
};

export const getCompletedOrder = (): CompletedOrder | null => {
  const raw = localStorage.getItem(orderKey());
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
