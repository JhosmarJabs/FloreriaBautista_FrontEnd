import { useEffect, useState } from 'react';

/**
 * `true` mientras el navegador reporta conexión. `navigator.onLine` solo sabe si
 * hay red, no si el servidor responde: sirve para avisar y deshabilitar acciones,
 * no para dar por buena una petición.
 */
export function useOnlineStatus(): boolean {
  const [enLinea, setEnLinea] = useState(() => navigator.onLine);

  useEffect(() => {
    const actualizar = () => setEnLinea(navigator.onLine);
    window.addEventListener('online', actualizar);
    window.addEventListener('offline', actualizar);
    return () => {
      window.removeEventListener('online', actualizar);
      window.removeEventListener('offline', actualizar);
    };
  }, []);

  return enLinea;
}
