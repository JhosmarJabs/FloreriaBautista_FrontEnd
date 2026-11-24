import { useEffect } from 'react';
import { CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { formatApiDate } from '../utils/date';
import { NotificationDto } from '../services/notificationsService';

interface PanelNotificacionesProps {
  /** Cierra la ventana (clic en una notificación con destino). */
  onCerrar: () => void;
  /** Avisa el número de no leídas cada vez que cambia, para el globo de la campana. */
  onNoLeidasChange?: (noLeidas: number) => void;
}

/** Destino de ADMINISTRADOR de una notificación; nunca apunta a /empleado/*. */
function rutaAdmin(n: NotificationDto): string | null {
  if (!n.entidadTipo || !n.entidadId) return null;
  switch (n.entidadTipo) {
    case 'Order': return `/admin/pedidos/${n.entidadId}`;
    case 'InventoryItem': return '/admin/inventario';
    default: return null;
  }
}

export default function PanelNotificaciones({ onCerrar, onNoLeidasChange }: PanelNotificacionesProps) {
  const navigate = useNavigate();
  const { notificaciones, noLeidas, cargando, error, marcarLeida, marcarTodasLeidas } = useNotifications(10);

  useEffect(() => {
    if (!cargando && !error) onNoLeidasChange?.(noLeidas);
  }, [noLeidas, cargando, error, onNoLeidasChange]);

  const handleClick = async (n: NotificationDto) => {
    if (!n.leida) {
      try { await marcarLeida(n.id); } catch { /* se queda sin marcar; el usuario puede reintentar */ }
    }
    const ruta = rutaAdmin(n);
    if (ruta) {
      onCerrar();
      navigate(ruta);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Notificaciones"
      className="fixed inset-x-4 top-[4.5rem] z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#1e3a5f] dark:text-white">Notificaciones</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">{noLeidas} sin leer</p>
        </div>
        {noLeidas > 0 && (
          <button
            type="button"
            onClick={() => { marcarTodasLeidas().catch(() => {}); }}
            className="flex items-center gap-1 text-xs font-semibold text-[#1e3a5f] dark:text-sky-300 hover:underline flex-shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {cargando ? (
        <p className="px-4 py-6 text-sm text-center text-gray-500 dark:text-slate-400">Cargando…</p>
      ) : error ? (
        <p className="px-4 py-6 text-sm text-center text-red-600 dark:text-red-400">
          No se pudieron cargar las notificaciones
        </p>
      ) : notificaciones.length === 0 ? (
        <p className="px-4 py-6 text-sm text-center text-gray-500 dark:text-slate-400">No tienes notificaciones</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-slate-800">
          {notificaciones.map(n => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${n.leida ? '' : 'bg-sky-50/60 dark:bg-sky-900/10'}`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.leida ? 'bg-transparent' : 'bg-red-500'}`}
                />
                <span className="min-w-0">
                  <span className={`block text-sm text-[#1e3a5f] dark:text-slate-100 ${n.leida ? 'font-medium' : 'font-bold'}`}>
                    {n.titulo}
                  </span>
                  <span className="block text-xs text-gray-600 dark:text-slate-400 break-words">{n.mensaje}</span>
                  <span className="block text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                    {formatApiDate(n.creadaEn, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
