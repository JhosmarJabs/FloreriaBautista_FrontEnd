import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Pantalla de carga a página completa. La usan el Layout mientras inicializa los
 * datos y los guards de ruta mientras se hidrata la sesión, para no pintar la
 * interfaz de un rol equivocado en el primer frame. Solo sale al arrancar: la
 * carga al navegar entre páginas es CargaRuta (no tapa el encabezado). Respeta el
 * modo oscuro del panel y prefers-reduced-motion.
 */
export default function PantallaCarga({ mensaje = 'Cargando sistema...' }: { mensaje?: string }) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-[#0b1624] flex flex-col items-center justify-center z-50">
      <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 motion-safe:animate-spin mb-6" />
      <p className="text-slate-900 dark:text-white font-black text-2xl tracking-tighter font-serif">Florería Bautista</p>
      <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">{mensaje}</p>
    </div>
  );
}
