import React from 'react';
import { WifiOff } from 'lucide-react';

interface Props {
  /** Explicación de para qué hace falta Internet. */
  texto?: string;
}

/** Estado «Necesitas conexión» para pantallas que no funcionan sin Internet. Mismo estilo que RutaErrorBoundary. */
export default function RequiereConexion({ texto = 'Esta sección necesita Internet para funcionar.' }: Props) {
  return (
    <div role="status" className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-32">
      <WifiOff className="w-16 h-16 text-slate-300 mb-4" />
      <h2 className="text-2xl font-bold text-brand-deep mb-2">Necesitas conexión</h2>
      <p className="text-slate-500 mb-6 max-w-md">{texto}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-brand-deep text-white font-bold rounded-xl hover:bg-brand-deep/90 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
