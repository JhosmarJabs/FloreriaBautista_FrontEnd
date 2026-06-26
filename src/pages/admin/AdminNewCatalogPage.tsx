import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Library, 
  ImageIcon, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  Loader2,
  Calendar,
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { FadeIn, AnimatedButton } from '../../components/Animations';
import ImageUploader from '../../components/ImageUploader';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { useToast } from '../../hooks/useToast';
import { AdminService } from '../../services/adminService';

const labelBase = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5';
const inputBase = 'w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition-all focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 placeholder:text-slate-400 dark:placeholder:text-slate-600';

interface CatalogForm {
  nombre: string;
  descripcion: string;
  temporada: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'PROGRAMADO';
  imagenUrl: string;
  productosIds: string[];
}

export default function AdminNewCatalogPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [form, setForm] = useState<CatalogForm>({
    nombre: '',
    descripcion: '',
    temporada: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'ACTIVO',
    imagenUrl: '',
    productosIds: [],
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  // Búsqueda de productos y listado general
  const [busquedaProd, setBusquedaProd] = useState('');
  const [productos, setProductos] = useState<any[]>([]);
  const [loadingProds, setLoadingProds] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      const fetchCatalog = async () => {
        setLoading(true);
        try {
          const res = await AdminService.getCatalogoById(id);
          const cat = res.data;
          setForm({
            nombre: cat.nombre || '',
            descripcion: cat.descripcion || '',
            temporada: cat.temporada || '',
            fechaInicio: cat.fechaInicio ? cat.fechaInicio.split('T')[0] : '',
            fechaFin: cat.fechaFin ? cat.fechaFin.split('T')[0] : '',
            estado: cat.estado === 'ACTIVA' ? 'ACTIVO' : (cat.estado === 'INACTIVA' ? 'INACTIVO' : 'PROGRAMADO'),
            imagenUrl: cat.imagenUrl || '',
            productosIds: cat.productCatalogos ? cat.productCatalogos.map((pc: any) => pc.productId) : [],
          });
        } catch (error) {
          console.error("Error al cargar catálogo:", error);
          showToast('Error al cargar el catálogo', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchCatalog();
    }
  }, [id, isEdit]);

  useEffect(() => {
    const fetchProds = async () => {
      setLoadingProds(true);
      try {
        const res = await AdminService.getAdminProducts({ size: 150 });
        setProductos(res.data.items || []);
      } catch (error) {
        console.error("Error al obtener productos:", error);
      } finally {
        setLoadingProds(false);
      }
    };
    fetchProds();
  }, []);

  const productosDisponibles = React.useMemo(() => {
    if (busquedaProd.length < 2) return [];
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()) &&
      !form.productosIds.includes(p.id)
    );
  }, [productos, busquedaProd, form.productosIds]);

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      showToast('El nombre del catálogo es obligatorio', 'error');
      return;
    }
    
    setSaving(true);
    let finalImageUrl = form.imagenUrl;

    if (selectedFile) {
      setIsUploading(true);
      try {
        finalImageUrl = await uploadToCloudinary(selectedFile, 'Catalogos');
        setUploadedUrl(finalImageUrl);
      } catch (err: any) {
        showToast('Error al subir la imagen', 'error');
        setSaving(false);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        estado: form.estado === 'ACTIVO' ? 'ACTIVA' : (form.estado === 'PROGRAMADO' ? 'PROGRAMADA' : 'INACTIVA'),
        activo: form.estado === 'ACTIVO',
        imagenUrl: finalImageUrl,
        productCatalogos: form.productosIds.map(pid => ({ productId: pid }))
      };

      if (isEdit && id) {
        await AdminService.updateCatalog(id, payload);
        setSuccess(true);
        showToast('Catálogo actualizado con éxito', 'success');
        setTimeout(() => navigate('/admin/catalogos'), 1500);
      } else {
        await AdminService.createCatalog(payload);
        setSuccess(true);
        showToast('Catálogo creado con éxito', 'success');
        setTimeout(() => navigate('/admin/catalogos'), 1500);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error al guardar el catálogo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addProduct = (prod: any) => {
    if (!form.productosIds.includes(prod.id)) {
      setForm(prev => ({
        ...prev,
        productosIds: [...prev.productosIds, prod.id]
      }));
    }
    setBusquedaProd('');
  };

  const removeProduct = (prodId: string) => {
    setForm(prev => ({
      ...prev,
      productosIds: prev.productosIds.filter(pid => pid !== prodId)
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/catalogos')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isEdit ? 'Editar Catálogo' : 'Nuevo Catálogo'}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Define una colección de productos por temporada</p>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: General Info */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-6"
          >
            <div>
              <label className={labelBase}>Nombre del Catálogo *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. San Valentín 2026, Especial Otoño..."
                className={inputBase}
              />
            </div>

            <div>
              <label className={labelBase}>Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Breve detalle de lo que incluye este catálogo..."
                rows={3}
                className={`${inputBase} resize-none`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelBase}>Temporada / Época</label>
                <input
                  type="text"
                  value={form.temporada}
                  onChange={e => setForm({ ...form, temporada: e.target.value })}
                  placeholder="Ej. Mayo, Primavera, Navidad..."
                  className={inputBase}
                />
              </div>
              <div>
                <label className={labelBase}>Estado</label>
                <select
                  value={form.estado}
                  onChange={e => setForm({ ...form, estado: e.target.value as any })}
                  className={inputBase}
                >
                  <option value="ACTIVO">Activo (Visible en tienda)</option>
                  <option value="PROGRAMADO">Programado (Aparecerá después)</option>
                  <option value="INACTIVO">Inactivo (Oculto)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelBase}>Fecha Inicio</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={e => setForm({ ...form, fechaInicio: e.target.value })}
                    className={`${inputBase} pl-10`}
                  />
                </div>
              </div>
              <div>
                <label className={labelBase}>Fecha Fin (Opcional)</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={form.fechaFin}
                    onChange={e => setForm({ ...form, fechaFin: e.target.value })}
                    className={`${inputBase} pl-10`}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Product Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Productos en Colección</h3>
                <p className="text-[10px] text-slate-400 font-medium">({form.productosIds.length}) productos seleccionados</p>
              </div>
              <Library className="w-5 h-5 text-amber-500" />
            </div>

            <div className="p-6 space-y-4">
              {/* Product search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar productos para agregar..."
                  value={busquedaProd}
                  onChange={e => setBusquedaProd(e.target.value)}
                  className={`${inputBase} pl-10`}
                />
                
                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {(productosDisponibles.length > 0 || loadingProds) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
                    >
                      {loadingProds ? (
                        <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-amber-500" /></div>
                      ) : (
                        productosDisponibles.map(p => (
                          <button
                            key={p.id}
                            onClick={() => addProduct(p)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-left transition-colors"
                          >
                            <img src={p.imagenUrl} className="w-8 h-8 rounded object-cover" alt="" />
                            <div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.nombre}</p>
                              <p className="text-[10px] text-slate-400">${p.precioBase}</p>
                            </div>
                            <Plus className="w-3 h-3 ml-auto text-amber-500" />
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selected Products List */}
              <div className="space-y-2">
                {form.productosIds.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                    <Library className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No has agregado productos a este catálogo</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {form.productosIds.map(pid => {
                      const prod = productos.find(p => p.id === pid);
                      return (
                        <div key={pid} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 group">
                          {prod?.imagenUrl ? (
                            <img src={prod.imagenUrl} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center">
                              <Library className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate block">
                              {prod ? prod.nombre : `Producto ID: ${pid.slice(-6)}`}
                            </span>
                            {prod && (
                              <span className="text-[10px] text-slate-400 font-semibold block">
                                ${prod.precioBase}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => removeProduct(pid)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Image & Action */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6"
          >
            <ImageUploader
              label="Banner de Catálogo"
              hint="Formatos JPG, PNG, WEBP"
              onFileSelect={setSelectedFile}
              isUploading={isUploading}
              existingUrl={form.imagenUrl}
              uploadedUrl={uploadedUrl}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-tighter">Publicación Directa</h4>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed mb-6 font-medium">
              Al guardar, este catálogo aparecerá inmediatamente en la tienda si su estado es <strong>ACTIVO</strong>. Asegúrate de que las fechas coincidan con tu temporada.
            </p>

            <AnimatedButton
              onClick={handleSubmit}
              disabled={saving || success}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold shadow-lg transition-all ${
                success
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
              } disabled:opacity-70`}
            >
              <AnimatePresence mode="wait">
                {saving ? (
                  <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />Guardando...
                  </motion.span>
                ) : success ? (
                  <motion.span key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />¡Completado!
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />{isEdit ? 'Actualizar' : 'Crear Catálogo'}
                  </motion.span>
                )}
              </AnimatePresence>
            </AnimatedButton>
          </motion.div>

          {isEdit && (
            <button className="w-full flex items-center justify-center gap-2 py-3 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/50 rounded-xl text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all">
              <Trash2 className="w-4 h-4" /> Eliminar permanentemente
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
