import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Search, RefreshCw, AlertTriangle, ChevronRight,
  ChevronLeft, Filter, X, Plus, Eye, Edit, FlaskConical, LayoutGrid, List,
  CheckCircle2
} from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { Product, ProductKpis } from '../../types';

const ESTADOS = ['', 'ACTIVO', 'INACTIVO', 'BORRADOR'];
const PAGE_SIZE = 20;

const ESTADO_STYLE: Record<string, string> = {
  ACTIVO:   'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
  INACTIVO: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  BORRADOR: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
};
const ESTADO_DOT: Record<string, string> = {
  ACTIVO: 'bg-emerald-500', INACTIVO: 'bg-slate-400', BORRADOR: 'bg-amber-400',
};

const TIPO_MAP: Record<string, string> = {
  'ARREGLO_FLORAL': 'Arreglo Floral',
  'RAMO':          'Ramo',
  'FLORES_CORTE':  'Flores de Corte',
  'PLANTA':        'Planta',
  'INSUMOS':       'Insumos',
  'ACCESORIOS':    'Accesorios',
};

export default function AdminProductsListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [kpis, setKpis] = useState<ProductKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const activeFilters = [busqueda, estado].filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, kpisRes] = await Promise.all([
        AdminService.getAdminProducts({
          busqueda: busqueda || undefined,
          estado: estado || undefined,
          page,
          size: PAGE_SIZE,
        }),
        AdminService.getAdminProductsKpis()
      ]);
      setProducts(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPaginas || 1);
      setKpis(kpisRes.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [busqueda, estado, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [busqueda, estado]);

  const clearFilters = () => { setBusqueda(''); setEstado(''); setPage(1); };

  return (
    <div className="w-full flex flex-col gap-5">

      {/* Breadcrumb */}


      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Productos</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Arreglos, ramos y productos — {loading ? '...' : `${total} registros`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/catalogo/recetas')}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-800/50 px-3 py-2 rounded-xl transition-all"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Gestión de recetas
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 px-3 py-2 rounded-xl transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={() => navigate('/admin/productos/nuevo')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo producto
          </button>
        </div>
      </div>

      {/* KPI Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total productos', value: loading || !kpis ? '—' : String(kpis.totalProductos), icon: <ShoppingBag />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40', trend: 'registrados' },
          { label: 'Activos', value: loading || !kpis ? '—' : String(kpis.activos), icon: <CheckCircle2 />, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40', trend: 'en catálogo' },
          { label: 'Borradores', value: loading || !kpis ? '—' : String(kpis.borradores), icon: <AlertTriangle />, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100/70 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/40', trend: 'por publicar' },
        ].map((s, i) => (
          <div key={i} className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5`}>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
              <div className="mt-1 text-2xl font-black text-slate-800 dark:text-slate-100">{s.value}</div>
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
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className={`px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 outline-none transition-all pl-9 w-full`}
            />
          </div>
          <select value={estado} onChange={e => setEstado(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 outline-none transition-all">
            <option value="">Todos los estados</option>
            {ESTADOS.filter(Boolean).map(e => <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</option>)}
          </select>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-800/50 px-3 py-2 rounded-xl transition-all">
              <X className="w-3.5 h-3.5" />Limpiar ({activeFilters})
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1.5 rounded-xl ml-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400 dark:text-slate-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400 dark:text-slate-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
            <RefreshCw className="w-7 h-7 animate-spin text-blue-400" />
            <p className="text-sm">Cargando productos...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-red-400 py-20">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={load} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
              <RefreshCw className="w-3.5 h-3.5" />Reintentar
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-300 py-20">
            <ShoppingBag className="w-12 h-12" />
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
              {activeFilters > 0 ? 'Sin resultados con estos filtros' : 'Sin productos registrados'}
            </p>
            {activeFilters === 0 && (
              <button onClick={() => navigate('/admin/productos/nuevo')} className="text-xs font-bold text-blue-500 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg mt-1">
                Crear primer producto
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/80">
                      {['Producto', 'Tipo', 'Precio', 'Stock', 'Estado', 'Acciones'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {p.imagenUrl ? (
                              <img src={p.imagenUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-slate-100 dark:border-slate-700 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                                <ShoppingBag className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{p.nombre}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 pt-1">#{p.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {TIPO_MAP[p.tipo] ?? p.tipo}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            ${p.precioBase.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{p.stock ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${ESTADO_STYLE[p.estado] ?? ''}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ESTADO_DOT[p.estado] ?? ''}`} />
                            {p.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => navigate(`/admin/productos/${p.id}`)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-xl transition-all"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => navigate(`/admin/productos/editar/${p.id}`)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded-xl transition-all"><Edit className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-6 flex-1 bg-slate-50/50 dark:bg-slate-900/20">
                {products.map(p => (
                  <div key={p.id} className="group bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-800/50 transition-all duration-300">
                    <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                      {p.imagenUrl ? (
                         <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <ShoppingBag className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                      )}
                      <div className="absolute top-3 left-3">
                         <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-xl backdrop-blur-md ${ESTADO_STYLE[p.estado]}`}>
                          {p.estado}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">{TIPO_MAP[p.tipo] ?? p.tipo}</p>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate mb-4">{p.nombre}</h3>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Precio base</p>
                          <p className="text-lg font-black text-slate-900 dark:text-white">${p.precioBase.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => navigate(`/admin/productos/editar/${p.id}`)} className="p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-2xl transition-all"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => navigate(`/admin/productos/${p.id}`)} className="p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-2xl transition-all"><Eye className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                {products.length} de {total} registros
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page <= 1 || loading}
                  className="p-2 text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                    if (p > totalPages) return null;
                    return (
                      <button 
                        key={p} 
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 text-xs font-black rounded-xl transition-all ${p === page ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page >= totalPages || loading}
                  className="p-2 text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
