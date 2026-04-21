import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight, Info, Settings, Save, RefreshCw,
  Package, Tag, Layers, X, Plus, ImagePlus,
  FlaskConical, Star, Search, Trash2, Calculator, Check, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { ProductBody, RecipeItem, InventoryItem, AdminCategory, AdminCatalogo } from '../../types';
import { AnimatedButton } from '../../components/Animations';
import ImageUploader from '../../components/ImageUploader';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { useToast } from '../../hooks/useToast';
import { FadeIn } from '../../components/Animations';


// ─── Constants ────────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'ARREGLO_FLORAL', label: 'Arreglo Floral' },
  { value: 'RAMO', label: 'Ramo' },
  { value: 'FLORES_CORTE', label: 'Flores de Corte' },
  { value: 'PLANTA', label: 'Planta' },
  { value: 'INSUMOS', label: 'Insumos' },
  { value: 'ACCESORIOS', label: 'Accesorios' },
];

const VISIBILIDAD_OPTIONS = [
  { value: 'PUBLICO', label: 'Público (Web)' },
  { value: 'PRIVADO', label: 'Privado (Solo Admin)' },
  { value: 'CATALOGO', label: 'Solo Catálogo PDF' },
  { value: 'AMBOS', label: 'Ambos (Web y Catálogo)' },
];

const ESTADOS = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'BORRADOR', label: 'Borrador' },
];
const MAX_IMAGES = 3;
const FACTOR_MARGEN = 2.5; // Margen para precio sugerido: costoBase × FACTOR_MARGEN

const emptyForm = (): ProductBody => ({
  nombre: '',
  descripcion: '',
  precioBase: 0,
  tipo: 'ARREGLO_FLORAL',
  esPersonalizable: false,
  estado: 'ACTIVO',
  visibilidad: 'AMBOS',
  imagenUrl: '',
  categorias: [],
  catalogos: [],
  receta: [],
});

// ─── Inventory search combobox ────────────────────────────────────────────────
function InventorySearch({ onSelect }: { onSelect: (item: InventoryItem) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await AdminService.getAdminInventory({ busqueda: query || undefined, size: 10 });
        setResults(res.data.items);
      } catch { setResults([]); }
      finally { setLoading(false); }
    };

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchItems, query ? 350 : 0);
  }, [query]);

  const pick = (item: InventoryItem) => {
    onSelect(item);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar flor o insumo..."
          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => setOpen(true)}
        />
        {loading && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {results.map(item => (
            <button
              key={item.id}
              type="button"
              onMouseDown={() => pick(item)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.nombre}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.sucursal} · {item.unidadMedida}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-xs font-black text-slate-700 dark:text-slate-300">${item.precioCosto.toFixed(2)}</p>
                {item.esFlorPrimaria && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 justify-end">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />Primaria
                  </span>
                )}
                <p className={`text-[9px] font-bold ${item.stockActual <= item.stockMinimo ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                   Stock: {item.stockActual}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProductManagementPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [form, setForm] = useState<ProductBody>(emptyForm());
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]            = useState(false);
  const [catInput, setCatInput]         = useState('');
  const [colInput, setColInput]         = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── Listas globales para sugerencias ───────────────────────────────────────
  const [availableCategories, setAvailableCategories] = useState<AdminCategory[]>([]);
  const [availableCatalogos, setAvailableCatalogos]   = useState<AdminCatalogo[]>([]);
  const [showCatSuggestions, setShowCatSuggestions]   = useState(false);
  const [showColSuggestions, setShowColSuggestions]   = useState(false);

  /* ── Imagen ──────────────────────────────────── */
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage]   = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl]   = useState<string>('');

  // ── Cálculos de receta ─────────────────────────────────────────────────────
  const receta = form.receta ?? [];
  const costoTotalInsumos = receta.reduce((sum, r) => sum + r.cantidad * r.flowerPrecioCosto, 0);
  const costoBaseFloresPrimarias = receta
    .filter(r => r.esFlorPrimaria)
    .reduce((sum, r) => sum + r.cantidad * r.flowerPrecioCosto, 0);
  const precioSugerido = costoBaseFloresPrimarias * FACTOR_MARGEN;
  const margenGanancia = form.precioBase > 0 ? ((form.precioBase - costoTotalInsumos) / form.precioBase) * 100 : 0;

  // Preload precio sugerido when recipe changes and user hasn't manually set it
  const [precioManual, setPrecioManual] = useState(false);

  useEffect(() => {
    if (!precioManual && costoBaseFloresPrimarias > 0) {
      setForm(prev => ({ ...prev, precioBase: parseFloat(precioSugerido.toFixed(2)) }));
    }
  }, [precioSugerido, precioManual]);

  // ── Load product for edit ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const res = await AdminService.getAdminProductById(id);
        const p = res.data;
        setForm({
          nombre: p.nombre,
          descripcion: p.descripcion ?? '',
          precioBase: p.precioBase,
          tipo: p.tipo,
          esPersonalizable: p.esPersonalizable ?? false,
          estado: p.estado,
          visibilidad: p.visibilidad ?? 'AMBOS',
          imagenUrl: p.imagenUrl ?? '',
          categorias: p.categorias ?? [],
          catalogos: p.catalogos ?? [],
          receta: (p.receta ?? []).map((r: any) => ({
             inventoryItemId: r.inventoryItemId,
             flowerNombre: r.nombre || r.flowerNombre, // Soporta ambos nombres de propiedad
             flowerPrecioCosto: r.precioCosto || r.flowerPrecioCosto,
             esFlorPrimaria: r.esFlorPrimaria,
             cantidad: r.cantidad,
          })),
        });
        setPrecioManual(true);
      } catch {
        showToast('No se pudo cargar el producto', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Load global catalogues for suggestions ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [catsRes, colsRes] = await Promise.all([
          AdminService.getCategorias(),
          AdminService.getCatalogos()
        ]);
        setAvailableCategories(catsRes.data);
        setAvailableCatalogos(colsRes.data);
      } catch (err) {
        console.error('Error al cargar catálogos globales:', err);
      }
    })();
  }, []);


  const set = (field: keyof ProductBody, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const addTag = (field: 'categorias' | 'catalogos', value: string, clear: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!(form[field] as string[]).includes(trimmed)) set(field, [...(form[field] as string[]), trimmed]);
    clear();
  };

  const removeTag = (field: 'categorias' | 'catalogos', tag: string) =>
    set(field, (form[field] as string[]).filter(t => t !== tag));

  // ── Recipe handlers ────────────────────────────────────────────────────────
  const addToRecipe = (item: InventoryItem) => {
    const exists = receta.find(r => r.inventoryItemId === item.id);
    if (exists) { showToast('Este insumo ya está en la receta', 'error'); return; }
    const resItem: RecipeItem = {
      inventoryItemId: item.id,
      flowerNombre: item.nombre,
      flowerPrecioCosto: item.precioCosto,
      esFlorPrimaria: item.esFlorPrimaria,
      cantidad: 1,
    };
    set('receta', [...receta, resItem]);
  };

  const updateRecipeCantidad = (inventoryItemId: string, cantidad: number) => {
    set('receta', receta.map(r => r.inventoryItemId === inventoryItemId ? { ...r, cantidad } : r));
  };

  const removeFromRecipe = (inventoryItemId: string) => {
    set('receta', receta.filter(r => r.inventoryItemId !== inventoryItemId));
  };



  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio.', 'error'); return; }
    if (form.precioBase <= 0) { showToast('El precio debe ser mayor a 0.', 'error'); return; }
    setShowConfirmModal(true);
  };

  // ── Save logic (executed after confirmation) ────────────────────────────────
  const confirmSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    /* 1. Si hay archivo seleccionado → subir a Cloudinary primero */
    let imagenUrl = form.imagenUrl ?? '';
    if (selectedImageFile) {
      setIsUploadingImage(true);
      try {
        imagenUrl = await uploadToCloudinary(selectedImageFile, 'Productos');
        setUploadedImageUrl(imagenUrl);
        set('imagenUrl', imagenUrl);
      } catch (err: any) {
        showToast(err.message || 'Error al subir imagen', 'error');
        setSaving(false);
        setIsUploadingImage(false);
        return;
      } finally {
        setIsUploadingImage(false);
      }
    }

    /* 2. Guardar en BD */
    const body: ProductBody = {
      ...form,
      imagenUrl,
      receta: form.receta?.map(r => ({
        inventoryItemId: r.inventoryItemId,
        cantidad: r.cantidad,
      })),
      activo: true
    };
    try {
      if (isEdit && id) {
        await AdminService.updateAdminProduct(id, body);
        showToast('Producto actualizado', 'success');
      } else {
        await AdminService.createAdminProduct(body);
        showToast('Producto creado', 'success');
      }
      navigate('/admin/catalogo');
    } catch {
      showToast('Error al guardar', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('¿Estás seguro de desactivar este producto? Ya no será visible en el catálogo.')) return;
    setSaving(true);
    try {
      // Usamos el estado actual del formulario pero marcamos como inactivo
      const body: ProductBody = {
        ...form,
        estado: 'INACTIVO',
        activo: false
      };

      await AdminService.updateAdminProduct(id, body);
      showToast('Producto desactivado correctamente', 'success');
      navigate('/admin/catalogo');
    } catch {
      showToast('Error al desactivar el producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500";
  const lbl = "text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 block";
  const sec = "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4 shadow-sm";
  const secTitle = "text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2";

  const totalImages = form.imagenUrl ? 1 : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-full dark:bg-slate-900">
      <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header fijo ── */}
      <FadeIn>
        <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 px-1 border-b border-slate-100 dark:border-slate-700 mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <AnimatedButton onClick={() => navigate('/admin/catalogo')} className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              Cancelar
            </AnimatedButton>
            <AnimatedButton onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-60">
              {saving
                ? <><RefreshCw className="w-4 h-4 animate-spin" />{isUploadingImage ? 'Subiendo...' : 'Guardando...'}</>
                : <><Save className="w-4 h-4" />{isEdit ? 'Guardar Cambios' : 'Crear Producto'}</>
              }
            </AnimatedButton>
            {isEdit && (
              <AnimatedButton
                onClick={handleDelete}
                disabled={saving}
                className="p-2.5 bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-all disabled:opacity-50"
                title="Desactivar producto"
              >
                <Trash2 className="w-5 h-5" />
              </AnimatedButton>
            )}
          </div>
        </div>
      </FadeIn>

      {/* ── Contenido scrollable ── */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-4">

            {/* Información básica */}
            <div className={sec}>
              <p className={secTitle}><Info className="w-3.5 h-3.5 text-blue-500" /> Información Básica</p>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Nombre <span className="text-red-500">*</span></label>
                  <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej. Ramo de Rosas Premium" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Descripción</label>
                  <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Describe el producto..." className={`${inp} resize-none h-16`} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={lbl}>Precio de Venta (Público) <span className="text-red-500">*</span></label>
                    {margenGanancia > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${margenGanancia > 40 ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'}`}>
                        Margen: {margenGanancia.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      value={form.precioBase}
                      onChange={e => { setPrecioManual(true); set('precioBase', Number(e.target.value)); }}
                      className={`${inp} pl-7 text-lg font-black text-blue-600 dark:text-blue-400`}
                      placeholder="0.00" min={0} step={0.01}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] text-slate-400">
                      Inversión en insumos: <strong className="text-slate-600 dark:text-slate-300">${costoTotalInsumos.toFixed(2)}</strong>
                    </p>
                    {precioSugerido > 0 && Math.abs(form.precioBase - precioSugerido) > 1 && (
                      <button type="button" onClick={() => { set('precioBase', parseFloat(precioSugerido.toFixed(2))); setPrecioManual(false); }} className="text-[10px] font-bold text-blue-500 dark:text-blue-400 underline hover:text-blue-700">Restaurar sugerido (${precioSugerido.toFixed(0)})</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Receta del arreglo */}
            <div className={sec}>
              <p className={secTitle}><FlaskConical className="w-3.5 h-3.5 text-indigo-500" /> Receta del Arreglo (Insumos)</p>

              {/* Inventory search */}
              <div className="mb-3">
                <label className={lbl}>Agregar insumo</label>
                <InventorySearch onSelect={addToRecipe} />
              </div>

              {/* Recipe rows */}
              {receta.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-700">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                          <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Insumo</th>
                          <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Tipo</th>
                          <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center w-24">Cantidad</th>
                          <th className="px-3 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Subtotal</th>
                          <th className="px-3 py-2.5 w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {receta.map(item => (
                          <tr key={item.inventoryItemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="px-3 py-2.5">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-800 dark:text-slate-200">{item.flowerNombre}</p>
                                  {item.esFlorPrimaria && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 rounded-full text-[9px] font-black">
                                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />Primaria
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">${item.flowerPrecioCosto.toFixed(2)} / unidad</p>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.esFlorPrimaria ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                {item.esFlorPrimaria ? 'Flor primaria' : 'Complemento'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <input
                                type="number"
                                value={item.cantidad}
                                onChange={e => updateRecipeCantidad(item.inventoryItemId, Number(e.target.value))}
                                min={1}
                                step={1}
                                className="w-20 px-2 py-1.5 text-center text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <span className={`text-sm font-black ${item.esFlorPrimaria ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                ${(item.cantidad * item.flowerPrecioCosto).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <button type="button" onClick={() => removeFromRecipe(item.inventoryItemId)} className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cost summary simplificado */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Inversión Total</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-200">${costoTotalInsumos.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/50 rounded-xl">
                      <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Precio Sugerido</p>
                      <p className="text-sm font-black text-blue-600 dark:text-blue-400">${precioSugerido.toFixed(2)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-300 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <FlaskConical className="w-8 h-8 mb-2" />
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Sin insumos en la receta</p>
                  <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Busca y agrega flores o insumos usando el campo de arriba</p>
                </div>
              )}
            </div>


            {/* Categorías y catálogos */}
            <div className={sec}>
              <p className={secTitle}><Tag className="w-3.5 h-3.5 text-amber-500" /> Categorías y Catálogos (Festividades)</p>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Categorías</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.categorias.map(cat => (
                      <span key={cat} className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 rounded-full text-xs font-bold">
                        {cat}<button type="button" onClick={() => removeTag('categorias', cat)}><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 relative">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={catInput}
                        onChange={e => { setCatInput(e.target.value); setShowCatSuggestions(true); }}
                        onFocus={() => setShowCatSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCatSuggestions(false), 200)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('categorias', catInput, () => { setCatInput(''); setShowCatSuggestions(false); }))}
                        placeholder="Nueva categoría o selecciona..."
                        className={`${inp} w-full`}
                      />
                      {showCatSuggestions && availableCategories.length > 0 && (
                        <div className="absolute z-30 bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                          {availableCategories
                            .filter(c => c.nombre.toLowerCase().includes(catInput.toLowerCase()))
                            .filter(c => !form.categorias.includes(c.nombre))
                            .map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => addTag('categorias', c.nombre, () => { setCatInput(''); setShowCatSuggestions(false); })}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300 transition-colors"
                              >
                                {c.nombre}
                              </button>
                            ))
                          }
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => addTag('categorias', catInput, () => { setCatInput(''); setShowCatSuggestions(false); })} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Catálogos (Festividades)</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.catalogos.map(col => (
                      <span key={col} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 rounded-full text-xs font-bold">
                        {col}<button type="button" onClick={() => removeTag('catalogos', col)}><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 relative">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={colInput}
                        onChange={e => { setColInput(e.target.value); setShowColSuggestions(true); }}
                        onFocus={() => setShowColSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowColSuggestions(false), 200)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag('catalogos', colInput, () => { setColInput(''); setShowColSuggestions(false); }))}
                        placeholder="Nuevo catálogo o selecciona..."
                        className={`${inp} w-full`}
                      />
                      {showColSuggestions && availableCatalogos.length > 0 && (
                        <div className="absolute z-30 bottom-full left-0 right-0 mb-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                          {availableCatalogos
                            .filter(c => c.nombre.toLowerCase().includes(colInput.toLowerCase()))
                            .filter(c => !form.catalogos.includes(c.nombre))
                            .map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => addTag('catalogos', c.nombre, () => { setColInput(''); setShowColSuggestions(false); })}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300 transition-colors"
                              >
                                {c.nombre}
                              </button>
                            ))
                          }
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => addTag('catalogos', colInput, () => { setColInput(''); setShowColSuggestions(false); })} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Imágenes */}
            <div className={sec}>
              <p className={secTitle}><ImagePlus className="w-3.5 h-3.5 text-pink-500" /> Imágenes del Producto</p>
              <ImageUploader
                label="Imagen principal"
                hint="Se subirá al presionar Guardar"
                onFileSelect={setSelectedImageFile}
                existingUrl={form.imagenUrl}
                isUploading={isUploadingImage}
                uploadedUrl={uploadedImageUrl}
              />
            </div>

            {/* Clasificación */}
            <div className={sec}>
              <p className={secTitle}><Layers className="w-3.5 h-3.5 text-purple-500" /> Clasificación</p>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Tipo</label>
                  <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inp}>
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Estado</label>
                  <select value={form.estado} onChange={e => set('estado', e.target.value)} className={inp}>
                    {ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Visibilidad</label>
                  <select value={form.visibilidad} onChange={e => set('visibilidad', e.target.value)} className={inp}>
                    {VISIBILIDAD_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Personalizable */}
            <div className={sec}>
              <p className={secTitle}><Settings className="w-3.5 h-3.5 text-emerald-500" /> Personalización</p>
              <div className="flex items-center gap-3">
                <div onClick={() => set('esPersonalizable', !form.esPersonalizable)} className="cursor-pointer">
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${form.esPersonalizable ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <span className={`absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow transition-transform ${form.esPersonalizable ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{form.esPersonalizable ? 'Habilitado' : 'Deshabilitado'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Permite personalizar colores, tamaño y mensaje.</p>
            </div>

            {/* Resumen */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resumen</p>
              </div>
              <div className="space-y-1.5 text-sm">
                {[
                  { label: 'Nombre', value: form.nombre || '—' },
                  { label: 'Precio', value: `$${form.precioBase.toLocaleString()}` },
                  { label: 'Tipo', value: TIPOS.find(t => t.value === form.tipo)?.label ?? form.tipo },
                  { label: 'Estado', value: ESTADOS.find(s => s.value === form.estado)?.label ?? form.estado },
                   { label: 'Imagen', value: form.imagenUrl ? '✓ Subida' : 'Sin imagen' },
                  { label: 'Insumos', value: String(receta.length) },
                  { label: 'Costo base', value: receta.length > 0 ? `$${costoBaseFloresPrimarias.toFixed(2)}` : '—' },
                  { label: 'Categorías', value: String(form.categorias.length) },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500">{row.label}</span>
                    <span className={`font-bold truncate max-w-[120px] ${row.label === 'Estado' && form.estado === 'ACTIVO' ? 'text-emerald-600 dark:text-emerald-400' : row.label === 'Costo base' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ── Modal de Confirmación ── */}
    <AnimatePresence>
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmModal(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Confirmar Datos</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Verifica que todo esté correcto antes de {isEdit ? 'actualizar' : 'crear'}.</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Resumen del Producto</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                  {[
                    { label: 'Nombre', value: form.nombre || '—' },
                    { label: 'Precio', value: `$${form.precioBase.toLocaleString()}`, highlight: true },
                    { label: 'Tipo', value: TIPOS.find(t => t.value === form.tipo)?.label ?? form.tipo },
                    { label: 'Estado', value: ESTADOS.find(s => s.value === form.estado)?.label ?? form.estado },
                    { label: 'Imagen', value: (selectedImageFile || form.imagenUrl) ? '✓ Lista para subir' : 'Sin imagen' },
                    { label: 'Insumos', value: `${receta.length} items` },
                    { label: 'Costo base', value: `$${costoBaseFloresPrimarias.toFixed(2)}` },
                    { label: 'Categorías', value: form.categorias.length > 0 ? form.categorias.join(', ') : 'Ninguna' },
                  ].map(row => (
                    <div key={row.label} className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{row.label}</span>
                      <span className={`text-sm font-bold truncate ${row.highlight ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-700 dark:text-slate-200'}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 text-sm font-bold rounded-2xl transition-all"
                >
                  Regresar y editar
                </button>
                <button
                  type="button"
                  onClick={confirmSave}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Confirmar y Guardar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}

