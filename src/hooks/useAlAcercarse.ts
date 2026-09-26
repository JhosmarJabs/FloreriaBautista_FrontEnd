import { RefObject, useEffect, useState } from 'react';

const EVENTOS_USUARIO = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

/**
 * Pasa a true cuando el usuario interactúa con la página o cuando el centinela entra
 * en pantalla (viewports altos, p. ej. crawlers). Sirve para montar contenido que
 * empieza fuera de la primera pantalla sin maquetarlo durante la carga: en móvil ese
 * trabajo eran tareas largas que sumaban TBT en Lighthouse.
 */
export function useAlAcercarse(centinela: RefObject<HTMLElement | null>): boolean {
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    if (activo) return;
    const activar = () => setActivo(true);
    EVENTOS_USUARIO.forEach(ev => window.addEventListener(ev, activar, { passive: true, once: true }));
    // -2px: un centinela pegado justo al borde inferior no cuenta como visible.
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) activar(); },
          { rootMargin: '0px 0px -2px 0px' })
      : null;
    if (io && centinela.current) io.observe(centinela.current);
    return () => {
      EVENTOS_USUARIO.forEach(ev => window.removeEventListener(ev, activar));
      io?.disconnect();
    };
  }, [activo, centinela]);

  return activo;
}
