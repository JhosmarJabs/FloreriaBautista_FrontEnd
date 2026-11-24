import React, { useLayoutEffect, useRef } from 'react';
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

  const ref = useRef<HTMLDivElement>(null);

  let texto: string | null = null;
  if (red === 'sin-red') texto = 'Sin conexión';
  else if (servidor === 'inaccesible') texto = 'No hay conexión con la tienda';

  if (texto && datosGuardadosDesde !== null) texto += ` — mostrando datos guardados ${haceCuanto(datosGuardadosDesde)}`;
  const visible = texto !== null || restablecida;

  // Publica el alto real del aviso (+8 px) para que el contenido público y los
  // menús móviles reserven su espacio: al ser fixed no ocupa lugar en el flujo.
  useLayoutEffect(() => {
    const raiz = document.documentElement;
    const el = ref.current;
    if (!visible || !el) {
      raiz.style.removeProperty('--aviso-conexion-h');
      return;
    }
    const medir = () => raiz.style.setProperty('--aviso-conexion-h', `${Math.ceil(el.getBoundingClientRect().height) + 8}px`);
    medir();
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    obs?.observe(el);
    return () => {
      obs?.disconnect();
      raiz.style.removeProperty('--aviso-conexion-h');
    };
  }, [visible, texto]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center justify-center gap-2 px-4 py-1.5 rounded-full shadow-lg text-white text-xs font-bold whitespace-normal text-center w-max max-w-[calc(100vw-2rem)] ${
        texto ? 'bg-slate-900' : 'bg-emerald-600'
      }`}
    >
      {texto ? <WifiOff className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
      {texto ?? 'Conexión restablecida'}
    </div>
  );
}
