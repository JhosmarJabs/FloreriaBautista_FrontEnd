import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Save, AlertCircle, CheckCircle2, Loader2, RefreshCw, Trash2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminService } from '../../services/adminService';
import { ProductBody } from '../../types';
import { FadeIn, AnimatedButton } from '../../components/Animations';
import ImageUploader from '../../components/ImageUploader';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { useToast } from '../../hooks/useToast';
import { useNavigate, useParams } from 'react-router-dom';

const TIPOS = ['Insumos', 'Accesorios', 'Bases', 'Follaje', 'Flores', 'Empaque', 'Otros'];
const UNIDADES = ['PIEZA', 'PAQUETE', 'METRO', 'ROLLO', 'CAJA', 'DOCENA', 'TALLO'];

const inputBase =
  'w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400 dark:placeholder:text-slate-600';
const labelBase = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5';

function FieldLabel({ children, hint, required }: { children: React.ReactNode; hint?: string; required?: boolean }) {
  return (
    <div className="mb-1.5">
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {children}{required && <span className="text-rose-400"> *</span>}
      </label>
      {hint && <p className="text-[11px] font-normal normal-case text-slate-400 dark:text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function GroupCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60 rounded-xl p-5 space-y-4">
      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

type FormState = {
  nombre: string;
  sucursal: string;
  stockActual: string;
  stockMinimo: string;
  unidadMedida: string;
  sumaAlCosto: boolean;
  precioCosto: string;
  esFlorPrimaria: boolean;
  imagenUrl: string; // La guardamos en el estado local aunque el backend actual no la persista aún
};

type FieldError = Partial<Record<keyof FormState, string>>;

export default function AdminNewInsumoPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [form, setForm] = useState<FormState>({
    nombre:         '',
    sucursal:       'Sucursal Principal',
    stockActual:    '0',
    stockMinimo:    '10',
    unidadMedida:   'PIEZA',
    sumaAlCosto:    true,
    precioCosto:    '0',
    esFlorPrimaria: false,
    imagenUrl:      '',
  });

  /* ── Imagen ── */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading]   = useState(false);
  const [uploadedUrl, setUploadedUrl]   = useState<string>('');

  const [errors, setErrors]   = useState<FieldError>({});
  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Cargar datos si es edición ──
  useEffect(() => {
    if (isEdit && id) {
      const fetchItem = async () => {
        try {
          const res = await AdminService.getAdminInventoryItemById(id);
          const item = res.data;
          if (item) {
            setForm({
              nombre:       item.nombre,
              sucursal:     item.sucursal,
              stockActual:  String(item.stockActual),
              stockMinimo:  String(item.stockMinimo),
              unidadMedida: item.unidadMedida,
              sumaAlCosto:  item.sumaAlCosto,
              precioCosto:  String(item.precioCosto),
              esFlorPrimaria: item.esFlorPrimaria,
              imagenUrl:    item.imagenUrl || '',
            });
          }
        } catch {
          showToast('Error al cargar datos del insumo', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchItem();
    }
  }, [id, isEdit, showToast]);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FieldError = {};
    if (!form.nombre.trim())   newErrors.nombre      = 'El nombre es obligatorio';
    if (!form.sucursal.trim()) newErrors.sucursal    = 'La sucursal es obligatoria';
    
    const actual = parseInt(form.stockActual);
    if (isNaN(actual) || actual < 0) newErrors.stockActual = 'Stock inválido';
    
    const min = parseInt(form.stockMinimo);
    if (isNaN(min) || min < 0)       newErrors.stockMinimo = 'Mínimo inválido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    let imagenUrl = '';

    /* 1. Si hay archivo seleccionado → subir a Cloudinary */
    if (selectedFile) {
      setIsUploading(true);
      try {
        imagenUrl = await uploadToCloudinary(selectedFile, 'Insumos');
        setUploadedUrl(imagenUrl);
      } catch (err: any) {
        showToast(`Error al subir imagen: ${err.message ?? 'desconocido'}`, 'error');
        setSaving(false);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else {
      imagenUrl = form.imagenUrl; // Mantener la existente si no se cambió
    }

    /* 2. Guardar en INVENTARIO */
    try {
      const body = {
        nombre:         form.nombre.trim(),
        stockActual:    parseInt(form.stockActual),
        stockMinimo:    parseInt(form.stockMinimo),
        sucursal:       form.sucursal,
        sumaAlCosto:    form.sumaAlCosto,
        unidadMedida:   form.unidadMedida,
        precioCosto:    parseFloat(form.precioCosto) || 0,
        esFlorPrimaria: form.esFlorPrimaria,
        imagenUrl:      imagenUrl || null
      };

      if (isEdit && id) {
        // En backend AdminInventoryController no tiene PUT aún mapeado en el servicio frontend?
        // Revisamos adminService.ts... Sí, hay que añadirlo.
        await AdminService.updateInventoryItem(id, body);
        showToast('Insumo actualizado correctamente', 'success');
      } else {
        await AdminService.createInventoryItem(body);
        showToast('Insumo registrado en inventario correctamente', 'success');
      }
      
      setSuccess(true);
      setTimeout(() => navigate('/admin/inventario'), 1500);
    } catch (err: any) {
      showToast(`Error al guardar: ${err.message ?? 'desconocido'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('¿Estás seguro de desactivar este insumo? No se borrarán los registros históricos, pero ya no aparecerá en el inventario activo.')) return;
    try {
      setSaving(true);
      await AdminService.deleteInventoryItem(id);
      showToast('Insumo eliminado con éxito', 'success');
      navigate('/admin/inventario');
    } catch (err: any) {
      showToast(`Error al eliminar: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 w-full h-full">

      {/* ── HEADER ── */}
      <FadeIn>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/inventario')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isEdit ? 'Editar Insumo' : 'Nuevo Insumo'}
            </h1>
          </div>
        </div>
      </FadeIn>

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-blue-400 dark:text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando datos del insumo...</p>
        </div>
      ) : (
        <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">

        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Configuración de inventario</p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, esFlorPrimaria: !prev.esFlorPrimaria }))}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-colors ${form.esFlorPrimaria ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-amber-700 dark:group-hover:text-amber-300'}`}>
                <Star className={`w-4 h-4 ${form.esFlorPrimaria ? 'fill-amber-400 text-amber-400' : ''}`} /> Flor Primaria
              </span>
            </button>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={form.sumaAlCosto}
                onChange={(e) => setForm(prev => ({ ...prev, sumaAlCosto: e.target.checked }))}
                className="size-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900"
              />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors uppercase tracking-widest">Suma al costo</span>
            </label>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">

          {/* Columna Izquierda: Formulario */}
          <div className="space-y-6">

            <GroupCard title="Información general">
              {/* Nombre */}
              <div>
                <FieldLabel required hint="Así aparecerá en catálogos y recetas">¿Cómo se llama este insumo?</FieldLabel>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={set('nombre')}
                  className={`${inputBase} ${errors.nombre ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-400' : ''}`}
                  placeholder="Ej. Espuma floral verde, Cinta dorada, Base cerámica..."
                />
                {errors.nombre && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.nombre}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Sucursal */}
                <div>
                  <FieldLabel required hint="Sucursal o almacén donde se guarda">¿Dónde se guarda?</FieldLabel>
                  <select
                    value={form.sucursal}
                    onChange={set('sucursal')}
                    className={`${inputBase} ${errors.sucursal ? 'border-rose-400' : ''}`}
                  >
                    <option value="Sucursal Principal">Sucursal Principal</option>
                    <option value="Almacen">Almacén</option>
                  </select>
                </div>

                {/* Unidad de Medida */}
                <div>
                  <FieldLabel required hint="Ej. pieza, metro, paquete...">¿Cómo se mide o se cuenta?</FieldLabel>
                  <select
                    value={form.unidadMedida}
                    onChange={set('unidadMedida')}
                    className={inputBase}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </GroupCard>

            <GroupCard title="Inventario y costo">
              <div className="grid grid-cols-3 gap-4">
                {/* Stock Actual */}
                <div>
                  <FieldLabel required hint="Cantidad disponible ahora">¿Cuántos hay?</FieldLabel>
                  <input
                    type="number"
                    value={form.stockActual}
                    onChange={set('stockActual')}
                    className={`${inputBase} ${errors.stockActual ? 'border-rose-400' : ''}`}
                  />
                </div>

                {/* Stock Mínimo */}
                <div>
                  <FieldLabel required hint="Si baja de aquí, se avisa">¿Cuándo avisar?</FieldLabel>
                  <input
                    type="number"
                    value={form.stockMinimo}
                    onChange={set('stockMinimo')}
                    className={`${inputBase} ${errors.stockMinimo ? 'border-rose-400' : ''}`}
                  />
                </div>

                {/* Precio Costo */}
                <div>
                  <FieldLabel required hint="Costo de compra por unidad">¿Cuánto cuesta cada uno?</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-500 text-xs">$</span>
                    <input
                      type="number"
                      value={form.precioCosto}
                      onChange={set('precioCosto')}
                      className={`${inputBase} pl-6`}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </GroupCard>
          </div>

          {/* Columna Derecha: Imagen */}
          <div className="h-full">
            <ImageUploader
              label="Imagen del insumo"
              hint="Se subirá al presionar Guardar"
              onFileSelect={setSelectedFile}
              isUploading={isUploading}
              existingUrl={isEdit ? form.imagenUrl : undefined}
              uploadedUrl={uploadedUrl}
              square
            />
          </div>

        </div>

        {/* Footer acciones */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          {isEdit && (
            <button
              type="button"
              disabled={saving}
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar Insumo
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={() => navigate('/admin/inventario')}
            className="px-5 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
            Cancelar
          </button>

          <AnimatedButton
            onClick={handleSubmit}
            disabled={saving || success}
            className={`flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all ${
              success
                ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/25'
            } disabled:opacity-70`}>
            <AnimatePresence mode="wait">
              {isUploading ? (
                <motion.span key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />Subiendo imagen...
                </motion.span>
              ) : saving ? (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />Guardando...
                </motion.span>
              ) : success ? (
                <motion.span key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />¡Guardado!
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />{isEdit ? 'Guardar Cambios' : 'Registrar Insumo'}
                </motion.span>
              )}
            </AnimatePresence>
          </AnimatedButton>
        </div>
      </motion.div>
      )}
    </div>
  );
}
