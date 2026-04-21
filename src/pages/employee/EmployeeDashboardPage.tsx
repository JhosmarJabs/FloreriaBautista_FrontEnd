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
          <div className="w-16 h-16 border-4 border-slate-200 dark:border-white/5 border-t-[#1e3a5f] rounded-full animate-spin"></div>
          <RefreshCw className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1e3a5f] w-6 h-6" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-serif italic animate-pulse">Sincronizando boutique...</p>
      </div>
    );
  }

  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1500px] mx-auto px-4 sm:px-6 py-4 space-y-4"
    >
      {/* ── Welcome Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tight leading-none">
            Gestión <span className="text-[#eab308] italic">Bautista</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium italic leading-none">"El arte de florecer en cada detalle."</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-[#1e3a5f] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm group"
          >
            <RefreshCw className="w-4.5 h-4.5 group-hover:rotate-180 transition-transform duration-700" />
          </button>
          <button className="bg-[#1e3a5f] dark:bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:translate-y-[-1px] transition-all shadow-xl shadow-blue-900/10 active:scale-95">
            <PlusCircle className="w-4 h-4" />
            Venta Nueva
          </button>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
        {[
          { label: 'Ventas Hoy', value: stats.todayCount, trend: '+4% vs ayer', icon: <ShoppingBasket />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
          { label: 'Recaudación', value: `$${stats.todayRevenue.toFixed(0)}`, trend: 'Meta: 75%', icon: <DollarSign />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
          { label: 'Pendientes', value: stats.pendingCount, trend: 'Prioridad alta', icon: <Clock />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
          { label: 'Stock Bajo', value: stats.lowStockCount, trend: 'Reponer hoy', icon: <Package />, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20' },
        ].map((s, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-4 shadow-sm hover:shadow-xl hover:bg-white dark:hover:bg-slate-800 transition-all group`}
          >
            <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-[1px] pointer-events-none" />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em]">{s.label}</p>
              <div className="mt-1 text-xl font-serif font-bold text-[#1e3a5f] dark:text-white leading-none">{s.value}</div>
              <p className={`text-[9px] mt-2 font-black uppercase tracking-widest ${s.color} opacity-80 flex items-center gap-1`}>
                <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                {s.trend}
              </p>
            </div>
            {React.cloneElement(s.icon as React.ReactElement, {
              className: `absolute -bottom-4 -right-4 w-20 h-20 ${s.color} opacity-[0.05] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700`,
              strokeWidth: 2
            })}
          </motion.div>
        ))}
      </section>

      {/* ── Main Content: Bento Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10">
        {/* Left Column: Priority Orders */}
        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#eab308] rounded-full shadow-lg shadow-amber-600/20"></div>
              <h2 className="text-xl font-serif font-bold text-[#1e3a5f] dark:text-white">Pedidos en Proceso</h2>
            </div>
            <Link to="/empleado/pedidos" className="group flex items-center gap-2 text-[#1e3a5f] dark:text-blue-400 font-black text-[9px] uppercase tracking-widest hover:bg-[#1e3a5f] hover:text-white transition-all px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/50 backdrop-blur-md">
              Ver Todo
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {orders.slice(0, 6).map((order) => (
                <motion.div 
                  key={order.id}
                  variants={itemVariants}
                  className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-xl p-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col sm:flex-row gap-4 items-center hover:shadow-xl hover:border-blue-500/20 transition-all group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000" />
                  
                  <div className="size-12 rounded-xl bg-slate-50 dark:bg-slate-900 shrink-0 overflow-hidden relative shadow-inner">
                    <img 
                      src={order.items[0]?.image || `https://picsum.photos/seed/${order.id}/200/200`} 
                      alt="Product" 
                      className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-[#1e3a5f]/5 dark:bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  </div>
                  <div className="flex-grow space-y-2 w-full text-center sm:text-left relative z-10">
                    <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">ID: {order.id}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 ${
                        order.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-500/20'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500'}`}></div>
                        {order.status === 'pending' ? 'Pendiente' : 'Listo'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1e3a5f] dark:text-white group-hover:text-blue-600 transition-colors leading-tight uppercase">Pedido General</h3>
                      <p className="text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest mt-0.5">Cargo: <span className="text-[#1e3a5f] dark:text-blue-400 font-bold">${order.total.toFixed(2)}</span></p>
                    </div>
                  </div>
                  <div className="shrink-0 w-full sm:w-auto relative z-10">
                    <Link to={`/empleado/pedidos/${order.id}`} className="w-full sm:w-10 h-10 bg-[#1e3a5f] dark:bg-blue-600 text-white group-hover:bg-[#eab308] group-hover:text-[#1e3a5f] rounded-xl transition-all flex items-center justify-center shadow-lg shadow-blue-900/10 active:scale-90">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Column: Actions */}
        <section className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <div className="w-1.5 h-8 bg-blue-500 rounded-full shadow-lg shadow-blue-600/20"></div>
              <h2 className="text-xl font-serif font-bold text-[#1e3a5f] dark:text-white">Accesos</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Link to="/empleado/venta-rapida" className="bg-[#1e3a5f] dark:bg-slate-800 p-4 rounded-2xl text-white flex items-center justify-between group hover:shadow-xl transition-all relative overflow-hidden active:scale-95">
                <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-[#eab308] group-hover:text-[#1e3a5f] transition-all duration-500">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-lg leading-none">Venta Rápida</p>
                    <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mt-1.5">Módulo Directo</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors relative z-10" />
              </Link>
              
              <div className="grid grid-cols-2 gap-3">
                <Link to="/empleado/inventario" className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center justify-center gap-2 text-center hover:border-blue-500 hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all z-10">
                        <Package className="w-5 h-5" />
                    </div>
                    <span className="font-black text-[9px] uppercase tracking-[0.1em] text-slate-400 group-hover:text-[#1e3a5f] transition-colors z-10">Suministros</span>
                </Link>
                
                <Link to="/empleado/pedidos" className="bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-center justify-center gap-2 text-center hover:border-blue-500 hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all z-10">
                        <ClipboardList className="w-5 h-5" />
                    </div>
                    <span className="font-black text-[9px] uppercase tracking-[0.1em] text-slate-400 group-hover:text-amber-600 transition-colors z-10">Bitácora</span>
                </Link>
              </div>

              <button className="w-full bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-200/50 dark:border-white/5 flex items-center justify-between group hover:bg-white dark:hover:bg-slate-800 transition-all shadow-inner active:scale-95">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-[#1e3a5f] dark:text-blue-400 shadow-md transition-colors group-hover:scale-110">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-700 dark:text-white leading-none text-base transition-colors">Escanear</p>
                    <p className="text-blue-600 dark:text-blue-400/60 text-[8px] font-black uppercase tracking-widest mt-1 underline underline-offset-2 decoration-[#eab308]">Tickets de entrega</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#1e3a5f] transition-colors" />
              </button>
            </div>
          </div>

          {/* Smart Tip */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-[#1e3a5f] dark:bg-blue-950/40 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl transition-all"
          >
            <div className="absolute -right-8 -top-8 text-white/5 group-hover:rotate-12 transition-transform duration-1000">
              <Lightbulb size={180} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3 text-[#eab308] font-black text-[9px] uppercase tracking-[0.3em]">
                <div className="p-2 bg-[#eab308]/10 rounded-lg">
                    <Lightbulb className="w-5 h-5" />
                </div>
                <span>Nota Operativa</span>
              </div>
              <p className="text-xl font-serif font-medium leading-tight">
                Reponer <span className="text-[#eab308] italic underline underline-offset-4">Girasoles</span> para turno vespertino.
              </p>
              <button className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-white transition-all flex items-center gap-2 bg-white/5 px-6 py-2.5 rounded-full border border-white/10">
                Confirmado
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </section>
      </div>

      {/* ── Corporate Footer ── */}
      <footer className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200 dark:border-white/5 text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] gap-4 relative z-10 transition-colors">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
            <span>En Línea</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#eab308] rounded-full shadow-lg shadow-amber-500/50"></div>
            <span>{orders.length} Pedidos</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400/60">
            <span>© 2024 FB</span>
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
            <span className="text-[#1e3a5f] dark:text-blue-400/40">Z-Centro</span>
        </div>
      </footer>
    </motion.main>
  );
}
