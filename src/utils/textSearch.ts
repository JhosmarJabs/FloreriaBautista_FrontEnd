const COMBINING_DIACRITICALS = /[̀-ͯ]/g;

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(COMBINING_DIACRITICALS, '').toLowerCase();
}

export function coincideTexto(campo: string | null | undefined, termino: string): boolean {
  if (!campo || !termino) return !termino;
  const t = normalizar(termino.trim().replace(/\s+/g, ' '));
  return normalizar(campo).includes(t);
}
