import React, { useState, useEffect } from 'react';
import {
  Settings,
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn } from '../../components/Animations';

const inputClass =
  'w-full px-5 py-3.5 text-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 transition-all font-bold';

const labelClass = 'block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1';

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
    setLoading(false);
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
    { id: 'profile',       label: 'Mi Perfil',           icon: User,          color: 'emerald' },
    { id: 'appearance',    label: 'Apariencia',          icon: Monitor,       color: 'blue'    },
    { id: 'notifications', label: 'Notificaciones',       icon: Bell,          color: 'amber'   },
    { id: 'security',      label: 'Seguridad',            icon: Shield,        color: 'rose'    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
            <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sincronizando preferencias...</p>
        </div>
      </div>
    );
  }

  const cardCls = "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-[2.5rem] shadow-sm transition-colors overflow-hidden";

  return (
    <div className="max-w-[1200px] mx-auto space-y-8">

      {/* ── Header ─────────────────────────────────── */}
      <FadeIn>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Ajustes de Terminal</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Panel de Usuario</h1>
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Gestiona tu identidad digital y preferencias de entorno.</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl border border-emerald-100 dark:border-emerald-500/20">
                <Settings className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
      </FadeIn>

      {/* ── Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 shadow-sm p-3 space-y-2 transition-colors">
            {sections.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-black transition-all group ${
                  id === activeSection
                    ? `bg-${color}-500 text-white shadow-xl shadow-${color}-500/20 scale-[1.02]`
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl transition-colors ${id === activeSection ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-900 group-hover:bg-white dark:group-hover:bg-slate-800 shadow-sm'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="uppercase tracking-widest text-[10px] font-black">{label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-all ${id === activeSection ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`} />
              </button>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-slate-900 dark:bg-slate-900 rounded-[2rem] border border-slate-800 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-20 h-20" />
              </div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Terminal Activa</p>
              <h4 className="text-base font-black tracking-tight leading-tight">Sesión Iniciada por {user?.nombre?.split(' ')[0] ?? 'Empleado'}</h4>
              <p className="text-[9px] text-slate-500 mt-2 uppercase font-bold tracking-tighter">ID Dispositivo: FB-TERM-042</p>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">

            {/* ── Mi Perfil ── */}
            {activeSection === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className={cardCls}>
                <div className="p-8 space-y-10">
                  <div className="flex flex-col sm:flex-row items-center gap-10">
                    <div className="relative">
                        <div className="size-32 rounded-[2.5rem] bg-emerald-50 dark:bg-emerald-500/10 p-2 border-2 border-dashed border-emerald-500/30">
                            <img 
                                src={user?.photoURL || "https://ui-avatars.com/api/?name=" + (user?.nombre || "User") + "&background=10b981&color=fff&size=128"} 
                                alt="Profile" 
                                className="w-full h-full rounded-[2rem] object-cover shadow-2xl"
                            />
                        </div>
                        <button className="absolute -bottom-2 -right-2 size-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-110 transition-transform">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-2">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl uppercase tracking-widest">Identidad de Colaborador</span>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{user?.nombre ?? user?.name ?? "Cargando..."}</h2>
                        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{user?.email ?? "sin_correo@floreria.com"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-50 dark:border-slate-700/50 pt-10">
                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>Nombre Legal en Sistema</label>
                            <div className="relative group">
                                <input type="text" readOnly value={user?.nombre ?? user?.name ?? ""} className={`${inputClass} bg-slate-50/50 dark:bg-slate-900/50 border-transparent cursor-default`} />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Identificador Único (UID)</label>
                            <input type="text" readOnly value={user?.uid?.substring(0, 12) + "..."} className={`${inputClass} bg-slate-50/50 dark:bg-slate-900/50 border-transparent text-[10px] tracking-widest uppercase`} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>Rango Asignado</label>
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest leading-none">{user?.role ?? "EMPLEADO_NIVEL_1"}</p>
                                    <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/50 mt-1 font-bold">Privilegios de Operación POS</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter italic px-1">
                            * Los datos de identidad son gestionados centralmente por administración para mantener la integridad de las nóminas.
                        </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Apariencia ── */}
            {activeSection === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className={cardCls + " p-10"}>
                <div className="max-w-xl mx-auto space-y-10">
                   <div className="text-center space-y-3">
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Personalización del Entorno</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-medium font-medium leading-relaxed">Adapta el brillo y contraste de la terminal según las condiciones de iluminación del local.</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-6">
                        <button onClick={() => toggleDarkMode(false)} className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${!isDarkMode ? 'border-emerald-500 bg-emerald-50/50 shadow-xl shadow-emerald-500/10' : 'border-slate-50 dark:border-slate-900 bg-slate-50 dark:bg-slate-900 active:scale-95'}`}>
                            <div className={`size-16 rounded-3xl flex items-center justify-center transition-colors shadow-lg ${!isDarkMode ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400'}`}>
                                <Sun className="w-8 h-8" />
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest transition-colors ${!isDarkMode ? 'text-emerald-700' : 'text-slate-400'}`}>Modo Solar</span>
                        </button>
                        
                        <button onClick={() => toggleDarkMode(true)} className={`p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${isDarkMode ? 'border-emerald-500 bg-emerald-500/10 shadow-xl shadow-emerald-500/10' : 'border-slate-50 bg-slate-50 active:scale-95'}`}>
                            <div className={`size-16 rounded-3xl flex items-center justify-center transition-colors shadow-lg ${isDarkMode ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-slate-900 text-slate-600'}`}>
                                <Moon className="w-8 h-8" />
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-emerald-400' : 'text-slate-500'}`}>Modo Lunar</span>
                        </button>
                   </div>
                   
                   <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                       <Monitor className="w-5 h-5 text-slate-400 mt-1 shrink-0" />
                       <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                           <span className="font-black text-slate-700 dark:text-slate-200">Sincronización Automática:</span> El sistema recordará tu preferencia en este navegador para futuras sesiones de venta.
                       </p>
                   </div>
                </div>
              </motion.div>
            )}

            {/* ── Notificaciones ── */}
            {activeSection === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className={cardCls}>
                <div className="p-8 border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Canales de Alerta</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Mantente al día con los eventos críticos del negocio.</p>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-700/30">
                  {[
                    { id: 'orders',   label: 'Nuevos Pedidos',         desc: 'Aviso inmediato al recibir una orden en el sistema POS.',   icon: Bell,    color: 'emerald' },
                    { id: 'messages', label: 'Mensajería Corporativa', desc: 'Notificaciones sobre actualizaciones del equipo y gerencia.', icon: User,    color: 'blue'    },
                    { id: 'stock',    label: 'Reposición Urgente',     desc: 'Alertas críticas cuando los insumos bajen del stock mínimo.',   icon: RefreshCw, color: 'rose'    },
                  ].map(item => (
                    <div key={item.id} className="flex items-center justify-between px-8 py-6 group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <div className="flex items-center gap-5">
                          <div className={`p-4 rounded-3xl bg-${item.color}-50 dark:bg-${item.color}-500/10 text-${item.color}-600 dark:text-${item.color}-400 border border-${item.color}-100 dark:border-${item.color}-500/20 transition-all group-hover:scale-110 shadow-sm`}>
                              <item.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium leading-relaxed max-w-sm">{item.desc}</p>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4 group">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-14 h-8 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-6 after:shadow-lg" />
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Security ── */}
            {activeSection === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className={cardCls + " p-10"}>
                <div className="max-w-md mx-auto space-y-10">
                   <div className="text-center space-y-3 px-6">
                       <div className="size-16 bg-rose-50 dark:bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100 dark:border-rose-500/20">
                           <Shield className="w-8 h-8 text-rose-500" />
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Protección de Llave</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Asegúrate de cambiar tus credenciales periódicamente para mayor seguridad.</p>
                   </div>
                   
                   <div className="space-y-6">
                    {[
                      { label: 'Contraseña Vigente',       ph: '••••••••' },
                      { label: 'Nueva Clave de Acceso',   ph: '••••••••' },
                      { label: 'Repetir Nueva Clave',      ph: '••••••••' },
                    ].map(({ label, ph }) => (
                      <div key={label}>
                        <label className={labelClass}>{label}</label>
                        <input type="password" placeholder={ph} className={inputClass} />
                      </div>
                    ))}
                    <button className="w-full py-4 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 hover:scale-[1.02] active:scale-[.98] text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all mt-4 shadow-xl shadow-emerald-500/10">
                      Actualizar Credenciales
                    </button>
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
