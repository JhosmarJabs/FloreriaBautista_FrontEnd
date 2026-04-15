import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBasket, 
  Clock, 
  ChevronRight, 
  PlusCircle, 
  ClipboardList, 
  RefreshCw,
  Lightbulb,
  Scan,
  Package,
  DollarSign,
  ArrowUpRight,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { DataService } from '../../services/dataService';

export default function EmployeeDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    try {
      const allOrders = DataService.getOrders();
      const allProducts = DataService.getProducts();
      setOrders(allOrders);
      setProducts(allProducts);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => (o.date || '').includes(today));
    const lowStock = products.filter(p => (p.stock || p.stockActual) < 10).length;
    
    return {
      todayCount: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      pendingCount: orders.filter(o => o.status === 'pending').length,
      lowStockCount: lowStock
    };
  }, [orders, products]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-100 dark:border-emerald-900/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <RefreshCw className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Sincronizando panel...</p>
      </div>
    );
  }

  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest transition-colors">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">
            ¡Hola, <span className="text-emerald-500">Equipo</span>!
          </h1>
          <p className="text-slate-400 dark:text-slate-500 text-lg mt-1 transition-colors">Bienvenido al centro de operaciones. Aquí tienes el pulso de la tienda hoy.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm group"
          >
            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <button className="bg-slate-900 dark:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-slate-200 dark:shadow-none">
            <Bell className="w-5 h-5" />
            Notificaciones
          </button>
        </div>
      </div>

      {/* KPI Stats - Standardized Pattern */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas Hoy', value: stats.todayCount, trend: '+12% vs ayer', icon: <ShoppingBasket />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
          { label: 'Ingresos Hoy', value: `$${stats.todayRevenue.toFixed(0)}`, trend: 'Promedio estable', icon: <DollarSign />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
          { label: 'Pendientes', value: stats.pendingCount, trend: 'En espera', icon: <Clock />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
          { label: 'Stock Bajo', value: stats.lowStockCount, trend: stats.lowStockCount > 0 ? 'Reponer pronto' : 'Todo al día', icon: <Package />, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20' },
        ].map((s, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5 shadow-sm hover:shadow-md transition-all group`}
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
      </section>

      {/* Main Content: Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Priority Orders */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white transition-colors">Pedidos Prioritarios</h2>
            </div>
            <Link to="/empleado/pedidos" className="group flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:opacity-80 transition-all">
              Ver todos
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {orders.slice(0, 4).map((order) => (
                <motion.div 
                  key={order.id}
                  variants={itemVariants}
                  className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-4 items-center hover:shadow-xl hover:border-emerald-500/30 transition-all group"
                >
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 shrink-0 overflow-hidden relative">
                    <img 
                      src={order.items[0]?.image || `https://picsum.photos/seed/${order.id}/200/200`} 
                      alt="Order Item" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/5 dark:bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  </div>
                  <div className="flex-grow space-y-2 w-full text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">#{order.id}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        order.status === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                        {order.status === 'pending' ? 'Pendiente' : 'Completado'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">Pedido General</h3>
                      <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5 transition-colors">Total: <span className="text-emerald-600 dark:text-emerald-400">${order.total.toFixed(2)}</span></p>
                    </div>
                  </div>
                  <div className="shrink-0 w-full sm:w-auto">
                    <Link to={`/empleado/pedidos/${order.id}`} className="w-full sm:w-14 h-14 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 group-hover:bg-emerald-600 group-hover:text-white rounded-2xl transition-all flex items-center justify-center">
                      <ChevronRight className="w-6 h-6" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Column: Quick Actions & Tips */}
        <section className="lg:col-span-4 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white transition-colors">Acciones</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <Link to="/empleado/venta-rapida" className="bg-slate-900 dark:bg-slate-800 p-6 rounded-[2rem] text-white flex items-center justify-between group hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-none">Venta Rápida</p>
                    <p className="text-white/50 text-xs mt-1">Nueva orden de mostrador</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
              </Link>
              
              <div className="grid grid-cols-2 gap-4">
                <Link to="/empleado/inventario" className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center gap-3 text-center hover:border-emerald-500 hover:shadow-lg transition-all group overflow-hidden relative">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all z-10">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors z-10">Inventario</span>
                </Link>
                
                <Link to="/empleado/pedidos" className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center gap-3 text-center hover:border-emerald-500 hover:shadow-lg transition-all group overflow-hidden relative">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all z-10">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors z-10">Logística</span>
                </Link>
              </div>

              <button className="w-full bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-between group hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm transition-colors">
                    <Scan className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900 dark:text-white leading-none transition-colors">Escanear Ticket</p>
                    <p className="text-emerald-700/60 dark:text-emerald-400/60 text-xs mt-1 transition-colors">Check-in de entrega</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600 transition-colors" />
              </button>
            </div>
          </div>

          {/* Smart Tip */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-slate-300 dark:shadow-none transition-colors"
          >
            <div className="absolute -right-4 -top-4 text-white/5 dark:text-emerald-500/5 transition-colors">
              <Lightbulb size={120} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em]">
                <Lightbulb className="w-4 h-4" />
                <span>Tip del día</span>
              </div>
              <p className="text-xl font-medium leading-relaxed">
                Revisa el stock de <span className="text-emerald-400 font-bold">Girasoles</span>. Quedan pocas unidades para hoy.
              </p>
              <button className="text-xs font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-2">
                Entendido
                <CheckCircle2 className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Footer Info */}
      <footer className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] gap-4 transition-colors">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Servidor Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>{orders.length} Registros</span>
          </div>
        </div>
        <p>© 2024 Florería Bautista • Panel Operativo</p>
      </footer>
    </motion.main>
  );
}
