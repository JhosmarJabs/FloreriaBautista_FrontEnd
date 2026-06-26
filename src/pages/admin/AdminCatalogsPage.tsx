import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Library,
  Search,
  Plus,
  RefreshCw,
  MoreVertical,
  Calendar,
  Image as ImageIcon,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { AdminCatalogo } from '../../types';

interface ExtendedCatalogItem extends AdminCatalogo {
  temporada?: string;
  numProductos?: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export default function AdminCatalogsPage() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [catalogs, setCatalogs] = useState<ExtendedCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminService.getCatalogos();
      setCatalogs(res.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al obtener catálogos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  const catalogsFiltrados = catalogs.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.descripcion && c.descripcion.toLowerCase().includes(busqueda.toLowerCase())) ||
    (c.temporada && c.temporada.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACTIVO': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'PROGRAMADO': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Breadcrumb */}


      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center">
            <Library className="w-5 h-5 text-amber-600 dark:text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Catálogos (Festividades)</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Agrupa productos por épocas, festividades o temporadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadCatalogs}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-slate-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-800 px-3 py-2 rounded-xl transition-all shadow-sm disabled:opacity-55"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            Actualizar
          </button>
          <button 
            onClick={() => navigate('/admin/catalogos/nuevo')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Catálogo
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Catálogos Activos', value: String(catalogs.filter(c => c.estado === 'ACTIVO').length), trend: 'Visibles en tienda', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100/70 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/40' },
          { label: 'Total Productos Listados', value: String(catalogs.reduce((acc, c) => acc + (c.numProductos || 0), 0)), trend: 'En distintos catálogos', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100/70 dark:bg-indigo-500/20', border: 'border-indigo-200 dark:border-indigo-500/40' },
          { label: 'Total Catálogos', value: String(catalogs.length), trend: 'Registrados en total', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40' },
        ].map(({ label, value, trend, color, bg, border }) => (
          <div key={label} className={`relative overflow-hidden rounded-2xl border ${border} ${bg} p-5`}>
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
              <div className="flex items-end gap-3 mt-1">
                <h3 className={`text-2xl font-black ${color}`}>{value}</h3>
              </div>
              <p className={`text-xs mt-1.5 font-medium ${color} opacity-80`}>{trend}</p>
            </div>
            <TrendingUp className={`absolute -bottom-4 -right-4 w-24 h-24 ${color} opacity-10`} strokeWidth={3} />
          </div>
        ))}
      </div>

      {/* Tools */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar catálogo o época de festividad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-slate-800 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Grid / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full col-span-full">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-2" />
          <p className="text-xs text-slate-400 font-medium">Cargando catálogos...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full col-span-full">
          <p className="text-sm text-red-500 font-bold mb-2">Error al cargar catálogos</p>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <button 
            onClick={loadCatalogs}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            Reintentar
          </button>
        </div>
      ) : catalogsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl border-dashed w-full col-span-full">
          <Library className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-xs text-slate-400 font-medium">No se encontraron catálogos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
          {catalogsFiltrados.map(catalog => (
            <div key={catalog.id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800/50 transition-all">
              <div className="h-28 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden">
                {catalog.imagenUrl ? (
                  <img 
                    src={catalog.imagenUrl} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    alt="" 
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider backdrop-blur-sm border border-white/20 shadow-sm ${
                    catalog.estado === 'ACTIVO' ? 'bg-emerald-500/80 text-white' : 
                    catalog.estado === 'PROGRAMADO' ? 'bg-blue-500/80 text-white' : 
                    'bg-white/80 text-slate-800'
                  }`}>
                    {catalog.estado}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{catalog.nombre}</h3>
                    {catalog.temporada && (
                      <p className="text-xs text-amber-600 dark:text-amber-500 font-semibold mt-0.5">{catalog.temporada}</p>
                    )}
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2rem] leading-relaxed mb-4">
                  {catalog.descripcion}
                </p>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                      {catalog.numProductos || 0} productos
                    </span>
                    {catalog.fechaInicio && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                        <Calendar className="w-3 h-3" />
                        {new Date(catalog.fechaInicio).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/admin/catalogos/editar/${catalog.id}`)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-500 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 hover:border-amber-200 dark:hover:border-amber-500/50 transition-all"
                  >
                    Gestionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
