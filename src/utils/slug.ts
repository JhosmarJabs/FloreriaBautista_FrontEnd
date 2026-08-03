// Utilidades para generar URLs legibles (slugs) a partir del nombre del producto,
// de modo que la URL no exponga el ID interno del producto.

/**
 * Convierte un texto en un slug apto para URL.
 * Ej: "Arreglo de Cumpleanos con Globos" -> "arreglo-de-cumpleanos-con-globos"
 */
export function slugify(text: string): string {
  return (text || '')
    .toString()
    .normalize('NFD')                        // separa las letras de sus acentos
    .replace(/[̀-ͯ]/g, '')         // elimina los acentos (marcas diacriticas)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')            // quita simbolos que no sirven en la URL
    .replace(/\s+/g, '-')                    // espacios -> guiones
    .replace(/-+/g, '-');                    // colapsa guiones repetidos
}

/** Detecta si un valor tiene forma de GUID (id interno), para dar compatibilidad
 * con enlaces antiguos que aun usan el id en la URL. */
export function esGuid(valor: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}
