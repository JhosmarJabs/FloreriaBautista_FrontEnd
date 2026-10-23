import { ApiResponse, Product } from '../types';

/**
 * Instantánea del catálogo público: UNA sola petición con URL constante para
 * inicio del cliente, catálogo, resolución de la URL del producto y relacionados
 * de respaldo. Es la clave de la caché api-catalogo del service worker, así que
 * la cadena no debe variar entre usos. Sin Authorization (como getProducts):
 * el SW nunca guarda respuestas autenticadas.
 */
export const URL_INSTANTANEA = '/api/products?size=1000';

/** porSw: la petición salió con el service worker ya controlando la página, o sea que
 *  su respuesta pasó por la caché api-catalogo (una anterior al SW no queda guardada). */
let memo: { items: Product[]; guardado: boolean; porSw: boolean } | null = null;
let enVuelo: { promesa: Promise<Product[]>; porSw: boolean } | null = null;

function pedirInstantanea(baja = false): Promise<Product[]> {
  const entrada = { porSw: !!navigator.serviceWorker?.controller } as NonNullable<typeof enVuelo>;
  enVuelo = entrada;
  entrada.promesa = (async () => {
    try {
      const res = await fetch(URL_INSTANTANEA, baja ? ({ priority: 'low' } as RequestInit) : undefined);
      if (!res.ok) throw new Error('Error al obtener productos');
      const json: ApiResponse<Product> = await res.json();
      if (json.data.total > json.data.items.length) {
        console.warn(`Catálogo con ${json.data.total} productos: la instantánea solo trae ${json.data.items.length}.`);
      }
      memo = { items: json.data.items, guardado: res.headers.get('X-Desde-Cache') === '1', porSw: entrada.porSw };
      return memo.items;
    } catch (err) {
      if (memo) return memo.items;
      throw err;
    } finally {
      if (enVuelo === entrada) enVuelo = null;
    }
  })();
  return entrada.promesa;
}

export function obtenerInstantaneaCatalogo(): Promise<Product[]> {
  // Una copia servida desde la caché del SW se vuelve a pedir en cuanto hay red,
  // para no quedarse con datos viejos toda la sesión.
  if (memo && (!memo.guardado || !navigator.onLine)) return Promise.resolve(memo.items);
  if (enVuelo) return enVuelo.promesa;
  return pedirInstantanea();
}

/**
 * Usada por el calentamiento offline: garantiza que la instantánea pasó por el SW (queda en
 * api-catalogo) sin pedirla dos veces. Si la página ya la pidió con el SW controlando (o la
 * está pidiendo), no hace nada; si esa petición fue previa al SW (primera visita), se repite
 * una vez y el resultado actualiza el memo.
 */
export async function asegurarInstantaneaEnCache(): Promise<void> {
  if (enVuelo) {
    const { promesa, porSw } = enVuelo;
    try { await promesa; } catch { /* la página recibe el error; aquí es silencioso */ }
    if (porSw) return;
  }
  if (memo?.porSw) return;
  await pedirInstantanea(true);
}
