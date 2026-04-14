import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, Search, RefreshCw, AlertTriangle, ChevronRight,
  ChevronLeft, Filter, X, Star, Edit, CheckCircle, AlertCircle,
  ShoppingBag, Calculator, LayoutGrid, List, Info, ArrowRight,
  Plus, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { Product, ProductDetail } from '../../types';
import { FadeIn, ScaleIn, StaggerContainer, AnimatedButton } from '../../components/Animations';

const PAGE_SIZE = 12;

export default function AdminRecipeManagementPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Expanded detail view
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminService.getAdminProducts({
        busqueda: busqueda || undefined,
        estado: 'ACTIVO',
        page,
        size: PAGE_SIZE,
      });
      setProducts(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPaginas || 1);
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [busqueda, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [busqueda]);

  const loadDetail = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(id);
    setDetail(null);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await AdminService.getAdminProductById(id);
      setDetail(res.data);
    } catch (err: any) {
      setDetailError(err.message || 'Error al cargar receta');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium tracking-tight">
        <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer" onClick={() => navigate('/admin/catalogo')}>Catálogo</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest text-[10px]">Gestión de Recetas</span>
      </nav>

      {/* Header */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-indigo-500" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Motor de Arreglos</h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Definición de composición botánica y costos de producción.</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-500 transition-all shadow-sm">
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <AnimatedButton onClick={() => navigate('/admin/productos/nuevo')} className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10">
               <Plus className="w-4 h-4" /> Crear Producto
            </AnimatedButton>
          </div>
        </div>
      </FadeIn>

      {/* Info Banner */}
      <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/20 rounded-[32px] flex items-start lg:items-center gap-6 group">
         <div className="size-10 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <Info className="w-5 h-5 text-indigo-500" />
         </div>
         <div>
            <p className="text-sm font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-tight">Estructura de Costeo Directo</p>
            <p className="text-xs font-medium text-indigo-600/80 dark:text-indigo-400/80 mt-0.5 max-w-4xl">
               Las recetas determinan el escandallo del producto sumando el costo de cada insumo. 
               La <span className="text-indigo-800 dark:text-indigo-300 font-bold">Flor Primaria</span> es el eje central para el cálculo de demanda en el motor analítico.
            </p>
         </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Filtrar por nombre de arreglo o tipo..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white"
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
         </div>
         {busqueda && (
            <button onClick={() => setBusqueda('')} className="px-4 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900/30">
               Limpiar
            </button>
         )}
      </div>

      {/* Product Grid / List */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[32px] overflow-hidden shadow-sm flex flex-col min-h-[500px]">
         {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
               <RefreshCw className="size-10 text-indigo-500 animate-spin" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculando formulaciones...</p>
            </div>
         ) : products.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-24 gap-6">
               <ShoppingBag className="size-16 text-slate-200 dark:text-slate-700" />
               <div className="text-center">
                  <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Arquitectura de Catálogo Vacía</p>
                  <p className="text-xs text-slate-400 mt-1">No hay productos activos vinculados a recetas.</p>
               </div>
            </div>
         ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
               {products.map((product, idx) => (
                  <div key={product.id} className="group">
                     <button onClick={() => loadDetail(product.id)}
                        className={`w-full flex items-center justify-between p-6 hover:bg-slate-50/50 dark:hover:bg-slate-900 transition-all text-left ${expandedId === product.id ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''}`}>
                        <div className="flex items-center gap-5">
                           <div className="size-12 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 relative shrink-0">
                              {product.imagenUrl ? (
                                 <img src={product.imagenUrl} className="size-full object-cover group-hover:scale-110 transition-transform" alt={product.nombre} referrerPolicy="no-referrer" />
                              ) : (
                                 <div className="size-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300">
                                    <ShoppingBag className="w-5 h-5" />
                                 </div>
                              )}
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{product.nombre}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.tipo}</span>
                                 <span className="size-1 rounded-full bg-slate-200" />
                                 <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">${product.precioBase.toLocaleString()}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <ChevronRight className={`w-5 h-5 text-slate-300 transition-all ${expandedId === product.id ? 'rotate-90 text-indigo-500' : ''}`} />
                        </div>
                     </button>

                     <AnimatePresence>
                        {expandedId === product.id && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-white dark:bg-slate-800 shadow-inner group/detail">
                              <div className="p-8 space-y-8">
                                 {detailLoading ? (
                                    <div className="py-12 flex flex-col items-center gap-4">
                                       <RefreshCw className="size-6 text-indigo-500 animate-spin" />
                                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Desglosando Insumos...</span>
                                    </div>
                                 ) : detailError ? (
                                    <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl text-center text-xs font-bold uppercase border border-rose-100">
                                       {detailError}
                                    </div>
                                 ) : detail?.receta && detail.receta.length > 0 ? (
                                    <>
                                       <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                             <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                             </div>
                                             <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.15em]">Configuración Botánica Actual</h5>
                                          </div>
                                          <button onClick={() => navigate(`/admin/productos/editar/${product.id}`)}
                                             className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-all border border-slate-100 dark:border-slate-700">
                                             <Edit className="w-3.5 h-3.5" /> Reconfigurar
                                          </button>
                                       </div>

                                       <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-slate-700 overflow-hidden">
                                          <table className="w-full text-left">
                                             <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                                                   {['Insumo / Componente', 'Magnitud', 'Costo Unitario', 'Subtotal'].map(h => (
                                                      <th key={h} className="px-8 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{h}</th>
                                                   ))}
                                                </tr>
                                             </thead>
                                             <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/50">
                                                {detail.receta.map((item, i) => (
                                                   <tr key={i} className="hover:bg-white dark:hover:bg-slate-800 transition-colors group/row">
                                                      <td className="px-8 py-4">
                                                         <div className="flex items-center gap-3">
                                                            <div className={`size-1.5 rounded-full ${item.esFlorPrimaria ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-200'}`} />
                                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{item.flowerNombre}</span>
                                                            {item.esFlorPrimaria && (
                                                               <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800">PRIMARIA</span>
                                                            )}
                                                         </div>
                                                      </td>
                                                      <td className="px-8 py-4">
                                                         <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{item.cantidad} unidades</span>
                                                      </td>
                                                      <td className="px-8 py-4">
                                                         <span className="font-mono text-[10px] text-slate-400 font-bold">${item.flowerPrecioCosto.toFixed(2)}</span>
                                                      </td>
                                                      <td className="px-8 py-4">
                                                         <span className={`text-xs font-black ${item.esFlorPrimaria ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                                                            ${(item.cantidad * item.flowerPrecioCosto).toFixed(2)}
                                                         </span>
                                                      </td>
                                                   </tr>
                                                ))}
                                             </tbody>
                                          </table>
                                       </div>

                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          {[
                                             { label: 'Costo de Producción', val: detail.receta.reduce((s, r) => s + r.cantidad * r.flowerPrecioCosto, 0), icon: <Calculator />, color: 'text-slate-800' },
                                             { label: 'Carga Primaria', val: detail.receta.filter(r => r.esFlorPrimaria).reduce((s, r) => s + r.cantidad * r.flowerPrecioCosto, 0), icon: <Star />, color: 'text-indigo-600' },
                                             { label: 'Margen Bruto (%)', val: (((detail.precioBase - (detail.receta.reduce((s, r) => s + r.cantidad * r.flowerPrecioCosto, 0))) / detail.precioBase) * 100).toFixed(1) + '%', icon: <TrendingUp />, color: 'text-emerald-600' }
                                          ].map((card, i) => (
                                             <div key={i} className="p-6 bg-slate-50/50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-[28px] overflow-hidden group/card shadow-sm">
                                                <div className="flex items-center gap-3 mb-2">
                                                   <div className={`size-7 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center ${card.color} shadow-sm transition-transform group-hover/card:scale-110`}>
                                                      {React.cloneElement(card.icon as React.ReactElement, { className: 'w-4 h-4' })}
                                                   </div>
                                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                                                </div>
                                                <h6 className={`text-xl font-black ${card.color} dark:text-white tracking-tighter`}>{typeof card.val === 'number' ? `$${card.val.toFixed(2)}` : card.val}</h6>
                                             </div>
                                          ))}
                                       </div>
                                    </>
                                 ) : (
                                    <div className="py-20 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px]">
                                       <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center animate-pulse">
                                          <FlaskConical className="size-8 text-slate-200" />
                                       </div>
                                       <div className="text-center">
                                          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Algoritmo Incompleto</p>
                                          <p className="text-xs text-slate-300 dark:text-slate-600 mb-6 font-medium">Este producto aún no tiene una receta de insumos asignada.</p>
                                          <button onClick={() => navigate(`/admin/productos/editar/${product.id}`)}
                                             className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 transition-transform">
                                             Definir Formulación
                                          </button>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               ))}
            </div>
         )}

         {/* Pagination Footer */}
         <div className="px-8 py-5 border-t border-slate-50 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{products.length} de {total} unidades operacionales</span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
               <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="size-9 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 disabled:opacity-20 transition-all">
                  <ChevronLeft className="w-4 h-4" />
               </button>
               {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                  const p = totalPages <= 3 ? i + 1 : Math.max(1, page - 1) + i;
                  if (p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)} className={`size-9 text-[10px] font-black rounded-lg transition-all ${p === page ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>{p}</button>
                  )
               })}
               <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="size-9 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 disabled:opacity-20 transition-all">
                  <ChevronRight className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}

const TrendingUp = (props: any) => <Activity {...props} />;
