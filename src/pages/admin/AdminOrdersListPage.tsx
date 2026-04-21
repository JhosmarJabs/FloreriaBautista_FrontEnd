import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, RefreshCw, AlertTriangle, ChevronRight,
  ChevronLeft, Filter, X, Eye, Calendar, Clock, LayoutGrid, List,
  User as UserIcon, Tag, MapPin, ReceiptText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { Order } from '../../types';
import { FadeIn, StaggerContainer, AnimatedButton } from '../../components/Animations';

const ESTADOS = [
  '', 'PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO',
];
const PAGE_SIZE = 20;

const ESTADO_STYLE: Record<string, { bg: string; text: string; dot: string; label: string; border: string }> = {
  PENDIENTE:       { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-400',   label: 'Pendiente', border: 'border-amber-100 dark:border-amber-500/20' },
  CONFIRMADO:      { bg: 'bg-blue-50 dark:bg-blue-500/10',    text: 'text-blue-700 dark:text-blue-400',    dot: 'bg-blue-400',    label: 'Confirmado', border: 'border-blue-100 dark:border-blue-500/20' },
  EN_PREPARACION:  { bg: 'bg-purple-50 dark:bg-purple-500/10',  text: 'text-purple-700 dark:text-purple-400',  dot: 'bg-purple-400',  label: 'En preparación', border: 'border-purple-100 dark:border-purple-500/20' },
  LISTO:           { bg: 'bg-teal-50 dark:bg-teal-500/10',    text: 'text-teal-700 dark:text-teal-400',    dot: 'bg-teal-400',    label: 'Listo', border: 'border-teal-100 dark:border-teal-500/20' },
  EN_CAMINO:       { bg: 'bg-indigo-50 dark:bg-indigo-500/10',  text: 'text-indigo-700 dark:text-indigo-400',  dot: 'bg-indigo-400',  label: 'En camino', border: 'border-indigo-100 dark:border-indigo-500/20' },
  ENTREGADO:       { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Entregado', border: 'border-emerald-100 dark:border-emerald-500/20' },
  CANCELADO:       { bg: 'bg-red-50 dark:bg-red-500/10',     text: 'text-red-700 dark:text-red-400',     dot: 'bg-red-400',     label: 'Cancelado', border: 'border-red-100 dark:border-red-500/20' },
};

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export default function AdminOrdersListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [estado, setEstado] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const activeFilters = [estado, desde, hasta, busqueda].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminService.getAdminOrders({
        estado: estado || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        page,
        size: PAGE_SIZE,
      });
      let items = res.data.items;
      if (busqueda.trim()) {
        const q = busqueda.trim().toLowerCase();
        items = items.filter(o => o.nombreCliente?.toLowerCase().includes(q) || o.id.toLowerCase().includes(q));
      }
      setOrders(items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPaginas || 1);
    } catch (err: any) {
      setError(err.message || 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [estado, desde, hasta, busqueda, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [estado, desde, hasta, busqueda]);

  const clearFilters = () => { setEstado(''); setDesde(''); setHasta(''); setBusqueda(''); setPage(1); };

  const pendientes = orders.filter(o => o.estadoPedido === 'PENDIENTE').length;
  const entregados = orders.filter(o => o.estadoPedido === 'ENTREGADO').length;

  return (
    <div className="w-full flex flex-col gap-6">

      {/* Breadcrumb */}


      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ventas y Pedidos</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
               {loading ? 'Consultando historial...' : `${total} registros encontrados`}
              </p>
            </div>
          </div>
          <AnimatedButton onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </AnimatedButton>
        </div>
      </FadeIn>

      {/* KPI Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total pedidos', value: total, icon: <ReceiptText />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40', trend: 'registrados' },
          { label: 'Pendientes', value: pendientes, icon: <Clock />, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100/70 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/40', trend: 'por procesar' },
          { label: 'Entregados hoy', value: entregados, icon: <CheckCircle2 />, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40', trend: 'completados' },
          { label: 'Recaudación bruta', value: `$${orders.reduce((acc, o) => acc + o.total, 0).toLocaleString()}`, icon: <Tag />, color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100/70 dark:bg-indigo-500/20', border: 'border-indigo-200 dark:border-indigo-500/40', trend: 'últimos pedidos' },
        ].map((s, idx) => (
          <div key={idx} className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5`}>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
              <div className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-100">{loading ? "—" : s.value}</div>
              <p className={`text-xs mt-1.5 font-medium ${s.color} opacity-80`}>{s.trend}</p>
            </div>
            {React.cloneElement(s.icon as React.ReactElement, {
               className: `absolute -bottom-4 -right-4 w-24 h-24 ${s.color} opacity-10`,
               strokeWidth: 3
            })}
          </div>
        ))}
      </div>

      {/* Tools / Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente o folio..." 
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
        </div>
        <select value={estado} onChange={e => setEstado(e.target.value)} 
          className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-600 dark:text-slate-300 outline-none cursor-pointer">
          <option value="">Todos los estados</option>
          {ESTADOS.filter(Boolean).map(e => (
            <option key={e} value={e}>{ESTADO_STYLE[e]?.label ?? e}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 px-3 rounded-xl border border-slate-200 dark:border-slate-700">
           <Calendar className="w-4 h-4 text-slate-400" />
           <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none w-28" />
           <span className="text-slate-300">|</span>
           <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none w-28" />
        </div>

        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl ml-auto">
          <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-sm' : 'text-slate-400'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden min-h-[400px] shadow-sm flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm font-black uppercase tracking-widest">Sincronizando pedidos...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <AlertTriangle className="w-12 h-12 text-rose-500" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{error}</p>
            <button onClick={load} className="px-6 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl border border-emerald-100">Cargar de nuevo</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-300 py-20">
            <ShoppingCart className="w-16 h-16 opacity-20" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay pedidos disponibles</p>
          </div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700/50">
                      {['Folio', 'Cliente', 'Creación', 'Entrega', 'Total', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    <AnimatePresence mode="popLayout">
                      {orders.map(order => {
                        const st = ESTADO_STYLE[order.estadoPedido];
                        return (
                          <motion.tr key={order.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4">
                               <p className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[10px] font-black">{order.nombreCliente?.charAt(0) || 'C'}</div>
                                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{order.nombreCliente || 'Público General'}</p>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{formatDate(order.fechaCreacion)}</span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{formatTime(order.fechaCreacion)}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-500">{formatDate(order.fechaEntrega)}</td>
                            <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">${order.total.toLocaleString()}</td>
                            <td className="px-6 py-4">
                               {st && (
                                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${st.bg} ${st.text} ${st.border}`}>
                                   <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                   {st.label}
                                 </span>
                               )}
                            </td>
                            <td className="px-6 py-4">
                               <button onClick={() => navigate(`/admin/pedidos/${order.id}`)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded-xl transition-all"><Eye className="w-4 h-4" /></button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6 flex-1 bg-slate-50/20 dark:bg-slate-900/10">
                {orders.map((order, idx) => {
                  const st = ESTADO_STYLE[order.estadoPedido];
                  return (
                    <motion.div key={order.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.02 }}
                      className="group bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-2xl hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all cursor-pointer relative overflow-hidden"
                      onClick={() => navigate(`/admin/pedidos/${order.id}`)}>
                      
                      <div className="flex items-start justify-between mb-4">
                         <div className="flex flex-col">
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Folio</p>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white font-mono">#{order.id.slice(0, 8).toUpperCase()}</h3>
                         </div>
                         <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                            <ReceiptText className="w-5 h-5 text-slate-400" />
                         </div>
                      </div>

                      <div className="mb-4">
                         <div className="flex items-center gap-2 mb-2">
                           <UserIcon className="w-3.5 h-3.5 text-slate-300" />
                           <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{order.nombreCliente || 'C. General'}</p>
                         </div>
                         <div className="flex items-center gap-2">
                           <MapPin className="w-3.5 h-3.5 text-slate-300" />
                           <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate uppercase tracking-tight">Sucursal Matriz</p>
                         </div>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700 mb-4 h-24 flex flex-col justify-center">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Entrega</span>
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">{formatDate(order.fechaEntrega)}</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">${order.total.toLocaleString()}</span>
                         </div>
                      </div>

                      <div className="flex items-center justify-between">
                         {st && (
                           <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${st.bg} ${st.text} ${st.border}`}>
                             {st.label}
                           </span>
                         )}
                         <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center dark:hover:bg-emerald-800 transition-all opacity-0 group-hover:opacity-100">
                            <Eye className="w-4 h-4" />
                         </div>
                      </div>

                      {/* Tick decoration */}
                      <div className="absolute -bottom-2 -left-2 size-8 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700" />
                      <div className="absolute -bottom-2 -right-2 size-8 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700" />
                    </motion.div>
                  );
                })}
              </div>
            )}
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{orders.length} de {total} registros</span>
               <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="p-2 text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-all"><ChevronLeft className="w-5 h-5"/></button>
                  <span className="text-xs font-black px-4">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="p-2 text-slate-400 hover:text-emerald-500 disabled:opacity-30 transition-all"><ChevronRight className="w-5 h-5"/></button>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
