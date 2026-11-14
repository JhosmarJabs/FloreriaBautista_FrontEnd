import type { SlugLegal } from '../types';

/**
 * Las 5 páginas legales y de ayuda: una sola fuente para rutas, footer, enlaces y sitemap.
 * Los slugs son los mismos que define el backend (ContenidoLegalPorDefecto.Slugs) y no se
 * pueden crear otros.
 *
 * Si cambia una ruta de esta lista, actualiza también public/sitemap.xml.
 */
export interface PaginaLegal {
  slug: SlugLegal;
  ruta: string;
  nombreCorto: string;
}

export const PAGINAS_LEGALES: readonly PaginaLegal[] = [
  { slug: 'aviso-de-privacidad', ruta: '/aviso-de-privacidad', nombreCorto: 'Aviso de privacidad' },
  { slug: 'terminos-y-condiciones', ruta: '/terminos-y-condiciones', nombreCorto: 'Términos y condiciones' },
  { slug: 'envios-y-entregas', ruta: '/envios-y-entregas', nombreCorto: 'Envíos y entregas' },
  { slug: 'cancelaciones-y-reembolsos', ruta: '/cancelaciones-y-reembolsos', nombreCorto: 'Cancelaciones y reembolsos' },
  { slug: 'preguntas-frecuentes', ruta: '/preguntas-frecuentes', nombreCorto: 'Preguntas frecuentes' },
];

export const RUTA_LEGAL: Record<SlugLegal, string> = Object.fromEntries(
  PAGINAS_LEGALES.map((p) => [p.slug, p.ruta]),
) as Record<SlugLegal, string>;

/** Variables {{...}} permitidas en los textos (las mismas que valida el backend). */
export const VARIABLES_LEGALES = [
  'nombreTienda',
  'razonSocial',
  'direccion',
  'telefono',
  'correo',
  'correoPrivacidad',
] as const;
