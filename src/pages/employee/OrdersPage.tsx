import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Package, 
  Clock, 
  MapPin, 
  Loader2,
  CheckCircle2,
  Truck,
  ShoppingBag,
  Clock3,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { DataService } from '../../services/dataService';
import { useToast } from '../../hooks/useToast';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { showToast } = useToast();
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const loadData = () => {
    setLoading(true);
    try {
      const allOrders = DataService.getOrders();
      const allUsers = DataService.getUsers();
      setOrders([...allOrders]);
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading orders data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCustomerName = (customerId: string) => {
    const user = users.find(u => u.id === customerId);
    return user ? user.name : 'Cliente Desconocido';
  };

  const handleStatusChange = async (orderId: string, currentStatus: string) => {
    const statusFlow: Record<string, any> = {
      'pending': 'shipped',
      'shipped': 'delivered',
      'delivered': 'pending',
      'cancelled': 'pending'
    };

    const nextStatus = statusFlow[currentStatus] || 'pending';
    
    setUpdatingStatus(orderId);
    try {
      const success = await DataService.updateOrderStatus(orderId, nextStatus);
      if (success) {
        showToast(`Pedido actualizado a ${getStatusLabel(nextStatus)}`, 'success');
        setOrders([...DataService.getOrders()]);
        
        await DataService.addAuditLog({
          action: 'update_order_status',
          details: `Pedido ${orderId} cambiado de ${currentStatus} a ${nextStatus}`,
          userId: 'staff-1'
        });
      } else {
        showToast('Error al actualizar el pedido', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const customerName = getCustomerName(order.customerId);
      const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            order.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter, users]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length
    };
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Entregado';
      case 'pending': return 'Pendiente';
      case 'shipped': return 'En Ruta';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

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

  return (
    <div className="w-full h-full space-y-6 max-w-[1500px] mx-auto px-4 py-2">
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
            <span className="text-[9px] font-black uppercase tracking-widest">En Línea</span>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total', value: stats.total, icon: <ShoppingBag />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Pendientes', value: stats.pending, icon: <Clock3 />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'En Ruta', value: stats.shipped, icon: <Truck />, color: 'text-[#1e3a5f]', bg: 'bg-slate-100', border: 'border-slate-200' },
          { label: 'Entregados', value: stats.delivered, icon: <CheckCircle2 />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        ].map((s, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i}
            className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-6 group shadow-sm`}
          >
            <div className="relative z-10">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <div className="mt-1 text-xl font-serif font-bold text-[#1e3a5f] leading-none">{s.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-md p-4 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col lg:flex-row gap-4 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Buscar por folio o nombre de cliente..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-[#1e3a5f] text-[#1e3a5f] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <select 
              className="pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-[#1e3a5f] text-[10px] font-black uppercase tracking-[0.2em] text-[#1e3a5f] dark:text-slate-300 appearance-none cursor-pointer min-w-[200px] transition-colors shadow-inner"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Todos los Estados</option>
              <option value="pending">Pendientes</option>
              <option value="shipped">En Ruta</option>
              <option value="delivered">Entregados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List/Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order, idx) => (
            <motion.div
              layout
              key={order.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/95 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:border-blue-500/20 transition-all group flex flex-col overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
              
              {/* Card Header */}
              <div className="p-4 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1e3a5f] dark:bg-blue-600 flex items-center justify-center text-white font-serif font-bold text-base shadow-lg shadow-blue-900/20">
                    {order.id.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">FOLIO: {order.id}</p>
                    <p className="text-sm font-bold text-[#1e3a5f] dark:text-white mt-0.5">{new Date(order.date || Date.now()).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${getStatusColor(order.status)}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  {getStatusLabel(order.status)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 space-y-4 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#1e3a5f] dark:text-white group-hover:text-blue-600 transition-colors leading-tight">
                      {getCustomerName(order.customerId)}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 leading-none">
                      <MapPin className="w-3.5 h-3.5 text-[#eab308]" />
                      <span className="truncate max-w-[180px]">Calle Reforma, Distrito Centro</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Inversión</p>
                    <p className="text-xl font-serif font-bold text-[#1e3a5f] dark:text-blue-400 leading-none mt-1">${order.total.toFixed(2)}</p>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-4 flex items-center gap-4 overflow-x-auto custom-scrollbar border border-slate-100 dark:border-white/5">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="relative flex-shrink-0 group/item transition-transform hover:scale-110">
                      <img 
                        src={item.image || `https://picsum.photos/seed/${item.id}/150/150`} 
                        alt={item.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                      />
                      <span className="absolute -top-2 -right-2 bg-[#eab308] text-[#1e3a5f] text-[10px] font-black w-6 h-6 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800">
                        {item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-black border-2 border-dashed border-slate-200 dark:border-white/5">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] pt-2 font-black uppercase tracking-[0.2em]">
                  <div className="flex items-center gap-2 text-slate-400 border-r border-slate-100 dark:border-white/5 pr-4">
                    <Clock className="w-4 h-4 text-[#eab308]" />
                    <span>ENTREGA: <span className="text-[#1e3a5f] dark:text-white">HOY</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 pl-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span>Líquidado</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-50 dark:border-white/5 flex gap-3 transition-colors">
                <Link 
                  to={`/empleado/pedidos/${order.id}`}
                  className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-[#1e3a5f] dark:text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#1e3a5f] hover:text-white transition-all text-center flex items-center justify-center gap-2 shadow-sm"
                >
                  Documentación
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button 
                  onClick={() => handleStatusChange(order.id, order.status)}
                  disabled={updatingStatus === order.id}
                  className="flex-1 py-3 bg-[#1e3a5f] dark:bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#eab308] hover:text-[#1e3a5f] transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updatingStatus === order.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                  )}
                  {updatingStatus === order.id ? 'SINC...' : 'FLUJO'}
                </button>
              </div>
            </motion.div>
          ))}
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
          <h3 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white">Sin Coincidencias</h3>
          <p className="text-slate-500 mt-3 max-w-xs mx-auto font-medium italic">
            "No encontramos el folio o cliente que buscas."
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('Todos'); }}
            className="mt-10 px-10 py-4 bg-[#1e3a5f] dark:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-[#eab308] hover:text-[#1e3a5f] transition-all shadow-2xl shadow-blue-900/20"
          >
            Restaurar Bitácora
          </button>
        </motion.div>
      )}

      {/* Corporate Footer */}
      <footer className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-slate-100 dark:border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] gap-6 transition-colors">
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
            <span>© 2024 FB</span>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            <span className="text-[#1e3a5f] dark:text-blue-400/40">Logística Central</span>
        </div>
      </footer>
    </div>
  );
}
