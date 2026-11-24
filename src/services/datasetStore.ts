// Almacén de conjuntos de datos que sobrevive a la navegación dentro de la sesión.
//
// `useDatasetEnMemoria` guardaba el conjunto en el estado del componente, así que
// al salir de una pantalla y volver se descargaba todo otra vez. Aquí vive en un
// módulo: la lista de productos, inventario o pedidos sigue en memoria mientras la
// sesión esté abierta. Un conjunto marcado como `persistir` además se copia al
// navegador (localStorage) para sobrevivir a F5.
//
// Reglas (mismo criterio que `misPedidosCache.ts`):
// - Cada conjunto lleva el id del usuario; otra cuenta nunca lee el de la anterior.
// - Todo va en try/catch: el almacenamiento lleno, bloqueado o corrupto se ignora.
// - `borrarTodo()` lo llama `limpiarSesion()` al cerrar sesión.
// - No importa `utils/auth` (ahí se llama a `borrarTodo`): evita un ciclo de módulos.

const PREFIJO = 'fb-dataset:';
const VERSION = 1;

interface Conjunto {
  usuarioId: string;
  items: any[];
  sincronizadoEn: string;
}

const memoria = new Map<string, Conjunto>();

/** Id del usuario de la sesión actual (claim `sub` del access token), o `null`. */
function usuarioActual(): string | null {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const id = payload?.sub ?? payload?.nameid ?? null;
    return typeof id === 'string' && id ? id : null;
  } catch {
    return null;
  }
}

function claveLocal(clave: string, usuarioId: string): string {
  return `${PREFIJO}v${VERSION}:${clave}:${usuarioId}`;
}

function escribirLocal(clave: string, conjunto: Conjunto): void {
  try {
    localStorage.setItem(
      claveLocal(clave, conjunto.usuarioId),
      JSON.stringify({ version: VERSION, sincronizadoEn: conjunto.sincronizadoEn, items: conjunto.items }),
    );
  } catch {
    /* almacenamiento lleno o bloqueado: la copia es opcional */
  }
}

function leerLocal(clave: string, usuarioId: string): Conjunto | null {
  try {
    const crudo = localStorage.getItem(claveLocal(clave, usuarioId));
    if (!crudo) return null;
    const copia = JSON.parse(crudo);
    if (
      copia?.version !== VERSION ||
      typeof copia?.sincronizadoEn !== 'string' ||
      !copia.sincronizadoEn ||
      !Array.isArray(copia?.items)
    ) {
      return null;
    }
    return { usuarioId, items: copia.items, sincronizadoEn: copia.sincronizadoEn };
  } catch {
    return null;
  }
}

export const DatasetStore = {
  /** Conjunto del usuario actual, de memoria o (si `persistir`) de la copia local. */
  leer<T>(clave: string, persistir = false): { items: T[]; sincronizadoEn: string } | null {
    const usuarioId = usuarioActual();
    if (!usuarioId) return null;

    const enMemoria = memoria.get(clave);
    if (enMemoria) {
      if (enMemoria.usuarioId === usuarioId) {
        return { items: enMemoria.items as T[], sincronizadoEn: enMemoria.sincronizadoEn };
      }
      // Quedó de otra cuenta: se descarta.
      memoria.delete(clave);
    }

    if (!persistir) return null;
    const local = leerLocal(clave, usuarioId);
    if (!local) return null;
    memoria.set(clave, local);
    return { items: local.items as T[], sincronizadoEn: local.sincronizadoEn };
  },

  guardar<T>(clave: string, items: T[], sincronizadoEn: string, persistir = false): void {
    const usuarioId = usuarioActual();
    if (!usuarioId) return;
    const conjunto: Conjunto = { usuarioId, items, sincronizadoEn };
    memoria.set(clave, conjunto);
    if (persistir) escribirLocal(clave, conjunto);
  },

  /**
   * Sustituye (o añade) una fila de un conjunto ya cargado. Si el conjunto no
   * está en memoria no hace nada: la lista hará su carga completa al montarse.
   * Devuelve `true` si lo aplicó.
   */
  parchear<T>(clave: string, item: T, getId: (i: T) => string, persistir = false): boolean {
    const usuarioId = usuarioActual();
    const actual = memoria.get(clave);
    if (!usuarioId || !actual || actual.usuarioId !== usuarioId) return false;

    const id = getId(item);
    const idx = actual.items.findIndex((i) => getId(i as T) === id);
    const items = [...actual.items];
    if (idx >= 0) items[idx] = item;
    else items.push(item);

    const conjunto: Conjunto = { ...actual, items };
    memoria.set(clave, conjunto);
    if (persistir) escribirLocal(clave, conjunto);
    return true;
  },

  /** Quita una fila por id de un conjunto ya cargado (sin efecto si no está en memoria). */
  quitar<T>(clave: string, id: string, getId: (i: T) => string, persistir = false): boolean {
    const usuarioId = usuarioActual();
    const actual = memoria.get(clave);
    if (!usuarioId || !actual || actual.usuarioId !== usuarioId) return false;

    const conjunto: Conjunto = { ...actual, items: actual.items.filter((i) => getId(i as T) !== id) };
    memoria.set(clave, conjunto);
    if (persistir) escribirLocal(clave, conjunto);
    return true;
  },

  /** Vacía la memoria y borra todas las copias locales de este navegador. */
  borrarTodo(): void {
    memoria.clear();
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIJO))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* noop */
    }
  },
};
