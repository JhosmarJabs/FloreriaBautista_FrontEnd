import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Pantalla de carga a página completa. La usan el Layout mientras inicializa los
 * datos y los guards de ruta mientras se hidrata la sesión, para no pintar la
 * interfaz de un rol equivocado en el primer frame.
 */
export default function PantallaCarga({ mensaje = 'Cargando sistema...' }: { mensaje?: string }) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
      <p className="text-slate-900 font-black text-2xl tracking-tighter font-serif">Florería Bautista</p>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">{mensaje}</p>
    </div>
  );
}
