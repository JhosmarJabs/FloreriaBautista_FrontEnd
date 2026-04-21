import React, { useState, useEffect, useCallback } from 'react';
import {
  Flower2, Search, RefreshCw, AlertTriangle, ChevronRight,
  ChevronLeft, Filter, X, Star, Plus, Save, Package2,
} from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { Flower, FlowerBody } from '../../types';

const COLORS = ['', 'Rojo', 'Rosa', 'Blanco', 'Amarillo', 'Naranja', 'Morado', 'Verde', 'Azul', 'Multicolor'];
const UNIDADES = ['TALLO', 'PIEZA', 'ROLLO', 'PAQUETE', 'METRO', 'KILO', 'LITRO'];

const emptyFlowerBody = (): FlowerBody => ({
  nombre: '',
  color: '',
  precioCosto: 0,
  unidadMedida: 'TALLO',
  esFlorPrimaria: false,
  stockMinimo: 0,
});

export default function AdminFlowersPage() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [color, setColor] = useState('');
  const [bajoMinimo, setBajoMinimo] = useState(false);
  const [estado, setEstado] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  // New flower form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FlowerBody>(emptyFlowerBody());
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const activeFilters = [busqueda, color, bajoMinimo ? 'bajo' : '', estado].filter(Boolean).length;

  const loadFlowers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AdminService.getFlowers({
        busqueda: busqueda || undefined,
        color: color || undefined,
        bajoMinimo: bajoMinimo || undefined,
        estado: estado || undefined,
        page,
        size: PAGE_SIZE,
      });
      setFlowers(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPaginas || 1);
    } catch (err: any) {
      setError(err.message || 'Error al cargar flores/insumos');
    } finally {
      setLoading(false);
    }
  }, [busqueda, color, bajoMinimo, estado, page]);

  useEffect(() => { loadFlowers(); }, [loadFlowers]);
  useEffect(() => { setPage(1); }, [busqueda, color, bajoMinimo, estado]);

  const clearFilters = () => {
    setBusqueda(''); setColor(''); setBajoMinimo(false); setEstado(''); setPage(1);
  };

  const handleSaveFlower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await AdminService.createFlower(formData);
      setSaveResult({ ok: res.success, msg: res.message || 'Insumo creado correctamente.' });
      if (res.success) {
        setFormData(emptyFlowerBody());
        setTimeout(() => { setShowForm(false); setSaveResult(null); loadFlowers(); }, 1500);
      }
    } catch (err: any) {
      setSaveResult({ ok: false, msg: err.message || 'Error al crear insumo.' });
    } finally { setSaving(false); }
  };

  const setF = (field: keyof FlowerBody, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const inp = "w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all";
  const filterInp = "px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-pink-400/40 focus:border-pink-400 outline-none transition-all";

  return (
    <div className="w-full flex flex-col gap-5">

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
        <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors">Inventario</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-700 dark:text-slate-300">Catálogo de Insumos</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-900/30 border border-pink-100 dark:border-pink-800/50 flex items-center justify-center">
            <Flower2 className="w-5 h-5 text-pink-500 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Catálogo de Insumos</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Flores, follajes y empaques — {loading ? '...' : `${total} registros`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadFlowers} disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 bg-white dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-900/30 border border-slate-200 dark:border-slate-700 hover:border-pink-200 dark:hover:border-pink-800 px-3 py-2 rounded-xl transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button onClick={() => { setShowForm(true); setSaveResult(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-black shadow-lg shadow-pink-600/20 transition-all">
            <Plus className="w-4 h-4" />
            Nuevo insumo
          </button>
        </div>
      </div>

      {/* KPI Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total insumos', value: loading ? '—' : String(total), icon: <Package2 />, color: 'text-pink-700 dark:text-pink-300', bg: 'bg-pink-100/70 dark:bg-pink-500/20', border: 'border-pink-200 dark:border-pink-500/40', trend: 'registrados' },
          { label: 'Flores primarias', value: loading ? '—' : String(flowers.filter(f => f.esFlorPrimaria).length), icon: <Star />, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100/70 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/40', trend: 'para arreglos' },
          { label: 'Bajo mínimo', value: loading ? '—' : String(flowers.filter(f => f.bajoMinimo).length), icon: <AlertTriangle />, color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100/70 dark:bg-red-500/20', border: 'border-red-200 dark:border-red-500/40', trend: 'sin stock' },
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

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..." className={`${filterInp} pl-9 w-full`} />
          </div>
          <select value={color} onChange={e => setColor(e.target.value)} className={filterInp}>
            <option value="">Todos los colores</option>
            {COLORS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={estado} onChange={e => setEstado(e.target.value)} className={filterInp}>
            <option value="">Todos los estados</option>
            <option value="ACTIVA">Activa</option>
            <option value="INACTIVA">Inactiva</option>
          </select>
          <button onClick={() => setBajoMinimo(b => !b)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${bajoMinimo ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            Bajo mínimo
          </button>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-2 rounded-xl transition-all">
              <X className="w-3.5 h-3.5" />Limpiar ({activeFilters})
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <RefreshCw className="w-7 h-7 animate-spin text-pink-400" />
            <p className="text-sm">Cargando insumos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-red-400">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={loadFlowers} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
              <RefreshCw className="w-3.5 h-3.5" />Reintentar
            </button>
          </div>
        ) : flowers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
            <Flower2 className="w-12 h-12" />
            <p className="text-sm font-semibold text-slate-400">{activeFilters > 0 ? 'Sin resultados con estos filtros' : 'Sin insumos registrados'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40">
                    {['Nombre', 'Color', 'Unidad', 'Precio costo', 'Stock actual', 'Stock mínimo', 'Flor primaria', 'Estado'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {flowers.map(flower => (
                    <tr key={flower.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900 transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{flower.nombre}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">#{flower.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {flower.color ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-700 shrink-0"
                              style={{ background: flower.color.toLowerCase() === 'multicolor' ? 'linear-gradient(135deg,#f43f5e,#fbbf24,#34d399)' : flower.color.toLowerCase() }} />
                            <span className="text-sm text-slate-600 dark:text-slate-400">{flower.color}</span>
                          </span>
                        ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold">{flower.unidadMedida}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-black text-slate-800 dark:text-white">${flower.precioCosto.toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${flower.bajoMinimo ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>{flower.stockActual}</span>
                          {flower.bajoMinimo && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-full text-[9px] font-black">
                              <AlertTriangle className="w-2.5 h-2.5" />Bajo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{flower.stockMinimo}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {flower.esFlorPrimaria ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 rounded-full text-[10px] font-black">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />Primaria
                          </span>
                        ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          flower.estado === 'ACTIVA' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${flower.estado === 'ACTIVA' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {flower.estado === 'ACTIVA' ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/20">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {flowers.length} de {total} insumos — Página {page} de {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft className="w-3.5 h-3.5" />Anterior
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                  if (p > totalPages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${p === page ? 'bg-pink-500 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Siguiente<ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── New flower modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 max-w-lg w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-900/30 border border-pink-100 dark:border-pink-800/50 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Nuevo insumo</h3>
              </div>
              <button onClick={() => { setShowForm(false); setSaveResult(null); setFormData(emptyFlowerBody()); }}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveFlower} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Nombre <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.nombre} onChange={e => setF('nombre', e.target.value)}
                    placeholder="Ej. Rosa Roja Premium" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Color</label>
                  <div className="relative">
                    <select value={formData.color} onChange={e => setF('color', e.target.value)} className={inp + " appearance-none"}>
                      <option value="">Sin color</option>
                      {COLORS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Unidad de medida</label>
                  <select value={formData.unidadMedida} onChange={e => setF('unidadMedida', e.target.value)} className={inp + " appearance-none"}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Precio costo <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input type="number" min={0} step={0.01} required value={formData.precioCosto}
                      onChange={e => setF('precioCosto', Number(e.target.value))}
                      className={inp + " pl-7"} placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Stock mínimo</label>
                  <input type="number" min={0} step={1} value={formData.stockMinimo}
                    onChange={e => setF('stockMinimo', Number(e.target.value))} className={inp} placeholder="0" />
                </div>
              </div>
              {/* Flor primaria toggle */}
              <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl">
                <div onClick={() => setF('esFlorPrimaria', !formData.esFlorPrimaria)} className="cursor-pointer shrink-0">
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${formData.esFlorPrimaria ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <span className={`absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow transition-transform ${formData.esFlorPrimaria ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    Flor primaria
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">Entra al cálculo de costo base del arreglo</p>
                </div>
              </div>
              {saveResult && (
                <div className={`flex items-start gap-2 p-3 rounded-xl text-xs font-medium ${saveResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {saveResult.ok
                    ? <><span className="font-bold">✓</span> {saveResult.msg}</>
                    : <><span className="font-bold">✗</span> {saveResult.msg}</>
                  }
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setSaveResult(null); setFormData(emptyFlowerBody()); }}
                  className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-pink-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? 'Guardando...' : 'Crear insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
