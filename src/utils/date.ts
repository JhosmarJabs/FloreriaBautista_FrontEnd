/**
 * Utilidades de fecha para consumir la API del backend.
 *
 * El backend expone dos formas de fecha:
 *  - DateTime completo (ej. fechaCreacion): "2026-07-15T17:08:05.730Z" — UTC con 'Z'.
 *    `new Date()` lo convierte bien a la hora local.
 *  - DateOnly, solo fecha (ej. fechaEntrega): "2026-07-15" — SIN hora.
 *    Aqui `new Date("2026-07-15")` lo interpreta como medianoche UTC y en Mexico
 *    (UTC-6) lo muestra el dia anterior. Por eso lo parseamos como fecha LOCAL.
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Convierte un valor de fecha de la API en un Date correcto para hora local. */
export function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;
  // Fecha pura "YYYY-MM-DD": anclar a medianoche LOCAL para no restar un dia.
  return DATE_ONLY.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
}

/** Formatea una fecha de la API (por defecto: "15 jul 2026"). */
export function formatApiDate(
  value?: string | null,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
  locale = 'es-MX',
): string {
  const d = parseApiDate(value);
  return d ? d.toLocaleDateString(locale, options) : '—';
}
