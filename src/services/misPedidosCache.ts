// Última copia de "Mis pedidos" del cliente, para poder verla sin Internet.
//
// Vive en la capa de la app y no en el service worker: el SW nunca guarda una
// respuesta autenticada. La clave lleva el id del usuario, así que una cuenta no
// puede leer la copia de otra, y se borra al cerrar sesión.

const PREFIJO = 'mis-pedidos:';

export interface CopiaMisPedidos {
  pedidos: any[];
  /** Momento en que el servidor devolvió esta lista (ms desde epoch). */
  guardadoEn: number;
}

export const MisPedidosCache = {
  guardar(userId: string, pedidos: any[]): void {
    try {
      const copia: CopiaMisPedidos = { pedidos, guardadoEn: Date.now() };
      localStorage.setItem(PREFIJO + userId, JSON.stringify(copia));
    } catch {
      /* almacenamiento lleno o bloqueado: la copia es opcional */
    }
  },

  leer(userId: string): CopiaMisPedidos | null {
    try {
      const crudo = localStorage.getItem(PREFIJO + userId);
      if (!crudo) return null;
      const copia = JSON.parse(crudo);
      if (!Array.isArray(copia?.pedidos) || typeof copia?.guardadoEn !== 'number') return null;
      return copia;
    } catch {
      return null;
    }
  },

  /** Borra la copia de todas las cuentas de este navegador. */
  borrarTodo(): void {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIJO))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* noop */
    }
  },
};
