import React, { useEffect, useState } from 'react';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { useEstadoConexion } from '../hooks/useEstadoConexion';

// Mayor que el throttle de revelado de Suspense en React 19 (300 ms): con el chunk
// guardado, React retrasa el contenido ~300 ms y un retraso menor dejaría ver el giro.
const RETRASO_MS = 500;
const LIMITE_MS = 10000;

/**
 * Indicador mientras se descarga el chunk de una ruta (fallback de Suspense).
 * Vive DENTRO del área de contenido: no tapa el encabezado ni el menú lateral.
 *
 * - Aparece tras 500 ms (ver RETRASO_MS): si el chunk ya está guardado (lo normal con el precache)
 *   no se ve nada y no hay parpadeo.
 * - Sin conexión (red caída o tienda inaccesible) dice «Esta página necesita Internet»
 *   en lugar de girar.
 * - A los 10 s sin cargar (wifi sin Internet, donde la petición puede tardar mucho)
 *   cambia el giro por un mensaje con «Reintentar».
 * - Sin movimiento con prefers-reduced-motion.
 */
export default function CargaRuta() {
  const { sinConexion } = useEstadoConexion();
  const [visible, setVisible] = useState(false);
  const [tardando, setTardando] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setVisible(true), RETRASO_MS);
    const t2 = window.setTimeout(() => setTardando(true), LIMITE_MS);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  const sinInternet = sinConexion || !navigator.onLine;
  const mensaje = sinInternet
    ? { titulo: 'Esta página necesita Internet', detalle: 'Sin conexión solo puedes ver las páginas que ya habías visitado.' }
    : tardando
      ? { titulo: 'Está tardando más de lo normal', detalle: 'Revisa tu conexión.' }
      : null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!mensaje}
      className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pt-24"
    >
      {mensaje ? (
        <>
          {sinInternet
            ? <WifiOff className="w-12 h-12 text-slate-300 dark:text-slate-500 mb-4" />
            : <RefreshCw className="w-12 h-12 text-slate-300 dark:text-slate-500 mb-4" />}
          <h2 className="text-xl font-bold text-brand-deep dark:text-white mb-1">{mensaje.titulo}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-5 max-w-md">{mensaje.detalle}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-brand-deep text-white font-bold rounded-xl hover:bg-brand-deep/90 transition-colors"
          >
            Reintentar
          </button>
        </>
      ) : (
        <>
          <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 motion-safe:animate-spin" aria-hidden="true" />
          <p className="mt-4 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Cargando página...</p>
        </>
      )}
    </div>
  );
}
