import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Navigation,
  Search,
  Filter,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  MoreVertical,
  Map as MapIcon,
  List as ListIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { OrderDetail } from '../../types';
import { useToast } from '../../hooks/useToast';

// Estados de una entrega dentro de la maquina de estados del backend
// (ver Transiciones en Backend/Services/OrderService.cs)
const ESTADOS_ENTREGA = ['EN_PREPARACION', 'EN_RUTA'] as const;

// Siguiente estado permitido segun la logistica de despacho
const SIGUIENTE_ESTADO: Record<string, string | null> = {
  EN_PREPARACION: 'EN_RUTA',
  EN_RUTA:        'ENTREGADO',
};

const LABEL_ESTADO: Record<string, string> = {
  EN_PREPARACION: 'En Preparación',
  EN_RUTA:        'En Ruta',
  ENTREGADO:      'Entregado',
};

function formatDireccion(d?: OrderDetail['direccion']): string {
  if (!d) return 'Entrega en tienda / Sin domicilio';
  return [d.calle, d.colonia, d.municipio, d.estado, d.cp ? `C.P. ${d.cp}` : null]
    .filter(Boolean)
    .join(', ');
}

function formatHora(order: OrderDetail): string {
  const fecha = order.fechaEntrega
    ? new Date(order.fechaEntrega).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    : '';
  const hora = order.horaEntrega ? order.horaEntrega.slice(0, 5) : null;
  return hora ? `${fecha} · ${hora}` : (fecha || 'Sin horario definido');
}

export default function DailyDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'EN_PREPARACION' | 'EN_RUTA'>('todos');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Listado de pedidos (visualizacion) desde el backend real
      const res = await AdminService.getAdminOrders({ size: 100 });
      const enEntrega = res.data.items.filter(o =>
        (ESTADOS_ENTREGA as readonly string[]).includes(o.estadoPedido)
      );

      // 2. Enriquecer cada entrega con su detalle (direccion, items, telefono, hora)
      const detalladas = await Promise.all(
        enEntrega.map(async (o) => {
          try {
            const detalle = await AdminService.getAdminOrderById(o.id);
            return detalle.data;
          } catch {
            // Si falla el detalle, conservamos al menos el resumen
            return o as OrderDetail;
          }
        })
      );

      setDeliveries(detalladas);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las entregas del día');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        d.id.toLowerCase().includes(term) ||
        (d.nombreCliente ?? '').toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'todos' || d.estadoPedido === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [deliveries, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: deliveries.length,
      pending: deliveries.filter(d => d.estadoPedido === 'EN_PREPARACION').length,
      enRoute: deliveries.filter(d => d.estadoPedido === 'EN_RUTA').length,
    };
  }, [deliveries]);

  const handleStatusUpdate = async (order: OrderDetail) => {
    const siguiente = SIGUIENTE_ESTADO[order.estadoPedido];
    if (!siguiente) {
      showToast('Esta entrega no tiene más avances disponibles.', 'error');
      return;
    }

    setUpdatingId(order.id);
    try {
      // Consumo: avanzar el estado del pedido en el backend real
      await AdminService.updateAdminOrderStatus(order.id, siguiente);
      showToast(`Entrega actualizada a ${LABEL_ESTADO[siguiente] ?? siguiente}`, 'success');

      setDeliveries(prev =>
        siguiente === 'ENTREGADO'
          // Al finalizar, el pedido sale de la ruta de hoy
          ? prev.filter(d => d.id !== order.id)
          : prev.map(d => d.id === order.id ? { ...d, estadoPedido: siguiente } : d)
      );
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar la entrega', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-slate-100 dark:border-white/5 border-t-[#1e3a5f] rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 font-serif italic animate-pulse">Calculando ruta óptima...</p>
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
    <div className="max-w-[1500px] mx-auto px-4 py-2 space-y-4">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div className="space-y-0.5">
          <h1 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tight">
            Ruta de <span className="text-[#eab308] italic">Hoy</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium italic">"Eficiencia en cada entrega."</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl text-[#1e3a5f] dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/40 backdrop-blur-md p-1 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm transition-colors">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-[#1e3a5f] text-white' : 'text-slate-400'}`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-[#1e3a5f] text-white' : 'text-slate-400'}`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              Mapa
            </button>
          </div>
        </div>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: <Package />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-100 dark:border-blue-800' },
          { label: 'Por Salir', value: stats.pending, icon: <Clock />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-100 dark:border-amber-800' },
          { label: 'En Ruta', value: stats.enRoute, icon: <Truck />, color: 'text-[#1e3a5f] dark:text-blue-400', bg: 'bg-slate-100 dark:bg-slate-900/30', border: 'border-slate-200 dark:border-slate-800' },
        ].map((s, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i}
            className={`relative overflow-hidden rounded-xl border ${s.border} ${s.bg} p-4 group`}
          >
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</p>
              <div className="mt-1 text-xl font-serif font-bold text-[#1e3a5f] dark:text-white leading-none">{s.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters Section */}
      <div className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-md p-4 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col lg:flex-row gap-4 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por folio o cliente..."
            className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-[#1e3a5f] text-[#1e3a5f] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <select
              className="pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-[#1e3a5f] text-[10px] font-black uppercase tracking-[0.2em] text-[#1e3a5f] dark:text-slate-300 appearance-none cursor-pointer min-w-[200px] transition-colors shadow-inner"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="todos">Todos los Estados</option>
              <option value="EN_PREPARACION">Por Salir</option>
              <option value="EN_RUTA">En Ruta</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delivery List */}
      <main className="space-y-4">
        {viewMode === 'list' ? (
          <AnimatePresence mode="popLayout">
            {filteredDeliveries.map((delivery, index) => {
              const enRuta = delivery.estadoPedido === 'EN_RUTA';
              const siguiente = SIGUIENTE_ESTADO[delivery.estadoPedido];
              const isUpdating = updatingId === delivery.id;
              return (
                <motion.div
                layout
                key={delivery.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white/95 dark:bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] border-2 ${enRuta ? 'border-[#1e3a5f]/20 bg-blue-50/10' : 'border-slate-50 dark:border-white/5'} shadow-sm hover:shadow-2xl hover:border-blue-500/20 transition-all group overflow-hidden relative`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />

                <div className="p-4 flex flex-col lg:flex-row gap-6 relative z-10">
                  {/* Avatar & Status */}
                  <div className="lg:w-32 h-32 rounded-2xl bg-[#1e3a5f] dark:bg-slate-900 flex-shrink-0 relative overflow-hidden shadow-inner group-hover:shadow-xl transition-all flex items-center justify-center">
                    <span className="text-5xl font-serif font-bold text-white/90">
                      {(delivery.nombreCliente || 'C').slice(0, 1).toUpperCase()}
                    </span>
                    <div className={`absolute top-3 left-3 px-3 py-1 ${enRuta ? 'bg-[#1e3a5f]' : 'bg-[#eab308]'} text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg border border-white/20`}>
                      {enRuta ? 'En ruta' : 'Por salir'}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-1">FOLIO: {delivery.id.slice(0, 8).toUpperCase()}</p>
                          <h2 className="text-xl font-serif font-bold text-[#1e3a5f] dark:text-white group-hover:text-blue-600 transition-colors leading-tight">{delivery.nombreCliente || 'Cliente sin nombre'}</h2>
                          <div className="flex items-center gap-3 mt-2">
                            <div className={`flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest ${delivery.saldoPendiente > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{delivery.saldoPendiente > 0 ? `Saldo $${delivery.saldoPendiente.toLocaleString()}` : 'Liquidado'}</span>
                            </div>
                            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                            <div className="text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase tracking-widest">
                              {delivery.items?.length ?? 0} Artículos · ${delivery.total.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <button className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 text-slate-400 hover:text-[#1e3a5f] transition-all shadow-sm">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-start gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all">
                          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-[#1e3a5f] shadow-md border border-slate-50">
                            <MapPin className="w-5 h-5 text-[#eab308]" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Destino de Entrega</p>
                            <p className="text-[11px] font-bold text-[#1e3a5f] dark:text-slate-300 mt-1 leading-tight">{formatDireccion(delivery.direccion)}</p>
                            {delivery.direccion?.referencias && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-tight italic">Ref: {delivery.direccion.referencias}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all">
                          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl text-amber-600 shadow-md border border-slate-50">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fecha / Hora de Entrega</p>
                            <p className="text-sm font-bold text-[#1e3a5f] dark:text-slate-300 mt-1 leading-snug">{formatHora(delivery)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => handleStatusUpdate(delivery)}
                        disabled={enRuta || isUpdating || !siguiente}
                        className={`flex-1 min-w-[120px] flex items-center justify-center h-10 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all border ${enRuta ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-900 dark:text-slate-600 dark:border-slate-700' : 'bg-[#1e3a5f] text-white hover:bg-[#eab308] hover:text-[#1e3a5f] shadow-xl shadow-blue-900/10 active:scale-95'}`}
                      >
                        {isUpdating && !enRuta ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Truck className="w-3.5 h-3.5 mr-2" />}
                        {enRuta ? 'En ruta' : 'Iniciar Ruta'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(delivery)}
                        disabled={!enRuta || isUpdating}
                        className="flex-1 min-w-[120px] flex items-center justify-center h-10 bg-white dark:bg-slate-800 border-[1.5px] border-[#1e3a5f] dark:border-blue-500/40 text-[#1e3a5f] dark:text-blue-400 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-[#1e3a5f] hover:text-white transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:text-[#1e3a5f] dark:disabled:hover:text-blue-400"
                      >
                        {isUpdating && enRuta ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-2" />}
                        Finalizar Entrega
                      </button>
                      <div className="flex gap-1.5 w-full sm:w-auto">
                        <a
                          href={delivery.telefonoCliente ? `tel:${delivery.telefonoCliente}` : undefined}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${delivery.telefonoCliente ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600 pointer-events-none'}`}
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <button className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="bg-white/50 dark:bg-slate-800/20 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-white/5 h-[500px] flex items-center justify-center relative overflow-hidden transition-colors">
            <div className="relative z-10 text-center space-y-5 max-w-sm px-8">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 text-[#1e3a5f] rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border border-slate-50">
                <Navigation className="w-10 h-10 animate-pulse text-[#eab308]" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white">Mapa de Ruta</h3>
              <p className="text-slate-500 font-medium italic">"Trazando el camino más corto hacia la satisfacción del cliente."</p>
              <button
                onClick={() => setViewMode('list')}
                className="px-10 py-4 bg-[#1e3a5f] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-[#eab308] hover:text-[#1e3a5f] transition-all shadow-2xl shadow-blue-900/20"
              >
                Volver a Lista
              </button>
            </div>
          </div>
        )}

        {filteredDeliveries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 flex flex-col items-center justify-center text-center space-y-8 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[4rem] transition-colors"
          >
            <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[3rem] flex items-center justify-center text-[#1e3a5f] relative shadow-2xl">
              <CheckCircle size={64} className="text-emerald-500" />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute inset-0 bg-emerald-500 rounded-full"
              />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white">¡Ruta Completada!</h2>
              <p className="text-slate-500 max-w-xs mx-auto font-medium italic">"Todas nuestras flores han encontrado su hogar hoy."</p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Corporate Footer */}
      <footer className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-slate-100 dark:border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] gap-6 transition-colors">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
            <span>GPS Sincronizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#eab308] rounded-full shadow-lg shadow-amber-500/50"></div>
            <span>{filteredDeliveries.length} Puntos de Entrega</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <span>© 2026 FB</span>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            <span className="text-[#1e3a5f] dark:text-blue-400/40">Logística de Despacho</span>
        </div>
      </footer>
    </div>
  );
}
