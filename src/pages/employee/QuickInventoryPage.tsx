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
          <div className="w-16 h-16 border-4 border-slate-100 dark:border-white/5 border-t-[#1e3a5f] rounded-full animate-spin"></div>
          <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#1e3a5f] w-6 h-6" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-serif italic animate-pulse">Sincronizando inventario central...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-6 max-w-[1500px] mx-auto p-4 md:p-2">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tight">
            Archivo de <span className="text-[#eab308] italic">Insumos</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-md font-medium italic text-xs leading-none">
            "Precisión botánica: Cada tallo cuenta en nuestra historia."
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-[#1e3a5f] dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Sincronizar
          </button>
          <button className="flex items-center gap-3 px-6 py-4 bg-[#1e3a5f] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#eab308] hover:text-[#1e3a5f] active:scale-95 transition-all shadow-xl shadow-blue-900/10">
            <PackagePlus size={18} />
            Registrar Nuevo
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Referencias', value: items.length, trend: 'Bitácora total', icon: <Package />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
          { label: 'Bajo Mínimo', value: items.filter(p => p.bajoMinimo).length, trend: 'Prioridad compra', icon: <AlertCircle />, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20' },
          { label: 'Sucursales', value: new Set(items.map(p => p.sucursal)).size, trend: 'Puntos activos', icon: <LayoutGrid />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
          { label: 'Costo Prom.', value: items.length > 0 ? `$${(items.reduce((acc, curr) => acc + curr.precioCosto, 0) / items.length).toFixed(1)}` : '$0', trend: 'Valor unitario', icon: <ArrowUpRight />, color: 'text-[#1e3a5f]', bg: 'bg-slate-100 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-white/5' },
        ].map((s, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i}
            className={`relative overflow-hidden rounded-xl border ${s.border} ${s.bg} p-4 transition-all group hover:shadow-lg`}
          >
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em]">{s.label}</p>
              <div className="mt-1 text-xl font-serif font-bold text-[#1e3a5f] dark:text-white leading-none">{s.value}</div>
              <p className={`text-[9px] mt-2 font-black uppercase tracking-[0.2em] ${s.color} opacity-80 flex items-center gap-1.5`}>
                <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                {s.trend}
              </p>
            </div>
            {React.cloneElement(s.icon as React.ReactElement, {
              className: `absolute -bottom-4 -right-4 w-24 h-24 ${s.color} opacity-[0.05] group-hover:scale-110 transition-transform`,
              strokeWidth: 2
            })}
          </motion.div>
        ))}
      </div>

      {/* Filters & Controls Bar */}
      <section className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-md p-4 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5 flex flex-col lg:flex-row gap-4 items-center transition-colors">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1e3a5f] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o ID de insumo..." 
            className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-[#1e3a5f]/10 focus:bg-white dark:focus:bg-slate-950 transition-all text-sm font-medium text-[#1e3a5f] dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-56">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-[#1e3a5f]/10 text-[10px] font-black uppercase tracking-widest text-[#1e3a5f] dark:text-slate-300 appearance-none cursor-pointer transition-colors shadow-inner"
              value={sucursalFilter}
              onChange={(e) => setSucursalFilter(e.target.value)}
            >
              {sucursales.map(suc => (
                <option key={suc} value={suc}>{suc}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 rotate-90" size={16} />
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl transition-colors">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-[#1e3a5f] shadow-md' : 'text-slate-400 hover:text-[#1e3a5f]'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-[#1e3a5f] shadow-md' : 'text-slate-400 hover:text-[#1e3a5f]'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Inventory Grid/List */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, index) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white/95 dark:bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] p-4 border border-slate-100 dark:border-white/5 hover:border-blue-500/20 hover:shadow-xl transition-all group flex relative overflow-hidden ${viewMode === 'list' ? 'flex-row items-center gap-6' : 'flex-col gap-4'}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-1000" />
              
              {/* Product Image */}
              <div className={`${viewMode === 'list' ? 'w-20 h-20' : 'w-full aspect-square'} rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden relative flex-shrink-0 shadow-inner`}>
                {item.imagenUrl ? (
                  <img 
                    src={item.imagenUrl} 
                    alt={item.nombre} 
                    className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-300">
                    <Package size={48} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg border border-white/20 ${item.bajoMinimo ? 'bg-rose-500 text-white animate-pulse' : 'bg-[#eab308] text-[#1e3a5f]'}`}>
                    {item.bajoMinimo ? 'Requerido' : 'Óptimo'}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex-1 space-y-4 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-[#eab308] dark:text-blue-400 uppercase tracking-[0.3em] mb-1 inline-block">{item.sucursal}</span>
                    <h3 className="text-xl font-serif font-bold text-[#1e3a5f] dark:text-white leading-tight group-hover:text-blue-600 transition-colors uppercase">{item.nombre}</h3>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID: {item.id.slice(0, 10).toUpperCase()}</p>
                  </div>
                </div>

                {/* Stock Controls */}
                <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between group-hover:bg-white transition-all shadow-inner">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Disponible</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-serif font-bold tracking-tight ${item.bajoMinimo ? 'text-rose-600' : 'text-[#1e3a5f] dark:text-white'}`}>
                        {item.stockActual}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{item.unidadMedida}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAdjust(item.id, -1)}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-600 rounded-xl hover:bg-rose-50 hover:text-rose-600 active:scale-90 transition-all shadow-sm"
                    >
                      <Minus size={18} />
                    </button>
                    <button 
                      onClick={() => handleAdjust(item.id, 1)}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-[#1e3a5f] active:scale-90 transition-all shadow-sm"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 h-10 bg-white dark:bg-slate-800 text-[#1e3a5f] dark:text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-100 dark:border-white/5 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                    <History size={14} className="text-[#eab308]" />
                    Bitácora
                  </button>
                  <button 
                    onClick={() => handleSave(item.id)}
                    disabled={saving === item.id}
                    className={`flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 ${saving === item.id ? 'bg-slate-100' : 'bg-[#1e3a5f] text-white hover:bg-[#eab308] hover:text-[#1e3a5f] shadow-blue-900/10'}`}
                  >
                    {saving === item.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {saving === item.id ? 'SINC...' : 'REGISTRAR'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-8 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[4rem] transition-colors">
          <div className="w-28 h-28 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative">
            <Package size={48} strokeWidth={1} className="text-[#1e3a5f]/20" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-[#eab308]/30 rounded-full"
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white">Insumo Inexistente</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium italic">"No hay registros que coincidan con los criterios de búsqueda."</p>
          </div>
          <button 
            onClick={() => { setSearchTerm(''); setSucursalFilter('Todas'); }}
            className="px-10 py-4 bg-[#1e3a5f] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#eab308] hover:text-[#1e3a5f] transition-all shadow-2xl shadow-blue-900/20"
          >
            Restaurar Almacén
          </button>
        </div>
      )}

      {/* Corporate Footer */}
      <footer className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-slate-100 dark:border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] gap-6 transition-colors">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
            <span>Servidor Sincronizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#eab308] rounded-full shadow-lg shadow-amber-500/50"></div>
            <span>{filteredItems.length} SKUs Disponibles</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <span>© 2024 FB</span>
            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
            <span className="text-[#1e3a5f] dark:text-blue-400/40">Logística de Almacén</span>
        </div>
      </footer>
    </div>
  );
}
