import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  MoreVertical,
  Map as MapIcon,
  List as ListIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DataService } from '../../services/dataService';
import { useToast } from '../../hooks/useToast';

export default function DailyDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const allOrders = DataService.getOrders();
      const todayDeliveries = allOrders.filter(o => 
        o.status === 'shipped' || o.status === 'pending'
      );
      setDeliveries(todayDeliveries);
    } catch (error) {
      console.error("Error loading deliveries data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const matchesSearch = d.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || 
                           (statusFilter === 'pendiente' && d.status === 'pending') ||
                           (statusFilter === 'en-ruta' && d.status === 'shipped');
      return matchesSearch && matchesStatus;
    });
  }, [deliveries, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: deliveries.length,
      pending: deliveries.filter(d => d.status === 'pending').length,
      enRoute: deliveries.filter(d => d.status === 'shipped').length,
    };
  }, [deliveries]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const success = await DataService.updateOrderStatus(id, newStatus as any);
      if (success) {
        showToast(`Entrega actualizada a ${newStatus === 'delivered' ? 'Entregado' : 'En Ruta'}`, 'success');
        loadData();
      }
    } catch (error) {
      showToast('Error al actualizar la entrega', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 border-4 border-emerald-100 dark:border-emerald-900/30 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Cargando ruta de hoy...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-widest">
            <Truck className="w-4 h-4" />
            <span>Ruta de Distribución</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Entregas de <span className="text-emerald-500">Hoy</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl">
            Gestiona las entregas programadas para hoy y mantén a los clientes informados.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <ListIcon className="w-4 h-4" />
            Lista
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <MapIcon className="w-4 h-4" />
            Mapa
          </button>
        </div>
      </header>

      {/* KPI Stats - Standardized Pattern */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Hoy', value: stats.total, trend: 'Entregas programadas', icon: <Package />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
          { label: 'Pendientes', value: stats.pending, trend: 'Por recolectar', icon: <Clock />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
          { label: 'En Ruta', value: stats.enRoute, trend: 'Distribución activa', icon: <Truck />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-100 dark:border-indigo-500/20' },
        ].map((s, i) => (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            key={i}
            className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5 shadow-sm transition-all group`}
          >
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
              <div className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">{s.value}</div>
              <p className={`text-xs mt-1.5 font-medium ${s.color} opacity-80`}>{s.trend}</p>
            </div>
            {React.cloneElement(s.icon as React.ReactElement, {
              className: `absolute -bottom-4 -right-4 w-24 h-24 ${s.color} opacity-10 group-hover:scale-110 transition-transform`,
              strokeWidth: 3
            })}
          </motion.div>
        ))}
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-4 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Buscar por ID de pedido o cliente..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <select 
              className="pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer min-w-[180px] transition-colors"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en-ruta">En Ruta</option>
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Delivery List */}
      <main className="space-y-6">
        {viewMode === 'list' ? (
          <AnimatePresence mode="popLayout">
            {filteredDeliveries.map((delivery, index) => (
              <motion.div 
                layout
                key={delivery.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-slate-800 rounded-[2rem] border-2 ${delivery.status === 'shipped' ? 'border-emerald-500/20 dark:border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-500/5' : 'border-slate-100 dark:border-slate-700'} shadow-sm hover:shadow-xl transition-all group overflow-hidden`}
              >
                <div className="p-6 flex flex-col lg:flex-row gap-8">
                  {/* Image & Status */}
                  <div className="lg:w-56 h-56 rounded-[1.5rem] bg-slate-100 dark:bg-slate-900 flex-shrink-0 relative overflow-hidden group-hover:shadow-lg transition-all">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      src={delivery.items[0]?.image || `https://picsum.photos/seed/${delivery.id}/400/400`} 
                      alt="Product" 
                    />
                    <div className={`absolute top-4 left-4 px-3 py-1.5 ${delivery.status === 'shipped' ? 'bg-emerald-600' : 'bg-amber-500'} text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg`}>
                      {delivery.status === 'shipped' ? 'En ruta' : 'Pendiente'}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest shadow-sm">
                        #{delivery.id}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Cliente ID: {delivery.customerId}</h2>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Pagado</span>
                            </div>
                            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                            <div className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">
                              {delivery.items.length} Artículos
                            </div>
                          </div>
                        </div>
                        <button className="p-2 text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                          <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-100 dark:border-slate-700">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Destino</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5 leading-tight">Calle Reforma 123, Col. Centro, CP 06000</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors">
                          <div className="p-2 bg-white dark:bg-slate-800 rounded-xl text-amber-600 dark:text-amber-400 shadow-sm border border-slate-100 dark:border-slate-700">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Horario</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5 leading-tight">10:00 AM - 12:00 PM</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4">
                      <button 
                        onClick={() => handleStatusUpdate(delivery.id, 'shipped')}
                        disabled={delivery.status === 'shipped'}
                        className={`flex-1 min-w-[140px] flex items-center justify-center h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${delivery.status === 'shipped' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 pointer-events-none' : 'bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 dark:hover:bg-emerald-500 shadow-lg shadow-slate-200 dark:shadow-none active:scale-95'}`}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        En ruta
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                        className="flex-1 min-w-[140px] flex items-center justify-center h-14 bg-emerald-600 dark:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Entregado
                      </button>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all">
                          <Phone className="w-5 h-5" />
                        </button>
                        <button className="flex-1 sm:flex-none w-14 h-14 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all">
                          <AlertTriangle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm h-[500px] flex items-center justify-center relative overflow-hidden transition-colors">
            <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 opacity-50">
              <div className="w-full h-full flex flex-wrap gap-4 p-8">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-32 h-32 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"></div>
                ))}
              </div>
            </div>
            <div className="relative z-10 text-center space-y-4 max-w-sm px-6">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-100 dark:shadow-none">
                <Navigation className="w-10 h-10 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Mapa de Ruta</h3>
              <p className="text-slate-500 dark:text-slate-400">La visualización de mapa interactivo está siendo optimizada para tu dispositivo.</p>
              <button 
                onClick={() => setViewMode('list')}
                className="px-8 py-3 bg-slate-900 dark:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-lg"
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
            className="py-24 flex flex-col items-center justify-center text-center space-y-6 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[3rem] transition-colors"
          >
            <div className="w-28 h-28 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 relative">
              <CheckCircle size={56} />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute inset-0 bg-emerald-500 rounded-full"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">¡Ruta Completada!</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium">No tienes entregas pendientes para hoy en este filtro. ¡Buen trabajo!</p>
            </div>
            <button 
              onClick={() => setStatusFilter('todos')} 
              className="px-8 py-3 bg-emerald-600 dark:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
            >
              Ver todas las entregas
            </button>
          </motion.div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] gap-4 transition-colors">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>GPS Activo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{filteredDeliveries.length} Paradas</span>
          </div>
        </div>
        <p>© 2024 Florería Bautista • Panel de Distribución</p>
      </footer>
    </div>
  );
}
