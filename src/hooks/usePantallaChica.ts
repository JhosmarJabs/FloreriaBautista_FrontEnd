import { useEffect, useState } from 'react';

const CONSULTA_MOVIL = '(max-width: 767px)';

const leerEsMovil = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(CONSULTA_MOVIL).matches;

/**
 * Indica si la pantalla es de celular (< 768 px). El valor inicial se lee en el
 * primer render (no en un efecto) para que en móvil el menú no aparezca
 * desplegado ni un instante.
 */
export function usePantallaChica(): boolean {
  const [esMovil, setEsMovil] = useState<boolean>(leerEsMovil);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(CONSULTA_MOVIL);
    const alCambiar = (e: MediaQueryListEvent) => setEsMovil(e.matches);
    setEsMovil(mql.matches);
    mql.addEventListener('change', alCambiar);
    return () => mql.removeEventListener('change', alCambiar);
  }, []);

  return esMovil;
}
