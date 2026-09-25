import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  Loader2,
  CheckCircle2,
  Truck,
  ShoppingBag,
  Clock3,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { Order } from '../../types';
import { useToast } from '../../hooks/useToast';
import { parseApiDate } from '../../utils/date';
import { estadoPedido, ESTADO_PEDIDO, ESTADOS_PEDIDO } from '../../utils/labels';
import AvisoAlcanceEmpleado from '../../components/AvisoAlcanceEmpleado';
import { useDatasetEnMemoria } from '../../hooks/useDatasetEnMemoria';

// Estados reales del backend (ver Transiciones en Backend/Services/OrderService.cs).
// Etiqueta y color salen de utils/labels.ts; esta vista usa los tonos fuertes
// porque las tarjetas van sobre fondo de color.

// Siguiente estado permitido segun la maquina de estados del backend
const SIGUIENTE_ESTADO: Record<string, string | null> = {
  PENDIENTE_VALIDACION: 'EN_PREPARACION',
  EN_PREPARACION:       'EN_RUTA',
  EN_RUTA:              'ENTREGADO',
  ENTREGADO:            null,
};

const ESTADOS_FINALIZADOS = ['ENTREGADO', 'CANCELADO', 'NO_COMPLETADO'];

const datasetConfig = {
  cargarTodo: async () => {
    const res = await AdminService.getAdminOrders({ size: 500 });
    return { items: res.data.items, sincronizadoEn: new Date().toISOString() };
  },
  cargarDelta: AdminService.getOrdersDelta,
  getId: (o: Order) => o.id,
};

function estiloDe(estado: string) {
  const ui = estadoPedido(estado);
  return { label: ui.label, color: ui.text, bg: ui.bgFuerte, border: ui.borderFuerte };
}

export default function OrdersPage() {
  const { datos: orders, cargando: loading, error, recargarCompleto, aplicarParche } = useDatasetEnMemoria(datasetConfig);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState('ACTIVOS');

  const loadData = useCallback(() => recargarCompleto(), [recargarCompleto]);

  // Paso 1: el boton solo abre el modal de confirmacion (evita avances accidentales)
  const requestStatusChange = (order: Order) => {
    const siguiente = SIGUIENTE_ESTADO[order.estadoPedido];
    if (!siguiente) {
      showToast('Este pedido no tiene más avances disponibles.', 'error');
      return;
    }
    setConfirmOrder(order);
  };

  // Paso 2: se ejecuta solo tras confirmar en el modal
  const confirmStatusChange = async () => {
    if (!confirmOrder) return;
    const order = confirmOrder;
    const siguiente = SIGUIENTE_ESTADO[order.estadoPedido];
    if (!siguiente) {
      setConfirmOrder(null);
      return;
    }

    setUpdatingStatus(order.id);
    setConfirmOrder(null);
    try {
      await AdminService.updateAdminOrderStatus(order.id, siguiente);
      showToast(`Pedido actualizado a ${estiloDe(siguiente).label}`, 'success');
      aplicarParche({ ...order, estadoPedido: siguiente });
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar el pedido', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      statusFilter === 'Todos' ? true :
      statusFilter === 'ACTIVOS' ? !ESTADOS_FINALIZADOS.includes(order.estadoPedido) :
      order.estadoPedido === statusFilter
    );
  }, [orders, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.estadoPedido === 'PENDIENTE_VALIDACION').length,
    enRuta: orders.filter(o => o.estadoPedido === 'EN_RUTA').length,
    delivered: orders.filter(o => o.estadoPedido === 'ENTREGADO').length,
  }), [orders]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 dark:border-white/5 border-t-[#1e3a5f] rounded-full animate-spin"></div>
          <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1e3a5f] w-6 h-6" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-serif italic animate-pulse">Sincronizando bitácora...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <p className="text-slate-500 dark:text-slate-400 font-bold">{error}</p>
        <button onClick={loadData} className="px-6 py-2 bg-[#1e3a5f] text-white font-bold rounded-xl">Cargar de nuevo</button>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-6 max-w-[1500px] mx-auto px-4 py-2">
      <AvisoAlcanceEmpleado recurso="pedidos" />
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tight">
            Gestión de <span className="text-[#eab308] italic">Pedidos</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium italic">"Seguimiento y control operativo."</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-slate-100 rounded-xl text-[#1e3a5f] hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-blue-50 text-[#1e3a5f] px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">En Línea</span>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total', value: stats.total, icon: <ShoppingBag />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-100 dark:border-blue-800' },
          { label: 'Pendientes', value: stats.pending, icon: <Clock3 />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-100 dark:border-amber-800' },
          { label: ESTADO_PEDIDO.EN_RUTA.label, value: stats.enRuta, icon: <Truck />, color: 'text-[#1e3a5f] dark:text-blue-400', bg: 'bg-slate-100 dark:bg-slate-900/30', border: 'border-slate-200 dark:border-slate-800' },
          { label: 'Entregados', value: stats.delivered, icon: <CheckCircle2 />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800' },
        ].map((s, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i}
            className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-6 group shadow-sm`}
          >
            <div className="relative z-10">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</p>
              <div className="mt-1 text-xl font-serif font-bold text-[#1e3a5f] dark:text-white leading-none">{s.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-md p-4 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col lg:flex-row gap-4 transition-colors">
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <select
              className="pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-[#1e3a5f] text-[11px] font-black uppercase tracking-[0.2em] text-[#1e3a5f] dark:text-slate-300 appearance-none cursor-pointer min-w-[200px] transition-colors shadow-inner"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ACTIVOS">Activos</option>
              <option value="Todos">Todos los Estados</option>
              {ESTADOS_PEDIDO.filter(e => e !== 'PENDIENTE_ANULACION').map(e => (
                <option key={e} value={e}>{ESTADO_PEDIDO[e].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List/Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order, idx) => {
            const estilo = estiloDe(order.estadoPedido);
            const siguiente = SIGUIENTE_ESTADO[order.estadoPedido];
            return (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white/95 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:border-blue-500/20 transition-all group flex flex-col overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />

                {/* Card Header */}
                <div className="p-4 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1e3a5f] dark:bg-blue-600 flex items-center justify-center text-white font-serif font-bold text-base shadow-lg shadow-blue-900/20">
                      {(order.nombreCliente || 'C').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">FOLIO: {order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm font-bold text-[#1e3a5f] dark:text-white mt-0.5">{new Date(order.fechaCreacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</p>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${estilo.bg} ${estilo.color} ${estilo.border}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    {estilo.label}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 space-y-4 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#1e3a5f] dark:text-white group-hover:text-blue-600 transition-colors leading-tight">
                        {order.nombreCliente || 'Cliente sin nombre'}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-widest mt-2 leading-none">
                        <MapPin className="w-3.5 h-3.5 text-[#eab308]" />
                        <span className="truncate max-w-[180px]">Entrega: {parseApiDate(order.fechaEntrega)?.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Total</p>
                      <p className="text-xl font-serif font-bold text-[#1e3a5f] dark:text-blue-400 leading-none mt-1">${order.total.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 font-black uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2 text-slate-400 border-r border-slate-100 dark:border-white/5 pr-4">
                      <Clock className="w-4 h-4 text-[#eab308]" />
                      <span>ENTREGA: <span className="text-[#1e3a5f] dark:text-white">{parseApiDate(order.fechaEntrega)?.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span></span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-50 dark:border-white/5 flex gap-3 transition-colors">
                  <Link
                    to={`/empleado/pedidos/${order.id}`}
                    className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-[#1e3a5f] dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#1e3a5f] hover:text-white transition-all text-center flex items-center justify-center gap-2 shadow-sm"
                  >
                    Documentación
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => requestStatusChange(order)}
                    disabled={updatingStatus === order.id || !siguiente}
                    className="flex-1 py-3 bg-[#1e3a5f] dark:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#eab308] hover:text-[#1e3a5f] transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updatingStatus === order.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                    )}
                    {updatingStatus === order.id ? 'SINC...' : siguiente ? estiloDe(siguiente).label.toUpperCase() : 'SIN AVANCE'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/50 dark:bg-slate-800/30 backdrop-blur-md border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[4rem] transition-colors"
        >
          <div className="w-28 h-28 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-8 relative shadow-2xl">
            <Search className="w-12 h-12 text-[#1e3a5f]/20" />
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-[#eab308] rounded-full border-4 border-white dark:border-slate-800 shadow-lg"
            />
          </div>
          <h3 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white">Sin Pedidos</h3>
          <p className="text-slate-500 mt-3 max-w-xs mx-auto font-medium italic">
            "No hay pedidos en este estado."
          </p>
          <button
            onClick={() => setStatusFilter('ACTIVOS')}
            className="mt-10 px-10 py-4 bg-[#1e3a5f] dark:bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-[#eab308] hover:text-[#1e3a5f] transition-all shadow-2xl shadow-blue-900/20"
          >
            Restaurar Bitácora
          </button>
        </motion.div>
      )}

      {/* Corporate Footer */}
      <footer className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-slate-100 dark:border-white/5 text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] gap-6 transition-colors">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
            <span>Bitácora Sincronizada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#eab308] rounded-full shadow-lg shadow-amber-500/50"></div>
            <span>{filteredOrders.length} Registros Cargados</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span>© 2026 FB</span>
          <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
          <span className="text-[#1e3a5f] dark:text-blue-400/40">Logística Central</span>
        </div>
      </footer>

      {/* Modal de confirmación de cambio de estado (portal a document.body) */}
      {createPortal(
        <AnimatePresence>
          {confirmOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmOrder(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/5 w-full max-w-md overflow-hidden"
              >
                <div className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                    <RefreshCw className="w-7 h-7 text-amber-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif font-bold text-[#1e3a5f] dark:text-white">Confirmar avance de estado</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      El pedido de <span className="font-bold text-[#1e3a5f] dark:text-white">{confirmOrder.nombreCliente || 'Cliente'}</span> pasará de{' '}
                      <span className="font-bold">{estiloDe(confirmOrder.estadoPedido).label}</span> a{' '}
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{estiloDe(SIGUIENTE_ESTADO[confirmOrder.estadoPedido] ?? '').label}</span>.
                    </p>
                    <p className="text-[12px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black pt-1">Esta acción no se puede revertir</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-white/5 flex gap-3">
                  <button
                    onClick={() => setConfirmOrder(null)}
                    className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmStatusChange}
                    className="flex-1 py-3 bg-[#1e3a5f] dark:bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-[#eab308] hover:text-[#1e3a5f] transition-all shadow-xl shadow-blue-900/10"
                  >
                    Sí, avanzar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
