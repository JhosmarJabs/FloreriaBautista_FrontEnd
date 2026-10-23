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
