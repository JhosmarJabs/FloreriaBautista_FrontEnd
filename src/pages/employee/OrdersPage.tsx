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
          <div className="w-16 h-16 border-4 border-emerald-100 dark:border-emerald-900/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2">
            <Package className="w-4 h-4" />
            <span>Gestión de Logística</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Pedidos <span className="text-emerald-500">Recientes</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
            Administra y realiza el seguimiento de todos los pedidos de la florería en tiempo real.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-800">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold">Sistema Activo</span>
          </div>
        </div>
      </div>

      {/* KPI Stats - Standardized Pattern */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pedidos', value: stats.total, trend: 'Sincronizado', icon: <ShoppingBag />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
          { label: 'Pendientes', value: stats.pending, trend: 'Por atender', icon: <Clock3 />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
          { label: 'En Ruta', value: stats.shipped, trend: 'Logística activa', icon: <Truck />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-100 dark:border-indigo-500/20' },
          { label: 'Entregados', value: stats.delivered, trend: 'Completados', icon: <CheckCircle2 />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
        ].map((s, i) => (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            key={i}
            className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5 transition-all group`}
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

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-4 transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Buscar por ID de pedido o nombre de cliente..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <select 
              className="pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer min-w-[180px] transition-colors"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order, idx) => (
            <motion.div
              layout
              key={order.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group flex flex-col overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    {order.id.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID: {order.id}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{new Date(order.date || Date.now()).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full border ${getStatusColor(order.status)} text-[10px] font-black uppercase tracking-tighter`}>
                  {getStatusLabel(order.status)}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {getCustomerName(order.customerId)}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">Calle Reforma 123...</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Total</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">${order.total.toFixed(2)}</p>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex items-center gap-2 overflow-x-auto hide-scrollbar">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img 
                        src={item.image || `https://picsum.photos/seed/${item.id}/100/100`} 
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border border-white dark:border-slate-800 shadow-sm"
                      />
                      <span className="absolute -top-1 -right-1 bg-slate-900 dark:bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-bold border border-white dark:border-slate-800">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm pt-2">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>Entrega: <span className="text-slate-900 dark:text-slate-200 font-bold">14:30 PM</span></span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pagado</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-700 flex gap-3 transition-colors">
                <Link 
                  to={`/empleado/pedidos/${order.id}`}
                  className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center flex items-center justify-center gap-2"
                >
                  Detalles
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <button 
                  onClick={() => handleStatusChange(order.id, order.status)}
                  disabled={updatingStatus === order.id}
                  className="flex-1 py-2.5 bg-emerald-600 dark:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updatingStatus === order.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  {updatingStatus === order.id ? '...' : 'Estado'}
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
          className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] transition-colors"
        >
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mb-6 relative">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-800"
            />
          </div>
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">No se encontraron pedidos</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
            No hay resultados para "{searchTerm}" con el filtro seleccionado.
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setStatusFilter('Todos'); }}
            className="mt-8 px-8 py-3 bg-emerald-600 dark:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 dark:shadow-none"
          >
            Ver todos los pedidos
          </button>
        </motion.div>
      )}

      {/* Footer Info */}
      <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Sincronizado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{filteredOrders.length} Resultados</span>
          </div>
        </div>
        <p>© 2024 Florería Bautista • Panel Logístico</p>
      </div>
    </div>
  );
}
