import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Bell,
  Shield,
  ChevronRight,
  RefreshCw,
  Moon,
  Sun,
  Camera,
  User,
  Smartphone,
  CheckCircle2,
  ShoppingBag,
  ClipboardList,
  Package,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const inputClass =
  'w-full px-5 py-4 text-sm border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#1e3a5f]/10 focus:border-[#1e3a5f] bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 transition-all font-bold';

const labelClass = 'block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-2';

export default function EmployeeSettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading]             = useState(true);
  const [isDarkMode, setIsDarkMode]       = useState(false);
  const [user, setUser]                   = useState<any>(null);

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = localStorage.getItem('usuario') || localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Check dark mode state from document
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    // Simulate loading for premium feel
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const sections = [
    { id: 'profile',       label: 'Identidad Corporativa', icon: User,          accent: 'blue' },
    { id: 'appearance',    label: 'Espacio Visual',      icon: Monitor,       accent: 'amber' },
    { id: 'notifications', label: 'Alertas Operativas',    icon: Bell,          accent: 'blue'   },
    { id: 'security',      label: 'Acceso y Seguridad',   icon: Shield,        accent: 'rose'    },
  ];

  const getAccentCls = (accent: string, active: boolean) => {
    if (!active) return 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-blue-500/5 hover:text-[#1e3a5f]';
    
    switch(accent) {
      case 'blue':    return 'bg-[#1e3a5f] text-white shadow-2xl shadow-blue-900/20 scale-[1.02] border border-white/10';
      case 'amber':   return 'bg-[#eab308] text-[#1e3a5f] shadow-2xl shadow-amber-500/20 scale-[1.02] border border-white/10';
      case 'rose':    return 'bg-rose-600 text-white shadow-2xl shadow-rose-900/20 scale-[1.02] border border-white/10';
      default:        return 'bg-slate-800 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-6">
            <div className="relative">
                <div className="size-20 rounded-[2.5rem] bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 flex items-center justify-center shadow-xl">
                    <RefreshCw className="w-8 h-8 text-[#1e3a5f] animate-spin" />
                </div>
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 animate-pulse" />
            </div>
            <div className="text-center space-y-3">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Sincronizando Terminal</p>
                <div className="flex gap-1.5 justify-center">
                    <div className="size-1.5 rounded-full bg-[#1e3a5f] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="size-1.5 rounded-full bg-[#eab308] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="size-1.5 rounded-full bg-[#1e3a5f] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
      </div>
    );
  }

  const cardCls = "bg-white/95 dark:bg-slate-800/40 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[3.5rem] shadow-sm transition-all overflow-hidden";

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 pb-20 p-4 md:p-2">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tight leading-none">
            Perfil & <span className="text-[#eab308] italic">Ajustes</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium italic leading-none">"Configura tu entorno de trabajo para florecer en cada jornada."</p>
        </div>
      </div>

      {/* ── Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sidebar nav */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm p-4 space-y-2.5 transition-colors">
            {sections.map(({ id, label, icon: Icon, accent }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-black transition-all duration-500 group ${getAccentCls(accent, id === activeSection)}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl transition-all duration-500 ${id === activeSection ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-900 group-hover:bg-white shadow-sm'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="uppercase tracking-[0.2em] text-[9px] font-black">{label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-all duration-500 ${id === activeSection ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`} />
              </button>
            ))}
          </div>
          
          <div className="p-10 bg-[#1e3a5f] rounded-[3rem] text-white relative overflow-hidden group shadow-2xl shadow-blue-900/20">
              <div className="absolute -bottom-8 -right-8 p-4 opacity-[0.05] group-hover:scale-125 group-hover:-rotate-12 transition-all duration-1000">
                  <Smartphone className="w-48 h-48" />
              </div>
              <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                      <div className="size-2.5 rounded-full bg-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                      <p className="text-[10px] font-black text-[#eab308] uppercase tracking-[0.4em]">Log de Acceso</p>
                  </div>
                  <div>
                      <h4 className="text-xl font-serif font-bold tracking-tight leading-tight uppercase">{user?.nombre?.split(' ')[0] ?? 'Staff'}</h4>
                      <p className="text-[10px] text-blue-300/60 mt-2 uppercase font-black tracking-widest leading-none">POS Terminal ID: FBTL-001</p>
                  </div>
                  <div className="pt-2">
                       <div className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl inline-flex items-center gap-3">
                           <Shield className="w-4 h-4 text-[#eab308]" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-blue-100">Sesión Blindada</span>
                       </div>
                  </div>
              </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">

            {/* ── Mi Perfil ── */}
            {activeSection === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}
                className={cardCls}>
                <div className="p-10 space-y-12">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        <div className="size-32 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 p-2 border-2 border-dashed border-[#eab308]/30 cursor-pointer overflow-hidden shadow-inner">
                            <img 
                                src={user?.photoURL || "https://ui-avatars.com/api/?name=" + (user?.nombre || "User") + "&background=1e3a5f&color=fff&size=256&font-size=0.33&bold=true"} 
                                alt="Profile" 
                                className="w-full h-full rounded-[2rem] object-cover shadow-2xl transition-transform duration-1000 group-hover:scale-125"
                            />
                        </div>
                        <button className="absolute -bottom-1 -right-1 size-10 bg-[#1e3a5f] text-white rounded-xl flex items-center justify-center shadow-2xl shadow-blue-900/40 hover:bg-[#eab308] hover:text-[#1e3a5f] hover:scale-110 hover:-rotate-6 transition-all border-2 border-white dark:border-slate-800">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="inline-flex px-5 py-2 bg-blue-50 dark:bg-blue-500/10 text-[#1e3a5f] dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-white/5 items-center gap-3">
                            <User className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] leading-none mt-0.5">Ficha de Colaborador</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tighter uppercase">{user?.nombre ?? user?.name ?? "Cargando..."}</h2>
                        <div className="flex items-center justify-center md:justify-start gap-3 text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest">
                            <div className="w-2 h-2 bg-[#eab308] rounded-full animate-pulse" />
                            <span>{user?.email ?? "staff@floreriabautista.com"}</span>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-50 dark:border-white/5 pt-12">
                    <div className="space-y-10">
                        <div>
                            <label className={labelClass}>Nombre Institucional</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                    <User className="w-4 h-4 text-slate-400 group-focus-within:text-[#1e3a5f] transition-colors" />
                                </div>
                                <input type="text" readOnly value={user?.nombre ?? user?.name ?? ""} className={`${inputClass} pl-16 bg-slate-50/50 dark:bg-slate-900/50 border-transparent cursor-default focus:ring-0 uppercase font-serif`} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Clave Identificadora POS</label>
                            <input type="text" readOnly value={user?.uid?.substring(0, 18).toUpperCase() || "ID-INTERNO-FB"} className={`${inputClass} bg-slate-50/50 dark:bg-slate-900/50 border-transparent text-[11px] tracking-[0.4em] font-black uppercase text-slate-400 focus:ring-0`} />
                        </div>
                    </div>
                    <div className="space-y-10">
                        <div>
                            <label className={labelClass}>Jurisdicción Administrativa</label>
                            <div className="flex items-center gap-6 p-6 bg-[#f8fafc] dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-inner relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 transition-transform duration-1000 group-hover:scale-150" />
                                <div className="p-4 bg-[#1e3a5f] text-white rounded-xl shadow-2xl shadow-blue-900/20 relative z-10 group-hover:rotate-12 transition-transform">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-[#1e3a5f] dark:text-blue-400 uppercase tracking-[0.3em] leading-none">{user?.role ?? "Operación Boutique"}</p>
                                    <p className="text-[11px] text-slate-500 mt-2 font-medium italic leading-relaxed">Privilegios activos para gestión de catálogo estacional y ventas en terminal.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-amber-50/50 dark:bg-amber-500/5 rounded-[2.5rem] border border-amber-100/50 dark:border-amber-500/10">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertCircle className="w-5 h-5 text-[#eab308]" />
                                <span className="text-[10px] font-black uppercase text-[#eab308] tracking-widest">Aviso de Tratamiento</span>
                            </div>
                            <p className="text-[11px] text-[#1e3a5f]/60 dark:text-blue-200/40 font-medium leading-relaxed italic">
                                "Su información es resguardada bajo los más altos estándares botánicos de privacidad. Cualquier cambio estructural requiere visado de gerencia."
                            </p>
                        </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Apariencia ── */}
            {activeSection === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}
                className={cardCls + " p-12"}>
                <div className="max-w-2xl mx-auto space-y-12">
                   <div className="text-center space-y-4 px-4">
                       <h3 className="text-4xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tighter uppercase">Atmósfera Visual</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto italic">"Ajuste el matiz de su terminal según el espíritu de la jornada."</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-10">
                        <button 
                            onClick={() => toggleDarkMode(false)} 
                            className={`group p-12 rounded-[4rem] border-2 transition-all duration-700 flex flex-col items-center gap-8 relative overflow-hidden ${!isDarkMode ? 'border-[#eab308] bg-amber-50/30 shadow-2xl shadow-amber-500/10' : 'border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 grayscale opacity-40 hover:grayscale-0 hover:opacity-100'}`}
                        >
                            {!isDarkMode && <div className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-full" />}
                            <div className={`size-24 rounded-[3rem] flex items-center justify-center transition-all duration-700 shadow-2xl relative z-10 ${!isDarkMode ? 'bg-[#eab308] text-[#1e3a5f] rotate-12 scale-110 shadow-amber-500/20' : 'bg-white text-slate-200'}`}>
                                <Sun className="w-12 h-12" />
                            </div>
                            <div className="relative z-10 text-center">
                                <span className={`text-[11px] font-black uppercase tracking-[0.4em] transition-colors ${!isDarkMode ? 'text-[#1e3a5f]' : 'text-slate-400'}`}>Estilo Solar</span>
                                <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-widest opacity-60">Claridad Absoluta</p>
                            </div>
                        </button>
                        
                        <button 
                            onClick={() => toggleDarkMode(true)} 
                            className={`group p-12 rounded-[4rem] border-2 transition-all duration-700 flex flex-col items-center gap-8 relative overflow-hidden ${isDarkMode ? 'border-[#1e3a5f] bg-blue-500/10 shadow-2xl shadow-blue-900/20' : 'border-slate-50 bg-slate-50/50 grayscale opacity-40 hover:grayscale-0 hover:opacity-100'}`}
                        >
                            {isDarkMode && <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />}
                            <div className={`size-24 rounded-[3rem] flex items-center justify-center transition-all duration-700 shadow-2xl relative z-10 ${isDarkMode ? 'bg-[#1e3a5f] text-white -rotate-12 scale-110 shadow-blue-900/40' : 'bg-white text-slate-200'}`}>
                                <Moon className="w-12 h-12" />
                            </div>
                            <div className="relative z-10 text-center">
                                <span className={`text-[11px] font-black uppercase tracking-[0.4em] transition-colors ${isDarkMode ? 'text-blue-400' : 'text-slate-400'}`}>Matiz Nocturno</span>
                                <p className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-widest opacity-60">Confort Profundo</p>
                            </div>
                        </button>
                   </div>
                   
                   <div className="p-10 bg-[#f8fafc] dark:bg-slate-900/80 rounded-[3rem] border border-slate-100 dark:border-white/5 flex items-start gap-8 relative group overflow-hidden shadow-inner">
                       <div className="shrink-0 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/5 transition-all duration-700 group-hover:rotate-180 group-hover:bg-[#1e3a5f] group-hover:text-white group-hover:scale-110">
                           <Monitor className="w-8 h-8" />
                       </div>
                       <div className="space-y-2">
                           <p className="text-xs text-[#1e3a5f] dark:text-blue-400 font-black uppercase tracking-[0.3em] mt-1">Persistencia de Entorno</p>
                           <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                               "Las preferencias visuales se vinculan a su identificador de terminal. La iluminación se mantendrá constante en cada inicio de sesión."
                           </p>
                       </div>
                   </div>
                </div>
              </motion.div>
            )}

            {/* ── Notificaciones ── */}
            {activeSection === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}
                className={cardCls}>
                <div className="p-12 border-b border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/20 flex justify-between items-center">
                    <div>
                        <h3 className="text-3xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tighter uppercase">Canales de Alerta</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-black uppercase tracking-[0.2em] opacity-80">Sincronización operativa en tiempo real</p>
                    </div>
                    <div className="p-5 bg-blue-50 dark:bg-blue-500/10 rounded-[2rem] border border-blue-100 dark:border-white/5 shadow-xl shadow-blue-500/5">
                        <Bell className="w-8 h-8 text-[#1e3a5f] animate-swing" />
                    </div>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-white/5">
                  {[
                    { id: 'orders',   label: 'Nuevas Órdenes POS',     desc: 'Señales acústicas y visuales ante cada entrada de pedido digital.', icon: ShoppingBag,  color: 'blue' },
                    { id: 'messages', label: 'Despachos Internos',   desc: 'Comunicados de logística, cambios en precios y notas corporativas.',     icon: ClipboardList, color: 'blue'    },
                    { id: 'stock',    label: 'Alertas de Almacén',   desc: 'Notificación inmediata cuando los insumos base desciendan del mínimo.',     icon: Package,       color: 'blue'    },
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between px-12 py-10 group hover:bg-slate-50/50 dark:hover:bg-blue-500/5 transition-all">
                      <div className="flex items-center gap-8">
                          <div className={`p-5 rounded-[2.5rem] bg-white dark:bg-slate-900 text-slate-300 border border-slate-100 dark:border-white/5 transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 group-hover:border-[#1e3a5f]/30 group-hover:bg-[#1e3a5f] group-hover:text-white shadow-sm shadow-black/5 relative overflow-hidden`}>
                              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <item.icon className="w-8 h-8 relative z-10" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-lg font-serif font-bold text-[#1e3a5f] dark:text-white uppercase tracking-tight leading-none">{item.label}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed max-w-sm italic tracking-tight">"{item.desc}"</p>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-10 group">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-20 h-10 bg-slate-100 dark:bg-slate-700 rounded-full peer peer-checked:bg-[#1e3a5f] after:content-[''] after:absolute after:top-1.5 after:left-1.5 after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:after:translate-x-10 after:shadow-2xl shadow-inner border border-transparent peer-checked:after:bg-[#eab308]" />
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Seguridad ── */}
            {activeSection === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}
                className={cardCls + " p-12"}>
                <div className="max-w-md mx-auto space-y-12">
                   <div className="text-center space-y-4 px-8">
                       <div className="size-24 bg-rose-50 dark:bg-rose-500/10 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-rose-100 dark:border-white/5 shadow-2xl shadow-rose-500/10 rotate-3 group hover:rotate-0 transition-transform duration-700">
                           <Shield className="w-12 h-12 text-rose-600 animate-pulse" />
                       </div>
                       <h3 className="text-4xl font-serif font-bold text-[#1e3a5f] dark:text-white tracking-tighter uppercase">Resguardo de Acceso</h3>
                       <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black leading-relaxed italic uppercase tracking-[0.3em]">Gestione sus llaves maestras con absoluta cautela.</p>
                   </div>
                   
                   <div className="space-y-10">
                    {[
                      { label: 'Llave Vigente (Actual)',  ph: '••••••••', icon: Shield },
                      { label: 'Nueva Signatura Digital',      ph: '••••••••', icon: PlusCircle },
                      { label: 'Validar Signatura',     ph: '••••••••', icon: CheckCircle2 },
                    ].map(({ label, ph, icon: Icon }) => (
                      <div key={label}>
                        <label className={labelClass}>{label}</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-rose-600 transition-all duration-500">
                                <Icon className="w-5 h-5" />
                            </div>
                            <input type="password" placeholder={ph} className={`${inputClass} pl-16 py-5 focus:ring-rose-500/10 focus:border-rose-600 shadow-inner`} />
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-6 bg-[#1e3a5f] hover:bg-[#eab308] hover:text-[#1e3a5f] hover:scale-[1.02] active:scale-[0.98] text-white rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all mt-8 shadow-2xl shadow-blue-900/20 border-t border-white/10">
                      Sincronizar Acceso
                    </button>
                    
                    <div className="text-center">
                        <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-600 transition-colors border-b border-transparent hover:border-rose-500 mt-4">¿Ha extraviado sus credenciales? Procedimiento Técnico</button>
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
