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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn, ScaleIn } from '../../components/Animations';
import { useToast } from '../../hooks/useToast';

/* ── Tipos ──────────────────────────────────────────────── */
type QuickItem = {
  id: string;
  name: string;
  price: number;
  icon: string;
  color: string;
  isSpecial?: boolean;
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

export default function QuickSaleTemplatesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<QuickTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<QuickTemplate | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('POS_TEMPLATES');
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      // Plantilla por defecto si no hay nada
      const defaultT: QuickTemplate = {
        id: 'basic',
        name: 'Plantilla Básica',
        description: 'Ventas de mostrador estándar',
        icon: 'Sparkles',
        items: [
          { id: '1', name: 'Ramos básicos', price: 40, icon: 'Leaf', color: 'blue' },
          { id: '2', name: 'Ramos de rosas', price: 60, icon: 'Heart', color: 'rose' }
        ]
      };
      setTemplates([defaultT]);
      localStorage.setItem('POS_TEMPLATES', JSON.stringify([defaultT]));
    }
  }, []);

  const saveTemplatesToLocal = (newTemplates: QuickTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('POS_TEMPLATES', JSON.stringify(newTemplates));
  };

  const handleCreateTemplate = () => {
    const newTemplate: QuickTemplate = {
      id: `t-${Date.now()}`,
      name: 'Nueva Configuración',
      description: 'Define botones rápidos para una temporada o evento.',
      icon: 'Layout',
      items: [
        { id: `q-${Date.now()}`, name: 'Nuevo Producto', price: 100, icon: 'Sparkles', color: 'blue' }
      ]
    };
    const updated = [...templates, newTemplate];
    saveTemplatesToLocal(updated);
    setEditingTemplate(newTemplate);
    showToast('Nueva terminal de botones creada', 'success');
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Deseas eliminar permanentemente esta configuración?')) {
      const updated = templates.filter(t => t.id !== id);
      saveTemplatesToLocal(updated);
      if (editingTemplate?.id === id) setEditingTemplate(null);
      showToast('Configuración eliminada correctamente', 'info');
    }
  };

  const updateItem = (itemId: string, field: keyof QuickItem, value: any) => {
    if (!editingTemplate) return;
    const newItems = editingTemplate.items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setEditingTemplate({ ...editingTemplate, items: newItems });
  };

  const addItemToEdit = () => {
    if (!editingTemplate) return;
    const newItem: QuickItem = {
      id: `q-${Date.now()}`,
      name: 'Boton Rápido',
      price: 0,
      icon: 'Sparkles',
      color: 'blue'
    };
    setEditingTemplate({ 
      ...editingTemplate, 
      items: [...editingTemplate.items, newItem] 
    });
  };

  const removeItemFromEdit = (itemId: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      items: editingTemplate.items.filter(i => i.id !== itemId)
    });
  };

  const saveEditChanges = () => {
    if (!editingTemplate) return;
    const updated = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
    saveTemplatesToLocal(updated);
    showToast('Terminal sincronizada con el punto de venta', 'success');
  };

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
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-medium italic max-w-lg leading-relaxed">Configuración de botonera rápida.</p>
            </div>
          </div>

          <button 
            onClick={handleCreateTemplate}
            className="relative z-10 flex items-center gap-4 px-6 py-4 bg-[#1e3a5f] dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.03] active:scale-95 shadow-xl transition-all group overflow-hidden"
          >
            <PlusCircle className="w-5 h-5" />
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
                    className="flex items-center justify-center gap-3 px-6 py-3 bg-[#1e3a5f] dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Cambios
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
                        onClick={addItemToEdit} 
                        className="flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-500/10 text-[#1e3a5f] rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#1e3a5f] hover:text-white transition-all border border-blue-100 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Nuevo Botón
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {editingTemplate.items.map((item) => {
                       const colorData = COLOR_OPTIONS.find(c => c.id === item.color) || COLOR_OPTIONS[0];
                       return (
                        <motion.div 
                          key={item.id} 
                          className={`group/card p-4 bg-white dark:bg-slate-900/60 shadow-sm border rounded-2xl transition-all flex flex-col lg:flex-row items-center gap-6 hover:shadow-xl ${hoveredItem === item.id ? 'border-blue-200' : 'border-slate-50 dark:border-white/5'}`}
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
                                <input 
                                    type="text" 
                                    value={item.name} 
                                    onChange={e => updateItem(item.id, 'name', e.target.value)}
                                    placeholder="Nombre Botón"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none px-4 py-3 rounded-xl text-xs font-bold dark:text-white uppercase tracking-tight" 
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                    <input 
                                        type="number" 
                                        value={item.price} 
                                        onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none pl-10 pr-4 py-3 rounded-xl text-xs font-black dark:text-white" 
                                    />
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
                          <div className="flex lg:flex-col items-center gap-2 lg:pl-4 lg:border-l border-slate-100 w-full lg:w-auto">
                              <button 
                                  onClick={() => updateItem(item.id, 'isSpecial', !item.isSpecial)}
                                  className={`p-2 rounded-xl border transition-all ${item.isSpecial ? 'bg-amber-500 text-white' : 'bg-slate-50 text-slate-300'}`}
                                  title="Especial"
                              >
                                  <Sparkles className="w-4 h-4" />
                              </button>
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
    </div>
  );
}
