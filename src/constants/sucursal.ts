/**
 * Ubicación de la sucursal en un solo lugar (una sola fuente, como `constants/legal.ts`).
 *
 * Coordenadas reales confirmadas por el usuario el 2026-11-20: pin de Ignacio Rayón 665,
 * Centro, 43021 Huitzitzilingo, Hgo. (San Felipe Orizatlán). Para cambiarlas:
 *   1. Poner aquí las coordenadas y `confirmada: true`.
 *   2. Regenerar la red de calles:  npx tsx scripts/generar-red-vial-sucursal.ts
 *   3. Cargar las mismas coordenadas en el CMS (de desarrollo y de producción).
 *
 * La página «Ir a la sucursal» toma la sucursal del CMS y, sin CMS, del `destino` de la red
 * vial (que sale de esta configuración); no hay una tercera fuente que pueda contradecir al CMS.
 */
export const UBICACION_SUCURSAL = {
  latitud: 21.1740865,
  longitud: -98.6559011,
  nombre: 'Florería Bautista',
  /** Radio (m) de la zona con ruta por calles sin Internet. */
  radioZonaM: 3000,
  confirmada: true,
} as const;
