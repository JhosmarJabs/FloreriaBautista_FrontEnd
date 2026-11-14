const DB_NAME = 'floreria-offline';
const DB_VERSION = 1;
const STORE_NAME = 'ventasPendientes';

/** Evento de ventana que avisa que la cola cambió (para refrescar el indicador del layout). */
export const COLA_OFFLINE_CAMBIO = 'cola-offline-cambio';

function avisarCambio() {
  window.dispatchEvent(new Event(COLA_OFFLINE_CAMBIO));
}

export interface OfflineSale {
  idLocalOffline: string;
  payload: Record<string, unknown>;
  creadoEn: string;
  intentos: number;
  error?: string;
  /**
   * Id (claim `sub` del JWT) de quien capturó la venta. La venta solo se envía con la sesión de
   * ese usuario, porque el servidor la atribuye al dueño del token. Opcional: los registros
   * guardados antes de este campo no lo tienen.
   */
  usuarioId?: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME))
        db.createObjectStore(STORE_NAME, { keyPath: 'idLocalOffline' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

export async function agregarVenta(sale: OfflineSale): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').put(sale);
    req.onsuccess = () => { resolve(); avisarCambio(); };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Ventas de la cola que le corresponden a `usuarioId`. Incluye los registros sin `usuarioId`
 * (guardados antes de que se registrara el dueño): no hay forma de saber quién los capturó y
 * retenerlos los dejaría atascados para siempre, así que conservan el comportamiento anterior
 * y se atienden con la sesión activa.
 */
export async function obtenerPendientes(usuarioId: string | null): Promise<OfflineSale[]> {
  if (!usuarioId) return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').getAll();
    req.onsuccess = () =>
      resolve((req.result as OfflineSale[]).filter((s) => !s.usuarioId || s.usuarioId === usuarioId));
    req.onerror = () => reject(req.error);
  });
}

export async function eliminarVenta(idLocalOffline: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').delete(idLocalOffline);
    req.onsuccess = () => { resolve(); avisarCambio(); };
    req.onerror = () => reject(req.error);
  });
}

export async function actualizarVenta(sale: OfflineSale): Promise<void> {
  return agregarVenta(sale);
}

export async function contarPendientes(usuarioId: string | null): Promise<number> {
  return (await obtenerPendientes(usuarioId)).length;
}
