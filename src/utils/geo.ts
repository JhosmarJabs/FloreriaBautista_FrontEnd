// Cálculos de ubicación hechos en el dispositivo. La posición del cliente nunca
// se envía al backend: solo se usa aquí y, si el usuario lo decide, en el enlace
// a Google Maps.

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

const RADIO_TIERRA_KM = 6371;

const aRadianes = (grados: number) => (grados * Math.PI) / 180;

/** Distancia en línea recta entre dos puntos (fórmula de Haversine), en km. */
export function distanciaKm(a: Coordenadas, b: Coordenadas): number {
  const dLat = aRadianes(b.latitud - a.latitud);
  const dLon = aRadianes(b.longitud - a.longitud);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.latitud)) * Math.cos(aRadianes(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "850 m" por debajo de 1 km; "12.4 km" en adelante. */
export function formatearDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString('es-MX', { maximumFractionDigits: 1 })} km`;
}

/** Enlace de ruta en Google Maps hacia `destino`; sin `origen`, Maps usa la ubicación que tenga. */
export function urlRutaMaps(destino: Coordenadas, origen?: Coordenadas | null): string {
  const base = `https://www.google.com/maps/dir/?api=1&destination=${destino.latitud},${destino.longitud}`;
  return origen ? `${base}&origin=${origen.latitud},${origen.longitud}` : base;
}

/**
 * Dirección del mapa insertado (iframe) de la sucursal. Pura: no recibe ni usa la
 * posición del cliente. Con coordenadas ubica por coordenadas; sin ellas, por
 * `direccion`; sin ninguna de las dos devuelve `null` (no hay mapa).
 *
 * Usa la forma `maps.google.com/maps?q=...&output=embed`, que no lleva llave pero
 * Google no documenta. Si deja de funcionar, cambiar solo esta función a la Maps
 * Embed API (`https://www.google.com/maps/embed/v1/place?key=...&q=...`).
 */
export function urlMapaInsertado(destino: Coordenadas | null, direccion?: string | null): string | null {
  const q = destino
    ? `${destino.latitud},${destino.longitud}`
    : direccion && direccion.trim()
      ? encodeURIComponent(direccion.trim())
      : null;
  return q ? `https://maps.google.com/maps?q=${q}&z=16&output=embed` : null;
}

/**
 * Coordenadas utilizables o `null`: falta alguna, no es número finito o está fuera de rango.
 * Toda la funcionalidad de recorrido obtiene la sucursal por aquí (inválidas = inexistentes).
 */
export function coordenadasValidas(
  latitud: number | null | undefined,
  longitud: number | null | undefined,
): Coordenadas | null {
  if (typeof latitud !== 'number' || typeof longitud !== 'number') return null;
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) return null;
  if (Math.abs(latitud) > 90 || Math.abs(longitud) > 180) return null;
  return { latitud, longitud };
}

/** Rumbo inicial (0-360, 0 = norte) para ir de `desde` a `hacia`. */
export function rumboGrados(desde: Coordenadas, hacia: Coordenadas): number {
  const f1 = aRadianes(desde.latitud);
  const f2 = aRadianes(hacia.latitud);
  const dl = aRadianes(hacia.longitud - desde.longitud);
  const y = Math.sin(dl) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const SECTORES = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];

/** «norte», «noreste», «este»... (8 sectores). */
export function rumboCardinal(grados: number): string {
  const g = ((grados % 360) + 360) % 360;
  return SECTORES[Math.round(g / 45) % 8];
}
