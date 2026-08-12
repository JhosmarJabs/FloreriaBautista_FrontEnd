import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X, History, Plus, RefreshCw, ChevronLeft, ChevronRight,
  ArrowDownRight, ArrowUpRight, SlidersHorizontal, Search, Package, CheckCircle2,
} from 'lucide-react';
import { AdminService } from '../services/adminService';
import { InventoryItem, InventoryMovement, MovementType } from '../types';
import { AnimatedButton } from './Animations';
import { useToast } from '../hooks/useToast';
import { formatApiDate } from '../utils/date';

interface MovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Se invoca tras registrar un movimiento para refrescar el inventario del padre. */
  onRegistered?: () => void;
}

type Tab = 'historial' | 'registrar';

const TIPOS: { value: MovementType; label: string; icon: typeof ArrowDownRight }[] = [
  { value: 'ENTRADA', label: 'Entrada', icon: ArrowDownRight },
  { value: 'SALIDA',  label: 'Salida',  icon: ArrowUpRight },
  { value: 'AJUSTE',  label: 'Ajuste',  icon: SlidersHorizontal },
];

const tipoBadge = (tipo: string) => {
  switch (tipo) {
    case 'ENTRADA': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    case 'SALIDA':  return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    default:        return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
  }
};

export default function MovementsModal({ isOpen, onClose, onRegistered }: MovementsModalProps) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('historial');

  // ── Historial ──
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [page, setPage] = useState(1);
  const [totalPags, setTotalPags] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // ── Catálogo de insumos (para el selector) ──
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');

  // ── Formulario ──
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [tipo, setTipo] = useState<MovementType>('ENTRADA');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMovements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminService.getAdminInventoryMovements({ page, size: 15 });
      setMovements(res.data.items);
      setTotal(res.data.total);
      setTotalPags(res.data.totalPaginas ?? 1);
    } catch {
      showToast('Error al cargar movimientos', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    if (isOpen && tab === 'historial') loadMovements();
  }, [isOpen, tab, loadMovements]);

  // Cargar catálogo de insumos al abrir
  useEffect(() => {
    if (!isOpen) return;
    AdminService.getAdminInventory({ size: 1000 })
      .then(res => setItems(res.data.items))
      .catch(() => { /* silencioso: el selector quedará vacío */ });
  }, [isOpen]);

  // Reiniciar estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setTab('historial');
      setPage(1);
      setSelectedItem(null);
      setTipo('ENTRADA');
      setCantidad('');
      setMotivo('');
      setItemSearch('');
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return items.slice(0, 50);
    return items.filter(i => i.nombre.toLowerCase().includes(q)).slice(0, 50);
  }, [items, itemSearch]);

  const handleSubmit = async () => {
    if (!selectedItem) { showToast('Selecciona un insumo', 'error'); return; }
    const cant = parseInt(cantidad, 10);
    if (!Number.isFinite(cant) || cant <= 0) { showToast('La cantidad debe ser mayor a 0', 'error'); return; }
    setSaving(true);
    try {
      await AdminService.registerAdminInventoryMovement({
        inventoryItemId: selectedItem.id,
        tipo,
        cantidad: cant,
        motivo: motivo.trim() || undefined,
      });
      showToast('Movimiento registrado', 'success');
      onRegistered?.();
      // Limpiar y volver al historial
      setSelectedItem(null);
      setCantidad('');
      setMotivo('');
      setItemSearch('');
      setPage(1);
      setTab('historial');
    } catch (err: any) {
      showToast(err.message || 'Error al registrar el movimiento', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Movimientos de inventario</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Kardex de entradas, salidas y ajustes</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 flex gap-2 border-b border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setTab('historial')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === 'historial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <History className="w-4 h-4" /> Historial
          </button>
          <button
            onClick={() => setTab('registrar')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === 'registrar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Plus className="w-4 h-4" /> Registrar
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-8">
          {tab === 'historial' ? (
            loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <RefreshCw className="w-7 h-7 animate-spin text-blue-400" />
                <p className="text-sm text-slate-400">Cargando movimientos...</p>
              </div>
            ) : movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <History className="w-12 h-12 text-slate-200 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Sin movimientos</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700 whitespace-nowrap">
                      {['Insumo', 'Tipo', 'Cantidad', 'Stock', 'Motivo', 'Fecha'].map(h => (
                        <th key={h} className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {movements.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-slate-800 dark:text-slate-200">{m.nombreItem}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${tipoBadge(m.tipo)}`}>{m.tipo}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white">{m.cantidad}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {m.stockAntes} <span className="text-slate-300 dark:text-slate-600">→</span> <span className="text-slate-800 dark:text-slate-200">{m.stockDespues}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-[200px] truncate">{m.motivo || '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatApiDate(m.fechaHora, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* ── Registrar ── */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Selector de insumo */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Insumo</label>
                {selectedItem ? (
                  <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 shrink-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        <Package className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{selectedItem.nombre}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Stock actual: {selectedItem.stockActual} {selectedItem.unidadMedida}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="text-xs font-bold text-blue-600 hover:underline shrink-0">Cambiar</button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar insumo..."
                        value={itemSearch}
                        onChange={e => setItemSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="max-h-52 overflow-auto border border-slate-100 dark:border-slate-700 rounded-xl divide-y divide-slate-50 dark:divide-slate-700/50">
                      {filteredItems.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-slate-400">Sin resultados</p>
                      ) : filteredItems.map(it => (
                        <button
                          key={it.id}
                          onClick={() => setSelectedItem(it)}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex justify-between items-center gap-2 transition-colors"
                        >
                          <span className="truncate">{it.nombre}</span>
                          <span className="text-[10px] font-black text-slate-400 shrink-0">{it.stockActual} {it.unidadMedida}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Detalles del movimiento */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tipo de movimiento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIPOS.map(t => {
                      const active = tipo === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => setTipo(t.value)}
                          className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-bold transition-all ${active ? tipoBadge(t.value) : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                        >
                          <t.icon className="w-4 h-4" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={e => setCantidad(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Motivo (opcional)</label>
                  <input
                    type="text"
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    placeholder="Ej. Compra a proveedor, merma, corrección..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          {tab === 'historial' ? (
            <>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{movements.length} de {total}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="p-2 text-slate-400 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-xs font-black text-slate-900 dark:text-white">Pág {page}</span>
                <button onClick={() => setPage(p => Math.min(totalPags, p + 1))} disabled={page === totalPags || loading} className="p-2 text-slate-400 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </>
          ) : (
            <>
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <AnimatedButton
                onClick={handleSubmit}
                disabled={saving || !selectedItem}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <><RefreshCw className="w-5 h-5 animate-spin" /> Guardando...</> : <><CheckCircle2 className="w-5 h-5" /> Registrar movimiento</>}
              </AnimatedButton>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
