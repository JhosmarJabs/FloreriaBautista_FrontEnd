import React from 'react';
import { CheckCircle2, WifiOff } from 'lucide-react';
import { useEstadoConexion } from '../hooks/useEstadoConexion';
import { haceCuanto } from '../utils/date';

/**
 * Aviso único de conexión para toda la web (salvo /empleado, donde lo da la
 * pastilla del encabezado). Distingue sin red, tienda que no responde y datos
 * servidos desde la caché del service worker con su antigüedad.
 */
export default function AvisoConexion() {
  const { red, servidor, datosGuardadosDesde, restablecida } = useEstadoConexion();

  let texto: string | null = null;
  if (red === 'sin-red') texto = 'Sin conexión';
  else if (servidor === 'inaccesible') texto = 'No hay conexión con la tienda';

  if (texto) {
    if (datosGuardadosDesde !== null) texto += ` — mostrando datos guardados ${haceCuanto(datosGuardadosDesde)}`;
  } else if (!restablecida) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center justify-center gap-2 px-4 py-1.5 rounded-full shadow-lg text-white text-xs font-bold whitespace-normal text-center w-max max-w-[calc(100vw-2rem)] ${
        texto ? 'bg-slate-900' : 'bg-emerald-600'
      }`}
    >
      {texto ? <WifiOff className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
      {texto ?? 'Conexión restablecida'}
    </div>
  );
}
