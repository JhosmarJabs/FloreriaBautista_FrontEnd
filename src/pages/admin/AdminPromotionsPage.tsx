import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  Search,
  Plus,
  RefreshCw,
  MoreVertical,
  Calendar,
  Percent,
  ChevronRight,
  TrendingDown,
  Gift,
  Trash2,
  AlertTriangle,
  Package,
  DollarSign,
  ShoppingBag,
  Ticket,
  X,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { AdminService } from '../../services/adminService';
import { useToast } from '../../hooks/useToast';
import {
  Promotion,
  Oferta,
  Descuento,
  SaveOfertaBody,
  SaveDescuentoBody,
  Product,
  AdminCategory,
  AdminCatalogo,
} from '../../types';

type TabKey = 'ofertas' | 'descuentos' | 'cupones';

const labelBase = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5';
const inputBase = 'w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition-all focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 placeholder:text-slate-400 dark:placeholder:text-slate-600';

// ── Ofertas Tab ──────────────────────────────────────────────────
function OfertasTab() {
  const { showToast } = useToast();
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SaveOfertaBody>({
    productoId: '',
    precioOferta: 0,
    fechaInicio: null,
    fechaFin: null,
    activo: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, prodRes] = await Promise.all([
        AdminService.getAdminOfertas(),
        AdminService.getProducts({ size: 500 }),
      ]);
      setOfertas(res.data);
      setProducts((prodRes as any).items ?? (prodRes as any).data ?? []);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar ofertas', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditId(null);
    setForm({ productoId: '', precioOferta: 0, fechaInicio: null, fechaFin: null, activo: true });
    setShowForm(true);
  };

  const openEdit = (o: Oferta) => {
    setEditId(o.id);
    setForm({
      productoId: o.productoId,
      precioOferta: o.precioOferta,
      fechaInicio: o.fechaInicio ?? null,
      fechaFin: o.fechaFin ?? null,
      activo: o.activo,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.productoId) { showToast('Selecciona un producto', 'error'); return; }
    if (form.precioOferta <= 0) { showToast('El precio de oferta debe ser mayor a 0', 'error'); return; }
    setSaving(true);
    try {
      if (editId) {
        await AdminService.updateOferta(editId, form);
        showToast('Oferta actualizada', 'success');
      } else {
        await AdminService.createOferta(form);
        showToast('Oferta creada', 'success');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta oferta?')) return;
    try {
      await AdminService.deleteOferta(id);
      setOfertas(prev => prev.filter(o => o.id !== id));
      showToast('Oferta eliminada', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar', 'error');
    }
  };

  const selectedProduct = products.find(p => p.id === form.productoId);

  if (loading) return <LoadingState text="ofertas" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">{ofertas.length} ofertas registradas</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4" /> Nueva Oferta
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{editId ? 'Editar Oferta' : 'Nueva Oferta'}</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelBase}>Producto *</label>
              <select value={form.productoId} onChange={e => setForm({ ...form, productoId: e.target.value })} className={inputBase}>
                <option value="">Seleccionar producto...</option>
                {products.filter(p => p.estado === 'ACTIVO').map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} — ${p.precioBase.toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelBase}>Precio de Oferta *</label>
              <input type="number" step="0.01" min="0" value={form.precioOferta || ''} onChange={e => setForm({ ...form, precioOferta: Number(e.target.value) })} placeholder="0.00" className={inputBase} />
              {selectedProduct && form.precioOferta > 0 && (
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  {Math.round((1 - form.precioOferta / selectedProduct.precioBase) * 100)}% de descuento (antes ${selectedProduct.precioBase.toFixed(2)})
                </p>
              )}
            </div>
            <div>
              <label className={labelBase}>Estado</label>
              <select value={form.activo ? 'true' : 'false'} onChange={e => setForm({ ...form, activo: e.target.value === 'true' })} className={inputBase}>
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
              </select>
            </div>
            <div>
              <label className={labelBase}>Fecha Inicio</label>
              <input type="date" value={form.fechaInicio ?? ''} onChange={e => setForm({ ...form, fechaInicio: e.target.value || null })} className={inputBase} />
            </div>
            <div>
              <label className={labelBase}>Fecha Fin</label>
              <input type="date" value={form.fechaFin ?? ''} onChange={e => setForm({ ...form, fechaFin: e.target.value || null })} className={inputBase} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold disabled:opacity-60 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {ofertas.length === 0 ? (
        <EmptyState icon={ShoppingBag} text="No hay ofertas" action="Crear la primera" onAction={openNew} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {ofertas.map(o => (
            <div key={o.id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800/50 transition-all flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                    o.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                             : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>{o.activo ? 'ACTIVA' : 'INACTIVA'}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(o)} className="text-slate-400 hover:text-rose-500 transition-colors p-1"><ChevronRight className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(o.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  {o.productoImagen && (
                    <img src={o.productoImagen} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700" />
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{o.productoNombre}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-black text-rose-600 dark:text-rose-400">${o.precioOferta.toFixed(2)}</span>
                      {o.precioBase != null && o.precioBase > o.precioOferta && (
                        <span className="text-xs text-slate-400 line-through">${o.precioBase.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 rounded-b-2xl">
                {o.fechaInicio || o.fechaFin ? (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                    <Calendar className="w-3 h-3" />
                    {o.fechaInicio ? new Date(o.fechaInicio + 'T00:00').toLocaleDateString() : '...'} — {o.fechaFin ? new Date(o.fechaFin + 'T00:00').toLocaleDateString() : 'Indefinido'}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">Sin fecha límite</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Descuentos Tab ───────────────────────────────────────────────
function DescuentosTab() {
  const { showToast } = useToast();
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<AdminCategory[]>([]);
  const [catalogos, setCatalogos] = useState<AdminCatalogo[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SaveDescuentoBody>({
    nombre: '',
    tipoRegla: 'MONTO_MINIMO',
    montoMinimoCompra: null,
    categoriaId: null,
    catalogoId: null,
    tipoValor: 'PORCENTAJE',
    valor: 0,
    fechaInicio: null,
    fechaFin: null,
    activo: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, catRes, catalogoRes] = await Promise.all([
        AdminService.getAdminDescuentos(),
        AdminService.getCategorias(),
        AdminService.getCatalogos(),
      ]);
      setDescuentos(res.data);
      setCategorias(catRes.data);
      setCatalogos(catalogoRes.data);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar descuentos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditId(null);
    setForm({ nombre: '', tipoRegla: 'MONTO_MINIMO', montoMinimoCompra: null, categoriaId: null, catalogoId: null, tipoValor: 'PORCENTAJE', valor: 0, fechaInicio: null, fechaFin: null, activo: true });
    setShowForm(true);
  };

  const openEdit = (d: Descuento) => {
    setEditId(d.id);
    setForm({
      nombre: d.nombre,
      tipoRegla: d.tipoRegla,
      montoMinimoCompra: d.montoMinimoCompra ?? null,
      categoriaId: d.categoriaId ?? null,
      catalogoId: d.catalogoId ?? null,
      tipoValor: d.tipoValor,
      valor: d.valor,
      fechaInicio: d.fechaInicio ?? null,
      fechaFin: d.fechaFin ?? null,
      activo: d.activo,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio', 'error'); return; }
    if (form.valor <= 0) { showToast('El valor del descuento debe ser mayor a 0', 'error'); return; }
    setSaving(true);
    try {
      if (editId) {
        await AdminService.updateDescuento(editId, form);
        showToast('Descuento actualizado', 'success');
      } else {
        await AdminService.createDescuento(form);
        showToast('Descuento creado', 'success');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este descuento?')) return;
    try {
      await AdminService.deleteDescuento(id);
      setDescuentos(prev => prev.filter(d => d.id !== id));
      showToast('Descuento eliminado', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar', 'error');
    }
  };

  const reglaLabel = (r: string) =>
    r === 'MONTO_MINIMO' ? 'Monto mínimo' : r === 'CATEGORIA' ? 'Categoría' : 'Catálogo';

  if (loading) return <LoadingState text="descuentos" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">{descuentos.length} descuentos registrados</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4" /> Nuevo Descuento
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{editId ? 'Editar Descuento' : 'Nuevo Descuento'}</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelBase}>Nombre *</label>
              <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. 10% en compras mayores a $500" className={inputBase} />
            </div>
            <div>
              <label className={labelBase}>Tipo de Regla</label>
              <select value={form.tipoRegla} onChange={e => setForm({ ...form, tipoRegla: e.target.value as any })} className={inputBase}>
                <option value="MONTO_MINIMO">Monto mínimo de compra</option>
                <option value="CATEGORIA">Por categoría</option>
                <option value="CATALOGO">Por catálogo/temporada</option>
              </select>
            </div>

            {form.tipoRegla === 'MONTO_MINIMO' && (
              <div>
                <label className={labelBase}>Monto Mínimo ($)</label>
                <input type="number" step="0.01" min="0" value={form.montoMinimoCompra ?? ''} onChange={e => setForm({ ...form, montoMinimoCompra: Number(e.target.value) || null })} placeholder="500.00" className={inputBase} />
              </div>
            )}
            {form.tipoRegla === 'CATEGORIA' && (
              <div>
                <label className={labelBase}>Categoría</label>
                <select value={form.categoriaId ?? ''} onChange={e => setForm({ ...form, categoriaId: e.target.value || null })} className={inputBase}>
                  <option value="">Seleccionar...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}
            {form.tipoRegla === 'CATALOGO' && (
              <div>
                <label className={labelBase}>Catálogo</label>
                <select value={form.catalogoId ?? ''} onChange={e => setForm({ ...form, catalogoId: e.target.value || null })} className={inputBase}>
                  <option value="">Seleccionar...</option>
                  {catalogos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className={labelBase}>Tipo de Valor</label>
              <select value={form.tipoValor} onChange={e => setForm({ ...form, tipoValor: e.target.value as any })} className={inputBase}>
                <option value="PORCENTAJE">Porcentaje (%)</option>
                <option value="MONTO_FIJO">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <label className={labelBase}>Valor {form.tipoValor === 'PORCENTAJE' ? '(%)' : '($)'} *</label>
              <input type="number" step="0.01" min="0" value={form.valor || ''} onChange={e => setForm({ ...form, valor: Number(e.target.value) })} placeholder="0" className={inputBase} />
            </div>
            <div>
              <label className={labelBase}>Fecha Inicio</label>
              <input type="date" value={form.fechaInicio ?? ''} onChange={e => setForm({ ...form, fechaInicio: e.target.value || null })} className={inputBase} />
            </div>
            <div>
              <label className={labelBase}>Fecha Fin</label>
              <input type="date" value={form.fechaFin ?? ''} onChange={e => setForm({ ...form, fechaFin: e.target.value || null })} className={inputBase} />
            </div>
            <div>
              <label className={labelBase}>Estado</label>
              <select value={form.activo ? 'true' : 'false'} onChange={e => setForm({ ...form, activo: e.target.value === 'true' })} className={inputBase}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold disabled:opacity-60 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      {descuentos.length === 0 ? (
        <EmptyState icon={Percent} text="No hay descuentos" action="Crear el primero" onAction={openNew} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {descuentos.map(d => (
            <div key={d.id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800/50 transition-all flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                    d.activo ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                             : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>{d.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(d)} className="text-slate-400 hover:text-rose-500 transition-colors p-1"><ChevronRight className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(d.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors mb-2">{d.nombre}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {d.tipoValor === 'PORCENTAJE' ? `-${d.valor}%` : `-$${d.valor}`}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {reglaLabel(d.tipoRegla)}
                    {d.tipoRegla === 'MONTO_MINIMO' && d.montoMinimoCompra ? ` ≥ $${d.montoMinimoCompra}` : ''}
                    {d.categoriaNombre ? `: ${d.categoriaNombre}` : ''}
                    {d.catalogoNombre ? `: ${d.catalogoNombre}` : ''}
                  </span>
                </div>
              </div>
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 rounded-b-2xl">
                {d.fechaInicio || d.fechaFin ? (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                    <Calendar className="w-3 h-3" />
                    {d.fechaInicio ? new Date(d.fechaInicio + 'T00:00').toLocaleDateString() : '...'} — {d.fechaFin ? new Date(d.fechaFin + 'T00:00').toLocaleDateString() : 'Indefinido'}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-semibold">Sin fecha límite</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cupones Tab (existing Promotions) ────────────────────────────
function CuponesTab() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminService.getAdminPromotions();
      setPromos(res.data);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar cupones', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    setOpenMenu(null);
    if (!confirm('¿Eliminar este cupón? Esta acción no se puede deshacer.')) return;
    try {
      await AdminService.deleteAdminPromotion(id);
      setPromos(prev => prev.filter(p => p.id !== id));
      showToast('Cupón eliminado', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar', 'error');
    }
  };

  const filtered = promos.filter(p => {
    if (!busqueda.trim()) return true;
    const q = busqueda.trim().toLowerCase();
    return p.nombre.toLowerCase().includes(q) || (p.codigo ?? '').toLowerCase().includes(q);
  });

  if (loading) return <LoadingState text="cupones" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input type="text" placeholder="Buscar por nombre o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-slate-800 dark:text-slate-200 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" />
        </div>
        <button onClick={() => navigate('/admin/promociones/nuevo')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all">
          <Plus className="w-4 h-4" /> Nuevo Cupón
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Ticket} text={promos.length === 0 ? 'No hay cupones' : 'Sin resultados'} action="Crear un cupón" onAction={() => navigate('/admin/promociones/nuevo')} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(promo => (
            <div key={promo.id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-800/50 transition-all flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                    promo.estado === 'ACTIVO' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' :
                    promo.estado === 'PROGRAMADO' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>{promo.estado}</span>
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === promo.id ? null : promo.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenu === promo.id && (
                      <div className="absolute right-0 top-6 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                        <button onClick={() => { setOpenMenu(null); navigate(`/admin/promociones/editar/${promo.id}`); }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Editar</button>
                        <button onClick={() => handleDelete(promo.id)}
                          className="w-full flex items-center gap-1.5 text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{promo.nombre}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                    promo.tipo === 'PORCENTAJE' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                    promo.tipo === 'COMBO' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                    'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
                  }`}>
                    {promo.tipo === 'PORCENTAJE' ? `-${promo.valor}% DESC` : promo.tipo === 'COMBO' ? 'COMBO ESPECIAL' : `-$${promo.valor} MXN`}
                  </span>
                  {promo.codigo && (
                    <span className="font-mono text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded border border-rose-100 dark:border-rose-500/20 border-dashed">{promo.codigo}</span>
                  )}
                </div>
              </div>
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between rounded-b-2xl mt-auto">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{promo.usosActuales}{promo.maxUsos ? ` / ${promo.maxUsos}` : ''} canjeos</span>
                  {promo.fechaInicio && (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                      <Calendar className="w-3 h-3" />
                      {new Date(promo.fechaInicio).toLocaleDateString()} - {promo.fechaFin ? new Date(promo.fechaFin).toLocaleDateString() : 'Indefinido'}
                    </span>
                  )}
                </div>
                <button onClick={() => navigate(`/admin/promociones/editar/${promo.id}`)} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-600 hover:border-rose-200 dark:hover:border-rose-500/50 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all">
                  Configurar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared components ────────────────────────────────────────────
function LoadingState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
      <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
      <p className="text-sm font-black uppercase tracking-widest">Cargando {text}...</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text, action, onAction }: { icon: any; text: string; action: string; onAction: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-slate-300 py-20">
      <Icon className="w-16 h-16 opacity-20" />
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{text}</p>
      <button onClick={onAction} className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl">{action}</button>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function AdminPromotionsPage() {
  const [tab, setTab] = useState<TabKey>('ofertas');

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'ofertas', label: 'Ofertas', icon: ShoppingBag },
    { key: 'descuentos', label: 'Descuentos', icon: Percent },
    { key: 'cupones', label: 'Cupones', icon: Ticket },
  ];

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/50 flex items-center justify-center">
          <Tag className="w-5 h-5 text-rose-600 dark:text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Promociones</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">Ofertas de precio, descuentos automáticos y cupones de descuento</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              tab === t.key
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-600'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'ofertas' && <OfertasTab />}
      {tab === 'descuentos' && <DescuentosTab />}
      {tab === 'cupones' && <CuponesTab />}
    </div>
  );
}
