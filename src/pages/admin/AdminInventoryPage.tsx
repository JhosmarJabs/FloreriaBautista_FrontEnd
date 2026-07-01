import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, AlertTriangle, Search, Plus, 
  ArrowUpRight, ArrowDownRight, History, RefreshCw, 
  UploadCloud, DownloadCloud, TrendingUp, ChevronRight, 
  Edit3, Trash2, ChevronLeft, XCircle, Boxes, Star, LayoutGrid, List,
  ArrowUpDown, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { ImportProductsResult, InventoryItem, InventoryKpis, SingleResponse } from '../../types';
import { FadeIn, ScaleIn, AnimatedButton } from '../../components/Animations';
import ImportModal from '../../components/ImportModal';
import { useToast } from '../../hooks/useToast';
import { filterCSV } from '../../utils/exportUtils';

export default function AdminInventoryPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // ── Estado ───────────────────────────────────────────────────────────────────
  const [inventory, setInventory]           = useState<InventoryItem[]>([]);
  const [invTotal, setInvTotal]             = useState(0);
  const [invTotalPags, setInvTotalPags]     = useState(1);
  const [invPage, setInvPage]               = useState(1);
  const [loading, setLoading]               = useState(false);
  const [kpis, setKpis]                     = useState<InventoryKpis | null>(null);
  const [viewMode, setViewMode]             = useState<'table' | 'grid'>('table');
  const [invBusqueda, setInvBusqueda]       = useState('');
  const [invSucursal, setInvSucursal]       = useState('');
  const [invBajoMin, setInvBajoMin]         = useState<boolean | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen]     = useState(false);
  const [isExportModalOpen, setIsExportModalOpen]     = useState(false);
  const [importResult, setImportResult]     = useState<ImportProductsResult | null>(null);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ field: keyof InventoryItem; order: 'asc' | 'desc' }>({ field: 'nombre', order: 'asc' });
  const [invCategoria, setInvCategoria] = useState('');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  // ── Carga ────────────────────────────────────────────────────────────────────
  const loadInventory = useCallback(async () => {
    setLoading(true);
    const kpisPromise = AdminService.getAdminInventoryKpis()
      .then(res => {
        if (res && res.success) {
          setKpis(res.data);
        }
      })
      .catch((err) => {
        console.error('Error al cargar KPIs de inventario:', err);
      });
    try {
      const res = await AdminService.getAdminInventory({
        busqueda:   invBusqueda  || undefined,
        sucursal:   invSucursal  || undefined,
        bajoMinimo: invBajoMin,
        page:       invPage,
        size:       40,
      });
      let items = res.data.items;
      
      // Filtro de Categoría (basado en unidadMedida según solicitud del usuario)
      if (invCategoria) {
        items = items.filter(i => i.unidadMedida.toLowerCase().includes(invCategoria.toLowerCase()));
      }
      
      const sortedItems = [...items].sort((a, b) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortConfig.order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.order === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
      setInventory(sortedItems);
      setInvTotal(res.data.total);
      setInvTotalPags(res.data.totalPaginas ?? 1);
    } catch {
      showToast('Error al cargar inventario', 'error');
    } finally {
      setLoading(false);
    }
    await kpisPromise;
  }, [invBusqueda, invSucursal, invBajoMin, invPage, invCategoria, showToast, sortConfig]);

  useEffect(() => { loadInventory(); }, [loadInventory]);
  useEffect(() => { setInvPage(1); }, [invBusqueda, invSucursal, invBajoMin, invCategoria]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleImportConfirm = async (_data: any[], file: File) => {
    try {
      await AdminService.importAdminInventory(file);
      await loadInventory();
      showToast('Inventario importado con éxito', 'success');
    } catch (err: any) {
      throw err;
    }
  };

  const getUnitStyle = (unit: string) => {
    const u = unit.toLowerCase();
    if (u.includes('unid') || u.includes('pza') || u.includes('pieza')) 
      return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    if (u.includes('caja')) 
      return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
    if (u.includes('paq')) 
      return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
    if (u.includes('rollo')) 
      return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    if (u.includes('gr') || u.includes('kg') || u.includes('kilo')) 
      return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    if (u.includes('m') || u.includes('metro')) 
      return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    if (u.includes('l') || u.includes('litro')) 
      return 'bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20';
    return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700';
  };

  const calculateRefillDate = (item: InventoryItem) => {
    // Modelo Predictivo Simplificado
    let dailyRate = 2;
    if (item.unidadMedida.toLowerCase().includes('tallo')) dailyRate = 18;
    if (item.unidadMedida.toLowerCase().includes('pza')) dailyRate = 4;
    
    const daysRemaining = Math.floor(item.stockActual / dailyRate);
    const date = new Date();
    date.setDate(date.getDate() + daysRemaining);

    return {
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      priority: daysRemaining <= 3 ? 'text-rose-600 font-black' : 'text-slate-500 dark:text-slate-400'
    };
  };

  const getStatusInfo = (item: InventoryItem) => {
    const { stockActual: stock, stockMinimo: minimo } = item;
    if (stock <= 0)            return { label: 'Sin Stock', color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-500/10',    border: 'border-rose-100 dark:border-rose-500/20',    dot: 'bg-rose-400',    bar: 0  };
    if (stock <= minimo)       return { label: 'Crítico',   color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-500/10',    border: 'border-rose-100 dark:border-rose-500/20',    dot: 'bg-rose-400',    bar: 20 };
    if (stock <= minimo * 1.5) return { label: 'Bajo',      color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-100 dark:border-amber-500/20',   dot: 'bg-amber-400',   bar: 50 };
    return                            { label: 'Óptimo',    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', dot: 'bg-emerald-400', bar: 90 };
  };

  const toggleSort = (field: keyof InventoryItem) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Insumos</h1>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">Stock de accesorios, bases y materiales</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Importar',    icon: UploadCloud,   action: () => setIsImportModalOpen(true) },
              { label: 'Exportar',    icon: DownloadCloud, action: async () => {
                setLoading(true);
                try {
                  const blob = await AdminService.exportAdminInventory();
                  const text = await blob.text();
                  const filteredText = filterCSV(text);
                  const filteredBlob = new Blob([filteredText], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(filteredBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'inventario_total.csv';
                  link.click();
                  URL.revokeObjectURL(url);
                  showToast('Inventario exportado', 'success');
                } catch (err: any) {
                  showToast(`Error al exportar: ${err.message}`, 'error');
                } finally {
                  setLoading(false);
                }
              }},
              { label: 'Movimientos', icon: History,       action: () => setIsMovementsModalOpen(true) },
            ].map(btn => (
              <AnimatedButton key={btn.label} onClick={btn.action} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-slate-300 transition-all">
                <btn.icon className="w-4 h-4" />
                {btn.label}
              </AnimatedButton>
            ))}
            <AnimatedButton onClick={() => navigate('/admin/inventario/nuevo')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all">
              <Plus className="w-4 h-4" />
              Añadir Insumo
            </AnimatedButton>
          </div>
        </div>
      </FadeIn>

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total registros', value: loading || !kpis ? '—' : String(kpis.totalRegistros), icon: <TrendingUp />, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/40', trend: 'en inventario' },
          { label: 'Bajo mínimo', value: loading || !kpis ? '—' : String(kpis.bajoMinimo), icon: <AlertTriangle />, color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-100/70 dark:bg-rose-500/20', border: 'border-rose-200 dark:border-rose-500/40', trend: 'requieren reposición' },
          { label: 'Suma al costo', value: loading || !kpis ? '—' : String(kpis.sumaAlCosto), icon: <ArrowUpRight />, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/40', trend: 'afectan costo base' },
          { label: 'Sucursales', value: loading || !kpis ? '—' : String(kpis.sucursales), icon: <Boxes />, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100/70 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/40', trend: 'con insumos activos' },
        ].map((s, i) => (
          <div key={i} className={`relative overflow-hidden rounded-2xl border ${s.border} ${s.bg} p-5`}>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{s.label}</p>
              <div className="mt-2 text-2xl font-black text-slate-800 dark:text-slate-100">{s.value}</div>
              <p className={`text-xs mt-1.5 font-medium ${s.color} opacity-80`}>{s.trend}</p>
            </div>
            {React.cloneElement(s.icon as React.ReactElement, { className: `absolute -bottom-4 -right-4 w-24 h-24 ${s.color} opacity-10`, strokeWidth: 3 })}
          </div>
        ))}
      </div>

      {/* ── FILTROS ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl shadow-sm">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20" value={invBusqueda} onChange={e => setInvBusqueda(e.target.value)} />
        </div>
        
        <input type="text" placeholder="Sucursal..." className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-slate-200 outline-none w-32 focus:ring-2 focus:ring-blue-500/20" value={invSucursal} onChange={e => setInvSucursal(e.target.value)} />
        
        <button onClick={() => setInvBajoMin(prev => prev === true ? undefined : true)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${invBajoMin ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 text-amber-700' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-600 dark:text-slate-400'}`}>
          <AlertTriangle className="w-4 h-4" /> Bajo mín.
        </button>

        {/* Botón de Categoría (Filtra por Unidad: Pieza, Tallo, Pliego, etc.) */}
        <div className="relative">
          <button onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${invCategoria ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 text-blue-700' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-600 dark:text-slate-400'}`}>
            <Boxes className="w-4 h-4" />
            <span className="max-w-[120px] truncate">{invCategoria || 'Categoría'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isCategoryMenuOpen ? 'rotate-90' : ''}`} />
          </button>
          <AnimatePresence>
            {isCategoryMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsCategoryMenuOpen(false)} />
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-20 py-2">
                  {['Todas', 'Pieza', 'Tallo', 'Pliego', 'Paquete', 'Caja', 'Rollo', 'Kilo', 'Metro'].map(cat => (
                    <button key={cat} onClick={() => { setInvCategoria(cat === 'Todas' ? '' : cat); setIsCategoryMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex justify-between items-center transition-colors">
                      <span className={invCategoria === (cat === 'Todas' ? '' : cat) ? 'font-bold text-blue-600' : ''}>{cat}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button onClick={loadInventory} className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1.5 rounded-xl ml-auto">
          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400'}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </motion.div>

      {/* ── TABLA / GRID ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20"><RefreshCw className="w-7 h-7 animate-spin text-blue-400" /><p className="text-sm text-slate-400">Cargando...</p></div>
        ) : inventory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20"><Package className="w-12 h-12 text-slate-200" /><p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Sin registros</p></div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/60 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700/50 whitespace-nowrap">
                      {['Artículo', 'Unidad', 'Costo', 'Sucursal', 'Stock', 'Mínimo', 'Reabastecimiento', 'Status', 'Acción'].map((h, i) => (
                        <th key={i} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {inventory.map((item) => {
                      const s = getStatusInfo(item);
                      const refill = calculateRefillDate(item);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                {item.imagenUrl ? <img src={item.imagenUrl} className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-400" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.nombre}</p>
                                <p className="text-[9px] font-mono text-slate-400">#{item.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${getUnitStyle(item.unidadMedida)}`}>{item.unidadMedida}</span></td>
                          <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">${item.precioCosto.toFixed(2)}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">{item.sucursal}</td>
                          <td className="px-6 py-4 text-lg font-black text-slate-900 dark:text-white">{item.stockActual}</td>
                          <td className="px-6 py-4 text-xs text-slate-400">{item.stockMinimo}</td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase ${refill.priority}`}>{refill.date}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${s.bg} ${s.color} ${s.border}`}>{s.label}</span></td>
                          <td className="px-6 py-4">
                            <button onClick={() => navigate(`/admin/inventario/editar/${item.id}`)} className="p-2 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><Edit3 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {inventory.map(item => {
                  const refill = calculateRefillDate(item);
                  return (
                    <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">{item.imagenUrl ? <img src={item.imagenUrl} className="w-full h-full object-cover rounded-xl" /> : <Package className="w-5 h-5 text-slate-300" />}</div>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${refill.priority} bg-slate-50 dark:bg-slate-900`}>{refill.date}</span>
                       </div>
                       <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm truncate mb-4">{item.nombre}</h3>
                       <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl mb-4 border border-slate-100 dark:border-slate-700">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Stock</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{item.stockActual}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Surtido IA</p>
                             <p className={`text-[11px] font-black uppercase ${refill.priority}`}>{refill.date}</p>
                          </div>
                       </div>
                       <button onClick={() => navigate(`/admin/inventario/editar/${item.id}`)} className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl">Editar Insumo</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paginación */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{inventory.length} de {invTotal}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={invPage === 1} className="p-2 text-slate-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-xs font-black text-slate-900 dark:text-white">Pág {invPage}</span>
                <button onClick={() => setInvPage(p => Math.min(invTotalPags, p + 1))} disabled={invPage === invTotalPags} className="p-2 text-slate-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onConfirm={handleImportConfirm} title="Importar Insumos" />
    </div>
  );
}
