import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

const REVISAR_CADA_MS = 60 * 60 * 1000;

// Candado a nivel de módulo: sobrevive a re-renderizados y al doble montaje de StrictMode,
// y deja una sola llamada a reload() aunque la recarga la pidan la librería y este componente.
let recargando = false;
function recargarUnaVez() {
  if (recargando) return;
  recargando = true;
  window.location.reload();
}

/**
 * Registra el service worker y avisa cuando hay una versión nueva.
 *
 * Nunca recarga por su cuenta: el cliente puede estar a media compra. La versión
 * nueva espera hasta que pulse "Actualizar". El mismo aviso sale si la app pide
 * un chunk que ya no existe tras un despliegue (`vite:preloadError`).
 *
 * La recarga tras "Actualizar" no se delega solo en la librería: `updateServiceWorker(true)`
 * ignora su argumento y vite-plugin-pwa solo recarga si la pestaña ya estaba controlada por
 * un SW al abrirse (`isUpdate` de workbox-window). En una primera visita no lo está, así que
 * la página no se recargaba. Por eso `actualizar` arma su propio `controllerchange`.
 */
export default function PwaUpdatePrompt() {
  const [chunkPerdido, setChunkPerdido] = useState(false);
  const [descartado, setDescartado] = useState(false);

  const {
    needRefresh: [hayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedReload: recargarUnaVez,
    onRegisteredSW(_url, registro) {
      if (!registro) return;
      const revisar = () => {
        if (navigator.onLine) registro.update().catch(() => { /* sin red: se reintenta después */ });
      };
      setInterval(revisar, REVISAR_CADA_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') revisar();
      });
    },
  });

  useEffect(() => {
    const alFallarChunk = () => {
      // Sin red el chunk falla por la conexión, no por un despliegue.
      if (!navigator.onLine) return;
      setChunkPerdido(true);
      setDescartado(false);
    };
    window.addEventListener('vite:preloadError', alFallarChunk);
    return () => window.removeEventListener('vite:preloadError', alFallarChunk);
  }, []);

  useEffect(() => {
    if (hayVersionNueva) setDescartado(false);
  }, [hayVersionNueva]);

  if ((!hayVersionNueva && !chunkPerdido) || descartado) return null;

  const actualizar = async () => {
    // Con un SW en espera, lo activa y recarga; si solo faltó un chunk, basta recargar.
    if (!hayVersionNueva) {
      window.location.reload();
      return;
    }
    // Si otra pestaña ya activó la versión nueva, aquí no queda SW en espera: activarlo no
    // haría nada (ni habría `controllerchange`), así que se recarga directamente.
    const registro = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
    if (!registro?.waiting) {
      recargarUnaVez();
      return;
    }
    // Se arma solo al pulsar: en la primera visita `controllerchange` también salta al cargar
    // (clientsClaim) y recargar desde el montaje haría que la página se recargara sola.
    navigator.serviceWorker.addEventListener('controllerchange', recargarUnaVez, { once: true });
    updateServiceWorker(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 z-[110] sm:max-w-sm animate-[toastIn_0.3s_ease-out_both]"
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl bg-brand-deep text-white border border-white/20">
        <RefreshCw className="w-5 h-5 shrink-0" />
        <p className="text-sm font-bold flex-grow">Hay una versión nueva</p>
        <button
          onClick={actualizar}
          className="px-3 py-1.5 bg-white text-brand-deep text-sm font-bold rounded-lg hover:bg-brand-light transition-colors"
        >
          Actualizar
        </button>
        <button
          onClick={() => setDescartado(true)}
          aria-label="Cerrar aviso"
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
