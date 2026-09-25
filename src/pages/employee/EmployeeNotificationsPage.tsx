import React, { useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  ShoppingBag,
  AlertTriangle,
  Truck,
  CreditCard,
  Package,
  Zap,
  ChevronRight,
  Trash2,
  Inbox,
  ChevronLeft,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { FadeIn, StaggerContainer, GlassCard } from '../../components/Animations';
import { useNotifications } from '../../hooks/useNotifications';
import { parseApiDate } from '../../utils/date';
import { NotificationDto } from '../../services/notificationsService';

const ICON_MAP: Record<string, { icon: React.ElementType; bg: string; text: string }> = {
  PEDIDO_NUEVO:                 { icon: ShoppingBag,    bg: 'bg-blue-50 dark:bg-blue-900/30',    text: 'text-blue-600 dark:text-blue-400' },
  PEDIDO_ANTICIPADO:            { icon: ShoppingBag,    bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  PEDIDO_ENTREGADO:             { icon: Truck,          bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  PAGO_REGISTRADO:              { icon: CreditCard,     bg: 'bg-green-50 dark:bg-green-900/30',  text: 'text-green-600 dark:text-green-400' },
  STOCK_BAJO:                   { icon: AlertTriangle,  bg: 'bg-amber-50 dark:bg-amber-900/30',  text: 'text-amber-600 dark:text-amber-400' },
  VENTA_INSTANTANEA_PENDIENTE:  { icon: Zap,            bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  VENTA_INSTANTANEA_ESCALADA:   { icon: AlertTriangle,  bg: 'bg-rose-50 dark:bg-rose-900/30',    text: 'text-rose-600 dark:text-rose-400' },
  SOLICITUD_DECIDIDA:           { icon: CheckCircle2,   bg: 'bg-teal-50 dark:bg-teal-900/30',    text: 'text-teal-600 dark:text-teal-400' },
};

const DEFAULT_ICON = { icon: Bell, bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-400 dark:text-slate-500' };

function agruparPorFecha(items: NotificationDto[]): { label: string; items: NotificationDto[] }[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  const grupos: Record<string, NotificationDto[]> = {};
  for (const n of items) {
    const fecha = parseApiDate(n.creadaEn);
    if (!fecha) continue;
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);

    let label: string;
    if (d.getTime() === hoy.getTime()) label = 'Hoy';
    else if (d.getTime() === ayer.getTime()) label = 'Ayer';
    else label = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

    (grupos[label] ??= []).push(n);
  }

  return Object.entries(grupos).map(([label, items]) => ({ label, items }));
}

function resolverRuta(n: NotificationDto): string | null {
  if (!n.entidadTipo || !n.entidadId) return null;
  switch (n.entidadTipo) {
    case 'Order': return `/empleado/pedidos/${n.entidadId}`;
    case 'InventoryItem': return `/empleado/inventario`;
    case 'SolicitudVentaInstantanea': return `/empleado/venta-rapida`;
    default: return null;
  }
}

export default function EmployeeNotificationsPage() {
  const navigate = useNavigate();
  const {
    notificaciones, noLeidas, cargando,
    totalPaginas, pagina, setPagina,
    marcarLeida, marcarTodasLeidas, eliminar,
  } = useNotifications();

  const grupos = useMemo(() => agruparPorFecha(notificaciones), [notificaciones]);

  const handleClick = async (n: NotificationDto) => {
    if (!n.leida) await marcarLeida(n.id);
    const ruta = resolverRuta(n);
    if (ruta) navigate(ruta);
  };

  if (cargando) {
    return (
      <div className="space-y-4 p-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-white/60 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <FadeIn>
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1e3a5f] dark:bg-blue-600 text-[#eab308] dark:text-blue-100 rounded-xl shadow-lg">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#1e3a5f] dark:text-white">
                Notificaciones
              </h1>
              {noLeidas > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {noLeidas} sin leer
                </p>
              )}
            </div>
          </div>
          {noLeidas > 0 && (
            <button
              onClick={marcarTodasLeidas}
              className="text-[10px] font-black uppercase tracking-widest text-[#1e3a5f] dark:text-blue-400 hover:text-[#eab308] transition-colors flex items-center gap-2 border-b-2 border-transparent hover:border-[#eab308] pb-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          )}
        </header>
      </FadeIn>

      {notificaciones.length === 0 ? (
        <FadeIn>
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white/50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-100 dark:border-white/5">
            <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Inbox className="w-10 h-10 text-slate-200 dark:text-slate-700" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#1e3a5f] dark:text-white mb-2">
              Sin notificaciones
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Cuando haya actividad nueva, aparecerá aquí.
            </p>
          </div>
        </FadeIn>
      ) : (
        <div className="space-y-8">
          {grupos.map(grupo => (
            <section key={grupo.label}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full ${
                  grupo.label === 'Hoy'
                    ? 'text-[#1e3a5f] bg-[#eab308] shadow-md'
                    : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
                }`}>
                  {grupo.label}
                </span>
                <div className="flex-grow h-px bg-slate-100 dark:bg-slate-800" />
              </div>

              <StaggerContainer className="space-y-3">
                {grupo.items.map(n => {
                  const { icon: Icon, bg, text } = ICON_MAP[n.tipo] ?? DEFAULT_ICON;
                  return (
                    <GlassCard
                      key={n.id}
                      className={`p-5 group relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-300 ${
                        n.leida
                          ? 'bg-white/40 dark:bg-slate-900/40 border-slate-50/50 dark:border-slate-800/50 opacity-70'
                          : 'bg-white/95 dark:bg-slate-800/80 border-slate-100 dark:border-white/5 shadow-lg shadow-blue-900/5'
                      }`}
                      onClick={() => handleClick(n)}
                    >
                      {!n.leida && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#eab308] dark:bg-blue-500" />
                      )}
                      <div className="flex gap-4 items-start">
                        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl ${bg} ${text} transition-transform group-hover:scale-110`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-[#1e3a5f] dark:text-white truncate">
                                {n.titulo}
                              </h3>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                {parseApiDate(n.creadaEn)?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                {!n.leida && <span className="inline-block w-1.5 h-1.5 bg-[#eab308] rounded-full ml-2 animate-pulse align-middle" />}
                              </p>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); eliminar(n.id); }}
                              className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                            {n.mensaje}
                          </p>
                          {resolverRuta(n) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#1e3a5f] dark:text-blue-400 mt-3 hover:text-[#eab308] transition-colors">
                              Ver detalle <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </StaggerContainer>
            </section>
          ))}

          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4">
              <button
                onClick={() => setPagina(Math.max(1, pagina - 1))}
                disabled={pagina <= 1}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
                disabled={pagina >= totalPaginas}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
