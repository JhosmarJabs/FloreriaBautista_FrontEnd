const COMBINING_DIACRITICALS = /[̀-ͯ]/g;

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(COMBINING_DIACRITICALS, '').toLowerCase();
}

export function coincideTexto(campo: string | null | undefined, termino: string): boolean {
  if (!campo || !termino) return !termino;
  const t = normalizar(termino.trim().replace(/\s+/g, ' '));
  return normalizar(campo).includes(t);
}

/** Palabras de relleno que se dicen al buscar («busca rosas rojas»); no filtran nada. */
const RELLENO = new Set([
  'busca', 'buscar', 'buscame', 'quiero', 'muestrame', 'ensename', 'dame', 'ver', 'tienes', 'hay',
  'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'unos', 'unas', 'con', 'para', 'por', 'favor',
  'arreglo', 'arreglos',
]);
/** Solo se quita si queda otro término («flores rojas» -> «roja»; «flores» -> «flores»). */
const RELLENO_CONDICIONAL = new Set(['flores', 'flor']);

/** Plurales simples: luces->luz, girasoles->girasol, rosas->rosa. */
function singular(t: string): string {
  if (t.length > 3 && t.endsWith('ces')) return `${t.slice(0, -3)}z`;
  if (t.length > 3 && t.endsWith('es') && !'aeiou'.includes(t[t.length - 3])) return t.slice(0, -2);
  if (t.length > 2 && t.endsWith('s') && 'aeiou'.includes(t[t.length - 2])) return t.slice(0, -1);
  return t;
}

/**
 * Términos útiles de una frase escrita o dictada: sin acentos ni signos, sin relleno y con los
 * plurales simples reducidos. Cada término se devuelve en su forma singular.
 */
export function terminosDeBusqueda(frase: string): string[] {
  const todos = normalizar(frase)
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
  let utiles = todos.filter((t) => !RELLENO.has(t) && !RELLENO_CONDICIONAL.has(t));
  if (utiles.length === 0) utiles = todos.filter((t) => !RELLENO.has(t));
  return utiles.map(singular).filter((t) => t.length > 1);
}

interface ProductoBuscable {
  id: string;
  nombre: string;
  tipo?: string | null;
  descripcion?: string | null;
}

/**
 * `true` si cada término útil de `frase` aparece (sin acentos) en el nombre, tipo, id o descripción
 * del producto. Frase vacía = todo coincide. Se acepta el término singular o el escrito.
 */
export function coincideBusqueda(producto: ProductoBuscable, frase: string): boolean {
  if (!frase.trim()) return true;
  if (coincideTexto(producto.id, frase)) return true;
  const terminos = terminosDeBusqueda(frase);
  if (terminos.length === 0) return coincideTexto(producto.nombre, frase) || coincideTexto(producto.id, frase);
  const heno = normalizar(
    [producto.nombre, producto.tipo ?? '', producto.id, producto.descripcion ?? ''].join(' '),
  );
  const originales = normalizar(frase).replace(/[^a-z0-9ñ\s]/g, ' ').split(/\s+/).filter(Boolean);
  return terminos.every((t) => heno.includes(t) || originales.some((o) => singular(o) === t && heno.includes(o)));
}
