// Parche de las listas de productos e inventario del ADMIN tras una escritura.
//
// Las pantallas de edición guardan con un POST y navegan a la lista. En vez de dejar
// que la lista vuelva a descargar el índice, aquí se proyecta la respuesta de la
// escritura a la forma del índice (`ProductIndexDto` / `InventoryIndexDto`) y se
// parchea el conjunto que la lista conserva en `DatasetStore`.
//
// - Si el conjunto no está en memoria (se entró directo a la URL de edición) no hace
//   nada: la lista hará su carga completa al montarse.
// - Lo que la respuesta no trae se completa con la fila que ya estaba en el almacén;
//   nunca con una recarga del índice.

import { DatasetStore } from './datasetStore';
import { Product, InventoryItem } from '../types';

export const CLAVE_PRODUCTOS = 'admin-productos';
export const CLAVE_INVENTARIO = 'admin-inventario';

const idProducto = (p: Product) => p.id;
const idInsumo = (i: InventoryItem) => i.id;

/** `data` es el cuerpo `data` de la respuesta de crear o editar un producto. */
export function parchearProductoEnLista(data: any): void {
  if (!data?.id) return;
  if (data.activo === false) {
    DatasetStore.quitar<Product>(CLAVE_PRODUCTOS, data.id, idProducto);
    return;
  }
  const previo = DatasetStore.leer<Product>(CLAVE_PRODUCTOS)?.items.find(p => p.id === data.id);
  const fila: Product = {
    id: data.id,
    nombre: data.nombre ?? previo?.nombre ?? '',
    precioBase: data.precioBase ?? previo?.precioBase ?? 0,
    tipo: data.tipo ?? previo?.tipo ?? '',
    estado: data.estado ?? previo?.estado ?? '',
    imagenUrl: data.imagenUrl !== undefined ? data.imagenUrl : (previo?.imagenUrl ?? null),
    activo: data.activo ?? previo?.activo ?? true,
    esReal: data.esReal ?? previo?.esReal,
    actualizadoEn: data.actualizadoEn ?? previo?.actualizadoEn ?? null,
    stock: previo?.stock ?? null,
  };
  DatasetStore.parchear<Product>(CLAVE_PRODUCTOS, fila, idProducto);
}

export function quitarProductoDeLista(id: string | undefined): void {
  if (id) DatasetStore.quitar<Product>(CLAVE_PRODUCTOS, id, idProducto);
}

/** `data` es el cuerpo `data` de la respuesta de crear o editar un insumo. */
export function parchearInsumoEnLista(data: any): void {
  if (!data?.id) return;
  if (data.activo === false) {
    DatasetStore.quitar<InventoryItem>(CLAVE_INVENTARIO, data.id, idInsumo);
    return;
  }
  const previo = DatasetStore.leer<InventoryItem>(CLAVE_INVENTARIO)?.items.find(i => i.id === data.id);
  const stockActual = data.stockActual ?? previo?.stockActual ?? 0;
  const stockMinimo = data.stockMinimo ?? previo?.stockMinimo ?? 0;
  const fila: InventoryItem = {
    id: data.id,
    nombre: data.nombre ?? previo?.nombre ?? '',
    stockActual,
    stockMinimo,
    sucursal: data.sucursal ?? previo?.sucursal ?? '',
    sumaAlCosto: data.sumaAlCosto ?? previo?.sumaAlCosto ?? false,
    unidadMedida: data.unidadMedida ?? previo?.unidadMedida ?? '',
    precioCosto: data.precioCosto ?? previo?.precioCosto ?? 0,
    esFlorPrimaria: data.esFlorPrimaria ?? previo?.esFlorPrimaria ?? false,
    imagenUrl: data.imagenUrl !== undefined ? data.imagenUrl : (previo?.imagenUrl ?? null),
    bajoMinimo: data.bajoMinimo ?? stockActual <= stockMinimo,
    rendimientoEsperado: data.rendimientoEsperado ?? previo?.rendimientoEsperado ?? 1,
    factorMermaUso: data.factorMermaUso ?? previo?.factorMermaUso ?? 0,
    precioUnidadCompra: data.precioUnidadCompra !== undefined ? data.precioUnidadCompra : previo?.precioUnidadCompra,
    unidadCompra: data.unidadCompra !== undefined ? data.unidadCompra : previo?.unidadCompra,
    vidaUtilDias: data.vidaUtilDias !== undefined ? data.vidaUtilDias : previo?.vidaUtilDias,
    activo: data.activo ?? previo?.activo ?? true,
    actualizadoEn: data.actualizadoEn ?? previo?.actualizadoEn ?? null,
  };
  DatasetStore.parchear<InventoryItem>(CLAVE_INVENTARIO, fila, idInsumo);
}

export function quitarInsumoDeLista(id: string | undefined): void {
  if (id) DatasetStore.quitar<InventoryItem>(CLAVE_INVENTARIO, id, idInsumo);
}
