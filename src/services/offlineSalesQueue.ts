const DB_NAME = 'floreria-offline';
const DB_VERSION = 1;
const STORE_NAME = 'ventasPendientes';

export interface OfflineSale {
  idLocalOffline: string;
  payload: Record<string, unknown>;
  creadoEn: string;
  intentos: number;
  error?: string;
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
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function obtenerPendientes(): Promise<OfflineSale[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function eliminarVenta(idLocalOffline: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').delete(idLocalOffline);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function actualizarVenta(sale: OfflineSale): Promise<void> {
  return agregarVenta(sale);
}

export async function contarPendientes(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
