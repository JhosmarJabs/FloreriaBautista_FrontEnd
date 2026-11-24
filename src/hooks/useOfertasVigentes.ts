import { useEffect, useState } from 'react';
import { AdminService } from '../services/adminService';
import type { OfertaPublica } from '../types';

type MapaOfertas = Map<string, OfertaPublica>;

// Una sola petición compartida entre los componentes montados. Si falla, se
// descarta para que la siguiente montura pueda reintentar.
let promesaOfertas: Promise<MapaOfertas> | null = null;

const cargarOfertas = (): Promise<MapaOfertas> => {
  if (!promesaOfertas) {
    promesaOfertas = AdminService.getOfertasPublicas()
      .then((res) => {
        const mapa: MapaOfertas = new Map();
        const datos = res?.data as unknown as OfertaPublica[] | { items?: OfertaPublica[] } | undefined;
        const lista = Array.isArray(datos) ? datos : (datos?.items ?? []);
        for (const o of lista) mapa.set(o.productoId, o);
        return mapa;
      })
      .catch((err) => {
        promesaOfertas = null;
        throw err;
      });
  }
  return promesaOfertas;
};

type ProductoConPrecio = { precioBase?: number | string | null };

/** Una oferta solo cuenta como rebaja si su precio es menor al precio base. */
export const tieneOfertaValida = (
  producto: ProductoConPrecio,
  oferta?: OfertaPublica | null,
): oferta is OfertaPublica => {
  if (!oferta) return false;
  const base = Number(producto.precioBase ?? 0);
  return Number.isFinite(oferta.precioOferta) && oferta.precioOferta > 0 && oferta.precioOferta < base;
};

/** Precio que se muestra y se agrega al carrito (el cobro real lo recalcula el servidor). */
export const precioEfectivo = (
  producto: ProductoConPrecio,
  oferta?: OfertaPublica | null,
): number =>
  tieneOfertaValida(producto, oferta) ? oferta.precioOferta : Number(producto.precioBase ?? 0);

/** Porcentaje de descuento a mostrar en el badge. */
export const porcentajeOferta = (
  producto: ProductoConPrecio,
  oferta: OfertaPublica,
): number => {
  if (oferta.porcentajeDesc > 0) return Math.round(oferta.porcentajeDesc);
  const base = Number(producto.precioBase ?? 0);
  return base > 0 ? Math.round((1 - oferta.precioOferta / base) * 100) : 0;
};

export function useOfertasVigentes() {
  const [ofertasPorProducto, setOfertas] = useState<MapaOfertas>(new Map());
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    cargarOfertas()
      .then((mapa) => { if (activo) setOfertas(mapa); })
      .catch(() => { /* degrada en silencio a precio base */ })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  return { ofertasPorProducto, cargando };
}
