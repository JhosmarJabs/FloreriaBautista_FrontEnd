import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Package, 
  Plus, 
  Minus, 
  Save, 
  AlertCircle, 
  RefreshCw,
  History,
  ArrowUpRight,
  Filter,
  ChevronRight,
  PackagePlus,
  Loader2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { InventoryItem } from '../../types';
import { useToast } from '../../hooks/useToast';

export default function QuickInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sucursalFilter, setSucursalFilter] = useState('Todas');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    if (!refreshing) setLoading(true);
    try {
      const res = await AdminService.getAdminInventory({ size: 100 });
      setItems(res.data.items);
    } catch (error) {
      showToast('Error al conectar con la API de inventario', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredItems = items.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSucursal = sucursalFilter === 'Todas' || p.sucursal === sucursalFilter;
    return matchesSearch && matchesSucursal;
  });

  const handleAdjust = (id: string, delta: number) => {
    setItems(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, stockActual: Math.max(0, p.stockActual + delta) };
      }
      return p;
    }));
  };

  const handleSave = async (id: string) => {
    const item = items.find(p => p.id === id);
    if (!item) return;

    setSaving(id);
    try {
      await AdminService.updateInventoryItem(id, {
        nombre: item.nombre,
        stockActual: item.stockActual,
        stockMinimo: item.stockMinimo,
        sucursal: item.sucursal,
        unidadMedida: item.unidadMedida,
        precioCosto: item.precioCosto,
        esFlorPrimaria: item.esFlorPrimaria,
        imagenUrl: item.imagenUrl
      });
      showToast('Stock guardado en servidor', 'success');
    } catch (error) {
      showToast('Error al persistir cambios en la API', 'error');
    } finally {
      setSaving(null);
    }
  };

  const sucursales = ['Todas', ...new Set(items.map(p => p.sucursal))];

  if (loading && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-100 dark:border-emerald-900/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-8 max-w-7xl mx-auto p-4 md:p-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider mb-2">
            <Package className="w-4 h-4" />
            <span>Almacén e Insumos</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Control de <span className="text-emerald-500">Inventario</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
            Gestión de existencias en tiempo real sincronizado con el servidor central.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Sincronizar
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 active:scale-95 transition-all shadow-xl shadow-emerald-600/20">
            <PackagePlus size={18} />
            Nuevo Insumo
          </button>
        </div>
      </div>

      {/* KPI Stats - Standardized Pattern */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Insumos Totales', value: items.length, trend: 'En sistema', icon: <Package />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
          { label: 'Stock Crítico', value: items.filter(p => p.bajoMinimo).length, trend: 'Reabastecer', icon: <AlertCircle />, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20' },
          { label: 'Sucursales', value: new Set(items.map(p => p.sucursal)).size, trend: 'Activas', icon: <LayoutGrid />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
          { label: 'Costo Prom.', value: items.length > 0 ? `$${(items.reduce((acc, curr) => acc + curr.precioCosto, 0) / items.length).toFixed(1)}` : '$0', trend: 'Base unitaria', icon: <ArrowUpRight />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
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

      {/* Filters & Controls Bar */}
      <section className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row gap-4 items-center transition-colors">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, ID o sucursal..." 
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-slate-950 transition-all text-sm font-medium text-slate-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              className="w-full pl-10 pr-8 py-3.5 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold text-slate-700 dark:text-slate-300 appearance-none cursor-pointer transition-colors"
              value={sucursalFilter}
              onChange={(e) => setSucursalFilter(e.target.value)}
            >
              {sucursales.map(suc => (
                <option key={suc} value={suc}>{suc}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 rotate-90" size={16} />
          </div>

          <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden lg:block"></div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl transition-colors">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Inventory Grid/List */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white dark:bg-slate-800 rounded-[2rem] p-5 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/30 hover:shadow-2xl transition-all group flex ${viewMode === 'list' ? 'flex-row items-center gap-6' : 'flex-col gap-5'}`}
            >
              {/* Product Image */}
              <div className={`${viewMode === 'list' ? 'w-24 h-24' : 'w-full aspect-[4/3]'} rounded-3xl bg-slate-100 dark:bg-slate-900 overflow-hidden relative flex-shrink-0`}>
                {item.imagenUrl ? (
                  <img 
                    src={item.imagenUrl} 
                    alt={item.nombre} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-700">
                    <Package size={48} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg ${item.bajoMinimo ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                    {item.bajoMinimo ? 'Reabastecer' : 'Disponible'}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{item.sucursal}</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.nombre}</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">ID: #{item.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Stock Controls */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Existencias</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-black tracking-tighter ${item.bajoMinimo ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                        {item.stockActual}
                      </span>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{item.unidadMedida}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAdjust(item.id, -1)}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 hover:text-red-600 active:scale-90 transition-all shadow-sm"
                    >
                      <Minus size={18} />
                    </button>
                    <button 
                      onClick={() => handleAdjust(item.id, 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 hover:text-emerald-600 active:scale-90 transition-all shadow-sm"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 h-12 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <History size={16} />
                    Historico
                  </button>
                  <button 
                    onClick={() => handleSave(item.id)}
                    disabled={saving === item.id}
                    className={`flex-1 h-12 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${saving === item.id ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' : 'bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-700'}`}
                  >
                    {saving === item.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {saving === item.id ? '...' : 'GUARDAR STOCK'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[3rem] shadow-sm transition-colors">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700">
            <Package size={48} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">No se encontraron insumos</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium">Prueba ajustando los filtros o el término de búsqueda.</p>
          </div>
          <button 
            onClick={() => { setSearchTerm(''); setSucursalFilter('Todas'); }}
            className="px-8 py-4 bg-emerald-600 dark:bg-emerald-700 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
          >
            Restablecer Filtros
          </button>
        </div>
      )}

      {/* Footer Info */}
      <footer className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] gap-4 transition-colors">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Servidor Conectado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{filteredItems.length} Referencias</span>
          </div>
        </div>
        <p>© 2024 Florería Bautista • Gestión de Almacén</p>
      </footer>
    </div>
  );
}
