import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Trash2,
  Plus,
  Save,
  Calendar,
  Heart,
  Sparkles,
  Leaf,
  Gift,
  Layout,
  PlusCircle,
  ChevronRight,
  ShoppingBag,
  Palette,
  Edit3,
  CheckCircle2,
  Info,
  ArrowLeft,
  MousePointer2,
  Monitor,
  Smartphone,
  Layers,
  Zap,
  Search,
  Loader2,
  Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn, ScaleIn } from '../../components/Animations';
import { useToast } from '../../hooks/useToast';
import { AdminService } from '../../services/adminService';

/* ── Tipos ──────────────────────────────────────────────── */
// El nombre y precio se resuelven siempre desde el producto real (backend);
// aquí solo se cachean para mostrarlos mientras se edita, nunca se envían al guardar.
type QuickItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  icon: string;
  color: string;
};

type QuickTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: QuickItem[];
};

const ICON_MAP_OPTIONS = [
  { id: 'Sparkles', icon: <Sparkles />, label: 'Destellos' },
  { id: 'Leaf', icon: <Leaf />, label: 'Botánico' },
  { id: 'Gift', icon: <Gift />, label: 'Regalo' },
  { id: 'Heart', icon: <Heart />, label: 'Amor' },
  { id: 'Calendar', icon: <Calendar />, label: 'Fecha' },
  { id: 'Layout', icon: <Layout />, label: 'General' },
  { id: 'ShoppingBag', icon: <ShoppingBag />, label: 'Bolsa' },
];

const COLOR_OPTIONS = [
  { id: 'emerald', label: 'Esmeralda', bg: 'bg-emerald-500', hex: '#10b981', light: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'rose', label: 'Rosa Flor', bg: 'bg-rose-500', hex: '#f43f5e', light: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400' },
  { id: 'amber', label: 'Ámbar Sol', bg: 'bg-amber-500', hex: '#f59e0b', light: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  { id: 'blue', label: 'Azul FB', bg: 'bg-[#1e3a5f]', hex: '#1e3a5f', light: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-[#1e3a5f] dark:text-blue-400' },
  { id: 'indigo', label: 'Índigo', bg: 'bg-indigo-500', hex: '#6366f1', light: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'slate', label: 'Mineral', bg: 'bg-slate-500', hex: '#64748b', light: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400' },
];

const renderIcon = (iconName: string, className = "w-5 h-5") => {
  const IconData = ICON_MAP_OPTIONS.find(i => i.id === iconName);
  const Icon = IconData?.icon || <Layout />;
  return React.cloneElement(Icon as React.ReactElement, { className });
};

const newLocalItemId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const fromDto = (t: any): QuickTemplate => ({
  id: t.id,
  name: t.nombre,
  description: t.descripcion ?? '',
  icon: t.icono || 'Sparkles',
  items: (t.items || []).map((i: any) => ({
    id: i.id,
    productId: i.productId,
    name: i.nombre,
    price: i.precio,
    icon: i.icono || 'Sparkles',
    color: i.color || 'blue',
  })),
});

export default function QuickSaleTemplatesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<QuickTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<QuickTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  // Modal de productos del endpoint
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchProducts, setSearchProducts] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await AdminService.getQuickSaleTemplates();
      const mapped = (response.data || []).map(fromDto);
      setTemplates(mapped);
    } catch (error) {
      console.error('Error loading quick sale templates:', error);
      showToast('Error al cargar las plantillas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    setCreating(true);
    try {
      const response = await AdminService.createQuickSaleTemplate({
        nombre: 'Nueva Configuración',
        descripcion: 'Define botones rápidos para una temporada o evento.',
        icono: 'Layout',
        items: [],
      });
      const created = fromDto(response.data);
      setTemplates(prev => [...prev, created]);
      setEditingTemplate(created);
      showToast('Nueva terminal de botones creada', 'success');
    } catch (error) {
      console.error('Error creating template:', error);
      showToast('Error al crear la plantilla', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Deseas eliminar permanentemente esta configuración?')) return;
    try {
      await AdminService.deleteQuickSaleTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (editingTemplate?.id === id) setEditingTemplate(null);
      showToast('Configuración eliminada correctamente', 'info');
    } catch (error) {
      console.error('Error deleting template:', error);
      showToast('Error al eliminar la plantilla', 'error');
    }
  };

  const updateItem = (itemId: string, field: 'icon' | 'color', value: string) => {
    if (!editingTemplate) return;
    const newItems = editingTemplate.items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setEditingTemplate({ ...editingTemplate, items: newItems });
  };

  const removeItemFromEdit = (itemId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      items: editingTemplate.items.filter(i => i.id !== itemId)
    });
  };

  const saveEditChanges = async () => {
    if (!editingTemplate) return;
    setSaving(true);
    try {
      const response = await AdminService.updateQuickSaleTemplate(editingTemplate.id, {
        nombre: editingTemplate.name,
        descripcion: editingTemplate.description,
        icono: editingTemplate.icon,
        items: editingTemplate.items.map(i => ({
          productId: i.productId,
          icono: i.icon,
          color: i.color,
        })),
      });
      const updated = fromDto(response.data);
      setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      setEditingTemplate(updated);
      showToast('Terminal sincronizada con el punto de venta', 'success');
    } catch (error) {
      console.error('Error saving template:', error);
      showToast('Error al guardar los cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  const loadProductsFromEndpoint = async () => {
    setLoadingProducts(true);
    try {
      const response = await AdminService.getProducts({ size: 500 });
      setProducts(response.data.items || []);
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('Error al cargar productos', 'error');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProductFromCatalog = (product: any) => {
    if (!editingTemplate) return;

    const newItem: QuickItem = {
      id: newLocalItemId(),
      productId: product.id,
      name: product.nombre || product.name,
      price: product.precioBase ?? product.precio ?? product.price ?? 0,
      icon: 'Sparkles',
      color: 'blue'
    };

    setEditingTemplate({
      ...editingTemplate,
      items: [...editingTemplate.items, newItem]
    });

    showToast(`${newItem.name} agregado a la plantilla`, 'success');
  };

  const filteredProducts = products.filter(p =>
    (p.nombre || p.name || '').toLowerCase().includes(searchProducts.toLowerCase())
  );

  const handleOpenProductsModal = async () => {
    setShowProductsModal(true);
    if (products.length === 0) {
      await loadProductsFromEndpoint();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-[#1e3a5f] animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-serif italic animate-pulse">Cargando terminal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-32 relative">
      {/* ── BACKGROUND ORNAMENT ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
      </div>

      {/* ── HEADER NAVIGATION ── */}
      <FadeIn>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl p-6 rounded-[2rem] shadow-sm border border-white dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-transparent via-blue-500/5 to-[#eab308]/5 opacity-50 pointer-events-none" />

          <div className="flex flex-col gap-3 relative z-10">
            <button
              onClick={() => navigate('/empleado/venta-rapida')}
              className="group/back flex items-center gap-2 text-slate-400 hover:text-[#1e3a5f] dark:hover:text-amber-400 transition-all w-fit"
            >
              <div className="p-1.5 rounded-xl border border-slate-100 dark:border-white/10 group-hover/back:bg-[#1e3a5f] group-hover/back:text-white transition-all">
                <ArrowLeft className="w-3 h-3" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Cerrar Configuración</span>
            </button>
            <div className="mt-1">
                <h1 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tighter leading-none">
                  Gestión de <span className="italic text-[#eab308]">Terminal</span>
                </h1>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-medium italic max-w-lg leading-relaxed">Configuración de botonera rápida — compartida por todos los empleados.</p>
            </div>
          </div>

          <button
            onClick={handleCreateTemplate}
            disabled={creating}
            className="relative z-10 flex items-center gap-4 px-6 py-4 bg-[#1e3a5f] dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.03] active:scale-95 shadow-xl transition-all group overflow-hidden disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
            Añadir Plantilla
          </button>
        </header>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">

        {/* ── SIDEBAR: MASTER LIST ── */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                  <div className="size-2 bg-[#eab308] rounded-full animate-pulse" />
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Bibliotecas Disponibles</h3>
              </div>
              <span className="text-[10px] font-black text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{templates.length}</span>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {templates.map((t, idx) => (
              <motion.div
                key={t.id}
                layoutId={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setEditingTemplate(t)}
                className={`group p-6 cursor-pointer border-2 transition-all relative overflow-hidden rounded-2xl ${
                  editingTemplate?.id === t.id
                  ? 'bg-white dark:bg-slate-800 border-[#1e3a5f] shadow-lg shadow-blue-950/5 scale-[1.01]'
                  : 'bg-white/40 dark:bg-slate-900/20 border-slate-50 dark:border-white/5 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-6 relative z-10">
                    <div className={`p-3 rounded-xl transition-all duration-700 shadow-md ${
                        editingTemplate?.id === t.id ? 'bg-[#1e3a5f] text-white rotate-6 scale-105' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'
                    }`}>
                        {renderIcon(t.icon, "w-5 h-5")}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-bold text-[#1e3a5f] dark:text-white truncate text-base leading-none">{t.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                            <Layers className="w-3 h-3 text-amber-500" />
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">{t.items.length} Componentes</p>
                        </div>
                    </div>
                    <button
                        onClick={(e) => handleDeleteTemplate(t.id, e)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </motion.div>
            ))}

            {templates.length === 0 && (
                <div className="p-16 border-4 border-dashed border-slate-100 dark:border-white/5 rounded-[4rem] text-center space-y-6">
                    <div className="size-20 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                        <Layout className="w-10 h-10 text-slate-200" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] leading-relaxed">Laboratorio Vacío</p>
                        <p className="text-[10px] text-slate-300 mt-2 font-medium italic">Inicia creando una nueva composición de botones.</p>
                    </div>
                </div>
            )}
          </div>
        </aside>

        {/* ── MAIN: STUDIO EDITOR ── */}
        <div className="lg:col-span-8 flex flex-col">
          <AnimatePresence mode="wait">
            {!editingTemplate ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white/40 dark:bg-white/5 backdrop-blur-xl p-32 rounded-[4rem] flex-1 flex flex-col items-center justify-center text-center border-4 border-dashed border-slate-50 dark:border-white/5 min-h-[600px]"
              >
                <div className="relative mb-12">
                    <div className="size-32 bg-white dark:bg-slate-900 rounded-[3rem] flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-2xl scale-125 -rotate-12 transition-transform hover:rotate-0 duration-700" />
                    <Settings className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-[#eab308]/20 dark:text-amber-500/10 animate-[spin_15s_linear_infinite]" />
                    <MousePointer2 className="absolute -bottom-4 -right-4 w-10 h-10 text-[#1e3a5f] dark:text-blue-400 animate-bounce" />
                </div>
                <h3 className="text-4xl font-serif font-bold text-slate-300 dark:text-slate-700 mb-4 tracking-tighter">Estudio de Edición</h3>
                <p className="text-sm text-slate-400 dark:text-slate-600 font-medium italic max-w-sm mx-auto leading-relaxed">Selecciona una arquitectura del listado izquierdo para modificar sus parámetros y despliegue visual.</p>
              </motion.div>
            ) : (
              <motion.div
                key={editingTemplate.id}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                className="bg-white dark:bg-slate-800/40 backdrop-blur-3xl rounded-[2.5rem] shadow-sm border border-white dark:border-white/5 overflow-hidden transition-all flex-1 flex flex-col"
              >
                {/* Editor Header */}
                <div className="p-8 md:p-10 border-b border-slate-50 dark:border-white/5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-900/40 relative">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1e3a5f]" />

                  <div className="flex-1 space-y-4 w-full">
                      <div className="flex items-center gap-4 w-full">
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl text-[#eab308] shadow-md">
                            <Palette className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                              <input
                                type="text"
                                value={editingTemplate.name}
                                onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                placeholder="Nombre de la Plantilla"
                                className="bg-transparent border-none p-0 focus:ring-0 text-2xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tight w-full"
                              />
                          </div>
                      </div>
                      <div className="flex items-center gap-3 px-1 w-full">
                          <Edit3 className="w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={editingTemplate.description}
                            onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                            placeholder="Descripción de la botonera..."
                            className="bg-transparent border-none p-0 focus:ring-0 text-sm text-slate-500 dark:text-slate-400 font-medium italic w-full"
                          />
                      </div>
                  </div>

                  <button
                    onClick={saveEditChanges}
                    disabled={saving}
                    className="flex items-center justify-center gap-3 px-6 py-3 bg-[#1e3a5f] dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>

                {/* Grid Configuration */}
                <div className="p-8 md:p-10 space-y-8 flex-1">
                  <div className="flex items-end justify-between border-b border-slate-100 dark:border-white/5 pb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3 text-rose-500" />
                            <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Componentes POS</h5>
                        </div>
                        <p className="text-xs text-slate-500 italic">{editingTemplate.items.length} artículos</p>
                    </div>
                    <button
                      onClick={handleOpenProductsModal}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 dark:border-emerald-500/20 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Nueva Acción
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {editingTemplate.items.map((item) => {
                       const colorData = COLOR_OPTIONS.find(c => c.id === item.color) || COLOR_OPTIONS[0];
                       return (
                        <motion.div
                          key={item.id}
                          className="group/card p-4 bg-white dark:bg-slate-900/60 shadow-sm border border-slate-50 dark:border-white/5 rounded-2xl transition-all flex flex-col lg:flex-row items-center gap-6 hover:shadow-xl"
                        >
                          {/* ── LIVE PREVIEW ── */}
                          <div className="flex-shrink-0">
                             <div className={`w-20 h-20 rounded-xl ${colorData.light} ${colorData.text} flex flex-col items-center justify-center p-2 text-center border shadow-sm`}>
                                {renderIcon(item.icon, "w-5 h-5")}
                                <span className="text-[7px] font-black uppercase tracking-tight leading-none mt-2 break-words w-full">{item.name || '...'}</span>
                                <span className="text-[9px] font-bold mt-1">${item.price}</span>
                             </div>
                          </div>

                          {/* ── CONFIGURATION FIELDS ── */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-1.5 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                                    {ICON_MAP_OPTIONS.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => updateItem(item.id, 'icon', opt.id)}
                                            className={`p-2 rounded-lg transition-all ${item.icon === opt.id ? 'bg-[#1e3a5f] text-white' : 'hover:bg-white text-slate-400'}`}
                                        >
                                            {React.cloneElement(opt.icon as React.ReactElement, { className: 'w-4 h-4' })}
                                        </button>
                                    ))}
                                </div>
                                <div className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl flex items-center gap-2">
                                    <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-xs font-bold dark:text-white truncate">{item.name}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Precio catálogo</span>
                                    <span className="text-sm font-black text-slate-700 dark:text-white">${item.price.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl h-[42px]">
                                    {COLOR_OPTIONS.map(color => (
                                        <button
                                            key={color.id}
                                            onClick={() => updateItem(item.id, 'color', color.id)}
                                            className={`size-6 rounded-full border-2 ${item.color === color.id ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-60'} ${color.bg}`}
                                        />
                                    ))}
                                </div>
                            </div>
                          </div>

                          {/* ── CARD ACTIONS ── */}
                          <div className="flex lg:flex-col items-center gap-2 lg:pl-4 lg:border-l border-slate-100 dark:border-white/5 w-full lg:w-auto">
                              <button
                                onClick={() => removeItemFromEdit(item.id)}
                                className="p-2 bg-rose-50 text-rose-200 hover:text-rose-500 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                        </motion.div>
                       );
                    })}

                    {editingTemplate.items.length === 0 && (
                      <div className="py-24 text-center border-4 border-dashed border-slate-50 dark:border-white/5 rounded-[4rem] bg-slate-50/20 backdrop-blur-sm">
                        <div className="size-20 bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <Plus className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-sm text-slate-400 font-black uppercase tracking-[0.3em]">Botonera Deshabitada</p>
                        <p className="text-[10px] text-slate-400/60 font-medium italic mt-3 max-w-[200px] mx-auto">No hay herramientas de venta configuradas para este panel maestro.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Editor Footer Info */}
                <div className="p-8 md:p-10 bg-white dark:bg-[#0b1624] border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-start gap-4 max-w-xl">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-2xl">
                        <Info className="w-6 h-6 text-[#1e3a5f]" />
                    </div>
                    <div>
                      <h6 className="text-[9px] font-black text-[#1e3a5f] uppercase tracking-[0.3em] mb-1">Información de Despliegue</h6>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">Los cambios sincronizados se aplicarán instantáneamente a todas las terminales de Venta Rápida.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal Agregar Productos del Catálogo */}
      <AnimatePresence>
        {showProductsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProductsModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/5 w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-white">Agregar desde Catálogo</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Selecciona productos para agregar a tu plantilla</p>
                </div>
                <button
                  onClick={() => setShowProductsModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-white/5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchProducts}
                    onChange={(e) => setSearchProducts(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingProducts ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                      <p className="text-slate-500">Cargando productos...</p>
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500">No se encontraron productos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProducts.map((product) => (
                      <motion.button
                        key={product.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddProductFromCatalog(product)}
                        className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all text-left group"
                      >
                        <div className="w-full h-20 bg-slate-100 dark:bg-slate-800 rounded-lg mb-3 flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                          {product.nombre || product.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {product.descripcion || product.description || 'Sin descripción'}
                        </p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-2">
                          ${(product.precioBase ?? product.precio ?? product.price ?? 0).toFixed(2)}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
