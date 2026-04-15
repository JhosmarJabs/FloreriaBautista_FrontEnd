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
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors">
      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -260 }}
        animate={{ x: 0, width: isSidebarOpen ? 256 : 72 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="bg-[#1e3a5f] dark:bg-[#0f172a] border-r border-black/30 dark:border-white/5 shadow-2xl flex flex-col flex-shrink-0 z-20 overflow-hidden transition-colors"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-[18px] border-b border-white/10 overflow-hidden">
          <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src="/Logo.png"
                alt="Logo"
                className="w-8 h-8 object-contain relative z-10"
              />
              <div className="absolute inset-0 bg-[#FBBF24] blur-lg opacity-20 animate-pulse" />
            </div>
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="font-bold text-lg whitespace-nowrap"
                >
                  <span className="text-white">Florería </span>
                  <span className="text-[#eab308]">Bautista</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar">
          <Link to="/dashboard" className={linkCls(isActive('/dashboard'))}>
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

          <div className="py-3">
            <AnimatePresence initial={false} mode="wait">
              {isSidebarOpen ? (
                <motion.p key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Sistema
                </motion.p>
              ) : (
                <motion.div key="line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-white/10 mx-2" />
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/notificaciones"
            className={linkCls(isActive('/notificaciones'))}
          >
            <div className={`relative ${!isSidebarOpen ? 'flex justify-center' : ''}`}>
              <Bell className="w-5 h-5 flex-shrink-0" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full shadow-sm">3</span>
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
            className={`w-full flex items-center rounded-xl text-sm font-medium transition-colors duration-150 text-red-400 hover:bg-red-900/20 py-2.5 mt-4 ${
              isSidebarOpen ? "px-3 gap-3" : "justify-center px-0"
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <Label>Cerrar Sesión</Label>
          </button>
        </nav>

        {/* Collapse button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            className={`w-full flex items-center p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all ${
              isSidebarOpen ? "gap-3" : "justify-center"
            }`}
          >
            <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
              <PanelLeftClose className="w-6 h-6 flex-shrink-0" />
            </motion.div>
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="text-xs font-bold uppercase tracking-wider">
                  Contraer Menú
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopNavbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-8 flex-shrink-0 z-10 transition-colors">
          <div>
            <h2 className="text-lg font-bold text-[#1e3a5f] dark:text-white">
              Panel de Ventas
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button
              className="relative p-2 text-gray-400 hover:text-[#1e3a5f] dark:hover:text-white transition-colors"
            >
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-[#1e3a5f] dark:text-slate-200">
                  {user?.nombre ?? user?.name ?? "Empleado"}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 capitalize">
                  {user?.role || "Vendedor"}
                </p>
              </div>
              <div className="relative">
                <img
                  alt="User Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                  src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCzCV9ts9T2_K_tTgV_0M_ZYJNV9mEnhkvGa7qDtXK2aPuNsu_56CyYvy6dBZL7_g7ftd1Hwz23LsnXWReDheXL-sawX0VvmltjhVX1XeJxtrXUSmvbHQvY7ps3PlOTD2aUy9bWQUk18JMOZylHTwPZUZ8MSBs-3cs_bwBMoo0cJMgNtxURHFmsiv4P29gdI8oMt_9iPJlJ0pg7DM96BDRyAHa1W--Xw6OuuMSL8o7NU8hRJVBd2u4Azto9MI7OTcdu-tS4AsmJJ8IH"}
                />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900" />
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-900 p-4 md:p-6 lg:p-8 custom-scrollbar transition-colors relative">
          {/* Error Banner */}
          <AnimatePresence>
            {showError && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-lg z-50 px-4"
              >
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md shadow-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">Error al cargar datos. Por favor, reintente.</p>
                  </div>
                  <button className="text-red-500 hover:text-red-700" onClick={() => setShowError(false)}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-full flex flex-col w-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
