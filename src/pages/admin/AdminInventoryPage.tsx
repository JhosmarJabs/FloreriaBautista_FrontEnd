import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, AlertTriangle, Search, Plus, 
  ArrowUpRight, ArrowDownRight, History, RefreshCw, 
  UploadCloud, DownloadCloud, TrendingUp, ChevronRight, 
  Edit3, Trash2, ChevronLeft, XCircle, Boxes, Star, LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { ImportProductsResult, InventoryItem } from '../../types';
import { FadeIn, ScaleIn, AnimatedButton } from '../../components/Animations';
import ImportModal from '../../components/ImportModal';
import ExportModal from '../../components/ExportModal';
import { useToast } from '../../hooks/useToast';

export default function AdminInventoryPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // ── Estado ───────────────────────────────────────────────────────────────────
  const [inventory, setInventory]           = useState<InventoryItem[]>([]);
  const [invTotal, setInvTotal]             = useState(0);
  const [invTotalPags, setInvTotalPags]     = useState(1);
  const [invPage, setInvPage]               = useState(1);
  const [loading, setLoading]               = useState(false);
  const [viewMode, setViewMode]             = useState<'table' | 'grid'>('table');
  const [invBusqueda, setInvBusqueda]       = useState('');
  const [invSucursal, setInvSucursal]       = useState('');
  const [invBajoMin, setInvBajoMin]         = useState<boolean | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen]     = useState(false);
  const [isExportModalOpen, setIsExportModalOpen]     = useState(false);
  const [importResult, setImportResult]     = useState<ImportProductsResult | null>(null);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);

  // ── Carga ────────────────────────────────────────────────────────────────────
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminService.getAdminInventory({
        busqueda:   invBusqueda  || undefined,
        sucursal:   invSucursal  || undefined,
        bajoMinimo: invBajoMin,
        page:       invPage,
        size:       20,
      });
      setInventory(res.data.items);
      setInvTotal(res.data.total);
      setInvTotalPags(res.data.totalPaginas ?? 1);
    } catch {
      showToast('Error al cargar inventario', 'error');
    } finally {
      setLoading(false);
    }
  }, [invBusqueda, invSucursal, invBajoMin, invPage, showToast]);

  useEffect(() => { loadInventory(); }, [loadInventory]);
  useEffect(() => { setInvPage(1); }, [invBusqueda, invSucursal, invBajoMin]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleImportConfirm = async (_data: any[], file: File) => {
    try {
      const result = await AdminService.importAdminProducts(file);
      setImportResult(result.data);
      await loadInventory();
      showToast(`${result.message}`, 'success');
    } catch (err: any) {
      showToast(`Error al importar: ${err.message ?? 'desconocido'}`, 'error');
    } finally {
      setIsImportModalOpen(false);
    }
  };

  const handleDeleteItem = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de desactivar "${nombre}"? Ya no aparecerá en el inventario activo ni en las recetas.`)) return;
    try {
      setLoading(true);
      await AdminService.deleteInventoryItem(id);
      showToast('Insumo desactivado con éxito', 'success');
      await loadInventory();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (item: InventoryItem) => {
    const { stockActual: stock, stockMinimo: minimo } = item;
    if (stock <= 0)            return { label: 'Sin Stock', color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-500/10',    border: 'border-rose-100 dark:border-rose-500/20',    dot: 'bg-rose-400',    bar: 0  };
    if (stock <= minimo)       return { label: 'Crítico',   color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-500/10',    border: 'border-rose-100 dark:border-rose-500/20',    dot: 'bg-rose-400',    bar: 20 };
    if (stock <= minimo * 1.5) return { label: 'Bajo',      color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-100 dark:border-amber-500/20',   dot: 'bg-amber-400',   bar: 50 };
    return                            { label: 'Óptimo',    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', dot: 'bg-emerald-400', bar: 90 };
  };

  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <FadeIn>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Boxes className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest">Control de Stock</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Gestión de Insumos</h1>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">Stock de accesorios, bases y materiales</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Importar',    icon: UploadCloud,   action: () => setIsImportModalOpen(true) },
              { label: 'Exportar',    icon: DownloadCloud, action: () => setIsExportModalOpen(true) },
              { label: 'Movimientos', icon: History,       action: () => setIsMovementsModalOpen(true) },
            ].map(btn => (
              <AnimatedButton key={btn.label} onClick={btn.action}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                <btn.icon className="w-4 h-4" />
                {btn.label}
              </AnimatedButton>
            ))}
            <AnimatedButton onClick={() => navigate('/admin/inventario/nuevo')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all">
              <Plus className="w-4 h-4" />
              Añadir Insumo
            </AnimatedButton>
          </div>
        </div>
      </FadeIn>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total registros', value: loading ? '—' : String(invTotal),                                         icon: TrendingUp,     color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-500/10',    border: 'border-blue-100 dark:border-blue-500/20',    sub: 'en inventario' },
          { label: 'Bajo mínimo',     value: loading ? '—' : String(inventory.filter(i => i.bajoMinimo).length),       icon: AlertTriangle,  color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-500/10',    border: 'border-rose-100 dark:border-rose-500/20',    sub: 'requieren reposición' },
          { label: 'Suma al costo',   value: loading ? '—' : String(inventory.filter(i => i.sumaAlCosto).length),      icon: ArrowUpRight,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', sub: 'afectan costo base' },
          { label: 'Sucursales',      value: loading ? '—' : String(new Set(inventory.map(i => i.sucursal)).size),     icon: ArrowDownRight, color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10',   border: 'border-amber-100 dark:border-amber-500/20',   sub: 'con insumos activos' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-white dark:bg-slate-800 border ${s.border} rounded-xl p-3.5 flex items-center gap-3 hover:shadow-md transition-shadow`}>
            <div className={`size-8 rounded-lg shrink-0 ${s.bg} ${s.color} flex items-center justify-center`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{s.label}</p>
              <p className={`text-xl font-black leading-tight text-slate-900 dark:text-white`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{s.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── FILTROS ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl shadow-sm">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
            value={invBusqueda} onChange={e => setInvBusqueda(e.target.value)} />
        </div>
        <input type="text" placeholder="Sucursal..."
          className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-slate-200 outline-none w-40 focus:ring-2 focus:ring-blue-500/20"
          value={invSucursal} onChange={e => setInvSucursal(e.target.value)} />
        <button
          onClick={() => setInvBajoMin(prev => prev === true ? undefined : true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            invBajoMin ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
          <AlertTriangle className="w-4 h-4" /> Bajo mínimo
        </button>
        <button onClick={loadInventory}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>

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
      </motion.div>

      {/* ── TABLA / GRID ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
            <RefreshCw className="w-7 h-7 animate-spin text-blue-400" />
            <p className="text-sm">Cargando inventario...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-300 dark:text-slate-700 py-20">
            <Package className="w-12 h-12" />
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">No se encontraron insumos</p>
            <button onClick={() => navigate('/admin/inventario/nuevo')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800/50 px-4 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all">
              + Añadir primer insumo
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/80">
                      {['Artículo', 'Unidad', 'Costo', 'Sucursal', 'Stock actual', 'Stock mínimo', 'Nivel', 'Estado', 'Acciones'].map((h, i) => (
                        <th key={i} className="px-6 py-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    <AnimatePresence mode="popLayout">
                      {inventory.map((item, idx) => {
                        const s = getStatusInfo(item);
                        return (
                          <motion.tr key={item.id} layout
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }} transition={{ delay: idx * 0.025 }}
                            className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden group-hover:ring-2 group-hover:ring-blue-200 dark:group-hover:ring-blue-900 transition-all border border-slate-200 dark:border-slate-700">
                                  {item.imagenUrl ? (
                                    <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{item.nombre}</p>
                                    {item.esFlorPrimaria && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                                  </div>
                                  <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1">#{item.id.slice(0, 8).toUpperCase()}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md leading-none">{item.unidadMedida}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-black text-slate-900 dark:text-white">${item.precioCosto.toFixed(2)}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{item.sucursal}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className={`text-lg font-black leading-none ${item.bajoMinimo ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{item.stockActual}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400 dark:text-slate-500">{item.stockMinimo}</td>
                            <td className="px-6 py-4">
                              <div className="w-20">
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                  <motion.div className={`h-full rounded-full ${s.dot}`}
                                    initial={{ width: 0 }} animate={{ width: `${s.bar}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.bg} ${s.color} ${s.border}`}>
                                {s.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <button onClick={() => navigate(`/admin/inventario/editar/${item.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteItem(item.id, item.nombre)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 bg-slate-50/50 dark:bg-slate-900/20">
                {inventory.map(item => {
                  const s = getStatusInfo(item);
                  return (
                    <div key={item.id} className="group bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800/50 transition-all duration-300">
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {item.imagenUrl ? (
                              <img src={item.imagenUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.15em] border ${s.bg} ${s.color} ${s.border}`}>
                            {s.label}
                          </span>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{item.nombre}</h3>
                            {item.esFlorPrimaria && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">#{item.id.slice(0, 8).toUpperCase()}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                           <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Stock</p>
                             <p className={`text-lg font-black leading-none ${item.bajoMinimo ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{item.stockActual}</p>
                           </div>
                           <div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Unidad</p>
                             <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase leading-none mt-1">{item.unidadMedida}</p>
                           </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 dark:border-slate-700">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Costo unit.</span>
                            <span className="text-sm font-black text-slate-800 dark:text-slate-200">${item.precioCosto.toFixed(2)}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => navigate(`/admin/inventario/editar/${item.id}`)} className="p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"><Edit3 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteItem(item.id, item.nombre)} className="p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paginación Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{inventory.length} de {invTotal} registros</span>
              {invTotalPags > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setInvPage(p => Math.max(1, p - 1))} disabled={invPage === 1 || loading}
                    className="p-2 text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(invTotalPags, 5) }, (_, i) => {
                      const p = invTotalPags <= 5 ? i + 1 : Math.max(1, invPage - 2) + i;
                      if (p > invTotalPags) return null;
                      return (
                        <button key={p} onClick={() => setInvPage(p)}
                          className={`w-9 h-9 text-xs font-black rounded-xl transition-all ${p === invPage ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => setInvPage(p => Math.min(invTotalPags, p + 1))} disabled={invPage === invTotalPags || loading}
                    className="p-2 text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* ── MODALS ── */}
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onConfirm={handleImportConfirm} title="Importar Insumos" />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} data={inventory} title="Reporte de Inventario" filename="inventario_admin" />


      {/* MOVIMIENTOS */}
      <AnimatePresence>
        {isMovementsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMovementsModalOpen(false)} />
            <ScaleIn className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-7 py-5 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Movimientos</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Historial de entradas y salidas</p>
                </div>
                <button onClick={() => setIsMovementsModalOpen(false)}
                  className="size-10 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-all">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                        {['Fecha', 'Tipo', 'Insumo', 'Cantidad', 'Responsable'].map(h => (
                          <th key={h} className="px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                      {[
                        { date: '27 Oct · 14:30', type: 'Entrada', item: 'Cinta Decorativa Dorada', qty: '+20', user: 'Admin',      tc: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
                        { date: '27 Oct · 11:15', type: 'Salida',  item: 'Base Cerámica Redonda',   qty: '-3',  user: 'Empleado 1', tc: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
                        { date: '26 Oct · 09:00', type: 'Entrada', item: 'Espuma floral verde',      qty: '+50', user: 'Admin',      tc: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
                      ].map((mov, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                          <td className="px-5 py-4 text-xs font-bold text-slate-500">{mov.date}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${mov.tc}`}>{mov.type}</span>
                          </td>
                          <td className="px-5 py-4 text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{mov.item}</td>
                          <td className={`px-5 py-4 text-sm font-black ${mov.qty.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{mov.qty}</td>
                          <td className="px-5 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mov.user}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ScaleIn>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
