import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  PlusCircle,
  Truck,
  ClipboardList,
  Bell,
  LogOut,
  X,
  AlertCircle,
  PanelLeftClose,
  Settings,
  Package,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeLayoutProps {
  children: React.ReactNode;
  user: any;
}

export default function EmployeeLayout({ children, user }: EmployeeLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('usuario');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const isActive = (path: string) => location.pathname === path;

  const Label = ({ children: text }: { children: string }) => (
    <AnimatePresence initial={false}>
      {isSidebarOpen && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.18 }}
          className="whitespace-nowrap overflow-hidden"
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  );

  const linkCls = (active: boolean) =>
    `flex items-center rounded-xl text-sm font-semibold transition-all duration-200 py-3 ${
      isSidebarOpen ? "px-4 gap-3" : "justify-center px-0"
    } ${
      active 
        ? "bg-white dark:bg-blue-600 text-[#1e3a5f] dark:text-white shadow-lg shadow-white/10 dark:shadow-blue-500/20 scale-[1.02]" 
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0a0f14] transition-colors relative">
      {/* ── Background Pattern ── */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.02] pointer-events-none transition-opacity"
        style={{ 
          backgroundImage: 'url("/botanical-bg.png")',
          backgroundSize: '450px',
          backgroundRepeat: 'repeat'
        }}
      />

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0, width: isSidebarOpen ? 256 : 72 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="bg-[#1e3a5f] dark:bg-[#0b1624] border-r border-[#1e3a5f]/20 dark:border-white/5 shadow-2xl flex flex-col flex-shrink-0 z-20 overflow-hidden transition-colors relative"
      >
        {/* Sidebar background overlay */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        {/* Logo Section */}
        <div className="h-16 flex items-center px-[18px] border-b border-white/10 overflow-hidden relative z-10">
          <Link to="/empleado/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src="/Logo.png"
                alt="Logo"
                className="w-7 h-7 object-contain relative z-10"
              />
              <div className="absolute inset-0 bg-[#eab308] blur-lg opacity-40 animate-pulse" />
            </div>
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-serif font-bold text-lg whitespace-nowrap"
                >
                  <span className="text-white">Florería </span>
                  <span className="text-[#eab308]">Bautista</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav Section */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar relative z-10">
          <Link to="/empleado/dashboard" className={linkCls(isActive('/empleado/dashboard'))}>
            <Home className="w-5 h-5 flex-shrink-0" />
            <Label>Inicio</Label>
          </Link>

          <Link to="/empleado/pedidos" className={linkCls(isActive('/empleado/pedidos'))}>
            <ShoppingBag className="w-5 h-5 flex-shrink-0" />
            <Label>Pedidos</Label>
          </Link>

          <Link to="/empleado/venta-rapida" className={linkCls(isActive('/empleado/venta-rapida'))}>
            <PlusCircle className="w-5 h-5 flex-shrink-0" />
            <Label>Venta Rápida</Label>
          </Link>

          <Link to="/empleado/registrar-pedido" className={linkCls(isActive('/empleado/registrar-pedido'))}>
            <ClipboardList className="w-5 h-5 flex-shrink-0" />
            <Label>Pedido Físico</Label>
          </Link>

          <Link to="/empleado/entregas" className={linkCls(isActive('/empleado/entregas'))}>
            <Truck className="w-5 h-5 flex-shrink-0" />
            <Label>Entregas</Label>
          </Link>

          <Link to="/empleado/inventario" className={linkCls(isActive('/empleado/inventario'))}>
            <Package className="w-5 h-5 flex-shrink-0" />
            <Label>Inventario</Label>
          </Link>

          <div className="py-6">
            <AnimatePresence initial={false} mode="wait">
              {isSidebarOpen ? (
                <motion.p key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  className="px-3 text-[10px] font-black text-white/30 uppercase tracking-[0.25em] mb-3">
                  Administración
                </motion.p>
              ) : (
                <motion.div key="line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-white/10 mx-2 mb-6" />
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/notificaciones"
            className={linkCls(isActive('/notificaciones'))}
          >
            <div className={`relative ${!isSidebarOpen ? 'flex justify-center' : ''}`}>
              <Bell className="w-5 h-5 flex-shrink-0" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#eab308] text-[#1e3a5f] text-[10px] font-black px-1.5 rounded-full shadow-lg border border-[#1e3a5f]/50">3</span>
            </div>
            <Label>Notificaciones</Label>
          </Link>

          <Link
            to="/empleado/configuracion"
            className={linkCls(isActive('/empleado/configuracion'))}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <Label>Configuración</Label>
          </Link>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl text-sm font-bold transition-all duration-200 text-rose-300 elements hover:bg-rose-500/10 hover:text-rose-400 py-3 mt-8 ${
              isSidebarOpen ? "px-4 gap-3" : "justify-center px-0"
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <Label>Cerrar Sesión</Label>
          </button>
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3 border-t border-white/10 relative z-10">
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            className={`w-full flex items-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all shadow-inner shadow-black/20 ${
              isSidebarOpen ? "gap-3" : "justify-center"
            }`}
          >
            <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
              <PanelLeftClose className="w-5 h-5 flex-shrink-0" />
            </motion.div>
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="text-[10px] font-black uppercase tracking-widest">
                  Minimizar
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top Navbar */}
        <header className="h-16 bg-white/95 dark:bg-[#0b1624]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 md:px-10 flex-shrink-0 z-10 transition-colors">
          <div className="flex flex-col">
            <h2 className="text-lg font-serif font-bold text-[#1e3a5f] dark:text-white leading-none">
              Panel de ventas
            </h2>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#1e3a5f] dark:text-slate-100">
                  {user?.nombre ?? user?.name ?? "Colaborador"}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {user?.role || "Ventas"}
                    </p>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-[#eab308] rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                <img
                  alt="User Profile"
                  className="w-9 h-9 rounded-xl object-cover border-2 border-white dark:border-[#1e3a5f] shadow-2xl relative z-10 transition-transform group-hover:scale-105"
                  src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCzCV9ts9T2_K_tTgV_0M_ZYJNV9mEnhkvGa7qDtXK2aPuNsu_56CyYvy6dBZL7_g7ftd1Hwz23LsnXWReDheXL-sawX0VvmltjhVX1XeJxtrXUSmvbHQvY7ps3PlOTD2aUy9bWQUk18JMOZylHTwPZUZ8MSBs-3cs_bwBMoo0cJMgNtxURHFmsiv4P29gdI8oMt_9iPJlJ0pg7DM96BDRyAHa1W--Xw6OuuMSL8o7NU8hRJVBd2u4Azto9MI7OTcdu-tS4AsmJJ8IH"}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Global Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 custom-scrollbar transition-colors relative">
          {/* Status Notifications */}
          <AnimatePresence>
            {showError && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-6 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-50 px-4"
              >
                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 p-5 rounded-3xl shadow-2xl flex items-center justify-between backdrop-blur-2xl">
                  <div className="flex items-center">
                    <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center mr-4 shadow-xl shadow-rose-500/30">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-900 dark:text-white font-black uppercase tracking-tight">Incidencia de Sistema</p>
                        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium italic mt-0.5">Error al sincronizar con el backend central.</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-rose-500 transition-colors" onClick={() => setShowError(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sub-page Render Area */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="min-h-full flex flex-col w-full relative z-10"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
