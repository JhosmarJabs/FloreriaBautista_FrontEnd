import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Tag, 
  Gift, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  Calendar,
  X,
  AlertCircle,
  Percent,
  DollarSign,
  Package,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { FadeIn, AnimatedButton } from '../../components/Animations';
import { useToast } from '../../hooks/useToast';
import { AdminService } from '../../services/adminService';

const labelBase = 'block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5';
const inputBase = 'w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition-all focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 placeholder:text-slate-400 dark:placeholder:text-slate-600';

interface PromotionForm {
  nombre: string;
  codigo: string;
  tipo: 'PORCENTAJE' | 'MONTO_FIJO' | 'COMBO';
  valor: string;
  minimoCompra: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'PROGRAMADO';
  fechaInicio: string;
  fechaFin: string;
  maxUsos: string;
  aplicarAMuchos: boolean; // Si se aplica a todos los productos o seleccionados
  productosIds: string[];
}

export default function AdminNewPromotionPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [form, setForm] = useState<PromotionForm>({
    nombre: '',
    codigo: '',
    tipo: 'PORCENTAJE',
    valor: '',
    minimoCompra: '0',
    estado: 'ACTIVO',
    fechaInicio: '',
    fechaFin: '',
    maxUsos: '',
    aplicarAMuchos: true,
    productosIds: [],
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      AdminService.getAdminPromotionById(id)
        .then(res => {
          const p = res.data;
          setForm({
            nombre: p.nombre,
            codigo: p.codigo ?? '',
            tipo: p.tipo,
            valor: String(p.valor ?? ''),
            minimoCompra: String(p.minimoCompra ?? '0'),
            estado: p.estado,
            fechaInicio: p.fechaInicio ? p.fechaInicio.slice(0, 10) : '',
            fechaFin: p.fechaFin ? p.fechaFin.slice(0, 10) : '',
            maxUsos: p.maxUsos != null ? String(p.maxUsos) : '',
            aplicarAMuchos: p.aplicarATodaLaTienda,
            productosIds: [],
          });
        })
        .catch(err => showToast(err.message || 'No se pudo cargar la promoción', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      showToast('El nombre de la promoción es obligatorio', 'error');
      return;
    }
    if (form.tipo !== 'COMBO' && !form.codigo.trim()) {
      showToast('El código de cupón es necesario', 'error');
      return;
    }

    setSaving(true);
    try {
      const body = {
        nombre: form.nombre.trim(),
        codigo: form.tipo === 'COMBO' ? null : form.codigo.trim(),
        tipo: form.tipo,
        valor: Number(form.valor) || 0,
        minimoCompra: Number(form.minimoCompra) || 0,
        estado: form.estado,
        fechaInicio: form.fechaInicio || null,
        fechaFin: form.fechaFin || null,
        maxUsos: form.maxUsos ? Number(form.maxUsos) : null,
        aplicarATodaLaTienda: form.aplicarAMuchos,
      };

      if (isEdit && id) {
        await AdminService.updateAdminPromotion(id, body);
      } else {
        await AdminService.createAdminPromotion(body);
      }

      setSuccess(true);
      showToast(isEdit ? 'Promoción actualizada' : 'Promoción creada con éxito', 'success');
      setTimeout(() => navigate('/admin/promociones'), 1500);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar la promoción', 'error');
    } finally {
      setSaving(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm(prev => ({ ...prev, codigo: code }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/promociones')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isEdit ? 'Editar Promoción' : 'Nueva Oferta / Cupón'}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Configura incentivos de venta y cupones de fidelidad</p>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Config */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6 space-y-6"
          >
            {/* Promotion Type Selector */}
            <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              {[
                { id: 'PORCENTAJE', icon: Percent, label: 'Porcentaje' },
                { id: 'MONTO_FIJO', icon: DollarSign, label: 'Monto Fijo' },
                { id: 'COMBO', icon: Package, label: 'Combo / Regalo' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setForm({ ...form, tipo: t.id as any })}
                  className={`flex flex-col items-center justify-center py-4 rounded-xl transition-all ${
                    form.tipo === t.id 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <t.icon className={`w-5 h-5 mb-1.5 ${form.tipo === t.id ? 'stroke-[3]' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelBase}>Nombre de la Promoción *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Cupón Bienvenida, Promo Especial 10 de Mayo..."
                  className={inputBase}
                />
              </div>
              
              <div>
                <label className={labelBase}>Código de Cupón</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                    placeholder="PROMOCLAUDIO"
                    disabled={form.tipo === 'COMBO'}
                    className={`${inputBase} font-mono uppercase text-rose-600 dark:text-rose-400`}
                  />
                  <button
                    onClick={generateCode}
                    disabled={form.tipo === 'COMBO'}
                    className="px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase transition-all"
                  >
                    Generar
                  </button>
                </div>
              </div>

              <div>
                <label className={labelBase}>{form.tipo === 'PORCENTAJE' ? 'Porcentaje de descuento %' : 'Valor del descuento / Regalo'}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    {form.tipo === 'PORCENTAJE' ? '%' : '$'}
                  </span>
                  <input
                    type="number"
                    value={form.valor}
                    onChange={e => setForm({ ...form, valor: e.target.value })}
                    placeholder="0"
                    disabled={form.tipo === 'COMBO'}
                    className={`${inputBase} pl-8`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
               <div>
                  <label className={labelBase}>Fecha Inicio</label>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={e => setForm({ ...form, fechaInicio: e.target.value })}
                    className={inputBase}
                  />
               </div>
               <div>
                  <label className={labelBase}>Fecha Fin (Vencimiento)</label>
                  <input
                    type="date"
                    value={form.fechaFin}
                    onChange={e => setForm({ ...form, fechaFin: e.target.value })}
                    className={inputBase}
                  />
               </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Reglas de Aplicación</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelBase}>Compra Mínima (MXN)</label>
                  <input
                    type="number"
                    value={form.minimoCompra}
                    onChange={e => setForm({ ...form, minimoCompra: e.target.value })}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className={labelBase}>Límite de Usos Totales</label>
                  <input
                    type="number"
                    value={form.maxUsos}
                    onChange={e => setForm({ ...form, maxUsos: e.target.value })}
                    placeholder="Infinito si está vacío"
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={form.aplicarAMuchos}
                    onChange={(e) => setForm(prev => ({ ...prev, aplicarAMuchos: e.target.checked }))}
                    className="size-5 rounded border-rose-300 dark:border-slate-600 text-rose-600 focus:ring-rose-500 bg-white dark:bg-slate-900"
                  />
                   <div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">Aplicar a toda la tienda</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Si se desmarca, podrás elegir productos específicos</span>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6"
          >
            <label className={labelBase}>Estado de la Promoción</label>
            <div className="space-y-2 mt-4">
              {['ACTIVO', 'PROGRAMADO', 'INACTIVO'].map(s => (
                <button
                  key={s}
                  onClick={() => setForm({...form, estado: s as any})}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    form.estado === s 
                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-widest">{s}</span>
                  {form.estado === s && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Banner mockup / Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-6 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden group"
          >
            <Tag className="absolute -top-4 -right-4 w-24 h-24 text-white/10 rotate-12" />
            
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-6 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Previsualización
            </p>

            <div className="relative z-10 text-center py-4">
              <h4 className="text-xl font-black tracking-tighter mb-1">
                {form.nombre || 'Nombre de la Oferta'}
              </h4>
              <p className="text-xs font-medium opacity-90 mb-6">
                 {form.tipo === 'PORCENTAJE' ? `Obtén un ${form.valor || '0'}% de descuento` : 
                  form.tipo === 'MONTO_FIJO' ? `Ahorra $${form.valor || '0'} en tu compra` : 
                  'Combo especial limitado'}
              </p>
              
              {form.codigo && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 border-dashed">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Usa el código</p>
                  <p className="text-2xl font-mono font-black tracking-[0.1em]">{form.codigo}</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold opacity-60">
                {form.fechaFin ? `Expira: ${new Date(form.fechaFin).toLocaleDateString()}` : 'Oferta por tiempo limitado'}
              </span>
              <Gift className="w-4 h-4 opacity-60" />
            </div>
          </motion.div>

          <AnimatedButton
            onClick={handleSubmit}
            disabled={saving || success}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-black shadow-2xl transition-all ${
              success
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-800 dark:border-white'
            } active:scale-[0.98] disabled:opacity-70`}
          >
            <AnimatePresence mode="wait">
              {saving ? (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />Configurando...
                </motion.span>
              ) : success ? (
                <motion.span key="ok" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />¡Publicado!
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 uppercase tracking-widest">
                  {isEdit ? 'Actualizar Oferta' : 'Lanzar Promoción'}
                  <ChevronRight className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </AnimatedButton>

          {isEdit && form.estado !== 'INACTIVO' && (
            <button
              onClick={async () => {
                if (!id) return;
                setSaving(true);
                try {
                  const body = {
                    nombre: form.nombre.trim(),
                    codigo: form.tipo === 'COMBO' ? null : form.codigo.trim(),
                    tipo: form.tipo,
                    valor: Number(form.valor) || 0,
                    minimoCompra: Number(form.minimoCompra) || 0,
                    estado: 'INACTIVO' as const,
                    fechaInicio: form.fechaInicio || null,
                    fechaFin: form.fechaFin || null,
                    maxUsos: form.maxUsos ? Number(form.maxUsos) : null,
                    aplicarATodaLaTienda: form.aplicarAMuchos,
                  };
                  await AdminService.updateAdminPromotion(id, body);
                  setForm(prev => ({ ...prev, estado: 'INACTIVO' }));
                  showToast('Promoción desactivada', 'success');
                } catch (err: any) {
                  showToast(err.message || 'Error al desactivar la promoción', 'error');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" /> Desactivar
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
